import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { Phone } from '../devices/Phone';
import { KineticText } from '../brand/KineticText';
import { zoomThroughPhoneArea } from '../transitions/zoomThrough';
import { drift, lerp, progressAt } from '../lib/easing';
import { colors } from '../tokens';
import { FormScreen, KPI, Toast } from '../ui';

/**
 * Escena 7 · Captura de datos (5 s). La card del morph es el formulario; zoom in hasta que se lee,
 * tap, check y progress. Los datos salen del teléfono al espacio y la escena sale con push-out.
 */
export const S07_DURATION = 5;

const PX = 960;
const PY = 560;
const PS = 1;

const FORM = zoomThroughPhoneArea(PX, PY, PS, { x: 0, y: 100, width: 390, height: 560 }, 'contain');
/** el formulario queda en el tercio izquierdo para dejar lugar al kinetic type */
const FORM_LEFT = { ...FORM, x: FORM.x + 360 / FORM.zoom };

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 540, zoom: 1 },
  { t: 1, ...FORM_LEFT, ease: 'easeInOut' },
  { t: 3 },
  { t: 5, x: 1060, y: 540, zoom: 0.85, ease: 'easeInOut' },
];

export const S07Captura: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  const press = Math.sin(at(0.8, 0.35, 'easeInOut') * Math.PI);
  const out = at(3.4, 1.4, 'easeInOut');
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground arc="solution" seed="s07" />
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={PX} y={PY} scale={PS}>
            <Phone>
              <FormScreen progress={at(0, 1.2, 'easeInOut')} press={press} done={frame / fps > 1.6} />
            </Phone>
          </Place>
        </DepthLayer>
        <DepthLayer depth="fg">
          <Place x={lerp(1060, 1560, out)} y={lerp(420, 300, out) + drift(frame, 5, 5)} scale={at(2.4, 0.6, 'softOvershoot')}>
            <KPI label="Formularios" value={124} icon="clipboard" elevation="float" progress={at(2.4, 1)} />
          </Place>
          <Place x={lerp(1000, 1640, out)} y={lerp(760, 820, out) + drift(frame, 6, 6, 1)} scale={at(2.7, 0.6, 'softOvershoot')}>
            <Toast title="Formulario enviado" message="Supermercado San Martín · 6 SKU" progress={at(2.7, 0.8)} />
          </Place>
        </DepthLayer>
      </Camera>
      <div style={{ position: 'absolute', left: 1020, top: 330, width: 820 }}>
        <KineticText text="Agiliza la captura de datos" color={colors.white} progressIn={at(1.4, 0.9)} progressOut={at(2.8, 0.4, "easeIn")} style={{ textShadow: '0 8px 32px rgba(19, 13, 93, 0.25)' }} />
      </div>
    </AbsoluteFill>
  );
};
