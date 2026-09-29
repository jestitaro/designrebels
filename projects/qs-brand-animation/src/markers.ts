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
 * Definidos en STORYBOARD.md (Fase 1). Se ajustan al construir cada escena y cuando llegue el BPM.
 */
type SceneMarker = { scene: string; at: number; type: MarkerType; note?: string };

export const SCENE_MARKERS: SceneMarker[] = [
  { scene: 'S01', at: 0.6, type: 'cardEntry', note: 'primera card' },
  { scene: 'S01', at: 1.4, type: 'cardEntry' },
  { scene: 'S01', at: 2.2, type: 'notification', note: 'alerta' },
  { scene: 'S01', at: 3.0, type: 'cardEntry', note: 'se multiplican' },
  { scene: 'S01', at: 3.9, type: 'whoosh', note: 'card cubre cámara' },
  { scene: 'S02', at: 0.2, type: 'whoosh', note: 'cámara entra a la nube' },
  { scene: 'S02', at: 1.8, type: 'whoosh', note: 'atraviesa' },
  { scene: 'S02', at: 3.3, type: 'whoosh', note: 'compresión' },
  { scene: 'S03', at: 0.5, type: 'whoosh', note: 'entra el teléfono' },
  { scene: 'S03', at: 1.6, type: 'cardEntry', note: 'magnetización' },
  { scene: 'S03', at: 2.4, type: 'success', note: 'alivio / cambio de fondo' },
  { scene: 'S03', at: 4.1, type: 'whoosh', note: 'zoom through' },
  { scene: 'S04', at: 0.3, type: 'cardEntry', note: 'visitas' },
  { scene: 'S04', at: 0.9, type: 'cardEntry' },
  { scene: 'S04', at: 1.5, type: 'tap', note: 'PDV activo' },
  { scene: 'S04', at: 2.8, type: 'whoosh', note: 'zoom out' },
  { scene: 'S04', at: 3.6, type: 'notification', note: 'pines y equipo' },
  { scene: 'S05', at: 0.4, type: 'whoosh', note: 'sale el pin' },
  { scene: 'S05', at: 1.2, type: 'whoosh', note: 'ruta se dibuja' },
  { scene: 'S05', at: 3.8, type: 'success', note: 'llega al PDV' },
  { scene: 'S06', at: 0.3, type: 'notification', note: 'burbuja' },
  { scene: 'S06', at: 1.4, type: 'notification', note: 'respuesta' },
  { scene: 'S06', at: 2.4, type: 'cardEntry', note: 'kinetic type' },
  { scene: 'S07', at: 0.8, type: 'tap', note: 'campo' },
  { scene: 'S07', at: 1.6, type: 'success', note: 'check' },
  { scene: 'S07', at: 2.4, type: 'cardEntry', note: 'datos al espacio' },
  { scene: 'S07', at: 4.6, type: 'whoosh', note: 'push-out' },
  { scene: 'S08', at: 0.6, type: 'cardEntry', note: 'cards al dashboard' },
  { scene: 'S08', at: 1.5, type: 'cardEntry', note: 'count up' },
  { scene: 'S08', at: 2.6, type: 'cardEntry', note: 'barras' },
  { scene: 'S08', at: 3.4, type: 'success', note: 'gauges' },
  { scene: 'S08', at: 4.3, type: 'notification', note: 'alertas' },
  { scene: 'S08', at: 5.5, type: 'whoosh', note: 'gráfico → góndola' },
  { scene: 'S09', at: 0.3, type: 'whoosh', note: 'travelling' },
  { scene: 'S09', at: 3.4, type: 'tap', note: 'levanta el celular' },
  { scene: 'S09', at: 4.6, type: 'whoosh', note: 'zoom through' },
  { scene: 'S10', at: 0.5, type: 'scan', note: 'línea de scanning' },
  { scene: 'S10', at: 1.6, type: 'cardEntry', note: 'primera detección' },
  { scene: 'S10', at: 2.4, type: 'cardEntry', note: 'cascada' },
  { scene: 'S10', at: 3.0, type: 'cardEntry' },
  { scene: 'S10', at: 4.4, type: 'cardEntry', note: 'precios' },
  { scene: 'S10', at: 5.4, type: 'success', note: 'planograma' },
  { scene: 'S10', at: 6.2, type: 'success', note: 'validado' },
  { scene: 'S11', at: 0.4, type: 'notification', note: 'modo sin conexión' },
  { scene: 'S11', at: 1.6, type: 'tap' },
  { scene: 'S11', at: 2.2, type: 'success', note: 'guardado localmente' },
  { scene: 'S11', at: 3.6, type: 'sync', note: 'vuelve la conexión' },
  { scene: 'S11', at: 4.4, type: 'success', note: 'sincronizado' },
  { scene: 'S12', at: 0.6, type: 'whoosh', note: 'zoom out' },
  { scene: 'S12', at: 1.4, type: 'cardEntry', note: 'módulos' },
  { scene: 'S12', at: 2.2, type: 'cardEntry' },
  { scene: 'S12', at: 3.0, type: 'cardEntry' },
  { scene: 'S12', at: 4.6, type: 'whoosh', note: 'colapso' },
  { scene: 'S13', at: 0.4, type: 'whoosh', note: 'triángulos' },
  { scene: 'S13', at: 2.0, type: 'logoReveal', note: 'isotipo armado' },
  { scene: 'S14', at: 0.3, type: 'logoReveal', note: 'isotipo' },
  { scene: 'S14', at: 1.0, type: 'cardEntry', note: 'wordmark' },
  { scene: 'S14', at: 1.8, type: 'cardEntry', note: 'tagline' },
];

export const buildMarkers = (fps: number = FPS): Marker[] =>
  SCENE_MARKERS.map((m) => ({ frame: sceneById(m.scene, fps).from + sec(m.at, fps), type: m.type, scene: m.scene, note: m.note })).sort(
    (a, b) => a.frame - b.frame,
  );

/** Duración del overlay de debug de cada marker. */
export const MARKER_OVERLAY_FRAMES = 10;
