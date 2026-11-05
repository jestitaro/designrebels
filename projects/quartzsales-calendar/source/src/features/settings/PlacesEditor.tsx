import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { saveCountry } from '../../db/repo';
import { newId } from '../../lib/id';
import { cn } from '../../lib/cn';
import type { Country } from '../../types';
import { Button, IconButton } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface Place { id: string; name: string; active: boolean }

/** Fila editable: nombre (se guarda al salir del campo) + activo. */
function PlaceRow({ place, level, onChange, label, children, expandable, expanded, onToggle }: {
  place: Place; level: number; label: string; onChange: (p: Place) => void;
  children?: ReactNode; expandable?: boolean; expanded?: boolean; onToggle?: () => void;
}) {
  const [name, setName] = useState(place.name);
  const commit = () => {
    const trimmed = name.trim();
    if (!trimmed) setName(place.name);
    else if (trimmed !== place.name) onChange({ ...place, name: trimmed });
  };
  return (
    <li className="flex flex-col">
      <div className={cn('flex items-center gap-2 py-1.5', !place.active && 'opacity-70')} style={{ paddingLeft: `${level * 1.5}rem` }}>
        {expandable ? (
          <IconButton icon={expanded ? ChevronDown : ChevronRight} size="sm" label={`${expanded ? 'Ocultar' : 'Mostrar'} subdivisiones de ${place.name}`} onClick={onToggle} aria-expanded={expanded} />
        ) : (
          <span className="w-8 shrink-0 pointer-coarse:w-11" aria-hidden />
        )}
        <input
          aria-label={`Nombre de ${label} ${place.name}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="h-9 min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 text-sm hover:border-border-strong focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:h-11"
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={place.active} onChange={(e) => onChange({ ...place, active: e.target.checked })} className="size-4 accent-[var(--qs-primary)]" />
          Activo
        </label>
      </div>
      {children}
    </li>
  );
}

export function PlacesEditor({ countries }: { countries: Country[] }) {
  const toast = useToast();
  const save = async (c: Country) => {
    await saveCountry(c);
    toast.success('Países actualizados.');
  };
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border rounded border border-border px-2">
        {countries.map((c) => (
          <PlaceRow key={c.id} place={c} level={0} label="país" onChange={(p) => void save({ ...c, ...p })} />
        ))}
      </ul>
      <div>
        <Button size="sm" icon={Plus} onClick={() => void save({ id: newId('pais'), name: 'Nuevo país', active: true, order: countries.length, regions: [] })}>
          Agregar país
        </Button>
      </div>
      <p className="text-xs text-muted">Desactivar un país lo oculta de los formularios y filtros, pero no borra sus fechas.</p>
    </div>
  );
}
