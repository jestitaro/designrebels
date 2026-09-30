// Fase 2 · style frames: frame más representativo de las escenas 1, 3, 8, 10 y 14 → review/fase-2/
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const FPS = 30;
const frames = [
  ['S01-Problema', 3.4, 'sf-01-problema'],
  ['S03-Aparece', 3.0, 'sf-03-aparece-quartzsales'],
  ['S08-TiempoReal', 4.5, 'sf-08-tiempo-real'],
  ['S10-VisionArtificial', 6.0, 'sf-10-vision-artificial'],
  ['S14-Cierre', 3.2, 'sf-14-cierre'],
];
mkdirSync('review/fase-2', { recursive: true });
const only = process.argv[2];
for (const [comp, t, name] of frames) {
  if (only && !name.includes(only)) continue;
  execSync(`npx remotion still ${comp} review/fase-2/${name}.png --frame=${Math.round(t * FPS)} --log=error`, { stdio: 'inherit' });
  console.log(`✓ review/fase-2/${name}.png (t ${t}s)`);
}
