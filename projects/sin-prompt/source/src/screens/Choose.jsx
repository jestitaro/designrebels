import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import { firstName } from '../config/participants.js';
import { safeStorage } from '../lib/format.js';
import PersonPicker from '../components/PersonPicker.jsx';
import Icon from '../components/Icon.jsx';

export default function Choose() {
  const { me, participants, progress, assignment } = useStore();
  const draft = useMemo(() => safeStorage(`sinprompt.draft.${me?.id}.eleccion`, {}), [me?.id]);
  const [sel, setSel] = useState(() => draft.get().recipientId || null);
  const selected = participants.find((p) => p.id === sel);

  if (!progress.destino) {
    return (
      <section className="screen center wrap">
        <p className="eyebrow">03 / Saludo 2 · Vos elegís</p>
        <h1 className="h1">Primero, el destino.</h1>
        <p className="lead">El segundo saludo se habilita cuando mandes el primero. El destino es impaciente.</p>
        <div className="row">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/destino')}>Ir al saludo 1 <Icon name="arrow" /></button>
        </div>
      </section>
    );
  }

  if (progress.eleccion) {
    return (
      <section className="screen center wrap">
        <p className="eyebrow">03 / Saludo 2 · Vos elegís</p>
        <h1 className="h1">Listo: le escribiste a {firstName(progress.eleccion.recipient?.name)}.</h1>
        <p className="lead">Dos postales, dos piezas. Ahora mirá cómo va el árbol.</p>
        <div className="row">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/arbol')}>Ver el árbol <Icon name="arrow" /></button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen choose wrap" aria-labelledby="choose-h">
      <div className="choose-copy">
        <p className="eyebrow">03 / Saludo 2 · Vos elegís</p>
        <h1 id="choose-h" className="h1">Ahora elegís vos.</h1>
        <p className="lead">Siempre hay alguien a quien agradecerle algo. Esta es tu oportunidad.</p>
        <motion.div className="choose-selected" layout aria-live="polite">
          {selected ? (
            <>
              <span className="mono-label">Vas a escribirle a</span>
              <strong>{selected.name}</strong>
              <span className="muted">{selected.role}</span>
            </>
          ) : (
            <span className="muted">Nadie seleccionado todavía. Podés elegir a quien quieras, aunque otra persona también le escriba.</span>
          )}
        </motion.div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!selected}
          onClick={() => {
            draft.set({ ...draft.get(), recipientId: sel });
            navigate('/crear/eleccion');
          }}
        >
          {selected ? `Crear saludo para ${firstName(selected.name)}` : 'Elegí a alguien'}
          <Icon name="arrow" />
        </button>
      </div>
      <div className="choose-list">
        <PersonPicker
          people={participants}
          exclude={[me.id]}
          value={sel}
          onChange={setSel}
          disabledIds={assignment ? { [assignment.id]: 'tu saludo del destino' } : {}}
        />
      </div>
    </section>
  );
}
