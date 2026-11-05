import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui/Toast';
import { resetDatabaseForTests } from '../../db/db';
import { createGreeting } from '../../db/greetings';
import { initDatabase } from '../../db/repo';
import { SEED_EVENTS, SEED_VERSION } from '../../data/seed';
import { EventEditorProvider } from '../events/EventEditor';
import { DashboardPage } from './DashboardPage';

beforeEach(async () => {
  await resetDatabaseForTests();
  await initDatabase(SEED_EVENTS, SEED_VERSION);
});

describe('Inicio', () => {
  it('se renderiza con el catálogo, saludos y sin equipo cargado', async () => {
    await createGreeting({ eventId: 'seed-ar-mate', internalTitle: 'Mate 2026' });
    const router = createMemoryRouter([{ path: '/', element: <ToastProvider><EventEditorProvider><DashboardPage /></EventEditorProvider></ToastProvider> }]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Qué tengo que preparar')).toBeInTheDocument();
    expect(await screen.findByText('El equipo hoy')).toBeInTheDocument();
    expect(await screen.findByText('Todavía no cargaste el equipo')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
  });
});

describe('Copiar semana para Slack', () => {
  it('copia el resumen con los feriados de la semana', async () => {
    const { importTeam } = await import('../../db/team');
    await importTeam({ app: 'qs-calendar-equipo', version: 1, people: [{ name: 'Fran Prueba', country: 'mx', roles: [{ area: 'Desarrollo', title: 'Dev' }], active: true }] }, 'reemplazar');
    const { default: userEvent } = await import('@testing-library/user-event');
    // Fecha fija: lunes 16/11/2026, descanso por la Revolución Mexicana.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 12));
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const router = createMemoryRouter([{ path: '/', element: <ToastProvider><EventEditorProvider><DashboardPage /></EventEditorProvider></ToastProvider> }]);
    render(<RouterProvider router={router} />);
    await screen.findByText('El equipo hoy');
    await user.click(screen.getByRole('button', { name: 'Copiar semana para Slack' }));
    const text = writeText.mock.calls[0]?.[0] as string;
    expect(text).toContain('Semana del');
    expect(text).toContain('Semana del 16/11 al 22/11');
    expect(text).toContain('México (Revolución Mexicana): Fran Prueba');
    vi.useRealTimers();
  });
});
