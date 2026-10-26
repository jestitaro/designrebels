/* Tableros de BI: entrada, recorrido por la pantalla y valores que se actualizan cada 12 s */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dec = document.documentElement.lang === 'en' ? '.' : ',';
  const fmt = v => v.toFixed(1).replace('.', dec);
  const tween = (el, from, to, dur = 1100) => {
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  // Escala de las barras: 70–100 % ocupa todo el ancho, para que las diferencias se lean
  const pct = v => Math.max(4, (v - 70) / 30 * 100) + '%';

  const fill = (root, jitter) => {
    root.querySelectorAll('.qs-bi__cell').forEach((c, i) => {
      const b = c.querySelector('b'), bar = c.querySelector('i');
      const base = +b.dataset.v, prev = +(b.dataset.now || 0);
      const next = jitter ? Math.min(99.5, Math.max(75, base + (Math.random() * 3 - 1.5))) : base;
      b.dataset.now = next;
      setTimeout(() => { bar.style.width = pct(next); tween(b, jitter ? prev : 0, next); }, jitter ? i * 40 : 900 + i * 90);
    });
    const k = root.querySelector('[data-count]'), kv = +k.dataset.count;
    const kn = jitter ? +(kv + (Math.random() * 2 - 1)).toFixed(1) : kv, kp = +(k.dataset.now || 0);
    k.dataset.now = kn;
    setTimeout(() => tween(k, jitter ? kp : 0, kn, 1300), jitter ? 0 : 700);
  };

  document.querySelectorAll('.qs-bi').forEach(el => {
    let timer;
    const start = () => {
      el.classList.add('is-in');
      setTimeout(() => el.classList.add('is-drawn'), reduce ? 0 : 700);
      fill(el, false);
      if (!reduce) timer = setInterval(() => !el.classList.contains('is-paused') && fill(el, true), 12000);
    };
    if (reduce || !('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !el.classList.contains('is-in')) start();
      el.classList.toggle('is-paused', !e.isIntersecting);
    }, { threshold: .25 }).observe(el);
  });
})();
