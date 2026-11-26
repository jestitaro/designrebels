import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { LegoScene, BRICK_H } from '../lib/lego3d.js';
import { mulberry32 } from '../lib/assign.js';
import isoRaw from '../assets/iso-qs.svg?raw';

// Árbol de ladrillos 1×1 que se desarma con hover y, al tocar una pieza, se
// rearma como el isotipo de QuartzSales en mosaico de Lego. Sin avisos: se
// descubre jugando.

const TIERS = [9, 7, 5, 7, 5, 3, 5, 3, 1]; // tres "pisos" de ramas, como un pino
const TRUNK = 3;
const TRUNK_LAYERS = 2;
const LAYER_TONES = [
  ['#7025E0', '#7B33E6'],
  ['#A172FF', '#9563FA'],
  ['#5B2BD1', '#6534DA'],
  ['#8B4BF0', '#9A5EF5'],
];
const ORNAMENT = '#3C9FF1';
const LOGO_N = 40;
const LOGO_GAP = 0.36;
const GRAD = [
  [0, '#3C9FF1'],
  [0.03, '#3C96EF'],
  [0.42, '#463DE1'],
  [0.6, '#5932E0'],
  [0.83, '#6A28E0'],
  [1, '#7025E0'],
];

function gradAt(t) {
  for (let i = 1; i < GRAD.length; i++) {
    if (t <= GRAD[i][0]) {
      const [t0, c0] = GRAD[i - 1];
      const [t1, c1] = GRAD[i];
      return '#' + new THREE.Color(c0).lerp(new THREE.Color(c1), (t - t0) / (t1 - t0)).getHexString();
    }
  }
  return GRAD[GRAD.length - 1][1];
}

/**
 * Rasteriza el isotipo a una grilla N×N. Cada triángulo se dibuja por separado
 * y achicado hacia su centro, así en el mosaico quedan separados como en la marca.
 */
function rasterLogo(n) {
  const d = (isoRaw.match(/ d="([^"]+)"/) || [])[1];
  if (!d) return Promise.resolve([]);
  const subpaths = d.split(/(?=M)/).filter((x) => x.trim());
  const SS = 6; // supermuestreo
  const c = document.createElement('canvas');
  c.width = c.height = n * SS;
  const ctx = c.getContext('2d');
  const scale = (n * SS) / 100; // viewBox 0 0 100 100
  ctx.fillStyle = '#000';
  subpaths.forEach((sp) => {
    const nums = sp.match(/-?\d*\.?\d+/g).map(Number);
    let cx = 0;
    let cy = 0;
    const k = Math.floor(nums.length / 2);
    for (let i = 0; i < k; i++) {
      cx += nums[i * 2];
      cy += nums[i * 2 + 1];
    }
    cx /= k;
    cy /= k;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(cx, cy);
    ctx.scale(0.8, 0.8);
    ctx.translate(-cx, -cy);
    ctx.fill(new Path2D(sp));
    ctx.restore();
  });
  const data = ctx.getImageData(0, 0, n * SS, n * SS).data;
  const cells = [];
  for (let row = 0; row < n; row++)
    for (let col = 0; col < n; col++) {
      let cover = 0;
      for (let y = 0; y < SS; y++) for (let x = 0; x < SS; x++) if (data[((row * SS + y) * n * SS + col * SS + x) * 4 + 3] > 128) cover++;
      if (cover / (SS * SS) > 0.5) cells.push([col, row]);
    }
  return Promise.resolve(cells);
}

function buildTree() {
  const rnd = mulberry32(2026);
  const cells = [];
  for (let k = 0; k < TRUNK_LAYERS; k++) {
    const h = (TRUNK - 1) / 2;
    for (let x = -h; x <= h; x++) for (let z = -h; z <= h; z++) cells.push({ x, y: k * BRICK_H + BRICK_H / 2, z, color: '#130D5D', layer: k });
  }
  const base = TRUNK_LAYERS * BRICK_H;
  TIERS.forEach((S, k) => {
    const h = (S - 1) / 2;
    for (let x = -h; x <= h; x++)
      for (let z = -h; z <= h; z++) {
        const edge = Math.abs(x) === h || Math.abs(z) === h;
        // cada capa tiene su tono, con variación sutil y alguna "esfera" celeste en el borde
        const tone = LAYER_TONES[k % LAYER_TONES.length];
        const color = edge && rnd() < 0.08 ? ORNAMENT : rnd() < 0.18 ? tone[1] : tone[0];
        cells.push({ x, y: base + k * BRICK_H + BRICK_H / 2, z, color, layer: TRUNK_LAYERS + k });
      }
  });
  return { cells, top: base + TIERS.length * BRICK_H };
}

function randomQuat(rnd, maxAngle) {
  const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(axis, (rnd() * 0.6 + 0.4) * maxAngle);
  return [q.x, q.y, q.z, q.w];
}

export default function LegoHero({ dropIn = false }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let scene;
    let alive = true;
    const state = { mode: 'tree', armed: true, busyUntil: 0 };

    (async () => {
      const logoCells = await rasterLogo(LOGO_N);
      if (!alive || !ref.current) return;
      const { cells, top } = buildTree();
      const rnd = mulberry32(7);

      // Árbol de arriba hacia abajo ↔ logo de arriba hacia abajo: el flujo se lee.
      const treeOrder = cells.map((c, i) => i).sort((a, b) => cells[b].y - cells[a].y || cells[a].x - cells[b].x || cells[a].z - cells[b].z);
      const logoOrder = logoCells.map((c, i) => i).sort((a, b) => logoCells[a][1] - logoCells[b][1] || logoCells[a][0] - logoCells[b][0]);
      const total = Math.max(cells.length, logoCells.length);
      const midY = top / 2 + 0.6;
      const logoQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      const LQ = [logoQ.x, logoQ.y, logoQ.z, logoQ.w];
      const hidden = { p: [0, midY, 0], s: [0.001, 0.001, 0.001] };

      const bricks = [];
      for (let i = 0; i < total; i++) {
        const c = i < treeOrder.length ? cells[treeOrder[i]] : null;
        const l = i < logoOrder.length ? logoCells[logoOrder[i]] : null;
        const states = {};
        if (c) {
          states.tree = { p: [c.x, c.y, c.z], color: c.color };
          const len = Math.hypot(c.x, c.z);
          const a = rnd() * Math.PI * 2;
          const dx = len > 0.01 ? c.x / len : Math.cos(a);
          const dz = len > 0.01 ? c.z / len : Math.sin(a);
          const dist = 1.8 + rnd() * 3.2;
          states.explode = { p: [c.x + dx * dist, Math.max(0.6, c.y + (rnd() - 0.3) * 2.6), c.z + dz * dist * 0.8], q: randomQuat(rnd, Math.PI * 0.85), color: c.color };
        } else {
          states.tree = { ...hidden, color: '#7025E0' };
          states.explode = states.tree;
        }
        if (l) {
          const [col, row] = l;
          states.logo = {
            p: [(col - (LOGO_N - 1) / 2) * LOGO_GAP, midY + ((LOGO_N - 1) / 2 - row) * LOGO_GAP, 0],
            q: LQ,
            s: [LOGO_GAP / 1, 0.2, LOGO_GAP / 1],
            color: gradAt((col + row) / (2 * (LOGO_N - 1))),
          };
        } else {
          states.logo = { ...hidden, color: c?.color || '#7025E0' };
        }
        bricks.push({ id: 'b' + i, w: 1, d: 1, color: states.tree.color, studs: [[0, 0]], layer: c?.layer ?? 0, states });
      }

      const go = (mode) => {
        const now = performance.now();
        if (now < state.busyUntil && mode !== 'tree') return;
        const prev = state.mode;
        state.mode = mode;
        if (mode === 'explode') {
          scene.goTo('explode', { duration: 900, ease: 'cubic', delayFn: () => rnd() * 140 });
          scene.moveStar([0, top + 3.2, 0], 1);
          state.busyUntil = now + 350;
        } else if (mode === 'logo') {
          scene.faceFront(true);
          scene.goTo('logo', { duration: 1200, ease: 'back', delayFn: (b, i) => i * 2.2 });
          scene.moveStar([0, midY, -2], 0.001);
          state.busyUntil = now + 1400;
        } else {
          scene.faceFront(false);
          scene.goTo('tree', { duration: prev === 'logo' ? 1100 : 800, ease: 'back', delayFn: (b) => b.layer * (prev === 'logo' ? 70 : 25) + rnd() * 60 });
          scene.moveStar([0, top + 0.9, 0], 1, prev === 'logo' ? 900 : 200);
          state.busyUntil = now + 500;
        }
      };

      try {
      scene = new LegoScene(ref.current, {
        reduceMotion: !!reduce,
        autoRotate: true,
        tilt: 0.3,
        onHover: (b, e) => {
          if (e.type === 'pointerleave') {
            state.armed = true;
            if (state.mode === 'explode') go('tree');
            return;
          }
          if (b && e.pointerType === 'mouse' && state.mode === 'tree' && state.armed) go('explode');
        },
        onPick: (b) => {
          if (state.mode === 'tree') go('explode');
          else if (state.mode === 'explode' && b) go('logo');
          else if (state.mode === 'logo') {
            state.armed = false; // que no se desarme apenas se arma
            go('tree');
          }
        },
      });
      } catch {
        return; // sin WebGL: el hero queda solo con la tipografía
      }
      scene.setBricks(bricks, 'tree');
      if (dropIn && !reduce) {
        const bottomUp = [...bricks].filter((b) => b.states.tree.s?.[0] !== 0.001).sort((a, b) => a.states.tree.p[1] - b.states.tree.p[1]).map((b) => b.id);
        scene.setStar([0, top + 0.9, 0], false);
        scene.dropIn(bottomUp, 9, 5);
        scene.moveStar([0, top + 0.9, 0], 1, bottomUp.length * 5 + 700);
        state.busyUntil = performance.now() + bottomUp.length * 5 + 900;
      } else {
        scene.setStar([0, top + 0.9, 0], true);
      }
      scene.fit();
    })();

    return () => {
      alive = false;
      scene?.dispose();
    };
  }, [dropIn, reduce]);

  return <div ref={ref} className="lego-hero" aria-hidden="true" />;
}
