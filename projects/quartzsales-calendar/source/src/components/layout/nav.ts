import { CalendarClock, CalendarDays, LayoutDashboard, Library, MessageSquareText, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Sección del sidebar (como "Panel" / "Mercado" en el dashboard). */
  section: 'Panel' | 'Contenido';
}

/** Solo se listan pantallas implementadas. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icon: LayoutDashboard, section: 'Panel' },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays, section: 'Panel' },
  { to: '/proximos', label: 'Próximos', icon: CalendarClock, section: 'Panel' },
  { to: '/saludos', label: 'Saludos', icon: MessageSquareText, section: 'Contenido' },
  { to: '/biblioteca', label: 'Biblioteca', icon: Library, section: 'Contenido' },
];
