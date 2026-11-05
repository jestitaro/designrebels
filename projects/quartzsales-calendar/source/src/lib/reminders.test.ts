import { describe, expect, it } from 'vitest';
import { makeEvent } from '../test/factories';
import type { Greeting } from '../types';
import { greetingsByEvent } from './filters';
import { computeAlerts, upcoming } from './reminders';

const g = (eventId: string, status: Greeting['status']): Greeting => ({
  id: `g-${eventId}-${status}`, eventId, internalTitle: '', body: '', status, createdAt: '', updatedAt: '',
});

const today = '2026-11-03';
const tradicion = makeEvent({ id: 'trad', startDate: '2026-11-10', relevance: 'alta' });
const mate = makeEvent({ id: 'mate', startDate: '2026-11-05', relevance: 'alta' });
const baja = makeEvent({ id: 'baja', startDate: '2026-11-04', relevance: 'media' });
const archivado = makeEvent({ id: 'arch', startDate: '2026-11-04', relevance: 'alta', archived: true });
const all = [tradicion, mate, baja, archivado];

describe('recordatorios según anticipación', () => {
  it('con 3 días de anticipación avisa todo lo que empieza hasta el 06/11 (sin archivados)', () => {
    const alerts = computeAlerts(all, new Map(), today, 3);
    expect(alerts.map((a) => a.occurrence.event.id)).toEqual(['baja', 'mate']);
    expect(alerts[1]?.daysLeft).toBe(2);
  });

  it('con 7 días incluye la Tradición', () => {
    expect(computeAlerts(all, new Map(), today, 7).map((a) => a.occurrence.event.id)).toEqual(['baja', 'mate', 'trad']);
  });

  it('un saludo listo o compartido resuelve la alerta; uno pendiente no', () => {
    expect(computeAlerts([mate], greetingsByEvent([g('mate', 'pendiente')]), today, 3)).toHaveLength(1);
    expect(computeAlerts([mate], greetingsByEvent([g('mate', 'listo')]), today, 3)).toHaveLength(0);
    expect(computeAlerts([mate], greetingsByEvent([g('mate', 'compartido')]), today, 3)).toHaveLength(0);
  });

  it('las alertas revisadas no vuelven a aparecer', () => {
    expect(computeAlerts([mate], new Map(), today, 3, new Set(['mate@2026-11-05']))).toHaveLength(0);
  });

  it('incluye el día de hoy', () => {
    expect(computeAlerts([makeEvent({ startDate: today })], new Map(), today, 0)).toHaveLength(1);
  });

  it('lista los próximos eventos sin archivados', () => {
    expect(upcoming(all, today, 7).map((o) => o.event.id)).toEqual(['baja', 'mate', 'trad']);
  });
});
