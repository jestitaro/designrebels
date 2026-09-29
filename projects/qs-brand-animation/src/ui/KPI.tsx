import React from 'react';
import { interpolate } from 'remotion';
import { colors, type, ui } from '../tokens';
import { enterStyle, sub } from '../lib/easing';
import { formatInt } from './data';
import { Card } from './Card';
import { Icon, IconName } from './Icon';

type Props = {
  label: string;
  value: number;
  unit?: string;
  delta?: string;
  trend?: 'up' | 'down';
  /** si el delta negativo es bueno (ej. alertas que bajan) */
  positiveIsDown?: boolean;
  deltaLabel?: string;
  icon?: IconName;
  /** entrada + count up */
  progress?: number;
  elevation?: 'flat' | 'float';
  width?: number;
  style?: React.CSSProperties;
};

export const KPI: React.FC<Props> = ({
  label,
  value,
  unit = '',
  delta,
  trend = 'up',
  positiveIsDown = false,
  deltaLabel = 'vs. sem. ant.',
  icon,
  progress = 1,
  elevation = 'flat',
  width = 168,
  style,
}) => {
  const count = sub(progress, 0.15, 1, 'settle');
  const shown = interpolate(count, [0, 1], [0, value]);
  const good = positiveIsDown ? trend === 'down' : trend === 'up';
  return (
    <Card progress={sub(progress, 0, 0.4)} elevation={elevation} width={width} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: ui.textSecondary }}>
        {icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: ui.primaryTint, display: 'grid', placeItems: 'center' }}>
            <Icon name={icon} size={16} color={colors.primary} strokeWidth={2} />
          </div>
        )}
        <span style={{ ...type.uiCaption }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 12, color: colors.textDark }}>
        <span style={{ ...type.kpi, fontVariantNumeric: 'tabular-nums' }}>{formatInt(shown)}</span>
        {unit && <span style={{ ...type.uiTitle, color: ui.textSecondary }}>{unit}</span>}
      </div>
      {delta && (
        <div style={{ ...type.uiCaption, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', color: ui.textSecondary, ...enterStyle(sub(progress, 0.7, 1), 4) }}>
          <span
            style={{
              display: 'inline-flex',
              width: 16,
              height: 16,
              borderRadius: 8,
              background: good ? ui.successTint : ui.dangerTint,
              alignItems: 'center',
              justifyContent: 'center',
              transform: trend === 'down' ? 'rotate(180deg)' : undefined,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M5 2 8.5 7h-7z" fill={good ? colors.success : colors.danger} />
            </svg>
          </span>
          <span style={{ color: colors.textDark, fontWeight: 600 }}>{delta}</span> {deltaLabel}
        </div>
      )}
    </Card>
  );
};
