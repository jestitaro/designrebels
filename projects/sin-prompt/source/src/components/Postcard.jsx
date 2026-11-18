import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import PostcardArt from './PostcardArt.jsx';

/** Dorso de la postal: mensaje, firma, estampilla y destinatario. */
export function PostcardBack({ body, senderName, recipientName, recipientRole }) {
  const len = (body || '').length;
  const sizeClass = len > 380 ? 'is-xlong' : len > 220 ? 'is-long' : len > 110 ? 'is-mid' : '';
  return (
    <div className="pc-back">
      <div className={`pc-msg ${sizeClass}`}>
        <p>{body || <span className="pc-placeholder">Tu mensaje va a aparecer acá.</span>}</p>
        <span className="pc-sign">— {senderName}</span>
      </div>
      <div className="pc-addr">
        <div className="pc-stamp" aria-hidden="true">
          <span className="pc-stamp-tri" />
          <span>2026</span>
        </div>
        <div className="pc-postmark" aria-hidden="true">
          SIN PROMPT
          <br />
          QS · 2026
        </div>
        <div className="pc-to">
          <span className="mono-label">Para</span>
          <strong>{recipientName}</strong>
          <span>{recipientRole}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Postal como objeto físico: inclinación con el puntero, sombra que acompaña
 * y giro para ver el dorso.
 */
export default function Postcard({
  designId,
  drawing,
  body,
  senderName,
  recipientName,
  recipientRole,
  flipped = false,
  onFlip,
  tilt = true,
  className = '',
  title,
}) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 160, damping: 18 });
  const glareX = useTransform(mx, [-0.5, 0.5], ['20%', '80%']);

  const move = (e) => {
    if (!tilt || reduce || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const leave = () => {
    mx.set(0);
    my.set(0);
  };

  const Wrapper = onFlip ? 'button' : 'div';
  return (
    <motion.div className={`postcard ${className}`} onPointerMove={move} onPointerLeave={leave} style={{ rotateX: rx, rotateY: ry }}>
      <Wrapper
        className="pc-flipper-btn"
        {...(onFlip
          ? { type: 'button', onClick: onFlip, 'aria-label': flipped ? 'Ver el frente de la postal' : 'Dar vuelta la postal para leer el mensaje' }
          : {})}
      >
        <motion.div
          className="pc-flipper"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 16 }}
        >
          <div className="pc-face pc-front" aria-hidden={flipped}>
            <PostcardArt designId={designId} drawing={drawing} title={title} />
            {tilt && !reduce && <motion.span className="pc-glare" style={{ '--gx': glareX }} />}
          </div>
          <div className="pc-face pc-backface" aria-hidden={!flipped}>
            <PostcardBack body={body} senderName={senderName} recipientName={recipientName} recipientRole={recipientRole} />
          </div>
        </motion.div>
      </Wrapper>
    </motion.div>
  );
}
