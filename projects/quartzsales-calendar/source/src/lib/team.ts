import type { CalendarEvent, ISODate, Occurrence, Person, Vacation } from '../types';
import { compareISO, parseISO } from './dates';
import { expandEvents, occurrenceStartForYear, durationDays } from './recurrence';
import { addDays } from './dates';

/** Áreas del organigrama (sugerencias; se pueden escribir otras). */
export const DEFAULT_AREAS = [
  'Dirección',
  'Sales, Marketing & Growth',
  'Producto y Diseño',
  'Desarrollo',
  'Business Intelligence',
  'Infraestructura',
  'Soporte',
  'Gestión de Proyectos',
  'Administración y RRHH',
];

export function personAreas(p: Person): string[] {
  return [...new Set(p.roles.map((r) => r.area))];
}

/** ¿Este saludo es para esta persona? Por país (internacional = todos) y, si el evento indica áreas, por área. */
export function isForPerson(event: CalendarEvent, person: Person): boolean {
  if (!person.active) return false;
  const countryOk = event.country === 'intl' || event.country === person.country;
  if (!countryOk) return false;
  if (event.region && person.region && event.region !== person.region) return false;
  if (event.region && !person.region) return false;
  if (event.areas?.length) return personAreas(person).some((a) => event.areas!.includes(a));
  return true;
}

/** Día no laborable de un feriado en un año: la fecha trasladada si existe, si no la propia. */
export function holidayDaysOff(event: CalendarEvent, year: number): ISODate[] {
  if (!event.isHoliday) return [];
  const observed = event.holidayObservances?.find((o) => o.year === year);
  if (observed) return [observed.date];
  const start = occurrenceStartForYear(event, year);
  if (!start) return [];
  return Array.from({ length: durationDays(event) + 1 }, (_, i) => addDays(start, i));
}

export interface DayTeam {
  greet: Array<{ occurrence: Occurrence; people: Person[] }>;
  holiday: Array<{ event: CalendarEvent; people: Person[] }>;
  vacation: Array<{ person: Person; vacation: Vacation }>;
}

/** Quiénes saludar, quiénes están de feriado y quiénes de vacaciones en un día. */
export function teamForDay(date: ISODate, events: CalendarEvent[], people: Person[], vacations: Vacation[]): DayTeam {
  const active = people.filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const visible = events.filter((e) => !e.archived);
  const year = parseISO(date).y;

  const greet = expandEvents(visible, date, date)
    .map((occurrence) => ({ occurrence, people: active.filter((p) => isForPerson(occurrence.event, p)) }))
    .filter((g) => g.people.length > 0);

  const holiday = visible
    .filter((e) => e.isHoliday && e.country !== 'intl' && holidayDaysOff(e, year).includes(date))
    .map((event) => ({ event, people: active.filter((p) => p.country === event.country && (!event.region || p.region === event.region)) }))
    .filter((h) => h.people.length > 0);

  const byId = new Map(active.map((p) => [p.id, p]));
  const vacation = vacations
    .filter((v) => compareISO(v.start, date) <= 0 && compareISO(date, v.end) <= 0 && byId.has(v.personId))
    .map((v) => ({ person: byId.get(v.personId)!, vacation: v }))
    .sort((a, b) => a.person.name.localeCompare(b.person.name, 'es'));

  return { greet, holiday, vacation };
}

export function personInitials(p: Pick<Person, 'name' | 'initials'>): string {
  return p.initials?.trim().toUpperCase() || initials(p.name);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
