import type { CalendarEvent, Greeting, GreetingStatus, Relevance, Verification } from '../types';
import { normalizeText } from './text';

export interface EventFilters {
  query: string;
  countries: string[];
  regions: string[];
  categories: string[];
  relevance: Relevance[];
  verification: Verification[];
  greeting: 'todos' | 'con' | 'sin';
  favoritesOnly: boolean;
  showArchived: boolean;
}

export const EMPTY_FILTERS: EventFilters = {
  query: '',
  countries: [],
  regions: [],
  categories: [],
  relevance: [],
  verification: [],
  greeting: 'todos',
  favoritesOnly: false,
  showArchived: false,
};

/** Estados de saludo que cuentan como "tiene saludo". Descartado no cuenta. */
const ACTIVE_GREETING: GreetingStatus[] = ['sin redactar', 'borrador', 'listo', 'compartido'];

export function greetingsByEvent(greetings: Greeting[]): Map<string, Greeting[]> {
  const map = new Map<string, Greeting[]>();
  for (const g of greetings) {
    const list = map.get(g.eventId);
    if (list) list.push(g);
    else map.set(g.eventId, [g]);
  }
  return map;
}

export function hasActiveGreeting(list: Greeting[] | undefined): boolean {
  return !!list?.some((g) => ACTIVE_GREETING.includes(g.status));
}

export function matchesQuery(event: CalendarEvent, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  const haystack = normalizeText(`${event.title} ${event.summary}`);
  return q.split(' ').every((word) => haystack.includes(word));
}

/** Aplica todos los filtros combinados (AND entre grupos, OR dentro de cada grupo). */
export function applyFilters(
  events: CalendarEvent[],
  filters: EventFilters,
  greetingsMap: Map<string, Greeting[]> = new Map(),
  hiddenCategories: Set<string> = new Set(),
): CalendarEvent[] {
  return events.filter((e) => {
    if (!filters.showArchived && e.archived) return false;
    if (hiddenCategories.has(e.category) && !filters.categories.includes(e.category)) return false;
    if (filters.favoritesOnly && !e.favorite) return false;
    if (filters.countries.length && !filters.countries.includes(e.country)) return false;
    if (filters.regions.length && !(e.region && filters.regions.includes(e.region))) return false;
    if (filters.categories.length && !filters.categories.includes(e.category)) return false;
    if (filters.relevance.length && !filters.relevance.includes(e.relevance)) return false;
    if (filters.verification.length && !filters.verification.includes(e.verification)) return false;
    if (filters.greeting !== 'todos') {
      const has = hasActiveGreeting(greetingsMap.get(e.id));
      if (filters.greeting === 'con' ? !has : has) return false;
    }
    return matchesQuery(e, filters.query);
  });
}

export function countActiveFilters(f: EventFilters): number {
  return (
    f.countries.length + f.regions.length + f.categories.length + f.relevance.length + f.verification.length +
    (f.greeting !== 'todos' ? 1 : 0) + (f.favoritesOnly ? 1 : 0) + (f.showArchived ? 1 : 0)
  );
}
