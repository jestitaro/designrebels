/** Lista logos y poses de personajes presentes en /public. Uso: npm run list-assets */
import { existsSync, readdirSync } from 'node:fs';

const logos = ['iso-qs.svg', 'logo-qs-fullcolor.svg', 'tipo-qs-bg-light.svg'];
console.log('Logos (public/logos):');
for (const l of logos) console.log(`  ${existsSync(`public/logos/${l}`) ? '✓' : '·'} ${l}${existsSync(`public/logos/${l}`) ? '' : '  (pendiente)'}`);

for (const who of ['caro', 'nico']) {
  const dir = `public/characters/${who}`;
  const poses = existsSync(dir) ? readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')) : [];
  console.log(`\nPoses ${who} (${dir}):`);
  console.log(poses.length ? poses.map((p) => `  · ${p.replace(/\.png$/i, '')}`).join('\n') : '  (sin archivos)');
}
