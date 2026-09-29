import React from 'react';
import { colors, radius, type, ui } from '../tokens';
import { enterStyle } from '../lib/easing';
import { Badge, BadgeVariant } from './Badge';
import { Icon } from './Icon';
import { PdvStatus } from './data';

const statusBadge: Record<PdvStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Visita activa', variant: 'active' },
  scheduled: { label: 'Programada', variant: 'scheduled' },
  done: { label: 'Completada', variant: 'done' },
  warning: { label: 'Ruteo manual', variant: 'warning' },
};

type Props = {
  title: string;
  address?: string;
  time?: string;
  status?: PdvStatus;
  /** texto de acción inline (ej. "2 formularios") */
  meta?: string;
  /** índice de parada en la ruta */
  index?: number;
  progress?: number;
  highlighted?: boolean;
  style?: React.CSSProperties;
};

/** Fila de PDV: nombre en mayúsculas, dirección con pin, horario, estado y chevron. */
export const ListRow: React.FC<Props> = ({ title, address, time, status, meta, index, progress = 1, highlighted, style }) => {
  const b = status ? statusBadge[status] : null;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: 16,
        background: ui.surface,
        borderRadius: radius.md,
        border: `1px solid ${highlighted ? colors.primary : ui.border}`,
        boxShadow: highlighted ? `0 0 0 3px ${ui.primaryTint}` : undefined,
        ...enterStyle(progress, 14),
        ...style,
      }}
    >
      {index !== undefined && (
        <div
          style={{
            ...type.uiCaption,
            fontWeight: 700,
            width: 28,
            height: 28,
            borderRadius: 14,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            background: status === 'done' ? colors.success : status === 'active' ? colors.primary : ui.primaryTint,
            color: status === 'done' || status === 'active' ? colors.white : colors.primary,
          }}
        >
          {status === 'done' ? <Icon name="check" size={14} strokeWidth={2.6} /> : index}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...type.uiBodyStrong, color: colors.textDark, textTransform: 'uppercase', letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        {address && (
          <div style={{ ...type.uiCaption, fontWeight: 400, color: ui.textSecondary, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Icon name="pin" size={13} strokeWidth={2} /> {address}
          </div>
        )}
        {(time || b || meta) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            {b && <Badge label={b.label} variant={b.variant} />}
            {time && (
              <span style={{ ...type.uiCaption, color: ui.textSecondary, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="clock" size={13} strokeWidth={2} /> {time}
              </span>
            )}
            {meta && <span style={{ ...type.uiCaption, color: colors.primary, fontWeight: 600 }}>{meta}</span>}
          </div>
        )}
      </div>
      <Icon name="chevronRight" size={20} color={ui.textMuted} />
    </div>
  );
};
