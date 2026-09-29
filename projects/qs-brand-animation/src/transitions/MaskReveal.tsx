import React from 'react';
import { AbsoluteFill } from 'remotion';
import { HEIGHT, WIDTH } from '../lib/time';
import { blobPath } from '../shapes/blobPath';

type Props = {
  progress: number;
  /** origen de la máscara */
  x?: number;
  y?: number;
  shape?: 'circle' | 'blob' | 'roundedRect';
  seed?: string;
  children: React.ReactNode;
};

/** Revela `children` a través de una máscara que crece desde (x, y) hasta cubrir el frame. */
export const MaskReveal: React.FC<Props> = ({ progress, x = WIDTH / 2, y = HEIGHT / 2, shape = 'circle', seed = 'mask', children }) => {
  // progress llega con curva (progressAt / springAt), igual que la prop progress de los componentes de UI
  const p = Math.min(1, Math.max(0, progress));
  // radio que garantiza cubrir las 4 esquinas
  const maxR = Math.hypot(Math.max(x, WIDTH - x), Math.max(y, HEIGHT - y)) * 1.08;
  const r = maxR * p;
  let clipPath: string;
  if (shape === 'circle') clipPath = `circle(${r}px at ${x}px ${y}px)`;
  else if (shape === 'roundedRect') {
    const k = 1 - p;
    clipPath = `inset(${y * k}px ${(WIDTH - x) * k}px ${(HEIGHT - y) * k}px ${x * k}px round ${48 * k + 1}px)`;
  } else {
    // blob: el radio base se escala a 1.25 para cubrir las irregularidades
    const d = blobPath(seed, { scale: 1, irregularity: 0.18, points: 7 });
    clipPath = `path('${scalePath(d, r * 1.25, x, y)}')`;
  }
  if (p >= 0.999) return <AbsoluteFill>{children}</AbsoluteFill>;
  return <AbsoluteFill style={{ clipPath, WebkitClipPath: clipPath }}>{children}</AbsoluteFill>;
};

/** Escala y traslada un path normalizado (radio 1, centrado en 0) a píxeles. */
const scalePath = (d: string, s: number, tx: number, ty: number) => {
  let isX = true;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const v = parseFloat(n);
    const out = isX ? v * s + tx : v * s + ty;
    isX = !isX;
    return out.toFixed(1);
  });
};
