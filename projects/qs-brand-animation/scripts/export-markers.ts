/**
 * Genera markers.csv (timecode HH:MM:SS:FF, frame, tipo, escena, nota) para el sonidista.
 * Uso: npm run export-markers [-- --fps=60]
 */
import { writeFileSync } from 'node:fs';
import { buildMarkers } from '../src/markers';
import { FPS, timecode } from '../src/lib/time';

const fpsArg = process.argv.find((a) => a.startsWith('--fps='));
const fps = fpsArg ? Number(fpsArg.split('=')[1]) : FPS;

const rows = buildMarkers(fps).map((m) => [timecode(m.frame, fps), m.frame, m.type, m.scene, (m.note ?? '').replace(/"/g, '""')]);
const csv = ['timecode,frame,type,scene,note', ...rows.map((r) => `${r[0]},${r[1]},${r[2]},${r[3]},"${r[4]}"`)].join('\n') + '\n';
writeFileSync('markers.csv', csv);
console.log(`markers.csv · ${rows.length} markers · ${fps} fps`);
