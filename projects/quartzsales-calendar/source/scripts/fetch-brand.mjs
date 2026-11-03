// Descarga los logos oficiales de QuartzSales para servirlos desde la propia app
// (sin pedidos a terceros en runtime y disponibles offline). Correr una vez:
//   npm run fetch-brand
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://www.quartzsales.com/images/svg_qs/';
const FILES = ['logo-qs-fullcolor.svg', 'logo-qs-fullcolor-negativo.svg'];
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'brand');
mkdirSync(out, { recursive: true });

for (const file of FILES) {
  const res = await fetch(BASE + file);
  if (!res.ok) throw new Error(`No se pudo descargar ${file}: HTTP ${res.status}`);
  const svg = await res.text();
  if (!svg.includes('<svg')) throw new Error(`${file} no parece un SVG`);
  writeFileSync(join(out, file), svg);
  console.log(`✓ ${file}`);
}
console.log('Logos guardados en public/brand/. Ahora corré npm run build.');
