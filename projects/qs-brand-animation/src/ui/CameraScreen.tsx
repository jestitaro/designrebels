import React from 'react';
import { alpha, app, colors, radius, type, ui } from '../tokens';
import { stagger, sub } from '../lib/easing';
import { PHONE } from '../devices/Phone';
import { STATUS_BAR_H } from '../devices/Phone';
import { DetectionBox, DetectionStatus, ScanLine } from './DetectionBox';
import { Icon } from './Icon';
import { Shelf, ShelfItem, shelfLayout } from './Product';
import { ProductId } from './products';

/**
 * Pantalla de reconocimiento de AiFred (cámara sobre la góndola).
 * Secuencia del brief: scanning → primera detección → cascada → precios → validación contra planograma.
 */
export type RecognitionStages = { scan: number; first: number; cascade: number; prices: number; validate: number };

const CAM_PXC = 4.9;
const TOP: ShelfItem[] = [
  { id: 'detergente-liquido-celeste', facings: 2 },
  { id: 'bidon-lavandina-amarillo', facings: 2 },
];
const BOTTOM: ShelfItem[] = [
  { id: 'shampoo-azul', facings: 2 },
  { id: 'dispensador-jabon-rosa', facings: 2 },
  { id: 'tubo-crema-celeste', facings: 2 },
];

type Det = { row: 0 | 1; group: number; label: string; conf: number; price?: string; final: DetectionStatus; place?: 'top' | 'bottom' };
/** orden de aparición = orden de la cascada; la primera es la "primera detección" */
export const DETECTIONS: Det[] = [
  { row: 0, group: 0, label: 'Jabón líquido ropa 3 L', conf: 0.97, price: '$8.890', final: 'valid' },
  { row: 0, group: 1, label: 'Lavandina 2 L', conf: 0.95, price: '$2.345', final: 'valid', place: 'bottom' },
  { row: 1, group: 0, label: 'Shampoo', conf: 0.93, price: '$3.690', final: 'valid' },
  { row: 1, group: 1, label: 'Jabón de manos', conf: 0.91, final: 'valid', place: 'bottom' },
  { row: 1, group: 2, label: 'Crema dental', conf: 0.88, final: 'missing' },
];

const ROWS = [
  { items: TOP, y: 270 },
  { items: BOTTOM, y: 480 },
];
const SHELF_X = 22;

const groupRect = (items: ShelfItem[], group: number) => {
  const { facings } = shelfLayout(items, CAM_PXC, 3);
  const fs = facings.filter((f) => f.group === group);
  const x0 = fs[0].x;
  const x1 = fs[fs.length - 1].x + fs[fs.length - 1].width;
  const h = Math.max(...fs.map((f) => f.height));
  return { x: x0 - 3, w: x1 - x0 + 6, h: h + 4 };
};

export const CameraScreen: React.FC<{ stages: RecognitionStages; category?: string }> = ({ stages, category = 'Góndola limpieza y cuidado' }) => {
  const validated = DETECTIONS.filter((_, i) => stages.validate * DETECTIONS.length > i + 0.5).length;
  return (
    <div style={{ width: PHONE.screenW, height: PHONE.screenH, position: 'relative', background: colors.textDark, overflow: 'hidden' }}>
      {/* feed de cámara: la góndola real, un poco más oscura */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${alpha(colors.white, 0.08)}, ${alpha(colors.dark, 0.2)})` }} />
      {ROWS.map((r, ri) => {
        const tall = Math.max(...shelfLayout(r.items, CAM_PXC, 3).facings.map((f) => f.height));
        return <Shelf key={ri} items={r.items} pxPerCm={CAM_PXC} gap={3} style={{ position: 'absolute', left: SHELF_X, top: r.y - tall }} />;
      })}
      <div style={{ position: 'absolute', inset: 0, background: alpha(colors.dark, 0.18) }} />

      {stages.scan > 0 && stages.scan < 1 && <ScanLine width={PHONE.screenW} height={600} progress={stages.scan} />}

      {DETECTIONS.map((d, i) => {
        const row = ROWS[d.row];
        const tall = Math.max(...shelfLayout(row.items, CAM_PXC, 3).facings.map((f) => f.height));
        const r = groupRect(row.items, d.group);
        const p = i === 0 ? stages.first : stagger(stages.cascade, i - 1, DETECTIONS.length - 1, 0.5);
        const checked = stages.validate * DETECTIONS.length > i + 0.5;
        const status: DetectionStatus = checked ? d.final : 'detected';
        const priceOn = d.price && stages.prices > (i / DETECTIONS.length) * 0.8;
        return (
          <div key={i} style={{ position: 'absolute', left: SHELF_X + r.x, top: row.y - tall + (tall - r.h) + 2 }}>
            <DetectionBox width={r.w} height={r.h} label={d.label} confidence={d.conf} status={status} price={priceOn ? d.price : undefined} labelPlacement={d.place} progress={p} />
          </div>
        );
      })}

      {/* header de la cámara */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, paddingTop: STATUS_BAR_H, background: `linear-gradient(180deg, ${alpha(colors.dark, 0.85)}, ${alpha(colors.dark, 0)})` }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, color: colors.white }}>
          <Icon name="sparkle" size={18} color={colors.white} strokeWidth={2} />
          <span style={{ ...type.uiTitle, fontSize: 16, flex: 1 }}>{category}</span>
          <Icon name="x" size={20} color={colors.white} strokeWidth={2} />
        </div>
      </div>

      {/* progreso de validación contra planograma */}
      <div style={{ position: 'absolute', left: 16, right: 16, top: 560, display: 'flex', flexDirection: 'column', gap: 10, opacity: sub(stages.validate, 0, 0.2) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: radius.md, background: alpha(colors.white, 0.94), ...type.uiCaption, color: ui.text }}>
          <Icon name="grid" size={16} color={app.focus} strokeWidth={2} />
          <span style={{ fontWeight: 600 }}>Planograma</span>
          <span style={{ color: ui.textSecondary }}>{validated} de {DETECTIONS.length} validados</span>
          <span style={{ marginLeft: 'auto', width: 64, height: 6, borderRadius: 3, background: ui.border, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${(validated / DETECTIONS.length) * 100}%`, background: ui.check }} />
          </span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 624, height: 48, borderRadius: radius.sm, background: app.action, display: 'grid', placeItems: 'center', ...type.uiBodyStrong, color: colors.white, boxShadow: `0 6px 16px ${alpha(app.action, 0.45)}` }}>
        Finalizar reconocimiento
      </div>
    </div>
  );
};

export const recognizedProducts = (): { id: ProductId; label: string }[] => [
  { id: 'detergente-liquido-celeste', label: 'Jabón líquido ropa 3 L' },
  { id: 'bidon-lavandina-amarillo', label: 'Lavandina 2 L' },
  { id: 'shampoo-azul', label: 'Shampoo 400 ml' },
  { id: 'dispensador-jabon-rosa', label: 'Jabón de manos 300 ml' },
];
