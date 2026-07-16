(function(){
  function safeCall(fn){ try { fn(); } catch(error){ console.warn('QS League live update skipped:', error); } }
  function slug(value){
    const base = String(value || 'jugador').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'jugador';
    let id = base;
    let index = 2;
    while(state.players.some(player => player.id === id)){ id = `${base}-${index++}`; }
    return id;
  }
  function titleName(value){
    return String(value || 'Nuevo jugador').trim().split(/\s+/).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
  }
  function suggestName(nick){
    const n = norm(nick);
    if(['picci','pichi','juli','july'].includes(n)) return 'July';
    if(n === '8706743') return 'Euge';
    return titleName(nick);
  }
  function addAlias(target, alias){
    const clean = String(alias || '').trim();
    if(!target || !clean) return;
    target.aliases = Array.isArray(target.aliases) ? target.aliases : [];
    if(!target.aliases.some(item => norm(item) === norm(clean))) target.aliases.push(clean);
  }
  function removeAlias(target, alias){
    if(!target || !Array.isArray(target.aliases)) return;
    target.aliases = target.aliases.filter(item => norm(item) !== norm(alias));
  }
  function findById(id){ return state.players.find(player => player.id === id); }
  function ensureRoster(){
    const ale = findById('ale');
    const euge = findById('euge');
    removeAlias(ale, '8706743');
    addAlias(euge, '8706743');

    let july = findById('july') || state.players.find(player => ['july','juli','picci'].some(alias => [player.name, ...(player.aliases || [])].some(value => norm(value) === alias)));
    if(!july){
      july = { id:'july', name:'July', team:'unassigned', aliases:['July','Juli','Picci'], coins:0, medals:{ gold:0, silver:0, bronze:0 }, meteorites:0 };
      state.players.push(july);
    } else {
      july.id = july.id || 'july';
      july.name = 'July';
      july.team = july.team || 'unassigned';
      july.medals = { gold:0, silver:0, bronze:0, ...(july.medals || {}) };
      july.meteorites = Number(july.meteorites || 0);
      ['July','Juli','Picci'].forEach(alias => addAlias(july, alias));
    }
  }
  function ensureReport1607(){
    state.ledger = Array.isArray(state.ledger) ? state.ledger : [];
    state.imports = Array.isArray(state.imports) ? state.imports : [];
    if(state.ledger.some(item => item.id === 's2-20260716-javi')) return;
    const rows = [
      { rank:1, playerId:'javi', nickname:'Javi', score:9771, correct:12 },
      { rank:2, playerId:'mayra', nickname:'May', score:7485, correct:10 },
      { rank:3, playerId:'hero', nickname:'Heror', score:6963, correct:9 },
      { rank:4, playerId:'tuki', nickname:'Tuki', score:6893, correct:9 },
      { rank:5, playerId:'luly', nickname:'Luly', score:5660, correct:8 },
      { rank:6, playerId:'july', nickname:'Picci', score:5399, correct:7 },
      { rank:7, playerId:'nico', nickname:'Nico', score:5371, correct:7 },
      { rank:8, playerId:'ale', nickname:'Ale', score:3953, correct:6 }
    ];
    rows.slice(0,3).forEach(row => {
      const prize = award(row.rank);
      const target = player(row.playerId);
      if(!target || !prize.delta) return;
      target.coins = Number(target.coins || 0) + prize.delta;
      target.medals = { gold:0, silver:0, bronze:0, ...(target.medals || {}) };
      target.medals[prize.key] += 1;
      state.ledger.push({ id:`s2-20260716-${target.id}`, type:'dino', player:target.id, delta:prize.delta, reason:`16 de julio 2026 - Sebas: ${prize.label}` });
    });
    state.imports.unshift({ id:'import-20260716-sebas', session:'16 de julio 2026 - Sebas', date:'2026-07-16', rows });
  }

  safeCall(function(){
    ensureRoster();
    ensureReport1607();
    save();
    render();
  });

  window.qsLeagueAddPendingPlayer = function(index){
    safeCall(function(){
      if(!state.pending || !state.pending[index]) return;
      const row = state.pending[index];
      const suggested = suggestName(row.nickname);
      if(!confirm(`Encontré a "${row.nickname}" y no está en el ranking. ¿Querés agregarlo?`)) return;
      const name = prompt('Nombre para mostrar en QS League:', suggested);
      if(!name || !name.trim()) return;
      const newPlayer = {
        id: slug(name),
        name: name.trim(),
        team: 'unassigned',
        aliases: [...new Set([name.trim(), row.nickname].filter(Boolean))],
        coins: 0,
        medals: { gold:0, silver:0, bronze:0 },
        meteorites: 0
      };
      state.players.push(newPlayer);
      row.playerId = newPlayer.id;
      save();
      render();
      toast(`${newPlayer.name} fue agregado al ranking.`);
    });
  };

  const originalRenderPreview = typeof renderPreview === 'function' ? renderPreview : null;
  if(originalRenderPreview){
    renderPreview = function(){
      const container = $('#preview');
      if(!container) return;
      if(!state.pending){ container.className = 'preview empty'; container.textContent = 'Todavía no hay informe cargado.'; return; }
      container.className = 'preview';
      const mapped = state.pending.filter(row => row.playerId).length;
      const unmapped = state.pending.length - mapped;
      const meta = state.pendingMeta || {};
      const files = meta.files || [];
      const opts = ['<option value="">Sin mapear</option>', ...state.players.map(item => `<option value="${item.id}">${item.name}</option>`)].join('');
      const warning = unmapped ? `<p class="preview-warning">Hay ${unmapped} participante${unmapped>1?'s':''} sin mapear. Podés mapearlo a alguien existente o agregarlo como nuevo.</p>` : '';
      const failed = meta.failed?.length ? `<p class="preview-warning">No pude leer: ${meta.failed.join(', ')}</p>` : '';
      const fileSummary = files.length ? `<p class="preview-source">Informe: ${files.map(file => `${file.fileName || 'archivo'} (${file.sheet || 'hoja?'})`).join(' · ')}</p>` : '';
      container.innerHTML = `<div class="import-status"><article><strong>${fmt(files.length || 1)}</strong><span>informes</span></article><article><strong>${fmt(state.pending.length)}</strong><span>filas</span></article><article><strong>${fmt(mapped)}</strong><span>mapeados</span></article><article><strong>${fmt(unmapped)}</strong><span>sin mapear</span></article></div>${fileSummary}${warning}${failed}<table><thead><tr><th>Rank</th><th>Nickname</th><th>Score</th><th>Correctas</th><th>Mapeo QS</th><th>Premio</th></tr></thead><tbody>${state.pending.map((row,index) => { const prize = award(row.rank); const addButton = row.playerId ? '' : `<button class="ghost small add-player-btn" type="button" onclick="window.qsLeagueAddPendingPlayer(${index})">Agregar nuevo</button>`; return `<tr><td>${row.rank}</td><td>${row.nickname}</td><td>${fmt(row.score)}</td><td>${row.correct ?? '—'}</td><td><select data-map="${index}">${opts}</select><div class="${row.playerId?'mapped':'unmapped'}">${row.playerId?'Detectado':'Revisar'}</div>${addButton}</td><td>${prize.key ? medalIcon(medalClass(prize.key)) : ''} ${prize.label}</td></tr>`; }).join('')}</tbody></table>`;
      $$('[data-map]').forEach(select => { select.value = state.pending[select.dataset.map].playerId; select.addEventListener('change', () => { state.pending[select.dataset.map].playerId = select.value; save(); renderPreview(); }); });
    };
  }

  const originalApplyImport = typeof applyImport === 'function' ? applyImport : null;
  if(originalApplyImport){
    applyImport = function(){
      const sessions = [...new Set((state.pending || []).map(row => row.reportName).filter(Boolean))];
      const duplicates = sessions.filter(session => (state.imports || []).some(item => item.session === session));
      if(duplicates.length && !confirm(`Este informe ya parece cargado: ${duplicates.join(', ')}. ¿Querés aplicarlo igual?`)) return;
      originalApplyImport();
    };
  }
})();
