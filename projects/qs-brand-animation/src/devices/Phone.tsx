import React from 'react';
import { alpha, colors, fonts, shadows, ui } from '../tokens';

/** Medidas a escala 1. La pantalla es 390×844 (viewport PSMob). */
export const PHONE = {
  screenW: 390,
  screenH: 844,
  bezel: 12,
  outerRadius: 58,
  innerRadius: 46,
  get width() {
    return this.screenW + this.bezel * 2;
  },
  get height() {
    return this.screenH + this.bezel * 2;
  },
} as const;

type Props = {
  children?: React.ReactNode;
  /** escala uniforme del device */
  scale?: number;
  /** inclinación 3D en grados. Mantener en 0 cuando hay UI para leer. */
  tiltX?: number;
  tiltY?: number;
  rotate?: number;
  /** barra de estado sobre la pantalla */
  statusBar?: 'light' | 'dark' | 'none';
  screenBackground?: string;
  shadow?: boolean;
  style?: React.CSSProperties;
};

/** Smartphone genérico: sin notch de marca, sin logos. Bordes redondeados y sombra suave. */
export const Phone: React.FC<Props> = ({
  children,
  scale = 1,
  tiltX = 0,
  tiltY = 0,
  rotate = 0,
  statusBar = 'light',
  screenBackground = ui.background,
  shadow = true,
  style,
}) => {
  const has3d = tiltX !== 0 || tiltY !== 0;
  return (
    <div
      style={{
        width: PHONE.width,
        height: PHONE.height,
        transform: `${has3d ? 'perspective(2400px) ' : ''}rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${rotate}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: PHONE.outerRadius,
          background: `linear-gradient(145deg, ${colors.dark} 0%, ${colors.textDark} 60%, ${colors.dark} 100%)`,
          boxShadow: shadow
            ? `${shadows.device}, inset 0 0 0 1.5px ${alpha(colors.white, 0.12)}`
            : `inset 0 0 0 1.5px ${alpha(colors.white, 0.12)}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: PHONE.bezel,
          top: PHONE.bezel,
          width: PHONE.screenW,
          height: PHONE.screenH,
          borderRadius: PHONE.innerRadius,
          overflow: 'hidden',
          background: screenBackground,
          // aísla el contenido para que el border-radius recorte bien durante zooms
          isolation: 'isolate',
        }}
      >
        {children}
        {statusBar !== 'none' && <StatusBar tone={statusBar} />}
      </div>
    </div>
  );
};

/** Altura de la status bar, para que AppHeader la respete. */
export const STATUS_BAR_H = 44;

const StatusBar: React.FC<{ tone: 'light' | 'dark' }> = ({ tone }) => {
  const c = tone === 'light' ? colors.white : colors.textDark;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: STATUS_BAR_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        color: c,
        fontFamily: fonts.ui,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 50,
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>10:24</span>
      {/* cámara frontal genérica: punto, sin notch de marca */}
      <div style={{ width: 10, height: 10, borderRadius: 5, background: colors.textDark, boxShadow: `0 0 0 3px ${alpha(colors.dark, 0.6)}` }} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.5} y={9 - i * 3} width="3" height={3 + i * 3} rx="1" fill={c} />
          ))}
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke={c} strokeOpacity="0.5" />
          <rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill={c} />
          <rect x="23.5" y="4" width="2" height="4" rx="1" fill={c} fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
};
