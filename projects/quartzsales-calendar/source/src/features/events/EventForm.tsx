import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useCatalog } from '../../hooks/useData';
import { capitalize, formatDate, MONTHS, parseISO, todayISO, WEEKDAYS } from '../../lib/dates';
import { describeRecurrence } from '../../lib/recurrence';
import { cn } from '../../lib/cn';
import { eventContentSchema, fieldErrors, type EventContent } from '../../schemas/event';
import { Checkbox, Field, Input, Select } from '../../components/ui/Field';
import { DateInput } from '../../components/ui/DateInput';
import { draftToContent, ruleStartDate, type DateMode, type EventDraft } from './eventDraft';

interface EventFormProps {
  formId: string;
  initial: EventDraft;
  onSubmit: (content: EventContent) => void | Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

type When = 'anual' | 'una-vez' | 'regla';

const whenOf = (mode: DateMode): When => (mode === 'yearly-fixed' ? 'anual' : mode === 'none' ? 'una-vez' : 'regla');

/** Formulario mínimo: nombre, categoría, país, fecha y link de imagen. */
export function EventForm({ formId, initial, onSubmit, onDirtyChange }: EventFormProps) {
  const catalog = useCatalog();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const year = parseISO(todayISO()).y;
  const when = whenOf(draft.dateMode);

  function set<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    onDirtyChange?.(true);
    if (errors[key as string]) setErrors(({ [key as string]: _, ...rest }) => rest);
  }

  function setWhen(next: When) {
    if (next === 'anual') set('dateMode', 'yearly-fixed');
    else if (next === 'una-vez') set('dateMode', 'none');
    else if (draft.dateMode !== 'yearly-easter') set('dateMode', 'yearly-nth-weekday');
  }

  const countries = catalog.countries.filter((c) => c.active || c.id === draft.country);
  const categories = catalog.categories.filter((c) => c.visible || c.id === draft.category);

  const preview = useMemo(() => {
    const content = draftToContent(draft, year);
    if (!content.startDate || content.startDate === 'invalid') return null;
    const rule = describeRecurrence(content);
    if (draft.dateMode === 'yearly-nth-weekday' || draft.dateMode === 'yearly-easter') {
      const d = ruleStartDate(draft, year);
      return d ? `${rule} En ${year} cae el ${formatDate(d)}.` : rule;
    }
    return rule;
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
    <form id={formId} ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Nombre" required error={err('title')}>
        {(p) => (
          <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.title} maxLength={160}
            onChange={(e) => set('title', e.target.value)} placeholder="Ej. Día Nacional del Mate" data-autofocus />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoría" required error={err('category')}>
          {(p) => (
            <Select id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Elegí una categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="País" required error={err('country')}>
          {(p) => (
            <Select id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.country}
              onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value, region: '', city: '' }))}>
              <option value="">Elegí un país</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 text-[13px] font-bold">¿Cuándo?</legend>
        <div role="radiogroup" aria-label="Cuándo" className="grid grid-cols-3 gap-2">
          {([['anual', 'Todos los años'], ['una-vez', 'Solo una vez'], ['regla', 'Otra regla']] as Array<[When, string]>).map(([value, label]) => (
            <label key={value}
              className={cn(
                'flex min-h-[38px] cursor-pointer items-center justify-center rounded border px-2 text-center text-[13px] font-bold transition-colors pointer-coarse:min-h-11',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
                when === value ? 'border-primary-ring bg-primary-soft text-text' : 'border-border-strong text-muted hover:bg-surface-2 hover:text-text',
              )}>
              <input type="radio" name={`${formId}-when`} className="sr-only" checked={when === value} onChange={() => setWhen(value)} />
              {label}
            </label>
          ))}
        </div>

        {when === 'regla' ? (
          <div className="flex flex-col gap-3 rounded border border-border bg-surface-2 p-3">
            <div className="flex flex-wrap gap-x-5">
              {([['yearly-nth-weekday', 'Día de la semana del mes'], ['yearly-easter', 'Según Pascua']] as Array<[DateMode, string]>).map(([v, l]) => (
                <label key={v} className="flex min-h-8 cursor-pointer items-center gap-2 text-sm pointer-coarse:min-h-11">
                  <input type="radio" name={`${formId}-rule`} className="accent-[var(--qs-primary)]" checked={draft.dateMode === v} onChange={() => set('dateMode', v)} />
                  {l}
                </label>
              ))}
            </div>
            {draft.dateMode === 'yearly-easter' ? (
              <Field label="Día respecto de Pascua" hint="Viernes Santo: −2 · Domingo de Pascua: 0 · Lunes de Pascua: 1.">
                {(p) => <Input id={p.id} aria-describedby={p.describedBy} type="number" min={-70} max={70} value={draft.easterOffset} onChange={(e) => set('easterOffset', e.target.value)} className="max-w-32" />}
              </Field>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Semana" error={err('ruleNth')}>
                  {(p) => (
                    <Select id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.ruleNth} onChange={(e) => set('ruleNth', e.target.value)}>
                      {[['1', '1.º'], ['2', '2.º'], ['3', '3.º'], ['4', '4.º'], ['5', '5.º'], ['-1', 'Último']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Día">
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
                <Field label="Días +/−" hint="Black Friday: +1">
                  {(p) => <Input id={p.id} aria-describedby={p.describedBy} type="number" min={-31} max={31} value={draft.ruleOffset} onChange={(e) => set('ruleOffset', e.target.value)} />}
                </Field>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={draft.multiDay ? 'Desde' : 'Fecha'} required error={err('startDate')}>
              {(p) => <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={draft.startDate} onChange={(v) => set('startDate', v)} />}
            </Field>
            {draft.multiDay && (
              <Field label="Hasta" error={err('endDate')}>
                {(p) => <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} min={draft.startDate} value={draft.endDate} onChange={(v) => set('endDate', v)} />}
              </Field>
            )}
            <Checkbox className="sm:col-span-2" label="Dura varios días" checked={draft.multiDay} onChange={(e) => set('multiDay', e.target.checked)} />
          </div>
        )}

        {preview && <p className="rounded bg-surface-2 px-3 py-2 text-[13px] text-muted" aria-live="polite">{preview}</p>}
      </fieldset>

      <Field label="Link de imagen" error={err('imageUrl')} hint="Opcional. Link a la imagen guardada en Drive, Canva, etc.">
        {(p) => (
          <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} type="url" inputMode="url" placeholder="https://"
            value={draft.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
        )}
      </Field>
    </form>
  );
}
