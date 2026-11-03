import { newId, nowStamp } from '../lib/id';
import type { Greeting, GreetingStatus, GreetingVersion, ISODate, Tone } from '../types';
import { db } from './db';

const MAX_VERSIONS = 50;

export interface NewGreetingInput {
  eventId: string;
  internalTitle: string;
  plannedDate?: ISODate;
  tone?: Tone;
  channel?: string;
  body?: string;
}

export async function createGreeting(input: NewGreetingInput): Promise<Greeting> {
  const stamp = nowStamp();
  const greeting: Greeting = {
    id: newId('sal'),
    eventId: input.eventId,
    internalTitle: input.internalTitle,
    body: input.body ?? '',
    tone: input.tone ?? 'cercano',
    channel: input.channel ?? '',
    plannedDate: input.plannedDate,
    status: input.body?.trim() ? 'borrador' : 'sin redactar',
    privateNotes: '',
    versions: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
  await db.greetings.add(greeting);
  return greeting;
}

export async function getGreeting(id: string) {
  return db.greetings.get(id);
}

/** Guardado automático de campos editables (no cambia estado ni versiones). */
export async function saveGreeting(
  id: string,
  changes: Partial<Pick<Greeting, 'internalTitle' | 'body' | 'tone' | 'channel' | 'plannedDate' | 'privateNotes'>>,
): Promise<Greeting> {
  return db.transaction('rw', db.greetings, async () => {
    const current = await db.greetings.get(id);
    if (!current) throw new Error('El saludo no existe.');
    const next: Greeting = { ...current, ...changes, updatedAt: nowStamp() };
    // Al empezar a escribir, "Sin redactar" pasa a "Borrador".
    if (current.status === 'sin redactar' && changes.body?.trim()) next.status = 'borrador';
    await db.greetings.put(next);
    return next;
  });
}

function snapshot(g: Greeting, reason: GreetingVersion['reason']): GreetingVersion {
  return { id: newId('ver'), body: g.body, status: g.status, savedAt: nowStamp(), reason };
}

function pushVersion(g: Greeting, version: GreetingVersion): GreetingVersion[] {
  const last = g.versions[0];
  // No duplica un snapshot idéntico al último.
  if (last && last.body === version.body && last.status === version.status) return g.versions;
  return [version, ...g.versions].slice(0, MAX_VERSIONS);
}

/** Cambia el estado y guarda un snapshot del texto. */
export async function setGreetingStatus(id: string, status: GreetingStatus): Promise<Greeting> {
  return db.transaction('rw', db.greetings, async () => {
    const current = await db.greetings.get(id);
    if (!current) throw new Error('El saludo no existe.');
    if (current.status === status) return current;
    const updated: Greeting = { ...current, status, updatedAt: nowStamp() };
    updated.versions = pushVersion(current, snapshot(updated, 'cambio de estado'));
    await db.greetings.put(updated);
    return updated;
  });
}

/** Snapshot manual del texto actual. */
export async function saveGreetingVersion(id: string): Promise<Greeting> {
  return db.transaction('rw', db.greetings, async () => {
    const current = await db.greetings.get(id);
    if (!current) throw new Error('El saludo no existe.');
    const updated = { ...current, versions: pushVersion(current, snapshot(current, 'manual')), updatedAt: nowStamp() };
    await db.greetings.put(updated);
    return updated;
  });
}

/** Restaura el texto de una versión. Antes guarda el texto actual para poder volver. */
export async function restoreGreetingVersion(id: string, versionId: string): Promise<Greeting> {
  return db.transaction('rw', db.greetings, async () => {
    const current = await db.greetings.get(id);
    if (!current) throw new Error('El saludo no existe.');
    const version = current.versions.find((v) => v.id === versionId);
    if (!version) throw new Error('La versión no existe.');
    const versions = pushVersion(current, snapshot(current, 'restauración'));
    const updated: Greeting = { ...current, body: version.body, versions, updatedAt: nowStamp() };
    await db.greetings.put(updated);
    return updated;
  });
}

export async function duplicateGreeting(id: string): Promise<Greeting> {
  const current = await db.greetings.get(id);
  if (!current) throw new Error('El saludo no existe.');
  const stamp = nowStamp();
  const copy: Greeting = {
    ...current,
    id: newId('sal'),
    internalTitle: `${current.internalTitle} (copia)`,
    status: current.body.trim() ? 'borrador' : 'sin redactar',
    versions: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
  await db.greetings.add(copy);
  return copy;
}

export async function deleteGreeting(id: string): Promise<void> {
  await db.greetings.delete(id);
}
