import { clientIp, ipHash, cors, allVotes, tally } from './_lib.js';

// Dice si esta IP ya votó. Los resultados solo se devuelven a quien ya votó.
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const hash = ipHash(clientIp(req));
  const votes = await allVotes();
  const mine = votes.find(v => v.hash === hash) || null;
  if (!mine) return res.status(200).json({ voted: false });
  return res.status(200).json({ voted: true, mine: { option: mine.option, palette: mine.palette }, results: tally(votes) });
}
