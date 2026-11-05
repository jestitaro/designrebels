import { DEFAULT_CATEGORIES, DEFAULT_COUNTRIES, DEFAULT_SETTINGS } from '../data/defaults';
import { newId, nowStamp } from '../lib/id';
import type { CalendarEvent, Category, Country, Settings } from '../types';
import { db } from './db';

export type NewEventInput = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'provenance' | 'userModified'>;

const DELETED_SEEDS_KEY = 'deletedSeedIds';
const SEED_VERSION_KEY = 'seedVersion';

/* ───────────── Inicialización ───────────── */

/** Carga configuración y catálogos por defecto si la base está vacía, y mergea el seed. */
export async function initDatabase(seed: CalendarEvent[] = [], seedVersion = 0): Promise<void> {
  await db.transaction('rw', [db.categories, db.countries, db.settings], async () => {
    if ((await db.categories.count()) === 0) await db.categories.bulkAdd(structuredClone(DEFAULT_CATEGORIES));
    if ((await db.countries.count()) === 0) await db.countries.bulkAdd(structuredClone(DEFAULT_COUNTRIES));
    if (!(await db.settings.get('app'))) await db.settings.put({ key: 'app', value: { ...DEFAULT_SETTINGS } });
  });
  await mergeSeed(seed, seedVersion);
}

export interface SeedMergeResult {
  added: number;
  updated: number;
  keptLocal: number;
  skippedDeleted: number;
  removed: number;
}

/**
 * Mergea el catálogo inicial por ID sin pisar ediciones locales (y saca las fechas que salieron del catálogo si no las tocaste):
 * - Si no existe localmente → se agrega (salvo que el usuario lo haya eliminado).
 * - Si existe y el usuario no lo editó → se actualiza con la versión nueva,
 *   conservando favorito/archivado/estado editorial.
 * - Si el usuario lo editó → se respeta la versión local.
 */
export async function mergeSeed(seed: CalendarEvent[], seedVersion: number): Promise<SeedMergeResult> {
  const result: SeedMergeResult = { added: 0, updated: 0, keptLocal: 0, skippedDeleted: 0, removed: 0 };
  await db.transaction('rw', [db.events, db.meta, db.greetings], async () => {
    const current = (await db.meta.get(SEED_VERSION_KEY))?.value as number | undefined;
    if (current !== undefined && current >= seedVersion) return;
    const deleted = new Set(((await db.meta.get(DELETED_SEEDS_KEY))?.value as string[] | undefined) ?? []);
    for (const item of seed) {
      if (deleted.has(item.id)) {
        result.skippedDeleted++;
        continue;
      }
      const local = await db.events.get(item.id);
      if (!local) {
        await db.events.add({ ...item, provenance: 'seed', userModified: false });
        result.added++;
      } else if (local.userModified) {
        result.keptLocal++;
      } else {
        await db.events.put({
          ...item,
          provenance: 'seed',
          userModified: false,
          favorite: local.favorite,
          archived: local.archived,
          editorialStatus: local.editorialStatus,
          createdAt: local.createdAt,
        });
        result.updated++;
      }
    }
    // Fechas que salieron del catálogo: se borran solo si no las editaste ni tienen saludos.
    if (current !== undefined) {
      const ids = new Set(seed.map((e) => e.id));
      const withGreetings = new Set((await db.greetings.toArray()).map((g) => g.eventId));
      const obsolete = (await db.events.where('provenance').equals('seed').toArray()).filter(
        (e) => !ids.has(e.id) && !e.userModified && !withGreetings.has(e.id),
      );
      await db.events.bulkDelete(obsolete.map((e) => e.id));
      result.removed = obsolete.length;
    }
    await db.meta.put({ key: SEED_VERSION_KEY, value: seedVersion });
  });
  return result;
}

/* ───────────── Eventos ───────────── */

export async function listEvents(): Promise<CalendarEvent[]> {
  return db.events.toArray();
}

export async function getEvent(id: string): Promise<CalendarEvent | undefined> {
  return db.events.get(id);
}

export async function createEvent(input: NewEventInput): Promise<CalendarEvent> {
  const stamp = nowStamp();
  const event: CalendarEvent = {
    ...input,
    id: newId('evt'),
    provenance: 'usuario',
    userModified: false,
    createdAt: stamp,
    updatedAt: stamp,
  };
  await db.events.add(event);
  return event;
}

/** Campos que no cuentan como "edición de contenido" de un evento del seed. */
const PERSONAL_FIELDS = new Set<keyof CalendarEvent>(['favorite', 'archived', 'editorialStatus']);

export async function updateEvent(id: string, changes: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const current = await db.events.get(id);
  if (!current) throw new Error('El evento no existe.');
  const touchesContent = Object.keys(changes).some((k) => !PERSONAL_FIELDS.has(k as keyof CalendarEvent));
  const next: CalendarEvent = {
    ...current,
    ...changes,
    id: current.id,
    provenance: current.provenance,
    createdAt: current.createdAt,
    userModified: current.userModified || (current.provenance === 'seed' && touchesContent),
    updatedAt: nowStamp(),
  };
  await db.events.put(next);
  return next;
}

export async function updateEvents(ids: string[], changes: Partial<CalendarEvent>): Promise<void> {
  await db.transaction('rw', db.events, async () => {
    for (const id of ids) await updateEvent(id, changes);
  });
}

export async function duplicateEvent(id: string): Promise<CalendarEvent> {
  const current = await db.events.get(id);
  if (!current) throw new Error('El evento no existe.');
  const { id: _id, createdAt: _c, updatedAt: _u, provenance: _p, userModified: _m, ...rest } = current;
  return createEvent({ ...rest, title: `${current.title} (copia)`, favorite: false });
}

/** Elimina eventos y sus saludos. Los del seed quedan registrados para no volver a aparecer. */
export async function deleteEvents(ids: string[]): Promise<void> {
  await db.transaction('rw', [db.events, db.greetings, db.meta], async () => {
    const events = await db.events.bulkGet(ids);
    const seedIds = events.filter((e): e is CalendarEvent => !!e && e.provenance === 'seed').map((e) => e.id);
    if (seedIds.length) {
      const prev = ((await db.meta.get(DELETED_SEEDS_KEY))?.value as string[] | undefined) ?? [];
      await db.meta.put({ key: DELETED_SEEDS_KEY, value: [...new Set([...prev, ...seedIds])] });
    }
    await db.greetings.where('eventId').anyOf(ids).delete();
    await db.events.bulkDelete(ids);
  });
}

/* ───────────── Configuración ───────────── */

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app'))?.value ?? { ...DEFAULT_SETTINGS };
}

export async function updateSettings(changes: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...changes };
  await db.settings.put({ key: 'app', value: next });
  return next;
}

/* ───────────── Recordatorios ───────────── */

export async function markAlertReviewed(key: string): Promise<void> {
  await db.reviewedAlerts.put({ key, reviewedAt: new Date().toISOString() });
}

export async function unmarkAlertReviewed(key: string): Promise<void> {
  await db.reviewedAlerts.delete(key);
}

/* ───────────── Catálogos editables ───────────── */

export async function saveCountry(country: Country): Promise<void> {
  await db.countries.put(country);
}

export async function saveCategory(category: Category): Promise<void> {
  await db.categories.put(category);
}

/** Restaura tema, anticipación y visibilidad de categorías. No toca eventos, saludos ni lugares. */
export async function restoreDefaultSettings(): Promise<void> {
  await db.transaction('rw', [db.settings, db.categories], async () => {
    const current = await getSettings();
    await db.settings.put({ key: 'app', value: { ...DEFAULT_SETTINGS, lastExportAt: current.lastExportAt } });
    const cats = await db.categories.toArray();
    await db.categories.bulkPut(cats.map((c) => ({ ...c, visible: true })));
  });
}

/** Borra la base local completa (incluido el equipo). La app vuelve a cargar catálogos y seed al reiniciar. */
export async function wipeLocalData(): Promise<void> {
  await db.delete();
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith('qs-calendar')) localStorage.removeItem(key);
    for (const key of Object.keys(sessionStorage)) if (key.startsWith('qs-calendar')) sessionStorage.removeItem(key);
  } catch {
    // almacenamiento bloqueado: nada que limpiar
  }
}
