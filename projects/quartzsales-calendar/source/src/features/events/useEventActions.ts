import { useCallback } from 'react';
import { deleteEvents, duplicateEvent, updateEvent } from '../../db/repo';
import { copyText } from '../../lib/clipboard';
import type { CalendarEvent } from '../../types';
import { useToast } from '../../components/ui/Toast';

export function useEventActions() {
  const toast = useToast();

  const toggleFavorite = useCallback(
    async (event: CalendarEvent) => {
      await updateEvent(event.id, { favorite: !event.favorite });
      toast.success(event.favorite ? 'Quitado de favoritos.' : 'Agregado a favoritos.');
    },
    [toast],
  );

  const toggleArchive = useCallback(
    async (event: CalendarEvent) => {
      const archived = !event.archived;
      await updateEvent(event.id, { archived });
      toast.show(archived ? 'Evento archivado. Ya no aparece en el calendario.' : 'Evento restaurado.', {
        tone: 'success',
        action: { label: 'Deshacer', onClick: () => void updateEvent(event.id, { archived: !archived }) },
      });
    },
    [toast],
  );

  const duplicate = useCallback(
    async (event: CalendarEvent) => {
      const copy = await duplicateEvent(event.id);
      toast.success('Evento duplicado.');
      return copy;
    },
    [toast],
  );

  const remove = useCallback(
    async (event: CalendarEvent) => {
      await deleteEvents([event.id]);
      toast.success('Evento eliminado.');
    },
    [toast],
  );

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text);
      if (ok) toast.success('Copiado al portapapeles.');
      return ok;
    },
    [toast],
  );

  return { toggleFavorite, toggleArchive, duplicate, remove, copy };
}
