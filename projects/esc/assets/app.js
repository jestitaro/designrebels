/* Recreo — app.js
 * Launcher (abanico de cards), overlay de juego, jugador, panel "Hoy",
 * ranking compartido y recordatorio de calendario.
 */
(function () {
  const R = window.Recreo;
  const { store, ranking, esc, fmtTime, fmtScore, todayKey, dayNumber } = R;
  const $ = id => document.getElementById(id);
  const ORDER = ['ruta', 'gondola', 'teclazo', 'equilibrio', 'sudoku', 'pasala'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtVal = (id, v) => R.games[id].kind === 'score' ? fmtScore(v) : fmtTime(v);
  const firstName = n => String(n).split(' ')[0];

  const PEOPLE = ['Pablo Hernán Giménez', 'Nicolás Rivero Segura', 'Agustín Goñi Piuma', 'Julieta Piccioni', 'Sebastián Carnota', 'Jésica Títaro', 'Matías Herrera', 'Jonathan Torres', 'Francisco Tapia', 'David Troila', 'Sergio Maturano', 'Javier Ignacio De Vergilio', 'Loreana Lucero', 'Valeria Ventura', 'Adolfo Wetzel', 'Mayra Milanesio', 'Eugenio Balbastro Fages', 'Lucrecia Moralejo', 'Mariana Azúa'];

  const TIPS = [
    'Mirá algo que esté a seis metros durante veinte segundos. Tus ojos lo agradecen.',
    'Subí los hombros hacia las orejas, sostené tres segundos y dejalos caer. Dos veces más.',
    'Levantate y caminá hasta la cocina. Sí, aunque no tengas hambre.',
    'Tomá un vaso de agua. El mate también cuenta, con moderación.',
    'Girá el cuello despacio hacia un lado y hacia el otro, cinco veces.',
    'Estirá los brazos arriba de la cabeza y respirá hondo tres veces.',
    'Cerrá los ojos treinta segundos. Nadie se va a enterar.',
    'Abrí la ventana y mirá el cielo un minuto antes de volver.'
  ];
  R.TIPS = TIPS;

  /* ---------- Ilustraciones de cada card ---------- */
  const ART = {
    ruta: `<svg viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#fff"/>${[20, 48, 76, 104].flatMap(y => [20, 48, 76, 104].map(x => `<rect x="${x - 12}" y="${y - 12}" width="24" height="24" rx="6" fill="#e3ebfd"/>`)).join('')}<polyline points="20,20 48,20 48,48 20,48 20,76 48,76 48,104 76,104 76,48 76,20 104,20 104,104" fill="none" stroke="#463DE1" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>${[[20, 20, 1], [20, 76, 2], [76, 48, 3], [104, 104, 4]].map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="10" fill="#130D5D"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="13" fill="#fff">${n}</text>`).join('')}</svg>`,
    gondola: `<svg viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#130D5D"/>${[['#d9cffd', '#d9cffd', '#bfe0fd', '#bfe0fd'], ['#f3d3f6', '#d9cffd', '#bfe0fd', '#c8cffd'], ['#f3d3f6', '#f3d3f6', '#c8cffd', '#c8cffd'], ['#f3d3f6', '#cfeef6', '#cfeef6', '#c8cffd']].map((row, r) => row.map((c, k) => `<rect x="${8 + k * 26.5}" y="${8 + r * 26.5}" width="25" height="25" rx="${(r === 0 && k === 0) ? 6 : 3}" fill="${c}"/>`).join('')).join('')}${[[1, 0], [3, 1], [0, 2], [2, 3]].map(([c, r]) => `<g transform="translate(${8 + c * 26.5 + 4.5} ${8 + r * 26.5 + 3})"><rect x="5" y="0" width="6" height="3" rx="1" fill="#130D5D"/><rect x="3" y="3.5" width="10" height="15" rx="3" fill="#130D5D"/><rect x="3" y="8" width="10" height="4" fill="#fff"/></g>`).join('')}</svg>`,
    equilibrio: `<svg viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#fff"/>${[0, 1, 2].flatMap(r => [0, 1, 2].map(c => `<rect x="${10 + c * 35}" y="${10 + r * 35}" width="30" height="30" rx="8" fill="#efeafd"/>`)).join('')}${[[0, 0, 1], [1, 0, 2], [2, 0, 1], [0, 1, 2], [2, 1, 2], [1, 2, 1], [2, 2, 1]].map(([c, r, v]) => `<g transform="translate(${13 + c * 35} ${13 + r * 35}) scale(.75)">${v === 1 ? '<path d="M8.6 12.4c0-2.1 2.6-3.3 7.4-3.3s7.4 1.2 7.4 3.3c2.2 3.2 2 9.4-1.2 12.7-2.2 2.3-10.2 2.3-12.4 0-3.2-3.3-3.4-9.5-1.2-12.7z" fill="#7025E0"/><path d="M17.6 12 22.4 3" stroke="#b9c3d6" stroke-width="2.2" stroke-linecap="round"/>' : '<path d="M5.5 12.5h17v5.8a8.5 8.5 0 0 1-17 0z" fill="#3C9FF1"/><path d="M22.5 14.4h1.6a3.6 3.6 0 0 1 0 7.2h-2.3" fill="none" stroke="#3C9FF1" stroke-width="2.4"/>'}</g>`).join('')}<circle cx="42.5" cy="25" r="7" fill="#fff" stroke="#e2e0f0"/><text x="42.5" y="29" text-anchor="middle" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="11" fill="#5932E0">×</text><circle cx="60" cy="77.5" r="7" fill="#fff" stroke="#e2e0f0"/><text x="60" y="81.5" text-anchor="middle" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="11" fill="#5932E0">=</text></svg>`,
    pasala: `<svg viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#fff"/><path d="M0 44 120 56v20L0 64z" fill="#efeafd"/><path d="M0 44 120 56" stroke="#c9bdf7" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => `<line x1="${k * 10}" y1="${44 + k}" x2="${k * 10}" y2="${64 + k}" stroke="#ddd3fb" stroke-width="1"/>`).join('')}<text x="34" y="62" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="11" fill="#7025E0" transform="rotate(5.7 34 62)">MAR.</text><text x="74" y="66" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="11" fill="#c4b3f7" transform="rotate(5.7 74 66)">MIÉ.</text><rect x="62" y="40" width="3" height="40" rx="1.5" fill="#130D5D"/><g transform="translate(78 18)"><rect x="-4" y="6" width="8" height="12" rx="3" fill="#fff" stroke="#130D5D" stroke-width="1.2"/><circle cy="2" r="4" fill="#f2b48a"/><path d="M-2.5 18v8M2.5 18v8" stroke="#130D5D" stroke-width="2.6" stroke-linecap="round"/></g><g transform="translate(34 84)"><rect x="-5" y="6" width="10" height="14" rx="3" fill="#ff6b57"/><circle cy="1" r="4.6" fill="#d9925f"/><path d="M-5 9-9-2M5 9 9-2" stroke="#ff6b57" stroke-width="3" stroke-linecap="round"/><path d="M-3 20v9M3 20v9" stroke="#2b2b3a" stroke-width="3" stroke-linecap="round"/></g><g transform="translate(86 92)"><rect x="-5" y="6" width="10" height="14" rx="3" fill="#17b897"/><circle cy="1" r="4.6" fill="#f2b48a"/><path d="M-3 20v9M3 20v9" stroke="#130D5D" stroke-width="3" stroke-linecap="round"/></g><g transform="translate(46 26) rotate(-12)"><rect x="-10" y="-7" width="20" height="14" rx="2" fill="#fff" stroke="#130D5D" stroke-opacity=".25"/><path d="M-9-5 0 1.5 9-5" stroke="#3C9FF1" stroke-width="1.6" fill="none"/></g><path d="M36 74Q40 40 44 32" stroke="#3C9FF1" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/></svg>`,
    sudoku: `<svg viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#fff"/>${[[3, 1, 6], [5, 2, 4], [1, 6, 2]].flatMap((row, r) => row.map((n, c) => `<rect x="${10 + c * 35}" y="${10 + r * 35}" width="30" height="30" rx="8" fill="${r === 1 && c === 1 ? '#7025E0' : '#efeafd'}"/><text x="${25 + c * 35}" y="${32 + r * 35}" text-anchor="middle" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="17" fill="${r === 1 && c === 1 ? '#fff' : (r + c) % 2 ? '#5932E0' : '#130D5D'}">${n}</text>`)).join('')}</svg>`,
    teclazo: `<svg viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#130D5D"/>${[[18, 16], [96, 24], [70, 10], [30, 50], [104, 62], [12, 88], [92, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#fff" opacity=".6"/>`).join('')}<rect x="14" y="20" width="64" height="20" rx="7" fill="#fff"/><text x="22" y="34" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="12" fill="#3C9FF1">gón<tspan fill="#130D5D">dola</tspan></text><rect x="62" y="48" width="44" height="18" rx="6" fill="rgba(255,255,255,.16)"/><text x="69" y="61" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="11" fill="#fff">stock</text><line x1="60" y1="84" x2="46" y2="40" stroke="#9fd0fa" stroke-width="2.5"/><svg x="44" y="80" width="32" height="34" viewBox="0 0 ${R.qSize.W.toFixed(1)} ${R.qSize.H.toFixed(1)}">${R.qSvg({ id: 'artq', face: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></svg>`
  };
  R.ART = ART;

  /* ---------- Launcher ---------- */
  const fan = $('fan');
  function renderFan() {
    fan.innerHTML = ORDER.map((id, k) => {
      const g = R.games[id], res = store.result(id), o = k - (ORDER.length - 1) / 2;
      return `<li class="gcard ${g.ink ? 'ink' : ''}" data-id="${id}" style="--o:${o};--abs:${Math.abs(o)};--k:${k};--alt:${k % 2 ? 1 : -1};--c:${g.card}">
        <button class="gcard-btn" type="button" aria-label="Jugar ${esc(g.name)}${res ? ` (hoy: ${fmtVal(id, res.value)})` : ''}">
          <h3 class="${g.name.length > 12 ? 'long' : ''}">${esc(g.name)}</h3>
          <span class="tag">${esc(g.tag)}</span>
          <span class="state ${res ? 'done' : ''}">${res ? `✓ ${fmtVal(id, res.value)}` : `n.° ${dayNumber()}`}</span>
          <span class="art">${ART[id]}</span>
          <span class="play">Jugar <b aria-hidden="true">↗</b></span>
        </button>
      </li>`;
    }).join('');
  }
  renderFan();
  fan.addEventListener('click', e => { const c = e.target.closest('.gcard'); if (c) openGame(c.dataset.id); });
  $('dayNo').textContent = dayNumber();
  $('brandKey').innerHTML = R.escSvg({ id: 'brandkey' });
  $('mascotQ').innerHTML = R.qSvg({ id: 'mascotq' });

  /* ---------- Jugador ---------- */
  const dlg = $('playerDlg'), sel = $('playerSel'), other = $('playerOther');
  sel.innerHTML = '<option value="">Elegí tu nombre</option>' + PEOPLE.slice().sort((a, b) => a.localeCompare(b, 'es')).map(n => `<option>${esc(n)}</option>`).join('') + '<option value="__other">Otra persona…</option>';
  let afterPlayer = null, anon = false;
  function askPlayer(then) {
    afterPlayer = then || null;
    const p = store.player;
    // se compara por slug (sin tildes) para reconocer nombres guardados con otra grafía
    const match = p && PEOPLE.find(n => R.slug(n) === p.id);
    if (match) sel.value = match; else if (p) { sel.value = '__other'; other.value = p.name; }
    $('otherWrap').hidden = sel.value !== '__other';
    $('pAnon').hidden = !then;
    dlg.showModal();
  }
  // cerrar tocando afuera (el click en el backdrop llega con target = el <dialog>)
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close('cancel'); });
  sel.addEventListener('change', () => { $('otherWrap').hidden = sel.value !== '__other'; if (sel.value === '__other') other.focus(); });
  dlg.addEventListener('close', () => {
    if (dlg.returnValue === 'ok') {
      const name = sel.value === '__other' ? other.value : sel.value;
      if (name.trim().length >= 3) store.setPlayer(name);
    } else if (dlg.returnValue === 'anon') anon = true;
    const cb = afterPlayer; afterPlayer = null;
    if (cb && (store.player || anon)) cb();
  });
  $('playerForm').addEventListener('submit', e => {
    if (e.submitter && e.submitter.value === 'ok') {
      const name = sel.value === '__other' ? other.value : sel.value;
      if (name.trim().length < 3) { e.preventDefault(); (sel.value === '__other' ? other : sel).focus(); }
    }
  });
  function renderWho() {
    const p = store.player;
    $('whoLabel').textContent = p ? `Hola, ${firstName(p.name)}` : 'Elegí tu nombre';
    $('whoBtn').classList.toggle('set', !!p);
  }
  { // si el nombre guardado es de la lista con otra grafía (tildes), se pasa al nombre oficial
    const p = store.player, m = p && PEOPLE.find(n => R.slug(n) === p.id);
    if (m && m !== p.name) store.setPlayer(m);
  }
  $('whoBtn').addEventListener('click', () => askPlayer());
  document.addEventListener('recreo:player', () => { renderWho(); renderRanking(); renderHoy(); });
  renderWho();

  /* ---------- Overlay de juego ---------- */
  const ov = $('game'), panel = ov.querySelector('.game-panel'), stage = $('gStage');
  let cur = null, timer = null, lastFocus = null;

  function openGame(id) {
    if (!store.player && !anon) { askPlayer(() => openGame(id)); return; }
    const g = R.games[id];
    lastFocus = document.activeElement;
    closeGame(true); confettiRun++;
    ov.hidden = false; document.body.style.overflow = 'hidden';
    panel.style.setProperty('--game', g.color);
    panel.classList.toggle('wide', g.kind === 'score');
    $('gBadge').innerHTML = ART[id];
    $('gTitle').textContent = g.name;
    const prev = store.result(id);
    $('gMeta').textContent = `n.° ${dayNumber()} · ${g.kind === 'time' && prev ? `práctica · hoy hiciste ${fmtTime(prev.value)}` : g.kind === 'score' && prev ? `tu mejor de hoy: ${fmtScore(prev.value)}` : 'hoy'}`;
    $('gHelp').innerHTML = g.help.map(h => `<li>${h}</li>`).join('');
    const firstTime = !localStorage.getItem('esc.seen.' + id);
    const showHelp = g.kind === 'time' || firstTime; // en los puzzles se ve antes de empezar
    $('gHelp').hidden = !showHelp; $('gHelpBtn').setAttribute('aria-expanded', String(showHelp));
    try { localStorage.setItem('esc.seen.' + id, '1'); } catch (e) {}
    $('gResult').hidden = true; $('gProg').style.width = '0';
    stage.innerHTML = ''; $('gActions').innerHTML = '';

    cur = { id, g, finished: false };
    const ctx = {
      el: stage,
      rng: R.rng(`${todayKey()}:${id}`),
      setActions(list) { cur.actions = list; renderActions(); },
      started() { markStarted(); },
      setHud(t) { $('gHud').textContent = t; },
      setProgress(p) { $('gProg').style.width = `${Math.round(p * 100)}%`; },
      nudge(node) { if (!node) return; node.classList.remove('nudge'); void node.offsetWidth; node.classList.add('nudge'); },
      toast,
      win() { finish(stopTimer()); },
      gameOver(score) { finish(score); }
    };
    cur.inst = g.mount(ctx);
    // Nada arranca solo: se puede leer "Cómo se juega" tranquilo y el reloj corre recién al tocar Empezar.
    if (g.kind === 'time') {
      $('gHud').textContent = '0:00';
      [...stage.children].forEach(n => { n.inert = true; });
      stage.classList.add('locked');
      stage.insertAdjacentHTML('beforeend', `<div class="g-cover"><p>El tiempo corre cuando tocás <b>Empezar</b>.</p></div>`);
    } else $('gHud').textContent = 'Listo para arrancar';
    renderActions();
    setTimeout(() => { const b = panel.querySelector('#gActions [data-start]'); (b || panel.querySelector('[data-close].icon-btn')).focus({ preventScroll: true }); }, 60);
  }

  function renderActions() {
    if (!cur) return;
    const list = cur.actions || [];
    const startBtn = cur.started ? '' : '<button class="btn btn-primary" type="button" data-start>Empezar <span aria-hidden="true">→</span></button>';
    $('gActions').innerHTML = startBtn + list.map((a, i) => `<button class="btn btn-ghost" type="button" data-a="${i}" ${cur.started ? '' : 'disabled'}>${esc(a.label)}</button>`).join('');
  }
  $('gActions').addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (b && cur && cur.actions) cur.actions[+b.dataset.a].onClick();
  });
  stage.addEventListener('click', e => { if (e.target.closest('.g-cover [data-start]')) startGame(); });
  $('gActions').addEventListener('click', e => { if (e.target.closest('[data-start]')) startGame(); });
  function startGame() {
    if (!cur || cur.started) return;
    if (cur.g.kind === 'time') {
      stage.classList.remove('locked');
      const cover = stage.querySelector('.g-cover'); if (cover) cover.remove();
      [...stage.children].forEach(n => { n.inert = false; });
      $('gHelp').hidden = true; $('gHelpBtn').setAttribute('aria-expanded', 'false');
      markStarted(); startTimer();
      const f = stage.querySelector('.board[tabindex="0"], .board [tabindex="0"]'); if (f) f.focus({ preventScroll: true });
    } else if (cur.inst.restart) cur.inst.restart(); // los arcade llaman a ctx.started() al arrancar
  }
  function markStarted() { if (!cur || cur.started) return; cur.started = true; renderActions(); }
  R.openGame = openGame;

  function startTimer() {
    timer = { acc: 0, since: performance.now() };
    const tick = () => { if (!timer) return; $('gHud').textContent = fmtTime(elapsed()); timer.raf = requestAnimationFrame(tick); };
    tick();
  }
  const elapsed = () => timer ? timer.acc + (timer.since ? performance.now() - timer.since : 0) : 0;
  function stopTimer() { const ms = elapsed(); if (timer) cancelAnimationFrame(timer.raf); timer = null; return Math.round(ms); }
  document.addEventListener('visibilitychange', () => {
    if (!timer) return;
    if (document.hidden) { timer.acc += performance.now() - timer.since; timer.since = 0; }
    else timer.since = performance.now();
  });

  async function finish(value) {
    if (!cur || cur.finished) return;
    cur.finished = true;
    const { id, g } = cur;
    const firstOfDay = store.setResult(id, value, g.kind);
    if (g.kind === 'time') $('gHud').textContent = fmtTime(value);
    confetti();
    const box = $('gResult');
    const next = ORDER.find(x => x !== id && !store.result(x));
    box.innerHTML = `
      <p class="r-kicker">${g.kind === 'time' ? '¡Resuelto!' : 'Fin del juego'}</p>
      <h3>${esc(g.name)} n.° ${dayNumber()}</h3>
      <p class="r-value">${fmtVal(id, value)}</p>
      <p class="r-msg" id="rMsg">Guardando tu resultado…</p>
      <div class="r-actions">
        ${g.kind === 'score' ? '<button class="btn btn-ghost" type="button" data-r="again">Jugar otra vez</button>' : ''}
        <button class="btn btn-ghost" type="button" data-r="rank">Ver ranking</button>
        ${next ? `<button class="btn btn-primary" type="button" data-r="next">Seguir con ${esc(R.games[next].name)} <span aria-hidden="true">→</span></button>` : '<button class="btn btn-primary" type="button" data-r="close">Volver al trabajo <span aria-hidden="true">→</span></button>'}
      </div>`;
    const mine = cur;
    setTimeout(() => { if (cur !== mine) return; box.hidden = false; box.querySelector('.btn-primary').focus({ preventScroll: true }); }, reduced ? 0 : 650);
    box.onclick = e => {
      const a = e.target.closest('[data-r]'); if (!a) return;
      if (a.dataset.r === 'again') { box.hidden = true; cur.finished = false; cur.inst.restart && cur.inst.restart(); }
      if (a.dataset.r === 'rank') { closeGame(); rankGame = id; renderRanking(); document.getElementById('ranking').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
      if (a.dataset.r === 'next') openGame(next);
      if (a.dataset.r === 'close') closeGame();
    };
    const status = anon && !store.player ? 'anon' : await ranking.submit(id, value);
    const msg = () => {
      const pos = store.player && ranking.position(id, store.player.id), total = ranking.list(id).length;
      if (status === 'anon') return 'Jugaste sin nombre, así que no entra en el ranking. Elegí tu nombre arriba para sumarte.';
      if (status === 'error') return 'Quedó guardado en este navegador, pero no pudimos subirlo al ranking. Revisá la conexión.';
      if (status === 'exists' && g.kind === 'time') return 'Ya habías jugado hoy: esta fue de práctica y no cambia el ranking.';
      if (status === 'exists') return `Tu mejor puntaje de hoy sigue arriba. ${pos ? `Vas #${pos} de ${total}.` : ''}`;
      if (status === 'improved') return `¡Nuevo récord tuyo del día! ${pos ? `Vas #${pos} de ${total}.` : ''}`;
      return pos ? `Quedaste en el puesto #${pos} de ${total} hoy.` : 'Tu resultado ya está en el ranking.';
    };
    const upd = () => { const m = $('rMsg'); if (m) m.textContent = msg(); };
    upd(); ranking.subscribe(upd); setTimeout(() => ranking.listeners.delete(upd), 8000);
    if (firstOfDay) renderFan();
  }

  function closeGame(silent) {
    if (cur && cur.inst && cur.inst.destroy) cur.inst.destroy();
    stopTimer(); cur = null;
    if (silent) return;
    ov.hidden = true; document.body.style.overflow = '';
    renderFan(); document.dispatchEvent(new CustomEvent('recreo:fan'));
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  ov.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeGame(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !ov.hidden && !e.target.classList.contains('tz-input')) closeGame();
    if (e.key === 'Tab' && !ov.hidden) { // foco atrapado en el panel
      const f = [...panel.querySelectorAll('button,[tabindex="0"],input')].filter(n => n.offsetParent && !n.closest('[hidden]'));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  $('gHelpBtn').addEventListener('click', () => { const h = $('gHelp'); h.hidden = !h.hidden; $('gHelpBtn').setAttribute('aria-expanded', String(!h.hidden)); });

  let toastT;
  function toast(t) { const n = $('gToast'); n.textContent = t; n.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => n.classList.remove('on'), 1300); }

  let confettiRun = 0;
  function confetti() {
    if (reduced) return;
    const c = $('confetti'), cx = c.getContext('2d'), r = panel.getBoundingClientRect();
    c.width = r.width; c.height = panel.scrollHeight;
    const colors = ['#3C9FF1', '#463DE1', '#5932E0', '#7025E0', '#130D5D', '#b9a7ff'];
    const ps = Array.from({ length: 140 }, () => ({ x: r.width / 2, y: 120, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 11 - 3, w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: colors[(Math.random() * colors.length) | 0] }));
    let t = 0; const run = ++confettiRun;
    (function f() {
      if (run !== confettiRun) { cx.clearRect(0, 0, c.width, c.height); return; }
      cx.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore(); });
      if (++t < 140) requestAnimationFrame(f); else cx.clearRect(0, 0, c.width, c.height);
    })();
  }

  /* ---------- Hoy ---------- */
  let tipI = 0;
  $('tipNext').addEventListener('click', () => { tipI = (tipI + 1) % TIPS.length; $('tipText').textContent = TIPS[tipI]; });
  function renderHoy() {
    const rows = ranking.rows || [];
    const people = new Set(rows.map(r => r.playerId)).size;
    animateNumber($('peopleToday'), people);
    $('playsToday').textContent = rows.length;
    $('streak').textContent = store.streak();
    const best = ranking.list('ruta')[0];
    $('fastest').textContent = best ? fmtTime(best.value) : '—';
    $('fastestLabel').textContent = best ? `la Ruta más rápida · ${firstName(best.name)}` : 'la Ruta más rápida (¡libre!)';
    const done = store.playedToday().filter(id => ORDER.includes(id)).length;
    $('myDone').textContent = done;
    const pct = `${(done / ORDER.length) * 100}%`;
    $('meterFill').style.width = pct; $('meterKnob').style.left = pct;
    $('mainFoot').textContent = ranking.error && !ranking.rows ? 'El ranking compartido no está disponible ahora; tus resultados se guardan igual en este navegador.' : 'Los tableros se renuevan a la medianoche (hora de Buenos Aires). Todos juegan el mismo.';
    $('myResults').innerHTML = ORDER.map(id => {
      const g = R.games[id], res = store.result(id);
      return `<li class="${res ? '' : 'empty'}" style="--c:${g.light}"><b>${esc(g.name)}</b><span>${res ? fmtVal(id, res.value).replace(' pts', '') : '—'}</span><button type="button" data-play="${id}">${res ? 'Otra vez' : 'Jugar'}</button></li>`;
    }).join('');
  }
  $('myResults').addEventListener('click', e => { const b = e.target.closest('[data-play]'); if (b) openGame(b.dataset.play); });
  function animateNumber(node, to) {
    const from = +node.textContent || 0;
    if (from === to || reduced) { node.textContent = to; return; }
    const t0 = performance.now();
    (function f(t) { const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); node.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  document.addEventListener('recreo:results', renderHoy);

  /* ---------- Ranking ---------- */
  let rankGame = 'ruta';
  $('rankTabs').innerHTML = ORDER.map(id => `<button class="tab" role="tab" type="button" data-g="${id}" style="--c:${R.games[id].card}"><i aria-hidden="true"></i>${esc(R.games[id].name)}</button>`).join('');
  $('rankTabs').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) { rankGame = b.dataset.g; renderRanking(); } });
  $('rankTabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = (ORDER.indexOf(rankGame) + (e.key === 'ArrowRight' ? 1 : ORDER.length - 1)) % ORDER.length;
    rankGame = ORDER[i]; renderRanking(); $('rankTabs').querySelector(`[data-g="${rankGame}"]`).focus();
  });
  function renderRanking() {
    $('rankTabs').querySelectorAll('.tab').forEach(t => { const on = t.dataset.g === rankGame; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    const board = $('rankBoard'), me = store.player && store.player.id;
    if (ranking.error && !ranking.rows) { board.innerHTML = '<p class="empty-msg">El ranking no está disponible en este momento. Probá de nuevo en un rato.</p>'; return; }
    if (!ranking.rows) { board.innerHTML = '<p class="empty-msg">Cargando ranking…</p>'; return; }
    const list = ranking.list(rankGame), g = R.games[rankGame], medals = ['🥇', '🥈', '🥉'];
    if (!list.length) { board.innerHTML = `<p class="empty-msg">Todavía nadie jugó ${esc(g.name)} hoy. El primer puesto está libre.</p><div style="text-align:center"><button class="btn btn-primary" type="button" data-play="${rankGame}">Jugar ${esc(g.name)} <span aria-hidden="true">→</span></button></div>`; return; }
    const pod = i => list[i] ? `<div class="pod p${i + 1}"><span class="medal" aria-hidden="true">${medals[i]}</span><b>${esc(list[i].name)}</b><span>${fmtVal(rankGame, list[i].value)}</span></div>` : `<div class="pod p${i + 1} empty"><span class="medal" aria-hidden="true">${medals[i]}</span><b>Libre</b><span>—</span></div>`;
    const row = (r, i) => `<li class="${r.playerId === me ? 'me' : ''}" style="--i:${Math.min(i, 12)}"><span class="pos">${i + 1}</span><span>${esc(r.name)}${r.playerId === me ? ' · vos' : ''}</span><span class="t">${fmtVal(rankGame, r.value)}</span></li>`;
    const top = list.slice(3, 12), myIdx = list.findIndex(r => r.playerId === me);
    let rows = top.map((r, i) => row(r, i + 3)).join('');
    if (myIdx >= 12) rows += '<li class="gap" aria-hidden="true">···</li>' + row(list[myIdx], myIdx);
    board.innerHTML = `<div class="podium">${pod(1)}${pod(0)}${pod(2)}</div>${rows ? `<ol class="lb">${rows}</ol>` : ''}<p class="lb-foot">${list.length} ${list.length === 1 ? 'persona jugó' : 'personas jugaron'} ${esc(g.name)} hoy.</p>`;
  }
  $('rankBoard').addEventListener('click', e => { const b = e.target.closest('[data-play]'); if (b) openGame(b.dataset.play); });

  ranking.subscribe(() => { renderRanking(); renderHoy(); document.dispatchEvent(new CustomEvent('recreo:ranking')); });

  /* ---------- Recordatorio ---------- */
  const form = $('remForm');
  const pad = n => String(n).padStart(2, '0');
  const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'], DAY_ES = { MO: 'lun', TU: 'mar', WE: 'mié', TH: 'jue', FR: 'vie' };
  function remCfg() {
    let t = form.querySelector('input[name=t]:checked').value;
    if (t === 'custom') t = $('remCustom').value || '16:00';
    const days = [...form.querySelectorAll('#remDays input:checked')].map(i => i.value);
    const dur = +form.querySelector('input[name=d]:checked').value;
    const [h, m] = t.split(':').map(Number);
    const d = new Date(); d.setSeconds(0, 0); d.setHours(h, m);
    for (let i = 0; i < 8; i++) { if (days.includes(DAYS[d.getDay()]) && d > new Date()) break; d.setDate(d.getDate() + 1); d.setHours(h, m); }
    const end = new Date(d.getTime() + dur * 6e4);
    const stamp = x => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
    return { t, days, dur, start: d, startS: stamp(d), endS: stamp(end) };
  }
  const url = location.href.split('#')[0];
  const remText = c => ({ title: `ESC · pausa de ${c.dur} min`, details: `Levantate, estirá, mirá lejos. Y si querés, jugá el desafío del día: ${url}` });
  function renderRem() {
    const c = remCfg(), txt = remText(c), ok = c.days.length > 0;
    const g = $('remGoogle');
    g.href = ok ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(txt.title)}&details=${encodeURIComponent(txt.details)}&location=${encodeURIComponent(url)}&dates=${c.startS}/${c.endS}&recur=${encodeURIComponent('RRULE:FREQ=WEEKLY;BYDAY=' + c.days.join(','))}` : '#';
    g.setAttribute('aria-disabled', String(!ok)); $('remIcs').disabled = !ok;
    const daysTxt = c.days.length === 5 ? 'de lunes a viernes' : c.days.length ? c.days.map(d => DAY_ES[d]).join(', ') : 'elegí al menos un día';
    $('remPreview').innerHTML = `<span class="cal"><span><small>${c.start.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</small>${c.t}</span></span><span><b>${esc(txt.title)}</b><span class="rp-sub">${c.dur} minutos, ${esc(daysTxt)}</span></span>`;
  }
  form.addEventListener('change', renderRem);
  $('remCustom').addEventListener('focus', () => { form.querySelector('input[value=custom]').checked = true; renderRem(); });
  $('remGoogle').addEventListener('click', e => { if ($('remGoogle').getAttribute('aria-disabled') === 'true') e.preventDefault(); });
  $('remIcs').addEventListener('click', () => {
    const c = remCfg(), txt = remText(c), now = new Date();
    const utc = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Design Rebels//ESC//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:esc-${Date.now()}@designrebels`, `DTSTAMP:${utc}`, `DTSTART:${c.startS}`, `DURATION:PT${c.dur}M`, `RRULE:FREQ=WEEKLY;BYDAY=${c.days.join(',')}`,
      `SUMMARY:${txt.title}`, `DESCRIPTION:${txt.details.replace(/[,;]/g, m => '\\' + m)}`, `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hora de apretar ESC', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'esc-pausa.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  renderRem();

  /* ---------- Aparición al scrollear ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((n, i) => { n.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(n); });

  renderHoy();
})();
