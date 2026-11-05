import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Bold, Check, CloudAlert, Copy, ExternalLink, Italic, LoaderCircle, MessageSquareX, Strikethrough, Trash2 } from 'lucide-react';
import { db } from '../../db/db';
import { deleteGreeting, saveGreeting, setGreetingStatus } from '../../db/greetings';
import { useEvent } from '../../hooks/useData';
import { useAutosave, type SaveState } from '../../hooks/useAutosave';
import { copyText } from '../../lib/clipboard';
import { formatLong, capitalize } from '../../lib/dates';
import { countCharacters } from '../../lib/slackFormat';
import { cn } from '../../lib/cn';
import type { Greeting, GreetingStatus } from '../../types';
import { SlackPreview } from '../../components/domain/GreetingBadges';
import { GREETING_STATUS_META, GREETING_STATUSES } from '../../components/domain/greetingMeta';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input } from '../../components/ui/Field';
import { ManualCopyDialog } from '../../components/ui/ManualCopyDialog';
import { Segmented } from '../../components/ui/Segmented';
import { useToast } from '../../components/ui/Toast';

const EMOJIS = ['🎉', '🥳', '👏', '🙌', '💜', '✨', '🔥', '🚀', '💡', '😄', '🤗', '🙏', '💪', '🧉', '🍷', '🎶', '🎨', '💻', '🇦🇷', '🇲🇽', '🇪🇨', '🇪🇸', '🌎'];
const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

function SaveIndicator({ state }: { state: SaveState }) {
  const content = {
    idle: null,
    saving: <><LoaderCircle aria-hidden className="size-3.5 animate-spin motion-reduce:animate-none" />Guardando…</>,
    saved: <><Check aria-hidden className="size-3.5" />Guardado</>,
    error: <><CloudAlert aria-hidden className="size-3.5" />No se pudo guardar</>,
  }[state];
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center gap-1 text-xs', state === 'error' ? 'text-danger-fg' : 'text-muted')}>
      {content}
    </span>
  );
}

export function GreetingEditorPage() {
  const { id = '' } = useParams();
  const greeting = useLiveQuery(async () => (await db.greetings.get(id)) ?? null, [id]);
  if (greeting === undefined) return null;
  if (greeting === null) {
    return (
      <EmptyState className="m-4" icon={MessageSquareX} title="Este saludo ya no existe"
        action={<Link to="/saludos" className="font-bold text-accent hover:underline">Ver todos los saludos</Link>} />
    );
  }
  return <Editor key={greeting.id} greeting={greeting} />;
}

function Editor({ greeting }: { greeting: Greeting }) {
  const navigate = useNavigate();
  const toast = useToast();
  const event = useEvent(greeting.eventId);
  const [body, setBody] = useState(greeting.body);
  const [imageUrl, setImageUrl] = useState(greeting.imageUrl ?? '');
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { state, queue, flush } = useAutosave<Partial<Pick<Greeting, 'body' | 'imageUrl'>>>((changes) => saveGreeting(greeting.id, changes));


  function updateBody(next: string) {
    setBody(next);
    queue({ body: next });
  }

  function wrap(mark: string) {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = body.slice(s, e) || 'texto';
    updateBody(`${body.slice(0, s)}${mark}${selected}${mark}${body.slice(e)}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + mark.length, s + mark.length + selected.length);
    });
  }

  function insert(text: string) {
    const el = bodyRef.current;
    const s = el?.selectionStart ?? body.length;
    const e = el?.selectionEnd ?? body.length;
    updateBody(`${body.slice(0, s)}${text}${body.slice(e)}`);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(s + text.length, s + text.length);
    });
  }

  async function changeStatus(status: GreetingStatus) {
    await flush();
    await setGreetingStatus(greeting.id, status);
  }

  async function copyMessage() {
    await flush();
    if (!body.trim()) return toast.error('El mensaje está vacío.');
    if (await copyText(body)) {
      toast.success(greeting.status === 'compartido' ? 'Mensaje copiado.' : 'Mensaje copiado. Cuando lo publiques, marcalo como compartido.');
    } else setManualCopy(body);
  }

  const chars = useMemo(() => countCharacters(body), [body]);
  const imageError = imageUrl.trim() && !isUrl(imageUrl) ? 'Pegá un link que empiece con https://' : undefined;
  const title = event ? `${event.title}${greeting.plannedDate ? ` ${greeting.plannedDate.slice(0, 4)}` : ''}` : greeting.internalTitle || 'Saludo';

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3 lg:h-16 lg:px-6 lg:py-0">
        <IconButton icon={ArrowLeft} label="Volver a saludos" onClick={() => navigate('/saludos')} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold lg:text-lg">{title}</h1>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
            {greeting.plannedDate && <span>{capitalize(formatLong(greeting.plannedDate))}</span>}
            <SaveIndicator state={state} />
          </div>
        </div>
        <Button size="sm" variant="primary" icon={Copy} onClick={() => void copyMessage()}>Copiar mensaje</Button>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-6">
        <section aria-label="Mensaje" className="qs-topline flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-0.5 border-b border-border px-2 pt-2.5 pb-1.5">
            <IconButton icon={Bold} label="Negrita (*texto*)" size="sm" onClick={() => wrap('*')} />
            <IconButton icon={Italic} label="Cursiva (_texto_)" size="sm" onClick={() => wrap('_')} />
            <IconButton icon={Strikethrough} label="Tachado (~texto~)" size="sm" onClick={() => wrap('~')} />
            <span className="ml-auto pr-2 font-data text-xs text-muted tabular-nums">{chars} caracteres</span>
          </div>
          <label htmlFor="greeting-body" className="sr-only">Texto del saludo</label>
          <textarea
            id="greeting-body"
            ref={bodyRef}
            value={body}
            onChange={(e) => updateBody(e.target.value)}
            rows={9}
            placeholder="Escribí el saludo. Podés usar *negrita*, _cursiva_ y ~tachado~."
            className="block min-h-52 w-full resize-y bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
          />
          <div className="border-t border-border px-3 py-2">
            <div role="group" aria-label="Insertar emoji" className="flex flex-wrap gap-0.5">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => insert(e)} aria-label={`Insertar ${e}`}
                  className="inline-flex size-8 items-center justify-center rounded text-lg hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:size-10">
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border p-4 lg:hidden">
            <p className="mb-2 font-data text-[10px] font-bold tracking-[0.06em] text-subtle uppercase">Vista previa</p>
            {body.trim() ? <SlackPreview text={body} /> : <p className="text-sm text-muted">Todavía no hay texto.</p>}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section aria-label="Vista previa" className="hidden flex-col gap-3 rounded-lg border border-border bg-surface p-4 lg:flex">
            <h2 className="font-data text-[10px] font-bold tracking-[0.06em] text-subtle uppercase">Vista previa</h2>
            <div className="flex gap-3">
              <img src="brand/iso-qs.svg" alt="" aria-hidden className="size-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">QuartzSales</p>
                {body.trim() ? <SlackPreview text={body} /> : <p className="text-sm text-muted">Todavía no hay texto.</p>}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold">Estado</span>
              <Segmented label="Estado" value={greeting.status} onChange={(s) => void changeStatus(s)}
                options={GREETING_STATUSES.map((s) => ({ value: s, label: GREETING_STATUS_META[s].label, icon: GREETING_STATUS_META[s].icon }))} />
            </div>

            <Field label="Imagen" error={imageError} hint="Link a la imagen guardada en Drive, Canva, etc. Podés pedírsela a Claude y pegar acá el link.">
              {(p) => (
                <div className="flex gap-2">
                  <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} type="url" inputMode="url" placeholder="https://"
                    value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); if (!e.target.value.trim() || isUrl(e.target.value)) queue({ imageUrl: e.target.value.trim() || undefined }); }} />
                  {isUrl(imageUrl) && (
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir imagen en otra pestaña" title="Abrir imagen"
                      className="inline-flex size-[38px] shrink-0 items-center justify-center rounded border border-border-strong text-muted hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-focus">
                      <ExternalLink aria-hidden className="size-4" />
                    </a>
                  )}
                </div>
              )}
            </Field>

            {event && (
              <p className="text-[13px] text-muted">
                Fecha: <Link to={`/eventos/${event.id}`} className="font-bold text-accent hover:underline">{event.title}</Link>
              </p>
            )}
            <div>
              <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>Eliminar saludo</Button>
            </div>
          </section>
        </aside>
      </div>

      <ManualCopyDialog text={manualCopy} onClose={() => setManualCopy(null)} />
      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar este saludo?"
        description="Se elimina el texto y el link de imagen. No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await deleteGreeting(greeting.id);
          toast.success('Saludo eliminado.');
          navigate('/saludos', { replace: true });
        }}
      />
    </div>
  );
}
