import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import Brick from './Brick.jsx';
import { mulberry32 } from '../lib/assign.js';

// ── Geometría (en "studs": 1 unidad = 1 perilla de Lego) ────────────────────
// Cada capa es un cuadrado macizo de S×S studs armado con 4 ladrillos en
// molinete. Si S es impar queda un hueco de 1×1 en el centro que se tapa con
// un ladrillo de relleno. Las capas se achican hacia arriba y forman el cono.
// Pieza i → capa floor(i/4), posición i%4.
const BRICK_H = 1.2; // alto de un ladrillo, proporción Lego
const TRUNK_H = 1.4;

export function treeLayout(total, u) {
  const layers = Math.max(1, Math.ceil(total / 4));
  // Cada capa es 1 stud más chica que la de abajo: nunca dos pisos iguales seguidos.
  const Smin = 2;
  const Smax = Smin + layers - 1;
  const sizes = Array.from({ length: layers }, (_, k) => Smax - k);

  const rects = []; // en studs
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

  const yOf = (k) => -(TRUNK_H + k * BRICK_H + BRICK_H / 2) * u;
  const toPx = (r) => ({
    x: ((r.x0 + r.x1) / 2) * u,
    z: ((r.z0 + r.z1) / 2) * u,
    w: (r.x1 - r.x0) * u,
    d: (r.z1 - r.z0) * u,
    h: BRICK_H * u,
    y: yOf(r.layer),
  });

  const fillers = sizes
    .map((S, k) => (S % 2 ? { x0: -0.5, x1: 0.5, z0: -0.5, z1: 0.5, layer: k } : null))
    .filter(Boolean);

  return {
    rects,
    fillers,
    sizes,
    toPx,
    top: -(TRUNK_H + layers * BRICK_H) * u,
    trunkH: TRUNK_H * u,
    maxW: Smax * u,
  };
}

const inside = (r, x, z) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;

/** Studs visibles de un rectángulo: los que no tapa nada de la capa de arriba. */
function studsFor(r, covers) {
  const out = [];
  for (let x = r.x0 + 0.5; x < r.x1; x += 1) {
    for (let z = r.z0 + 0.5; z < r.z1; z += 1) {
      if (!covers.some((c) => inside(c, x, z))) out.push([x, z]);
    }
  }
  return out;
}

function Studs({ r, covers, u, h }) {
  const cx = (r.x0 + r.x1) / 2;
  const cz = (r.z0 + r.z1) / 2;
  return studsFor(r, covers).map(([x, z]) => (
    <span key={`${x}:${z}`} className="stud" style={{ transform: `translate3d(${(x - cx) * u}px, ${-h / 2}px, ${(z - cz) * u}px)` }}>
      <i />
      <i />
      <i />
    </span>
  ));
}

const PALETTE = {
  public: ['#7025E0', '#A172FF', '#8B4BF0'],
  private: ['#2A1F9E', '#3B2FB8'],
  mine: '#3C9FF1',
};

function colorFor(piece, i) {
  if (!piece) return '#7025E0';
  if (piece.mine) return PALETTE.mine;
  if (piece.visibility === 'private') return PALETTE.private[i % 2];
  return PALETTE.public[i % 3];
}

/**
 * Árbol de ladrillos en CSS 3D. Explorable: arrastrar para girar, flechas con
 * el foco en la escena. `pieces` son las colocadas; el resto se ven fantasma.
 */
export default function Tree3D({
  total,
  pieces = [],
  unit = 30,
  highlightId,
  onHover,
  interactive = true,
  autoRotate = true,
  showGhosts = true,
  complete = false,
  dropIn = false,
  tiltX = -14,
  className = '',
  label = 'Árbol de piezas',
  explodable = false,
  onExplodedChange,
}) {
  const reduce = useReducedMotion();
  const layout = useMemo(() => treeLayout(total, unit), [total, unit]);
  const [angle, setAngle] = useState(-30);
  const drag = useRef(null);
  const raf = useRef(0);
  const paused = useRef(false);
  // Con animación de entrada, la estrella aparece cuando cae el último ladrillo.
  const [starOn, setStarOn] = useState(!dropIn || reduce);
  useEffect(() => {
    if (starOn) return;
    const t = setTimeout(() => setStarOn(true), total * 70 + 800);
    return () => clearTimeout(t);
  }, [starOn, total]);

  // Giro automático lento (se pausa al interactuar y con movimiento reducido).
  useEffect(() => {
    if (!autoRotate || reduce) return;
    let last = performance.now();
    const tick = (t) => {
      const dt = t - last;
      last = t;
      if (!paused.current) setAngle((a) => a + dt * 0.008);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [autoRotate, reduce]);

  const onDown = (e) => {
    if (!interactive) return;
    paused.current = true;
    drag.current = { x: e.clientX, a: angle };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag.current) return;
    setAngle(drag.current.a + (e.clientX - drag.current.x) * 0.45);
  };
  const onUp = () => {
    drag.current = null;
    setTimeout(() => (paused.current = false), 2500);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') {
      paused.current = true;
      setAngle((a) => a - 15);
    } else if (e.key === 'ArrowRight') {
      paused.current = true;
      setAngle((a) => a + 15);
    }
  };

  // Desarmar con hover, armar con click (y tocar para alternar en touch).
  const [exploded, setExploded] = useState(false);
  const armed = useRef(true);
  const setEx = (v) => {
    setExploded(v);
    onExplodedChange?.(v);
  };
  const explodeHandlers = explodable
    ? {
        onPointerEnter: (e) => {
          if (e.pointerType === 'mouse' && armed.current && starOn) setEx(true);
        },
        onPointerLeave: () => {
          armed.current = true;
        },
        onClick: () => {
          if (exploded) armed.current = false;
          setEx(!exploded);
        },
      }
    : {};
  // Hacia dónde sale volando cada pieza (determinístico).
  const exStyle = (i, r) => {
    if (!explodable) return undefined;
    const rnd = mulberry32(i * 7919 + 13);
    const cx = (r.x0 + r.x1) / 2;
    const cz = (r.z0 + r.z1) / 2;
    const len = Math.hypot(cx, cz) || 1;
    const a = (i * 2.4) % (Math.PI * 2);
    const dx = len > 0.01 ? cx / len : Math.cos(a);
    const dz = len > 0.01 ? cz / len : Math.sin(a);
    const dist = unit * (1.2 + rnd() * 1.6);
    return {
      '--ex': `${dx * dist}px`,
      '--ey': `${-unit * (0.3 + rnd() * 1.2) - r.layer * unit * 0.25}px`,
      '--ez': `${dz * dist * 0.6}px`,
      '--rx': (rnd() - 0.5).toFixed(2),
      '--ry': (rnd() - 0.5).toFixed(2),
      '--rz': (rnd() - 0.5).toFixed(2),
      '--rangle': `${Math.round(20 + rnd() * 45) * (rnd() > 0.5 ? 1 : -1)}deg`,
      '--sd': `${Math.round(rnd() * 160)}ms`,
    };
  };

  const placed = pieces.length;
  const layerHasPiece = (k) => layout.rects.some((r, i) => r.layer === k && pieces[i]);
  // Qué tapa los studs de cada capa: piezas colocadas y relleno de la capa de arriba.
  const coversFor = (k) => [
    ...layout.rects.filter((r, i) => r.layer === k + 1 && pieces[i]),
    ...layout.fillers.filter((f) => f.layer === k + 1 && layerHasPiece(k + 1)),
  ];
  const sceneH = Math.abs(layout.top) + unit * 3.4;

  return (
    <div
      className={`tree3d ${interactive ? 'is-interactive' : ''} ${explodable ? 'is-explodable' : ''} ${exploded ? 'is-exploded' : ''} ${className}`}
      {...explodeHandlers}
      style={{ '--u': `${unit}px`, height: sceneH + unit }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
      tabIndex={interactive ? 0 : -1}
      role={interactive ? 'img' : undefined}
      aria-label={interactive ? `${label}. ${placed} de ${total} piezas colocadas. Usá las flechas para girarlo.` : undefined}
      aria-hidden={interactive ? undefined : true}
    >
      <div className="tree3d-floor" style={{ width: layout.maxW * 1.5 }} />
      <div className="tree3d-scene" style={{ transform: `rotateX(${tiltX}deg) rotateY(${angle}deg)` }}>
        <Brick x={0} y={-layout.trunkH / 2} w={unit * 2} h={layout.trunkH} d={unit * 2} color="#130D5D" studs={false} className="trunk" />

        {layout.fillers.map((f) =>
          layerHasPiece(f.layer) ? (
            <Brick key={`f${f.layer}`} {...layout.toPx(f)} color="#5B2BD1" studs={false} className="can-explode" style={exStyle(100 + f.layer, f)}>
              <Studs r={f} covers={coversFor(f.layer)} u={unit} h={layout.toPx(f).h} />
            </Brick>
          ) : null,
        )}

        {layout.rects.map((r, i) => {
          const p = layout.toPx(r);
          const piece = pieces[i];
          if (!piece) {
            return showGhosts ? <Brick key={`g${i}`} {...p} ghost color="#A172FF" studs={false} /> : null;
          }
          const isNew = highlightId && piece.id === highlightId;
          const animateDrop = (isNew || dropIn) && !reduce;
          return (
            <Brick
              key={piece.id}
              {...p}
              color={colorFor(piece, i)}
              studs={false}
              className={`can-explode ${isNew ? 'is-new' : ''} ${animateDrop ? 'drop-in' : ''}`}
              style={{ ...exStyle(i, r), ...(animateDrop ? { '--delay': dropIn && !isNew ? `${i * 70}ms` : '0ms', '--fall': `${-unit * 8}px` } : null) }}
              onPointerEnter={() => onHover?.(piece, i)}
              onPointerLeave={() => onHover?.(null)}
            >
              <Studs r={r} covers={coversFor(r.layer)} u={unit} h={p.h} />
            </Brick>
          );
        })}

        {complete && starOn && (
          <div
            className="tree-star can-explode"
            style={{ transform: `translate3d(0, ${layout.top - unit * 1.1}px, 0) rotate3d(0, 0, 1, var(--ra, 0deg))`, '--ex': '0px', '--ey': `${-unit * 1.6}px`, '--ez': '0px', '--rangle': '25deg', '--sd': '0ms' }}
          >
            <motion.div
              className="tree-star-pop"
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 9, delay: 0.1 }}
            >
              <div className="tree-star-spin">
                <span />
                <span />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
