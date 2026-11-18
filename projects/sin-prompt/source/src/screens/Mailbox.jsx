import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useStore } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import { firstName } from '../config/participants.js';
import { downloadPostcardPng } from '../lib/exportPng.jsx';
import Envelope from '../components/Envelope.jsx';
import Postcard from '../components/Postcard.jsx';
import PostcardArt from '../components/PostcardArt.jsx';
import Icon from '../components/Icon.jsx';

/** Ritual de apertura: sobre → solapa → postal que sale → postal en mano. */
function Opening({ msg, me, onClose }) {
  const reduce = useReducedMotion();
  const { markRead, toast } = useStore();
  const [phase, setPhase] = useState(reduce ? 'card' : 'closed'); // closed · open · out · card
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    markRead(msg.id);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = () => {
    setPhase('open');
    setTimeout(() => setPhase('out'), 700);
    setTimeout(() => setPhase('card'), 1700);
  };

  return createPortal(
    <motion.div className="opening" role="dialog" aria-modal="true" aria-labelledby="open-h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" className="icon-btn opening-close" onClick={onClose} aria-label="Cerrar">
        <Icon name="close" />
      </button>
      <h2 id="open-h" className="sr-only">Postal de {msg.sender?.name}</h2>

      <AnimatePresence mode="wait">
        {phase !== 'card' ? (
          <motion.div key="env" className="opening-env" exit={{ y: 120, opacity: 0, transition: { duration: 0.5 } }}>
            <motion.div initial={{ y: 80, rotate: -6, opacity: 0 }} animate={{ y: 0, rotate: phase === 'closed' ? -2 : 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
              <Envelope open={phase !== 'closed'} name={me.name} from={phase === 'closed' ? null : firstName(msg.sender?.name)} reduce={reduce}>
                <motion.div className="opening-card" animate={{ y: phase === 'out' ? '-70%' : '4%' }} transition={{ type: 'spring', stiffness: 90, damping: 15 }}>
                  <PostcardArt designId={msg.designId} drawing={msg.drawing} />
                </motion.div>
              </Envelope>
            </motion.div>
            {phase === 'closed' && (
              <motion.div className="opening-cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <p className="muted">Alguien se tomó un rato para escribirte esto.</p>
                <button type="button" className="btn btn-light btn-lg" onClick={open} autoFocus>Abrir el sobre</button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="card" className="opening-final" initial={reduce ? false : { scale: 0.7, y: -80, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 110, damping: 16 }}>
            <Postcard
              designId={msg.designId}
              drawing={msg.drawing}
              body={msg.body}
              senderName={msg.sender?.name}
              recipientName={me.name}
              recipientRole={me.role}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
            />
            <div className="opening-actions">
              <p className="mono-label">De {msg.sender?.name}{msg.isSample ? ' · ejemplo' : ''}</p>
              <div className="row">
                <button type="button" className="btn btn-light" onClick={() => setFlipped((f) => !f)} autoFocus>
                  <Icon name="flip" /> {flipped ? 'Ver el frente' : 'Leer el mensaje'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost-light"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await downloadPostcardPng({ ...msg, recipient: me }, `postal-de-${firstName(msg.sender?.name).toLowerCase()}.png`);
                      toast('Postal guardada.', 'success');
                    } catch {
                      toast('No pudimos generar la imagen. Probá de nuevo.', 'error');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <Icon name="download" /> {saving ? 'Guardando…' : 'Guardar PNG'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}

export default function Mailbox() {
  const { me, messages, progress } = useStore();
  const [open, setOpen] = useState(null);
  const received = [...messages.received].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = received.filter((m) => !m.read).length;

  return (
    <section className="screen mailbox wrap" aria-labelledby="mb-h">
      <header className="mailbox-head">
        <p className="eyebrow">Recibidas</p>
        <h1 id="mb-h" className="h1">
          {received.length === 0 ? 'Todavía no llegó nada.' : unread ? `Tenés ${unread === 1 ? 'una carta' : `${unread} cartas`} sin abrir.` : 'Todo leído. Qué lindo.'}
        </h1>
        <p className="lead">
          {received.length === 0
            ? 'Las postales llegan a medida que el equipo las escribe. Mientras tanto, ¿escribiste las tuyas?'
            : 'Abrilas cuando tengas un minuto tranquilo. No vencen.'}
        </p>
        {received.length === 0 && !progress.done && (
          <button type="button" className="btn btn-light" onClick={() => navigate('/recorrido')}>Ir a mis saludos <Icon name="arrow" /></button>
        )}
      </header>

      <ul className="env-grid">
        {received.map((m, i) => (
          <motion.li key={m.id} initial={{ opacity: 0, y: 30, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: [-2, 1.5, -1, 2][i % 4] }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 120, damping: 16 }}>
            <button type="button" className={`env-btn ${m.read ? 'is-read' : ''}`} onClick={() => setOpen(m)} aria-label={`${m.read ? 'Postal' : 'Postal sin abrir'} de ${m.sender?.name}`}>
              <Envelope name={me.name} from={m.read ? firstName(m.sender?.name) : null} />
              {!m.read && <span className="env-new">Nueva</span>}
              {m.isSample && <span className="tag env-tag">Ejemplo</span>}
            </button>
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>{open && <Opening msg={open} me={me} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}
