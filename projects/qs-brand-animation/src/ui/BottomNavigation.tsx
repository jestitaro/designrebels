import React from 'react';
import { colors, type, ui } from '../tokens';
import { Icon, IconName } from './Icon';
import { CountBadge } from './Badge';

export type NavTab = { label: string; icon: IconName; count?: number };

export const DEFAULT_TABS: NavTab[] = [
  { label: 'Inicio', icon: 'home' },
  { label: 'Info PDV', icon: 'store' },
  { label: 'Visitas', icon: 'calendar', count: 3 },
  { label: 'Forms', icon: 'clipboard', count: 2 },
  { label: 'Productos', icon: 'box' },
];

export const NAV_H = 64;

type Props = {
  tabs?: NavTab[];
  active?: number;
  progress?: number;
  style?: React.CSSProperties;
};

export const BottomNavigation: React.FC<Props> = ({ tabs = DEFAULT_TABS, active = 2, progress = 1, style }) => (
  <div
    style={{
      height: NAV_H + 16,
      paddingBottom: 16,
      boxSizing: 'border-box',
      background: ui.surface,
      borderTop: `1px solid ${ui.border}`,
      display: 'flex',
      transform: `translateY(${(1 - progress) * 40}px)`,
      ...style,
    }}
  >
    {tabs.map((t, i) => {
      const on = i === active;
      const c = on ? colors.primary : ui.textMuted;
      return (
        <div key={t.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' }}>
          {on && <div style={{ position: 'absolute', top: 0, width: 28, height: 3, borderRadius: 2, background: colors.primary }} />}
          <div style={{ position: 'relative' }}>
            <Icon name={t.icon} size={22} color={c} strokeWidth={on ? 2 : 1.75} />
            {t.count ? <CountBadge count={t.count} style={{ position: 'absolute', top: -6, right: -10 }} /> : null}
          </div>
          <span style={{ ...type.uiCaption, fontSize: 11, color: c, fontWeight: on ? 600 : 500 }}>{t.label}</span>
        </div>
      );
    })}
  </div>
);
