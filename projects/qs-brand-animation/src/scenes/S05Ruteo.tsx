import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place } from '../camera';
import { Phone } from '../devices/Phone';
import { drift, lerp, progressAt } from '../lib/easing';
import { colors, radius } from '../tokens';
import { ListRow, PDVS, PricesScreen, StyledMap } from '../ui';
import { PIN_SCREEN, RoutePin } from './S04Planificacion';

/**
 * Escena 5 · Ruteo (5 s). Arranca con el pin 4 en el mismo lugar (match cut). La cámara lo sigue,
 * el fondo es el mapa y la ruta se dibuja. Sale con shape morph: la punta de la ruta se engrosa
 * y se redondea hasta ser la burbuja de chat (rápido, easeIn → settle).
 */
export const S05_DURATION = 5;

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 540, zoom: 1 },
  { t: 1.2, x: 1180, y: 480, zoom: 1.25, ease: 'easeInOut' },
  { t: 3.6, x: 960, y: 540, zoom: 1, ease: 'easeInOut' },
  { t: 5, x: 900, y: 560, zoom: 0.95, ease: 'easeInOut' },
];

/** El mapa ocupa el mundo: viewBox 400×260 escalado a 1920×1248. */
const MAP_W = 1920;
const MAP_H = 1248;
const mapPt = (x: number, y: number) => ({ x: (x / 400) * MAP_W, y: (y / 260) * MAP_H - (MAP_H - 1080) / 2 });
const DEST = mapPt(352, 124);

export const S05Ruteo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  const mapIn = at(0.2, 0.8, 'easeInOut');
  const route = at(0.9, 2.9, 'easeInOut');
  // el pin del match cut viaja hasta la parada destino del mapa
  const pinT = at(0.3, 2.6, 'easeInOut');
  const morph = at(4.4, 0.6, 'easeIn');
  return (
    <AbsoluteFill style={{ background: colors.light }}>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <div style={{ position: 'absolute', left: 0, top: -(MAP_H - 1080) / 2, width: MAP_W, height: MAP_H, opacity: mapIn }}>
            <StyledMap routeProgress={route} width={MAP_W} height={MAP_H} />
          </div>
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={lerp(PIN_SCREEN.x, DEST.x, pinT)} y={lerp(PIN_SCREEN.y, DEST.y, pinT)} opacity={1 - mapIn * 0.9}>
            <RoutePin n={4} active />
          </Place>
          <Place x={DEST.x} y={DEST.y - 150} opacity={at(3.6, 0.5)}>
            <ListRow index={4} title={PDVS[3].name} address={PDVS[3].address} time={PDVS[3].time} status="scheduled" highlighted style={{ width: 358 }} />
          </Place>
          {/* shape morph: la punta de la ruta se infla en burbuja */}
          {morph > 0 && (
            <Place x={DEST.x} y={DEST.y} scale={interpolate(morph, [0, 1], [0.1, 1])}>
              <div style={{ width: 300, height: 84, borderRadius: radius.lg, borderBottomLeftRadius: interpolate(morph, [0, 1], [42, 6]), background: colors.primary, opacity: Math.min(1, morph * 2) }} />
            </Place>
          )}
        </DepthLayer>
        <DepthLayer depth="fg">
          <Place x={lerp(-400, 330, at(2.0, 1.2))} y={600 + drift(frame, 6, 6)} rotate={lerp(-14, -6, at(2.0, 1.2))} scale={0.7}>
            <Phone>
              <PricesScreen progress={1} />
            </Phone>
          </Place>
        </DepthLayer>
      </Camera>
    </AbsoluteFill>
  );
};
