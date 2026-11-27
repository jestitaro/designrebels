import { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import Dialog from './Dialog.jsx';

export default function DemoBadge() {
  const { isDemo, api } = useStore();
  const [open, setOpen] = useState(false);
  if (!isDemo) return null;
  return (
    <>
      <button type="button" className="demo-badge" onClick={() => setOpen(true)}>
        <span className="demo-dot" aria-hidden="true" />
        <span className="demo-long">Modo </span>demo
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="demo-title" wide>
        <p className="eyebrow">Prototipo</p>
        <h2 id="demo-title" className="dialog-title">Esto es una demostración.</h2>
        <div className="demo-cols">
          <div>
            <h3>Funciona de verdad</h3>
            <ul className="ticks">
              <li>Todo el recorrido: identificación, sorteo, postales, dibujo, envío.</li>
              <li>El sorteo: es global y fijo sobre el listado completo (un solo ciclo, nadie se toca a sí mismo).</li>
              <li>Validaciones: no te podés escribir a vos, ni mandar dos veces el mismo saludo.</li>
              <li>El editor de dibujo, el minijuego y la descarga en PNG.</li>
              <li>El progreso se guarda si recargás la página.</li>
            </ul>
          </div>
          <div>
            <h3>Es simulado</h3>
            <ul className="ticks is-muted">
              <li>Los nombres son del equipo real (ver <code>config/participants.js</code>), pero las postales y tiempos marcados “Ejemplo” son inventados: nadie los escribió.</li>
              <li>Todo queda guardado <strong>solo en este navegador</strong>. Nadie más ve tus postales, el árbol ni tu tiempo.</li>
                            <li>Cualquiera puede elegir cualquier nombre. En producción se entra con link al mail.</li>
            </ul>
          </div>
        </div>
        <p className="dialog-body small">
          Para compartir datos entre el equipo hay que conectar Supabase: ver <code>projects/sin-prompt/supabase/README.md</code>.
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await api.resetDemo();
              window.location.hash = '#/';
              window.location.reload();
            }}
          >
            Borrar datos de la demo
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setOpen(false)} data-autofocus>Entendido</button>
        </div>
      </Dialog>
    </>
  );
}
