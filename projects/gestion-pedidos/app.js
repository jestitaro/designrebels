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

  /* ---------- Cómo funciona: scrollytelling con cards en acordeón.
     La sección entera queda fija mientras se recorren los 5 pasos;
     cada paso se abre en su turno y los anteriores quedan como
     pestañas angostas que se pueden volver a abrir con un click. ---------- */
  const stackScroll = document.getElementById('stack-scroll');
  const stackCards = stackScroll ? Array.from(stackScroll.querySelectorAll('.stack-card')) : [];
  if (stackScroll && stackCards.length) {
    const TOTAL = stackCards.length;
    let activeStep = -1;

    function setActiveStep(index) {
      if (index === activeStep) return;
      activeStep = index;
      stackCards.forEach((card, i) => {
        card.classList.toggle('is-active', i === index);
        card.classList.toggle('is-collapsed', i < index);
        card.classList.toggle('is-upcoming', i > index);
      });
    }

    function getProgress() {
      const rect = stackScroll.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return 0;
      return Math.min(1, Math.max(0, -rect.top / scrollable));
    }

    function onStackScroll() {
      const idx = Math.min(TOTAL - 1, Math.max(0, Math.floor(getProgress() * TOTAL)));
      setActiveStep(idx);
    }

    stackCards.forEach((card, i) => {
      card.addEventListener('click', () => {
        const rect = stackScroll.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        if (scrollable <= 0) return;
        const targetProgress = (i + 0.5) / TOTAL;
        window.scrollTo({ top: window.scrollY + rect.top + targetProgress * scrollable, behavior: 'smooth' });
      });
    });

    window.addEventListener('scroll', onStackScroll, { passive: true });
    window.addEventListener('resize', onStackScroll);
    onStackScroll();
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

