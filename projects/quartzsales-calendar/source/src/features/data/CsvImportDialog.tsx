import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, Copy } from 'lucide-react';
import { createEvent } from '../../db/repo';
import type { CsvParseResult } from '../../lib/eventsCsv';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/cn';
import { formatDate } from '../../lib/dates';

interface Props {
  result: CsvParseResult | null;
  fileName: string;
  onClose: () => void;
}

/** Vista previa del CSV: errores por fila, posibles duplicados y confirmación. */
export function CsvImportDialog({ result, fileName, onClose }: Props) {
  const toast = useToast();
  const [include, setInclude] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  // Por defecto: filas válidas y sin duplicados. Los duplicados se pueden sumar a mano.
  useEffect(() => {
    setInclude(new Set((result?.rows ?? []).filter((r) => r.content && !r.duplicate).map((r) => r.line)));
  }, [result]);

  const stats = useMemo(() => {
    const rows = result?.rows ?? [];
    return {
      valid: rows.filter((r) => r.content).length,
      errors: rows.filter((r) => r.errors.length).length,
      dups: rows.filter((r) => r.duplicate).length,
    };
  }, [result]);

  async function run() {
    if (!result) return;
    setBusy(true);
    try {
      const toImport = result.rows.filter((r) => r.content && include.has(r.line));
      for (const r of toImport) await createEvent(r.content!);
      toast.success(`Se importaron ${toImport.length} ${toImport.length === 1 ? 'evento' : 'eventos'}.`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo completar la importación.');
    } finally {
      setBusy(false);
    }
  }

  const blocked = !!result?.missingColumns.length;

  return (
    <Modal
      open={!!result}
      onClose={onClose}
      size="lg"
      title="Importar eventos desde CSV"
      description={fileName}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={blocked || include.size === 0 || busy} onClick={() => void run()}>
            Importar {include.size} {include.size === 1 ? 'evento' : 'eventos'}
          </Button>
        </>
      }
    >
      {result && (
        <div className="flex flex-col gap-4 text-sm">
          {blocked ? (
            <p role="alert" className="rounded bg-danger-bg px-3 py-2 text-danger-fg">
              Faltan columnas obligatorias: <strong>{result.missingColumns.join(', ')}</strong>. Descargá la plantilla para ver el formato.
            </p>
          ) : (
            <>
              <p className="text-[13px] text-muted">
                {result.rows.length} filas · <span className="text-success">{stats.valid} válidas</span> · <span className="text-danger-fg">{stats.errors} con errores</span> · <span className="text-warning">{stats.dups} posibles duplicados</span>.
                {' '}Las filas con errores no se importan. Los posibles duplicados quedan sin marcar: sumalos solo si corresponde.
              </p>
              {result.unknownColumns.length > 0 && (
                <p className="rounded bg-warning-bg px-3 py-2 text-[13px] text-warning">Columnas ignoradas: {result.unknownColumns.join(', ')}.</p>
              )}
              <ul className="flex flex-col divide-y divide-border rounded border border-border">
                {result.rows.map((r) => (
                  <li key={r.line} className={cn('flex items-start gap-3 px-3 py-2.5', r.errors.length > 0 && 'bg-danger-bg/40')}>
                    <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--qs-primary)]" disabled={!r.content}
                      checked={include.has(r.line)} aria-label={`Importar fila ${r.line}: ${r.title}`}
                      onChange={(e) => setInclude((s) => { const n = new Set(s); if (e.target.checked) n.add(r.line); else n.delete(r.line); return n; })} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-medium">
                        <span className="text-xs font-normal text-subtle tabular-nums">Fila {r.line}</span>
                        {r.title}
                      </p>
                      {r.content && <p className="text-xs text-muted">{formatDate(r.content.startDate)}</p>}
                      {r.errors.length > 0 ? (
                        <ul className="mt-1 flex flex-col gap-0.5 text-xs text-danger-fg">
                          {r.errors.map((e, i) => <li key={i} className="flex gap-1"><CircleAlert aria-hidden className="mt-0.5 size-3 shrink-0" />{e}</li>)}
                        </ul>
                      ) : r.duplicate ? (
                        <p className="mt-1 flex gap-1 text-xs text-warning"><Copy aria-hidden className="mt-0.5 size-3 shrink-0" />
                          Posible duplicado de {r.duplicate.kind === 'existente' ? `“${r.duplicate.title}” (ya cargado)` : r.duplicate.title}.
                        </p>
                      ) : (
                        <p className="mt-1 flex gap-1 text-xs text-success"><CircleCheck aria-hidden className="mt-0.5 size-3 shrink-0" />Lista para importar.</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
