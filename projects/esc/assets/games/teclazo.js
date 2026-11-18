/* Recreo — Teclazo (adaptación de ZType para QuartzSales)
 * Caen palabras del mundo del retail y de QuartzSales. Tipeá cada una para
 * despejarla antes de que llegue a tu góndola. Oleadas cada vez más rápidas;
 * con tres impactos se termina. Queda el mejor puntaje del día.
 */
(function (root) {
  const R = (root.Recreo = root.Recreo || {});
  R.games = R.games || {};

  const WORDS = [
    'stock', 'precio', 'oferta', 'visita', 'ruteo', 'quiebre', 'góndola', 'cliente', 'pedido', 'facing', 'frente', 'surtido', 'cadena', 'canal', 'ticket', 'foto', 'tablero', 'reporte', 'mate', 'café', 'pallet', 'depósito', 'faltante', 'promotor', 'repositor', 'cabecera', 'punta', 'encuesta', 'sucursal', 'mayorista', 'kiosco', 'sku', 'kpi', 'share', 'apollo', 'psmob', 'aifred', 'quartz', 'rebel', 'sairon', 'planograma', 'exhibición', 'auditoría', 'vencimiento', 'autoservicio', 'merchandising', 'reconocimiento', 'cumplimiento', 'reposición', 'trade marketing', 'checklist', 'dashboard', 'categoría', 'distribuidor', 'heladera', 'exhibidor', 'promoción', 'etiqueta', 'precio sugerido', 'punto de venta'
  ];

  function mount(ctx) {
    const { el } = ctx;
    el.innerHTML = `<div class="teclazo">
      <canvas aria-hidden="true"></canvas>
      <input class="tz-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Tipeá las palabras que caen">
      <div class="tz-overlay">
        <div class="tz-q">${R.qSvg({ id: 'tzq-intro', faceFill: '#ece7ff' })}</div>
        <p class="tz-kicker">Teclazo</p>
        <h3>Despejá la góndola tipeando</h3>
        <p>Escribí cada palabra antes de que llegue abajo. Los acentos no hacen falta.</p>
        <button class="btn btn-primary tz-start">Empezar <span aria-hidden="true">→</span></button>
      </div>
    </div>`;
    const wrap = el.querySelector('.teclazo'), canvas = wrap.querySelector('canvas'), cx = canvas.getContext('2d');
    const input = wrap.querySelector('.tz-input'), overlay = wrap.querySelector('.tz-overlay');
    let W = 0, Hh = 0, dpr = 1, raf = 0, last = 0, running = false;
    let words = [], shots = [], sparks = [], target = null, score = 0, lives = 3, wave = 0, toSpawn = 0, spawnT = 0, combo = 0, flash = 0;
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.4 + 0.3, v: Math.random() * 8 + 4 }));

    function size() {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; Hh = r.height;
      canvas.width = W * dpr; canvas.height = Hh * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(() => { size(); if (!running) draw(0); }); ro.observe(wrap); size();
    // La nave es la Q de QuartzSales
    const qImg = new Image();
    qImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(R.qSvg({ id: 'tzq', faceFill: '#ece7ff' }));
    qImg.onload = () => { if (!running) draw(0); };
    const QW = 64, QH = QW * R.qSize.H / R.qSize.W;

    const shipX = () => W / 2, shipY = () => Hh - 50;
    const hud = () => ctx.setHud(`${R.fmtScore(score)} · ${'●'.repeat(lives)}${'○'.repeat(3 - lives)} · oleada ${wave}`);

    function nextWave() {
      wave++; toSpawn = 4 + wave * 2; spawnT = 0.6;
      ctx.toast(`Oleada ${wave}`);
    }
    function spawn() {
      const maxLen = 5 + wave * 2;
      const pool = WORDS.filter(w => w.length <= maxLen && !words.some(o => R.norm(o.text)[0] === R.norm(w)[0]));
      const text = (pool.length ? pool : WORDS)[Math.floor(Math.random() * (pool.length || WORDS.length))];
      cx.font = '600 16px Poppins, system-ui, sans-serif';
      const w = cx.measureText(text).width;
      words.push({ text, key: R.norm(text).replace(/\s/g, '·'), x: 30 + w / 2 + Math.random() * Math.max(10, W - 60 - w), y: -10, w, typed: 0, speed: 20 + wave * 6 + Math.random() * 10, hit: 0 });
    }
    function start() {
      ctx.started();
      words = []; shots = []; sparks = []; target = null; score = 0; lives = 3; wave = 0; combo = 0;
      overlay.hidden = true; running = true; nextWave(); hud();
      input.value = ''; input.focus({ preventScroll: true });
      last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function boom(x, y, color, n = 16) {
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 140; sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.6, color }); }
    }
    function type(ch) {
      if (!running) return;
      const k = R.norm(ch) === ' ' ? '·' : R.norm(ch);
      if (!/^[a-z0-9·]$/.test(k)) return;
      if (!target) {
        const cands = words.filter(w => w.key[0] === k).sort((a, b) => b.y - a.y);
        if (!cands.length) { combo = 0; flash = 0.15; return; }
        target = cands[0];
      }
      if (target.key[target.typed] === k) {
        target.typed++; target.hit = 0.12;
        shots.push({ x: target.x, y: target.y, t: 0.12 });
        score += 1;
        if (target.typed >= target.key.length) {
          combo++;
          score += target.key.length * 5 + Math.min(combo, 10) * 2;
          boom(target.x, target.y, '#9fd0fa', 22);
          words = words.filter(w => w !== target); target = null;
        }
      } else { combo = 0; flash = 0.15; }
      hud();
    }
    function over() {
      running = false; cancelAnimationFrame(raf);
      boom(shipX(), shipY(), '#7025E0', 40);
      draw(0);
      ctx.gameOver(score);
    }
    function loop(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (running) {
        spawnT -= dt;
        if (toSpawn > 0 && spawnT <= 0) { spawn(); toSpawn--; spawnT = Math.max(0.55, 1.6 - wave * 0.12); }
        if (!toSpawn && !words.length) nextWave();
        const sx = shipX(), sy = shipY();
        for (const w of words) {
          const dx = sx - w.x, dy = sy - w.y, d = Math.hypot(dx, dy) || 1;
          w.x += (dx / d) * w.speed * dt * 0.35; w.y += w.speed * dt; w.hit = Math.max(0, w.hit - dt);
        }
        const landed = words.filter(w => w.y > sy - 34);
        if (landed.length) {
          landed.forEach(w => { boom(w.x, w.y, '#b98bff', 18); if (w === target) target = null; });
          words = words.filter(w => !landed.includes(w));
          lives -= landed.length; combo = 0; flash = 0.35; hud();
          if (lives <= 0) { lives = 0; hud(); over(); return; }
        }
      }
      draw(dt);
      raf = requestAnimationFrame(loop);
    }
    function draw(dt) {
      cx.clearRect(0, 0, W, Hh);
      const bg = cx.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#130D5D'); bg.addColorStop(1, '#2a1785');
      cx.fillStyle = bg; cx.fillRect(0, 0, W, Hh);
      if (flash > 0) { cx.fillStyle = `rgba(112,37,224,${flash * 0.6})`; cx.fillRect(0, 0, W, Hh); flash -= dt; }
      cx.fillStyle = '#fff';
      for (const s of stars) { s.y = (s.y + (s.v * dt) / Hh) % 1; cx.globalAlpha = 0.25 + s.s / 3; cx.fillRect(s.x * W, s.y * Hh, s.s, s.s); }
      cx.globalAlpha = 1;
      // góndola / nave
      const sx = shipX(), sy = shipY();
      if (qImg.complete && qImg.naturalWidth) {
        cx.drawImage(qImg, sx - QW / 2, sy - QH / 2 - 6, QW, QH);
      }
      cx.strokeStyle = 'rgba(255,255,255,.12)'; cx.setLineDash([4, 6]); cx.beginPath(); cx.moveTo(0, sy - 34); cx.lineTo(W, sy - 34); cx.stroke(); cx.setLineDash([]);
      // disparos
      shots = shots.filter(s => (s.t -= dt) > 0);
      for (const s of shots) { cx.strokeStyle = `rgba(159,208,250,${s.t * 8})`; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(sx, sy - QH / 2); cx.lineTo(s.x, s.y); cx.stroke(); }
      // palabras
      cx.font = '600 16px Poppins, system-ui, sans-serif'; cx.textBaseline = 'middle';
      for (const w of words) {
        const jx = w.hit ? (Math.random() - 0.5) * 3 : 0, x0 = w.x - w.w / 2 + jx;
        const isT = w === target;
        cx.fillStyle = isT ? 'rgba(255,255,255,.96)' : 'rgba(255,255,255,.14)';
        roundRect(x0 - 9, w.y - 14, w.w + 18, 28, 9); cx.fill();
        // letras tipeadas en coral, el resto en el color de base
        let x = x0;
        [...w.text].forEach((ch, i) => {
          const done = i < typedChars(w);
          cx.fillStyle = done ? '#3C9FF1' : isT ? '#130D5D' : '#fff';
          cx.fillText(ch, x, w.y + 1); x += cx.measureText(ch).width;
        });
      }
      sparks = sparks.filter(p => (p.t -= dt) > 0);
      for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; cx.globalAlpha = Math.min(1, p.t * 2); cx.fillStyle = p.color; cx.fillRect(p.x, p.y, 3, 3); }
      cx.globalAlpha = 1;
    }
    // cuántos caracteres visibles cubre lo tipeado (los espacios cuentan como "·")
    const typedChars = w => w.typed;
    function roundRect(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

    input.addEventListener('input', () => { const v = input.value; input.value = ''; [...v].forEach(type); });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { target = null; } });
    wrap.addEventListener('pointerdown', () => { if (running) setTimeout(() => input.focus({ preventScroll: true }), 0); });
    overlay.querySelector('.tz-start').addEventListener('click', start);

    ctx.setActions([{ label: 'Reiniciar', icon: 'restart', onClick: start }]);
    ctx.setHud('Listo para arrancar');
    draw(0);
    return { destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); }, restart: start };
  }

  R.games.teclazo = {
    card: '#2c2366', id: 'teclazo', name: 'Teclazo', kind: 'score', color: '#130D5D', c1: '#130D5D', c2: '#3d1fa6', light: '#9fd0fa', tag: 'Tipeá rápido',
    help: ['Tipeá las palabras que caen <b>antes de que lleguen abajo</b>.', 'La primera letra elige la palabra; terminala para despejarla. Escape suelta la palabra elegida.', 'Tres impactos y se termina. Para el ranking queda <b>tu mejor puntaje del día</b>.'],
    mount
  };
})(typeof window !== 'undefined' ? window : globalThis);
