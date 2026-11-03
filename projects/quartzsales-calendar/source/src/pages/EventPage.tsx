import { useNavigate, useParams, useSearchParams } from 'react-router';
import { EventDetail } from '../features/events/EventDetail';

/** Detalle a pantalla completa (mobile y accesos desde dashboard/biblioteca). */
export function EventPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/calendario'));
  return (
    <div className="mx-auto w-full max-w-3xl bg-surface lg:my-6 lg:rounded-lg lg:border lg:border-border lg:shadow-sm">
      <EventDetail
        key={id}
        eventId={id}
        occurrenceDate={params.get('fecha') ?? undefined}
        onBack={back}
        onDeleted={back}
        onDuplicated={(c) => navigate(`/eventos/${c.id}`, { replace: true })}
      />
    </div>
  );
}
