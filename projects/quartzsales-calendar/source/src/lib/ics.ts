import type { Occurrence } from '../types';
import { addDays } from './dates';
import { describeRecurrence } from './recurrence';

/*
 * Genera un .ics (RFC 5545). Cada ocurrencia se exporta como un VEVENT propio
 * (sin RRULE): así reglas como "día siguiente al 4.º jueves" se ven exactas en
 * cualquier app de calendario. Incluye una alarma VALARM con la anticipación.
 */

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Pliega líneas a 75 octetos como pide el RFC. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const len = new TextEncoder().encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + len > limit) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += char;
    size += len;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const compact = (iso: string) => iso.replace(/-/g, '');

function stamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export interface IcsOptions {
  leadDays: number;
  now?: Date;
  calendarName?: string;
  /** Texto adicional por ocurrencia (p. ej., estado del saludo). */
  extraDescription?: (occ: Occurrence) => string | undefined;
}

export function buildIcs(occurrences: Occurrence[], options: IcsOptions): string {
  const now = options.now ?? new Date();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Design Rebels//QuartzSales Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(options.calendarName ?? 'QuartzSales Calendar')}`,
  ];
  for (const occ of occurrences) {
    const e = occ.event;
    const desc = [e.summary, describeRecurrence(e), options.extraDescription?.(occ), e.sourceUrl ? `Fuente: ${e.sourceUrl}` : '']
      .filter(Boolean)
      .join('\n');
    lines.push('BEGIN:VEVENT', `UID:${e.id}-${compact(occ.start)}@qs-calendar`, `DTSTAMP:${stamp(now)}`);
    if (e.allDay || !e.startTime) {
      lines.push(`DTSTART;VALUE=DATE:${compact(occ.start)}`, `DTEND;VALUE=DATE:${compact(addDays(occ.end, 1))}`);
    } else {
      const tz = e.timezone && e.timezone !== 'UTC' ? `;TZID=${e.timezone}` : '';
      const t = (time: string) => `${time.replace(':', '')}00`;
      lines.push(`DTSTART${tz}:${compact(occ.start)}T${t(e.startTime)}`);
      lines.push(`DTEND${tz}:${compact(occ.end)}T${t(e.endTime ?? e.startTime)}`);
    }
    lines.push(`SUMMARY:${escapeText(e.title)}`);
    if (desc) lines.push(`DESCRIPTION:${escapeText(desc)}`);
    if (e.sourceUrl) lines.push(`URL:${e.sourceUrl}`);
    lines.push('TRANSP:TRANSPARENT');
    if (options.leadDays >= 0) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(`Preparar saludo: ${e.title}`)}`,
        `TRIGGER:-P${Math.round(options.leadDays)}D`,
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
