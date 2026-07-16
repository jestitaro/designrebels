const STORAGE = 'qs-league-mvp-v10';
const SESSION = 'qs-league-session-v2';
const RULES_STORAGE = 'qs-league-rules-v2';

const zeroMedals = () => ({ gold: 0, silver: 0, bronze: 0 });
const clone = value => JSON.parse(JSON.stringify(value));
const fmt = value => new Intl.NumberFormat('es-AR').format(value || 0);
const norm = value => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const teams = [
  { id: 'design', name: 'Design Rebels' },
  { id: 'dev', name: 'Dev Raptors' },
  { id: 'bi', name: 'BI Saurios' },
  { id: 'ops', name: 'Ops Rex' }
];

const basePlayers = [
  { id: 'ale', name: 'Ale', team: 'dev', aliases: ['Ale','Alejandro','8706743'] },
  { id: 'euge', name: 'Euge', team: 'design', aliases: ['Euge','Eugenia','Eugenio'] },
  { id: 'hero', name: 'Hero', team: 'ops', aliases: ['Hero','Heror','Heroe','Héroe'] },
  { id: 'javi', name: 'Javi', team: 'dev', aliases: ['Javi','Javier','Javu'] },
  { id: 'jess', name: 'Jesi', team: 'design', aliases: ['Jesi','Jes','Jess','Jesica'] },
  { id: 'luly', name: 'Luly', team: 'bi', aliases: ['Luly','Luy'] },
  { id: 'mayra', name: 'May', team: 'bi', aliases: ['May','Mayra','May(Ra)'] },
  { id: 'nico', name: 'Nico', team: 'ops', aliases: ['Nico','Nicolas','Nicolás'] },
  { id: 'seba', name: 'Sebas', team: 'ops', aliases: ['Sebas','Seba','Sebastian','Sebastián'] },
  { id: 'tuki', name: 'Tuki', team: 'design', aliases: ['Tuki'] }
];

const currentSeedScores = {
  mayra: { coins: 3, medals: { gold: 1, silver: 0, bronze: 0 } },
  javi: { coins: 2, medals: { gold: 0, silver: 1, bronze: 0 } },
  nico: { coins: 1, medals: { gold: 0, silver: 0, bronze: 1 } }
};

const seed = {
  teams,
  players: basePlayers.map(player => ({
    ...player,
    coins: currentSeedScores[player.id]?.coins || 0,
    medals: currentSeedScores[player.id]?.medals || zeroMedals(),
    meteorites: 0
  })),
  ledger: [
    { id:'s2-20260702-may', type:'dino', player:'mayra', delta:3, reason:'02 de julio 2026 - Ale: Oro +3' },
    { id:'s2-20260702-javi', type:'dino', player:'javi', delta:2, reason:'02 de julio 2026 - Ale: Plata +2' },
    { id:'s2-20260702-nico', type:'dino', player:'nico', delta:1, reason:'02 de julio 2026 - Ale: Bronce +1' }
  ],
  imports: [
    { id:'import-20260702', session:'02 de julio 2026 - Ale', date:'2026-07-02', rows:[
      { rank:1, playerId:'mayra', nickname:'May', score:13157, correct:15 },
      { rank:2, playerId:'javi', nickname:'Javi', score:12973, correct:13 },
      { rank:3, playerId:'nico', nickname:'Nico', score:11460, correct:11 },
      { rank:4, playerId:'tuki', nickname:'Tuki', score:11097, correct:14 },
      { rank:5, playerId:'jess', nickname:'Jesi', score:10748, correct:13 },
      { rank:6, playerId:'seba', nickname:'Sebas', score:10199, correct:12 },
      { rank:7, playerId:'ale', nickname:'8706743', score:8698, correct:10 }
    ] }
  ],
  pending: null,
  pendingMeta: null,
  nextModerator: 'ale'
};

const legends = {
  seasons: [
    {
      id: '2026-s1',
      label: 'Enero-junio 2026',
      dates: 19,
      note: 'Primer semestre cerrado. Cuenta solo ganadores; no suma plata ni bronce. Los meteoritos empiezan desde Season 02.',
      winners: [
        { name:'Hero', wins:5 },
        { name:'Nico', wins:4 },
        { name:'Jesi', wins:3 },
        { name:'Javi', wins:2 },
        { name:'Tuki', wins:2 },
        { name:'Sebas', wins:2 },
        { name:'Luly', wins:1 },
        { name:'May', wins:0 },
        { name:'Euge', wins:0 },
        { name:'Ale', wins:0 }
      ],
      history: [
        { date:'08/01', winner:'Hero', score:6971, moderator:'Lucrecia', status:'Validada' },
        { date:'29/01', winner:'Javi', score:7491, moderator:'Jesi', status:'Validada' },
        { date:'05/02', winner:'Tuki', score:15916, moderator:'Sin identificar', status:'Validada' },
        { date:'12/02', winner:'Hero', score:9969, moderator:'Lucre', status:'Validada' },
        { date:'26/02', winner:'Jesi', score:12242, moderator:'Euge', status:'Confirmar' },
        { date:'05/03', winner:'Tuki', score:12950, moderator:'Euge', status:'Validada' },
        { date:'19/03', winner:'Sebas', score:7682, moderator:'Jesi', status:'Validada' },
        { date:'26/03', winner:'Javi', score:13041, moderator:'May', status:'Validada' },
        { date:'09/04', winner:'Luly', score:20642, moderator:'Euge', status:'Validada' },
        { date:'16/04', winner:'Nico', score:11538, moderator:'Agustín', status:'Validada' },
        { date:'23/04', winner:'Hero', score:13782, moderator:'Ale', status:'Validada' },
        { date:'07/05', winner:'Nico', score:5503, moderator:'Jesi', status:'Validada' },
        { date:'14/05', winner:'Jesi', score:15625, moderator:'Ale', status:'Validada' },
        { date:'21/05', winner:'Jesi', score:9956, moderator:'Euge', status:'Validada' },
        { date:'28/05', winner:'Nico', score:16025, moderator:'Sebas', status:'Validada' },
        { date:'04/06', winner:'Hero', score:11159, moderator:'Sebas', status:'Validada' },
        { date:'11/06', winner:'Sebas', score:7855, moderator:'May', status:'Validada' },
        { date:'18/06', winner:'Hero', score:10716, moderator:'Euge', status:'Validada' },
        { date:'25/06', winner:'Nico', score:9306, moderator:'Sebas', status:'Validada' }
      ]
    }
  ]
};

const defaultRules = [
  { title:'Puntos por podio', body:'Desde Season 02: oro +3, plata +2 y bronce +1.' },
  { title:'Ranking actual', body:'La Arena actual muestra el ranking individual. Equipos queda pausado hasta definir la mecánica grupal.' },
  { title:'Ajustes admin', body:'Se pueden sumar o quitar DinoCoins y meteoritos, siempre explicando el motivo.' },
  { title:'Leyendas', body:'Los semestres cerrados pasan a Leyendas. El primer semestre 2026 cuenta solo ganadores.' }
];

let state = load();
let confettiDone = false;

function load(){
  try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE)) || clone(seed)); }
  catch { return clone(seed); }
}
function normalizeState(next){
  const normalized = { ...clone(seed), ...next };
  normalized.teams = Array.isArray(next.teams) ? next.teams : seed.teams;
  normalized.players = mergePlayers(Array.isArray(next.players) ? next.players : []);
  normalized.ledger = Array.isArray(next.ledger) ? next.ledger : [];
  normalized.imports = Array.isArray(next.imports) ? next.imports : [];
  normalized.pending = Array.isArray(next.pending) ? next.pending : null;
  normalized.pendingMeta = next.pendingMeta || null;
  return normalized;
}
function mergePlayers(savedPlayers){
  const savedById = new Map(savedPlayers.map(player => [player.id, player]));
  const merged = seed.players.map(seedPlayer => {
    const saved = savedById.get(seedPlayer.id) || {};
    return {
      ...seedPlayer,
      ...saved,
      name: seedPlayer.name,
      team: saved.team || seedPlayer.team,
      aliases: [...new Set([...(seedPlayer.aliases || []), ...(saved.aliases || [])])],
      medals: { ...seedPlayer.medals, ...(saved.medals || {}) },
      meteorites: Number(saved.meteorites || seedPlayer.meteorites || 0)
    };
  });
  savedPlayers.forEach(player => { if(player?.id && !merged.some(item => item.id === player.id)) merged.push(player); });
  return merged;
}
function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function player(id){ return state.players.find(item => item.id === id); }
function team(id){ return state.teams.find(item => item.id === id) || { name:'Sin equipo' }; }
function on(selector,event,handler){ const node = $(selector); if(node) node.addEventListener(event,handler); }
function fileBaseName(name){ return String(name || 'Kahoot QS League').replace(/\.(xlsx|xls|csv)$/i,''); }
function icon(type, extra=''){ return `<span class="ui-icon ${type} ${extra}" aria-hidden="true"></span>`; }
function medalClass(key){ return key === 'gold' ? 'medal-gold' : key === 'silver' ? 'medal-silver' : 'medal-bronze'; }

function init(){
  ensureRuntimeStyles();
  bind();
  render();
  if(localStorage.getItem(SESSION)) showApp(false);
}
function bind(){
  on('#loginForm','submit', event => { event.preventDefault(); localStorage.setItem(SESSION,'1'); showApp(true); });
  on('#demoLogin','click', () => { localStorage.setItem(SESSION,'1'); showApp(true); });
  on('#logoutBtn','click', () => { localStorage.removeItem(SESSION); $('#appView')?.classList.add('hidden'); $('#loginView')?.classList.remove('hidden'); });
  on('#menuBtn','click', () => $('.sidebar')?.classList.toggle('open'));
  document.addEventListener('click', event => {
    const tabButton = event.target.closest('[data-tab]');
    if(tabButton){ event.preventDefault(); setTab(tabButton.dataset.tab); }
  });
  on('#search','input', renderRanking);
  on('#openUploadModal','click', openUploadModal);
  on('#cancelUpload','click', closeUploadModal);
  on('#cancelUploadTop','click', closeUploadModal);
  on('#fileInput','change', event => readFiles([...event.target.files]));
  on('#applyImport','click', applyImport);
  on('#applyManualAdjust','click', applyManualAdjust);
  on('#saveRules','click', saveRules);
  on('#restoreRules','click', restoreRules);
  const drop = $('#dropZone');
  if(drop){
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('drag'); readFiles([...event.dataTransfer.files]); });
  }
}
function showApp(withConfetti){
  $('#loginView')?.classList.add('hidden');
  $('#appView')?.classList.remove('hidden');
  setTab('arena');
  render();
  if(withConfetti) dropConfetti();
}
function setTab(tab){
  const titles = { arena:'Arena actual', legends:'Leyendas', rules:'Reglas' };
  $$('.tab').forEach(panel => panel.classList.toggle('active', panel.id === tab));
  $$('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  if($('#pageTitle')) $('#pageTitle').textContent = titles[tab] || 'QS League';
  $('.sidebar')?.classList.remove('open');
  if(tab === 'legends') dropConfetti();
}
window.qsLeagueDemoLogin = function(){ localStorage.setItem(SESSION,'1'); showApp(true); };
window.qsLeagueSetTab = setTab;

function standingsPlayers(){
  return [...state.players].sort((a,b) =>
    (b.coins || 0) - (a.coins || 0) ||
    (b.medals?.gold || 0) - (a.medals?.gold || 0) ||
    (a.meteorites || 0) - (b.meteorites || 0) ||
    a.name.localeCompare(b.name)
  );
}
function render(){ renderStats(); renderRanking(); renderPodium(); renderTimeline(); renderLegends(); renderRules(); renderAdjustPlayers(); renderPreview(); }
function renderStats(){
  const total = state.players.reduce((sum,item) => sum + (item.coins || 0), 0);
  if($('#totalCoins')) $('#totalCoins').textContent = fmt(total);
  if($('#totalPlayers')) $('#totalPlayers').textContent = basePlayers.length;
  if($('#totalTeams')) $('#totalTeams').textContent = state.teams.length;
  if($('#seasonTotal')) $('#seasonTotal').textContent = `${fmt(total)} DinoCoins`;
  if($('#seasonBar')) $('#seasonBar').style.width = Math.min(100, total * 14) + '%';
}
function renderRanking(){
  const container = $('#rankingList');
  if(!container) return;
  const q = norm($('#search')?.value);
  container.innerHTML = standingsPlayers()
    .filter(item => norm(item.name + (item.aliases || []).join(' ') + team(item.team).name).includes(q))
    .map((item,index) => `<article class="rank-row"><span class="place">${String(index+1).padStart(2,'0')}</span><div class="rank-main"><h3>${item.name}</h3><small>${team(item.team).name}</small></div>${medals(item)}<div class="coins">${fmt(item.coins)} ${icon('coin-icon')}</div><div class="meteor-mini">${icon('meteor-icon')} ${item.meteorites || 0}</div></article>`).join('');
}
function medals(item){ return `<div class="medals"><span>${icon('medal-icon medal-gold')} ${item.medals?.gold || 0}</span><span>${icon('medal-icon medal-silver')} ${item.medals?.silver || 0}</span><span>${icon('medal-icon medal-bronze')} ${item.medals?.bronze || 0}</span></div>`; }
function renderPodium(){
  const container = $('#podium');
  if(!container) return;
  const items = [
    { key:'gold', title:'Oro', text:'+3 DinoCoins', detail:'Ganador de la fecha' },
    { key:'silver', title:'Plata', text:'+2 DinoCoins', detail:'Segundo puesto' },
    { key:'bronze', title:'Bronce', text:'+1 DinoCoin', detail:'Tercer puesto' }
  ];
  container.innerHTML = items.map((item,index) => `<article class="podium-card arena-demo-card"><span class="place">${String(index+1).padStart(2,'0')}</span><div class="avatar icon-avatar">${icon(`medal-icon ${medalClass(item.key)}`)}</div><h3>${item.title}</h3><p>${item.detail}</p><div class="coins">${item.text}</div></article>`).join('');
}
function renderTimeline(){
  const container = $('#timeline');
  if(!container) return;
  if(!state.ledger.length){ container.innerHTML = '<article class="activity"><strong>Nueva temporada lista</strong><span>Cargá el último Kahoot desde Arena para empezar a sumar DinoCoins.</span></article>'; return; }
  container.innerHTML = [...state.ledger].reverse().slice(0,10).map(item => {
    const itemIcon = item.type === 'meteor' ? icon('meteor-icon') : icon('coin-icon');
    const delta = item.delta > 0 ? `+${item.delta}` : item.delta;
    return `<article class="activity"><strong>${player(item.player)?.name || 'Sistema'} ${delta} ${itemIcon}</strong><span>${item.reason}</span></article>`;
  }).join('');
}

function renderAdjustPlayers(){
  const select = $('#adjustPlayer');
  if(!select) return;
  const current = select.value;
  select.innerHTML = state.players.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  if(current) select.value = current;
}
function applyManualAdjust(){
  const playerId = $('#adjustPlayer')?.value;
  const kind = $('#adjustKind')?.value;
  const action = $('#adjustAction')?.value;
  const amount = Math.max(1, Number($('#adjustAmount')?.value || 1));
  const reason = $('#adjustReason')?.value.trim();
  const target = player(playerId);
  if(!target){ toast('Elegí un jugador.'); return; }
  if(!reason){ toast('El motivo es obligatorio.'); return; }
  if(kind === 'dino'){
    const delta = action === 'add' ? amount : -Math.min(amount, target.coins || 0);
    if(delta === 0){ toast('No hay DinoCoins para quitar.'); return; }
    target.coins += delta;
    state.ledger.push({ id:`manual-${Date.now()}`, type:'dino', player:target.id, delta, reason:`Ajuste admin: ${reason}` });
  } else {
    const delta = action === 'add' ? amount : -Math.min(amount, target.meteorites || 0);
    if(delta === 0){ toast('No hay meteoritos para quitar.'); return; }
    target.meteorites = Math.max(0, (target.meteorites || 0) + delta);
    state.ledger.push({ id:`meteor-${Date.now()}`, type:'meteor', player:target.id, delta, reason:`Meteorito admin: ${reason}` });
  }
  $('#adjustReason').value = '';
  $('#adjustAmount').value = 1;
  save(); render(); toast('Ajuste aplicado y registrado.');
}

function renderLegends(){
  const season = legends.seasons[0];
  if(!season || !$('#semesterPodium')) return;
  const sorted = [...season.winners].sort((a,b) => b.wins - a.wins || a.name.localeCompare(b.name));
  if($('#semesterDates')) $('#semesterDates').textContent = season.dates;
  if($('#semesterWinners')) $('#semesterWinners').textContent = sorted.filter(item => item.wins > 0).length;
  if($('#semesterSeasons')) $('#semesterSeasons').textContent = legends.seasons.length;
  $('#semesterPodium').innerHTML = sorted.slice(0,3).map((item,index) => `<article class="semester-winner"><div class="medal">${icon(`medal-icon ${['medal-gold','medal-silver','medal-bronze'][index]}`)}</div><div class="place">#${index+1}</div><h3>${item.name}</h3><strong>${item.wins} victoria${item.wins===1?'':'s'}</strong></article>`).join('');
  $('#semesterRanking').innerHTML = sorted.map((item,index) => `<article class="semester-row"><b>${String(index+1).padStart(2,'0')}</b><div><strong>${item.name}</strong></div><div class="wins-pill">${item.wins} ${item.wins===1?'victoria':'victorias'}</div></article>`).join('');
  $('#semesterHistory').innerHTML = season.history.map(item => `<article class="history-row"><span>${item.date}</span><div><b>${item.winner}</b><span>Moderador: ${item.moderator}</span></div><em class="${item.status === 'Confirmar' ? 'state-confirmar' : ''}">${item.status}</em></article>`).join('');
}

function openUploadModal(){
  state.pending = null;
  state.pendingMeta = null;
  save();
  renderPreview();
  if($('#applyImport')) $('#applyImport').disabled = true;
  $('#uploadModal')?.classList.remove('hidden');
  $('#uploadModal')?.setAttribute('aria-hidden','false');
}
function closeUploadModal(){
  $('#uploadModal')?.classList.add('hidden');
  $('#uploadModal')?.setAttribute('aria-hidden','true');
  if($('#fileInput')) $('#fileInput').value = '';
  state.pending = null; state.pendingMeta = null; save(); renderPreview();
}
function award(rank){ return rank===1 ? { delta:3, key:'gold', label:'Oro +3' } : rank===2 ? { delta:2, key:'silver', label:'Plata +2' } : rank===3 ? { delta:1, key:'bronze', label:'Bronce +1' } : { delta:0, key:null, label:'—' }; }
function findPlayer(nick){ const n = norm(nick); return state.players.find(item => [item.name, ...(item.aliases || [])].some(alias => norm(alias) === n)); }
function findHeader(headers, names){ return headers.find(header => names.some(name => norm(header).includes(name))); }
function cleanNumber(value){ return Number(String(value ?? '').replace(/[^0-9.,-]/g,'').replace(',','.')) || 0; }
async function readFiles(files){
  const validFiles = files.filter(file => /\.(xlsx|xls|csv)$/i.test(file.name));
  if(!validFiles.length){ toast('Elegí un informe XLSX, XLS o CSV de Kahoot.'); return; }
  const imported = [];
  const failed = [];
  for(const file of validFiles){
    try{
      const parsed = file.name.toLowerCase().endsWith('.csv') ? await csv(file) : await xlsx(file);
      const preview = parseKahootRows(parsed.rows, { fileName:file.name, source:parsed.source || 'CSV', sheet:parsed.sheet || 'CSV' });
      if(preview.rows.length) imported.push(preview); else failed.push(file.name);
    } catch(error){ console.error(error); failed.push(file.name); }
  }
  if(!imported.length){ toast('No pude leer el informe. Probá con XLSX de Kahoot Reports.'); return; }
  buildBatchPreview(imported, failed);
}
function csv(file){ return file.text().then(text => ({ rows: parseCsvText(text), source:'CSV', sheet:'CSV' })); }
function parseCsvText(text){ return rowsFromMatrix(text.split(/\r?\n/).filter(line => line.trim()).map(line => splitCsv(line))).rows; }
function splitCsv(line){
  const output = []; let current = ''; let quoted = false;
  for(let index=0; index<line.length; index++){
    const char = line[index];
    if(char === '"' && line[index+1] === '"'){ current += '"'; index++; }
    else if(char === '"') quoted = !quoted;
    else if(char === ',' && !quoted){ output.push(current.replace(/^"|"$/g,'')); current = ''; }
    else current += char;
  }
  output.push(current.replace(/^"|"$/g,''));
  return output;
}
function xlsx(file){
  if(!window.XLSX) throw new Error('SheetJS no cargó');
  return file.arrayBuffer().then(buffer => { const workbook = XLSX.read(buffer); const candidate = pickKahootSheet(workbook); return { rows: candidate.rows, source:'XLSX', sheet:candidate.sheet }; });
}
function pickKahootSheet(workbook){
  const preferred = ['Final Scores','Final scores','Scores','Overview','Raw Report Data','Raw data','RawReportData'];
  const names = [...preferred.filter(name => workbook.SheetNames.includes(name)), ...workbook.SheetNames.filter(name => !preferred.includes(name))];
  for(const sheet of names){
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header:1, defval:'' });
    const parsed = rowsFromMatrix(matrix);
    if(parsed.rows.length && parsed.nameKey) return { sheet, rows: parsed.rows };
  }
  return { sheet: workbook.SheetNames[0], rows: XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval:'' }) };
}
function rowsFromMatrix(matrix){
  const aliases = ['nickname','player','name','nombre','participante','jugador','identifier','email'];
  const headerIndex = matrix.findIndex(row => row.some(cell => aliases.some(alias => norm(cell).includes(alias))));
  if(headerIndex < 0) return { rows:[], nameKey:null };
  const headers = matrix[headerIndex].map((header,index) => String(header || `column_${index}`).trim());
  const rows = matrix.slice(headerIndex+1).filter(row => row.some(Boolean)).map(row => Object.fromEntries(headers.map((header,index) => [header, row[index] ?? ''])));
  return { rows, nameKey: findHeader(headers, aliases) };
}
function parseKahootRows(rows, meta={}){
  const headers = Object.keys(rows[0] || {});
  const nameKey = findHeader(headers, ['nickname','player','name','nombre','participante','jugador','identifier','email']);
  const scoreKey = findHeader(headers, ['score','points','puntos','puntaje','total score','current total']);
  const rankKey = findHeader(headers, ['rank','puesto','position','ranking','place']);
  const correctKey = findHeader(headers, ['correct answers','correctas','correct']);
  if(!nameKey) return { rows:[], meta:{ ...meta, error:'No se detectó columna de jugador' } };
  const parsed = rows.map((row,index) => ({
    nickname: String(row[nameKey] || '').trim(),
    score: cleanNumber(row[scoreKey]),
    correct: correctKey ? cleanNumber(row[correctKey]) : null,
    rank: rankKey ? cleanNumber(row[rankKey]) : index + 1
  })).filter(row => row.nickname && !/average|total|summary|final scores/i.test(row.nickname));
  const rowsWithRank = parsed.sort((a,b) => rankKey ? a.rank - b.rank : b.score - a.score).map((row,index) => ({
    ...row,
    rank: index + 1,
    playerId: findPlayer(row.nickname)?.id || '',
    reportId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    reportName: fileBaseName(meta.fileName),
    sourceFile: meta.fileName || 'Reporte Kahoot',
    sheet: meta.sheet || '—'
  }));
  return { rows: rowsWithRank, meta:{ ...meta, count:rowsWithRank.length, nameKey, scoreKey, rankKey, correctKey } };
}
function buildBatchPreview(imported, failed=[]){
  state.pending = imported.flatMap(item => item.rows.map(row => ({ ...row, batchId:item.meta.fileName || item.meta.sheet || row.reportName })));
  state.pendingMeta = { files: imported.map(item => item.meta), failed, count:state.pending.length, createdAt:new Date().toISOString(), batch:true };
  save(); renderPreview();
  if($('#applyImport')) $('#applyImport').disabled = false;
  toast(`Informe cargado: ${state.pending.length} filas detectadas.`);
}
function renderPreview(){
  const container = $('#preview');
  if(!container) return;
  if(!state.pending){ container.className = 'preview empty'; container.textContent = 'Todavía no hay informe cargado.'; return; }
  container.className = 'preview';
  const mapped = state.pending.filter(row => row.playerId).length;
  const unmapped = state.pending.length - mapped;
  const meta = state.pendingMeta || {};
  const files = meta.files || [];
  const opts = ['<option value="">Sin mapear</option>', ...state.players.map(item => `<option value="${item.id}">${item.name}</option>`)].join('');
  const warning = unmapped ? `<p class="preview-warning">Hay ${unmapped} participante${unmapped>1?'s':''} sin mapear. Mapealos antes de actualizar el ranking.</p>` : '';
  const failed = meta.failed?.length ? `<p class="preview-warning">No pude leer: ${meta.failed.join(', ')}</p>` : '';
  const fileSummary = files.length ? `<p class="preview-source">Informe: ${files.map(file => `${file.fileName || 'archivo'} (${file.sheet || 'hoja?'})`).join(' · ')}</p>` : '';
  container.innerHTML = `<div class="import-status"><article><strong>${fmt(files.length || 1)}</strong><span>informes</span></article><article><strong>${fmt(state.pending.length)}</strong><span>filas</span></article><article><strong>${fmt(mapped)}</strong><span>mapeados</span></article><article><strong>${fmt(unmapped)}</strong><span>sin mapear</span></article></div>${fileSummary}${warning}${failed}<table><thead><tr><th>Rank</th><th>Nickname</th><th>Score</th><th>Correctas</th><th>Mapeo QS</th><th>Premio</th></tr></thead><tbody>${state.pending.map((row,index) => { const prize = award(row.rank); return `<tr><td>${row.rank}</td><td>${row.nickname}</td><td>${fmt(row.score)}</td><td>${row.correct ?? '—'}</td><td><select data-map="${index}">${opts}</select><div class="${row.playerId?'mapped':'unmapped'}">${row.playerId?'Detectado':'Revisar'}</div></td><td>${prize.key ? icon(`medal-icon ${medalClass(prize.key)}`) : ''} ${prize.label}</td></tr>`; }).join('')}</tbody></table>`;
  $$('[data-map]').forEach(select => { select.value = state.pending[select.dataset.map].playerId; select.addEventListener('change', () => { state.pending[select.dataset.map].playerId = select.value; save(); renderPreview(); }); });
}
function applyImport(){
  const mapped = state.pending?.filter(row => row.playerId) || [];
  if(mapped.length < 3){ toast('Mapeá al menos 3 participantes antes de actualizar.'); return; }
  const importId = `import-${Date.now()}`;
  const grouped = mapped.reduce((map,row) => { const key = row.batchId || row.reportName || 'Kahoot'; map.set(key, [...(map.get(key) || []), row]); return map; }, new Map());
  grouped.forEach((rows,key) => {
    const session = rows[0]?.reportName || $('#sessionName')?.value || 'Kahoot QS League';
    rows.forEach(row => {
      const prize = award(row.rank);
      const target = player(row.playerId);
      if(prize.delta && target){
        target.coins += prize.delta;
        target.medals[prize.key] += 1;
        state.ledger.push({ id:`${importId}-${key}-${target.id}-${row.rank}`, type:'dino', player:target.id, delta:prize.delta, reason:`${session}: ${prize.label}` });
      }
    });
    const last = [...rows].sort((a,b) => a.rank - b.rank)[rows.length - 1];
    if(last) state.nextModerator = last.playerId;
    state.imports.unshift({ id:`${importId}-${key}`, session, date:new Date().toISOString(), meta:{ ...state.pendingMeta, file:key }, rows });
  });
  state.pending = null; state.pendingMeta = null;
  save();
  closeUploadModal();
  render();
  setTab('arena');
  dropConfetti();
  toast('Ranking actualizado.');
}

function loadRules(){ try { return JSON.parse(localStorage.getItem(RULES_STORAGE)) || clone(defaultRules); } catch { return clone(defaultRules); } }
function renderRules(){
  const container = $('#rulesEditor');
  if(!container) return;
  const rules = loadRules();
  container.innerHTML = rules.map((rule,index) => `<article><span>${String(index+1).padStart(2,'0')}</span><h3 contenteditable="true" data-rule-title="${index}">${rule.title}</h3><p contenteditable="true" data-rule-body="${index}">${rule.body}</p></article>`).join('');
}
function saveRules(){
  const rules = loadRules().map((rule,index) => ({ title: $(`[data-rule-title="${index}"]`)?.textContent.trim() || rule.title, body: $(`[data-rule-body="${index}"]`)?.textContent.trim() || rule.body }));
  localStorage.setItem(RULES_STORAGE, JSON.stringify(rules));
  toast('Reglas guardadas.');
}
function restoreRules(){ localStorage.removeItem(RULES_STORAGE); renderRules(); toast('Reglas base restauradas.'); }

function toast(message){
  const node = $('#toast');
  if(!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2800);
}
function ensureRuntimeStyles(){
  if($('#qsLeagueRuntimeStyles')) return;
  const style = document.createElement('style');
  style.id = 'qsLeagueRuntimeStyles';
  style.textContent = `.modal{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:20px;background:rgba(3,5,15,.72);backdrop-filter:blur(14px)}.modal.hidden{display:none!important}.modal-card{width:min(980px,96vw);max-height:90vh;overflow:auto;border:1px solid var(--line);border-radius:28px;background:linear-gradient(180deg,rgba(31,37,64,.98),rgba(14,18,32,.98));box-shadow:var(--shadow);padding:24px}.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}.admin-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.admin-form .wide{grid-column:1/-1}.admin-form select,.preview select{width:100%;border:1px solid var(--line);border-radius:14px;background:#0c1020;color:var(--text);padding:12px}.menu-bars,.menu-bars:before,.menu-bars:after{display:block;width:18px;height:2px;border-radius:99px;background:currentColor;content:""}.menu-bars:before{transform:translateY(-6px)}.menu-bars:after{transform:translateY(4px)}.brand-mark{display:inline-grid;place-items:center;border-radius:50%;background:linear-gradient(135deg,var(--lime),var(--cyan));color:#06100e;font-weight:950}.brand-mark:after{content:"QS"}.brand-mark.sm{width:22px;height:22px;font-size:9px;margin-right:6px}.brand-mark.lg{width:96px;height:96px;font-size:26px}.ui-icon,.medal-icon,.coin-icon,.meteor-icon{display:inline-block;vertical-align:-.15em;flex:0 0 auto}.medal-icon{width:22px;height:22px;border-radius:50%;position:relative;border:2px solid rgba(255,255,255,.45);box-shadow:inset 0 0 10px rgba(0,0,0,.25),0 0 18px rgba(255,255,255,.12)}.medal-icon:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.78);transform:translate(-50%,-50%)}.medal-gold{background:linear-gradient(135deg,#fff4a8,#ffb300)}.medal-silver{background:linear-gradient(135deg,#ffffff,#9aa5c7)}.medal-bronze{background:linear-gradient(135deg,#ffd2a6,#b85c12)}.coin-icon{width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#ffffff,#b7ff18 35%,#56d737 78%);border:2px solid rgba(255,255,255,.45);box-shadow:0 0 14px rgba(183,255,24,.35)}.meteor-icon{width:22px;height:12px;border-radius:999px 60% 60% 999px;background:linear-gradient(90deg,transparent,#ff8f3a 45%,#ffdf70);transform:skewX(-18deg);box-shadow:0 0 14px rgba(255,143,58,.45)}.icon-avatar{display:grid;place-items:center}.icon-avatar .medal-icon{width:46px;height:46px}.ranking-panel{min-width:0}.rank-row{grid-template-columns:48px minmax(0,1fr) auto auto auto!important;align-items:center;overflow:visible}.rank-main h3{margin:0}.rank-main small{display:block;color:var(--muted);white-space:normal}.meteor-mini{font-weight:900;color:var(--bronze);white-space:nowrap;display:flex;gap:6px;align-items:center}.coins{display:flex;gap:6px;align-items:center}.medals{display:flex;gap:6px;flex-wrap:wrap}.medals span{display:inline-flex;gap:4px;align-items:center}.semester-podium{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.semester-winner,.semester-row,.history-row{border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.06);padding:14px;min-width:0}.semester-winner{text-align:center}.semester-winner .medal{min-height:46px}.semester-winner h3,.semester-winner strong{display:block;word-break:normal}.semester-row,.history-row{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:center;margin-bottom:8px}.semester-row span,.history-row span{display:block;color:var(--muted);font-size:12px}.wins-pill{font-weight:950;color:var(--lime);white-space:nowrap}.state-confirmar{color:var(--gold)}.confetti-layer{position:fixed;inset:0;z-index:999;pointer-events:none;overflow:hidden}.confetti-piece{position:absolute;top:-20px;width:10px;height:16px;border-radius:3px;animation:qsConfetti 1.8s ease-in forwards}@keyframes qsConfetti{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}@media(max-width:1100px){.arena-main-grid{grid-template-columns:1fr}.semester-podium{grid-template-columns:1fr}}@media(max-width:860px){.admin-form{grid-template-columns:1fr}.modal-actions{flex-direction:column}.rank-row{grid-template-columns:38px minmax(0,1fr)!important}.rank-row .medals,.rank-row .coins,.rank-row .meteor-mini{grid-column:2}.semester-row,.history-row{grid-template-columns:36px 1fr}.wins-pill,.history-row em{grid-column:2}}`;
  document.head.appendChild(style);
}
function dropConfetti(){
  if(confettiDone && !$('#legends')?.classList.contains('active')) return;
  confettiDone = true;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  const colors = ['#b7ff18','#20f6ff','#ffd15c','#ff4fd8','#7c3cff'];
  for(let index=0; index<30; index++){
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random()*100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random()*0.45}s`;
    piece.style.animationDuration = `${1.25 + Math.random()*1.1}s`;
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2600);
}

init();
