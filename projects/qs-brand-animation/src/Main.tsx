import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { z } from 'zod';
import { schedule } from './timeline';
import { MarkerOverlay } from './MarkerOverlay';
import { ScenePlaceholder } from './scenes/ScenePlaceholder';
import { FPS } from './lib/time';
import { S01Problema } from './scenes/S01Problema';
import { S02Complejidad } from './scenes/S02Complejidad';
import { S04Planificacion } from './scenes/S04Planificacion';
import { S05Ruteo } from './scenes/S05Ruteo';
import { S06Comunicacion } from './scenes/S06Comunicacion';
import { S07Captura } from './scenes/S07Captura';
import { S09AiFred } from './scenes/S09AiFred';
import { S11Offline } from './scenes/S11Offline';
import { S12Ecosistema } from './scenes/S12Ecosistema';
import { S13TransicionMarca } from './scenes/S13TransicionMarca';
import { S03Aparece } from './scenes/S03Aparece';
import { S08TiempoReal } from './scenes/S08TiempoReal';
import { S10VisionArtificial } from './scenes/S10VisionArtificial';
import { S14Cierre } from './scenes/S14Cierre';

export const mainSchema = z.object({ showMarkers: z.boolean() });

/**
 * Composición principal. Por ahora cada escena es un slate de placeholder:
 * las escenas finales se construyen después de validar el ComponentShowcase y los assets.
 * Para reemplazar una escena: agregar su componente al mapa SCENE_COMPONENTS.
 */
const SCENE_COMPONENTS: Record<string, React.FC | undefined> = {
  S01: S01Problema,
  S02: S02Complejidad,
  S03: S03Aparece,
  S04: S04Planificacion,
  S05: S05Ruteo,
  S06: S06Comunicacion,
  S07: S07Captura,
  S08: S08TiempoReal,
  S09: S09AiFred,
  S10: S10VisionArtificial,
  S11: S11Offline,
  S12: S12Ecosistema,
  S13: S13TransicionMarca,
  S14: S14Cierre,
};

export const Main: React.FC<z.infer<typeof mainSchema>> = ({ showMarkers }) => (
  <AbsoluteFill>
    {schedule(FPS).map((s) => {
      const C = SCENE_COMPONENTS[s.id];
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={`${s.id} ${s.name}`}>
          {C ? <C /> : <ScenePlaceholder scene={s} />}
        </Sequence>
      );
    })}
    {showMarkers && <MarkerOverlay />}
  </AbsoluteFill>
);
