import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { LegoScene, BRICK_H } from '../lib/lego3d.js';
import { mulberry32 } from '../lib/assign.js';
import isoRaw from '../assets/iso-qs.svg?raw';

// Isotipo de QuartzSales hecho con piezas triangulares tipo "wedge plate".
// El hover lo desarma en ladrillos 1×1; al tocar una pieza, los ladrillos arman
// un arbolito. Otro click vuelve al logo. Sin avisos: se descubre jugando.

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
const LOGO_SCALE = 0.115; // 100 unidades del viewBox → ~11.5 studs
const GRAD = [
  [0, '#3C9FF1'],
  [0.03, '#3C96EF'],
  [0.42, '#463DE1'],
  [0.6, '#5932E0'],
  [0.83, '#6A28E0'],
  [1, '#7025E0'],
];

function gradAt(t) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < GRAD.length; i++) {
    if (t <= GRAD[i][0]) {
      const [t0, c0] = GRAD[i - 1];
      const [t1, c1] = GRAD[i];
      return new THREE.Color(c0).lerp(new THREE.Color(c1), (t - t0) / (t1 - t0));
    }
  }
  return new THREE.Color(GRAD[GRAD.length - 1][1]);
}

/** Saca los 18 triángulos del isotipo (vértices aproximados) del SVG. */
function logoTriangles() {
  const d = (isoRaw.match(/ d="([^"]+)"/) || [])[1] || '';
  return d
    .split(/(?=M)/)
    .filter((x) => x.trim())
    .map((sp) => {
      // el navegador interpreta el trazado (curvas, H, V…) y lo recorremos
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', sp);
      const len = path.getTotalLength();
      const pts = [];
      for (let i = 0; i < 48; i++) {
        const pt = path.getPointAtLength((i / 48) * len);
        pts.push([pt.x, pt.y]);
      }
      const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
      const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
      const v1 = pts.reduce((a, p) => (dist(p, c) > dist(a, c) ? p : a));
      const v2 = pts.reduce((a, p) => (dist(p, v1) > dist(a, v1) ? p : a));
      const area = (p) => Math.abs((v2[0] - v1[0]) * (p[1] - v1[1]) - (p[0] - v1[0]) * (v2[1] - v1[1]));
      const v3 = pts.reduce((a, p) => (area(p) > area(a) ? p : a));
      const cx = (v1[0] + v2[0] + v3[0]) / 3;
      const cy = (v1[1] + v2[1] + v3[1]) / 3;
      return { v: [v1, v2, v3], c: [cx, cy] };
    });
}

/** Pieza triangular con perillas, centrada en su baricentro, mirando a +z. */
function buildWedge(tri, color, studGeo, mat) {
  const s = LOGO_SCALE;
  const [cx, cy] = tri.c;
  const local = tri.v.map(([x, y]) => new THREE.Vector2((x - cx) * s * 0.94, -(y - cy) * s * 0.94));
  const shape = new THREE.Shape(local);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.32, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
  const m = mat.clone();
  m.color = color;
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geo, m));
  // perillas en grilla, solo donde entran completas
  const inner = local.map((p) => p.clone().multiplyScalar(0.62));
  const inTri = (x, y) => {
    const [a, b, c] = inner;
    const sgn = (p1, p2) => (x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (y - p2.y);
    const d1 = sgn(a, b);
    const d2 = sgn(b, c);
    const d3 = sgn(c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  const spots = [];
  const step = 0.56;
  for (let y = -2; y <= 2; y += step) for (let x = -2; x <= 2; x += step) if (inTri(x, y)) spots.push([x, y]);
  if (!spots.length) spots.push([0, 0]);
  const studs = new THREE.InstancedMesh(studGeo, m, spots.length);
  const M = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  spots.forEach(([x, y], i) => {
    M.compose(new THREE.Vector3(x, y, 0.32 + 0.05 + 0.07), q, new THREE.Vector3(0.62, 0.62, 0.62));
    studs.setMatrixAt(i, M);
  });
  group.add(studs);
  group.userData.dispose = () => {
    geo.dispose();
    m.dispose();
    studs.dispose();
  };
  return group;
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
    const wedges = [];
    const state = { mode: 'logo', armed: true, busyUntil: 0 };
    const { cells, top } = buildTree();
    const rnd = mulberry32(7);
    const midY = top / 2 + 0.8;
    const tris = logoTriangles();
    const toWorld = ([x, y]) => [(x - 50) * LOGO_SCALE, midY + (50 - y) * LOGO_SCALE];
    const triColor = tris.map((t) => gradAt((t.c[0] - 7 + (t.c[1] - 4)) / 178));

    const bricks = cells.map((c, i) => {
      const len = Math.hypot(c.x, c.z);
      const a = rnd() * Math.PI * 2;
      const dx = len > 0.01 ? c.x / len : Math.cos(a);
      const dz = len > 0.01 ? c.z / len : Math.sin(a);
      const dist = 1.8 + rnd() * 3.2;
      // cada ladrillo vuela al triángulo más cercano a su posición
      let best = 0;
      let bestD = Infinity;
      tris.forEach((t, k) => {
        const [wx, wy] = toWorld(t.c);
        const dd = (wx - c.x * 1.2) ** 2 + (wy - c.y) ** 2 + rnd() * 6;
        if (dd < bestD) {
          bestD = dd;
          best = k;
        }
      });
      const [lx, ly] = tris.length ? toWorld(tris[best].c) : [0, midY];
      return {
        id: 'b' + i,
        w: 1,
        d: 1,
        color: c.color,
        studs: [[0, 0]],
        layer: c.layer,
        states: {
          tree: { p: [c.x, c.y, c.z], color: c.color },
          explode: { p: [c.x + dx * dist, Math.max(0.6, c.y + (rnd() - 0.3) * 2.6), c.z + dz * dist * 0.8], q: randomQuat(rnd, Math.PI * 0.85), color: c.color },
          logo: { p: [lx, ly, 0.2], q: randomQuat(rnd, Math.PI * 0.5), s: [0.001, 0.001, 0.001], color: tris.length ? '#' + triColor[best].getHexString() : c.color },
        },
      };
    });

    // Secuencia: logo → (hover) se desarma → (click en una pieza) árbol → (click) logo.
    const go = (mode) => {
      const now = performance.now();
      if (now < state.busyUntil) return;
      const prev = state.mode;
      state.mode = mode;
      if (mode === 'explode') {
        scene.faceFront(false);
        if (prev === 'logo') wedges.forEach((w, k) => scene.tweenScale(w, 0, { delay: k * 10, duration: 260, back: false }));
        scene.goTo('explode', { duration: 900, ease: 'cubic', delayFn: () => (prev === 'logo' ? 80 : 0) + rnd() * 180 });
        state.busyUntil = now + 450;
      } else if (mode === 'tree') {
        scene.faceFront(false);
        scene.goTo('tree', { duration: 850, ease: 'back', delayFn: (b) => b.layer * 30 + rnd() * 60 });
        scene.moveStar([0, top + 0.9, 0], 1, 700);
        state.busyUntil = now + 900;
      } else {
        scene.faceFront(true);
        scene.goTo('logo', { duration: 800, ease: 'cubic', delayFn: () => rnd() * 260 });
        scene.moveStar([0, midY, -2], 0.001);
        wedges.forEach((w, k) => scene.tweenScale(w, 1, { delay: 520 + k * 45, duration: 700 }));
        state.busyUntil = now + 1400;
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
            if (state.mode === 'explode') go('logo');
            return;
          }
          if (e.pointerType === 'mouse' && state.mode === 'logo' && state.armed && scene.pickObjects(e, wedges)) go('explode');
        },
        onPick: (b, e) => {
          if (state.mode === 'logo') go('explode');
          else if (state.mode === 'explode' && b) go('tree');
          else if (state.mode === 'tree') {
            state.armed = false; // que no se desarme apenas vuelve el logo
            go('logo');
          }
        },
      });
    } catch {
      return undefined; // sin WebGL: el hero queda solo con la tipografía
    }

    // Arranca como logo: los ladrillos están "dentro" de cada triángulo.
    scene.setBricks(bricks, 'logo');
    scene.angle = 0;
    scene.faceFront(true);
    const studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 20);
    tris.forEach((t, k) => {
      const w = buildWedge(t, triColor[k], studGeo, scene.mat);
      const [x, y] = toWorld(t.c);
      w.position.set(x, y, 0);
      w.scale.setScalar(0.001);
      w.visible = false;
      scene.root.add(w);
      wedges.push(w);
    });
    scene.setStar([0, top + 0.9, 0], false);
    if (dropIn && !reduce) {
      // entrada: los triángulos encastran uno por uno
      wedges.forEach((w, k) => scene.tweenScale(w, 1, { delay: 200 + k * 70, duration: 700 }));
      state.busyUntil = performance.now() + 200 + wedges.length * 70 + 500;
    } else {
      wedges.forEach((w) => scene.tweenScale(w, 1, { duration: 1 }));
    }
    scene.fit();

    return () => {
      wedges.forEach((w) => w.userData.dispose());
      studGeo.dispose();
      scene.dispose();
    };
  }, [dropIn, reduce]);

  return <div ref={ref} className="lego-hero" aria-hidden="true" />;
}
