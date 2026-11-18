import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Confirm } from '../components/Dialog.jsx';
import { HUMAN_PROMPTS } from '../config/postcards.js';

const W = 1200;
const H = 800;
const COLORS = [
  { c: '#130D5D', n: 'Azul noche' },
  { c: '#7025E0', n: 'Violeta' },
  { c: '#A172FF', n: 'Lila' },
  { c: '#3C9FF1', n: 'Celeste' },
  { c: '#FFFFFF', n: 'Blanco' },
];
const SIZES = [
  { s: 5, n: 'Fino' },
  { s: 12, n: 'Medio' },
  { s: 26, n: 'Grueso' },
];
const BGS = [
  { c: '#FFFFFF', n: 'Blanco' },
  { c: '#F3F1FA', n: 'Papel' },
  { c: '#7025E0', n: 'Violeta' },
  { c: '#130D5D', n: 'Noche' },
];

function drawStroke(ctx, op, from = 1) {
  const pts = op.pts;
  ctx.globalCompositeOperation = op.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = op.color;
  ctx.fillStyle = op.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (pts.length === 1) {
    const [x, y, p] = pts[0];
    ctx.beginPath();
    ctx.arc(x, y, (op.size * p) / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  for (let i = Math.max(1, from); i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1, p1] = pts[i];
    const prev = pts[i - 2] || pts[i - 1];
    const mx0 = (prev[0] + x0) / 2;
    const my0 = (prev[1] + y0) / 2;
    const mx1 = (x0 + x1) / 2;
    const my1 = (y0 + y1) / 2;
    ctx.lineWidth = op.size * p1;
    ctx.beginPath();
    ctx.moveTo(i === 1 ? x0 : mx0, i === 1 ? y0 : my0);
    ctx.quadraticCurveTo(x0, y0, mx1, my1);
    if (i === pts.length - 1) ctx.lineTo(x1, y1);
    ctx.stroke();
  }
}

function drawText(ctx, op) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = op.color;
  ctx.font = `600 ${op.size}px Poppins, sans-serif`;
  ctx.textBaseline = 'middle';
  op.text.split('\n').forEach((line, i) => ctx.fillText(line, op.x, op.y + i * op.size * 1.2));
}

export function renderOps(ctx, ops) {
  ctx.clearRect(0, 0, W, H);
  let start = 0;
  ops.forEach((o, i) => {
    if (o.t === 'clear') start = i + 1;
  });
  for (let i = start; i < ops.length; i++) {
    const o = ops[i];
    if (o.t === 'stroke') drawStroke(ctx, o);
    else if (o.t === 'text') drawText(ctx, o);
  }
  ctx.globalCompositeOperation = 'source-over';
}

const visibleOps = (ops) => {
  let start = 0;
  ops.forEach((o, i) => o.t === 'clear' && (start = i + 1));
  return ops.slice(start);
};

/**
 * Editor de dibujo "tipo pizarra de llamada": lápiz, goma, texto, colores,
 * grosores, deshacer/rehacer, limpiar con confirmación y exportar.
 * Mouse, touch y lápiz (con presión) vía Pointer Events.
 */
export default function DrawEditor({ initial, onDone, onBack, recipientName }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [ops, setOps] = useState(initial?.ops || []);
  const [redo, setRedo] = useState([]);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#7025E0');
  const [size, setSize] = useState(12);
  const [bg, setBg] = useState(initial?.bg || '#FFFFFF');
  const [confirm, setConfirm] = useState(false);
  const [textBox, setTextBox] = useState(null);
  const [idea, setIdea] = useState(() => Math.floor(Math.random() * HUMAN_PROMPTS.length));
  const live = useRef(null);
  const textRef = useRef(null);
  useEffect(() => {
    if (textBox && document.activeElement !== textRef.current) setTimeout(() => textRef.current?.focus(), 0);
  }, [textBox]);

  // Colores que no se ven sobre el fondo elegido se reemplazan.
  useEffect(() => {
    if (color.toUpperCase() === bg.toUpperCase()) setColor(bg === '#FFFFFF' || bg === '#F3F1FA' ? '#7025E0' : '#FFFFFF');
  }, [bg]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    renderOps(ctx, ops);
  }, [ops]);

  const commit = useCallback((op) => {
    setOps((o) => [...o, op]);
    setRedo([]);
  }, []);

  const undo = useCallback(() => {
    setOps((o) => {
      if (!o.length) return o;
      setRedo((r) => [...r, o[o.length - 1]]);
      return o.slice(0, -1);
    });
  }, []);
  const redoFn = useCallback(() => {
    setRedo((r) => {
      if (!r.length) return r;
      setOps((o) => [...o, r[r.length - 1]]);
      return r.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (textBox || e.target.closest?.('input, textarea')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redoFn() : undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoFn();
      } else if (!mod && e.key === 'p') setTool('pen');
      else if (!mod && e.key === 'e') setTool('eraser');
      else if (!mod && e.key === 't') setTool('text');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redoFn, textBox]);

  const toCanvas = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  const pressure = (e) => (e.pointerType === 'pen' ? 0.35 + (e.pressure || 0.5) * 1.3 : 1);

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    if (tool === 'text') {
      e.preventDefault();
      if (textBox) commitText();
      const [x, y] = toCanvas(e);
      openText(x, y);
      return;
    }
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const [x, y] = toCanvas(e);
    live.current = { t: 'stroke', tool, color, size: tool === 'eraser' ? size * 2.2 : size, pts: [[x, y, pressure(e)]] };
    const ctx = canvasRef.current.getContext('2d');
    drawStroke(ctx, live.current);
  };
  const onMove = (e) => {
    if (!live.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const before = live.current.pts.length;
    (evs.length ? evs : [e]).forEach((ev) => {
      const [x, y] = toCanvas(ev);
      live.current.pts.push([x, y, pressure(ev)]);
    });
    drawStroke(ctx, live.current, before);
    ctx.globalCompositeOperation = 'source-over';
  };
  const onUp = () => {
    if (!live.current) return;
    const op = live.current;
    live.current = null;
    // simplificamos un poco los puntos para no guardar de más
    op.pts = op.pts.filter((p, i, a) => i === 0 || i === a.length - 1 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 1.2).map((p) => p.map((n) => Math.round(n * 10) / 10));
    commit(op);
  };

  const openText = (x, y) => setTextBox({ x, y, value: '' });
  const commitText = () => {
    if (textBox?.value.trim()) commit({ t: 'text', x: textBox.x, y: textBox.y, text: textBox.value.trim(), color, size: Math.max(28, size * 3.2) });
    setTextBox(null);
  };

  const exportDataUrl = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(canvasRef.current, 0, 0);
    return c.toDataURL('image/png');
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = exportDataUrl();
    a.download = 'dibujo-sin-prompt.png';
    a.click();
  };

  const empty = visibleOps(ops).length === 0;
  const onDark = bg === '#7025E0' || bg === '#130D5D';

  return (
    <div className="draw">
      <div className="draw-top">
        <div className="human-prompt" aria-live="polite">
          <span className="mono-label">Un prompt, pero para humanos</span>
          <p>Dibujá: {HUMAN_PROMPTS[idea]}</p>
          <button type="button" className="icon-btn" onClick={() => setIdea((i) => (i + 1) % HUMAN_PROMPTS.length)} aria-label="Otra idea">
            <Icon name="shuffle" size={18} />
          </button>
        </div>
        <div className="bg-pick" role="radiogroup" aria-label="Color del lienzo">
          <span className="mono-label">Lienzo</span>
          {BGS.map((b) => (
            <button key={b.c} type="button" role="radio" aria-checked={bg === b.c} aria-label={b.n} className="swatch sm" style={{ '--sw': b.c }} onClick={() => setBg(b.c)} />
          ))}
        </div>
      </div>

      <div className={`draw-board ${onDark ? 'on-dark' : ''}`} ref={wrapRef} style={{ background: bg }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={`draw-canvas tool-${tool}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={(e) => {
            if (tool === 'text' && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              openText(W / 2 - 160, H / 2);
            }
          }}
          tabIndex={0}
          role="img"
          aria-label={`Lienzo de dibujo para la postal de ${recipientName}. ${empty ? 'Vacío.' : 'Con dibujo.'} Con la herramienta de texto, Enter agrega un texto.`}
        />
        {empty && !textBox && (
          <p className="draw-empty" aria-hidden="true">
            {tool === 'text' ? 'Tocá donde quieras escribir' : 'Dibujá acá. Nadie te va a evaluar.'}
          </p>
        )}
        {textBox && (
          <textarea
            ref={textRef}
            className="draw-textbox"
            autoFocus
            rows={1}
            value={textBox.value}
            aria-label="Texto para agregar al dibujo. Enter para confirmar, Escape para cancelar."
            placeholder="Escribí…"
            style={{
              left: `${(textBox.x / W) * 100}%`,
              top: `${(textBox.y / H) * 100}%`,
              color,
              '--fs': Math.max(28, size * 3.2) / W,
            }}
            onChange={(e) => setTextBox((t) => ({ ...t, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitText();
              } else if (e.key === 'Escape') setTextBox(null);
            }}
            onBlur={commitText}
          />
        )}
      </div>

      <div className="toolbar" role="toolbar" aria-label="Herramientas de dibujo">
        <div className="tb-group" role="radiogroup" aria-label="Herramienta">
          {[
            ['pen', 'pen', 'Lápiz (P)'],
            ['eraser', 'eraser', 'Goma (E)'],
            ['text', 'text', 'Texto (T)'],
          ].map(([id, icon, label]) => (
            <button key={id} type="button" role="radio" aria-checked={tool === id} className="tb-btn" onClick={() => setTool(id)} title={label} aria-label={label}>
              <Icon name={icon} size={20} />
            </button>
          ))}
        </div>
        <span className="tb-sep" />
        <div className="tb-group" role="radiogroup" aria-label="Color">
          {COLORS.map((c) => (
            <button key={c.c} type="button" role="radio" aria-checked={color === c.c} aria-label={c.n} className="swatch" style={{ '--sw': c.c }} onClick={() => { setColor(c.c); if (tool === 'eraser') setTool('pen'); }} />
          ))}
        </div>
        <span className="tb-sep" />
        <div className="tb-group" role="radiogroup" aria-label="Grosor">
          {SIZES.map((s) => (
            <button key={s.s} type="button" role="radio" aria-checked={size === s.s} aria-label={s.n} className="tb-btn size-btn" onClick={() => setSize(s.s)}>
              <span style={{ width: Math.min(22, s.s * 0.9 + 3), height: Math.min(22, s.s * 0.9 + 3) }} />
            </button>
          ))}
        </div>
        <span className="tb-sep" />
        <div className="tb-group">
          <button type="button" className="tb-btn" onClick={undo} disabled={!ops.length} aria-label="Deshacer" title="Deshacer (Ctrl+Z)"><Icon name="undo" size={20} /></button>
          <button type="button" className="tb-btn" onClick={redoFn} disabled={!redo.length} aria-label="Rehacer" title="Rehacer (Ctrl+Shift+Z)"><Icon name="redo" size={20} /></button>
          <button type="button" className="tb-btn danger" onClick={() => setConfirm(true)} disabled={empty} aria-label="Limpiar lienzo" title="Limpiar"><Icon name="trash" size={20} /></button>
        </div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}><Icon name="back" /> Volver</button>
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={download} disabled={empty}><Icon name="download" /> PNG</button>
          <button type="button" className="btn btn-primary" disabled={empty} onClick={() => onDone({ drawing: exportDataUrl(), ops, bg })}>
            Usar este dibujo <Icon name="arrow" />
          </button>
        </div>
      </div>

      <Confirm
        open={confirm}
        title="¿Borramos todo?"
        body="Se limpia el lienzo. Si te arrepentís, podés deshacerlo."
        confirmLabel="Sí, limpiar"
        cancelLabel="Mejor no"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          commit({ t: 'clear' });
          setConfirm(false);
        }}
      />
    </div>
  );
}
