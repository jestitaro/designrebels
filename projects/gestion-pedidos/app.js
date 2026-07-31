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
  const openDrawer = () => { drawer.classList.add('is-open'); drawerOverlay.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); };
  const closeDrawer = () => { drawer.classList.remove('is-open'); drawerOverlay.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
  burger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a, button').forEach(el => el.addEventListener('click', closeDrawer));

  /* ---------- Scroll helpers ---------- */
  document.querySelectorAll('.js-scroll-demo').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' }));
  });
  document.querySelectorAll('.js-scroll-simulador').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('simulador').scrollIntoView({ behavior: 'smooth' }));
  });

  /* ---------- Carrusel de beneficios ---------- */
  const carouselTrack = document.getElementById('beneficios-track');
  const carouselPrev = document.getElementById('beneficios-prev');
  const carouselNext = document.getElementById('beneficios-next');
  if (carouselTrack && carouselPrev && carouselNext) {
    const scrollByCard = (dir) => {
      const card = carouselTrack.querySelector('.carousel-card');
      const amount = card ? card.getBoundingClientRect().width + 24 : carouselTrack.clientWidth * 0.8;
      carouselTrack.scrollBy({ left: dir * amount, behavior: 'smooth' });
    };
    const updateNavState = () => {
      const max = carouselTrack.scrollWidth - carouselTrack.clientWidth - 1;
      carouselPrev.disabled = carouselTrack.scrollLeft <= 0;
      carouselNext.disabled = carouselTrack.scrollLeft >= max;
    };
    carouselPrev.addEventListener('click', () => scrollByCard(-1));
    carouselNext.addEventListener('click', () => scrollByCard(1));
    carouselTrack.addEventListener('scroll', updateNavState, { passive: true });
    window.addEventListener('resize', updateNavState);
    updateNavState();
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

  /* =========================================================
     SIMULADOR
     ========================================================= */
  const money = (n) => '$ ' + Math.round(n).toLocaleString('es-AR');

  const defaultBrand = { name: 'NutriPlus', logo: null };
  const defaultProducts = [
    { id: 'p1', name: 'NutriPlus Vainilla', price: 7200, configured: 7200, img: null, qty: 0 },
    { id: 'p2', name: 'NutriPlus Chocolate', price: 3827, configured: 5500, img: null, qty: 0 },
    { id: 'p3', name: 'NutriPlus Banana', price: 5450, configured: 7250, img: null, qty: 0 },
    { id: 'p4', name: 'NutriPlus Frutilla', price: 6200, configured: 6800, img: null, qty: 0 },
    { id: 'p5', name: 'NutriPlus Mango', price: 4598, configured: 9300, img: null, qty: 0 },
  ];

  let brand = JSON.parse(JSON.stringify(defaultBrand));
  let products = JSON.parse(JSON.stringify(defaultProducts));
  let currentStep = 1;

  const simApp = document.getElementById('simulator-app');
  const steps = simApp.querySelectorAll('.sim-step');
  const progressItems = document.querySelectorAll('.sim-progress__item');

  function goToStep(step) {
    currentStep = step;
    steps.forEach(s => { s.hidden = s.dataset.step != step; });
    progressItems.forEach(p => {
      const n = Number(p.dataset.progress);
      p.classList.toggle('is-active', n === step);
      p.classList.toggle('is-done', n < step);
    });
  }

  simApp.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goto = btn.dataset.goto;
      goToStep(goto === '3' ? 3 : Number(goto));
    });
  });

  /* --- Paso 1: habilitar "Guardar y continuar" --- */
  const simCliente = document.getElementById('sim-cliente');
  const simSucursal = document.getElementById('sim-sucursal');
  const simFechaPedido = document.getElementById('sim-fecha-pedido');
  const step1Next = simApp.querySelector('.sim-step[data-step="1"] .sim-btn-next');

  simFechaPedido.value = new Date().toLocaleDateString('es-AR');

  function checkStep1() {
    step1Next.disabled = !(simCliente.value.trim() && simSucursal.value);
  }
  simCliente.addEventListener('input', checkStep1);
  simSucursal.addEventListener('change', checkStep1);

  /* --- Paso 2: tabla de productos --- */
  const tbody = document.getElementById('sim-product-tbody');
  const runningTotalEl = document.getElementById('sim-running-total');
  const step2Next = simApp.querySelector('.sim-step[data-step="2"] .sim-btn-next');

  function productThumb(p) {
    if (p.img) return `<img class="sim-product-thumb" src="${p.img}" alt="" style="border-radius:8px;object-fit:cover;" />`;
    return `<span class="sim-product-thumb" aria-hidden="true"></span>`;
  }

  function renderProducts() {
    tbody.innerHTML = products.map(p => {
      const modified = p.price < p.configured;
      return `
        <tr data-id="${p.id}">
          <td>
            <div class="sim-product-name">
              ${productThumb(p)}
              <span>${p.name}</span>
            </div>
          </td>
          <td>
            <span class="sim-price ${modified ? 'is-modified' : ''}">${money(p.price)}</span>
            ${modified ? `<span class="sim-price-warn" data-id="${p.id}" title="Ver precio configurado"><i class="fa-regular fa-triangle-exclamation" aria-hidden="true"></i> ajustado</span>` : ''}
          </td>
          <td><input class="sim-qty-input" type="number" min="0" value="${p.qty || ''}" placeholder="0" data-id="${p.id}" /></td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.sim-qty-input').forEach(input => {
      input.addEventListener('input', () => {
        const p = products.find(x => x.id === input.dataset.id);
        p.qty = Math.max(0, Number(input.value) || 0);
        updateTotals();
      });
    });

    tbody.querySelectorAll('.sim-price-warn').forEach(badge => {
      badge.addEventListener('click', () => {
        const p = products.find(x => x.id === badge.dataset.id);
        alert(`Precio configurado: ${money(p.configured)}\nPrecio ingresado: ${money(p.price)}\n\nEsto se confirma antes de cerrar el pedido, igual que en la app real.`);
      });
    });
  }

  function currentTotal() {
    return products.reduce((sum, p) => sum + (p.qty * p.price), 0);
  }

  function updateTotals() {
    const total = currentTotal();
    runningTotalEl.textContent = 'Total: ' + money(total);
    step2Next.disabled = total <= 0;
  }

  /* --- Paso 3: resumen --- */
  const summaryTotalValue = document.getElementById('sim-summary-total-value');
  const summaryOc = document.getElementById('sim-summary-oc');
  const summarySucursal = document.getElementById('sim-summary-sucursal');
  const summaryItems = document.getElementById('sim-summary-items');

  function renderSummary() {
    summaryTotalValue.textContent = money(currentTotal());
    summaryOc.textContent = String(Math.floor(100000 + Math.random() * 800000));
    summarySucursal.textContent = simSucursal.value || '—';
    summaryItems.innerHTML = products.filter(p => p.qty > 0).map(p => `
      <div class="sim-summary-item">
        ${p.img ? `<img src="${p.img}" alt="" />` : `<span class="sim-product-thumb" style="width:40px;height:40px;border-radius:8px;display:block;"></span>`}
        <span class="name">${p.name}</span>
        <span class="qty">x${p.qty}</span>
        <span class="subtotal">${money(p.qty * p.price)}</span>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:.88rem;">No agregaste productos.</p>';
  }

  const observeStep3 = new MutationObserver(() => {
    const step3 = simApp.querySelector('.sim-step[data-step="3"]');
    if (!step3.hidden) renderSummary();
  });
  observeStep3.observe(simApp, { attributes: true, subtree: true, attributeFilter: ['hidden'] });

  /* --- Enviar pedido --- */
  document.getElementById('sim-btn-enviar').addEventListener('click', (e) => {
    e.currentTarget.blur();
    steps.forEach(s => s.hidden = true);
    const successStep = simApp.querySelector('.sim-step--success');
    successStep.hidden = false;
    progressItems.forEach(p => p.classList.add('is-done'));
    successStep.setAttribute('tabindex', '-1');
    successStep.focus({ preventScroll: true });
    successStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function resetSimulator() {
    products = JSON.parse(JSON.stringify(defaultProducts));
    simCliente.value = '';
    simSucursal.value = '';
    document.getElementById('sim-fecha-envio').value = '';
    checkStep1();
    renderProducts();
    updateTotals();
    goToStep(1);
  }
  document.getElementById('btn-restart-sim').addEventListener('click', resetSimulator);
  document.getElementById('btn-restart-sim-2').addEventListener('click', resetSimulator);

  renderProducts();
  updateTotals();

  /* =========================================================
     TOUR GUIADO
     ========================================================= */
  const tourPromptOverlay = document.getElementById('tour-prompt-overlay');
  let tourPromptShown = false;

  function maybeShowTourPrompt() {
    if (tourPromptShown) return;
    tourPromptShown = true;
    tourPromptOverlay.hidden = false;
    lockBodyScroll();
    setTimeout(() => {
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT' && active.hasAttribute('list')) {
        const listId = active.getAttribute('list');
        active.removeAttribute('list');
        active.blur();
        setTimeout(() => active.setAttribute('list', listId), 50);
      } else {
        active?.blur();
      }
    }, 0);
  }
  simApp.addEventListener('focusin', maybeShowTourPrompt);
  simApp.addEventListener('pointerdown', maybeShowTourPrompt);

  document.getElementById('tour-skip').addEventListener('click', () => { tourPromptOverlay.hidden = true; unlockBodyScroll(); });
  tourPromptOverlay.addEventListener('click', (e) => { if (e.target === tourPromptOverlay) { tourPromptOverlay.hidden = true; unlockBodyScroll(); } });

  const tourSteps = [
    { selector: '#sim-cliente', step: 1, text: 'Tu cliente busca su nombre acá. El sistema ya conoce sus condiciones comerciales.' },
    { selector: '#sim-sucursal', step: 1, text: 'Elige la sucursal donde quiere recibir el pedido.' },
    { selector: '.sim-step[data-step="1"] .sim-btn-next', step: 1, text: 'Guarda y pasa a elegir productos.', action: () => { simCliente.value = 'Farmacia del Sud'; simSucursal.value = 'Casa Central'; checkStep1(); } },
    { selector: '.sim-table', step: 2, text: 'Acá carga cantidades. Los precios ya vienen actualizados según su lista.' },
    { selector: '.sim-price-warn', step: 2, text: 'Si un precio quedó por debajo del configurado, queda marcado para revisar antes de confirmar.', optional: true },
    { selector: '.sim-step[data-step="2"] .sim-btn-next', step: 2, text: 'Con el pedido cargado, avanza a la revisión final.', action: () => { const p = products.find(x => x.id === 'p1'); p.qty = 12; renderProducts(); updateTotals(); } },
    { selector: '#sim-btn-enviar', step: 3, text: 'Revisa el resumen y envía. Así de simple es todo el proceso para tu cliente.' },
  ];

  let tourIndex = 0;
  let tourOverlay, tourSpotlight, tourTooltip;

  function buildTourOverlay() {
    tourOverlay = document.createElement('div');
    tourOverlay.className = 'tour-overlay';
    tourSpotlight = document.createElement('div');
    tourSpotlight.className = 'tour-spotlight';
    tourTooltip = document.createElement('div');
    tourTooltip.className = 'tour-tooltip';
    document.body.append(tourOverlay, tourSpotlight, tourTooltip);
  }

  function positionTour(el, text) {
    const rect = el.getBoundingClientRect();
    const pad = 8;
    tourSpotlight.style.top = (rect.top - pad) + 'px';
    tourSpotlight.style.left = (rect.left - pad) + 'px';
    tourSpotlight.style.width = (rect.width + pad * 2) + 'px';
    tourSpotlight.style.height = (rect.height + pad * 2) + 'px';

    tourTooltip.innerHTML = `
      <p>${text}</p>
      <div class="tour-tooltip__footer">
        <span class="tour-tooltip__step">Paso ${tourIndex + 1} de ${tourSteps.length}</span>
        <div class="tour-tooltip__actions">
          <button class="btn btn-ghost" id="tour-exit-btn" type="button">Salir</button>
          <button class="btn btn-gradient" id="tour-next-btn" type="button">${tourIndex === tourSteps.length - 1 ? 'Listo' : 'Siguiente'}</button>
        </div>
      </div>`;

    let top = rect.bottom + 16;
    let left = rect.left;
    if (top + 140 > window.innerHeight) top = Math.max(16, rect.top - 156);
    if (left + 290 > window.innerWidth) left = window.innerWidth - 306;
    tourTooltip.style.top = top + 'px';
    tourTooltip.style.left = Math.max(16, left) + 'px';

    document.getElementById('tour-next-btn').addEventListener('click', nextTourStep);
    document.getElementById('tour-exit-btn').addEventListener('click', endTour);
  }

  function runTourStep() {
    const step = tourSteps[tourIndex];
    if (!step) return endTour();
    goToStep(step.step);
    if (step.action) step.action();
    requestAnimationFrame(() => {
      const el = document.querySelector(step.selector);
      if (!el) return nextTourStep();
      const prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      el.scrollIntoView({ behavior: 'auto', block: 'center' });
      document.documentElement.style.scrollBehavior = prevBehavior;
      requestAnimationFrame(() => positionTour(el, step.text));
    });
  }

  function nextTourStep() {
    tourIndex++;
    if (tourIndex >= tourSteps.length) return endTour();
    runTourStep();
  }

  function endTour() {
    tourOverlay?.remove(); tourSpotlight?.remove(); tourTooltip?.remove();
    tourOverlay = tourSpotlight = tourTooltip = null;
  }

  document.getElementById('tour-start').addEventListener('click', () => {
    tourPromptOverlay.hidden = true;
    unlockBodyScroll();
    tourIndex = 0;
    buildTourOverlay();
    runTourStep();
  });

  /* =========================================================
     PANEL "PERSONALIZAR DEMO"
     ========================================================= */
  const pzOverlay = document.getElementById('personalize-overlay');
  const pzBrandName = document.getElementById('pz-brand-name');
  const pzLogoInput = document.getElementById('pz-logo-input');
  const pzProducts = document.getElementById('pz-products');
  const demoBrandNameEl = document.getElementById('demo-brand-name');
  const demoLogoPreview = document.getElementById('demo-logo-preview');
  const demoLogoIcon = document.getElementById('demo-logo-icon');

  let pendingLogo = null;
  let pendingProductImages = {};

  function openPersonalize() {
    pzBrandName.value = brand.name;
    pzProducts.innerHTML = products.map((p, i) => `
      <div class="pz-product-row" data-id="${p.id}">
        <img src="${p.img || ''}" alt="" style="${p.img ? '' : 'background:var(--surface);'}" />
        <input type="text" value="${p.name}" data-field="name" data-id="${p.id}" />
        <input type="file" accept="image/*" data-field="img" data-id="${p.id}" />
      </div>
    `).join('');

    pzProducts.querySelectorAll('input[data-field="img"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          pendingProductImages[input.dataset.id] = ev.target.result;
          input.closest('.pz-product-row').querySelector('img').src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    pzOverlay.hidden = false;
    lockBodyScroll();
  }

  document.getElementById('btn-personalize').addEventListener('click', openPersonalize);
  document.getElementById('personalize-close').addEventListener('click', () => { pzOverlay.hidden = true; unlockBodyScroll(); });
  pzOverlay.addEventListener('click', (e) => { if (e.target === pzOverlay) { pzOverlay.hidden = true; unlockBodyScroll(); } });

  pzLogoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { pendingLogo = ev.target.result; };
    reader.readAsDataURL(file);
  });

  document.getElementById('pz-apply').addEventListener('click', () => {
    brand.name = pzBrandName.value.trim() || defaultBrand.name;
    if (pendingLogo) brand.logo = pendingLogo;

    pzProducts.querySelectorAll('input[data-field="name"]').forEach(input => {
      const p = products.find(x => x.id === input.dataset.id);
      if (p) p.name = input.value.trim() || p.name;
    });
    Object.entries(pendingProductImages).forEach(([id, src]) => {
      const p = products.find(x => x.id === id);
      if (p) p.img = src;
    });

    applyBrandToUI();
    renderProducts();
    renderSummary();
    pzOverlay.hidden = true;
    unlockBodyScroll();
  });
  document.getElementById('pz-reset').addEventListener('click', () => {
    brand = JSON.parse(JSON.stringify(defaultBrand));
    products = JSON.parse(JSON.stringify(defaultProducts));
    pendingLogo = null;
    pendingProductImages = {};
    applyBrandToUI();
    renderProducts();
    updateTotals();
    pzOverlay.hidden = true;
    unlockBodyScroll();
  });

  function applyBrandToUI() {
    demoBrandNameEl.textContent = brand.name;
    if (brand.logo) {
      demoLogoPreview.src = brand.logo;
      demoLogoPreview.hidden = false;
      demoLogoIcon.hidden = true;
    } else {
      demoLogoPreview.removeAttribute('src');
      demoLogoPreview.hidden = true;
      demoLogoIcon.hidden = false;
    }
  }
  applyBrandToUI();

  /* =========================================================
     FORMULARIOS
     ========================================================= */
  const demoForm = document.getElementById('demo-form');
  demoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('demo-form-note').hidden = false;
    demoForm.reset();
  });

});
