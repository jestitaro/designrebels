import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { Catalog } from '../../hooks/useData';
import {
  addDays, addMonths, capitalize, daysInMonth, endOfWeek, formatLong, monthGrid, monthName, parseISO, startOfWeek,
  toISO, WEEKDAYS, WEEKDAYS_MIN, WEEKDAYS_SHORT,
} from '../../lib/dates';
import { cn } from '../../lib/cn';
import type { GreetingStatus, ISODate, Occurrence } from '../../types';
import { GREETING_STATUS_META } from '../../components/domain/greetingMeta';

interface MonthGridProps {
  year: number;
  month: number;
  byDay: Map<ISODate, Occurrence[]>;
  selected: ISODate;
  today: ISODate;
  catalog: Catalog;
  labelledBy: string;
  onSelect: (date: ISODate) => void;
  /** Clic en un evento puntual (solo puntero; con teclado se usa la lista del día). */
  onOpenOccurrence?: (occ: Occurrence, date: ISODate) => void;
  /** Estado del saludo más avanzado del evento (para el indicador). */
  greetingStatus?: (eventId: string) => GreetingStatus | null;
}

const MAX_PILLS = 3;
const MAX_DOTS = 3;

function sameDayNextMonth(iso: ISODate, delta: number): ISODate {
  const { y, m, d } = parseISO(iso);
  const next = addMonths(y, m, delta);
  return toISO(next.y, next.m, Math.min(d, daysInMonth(next.y, next.m)));
}

function cellLabel(date: ISODate, occs: Occurrence[], today: ISODate) {
  const count = occs.length;
  const events = count === 0 ? 'sin eventos' : count === 1 ? '1 evento' : `${count} eventos`;
  return `${date === today ? 'Hoy, ' : ''}${formatLong(date, false)}: ${events}`;
}

/**
 * Grilla mensual navegable con flechas (patrón ARIA grid).
 * ←/→ día · ↑/↓ semana · Inicio/Fin semana · RePág/AvPág mes · Enter/Espacio selecciona.
 */
export function MonthGrid({ year, month, byDay, selected, today, catalog, labelledBy, onSelect, onOpenOccurrence, greetingStatus }: MonthGridProps) {
  const weeks = monthGrid(year, month);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);

  // La celda enfocable es la seleccionada si está en el mes visible; si no, el día 1.
  const inMonth = (iso: ISODate) => parseISO(iso).m === month && parseISO(iso).y === year;
  const focusDate = inMonth(selected) ? selected : toISO(year, month, 1);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${focusDate}"]`)?.focus();
  }, [focusDate, year, month]);

  function move(date: ISODate) {
    shouldFocus.current = true;
    onSelect(date);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, date: ISODate) {
    const map: Record<string, () => ISODate> = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => startOfWeek(date),
      End: () => endOfWeek(date),
      PageUp: () => sameDayNextMonth(date, event.shiftKey ? -12 : -1),
      PageDown: () => sameDayNextMonth(date, event.shiftKey ? 12 : 1),
    };
    const next = map[event.key];
    if (next) {
      event.preventDefault();
      move(next());
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(date);
    }
  }

  return (
    <div ref={gridRef} role="grid" aria-labelledby={labelledBy} className="flex flex-1 flex-col select-none">
      <div role="row" className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((name, i) => (
          <div key={name} role="columnheader" aria-label={capitalize(name)} className="py-2 text-center text-xs font-medium text-muted">
            <span className="lg:hidden" aria-hidden>
              {WEEKDAYS_MIN[i]}
            </span>
            <span className="hidden lg:inline" aria-hidden>
              {WEEKDAYS_SHORT[i]}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col lg:flex-1">
        {weeks.map((week) => (
          <div role="row" key={week[0]} className="grid grid-cols-7 lg:min-h-28 lg:flex-1">
            {week.map((date) => {
              const occs = byDay.get(date) ?? [];
              const outside = !inMonth(date);
              const isSelected = date === selected;
              const isToday = date === today;
              const { d } = parseISO(date);
              return (
                <div
                  key={date}
                  role="gridcell"
                  data-date={date}
                  tabIndex={date === focusDate ? 0 : -1}
                  aria-selected={isSelected}
                  aria-label={cellLabel(date, occs, today)}
                  aria-current={isToday ? 'date' : undefined}
                  onClick={() => onSelect(date)}
                  onKeyDown={(e) => onKeyDown(e, date)}
                  className={cn(
                    'group relative flex cursor-pointer flex-col items-center gap-1 border-b border-border py-1.5 outline-none transition-colors',
                    'min-h-12 pointer-coarse:min-h-14 lg:items-stretch lg:gap-1 lg:border-r lg:px-1.5 lg:py-1.5 lg:[&:nth-child(7)]:border-r-0',
                    'hover:bg-surface-2 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                    outside && 'bg-surface-2/40 text-subtle',
                    isSelected && 'bg-primary-soft hover:bg-primary-soft',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-[13px] font-medium lg:size-6 lg:text-xs',
                      isToday && 'bg-brand-grad font-semibold text-white',
                      !isToday && isSelected && 'text-primary-soft-fg font-semibold',
                    )}
                    aria-hidden
                  >
                    {d}
                  </span>

                  {/* Mobile: indicadores por día */}
                  {occs.length > 0 && (
                    <span className="flex items-center gap-0.5 lg:hidden" aria-hidden>
                      {occs.slice(0, MAX_DOTS).map((o) => (
                        <span
                          key={o.key}
                          className={cn(
                            `cat-${catalog.categoryById.get(o.event.category)?.color ?? 'brand'}`,
                            'size-1.5 rounded-full bg-[var(--cat-solid)]',
                          )}
                        />
                      ))}
                      {occs.length > MAX_DOTS && <span className="text-[9px] leading-none font-semibold text-muted">+</span>}
                    </span>
                  )}

                  {/* Desktop: eventos con color de categoría */}
                  <ul className="hidden min-w-0 flex-col gap-0.5 lg:flex" aria-hidden>
                    {occs.slice(0, MAX_PILLS).map((o) => {
                      const cat = catalog.categoryById.get(o.event.category);
                      const continues = o.start !== date && o.start < date;
                      return (
                        <li key={o.key} className="min-w-0">
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              if (!onOpenOccurrence) return;
                              e.stopPropagation();
                              onOpenOccurrence(o, date);
                            }}
                            className={cn(
                              `cat-${cat?.color ?? 'brand'}`,
                              'flex w-full min-w-0 items-center gap-1 rounded-xs border-l-[3px] border-[var(--cat-solid)] bg-[var(--cat-bg)] px-1.5 py-0.5 text-left text-[11px] leading-tight font-medium text-[var(--cat-fg)]',
                              onOpenOccurrence ? 'cursor-pointer hover:brightness-95' : 'cursor-default',
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {continues && '↳ '}
                              {o.event.title}
                            </span>
                            {(() => {
                              const st = greetingStatus?.(o.event.id);
                              if (!st) return null;
                              const Icon = GREETING_STATUS_META[st].icon;
                              return <Icon className="size-3 shrink-0" aria-label={`Saludo ${GREETING_STATUS_META[st].label.toLowerCase()}`} />;
                            })()}
                          </button>
                        </li>
                      );
                    })}
                    {occs.length > MAX_PILLS && (
                      <li className="px-1.5 text-[11px] font-medium text-muted">+{occs.length - MAX_PILLS} más</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function monthTitle(year: number, month: number) {
  return `${capitalize(monthName(month))} ${year}`;
}
