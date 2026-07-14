// Cloudflare Pages Function — GET /api/youtube?handle=esaurio1591
//
// Trae estadísticas del canal vía la API de YouTube Data v3. La API key
// vive en la variable de entorno YOUTUBE_API_KEY del proyecto de Cloudflare
// Pages y nunca llega al navegador.
import { json, jsonError } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.YOUTUBE_API_KEY) {
    return jsonError('YOUTUBE_API_KEY no está configurado en las variables de entorno de Cloudflare Pages.', 500);
  }

  const handle = (new URL(request.url).searchParams.get('handle') || '').trim();
  if (!handle) return jsonError('Falta el parámetro handle.', 400);

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(handle)}&key=${env.YOUTUBE_API_KEY}`
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return jsonError(`YouTube respondió ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`, 502);
    }

    const data = await res.json();
    const ch = data.items?.[0];
    if (!ch) return jsonError('Canal no encontrado.', 404);

    const s = ch.statistics;
    const videos = parseInt(s.videoCount || 0);
    const views = parseInt(s.viewCount || 0);

    return json({
      subs: parseInt(s.subscriberCount || 0),
      videos,
      views,
      avgViews: videos > 0 ? Math.round(views / videos) : 0,
    });
  } catch (err) {
    return jsonError('Error consultando YouTube: ' + err.message, 502);
  }
}
