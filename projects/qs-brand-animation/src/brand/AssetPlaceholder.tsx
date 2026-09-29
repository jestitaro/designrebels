import React from 'react';
import { alpha, colors, radius, type } from '../tokens';

/**
 * Placeholder explícito para assets pendientes de entrega.
 * No dibuja ni aproxima el asset: solo reserva el espacio y dice qué falta.
 */
export const AssetPlaceholder: React.FC<{
  width: number;
  height: number;
  label: string;
  file: string;
  tone?: 'light' | 'dark';
  style?: React.CSSProperties;
}> = ({ width, height, label, file, tone = 'light', style }) => {
  const fg = tone === 'light' ? colors.textDark : colors.white;
  const stripe = alpha(fg, 0.05);
  return (
    <div
      style={{
        width,
        height,
        boxSizing: 'border-box',
        borderRadius: radius.md,
        border: `2px dashed ${alpha(fg, 0.35)}`,
        background: `repeating-linear-gradient(135deg, ${stripe} 0 12px, transparent 12px 24px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        color: alpha(fg, 0.7),
        textAlign: 'center',
        padding: 8,
        ...style,
      }}
    >
      <span style={{ ...type.uiCaption, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ ...type.uiCaption, fontWeight: 400, opacity: 0.8, wordBreak: 'break-all' }}>{file}</span>
      <span style={{ ...type.uiCaption, fontWeight: 400, opacity: 0.6 }}>pendiente de entrega</span>
    </div>
  );
};
