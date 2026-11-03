import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, description, confirmLabel, cancelLabel = 'Cancelar', destructive, busy, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      role="alertdialog"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-muted">{description}</div>
    </Modal>
  );
}
