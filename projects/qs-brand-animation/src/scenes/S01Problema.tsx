import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, CameraKeyframe, DepthBlur, DepthLayer, Place } from '../camera';
import { GradientBackground } from '../shapes/GradientBackground';
import { Character } from '../characters/Character';
import { ObjectWipe } from '../transitions/ObjectWipe';
import { drift, progressAt } from '../lib/easing';
import { randSigned } from '../lib/random';
import { Badge, CategoryAccordion, ChartCard, ChatBubble, FormField, GaugeCard, KPI, ListRow, MapCard, PDVS, SyncIndicator, Toast, Card } from '../ui';

/**
 * Escena 1 · Problema (4.5 s). Caro chica en una composición amplia; la UI de su día se acumula en profundidad.
 * La sobrecarga solo crece: Caro queda en `estres` toda la escena y las cards entran cada vez más seguido.
 */
export const S01_DURATION = 4.5;

const KEYS: CameraKeyframe[] = [
  { t: 0, x: 960, y: 560, zoom: 0.9 },
  { t: 3.2, x: 1010, y: 540, zoom: 1.15, ease: 'easeInOut' },
  { t: 4.5, x: 1020, y: 540, zoom: 1.18 },
];

type Item = { id: string; depth: 'bg' | 'mg' | 'fg'; x: number; y: number; at: number; scale?: number; el: (p: number) => React.ReactNode };

/** Tiempos de entrada que se aprietan hacia el final: la sobrecarga acelera. */
const ITEMS: Item[] = [
  // fondo (con blur de profundidad)
  { id: 'bg-row', depth: 'bg', x: 1380, y: 170, at: 0.3, scale: 0.8, el: (p) => <ListRow title={PDVS[3].name} address={PDVS[3].address} time={PDVS[3].time} status="scheduled" progress={p} style={{ width: 358 }} /> },
  { id: 'bg-map', depth: 'bg', x: 300, y: 210, at: 0.8, scale: 0.7, el: (p) => <MapCard progress={p} /> },
  { id: 'bg-kpi', depth: 'bg', x: 1720, y: 600, at: 1.4, scale: 0.85, el: (p) => <KPI label="Visitas pendientes" value={9} icon="calendar" progress={p} /> },
  { id: 'bg-acc', depth: 'bg', x: 250, y: 610, at: 2.0, scale: 0.8, el: (p) => <CategoryAccordion title="Precios sin cargar" progress={p} style={{ width: 300 }} /> },
  { id: 'bg-row2', depth: 'bg', x: 930, y: 110, at: 2.5, scale: 0.75, el: (p) => <ListRow title={PDVS[2].name} address={PDVS[2].address} status="warning" progress={p} style={{ width: 358 }} /> },
  { id: 'bg-toast', depth: 'bg', x: 1560, y: 960, at: 2.9, scale: 0.8, el: (p) => <Toast variant="info" title="4 mensajes sin leer" message="Supervisión · Zona Oeste" progress={p} /> },
  // plano medio: alrededor de Caro
  { id: 'mg-quiebre', depth: 'mg', x: 930, y: 420, at: 0.6, el: (p) => <Toast variant="danger" title="Quiebre de stock" message="Jabón líquido ropa 3 L · 0 frentes" progress={p} /> },
  { id: 'mg-gauge', depth: 'mg', x: 1210, y: 720, at: 1.2, el: (p) => <GaugeCard label="OSA" value={42} target={100} width={132} progress={p} /> },
  { id: 'mg-row', depth: 'mg', x: 1380, y: 460, at: 1.7, el: (p) => <ListRow index={5} title={PDVS[4].name} address={PDVS[4].address} time={PDVS[4].time} status="warning" progress={p} style={{ width: 358 }} /> },
  { id: 'mg-sync', depth: 'mg', x: 830, y: 290, at: 2.2, el: (p) => <SyncIndicator state="pending" count={7} progress={p} style={{ background: '#FFFFFF', boxShadow: '0 8px 24px rgba(19, 13, 93, 0.3)' }} /> },
  { id: 'mg-chat', depth: 'mg', x: 420, y: 400, at: 2.55, el: (p) => <ChatBubble text="¿Pasaste por San Martín? Faltan las fotos." author="Lucía Ferreyra" time="09:41" progress={p} /> },
  { id: 'mg-badge', depth: 'mg', x: 820, y: 930, at: 2.85, el: (p) => <Badge label="12 tareas vencidas" variant="danger" progress={p} style={{ fontSize: 14, padding: '6px 12px', background: '#FFFFFF', boxShadow: '0 8px 24px rgba(19, 13, 93, 0.3)' }} /> },
  { id: 'mg-form', depth: 'mg', x: 1020, y: 610, at: 3.1, el: (p) => (
      <Card progress={p} width={300}>
        <FormField label="Precio en góndola" placeholder="Sin cargar" progress={1} focused />
      </Card>
    ) },
  { id: 'mg-chat2', depth: 'mg', x: 400, y: 250, at: 3.3, el: (p) => <ChatBubble text="¿Me pasás el relevamiento?" author="Martín Sosa" time="09:43" progress={p} /> },
  // primer plano: pasan cerca de cámara
  { id: 'fg-alerts', depth: 'fg', x: 1620, y: 250, at: 1.0, scale: 1.1, el: (p) => <KPI label="Alertas" value={12} icon="alert" delta="+5" trend="up" positiveIsDown elevation="float" progress={p} /> },
  { id: 'fg-pdv', depth: 'fg', x: 1500, y: 860, at: 2.0, scale: 1.1, el: (p) => <Toast variant="warning" title="3 PDV sin visitar" message="Ruta desactualizada" progress={p} /> },
];

export const S01Problema: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wipe = progressAt(frame, 3.6, 0.9, 'easeInOut', fps);
  const layer = (depth: Item['depth']) =>
    ITEMS.filter((it) => it.depth === depth).map((it, i) => {
      const p = progressAt(frame, it.at, 0.5, 'softOvershoot', fps);
      if (p <= 0) return null;
      return (
        <Place key={it.id} x={it.x + drift(frame, 5, 5 + i, i)} y={it.y + drift(frame, 7, 6 + i, i * 1.7)} rotate={randSigned(`s01-${it.id}`, 5)} scale={it.scale ?? 1}>
          {it.el(p)}
        </Place>
      );
    });
  return (
    <AbsoluteFill>
      <Camera keyframes={KEYS}>
        <DepthLayer depth="sky">
          <GradientBackground arc="problem" seed="s01" />
        </DepthLayer>
        <DepthLayer depth="bg">
          <DepthBlur amount={3}>{layer('bg')}</DepthBlur>
        </DepthLayer>
        <DepthLayer depth="mg">
          <Character who="caro" pose="estres" height={300} x={600} y={860} phase={0.4} />
          {layer('mg')}
        </DepthLayer>
        <DepthLayer depth="fg">{layer('fg')}</DepthLayer>
      </Camera>
      {wipe > 0 && (
        <ObjectWipe progress={wipe} width={358} height={250} fromX={1320} fromY={330} fromRotate={-7}>
          <ChartCard variant="bars" width={358} elevation="float" style={{ height: 250 }} />
        </ObjectWipe>
      )}
    </AbsoluteFill>
  );
};
