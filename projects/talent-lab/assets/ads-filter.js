/* Talent Lab — ads-filter.js
 * Filtros por categoría en Clasificados. Cada .ad-card trae su
 * data-category (ver index.html); los botones .ads-filter solo
 * ocultan/muestran, no tocan el resto de la lógica de la card (el
 * click para abrir el modal de info sigue viviendo en lightbox.js). */
(function () {
  var filters = document.querySelectorAll('.ads-filter');
  var cards = document.querySelectorAll('.ad-card');
  if (!filters.length || !cards.length) return;

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var category = btn.dataset.filter;
      cards.forEach(function (card) {
        var match = category === 'todos' || card.dataset.category === category;
        card.classList.toggle('is-hidden', !match);
      });
    });
  });
})();
