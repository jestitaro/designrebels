import React from 'react';
import { app, colors, radius, type, ui } from '../tokens';
import { enterStyle } from '../lib/easing';
import { Icon, IconName } from './Icon';

export type BadgeVariant = 'active' | 'scheduled' | 'done' | 'warning' | 'danger' | 'category' | 'info' | 'neutral';

/**
 * Tintes derivados de los tokens. Para contraste AA el texto va en textDark (o primary sobre su tinte)
 * y el color de estado se comunica con el punto/ícono.
 */
const variants: Record<BadgeVariant, { bg: string; fg: string; dot: string }> = {
  active: { bg: ui.check, fg: colors.white, dot: colors.white },
  scheduled: { bg: ui.primaryTint, fg: ui.accent, dot: ui.accent },
  done: { bg: ui.successTint, fg: ui.text, dot: ui.check },
  warning: { bg: ui.warningTint, fg: ui.text, dot: colors.warning },
  danger: { bg: ui.dangerTint, fg: ui.text, dot: colors.danger },
  category: { bg: app.chip, fg: ui.action, dot: ui.action },
  info: { bg: ui.infoTint, fg: ui.text, dot: colors.gradStart },
  neutral: { bg: ui.divider, fg: ui.textSecondary, dot: ui.textMuted },
};

type Props = {
  label: string;
  variant?: BadgeVariant;
  icon?: IconName;
  dot?: boolean;
  progress?: number;
  style?: React.CSSProperties;
};

export const Badge: React.FC<Props> = ({ label, variant = 'neutral', icon, dot = !icon, progress = 1, style }) => {
  const v = variants[variant];
  return (
    <span
      style={{
        ...type.uiCaption,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: radius.pill,
        background: v.bg,
        color: v.fg,
        whiteSpace: 'nowrap',
        ...enterStyle(progress, 6),
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={14} color={v.dot} strokeWidth={2} /> : null}
      {dot && !icon ? <span style={{ width: 6, height: 6, borderRadius: 3, background: v.dot }} /> : null}
      {label}
    </span>
  );
};

/** Badge numérico sobre íconos (pendientes). */
export const CountBadge: React.FC<{ count: number; progress?: number; style?: React.CSSProperties }> = ({
  count,
  progress = 1,
  style,
}) => (
  <span
    style={{
      ...type.uiCaption,
      fontSize: 11,
      fontWeight: 700,
      minWidth: 18,
      height: 18,
      padding: '0 5px',
      borderRadius: radius.pill,
      background: app.badge,
      color: colors.white,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 0 0 2px ${colors.white}`,
      transform: `scale(${0.6 + 0.4 * progress})`,
      opacity: progress,
      fontVariantNumeric: 'tabular-nums',
      ...style,
    }}
  >
    {count}
  </span>
);
