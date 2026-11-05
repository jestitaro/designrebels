import { TIMEZONE_BY_COUNTRY } from '../data/defaults';
import type { Catalog } from '../hooks/useData';
import { eventContentSchema, fieldErrors, type EventContent } from '../schemas/event';
import type { CalendarEvent, Weekday } from '../types';
import { addDays, easterSunday, formatDate, isValidISODate, nthWeekdayOfMonth, parseHumanDate, parseISO, todayISO, WEEKDAYS } from './dates';
import { duplicateKey } from './duplicates';
import { normalizeText } from './text';

export const CSV_COLUMNS = [
  'titulo', 'categoria', 'pais', 'tipo_fecha', 'fecha_inicio', 'fecha_fin',
  'regla_semana', 'regla_dia', 'regla_mes', 'regla_desplazamiento', 'link_imagen',
] as const;

type Column = (typeof CSV_COLUMNS)[number];
const REQUIRED: Column[] = ['titulo', 'categoria', 'pais', 'tipo_fecha'];

const COLUMN_HELP: Record<Column, string> = {
  titulo: 'Obligatorio',
  categoria: 'Nombre o ID (ej. Efemérides)',
  pais: 'Nombre o ID (ej. Argentina)',
  tipo_fecha: 'fija (todos los años) | unica | regla | pascua',
  fecha_inicio: 'dd/mm/aaaa (no se usa en regla ni pascua)',
  fecha_fin: 'dd/mm/aaaa si dura varios días',
  regla_semana: '1 a 5 o ultima',
  regla_dia: 'lunes … domingo',
  regla_mes: '1 a 12',
  regla_desplazamiento: 'días +/− (Black Friday: 1; en pascua, Viernes Santo: -2)',
  link_imagen: 'https://… (opcional)',
};

export function csvTemplate(): string[][] {
  return [
    [...CSV_COLUMNS],
    CSV_COLUMNS.map((c) => COLUMN_HELP[c]),
    ['Día de ejemplo', 'Cultura y tradiciones', 'Argentina', 'fija', '10/11/2026', '', '', '', '', '', ''],
    ['Evento por regla de ejemplo', 'Comerciales', 'Internacional', 'regla', '', '', '4', 'jueves', '11', '1', ''],
  ];
}

export function eventsToCsv(events: CalendarEvent[], catalog: Catalog): string[][] {
  const rows: string[][] = [[...CSV_COLUMNS]];
  for (const e of events) {
    const cat = catalog.categoryById.get(e.category);
    const rec = e.recurrence;
    const isRule = rec.type === 'yearly-nth-weekday' || rec.type === 'yearly-easter';
    rows.push([
      e.title,
      cat?.name ?? e.category,
      catalog.placeName(e.country) ?? e.country,
      rec.type === 'none' ? 'unica' : rec.type === 'yearly-fixed' ? 'fija' : rec.type === 'yearly-easter' ? 'pascua' : 'regla',
      isRule ? '' : formatDate(e.startDate),
      e.endDate && !isRule ? formatDate(e.endDate) : '',
      rec.type === 'yearly-nth-weekday' ? (rec.nth === -1 ? 'ultima' : String(rec.nth)) : '',
      rec.type === 'yearly-nth-weekday' ? WEEKDAYS[rec.weekday]! : '',
      rec.type === 'yearly-nth-weekday' ? String(rec.month) : '',
      isRule ? String(rec.offsetDays) : '',
      e.imageUrl ?? '',
    ]);
  }
  return rows;
}

export interface CsvRowResult {
  line: number;
  title: string;
  content?: EventContent;
  errors: string[];
  duplicate?: { kind: 'existente' | 'archivo'; title: string };
}

export interface CsvParseResult {
  missingColumns: string[];
  unknownColumns: string[];
  rows: CsvRowResult[];
}

const FIELD_NAMES: Record<string, string> = {
  title: 'titulo', summary: 'resumen', category: 'categoria', country: 'pais', startDate: 'fecha_inicio', endDate: 'fecha_fin',
  startTime: 'hora_inicio', endTime: 'hora_fin', source: 'fuente', sourceUrl: 'url_fuente', lastVerifiedAt: 'ultima_verificacion',
};

function match<T extends { id: string; name: string }>(list: T[], value: string): T | undefined {
  const v = normalizeText(value);
  return list.find((x) => normalizeText(x.id) === v || normalizeText(x.name) === v);
}

/** Valida un CSV de eventos fila por fila, sin escribir nada. */
export function parseEventsCsv(rows: string[][], catalog: Catalog, existing: CalendarEvent[]): CsvParseResult {
  const [header = [], ...body] = rows;
  const cols = header.map((h) => normalizeText(h).replace(/ /g, '_'));
  const missingColumns = REQUIRED.filter((c) => !cols.includes(c));
  const unknownColumns = header.filter((_, i) => !(CSV_COLUMNS as readonly string[]).includes(cols[i]!));
  if (missingColumns.length) return { missingColumns, unknownColumns, rows: [] };

  const existingKeys = new Map(existing.map((e) => [duplicateKey(e), e.title]));
  const fileKeys = new Map<string, string>();
  const year = parseISO(todayISO()).y;
  const results: CsvRowResult[] = [];

  body.forEach((cells, index) => {
    // Acepta también columnas de la plantilla anterior (región, fuente, etc.).
    const get = (c: string) => (cells[cols.indexOf(c)] ?? '').trim();
    const line = index + 2;
    const errors: string[] = [];
    const title = get('titulo');
    // Fila de ayuda de la plantilla.
    if (title === 'Obligatorio') return;

    const category = match(catalog.categories, get('categoria'));
    if (get('categoria') && !category) errors.push(`Categoría desconocida: "${get('categoria')}".`);
    const country = match(catalog.countries, get('pais'));
    if (get('pais') && !country) errors.push(`País desconocido: "${get('pais')}".`);
    const region = get('region') && country ? match(country.regions, get('region')) : undefined;
    if (get('region') && country && !region) errors.push(`Región desconocida para ${country.name}: "${get('region')}".`);
    const city = get('ciudad') && region ? match(region.cities, get('ciudad')) : undefined;
    if (get('ciudad') && !city) errors.push(`Ciudad o zona desconocida: "${get('ciudad')}".`);
    const sub = get('subcategoria') && category ? match(category.subcategories, get('subcategoria')) : undefined;
    if (get('subcategoria') && category && !sub) errors.push(`Subcategoría desconocida: "${get('subcategoria')}".`);

    const date = (c: string) => {
      const raw = get(c);
      if (!raw) return undefined;
      const iso = parseHumanDate(raw) ?? (isValidISODate(raw) ? raw : null);
      if (!iso) errors.push(`${c}: fecha inválida "${raw}" (usá dd/mm/aaaa).`);
      return iso ?? 'invalid';
    };

    const tipo = normalizeText(get('tipo_fecha'));
    let recurrence: EventContent['recurrence'] = { type: 'yearly-fixed' };
    let startDate = date('fecha_inicio');
    let endDate = date('fecha_fin');
    if (tipo === 'regla') {
      const nthRaw = normalizeText(get('regla_semana'));
      const nth = nthRaw === 'ultima' || nthRaw === 'ultimo' ? -1 : Number(nthRaw);
      const weekday = WEEKDAYS.findIndex((w) => normalizeText(w) === normalizeText(get('regla_dia')));
      const month = Number(get('regla_mes'));
      const offset = Number(get('regla_desplazamiento') || 0);
      if (![1, 2, 3, 4, 5, -1].includes(nth)) errors.push('regla_semana: usá 1 a 5 o "ultima".');
      if (weekday < 0) errors.push('regla_dia: usá lunes a domingo.');
      if (!(month >= 1 && month <= 12)) errors.push('regla_mes: usá 1 a 12.');
      if (!Number.isInteger(offset)) errors.push('regla_desplazamiento: tiene que ser un número entero.');
      if (errors.length === 0) {
        recurrence = { type: 'yearly-nth-weekday', month, weekday: weekday as Weekday, nth: nth as 1, offsetDays: offset };
        const base = nthWeekdayOfMonth(year, month, weekday as Weekday, nth);
        startDate = base ? addDays(base, offset) : 'invalid';
        endDate = undefined;
      }
    } else if (tipo === 'pascua') {
      const offset = Number(get('regla_desplazamiento') || 0);
      if (!Number.isInteger(offset)) errors.push('regla_desplazamiento: tiene que ser un número entero.');
      else {
        recurrence = { type: 'yearly-easter', offsetDays: offset };
        startDate = addDays(easterSunday(year), offset);
        endDate = undefined;
      }
    } else if (tipo === 'unica') recurrence = { type: 'none' };
    else if (tipo !== 'fija') errors.push('tipo_fecha: usá fija, regla, pascua o unica.');

    const allDayRaw = normalizeText(get('todo_el_dia'));
    const allDay = allDayRaw === '' || allDayRaw === 'si' || allDayRaw === 'true' || allDayRaw === '1';
    const rel = normalizeText(get('relevancia')) || 'media';
    const ver = normalizeText(get('verificacion')) || 'pendiente';

    const content = {
      title, summary: get('resumen'), description: get('descripcion'), history: get('historia'), traditions: get('tradiciones'),
      category: category?.id ?? '', subcategory: sub?.id, country: country?.id ?? '', region: region?.id, city: city?.id,
      startDate: startDate ?? '', endDate, allDay,
      startTime: allDay ? undefined : get('hora_inicio') || undefined, endTime: allDay ? undefined : get('hora_fin') || undefined,
      timezone: TIMEZONE_BY_COUNTRY[country?.id ?? ''] ?? 'UTC',
      recurrence, dateType: recurrence.type === 'yearly-fixed' ? 'fija' : recurrence.type === 'none' ? 'edición anual' : 'variable',
      holidayObservances: [], relevance: rel, verification: ver, verificationNote: get('falta_confirmar') || undefined,
      source: get('fuente'), sourceUrl: get('url_fuente') || undefined, lastVerifiedAt: date('ultima_verificacion'),
      contentIdeas: get('ideas').split('|').map((s) => s.trim()).filter(Boolean),
      imageUrl: get('link_imagen') || get('url_imagen') || undefined,
      favorite: false, archived: false, editorialStatus: 'sin evaluar',
    };

    let parsedContent: EventContent | undefined;
    if (errors.length === 0) {
      const parsed = eventContentSchema.safeParse(content);
      if (parsed.success) parsedContent = parsed.data;
      else {
        for (const [field, msg] of Object.entries(fieldErrors(parsed.error))) {
          const col = FIELD_NAMES[field] ?? (field === 'relevance' ? 'relevancia' : field === 'verification' ? 'verificacion' : field);
          errors.push(`${col}: ${msg}`);
        }
      }
    }

    let duplicate: CsvRowResult['duplicate'];
    if (parsedContent) {
      const key = duplicateKey(parsedContent);
      if (existingKeys.has(key)) duplicate = { kind: 'existente', title: existingKeys.get(key)! };
      else if (fileKeys.has(key)) duplicate = { kind: 'archivo', title: fileKeys.get(key)! };
      else fileKeys.set(key, `fila ${line}`);
    }
    results.push({ line, title: title || '(sin título)', content: parsedContent, errors, duplicate });
  });

  return { missingColumns, unknownColumns, rows: results };
}
