// Renderiza los stills de validación: 6 láminas del showcase + frames clave de CameraLab y TransitionsLab.
import { execSync } from 'node:child_process';

const FPS = 30;
const stills = [
  ['Showcase-Foundations', 80, 'showcase-1-fundamentos'],
  ['Showcase-Navigation', 80, 'showcase-2-navegacion'],
  ['Showcase-Forms', 80, 'showcase-3-formularios'],
  ['Showcase-Data', 80, 'showcase-4-indicadores'],
  ['Showcase-Products', 80, 'showcase-5-productos'],
  ['Showcase-App', 80, 'showcase-6-app'],
  ['Showcase-Assets', 80, 'showcase-7-marca'],
  ['Showcase-People', 80, 'showcase-8-personajes'],
  ['CameraLab', Math.round(1.8 * FPS), 'lab-camera-wide'],
  ['CameraLab', Math.round(4.4 * FPS), 'lab-camera-zoom'],
  ['TransitionsLab', Math.round(1.6 * FPS), 'lab-t1-zoomthrough'],
  ['TransitionsLab', Math.round(3 * FPS + 1.6 * FPS), 'lab-t2-objectwipe'],
  ['TransitionsLab', Math.round(9 * FPS + 1.4 * FPS), 'lab-t4-maskreveal'],
  ['TransitionsLab', Math.round(12 * FPS + 1.2 * FPS), 'lab-t5-shapemorph'],
];
const only = process.argv[2];
for (const [comp, frame, name] of stills) {
  if (only && !name.includes(only)) continue;
  execSync(`npx remotion still ${comp} out/${name}.png --frame=${frame} --log=error`, { stdio: 'inherit' });
  console.log(`✓ out/${name}.png`);
}
