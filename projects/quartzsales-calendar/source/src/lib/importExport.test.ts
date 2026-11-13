import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES, DEFAULT_COUNTRIES } from '../data/defaults';
import { db, resetDatabaseForTests } from '../db/db';
import { createGreeting } from '../db/greetings';
import { createEvent, initDatabase, listEvents, updateEvent } from '../db/repo';
import type { Catalog } from '../hooks/useData';
import { makeEvent } from '../test/factories';
import { applyImport, buildBackup, parseBackup, summarizeImport } from './backup';
import { parseCsv, toCsv } from './csv';
import { duplicateKey, findDuplicate } from './duplicates';
import { csvTemplate, eventsToCsv, parseEventsCsv } from './eventsCsv';

const names = new Map<string, string>();
for (const c of DEFAULT_COUNTRIES) {
  names.set(c.id, c.name);
  for (const r of c.regions) {
    names.set(r.id, r.name);
    for (const city of r.cities) names.set(city.id, city.name);
  }
}
const catalog: Catalog = {
  categories: DEFAULT_CATEGORIES,
  countries: DEFAULT_COUNTRIES,
  categoryById: new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c])),
  countryById: new Map(DEFAULT_COUNTRIES.map((c) => [c.id, c])),
  placeName: (id) => (id ? names.get(id) : undefined),
};

function input(overrides = {}) {
  const { id: _i, createdAt: _c, updatedAt: _u, provenance: _p, userModified: _m, ...rest } = makeEvent(overrides);
  return rest;
}

beforeEach(async () => {
  await resetDatabaseForTests();
  await initDatabase();
});

describe('respaldo JSON', () => {
  it('ida y vuelta sin pérdida', async () => {
    const e = await createEvent(input({ title: 'Día del Mate', holidayObservances: [{ year: 2026, date: '2026-11-30', note: 'x' }], contentIdeas: ['Encuesta'] }));
    const g = await createGreeting({ eventId: e.id, internalTitle: 'Mate', body: '*Hola* 🧉' });
    const backup = await buildBackup();
    const text = JSON.stringify(backup);

    await resetDatabaseForTests();
    await initDatabase();
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    await applyImport(parsed.backup, 'reemplazar');
    expect(await db.events.get(e.id)).toEqual(e);
    expect(await db.greetings.get(g.id)).toEqual(g);
    expect(JSON.parse(JSON.stringify(await buildBackup(new Date(backup.exportedAt))))).toEqual(JSON.parse(text));
  });

  it('rechaza archivos inválidos con mensajes útiles', () => {
    expect(parseBackup('no es json')).toEqual({ ok: false, error: 'El archivo no es un JSON válido.' });
    expect(parseBackup('{"app":"otra"}')).toMatchObject({ ok: false, error: expect.stringContaining('no es un respaldo') });
    expect(parseBackup('{"app":"qs-calendar","schemaVersion":99}')).toMatchObject({ ok: false, error: expect.stringContaining('más nueva') });
    expect(parseBackup('{"app":"qs-calendar","schemaVersion":1,"exportedAt":"x","data":{}}')).toMatchObject({ ok: false, error: expect.stringContaining('datos inválidos') });
  });

  it('resume nuevos, duplicados y conflictos, y combina por fecha de edición', async () => {
    const a = await createEvent(input({ title: 'A' }));
    const b = await createEvent(input({ title: 'B' }));
    const backup = await buildBackup();
    // Cambios locales posteriores al respaldo
    await updateEvent(a.id, { title: 'A local' });
    backup.data.events.push({ ...makeEvent({ id: 'nuevo', title: 'Nuevo' }) });
    const summary = await summarizeImport(backup);
    expect(summary.events).toEqual({ nuevos: 1, duplicados: 1, conflictos: 1 });

    await applyImport(backup, 'combinar');
    expect((await db.events.get(a.id))?.title).toBe('A local'); // la local es más reciente
    expect(await db.events.get(b.id)).toBeDefined();
    expect(await db.events.get('nuevo')).toBeDefined();
  });
});

describe('CSV', () => {
  it('parsea comillas, saltos de línea y punto y coma', () => {
    expect(parseCsv('a;b\r\n"x; y";"dijo ""hola""\nchau"\r\n')).toEqual([['a', 'b'], ['x; y', 'dijo "hola"\nchau']]);
    expect(parseCsv('﻿a,b\n1,2\n\n')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('la plantilla se valida sin errores (ignorando la fila de ayuda)', () => {
    const result = parseEventsCsv(parseCsv(toCsv(csvTemplate())), catalog, []);
    expect(result.missingColumns).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows.every((r) => r.errors.length === 0)).toBe(true);
    expect(result.rows[1]?.content?.recurrence).toEqual({ type: 'yearly-nth-weekday', month: 10, weekday: 6, nth: 3, offsetDays: 0 });
  });

  it('informa columnas faltantes', () => {
    expect(parseEventsCsv([['titulo', 'pais']], catalog, []).missingColumns).toEqual(['categoria', 'tipo_fecha']);
  });

  it('informa errores por fila', () => {
    const rows = [
      ['titulo', 'categoria', 'pais', 'tipo_fecha', 'fecha_inicio', 'relevancia', 'verificacion', 'url_fuente'],
      ['', 'Efemérides', 'Argentina', 'fija', '10/11/2026', 'alta', 'pendiente', ''],
      ['X', 'Inventada', 'Narnia', 'fija', '31/02/2026', 'alta', 'pendiente', ''],
      ['Y', 'Efemérides', 'Argentina', 'cada tanto', '10/11/2026', 'altísima', 'confirmado', 'ftp://x'],
      ['Z', 'Efemérides', 'Argentina', 'fija', '10/11/2026', 'alta', 'confirmado', ''],
    ];
    const r = parseEventsCsv(rows, catalog, []);
    expect(r.rows[0]?.errors).toContain('titulo: El nombre es obligatorio.');
    expect(r.rows[1]?.errors).toEqual(expect.arrayContaining([expect.stringContaining('Categoría desconocida'), expect.stringContaining('País desconocido'), expect.stringContaining('fecha inválida')]));
    expect(r.rows[2]?.errors).toContain('tipo_fecha: usá fija, regla, pascua o unica.');
    expect(r.rows[3]?.errors).toContain('fuente: Para marcarlo como confirmado, indicá la fuente.');
    expect(r.rows.map((x) => x.line)).toEqual([2, 3, 4, 5]);
  });

  it('exporta y vuelve a importar eventos', async () => {
    const e = makeEvent({ title: 'Día, "raro"', category: 'cultura', country: 'ar', imageUrl: 'https://drive.example/a', endDate: '2026-11-12' });
    const r = parseEventsCsv(parseCsv(toCsv(eventsToCsv([e], catalog))), catalog, []);
    expect(r.rows[0]?.errors).toEqual([]);
    expect(r.rows[0]?.content).toMatchObject({ title: e.title, category: 'cultura', country: 'ar', imageUrl: e.imageUrl, startDate: e.startDate, endDate: e.endDate });
  });
});

describe('detección de duplicados', () => {
  it('mismo título normalizado + misma fecha + mismo país', () => {
    const a = makeEvent({ title: 'Día de la Tradición', startDate: '2025-11-10', country: 'ar' });
    expect(findDuplicate(makeEvent({ title: 'dia de la TRADICION ', startDate: '2026-11-10', country: 'ar' }), [a])).toBe(a);
    expect(findDuplicate(makeEvent({ title: 'Día de la Tradición', startDate: '2026-11-11', country: 'ar' }), [a])).toBeUndefined();
    expect(findDuplicate(makeEvent({ title: 'Día de la Tradición', startDate: '2026-11-10', country: 'mx' }), [a])).toBeUndefined();
  });

  it('las ediciones únicas comparan la fecha completa', () => {
    const a = makeEvent({ startDate: '2025-11-20', recurrence: { type: 'none' } });
    const b = makeEvent({ title: a.title, startDate: '2026-11-20', recurrence: { type: 'none' } });
    expect(duplicateKey(a)).not.toBe(duplicateKey(b));
  });

  it('marca duplicados contra la base y dentro del archivo', async () => {
    await createEvent(input({ title: 'Día del Mate', startDate: '2026-11-30', country: 'ar', category: 'cultura' }));
    const rows = [
      ['titulo', 'categoria', 'pais', 'tipo_fecha', 'fecha_inicio'],
      ['Dia del mate', 'cultura', 'ar', 'fija', '30/11/2026'],
      ['Otro', 'cultura', 'ar', 'fija', '01/12/2026'],
      ['OTRO', 'cultura', 'ar', 'fija', '01/12/2026'],
    ];
    const r = parseEventsCsv(rows, catalog, await listEvents());
    expect(r.rows.map((x) => x.duplicate?.kind)).toEqual(['existente', undefined, 'archivo']);
  });
});
