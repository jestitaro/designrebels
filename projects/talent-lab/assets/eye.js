/* Talent Lab — eye.js
 * El ojito (estilo dino) al lado de "a la vista": el iris sigue al cursor,
 * pero nunca sale del óvalo blanco — se limita a una elipse (no un círculo)
 * porque el óvalo es más ancho que alto, igual que en la referencia. */
(function () {
  const eyes = Array.from(document.querySelectorAll('.eye-wrap')).map(wrap => ({
    wrap,
    iris: wrap.querySelector('.eye-iris')
  })).filter(e => e.iris);
  if (!eyes.length) return;

  function update(x, y) {
    eyes.forEach(({ wrap, iris }) => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const maxX = Math.max(0, (rect.width - iris.offsetWidth) / 2) * 0.9;
      const maxY = Math.max(0, (rect.height - iris.offsetHeight) / 2) * 0.9;
      if (!maxX || !maxY) return;

      const angle = Math.atan2(dy, dx);
      const nx = Math.cos(angle), ny = Math.sin(angle);
      const ellipseR = 1 / Math.sqrt((nx * nx) / (maxX * maxX) + (ny * ny) / (maxY * maxY));
      const dist = Math.min(Math.hypot(dx, dy), ellipseR);

      const ox = Math.cos(angle) * dist;
      const oy = Math.sin(angle) * dist;
      iris.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
    });
  }

  let ticking = false;
  document.addEventListener('mousemove', e => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(e.clientX, e.clientY); ticking = false; });
  });
})();
