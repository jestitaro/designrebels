import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place, zoomToRect } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { Rings } from '../shapes/Rings';
import { Phone, PHONE } from '../devices/Phone';
import { phoneScreenRect } from '../transitions/zoomThrough';
import { drift, lerp, progressAt } from '../lib/easing';
import { alpha, colors, springs } from '../tokens';
import { spring } from 'remotion';
import { GaugeCard, ListRow, PDVS, Toast, VisitsScreen } from '../ui';

/**
 * Escena 3 · Aparece QuartzSales (4.5 s). El teléfono entra y magnetiza el stack de cards de la escena 2.
 * El fondo pasa de problema a solución: primer alivio. Sale con zoom through a la pantalla.
 */
export const S03_DURATION = 4.5;

const PX = 1120;
const PY = 540;
const PS = 0.9;

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 540, zoom: 1 },
  { t: 2.8, x: PX - 250, y: PY, zoom: 1.2, ease: 'easeInOut' },
  { t: 4.5, ...zoomToRect(phoneScreenRect(PX, PY, PS)), ease: 'easeInOut' },
];

import { stackPos } from './S02Complejidad';
/** Destino: la fila i de VisitsScreen dentro del teléfono (coordenadas de mundo). */
const rowTarget = (i: number) => {
  const sx = PX - (PHONE.screenW * PS) / 2;
  const sy = PY - (PHONE.screenH * PS) / 2;
  return { x: sx + (PHONE.screenW / 2) * PS, y: sy + (243 + i * 110) * PS };
};

const MagnetCard: React.FC<{ i: number; frameOffset?: number; opacity?: number }> = ({ i, frameOffset = 0, opacity = 1 }) => {
  const frame = useCurrentFrame() - frameOffset;
  const { fps } = useVideoConfig();
  const start = Math.round((0.9 + i * 0.09) * fps);
  const s = spring({ frame: frame - start, fps, config: springs.magnet });
  const a = stackPos(i);
  const b = rowTarget(i);
  // al llegar se funde con la fila real de la pantalla
  const land = interpolate(s, [0.85, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pdv = PDVS[i];
  return (
    <Place x={lerp(a.x, b.x, s)} y={lerp(a.y, b.y, s)} scale={PS} rotate={(1 - s) * (i % 2 ? 2 : -2)} opacity={opacity * land}>
      <ListRow index={i + 1} title={pdv.name} address={pdv.address} time={pdv.time} status={pdv.status} style={{ width: 358 }} />
    </Place>
  );
};

export const S03Aparece: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mix = progressAt(frame, 1.6, 1.4, 'easeInOut', fps);
  const enter = spring({ frame: frame - Math.round(0.2 * fps), fps, config: springs.soft });
  const px = lerp(1560, PX, enter);
  const py = lerp(1420, PY, enter);
  const screenP = interpolate(frame / fps, [1.1, 2.7], [0.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground mix={mix} seed="s03" />
        </DepthLayer>
        <DepthLayer depth="bg">
          <Rings x={PX} y={PY} radii={[460, 620, 800]} color={alpha(colors.white, 0.55)} dash="2 12" rotate={frame * 0.06} opacity={mix} />
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={px} y={py} scale={PS} rotate={(1 - enter) * 12}>
            <Phone>
              <VisitsScreen progress={screenP} highlight={1} />
            </Phone>
          </Place>
          {PDVS.map((_, i) => (
            <React.Fragment key={i}>
              <MagnetCard i={i} frameOffset={4} opacity={0.15} />
              <MagnetCard i={i} frameOffset={2} opacity={0.3} />
              <MagnetCard i={i} />
            </React.Fragment>
          ))}
        </DepthLayer>
        <DepthLayer depth="fg">
          <Place x={640} y={330 + drift(frame, 6, 5)}>
            <Toast title="Ruta optimizada" message="5 PDV · 3 h 20 min" progress={progressAt(frame, 2.6, 0.6, 'softOvershoot', fps)} />
          </Place>
          <Place x={690} y={800 + drift(frame, 7, 6, 1)}>
            <GaugeCard label="OSA" value={96} target={85} width={140} progress={progressAt(frame, 2.9, 0.8, 'settle', fps)} />
          </Place>
        </DepthLayer>
      </Camera>
    </AbsoluteFill>
  );
};
