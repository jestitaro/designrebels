import { useId, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RemovableChip } from '../../components/ui/Chip';
import { BottomSheet, Modal } from '../../components/ui/Dialog';
import { Checkbox } from '../../components/ui/Field';
import type { Catalog } from '../../hooks/useData';
import { useIsDesktop } from '../../hooks/useTheme';
import { countActiveFilters, EMPTY_FILTERS, type EventFilters } from '../../lib/filters';
import { cn } from '../../lib/cn';

type ArrayKey = 'countries' | 'categories';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function SearchBox({ value, onChange, className, label = 'Buscar eventos por nombre' }: {
  value: string; onChange: (v: string) => void; className?: string; label?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <input
        type="search"
        aria-label={label}
        placeholder="Buscar por nombre"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[38px] w-full rounded border border-border-strong bg-surface-2 pr-9 pl-9 text-[13.5px] placeholder:text-subtle hover:border-muted focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus pointer-coarse:h-11 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" aria-label="Borrar búsqueda" onClick={() => onChange('')}
          className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-focus">
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-1">
      <p id={id} className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</p>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface FiltersButtonProps {
  filters: EventFilters;
  onChange: (f: EventFilters) => void;
  catalog: Catalog;
  resultCount: number;
  showGreetingFilter?: boolean;
}

/** Botón "Filtros" + panel (modal en desktop, bottom sheet en mobile). Los cambios se aplican al instante. */
export function FiltersButton({ filters, onChange, catalog, resultCount, showGreetingFilter = true }: FiltersButtonProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const active = countActiveFilters(filters);
  const set = (key: ArrayKey, value: string) => onChange({ ...filters, [key]: toggle(filters[key] as string[], value) });

  const countries = catalog.countries.filter((c) => c.active || filters.countries.includes(c.id));

  const body = (
    <div className="flex flex-col gap-5">
      <Group title="País">
        {countries.map((c) => (
          <Checkbox key={c.id} label={c.name} checked={filters.countries.includes(c.id)} onChange={() => set('countries', c.id)} />
        ))}
      </Group>
      <Group title="Categoría">
        {catalog.categories.map((c) => (
          <Checkbox key={c.id} label={c.name} description={c.visible ? undefined : 'Oculta en Configuración'}
            checked={filters.categories.includes(c.id)} onChange={() => set('categories', c.id)} />
        ))}
      </Group>
      {showGreetingFilter && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Saludo</legend>
          <div className="flex flex-wrap gap-x-5">
            {([['todos', 'Todos'], ['con', 'Con saludo'], ['sin', 'Sin saludo']] as const).map(([v, l]) => (
              <label key={v} className="flex min-h-8 cursor-pointer items-center gap-2 text-sm pointer-coarse:min-h-11">
                <input type="radio" name="greeting-filter" className="accent-[var(--qs-primary)]" checked={filters.greeting === v}
                  onChange={() => onChange({ ...filters, greeting: v })} />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Group title="Otros">
        <Checkbox label="Solo favoritos" checked={filters.favoritesOnly} onChange={(e) => onChange({ ...filters, favoritesOnly: e.target.checked })} />
        <Checkbox label="Mostrar archivados" checked={filters.showArchived} onChange={(e) => onChange({ ...filters, showArchived: e.target.checked })} />
      </Group>
    </div>
  );

  const footer = (
    <>
      <Button variant="ghost" onClick={() => onChange({ ...EMPTY_FILTERS, query: filters.query })} disabled={active === 0}>Limpiar filtros</Button>
      <Button variant="primary" onClick={() => setOpen(false)}>
        Ver {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
      </Button>
    </>
  );

  return (
    <>
      <Button size="sm" icon={SlidersHorizontal} onClick={() => setOpen(true)} aria-haspopup="dialog">
        Filtros
        {active > 0 && (
          <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-grad px-1.5 text-[11px] font-bold text-white">
            <span className="sr-only">(</span>{active}<span className="sr-only"> activos)</span>
          </span>
        )}
      </Button>
      {isDesktop ? (
        <Modal open={open} onClose={() => setOpen(false)} title="Filtros" footer={footer}>{body}</Modal>
      ) : (
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Filtros" footer={footer}>{body}</BottomSheet>
      )}
    </>
  );
}

/** Filtros activos como chips, con opción de quitar cada uno o limpiar todo. */
export function ActiveFilterChips({ filters, onChange, catalog, className }: {
  filters: EventFilters; onChange: (f: EventFilters) => void; catalog: Catalog; className?: string;
}) {
  const chips: Array<{ key: string; label: string; remove: () => void }> = [];
  const without = (key: ArrayKey, value: string) => () => onChange({ ...filters, [key]: (filters[key] ?? []).filter((v) => v !== value) });
  filters.countries.forEach((id) => chips.push({ key: `c-${id}`, label: catalog.placeName(id) ?? id, remove: without('countries', id) }));
  filters.categories.forEach((id) => chips.push({ key: `k-${id}`, label: catalog.categoryById.get(id)?.name ?? id, remove: without('categories', id) }));
  if (filters.greeting !== 'todos') chips.push({ key: 'g', label: filters.greeting === 'con' ? 'Con saludo' : 'Sin saludo', remove: () => onChange({ ...filters, greeting: 'todos' }) });
  if (filters.favoritesOnly) chips.push({ key: 'fav', label: 'Favoritos', remove: () => onChange({ ...filters, favoritesOnly: false }) });
  if (filters.showArchived) chips.push({ key: 'arch', label: 'Incluye archivados', remove: () => onChange({ ...filters, showArchived: false }) });
  if (chips.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)} aria-label="Filtros activos" role="group">
      {chips.map((c) => (
        <RemovableChip key={c.key} onRemove={c.remove} removeLabel={`Quitar filtro ${c.label}`}>{c.label}</RemovableChip>
      ))}
      <Button size="sm" variant="ghost" onClick={() => onChange({ ...EMPTY_FILTERS, query: filters.query })}>Limpiar todo</Button>
    </div>
  );
}
