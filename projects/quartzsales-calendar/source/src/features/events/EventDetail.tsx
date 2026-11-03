import { useState, type ReactNode } from 'react';
import {
  Archive, ArchiveRestore, ArrowLeft, CalendarDays, CalendarX2, Copy, CopyPlus, ExternalLink, Lightbulb, MapPin, Pencil, Star, Trash2,
} from 'lucide-react';
import { placeLabel, useCatalog, useEvent } from '../../hooks/useData';
import { capitalize, formatDate, formatLong, formatRange, relativeDays, todayISO } from '../../lib/dates';
import { eventToPlainText } from '../../lib/eventText';
import { describeRecurrence, nextOccurrence, occurrencesInRange } from '../../lib/recurrence';
import { cn } from '../../lib/cn';
import type { CalendarEvent, ISODate, Occurrence } from '../../types';
import { CategoryBadge, RelevanceBadge, VerificationBadge } from '../../components/domain/Badges';
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
  onDuplicated?: (copy: CalendarEvent) => void;
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

export function EventDetail({ eventId, occurrenceDate, onBack, backLabel = 'Volver', onDeleted, onDuplicated, extra, className }: EventDetailProps) {
  const event = useEvent(eventId);
  const catalog = useCatalog();
  const editor = useEventEditor();
  const actions = useEventActions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const today = todayISO();

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
  const sub = category?.subcategories.find((s) => s.id === event.subcategory);
  const occ = resolveOccurrence(event, occurrenceDate, today);

  async function onCopy() {
    const text = eventToPlainText(event!, catalog, occ);
    if (!(await actions.copy(text))) setManualCopy(text);
  }

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
          {sub && <Badge>{sub.name}</Badge>}
          {event.archived && <Badge icon={Archive}>Archivado</Badge>}
          {event.provenance === 'seed' && <Badge tone="neutral">{event.userModified ? 'Catálogo · editado' : 'Catálogo inicial'}</Badge>}
        </div>
        <div className="flex items-start gap-2">
          <h2 id="event-detail-title" className="min-w-0 flex-1 text-xl leading-snug font-semibold">{event.title}</h2>
          <IconButton
            icon={Star}
            label={event.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            pressed={event.favorite}
            onClick={() => void actions.toggleFavorite(event)}
            className={cn(event.favorite && 'text-warning [&_svg]:fill-current')}
          />
        </div>
        {event.summary && <p className="text-sm text-muted">{event.summary}</p>}
        <div className="flex flex-wrap gap-1.5">
          <RelevanceBadge relevance={event.relevance} />
          <VerificationBadge verification={event.verification} />
          <Badge>{capitalize(event.editorialStatus)}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="primary" size="sm" icon={Pencil} onClick={() => editor.openEdit(event)}>Editar</Button>
          <Button size="sm" icon={Copy} onClick={() => void onCopy()}>Copiar info</Button>
          <Button size="sm" icon={CopyPlus} onClick={async () => { const c = await actions.duplicate(event); onDuplicated?.(c); }}>Duplicar</Button>
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
          {!event.allDay && event.startTime && (
            <p className="text-muted">Horario: {event.startTime}{event.endTime ? `–${event.endTime}` : ''} h ({event.timezone})</p>
          )}
          {event.holidayObservances.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {event.holidayObservances.map((o) => (
                <li key={`${o.year}-${o.date}`} className="text-muted">
                  <span className="font-medium text-text">Feriado trasladado {o.year}:</span> {formatDate(o.date)}
                  {o.note ? ` — ${o.note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="Lugar" icon={MapPin}>{placeLabel(event, catalog)}</Block>

        {event.description && <Block title="Descripción">{event.description}</Block>}
        {event.history && <Block title="Origen e historia">{event.history}</Block>}
        {event.traditions && <Block title="Tradiciones">{event.traditions}</Block>}

        {event.contentIdeas.length > 0 && (
          <Block title="Ideas de contenido" icon={Lightbulb}>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {event.contentIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
            </ul>
          </Block>
        )}

        <Block title="Fuente y verificación">
          {event.source || event.sourceUrl ? (
            <p>
              {event.source}
              {event.sourceUrl && (
                <>
                  {event.source ? ' · ' : ''}
                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                    Abrir fuente <ExternalLink aria-hidden className="size-3.5" />
                    <span className="sr-only">(se abre en otra pestaña)</span>
                  </a>
                </>
              )}
            </p>
          ) : (
            <p className="text-muted">Sin fuente cargada.</p>
          )}
          <p className="text-muted">
            {event.lastVerifiedAt ? `Última verificación: ${formatDate(event.lastVerifiedAt)}` : 'Sin fecha de verificación.'}
          </p>
          {event.verification !== 'confirmado' && event.verificationNote && (
            <p className="mt-1 rounded bg-warning-bg px-3 py-2 text-warning">Falta confirmar: {event.verificationNote}</p>
          )}
        </Block>

        {event.imageUrl && (
          <Block title="Imagen de referencia">
            <a href={event.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium break-all text-accent hover:underline">
              {event.imageUrl} <ExternalLink aria-hidden className="size-3.5 shrink-0" />
            </a>
          </Block>
        )}

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
