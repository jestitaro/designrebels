(function(){
  function safeCall(fn){ try { fn(); } catch(error){ console.warn('QS League absence rule skipped:', error); } }
  function n(value){ return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function getModeratorId(){ return document.querySelector('#moderatorSelect')?.value || ''; }
  function allPlayerIds(){ return (state.players || []).map(item => item.id).filter(Boolean); }
  function resolvePlayerId(value){
    const normalized = n(value);
    const match = (state.players || []).find(item => [item.id, item.name, item.fullName, ...(item.aliases || [])].some(alias => n(alias) === normalized));
    return match?.id || '';
  }
  function normalizePendingRows(){
    if(!Array.isArray(state.pending)) return [];
    state.pending = state.pending.map(row => ({ ...row, playerId: row.playerId || resolvePlayerId(row.nickname) }));
    return state.pending;
  }
  function participatingIds(moderatorId){
    return new Set(normalizePendingRows().filter(row => row.playerId && row.playerId !== moderatorId).map(row => row.playerId));
  }
  function absenteesFor(moderatorId){
    const participating = participatingIds(moderatorId);
    return allPlayerIds().filter(id => id !== moderatorId && !participating.has(id));
  }
  function absenceLabel(value){
    return value === 'notice' ? 'Avisó 24 h antes' : value === 'no_notice' ? 'Sin aviso' : 'Elegir tipo de falta';
  }
  function absencePenalty(value){
    return value === 'notice' ? 1 : value === 'no_notice' ? 3 : 0;
  }
  function absenceSelect(id){
    return `<select class="absence-status" data-absence-status="${id}"><option value="">Elegir tipo</option><option value="notice">Avisó 24 h antes · -1</option><option value="no_notice">Sin aviso · -3</option></select>`;
  }
  function sessionLabel(){
    const reports = [...new Set((state.pending || []).map(row => row.reportName).filter(Boolean))];
    return reports[0] || document.querySelector('#sessionName')?.value || 'Kahoot QS League';
  }
  function selectedAbsenceDecisions(absenteeIds){
    return absenteeIds.map(id => {
      const value = document.querySelector(`[data-absence-status="${id}"]`)?.value || '';
      return { id, value, label: absenceLabel(value), penalty: absencePenalty(value) };
    });
  }
  function applyAbsenceDecisions(decisions, moderatorId, session){
    const moderatorName = player(moderatorId)?.name || 'Sin moderador';
    decisions.forEach(decision => {
      const target = player(decision.id);
      if(!target) return;
      target.meteorites = Number(target.meteorites || 0) + 1;
      state.ledger.push({
        id:`absence-${Date.now()}-${decision.id}`,
        type:'meteor',
        player:decision.id,
        delta:1,
        reason:`Ausencia en ${session}. ${decision.label}. Moderador: ${moderatorName}.`
      });
      if(decision.penalty > 0){
        target.coins = Number(target.coins || 0) - decision.penalty;
        state.ledger.push({
          id:`absence-penalty-${Date.now()}-${decision.id}`,
          type:'dino',
          player:decision.id,
          delta:-decision.penalty,
          reason:`Penalización por ausencia en ${session}: ${decision.label}.`
        });
      }
    });
  }
  function renderAbsencePanel(absenteeIds){
    if(!absenteeIds.length) return '<p class="preview-source">Ausencias detectadas: ninguna.</p>';
    return `<div class="absence-panel"><strong>Ausencias detectadas</strong><p>Elegí el tipo de falta para cada persona antes de actualizar.</p>${absenteeIds.map(id => `<label class="absence-row"><span>${player(id)?.name || id}</span>${absenceSelect(id)}</label>`).join('')}</div>`;
  }
  function prizeMarkup(prize){
    if(!prize.key) return prize.label;
    const icon = typeof medalIcon === 'function' ? medalIcon(medalClass(prize.key)) : '';
    return `${icon} ${prize.label}`;
  }

  const originalRenderPreview = typeof renderPreview === 'function' ? renderPreview : null;
  if(originalRenderPreview){
    renderPreview = function(){
      const container = document.querySelector('#preview');
      if(!container) return;
      if(!state.pending){ container.className = 'preview empty'; container.textContent = 'Todavía no hay informe cargado.'; return; }
      container.className = 'preview';
      normalizePendingRows();
      const moderatorId = getModeratorId();
      const mapped = state.pending.filter(row => row.playerId).length;
      const unmapped = state.pending.length - mapped;
      const absenteeIds = moderatorId ? absenteesFor(moderatorId) : [];
      const meta = state.pendingMeta || {};
      const files = meta.files || [];
      const opts = ['<option value="">Sin mapear</option>', ...state.players.map(item => `<option value="${item.id}">${item.name}</option>`)].join('');
      const fileSummary = files.length ? `<p class="preview-source">Informe: ${files.map(file => `${file.fileName || 'archivo'} (${file.sheet || 'hoja?'})`).join(' · ')}</p>` : '';
      const moderatorWarning = !moderatorId ? '<p class="preview-warning">Elegí el moderador antes de actualizar el ranking.</p>' : '';
      const warning = unmapped ? `<p class="preview-warning">Hay ${unmapped} participante${unmapped>1?'s':''} sin mapear. Podés mapearlo a alguien existente o agregarlo como nuevo.</p>` : '';
      const failed = meta.failed?.length ? `<p class="preview-warning">No pude leer: ${meta.failed.join(', ')}</p>` : '';
      const absencePanel = moderatorId ? renderAbsencePanel(absenteeIds) : '';
      container.innerHTML = `<div class="import-status"><article><strong>${fmt(files.length || 1)}</strong><span>informes</span></article><article><strong>${fmt(state.pending.length)}</strong><span>filas</span></article><article><strong>${fmt(mapped)}</strong><span>mapeados</span></article><article><strong>${fmt(unmapped)}</strong><span>sin mapear</span></article><article><strong>${fmt(absenteeIds.length)}</strong><span>ausencias</span></article></div>${fileSummary}${moderatorWarning}${warning}${failed}${absencePanel}<table><thead><tr><th>Rank</th><th>Nickname</th><th>Score</th><th>Correctas</th><th>Mapeo QS</th><th>Premio</th></tr></thead><tbody>${state.pending.map((row,index) => { const isModerator = row.playerId && row.playerId === moderatorId; const addButton = row.playerId ? '' : `<button class="ghost small add-player-btn" type="button" onclick="window.qsLeagueAddPendingPlayer(${index})">Agregar nuevo</button>`; const displayRank = isModerator ? 'Mod.' : row.rank; const prize = award(row.rank); return `<tr class="${isModerator?'moderator-row':''}"><td>${displayRank}</td><td>${row.nickname}</td><td>${fmt(row.score)}</td><td>${row.correct ?? '—'}</td><td><select data-map="${index}">${opts}</select><div class="${row.playerId?'mapped':'unmapped'}">${isModerator?'Moderador':row.playerId?'Detectado':'Revisar'}</div>${addButton}</td><td>${isModerator?'No compite':prizeMarkup(prize)}</td></tr>`; }).join('')}</tbody></table>`;
      document.querySelectorAll('[data-map]').forEach(select => { select.value = state.pending[select.dataset.map].playerId; select.addEventListener('change', () => { state.pending[select.dataset.map].playerId = select.value; save(); renderPreview(); }); });
    };
  }

  function applyImportWithNewAbsenceRules(){
    const moderatorId = getModeratorId();
    if(!moderatorId){ toast('Elegí el moderador de la fecha antes de actualizar.'); renderPreview(); return; }
    if(!state.pending?.length){ toast('Primero cargá un informe de Kahoot.'); return; }
    normalizePendingRows();
    const unresolved = state.pending.filter(row => !row.playerId);
    if(unresolved.length){ toast('Hay participantes sin mapear. Revisalos antes de actualizar.'); renderPreview(); return; }

    const session = sessionLabel();
    const duplicates = (state.imports || []).some(item => item.session === session);
    if(duplicates && !confirm(`Este informe ya parece cargado: ${session}. ¿Querés aplicarlo igual?`)) return;

    const absenteeIds = absenteesFor(moderatorId);
    renderPreview();
    const decisions = selectedAbsenceDecisions(absenteeIds);
    const missingDecision = decisions.find(item => !item.value);
    if(missingDecision){ toast('Elegí si cada ausencia fue con aviso o sin aviso.'); return; }

    const participantRows = state.pending
      .filter(row => row.playerId !== moderatorId)
      .sort((a,b) => Number(a.rank || 999) - Number(b.rank || 999) || Number(b.score || 0) - Number(a.score || 0))
      .map((row,index) => ({ ...row, originalRank: row.rank, rank: index + 1 }));

    const summary = decisions.length
      ? decisions.map(item => `${player(item.id)?.name || item.id}: ${item.label} (-${item.penalty})`).join('\n')
      : 'ninguna';
    const moderatorName = player(moderatorId)?.name || 'moderador';
    const ok = confirm(`Moderador: ${moderatorName}.\nAusencias detectadas:\n${summary}\n\nSe cargará 1 meteorito a cada ausente y se restarán los puntos indicados. ¿Actualizar ranking?`);
    if(!ok) return;

    const importId = `import-${Date.now()}`;
    participantRows.forEach(row => {
      const prize = award(row.rank);
      const target = player(row.playerId);
      if(prize.delta && target){
        target.coins = Number(target.coins || 0) + prize.delta;
        target.medals = { gold:0, silver:0, bronze:0, ...(target.medals || {}) };
        target.medals[prize.key] += 1;
        state.ledger.push({ id:`${importId}-${target.id}-${row.rank}`, type:'dino', player:target.id, delta:prize.delta, reason:`${session}: ${prize.label}` });
      }
    });

    applyAbsenceDecisions(decisions, moderatorId, session);
    state.imports = Array.isArray(state.imports) ? state.imports : [];
    state.imports.unshift({ id:importId, session, date:new Date().toISOString(), moderator:moderatorId, rows:participantRows, absences:decisions });
    state.pending = null;
    state.pendingMeta = null;
    save();
    if(typeof closeUploadModal === 'function') closeUploadModal();
    render();
    if(typeof setTab === 'function') setTab('arena');
    if(typeof dropConfetti === 'function') dropConfetti();
    toast('Ranking actualizado con la nueva regla de ausencias.');
  }

  document.addEventListener('change', event => {
    if(event.target?.id === 'moderatorSelect' || event.target?.matches?.('[data-absence-status]')) renderPreview();
  });
  document.addEventListener('click', event => {
    if(event.target.closest('#applyImport')){
      event.preventDefault();
      event.stopImmediatePropagation();
      safeCall(applyImportWithNewAbsenceRules);
    }
  }, true);

  safeCall(function(){
    const rules = [
      { title:'Puntos por podio', body:'Oro +3, plata +2 y bronce +1. El moderador no compite en su propia fecha.' },
      { title:'Ausencias', body:'Cada ausencia suma 1 meteorito. Si avisó con 24 horas de anticipación, resta 1 punto. Si falta sin aviso, resta 3 puntos.' },
      { title:'Ranking actual', body:'La Arena actual muestra el ranking individual. Equipos queda pausado hasta definir la mecánica grupal.' },
      { title:'Leyendas', body:'Los semestres cerrados pasan a Leyendas. El primer semestre 2026 cuenta solo ganadores.' }
    ];
    localStorage.setItem(RULES_STORAGE, JSON.stringify(rules));
    render();
  });
})();
