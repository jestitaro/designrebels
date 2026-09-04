/* Talent Lab — lightbox.js
 * El detalle de un talento se abre sin salir de la página. El href de la
 * card sigue apuntando a talentos/*.html como fallback si por algún
 * motivo no corre este script. */
(function () {
  var triggers = document.querySelectorAll('[data-lightbox-target]');
  if (!triggers.length) return;

  function open(lightbox) {
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  }

  function close(lightbox) {
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
  }

  triggers.forEach(function (trigger) {
    var lightbox = document.getElementById(trigger.dataset.lightboxTarget);
    if (!lightbox) return;
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      open(lightbox);
    });
  });

  document.querySelectorAll('.lightbox').forEach(function (lightbox) {
    lightbox.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', function () { close(lightbox); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) close(lightbox);
    });
  });
})();
