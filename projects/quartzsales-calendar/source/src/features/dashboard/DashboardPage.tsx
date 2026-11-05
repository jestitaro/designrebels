import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { BellRing, CalendarCheck2, Check, ChevronLeft, ChevronRight, Copy, Info, MessageSquarePlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { GREETING_STATUS_META, GREETING_STATUSES } from '../../components/domain/greetingMeta';
import { EventGreetingBadge } from '../../components/domain/GreetingBadges';
import { useToast } from '../../components/ui/Toast';
import { markAlertReviewed, unmarkAlertReviewed } from '../../db/repo';
import { GreetingEventPicker } from '../greetings/GreetingEventPicker';
import type { GreetingStatus } from '../../types';
import { CategoryBadge } from '../../components/domain/Badges';
import { categoryIcon } from '../../components/domain/meta';
import { Button, IconButton } from '../../components/ui/Button';
import { TeamDay } from '../team/TeamDay';
import { EmptyState } from '../../components/ui/EmptyState';
import { Segmented } from '../../components/ui/Segmented';
import { placeLabel, useCatalog, useEvents, useGreetings, usePeople, useReviewedAlerts, useSettings, useVacations, type Catalog } from '../../hooks/useData';
import { copyText } from '../../lib/clipboard';
import { weekSlackSummary } from '../../lib/team';
import { ManualCopyDialog } from '../../components/ui/ManualCopyDialog';
import { useSessionState } from '../../hooks/useSessionState';
import { addDays, capitalize, endOfMonth, formatDayMonth, formatLong, monthName, parseISO, relativeDays, startOfMonth, todayISO } from '../../lib/dates';
import { greetingsByEvent } from '../../lib/filters';
import { expandEvents } from '../../lib/recurrence';
import { computeAlerts, upcoming } from '../../lib/reminders';
import { cn } from '../../lib/cn';
import { session } from '../../lib/storage';
import type { Occurrence } from '../../types';
import { useEventEditor } from '../events/EventEditor';

function Card({ title, description, action, children, className }: { title: string; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('qs-topline flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong', className)} aria-label={title}>
      <header className="flex items-start gap-2 border-b border-border px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-extrabold">{title}</h2>
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
  const [picker, setPicker] = useState(false);
  const [teamDate, setTeamDate] = useState(today);
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const people = usePeople();
  const vacations = useVacations();
  const reviewed = useReviewedAlerts();
  const toast = useToast();

  const gMap = useMemo(() => greetingsByEvent(greetings ?? []), [greetings]);
  const alerts = useMemo(() => computeAlerts(events ?? [], gMap, today, settings.leadDays, reviewed), [events, gMap, today, settings.leadDays, reviewed]);
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

  const greetingCounts = useMemo(() => {
    const c: Partial<Record<GreetingStatus, number>> = {};
    for (const g of greetings ?? []) c[g.status] = (c[g.status] ?? 0) + 1;
    return c;
  }, [greetings]);

  async function copyWeek() {
    const text = weekSlackSummary(teamDate, events ?? [], people ?? [], vacations ?? [], (id) => catalog.placeName(id) ?? id);
    if (await copyText(text)) toast.success('Resumen de la semana copiado. Pegalo en #general y fijalo para que quede destacado.');
    else setManualCopy(text);
  }

  async function review(key: string) {
    await markAlertReviewed(key);
    toast.show('Alerta marcada como revisada.', { tone: 'success', action: { label: 'Deshacer', onClick: () => void unmarkAlertReviewed(key) } });
  }

  if (events === undefined) return null;

  return (
    <div className="flex flex-col">
      <header className="qs-briefing border-b border-border px-4 pt-6 pb-5 text-white lg:px-8 lg:pt-7">
        <div className="relative z-[1] flex flex-wrap items-start gap-3">
          <div className="mr-auto">
            <h1 className="text-[22px] leading-tight font-extrabold text-white">Qué tengo que preparar</h1>
            <p className="mt-1 font-data text-[13px] text-white/60">{capitalize(formatLong(today))}</p>
          </div>
          <Button size="sm" variant="on-dark" icon={MessageSquarePlus} onClick={() => setPicker(true)} disabled={events.length === 0}>Crear saludo</Button>
          <Button size="sm" variant="primary" icon={Plus} onClick={() => editor.openCreate()}>Nuevo evento</Button>
        </div>
        <dl className="relative z-[1] mt-5 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
          {[
            ['Para preparar', alerts.length],
            ['Próximos 7 días', upcoming(events, today, 7).length],
            ['Saludos listos', greetingCounts.listo ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-white/12 bg-white/6 px-3 py-2.5">
              <dt className="font-data text-[10px] font-bold tracking-[0.06em] text-white/60 uppercase">{label}</dt>
              <dd className="mt-1 font-data text-[19px] leading-none font-bold text-white tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </header>
      <GreetingEventPicker open={picker} onClose={() => setPicker(false)} />
      <ManualCopyDialog text={manualCopy} onClose={() => setManualCopy(null)} />

      {events.length === 0 ? (
        <EmptyState className="m-4 rounded-lg border border-border bg-surface" icon={CalendarCheck2} title="Todavía no hay eventos"
          description="Cargá tus primeras fechas para ver acá qué preparar."
          action={<Button variant="primary" icon={Plus} onClick={() => editor.openCreate()}>Nuevo evento</Button>} />
      ) : (
        <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-6">
          <Card
            className="lg:col-span-2"
            title="Para preparar"
            description={`Fechas de los próximos ${settings.leadDays} días que todavía no tienen un saludo listo.`}
          >
            <p className="flex items-start gap-2 border-b border-border bg-surface-2 px-4 py-2 text-xs text-muted">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              Estos recordatorios solo se ven al abrir la app: no hay notificaciones con la app cerrada. Para tener alarmas en el celular, exportá un .ics desde Próximos.
            </p>
            {alerts.length === 0 ? (
              <EmptyState compact icon={BellRing} title="Nada urgente" description="No hay fechas pendientes en los próximos días." />
            ) : (
              <ul className="divide-y divide-border">
                {alerts.map((a) => (
                  <li key={a.occurrence.key} className="flex items-center">
                    <ul className="min-w-0 flex-1">
                      <OccurrenceRow occ={a.occurrence} catalog={catalog} today={today}
                        meta={<span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                          <span className="rounded bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                            {a.daysLeft === 0 ? 'Hoy' : a.daysLeft === 1 ? 'Mañana' : `En ${a.daysLeft} días`}
                          </span>
                          <EventGreetingBadge greetings={a.greetings} />
                        </span>} />
                    </ul>
                    <Button size="sm" variant="ghost" icon={Check} className="mr-2 shrink-0" onClick={() => void review(a.occurrence.key)}
                      aria-label={`Marcar como revisada: ${a.occurrence.event.title}`}>
                      <span className="hidden sm:inline">Revisada</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            className="lg:col-span-2"
            title={teamDate === today ? 'El equipo hoy' : `El equipo el ${capitalize(formatLong(teamDate, false))}`}
            description="A quién saludar, quién está de feriado y quién de vacaciones. Copiá el resumen de la semana para #general."
            action={
              <div className="flex flex-wrap items-center justify-end gap-1">
                <Button size="sm" icon={Copy} onClick={() => void copyWeek()} disabled={!people?.length}>Copiar semana para Slack</Button>
                <IconButton icon={ChevronLeft} label="Día anterior" size="sm" onClick={() => setTeamDate(addDays(teamDate, -1))} />
                <Button size="sm" variant="ghost" onClick={() => setTeamDate(today)} disabled={teamDate === today}>Hoy</Button>
                <IconButton icon={ChevronRight} label="Día siguiente" size="sm" onClick={() => setTeamDate(addDays(teamDate, 1))} />
              </div>
            }
          >
            <TeamDay date={teamDate} />
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

          <Card title="Saludos" action={<Link to="/saludos" className="text-[13px] font-medium text-accent hover:underline">Ver todos</Link>}>
            <ul className="grid grid-cols-3 divide-x divide-border">
              {GREETING_STATUSES.map((s) => {
                const Icon = GREETING_STATUS_META[s].icon;
                return (
                  <li key={s}>
                    <Link to="/saludos" onClick={() => session.set('greetings:status', [s])}
                      className="flex flex-col items-center gap-1 px-2 py-4 text-center hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
                      <span className="text-2xl font-semibold tabular-nums">{greetingCounts[s] ?? 0}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Icon aria-hidden className="size-3.5" />
                        {s === 'listo' ? 'Listos para compartir' : s === 'pendiente' ? 'Pendientes' : 'Compartidos'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
