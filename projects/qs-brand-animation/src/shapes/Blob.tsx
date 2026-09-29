import React, { useId } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { blobPath } from './blobPath';

type Props = {
  seed: string;
  /** diámetro aproximado en px */
  size: number;
  x: number;
  y: number;
  /** colores del gradiente interno */
  from: string;
  to: string;
  opacity?: number;
  rotate?: number;
  /** 'radial' da bordes suaves sin usar filter: blur */
  fill?: 'linear' | 'radial' | 'solid';
  wobble?: number;
  points?: number;
  style?: React.CSSProperties;
};

/** Forma orgánica enorme para fondos y transiciones. SVG, sin blur. */
export const Blob: React.FC<Props> = ({ seed, size, x, y, from, to, opacity = 1, rotate = 0, fill = 'linear', wobble = 0.06, points = 7, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const id = useId().replace(/:/g, '');
  const d = blobPath(seed, { t: frame / fps, wobble, points, scale: 100 });
  const paint = fill === 'solid' ? from : `url(#g${id})`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-130 -130 260 260"
      style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible', opacity, transform: `rotate(${rotate}deg)`, ...style }}
    >
      <defs>
        {fill === 'radial' ? (
          <radialGradient id={`g${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={from} stopOpacity={1} />
            <stop offset="60%" stopColor={to} stopOpacity={0.5} />
            <stop offset="100%" stopColor={to} stopOpacity={0} />
          </radialGradient>
        ) : (
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        )}
      </defs>
      <path d={d} fill={paint} />
    </svg>
  );
};
