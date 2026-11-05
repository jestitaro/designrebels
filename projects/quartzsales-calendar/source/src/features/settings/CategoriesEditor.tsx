import { saveCategory } from '../../db/repo';
import { cn } from '../../lib/cn';
import type { Category } from '../../types';
import { categoryIcon } from '../../components/domain/meta';
import { useToast } from '../../components/ui/Toast';

export function CategoriesEditor({ categories }: { categories: Category[] }) {
  const toast = useToast();
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
          </li>
        );
      })}
    </ul>
  );
}
