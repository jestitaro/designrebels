import { beforeEach, describe, expect, it } from 'vitest';
import { db, resetDatabaseForTests } from '../db/db';
import { deletePerson, exportTeam, importTeam, parseTeamFile } from '../db/team';
import { makeEvent } from '../test/factories';
import type { Person, Vacation } from '../types';
import { initials, isForPerson, teamForDay, weekSlackSummary } from './team';

const person = (id: string, name: string, country: string, areas: string[], extra: Partial<Person> = {}): Person => ({
  id, name, country, roles: areas.map((area) => ({ area, title: 'x' })), active: true, createdAt: '', updatedAt: '', ...extra,
});

const ana = person('ana', 'Ana', 'ar', ['Producto y Diseño'], { region: 'ar-cba' });
const beto = person('beto', 'Beto', 'ar', ['Desarrollo'], { region: 'ar-ba' });
const carla = person('carla', 'Carla', 'mx', ['Desarrollo']);
const dani = person('dani', 'Dani', 'es', ['Dirección']);
const ex = person('ex', 'Ex', 'ar', ['Desarrollo'], { active: false });
const people = [ana, beto, carla, dani, ex];

describe('a quién saludar', () => {
  it('por país; internacional es para todos; inactivos nunca', () => {
    const mate = makeEvent({ country: 'ar' });
    expect(people.filter((p) => isForPerson(mate, p)).map((p) => p.id)).toEqual(['ana', 'beto']);
    const intl = makeEvent({ country: 'intl' });
    expect(people.filter((p) => isForPerson(intl, p)).map((p) => p.id)).toEqual(['ana', 'beto', 'carla', 'dani']);
  });

  it('por área cuando el evento la indica', () => {
    const ux = makeEvent({ country: 'intl', areas: ['Producto y Diseño'] });
    expect(people.filter((p) => isForPerson(ux, p)).map((p) => p.id)).toEqual(['ana']);
    const devAr = makeEvent({ country: 'ar', areas: ['Desarrollo'] });
    expect(people.filter((p) => isForPerson(devAr, p)).map((p) => p.id)).toEqual(['beto']);
  });

  it('por región cuando el evento es regional', () => {
    const cba = makeEvent({ country: 'ar', region: 'ar-cba' });
    expect(people.filter((p) => isForPerson(cba, p)).map((p) => p.id)).toEqual(['ana']);
  });
});

describe('el día del equipo', () => {
  const tradicion = makeEvent({ id: 'trad', title: 'Tradición', country: 'ar', startDate: '2026-11-10' });
  const soberania = makeEvent({ id: 'sob', title: 'Soberanía', country: 'ar', startDate: '2026-11-20', isHoliday: true, holidayObservances: [{ year: 2026, date: '2026-11-23' }] });
  const revolucion = makeEvent({ id: 'rev', country: 'mx', startDate: '2026-11-20', isHoliday: true, holidayObservances: [{ year: 2026, date: '2026-11-16' }] });
  const navidadEs = makeEvent({ id: 'nav', country: 'es', startDate: '2026-12-25', isHoliday: true });
  const events = [tradicion, soberania, revolucion, navidadEs];
  const vacations: Vacation[] = [{ id: 'v', personId: 'carla', start: '2026-11-09', end: '2026-11-13' }];

  it('lista a quién saludar ese día', () => {
    const day = teamForDay('2026-11-10', events, people, vacations);
    expect(day.greet.map((g) => [g.occurrence.event.id, g.people.map((p) => p.id)])).toEqual([['trad', ['ana', 'beto']]]);
  });

  it('el feriado cuenta el día trasladado, no la fecha de la celebración', () => {
    expect(teamForDay('2026-11-20', events, people, []).holiday).toEqual([]);
    expect(teamForDay('2026-11-23', events, people, []).holiday.map((h) => h.people.map((p) => p.id))).toEqual([['ana', 'beto']]);
    expect(teamForDay('2026-11-16', events, people, []).holiday.map((h) => h.people.map((p) => p.id))).toEqual([['carla']]);
    expect(teamForDay('2026-12-25', events, people, []).holiday.map((h) => h.people.map((p) => p.id))).toEqual([['dani']]);
  });

  it('muestra quién está de vacaciones', () => {
    expect(teamForDay('2026-11-12', events, people, vacations).vacation.map((v) => v.person.id)).toEqual(['carla']);
    expect(teamForDay('2026-11-14', events, people, vacations).vacation).toEqual([]);
  });

  it('arma iniciales', () => {
    expect(initials('Ana María López')).toBe('AM');
    expect(initials('Ciro')).toBe('C');
  });
});

describe('importar y exportar el equipo', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  const file = {
    app: 'qs-calendar-equipo',
    version: 1,
    people: [
      { name: 'Ana', country: 'ar', region: 'ar-cba', city: 'Córdoba', roles: [{ area: 'Producto y Diseño', title: 'Design Rebel' }], active: true },
      { name: 'Beto', country: 'mx', roles: [{ area: 'Desarrollo', title: 'Dev' }], active: true },
    ],
    vacations: [{ person: 'Beto', start: '2026-12-01', end: '2026-12-10' }],
  };

  it('valida el archivo', () => {
    expect(parseTeamFile('x')).toEqual({ ok: false, error: 'El archivo no es un JSON válido.' });
    expect(parseTeamFile('{"app":"otra"}').ok).toBe(false);
    expect(parseTeamFile(JSON.stringify({ ...file, people: [{ name: '', country: 'ar', roles: [] }] })).ok).toBe(false);
    expect(parseTeamFile(JSON.stringify(file)).ok).toBe(true);
  });

  it('importa, combina por nombre y exporta sin pérdida', async () => {
    const parsed = parseTeamFile(JSON.stringify(file));
    if (!parsed.ok) throw new Error();
    expect(await importTeam(parsed.file, 'reemplazar')).toEqual({ added: 2, updated: 0 });
    expect(await db.vacations.count()).toBe(1);
    expect(await importTeam({ ...parsed.file, vacations: [], people: [{ ...file.people[0]!, city: 'Villa Carlos Paz' }] }, 'combinar')).toEqual({ added: 0, updated: 1 });
    expect((await db.people.toArray()).find((p) => p.name === 'Ana')?.city).toBe('Villa Carlos Paz');
    const out = await exportTeam();
    expect(out.people).toHaveLength(2);
    expect(out.vacations).toEqual([{ person: 'Beto', start: '2026-12-01', end: '2026-12-10', note: undefined }]);
  });

  it('borrar una persona borra sus vacaciones', async () => {
    const parsed = parseTeamFile(JSON.stringify(file));
    if (!parsed.ok) throw new Error();
    await importTeam(parsed.file, 'reemplazar');
    const beto = (await db.people.toArray()).find((p) => p.name === 'Beto')!;
    await deletePerson(beto.id);
    expect(await db.vacations.count()).toBe(0);
  });
});

describe('resumen semanal para Slack', () => {
  const soberania = makeEvent({ id: 'sob', title: 'Día de la Soberanía Nacional', country: 'ar', startDate: '2026-11-20', isHoliday: true, holidayObservances: [{ year: 2026, date: '2026-11-23' }] });
  const revolucion = makeEvent({ id: 'rev', title: 'Revolución Mexicana (descanso)', country: 'mx', startDate: '2026-11-16', recurrence: { type: 'yearly-nth-weekday', month: 11, weekday: 0, nth: 3, offsetDays: 0 }, isHoliday: true });
  const names = (id: string) => ({ ar: 'Argentina', mx: 'México', es: 'España' })[id] ?? id;

  it('arma feriados por día y vacaciones de la semana', () => {
    const vac: Vacation[] = [
      { id: 'v1', personId: 'dani', start: '2026-11-10', end: '2026-11-18' },
      { id: 'v2', personId: 'ana', start: '2026-11-30', end: '2026-12-04' },
    ];
    expect(weekSlackSummary('2026-11-19', [soberania, revolucion], people, vac, names)).toBe(
      [
        '🗓️ *Semana del 16/11 al 22/11 en QuartzSales*',
        '',
        '🌴 *De feriado*',
        '• lunes 16/11 · México (Revolución Mexicana): Carla',
        '',
        '✈️ *De vacaciones*',
        '• Dani: del 10/11 al 18/11',
      ].join('\n'),
    );
    expect(weekSlackSummary('2026-11-23', [soberania], people, [], names)).toContain('• lunes 23/11 · Argentina (Día de la Soberanía Nacional): Ana, Beto');
  });

  it('avisa cuando trabaja todo el equipo', () => {
    expect(weekSlackSummary('2026-11-04', [soberania], people, [], names)).toContain('trabaja todo el equipo');
  });
});

describe('feriados regionales y locales', () => {
  const pablo = person('pablo', 'Pablo', 'es', ['Dirección'], { region: 'es-md', city: 'Madrid' });
  const agus = person('agus', 'Agus', 'es', ['Sales'], { region: 'es-ct', city: 'Barcelona' });
  const cordoba = person('cba', 'Cordobesa', 'ar', ['BI'], { region: 'ar-cba', city: 'Córdoba' });
  const porteno = person('caba', 'Porteño', 'ar', ['BI'], { region: 'ar-caba', city: 'CABA' });
  const team = [pablo, agus, cordoba, porteno];
  const cityName = (id: string) => ({ 'es-md-madrid': 'Madrid', 'es-ct-barcelona': 'Barcelona' })[id];
  const almudena = makeEvent({ id: 'alm', country: 'es', region: 'es-md', city: 'es-md-madrid', startDate: '2026-11-09', isHoliday: true });
  const diada = makeEvent({ id: 'dia', country: 'es', region: 'es-ct', startDate: '2026-09-11', isHoliday: true });
  const papa = makeEvent({ id: 'papa', country: 'ar', startDate: '2026-11-09', recurrence: { type: 'none' }, isHoliday: true });
  const papaCba = makeEvent({ id: 'papa-cba', country: 'ar', region: 'ar-cba', startDate: '2026-11-10', recurrence: { type: 'none' }, isHoliday: true });

  it('un feriado de ciudad es solo para quien vive en esa ciudad', () => {
    const day = teamForDay('2026-11-09', [almudena, papa], team, [], cityName);
    expect(day.holiday.map((h) => [h.event.id, h.people.map((p) => p.id)])).toEqual([['alm', ['pablo']], ['papa', ['cba', 'caba']]]);
  });

  it('un feriado regional es para la región', () => {
    expect(teamForDay('2026-09-11', [diada], team, [], cityName).holiday[0]?.people.map((p) => p.id)).toEqual(['agus']);
    expect(teamForDay('2026-11-10', [papaCba], team, [], cityName).holiday[0]?.people.map((p) => p.id)).toEqual(['cba']);
  });
});

describe('feriados puros', () => {
  it('no aparecen en "a quién saludar", solo en "de feriado"', () => {
    const papa = makeEvent({ id: 'p', country: 'ar', category: 'feriados', startDate: '2026-11-09', recurrence: { type: 'none' }, isHoliday: true });
    const day = teamForDay('2026-11-09', [papa], people, []);
    expect(day.greet).toEqual([]);
    expect(day.holiday[0]?.people.map((p) => p.id)).toEqual(['ana', 'beto']);
  });
});
