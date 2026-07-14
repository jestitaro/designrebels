// Helpers compartidos por las Cloudflare Pages Functions de /functions/api.
// No exponen nada sensible: sólo arman respuestas JSON y llevan la cuenta de
// uso diario del generador de posts en Cloudflare KV.

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonError(message, status = 500) {
  return json({ success: false, error: message }, status);
}

// ── Cuota diaria del generador de posts (demo de costo casi cero) ──────────
//
// Cuenta generaciones por IP y globales en el binding de KV DEMO_USAGE_KV,
// con una clave por día UTC. Las claves llevan expirationTtl para que KV las
// limpie solas — no hace falta un job de mantenimiento aparte.
export const DEMO_LIMITS = { perIp: 5, global: 30 };

const KV_KEY_TTL_SECONDS = 60 * 60 * 48; // 48h: sobrevive el día UTC completo con margen.

export function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function computeRemaining(ipCount, globalCount) {
  return Math.max(0, Math.min(DEMO_LIMITS.perIp - ipCount, DEMO_LIMITS.global - globalCount));
}

const NO_KV_WARNING = 'DEMO_USAGE_KV no está vinculado en este entorno — los límites de la demo no se están aplicando (esto sólo debería verse en desarrollo local).';

// Sólo lee el uso actual, no lo modifica. Usado para mostrar "te quedan N
// generaciones hoy" antes de que el usuario dispare una generación.
export async function peekQuota(env, ip) {
  if (!env.DEMO_USAGE_KV) {
    console.warn(NO_KV_WARNING);
    return { remaining: DEMO_LIMITS.perIp, devWarning: NO_KV_WARNING };
  }

  const day = todayUTC();
  const [ipCountRaw, globalCountRaw] = await Promise.all([
    env.DEMO_USAGE_KV.get(`ip:${day}:${ip}`),
    env.DEMO_USAGE_KV.get(`global:${day}`),
  ]);
  const ipCount = parseInt(ipCountRaw || '0', 10);
  const globalCount = parseInt(globalCountRaw || '0', 10);
  return { remaining: computeRemaining(ipCount, globalCount), ipCount, globalCount };
}

// Suma una generación al contador de hoy. Llamar sólo después de una
// generación exitosa (los errores del proveedor no deberían gastarle cuota
// al usuario).
export async function consumeQuota(env, ip) {
  if (!env.DEMO_USAGE_KV) {
    console.warn(NO_KV_WARNING);
    return { remaining: DEMO_LIMITS.perIp, devWarning: NO_KV_WARNING };
  }

  const day = todayUTC();
  const ipKey = `ip:${day}:${ip}`;
  const globalKey = `global:${day}`;

  const [ipCountRaw, globalCountRaw] = await Promise.all([
    env.DEMO_USAGE_KV.get(ipKey),
    env.DEMO_USAGE_KV.get(globalKey),
  ]);
  const ipCount = parseInt(ipCountRaw || '0', 10) + 1;
  const globalCount = parseInt(globalCountRaw || '0', 10) + 1;

  await Promise.all([
    env.DEMO_USAGE_KV.put(ipKey, String(ipCount), { expirationTtl: KV_KEY_TTL_SECONDS }),
    env.DEMO_USAGE_KV.put(globalKey, String(globalCount), { expirationTtl: KV_KEY_TTL_SECONDS }),
  ]);

  return { remaining: computeRemaining(ipCount, globalCount) };
}
