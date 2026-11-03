import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'category';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-muted',
  primary: 'bg-primary-soft text-primary-soft-fg',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger-fg',
  info: 'bg-info-bg text-info',
  // Usa las variables de la clase .cat-* del contenedor o del propio badge.
  category: 'bg-[var(--cat-bg)] text-[var(--cat-fg)]',
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Badge({ tone = 'neutral', icon: Icon, children, className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-[22px] max-w-full items-center gap-1 rounded-xs px-2 font-data text-[11px] font-bold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="size-3.5 shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  );
}
