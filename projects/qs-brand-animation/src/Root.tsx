import React from 'react';
import { Composition, Series } from 'remotion';
import './fonts';
import { FPS, HEIGHT, sec, WIDTH } from './lib/time';
import { Main, mainSchema } from './Main';
import { totalDurationInFrames } from './timeline';
import { SHOWCASE_PAGES } from './showcase/pages';
import { CameraLab, TransitionsLab, TRANSITION_DEMO_SEC, WalkLab } from './showcase/labs';
import { TRANSITION_TYPES } from './transitions/types';
import { SCENES } from './timeline';
import { S01Problema } from './scenes/S01Problema';
import { S03Aparece } from './scenes/S03Aparece';
import { S08TiempoReal } from './scenes/S08TiempoReal';
import { S10VisionArtificial } from './scenes/S10VisionArtificial';
import { S14Cierre } from './scenes/S14Cierre';

/** Escenas sueltas (para trabajar y renderizar style frames). Duración desde timeline.ts. */
const SCENE_COMPS: { id: string; slug: string; C: React.FC }[] = [
  { id: 'S01', slug: 'Problema', C: S01Problema },
  { id: 'S03', slug: 'Aparece', C: S03Aparece },
  { id: 'S08', slug: 'TiempoReal', C: S08TiempoReal },
  { id: 'S10', slug: 'VisionArtificial', C: S10VisionArtificial },
  { id: 'S14', slug: 'Cierre', C: S14Cierre },
];

/** Cada lámina entra animada (valida la prop progress) y queda quieta para el still. */
const SHOWCASE_PAGE_SEC = 3;

const ComponentShowcase: React.FC = () => (
  <Series>
    {SHOWCASE_PAGES.map(({ id, C }) => (
      <Series.Sequence key={id} durationInFrames={sec(SHOWCASE_PAGE_SEC)} name={id}>
        <C />
      </Series.Sequence>
    ))}
  </Series>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} schema={mainSchema} defaultProps={{ showMarkers: false }} durationInFrames={totalDurationInFrames(FPS)} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="ComponentShowcase" component={ComponentShowcase} durationInFrames={sec(SHOWCASE_PAGE_SEC) * SHOWCASE_PAGES.length} fps={FPS} width={WIDTH} height={HEIGHT} />
    {SHOWCASE_PAGES.map(({ id, C }) => (
      <Composition key={id} id={`Showcase-${id}`} component={C} durationInFrames={sec(SHOWCASE_PAGE_SEC)} fps={FPS} width={WIDTH} height={HEIGHT} />
    ))}
    {SCENE_COMPS.map(({ id, slug, C }) => {
      const def = SCENES.find((sc) => sc.id === id)!;
      return <Composition key={id} id={`${id}-${slug}`} component={C} durationInFrames={sec(def.dur)} fps={FPS} width={WIDTH} height={HEIGHT} />;
    })}
    <Composition id="CameraLab" component={CameraLab} durationInFrames={sec(6)} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="WalkLab" component={WalkLab} durationInFrames={sec(5)} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TransitionsLab" component={TransitionsLab} durationInFrames={sec(TRANSITION_DEMO_SEC) * TRANSITION_TYPES.length} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
