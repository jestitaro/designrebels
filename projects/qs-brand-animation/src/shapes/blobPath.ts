import { rand } from '../lib/random';

/** Catmull-Rom cerrado → curvas cúbicas. Da contornos orgánicos sin picos. */
export const smoothClosedPath = (pts: [number, number][], tension = 1) => {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${d} Z`;
};

/**
 * Blob determinístico centrado en (0,0) con radio base 1.
 * `t` en segundos: el contorno respira lento. Mismo seed + mismo t = mismo path.
 */
export const blobPoints = (seed: string, points = 7, irregularity = 0.22, t = 0, wobble = 0.06, speed = 0.25): [number, number][] =>
  Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const base = 1 + (rand(`${seed}-r${i}`) * 2 - 1) * irregularity;
    const phase = rand(`${seed}-p${i}`) * Math.PI * 2;
    const r = base + Math.sin(t * Math.PI * 2 * speed + phase) * wobble;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });

export const blobPath = (seed: string, opts: { points?: number; irregularity?: number; t?: number; wobble?: number; speed?: number; scale?: number } = {}) => {
  const s = opts.scale ?? 1;
  return smoothClosedPath(blobPoints(seed, opts.points, opts.irregularity, opts.t, opts.wobble, opts.speed).map(([x, y]) => [x * s, y * s]));
};
