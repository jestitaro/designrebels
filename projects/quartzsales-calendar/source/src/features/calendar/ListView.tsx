import { CalendarSearch } from 'lucide-react';
import type { Catalog } from '../../hooks/useData';
import { eventTitle, placeLabel } from '../../hooks/useData';
import { capitalize, formatDayMonth, formatLong } from '../../lib/dates';
import { cn } from '../../lib/cn';
import type { ISODate, Occurrence } from '../../types';
import { CategoryBadge } from '../../components/domain/Badges';
import { EmptyState } from '../../components/ui/EmptyState';
import type { ReactNode } from 'react';

interface ListViewProps {
  days: Array<[ISODate, Occurrence[]]>;
  today: ISODate;
  catalog: Catalog;
  onOpen: (occ: Occurrence, day: ISODate) => void;
  emptyAction?: ReactNode;
  /** Indicador opcional por ocurrencia (estado del saludo). */
  renderMeta?: (occ: Occurrence) => ReactNode;
}

export function ListView({ days, today, catalog, onOpen, emptyAction, renderMeta }: ListViewProps) {
  if (days.length === 0) {
    return <EmptyState icon={CalendarSearch} title="No hay eventos en este período" description="Probá con otro mes o revisá los filtros." action={emptyAction} />;
  }
  return (
    <ol className="flex flex-col">
      {days.map(([day, occs]) => (
        <li key={day} className="border-b border-border last:border-b-0">
          <h3 className={cn('sticky top-0 z-[1] bg-surface-2/95 px-4 py-1.5 text-xs font-semibold backdrop-blur lg:px-5', day === today ? 'text-accent' : 'text-muted')}>
            {capitalize(formatLong(day))}{day === today ? ' · Hoy' : ''}
          </h3>
          <ul>
            {occs.map((o) => {
              const cat = catalog.categoryById.get(o.event.category);
              return (
                <li key={o.key}>
                  <button
                    type="button"
                    onClick={() => onOpen(o, day)}
                    className={cn(`cat-${cat?.color ?? 'brand'}`, 'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus lg:px-5')}
                  >
                    <span aria-hidden className="mt-1 size-2.5 shrink-0 rounded-full bg-[var(--cat-solid)]" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-medium">{eventTitle(o.event, catalog)}</span>
                      <span className="text-xs text-muted">
                        {placeLabel(o.event, catalog)}
                        {o.start !== o.end && ` · del ${formatDayMonth(o.start)} al ${formatDayMonth(o.end)}`}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        <CategoryBadge category={cat} />
                        {renderMeta?.(o)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
