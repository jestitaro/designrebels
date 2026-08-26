/* Talent Lab — app.js
 * Página 100% estática (sin backend): scroll-reveal + liberar los íconos
 * del hero de su animación de caída una vez que aterrizan, para que el
 * hover pueda moverlos (una animación con fill:forwards gana siempre por
 * sobre :hover mientras siga "activa", aunque ya haya terminado). */
(function () {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  document.querySelectorAll('.shelf-icon').forEach(el => {
    el.addEventListener('animationend', () => {
      el.style.animation = 'none';
      el.style.opacity = '1';
    }, { once: true });
  });
})();
