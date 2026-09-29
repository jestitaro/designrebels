import React from 'react';
import { radius, type, ui } from '../tokens';
import { sub } from '../lib/easing';
import { Card } from './Card';
import { Icon } from './Icon';
import { StyledMap } from './StyledMap';

type Props = {
  title?: string;
  summary?: string;
  progress?: number;
  width?: number;
  mapHeight?: number;
  elevation?: 'flat' | 'float';
  style?: React.CSSProperties;
};

export const MapCard: React.FC<Props> = ({
  title = 'Ruta del día',
  summary = '4 PDV · 12,4 km · 3 h 20 min',
  progress = 1,
  width = 358,
  mapHeight = 190,
  elevation = 'flat',
  style,
}) => (
  <Card progress={sub(progress, 0, 0.35)} padding={0} width={width} elevation={elevation} style={{ overflow: 'hidden', ...style }}>
    <div style={{ height: mapHeight, borderRadius: `${radius.md}px ${radius.md}px 0 0`, overflow: 'hidden' }}>
      <StyledMap routeProgress={sub(progress, 0.25, 1, 'easeInOut')} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: ui.primaryTint, display: 'grid', placeItems: 'center' }}>
        <Icon name="route" size={20} color={ui.accent} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ ...type.uiBodyStrong, color: ui.text }}>{title}</div>
        <div style={{ ...type.uiCaption, color: ui.textSecondary, marginTop: 2 }}>{summary}</div>
      </div>
      <Icon name="chevronRight" size={20} color={ui.textMuted} />
    </div>
  </Card>
);
