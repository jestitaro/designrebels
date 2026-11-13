import { beforeEach, describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { CalendarDB, db, resetDatabaseForTests } from '../db/db';
import { updateEvent, createEvent } from '../db/repo';
import { isDuplicateEdition, editionHours } from '../features/events/Editions';
import { makeEvent } from '../test/factories';
import type { EventEdition, Person } from '../types';
import { buildIcs } from './ics';
import { describeRecurrence, expandEvents, nextOccurrence, occurrencesByDay, occurrencesInRange } from './recurrence';
import { teamForDay } from './team';

const ed = (id: string, region: string, startDate: string, extra: Partial<EventEdition> = {}): EventEdition => ({
  id, region, startDate, verification: 'confirmado', ...extra,
});

const museos = makeEvent({
  id: 'nm', title: 'Noche de los Museos', country: 'ar', category: 'entretenimiento', startDate: '2026-11-14', recurrence: { type: 'none' },
  editions: [
    ed('cba', 'ar-cba', '2026-11-13', { startTime: '20:00', endTime: '01:00' }),
    ed('caba', 'ar-caba', '2026-11-14', { startTime: '19:00', endTime: '02:00' }),
    ed('lp', 'ar-ba', '2026-11-14', { city: 'ar-ba-laplata', localName: 'Museos a la luz de la luna', verification: 'pendiente', note: 'x' }),
  ],
});

describe('ediciones por región', () => {
  it('cada edición aparece en su día, con su lugar, horario y verificación', () => {
    const occs = occurrencesInRange(museos, '2026-11-01', '2026-11-30');
    expect(occs.map((o) => [o.start, o.event.region])).toEqual([
      ['2026-11-13', 'ar-cba'], ['2026-11-14', 'ar-caba'], ['2026-11-14', 'ar-ba'],
    ]);
    expect(occs[2]!.event.city).toBe('ar-ba-laplata');
    expect(occs[2]!.event.verification).toBe('pendiente');
    expect(occs[0]!.event.startTime).toBe('20:00');
    expect(occs[0]!.event.id).toBe('nm');
  });

  it('dos ediciones el mismo día tienen claves distintas', () => {
    const occs = expandEvents([museos], '2026-11-14', '2026-11-14');
    expect(new Set(occs.map((o) => o.key)).size).toBe(2);
    expect(occurrencesByDay(occs, '2026-11-14', '2026-11-14').get('2026-11-14')).toHaveLength(2);
  });

  it('las ediciones no se repiten el año siguiente', () => {
    expect(occurrencesInRange(museos, '2027-01-01', '2027-12-31')).toEqual([]);
    expect(nextOccurrence(museos, '2026-11-14')?.event.region).toBe('ar-caba');
    expect(nextOccurrence(museos, '2026-11-15')).toBeNull();
    expect(describeRecurrence(museos)).toContain('3 ediciones');
  });

  it('un evento sin ediciones sigue igual', () => {
    const simple = makeEvent({ startDate: '2026-11-10' });
    expect(occurrencesInRange(simple, '2026-11-10', '2026-11-10')[0]!.key).toBe(`${simple.id}@2026-11-10`);
  });

  it('detecta duplicados: mismo lugar y fecha sí; otra región no', () => {
    const list = museos.editions!;
    expect(isDuplicateEdition(list, ed('nuevo', 'ar-cba', '2026-11-13'))).toBe(true);
    expect(isDuplicateEdition(list, ed('nuevo', 'ar-tuc', '2026-11-13'))).toBe(false);
    expect(isDuplicateEdition(list, { ...list[0]! })).toBe(false);
  });

  it('horario que cruza la medianoche', () => {
    expect(editionHours({ startTime: '19:00', endTime: '02:00' })).toBe('19:00 a 02:00 h (termina al día siguiente)');
    expect(editionHours({ startTime: '19:00', endTime: '00:00' })).toBe('19:00 a 24 h');
    expect(editionHours({})).toBe('Todo el día');
    const ics = buildIcs(occurrencesInRange(museos, '2026-11-14', '2026-11-14'), { leadDays: 3, now: new Date('2026-11-01T00:00:00Z') });
    expect(ics).toContain('DTSTART;TZID=America/Argentina/Buenos_Aires:20261114T190000');
    expect(ics).toContain('DTEND;TZID=America/Argentina/Buenos_Aires:20261115T020000');
    expect(ics).toContain('SUMMARY:Museos a la luz de la luna');
    expect(ics.match(/UID:/g)).toHaveLength(2);
  });

  it('el equipo: saluda a quien vive en la región de cada edición', () => {
    const p = (id: string, region: string, city?: string): Person => ({ id, name: id, country: 'ar', region, city, roles: [{ area: 'Desarrollo', title: '' }], active: true, createdAt: '', updatedAt: '' });
    const people = [p('mayra', 'ar-cba'), p('nico', 'ar-caba'), p('juli', 'ar-ba', 'La Plata'), p('seba', 'ar-ba', 'Temperley')];
    const names = (date: string) => teamForDay(date, [museos], people, [], (id) => ({ 'ar-ba-laplata': 'La Plata' })[id]).greet.flatMap((g) => g.people.map((x) => x.id));
    expect(names('2026-11-13')).toEqual(['mayra']);
    expect(names('2026-11-14').sort()).toEqual(['juli', 'nico']);
  });
});

describe('persistencia de ediciones', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it('se guardan y se editan sin tocar el resto del evento', async () => {
    const { id: _id, createdAt: _c, updatedAt: _u, provenance: _p, userModified: _m, ...input } = makeEvent({ title: 'Noche' });
    const created = await createEvent(input);
    await updateEvent(created.id, { editions: [ed('a', 'ar-cba', '2026-11-13')] });
    const stored = await db.events.get(created.id);
    expect(stored?.editions).toHaveLength(1);
    expect(stored?.title).toBe('Noche');
  });
});

describe('migración v6', () => {
  it('borra las fechas comerciales del catálogo que no tocaste y la categoría si queda vacía', async () => {
    const name = `qs-calendar-v5-${Math.random().toString(36).slice(2)}`;
    const old = new Dexie(name);
    old.version(5).stores({
      events: 'id, startDate, category, country, relevance, verification, provenance, updatedAt',
      greetings: 'id, eventId, status, plannedDate, updatedAt',
      categories: 'id, order', countries: 'id, order', settings: 'key', meta: 'key', reviewedAlerts: 'key',
      people: 'id, country, name', vacations: 'id, personId, start, end',
    });
    await old.open();
    const base = makeEvent({ category: 'comerciales' });
    await old.table('events').bulkAdd([
      { ...base, id: 'seed-intl-black-friday', provenance: 'seed', userModified: false },
      { ...base, id: 'seed-mx-buen-fin-2026', provenance: 'seed', userModified: false },
      { ...base, id: 'otro', category: 'cultura' },
    ]);
    await old.table('categories').bulkAdd([{ id: 'comerciales', order: 5 }, { id: 'cultura', order: 2 }]);
    old.close();

    const upgraded = new CalendarDB(name);
    await upgraded.open();
    expect((await upgraded.events.toArray()).map((e) => e.id)).toEqual(['otro']);
    expect(await upgraded.categories.get('comerciales')).toBeUndefined();
    upgraded.close();
  });

  it('si usaste la categoría para algo tuyo, la conserva', async () => {
    const name = `qs-calendar-v5b-${Math.random().toString(36).slice(2)}`;
    const old = new Dexie(name);
    old.version(5).stores({
      events: 'id, startDate, category, country, relevance, verification, provenance, updatedAt',
      greetings: 'id, eventId, status, plannedDate, updatedAt',
      categories: 'id, order', countries: 'id, order', settings: 'key', meta: 'key', reviewedAlerts: 'key',
      people: 'id, country, name', vacations: 'id, personId, start, end',
    });
    await old.open();
    await old.table('events').add({ ...makeEvent({ category: 'comerciales' }), id: 'mio', provenance: 'usuario' });
    await old.table('categories').add({ id: 'comerciales', order: 5 });
    old.close();
    const upgraded = new CalendarDB(name);
    await upgraded.open();
    expect(await upgraded.events.get('mio')).toBeTruthy();
    expect(await upgraded.categories.get('comerciales')).toBeTruthy();
    upgraded.close();
  });
});
