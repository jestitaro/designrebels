import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { alpha, colors, easings, gradients } from '../tokens';
import { Blob } from './Blob';

type Arc = 'problem' | 'solution' | 'closing';

type Props = {
  arc?: Arc;
  /** 0 = problema, 1 = solución. Si se define, pisa `arc` y cruza los dos fondos (escena 3). */
  mix?: number;
  /** semilla de la composición de blobs */
  seed?: string;
  /** deriva lenta en px para que el fondo nunca esté quieto */
  driftAmount?: number;
};

/** Fondo base de cada arco: gradiente amplio + blobs enormes en movimiento lento. Nunca plano. */
export const GradientBackground: React.FC<Props> = ({ arc = 'solution', mix, seed = 'bg', driftAmount = 40 }) => {
  const m = mix ?? (arc === 'problem' ? 0 : 1);
  return (
    <AbsoluteFill>
      {m < 1 && (
        <AbsoluteFill style={{ opacity: 1 }}>
          <ProblemLayer seed={seed} drift={driftAmount} />
        </AbsoluteFill>
      )}
      {m > 0 && (
        <AbsoluteFill style={{ opacity: m }}>{arc === 'closing' && mix === undefined ? <ClosingLayer seed={seed} /> : <SolutionLayer seed={seed} drift={driftAmount} />}</AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const useDrift = (amount: number, period = 14, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return [Math.sin((t / period) * Math.PI * 2 + phase) * amount, Math.cos((t / period) * Math.PI * 2 * 0.8 + phase) * amount * 0.6] as const;
};

const ProblemLayer: React.FC<{ seed: string; drift: number }> = ({ seed, drift }) => {
  const [dx, dy] = useDrift(drift);
  const [ex, ey] = useDrift(drift * 0.7, 18, 2);
  return (
    <AbsoluteFill style={{ background: gradients.problem }}>
      <Blob seed={`${seed}-p1`} size={1400} x={260 + dx} y={180 + dy} from={alpha(colors.primary, 0.55)} to={colors.dark} fill="radial" />
      <Blob seed={`${seed}-p2`} size={1100} x={1680 + ex} y={900 + ey} from={alpha(colors.secondary, 0.35)} to={colors.dark} fill="radial" />
      <Blob seed={`${seed}-p3`} size={700} x={1500 - dx} y={160 - dy} from={alpha(colors.gradStart, 0.18)} to={colors.dark} fill="radial" />
      <Vignette color={colors.dark} strength={0.55} />
    </AbsoluteFill>
  );
};

const SolutionLayer: React.FC<{ seed: string; drift: number }> = ({ seed, drift }) => {
  const [dx, dy] = useDrift(drift);
  const [ex, ey] = useDrift(drift * 0.8, 16, 1.4);
  return (
    <AbsoluteFill style={{ background: gradients.solution }}>
      <Blob seed={`${seed}-s1`} size={1500} x={1640 + dx} y={140 + dy} from={alpha(colors.gradStart, 0.9)} to={colors.gradStart} fill="radial" />
      <Blob seed={`${seed}-s2`} size={1200} x={220 + ex} y={960 + ey} from={alpha(colors.white, 0.95)} to={colors.white} fill="radial" />
      <Blob seed={`${seed}-s3`} size={800} x={420 - dx} y={200 - dy} from={alpha(colors.cyan, 0.7)} to={colors.cyan} fill="radial" />
      <Blob seed={`${seed}-s4`} size={560} x={1300 + ex} y={820 - ey} from={alpha(colors.secondary, 0.22)} to={colors.secondary} fill="radial" />
    </AbsoluteFill>
  );
};

const ClosingLayer: React.FC<{ seed: string }> = ({ seed }) => {
  const [dx, dy] = useDrift(24, 20);
  return (
    <AbsoluteFill style={{ background: colors.white }}>
      <Blob seed={`${seed}-c1`} size={1300} x={1700 + dx} y={-40 + dy} from={alpha(colors.secondary, 0.16)} to={colors.white} fill="radial" />
      <Blob seed={`${seed}-c2`} size={1100} x={120 - dx} y={1100 - dy} from={alpha(colors.gradStart, 0.12)} to={colors.white} fill="radial" />
    </AbsoluteFill>
  );
};

const Vignette: React.FC<{ color: string; strength: number }> = ({ color, strength }) => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 50%, transparent 55%, ${alpha(color, strength)} 100%)` }} />
);

/** Helper: mix animado entre arcos para la escena 3. */
export const useArcMix = (startFrame: number, durFrames: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, startFrame + durFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easings.easeInOut });
};
