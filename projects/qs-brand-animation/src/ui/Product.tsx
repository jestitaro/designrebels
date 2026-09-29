import React from 'react';
import { Img, staticFile } from 'remotion';
import { alpha, colors, radius, ui } from '../tokens';
import { PRODUCTS, ProductId, ProductMeta } from './products';

/** Escala por defecto: px de pantalla por cm real. Con 7 px/cm una lavandina de 25 cm mide 175 px. */
export const PX_PER_CM = 7;

const meta = (id: ProductId): ProductMeta => PRODUCTS[id];

/** Tamaño en pantalla respetando la altura real del producto (escala uniforme). */
export const productSize = (id: ProductId, pxPerCm = PX_PER_CM) => {
  const m = meta(id);
  const visibleH = m.bbox[3] - m.bbox[1];
  const s = (m.heightCm * pxPerCm) / visibleH;
  return { scale: s, width: (m.bbox[2] - m.bbox[0]) * s, height: m.heightCm * pxPerCm };
};

/**
 * Producto a escala real: una crema dental no mide lo mismo que una lavandina.
 * Se recorta al bounding box, así que (x, y) es la base centrada del producto (apoyado en el estante).
 */
export const Product: React.FC<{ id: ProductId; pxPerCm?: number; style?: React.CSSProperties }> = ({ id, pxPerCm = PX_PER_CM, style }) => {
  const m = meta(id);
  const { scale, width, height } = productSize(id, pxPerCm);
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', flexShrink: 0, ...style }}>
      <Img
        src={staticFile(m.file)}
        style={{ position: 'absolute', left: -m.bbox[0] * scale, top: -m.bbox[1] * scale, width: m.w * scale, height: m.h * scale, maxWidth: 'none' }}
      />
    </div>
  );
};

/** Miniatura para listas y formularios: el producto entra entero en una caja fija (no respeta escala real). */
export const ProductThumb: React.FC<{ id: ProductId; size?: number; framed?: boolean; style?: React.CSSProperties }> = ({ id, size = 40, framed = false, style }) => {
  const m = meta(id);
  const bw = m.bbox[2] - m.bbox[0];
  const bh = m.bbox[3] - m.bbox[1];
  const inner = framed ? size - 8 : size;
  const s = inner / Math.max(bw, bh);
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: framed ? radius.sm : 0,
        background: framed ? ui.background : 'transparent',
        ...style,
      }}
    >
      <Img
        src={staticFile(m.file)}
        style={{
          position: 'absolute',
          left: (size - bw * s) / 2 - m.bbox[0] * s,
          top: (size - bh * s) / 2 - m.bbox[1] * s,
          width: m.w * s,
          height: m.h * s,
          maxWidth: 'none',
        }}
      />
    </div>
  );
};

export type ShelfItem = { id: ProductId; facings?: number };

/**
 * Tramo de góndola: productos apoyados sobre un estante, a escala real y con frentes repetidos.
 * Devuelve también el rect de cada frente (para ubicar DetectionBox encima).
 */
export const shelfLayout = (items: ShelfItem[], pxPerCm = PX_PER_CM, gap = 6) => {
  let x = 0;
  const facings: { id: ProductId; x: number; width: number; height: number; group: number }[] = [];
  items.forEach((it, g) => {
    for (let k = 0; k < (it.facings ?? 1); k++) {
      const { width, height } = productSize(it.id, pxPerCm);
      facings.push({ id: it.id, x, width, height, group: g });
      x += width + gap;
    }
    x += gap * 2;
  });
  return { facings, width: x - gap * 3 };
};

export const Shelf: React.FC<{ items: ShelfItem[]; pxPerCm?: number; gap?: number; board?: boolean; style?: React.CSSProperties }> = ({ items, pxPerCm = PX_PER_CM, gap = 6, board = true, style }) => {
  const { facings, width } = shelfLayout(items, pxPerCm, gap);
  const tallest = Math.max(...facings.map((f) => f.height));
  return (
    <div style={{ position: 'relative', width, height: tallest + (board ? 14 : 0), ...style }}>
      {facings.map((f, i) => (
        <div key={i} style={{ position: 'absolute', left: f.x, bottom: board ? 14 : 0 }}>
          <Product id={f.id} pxPerCm={pxPerCm} />
        </div>
      ))}
      {board && (
        <div style={{ position: 'absolute', left: -16, right: -16, bottom: 0, height: 14, borderRadius: 3, background: `linear-gradient(180deg, ${colors.white} 0%, ${alpha(ui.text, 0.18)} 100%)`, boxShadow: `0 6px 12px ${alpha(colors.dark, 0.18)}` }} />
      )}
    </div>
  );
};
