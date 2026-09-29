import React from 'react';

/** Círculos concéntricos finos: órbitas del ecosistema y acentos de fondo. */
export const Rings: React.FC<{ x: number; y: number; radii: number[]; color: string; opacity?: number; strokeWidth?: number; dash?: string; rotate?: number }> = ({
  x,
  y,
  radii,
  color,
  opacity = 1,
  strokeWidth = 1.5,
  dash,
  rotate = 0,
}) => {
  const max = Math.max(...radii);
  return (
    <svg width={max * 2 + 4} height={max * 2 + 4} style={{ position: 'absolute', left: x - max - 2, top: y - max - 2, opacity, transform: `rotate(${rotate}deg)`, overflow: 'visible' }}>
      {radii.map((r) => (
        <circle key={r} cx={max + 2} cy={max + 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
      ))}
    </svg>
  );
};
