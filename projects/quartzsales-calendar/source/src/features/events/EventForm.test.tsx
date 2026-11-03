import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToastProvider } from '../../components/ui/Toast';
import { resetDatabaseForTests } from '../../db/db';
import { initDatabase, listEvents } from '../../db/repo';
import { draftToContent, emptyDraft, draftFromEvent } from './eventDraft';
import { EventEditorProvider, useEventEditor } from './EventEditor';
import { makeEvent } from '../../test/factories';

function Opener() {
  const editor = useEventEditor();
  return <button onClick={() => editor.openCreate({ date: '2026-11-10' })}>abrir</button>;
}

function setup() {
  const router = createMemoryRouter([
    { path: '/', element: <ToastProvider><EventEditorProvider><Opener /></EventEditorProvider></ToastProvider> },
  ]);
  return render(<RouterProvider router={router} />);
}

beforeEach(async () => {
  await resetDatabaseForTests();
  await initDatabase();
});

describe('formulario de evento', () => {
  it('valida inline y no guarda si faltan datos obligatorios', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('abrir'));
    await user.click(await screen.findByRole('button', { name: 'Crear evento' }));
    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('Elegí una categoría.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre/)).toHaveAttribute('aria-invalid', 'true');
    expect(await listEvents()).toHaveLength(0);
  });

  it('crea un evento con la fecha precargada', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('abrir'));
    await user.type(await screen.findByLabelText(/^Nombre/), 'Día de la Tradición');
    await user.selectOptions(screen.getByLabelText(/^Categoría/), 'cultura');
    await user.selectOptions(screen.getByLabelText(/^País/), 'ar');
    await user.click(screen.getByRole('button', { name: 'Crear evento' }));
    await waitFor(async () => expect(await listEvents()).toHaveLength(1));
    const [saved] = await listEvents();
    expect(saved).toMatchObject({ title: 'Día de la Tradición', startDate: '2026-11-10', recurrence: { type: 'yearly-fixed' }, dateType: 'fija', country: 'ar' });
  });

  it('pide fuente para marcar como confirmado', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('abrir'));
    await user.type(await screen.findByLabelText(/^Nombre/), 'X');
    await user.selectOptions(screen.getByLabelText(/^Categoría/), 'cultura');
    await user.selectOptions(screen.getByLabelText(/^País/), 'ar');
    await user.selectOptions(screen.getByLabelText('Verificación'), 'confirmado');
    await user.click(screen.getByRole('button', { name: 'Crear evento' }));
    expect(await screen.findByText('Para marcarlo como confirmado, indicá la fuente.')).toBeInTheDocument();
  });

  it('Esc cierra el formulario sin cambios', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('abrir'));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('conversión borrador ↔ evento', () => {
  it('una regla calcula la fecha del año de referencia y conserva la duración', () => {
    const d = { ...emptyDraft('2026-11-01'), title: 'BF', category: 'comerciales', country: 'intl', dateMode: 'yearly-nth-weekday' as const, ruleMonth: '11', ruleNth: '4', ruleWeekday: '3', ruleOffset: '1', ruleDuration: '4' };
    const c = draftToContent(d, 2026);
    expect(c.startDate).toBe('2026-11-27');
    expect(c.endDate).toBe('2026-11-30');
    expect(c.dateType).toBe('variable');
  });

  it('ida y vuelta sin pérdida', () => {
    const e = makeEvent({ endDate: '2026-11-12', holidayObservances: [{ year: 2026, date: '2026-11-09', note: 'Trasladado' }], contentIdeas: ['a', 'b'], sourceUrl: 'https://x.org' });
    const back = draftToContent(draftFromEvent(e), 2026);
    expect(back).toMatchObject({ startDate: e.startDate, endDate: e.endDate, holidayObservances: e.holidayObservances, contentIdeas: e.contentIdeas, sourceUrl: e.sourceUrl });
  });
});
