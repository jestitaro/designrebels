import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getApi, IS_DEMO } from './api/index.js';

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [api, setApi] = useState(null);
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [messages, setMessages] = useState({ sent: [], received: [] });
  const [tree, setTree] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [lastPiece, setLastPiece] = useState(null);
  const toastId = useRef(0);

  const toast = useCallback((text, tone = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const refreshMine = useCallback(async (a = api) => {
    if (!a) return;
    const [msgs, asg] = await Promise.all([a.getMyMessages(), a.getMyAssignment()]);
    setMessages(msgs);
    setAssignment(asg);
  }, [api]);

  const refreshTree = useCallback(async (a = api) => {
    if (!a) return;
    setTree(await a.getTree());
  }, [api]);

  // Arranque: adaptador, listado y sesión guardada.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const a = await getApi();
        if (!alive) return;
        setApi(a);
        // En producción el listado requiere sesión: primero la sesión.
        const session = await a.getSession().catch((e) => {
          toast(e.message, 'error');
          return null;
        });
        const list = await a.listParticipants().catch(() => []);
        if (!alive) return;
        setParticipants(list);
        if (session?.participant) {
          setMe(session.participant);
          const [msgs, asg] = await Promise.all([a.getMyMessages(), a.getMyAssignment()]);
          setMessages(msgs);
          setAssignment(asg);
        }
        setTree(await a.getTree().catch(() => null));
      } catch (e) {
        toast(e.message || 'No pudimos cargar la experiencia.', 'error');
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast]);

  const signInAs = useCallback(async (pid) => {
    const { participant } = await api.signInAs(pid);
    setMe(participant);
    await refreshMine(api);
    await refreshTree(api);
    return participant;
  }, [api, refreshMine, refreshTree]);

  const signOut = useCallback(async () => {
    await api.signOut();
    setMe(null);
    setMessages({ sent: [], received: [] });
    setAssignment(null);
  }, [api]);

  const sendPostcard = useCallback(async (payload) => {
    const msg = await api.sendPostcard(payload);
    setLastPiece(msg.id);
    await Promise.all([refreshMine(api), refreshTree(api)]);
    return msg;
  }, [api, refreshMine, refreshTree]);

  const markRead = useCallback(async (id) => {
    await api.markRead(id);
    setMessages((m) => ({ ...m, received: m.received.map((r) => (r.id === id ? { ...r, read: true } : r)) }));
  }, [api]);

  const progress = useMemo(() => {
    const destino = messages.sent.find((m) => m.slot === 'destino') || null;
    const eleccion = messages.sent.find((m) => m.slot === 'eleccion') || null;
    return { destino, eleccion, done: !!destino && !!eleccion };
  }, [messages]);

  const unread = messages.received.filter((m) => !m.read).length;

  const value = {
    api, ready, isDemo: IS_DEMO, me, participants, assignment, messages, tree, progress, unread,
    toasts, toast, lastPiece, setLastPiece,
    signInAs, signOut, sendPostcard, markRead, refreshMine, refreshTree,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
