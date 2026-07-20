/* QS League — DinoCoin Arena
   Single clean state model: roster + imports + manual ledger.
   Standings are always *derived* (computeStandings), never mutated in place,
   so there is nothing to reconcile or migrate between sessions. */

const STORAGE = 'qs-league-v3';
const RULES_STORAGE = 'qs-league-rules-v3';

/* ---------- helpers ---------- */
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const fmt = value => new Intl.NumberFormat('es-AR').format(value || 0);
const norm = value => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const clone = value => JSON.parse(JSON.stringify(value));
const fa = (name, className = '') => `<i class="fa-solid ${name} ${className}" aria-hidden="true"></i>`;
const medalIcon = key => fa('fa-medal', `medal-ico medal-${key}`);
const initials = value => String(value || 'QS').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || 'QS';

/* ---------- roster & houses ---------- */
const HOUSES = {
  slytherin: { name: 'Slytherin', color: 'var(--slytherin)' },
  hufflepuff: { name: 'Hufflepuff', color: 'var(--hufflepuff)' },
  ravenclaw: { name: 'Ravenclaw', color: 'var(--ravenclaw)' },
  gryffindor: { name: 'Gryffindor', color: 'var(--gryffindor)' },
  sincasa: { name: 'Sin casa', color: 'var(--sincasa)' }
};

/* Houses pulled from quartzsales.com/hogquartz/salacomun/ (screenshots, 2026-07-17). */
const ROSTER = [
  { id: 'agustin', name: 'Agustin', fullName: 'Agustin Goñi Piuma', role: 'Director Comercial', house: 'slytherin', aliases: ['Agustin', 'Agustín', 'Agus', 'Agustin Goñi Piuma'] },
  { id: 'alejandro', name: 'Ale', fullName: 'Alejandro Frank', role: '', house: 'hufflepuff', aliases: ['Ale', 'Alejandro', 'Alejandro Frank', '8706743-ale'] },
  { id: 'eugenio', name: 'Euge', fullName: 'Eugenio Balbastro Fages', role: 'Líder técnico', house: 'ravenclaw', aliases: ['Euge', 'Eugenio', 'Eugenio Balbastro Fages', '8706743'] },
  { id: 'javi', name: 'Javi', fullName: 'Javier De Vergilio', role: '', house: 'gryffindor', aliases: ['Javi', 'Javier', 'Javier De Vergilio'] },
  { id: 'jesica', name: 'Jesi', fullName: 'Jesica Titaro', role: 'Rebel Designer', house: 'gryffindor', aliases: ['Jesi', 'Jess', 'Jesica', 'Jesica Titaro'] },
  { id: 'juli', name: 'Juli', fullName: 'Juli Piccioni', role: '', house: 'ravenclaw', aliases: ['Juli', 'July', 'Picci', 'Juli Piccioni'] },
  { id: 'lucrecia', name: 'Lucre', fullName: 'Lucrecia Moralejo', role: '', house: 'hufflepuff', aliases: ['Lucre', 'Luly', 'Luli', 'Lucrecia', 'Lucrecia Moralejo'] },
  { id: 'mayra', name: 'May', fullName: 'Mayra Milanesio', role: '', house: 'gryffindor', aliases: ['May', 'Mayra', 'Mayra Milanesio'] },
  { id: 'nico', name: 'Nico', fullName: 'Nicolas Rivero Segura', role: 'Integrator / COO', house: 'slytherin', aliases: ['Nico', 'Nicolas', 'Nicolás', 'Nicolas Rivero Segura'] },
  { id: 'pablo', name: 'Pablo', fullName: 'Pablo Hernan Gimenez', role: 'Visionary / CEO', house: 'slytherin', aliases: ['Pablo', 'Hero', 'Heror', 'Pablo Hernan Gimenez', 'Pablo Gimenez'] },
  { id: 'sebas', name: 'Sebas', fullName: 'Sebastian Carnota', role: '', house: 'ravenclaw', aliases: ['Sebas', 'Seba', 'Sebastian', 'Sebastian Carnota'] }
];

/* Season 02 base reports — matches REGLAS.md §10 (no retroactive penalties). */
const SEED_IMPORTS = [
  {
    id: 'seed-20260702', session: '02 de julio 2026', date: '2026-07-02', ts: '2026-07-02T12:00:00.000Z', moderator: 'alejandro',
    rows: [
      { rank: 1, playerId: 'mayra', nickname: 'May', score: 13157, correct: 15 },
      { rank: 2, playerId: 'javi', nickname: 'Javi', score: 12973, correct: 13 },
      { rank: 3, playerId: 'nico', nickname: 'Nico', score: 11460, correct: 11 },
      { rank: 4, playerId: '', nickname: 'Tuki', score: 11097, correct: 14 },
      { rank: 5, playerId: 'jesica', nickname: 'Jesi', score: 10748, correct: 13 },
      { rank: 6, playerId: 'sebas', nickname: 'Sebas', score: 10199, correct: 12 },
      { rank: 7, playerId: 'eugenio', nickname: '8706743', score: 8698, correct: 10 }
    ],
    absences: []
  },
  {
    id: 'seed-20260716', session: '16 de julio 2026', date: '2026-07-16', ts: '2026-07-16T12:00:00.000Z', moderator: 'sebas',
    rows: [
      { rank: 1, playerId: 'javi', nickname: 'Javi', score: 9771, correct: 12 },
      { rank: 2, playerId: 'mayra', nickname: 'May', score: 7485, correct: 10 },
      { rank: 3, playerId: 'pablo', nickname: 'Heror', score: 6963, correct: 9 },
      { rank: 4, playerId: '', nickname: 'Tuki', score: 6893, correct: 9 },
      { rank: 5, playerId: 'lucrecia', nickname: 'Luly', score: 5660, correct: 8 },
      { rank: 6, playerId: 'juli', nickname: 'Picci', score: 5399, correct: 7 },
      { rank: 7, playerId: 'nico', nickname: 'Nico', score: 5371, correct: 7 },
      { rank: 8, playerId: 'alejandro', nickname: 'Ale', score: 3953, correct: 6 }
    ],
    absences: []
  }
];

const LEGENDS = {
  label: 'Enero-junio 2026',
  dates: 19,
  note: 'Primer semestre cerrado. Cuenta solo ganadores; no suma plata ni bronce. Los meteoritos empiezan desde Season 02.',
  winners: [
    { name: 'Pablo', wins: 5 }, { name: 'Nico', wins: 4 }, { name: 'Jesi', wins: 3 },
    { name: 'Javi', wins: 2 }, { name: 'Tuki', wins: 2 }, { name: 'Sebas', wins: 2 },
    { name: 'Lucre', wins: 1 }, { name: 'May', wins: 0 }, { name: 'Euge', wins: 0 }, { name: 'Ale', wins: 0 }
  ],
  history: [
    { date: '08/01', winner: 'Pablo', score: 6971, moderator: 'Lucrecia' },
    { date: '29/01', winner: 'Javi', score: 7491, moderator: 'Jesi' },
    { date: '05/02', winner: 'Tuki', score: 15916, moderator: 'Sin identificar' },
    { date: '12/02', winner: 'Pablo', score: 9969, moderator: 'Lucre' },
    { date: '26/02', winner: 'Jesi', score: 12242, moderator: 'Euge' },
    { date: '05/03', winner: 'Tuki', score: 12950, moderator: 'Euge' },
    { date: '19/03', winner: 'Sebas', score: 7682, moderator: 'Jesi' },
    { date: '26/03', winner: 'Javi', score: 13041, moderator: 'May' },
    { date: '09/04', winner: 'Lucre', score: 20642, moderator: 'Euge' },
    { date: '16/04', winner: 'Nico', score: 11538, moderator: 'Agustín' },
    { date: '23/04', winner: 'Pablo', score: 13782, moderator: 'Ale' },
    { date: '07/05', winner: 'Nico', score: 5503, moderator: 'Jesi' },
    { date: '14/05', winner: 'Jesi', score: 15625, moderator: 'Ale' },
    { date: '21/05', winner: 'Jesi', score: 9956, moderator: 'Euge' },
    { date: '28/05', winner: 'Nico', score: 16025, moderator: 'Sebas' },
    { date: '04/06', winner: 'Pablo', score: 11159, moderator: 'Sebas' },
    { date: '11/06', winner: 'Sebas', score: 7855, moderator: 'May' },
    { date: '18/06', winner: 'Pablo', score: 10716, moderator: 'Euge' },
    { date: '25/06', winner: 'Nico', score: 9306, moderator: 'Sebas' }
  ]
};

const DEFAULT_RULES = [
  { title: 'Puntaje por Kahoot', body: 'Cada informe reparte 1° +3, 2° +2 y 3° +1 DinoCoin. El resto del ranking aparece pero no suma esa fecha.' },
  { title: 'Moderador', body: 'Cada fecha tiene un moderador que no compite, no suma puntos y no cuenta como ausente esa fecha.' },
  { title: 'Ausencias y meteoritos', body: 'Cada ausente oficial suma +1 meteorito. Avisando 24 h antes resta 1 DinoCoin; sin aviso resta 3.' },
  { title: 'Ajustes manuales', body: 'Sumar o restar DinoCoins y meteoritos siempre requiere un motivo, y queda en la actividad.' },
  { title: 'Leyendas', body: 'Los semestres cerrados pasan a Leyendas contando solo ganadores, sin meteoritos retroactivos.' }
];

/* ---------- award table ---------- */
function award(rank) {
  if (rank === 1) return { delta: 3, key: 'gold', label: 'Oro +3' };
  if (rank === 2) return { delta: 2, key: 'silver', label: 'Plata +2' };
  if (rank === 3) return { delta: 1, key: 'bronze', label: 'Bronce +1' };
  return { delta: 0, key: null, label: '—' };
}
function absencePenalty(kind) { return kind === 'notice' ? 1 : kind === 'no_notice' ? 3 : 0; }
function absenceLabel(kind) { return kind === 'notice' ? 'Avisó 24 h antes' : kind === 'no_notice' ? 'Sin aviso' : ''; }

/* ---------- state ---------- */
let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE)) || {};
    return {
      customPlayers: Array.isArray(saved.customPlayers) ? saved.customPlayers : [],
      imports: Array.isArray(saved.imports) && saved.imports.length ? saved.imports : clone(SEED_IMPORTS),
      manual: Array.isArray(saved.manual) ? saved.manual : [],
      pending: null,
      pendingMeta: null,
      pendingAbsenceChoices: {}
    };
  } catch {
    return { customPlayers: [], imports: clone(SEED_IMPORTS), manual: [], pending: null, pendingMeta: null, pendingAbsenceChoices: {} };
  }
}
function persist() {
  localStorage.setItem(STORAGE, JSON.stringify({ customPlayers: state.customPlayers, imports: state.imports, manual: state.manual }));
  if (typeof window.qsDbSaveState === 'function') {
    window.qsDbSaveState(state).catch(error => {
      console.warn('QS League: no pude sincronizar con la base compartida.', error);
      toast('No se pudo sincronizar con la base compartida. Se guardó localmente.');
    });
  }
}

/* ---------- shared cloud sync (Firestore) ---------- */
let cloudDocSeen = false;
function initCloudSync() {
  if (typeof window.qsDbSubscribe !== 'function') return;
  window.qsDbSubscribe(data => {
    if (data) {
      state.imports = Array.isArray(data.imports) && data.imports.length ? data.imports : state.imports;
      state.manual = Array.isArray(data.manual) ? data.manual : state.manual;
      state.customPlayers = Array.isArray(data.customPlayers) ? data.customPlayers : state.customPlayers;
      localStorage.setItem(STORAGE, JSON.stringify({ customPlayers: state.customPlayers, imports: state.imports, manual: state.manual }));
      render();
    } else if (!cloudDocSeen && typeof window.qsDbSaveState === 'function') {
      window.qsDbSaveState(state).catch(error => console.warn('QS League: no pude inicializar la base compartida.', error));
    }
    cloudDocSeen = true;
  });
}
function players() { return [...ROSTER, ...state.customPlayers]; }
function player(id) { return players().find(item => item.id === id); }
function house(id) { return HOUSES[id] || HOUSES.sincasa; }

/* ---------- pure standings engine ---------- */
function computeStandings() {
  const totals = new Map(players().map(p => [p.id, { coins: 0, medals: { gold: 0, silver: 0, bronze: 0 }, meteorites: 0 }]));
  const ledger = [];
  const ensure = id => { if (!totals.has(id)) totals.set(id, { coins: 0, medals: { gold: 0, silver: 0, bronze: 0 }, meteorites: 0 }); return totals.get(id); };

  state.imports.forEach(imp => {
    const rows = (imp.rows || [])
      .filter(row => row.playerId && row.playerId !== imp.moderator)
      .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
      .map((row, index) => ({ ...row, rank: index + 1 }));
    rows.forEach(row => {
      const prize = award(row.rank);
      if (!prize.delta) return;
      const total = ensure(row.playerId);
      total.coins += prize.delta;
      total.medals[prize.key] += 1;
      ledger.push({ ts: imp.ts, type: 'dino', player: row.playerId, delta: prize.delta, reason: `${imp.session}: ${prize.label}` });
    });
    (imp.absences || []).forEach(absence => {
      const total = ensure(absence.id);
      total.meteorites += 1;
      ledger.push({ ts: imp.ts, type: 'meteor', player: absence.id, delta: 1, reason: `Ausencia en ${imp.session} · ${absence.label}. Moderador: ${player(imp.moderator)?.name || '—'}.` });
      if (absence.penalty) {
        total.coins -= absence.penalty;
        ledger.push({ ts: imp.ts, type: 'dino', player: absence.id, delta: -absence.penalty, reason: `Penalización por ausencia en ${imp.session}.` });
      }
    });
  });

  state.manual.forEach(entry => {
    const total = ensure(entry.player);
    if (entry.kind === 'meteor') total.meteorites = Math.max(0, total.meteorites + entry.delta);
    else total.coins += entry.delta;
    ledger.push({ ts: entry.ts, type: entry.kind === 'meteor' ? 'meteor' : 'dino', player: entry.player, delta: entry.delta, reason: entry.reason });
  });

  ledger.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return { totals, ledger };
}
function standingsPlayers() {
  const { totals } = computeStandings();
  return players()
    .map(p => ({ ...p, ...totals.get(p.id) }))
    .sort((a, b) => (b.coins - a.coins) || (b.medals.gold - a.medals.gold) || (b.medals.silver - a.medals.silver) || (a.meteorites - b.meteorites) || a.name.localeCompare(b.name, 'es'));
}
function findPlayerByNickname(nick) {
  const n = norm(nick);
  if (!n) return null;
  return players().find(p => [p.id, p.name, p.fullName, ...(p.aliases || [])].some(alias => norm(alias) === n)) || null;
}

/* ---------- rendering ---------- */
function render() {
  renderHero();
  renderPodium();
  renderRanking();
  renderActivity();
  renderLegends();
  renderRules();
  renderAdjustPlayers();
  renderModeratorOptions();
  renderPreview();
}

function animateNumber(el, to) {
  if (!el) return;
  const from = Number(el.dataset.value || 0);
  if (from === to && el.textContent !== '0') { el.dataset.value = to; return; }
  el.dataset.value = to;
  const duration = 700;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = fmt(Math.round(from + (to - from) * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderHero() {
  const rows = standingsPlayers();
  const total = rows.reduce((sum, item) => sum + item.coins, 0);
  const meteors = rows.reduce((sum, item) => sum + item.meteorites, 0);
  const lastImport = [...state.imports].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  animateNumber($('#statCoins'), total);
  animateNumber($('#statPlayers'), rows.length);
  animateNumber($('#statMeteors'), meteors);
  if ($('#statLastDate')) $('#statLastDate').textContent = lastImport ? lastImport.date.split('-').reverse().join('/') : '—';
}

function podiumCard(item, rank) {
  const h = house(item.house);
  return `<article class="podium-card rank-${rank}" style="--house:${h.color}">
    ${rank === 1 ? fa('fa-crown', 'podium-crown') : ''}
    <span class="podium-rank">0${rank}</span>
    <div class="podium-avatar">${initials(item.name)}</div>
    <h3>${item.name}</h3>
    <p class="podium-role">${item.role || h.name}</p>
    <div class="mini-medals">${medalIcon('gold')}${item.medals.gold}<span></span>${medalIcon('silver')}${item.medals.silver}<span></span>${medalIcon('bronze')}${item.medals.bronze}</div>
    <div class="podium-coins">${fmt(item.coins)} ${fa('fa-coins')}</div>
  </article>`;
}
function renderPodium() {
  const container = $('#podiumGrid');
  if (!container) return;
  const top = standingsPlayers().filter(item => item.coins > 0 || item.medals.gold || item.medals.silver || item.medals.bronze).slice(0, 3);
  if (!top.length) {
    container.innerHTML = `<p class="empty-note">Todavía no hay puntajes. Subí el primer informe de Kahoot para inaugurar la arena.</p>`;
    container.classList.add('empty');
    return;
  }
  container.classList.remove('empty');
  const order = [1, 0, 2].filter(index => top[index]);
  container.innerHTML = order.map(index => podiumCard(top[index], index + 1)).join('');
}

function rankRow(item, index) {
  const h = house(item.house);
  return `<article class="rank-row" style="--house:${h.color}; --d:${index * 40}ms">
    <span class="rank-place">${String(index + 1).padStart(2, '0')}</span>
    <div class="rank-avatar">${initials(item.name)}</div>
    <div class="rank-main">
      <h3>${item.name}</h3>
      <span class="house-pill">${h.name}${item.role ? ` · ${item.role}` : ''}</span>
    </div>
    <div class="mini-medals">${medalIcon('gold')}${item.medals.gold}<span></span>${medalIcon('silver')}${item.medals.silver}<span></span>${medalIcon('bronze')}${item.medals.bronze}</div>
    <div class="rank-coins">${fmt(item.coins)} ${fa('fa-coins')}</div>
    <div class="rank-meteors tooltip-trigger ${item.meteorites ? '' : 'zero'}" data-tooltip="Ausencias registradas esta temporada" tabindex="0">${fa('fa-meteor')} ${item.meteorites}</div>
  </article>`;
}
function renderRanking() {
  const container = $('#rankingList');
  if (!container) return;
  const query = norm($('#rankingSearch')?.value);
  const rows = standingsPlayers().filter(item => norm(`${item.name} ${item.fullName} ${(item.aliases || []).join(' ')} ${house(item.house).name}`).includes(query));
  container.innerHTML = rows.length ? rows.map(rankRow).join('') : `<p class="empty-note">No encontré a nadie con ese nombre.</p>`;
}

function activityRows(ledger) {
  return ledger.map(item => {
    const icon = item.type === 'meteor' ? fa('fa-meteor', 'act-ico meteor') : fa('fa-coins', 'act-ico coin');
    const delta = item.delta > 0 ? `+${item.delta}` : item.delta;
    return `<article class="activity-row">${icon}<div><strong>${player(item.player)?.name || '—'} <span class="delta ${item.delta < 0 ? 'neg' : ''}">${delta}</span></strong><small>${item.reason}</small></div></article>`;
  }).join('');
}
function renderActivity() {
  const recent = $('#timeline');
  const full = $('#timelineFull');
  if (!recent && !full) return;
  const { ledger } = computeStandings();
  const emptyNote = `<p class="empty-note">Sin movimientos todavía. La actividad va a aparecer acá apenas subas un informe.</p>`;
  if (recent) recent.innerHTML = ledger.length ? activityRows(ledger.slice(0, 8)) : emptyNote;
  if (full) full.innerHTML = ledger.length ? activityRows(ledger) : emptyNote;
}

function renderLegends() {
  const podium = $('#legendsPodium'), ranking = $('#legendsRanking'), history = $('#legendsHistory');
  if (!podium) return;
  const sorted = [...LEGENDS.winners].sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name, 'es'));
  if ($('#legendsDates')) $('#legendsDates').textContent = LEGENDS.dates;
  if ($('#legendsWinners')) $('#legendsWinners').textContent = sorted.filter(item => item.wins > 0).length;
  podium.innerHTML = sorted.slice(0, 3).map((item, index) => `<article class="legend-card rank-${index + 1}"><span class="podium-rank">0${index + 1}</span>${medalIcon(['gold', 'silver', 'bronze'][index])}<h3>${item.name}</h3><strong>${item.wins} victoria${item.wins === 1 ? '' : 's'}</strong></article>`).join('');
  ranking.innerHTML = sorted.map((item, index) => `<article class="legend-row"><b>${String(index + 1).padStart(2, '0')}</b><span>${item.name}</span><em>${item.wins} ${item.wins === 1 ? 'victoria' : 'victorias'}</em></article>`).join('');
  history.innerHTML = LEGENDS.history.map(item => `<article class="legend-row"><b>${item.date}</b><span>${item.winner}</span><em>Mod. ${item.moderator}</em></article>`).join('');
}

function loadRules() { try { return JSON.parse(localStorage.getItem(RULES_STORAGE)) || clone(DEFAULT_RULES); } catch { return clone(DEFAULT_RULES); } }
function renderRules() {
  const container = $('#rulesEditor');
  if (!container) return;
  container.innerHTML = loadRules().map((rule, index) => `<article class="rule-card"><span>${String(index + 1).padStart(2, '0')}</span><div><h3 contenteditable="true" data-rule-title="${index}">${rule.title}</h3><p contenteditable="true" data-rule-body="${index}">${rule.body}</p></div></article>`).join('');
}
function saveRules() {
  const rules = loadRules().map((rule, index) => ({ title: $(`[data-rule-title="${index}"]`)?.textContent.trim() || rule.title, body: $(`[data-rule-body="${index}"]`)?.textContent.trim() || rule.body }));
  localStorage.setItem(RULES_STORAGE, JSON.stringify(rules));
  toast('Reglas guardadas.');
}
function restoreRules() { localStorage.removeItem(RULES_STORAGE); renderRules(); toast('Reglas base restauradas.'); }

function renderAdjustPlayers() {
  const select = $('#adjustPlayer');
  if (!select) return;
  const current = select.value;
  select.innerHTML = players().map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  if (current) select.value = current;
}
function renderModeratorOptions() {
  const select = $('#moderatorSelect');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Elegir moderador</option>' + players().map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  if (current) select.value = current;
}

/* ---------- manual adjustment ---------- */
function applyManualAdjust() {
  const playerId = $('#adjustPlayer')?.value;
  const kind = $('#adjustKind')?.value;
  const action = $('#adjustAction')?.value;
  const amount = Math.max(1, Number($('#adjustAmount')?.value || 1));
  const reason = $('#adjustReason')?.value.trim();
  const target = player(playerId);
  if (!target) { toast('Elegí un jugador.'); return; }
  if (!reason) { toast('El motivo es obligatorio.'); shake('#adjustReason'); return; }
  const delta = action === 'add' ? amount : -amount;
  state.manual.push({ id: `manual-${Date.now()}`, player: playerId, kind, delta, reason: `${kind === 'meteor' ? 'Meteorito' : 'Ajuste'} admin: ${reason}`, ts: new Date().toISOString() });
  $('#adjustReason').value = '';
  $('#adjustAmount').value = 1;
  persist(); render();
  toast(kind === 'meteor' ? `Meteorito ${action === 'add' ? 'cargado' : 'quitado'} para ${target.name}.` : `Ajuste aplicado a ${target.name}.`);
  if (kind === 'meteor' && action === 'add') pulseMeteor(playerId);
}

/* ---------- Kahoot import: parsing ---------- */
function fileBaseName(name) { return String(name || 'Kahoot QS League').replace(/\.(xlsx|xls|csv)$/i, ''); }
function cleanNumber(value) { return Number(String(value ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0; }
function findHeader(headers, names) { return headers.find(header => names.some(name => norm(header).includes(name))); }

function splitCsvLine(line) {
  const output = []; let current = ''; let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') { current += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { output.push(current.replace(/^"|"$/g, '')); current = ''; }
    else current += char;
  }
  output.push(current.replace(/^"|"$/g, ''));
  return output;
}
function rowsFromMatrix(matrix) {
  const aliases = ['nickname', 'player', 'name', 'nombre', 'participante', 'jugador', 'identifier', 'email'];
  const headerIndex = matrix.findIndex(row => row.some(cell => aliases.some(alias => norm(cell).includes(alias))));
  if (headerIndex < 0) return { rows: [], nameKey: null };
  const headers = matrix[headerIndex].map((header, index) => String(header || `column_${index}`).trim());
  const rows = matrix.slice(headerIndex + 1).filter(row => row.some(Boolean)).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  return { rows, nameKey: findHeader(headers, aliases) };
}
function csvFile(file) { return file.text().then(text => ({ rows: rowsFromMatrix(text.split(/\r?\n/).filter(line => line.trim()).map(splitCsvLine)).rows, source: 'CSV', sheet: 'CSV' })); }
function pickKahootSheet(workbook) {
  const preferred = ['Final Scores', 'Final scores', 'Scores', 'Overview', 'Raw Report Data', 'Raw data', 'RawReportData'];
  const names = [...preferred.filter(name => workbook.SheetNames.includes(name)), ...workbook.SheetNames.filter(name => !preferred.includes(name))];
  for (const sheet of names) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, defval: '' });
    const parsed = rowsFromMatrix(matrix);
    if (parsed.rows.length && parsed.nameKey) return { sheet, rows: parsed.rows };
  }
  return { sheet: workbook.SheetNames[0], rows: XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }) };
}
function xlsxFile(file) {
  if (!window.XLSX) throw new Error('SheetJS no cargó');
  return file.arrayBuffer().then(buffer => { const workbook = XLSX.read(buffer); const candidate = pickKahootSheet(workbook); return { rows: candidate.rows, source: 'XLSX', sheet: candidate.sheet }; });
}
function parseKahootRows(rows, meta = {}) {
  const headers = Object.keys(rows[0] || {});
  const nameKey = findHeader(headers, ['nickname', 'player', 'name', 'nombre', 'participante', 'jugador', 'identifier', 'email']);
  const scoreKey = findHeader(headers, ['score', 'points', 'puntos', 'puntaje', 'total score', 'current total']);
  const rankKey = findHeader(headers, ['rank', 'puesto', 'position', 'ranking', 'place']);
  const correctKey = findHeader(headers, ['correct answers', 'correctas', 'correct']);
  if (!nameKey) return { rows: [], meta: { ...meta, error: 'No se detectó columna de jugador' } };
  const parsed = rows.map((row, index) => ({
    nickname: String(row[nameKey] || '').trim(),
    score: cleanNumber(row[scoreKey]),
    correct: correctKey ? cleanNumber(row[correctKey]) : null,
    rank: rankKey ? cleanNumber(row[rankKey]) : index + 1
  })).filter(row => row.nickname && !/average|total|summary|final scores/i.test(row.nickname));
  return {
    rows: parsed.sort((a, b) => (rankKey ? a.rank - b.rank : b.score - a.score)).map((row, index) => {
      const match = findPlayerByNickname(row.nickname);
      return { ...row, rank: index + 1, playerId: match?.id || '', ignored: false, reportName: fileBaseName(meta.fileName) };
    }),
    meta: { ...meta, count: parsed.length }
  };
}
async function readFiles(files) {
  const validFiles = files.filter(file => /\.(xlsx|xls|csv)$/i.test(file.name));
  if (!validFiles.length) { toast('Elegí un informe XLSX, XLS o CSV de Kahoot.'); return; }
  const imported = []; const failed = [];
  for (const file of validFiles) {
    try {
      const parsed = file.name.toLowerCase().endsWith('.csv') ? await csvFile(file) : await xlsxFile(file);
      const preview = parseKahootRows(parsed.rows, { fileName: file.name, sheet: parsed.sheet || 'CSV' });
      if (preview.rows.length) imported.push(preview); else failed.push(file.name);
    } catch (error) { console.error(error); failed.push(file.name); }
  }
  if (!imported.length) { toast('No pude leer el informe. Probá con el XLSX de Kahoot Reports.'); return; }
  state.pending = imported.flatMap(item => item.rows);
  state.pendingMeta = { files: imported.map(item => item.meta), failed, createdAt: new Date().toISOString() };
  state.pendingAbsenceChoices = {};
  if (!$('#sessionName').value.trim() || $('#sessionName').dataset.auto === '1') {
    $('#sessionName').value = imported[0]?.meta.fileName ? fileBaseName(imported[0].meta.fileName) : 'Kahoot QS League';
    $('#sessionName').dataset.auto = '1';
  }
  renderPreview();
  toast(`Informe cargado: ${state.pending.length} filas detectadas.`);
}

/* ---------- Kahoot import: preview + apply ---------- */
function absentees(moderatorId) {
  const participating = new Set((state.pending || []).filter(row => row.playerId && row.playerId !== moderatorId && !row.ignored).map(row => row.playerId));
  return players().map(p => p.id).filter(id => id !== moderatorId && !participating.has(id));
}
function sessionAlreadyLoaded(session) { return state.imports.some(item => norm(item.session) === norm(session)); }

function newPlayerRow(index) {
  const row = state.pending[index];
  return `<div class="new-player-form" data-new-for="${index}">
    <input type="text" value="${row.nickname}" placeholder="Nombre para mostrar" data-new-name />
    <button class="btn btn-ghost btn-xs" type="button" data-confirm-new="${index}">${fa('fa-user-plus')} Agregar</button>
    <button class="btn btn-ghost btn-xs" type="button" data-cancel-new="${index}">Cancelar</button>
  </div>`;
}

function renderPreview() {
  const container = $('#uploadPreview');
  if (!container) return;
  const applyBtn = $('#applyImportBtn');
  if (!state.pending) {
    container.className = 'upload-preview empty';
    container.innerHTML = `<p class="empty-note">Todavía no hay informe cargado. Arrastrá el XLSX o CSV arriba.</p>`;
    if (applyBtn) applyBtn.disabled = true;
    return;
  }
  container.className = 'upload-preview';
  const moderatorId = $('#moderatorSelect')?.value || '';
  const session = $('#sessionName')?.value.trim() || 'Kahoot QS League';
  const mapped = state.pending.filter(row => row.playerId || row.ignored).length;
  const unmapped = state.pending.length - mapped;
  const absenteeIds = moderatorId ? absentees(moderatorId) : [];
  const duplicate = sessionAlreadyLoaded(session);
  const meta = state.pendingMeta || {};
  const opts = ['<option value="">Sin mapear</option>', ...players().map(item => `<option value="${item.id}">${item.name}</option>`)].join('');

  const chips = `<div class="preview-chips">
    <article><strong>${fmt(state.pending.length)}</strong><span>filas</span></article>
    <article><strong>${fmt(mapped)}</strong><span>mapeadas</span></article>
    <article><strong>${fmt(unmapped)}</strong><span>sin mapear</span></article>
    <article><strong>${fmt(absenteeIds.length)}</strong><span>ausencias</span></article>
  </div>`;

  const moderatorWarning = !moderatorId ? `<p class="warn-note">${fa('fa-triangle-exclamation')} Elegí el moderador de la fecha antes de actualizar.</p>` : '';
  const unmappedWarning = unmapped ? `<p class="warn-note">${fa('fa-triangle-exclamation')} Hay ${unmapped} participante${unmapped > 1 ? 's' : ''} sin resolver. Mapealo, agregalo como nuevo o ignoralo.</p>` : '';
  const failedWarning = meta.failed?.length ? `<p class="warn-note">${fa('fa-triangle-exclamation')} No pude leer: ${meta.failed.join(', ')}</p>` : '';
  const duplicateBanner = duplicate ? `<div class="warn-note duplicate-note">${fa('fa-triangle-exclamation')} "${session}" ya parece estar cargado.
    <label><input type="checkbox" id="confirmDuplicate" /> Sí, quiero cargarlo igual (puede duplicar puntos)</label></div>` : '';

  const absenceChoices = state.pendingAbsenceChoices || (state.pendingAbsenceChoices = {});
  Object.keys(absenceChoices).forEach(id => { if (!absenteeIds.includes(id)) delete absenceChoices[id]; });
  const absencePanel = moderatorId ? (absenteeIds.length
    ? `<div class="absence-panel">
        <strong>${fa('fa-meteor')} Ausencias detectadas</strong>
        <p>Elegí el tipo de falta de cada persona antes de actualizar. Cada una suma un meteorito.</p>
        ${absenteeIds.map(id => `<div class="absence-row"><span>${player(id)?.name || id}</span>
          <div class="segmented" data-absence="${id}">
            <button type="button" class="seg-btn ${absenceChoices[id] === 'notice' ? 'active' : ''}" data-value="notice">Avisó 24 h · -1</button>
            <button type="button" class="seg-btn ${absenceChoices[id] === 'no_notice' ? 'active' : ''}" data-value="no_notice">Sin aviso · -3</button>
          </div></div>`).join('')}
      </div>`
    : `<p class="ok-note">${fa('fa-circle-check')} No hay ausencias: participó todo el roster.</p>`) : '';

  const effectiveRanks = new Map(
    state.pending
      .filter(row => row.playerId && row.playerId !== moderatorId && !row.ignored)
      .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
      .map((row, index) => [row, index + 1])
  );

  const rowsHtml = state.pending.map((row, index) => {
    const isModerator = row.playerId && row.playerId === moderatorId;
    const prize = award(effectiveRanks.get(row) || 0);
    const status = isModerator ? '<span class="tag mod">Moderador</span>' : row.ignored ? '<span class="tag ignored">Ignorada</span>' : row.playerId ? '<span class="tag ok">Detectado</span>' : '<span class="tag pending">Revisar</span>';
    const actions = row.playerId || row.ignored
      ? (!row.playerId ? '' : `<button class="btn btn-ghost btn-xs" type="button" data-toggle-ignore="${index}">${row.ignored ? 'Restaurar' : 'Ignorar'}</button>`)
      : `<button class="btn btn-ghost btn-xs" type="button" data-add-new="${index}">${fa('fa-user-plus')} Nueva persona</button><button class="btn btn-ghost btn-xs" type="button" data-toggle-ignore="${index}">Ignorar</button>`;
    return `<tr class="${isModerator ? 'row-mod' : ''} ${row.ignored ? 'row-ignored' : ''}">
      <td>${row.rank}</td><td>${row.nickname}</td><td>${fmt(row.score)}</td><td>${row.correct ?? '—'}</td>
      <td><select data-map="${index}" ${row.ignored ? 'disabled' : ''}>${opts}</select> ${status}${window.__newPlayerOpen === index ? newPlayerRow(index) : ''}</td>
      <td>${isModerator || row.ignored ? '—' : (prize.key ? medalIcon(prize.key) : '') + ' ' + prize.label}</td>
      <td class="row-actions">${actions}</td>
    </tr>`;
  }).join('');

  container.innerHTML = `${chips}${moderatorWarning}${unmappedWarning}${failedWarning}${duplicateBanner}${absencePanel}
    <div class="table-scroll"><table><thead><tr><th>Rank</th><th>Nickname</th><th>Score</th><th>Correctas</th><th>Mapeo QS</th><th>Premio</th><th></th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;

  $$('[data-map]').forEach(select => {
    select.value = state.pending[select.dataset.map].playerId;
    select.addEventListener('change', () => { state.pending[select.dataset.map].playerId = select.value; state.pending[select.dataset.map].ignored = false; renderPreview(); });
  });
  $$('[data-toggle-ignore]').forEach(btn => btn.addEventListener('click', () => {
    const row = state.pending[btn.dataset.toggleIgnore];
    row.ignored = !row.ignored;
    if (row.ignored) row.playerId = '';
    renderPreview();
  }));
  $$('[data-add-new]').forEach(btn => btn.addEventListener('click', () => { window.__newPlayerOpen = Number(btn.dataset.addNew); renderPreview(); }));
  $$('[data-cancel-new]').forEach(btn => btn.addEventListener('click', () => { window.__newPlayerOpen = null; renderPreview(); }));
  $$('[data-confirm-new]').forEach(btn => btn.addEventListener('click', () => {
    const index = Number(btn.dataset.confirmNew);
    const nameInput = $(`[data-new-for="${index}"] [data-new-name]`);
    const name = nameInput?.value.trim();
    if (!name) { toast('Escribí un nombre para la nueva persona.'); return; }
    const id = norm(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `jugador-${Date.now()}`;
    const uniqueId = players().some(p => p.id === id) ? `${id}-${Date.now().toString(36)}` : id;
    state.customPlayers.push({ id: uniqueId, name, fullName: name, role: '', house: 'sincasa', aliases: [name, state.pending[index].nickname] });
    state.pending[index].playerId = uniqueId;
    window.__newPlayerOpen = null;
    persist(); renderAdjustPlayers(); renderPreview();
    toast(`${name} fue agregado al roster.`);
  }));
  $$('[data-absence]').forEach(group => {
    group.querySelectorAll('.seg-btn').forEach(seg => seg.addEventListener('click', () => {
      state.pendingAbsenceChoices[group.dataset.absence] = seg.dataset.value;
      renderPreview();
    }));
  });
  const confirmDup = $('#confirmDuplicate');
  if (confirmDup) confirmDup.addEventListener('change', updateApplyState);
  updateApplyState();

  function updateApplyState() {
    const ready = moderatorId && !unmapped && (!duplicate || $('#confirmDuplicate')?.checked) && absenteeIds.every(id => absenceChoices[id]);
    if (applyBtn) applyBtn.disabled = !ready;
  }
}

function applyImport() {
  const moderatorId = $('#moderatorSelect')?.value;
  const session = $('#sessionName')?.value.trim() || 'Kahoot QS League';
  const date = $('#sessionDate')?.value || new Date().toISOString().slice(0, 10);
  if (!state.pending?.length || !moderatorId) return;
  const absenteeIds = absentees(moderatorId);
  const decisions = absenteeIds.map(id => {
    const value = (state.pendingAbsenceChoices || {})[id] || '';
    return { id, label: absenceLabel(value), penalty: absencePenalty(value) };
  });
  const rows = state.pending.filter(row => row.playerId && !row.ignored).map(row => ({ rank: row.rank, playerId: row.playerId, nickname: row.nickname, score: row.score, correct: row.correct }));
  state.imports.unshift({ id: `import-${Date.now()}`, session, date, ts: new Date().toISOString(), moderator: moderatorId, rows, absences: decisions });
  state.pending = null; state.pendingMeta = null; state.pendingAbsenceChoices = {};
  $('#fileInput').value = '';
  $('#sessionName').value = ''; $('#sessionName').dataset.auto = '';
  $('#moderatorSelect').value = '';
  persist(); render();
  toast(`Ranking actualizado. Meteoritos cargados: ${decisions.length}.`);
  confetti();
  document.getElementById('podium')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function resetUpload() {
  state.pending = null; state.pendingMeta = null; state.pendingAbsenceChoices = {};
  $('#fileInput').value = '';
  renderPreview();
}

/* ---------- feedback fx ---------- */
function toast(message) {
  const node = $('#toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2800);
}
function shake(selector) { const node = $(selector); if (!node) return; node.classList.add('shake'); setTimeout(() => node.classList.remove('shake'), 500); }
function pulseMeteor(playerId) {
  const name = player(playerId)?.name;
  const target = $$('.rank-row').find(row => row.querySelector('h3')?.textContent === name)?.querySelector('.rank-meteors');
  if (target) { target.classList.add('meteor-hit'); setTimeout(() => target.classList.remove('meteor-hit'), 700); }
}
function confetti() {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  const colors = ['#3C9FF1', '#7025E0', '#c6ff5c', '#ffd15c', '#ff7a45'];
  for (let index = 0; index < 40; index++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${1.3 + Math.random() * 1.1}s`;
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2700);
}

/* ---------- reveal-on-scroll ---------- */
function initReveal() {
  const targets = $$('.reveal');
  if (!('IntersectionObserver' in window) || !targets.length) { targets.forEach(el => el.classList.add('in-view')); return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  targets.forEach(el => observer.observe(el));
}

/* ---------- hero typewriter word-cycle ---------- */
function initHeroCycle() {
  const word = $('#heroCycleWord');
  if (!word) return;
  const words = ['DINOCOINS', 'KAHOOTS', 'METEORITOS', 'LEYENDAS'];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  let index = 0;
  (async function loop() {
    while (document.body.contains(word)) {
      await wait(1700);
      while (word.textContent.length > 0) { word.textContent = word.textContent.slice(0, -1); await wait(45); }
      index = (index + 1) % words.length;
      await wait(150);
      const next = words[index];
      for (let i = 1; i <= next.length; i++) { word.textContent = next.slice(0, i); await wait(75); }
    }
  })();
}

/* ---------- bindings ---------- */
function bind() {
  $('#rankingSearch')?.addEventListener('input', renderRanking);
  $('#applyManualAdjust')?.addEventListener('click', applyManualAdjust);
  $('#saveRules')?.addEventListener('click', saveRules);
  $('#restoreRules')?.addEventListener('click', restoreRules);
  $('#applyImportBtn')?.addEventListener('click', applyImport);
  $('#resetUploadBtn')?.addEventListener('click', resetUpload);
  $('#fileInput')?.addEventListener('change', event => readFiles([...event.target.files]));
  $('#moderatorSelect')?.addEventListener('change', renderPreview);
  $('#sessionName')?.addEventListener('input', renderPreview);

  const dropZone = $('#dropZone');
  if (dropZone) {
    dropZone.addEventListener('dragover', event => { event.preventDefault(); dropZone.classList.add('drag'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
    dropZone.addEventListener('drop', event => { event.preventDefault(); dropZone.classList.remove('drag'); readFiles([...event.dataTransfer.files]); });
  }

  $$('.nav-link').forEach(link => link.addEventListener('click', () => $('.nav')?.classList.remove('open')));
  $('#navToggle')?.addEventListener('click', () => $('.nav')?.classList.toggle('open'));
}

function init() {
  if ($('#sessionDate') && !$('#sessionDate').value) $('#sessionDate').value = new Date().toISOString().slice(0, 10);
  bind();
  render();
  initReveal();
  initHeroCycle();
  initCloudSync();
}
document.addEventListener('DOMContentLoaded', init);
