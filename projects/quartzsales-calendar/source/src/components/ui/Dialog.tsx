import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap, useScrollLock } from '../../hooks/useFocusTrap';
import { useLatest } from '../../hooks/useLatest';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

interface DialogBaseProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Rol ARIA: 'alertdialog' para confirmaciones destructivas. */
  role?: 'dialog' | 'alertdialog';
}

interface ModalProps extends DialogBaseProps {
  size?: 'sm' | 'md' | 'lg';
}

const modalSizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const latestClose = useLatest(onClose);
  useFocusTrap(ref, open, () => latestClose.current());
  useScrollLock(open);
  return ref;
}

/** Diálogo centrado. Esc y clic en el fondo cierran. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', role = 'dialog' }: ModalProps) {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  const descId = useId();
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="animate-fade-in absolute inset-0 bg-overlay" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        data-qs-dialog
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'animate-pop-in relative flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-surface shadow-lg outline-none sm:rounded-lg',
          modalSizes[size],
        )}
      >
        <header className="flex items-start gap-3 border-b border-border px-5 pt-4 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-extrabold text-text">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-[13px] text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton icon={X} label="Cerrar" size="sm" onClick={onClose} className="-mr-2" />
        </header>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Panel inferior para mobile. Esc, clic en el fondo o el botón cierran. */
export function BottomSheet({ open, onClose, title, description, children, footer, role = 'dialog' }: DialogBaseProps) {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  const descId = useId();
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="animate-fade-in absolute inset-0 bg-overlay" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        data-qs-dialog
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="animate-sheet-in relative flex max-h-[90dvh] w-full flex-col rounded-t-xl bg-surface shadow-lg outline-none"
      >
        <div className="flex justify-center pt-2" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-border-strong" />
        </div>
        <header className="flex items-start gap-3 px-4 pt-2 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-extrabold text-text">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-[13px] text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton icon={X} label="Cerrar" onClick={onClose} className="-mr-1" />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
