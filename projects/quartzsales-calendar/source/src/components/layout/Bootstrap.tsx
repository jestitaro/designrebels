import { useEffect, useState, type ReactNode } from 'react';
import { DatabaseZap, LoaderCircle } from 'lucide-react';
import { initDatabase } from '../../db/repo';
import { SEED_EVENTS, SEED_VERSION } from '../../data/seed';
import { useThemeSync } from '../../hooks/useTheme';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

type State = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

function ThemeSync() {
  useThemeSync();
  return null;
}

/** Abre IndexedDB, aplica migraciones y mergea el seed antes de mostrar la app. */
export function Bootstrap({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    initDatabase(SEED_EVENTS, SEED_VERSION)
      .then(() => !cancelled && setState({ status: 'ready' }))
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled)
          setState({
            status: 'error',
            message:
              'No se pudo abrir el almacenamiento local del navegador. Puede pasar en modo incógnito o si el navegador bloquea el almacenamiento de sitios.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
        <LoaderCircle aria-hidden className="size-5 animate-spin motion-reduce:animate-none" />
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <EmptyState
          icon={DatabaseZap}
          title="No se pudieron cargar tus datos"
          description={state.message}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <>
      <ThemeSync />
      {children}
    </>
  );
}
