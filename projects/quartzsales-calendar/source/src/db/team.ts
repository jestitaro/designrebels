import { newId, nowStamp } from '../lib/id';
import type { Person, Vacation } from '../types';
import { db } from './db';

export type PersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

export async function createPerson(input: PersonInput): Promise<Person> {
  const stamp = nowStamp();
  const person: Person = { ...input, id: newId('per'), createdAt: stamp, updatedAt: stamp };
  await db.people.add(person);
  return person;
}

export async function updatePerson(id: string, changes: Partial<PersonInput>): Promise<void> {
  const current = await db.people.get(id);
  if (!current) throw new Error('La persona no existe.');
  await db.people.put({ ...current, ...changes, id, updatedAt: nowStamp() });
}

/** Borra a la persona y sus vacaciones. */
export async function deletePerson(id: string): Promise<void> {
  await db.transaction('rw', [db.people, db.vacations], async () => {
    await db.vacations.where('personId').equals(id).delete();
    await db.people.delete(id);
  });
}

export async function addVacation(input: Omit<Vacation, 'id'>): Promise<Vacation> {
  const vacation: Vacation = { ...input, id: newId('vac') };
  await db.vacations.add(vacation);
  return vacation;
}

export async function deleteVacation(id: string): Promise<void> {
  await db.vacations.delete(id);
}

export interface TeamFile {
  app: 'qs-calendar-equipo';
  version: 1;
  people: Array<Omit<Person, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }>;
  vacations?: Array<Omit<Vacation, 'id' | 'personId'> & { person: string }>;
}

export type TeamParse = { ok: true; file: TeamFile } | { ok: false; error: string };

export function parseTeamFile(text: string): TeamParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  const f = raw as Partial<TeamFile>;
  if (f?.app !== 'qs-calendar-equipo' || !Array.isArray(f.people)) return { ok: false, error: 'El archivo no es un equipo de QuartzSales Calendar.' };
  for (const p of f.people) {
    if (!p || typeof p.name !== 'string' || !p.name.trim() || typeof p.country !== 'string' || !Array.isArray(p.roles)) {
      return { ok: false, error: 'Hay una persona sin nombre, país o puestos.' };
    }
  }
  return { ok: true, file: f as TeamFile };
}

/**
 * Importa un equipo. "reemplazar" borra el equipo actual (y sus vacaciones);
 * "combinar" actualiza por nombre y agrega a quienes no estén.
 */
export async function importTeam(file: TeamFile, mode: 'reemplazar' | 'combinar'): Promise<{ added: number; updated: number }> {
  const result = { added: 0, updated: 0 };
  await db.transaction('rw', [db.people, db.vacations], async () => {
    if (mode === 'reemplazar') {
      await db.people.clear();
      await db.vacations.clear();
    }
    const byName = new Map((await db.people.toArray()).map((p) => [p.name.trim().toLowerCase(), p]));
    const stamp = nowStamp();
    for (const p of file.people) {
      const existing = byName.get(p.name.trim().toLowerCase());
      const data = { name: p.name.trim(), initials: p.initials?.trim() || undefined, roles: p.roles, country: p.country, region: p.region, city: p.city, active: p.active ?? true };
      if (existing) {
        await db.people.put({ ...existing, ...data, updatedAt: stamp });
        result.updated++;
      } else {
        const person: Person = { ...data, id: newId('per'), createdAt: stamp, updatedAt: stamp };
        await db.people.add(person);
        byName.set(person.name.toLowerCase(), person);
        result.added++;
      }
    }
    for (const v of file.vacations ?? []) {
      const person = byName.get(v.person.trim().toLowerCase());
      if (person) await db.vacations.add({ id: newId('vac'), personId: person.id, start: v.start, end: v.end, note: v.note });
    }
  });
  return result;
}

export async function exportTeam(): Promise<TeamFile> {
  const [people, vacations] = await Promise.all([db.people.toArray(), db.vacations.toArray()]);
  const nameById = new Map(people.map((p) => [p.id, p.name]));
  return {
    app: 'qs-calendar-equipo',
    version: 1,
    people: people.map(({ id: _i, createdAt: _c, updatedAt: _u, ...rest }) => rest),
    vacations: vacations.filter((v) => nameById.has(v.personId)).map((v) => ({ person: nameById.get(v.personId)!, start: v.start, end: v.end, note: v.note })),
  };
}
