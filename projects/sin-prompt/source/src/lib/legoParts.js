// Geometría de piezas LEGO reales (proporciones LDraw), sin escalar por pieza.
// 1 unidad = 1 stud = 20 LDU · ladrillo = 1.2 (24 LDU) · plate = 0.4 (8 LDU)
// Perilla: Ø 12 LDU (r 0.3), alto 4 LDU (0.2).
// Origen de cada pieza: centro de su huella, en la base (y = 0).
// Slopes: la cara inclinada baja hacia -X (dir 'L'); se rota 180° para 'R'.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const H = 1.2;
const GAP = 0.02; // juntas visibles entre piezas (no se superponen)
const STUD_R = 0.3;
const STUD_H = 0.2;

const clean = (g) => {
  const n = g.index ? g.toNonIndexed() : g;
  ['uv', 'uv1', 'uv2'].forEach((a) => n.deleteAttribute(a));
  return n;
};

function stud(x, y, z = 0) {
  const g = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 20);
  g.translate(x, y + STUD_H / 2, z);
  return clean(g);
}

function brick(len) {
  const body = new RoundedBoxGeometry(len - GAP, H - GAP, 1 - GAP, 2, 0.045);
  body.translate(0, H / 2, 0);
  const parts = [clean(body)];
  for (let i = 0; i < len; i++) parts.push(stud(-len / 2 + 0.5 + i, H - GAP / 2));
  return mergeGeometries(parts);
}

/** Prisma a partir de un perfil XY (en studs), con canto apenas redondeado. */
function profile(points, studsAt = [], topY = H) {
  const b = 0.018;
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1 - GAP - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1 });
  g.translate(0, 0, -(1 - GAP - b * 2) / 2);
  const parts = [clean(g)];
  studsAt.forEach((x) => parts.push(stud(x, topY - GAP / 2)));
  return mergeGeometries(parts);
}

const i = GAP / 2 + 0.018; // inset para compensar el bevel

const BUILDERS = {
  // Brick 1 × 1 / 1 × 2 / 1 × 4
  3005: () => brick(1),
  3004: () => brick(2),
  3010: () => brick(4),
  // Slope 45 2 × 1: parte alta (con 1 perilla) en +X, baja hacia -X con labio de 4 LDU
  3040: () =>
    profile(
      [
        [-1 + i, i],
        [1 - i, i],
        [1 - i, H - i],
        [0, H - i],
        [-1 + i, 0.2],
      ],
      [0.5],
    ),
  // Slope 45 2 × 1 Inverted: arriba plano con 2 perillas; abajo, encastre solo en +X
  3665: () =>
    profile(
      [
        [-1 + i, H - i],
        [-1 + i, H - 0.2],
        [0, i],
        [1 - i, i],
        [1 - i, H - i],
      ],
      [-0.5, 0.5],
    ),
  // Slope 30 1 × 1 × 2/3 (cheese): alto 16 LDU, sin perillas
  54200: () =>
    profile([
      [-0.5 + i, i],
      [0.5 - i, i],
      [0.5 - i, 0.8 - i],
      [-0.5 + i, 0.12],
    ]),
};

const cache = new Map();
export function partGeometry(part) {
  const id = String(part);
  if (!cache.has(id)) {
    const build = BUILDERS[id];
    if (!build) throw new Error(`Pieza sin geometría: ${id}`);
    cache.set(id, build());
  }
  return cache.get(id);
}

export const PART_HEIGHT = { 3005: H, 3004: H, 3010: H, 3040: H, 3665: H, 54200: 0.8 };
export const PART_LEN = { 3005: 1, 3004: 2, 3010: 4, 3040: 2, 3665: 2, 54200: 1 };
