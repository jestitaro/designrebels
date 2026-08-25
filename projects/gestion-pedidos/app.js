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

  /* ---------- Cómo funciona: soltar el título fijo apenas la última
     card empieza a despegarse (evita que quede tapando/tapada) ---------- */
  const titleSticky = document.querySelector('.section-title-sticky');
  const stackCards = document.querySelectorAll('.stack .stack-card');
  const lastStackCard = stackCards[stackCards.length - 1];
  if (titleSticky && lastStackCard) {
    function syncTitleRelease() {
      const released = lastStackCard.getBoundingClientRect().top < 150;
      titleSticky.classList.toggle('is-released', released);
    }
    window.addEventListener('scroll', syncTitleRelease, { passive: true });
    syncTitleRelease();
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

