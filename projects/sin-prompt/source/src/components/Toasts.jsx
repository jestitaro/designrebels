import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../lib/store.jsx';
import Icon from './Icon.jsx';

export default function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast is-${t.tone}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <Icon name={t.tone === 'error' ? 'info' : t.tone === 'success' ? 'check' : 'sparkle'} size={18} />
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
