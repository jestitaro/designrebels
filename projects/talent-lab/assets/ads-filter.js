/* Talent Lab — ads-filter.js
 * Filtros por categoría en Clasificados. Cada .ad-card trae su
 * data-category (ver index.html); los botones .ads-filter solo
 * ocultan/muestran, no tocan el resto de la lógica de la card (el
 * click para abrir el modal de info sigue viviendo en lightbox.js).
 *
 * El tap selecciona y filtra en el mismo gesto (comportamiento nativo
 * del evento click, sin nada que lo demore). Después de eso, si el
 * chip tocado quedó parcialmente tapado por el borde del carrusel
 * (affordance intencional de que hay más opciones), se hace scroll
 * horizontal suave solo lo necesario para destaparlo — nunca lo
 * centra ni mueve el carrusel si ya estaba completamente visible. */
(function () {
  var track = document.querySelector('.ads-filters');
  var filters = document.querySelectorAll('.ads-filter');
  var cards = document.querySelectorAll('.ad-card');
  if (!track || !filters.length || !cards.length) return;

  var EDGE_MARGIN = 16;

  function ensureChipVisible(btn) {
    var trackRect = track.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    if (btnRect.left < trackRect.left) {
      track.scrollBy({ left: btnRect.left - trackRect.left - EDGE_MARGIN, behavior: 'smooth' });
    } else if (btnRect.right > trackRect.right) {
      track.scrollBy({ left: btnRect.right - trackRect.right + EDGE_MARGIN, behavior: 'smooth' });
    }
  }

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');

      var category = btn.dataset.filter;
      cards.forEach(function (card) {
        var match = category === 'todos' || card.dataset.category === category;
        card.classList.toggle('is-hidden', !match);
      });

      ensureChipVisible(btn);
    });
  });
})();
