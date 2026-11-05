import { useState } from 'react';
import { Download, Pencil, Plus, Upload } from 'lucide-react';
import { exportTeam, importTeam, parseTeamFile } from '../../db/team';
import { placeLabel, useCatalog, usePeople, useVacations } from '../../hooks/useData';
import { formatRange, todayISO } from '../../lib/dates';
import { downloadFile } from '../../lib/download';
import { personInitials } from '../../lib/team';
import { cn } from '../../lib/cn';
import type { Person } from '../../types';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useFilePicker } from '../data/useFilePicker';
import { PersonDialog } from './PersonDialog';

/** Sección "Equipo" de Configuración. Los datos quedan solo en este navegador. */
export function TeamEditor() {
  const people = usePeople() ?? [];
  const vacations = useVacations() ?? [];
  const catalog = useCatalog();
  const toast = useToast();
  const pick = useFilePicker('application/json,.json');
  const [editing, setEditing] = useState<Person | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ReturnType<typeof parseTeamFile> | null>(null);
  const today = todayISO();

  async function onImport() {
    const file = await pick();
    if (!file) return;
    const parsed = parseTeamFile(file.text);
    if (!parsed.ok) return toast.error(parsed.error);
    if (people.length === 0) {
      const r = await importTeam(parsed.file, 'reemplazar');
      return toast.success(`Equipo importado: ${r.added} personas.`);
    }
    setPending(parsed);
  }

  async function onExport() {
    const team = await exportTeam();
    downloadFile(`qs-calendar-equipo-${today}.json`, JSON.stringify(team, null, 2), 'application/json');
  }

  const sorted = [...people].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'es'));

  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 0 ? (
        <p className="text-[13px] text-muted">Todavía no hay nadie cargado. Agregá personas o importá el archivo del equipo.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded border border-border">
          {sorted.map((p) => {
            const next = vacations.filter((v) => v.personId === p.id && v.end >= today).sort((a, b) => a.start.localeCompare(b.start))[0];
            return (
              <li key={p.id} className={cn('flex items-center gap-3 px-3 py-2', !p.active && 'opacity-60')}>
                <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-grad text-[11px] font-extrabold text-white">{personInitials(p)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">{p.name}{!p.active && ' · inactivo'}</span>
                  <span className="block truncate text-xs text-muted">
                    {p.roles.map((r) => r.title || r.area).join(' / ')} · {p.city ?? placeLabel({ country: p.country, region: p.region }, catalog)}
                    {next && ` · vacaciones ${formatRange(next.start, next.end)}`}
                  </span>
                </span>
                <IconButton icon={Pencil} size="sm" label={`Editar a ${p.name}`} onClick={() => { setEditing(p); setOpen(true); }} />
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" icon={Plus} onClick={() => { setEditing(null); setOpen(true); }}>Agregar persona</Button>
        <Button size="sm" icon={Upload} onClick={() => void onImport()}>Importar equipo</Button>
        <Button size="sm" icon={Download} onClick={() => void onExport()} disabled={people.length === 0}>Exportar equipo</Button>
      </div>
      <p className="text-xs text-muted">El organigrama puede cambiar: editá puestos o desactivá personas cuando haga falta. El equipo se guarda solo en este navegador y se incluye en el respaldo.</p>

      <PersonDialog open={open} person={editing} onClose={() => setOpen(false)} />
      <ConfirmDialog
        open={!!pending?.ok}
        title="¿Cómo importo el equipo?"
        description="Se actualizan las personas con el mismo nombre y se suman las nuevas. No se borra a nadie."
        confirmLabel="Combinar"
        cancelLabel="Cancelar"
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          if (!pending?.ok) return;
          const r = await importTeam(pending.file, 'combinar');
          setPending(null);
          toast.success(`Equipo actualizado: ${r.added} nuevas, ${r.updated} actualizadas.`);
        }}
      />
    </div>
  );
}
