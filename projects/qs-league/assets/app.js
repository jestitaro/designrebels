const STORAGE = 'qs-league-mvp-v2';
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
  nextModerator: 'euge',
  pending: null
};

let state = load();
let mode = 'teams';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => new Intl.NumberFormat('es-AR').format(n || 0);
const norm = s => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function load(){ try { return JSON.parse(localStorage.getItem(STORAGE)) || structuredClone(seed); } catch { return structuredClone(seed); } }
function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function team(id){ return state.teams.find(t => t.id === id); }
function player(id){ return state.players.find(p => p.id === id); }
function initials(name){ return name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase(); }

function init(){
  bind();
  if(localStorage.getItem(SESSION)) showApp();
  render();
}

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
}

function showApp(){ $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); render(); }
function setTab(tab){
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === tab));
  $$('.sidebar nav button,[data-tab].ghost').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('#pageTitle').textContent = ({arena:'Arena',ranking:'Ranking',admin:'Cargar Kahoot',rules:'Reglas'})[tab] || 'QS League';
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
function headers(rows){ return Object.keys(rows[0] || {}); }
function findHeader(hs, names){ return hs.find(h => names.some(n => norm(h).includes(n))); }

async function readFile(file){
  try{
    const rows = file.name.toLowerCase().endsWith('.csv') ? await csv(file) : await xlsx(file);
    buildPreview(rows);
  }catch(e){ console.error(e); toast('No pude leer el archivo. Probá con XLSX o CSV.'); }
}
function csv(file){ return file.text().then(text => {
  const lines = text.split(/\r?\n/).filter(Boolean); const hs = lines.shift().split(',').map(x=>x.trim());
  return lines.map(line => Object.fromEntries(line.split(',').map((v,i)=>[hs[i],v.trim()])));
}); }
function xlsx(file){ return file.arrayBuffer().then(buf => { const wb = XLSX.read(buf); const sheetName = wb.SheetNames.find(n=>/final|score|rank|raw/i.test(n)) || wb.SheetNames[0]; return XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{defval:''}); }); }
function buildPreview(rows){
  const hs = headers(rows); const nameKey = findHeader(hs,['nickname','player','name','nombre','participante','jugador']); const scoreKey = findHeader(hs,['score','points','puntos','puntaje','total']); const rankKey = findHeader(hs,['rank','puesto','position']);
  if(!nameKey){ toast('No encontré columna de nickname/jugador.'); return; }
  state.pending = rows.map((r,i)=>({ nickname:String(r[nameKey]).trim(), score:Number(String(r[scoreKey]||0).replace(/[^0-9.-]/g,''))||0, rank:Number(r[rankKey]||i+1)||i+1 })).filter(r=>r.nickname).sort((a,b)=> rankKey ? a.rank-b.rank : b.score-a.score).map((r,i)=>({ ...r, rank:i+1, playerId: findPlayer(r.nickname)?.id || '' }));
  save(); renderPreview(); $('#applyImport').disabled = false; toast(`Detecté ${state.pending.length} participantes.`);
}
function renderPreview(){
  if(!state.pending){ $('#preview').className='preview empty'; $('#preview').textContent='Todavía no hay archivo cargado.'; return; }
  $('#preview').className='preview';
  const opts = ['<option value="">Sin mapear</option>', ...state.players.map(p=>`<option value="${p.id}">${p.name}</option>`)].join('');
  $('#preview').innerHTML = `<table><thead><tr><th>Rank</th><th>Nickname</th><th>Score</th><th>Mapeo</th><th>Premio</th></tr></thead><tbody>${state.pending.map((r,i)=>`<tr><td>${r.rank}</td><td>${r.nickname}</td><td>${fmt(r.score)}</td><td><select data-map="${i}">${opts}</select></td><td>${award(r.rank).label}</td></tr>`).join('')}</tbody></table>`;
  $$('[data-map]').forEach(s=>{ s.value = state.pending[s.dataset.map].playerId; s.addEventListener('change',()=>{ state.pending[s.dataset.map].playerId=s.value; save(); }); });
}
function demoImport(){ buildPreview([{Nickname:'Jess',Score:11250},{Nickname:'Nico',Score:10880},{Nickname:'Agus',Score:10120},{Nickname:'Seba',Score:9900},{Nickname:'Javi',Score:9500},{Nickname:'Euge',Score:7400}]); }
function applyImport(){
  const mapped = state.pending?.filter(r=>r.playerId) || []; if(mapped.length < 3){ toast('Mapeá al menos 3 participantes.'); return; }
  const session = $('#sessionName').value || 'Kahoot QS League';
  mapped.forEach(r=>{ const a=award(r.rank); const p=player(r.playerId); if(a.delta && p){ p.coins += a.delta; p.medals[a.key] += 1; state.ledger.push({id:Date.now()+r.playerId, player:p.id, delta:a.delta, reason:`${session}: ${a.label}`}); } });
  const last = [...mapped].reverse()[0]; if(last) state.nextModerator = last.playerId;
  state.pending = null; save(); $('#applyImport').disabled=true; render(); setTab('arena'); toast('Resultado aplicado. Ranking actualizado.');
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('show'),2800); }
init();
