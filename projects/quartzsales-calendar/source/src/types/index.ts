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
   * nth: 1..5, o -1 para "el último". Ej. Día de la Madre (AR): 3.er domingo de octubre.
   */
  | { type: 'yearly-nth-weekday'; month: number; weekday: Weekday; nth: 1 | 2 | 3 | 4 | 5 | -1; offsetDays: number }
  /** Todos los años, relativo al Domingo de Pascua (calendario gregoriano). Viernes Santo: −2. */
  | { type: 'yearly-easter'; offsetDays: number };

/** Feriado trasladado: la celebración es en la fecha del evento, el día no laborable es otro. */
export interface HolidayObservance {
  year: number;
  date: ISODate;
  note?: string;
}

/**
 * Edición de un evento: una fecha concreta (con año) en un lugar. Sirve para fechas que
 * cada región hace en otro día (ej. Noche de los Museos). El país es siempre el del evento.
 */
export interface EventEdition {
  id: string;
  region?: string;
  city?: string;
  startDate: ISODate;
  endDate?: ISODate;
  /** Horario local; el fin puede ser menor que el inicio si cruza la medianoche. */
  startTime?: ISOTime;
  endTime?: ISOTime;
  /** Nombre propio de esa edición (ej. "Museos a la luz de la luna"). */
  localName?: string;
  /** Link al programa o a la fuente. */
  url?: string;
  source?: string;
  verification: Verification;
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
  /** Es feriado: ese día no se trabaja en el país (o en la fecha trasladada). */
  isHoliday?: boolean;
  /** Áreas a las que va dirigido el saludo (vacío = todo el país). */
  areas?: string[];
  /**
   * Si tiene ediciones, las fechas salen de acá (startDate/recurrence del evento se ignoran
   * en el calendario).
   */
  editions?: EventEdition[];
  /** Solo en ocurrencias: la edición que se está mostrando (no se guarda). */
  edition?: EventEdition;
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

export type GreetingStatus = 'pendiente' | 'listo' | 'compartido';

export interface Greeting {
  id: string;
  eventId: string;
  /** Se arma solo: "<evento> <año>". */
  internalTitle: string;
  body: string;
  /** Link a la imagen del saludo, guardada afuera (Drive, Canva…). */
  imageUrl?: string;
  /** Fecha de la ocurrencia del evento a la que corresponde. */
  plannedDate?: ISODate;
  status: GreetingStatus;
  createdAt: string;
  updatedAt: string;
}

/** Puesto de una persona en un área del organigrama (una persona puede tener varios). */
export interface PersonRole {
  area: string;
  title: string;
}

export interface Person {
  id: string;
  name: string;
  /** Iniciales a mostrar (si no, se calculan del nombre). */
  initials?: string;
  roles: PersonRole[];
  /** País donde trabaja (id del catálogo de países). */
  country: string;
  /** Región o provincia (id del catálogo), si se conoce. */
  region?: string;
  city?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vacation {
  id: string;
  personId: string;
  start: ISODate;
  end: ISODate;
  note?: string;
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

export type CategoryColor = 'blue' | 'teal' | 'amber' | 'pink' | 'fuchsia' | 'green' | 'brand' | 'slate';

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
