/* Talent Lab — wizard.js
 * Vida propia del mago en todas sus instancias (el botón "Consultar
 * con el oráculo" y el que aparece adentro del modal): parpadea y la
 * mirada sigue al cursor/dedo por toda la pantalla, igual que el
 * ojito de la home (ver eye.js) — no es un ojo HTML con un iris
 * suelto, así que en vez de mover un <div>, calculamos el ángulo
 * hacia el puntero y desplazamos el grupo .wizard-eye-look un poquito
 * en esa dirección (transform en unidades del viewBox del SVG).
 * Levitar y mover brazos es puro CSS (@keyframes, siempre corriendo).
 * Que se "enoje" por tardar en responder una pregunta del quiz lo
 * maneja oracle.js, que es quien sabe en qué paso está el usuario. */
(function () {
  var wizards = document.querySelectorAll('[data-wizard]');
  if (!wizards.length) return;

  function blink(el) {
    el.classList.add('is-blinking');
    setTimeout(function () { el.classList.remove('is-blinking'); }, 180);
  }

  function scheduleBlink(el) {
    var delay = 2600 + Math.random() * 3200;
    setTimeout(function () {
      blink(el);
      scheduleBlink(el);
    }, delay);
  }

  wizards.forEach(function (el) { scheduleBlink(el); });

  // la mirada sigue al puntero (mouse o touch) en toda la pantalla
  var EYE_REACH = 3; // unidades del viewBox que se puede mover el ojo
  var pointerX = null;
  var pointerY = null;

  function updateLook() {
    if (pointerX === null) return;
    wizards.forEach(function (el) {
      if (el.classList.contains('is-sleeping')) return;
      el.querySelectorAll('.wizard-eye-look').forEach(function (eye) {
        var rect = eye.getBoundingClientRect();
        if (!rect.width) return;
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = pointerX - cx;
        var dy = pointerY - cy;
        var dist = Math.hypot(dx, dy) || 1;
        var r = Math.min(EYE_REACH, dist / 40);
        var ox = (dx / dist) * r;
        var oy = (dy / dist) * r;
        eye.style.transform = 'translate(' + ox.toFixed(2) + 'px,' + oy.toFixed(2) + 'px)';
      });
    });
  }

  var ticking = false;
  function queueLook(x, y) {
    pointerX = x;
    pointerY = y;
    wake();
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { updateLook(); ticking = false; });
  }

  document.addEventListener('mousemove', function (e) { queueLook(e.clientX, e.clientY); });
  document.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    if (t) queueLook(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    if (t) queueLook(t.clientX, t.clientY);
  }, { passive: true });

  // si no pasa nada en la pantalla (ni mouse, ni touch, ni scroll),
  // el mago del modal se queda dormido
  var SLEEP_DELAY = 6000;
  var sleepTimer = null;
  function wake() {
    wizards.forEach(function (el) {
      if (!el.classList.contains('is-sleeping')) return;
      el.classList.remove('is-sleeping');
      var wrap = el.closest('.oracle-wizard');
      if (wrap) wrap.classList.remove('is-sleeping');
    });
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(function () {
      wizards.forEach(function (el) {
        el.classList.add('is-sleeping');
        var wrap = el.closest('.oracle-wizard');
        if (wrap) wrap.classList.add('is-sleeping');
        el.querySelectorAll('.wizard-eye-look').forEach(function (eye) {
          eye.style.transform = 'translate(0,0)';
        });
      });
    }, SLEEP_DELAY);
  }
  document.addEventListener('scroll', wake, { passive: true });
  wake();

  /* el mago del modal responde al toque (no tiene hover en mobile):
     cada toque se enoja un ratito y se le pasa solo. */
  var modalWizardWrap = document.querySelector('.oracle-wizard');
  var modalWizard = modalWizardWrap && modalWizardWrap.querySelector('.wizard');
  if (modalWizardWrap && modalWizard) {
    modalWizardWrap.style.cursor = 'pointer';
    var ANGRY_FLASH = 2400;
    var angryFlashTimer = null;

    modalWizardWrap.addEventListener('click', function () {
      wake();
      clearTimeout(angryFlashTimer);
      modalWizard.classList.remove('is-angry');
      void modalWizard.offsetWidth;
      modalWizard.classList.add('is-angry');
      angryFlashTimer = setTimeout(function () {
        modalWizard.classList.remove('is-angry');
      }, ANGRY_FLASH);
    });

    var oracleModal = document.getElementById('oracle-modal');
    if (oracleModal) {
      new MutationObserver(function () {
        if (!oracleModal.hidden) wake();
      }).observe(oracleModal, { attributes: true, attributeFilter: ['hidden'] });
    }
  }
})();
