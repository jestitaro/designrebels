import { CalendarClock, CalendarDays, LayoutDashboard, Library, MessageSquareText, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Solo se listan pantallas implementadas. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icon: LayoutDashboard },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/proximos', label: 'Próximos', icon: CalendarClock },
  { to: '/saludos', label: 'Saludos', icon: MessageSquareText },
  { to: '/biblioteca', label: 'Biblioteca', icon: Library },
];
