import {
  BriefcaseBusiness, ChevronsUp, ChevronUp, CircleCheck, CircleDashed, CircleQuestionMark, Clapperboard, Drum, Gem,
  Landmark, Minus, ShoppingBag, Tag, Ticket, type LucideIcon,
} from 'lucide-react';
import type { CategoryColor, Relevance, Verification } from '../../types';
import type { BadgeTone } from '../ui/Badge';

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

export const RELEVANCE_META: Record<Relevance, { label: string; icon: LucideIcon; tone: BadgeTone; help: string }> = {
  alta: { label: 'Alta', icon: ChevronsUp, tone: 'primary', help: 'Merece una comunicación' },
  media: { label: 'Media', icon: ChevronUp, tone: 'info', help: 'Interesante para compartir' },
  baja: { label: 'Baja', icon: Minus, tone: 'neutral', help: 'Dato de consulta' },
};

export const VERIFICATION_META: Record<Verification, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  confirmado: { label: 'Confirmado', icon: CircleCheck, tone: 'success' },
  pendiente: { label: 'Pendiente', icon: CircleDashed, tone: 'warning' },
  tentativo: { label: 'Tentativo', icon: CircleQuestionMark, tone: 'neutral' },
};
