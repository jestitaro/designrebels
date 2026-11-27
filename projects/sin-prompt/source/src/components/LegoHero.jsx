import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { LegoScene, BRICK_H } from '../lib/lego3d.js';
import { mulberry32 } from '../lib/assign.js';
import { Q_MODELS, DEFAULT_Q } from '../lib/legoQModels.js';

// La Q de QuartzSales armada con piezas LEGO reales (ver scripts/build-q.mjs).
// Se construye pieza por pieza en el orden del manual; el hover la desarma
// (animación inversa); al tocar una pieza, se arma el arbolito; otro click
// vuelve a la Q. Sin avisos: se descubre jugando.

const LDU = 20; // 1 unidad de escena = 1 stud
const TIERS = [9, 7, 5, 7, 5, 3, 5, 3, 1];
const TRUNK = 3;
const TRUNK_LAYERS = 2;
const LAYER_TONES = [
  ['#7025E0', '#7B33E6'],
  ['#A172FF', '#9563FA'],
  ['#5B2BD1', '#6534DA'],
  ['#8B4BF0', '#9A5EF5'],
];
const ORNAMENT = '#3C9FF1';
const HIDE = [0.001, 0.001, 0.001];

function buildTree() {
  const rnd = mulberry32(2026);
  const cells = [];
  for (let k = 0; k < TRUNK_LAYERS; k++) {
    const h = (TRUNK - 1) / 2;
    for (let x = -h; x <= h; x++) for (let z = -h; z <= h; z++) cells.push({ x, y: k * BRICK_H, z, color: '#130D5D', layer: k });
  }
  const base = TRUNK_LAYERS * BRICK_H;
  TIERS.forEach((S, k) => {
    const h = (S - 1) / 2;
    for (let x = -h; x <= h; x++)
      for (let z = -h; z <= h; z++) {
        const edge = Math.abs(x) === h || Math.abs(z) === h;
        const tone = LAYER_TONES[k % LAYER_TONES.length];
        const color = edge && rnd() < 0.08 ? ORNAMENT : rnd() < 0.18 ? tone[1] : tone[0];
        cells.push({ x, y: base + k * BRICK_H, z, color, layer: TRUNK_LAYERS + k });
      }
  });
  return { cells, top: base + TIERS.length * BRICK_H };
}

function randomQuat(rnd, maxAngle) {
  const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(axis, (rnd() * 0.6 + 0.4) * maxAngle);
  return [q.x, q.y, q.z, q.w];
}

/** Piezas de la Q como bricks del motor: armada, desarmada y escondida. */
export function qBricks(rnd, { treeCenterY = 6, explodeScale = 1, model = Q_MODELS[DEFAULT_Q] } = {}) {
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
        tree: { p: [x * 0.25, treeCenterY + y * 0.15, 0], q, s: HIDE, color: p.color },
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
    const { cells, top } = buildTree();
    const model = Q_MODELS[variant || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('q')) || DEFAULT_Q] || Q_MODELS[DEFAULT_Q];
    const qb = qBricks(rnd, { treeCenterY: top / 2, explodeScale: 0.6, model });
    const maxStep = qb[0]?.maxStep || 1;

    const tb = cells.map((c, i) => ({
      id: 't' + i,
      type: '3005',
      color: c.color,
      layer: c.layer,
      states: {
        tree: { p: [c.x, c.y, c.z], color: c.color },
        // escondidos arriba de su lugar: al armarse, caen y encastran
        logo: { p: [c.x, c.y + 7 + rnd() * 3, c.z], s: HIDE, color: c.color },
        explode: { p: [c.x, c.y + 7 + rnd() * 3, c.z], s: HIDE, color: c.color },
      },
    }));
    const bricks = [...qb, ...tb];

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
        scene.faceFront(false);
        scene.fitTo('tree');
        scene.goTo('tree', { duration: 850, ease: 'back', delayFn: (b) => (b.step ? rnd() * 300 : 250 + b.layer * 45 + rnd() * 80) });
        scene.moveStar([0, top + 0.9, 0], 1, 1000);
        state.busyUntil = now + 1200;
      } else {
        scene.faceFront(true, -0.35); // tres cuartos: se ve el espesor
        scene.fitTo('logo');
        scene.moveStar([0, top + 6, 0], 0.001);
        // montaje: pieza por pieza, en el orden del manual
        scene.goTo('logo', { duration: 700, ease: 'back', delayFn: (b) => (b.step ? (prev === 'tree' ? 250 : 0) + b.step * (prev === 'tree' ? 7 : 3) : rnd() * 200) });
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
          if (b && b.step && e.pointerType === 'mouse' && state.mode === 'logo' && state.armed) go('explode');
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
    scene.setStar([0, top + 6, 0], false);
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
