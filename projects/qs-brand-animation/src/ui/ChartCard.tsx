import React from 'react';
import { evolvePath } from '@remotion/paths';
import { alpha, colors, type, ui } from '../tokens';
import { stagger, sub } from '../lib/easing';
import { Card } from './Card';
import { WEEK } from './data';

/** Los indicadores porcentuales van con Gauge (medio círculo), no acá. */
type Variant = 'bars' | 'line';

type Props = {
  variant?: Variant;
  title?: string;
  caption?: string;
  data?: readonly { d: string; v: number }[];
  progress?: number;
  width?: number;
  elevation?: 'flat' | 'float';
  style?: React.CSSProperties;
};

const titles: Record<Variant, [string, string]> = {
  bars: ['Visitas por día', 'Semana 39'],
  line: ['Cumplimiento', 'Últimas 7 visitas'],
};

export const ChartCard: React.FC<Props> = ({
  variant = 'bars',
  title = titles[variant][0],
  caption = titles[variant][1],
  data = WEEK,
  progress = 1,
  width = 358,
  elevation = 'flat',
  style,
}) => {
  const body = sub(progress, 0.2, 1, 'settle');
  return (
    <Card progress={sub(progress, 0, 0.35)} width={width} elevation={elevation} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ ...type.uiBodyStrong, color: ui.text }}>{title}</div>
          <div style={{ ...type.uiCaption, color: ui.textSecondary, marginTop: 2 }}>{caption}</div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        {variant === 'bars' && <Bars data={data} p={body} />}
        {variant === 'line' && <Line data={data} p={body} />}
      </div>
    </Card>
  );
};

const Bars: React.FC<{ data: Props['data']; p: number }> = ({ data = WEEK, p }) => {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
      {data.map((d, i) => {
        const bp = stagger(p, i, data.length, 0.7, 'settle');
        const top = d.v === max;
        return (
          <div key={d.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <div
              style={{
                width: '100%',
                height: `${d.v * 80 * bp}%`,
                borderRadius: 6,
                background: top ? ui.accent : alpha(ui.accent, 0.22),
              }}
            />
            <span style={{ ...type.uiCaption, fontSize: 11, color: top ? ui.text : ui.textSecondary }}>{d.d}</span>
          </div>
        );
      })}
    </div>
  );
};

const Line: React.FC<{ data: Props['data']; p: number }> = ({ data = WEEK, p }) => {
  const w = 326;
  const h = 110;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * (w - 12) + 6, h - 8 - d.v * (h - 24)] as const);
  const path = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${path} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h} Z`;
  const ev = evolvePath(p, path);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ui.accent} stopOpacity={0.18} />
          <stop offset="100%" stopColor={ui.accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke={ui.divider} />
      ))}
      <path d={area} fill="url(#lineArea)" opacity={p} />
      <path d={path} fill="none" stroke={ui.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
      {p > 0.98 && <circle cx={pts[pts.length - 2][0]} cy={pts[pts.length - 2][1]} r="5" fill={colors.white} stroke={ui.accent} strokeWidth="3" />}
    </svg>
  );
};
