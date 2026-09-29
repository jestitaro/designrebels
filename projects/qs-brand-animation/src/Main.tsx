import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { z } from 'zod';
import { schedule } from './timeline';
import { MarkerOverlay } from './MarkerOverlay';
import { ScenePlaceholder } from './scenes/ScenePlaceholder';
import { FPS } from './lib/time';

export const mainSchema = z.object({ showMarkers: z.boolean() });

/**
 * Composición principal. Por ahora cada escena es un slate de placeholder:
 * las escenas finales se construyen después de validar el ComponentShowcase y los assets.
 * Para reemplazar una escena: agregar su componente al mapa SCENE_COMPONENTS.
 */
const SCENE_COMPONENTS: Record<string, React.FC | undefined> = {};

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
