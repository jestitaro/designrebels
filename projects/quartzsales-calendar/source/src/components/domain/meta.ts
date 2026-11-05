import {
  BriefcaseBusiness, Clapperboard, Drum, Gem,
  Landmark, ShoppingBag, Tag, Ticket, type LucideIcon,
} from 'lucide-react';
import type { CategoryColor } from '../../types';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  efemerides: Landmark,
  profesiones: BriefcaseBusiness,
  cultura: Drum,
  entretenimiento: Ticket,
  pop: Clapperboard,
  comerciales: ShoppingBag,
  quartzsales: Gem,
};

export function categoryIcon(id: string): LucideIcon {
  return CATEGORY_ICONS[id] ?? Tag;
}

export const CATEGORY_COLORS: CategoryColor[] = ['blue', 'teal', 'amber', 'pink', 'fuchsia', 'green', 'brand'];
