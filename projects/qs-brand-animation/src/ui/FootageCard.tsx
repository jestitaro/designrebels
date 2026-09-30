import React from 'react';
import { Img, OffthreadVideo, staticFile, useVideoConfig } from 'remotion';
import { alpha, colors, radius, shadows } from '../tokens';
import { enterStyle } from '../lib/easing';
import { CLIPS, ClipId, PHOTOS, PhotoId } from '../footage';

/** from: segundo del clip donde arranca · rate: velocidad (0.5 = cámara lenta, estira planos cortos) */
type Source = { clip: ClipId; from?: number; rate?: number } | { photo: PhotoId };

type Props = Source & {
  width: number;
  /** alto; si no se pasa, sale de la proporción del material */
  height?: number;
  shape?: 'card' | 'circle';
  /** punto de encuadre del material (object-position), para que cara/manos/celular queden adentro */
  focus?: string;
  /** zoom sobre el material (1 = cover) */
  zoom?: number;
  progress?: number;
  /** tinte del arco (problema = violeta leve) para integrar el material al fondo */
  tint?: string;
  border?: boolean;
  style?: React.CSSProperties;
};

/**
 * Material real enmascarado: card de video o círculo con borde blanco y sombra suave.
 * Las personas nunca van a pantalla completa (dirección v2).
 */
export const FootageCard: React.FC<Props> = (props) => {
  const { width, shape = 'card', focus = '50% 50%', zoom = 1, progress = 1, tint, border = true, style } = props;
  const { fps } = useVideoConfig();
  const meta = 'clip' in props ? CLIPS[props.clip] : PHOTOS[props.photo];
  const height = props.height ?? (shape === 'circle' ? width : (width * meta.h) / meta.w);
  const media: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: focus,
    transform: `scale(${zoom})`,
    transformOrigin: focus,
    display: 'block',
  };
  return (
    <div
      style={{
        width,
        height,
        borderRadius: shape === 'circle' ? '50%' : radius.lg,
        overflow: 'hidden',
        position: 'relative',
        background: colors.dark,
        boxShadow: `${shadows.float}${border ? `, 0 0 0 ${shape === 'circle' ? 6 : 5}px ${colors.white}` : ''}`,
        isolation: 'isolate',
        ...enterStyle(progress, 20),
        ...style,
      }}
    >
      {'clip' in props ? (
        <OffthreadVideo src={staticFile(CLIPS[props.clip].src)} startFrom={Math.round((props.from ?? 0) * fps)} playbackRate={props.rate ?? 1} muted style={media} />
      ) : (
        <Img src={staticFile(PHOTOS[props.photo].src)} style={media} />
      )}
      {tint && <div style={{ position: 'absolute', inset: 0, background: tint, mixBlendMode: 'multiply' }} />}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: `inset 0 0 0 1px ${alpha(colors.white, 0.25)}` }} />
    </div>
  );
};
