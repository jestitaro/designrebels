import { CalendarDays, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Solo se listan pantallas implementadas. */
export const NAV_ITEMS: NavItem[] = [{ to: '/calendario', label: 'Calendario', icon: CalendarDays }];
