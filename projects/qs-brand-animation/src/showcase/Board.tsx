import React from 'react';
import { AbsoluteFill } from 'remotion';
import { alpha, colors, type, ui } from '../tokens';

/** Zoom de los componentes en las láminas: a 1,45× el caption (12 px) queda en ~17 px en el PNG. */
export const BOARD_ZOOM = 1.45;

export const Board: React.FC<{ title: string; page: string; children: React.ReactNode; zoom?: number; dark?: boolean }> = ({ title, page, children, zoom = BOARD_ZOOM, dark }) => (
  <AbsoluteFill style={{ background: dark ? colors.dark : ui.background, color: dark ? colors.white : ui.text }}>
    <div style={{ position: 'absolute', left: 64, top: 44, right: 64, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <div style={{ ...type.tagline, fontSize: 40 }}>{title}</div>
      <div style={{ ...type.uiTitle, color: dark ? alpha(colors.white, 0.6) : ui.textSecondary }}>PSMob · ComponentShowcase · {page}</div>
    </div>
    <div style={{ position: 'absolute', left: 64, top: 124, right: 64, bottom: 40 }}>
      <div style={{ zoom, width: '100%', height: '100%' }}>{children}</div>
    </div>
  </AbsoluteFill>
);

export const Section: React.FC<{ label: string; children: React.ReactNode; style?: React.CSSProperties; dark?: boolean }> = ({ label, children, style, dark }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
    <div style={{ ...type.uiCaption, color: dark ? alpha(colors.white, 0.6) : ui.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    {children}
  </div>
);

export const Col: React.FC<{ children: React.ReactNode; width?: number; gap?: number }> = ({ children, width = 390, gap = 20 }) => (
  <div style={{ width, display: 'flex', flexDirection: 'column', gap, flexShrink: 0 }}>{children}</div>
);

export const Row: React.FC<{ children: React.ReactNode; gap?: number; wrap?: boolean; style?: React.CSSProperties }> = ({ children, gap = 8, wrap, style }) => (
  <div style={{ display: 'flex', gap, flexWrap: wrap ? 'wrap' : 'nowrap', alignItems: 'center', ...style }}>{children}</div>
);
