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

  /* ---------- Timeline "Cómo funciona": el usuario elige el paso a mano
     y la imagen del panel de al lado cambia con un fade ---------- */
  const flowEl = document.getElementById('flow');
  const flowLine = document.getElementById('flow-line');
  const flowFill = document.getElementById('flow-line-progress');
  const flowSteps = flowEl ? Array.from(flowEl.querySelectorAll('.flow-step')) : [];
  const flowIcons = flowSteps.map(step => step.querySelector('.flow-step__icon'));
  const flowPreviewImg = document.getElementById('flow-preview-img');

  if (flowEl && flowLine && flowFill && flowIcons.length) {
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

    function updateFlowFill(index) {
      const flowRect = flowEl.getBoundingClientRect();
      const firstRect = flowIcons[0].getBoundingClientRect();
      const activeRect = flowIcons[index].getBoundingClientRect();
      const top = (firstRect.top + firstRect.height / 2) - flowRect.top;
      const activeCenter = (activeRect.top + activeRect.height / 2) - flowRect.top;
      flowFill.style.height = Math.max(0, activeCenter - top) + 'px';
      flowIcons.forEach((icon, i) => icon.classList.toggle('is-filled', i === index));
    }

    function setActiveFlowStep(index) {
      if (index === activeFlowIndex || !flowPreviewImg) return;
      activeFlowIndex = index;
      const step = flowSteps[index];
      flowSteps.forEach(s => s.classList.remove('is-current'));
      step.classList.add('is-current');
      updateFlowFill(index);

      flowPreviewImg.classList.add('is-swapping');
      clearTimeout(flowImgTimeout);
      flowImgTimeout = setTimeout(() => {
        flowPreviewImg.src = step.dataset.flowImg;
        requestAnimationFrame(() => flowPreviewImg.classList.remove('is-swapping'));
      }, 220);
    }

    flowSteps.forEach((step, i) => {
      step.addEventListener('click', () => setActiveFlowStep(i));
    });

    layoutFlowLine();
    setActiveFlowStep(0);
    window.addEventListener('resize', layoutFlowLine);
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

