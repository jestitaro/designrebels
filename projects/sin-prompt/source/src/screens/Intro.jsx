import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import { firstName } from '../config/participants.js';
import PersonPicker from '../components/PersonPicker.jsx';
import LegoHero from '../components/LegoHero.jsx';
import Icon from '../components/Icon.jsx';

const PROMPT = 'Escribí un saludo de fin de año para mi equipo. Emotivo pero no cursi. Que suene a mí.';
const SEEN = 'sinprompt.introSeen';

/** Título que se ensambla: cada letra llega primero como bloque. */
function AssembledTitle({ lines, play }) {
  const reduce = useReducedMotion();
  let n = 0;
  return (
    <h1 className="hero-title" aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span className="hero-line" key={li} aria-hidden="true">
          {[...line].map((ch, ci) => {
            const i = n++;
            if (ch === ' ') return <span key={ci} className="char-space"> </span>;
            const d = 0.035 * i;
            const isDot = ch === '.' && ci === line.length - 1;
            return (
              <span key={ci} className={`char ${isDot ? 'is-dot' : ''}`}>
                {!reduce && play && (
                  <motion.span
                    className="char-block"
                    initial={{ scaleY: 0, opacity: 1 }}
                    animate={{ scaleY: [0, 1, 1, 0], opacity: [1, 1, 1, 0] }}
                    transition={{ duration: 0.9, delay: d, times: [0, 0.3, 0.55, 1], ease: 'easeInOut' }}
                  />
                )}
                <motion.span
                  className="char-glyph"
                  initial={reduce || !play ? false : { opacity: 0, y: '0.35em', rotateX: -70 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 20, delay: d + 0.38 }}
                >
                  {ch}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/** El prompt que se escribe y se borra antes del título. */
function PromptPrelude({ onDone }) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('type'); // type → select → erase → gone
  useEffect(() => {
    let i = 0;
    let t;
    const type = () => {
      i++;
      setText(PROMPT.slice(0, i));
      if (i < PROMPT.length) t = setTimeout(type, 22 + Math.random() * 30);
      else t = setTimeout(() => setPhase('select'), 700);
    };
    t = setTimeout(type, 500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (phase === 'select') {
      const t = setTimeout(() => setPhase('erase'), 750);
      return () => clearTimeout(t);
    }
    if (phase === 'erase') {
      setText('');
      const t = setTimeout(() => setPhase('gone'), 650);
      return () => clearTimeout(t);
    }
    if (phase === 'gone') onDone();
  }, [phase, onDone]);

  return (
    <motion.div className="prelude" exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }} transition={{ duration: 0.45 }}>
      <div className={`prompt-box ${phase === 'select' ? 'is-selected' : ''}`}>
        <span className="prompt-text">
          <span>{text}</span>
          <span className="caret" aria-hidden="true" />
        </span>
        <span className="prompt-send" aria-hidden="true">
          <Icon name="arrow" size={18} />
        </span>
      </div>
      <AnimatePresence>
        {phase === 'erase' && (
          <motion.p className="prelude-note" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            Mejor no.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Identify({ onDone }) {
  const { participants, signInAs, isDemo, api, toast } = useStore();
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  if (!isDemo) {
    return (
      <form
        className="identify"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr('');
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Ese mail no parece válido.');
          setBusy(true);
          try {
            await api.signInWithEmail(email);
            setSent(true);
          } catch (x) {
            setErr(x.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="eyebrow">Identificación</p>
        <h2 className="h2">¿Quién sos?</h2>
        {sent ? (
          <p className="lead">Te mandamos un link a <strong>{email}</strong>. Abrilo desde este dispositivo y volvés directo acá.</p>
        ) : (
          <>
            <p className="lead">Entrá con tu mail de QuartzSales. Así nadie puede escribir en tu nombre.</p>
            <label className="field">
              <span>Tu mail</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} aria-describedby={err ? 'mail-err' : undefined} />
            </label>
            {err && <p id="mail-err" className="field-error">{err}</p>}
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Mandame el link'}</button>
          </>
        )}
      </form>
    );
  }

  return (
    <div className="identify">
      <p className="eyebrow">Identificación</p>
      <h2 className="h2">¿Quién sos?</h2>
      <p className="lead">Buscá tu nombre en el equipo. <span className="muted">En la demo alcanza con elegirlo; en la versión real se entra con link al mail.</span></p>
      <PersonPicker people={participants} value={sel} onChange={setSel} autoFocus />
      <div className="identify-actions">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!sel || busy}
          onClick={async () => {
            setBusy(true);
            try {
              const p = await signInAs(sel);
              toast(`Hola, ${firstName(p.name)}.`, 'success');
              onDone(p);
            } catch (x) {
              toast(x.message, 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Un segundo…' : sel ? `Soy ${firstName(participants.find((p) => p.id === sel)?.name)}` : 'Elegí tu nombre'}
          <Icon name="arrow" />
        </button>
      </div>
    </div>
  );
}

export default function Intro({ gateMessage }) {
  const { me, participants, progress, tree } = useStore();
  const reduce = useReducedMotion();
  const seen = useMemo(() => {
    try {
      return sessionStorage.getItem(SEEN) === '1';
    } catch {
      return false;
    }
  }, []);
  const [stage, setStage] = useState(reduce || seen || gateMessage ? 'ready' : 'prompt');
  const [identify, setIdentify] = useState(!!gateMessage);
  const panelRef = useRef(null);

  const finishIntro = () => {
    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {
      /* nada */
    }
    setStage('ready');
  };

  const nextStep = () => (!progress.destino ? '/destino' : !progress.eleccion ? '/elegir' : '/recorrido');

  const start = () => {
    if (me) navigate(nextStep());
    else {
      setIdentify(true);
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 50);
    }
  };

  const total = participants.length * 2;

  return (
    <section className="hero" aria-labelledby="hero-h">
      <AnimatePresence mode="wait">
        {stage === 'prompt' && <PromptPrelude key="p" onDone={finishIntro} />}
      </AnimatePresence>
      {stage === 'prompt' && (
        <button type="button" className="skip-intro" onClick={finishIntro}>
          Saltar intro
        </button>
      )}

      {stage === 'ready' && (
        <div className="hero-grid wrap">
          <div className="hero-copy" id="hero-h">
            <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              QuartzSales · Fin de año 2026
            </motion.p>
            <AssembledTitle lines={['Este año,', 'sin prompt.']} play={!seen} />
            <motion.div className="hero-sub" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: seen ? 0.1 : 1.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              <p className="lead">Le pedimos de todo a la inteligencia artificial. Pero hay cosas que todavía vale la pena escribir nosotros mismos.</p>
              <p>Este fin de año, regalale unos minutos de tu tiempo a alguien de QuartzSales.</p>
              {gateMessage && <p className="gate-note" role="status">{gateMessage}</p>}
              <div className="hero-cta">
                <button type="button" className="btn btn-primary btn-lg" onClick={start}>
                  {me ? `Seguir, ${firstName(me.name)}` : 'Empezar'}
                  <Icon name="arrow" />
                </button>
                <a className="link" href="#/galeria" onClick={(e) => { e.preventDefault(); navigate('/galeria'); }}>
                  Ver la galería
                </a>
                <a className="link" href="#/lego-q" onClick={(e) => { e.preventDefault(); navigate('/lego-q'); }}>
                  Cómo se arma la Q
                </a>
              </div>
            </motion.div>
          </div>

          <motion.div className="hero-visual" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: seen ? 0 : 0.4, duration: 0.8 }}>
            <LegoHero dropIn={!seen} />
          </motion.div>

          <motion.dl className="hero-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: seen ? 0.2 : 1.6 }}>
            <div><dt>Personas</dt><dd>{participants.length}</dd></div>
            <div><dt>Postales</dt><dd>{total}</dd></div>
            <div><dt>Piezas colocadas</dt><dd>{tree?.placed ?? 0}</dd></div>
            <div><dt>Prompts</dt><dd>0</dd></div>
          </motion.dl>
        </div>
      )}

      <AnimatePresence>
        {identify && !me && stage === 'ready' && (
          <motion.div ref={panelRef} className="identify-wrap wrap" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <Identify
              onDone={() => {
                // Si venía de una sección protegida, la guarda se levanta sola.
                if (!gateMessage) navigate('/destino');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
