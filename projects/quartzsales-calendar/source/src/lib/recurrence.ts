import type { CalendarEvent, ISODate, Occurrence, Recurrence } from '../types';
import {
  addDays, compareISO, daysInMonth, diffDays, formatDate, formatDayMonth, monthName,
  nthWeekdayOfMonth, parseISO, toISO, WEEKDAYS,
} from './dates';

type DatedEvent = Pick<CalendarEvent, 'startDate' | 'endDate' | 'recurrence'>;

/** Duración en días adicionales (0 = un solo día). */
export function durationDays(event: Pick<CalendarEvent, 'startDate' | 'endDate'>): number {
  if (!event.endDate) return 0;
  return Math.max(0, diffDays(event.startDate, event.endDate));
}

/** Fecha de inicio de la ocurrencia de un año dado, o null si ese año no ocurre. */
export function occurrenceStartForYear(event: DatedEvent, year: number): ISODate | null {
  const rec = event.recurrence;
  const start = parseISO(event.startDate);
  switch (rec.type) {
    case 'none':
      return start.y === year ? event.startDate : null;
    case 'yearly-fixed': {
      // 29/02 en años no bisiestos se muestra el 28/02.
      const d = Math.min(start.d, daysInMonth(year, start.m));
      return toISO(year, start.m, d);
    }
    case 'yearly-nth-weekday': {
      const base = nthWeekdayOfMonth(year, rec.month, rec.weekday, rec.nth);
      return base ? addDays(base, rec.offsetDays) : null;
    }
  }
}

/** Ocurrencias de un evento que se superponen con [from, to] (inclusive). */
export function occurrencesInRange(event: CalendarEvent, from: ISODate, to: ISODate): Occurrence[] {
  const length = durationDays(event);
  const result: Occurrence[] = [];
  const fromYear = parseISO(addDays(from, -length)).y - 1;
  const toYear = parseISO(to).y + 1;
  for (let year = fromYear; year <= toYear; year++) {
    const start = occurrenceStartForYear(event, year);
    if (!start) continue;
    const end = addDays(start, length);
    if (compareISO(end, from) >= 0 && compareISO(start, to) <= 0) {
      result.push({ event, key: `${event.id}@${start}`, start, end });
    }
  }
  return result.sort((a, b) => compareISO(a.start, b.start));
}

/** Todas las ocurrencias del rango, ordenadas por fecha y relevancia. */
export function expandEvents(events: CalendarEvent[], from: ISODate, to: ISODate): Occurrence[] {
  const rank = { alta: 0, media: 1, baja: 2 } as const;
  return events
    .flatMap((event) => occurrencesInRange(event, from, to))
    .sort(
      (a, b) =>
        compareISO(a.start, b.start) ||
        rank[a.event.relevance] - rank[b.event.relevance] ||
        a.event.title.localeCompare(b.event.title, 'es'),
    );
}

/** Mapa día → ocurrencias que lo cubren (los multi-día aparecen en cada día). */
export function occurrencesByDay(occurrences: Occurrence[], from: ISODate, to: ISODate): Map<ISODate, Occurrence[]> {
  const map = new Map<ISODate, Occurrence[]>();
  for (const occ of occurrences) {
    const first = compareISO(occ.start, from) < 0 ? from : occ.start;
    const last = compareISO(occ.end, to) > 0 ? to : occ.end;
    for (let day = first; compareISO(day, last) <= 0; day = addDays(day, 1)) {
      const list = map.get(day);
      if (list) list.push(occ);
      else map.set(day, [occ]);
    }
  }
  return map;
}

/** Próxima ocurrencia que termina en o después de `from`. */
export function nextOccurrence(event: CalendarEvent, from: ISODate): Occurrence | null {
  const length = durationDays(event);
  const year = parseISO(from).y;
  for (let y = year - 1; y <= year + 1; y++) {
    const start = occurrenceStartForYear(event, y);
    if (start && compareISO(addDays(start, length), from) >= 0) {
      return { event, key: `${event.id}@${start}`, start, end: addDays(start, length) };
    }
  }
  return null;
}

const ORDINALS: Record<number, string> = { 1: '1.º', 2: '2.º', 3: '3.º', 4: '4.º', 5: '5.º', [-1]: 'último' };

/** Descripción en lenguaje claro de la regla de fecha. */
export function describeRecurrence(event: DatedEvent): string {
  const rec: Recurrence = event.recurrence;
  const length = durationDays(event);
  const span = length > 0 ? ` (dura ${length + 1} días)` : '';
  switch (rec.type) {
    case 'none':
      return event.endDate && length > 0
        ? `Edición única: del ${formatDate(event.startDate)} al ${formatDate(event.endDate)}. No se repite.`
        : `Edición única: ${formatDate(event.startDate)}. No se repite.`;
    case 'yearly-fixed':
      return `Todos los años el ${formatDayMonth(event.startDate)}${span}.`;
    case 'yearly-nth-weekday': {
      const day = `${ORDINALS[rec.nth]} ${WEEKDAYS[rec.weekday]} de ${monthName(rec.month)}`;
      let text: string;
      if (rec.offsetDays === 0) text = `el ${day}`;
      else if (rec.offsetDays === 1) text = `el día siguiente al ${day}`;
      else if (rec.offsetDays === -1) text = `el día anterior al ${day}`;
      else if (rec.offsetDays > 0) text = `${rec.offsetDays} días después del ${day}`;
      else text = `${-rec.offsetDays} días antes del ${day}`;
      return `Todos los años, ${text}${span}.`;
    }
  }
}
