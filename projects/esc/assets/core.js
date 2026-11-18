/* Recreo — core.js
 * Utilidades compartidas: semilla diaria, PRNG determinístico, guardado local
 * y ranking compartido (Firestore, mismo proyecto que QuartzProde / El caso
 * de los tokens, con colección propia).
 *
 * Los puzzles del día salen de una semilla = fecha + juego, así que todas
 * las personas juegan exactamente el mismo tablero.
 */
(function (root) {
  const R = (root.Recreo = root.Recreo || {});

  /* ---------- Fecha del día (hora de Buenos Aires, igual para todos) ---------- */
  const LAUNCH = '2026-11-17';
  function todayKey(now = Date.now()) {
    return new Date(now - 3 * 3600e3).toISOString().slice(0, 10);
  }
  function dayNumber(key = todayKey()) {
    return Math.round((Date.parse(key) - Date.parse(LAUNCH)) / 864e5) + 1;
  }

  /* ---------- PRNG con semilla ---------- */
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    const r = mulberry32(xmur3(String(seed))());
    r.int = n => Math.floor(r() * n);
    r.pick = arr => arr[Math.floor(r() * arr.length)];
    r.shuffle = arr => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    };
    return r;
  }

  /* ---------- Formatos ---------- */
  const fmtTime = ms => {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const fmtScore = n => `${Number(n).toLocaleString('es-AR')} pts`;
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  Object.assign(R, { LAUNCH, todayKey, dayNumber, rng, fmtTime, fmtScore, norm, slug, esc });

  if (typeof document === 'undefined') return; // en node (tests) alcanza con lo de arriba

  /* ---------- Guardado local: jugador, resultados del día y racha ---------- */
  const KEY = 'esc.v1';
  let mem = { player: null, days: {} };
  try { mem = Object.assign(mem, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} };

  const store = {
    get player() { return mem.player; },
    setPlayer(name) {
      const clean = String(name || '').trim().replace(/\s+/g, ' ');
      mem.player = clean.length >= 3 ? { name: clean, id: slug(clean) } : null;
      save(); document.dispatchEvent(new CustomEvent('recreo:player'));
    },
    result(game, day = todayKey()) { return (mem.days[day] || {})[game] || null; },
    setResult(game, value, kind) {
      const day = todayKey();
      mem.days[day] = mem.days[day] || {};
      const prev = mem.days[day][game];
      const better = !prev || (kind === 'score' ? value > prev.value : false);
      if (better) mem.days[day][game] = { value, kind, at: Date.now() };
      save(); document.dispatchEvent(new CustomEvent('recreo:results'));
      return !prev;
    },
    playedToday() { return Object.keys(mem.days[todayKey()] || {}); },
    streak() {
      let n = 0, t = Date.now();
      if (!(mem.days[todayKey(t)] && Object.keys(mem.days[todayKey(t)]).length)) t -= 864e5; // si hoy no jugó, la racha sigue viva desde ayer
      while (mem.days[todayKey(t)] && Object.keys(mem.days[todayKey(t)]).length) { n++; t -= 864e5; }
      return n;
    }
  };
  R.store = store;

  /* ---------- Ranking compartido ---------- */
  const COL = 'esc_scores';
  let db = null;
  try {
    if (root.firebase) {
      const app = firebase.apps.find(a => a.name === 'recreo') || firebase.initializeApp({
        apiKey: 'AIzaSyBCt4aNLAiajTJIvM5CpVhQvnyiX15Vkqg', authDomain: 'quartzprode2026.firebaseapp.com',
        projectId: 'quartzprode2026', storageBucket: 'quartzprode2026.firebasestorage.app',
        messagingSenderId: '616224313629', appId: '1:616224313629:web:5cad77efab7eb2506b51f4'
      }, 'recreo');
      db = app.firestore();
    }
  } catch (e) { console.warn('Ranking no disponible', e); }

  const ranking = {
    rows: null, error: false, listeners: new Set(), unsub: null,
    subscribe(fn) {
      this.listeners.add(fn); fn(this);
      if (this.unsub) return;
      if (!db) { this.error = true; this.emit(); return; }
      this.unsub = db.collection(COL).where('date', '==', todayKey()).onSnapshot(
        snap => { this.rows = snap.docs.map(d => d.data()); this.error = false; this.emit(); },
        err => { console.warn(err); this.error = true; this.emit(); }
      );
    },
    emit() { this.listeners.forEach(fn => fn(this)); },
    list(game) {
      const def = R.games[game];
      return (this.rows || []).filter(r => r.game === game && typeof r.value === 'number')
        .sort((a, b) => def.kind === 'score' ? b.value - a.value : a.value - b.value);
    },
    position(game, playerId) { const i = this.list(game).findIndex(r => r.playerId === playerId); return i < 0 ? null : i + 1; },
    /* Puzzles: cuenta solo la primera partida del día. Teclazo: queda el mejor puntaje del día. */
    async submit(game, value) {
      const p = store.player, def = R.games[game];
      if (!p) return 'anon';
      if (!db) return 'error';
      const day = todayKey();
      const ref = db.collection(COL).doc(`${day}__${game}__${p.id}`);
      try {
        return await db.runTransaction(async tx => {
          const snap = await tx.get(ref);
          if (snap.exists) {
            if (def.kind === 'score' && value > snap.data().value) {
              tx.update(ref, { value, name: p.name, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
              return 'improved';
            }
            return 'exists';
          }
          tx.set(ref, { date: day, game, kind: def.kind, playerId: p.id, name: p.name, value, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
          return 'saved';
        });
      } catch (e) { console.warn('No se pudo guardar el resultado', e); return 'error'; }
    }
  };
  R.ranking = ranking;
})(typeof window !== 'undefined' ? window : globalThis);

/* ---------- La Q de QuartzSales hecha de triángulos (mascota y nave de Teclazo) ----------
 * Hexágono de 24 triángulos con el hueco de la cara en el centro y una "cola"
 * abajo a la derecha que lo convierte en Q. Cada triángulo tiene tres facetas
 * (luz, medio, sombra) para el efecto de gema, y todo lleva el gradiente del isotipo.
 */
(function (root) {
  const R = root.Recreo;
  const s = 20, h = s * Math.sqrt(3) / 2, p = 3, X0 = s / 2 + p;
  const W = 4 * s + 2 * p, H = 5 * h + 2 * p;
  const up = (x, y) => [[x, y + h], [x + s, y + h], [x + s / 2, y]];
  const down = (x, y) => [[x, y], [x + s, y], [x + s / 2, y + h]];
  const tris = [], hole = [];
  const add = t => tris.push(t);
  // fila 0: ▲▼▲▼▲
  for (let k = 0; k < 5; k++) add(k % 2 ? down(X0 + ((k - 1) / 2) * s + s / 2, p) : up(X0 + (k / 2) * s, p));
  // fila 1: ▲▼▲▼▲▼▲ sin el centro (cara)
  for (let k = 0; k < 7; k++) { const t = k % 2 ? down(X0 + ((k - 1) / 2) * s, p + h) : up(X0 - s / 2 + (k / 2) * s, p + h); (k >= 2 && k <= 4 ? hole : tris).push(t); }
  // fila 2: ▼▲▼▲▼▲▼ sin los dos ▼ del medio
  for (let k = 0; k < 7; k++) { const t = k % 2 ? up(X0 + ((k - 1) / 2) * s, p + 2 * h) : down(X0 - s / 2 + (k / 2) * s, p + 2 * h); (k === 2 || k === 4 ? hole : tris).push(t); }
  // fila 3: ▼▲▼▲▼
  for (let k = 0; k < 5; k++) add(k % 2 ? up(X0 + s / 2 + ((k - 1) / 2) * s, p + 3 * h) : down(X0 + (k / 2) * s, p + 3 * h));
  // cola de la Q
  add(down(X0 + 1.5 * s, p + 4 * h));

  const shrink = (t, f) => { const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3; return { c: [cx, cy], v: t.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f]) }; };
  const pt = a => a.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

  R.qSvg = function ({ id = 'q', face = true, cls = '', faceFill = '' } = {}) {
    const g = `${id}-g`;
    const body = tris.map(t => {
      const { c, v } = shrink(t, 0.8);
      const facets = [[v[0], v[2], 'rgba(255,255,255,.30)'], [v[1], v[2], 'rgba(255,255,255,0)'], [v[0], v[1], 'rgba(19,13,93,.18)']];
      return `<polygon points="${pt(v)}" fill="url(#${g})" stroke="url(#${g})" stroke-width="1.5" stroke-linejoin="round"/>` +
        facets.map(([a, b, col]) => `<polygon points="${pt([a, b, c])}" fill="${col}"/>`).join('');
    }).join('');
    // sobre fondos oscuros el hueco de la cara se rellena para que los ojos se lean
    // sobre fondos oscuros va una placa clara detrás (como la Q sobre fondo lila), así la cara y los ojos se leen
    const plate = [[X0 + s / 2, p], [X0 + 2.5 * s, p], [X0 + 3.5 * s, p + 2 * h], [X0 + 2.5 * s, p + 4 * h], [X0 + 2.5 * s, p + 4 * h], [X0 + 2 * s, p + 5 * h], [X0 + 1.5 * s, p + 4 * h], [X0 + s / 2, p + 4 * h], [X0 - s / 2, p + 2 * h]];
    const fill = faceFill ? `<polygon points="${pt(plate)}" fill="${faceFill}" stroke="${faceFill}" stroke-width="3" stroke-linejoin="round"/>` : '';
    const fx = X0 + 1.5 * s, fy = p + h;
    const faceSvg = face ? `
      <g class="eyes-open">
        <circle cx="${fx - 0.34 * s}" cy="${fy + 0.42 * h}" r="${0.2 * s}" fill="#fff"/><circle cx="${fx + 0.34 * s}" cy="${fy + 0.42 * h}" r="${0.2 * s}" fill="#fff"/>
        <g class="pupils"><circle cx="${fx - 0.34 * s}" cy="${fy + 0.44 * h}" r="${0.125 * s}" fill="#130D5D"/><circle cx="${fx + 0.34 * s}" cy="${fy + 0.44 * h}" r="${0.125 * s}" fill="#130D5D"/>
        <circle cx="${fx - 0.3 * s}" cy="${fy + 0.36 * h}" r="${0.045 * s}" fill="#fff"/><circle cx="${fx + 0.38 * s}" cy="${fy + 0.36 * h}" r="${0.045 * s}" fill="#fff"/></g>
      </g>
      <g class="eyes-closed" opacity="0" stroke="#130D5D" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M${fx - 0.48 * s} ${fy + 0.44 * h}q${0.14 * s} ${0.12 * s} ${0.28 * s} 0"/><path d="M${fx + 0.2 * s} ${fy + 0.44 * h}q${0.14 * s} ${0.12 * s} ${0.28 * s} 0"/></g>
      <ellipse cx="${fx - 0.53 * s}" cy="${fy + 0.74 * h}" rx="${0.14 * s}" ry="${0.075 * s}" fill="#ff9fbf" opacity=".85"/><ellipse cx="${fx + 0.53 * s}" cy="${fy + 0.74 * h}" rx="${0.14 * s}" ry="${0.075 * s}" fill="#ff9fbf" opacity=".85"/>
      <path class="mouth" d="M${fx - 0.16 * s} ${fy + 0.7 * h}q${0.16 * s} ${0.16 * s} ${0.32 * s} 0" stroke="#130D5D" stroke-width="1.6" stroke-linecap="round" fill="none"/>` : '';
    return `<svg class="${cls}" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W.toFixed(1)}" y2="${H.toFixed(1)}"><stop offset="0" stop-color="#3C9FF1"/><stop offset=".03" stop-color="#3C96EF"/><stop offset=".42" stop-color="#463DE1"/><stop offset=".6" stop-color="#5932E0"/><stop offset=".83" stop-color="#6A28E0"/><stop offset="1" stop-color="#7025E0"/></linearGradient></defs>${fill}${body}${faceSvg}</svg>`;
  };
  R.qSize = { W, H };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---------- Logo ESC: tecla con volumen ----------
 * Base oscura (el costado de la tecla) + cara superior con el gradiente de
 * QuartzSales + bisel interno. Las letras son trazos redondeados (no dependen
 * de una fuente), así el logo se ve igual en el favicon o en un PNG.
 */
(function (root) {
  const R = root.Recreo;
  R.escSvg = function ({ id = 'esc', cls = '' } = {}) {
    return `<svg class="${cls}" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ESC">
  <defs>
    <linearGradient id="${id}-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3C9FF1"/><stop offset=".42" stop-color="#463DE1"/><stop offset=".6" stop-color="#5932E0"/><stop offset="1" stop-color="#7025E0"/></linearGradient>
    <linearGradient id="${id}-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d9e"/><stop offset="1" stop-color="#130D5D"/></linearGradient>
    <linearGradient id="${id}-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <ellipse class="esc-shadow" cx="60" cy="95" rx="50" ry="4" fill="#130D5D" opacity=".18"/>
  <rect x="4" y="14" width="112" height="78" rx="22" fill="url(#${id}-side)"/>
  <g class="esc-cap">
    <rect x="4" y="4" width="112" height="76" rx="22" fill="url(#${id}-top)"/>
    <rect x="11" y="9" width="98" height="62" rx="17" fill="url(#${id}-shine)"/>
    <rect x="11" y="9" width="98" height="62" rx="17" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.5"/>
    <g fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M38 29H25v26h13M25 42h11"/>
      <path d="M62 32.5c-2.6-3.6-13.4-4.4-14 1.8-.7 7.4 14.6 5.2 14.2 13.2-.4 7.2-11.6 7.6-15.2 3.4"/>
      <path d="M96 33.5a13.2 13.2 0 1 0 0 17"/>
    </g>
  </g>
</svg>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);
