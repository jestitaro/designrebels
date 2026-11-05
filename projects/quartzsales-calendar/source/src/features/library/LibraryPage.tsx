import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Archive, ArchiveRestore, ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Library, Plus, Star, Trash2, Upload, X,
} from 'lucide-react';
import { CategoryBadge } from '../../components/domain/Badges';
import { Badge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { deleteEvents, updateEvents } from '../../db/repo';
import { placeLabel, useCatalog, useEvents, useGreetings } from '../../hooks/useData';
import { useSessionState } from '../../hooks/useSessionState';
import { formatDate, todayISO } from '../../lib/dates';
import { applyFilters, EMPTY_FILTERS, greetingsByEvent, type EventFilters } from '../../lib/filters';
import { nextOccurrence } from '../../lib/recurrence';
import { cn } from '../../lib/cn';
import type { CalendarEvent } from '../../types';
import { useEventEditor } from '../events/EventEditor';
import { ActiveFilterChips, FiltersButton, SearchBox } from '../filters/Filters';
import { CsvImportDialog } from '../data/CsvImportDialog';
import { useDataTransfer } from '../data/useDataTransfer';

type SortKey = 'title' | 'next' | 'category' | 'country' | 'updatedAt';
const PAGE_SIZE = 50;

export function LibraryPage() {
  const events = useEvents();
  const greetings = useGreetings();
  const catalog = useCatalog();
  const editor = useEventEditor();
  const navigate = useNavigate();
  const toast = useToast();
  const today = todayISO();
  const [filters, setFilters] = useSessionState<EventFilters>('library:filters', EMPTY_FILTERS);
  const [sort, setSort] = useSessionState<{ key: SortKey; dir: 1 | -1 }>('library:sort', { key: 'next', dir: 1 });
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const transfer = useDataTransfer(catalog);

  const gMap = useMemo(() => greetingsByEvent(greetings ?? []), [greetings]);
  const rows = useMemo(() => {
    const filtered = applyFilters(events ?? [], filters, gMap);
    const withNext = filtered.map((e) => ({ event: e, next: nextOccurrence(e, today)?.start ?? '9999-12-31' }));
    const cmp = (a: (typeof withNext)[number], b: (typeof withNext)[number]): number => {
      const ea = a.event;
      const eb = b.event;
      switch (sort.key) {
        case 'title': return ea.title.localeCompare(eb.title, 'es');
        case 'next': return a.next.localeCompare(b.next);
        case 'category': return (catalog.categoryById.get(ea.category)?.name ?? '').localeCompare(catalog.categoryById.get(eb.category)?.name ?? '', 'es');
        case 'country': return placeLabel(ea, catalog).localeCompare(placeLabel(eb, catalog), 'es');
        case 'updatedAt': return ea.updatedAt.localeCompare(eb.updatedAt);
      }
    };
    return withNext.sort((a, b) => cmp(a, b) * sort.dir || a.event.title.localeCompare(b.event.title, 'es'));
  }, [events, filters, gMap, sort, catalog, today]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const pageRows = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const visibleIds = useMemo(() => new Set(rows.map((r) => r.event.id)), [rows]);
  const selectedIds = [...selection].filter((id) => visibleIds.has(id));
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selection.has(r.event.id));
  const somePageSelected = pageRows.some((r) => selection.has(r.event.id));

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);
  useEffect(() => setPage(0), [filters]);

  const toggleOne = (id: string) =>
    setSelection((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const togglePage = () =>
    setSelection((s) => {
      const n = new Set(s);
      for (const r of pageRows) {
        if (allPageSelected) n.delete(r.event.id);
        else n.add(r.event.id);
      }
      return n;
    });

  async function bulk(changes: Partial<CalendarEvent>, message: string) {
    await updateEvents(selectedIds, changes);
    toast.success(`${message} (${selectedIds.length}).`);
  }

  function sortHeader(k: SortKey, children: string, className?: string) {
    const active = sort.key === k;
    const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th key={k} scope="col" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cn('px-3 py-2 text-left', className)}>
        <button type="button" onClick={() => setSort(active ? { key: k, dir: sort.dir === 1 ? -1 : 1 } : { key: k, dir: 1 })}
          className={cn('inline-flex items-center gap-1 rounded text-xs font-semibold tracking-wide uppercase hover:text-text focus-visible:outline-2 focus-visible:outline-focus', active ? 'text-text' : 'text-muted')}>
          {children}
          <Icon aria-hidden className="size-3.5" />
        </button>
      </th>
    );
  }

  const openEvent = (id: string) => navigate(`/eventos/${id}`);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-2 border-b border-border bg-surface px-4 py-3 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-lg font-extrabold lg:text-[22px]">Biblioteca de eventos</h1>
          <Button size="sm" icon={Upload} onClick={() => void transfer.importCsv()}>Importar CSV</Button>
          <Button size="sm" icon={Download} onClick={() => transfer.exportCsv(rows.map((r) => r.event))}>Exportar CSV</Button>
          <Button size="sm" variant="primary" icon={Plus} onClick={() => editor.openCreate()}>Nuevo evento</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={filters.query} onChange={(query) => setFilters({ ...filters, query })} className="min-w-40 flex-1 lg:max-w-80" />
          <FiltersButton filters={filters} onChange={setFilters} catalog={catalog} resultCount={rows.length} />
          <label className="flex items-center gap-2 text-[13px] text-muted lg:hidden">
            <span>Ordenar</span>
            <select value={`${sort.key}:${sort.dir}`} onChange={(e) => { const [k, d] = e.target.value.split(':'); setSort({ key: k as SortKey, dir: Number(d) as 1 | -1 }); }}
              className="h-9 rounded border border-border-strong bg-surface px-2 text-[13px] text-text pointer-coarse:h-11">
              <option value="next:1">Próxima fecha</option>
              <option value="title:1">Nombre A–Z</option>
              <option value="updatedAt:-1">Editados recientemente</option>
            </select>
          </label>
        </div>
        <ActiveFilterChips filters={filters} onChange={setFilters} catalog={catalog} />
        <p className="text-xs text-muted" role="status">{rows.length} {rows.length === 1 ? 'evento' : 'eventos'}</p>
      </header>

      {selectedIds.length > 0 && (
        <div role="region" aria-label="Acciones masivas" className="sticky top-14 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-primary-soft px-4 py-2 lg:top-0 lg:px-6">
          <span className="text-[13px] font-semibold text-primary-soft-fg">{selectedIds.length} seleccionados</span>
          <IconButton icon={X} label="Quitar selección" size="sm" onClick={() => setSelection(new Set())} />
          <span className="flex-1" />
          <Button size="sm" icon={Star} onClick={() => void bulk({ favorite: true }, 'Marcados como favoritos')}>Favorito</Button>
          <Button size="sm" icon={Archive} onClick={() => void bulk({ archived: true }, 'Archivados')}>Archivar</Button>
          <Button size="sm" icon={ArchiveRestore} onClick={() => void bulk({ archived: false }, 'Desarchivados')}>Desarchivar</Button>
          <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>Eliminar</Button>
        </div>
      )}

      <div className="flex-1 bg-surface lg:m-4 lg:rounded-lg lg:border lg:border-border lg:shadow-sm">
        {events && events.length === 0 ? (
          <EmptyState icon={Library} title="Todavía no hay eventos" description="Creá el primero, importá un CSV o restaurá un respaldo desde Configuración."
            action={<Button variant="primary" icon={Plus} onClick={() => editor.openCreate()}>Nuevo evento</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Library} title="Ningún evento coincide" description="Probá con otra búsqueda o limpiá los filtros."
            action={<Button onClick={() => setFilters(EMPTY_FILTERS)}>Limpiar filtros</Button>} />
        ) : (
          <>
            {/* Desktop: tabla */}
            <table className="hidden w-full text-sm lg:table">
              <caption className="sr-only">Eventos, ordenables por columna</caption>
              <thead className="border-b border-border">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2">
                    <input ref={selectAllRef} type="checkbox" aria-label="Seleccionar todos los de esta página" checked={allPageSelected} onChange={togglePage} className="size-4 accent-[var(--qs-primary)]" />
                  </th>
                  {sortHeader('title', 'Nombre')}
                  {sortHeader('next', 'Próxima fecha')}
                  {sortHeader('category', 'Categoría')}
                  {sortHeader('country', 'Lugar')}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ event: e, next }) => (
                  <tr key={e.id} className={cn('border-b border-border last:border-b-0 hover:bg-surface-2', selection.has(e.id) && 'bg-primary-soft/50')}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" aria-label={`Seleccionar ${e.title}`} checked={selection.has(e.id)} onChange={() => toggleOne(e.id)} className="size-4 accent-[var(--qs-primary)]" />
                    </td>
                    <td className="max-w-80 px-3 py-2.5">
                      <button type="button" onClick={() => openEvent(e.id)} className="text-left font-medium hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                        {e.title}
                      </button>
                      <span className="ml-1.5 inline-flex gap-1 align-middle">
                        {e.favorite && <Star aria-label="Favorito" className="size-3.5 fill-current text-warning" />}
                        {e.archived && <Badge icon={Archive}>Archivado</Badge>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted">{next === '9999-12-31' ? '—' : formatDate(next)}</td>
                    <td className="px-3 py-2.5"><CategoryBadge category={catalog.categoryById.get(e.category)} /></td>
                    <td className="px-3 py-2.5 text-muted">{placeLabel(e, catalog)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: lista */}
            <ul className="flex flex-col lg:hidden">
              <li className="flex items-center gap-3 border-b border-border px-4 py-2">
                <input type="checkbox" checked={allPageSelected} onChange={togglePage} aria-label="Seleccionar todos los de esta página" className="size-5 accent-[var(--qs-primary)]" />
                <span className="text-xs text-muted">Seleccionar página</span>
              </li>
              {pageRows.map(({ event: e, next }) => {
                const cat = catalog.categoryById.get(e.category);
                return (
                  <li key={e.id} className={cn(`cat-${cat?.color ?? 'brand'}`, 'flex items-start gap-3 border-b border-border px-4 py-3', selection.has(e.id) && 'bg-primary-soft/50')}>
                    <input type="checkbox" aria-label={`Seleccionar ${e.title}`} checked={selection.has(e.id)} onChange={() => toggleOne(e.id)} className="mt-0.5 size-5 shrink-0 accent-[var(--qs-primary)]" />
                    <button type="button" onClick={() => openEvent(e.id)} className="flex min-w-0 flex-1 flex-col gap-1 text-left focus-visible:outline-2 focus-visible:outline-focus">
                      <span className="flex items-center gap-1.5 font-medium">
                        {e.title}
                        {e.favorite && <Star aria-label="Favorito" className="size-3.5 shrink-0 fill-current text-warning" />}
                      </span>
                      <span className="text-xs text-muted">{next === '9999-12-31' ? 'Sin próxima fecha' : formatDate(next)} · {placeLabel(e, catalog)}</span>
                      <span className="flex flex-wrap gap-1.5">
                        <CategoryBadge category={cat} />
                        {e.archived && <Badge icon={Archive}>Archivado</Badge>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {pages > 1 && (
              <nav aria-label="Paginación" className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">
                <IconButton icon={ChevronLeft} label="Página anterior" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)} />
                <span className="text-[13px] text-muted">Página {current + 1} de {pages}</span>
                <IconButton icon={ChevronRight} label="Página siguiente" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} />
              </nav>
            )}
          </>
        )}
      </div>

      <CsvImportDialog result={transfer.csv?.result ?? null} fileName={transfer.csv?.name ?? ''} onClose={() => transfer.setCsv(null)} />
      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar ${selectedIds.length} ${selectedIds.length === 1 ? 'evento' : 'eventos'}?`}
        description="También se eliminan sus saludos. No se puede deshacer. Si solo querés ocultarlos, archivalos."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          const n = selectedIds.length;
          setConfirmDelete(false);
          await deleteEvents(selectedIds);
          setSelection(new Set());
          toast.success(`${n} ${n === 1 ? 'evento eliminado' : 'eventos eliminados'}.`);
        }}
      />
    </div>
  );
}
