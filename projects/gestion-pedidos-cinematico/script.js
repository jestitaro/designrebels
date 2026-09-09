/* ============================================================================
   QuartzSales · Gestión de pedidos — el hilo (signature move)
   ----------------------------------------------------------------------------
   Bespoke, no toca scrollcraft.js/css. Un solo pedido (#4821) nace en el hero
   y viaja con el scroll: una línea violeta que solo crece mientras se avanza
   por los 5 capítulos del flujo, y una tarjeta que muta de estado a medida
   que el pedido atraviesa Carga → Validación → Aprobación → ERP → Confirmación.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var chapterMeta = {
    1: { label: 'Carga' },
    2: { label: 'Validación' },
    3: { label: 'Aprobación' },
    4: { label: 'Transmisión ERP' },
    5: { label: 'Confirmación' }
  };

  var sections = Array.prototype.slice
    .call(document.querySelectorAll('[data-qs-chapter]'))
    .sort(function (a, b) {
      return parseInt(a.getAttribute('data-qs-chapter'), 10) - parseInt(b.getAttribute('data-qs-chapter'), 10);
    });

  if (!sections.length) return;

  var navLabel = document.getElementById('qs-nav-chapter-label');
  var navFill = document.getElementById('qs-nav-chapter-fill');
  var lineFg = document.getElementById('qs-line-fg');
  var wps = Array.prototype.slice.call(document.querySelectorAll('.qs-wp'));
  var wpFractions = [0.09, 0.27, 0.50, 0.73, 0.91];

  var tokenCard = document.getElementById('qs-token-card');
  var tokenState = document.getElementById('qs-token-state');
  var tokenMeta = document.getElementById('qs-token-meta');
  var tokenDotM = document.getElementById('qs-token-dot-m');
  var tokenStateM = document.getElementById('qs-token-state-m');
  var mobileFill = document.getElementById('qs-thread-mobile-fill');

  var erpPulse = document.getElementById('qs-erp-pulse');
  var erpSection = document.querySelector('[data-qs-chapter="4"]');

  var STATES = {
    idle:     { text: 'Listo para cargar',        meta: 'Esperando el primer producto' },
    loading:  { text: 'Cargando pedido…',          meta: 'Cliente, sucursal y productos' },
    checking: { text: 'Validando…',                meta: 'Precio, stock y condiciones' },
    flag:     { text: 'Excepción detectada',       meta: 'Esperando aprobación' },
    approved: { text: 'Aprobado',                  meta: 'Excepción resuelta' },
    sending:  { text: 'Transmitiendo al ERP…',     meta: 'Conectando en tiempo real' },
    done:     { text: 'Confirmado',                meta: 'Pedido #4821 cerrado' }
  };

  var cache = [];
  function measure() {
    cache = sections.map(function (el) {
      var r = el.getBoundingClientRect();
      var top = r.top + window.scrollY;
      return { n: parseInt(el.getAttribute('data-qs-chapter'), 10), top: top, height: r.height, bottom: top + r.height };
    });
  }

  var lastState = '';
  function setState(name) {
    if (name === lastState) return;
    lastState = name;
    var s = STATES[name];
    if (!s) return;
    if (tokenCard) tokenCard.setAttribute('data-state', name);
    if (tokenState) tokenState.textContent = s.text;
    if (tokenMeta) tokenMeta.textContent = s.meta;
    if (tokenDotM) tokenDotM.setAttribute('data-state', name);
    if (tokenStateM) tokenStateM.textContent = 'Pedido #4821 · ' + s.text;
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  var ticking = false;
  function update() {
    ticking = false;
    if (!cache.length) return;
    var center = window.scrollY + window.innerHeight * 0.5;
    var threadStart = cache[0].top;
    var threadEnd = cache[cache.length - 1].bottom;
    var progress = clamp01((center - threadStart) / Math.max(threadEnd - threadStart, 1));

    // active chapter: last one whose top has passed the viewport center
    var idx = -1;
    for (var i = 0; i < cache.length; i++) {
      if (center >= cache[i].top) idx = i; else break;
    }
    var pastAll = center >= threadEnd;

    // nav chapter chip
    if (idx === -1) {
      if (navLabel) navLabel.textContent = 'Recorré el proceso';
      if (navFill) navFill.style.width = '0%';
    } else {
      var n = cache[idx].n;
      var meta = chapterMeta[n];
      if (navLabel) navLabel.textContent = '0' + n + ' · ' + meta.label + ' — ' + n + '/05';
      if (navFill) navFill.style.width = (n / 5 * 100) + '%';
    }

    // thread line + waypoints
    if (lineFg) lineFg.style.strokeDashoffset = (100 * (1 - progress)).toFixed(2);
    wps.forEach(function (wp, i) {
      wp.classList.toggle('is-lit', progress >= wpFractions[i]);
    });
    if (mobileFill) mobileFill.style.width = (progress * 100).toFixed(1) + '%';

    // token state machine
    if (idx === -1) {
      setState('idle');
    } else {
      var chapterN = cache[idx].n;
      if (chapterN === 1) setState('loading');
      else if (chapterN === 2) setState('checking');
      else if (chapterN === 3) {
        var sec = cache[idx];
        var localP = clamp01((center - sec.top) / Math.max(sec.height, 1));
        setState(localP < 0.5 ? 'flag' : 'approved');
      } else if (chapterN === 4) setState('sending');
      else if (chapterN === 5) setState(pastAll ? 'done' : 'sending');
    }
    if (pastAll) setState('done');
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('resize', function () { measure(); update(); });
  window.addEventListener('scroll', onScroll, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); update(); });
  }
  measure();
  update();

  // ERP pulse: fires once when the transmission stage is reached
  if (erpSection && erpPulse && !reduced && 'IntersectionObserver' in window) {
    var pulsed = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !pulsed) {
          pulsed = true;
          erpPulse.classList.add('is-active');
        }
      });
    }, { threshold: 0.5 });
    io.observe(erpSection);
  } else if (erpPulse && reduced) {
    erpPulse.style.display = 'none';
  }
})();
