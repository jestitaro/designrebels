(function(){
  function safeCall(fn){ try { fn(); } catch(error){ console.warn('QS League score reconcile skipped:', error); } }
  function medalShape(){ return { gold:0, silver:0, bronze:0 }; }
  function normalizeText(value){ return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function canonicalSession(value){
    const text = normalizeText(value);
    if(text.includes('02 de julio 2026') || text.includes('2-semestre') || text.includes('20260702')) return '2026-07-02-ale';
    if(text.includes('16 de julio 2026') || text.includes('16-de-julio') || text.includes('20260716')) return '2026-07-16-sebas';
    return text;
  }
  function remapPlayerId(id, nickname){
    const map = { ale:'alejandro', euge:'eugenio', jess:'jesica', july:'juli', luly:'lucrecia', hero:'pablo', seba:'sebas' };
    if(map[id]) return map[id];
    if(id && player(id)) return id;
    const n = normalizeText(nickname);
    const match = (state.players || []).find(item => [item.id, item.name, item.fullName, ...(item.aliases || [])].some(alias => normalizeText(alias) === n));
    return match?.id || id || '';
  }
  function awardFromRank(rank){
    if(rank === 1) return { delta:3, key:'gold', label:'Oro +3' };
    if(rank === 2) return { delta:2, key:'silver', label:'Plata +2' };
    if(rank === 3) return { delta:1, key:'bronze', label:'Bronce +1' };
    return { delta:0, key:null, label:'—' };
  }
  function sessionRows(importItem){
    const moderator = importItem.moderator || '';
    return (importItem.rows || [])
      .map(row => ({ ...row, playerId: remapPlayerId(row.playerId, row.nickname) }))
      .filter(row => row.playerId && row.playerId !== moderator)
      .sort((a,b) => Number(a.rank || 999) - Number(b.rank || 999) || Number(b.score || 0) - Number(a.score || 0))
      .map((row,index) => ({ ...row, rank:index + 1 }));
  }
  function uniqueImports(){
    const imports = Array.isArray(state.imports) ? state.imports : [];
    const seen = new Set();
    return imports.filter(item => {
      const key = canonicalSession(item.session || item.id || item.date || '');
      if(!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).reverse();
  }
  function manualEntries(){
    return (state.ledger || []).filter(item => /^manual-|^meteor-|^absence-|^absence-penalty-/.test(String(item.id || '')));
  }
  function reconcileScores(){
    const existingMeteorites = Object.fromEntries((state.players || []).map(item => [item.id, Number(item.meteorites || 0)]));
    (state.players || []).forEach(item => {
      item.coins = 0;
      item.medals = medalShape();
      item.meteorites = existingMeteorites[item.id] || 0;
    });

    const rebuiltLedger = [];
    uniqueImports().forEach(importItem => {
      const session = importItem.session || 'Kahoot QS League';
      sessionRows(importItem).forEach(row => {
        const prize = awardFromRank(row.rank);
        const target = player(row.playerId);
        if(!target || !prize.delta) return;
        target.coins += prize.delta;
        target.medals[prize.key] += 1;
        rebuiltLedger.push({ id:`recalc-${canonicalSession(session)}-${target.id}-${row.rank}`, type:'dino', player:target.id, delta:prize.delta, reason:`${session}: ${prize.label}` });
      });
    });

    manualEntries().forEach(entry => {
      const id = remapPlayerId(entry.player, entry.player);
      const target = player(id);
      if(!target) return;
      if(entry.type === 'meteor') target.meteorites = Math.max(0, Number(target.meteorites || 0) + Number(entry.delta || 0));
      if(entry.type === 'dino') target.coins = Number(target.coins || 0) + Number(entry.delta || 0);
      rebuiltLedger.push({ ...entry, player:id });
    });

    state.imports = uniqueImports().map(item => ({
      ...item,
      rows: (item.rows || []).map(row => ({ ...row, playerId: remapPlayerId(row.playerId, row.nickname) }))
    }));
    state.ledger = rebuiltLedger;
    save();
    render();
  }

  safeCall(reconcileScores);
})();
