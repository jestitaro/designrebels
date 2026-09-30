import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthLayer, Place } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { drift, lerp, progressAt } from '../lib/easing';
import { randSigned } from '../lib/random';
import { springs } from '../tokens';
import { ChartCard, FootageCard, GaugeCard, KPI, ListRow, MapCard, PDVS, Toast } from '../ui';

/**
 * Escena 2 · Complejidad (4 s). Arranca con la card del object wipe llenando el frame y se abre a una nube
 * de cards y material real con parallax fuerte. Sale con el shape morph de compresión: las filas de PDV
 * se aplanan (anticipación) y se alinean en columna; el resto colapsa hacia el stack.
 */
export const S02_DURATION = 4;

const COVER = Math.max(1920 / 358, 1080 / 250) * 1.04;
const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 540, zoom: COVER },
  { t: 0.9, x: 960, y: 540, zoom: 1, ease: 'settle' },
  { t: 2.5, x: 1080, y: 520, zoom: 1.35, ease: 'easeInOut' },
  { t: 3.5, x: 960, y: 540, zoom: 1, ease: 'easeInOut' },
];

/** Stack comprimido: mismo lugar donde lo toma la escena 3. */
export const stackPos = (i: number) => ({ x: 700, y: 300 + i * 100 });
const STACK_SCALE = 0.9;

type Item = { id: string; depth: 'bg' | 'mg' | 'fg'; x: number; y: number; scale?: number; el: React.ReactNode };

const CLOUD: Item[] = [
  { id: 'f-sedal', depth: 'bg', x: 300, y: 250, el: <FootageCard photo="sedal" width={300} focus="70% 40%" /> },
  { id: 'f-shampoo', depth: 'bg', x: 1650, y: 820, el: <FootageCard photo="shampoo" width={280} focus="55% 40%" /> },
  { id: 'f-va', depth: 'bg', x: 1560, y: 230, el: <FootageCard photo="verticalA" width={150} /> },
  { id: 'map', depth: 'bg', x: 420, y: 860, scale: 0.8, el: <MapCard /> },
  { id: 'f-foto', depth: 'mg', x: 1340, y: 300, el: <FootageCard photo="fotografia" width={340} focus="35% 45%" /> },
  { id: 'kpi', depth: 'mg', x: 380, y: 560, el: <KPI label="PDV del día" value={38} icon="store" /> },
  { id: 'gauge', depth: 'mg', x: 1500, y: 640, el: <GaugeCard label="Precios" value={61} target={85} width={130} /> },
  { id: 'toast', depth: 'mg', x: 1100, y: 900, el: <Toast variant="warning" title="Formulario incompleto" message="Mayorista Del Oeste" /> },
  { id: 'f-plan', depth: 'fg', x: 1700, y: 420, el: <FootageCard photo="planograma" width={380} focus="40% 50%" /> },
  { id: 'f-vb', depth: 'fg', x: 180, y: 380, el: <FootageCard photo="verticalB" width={170} /> },
];

/** Posiciones de la nube para las 5 filas de PDV (antes de comprimirse). */
const ROW_CLOUD = [
  { x: 820, y: 240, depth: 'mg' as const },
  { x: 1180, y: 520, depth: 'mg' as const },
  { x: 660, y: 760, depth: 'mg' as const },
  { x: 1000, y: 380, depth: 'mg' as const },
  { x: 900, y: 660, depth: 'mg' as const },
];

export const S02Complejidad: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = progressAt(frame, 0.3, 0.8, 'settle', fps);
  const compressAt = (i: number) => spring({ frame: frame - Math.round((2.8 + i * 0.06) * fps), fps, config: springs.firm });
  const layer = (depth: Item['depth']) =>
    CLOUD.filter((it) => it.depth === depth).map((it, i) => {
      const c = compressAt(i + 5);
      const st = stackPos(2);
      const x = lerp(it.x + drift(frame, 6, 5 + i, i), st.x, c);
      const y = lerp(it.y + drift(frame, 8, 6 + i, i * 2), st.y, c);
      return (
        <Place key={it.id} x={x} y={y} scale={(it.scale ?? 1) * (1 - c) * (0.9 + 0.1 * open)} rotate={randSigned(`s02-${it.id}`, 6) * (1 - c)} opacity={open * (1 - c)}>
          {it.el}
        </Place>
      );
    });
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground arc="problem" seed="s02" driftAmount={60} />
        </DepthLayer>
        <DepthLayer depth="bg">{layer('bg')}</DepthLayer>
        <DepthLayer depth="mg">
          {/* la card del wipe: empieza llenando el frame y se va a la nube */}
          <Place x={960} y={540} scale={interpolate(open, [0, 1], [1, 0.85])} opacity={1 - progressAt(frame, 2.6, 0.5, 'easeInOut', fps)}>
            <ChartCard variant="bars" width={358} elevation="float" style={{ height: 250 }} />
          </Place>
          {layer('mg')}
          {PDVS.map((pdv, i) => {
            const c = compressAt(i);
            // anticipación: se aplana un 3 % antes de moverse
            const squash = interpolate(c, [0, 0.12, 0.3], [1, 0.97, 1], { extrapolateRight: 'clamp' });
            const a = ROW_CLOUD[i];
            const b = stackPos(i);
            return (
              <Place key={pdv.id} x={lerp(a.x + drift(frame, 6, 5, i), b.x, c)} y={lerp(a.y + drift(frame, 7, 6, i), b.y, c)} rotate={randSigned(`s02-row-${i}`, 7) * (1 - c)} scale={lerp(0.8, STACK_SCALE, c)} opacity={open}>
                <div style={{ transform: `scaleY(${squash})` }}>
                  <ListRow index={i + 1} title={pdv.name} address={pdv.address} time={pdv.time} status={pdv.status} style={{ width: 358 }} />
                </div>
              </Place>
            );
          })}
        </DepthLayer>
        <DepthLayer depth="fg">{layer('fg')}</DepthLayer>
      </Camera>
    </AbsoluteFill>
  );
};
