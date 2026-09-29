import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { alpha, colors, radius, type, ui } from '../tokens';
import { drift, progressAt, progressFrames } from '../lib/easing';
import { sec } from '../lib/time';
import { Camera, CameraKeyframe, DepthLayer, Place, useCamera, zoomToRect } from '../camera';
import { Phone } from '../devices/Phone';
import { GradientBackground } from '../shapes/GradientBackground';
import { Rings } from '../shapes/Rings';
import { Blob } from '../shapes/Blob';
import { KPI, KPIS, Toast, VisitsScreen, MapCard, ChartCard, ListRow, PDVS, IndicatorCard } from '../ui';
import { phoneScreenRect } from '../transitions/zoomThrough';
import { ObjectWipe } from '../transitions/ObjectWipe';
import { MaskReveal } from '../transitions/MaskReveal';
import { ShapeMorph, roundedRectPath } from '../transitions/ShapeMorph';
import { TRANSITION_LABELS, TRANSITION_TYPES, TransitionType } from '../transitions/types';
import { effectivePx } from '../lib/legibility';

/* ───────────── CameraLab: parallax fg/mg/bg + zoom through ───────────── */

const PHONE_X = 1180;
const PHONE_Y = 560;
const PHONE_S = 0.82;

export const CAMERA_LAB_KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 540, zoom: 0.92 },
  { t: 1.8, x: 1060, y: 560, zoom: 1.05, ease: 'easeInOut' },
  { t: 3.2, x: 1140, y: 540, zoom: 1.4, rotate: 0, ease: 'easeInOut' },
  { t: 5.2, ...zoomToRect(phoneScreenRect(PHONE_X, PHONE_Y, PHONE_S)), ease: 'easeInOut' },
  { t: 6 },
];

export const CameraLab: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Camera keyframes={CAMERA_LAB_KEYS}>
      <DepthLayer depth="sky">
        <GradientBackground arc="solution" seed="cam" />
      </DepthLayer>
      <DepthLayer depth="bg">
        <Rings x={PHONE_X} y={PHONE_Y} radii={[420, 560, 720]} color={alpha(colors.white, 0.6)} strokeWidth={1.5} dash="2 10" rotate={frame * 0.05} />
        <Blob seed="cam-bg" size={520} x={420} y={300} from={alpha(colors.white, 0.7)} to={colors.white} fill="radial" />
      </DepthLayer>
      <DepthLayer depth="mg">
        <Place x={PHONE_X} y={PHONE_Y} scale={PHONE_S}>
          <Phone>
            <VisitsScreen progress={progressAt(frame, 0.2, 1.6, 'easeInOut')} highlight={1} />
          </Phone>
        </Place>
        <Place x={760} y={420 + drift(frame, 6, 5)}>
          <MapCard progress={progressAt(frame, 0.5, 1.4)} elevation="float" />
        </Place>
      </DepthLayer>
      <DepthLayer depth="fg">
        <Place x={1560} y={300 + drift(frame, 8, 6, 1)}>
          <KPI {...KPIS.osa} icon="chart" elevation="float" progress={progressAt(frame, 0.8, 1.4)} />
        </Place>
        <Place x={640} y={820 + drift(frame, 7, 5.5, 2)}>
          <Toast title="Visita finalizada" message="Autoservicio Los Álamos · 38 min" progress={progressAt(frame, 1.1, 1)} />
        </Place>
      </DepthLayer>
      <LegibilityHud deviceScale={PHONE_S} />
      <LabLabel text="CameraLab · parallax fg 1.4 / mg 1 / bg 0.5 · zoom through" />
    </Camera>
  );
};

/** HUD de debug: zoom de cámara y tamaño efectivo del caption de UI en el teléfono. */
const LegibilityHud: React.FC<{ deviceScale: number }> = ({ deviceScale }) => {
  const cam = useCamera();
  const px = effectivePx(12, cam.zoom, deviceScale);
  const ok = px >= 22;
  return (
    <div style={{ position: 'absolute', right: 32, bottom: 32, ...type.uiCaption, fontSize: 16, padding: '8px 14px', borderRadius: radius.sm, background: alpha(colors.dark, 0.75), color: colors.white, fontVariantNumeric: 'tabular-nums' }}>
      zoom {cam.zoom.toFixed(2)} · caption efectivo {px.toFixed(1)} px <span style={{ color: ok ? colors.success : colors.warning }}>{ok ? '✓ legible' : '✗ < 22 px'}</span>
    </div>
  );
};

const LabLabel: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => (
  <div style={{ position: 'absolute', left: 32, top: 28, ...type.uiCaption, fontSize: 16, padding: '6px 12px', borderRadius: radius.sm, background: alpha(dark ? colors.white : colors.dark, 0.72), color: dark ? ui.text : colors.white }}>{text}</div>
);

/* ───────────── TransitionsLab: las 6 transiciones ───────────── */

export const TRANSITION_DEMO_SEC = 3;

const DemoZoomThrough: React.FC = () => {
  const frame = useCurrentFrame();
  const keys: CameraKeyframe[] = [
    { t: 0, x: 960, y: 540, zoom: 1 },
    { t: 0.4 },
    { t: 2.4, ...zoomToRect(phoneScreenRect(960, 540, 0.8)), ease: 'easeInOut' },
  ];
  return (
    <Camera keyframes={keys}>
      <DepthLayer depth="sky">
        <GradientBackground arc="solution" seed="zt" />
      </DepthLayer>
      <DepthLayer depth="mg">
        <Place x={960} y={540} scale={0.8}>
          <Phone>
            <VisitsScreen progress={1} highlight={1} />
          </Phone>
        </Place>
      </DepthLayer>
      <DepthLayer depth="fg">
        <Place x={560} y={360 + drift(frame, 6)}>
          <KPI {...KPIS.visits} icon="calendar" elevation="float" />
        </Place>
      </DepthLayer>
    </Camera>
  );
};

const DemoObjectWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const p = progressFrames(frame, sec(0.5), sec(2), 'easeInOut');
  return (
    <AbsoluteFill>
      <GradientBackground arc="problem" seed="ow" />
      <Place x={520} y={380} rotate={-4}>
        <ListRow title={PDVS[2].name} address={PDVS[2].address} status="scheduled" style={{ width: 358 }} />
      </Place>
      <Place x={1400} y={760} rotate={3}>
        <Toast variant="warning" title="12 alertas" message="3 PDV sin relevar" />
      </Place>
      <ObjectWipe progress={p} width={358} height={220} fromX={1320} fromY={330} fromRotate={-7}>
        <div style={{ width: 358, height: 220, borderRadius: radius.md, overflow: 'hidden', background: ui.background }}>
          <ChartCard variant="bars" width={358} style={{ border: 'none' }} />
        </div>
      </ObjectWipe>
    </AbsoluteFill>
  );
};

const DemoMatchCut: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cut = frame >= sec(1.5, fps);
  // el pin mantiene posición y escala exactas a ambos lados del corte
  const pin = (
    <div style={{ width: 64, height: 64, borderRadius: 32, background: colors.primary, boxShadow: `0 0 0 14px ${alpha(colors.primary, 0.18)}`, display: 'grid', placeItems: 'center', ...type.uiTitle, color: colors.white }}>4</div>
  );
  return (
    <AbsoluteFill>
      {cut ? (
        <AbsoluteFill style={{ background: colors.light }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.9 }}>
            <MapCard width={1920} mapHeight={1080} style={{ borderRadius: 0, border: 'none' }} />
          </div>
        </AbsoluteFill>
      ) : (
        <GradientBackground arc="solution" seed="mc" />
      )}
      {!cut && (
        <Place x={700} y={540} scale={0.8}>
          <Phone>
            <VisitsScreen highlight={3} />
          </Phone>
        </Place>
      )}
      <Place x={1260} y={520}>
        {pin}
      </Place>
    </AbsoluteFill>
  );
};

const DemoMaskReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const p = progressFrames(frame, sec(0.4), sec(2.2), 'easeInOut');
  return (
    <AbsoluteFill>
      <GradientBackground arc="problem" seed="mr" />
      <MaskReveal progress={p} x={1180} y={560} shape="blob" seed="mr-mask">
        <GradientBackground arc="closing" seed="mr2" />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 480, textAlign: 'center', ...type.tagline, color: colors.primary }}>Llevá tu negocio al futuro.</div>
      </MaskReveal>
    </AbsoluteFill>
  );
};

const DemoShapeMorph: React.FC = () => {
  const frame = useCurrentFrame();
  const p = progressFrames(frame, sec(0.5), sec(1.8), 'easeInOut');
  const from = roundedRectPath(760, 460, 400, 90, 24);
  const to = roundedRectPath(660, 240, 600, 600, 12);
  return (
    <AbsoluteFill>
      <GradientBackground arc="solution" seed="sm" />
      <ShapeMorph progress={p} from={from} to={to} fromColor={colors.primary} toColor={colors.white} width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, filter: `drop-shadow(0 20px 40px ${alpha(colors.dark, 0.15)})` }} />
      <div style={{ position: 'absolute', left: 800, top: 490, ...type.uiBody, fontSize: 24, color: colors.white, opacity: 1 - Math.min(1, p * 3) }}>Subí los precios del frente…</div>
    </AbsoluteFill>
  );
};

const DemoPushInOut: React.FC = () => {
  const keys: CameraKeyframe[] = [
    { t: 0, x: 960, y: 540, zoom: 1 },
    { t: 1.4, x: 1240, y: 420, zoom: 1.6, ease: 'easeInOut' },
    { t: 2.8, x: 960, y: 540, zoom: 0.85, ease: 'easeInOut' },
  ];
  return (
    <Camera keyframes={keys}>
      <DepthLayer depth="sky">
        <GradientBackground arc="solution" seed="pio" />
      </DepthLayer>
      <DepthLayer depth="mg">
        <Place x={1240} y={420}>
          <KPI {...KPIS.osa} icon="chart" elevation="float" width={220} />
        </Place>
        <Place x={700} y={620}>
          <IndicatorCard />
        </Place>
      </DepthLayer>
    </Camera>
  );
};

const DEMOS: Record<TransitionType, React.FC> = {
  zoomThrough: DemoZoomThrough,
  objectWipe: DemoObjectWipe,
  matchCut: DemoMatchCut,
  maskReveal: DemoMaskReveal,
  shapeMorph: DemoShapeMorph,
  pushInOut: DemoPushInOut,
};

export const TransitionsLab: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: colors.dark }}>
      {TRANSITION_TYPES.map((t, i) => {
        const D = DEMOS[t];
        return (
          <Sequence key={t} from={i * sec(TRANSITION_DEMO_SEC, fps)} durationInFrames={sec(TRANSITION_DEMO_SEC, fps)} name={TRANSITION_LABELS[t]}>
            <D />
            <LabLabel text={`${i + 1}/6 · ${TRANSITION_LABELS[t]}`} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
