import { FPS, sec } from './lib/time';
import { sceneById } from './timeline';

export const MARKER_TYPES = ['whoosh', 'tap', 'cardEntry', 'notification', 'scan', 'success', 'sync', 'logoReveal'] as const;
export type MarkerType = (typeof MARKER_TYPES)[number];

export type Marker = {
  /** frame absoluto en Main */
  frame: number;
  type: MarkerType;
  scene: string;
  note?: string;
};

/**
 * Markers relativos a escena (segundos desde el inicio de la escena).
 * Se completan escena por escena en el storyboard técnico (Fase 1) y al construir cada escena.
 */
type SceneMarker = { scene: string; at: number; type: MarkerType; note?: string };

export const SCENE_MARKERS: SceneMarker[] = [
  // Ejemplo de formato (se reemplaza en Fase 1):
  // { scene: 'S01', at: 4.1, type: 'whoosh', note: 'card cubre cámara' },
];

export const buildMarkers = (fps: number = FPS): Marker[] =>
  SCENE_MARKERS.map((m) => ({ frame: sceneById(m.scene, fps).from + sec(m.at, fps), type: m.type, scene: m.scene, note: m.note })).sort(
    (a, b) => a.frame - b.frame,
  );

/** Duración del overlay de debug de cada marker. */
export const MARKER_OVERLAY_FRAMES = 10;
