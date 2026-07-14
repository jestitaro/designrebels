const STORAGE = 'qs-league-mvp-v6';
const LEGACY_STORAGE = 'qs-league-mvp-v5';
const SESSION = 'qs-league-session-v2';

const seed = {
  teams: [
    { id: 'design', name: 'Design Rebels', icon: '🦖' },
    { id: 'dev', name: 'Dev Raptors', icon: '🧬' },
    { id: 'bi', name: 'BI Saurios', icon: '📊' },
    { id: 'ops', name: 'Ops Rex', icon: '⚡' }
  ],
  players: [
    { id: 'javi', name: 'Javi', team: 'dev', aliases: ['Javi','Javier','Javu'], coins: 2, medals: { gold:0, silver:1, bronze:0 }, strikes:0 },
    { id: 'nico', name: 'Nico', team: 'ops', aliases: ['Nico','Nicolas','Nicolás'], coins: 5, medals: { gold:1, silver:1, bronze:0 }, strikes:1 },
    { id: 'pablo', name: 'Pablo', team: 'dev', aliases: ['Pablo'], coins: 2, medals: { gold:0, silver:0, bronze:2 }, strikes:1 },
    { id: 'mayra', name: 'May', team: 'bi', aliases: ['May','Mayra','May(Ra)'], coins: 1, medals: { gold:0, silver:0, bronze:1 }, strikes:0 },
    { id: 'seba', name: 'Sebas', team: 'ops', aliases: ['Sebas','Seba','Sebastian','Sebastián'], coins: 2, medals: { gold:0, silver:1, bronze:0 }, strikes:0 },
    { id: 'jess', name: 'Jesi', team: 'design', aliases: ['Jesi','Jes','Jess','Jesica'], coins: 5, medals: { gold:1, silver:0, bronze:2 }, strikes:3 },
    { id: 'lucre', name: 'Lucre', team: 'bi', aliases: ['Lucre','Lucrecia'], coins: 1, medals: { gold:0, silver:0, bronze:1 }, strikes:1 },
    { id: 'agustin', name: 'Agustin', team: 'ops', aliases: ['Agustin','Agustín','Agus'], coins: 5, medals: { gold:1, silver:1, bronze:0 }, strikes:2 },
    { id: 'euge', name: 'Euge', team: 'design', aliases: ['Euge','Eugenia','Eugenio'], coins: 0, medals: { gold:0, silver:0, bronze:0 }, strikes:0 },
    { id: 'ale', name: 'Ale', team: 'dev', aliases: ['Ale','Alejandro','8706743'], coins: 0, medals: { gold:0, silver:0, bronze:0 }, strikes:1 },
    { id: 'hero', name: 'Hero', team: 'ops', aliases: ['Hero','Heror','Heroe','Héroe'], coins: 0, medals: { gold:0, silver:0, bronze:0 }, strikes:0 },
    { id: 'luly', name: 'Luly', team: 'bi', aliases: ['Luly','Luy'], coins: 0, medals: { gold:0, silver:0, bronze:0 }, strikes:0 },
    { id: 'tuki', name: 'Tuki', team: 'design', aliases: ['Tuki'], coins: 0, medals: { gold:0, silver:0, bronze:0 }, strikes:0 }
  ],
  ledger: [
    { id:'l1', player:'jess', delta:5, reason:'Carga inicial desde tabla manual' },
    { id:'l2', player:'nico', delta:5, reason:'Carga inicial desde tabla manual' },
    { id:'l3', player:'agustin', delta:5, reason:'Carga inicial desde tabla manual' }
  ],
  imports: [],
  nextModerator: 'euge',
  pending: null,
  pendingMeta: null
};

const semesterOne = {
  dates: 19,
  note: 'Enero a junio 2026. Se excluye 02/07 porque ya cae fuera del primer semestre.',
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
  meteorites: [
    { name:'Ale', count:11 },
    { name:'Luly', count:8 },
    { name:'Euge', count:6 },
    { name:'Jesi', count:6 },
    { name:'May', count:6 },
    { name:'Tuki', count:6 },
    { name:'Hero', count:5 },
    { name:'Nico', count:3 },
    { name:'Sebas', count:3 },
    { name:'Javi', count:2 }
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
};

let state = load();
let mode = 'teams';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => new Intl.NumberFormat('es-AR').format(n || 0);
const norm = s => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const clone = value => JSON.parse(JSON.stringify(value));

function load(){
  try {
    const current = localStorage.getItem(STORAGE);
    const legacy = localStorage.getItem(LEGACY_STORAGE) || localStorage.getItem('qs-league-mvp-v4') || localStorage.getItem('qs-league-mvp-v3') || localStorage.getItem('qs-league-mvp-v2');
    return normalizeState(JSON.parse(current || legacy) || clone(seed));
  } catch {
    return clone(seed);
  }
}
function normalizeState(next){
  const normalized = { ...clone(seed), ...next };
  normalized.teams = next.teams || seed.teams;
  normalized.players = mergePlayers(next.players || []);
  normalized.ledger = next.ledger || [];
  normalized.imports = next.imports || [];
  normalized.pending = next.pending || null;
  normalized.pendingMeta = next.pendingMeta || null;
  return normalized;
}
function mergePlayers(savedPlayers){
  const savedById = new Map(savedPlayers.map(p => [p.id, p]));
  const merged = seed.players.map(seedPlayer => {
    const saved = savedById.get(seedPlayer.id) || {};
    const aliases = [...new Set([...(seedPlayer.aliases || []), ...(saved.aliases || [])])];
    return { ...seedPlayer, ...saved, name: seedPlayer.name, team: saved.team || seedPlayer.team, aliases, medals: { ...seedPlayer.medals, ...(saved.medals || {}) } };
  });
  savedPlayers.forEach(p => { if(!merged.some(x => x.id === p.id)) merged.push(p); });
  return merged;
}
function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function team(id){ return state.teams.find(t => t.id === id) || { name:'Sin equipo', icon:'?' }; }
function player(id){ return state.players.find(p => p.id === id); }
function initials(name){ return String(name || '').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase(); }
function fileBaseName(name){ return String(name || 'Kahoot QS League').replace(/\.(xlsx|xls|csv)$/i,''); }

function init(){ bind(); if(localStorage.getItem(SESSION)) showApp(); render(); }

function bind(){
  $('#loginForm').addEventListener('submit', e => { e.preventDefault(); localStorage.setItem(SESSION,'1'); showApp(); toast('Bienvenida a QS League.'); });
  $('#demoLogin').addEventListener('click', () => { localStorage.setItem(SESSION,'1'); showApp(); toast('Modo admin demo activo.'); });
  $('#logoutBtn').addEventListener('click', () => { localStorage.removeItem(SESSION); $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden'); });
  $('#menuBtn').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
  $$('[data-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $$('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; $$('[data-mode]').forEach(x=>x.classList.toggle('active',x===b)); renderRanking(); }));
  $('#search').addEventListener('input', renderRanking);
  $('#demoImport').addEventListener('click', demoImport);
  $('#applyImport').addEventListener('click', applyImport);
  $('#fileInput').addEventListener('change', e => readFiles([...e.target.files]));
  $('#downloadTemplate').addEventListener('click', downloadTemplate);
  $('#resetLocal').addEventListener('click', resetLocal);
  const drop = $('#dropZone');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('drag'); readFiles([...e.dataTransfer.files]); });
}

function showApp(){ $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); render(); }
function setTab(tab){
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === tab));
  $$('.sidebar nav button,[data-tab].ghost').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('#pageTitle').textContent = ({arena:'Arena',semester:'Semestre 1',ranking:'Ranking',admin:'Kahoot',rules:'Reglas'})[tab] || 'QS League';
  $('.sidebar').classList.remove('open');
}

function standingsPlayers(){ return [...state.players].sort((a,b)=> b.coins-a.coins || b.medals.gold-a.medals.gold || a.name.localeCompare(b.name)); }
function standingsTeams(){ return state.teams.map(t => {
  const members = state.players.filter(p => p.team === t.id);
  return { ...t, members, coins: members.reduce((s,p)=>s+p.coins,0), gold: members.reduce((s,p)=>s+p.medals.gold,0) };
}).sort((a,b)=> b.coins-a.coins || b.gold-a.gold || a.name.localeCompare(b.name)); }

function render(){ renderStats(); renderPodium(); renderTeams(); renderTimeline(); renderRanking(); renderPreview(); renderSemester(); }
function renderStats(){
  const total = state.players.reduce((s,p)=>s+p.coins,0);
  $('#totalCoins').textContent = fmt(total);
  $('#totalPlayers').textContent = state.players.length;
  $('#totalTeams').textContent = state.teams.length;
  $('#seasonTotal').textContent = `${fmt(total)} DinoCoins`;
  $('#seasonBar').style.width = Math.min(100,total*3) + '%';
}
function renderPodium(){
  $('#podium').innerHTML = standingsPlayers().slice(0,3).map((p,i)=>`<article class="podium-card"><span class="place">${['🥇','🥈','🥉'][i]} ${i+1}</span><div class="avatar">${initials(p.name)}</div><h3>${p.name}</h3><p>${team(p.team).name}</p><div class="coins">${fmt(p.coins)} 🪙</div>${medals(p)}</article>`).join('');
}
function renderTeams(){
  $('#teams').innerHTML = standingsTeams().map((t,i)=>`<article class="team-card"><b>${t.icon}</b><h3>#${i+1} ${t.name}</h3><p>${t.members.map(m=>m.name).join(', ')}</p><div class="coins">${fmt(t.coins)} 🪙</div></article>`).join('');
}
function renderTimeline(){
  $('#timeline').innerHTML = [...state.ledger].reverse().slice(0,8).map(l=>`<article class="activity"><strong>${player(l.player)?.name || 'Sistema'} ${l.delta>0?'+':''}${l.delta} 🪙</strong><span>${l.reason}</span></article>`).join('');
}
function renderRanking(){
  const q = norm($('#search')?.value);
  if(mode === 'teams'){
    $('#rankingList').innerHTML = standingsTeams().filter(t=>norm(t.name + t.members.map(m=>m.name).join(' ')).includes(q)).map((t,i)=>`<article class="rank-row"><span class="place">${String(i+1).padStart(2,'0')}</span><div><h3>${t.icon} ${t.name}</h3><small>${t.members.length} integrantes · ${t.gold} oros</small></div><div class="medals"><span>🥇 ${t.gold}</span><span>👥 ${t.members.length}</span></div><div class="coins">${fmt(t.coins)} 🪙</div></article>`).join('');
    return;
  }
  $('#rankingList').innerHTML = standingsPlayers().filter(p=>norm(p.name + p.aliases.join(' ') + team(p.team).name).includes(q)).map((p,i)=>`<article class="rank-row"><span class="place">${String(i+1).padStart(2,'0')}</span><div><h3>${p.name}</h3><small>${team(p.team).name} · ${p.strikes} strikes</small></div>${medals(p)}<div class="coins">${fmt(p.coins)} 🪙</div></article>`).join('');
}
function medals(p){ return `<div class="medals"><span>🥇 ${p.medals.gold}</span><span>🥈 ${p.medals.silver}</span><span>🥉 ${p.medals.bronze}</span></div>`; }

function renderSemester(){
  if(!$('#semesterPodium')) return;
  const sorted = [...semesterOne.winners].sort((a,b)=> b.wins-a.wins || a.name.localeCompare(b.name));
  const totalMeteorites = semesterOne.meteorites.reduce((sum,item)=>sum+item.count,0);
  $('#semesterDates').textContent = semesterOne.dates;
  $('#semesterWinners').textContent = sorted.filter(item => item.wins > 0).length;
  $('#semesterMeteorites').textContent = totalMeteorites;
  $('#semesterPodium').innerHTML = sorted.slice(0,3).map((item,i)=>`<article class="semester-winner"><div class="medal">${['🥇','🥈','🥉'][i]}</div><div class="place">#${i+1}</div><h3>${item.name}</h3><strong>${item.wins} victoria${item.wins===1?'':'s'}</strong><small>Solo ganadores · sin plata/bronce histórico</small></article>`).join('');
  $('#semesterRanking').innerHTML = sorted.map((item,i)=>`<article class="semester-row"><b>${String(i+1).padStart(2,'0')}</b><div><strong>${item.name}</strong><span>${item.wins ? 'Ganó al menos una fecha' : 'Sin victorias en el corte'}</span></div><div class="wins-pill">${item.wins} ${item.wins===1?'victoria':'victorias'}</div></article>`).join('');
  $('#meteorList').innerHTML = semesterOne.meteorites.map(item=>`<article class="meteor-row"><b>${item.name}</b><span class="meteor-count">x${item.count}</span></article>`).join('');
  $('#semesterHistory').innerHTML = semesterOne.history.map(item=>`<article class="history-row"><span>${item.date}</span><div><b>${item.winner}</b><span>Moderador: ${item.moderator}</span></div><em class="${item.status === 'Confirmar' ? 'state-confirmar' : ''}">${item.status}</em></article>`).join('');
}

function award(rank){ return rank===1?{delta:3,key:'gold',label:'🥇 Oro +3'}:rank===2?{delta:2,key:'silver',label:'🥈 Plata +2'}:rank===3?{delta:1,key:'bronze',label:'🥉 Bronce +1'}:{delta:0,key:null,label:'—'}; }
function findPlayer(nick){ const n = norm(nick); return state.players.find(p => [p.name,...p.aliases].some(a => norm(a) === n)); }
function findHeader(headers, names){ return headers.find(h => names.some(n => norm(h).includes(n))); }
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
    }catch(e){ console.error(e); failed.push(file.name); }
  }
  if(!imported.length){ toast('No pude leer ningún reporte. Probá con XLSX de Kahoot Reports.'); return; }
  buildBatchPreview(imported, failed);
}
function csv(file){ return file.text().then(text => ({ rows: parseCsvText(text), source:'CSV', sheet:'CSV' })); }
function parseCsvText(text){
  const matrix = text.split(/\r?\n/).filter(line => line.trim()).map(line => splitCsv(line));
  const parsed = rowsFromMatrix(matrix);
  return parsed.rows;
}
function splitCsv(line){
  const out=[]; let cur=''; let quoted=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"' && line[i+1]==='"'){ cur+='"'; i++; }
    else if(c==='"') quoted=!quoted;
    else if(c===',' && !quoted){ out.push(cur.replace(/^"|"$/g,'')); cur=''; }
    else cur+=c;
  }
  out.push(cur.replace(/^"|"$/g,'')); return out;
}
function xlsx(file){ return file.arrayBuffer().then(buf => {
  const wb = XLSX.read(buf);
  const candidate = pickKahootSheet(wb);
  return { rows: candidate.rows, source:'XLSX', sheet:candidate.sheet };
}); }
function pickKahootSheet(wb){
  const preferred = ['Final Scores','Final scores','Scores','Overview','Raw Report Data','Raw data','RawReportData'];
  const names = [...preferred.filter(n=>wb.SheetNames.includes(n)), ...wb.SheetNames.filter(n=>!preferred.includes(n))];
  for(const sheet of names){
    const matrix = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header:1, defval:'' });
    const parsed = rowsFromMatrix(matrix);
    if(parsed.rows.length && parsed.nameKey) return { sheet, rows: parsed.rows };
  }
  return { sheet: wb.SheetNames[0], rows: XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:'' }) };
}
function rowsFromMatrix(matrix){
  const aliases = ['nickname','player','name','nombre','participante','jugador','identifier','email'];
  let headerIndex = matrix.findIndex(row => row.some(cell => aliases.some(alias => norm(cell).includes(alias))));
  if(headerIndex < 0) return { rows:[], nameKey:null };
  const headers = matrix[headerIndex].map((h,i)=> String(h || `column_${i}`).trim());
  const rows = matrix.slice(headerIndex+1).filter(row => row.some(Boolean)).map(row => Object.fromEntries(headers.map((h,i)=>[h,row[i] ?? ''])));
  const nameKey = findHeader(headers, aliases);
  return { rows, nameKey };
}
function parseKahootRows(rows, meta={}){
  const hs = Object.keys(rows[0] || {});
  const nameKey = findHeader(hs,['nickname','player','name','nombre','participante','jugador','identifier','email']);
  const scoreKey = findHeader(hs,['score','points','puntos','puntaje','total score','current total']);
  const rankKey = findHeader(hs,['rank','puesto','position','ranking','place']);
  const correctKey = findHeader(hs,['correct answers','correctas','correct']);
  if(!nameKey) return { rows:[], meta:{...meta, error:'No se detectó columna de jugador'} };
  const parsed = rows.map((r,i)=>({
    nickname:String(r[nameKey] || '').trim(),
    score:cleanNumber(r[scoreKey]),
    correct: correctKey ? cleanNumber(r[correctKey]) : null,
    rank: rankKey ? cleanNumber(r[rankKey]) : i + 1
  })).filter(r=>r.nickname && !/average|total|summary|final scores/i.test(r.nickname));
  const rowsWithRank = parsed.sort((a,b)=> rankKey ? a.rank-b.rank : b.score-a.score).map((r,i)=>({
    ...r,
    rank:i+1,
    playerId: findPlayer(r.nickname)?.id || '',
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
  save(); renderPreview(); $('#applyImport').disabled = false;
  const msg = imported.length === 1 ? `Detecté ${state.pending.length} participantes.` : `Detecté ${imported.length} reportes y ${state.pending.length} filas.`;
  toast(failed.length ? `${msg} ${failed.length} archivo(s) fallaron.` : msg);
}
function renderPreview(){
  if(!state.pending){ $('#preview').className='preview empty'; $('#preview').textContent='Todavía no hay archivo cargado.'; return; }
  $('#preview').className='preview';
  const mapped = state.pending.filter(r=>r.playerId).length;
  const unmapped = state.pending.length - mapped;
  const meta = state.pendingMeta || {};
  const files = meta.files || [];
  const reportCount = files.length || 1;
  const opts = ['<option value="">Sin mapear</option>', ...state.players.map(p=>`<option value="${p.id}">${p.name}</option>`)].join('');
  const warning = unmapped ? `<p class="preview-warning">Hay ${unmapped} participante${unmapped>1?'s':''} sin mapear. Podés seleccionarlo manualmente antes de aplicar puntos.</p>` : '';
  const failed = meta.failed?.length ? `<p class="preview-warning">No pude leer: ${meta.failed.join(', ')}</p>` : '';
  const fileSummary = files.length ? `<p class="preview-source">Reportes: ${files.map(file => `${file.fileName || 'archivo'} (${file.sheet || 'hoja?'})`).join(' · ')}</p>` : '';
  $('#preview').innerHTML = `
    <div class="import-status">
      <article><strong>${fmt(reportCount)}</strong><span>reportes</span></article>
      <article><strong>${fmt(state.pending.length)}</strong><span>filas</span></article>
      <article><strong>${fmt(mapped)}</strong><span>mapeados</span></article>
      <article><strong>${fmt(unmapped)}</strong><span>sin mapear</span></article>
    </div>
    ${fileSummary}${warning}${failed}
    <table><thead><tr><th>Reporte</th><th>Rank</th><th>Nickname Kahoot</th><th>Score</th><th>Correctas</th><th>Mapeo QS</th><th>Premio</th></tr></thead><tbody>${state.pending.map((r,i)=>`<tr><td>${r.reportName || 'Kahoot'}</td><td>${r.rank}</td><td>${r.nickname}</td><td>${fmt(r.score)}</td><td>${r.correct ?? '—'}</td><td><select data-map="${i}">${opts}</select><div class="${r.playerId?'mapped':'unmapped'}">${r.playerId?'Detectado':'Revisar'}</div></td><td>${award(r.rank).label}</td></tr>`).join('')}</tbody></table>`;
  $$('[data-map]').forEach(s=>{ s.value = state.pending[s.dataset.map].playerId; s.addEventListener('change',()=>{ state.pending[s.dataset.map].playerId=s.value; save(); renderPreview(); }); });
}
function demoImport(){
  const demoRows = [{ Nickname:'Jesi', Score:11250, Rank:1, Correctas:14 }, { Nickname:'Nico', Score:10880, Rank:2, Correctas:13 }, { Nickname:'Agus', Score:10120, Rank:3, Correctas:12 }, { Nickname:'Sebas', Score:9900, Rank:4, Correctas:12 }, { Nickname:'Javi', Score:9500, Rank:5, Correctas:11 }, { Nickname:'Euge', Score:7400, Rank:6, Correctas:9 }];
  buildBatchPreview([parseKahootRows(demoRows, { fileName:'demo-kahoot.csv', source:'Demo', sheet:'Demo' })]);
}
function applyImport(){
  const mapped = state.pending?.filter(r=>r.playerId) || []; if(mapped.length < 3){ toast('Mapeá al menos 3 participantes.'); return; }
  const importId = `import-${Date.now()}`;
  const grouped = mapped.reduce((map,row)=>{ const key=row.batchId || row.reportName || 'Kahoot'; map.set(key,[...(map.get(key)||[]),row]); return map; }, new Map());
  grouped.forEach((rows, key) => {
    const session = rows[0]?.reportName || $('#sessionName').value || 'Kahoot QS League';
    rows.forEach(r=>{
      const a=award(r.rank); const p=player(r.playerId);
      if(a.delta && p){ p.coins += a.delta; p.medals[a.key] += 1; state.ledger.push({id:`${importId}-${key}-${p.id}-${r.rank}`, player:p.id, delta:a.delta, reason:`${session}: ${a.label}`}); }
    });
    const last = [...rows].sort((a,b)=>a.rank-b.rank)[rows.length-1]; if(last) state.nextModerator = last.playerId;
    state.imports.unshift({ id:`${importId}-${key}`, session, date:new Date().toISOString(), meta:{...state.pendingMeta, file:key}, rows });
  });
  state.pending = null; state.pendingMeta = null; save(); $('#applyImport').disabled=true; render(); setTab('arena'); toast('Historial aplicado. Ranking actualizado.');
}
function downloadTemplate(){
  const csv = 'Nickname,Score,Rank,Correctas\nJesi,11250,1,14\nNico,10880,2,13\nAgus,10120,3,12\nSebas,9900,4,12\nJavi,9500,5,11\nEuge,7400,6,9\n';
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'qs-league-kahoot-demo.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function resetLocal(){
  ['qs-league-mvp-v6','qs-league-mvp-v5','qs-league-mvp-v4','qs-league-mvp-v3','qs-league-mvp-v2'].forEach(key => localStorage.removeItem(key));
  state = clone(seed); save(); render(); toast('Datos locales reiniciados.');
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('show'),2800); }
init();