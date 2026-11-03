import { useEffect, useRef } from 'react';
import { Button } from './Button';
import { Modal } from './Dialog';

/** Fallback cuando el navegador no permite copiar: muestra el texto seleccionado. */
export function ManualCopyDialog({ text, onClose }: { text: string | null; onClose: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (text) requestAnimationFrame(() => ref.current?.select());
  }, [text]);
  return (
    <Modal
      open={text !== null}
      onClose={onClose}
      title="Copialo a mano"
      description="El navegador no permitió copiar automáticamente. El texto ya está seleccionado: usá Ctrl+C (o mantené presionado en el celular)."
      footer={<Button variant="primary" onClick={onClose}>Listo</Button>}
    >
      <textarea
        ref={ref}
        readOnly
        aria-label="Texto para copiar"
        value={text ?? ''}
        rows={10}
        className="w-full rounded border border-border-strong bg-surface-2 p-3 font-mono text-[13px] focus-visible:outline-2 focus-visible:outline-focus"
      />
    </Modal>
  );
}
