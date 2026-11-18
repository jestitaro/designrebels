import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import { firstName } from '../config/participants.js';
import { formatTime, plural } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import PostcardArt from '../components/PostcardArt.jsx';
import Postcard from '../components/Postcard.jsx';
import Dialog from '../components/Dialog.jsx';

export default function Journey() {
  const { me, api, assignment, progress, tree, messages } = useStore();
  const [best, setBest] = useState(null);
  const [galleryCount, setGalleryCount] = useState(null);
  const [view, setView] = useState(null);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    api.getLeaderboard().then((b) => setBest(b.find((r) => r.participant.id === me.id && !r.isSample)?.ms ?? null));
    api.getGallery().then((g) => setGalleryCount(g.length));
  }, [api, me.id]);

  const pending = (progress.destino ? 0 : 1) + (progress.eleccion ? 0 : 1);
  const rows = [
    {
      n: '01', title: 'El destino decide', meta: assignment ? `Para ${assignment.name}` : '—',
      status: progress.destino ? 'Enviada' : 'Pendiente', done: !!progress.destino,
      to: progress.destino ? null : '/destino', cta: 'Escribir',
    },
    {
      n: '02', title: 'Vos elegís', meta: progress.eleccion ? `Para ${progress.eleccion.recipient?.name}` : 'A quien quieras',
      status: progress.eleccion ? 'Enviada' : progress.destino ? 'Pendiente' : 'Después del 01', done: !!progress.eleccion,
      to: progress.eleccion ? null : '/elegir', cta: 'Elegir',
    },
    { n: '03', title: 'El árbol colectivo', meta: tree ? `${tree.placed} de ${tree.total} piezas` : '—', status: 'Compartido', to: '/arbol', cta: 'Ver' },
    { n: '04', title: 'Armá el árbol', meta: best != null ? `Tu mejor tiempo: ${formatTime(best)}` : 'Sin partidas todavía', status: 'Ranking', to: '/juego', cta: 'Jugar' },
    { n: '05', title: 'Galería', meta: galleryCount != null ? plural(galleryCount, 'postal pública', 'postales públicas') : '—', status: 'Explorar', to: '/galeria', cta: 'Explorar' },
    { n: '06', title: 'Recibidas', meta: plural(messages.received.length, 'postal', 'postales'), status: messages.received.some((m) => !m.read) ? 'Sin abrir' : 'Al día', to: '/recibidas', cta: 'Abrir' },
  ];

  return (
    <section className="screen journey wrap" aria-labelledby="journey-h">
      <header className="journey-head">
        <p className="eyebrow">Tu recorrido</p>
        <h1 id="journey-h" className="h1">
          {pending === 0 ? `Hiciste todo, ${firstName(me.name)}. Gracias.` : pending === 1 ? 'Te queda un saludo.' : 'Dos saludos te esperan.'}
        </h1>
        <p className="lead">{pending === 0 ? 'Tus dos piezas ya están en el árbol. Ahora: jugar, mirar y leer.' : 'No hay apuro, pero tampoco hay prompt. Escribilos vos.'}</p>
      </header>

      <ol className="journey-list">
        {rows.map((r, i) => (
          <motion.li key={r.n} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            {r.to ? (
              <a href={`#${r.to}`} className={`jrow ${r.done ? 'is-done' : ''}`} onClick={(e) => { e.preventDefault(); navigate(r.to); }}>
                <JRow r={r} />
              </a>
            ) : (
              <div className={`jrow ${r.done ? 'is-done' : ''}`}>
                <JRow r={r} />
              </div>
            )}
          </motion.li>
        ))}
      </ol>

      {messages.sent.length > 0 && (
        <div className="sent-strip">
          <h2 className="h3">Tus postales enviadas</h2>
          <div className="sent-cards">
            {messages.sent.map((m) => (
              <button key={m.id} type="button" className="sent-card" onClick={() => { setFlip(false); setView(m); }}>
                <PostcardArt designId={m.designId} drawing={m.drawing} />
                <span>Para {m.recipient?.name} · {m.visibility === 'public' ? 'Pública' : 'Privada'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!view} onClose={() => setView(null)} labelledBy="sent-view" wide className="viewer">
        {view && (
          <>
            <h2 id="sent-view" className="sr-only">Postal para {view.recipient?.name}</h2>
            <Postcard designId={view.designId} drawing={view.drawing} body={view.body} senderName={me.name} recipientName={view.recipient?.name} recipientRole={view.recipient?.role} flipped={flip} onFlip={() => setFlip((f) => !f)} />
            <div className="dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setFlip((f) => !f)}><Icon name="flip" /> Dar vuelta</button>
              <button type="button" className="btn btn-primary" onClick={() => setView(null)} data-autofocus>Cerrar</button>
            </div>
          </>
        )}
      </Dialog>
    </section>
  );
}

function JRow({ r }) {
  return (
    <>
      <span className="jrow-n">{r.n}</span>
      <span className="jrow-title">{r.title}</span>
      <span className="jrow-meta">{r.meta}</span>
      <span className={`jrow-status ${r.done ? 'is-done' : ''}`}>
        {r.done && <Icon name="check" size={16} stroke={2.4} />}
        {r.status}
      </span>
      {r.to && (
        <span className="jrow-cta">
          {r.cta} <Icon name="arrow" size={18} />
        </span>
      )}
    </>
  );
}
