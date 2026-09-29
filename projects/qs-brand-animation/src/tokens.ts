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
  // cyan del arco solución (aprobado)
  cyan: '#3CD6EB',
  // semáforo (indicadores_svg de PSMob, versión oscura)
  success: '#3FD073',
  warning: '#FDE047',
  danger: '#D24040',
} as const;

/**
 * Paleta de la app PSMob, extraída de las pantallas oficiales (SVG de Figma).
 * La UI de producto usa estos valores; la marca (primary, gradientes) queda para fondos, isotipo y kinetic type.
 */
export const app = {
  /** header y cromo de la app */
  header: '#1D4ED8',
  /** CTA principal, FAB, nav activa, chips de categoría */
  action: '#8258A4',
  /** foco de inputs, acordeón abierto, links */
  focus: '#3880FF',
  /** card de indicadores sobre el header */
  indicatorCard: '#143A8C',
  /** pill "Últ. act." y track inferior de la card de indicadores */
  updatePill: '#615EFF',
  indicatorTrack: '#1C55A6',
  /** checks de validación (contraste sobre blanco) */
  check: '#0BB783',
  /** badge numérico de pendientes */
  badge: '#FF3D32',
  /** fondo de chip de categoría */
  chip: '#F3EEF6',
  /** skeleton / placeholders de contenido */
  skeleton: '#C6CCD3',
  // niveles de lectura: un solo set de grises para toda la UI
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  background: '#F1F5F9',
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

/**
 * Indicadores (indicadores_svg de PSMob). El color del arco depende del estado y del fondo.
 * `neutral` es para indicadores sin semáforo (ej. Exhibición).
 */
export type GaugeStatus = 'ok' | 'warn' | 'bad' | 'neutral';
export const gaugeColors = {
  light: { ok: '#86EFAC', warn: '#FDE047', bad: '#D24040', neutral: '#1D4ED8', track: '#F1F5F9', value: '#334155', unit: '#64748B', label: '#64748B' },
  dark: { ok: '#41D175', warn: '#FDE047', bad: '#D24040', neutral: '#67A9F5', track: 'rgba(181, 202, 241, 0.3)', value: '#FFFFFF', unit: '#93C5FD', label: '#FFFFFF', target: '#3FD073', targetText: '#86EFAC', tile: 'rgba(0, 0, 0, 0.3)' },
} as const;

/** Estado por defecto respecto del objetivo: ≥ objetivo ok, hasta 10 puntos abajo warn, más abajo bad. */
export const gaugeStatus = (value: number, target?: number): GaugeStatus =>
  target === undefined ? 'neutral' : value >= target ? 'ok' : value >= target - 10 ? 'warn' : 'bad';

/** Roles semánticos de UI, derivados de los tokens. */
export const ui = {
  surface: colors.white,
  background: app.background,
  /** texto principal: gris oscuro */
  text: app.textPrimary,
  /** texto secundario: gris medio */
  textSecondary: app.textSecondary,
  /** texto terciario / íconos inactivos / placeholders: gris claro */
  textMuted: app.textTertiary,
  border: app.border,
  divider: alpha(app.textPrimary, 0.06),
  accent: app.header,
  action: app.action,
  focus: app.focus,
  check: app.check,
  primaryTint: alpha(app.header, 0.08),
  secondaryTint: app.chip,
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
  fab: `0 6px 16px ${alpha(app.action, 0.4)}`,
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
