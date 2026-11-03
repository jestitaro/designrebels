import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCatalog } from '../../hooks/useData';
import { formatDate, MONTHS, parseISO, todayISO, WEEKDAYS, capitalize } from '../../lib/dates';
import { describeRecurrence } from '../../lib/recurrence';
import { eventContentSchema, fieldErrors, type EventContent } from '../../schemas/event';
import { RELEVANCE_META, VERIFICATION_META } from '../../components/domain/meta';
import { Button, IconButton } from '../../components/ui/Button';
import { DateInput } from '../../components/ui/DateInput';
import { Checkbox, Field, Input, Select, Textarea } from '../../components/ui/Field';
import { draftToContent, ruleStartDate, type DateMode, type EventDraft } from './eventDraft';

interface EventFormProps {
  formId: string;
  initial: EventDraft;
  onSubmit: (content: EventContent) => void | Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

const EDITORIAL = ['sin evaluar', 'para comunicar', 'en preparación', 'comunicado', 'descartado'] as const;

function Section({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <legend className="float-left mb-1 w-full">
        <span className="block text-[13px] font-semibold tracking-wide text-text uppercase">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

export function EventForm({ formId, initial, onSubmit, onDirtyChange }: EventFormProps) {
  const catalog = useCatalog();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const year = parseISO(todayISO()).y;

  function set<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    onDirtyChange?.(true);
    if (errors[key as string]) setErrors(({ [key as string]: _, ...rest }) => rest);
  }

  const country = catalog.countryById.get(draft.country);
  const region = country?.regions.find((r) => r.id === draft.region);
  const category = catalog.categoryById.get(draft.category);
  const activeCountries = catalog.countries.filter((c) => c.active || c.id === draft.country);

  const preview = useMemo(() => {
    const content = draftToContent(draft, year);
    if (!content.startDate) return null;
    return describeRecurrence(content);
  }, [draft, year]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = draftToContent(draft, year);
    const parsed = eventContentSchema.safeParse(content);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      if (draft.dateMode === 'yearly-nth-weekday' && errs.startDate) errs.ruleNth = 'Esa combinación no existe este año (por ejemplo, un 5.º lunes).';
      setErrors(errs);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    await onSubmit(parsed.data);
  }

  const err = (k: string) => errors[k];

  return (
    <form id={formId} ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Section title="Información básica">
        <Field label="Nombre" required error={err('title')}>
          {(p) => (
            <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.title} maxLength={160}
              onChange={(e) => set('title', e.target.value)} placeholder="Ej. Día Nacional del Mate" data-autofocus />
          )}
        </Field>
        <Field label="Resumen corto" hint={`${draft.summary.length}/280 · Se muestra en el calendario y las listas.`} error={err('summary')}>
          {(p) => (
            <Textarea id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} rows={2} maxLength={280}
              value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoría" required error={err('category')}>
            {(p) => (
              <Select id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.category}
                onChange={(e) => { set('category', e.target.value); set('subcategory', ''); }}>
                <option value="">Elegí una categoría</option>
                {catalog.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Subcategoría">
            {(p) => (
              <Select id={p.id} value={draft.subcategory} disabled={!category?.subcategories.length}
                onChange={(e) => set('subcategory', e.target.value)}>
                <option value="">Sin subcategoría</option>
                {category?.subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            )}
          </Field>
        </div>
      </Section>

      <Section title="Fecha">
        <div role="radiogroup" aria-label="Cómo se repite" className="grid gap-2 sm:grid-cols-2">
          {([
            ['yearly-fixed', 'Todos los años', 'Misma fecha (ej. 10/11)'],
            ['yearly-nth-weekday', 'Por regla', 'Ej. 4.º jueves de noviembre'],
            ['yearly-easter', 'Según Pascua', 'Ej. Viernes Santo, Lunes de Pascua'],
            ['none', 'Edición única', 'Fecha con año, no se repite'],
          ] as Array<[DateMode, string, string]>).map(([value, label, hint]) => (
            <label key={value}
              className="flex cursor-pointer items-start gap-2.5 rounded border border-border-strong p-3 transition-colors hover:bg-surface-2 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
              <input type="radio" name={`${formId}-mode`} value={value} checked={draft.dateMode === value}
                onChange={() => set('dateMode', value)} className="mt-1 accent-[var(--qs-primary)] focus-visible:outline-none" />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>

        {draft.dateMode === 'yearly-easter' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Día respecto de Pascua" hint="Jueves Santo: −3 · Viernes Santo: −2 · Domingo de Pascua: 0 · Lunes de Pascua: 1.">
              {(p) => (
                <Input id={p.id} aria-describedby={p.describedBy} type="number" min={-70} max={70} value={draft.easterOffset}
                  onChange={(e) => set('easterOffset', e.target.value)} />
              )}
            </Field>
            <Field label="Duración (días)">
              {(p) => (
                <Input id={p.id} type="number" min={1} max={60} value={draft.ruleDuration} onChange={(e) => set('ruleDuration', e.target.value)} />
              )}
            </Field>
          </div>
        ) : draft.dateMode === 'yearly-nth-weekday' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Semana" error={err('ruleNth')}>
              {(p) => (
                <Select id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.ruleNth} onChange={(e) => set('ruleNth', e.target.value)}>
                  {[['1', '1.º'], ['2', '2.º'], ['3', '3.º'], ['4', '4.º'], ['5', '5.º'], ['-1', 'Último']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Día de la semana">
              {(p) => (
                <Select id={p.id} value={draft.ruleWeekday} onChange={(e) => set('ruleWeekday', e.target.value)}>
                  {WEEKDAYS.map((w, i) => <option key={w} value={i}>{capitalize(w)}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Mes">
              {(p) => (
                <Select id={p.id} value={draft.ruleMonth} onChange={(e) => set('ruleMonth', e.target.value)}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{capitalize(m)}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Desplazamiento" hint="Días antes (−) o después (+). Black Friday: +1.">
              {(p) => (
                <Input id={p.id} aria-describedby={p.describedBy} type="number" min={-31} max={31} value={draft.ruleOffset}
                  onChange={(e) => set('ruleOffset', e.target.value)} />
              )}
            </Field>
            <Field label="Duración (días)">
              {(p) => (
                <Input id={p.id} type="number" min={1} max={60} value={draft.ruleDuration} onChange={(e) => set('ruleDuration', e.target.value)} />
              )}
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={draft.multiDay ? 'Desde' : 'Fecha'} required error={err('startDate')}
              hint={draft.dateMode === 'yearly-fixed' ? 'El año no importa: se repite todos los años.' : undefined}>
              {(p) => (
                <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} 
                  value={draft.startDate} onChange={(v) => set('startDate', v)} />
              )}
            </Field>
            {draft.multiDay && (
              <Field label="Hasta" error={err('endDate')}>
                {(p) => (
                  <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} 
                    min={draft.startDate} value={draft.endDate} onChange={(v) => set('endDate', v)} />
                )}
              </Field>
            )}
            <Checkbox className="sm:col-span-2" label="Dura varios días" checked={draft.multiDay}
              onChange={(e) => set('multiDay', e.target.checked)} />
          </div>
        )}

        {preview && (
          <p className="rounded bg-surface-2 px-3 py-2 text-[13px] text-muted" aria-live="polite">
            {preview}
            {(draft.dateMode === 'yearly-nth-weekday' || draft.dateMode === 'yearly-easter') && (() => {
              const d = ruleStartDate(draft, year);
              return d ? ` En ${year} cae el ${formatDate(d)}.` : '';
            })()}
          </p>
        )}

        <Checkbox label="Todo el día" checked={draft.allDay} onChange={(e) => set('allDay', e.target.checked)} />
        {!draft.allDay && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hora de inicio" required error={err('startTime')}>
              {(p) => <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} type="time" value={draft.startTime} onChange={(e) => set('startTime', e.target.value)} />}
            </Field>
            <Field label="Hora de fin" error={err('endTime')}>
              {(p) => <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} type="time" value={draft.endTime} onChange={(e) => set('endTime', e.target.value)} />}
            </Field>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div>
            <p className="text-[13px] font-medium">Feriado trasladado</p>
            <p className="text-xs text-muted">Si el día no laborable cae en otra fecha que la celebración, cargalo acá por año.</p>
          </div>
          {draft.observances.map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <Field label={`Fecha del feriado ${i + 1}`} error={err(`holidayObservances.${i}.date`)}>
                {(p) => (
                  <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={o.date}
                    onChange={(v) => set('observances', draft.observances.map((x, j) => (j === i ? { ...x, date: v, year: v.slice(0, 4) } : x)))} />
                )}
              </Field>
              <Field label="Nota" className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                {(p) => (
                  <Input id={p.id} value={o.note} placeholder="Ej. trasladado al lunes por decreto"
                    onChange={(e) => set('observances', draft.observances.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                )}
              </Field>
              <IconButton icon={Trash2} label={`Quitar feriado ${i + 1}`} variant="danger-ghost" className="col-start-2 row-start-1 self-end sm:col-start-auto sm:row-start-auto"
                onClick={() => set('observances', draft.observances.filter((_, j) => j !== i))} />
            </div>
          ))}
          <div>
            <Button size="sm" variant="ghost" icon={Plus} onClick={() => set('observances', [...draft.observances, { year: String(year), date: '', note: '' }])}>
              Agregar feriado trasladado
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Lugar" description="Referencia cultural del evento, nunca asociada a personas.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="País" required error={err('country')}>
            {(p) => (
              <Select id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.country}
                onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value, region: '', city: '' }))}>
                <option value="">Elegí un país</option>
                {activeCountries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Región">
            {(p) => (
              <Select id={p.id} value={draft.region} disabled={!country?.regions.length}
                onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value, city: '' }))}>
                <option value="">Todo el país</option>
                {country?.regions.filter((r) => r.active || r.id === draft.region).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Ciudad o zona">
            {(p) => (
              <Select id={p.id} value={draft.city} disabled={!region?.cities.length} onChange={(e) => set('city', e.target.value)}>
                <option value="">Toda la región</option>
                {region?.cities.filter((c) => c.active || c.id === draft.city).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </Field>
        </div>
      </Section>

      <Section title="Clasificación">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Relevancia" hint={RELEVANCE_META[draft.relevance].help}>
            {(p) => (
              <Select id={p.id} aria-describedby={p.describedBy} value={draft.relevance} onChange={(e) => set('relevance', e.target.value as EventDraft['relevance'])}>
                {Object.entries(RELEVANCE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Estado editorial">
            {(p) => (
              <Select id={p.id} value={draft.editorialStatus} onChange={(e) => set('editorialStatus', e.target.value as EventDraft['editorialStatus'])}>
                {EDITORIAL.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
              </Select>
            )}
          </Field>
          <div className="flex flex-col justify-end gap-1">
            <Checkbox label="Favorito" checked={draft.favorite} onChange={(e) => set('favorite', e.target.checked)} />
          </div>
        </div>
      </Section>

      <Section title="Verificación y fuente">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Verificación">
            {(p) => (
              <Select id={p.id} value={draft.verification} onChange={(e) => set('verification', e.target.value as EventDraft['verification'])}>
                {Object.entries(VERIFICATION_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Última verificación" error={err('lastVerifiedAt')}>
            {(p) => <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid}  value={draft.lastVerifiedAt} onChange={(v) => set('lastVerifiedAt', v)} />}
          </Field>
          <Field label="Fuente" required={draft.verification === 'confirmado'} error={err('source')} hint="Sitio oficial, organismo u organizador.">
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.source} onChange={(e) => set('source', e.target.value)} />}
          </Field>
          <Field label="Link de la fuente" error={err('sourceUrl')}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} type="url" inputMode="url" placeholder="https://" value={draft.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} />}
          </Field>
        </div>
        {draft.verification !== 'confirmado' && (
          <Field label="Qué falta confirmar">
            {(p) => <Textarea id={p.id} rows={2} value={draft.verificationNote} onChange={(e) => set('verificationNote', e.target.value)} />}
          </Field>
        )}
      </Section>

      <Section title="Contenido">
        <Field label="Descripción">
          {(p) => <Textarea id={p.id} rows={4} value={draft.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>
        <Field label="Origen e historia">
          {(p) => <Textarea id={p.id} rows={3} value={draft.history} onChange={(e) => set('history', e.target.value)} />}
        </Field>
        <Field label="Tradiciones">
          {(p) => <Textarea id={p.id} rows={3} value={draft.traditions} onChange={(e) => set('traditions', e.target.value)} />}
        </Field>
        <Field label="Ideas de contenido" hint="Una idea por línea.">
          {(p) => <Textarea id={p.id} aria-describedby={p.describedBy} rows={3} value={draft.contentIdeas} onChange={(e) => set('contentIdeas', e.target.value)} />}
        </Field>
        <Field label="Link de imagen de referencia" error={err('imageUrl')} hint="Se guarda como link; la app no descarga imágenes externas.">
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} type="url" inputMode="url" placeholder="https://" value={draft.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />}
        </Field>
      </Section>
    </form>
  );
}
