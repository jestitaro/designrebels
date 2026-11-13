import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, CircleCheck, CircleDashed, Copy, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { updateEvent } from '../../db/repo';
import { useCatalog } from '../../hooks/useData';
import { compareISO, formatDate, formatRange, isValidISODate, parseISO, todayISO } from '../../lib/dates';
import { newId } from '../../lib/id';
import { cn } from '../../lib/cn';
import { editionSchema, fieldErrors } from '../../schemas/event';
import type { CalendarEvent, EventEdition } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DateInput } from '../../components/ui/DateInput';
import { Modal } from '../../components/ui/Dialog';
import { Field, Input, Select } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';

/** Horario legible; marca cuando cruza la medianoche. */
export function editionHours(ed: Pick<EventEdition, 'startTime' | 'endTime'>): string {
  if (!ed.startTime) return 'Todo el día';
  if (!ed.endTime) return `Desde las ${ed.startTime} h`;
  if (ed.endTime === '00:00') return `${ed.startTime} a 24 h`;
  return `${ed.startTime} a ${ed.endTime} h${ed.endTime < ed.startTime ? ' (termina al día siguiente)' : ''}`;
}

function sortEditions(list: EventEdition[]): EventEdition[] {
  return [...list].sort((a, b) => compareISO(a.startDate, b.startDate) || (a.region ?? '').localeCompare(b.region ?? ''));
}

/** Misma región, misma ciudad y misma fecha en el mismo evento = duplicado. */
export function isDuplicateEdition(list: EventEdition[], ed: EventEdition): boolean {
  return list.some((x) => x.id !== ed.id && x.startDate === ed.startDate && (x.region ?? '') === (ed.region ?? '') && (x.city ?? '') === (ed.city ?? ''));
}

/** Sección "Ediciones" del detalle: tabla por fecha, agregar, duplicar, editar y quitar. */
export function EditionsSection({ event }: { event: CalendarEvent }) {
  const catalog = useCatalog();
  const toast = useToast();
  const today = todayISO();
  const editions = useMemo(() => sortEditions(event.editions ?? []), [event.editions]);
  const years = useMemo(() => [...new Set(editions.map((e) => parseISO(e.startDate).y))].sort(), [editions]);
  const [year, setYear] = useState<number | 'todos'>('todos');
  const [dialog, setDialog] = useState<{ edition: EventEdition | null; base?: EventEdition } | null>(null);
  const [toDelete, setToDelete] = useState<EventEdition | null>(null);

  const visible = year === 'todos' ? editions : editions.filter((e) => parseISO(e.startDate).y === year);
  const place = (ed: EventEdition) => catalog.placeName(ed.city) ?? catalog.placeName(ed.region) ?? catalog.placeName(event.country) ?? event.country;

  async function save(list: EventEdition[]) {
    await updateEvent(event.id, { editions: list.length ? sortEditions(list) : undefined });
  }

  return (
    <section className="flex flex-col gap-2" aria-labelledby="event-editions-title">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="event-editions-title" className="flex flex-1 items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
          <CalendarRange aria-hidden className="size-3.5" />Ediciones
        </h3>
        {years.length > 1 && (
          <Select aria-label="Filtrar ediciones por año" className="h-8 w-auto py-0 text-xs" value={String(year)}
            onChange={(e) => setYear(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}>
            <option value="todos">Todos los años</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        )}
        <Button size="sm" icon={Plus} onClick={() => setDialog({ edition: null })}>Agregar edición</Button>
      </div>

      {editions.length === 0 ? (
        <p className="rounded border border-dashed border-border-strong px-3 py-3 text-[13px] text-muted">
          Si este evento se hace en otra fecha según la provincia o la ciudad (como la Noche de los Museos), agregá una edición por lugar.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded border border-border">
          {visible.map((ed) => {
            const past = compareISO(ed.endDate ?? ed.startDate, today) < 0;
            return (
              <li key={ed.id} className={cn('flex items-start gap-2 px-3 py-2.5', past && 'opacity-60')}>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-sm font-bold">
                    {place(ed)}
                    {ed.localName && <span className="font-normal text-muted"> · “{ed.localName}”</span>}
                  </p>
                  <p className="text-[13px] text-muted">
                    {ed.endDate && ed.endDate !== ed.startDate ? `Del ${formatRange(ed.startDate, ed.endDate)}` : formatDate(ed.startDate)} · {editionHours(ed)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {past && <Badge>Ya se hizo</Badge>}
                    {ed.verification === 'confirmado'
                      ? <Badge tone="success" icon={CircleCheck}>Confirmada</Badge>
                      : <Badge tone="warning" icon={CircleDashed} title={ed.note}>Pendiente</Badge>}
                    {ed.url && (
                      <a href={ed.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                        {ed.source || 'Programa'} <ExternalLink aria-hidden className="size-3" />
                        <span className="sr-only">(se abre en otra pestaña)</span>
                      </a>
                    )}
                  </div>
                  {ed.verification !== 'confirmado' && ed.note && <p className="text-xs text-muted">{ed.note}</p>}
                </div>
                <IconButton icon={Copy} size="sm" variant="ghost" label={`Duplicar edición de ${place(ed)}`} onClick={() => setDialog({ edition: null, base: ed })} />
                <IconButton icon={Pencil} size="sm" variant="ghost" label={`Editar edición de ${place(ed)}`} onClick={() => setDialog({ edition: ed })} />
                <IconButton icon={Trash2} size="sm" variant="danger-ghost" label={`Quitar edición de ${place(ed)}`} onClick={() => setToDelete(ed)} />
              </li>
            );
          })}
        </ul>
      )}

      <EditionDialog
        open={!!dialog}
        event={event}
        edition={dialog?.edition ?? null}
        base={dialog?.base}
        onClose={() => setDialog(null)}
        onSave={async (ed) => {
          const list = editions.some((x) => x.id === ed.id) ? editions.map((x) => (x.id === ed.id ? ed : x)) : [...editions, ed];
          await save(list);
          toast.success(dialog?.edition ? 'Edición guardada.' : 'Edición agregada.');
          setDialog(null);
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="¿Quitar esta edición?"
        description={toDelete ? `Se quita la edición de ${place(toDelete)} del ${formatDate(toDelete.startDate)}.` : ''}
        confirmLabel="Quitar"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          const id = toDelete?.id;
          setToDelete(null);
          await save(editions.filter((x) => x.id !== id));
          toast.success('Edición quitada.');
        }}
      />
    </section>
  );
}

interface EditionDialogProps {
  open: boolean;
  event: CalendarEvent;
  /** Edición a editar; null para una nueva. */
  edition: EventEdition | null;
  /** Al duplicar: precarga todo menos la región y la fecha. */
  base?: EventEdition;
  onClose: () => void;
  onSave: (edition: EventEdition) => Promise<void>;
}

function EditionDialog({ open, event, edition, base, onClose, onSave }: EditionDialogProps) {
  const catalog = useCatalog();
  const country = catalog.countryById.get(event.country);
  const [form, setForm] = useState({ region: '', city: '', startDate: '', endDate: '', startTime: '', endTime: '', localName: '', url: '', source: '', verification: 'pendiente' as EventEdition['verification'], note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const src = edition ?? base;
    setForm({
      region: edition?.region ?? '',
      city: edition?.city ?? '',
      startDate: edition?.startDate ?? '',
      endDate: edition?.endDate ?? '',
      startTime: src?.startTime ?? '',
      endTime: src?.endTime ?? '',
      localName: edition?.localName ?? '',
      url: edition?.url ?? '',
      source: edition?.source ?? '',
      verification: edition?.verification ?? 'pendiente',
      note: edition?.note ?? '',
    });
    setErrors({});
  }, [open, edition, base]);

  const region = country?.regions.find((r) => r.id === form.region);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const opt = (v: string) => (v.trim() ? v.trim() : undefined);

  async function submit() {
    const candidate: EventEdition = {
      id: edition?.id ?? newId('ed'),
      region: opt(form.region),
      city: opt(form.city),
      startDate: form.startDate,
      endDate: opt(form.endDate),
      startTime: opt(form.startTime),
      endTime: opt(form.endTime),
      localName: opt(form.localName),
      url: opt(form.url),
      source: opt(form.source),
      verification: form.verification,
      note: form.verification === 'confirmado' ? undefined : opt(form.note),
    };
    const result = editionSchema.safeParse(candidate);
    const errs = result.success ? {} : fieldErrors(result.error);
    if (!isValidISODate(form.startDate)) errs.startDate = 'Indicá la fecha (dd/mm/aaaa).';
    if (form.verification === 'confirmado' && !candidate.url) errs.url = 'Para marcarla como confirmada, pegá el link de la fuente.';
    if (!errs.startDate && isDuplicateEdition(event.editions ?? [], candidate)) errs.startDate = 'Ya hay una edición en ese lugar y esa fecha.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await onSave(candidate);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={edition ? 'Editar edición' : base ? 'Duplicar edición' : 'Agregar edición'}
      description={base && !edition ? 'Se copian el horario y el resto: cambiá el lugar y la fecha.' : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => void submit()}>{edition ? 'Guardar' : 'Agregar'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Provincia o región">
            {(p) => (
              <Select id={p.id} value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value, city: '' }))} disabled={!country?.regions.length} data-autofocus>
                <option value="">Todo el país</option>
                {country?.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Ciudad">
            {(p) => (
              <Select id={p.id} value={form.city} onChange={(e) => set('city', e.target.value)} disabled={!region?.cities.length}>
                <option value="">Toda la región</option>
                {region?.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" required error={errors.startDate}>
            {(p) => <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={form.startDate} onChange={(v) => set('startDate', v)} />}
          </Field>
          <Field label="Hasta (si dura más de un día)" error={errors.endDate}>
            {(p) => <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={form.endDate} min={form.startDate} onChange={(v) => set('endDate', v)} />}
          </Field>
          <Field label="Desde las" error={errors.startTime}>
            {(p) => <Input id={p.id} type="time" aria-describedby={p.describedBy} aria-invalid={p.invalid} value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />}
          </Field>
          <Field label="Hasta las" hint="Puede ser después de medianoche (ej. 19 a 2 h).">
            {(p) => <Input id={p.id} type="time" aria-describedby={p.describedBy} value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />}
          </Field>
        </div>
        <Field label="Nombre local" hint="Solo si ahí se llama distinto. Ej. “Museos a la luz de la luna”.">
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} value={form.localName} onChange={(e) => set('localName', e.target.value)} />}
        </Field>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <Field label="Link al programa o la fuente" error={errors.url}>
            {(p) => <Input id={p.id} type="url" inputMode="url" placeholder="https://" aria-describedby={p.describedBy} aria-invalid={p.invalid} value={form.url} onChange={(e) => set('url', e.target.value)} />}
          </Field>
          <Field label="¿Quién lo publica?">
            {(p) => <Input id={p.id} placeholder="Ej. Municipalidad" value={form.source} onChange={(e) => set('source', e.target.value)} />}
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <Field label="Estado">
            {(p) => (
              <Select id={p.id} value={form.verification} onChange={(e) => set('verification', e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmada</option>
              </Select>
            )}
          </Field>
          {form.verification !== 'confirmado' && (
            <Field label="Qué falta confirmar">
              {(p) => <Input id={p.id} value={form.note} onChange={(e) => set('note', e.target.value)} />}
            </Field>
          )}
        </div>
      </div>
    </Modal>
  );
}
