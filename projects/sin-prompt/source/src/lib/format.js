export const formatTime = (ms) => {
  if (ms == null) return '—';
  const total = Math.max(0, Math.floor(ms / 10));
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function safeStorage(key, fallback) {
  return {
    get() {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch {
        return fallback;
      }
    },
    set(v) {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* sin persistencia */
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        /* nada */
      }
    },
  };
}
