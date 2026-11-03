import { CalendarDays, LayoutDashboard, Library, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Solo se listan pantallas implementadas. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icon: LayoutDashboard },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/biblioteca', label: 'Biblioteca', icon: Library },
];
