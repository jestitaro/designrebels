import React, { useId } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

type Props = {
  /** y base de la onda (px) */
  y: number;
  amplitude?: number;
  /** longitudes de onda visibles en el ancho */
  frequency?: number;
  speed?: number;
  from: string;
  to: string;
  opacity?: number;
  width?: number;
  height?: number;
  /** avance horizontal extra (para usarla como transición que barre el frame) */
  offset?: number;
};

/** Banda ondulada que ocupa desde `y` hasta abajo. Se puede subir para cubrir el frame. */
export const Wave: React.FC<Props> = ({ y, amplitude = 40, frequency = 1.2, speed = 0.08, from, to, opacity = 1, width = 1920, height = 1080, offset = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const id = useId().replace(/:/g, '');
  const t = frame / fps;
  const steps = 48;
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const x = (i / steps) * width;
    const ph = (i / steps) * Math.PI * 2 * frequency + t * Math.PI * 2 * speed + offset;
    return [x, y + Math.sin(ph) * amplitude + Math.sin(ph * 0.5 + 1.3) * amplitude * 0.35] as const;
  });
  const d = `M0 ${height + 10} L${pts.map(([x, py]) => `${x.toFixed(1)} ${py.toFixed(1)}`).join(' L')} L${width} ${height + 10} Z`;
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity }}>
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#w${id})`} />
    </svg>
  );
};
