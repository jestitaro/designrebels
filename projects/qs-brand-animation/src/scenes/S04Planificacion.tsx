import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place, zoomToRect } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { Rings } from '../shapes/Rings';
import { Phone } from '../devices/Phone';
import { phoneScreenRect } from '../transitions/zoomThrough';
import { drift, progressAt } from '../lib/easing';
import { alpha, colors, type } from '../tokens';
import { Badge, FootageCard, MapCard, VisitsScreen } from '../ui';

/**
 * Escena 4 · Planificación (5 s). Entra con la pantalla de visitas llenando el frame (continúa el zoom through),
 * las visitas se ordenan y la cámara se aleja: pines, equipo (avatares con fotos reales) y badges alrededor.
 * Sale con match cut: el pin 4 queda en (1260, 520) de pantalla, donde arranca la escena 5.
 */
export const S04_DURATION = 5;

const PX = 960;
const PY = 540;
const PS = 0.9;
const END = { x: 1000, y: 520, zoom: 1.08 };

const KEYS: CameraKeyframe[] = [
  { t: 0, ...zoomToRect(phoneScreenRect(PX, PY, PS)) },
  { t: 2.2 },
  { t: 3.6, x: 960, y: 540, zoom: 1, ease: 'easeInOut' },
  { t: 5, ...END, ease: 'easeInOut' },
];

/** Pin 4 en coordenadas de mundo para que al final quede en (1260, 520) de pantalla. */
export const PIN_SCREEN = { x: 1260, y: 520 };
const PIN_WORLD = { x: END.x + (PIN_SCREEN.x - 960) / END.zoom, y: END.y + (PIN_SCREEN.y - 540) / END.zoom };

export const RoutePin: React.FC<{ n: number; active?: boolean; size?: number }> = ({ n, active, size = 64 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: active ? colors.primary : colors.white,
      color: active ? colors.white : colors.primary,
      border: `3px solid ${colors.primary}`,
      boxShadow: `0 0 0 ${size * 0.22}px ${alpha(colors.primary, 0.18)}, 0 10px 24px ${alpha(colors.dark, 0.2)}`,
      display: 'grid',
      placeItems: 'center',
      boxSizing: 'border-box',
      ...type.uiTitle,
      fontSize: size * 0.36,
    }}
  >
    {n}
  </div>
);

export const S04Planificacion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  const around = at(3.0, 1.0);
  const pins = [
    { n: 1, x: 560, y: 300 },
    { n: 2, x: 420, y: 700 },
    { n: 3, x: 1450, y: 820 },
  ];
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground arc="solution" seed="s04" />
        </DepthLayer>
        <DepthLayer depth="bg">
          <Rings x={PX} y={PY} radii={[480, 640]} color={alpha(colors.white, 0.5)} dash="2 12" rotate={frame * 0.05} opacity={around} />
          <Place x={1560} y={320} scale={1.4} opacity={0.5 * around}>
            <MapCard />
          </Place>
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={PX} y={PY} scale={PS}>
            <Phone>
              <VisitsScreen progress={at(0.1, 1.8, 'easeInOut')} highlight={1} />
            </Phone>
          </Place>
          {pins.map((p, i) => (
            <Place key={p.n} x={p.x + drift(frame, 5, 5, i)} y={p.y + drift(frame, 6, 6, i)} scale={at(3.1 + i * 0.12, 0.5, 'softOvershoot')}>
              <RoutePin n={p.n} />
            </Place>
          ))}
          <Place x={PIN_WORLD.x} y={PIN_WORLD.y} scale={at(3.5, 0.5, 'softOvershoot')}>
            <RoutePin n={4} active />
          </Place>
        </DepthLayer>
        <DepthLayer depth="fg">
          {[
            { photo: 'sedal' as const, x: 380, y: 480, focus: '72% 35%' },
            { photo: 'fotografia' as const, x: 1620, y: 600, focus: '35% 30%' },
          ].map((a, i) => (
            <Place key={a.photo} x={a.x + drift(frame, 6, 6, i)} y={a.y} scale={at(3.3 + i * 0.15, 0.6, 'softOvershoot')}>
              <FootageCard photo={a.photo} shape="circle" width={120} focus={a.focus} zoom={1.6} />
            </Place>
          ))}
          <Place x={1500} y={220} opacity={at(3.8, 0.5)}>
            <Badge label="Ruta optimizada · 4 PDV" variant="done" style={{ fontSize: 15, padding: '8px 14px', background: colors.white }} />
          </Place>
        </DepthLayer>
      </Camera>
    </AbsoluteFill>
  );
};
