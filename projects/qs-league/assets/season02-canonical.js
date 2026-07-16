(function(){
  function safeCall(fn){ try { fn(); } catch(error){ console.warn('QS League canonical score skipped:', error); } }
  function emptyMedals(){ return { gold:0, silver:0, bronze:0 }; }
  function normalized(value){ return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function uniqueBy(list, keyFn){
    const seen = new Set();
    return (list || []).filter(item => { const key = keyFn(item); if(!key || seen.has(key)) return false; seen.add(key); return true; });
  }
  const officialRoster = [
    { id:'agustin', name:'Agustin', fullName:'Agustin Goñi Piuma', team:'slytherin', aliases:['Agustin','Agustín','Agus','Agustin Goñi Piuma'] },
    { id:'alejandro', name:'Alejandro', fullName:'Alejandro Frank', team:'hufflepuff', aliases:['Alejandro','Alejandro Frank','Ale'] },
    { id:'eugenio', name:'Eugenio', fullName:'Eugenio Balbastro Fages', team:'ravenclaw', aliases:['Eugenio','Euge','Eugenio Balbastro Fages','8706743'] },
    { id:'javi', name:'Javi', fullName:'Javier De Vergilio', team:'gryffindor', aliases:['Javi','Javier','Javier De Vergilio'] },
    { id:'jesica', name:'Jesica', fullName:'Jesica Titaro', team:'slytherin', aliases:['Jesica','Jesi','Jess','Jesica Titaro'] },
    { id:'juli', name:'Juli', fullName:'Juli Piccioni', team:'unassigned', aliases:['Juli','July','Picci','Juli Piccioni'] },
    { id:'lucrecia', name:'Lucrecia', fullName:'Lucrecia Moralejo', team:'unassigned', aliases:['Lucrecia','Lucre','Lucrecia Moralejo','Luly','Luli'] },
    { id:'mayra', name:'May', fullName:'Mayra Milanesio', team:'unassigned', aliases:['May','Mayra','Mayra Milanesio','May(Ra)'] },
    { id:'nico', name:'Nico', fullName:'Nicolas Rivero Segura', team:'unassigned', aliases:['Nico','Nicolas','Nicolás','Nicolas Rivero Segura'] },
    { id:'pablo', name:'Pablo', fullName:'Pablo Hernan Gimenez', team:'slytherin', aliases:['Pablo','Pablo Gimenez','Pablo Hernan Gimenez','Hero','Heror'] },
    { id:'sebas', name:'Sebas', fullName:'Sebastian Carnota', team:'unassigned', aliases:['Sebas','Seba','Sebastian','Sebastian Carnota'] }
  ];
  const aliasToId = new Map();
  officialRoster.forEach(person => [person.id, person.name, person.fullName, ...(person.aliases || [])].forEach(alias => aliasToId.set(normalized(alias), person.id)));
  function resolveId(value){ return aliasToId.get(normalized(value)) || ''; }
  function prize(rank){
    if(rank === 1) return { delta:3, key:'gold', label:'Oro +3' };
    if(rank === 2) return { delta:2, key:'silver', label:'Plata +2' };
    if(rank === 3) return { delta:1, key:'bronze', label:'Bronce +1' };
    return { delta:0, key:null, label:'—' };
  }
  const canonicalImports = [
    { id:'canonical-20260702-ale', session:'02 de julio 2026 - Ale', date:'2026-07-02', moderator:'alejandro', rows:[
      { rank:1, playerId:'mayra', nickname:'May', score:13157, correct:15 },
      { rank:2, playerId:'javi', nickname:'Javi', score:12973, correct:13 },
      { rank:3, playerId:'nico', nickname:'Nico', score:11460, correct:11 },
      { rank:4, playerId:'', nickname:'Tuki', score:11097, correct:14 },
      { rank:5, playerId:'jesica', nickname:'Jesi', score:10748, correct:13 },
      { rank:6, playerId:'sebas', nickname:'Sebas', score:10199, correct:12 },
      { rank:7, playerId:'eugenio', nickname:'8706743', score:8698, correct:10 }
    ]},
    { id:'canonical-20260716-sebas', session:'16 de julio 2026 - Sebas', date:'2026-07-16', moderator:'sebas', rows:[
      { rank:1, playerId:'javi', nickname:'Javi', score:9771, correct:12 },
      { rank:2, playerId:'mayra', nickname:'May', score:7485, correct:10 },
      { rank:3, playerId:'pablo', nickname:'Heror', score:6963, correct:9 },
      { rank:4, playerId:'', nickname:'Tuki', score:6893, correct:9 },
      { rank:5, playerId:'lucrecia', nickname:'Luly', score:5660, correct:8 },
      { rank:6, playerId:'juli', nickname:'Picci', score:5399, correct:7 },
      { rank:7, playerId:'nico', nickname:'Nico', score:5371, correct:7 },
      { rank:8, playerId:'alejandro', nickname:'Ale', score:3953, correct:6 }
    ]}
  ];
  const canonicalSessions = new Set(canonicalImports.map(item => item.session));
  function normalizeImport(importItem){
    return {
      ...importItem,
      rows: (importItem.rows || []).map(row => ({ ...row, playerId: row.playerId || resolveId(row.nickname) }))
    };
  }
  function makeRoster(previousPlayers){
    const previousById = new Map((previousPlayers || []).map(item => [item.id, item]));
    return officialRoster.map(person => {
      const previous = previousById.get(person.id) || {};
      return {
        ...person,
        aliases:[...new Set([person.name, person.fullName, ...(person.aliases || []), ...(previous.aliases || [])].filter(Boolean))],
        coins:0,
        medals:emptyMedals(),
        meteorites:0
      };
    });
  }
  function applyImport(importItem){
    const session = importItem.session || 'Kahoot QS League';
    const moderatorId = importItem.moderator || '';
    const rows = (importItem.rows || [])
      .map(row => ({ ...row, playerId: row.playerId || resolveId(row.nickname) }))
      .filter(row => row.playerId && row.playerId !== moderatorId)
      .sort((a,b) => Number(a.rank || 999) - Number(b.rank || 999) || Number(b.score || 0) - Number(a.score || 0))
      .map((row,index) => ({ ...row, rank:index + 1 }));
    rows.forEach(row => {
      const p = prize(row.rank);
      const target = player(row.playerId);
      if(!target || !p.delta) return;
      target.coins = Number(target.coins || 0) + p.delta;
      target.medals = { ...emptyMedals(), ...(target.medals || {}) };
      target.medals[p.key] += 1;
      state.ledger.push({ id:`score-${importItem.id}-${target.id}-${row.rank}`, type:'dino', player:target.id, delta:p.delta, reason:`${session}: ${p.label}` });
    });
    (importItem.absences || []).forEach(absence => {
      const id = absence.id || absence.playerId;
      const target = player(id);
      if(!target) return;
      const penalty = Number(absence.penalty || 0);
      target.meteorites = Number(target.meteorites || 0) + 1;
      state.ledger.push({ id:`absence-${importItem.id}-${id}`, type:'meteor', player:id, delta:1, reason:`Ausencia en ${session}. ${absence.label || ''}`.trim() });
      if(penalty){
        target.coins = Number(target.coins || 0) - penalty;
        state.ledger.push({ id:`absence-penalty-${importItem.id}-${id}`, type:'dino', player:id, delta:-penalty, reason:`Penalización por ausencia en ${session}.` });
      }
    });
    return { ...importItem, rows };
  }
  function canonicalize(){
    if(!state || !Array.isArray(state.players)) return;
    const previousImports = Array.isArray(state.imports) ? state.imports.map(normalizeImport) : [];
    const futureImports = uniqueBy(previousImports.filter(item => !canonicalSessions.has(item.session)), item => item.session || item.id);
    state.players = makeRoster(state.players);
    state.ledger = [];
    state.imports = [];
    [...canonicalImports.map(normalizeImport), ...futureImports].forEach(importItem => state.imports.push(applyImport(importItem)));
    save();
    if(typeof render === 'function') render();
  }
  safeCall(canonicalize);
  window.qsLeagueCanonicalizeSeason02 = canonicalize;
})();
