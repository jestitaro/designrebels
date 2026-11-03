import { cn } from '../../lib/cn';

/**
 * Logo de QuartzSales: isotipo oficial (public/brand/iso-qs.svg, servido desde la app)
 * + wordmark tipeado en Nunito, como en el dashboard.
 */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img src="brand/iso-qs.svg" alt="" aria-hidden className="size-7 shrink-0" />
      <span className={cn('text-[15px] leading-none font-extrabold tracking-[-0.01em]', onDark ? 'text-white' : 'text-text')}>QuartzSales</span>
    </span>
  );
}
