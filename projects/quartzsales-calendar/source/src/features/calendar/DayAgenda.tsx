import { CalendarX2, ChevronRight, MapPin } from 'lucide-react';
import { placeLabel, type Catalog } from '../../hooks/useData';
import { capitalize, formatDayMonth, formatLong } from '../../lib/dates';
import { cn } from '../../lib/cn';
import type { Greeting, ISODate, Occurrence } from '../../types';
import { EventGreetingBadge } from '../../components/domain/GreetingBadges';
import { CategoryBadge, RelevanceBadge, VerificationBadge } from '../../components/domain/Badges';
import { EmptyState } from '../../components/ui/EmptyState';
import type { ReactNode } from 'react';

interface DayAgendaProps {
  date: ISODate;
  today: ISODate;
  occurrences: Occurrence[];
  catalog: Catalog;
  onOpen?: (occ: Occurrence) => void;
  emptyAction?: ReactNode;
  headerAction?: ReactNode;
  greetingsMap?: Map<string, Greeting[]>;
}

export function DayAgenda({ date, today, occurrences, catalog, onOpen, emptyAction, headerAction, greetingsMap }: DayAgendaProps) {
  return (
    <section aria-labelledby="day-agenda-title" className="flex flex-col">
      <header className="flex items-center gap-2 px-4 pt-4 pb-2 lg:px-5">
        <div className="min-w-0 flex-1">
          <h2 id="day-agenda-title" className="text-[15px] font-semibold">
            {capitalize(formatLong(date))}
          </h2>
          <p className="text-xs text-muted">
            {date === today ? 'Hoy · ' : ''}
            {occurrences.length === 0 ? 'Sin eventos' : occurrences.length === 1 ? '1 evento' : `${occurrences.length} eventos`}
          </p>
        </div>
        {headerAction}
      </header>
      {occurrences.length === 0 ? (
        <EmptyState compact icon={CalendarX2} title="No hay eventos este día" action={emptyAction} />
      ) : (
        <ul className="flex flex-col gap-2 px-4 pb-4 lg:px-5">
          {occurrences.map((occ) => (
            <li key={occ.key}>
              <AgendaItem occ={occ} catalog={catalog} onOpen={onOpen} greetings={greetingsMap?.get(occ.event.id)} showGreeting={!!greetingsMap} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgendaItem({ occ, catalog, onOpen, greetings, showGreeting }: { occ: Occurrence; catalog: Catalog; onOpen?: (occ: Occurrence) => void; greetings?: Greeting[]; showGreeting?: boolean }) {
  const { event } = occ;
  const category = catalog.categoryById.get(event.category);
  const multi = occ.start !== occ.end;
  const content = (
    <>
      <span aria-hidden className="w-1 shrink-0 self-stretch rounded-full bg-[var(--cat-solid)]" />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 font-medium text-text">{event.title}</span>
          {onOpen && <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle" />}
        </span>
        {event.summary && <span className="line-clamp-2 text-[13px] text-muted">{event.summary}</span>}
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden className="size-3.5" />
            {placeLabel(event, catalog)}
          </span>
          {multi && <span>Del {formatDayMonth(occ.start)} al {formatDayMonth(occ.end)}</span>}
          {!event.allDay && event.startTime && (
            <span>
              {event.startTime}
              {event.endTime ? `–${event.endTime}` : ''} h
            </span>
          )}
        </span>
        <span className="flex flex-wrap gap-1.5">
          <CategoryBadge category={category} />
          <RelevanceBadge relevance={event.relevance} compact />
          <VerificationBadge verification={event.verification} />
          {showGreeting && <EventGreetingBadge greetings={greetings} />}
        </span>
      </span>
    </>
  );
  const cls = cn(
    `cat-${category?.color ?? 'brand'}`,
    'flex w-full gap-3 rounded border border-border bg-surface p-3 text-left',
  );
  if (!onOpen) return <div className={cls}>{content}</div>;
  return (
    <button
      type="button"
      onClick={() => onOpen(occ)}
      className={cn(cls, 'transition-colors hover:bg-surface-2 active:bg-surface-3 focus-visible:outline-2 focus-visible:outline-focus')}
    >
      {content}
    </button>
  );
}
