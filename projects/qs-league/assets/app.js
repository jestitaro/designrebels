/* Dino Cup — public landing.
   Read-only: podium, resultados parciales, campeones, reglas, próximamente.
   Standings are always *derived* from live dinocup_players + dinocup_movements
   (status APPLIED) — nothing here writes to Firestore. All mutating actions
   (cargar resultados, aplicar descuentos, anular) live in assets/admin.js
   behind an authenticated admin session. */

(function () {
const { fmt, fmtPoints, house, longDate } = window.DinoCupData;

/* ---------- helpers ---------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
function renderIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
}

/* ---------- live state (players + applied movements) ---------- */
let players = [];
let movements = [];

function movementTime(movement) {
  return typeof movement.createdAt?.toMillis === 'function' ? movement.createdAt.toMillis() : Date.now();
}

function computeStandings() {
  const totals = new Map(players.map(p => [p.id, { ...p, points: 0, medals: { gold: 0, silver: 0, bronze: 0 } }]));
  const ledger = [];
  movements.forEach(movement => {
    const total = totals.get(movement.playerId);
    if (!total) return;
    total.points += movement.points || 0;
    if (movement.type === 'REPORT_RESULT') {
      if (movement.points === 3) total.medals.gold += 1;
      else if (movement.points === 2) total.medals.silver += 1;
      else if (movement.points === 1) total.medals.bronze += 1;
    }
    ledger.push(movement);
  });
  ledger.sort((a, b) => movementTime(b) - movementTime(a));
  return { totals, ledger };
}
function standingsPlayers() {
  const { totals } = computeStandings();
  return [...totals.values()]
    .sort((a, b) => (b.points - a.points) || (b.medals.gold - a.medals.gold) || (b.medals.silver - a.medals.silver) || a.name.localeCompare(b.name, 'es'));
}

/* ---------- rendering ---------- */
function podiumCardHtml(item, place) {
  const h = house(item.house);
  const crown = place === 1 ? '<i class="crown" data-lucide="crown" aria-hidden="true"></i>' : '';
  const subtitle = item.role || h.name;
  return `<article class="podium-card podium-card--${place === 1 ? 'first' : place === 2 ? 'second' : 'third'}">
    ${crown}
    <span class="podium-rank">0${place}</span>
    <div class="avatar-ring"><span>${item.name.charAt(0).toUpperCase()}</span></div>
    <h2>${item.name}</h2>
    <p>${subtitle}</p>
    <div class="medals" aria-label="Medallas">
      <span class="medal medal--gold"><i data-lucide="medal"></i><b>${item.medals.gold}</b></span>
      <span class="medal medal--silver"><i data-lucide="medal"></i><b>${item.medals.silver}</b></span>
      <span class="medal medal--bronze"><i data-lucide="medal"></i><b>${item.medals.bronze}</b></span>
    </div>
    <strong class="score"><i data-lucide="star" aria-hidden="true"></i><span>${fmt(item.points)}</span></strong>
  </article>`;
}
function renderPodium(rows) {
  const podium = $('.podium');
  if (!podium) return;
  const top3 = rows.slice(0, 3);
  const order = [1, 0, 2].filter(index => top3[index]);
  podium.innerHTML = order.map(index => podiumCardHtml(top3[index], index + 1)).join('');
}

function competitorLiHtml(item, position, prefix) {
  const h = house(item.house);
  const negative = item.points < 0 ? ` ${prefix}__points--negative` : '';
  return `<li>
    <span class="${prefix}__position">${String(position).padStart(2, '0')}</span>
    <span class="${prefix}__avatar ${prefix}__avatar--${h.avatarClass}">${item.name.charAt(0).toUpperCase()}</span>
    <span class="${prefix}__info"><strong>${item.name}</strong><small>${h.name}</small></span>
    <span class="${prefix}__points${negative}">${fmtPoints(item.points)}</span>
  </li>`;
}
function renderCompetitorLists(rows) {
  const rest = rows.slice(3);
  const visible = rest.slice(0, 3);
  const extra = rest.slice(3);

  const mobileVisible = $('.mobile-competitors__list--visible');
  if (mobileVisible) mobileVisible.innerHTML = visible.map((item, i) => competitorLiHtml(item, i + 4, 'mobile-competitor')).join('');

  const mobileExtraList = $('#allCompetitors .mobile-competitors__list');
  if (mobileExtraList) {
    mobileExtraList.setAttribute('start', '7');
    mobileExtraList.innerHTML = extra.map((item, i) => competitorLiHtml(item, i + 7, 'mobile-competitor')).join('');
  }

  const desktopList = $('.desktop-competitors__list');
  if (desktopList) desktopList.innerHTML = visible.map((item, i) => competitorLiHtml(item, i + 4, 'desktop-competitor')).join('');
}

function renderResultsModal(rows) {
  const list = $('.partial-ranking-list');
  if (list) {
    list.innerHTML = rows.map((item, index) => {
      const h = house(item.house);
      const negative = item.points < 0 ? ' partial-score--negative' : '';
      const subtitle = `${h.name}${item.role ? ' · ' + item.role : ''}`;
      return `<li>
        <span class="partial-position">${String(index + 1).padStart(2, '0')}</span>
        <span class="partial-avatar partial-avatar--${h.avatarClass}">${item.name.charAt(0).toUpperCase()}</span>
        <span class="partial-player"><strong>${item.name}</strong><small>${subtitle}</small></span>
        <span class="partial-score${negative}">${fmtPoints(item.points)}</span>
      </li>`;
    }).join('');
  }
  const count = $('#participantsCount');
  if (count) count.textContent = `${rows.length} participantes`;

  const { ledger } = computeStandings();
  const activityList = $('.activity-list');
  if (activityList) {
    activityList.innerHTML = ledger.slice(0, 12).map(movement => {
      const delta = movement.points > 0 ? `+${movement.points}` : fmtPoints(movement.points);
      return `<li${movement.points < 0 ? ' class="activity-list__negative"' : ''}><div><strong>${movement.playerName || '—'} ${delta}</strong><small>${movement.reason || ''}</small></div></li>`;
    }).join('');
  }
}

function renderSeasonChip() {
  const chip = $('#lastFechaChip');
  if (!chip) return;
  const dated = movements
    .filter(movement => movement.type === 'REPORT_RESULT' && movement.sessionDate)
    .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))[0];
  chip.textContent = dated ? dated.sessionDate.split('-').reverse().join('/') : '—';
}

function render() {
  if (!players.length) return;
  const rows = standingsPlayers();
  renderPodium(rows);
  renderCompetitorLists(rows);
  renderResultsModal(rows);
  renderSeasonChip();
  renderIcons();
}

/* ---------- Firestore subscriptions ---------- */
function initLiveData() {
  const fb = window.DinoCupFirebase;
  if (!fb) return;
  fb.players.subscribe(data => { players = data; render(); });
  fb.movements.subscribeApplied(data => { movements = data; render(); });
}

/* ---------- DOM refs ---------- */
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
const navLinks = $$('.nav-link');

const legendsModal = $('#legendsModal');
const openLegendsButtons = $$('[data-open-legends]');
const closeLegendsButtons = $$('[data-close-legends]');

const rulesModal = $('#rulesModal');
const openRulesButtons = $$('[data-open-rules]');
const closeRulesButtons = $$('[data-close-rules]');

const resultsModal = $('#resultsModal');
const openResultsButtons = $$('[data-open-results]');
const closeResultsButtons = $$('[data-close-results]');

/* ---------- modals ---------- */
function toggleModal(modal, open, focusTarget) {
  modal.classList.toggle('is-open', open);
  modal.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('modal-open', open || $$('.modal.is-open').length > 0);
  if (open) window.setTimeout(() => modal.querySelector('.modal-close')?.focus(), 150);
  else focusTarget?.focus();
}
function openLegendsModal() { toggleModal(legendsModal, true); }
function closeLegendsModal() { toggleModal(legendsModal, false, $('[data-open-legends]')); }
function openRulesModal() { toggleModal(rulesModal, true); }
function closeRulesModal() { toggleModal(rulesModal, false, $('[data-open-rules]')); }
function openResultsModal(rankingOnly) {
  resultsModal.classList.toggle('results-modal--ranking-only', Boolean(rankingOnly));
  toggleModal(resultsModal, true);
}
function closeResultsModal() { toggleModal(resultsModal, false, $('[data-open-results]')); }

/* ---------- bindings ---------- */
function bind() {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  openLegendsButtons.forEach(button => button.addEventListener('click', openLegendsModal));
  openRulesButtons.forEach(button => button.addEventListener('click', openRulesModal));
  openResultsButtons.forEach(button => button.addEventListener('click', () => openResultsModal(button.hasAttribute('data-ranking-only'))));

  closeLegendsButtons.forEach(button => button.addEventListener('click', closeLegendsModal));
  closeRulesButtons.forEach(button => button.addEventListener('click', closeRulesModal));
  closeResultsButtons.forEach(button => button.addEventListener('click', closeResultsModal));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (legendsModal.classList.contains('is-open')) closeLegendsModal();
    if (rulesModal.classList.contains('is-open')) closeRulesModal();
    if (resultsModal.classList.contains('is-open')) closeResultsModal();
  });

  const competitorsToggle = $('#competitorsToggle');
  const allCompetitors = $('#allCompetitors');
  competitorsToggle?.addEventListener('click', () => {
    const isOpen = allCompetitors.classList.toggle('is-open');
    competitorsToggle.setAttribute('aria-expanded', String(isOpen));
    const label = $('span', competitorsToggle);
    if (label) label.textContent = isOpen ? 'Ocultar competidores' : 'Ver todos los competidores';
  });
}

/* ---------- scroll reveal + active nav + pointer parallax + particles ---------- */
function initReveal() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  $$('.reveal').forEach(el => observer.observe(el));
}
function initActiveNav() {
  const sections = $$('main section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-35% 0px -55%' });
  sections.forEach(section => observer.observe(section));
}
function initParticles(amount = 28) {
  const container = $('#particles');
  if (!container) return;
  const colors = ['#15d9ff', '#ff35c7', '#8347ff'];
  for (let index = 0; index < amount; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.color = colors[index % colors.length];
    particle.style.animationDuration = `${12 + Math.random() * 14}s`;
    particle.style.animationDelay = `${Math.random() * -20}s`;
    particle.style.opacity = String(0.25 + Math.random() * 0.5);
    container.appendChild(particle);
  }
}
function initPointerParallax() {
  window.addEventListener('pointermove', event => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    document.documentElement.style.setProperty('--pointer-x', String(x));
    document.documentElement.style.setProperty('--pointer-y', String(y));
    $$('.podium-card').forEach((card, index) => {
      const strength = index === 1 ? 7 : 4;
      card.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
  });
  window.addEventListener('pointerleave', () => $$('.podium-card').forEach(card => { card.style.transform = ''; }));
}

/* ---------- init ---------- */
function init() {
  renderIcons();
  bind();
  initReveal();
  initActiveNav();
  initParticles();
  initPointerParallax();
  initLiveData();
}
init();
})();
