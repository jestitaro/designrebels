/* Talent Lab — app.js
 * Página 100% estática (sin backend): scroll-reveal + la caída de los
 * íconos del hero, que arranca recién cuando el bloque entra en pantalla
 * (si no, con una sección tan alta la animación ya terminó off-screen
 * antes de que el usuario llegue a scrollear hasta ahí). Al terminar de
 * caer, se libera la animación (fill:forwards gana siempre por sobre
 * :hover mientras siga "activa") fijando a mano el transform de reposo. */
(function () {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const iconShelf = document.querySelector('.icon-shelf');
  if (iconShelf) {
    // rootMargin shrinks the bottom of the viewport for intersection purposes, so a
    // sliver poking in at the very fold on page load doesn't count — the shelf has to
    // be meaningfully scrolled into view before the fall actually plays.
    const shelfObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
    }, { threshold: 0, rootMargin: '0px 0px -35% 0px' });
    shelfObserver.observe(iconShelf);
  }

  document.querySelectorAll('.shelf-icon').forEach(el => {
    el.addEventListener('animationend', () => {
      el.style.animation = 'none';
      el.classList.add('landed');
    }, { once: true });
  });
})();
