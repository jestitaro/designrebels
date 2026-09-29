import React from 'react';
import { alpha, colors, type } from '../tokens';
import { enterStyle } from '../lib/easing';
import { STATUS_BAR_H } from '../devices/Phone';
import { Icon, IconName } from './Icon';
import { CountBadge } from './Badge';

type Action = { icon: IconName; count?: number };

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  actions?: Action[];
  /** fila inferior: chips de filtro, breadcrumb de visita activa, SyncIndicator… */
  children?: React.ReactNode;
  /** deja lugar a la status bar cuando el header va dentro de <Phone> */
  statusBar?: boolean;
  progress?: number;
  style?: React.CSSProperties;
};

export const HEADER_H = 56;

export const AppHeader: React.FC<Props> = ({
  title,
  subtitle,
  back,
  actions = [],
  children,
  statusBar = true,
  progress = 1,
  style,
}) => (
  <div
    style={{
      background: colors.primary,
      color: colors.white,
      paddingTop: statusBar ? STATUS_BAR_H : 0,
      boxShadow: `0 2px 12px ${alpha(colors.dark, 0.18)}`,
      position: 'relative',
      zIndex: 10,
      ...style,
    }}
  >
    <div style={{ height: HEADER_H, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, ...enterStyle(progress, 6) }}>
      {back && <Icon name="chevronLeft" size={24} strokeWidth={2} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...type.uiTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {subtitle && <div style={{ ...type.uiCaption, opacity: 0.8, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {actions.map((a, i) => (
        <div key={i} style={{ position: 'relative', width: 36, height: 36, display: 'grid', placeItems: 'center' }}>
          <Icon name={a.icon} size={22} />
          {a.count ? <CountBadge count={a.count} style={{ position: 'absolute', top: 1, right: -2, boxShadow: `0 0 0 2px ${colors.primary}` }} /> : null}
        </div>
      ))}
    </div>
    {children && <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, ...enterStyle(progress, 6) }}>{children}</div>}
  </div>
);
