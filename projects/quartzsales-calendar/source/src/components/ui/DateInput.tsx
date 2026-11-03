import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDate, isValidISODate, parseHumanDate } from '../../lib/dates';
import { cn } from '../../lib/cn';
import { controlBase } from './Field';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'> {
  /** Valor ISO YYYY-MM-DD o ''. */
  value: string;
  onChange: (iso: string) => void;
  min?: string;
}

/**
 * Fecha en formato argentino dd/mm/aaaa, independiente del idioma del navegador.
 * Se puede escribir o elegir con el selector nativo (botón de calendario).
 * Mientras el texto está incompleto o es inválido, emite '' + marca el error de formato.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { value, onChange, className, min, onBlur, ...rest },
  ref,
) {
  const [text, setText] = useState(value && isValidISODate(value) ? formatDate(value) : '');
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sincroniza cuando el valor cambia desde afuera (picker, reset).
    const parsed = parseHumanDate(text);
    if (isValidISODate(value) && parsed !== value) setText(formatDate(value));
    else if (value === '' && parsed !== null) setText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleText(raw: string) {
    // Autocompleta las barras al tipear: 10112026 → 10/11/2026
    const clean = raw.replace(/[^\d/]/g, '');
    const parts = clean.split('/');
    let next = clean;
    if (parts.length > 3 || parts.some((part, i) => part.length > (i < 2 ? 2 : 4)) || (parts.length === 1 && clean.length > 2)) {
      const digits = clean.replace(/\//g, '').slice(0, 8);
      next = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
    }
    setText(next);
    onChange(parseHumanDate(next) ?? (next === '' ? '' : 'invalid'));
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={text}
        onChange={(e) => handleText(e.target.value)}
        onBlur={onBlur}
        className={cn(controlBase, 'h-10 pr-11 pl-3 tabular-nums pointer-coarse:h-11')}
        {...rest}
      />
      <button
        type="button"
        aria-label="Elegir en el calendario"
        title="Elegir en el calendario"
        disabled={rest.disabled}
        onClick={() => {
          const el = picker.current;
          if (!el) return;
          try {
            el.showPicker();
          } catch {
            el.focus();
            el.click();
          }
        }}
        className="absolute top-1/2 right-1 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded text-muted hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:size-10"
      >
        <CalendarDays aria-hidden className="size-4" />
      </button>
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden
        min={min && isValidISODate(min) ? min : undefined}
        value={isValidISODate(value) ? value : ''}
        onChange={(e) => {
          setText(e.target.value ? formatDate(e.target.value) : '');
          onChange(e.target.value);
        }}
        className="pointer-events-none absolute right-0 bottom-0 h-px w-px opacity-0"
      />
    </div>
  );
});
