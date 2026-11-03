import { TIMEZONE_BY_COUNTRY } from '../../data/defaults';
import { addDays, easterSunday, isValidISODate, nthWeekdayOfMonth, parseISO, todayISO } from '../../lib/dates';
import { durationDays } from '../../lib/recurrence';
import type { EventContent } from '../../schemas/event';
import type { CalendarEvent, EditorialStatus, ISODate, Relevance, Verification, Weekday } from '../../types';

export type DateMode = 'yearly-fixed' | 'yearly-nth-weekday' | 'yearly-easter' | 'none';

/** Estado del formulario: todo como string/boolean para inputs controlados. */
export interface EventDraft {
  title: string;
  summary: string;
  description: string;
  history: string;
  traditions: string;
  category: string;
  subcategory: string;
  country: string;
  region: string;
  city: string;
  dateMode: DateMode;
  startDate: string;
  multiDay: boolean;
  endDate: string;
  ruleMonth: string;
  ruleNth: string;
  ruleWeekday: string;
  ruleOffset: string;
  /** Días totales en modo regla (1 = un solo día). */
  ruleDuration: string;
  /** Días respecto del Domingo de Pascua (Viernes Santo: -2). */
  easterOffset: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  observances: Array<{ year: string; date: string; note: string }>;
  relevance: Relevance;
  verification: Verification;
  verificationNote: string;
  source: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  imageUrl: string;
  contentIdeas: string;
  favorite: boolean;
  archived: boolean;
  editorialStatus: EditorialStatus;
}

export function emptyDraft(startDate: ISODate = todayISO(), defaults: Partial<EventDraft> = {}): EventDraft {
  const { m } = parseISO(startDate);
  return {
    title: '', summary: '', description: '', history: '', traditions: '',
    category: '', subcategory: '', country: '', region: '', city: '',
    dateMode: 'yearly-fixed', startDate, multiDay: false, endDate: '',
    ruleMonth: String(m), ruleNth: '1', ruleWeekday: '0', ruleOffset: '0', ruleDuration: '1', easterOffset: '-2',
    allDay: true, startTime: '', endTime: '', observances: [],
    relevance: 'media', verification: 'pendiente', verificationNote: '',
    source: '', sourceUrl: '', lastVerifiedAt: '', imageUrl: '', contentIdeas: '',
    favorite: false, archived: false, editorialStatus: 'sin evaluar',
    ...defaults,
  };
}

export function draftFromEvent(e: CalendarEvent): EventDraft {
  const rec = e.recurrence;
  return {
    title: e.title, summary: e.summary, description: e.description, history: e.history, traditions: e.traditions,
    category: e.category, subcategory: e.subcategory ?? '', country: e.country, region: e.region ?? '', city: e.city ?? '',
    dateMode: rec.type,
    startDate: e.startDate,
    multiDay: !!e.endDate && e.endDate !== e.startDate,
    endDate: e.endDate ?? '',
    ruleMonth: String(rec.type === 'yearly-nth-weekday' ? rec.month : parseISO(e.startDate).m),
    ruleNth: String(rec.type === 'yearly-nth-weekday' ? rec.nth : 1),
    ruleWeekday: String(rec.type === 'yearly-nth-weekday' ? rec.weekday : 0),
    ruleOffset: String(rec.type === 'yearly-nth-weekday' ? rec.offsetDays : 0),
    ruleDuration: String(durationDays(e) + 1),
    easterOffset: String(rec.type === 'yearly-easter' ? rec.offsetDays : -2),
    allDay: e.allDay, startTime: e.startTime ?? '', endTime: e.endTime ?? '',
    observances: e.holidayObservances.map((o) => ({ year: String(o.year), date: o.date, note: o.note ?? '' })),
    relevance: e.relevance, verification: e.verification, verificationNote: e.verificationNote ?? '',
    source: e.source, sourceUrl: e.sourceUrl ?? '', lastVerifiedAt: e.lastVerifiedAt ?? '', imageUrl: e.imageUrl ?? '',
    contentIdeas: e.contentIdeas.join('\n'),
    favorite: e.favorite, archived: e.archived, editorialStatus: e.editorialStatus,
  };
}

/** Para una regla, la fecha de referencia es la ocurrencia del año indicado. */
export function ruleStartDate(d: EventDraft, year: number): ISODate | null {
  if (d.dateMode === 'yearly-easter') return addDays(easterSunday(year), Number(d.easterOffset) || 0);
  const base = nthWeekdayOfMonth(year, Number(d.ruleMonth), Number(d.ruleWeekday) as Weekday, Number(d.ruleNth));
  return base ? addDays(base, Number(d.ruleOffset) || 0) : null;
}

const opt = (v: string) => (v.trim() === '' ? undefined : v.trim());

/** Convierte el borrador al contenido del evento (sin validar). */
export function draftToContent(d: EventDraft, referenceYear = parseISO(todayISO()).y): EventContent {
  const isRule = d.dateMode === 'yearly-nth-weekday' || d.dateMode === 'yearly-easter';
  const startDate = isRule ? (ruleStartDate(d, referenceYear) ?? '') : d.startDate;
  let endDate: string | undefined;
  if (isRule) {
    const len = Math.max(1, Math.floor(Number(d.ruleDuration) || 1));
    endDate = startDate && len > 1 ? addDays(startDate, len - 1) : undefined;
  } else if (d.multiDay && d.endDate) {
    endDate = d.endDate;
  }
  return {
    title: d.title.trim(),
    summary: d.summary.trim(),
    description: d.description,
    history: d.history,
    traditions: d.traditions,
    category: d.category,
    subcategory: opt(d.subcategory),
    country: d.country,
    region: opt(d.region),
    city: opt(d.city),
    startDate,
    endDate,
    allDay: d.allDay,
    startTime: d.allDay ? undefined : opt(d.startTime),
    endTime: d.allDay ? undefined : opt(d.endTime),
    timezone: TIMEZONE_BY_COUNTRY[d.country] ?? 'UTC',
    recurrence: d.dateMode === 'yearly-easter'
      ? { type: 'yearly-easter', offsetDays: Number(d.easterOffset) || 0 }
      : isRule
      ? {
          type: 'yearly-nth-weekday',
          month: Number(d.ruleMonth),
          weekday: Number(d.ruleWeekday) as Weekday,
          nth: Number(d.ruleNth) as 1 | 2 | 3 | 4 | 5 | -1,
          offsetDays: Number(d.ruleOffset) || 0,
        }
      : { type: d.dateMode as 'none' | 'yearly-fixed' },
    dateType: d.dateMode === 'yearly-fixed' ? 'fija' : isRule ? 'variable' : 'edición anual',
    holidayObservances: d.observances
      .filter((o) => o.date)
      .map((o) => ({ year: isValidISODate(o.date) ? parseISO(o.date).y : Number(o.year) || 0, date: o.date, note: opt(o.note) })),
    relevance: d.relevance,
    verification: d.verification,
    verificationNote: d.verification === 'confirmado' ? undefined : opt(d.verificationNote),
    source: d.source.trim(),
    sourceUrl: opt(d.sourceUrl),
    lastVerifiedAt: opt(d.lastVerifiedAt),
    imageUrl: opt(d.imageUrl),
    contentIdeas: d.contentIdeas.split('\n').map((s) => s.trim()).filter(Boolean),
    favorite: d.favorite,
    archived: d.archived,
    editorialStatus: d.editorialStatus,
  };
}
