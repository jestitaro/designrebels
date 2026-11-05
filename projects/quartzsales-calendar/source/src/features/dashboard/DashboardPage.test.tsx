import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
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
