/** Familia cerrada de transiciones. No se agregan otras. */
export const TRANSITION_TYPES = ['zoomThrough', 'objectWipe', 'matchCut', 'maskReveal', 'shapeMorph', 'pushInOut'] as const;
export type TransitionType = (typeof TRANSITION_TYPES)[number];

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  zoomThrough: 'Zoom through',
  objectWipe: 'Object wipe',
  matchCut: 'Match cut',
  maskReveal: 'Mask reveal',
  shapeMorph: 'Shape morph',
  pushInOut: 'Push-in / push-out',
};

export const TRANSITION_NOTES: Record<TransitionType, string> = {
  zoomThrough: 'La cámara escala sobre la pantalla hasta llenar el frame; la escena siguiente arranca con esa UI a escala 1.',
  objectWipe: 'Un elemento pasa delante de cámara y cubre el frame; ese elemento es la escena siguiente.',
  matchCut: 'Corte seco entre dos planos con el mismo elemento en la misma posición y escala.',
  maskReveal: 'La escena siguiente se revela a través de una máscara que crece desde un punto.',
  shapeMorph: 'Una forma se transforma en otra (mensaje → form, gráfico → góndola, módulos → isotipo).',
  pushInOut: 'Acercamiento o alejamiento de cámara continuo que cambia el protagonista del plano.',
};
