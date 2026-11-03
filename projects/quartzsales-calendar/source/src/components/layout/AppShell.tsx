import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { cn } from '../../lib/cn';
import { NAV_ITEMS } from './nav';
import { ThemeCycleButton, ThemeSwitcher } from './ThemeSwitcher';

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('flex size-8 shrink-0 items-center justify-center rounded bg-primary text-[13px] font-bold text-white', className)}
    >
      QS
    </span>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <BrandMark />
        <div className="leading-tight">
          <p className="text-sm font-semibold">QuartzSales</p>
          <p className="text-xs text-muted">Calendar</p>
        </div>
      </div>
      <nav aria-label="Principal" className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex h-10 items-center gap-3 rounded px-3 text-sm font-medium transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-focus',
                    isActive ? 'bg-primary-soft text-primary-soft-fg' : 'text-muted hover:bg-surface-2 hover:text-text',
                  )
                }
              >
                <Icon aria-hidden className="size-[18px]" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-border p-3">
        <ThemeSwitcher />
      </div>
    </aside>
  );
}

function BottomNav() {
  if (NAV_ITEMS.length < 2) return null;
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="flex">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                  isActive ? 'text-accent' : 'text-muted hover:text-text',
                )
              }
            >
              <Icon aria-hidden className="size-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileHeader() {
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.to));
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-border bg-surface/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
      <BrandMark className="size-7 text-xs" />
      <p className="flex-1 truncate text-[15px] font-semibold">{current?.label ?? 'QuartzSales Calendar'}</p>
      <ThemeCycleButton />
    </header>
  );
}

export function AppShell({ children }: { children?: ReactNode }) {
  const hasBottomNav = NAV_ITEMS.length >= 2;
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only z-[70] rounded bg-primary px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main id="main" tabIndex={-1} className={cn('flex min-w-0 flex-1 flex-col outline-none', hasBottomNav && 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0')}>
          {children ?? <Outlet />}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
