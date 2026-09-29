import React from 'react';
import { alpha, colors, shadows, ui } from '../tokens';

export const LAPTOP = {
  screenW: 1280,
  screenH: 800,
  bezel: 18,
  radius: 22,
  baseH: 28,
  get width() {
    return this.screenW + this.bezel * 2;
  },
  get lidH() {
    return this.screenH + this.bezel * 2;
  },
} as const;

type Props = {
  children?: React.ReactNode;
  scale?: number;
  screenBackground?: string;
  style?: React.CSSProperties;
};

/** Laptop genérica, frontal, sin marca. Para el dashboard de tiempo real. */
export const Laptop: React.FC<Props> = ({ children, scale = 1, screenBackground = ui.background, style }) => (
  <div
    style={{
      width: LAPTOP.width,
      height: LAPTOP.lidH + LAPTOP.baseH,
      transform: `scale(${scale})`,
      transformOrigin: '50% 50%',
      position: 'relative',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: LAPTOP.width,
        height: LAPTOP.lidH,
        borderRadius: `${LAPTOP.radius}px ${LAPTOP.radius}px 6px 6px`,
        background: `linear-gradient(160deg, ${colors.dark}, ${colors.textDark})`,
        boxShadow: `${shadows.device}, inset 0 0 0 1.5px ${alpha(colors.white, 0.1)}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: LAPTOP.bezel,
          top: LAPTOP.bezel,
          width: LAPTOP.screenW,
          height: LAPTOP.screenH,
          borderRadius: 8,
          overflow: 'hidden',
          background: screenBackground,
          isolation: 'isolate',
        }}
      >
        {children}
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: -90,
        right: -90,
        top: LAPTOP.lidH - 2,
        height: LAPTOP.baseH,
        borderRadius: '4px 4px 28px 28px',
        background: `linear-gradient(180deg, ${alpha(colors.white, 0.95)} 0%, ${colors.light} 45%, ${alpha(colors.textDark, 0.25)} 100%)`,
        boxShadow: `0 20px 40px ${alpha(colors.dark, 0.25)}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: 220,
          height: 10,
          transform: 'translateX(-50%)',
          borderRadius: '0 0 10px 10px',
          background: alpha(colors.textDark, 0.12),
        }}
      />
    </div>
  </div>
);
