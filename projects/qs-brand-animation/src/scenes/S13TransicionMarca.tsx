import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { GradientBackground } from '../shapes/GradientBackground';
import { IsoTriangles, triangleCenter } from '../brand/IsoTriangles';
import { ISO_TRIANGLES } from '../brand/isoPaths';
import { progressAt } from '../lib/easing';
import { randRange, randSigned } from '../lib/random';
import { colors, springs } from '../tokens';

/**
 * Escena 13 · Transición a marca (3 s). Lo que colapsó en la escena 12 se abre en partículas
 * que se ordenan como los 20 triángulos del isotipo oficial (stagger radial desde el centro).
 * Termina con el isotipo centrado al tamaño con el que arranca la escena 14.
 */
export const S13_DURATION = 3;

/** Tamaño del isotipo al inicio de la escena 14 (lockup de 150 px × 1.35). */
export const ISO_HANDOFF_SIZE = 565 * (220.6 / (525.5 - 22.6)) * (150 / 248) * 1.35;

const order = ISO_TRIANGLES.map((_, i) => {
  const [cx, cy] = triangleCenter(i);
  return Math.hypot(cx - 282.5, cy - 282.5);
});
const maxD = Math.max(...order);

export const S13TransicionMarca: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const white = progressAt(frame, 0.2, 2.2, 'easeInOut', fps);
  return (
    <AbsoluteFill>
      <GradientBackground arc="solution" seed="s13" />
      <AbsoluteFill style={{ background: colors.white, opacity: white }} />
      <div style={{ position: 'absolute', left: 960 - ISO_HANDOFF_SIZE / 2, top: 540 - ISO_HANDOFF_SIZE / 2 }}>
        <IsoTriangles
          size={ISO_HANDOFF_SIZE}
          triangle={(i) => {
            const delay = 0.15 + (order[i] / maxD) * 0.6;
            const s = spring({ frame: frame - Math.round(delay * fps), fps, config: springs.soft });
            const ang = randRange(`s13-a${i}`, 0, Math.PI * 2);
            const r = randRange(`s13-r${i}`, 380, 900);
            return {
              x: Math.cos(ang) * r * (1 - s),
              y: Math.sin(ang) * r * (1 - s),
              rotate: randSigned(`s13-rot${i}`, 140) * (1 - s),
              scale: 0.3 + 0.7 * s,
              opacity: Math.min(1, s * 3),
            };
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
