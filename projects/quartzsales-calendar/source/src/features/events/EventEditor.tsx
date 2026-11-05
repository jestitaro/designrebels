import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { createEvent, updateEvent } from '../../db/repo';
import { useIsDesktop } from '../../hooks/useTheme';
import type { EventContent } from '../../schemas/event';
import type { CalendarEvent, ISODate } from '../../types';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { BottomSheet, Modal } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { draftFromEvent, emptyDraft, type EventDraft } from './eventDraft';
import { EventForm } from './EventForm';

interface EditorApi {
  openCreate: (opts?: { date?: ISODate; defaults?: Partial<EventDraft>; onCreated?: (e: CalendarEvent) => void }) => void;
  openEdit: (event: CalendarEvent) => void;
}

const EditorContext = createContext<EditorApi | null>(null);

type EditorState =
  | { mode: 'closed' }
  | { mode: 'create'; draft: EventDraft; key: number; onCreated?: (e: CalendarEvent) => void }
  | { mode: 'edit'; draft: EventDraft; event: CalendarEvent; key: number };

const FORM_ID = 'qs-event-form';

/** Formulario de alta/edición de eventos accesible desde cualquier pantalla. */
export function EventEditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>({ mode: 'closed' });
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const openCreate = useCallback<EditorApi['openCreate']>((opts = {}) => {
    setDirty(false);
    setState({ mode: 'create', draft: emptyDraft(opts.date, opts.defaults), key: Date.now(), onCreated: opts.onCreated });
  }, []);

  const openEdit = useCallback<EditorApi['openEdit']>((event) => {
    setDirty(false);
    setState({ mode: 'edit', draft: draftFromEvent(event), event, key: Date.now() });
  }, []);

  const api = useMemo(() => ({ openCreate, openEdit }), [openCreate, openEdit]);

  const close = () => {
    setState({ mode: 'closed' });
    setConfirmClose(false);
    setDirty(false);
  };
  const requestClose = () => (dirty ? setConfirmClose(true) : close());

  async function save(content: EventContent) {
    setSaving(true);
    try {
      if (state.mode === 'create') {
        const created = await createEvent(content);
        toast.show('Evento creado.', {
          tone: 'success',
          action: state.onCreated ? undefined : { label: 'Ver', onClick: () => navigate(`/eventos/${created.id}`) },
        });
        state.onCreated?.(created);
      } else if (state.mode === 'edit') {
        await updateEvent(state.event.id, content);
        toast.success('Cambios guardados.');
      }
      close();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar. Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  const open = state.mode !== 'closed';
  const title = state.mode === 'edit' ? 'Editar evento' : 'Nuevo evento';
  const description =
    state.mode === 'edit' && state.event.provenance === 'seed'
      ? 'Es un evento del catálogo inicial: tus cambios se conservan aunque se actualice el catálogo.'
      : undefined;
  const footer = (
    <>
      <Button variant="secondary" onClick={requestClose}>
        Cancelar
      </Button>
      <Button variant="primary" type="submit" form={FORM_ID} disabled={saving}>
        {state.mode === 'edit' ? 'Guardar cambios' : 'Crear evento'}
      </Button>
    </>
  );
  const body = open ? <EventForm key={state.key} formId={FORM_ID} initial={state.draft} onSubmit={save} onDirtyChange={setDirty} /> : null;

  return (
    <EditorContext.Provider value={api}>
      {children}
      {isDesktop ? (
        <Modal open={open} onClose={requestClose} title={title} description={description} size="md" footer={footer}>
          {body}
        </Modal>
      ) : (
        <BottomSheet open={open} onClose={requestClose} title={title} description={description} footer={footer}>
          {body}
        </BottomSheet>
      )}
      <ConfirmDialog
        open={confirmClose}
        title="¿Descartar los cambios?"
        description="Hay cambios sin guardar en el formulario."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        destructive
        onConfirm={close}
        onCancel={() => setConfirmClose(false)}
      />
    </EditorContext.Provider>
  );
}

export function useEventEditor(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEventEditor debe usarse dentro de EventEditorProvider');
  return ctx;
}
