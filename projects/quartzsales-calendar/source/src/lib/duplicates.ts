import type { CalendarEvent } from '../types';
import { parseISO, todayISO } from './dates';
import { occurrenceStartForYear } from './recurrence';
import { normalizeText } from './text';

type Keyed = Pick<CalendarEvent, 'title' | 'startDate' | 'endDate' | 'recurrence' | 'country'>;

/** Fecha comparable: día/mes si es anual, la fecha completa si es edición única. */
export function dateKey(e: Keyed, year = parseISO(todayISO()).y): string {
  if (e.recurrence.type === 'none') return e.startDate;
  if (e.recurrence.type === 'yearly-fixed') return e.startDate.slice(5);
  return occurrenceStartForYear(e, year)?.slice(5) ?? e.startDate.slice(5);
}

/** Posible duplicado: mismo título normalizado + misma fecha + mismo país. */
export function duplicateKey(e: Keyed): string {
  return `${normalizeText(e.title)}|${dateKey(e)}|${e.country}`;
}

export function findDuplicate<T extends Keyed>(candidate: Keyed, existing: T[]): T | undefined {
  const key = duplicateKey(candidate);
  return existing.find((e) => duplicateKey(e) === key);
}
