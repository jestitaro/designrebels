/* Talent Lab — lightbox.js
 * Todo lo que se abre "sin salir de la página" pasa por acá: el detalle
 * de un talento (el href sigue apuntando a talentos/*.html como fallback
 * si por algún motivo no corre este script) y el modal de info de cada
 * clasificado (contenido dinámico, sacado de los data-* del botón). */
(function () {
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

  document.querySelectorAll('[data-lightbox-target]').forEach(function (trigger) {
    var lightbox = document.getElementById(trigger.dataset.lightboxTarget);
    if (!lightbox) return;
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      open(lightbox);
    });
  });

  var adInfoModal = document.getElementById('ad-info-modal');
  if (adInfoModal) {
    var deptEl = adInfoModal.querySelector('#ad-info-dept');
    var titleEl = adInfoModal.querySelector('#ad-info-title');
    var descEl = adInfoModal.querySelector('#ad-info-desc');
    var benefitEl = adInfoModal.querySelector('#ad-info-benefit-text');

    document.querySelectorAll('[data-ad-info]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deptEl.textContent = btn.dataset.dept;
        deptEl.className = 'dept ad-info-dept ' + btn.dataset.deptClass;
        titleEl.textContent = btn.dataset.title;
        descEl.textContent = btn.dataset.desc;
        benefitEl.textContent = btn.dataset.benefit;
        open(adInfoModal);
      });
    });
  }

  document.querySelectorAll('.lightbox').forEach(function (lightbox) {
    lightbox.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', function () { close(lightbox); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) close(lightbox);
    });
  });
})();
