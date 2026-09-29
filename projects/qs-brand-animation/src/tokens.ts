import { Easing } from 'remotion';

/**
 * Fuente única de verdad visual. Ningún componente define colores, tamaños ni curvas propias.
 * Los tintes (fondos de chips, bordes, textos secundarios) se derivan de estos colores con alpha(),
 * no se agregan colores nuevos.
 */
export const colors = {
  primary: '#7025E0',
  secondary: '#A172FF',
  dark: '#130D5D',
  textDark: '#111827',
  light: '#F2F5FA',
  white: '#FFFFFF',
  // gradiente de marca (solo isotipo y fondos)
  gradStart: '#3C9FF1',
  gradEnd: '#7025E0',
  // PENDIENTE DE APROBACIÓN: el brief pide "azul → cyan → blanco" pero no define el cyan.
  // Se usa solo en fondos del arco solución.
  cyan: '#3CD6EB',
  // estados de UI
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export type ColorToken = keyof typeof colors;

/** Convierte un token HEX a rgba con opacidad. Único mecanismo permitido para tintes. */
export const alpha = (hex: string, a: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/** Roles semánticos de UI, derivados de los tokens. */
export const ui = {
  surface: colors.white,
  background: colors.light,
  text: colors.textDark,
  textSecondary: alpha(colors.textDark, 0.6),
  textMuted: alpha(colors.textDark, 0.4),
  border: alpha(colors.textDark, 0.08),
  divider: alpha(colors.textDark, 0.06),
  primaryTint: alpha(colors.primary, 0.1),
  secondaryTint: alpha(colors.secondary, 0.16),
  successTint: alpha(colors.success, 0.14),
  warningTint: alpha(colors.warning, 0.16),
  dangerTint: alpha(colors.danger, 0.12),
  infoTint: alpha(colors.gradStart, 0.14),
} as const;

export const gradients = {
  brand: `linear-gradient(135deg, ${colors.gradStart} 0%, ${colors.gradEnd} 100%)`,
  problem: `radial-gradient(120% 120% at 30% 20%, ${colors.primary} 0%, ${colors.dark} 55%, ${colors.dark} 100%)`,
  solution: `linear-gradient(160deg, ${colors.gradStart} 0%, ${colors.cyan} 45%, ${colors.white} 100%)`,
} as const;

export const fonts = {
  brand: 'Nunito',
  ui: 'DM Sans',
} as const;

/** Escala tipográfica única (px @1080p o a escala 1 del teléfono). */
export const type = {
  headline: { fontFamily: fonts.brand, fontSize: 96, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 },
  tagline: { fontFamily: fonts.brand, fontSize: 48, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.5 },
  uiTitle: { fontFamily: fonts.ui, fontSize: 18, fontWeight: 600, lineHeight: 1.3 },
  uiBody: { fontFamily: fonts.ui, fontSize: 14, fontWeight: 400, lineHeight: 1.4 },
  // PENDIENTE DE APROBACIÓN: variante semibold del body para nombres de PDV y labels de fila.
  uiBodyStrong: { fontFamily: fonts.ui, fontSize: 14, fontWeight: 600, lineHeight: 1.35 },
  uiCaption: { fontFamily: fonts.ui, fontSize: 12, fontWeight: 500, lineHeight: 1.3 },
  kpi: { fontFamily: fonts.ui, fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: -0.5 },
} as const;

export type TypeRole = keyof typeof type;

/** spacing[0..5] = 4, 8, 12, 16, 24, 32 */
export const spacing = [4, 8, 12, 16, 24, 32] as const;
export const space = (i: 0 | 1 | 2 | 3 | 4 | 5) => spacing[i];

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const shadows = {
  card: `0 1px 2px ${alpha(colors.dark, 0.06)}, 0 4px 12px ${alpha(colors.dark, 0.06)}`,
  float: `0 12px 32px ${alpha(colors.dark, 0.14)}, 0 2px 6px ${alpha(colors.dark, 0.08)}`,
  device: `0 40px 80px ${alpha(colors.dark, 0.28)}, 0 12px 24px ${alpha(colors.dark, 0.16)}`,
  fab: `0 6px 16px ${alpha(colors.primary, 0.4)}`,
} as const;

/** Curvas de motion. Nada lineal. */
export const easings = {
  easeInOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** entrada suave con desaceleración larga */
  settle: Easing.bezier(0.22, 1, 0.36, 1),
  /** overshoot sutil (~4 %) y asentamiento */
  softOvershoot: Easing.bezier(0.34, 1.28, 0.64, 1),
  easeIn: Easing.bezier(0.55, 0, 0.9, 0.4),
} as const;

export type EasingName = keyof typeof easings;

/** Springs con damping alto (≥ 18). */
export const springs = {
  soft: { damping: 22, stiffness: 90, mass: 1 },
  magnet: { damping: 18, stiffness: 120, mass: 0.9 },
  firm: { damping: 26, stiffness: 160, mass: 1 },
} as const;

/** Regla de legibilidad: texto de UI que debe leerse nunca por debajo de este tamaño efectivo. */
export const MIN_LEGIBLE_PX = 22;
