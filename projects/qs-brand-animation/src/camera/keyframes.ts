import { interpolate } from 'remotion';
import { easings, EasingName } from '../tokens';
import { FPS, HEIGHT, sec, WIDTH } from '../lib/time';

export type CameraState = {
  /** centro de cámara en coordenadas de mundo (px). El mundo tiene su origen arriba-izquierda, 1920×1080. */
  x: number;
  y: number;
  zoom: number;
  /** grados */
  rotate: number;
};

export const CAMERA_REST: CameraState = { x: WIDTH / 2, y: HEIGHT / 2, zoom: 1, rotate: 0 };

export type CameraKeyframe = Partial<CameraState> & {
  /** segundos, relativos al inicio de la escena */
  t: number;
  /** curva para llegar a este keyframe desde el anterior */
  ease?: EasingName;
};

/**
 * Interpola keyframes de cámara. Los valores faltantes heredan del keyframe anterior.
 * El zoom se interpola en espacio logarítmico para que acercarse se sienta constante.
 */
export const cameraAt = (frame: number, keyframes: CameraKeyframe[], fps: number = FPS): CameraState => {
  if (keyframes.length === 0) return CAMERA_REST;
  // resolver herencia de valores
  const resolved: (CameraState & { t: number; ease: EasingName })[] = [];
  let prev: CameraState = CAMERA_REST;
  for (const k of keyframes) {
    const s: CameraState = {
      x: k.x ?? prev.x,
      y: k.y ?? prev.y,
      zoom: k.zoom ?? prev.zoom,
      rotate: k.rotate ?? prev.rotate,
    };
    resolved.push({ ...s, t: k.t, ease: k.ease ?? 'easeInOut' });
    prev = s;
  }
  const f = frame;
  const first = resolved[0];
  if (f <= sec(first.t, fps)) return first;
  const last = resolved[resolved.length - 1];
  if (f >= sec(last.t, fps)) return last;

  let i = 0;
  while (i < resolved.length - 1 && f >= sec(resolved[i + 1].t, fps)) i++;
  const a = resolved[i];
  const b = resolved[i + 1];
  const p = interpolate(f, [sec(a.t, fps), sec(b.t, fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easings[b.ease],
  });
  const logZoom = Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * p;
  return {
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
    zoom: Math.exp(logZoom),
    rotate: a.rotate + (b.rotate - a.rotate) * p,
  };
};

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Estado de cámara que hace que `rect` (en coordenadas de mundo) llene el frame.
 * Base del zoom through: al llegar a este estado se hace el handoff a la escena siguiente,
 * que arranca con esa misma UI a escala 1.
 * `fit: 'cover'` llena todo el frame; `'contain'` deja el rect entero visible.
 */
export const zoomToRect = (rect: Rect, fit: 'cover' | 'contain' = 'cover', margin = 1): CameraState => {
  const zx = WIDTH / rect.width;
  const zy = HEIGHT / rect.height;
  const zoom = (fit === 'cover' ? Math.max(zx, zy) : Math.min(zx, zy)) * margin;
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, zoom, rotate: 0 };
};

/** Presets de push-in / push-out relativos a un punto de interés. */
export const pushIn = (from: CameraState, amount = 1.18, drift: Partial<CameraState> = {}): CameraState => ({
  ...from,
  ...drift,
  zoom: from.zoom * amount,
});
export const pushOut = (from: CameraState, amount = 1.18, drift: Partial<CameraState> = {}): CameraState => ({
  ...from,
  ...drift,
  zoom: from.zoom / amount,
});
