import Dexie, { type EntityTable } from 'dexie';
import type { CalendarEvent, Category, Country, Greeting, Person, Settings, Vacation } from '../types';

export const DB_NAME = 'qs-calendar';
/** Versión del esquema de datos (IndexedDB y respaldos JSON). */
export const SCHEMA_VERSION = 4;

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
  people!: EntityTable<Person, 'id'>;
  vacations!: EntityTable<Vacation, 'id'>;

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
    // v2: suma España a los países (sin tocar los que el usuario ya editó).
    this.version(2)
      .stores({})
      .upgrade(async (tx) => {
        const countries = tx.table<Country, string>('countries');
        if ((await countries.count()) > 0 && !(await countries.get('es'))) {
          const intl = await countries.get('intl');
          if (intl) await countries.put({ ...intl, order: intl.order + 1 });
          await countries.add({ id: 'es', name: 'España', active: true, order: intl ? intl.order : 99, regions: [] });
        }
      });
    // v3: saludos simplificados (texto, imagen y estado pendiente / listo / compartido).
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('greetings')
          .toCollection()
          .modify((g: Record<string, unknown>) => {
            Object.assign(g, simplifyGreeting(g));
            for (const key of ['tone', 'channel', 'privateNotes', 'versions']) delete g[key];
          });
      });
    // v4: equipo (personas y vacaciones). Solo vive en este navegador.
    this.version(4)
      .stores({ people: 'id, country, name', vacations: 'id, personId, start, end' })
      .upgrade(async (tx) => {
        // Suma la categoría "Feriados" (se puede ocultar en Configuración).
        const categories = tx.table<Category, string>('categories');
        if ((await categories.count()) > 0 && !(await categories.get('feriados'))) {
          await categories.add({ id: 'feriados', name: 'Feriados', color: 'slate', subcategories: [], visible: true, order: 6.5 });
        }
      });
  }
}

/** Convierte un saludo de versiones anteriores al formato actual. */
export function simplifyGreeting(g: Record<string, unknown>): Greeting {
  const status = g.status === 'listo' || g.status === 'compartido' ? g.status : 'pendiente';
  return {
    id: String(g.id),
    eventId: String(g.eventId),
    internalTitle: String(g.internalTitle ?? ''),
    body: String(g.body ?? ''),
    imageUrl: typeof g.imageUrl === 'string' && g.imageUrl ? g.imageUrl : undefined,
    plannedDate: typeof g.plannedDate === 'string' ? g.plannedDate : undefined,
    status,
    createdAt: String(g.createdAt ?? ''),
    updatedAt: String(g.updatedAt ?? ''),
  };
}

export let db = new CalendarDB();

/** Solo para tests: abre una base nueva y aislada. */
export async function resetDatabaseForTests(name = `${DB_NAME}-test-${Math.random().toString(36).slice(2)}`) {
  db.close();
  db = new CalendarDB(name);
  await db.open();
  return db;
}
