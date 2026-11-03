import Dexie, { type EntityTable } from 'dexie';
import type { CalendarEvent, Category, Country, Greeting, Settings } from '../types';

export const DB_NAME = 'qs-calendar';
/** Versión del esquema de datos (IndexedDB y respaldos JSON). */
export const SCHEMA_VERSION = 1;

export interface KV<T = unknown> {
  key: string;
  value: T;
}

export interface ReviewedAlert {
  /** `${eventId}@${occurrenceStart}` */
  key: string;
  reviewedAt: string;
}

export class CalendarDB extends Dexie {
  events!: EntityTable<CalendarEvent, 'id'>;
  greetings!: EntityTable<Greeting, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  countries!: EntityTable<Country, 'id'>;
  settings!: EntityTable<KV<Settings>, 'key'>;
  meta!: EntityTable<KV, 'key'>;
  reviewedAlerts!: EntityTable<ReviewedAlert, 'key'>;

  constructor(name = DB_NAME) {
    super(name);
    /*
     * Migraciones: cada cambio de esquema suma un `this.version(n)` nuevo
     * (sin borrar los anteriores) y, si hace falta transformar datos, un
     * `.upgrade(tx => …)`. Dexie aplica en orden las que falten.
     */
    this.version(1).stores({
      events: 'id, startDate, category, country, relevance, verification, provenance, updatedAt',
      greetings: 'id, eventId, status, plannedDate, updatedAt',
      categories: 'id, order',
      countries: 'id, order',
      settings: 'key',
      meta: 'key',
      reviewedAlerts: 'key',
    });
  }
}

export let db = new CalendarDB();

/** Solo para tests: abre una base nueva y aislada. */
export async function resetDatabaseForTests(name = `${DB_NAME}-test-${Math.random().toString(36).slice(2)}`) {
  db.close();
  db = new CalendarDB(name);
  await db.open();
  return db;
}
