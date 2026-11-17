import { cors, allVotes, tally } from './_lib.js';

// Resultados completos para la organizadora: /api/admin?key=CLAVE (agregar &format=csv para descargar el registro).
export default async function handler(req, res) {
  cors(res);
  const key = String(req.query?.key || '');
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'unauthorized' });

  const votes = (await allVotes()).sort((a, b) => new Date(a.at) - new Date(b.at));
  if (req.query?.format === 'csv') {
    const names = { qs: 'Colores QuartzSales', ps: 'Colores PSMob' };
    const rows = ['fecha_utc,opcion,paleta,votante_anonimo'];
    for (const v of votes) rows.push(`${new Date(v.at).toISOString()},Opción ${v.option},${names[v.palette]},${v.hash.slice(0, 10)}`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="votos-logo-psmob.csv"');
    return res.status(200).send('﻿' + rows.join('\n'));
  }
  return res.status(200).json({ results: tally(votes), votes: votes.map(v => ({ at: v.at, option: v.option, palette: v.palette, voter: v.hash.slice(0, 10) })) });
}
