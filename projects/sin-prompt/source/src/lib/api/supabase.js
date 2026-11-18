// ─────────────────────────────────────────────────────────────────────────────
// ADAPTADOR SUPABASE (producción)
// Se activa solo si existen VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
// Toda la lógica sensible (sorteo, permisos, privacidad, tiempos del juego)
// la resuelve el servidor con RLS + funciones RPC definidas en
// supabase/schema.sql. Este archivo solo llama a esas funciones.
//
// Identificación: link mágico al mail de cada integrante. El listado de mails
// habilitados vive en `participants.email`; elegir un nombre NO alcanza.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { ApiError } from './demo.js';

const BUCKET = 'drawings';

const mapParticipant = (p) =>
  p && { id: p.id, name: p.name, role: p.role, roleKey: p.role_key };

export function createSupabaseApi(url, anonKey) {
  const sb = createClient(url, anonKey, {
    auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' },
  });

  const rpc = async (fn, args) => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new ApiError(error.message || 'Algo falló del lado del servidor.', error.code);
    return data;
  };

  const signedDrawing = async (path) => {
    if (!path) return null;
    const { data } = await sb.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    return data?.signedUrl || null;
  };

  const mapMessage = async (m) => ({
    id: m.id,
    slot: m.slot,
    senderId: m.sender_id,
    recipientId: m.recipient_id,
    sender: mapParticipant(m.sender),
    recipient: mapParticipant(m.recipient),
    kind: m.kind,
    designId: m.design_id,
    drawing: m.kind === 'drawing' ? await signedDrawing(m.drawing_path) : null,
    body: m.body,
    visibility: m.visibility,
    createdAt: m.created_at,
    read: !!m.read_at,
    isSample: false,
  });

  return {
    mode: 'supabase',

    async listParticipants() {
      const data = await rpc('list_participants');
      return data.map(mapParticipant);
    },

    async getSession() {
      const { data } = await sb.auth.getSession();
      if (!data.session) return null;
      // `claim_me` vincula el usuario autenticado con su fila en participants
      // comparando el mail verificado. Si el mail no está habilitado, falla.
      const me = await rpc('claim_me');
      return me ? { participant: mapParticipant(me) } : null;
    },

    async signInWithEmail(email) {
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true, emailRedirectTo: window.location.href.split('#')[0] },
      });
      if (error) throw new ApiError('No pudimos mandarte el link. Revisá el mail e intentá de nuevo.');
      return { sent: true };
    },

    async signOut() {
      await sb.auth.signOut();
    },

    async getMyAssignment() {
      return mapParticipant(await rpc('get_my_assignment'));
    },

    async getMyMessages() {
      const data = await rpc('get_my_messages');
      return {
        sent: await Promise.all((data.sent || []).map(mapMessage)),
        received: await Promise.all((data.received || []).map(mapMessage)),
      };
    },

    async markRead(messageId) {
      await rpc('mark_read', { p_message_id: messageId });
    },

    async sendPostcard({ slot, recipientId, kind, designId, drawing, body, visibility }) {
      let drawingPath = null;
      if (kind === 'drawing') {
        const me = (await this.getSession())?.participant;
        const blob = await (await fetch(drawing)).blob();
        drawingPath = `${me.id}/${crypto.randomUUID()}.png`;
        const { error } = await sb.storage.from(BUCKET).upload(drawingPath, blob, { contentType: 'image/png' });
        if (error) throw new ApiError('No pudimos subir el dibujo. Probá de nuevo.');
      }
      const row = await rpc('send_postcard', {
        p_slot: slot,
        p_recipient_id: recipientId,
        p_kind: kind,
        p_design_id: designId || null,
        p_drawing_path: drawingPath,
        p_body: body,
        p_visibility: visibility,
      });
      return mapMessage(row);
    },

    async getTree() {
      const data = await rpc('tree_state');
      return {
        total: data.total,
        placed: data.pieces.length,
        pieces: data.pieces.map((p, i) => ({
          id: p.id,
          order: i,
          visibility: p.visibility,
          from: p.from_name,
          to: p.to_name,
          mine: p.mine,
        })),
      };
    },

    async getGallery() {
      const data = await rpc('public_gallery');
      return Promise.all(data.map(mapMessage));
    },

    async startGame() {
      const runId = await rpc('start_game');
      return { runId };
    },

    async finishGame(runId) {
      const r = await rpc('finish_game', { p_run_id: runId });
      return { ms: r.ms, best: r.best_ms, improved: r.improved, rank: r.rank, total: r.total };
    },

    async getLeaderboard() {
      const data = await rpc('leaderboard');
      return data.map((r) => ({ participant: mapParticipant(r.participant), ms: r.best_ms }));
    },
  };
}
