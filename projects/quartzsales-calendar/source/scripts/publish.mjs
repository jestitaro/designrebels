// Copia el build (source/dist) a la carpeta publicada (projects/quartzsales-calendar/).
// Borra solo lo generado por builds anteriores: nunca toca `source/` ni `README.md`.
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sourceDir = resolve(here, '..');
const dist = join(sourceDir, 'dist');
const target = resolve(sourceDir, '..');
const KEEP = new Set(['source', 'README.md']);

if (!existsSync(dist)) {
  console.error('No existe dist/. Corré `vite build` primero.');
  process.exit(1);
}
if (!target.endsWith('quartzsales-calendar')) {
  console.error(`Destino inesperado: ${target}. Abortando por seguridad.`);
  process.exit(1);
}

for (const entry of readdirSync(target)) {
  if (!KEEP.has(entry)) rmSync(join(target, entry), { recursive: true, force: true });
}
for (const entry of readdirSync(dist)) {
  cpSync(join(dist, entry), join(target, entry), { recursive: true });
}
console.log(`Build publicado en ${target}`);
