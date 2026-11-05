import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../lib/clipboard';
import { resetDatabaseForTests, simplifyGreeting } from './db';
import { createGreeting, deleteGreeting, getGreeting, saveGreeting, setGreetingStatus } from './greetings';

beforeEach(async () => {
  await resetDatabaseForTests();
});

describe('saludos', () => {
  it('se crean pendientes y guardan texto e imagen', async () => {
    const g = await createGreeting({ eventId: 'e1', internalTitle: 'Tradición 2026' });
    expect(g.status).toBe('pendiente');
    await saveGreeting(g.id, { body: '¡Feliz Día de la Tradición! 🧉', imageUrl: 'https://drive.example/img' });
    expect(await getGreeting(g.id)).toMatchObject({ body: '¡Feliz Día de la Tradición! 🧉', imageUrl: 'https://drive.example/img', status: 'pendiente' });
  });

  it('cambia de estado y se elimina', async () => {
    const g = await createGreeting({ eventId: 'e1', internalTitle: 'x', body: 'Hola' });
    expect((await setGreetingStatus(g.id, 'listo')).status).toBe('listo');
    await deleteGreeting(g.id);
    expect(await getGreeting(g.id)).toBeUndefined();
  });

  it('convierte saludos de la versión anterior', () => {
    const old = { id: 'g', eventId: 'e', internalTitle: 't', body: 'b', tone: 'cercano', channel: 'Slack', privateNotes: 'x', versions: [], status: 'sin redactar', createdAt: 'c', updatedAt: 'u' };
    expect(simplifyGreeting(old)).toEqual({ id: 'g', eventId: 'e', internalTitle: 't', body: 'b', imageUrl: undefined, plannedDate: undefined, status: 'pendiente', createdAt: 'c', updatedAt: 'u' });
    expect(simplifyGreeting({ ...old, status: 'compartido' }).status).toBe('compartido');
    expect(simplifyGreeting({ ...old, status: 'descartado' }).status).toBe('pendiente');
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
