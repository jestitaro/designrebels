// ─────────────────────────────────────────────────────────────────────────────
// QuartzSales · LEGO Q — generador del modelo
//
// Toma el isotipo ORIGINAL (src/assets/iso-qs.svg), lo pasa a una grilla con
// medidas LDraw (1 stud = 20 LDU de ancho, 1 ladrillo = 24 LDU de alto) y arma
// cada fila con piezas reales. Después agrega slopes solo donde hay un encastre
// válido, valida colisiones y conexiones, y escribe:
//   src/data/lego-q-<variante>.json      modelo que usa la app
//   ../lego-q/lego-q-<variante>.json     mismo modelo (entregable)
//   ../lego-q/lego-q-<variante>.ldr      archivo LDraw
//   ../lego-q/INVENTARIO-<variante>.md   inventario contado desde el modelo
//   ../lego-q/MANUAL-<variante>.md       montaje por capas
// Uso: node scripts/build-q.mjs [ancho_en_studs] [variante]
//      node scripts/build-q.mjs 26 detalle · node scripts/build-q.mjs 12 compacta
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTriangles, inPoly, inflate } from './q-geometry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const OUT = resolve(ROOT, '..', 'lego-q');

// ── Parámetros ──────────────────────────────────────────────────────────────
const WIDTH_STUDS = +(process.argv[2] || 26); // resolución: ancho total de la Q en studs
const VARIANT = process.argv[3] || 'detalle';
const INFLATE = 1.14; // cierra las juntas finas entre triángulos del isotipo
const COVER_MIN = 5; // de 9 submuestras por celda

// Catálogo permitido (solo estas piezas). Dimensiones en studs / alturas en LDU.
export const PARTS = {
  3005: { name: 'Brick 1 x 1', len: 1, h: 24, top: 'all', bottom: 'all' },
  3004: { name: 'Brick 1 x 2', len: 2, h: 24, top: 'all', bottom: 'all' },
  3010: { name: 'Brick 1 x 4', len: 4, h: 24, top: 'all', bottom: 'all' },
  3003: { name: 'Brick 2 x 2', len: 2, h: 24, top: 'all', bottom: 'all', depth: 2 },
  54200: { name: 'Slope 30 1 x 1 x 2/3 (cheese)', len: 1, h: 16, top: 'none', bottom: 'all' },
  3040: { name: 'Slope 45 2 x 1', len: 2, h: 24, top: 'high', bottom: 'all' },
  3665: { name: 'Slope 45 2 x 1 Inverted', len: 2, h: 24, top: 'all', bottom: 'high' },
  35787: { name: 'Tile 2 x 2 Triangular', len: 2, h: 8, top: 'none', bottom: 'all', depth: 2 },
};

// Colores sólidos de QuartzSales (la transición sale de cómo se distribuyen).
export const PALETTE = [
  { hex: '#3C9FF1', name: 'Celeste QS', lego: 'Dark Azure (aprox.)' },
  { hex: '#3F75EA', name: 'Azul QS', lego: 'Medium Blue (aprox.)' },
  { hex: '#463DE1', name: 'Índigo QS', lego: 'Medium Bluish Violet (aprox.)' },
  { hex: '#5932E0', name: 'Violeta azulado QS', lego: 'Dark Purple (aprox.)' },
  { hex: '#7025E0', name: 'Violeta QS', lego: 'Medium Lavender oscuro (aprox.)' },
];

// ── 1. Silueta en grilla ────────────────────────────────────────────────────
const tris = loadTriangles(resolve(ROOT, 'src/assets/iso-qs.svg'));
let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
tris.forEach((t) => t.pts.forEach(([x, y]) => {
  minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
}));
const W = WIDTH_STUDS;
const k = (W * 20) / (maxx - minx); // LDU por unidad del SVG
const ROWS = Math.round(((maxy - miny) * k) / 24);
const infl = tris.map((t) => inflate(t, INFLATE));
const tVals = tris.map((t) => (t.c[0] - minx + (t.c[1] - miny)));
const tMin = Math.min(...tVals), tMax = Math.max(...tVals);
const triColor = tVals.map((v) => Math.min(PALETTE.length - 1, Math.floor(((v - tMin) / (tMax - tMin + 1e-9)) * PALETTE.length)));

const grid = []; // grid[r][c] = índice de color o -1
for (let r = 0; r < ROWS; r++) {
  grid.push([]);
  for (let c = 0; c < W; c++) {
    let cover = 0;
    const votes = {};
    for (let sy = 0; sy < 3; sy++)
      for (let sx = 0; sx < 3; sx++) {
        const px = minx + ((c + (sx + 0.5) / 3) * 20) / k;
        const py = maxy - ((r + (sy + 0.5) / 3) * 24) / k;
        const hit = infl.findIndex((p) => inPoly(px, py, p));
        if (hit >= 0) {
          cover++;
          votes[triColor[hit]] = (votes[triColor[hit]] || 0) + 1;
        }
      }
    grid[r].push(cover >= COVER_MIN ? +Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0] : -1);
  }
}
const filled = (c, r) => r >= 0 && r < ROWS && c >= 0 && c < W && grid[r][c] >= 0;

// ── 2. Piezas por fila ──────────────────────────────────────────────────────
const pieces = [];
const occ = new Map(); // "c,r" → id de pieza
const key = (c, r) => `${c},${r}`;
let nextId = 1;
function add(part, c0, r, dir, color, role) {
  const len = PARTS[part].len;
  for (let c = c0; c < c0 + len; c++) if (occ.has(key(c, r))) return null;
  const id = `P${String(nextId++).padStart(3, '0')}`;
  for (let c = c0; c < c0 + len; c++) occ.set(key(c, r), id);
  const p = { id, part, c0, r, len, dir, color, role };
  pieces.push(p);
  return p;
}

// Corridas del mismo color en cada fila.
function runsOf(r) {
  const out = [];
  let c = 0;
  while (c < W) {
    if (!filled(c, r)) { c++; continue; }
    const start = c;
    while (c < W && filled(c, r)) c++;
    out.push([start, c - 1]);
  }
  return out;
}

// 2a. Inverted slopes (3665) donde la fila sobresale 1 stud sobre la de abajo.
const reserved = new Set();
for (let r = 1; r < ROWS; r++) {
  for (const [a, b] of runsOf(r)) {
    const wantL = !filled(a, r - 1) && filled(a + 1, r - 1) && b - a >= 1;
    const wantR = !filled(b, r - 1) && filled(b - 1, r - 1) && b - a >= 1;
    const len = b - a + 1;
    if (wantL && wantR && len < 4) continue; // no hay lugar para las dos: simetría
    if (wantL) {
      const p = add(3665, a, r, 'L', grid[r][a], 'diagonal inferior');
      if (p) reserved.add(key(a, r)).add(key(a + 1, r));
    }
    if (wantR) {
      const p = add(3665, b - 1, r, 'R', grid[r][b], 'diagonal inferior');
      if (p) reserved.add(key(b - 1, r)).add(key(b, r));
    }
  }
}

// 2b. Ladrillos: corridas de celdas llenas (sin cortar por color), trabadas
// entre filas. Cada pieza toma el color mayoritario de sus celdas.
function majority(c0, len, r) {
  const v = {};
  for (let c = c0; c < c0 + len; c++) v[grid[r][c]] = (v[grid[r][c]] || 0) + 1;
  return +Object.entries(v).sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0];
}
function fillRow(r, offset) {
  let c = 0;
  while (c < W) {
    if (!filled(c, r) || occ.has(key(c, r))) { c++; continue; }
    const start = c;
    while (c < W && filled(c, r) && !occ.has(key(c, r))) c++;
    let n = c - start;
    let x = start;
    if (offset && n >= 3) {
      add(3005, x, r, 'L', majority(x, 1, r), 'traba');
      x += 1;
      n -= 1;
    }
    while (n > 0) {
      const len = n >= 6 ? 4 : n >= 2 ? 2 : 1;
      const part = len === 4 ? 3010 : len === 2 ? 3004 : 3005;
      add(part, x, r, 'L', majority(x, len, r), len === 4 ? 'tramo recto' : len === 2 ? 'estructura' : 'vértice / detalle');
      x += len;
      n -= len;
    }
  }
}
function clearRowBricks(r) {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    if (p.r === r && [3005, 3004, 3010].includes(p.part)) {
      for (let c = p.c0; c < p.c0 + p.len; c++) occ.delete(key(c, r));
      pieces.splice(i, 1);
    }
  }
}
const offsets = Array.from({ length: ROWS }, (_, r) => r % 2 === 1);
for (let r = 0; r < ROWS; r++) fillRow(r, offsets[r]);

// Conteo de partes separadas (solo ladrillos e inverted slopes; las slopes de
// arriba se suman después y siempre apoyan sobre algo).
function componentCount() {
  const byCell = (c, r) => pieces.find((p) => p.r === r && c >= p.c0 && c < p.c0 + p.len);
  const par = new Map(pieces.map((p) => [p.id, p.id]));
  const f = (x) => (par.get(x) === x ? x : (par.set(x, f(par.get(x))), par.get(x)));
  for (const p of pieces) {
    const bottoms = p.part === 3665 ? [p.dir === 'L' ? p.c0 + 1 : p.c0] : Array.from({ length: p.len }, (_, i) => p.c0 + i);
    for (const c of bottoms) {
      const q = byCell(c, p.r - 1);
      if (q) par.set(f(p.id), f(q.id));
    }
  }
  return new Set(pieces.map((p) => f(p.id))).size;
}
// Si hay partes sueltas, probar otras trabas fila por fila (búsqueda simple).
let best = componentCount();
for (let pass = 0; pass < 4 && best > 1; pass++) {
  for (let r = 0; r < ROWS && best > 1; r++) {
    offsets[r] = !offsets[r];
    clearRowBricks(r);
    fillRow(r, offsets[r]);
    const n = componentCount();
    if (n < best) best = n;
    else {
      offsets[r] = !offsets[r];
      clearRowBricks(r);
      fillRow(r, offsets[r]);
    }
  }
}

// 2c. Slopes sobre escalones expuestos hacia arriba (solo con encastre válido).
const isTopSupported = (c, r) => {
  const id = occ.get(key(c, r));
  if (!id) return false;
  const p = pieces.find((q) => q.id === id);
  return PARTS[p.part].top === 'all' || (PARTS[p.part].top === 'high' && c === highCell(p));
};
function highCell(p) {
  return p.dir === 'L' ? p.c0 + p.len - 1 : p.c0; // 'L' = baja hacia la izquierda
}
for (let r = 0; r < ROWS - 1; r++) {
  for (const [a, b] of runsOf(r)) {
    {
      const len0 = b - a + 1;
      let empty0 = true;
      for (let c = a; c <= b; c++) if (filled(c, r + 1)) empty0 = false;
      if (empty0 && len0 >= 2 && len0 <= 4) {
        if (isTopSupported(a, r) && isTopSupported(b, r)) {
          add(54200, a, r + 1, 'L', grid[r][a], 'terminación inclinada (pico)');
          add(54200, b, r + 1, 'R', grid[r][b], 'terminación inclinada (pico)');
        }
        continue;
      }
    }
    // izquierda
    if (!filled(a, r + 1) && filled(a + 1, r + 1) && isTopSupported(a, r)) add(54200, a, r + 1, 'L', grid[r][a], 'terminación inclinada');
    else if (!filled(a, r + 1) && !filled(a + 1, r + 1) && filled(a + 2, r + 1) && isTopSupported(a, r) && isTopSupported(a + 1, r)) add(3040, a, r + 1, 'L', grid[r][a], 'borde diagonal');
    // derecha
    if (b !== a) {
      if (!filled(b, r + 1) && filled(b - 1, r + 1) && isTopSupported(b, r)) add(54200, b, r + 1, 'R', grid[r][b], 'terminación inclinada');
      else if (!filled(b, r + 1) && !filled(b - 1, r + 1) && filled(b - 2, r + 1) && isTopSupported(b, r) && isTopSupported(b - 1, r)) add(3040, b - 1, r + 1, 'R', grid[r][b], 'borde diagonal');
    }
  }
}

// ── 3. Conexiones y validación ──────────────────────────────────────────────
const byId = new Map(pieces.map((p) => [p.id, p]));
const cellsOf = (p) => Array.from({ length: p.len }, (_, i) => p.c0 + i);
const topCells = (p) => (PARTS[p.part].top === 'all' ? cellsOf(p) : PARTS[p.part].top === 'high' ? [highCell(p)] : []);
const bottomCells = (p) => (PARTS[p.part].bottom === 'all' ? cellsOf(p) : [highCell(p)]);
// alturas reales: una pieza más baja (cheese, 16 LDU) no conecta con lo de arriba
const topY = (p) => p.r * 24 + PARTS[p.part].h;

const conn = new Map(pieces.map((p) => [p.id, []]));
for (const p of pieces) {
  for (const c of bottomCells(p)) {
    const below = occ.get(key(c, p.r - 1));
    if (!below) continue;
    const q = byId.get(below);
    if (topY(q) === p.r * 24 && topCells(q).includes(c)) {
      conn.get(p.id).push({ to: q.id, stud: c, side: 'abajo' });
      conn.get(q.id).push({ to: p.id, stud: c, side: 'arriba' });
    }
  }
}
// colisiones: celdas ocupadas dos veces (imposible por construcción) + alturas
const errors = [];
const seen = new Map();
for (const p of pieces) for (const c of cellsOf(p)) {
  const kk = key(c, p.r);
  if (seen.has(kk)) errors.push(`Colisión en ${kk}: ${seen.get(kk)} y ${p.id}`);
  seen.set(kk, p.id);
}
for (const p of pieces) if (!PARTS[p.part]) errors.push(`Pieza fuera de catálogo: ${p.part}`);

// componentes conectadas
const parent = new Map(pieces.map((p) => [p.id, p.id]));
const find = (x) => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x))), parent.get(x)));
for (const [id, list] of conn) for (const e of list) parent.set(find(id), find(e.to));
const comps = new Map();
for (const p of pieces) comps.set(find(p.id), (comps.get(find(p.id)) || 0) + 1);
const sueltas = pieces.filter((p) => conn.get(p.id).length === 0);
if (sueltas.length) errors.push(`Piezas sin conexión: ${sueltas.map((p) => p.id).join(', ')}`);
if (comps.size > 1) errors.push(`El modelo tiene ${comps.size} partes separadas: ${[...comps.values()].join(' + ')} piezas`);

// ── 4. Orden de montaje: de la punta inferior al cierre superior ───────────
pieces.sort((a, b) => a.r - b.r || (PARTS[a.part].h === 16) - (PARTS[b.part].h === 16) || a.c0 - b.c0);
pieces.forEach((p, i) => (p.step = i + 1));

// ── 5. Salida ───────────────────────────────────────────────────────────────
const model = {
  name: 'QuartzSales · LEGO Q',
  variant: VARIANT,
  source: 'src/assets/iso-qs.svg (isotipo original)',
  units: { stud: 20, brick: 24, plate: 8, note: 'Coordenadas en LDU. x: derecha, y: arriba (base de la pieza), z: profundidad.' },
  grid: { width: W, rows: ROWS, depth: 1 },
  palette: PALETTE,
  parts: Object.fromEntries(Object.entries(PARTS).map(([id, p]) => [id, { name: p.name, ldraw: `${id}.dat` }])),
  pieces: pieces.map((p) => ({
    id: p.id,
    part: String(p.part),
    ldraw: `${p.part}.dat`,
    name: PARTS[p.part].name,
    x: (p.c0 + p.len / 2 - W / 2) * 20,
    y: p.r * 24,
    z: 0,
    rotationY: p.dir === 'R' ? 180 : 0,
    color: PALETTE[p.color].hex,
    colorName: PALETTE[p.color].name,
    layer: p.r + 1,
    step: p.step,
    role: p.role,
    connections: conn.get(p.id).map((e) => ({ to: e.to, side: e.side, studX: (e.stud + 0.5 - W / 2) * 20 })),
  })),
  validation: { ok: errors.length === 0, errors, pieces: pieces.length, components: comps.size },
};

// inventario contado desde el modelo
const inv = new Map();
for (const p of model.pieces) {
  const kk = `${p.part}|${p.color}`;
  inv.set(kk, { part: p.part, name: p.name, color: p.colorName, hex: p.color, n: (inv.get(kk)?.n || 0) + 1 });
}
const invRows = [...inv.values()].sort((a, b) => a.part.localeCompare(b.part) || a.hex.localeCompare(b.hex));
const byPart = new Map();
for (const p of model.pieces) byPart.set(p.part, (byPart.get(p.part) || 0) + 1);
model.inventory = invRows;

mkdirSync(resolve(ROOT, 'src/data'), { recursive: true });
mkdirSync(OUT, { recursive: true });
const json = JSON.stringify(model, null, 1);
writeFileSync(resolve(ROOT, `src/data/lego-q-${VARIANT}.json`), json);
writeFileSync(resolve(OUT, `lego-q-${VARIANT}.json`), json);

// LDraw: colores directos (0x2RRGGBB), y negativo hacia arriba, origen arriba de la pieza.
const ldrColor = (hex) => '0x2' + hex.slice(1).toUpperCase();
const rotM = (part, deg) => {
  // ladrillos: eje largo nativo en X. Slopes: la pendiente nativa baja hacia -Z;
  // la giramos para que baje hacia -X (L) o +X (R).
  const isSlope = ['3040', '3665', '54200'].includes(String(part));
  if (!isSlope) return deg === 180 ? '-1 0 0 0 1 0 0 0 -1' : '1 0 0 0 1 0 0 0 1';
  return deg === 180 ? '0 0 -1 0 1 0 1 0 0' : '0 0 1 0 1 0 -1 0 0';
};
const ldr = [
  '0 QuartzSales LEGO Q',
  `0 Name: lego-q-${VARIANT}.ldr`,
  '0 Author: Design Rebels · generado por scripts/build-q.mjs',
  '0 !LDRAW_ORG Unofficial_Model',
  '0 // Orden = orden de montaje. Un STEP por capa.',
];
let lastLayer = 0;
for (const p of model.pieces) {
  if (p.layer !== lastLayer && lastLayer) ldr.push('0 STEP');
  lastLayer = p.layer;
  const h = PARTS[p.part].h;
  ldr.push(`1 ${ldrColor(p.color)} ${p.x} ${-(p.y + h)} ${p.z} ${rotM(p.part, p.rotationY)} ${p.ldraw}`);
}
ldr.push('0 STEP');
writeFileSync(resolve(OUT, `lego-q-${VARIANT}.ldr`), ldr.join('\n') + '\n');

// Inventario
const unused = Object.keys(PARTS).filter((id) => !byPart.has(id));
writeFileSync(
  resolve(OUT, `INVENTARIO-${VARIANT}.md`),
  [
    `# LEGO Q · Inventario (${VARIANT}, ${W} studs de ancho)`,
    '',
    `Generado desde el modelo (${model.pieces.length} piezas). No editar a mano: correr \`node scripts/build-q.mjs\`.`,
    '',
    '| Ref. | Pieza | Color | Cantidad |',
    '|---|---|---|---:|',
    ...invRows.map((r) => `| ${r.part} | ${r.name} | ${r.color} \`${r.hex}\` | ${r.n} |`),
    '',
    '**Totales por pieza**',
    '',
    ...[...byPart.entries()].sort().map(([id, n]) => `- ${id} ${PARTS[id].name}: ${n}`),
    '',
    unused.length ? `Permitidas pero no usadas en esta versión: ${unused.map((id) => `${id} (${PARTS[id].name})`).join(', ')}.` : '',
    '',
    '**Colores.** Son los de QuartzSales en sólido. Para armarla física, la equivalencia LEGO es aproximada:',
    '',
    ...PALETTE.map((c) => `- ${c.name} \`${c.hex}\` → ${c.lego}`),
    '',
  ].join('\n'),
);

// Manual por capas
const layers = new Map();
for (const p of model.pieces) layers.set(p.layer, [...(layers.get(p.layer) || []), p]);
const manual = [
  `# LEGO Q · Manual de montaje (${VARIANT}, ${W} studs de ancho)`,
  '',
  `${model.pieces.length} piezas en ${layers.size} capas, de la punta inferior al cierre superior. Una capa = una fila de ladrillos (24 LDU). Las cheese slopes y slopes 45° se apoyan sobre el escalón de la capa anterior.`,
  '',
  `Validación: ${model.validation.ok ? 'sin colisiones, todas las piezas conectadas, una sola estructura.' : model.validation.errors.join(' · ')}`,
  '',
];
for (const [layer, list] of [...layers.entries()].sort((a, b) => a[0] - b[0])) {
  const count = new Map();
  list.forEach((p) => count.set(`${p.part} ${p.name}`, (count.get(`${p.part} ${p.name}`) || 0) + 1));
  manual.push(`## Capa ${layer}`, '');
  manual.push(`Piezas: ${[...count.entries()].map(([n, c]) => `${c}× ${n}`).join(' · ')}`, '');
  manual.push('| Paso | ID | Ref. | Color | X | Y | Rot. | Encastra con |', '|---:|---|---|---|---:|---:|---:|---|');
  list.forEach((p) => manual.push(`| ${p.step} | ${p.id} | ${p.part} | ${p.colorName} | ${p.x} | ${p.y} | ${p.rotationY}° | ${p.connections.filter((c) => c.side === 'abajo').map((c) => c.to).join(', ') || (p.layer === 1 ? 'base' : '—')} |`));
  manual.push('');
}
writeFileSync(resolve(OUT, `MANUAL-${VARIANT}.md`), manual.join('\n'));

// Reporte
const ascii = [];
for (let r = ROWS - 1; r >= 0; r--) ascii.push(Array.from({ length: W }, (_, c) => (occ.has(key(c, r)) ? 'ABCDE'[byId.get(occ.get(key(c, r))).color] : '.')).join(''));
console.log(ascii.join('\n'));
console.log(`\n${model.pieces.length} piezas · ${layers.size} capas · componentes: ${comps.size}`);
console.log([...byPart.entries()].sort().map(([id, n]) => `${id}: ${n}`).join(' · '));
console.log(errors.length ? 'ERRORES:\n' + errors.join('\n') : 'Validación OK');
if (errors.length) process.exitCode = 1;
