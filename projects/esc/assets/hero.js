/* Recreo — hero.js
 * 1) Reparto del abanico de cards y hover que separa las vecinas.
 * 2) Piezas de los juegos que caen con física real (Matter.js, mismo enfoque
 *    que Talent Lab: cada body mueve un elemento del DOM). Se pueden agarrar
 *    y revolear con el mouse.
 * 3) Cuarzo, la mascota: sigue el cursor con la mirada, parpadea, se duerme
 *    si no hay actividad y tira tips de pausa.
 * 4) Etiquetas tipo cursor con gente que ya jugó hoy.
 */
(function () {
  const R = window.Recreo;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const fan = document.getElementById('fan');

  /* ---------- 1. Abanico ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fan.classList.add('dealt');
    setTimeout(() => fan.classList.add('ready'), 900);
  }));
  function spread(on) {
    const cards = [...fan.querySelectorAll('.gcard')];
    const i = cards.indexOf(on);
    cards.forEach((c, j) => {
      c.classList.toggle('lift', j === i);
      c.style.setProperty('--spread', i < 0 || j === i ? '0px' : `${j < i ? -34 : 34}px`);
    });
  }
  // El hit-area es el <li> (no se mueve); lo que sube es el botón de adentro. Así no hay rebote al pasar por el borde inferior.
  let hovered = null;
  fan.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const c = e.target.closest('.gcard');
    if (c && c !== hovered) { hovered = c; spread(c); }
  });
  fan.addEventListener('pointerleave', () => { hovered = null; spread(null); });
  fan.addEventListener('focusin', e => spread(e.target.closest('.gcard')));
  fan.addEventListener('focusout', () => spread(null));

  // En mobile el abanico es carrusel: arranca centrado en Teclazo (la card del medio)
  if (innerWidth <= 760) requestAnimationFrame(() => {
    const mid = fan.children[Math.floor(fan.children.length / 2)];
    if (mid) fan.scrollLeft = mid.offsetLeft - (fan.clientWidth - mid.offsetWidth) / 2;
  });

  /* ---------- 2. Física ---------- */
  const shelf = document.getElementById('shelf');
  const MATE = '<svg viewBox="0 0 32 32"><path d="M8.6 12.4c0-2.1 2.6-3.3 7.4-3.3s7.4 1.2 7.4 3.3c2.2 3.2 2 9.4-1.2 12.7-2.2 2.3-10.2 2.3-12.4 0-3.2-3.3-3.4-9.5-1.2-12.7z" fill="#7025E0"/><ellipse cx="16" cy="11.2" rx="6.4" ry="1.9" fill="#4a1599"/><path d="M17.6 12 22.4 3" stroke="#b9c3d6" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const CAFE = '<svg viewBox="0 0 32 32"><path d="M5.5 12.5h17v5.8a8.5 8.5 0 0 1-17 0z" fill="#3C9FF1"/><path d="M22.5 14.4h1.6a3.6 3.6 0 0 1 0 7.2h-2.3" fill="none" stroke="#3C9FF1" stroke-width="2.4"/><path d="M10.5 3.5c-1.2 1.9 1.2 3.1 0 5M15 3.5c-1.2 1.9 1.2 3.1 0 5" stroke="#8aa3c4" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
  const PROD = '<svg viewBox="0 0 24 24"><rect x="9" y="1.5" width="6" height="3.2" rx="1.2" fill="#130D5D"/><path d="M7.5 7.5c0-1.6 1.2-2.8 2.8-2.8h3.4c1.6 0 2.8 1.2 2.8 2.8V20a2.5 2.5 0 0 1-2.5 2.5h-4A2.5 2.5 0 0 1 7.5 20z" fill="#130D5D"/><rect x="7.5" y="11" width="9" height="5" fill="#fff"/></svg>';
  const PIECES = [
    { t: 'ci', s: 58, bg: '#130D5D', c: '#fff', html: '1' }, { t: 'ci', s: 50, bg: '#130D5D', c: '#fff', html: '2' }, { t: 'ci', s: 54, bg: '#3C9FF1', c: '#fff', html: '3' },
    { t: 'sq', s: 66, bg: '#d9cffd', html: PROD }, { t: 'sq', s: 58, bg: '#bfe0fd', html: PROD },
    { t: 'sq', s: 64, bg: '#fff', html: MATE }, { t: 'sq', s: 58, bg: '#fff', html: CAFE }, { t: 'sq', s: 52, bg: '#efeafd', html: MATE },
    { t: 'sq', s: 56, bg: '#7025E0', c: '#fff', html: '6' }, { t: 'sq', s: 50, bg: '#efeafd', c: '#5932E0', html: '4' },
    { t: 'sq', s: 60, bg: '#fff', c: '#130D5D', html: 'Q' }, { t: 'sq', s: 52, bg: '#463DE1', c: '#fff', html: 'S' }, { t: 'sq', s: 48, bg: '#fff', c: '#5932E0', html: 'R' },
    { t: 'ci', s: 46, bg: '#9fd0fa', c: '#130D5D', html: '★' }, { t: 'sq', s: 62, bg: '#e3f0fe', html: CAFE }, { t: 'ci', s: 44, bg: '#5932E0', c: '#fff', html: '5' }
  ];
  const els = PIECES.map(p => {
    const d = document.createElement('div');
    d.className = `piece ${p.t}`;
    Object.assign(d.style, { width: `${p.s}px`, height: `${p.s}px`, background: p.bg, color: p.c || '#130D5D', fontSize: `${Math.round(p.s * 0.42)}px` });
    d.innerHTML = p.html;
    shelf.appendChild(d);
    return d;
  });
  const narrow = () => innerWidth <= 760;
  const FLOOR = 28, SIDE = 30; // el piso queda arriba del borde del contenedor para que no se corte la sombra

  function layoutStatic() {
    const W = shelf.clientWidth, Hh = shelf.clientHeight;
    els.forEach((el, i) => {
      const p = PIECES[i], left = i % 2 === 0;
      const col = Math.floor(i / 2) % 3, row = Math.floor(i / 6);
      const x = left ? SIDE + 10 + col * 62 : W - SIDE - 10 - p.s - col * 62;
      el.style.transform = `translate(${x}px, ${Hh - p.s - row * 60 - FLOOR}px) rotate(${(i % 3 - 1) * 8}deg)`;
      el.style.opacity = '1';
    });
  }

  if (!window.Matter || reduced) { if (!narrow()) layoutStatic(); }
  else {
    const { Engine, Bodies, Composite, Body, Mouse, MouseConstraint, Events } = Matter;
    let engine, walls = [], items = [], raf = 0, started = false, mc = null;
    function build() {
      const W = shelf.clientWidth, Hh = shelf.clientHeight;
      engine = Engine.create({ gravity: { y: 1.1 } });
      walls = [
        Bodies.rectangle(W / 2, Hh + 30 - FLOOR, W * 2, 60, { isStatic: true }),
        Bodies.rectangle(-30 + SIDE, Hh / 2, 60, Hh * 3, { isStatic: true }),
        Bodies.rectangle(W + 30 - SIDE, Hh / 2, 60, Hh * 3, { isStatic: true })
      ];
      Composite.add(engine.world, walls);
      items = els.map((el, i) => {
        const p = PIECES[i];
        // la mayoría cae a los costados del abanico, alguna por el medio
        const side = i % 2 === 0 ? 0.06 + Math.random() * 0.16 : 0.78 + Math.random() * 0.16;
        const x = (i % 7 === 3 ? 0.3 + Math.random() * 0.4 : side) * W;
        const y = -p.s - i * 70 - Math.random() * 40;
        const opts = { restitution: 0.35, friction: 0.5, frictionAir: 0.012, angle: (Math.random() - 0.5) * 0.8 };
        const body = p.t === 'ci' ? Bodies.circle(x, y, p.s / 2, opts) : Bodies.rectangle(x, y, p.s, p.s, Object.assign({ chamfer: { radius: 14 } }, opts));
        return { el, body, s: p.s };
      });
      Composite.add(engine.world, items.map(i => i.body));
      if (fine) {
        const mouse = Mouse.create(shelf);
        ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach(ev => mouse.element.removeEventListener(ev, mouse.mousewheel));
        mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
        Composite.add(engine.world, mc);
        Events.on(mc, 'startdrag', () => mascotWake());
      }
    }
    function frame() {
      Engine.update(engine, 1000 / 60);
      for (const it of items) {
        const { x, y } = it.body.position;
        it.el.style.transform = `translate(${x - it.s / 2}px, ${y - it.s / 2}px) rotate(${it.body.angle}rad)`;
        if (y > -it.s) it.el.style.opacity = '1';
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (started || narrow()) return;
      started = true; build(); frame();
    }
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { setTimeout(start, 500); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(shelf);
    // pausa cuando el hero no se ve: no tiene sentido simular fuera de pantalla
    new IntersectionObserver(es => {
      if (!started) return;
      if (es[0].isIntersecting && !raf) frame(); else if (!es[0].isIntersecting) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(shelf);
    let rt;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (!started) { start(); return; }
        if (narrow()) return;
        const W = shelf.clientWidth, Hh = shelf.clientHeight;
        Body.setPosition(walls[0], { x: W / 2, y: Hh + 30 - FLOOR });
        Body.setPosition(walls[2], { x: W + 30 - SIDE, y: Hh / 2 });
        items.forEach(it => { const p = it.body.position; if (p.x > W - SIDE - it.s / 2 || p.y > Hh - FLOOR) Body.setPosition(it.body, { x: Math.min(p.x, W - SIDE - it.s), y: Math.min(p.y, Hh - FLOOR - it.s) }); });
      }, 150);
    });
  }

  /* ---------- 3. Mascota ---------- */
  const mascot = document.getElementById('mascot'), pupils = mascot.querySelector('.pupils'), bubble = document.getElementById('bubble');
  let idleT, tip = -1;
  function mascotWake() {
    mascot.classList.remove('sleep');
    clearTimeout(idleT);
    idleT = setTimeout(() => mascot.classList.add('sleep'), 12000);
  }
  addEventListener('pointermove', e => {
    mascotWake();
    if (reduced) return;
    const r = mascot.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const a = Math.atan2(e.clientY - cy, e.clientX - cx), d = Math.min(1, Math.hypot(e.clientX - cx, e.clientY - cy) / 300);
    pupils.style.transform = `translate(${Math.cos(a) * 3.2 * d}px, ${Math.sin(a) * 3.2 * d}px)`;
  }, { passive: true });
  addEventListener('keydown', mascotWake);
  addEventListener('scroll', mascotWake, { passive: true });
  mascotWake();
  if (!reduced) (function blink() {
    setTimeout(() => { if (!mascot.classList.contains('sleep')) { mascot.classList.add('blink'); setTimeout(() => mascot.classList.remove('blink'), 140); } blink(); }, 2500 + Math.random() * 3000);
  })();
  mascot.addEventListener('click', () => {
    mascotWake();
    tip = (tip + 1) % R.TIPS.length;
    bubble.textContent = R.TIPS[tip];
    bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = '';
    mascot.classList.remove('wiggle'); void mascot.offsetWidth; mascot.classList.add('wiggle');
  });

  /* ---------- 4. Gente que ya jugó hoy ---------- */
  const tags = document.getElementById('cursorTags');
  const SPOTS = [{ right: '24%', top: '290px', c: '#3C9FF1' }, { right: '4%', top: '380px', c: '#7025E0' }];
  const ARROW = c => `<svg viewBox="0 0 24 24"><path d="M3 2l18 8-8 2.5L10 21z" fill="${c}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  tags.innerHTML = SPOTS.map((s, i) => `<div class="ctag" style="${s.left ? `left:${s.left}` : `right:${s.right}`};top:${s.top};animation-delay:${-i * 2.3}s">${ARROW(s.c)}<span style="background:${s.c}"></span></div>`).join('');
  function renderTags() {
    const rows = (R.ranking.rows || []).slice().sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0));
    const seen = new Set(), picks = [];
    for (const r of rows) { if (seen.has(r.playerId)) continue; seen.add(r.playerId); picks.push(r); if (picks.length === SPOTS.length) break; }
    [...tags.children].forEach((t, i) => {
      const r = picks[i];
      t.classList.toggle('on', !!r && innerWidth > 1000);
      if (r) t.querySelector('span').textContent = `${r.name.split(' ')[0]} · ${R.games[r.game] ? R.games[r.game].name : ''}`;
    });
  }
  document.addEventListener('recreo:ranking', renderTags);
  renderTags();
})();
