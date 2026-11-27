// Geometría del isotipo original (src/assets/iso-qs.svg) sin DOM:
// parser mínimo de path (comandos absolutos M L H V C Z) → polígonos.
import { readFileSync } from 'node:fs';

export function loadTriangles(svgPath) {
  const svg = readFileSync(svgPath, 'utf8');
  const d = svg.match(/ d="([^"]+)"/)[1];
  const tokens = d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const polys = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let i = 0;
  let cmd = null;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLHVCZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === 'M') {
      x = num();
      y = num();
      cur = [[x, y]];
      polys.push(cur);
      cmd = 'L';
    } else if (cmd === 'L') {
      x = num();
      y = num();
      cur.push([x, y]);
    } else if (cmd === 'H') {
      x = num();
      cur.push([x, y]);
    } else if (cmd === 'V') {
      y = num();
      cur.push([x, y]);
    } else if (cmd === 'C') {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
      for (let k = 1; k <= 6; k++) {
        const t = k / 6, u = 1 - t;
        cur.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
      }
      x = x3;
      y = y3;
    } else if (cmd === 'Z') {
      cmd = null;
    } else {
      i++;
    }
  }
  return polys.map((pts) => {
    const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
    return { pts, c };
  });
}

export function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Polígono agrandado desde su centro (cierra las juntas finas entre triángulos). */
export function inflate(tri, f) {
  return tri.pts.map(([x, y]) => [tri.c[0] + (x - tri.c[0]) * f, tri.c[1] + (y - tri.c[1]) * f]);
}
