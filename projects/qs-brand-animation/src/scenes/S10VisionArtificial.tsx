import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthBlur, DepthLayer, Place } from '../camera';
import { Phone } from '../devices/Phone';
import { drift, progressAt, stagger } from '../lib/easing';
import { alpha, colors, radius, shadows, type, ui } from '../tokens';
import { CameraScreen, GaugeCard, Icon, ProductThumb, Shelf, recognizedProducts } from '../ui';

/**
 * Escena 10 · Visión artificial (7 s). El celular ocupa la pantalla sobre la góndola.
 * Detección progresiva: scanning → primera detección → cascada → precios → planograma. Nada aparece de golpe.
 */
export const S10_DURATION = 7;

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 540, zoom: 1 },
  { t: 3.5, x: 1000, y: 540, zoom: 1.12, ease: 'easeInOut' },
  { t: 7, x: 1000, y: 540, zoom: 1.12 },
];

const PHONE_X = 900;
const PHONE_Y = 760;
/** escala del device para que el caption (12 px) llegue a 22 px con el push-in */
const PHONE_S = 1.65;

const AISLE = [
  { id: 'detergente-liquido-celeste' as const, facings: 3 },
  { id: 'bidon-lavandina-amarillo' as const, facings: 3 },
  { id: 'lavavajillas-amarillo' as const, facings: 3 },
  { id: 'shampoo-azul' as const, facings: 3 },
  { id: 'dispensador-jabon-rosa' as const, facings: 3 },
];

export const S10VisionArtificial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (s: number, d: number, e: Parameters<typeof progressAt>[3] = 'settle') => progressAt(frame, s, d, e, fps);
  const stages = {
    scan: at(0.4, 1.0, 'easeInOut'),
    first: at(1.6, 0.5),
    cascade: at(2.2, 1.2),
    prices: at(4.2, 0.6),
    validate: at(5.2, 1.2, 'easeInOut'),
  };
  const list = recognizedProducts();
  const listP = at(4.6, 1.0);
  return (
    <AbsoluteFill style={{ background: colors.dark }}>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          {/* la góndola real detrás del celular: única capa con blur */}
          <DepthBlur amount={7}>
            <Shelf items={AISLE} pxPerCm={13} gap={16} style={{ position: 'absolute', left: -260, top: 40 }} />
            <Shelf items={AISLE} pxPerCm={13} gap={16} style={{ position: 'absolute', left: -560, top: 470 }} />
          </DepthBlur>
          <AbsoluteFill style={{ background: `linear-gradient(90deg, ${alpha(colors.dark, 0.55)}, ${alpha(colors.dark, 0.25)} 45%, ${alpha(colors.dark, 0.6)})` }} />
        </DepthLayer>
        <DepthLayer depth="mg">
          <Place x={PHONE_X} y={PHONE_Y} scale={PHONE_S}>
            <Phone statusBar="light">
              <CameraScreen stages={stages} />
            </Phone>
          </Place>
        </DepthLayer>
        <DepthLayer depth="fg">
          <Place x={1560} y={430 + drift(frame, 6, 6)} opacity={listP}>
            <div style={{ width: 400, background: colors.white, borderRadius: radius.lg, boxShadow: shadows.float, padding: 18, transform: `translateY(${(1 - listP) * 24}px)` }}>
              <div style={{ ...type.uiTitle, color: ui.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="sparkle" size={18} color={ui.action} strokeWidth={2} /> Productos reconocidos
              </div>
              {list.map((p, i) => {
                const rp = stagger(listP, i, list.length, 0.5);
                const ok = stages.validate * 5 > i + 0.5;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${ui.border}` : undefined, marginTop: i ? 0 : 10, opacity: rp }}>
                    <ProductThumb id={p.id} size={44} framed />
                    <span style={{ ...type.uiBody, fontSize: 16, color: ui.text, flex: 1 }}>{p.label}</span>
                    <span style={{ width: 24, height: 24, borderRadius: 12, display: 'grid', placeItems: 'center', background: ok ? ui.check : ui.border }}>
                      <Icon name="check" size={14} color={colors.white} strokeWidth={3} />
                    </span>
                  </div>
                );
              })}
            </div>
          </Place>
          <Place x={300} y={620 + drift(frame, 7, 6, 1)}>
            <GaugeCard label="Planograma" value={92} target={90} width={170} progress={at(5.4, 1.0)} />
          </Place>
        </DepthLayer>
      </Camera>
    </AbsoluteFill>
  );
};
