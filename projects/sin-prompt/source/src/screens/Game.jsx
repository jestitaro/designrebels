import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { seededShuffle, mulberry32, hashString } from '../lib/assign.js';
import { formatTime } from '../lib/format.js';
import { initials } from '../config/participants.js';
import Icon from '../components/Icon.jsx';
import Dialog from '../components/Dialog.jsx';

// ── Definición fija (igual para todos) ──────────────────────────────────────
// Coordenadas en "unidades" dentro del área del árbol (12 × 10.5).
const RH = 1.25;
const SLOTS = [
  { id: 's-star', type: 'star', x: 5.2, y: 0.25, w: 1.6, h: 1.6 },
  { id: 's-r1', type: 'w2', x: 5, y: 2, w: 2, h: RH },
  { id: 's-r2', type: 'w4', x: 4, y: 2 + RH, w: 4, h: RH },
  { id: 's-r3a', type: 'w3', x: 3, y: 2 + RH * 2, w: 3, h: RH },
  { id: 's-r3b', type: 'w3', x: 6, y: 2 + RH * 2, w: 3, h: RH },
  { id: 's-r4a', type: 'w4', x: 2, y: 2 + RH * 3, w: 4, h: RH },
  { id: 's-r4b', type: 'w4', x: 6, y: 2 + RH * 3, w: 4, h: RH },
  { id: 's-r5a', type: 'w2', x: 1, y: 2 + RH * 4, w: 2, h: RH },
  { id: 's-r5b', type: 'w6', x: 3, y: 2 + RH * 4, w: 6, h: RH },
  { id: 's-r5c', type: 'w2', x: 9, y: 2 + RH * 4, w: 2, h: RH },
  { id: 's-trunk', type: 'trunk', x: 5, y: 2 + RH * 5, w: 2, h: 1.7 },
  { id: 's-b1', type: 'ball', x: 6.6, y: 3.0, w: 0.9, h: 0.9 },
  { id: 's-b2', type: 'ball', x: 3.6, y: 5.6, w: 0.9, h: 0.9 },
  { id: 's-b3', type: 'ball', x: 8.4, y: 6.75, w: 0.9, h: 0.9 },
];
const PIECES = [
  { id: 'star', type: 'star', w: 1.6, h: 1.6, color: '#FFFFFF' },
  { id: 'a2', type: 'w2', w: 2, h: RH, color: '#A172FF' },
  { id: 'b2', type: 'w2', w: 2, h: RH, color: '#7025E0' },
  { id: 'c2', type: 'w2', w: 2, h: RH, color: '#3C9FF1' },
  { id: 'a3', type: 'w3', w: 3, h: RH, color: '#7025E0' },
  { id: 'b3', type: 'w3', w: 3, h: RH, color: '#A172FF' },
  { id: 'a4', type: 'w4', w: 4, h: RH, color: '#7025E0' },
  { id: 'b4', type: 'w4', w: 4, h: RH, color: '#3C9FF1' },
  { id: 'c4', type: 'w4', w: 4, h: RH, color: '#A172FF' },
  { id: 'a6', type: 'w6', w: 6, h: RH, color: '#7025E0' },
  { id: 'trunk', type: 'trunk', w: 2, h: 1.7, color: '#130D5D' },
  { id: 'ball1', type: 'ball', w: 0.9, h: 0.9, color: '#FFFFFF' },
  { id: 'ball2', type: 'ball', w: 0.9, h: 0.9, color: '#3C9FF1' },
  { id: 'ball3', type: 'ball', w: 0.9, h: 0.9, color: '#A172FF' },
];
const SEED = 'arma-el-arbol-2026';
const TREE_W = 12;
const TREE_H = 10.5;

/** Ubica las piezas desordenadas en la bandeja (determinístico). */
function trayLayout(vertical) {
  const order = seededShuffle(PIECES, SEED);
  const rand = mulberry32(hashString(SEED + 'rot'));
  const area = vertical ? { x: 0.3, y: TREE_H + 0.6, w: TREE_W - 0.6 } : { x: TREE_W + 0.8, y: 0.6, w: 10.4 };
  const gap = 0.55;
  let cx = area.x;
  let cy = area.y;
  let rowH = 0;
  const pos = {};
  order.forEach((p) => {
    if (cx + p.w > area.x + area.w) {
      cx = area.x;
      cy += rowH + gap;
      rowH = 0;
    }
    pos[p.id] = { x: cx, y: cy, r: (rand() - 0.5) * 16 };
    cx += p.w + gap;
    rowH = Math.max(rowH, p.h);
  });
  const height = cy + rowH + 0.4;
  return { pos, stageW: vertical ? TREE_W : TREE_W + 0.8 + 10.4 + 0.4, stageH: Math.max(TREE_H, height) };
}

const center = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

function PieceShape({ p }) {
  if (p.type === 'star')
    return (
      <svg viewBox="0 0 40 40" className="gp-star" aria-hidden="true">
        <path d="M20 2 l5 12 l13 1 l-10 8 l3 13 l-11 -7 l-11 7 l3 -13 l-10 -8 l13 -1z" />
      </svg>
    );
  if (p.type === 'ball') return <span className="gp-ball" aria-hidden="true" />;
  const studs = p.type === 'trunk' ? 0 : p.w;
  return (
    <span className="gp-brick" aria-hidden="true">
      {Array.from({ length: studs }).map((_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

export default function Game() {
  const { api, me, toast } = useStore();
  const reduce = useReducedMotion();
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(40);
  const [vertical, setVertical] = useState(false);
  const layout = useMemo(() => trayLayout(vertical), [vertical]);

  const [state, setState] = useState('idle'); // idle · playing · done
  const [placed, setPlaced] = useState({}); // pieceId → slotId
  const [drag, setDrag] = useState(null); // { id, x, y, dx, dy }
  const [error, setError] = useState(null);
  const [snapped, setSnapped] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [board, setBoard] = useState([]);
  const [announce, setAnnounce] = useState('');
  const run = useRef(null);
  const t0 = useRef(0);
  const raf = useRef(0);

  // Escala responsive.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      const v = w < 620;
      setVertical(v);
      setScale(w / (v ? TREE_W : TREE_W + 0.8 + 10.4 + 0.4));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const loadBoard = useCallback(() => api.getLeaderboard().then(setBoard), [api]);
  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tick = () => {
    setElapsed(performance.now() - t0.current);
    raf.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    try {
      const { runId } = await api.startGame();
      run.current = runId;
      setPlaced({});
      setResult(null);
      setState('playing');
      setAnnounce('¡Empezó! Arrastrá cada pieza a su lugar.');
      t0.current = performance.now();
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(tick);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const finish = async () => {
    cancelAnimationFrame(raf.current);
    setState('done');
    try {
      const r = await api.finishGame(run.current);
      setResult(r);
      setElapsed(r.ms);
      loadBoard();
    } catch (e) {
      setResult({ error: e.message });
    }
  };

  const freeSlotsFor = (type, current = placed) => SLOTS.filter((s) => s.type === type && !Object.values(current).includes(s.id));

  const place = (pid, slotId) => {
    const next = { ...placed, [pid]: slotId };
    setPlaced(next);
    setSnapped(pid);
    setTimeout(() => setSnapped((s) => (s === pid ? null : s)), 500);
    navigator.vibrate?.(12);
    const left = PIECES.length - Object.keys(next).length;
    setAnnounce(left ? `Encastró. Faltan ${left}.` : '¡Árbol completo!');
    if (left === 0) setTimeout(finish, 450);
  };

  const fail = (pid, msg) => {
    setError(pid);
    setAnnounce(msg);
    navigator.vibrate?.([20, 40, 20]);
    setTimeout(() => setError((e) => (e === pid ? null : e)), 600);
  };

  // ── Arrastre ────────────────────────────────────────────────────────────
  const toUnits = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };
  const onDown = (e, p) => {
    if (state !== 'playing' || placed[p.id]) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const u = toUnits(e);
    const home = layout.pos[p.id];
    setDrag({ id: p.id, x: home.x, y: home.y, dx: u.x - home.x, dy: u.y - home.y, moved: false });
  };
  const onMove = (e) => {
    if (!drag) return;
    const u = toUnits(e);
    setDrag((d) => ({ ...d, x: u.x - d.dx, y: u.y - d.dy, moved: true }));
  };
  const onUp = () => {
    if (!drag) return;
    const p = PIECES.find((x) => x.id === drag.id);
    const c = center({ x: drag.x, y: drag.y, w: p.w, h: p.h });
    setDrag(null);
    if (!drag.moved) return;
    const candidates = freeSlotsFor(p.type)
      .map((s) => ({ s, d: Math.hypot(center(s).x - c.x, center(s).y - c.y) }))
      .sort((a, b) => a.d - b.d);
    if (candidates[0] && candidates[0].d < 1.25) return place(p.id, candidates[0].s.id);
    const over = SLOTS.find((s) => c.x > s.x && c.x < s.x + s.w && c.y > s.y && c.y < s.y + s.h);
    if (over) fail(p.id, over.type === p.type ? 'Ese lugar ya está ocupado.' : 'Esa pieza no va ahí. Mirá el tamaño.');
  };
  // Teclado: Enter coloca la pieza en el primer lugar libre que le corresponde.
  const onKey = (e, p) => {
    if (state !== 'playing' || placed[p.id]) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const s = freeSlotsFor(p.type)[0];
      if (s) place(p.id, s.id);
    }
  };

  const posOf = (p) => {
    if (drag?.id === p.id) return { x: drag.x, y: drag.y, r: 0 };
    if (placed[p.id]) {
      const s = SLOTS.find((x) => x.id === placed[p.id]);
      return { x: s.x, y: s.y, r: 0 };
    }
    return layout.pos[p.id];
  };

  const count = Object.keys(placed).length;
  const myRow = board.findIndex((r) => r.participant.id === me.id && !r.isSample);

  return (
    <section className="screen game wrap" aria-labelledby="game-h">
      <header className="game-head">
        <div>
          <p className="eyebrow">Minijuego</p>
          <h1 id="game-h" className="h1">Armá el árbol.</h1>
          <p className="lead">Catorce piezas, un árbol, el reloj corriendo. Las piezas encastran solas cuando las acercás a su lugar.</p>
        </div>
        <div className="game-hud" aria-live="off">
          <div className="hud-time">
            <span className="mono-label">Tiempo</span>
            <span className="hud-n">{formatTime(elapsed)}</span>
          </div>
          <div className="hud-count">
            <span className="mono-label">Piezas</span>
            <span className="hud-n">
              {count}<span className="muted">/{PIECES.length}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="game-grid">
        <div className="game-board">
          <div
            ref={wrapRef}
            className={`stage ${state} ${vertical ? 'is-vertical' : ''}`}
            style={{ height: layout.stageH * scale, '--s': `${scale}px` }}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className="stage-tree" style={{ width: TREE_W * scale, height: TREE_H * scale }} aria-hidden="true" />
            {SLOTS.map((s) => (
              <div
                key={s.id}
                className={`slot slot-${s.type} ${Object.values(placed).includes(s.id) ? 'is-filled' : ''} ${drag && PIECES.find((p) => p.id === drag.id)?.type === s.type ? 'is-target' : ''}`}
                style={{ left: s.x * scale, top: s.y * scale, width: s.w * scale, height: s.h * scale }}
                aria-hidden="true"
              />
            ))}
            {!vertical && <span className="tray-label mono-label" style={{ left: (TREE_W + 0.8) * scale }}>Piezas</span>}
            {PIECES.map((p) => {
              const pos = posOf(p);
              const isDrag = drag?.id === p.id;
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  className={`gpiece gp-${p.type} ${placed[p.id] ? 'is-placed' : ''} ${isDrag ? 'is-drag' : ''} ${error === p.id ? 'is-error' : ''} ${snapped === p.id ? 'is-snap' : ''}`}
                  style={{ width: p.w * scale, height: p.h * scale, '--pc': p.color, zIndex: isDrag ? 50 : placed[p.id] ? 2 : 10 }}
                  initial={false}
                  animate={{ x: pos.x * scale, y: pos.y * scale, rotate: pos.r, scale: isDrag ? 1.06 : 1 }}
                  transition={isDrag ? { duration: 0 } : reduce ? { duration: 0.01 } : { type: 'spring', stiffness: 420, damping: 30 }}
                  onPointerDown={(e) => onDown(e, p)}
                  onKeyDown={(e) => onKey(e, p)}
                  disabled={state !== 'playing' || !!placed[p.id]}
                  aria-label={`Pieza ${p.type === 'star' ? 'estrella' : p.type === 'ball' ? 'esfera' : p.type === 'trunk' ? 'tronco' : `de ${p.w} de ancho`}${placed[p.id] ? ', colocada' : ''}`}
                >
                  <PieceShape p={p} />
                </motion.button>
              );
            })}

            <AnimatePresence>
              {state === 'idle' && (
                <motion.div className="stage-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                  <div className="overlay-card">
                    <p className="mono-label">Mismas piezas para todos</p>
                    <h2 className="h3">¿Listo, {me.name.split(' ')[0]}?</h2>
                    <ul className="rules">
                      <li>Arrastrá cada pieza a su silueta.</li>
                      <li>Si la pieza no es del tamaño correcto, rebota.</li>
                      <li>Con teclado: Tab hasta una pieza y Enter.</li>
                      <li>Queda tu mejor tiempo.</li>
                    </ul>
                    <button type="button" className="btn btn-primary btn-lg" onClick={start} autoFocus>
                      <Icon name="play" /> Jugar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="sr-only" aria-live="assertive">{announce}</p>
        </div>

        <aside className="ranking" aria-labelledby="rank-h">
          <h2 id="rank-h" className="h3">Ranking</h2>
          <p className="muted small">Mejor tiempo por persona.</p>
          {board.length === 0 ? (
            <p className="empty-inline">Nadie jugó todavía. El primer puesto está libre.</p>
          ) : (
            <ol className="rank-list">
              {board.slice(0, 10).map((r, i) => (
                <li key={r.participant.id} className={r.participant.id === me.id && !r.isSample ? 'is-me' : ''}>
                  <span className="rank-pos">{String(i + 1).padStart(2, '0')}</span>
                  <span className="avatar sm" aria-hidden="true">{initials(r.participant.name)}</span>
                  <span className="rank-name">
                    {r.participant.name}
                    {r.isSample && <span className="tag">Ejemplo</span>}
                  </span>
                  <span className="rank-time">{formatTime(r.ms)}</span>
                </li>
              ))}
            </ol>
          )}
          {myRow >= 10 && <p className="muted small">Tu puesto: {myRow + 1}°</p>}
        </aside>
      </div>

      <Dialog open={state === 'done' && !!result} onClose={() => setState('idle')} labelledBy="res-h" className="result">
        {result?.error ? (
          <>
            <h2 id="res-h" className="dialog-title">Esa no contó.</h2>
            <p className="dialog-body">{result.error}</p>
          </>
        ) : (
          result && (
            <>
              <p className="eyebrow">{result.improved ? 'Nuevo récord personal' : 'Árbol completo'}</p>
              <h2 id="res-h" className="result-time">{formatTime(result.ms)}</h2>
              <p className="dialog-body">
                Quedaste <strong>{result.rank}° de {result.total}</strong>.{' '}
                {result.improved ? 'Ese es tu mejor tiempo.' : `Tu mejor tiempo sigue siendo ${formatTime(result.best)}.`}
              </p>
            </>
          )
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setState('idle')}>Ver ranking</button>
          <button
            type="button"
            className="btn btn-primary"
            data-autofocus
            onClick={() => {
              setState('idle');
              setPlaced({});
              setElapsed(0);
              setTimeout(start, 50);
            }}
          >
            Volver a jugar
          </button>
        </div>
      </Dialog>
    </section>
  );
}
