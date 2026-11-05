import type { Category } from '../../types';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';
import { categoryIcon } from './meta';

export function CategoryBadge({ category, className }: { category: Category | undefined; className?: string }) {
  if (!category) return null;
  return (
    <Badge tone="category" icon={categoryIcon(category.id)} className={cn(`cat-${category.color}`, className)}>
      {category.name}
    </Badge>
  );
}
