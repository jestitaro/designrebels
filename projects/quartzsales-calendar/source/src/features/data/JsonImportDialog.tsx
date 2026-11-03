import { useEffect, useState } from 'react';
import { applyImport, summarizeImport, type ImportSummary } from '../../lib/backup';
import type { Backup } from '../../schemas/backup';
import { formatDate } from '../../lib/dates';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/cn';

interface Props {
  backup: Backup | null;
  fileName: string;
  migratedFrom?: number;
  onClose: () => void;
}

export function JsonImportDialog({ backup, fileName, migratedFrom, onClose }: Props) {
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [mode, setMode] = useState<'combinar' | 'reemplazar'>('combinar');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setSummary(null);
    setMode('combinar');
    setConfirmReplace(false);
    if (backup) void summarizeImport(backup).then(setSummary);
  }, [backup]);

  async function run() {
    if (!backup) return;
    setBusy(true);
    try {
      await applyImport(backup, mode);
      toast.success(mode === 'reemplazar' ? 'Datos reemplazados por el respaldo.' : 'Respaldo combinado con tus datos.');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo importar el respaldo. Tus datos no cambiaron.');
    } finally {
      setBusy(false);
    }
  }

  const row = (label: string, s: ImportSummary['events']) => (
    <tr className="border-t border-border">
      <th scope="row" className="py-2 text-left font-medium">{label}</th>
      <td className="py-2 text-right tabular-nums">{s.nuevos}</td>
      <td className="py-2 text-right tabular-nums">{s.duplicados}</td>
      <td className="py-2 text-right tabular-nums">{s.conflictos}</td>
    </tr>
  );

  return (
    <Modal
      open={!!backup}
      onClose={onClose}
      title="Importar respaldo"
      description={backup ? `${fileName} · exportado el ${formatDate(backup.exportedAt.slice(0, 10))}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant={mode === 'reemplazar' ? 'danger' : 'primary'} disabled={!summary || busy || (mode === 'reemplazar' && !confirmReplace)} onClick={() => void run()}>
            {mode === 'reemplazar' ? 'Reemplazar todo' : 'Combinar'}
          </Button>
        </>
      }
    >
      {backup && (
        <div className="flex flex-col gap-4 text-sm">
          {migratedFrom && <p className="rounded bg-info-bg px-3 py-2 text-info">El respaldo es de una versión anterior (v{migratedFrom}) y se actualizó al formato actual.</p>}
          {summary ? (
            <table className="w-full text-[13px]">
              <caption className="sr-only">Resumen de lo que trae el respaldo</caption>
              <thead>
                <tr className="text-xs text-muted">
                  <th scope="col" className="pb-1 text-left font-medium" />
                  <th scope="col" className="pb-1 text-right font-medium">Nuevos</th>
                  <th scope="col" className="pb-1 text-right font-medium">Duplicados</th>
                  <th scope="col" className="pb-1 text-right font-medium">Con conflicto</th>
                </tr>
              </thead>
              <tbody>
                {row('Eventos', summary.events)}
                {row('Saludos', summary.greetings)}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">Analizando…</p>
          )}
          <p className="text-xs text-muted">Duplicado: ya lo tenés igual. Con conflicto: mismo registro con contenido distinto.</p>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[13px] font-medium">¿Cómo querés importarlo?</legend>
            {([
              ['combinar', 'Combinar', 'Agrega lo nuevo. En los conflictos se queda la versión editada más recientemente. Tu configuración se mantiene.'],
              ['reemplazar', 'Reemplazar todo', 'Borra todos tus datos locales y carga el respaldo tal cual.'],
            ] as const).map(([v, label, help]) => (
              <label key={v} className={cn('flex cursor-pointer items-start gap-2.5 rounded border p-3', mode === v ? 'border-primary bg-primary-soft' : 'border-border-strong hover:bg-surface-2')}>
                <input type="radio" name="import-mode" checked={mode === v} onChange={() => { setMode(v); setConfirmReplace(false); }} className="mt-1 accent-[var(--qs-primary)]" />
                <span><span className="block font-medium">{label}</span><span className="block text-xs text-muted">{help}</span></span>
              </label>
            ))}
          </fieldset>
          {mode === 'reemplazar' && (
            <label className="flex items-start gap-2 rounded bg-danger-bg px-3 py-2 text-[13px] text-danger-fg">
              <input type="checkbox" checked={confirmReplace} onChange={(e) => setConfirmReplace(e.target.checked)} className="mt-0.5 size-4 accent-[var(--qs-danger)]" />
              Entiendo que se van a borrar mis eventos y saludos actuales.
            </label>
          )}
        </div>
      )}
    </Modal>
  );
}
