import { newId, nowStamp } from '../lib/id';
import type { Greeting, GreetingStatus, ISODate } from '../types';
import { db } from './db';

export interface NewGreetingInput {
  eventId: string;
  internalTitle: string;
  plannedDate?: ISODate;
  body?: string;
}

export async function createGreeting(input: NewGreetingInput): Promise<Greeting> {
  const stamp = nowStamp();
  const greeting: Greeting = {
    id: newId('sal'),
    eventId: input.eventId,
    internalTitle: input.internalTitle,
    body: input.body ?? '',
    plannedDate: input.plannedDate,
    status: 'pendiente',
    createdAt: stamp,
    updatedAt: stamp,
  };
  await db.greetings.add(greeting);
  return greeting;
}

export async function getGreeting(id: string) {
  return db.greetings.get(id);
}

/** Guardado automático del texto y el link de imagen. */
export async function saveGreeting(id: string, changes: Partial<Pick<Greeting, 'body' | 'imageUrl'>>): Promise<Greeting> {
  return db.transaction('rw', db.greetings, async () => {
    const current = await db.greetings.get(id);
    if (!current) throw new Error('El saludo no existe.');
    const next: Greeting = { ...current, ...changes, updatedAt: nowStamp() };
    await db.greetings.put(next);
    return next;
  });
}

export async function setGreetingStatus(id: string, status: GreetingStatus): Promise<Greeting> {
  const current = await db.greetings.get(id);
  if (!current) throw new Error('El saludo no existe.');
  const next: Greeting = { ...current, status, updatedAt: nowStamp() };
  await db.greetings.put(next);
  return next;
}

export async function deleteGreeting(id: string): Promise<void> {
  await db.greetings.delete(id);
}
