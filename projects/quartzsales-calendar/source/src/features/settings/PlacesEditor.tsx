import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { saveCountry } from '../../db/repo';
import { newId } from '../../lib/id';
import { cn } from '../../lib/cn';
import type { City, Country, Region } from '../../types';
import { Button, IconButton } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface Place { id: string; name: string; active: boolean }

/** Fila editable: nombre (se guarda al salir del campo) + activo. */
function PlaceRow({ place, level, onChange, label, children, expandable, expanded, onToggle }: {
  place: Place; level: number; label: string; onChange: (p: Place) => void;
  children?: React.ReactNode; expandable?: boolean; expanded?: boolean; onToggle?: () => void;
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
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toast = useToast();
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const save = async (c: Country) => {
    await saveCountry(c);
    toast.success('Lugares actualizados.');
  };
  const updateRegion = (c: Country, r: Region) => save({ ...c, regions: c.regions.map((x) => (x.id === r.id ? r : x)) });
  const updateCity = (c: Country, r: Region, city: City) => updateRegion(c, { ...r, cities: r.cities.map((x) => (x.id === city.id ? city : x)) });

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border rounded border border-border px-2">
        {countries.map((c) => (
          <PlaceRow key={c.id} place={c} level={0} label="país" onChange={(p) => void save({ ...c, ...p })}
            expandable expanded={open.has(c.id)} onToggle={() => toggle(c.id)}>
            {open.has(c.id) && (
              <ul className="flex flex-col pb-2">
                {c.regions.map((r) => (
                  <PlaceRow key={r.id} place={r} level={1} label="región" onChange={(p) => void updateRegion(c, { ...r, ...p })}
                    expandable expanded={open.has(r.id)} onToggle={() => toggle(r.id)}>
                    {open.has(r.id) && (
                      <ul className="flex flex-col">
                        {r.cities.map((city) => (
                          <PlaceRow key={city.id} place={city} level={2} label="ciudad" onChange={(p) => void updateCity(c, r, { ...city, ...p })} />
                        ))}
                        <li style={{ paddingLeft: '5.5rem' }}>
                          <Button size="sm" variant="ghost" icon={Plus}
                            onClick={() => void updateRegion(c, { ...r, cities: [...r.cities, { id: newId(`${r.id}-c`), name: 'Nueva ciudad o zona', active: true }] })}>
                            Agregar ciudad o zona
                          </Button>
                        </li>
                      </ul>
                    )}
                  </PlaceRow>
                ))}
                <li style={{ paddingLeft: '4rem' }}>
                  <Button size="sm" variant="ghost" icon={Plus}
                    onClick={() => void save({ ...c, regions: [...c.regions, { id: newId(`${c.id}-r`), name: 'Nueva región', active: true, cities: [] }] })}>
                    Agregar región
                  </Button>
                </li>
              </ul>
            )}
          </PlaceRow>
        ))}
      </ul>
      <div>
        <Button size="sm" icon={Plus} onClick={() => void save({ id: newId('pais'), name: 'Nuevo país', active: true, order: countries.length, regions: [] })}>
          Agregar país
        </Button>
      </div>
      <p className="text-xs text-muted">Desactivar un lugar lo oculta de los formularios y filtros, pero no borra los eventos que ya lo usan.</p>
    </div>
  );
}
