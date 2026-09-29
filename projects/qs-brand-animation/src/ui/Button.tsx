import React from 'react';
import { alpha, colors, radius, shadows, type, ui } from '../tokens';
import { enterStyle } from '../lib/easing';
import { Icon, IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  variant?: ButtonVariant;
  icon?: IconName;
  fullWidth?: boolean;
  progress?: number;
  /** 0→1→0 para simular el tap (escala + ripple) */
  press?: number;
  /** estado de éxito: reemplaza el label por un check */
  done?: boolean;
  style?: React.CSSProperties;
};

const styles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: ui.action, color: colors.white, boxShadow: shadows.fab },
  secondary: { background: ui.surface, color: ui.action, border: `1.5px solid ${ui.action}` },
  ghost: { background: 'transparent', color: ui.focus },
  danger: { background: 'transparent', color: colors.danger, border: `1.5px solid ${alpha(colors.danger, 0.4)}` },
};

export const Button: React.FC<Props> = ({
  label,
  variant = 'primary',
  icon,
  fullWidth,
  progress = 1,
  press = 0,
  done = false,
  style,
}) => {
  const s = styles[variant];
  return (
    <div
      style={{
        ...type.uiBodyStrong,
        position: 'relative',
        overflow: 'hidden',
        display: fullWidth ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        padding: '0 24px',
        borderRadius: radius.sm,
        boxSizing: 'border-box',
        width: fullWidth ? '100%' : undefined,
        ...s,
        ...(done ? { background: ui.check, color: colors.white, boxShadow: 'none', border: 'none' } : null),
        ...enterStyle(progress, 10),
        transform: `${enterStyle(progress, 10).transform} scale(${1 - press * 0.035})`,
        ...style,
      }}
    >
      {press > 0 && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: alpha(variant === 'primary' ? colors.white : ui.action, 0.18 * press),
            transform: `translate(-50%, -50%) scale(${0.2 + press * 0.8})`,
          }}
        />
      )}
      {done ? <Icon name="check" size={20} strokeWidth={2.4} /> : icon ? <Icon name={icon} size={18} strokeWidth={2} /> : null}
      <span style={{ position: 'relative' }}>{label}</span>
    </div>
  );
};
