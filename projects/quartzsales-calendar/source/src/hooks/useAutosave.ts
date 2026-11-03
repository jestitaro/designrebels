import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Guarda con debounce los cambios pendientes. `flush` fuerza el guardado
 * (antes de cambiar de estado, copiar o salir). Se ejecuta también al desmontar.
 */
export function useAutosave<T extends object>(save: (changes: T) => Promise<unknown>, delay = 600) {
  const [state, setState] = useState<SaveState>('idle');
  const pending = useRef<T | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    const changes = pending.current;
    if (!changes) return;
    pending.current = null;
    setState('saving');
    try {
      await saveRef.current(changes);
      setState('saved');
    } catch (error) {
      console.error(error);
      setState('error');
    }
  }, []);

  const queue = useCallback(
    (changes: T) => {
      pending.current = { ...(pending.current ?? ({} as T)), ...changes };
      setState('saving');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), delay);
    },
    [delay, flush],
  );

  useEffect(() => () => void flush(), [flush]);

  return { state, queue, flush };
}
