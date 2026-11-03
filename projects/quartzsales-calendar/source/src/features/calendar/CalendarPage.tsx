import { useId, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCatalog, useEvents } from '../../hooks/useData';
import { useSessionState } from '../../hooks/useSessionState';
import { addMonths, endOfWeek, monthGrid, parseISO, startOfWeek, todayISO } from '../../lib/dates';
import { expandEvents, occurrencesByDay } from '../../lib/recurrence';
import type { ISODate } from '../../types';
import { Button, IconButton } from '../../components/ui/Button';
import { DayAgenda } from './DayAgenda';
import { MonthGrid, monthTitle } from './MonthGrid';

export function CalendarPage() {
  const today = todayISO();
  const titleId = useId();
  const [selected, setSelected] = useSessionState<ISODate>('calendar:selected', today);
  const [cursor, setCursor] = useSessionState('calendar:month', () => {
    const { y, m } = parseISO(today);
    return { y, m };
  });
  const events = useEvents();
  const catalog = useCatalog();

  const weeks = monthGrid(cursor.y, cursor.m);
  const from = startOfWeek(weeks[0]![0]!);
  const to = endOfWeek(weeks.at(-1)![6]!);

  const visibleEvents = useMemo(() => (events ?? []).filter((e) => !e.archived), [events]);
  const byDay = useMemo(() => occurrencesByDay(expandEvents(visibleEvents, from, to), from, to), [visibleEvents, from, to]);
  const dayOccurrences = byDay.get(selected) ?? [];

  function select(date: ISODate) {
    setSelected(date);
    const { y, m } = parseISO(date);
    if (y !== cursor.y || m !== cursor.m) setCursor({ y, m });
  }

  function shiftMonth(delta: number) {
    setCursor(addMonths(cursor.y, cursor.m, delta));
  }

  function goToday() {
    select(today);
    const { y, m } = parseISO(today);
    setCursor({ y, m });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="flex min-w-0 flex-1 flex-col lg:h-dvh">
        <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3 lg:h-16 lg:px-6 lg:py-0">
          <h1 id={titleId} className="mr-auto text-lg font-semibold lg:text-xl" aria-live="polite">
            {monthTitle(cursor.y, cursor.m)}
          </h1>
          <Button size="sm" onClick={goToday}>
            Hoy
          </Button>
          <div className="flex items-center">
            <IconButton icon={ChevronLeft} label="Mes anterior" size="sm" onClick={() => shiftMonth(-1)} />
            <IconButton icon={ChevronRight} label="Mes siguiente" size="sm" onClick={() => shiftMonth(1)} />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-surface lg:m-4 lg:rounded-lg lg:border lg:border-border lg:shadow-sm">
          <MonthGrid
            year={cursor.y}
            month={cursor.m}
            byDay={byDay}
            selected={selected}
            today={today}
            catalog={catalog}
            labelledBy={titleId}
            onSelect={select}
          />
        </div>
      </section>

      <aside
        aria-label="Eventos del día seleccionado"
        className="border-t border-border bg-surface lg:h-dvh lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-l"
      >
        <DayAgenda date={selected} today={today} occurrences={dayOccurrences} catalog={catalog} />
      </aside>
    </div>
  );
}
