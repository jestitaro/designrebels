import { useMemo } from 'react';
import { Link } from 'react-router';
import { ChevronRight, MessageSquareText } from 'lucide-react';
import { GreetingStatusBadge } from '../../components/domain/GreetingBadges';
import { GREETING_STATUS_META, GREETING_STATUSES, TONE_LABELS, TONES } from '../../components/domain/greetingMeta';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ToggleChip } from '../../components/ui/Chip';
import { Select } from '../../components/ui/Field';
import { useEvents, useGreetings } from '../../hooks/useData';
import { useSessionState } from '../../hooks/useSessionState';
import { addDays, endOfMonth, formatDate, parseISO, relativeDays, startOfMonth, todayISO } from '../../lib/dates';
import { normalizeText } from '../../lib/text';
import type { GreetingStatus, Tone } from '../../types';
import { SearchBox } from '../filters/Filters';

type DateFilter = 'todas' | '7' | '30' | 'mes' | 'pasadas' | 'sin';

const DATE_OPTIONS: Array<[DateFilter, string]> = [
  ['todas', 'Cualquier fecha'], ['7', 'Próximos 7 días'], ['30', 'Próximos 30 días'], ['mes', 'Este mes'], ['pasadas', 'Fechas pasadas'], ['sin', 'Sin fecha'],
];

export function GreetingsPage() {
  const greetings = useGreetings();
  const events = useEvents();
  const today = todayISO();
  const [statuses, setStatuses] = useSessionState<GreetingStatus[]>('greetings:status', []);
  const [tone, setTone] = useSessionState<Tone | ''>('greetings:tone', '');
  const [dateFilter, setDateFilter] = useSessionState<DateFilter>('greetings:date', 'todas');
  const [query, setQuery] = useSessionState('greetings:query', '');

  const eventById = useMemo(() => new Map((events ?? []).map((e) => [e.id, e])), [events]);
  const counts = useMemo(() => {
    const c = new Map<GreetingStatus, number>();
    for (const g of greetings ?? []) c.set(g.status, (c.get(g.status) ?? 0) + 1);
    return c;
  }, [greetings]);

  const rows = useMemo(() => {
    const { y, m } = parseISO(today);
    const q = normalizeText(query);
    return (greetings ?? [])
      .filter((g) => statuses.length === 0 || statuses.includes(g.status))
      .filter((g) => !tone || g.tone === tone)
      .filter((g) => {
        const d = g.plannedDate;
        switch (dateFilter) {
          case 'todas': return true;
          case 'sin': return !d;
          case 'pasadas': return !!d && d < today;
          case 'mes': return !!d && d >= startOfMonth(y, m) && d <= endOfMonth(y, m);
          default: return !!d && d >= today && d <= addDays(today, Number(dateFilter));
        }
      })
      .filter((g) => !q || normalizeText(`${g.internalTitle} ${g.body} ${eventById.get(g.eventId)?.title ?? ''}`).includes(q))
      .sort((a, b) => (a.plannedDate ?? '9999').localeCompare(b.plannedDate ?? '9999') || b.updatedAt.localeCompare(a.updatedAt));
  }, [greetings, statuses, tone, dateFilter, query, today, eventById]);

  if (greetings === undefined) return null;

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-3 border-b border-border bg-surface px-4 py-3 lg:px-6">
        <h1 className="text-lg font-extrabold lg:text-[22px]">Saludos</h1>
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5">
          {GREETING_STATUSES.map((s) => {
            const Icon = GREETING_STATUS_META[s].icon;
            return (
              <ToggleChip key={s} selected={statuses.includes(s)} icon={Icon}
                onClick={() => setStatuses(statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s])}>
                {GREETING_STATUS_META[s].label} <span className="text-muted tabular-nums">{counts.get(s) ?? 0}</span>
              </ToggleChip>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={query} onChange={setQuery} label="Buscar saludos" className="min-w-40 flex-1 lg:max-w-72" />
          <Select aria-label="Tono" value={tone} onChange={(e) => setTone(e.target.value as Tone | '')} className="w-auto min-w-44">
            <option value="">Todos los tonos</option>
            {TONES.map((t) => <option key={t} value={t}>{TONE_LABELS[t]}</option>)}
          </Select>
          <Select aria-label="Fecha planificada" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className="w-auto min-w-44">
            {DATE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
      </header>

      <div className="bg-surface lg:m-6 lg:rounded-lg lg:border lg:border-border lg:shadow-sm">
        {greetings.length === 0 ? (
          <EmptyState icon={MessageSquareText} title="Todavía no hay saludos"
            description="Los saludos se crean desde un evento: abrí uno en el calendario y tocá “Crear saludo”."
            action={<Link to="/proximos" className="inline-flex h-10 items-center rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Ver próximos eventos</Link>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={MessageSquareText} title="Ningún saludo coincide"
            action={<Button onClick={() => { setStatuses([]); setTone(''); setDateFilter('todas'); setQuery(''); }}>Limpiar filtros</Button>} />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((g) => {
              const event = eventById.get(g.eventId);
              return (
                <li key={g.id}>
                  <Link to={`/saludos/${g.id}`} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus lg:px-5">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-medium">{g.internalTitle || 'Saludo sin título'}</span>
                      <span className="line-clamp-2 text-[13px] text-muted">{g.body || 'Sin texto todavía.'}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <GreetingStatusBadge status={g.status} />
                        <Badge>{TONE_LABELS[g.tone]}</Badge>
                        {g.channel && <Badge>{g.channel}</Badge>}
                        {g.plannedDate && <span>{formatDate(g.plannedDate)} · {relativeDays(today, g.plannedDate)}</span>}
                        {event && <span>· {event.title}</span>}
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="mt-1 size-4 shrink-0 text-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
