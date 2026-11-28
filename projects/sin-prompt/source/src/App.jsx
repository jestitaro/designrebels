import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useRoute, navigate } from './lib/router.js';
import { useStore } from './lib/store.jsx';
import Nav from './components/Nav.jsx';
import Toasts from './components/Toasts.jsx';
import Intro from './screens/Intro.jsx';
import Journey from './screens/Journey.jsx';
import Reveal from './screens/Reveal.jsx';
import Choose from './screens/Choose.jsx';
import Creator from './screens/Creator.jsx';
import Game from './screens/Game.jsx';
import Mailbox from './screens/Mailbox.jsx';
import LegoQ from './screens/LegoQ.jsx';

const DARK = ['/recibidas'];
// En producción todo requiere sesión; en demo, árbol y galería se pueden mirar sin identificarse.
const NEEDS_ME = ['/recorrido', '/destino', '/elegir', '/crear/destino', '/crear/eleccion', '/juego', '/recibidas'];

function screenFor(path) {
  switch (path) {
    case '/recorrido': return <Journey />;
    case '/destino': return <Reveal />;
    case '/elegir': return <Choose />;
    case '/crear/destino': return <Creator slot="destino" />;
    case '/crear/eleccion': return <Creator slot="eleccion" />;
    case '/juego': return <Game />;
    case '/recibidas': return <Mailbox />;
    case '/lego-q': return <LegoQ />;
    default: return <Intro />;
  }
}

export default function App() {
  const path = useRoute();
  const { ready, me, unread, toast } = useStore();
  const reduce = useReducedMotion();
  const notified = useRef(false);

  const guarded = !me && NEEDS_ME.includes(path);
  const key = guarded ? '/' : path;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [key]);

  // Aviso discreto de postales recibidas, una vez por sesión.
  useEffect(() => {
    if (!ready || !me || notified.current || unread === 0 || path === '/recibidas') return;
    notified.current = true;
    const t = setTimeout(() => toast(unread === 1 ? 'Te llegó una postal. Sin apuro: está en Recibidas.' : `Te llegaron ${unread} postales. Sin apuro: están en Recibidas.`), 1800);
    return () => clearTimeout(t);
  }, [ready, me, unread, path, toast]);

  // Título de la pestaña acompaña la pantalla.
  useEffect(() => {
    const titles = {
      '/juego': 'Armá el árbol', '/recibidas': 'Recibidas',
      '/destino': 'El destino decide', '/elegir': 'Ahora elegís vos', '/recorrido': 'Tu recorrido', '/lego-q': 'La Q en ladrillos',
    };
    document.title = (titles[key] ? titles[key] + ' · ' : '') + 'Este año, sin prompt · QuartzSales';
  }, [key]);

  if (!ready) {
    return (
      <div className="boot" role="status">
        <span className="boot-caret" aria-hidden="true" />
        <span className="sr-only">Cargando</span>
      </div>
    );
  }

  const dark = DARK.includes(key);
  return (
    <div className={`app ${dark ? 'theme-dark' : ''}`}>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Saltar al contenido
      </a>
      <Nav path={key} dark={dark} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          tabIndex={-1}
          key={key}
          className="main"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {guarded ? <Intro gateMessage="Antes de seguir, decinos quién sos." /> : screenFor(path)}
        </motion.main>
      </AnimatePresence>
      <Toasts />
    </div>
  );
}

export { navigate };
