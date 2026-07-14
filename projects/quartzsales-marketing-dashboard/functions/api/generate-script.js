// Cloudflare Pages Function — POST /api/generate-script
// Body: { topic: string, channel: 'linkedin' | 'youtube', format: string }
//
// Arma el prompt y le pega a la API de Claude. La API key vive en la
// variable de entorno ANTHROPIC_API_KEY del proyecto de Cloudflare Pages y
// nunca llega al navegador.
import { json, jsonError } from '../_utils.js';

const FORMAT_DESCRIPTIONS = {
  post_corto: 'post corto de LinkedIn de ~300 palabras',
  post_largo: 'post largo de LinkedIn con storytelling de ~600 palabras',
  carrusel: 'carrusel de LinkedIn con 6 slides: Slide 1 (hook), Slides 2-5 (desarrollo), Slide 6 (CTA)',
  video_corto: 'script de video para YouTube de 3-5 minutos con secciones INTRO / DESARROLLO / CTA',
};

function buildPrompt(topic, channel, format) {
  const formatDescription = FORMAT_DESCRIPTIONS[format] || FORMAT_DESCRIPTIONS.post_corto;
  const channelCtx = channel === 'linkedin'
    ? 'LinkedIn para QuartzSales, empresa de SaaS de trade marketing y retail execution orientada a LATAM. La voz es profesional pero cercana, orientada a decisores de trade marketing, jefes comerciales y directores de ventas en empresas de consumo masivo.'
    : 'YouTube de QuartzSales / E-Saurio, orientado a profesionales del retail y trade marketing en Argentina y LATAM.';

  return `Generá un ${formatDescription} para ${channelCtx}

Tema: ${topic}

Reglas:
- Español rioplatense (vos, no tú)
- Hook potente en las primeras 2 líneas que frene el scroll
- Orientado a problemas reales de ejecución en PDV, quiebres de stock, visibilidad de marca, gestión de campo
- Mencioná QuartzSales de forma natural, no forzada
- CTA claro al final
- Para carrusel: indicá claramente "Slide N:" antes de cada slide
- Sin emojis excesivos, máximo 2-3 por pieza
- Tono: experto del sector, no genérico ni corporativo frío`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ANTHROPIC_API_KEY) {
    return jsonError('ANTHROPIC_API_KEY no está configurado en las variables de entorno de Cloudflare Pages.', 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Body inválido, se esperaba JSON.', 400);
  }

  const topic = (body?.topic || '').trim();
  const channel = body?.channel === 'youtube' ? 'youtube' : 'linkedin';
  const format = body?.format || 'post_corto';

  if (!topic) return jsonError('Falta el tema del post.', 400);

  const prompt = buildPrompt(topic, channel, format);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return jsonError(`Anthropic respondió ${res.status}${errBody ? ': ' + errBody.slice(0, 200) : ''}`, 502);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || 'Sin respuesta';
    return json({ text });
  } catch (err) {
    return jsonError('Error generando el post: ' + err.message, 502);
  }
}
