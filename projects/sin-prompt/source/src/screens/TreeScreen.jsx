import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import Tree3D from '../components/Tree3D.jsx';
import Icon from '../components/Icon.jsx';

function useUnit() {
  const calc = () => (window.innerWidth < 560 ? 420 : window.innerWidth < 1000 ? 520 : Math.max(480, Math.min(680, window.innerHeight - 140)));
  const [u, setU] = useState(calc);
  useEffect(() => {
    const on = () => setU(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return u;
}

export default function TreeScreen() {
  const { tree, me, progress, lastPiece, setLastPiece, refreshTree, isDemo } = useStore();
  const [hover, setHover] = useState(null);
  const [asList, setAsList] = useState(false);
  const unit = useUnit();
  const reduce = useReducedMotion();
  const [highlight] = useState(lastPiece);

  useEffect(() => {
    refreshTree();
    if (lastPiece) {
      const t = setTimeout(() => setLastPiece(null), 3000);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tree) return null;
  const { total, placed, pieces } = tree;
  const pending = Math.max(0, total - placed);
  const complete = placed >= total && total > 0;
  const pct = total ? Math.round((placed / total) * 100) : 0;

  return (
    <section className="screen tree-screen" aria-labelledby="tree-h">
      <div className="tree-layout wrap">
        <div className="tree-copy">
          <p className="eyebrow">El árbol colectivo</p>
          <h1 id="tree-h" className="h1">{complete ? 'Lo armamos. Sin prompt.' : 'Lo estamos armando entre todos.'}</h1>
          <p className="lead">
            {complete
              ? 'Cada pieza es una postal que alguien se tomó el tiempo de escribir. Todas, de persona a persona.'
              : 'Cada postal enviada suma una pieza. Cada persona aporta dos. El árbol es uno solo, para todo QuartzSales.'}
          </p>

          <div className="tree-stats" aria-live="polite">
            <div>
              <span className="stat-n">{placed}</span>
              <span className="stat-l">piezas colocadas</span>
            </div>
            <div>
              <span className="stat-n is-ghost">{pending}</span>
              <span className="stat-l">pendientes</span>
            </div>
          </div>
          <div className="seg-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={placed} aria-label="Progreso del árbol">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={i < placed ? (pieces[i]?.mine ? 'is-mine' : 'is-on') : ''} />
            ))}
          </div>
          <p className="mono-label">{pct}% · {isDemo ? 'datos de demo, solo en este navegador' : 'progreso compartido en vivo'}</p>

          <div className="tree-hover" aria-live="polite">
            {hover ? (
              <>
                <span className="mono-label">Pieza {hover.i + 1}</span>
                <strong>
                  {hover.p.visibility === 'public' && hover.p.from
                    ? `De ${hover.p.from} para ${hover.p.to}`
                    : hover.p.mine
                      ? 'Una de tus postales'
                      : 'Una postal privada'}
                </strong>
                <span className="muted">{hover.p.visibility === 'public' ? 'Pública' : 'Privada: el contenido y los nombres quedan entre ellos.'}</span>
              </>
            ) : (
              <span className="muted">Pasá por una pieza para ver qué vínculo representa. Arrastrá para girar el árbol.</span>
            )}
          </div>

          <ul className="legend" aria-label="Referencias">
            <li><i className="lg-public" /> Postal pública</li>
            <li><i className="lg-private" /> Postal privada</li>
            <li><i className="lg-mine" /> Tus piezas</li>
            <li><i className="lg-ghost" /> Pendiente</li>
          </ul>

          <div className="row">
            {me && !progress.done ? (
              <button type="button" className="btn btn-light btn-lg" onClick={() => navigate(progress.destino ? '/elegir' : '/destino')}>
                Sumar mi pieza <Icon name="arrow" />
              </button>
            ) : (
              <button type="button" className="btn btn-light btn-lg" onClick={() => navigate('/juego')}>
                Ahora, armalo vos: jugar <Icon name="play" />
              </button>
            )}
            <button type="button" className="btn btn-ghost-light" onClick={() => setAsList((v) => !v)} aria-expanded={asList}>
              {asList ? 'Ver árbol' : 'Ver como lista'}
            </button>
          </div>
        </div>

        <div className="tree-stage">
          {asList ? (
            <ol className="piece-list">
              {pieces.map((p, i) => (
                <li key={p.id}>
                  <span className="mono-label">{String(i + 1).padStart(2, '0')}</span>
                  {p.visibility === 'public' && p.from ? `De ${p.from} para ${p.to}` : p.mine ? 'Tu postal (privada)' : 'Postal privada'}
                  {p.isSample && <span className="tag">Ejemplo</span>}
                </li>
              ))}
              {pieces.length === 0 && <li className="muted">Todavía no hay piezas. La primera puede ser la tuya.</li>}
            </ol>
          ) : (
            <>
              <Tree3D
                total={total}
                pieces={pieces}
                height={unit}
                highlightId={highlight}
                complete={complete}
                onHover={(p, i) => setHover(p ? { p, i } : null)}
                label="Árbol colectivo de QuartzSales"
              />
              {complete && !reduce && (
                <motion.div className="tree-glow" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5] }} transition={{ duration: 2.4 }} aria-hidden="true" />
              )}
              {highlight && (
                <motion.p className="tree-toast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                  Tu pieza encastró.
                </motion.p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
