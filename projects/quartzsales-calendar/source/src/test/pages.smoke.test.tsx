import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToastProvider } from '../components/ui/Toast';
import { resetDatabaseForTests } from '../db/db';
import { createGreeting } from '../db/greetings';
import { initDatabase } from '../db/repo';
import { importTeam } from '../db/team';
import { SEED_EVENTS, SEED_VERSION } from '../data/seed';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { EventEditorProvider } from '../features/events/EventEditor';
import { GreetingsPage } from '../features/greetings/GreetingsPage';
import { LibraryPage } from '../features/library/LibraryPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { UpcomingPage } from '../features/upcoming/UpcomingPage';
import { EventPage } from '../pages/EventPage';

beforeEach(async () => {
  await resetDatabaseForTests();
  await initDatabase(SEED_EVENTS, SEED_VERSION);
  await createGreeting({ eventId: 'seed-ar-mate', internalTitle: 'Mate 2026', plannedDate: '2026-11-30' });
  await importTeam({ app: 'qs-calendar-equipo', version: 1, people: [{ name: 'Ana Prueba', country: 'ar', region: 'ar-cba', roles: [{ area: 'Producto y Diseño', title: 'Diseño' }], active: true }] }, 'reemplazar');
});

function renderAt(path: string, element: React.ReactNode, route = path) {
  const router = createMemoryRouter([{ path: route, element: <ToastProvider><EventEditorProvider>{element}</EventEditorProvider></ToastProvider> }], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('todas las pantallas se renderizan con datos reales', () => {
  it('Calendario', async () => {
    renderAt('/', <CalendarPage />);
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    expect(await screen.findByText('El equipo ese día')).toBeInTheDocument();
  });
  it('Próximos', async () => {
    renderAt('/', <UpcomingPage />);
    expect(await screen.findByText('Próximos eventos')).toBeInTheDocument();
  });
  it('Saludos', async () => {
    renderAt('/', <GreetingsPage />);
    expect(await screen.findByText(/Día Nacional del Mate/)).toBeInTheDocument();
  });
  it('Biblioteca', async () => {
    renderAt('/', <LibraryPage />);
    expect(await screen.findByText('Biblioteca de eventos')).toBeInTheDocument();
  });
  it('Configuración con el equipo', async () => {
    renderAt('/', <SettingsPage />);
    expect(await screen.findByText('Ana Prueba')).toBeInTheDocument();
  });
  it('Detalle de un feriado', async () => {
    renderAt('/eventos/seed-ar-navidad', <EventPage />, '/eventos/:id');
    expect(await screen.findByText('Navidad (Argentina)')).toBeInTheDocument();
    expect(screen.getByText('Feriado')).toBeInTheDocument();
  });
});
