import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import { firstName } from '../config/participants.js';
import { seededShuffle } from '../lib/assign.js';
import { safeStorage } from '../lib/format.js';
import Icon from '../components/Icon.jsx';

const REEL_LEN = 22;

export default function Reveal() {
  const { me, assignment, participants, progress } = useStore();
  const reduce = useReducedMotion();
  const memo = useMemo(() => safeStorage(`sinprompt.revealed.${me?.id}`, false), [me?.id]);
  const [phase, setPhase] = useState(() => (memo.get() || progress.destino ? 'done' : 'idle'));

  const reel = useMemo(() => {
    if (!assignment) return [];
    const pool = participants.filter((p) => p.id !== me?.id && p.id !== assignment.id);
    const names = [];
    const shuffled = seededShuffle(pool, me?.id || 'x');
    for (let i = 0; i < REEL_LEN - 1; i++) names.push(shuffled[i % shuffled.length]?.name || '');
    names.push(assignment.name);
    return names;
  }, [assignment, participants, me]);

  if (!assignment) {
    return (
      <section className="screen center wrap">
        <p className="eyebrow">02 / El destino decide</p>
        <h1 className="h1">Todavía no hay sorteo.</h1>
        <p className="lead">La asignación se hace una sola vez para todo el equipo. Si ves este mensaje, avisale a quien organiza.</p>
      </section>
    );
  }

  const reveal = () => {
    if (reduce) {
      memo.set(true);
      setPhase('done');
      return;
    }
    setPhase('spin');
  };

  return (
    <section className="screen reveal wrap" aria-labelledby="reveal-h">
      <div className="reveal-head">
        <p className="eyebrow">02 / Saludo 1 · El destino decide</p>
        <h1 id="reveal-h" className="h1">El destino tiene algo para decirte.</h1>
      </div>

      <div className="reveal-stage">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" className="reveal-idle" exit={{ opacity: 0, y: -20 }}>
              <button type="button" className="destiny-btn" onClick={reveal}>
                <span className="destiny-cube" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span>Revelar</span>
              </button>
              <p className="muted small">Una persona del equipo, asignada al azar para todo QuartzSales. Es fija: no se vuelve a sortear.</p>
            </motion.div>
          )}

          {phase !== 'idle' && (
            <motion.div key="res" className="reveal-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.p className="reveal-quote" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                “Bueno, en realidad vos tenés algo para decirle a…”
              </motion.p>

              <div className="reel" aria-live="polite">
                {phase === 'spin' ? (
                  <motion.ul
                    className="reel-track"
                    aria-hidden="true"
                    initial={{ y: 0 }}
                    animate={{ y: `-${(reel.length - 1) * 100}%` }}
                    transition={{ duration: 2.8, ease: [0.12, 0.8, 0.2, 1], delay: 0.6 }}
                    onAnimationComplete={() => {
                      memo.set(true);
                      setPhase('done');
                    }}
                  >
                    {reel.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </motion.ul>
                ) : (
                  <motion.h2 className="reel-final" initial={reduce ? false : { scale: 1.08, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
                    {assignment.name}
                  </motion.h2>
                )}
              </div>

              {phase === 'done' && (
                <motion.div className="reveal-after" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <p className="role-chip">{assignment.role}</p>
                  {progress.destino ? (
                    <>
                      <p className="lead">Ya le mandaste tu postal a {firstName(assignment.name)}. Una pieza menos para el árbol.</p>
                      <div className="row">
                        <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate(progress.eleccion ? '/recorrido' : '/elegir')}>
                          {progress.eleccion ? 'Ver mi recorrido' : 'Ir al saludo 2'}
                          <Icon name="arrow" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="lead">No hace falta que sea largo. Hace falta que sea tuyo.</p>
                      <div className="row">
                        <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/crear/destino')}>
                          Crear saludo
                          <Icon name="arrow" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
