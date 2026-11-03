import { describe, expect, it } from 'vitest';
import { makeEvent } from '../test/factories';
import { buildIcs } from './ics';
import { expandEvents } from './recurrence';

const now = new Date('2026-11-03T12:00:00Z');

function unfold(ics: string) {
  return ics.replace(/\r\n /g, '');
}

describe('exportación .ics', () => {
  const tradicion = makeEvent({ id: 'trad', title: 'Día de la Tradición, Argentina; gaucho', startDate: '2026-11-10', summary: 'Línea 1\nLínea 2' });
  const festival = makeEvent({ id: 'fest', title: 'Festival', startDate: '2026-11-20', endDate: '2026-11-22', recurrence: { type: 'none' } });
  const charla = makeEvent({ id: 'charla', title: 'Charla', startDate: '2026-11-12', allDay: false, startTime: '18:30', endTime: '20:00', timezone: 'America/Argentina/Buenos_Aires', recurrence: { type: 'none' } });
  const occ = expandEvents([tradicion, festival, charla], '2026-11-01', '2026-11-30');
  const ics = buildIcs(occ, { leadDays: 3, now });

  it('tiene la estructura RFC 5545 con CRLF', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics.match(/END:VEVENT/g)).toHaveLength(3);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it('usa fechas de día completo con fin exclusivo', () => {
    const text = unfold(ics);
    expect(text).toContain('DTSTART;VALUE=DATE:20261110\r\nDTEND;VALUE=DATE:20261111');
    expect(text).toContain('DTSTART;VALUE=DATE:20261120\r\nDTEND;VALUE=DATE:20261123');
  });

  it('exporta horarios con zona horaria', () => {
    expect(unfold(ics)).toContain('DTSTART;TZID=America/Argentina/Buenos_Aires:20261112T183000');
  });

  it('escapa comas, punto y coma y saltos', () => {
    const text = unfold(ics);
    expect(text).toContain('SUMMARY:Día de la Tradición\\, Argentina\; gaucho');
    expect(text).toContain('Línea 1\\nLínea 2');
  });

  it('incluye alarma según la anticipación', () => {
    expect(ics.match(/TRIGGER:-P3D/g)).toHaveLength(3);
    expect(buildIcs(occ, { leadDays: 7, now })).toContain('TRIGGER:-P7D');
  });

  it('UIDs únicos por ocurrencia y líneas de máximo 75 octetos', () => {
    const uids = ics.match(/UID:[^\r]+/g)!;
    expect(new Set(uids).size).toBe(uids.length);
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
