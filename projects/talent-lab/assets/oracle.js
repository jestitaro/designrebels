/* Talent Lab — oracle.js
 * El Oráculo: 3 preguntas cortas (una por cada persona) y al final revela
 * cuál de las 20 áreas de "Clasificados" es la que más matchea. El motor
 * es simple a propósito — no busca ser un test psicométrico real, es un
 * juego para invitar a mirar la lista completa desde otro ángulo.
 *
 * Pablo (chips, multi-select) da la señal más fina: cada chip suma
 * puntos a 1-2 áreas puntuales. Sebi y Nico (una opción cada
 * una, por departamento) suman puntos más grandes a todo un
 * departamento — Nico pesa más porque es la pregunta "decisiva". */
(function () {
  var modal = document.getElementById('oracle-modal');
  if (!modal) return;

  var AREAS = [
    { title: 'Estandarización de componentes', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['orden', 'reutilizar'],
      mission: 'Tu misión es que nadie tenga que inventar la rueda dos veces: cada componente que ordenás hoy ahorra horas mañana.' },
    { title: 'Testing automatizado', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['detectar', 'automatizar'],
      mission: 'Tu misión es atrapar los errores antes de que lleguen a alguien más — la calma de saber que algo se probó solo.' },
    { title: 'Documentación técnica y funcional', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['explicar', 'orden'],
      mission: 'Tu misión es que el conocimiento no viva solo en la cabeza de una persona.' },
    { title: 'Calidad de código y code review', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['detectar', 'orden'],
      mission: 'Tu misión es que el código de hoy no sea el dolor de cabeza de mañana.' },
    { title: 'DevOps, CI-CD y ambientes', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['automatizar', 'simplificar'],
      mission: 'Tu misión es que publicar algo nuevo deje de ser un evento con el corazón acelerado.' },
    { title: 'Contenido y comunicación', dept: 'Marketing', deptKey: 'marketing', deptClass: 'dept-marketing', tags: ['contar'],
      mission: 'Tu misión es contar, con claridad, todo lo bueno que QuartzSales ya hace y casi nadie sabe.' },
    { title: 'Marca y redes sociales', dept: 'Marketing', deptKey: 'marketing', deptClass: 'dept-marketing', tags: ['contar', 'visual'],
      mission: 'Tu misión es que QuartzSales se vea tan bien afuera como es adentro.' },
    { title: 'SEO y sitio web', dept: 'Marketing', deptKey: 'marketing', deptClass: 'dept-marketing', tags: ['visual', 'datos'],
      mission: 'Tu misión es que a QuartzSales la encuentren quienes ya la están buscando.' },
    { title: 'Onboarding de nuevos', dept: 'Recursos Humanos', deptKey: 'rrhh', deptClass: 'dept-rrhh', tags: ['cuidar', 'explicar'],
      mission: 'Tu misión es que nadie se sienta perdido en su primera semana.' },
    { title: 'Cultura y clima de equipo', dept: 'Recursos Humanos', deptKey: 'rrhh', deptClass: 'dept-rrhh', tags: ['cuidar'],
      mission: 'Tu misión es que venir a trabajar se sienta bien, no solo se tolere.' },
    { title: 'Formación interna', dept: 'Recursos Humanos', deptKey: 'rrhh', deptClass: 'dept-rrhh', tags: ['explicar', 'cuidar'],
      mission: 'Tu misión es que lo que ya sabe alguien del equipo, lo termine sabiendo todo el equipo.' },
    { title: 'Procesos de venta y pipeline', dept: 'Comercial', deptKey: 'comercial', deptClass: 'dept-comercial', tags: ['vender', 'datos'],
      mission: 'Tu misión es que ninguna oportunidad se pierda por el camino.' },
    { title: 'Material comercial y demos', dept: 'Comercial', deptKey: 'comercial', deptClass: 'dept-comercial', tags: ['vender', 'contar'],
      mission: 'Tu misión es que el producto se explique solo, con la ayuda justa.' },
    { title: 'Éxito y relación con clientes', dept: 'Comercial', deptKey: 'comercial', deptClass: 'dept-comercial', tags: ['acompanar', 'cuidar'],
      mission: 'Tu misión es que el cliente se quede no por costumbre, sino porque de verdad lo cuidan.' },
    { title: 'Análisis funcional y diseño', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['visual', 'datos'],
      mission: 'Tu misión es traducir lo que el negocio necesita a algo que se pueda construir de verdad.' },
    { title: 'Performance frontend / backend', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['visual', 'automatizar'],
      mission: 'Tu misión es que nada se sienta lento, aunque nadie note por qué.' },
    { title: 'Arquitectura modular y reutilización', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['reutilizar', 'orden'],
      mission: 'Tu misión es construir una sola vez lo que se va a usar muchas.' },
    { title: 'Seguridad técnica básica', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['detectar'],
      mission: 'Tu misión es cuidar lo que nadie ve hasta que falla.' },
    { title: 'Experiencia de desarrollador (DX)', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['simplificar', 'explicar'],
      mission: 'Tu misión es eliminar las pequeñas frustraciones que frenan a quienes construyen nuestros productos.' },
    { title: 'Datos, métricas y reporting', dept: 'Producto', deptKey: 'producto', deptClass: 'dept-producto', tags: ['datos'],
      mission: 'Tu misión es que las decisiones se tomen mirando números, no solo intuición.' }
  ];

  var state = { chips: new Set(), laquesis: null, atropos: null };
  var currentStep = 0;

  var steps = modal.querySelectorAll('[data-oracle-step]');
  var wizardEl = modal.querySelector('.oracle-wizard .wizard');

  function blinkWizard() {
    if (!wizardEl) return;
    wizardEl.classList.add('is-blinking');
    setTimeout(function () { wizardEl.classList.remove('is-blinking'); }, 180);
  }

  // Si tarda en responder una pregunta, se impacienta.
  var ANGRY_DELAY = 9000;
  var angryTimer = null;
  function clearAngryTimer() {
    if (angryTimer) { clearTimeout(angryTimer); angryTimer = null; }
    if (wizardEl) wizardEl.classList.remove('is-angry');
  }
  function armAngryTimer() {
    clearAngryTimer();
    if (currentStep < 1 || currentStep > 3) return; // solo en las preguntas, no en intro/revelación
    angryTimer = setTimeout(function () {
      if (wizardEl) wizardEl.classList.add('is-angry');
    }, ANGRY_DELAY);
  }

  function showStep(n) {
    currentStep = n;
    steps.forEach(function (step) {
      step.hidden = Number(step.dataset.oracleStep) !== n;
    });
    blinkWizard();
    armAngryTimer();
  }

  function resetOracle() {
    clearAngryTimer();
    state = { chips: new Set(), laquesis: null, atropos: null };
    modal.querySelectorAll('.oracle-chip.is-selected, .oracle-option.is-selected').forEach(function (el) {
      el.classList.remove('is-selected');
    });
    modal.querySelectorAll('[data-oracle-next], [data-oracle-reveal]').forEach(function (btn) {
      btn.disabled = true;
    });
    showStep(0);
  }

  // Pablo: chips multi-select
  modal.querySelectorAll('[data-chip]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var tag = chip.dataset.chip;
      if (state.chips.has(tag)) {
        state.chips.delete(tag);
        chip.classList.remove('is-selected');
      } else {
        state.chips.add(tag);
        chip.classList.add('is-selected');
      }
      var nextBtn = chip.closest('[data-oracle-step]').querySelector('[data-oracle-next]');
      if (nextBtn) nextBtn.disabled = state.chips.size === 0;
      armAngryTimer();
    });
  });

  // Sebi / Nico: una opción por grupo
  modal.querySelectorAll('[data-oracle-options]').forEach(function (group) {
    var key = group.dataset.oracleOptions; // "laquesis" | "atropos"
    group.querySelectorAll('.oracle-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        group.querySelectorAll('.oracle-option').forEach(function (o) { o.classList.remove('is-selected'); });
        opt.classList.add('is-selected');
        state[key] = opt.dataset.value;
        var step = group.closest('[data-oracle-step]');
        var advanceBtn = step.querySelector('[data-oracle-next], [data-oracle-reveal]');
        if (advanceBtn) advanceBtn.disabled = false;
        armAngryTimer();
      });
    });
  });

  var startBtn = modal.querySelector('[data-oracle-start]');
  if (startBtn) startBtn.addEventListener('click', function () { showStep(1); });

  modal.querySelectorAll('[data-oracle-back]').forEach(function (btn) {
    btn.addEventListener('click', function () { showStep(currentStep - 1); });
  });

  modal.querySelectorAll('[data-oracle-next]').forEach(function (btn) {
    btn.addEventListener('click', function () { showStep(currentStep + 1); });
  });

  var revealBtn = modal.querySelector('[data-oracle-reveal]');
  if (revealBtn) revealBtn.addEventListener('click', function () { revealResult(); });

  var restartBtn = modal.querySelector('[data-oracle-restart]');
  if (restartBtn) restartBtn.addEventListener('click', resetOracle);

  // reiniciar cada vez que se cierra el modal, para que la próxima
  // consulta arranque siempre desde el principio
  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', resetOracle);
  });

  function revealResult() {
    var ranked = AREAS.map(function (area) {
      var score = 0;
      area.tags.forEach(function (tag) { if (state.chips.has(tag)) score += 2; });
      if (area.deptKey === state.laquesis) score += 3;
      if (area.deptKey === state.atropos) score += 4;
      return { area: area, score: score };
    }).sort(function (a, b) { return b.score - a.score; });

    var top = ranked[0];
    var alts = [ranked[1], ranked[2]].filter(Boolean).map(function (r) { return r.area.title; });
    var maxForArea = top.area.tags.length * 2 + 7;
    var pct = Math.round(60 + (top.score / maxForArea) * 37);
    pct = Math.max(55, Math.min(97, pct));

    modal.querySelector('[data-oracle-result-dept]').textContent = top.area.dept;
    modal.querySelector('[data-oracle-result-dept]').className = 'dept ad-info-dept ' + top.area.deptClass;
    modal.querySelector('[data-oracle-result-title]').textContent = top.area.title;
    modal.querySelector('[data-oracle-result-mission]').textContent = top.area.mission;
    modal.querySelector('[data-oracle-affinity-pct]').textContent = pct + '%';
    modal.querySelector('[data-oracle-affinity-fill]').style.width = pct + '%';
    modal.querySelector('[data-oracle-alt]').textContent = alts.join(' · ');

    showStep(4);
  }
})();
