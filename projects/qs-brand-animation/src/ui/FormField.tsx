import React from 'react';
import { useCurrentFrame } from 'remotion';
import { alpha, colors, radius, type, ui } from '../tokens';
import { enterStyle, sub } from '../lib/easing';
import { Icon, IconName } from './Icon';

type Kind = 'text' | 'number' | 'select' | 'check' | 'photo';

type Props = {
  label: string;
  kind?: Kind;
  value?: string;
  placeholder?: string;
  /** entrada del campo (0→0.3) + tipeo del valor (0.3→1) */
  progress?: number;
  focused?: boolean;
  /** check marcado o foto cargada */
  checked?: boolean;
  suffix?: string;
  icon?: IconName;
  style?: React.CSSProperties;
};

export const FormField: React.FC<Props> = ({ label, kind = 'text', value = '', placeholder = '', progress = 1, focused, checked, suffix, icon, style }) => {
  const frame = useCurrentFrame();
  const typed = sub(progress, 0.3, 1, 'easeInOut');
  const shownValue = value.slice(0, Math.round(value.length * typed));
  const isFocused = focused ?? (typed > 0 && typed < 1);
  const caretOn = isFocused && Math.floor(frame / 15) % 2 === 0;

  if (kind === 'check') {
    const on = checked ?? typed > 0.5;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', ...enterStyle(sub(progress, 0, 0.3), 8), ...style }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: `2px solid ${on ? ui.accent : ui.textMuted}`,
            background: on ? ui.accent : ui.surface,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {on && <Icon name="check" size={16} color={colors.white} strokeWidth={3} />}
        </div>
        <span style={{ ...type.uiBody, color: ui.text }}>{label}</span>
      </div>
    );
  }

  if (kind === 'photo') {
    const on = checked ?? typed > 0.5;
    return (
      <div style={{ ...enterStyle(sub(progress, 0, 0.3), 8), ...style }}>
        <Label text={label} />
        <div
          style={{
            height: 88,
            borderRadius: radius.sm,
            border: `1.5px dashed ${on ? ui.check : ui.textMuted}`,
            background: on ? ui.successTint : ui.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            ...type.uiCaption,
            color: on ? ui.text : ui.textSecondary,
          }}
        >
          <Icon name={on ? 'checkCircle' : 'camera'} size={22} color={on ? ui.check : ui.textSecondary} />
          {on ? '3 fotos cargadas' : 'Tomar foto de góndola'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...enterStyle(sub(progress, 0, 0.3), 8), ...style }}>
      <Label text={label} />
      <div
        style={{
          height: 48,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 14px',
          borderRadius: radius.sm,
          background: ui.surface,
          border: `1.5px solid ${isFocused ? ui.focus : ui.border}`,
          boxShadow: isFocused ? `0 0 0 3px ${alpha(ui.focus, 0.14)}` : undefined,
        }}
      >
        {icon && <Icon name={icon} size={18} color={ui.textSecondary} />}
        <span style={{ ...type.uiBody, flex: 1, color: shownValue ? ui.text : ui.textMuted, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center' }}>
          {shownValue || placeholder}
          {caretOn && <span style={{ width: 1.5, height: 18, background: ui.focus, marginLeft: 1 }} />}
        </span>
        {suffix && <span style={{ ...type.uiCaption, color: ui.textSecondary }}>{suffix}</span>}
        {kind === 'select' && <Icon name="chevronDown" size={18} color={ui.textSecondary} />}
      </div>
    </div>
  );
};

const Label: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ ...type.uiCaption, color: ui.textSecondary, marginBottom: 6 }}>{text}</div>
);
