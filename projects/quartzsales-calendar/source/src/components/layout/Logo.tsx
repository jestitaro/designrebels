import { useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * Logo oficial de QuartzSales servido desde la app (public/brand/, ver `npm run fetch-brand`).
 * Fondo claro → fullcolor; fondo oscuro → fullcolor-negativo. Si los archivos no están,
 * muestra el wordmark en texto, igual que el fallback del dashboard.
 */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={cn('text-[15px] leading-none font-extrabold', onDark ? 'text-white' : 'text-text', className)}>QuartzSales</span>
    );
  }
  const light = (
    <img src="brand/logo-qs-fullcolor.svg" alt="QuartzSales" onError={() => setFailed(true)} className={cn('h-7 w-auto', !onDark && 'dark:hidden', className)} />
  );
  const dark = (
    <img src="brand/logo-qs-fullcolor-negativo.svg" alt="QuartzSales" onError={() => setFailed(true)} className={cn('h-7 w-auto', !onDark && 'hidden dark:block', className)} />
  );
  return onDark ? dark : <>{light}{dark}</>;
}
