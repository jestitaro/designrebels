import React from 'react';
import { Img } from 'remotion';
import { LOGO_FILES, LogoKey, logoSrc } from '../assets';
import { AssetPlaceholder } from './AssetPlaceholder';

/** Proporciones de reserva hasta tener los SVG (se ajustan al recibirlos). */
const RESERVED_RATIO: Record<LogoKey, number> = {
  iso: 1,
  fullColor: 4,
  wordmarkLight: 3.2,
};

const LABELS: Record<LogoKey, string> = {
  iso: 'Isotipo QS',
  fullColor: 'Logo QuartzSales',
  wordmarkLight: 'Wordmark QuartzSales',
};

type Props = {
  variant?: LogoKey;
  height: number;
  tone?: 'light' | 'dark';
  style?: React.CSSProperties;
};

/**
 * Logo oficial desde /public/logos. Si el archivo todavía no está, muestra un placeholder rotulado.
 * Nunca se redibuja el logo. Para la escena 13 el isotipo se va a separar en paths desde el SVG oficial.
 */
export const Logo: React.FC<Props> = ({ variant = 'fullColor', height, tone = 'light', style }) => {
  const src = logoSrc(variant);
  if (src) return <Img src={src} style={{ height, width: 'auto', display: 'block', ...style }} />;
  return <AssetPlaceholder width={height * RESERVED_RATIO[variant]} height={height} label={LABELS[variant]} file={LOGO_FILES[variant]} tone={tone} style={style} />;
};
