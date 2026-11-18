import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/** Modal accesible: foco inicial, Escape cierra, foco vuelve al disparador. */
export default function Dialog({ open, onClose, title, children, className = '', labelledBy, wide = false }) {
  const ref = useRef(null);
  const prev = useRef(null);
  useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement;
    const t = setTimeout(() => {
      const el = ref.current?.querySelector('[data-autofocus]') || ref.current?.querySelector('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      el?.focus();
    }, 60);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll('button:not([disabled]), [href], input, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      prev.current?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="dialog-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={labelledBy ? undefined : title}
            aria-labelledby={labelledBy}
            className={`dialog ${wide ? 'is-wide' : ''} ${className}`}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Confirm({ open, title, body, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} labelledBy="confirm-title" className="confirm">
      <h2 id="confirm-title" className="dialog-title">{title}</h2>
      {body && <p className="dialog-body">{body}</p>}
      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} data-autofocus>{cancelLabel}</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Dialog>
  );
}
