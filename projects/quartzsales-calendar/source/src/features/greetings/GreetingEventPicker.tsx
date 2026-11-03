import { useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Dialog';
import { EventGreetingBadge } from '../../components/domain/GreetingBadges';
import { useEvents, useGreetingsMap } from '../../hooks/useData';
import { addDays, formatDate, todayISO } from '../../lib/dates';
import { matchesQuery } from '../../lib/filters';
import { expandEvents } from '../../lib/recurrence';
import { SearchBox } from '../filters/Filters';
import { useCreateGreeting } from './useCreateGreeting';

/** Elegir un evento próximo para crearle un saludo (acceso directo del dashboard). */
export function GreetingEventPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const events = useEvents();
  const gMap = useGreetingsMap();
  const create = useCreateGreeting();
  const [query, setQuery] = useState('');
  const today = todayISO();
  const occs = useMemo(
    () => expandEvents((events ?? []).filter((e) => !e.archived && matchesQuery(e, query)), today, addDays(today, 120)).slice(0, 60),
    [events, query, today],
  );
  return (
    <Modal open={open} onClose={onClose} title="Crear saludo" description="Elegí para qué evento es (próximos 120 días).">
      <div className="flex flex-col gap-3">
        <SearchBox value={query} onChange={setQuery} />
        {occs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No hay eventos próximos que coincidan.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded border border-border">
            {occs.map((o) => (
              <li key={o.key}>
                <button type="button" onClick={() => { onClose(); void create(o.event, o.start); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
                  <span className="w-20 shrink-0 text-xs text-muted tabular-nums">{formatDate(o.start)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.event.title}</span>
                  <EventGreetingBadge greetings={gMap.get(o.event.id)} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
