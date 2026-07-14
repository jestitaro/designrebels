const STORAGE = 'qs-league-mvp-v9';
const SESSION = 'qs-league-session-v2';
const RULES_STORAGE = 'qs-league-rules-v2';

const fmt = value => new Intl.NumberFormat('es-AR').format(value || 0);
const norm = value => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const clone = value => JSON.parse(JSON.stringify(value));
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const zeroMedals = () => ({ gold: 0, silver: 0, bronze: 0 });

const teams = [
  { id: 'design', name: 'Design Rebels', icon: '🦖' },
  { id: 'dev', name: 'Dev Raptors', icon: '🧬' },
  { id: 'bi', name: 'BI Saurios', icon: '📊' },
  { id: 'ops', name: 'Ops Rex', icon: '⚡' }
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
    { id:'s2-20260702-may', type:'dino', player:'mayra', delta:3, reason:'02 de julio 2026 - Ale: 🥇 Oro +3' },
    { id:'s2-20260702-javi', type:'dino', player:'javi', delta:2, reason:'02 de julio 2026 - Ale: 🥈 Plata +2' },
    { id:'s2-20260702-nico', type:'dino', player:'nico', delta:1, reason:'02 de julio 2026 - Ale: 🥉 Bronce +1' }
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
  { title:'Nueva etapa', body:'Desde Season 02 cada Kahoot suma oro +3, plata +2 y bronce +1.' },
  { title:'Ajustes admin', body:'Todo ajuste manual de DinoCoins o meteoritos requiere motivo obligatorio.' },
  { title:'Meteoritos', body:'Los meteoritos empiezan desde la temporada actual y se cargan o quitan manualmente por admin.' },
  { title:'Leyendas', body:'Los semestres cerrados quedan en Leyendas con su ranking histórico.' }
];

let state = load();
let mode = 'teams';
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
      meteorites: Math.max(0, Number(saved.meteorites ?? seedPlayer.meteorites ?? 0))
    };
  });
  savedPlayers.forEach(player => { if(player?.id && !merged.some(item => item.id === player.id)) merged.push(player); });
  return merged;
}
function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function on(selector, event, handler){ const element = $(selector); if(element) element.addEventListener(event, handler); }
function team(id){ return state.teams.find(item => item.id === id) || { name:'Sin equipo', icon:'?' }; }
function player(id){ return state.players.find(item => item.id === id); }
function fileBaseName(name){ return String(name || 'Kahoot QS League').replace(/\.(xlsx|xls|csv)$/i,''); }

function init(){
  ensureRuntimeStyles();
  bind();
  populateAdjustPlayers();
  renderRules();
  if(localStorage.getItem(SESSION)) showApp(false);
  render();
}
function bind(){
  on('#loginForm','submit', event => { event.preventDefault(); localStorage.setItem(SESSION,'1'); showApp(true); toast('Bienvenida a QS League.'); });
  on('#demoLogin','click', () => { localStorage.setItem(SESSION,'1'); showApp(true); toast('Modo admin demo activo.'); });
  on('#logoutBtn','click', () => { localStorage.removeItem(SESSION); $('#appView')?.classList.add('hidden'); $('#loginView')?.classList.remove('hidden'); });
  on('#menuBtn','click', () => $('.sidebar')?.classList.toggle('open'));
  $$('[data-tab]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); setTab(button.dataset.tab); }));
  $$('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; $$('[data-mode]').forEach(item => item.classList.toggle('active', item === button)); renderRanking(); }));
  on('#search','input', renderRanking);
  on('#demoImport','click', demoImport);
  on('#applyImport','click', applyImport);
  on('#downloadTemplate','click', downloadTemplate);
  on('#resetLocal','click', resetLocal);
  on('#applyManualAdjust','click', applyManualAdjust);
  on('#saveRules','click', saveRules);
  on('#restoreRules','click', restoreRules);
  on('#fileInput','change', event => readFiles([...event.target.files]));
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
  render();
  if(withConfetti) dropConfetti();
}
function setTab(tab){
  if(window.qsLeagueSetTab) window.qsLeagueSetTab(tab);
  else {
    $$('.tab').forEach(panel => panel.classList.toggle('active', panel.id === tab));
    $$('.sidebar nav button,[data-tab].ghost').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  }
  if(tab === 'legends') dropConfetti();
}

function standingsPlayers(){ return [...state.players].sort((a,b) => (b.coins || 0) - (a.coins || 0) || (b.medals.gold || 0) - (a.medals.gold || 0) || a.name.localeCompare(b.name)); }
function standingsTeams(){
  return state.teams.map(teamItem => {
    const members = state.players.filter(item => item.team === teamItem.id);
    return {
      ...teamItem,
      members,
      coins: members.reduce((sum,item) => sum + (item.coins || 0), 0),
      gold: members.reduce((sum,item) => sum + (item.medals?.gold || 0), 0),
      meteorites: members.reduce((sum,item) => sum + (item.meteorites || 0), 0)
    };
  }).sort((a,b) => b.coins - a.coins || b.gold - a.gold || a.name.localeCompare(b.name));
}
function render(){ renderStats(); renderRanking(); renderArenaPodium(); renderTimeline(); renderPreview(); renderLegends(); }
function renderStats(){
  const total = state.players.reduce((sum,item) => sum + (item.coins || 0), 0);
  if($('#totalCoins')) $('#totalCoins').textContent = fmt(total);
  if($('#totalPlayers')) $('#totalPlayers').textContent = state.players.length;
  if($('#totalTeams')) $('#totalTeams').textContent = state.teams.length;
  if($('#seasonTotal')) $('#seasonTotal').textContent = `${fmt(total)} DinoCoins`;
  if($('#seasonBar')) $('#seasonBar').style.width = Math.min(100, total * 12) + '%';
}
function renderRanking(){
  const container = $('#rankingList');
  if(!container) return;
  const q = norm($('#search')?.value);
  if(mode === 'teams'){
    container.innerHTML = standingsTeams().filter(item => norm(item.name + item.members.map(member => member.name).join(' ')).includes(q)).map((item,index) => `<article class="rank-row"><span class="place">${String(index+1).padStart(2,'0')}</span><div><h3>${item.icon} ${item.name}</h3><small>${item.members.length} integrantes · ${item.gold} oros · ☄️ ${item.meteorites}</small></div><div class="medals"><span>🥇 ${item.gold}</span><span>☄️ ${item.meteorites}</span></div><div class="coins">${fmt(item.coins)} 🪙</div></article>`).join('');
    return;
  }
  container.innerHTML = standingsPlayers().filter(item => norm(item.name + (item.aliases || []).join(' ') + team(item.team).name).includes(q)).map((item,index) => `<article class="rank-row"><span class="place">${String(index+1).padStart(2,'0')}</span><div><h3>${item.name}</h3><small>${team(item.team).name} · ☄️ ${item.meteorites || 0}</small></div>${medals(item)}<div class="coins">${fmt(item.coins)} 🪙</div></article>`).join('');
}
function medals(item){ return `<div class="medals"><span>🥇 ${item.medals?.gold || 0}</span><span>🥈 ${item.medals?.silver || 0}</span><span>🥉 ${item.medals?.bronze || 0}</span></div>`; }
function renderArenaPodium(){
  const container = $('#podium');
  if(!container) return;
  const items = [
    { medal:'🥇', title:'Oro', text:'+3 DinoCoins', detail:'Ganador de la fecha' },
    { medal:'🥈', title:'Plata', text:'+2 DinoCoins', detail:'Segundo puesto' },
    { medal:'🥉', title:'Bronce', text:'+1 DinoCoin', detail:'Tercer puesto' }
  ];
  container.innerHTML = items.map((item,index) => `<article class="podium-card arena-demo-card"><span class="place">${item.medal} ${index+1}</span><div class="avatar">${item.medal}</div><h3>${item.title}</h3><p>${item.detail}</p><div class="coins">${item.text}</div><small>Ranking real en Arena actual</small></article>`).join('');
}
function renderTimeline(){
  const container = $('#timeline');
  if(!container) return;
  if(!state.ledger.length){ container.innerHTML = '<article class="activity"><strong>Nueva temporada lista</strong><span>Cargá el último Kahoot o aplicá un ajuste admin con motivo.</span></article>'; return; }
  container.innerHTML = [...state.ledger].reverse().slice(0,10).map(item => {
    const target = player(item.player)?.name || 'Sistema';
    const icon = item.type === 'meteor' ? '☄️' : '🪙';
    const sign = item.delta > 0 ? '+' : '';
    return `<article class="activity"><strong>${target} ${sign}${item.delta} ${icon}</strong><span>${item.reason}</span></article>`;
  }).join('');
}

function populateAdjustPlayers(){
  const select = $('#adjustPlayer');
  if(!select) return;
  select.innerHTML = state.players.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
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
  $('#semesterPodium').innerHTML = sorted.slice(0,3).map((item,index) => `<article class="semester-winner"><div class="medal">${['🥇','🥈','🥉'][index]}</div><div class="place">#${index+1}</div><h3>${item.name}</h3><strong>${item.wins} victoria${item.wins===1?'':'s'}</strong><small>Histórico: solo ganadores</small></article>`).join('');
  $('#semesterRanking').innerHTML = sorted.map((item,index) => `<article class="semester-row"><b>${String(index+1).padStart(2,'0')}</b><div><strong>${item.name}</strong><span>${item.wins ? 'Ganó al menos una fecha' : 'Sin victorias en el corte'}</span></div><div class="wins-pill">${item.wins} ${item.wins===1?'victoria':'victorias'}</div></article>`).join('');
  $('#semesterHistory').innerHTML = season.history.map(item => `<article class="history-row"><span>${item.date}</span><div><b>${item.winner}</b><span>Moderador: ${item.moderator}</span></div><em class="${item.status === 'Confirmar' ? 'state-confirmar' : ''}">${item.status}</em></article>`).join('');
}

function award(rank){ return rank===1 ? { delta:3, key:'gold', label:'🥇 Oro +3' } : rank===2 ? { delta:2, key:'silver', label:'🥈 Plata +2' } : rank===3 ? { delta:1, key:'bronze', label:'🥉 Bronce +1' } : { delta:0, key:null, label:'—' }; }
function findPlayer(nick){ const n = norm(nick); return state.players.find(item => [item.name, ...(item.aliases || [])].some(alias => norm(alias) === n)); }
function findHeader(headers, names){ return headers.find(header => names.some(name => norm(header).includes(name))); }
function cleanNumber(value){ return Number(String(value ?? '').replace(/[^0-9.,-]/g,'').replace(',','.')) || 0; }
async function readFiles(files){
  const validFiles = files.filter(file => /\.(xlsx|xls|csv)$/i.test(file.name));
  if(!validFiles.length){ toast('Elegí reportes XLSX, XLS o CSV de Kahoot.'); return; }
  const imported = [];
  const failed = [];
  for(const file of validFiles){
    try{
      const parsed = file.name.toLowerCase().endsWith('.csv') ? await csv(file) : await xlsx(file);
      const preview = parseKahootRows(parsed.rows, { fileName:file.name, source:parsed.source || 'CSV', sheet:parsed.sheet || 'CSV' });
      if(preview.rows.length) imported.push(preview); else failed.push(file.name);
    } catch(error){ console.error(error); failed.push(file.name); }
  }
  if(!imported.length){ toast('No pude leer ningún reporte. Probá con XLSX de Kahoot Reports.'); return; }
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
  const msg = imported.length === 1 ? `Detecté ${state.pending.length} participantes.` : `Detecté ${imported.length} reportes y ${state.pending.length} filas.`;
  toast(failed.length ? `${msg} ${failed.length} archivo(s) fallaron.` : msg);
}
function renderPreview(){
  const container = $('#preview');
  if(!container) return;
  if(!state.pending){ container.className = 'preview empty'; container.textContent = 'Todavía no hay archivo cargado.'; return; }
  container.className = 'preview';
  const mapped = state.pending.filter(row => row.playerId).length;
  const unmapped = state.pending.length - mapped;
  const meta = state.pendingMeta || {};
  const files = meta.files || [];
  const opts = ['<option value="">Sin mapear</option>', ...state.players.map(item => `<option value="${item.id}">${item.name}</option>`)].join('');
  const warning = unmapped ? `<p class="preview-warning">Hay ${unmapped} participante${unmapped>1?'s':''} sin mapear. Podés seleccionarlo manualmente antes de aplicar puntos.</p>` : '';
  const failed = meta.failed?.length ? `<p class="preview-warning">No pude leer: ${meta.failed.join(', ')}</p>` : '';
  const fileSummary = files.length ? `<p class="preview-source">Reportes: ${files.map(file => `${file.fileName || 'archivo'} (${file.sheet || 'hoja?'})`).join(' · ')}</p>` : '';
  container.innerHTML = `<div class="import-status"><article><strong>${fmt(files.length || 1)}</strong><span>reportes</span></article><article><strong>${fmt(state.pending.length)}</strong><span>filas</span></article><article><strong>${fmt(mapped)}</strong><span>mapeados</span></article><article><strong>${fmt(unmapped)}</strong><span>sin mapear</span></article></div>${fileSummary}${warning}${failed}<table><thead><tr><th>Reporte</th><th>Rank</th><th>Nickname Kahoot</th><th>Score</th><th>Correctas</th><th>Mapeo QS</th><th>Premio</th></tr></thead><tbody>${state.pending.map((row,index) => `<tr><td>${row.reportName || 'Kahoot'}</td><td>${row.rank}</td><td>${row.nickname}</td><td>${fmt(row.score)}</td><td>${row.correct ?? '—'}</td><td><select data-map="${index}">${opts}</select><div class="${row.playerId?'mapped':'unmapped'}">${row.playerId?'Detectado':'Revisar'}</div></td><td>${award(row.rank).label}</td></tr>`).join('')}</tbody></table>`;
  $$('[data-map]').forEach(select => { select.value = state.pending[select.dataset.map].playerId; select.addEventListener('change', () => { state.pending[select.dataset.map].playerId = select.value; save(); renderPreview(); }); });
}
function demoImport(){
  const demoRows = [
    { Nickname:'Jesi', Score:11250, Rank:1, Correctas:14 },
    { Nickname:'Nico', Score:10880, Rank:2, Correctas:13 },
    { Nickname:'Agus', Score:10120, Rank:3, Correctas:12 },
    { Nickname:'Sebas', Score:9900, Rank:4, Correctas:12 },
    { Nickname:'Javi', Score:9500, Rank:5, Correctas:11 },
    { Nickname:'Euge', Score:7400, Rank:6, Correctas:9 }
  ];
  buildBatchPreview([parseKahootRows(demoRows, { fileName:'demo-kahoot.csv', source:'Demo', sheet:'Demo' })]);
}
function applyImport(){
  const mapped = state.pending?.filter(row => row.playerId) || [];
  if(mapped.length < 3){ toast('Mapeá al menos 3 participantes.'); return; }
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
  state.pending = null;
  state.pendingMeta = null;
  save();
  if($('#applyImport')) $('#applyImport').disabled = true;
  render(); setTab('arena'); dropConfetti(); toast('Reporte aplicado. Ranking actualizado.');
}
function downloadTemplate(){
  const csv = 'Nickname,Score,Rank,Correctas\nJesi,11250,1,14\nNico,10880,2,13\nAgus,10120,3,12\nSebas,9900,4,12\nJavi,9500,5,11\nEuge,7400,6,9\n';
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'qs-league-kahoot-demo.csv'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
function resetLocal(){
  ['qs-league-mvp-v9','qs-league-mvp-v8','qs-league-mvp-v7','qs-league-mvp-v6','qs-league-mvp-v5','qs-league-mvp-v4','qs-league-mvp-v3','qs-league-mvp-v2'].forEach(key => localStorage.removeItem(key));
  state = clone(seed); populateAdjustPlayers(); save(); render(); toast('Datos locales reiniciados.');
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
  toast('Reglas guardadas en modo admin.');
}
function restoreRules(){ localStorage.removeItem(RULES_STORAGE); renderRules(); toast('Reglas base restauradas.'); }
function toast(message){
  const toastNode = $('#toast');
  if(!toastNode) return;
  toastNode.textContent = message;
  toastNode.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastNode.classList.remove('show'), 2800);
}
function ensureRuntimeStyles(){
  if($('#qsLeagueRuntimeStyles')) return;
  const style = document.createElement('style');
  style.id = 'qsLeagueRuntimeStyles';
  style.textContent = `.confetti-layer{position:fixed;inset:0;z-index:999;pointer-events:none;overflow:hidden}.confetti-piece{position:absolute;top:-20px;width:10px;height:16px;border-radius:3px;animation:qsConfetti 1.8s ease-in forwards}.arena-demo-card{position:relative;overflow:hidden}.arena-demo-card:after{content:"";position:absolute;inset:auto -30% -40% -30%;height:80%;background:radial-gradient(circle,rgba(183,255,24,.22),transparent 65%);opacity:.75}.semester-podium{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.semester-winner,.semester-row,.history-row{border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.06);padding:14px}.semester-winner{text-align:center}.semester-winner .medal{font-size:42px}.semester-row,.history-row{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;margin-bottom:8px}.semester-row span,.history-row span{display:block;color:var(--muted);font-size:12px}.wins-pill{font-weight:950;color:var(--lime)}.state-confirmar{color:var(--gold)}.admin-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.admin-form .wide{grid-column:1/-1}.admin-form select{width:100%;border:1px solid var(--line);border-radius:16px;background:rgba(4,6,14,.72);color:var(--text);padding:14px;outline:none}.secondary-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.preview-warning{color:var(--gold)!important}.preview-source{color:var(--muted)!important}@keyframes qsConfetti{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}@media(max-width:860px){.semester-podium,.admin-form{grid-template-columns:1fr}.semester-row,.history-row{grid-template-columns:36px 1fr}.wins-pill,.history-row em{grid-column:2}}`;
  document.head.appendChild(style);
}
function dropConfetti(){
  if(confettiDone && !$('#legends')?.classList.contains('active')) return;
  confettiDone = true;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  const colors = ['#b7ff18','#20f6ff','#ffd15c','#ff4fd8','#7c3cff'];
  for(let index=0; index<34; index++){
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