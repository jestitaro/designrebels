import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Settings } from 'lucide-react';
import { cn } from '../../lib/cn';
import { NAV_ITEMS } from './nav';
import { ThemeCycleButton, ThemeSwitcher } from './ThemeSwitcher';
import { Logo } from './Logo';

const navItemClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-2.5 rounded border px-2.5 py-[9px] text-[13.5px] font-semibold transition-colors',
    'focus-visible:outline-2 focus-visible:outline-focus',
    isActive
      ? 'border-primary-ring bg-primary-soft text-text [&_svg]:text-grad-end dark:[&_svg]:text-accent'
      : 'border-transparent text-muted hover:bg-surface-2 hover:text-text',
  );

function Sidebar() {
  const sections = [...new Set(NAV_ITEMS.map((i) => i.section))];
  return (
    <aside className="qs-sidebar-glow sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-hidden border-r border-border bg-surface lg:flex">
      <div className="flex items-center gap-2.5 border-b border-border px-5 pt-6 pb-5">
        <Logo />
        <span className="mt-0.5 font-data text-[10px] font-bold tracking-[0.12em] text-subtle uppercase">Calendar</span>
      </div>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {sections.map((section) => (
          <div key={section} className="flex flex-col gap-0.5">
            <p className="px-2 pt-3 pb-1.5 text-[10px] font-extrabold tracking-[0.1em] text-subtle uppercase">{section}</p>
            <ul className="flex flex-col gap-0.5">
              {NAV_ITEMS.filter((i) => i.section === section).map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} className={({ isActive }) => navItemClass(isActive)}>
                    <Icon aria-hidden className="size-[17px]" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-2 border-t border-border px-3 py-4">
        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded border px-2.5 py-[9px] text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-focus',
              isActive ? 'border-primary-ring bg-primary-soft text-text' : 'border-border-strong text-muted hover:bg-surface-2 hover:text-text',
            )
          }
        >
          <Settings aria-hidden className="size-4" />
          Configuración
        </NavLink>
        <ThemeSwitcher />
        <p className="px-1 font-data text-[11px] leading-snug text-subtle">Datos guardados solo en este navegador.</p>
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
                  isActive ? 'text-accent [&_svg]:text-grad-end dark:[&_svg]:text-accent' : 'text-muted hover:text-text',
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
      <Logo className="h-6" />
      <p className="flex-1 truncate border-l border-border pl-2.5 text-[15px] font-extrabold">{current?.label ?? (pathname.startsWith('/configuracion') ? 'Configuración' : 'QuartzSales Calendar')}</p>
      <ThemeCycleButton />
      <Link to="/configuracion" aria-label="Configuración" title="Configuración"
        className="inline-flex size-11 items-center justify-center rounded text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-focus">
        <Settings aria-hidden className="size-[18px]" />
      </Link>
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
        className="sr-only z-[70] rounded bg-brand-grad px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
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
