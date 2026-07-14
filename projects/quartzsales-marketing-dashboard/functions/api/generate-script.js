// Cloudflare Pages Function — generador de posts con IA, controlado para
// una demo de costo casi cero.
//
//   GET  /api/generate-script   -> cuántas generaciones quedan hoy (no gasta cuota)
//   POST /api/generate-script   -> genera un post (gasta cuota sólo si sale bien)
//
// La API key de Anthropic vive en ANTHROPIC_API_KEY (variable de entorno de
// Cloudflare Pages) y nunca llega al navegador. El prompt se arma acá adentro
// — el cliente sólo manda { topic, channel, format }.
import { json, jsonError, getClientIP, peekQuota, consumeQuota, DEMO_LIMITS } from '../_utils.js';

// Modelo económico por defecto: Haiku, la línea más barata de Claude. Se
// puede pisar con la env var ANTHROPIC_MODEL sin tocar código.
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const MAX_OUTPUT_TOKENS = 350; // corto a propósito: mantiene el costo por generación bajo.
const MAX_TOPIC_LENGTH = 300;

const ALLOWED_CHANNELS = ['linkedin', 'youtube'];
const FORMAT_DESCRIPTIONS = {
  post_corto: 'post corto de LinkedIn (~120 palabras)',
  post_largo: 'post de LinkedIn con storytelling breve (~220 palabras)',
  carrusel: 'carrusel de LinkedIn de 4 slides: Slide 1 (hook), Slides 2-3 (desarrollo), Slide 4 (CTA)',
  video_corto: 'guión breve para YouTube (~1 minuto) con secciones INTRO / DESARROLLO / CTA',
};

function buildPrompt(topic, channel, format) {
  const formatDescription = FORMAT_DESCRIPTIONS[format] || FORMAT_DESCRIPTIONS.post_corto;
  const channelCtx = channel === 'youtube'
    ? 'YouTube de QuartzSales / E-Saurio, retail y trade marketing en LATAM.'
    : 'LinkedIn de QuartzSales (SaaS de trade marketing y retail execution en LATAM), tono profesional y cercano para decisores de trade marketing y ventas en consumo masivo.';

  return `Generá un ${formatDescription} para ${channelCtx}

Tema: ${topic}

Reglas: español rioplatense (vos, no tú); hook en las primeras 2 líneas; foco en problemas reales de ejecución en PDV (quiebres de stock, visibilidad, gestión de campo); mencioná QuartzSales de forma natural; CTA claro al final; para carrusel indicá "Slide N:" antes de cada slide; máximo 2-3 emojis; tono experto, no genérico.`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const ip = getClientIP(request);
  const quota = await peekQuota(env, ip);
  return json({ remaining: quota.remaining, limits: DEMO_LIMITS, devWarning: quota.devWarning });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = getClientIP(request);

  if (!env.ANTHROPIC_API_KEY) {
    return jsonError('El generador no está configurado en este entorno todavía.', 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Body inválido, se esperaba JSON.', 400);
  }

  const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
  if (!topic) return jsonError('Falta el tema del post.', 400);
  if (topic.length > MAX_TOPIC_LENGTH) {
    return jsonError(`El tema es demasiado largo (máximo ${MAX_TOPIC_LENGTH} caracteres).`, 400);
  }

  const channel = ALLOWED_CHANNELS.includes(body?.channel) ? body.channel : 'linkedin';
  const format = FORMAT_DESCRIPTIONS[body?.format] ? body.format : 'post_corto';

  const quotaBefore = await peekQuota(env, ip);
  if (!quotaBefore.devWarning && quotaBefore.remaining <= 0) {
    return jsonError(
      'La cuota diaria de la demo fue alcanzada. Podés seguir recorriendo el dashboard y usar los ejemplos disponibles.',
      429
    );
  }

  const prompt = buildPrompt(topic, channel, format);
  const model = env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (err) {
    // No se registra el mensaje completo del proveedor ni la API key: sólo
    // que la llamada falló, para poder diagnosticar sin filtrar nada sensible.
    console.error('generate-script: fetch a Anthropic falló');
    return jsonError('No se pudo generar el post en este momento. Probá de nuevo en unos minutos.', 502);
  }

  if (!res.ok) {
    console.error(`generate-script: Anthropic respondió status ${res.status}`);
    return jsonError('No se pudo generar el post en este momento. Probá de nuevo en unos minutos.', 502);
  }

  const data = await res.json().catch(() => null);
  const text = data?.content?.[0]?.text;
  if (!text) {
    console.error('generate-script: respuesta de Anthropic sin contenido utilizable');
    return jsonError('El generador no devolvió contenido. Probá de nuevo.', 502);
  }

  const quotaAfter = await consumeQuota(env, ip);
  return json({ success: true, content: text, remaining: quotaAfter.remaining, devWarning: quotaAfter.devWarning });
}
