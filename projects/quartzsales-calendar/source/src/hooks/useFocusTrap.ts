import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * Atrapa el foco dentro de `ref` mientras `active`, cierra con Esc y
 * devuelve el foco al elemento que lo tenía al abrir.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;

    const initial = root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(root)[0] ?? root;
    initial.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (!root) return;
      if (event.key === 'Escape' && onEscape) {
        // Solo el diálogo superior responde a Esc.
        const dialogs = document.querySelectorAll('[data-qs-dialog]');
        if (dialogs[dialogs.length - 1] !== root) return;
        event.stopPropagation();
        onEscape();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables(root);
      if (items.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
    // onEscape cambia en cada render; se lee la última versión vía closure del efecto activo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ref]);
}

let lockCount = 0;
/** Bloquea el scroll del body mientras haya algún diálogo abierto. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount++;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      lockCount--;
      if (lockCount === 0) document.body.style.overflow = previous;
    };
  }, [active]);
}
