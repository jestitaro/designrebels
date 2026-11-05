import { beforeEach, describe, expect, it } from 'vitest';
import { makeEvent } from '../test/factories';
import { db, resetDatabaseForTests, SCHEMA_VERSION } from './db';
import {
  createEvent, deleteEvents, duplicateEvent, getEvent, getSettings, initDatabase, listEvents, mergeSeed,
  updateEvent, updateEvents, updateSettings,
} from './repo';

beforeEach(async () => {
  await resetDatabaseForTests();
});

function input() {
  const { id: _i, createdAt: _c, updatedAt: _u, provenance: _p, userModified: _m, ...rest } = makeEvent({ title: 'Día de la Tradición' });
  return rest;
}

describe('persistencia de eventos', () => {
  it('inicializa catálogos y configuración por defecto una sola vez', async () => {
    await initDatabase();
    await initDatabase();
    expect(await db.categories.count()).toBe(7);
    expect(await db.countries.count()).toBe(5);
    expect((await getSettings()).leadDays).toBe(3);
    expect(db.verno).toBe(SCHEMA_VERSION);
  });

  it('crea, lee, edita y elimina', async () => {
    const created = await createEvent(input());
    expect(created.provenance).toBe('usuario');
    expect(await getEvent(created.id)).toEqual(created);

    const edited = await updateEvent(created.id, { relevance: 'alta' });
    expect(edited.relevance).toBe('alta');
    expect(edited.createdAt).toBe(created.createdAt);

    await deleteEvents([created.id]);
    expect(await getEvent(created.id)).toBeUndefined();
  });

  it('guarda la fecha como YYYY-MM-DD sin conversión', async () => {
    const created = await createEvent({ ...input(), startDate: '2026-11-10' });
    expect((await getEvent(created.id))?.startDate).toBe('2026-11-10');
  });

  it('duplica y aplica cambios masivos', async () => {
    const a = await createEvent(input());
    const copy = await duplicateEvent(a.id);
    expect(copy.id).not.toBe(a.id);
    expect(copy.title).toBe('Día de la Tradición (copia)');
    await updateEvents([a.id, copy.id], { archived: true });
    expect((await listEvents()).every((e) => e.archived)).toBe(true);
  });

  it('elimina los saludos asociados', async () => {
    const a = await createEvent(input());
    await db.greetings.add({
      id: 'g1', eventId: a.id, internalTitle: '', body: '', status: 'pendiente', createdAt: '', updatedAt: '',
    });
    await deleteEvents([a.id]);
    expect(await db.greetings.count()).toBe(0);
  });

  it('actualiza la configuración', async () => {
    await initDatabase();
    await updateSettings({ leadDays: 5 });
    expect((await getSettings()).leadDays).toBe(5);
    expect((await getSettings()).theme).toBe('system');
  });
});

describe('migraciones', () => {
  it('v1 → v2 suma España sin tocar los países editados', async () => {
    const name = `qs-calendar-mig-${Math.random().toString(36).slice(2)}`;
    const { default: Dexie } = await import('dexie');
    const v1 = new Dexie(name);
    v1.version(1).stores({ events: 'id', greetings: 'id', categories: 'id, order', countries: 'id, order', settings: 'key', meta: 'key', reviewedAlerts: 'key' });
    await v1.open();
    await v1.table('countries').bulkAdd([
      { id: 'ar', name: 'Argentina editada', active: true, order: 0, regions: [] },
      { id: 'intl', name: 'Internacional', active: true, order: 1, regions: [] },
    ]);
    v1.close();
    const migrated = await resetDatabaseForTests(name);
    expect(migrated.verno).toBe(3);
    const countries = await migrated.countries.orderBy('order').toArray();
    expect(countries.map((c) => c.id)).toEqual(['ar', 'es', 'intl']);
    expect(countries[0]?.name).toBe('Argentina editada');
  });
});

describe('merge del seed', () => {
  const v1 = makeEvent({ id: 'seed-mate', title: 'Día del Mate', summary: 'v1', provenance: 'seed' });

  it('agrega los eventos nuevos del seed', async () => {
    const r = await mergeSeed([v1], 1);
    expect(r.added).toBe(1);
    expect((await getEvent('seed-mate'))?.provenance).toBe('seed');
  });

  it('actualiza los no editados y conserva favorito/archivado', async () => {
    await mergeSeed([v1], 1);
    await updateEvent('seed-mate', { favorite: true });
    expect((await getEvent('seed-mate'))?.userModified).toBe(false);
    const r = await mergeSeed([{ ...v1, summary: 'v2' }], 2);
    expect(r.updated).toBe(1);
    const local = await getEvent('seed-mate');
    expect(local?.summary).toBe('v2');
    expect(local?.favorite).toBe(true);
  });

  it('no pisa las ediciones locales', async () => {
    await mergeSeed([v1], 1);
    await updateEvent('seed-mate', { summary: 'mi versión' });
    const r = await mergeSeed([{ ...v1, summary: 'v2' }], 2);
    expect(r.keptLocal).toBe(1);
    expect((await getEvent('seed-mate'))?.summary).toBe('mi versión');
  });

  it('no vuelve a agregar un evento del seed que el usuario eliminó', async () => {
    await mergeSeed([v1], 1);
    await deleteEvents(['seed-mate']);
    const r = await mergeSeed([v1], 2);
    expect(r.skippedDeleted).toBe(1);
    expect(await getEvent('seed-mate')).toBeUndefined();
  });

  it('saca las fechas que salieron del catálogo, salvo editadas o con saludo', async () => {
    const otro = makeEvent({ id: 'seed-otro', provenance: 'seed' });
    const editado = makeEvent({ id: 'seed-editado', provenance: 'seed' });
    const conSaludo = makeEvent({ id: 'seed-saludo', provenance: 'seed' });
    await mergeSeed([v1, otro, editado, conSaludo], 1);
    await updateEvent('seed-editado', { title: 'Mío' });
    await db.greetings.add({ id: 'g', eventId: 'seed-saludo', internalTitle: '', body: '', status: 'pendiente', createdAt: '', updatedAt: '' });
    const r = await mergeSeed([v1], 2);
    expect(r.removed).toBe(1);
    expect(await getEvent('seed-otro')).toBeUndefined();
    expect(await getEvent('seed-editado')).toBeDefined();
    expect(await getEvent('seed-saludo')).toBeDefined();
  });

  it('no re-procesa la misma versión del seed', async () => {
    await mergeSeed([v1], 1);
    await db.events.delete('seed-mate');
    await mergeSeed([v1], 1);
    expect(await getEvent('seed-mate')).toBeUndefined();
  });
});
