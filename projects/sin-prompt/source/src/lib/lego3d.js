// ─────────────────────────────────────────────────────────────────────────────
// Motor de ladrillos en Three.js.
// 1 unidad = 1 stud. Cada ladrillo es una instancia de una caja unitaria
// escalada (w × h × d) + una instancia de perilla por stud. Cada ladrillo puede
// tener varios "estados" (árbol, desarmado, logo…) y el motor interpola entre
// ellos con escalonado. Así un mismo set de piezas se transforma en otra cosa.
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { partGeometry, PART_LEN, PART_HEIGHT } from './legoParts.js';

const UP = new THREE.Vector3(0, 1, 0);
const tmpM = new THREE.Matrix4();
const tmpM2 = new THREE.Matrix4();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const BRICK_H = 1.2;
const GAP = 0.03; // separación mínima: deja leer cada pieza sin "rendijas"

function starGeometry() {
  const shape = new THREE.Shape();
  const pts = 10;
  for (let i = 0; i < pts; i++) {
    const r = i % 2 === 0 ? 1 : 0.45;
    const a = (i / pts) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  g.center();
  return g;
}

/**
 * bricks: [{ id, w, d, h?, color, studs?: [[lx, lz], …], states: { name: { p:[x,y,z], q?:[x,y,z,w], s?:[x,y,z] } }, meta }]
 * ghosts: [{ w, d, h?, p:[x,y,z] }]   (contornos punteados de piezas pendientes)
 */
export class LegoScene {
  constructor(container, { reduceMotion = false, autoRotate = true, tilt = 0.32, onHover, onPick, fit = 'tree' } = {}) {
    this.el = container;
    this.reduce = reduceMotion;
    this.autoRotate = autoRotate && !reduceMotion;
    this.onHover = onHover;
    this.onPick = onPick;
    this.tilt = tilt;
    this.fitMode = fit;
    this.angle = -0.5;
    this.targetAngle = null;
    this.paused = false;
    this.anims = new Map();
    this.objTweens = [];
    this.state = null;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    container.appendChild(r.domElement);
    r.domElement.style.display = 'block';

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8f7fd6, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(6, 14, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    key.shadow.bias = -0.0008;
    key.shadow.radius = 4;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xc9b4ff, 0.9);
    rim.position.set(-8, 6, -6);
    this.scene.add(rim);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16, color: 0x2a1580 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.floor = floor;
    this.scene.add(floor);

    this.boxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 20);
    this.mat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.02 });

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.bindEvents();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.io.observe(container);
    this.resize();
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ── Datos ────────────────────────────────────────────────────────────────
  setBricks(bricks, initialState, ghosts = []) {
    this.clearMeshes();
    this.bricks = bricks;
    // Piezas tipadas (referencia LEGO real): una malla instanciada por tipo, sin escalar.
    const typedList = bricks.filter((b) => b.type);
    const legacy = bricks.filter((b) => !b.type);
    this.legacyList = legacy;
    this.typed = new Map();
    typedList.forEach((b) => {
      if (!this.typed.has(b.type)) this.typed.set(b.type, { list: [] });
      const t = this.typed.get(b.type);
      b._i = t.list.length;
      t.list.push(b);
      b.w = b.w || PART_LEN[b.type];
      b.d = b.d || (b.type === '3003' ? 2 : 1);
      b.h = b.h || PART_HEIGHT[b.type];
    });
    for (const [type, t] of this.typed) {
      t.mesh = new THREE.InstancedMesh(partGeometry(type), this.mat, t.list.length);
      t.mesh.castShadow = t.mesh.receiveShadow = true;
      t.mesh.userData.type = type;
    }
    const n = legacy.length;
    const studCount = legacy.reduce((a, b) => a + (b.studs?.length || 0), 0);
    this.mesh = new THREE.InstancedMesh(this.boxGeo, this.mat, Math.max(1, n));
    this.studs = new THREE.InstancedMesh(this.studGeo, this.mat, Math.max(1, studCount));
    this.mesh.castShadow = this.studs.castShadow = true;
    this.mesh.receiveShadow = this.studs.receiveShadow = true;
    this.mesh.count = n;
    this.studs.count = studCount;
    const color = new THREE.Color();
    let si = 0;
    bricks.forEach((b) => {
      color.set(b.color);
      b.curC = color.clone();
      if (b.type) {
        this.typed.get(b.type).mesh.setColorAt(b._i, color);
      } else {
        b._i = legacy.indexOf(b);
        b._studStart = si;
        this.mesh.setColorAt(b._i, color);
        (b.studs || []).forEach(() => this.studs.setColorAt(si++, color));
      }
      const st = b.states[initialState] || b.states[Object.keys(b.states)[0]];
      b.cur = { p: new THREE.Vector3(...st.p), q: new THREE.Quaternion(...(st.q || [0, 0, 0, 1])), s: new THREE.Vector3(...(st.s || [1, 1, 1])) };
      this.writeBrick(b);
    });
    this.root.add(this.mesh, this.studs);
    for (const t of this.typed.values()) this.root.add(t.mesh);
    this.markDirty();
    this.flagColors();

    this.ghostData = ghosts;
    this.ghostGroup = new THREE.Group();
    const gmat = new THREE.LineDashedMaterial({ color: 0xa172ff, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.55 });
    ghosts.forEach((g) => {
      const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(g.w - GAP, (g.h || BRICK_H) - GAP, g.d - GAP));
      const line = new THREE.LineSegments(geo, gmat);
      line.computeLineDistances();
      line.position.set(...g.p);
      this.ghostGroup.add(line);
    });
    this.root.add(this.ghostGroup);
    this.state = initialState;
    this.fit();
  }

  setStar(pos, visible = true) {
    if (!this.star) {
      this.star = new THREE.Mesh(starGeometry(), new THREE.MeshStandardMaterial({ color: 0xa172ff, emissive: 0x7025e0, emissiveIntensity: 0.35, roughness: 0.3 }));
      this.star.castShadow = true;
      this.root.add(this.star);
      this.starHome = new THREE.Vector3();
    }
    this.starHome.set(...pos);
    this.star.position.copy(this.starHome);
    this.star.scale.setScalar(visible ? 1 : 0.001);
    this.starTarget = { p: this.starHome.clone(), s: visible ? 1 : 0.001 };
  }

  moveStar(pos, scale, delay = 0) {
    if (!this.star) return;
    this.starAnim = { fromP: this.star.position.clone(), toP: new THREE.Vector3(...pos), fromS: this.star.scale.x, toS: scale, t0: performance.now() + delay, dur: this.reduce ? 1 : 900 };
  }

  allMeshes() {
    return [this.mesh, this.studs, ...[...(this.typed?.values() || [])].map((t) => t.mesh)].filter(Boolean);
  }

  markDirty() {
    this.allMeshes().forEach((m) => (m.instanceMatrix.needsUpdate = true));
  }

  clearMeshes() {
    this.allMeshes().forEach((m) => {
      this.root.remove(m);
      m.dispose();
    });
    this.mesh = this.studs = null;
    this.typed = new Map();
    if (this.ghostGroup) {
      this.ghostGroup.children.forEach((c) => c.geometry.dispose());
      this.root.remove(this.ghostGroup);
    }
    this.anims.clear();
  }

  writeBrick(b) {
    if (b.type) {
      tmpM.compose(b.cur.p, b.cur.q, b.cur.s);
      this.typed.get(b.type).mesh.setMatrixAt(b._i, tmpM);
      return;
    }
    const { p, q, s } = b.cur;
    const h = b.h || BRICK_H;
    tmpS.set(s.x * (b.w - GAP), s.y * (h - GAP), s.z * (b.d - GAP));
    tmpM.compose(p, q, tmpS);
    this.mesh.setMatrixAt(b._i, tmpM);
    if (b.studs?.length) {
      const us = Math.min(s.x, s.z);
      tmpM2.compose(p, q, tmpP.set(1, 1, 1));
      b.studs.forEach(([lx, lz], k) => {
        tmpP.set(lx * s.x, (h * s.y) / 2 + 0.11 * us, lz * s.z);
        tmpM.compose(tmpP, tmpQ.identity(), tmpS.set(us, us, us));
        tmpM.premultiply(tmpM2);
        this.studs.setMatrixAt(b._studStart + k, tmpM);
      });
    }
  }

  // ── Transiciones ─────────────────────────────────────────────────────────
  /** Lleva todas las piezas al estado `name`. delayFn(b, i) → ms. */
  goTo(name, { duration = 900, delayFn = () => 0, ease = 'back' } = {}) {
    this.state = name;
    const now = performance.now();
    this.bricks.forEach((b, i) => {
      const st = b.states[name];
      if (!st) return;
      const to = { p: new THREE.Vector3(...st.p), q: new THREE.Quaternion(...(st.q || [0, 0, 0, 1])), s: new THREE.Vector3(...(st.s || [1, 1, 1])) };
      const toC = new THREE.Color(st.color || b.color);
      if (this.reduce) {
        b.cur = to;
        b.curC = toC;
        this.writeBrick(b);
        this.writeColor(b, toC);
        return;
      }
      this.anims.set(b, { from: { p: b.cur.p.clone(), q: b.cur.q.clone(), s: b.cur.s.clone() }, to, fromC: (b.curC || new THREE.Color(b.color)).clone(), toC, t0: now + delayFn(b, i), dur: duration, ease: ease === 'back' ? easeOutBack : easeOutCubic });
    });
    if (this.reduce) this.flagColors(), (this.markDirty());
  }

  writeColor(b, c) {
    if (b.type) {
      this.typed.get(b.type).mesh.setColorAt(b._i, c);
      return;
    }
    this.mesh.setColorAt(b._i, c);
    for (let k = 0; k < (b.studs?.length || 0); k++) this.studs.setColorAt(b._studStart + k, c);
  }

  flagColors() {
    this.allMeshes().forEach((m) => m.instanceColor && (m.instanceColor.needsUpdate = true));
  }

  /** Anima una sola pieza desde `fromState` (p. ej. la que acaba de encastrar). */
  dropIn(ids, fromOffsetY = 8, stagger = 60) {
    if (this.reduce) return;
    const now = performance.now();
    let k = 0;
    const byId = new Map(this.bricks.map((b) => [b.id, b]));
    ids.forEach((id) => {
      const b = byId.get(id);
      if (!b) return;
      const to = { p: b.cur.p.clone(), q: b.cur.q.clone(), s: b.cur.s.clone() };
      const from = { p: to.p.clone().add(new THREE.Vector3(0, fromOffsetY, 0)), q: to.q.clone(), s: to.s.clone() };
      b.cur = { p: from.p.clone(), q: from.q.clone(), s: from.s.clone() };
      this.writeBrick(b);
      this.anims.set(b, { from, to, t0: now + k++ * stagger, dur: 800, ease: easeOutBack });
    });
    this.markDirty();
  }

  /** Anima la escala de un Object3D (p. ej. las piezas del logo). */
  tweenScale(obj, to, { delay = 0, duration = 600, back = true } = {}) {
    this.objTweens = this.objTweens.filter((t) => t.obj !== obj);
    if (this.reduce) {
      obj.scale.setScalar(Math.max(0.001, to));
      obj.visible = to > 0.01;
      return;
    }
    obj.visible = true;
    this.objTweens.push({ obj, from: obj.scale.x, to: Math.max(0.001, to), t0: performance.now() + delay, dur: duration, ease: back ? easeOutBack : easeOutCubic });
  }

  /** Vista fija: ángulo de giro (rad) e inclinación de cámara (rad). */
  lookFrom(angle, tilt) {
    this.sway = false;
    this.tilt = tilt;
    this.targetAngle = angle + Math.round(this.angle / (Math.PI * 2)) * Math.PI * 2;
    this.fitTo(this.fitMode);
  }

  /** Agrega o reemplaza un estado en todas las piezas. fn(b) → estado. */
  defineState(name, fn) {
    this.bricks.forEach((b) => (b.states[name] = fn(b)));
  }

  faceFront(on, offset = 0) {
    this.sway = true;
    this.targetAngle = on ? Math.round(this.angle / (Math.PI * 2)) * Math.PI * 2 + offset : null;
  }

  // ── Cámara ───────────────────────────────────────────────────────────────
  /** Reencuadra la cámara para un estado; con animate la mueve suave. */
  fitTo(stateName, animate = true) {
    const prev = this.fitMode;
    this.fitMode = stateName;
    const from = { pos: this.camera.position.clone(), look: (this.lookAt || new THREE.Vector3()).clone() };
    this.fit();
    if (!animate || this.reduce) return;
    const to = { pos: this.camera.position.clone(), look: this.lookAt.clone() };
    this.camera.position.copy(from.pos);
    this.camera.lookAt(from.look);
    this.camAnim = { from, to, t0: performance.now(), dur: 1100 };
    void prev;
  }

  fit() {
    if (!this.bricks?.length) return;
    const box = new THREE.Box3();
    this.bricks.forEach((b) => {
      const st = b.states[this.fitMode] || b.states[this.state];
      const sc = st.s || [1, 1, 1];
      if (sc[0] < 0.01) return;
      const y0 = b.type ? st.p[1] : st.p[1] - BRICK_H / 2;
      const y1 = b.type ? st.p[1] + (b.h || BRICK_H) : st.p[1] + BRICK_H / 2;
      box.expandByPoint(new THREE.Vector3(st.p[0] - b.w / 2, y0, st.p[2] - b.d / 2));
      box.expandByPoint(new THREE.Vector3(st.p[0] + b.w / 2, y1, st.p[2] + b.d / 2));
    });
    (this.ghostData || []).forEach((g) => {
      box.expandByPoint(new THREE.Vector3(g.p[0] - g.w / 2, g.p[1] - BRICK_H / 2, g.p[2] - g.d / 2));
      box.expandByPoint(new THREE.Vector3(g.p[0] + g.w / 2, g.p[1] + BRICK_H / 2, g.p[2] + g.d / 2));
    });
    if (this.star && this.fitMode === 'tree') box.expandByPoint((this.starAnim ? this.starAnim.toP : this.star.position).clone().add(new THREE.Vector3(0, 1.1, 0)));
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const aspect = this.camera.aspect;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    // ancho que barre al girar (un árbol cuadrado) o ancho de frente (la Q, plana)
    const sweep = Math.hypot(size.x, size.z);
    const needH = size.y * 1.28;
    const needW = sweep * 1.22;
    const distH = needH / 2 / Math.tan(vFov / 2);
    const distW = needW / 2 / Math.tan(vFov / 2) / aspect;
    const dist = Math.max(distH, distW) + Math.min(size.x, size.z) * 0.75;
    this.lookAt = center;
    this.camera.position.set(0, center.y + Math.sin(this.tilt) * dist, Math.cos(this.tilt) * dist);
    this.camera.lookAt(center);
  }

  resize() {
    const w = this.el.clientWidth || 1;
    const h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.camAnim = null;
    this.fit();
  }

  // ── Interacción ──────────────────────────────────────────────────────────
  pick(e) {
    if (!this.mesh) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // las piezas se mueven: el volumen de detección se recalcula
    const meshes = [this.mesh, ...[...this.typed.values()].map((t) => t.mesh)];
    meshes.forEach((m) => m.computeBoundingSphere());
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    if (hit.object === this.mesh) return this.legacyList[hit.instanceId] || null;
    return this.typed.get(hit.object.userData.type)?.list[hit.instanceId] || null;
  }

  bindEvents() {
    const c = this.renderer.domElement;
    this.handlers = {
      move: (e) => {
        if (this.drag) {
          this.angle = this.drag.a + (e.clientX - this.drag.x) * 0.008;
          if (Math.abs(e.clientX - this.drag.x) > 4) this.drag.moved = true;
          return;
        }
        this.onHover?.(this.pick(e), e);
      },
      leave: (e) => this.onHover?.(null, e),
      down: (e) => {
        if (this.dragEnabled) {
          this.paused = true;
          this.drag = { x: e.clientX, a: this.angle, moved: false };
          c.setPointerCapture?.(e.pointerId);
        }
      },
      up: (e) => {
        const moved = this.drag?.moved;
        this.drag = null;
        clearTimeout(this.resume);
        this.resume = setTimeout(() => (this.paused = false), 2500);
        if (!moved) this.onPick?.(this.pick(e), e);
      },
    };
    c.addEventListener('pointermove', this.handlers.move);
    c.addEventListener('pointerleave', this.handlers.leave);
    c.addEventListener('pointerdown', this.handlers.down);
    c.addEventListener('pointerup', this.handlers.up);
  }

  /** ¿El puntero está sobre alguno de estos objetos? */
  pickObjects(e, objects) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(objects.filter((o) => o.visible), true).length > 0;
  }

  rotateBy(rad) {
    this.paused = true;
    this.angle += rad;
    clearTimeout(this.resume);
    this.resume = setTimeout(() => (this.paused = false), 2500);
  }

  // ── Loop ─────────────────────────────────────────────────────────────────
  loop(t) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(64, t - this.last);
    this.last = t;
    if (!this.visible || document.hidden) return;

    if (this.camAnim) {
      const a = this.camAnim;
      const k = Math.min(1, (t - a.t0) / a.dur);
      const e = easeOutCubic(k);
      this.camera.position.lerpVectors(a.from.pos, a.to.pos, e);
      this.lookAt = a.from.look.clone().lerp(a.to.look, e);
      this.camera.lookAt(this.lookAt);
      if (k >= 1) this.camAnim = null;
    }
    if (this.targetAngle != null) {
      // de frente, con un vaivén leve para que se note el volumen
      const sway = this.reduce || this.sway === false ? 0 : Math.sin(t * 0.0007) * 0.16;
      this.angle += (this.targetAngle + sway - this.angle) * Math.min(1, dt * 0.006);
    }
    else if (this.autoRotate && !this.paused) this.angle += dt * 0.00018;
    this.root.rotation.y = this.angle;

    if (this.anims.size) {
      let colorDirty = false;
      for (const [b, a] of this.anims) {
        const k = (t - a.t0) / a.dur;
        if (k < 0) continue;
        const e = k >= 1 ? 1 : a.ease(k);
        b.cur.p.lerpVectors(a.from.p, a.to.p, e);
        b.cur.q.slerpQuaternions(a.from.q, a.to.q, Math.min(1, k >= 1 ? 1 : easeOutCubic(k)));
        b.cur.s.lerpVectors(a.from.s, a.to.s, Math.min(1, k >= 1 ? 1 : easeOutCubic(k)));
        this.writeBrick(b);
        if (a.toC && !a.fromC.equals(a.toC)) {
          b.curC = (b.curC || new THREE.Color()).lerpColors(a.fromC, a.toC, Math.min(1, Math.max(0, k * 1.4 - 0.2)));
          this.writeColor(b, b.curC);
          colorDirty = true;
        }
        if (k >= 1) this.anims.delete(b);
      }
      if (colorDirty) this.flagColors();
      this.markDirty();
    }
    if (this.objTweens.length) {
      this.objTweens = this.objTweens.filter((tw) => {
        const k = (t - tw.t0) / tw.dur;
        if (k < 0) return true;
        const e = k >= 1 ? 1 : tw.ease(k);
        tw.obj.scale.setScalar(Math.max(0.001, tw.from + (tw.to - tw.from) * e));
        if (k >= 1) {
          tw.obj.visible = tw.to > 0.01;
          return false;
        }
        return true;
      });
    }
    if (this.starAnim && this.star) {
      const a = this.starAnim;
      const k = (t - a.t0) / a.dur;
      if (k >= 0) {
        const e = k >= 1 ? 1 : easeOutBack(k);
        this.star.position.lerpVectors(a.fromP, a.toP, e);
        this.star.scale.setScalar(Math.max(0.001, a.fromS + (a.toS - a.fromS) * Math.min(1, e)));
        if (k >= 1) this.starAnim = null;
      }
    }
    if (this.star) this.star.rotation.y += this.reduce ? 0 : dt * 0.0015;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    const c = this.renderer.domElement;
    c.removeEventListener('pointermove', this.handlers.move);
    c.removeEventListener('pointerleave', this.handlers.leave);
    c.removeEventListener('pointerdown', this.handlers.down);
    c.removeEventListener('pointerup', this.handlers.up);
    this.clearMeshes();
    this.boxGeo.dispose();
    this.studGeo.dispose();
    this.mat.dispose();
    this.renderer.dispose();
    c.remove();
  }
}

export { UP };
