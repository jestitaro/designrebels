import type { Category, Relevance, Verification } from '../../types';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';
import { categoryIcon, RELEVANCE_META, VERIFICATION_META } from './meta';

export function CategoryBadge({ category, className }: { category: Category | undefined; className?: string }) {
  if (!category) return null;
  return (
    <Badge tone="category" icon={categoryIcon(category.id)} className={cn(`cat-${category.color}`, className)}>
      {category.name}
    </Badge>
  );
}

export function RelevanceBadge({ relevance, compact }: { relevance: Relevance; compact?: boolean }) {
  const meta = RELEVANCE_META[relevance];
  return (
    <Badge tone={meta.tone} icon={meta.icon} title={`Relevancia ${meta.label.toLowerCase()}: ${meta.help}`}>
      {compact ? meta.label : `Relevancia ${meta.label.toLowerCase()}`}
    </Badge>
  );
}

export function VerificationBadge({ verification }: { verification: Verification }) {
  const meta = VERIFICATION_META[verification];
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  );
}
