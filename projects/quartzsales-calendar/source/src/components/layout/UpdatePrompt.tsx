import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * Registra el service worker (scope: la carpeta de la app). Las versiones nuevas
 * se activan solas (autoUpdate) y la página se recarga; si por algún motivo queda
 * una esperando, se muestra el aviso "Hay una versión nueva — Recargar".
 * Busca actualizaciones al abrir, cada hora y al volver a la pestaña.
 */
export function UpdatePrompt() {
  const toast = useToast();
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (registration.installing || !navigator.onLine) return;
        void registration.update().catch(() => undefined);
      };
      window.setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    },
    onRegisterError(error) {
      console.error('No se pudo registrar el service worker', error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.show('La app ya funciona sin conexión.', { tone: 'success' });
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady, toast]);

  if (!needRefresh) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[65] flex justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="animate-toast-in flex w-full max-w-md items-center gap-3 rounded-lg bg-brand-dark px-4 py-3 text-sm text-white shadow-lg">
        <RefreshCw aria-hidden className="size-4 shrink-0" />
        <p className="flex-1">Hay una versión nueva</p>
        <Button size="sm" variant="primary" onClick={() => void updateServiceWorker(true)}>Recargar</Button>
      </div>
    </div>
  );
}
