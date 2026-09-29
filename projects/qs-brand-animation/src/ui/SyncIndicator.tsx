import React from 'react';
import { useCurrentFrame } from 'remotion';
import { alpha, colors, radius, type, ui } from '../tokens';
import { enterStyle } from '../lib/easing';
import { Icon, IconName } from './Icon';

export type SyncState = 'online' | 'offline' | 'saved' | 'pending' | 'syncing' | 'synced';

const states: Record<SyncState, { label: string; icon: IconName; color: string; bg: string; fg: string }> = {
  online: { label: 'En línea', icon: 'wifi', color: colors.success, bg: ui.successTint, fg: colors.textDark },
  offline: { label: 'Modo sin conexión', icon: 'wifiOff', color: colors.white, bg: colors.textDark, fg: colors.white },
  saved: { label: 'Guardado localmente', icon: 'device', color: colors.primary, bg: ui.primaryTint, fg: colors.primary },
  pending: { label: 'Sincronización pendiente', icon: 'cloudUp', color: colors.warning, bg: ui.warningTint, fg: colors.textDark },
  syncing: { label: 'Sincronizando…', icon: 'refresh', color: colors.primary, bg: ui.primaryTint, fg: colors.primary },
  synced: { label: 'Sincronizado', icon: 'checkCircle', color: colors.success, bg: ui.successTint, fg: colors.textDark },
};

type Props = {
  state: SyncState;
  /** cantidad de registros pendientes */
  count?: number;
  /** avance del sync (0–1) para el estado syncing */
  syncProgress?: number;
  progress?: number;
  /** versión en header (sobre fondo primary) */
  onPrimary?: boolean;
  style?: React.CSSProperties;
};

export const SyncIndicator: React.FC<Props> = ({ state, count, syncProgress, progress = 1, onPrimary, style }) => {
  const frame = useCurrentFrame();
  const s = states[state];
  const spin = state === 'syncing' ? (frame * 9) % 360 : 0;
  const bg = onPrimary && state !== 'offline' ? alpha(colors.white, 0.18) : s.bg;
  const fg = onPrimary && state !== 'offline' ? colors.white : s.fg;
  const ic = onPrimary && state !== 'offline' ? colors.white : s.color;
  return (
    <div
      style={{
        ...type.uiCaption,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 32,
        padding: '0 12px 0 10px',
        borderRadius: radius.pill,
        background: bg,
        color: fg,
        position: 'relative',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        ...enterStyle(progress, 8),
        ...style,
      }}
    >
      {state === 'syncing' && syncProgress !== undefined && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${syncProgress * 100}%`, background: alpha(colors.primary, 0.12) }} />
      )}
      <Icon name={s.icon} size={16} color={ic} strokeWidth={2} style={{ transform: `rotate(${spin}deg)`, position: 'relative' }} />
      <span style={{ position: 'relative' }}>{s.label}</span>
      {count !== undefined && (
        <span style={{ position: 'relative', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: state === 'offline' ? alpha(colors.white, 0.2) : alpha(colors.textDark, 0.08), display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11 }}>
          {count}
        </span>
      )}
    </div>
  );
};
