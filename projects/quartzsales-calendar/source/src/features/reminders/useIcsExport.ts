import { useCallback } from 'react';
import { useToast } from '../../components/ui/Toast';
import { bestGreetingStatus, GREETING_STATUS_META } from '../../components/domain/greetingMeta';
import { useGreetingsMap, useSettings } from '../../hooks/useData';
import { addDays, todayISO } from '../../lib/dates';
import { downloadFile } from '../../lib/download';
import { buildIcs } from '../../lib/ics';
import { expandEvents } from '../../lib/recurrence';
import type { CalendarEvent, Occurrence } from '../../types';

/** Exporta ocurrencias a .ics con alarma según la anticipación configurada. */
export function useIcsExport() {
  const { leadDays } = useSettings();
  const gMap = useGreetingsMap();
  const toast = useToast();

  const exportOccurrences = useCallback(
    (occurrences: Occurrence[], filename: string) => {
      if (occurrences.length === 0) {
        toast.error('No hay eventos para exportar con este criterio.');
        return;
      }
      const ics = buildIcs(occurrences, {
        leadDays,
        extraDescription: (o) => {
          const s = bestGreetingStatus((gMap.get(o.event.id) ?? []).map((g) => g.status));
          return s ? `Saludo: ${GREETING_STATUS_META[s].label.toLowerCase()}` : 'Saludo: sin crear';
        },
      });
      downloadFile(filename, ics, 'text/calendar;charset=utf-8');
      toast.success(`Se descargó ${filename} con ${occurrences.length} ${occurrences.length === 1 ? 'fecha' : 'fechas'}. Abrilo para sumarlo a tu calendario.`);
    },
    [leadDays, gMap, toast],
  );

  /** Próximos `days` días (por defecto, un año) de los eventos indicados. */
  const exportEvents = useCallback(
    (events: CalendarEvent[], filename: string, days = 365) => {
      const today = todayISO();
      exportOccurrences(expandEvents(events.filter((e) => !e.archived), today, addDays(today, days)), filename);
    },
    [exportOccurrences],
  );

  return { exportOccurrences, exportEvents, leadDays };
}
