import React from 'react';
import { alpha, app, colors, gaugeColors, GaugeStatus, gaugeStatus, radius, shadows, type } from '../tokens';
import { enterStyle, stagger, sub } from '../lib/easing';
import { Icon } from './Icon';

type Tone = 'light' | 'dark';

type GaugeProps = {
  /** 0–100 */
  value: number;
  /** objetivo 0–100: punto sobre el arco */
  target?: number;
  /** si no se pasa, sale de gaugeStatus(value, target) */
  status?: GaugeStatus;
  /** ancho del arco en px */
  size?: number;
  tone?: Tone;
  /** 0→1: el arco crece y el número cuenta */
  progress?: number;
};

/**
 * Indicador de PSMob: medio círculo (izquierda → derecha por arriba), track completo,
 * arco de valor con el color de estado y punto de objetivo. El número va dentro del arco.
 */
export const Gauge: React.FC<GaugeProps> = ({ value, target, status, size = 120, tone = 'light', progress = 1 }) => {
  const c = gaugeColors[tone];
  const st = status ?? gaugeStatus(value, target);
  const arcColor = c[st];
  const p = sub(progress, 0.1, 1, 'settle');
  const v = value * p;
  const sw = Math.max(3, size * 0.045);
  const r = (size - sw) / 2;
  const cx = size / 2;
  const cy = r + sw / 2;
  const h = cy + sw / 2;
  const pt = (t: number) => {
    const a = Math.PI * (1 - t);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  };
  const arc = (t0: number, t1: number) => {
    const [x0, y0] = pt(t0);
    const [x1, y1] = pt(t1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const t = Math.max(0.001, Math.min(1, v / 100));
  const reached = target !== undefined && v >= target;
  const targetFill = tone === 'dark' ? gaugeColors.dark.target : reached ? arcColor : gaugeColors.light.track;
  return (
    <div style={{ position: 'relative', width: size, height: h }}>
      <svg width={size} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d={arc(0, 1)} fill="none" stroke={c.track} strokeWidth={sw} strokeLinecap="round" />
        {p > 0 && <path d={arc(0, t)} fill="none" stroke={arcColor} strokeWidth={sw} strokeLinecap="round" />}
        {target !== undefined && (() => {
          const [tx, ty] = pt(target / 100);
          return <circle cx={tx} cy={ty} r={sw * 1.05} fill={targetFill} opacity={sub(progress, 0.5, 0.9)} />;
        })()}
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: -size * 0.02, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: size * 0.02 }}>
        <span style={{ ...type.kpi, fontSize: size * 0.36, letterSpacing: -1, color: c.value, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{Math.round(v)}</span>
        <span style={{ ...type.uiTitle, fontSize: size * 0.13, fontWeight: 600, color: c.unit }}>%</span>
      </div>
    </div>
  );
};

type CardProps = {
  label: string;
  value: number;
  target?: number;
  status?: GaugeStatus;
  progress?: number;
  width?: number;
  style?: React.CSSProperties;
};

/** Card blanca de indicador (fondo claro): gauge, nombre, flecha ↗ y pill de objetivo. */
export const GaugeCard: React.FC<CardProps> = ({ label, value, target = 85, status, progress = 1, width = 110, style }) => (
  <div
    style={{
      width,
      boxSizing: 'border-box',
      padding: `${width * 0.13}px ${width * 0.09}px ${width * 0.1}px`,
      borderRadius: radius.lg,
      background: colors.white,
      border: `1px solid ${gaugeColors.light.track}`,
      boxShadow: shadows.card,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      ...enterStyle(sub(progress, 0, 0.35), 14),
      ...style,
    }}
  >
    <Icon name="arrowUpRight" size={width * 0.1} color={gaugeColors.light.label} strokeWidth={2} style={{ position: 'absolute', top: width * 0.09, right: width * 0.09 }} />
    <Gauge value={value} target={target} status={status} size={width * 0.72} tone="light" progress={progress} />
    <div style={{ ...type.uiTitle, fontSize: width * 0.12, color: gaugeColors.light.label, marginTop: width * 0.08 }}>{label}</div>
    <div style={{ ...type.uiCaption, fontSize: width * 0.095, fontWeight: 500, color: app.header, background: '#EFF6FF', borderRadius: radius.pill, padding: `${width * 0.02}px ${width * 0.07}px`, marginTop: width * 0.09, whiteSpace: 'nowrap' }}>
      Objetivo {target}%
    </div>
  </div>
);

/** Tile translúcido de indicador sobre el header azul (fondo oscuro). */
export const GaugeTile: React.FC<CardProps> = ({ label, value, target, status, progress = 1, width = 168, style }) => (
  <div
    style={{
      width,
      boxSizing: 'border-box',
      padding: `${width * 0.1}px ${width * 0.08}px ${width * 0.08}px`,
      borderRadius: width * 0.14,
      background: gaugeColors.dark.tile,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      ...enterStyle(sub(progress, 0, 0.35), 14),
      ...style,
    }}
  >
    <Gauge value={value} target={target} status={status} size={width * 0.7} tone="dark" progress={progress} />
    <div style={{ ...type.uiTitle, fontSize: width * 0.11, fontWeight: 700, color: gaugeColors.dark.label, marginTop: width * 0.02 }}>{label}</div>
    {target !== undefined && (
      <div style={{ ...type.uiCaption, fontSize: width * 0.08, color: colors.white, marginTop: width * 0.04 }}>
        Objetivo <span style={{ color: gaugeColors.dark.targetText, fontWeight: 700, fontSize: width * 0.095 }}>{target}%</span>
      </div>
    )}
  </div>
);

/** Card de resumen de la home (sobre el header): última actualización, 3 gauges y "Ver detalle". */
export const IndicatorCard: React.FC<{
  items?: { label: string; value: number; target?: number; status?: GaugeStatus }[];
  updated?: string;
  progress?: number;
  width?: number;
  style?: React.CSSProperties;
}> = ({
  items = [
    { label: 'OSA', value: 91, target: 85 },
    { label: 'Precios', value: 79, target: 85 },
    { label: 'Cuota', value: 42, target: 100 },
  ],
  updated = '10:39',
  progress = 1,
  width = 358,
  style,
}) => {
  const gw = (width - 32 - 16) / items.length;
  return (
    <div style={{ width, boxSizing: 'border-box', padding: 16, borderRadius: radius.lg, background: app.indicatorCard, boxShadow: `0 12px 28px ${alpha(colors.dark, 0.3)}`, ...enterStyle(sub(progress, 0, 0.3), 16), ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...type.uiCaption, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 6px', borderRadius: radius.pill, background: app.updatePill, color: colors.white }}>
          <Icon name="clock" size={14} color={colors.white} strokeWidth={2} /> Últ. act. {updated}
        </span>
        <span style={{ ...type.uiCaption, color: colors.white, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          Ver detalle <Icon name="chevronRight" size={14} color={colors.white} strokeWidth={2} />
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
        {items.map((it, i) => {
          const gp = stagger(sub(progress, 0.15, 1), i, items.length, 0.5);
          return (
            <div key={it.label} style={{ width: gw, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Gauge value={it.value} target={it.target} status={it.status} size={gw * 0.84} tone="dark" progress={gp} />
              <div style={{ ...type.uiBody, fontWeight: 500, color: colors.white, marginTop: 6 }}>{it.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 5, borderRadius: 3, background: app.indicatorTrack, marginTop: 16 }} />
    </div>
  );
};
