import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { navigate } from '../lib/router.js';
import { useStore } from '../lib/store.jsx';
import { firstName, initials } from '../config/participants.js';
import Icon from './Icon.jsx';
import Dialog from './Dialog.jsx';
import iso from '../assets/iso-qs.svg';
import DemoBadge from './DemoBadge.jsx';

const LINKS = [
  { to: '/recorrido', label: 'Mis saludos', n: '01' },
  { to: '/juego', label: 'Juego', n: '02' },
];

export default function Nav({ path, dark }) {
  const { me, unread, signOut, isDemo } = useStore();
  const [menu, setMenu] = useState(false);
  const [who, setWho] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setMenu(false), [path]);

  const go = (to) => (e) => {
    e.preventDefault();
    navigate(to);
  };
  const active = (to) => path === to || (to === '/recorrido' && /^\/(destino|elegir|crear)/.test(path));

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${dark ? 'is-dark' : ''}`}>
        <a className="nav-brand" href="#/" onClick={go('/')} aria-label="Este año, sin prompt. Ir al inicio">
          <img src={iso} alt="" width="26" height="26" />
          <span>
            Sin prompt<em>.</em>
          </span>
        </a>
        <DemoBadge />

        <nav className="nav-links" aria-label="Secciones">
          {LINKS.map((l) => (
            <a key={l.to} href={`#${l.to}`} onClick={go(l.to)} aria-current={active(l.to) ? 'page' : undefined}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-right">
          {me && (
            <a href="#/recibidas" onClick={go('/recibidas')} className={`nav-inbox ${unread ? 'has-unread' : ''}`} aria-label={unread ? `Recibidas: ${unread} sin abrir` : 'Postales recibidas'} aria-current={path === '/recibidas' ? 'page' : undefined}>
              <Icon name="mail" size={20} />
              <span className="nav-inbox-label">Recibidas</span>
              {unread > 0 && <span className="badge">{unread}</span>}
            </a>
          )}
          {me ? (
            <button type="button" className="nav-me" onClick={() => setWho(true)} aria-label={`Sesión de ${me.name}`}>
              <span className="avatar sm">{initials(me.name)}</span>
              <span className="nav-me-name">{firstName(me.name)}</span>
            </button>
          ) : (
            <a href="#/" onClick={go('/')} className="btn btn-sm btn-ghost">Identificarme</a>
          )}
          <button type="button" className="nav-menu-btn" aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu((m) => !m)}>
            <Icon name={menu ? 'close' : 'menu'} size={22} />
            <span className="sr-only">Menú</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav aria-label="Secciones">
              {[...LINKS, ...(me ? [{ to: '/recibidas', label: unread ? `Recibidas (${unread})` : 'Recibidas', n: '03' }] : [])].map((l, i) => (
                <motion.a
                  key={l.to}
                  href={`#${l.to}`}
                  onClick={go(l.to)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  aria-current={active(l.to) ? 'page' : undefined}
                >
                  <span className="mono-label">{l.n}</span>
                  {l.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={who} onClose={() => setWho(false)} labelledBy="who-title">
        <p className="eyebrow">Sesión</p>
        <h2 id="who-title" className="dialog-title">Sos {me?.name}.</h2>
        <p className="dialog-body">
          {isDemo
            ? 'En modo demo podés cambiar de persona para probar cómo se ve la experiencia desde otro lado. En la versión real, cada persona entra con su mail.'
            : '¿No sos vos? Cerrá la sesión y entrá con tu mail.'}
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setWho(false)} data-autofocus>Listo</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              setWho(false);
              await signOut();
              navigate('/');
            }}
          >
            {isDemo ? 'Cambiar de persona' : 'Cerrar sesión'}
          </button>
        </div>
      </Dialog>
    </>
  );
}
