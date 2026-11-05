import { CircleCheck, PenLine, Send, type LucideIcon } from 'lucide-react';
import type { GreetingStatus } from '../../types';
import type { BadgeTone } from '../ui/Badge';

export const GREETING_STATUS_META: Record<GreetingStatus, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  pendiente: { label: 'Pendiente', icon: PenLine, tone: 'warning' },
  listo: { label: 'Listo', icon: CircleCheck, tone: 'success' },
  compartido: { label: 'Compartido', icon: Send, tone: 'primary' },
};

export const GREETING_STATUSES = Object.keys(GREETING_STATUS_META) as GreetingStatus[];

/** Orden para mostrar "el saludo más avanzado" de un evento. */
const PROGRESS: Record<GreetingStatus, number> = { compartido: 3, listo: 2, pendiente: 1 };

export function bestGreetingStatus(statuses: GreetingStatus[]): GreetingStatus | null {
  if (statuses.length === 0) return null;
  return [...statuses].sort((a, b) => PROGRESS[b] - PROGRESS[a])[0]!;
}
