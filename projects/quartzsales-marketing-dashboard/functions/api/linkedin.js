// Cloudflare Pages Function — GET /api/linkedin?handle=quartz-sales
//
// Trae seguidores/empleados de una empresa de LinkedIn vía Apify. El token
// de Apify vive en la variable de entorno APIFY_TOKEN del proyecto de
// Cloudflare Pages (Settings → Environment variables) y nunca llega al
// navegador — este endpoint es lo único que la usa.
import { json, jsonError } from '../_utils.js';

const APIFY_URL = 'https://api.apify.com/v2/acts/harvestapi~linkedin-company/run-sync-get-dataset-items';

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.APIFY_TOKEN) {
    return jsonError('APIFY_TOKEN no está configurado en las variables de entorno de Cloudflare Pages.', 500);
  }

  const handle = (new URL(request.url).searchParams.get('handle') || '').trim();
  if (!handle) return jsonError('Falta el parámetro handle.', 400);

  const linkedinUrl = `https://www.linkedin.com/company/${handle}/`;

  try {
    const res = await fetch(`${APIFY_URL}?token=${encodeURIComponent(env.APIFY_TOKEN)}&timeout=60&memory=256`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedInUrls: [linkedinUrl] }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return jsonError(`Apify respondió ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`, 502);
    }

    const data = await res.json();
    const company = Array.isArray(data) ? data[0] : data;
    if (!company) return jsonError('Apify no devolvió datos para ese handle.', 404);

    const followers = company.followersCount ?? company.followers ?? company.followerCount
      ?? company.companyFollowersCount ?? company.numberOfFollowers ?? null;
    const employees = company.employeeCount ?? company.employees ?? company.staffCount
      ?? company.companySize ?? company.numberOfEmployees ?? null;

    return json({ followers, employees });
  } catch (err) {
    return jsonError('Error consultando Apify: ' + err.message, 502);
  }
}
