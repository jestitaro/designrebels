import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { PartyPopper, Plane, TreePalm, Users } from 'lucide-react';
import { placeLabel, useCatalog, useEvents, usePeople, useVacations, type Catalog } from '../../hooks/useData';
import { formatDayMonth } from '../../lib/dates';
import { personInitials, teamForDay } from '../../lib/team';
import { cn } from '../../lib/cn';
import type { ISODate, Person } from '../../types';
import { categoryIcon } from '../../components/domain/meta';
import { EmptyState } from '../../components/ui/EmptyState';

function PersonChip({ person, catalog, extra }: { person: Person; catalog: Catalog; extra?: ReactNode }) {
  const role = person.roles[0]?.title;
  return (
    <li className="flex items-center gap-2.5 py-1">
      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-grad text-[11px] font-extrabold text-white">
        {personInitials(person)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold">{person.name}</span>
        <span className="block truncate text-xs text-muted">
          {[role, person.city ?? placeLabel({ country: person.country, region: person.region }, catalog)].filter(Boolean).join(' · ')}
          {extra}
        </span>
      </span>
    </li>
  );
}

function Group({ icon: Icon, title, count, children }: { icon: typeof Users; title: string; count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="flex items-center gap-1.5 font-data text-[11px] font-bold tracking-[0.06em] text-muted uppercase">
        <Icon aria-hidden className="size-3.5" />
        {title}
        <span className="rounded-full bg-surface-3 px-1.5 text-[10px] text-text tabular-nums">{count}</span>
      </h3>
      {children}
    </section>
  );
}

/** Quiénes saludar, quiénes están de feriado y quiénes de vacaciones en un día. */
export function TeamDay({ date, compact, className }: { date: ISODate; compact?: boolean; className?: string }) {
  const events = useEvents();
  const people = usePeople();
  const vacations = useVacations();
  const catalog = useCatalog();
  const day = useMemo(() => teamForDay(date, events ?? [], people ?? [], vacations ?? []), [date, events, people, vacations]);

  if (!people || !events || !vacations) return null;
  if (people.length === 0) {
    return (
      <EmptyState compact className={className} icon={Users} title="Todavía no cargaste el equipo"
        description="Cargalo o importalo en Configuración para ver a quién saludar, quién está de feriado y quién de vacaciones."
        action={<Link to="/configuracion" className="text-[13px] font-bold text-accent hover:underline">Ir a Configuración</Link>} />
    );
  }

  const nothing = day.greet.length === 0 && day.holiday.length === 0 && day.vacation.length === 0;
  if (nothing) {
    return <p className={cn('px-4 py-3 text-[13px] text-muted', className)}>Ese día no hay a quién saludar y todo el equipo trabaja.</p>;
  }

  return (
    <div className={cn('flex flex-col gap-4', compact ? 'px-4 pb-4 lg:px-5' : 'p-4', className)}>
      {day.greet.length > 0 && (
        <Group icon={PartyPopper} title="A quién saludar" count={new Set(day.greet.flatMap((g) => g.people.map((p) => p.id))).size}>
          {day.greet.map(({ occurrence, people: list }) => {
            const cat = catalog.categoryById.get(occurrence.event.category);
            const Icon = categoryIcon(occurrence.event.category);
            return (
              <div key={occurrence.key} className={cn(`cat-${cat?.color ?? 'brand'}`, 'mt-1 rounded border border-border p-2.5')}>
                <Link to={`/eventos/${occurrence.event.id}?fecha=${occurrence.start}`}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--cat-fg)] hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                  <Icon aria-hidden className="size-3.5" />
                  {occurrence.event.title}
                  <span className="font-normal text-muted">· {list.length === (people?.filter((p) => p.active).length ?? 0) ? 'todo el equipo' : `${list.length} ${list.length === 1 ? 'persona' : 'personas'}`}</span>
                </Link>
                <ul className={cn('mt-1', compact ? 'grid grid-cols-1' : 'grid gap-x-4 sm:grid-cols-2')}>
                  {list.map((p) => <PersonChip key={p.id} person={p} catalog={catalog} />)}
                </ul>
              </div>
            );
          })}
        </Group>
      )}

      {day.holiday.length > 0 && (
        <Group icon={TreePalm} title="De feriado" count={day.holiday.reduce((n, h) => n + h.people.length, 0)}>
          {day.holiday.map(({ event, people: list }) => (
            <div key={event.id} className="mt-1">
              <p className="text-xs text-muted">{event.title} · {catalog.placeName(event.country)}</p>
              <ul className={cn(compact ? 'grid grid-cols-1' : 'grid gap-x-4 sm:grid-cols-2')}>
                {list.map((p) => <PersonChip key={p.id} person={p} catalog={catalog} />)}
              </ul>
            </div>
          ))}
        </Group>
      )}

      {day.vacation.length > 0 && (
        <Group icon={Plane} title="De vacaciones" count={day.vacation.length}>
          <ul className={cn(compact ? 'grid grid-cols-1' : 'grid gap-x-4 sm:grid-cols-2')}>
            {day.vacation.map(({ person, vacation }) => (
              <PersonChip key={vacation.id} person={person} catalog={catalog}
                extra={<span> · hasta el {formatDayMonth(vacation.end)}</span>} />
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}
