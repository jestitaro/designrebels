/* Recreo — Pasala y que no vuelva
 * El cliente tira el pedido por encima de la red y el equipo de QuartzSales
 * se lo va pasando por áreas. El pedido siempre vuela hacia la persona que
 * sigue (marcada con un anillo y "¡Tocá!"): tocala antes de que llegue y lo
 * agarra. Si nadie la agarra, el pedido "vuelve con cambios" y se cae el
 * equipo. Cada pedido avanza un día en la red.
 */
(function (root) {
  const R = (root.Recreo = root.Recreo || {});
  R.games = R.games || {};

  /* Organigrama: para sumar gente o áreas, alcanza con editar esta lista. */
  const AREAS = [
    { area: 'Dirección', color: '#130D5D', people: [['Pablo', 'Visionary'], ['Nicolás', 'Integrator']] },
    { area: 'Ventas', color: '#3C9FF1', people: [['Agustín', 'Chief of Sales'], ['Julieta', 'Account Manager']] },
    { area: 'Producto', color: '#7025E0', people: [['Sebastián', 'CPO']] },
    { area: 'Diseño', color: '#ff6b57', people: [['Jés', 'Design Rebel']] },
    { area: 'Desarrollo', color: '#17b897', people: [['Matías', 'Fullstack'], ['Jonathan', 'Fullstack'], ['Francisco', 'Angular / Ionic'], ['David', 'Android'], ['Sergio', 'iOS']] },
    { area: 'BI', color: '#f5a524', people: [['Javier', 'BI Tech Lead'], ['Loreana', 'BI Analyst'], ['Valeria', 'BI Analyst']] },
    { area: 'Infra', color: '#475569', people: [['Adolfo', 'IT & DevOps']] },
    { area: 'Soporte', color: '#ec4899', people: [['Mayra', 'Client Support Lead']] },
    { area: 'Proyectos', color: '#463DE1', people: [['Eugenio', 'Líder de Proyectos'], ['Lucrecia', 'Líder de Proyectos'], ['Mayra', 'Líder de Proyectos'], ['Loreana', 'Líder de Proyectos']] },
    { area: 'RR. HH.', color: '#0ea5b7', people: [['Mariana', 'Admin & HR'], ['Nicolás', 'Administration Manager']] }
  ];
  const DAYS = ['LUN.', 'MAR.', 'MIÉ.', 'JUE.', 'VIE.', 'SÁB.', 'DOM.'];
  const SKIN = ['#f2b48a', '#d9925f', '#a86a43', '#f6c7a1', '#c98256'];
  const HAIR = ['#1f1a17', '#5a3825', '#a0522d', '#e7c35a', '#2b2b3a', '#8b5a3c'];
  const PANTS = ['#130D5D', '#2b2b3a', '#3d3a5c', '#5a4a3a'];
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  function mount(ctx) {
    const { el } = ctx;
    el.innerHTML = `<div class="pasala">
      <canvas aria-hidden="true"></canvas>
      <div class="tz-overlay ps-overlay">
        <p class="tz-kicker">Pasala y que no vuelva</p>
        <h3>Que el pedido no vuelva con cambios</h3>
        <p>El pedido vuela hacia una persona del equipo: la vas a ver con un anillo y un cartel de "¡Tocá!". Tocala antes de que le llegue y se lo pasa a la siguiente. Con teclado: el número que muestra el cartel, o la barra espaciadora.</p>
        <button class="btn btn-primary ps-start">Empezar <span aria-hidden="true">→</span></button>
      </div>
      <p class="sr-only" aria-live="assertive" id="psLive"></p>
    </div>`;
    const wrap = el.querySelector('.pasala'), canvas = wrap.querySelector('canvas'), cx = canvas.getContext('2d');
    const overlay = wrap.querySelector('.ps-overlay'), live = wrap.querySelector('#psLive');
    let W = 0, H = 0, raf = 0, last = 0, running = false, now = 0;
    let team = [], slots = [], seq = [], idx = 0, ball = null, client = null, phase = 'idle', lives = 3, score = 0, day = 0, dayShown = 0, T = 1.45, fallT = 0, banner = null, floaters = [];

    function size() {
      const r = wrap.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(() => { size(); if (!running) draw(); }); ro.observe(wrap); size();

    const SLOT_POS = [[0.16, 0.66], [0.39, 0.84], [0.62, 0.64], [0.85, 0.82]];
    const pos = i => ({ x: SLOT_POS[i][0] * W, y: SLOT_POS[i][1] * H });
    const netY = x => H * (0.33 + 0.1 * (x / W));
    const unit = () => Math.min(W / 760, H / 520);

    function makePerson(name, role, area, color) {
      const h = hash(name + role);
      return { name, role, area, color, skin: SKIN[h % SKIN.length], hair: HAIR[(h >>> 3) % HAIR.length], pants: PANTS[(h >>> 5) % PANTS.length], long: (h >>> 7) % 3 === 0, hitT: -9, wrongT: -9, cheerT: -9, phase: Math.random() * 6 };
    }
    function newTeam() {
      // 4 áreas distintas y sin repetir persona (hay gente que está en dos áreas)
      team = [];
      for (const a of AREAS.slice().sort(() => Math.random() - 0.5)) {
        const free = a.people.filter(([n]) => !team.some(t => t.name === n));
        if (!free.length) continue;
        const [n, r] = free[Math.floor(Math.random() * free.length)];
        team.push(makePerson(n, r, a.area, a.color));
        if (team.length === 4) break;
      }
      slots = team.slice();
    }
    function newPedido() {
      const len = Math.min(4, 2 + Math.floor(score / 120));
      seq = [];
      while (seq.length < len) { const a = team[Math.floor(Math.random() * team.length)].area; if (seq[seq.length - 1] !== a) seq.push(a); }
      idx = 0;
      const from = { x: client.x - 10 * unit(), y: client.y - 70 * unit() };
      phase = 'play';
      sendTo(from);
      client.throwT = now;
    }
    const head = i => { const p = pos(i); return { x: p.x, y: p.y - 125 * unit() }; };
    // El pedido vuela siempre hacia quien sigue: no hay que adivinar, solo tocarla a tiempo
    function sendTo(from) {
      const t = slots.findIndex(p => p.area === seq[idx]);
      launch(from, head(t), T, 'need');
      ball.target = t; ball.ready = false;
      announce(`Va para ${slots[t].name}, de ${seq[idx]}. Tecla ${t + 1}.`);
    }
    function launch(from, to, dur, kind) {
      ball = { x0: from.x, y0: from.y, x1: to.x, y1: to.y, t0: now, dur, kind, peak: Math.max(90, H * 0.32) * unit() * (kind === 'return' ? 1.2 : 1) };
    }
    function ballPos(b, t = now) {
      const u = Math.min(1, (t - b.t0) / b.dur);
      return { u, x: b.x0 + (b.x1 - b.x0) * u, y: b.y0 + (b.y1 - b.y0) * u - b.peak * 4 * u * (1 - u), gy: b.y0 + (b.y1 - b.y0) * u };
    }
    function announce(t) { live.textContent = t; }
    function hud() { ctx.setHud(`${R.fmtScore(score)} · ${'●'.repeat(lives)}${'○'.repeat(3 - lives)} · semana ${Math.floor(day / 5) + 1}`); }

    function tap(i) {
      if (!running || phase !== 'play' || !ball || ball.kind !== 'need' || ball.ready) return;
      const p = slots[i]; if (!p) return;
      if (i === ball.target) { ball.ready = true; ball.readyU = ballPos(ball).u; p.readyT = now; }
      else p.wrongT = now; // tocar a otra persona no penaliza: solo sacude un poco
    }
    function caught() {
      const i = ball.target, p = slots[i], at = head(i);
      p.hitT = now;
      const justo = ball.readyU > 0.6;
      score += 5 + (justo ? 5 : 0); hud();
      if (justo) floaters.push({ x: at.x, y: at.y - 20 * unit(), t: now, text: '¡Justo! +10' });
      idx++;
      if (idx >= seq.length) launch(at, { x: client.x, y: client.y - 60 * unit() }, 0.65, 'return');
      else sendTo(at);
    }
    function drop(msg) {
      const b = ballPos(ball);
      ball = { x0: b.x, y0: b.y, x1: b.x + 20, y1: Math.max(b.gy, H * 0.7), t0: now, dur: 0.35, kind: 'drop', peak: 0 };
      phase = 'fall'; fallT = now; lives--; hud();
      banner = { text: 'Volvió con cambios', sub: msg, t: now };
      announce(`Volvió con cambios. ${msg}`);
      setTimeout(() => {
        if (!running) return;
        if (lives <= 0) { over(); return; }
        nextDay();
      }, 1300);
    }
    function deliver() {
      phase = 'cheer';
      const bonus = seq.length * 15 + Math.round(Math.max(0, 2.2 - T) * 20);
      score += bonus; hud();
      team.forEach(p => { p.cheerT = now; });
      client.happyT = now;
      banner = { text: '¡Entregado!', sub: `+${bonus} pts`, t: now };
      announce(`Entregado. Más ${bonus} puntos.`);
      T = Math.max(0.7, T - 0.05);
      setTimeout(() => { if (running) nextDay(); }, 700);
    }
    function nextDay() {
      day++;
      if (day % 5 === 0) { newTeam(); ctx.toast(`Semana ${day / 5 + 1}: cambia el equipo`); }
      ball = null; banner = null; phase = 'wait';
      setTimeout(() => { if (running) newPedido(); }, 300);
    }
    function start() {
      ctx.started();
      cancelAnimationFrame(raf);
      overlay.hidden = true; running = true; lives = 3; score = 0; day = 0; dayShown = 0; T = 1.45; banner = null; floaters = [];
      client = { x: W * 0.62, y: H * 0.27, throwT: -9, happyT: -9 };
      newTeam(); hud();
      now = performance.now() / 1000; last = now;
      setTimeout(() => { if (running) newPedido(); }, 500);
      raf = requestAnimationFrame(loop);
      wrap.focus({ preventScroll: true });
    }
    function over() {
      running = false; cancelAnimationFrame(raf); draw();
      ctx.gameOver(score);
    }
    function loop(t) {
      now = t / 1000;
      if (client) { client.x = W * 0.62; client.y = H * 0.27; }
      if (ball && running) {
        const { u } = ballPos(ball);
        if (u >= 1) {
          if (ball.kind === 'need' && phase === 'play') { if (ball.ready) caught(); else drop(`Nadie agarró el pedido de ${seq[idx]}.`); }
          else if (ball.kind === 'return' && phase === 'play') deliver();
        }
      }
      dayShown += (day - dayShown) * 0.08;
      draw();
      raf = requestAnimationFrame(loop);
    }

    /* ---------- Dibujo ---------- */
    function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
    function drawNet() {
      const top = x => netY(x) - 70 * unit(), bot = x => netY(x) + 8 * unit();
      // malla
      cx.fillStyle = 'rgba(255,255,255,.55)';
      cx.beginPath(); cx.moveTo(0, top(0)); cx.lineTo(W, top(W)); cx.lineTo(W, bot(W)); cx.lineTo(0, bot(0)); cx.closePath(); cx.fill();
      cx.save(); cx.clip();
      cx.strokeStyle = 'rgba(19,13,93,.08)'; cx.lineWidth = 1;
      for (let x = 0; x < W; x += 9) { cx.beginPath(); cx.moveTo(x, top(x)); cx.lineTo(x, bot(x)); cx.stroke(); }
      for (let k = 0; k <= 8; k++) { cx.beginPath(); cx.moveTo(0, top(0) + (bot(0) - top(0)) * k / 8); cx.lineTo(W, top(W) + (bot(W) - top(W)) * k / 8); cx.stroke(); }
      // días: el actual queda en el centro y la red se desliza cuando pasa un día
      const span = 150 * unit(), centerX = W * 0.5;
      cx.font = `600 ${Math.round(34 * unit())}px Poppins, system-ui, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      for (let d = Math.floor(dayShown) - 4; d <= Math.floor(dayShown) + 4; d++) {
        if (d < 0) continue;
        const x = centerX + (d - dayShown) * span, wd = d % 7;
        cx.save(); cx.translate(x, (top(x) + bot(x)) / 2); cx.rotate(Math.atan2(0.1 * H, W));
        cx.fillStyle = wd >= 5 ? 'rgba(60,159,241,.75)' : d === day ? 'rgba(112,37,224,.9)' : 'rgba(112,37,224,.35)';
        cx.fillText(DAYS[wd], 0, 2);
        cx.restore();
      }
      cx.restore();
      cx.strokeStyle = '#fff'; cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(0, top(0)); cx.lineTo(W, top(W)); cx.stroke();
      // postes
      for (let k = 1; k < 4; k++) {
        const x = (W * k) / 4 + ((dayShown * 150 * unit()) % (W / 4)) * -1 + W / 8;
        const xx = ((x % W) + W) % W;
        cx.fillStyle = 'rgba(19,13,93,.18)'; cx.beginPath(); cx.ellipse(xx, bot(xx) + 26 * unit(), 6, 3, 0, 0, 7); cx.fill();
        cx.fillStyle = '#130D5D'; rr(xx - 3, top(xx) - 6, 6, bot(xx) - top(xx) + 32 * unit(), 3); cx.fill();
      }
    }
    function person(p, x, y, opts = {}) {
      const s = unit() * (opts.scale || 1.25);
      const tt = now - p.phase;
      let jump = 0, arms = 0, rot = 0, lie = 0;
      const sinceHit = now - p.hitT, sinceCheer = now - (p.cheerT || -9), sinceWrong = now - (p.wrongT || -9);
      if (sinceHit < 0.45) { jump = Math.sin((sinceHit / 0.45) * Math.PI) * 30; arms = 1; }
      else if (opts.ready) arms = 1;
      else if (sinceCheer < 0.9) { jump = Math.abs(Math.sin(sinceCheer * 9)) * 12; arms = 1; }
      if (phase === 'fall' && opts.team) { lie = Math.min(1, (now - fallT) / 0.35); }
      if (sinceWrong < 0.3) rot = Math.sin(sinceWrong * 40) * 0.08;
      const bob = Math.sin(tt * 3) * 1.5;
      // sombra
      cx.fillStyle = 'rgba(19,13,93,.16)'; cx.beginPath(); cx.ellipse(x, y, 30 * s * (1 + lie * 0.6), 11 * s, 0, 0, 7); cx.fill();
      cx.save(); cx.translate(x, y - jump * s); cx.rotate(rot + lie * (p.lean || (p.lean = Math.random() < 0.5 ? -1 : 1)) * 1.45);
      cx.translate(0, lie * 6 * s);
      // piernas
      cx.strokeStyle = p.pants; cx.lineCap = 'round'; cx.lineWidth = 9 * s;
      const step = Math.sin(tt * 3) * 2 * s;
      cx.beginPath(); cx.moveTo(-6 * s, -40 * s); cx.lineTo(-8 * s - step, -2 * s); cx.moveTo(6 * s, -40 * s); cx.lineTo(8 * s + step, -2 * s); cx.stroke();
      // torso
      cx.fillStyle = p.color; rr(-15 * s, (-82 + bob) * s, 30 * s, 46 * s, 9 * s); cx.fill();
      if (opts.tie) { cx.fillStyle = '#130D5D'; cx.fillRect(-1.5 * s, (-78 + bob) * s, 3 * s, 24 * s); }
      // brazos
      cx.strokeStyle = p.color; cx.lineWidth = 8 * s;
      const ay = (-74 + bob) * s;
      const hands = arms ? [[-20, -112], [20, -112]] : opts.throwing ? [[-20, -60], [22, -110]] : [[-24, -50 + Math.sin(tt * 3) * 2], [24, -50 - Math.sin(tt * 3) * 2]];
      cx.beginPath(); cx.moveTo(-13 * s, ay); cx.lineTo(hands[0][0] * s, hands[0][1] * s); cx.moveTo(13 * s, ay); cx.lineTo(hands[1][0] * s, hands[1][1] * s); cx.stroke();
      cx.fillStyle = p.skin; hands.forEach(([hx, hy]) => { cx.beginPath(); cx.arc(hx * s, hy * s, 5 * s, 0, 7); cx.fill(); });
      // cabeza
      cx.fillStyle = p.skin; cx.beginPath(); cx.arc(0, (-94 + bob) * s, 11 * s, 0, 7); cx.fill();
      cx.fillStyle = p.hair; cx.beginPath(); cx.arc(0, (-97 + bob) * s, 11.5 * s, Math.PI * 1.02, Math.PI * 1.98); cx.fill();
      if (p.long) { rr(-12 * s, (-100 + bob) * s, 5 * s, 22 * s, 3 * s); cx.fill(); rr(7 * s, (-100 + bob) * s, 5 * s, 22 * s, 3 * s); cx.fill(); }
      cx.restore();
    }
    function label(p, i, x, y, hot) {
      const s = unit();
      cx.font = `700 ${Math.round(13 * s)}px Poppins, system-ui, sans-serif`; cx.textAlign = 'left'; cx.textBaseline = 'middle';
      const t1 = `${i + 1}  ${p.name}`, t2 = p.area;
      const w1 = cx.measureText(t1).width; cx.font = `600 ${Math.round(12 * s)}px Poppins, system-ui, sans-serif`; const w2 = cx.measureText(t2).width;
      const w = Math.max(w1, w2) + 22 * s, h = 40 * s, lx = x - w / 2, ly = y + 18 * s;
      cx.fillStyle = '#fff'; rr(lx, ly, w, h, 10 * s); cx.fill();
      cx.strokeStyle = hot ? p.color : 'rgba(19,13,93,.1)'; cx.lineWidth = hot ? 2.5 : 1; cx.stroke();
      cx.fillStyle = p.color; rr(lx, ly, 5 * s, h, 3 * s); cx.fill();
      cx.fillStyle = '#130D5D'; cx.font = `700 ${Math.round(13 * s)}px Poppins, system-ui, sans-serif`; cx.fillText(t1, lx + 12 * s, ly + 13 * s);
      cx.fillStyle = '#4e4a78'; cx.font = `600 ${Math.round(12 * s)}px Poppins, system-ui, sans-serif`; cx.fillText(t2, lx + 12 * s, ly + 28 * s);
    }
    function envelope(x, y, a, sc = 1) {
      const s = unit() * sc;
      cx.save(); cx.translate(x, y); cx.rotate(a);
      cx.fillStyle = '#fff'; rr(-22 * s, -15 * s, 44 * s, 30 * s, 4 * s); cx.fill();
      cx.strokeStyle = '#3C9FF1'; cx.lineWidth = 2 * s; cx.beginPath(); cx.moveTo(-20 * s, -12 * s); cx.lineTo(0, 3 * s); cx.lineTo(20 * s, -12 * s); cx.stroke();
      cx.strokeStyle = 'rgba(19,13,93,.12)'; cx.lineWidth = 1; rr(-22 * s, -15 * s, 44 * s, 30 * s, 4 * s); cx.stroke();
      cx.restore();
    }
    function pedidoCard() {
      if (!seq.length) return;
      const s = unit();
      cx.font = `600 ${Math.round(12 * s)}px Poppins, system-ui, sans-serif`;
      // el ancho se mide con la versión más ancha del chip (negrita y con ✓) para que el texto nunca se salga
      cx.font = `700 ${Math.round(12 * s)}px Poppins, system-ui, sans-serif`;
      const chips = seq.map(a => ({ a, w: cx.measureText(`✓ ${a}`).width + 20 * s }));
      const w = Math.max(150 * s, chips.reduce((m, c) => m + c.w + 6 * s, 0) + 22 * s), h = 58 * s, x = 14 * s, y = 14 * s;
      cx.fillStyle = 'rgba(255,255,255,.95)'; rr(x, y, w, h, 14 * s); cx.fill();
      cx.fillStyle = '#4e4a78'; cx.textAlign = 'left'; cx.textBaseline = 'middle'; cx.font = `700 ${Math.round(10.5 * s)}px Poppins, system-ui, sans-serif`;
      cx.fillText('PEDIDO DEL CLIENTE', x + 12 * s, y + 15 * s);
      let cxp = x + 11 * s;
      chips.forEach((c, i) => {
        const done = i < idx, cur = i === idx && phase === 'play';
        const col = (AREAS.find(A => A.area === c.a) || {}).color || '#5932E0';
        cx.fillStyle = done ? 'rgba(19,13,93,.08)' : cur ? col : '#fff';
        rr(cxp, y + 26 * s, c.w, 22 * s, 11 * s); cx.fill();
        if (!cur) { cx.strokeStyle = col; cx.lineWidth = 1.5; cx.stroke(); }
        cx.fillStyle = cur ? '#fff' : done ? 'rgba(19,13,93,.4)' : '#130D5D';
        cx.font = `${cur ? 700 : 600} ${Math.round(12 * s)}px Poppins, system-ui, sans-serif`;
        cx.textAlign = 'center'; cx.fillText(done ? `✓ ${c.a}` : c.a, cxp + c.w / 2, y + 37.5 * s); cx.textAlign = 'left';
        cxp += c.w + 6 * s;
      });
    }
    function draw() {
      if (!W) return;
      const s = unit();
      const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#efeafd'); g.addColorStop(1, '#ddd3fb');
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      // líneas de cancha
      cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = 3;
      cx.beginPath(); cx.moveTo(0, H * 0.96); cx.lineTo(W, H * 0.96 + 0.1 * H); cx.stroke();
      cx.beginPath(); cx.moveTo(0, H * 0.12); cx.lineTo(W, H * 0.22); cx.stroke();
      // cliente (detrás de la red)
      if (client) {
        const cp = { name: 'Cliente', area: 'Cliente', color: '#ffffff', skin: '#f2b48a', hair: '#1f1a17', pants: '#130D5D', phase: 1, hitT: -9, cheerT: client.happyT, wrongT: -9 };
        person(cp, client.x, client.y, { tie: true, throwing: now - client.throwT < 0.4, scale: 1 });
        cx.font = `700 ${Math.round(13 * s)}px Poppins, system-ui, sans-serif`; cx.textAlign = 'left'; cx.fillStyle = '#130D5D';
        cx.fillText('CLIENTE', client.x + 26 * s, client.y - 80 * s);
      }
      drawNet();
      // pelota detrás de la red si está volviendo al cliente
      const b = ball && ballPos(ball);
      const drawBall = () => {
        if (!b) return;
        const hgt = b.gy - b.y;
        cx.fillStyle = `rgba(19,13,93,${0.18 - Math.min(0.12, hgt / 2000)})`;
        cx.beginPath(); cx.ellipse(b.x, b.gy, Math.max(8, 22 - hgt / 25) * s, Math.max(3, 8 - hgt / 70) * s, 0, 0, 7); cx.fill();
        envelope(b.x, b.y, ball.kind === 'drop' ? 0.3 : Math.sin(now * 6) * 0.25);
      };
      if (b && ball.kind === 'return' && b.u > 0.5) drawBall();
      // equipo
      const tgt = ball && ball.kind === 'need' && phase === 'play' ? ball.target : -1;
      if (tgt >= 0) { // anillo en el piso de quien recibe + trayectoria punteada
        const tp = pos(tgt), pulse = 1 + Math.sin(now * 8) * 0.08, col = slots[tgt].color;
        cx.strokeStyle = col; cx.lineWidth = 4; cx.globalAlpha = ball.ready ? 0.5 : 0.95;
        cx.beginPath(); cx.ellipse(tp.x, tp.y, 46 * s * pulse, 17 * s * pulse, 0, 0, 7); cx.stroke();
        cx.globalAlpha = 1;
        const b0 = ballPos(ball), hd = head(tgt);
        cx.setLineDash([4, 6]); cx.strokeStyle = 'rgba(19,13,93,.25)'; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(b0.x, b0.y);
        for (let k = 1; k <= 12; k++) { const q = ballPos(ball, now + (ball.dur * (1 - b0.u) * k) / 12); cx.lineTo(q.x, q.y); }
        cx.lineTo(hd.x, hd.y); cx.stroke(); cx.setLineDash([]);
      }
      slots.map((p, i) => ({ p, i, ...pos(i) })).sort((a, c) => a.y - c.y).forEach(({ p, i, x, y }) => { person(p, x, y, { team: true, ready: i === tgt && ball.ready }); label(p, i, x, y, i === tgt); });
      if (tgt >= 0) { // globito "¡Tocá!" arriba de la cabeza
        const hd = head(tgt), ok = ball.ready, txt = ok ? '¡Lista!' : `¡Tocá! (${tgt + 1})`;
        cx.font = `700 ${Math.round(15 * s)}px Poppins, system-ui, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        const w = cx.measureText(txt).width + 24 * s, by = hd.y - 34 * s + Math.sin(now * 6) * 3;
        cx.fillStyle = ok ? '#17b897' : '#130D5D'; rr(hd.x - w / 2, by - 15 * s, w, 30 * s, 15 * s); cx.fill();
        cx.beginPath(); cx.moveTo(hd.x - 6 * s, by + 14 * s); cx.lineTo(hd.x + 6 * s, by + 14 * s); cx.lineTo(hd.x, by + 22 * s); cx.fill();
        cx.fillStyle = '#fff'; cx.fillText(txt, hd.x, by + 1);
      }
      floaters = floaters.filter(f => now - f.t < 0.9);
      floaters.forEach(f => { const k = (now - f.t) / 0.9; cx.globalAlpha = 1 - k; cx.fillStyle = '#5932E0'; cx.font = `700 ${Math.round(16 * s)}px Poppins, system-ui, sans-serif`; cx.textAlign = 'center'; cx.fillText(f.text, f.x, f.y - k * 30 * s); cx.globalAlpha = 1; });
      if (b && !(ball.kind === 'return' && b.u > 0.5)) drawBall();
      pedidoCard();
      if (banner) {
        const k = Math.min(1, (now - banner.t) / 0.25);
        cx.globalAlpha = k;
        cx.font = `700 ${Math.round(30 * s)}px Poppins, system-ui, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        const w = Math.max(cx.measureText(banner.text).width, 160 * s) + 44 * s;
        cx.fillStyle = banner.text.startsWith('¡') ? '#5932E0' : '#130D5D'; rr(W / 2 - w / 2, H * 0.47 - 34 * s, w, 68 * s, 18 * s); cx.fill();
        cx.fillStyle = '#fff'; cx.fillText(banner.text, W / 2, H * 0.47 - 8 * s);
        cx.font = `500 ${Math.round(12.5 * s)}px Poppins, system-ui, sans-serif`; cx.fillText(banner.sub, W / 2, H * 0.47 + 18 * s);
        cx.globalAlpha = 1;
      }
    }

    canvas.addEventListener('pointerdown', e => {
      if (!running) return;
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = -1, bd = Infinity;
      slots.forEach((_, i) => { const p = pos(i), d = Math.hypot(x - p.x, y - (p.y - 40 * unit())); if (d < bd) { bd = d; best = i; } });
      if (bd < 130 * unit()) tap(best);
    });
    wrap.tabIndex = 0;
    wrap.addEventListener('keydown', e => {
      if (/^[1-4]$/.test(e.key)) { e.preventDefault(); tap(+e.key - 1); }
      else if (e.key === ' ' && ball && ball.kind === 'need') { e.preventDefault(); tap(ball.target); }
    });
    overlay.querySelector('.ps-start').addEventListener('click', start);

    wrap.__state = () => ({ seq, idx, phase, kind: ball && ball.kind, target: ball && ball.target, ready: ball && ball.ready, slots: slots.map(p => p.area), lives, score }); // para tests
    ctx.setActions([{ label: 'Reiniciar', onClick: start }]);
    ctx.setHud('Listo para arrancar');
    draw();
    return { destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); }, restart: start };
  }

  R.games.pasala = {
    card: '#f5b82e', id: 'pasala', name: 'Pasala y que no vuelva', kind: 'score', color: '#f5b82e', c1: '#f7c948', c2: '#f0a51f', ink: true, light: '#f7c948', tag: 'Sin vueltas',
    help: ['El pedido vuela hacia alguien del equipo: <b>la persona con el anillo y el cartel "¡Tocá!"</b>.', '<b>Tocala antes de que le llegue</b> y se lo pasa a la siguiente área. Si la tocás sobre la hora, sumás "¡Justo!". Con teclado: el número del cartel o la barra espaciadora.', 'Cuando pasó por todas las áreas vuelve al cliente: ¡entregado! Si nadie lo agarra, vuelve con cambios. Tres y se termina.'],
    AREAS, mount
  };
})(typeof window !== 'undefined' ? window : globalThis);
