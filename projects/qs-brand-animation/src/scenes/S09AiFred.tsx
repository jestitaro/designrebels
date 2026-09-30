import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place, zoomToRect } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { drift, progressAt } from '../lib/easing';
import { colors, radius, type, ui } from '../tokens';
import { CLIPS, PHOTOS } from '../footage';
import { Badge, FootageCard, Icon, Shelf } from '../ui';

/**
 * Escena 9 · AiFred (5 s). Góndola real: la repositora levanta el celular y saca la foto (video B).
 * En t3.2 match cut a la foto del reconocimiento de PSMob en uso y zoom through a esa pantalla.
 */
export const S09_DURATION = 5;

const CARD = { x: 820, y: 540, w: 1040, h: 780 };
/** Pantalla del celular en la foto 6 (px de la foto 2000×1125), medida a ojo sobre el original. */
const PHOTO_SCREEN = { x0: 887, y0: 245, x1: 1108, y1: 812 };
const screenWorld = () => {
  const p = PHOTOS.reconocimiento;
  const s = CARD.h / p.h; // cover: manda el alto
  const off = (CARD.w - p.w * s) / 2;
  return {
    x: CARD.x - CARD.w / 2 + off + PHOTO_SCREEN.x0 * s,
    y: CARD.y - CARD.h / 2 + PHOTO_SCREEN.y0 * s,
    width: (PHOTO_SCREEN.x1 - PHOTO_SCREEN.x0) * s,
    height: (PHOTO_SCREEN.y1 - PHOTO_SCREEN.y0) * s,
  };
};

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 560, zoom: 0.95 },
  { t: 3.2, x: 900, y: 540, zoom: 1.05, ease: 'easeInOut' },
  { t: 3.5 },
  { t: 5, ...zoomToRect(screenWorld(), 'contain', 0.98), ease: 'easeIn' },
];

const AISLE = [
  { id: 'detergente-liquido-celeste' as const, facings: 4 },
  { id: 'bidon-lavandina-amarillo' as const, facings: 4 },
  { id: 'shampoo-azul' as const, facings: 4 },
  { id: 'dispensador-jabon-rosa' as const, facings: 4 },
];

export const S09AiFred: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  const cut = frame / fps >= 3.2;
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground arc="solution" seed="s09" />
        </DepthLayer>
        <DepthLayer depth="bg">
          <Shelf items={AISLE} pxPerCm={6} gap={10} style={{ position: 'absolute', left: -300, top: 860, opacity: 0.55 }} />
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={CARD.x} y={CARD.y} scale={0.94 + 0.06 * at(0, 0.6)}>
            {cut ? (
              <FootageCard photo="reconocimiento" width={CARD.w} height={CARD.h} />
            ) : (
              <FootageCard clip="pasilloFoto" from={CLIPS.pasilloFoto.moments.foto - 1} rate={0.7} width={CARD.w} height={CARD.h} focus="30% 40%" />
            )}
          </Place>
        </DepthLayer>
        <DepthLayer depth="fg">
          <Place x={1560} y={300 + drift(frame, 6, 5)} opacity={at(0.8, 0.5) * (1 - at(3.4, 0.4))}>
            <Badge label="Cuidado personal" variant="category" dot={false} style={{ fontSize: 18, padding: '10px 18px', background: colors.white }} />
          </Place>
          <Place x={1620} y={420 + drift(frame, 7, 6, 1)} opacity={at(1.2, 0.5) * (1 - at(3.4, 0.4))}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: radius.pill, background: colors.white, boxShadow: '0 12px 28px rgba(19, 13, 93, 0.18)', ...type.uiTitle, color: ui.text }}>
              <Icon name="camera" size={22} color={ui.action} strokeWidth={2} /> Fotos {Math.min(3, 1 + Math.floor(at(1.4, 1.6) * 3))}/5
            </div>
          </Place>
        </DepthLayer>
      </Camera>
    </AbsoluteFill>
  );
};
