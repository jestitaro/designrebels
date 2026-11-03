import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; icon?: LucideIcon }>;
  onChange: (value: T) => void;
  className?: string;
  /** Oculta el texto en pantallas chicas (queda como aria-label). */
  compactLabels?: boolean;
}

/** Grupo de botones excluyentes (vista, rango, etc.). */
export function Segmented<T extends string>({ label, value, options, onChange, className, compactLabels }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex rounded border border-border-strong bg-surface-2 p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={compactLabels ? o.label : undefined}
            title={compactLabels ? o.label : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-xs font-bold transition-colors pointer-coarse:h-10',
              'focus-visible:outline-2 focus-visible:outline-focus',
              active ? 'bg-brand-grad text-white' : 'text-muted hover:bg-surface-3 hover:text-text',
            )}
          >
            {Icon && <Icon aria-hidden className="size-3.5" />}
            <span className={cn(compactLabels && 'sr-only sm:not-sr-only')}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
