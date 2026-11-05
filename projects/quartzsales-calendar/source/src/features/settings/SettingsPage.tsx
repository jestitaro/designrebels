import { useEffect, useState, type ReactNode } from 'react';
import {
  CalendarArrowDown, Download, FileSpreadsheet, HardDrive, RotateCcw, ShieldAlert, Trash2, Upload,
} from 'lucide-react';
import { restoreDefaultSettings, updateSettings, wipeLocalData } from '../../db/repo';
import { useCatalog, useEvents, useSettings } from '../../hooks/useData';
import { formatDate, relativeDays, todayISO } from '../../lib/dates';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Dialog';
import { Field, Input } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import { CsvImportDialog } from '../data/CsvImportDialog';
import { JsonImportDialog } from '../data/JsonImportDialog';
import { useDataTransfer } from '../data/useDataTransfer';
import { useIcsExport } from '../reminders/useIcsExport';
import { CategoriesEditor } from './CategoriesEditor';
import { PlacesEditor } from './PlacesEditor';

function Section({ id, title, description, children }: { id: string; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-border bg-surface p-4 shadow-sm lg:p-5">
      <h2 id={id} className="text-[15px] font-extrabold">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const settings = useSettings();
  const catalog = useCatalog();
  const events = useEvents() ?? [];
  const toast = useToast();
  const transfer = useDataTransfer(catalog);
  const { exportEvents } = useIcsExport();
  const [leadDays, setLeadDays] = useState(String(settings.leadDays));
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [wipeStep, setWipeStep] = useState<0 | 1 | 2>(0);
  const [wipeText, setWipeText] = useState('');
  const today = todayISO();

  useEffect(() => setLeadDays(String(settings.leadDays)), [settings.leadDays]);

  const leadError = (() => {
    const n = Number(leadDays);
    return Number.isInteger(n) && n >= 0 && n <= 60 ? undefined : 'Ingresá un número entero entre 0 y 60.';
  })();

  async function saveLead() {
    if (leadError || Number(leadDays) === settings.leadDays) return;
    await updateSettings({ leadDays: Number(leadDays) });
    toast.success('Anticipación actualizada.');
  }

  const lastExport = settings.lastExportAt?.slice(0, 10);

  return (
    <div className="flex flex-col">
      <header className="lg:flex lg:h-16 lg:items-center lg:border-b lg:border-border lg:bg-surface lg:px-6">
        {/* En mobile el título ya está en la barra superior. */}
        <h1 className="sr-only lg:not-sr-only lg:text-xl lg:font-semibold">Configuración</h1>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 lg:p-6">
        <section aria-labelledby="local-data" className="rounded-lg border border-primary/30 bg-primary-soft p-4 lg:p-5">
          <h2 id="local-data" className="flex items-center gap-2 text-[15px] font-extrabold text-primary-soft-fg">
            <HardDrive aria-hidden className="size-4" />Tus datos viven en este navegador
          </h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[13px] text-text">
            <li>Todo se guarda solo en este navegador y este dispositivo.</li>
            <li>No hay sincronización: lo que cargues en la compu no aparece en el celular, y al revés.</li>
            <li>Si borrás los datos del navegador, se borra la información de la app.</li>
            <li>Conviene exportar un respaldo cada tanto. {lastExport ? <>Último respaldo: <strong>{formatDate(lastExport)}</strong> ({relativeDays(today, lastExport)}).</> : <strong>Todavía no exportaste ningún respaldo.</strong>}</li>
            <li>No cargues información confidencial ni datos personales.</li>
          </ul>
        </section>

        <Section id="s-theme" title="Tema" description="Por defecto sigue la preferencia del sistema.">
          <ThemeSwitcher className="max-w-sm" />
        </Section>

        <Section id="s-lead" title="Anticipación de recordatorios" description="Cuántos días antes de cada fecha aparece el aviso en Inicio para preparar el saludo. También se usa como alarma en los .ics.">
          <div className="flex items-end gap-2">
            <Field label="Días de anticipación" error={leadError} className="w-48">
              {(p) => (
                <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} type="number" min={0} max={60} inputMode="numeric"
                  value={leadDays} onChange={(e) => setLeadDays(e.target.value)} onBlur={() => void saveLead()}
                  onKeyDown={(e) => e.key === 'Enter' && void saveLead()} />
              )}
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted">Los recordatorios solo se ven al abrir la app: no hay notificaciones push ni con la app cerrada.</p>
        </Section>

        <Section id="s-places" title="Países" description="Podés agregar, renombrar o desactivar países.">
          <PlacesEditor countries={catalog.countries} />
        </Section>

        <Section id="s-cats" title="Categorías" description="Las categorías ocultas no se muestran en el calendario ni en Próximos.">
          <CategoriesEditor categories={catalog.categories} />
        </Section>

        <Section id="s-backup" title="Respaldo" description="Un archivo JSON con eventos, saludos, configuración, países y categorías.">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={Download} onClick={() => void transfer.exportJson()}>Exportar todo (JSON)</Button>
            <Button icon={Upload} onClick={() => void transfer.importJson()}>Importar respaldo</Button>
          </div>
        </Section>

        <Section id="s-csv" title="Eventos en CSV" description="Para cargar muchos eventos desde una planilla. Antes de importar vas a ver una vista previa con errores y posibles duplicados.">
          <div className="flex flex-wrap gap-2">
            <Button icon={FileSpreadsheet} onClick={transfer.downloadTemplate}>Descargar plantilla</Button>
            <Button icon={Upload} onClick={() => void transfer.importCsv()}>Importar CSV</Button>
            <Button icon={Download} onClick={() => transfer.exportCsv(events)}>Exportar eventos (CSV)</Button>
          </div>
        </Section>

        <Section id="s-ics" title="Recordatorios en tu calendario" description={`Descargá un .ics con los eventos de los próximos 12 meses y una alarma ${settings.leadDays} días antes, para sumarlos al calendario del celular o la compu.`}>
          <Button icon={CalendarArrowDown} onClick={() => exportEvents(events, `qs-calendar-${today}.ics`)}>Exportar .ics</Button>
        </Section>

        <Section id="s-reset" title="Restablecer" description="Acciones que no se pueden deshacer.">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button icon={RotateCcw} onClick={() => setConfirmRestore(true)}>Restaurar configuración por defecto</Button>
              <span className="text-xs text-muted">Tema, anticipación y visibilidad de categorías. No toca tus eventos ni saludos.</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="danger-ghost" icon={Trash2} onClick={() => setWipeStep(1)}>Borrar datos locales</Button>
              <span className="text-xs text-muted">Elimina todo lo guardado en este navegador.</span>
            </div>
          </div>
        </Section>
      </div>

      <p className="pb-6 text-center text-xs text-subtle">QuartzSales Calendar v{__APP_VERSION__} · build {__BUILD_LABEL__}</p>

      <JsonImportDialog backup={transfer.json?.backup ?? null} fileName={transfer.json?.name ?? ''} migratedFrom={transfer.json?.migratedFrom} onClose={() => transfer.setJson(null)} />
      <CsvImportDialog result={transfer.csv?.result ?? null} fileName={transfer.csv?.name ?? ''} onClose={() => transfer.setCsv(null)} />

      <ConfirmDialog
        open={confirmRestore}
        title="¿Restaurar la configuración por defecto?"
        description="Vuelven el tema del sistema, 3 días de anticipación y todas las categorías visibles."
        confirmLabel="Restaurar"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={async () => { setConfirmRestore(false); await restoreDefaultSettings(); toast.success('Configuración restaurada.'); }}
      />
      <ConfirmDialog
        open={wipeStep === 1}
        title="¿Borrar todos los datos locales?"
        description={<>Se eliminan eventos, saludos, versiones y configuración de este navegador. {lastExport ? `Tu último respaldo es del ${formatDate(lastExport)}.` : 'No tenés ningún respaldo exportado.'} Si querés conservarlos, exportá un respaldo antes.</>}
        confirmLabel="Continuar"
        destructive
        onCancel={() => setWipeStep(0)}
        onConfirm={() => { setWipeText(''); setWipeStep(2); }}
      />
      <Modal
        open={wipeStep === 2}
        onClose={() => setWipeStep(0)}
        role="alertdialog"
        size="sm"
        title="Confirmación final"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWipeStep(0)} data-autofocus>Cancelar</Button>
            <Button variant="danger" icon={ShieldAlert} disabled={wipeText.trim().toUpperCase() !== 'BORRAR'}
              onClick={async () => { await wipeLocalData(); window.location.hash = '#/inicio'; window.location.reload(); }}>
              Borrar definitivamente
            </Button>
          </>
        }
      >
        <Field label='Escribí "BORRAR" para confirmar'>
          {(p) => <Input id={p.id} value={wipeText} onChange={(e) => setWipeText(e.target.value)} autoComplete="off" />}
        </Field>
      </Modal>
    </div>
  );
}
