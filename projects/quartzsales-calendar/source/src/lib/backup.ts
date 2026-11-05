import { db, SCHEMA_VERSION, simplifyGreeting } from '../db/db';
import { backupSchema, type Backup } from '../schemas/backup';
import type { CalendarEvent, Greeting } from '../types';

export async function buildBackup(now = new Date()): Promise<Backup> {
  const [events, greetings, categories, countries, settingsRow, deleted, seedVersion, reviewedAlerts] = await Promise.all([
    db.events.toArray(),
    db.greetings.toArray(),
    db.categories.toArray(),
    db.countries.toArray(),
    db.settings.get('app'),
    db.meta.get('deletedSeedIds'),
    db.meta.get('seedVersion'),
    db.reviewedAlerts.toArray(),
  ]);
  return {
    app: 'qs-calendar',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: {
      events,
      greetings,
      categories,
      countries,
      settings: settingsRow?.value ?? { theme: 'system', leadDays: 3 },
      deletedSeedIds: (deleted?.value as string[] | undefined) ?? [],
      seedVersion: (seedVersion?.value as number | undefined) ?? 0,
      reviewedAlerts,
    },
  };
}

/**
 * Migraciones de respaldos: cada entrada transforma un respaldo de la versión
 * `from` a `from + 1`.
 */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  // v1 → v2: el esquema de datos no cambió; v2 solo sumó España a los países por defecto.
  // Al importar en modo combinar se agrega si falta; en reemplazar se respeta el respaldo.
  1: (raw) => raw,
  // v2 → v3: saludos simplificados (sin tono, canal, notas ni versiones; estados pendiente/listo/compartido).
  2: (raw) => {
    const data = (raw.data ?? {}) as Record<string, unknown>;
    const greetings = Array.isArray(data.greetings) ? data.greetings : [];
    return { ...raw, data: { ...data, greetings: greetings.map((g) => simplifyGreeting(g as Record<string, unknown>)) } };
  },
};

export type ParseResult = { ok: true; backup: Backup; migratedFrom?: number } | { ok: false; error: string };

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  if (!raw || typeof raw !== 'object' || (raw as { app?: unknown }).app !== 'qs-calendar') {
    return { ok: false, error: 'El archivo no es un respaldo de QuartzSales Calendar.' };
  }
  let version = Number((raw as { schemaVersion?: unknown }).schemaVersion);
  if (!Number.isInteger(version) || version < 1) return { ok: false, error: 'El respaldo no indica una versión de esquema válida.' };
  if (version > SCHEMA_VERSION) {
    return { ok: false, error: `El respaldo es de una versión más nueva de la app (v${version}). Actualizá la app y probá de nuevo.` };
  }
  const original = version;
  let data = raw as Record<string, unknown>;
  while (version < SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) return { ok: false, error: `No hay migración disponible desde la v${version}.` };
    data = { ...migrate(data), schemaVersion: version + 1 };
    version++;
  }
  const parsed = backupSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `El respaldo tiene datos inválidos${issue ? ` (${issue.path.join('.')}: ${issue.message})` : ''}.` };
  }
  return { ok: true, backup: parsed.data, migratedFrom: original < SCHEMA_VERSION ? original : undefined };
}

export interface ImportSummary {
  events: { nuevos: number; duplicados: number; conflictos: number };
  greetings: { nuevos: number; duplicados: number; conflictos: number };
}

function same<T extends { updatedAt: string }>(a: T, b: T) {
  return JSON.stringify({ ...a, updatedAt: '' }) === JSON.stringify({ ...b, updatedAt: '' });
}

function classify<T extends { id: string; updatedAt: string }>(incoming: T[], existing: Map<string, T>) {
  const out = { nuevos: 0, duplicados: 0, conflictos: 0 };
  for (const item of incoming) {
    const local = existing.get(item.id);
    if (!local) out.nuevos++;
    else if (same(local, item)) out.duplicados++;
    else out.conflictos++;
  }
  return out;
}

/** Nuevos (ID inexistente), duplicados (idénticos) y conflictos (mismo ID, distinto contenido). */
export async function summarizeImport(backup: Backup): Promise<ImportSummary> {
  const [events, greetings] = await Promise.all([db.events.toArray(), db.greetings.toArray()]);
  return {
    events: classify<CalendarEvent>(backup.data.events, new Map(events.map((e) => [e.id, e]))),
    greetings: classify<Greeting>(backup.data.greetings, new Map(greetings.map((g) => [g.id, g]))),
  };
}

/**
 * combinar: agrega lo nuevo y, en conflictos, se queda con la versión editada más recientemente.
 *           Configuración, países y categorías locales se mantienen; se suman los que no existan.
 * reemplazar: borra todo lo local y carga el respaldo tal cual.
 */
export async function applyImport(backup: Backup, mode: 'combinar' | 'reemplazar'): Promise<void> {
  const d = backup.data;
  await db.transaction('rw', [db.events, db.greetings, db.categories, db.countries, db.settings, db.meta, db.reviewedAlerts], async () => {
    if (mode === 'reemplazar') {
      await Promise.all([db.events.clear(), db.greetings.clear(), db.categories.clear(), db.countries.clear(), db.meta.clear(), db.reviewedAlerts.clear()]);
      await db.events.bulkAdd(d.events as CalendarEvent[]);
      await db.greetings.bulkAdd(d.greetings);
      await db.categories.bulkAdd(d.categories);
      await db.countries.bulkAdd(d.countries);
      await db.settings.put({ key: 'app', value: d.settings });
      await db.meta.bulkPut([
        { key: 'deletedSeedIds', value: d.deletedSeedIds },
        { key: 'seedVersion', value: d.seedVersion },
      ]);
      await db.reviewedAlerts.bulkAdd(d.reviewedAlerts);
      return;
    }
    const newer = async <T extends { id: string; updatedAt: string }>(table: typeof db.events | typeof db.greetings, items: T[]) => {
      for (const item of items) {
        const local = (await table.get(item.id)) as T | undefined;
        if (!local || item.updatedAt > local.updatedAt) await (table as unknown as { put: (v: T) => Promise<unknown> }).put(item);
      }
    };
    await newer(db.events, d.events as CalendarEvent[]);
    await newer(db.greetings, d.greetings);
    for (const c of d.categories) if (!(await db.categories.get(c.id))) await db.categories.add(c);
    for (const c of d.countries) if (!(await db.countries.get(c.id))) await db.countries.add(c);
    const deleted = new Set([...(((await db.meta.get('deletedSeedIds'))?.value as string[] | undefined) ?? []), ...d.deletedSeedIds]);
    await db.meta.put({ key: 'deletedSeedIds', value: [...deleted] });
    await db.reviewedAlerts.bulkPut(d.reviewedAlerts);
  });
}
