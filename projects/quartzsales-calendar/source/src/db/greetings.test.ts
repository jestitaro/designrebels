import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../lib/clipboard';
import { resetDatabaseForTests } from './db';
import {
  createGreeting, deleteGreeting, duplicateGreeting, getGreeting, restoreGreetingVersion, saveGreeting,
  saveGreetingVersion, setGreetingStatus,
} from './greetings';

beforeEach(async () => {
  await resetDatabaseForTests();
});

describe('saludos', () => {
  it('se crean sin redactar y pasan a borrador al escribir', async () => {
    const g = await createGreeting({ eventId: 'e1', internalTitle: 'Tradición 2026' });
    expect(g.status).toBe('sin redactar');
    const saved = await saveGreeting(g.id, { body: '¡Feliz Día de la Tradición! 🧉' });
    expect(saved.status).toBe('borrador');
    expect((await getGreeting(g.id))?.body).toBe('¡Feliz Día de la Tradición! 🧉');
  });

  it('el guardado automático no crea versiones', async () => {
    const g = await createGreeting({ eventId: 'e1', internalTitle: 'x' });
    await saveGreeting(g.id, { body: 'a' });
    await saveGreeting(g.id, { body: 'ab' });
    expect((await getGreeting(g.id))?.versions).toHaveLength(0);
  });

  it('cambiar de estado guarda un snapshot', async () => {
    const g = await createGreeting({ eventId: 'e1', internalTitle: 'x', body: 'Hola equipo' });
    const listo = await setGreetingStatus(g.id, 'listo');
    expect(listo.status).toBe('listo');
    expect(listo.versions[0]).toMatchObject({ body: 'Hola equipo', status: 'listo', reason: 'cambio de estado' });
  });

  it('guarda versiones manuales sin duplicar y restaura', async () => {
    const g = await createGreeting({ eventId: 'e1', internalTitle: 'x', body: 'v1' });
    await saveGreetingVersion(g.id);
    await saveGreetingVersion(g.id);
    let current = await getGreeting(g.id);
    expect(current?.versions).toHaveLength(1);
    const v1 = current!.versions[0]!;
    await saveGreeting(g.id, { body: 'v2' });
    const restored = await restoreGreetingVersion(g.id, v1.id);
    expect(restored.body).toBe('v1');
    expect(restored.versions[0]).toMatchObject({ body: 'v2', reason: 'restauración' });
    current = await getGreeting(g.id);
    expect(current?.versions).toHaveLength(2);
  });

  it('duplica sin historial y elimina', async () => {
    const g = await createGreeting({ eventId: 'e1', internalTitle: 'Original', body: 'texto' });
    await setGreetingStatus(g.id, 'compartido');
    const copy = await duplicateGreeting(g.id);
    expect(copy).toMatchObject({ internalTitle: 'Original (copia)', status: 'borrador', versions: [], body: 'texto' });
    await deleteGreeting(g.id);
    expect(await getGreeting(g.id)).toBeUndefined();
  });

  it('copiar el mensaje no lo marca como compartido', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const g = await createGreeting({ eventId: 'e1', internalTitle: 'x', body: '*Hola* equipo' });
    await setGreetingStatus(g.id, 'listo');
    expect(await copyText('*Hola* equipo')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('*Hola* equipo');
    expect((await getGreeting(g.id))?.status).toBe('listo');
  });

  it('si la API de portapapeles falla, usa el fallback', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, configurable: true });
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true });
    expect(await copyText('hola')).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    exec.mockReturnValue(false);
    expect(await copyText('hola')).toBe(false);
  });
});
