import type { CalendarEvent } from '../types';

let counter = 0;

export function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  counter += 1;
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id: `evt-test-${counter}`,
    title: `Evento ${counter}`,
    summary: '',
    description: '',
    history: '',
    traditions: '',
    category: 'efemerides',
    country: 'ar',
    startDate: '2026-11-10',
    allDay: true,
    timezone: 'America/Argentina/Buenos_Aires',
    recurrence: { type: 'yearly-fixed' },
    dateType: 'fija',
    holidayObservances: [],
    relevance: 'media',
    verification: 'pendiente',
    source: '',
    contentIdeas: [],
    favorite: false,
    archived: false,
    editorialStatus: 'sin evaluar',
    provenance: 'usuario',
    userModified: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
