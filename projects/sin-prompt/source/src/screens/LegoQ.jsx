import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LegoScene } from '../lib/lego3d.js';
import { mulberry32 } from '../lib/assign.js';
import { Q_MODELS, DEFAULT_Q } from '../lib/legoQModels.js';
import { qBricks } from '../components/LegoHero.jsx';
import Icon from '../components/Icon.jsx';

const HIDE = [0.001, 0.001, 0.001];

/** Visor de la Q: vistas, explotada, armado y desarmado por capas. */
function QViewer({ model, layer, view, onReady }) {
  const ref = useRef(null);
  const sceneRef = useRef(null);
  const reduce = useReducedMotion();
  const maxLayer = Math.max(...model.pieces.map((p) => p.layer));

  useEffect(() => {
    let scene;
    try {
      scene = new LegoScene(ref.current, { reduceMotion: !!reduce, autoRotate: false, tilt: 0.55, fit: 'logo' });
    } catch {
      return undefined;
    }
    const bricks = qBricks(mulberry32(3), { model, explodeScale: 0.5 });
    scene.setBricks(bricks, 'logo');
    for (let n = 0; n <= maxLayer; n++) {
      scene.defineState(`L${n}`, (b) => (b.layer <= n ? b.states.logo : { ...b.states.logo, p: [b.states.logo.p[0], b.states.logo.p[1] + 5, 0], s: HIDE }));
    }
    scene.angle = -Math.PI / 4;
    scene.lookFrom(-Math.PI / 4, 0.55);
    sceneRef.current = scene;
    onReady?.(scene);
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [model, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  // Capa visible
  useEffect(() => {
    const s = sceneRef.current;
    if (!s || view === 'explode') return;
    s.goTo(`L${layer}`, { duration: 600, ease: 'back', delayFn: (b) => (b.layer === layer ? (b.step % 40) * 12 : 0) });
  }, [layer, view]);

  // Vista
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    if (view === 'front') s.lookFrom(0, 0.02);
    if (view === 'iso') s.lookFrom(-Math.PI / 4, 0.55);
    if (view === 'explode') {
      s.lookFrom(-Math.PI / 4, 0.45);
      s.goTo('explode', { duration: 900, ease: 'cubic', delayFn: (b) => (b.maxStep - b.step) * 3 });
    } else s.goTo(`L${layer}`, { duration: 800, ease: 'back', delayFn: (b) => b.step * 3 });
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} className="q-viewer" role="img" aria-label={`Modelo 3D de la Q en ladrillos. Capa ${layer} de ${maxLayer}.`} />;
}

export default function LegoQ() {
  const [variant, setVariant] = useState(DEFAULT_Q);
  const model = Q_MODELS[variant];
  const maxLayer = useMemo(() => Math.max(...model.pieces.map((p) => p.layer)), [model]);
  const [layer, setLayer] = useState(maxLayer);
  const [view, setView] = useState('iso');
  const sceneRef = useRef(null);
  const playing = useRef(0);

  useEffect(() => setLayer(maxLayer), [maxLayer]);

  const totals = useMemo(() => {
    const m = new Map();
    model.pieces.forEach((p) => m.set(`${p.part}|${p.name}`, (m.get(`${p.part}|${p.name}`) || 0) + 1));
    return [...m.entries()].map(([k, n]) => ({ part: k.split('|')[0], name: k.split('|')[1], n })).sort((a, b) => a.part.localeCompare(b.part));
  }, [model]);
  const layerPieces = model.pieces.filter((p) => p.layer === layer);

  const play = (dir) => {
    clearInterval(playing.current);
    if (view === 'explode') setView('iso');
    let n = dir > 0 ? 0 : maxLayer;
    setLayer(n);
    playing.current = setInterval(() => {
      n += dir;
      if (n < 0 || n > maxLayer) return clearInterval(playing.current);
      setLayer(n);
    }, 420);
  };
  useEffect(() => () => clearInterval(playing.current), []);

  const download = () => {
    const blob = new Blob([JSON.stringify(model, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lego-q-${variant}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <section className="screen legoq wrap" aria-labelledby="lq-h">
      <header className="legoq-head">
        <div>
          <p className="eyebrow">Manual de armado</p>
          <h1 id="lq-h" className="h1">La Q, en ladrillos.</h1>
          <p className="lead">El isotipo de QuartzSales construido solo con piezas LEGO reales: ladrillos 1×1, 1×2 y 1×4, cheese slopes e inverted slopes. Sin piezas inventadas ni deformadas.</p>
        </div>
        <div className="seg" role="radiogroup" aria-label="Variante">
          {Object.keys(Q_MODELS).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={variant === v} onClick={() => setVariant(v)}>
              {v === 'compacta' ? 'Compacta' : 'Detalle'}
              <span className="mono-label">{Q_MODELS[v].pieces.length} piezas</span>
            </button>
          ))}
        </div>
      </header>

      <div className="legoq-grid">
        <div className="legoq-stage">
          <QViewer key={variant} model={model} layer={layer} view={view} onReady={(s) => (sceneRef.current = s)} />
          <div className="legoq-views" role="radiogroup" aria-label="Vista">
            {[
              ['front', 'Frontal'],
              ['iso', 'Isométrica'],
              ['explode', 'Explotada'],
            ].map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={view === id} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <aside className="legoq-side">
          <dl className="legoq-stats">
            <div><dt>Piezas</dt><dd>{model.pieces.length}</dd></div>
            <div><dt>Capas</dt><dd>{maxLayer}</dd></div>
            <div><dt>Ancho</dt><dd>{model.grid.width}<small> studs</small></dd></div>
          </dl>
          <p className={`legoq-valid ${model.validation.ok ? 'is-ok' : ''}`}>
            <Icon name={model.validation.ok ? 'check' : 'info'} size={18} />
            {model.validation.ok ? 'Sin colisiones, sin piezas sueltas, una sola estructura.' : model.validation.errors.join(' · ')}
          </p>

          <div className="legoq-layer">
            <label htmlFor="lq-layer">
              <span className="mono-label">Capa</span>
              <strong>{layer === 0 ? 'Vacía' : `${layer} de ${maxLayer}`}</strong>
            </label>
            <input id="lq-layer" type="range" min={0} max={maxLayer} value={layer} onChange={(e) => { clearInterval(playing.current); if (view === 'explode') setView('iso'); setLayer(+e.target.value); }} />
            <div className="row">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => play(1)}><Icon name="play" size={16} /> Armar</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => play(-1)}>Desarmar</button>
            </div>
            {layer > 0 && (
              <p className="small muted">
                Capa {layer}: {Object.entries(layerPieces.reduce((a, p) => ((a[`${p.part} ${p.name}`] = (a[`${p.part} ${p.name}`] || 0) + 1), a), {})).map(([k, n]) => `${n}× ${k}`).join(' · ')}
              </p>
            )}
          </div>

          <h2 className="h3">Inventario</h2>
          <table className="legoq-table">
            <thead><tr><th>Ref.</th><th>Pieza</th><th>Cant.</th></tr></thead>
            <tbody>
              {totals.map((t) => (
                <tr key={t.part}><td className="mono">{t.part}</td><td>{t.name}</td><td>{t.n}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="legoq-colors">
            {model.palette.map((c) => (
              <span key={c.hex} title={`${c.name} · ${c.lego}`}><i style={{ background: c.hex }} />{c.name.replace(' QS', '')}</span>
            ))}
          </div>

          <h2 className="h3">Archivos</h2>
          <div className="legoq-files">
            <button type="button" className="btn btn-ghost btn-sm" onClick={download}><Icon name="download" size={16} /> Modelo JSON</button>
            <a className="btn btn-ghost btn-sm" href={`lego-q/lego-q-${variant}.ldr`} download><Icon name="download" size={16} /> LDraw (.ldr)</a>
            <a className="link" href={`lego-q/MANUAL-${variant}.md`}>Manual por capas</a>
            <a className="link" href={`lego-q/INVENTARIO-${variant}.md`}>Inventario con colores</a>
          </div>
        </aside>
      </div>
    </section>
  );
}
