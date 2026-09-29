import React from 'react';
import { alpha, colors, radius, type, ui } from '../tokens';
import { enterStyle, stagger, sub } from '../lib/easing';
import { Icon } from './Icon';
import { ProductThumb } from './Product';
import { formatARS, Sku } from './data';
import { ProductId } from './products';

/** Etiqueta de precio con código de barras (como en precios.svg). */
export const PriceTag: React.FC<{ price: number; progress?: number; highlight?: boolean; style?: React.CSSProperties }> = ({ price, progress = 1, highlight, style }) => (
  <div
    style={{
      width: 88,
      boxSizing: 'border-box',
      padding: '5px 8px 4px',
      borderRadius: 6,
      background: colors.white,
      border: `1.5px solid ${highlight ? ui.focus : ui.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      opacity: sub(progress, 0, 0.4),
      ...style,
    }}
  >
    <svg width="64" height="12" viewBox="0 0 64 12">
      {Array.from({ length: 26 }, (_, i) => (
        <rect key={i} x={i * 2.45} y="0" width={i % 3 === 0 ? 1.6 : 0.8} height="12" fill={ui.text} />
      ))}
    </svg>
    <span style={{ ...type.uiCaption, fontWeight: 700, color: ui.text, fontVariantNumeric: 'tabular-nums' }}>{formatARS(price).replace(',00', '')}</span>
  </div>
);

type Props = {
  title: string;
  items?: readonly Sku[];
  open?: boolean;
  /** categoría completa: check verde en el header */
  done?: boolean;
  /** 0→1: entrada del header y de las filas */
  progress?: number;
  /** índice de fila con foco (campo activo) */
  activeRow?: number;
  showPrices?: boolean;
  style?: React.CSSProperties;
};

/** Acordeón de categoría del formulario (Categoría.svg / precios.svg): productos con miniatura, EAN y precio. */
export const CategoryAccordion: React.FC<Props> = ({ title, items = [], open = false, done = false, progress = 1, activeRow, showPrices = true, style }) => {
  const rowsP = sub(progress, 0.25, 1);
  return (
    <div
      style={{
        background: ui.surface,
        borderRadius: radius.md,
        border: `1.5px solid ${open ? ui.focus : ui.border}`,
        boxShadow: open ? `0 0 0 3px ${alpha(ui.focus, 0.1)}` : undefined,
        overflow: 'hidden',
        ...enterStyle(sub(progress, 0, 0.3), 10),
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
        <span style={{ ...type.uiBody, fontSize: 15, color: ui.text, flex: 1 }}>{title}</span>
        {done && (
          <span style={{ width: 20, height: 20, borderRadius: 10, background: ui.check, display: 'grid', placeItems: 'center' }}>
            <Icon name="check" size={13} color={colors.white} strokeWidth={3} />
          </span>
        )}
        <Icon name="chevronDown" size={18} color={ui.textSecondary} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </div>
      {open &&
        items.map((sku, i) => (
          <div
            key={sku.ean}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '0 16px',
              padding: '10px 0',
              borderTop: `1px solid ${ui.border}`,
              ...enterStyle(stagger(rowsP, i, items.length, 0.5), 8),
            }}
          >
            <ProductThumb id={sku.product as ProductId} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...type.uiCaption, fontWeight: 400, color: ui.textMuted, fontVariantNumeric: 'tabular-nums' }}>{sku.ean}</div>
              <div style={{ ...type.uiBody, color: ui.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sku.name}</div>
            </div>
            {showPrices && <PriceTag price={sku.price} highlight={activeRow === i} progress={stagger(rowsP, i, items.length, 0.5)} />}
          </div>
        ))}
    </div>
  );
};
