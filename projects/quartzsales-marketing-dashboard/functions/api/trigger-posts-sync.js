// Cloudflare Pages Function — dispara manualmente el sync semanal de posts
// de competidores (el workflow de GitHub Actions que corre scripts/sync.js
// con SYNC_POSTS=true), para que cualquiera del equipo pueda forzar una
// actualización sin necesitar acceso al repo de GitHub.
//
//   POST /api/trigger-posts-sync
//
// El token vive en GITHUB_SYNC_TOKEN (variable de entorno de Cloudflare
// Pages) y nunca llega al navegador — mismo patrón que ANTHROPIC_API_KEY en
// generate-script.js. Tiene que ser un Personal Access Token (fine-grained)
// con permiso de sólo "Actions: Read and write" sobre este repo — no usar
// un token con permisos amplios acá.
import { json, jsonError } from '../_utils.js';

const REPO_OWNER = 'jestitaro';
const REPO_NAME = 'designrebels';
const WORKFLOW_FILE = 'quartzsales-sync.yml';
const COOLDOWN_SECONDS = 10 * 60; // evita disparar corridas de más por clicks repetidos
const COOLDOWN_KV_KEY = 'trigger-posts-sync:last-run';

export async function onRequestPost(context) {
  const { env } = context;

  if (!env.GITHUB_SYNC_TOKEN) {
    return jsonError('Esta función no está configurada en este entorno todavía (falta GITHUB_SYNC_TOKEN). Ver README.', 500);
  }

  // El cooldown es best-effort: si no hay KV vinculado, igual dejamos
  // disparar (no queremos bloquear la función entera por eso).
  if (env.DEMO_USAGE_KV) {
    const lastRun = await env.DEMO_USAGE_KV.get(COOLDOWN_KV_KEY);
    if (lastRun) {
      const secondsAgo = Math.floor((Date.now() - new Date(lastRun).getTime()) / 1000);
      const remaining = COOLDOWN_SECONDS - secondsAgo;
      if (remaining > 0) {
        return jsonError(
          `Ya se disparó una actualización hace poco — esperá ${Math.ceil(remaining / 60)} minuto(s) y volvé a intentar.`,
          429
        );
      }
    }
  }

  let res;
  try {
    res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_SYNC_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'quartzsales-marketing-dashboard',
        },
        body: JSON.stringify({ ref: 'main', inputs: { posts: 'true' } }),
      }
    );
  } catch (err) {
    console.error('trigger-posts-sync: fetch a GitHub falló');
    return jsonError('No se pudo contactar a GitHub en este momento. Probá de nuevo en unos minutos.', 502);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`trigger-posts-sync: GitHub respondió status ${res.status}: ${body.slice(0, 300)}`);
    const message = res.status === 401 || res.status === 403
      ? 'El token de GitHub no tiene permisos suficientes o venció — revisar GITHUB_SYNC_TOKEN.'
      : 'No se pudo disparar la actualización en este momento.';
    return jsonError(message, 502);
  }

  if (env.DEMO_USAGE_KV) {
    await env.DEMO_USAGE_KV.put(COOLDOWN_KV_KEY, new Date().toISOString(), {
      expirationTtl: COOLDOWN_SECONDS + 60,
    });
  }

  return json({
    success: true,
    message: 'Actualización disparada. Puede tardar 1-2 minutos — después usá "Actualizar métricas" para ver el resultado.',
  });
}
