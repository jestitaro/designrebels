import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '../db/db';
import { DEFAULT_SETTINGS } from '../data/defaults';
import type { CalendarEvent, Category, Country, Greeting, Settings } from '../types';

export function useEvents(): CalendarEvent[] | undefined {
  return useLiveQuery(() => db.events.toArray(), []);
}

export function useEvent(id: string | undefined): CalendarEvent | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.events.get(id)) ?? null) : null), [id]);
}

export function useGreetings(): Greeting[] | undefined {
  return useLiveQuery(() => db.greetings.toArray(), []);
}

export function useSettings(): Settings {
  return useLiveQuery(async () => (await db.settings.get('app'))?.value, []) ?? DEFAULT_SETTINGS;
}

export interface Catalog {
  categories: Category[];
  countries: Country[];
  categoryById: Map<string, Category>;
  countryById: Map<string, Country>;
  /** Nombre legible de región o ciudad por ID. */
  placeName: (id: string | undefined) => string | undefined;
}

export function useCatalog(): Catalog {
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []) ?? [];
  const countries = useLiveQuery(() => db.countries.orderBy('order').toArray(), []) ?? [];
  return useMemo(() => {
    const names = new Map<string, string>();
    for (const c of countries) {
      names.set(c.id, c.name);
      for (const r of c.regions) {
        names.set(r.id, r.name);
        for (const city of r.cities) names.set(city.id, city.name);
      }
    }
    return {
      categories,
      countries,
      categoryById: new Map(categories.map((c) => [c.id, c])),
      countryById: new Map(countries.map((c) => [c.id, c])),
      placeName: (id) => (id ? names.get(id) : undefined),
    };
  }, [categories, countries]);
}

/** "Córdoba, Argentina" / "Internacional" */
export function placeLabel(event: Pick<CalendarEvent, 'country' | 'region' | 'city'>, catalog: Catalog): string {
  const parts = [catalog.placeName(event.city), catalog.placeName(event.region), catalog.placeName(event.country) ?? event.country];
  return parts.filter(Boolean).join(', ');
}

export function useReviewedAlerts(): Set<string> {
  const rows = useLiveQuery(() => db.reviewedAlerts.toArray(), []);
  return useMemo(() => new Set((rows ?? []).map((r) => r.key)), [rows]);
}

export function useGreetingsMap(): Map<string, Greeting[]> {
  const greetings = useGreetings();
  return useMemo(() => {
    const map = new Map<string, Greeting[]>();
    for (const g of greetings ?? []) {
      const list = map.get(g.eventId);
      if (list) list.push(g);
      else map.set(g.eventId, [g]);
    }
    return map;
  }, [greetings]);
}
