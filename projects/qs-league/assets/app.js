const STORAGE = 'qs-league-mvp-v3';
const LEGACY_STORAGE = 'qs-league-mvp-v2';
const SESSION = 'qs-league-session-v2';

const seed = {
  teams: [
    { id: 'design', name: 'Design Rebels', icon: '🦖' },
    { id: 'dev', name: 'Dev Raptors', icon: '🧬' },
    { id: 'bi', name: 'BI Saurios', icon: '📊' },
    { id: 'ops', name: 'Ops Rex', icon: '⚡' }
  ],
  players: [
    { id: 'javi', name: 'Javi', team: 'dev', aliases: ['Javi','Javier'], coins: 2, medals: { gold:0, silver:1, bronze:0 }, strikes:0 },
    { id: 'nico', name: 'Nico', team: 'ops', aliases: ['Nico','Nicolas','Nicolás'], coins: 5, medals: { gold:1, silver:1, bronze:0 }, strikes:1 },
    { id: 'pablo', name: 'Pablo', team: 'dev', aliases: ['Pablo'], coins: 2, medals: { gold:0, silver:0, bronze:2 }, strikes:1 },
    { id: 'mayra', name: 'Mayra', team: 'bi', aliases: ['Mayra'], coins: 1, medals: { gold:0, silver:0, bronze:1 }, strikes:0 },
    { id: 'seba', name: 'Seba', team: 'ops', aliases: ['Seba','Sebastian','Sebastián'], coins: 2, medals: { gold:0, silver:1, bronze:0 }, strikes:0 },
    { id: 'jess', name: 'Jess', team: 'design', aliases: ['Jess','Jesi','Jesica'], coins: 5, medals: { gold:1, silver:0, bronze:2 }, strikes:3 },
    { id: 'lucre', name: 'Lucre', team: 'bi', aliases: ['Lucre','Lucrecia'], coins: 1, medals: { gold:0, silver:0, bronze:1 }, strikes:1 },
    { id: 'agustin', name: 'Agustin', team: 'ops', aliases: ['Agustin','Agustín','Agus'], coins: 5, medals: { gold:1, silver:1, bronze:0 }, strikes:2 },
    { id: 'euge', name: 'Euge', team: 'design', aliases: ['Euge','Eugenia'], coins: 0, medals: { gold:0, silver:0, bronze:0 }, strikes:0 },
    { id: 'ale', name: 'Ale', team: 'dev', aliases: ['Ale'], coins: 0, medals: { gold:0, silver:0, bronze:0 }, strikes:1 }
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

let state = load();
let mode = 'teams';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => new Intl.NumberFormat('es-AR').format(n || 0);
const norm = s => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function load(){
  try {
    const current = localStorage.getItem(STORAGE);
    const legacy = localStorage.getItem(LEGACY_STORAGE);
    return normalizeState(JSON.parse(current || legacy) || structuredClone(seed));
  } catch { return structuredClone(seed); }
}
function normalizeState(next){
  return { ...structuredClone(seed), ...next, players: next.players || seed.players, teams: next.teams || seed.teams, ledger: next.ledger || [], imports: next.imports || [], pending: next.pending || null, pendingMeta: next.pendingMeta || null };
}
function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function team(id){ return state.teams.find(t => t.id === id) || { name:'Sin equipo', icon:'?' }; }
function player(id){ return state.players.find(p => p.id === id); }
function initials(name){ return name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase(); }

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
  $('#fileInput').addEventListener('change', e => e.target.files[0] && readFile(e.target.files[0]));
  $('#downloadTemplate').addEventListener('click', downloadTemplate);
  $('#resetLocal').addEventListener('click', resetLocal);
  const drop = $('#dropZone');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('drag'); const file = e.dataTransfer.files[0]; if(file) readFile(file); });
}

function showApp(){ $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); render(); }
function setTab(tab){
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === tab));
  $$('.sidebar nav button,[data-tab].ghost').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('#pageTitle').textContent = ({arena:'Arena',ranking:'Ranking',admin:'Kahoot',rules:'Reglas'})[tab] || 'QS League';
  $('.sidebar').classList.remove('open');
}

function standingsPlayers(){ return [...state.players].sort((a,b)=> b.coins-a.coins || b.medals.gold-a.medals.gold || a.name.localeCompare(b.name)); }
function standingsTeams(){ return state.teams.map(t => {
  const members = state.players.filter(p => p.team === t.id);
  return { ...t, members, coins: members.reduce((s,p)=>s+p.coins,0), gold: members.reduce((s,p)=>s+p.medals.gold,0) };
}).sort((a,b)=> b.coins-a.coins || b.gold-a.gold || a.name.localeCompare(b.name)); }

function render(){ renderStats(); renderPodium(); renderTeams(); renderTimeline(); renderRanking(); renderPreview(); }
function renderStats(){
  const total = state.players.reduce((s,p)=>s+p.coins,0);
  $('#totalCoins').textContent = fmt(total); $('#totalPlayers').textContent = state.players.length; $('#totalTeams').textContent = state.teams.length;
  $('#seasonTotal').textContent = `${fmt(total)} DinoCoins`; $('#seasonBar').style.width = Math.min(100,total*3) + '%';
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

function award(rank){ return rank===1?{delta:3,key:'gold',label:'🥇 Oro +3'}:rank===2?{delta:2,key:'silver',label:'🥈 Plata +2'}:rank===3?{delta:1,key:'bronze',label:'🥉 Bronce +1'}:{delta:0,key:null,label:'—'}; }
function findPlayer(nick){ const n = norm(nick); return state.players.find(p => [p.name,...p.aliases].some(a => norm(a) === n)); }
function findHeader(headers, names){ return headers.find(h => names.some(n => norm(h).includes(n))); }
function cleanNumber(value){ return Number(String(value ?? '').replace(/[^0-9.,-]/g,'').replace(',','.')) || 0; }

async function readFile(file){
  try{
    const parsed = file.name.toLowerCase().endsWith('.csv') ? await csv(file) : await xlsx(file);
    buildPreview(parsed.rows, { fileName:file.name, source:parsed.source || 'CSV', sheet:parsed.sheet || 'CSV' });
  }catch(e){ console.error(e); toast('No pude leer el archivo. Probá con XLSX o CSV exportado de Kahoot.'); }
}
function csv(file){ return file.text().then(text => ({ rows: parseCsvText(text), source:'CSV', sheet:'CSV' })); }
function parseCsvText(text){
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const header = splitCsv(lines.shift() || '').map(x=>x.trim());
  return lines.map(line => Object.fromEntries(splitCsv(line).map((v,i)=>[header[i],v.trim()])));
}
function splitCsv(line){
  const out=[]; let cur=''; let quoted=false;
  for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"') quoted=!quoted; else if(c===',' && !quoted){ out.push(cur.replace(/^"|"$/g,'')); cur=''; } else cur+=c; }
  out.push(cur.replace(/^"|"$/g,'')); return out;
}
function xlsx(file){ return file.arrayBuffer().then(buf => {
  const wb = XLSX.read(buf);
  const candidate = pickKahootSheet(wb);
  return { rows: candidate.rows, source:'XLSX', sheet:candidate.sheet };
}); }
function pickKahootSheet(wb){
  const preferred = ['Final Scores','Final scores','Scores','Overview','Raw data','RawReportData'];
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
function buildPreview(rows, meta={}){
  const hs = Object.keys(rows[0] || {});
  const nameKey = findHeader(hs,['nickname','player','name','nombre','participante','jugador','identifier','email']);
  const scoreKey = findHeader(hs,['score','points','puntos','puntaje','total score','current total']);
  const rankKey = findHeader(hs,['rank','puesto','position','ranking','place']);
  const correctKey = findHeader(hs,['correct','correctas','correct answers']);
  if(!nameKey){ toast('No encontré columna de nickname/jugador.'); return; }
  const parsed = rows.map((r,i)=>({
    nickname:String(r[nameKey] || '').trim(),
    score:cleanNumber(r[scoreKey]),
    correct: correctKey ? cleanNumber(r[correctKey]) : null,
    rank: rankKey ? cleanNumber(r[rankKey]) : i + 1
  })).filter(r=>r.nickname && !/average|total|summary/i.test(r.nickname));
  state.pending = parsed.sort((a,b)=> rankKey ? a.rank-b.rank : b.score-a.score).map((r,i)=>({ ...r, rank:i+1, playerId: findPlayer(r.nickname)?.id || '' }));
  state.pendingMeta = { ...meta, count: state.pending.length, createdAt: new Date().toISOString(), nameKey, scoreKey, rankKey, correctKey };
  save(); renderPreview(); $('#applyImport').disabled = false; toast(`Detecté ${state.pending.length} participantes.`);
}
function renderPreview(){
  if(!state.pending){ $('#preview').className='preview empty'; $('#preview').textContent='Todavía no hay archivo cargado.'; return; }
  $('#preview').className='preview';
  const mapped = state.pending.filter(r=>r.playerId).length;
  const unmapped = state.pending.length - mapped;
  const meta = state.pendingMeta || {};
  const opts = ['<option value="">Sin mapear</option>', ...state.players.map(p=>`<option value="${p.id}">${p.name}</option>`)].join('');
  const warning = unmapped ? `<p class="preview-warning">Hay ${unmapped} participante${unmapped>1?'s':''} sin mapear. Podés seleccionarlo manualmente antes de aplicar puntos.</p>` : '';
  $('#preview').innerHTML = `
    <div class="import-status">
      <article><strong>${fmt(state.pending.length)}</strong><span>participantes</span></article>
      <article><strong>${fmt(mapped)}</strong><span>mapeados</span></article>
      <article><strong>${fmt(unmapped)}</strong><span>sin mapear</span></article>
      <article><strong>${meta.sheet || '—'}</strong><span>hoja detectada</span></article>
    </div>
    ${warning}
    <table><thead><tr><th>Rank</th><th>Nickname Kahoot</th><th>Score</th><th>Correctas</th><th>Mapeo QS</th><th>Premio</th></tr></thead><tbody>${state.pending.map((r,i)=>`<tr><td>${r.rank}</td><td>${r.nickname}</td><td>${fmt(r.score)}</td><td>${r.correct ?? '—'}</td><td><select data-map="${i}">${opts}</select><div class="${r.playerId?'mapped':'unmapped'}">${r.playerId?'Detectado':'Revisar'}</div></td><td>${award(r.rank).label}</td></tr>`).join('')}</tbody></table>`;
  $$('[data-map]').forEach(s=>{ s.value = state.pending[s.dataset.map].playerId; s.addEventListener('change',()=>{ state.pending[s.dataset.map].playerId=s.value; save(); renderPreview(); }); });
}
function demoImport(){ buildPreview([
  { Nickname:'Jess', Score:11250, Correctas:14 }, { Nickname:'Nico', Score:10880, Correctas:13 }, { Nickname:'Agus', Score:10120, Correctas:12 },
  { Nickname:'Seba', Score:9900, Correctas:12 }, { Nickname:'Javi', Score:9500, Correctas:11 }, { Nickname:'Euge', Score:7400, Correctas:9 }
], { fileName:'demo-kahoot.csv', source:'Demo', sheet:'Demo' }); }
function applyImport(){
  const mapped = state.pending?.filter(r=>r.playerId) || []; if(mapped.length < 3){ toast('Mapeá al menos 3 participantes.'); return; }
  const session = $('#sessionName').value || 'Kahoot QS League';
  const importId = `import-${Date.now()}`;
  mapped.forEach(r=>{ const a=award(r.rank); const p=player(r.playerId); if(a.delta && p){ p.coins += a.delta; p.medals[a.key] += 1; state.ledger.push({id:`${importId}-${p.id}`, player:p.id, delta:a.delta, reason:`${session}: ${a.label}`}); } });
  const last = [...mapped].reverse()[0]; if(last) state.nextModerator = last.playerId;
  state.imports.unshift({ id:importId, session, date:new Date().toISOString(), meta:state.pendingMeta, rows:mapped });
  state.pending = null; state.pendingMeta = null; save(); $('#applyImport').disabled=true; render(); setTab('arena'); toast('Resultado aplicado. Ranking actualizado.');
}
function downloadTemplate(){
  const csv = 'Nickname,Score,Rank,Correctas\nJess,11250,1,14\nNico,10880,2,13\nAgus,10120,3,12\nSeba,9900,4,12\nJavi,9500,5,11\nEuge,7400,6,9\n';
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'qs-league-kahoot-demo.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function resetLocal(){ localStorage.removeItem(STORAGE); localStorage.removeItem(LEGACY_STORAGE); state = structuredClone(seed); save(); render(); toast('Datos locales reiniciados.'); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('show'),2800); }
init();
