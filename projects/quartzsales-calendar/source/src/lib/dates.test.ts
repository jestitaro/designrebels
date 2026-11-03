import { describe, expect, it } from 'vitest';
import {
  addDays, addMonths, diffDays, endOfWeek, formatDate, formatLong, isValidISODate, monthGrid,
  nthWeekdayOfMonth, parseHumanDate, startOfWeek, todayISO, weekdayOf,
} from './dates';

describe('aritmética de fechas civiles', () => {
  it('suma días cruzando meses, años y bisiestos', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('no se corre en cambios de horario (DST de otros países)', () => {
    // 29/03/2026 es el cambio de hora en Europa y 08/03/2026 en EE. UU.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(diffDays('2026-03-07', '2026-03-09')).toBe(2);
  });

  it('valida fechas', () => {
    expect(isValidISODate('2026-02-29')).toBe(false);
    expect(isValidISODate('2028-02-29')).toBe(true);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('10/11/2026')).toBe(false);
  });

  it('la semana empieza el lunes', () => {
    expect(weekdayOf('2026-11-02')).toBe(0); // lunes
    expect(weekdayOf('2026-11-08')).toBe(6); // domingo
    expect(startOfWeek('2026-11-08')).toBe('2026-11-02');
    expect(startOfWeek('2026-11-02')).toBe('2026-11-02');
    expect(endOfWeek('2026-11-04')).toBe('2026-11-08');
  });

  it('arma la grilla del mes con semanas lunes-domingo', () => {
    const grid = monthGrid(2026, 11); // noviembre 2026 arranca domingo
    expect(grid[0]?.[0]).toBe('2026-10-26');
    expect(grid[0]?.[6]).toBe('2026-11-01');
    expect(grid.at(-1)?.[6]).toBe('2026-12-06');
    expect(grid.every((week) => week.length === 7)).toBe(true);
    const feb2027 = monthGrid(2027, 2); // arranca lunes, 28 días
    expect(feb2027).toHaveLength(4);
  });

  it('calcula el n-ésimo día de la semana', () => {
    expect(nthWeekdayOfMonth(2026, 11, 3, 4)).toBe('2026-11-26'); // 4.º jueves
    expect(nthWeekdayOfMonth(2026, 11, 0, -1)).toBe('2026-11-30'); // último lunes
    expect(nthWeekdayOfMonth(2026, 2, 0, 5)).toBeNull();
  });

  it('navega meses', () => {
    expect(addMonths(2026, 12, 1)).toEqual({ y: 2027, m: 1 });
    expect(addMonths(2026, 1, -1)).toEqual({ y: 2025, m: 12 });
    expect(addMonths(2026, 5, -17)).toEqual({ y: 2024, m: 12 });
  });

  it('formatea en español de Argentina', () => {
    expect(formatDate('2026-11-10')).toBe('10/11/2026');
    expect(formatLong('2026-11-10')).toBe('martes 10 de noviembre de 2026');
    expect(parseHumanDate('1/2/2026')).toBe('2026-02-01');
    expect(parseHumanDate('31/02/2026')).toBeNull();
  });

  it('toma el día local del dispositivo, no el UTC', () => {
    // 23:30 del 10/11 en hora local: tiene que ser el 10, aunque en UTC ya sea 11.
    expect(todayISO(new Date(2026, 10, 10, 23, 30))).toBe('2026-11-10');
    expect(todayISO(new Date(2026, 10, 11, 0, 15))).toBe('2026-11-11');
  });
});
