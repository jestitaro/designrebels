import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
export type ButtonSize = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 rounded font-medium whitespace-nowrap select-none ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg shadow-sm hover:bg-primary-hover active:bg-primary-active disabled:hover:bg-primary',
  secondary:
    'bg-surface text-text border border-border-strong hover:bg-surface-2 active:bg-surface-3 disabled:hover:bg-surface',
  ghost: 'text-text hover:bg-surface-2 active:bg-surface-3 disabled:hover:bg-transparent',
  danger: 'bg-danger text-white hover:bg-danger-hover active:bg-danger-hover disabled:hover:bg-danger',
  'danger-ghost': 'text-danger-fg hover:bg-danger-bg active:bg-danger-bg disabled:hover:bg-transparent',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] pointer-coarse:h-11',
  md: 'h-10 px-4 text-sm pointer-coarse:h-11',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: 'size-8 pointer-coarse:size-11',
  md: 'size-10 pointer-coarse:size-11',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
      {children}
      {IconRight && <IconRight aria-hidden className="size-4 shrink-0" />}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Texto accesible obligatorio: el botón no tiene texto visible. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pressed?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', className, pressed, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(base, variants[variant], iconSizes[size], 'px-0', className)}
      {...rest}
    >
      <Icon aria-hidden className="size-[18px]" />
    </button>
  );
});
