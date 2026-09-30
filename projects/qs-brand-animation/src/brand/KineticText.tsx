import React from 'react';
import { type, TypeRole } from '../tokens';
import { stagger } from '../lib/easing';

type Props = {
  text: string;
  role?: Extract<TypeRole, 'headline' | 'tagline'>;
  color: string;
  /** 0→1 entrada por palabra (sube desde una máscara) */
  progressIn: number;
  /** 0→1 salida (sube y se desvanece) */
  progressOut?: number;
  align?: 'left' | 'center';
  style?: React.CSSProperties;
};

/**
 * Kinetic type: cada palabra entra desde abajo de una máscara, escalonada.
 * Solo para los textos permitidos del brief (sección 10).
 */
export const KineticText: React.FC<Props> = ({ text, role = 'headline', color, progressIn, progressOut = 0, align = 'left', style }) => {
  const words = text.split(' ');
  const t = type[role];
  return (
    <div style={{ ...t, color, display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: t.fontSize * 0.26, ...style }}>
      {words.map((w, i) => {
        const pi = stagger(progressIn, i, words.length, 0.55, 'settle');
        const po = stagger(progressOut, i, words.length, 0.7, 'easeIn');
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: t.fontSize * 0.12, marginBottom: -t.fontSize * 0.12 }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - pi) * 105 - po * 40}%)`, opacity: Math.min(pi * 1.6, 1) * (1 - po) }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};
