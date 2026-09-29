import React from 'react';
import { alpha, colors, type, ui } from '../tokens';
import { stagger, sub } from '../lib/easing';
import { PHONE } from '../devices/Phone';
import { AppHeader } from './AppHeader';
import { BottomNavigation } from './BottomNavigation';
import { Badge } from './Badge';
import { Button } from './Button';
import { ChatBubble } from './ChatBubble';
import { FormField } from './FormField';
import { ListRow } from './ListRow';
import { ProgressBar } from './ProgressBar';
import { SyncIndicator, SyncState } from './SyncIndicator';
import { Toast } from './Toast';
import { Card } from './Card';
import { Icon } from './Icon';
import { MESSAGES, PDVS, SKUS, formatARS } from './data';

/** Estructura de pantalla PSMob: header + contenido con scroll + bottom nav. 390×844. */
export const ScreenShell: React.FC<{
  header: React.ReactNode;
  children: React.ReactNode;
  nav?: React.ReactNode;
  overlay?: React.ReactNode;
  /** desplazamiento del contenido (scroll simulado) */
  scroll?: number;
}> = ({ header, children, nav, overlay, scroll = 0 }) => (
  <div style={{ width: PHONE.screenW, height: PHONE.screenH, display: 'flex', flexDirection: 'column', background: ui.background, position: 'relative' }}>
    {header}
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, transform: `translateY(${-scroll}px)` }}>{children}</div>
    </div>
    {nav}
    {overlay}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 2px 4px' }}>
    <span style={{ ...type.uiCaption, color: ui.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>{children}</span>
    {right}
  </div>
);

/** Pantalla de visitas / planificación. */
export const VisitsScreen: React.FC<{ progress?: number; highlight?: number }> = ({ progress = 1, highlight }) => (
  <ScreenShell
    header={
      <AppHeader title="Visitas" subtitle="Martes 29/09 · 5 PDV" actions={[{ icon: 'filter' }, { icon: 'bell', count: 4 }]} progress={sub(progress, 0, 0.3)}>
        <Badge label="Hoy" variant="neutral" dot={false} style={{ background: colors.white, color: colors.primary }} />
        <Badge label="Semana" variant="neutral" dot={false} style={{ background: alpha(colors.white, 0.16), color: colors.white }} />
        <Badge label="Solo mis PDV" variant="neutral" dot={false} style={{ background: alpha(colors.white, 0.16), color: colors.white }} />
      </AppHeader>
    }
    nav={<BottomNavigation active={2} progress={sub(progress, 0, 0.3)} />}
  >
    <SectionTitle right={<span style={{ ...type.uiCaption, color: colors.primary, fontWeight: 600 }}>2/5 completadas</span>}>Ruta de hoy</SectionTitle>
    {PDVS.map((p, i) => (
      <ListRow
        key={p.id}
        index={i + 1}
        title={p.name}
        address={p.address}
        time={p.time}
        status={p.status}
        highlighted={highlight === i}
        progress={stagger(sub(progress, 0.15, 1), i, PDVS.length, 0.65)}
      />
    ))}
  </ScreenShell>
);

/** Formulario de relevamiento en góndola. */
export const FormScreen: React.FC<{ progress?: number; press?: number; done?: boolean }> = ({ progress = 1, press = 0, done = false }) => {
  const fields = sub(progress, 0.1, 0.85);
  return (
    <ScreenShell
      header={<AppHeader title="Relevamiento góndola" subtitle="Supermercado San Martín" back actions={[{ icon: 'camera' }]} progress={sub(progress, 0, 0.25)} />}
      overlay={
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
          <Button label={done ? 'Formulario enviado' : 'Enviar formulario'} fullWidth press={press} done={done} progress={sub(progress, 0.7, 1)} />
        </div>
      }
    >
      <Card progress={sub(progress, 0.05, 0.3)}>
        <ProgressBar label="Avance del formulario" value={done ? 1 : 0.75} progress={sub(progress, 0.1, 0.9)} />
      </Card>
      <Card progress={stagger(fields, 0, 4, 0.5)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge label={SKUS[0].category} variant="category" dot={false} />
          <span style={{ ...type.uiCaption, color: ui.textSecondary, fontVariantNumeric: 'tabular-nums' }}>EAN {SKUS[0].ean}</span>
        </div>
        <div style={{ ...type.uiBodyStrong, color: colors.textDark, marginTop: -8 }}>{SKUS[0].name}</div>
        <FormField label="Precio en góndola" value={formatARS(SKUS[0].price)} progress={stagger(fields, 1, 4, 0.5)} />
        <FormField label="Frentes" value="6" suffix="unidades" progress={stagger(fields, 2, 4, 0.5)} />
        <FormField label="Producto en exhibición secundaria" kind="check" progress={stagger(fields, 3, 4, 0.5)} />
      </Card>
      <Card progress={sub(progress, 0.55, 0.85)}>
        <FormField label="Foto del exhibidor" kind="photo" progress={sub(progress, 0.6, 1)} />
      </Card>
    </ScreenShell>
  );
};

/** Chat de comunicación con supervisión. */
export const ChatScreen: React.FC<{ progress?: number }> = ({ progress = 1 }) => (
  <ScreenShell
    header={<AppHeader title="Lucía Ferreyra" subtitle="Supervisora · en línea" back actions={[{ icon: 'info' }]} progress={sub(progress, 0, 0.25)} />}
    overlay={
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px 28px', background: ui.surface, borderTop: `1px solid ${ui.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ ...type.uiBody, flex: 1, height: 44, borderRadius: 22, background: ui.background, display: 'flex', alignItems: 'center', padding: '0 16px', color: ui.textMuted }}>Escribí un mensaje</div>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: colors.primary, display: 'grid', placeItems: 'center' }}>
          <Icon name="send" size={20} color={colors.white} strokeWidth={2} />
        </div>
      </div>
    }
  >
    <div style={{ alignSelf: 'center', margin: '4px 0 8px' }}>
      <Badge label="Hoy" variant="neutral" dot={false} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {MESSAGES.map((m, i) => (
        <ChatBubble key={i} text={m.text} side={m.side} author={i === 0 ? m.from : undefined} time={m.time} progress={stagger(sub(progress, 0.15, 0.85), i, MESSAGES.length + 1, 0.4)} />
      ))}
      <ChatBubble text="" side="in" typing progress={stagger(sub(progress, 0.15, 0.85), MESSAGES.length, MESSAGES.length + 1, 0.4)} />
    </div>
  </ScreenShell>
);

/** Modo offline: la UI sigue funcionando, guarda local y sincroniza al volver. */
export const OfflineScreen: React.FC<{ progress?: number; state?: SyncState; count?: number; syncProgress?: number }> = ({
  progress = 1,
  state = 'offline',
  count = 3,
  syncProgress,
}) => (
  <ScreenShell
    header={
      <AppHeader title="Visita en curso" subtitle="Mayorista Del Oeste" back progress={sub(progress, 0, 0.25)}>
        <SyncIndicator state={state} count={state === 'offline' || state === 'pending' ? count : undefined} syncProgress={syncProgress} onPrimary progress={sub(progress, 0.1, 0.4)} />
      </AppHeader>
    }
    nav={<BottomNavigation active={3} />}
    overlay={
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 96 }}>
        <Toast
          variant={state === 'synced' ? 'success' : 'info'}
          icon={state === 'synced' ? undefined : 'device'}
          title={state === 'synced' ? 'Sincronización completa' : 'Guardado localmente'}
          message={state === 'synced' ? '3 registros enviados' : 'Se enviará al recuperar la conexión'}
          progress={sub(progress, 0.55, 0.9)}
          width={PHONE.screenW - 32}
        />
      </div>
    }
  >
    {[
      { t: 'Precios', s: '6 SKU relevados' },
      { t: 'Exhibición', s: 'Punta de góndola · limpieza' },
      { t: 'Fotos', s: '4 imágenes' },
    ].map((r, i) => (
      <Card key={r.t} progress={stagger(sub(progress, 0.15, 0.7), i, 3, 0.5)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: ui.primaryTint, display: 'grid', placeItems: 'center' }}>
          <Icon name={i === 2 ? 'camera' : i === 1 ? 'grid' : 'tag'} size={18} color={colors.primary} strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...type.uiBodyStrong, color: colors.textDark }}>{r.t}</div>
          <div style={{ ...type.uiCaption, fontWeight: 400, color: ui.textSecondary }}>{r.s}</div>
        </div>
        <Icon name={state === 'synced' ? 'checkCircle' : 'device'} size={20} color={state === 'synced' ? colors.success : ui.textMuted} />
      </Card>
    ))}
  </ScreenShell>
);
