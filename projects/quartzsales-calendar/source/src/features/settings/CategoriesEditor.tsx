import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { saveCategory } from '../../db/repo';
import { newId } from '../../lib/id';
import { cn } from '../../lib/cn';
import type { CalendarEvent, Category } from '../../types';
import { categoryIcon } from '../../components/domain/meta';
import { Button, IconButton } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

function NameInput({ value, label, onCommit }: { value: string; label: string; onCommit: (v: string) => void }) {
  const [name, setName] = useState(value);
  return (
    <input
      aria-label={label}
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={() => (name.trim() ? name.trim() !== value && onCommit(name.trim()) : setName(value))}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="h-8 min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 text-[13px] hover:border-border-strong focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:h-11"
    />
  );
}

export function CategoriesEditor({ categories, events }: { categories: Category[]; events: CalendarEvent[] }) {
  const toast = useToast();
  const used = useMemo(() => new Set(events.map((e) => e.subcategory).filter(Boolean)), [events]);
  const save = async (c: Category, message = 'Categorías actualizadas.') => {
    await saveCategory(c);
    toast.success(message);
  };

  return (
    <ul className="flex flex-col gap-3">
      {categories.map((c) => {
        const Icon = categoryIcon(c.id);
        return (
          <li key={c.id} className={cn(`cat-${c.color}`, 'rounded border border-border p-3')}>
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded bg-[var(--cat-bg)] text-[var(--cat-fg)]">
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="flex-1 text-sm font-medium">{c.name}</span>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={c.visible} className="size-4 accent-[var(--qs-primary)]"
                  onChange={(e) => void save({ ...c, visible: e.target.checked }, e.target.checked ? `${c.name} visible en el calendario.` : `${c.name} oculta en el calendario.`)} />
                Visible
              </label>
            </div>
            <details className="mt-2 group">
              <summary className="cursor-pointer rounded px-1 text-xs font-medium text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus">
                Subcategorías ({c.subcategories.length})
              </summary>
              <ul className="mt-1 flex flex-col">
                {c.subcategories.map((s) => (
                  <li key={s.id} className="flex items-center gap-1">
                    <NameInput value={s.name} label={`Nombre de la subcategoría ${s.name}`}
                      onCommit={(name) => void save({ ...c, subcategories: c.subcategories.map((x) => (x.id === s.id ? { ...x, name } : x)) })} />
                    <IconButton icon={Trash2} size="sm" variant="danger-ghost"
                      label={used.has(s.id) ? `No se puede quitar ${s.name}: hay eventos que la usan` : `Quitar ${s.name}`}
                      disabled={used.has(s.id)}
                      onClick={() => void save({ ...c, subcategories: c.subcategories.filter((x) => x.id !== s.id) }, 'Subcategoría quitada.')} />
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="ghost" icon={Plus} className="mt-1"
                onClick={() => void save({ ...c, subcategories: [...c.subcategories, { id: newId(`${c.id}-sub`), name: 'Nueva subcategoría' }] })}>
                Agregar subcategoría
              </Button>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
