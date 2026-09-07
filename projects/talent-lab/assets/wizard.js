/* Talent Lab — wizard.js
 * Parpadeo aleatorio del mago en todas sus instancias (el que vive en
 * el botón "Consultar con el oráculo" y el que aparece adentro del
 * modal). Que se "enoje" por tardar en responder una pregunta lo
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
})();
