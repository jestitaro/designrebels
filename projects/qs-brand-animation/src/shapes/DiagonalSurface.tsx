import React from 'react';

type Props = {
  /** ángulo de la superficie en grados */
  angle?: number;
  /** desplazamiento perpendicular: 0 = cubre medio frame, >0 avanza */
  offset?: number;
  from: string;
  to: string;
  opacity?: number;
};

/** Plano diagonal enorme. Útil como capa bg o como barrido en object wipe. */
export const DiagonalSurface: React.FC<Props> = ({ angle = -18, offset = 0, from, to, opacity = 1 }) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 4000,
      height: 4000,
      opacity,
      background: `linear-gradient(180deg, ${from} 0%, ${to} 60%)`,
      transform: `translate(-50%, 0) rotate(${angle}deg) translateY(${-offset}px)`,
      transformOrigin: '50% 0',
    }}
  />
);
