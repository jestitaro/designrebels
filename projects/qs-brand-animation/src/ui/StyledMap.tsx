import React from 'react';
import { evolvePath } from '@remotion/paths';
import { alpha, colors, type } from '../tokens';
import { sub } from '../lib/easing';

/**
 * Mapa estilizado en SVG con colores de marca. Se usa en MapCard y, escalado, como fondo del ruteo.
 * Coordenadas en un viewBox de 400×260.
 */
export const MAP_VIEWBOX = { w: 400, h: 260 };

export const DEFAULT_ROUTE = 'M48 196 L48 124 L150 124 L150 58 L262 58 L262 124 L352 124';
export const DEFAULT_STOPS: { x: number; y: number; label: string }[] = [
  { x: 48, y: 196, label: '1' },
  { x: 150, y: 124, label: '2' },
  { x: 262, y: 58, label: '3' },
  { x: 352, y: 124, label: '4' },
];

type Props = {
  /** 0→1 dibuja la ruta con strokeDashoffset y hace aparecer paradas */
  routeProgress?: number;
  route?: string;
  stops?: typeof DEFAULT_STOPS;
  /** parada destino destacada (PDV) */
  destination?: number;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
};

export const StyledMap: React.FC<Props> = ({
  routeProgress = 1,
  route = DEFAULT_ROUTE,
  stops = DEFAULT_STOPS,
  destination = stops.length - 1,
  width = '100%',
  height = '100%',
  style,
}) => {
  const evolved = evolvePath(routeProgress, route);
  const streetMinor = alpha(colors.white, 1);
  return (
    <svg viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`} width={width} height={height} preserveAspectRatio="xMidYMid slice" style={{ display: 'block', ...style }}>
      <rect width="400" height="260" fill={alpha(colors.gradStart, 0.1)} />
      {/* parque y plaza */}
      <rect x="170" y="140" width="72" height="56" rx="10" fill={alpha(colors.success, 0.18)} />
      <rect x="290" y="176" width="46" height="46" rx="23" fill={alpha(colors.success, 0.14)} />
      {/* calles secundarias */}
      {[20, 98, 206, 310, 380].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="260" stroke={streetMinor} strokeWidth="6" />
      ))}
      {[24, 92, 170, 214].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke={streetMinor} strokeWidth="6" />
      ))}
      {/* avenidas */}
      {[48, 150, 262, 352].map((x) => (
        <line key={`av${x}`} x1={x} y1="0" x2={x} y2="260" stroke={colors.white} strokeWidth="11" />
      ))}
      {[58, 124, 228].map((y) => (
        <line key={`ah${y}`} x1="0" y1={y} x2="400" y2={y} stroke={colors.white} strokeWidth="11" />
      ))}
      <line x1="-20" y1="250" x2="420" y2="-10" stroke={alpha(colors.secondary, 0.28)} strokeWidth="9" />

      {/* ruta: halo + línea */}
      <path d={route} fill="none" stroke={alpha(colors.primary, 0.18)} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset} />
      <path d={route} fill="none" stroke={colors.primary} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset} />

      {stops.map((s, i) => {
        const p = sub(routeProgress, (i / stops.length) * 0.92, (i / stops.length) * 0.92 + 0.14, 'softOvershoot');
        const isDest = i === destination;
        const r = isDest ? 13 : 10;
        return (
          <g key={i} transform={`translate(${s.x} ${s.y}) scale(${p})`} opacity={Math.min(1, p * 1.5)}>
            {isDest && <circle r={r + 8} fill={alpha(colors.primary, 0.16)} />}
            <circle r={r} fill={isDest ? colors.primary : colors.white} stroke={colors.primary} strokeWidth="3" />
            <text
              y="4"
              textAnchor="middle"
              style={{ ...type.uiCaption, fontSize: isDest ? 12 : 10, fontWeight: 700 }}
              fill={isDest ? colors.white : colors.primary}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
