import { demoApi } from './demo.js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let apiPromise;

/** Devuelve el adaptador activo: Supabase si está configurado, demo si no. */
export function getApi() {
  if (!apiPromise) {
    apiPromise =
      URL && KEY
        ? import('./supabase.js').then((m) => m.createSupabaseApi(URL, KEY))
        : Promise.resolve(demoApi);
  }
  return apiPromise;
}

export const IS_DEMO = !(URL && KEY);
export { ApiError } from './demo.js';
