(function(){
  function safeCall(fn){ try { fn(); } catch(error){ console.warn('QS League live update skipped:', error); } }
  function byNorm(value){ return norm(value); }
  function normalizeAliasList(list){ return [...new Set((list || []).filter(Boolean).map(item => String(item).trim()))]; }
  function addAlias(target, alias){
    const clean = String(alias || '').trim();
    if(!target || !clean) return;
    target.aliases = Array.isArray(target.aliases) ? target.aliases : [];
    if(!target.aliases.some(item => byNorm(item) === byNorm(clean))) target.aliases.push(clean);
  }
  function medalShape(){ return { gold:0, silver:0, bronze:0 }; }
  function findById(id){ return state.players.find(item => item.id === id); }
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

  const OFFICIAL_TEAMS = [
    { id:'slytherin', name:'Slytherin' },
    { id:'hufflepuff', name:'Hufflepuff' },
    { id:'ravenclaw', name:'Ravenclaw' },
    { id:'gryffindor', name:'Gryffindor' },
    { id:'unassigned', name:'Sin casa' }
  ];

  const OFFICIAL_ROSTER = [
    { id:'agustin', name:'Agustin Goñi Piuma', shortName:'Agustin', team:'slytherin', aliases:['Agustin','Agustín','Agus','Agustin Goñi','Agustín Goñi','Agustin Goñi Piuma','Agustin Goni Piuma'] },
    { id:'alejandro', name:'Alejandro Frank', shortName:'Alejandro', team:'hufflepuff', aliases:['Alejandro','Alejandro Frank','Ale'] },
    { id:'eugenio', name:'Eugenio Balbastro Fages', shortName:'Eugenio', team:'ravenclaw', aliases:['Eugenio','Euge','Eugenio Balbastro','Eugenio Balbastro Fages','8706743'] },
    { id:'javi', name:'Javier De Vergilio', shortName:'Javi', team:'gryffindor', aliases:['Javi','Javier','Javier De Vergilio'] },
    { id:'jesica', name:'Jesica Titaro', shortName:'Jesica', team:'slytherin', aliases:['Jesica','Jesi','Jess','Jesica Titaro'] },
    { id:'juli', name:'Juli Piccioni', shortName:'Juli', team:'unassigned', aliases:['Juli','July','Picci','Juli Piccioni'] },
    { id:'lucrecia', name:'Lucrecia Moralejo', shortName:'Lucrecia', team:'unassigned', aliases:['Lucrecia','Lucre','Lucrecia Moralejo','Luly','Luli'] },
    { id:'mayra', name:'Mayra Milanesio', shortName:'May', team:'unassigned', aliases:['May','Mayra','Mayra Milanesio','May(Ra)'] },
    { id:'nico', name:'Nicolas Rivero Segura', shortName:'Nico', team:'unassigned', aliases:['Nico','Nicolas','Nicolás','Nicolas Rivero','Nicolas Rivero Segura'] },
    { id:'pablo', name:'Pablo Hernan Gimenez', shortName:'Pablo', team:'slytherin', aliases:['Pablo','Pablo Gimenez','Pablo Giménez','Pablo Hernan Gimenez','Pablo Hernán Giménez','Hero','Heror'] },
    { id:'sebas', name:'Sebastian Carnota', shortName:'Sebas', team:'unassigned', aliases:['Sebas','Seba','Sebastian','Sebastián','Sebastian Carnota'] }
  ];

  const ID_MAP = {
    ale:'alejandro',
    euge:'eugenio',
    jess:'jesica',
    july:'juli',
    luly:'lucrecia',
    hero:'pablo',
    seba:'sebas'
  };

  function resolveOfficialId(value){
    const n = byNorm(value);
    if(!n) return '';
    const explicit = ID_MAP[n];
    if(explicit) return explicit;
    const match = OFFICIAL_ROSTER.find(person => person.id === value || [person.name, person.shortName, ...(person.aliases || [])].some(alias => byNorm(alias) === n));
    return match?.id || '';
  }

  function migrateReferences(){
    const remap = id => ID_MAP[id] || id;
    state.ledger = (state.ledger || []).map(item => ({ ...item, player: remap(item.player) }));
    state.imports = (state.imports || []).map(item => ({
      ...item,
      rows: (item.rows || []).map(row => {
        const fromAlias = resolveOfficialId(row.nickname);
        return { ...row, playerId: remap(fromAlias || row.playerId) };
      })
    }));
    if(Array.isArray(state.pending)){
      state.pending = state.pending.map(row => ({ ...row, playerId: remap(resolveOfficialId(row.nickname) || row.playerId) }));
    }
  }

  function migrateRoster(){
    state.teams = OFFICIAL_TEAMS;
    const previous = Array.isArray(state.players) ? state.players : [];
    const previousById = new Map(previous.map(item => [item.id, item]));
    const grouped = new Map();

    previous.forEach(oldPlayer => {
      const officialId = resolveOfficialId(oldPlayer.id) || resolveOfficialId(oldPlayer.name) || (oldPlayer.aliases || []).map(resolveOfficialId).find(Boolean);
      if(!officialId) return;
      grouped.set(officialId, [...(grouped.get(officialId) || []), oldPlayer]);
    });

    state.players = OFFICIAL_ROSTER.map(person => {
      const previousItems = grouped.get(person.id) || [];
      const seedPlayer = previousById.get(person.id) || {};
      const allSources = [seedPlayer, ...previousItems].filter(Boolean);
      const coins = allSources.reduce((sum,item) => sum + Number(item.coins || 0), 0);
      const meteorites = Math.max(0, ...allSources.map(item => Number(item.meteorites || 0)));
      const medals = allSources.reduce((acc,item) => ({
        gold: acc.gold + Number(item.medals?.gold || 0),
        silver: acc.silver + Number(item.medals?.silver || 0),
        bronze: acc.bronze + Number(item.medals?.bronze || 0)
      }), medalShape());
      const aliases = normalizeAliasList([person.shortName, person.name, ...(person.aliases || []), ...allSources.flatMap(item => item.aliases || [])]);
      return {
        id: person.id,
        name: person.shortName || person.name,
        fullName: person.name,
        team: person.team || 'unassigned',
        aliases,
        coins,
        medals,
        meteorites
      };
    });
  }

  function suggestName(nick){
    const officialId = resolveOfficialId(nick);
    if(officialId) return OFFICIAL_ROSTER.find(item => item.id === officialId)?.shortName || titleName(nick);
    return titleName(nick);
  }

  function ensureModeratorField(){
    const modal = $('#uploadModal .modal-card');
    const sessionInput = $('#sessionName');
    if(!modal || !sessionInput || $('#moderatorSelect')) return;
    const label = document.createElement('label');
    label.className = 'moderator-field';
    label.innerHTML = 'Moderador de la fecha<select id="moderatorSelect"><option value="">Elegir moderador</option></select><small>No cuenta como ausente ni participa del ranking de esa fecha.</small>';
    sessionInput.closest('label')?.after(label);
    renderModeratorOptions();
  }

  function renderModeratorOptions(){
    const select = $('#moderatorSelect');
    if(!select) return;
    const selected = select.value;
    select.innerHTML = '<option value="">Elegir moderador</option>' + state.players.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
    if(selected) select.value = selected;
  }

  function officialIds(){ return OFFICIAL_ROSTER.map(item => item.id); }

  function sessionLabelFromPending(){
    const reports = [...new Set((state.pending || []).map(row => row.reportName).filter(Boolean))];
    return reports[0] || $('#sessionName')?.value || 'Kahoot QS League';
  }

  function calcAbsentees(moderatorId){
    const participants = new Set((state.pending || []).filter(row => row.playerId).map(row => row.playerId));
    participants.delete(moderatorId);
    return officialIds().filter(id => id !== moderatorId && !participants.has(id));
  }

  function applyAbsences(absenteeIds, moderatorId, session){
    const moderatorName = player(moderatorId)?.name || 'Sin moderador';
    absenteeIds.forEach(id => {
      const target = player(id);
      if(!target) return;
      const nextCount = Number(target.meteorites || 0) + 1;
      target.meteorites = nextCount;
      state.ledger.push({
        id:`absence-${Date.now()}-${id}`,
        type:'meteor',
        player:id,
        delta:1,
        reason:`Ausencia en ${session}. Moderador: ${moderatorName}.`
      });
      if(nextCount > 0 && nextCount % 3 === 0 && Number(target.coins || 0) > 0){
        target.coins = Math.max(0, Number(target.coins || 0) - 1);
        state.ledger.push({
          id:`meteor-penalty-${Date.now()}-${id}`,
          type:'dino',
          player:id,
          delta:-1,
          reason:`Penalización automática: llegó a ${nextCount} meteoritos.`
        });
      }
    });
  }

  function ensureReport1607(){
    state.ledger = Array.isArray(state.ledger) ? state.ledger : [];
    state.imports = Array.isArray(state.imports) ? state.imports : [];
    if(state.ledger.some(item => item.id === 's2-20260716-javi')) return;
    const rows = [
      { rank:1, playerId:'javi', nickname:'Javi', score:9771, correct:12 },
      { rank:2, playerId:'mayra', nickname:'May', score:7485, correct:10 },
      { rank:3, playerId:'pablo', nickname:'Heror', score:6963, correct:9 },
      { rank:4, playerId:'', nickname:'Tuki', score:6893, correct:9 },
      { rank:5, playerId:'lucrecia', nickname:'Luly', score:5660, correct:8 },
      { rank:6, playerId:'juli', nickname:'Picci', score:5399, correct:7 },
      { rank:7, playerId:'nico', nickname:'Nico', score:5371, correct:7 },
      { rank:8, playerId:'alejandro', nickname:'Ale', score:3953, correct:6 }
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
    state.imports.unshift({ id:'import-20260716-sebas', session:'16 de julio 2026 - Sebas', date:'2026-07-16', moderator:'sebas', rows });
  }

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
        fullName: name.trim(),
        team:'unassigned',
        aliases: normalizeAliasList([name.trim(), row.nickname]),
        coins:0,
        medals: medalShape(),
        meteorites:0
      };
      state.players.push(newPlayer);
      row.playerId = newPlayer.id;
      save();
      renderModeratorOptions();
      render();
      toast(`${newPlayer.name} fue agregado al ranking.`);
    });
  };

  const originalRender = typeof render === 'function' ? render : null;
  if(originalRender){
    render = function(){
      originalRender();
      ensureModeratorField();
      renderModeratorOptions();
    };
  }

  const originalFindPlayer = typeof findPlayer === 'function' ? findPlayer : null;
  if(originalFindPlayer){
    findPlayer = function(nick){
      const officialId = resolveOfficialId(nick);
      return officialId ? player(officialId) : originalFindPlayer(nick);
    };
  }

  const originalRenderPreview = typeof renderPreview === 'function' ? renderPreview : null;
  if(originalRenderPreview){
    renderPreview = function(){
      const container = $('#preview');
      if(!container) return;
      if(!state.pending){ container.className = 'preview empty'; container.textContent = 'Todavía no hay informe cargado.'; return; }
      container.className = 'preview';
      const moderatorId = $('#moderatorSelect')?.value || '';
      const mapped = state.pending.filter(row => row.playerId).length;
      const unmapped = state.pending.length - mapped;
      const absentees = moderatorId ? calcAbsentees(moderatorId) : [];
      const meta = state.pendingMeta || {};
      const files = meta.files || [];
      const opts = ['<option value="">Sin mapear</option>', ...state.players.map(item => `<option value="${item.id}">${item.name}</option>`)].join('');
      const warning = unmapped ? `<p class="preview-warning">Hay ${unmapped} participante${unmapped>1?'s':''} sin mapear. Podés mapearlo a alguien existente o agregarlo como nuevo.</p>` : '';
      const moderatorWarning = !moderatorId ? '<p class="preview-warning">Elegí el moderador antes de actualizar el ranking.</p>' : '';
      const absences = moderatorId ? `<p class="preview-source">Ausencias detectadas: ${absentees.length ? absentees.map(id => player(id)?.name || id).join(', ') : 'ninguna'}.</p>` : '';
      const failed = meta.failed?.length ? `<p class="preview-warning">No pude leer: ${meta.failed.join(', ')}</p>` : '';
      const fileSummary = files.length ? `<p class="preview-source">Informe: ${files.map(file => `${file.fileName || 'archivo'} (${file.sheet || 'hoja?'})`).join(' · ')}</p>` : '';
      container.innerHTML = `<div class="import-status"><article><strong>${fmt(files.length || 1)}</strong><span>informes</span></article><article><strong>${fmt(state.pending.length)}</strong><span>filas</span></article><article><strong>${fmt(mapped)}</strong><span>mapeados</span></article><article><strong>${fmt(unmapped)}</strong><span>sin mapear</span></article><article><strong>${fmt(absentees.length)}</strong><span>meteoritos</span></article></div>${fileSummary}${moderatorWarning}${absences}${warning}${failed}<table><thead><tr><th>Rank</th><th>Nickname</th><th>Score</th><th>Correctas</th><th>Mapeo QS</th><th>Premio</th></tr></thead><tbody>${state.pending.map((row,index) => { const prize = award(row.rank); const isModerator = row.playerId && row.playerId === moderatorId; const addButton = row.playerId ? '' : `<button class="ghost small add-player-btn" type="button" onclick="window.qsLeagueAddPendingPlayer(${index})">Agregar nuevo</button>`; return `<tr class="${isModerator?'moderator-row':''}"><td>${row.rank}</td><td>${row.nickname}</td><td>${fmt(row.score)}</td><td>${row.correct ?? '—'}</td><td><select data-map="${index}">${opts}</select><div class="${row.playerId?'mapped':'unmapped'}">${isModerator?'Moderador':row.playerId?'Detectado':'Revisar'}</div>${addButton}</td><td>${isModerator?'No compite':`${prize.key ? medalIcon(medalClass(prize.key)) : ''} ${prize.label}`}</td></tr>`; }).join('')}</tbody></table>`;
      $$('[data-map]').forEach(select => { select.value = state.pending[select.dataset.map].playerId; select.addEventListener('change', () => { state.pending[select.dataset.map].playerId = select.value; save(); renderPreview(); }); });
    };
  }

  const originalOpenUploadModal = typeof openUploadModal === 'function' ? openUploadModal : null;
  if(originalOpenUploadModal){
    openUploadModal = function(){
      originalOpenUploadModal();
      ensureModeratorField();
      renderModeratorOptions();
    };
  }

  const originalApplyImport = typeof applyImport === 'function' ? applyImport : null;
  if(originalApplyImport){
    applyImport = function(){
      const moderatorId = $('#moderatorSelect')?.value || '';
      if(!moderatorId){ toast('Elegí el moderador de la fecha antes de actualizar.'); return; }
      if(!state.pending?.length){ toast('Primero cargá un informe de Kahoot.'); return; }

      state.pending = state.pending.map(row => ({ ...row, playerId: row.playerId || resolveOfficialId(row.nickname) }));
      const unresolved = state.pending.filter(row => !row.playerId);
      if(unresolved.length){ toast('Hay participantes sin mapear. Revisalos antes de actualizar.'); renderPreview(); return; }

      const session = sessionLabelFromPending();
      const sessions = [...new Set((state.pending || []).map(row => row.reportName).filter(Boolean))];
      const duplicates = sessions.filter(item => (state.imports || []).some(imported => imported.session === item));
      if(duplicates.length && !confirm(`Este informe ya parece cargado: ${duplicates.join(', ')}. ¿Querés aplicarlo igual?`)) return;

      const absentees = calcAbsentees(moderatorId);
      const absenteeNames = absentees.map(id => player(id)?.name || id);
      const moderatorName = player(moderatorId)?.name || 'moderador';
      const ok = confirm(`Moderador: ${moderatorName}.\nAusencias detectadas: ${absenteeNames.length ? absenteeNames.join(', ') : 'ninguna'}.\n\nSe cargará 1 meteorito a cada ausente. Cada 3 meteoritos descuenta 1 DinoCoin. ¿Actualizar ranking?`);
      if(!ok) return;

      state.pending = state.pending.filter(row => row.playerId !== moderatorId);
      originalApplyImport();
      applyAbsences(absentees, moderatorId, session);
      const latest = state.imports?.[0];
      if(latest) latest.moderator = moderatorId;
      save();
      render();
      toast(`Ranking actualizado. Meteoritos cargados: ${absentees.length}.`);
    };
  }

  safeCall(function(){
    migrateReferences();
    migrateRoster();
    ensureReport1607();
    save();
    render();
  });
})();