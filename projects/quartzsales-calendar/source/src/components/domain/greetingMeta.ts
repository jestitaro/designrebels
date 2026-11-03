import { Ban, CircleCheck, MessageSquareDashed, PenLine, Send, type LucideIcon } from 'lucide-react';
import type { GreetingStatus, Tone } from '../../types';
import type { BadgeTone } from '../ui/Badge';

export const GREETING_STATUS_META: Record<GreetingStatus, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  'sin redactar': { label: 'Sin redactar', icon: MessageSquareDashed, tone: 'neutral' },
  borrador: { label: 'Borrador', icon: PenLine, tone: 'warning' },
  listo: { label: 'Listo', icon: CircleCheck, tone: 'success' },
  compartido: { label: 'Compartido', icon: Send, tone: 'primary' },
  descartado: { label: 'Descartado', icon: Ban, tone: 'neutral' },
};

export const GREETING_STATUSES = Object.keys(GREETING_STATUS_META) as GreetingStatus[];

export const TONE_LABELS: Record<Tone, string> = {
  institucional: 'Institucional',
  cercano: 'Cercano',
  divertido: 'Divertido',
  'humor-interno': 'Humor interno QuartzSales',
};

export const TONES = Object.keys(TONE_LABELS) as Tone[];

export const CHANNEL_SUGGESTIONS = ['Slack #general', 'Slack #random', 'Mail', 'Reunión de equipo', 'Cartelera'];

/** Orden para mostrar "el saludo más avanzado" de un evento. */
const PROGRESS: Record<GreetingStatus, number> = { compartido: 4, listo: 3, borrador: 2, 'sin redactar': 1, descartado: 0 };

export function bestGreetingStatus(statuses: GreetingStatus[]): GreetingStatus | null {
  if (statuses.length === 0) return null;
  return [...statuses].sort((a, b) => PROGRESS[b] - PROGRESS[a])[0]!;
}
