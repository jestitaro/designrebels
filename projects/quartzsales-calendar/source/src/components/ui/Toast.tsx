import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  show: (message: string, options?: { tone?: ToastTone; action?: ToastItem['action']; duration?: number }) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons = { success: CircleCheck, error: CircleAlert, info: Info };
const toneClass = {
  success: 'text-success',
  error: 'text-danger-fg',
  info: 'text-info',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback<ToastApi['show']>(
    (message, options = {}) => {
      const id = nextId.current++;
      const tone = options.tone ?? 'info';
      setItems((list) => [...list.slice(-2), { id, tone, message, action: options.action }]);
      const duration = options.duration ?? (options.action ? 7000 : tone === 'error' ? 6000 : 3500);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, { tone: 'success' }),
      error: (m) => show(m, { tone: 'error' }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
      >
        {items.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 text-sm text-text shadow-lg"
            >
              <Icon aria-hidden className={cn('size-5 shrink-0', toneClass[t.tone])} />
              <p className="min-w-0 flex-1">{t.message}</p>
              {t.action && (
                <button
                  type="button"
                  className="shrink-0 rounded px-2 py-1 text-[13px] font-semibold text-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-focus"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => dismiss(t.id)}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-focus"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
