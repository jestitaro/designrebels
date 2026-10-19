/* Comportamiento del header/footer del site en la landing de Gestión de pedidos:
   drawer mobile, selector de idioma y modal de HubSpot Meetings (igual que la home). */
document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Drawer mobile ---------- */
  const burger = document.querySelector('.burger');
  const drawer = document.querySelector('.drawer');
  const overlay = document.querySelector('.drawer-overlay');
  const closeBtn = document.querySelector('.drawer-close');
  const body = document.body;

  function openMenu() {
    drawer.classList.add('open');
    overlay && overlay.classList.add('show');
    burger.classList.add('open', 'hidden');
    burger.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden';
  }
  function closeMenu() {
    drawer.classList.remove('open');
    overlay && overlay.classList.remove('show');
    burger.classList.remove('open', 'hidden');
    burger.setAttribute('aria-expanded', 'false');
    body.style.overflow = '';
  }

  if (burger && drawer) {
    burger.addEventListener('click', openMenu);
    closeBtn && closeBtn.addEventListener('click', closeMenu);
    overlay && overlay.addEventListener('click', closeMenu);
    drawer.querySelectorAll('a, .js-open-meetings').forEach(el => el.addEventListener('click', closeMenu));
  }

  /* ---------- Selector de idioma ---------- */
  const closeLangs = () => document.querySelectorAll('details.lang-switch[open]').forEach(d => d.removeAttribute('open'));
  document.addEventListener('click', (e) => {
    document.querySelectorAll('details.lang-switch[open]').forEach(d => {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  }, { passive: true });
  window.addEventListener('scroll', closeLangs, { passive: true });

  /* ---------- HubSpot Meetings ---------- */
  const modal = document.getElementById('meetings-modal');
  const root = document.getElementById('meetings-root');
  let injected = false;
  const meetingUrl = 'https://meetings.hubspot.com/agustin-goni-piuma/demoweb?embed=true';

  function openModal() {
    modal.style.display = 'grid';
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (injected) return;
    injected = true;
    const cont = document.createElement('div');
    cont.className = 'meetings-iframe-container';
    cont.setAttribute('data-src', meetingUrl);
    root.appendChild(cont);
    const s = document.createElement('script');
    s.src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';
    s.async = true;
    document.body.appendChild(s);
    // Fallback si el script de HubSpot no arma el widget (p. ej. bloqueado)
    setTimeout(() => {
      if (!cont.querySelector('iframe')) {
        const iframe = document.createElement('iframe');
        iframe.src = meetingUrl;
        iframe.title = modal.querySelector('[role="dialog"]').getAttribute('aria-label');
        cont.innerHTML = '';
        cont.appendChild(iframe);
      }
    }, 3000);
  }
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    document.documentElement.style.overflow = '';
    body.style.overflow = '';
  }

  if (modal && root) {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.js-open-meetings')) { e.preventDefault(); openModal(); }
      if (e.target.hasAttribute && e.target.hasAttribute('data-close')) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeLangs();
    if (modal && modal.style.display !== 'none') closeModal();
  });
});
