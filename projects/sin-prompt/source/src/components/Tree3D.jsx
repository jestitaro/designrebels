import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LegoScene, BRICK_H } from '../lib/lego3d.js';

// ── Geometría del árbol colectivo (en studs) ────────────────────────────────
// Cada capa es un cuadrado macizo de S×S studs armado con 4 ladrillos en
// molinete (cada ladrillo = una postal). Si S es impar, un relleno de 1×1 tapa
// el centro. Cada capa es 1 stud más chica que la de abajo.
const TRUNK_H = 2 * BRICK_H;

export function treeLayout(total) {
  const layers = Math.max(1, Math.ceil(total / 4));
  const sizes = Array.from({ length: layers }, (_, k) => 2 + layers - 1 - k);
  const rects = [];
  for (let i = 0; i < total; i++) {
    const k = Math.floor(i / 4);
    const S = sizes[k];
    const w = Math.floor(S / 2);
    const h = S / 2;
    const r = [
      [-h, h - w, -h, -h + w],
      [h - w, h, -h, h - w],
      [-h + w, h, h - w, h],
      [-h, -h + w, -h + w, h],
    ][i % 4];
    rects.push({ x0: r[0], x1: r[1], z0: r[2], z1: r[3], layer: k });
  }
  const fillers = sizes.map((S, k) => (S % 2 ? { x0: -0.5, x1: 0.5, z0: -0.5, z1: 0.5, layer: k } : null)).filter(Boolean);
  return { rects, fillers, top: TRUNK_H + layers * BRICK_H };
}

const yOf = (k) => TRUNK_H + k * BRICK_H + BRICK_H / 2;
const center = (r) => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2];
function studCells(r) {
  const [cx, cz] = center(r);
  const out = [];
  for (let x = r.x0 + 0.5; x < r.x1; x += 1) for (let z = r.z0 + 0.5; z < r.z1; z += 1) out.push([x - cx, z - cz]);
  return out;
}

const PALETTE = {
  public: ['#7025E0', '#A172FF', '#8B4BF0'],
  private: ['#2A1F9E', '#3B2FB8'],
  mine: '#3C9FF1',
};
function colorFor(piece, i) {
  if (piece.mine) return PALETTE.mine;
  if (piece.visibility === 'private') return PALETTE.private[i % 2];
  return PALETTE.public[i % 3];
}

/**
 * Árbol colectivo con volumen real (Three.js). Arrastrar o flechas para girar;
 * pasar por una pieza muestra qué vínculo representa.
 */
export default function Tree3D({ total, pieces = [], height = 560, highlightId, onHover, complete = false, label = 'Árbol de piezas' }) {
  const ref = useRef(null);
  const sceneRef = useRef(null);
  const reduce = useReducedMotion();
  const dropped = useRef(null);
  const [noGL, setNoGL] = useState(false);
  const hoverRef = useRef(onHover);
  hoverRef.current = onHover;

  useEffect(() => {
    let scene;
    try {
      scene = new LegoScene(ref.current, {
        reduceMotion: !!reduce,
        autoRotate: true,
        tilt: 0.34,
        onHover: (b) => hoverRef.current?.(b?.meta ? b.meta.piece : null, b?.meta?.index),
      });
    } catch {
      setNoGL(true);
      return undefined;
    }
    scene.dragEnabled = true;
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const { rects, fillers, top } = treeLayout(total);
    const placedLayer = (k) => rects.some((r, i) => r.layer === k && pieces[i]);
    const bricks = [];
    const ghosts = [];
    bricks.push({ id: 'trunk', w: 2, d: 2, h: TRUNK_H, color: '#130D5D', studs: [], states: { tree: { p: [0, TRUNK_H / 2, 0] } } });
    fillers.forEach((f) => {
      if (placedLayer(f.layer)) bricks.push({ id: 'f' + f.layer, w: 1, d: 1, color: '#5B2BD1', studs: [[0, 0]], states: { tree: { p: [0, yOf(f.layer), 0] } } });
    });
    rects.forEach((r, i) => {
      const [cx, cz] = center(r);
      const w = r.x1 - r.x0;
      const d = r.z1 - r.z0;
      const piece = pieces[i];
      if (!piece) {
        ghosts.push({ w, d, p: [cx, yOf(r.layer), cz] });
        return;
      }
      bricks.push({ id: piece.id, w, d, color: colorFor(piece, i), studs: studCells(r), meta: { piece, index: i }, states: { tree: { p: [cx, yOf(r.layer), cz] } } });
    });
    scene.setBricks(bricks, 'tree', ghosts);
    scene.setStar([0, top + 0.9, 0], complete);
    scene.fit();
    if (highlightId && dropped.current !== highlightId) {
      dropped.current = highlightId;
      scene.dropIn([highlightId], 7);
    }
  }, [total, pieces, complete, highlightId, reduce]);

  if (noGL) return <p className="muted">Tu navegador no puede mostrar el árbol en 3D. Usá “Ver como lista”.</p>;
  return (
    <div
      ref={ref}
      className="tree3d-gl"
      style={{ height }}
      tabIndex={0}
      role="img"
      aria-label={`${label}. ${pieces.length} de ${total} piezas colocadas. Usá las flechas para girarlo.`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') sceneRef.current?.rotateBy(-0.26);
        if (e.key === 'ArrowRight') sceneRef.current?.rotateBy(0.26);
      }}
    />
  );
}
