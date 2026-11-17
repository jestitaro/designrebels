import { put } from '@vercel/blob';
import { OPTIONS, PALETTES, clientIp, ipHash, cors, allVotes, tally } from './_lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const option = String(body?.option || '');
  const palette = String(body?.palette || '');
  if (!OPTIONS.includes(option) || !PALETTES.includes(palette)) {
    return res.status(400).json({ error: 'invalid' });
  }

  const ip = clientIp(req);
  if (!ip) return res.status(400).json({ error: 'no-ip' });
  const hash = ipHash(ip);

  // 1) Marca exclusiva por IP: si ya existe, la plataforma rechaza la escritura → ya votó.
  try {
    await put(`ip/${hash}.txt`, `${option}-${palette}`, {
      access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'text/plain',
    });
  } catch (err) {
    if (!/exist/i.test(String(err?.message))) {
      console.error('vote marker error', err);
      return res.status(500).json({ error: 'storage' });
    }
    const votes = await allVotes();
    const mine = votes.find(v => v.hash === hash) || null;
    return res.status(409).json({ error: 'already-voted', mine, results: tally(votes) });
  }

  // 2) El voto en sí.
  await put(`votes/${option}-${palette}/${hash}.txt`, new Date().toISOString(), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'text/plain',
  });

  const votes = await allVotes();
  if (!votes.some(v => v.hash === hash)) votes.push({ option, palette, hash, at: new Date().toISOString() });
  return res.status(200).json({ ok: true, mine: { option, palette }, results: tally(votes) });
}
