import { useEffect, useState } from 'react';
import { session } from '../lib/storage';

export function useSessionState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() =>
    session.get<T>(key, typeof initial === 'function' ? (initial as () => T)() : initial),
  );
  useEffect(() => session.set(key, value), [key, value]);
  return [value, setValue] as const;
}
