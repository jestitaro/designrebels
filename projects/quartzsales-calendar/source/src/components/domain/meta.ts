import {
  BriefcaseBusiness, CalendarOff, Clapperboard, Drum, Gem,
  Landmark, Tag, Ticket, type LucideIcon,
} from 'lucide-react';
import type { CategoryColor } from '../../types';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  efemerides: Landmark,
  profesiones: BriefcaseBusiness,
  cultura: Drum,
  entretenimiento: Ticket,
  pop: Clapperboard,
  feriados: CalendarOff,
  quartzsales: Gem,
};

export function categoryIcon(id: string): LucideIcon {
  return CATEGORY_ICONS[id] ?? Tag;
}

export const CATEGORY_COLORS: CategoryColor[] = ['blue', 'teal', 'amber', 'pink', 'fuchsia', 'green', 'brand', 'slate'];
