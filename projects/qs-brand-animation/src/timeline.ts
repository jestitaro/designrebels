import { TransitionType } from './transitions/types';
import { FPS, sec } from './lib/time';

/**
 * Fuente única de verdad del timing. Duraciones en segundos (punto de partida del brief, se ajustan con la VO).
 * `overlap` = segundos que la salida de esta escena se solapa con la entrada de la siguiente.
 * Los overlaps quedan en 0 hasta el storyboard técnico (Fase 1).
 */
export type SceneDef = {
  id: string;
  n: number;
  name: string;
  dur: number;
  exit: TransitionType | null;
  /** detalle del tipo de transición (qué elemento la protagoniza) */
  exitNote?: string;
  overlap: number;
  arc: 'problem' | 'solution' | 'closing';
};

export const SCENES: SceneDef[] = [
  { id: 'S01', n: 1, name: 'Problema', dur: 4.5, exit: 'objectWipe', exitNote: 'card cubre el frame', overlap: 0, arc: 'problem' },
  { id: 'S02', n: 2, name: 'Complejidad', dur: 4, exit: 'shapeMorph', exitNote: 'compresión', overlap: 0, arc: 'problem' },
  { id: 'S03', n: 3, name: 'Aparece QuartzSales', dur: 4.5, exit: 'zoomThrough', overlap: 0, arc: 'solution' },
  { id: 'S04', n: 4, name: 'Planificación', dur: 5, exit: 'matchCut', exitNote: 'pin', overlap: 0, arc: 'solution' },
  { id: 'S05', n: 5, name: 'Ruteo', dur: 5, exit: 'shapeMorph', exitNote: 'línea de ruta', overlap: 0, arc: 'solution' },
  { id: 'S06', n: 6, name: 'Comunicación', dur: 5, exit: 'shapeMorph', exitNote: 'mensaje → form', overlap: 0, arc: 'solution' },
  { id: 'S07', n: 7, name: 'Captura de datos', dur: 5, exit: 'pushInOut', exitNote: 'push-out', overlap: 0, arc: 'solution' },
  { id: 'S08', n: 8, name: 'Tiempo real', dur: 6, exit: 'shapeMorph', exitNote: 'gráfico → góndola', overlap: 0, arc: 'solution' },
  { id: 'S09', n: 9, name: 'AiFred', dur: 5, exit: 'zoomThrough', overlap: 0, arc: 'solution' },
  { id: 'S10', n: 10, name: 'Visión artificial', dur: 7, exit: 'matchCut', overlap: 0, arc: 'solution' },
  { id: 'S11', n: 11, name: 'Offline', dur: 5, exit: 'pushInOut', exitNote: 'push-out', overlap: 0, arc: 'solution' },
  { id: 'S12', n: 12, name: 'Ecosistema', dur: 5, exit: 'shapeMorph', exitNote: 'colapso', overlap: 0, arc: 'solution' },
  { id: 'S13', n: 13, name: 'Transición a marca', dur: 3, exit: 'maskReveal', overlap: 0, arc: 'closing' },
  { id: 'S14', n: 14, name: 'Cierre', dur: 4, exit: null, overlap: 0, arc: 'closing' },
];

export type ScheduledScene = SceneDef & { from: number; durationInFrames: number; startSec: number };

/** Calcula frame de inicio y duración de cada escena respetando overlaps. */
export const schedule = (fps: number = FPS): ScheduledScene[] => {
  let t = 0;
  return SCENES.map((s) => {
    const scheduled = { ...s, startSec: t, from: sec(t, fps), durationInFrames: sec(s.dur, fps) };
    t += s.dur - s.overlap;
    return scheduled;
  });
};

export const totalDurationInFrames = (fps: number = FPS) => {
  const sch = schedule(fps);
  const last = sch[sch.length - 1];
  return last.from + last.durationInFrames;
};

export const sceneById = (id: string, fps: number = FPS) => schedule(fps).find((s) => s.id === id)!;
