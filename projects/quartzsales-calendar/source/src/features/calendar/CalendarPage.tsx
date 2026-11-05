import { useCallback, useId, useMemo } from 'react';
import { bestGreetingStatus } from '../../components/domain/greetingMeta';
import { EventGreetingBadge } from '../../components/domain/GreetingBadges';
import { useNavigate } from 'react-router';
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus, Rows3 } from 'lucide-react';
import { useCatalog, useEvents, useGreetings } from '../../hooks/useData';
import { useSessionState } from '../../hooks/useSessionState';
import { useIsDesktop } from '../../hooks/useTheme';
import {
  addDays, addMonths, capitalize, endOfMonth, endOfWeek, formatLong, monthGrid, monthName, parseISO, startOfMonth,
  startOfWeek, todayISO,
} from '../../lib/dates';
import { applyFilters, EMPTY_FILTERS, greetingsByEvent, type EventFilters } from '../../lib/filters';
import { expandEvents, occurrencesByDay } from '../../lib/recurrence';
import type { ISODate, Occurrence } from '../../types';
import { Button, IconButton } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { EventDetail } from '../events/EventDetail';
import { useEventEditor } from '../events/EventEditor';
import { ActiveFilterChips, FiltersButton, SearchBox } from '../filters/Filters';
import { DayAgenda } from './DayAgenda';
import { ListView } from './ListView';
import { MonthGrid, monthTitle } from './MonthGrid';
import { WeekView } from './WeekView';

type View = 'mes' | 'semana' | 'lista';

function weekTitle(anchor: ISODate) {
  const start = startOfWeek(anchor);
  const end = endOfWeek(anchor);
  const s = parseISO(start);
  const e = parseISO(end);
  if (s.m === e.m) return `${s.d} al ${e.d} de ${monthName(e.m)} ${e.y}`;
  if (s.y === e.y) return `${s.d} de ${monthName(s.m)} al ${e.d} de ${monthName(e.m)} ${e.y}`;
  return `${s.d}/${s.m}/${s.y} al ${e.d}/${e.m}/${e.y}`;
}

export function CalendarPage() {
  const today = todayISO();
  const titleId = useId();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const editor = useEventEditor();
  const [view, setView] = useSessionState<View>('calendar:view', 'mes');
  const [selected, setSelected] = useSessionState<ISODate>('calendar:selected', today);
  const [cursor, setCursor] = useSessionState('calendar:month', () => {
    const { y, m } = parseISO(today);
    return { y, m };
  });
  const [filters, setFilters] = useSessionState<EventFilters>('calendar:filters', EMPTY_FILTERS);
  const [openEvent, setOpenEvent] = useSessionState<{ id: string; date: ISODate } | null>('calendar:open', null);
  const events = useEvents();
  const greetings = useGreetings();
  const catalog = useCatalog();

  // Rango visible según la vista.
  const [from, to] = useMemo<[ISODate, ISODate]>(() => {
    if (view === 'semana') return [startOfWeek(selected), endOfWeek(selected)];
    if (view === 'lista') return [startOfMonth(cursor.y, cursor.m), endOfMonth(cursor.y, cursor.m)];
    const weeks = monthGrid(cursor.y, cursor.m);
    return [weeks[0]![0]!, weeks.at(-1)![6]!];
  }, [view, selected, cursor]);

  const gMap = useMemo(() => greetingsByEvent(greetings ?? []), [greetings]);
  const greetingStatus = useCallback((id: string) => bestGreetingStatus((gMap.get(id) ?? []).map((g) => g.status)), [gMap]);
  const hidden = useMemo(() => new Set(catalog.categories.filter((c) => !c.visible).map((c) => c.id)), [catalog.categories]);
  const filtered = useMemo(() => applyFilters(events ?? [], filters, gMap, hidden), [events, filters, gMap, hidden]);
  const byDay = useMemo(() => occurrencesByDay(expandEvents(filtered, from, to), from, to), [filtered, from, to]);
  const dayOccurrences = byDay.get(selected) ?? [];
  const listDays = useMemo(() => [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)), [byDay]);
  const resultCount = useMemo(() => new Set([...byDay.values()].flat().map((o) => o.event.id)).size, [byDay]);

  function select(date: ISODate) {
    setSelected(date);
    setOpenEvent(null);
    const { y, m } = parseISO(date);
    if (y !== cursor.y || m !== cursor.m) setCursor({ y, m });
  }

  function shift(delta: number) {
    if (view === 'semana') {
      select(addDays(selected, delta * 7));
    } else {
      const next = addMonths(cursor.y, cursor.m, delta);
      setCursor(next);
    }
  }

  function goToday() {
    select(today);
    const { y, m } = parseISO(today);
    setCursor({ y, m });
  }

  function open(occ: Occurrence, day: ISODate) {
    if (isDesktop) {
      select(day);
      setOpenEvent({ id: occ.event.id, date: occ.start });
    } else {
      navigate(`/eventos/${occ.event.id}?fecha=${occ.start}`);
    }
  }

  const create = (date?: ISODate) =>
    editor.openCreate({ date, onCreated: (e) => isDesktop && setOpenEvent({ id: e.id, date: e.startDate }) });

  const title = view === 'semana' ? capitalize(weekTitle(selected)) : monthTitle(cursor.y, cursor.m);
  const unit = view === 'semana' ? 'Semana' : 'Mes';

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="flex min-w-0 flex-1 flex-col lg:h-dvh">
        <header className="flex flex-col gap-2 border-b border-border bg-surface px-4 py-3 lg:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id={titleId} className="mr-auto text-lg font-extrabold lg:text-[22px]" aria-live="polite">{title}</h1>
            <Button size="sm" onClick={goToday}>Hoy</Button>
            <div className="flex items-center">
              <IconButton icon={ChevronLeft} label={`${unit} anterior`} size="sm" onClick={() => shift(-1)} />
              <IconButton icon={ChevronRight} label={`${unit} siguiente`} size="sm" onClick={() => shift(1)} />
            </div>
            <Button size="sm" variant="primary" icon={Plus} onClick={() => create(selected)} className="hidden lg:inline-flex">Nuevo evento</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Vista"
              value={view}
              onChange={(v) => { setView(v); setOpenEvent(null); }}
              compactLabels
              options={[
                { value: 'mes', label: 'Mes', icon: CalendarDays },
                { value: 'semana', label: 'Semana', icon: Rows3 },
                { value: 'lista', label: 'Lista', icon: List },
              ]}
            />
            <SearchBox value={filters.query} onChange={(query) => setFilters({ ...filters, query })} className="min-w-40 flex-1 lg:max-w-72" />
            <FiltersButton filters={filters} onChange={setFilters} catalog={catalog} resultCount={resultCount} />
          </div>
          <ActiveFilterChips filters={filters} onChange={setFilters} catalog={catalog} />
          {filters.query && (
            <p className="text-xs text-muted" role="status">
              {resultCount === 0 ? 'Ningún evento coincide en este período.' : `${resultCount} ${resultCount === 1 ? 'evento coincide' : 'eventos coinciden'} en este período.`}
            </p>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-surface lg:m-4 lg:rounded-lg lg:border lg:border-border lg:shadow-sm">
          {view === 'mes' && (
            <MonthGrid year={cursor.y} month={cursor.m} byDay={byDay} selected={selected} today={today} catalog={catalog}
              labelledBy={titleId} onSelect={select} onOpenOccurrence={open} greetingStatus={greetingStatus} />
          )}
          {view === 'semana' && (
            <WeekView anchor={selected} today={today} selected={selected} byDay={byDay} catalog={catalog}
              onSelectDay={select} onOpen={open} onCreate={create} greetingStatus={greetingStatus} />
          )}
          {view === 'lista' && (
            <ListView days={listDays} today={today} catalog={catalog} onOpen={open}
              renderMeta={(o) => <EventGreetingBadge greetings={gMap.get(o.event.id)} />}
              emptyAction={<Button size="sm" icon={Plus} onClick={() => create()}>Nuevo evento</Button>} />
          )}
        </div>
      </section>

      {(view === 'mes' || isDesktop) && (
        <aside
          aria-label={openEvent ? 'Detalle del evento' : 'Eventos del día seleccionado'}
          className="border-t border-border bg-surface lg:h-dvh lg:w-[26rem] lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-l"
        >
          {openEvent && isDesktop ? (
            <EventDetail
              key={openEvent.id}
              eventId={openEvent.id}
              occurrenceDate={openEvent.date}
              onBack={() => setOpenEvent(null)}
              backLabel={`Volver a ${formatLong(selected, false)}`}
              onDeleted={() => setOpenEvent(null)}
            />
          ) : (
            <DayAgenda
              date={selected}
              today={today}
              occurrences={dayOccurrences}
              catalog={catalog}
              onOpen={(o) => open(o, selected)}
              greetingsMap={gMap}
              headerAction={<Button size="sm" icon={Plus} onClick={() => create(selected)}>Agregar</Button>}
            />
          )}
        </aside>
      )}

      <button
        type="button"
        onClick={() => create(selected)}
        aria-label="Nuevo evento"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 inline-flex size-14 items-center justify-center rounded-full bg-brand-grad text-white shadow-lg hover:bg-primary-hover active:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:hidden"
      >
        <Plus aria-hidden className="size-6" />
      </button>
    </div>
  );
}
