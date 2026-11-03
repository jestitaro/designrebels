import { useNavigate } from 'react-router';
import { createGreeting } from '../../db/greetings';
import { parseISO } from '../../lib/dates';
import type { CalendarEvent, ISODate } from '../../types';

/** Crea un saludo para una ocurrencia del evento y abre el editor. */
export function useCreateGreeting() {
  const navigate = useNavigate();
  return async (event: CalendarEvent, occurrenceDate?: ISODate) => {
    const date = occurrenceDate ?? event.startDate;
    const g = await createGreeting({
      eventId: event.id,
      internalTitle: `${event.title} ${parseISO(date).y}`,
      plannedDate: date,
    });
    navigate(`/saludos/${g.id}`);
  };
}
