import React from 'react';
import { alpha, colors, radius, type, ui } from '../tokens';
import { sub } from '../lib/easing';
import { Icon } from './Icon';

export type DetectionStatus = 'detected' | 'valid' | 'missing' | 'price';

const tone: Record<DetectionStatus, string> = {
  detected: colors.secondary,
  valid: ui.check,
  missing: colors.danger,
  price: colors.warning,
};

type Props = {
  width: number;
  height: number;
  label: string;
  confidence?: number;
  price?: string;
  status?: DetectionStatus;
  /** 0→0.5 dibuja las esquinas, 0.4→0.8 relleno, 0.6→1 label */
  progress?: number;
  style?: React.CSSProperties;
};

/** Bounding box de visión artificial: esquinas que se dibujan + label con confianza. IA aplicada, no magia. */
export const DetectionBox: React.FC<Props> = ({ width, height, label, confidence, price, status = 'detected', progress = 1, style }) => {
  const c = tone[status];
  const corners = sub(progress, 0, 0.5, 'settle');
  const fill = sub(progress, 0.35, 0.8);
  const lbl = sub(progress, 0.55, 1);
  const L = Math.min(width, height) * 0.28 * corners;
  const sw = 3;
  const cornerPath = [
    `M0 ${L} L0 0 L${L} 0`,
    `M${width - L} 0 L${width} 0 L${width} ${L}`,
    `M${width} ${height - L} L${width} ${height} L${width - L} ${height}`,
    `M${L} ${height} L0 ${height} L0 ${height - L}`,
  ].join(' ');
  return (
    <div style={{ position: 'relative', width, height, ...style }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: alpha(c, 0.14 * fill), border: `1px solid ${alpha(c, 0.5 * fill)}` }} />
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d={cornerPath} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={corners > 0 ? 1 : 0} />
      </svg>
      <div
        style={{
          ...type.uiCaption,
          position: 'absolute',
          left: -1.5,
          bottom: `calc(100% + 6px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          borderRadius: radius.sm - 2,
          background: alpha(colors.dark, 0.88),
          color: colors.white,
          whiteSpace: 'nowrap',
          opacity: lbl,
          transform: `translateY(${(1 - lbl) * 6}px)`,
        }}
      >
        {status === 'valid' && <Icon name="check" size={13} color={ui.check} strokeWidth={3} />}
        {status === 'missing' && <Icon name="alert" size={13} color={colors.danger} strokeWidth={2.4} />}
        <span>{label}</span>
        {confidence !== undefined && <span style={{ color: tone[status], fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Math.round(confidence * 100)}%</span>}
      </div>
      {price && (
        <div
          style={{
            ...type.uiCaption,
            fontWeight: 700,
            position: 'absolute',
            right: -1.5,
            top: `calc(100% + 6px)`,
            padding: '3px 8px',
            borderRadius: radius.sm - 2,
            background: colors.white,
            color: ui.text,
            boxShadow: `0 2px 8px ${alpha(colors.dark, 0.2)}`,
            opacity: sub(progress, 0.75, 1),
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {price}
        </div>
      )}
    </div>
  );
};

/** Línea de scanning que recorre un área (paso 1 de la visión artificial). */
export const ScanLine: React.FC<{ width: number; height: number; progress: number }> = ({ width, height, progress }) => {
  const y = progress * height;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y - 60, height: 60, background: `linear-gradient(180deg, ${alpha(colors.secondary, 0)} 0%, ${alpha(colors.secondary, 0.22)} 100%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: y - 1, height: 2, background: colors.secondary, boxShadow: `0 0 12px ${colors.secondary}` }} />
    </div>
  );
};
