import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { alpha, colors, radius, type } from './tokens';
import { buildMarkers, MARKER_OVERLAY_FRAMES } from './markers';
import { timecode } from './lib/time';

/** Overlay de debug: muestra el tipo de marker durante 10 frames. Solo con showMarkers. */
export const MarkerOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = buildMarkers(fps).filter((m) => frame >= m.frame && frame < m.frame + MARKER_OVERLAY_FRAMES);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', right: 32, top: 32, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ ...type.uiCaption, color: colors.white, background: alpha(colors.dark, 0.7), padding: '4px 10px', borderRadius: radius.sm, fontVariantNumeric: 'tabular-nums' }}>
          {timecode(frame, fps)} · f{frame}
        </div>
        {active.map((m) => (
          <div key={`${m.frame}-${m.type}`} style={{ ...type.uiTitle, color: colors.dark, background: colors.warning, padding: '6px 14px', borderRadius: radius.sm }}>
            ♪ {m.type}
            {m.note ? ` · ${m.note}` : ''}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
