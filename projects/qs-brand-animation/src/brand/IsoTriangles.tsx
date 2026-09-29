import React, { useId } from 'react';
import { ISO_GRADIENT, ISO_TRIANGLES, ISO_VIEWBOX } from './isoPaths';

export type TriangleStyle = { x?: number; y?: number; scale?: number; rotate?: number; opacity?: number };

type Props = {
  size: number;
  /** transformación por triángulo (en unidades del viewBox 565×565), para colapsos y morphs */
  triangle?: (i: number) => TriangleStyle;
  /** pinta cada triángulo con el gradiente oficial en coordenadas absolutas (se ve como el isotipo entero) */
  style?: React.CSSProperties;
};

/** Isotipo oficial como 20 triángulos independientes. Con `triangle` sin definir, es idéntico a iso-qs.svg. */
export const IsoTriangles: React.FC<Props> = ({ size, triangle, style }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox={ISO_VIEWBOX} style={{ overflow: 'visible', display: 'block', ...style }}>
      <defs>
        <linearGradient id={`iso${id}`} gradientUnits="userSpaceOnUse" x1={ISO_GRADIENT.x1} y1={ISO_GRADIENT.y1} x2={ISO_GRADIENT.x2} y2={ISO_GRADIENT.y2}>
          {ISO_GRADIENT.stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      {ISO_TRIANGLES.map((d, i) => {
        const t = triangle?.(i) ?? {};
        const c = triangleCenter(i);
        const tr = `translate(${t.x ?? 0} ${t.y ?? 0}) rotate(${t.rotate ?? 0} ${c[0]} ${c[1]}) translate(${c[0]} ${c[1]}) scale(${t.scale ?? 1}) translate(${-c[0]} ${-c[1]})`;
        return <path key={i} d={d} fill={`url(#iso${id})`} transform={tr} opacity={t.opacity ?? 1} />;
      })}
    </svg>
  );
};

/** Centro aproximado de cada triángulo (promedio de coordenadas del subpath), para rotar/escalar sobre sí mismo. */
const centers = ISO_TRIANGLES.map((d) => {
  const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    sx += nums[i];
    sy += nums[i + 1];
    n++;
  }
  return [sx / n, sy / n] as [number, number];
});
export const triangleCenter = (i: number) => centers[i];
