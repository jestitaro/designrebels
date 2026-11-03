import {
  forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export const controlBase =
  'w-full rounded border bg-surface-2 text-text text-[13.5px] placeholder:text-subtle transition-colors ' +
  'border-border-strong hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus ' +
  'focus-visible:border-focus disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border-strong ' +
  'aria-[invalid=true]:border-danger-fg';

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Oculta la etiqueta visualmente pero la mantiene para lectores de pantalla. */
  hideLabel?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

export function Field({ label, hint, error, required, hideLabel, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-[13px] font-bold text-text', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="text-danger-fg" aria-hidden>
            {' '}*
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger-fg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(controlBase, 'h-[38px] px-3 pointer-coarse:h-11', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(controlBase, 'px-3 py-2 leading-relaxed', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(controlBase, 'h-[38px] appearance-none pr-9 pl-3 pointer-coarse:h-11')} {...rest}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
});

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <label htmlFor={inputId} className={cn('flex min-h-8 cursor-pointer items-start gap-2.5 pointer-coarse:min-h-11', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-xs accent-[var(--qs-primary)] disabled:cursor-not-allowed"
        {...rest}
      />
      <span className="flex flex-col">
        <span className="text-sm">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
});
