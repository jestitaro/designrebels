import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { BellRing, CalendarCheck2, ChevronRight, Plus } from 'lucide-react';
import { CategoryBadge } from '../../components/domain/Badges';
import { categoryIcon } from '../../components/domain/meta';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Segmented } from '../../components/ui/Segmented';
import { placeLabel, useCatalog, useEvents, useGreetings, useSettings, type Catalog } from '../../hooks/useData';
import { useSessionState } from '../../hooks/useSessionState';
import { capitalize, endOfMonth, formatDayMonth, formatLong, monthName, parseISO, relativeDays, startOfMonth, todayISO } from '../../lib/dates';
import { greetingsByEvent } from '../../lib/filters';
import { expandEvents } from '../../lib/recurrence';
import { computeAlerts, upcoming } from '../../lib/reminders';
import { cn } from '../../lib/cn';
import type { Occurrence } from '../../types';
import { useEventEditor } from '../events/EventEditor';

function Card({ title, description, action, children, className }: { title: string; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col rounded-lg border border-border bg-surface shadow-sm', className)} aria-label={title}>
      <header className="flex items-start gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function OccurrenceRow({ occ, catalog, today, meta }: { occ: Occurrence; catalog: Catalog; today: string; meta?: ReactNode }) {
  const cat = catalog.categoryById.get(occ.event.category);
  return (
    <li>
      <Link to={`/eventos/${occ.event.id}?fecha=${occ.start}`}
        className={cn(`cat-${cat?.color ?? 'brand'}`, 'flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus')}>
        <span className="flex w-12 shrink-0 flex-col items-center rounded bg-[var(--cat-bg)] py-1 text-[var(--cat-fg)]">
          <span className="text-[15px] leading-tight font-semibold">{parseISO(occ.start).d}</span>
          <span className="text-[10px] leading-tight font-medium uppercase">{monthName(parseISO(occ.start).m).slice(0, 3)}</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{occ.event.title}</span>
          <span className="truncate text-xs text-muted">
            {capitalize(relativeDays(today, occ.start))} · {placeLabel(occ.event, catalog)}
          </span>
        </span>
        {meta}
        <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle" />
      </Link>
    </li>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ key: string; label: ReactNode; count: number; color?: string }> }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted">Sin datos.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.key} className={cn(r.color && `cat-${r.color}`, 'grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-[13px]')}>
              <span className="truncate">{r.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <span className={cn('block h-full rounded-full', r.color ? 'bg-[var(--cat-solid)]' : 'bg-primary')} style={{ width: `${(r.count / max) * 100}%` }} />
              </span>
              <span className="w-6 text-right font-semibold tabular-nums">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DashboardPage() {
  const today = todayISO();
  const events = useEvents();
  const greetings = useGreetings();
  const settings = useSettings();
  const catalog = useCatalog();
  const editor = useEventEditor();
  const navigate = useNavigate();
  const [range, setRange] = useSessionState<'7' | '30'>('dashboard:range', '7');

  const gMap = useMemo(() => greetingsByEvent(greetings ?? []), [greetings]);
  const alerts = useMemo(() => computeAlerts(events ?? [], gMap, today, settings.leadDays), [events, gMap, today, settings.leadDays]);
  const next = useMemo(() => upcoming(events ?? [], today, Number(range)), [events, today, range]);

  const { y, m } = parseISO(today);
  const monthOccs = useMemo(
    () => expandEvents((events ?? []).filter((e) => !e.archived), startOfMonth(y, m), endOfMonth(y, m)),
    [events, y, m],
  );
  const byCountry = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of monthOccs) counts.set(o.event.country, (counts.get(o.event.country) ?? 0) + 1);
    return catalog.countries.filter((c) => counts.has(c.id)).map((c) => ({ key: c.id, label: c.name, count: counts.get(c.id)! }))
      .sort((a, b) => b.count - a.count);
  }, [monthOccs, catalog.countries]);
  const byCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of monthOccs) counts.set(o.event.category, (counts.get(o.event.category) ?? 0) + 1);
    return catalog.categories.filter((c) => counts.has(c.id)).map((c) => {
      const Icon = categoryIcon(c.id);
      return {
        key: c.id, color: c.color, count: counts.get(c.id)!,
        label: <span className="inline-flex items-center gap-1.5"><Icon aria-hidden className="size-3.5 text-[var(--cat-fg)]" />{c.name}</span>,
      };
    }).sort((a, b) => b.count - a.count);
  }, [monthOccs, catalog.categories]);

  if (events === undefined) return null;

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3 lg:h-16 lg:px-6 lg:py-0">
        <div className="mr-auto">
          <h1 className="text-lg font-semibold lg:text-xl">Qué tengo que preparar</h1>
          <p className="text-xs text-muted">{capitalize(formatLong(today))}</p>
        </div>
        <Button size="sm" variant="primary" icon={Plus} onClick={() => editor.openCreate()}>Nuevo evento</Button>
      </header>

      {events.length === 0 ? (
        <EmptyState className="m-4 rounded-lg border border-border bg-surface" icon={CalendarCheck2} title="Todavía no hay eventos"
          description="Cargá tus primeras fechas para ver acá qué preparar."
          action={<Button variant="primary" icon={Plus} onClick={() => editor.openCreate()}>Nuevo evento</Button>} />
      ) : (
        <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-6">
          <Card
            className="lg:col-span-2"
            title="Para preparar"
            description={`Eventos de relevancia alta en los próximos ${settings.leadDays} días sin saludo listo. Se ven solo al abrir la app.`}
          >
            {alerts.length === 0 ? (
              <EmptyState compact icon={BellRing} title="Nada urgente" description="No hay eventos de relevancia alta pendientes en la ventana de anticipación." />
            ) : (
              <ul className="divide-y divide-border">
                {alerts.map((a) => (
                  <OccurrenceRow key={a.occurrence.key} occ={a.occurrence} catalog={catalog} today={today}
                    meta={<span className="shrink-0 rounded bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                      {a.daysLeft === 0 ? 'Hoy' : a.daysLeft === 1 ? 'Mañana' : `En ${a.daysLeft} días`}
                    </span>} />
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Próximos eventos"
            action={<Segmented label="Rango" value={range} onChange={setRange} options={[{ value: '7', label: '7 días' }, { value: '30', label: '30 días' }]} />}
          >
            {next.length === 0 ? (
              <EmptyState compact icon={CalendarCheck2} title={`Sin eventos en los próximos ${range} días`} />
            ) : (
              <ul className="divide-y divide-border">
                {next.slice(0, 12).map((o) => (
                  <OccurrenceRow key={o.key} occ={o} catalog={catalog} today={today}
                    meta={<span className="hidden sm:block"><CategoryBadge category={catalog.categoryById.get(o.event.category)} /></span>} />
                ))}
              </ul>
            )}
            {next.length > 12 && (
              <div className="border-t border-border px-4 py-2">
                <Button size="sm" variant="ghost" onClick={() => navigate('/calendario')}>Ver los {next.length} en el calendario</Button>
              </div>
            )}
          </Card>

          <Card title={`Resumen de ${monthName(m)}`} description={`${monthOccs.length} ${monthOccs.length === 1 ? 'evento' : 'eventos'} este mes · del ${formatDayMonth(startOfMonth(y, m))} al ${formatDayMonth(endOfMonth(y, m))}`}>
            <div className="flex flex-col gap-5 p-4">
              <Breakdown title="Por país" rows={byCountry} />
              <Breakdown title="Por categoría" rows={byCategory} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
