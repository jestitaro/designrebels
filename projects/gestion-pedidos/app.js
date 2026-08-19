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
  document.querySelectorAll('.js-scroll-simulador').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('simulador').scrollIntoView({ behavior: 'smooth' }));
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
     SIMULADOR — Gestor de pedidos
     ========================================================= */
  const money = (n) => '$ ' + Math.round(n).toLocaleString('es-AR');
  const fechaHoy = () => new Date().toLocaleDateString('es-AR');

  const defaultBrand = { name: 'NutriPlus', logo: null };

  /* --- Catálogo ficticio de productos (marca / código / stock / precios) --- */
  const catalog = [
    { id: 'e1', marca: 'NutriPlus', codigo: '6922244700697', sku: 'S619 VV400', nombre: 'NUTRIPLUS FRUTILLA RPB', pres: '220 ml.', uxb: 24, stock: 'Disponible', psl: 6500.00, desc: 15 },
    { id: 'e2', marca: 'NutriPlus', codigo: '6922244700698', sku: 'S620 VV401', nombre: 'NUTRIPLUS BANANA', pres: '240 ml.', uxb: 30, stock: 'Disponible', psl: 8500.50, desc: 15 },
    { id: 'e3', marca: 'NutriPlus', codigo: '6922244700699', sku: 'S621 VV402', nombre: 'NUTRIPLUS CHOCOLATE', pres: '200 ml.', uxb: 12, stock: 'Agotado', psl: 5500.00, desc: 10 },
    { id: 'e4', marca: 'NutriPlus', codigo: '6922244700700', sku: 'S622 VV403', nombre: 'NUTRIPLUS VAINILLA', pres: '225 ml.', uxb: 18, stock: 'Disponible', psl: 7250.75, desc: 25 },
    { id: 'e5', marca: 'NutriPlus', codigo: '6922244700701', sku: 'S623 VV404', nombre: 'NUTRIPLUS FRUTILLA', pres: '210 ml.', uxb: 15, stock: 'Disponible', psl: 6800.30, desc: 5 },
    { id: 'e6', marca: 'NutriPlus', codigo: '6922244700702', sku: 'S624 VV405', nombre: 'NUTRIPLUS MANGO', pres: '250 ml.', uxb: 20, stock: 'Disponible', psl: 9300.00, desc: 30 },
    { id: 'v1', marca: 'VitaCare', codigo: '6922244700710', sku: 'S630 VV410', nombre: 'VITACARE COMPLETO VAINILLA', pres: '237 ml.', uxb: 24, stock: 'Disponible', psl: 7100.00, desc: 12 },
    { id: 'v2', marca: 'VitaCare', codigo: '6922244700711', sku: 'S631 VV411', nombre: 'VITACARE COMPLETO CHOCOLATE', pres: '237 ml.', uxb: 24, stock: 'Disponible', psl: 7100.00, desc: 12 },
    { id: 'p1', marca: 'PediaVital', codigo: '6922244700720', sku: 'S640 VV420', nombre: 'PEDIAVITAL VAINILLA', pres: '235 ml.', uxb: 18, stock: 'Disponible', psl: 6980.00, desc: 8 },
    { id: 'p2', marca: 'PediaVital', codigo: '6922244700721', sku: 'S641 VV421', nombre: 'PEDIAVITAL CHOCOLATE', pres: '235 ml.', uxb: 18, stock: 'Agotado', psl: 6980.00, desc: 8 },
    { id: 'h1', marca: 'HidraPlus', codigo: '6922244700730', sku: 'S650 VV430', nombre: 'HIDRAPLUS NARANJA', pres: '500 ml.', uxb: 12, stock: 'Disponible', psl: 3200.00, desc: 0 },
    { id: 'h2', marca: 'HidraPlus', codigo: '6922244700731', sku: 'S651 VV431', nombre: 'HIDRAPLUS UVA', pres: '500 ml.', uxb: 12, stock: 'Disponible', psl: 3200.00, desc: 0 },
    { id: 'o1', marca: 'Otros', codigo: '6922244700740', sku: 'S660 VV440', nombre: 'BARRA PROTEICA MIX FRUTOS', pres: '40 g.', uxb: 20, stock: 'Disponible', psl: 1850.00, desc: 0 },
  ];
  const priceFor = (p) => p.psl * (1 - p.desc / 100);

  /* --- Pedidos ficticios del listado --- */
  const defaultPedidos = [
    { id: 1, fecha: '18/08/2026', numero: 69, cliente: 'Farmacia del Sud', sucursal: 'Casa Central', total: 0, estado: 'Borrador' },
    { id: 2, fecha: '18/08/2026', numero: 68, cliente: 'Drogueria Central', sucursal: 'Sucursal Norte', total: 1928448.00, estado: 'Pendiente' },
    { id: 3, fecha: '18/08/2026', numero: 67, cliente: 'Distribuidora Norte', sucursal: 'Sucursal Santa Rosa', total: 26300.68, estado: 'Creado Parcialmente' },
    { id: 4, fecha: '18/08/2026', numero: 66, cliente: 'Farmacia San Martín', sucursal: 'Casa Central', total: 208978.56, estado: 'No Creado' },
    { id: 5, fecha: '18/08/2026', numero: 65, cliente: 'Nutrihogar SRL', sucursal: 'Sucursal Norte', total: 384819.40, estado: 'Creado Completo' },
    { id: 6, fecha: '13/08/2026', numero: 64, cliente: 'Farmacia del Sud', sucursal: 'Sucursal Santa Rosa', total: 846709.20, estado: 'Creado Completo' },
    { id: 7, fecha: '13/08/2026', numero: 63, cliente: 'Drogueria Central', sucursal: 'Casa Central', total: 85871.83, estado: 'Creado Completo' },
    { id: 8, fecha: '13/08/2026', numero: 62, cliente: 'Distribuidora Norte', sucursal: 'Sucursal Norte', total: 119149.22, estado: 'Creado Parcialmente' },
    { id: 9, fecha: '13/08/2026', numero: 61, cliente: 'Farmacia San Martín', sucursal: 'Sucursal Santa Rosa', total: 42757.73, estado: 'No Creado' },
    { id: 10, fecha: '12/08/2026', numero: 60, cliente: 'Nutrihogar SRL', sucursal: 'Casa Central', total: 168313.45, estado: 'Creado Completo' },
  ];
  const estadoBadgeClass = {
    'Borrador': 'sim-badge--borrador',
    'Pendiente': 'sim-badge--pendiente',
    'Creado Parcialmente': 'sim-badge--parcial',
    'No Creado': 'sim-badge--no-creado',
    'Creado Completo': 'sim-badge--completo',
  };

  let brand = JSON.parse(JSON.stringify(defaultBrand));
  let pedidosData = JSON.parse(JSON.stringify(defaultPedidos));
  let nextPedidoNumero = 70;
  let cart = {}; // id producto -> cantidad
  let currentStep = 1;
  let currentBrandFilter = 'Todas las marcas';
  let productSearchTerm = '';
  let listSearchTerm = '';
  let filterEstado = '';
  let filterSucursal = '';
  let currentPage = 1;
  const PAGE_SIZE = 5;

  const simApp = document.getElementById('simulator-app');
  const viewList = document.getElementById('sim-view-list');
  const viewWizard = document.getElementById('sim-view-wizard');
  const wizardSteps = viewWizard.querySelectorAll('.sim-step');
  const progressAside = document.getElementById('sim-progress');
  const progressItems = document.querySelectorAll('.sim-progress__item');

  /* --- Toast liviano para acciones simuladas --- */
  function showToast(msg) {
    let toast = document.getElementById('sim-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sim-toast';
      toast.className = 'sim-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  /* ---------------------------------------------------------
     Vista: LISTADO DE PEDIDOS
     --------------------------------------------------------- */
  const pedidosTbody = document.getElementById('sim-pedidos-tbody');
  const listEmptyEl = document.getElementById('sim-list-empty');
  const paginationEl = document.getElementById('sim-pagination');
  const listSearchInput = document.getElementById('sim-list-search');
  const filtrosBtn = document.getElementById('sim-btn-filtros');
  const filtrosPanel = document.getElementById('sim-filters-panel');

  function getFilteredPedidos() {
    const term = listSearchTerm.trim().toLowerCase();
    return pedidosData.filter(p => {
      if (filterEstado && p.estado !== filterEstado) return false;
      if (filterSucursal && p.sucursal !== filterSucursal) return false;
      if (term && !`${p.numero} ${p.cliente} ${p.sucursal}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }

  function renderPagination(totalPages) {
    let html = `<button class="sim-page-btn" id="sim-page-prev" type="button" aria-label="Anterior" ${currentPage <= 1 ? 'disabled' : ''}><i class="fa-regular fa-chevron-left" aria-hidden="true"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="sim-page-btn ${i === currentPage ? 'is-active' : ''}" data-page="${i}" type="button">${i}</button>`;
    }
    html += `<button class="sim-page-btn" id="sim-page-next" type="button" aria-label="Siguiente" ${currentPage >= totalPages ? 'disabled' : ''}><i class="fa-regular fa-chevron-right" aria-hidden="true"></i></button>`;
    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => { currentPage = Number(btn.dataset.page); renderPedidosList(); });
    });
    document.getElementById('sim-page-prev')?.addEventListener('click', () => { currentPage = Math.max(1, currentPage - 1); renderPedidosList(); });
    document.getElementById('sim-page-next')?.addEventListener('click', () => { currentPage = Math.min(totalPages, currentPage + 1); renderPedidosList(); });
  }

  function renderPedidosList() {
    const filtered = getFilteredPedidos();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    listEmptyEl.hidden = filtered.length > 0;
    pedidosTbody.innerHTML = pageItems.map(p => `
      <tr>
        <td>${p.fecha}</td>
        <td>${p.numero}</td>
        <td>${p.cliente}</td>
        <td>${p.sucursal}</td>
        <td>${money(p.total)}</td>
        <td><span class="sim-badge ${estadoBadgeClass[p.estado] || ''}">${p.estado}</span></td>
        <td>${p.estado === 'Borrador'
          ? `<button class="sim-row-action sim-row-action--edit" type="button" data-edit="${p.id}"><i class="fa-regular fa-pen" aria-hidden="true"></i> Editar</button>`
          : `<button class="sim-row-action" type="button" data-view="${p.id}"><i class="fa-regular fa-eye" aria-hidden="true"></i> Detalle</button>`}</td>
      </tr>
    `).join('');

    pedidosTbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = pedidosData.find(p => p.id === Number(btn.dataset.edit));
        startNewPedido({ cliente: row?.cliente, sucursal: row?.sucursal });
      });
    });
    pedidosTbody.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        showToast('Es una demostración: el detalle completo no está disponible. Probá "Nuevo Pedido" para ver el flujo completo.');
      });
    });

    renderPagination(totalPages);
  }

  listSearchInput.addEventListener('input', (e) => { listSearchTerm = e.target.value; currentPage = 1; renderPedidosList(); });
  document.getElementById('sim-search-btn').addEventListener('click', () => renderPedidosList());

  filtrosBtn.addEventListener('click', () => {
    const willShow = filtrosPanel.hidden;
    filtrosPanel.hidden = !willShow;
    filtrosBtn.setAttribute('aria-expanded', String(willShow));
    filtrosBtn.innerHTML = `<i class="fa-regular fa-sliders" aria-hidden="true"></i> ${willShow ? 'Ocultar' : 'Mostrar'} Filtros <i class="fa-regular fa-chevron-right" aria-hidden="true"></i>`;
  });
  document.getElementById('sim-filter-estado').addEventListener('change', (e) => { filterEstado = e.target.value; currentPage = 1; renderPedidosList(); });
  document.getElementById('sim-filter-sucursal').addEventListener('change', (e) => { filterSucursal = e.target.value; currentPage = 1; renderPedidosList(); });
  document.getElementById('sim-filter-clear').addEventListener('click', () => {
    filterEstado = ''; filterSucursal = '';
    document.getElementById('sim-filter-estado').value = '';
    document.getElementById('sim-filter-sucursal').value = '';
    currentPage = 1;
    renderPedidosList();
  });
  document.getElementById('sim-btn-export').addEventListener('click', () => {
    showToast('Exportación simulada: en la app real esto descarga un .xlsx con estos pedidos.');
  });

  /* ---------------------------------------------------------
     Modal: tipo de pedido
     --------------------------------------------------------- */
  const modalTipo = document.getElementById('sim-modal-tipo');
  function openModalTipo() { modalTipo.hidden = false; lockBodyScroll(); }
  function closeModalTipo() { modalTipo.hidden = true; unlockBodyScroll(); }
  document.getElementById('sim-btn-nuevo-pedido').addEventListener('click', openModalTipo);
  document.getElementById('sim-modal-tipo-close').addEventListener('click', closeModalTipo);
  modalTipo.addEventListener('click', (e) => { if (e.target === modalTipo) closeModalTipo(); });
  document.getElementById('sim-tipo-tradicional').addEventListener('click', () => { closeModalTipo(); startNewPedido(); });
  document.getElementById('sim-tipo-especial').addEventListener('click', () => { closeModalTipo(); startNewPedido(); });

  /* ---------------------------------------------------------
     Cambio de vista: listado <-> wizard
     --------------------------------------------------------- */
  function showListView() {
    simApp.classList.add('is-list-view');
    viewList.hidden = false;
    viewWizard.hidden = true;
    progressAside.hidden = true;
    renderPedidosList();
  }
  function showWizardView() {
    simApp.classList.remove('is-list-view');
    viewList.hidden = true;
    viewWizard.hidden = false;
    progressAside.hidden = false;
  }
  document.getElementById('sim-breadcrumb-back').addEventListener('click', (e) => { e.preventDefault(); showListView(); });

  function goToStep(step) {
    currentStep = step;
    wizardSteps.forEach(s => { s.hidden = s.dataset.step != step; });
    progressItems.forEach(p => {
      const n = Number(p.dataset.progress);
      p.classList.toggle('is-active', n === step);
      p.classList.toggle('is-done', n < step);
    });
    if (step === 2) { renderBrandTabs(); renderProducts(); }
    if (step === 3) { renderSummaryItems(); }
    updateAllTotals();
  }

  viewWizard.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goto = btn.dataset.goto;
      if (goto === 'list') { showListView(); return; }
      goToStep(Number(goto));
    });
  });

  /* --- Paso 1: Información general --- */
  const simOc = document.getElementById('sim-oc');
  const simCliente = document.getElementById('sim-cliente');
  const simSucursal = document.getElementById('sim-sucursal');
  const simFechaPedido = document.getElementById('sim-fecha-pedido');
  const simObservaciones = document.getElementById('sim-observaciones');
  const step1Next = viewWizard.querySelector('.sim-step[data-step="1"] .sim-btn-next');

  function checkStep1() {
    step1Next.disabled = !(simCliente.value.trim() && simSucursal.value);
  }
  simCliente.addEventListener('input', checkStep1);
  simSucursal.addEventListener('change', checkStep1);

  /* --- Paso 2: selección de productos --- */
  const brandTabsEl = document.getElementById('sim-brand-tabs');
  const productTbody = document.getElementById('sim-product-tbody');
  const productSearchInput = document.getElementById('sim-product-search');
  const productEmptyEl = document.getElementById('sim-product-empty');
  const step2Next = viewWizard.querySelector('.sim-step[data-step="2"] .sim-btn-next');

  function brandList() {
    const marcas = [...new Set(catalog.map(p => p.marca).filter(m => m !== 'Otros'))];
    return ['Todas las marcas', ...marcas, 'Otros'];
  }

  function renderBrandTabs() {
    brandTabsEl.innerHTML = brandList().map(b => `
      <button type="button" class="sim-brand-tab ${b === currentBrandFilter ? 'is-active' : ''}" data-brand="${b}">${b}</button>
    `).join('');
    brandTabsEl.querySelectorAll('.sim-brand-tab').forEach(btn => {
      btn.addEventListener('click', () => { currentBrandFilter = btn.dataset.brand; renderBrandTabs(); renderProducts(); });
    });
  }

  function visibleProducts() {
    const term = productSearchTerm.trim().toLowerCase();
    return catalog.filter(p => {
      if (currentBrandFilter !== 'Todas las marcas' && p.marca !== currentBrandFilter) return false;
      if (term && !(p.nombre.toLowerCase().includes(term) || p.codigo.includes(term) || p.sku.toLowerCase().includes(term))) return false;
      return true;
    });
  }

  function renderProducts() {
    const list = visibleProducts();
    productEmptyEl.hidden = list.length > 0;
    productTbody.innerHTML = list.map(p => {
      const qty = cart[p.id] || 0;
      const agotado = p.stock === 'Agotado';
      return `
        <tr data-id="${p.id}">
          <td>
            <span class="sim-product-code">${p.codigo} | ${p.sku}</span>
            <div class="sim-product-name"><strong>${p.nombre}</strong></div>
          </td>
          <td>${p.uxb}un.</td>
          <td>${p.pres}</td>
          <td><span class="sim-stock sim-stock--${agotado ? 'agotado' : 'disponible'}">${p.stock}</span></td>
          <td>${money(p.psl)}</td>
          <td>${p.desc}%</td>
          <td>${money(priceFor(p))}</td>
          <td><input class="sim-qty-input" type="number" min="0" ${agotado ? 'disabled' : ''} value="${qty || ''}" placeholder="0" data-id="${p.id}" /></td>
        </tr>`;
    }).join('');

    productTbody.querySelectorAll('.sim-qty-input').forEach(input => {
      input.addEventListener('input', () => {
        cart[input.dataset.id] = Math.max(0, Number(input.value) || 0);
        updateAllTotals();
      });
    });
  }

  function currentUnidades() {
    return Object.values(cart).reduce((sum, q) => sum + (q > 0 ? q : 0), 0);
  }
  function currentCajas() {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      if (!qty) return sum;
      const p = catalog.find(x => x.id === id);
      return sum + Math.ceil(qty / p.uxb);
    }, 0);
  }
  function currentTotal() {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      if (!qty) return sum;
      const p = catalog.find(x => x.id === id);
      return sum + qty * priceFor(p);
    }, 0);
  }

  const runningTotalEl = document.getElementById('sim-running-total');

  function updateAllTotals() {
    const total = currentTotal();
    const unidades = currentUnidades();
    const cajas = currentCajas();
    step2Next.disabled = unidades <= 0;
    runningTotalEl.textContent = `Total: ${money(total)} · Unidades: ${unidades} · Cajas: ${cajas}`;
    summaryTotalValue.textContent = money(total);
    summaryUnidades.textContent = String(unidades);
    summaryCajas.textContent = String(cajas);
  }

  /* --- Paso 3: revisión del pedido --- */
  const summaryTotalValue = document.getElementById('sim-summary-total-value');
  const summaryUnidades = document.getElementById('sim-summary-unidades');
  const summaryCajas = document.getElementById('sim-summary-cajas');
  const summaryOc = document.getElementById('sim-summary-oc');
  const summarySucursal = document.getElementById('sim-summary-sucursal');
  const summaryItems = document.getElementById('sim-summary-items');

  function renderSummaryItems() {
    summaryOc.textContent = simOc.value.trim() || String(Math.floor(100000 + Math.random() * 800000));
    summarySucursal.textContent = simSucursal.value || '—';

    const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
    summaryItems.innerHTML = entries.map(([id, qty]) => {
      const p = catalog.find(x => x.id === id);
      return `
        <div class="sim-summary-item" data-id="${id}">
          <span class="sim-product-thumb" aria-hidden="true"></span>
          <div class="info">
            <span class="name">${p.nombre}</span>
            <span class="pres">${p.codigo} · ${p.pres} · UxB ${p.uxb}un.</span>
          </div>
          <input class="qty-input" type="number" min="0" value="${qty}" data-id="${id}" />
          <span class="subtotal">${money(qty * priceFor(p))}</span>
          <button class="sim-item-remove" type="button" data-id="${id}" aria-label="Quitar producto"><i class="fa-regular fa-trash" aria-hidden="true"></i></button>
        </div>`;
    }).join('') || '<p class="sim-empty-note">No agregaste productos.</p>';

    summaryItems.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('input', () => {
        cart[input.dataset.id] = Math.max(0, Number(input.value) || 0);
        updateAllTotals();
        renderSummaryItems();
      });
    });
    summaryItems.querySelectorAll('.sim-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        delete cart[btn.dataset.id];
        updateAllTotals();
        renderSummaryItems();
      });
    });
  }

  /* --- Tabs: Productos / Archivos adjuntos --- */
  document.querySelectorAll('.sim-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sim-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.querySelectorAll('.sim-tab-panel').forEach(panel => { panel.hidden = panel.dataset.panel !== tab.dataset.tab; });
    });
  });

  /* --- Enviar pedido --- */
  document.getElementById('sim-btn-enviar').addEventListener('click', (e) => {
    e.currentTarget.blur();
    pedidosData.unshift({
      id: Date.now(),
      fecha: fechaHoy(),
      numero: nextPedidoNumero++,
      cliente: simCliente.value.trim() || 'Cliente demo',
      sucursal: simSucursal.value || '—',
      total: currentTotal(),
      estado: 'Pendiente',
    });
    wizardSteps.forEach(s => s.hidden = true);
    const successStep = viewWizard.querySelector('.sim-step--success');
    successStep.hidden = false;
    progressItems.forEach(p => p.classList.add('is-done'));
    successStep.setAttribute('tabindex', '-1');
    successStep.focus({ preventScroll: true });
    successStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* --- Alta de pedido / reinicio --- */
  function startNewPedido(prefill) {
    cart = {};
    currentBrandFilter = 'Todas las marcas';
    productSearchTerm = '';
    simOc.value = '';
    simCliente.value = prefill?.cliente || '';
    simSucursal.value = prefill?.sucursal || '';
    simObservaciones.value = '';
    simFechaPedido.value = fechaHoy();
    productSearchInput.value = '';
    checkStep1();
    showWizardView();
    goToStep(1);
    maybeShowTourPrompt();
  }

  function resetSimulator() {
    pedidosData = JSON.parse(JSON.stringify(defaultPedidos));
    nextPedidoNumero = 70;
    cart = {};
    filterEstado = ''; filterSucursal = ''; listSearchTerm = '';
    listSearchInput.value = '';
    document.getElementById('sim-filter-estado').value = '';
    document.getElementById('sim-filter-sucursal').value = '';
    filtrosPanel.hidden = true;
    filtrosBtn.setAttribute('aria-expanded', 'false');
    currentPage = 1;
    showListView();
  }
  document.getElementById('btn-restart-sim').addEventListener('click', resetSimulator);
  document.getElementById('btn-restart-sim-2').addEventListener('click', showListView);

  productSearchInput.addEventListener('input', (e) => { productSearchTerm = e.target.value; renderProducts(); });

  showListView();

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
  }
  document.getElementById('tour-skip').addEventListener('click', () => { tourPromptOverlay.hidden = true; unlockBodyScroll(); });
  tourPromptOverlay.addEventListener('click', (e) => { if (e.target === tourPromptOverlay) { tourPromptOverlay.hidden = true; unlockBodyScroll(); } });

  const tourSteps = [
    { selector: '#sim-cliente', step: 1, text: 'Tu cliente busca su nombre acá. El sistema ya conoce sus condiciones comerciales.' },
    { selector: '#sim-sucursal', step: 1, text: 'Elegís la sucursal donde quiere recibir el pedido.' },
    { selector: '.sim-step[data-step="1"] .sim-btn-next', step: 1, text: 'Guardás y pasás a elegir productos.', action: () => { simCliente.value = simCliente.value || 'Farmacia del Sud'; simSucursal.value = simSucursal.value || 'Casa Central'; checkStep1(); } },
    { selector: '#sim-brand-tabs', step: 2, text: 'Filtrá el catálogo por marca, igual que en la app real.' },
    { selector: '.sim-table--products', step: 2, text: 'Cargás cantidades. Precios, stock y descuentos ya vienen según la lista de este cliente.' },
    { selector: '.sim-step[data-step="2"] .sim-btn-next', step: 2, text: 'Con el pedido cargado, avanzás a la revisión final.', action: () => { cart['e1'] = 12; renderProducts(); updateAllTotals(); } },
    { selector: '#sim-btn-enviar', step: 3, text: 'Revisás el resumen y enviás. Así de simple es todo el proceso para tu cliente.' },
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
  const demoBrandNameEl = document.getElementById('demo-brand-name');
  const demoLogoPreview = document.getElementById('demo-logo-preview');
  const demoLogoIcon = document.getElementById('demo-logo-icon');

  let pendingLogo = null;

  function openPersonalize() {
    pzBrandName.value = brand.name;
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
    applyBrandToUI();
    pzOverlay.hidden = true;
    unlockBodyScroll();
  });
  document.getElementById('pz-reset').addEventListener('click', () => {
    brand = JSON.parse(JSON.stringify(defaultBrand));
    pendingLogo = null;
    applyBrandToUI();
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
