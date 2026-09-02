/* Talent Lab — app.js
 * Página 100% estática (sin backend): scroll-reveal + ocultar la flechita
 * de "scroll" apenas alguien scrollea de verdad. La caída de los íconos
 * del hero vive en hero-physics.js. */
(function () {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const scrollCue = document.querySelector('.scroll-cue');
  if (scrollCue) {
    const toggle = () => scrollCue.classList.toggle('is-hidden', window.scrollY > 60);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }
})();
