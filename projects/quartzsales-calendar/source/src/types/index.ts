/** Fecha local en formato YYYY-MM-DD. Nunca un timestamp UTC. */
export type ISODate = string;
/** Hora local en formato HH:mm. */
export type ISOTime = string;

export type Relevance = 'alta' | 'media' | 'baja';
export type Verification = 'confirmado' | 'pendiente' | 'tentativo';
export type DateType = 'fija' | 'variable' | 'edición anual';
export type Provenance = 'seed' | 'usuario';
export type EditorialStatus = 'sin evaluar' | 'para comunicar' | 'en preparación' | 'comunicado' | 'descartado';

/** 0 = lunes … 6 = domingo (la semana empieza el lunes). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Recurrence =
  /** Ocurre una sola vez, en startDate (con año). Ediciones únicas: no se repiten. */
  | { type: 'none' }
  /** Todos los años, mismo día y mes que startDate. */
  | { type: 'yearly-fixed' }
  /**
   * Todos los años, el n-ésimo `weekday` de `month`, desplazado `offsetDays`.
   * nth: 1..5, o -1 para "el último". Ej. Black Friday: 4.º jueves de noviembre +1.
   */
  | { type: 'yearly-nth-weekday'; month: number; weekday: Weekday; nth: 1 | 2 | 3 | 4 | 5 | -1; offsetDays: number };

/** Feriado trasladado: la celebración es en la fecha del evento, el día no laborable es otro. */
export interface HolidayObservance {
  year: number;
  date: ISODate;
  note?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  summary: string;
  description: string;
  /** Origen e historia de la fecha. */
  history: string;
  traditions: string;
  category: string;
  subcategory?: string;
  country: string;
  region?: string;
  city?: string;
  startDate: ISODate;
  endDate?: ISODate;
  allDay: boolean;
  startTime?: ISOTime;
  endTime?: ISOTime;
  timezone: string;
  recurrence: Recurrence;
  dateType: DateType;
  holidayObservances: HolidayObservance[];
  relevance: Relevance;
  verification: Verification;
  /** Qué falta confirmar cuando la verificación no es "confirmado". */
  verificationNote?: string;
  source: string;
  sourceUrl?: string;
  lastVerifiedAt?: ISODate;
  imageUrl?: string;
  contentIdeas: string[];
  favorite: boolean;
  archived: boolean;
  editorialStatus: EditorialStatus;
  /** Quién creó el registro: catálogo inicial o carga propia. */
  provenance: Provenance;
  /** true si es un evento del seed que el usuario editó: el seed nuevo no lo pisa. */
  userModified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Tone = 'institucional' | 'cercano' | 'divertido' | 'humor-interno';
export type GreetingStatus = 'sin redactar' | 'borrador' | 'listo' | 'compartido' | 'descartado';

export interface GreetingVersion {
  id: string;
  body: string;
  status: GreetingStatus;
  savedAt: string;
  reason: 'manual' | 'cambio de estado' | 'restauración';
}

export interface Greeting {
  id: string;
  eventId: string;
  internalTitle: string;
  body: string;
  tone: Tone;
  channel: string;
  plannedDate?: ISODate;
  status: GreetingStatus;
  privateNotes: string;
  versions: GreetingVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  /** Clave del color semántico (ver tokens en index.css). */
  color: CategoryColor;
  subcategories: Subcategory[];
  visible: boolean;
  order: number;
}

export type CategoryColor = 'blue' | 'teal' | 'amber' | 'pink' | 'fuchsia' | 'green' | 'brand';

export interface City {
  id: string;
  name: string;
  active: boolean;
}

export interface Region {
  id: string;
  name: string;
  active: boolean;
  cities: City[];
}

export interface Country {
  id: string;
  name: string;
  active: boolean;
  regions: Region[];
  order: number;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePreference;
  leadDays: number;
  lastExportAt?: string;
}

/** Ocurrencia concreta de un evento en el calendario. */
export interface Occurrence {
  event: CalendarEvent;
  /** Clave estable: `${eventId}@${start}`. */
  key: string;
  start: ISODate;
  end: ISODate;
}
