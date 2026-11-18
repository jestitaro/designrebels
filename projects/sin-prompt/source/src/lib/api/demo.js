// ─────────────────────────────────────────────────────────────────────────────
// ADAPTADOR DEMO
// Todo se guarda en localStorage de ESTE navegador. No se comparte con nadie.
// Replica las validaciones que en producción hace el servidor (ver
// supabase/schema.sql) para que la experiencia se comporte igual, pero no
// reemplaza esa seguridad: en demo cualquiera puede elegir cualquier nombre.
// ─────────────────────────────────────────────────────────────────────────────
import { PARTICIPANTS, DEMO_ASSIGNMENT_SEED } from '../../config/participants.js';
import { buildAssignments, seededShuffle } from '../assign.js';
import { POSTCARDS } from '../../config/postcards.js';

const KEY = 'sinprompt.demo.v1';
const MIN_BODY = 12;
const MAX_BODY = 600;

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* almacenamiento bloqueado: seguimos en memoria */
  }
  return { meId: null, messages: [], runs: {}, scores: {}, seededFor: [], seededWorld: false, read: {} };
}
let db = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* sin persistencia, pero la sesión sigue funcionando */
  }
}

const assignments = buildAssignments(
  PARTICIPANTS.map((p) => p.id),
  DEMO_ASSIGNMENT_SEED,
);
const giverOf = (receiverId) => Object.keys(assignments).find((g) => assignments[g] === receiverId);
const byId = (id) => PARTICIPANTS.find((p) => p.id === id);

// ── Datos de ejemplo ────────────────────────────────────────────────────────
const SAMPLE_BODIES = [
  'No sé si te lo dije alguna vez, pero cada vez que algo se rompía un viernes, vos ya lo estabas mirando antes de que yo terminara de escribir el mensaje. Gracias por eso. Y perdón por los viernes.',
  'Este año aprendí que "lo vemos después", dicho por vos, significa "ya está resuelto". Gracias por la paciencia y por los audios de cuatro minutos que siempre valieron la pena.',
  'Te debo como tres cafés y una explicación de por qué se cayó staging en marzo. Lo primero te lo pago en enero. Lo segundo, nunca.',
  'Trabajar con vos hace que los lunes parezcan martes. No es mucho, pero es algo. Felices fiestas.',
  'Gracias por preguntar "¿y esto para qué le sirve a la gente?" justo cuando todos estábamos enamorados de una idea mala.',
  'Me salvaste una demo, dos entregas y un mal día. El mal día fue el más importante.',
  'Que el 2027 te traiga menos urgencias "rapiditas" y más mates largos. Gracias por bancar cada cosa que llegó un jueves a las 17:58.',
  'Escribo esto sin autocorrector emocional: sos de las personas que hacen que esto se sienta un equipo y no un organigrama.',
  'Gracias por explicarme lo mismo tres veces sin cambiar la cara. Bueno, la tercera un poquito.',
  'No tengo una frase linda preparada. Tengo un año entero de cosas que salieron bien porque estabas vos. Con eso alcanza.',
];

function makeSample({ sender, recipient, slot, i, visibility }) {
  const roleCards = POSTCARDS.filter((c) => c.roles.includes(byId(recipient)?.roleKey));
  const pool = roleCards.length ? roleCards : POSTCARDS;
  const card = pool[i % pool.length];
  return {
    id: 'sample-' + uid(),
    slot,
    senderId: sender,
    recipientId: recipient,
    kind: 'design',
    designId: card.id,
    drawing: null,
    body: SAMPLE_BODIES[i % SAMPLE_BODIES.length],
    visibility,
    createdAt: new Date(Date.now() - (i + 2) * 3600e3 * 7).toISOString(),
    isSample: true,
  };
}

function seedWorld(meId) {
  if (db.seededWorld) return;
  const others = seededShuffle(
    PARTICIPANTS.map((p) => p.id).filter((id) => id !== meId),
    'muestra',
  );
  const msgs = [];
  // 6 saludos "del destino" coherentes con el sorteo (sin que el remitente sea yo).
  others.slice(0, 6).forEach((sender, i) => {
    msgs.push(
      makeSample({ sender, recipient: assignments[sender], slot: 'destino', i, visibility: i % 3 === 2 ? 'private' : 'public' }),
    );
  });
  // 3 saludos elegidos libremente.
  others.slice(6, 9).forEach((sender, i) => {
    const recipient = others[(i + 2) % others.length] === sender ? others[0] : others[(i + 2) % others.length];
    msgs.push(makeSample({ sender, recipient, slot: 'eleccion', i: i + 6, visibility: 'public' }));
  });
  db.messages.push(...msgs);
  // Ranking de ejemplo.
  const times = [38420, 44910, 47280, 52630, 58100, 63770, 71240];
  others.slice(2, 9).forEach((pid, i) => {
    db.scores[pid] = { ms: times[i], isSample: true, at: new Date().toISOString() };
  });
  db.seededWorld = true;
}

function seedReceived(meId) {
  if (db.seededFor.includes(meId)) return;
  const already = db.messages.filter((m) => m.recipientId === meId);
  const needed = Math.max(0, 2 - already.length);
  const giver = giverOf(meId);
  const extra = [];
  if (needed > 0 && !db.messages.some((m) => m.senderId === giver && m.slot === 'destino')) {
    extra.push(makeSample({ sender: giver, recipient: meId, slot: 'destino', i: 7, visibility: 'private' }));
  }
  if (needed - extra.length > 0) {
    const sender = PARTICIPANTS.map((p) => p.id).find(
      (id) => id !== meId && id !== giver && !db.messages.some((m) => m.senderId === id && m.slot === 'eleccion'),
    );
    if (sender) extra.push(makeSample({ sender, recipient: meId, slot: 'eleccion', i: 9, visibility: 'public' }));
  }
  db.messages.push(...extra);
  db.seededFor.push(meId);
}

// ── Helpers de forma ────────────────────────────────────────────────────────
const publicShape = (m) => ({
  ...m,
  sender: byId(m.senderId),
  recipient: byId(m.recipientId),
});

function requireMe() {
  if (!db.meId) throw new ApiError('Primero decinos quién sos.', 'auth');
  return db.meId;
}

export class ApiError extends Error {
  constructor(message, code = 'error') {
    super(message);
    this.code = code;
  }
}

// ── API ─────────────────────────────────────────────────────────────────────
export const demoApi = {
  mode: 'demo',

  async listParticipants() {
    await delay(80);
    return PARTICIPANTS;
  },

  async getSession() {
    return db.meId ? { participant: byId(db.meId) } : null;
  },

  /** Demo: identificación por nombre (sin verificación). */
  async signInAs(participantId) {
    await delay(250);
    if (!byId(participantId)) throw new ApiError('No encontramos a esa persona en el listado.');
    db.meId = participantId;
    seedWorld(participantId);
    seedReceived(participantId);
    save();
    return { participant: byId(participantId) };
  },

  async signOut() {
    db.meId = null;
    save();
  },

  async getMyAssignment() {
    const me = requireMe();
    await delay(300);
    return byId(assignments[me]);
  },

  async getMyMessages() {
    const me = requireMe();
    await delay(120);
    return {
      sent: db.messages.filter((m) => m.senderId === me).map(publicShape),
      received: db.messages
        .filter((m) => m.recipientId === me)
        .map((m) => ({ ...publicShape(m), read: !!db.read[m.id] })),
    };
  },

  async markRead(messageId) {
    db.read[messageId] = true;
    save();
  },

  async sendPostcard({ slot, recipientId, kind, designId, drawing, body, visibility }) {
    const me = requireMe();
    await delay(500);
    const text = (body || '').trim();
    if (!['destino', 'eleccion'].includes(slot)) throw new ApiError('Tipo de saludo inválido.');
    if (recipientId === me) throw new ApiError('No podés mandarte una postal a vos.');
    if (!byId(recipientId)) throw new ApiError('Esa persona no está en el listado.');
    if (slot === 'destino' && assignments[me] !== recipientId)
      throw new ApiError('El destino ya eligió por vos. Este saludo va para otra persona.');
    if (db.messages.some((m) => m.senderId === me && m.slot === slot))
      throw new ApiError('Ya enviaste este saludo.', 'duplicate');
    if (text.length < MIN_BODY) throw new ApiError(`Escribí al menos ${MIN_BODY} caracteres.`);
    if (text.length > MAX_BODY) throw new ApiError(`Máximo ${MAX_BODY} caracteres.`);
    if (kind === 'drawing' && !drawing) throw new ApiError('Falta el dibujo.');
    if (kind === 'design' && !POSTCARDS.some((c) => c.id === designId)) throw new ApiError('Elegí una postal.');
    const msg = {
      id: uid(),
      slot,
      senderId: me,
      recipientId,
      kind,
      designId: kind === 'design' ? designId : null,
      drawing: kind === 'drawing' ? drawing : null,
      body: text,
      visibility: visibility === 'public' ? 'public' : 'private',
      createdAt: new Date().toISOString(),
      isSample: false,
    };
    db.messages.push(msg);
    save();
    return publicShape(msg);
  },

  async getTree() {
    await delay(150);
    const total = PARTICIPANTS.length * 2;
    const pieces = [...db.messages]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((m, i) => ({
        id: m.id,
        order: i,
        visibility: m.visibility,
        // Las privadas no revelan quién le escribió a quién.
        from: m.visibility === 'public' ? byId(m.senderId)?.name : null,
        to: m.visibility === 'public' ? byId(m.recipientId)?.name : null,
        mine: m.senderId === db.meId,
        isSample: m.isSample,
      }));
    return { total, placed: pieces.length, pieces };
  },

  async getGallery() {
    await delay(150);
    return db.messages
      .filter((m) => m.visibility === 'public')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(publicShape);
  },

  async startGame() {
    const me = requireMe();
    const runId = uid();
    db.runs = { [runId]: { pid: me, startedAt: Date.now() } };
    save();
    return { runId };
  },

  async finishGame(runId) {
    const me = requireMe();
    const run = db.runs?.[runId];
    if (!run || run.pid !== me) throw new ApiError('Esta partida no es válida. Probá de nuevo.');
    const ms = Date.now() - run.startedAt;
    delete db.runs[runId];
    if (ms < 8000) throw new ApiError('Eso fue demasiado rápido para ser humano.');
    const prev = db.scores[me];
    const improved = !prev || prev.isSample || ms < prev.ms;
    if (improved) db.scores[me] = { ms, isSample: false, at: new Date().toISOString() };
    save();
    const board = await this.getLeaderboard();
    const rank = board.findIndex((r) => r.participant.id === me) + 1;
    return { ms, best: db.scores[me].ms, improved, rank, total: board.length };
  },

  async getLeaderboard() {
    await delay(100);
    return Object.entries(db.scores)
      .map(([pid, s]) => ({ participant: byId(pid), ms: s.ms, isSample: s.isSample }))
      .filter((r) => r.participant)
      .sort((a, b) => a.ms - b.ms);
  },

  /** Solo demo: borra todo lo guardado en este navegador. */
  async resetDemo() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nada */
    }
    db = load();
  },
};
