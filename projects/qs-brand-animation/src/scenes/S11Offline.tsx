import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { Phone } from '../devices/Phone';
import { KineticText } from '../brand/KineticText';
import { drift, progressAt } from '../lib/easing';
import { colors } from '../tokens';
import { OfflineScreen, SyncIndicator, SyncState } from '../ui';

/**
 * Escena 11 · Offline (5 s). "Modo sin conexión": la UI sigue funcionando, guarda localmente
 * y sincroniza al volver la señal. Sale con push-out hacia el plano abierto de la escena 12.
 */
export const S11_DURATION = 5;

const PX = 1240;
const PY = 560;

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 1120, y: 540, zoom: 1.25 },
  { t: 3.4 },
  { t: 5, x: 960, y: 540, zoom: 0.9, ease: 'easeInOut' },
];

const stateAt = (t: number): SyncState => (t < 1.4 ? 'offline' : t < 2.2 ? 'saved' : t < 3.6 ? 'pending' : t < 4.4 ? 'syncing' : 'synced');

export const S11Offline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  const state = stateAt(t);
  const screenState: SyncState = state === 'saved' ? 'offline' : state;
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground mix={0.85} seed="s11" />
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={PX} y={PY} scale={0.95}>
            <Phone>
              <OfflineScreen progress={at(0, 1.4, 'easeInOut')} state={screenState} count={3} syncProgress={at(3.6, 0.8, 'easeInOut')} />
            </Phone>
          </Place>
        </DepthLayer>
        <DepthLayer depth="fg">
          <Place x={760} y={840 + drift(frame, 6, 6)} scale={1.7}>
            <SyncIndicator state={state} count={state === 'offline' || state === 'pending' ? 3 : undefined} syncProgress={at(3.6, 0.8)} progress={at(0.4, 0.5, 'softOvershoot')} style={{ boxShadow: '0 12px 28px rgba(19, 13, 93, 0.2)', background: state === 'offline' ? undefined : colors.white }} />
          </Place>
        </DepthLayer>
      </Camera>
      <div style={{ position: 'absolute', left: 110, top: 150, width: 820 }}>
        <KineticText text="Incluso sin conexión" color={colors.white} progressIn={at(1.2, 1.0)} progressOut={at(3.4, 0.5, 'easeIn')} style={{ textShadow: '0 8px 32px rgba(19, 13, 93, 0.3)' }} />
      </div>
    </AbsoluteFill>
  );
};
