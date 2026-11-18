import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import Brick from './Brick.jsx';

// ── Geometría ───────────────────────────────────────────────────────────────
// Cada capa es un "molinete" de 4 piezas alrededor de un núcleo. Las capas se
// achican hacia arriba. Pieza i → capa floor(i/4), posición i%4.
export function treeLayout(total, u) {
  const layers = Math.max(1, Math.ceil(total / 4));
  const S0 = 6.2;
  const Smin = 2.2;
  const h = 0.92;
  const base = 1.3; // tronco
  const out = [];
  for (let i = 0; i < total; i++) {
    const k = Math.floor(i / 4);
    const j = i % 4;
    const S = S0 - ((S0 - Smin) * k) / Math.max(1, layers - 1);
    const w = Math.max(0.8, S * 0.34);
    const L = S - w;
    const y = -(base + k * h + h / 2);
    // molinete: (x, z, ancho X, profundidad Z)
    const parts = [
      [-w / 2, -S / 2 + w / 2, L, w],
      [S / 2 - w / 2, -w / 2, w, L],
      [w / 2, S / 2 - w / 2, L, w],
      [-S / 2 + w / 2, w / 2, w, L],
    ][j];
    out.push({
      x: parts[0] * u,
      z: parts[1] * u,
      w: parts[2] * u - 3,
      d: parts[3] * u - 3,
      y: y * u,
      h: h * u - 2,
      layer: k,
    });
  }
  const top = -(base + layers * h) * u;
  return { pieces: out, top, coreH: (layers * h + base) * u, baseH: base * u };
}

const PALETTE = {
  public: ['#7025E0', '#A172FF', '#8B4BF0'],
  private: ['#2A1F9E', '#3B2FB8'],
  mine: '#FFFFFF',
};

function colorFor(piece, i) {
  if (!piece) return '#7025E0';
  if (piece.mine) return PALETTE.mine;
  if (piece.visibility === 'private') return PALETTE.private[i % 2];
  return PALETTE.public[i % 3];
}

/**
 * Árbol de piezas en CSS 3D. Explorable: arrastrar para girar, flechas con el
 * foco en la escena. `pieces` son las colocadas; el resto se dibujan fantasma.
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
  tiltX = -20,
  className = '',
  label = 'Árbol de piezas',
}) {
  const reduce = useReducedMotion();
  const layout = useMemo(() => treeLayout(total, unit), [total, unit]);
  const [angle, setAngle] = useState(-30);
  const drag = useRef(null);
  const raf = useRef(0);
  const paused = useRef(false);

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

  const placed = pieces.length;
  const sceneH = Math.abs(layout.top) + unit * 3;

  return (
    <div
      className={`tree3d ${interactive ? 'is-interactive' : ''} ${className}`}
      style={{ '--u': `${unit}px`, height: sceneH + unit * 2 }}
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
      <div className="tree3d-floor" />
      <div className="tree3d-scene" style={{ transform: `rotateX(${tiltX}deg) rotateY(${angle}deg)` }}>
        {/* tronco + núcleo */}
        <Brick x={0} y={-layout.baseH / 2} w={unit * 1.5} h={layout.baseH} d={unit * 1.5} color="#130D5D" studs={false} className="trunk" />
        <Brick x={0} y={-layout.coreH / 2} w={unit * 1.1} h={layout.coreH - 2} d={unit * 1.1} color="#1C1478" studs={false} className="core" />
        {layout.pieces.map((p, i) => {
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
              y={p.y}
              color={colorFor(piece, i)}
              className={`${isNew ? 'is-new' : ''} ${animateDrop ? 'drop-in' : ''}`}
              style={animateDrop ? { '--delay': dropIn && !isNew ? `${i * 70}ms` : '0ms', '--fall': `${-unit * 8}px` } : undefined}
              onPointerEnter={() => onHover?.(piece, i)}
              onPointerLeave={() => onHover?.(null)}
            />
          );
        })}
        {complete && (
          <motion.div
            className="tree-star"
            style={{ '--top': `${layout.top - unit * 1.1}px` }}
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 10, delay: 0.3 }}
          >
            <span />
            <span />
          </motion.div>
        )}
      </div>
    </div>
  );
}
