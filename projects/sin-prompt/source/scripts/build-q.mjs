// ─────────────────────────────────────────────────────────────────────────────
// QuartzSales · LEGO Q — generador del modelo
//
// Toma el isotipo ORIGINAL (src/assets/iso-qs.svg), lo pasa a una grilla con
// medidas LDraw (1 stud = 20 LDU, 1 ladrillo = 24 LDU de alto) y arma cada fila
// con piezas reales. Agrega slopes solo donde hay un encastre válido, valida
// colisiones y conexiones, y escribe:
//   src/data/lego-q-<variante>.json      modelo que usa la app
//   ../lego-q/lego-q-<variante>.json     mismo modelo (entregable)
//   ../lego-q/lego-q-<variante>.ldr      archivo LDraw
//   ../lego-q/INVENTARIO-<variante>.md   inventario contado desde el modelo
//   ../lego-q/MANUAL-<variante>.md       montaje por capas
//
// Uso: node scripts/build-q.mjs <ancho_studs> <profundidad_studs> <variante>
//   volumen: 10 × 2  → Q gruesa, pocas piezas grandes (dirección de la imagen de referencia)
//   detalle: 26 × 1  → pared fina, diagonales más definidas
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTriangles, inPoly, inflate } from './q-geometry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const OUT = resolve(ROOT, '..', 'lego-q');

// ── Parámetros ──────────────────────────────────────────────────────────────
const W = +(process.argv[2] || 10); // ancho de la Q en studs
const D = +(process.argv[3] || 2); // profundidad en studs (1 o 2)
const VARIANT = process.argv[4] || 'volumen';
const INFLATE = 1.14; // cierra las juntas finas entre triángulos del isotipo
const COVER_MIN = 5; // de 9 submuestras por celda

// Catálogo permitido. len = studs en X, dep = studs en Z, h = alto en LDU.
// top/bottom: dónde tiene perillas (arriba) y tubos (abajo).
export const PARTS = {
  3005: { name: 'Brick 1 x 1', len: 1, dep: 1, h: 24, top: 'all', bottom: 'all' },
  3004: { name: 'Brick 1 x 2', len: 2, dep: 1, h: 24, top: 'all', bottom: 'all' },
  3010: { name: 'Brick 1 x 4', len: 4, dep: 1, h: 24, top: 'all', bottom: 'all' },
  3003: { name: 'Brick 2 x 2', len: 2, dep: 2, h: 24, top: 'all', bottom: 'all' },
  54200: { name: 'Slope 30 1 x 1 x 2/3 (cheese)', len: 1, dep: 1, h: 16, top: 'none', bottom: 'all' },
  3040: { name: 'Slope 45 2 x 1', len: 2, dep: 1, h: 24, top: 'high', bottom: 'all' },
  3665: { name: 'Slope 45 2 x 1 Inverted', len: 2, dep: 1, h: 24, top: 'all', bottom: 'high' },
  35787: { name: 'Tile 2 x 2 Triangular', len: 2, dep: 2, h: 8, top: 'none', bottom: 'all' },
};

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
const k = (W * 20) / (maxx - minx);
const ROWS = Math.round(((maxy - miny) * k) / 24);
const infl = tris.map((t) => inflate(t, INFLATE));
const tVals = tris.map((t) => t.c[0] - minx + (t.c[1] - miny));
const tMin = Math.min(...tVals), tMax = Math.max(...tVals);
const triColor = tVals.map((v) => Math.min(PALETTE.length - 1, Math.floor(((v - tMin) / (tMax - tMin + 1e-9)) * PALETTE.length)));

const grid = [];
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
function rowRuns(r) {
  const out = [];
  let c = 0;
  while (c < W) {
    if (!filled(c, r)) { c++; continue; }
    const a = c;
    while (c < W && filled(c, r)) c++;
    out.push([a, c - 1]);
  }
  return out;
}

// Saliente interior: en el logo es un triángulo bajo que nace del borde inferior.
// Rasterizado queda como torre angosta (se malinterpreta): se limita a sus filas
// más bajas, como un bulto ancho con perillas.
{
  const keep = Math.max(1, Math.round(ROWS * 0.09));
  let kept = 0;
  for (let r = 0; r < ROWS; r++) {
    const runs = rowRuns(r);
    if (runs.length < 3) continue;
    if (kept < keep) { kept++; continue; }
    runs.slice(1, -1).forEach(([a, b]) => { for (let c = a; c <= b; c++) grid[r][c] = -1; });
  }
}

// ── 2. Piezas ───────────────────────────────────────────────────────────────
// Cada pieza: c0..c0+len-1 en X, z0..z0+dep-1 en Z, fila r. dir: 'L'/'R' para slopes.
const pieces = [];
const occ = new Map(); // "c,r,z" → id
const key = (c, r, z) => `${c},${r},${z}`;
let nextId = 1;
function cellsOf(p) {
  const out = [];
  for (let c = p.c0; c < p.c0 + p.len; c++) for (let z = p.z0; z < p.z0 + p.dep; z++) out.push([c, z]);
  return out;
}
function add(part, c0, r, z0, opts) {
  const P = PARTS[part];
  const rotated = opts.rotated && P.len !== P.dep; // p. ej. 1×2 girado 90°: 1 en X, 2 en Z
  const p = { part, c0, r, z0, len: rotated ? P.dep : P.len, dep: rotated ? P.len : P.dep, rotated: !!rotated, dir: opts.dir || 'L', color: opts.color, role: opts.role };
  for (const [c, z] of cellsOf(p)) if (occ.has(key(c, r, z))) return null;
  p.id = `P${String(nextId++).padStart(3, '0')}`;
  for (const [c, z] of cellsOf(p)) occ.set(key(c, r, z), p.id);
  pieces.push(p);
  return p;
}
function majority(c0, len, r) {
  const v = {};
  for (let c = c0; c < c0 + len; c++) v[grid[r][c]] = (v[grid[r][c]] || 0) + 1;
  return +Object.entries(v).sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0];
}
const highCell = (p) => (p.dir === 'L' ? p.c0 + p.len - 1 : p.c0);
const allZ = (fn) => { for (let z = 0; z < D; z++) fn(z); };

// 2a. Inverted slopes donde la fila sobresale 1 stud sobre la de abajo.
for (let r = 1; r < ROWS; r++) {
  for (const [a, b] of rowRuns(r)) {
    const len = b - a + 1;
    const wantL = !filled(a, r - 1) && filled(a + 1, r - 1) && len >= 2;
    const wantR = !filled(b, r - 1) && filled(b - 1, r - 1) && len >= 2;
    if (wantL && wantR && len < 4) continue;
    if (wantL) allZ((z) => add(3665, a, r, z, { dir: 'L', color: grid[r][a], role: 'diagonal inferior' }));
    if (wantR) allZ((z) => add(3665, b - 1, r, z, { dir: 'R', color: grid[r][b], role: 'diagonal inferior' }));
  }
}

// 2b. Ladrillos trabados entre filas (los cortes no siguen el color).
function fillRow(r, offset) {
  let c = 0;
  while (c < W) {
    if (!filled(c, r) || occ.has(key(c, r, 0))) { c++; continue; }
    const start = c;
    while (c < W && filled(c, r) && !occ.has(key(c, r, 0))) c++;
    let n = c - start;
    let x = start;
    if (D === 2) {
      // fondo de 2: 2×2 como estructura; 1×2 girado para columnas sueltas o traba
      if (offset && n >= 3) { add(3004, x, r, 0, { rotated: true, color: majority(x, 1, r), role: 'traba' }); x++; n--; }
      while (n > 0) {
        if (n >= 2) { add(3003, x, r, 0, { color: majority(x, 2, r), role: 'estructura' }); x += 2; n -= 2; }
        else { add(3004, x, r, 0, { rotated: true, color: majority(x, 1, r), role: 'vértice / detalle' }); x++; n--; }
      }
    } else {
      if (offset && n >= 3) { add(3005, x, r, 0, { color: majority(x, 1, r), role: 'traba' }); x++; n--; }
      while (n > 0) {
        const len = n >= 6 ? 4 : n >= 2 ? 2 : 1;
        add(len === 4 ? 3010 : len === 2 ? 3004 : 3005, x, r, 0, { color: majority(x, len, r), role: len === 4 ? 'tramo recto' : len === 2 ? 'estructura' : 'vértice / detalle' });
        x += len;
        n -= len;
      }
    }
  }
}
function clearRowBricks(r) {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    if (p.r === r && ['3005', '3004', '3010', '3003'].includes(String(p.part))) {
      for (const [c, z] of cellsOf(p)) occ.delete(key(c, r, z));
      pieces.splice(i, 1);
    }
  }
}
const offsets = Array.from({ length: ROWS }, (_, r) => r % 2 === 1);
for (let r = 0; r < ROWS; r++) fillRow(r, offsets[r]);

const topCells = (p) => {
  const t = PARTS[p.part].top;
  if (t === 'none') return [];
  if (t === 'high') return cellsOf(p).filter(([c]) => c === highCell(p));
  return cellsOf(p);
};
const bottomCells = (p) => (PARTS[p.part].bottom === 'high' ? cellsOf(p).filter(([c]) => c === highCell(p)) : cellsOf(p));
const pieceAt = (c, r, z) => pieces.find((q) => q.id === occ.get(key(c, r, z)));
const topY = (p) => p.r * 24 + PARTS[p.part].h;

function components() {
  const par = new Map(pieces.map((p) => [p.id, p.id]));
  const f = (x) => (par.get(x) === x ? x : (par.set(x, f(par.get(x))), par.get(x)));
  for (const p of pieces)
    for (const [c, z] of bottomCells(p)) {
      const q = pieceAt(c, p.r - 1, z);
      if (q && topY(q) === p.r * 24 && topCells(q).some(([qc, qz]) => qc === c && qz === z)) par.set(f(p.id), f(q.id));
    }
  return new Set(pieces.map((p) => f(p.id))).size;
}
let best = components();
for (let pass = 0; pass < 4 && best > 1; pass++) {
  for (let r = 0; r < ROWS && best > 1; r++) {
    offsets[r] = !offsets[r];
    clearRowBricks(r);
    fillRow(r, offsets[r]);
    const n = components();
    if (n < best) best = n;
    else { offsets[r] = !offsets[r]; clearRowBricks(r); fillRow(r, offsets[r]); }
  }
}

// 2c. Slopes sobre escalones expuestos (solo con perilla debajo).
const studUp = (c, r, z) => {
  const p = pieceAt(c, r, z);
  return !!p && topCells(p).some(([pc, pz]) => pc === c && pz === z);
};
for (let r = 0; r < ROWS - 1; r++) {
  for (const [a, b] of rowRuns(r)) {
    const empty = (c) => !filled(c, r + 1);
    if (rowRuns(r).length >= 3 && [a, b].every((x) => x > rowRuns(r)[0][1] && x < rowRuns(r).at(-1)[0])) continue; // el saliente queda con perillas
    if (empty(a) && filled(a + 1, r + 1)) allZ((z) => studUp(a, r, z) && add(54200, a, r + 1, z, { dir: 'L', color: grid[r][a], role: 'terminación inclinada' }));
    else if (empty(a) && empty(a + 1) && filled(a + 2, r + 1)) allZ((z) => studUp(a, r, z) && studUp(a + 1, r, z) && add(3040, a, r + 1, z, { dir: 'L', color: grid[r][a], role: 'borde diagonal' }));
    if (b !== a) {
      if (empty(b) && filled(b - 1, r + 1)) allZ((z) => studUp(b, r, z) && add(54200, b, r + 1, z, { dir: 'R', color: grid[r][b], role: 'terminación inclinada' }));
      else if (empty(b) && empty(b - 1) && filled(b - 2, r + 1)) allZ((z) => studUp(b, r, z) && studUp(b - 1, r, z) && add(3040, b - 1, r + 1, z, { dir: 'R', color: grid[r][b], role: 'borde diagonal' }));
    }
  }
}

// ── 3. Conexiones y validación ──────────────────────────────────────────────
const conn = new Map(pieces.map((p) => [p.id, []]));
for (const p of pieces)
  for (const [c, z] of bottomCells(p)) {
    const q = pieceAt(c, p.r - 1, z);
    if (q && topY(q) === p.r * 24 && topCells(q).some(([qc, qz]) => qc === c && qz === z)) {
      conn.get(p.id).push({ to: q.id, c, z, side: 'abajo' });
      conn.get(q.id).push({ to: p.id, c, z, side: 'arriba' });
    }
  }
const errors = [];
const seen = new Map();
for (const p of pieces) for (const [c, z] of cellsOf(p)) {
  const kk = key(c, p.r, z);
  if (seen.has(kk)) errors.push(`Colisión en ${kk}: ${seen.get(kk)} y ${p.id}`);
  seen.set(kk, p.id);
}
const nComp = components();
const sueltas = pieces.filter((p) => conn.get(p.id).length === 0);
if (sueltas.length) errors.push(`Piezas sin conexión: ${sueltas.map((p) => p.id).join(', ')}`);
if (nComp > 1) errors.push(`El modelo tiene ${nComp} partes separadas`);

// ── 4. Orden de montaje: de la punta inferior al cierre superior ───────────
pieces.sort((a, b) => a.r - b.r || (PARTS[a.part].h === 16) - (PARTS[b.part].h === 16) || a.c0 - b.c0 || a.z0 - b.z0);
pieces.forEach((p, i) => (p.step = i + 1));

// rotación: slopes 'R' giran 180°; ladrillos girados, 90°
const rotY = (p) => (p.rotated ? 90 : p.dir === 'R' && ['3040', '3665', '54200'].includes(String(p.part)) ? 180 : 0);

const model = {
  name: 'QuartzSales · LEGO Q',
  variant: VARIANT,
  source: 'src/assets/iso-qs.svg (isotipo original)',
  units: { stud: 20, brick: 24, plate: 8, note: 'Coordenadas en LDU. x: derecha, y: arriba (base de la pieza), z: profundidad (centro del modelo en 0).' },
  grid: { width: W, rows: ROWS, depth: D },
  palette: PALETTE,
  parts: Object.fromEntries(Object.entries(PARTS).map(([id, p]) => [id, { name: p.name, ldraw: `${id}.dat` }])),
  pieces: pieces.map((p) => ({
    id: p.id,
    part: String(p.part),
    ldraw: `${p.part}.dat`,
    name: PARTS[p.part].name,
    x: (p.c0 + p.len / 2 - W / 2) * 20,
    y: p.r * 24,
    z: (p.z0 + p.dep / 2 - D / 2) * 20,
    rotationY: rotY(p),
    color: PALETTE[p.color].hex,
    colorName: PALETTE[p.color].name,
    layer: p.r + 1,
    step: p.step,
    role: p.role,
    connections: conn.get(p.id).map((e) => ({ to: e.to, side: e.side, studX: (e.c + 0.5 - W / 2) * 20, studZ: (e.z + 0.5 - D / 2) * 20 })),
  })),
  validation: { ok: errors.length === 0, errors, pieces: pieces.length, components: nComp },
};

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

// LDraw: colores directos, y negativo hacia arriba, origen arriba de la pieza.
const ldrColor = (hex) => '0x2' + hex.slice(1).toUpperCase();
const rotM = (part, deg) => {
  const isSlope = ['3040', '3665', '54200'].includes(String(part));
  // ladrillos: eje largo nativo en X. Slopes: pendiente nativa hacia -Z (verificar en Studio/LDCad).
  const base = isSlope ? (deg === 180 ? 90 : -90) : deg;
  const t = (base * Math.PI) / 180;
  const c = Math.round(Math.cos(t)), s = Math.round(Math.sin(t));
  return `${c} 0 ${s} 0 1 0 ${-s} 0 ${c}`;
};
const ldr = ['0 QuartzSales LEGO Q', `0 Name: lego-q-${VARIANT}.ldr`, '0 Author: Design Rebels · generado por scripts/build-q.mjs', '0 !LDRAW_ORG Unofficial_Model', '0 // Orden = orden de montaje. Un STEP por capa.'];
let lastLayer = 0;
for (const p of model.pieces) {
  if (p.layer !== lastLayer && lastLayer) ldr.push('0 STEP');
  lastLayer = p.layer;
  ldr.push(`1 ${ldrColor(p.color)} ${p.x} ${-(p.y + PARTS[p.part].h)} ${p.z} ${rotM(p.part, p.rotationY)} ${p.ldraw}`);
}
ldr.push('0 STEP');
writeFileSync(resolve(OUT, `lego-q-${VARIANT}.ldr`), ldr.join('\n') + '\n');

const unused = Object.keys(PARTS).filter((id) => !byPart.has(id));
writeFileSync(
  resolve(OUT, `INVENTARIO-${VARIANT}.md`),
  [
    `# LEGO Q · Inventario (${VARIANT}: ${W} × ${D} studs)`,
    '',
    `Generado desde el modelo (${model.pieces.length} piezas). No editar a mano: \`npm run build:q\`.`,
    '',
    '| Ref. | Pieza | Color | Cantidad |',
    '|---|---|---|---:|',
    ...invRows.map((r) => `| ${r.part} | ${r.name} | ${r.color} \`${r.hex}\` | ${r.n} |`),
    '',
    '**Totales por pieza**',
    '',
    ...[...byPart.entries()].sort().map(([id, n]) => `- ${id} ${PARTS[id].name}: ${n}`),
    '',
    unused.length ? `Permitidas pero no usadas en esta variante: ${unused.map((id) => `${id} (${PARTS[id].name})`).join(', ')}.` : '',
    '',
    '**Colores.** Los de QuartzSales en sólido. Equivalencia LEGO aproximada:',
    '',
    ...PALETTE.map((c) => `- ${c.name} \`${c.hex}\` → ${c.lego}`),
    '',
  ].join('\n'),
);

const layers = new Map();
for (const p of model.pieces) layers.set(p.layer, [...(layers.get(p.layer) || []), p]);
const manual = [
  `# LEGO Q · Manual de montaje (${VARIANT}: ${W} × ${D} studs)`,
  '',
  `${model.pieces.length} piezas en ${layers.size} capas, de la punta inferior al cierre superior. Una capa = una fila de ladrillos (24 LDU). Las cheese slopes y slopes 45° se apoyan sobre el escalón de la capa anterior.`,
  '',
  `Validación: ${model.validation.ok ? 'sin colisiones, todas las piezas conectadas, una sola estructura.' : model.validation.errors.join(' · ')}`,
  '',
];
for (const [layer, list] of [...layers.entries()].sort((a, b) => a[0] - b[0])) {
  const count = new Map();
  list.forEach((p) => count.set(`${p.part} ${p.name}`, (count.get(`${p.part} ${p.name}`) || 0) + 1));
  manual.push(`## Capa ${layer}`, '', `Piezas: ${[...count.entries()].map(([n, c]) => `${c}× ${n}`).join(' · ')}`, '');
  manual.push('| Paso | ID | Ref. | Color | X | Y | Z | Rot. | Encastra con |', '|---:|---|---|---|---:|---:|---:|---:|---|');
  list.forEach((p) => manual.push(`| ${p.step} | ${p.id} | ${p.part} | ${p.colorName} | ${p.x} | ${p.y} | ${p.z} | ${p.rotationY}° | ${[...new Set(p.connections.filter((c) => c.side === 'abajo').map((c) => c.to))].join(', ') || (p.layer === 1 ? 'base' : '—')} |`));
  manual.push('');
}
writeFileSync(resolve(OUT, `MANUAL-${VARIANT}.md`), manual.join('\n'));

// Reporte (vista frontal, fila de adelante)
const byId = new Map(pieces.map((p) => [p.id, p]));
const ascii = [];
for (let r = ROWS - 1; r >= 0; r--) ascii.push(Array.from({ length: W }, (_, c) => (occ.has(key(c, r, 0)) ? 'ABCDE'[byId.get(occ.get(key(c, r, 0))).color] : '.')).join(''));
console.log(ascii.join('\n'));
console.log(`\n${VARIANT}: ${model.pieces.length} piezas · ${layers.size} capas · componentes: ${nComp}`);
console.log([...byPart.entries()].sort().map(([id, n]) => `${id}: ${n}`).join(' · '));
console.log(errors.length ? 'ERRORES:\n' + errors.join('\n') : 'Validación OK');
if (errors.length) process.exitCode = 1;
