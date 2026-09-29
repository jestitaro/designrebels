import React from 'react';
import { colors, radius, type, ui } from '../tokens';
import { enterStyle, sub } from '../lib/easing';

type Props = {
  label?: string;
  /** valor final 0–1 */
  value: number;
  progress?: number;
  showValue?: boolean;
  color?: string;
  style?: React.CSSProperties;
};

export const ProgressBar: React.FC<Props> = ({ label, value, progress = 1, showValue = true, color = ui.accent, style }) => {
  const v = value * sub(progress, 0.15, 1, 'settle');
  const complete = v >= 0.999;
  return (
    <div style={{ ...enterStyle(sub(progress, 0, 0.3), 6), ...style }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', ...type.uiCaption, marginBottom: 8 }}>
          <span style={{ color: ui.textSecondary }}>{label}</span>
          {showValue && <span style={{ color: ui.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{Math.round(v * 100)}%</span>}
        </div>
      )}
      <div style={{ height: 8, borderRadius: radius.pill, background: ui.primaryTint, overflow: 'hidden' }}>
        <div style={{ width: `${v * 100}%`, height: '100%', borderRadius: radius.pill, background: complete ? ui.check : color }} />
      </div>
    </div>
  );
};
