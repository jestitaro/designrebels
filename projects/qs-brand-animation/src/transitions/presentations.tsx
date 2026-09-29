import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import { MaskReveal } from './MaskReveal';

/**
 * Presentación para <TransitionSeries> de @remotion/transitions.
 * Solo se usa donde el corte es entre escenas separadas; la mayoría de las transiciones se resuelve con la cámara.
 */
type MaskRevealProps = { x?: number; y?: number; shape?: 'circle' | 'blob' | 'roundedRect' };

const MaskRevealPresentation: React.FC<TransitionPresentationComponentProps<MaskRevealProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) =>
  presentationDirection === 'entering' ? (
    <MaskReveal progress={presentationProgress} {...passedProps}>
      {children}
    </MaskReveal>
  ) : (
    <AbsoluteFill>{children}</AbsoluteFill>
  );

export const maskReveal = (props: MaskRevealProps = {}): TransitionPresentation<MaskRevealProps> => ({
  component: MaskRevealPresentation,
  props,
});
