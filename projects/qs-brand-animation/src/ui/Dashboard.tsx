import React from 'react';
import { alpha, app, colors, radius, shadows, type, ui } from '../tokens';
import { enterStyle, stagger, sub } from '../lib/easing';
import { Icon, IconName } from './Icon';
import { ChartCard } from './ChartCard';
import { GaugeCard } from './Gauge';
import { formatInt } from './data';
import { interpolate, useCurrentFrame } from 'remotion';

/**
 * Dashboard web de tiempo real (pantalla de la Laptop, 1280×800).
 * Se diseña en unidades lógicas de 640×400 con zoom 2 para que la UI se lea dentro del device.
 * Las etapas llegan por separado: nunca animan todos los KPIs juntos.
 */
export type DashboardStages = {
  /** count up de los KPIs */
  counts: number;
  bars: number;
  gauges: number;
  alerts: number;
};

const Tile: React.FC<{ label: string; value: number; unit?: string; icon: IconName; tone?: 'default' | 'danger'; p: number }> = ({ label, value, unit, icon, tone = 'default', p }) => (
  <div style={{ flex: 1, background: ui.surface, borderRadius: radius.md, padding: '10px 12px', boxShadow: shadows.card, border: `1px solid ${ui.border}`, ...enterStyle(sub(p, 0, 0.3), 6) }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...type.uiCaption, color: ui.textSecondary }}>
      <span style={{ width: 20, height: 20, borderRadius: 6, background: tone === 'danger' ? ui.dangerTint : ui.primaryTint, display: 'grid', placeItems: 'center' }}>
        <Icon name={icon} size={12} color={tone === 'danger' ? colors.danger : ui.accent} strokeWidth={2.2} />
      </span>
      {label}
    </div>
    <div style={{ ...type.kpi, fontSize: 26, marginTop: 6, color: ui.text, fontVariantNumeric: 'tabular-nums' }}>
      {formatInt(interpolate(sub(p, 0.1, 1, 'settle'), [0, 1], [0, value]))}
      {unit && <span style={{ ...type.uiTitle, fontSize: 14, color: ui.textSecondary }}>{unit}</span>}
    </div>
  </div>
);

const ALERTS = [
  { icon: 'alert' as IconName, text: 'Quiebre de stock', meta: 'Autoservicio Los Álamos', tone: colors.danger },
  { icon: 'tag' as IconName, text: 'Precio fuera de rango', meta: 'Mayorista Del Oeste', tone: colors.warning },
  { icon: 'clock' as IconName, text: 'Visita pendiente', meta: 'Kiosco La Esquina', tone: ui.accent },
];

export const DashboardScreen: React.FC<{ stages: DashboardStages }> = ({ stages }) => {
  const frame = useCurrentFrame();
  const live = 0.55 + 0.45 * Math.abs(Math.sin(frame / 12));
  return (
    <div style={{ width: 1280, height: 800, background: ui.background, overflow: 'hidden' }}>
      <div style={{ zoom: 2, width: 640, height: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 34, background: app.header, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, color: colors.white }}>
          <Icon name="chart" size={16} color={colors.white} strokeWidth={2} />
          <span style={{ ...type.uiTitle, fontSize: 14 }}>Indicadores · Zona Oeste</span>
          <span style={{ flex: 1 }} />
          <span style={{ ...type.uiCaption, fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: radius.pill, background: alpha(colors.white, 0.16) }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: colors.success, opacity: live }} /> En vivo · 10:39
          </span>
        </div>
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tile label="Visitas hoy" value={38} icon="calendar" p={stagger(stages.counts, 0, 4, 0.5)} />
            <Tile label="Formularios" value={124} icon="clipboard" p={stagger(stages.counts, 1, 4, 0.5)} />
            <Tile label="PDV cubiertos" value={92} unit="%" icon="store" p={stagger(stages.counts, 2, 4, 0.5)} />
            <Tile label="Alertas" value={12} icon="alert" tone="danger" p={stagger(stages.counts, 3, 4, 0.5)} />
          </div>
          <div style={{ display: 'flex', gap: 10, flex: 1 }}>
            <ChartCard variant="bars" width={290} progress={stages.bars} style={{ height: '100%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <GaugeCard label="OSA" value={91} target={85} width={100} progress={stagger(stages.gauges, 0, 3, 0.4)} />
                <GaugeCard label="Precios" value={79} target={85} width={100} progress={stagger(stages.gauges, 1, 3, 0.4)} />
                <GaugeCard label="Cuota" value={42} target={100} width={100} progress={stagger(stages.gauges, 2, 3, 0.4)} />
              </div>
              <div style={{ flex: 1, background: ui.surface, borderRadius: radius.md, border: `1px solid ${ui.border}`, boxShadow: shadows.card, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4, opacity: sub(stages.alerts, 0, 0.3) }}>
                <span style={{ ...type.uiCaption, fontSize: 10, color: ui.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Alertas activas</span>
                {ALERTS.map((a, i) => (
                  <div key={a.text} style={{ display: 'flex', alignItems: 'center', gap: 8, ...enterStyle(stagger(stages.alerts, i, 3, 0.5), 6) }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: alpha(a.tone, 0.16), display: 'grid', placeItems: 'center' }}>
                      <Icon name={a.icon} size={11} color={a.tone} strokeWidth={2.4} />
                    </span>
                    <span style={{ ...type.uiCaption, color: ui.text, fontWeight: 600 }}>{a.text}</span>
                    <span style={{ ...type.uiCaption, fontSize: 10, fontWeight: 400, color: ui.textMuted, marginLeft: 'auto' }}>{a.meta}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
