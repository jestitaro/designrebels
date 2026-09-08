/* Talent Lab — wizard.js
 * Vida propia del mago en todas sus instancias (el botón "Consultar
 * con el oráculo" y el que aparece adentro del modal): parpadea y
 * mueve la mirada al azar. Levitar y mover brazos es puro CSS
 * (@keyframes, siempre corriendo). Que se "enoje" por tardar en
 * responder una pregunta lo maneja oracle.js, que es quien sabe en
 * qué paso está el usuario. */
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

  var LOOK_SPOTS = [[0, 0], [-2.5, 0.5], [2.5, 0.5], [0, -1.5], [0, 0]];

  function look(el) {
    // dormido no mira para ningún lado, solo tiene los ojos cerrados
    if (el.classList.contains('is-sleeping')) return;
    var spot = LOOK_SPOTS[Math.floor(Math.random() * LOOK_SPOTS.length)];
    el.querySelectorAll('.wizard-eye-look').forEach(function (eye) {
      eye.style.transform = 'translate(' + spot[0] + 'px,' + spot[1] + 'px)';
    });
  }

  function scheduleLook(el) {
    var delay = 1800 + Math.random() * 2600;
    setTimeout(function () {
      look(el);
      scheduleLook(el);
    }, delay);
  }

  wizards.forEach(function (el) {
    scheduleBlink(el);
    scheduleLook(el);
  });

  /* el mago del modal responde al toque (no tiene hover en mobile):
     alterna gira / se enoja un poco y se le pasa solo. Si nadie lo
     toca (ni abre el modal recién), se queda dormido. */
  var modalWizardWrap = document.querySelector('.oracle-wizard');
  var modalWizard = modalWizardWrap && modalWizardWrap.querySelector('.wizard');
  if (modalWizardWrap && modalWizard) {
    modalWizardWrap.style.cursor = 'pointer';
    var ANGRY_FLASH = 1100;
    var SLEEP_DELAY = 5000;
    var tapIsAngryNext = false;
    var angryFlashTimer = null;
    var sleepTimer = null;

    function wake() {
      modalWizard.classList.remove('is-sleeping');
      modalWizardWrap.classList.remove('is-sleeping');
      clearTimeout(sleepTimer);
      sleepTimer = setTimeout(function () {
        modalWizard.classList.add('is-sleeping');
        modalWizardWrap.classList.add('is-sleeping');
        modalWizard.querySelectorAll('.wizard-eye-look').forEach(function (eye) {
          eye.style.transform = 'translate(0,0)';
        });
      }, SLEEP_DELAY);
    }

    modalWizardWrap.addEventListener('click', function () {
      wake();
      clearTimeout(angryFlashTimer);
      modalWizard.classList.remove('is-spinning', 'is-angry');
      void modalWizard.offsetWidth;
      if (tapIsAngryNext) {
        modalWizard.classList.add('is-angry');
        angryFlashTimer = setTimeout(function () {
          modalWizard.classList.remove('is-angry');
        }, ANGRY_FLASH);
      } else {
        modalWizard.classList.add('is-spinning');
      }
      tapIsAngryNext = !tapIsAngryNext;
    });

    var oracleModal = document.getElementById('oracle-modal');
    if (oracleModal) {
      new MutationObserver(function () {
        if (!oracleModal.hidden) wake();
      }).observe(oracleModal, { attributes: true, attributeFilter: ['hidden'] });
    } else {
      wake();
    }
  }
})();
