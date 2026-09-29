import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { alpha, colors, radius, type } from '../tokens';
import { GradientBackground } from '../shapes/GradientBackground';
import { ScheduledScene } from '../timeline';
import { TRANSITION_LABELS } from '../transitions/types';
import { timecode } from '../lib/time';

/** Slate de escena pendiente: número, nombre, rango y transición de salida. No es contenido final. */
export const ScenePlaceholder: React.FC<{ scene: ScheduledScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const onDark = scene.arc === 'problem';
  const fg = onDark ? colors.white : colors.textDark;
  return (
    <AbsoluteFill>
      <GradientBackground arc={scene.arc} seed={scene.id} />
      <div style={{ position: 'absolute', left: 120, bottom: 120, color: fg }}>
        <div style={{ ...type.uiTitle, opacity: 0.7 }}>
          {scene.id} · {timecode(scene.from, fps)} → {timecode(scene.from + scene.durationInFrames, fps)} · {scene.dur}s
        </div>
        <div style={{ ...type.headline, marginTop: 8 }}>{scene.name}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <span style={{ ...type.uiTitle, padding: '8px 16px', borderRadius: radius.pill, background: alpha(fg, 0.1) }}>
            Salida: {scene.exit ? TRANSITION_LABELS[scene.exit] : '—'}
            {scene.exitNote ? ` (${scene.exitNote})` : ''}
          </span>
          <span style={{ ...type.uiTitle, padding: '8px 16px', borderRadius: radius.pill, background: alpha(fg, 0.1), fontVariantNumeric: 'tabular-nums' }}>
            f {frame}/{scene.durationInFrames}
          </span>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 120, bottom: 120, ...type.uiTitle, color: fg, opacity: 0.5 }}>ESCENA PENDIENTE</div>
    </AbsoluteFill>
  );
};
