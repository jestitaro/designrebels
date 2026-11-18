// PRNG determinístico + sorteo en ciclo.
//
// El sorteo arma UN ciclo con todo el listado: A→B→C→…→A. Eso garantiza, por
// construcción, que nadie se toca a sí mismo, que cada persona escribe
// exactamente un saludo de destino y recibe exactamente uno, y que no hay
// destinatarios repetidos. En demo se calcula con una semilla fija (mismo
// resultado en cualquier navegador, sin depender de quién entra primero).
// En producción lo hace la función SQL `generate_assignments()` una sola vez.

export function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 1;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(list, seed) {
  const rand = mulberry32(hashString(String(seed)));
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Devuelve { [giverId]: receiverId } con un único ciclo. */
export function buildAssignments(ids, seed) {
  if (ids.length < 2) return {};
  const order = seededShuffle([...ids].sort(), seed);
  const map = {};
  order.forEach((id, i) => {
    map[id] = order[(i + 1) % order.length];
  });
  return map;
}
