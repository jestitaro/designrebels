import { useEffect, useState } from 'react';
import { updateSettings } from '../db/repo';
import { local } from '../lib/storage';
import type { ThemePreference } from '../types';
import { useSettings } from './useData';

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(pref: ThemePreference) {
  const dark = pref === 'dark' || (pref === 'system' && systemPrefersDark());
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#130D5D' : '#7025E0');
}

/** Aplica el tema guardado y sigue los cambios del sistema cuando la preferencia es "system". */
export function useThemeSync() {
  const { theme } = useSettings();
  useEffect(() => {
    applyTheme(theme);
    local.set('theme', theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq?.addEventListener('change', onChange);
    return () => mq?.removeEventListener('change', onChange);
  }, [theme]);
}

export function setThemePreference(theme: ThemePreference) {
  applyTheme(theme);
  local.set('theme', theme);
  return updateSettings({ theme });
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Breakpoint de layout de escritorio (lg). */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
