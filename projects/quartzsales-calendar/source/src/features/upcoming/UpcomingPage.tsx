import { useMemo } from 'react';
import { CalendarArrowDown, CalendarSearch } from 'lucide-react';
import { EventGreetingBadge } from '../../components/domain/GreetingBadges';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Segmented } from '../../components/ui/Segmented';
import { useCatalog, useEvents, useGreetingsMap } from '../../hooks/useData';
import { useSessionState } from '../../hooks/useSessionState';
import { useNavigate } from 'react-router';
import { addDays, endOfWeek, formatDayMonth, monthName, parseISO, startOfWeek, todayISO } from '../../lib/dates';
import { applyFilters, EMPTY_FILTERS, type EventFilters } from '../../lib/filters';
import { expandEvents } from '../../lib/recurrence';
import type { Occurrence } from '../../types';
import { ActiveFilterChips, FiltersButton } from '../filters/Filters';
import { ListView } from '../calendar/ListView';
import { useIcsExport } from '../reminders/useIcsExport';

type Range = '7' | '30' | '90';

function weekLabel(monday: string, today: string) {
  const sunday = endOfWeek(monday);
  if (monday === startOfWeek(today)) return 'Esta semana';
  if (monday === startOfWeek(addDays(today, 7))) return 'La semana que viene';
  const s = parseISO(monday);
  const e = parseISO(sunday);
  return s.m === e.m
    ? `Semana del ${s.d} al ${e.d} de ${monthName(e.m)}`
    : `Semana del ${formatDayMonth(monday)} al ${formatDayMonth(sunday)}`;
}

export function UpcomingPage() {
  const today = todayISO();
  const navigate = useNavigate();
  const events = useEvents();
  const catalog = useCatalog();
  const gMap = useGreetingsMap();
  const { exportOccurrences } = useIcsExport();
  const [range, setRange] = useSessionState<Range>('upcoming:range', '30');
  const [filters, setFilters] = useSessionState<EventFilters>('upcoming:filters', EMPTY_FILTERS);

  const hidden = useMemo(() => new Set(catalog.categories.filter((c) => !c.visible).map((c) => c.id)), [catalog.categories]);
  const occurrences = useMemo(() => {
    const filtered = applyFilters(events ?? [], filters, gMap, hidden);
    const until = addDays(today, Number(range));
    return expandEvents(filtered, today, until).filter((o) => o.start >= today || o.end >= today);
  }, [events, filters, gMap, hidden, range, today]);

  // Agrupado por semana (lunes a domingo), según el inicio (o hoy si ya empezó).
  const weeks = useMemo(() => {
    const map = new Map<string, Map<string, Occurrence[]>>();
    for (const o of occurrences) {
      const day = o.start < today ? today : o.start;
      const monday = startOfWeek(day);
      const week = map.get(monday) ?? new Map<string, Occurrence[]>();
      week.set(day, [...(week.get(day) ?? []), o]);
      map.set(monday, week);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [occurrences, today]);

  if (events === undefined) return null;

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-2 border-b border-border bg-surface px-4 py-3 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-lg font-semibold lg:text-xl">Próximos eventos</h1>
          <Button size="sm" icon={CalendarArrowDown} onClick={() => exportOccurrences(occurrences, `qs-calendar-proximos-${range}-dias.ics`)}>
            Exportar .ics
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Rango" value={range} onChange={setRange}
            options={[{ value: '7', label: '7 días' }, { value: '30', label: '30 días' }, { value: '90', label: '90 días' }]} />
          <FiltersButton filters={filters} onChange={setFilters} catalog={catalog} resultCount={new Set(occurrences.map((o) => o.event.id)).size} />
        </div>
        <ActiveFilterChips filters={filters} onChange={setFilters} catalog={catalog} />
      </header>

      {weeks.length === 0 ? (
        <EmptyState icon={CalendarSearch} title={`Sin eventos en los próximos ${range} días`} description="Probá con un rango más amplio o revisá los filtros." />
      ) : (
        <div className="flex flex-col gap-4 p-4 lg:p-6">
          {weeks.map(([monday, days]) => (
            <section key={monday} aria-labelledby={`w-${monday}`} className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <h2 id={`w-${monday}`} className="border-b border-border px-4 py-2.5 text-sm font-semibold lg:px-5">
                {weekLabel(monday, today)}
                <span className="ml-2 text-xs font-normal text-muted">{[...days.values()].flat().length} eventos</span>
              </h2>
              <ListView
                days={[...days.entries()].sort(([a], [b]) => a.localeCompare(b))}
                today={today}
                catalog={catalog}
                onOpen={(o) => navigate(`/eventos/${o.event.id}?fecha=${o.start}`)}
                renderMeta={(o) => <EventGreetingBadge greetings={gMap.get(o.event.id)} />}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
