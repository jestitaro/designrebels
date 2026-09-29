import { MIN_LEGIBLE_PX } from '../tokens';

/** Tamaño efectivo en el frame final = tamaño × zoom de cámara × escala del device. */
export const effectivePx = (fontSize: number, cameraZoom: number, deviceScale: number, depthFactor = 1) =>
  fontSize * Math.pow(cameraZoom, depthFactor) * deviceScale;

export const isLegible = (fontSize: number, cameraZoom: number, deviceScale: number, depthFactor = 1) =>
  effectivePx(fontSize, cameraZoom, deviceScale, depthFactor) >= MIN_LEGIBLE_PX;

/** Zoom mínimo de cámara para que un texto de UI cumpla la regla. */
export const minZoomFor = (fontSize: number, deviceScale: number) => MIN_LEGIBLE_PX / (fontSize * deviceScale);
