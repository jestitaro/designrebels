import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { Rings } from '../shapes/Rings';
import { Phone } from '../devices/Phone';
import { lerp, progressAt } from '../lib/easing';
import { alpha, colors, radius, shadows, type, ui } from '../tokens';
import { Badge, Card, ChartCard, DetectionBox, GaugeCard, MapCard, ProductThumb, ProgressBar, VisitsScreen } from '../ui';

/**
 * Escena 12 · Ecosistema (5 s). Zoom out: alrededor del teléfono orbitan los módulos como cards con UI real.
 * Sale con el colapso radial: los módulos giran al centro y aceleran (el único morph que acelera).
 */
export const S12_DURATION = 5;

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 540, zoom: 1.1 },
  { t: 1.4, x: 960, y: 540, zoom: 0.8, ease: 'easeInOut' },
  { t: 4, x: 960, y: 540, zoom: 0.78 },
  { t: 5, x: 960, y: 540, zoom: 0.9, ease: 'easeInOut' },
];

const Module: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    <Badge label={label} variant="scheduled" dot={false} style={{ fontSize: 16, padding: '8px 16px', background: colors.white, boxShadow: shadows.card }} />
    {children}
  </div>
);

const MODULES: { label: string; el: React.ReactNode }[] = [
  { label: 'Ejecución', el: (
      <Card width={300} elevation="float">
        <ProgressBar label="Ruta del día" value={0.8} />
        <div style={{ height: 12 }} />
        <ProgressBar label="Formularios" value={1} />
      </Card>
    ) },
  { label: 'Indicadores', el: <GaugeCard label="OSA" value={93} target={85} width={150} /> },
  { label: 'Información', el: <ChartCard variant="bars" width={320} elevation="float" /> },
  { label: 'Gestión', el: <MapCard width={320} mapHeight={150} elevation="float" /> },
  { label: 'AI', el: (
      <div style={{ position: 'relative', padding: 22, background: colors.dark, borderRadius: radius.lg, boxShadow: shadows.float }}>
        <DetectionBox width={110} height={130} label="Shampoo" confidence={0.93} status="valid">
        </DetectionBox>
        <div style={{ position: 'absolute', left: 22, top: 22, width: 110, height: 130, display: 'grid', placeItems: 'center' }}>
          <ProductThumb id="shampoo-azul" size={110} />
        </div>
      </div>
    ) },
];

export const S12Ecosistema: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  const collapse = at(4, 1, 'easeIn');
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground arc="solution" seed="s12" />
        </DepthLayer>
        <DepthLayer depth="bg">
          <Rings x={960} y={540} radii={[420, 560, 720]} color={alpha(colors.white, 0.6)} dash="2 12" rotate={frame * 0.08} opacity={at(0.6, 0.8) * (1 - collapse)} />
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={960} y={540} scale={0.95 * (1 - collapse * 0.9)} rotate={collapse * 40} opacity={1 - collapse}>
            <Phone>
              <VisitsScreen />
            </Phone>
          </Place>
          {MODULES.map((m, i) => {
            const enter = at(1.2 + i * 0.35, 0.7, 'softOvershoot');
            const a = (i / MODULES.length) * Math.PI * 2 - Math.PI / 2 + t * 0.06;
            const rx = 820;
            const ry = 430;
            const x = 960 + Math.cos(a) * rx;
            const y = 540 + Math.sin(a) * ry;
            return (
              <Place key={m.label} x={lerp(x, 960, collapse)} y={lerp(y, 540, collapse)} scale={1.35 * enter * interpolate(collapse, [0, 1], [1, 0.08])} rotate={collapse * (180 + i * 30)} opacity={enter}>
                <Module label={m.label}>{m.el}</Module>
              </Place>
            );
          })}
        </DepthLayer>
      </Camera>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...type.uiCaption, color: ui.text, opacity: 0 }} />
    </AbsoluteFill>
  );
};
