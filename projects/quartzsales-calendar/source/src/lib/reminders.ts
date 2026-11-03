import type { CalendarEvent, Greeting, ISODate, Occurrence } from '../types';
import { addDays } from './dates';
import { expandEvents } from './recurrence';

/** Un saludo "resuelve" la alerta si está listo o ya se compartió. */
export function isGreetingReady(list: Greeting[] | undefined): boolean {
  return !!list?.some((g) => g.status === 'listo' || g.status === 'compartido');
}

export interface Alert {
  occurrence: Occurrence;
  /** Días hasta el inicio (0 = hoy). */
  daysLeft: number;
  greetings: Greeting[];
}

/**
 * Eventos de relevancia alta que empiezan dentro de la ventana de anticipación
 * (hoy … hoy + leadDays) y no tienen un saludo listo o compartido.
 * Las alertas revisadas se excluyen por clave de ocurrencia.
 */
export function computeAlerts(
  events: CalendarEvent[],
  greetingsMap: Map<string, Greeting[]>,
  today: ISODate,
  leadDays: number,
  reviewed: Set<string> = new Set(),
): Alert[] {
  const until = addDays(today, Math.max(0, leadDays));
  return expandEvents(events.filter((e) => !e.archived && e.relevance === 'alta'), today, until)
    .filter((o) => o.start >= today && o.start <= until)
    .filter((o) => !reviewed.has(o.key))
    .filter((o) => !isGreetingReady(greetingsMap.get(o.event.id)))
    .map((o) => ({
      occurrence: o,
      daysLeft: Math.round((Date.parse(o.start) - Date.parse(today)) / 86_400_000),
      greetings: greetingsMap.get(o.event.id) ?? [],
    }));
}

/** Próximas ocurrencias (no archivadas) que empiezan entre hoy y hoy + days. */
export function upcoming(events: CalendarEvent[], today: ISODate, days: number): Occurrence[] {
  const until = addDays(today, days);
  return expandEvents(events.filter((e) => !e.archived), today, until).filter((o) => o.start >= today || o.end >= today);
}
