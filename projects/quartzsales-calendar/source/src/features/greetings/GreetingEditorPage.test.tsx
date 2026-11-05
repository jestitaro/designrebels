import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui/Toast';
import { resetDatabaseForTests } from '../../db/db';
import { createGreeting, getGreeting, setGreetingStatus } from '../../db/greetings';
import { initDatabase } from '../../db/repo';
import { GreetingEditorPage } from './GreetingEditorPage';

let id = '';

beforeEach(async () => {
  await resetDatabaseForTests();
  await initDatabase();
  id = (await createGreeting({ eventId: 'e1', internalTitle: 'Tradición 2026', body: 'Hola' })).id;
});

function setup() {
  const router = createMemoryRouter([{ path: '/saludos/:id', element: <ToastProvider><GreetingEditorPage /></ToastProvider> }], {
    initialEntries: [`/saludos/${id}`],
  });
  return render(<RouterProvider router={router} />);
}

describe('editor de saludos', () => {
  it('guarda automáticamente y muestra "Guardado"', async () => {
    const user = userEvent.setup();
    setup();
    const body = await screen.findByLabelText('Texto del saludo');
    await user.type(body, ' *equipo*');
    await waitFor(async () => expect((await getGreeting(id))?.body).toBe('Hola *equipo*'), { timeout: 2000 });
    expect(await screen.findByText('Guardado')).toBeInTheDocument();
    expect(screen.getAllByText('equipo', { selector: 'strong' }).length).toBeGreaterThan(0);
  });

  it('copiar el mensaje no cambia el estado a compartido', async () => {
    await setGreetingStatus(id, 'listo');
    const user = userEvent.setup();
    // user-event instala su propio portapapeles: el mock va después del setup.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setup();
    await user.click(await screen.findByRole('button', { name: 'Copiar mensaje' }));
    expect(writeText).toHaveBeenCalledWith('Hola');
    expect(await screen.findByText(/Mensaje copiado/)).toBeInTheDocument();
    expect((await getGreeting(id))?.status).toBe('listo');
  });

  it('marcar como compartido es una acción explícita', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole('button', { name: 'Compartido' }));
    await waitFor(async () => expect((await getGreeting(id))?.status).toBe('compartido'));
  });

});
