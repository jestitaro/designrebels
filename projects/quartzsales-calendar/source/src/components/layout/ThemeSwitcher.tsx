import { Monitor, Moon, Sun } from 'lucide-react';
import { useSettings } from '../../hooks/useData';
import { setThemePreference } from '../../hooks/useTheme';
import { cn } from '../../lib/cn';
import type { ThemePreference } from '../../types';
import { IconButton } from '../ui/Button';

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
];

/** Selector segmentado (radiogroup) para el sidebar y Configuración. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme } = useSettings();
  return (
    <div role="radiogroup" aria-label="Tema" className={cn('grid grid-cols-3 gap-1 rounded border border-border bg-surface-2 p-1', className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => void setThemePreference(value)}
            className={cn(
              'flex h-8 items-center justify-center gap-1.5 rounded-sm text-xs font-bold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:h-11',
              active ? 'bg-primary-soft text-text ring-1 ring-primary-ring' : 'text-muted hover:bg-surface-3 hover:text-text',
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Botón compacto que alterna sistema → claro → oscuro (header mobile). */
export function ThemeCycleButton() {
  const { theme } = useSettings();
  const index = OPTIONS.findIndex((o) => o.value === theme);
  const current = OPTIONS[index] ?? OPTIONS[0]!;
  const next = OPTIONS[(index + 1) % OPTIONS.length]!;
  return (
    <IconButton
      icon={current.icon}
      label={`Tema: ${current.label.toLowerCase()}. Cambiar a ${next.label.toLowerCase()}`}
      onClick={() => void setThemePreference(next.value)}
    />
  );
}
