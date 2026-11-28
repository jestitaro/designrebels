// ─────────────────────────────────────────────────────────────────────────────
// Arbolito armado con EXACTAMENTE las mismas piezas que la Q (variante volumen):
// 16× 3003 (2×2) · 5× 3004 (1×2) · 12× 3665 (inverted slope) · 8× 54200 (cheese)
// Mismo sistema de coordenadas que la Q: 10 studs de ancho × 2 de fondo.
//
//  fila 8          ▭            1×2 de remate (sobre él va la estrella)
//  fila 7        ▯ ■ ▯          1×2 girado · 2×2 · 1×2 girado
//  fila 6       ◣ ■■ ◢          piso C: inverted slopes en las puntas
//  fila 5      ▲ ■■■ ▲          cheese sobre los escalones
//  fila 4     ◣ ■■■■ ◢          piso B
//  fila 3    ▲ ■■■■■■ ▲         cheese
//  fila 2   ◣ ■■■■■■■■ ◢        piso A
//  fila 1        ■              tronco
//  fila 0      ▯ ■ ▯            maceta
// ─────────────────────────────────────────────────────────────────────────────
const W = 10;
const D = 2;

// part, columna inicial, fila, z inicial, 'r' = 1×2 girado, dir para slopes
const S = [];
const brick2 = (c, r) => S.push({ part: '3003', c0: c, r, z0: 0, len: 2, dep: 2 });
const rot1x2 = (c, r) => S.push({ part: '3004', c0: c, r, z0: 0, len: 1, dep: 2, rotationY: 90 });
const inv = (c, r, dir) => [0, 1].forEach((z) => S.push({ part: '3665', c0: c, r, z0: z, len: 2, dep: 1, rotationY: dir === 'R' ? 180 : 0 }));
const cheese = (c, r, dir) => [0, 1].forEach((z) => S.push({ part: '54200', c0: c, r, z0: z, len: 1, dep: 1, rotationY: dir === 'R' ? 180 : 0 }));

// maceta y tronco
rot1x2(3, 0); brick2(4, 0); rot1x2(6, 0);
brick2(4, 1);
// piso A
inv(0, 2, 'L'); brick2(2, 2); brick2(4, 2); brick2(6, 2); inv(8, 2, 'R');
brick2(1, 3); brick2(3, 3); brick2(5, 3); brick2(7, 3);
cheese(0, 3, 'L'); cheese(9, 3, 'R');
// piso B
inv(1, 4, 'L'); brick2(3, 4); brick2(5, 4); inv(7, 4, 'R');
brick2(2, 5); brick2(4, 5); brick2(6, 5);
cheese(1, 5, 'L'); cheese(8, 5, 'R');
// piso C
inv(2, 6, 'L'); brick2(4, 6); inv(6, 6, 'R');
rot1x2(3, 7); brick2(4, 7); rot1x2(6, 7);
// remate: 1×2 a lo largo, adelante
S.push({ part: '3004', c0: 4, r: 8, z0: 0, len: 2, dep: 1, rotationY: 0 });

/** Posiciones del árbol en unidades de escena (1 = 1 stud), base de cada pieza. */
export const TREE_SLOTS = S.map((s) => ({
  part: s.part,
  x: s.c0 + s.len / 2 - W / 2,
  y: s.r * 1.2,
  z: s.z0 + s.dep / 2 - D / 2,
  rotationY: s.rotationY || 0,
  row: s.r,
}));

export const TREE_TOP = 9 * 1.2; // altura del remate (para la estrella)

export function treeInventory() {
  const m = {};
  TREE_SLOTS.forEach((s) => (m[s.part] = (m[s.part] || 0) + 1));
  return m;
}
