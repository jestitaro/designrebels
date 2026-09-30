import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { Phone } from '../devices/Phone';
import { KineticText } from '../brand/KineticText';
import { drift, lerp, progressAt } from '../lib/easing';
import { colors, radius } from '../tokens';
import { ChatBubble, ChatScreen, FootageCard, MESSAGES } from '../ui';

/**
 * Escena 6 · Comunicación (5 s). El chat de PSMob es el protagonista. Dos avatares circulares con material real
 * en profundidades distintas (no uno a cada lado); los mensajes viajan entre ellos pasando por el teléfono.
 * Sale con shape morph: la última burbuja se infla (softOvershoot) hasta ser la card del formulario.
 */
export const S06_DURATION = 5;

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 540, zoom: 1.1 },
  { t: 2.5, x: 1000, y: 540, zoom: 1, ease: 'easeInOut' },
  { t: 5, x: 1040, y: 520, zoom: 1.05, ease: 'easeInOut' },
];

const PHONE = { x: 1160, y: 560, s: 0.8 };

export const S06Comunicacion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  // burbujas en tránsito: de la repositora (fg) al teléfono y del teléfono a supervisión (bg)
  const fly = [
    { m: MESSAGES[0], from: { x: 1500, y: 820 }, to: { x: 1150, y: 360 }, t: 0.3 },
    { m: MESSAGES[1], from: { x: 620, y: 560 }, to: { x: 1180, y: 460 }, t: 1.2 },
    { m: MESSAGES[2], from: { x: 1500, y: 820 }, to: { x: 1150, y: 560 }, t: 2.0 },
  ];
  const morph = at(4.4, 0.8, 'softOvershoot');
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground arc="solution" seed="s06" />
        </DepthLayer>
        <DepthLayer depth="bg">
          <Place x={1500} y={860 + drift(frame, 5, 6)} scale={at(0.1, 0.6, 'softOvershoot')}>
            <FootageCard photo="shampoo" shape="circle" width={220} focus="52% 30%" zoom={1.5} />
          </Place>
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={PHONE.x} y={PHONE.y} scale={PHONE.s}>
            <Phone>
              <ChatScreen progress={at(0.2, 2.6, 'easeInOut')} />
            </Phone>
          </Place>
          {fly.map((f, i) => {
            const p = at(f.t, 0.9, 'easeInOut');
            if (p <= 0 || p >= 1) return null;
            return (
              <Place key={i} x={lerp(f.from.x, f.to.x, p)} y={lerp(f.from.y, f.to.y, p)} scale={lerp(1, 0.8, p)} opacity={Math.sin(p * Math.PI) * 1.4}>
                <ChatBubble text={f.m.text} side={f.m.side} maxWidth={260} />
              </Place>
            );
          })}
          {morph > 0 && (
            <Place x={lerp(1150, 960, morph)} y={lerp(640, 560, morph)}>
              <div style={{ width: lerp(260, 420, morph), height: lerp(70, 440, morph), borderRadius: lerp(radius.lg, radius.md, morph), background: interpolate(morph, [0, 1], [0, 1]) > 0.5 ? colors.white : colors.primary, boxShadow: '0 20px 40px rgba(19, 13, 93, 0.18)' }} />
            </Place>
          )}
        </DepthLayer>
        <DepthLayer depth="fg">
          <Place x={520} y={700 + drift(frame, 6, 7, 1)} scale={at(0, 0.7, 'softOvershoot')}>
            <FootageCard photo="sedal" shape="circle" width={460} focus="68% 38%" zoom={1.35} />
          </Place>
        </DepthLayer>
      </Camera>
      <div style={{ position: 'absolute', left: 110, top: 64, width: 900 }}>
        <KineticText text="Optimiza la comunicación" color={colors.white} progressIn={at(2.4, 1.0)} progressOut={at(4.2, 0.5, 'easeIn')} style={{ textShadow: '0 8px 32px rgba(19, 13, 93, 0.25)' }} />
      </div>
    </AbsoluteFill>
  );
};
