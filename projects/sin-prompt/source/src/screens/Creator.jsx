import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import { firstName } from '../config/participants.js';
import { orderForRole, getPostcard } from '../config/postcards.js';
import { safeStorage } from '../lib/format.js';
import PostcardArt from '../components/PostcardArt.jsx';
import Postcard from '../components/Postcard.jsx';
import Envelope from '../components/Envelope.jsx';
import Icon from '../components/Icon.jsx';
import DrawEditor from './DrawEditor.jsx';

const MIN = 12;
const MAX = 600;
const STEPS = [
  ['mode', 'Formato'],
  ['art', 'Postal'],
  ['write', 'Mensaje'],
  ['preview', 'Envío'],
];

function Stepper({ step }) {
  const idx = step === 'pick' || step === 'draw' ? 1 : STEPS.findIndex((s) => s[0] === step);
  return (
    <ol className="stepper" aria-label="Pasos">
      {STEPS.map(([id, label], i) => (
        <li key={id} className={i < idx ? 'is-done' : i === idx ? 'is-current' : ''} aria-current={i === idx ? 'step' : undefined}>
          <span className="mono-label">0{i + 1}</span> {label}
        </li>
      ))}
    </ol>
  );
}

// ── A/B: cómo crear ─────────────────────────────────────────────────────────
function ModePick({ onPick, recipient }) {
  const cards = orderForRole(recipient.roleKey).slice(0, 3);
  return (
    <div className="mode-pick">
      <button type="button" className="mode-tile tile-a" onClick={() => onPick('pick')}>
        <span className="mode-fan" aria-hidden="true">
          {cards.map((c, i) => (
            <span key={c.id} style={{ '--i': i }}>
              <PostcardArt designId={c.id} />
            </span>
          ))}
        </span>
        <span className="mode-txt">
          <span className="mono-label">A</span>
          <strong>Elegir una postal</strong>
          <span>Trece diseños pensados para cada rol. Algunos, con chiste interno.</span>
        </span>
        <Icon name="arrow" className="mode-arrow" />
      </button>
      <button type="button" className="mode-tile tile-b" onClick={() => onPick('draw')}>
        <span className="mode-doodle" aria-hidden="true">
          <svg viewBox="0 0 300 200">
            <path d="M40 150 C 70 60, 110 60, 130 120 S 190 170, 210 90 S 250 40, 265 70" />
            <path d="M150 40 l20 34 h-40z" className="d2" />
          </svg>
        </span>
        <span className="mode-txt">
          <span className="mono-label">B</span>
          <strong>Dibujar la tuya</strong>
          <span>Como cuando rayás la pantalla en una llamada. Sin talento requerido.</span>
        </span>
        <Icon name="arrow" className="mode-arrow" />
      </button>
    </div>
  );
}

// ── Galería de postales en carrusel ─────────────────────────────────────────
function CardPick({ recipient, value, onChange, onDone, onBack }) {
  const list = useMemo(() => orderForRole(recipient.roleKey), [recipient.roleKey]);
  const [sel, setSel] = useState(value || list[0].id);
  const track = useRef(null);
  const reduce = useReducedMotion();
  const card = getPostcard(sel);
  const suggested = (c) => c.roles.includes(recipient.roleKey);

  const scrollBy = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.7, behavior: reduce ? 'auto' : 'smooth' });

  return (
    <div className="card-pick">
      <div className="card-stage">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={sel}
            className="card-stage-inner"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, rotate: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, rotate: -1.5, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -40, rotate: -6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
          >
            <Postcard designId={sel} title={card.line} />
          </motion.div>
        </AnimatePresence>
        <div className="card-stage-meta">
          <span className="mono-label">{suggested(card) ? `Sugerida para ${recipient.role}` : card.roles.length ? 'Otra área' : 'Para cualquiera'}</span>
          <strong>{card.line}</strong>
        </div>
      </div>

      <div className="carousel">
        <button type="button" className="icon-btn car-prev" onClick={() => scrollBy(-1)} aria-label="Postales anteriores"><Icon name="back" /></button>
        <div className="car-track" ref={track} role="radiogroup" aria-label="Postales">
          {list.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={sel === c.id}
              aria-label={`${c.title}: ${c.line}`}
              className={`car-item ${sel === c.id ? 'is-selected' : ''}`}
              onClick={() => {
                setSel(c.id);
                onChange(c.id);
              }}
            >
              <PostcardArt designId={c.id} />
              <span className="car-cap">
                {suggested(c) && <em>Sugerida · </em>}
                {c.title}
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="icon-btn car-next" onClick={() => scrollBy(1)} aria-label="Más postales"><Icon name="arrow" /></button>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}><Icon name="back" /> Volver</button>
        <button type="button" className="btn btn-primary" onClick={() => onDone(sel)}>Usar esta postal <Icon name="arrow" /></button>
      </div>
    </div>
  );
}

// ── Escribir ────────────────────────────────────────────────────────────────
function Write({ draft, recipient, me, onChange, onDone, onBack }) {
  const [touched, setTouched] = useState(false);
  const len = draft.body.trim().length;
  const tooShort = len < MIN;
  return (
    <div className="write">
      <div className="write-card" aria-hidden="true">
        <PostcardArt designId={draft.designId} drawing={draft.kind === 'drawing' ? draft.drawing : null} />
      </div>
      <div className="write-form">
        <label htmlFor="msg" className="write-label">
          Tu mensaje para <strong>{firstName(recipient.name)}</strong>
        </label>
        <textarea
          id="msg"
          className="write-area"
          value={draft.body}
          maxLength={MAX}
          rows={7}
          autoComplete="off"
          autoCorrect="on"
          spellCheck
          placeholder={`Hola ${firstName(recipient.name)}, este año…`}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-describedby="msg-help msg-count"
          aria-invalid={touched && tooShort}
        />
        <div className="write-meta">
          <p id="msg-help" className={touched && tooShort ? 'field-error' : 'muted small'}>
            {touched && tooShort ? `Un poquito más: mínimo ${MIN} caracteres.` : '¿Buscás el botón de “Generar con IA”? No hay. Es a propósito.'}
          </p>
          <span id="msg-count" className={`count ${len > MAX - 40 ? 'is-near' : ''}`} aria-live="polite">
            {len}/{MAX}
          </span>
        </div>
        <p className="write-sign">— {me.name}</p>
        <div className="step-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}><Icon name="back" /> Cambiar postal</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setTouched(true);
              if (!tooShort) onDone();
            }}
            aria-disabled={tooShort}
          >
            Previsualizar <Icon name="arrow" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Previsualizar + privacidad ──────────────────────────────────────────────
function Preview({ draft, recipient, me, onVisibility, onBack, onSend, sending }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setFlipped(true), 900);
    return () => clearTimeout(t);
  }, [reduce]);
  return (
    <div className="preview">
      <div className="preview-card">
        <Postcard
          designId={draft.designId}
          drawing={draft.kind === 'drawing' ? draft.drawing : null}
          body={draft.body}
          senderName={me.name}
          recipientName={recipient.name}
          recipientRole={recipient.role}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />
        <button type="button" className="link flip-hint" onClick={() => setFlipped((f) => !f)}>
          <Icon name="flip" size={18} /> {flipped ? 'Ver el frente' : 'Ver el dorso'}
        </button>
      </div>
      <div className="preview-side">
        <fieldset className="privacy">
          <legend>¿Quién la puede ver?</legend>
          <label className={`priv-opt ${draft.visibility === 'private' ? 'is-on' : ''}`}>
            <input type="radio" name="vis" value="private" checked={draft.visibility === 'private'} onChange={() => onVisibility('private')} />
            <Icon name="lock" />
            <span>
              <strong>Privada</strong>
              <span>Solo la ve {firstName(recipient.name)}.</span>
            </span>
          </label>
          <label className={`priv-opt ${draft.visibility === 'public' ? 'is-on' : ''}`}>
            <input type="radio" name="vis" value="public" checked={draft.visibility === 'public'} onChange={() => onVisibility('public')} />
            <Icon name="globe" />
            <span>
              <strong>Pública</strong>
              <span>Además puede aparecer en la galería del equipo.</span>
            </span>
          </label>
        </fieldset>
        <p className="muted small">Una vez enviada no se puede editar. Como las cartas de verdad.</p>
        <div className="step-actions column">
          <button type="button" className="btn btn-primary btn-lg" onClick={onSend} disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar postal'} <Icon name="arrow" />
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}><Icon name="back" /> Editar mensaje</button>
        </div>
      </div>
    </div>
  );
}

// ── Animación: postal al sobre, sobre que se va ─────────────────────────────
function Sending({ draft, recipient, onDone }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState('in');
  useEffect(() => {
    if (reduce) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase('close'), 1100);
    const t2 = setTimeout(() => setPhase('fly'), 1900);
    const t3 = setTimeout(onDone, 2900);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [reduce, onDone]);

  return (
    <div className="sending" role="status" aria-live="assertive">
      <span className="sr-only">Enviando la postal a {recipient.name}…</span>
      <motion.div
        className="sending-env"
        animate={phase === 'fly' ? { x: '70vw', y: '-60vh', rotate: 14, scale: 0.5, opacity: 0 } : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
        transition={phase === 'fly' ? { duration: 1, ease: [0.6, -0.1, 0.7, 0.4] } : { duration: 0.3 }}
      >
        <Envelope open={phase === 'in'} name={recipient.name} reduce={reduce}>
          <motion.div
            className="sending-card"
            initial={{ y: '-95%', rotate: -4 }}
            animate={{ y: phase === 'in' ? ['-95%', '-95%', '6%'] : '6%', rotate: 0 }}
            transition={{ duration: 1, times: [0, 0.3, 1], ease: [0.5, 0, 0.2, 1] }}
          >
            <PostcardArt designId={draft.designId} drawing={draft.kind === 'drawing' ? draft.drawing : null} />
          </motion.div>
        </Envelope>
      </motion.div>
      <motion.p className="sending-note" initial={{ opacity: 0 }} animate={{ opacity: phase === 'fly' ? 1 : 0 }}>
        Allá va.
      </motion.p>
    </div>
  );
}

function Sent({ slot, recipient, msg }) {
  return (
    <motion.div className="sent" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
      <p className="eyebrow">{slot === 'destino' ? 'Saludo 1 de 2' : 'Saludo 2 de 2'} · Enviado</p>
      <h1 className="h1">Enviada.</h1>
      <p className="lead">
        {firstName(recipient.name)} la va a encontrar cuando entre. Y vos acabás de sumar una pieza al árbol de QuartzSales.
      </p>
      <p className="muted">{msg.visibility === 'public' ? 'Es pública: también puede aparecer en la galería.' : 'Es privada: solo la ve quien la recibe.'}</p>
      <div className="row">
        {slot === 'destino' ? (
          <>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/elegir')}>Seguir con el saludo 2 <Icon name="arrow" /></button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/arbol')}>Ver mi pieza en el árbol</button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/arbol')}>Ver el árbol <Icon name="arrow" /></button>
        )}
      </div>
    </motion.div>
  );
}

// ── Orquestador ─────────────────────────────────────────────────────────────
export default function Creator({ slot }) {
  const { me, assignment, participants, progress, sendPostcard, toast } = useStore();
  const store = useMemo(() => safeStorage(`sinprompt.draft.${me.id}.${slot}`, {}), [me.id, slot]);
  const [draft, setDraft] = useState(() => {
    const saved = store.get();
    // Si se recargó en pleno envío, volvemos a la vista previa.
    if (saved.step === 'sending' || saved.step === 'sent') saved.step = 'preview';
    return { step: 'mode', kind: 'design', designId: null, drawing: null, drawState: null, body: '', visibility: 'private', ...saved };
  });
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState(null);
  const pending = useRef(null);

  const recipient =
    slot === 'destino' ? assignment : participants.find((p) => p.id === draft.recipientId && p.id !== me.id);

  // Persistir el borrador (sin bloquear si el storage está lleno).
  useEffect(() => {
    if (!sentMsg) store.set(draft);
  }, [draft, store, sentMsg]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const already = slot === 'destino' ? progress.destino : progress.eleccion;

  if (sentMsg && draft.step === 'sent') {
    return (
      <section className="screen creator wrap">
        <Sent slot={slot} recipient={recipient} msg={sentMsg} />
      </section>
    );
  }

  if (already && draft.step !== 'sending') {
    return (
      <section className="screen center wrap">
        <p className="eyebrow">{slot === 'destino' ? 'Saludo 1' : 'Saludo 2'}</p>
        <h1 className="h1">Este saludo ya salió.</h1>
        <p className="lead">Le escribiste a {already.recipient?.name}. Si querés escribir más, hacelo en persona: también cuenta.</p>
        <div className="row">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/recorrido')}>Ver mi recorrido <Icon name="arrow" /></button>
        </div>
      </section>
    );
  }

  if (!recipient) {
    if (slot === 'eleccion') navigate('/elegir', { replace: true });
    return null;
  }

  const send = async () => {
    setSending(true);
    set({ step: 'sending' });
    try {
      pending.current = sendPostcard({
        slot,
        recipientId: recipient.id,
        kind: draft.kind,
        designId: draft.kind === 'design' ? draft.designId : null,
        drawing: draft.kind === 'drawing' ? draft.drawing : null,
        body: draft.body,
        visibility: draft.visibility,
      });
      await pending.current;
    } catch (e) {
      toast(e.message || 'No se pudo enviar. Tu borrador sigue acá.', 'error');
      set({ step: 'preview' });
      setSending(false);
    }
  };

  const afterAnimation = async () => {
    try {
      const msg = await pending.current;
      store.clear();
      setSentMsg(msg);
      set({ step: 'sent' });
    } catch {
      /* el error ya se mostró */
    } finally {
      setSending(false);
    }
  };

  const step = draft.step;
  const header = (
    <header className="creator-head">
      <div>
        <p className="eyebrow">{slot === 'destino' ? 'Saludo 1 · El destino decide' : 'Saludo 2 · Vos elegís'}</p>
        <h1 className="h2">
          Para <span className="accent">{recipient.name}</span>
        </h1>
        <p className="muted">{recipient.role}</p>
      </div>
      <Stepper step={step} />
    </header>
  );

  return (
    <section className="screen creator wrap" aria-label={`Crear postal para ${recipient.name}`}>
      {step !== 'sending' && header}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 'mode' && (
            <>
              <h2 className="step-q">¿Cómo querés armar tu postal?</h2>
              <ModePick recipient={recipient} onPick={(s) => set({ step: s, kind: s === 'draw' ? 'drawing' : 'design' })} />
            </>
          )}
          {step === 'pick' && (
            <CardPick
              recipient={recipient}
              value={draft.designId}
              onChange={(id) => set({ designId: id })}
              onBack={() => set({ step: 'mode' })}
              onDone={(id) => set({ designId: id, kind: 'design', step: 'write' })}
            />
          )}
          {step === 'draw' && (
            <DrawEditor
              recipientName={recipient.name}
              initial={draft.drawState}
              onBack={() => set({ step: 'mode' })}
              onDone={({ drawing, ops, bg }) => set({ drawing, drawState: { ops, bg }, kind: 'drawing', step: 'write' })}
            />
          )}
          {step === 'write' && (
            <Write
              draft={draft}
              me={me}
              recipient={recipient}
              onChange={(body) => set({ body })}
              onBack={() => set({ step: draft.kind === 'drawing' ? 'draw' : 'pick' })}
              onDone={() => set({ step: 'preview' })}
            />
          )}
          {step === 'preview' && (
            <Preview
              draft={draft}
              me={me}
              recipient={recipient}
              sending={sending}
              onVisibility={(v) => set({ visibility: v })}
              onBack={() => set({ step: 'write' })}
              onSend={send}
            />
          )}
          {step === 'sending' && <Sending draft={draft} recipient={recipient} onDone={afterAnimation} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
