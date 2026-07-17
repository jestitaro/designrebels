(function(){
  function safeCall(fn){ try { fn(); } catch(error){ console.warn('QS League current podium skipped:', error); } }
  function medalMarkup(player){
    const medals = player.medals || {};
    const icon = typeof medalIcon === 'function' ? medalIcon : cls => `<i class="fa-solid fa-medal ${cls}" aria-hidden="true"></i>`;
    return `<div class="medals"><span>${icon('medal-gold')} ${Number(medals.gold || 0)}</span><span>${icon('medal-silver')} ${Number(medals.silver || 0)}</span><span>${icon('medal-bronze')} ${Number(medals.bronze || 0)}</span></div>`;
  }
  function initials(value){
    return String(value || 'QS').trim().split(/\s+/).slice(0,2).map(part => part.charAt(0).toUpperCase()).join('') || 'QS';
  }
  function currentTopThree(){
    return [...(state.players || [])]
      .filter(item => Number(item.coins || 0) > 0 || Number(item.medals?.gold || 0) > 0 || Number(item.medals?.silver || 0) > 0 || Number(item.medals?.bronze || 0) > 0)
      .sort((a,b) =>
        Number(b.coins || 0) - Number(a.coins || 0) ||
        Number(b.medals?.gold || 0) - Number(a.medals?.gold || 0) ||
        Number(b.medals?.silver || 0) - Number(a.medals?.silver || 0) ||
        Number(b.medals?.bronze || 0) - Number(a.medals?.bronze || 0) ||
        String(a.name || '').localeCompare(String(b.name || ''),'es')
      )
      .slice(0,3);
  }
  function renderCurrentPodium(){
    const container = document.querySelector('#podium');
    if(!container) return;
    const top = currentTopThree();
    container.classList.add('current-podium');
    if(!top.length){
      container.innerHTML = '<article class="podium-card"><span class="podium-kicker">Temporada actual</span><h3>Sin puntajes todavía</h3><p>Subí un informe de Kahoot para iniciar la arena.</p></article>';
      return;
    }
    const labels = ['Líder actual','Segundo lugar','Tercer lugar'];
    container.innerHTML = top.map((item,index) => `
      <article class="podium-card current-place-${index + 1}">
        <div>
          <div class="place">0${index + 1}</div>
          <div class="avatar">${initials(item.name)}</div>
          <span class="podium-kicker">${labels[index]}</span>
          <h3>${item.name}</h3>
          <p>${item.fullName || item.team || ''}</p>
        </div>
        <div>
          ${medalMarkup(item)}
          <div class="coins">${Number(item.coins || 0)} <i class="fa-solid fa-coins" aria-hidden="true"></i></div>
        </div>
      </article>
    `).join('');
  }
  const previousRender = typeof render === 'function' ? render : null;
  if(previousRender){
    render = function(){
      previousRender();
      renderCurrentPodium();
    };
  }
  document.addEventListener('DOMContentLoaded', () => safeCall(renderCurrentPodium));
  safeCall(renderCurrentPodium);
})();
