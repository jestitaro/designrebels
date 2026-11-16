document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Scroll helpers ---------- */
  document.querySelectorAll('.js-scroll-simulador').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('ai-demo').scrollIntoView({ behavior: 'smooth' }));
  });

  /* ---------- Timeline "Cómo funciona" que se llena con el scroll ---------- */
  const flowEl = document.getElementById('flow');
  const flowLine = document.getElementById('flow-line');
  const flowFill = document.getElementById('flow-line-progress');
  const flowIcons = flowEl ? Array.from(flowEl.querySelectorAll('.flow-step__icon')) : [];
  if (flowEl && flowLine && flowFill && flowIcons.length) {
    const TRIGGER_RATIO = 0.72; // altura del viewport a la que "llega" el scroll

    function layoutFlowLine() {
      const flowRect = flowEl.getBoundingClientRect();
      const firstRect = flowIcons[0].getBoundingClientRect();
      const lastRect = flowIcons[flowIcons.length - 1].getBoundingClientRect();
      const top = (firstRect.top + firstRect.height / 2) - flowRect.top;
      const bottom = (lastRect.top + lastRect.height / 2) - flowRect.top;
      flowLine.style.top = top + 'px';
      flowLine.style.height = Math.max(0, bottom - top) + 'px';
      flowFill.style.top = top + 'px';
    }

    let flowTicking = false;
    function updateFlowProgress() {
      flowTicking = false;
      const lineRect = flowLine.getBoundingClientRect();
      const triggerY = window.innerHeight * TRIGGER_RATIO;
      const progressPx = Math.max(0, Math.min(lineRect.height, triggerY - lineRect.top));
      flowFill.style.height = progressPx + 'px';
      flowIcons.forEach((icon) => {
        const iconRect = icon.getBoundingClientRect();
        const iconCenter = (iconRect.top + iconRect.height / 2) - lineRect.top;
        icon.classList.toggle('is-filled', iconCenter <= progressPx + 1);
      });
    }
    function onFlowScroll() {
      if (!flowTicking) { requestAnimationFrame(updateFlowProgress); flowTicking = true; }
    }

    layoutFlowLine();
    updateFlowProgress();
    window.addEventListener('scroll', onFlowScroll, { passive: true });
    window.addEventListener('resize', () => { layoutFlowLine(); updateFlowProgress(); });
  }

  /* ---------- Reveal on scroll ---------- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('active'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  /* ---------- Números: count-up al entrar en viewport ---------- */
  const countEls = document.querySelectorAll('.stat-countup');
  if (countEls.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.countup);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1200;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.4 });
    countEls.forEach(el => countObserver.observe(el));
  }

});
