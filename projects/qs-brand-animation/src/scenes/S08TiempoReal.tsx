import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { Laptop } from '../devices/Laptop';
import { KineticText } from '../brand/KineticText';
import { drift, progressAt } from '../lib/easing';
import { colors } from '../tokens';
import { DashboardScreen, IndicatorCard, KPI, Toast } from '../ui';

/**
 * Escena 8 · Información en tiempo real (6 s). Las cards de la escena 7 llegan a un dashboard.
 * Los KPIs se animan por etapas, nunca todos juntos: count up → barras → gauges → alertas.
 */
export const S08_DURATION = 6;

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 900, y: 540, zoom: 0.9 },
  { t: 1.2, x: 960, y: 520, zoom: 1 },
  { t: 3.6, x: 1080, y: 520, zoom: 1.28, ease: 'easeInOut' },
  { t: 6, x: 960, y: 540, zoom: 1.05, ease: 'easeInOut' },
];

const LX = 1180;
const LY = 610;
const LS = 0.85;

export const S08TiempoReal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  const stages = { counts: at(1.2, 0.9), bars: at(2.2, 0.9), gauges: at(3.0, 0.9), alerts: at(4.0, 0.7) };
  // cards que llegan desde la escena 7 y se funden en el dashboard
  const arrive = at(0, 1.1, 'easeInOut');
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground arc="solution" seed="s08" />
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={LX} y={LY} scale={LS}>
            <Laptop>
              <DashboardScreen stages={stages} />
            </Laptop>
          </Place>
          {arrive < 1 && (
            <>
              <Place x={200 + arrive * 760} y={420 - arrive * 40} scale={1 - arrive * 0.4} opacity={1 - arrive}>
                <KPI label="Formularios" value={124} icon="clipboard" elevation="float" />
              </Place>
              <Place x={120 + arrive * 820} y={700 - arrive * 120} scale={1 - arrive * 0.45} opacity={1 - arrive}>
                <Toast title="Formulario enviado" message="Supermercado San Martín" />
              </Place>
            </>
          )}
        </DepthLayer>
        <DepthLayer depth="fg">
          <Place x={600} y={800 + drift(frame, 6, 6)}>
            <IndicatorCard progress={at(2.6, 1.2)} />
          </Place>
          <Place x={1590} y={235 + drift(frame, 5, 5, 1)}>
            <Toast variant="warning" title="12 alertas" message="3 críticas · Zona Oeste" progress={at(4.3, 0.6, 'softOvershoot')} />
          </Place>
        </DepthLayer>
      </Camera>
      <div style={{ position: 'absolute', left: 110, top: 64 }}>
        <KineticText text="Información en tiempo real" color={colors.white} progressIn={at(1.6, 1.2)} progressOut={at(4.9, 0.6, 'easeIn')} style={{ textShadow: `0 8px 32px rgba(19, 13, 93, 0.25)` }} />
      </div>
    </AbsoluteFill>
  );
};
