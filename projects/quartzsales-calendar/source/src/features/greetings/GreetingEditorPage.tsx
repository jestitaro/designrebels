import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft, Bold, Check, CloudAlert, Copy, CopyPlus, History, Italic, LoaderCircle, MessageSquareX, RotateCcw, Save, Send,
  Strikethrough, Trash2,
} from 'lucide-react';
import { db } from '../../db/db';
import {
  deleteGreeting, duplicateGreeting, restoreGreetingVersion, saveGreeting, saveGreetingVersion, setGreetingStatus,
} from '../../db/greetings';
import { useEvent } from '../../hooks/useData';
import { useAutosave, type SaveState } from '../../hooks/useAutosave';
import { copyText } from '../../lib/clipboard';
import { formatDate } from '../../lib/dates';
import { countCharacters } from '../../lib/slackFormat';
import { cn } from '../../lib/cn';
import type { Greeting, GreetingStatus, Tone } from '../../types';
import { GreetingStatusBadge, SlackPreview } from '../../components/domain/GreetingBadges';
import { CHANNEL_SUGGESTIONS, GREETING_STATUS_META, GREETING_STATUSES, TONE_LABELS, TONES } from '../../components/domain/greetingMeta';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DateInput } from '../../components/ui/DateInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { ManualCopyDialog } from '../../components/ui/ManualCopyDialog';
import { Segmented } from '../../components/ui/Segmented';
import { useToast } from '../../components/ui/Toast';

const EMOJIS = ['🎉', '🥳', '👏', '🙌', '❤️', '💜', '✨', '🔥', '🚀', '💡', '😄', '😂', '🤗', '🙏', '💪', '👀', '🧉', '🍷', '🎶', '🎨', '💻', '📅', '🇦🇷', '🇲🇽', '🇪🇨', '🌎'];

type Fields = Partial<Pick<Greeting, 'internalTitle' | 'body' | 'tone' | 'channel' | 'plannedDate' | 'privateNotes'>>;

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

function versionLabel(reason: string) {
  return reason === 'manual' ? 'Guardada a mano' : reason === 'restauración' ? 'Antes de restaurar' : 'Cambio de estado';
}

export function GreetingEditorPage() {
  const { id = '' } = useParams();
  const greeting = useLiveQuery(async () => (await db.greetings.get(id)) ?? null, [id]);
  if (greeting === undefined) return null;
  if (greeting === null) {
    return (
      <EmptyState className="m-4" icon={MessageSquareX} title="Este saludo ya no existe"
        action={<Link to="/saludos" className="font-medium text-accent hover:underline">Ver todos los saludos</Link>} />
    );
  }
  return <Editor key={greeting.id} greeting={greeting} />;
}

function Editor({ greeting }: { greeting: Greeting }) {
  const navigate = useNavigate();
  const toast = useToast();
  const event = useEvent(greeting.eventId);
  const [fields, setFields] = useState<Required<Omit<Fields, 'plannedDate'>> & { plannedDate: string }>({
    internalTitle: greeting.internalTitle,
    body: greeting.body,
    tone: greeting.tone,
    channel: greeting.channel,
    plannedDate: greeting.plannedDate ?? '',
    privateNotes: greeting.privateNotes,
  });
  const [tab, setTab] = useState<'escribir' | 'vista'>('escribir');
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { state, queue, flush } = useAutosave<Fields>((changes) => saveGreeting(greeting.id, changes));

  // Si se restaura una versión, el texto cambia desde la base: sincronizar.
  const lastBody = useRef(greeting.body);
  useEffect(() => {
    if (greeting.body !== lastBody.current) {
      lastBody.current = greeting.body;
      setFields((f) => (f.body === greeting.body ? f : { ...f, body: greeting.body }));
    }
  }, [greeting.body]);

  function update<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((f) => ({ ...f, [key]: value }));
    if (key === 'plannedDate') {
      if (value === '' || value !== 'invalid') queue({ plannedDate: (value as string) || undefined });
    } else {
      if (key === 'body') lastBody.current = value as string;
      queue({ [key]: value } as Fields);
    }
  }

  function wrap(mark: string) {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || 'texto';
    const next = `${value.slice(0, s)}${mark}${selected}${mark}${value.slice(e)}`;
    update('body', next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + mark.length, s + mark.length + selected.length);
    });
  }

  function insert(text: string) {
    const el = bodyRef.current;
    const value = fields.body;
    const s = el?.selectionStart ?? value.length;
    const e = el?.selectionEnd ?? value.length;
    update('body', `${value.slice(0, s)}${text}${value.slice(e)}`);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(s + text.length, s + text.length);
    });
  }

  async function changeStatus(status: GreetingStatus) {
    await flush();
    await setGreetingStatus(greeting.id, status);
    toast.success(`Estado: ${GREETING_STATUS_META[status].label.toLowerCase()}. Se guardó una versión.`);
  }

  async function copyMessage() {
    await flush();
    if (!fields.body.trim()) {
      toast.error('El mensaje está vacío.');
      return;
    }
    if (await copyText(fields.body)) {
      toast.show(greeting.status === 'compartido' ? 'Mensaje copiado.' : 'Mensaje copiado. Cuando lo publiques, marcalo como compartido.', { tone: 'success' });
    } else setManualCopy(fields.body);
  }

  const chars = useMemo(() => countCharacters(fields.body), [fields.body]);

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3 lg:h-16 lg:px-6 lg:py-0">
        <IconButton icon={ArrowLeft} label="Volver a saludos" onClick={() => navigate('/saludos')} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold lg:text-lg">{fields.internalTitle || 'Saludo sin título'}</h1>
          <div className="flex items-center gap-2">
            <GreetingStatusBadge status={greeting.status} />
            <SaveIndicator state={state} />
          </div>
        </div>
        <Button size="sm" variant="primary" icon={Copy} onClick={() => void copyMessage()}>Copiar mensaje</Button>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-6">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
            <Field label="Título interno" hint="Solo para organizarte; no forma parte del mensaje.">
              {(p) => <Input id={p.id} aria-describedby={p.describedBy} value={fields.internalTitle} onChange={(e) => update('internalTitle', e.target.value)} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tono">
                {(p) => (
                  <Select id={p.id} value={fields.tone} onChange={(e) => update('tone', e.target.value as Tone)}>
                    {TONES.map((t) => <option key={t} value={t}>{TONE_LABELS[t]}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Canal" hint="Etiqueta editorial, sin conexión real.">
                {(p) => (
                  <>
                    <Input id={p.id} aria-describedby={p.describedBy} list="qs-channels" value={fields.channel} onChange={(e) => update('channel', e.target.value)} placeholder="Slack #general" />
                    <datalist id="qs-channels">{CHANNEL_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
                  </>
                )}
              </Field>
              <Field label="Fecha planificada" error={fields.plannedDate === 'invalid' ? 'Fecha inválida (dd/mm/aaaa).' : undefined}>
                {(p) => <DateInput id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={fields.plannedDate} onChange={(v) => update('plannedDate', v)} />}
              </Field>
            </div>
            {event && (
              <p className="text-[13px] text-muted">
                Evento: <Link to={`/eventos/${event.id}`} className="font-medium text-accent hover:underline">{event.title}</Link>
              </p>
            )}
          </section>

          <section aria-label="Redacción" className="flex flex-col rounded-lg border border-border bg-surface shadow-sm">
            <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
              <Segmented className="lg:hidden" label="Modo" value={tab} onChange={setTab}
                options={[{ value: 'escribir', label: 'Escribir' }, { value: 'vista', label: 'Vista previa' }]} />
              <div className={cn('flex items-center gap-0.5', tab === 'vista' && 'hidden lg:flex')}>
                <IconButton icon={Bold} label="Negrita (*texto*)" size="sm" onClick={() => wrap('*')} />
                <IconButton icon={Italic} label="Cursiva (_texto_)" size="sm" onClick={() => wrap('_')} />
                <IconButton icon={Strikethrough} label="Tachado (~texto~)" size="sm" onClick={() => wrap('~')} />
              </div>
              <span className="ml-auto pr-2 text-xs text-muted tabular-nums" aria-live="polite">{chars} caracteres</span>
            </div>
            <div className={cn(tab === 'vista' && 'hidden lg:block')}>
              <label htmlFor="greeting-body" className="sr-only">Mensaje</label>
              <textarea
                id="greeting-body"
                ref={bodyRef}
                value={fields.body}
                onChange={(e) => update('body', e.target.value)}
                rows={10}
                placeholder="Escribí el saludo. Podés usar *negrita*, _cursiva_ y ~tachado~."
                className="block min-h-56 w-full resize-y bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
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
                <p className="mt-1 text-xs text-muted">Más emojis con el selector del sistema: <kbd className="font-sans font-medium">Win + .</kbd> en Windows, <kbd className="font-sans font-medium">Ctrl + Cmd + Espacio</kbd> en Mac o el teclado del celular.</p>
              </div>
            </div>
            <div className={cn('border-t border-border p-4 lg:hidden', tab === 'escribir' && 'hidden')}>
              {fields.body.trim() ? <SlackPreview text={fields.body} /> : <p className="text-sm text-muted">Todavía no hay texto.</p>}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <Field label="Notas privadas" hint="No se copian con el mensaje.">
              {(p) => <Textarea id={p.id} aria-describedby={p.describedBy} rows={3} value={fields.privateNotes} onChange={(e) => update('privateNotes', e.target.value)} />}
            </Field>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-label="Vista previa" className="hidden flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm lg:flex">
            <h2 className="text-xs font-extrabold tracking-wide text-muted uppercase">Vista previa</h2>
            <div className="flex gap-3">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded bg-brand-grad text-xs font-bold text-white">QS</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">QuartzSales <span className="font-normal text-subtle">{fields.channel}</span></p>
                {fields.body.trim() ? <SlackPreview text={fields.body} /> : <p className="text-sm text-muted">Todavía no hay texto.</p>}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
            <Field label="Estado" hint="Cambiar de estado guarda una versión del texto.">
              {(p) => (
                <Select id={p.id} aria-describedby={p.describedBy} value={greeting.status} onChange={(e) => void changeStatus(e.target.value as GreetingStatus)}>
                  {GREETING_STATUSES.map((s) => <option key={s} value={s}>{GREETING_STATUS_META[s].label}</option>)}
                </Select>
              )}
            </Field>
            {greeting.status !== 'compartido' && (
              <Button icon={Send} onClick={() => void changeStatus('compartido')} disabled={!fields.body.trim()}>Marcar como compartido</Button>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={CopyPlus} onClick={async () => { await flush(); const c = await duplicateGreeting(greeting.id); toast.success('Saludo duplicado.'); navigate(`/saludos/${c.id}`); }}>Duplicar</Button>
              <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>Eliminar</Button>
            </div>
          </section>

          <section aria-labelledby="versions-title" className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 id="versions-title" className="flex flex-1 items-center gap-1.5 text-xs font-extrabold tracking-wide text-muted uppercase">
                <History aria-hidden className="size-3.5" />Versiones
              </h2>
              <Button size="sm" variant="ghost" icon={Save} onClick={async () => { await flush(); await saveGreetingVersion(greeting.id); toast.success('Versión guardada.'); }}>Guardar versión</Button>
            </div>
            {greeting.versions.length === 0 ? (
              <p className="text-[13px] text-muted">Todavía no hay versiones. Se guardan al cambiar de estado o con "Guardar versión".</p>
            ) : (
              <ol className="flex flex-col divide-y divide-border">
                {greeting.versions.map((v) => (
                  <li key={v.id} className="flex items-start gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">
                        {formatDate(v.savedAt.slice(0, 10))} {new Date(v.savedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted">{versionLabel(v.reason)} · {GREETING_STATUS_META[v.status].label}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-subtle">{v.body || '(vacío)'}</p>
                    </div>
                    <IconButton icon={RotateCcw} size="sm" label={`Restaurar versión del ${formatDate(v.savedAt.slice(0, 10))}`}
                      disabled={v.body === fields.body}
                      onClick={async () => { await flush(); await restoreGreetingVersion(greeting.id, v.id); toast.success('Versión restaurada. El texto anterior quedó guardado.'); }} />
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>

      <ManualCopyDialog text={manualCopy} onClose={() => setManualCopy(null)} />
      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar este saludo?"
        description="Se elimina el texto, las notas y el historial de versiones. No se puede deshacer."
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
