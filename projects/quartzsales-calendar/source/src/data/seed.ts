import type { CalendarEvent } from '../types';

/**
 * Catálogo inicial público. Se mergea por ID con los datos locales (ver mergeSeed).
 * Subir SEED_VERSION cada vez que cambie el contenido.
 */
export const SEED_VERSION = 0;
export const SEED_EVENTS: CalendarEvent[] = [];
