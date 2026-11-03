import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

const chipBase =
  'inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-10 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

interface ToggleChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  selected: boolean;
  icon?: LucideIcon;
  children: ReactNode;
}

/** Chip seleccionable (filtro rápido). */
export function ToggleChip({ selected, icon: Icon, children, className, ...rest }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        chipBase,
        selected
          ? 'border-primary bg-primary-soft text-primary-soft-fg hover:bg-primary-soft'
          : 'border-border-strong bg-surface text-text hover:bg-surface-2 active:bg-surface-3',
        className,
      )}
      {...rest}
    >
      {Icon && <Icon aria-hidden className="size-3.5" />}
      {children}
    </button>
  );
}

interface RemovableChipProps {
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
  className?: string;
}

/** Chip de filtro activo con botón para quitarlo. */
export function RemovableChip({ children, onRemove, removeLabel, className }: RemovableChipProps) {
  return (
    <span className={cn(chipBase, 'gap-1 border-primary/40 bg-primary-soft pr-1 text-primary-soft-fg', className)}>
      <span className="max-w-48 truncate">{children}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="inline-flex size-6 items-center justify-center rounded-xs hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:size-8"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </span>
  );
}
