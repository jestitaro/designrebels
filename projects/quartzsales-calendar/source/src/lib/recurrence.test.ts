import { describe, expect, it } from 'vitest';
import { makeEvent } from '../test/factories';
import {
  describeRecurrence, expandEvents, nextOccurrence, occurrenceStartForYear, occurrencesByDay, occurrencesInRange,
} from './recurrence';

const diaDeLaMadre = makeEvent({
  title: 'Día de la Madre (Argentina)',
  startDate: '2026-10-18',
  recurrence: { type: 'yearly-nth-weekday', month: 10, weekday: 6, nth: 3, offsetDays: 0 },
  dateType: 'variable',
});

describe('recurrencia', () => {
  it('anual fija se repite todos los años en el mismo día', () => {
    const tradicion = makeEvent({ startDate: '2026-11-10' });
    expect(occurrenceStartForYear(tradicion, 2024)).toBe('2024-11-10');
    expect(occurrenceStartForYear(tradicion, 2031)).toBe('2031-11-10');
  });

  it('29/02 cae el 28/02 en años no bisiestos', () => {
    const leap = makeEvent({ startDate: '2028-02-29' });
    expect(occurrenceStartForYear(leap, 2027)).toBe('2027-02-28');
    expect(occurrenceStartForYear(leap, 2032)).toBe('2032-02-29');
  });

  it('Día de la Madre (AR): 3.er domingo de octubre en varios años', () => {
    expect(occurrenceStartForYear(diaDeLaMadre, 2024)).toBe('2024-10-20');
    expect(occurrenceStartForYear(diaDeLaMadre, 2025)).toBe('2025-10-19');
    expect(occurrenceStartForYear(diaDeLaMadre, 2026)).toBe('2026-10-18');
    expect(occurrenceStartForYear(diaDeLaMadre, 2027)).toBe('2027-10-17');
    expect(occurrenceStartForYear(diaDeLaMadre, 2028)).toBe('2028-10-15');
  });

  it('Pascua y Viernes Santo en varios años', () => {
    const vs = makeEvent({ startDate: '2026-04-03', recurrence: { type: 'yearly-easter', offsetDays: -2 } });
    expect(occurrenceStartForYear(vs, 2024)).toBe('2024-03-29');
    expect(occurrenceStartForYear(vs, 2025)).toBe('2025-04-18');
    expect(occurrenceStartForYear(vs, 2026)).toBe('2026-04-03');
    expect(occurrenceStartForYear(vs, 2027)).toBe('2027-03-26');
    expect(occurrenceStartForYear(vs, 2038)).toBe('2038-04-23');
    expect(describeRecurrence(vs)).toBe('Todos los años, el Viernes Santo. Cambia de fecha según la Pascua.');
  });

  it('las ediciones únicas no se repiten', () => {
    const festival = makeEvent({ startDate: '2026-11-20', endDate: '2026-11-22', recurrence: { type: 'none' } });
    expect(occurrenceStartForYear(festival, 2026)).toBe('2026-11-20');
    expect(occurrenceStartForYear(festival, 2027)).toBeNull();
    expect(occurrencesInRange(festival, '2027-01-01', '2027-12-31')).toEqual([]);
  });

  it('los multi-día aparecen en todos los días del rango, incluso cruzando meses', () => {
    const festival = makeEvent({ startDate: '2026-11-29', endDate: '2026-12-02', recurrence: { type: 'none' } });
    const occ = expandEvents([festival], '2026-12-01', '2026-12-31');
    expect(occ).toHaveLength(1);
    const byDay = occurrencesByDay(occ, '2026-12-01', '2026-12-31');
    expect([...byDay.keys()]).toEqual(['2026-12-01', '2026-12-02']);
    const nov = occurrencesByDay(expandEvents([festival], '2026-11-01', '2026-11-30'), '2026-11-01', '2026-11-30');
    expect([...nov.keys()]).toEqual(['2026-11-29', '2026-11-30']);
  });

  it('un anual multi-día que cruza el año aparece en enero', () => {
    const fin = makeEvent({ startDate: '2025-12-30', endDate: '2026-01-02' });
    const occ = occurrencesInRange(fin, '2027-01-01', '2027-01-31');
    expect(occ.map((o) => [o.start, o.end])).toEqual([['2026-12-30', '2027-01-02']]);
  });

  it('ordena por fecha y relevancia', () => {
    const baja = makeEvent({ title: 'B', startDate: '2026-11-10', relevance: 'baja' });
    const alta = makeEvent({ title: 'A', startDate: '2026-11-10', relevance: 'alta' });
    const antes = makeEvent({ title: 'C', startDate: '2026-11-01', relevance: 'baja' });
    expect(expandEvents([baja, alta, antes], '2026-11-01', '2026-11-30').map((o) => o.event.title)).toEqual(['C', 'A', 'B']);
  });

  it('encuentra la próxima ocurrencia', () => {
    const ev = makeEvent({ startDate: '2026-11-10' });
    expect(nextOccurrence(ev, '2026-11-10')?.start).toBe('2026-11-10');
    expect(nextOccurrence(ev, '2026-11-11')?.start).toBe('2027-11-10');
  });

  it('describe la regla en lenguaje claro', () => {
    expect(describeRecurrence(diaDeLaMadre)).toBe('Todos los años, el 3.º domingo de octubre.');
    expect(describeRecurrence(makeEvent({ startDate: '2026-11-10' }))).toBe('Todos los años el 10/11.');
    expect(describeRecurrence(makeEvent({ startDate: '2026-11-20', endDate: '2026-11-22', recurrence: { type: 'none' } })))
      .toBe('Edición única: del 20/11/2026 al 22/11/2026. No se repite.');
  });
});
