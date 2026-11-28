import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { LegoScene } from '../lib/lego3d.js';
import { mulberry32 } from '../lib/assign.js';
import { Q_MODELS, DEFAULT_Q } from '../lib/legoQModels.js';
import { TREE_SLOTS, TREE_TOP } from '../lib/legoTree.js';

// La Q de QuartzSales armada con piezas LEGO reales (ver scripts/build-q.mjs).
// Se construye pieza por pieza en el orden del manual; el hover la desarma
// (animación inversa); al tocar una pieza, se arma el arbolito; otro click
// vuelve a la Q. Sin avisos: se descubre jugando.

const LDU = 20; // 1 unidad de escena = 1 stud
const HIDE = [0.001, 0.001, 0.001];
const PAL_ORDER = ['#3C9FF1', '#3F75EA', '#463DE1', '#5932E0', '#7025E0'];

function randomQuat(rnd, maxAngle) {
  const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(axis, (rnd() * 0.6 + 0.4) * maxAngle);
  return [q.x, q.y, q.z, q.w];
}

/** Piezas de la Q como bricks del motor: armada, desarmada y escondida. */
export function qBricks(rnd, { explodeScale = 1, model = Q_MODELS[DEFAULT_Q] } = {}) {
  const pcs = model.pieces;
  const maxStep = Math.max(...pcs.map((p) => p.step));
  const midY = (model.grid.rows * 1.2) / 2;
  return pcs.map((p) => {
    const x = p.x / LDU;
    const y = p.y / LDU;
    const qq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ((p.rotationY || 0) * Math.PI) / 180);
    const q = [qq.x, qq.y, qq.z, qq.w];
    const dy = y + 0.6 - midY;
    const len = Math.hypot(x, dy) || 1;
    // la explosión escala con el tamaño del modelo (compacta o detalle)
    const W = model.grid.width;
    const dist = W * (0.12 + rnd() * 0.22) * explodeScale;
    return {
      id: p.id,
      type: p.part,
      color: p.color,
      step: p.step,
      layer: p.layer,
      maxStep,
      meta: p,
      states: {
        logo: { p: [x, y, (p.z || 0) / LDU], q, color: p.color },
        explode: { p: [x + (x / len) * dist, Math.max(0, y + (dy / len) * dist * 0.7), (rnd() - 0.5) * W * 0.27 * explodeScale], q: randomQuat(rnd, Math.PI * 0.9), color: p.color },
      },
    };
  });
}

export default function LegoHero({ dropIn = false, variant }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let scene;
    const state = { mode: 'logo', armed: true, busyUntil: 0 };
    const rnd = mulberry32(7);
    const model = Q_MODELS[variant || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('q')) || DEFAULT_Q] || Q_MODELS[DEFAULT_Q];
    const qb = qBricks(rnd, { explodeScale: 0.6, model });
    const maxStep = qb[0]?.maxStep || 1;

    // El árbol se arma con LAS MISMAS piezas de la Q: cada pieza va a un lugar
    // del mismo tipo y conserva su color. Celestes arriba, violetas abajo.
    const yAxis = new THREE.Vector3(0, 1, 0);
    const byType = {};
    TREE_SLOTS.forEach((sl) => (byType[sl.part] = byType[sl.part] || []).push(sl));
    Object.values(byType).forEach((list) => list.sort((a, b) => b.row - a.row || a.x - b.x || a.z - b.z));
    const used = {};
    [...qb]
      .sort((a, b) => PAL_ORDER.indexOf(a.color) - PAL_ORDER.indexOf(b.color) || a.step - b.step)
      .forEach((b) => {
        const i = (used[b.type] = (used[b.type] ?? -1) + 1);
        const sl = byType[b.type]?.[i];
        if (!sl) {
          b.states.tree = { p: [0, TREE_TOP / 2, 0], s: HIDE, color: b.color };
          b.row = 0;
          return;
        }
        const q = new THREE.Quaternion().setFromAxisAngle(yAxis, (sl.rotationY * Math.PI) / 180);
        b.states.tree = { p: [sl.x, sl.y, sl.z], q: [q.x, q.y, q.z, q.w], color: b.color };
        b.row = sl.row;
      });
    const bricks = qb;
    const starPos = [0, TREE_TOP + 0.8, -0.5];
    const starHidden = [0, TREE_TOP + 5, -0.5];

    const go = (mode) => {
      const now = performance.now();
      if (now < state.busyUntil) return;
      const prev = state.mode;
      state.mode = mode;
      if (ref.current) ref.current.dataset.mode = mode;
      if (mode === 'explode') {
        scene.faceFront(false);
        // desarmado: inverso al montaje, de la última pieza a la primera
        scene.goTo('explode', { duration: 900, ease: 'cubic', delayFn: (b) => (b.step ? (maxStep - b.step) * 2.5 : 0) });
        state.busyUntil = now + 450;
      } else if (mode === 'tree') {
        scene.faceFront(true, -0.35);
        scene.moveStar(starPos, 1, 9 * 90 + 600);
        scene.fitTo('tree');
        // las mismas piezas encastran en el árbol, de la maceta a la punta
        scene.goTo('tree', { duration: 850, ease: 'back', delayFn: (b) => b.row * 90 + rnd() * 70 });
        state.busyUntil = now + 1400;
      } else {
        scene.faceFront(true, -0.35); // tres cuartos: se ve el espesor
        scene.fitTo('logo');
        scene.moveStar(starHidden, 0.001);
        // montaje: pieza por pieza, en el orden del manual
        scene.goTo('logo', { duration: 700, ease: 'back', delayFn: (b) => (prev === 'tree' ? 200 : 0) + b.step * (prev === 'tree' ? 12 : 3) });
        state.busyUntil = now + (prev === 'tree' ? 1600 : 800);
      }
    };

    try {
      scene = new LegoScene(ref.current, {
        reduceMotion: !!reduce,
        autoRotate: true,
        tilt: 0.36,
        fit: 'logo',
        onHover: (b, e) => {
          if (e.type === 'pointerleave') {
            state.armed = true;
            if (state.mode === 'explode') go('logo');
            return;
          }
          if (b && e.pointerType === 'mouse' && state.mode === 'logo' && state.armed) go('explode');
        },
        onPick: (b) => {
          if (state.mode === 'logo') go('explode');
          else if (state.mode === 'explode' && b) go('tree');
          else if (state.mode === 'tree') {
            state.armed = false; // que no se desarme apenas vuelve la Q
            go('logo');
          }
        },
      });
    } catch {
      return undefined; // sin WebGL: el hero queda solo con la tipografía
    }

    try {
      scene.setBricks(bricks, 'logo');
    } catch (err) {
      console.warn('LegoHero: no se pudo armar la Q', err);
      scene.dispose();
      return undefined;
    }
    scene.angle = -0.35;
    scene.faceFront(true, -0.35); // tres cuartos: se ve el espesor
    scene.setStar(starHidden, false);
    if (dropIn && !reduce) {
      const order = [...qb].sort((a, b) => a.step - b.step).map((b) => b.id);
      scene.dropIn(order, 6, 14);
      state.busyUntil = performance.now() + order.length * 14 + 700;
    }
    scene.fit();

    return () => scene.dispose();
  }, [dropIn, reduce, variant]);

  return <div ref={ref} className="lego-hero" aria-hidden="true" />;
}
