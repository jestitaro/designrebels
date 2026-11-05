import { useState, type ReactNode } from 'react';
import {
  Archive, ArchiveRestore, ArrowLeft, CalendarArrowDown, CalendarDays, CalendarX2, ChevronRight, MessageSquarePlus, MessageSquareText,  ExternalLink, ImageIcon, MapPin, Pencil, Star, Trash2,
} from 'lucide-react';
import { placeLabel, useCatalog, useEvent, useGreetingsMap } from '../../hooks/useData';
import { GreetingStatusBadge } from '../../components/domain/GreetingBadges';
import { useCreateGreeting } from '../greetings/useCreateGreeting';
import { useIcsExport } from '../reminders/useIcsExport';
import { Link } from 'react-router';
import { capitalize, formatDate, formatLong, formatRange, relativeDays, todayISO } from '../../lib/dates';
import { describeRecurrence, nextOccurrence, occurrencesInRange } from '../../lib/recurrence';
import { cn } from '../../lib/cn';
import type { CalendarEvent, ISODate, Occurrence } from '../../types';
import { CategoryBadge } from '../../components/domain/Badges';
import { Badge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ManualCopyDialog } from '../../components/ui/ManualCopyDialog';
import { useEventEditor } from './EventEditor';
import { useEventActions } from './useEventActions';

interface EventDetailProps {
  eventId: string;
  /** Fecha de la ocurrencia elegida en el calendario (si se abrió desde un día). */
  occurrenceDate?: ISODate;
  onBack?: () => void;
  backLabel?: string;
  onDeleted?: () => void;
  /** Contenido extra (saludos asociados) debajo de la ficha. */
  extra?: (event: CalendarEvent) => ReactNode;
  className?: string;
}

function resolveOccurrence(event: CalendarEvent, date: ISODate | undefined, today: ISODate): Occurrence | null {
  if (date) {
    const match = occurrencesInRange(event, date, date)[0];
    if (match) return match;
  }
  return nextOccurrence(event, today);
}

function Block({ title, icon: Icon, children }: { title: string; icon?: typeof MapPin; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        {Icon && <Icon aria-hidden className="size-3.5" />}
        {title}
      </h3>
      <div className="text-sm leading-relaxed whitespace-pre-line text-text">{children}</div>
    </section>
  );
}

export function EventDetail({ eventId, occurrenceDate, onBack, backLabel = 'Volver', onDeleted, extra, className }: EventDetailProps) {
  const event = useEvent(eventId);
  const catalog = useCatalog();
  const editor = useEventEditor();
  const actions = useEventActions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const today = todayISO();
  const gMap = useGreetingsMap();
  const createGreeting = useCreateGreeting();
  const { exportEvents } = useIcsExport();

  if (event === undefined) return null;
  if (event === null) {
    return (
      <div className={className}>
        {onBack && (
          <div className="p-3">
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>{backLabel}</Button>
          </div>
        )}
        <EmptyState icon={CalendarX2} title="Este evento ya no existe" description="Puede que lo hayas eliminado." />
      </div>
    );
  }

  const category = catalog.categoryById.get(event.category);
  const occ = resolveOccurrence(event, occurrenceDate, today);



  return (
    <article className={cn(`cat-${category?.color ?? 'brand'}`, 'flex flex-col', className)} aria-labelledby="event-detail-title">
      <div className="flex flex-col gap-3 border-b border-border px-4 pt-3 pb-4 lg:px-6">
        {onBack && (
          <div className="-ml-2">
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>{backLabel}</Button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={category} />
          {event.archived && <Badge icon={Archive}>Archivado</Badge>}
        </div>
        <div className="flex items-start gap-2">
          <h2 id="event-detail-title" className="min-w-0 flex-1 text-xl leading-snug font-extrabold">{event.title}</h2>
          <IconButton
            icon={Star}
            label={event.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            pressed={event.favorite}
            onClick={() => void actions.toggleFavorite(event)}
            className={cn(event.favorite && 'text-warning [&_svg]:fill-current')}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="primary" size="sm" icon={Pencil} onClick={() => editor.openEdit(event)}>Editar</Button>
          <Button size="sm" icon={MessageSquarePlus} onClick={() => void createGreeting(event, occ?.start)}>Crear saludo</Button>
          <Button size="sm" variant="ghost" icon={CalendarArrowDown} onClick={() => exportEvents([event], `${event.title.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.ics`, 365 * 3)}>
            Exportar .ics
          </Button>
          <Button size="sm" icon={event.archived ? ArchiveRestore : Archive} onClick={() => void actions.toggleArchive(event)}>
            {event.archived ? 'Desarchivar' : 'Archivar'}
          </Button>
          <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>Eliminar</Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 py-5 lg:px-6">
        <Block title="Fecha" icon={CalendarDays}>
          {occ && (
            <p className="font-medium">
              {occ.start === occ.end ? capitalize(formatLong(occ.start)) : `Del ${formatRange(occ.start, occ.end)}`}
              <span className="font-normal text-muted"> · {relativeDays(today, occ.start)}</span>
            </p>
          )}
          <p className="text-muted">{describeRecurrence(event)}</p>
          {event.holidayObservances.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {event.holidayObservances.map((o) => (
                <li key={`${o.year}-${o.date}`} className="text-muted">
                  <span className="font-medium text-text">Feriado trasladado {o.year}:</span> {formatDate(o.date)}
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="Lugar" icon={MapPin}>{placeLabel(event, catalog)}</Block>

        {event.imageUrl && (
          <Block title="Imagen" icon={ImageIcon}>
            <a href={event.imageUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold break-all text-accent hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              Abrir imagen <ExternalLink aria-hidden className="size-3.5 shrink-0" />
              <span className="sr-only">(se abre en otra pestaña)</span>
            </a>
          </Block>
        )}

        <section className="flex flex-col gap-2" aria-labelledby="event-greetings-title">
          <h3 id="event-greetings-title" className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
            <MessageSquareText aria-hidden className="size-3.5" />Saludos
          </h3>
          {(gMap.get(event.id) ?? []).length === 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded border border-dashed border-border-strong px-3 py-3 text-[13px] text-muted">
              <span className="flex-1">Todavía no hay saludos para este evento.</span>
              <Button size="sm" icon={MessageSquarePlus} onClick={() => void createGreeting(event, occ?.start)}>Crear saludo</Button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded border border-border">
              {(gMap.get(event.id) ?? []).map((g) => (
                <li key={g.id}>
                  <Link to={`/saludos/${g.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-medium">{g.internalTitle || 'Saludo sin título'}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <GreetingStatusBadge status={g.status} />
                        {g.plannedDate && ` · ${formatDate(g.plannedDate)}`}
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {extra?.(event)}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar este evento?"
        description={
          <>
            Se elimina <strong className="text-text">{event.title}</strong> y sus saludos asociados. No se puede deshacer.
            {event.provenance === 'seed' && ' Al ser del catálogo inicial, no va a volver a aparecer con las actualizaciones. Si solo querés ocultarlo, archivalo.'}
          </>
        }
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await actions.remove(event);
          onDeleted?.();
        }}
      />
      <ManualCopyDialog text={manualCopy} onClose={() => setManualCopy(null)} />
    </article>
  );
}
