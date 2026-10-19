/* Ejecución en PDV: arranca la animación del trayecto al entrar en viewport.
   Sin JS o con reduced motion, el trayecto queda dibujado completo y quieto. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.exec-map').forEach(svg => {
    if (reduce) return;
    const start = () => {
      svg.classList.add('is-in');
      svg.querySelectorAll('.exec-map__anim').forEach(a => a.beginElement && a.beginElement());
    };
    if (!('IntersectionObserver' in window)) { start(); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      start(); io.disconnect();
    }, { threshold: .3 });
    io.observe(svg);
  });
})();
