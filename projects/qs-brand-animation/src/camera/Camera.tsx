import React, { createContext, useContext } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CAMERA_REST, cameraAt, CameraKeyframe, CameraState } from './keyframes';

const CameraContext = createContext<CameraState>(CAMERA_REST);
export const useCamera = () => useContext(CameraContext);

type Props = {
  keyframes?: CameraKeyframe[];
  /** alternativa a keyframes: estado fijo o calculado desde afuera */
  state?: CameraState;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/**
 * Contenedor de mundo. No transforma nada por sí mismo: publica el estado de cámara
 * y cada <DepthLayer> aplica la transformación con su factor de parallax.
 * Toda escena vive dentro de un <Camera>.
 */
export const Camera: React.FC<Props> = ({ keyframes = [], state, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = state ?? cameraAt(frame, keyframes, fps);
  return (
    <CameraContext.Provider value={cam}>
      <AbsoluteFill style={{ overflow: 'hidden', ...style }}>{children}</AbsoluteFill>
    </CameraContext.Provider>
  );
};
