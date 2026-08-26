/* Talent Lab — app.js
 * Página 100% estática (sin backend): solo la animación de scroll-reveal.
 * La caída de los íconos del hero vive en hero-physics.js. */
(function () {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();
