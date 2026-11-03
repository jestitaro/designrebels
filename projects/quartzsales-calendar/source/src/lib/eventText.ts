import type { Catalog } from '../hooks/useData';
import { placeLabel } from '../hooks/useData';
import type { CalendarEvent, Occurrence } from '../types';
import { formatDate, formatRange } from './dates';
import { describeRecurrence } from './recurrence';

/** Ficha del evento en texto plano, lista para pegar. */
export function eventToPlainText(event: CalendarEvent, catalog: Catalog, occurrence?: Occurrence | null): string {
  const category = catalog.categoryById.get(event.category);
  const sub = category?.subcategories.find((s) => s.id === event.subcategory);
  const lines: string[] = [event.title.toUpperCase()];
  if (event.summary) lines.push(event.summary);
  lines.push('');
  if (occurrence) lines.push(`Fecha: ${formatRange(occurrence.start, occurrence.end)}`);
  lines.push(`Regla: ${describeRecurrence(event)}`);
  for (const o of event.holidayObservances) {
    lines.push(`Feriado trasladado ${o.year}: ${formatDate(o.date)}${o.note ? ` (${o.note})` : ''}`);
  }
  if (!event.allDay && event.startTime) lines.push(`Horario: ${event.startTime}${event.endTime ? `–${event.endTime}` : ''} h`);
  lines.push(`Lugar: ${placeLabel(event, catalog)}`);
  lines.push(`Categoría: ${category?.name ?? event.category}${sub ? ` · ${sub.name}` : ''}`);
  lines.push(`Relevancia: ${event.relevance} · Verificación: ${event.verification}`);
  const block = (title: string, text: string) => {
    if (text.trim()) lines.push('', `${title}:`, text.trim());
  };
  block('Descripción', event.description);
  block('Origen e historia', event.history);
  block('Tradiciones', event.traditions);
  if (event.contentIdeas.length) lines.push('', 'Ideas de contenido:', ...event.contentIdeas.map((i) => `• ${i}`));
  if (event.source || event.sourceUrl) {
    lines.push('', `Fuente: ${[event.source, event.sourceUrl].filter(Boolean).join(' — ')}`);
    if (event.lastVerifiedAt) lines.push(`Última verificación: ${formatDate(event.lastVerifiedAt)}`);
  }
  return lines.join('\n');
}
