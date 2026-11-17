// Lógica compartida de la votación. Los archivos que empiezan con "_" no se publican como endpoint.
import { createHash } from 'node:crypto';
import { list } from '@vercel/blob';

export const OPTIONS = ['1', '2', '3'];
export const PALETTES = ['qs', 'ps'];

// IP real del votante. En Vercel, x-forwarded-for la escribe la plataforma (no la puede falsear el navegador).
export function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '');
  return (xff.split(',')[0] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '').trim();
}

// Nunca guardamos la IP: solo un hash con sal secreta, suficiente para impedir el doble voto.
export function ipHash(ip) {
  const salt = process.env.VOTE_SALT || 'psmob-logo-vote';
  return createHash('sha256').update(salt + '|' + ip).digest('hex').slice(0, 32);
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

// Recorre todos los votos. Cada voto es un blob "votes/<opcion>-<paleta>/<hash>.txt".
export async function allVotes() {
  const votes = [];
  let cursor;
  do {
    const page = await list({ prefix: 'votes/', cursor, limit: 1000 });
    for (const b of page.blobs) {
      const m = b.pathname.match(/^votes\/([123])-(qs|ps)\/([a-f0-9]+)\.txt$/);
      if (m) votes.push({ option: m[1], palette: m[2], hash: m[3], at: b.uploadedAt });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return votes;
}

export function tally(votes) {
  const out = { total: votes.length, options: {} };
  for (const o of OPTIONS) out.options[o] = { total: 0, qs: 0, ps: 0 };
  for (const v of votes) {
    out.options[v.option].total++;
    out.options[v.option][v.palette]++;
  }
  return out;
}
