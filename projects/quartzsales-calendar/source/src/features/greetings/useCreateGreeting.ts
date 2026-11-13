import { useNavigate } from 'react-router';
import { createGreeting } from '../../db/greetings';
import { eventTitle, useCatalog } from '../../hooks/useData';
import { parseISO } from '../../lib/dates';
import type { CalendarEvent, ISODate } from '../../types';

/** Crea un saludo para una ocurrencia del evento y abre el editor. */
export function useCreateGreeting() {
  const navigate = useNavigate();
  const catalog = useCatalog();
  return async (event: CalendarEvent, occurrenceDate?: ISODate) => {
    const date = occurrenceDate ?? event.startDate;
    const g = await createGreeting({
      eventId: event.id,
      internalTitle: `${eventTitle(event, catalog)} ${parseISO(date).y}`,
      plannedDate: date,
    });
    navigate(`/saludos/${g.id}`);
  };
}
