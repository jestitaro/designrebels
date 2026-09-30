import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { alpha, app, colors, gradients, radius, shadows, spacing, type, ui } from '../tokens';
import { progressFrames, stagger } from '../lib/easing';
import { MIN_LEGIBLE_PX } from '../tokens';
import {
  AppHeader,
  Badge,
  BottomNavigation,
  Button,
  Card,
  ChartCard,
  ChatBubble,
  ChatScreen,
  CountBadge,
  DetectionBox,
  FormField,
  FormScreen,
  KPI,
  KPIS,
  ListRow,
  MapCard,
  MESSAGES,
  OfflineScreen,
  PricesScreen,
  GaugeCard,
  GaugeTile,
  IndicatorCard,
  CategoryAccordion,
  Shelf,
  shelfLayout,
  ShelfItem,
  skusOf,
  PDVS,
  ProgressBar,
  ScanLine,
  SKUS,
  SyncIndicator,
  Toast,
  VisitsScreen,
  formatARS,
} from '../ui';
import { Phone } from '../devices/Phone';
import { Logo } from '../brand/Logo';
import { Character, listPoses } from '../characters/Character';
import { IsoTriangles, triangleCenter } from '../brand/IsoTriangles';
import { GradientBackground } from '../shapes/GradientBackground';
import { Board, Col, Row, Section } from './Board';

/** Progreso de entrada de la lámina: todo entra en 1,6 s escalonado, después queda quieto para el still. */
const usePageProgress = (i: number, n: number) => {
  const frame = useCurrentFrame();
  return stagger(progressFrames(frame, 4, 48, 'easeInOut'), i, n, 0.7);
};

/* ───────────── 1 · Fundamentos ───────────── */

type Swatch = { name: string; value: string; onDark?: boolean };
const swatchGroups: { label: string; items: Swatch[] }[] = [
  {
    label: 'Marca · fondos, isotipo, kinetic type',
    items: [
      { name: 'primary', value: colors.primary, onDark: true },
      { name: 'secondary', value: colors.secondary, onDark: true },
      { name: 'dark', value: colors.dark, onDark: true },
      { name: 'gradStart', value: colors.gradStart, onDark: true },
      { name: 'cyan', value: colors.cyan },
      { name: 'light', value: colors.light },
    ],
  },
  {
    label: 'App PSMob · UI de producto',
    items: [
      { name: 'header', value: app.header, onDark: true },
      { name: 'action', value: app.action, onDark: true },
      { name: 'focus', value: app.focus, onDark: true },
      { name: 'indicatorCard', value: app.indicatorCard, onDark: true },
      { name: 'check', value: app.check, onDark: true },
      { name: 'badge', value: app.badge, onDark: true },
    ],
  },
  {
    label: 'Texto · niveles de lectura y superficies',
    items: [
      { name: 'textPrimary', value: app.textPrimary, onDark: true },
      { name: 'textSecondary', value: app.textSecondary, onDark: true },
      { name: 'textTertiary', value: app.textTertiary },
      { name: 'border', value: app.border },
      { name: 'background', value: app.background },
      { name: 'white', value: colors.white },
    ],
  },
  {
    label: 'Semáforo',
    items: [
      { name: 'success', value: colors.success },
      { name: 'warning', value: colors.warning },
      { name: 'danger', value: colors.danger },
    ],
  },
];


const typeSpecimens: { role: keyof typeof type; sample: string; spec: string }[] = [
  { role: 'headline', sample: 'Información en tiempo real', spec: 'Nunito 96 / 800' },
  { role: 'tagline', sample: 'Llevá tu negocio al futuro.', spec: 'Nunito 48 / 700' },
  { role: 'uiTitle', sample: 'Relevamiento góndola', spec: 'DM Sans 18 / 600 · UI título' },
  { role: 'uiBodyStrong', sample: 'SUPERMERCADO SAN MARTÍN', spec: 'DM Sans 14 / 600 · pendiente' },
  { role: 'uiBody', sample: 'Hoy priorizá la góndola de limpieza.', spec: 'DM Sans 14 / 400 · UI body' },
  { role: 'uiCaption', sample: 'Programada · 10:15 – 11:00', spec: 'DM Sans 12 / 500 · caption' },
  { role: 'kpi', sample: '94 %', spec: 'DM Sans 32 / 700 · KPI' },
];

export const PageFoundations: React.FC = () => {
  const p = (i: number) => usePageProgress(i, 4);
  const brandRoles = typeSpecimens.filter((t) => t.role === 'headline' || t.role === 'tagline');
  const uiRoles = typeSpecimens.filter((t) => t.role !== 'headline' && t.role !== 'tagline');
  return (
    <Board title="Fundamentos" page="1/8" zoom={1}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, height: '100%' }}>
        <Section label="Tipografía de marca · Nunito · tamaño real">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: p(0) }}>
            {brandRoles.map((t) => (
              <div key={t.role} style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
                <div style={{ width: 170, flexShrink: 0, ...type.uiCaption, fontSize: 16, color: ui.textSecondary }}>{t.spec}</div>
                <div style={{ ...type[t.role], color: t.role === 'headline' ? ui.text : colors.primary, whiteSpace: 'nowrap' }}>{t.sample}</div>
              </div>
            ))}
          </div>
        </Section>
        <div style={{ display: 'flex', gap: 56 }}>
          <div style={{ width: 700, display: 'flex', flexDirection: 'column', gap: 24, opacity: p(1) }}>
            <Section label="Tipografía de UI · DM Sans · al 1,5× (escala 1 del teléfono entre paréntesis)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {uiRoles.map((t) => (
                  <div key={t.role} style={{ display: 'flex', alignItems: 'baseline', gap: 20, borderBottom: `1px solid ${ui.divider}`, paddingBottom: 10 }}>
                    <div style={{ width: 170, flexShrink: 0, ...type.uiCaption, fontSize: 15, color: ui.textSecondary }}>{t.spec}</div>
                    <div style={{ ...type[t.role], color: ui.text, whiteSpace: 'nowrap', fontSize: type[t.role].fontSize * 1.5 }}>{t.sample}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...type.uiBody, fontSize: 16, color: ui.textSecondary }}>
                Regla de legibilidad: {MIN_LEGIBLE_PX} px efectivos mínimo (tamaño × zoom de cámara × escala del device).
              </div>
            </Section>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Section label="Paleta">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: p(2) }}>
                {swatchGroups.map((g) => (
                  <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 130, flexShrink: 0, ...type.uiCaption, fontSize: 13, color: ui.textSecondary }}>{g.label}</div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                      {g.items.map((sw) => (
                        <div key={sw.name} style={{ height: 58, borderRadius: radius.sm, background: sw.value, border: `1px solid ${ui.border}`, padding: '6px 8px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: sw.onDark ? colors.white : ui.text }}>
                          <div style={{ ...type.uiCaption, fontSize: 12, fontWeight: 600 }}>{sw.name}</div>
                          <div style={{ ...type.uiCaption, fontSize: 11, opacity: 0.85 }}>{sw.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section label="Gradientes · solo isotipo y fondos">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, opacity: p(2) }}>
                {[
                  ['brand', gradients.brand, true],
                  ['problema', gradients.problem, true],
                  ['solución', gradients.solution, false],
                ].map(([n, g, dark]) => (
                  <div key={n as string} style={{ height: 70, borderRadius: radius.md, background: g as string, padding: 12, boxSizing: 'border-box', display: 'flex', alignItems: 'flex-end', ...type.uiCaption, fontSize: 13, color: dark ? colors.white : ui.text }}>
                    {n as string}
                  </div>
                ))}
              </div>
            </Section>
            <div style={{ display: 'flex', gap: 40, opacity: p(3) }}>
              <Section label="Spacing">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                  {spacing.map((s) => (
                    <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: s * 1.5, height: s * 1.5, background: colors.secondary, borderRadius: 2 }} />
                      <span style={{ ...type.uiCaption, fontSize: 13, color: ui.textSecondary }}>{s}</span>
                    </div>
                  ))}
                </div>
              </Section>
              <Section label="Radius">
                <div style={{ display: 'flex', gap: 12 }}>
                  {Object.entries(radius).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 52, height: 52, background: ui.surface, border: `2px solid ${colors.primary}`, borderRadius: Math.min(v, 26) }} />
                      <span style={{ ...type.uiCaption, fontSize: 13, color: ui.textSecondary }}>
                        {k} {v}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
              <Section label="Sombras">
                <div style={{ display: 'flex', gap: 16 }}>
                  {Object.entries(shadows).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 52, height: 52, background: k === 'fab' ? app.action : ui.surface, borderRadius: radius.md, boxShadow: v }} />
                      <span style={{ ...type.uiCaption, fontSize: 13, color: ui.textSecondary }}>{k}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </Board>
  );
};

/* ───────────── 2 · Navegación, listas y datos ───────────── */

export const PageNavigation: React.FC = () => {
  const p = (i: number) => usePageProgress(i, 6);
  return (
    <Board title="Navegación, listas y datos" page="2/8">
      <div style={{ display: 'flex', gap: 28 }}>
        <Col>
          <Section label="AppHeader">
            <div style={{ borderRadius: radius.md, overflow: 'hidden', boxShadow: shadows.card }}>
              <AppHeader title="Visitas" subtitle="Martes 29/09 · 5 PDV" statusBar={false} actions={[{ icon: 'filter' }, { icon: 'bell', count: 4 }]} progress={p(0)}>
                <Badge label="Hoy" dot={false} style={{ background: colors.white, color: colors.primary }} />
                <Badge label="Semana" dot={false} style={{ background: alpha(colors.white, 0.16), color: colors.white }} />
                <SyncIndicator state="online" onPrimary />
              </AppHeader>
            </div>
          </Section>
          <Section label="BottomNavigation">
            <div style={{ borderRadius: radius.md, overflow: 'hidden', boxShadow: shadows.card }}>
              <BottomNavigation progress={p(0)} style={{ paddingBottom: 0, height: 64 }} />
            </div>
          </Section>
          <Section label="ListRow">
            {PDVS.slice(0, 3).map((pdv, i) => (
              <ListRow key={pdv.id} index={i + 1} title={pdv.name} address={pdv.address} time={pdv.time} status={pdv.status} highlighted={i === 1} progress={stagger(p(1), i, 3)} />
            ))}
          </Section>
        </Col>
        <Col>
          <Section label="KPI">
            <Row gap={12}>
              <KPI {...KPIS.osa} icon="chart" progress={p(2)} width={189} />
              <KPI {...KPIS.visits} icon="calendar" progress={p(2)} width={189} />
            </Row>
            <Row gap={12}>
              <KPI {...KPIS.alerts} icon="alert" trend="down" positiveIsDown progress={p(2)} width={189} />
              <KPI {...KPIS.compliance} icon="clipboard" progress={p(2)} width={189} />
            </Row>
          </Section>
          <Section label="Card · ProgressBar">
            <Card progress={p(3)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ProgressBar label="Ruta del día" value={0.4} progress={p(3)} />
              <ProgressBar label="Formulario" value={1} progress={p(3)} />
            </Card>
          </Section>
        </Col>
        <Col>
          <Section label="Button">
            <Button label="Iniciar visita" icon="pin" fullWidth progress={p(4)} />
            <Row gap={8}>
              <Button label="Pausar" variant="secondary" progress={p(4)} style={{ flex: 1 }} />
              <Button label="Eliminar" variant="danger" progress={p(4)} style={{ flex: 1 }} />
            </Row>
            <Row gap={8}>
              <Button label="Tap" press={0.6} progress={p(4)} style={{ flex: 1 }} />
              <Button label="Enviado" done progress={p(4)} style={{ flex: 1 }} />
              <Button label="Ver más" variant="ghost" progress={p(4)} style={{ flex: 1 }} />
            </Row>
          </Section>
          <Section label="Badge">
            <Row gap={8} wrap>
              <Badge label="Visita activa" variant="active" progress={p(5)} />
              <Badge label="Programada" variant="scheduled" progress={p(5)} />
              <Badge label="Completada" variant="done" progress={p(5)} />
              <Badge label="Ruteo manual" variant="warning" progress={p(5)} />
              <Badge label="Quiebre de stock" variant="danger" progress={p(5)} />
              <Badge label="Limpieza" variant="category" dot={false} progress={p(5)} />
              <Badge label="Nuevo planograma" variant="info" progress={p(5)} />
              <Badge label="IA" variant="category" icon="sparkle" progress={p(5)} />
              <CountBadge count={12} progress={p(5)} />
            </Row>
          </Section>
        </Col>
      </div>
    </Board>
  );
};

/* ───────────── 3 · Formularios, chat y estados ───────────── */

export const PageForms: React.FC = () => {
  const p = (i: number) => usePageProgress(i, 5);
  return (
    <Board title="Formularios, chat y estados" page="3/8">
      <div style={{ display: 'flex', gap: 28 }}>
        <Col>
          <Section label="FormField">
            <Card progress={p(0)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="Precio en góndola" value={formatARS(SKUS[0].price)} focused progress={p(0)} />
              <FormField label="Frentes" value="6" suffix="unidades" progress={p(0)} />
              <FormField label="Motivo de quiebre" kind="select" value="Sin stock en depósito" progress={p(0)} />
              <FormField label="Exhibición secundaria" kind="check" checked progress={p(0)} />
              <FormField label="Foto del exhibidor" kind="photo" checked={false} progress={p(0)} />
            </Card>
          </Section>
        </Col>
        <Col>
          <Section label="ChatBubble">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: radius.md, background: alpha(colors.secondary, 0.08) }}>
              {MESSAGES.map((m, i) => (
                <ChatBubble key={i} text={m.text} side={m.side} author={i === 0 ? m.from : undefined} time={m.time} progress={stagger(p(1), i, 4)} />
              ))}
              <ChatBubble text="" typing progress={stagger(p(1), 3, 4)} />
            </div>
          </Section>
        </Col>
        <Col>
          <Section label="Toast">
            <Toast title="Visita finalizada" message="Supermercado San Martín · 42 min" progress={p(2)} width={390} />
            <Toast variant="info" title="Nuevo mensaje" message="Lucía: revisá precios del frente de caja" progress={p(2)} width={390} />
            <Toast variant="warning" title="Quiebre detectado" message="Crema dental 90 g · 0 frentes" progress={p(2)} width={390} />
            <Toast variant="offline" title="Sin conexión" message="Seguís trabajando, guardamos todo" progress={p(2)} width={390} />
          </Section>
          <Section label="SyncIndicator · offline">
            <Row gap={8} wrap>
              <SyncIndicator state="offline" count={3} progress={p(3)} />
              <SyncIndicator state="saved" progress={p(3)} />
              <SyncIndicator state="pending" count={3} progress={p(3)} />
              <SyncIndicator state="syncing" syncProgress={0.6} progress={p(3)} />
              <SyncIndicator state="synced" progress={p(3)} />
              <SyncIndicator state="online" progress={p(3)} />
            </Row>
          </Section>
        </Col>
      </div>
    </Board>
  );
};

/* ───────────── 4 · Indicadores y gráficos ───────────── */

export const PageData: React.FC = () => {
  const p = (i: number) => usePageProgress(i, 5);
  return (
    <Board title="Indicadores y gráficos" page="4/8">
      <div style={{ display: 'flex', gap: 28 }}>
        <Col>
          <Section label="GaugeCard · fondo claro">
            <Row gap={12}>
              <GaugeCard label="OSA" value={91} target={85} progress={p(0)} width={122} />
              <GaugeCard label="Exhibición" value={65} target={85} status="neutral" progress={p(0)} width={122} />
              <GaugeCard label="Ef. Horas" value={79} target={85} progress={p(0)} width={122} />
            </Row>
          </Section>
          <Section label="IndicatorCard · home">
            <IndicatorCard width={390} progress={p(1)} />
          </Section>
        </Col>
        <Col>
          <Section label="GaugeTile · sobre header">
            <div style={{ padding: 16, borderRadius: radius.lg, background: app.header, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <GaugeTile label="OSA" value={64} target={85} progress={p(2)} width={171} />
              <GaugeTile label="Exhibición" value={64} status="neutral" progress={p(2)} width={171} />
              <GaugeTile label="Formularios" value={89} target={85} progress={p(2)} width={171} />
              <GaugeTile label="Cuota" value={42} target={100} progress={p(2)} width={171} />
            </div>
          </Section>
        </Col>
        <Col>
          <Section label="MapCard">
            <MapCard progress={p(3)} width={390} mapHeight={160} />
          </Section>
          <Section label="ChartCard · bars">
            <ChartCard variant="bars" progress={p(4)} width={390} />
          </Section>
        </Col>
      </div>
    </Board>
  );
};

/* ───────────── 5 · Productos y visión artificial ───────────── */

const LINEUP: ShelfItem[] = [
  { id: 'bidon-lavandina-amarillo' },
  { id: 'detergente-liquido-celeste' },
  { id: 'set-limpieza-celeste' },
  { id: 'rociador-limpiador-verde' },
  { id: 'bidon-limpiador-amarillo' },
  { id: 'aerosol-verde' },
  { id: 'lavavajillas-amarillo' },
  { id: 'set-cosmetica-violeta' },
  { id: 'shampoo-violeta' },
  { id: 'shampoo-azul' },
  { id: 'dispensador-jabon-celeste' },
  { id: 'dispensador-jabon-rosa' },
  { id: 'doypack-salsa-pizza' },
  { id: 'tubo-crema-celeste' },
  { id: 'set-desodorante-aerosol-rollon' },
  { id: 'set-crema-rosa' },
];

const SHELF_TOP: ShelfItem[] = [
  { id: 'detergente-liquido-celeste', facings: 2 },
  { id: 'bidon-lavandina-amarillo', facings: 2 },
  { id: 'bidon-limpiador-amarillo', facings: 2 },
  { id: 'lavavajillas-amarillo', facings: 3 },
];
const SHELF_BOTTOM: ShelfItem[] = [
  { id: 'shampoo-violeta', facings: 3 },
  { id: 'shampoo-azul', facings: 2 },
  { id: 'dispensador-jabon-rosa', facings: 2 },
  { id: 'set-desodorante-aerosol-rollon', facings: 2 },
  { id: 'tubo-crema-celeste', facings: 3 },
  { id: 'aerosol-verde', facings: 2 },
];

/** Caja de detección que envuelve los frentes de un grupo de la góndola. */
const groupRect = (items: ShelfItem[], group: number, pxPerCm: number) => {
  const { facings } = shelfLayout(items, pxPerCm);
  const fs = facings.filter((f) => f.group === group);
  const x0 = fs[0].x;
  const x1 = fs[fs.length - 1].x + fs[fs.length - 1].width;
  const h = Math.max(...fs.map((f) => f.height));
  return { x: x0 - 4, width: x1 - x0 + 8, height: h + 6 };
};

export const PageProducts: React.FC = () => {
  const p = (i: number) => usePageProgress(i, 5);
  const PXC = 4.8;
  const GX = 28;
  const topY = 48;
  const botY = 256;
  const top = SHELF_TOP;
  const bot = SHELF_BOTTOM;
  const tallTop = Math.max(...shelfLayout(top, PXC).facings.map((f) => f.height));
  const tallBot = Math.max(...shelfLayout(bot, PXC).facings.map((f) => f.height));
  const det = [
    { items: top, g: 0, y: topY, tall: tallTop, label: 'Jabón líquido ropa 3 L', conf: 0.97, status: 'valid' as const, price: '$8.890' },
    { items: top, g: 2, y: topY, tall: tallTop, label: 'Lavandina en gel 1 L', conf: 0.94, status: 'detected' as const },
    { items: bot, g: 0, y: botY, tall: tallBot, label: 'Shampoo 400 ml', conf: 0.92, status: 'valid' as const, price: '$3.420' },
    { items: bot, g: 4, y: botY, tall: tallBot, label: 'Fuera de planograma', status: 'missing' as const },
  ];
  return (
    <Board title="Productos y visión artificial" page="5/8">
      <div style={{ display: 'flex', gap: 28 }}>
        <Col>
          <Section label="CategoryAccordion · productos por categoría">
            <CategoryAccordion title="Lavandina" done progress={p(0)} />
            <CategoryAccordion title="Cuidado personal" open items={skusOf('Cuidado personal').slice(0, 3)} activeRow={1} progress={p(0)} />
            <CategoryAccordion title="Limpiadores" open items={skusOf('Limpiadores')} progress={p(1)} />
          </Section>
        </Col>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section label="Productos a escala real · la crema dental (11,5 cm) no mide lo mismo que la lavandina (25 cm)">
            <div style={{ padding: '14px 26px 0', borderRadius: radius.md, background: colors.white, overflow: 'hidden', border: `1px solid ${ui.border}`, opacity: p(2) }}>
              <Shelf items={LINEUP} pxPerCm={3.5} gap={6} />
            </div>
          </Section>
          <Section label="DetectionBox · ScanLine sobre góndola con productos reales">
            <div style={{ position: 'relative', height: 392, borderRadius: radius.md, overflow: 'hidden', background: `linear-gradient(180deg, ${colors.dark}, ${ui.text})` }}>
              <Shelf items={top} pxPerCm={PXC} style={{ position: 'absolute', left: GX, top: topY }} />
              <Shelf items={bot} pxPerCm={PXC} style={{ position: 'absolute', left: GX, top: botY }} />
              {det.map((d, i) => {
                const r = groupRect(d.items, d.g, PXC);
                return (
                  <div key={i} style={{ position: 'absolute', left: GX + r.x, top: d.y + d.tall - r.height + 2 }}>
                    <DetectionBox width={r.width} height={r.height} label={d.label} confidence={d.conf} status={d.status} price={d.price} progress={stagger(p(3), i, det.length)} />
                  </div>
                );
              })}
              <ScanLine width={818} height={392} progress={0.8} />
            </div>
          </Section>
        </div>
      </div>
    </Board>
  );
};

/* ───────────── 5 · Una sola app ───────────── */

export const PageApp: React.FC = () => {
  const p = (i: number) => usePageProgress(i, 4);
  const PS = 0.8;
  const phones = [
    <VisitsScreen key="v" progress={p(0)} highlight={1} />,
    <FormScreen key="f" progress={p(1)} />,
    <ChatScreen key="c" progress={p(2)} />,
    <OfflineScreen key="o" progress={p(3)} state="offline" count={3} />,
    <PricesScreen key="pr" progress={p(3)} />,
  ];
  const labels = ['Visitas', 'Formulario', 'Comunicación', 'Offline', 'Precios por categoría'];
  return (
    <AbsoluteFill>
      <GradientBackground arc="solution" seed="showcase" />
      <div style={{ position: 'absolute', left: 64, top: 44, ...type.tagline, fontSize: 40, color: ui.text }}>Una sola app</div>
      <div style={{ position: 'absolute', right: 64, top: 52, ...type.uiTitle, color: ui.textSecondary }}>PSMob · ComponentShowcase · 6/8</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', gap: 34 }}>
        {phones.map((screen, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 414 * PS, height: 868 * PS, position: 'relative' }}>
              <Phone scale={PS} style={{ position: 'absolute', left: (-414 * (1 - PS)) / 2, top: (-868 * (1 - PS)) / 2 }}>
                {screen}
              </Phone>
            </div>
            <div style={{ ...type.uiTitle, color: ui.text, marginTop: 8 }}>{labels[i]}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 6 · Marca y fondos ───────────── */

export const PageAssets: React.FC = () => {
  const frame = useCurrentFrame();
  const explode = progressFrames(frame, 10, 40, 'easeInOut');
  return (
    <Board title="Marca y fondos" page="7/8" zoom={1}>
      <div style={{ display: 'flex', gap: 48 }}>
        <div style={{ width: 760, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Section label="Logos oficiales · public/logos">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 28, borderRadius: radius.lg, background: colors.white, border: `1px solid ${ui.border}` }}>
              <Logo variant="fullColor" height={90} />
              <Row gap={40}>
                <Logo variant="iso" height={110} />
                <Logo variant="wordmarkLight" height={72} />
              </Row>
            </div>
          </Section>
          <Section label="Isotipo · 20 triángulos independientes (escena 13)">
            <div style={{ display: 'flex', gap: 28, alignItems: 'center', padding: 28, borderRadius: radius.lg, background: colors.white, border: `1px solid ${ui.border}` }}>
              <IsoTriangles size={200} />
              <IsoTriangles
                size={200}
                triangle={(i) => {
                  const [cx, cy] = triangleCenter(i);
                  const k = 0.35 * explode;
                  return { x: (cx - 282.5) * k, y: (cy - 282.5) * k, rotate: ((i % 5) - 2) * 12 * explode };
                }}
              />
              <div style={{ ...type.uiBody, fontSize: 16, color: ui.textSecondary, width: 220 }}>Mismos paths del SVG oficial, partidos por subpath. Cada triángulo se mueve, rota y escala por separado.</div>
            </div>
          </Section>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section label="Fondos · problema / solución / cierre">
            {(['problem', 'solution', 'closing'] as const).map((arc) => (
              <div key={arc} style={{ position: 'relative', height: 250, borderRadius: radius.lg, overflow: 'hidden', border: `1px solid ${ui.border}` }}>
                <div style={{ position: 'absolute', left: 0, top: -151, width: 1920, height: 1080, transform: 'scale(0.5125)', transformOrigin: '0 0' }}>
                  <GradientBackground arc={arc} seed={`sw-${arc}`} />
                </div>
                <div style={{ position: 'absolute', left: 16, bottom: 12, ...type.uiCaption, fontSize: 14, color: arc === 'problem' ? colors.white : ui.text }}>{arc}</div>
              </div>
            ))}
          </Section>
        </div>
      </div>
    </Board>
  );
};

/* ───────────── 7 · Personajes ───────────── */

const LINEUP_H = 176;

const Lineup: React.FC<{ who: 'caro' | 'nico' }> = ({ who }) => {
  const poses = listPoses(who);
  const rows = [poses.slice(0, Math.ceil(poses.length / 2)), poses.slice(Math.ceil(poses.length / 2))];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((row, r) => (
        <div key={r} style={{ position: 'relative', height: LINEUP_H + 40, borderBottom: `2px solid ${ui.border}` }}>
          {row.map((pose, i) => {
            const x = 70 + i * (1760 / row.length);
            return (
              <React.Fragment key={pose}>
                <Character who={who} pose={pose as never} height={LINEUP_H} x={x} y={LINEUP_H + 14} breath={0} />
                <div style={{ position: 'absolute', left: x, top: LINEUP_H + 20, transform: 'translateX(-50%)', ...type.uiCaption, fontSize: 12, color: ui.textSecondary, whiteSpace: 'nowrap' }}>{pose}</div>
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const PagePeople: React.FC = () => (
  <Board title="Personajes" page="8/8" zoom={1}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Section label={`Caro · ${listPoses('caro').length} poses · misma altura de pie (${LINEUP_H} px), pies sobre la línea`}>
        <Lineup who="caro" />
      </Section>
      <Section label={`Nico · ${listPoses('nico').length} poses`}>
        <Lineup who="nico" />
      </Section>
    </div>
  </Board>
);

export const SHOWCASE_PAGES = [
  { id: 'Foundations', C: PageFoundations },
  { id: 'Navigation', C: PageNavigation },
  { id: 'Forms', C: PageForms },
  { id: 'Data', C: PageData },
  { id: 'Products', C: PageProducts },
  { id: 'App', C: PageApp },
  { id: 'Assets', C: PageAssets },
  { id: 'People', C: PagePeople },
] as const;
