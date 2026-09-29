import React from 'react';
import { interpolateColors } from 'remotion';
import { interpolatePath } from '@remotion/paths';

type Props = {
  progress: number;
  from: string;
  to: string;
  fromColor: string;
  toColor: string;
  width: number;
  height: number;
  viewBox?: string;
  style?: React.CSSProperties;
};

/**
 * Morph entre dos paths SVG (misma cantidad de puntos da el resultado más limpio).
 * Se usa para: mensaje → form, gráfico → góndola, módulos → triángulos del isotipo.
 */
export const ShapeMorph: React.FC<Props> = ({ progress, from, to, fromColor, toColor, width, height, viewBox = `0 0 ${width} ${height}`, style }) => {
  // progress llega con curva (progressAt / springAt), igual que la prop progress de los componentes de UI
  const p = Math.min(1, Math.max(0, progress));
  const d = interpolatePath(p, from, to);
  const fill = interpolateColors(p, [0, 1], [fromColor, toColor]);
  return (
    <svg width={width} height={height} viewBox={viewBox} style={{ overflow: 'visible', ...style }}>
      <path d={d} fill={fill} />
    </svg>
  );
};

/** Rect redondeado como path (para morphs entre cards, burbujas y formularios). */
export const roundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${x + rr} ${y} L${x + w - rr} ${y} Q${x + w} ${y} ${x + w} ${y + rr} L${x + w} ${y + h - rr} Q${x + w} ${y + h} ${x + w - rr} ${y + h} L${x + rr} ${y + h} Q${x} ${y + h} ${x} ${y + h - rr} L${x} ${y + rr} Q${x} ${y} ${x + rr} ${y} Z`;
};
