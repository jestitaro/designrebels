import { interpolate, spring } from 'remotion';
import { easings, EasingName, springs } from '../tokens';
import { FPS, sec } from './time';

export { easings };

/**
 * Progreso 0→1 entre startSec y startSec+durSec, con la curva indicada.
 * Es el helper base para alimentar la prop `progress` de los componentes.
 */
export const progressAt = (
  frame: number,
  startSec: number,
  durSec: number,
  ease: EasingName = 'settle',
  fps: number = FPS,
) =>
  interpolate(frame, [sec(startSec, fps), sec(startSec + durSec, fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easings[ease],
  });

/** Igual que progressAt pero en frames (para uso dentro de componentes). */
export const progressFrames = (frame: number, start: number, dur: number, ease: EasingName = 'settle') =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easings[ease],
  });

/** Sub-rango de un progress 0→1: remapea [a, b] a [0, 1] con curva. Útil para escalonar dentro de un componente. */
export const sub = (p: number, a: number, b: number, ease: EasingName = 'settle') =>
  interpolate(p, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easings[ease] });

/** Escalonado: progreso del ítem i de n dentro de un progress global. */
export const stagger = (p: number, i: number, n: number, overlap = 0.6, ease: EasingName = 'settle') => {
  const slot = 1 / (n - (n - 1) * overlap);
  const start = i * slot * (1 - overlap);
  return sub(p, start, start + slot, ease);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const springAt = (frame: number, startSec: number, config: keyof typeof springs = 'soft', fps: number = FPS) =>
  spring({ frame: frame - sec(startSec, fps), fps, config: springs[config] });

/** Respiración leve (px), determinística. Para personajes: amplitud 2–4 px. */
export const breathe = (frame: number, amplitude = 3, periodSec = 3.2, phase = 0, fps: number = FPS) => {
  const a = Math.min(4, Math.max(2, amplitude));
  return Math.sin(((frame / fps) * Math.PI * 2) / periodSec + phase) * a;
};

/** Flotación lenta para elementos de UI en el espacio. */
export const drift = (frame: number, amplitude = 6, periodSec = 5, phase = 0, fps: number = FPS) =>
  Math.sin(((frame / fps) * Math.PI * 2) / periodSec + phase) * amplitude;

/** Transform de entrada estándar para UI: sube, aparece y escala muy poco (sin pops). */
export const enterStyle = (p: number, distance = 16): React.CSSProperties => ({
  opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  transform: `translateY(${(1 - p) * distance}px) scale(${0.97 + 0.03 * p})`,
});
