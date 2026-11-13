import { Plus } from 'lucide-react';
import { eventTitle, type Catalog } from '../../hooks/useData';
import { capitalize, formatDayMonth, parseISO, weekDays, WEEKDAYS } from '../../lib/dates';
import { cn } from '../../lib/cn';
import type { GreetingStatus, ISODate, Occurrence } from '../../types';
import { GREETING_STATUS_META } from '../../components/domain/greetingMeta';

interface WeekViewProps {
  anchor: ISODate;
  today: ISODate;
  selected: ISODate;
  byDay: Map<ISODate, Occurrence[]>;
  catalog: Catalog;
  onSelectDay: (d: ISODate) => void;
  onOpen: (occ: Occurrence, day: ISODate) => void;
  onCreate: (d: ISODate) => void;
  greetingStatus?: (eventId: string) => GreetingStatus | null;
}

export function WeekView({ anchor, today, selected, byDay, catalog, onSelectDay, onOpen, onCreate, greetingStatus }: WeekViewProps) {
  const days = weekDays(anchor);
  return (
    <ol className="grid flex-1 grid-cols-1 lg:grid-cols-7 lg:divide-x lg:divide-border">
      {days.map((day, i) => {
        const occs = byDay.get(day) ?? [];
        const isToday = day === today;
        return (
          <li key={day} className={cn('flex min-w-0 flex-col border-b border-border lg:min-h-full lg:border-b-0', day === selected && 'bg-primary-soft/40')}>
            <div className="flex items-center gap-1 pt-3 pr-1 pb-2 pl-3 lg:pl-2">
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                aria-label={`${capitalize(WEEKDAYS[i]!)} ${formatDayMonth(day)}${isToday ? ', hoy' : ''}. Ver día`}
                aria-current={isToday ? 'date' : undefined}
                className="flex min-w-0 items-center gap-1.5 rounded text-left focus-visible:outline-2 focus-visible:outline-focus"
              >
                <span className={cn('flex size-8 items-center justify-center rounded-full text-sm font-semibold', isToday ? 'bg-brand-grad text-white' : 'text-text')}>
                  {parseISO(day).d}
                </span>
                <span className="text-xs font-medium text-muted uppercase">{WEEKDAYS[i]!.slice(0, 3)}</span>
              </button>
              <span className="min-w-0 flex-1" />
              <button
                type="button"
                onClick={() => onCreate(day)}
                aria-label={`Crear evento el ${formatDayMonth(day)}`}
                title="Crear evento"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded text-subtle hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:size-11"
              >
                <Plus aria-hidden className="size-4" />
              </button>
            </div>
            <ul className="flex flex-col gap-1.5 px-2 pb-3">
              {occs.length === 0 && <li className="px-1 text-xs text-subtle">Sin eventos</li>}
              {occs.map((o) => {
                const cat = catalog.categoryById.get(o.event.category);
                return (
                  <li key={o.key}>
                    <button
                      type="button"
                      onClick={() => onOpen(o, day)}
                      className={cn(
                        `cat-${cat?.color ?? 'brand'}`,
                        'flex w-full flex-col gap-0.5 rounded-xs border-l-[3px] border-[var(--cat-solid)] bg-[var(--cat-bg)] px-2 py-1.5 text-left text-[var(--cat-fg)]',
                        'hover:brightness-95 focus-visible:outline-2 focus-visible:outline-focus',
                      )}
                    >
                      <span className="text-[13px] leading-snug font-medium">{eventTitle(o.event, catalog)}</span>
                      <span className="flex items-center gap-1 text-[11px] opacity-90">
                        {o.start !== o.end && <span>{formatDayMonth(o.start)}–{formatDayMonth(o.end)}</span>}
                        {(() => {
                          const st = greetingStatus?.(o.event.id);
                          if (!st) return null;
                          const Icon = GREETING_STATUS_META[st].icon;
                          return <span className="inline-flex items-center gap-0.5">· <Icon aria-hidden className="size-3" />{GREETING_STATUS_META[st].label}</span>;
                        })()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
