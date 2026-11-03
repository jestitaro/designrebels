import type { ISODate, Weekday } from '../types';

/*
 * Toda la aritmética de fechas trabaja con fechas civiles (año, mes, día) y usa
 * Date.UTC solo como calculadora interna. Nunca se convierte una fecha de día
 * completo a/desde un timestamp en la zona del navegador, así que no hay
 * corrimientos de un día por zona horaria.
 */

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export interface CivilDate {
  y: number;
  m: number; // 1..12
  d: number; // 1..31
}

export function isValidISODate(value: string): boolean {
  const match = ISO_RE.exec(value);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

export function parseISO(value: ISODate): CivilDate {
  const match = ISO_RE.exec(value);
  if (!match) throw new Error(`Fecha inválida: ${value}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

export function toISO(y: number, m: number, d: number): ISODate {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

function toDayNumber(iso: ISODate): number {
  const { y, m, d } = parseISO(iso);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

function fromDayNumber(n: number): ISODate {
  const dt = new Date(n * DAY_MS);
  return toISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(iso) + days);
}

/** Días entre a y b (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return toDayNumber(b) - toDayNumber(a);
}

export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] ?? 30;
}

/** 0 = lunes … 6 = domingo. */
export function weekdayOf(iso: ISODate): Weekday {
  const { y, m, d } = parseISO(iso);
  const sundayBased = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return ((sundayBased + 6) % 7) as Weekday;
}

/** Lunes de la semana que contiene `iso`. */
export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, -weekdayOf(iso));
}

export function endOfWeek(iso: ISODate): ISODate {
  return addDays(startOfWeek(iso), 6);
}

export function startOfMonth(y: number, m: number): ISODate {
  return toISO(y, m, 1);
}

export function endOfMonth(y: number, m: number): ISODate {
  return toISO(y, m, daysInMonth(y, m));
}

export function addMonths(y: number, m: number, delta: number): { y: number; m: number } {
  const index = y * 12 + (m - 1) + delta;
  return { y: Math.floor(index / 12), m: (index % 12) + 1 };
}

/** Fecha de hoy según el reloj local del dispositivo. */
export function todayISO(now: Date = new Date()): ISODate {
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Semanas (lunes a domingo) que cubren el mes. Devuelve 4 a 6 filas de 7 fechas,
 * incluyendo días del mes anterior/siguiente para completar.
 */
export function monthGrid(y: number, m: number): ISODate[][] {
  const first = startOfWeek(startOfMonth(y, m));
  const last = endOfWeek(endOfMonth(y, m));
  const weeks: ISODate[][] = [];
  for (let cursor = first; compareISO(cursor, last) <= 0; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
  }
  return weeks;
}

export function weekDays(iso: ISODate): ISODate[] {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * n-ésimo día de la semana del mes (nth 1..5, o -1 = último).
 * Devuelve null si no existe (p. ej. 5.º lunes en un mes con 4).
 */
export function nthWeekdayOfMonth(y: number, m: number, weekday: Weekday, nth: number): ISODate | null {
  if (nth === -1) {
    const last = endOfMonth(y, m);
    const back = (weekdayOf(last) - weekday + 7) % 7;
    return addDays(last, -back);
  }
  const first = startOfMonth(y, m);
  const forward = (weekday - weekdayOf(first) + 7) % 7;
  const result = addDays(first, forward + (nth - 1) * 7);
  return parseISO(result).m === m ? result : null;
}

/** Domingo de Pascua (gregoriano), algoritmo anónimo de Meeus/Jones/Butcher. */
export function easterSunday(y: number): ISODate {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toISO(y, month, day);
}

export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

export const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const WEEKDAYS_MIN = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

export function monthName(m: number): string {
  return MONTHS[m - 1] ?? '';
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** dd/mm/aaaa */
export function formatDate(iso: ISODate): string {
  const { y, m, d } = parseISO(iso);
  return `${pad(d)}/${pad(m)}/${pad(y, 4)}`;
}

/** dd/mm */
export function formatDayMonth(iso: ISODate): string {
  const { m, d } = parseISO(iso);
  return `${pad(d)}/${pad(m)}`;
}

/** "lunes 10 de noviembre de 2026" */
export function formatLong(iso: ISODate, withYear = true): string {
  const { y, m, d } = parseISO(iso);
  const base = `${WEEKDAYS[weekdayOf(iso)]} ${d} de ${monthName(m)}`;
  return withYear ? `${base} de ${y}` : base;
}

export function formatRange(start: ISODate, end: ISODate): string {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} al ${formatDate(end)}`;
}

/** Parsea dd/mm/aaaa (entrada humana) a ISO. Devuelve null si no es válida. */
export function parseHumanDate(value: string): ISODate | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const iso = toISO(Number(match[3]), Number(match[2]), Number(match[1]));
  return isValidISODate(iso) ? iso : null;
}

/** "hoy", "mañana", "en 5 días", "hace 2 días" */
export function relativeDays(from: ISODate, to: ISODate): string {
  const n = diffDays(from, to);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n === -1) return 'ayer';
  return n > 0 ? `en ${n} días` : `hace ${-n} días`;
}
