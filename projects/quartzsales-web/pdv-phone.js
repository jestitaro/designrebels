/* PDV 360: entrada de la animación al entrar en viewport + contador de porcentajes */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = svg => {
    svg.querySelectorAll('.pct').forEach(t => {
      const v = +t.dataset.v, delay = +t.dataset.d, dur = 1300;
      t.textContent = '0%';
      setTimeout(() => {
        const t0 = performance.now();
        const step = now => {
          const p = Math.min((now - t0) / dur, 1);
          t.textContent = Math.round(v * (1 - Math.pow(1 - p, 3))) + '%';
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, delay);
    });
  };
  document.querySelectorAll('.qs-pdv').forEach(svg => {
    if (reduce || !('IntersectionObserver' in window)) { svg.classList.add('is-in'); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      svg.classList.add('is-in'); count(svg); io.disconnect();
    }, { threshold: .35 });
    io.observe(svg);
  });
})();
