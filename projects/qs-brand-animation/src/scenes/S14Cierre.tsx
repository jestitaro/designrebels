import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { GradientBackground } from '../shapes/GradientBackground';
import { MaskReveal } from '../transitions/MaskReveal';
import { IsoTriangles } from '../brand/IsoTriangles';
import { KineticText } from '../brand/KineticText';
import { lerp, progressAt } from '../lib/easing';
import { colors, springs } from '../tokens';

/**
 * Escena 14 · Cierre (4 s). Primero el isotipo (viene armado de la escena 13), después el wordmark.
 * El lockup se arma con los SVG oficiales separados y termina idéntico a logo-qs-fullcolor.svg:
 * isotipo en (10, 10)–(230.6, 238) y wordmark en x = 273, sobre un lienzo de 1313 × 248.
 */
export const S14_DURATION = 4;

const LOCKUP = { w: 1313, h: 248, isoX: 10, isoY: 10, isoW: 220.6, wordX: 273 };
/** del viewBox del isotipo (565) al lockup: el contenido visible del iso va de 22.6 a 525.5 */
const ISO_K = LOCKUP.isoW / (525.5 - 22.6);

export const S14Cierre: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const H = 150;
  const u = H / LOCKUP.h;
  const lockW = LOCKUP.w * u;
  const lx = 960 - lockW / 2;
  const ly = 330;
  // isotipo final dentro del lockup
  const isoSize = 565 * ISO_K * u;
  const isoLeft = lx + (LOCKUP.isoX - 22.6 * ISO_K) * u;
  const isoTop = ly + (LOCKUP.isoY - 22.6 * ISO_K) * u;
  // arranca centrado y más grande, se corre a su lugar
  const move = spring({ frame: frame - Math.round(0.5 * fps), fps, config: springs.firm });
  const startScale = 1.35;
  const cx = lerp(960, isoLeft + isoSize / 2, move);
  const cy = lerp(540, isoTop + isoSize / 2, move);
  const sc = lerp(startScale, 1, move);
  const pop = progressAt(frame, 0, 0.4, 'softOvershoot', fps);
  // wordmark: revelado lateral detrás del isotipo
  const reveal = progressAt(frame, 0.65, 0.6, 'easeInOut', fps);
  // entrada: mask reveal desde el centro sobre el final de la escena 13 (overlap 0.5 s)
  const reveal0 = progressAt(frame, 0, 0.5, 'easeInOut', fps);
  return (
    <MaskReveal progress={reveal0} shape="blob" seed="s14-mask">
      <GradientBackground arc="closing" seed="s14" />
      <div style={{ position: 'absolute', left: lx + LOCKUP.wordX * u, top: ly, height: H, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`, transform: `translateX(${(1 - reveal) * -24}px)` }}>
        <Img src={staticFile('logos/tipo-qs-bg-light.svg')} style={{ height: H, width: 'auto', display: 'block' }} />
      </div>
      <div style={{ position: 'absolute', left: cx - (isoSize * sc) / 2, top: cy - (isoSize * sc) / 2, opacity: interpolate(pop, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }) }}>
        <IsoTriangles size={isoSize * sc * (0.96 + 0.04 * pop)} />
      </div>
      <div style={{ position: 'absolute', left: lx + LOCKUP.wordX * u + 4, top: ly + H + 10 }}>
        <KineticText text="Trade Marketing" role="tagline" color={colors.primary} progressIn={progressAt(frame, 1.0, 0.7, 'settle', fps)} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 690 }}>
        <KineticText text="Llevá tu negocio al futuro." role="tagline" color={colors.dark} align="center" progressIn={progressAt(frame, 1.8, 0.8, 'settle', fps)} />
      </div>
    </MaskReveal>
  );
};
