import React from 'react';
import { radius, shadows, ui } from '../tokens';
import { enterStyle } from '../lib/easing';

type Props = {
  children: React.ReactNode;
  progress?: number;
  padding?: number;
  /** 'flat' dentro de la pantalla, 'float' cuando la card vive fuera del device */
  elevation?: 'flat' | 'float';
  width?: number | string;
  style?: React.CSSProperties;
};

export const Card: React.FC<Props> = ({ children, progress = 1, padding = 16, elevation = 'flat', width, style }) => (
  <div
    style={{
      background: ui.surface,
      borderRadius: radius.md,
      padding,
      width,
      boxShadow: elevation === 'float' ? shadows.float : shadows.card,
      border: `1px solid ${ui.border}`,
      boxSizing: 'border-box',
      ...enterStyle(progress, elevation === 'float' ? 24 : 12),
      ...style,
    }}
  >
    {children}
  </div>
);
