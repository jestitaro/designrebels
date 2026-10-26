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
    // Entra al verse y repite la entrada cada 14 s mientras siga en pantalla
    let visible = false, timer = null;
    const replay = () => {
      if (!visible) return;
      svg.classList.remove('is-in');
      svg.getBoundingClientRect();
      svg.classList.add('is-in'); count(svg);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible || timer) return;
      svg.classList.add('is-in'); count(svg);
      timer = setInterval(replay, 14000);
    }, { threshold: .6, rootMargin: '0px 0px -10% 0px' }); // arranca recién con la card bien a la vista
    io.observe(svg);
  });
})();
