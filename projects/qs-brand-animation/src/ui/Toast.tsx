import React from 'react';
import { colors, radius, shadows, type, ui } from '../tokens';
import { enterStyle } from '../lib/easing';
import { Icon, IconName } from './Icon';

export type ToastVariant = 'success' | 'info' | 'warning' | 'danger' | 'offline';

const map: Record<ToastVariant, { icon: IconName; color: string; tint: string }> = {
  success: { icon: 'checkCircle', color: ui.check, tint: ui.successTint },
  info: { icon: 'bell', color: ui.accent, tint: ui.primaryTint },
  warning: { icon: 'alert', color: colors.warning, tint: ui.warningTint },
  danger: { icon: 'alert', color: colors.danger, tint: ui.dangerTint },
  offline: { icon: 'wifiOff', color: ui.text, tint: ui.divider },
};

type Props = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  icon?: IconName;
  progress?: number;
  width?: number;
  style?: React.CSSProperties;
};

export const Toast: React.FC<Props> = ({ title, message, variant = 'success', icon, progress = 1, width = 358, style }) => {
  const v = map[variant];
  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '12px 16px',
        background: ui.surface,
        borderRadius: radius.md,
        boxShadow: shadows.float,
        border: `1px solid ${ui.border}`,
        ...enterStyle(progress, -16),
        ...style,
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 18, background: v.tint, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon ?? v.icon} size={20} color={v.color} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...type.uiBodyStrong, color: ui.text }}>{title}</div>
        {message && <div style={{ ...type.uiCaption, fontWeight: 400, color: ui.textSecondary, marginTop: 2 }}>{message}</div>}
      </div>
    </div>
  );
};
