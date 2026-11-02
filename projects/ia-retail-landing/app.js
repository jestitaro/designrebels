document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Título: split en palabras para reveal escalonado ---------- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((word, i) => `<span class="word"><span class="word__inner" style="transition-delay:${i * 90}ms">${word}</span></span>`)
      .join(' ');
    el.classList.add('reveal-split');
  });

  /* ---------- Reveal on scroll (título, lead y cards) ---------- */
  const revealTargets = document.querySelectorAll('.reveal, .reveal-split');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const stagger = reduceMotion ? 0 : parseFloat(getComputedStyle(entry.target).getPropertyValue('--d')) || 0;
        setTimeout(() => entry.target.classList.add('active'), stagger * 120);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach((el) => observer.observe(el));

  /* ---------- Tilt 3D en los mockups de teléfono ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((wrap) => {
      const screen = wrap.querySelector('.phone__screen');
      if (!screen) return;

      let frame = null;

      wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          screen.style.transform = `perspective(700px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg)`;
        });
      });

      wrap.addEventListener('mouseleave', () => {
        if (frame) cancelAnimationFrame(frame);
        screen.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

});
