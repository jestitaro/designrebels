import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { useCamera } from './Camera';

export const DEPTH = {
  /** foreground: se mueve más que la cámara */
  fg: 1.4,
  /** midground: se mueve con la cámara (plano del protagonista) */
  mg: 1,
  /** background: se mueve la mitad */
  bg: 0.5,
  /** fondo infinito: no se mueve */
  sky: 0,
} as const;

export type DepthName = keyof typeof DEPTH;

type Props = {
  depth?: DepthName | number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/**
 * Capa con parallax. Traslación y zoom de cámara se aplican escalados por el factor:
 * - desplazamiento: (cam - centro) × factor
 * - zoom: cam.zoom ^ factor (así el fg se acerca más rápido que el bg)
 * - rotación: cam.rotate × factor
 */
export const DepthLayer: React.FC<Props> = ({ depth = 'mg', children, style }) => {
  const cam = useCamera();
  const { width, height } = useVideoConfig();
  const k = typeof depth === 'number' ? depth : DEPTH[depth];
  const cx = width / 2;
  const cy = height / 2;
  const tx = (cam.x - cx) * k;
  const ty = (cam.y - cy) * k;
  const z = Math.pow(cam.zoom, k);
  // Pivot en el centro del frame: el punto de mundo (cx+tx, cy+ty) queda centrado.
  const transform = `translate(${cx}px, ${cy}px) rotate(${-cam.rotate * k}deg) scale(${z}) translate(${-cx - tx}px, ${-cy - ty}px)`;
  return (
    <AbsoluteFill style={{ transformOrigin: '0 0', transform, pointerEvents: 'none', ...style }}>
      {children}
    </AbsoluteFill>
  );
};

/** Posiciona un hijo en coordenadas de mundo (px) sin afectar el layout. */
export const Place: React.FC<{
  x: number;
  y: number;
  /** ancla: 0.5,0.5 = centro */
  anchor?: [number, number];
  scale?: number;
  rotate?: number;
  opacity?: number;
  z?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, anchor = [0.5, 0.5], scale = 1, rotate = 0, opacity = 1, z, children, style }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      zIndex: z,
      opacity,
      transform: `translate(${-anchor[0] * 100}%, ${-anchor[1] * 100}%) rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: `${anchor[0] * 100}% ${anchor[1] * 100}%`,
      ...style,
    }}
  >
    {children}
  </div>
);
