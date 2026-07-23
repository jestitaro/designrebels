/* Dino Cup — data engine + UI
   Standings are always *derived* from state.imports + state.manual via
   computeStandings(), never mutated in place, so there's nothing to
   reconcile between sessions. Persists to localStorage (instant paint +
   offline fallback) and Firestore (shared/live across devices). */

/* ---------- helpers ---------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const fmt = value => new Intl.NumberFormat('es-AR').format(value || 0);
const norm = value => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const clone = value => JSON.parse(JSON.stringify(value));
const MINUS = '−';
function fmtPoints(value) {
  const abs = Math.abs(value);
  const unit = abs === 1 ? 'pt' : 'pts';
  return `${value < 0 ? MINUS : ''}${fmt(abs)} ${unit}`;
}
function renderIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
}

/* ---------- roster & houses ---------- */
const HOUSES = {
  slytherin: { name: 'Slytherin', avatarClass: 'green' },
  hufflepuff: { name: 'Hufflepuff', avatarClass: 'yellow' },
  ravenclaw: { name: 'Ravenclaw', avatarClass: 'blue' },
  gryffindor: { name: 'Gryffindor', avatarClass: 'red' }
};
function house(id) { return HOUSES[id] || { name: 'Sin casa', avatarClass: 'blue' }; }

/* Houses confirmed against quartzsales.com/hogquartz/salacomun/ (2026-07-17). */
const ROSTER = [
  { id: 'javi', name: 'Javi', fullName: 'Javier De Vergilio', role: '', house: 'gryffindor', aliases: ['Javi', 'Javier', 'Javier De Vergilio'] },
  { id: 'mayra', name: 'May', fullName: 'Mayra Milanesio', role: '', house: 'gryffindor', aliases: ['May', 'Mayra', 'Mayra Milanesio'] },
  { id: 'nico', name: 'Nico', fullName: 'Nicolas Rivero Segura', role: 'Integrator / COO', house: 'slytherin', aliases: ['Nico', 'Nicolas', 'Nicolás', 'Nicolas Rivero Segura'] },
  { id: 'pablo', name: 'Pablo', fullName: 'Pablo Hernan Gimenez', role: 'Visionary / CEO', house: 'slytherin', aliases: ['Pablo', 'Hero', 'Heror', 'Pablo Hernan Gimenez', 'Pablo Gimenez'] },
  { id: 'agustin', name: 'Agustin', fullName: 'Agustin Goñi Piuma', role: 'Director Comercial', house: 'slytherin', aliases: ['Agustin', 'Agustín', 'Agus', 'Agustin Goñi Piuma'] },
  { id: 'alejandro', name: 'Ale', fullName: 'Alejandro Frank', role: '', house: 'hufflepuff', aliases: ['Ale', 'Alejandro', 'Alejandro Frank', '8706743-ale'] },
  { id: 'eugenio', name: 'Euge', fullName: 'Eugenio Balbastro Fages', role: 'Líder técnico', house: 'ravenclaw', aliases: ['Euge', 'Eugenio', 'Eugenio Balbastro Fages', '8706743'] },
  { id: 'juli', name: 'Juli', fullName: 'Juli Piccioni', role: '', house: 'ravenclaw', aliases: ['Juli', 'July', 'Picci', 'Juli Piccioni'] },
  { id: 'lucrecia', name: 'Lucre', fullName: 'Lucrecia Moralejo', role: '', house: 'hufflepuff', aliases: ['Lucre', 'Luly', 'Luli', 'Lucrecia', 'Lucrecia Moralejo'] },
  { id: 'sebas', name: 'Sebas', fullName: 'Sebastian Carnota', role: '', house: 'ravenclaw', aliases: ['Sebas', 'Seba', 'Sebastian', 'Sebastian Carnota'] },
  { id: 'jesica', name: 'Jesi', fullName: 'Jesica Titaro', role: 'Rebel Designer', house: 'gryffindor', aliases: ['Jesi', 'Jess', 'Jesica', 'Jesica Titaro'] }
];
function player(id) { return ROSTER.find(item => item.id === id); }
function findPlayerByNickname(nick) {
  const n = norm(nick);
  if (!n) return null;
  return ROSTER.find(p => [p.id, p.name, p.fullName, ...p.aliases].some(alias => norm(alias) === n)) || null;
}

/* Season 02 base reports, matching REGLAS.md §10 (no retroactive penalties),
   plus the absence already applied to Jesi before this rebuild. */
const SEED_IMPORTS = [
  {
    id: 'seed-20260702', date: '2026-07-02', ts: '2026-07-02T12:00:00.000Z', moderator: 'alejandro',
    rows: [
      { rank: 1, playerId: 'mayra', nickname: 'May' },
      { rank: 2, playerId: 'javi', nickname: 'Javi' },
      { rank: 3, playerId: 'nico', nickname: 'Nico' },
      { rank: 5, playerId: 'jesica', nickname: 'Jesi' },
      { rank: 6, playerId: 'sebas', nickname: 'Sebas' },
      { rank: 7, playerId: 'eugenio', nickname: '8706743' }
    ]
  },
  {
    id: 'seed-20260716', date: '2026-07-16', ts: '2026-07-16T12:00:00.000Z', moderator: 'sebas',
    rows: [
      { rank: 1, playerId: 'javi', nickname: 'Javi' },
      { rank: 2, playerId: 'mayra', nickname: 'May' },
      { rank: 3, playerId: 'pablo', nickname: 'Heror' },
      { rank: 5, playerId: 'lucrecia', nickname: 'Luly' },
      { rank: 6, playerId: 'juli', nickname: 'Picci' },
      { rank: 7, playerId: 'nico', nickname: 'Nico' },
      { rank: 8, playerId: 'alejandro', nickname: 'Ale' }
    ]
  }
];
const SEED_MANUAL = [
  { id: 'seed-manual-jesica', player: 'jesica', delta: -1, reason: 'Ausencia con aviso', ts: '2026-07-18T12:00:00.000Z' }
];

/* ---------- award table & absence points ---------- */
function award(rank) {
  if (rank === 1) return { delta: 3, key: 'gold' };
  if (rank === 2) return { delta: 2, key: 'silver' };
  if (rank === 3) return { delta: 1, key: 'bronze' };
  return { delta: 0, key: null };
}
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function longDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${String(day).padStart(2, '0')} de ${MONTHS_ES[month - 1]} ${year}`;
}

/* ---------- state ---------- */
const STORAGE = 'dinocup-v1';
let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE)) || {};
    return {
      imports: Array.isArray(saved.imports) && saved.imports.length ? saved.imports : clone(SEED_IMPORTS),
      manual: Array.isArray(saved.manual) ? saved.manual : clone(SEED_MANUAL)
    };
  } catch {
    return { imports: clone(SEED_IMPORTS), manual: clone(SEED_MANUAL) };
  }
}
function persist() {
  localStorage.setItem(STORAGE, JSON.stringify(state));
  if (typeof window.qsDbSaveState === 'function') {
    window.qsDbSaveState(state).catch(error => {
      console.warn('Dino Cup: no pude sincronizar con la base compartida.', error);
      showToast('No se pudo sincronizar con la base compartida. Se guardó localmente.');
    });
  }
}

/* ---------- pure standings engine ---------- */
function computeStandings() {
  const totals = new Map(ROSTER.map(p => [p.id, { points: 0, medals: { gold: 0, silver: 0, bronze: 0 } }]));
  const ledger = [];

  state.imports.forEach(imp => {
    const rows = (imp.rows || [])
      .filter(row => row.playerId && row.playerId !== imp.moderator)
      .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
      .map((row, index) => ({ ...row, rank: index + 1 }));
    rows.forEach(row => {
      const prize = award(row.rank);
      if (!prize.delta) return;
      const total = totals.get(row.playerId);
      if (!total) return;
      total.points += prize.delta;
      total.medals[prize.key] += 1;
      ledger.push({ ts: imp.ts, player: row.playerId, delta: prize.delta, reason: `${longDate(imp.date)} · +${prize.delta} ${prize.delta === 1 ? 'punto' : 'puntos'}` });
    });
  });

  state.manual.forEach(entry => {
    const total = totals.get(entry.player);
    if (!total) return;
    total.points += entry.delta;
    ledger.push({ ts: entry.ts, player: entry.player, delta: entry.delta, reason: `Meteorito admin · ${entry.reason}` });
  });

  ledger.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return { totals, ledger };
}
function standingsPlayers() {
  const { totals } = computeStandings();
  return ROSTER
    .map(p => ({ ...p, ...totals.get(p.id) }))
    .sort((a, b) => (b.points - a.points) || (b.medals.gold - a.medals.gold) || (b.medals.silver - a.medals.silver) || a.name.localeCompare(b.name, 'es'));
}

/* ---------- rendering ---------- */
function podiumCardHtml(item, place) {
  const h = house(item.house);
  const crown = place === 1 ? '<i class="crown" data-lucide="crown" aria-hidden="true"></i>' : '';
  const subtitle = item.role || h.name;
  return `<article class="podium-card podium-card--${place === 1 ? 'first' : place === 2 ? 'second' : 'third'}">
    ${crown}
    <span class="podium-rank">0${place}</span>
    <div class="avatar-ring"><span>${item.name.charAt(0).toUpperCase()}</span></div>
    <h2>${item.name}</h2>
    <p>${subtitle}</p>
    <div class="medals" aria-label="Medallas">
      <span class="medal medal--gold"><i data-lucide="medal"></i><b>${item.medals.gold}</b></span>
      <span class="medal medal--silver"><i data-lucide="medal"></i><b>${item.medals.silver}</b></span>
      <span class="medal medal--bronze"><i data-lucide="medal"></i><b>${item.medals.bronze}</b></span>
    </div>
    <strong class="score"><i data-lucide="star" aria-hidden="true"></i><span>${fmt(item.points)}</span></strong>
  </article>`;
}
function renderPodium(rows) {
  const podium = $('.podium');
  if (!podium) return;
  const top3 = rows.slice(0, 3);
  const order = [1, 0, 2].filter(index => top3[index]);
  podium.innerHTML = order.map(index => podiumCardHtml(top3[index], index + 1)).join('');
}

function competitorLiHtml(item, position, prefix) {
  const h = house(item.house);
  const negative = item.points < 0 ? ` ${prefix}__points--negative` : '';
  return `<li>
    <span class="${prefix}__position">${String(position).padStart(2, '0')}</span>
    <span class="${prefix}__avatar ${prefix}__avatar--${h.avatarClass}">${item.name.charAt(0).toUpperCase()}</span>
    <span class="${prefix}__info"><strong>${item.name}</strong><small>${h.name}</small></span>
    <span class="${prefix}__points${negative}">${fmtPoints(item.points)}</span>
  </li>`;
}
function renderCompetitorLists(rows) {
  const rest = rows.slice(3);
  const visible = rest.slice(0, 3);
  const extra = rest.slice(3);

  const mobileVisible = $('.mobile-competitors__list--visible');
  if (mobileVisible) mobileVisible.innerHTML = visible.map((item, i) => competitorLiHtml(item, i + 4, 'mobile-competitor')).join('');

  const mobileExtraList = $('#allCompetitors .mobile-competitors__list');
  if (mobileExtraList) {
    mobileExtraList.setAttribute('start', '7');
    mobileExtraList.innerHTML = extra.map((item, i) => competitorLiHtml(item, i + 7, 'mobile-competitor')).join('');
  }

  const desktopList = $('.desktop-competitors__list');
  if (desktopList) desktopList.innerHTML = visible.map((item, i) => competitorLiHtml(item, i + 4, 'desktop-competitor')).join('');
}

function renderResultsModal(rows) {
  const list = $('.partial-ranking-list');
  if (list) {
    list.innerHTML = rows.map((item, index) => {
      const h = house(item.house);
      const negative = item.points < 0 ? ' partial-score--negative' : '';
      const subtitle = `${h.name}${item.role ? ' · ' + item.role : ''}`;
      return `<li>
        <span class="partial-position">${String(index + 1).padStart(2, '0')}</span>
        <span class="partial-avatar partial-avatar--${h.avatarClass}">${item.name.charAt(0).toUpperCase()}</span>
        <span class="partial-player"><strong>${item.name}</strong><small>${subtitle}</small></span>
        <span class="partial-score${negative}">${fmtPoints(item.points)}</span>
      </li>`;
    }).join('');
  }
  const count = $('#participantsCount');
  if (count) count.textContent = `${rows.length} participantes`;

  const { ledger } = computeStandings();
  const activityList = $('.activity-list');
  if (activityList) {
    activityList.innerHTML = ledger.slice(0, 12).map(item => {
      const delta = item.delta > 0 ? `+${item.delta}` : fmtPoints(item.delta);
      return `<li${item.delta < 0 ? ' class="activity-list__negative"' : ''}><div><strong>${player(item.player)?.name || '—'} ${delta}</strong><small>${item.reason}</small></div></li>`;
    }).join('');
  }
}

function renderSeasonChip() {
  const chip = $('#lastFechaChip');
  if (!chip) return;
  const last = [...state.imports].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  chip.textContent = last ? last.date.split('-').reverse().join('/') : '—';
}

function render() {
  const rows = standingsPlayers();
  renderPodium(rows);
  renderCompetitorLists(rows);
  renderResultsModal(rows);
  renderSeasonChip();
  renderIcons();
}

/* ---------- shared cloud sync (Firestore) ---------- */
let cloudDocSeen = false;
function initCloudSync() {
  if (typeof window.qsDbSubscribe !== 'function') return;
  window.qsDbSubscribe(data => {
    if (data) {
      state.imports = Array.isArray(data.imports) && data.imports.length ? data.imports : state.imports;
      state.manual = Array.isArray(data.manual) ? data.manual : state.manual;
      localStorage.setItem(STORAGE, JSON.stringify(state));
      render();
    } else if (!cloudDocSeen && typeof window.qsDbSaveState === 'function') {
      window.qsDbSaveState(state).catch(error => console.warn('Dino Cup: no pude inicializar la base compartida.', error));
    }
    cloudDocSeen = true;
  });
}

/* ---------- Kahoot import: parsing (XLSX/CSV) ---------- */
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
async function csvFile(file) {
  const text = await file.text();
  return { rows: rowsFromMatrix(text.split(/\r?\n/).filter(line => line.trim()).map(splitCsvLine)).rows };
}
function pickKahootSheet(workbook) {
  const preferred = ['Final Scores', 'Final scores', 'Scores', 'Overview', 'Raw Report Data', 'Raw data', 'RawReportData'];
  const names = [...preferred.filter(name => workbook.SheetNames.includes(name)), ...workbook.SheetNames.filter(name => !preferred.includes(name))];
  for (const sheet of names) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, defval: '' });
    const parsed = rowsFromMatrix(matrix);
    if (parsed.rows.length && parsed.nameKey) return { rows: parsed.rows };
  }
  return { rows: XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }) };
}
async function xlsxFile(file) {
  if (!window.XLSX) throw new Error('SheetJS no cargó');
  const buffer = await file.arrayBuffer();
  return pickKahootSheet(XLSX.read(buffer));
}
function parseKahootRows(rows) {
  const headers = Object.keys(rows[0] || {});
  const nameKey = findHeader(headers, ['nickname', 'player', 'name', 'nombre', 'participante', 'jugador', 'identifier', 'email']);
  const scoreKey = findHeader(headers, ['score', 'points', 'puntos', 'puntaje', 'total score', 'current total']);
  const rankKey = findHeader(headers, ['rank', 'puesto', 'position', 'ranking', 'place']);
  if (!nameKey) return [];
  const parsed = rows.map((row, index) => ({
    nickname: String(row[nameKey] || '').trim(),
    score: cleanNumber(row[scoreKey]),
    rank: rankKey ? cleanNumber(row[rankKey]) : index + 1
  })).filter(row => row.nickname && !/average|total|summary|final scores/i.test(row.nickname));
  return parsed.sort((a, b) => (rankKey ? a.rank - b.rank : b.score - a.score)).map((row, index) => ({ ...row, rank: index + 1 }));
}
async function parseKahootFile(file) {
  const parsed = file.name.toLowerCase().endsWith('.csv') ? await csvFile(file) : await xlsxFile(file);
  return parseKahootRows(parsed.rows);
}

/* ---------- DOM refs ---------- */
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
const navLinks = $$('.nav-link');

const uploadModal = $('#uploadModal');
const openUploadButtons = $$('[data-open-upload]');
const closeModalButtons = $$('[data-close-modal]');

const legendsModal = $('#legendsModal');
const openLegendsButtons = $$('[data-open-legends]');
const closeLegendsButtons = $$('[data-close-legends]');

const rulesModal = $('#rulesModal');
const openRulesButtons = $$('[data-open-rules]');
const closeRulesButtons = $$('[data-close-rules]');

const resultsModal = $('#resultsModal');
const openResultsButtons = $$('[data-open-results]');
const closeResultsButtons = $$('[data-close-results]');

const dropzone = $('#dropzone');
const fileInput = $('#fileInput');
const fileName = $('#fileName');
const uploadForm = $('#uploadForm');
const toast = $('#toast');
const submitResultsButton = $('#submitResults');
const moderatorSelect = $('#moderatorSelect');
const sessionDateInput = $('#sessionDate');

const addAbsenceButton = $('#addAbsence');
const absenceList = $('#absenceList');
const absenceRowTemplate = $('#absenceRowTemplate');

/* ---------- absence rows (person + point discount, added during upload) ---------- */
function updateAbsenceOptions() {
  const rows = $$('.absence-row', absenceList);
  const selectedPeople = rows.map(row => $('.absence-person', row)?.value).filter(Boolean);

  rows.forEach(row => {
    const select = $('.absence-person', row);
    const currentValue = select.value;
    $$('option', select).forEach(option => {
      if (!option.value) return;
      option.disabled = option.value !== currentValue && selectedPeople.includes(option.value);
    });
    row.classList.remove('is-duplicate');
  });
}
function addAbsenceRow() {
  const fragment = absenceRowTemplate.content.cloneNode(true);
  const row = fragment.querySelector('.absence-row');
  const personSelect = fragment.querySelector('.absence-person');
  const removeButton = fragment.querySelector('.absence-remove-button');

  personSelect.addEventListener('change', updateAbsenceOptions);
  removeButton.addEventListener('click', () => { row.remove(); updateAbsenceOptions(); });

  absenceList.appendChild(fragment);
  updateAbsenceOptions();
  absenceList.lastElementChild?.querySelector('.absence-person')?.focus();
  renderIcons();
}
function getAbsenceAdjustments() {
  return $$('.absence-row', absenceList)
    .map(row => ({ person: $('.absence-person', row)?.value || '', delta: Number($('.absence-points', row)?.value || 0) }))
    .filter(item => item.person);
}
function resetAbsences() {
  absenceList.innerHTML = '';
  updateAbsenceOptions();
}

/* ---------- modals ---------- */
function toggleModal(modal, open, focusTarget) {
  modal.classList.toggle('is-open', open);
  modal.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('modal-open', open || $$('.modal.is-open').length > 0);
  if (open) window.setTimeout(() => modal.querySelector('.modal-close')?.focus(), 150);
  else focusTarget?.focus();
}
function openModal() { toggleModal(uploadModal, true); }
function closeModal() { toggleModal(uploadModal, false, $('[data-open-upload]')); }
function openLegendsModal() { toggleModal(legendsModal, true); }
function closeLegendsModal() { toggleModal(legendsModal, false, $('[data-open-legends]')); }
function openRulesModal() { toggleModal(rulesModal, true); }
function closeRulesModal() { toggleModal(rulesModal, false, $('[data-open-rules]')); }
function openResultsModal() { toggleModal(resultsModal, true); }
function closeResultsModal() { toggleModal(resultsModal, false, $('[data-open-results]')); }

/* ---------- upload: file selection ---------- */
function setSelectedFile(file) {
  if (!file) { fileName.textContent = 'Todavía no seleccionaste un archivo.'; return; }
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) {
    fileInput.value = '';
    fileName.textContent = 'Formato no válido. Elegí un XLSX, XLS o CSV.';
    return;
  }
  fileName.textContent = `Archivo seleccionado: ${file.name}`;
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

/* ---------- upload: submit (real parsing + scoring + persistence) ---------- */
async function handleUploadSubmit(event) {
  event.preventDefault();

  if (!moderatorSelect.value) { moderatorSelect.reportValidity(); return; }
  if (!sessionDateInput.value) { sessionDateInput.reportValidity(); return; }
  if (!fileInput.files.length) { fileName.textContent = 'Primero seleccioná el informe exportado de Kahoot.'; return; }

  const absenceRows = $$('.absence-row', absenceList);
  const hasIncompleteAbsence = absenceRows.some(row => !$('.absence-person', row)?.value || !$('.absence-points', row)?.value);
  if (hasIncompleteAbsence) {
    absenceRows.forEach(row => row.classList.toggle('is-duplicate', !$('.absence-person', row)?.value));
    $('.absence-person:invalid', absenceList)?.focus();
    return;
  }

  const sessionDate = sessionDateInput.value;
  if (state.imports.some(imp => imp.date === sessionDate)) {
    const confirmed = window.confirm(`Ya hay un informe cargado para el ${longDate(sessionDate)}. ¿Querés cargarlo igual?`);
    if (!confirmed) return;
  }

  submitResultsButton.classList.add('is-loading');
  try {
    const parsedRows = await parseKahootFile(fileInput.files[0]);
    if (!parsedRows.length) {
      fileName.textContent = 'No pude leer el informe. Probá con el XLSX de Kahoot Reports.';
      return;
    }

    const moderator = findPlayerByNickname(moderatorSelect.value);
    let unmapped = 0;
    const rows = parsedRows.map(row => {
      const match = findPlayerByNickname(row.nickname);
      if (!match) unmapped += 1;
      return { rank: row.rank, playerId: match?.id || '', nickname: row.nickname };
    });

    state.imports.unshift({
      id: `import-${Date.now()}`,
      date: sessionDate,
      ts: new Date().toISOString(),
      moderator: moderator?.id || '',
      rows
    });

    const absenceAdjustments = getAbsenceAdjustments();
    absenceAdjustments.forEach(item => {
      const person = findPlayerByNickname(item.person);
      if (!person) return;
      state.manual.push({
        id: `manual-${Date.now()}-${person.id}`,
        player: person.id,
        delta: item.delta,
        reason: item.delta === -1 ? 'Ausencia con aviso' : 'Ausencia sin aviso',
        ts: new Date().toISOString()
      });
    });

    persist();
    render();
    closeModal();

    const parts = [absenceAdjustments.length ? `${absenceAdjustments.length} ajuste${absenceAdjustments.length === 1 ? '' : 's'} por ausencia` : '', unmapped ? `${unmapped} fila${unmapped === 1 ? '' : 's'} sin identificar` : ''].filter(Boolean);
    showToast(parts.length ? `Resultados cargados con ${parts.join(' y ')}.` : 'Resultados cargados correctamente.');

    uploadForm.reset();
    setSelectedFile(null);
    resetAbsences();
  } catch (error) {
    console.error(error);
    fileName.textContent = 'Ocurrió un error al procesar el informe. Probá de nuevo.';
  } finally {
    submitResultsButton.classList.remove('is-loading');
  }
}

/* ---------- bindings ---------- */
function bind() {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  openUploadButtons.forEach(button => button.addEventListener('click', openModal));
  addAbsenceButton?.addEventListener('click', addAbsenceRow);
  openLegendsButtons.forEach(button => button.addEventListener('click', openLegendsModal));
  openRulesButtons.forEach(button => button.addEventListener('click', openRulesModal));
  openResultsButtons.forEach(button => button.addEventListener('click', openResultsModal));

  closeModalButtons.forEach(button => button.addEventListener('click', closeModal));
  closeLegendsButtons.forEach(button => button.addEventListener('click', closeLegendsModal));
  closeRulesButtons.forEach(button => button.addEventListener('click', closeRulesModal));
  closeResultsButtons.forEach(button => button.addEventListener('click', closeResultsModal));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (uploadModal.classList.contains('is-open')) closeModal();
    if (legendsModal.classList.contains('is-open')) closeLegendsModal();
    if (rulesModal.classList.contains('is-open')) closeRulesModal();
    if (resultsModal.classList.contains('is-open')) closeResultsModal();
  });

  fileInput.addEventListener('change', () => setSelectedFile(fileInput.files[0]));
  ['dragenter', 'dragover'].forEach(eventName => dropzone.addEventListener(eventName, event => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
  ['dragleave', 'drop'].forEach(eventName => dropzone.addEventListener(eventName, event => { event.preventDefault(); dropzone.classList.remove('is-dragging'); }));
  dropzone.addEventListener('drop', event => {
    const [file] = event.dataTransfer.files;
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    setSelectedFile(file);
  });

  uploadForm.addEventListener('submit', handleUploadSubmit);

  const competitorsToggle = $('#competitorsToggle');
  const allCompetitors = $('#allCompetitors');
  competitorsToggle?.addEventListener('click', () => {
    const isOpen = allCompetitors.classList.toggle('is-open');
    competitorsToggle.setAttribute('aria-expanded', String(isOpen));
    const label = $('span', competitorsToggle);
    if (label) label.textContent = isOpen ? 'Ocultar competidores' : 'Ver todos los competidores';
  });
}

/* ---------- scroll reveal + active nav + pointer parallax + particles ---------- */
function initReveal() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  $$('.reveal').forEach(el => observer.observe(el));
}
function initActiveNav() {
  const sections = $$('main section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-35% 0px -55%' });
  sections.forEach(section => observer.observe(section));
}
function initParticles(amount = 28) {
  const container = $('#particles');
  if (!container) return;
  const colors = ['#15d9ff', '#ff35c7', '#8347ff'];
  for (let index = 0; index < amount; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.color = colors[index % colors.length];
    particle.style.animationDuration = `${12 + Math.random() * 14}s`;
    particle.style.animationDelay = `${Math.random() * -20}s`;
    particle.style.opacity = String(0.25 + Math.random() * 0.5);
    container.appendChild(particle);
  }
}
function initPointerParallax() {
  window.addEventListener('pointermove', event => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    document.documentElement.style.setProperty('--pointer-x', String(x));
    document.documentElement.style.setProperty('--pointer-y', String(y));
    $$('.podium-card').forEach((card, index) => {
      const strength = index === 1 ? 7 : 4;
      card.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
  });
  window.addEventListener('pointerleave', () => $$('.podium-card').forEach(card => { card.style.transform = ''; }));
}

/* ---------- init ---------- */
function init() {
  renderIcons();
  bind();
  render();
  initReveal();
  initActiveNav();
  initParticles();
  initPointerParallax();
  initCloudSync();
}
init();
