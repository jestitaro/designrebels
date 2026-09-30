import React from 'react';
import { Composition, Series } from 'remotion';
import './fonts';
import { FPS, HEIGHT, sec, WIDTH } from './lib/time';
import { Main, mainSchema } from './Main';
import { totalDurationInFrames } from './timeline';
import { SHOWCASE_PAGES } from './showcase/pages';
import { CameraLab, TransitionsLab, TRANSITION_DEMO_SEC, WalkLab } from './showcase/labs';
import { TRANSITION_TYPES } from './transitions/types';

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
    <Composition id="CameraLab" component={CameraLab} durationInFrames={sec(6)} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="WalkLab" component={WalkLab} durationInFrames={sec(5)} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TransitionsLab" component={TransitionsLab} durationInFrames={sec(TRANSITION_DEMO_SEC) * TRANSITION_TYPES.length} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
