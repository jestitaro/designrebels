import React from 'react';
import { useCurrentFrame } from 'remotion';
import { alpha, colors, radius, type, ui } from '../tokens';
import { enterStyle } from '../lib/easing';
import { Icon } from './Icon';

type Props = {
  text: string;
  side?: 'in' | 'out';
  author?: string;
  time?: string;
  read?: boolean;
  /** muestra "escribiendo…" en lugar del texto */
  typing?: boolean;
  progress?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
};

export const ChatBubble: React.FC<Props> = ({ text, side = 'in', author, time, read = true, typing = false, progress = 1, maxWidth = 280, style }) => {
  const out = side === 'out';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: out ? 'flex-end' : 'flex-start', ...enterStyle(progress, 12), ...style }}>
      {author && !out && <span style={{ ...type.uiCaption, color: colors.primary, fontWeight: 600, margin: '0 0 4px 12px' }}>{author}</span>}
      <div
        style={{
          ...type.uiBody,
          maxWidth,
          padding: '10px 14px',
          borderRadius: radius.lg,
          [out ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 6,
          background: out ? colors.primary : ui.surface,
          color: out ? colors.white : colors.textDark,
          boxShadow: out ? `0 4px 12px ${alpha(colors.primary, 0.25)}` : `0 2px 8px ${alpha(colors.dark, 0.08)}`,
          border: out ? 'none' : `1px solid ${ui.border}`,
          transformOrigin: out ? '100% 100%' : '0 100%',
        }}
      >
        {typing ? <TypingDots color={out ? colors.white : ui.textMuted} /> : text}
        {!typing && time && (
          <span style={{ ...type.uiCaption, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 8, float: 'right', marginTop: 6, opacity: out ? 0.8 : 1, color: out ? colors.white : ui.textMuted }}>
            {time}
            {out && <Icon name={read ? 'checkDouble' : 'check'} size={14} strokeWidth={2} />}
          </span>
        )}
      </div>
    </div>
  );
};

/** Tres puntos con fase por frame (determinístico). */
const TypingDots: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 2px' }}>
      {[0, 1, 2].map((i) => {
        const t = Math.sin(frame / 4 - i * 0.9);
        return <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: color, opacity: 0.45 + 0.4 * Math.max(0, t), transform: `translateY(${-Math.max(0, t) * 2.5}px)` }} />;
      })}
    </div>
  );
};
