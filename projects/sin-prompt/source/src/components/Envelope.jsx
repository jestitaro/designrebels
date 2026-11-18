import { motion } from 'framer-motion';

/**
 * Sobre en CSS 3D. `open` levanta la solapa. `children` es lo que va adentro
 * (la postal), que se recorta por el bolsillo del sobre.
 */
export default function Envelope({ open = false, name, from, children, className = '', sealed = false, reduce }) {
  const t = reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 16 };
  return (
    <div className={`envelope ${open ? 'is-open' : ''} ${className}`}>
      <div className="env-back" />
      <div className="env-inside">{children}</div>
      <div className="env-pocket">
        <div className="env-address">
          {from && <span className="mono-label">De {from}</span>}
          {name && (
            <span className="env-name">
              <span className="mono-label">Para</span>
              {name}
            </span>
          )}
        </div>
      </div>
      <motion.div className="env-flap" initial={false} animate={{ rotateX: open ? 180 : 0, zIndex: open ? 1 : 4 }} transition={t}>
        <span className="env-flap-shape" />
      </motion.div>
      <motion.span
        className="env-seal"
        aria-hidden="true"
        initial={false}
        animate={{ opacity: open ? 0 : sealed ? 1 : 1, scale: open ? 0.6 : 1 }}
        transition={t}
      >
        <span />
      </motion.span>
    </div>
  );
}
