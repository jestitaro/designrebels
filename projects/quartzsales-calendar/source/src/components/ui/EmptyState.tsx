import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-14', className)}>
      <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-fg">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-semibold text-text">{title}</p>
        {description && <p className="text-[13px] text-muted">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
