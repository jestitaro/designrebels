import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import { firstName } from '../config/participants.js';
import { downloadPostcardPng } from '../lib/exportPng.jsx';
import PostcardArt from '../components/PostcardArt.jsx';
import Postcard from '../components/Postcard.jsx';
import Dialog from '../components/Dialog.jsx';
import Icon from '../components/Icon.jsx';

const tilt = (i) => [-3, 2, -1, 3, -2, 1.5][i % 6];
const lift = (i) => [0, 40, 12, 56, 24, 4][i % 6];

export default function Gallery() {
  const { api, me } = useStore();
  const reduce = useReducedMotion();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const track = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    api.getGallery().then(setItems).catch(() => setError(true));
  }, [api]);

  // Rueda vertical → scroll horizontal (solo con puntero fino).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
        if (atStart || atEnd) return;
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [items]);

  const show = (m) => {
    setFlipped(false);
    setOpen(m);
  };

  return (
    <section className="screen gallery" aria-labelledby="gal-h">
      <header className="gallery-head wrap">
        <div>
          <p className="eyebrow">Galería del equipo</p>
          <h1 id="gal-h" className="h1">Cosas que alguien escribió a mano.</h1>
        </div>
        <p className="lead">
          Solo aparecen las postales que su autor marcó como públicas. Las privadas no están acá, ni en ningún otro lado.
          {items && <span className="mono-label count-label">{items.length} postales</span>}
        </p>
      </header>

      {error && <p className="wrap field-error">No pudimos cargar la galería. Probá recargar la página.</p>}
      {items === null && !error && <div className="gallery-skeleton wrap" aria-hidden="true"><span /><span /><span /></div>}

      {items && items.length === 0 && (
        <div className="empty wrap">
          <h2 className="h3">Todavía no hay postales públicas.</h2>
          <p className="muted">La primera puede ser la tuya.</p>
          {me && <button type="button" className="btn btn-primary" onClick={() => navigate('/recorrido')}>Escribir una postal</button>}
        </div>
      )}

      {items && items.length > 0 && (
        <div
          className="gallery-track"
          ref={track}
          tabIndex={0}
          aria-label="Colección de postales. Desplazá horizontalmente."
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse') return;
            drag.current = { x: e.clientX, s: track.current.scrollLeft, moved: false };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.x;
            if (Math.abs(dx) > 4) drag.current.moved = true;
            track.current.scrollLeft = drag.current.s - dx;
          }}
          onPointerUp={() => setTimeout(() => (drag.current = null), 0)}
          onPointerLeave={() => (drag.current = null)}
        >
          {items.map((m, i) => (
            <motion.figure
              key={m.id}
              className="g-item"
              style={{ '--tilt': `${tilt(i)}deg`, '--lift': `${lift(i)}px` }}
              initial={reduce ? false : { opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: (i % 4) * 0.06 }}
            >
              <button
                type="button"
                className="g-card"
                onClick={(e) => {
                  if (drag.current?.moved) return e.preventDefault();
                  show(m);
                }}
                aria-label={`Postal de ${m.sender?.name} para ${m.recipient?.name}. Abrir.`}
              >
                <PostcardArt designId={m.designId} drawing={m.drawing} />
              </button>
              <figcaption>
                <span className="mono-label">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  De <strong>{firstName(m.sender?.name)}</strong> para <strong>{firstName(m.recipient?.name)}</strong>
                </span>
                {m.isSample && <span className="tag">Ejemplo</span>}
              </figcaption>
            </motion.figure>
          ))}
          <div className="g-end" aria-hidden="true">
            <span className="mono-label">Fin de la colección</span>
            <span>Por ahora.</span>
          </div>
        </div>
      )}

      <Dialog open={!!open} onClose={() => setOpen(null)} labelledBy="gv-h" wide className="viewer">
        <AnimatePresence>
          {open && (
            <div className="viewer-grid">
              <div className="viewer-card">
                <Postcard
                  designId={open.designId}
                  drawing={open.drawing}
                  body={open.body}
                  senderName={open.sender?.name}
                  recipientName={open.recipient?.name}
                  recipientRole={open.recipient?.role}
                  flipped={flipped}
                  onFlip={() => setFlipped((f) => !f)}
                />
              </div>
              <div className="viewer-side">
                <p className="mono-label">{open.isSample ? 'Postal de ejemplo' : 'Postal pública'}</p>
                <h2 id="gv-h" className="h3">De {open.sender?.name} para {open.recipient?.name}</h2>
                <p className="viewer-body">{open.body}</p>
                <div className="dialog-actions start">
                  <button type="button" className="btn btn-ghost" onClick={() => setFlipped((f) => !f)}><Icon name="flip" /> Dar vuelta</button>
                  <button type="button" className="btn btn-primary" onClick={() => setOpen(null)} data-autofocus>Seguir explorando</button>
                </div>
                {me && (open.recipientId === me.id || open.senderId === me.id) && (
                  <button type="button" className="link" onClick={() => downloadPostcardPng(open)}>
                    <Icon name="download" size={18} /> Guardar PNG
                  </button>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </Dialog>
    </section>
  );
}
