document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Header scroll + drawer ---------- */
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  const burger = document.querySelector('.burger');
  const drawer = document.querySelector('.drawer');
  const drawerOverlay = document.querySelector('.drawer-overlay');
  const drawerClose = document.querySelector('.drawer-close');
  const openDrawer = () => { drawer.classList.add('is-open'); drawerOverlay.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); lockBodyScroll(); };
  const closeDrawer = () => { drawer.classList.remove('is-open'); drawerOverlay.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); unlockBodyScroll(); };
  burger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a, button').forEach(el => el.addEventListener('click', closeDrawer));

  /* ---------- Scroll helpers ---------- */
  document.querySelectorAll('.js-scroll-demo').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' }));
  });
  document.querySelectorAll('.js-scroll-como-funciona').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('como-funciona').scrollIntoView({ behavior: 'smooth' }));
  });

  /* ---------- Timeline "Cómo funciona": se llena con el scroll y cambia
     la imagen del panel de al lado según el paso activo ---------- */
  const flowEl = document.getElementById('flow');
  const flowLine = document.getElementById('flow-line');
  const flowFill = document.getElementById('flow-line-progress');
  const flowSteps = flowEl ? Array.from(flowEl.querySelectorAll('.flow-step')) : [];
  const flowIcons = flowSteps.map(step => step.querySelector('.flow-step__icon'));
  const flowPreviewImg = document.getElementById('flow-preview-img');

  if (flowEl && flowLine && flowFill && flowIcons.length) {
    const TRIGGER_RATIO = 0.72; // altura del viewport a la que "llega" el scroll
    let activeFlowIndex = -1;
    let flowImgTimeout = null;

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

    function setActiveFlowStep(index) {
      if (index === activeFlowIndex || !flowPreviewImg) return;
      activeFlowIndex = index;
      const step = flowSteps[index];
      flowSteps.forEach(s => s.classList.remove('is-current'));
      step.classList.add('is-current');
      flowPreviewImg.style.opacity = '0';
      clearTimeout(flowImgTimeout);
      flowImgTimeout = setTimeout(() => {
        flowPreviewImg.src = step.dataset.flowImg;
        flowPreviewImg.style.opacity = '1';
      }, 150);
    }

    let flowTicking = false;
    function updateFlowProgress() {
      flowTicking = false;
      const lineRect = flowLine.getBoundingClientRect();
      const triggerY = window.innerHeight * TRIGGER_RATIO;
      const progressPx = Math.max(0, Math.min(lineRect.height, triggerY - lineRect.top));
      flowFill.style.height = progressPx + 'px';
      let lastFilled = 0;
      flowIcons.forEach((icon, i) => {
        const iconRect = icon.getBoundingClientRect();
        const iconCenter = (iconRect.top + iconRect.height / 2) - lineRect.top;
        const isFilled = iconCenter <= progressPx + 1;
        icon.classList.toggle('is-filled', isFilled);
        if (isFilled) lastFilled = i;
      });
      setActiveFlowStep(lastFilled);
    }
    function onFlowScroll() {
      if (!flowTicking) { requestAnimationFrame(updateFlowProgress); flowTicking = true; }
    }

    flowSteps.forEach((step, i) => {
      step.addEventListener('click', () => setActiveFlowStep(i));
    });

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

  /* ---------- Bloqueo de scroll con modal abierto ---------- */
  let scrollLockCount = 0;
  function lockBodyScroll() {
    scrollLockCount++;
    document.documentElement.style.overflowY = 'hidden';
  }
  function unlockBodyScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) document.documentElement.style.overflowY = '';
  }

});

