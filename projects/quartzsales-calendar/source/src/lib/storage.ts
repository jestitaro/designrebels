/** Prefijo propio: el dominio lo comparten todos los proyectos de Design Rebels. */
export const STORAGE_PREFIX = 'qs-calendar:';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const local = {
  get: (key: string) => safe(() => localStorage.getItem(STORAGE_PREFIX + key), null),
  set: (key: string, value: string) => safe(() => localStorage.setItem(STORAGE_PREFIX + key, value), undefined),
  remove: (key: string) => safe(() => localStorage.removeItem(STORAGE_PREFIX + key), undefined),
};

/** Estado de la sesión (filtros, vista): se mantiene al navegar, se pierde al cerrar la pestaña. */
export const session = {
  get<T>(key: string, fallback: T): T {
    return safe(() => {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    }, fallback);
  },
  set(key: string, value: unknown) {
    safe(() => sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)), undefined);
  },
};
