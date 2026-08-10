/* Talent Lab — app.js
 * Single-page UI: home (hero + labs grid) and lab detail, hash-routed (#labs, #lab/<id>).
 * All data access goes through window.TalentLabFirebase (assets/firebase.js).
 */
(function () {
  const FB = window.TalentLabFirebase;

  let currentUser = null;
  let labs = [];
  let currentLabId = null;
  let labUpdates = [];
  let labFeedback = [];
  let unsubUpdates = null;
  let unsubFeedback = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatDate(ts) {
    if (!ts || !ts.toDate) return 'justo ahora';
    return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function avgRating(list) {
    if (!list.length) return null;
    return list.reduce((sum, f) => sum + f.rating, 0) / list.length;
  }

  function starsHtml(avg, count) {
    if (avg == null) return '<span class="stars empty">☆☆☆☆☆</span> <small>sin valoraciones</small>';
    const full = Math.round(avg);
    return `<span class="stars">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span> <small>${avg.toFixed(1)} · ${count} valoración${count === 1 ? '' : 'es'}</small>`;
  }

  function parseLinks(raw) {
    return raw.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const [label, url] = line.split('::').map(part => part.trim());
      return { label, url };
    }).filter(l => l.label && l.url);
  }

  /* ---------- modals ---------- */
  function openModal(id) { $('#' + id).classList.add('open'); }
  function closeModal(id) { $('#' + id).classList.remove('open'); }

  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
  $$('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal-overlay.open').forEach(o => o.classList.remove('open'));
  });

  function requireAuthOr(action) {
    if (currentUser) { action(); return; }
    openModal('modal-auth');
  }

  /* ---------- header ---------- */
  function renderHeader() {
    const el = $('#header-actions');
    if (currentUser) {
      el.innerHTML = `
        <a class="button button-ghost" href="#labs">Ver Labs</a>
        <span class="user-chip"><span></span>${esc(currentUser.displayName)}</span>
        <button class="button button-small" id="btn-logout" type="button">Cerrar sesión</button>`;
      $('#btn-logout').addEventListener('click', () => FB.auth.signOut());
    } else {
      el.innerHTML = `
        <a class="button button-ghost" href="#labs">Ver Labs</a>
        <button class="button button-dark" id="btn-open-auth" type="button">Iniciar sesión</button>`;
      $('#btn-open-auth').addEventListener('click', () => openModal('modal-auth'));
    }
  }

  /* ---------- home: labs grid ---------- */
  function renderLabsGrid() {
    const grid = $('#labs-grid');
    const empty = $('#labs-empty');
    if (!labs.length) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    grid.innerHTML = labs.map(lab => `
      <a class="lab-card" href="#lab/${lab.id}">
        <div class="lab-card-top">
          <span class="chip">${esc(lab.category || 'Proyecto')}</span>
        </div>
        <h3>${esc(lab.name)}</h3>
        <p class="tagline">${esc(lab.tagline)}</p>
        <div class="lab-card-meta"><span>por ${esc(lab.ownerName)}</span><span>Ver Lab →</span></div>
      </a>`).join('');
  }

  /* ---------- lab detail ---------- */
  function loadLabDetail(labId) {
    currentLabId = labId;
    if (unsubUpdates) unsubUpdates();
    if (unsubFeedback) unsubFeedback();
    labUpdates = [];
    labFeedback = [];
    unsubUpdates = FB.updates.subscribeForLab(labId, list => { labUpdates = list; renderLabDetail(); });
    unsubFeedback = FB.feedback.subscribeForLab(labId, list => { labFeedback = list; renderLabDetail(); });
    renderLabDetail();
  }

  function stopLabDetail() {
    if (unsubUpdates) unsubUpdates();
    if (unsubFeedback) unsubFeedback();
    unsubUpdates = null;
    unsubFeedback = null;
    currentLabId = null;
  }

  function renderLabDetail() {
    const container = $('#lab-detail-content');
    const lab = labs.find(l => l.id === currentLabId);
    if (!lab) {
      container.innerHTML = '<p>Cargando Lab…</p>';
      return;
    }
    const isOwner = currentUser && currentUser.uid === lab.ownerUid;
    const labAvg = avgRating(labFeedback);
    const links = lab.links || [];

    container.innerHTML = `
      <div class="lab-header">
        <div class="lab-header-top">
          <div>
            <span class="chip">${esc(lab.category || 'Proyecto')}</span>
            <h1>${esc(lab.name)}</h1>
            <p class="lab-owner">por ${esc(lab.ownerName)} · ${formatDate(lab.createdAt)}</p>
          </div>
          <div class="lab-rating-badge">${starsHtml(labAvg, labFeedback.length)}</div>
        </div>
        <p class="lab-description">${esc(lab.description)}</p>
        ${links.length ? `<div class="lab-links">${links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join('')}</div>` : ''}
      </div>

      <div class="timeline-head">
        <h2>Actualizaciones</h2>
        ${isOwner ? '<button class="button button-dark" id="btn-post-update" type="button">+ Nueva actualización</button>' : ''}
      </div>
      ${labUpdates.length ? labUpdates.map(u => renderUpdateCard(u)).join('') : '<div class="empty-state"><p>Todavía no hay actualizaciones en este Lab.</p></div>'}
    `;

    if (isOwner) {
      $('#btn-post-update').addEventListener('click', () => requireAuthOr(() => openModal('modal-post-update')));
    }
  }

  function renderUpdateCard(update) {
    const feedback = labFeedback.filter(f => f.updateId === update.id);
    const avg = avgRating(feedback);
    return `
      <article class="update-card" data-update-id="${update.id}">
        <header>
          <h3>${esc(update.title)}</h3>
          <span class="update-meta">${esc(update.authorName)} · ${formatDate(update.createdAt)}</span>
        </header>
        <p class="update-body">${esc(update.body)}</p>
        <div>${starsHtml(avg, feedback.length)}</div>
        ${feedback.length ? `
          <button class="feedback-toggle" data-action="toggle-feedback" data-update-id="${update.id}">Ver comentarios (${feedback.length})</button>
          <div class="feedback-list hidden" data-feedback-list="${update.id}">
            ${feedback.map(f => `
              <div class="feedback-item">
                <header><span>${esc(f.authorName)}</span><span>${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span></header>
                ${f.comment ? `<p>${esc(f.comment)}</p>` : ''}
              </div>`).join('')}
          </div>` : ''}
        <button class="feedback-toggle" data-action="toggle-feedback-form" data-update-id="${update.id}">Dejar feedback</button>
        <form class="feedback-form" data-action="submit-feedback" data-update-id="${update.id}">
          <div class="star-picker" data-role="star-picker">
            ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-action="pick-star" data-value="${n}">★</button>`).join('')}
          </div>
          <textarea placeholder="¿Qué te pareció este avance? (opcional)" data-role="feedback-comment"></textarea>
          <p class="form-error" data-role="feedback-error"></p>
          <div class="form-actions"><button class="button button-small button-dark" type="submit">Enviar feedback</button></div>
        </form>
      </article>`;
  }

  /* ---------- delegated events inside lab detail ---------- */
  $('#lab-detail-content').addEventListener('click', e => {
    const toggleFeedback = e.target.closest('[data-action="toggle-feedback"]');
    if (toggleFeedback) {
      const list = $(`[data-feedback-list="${toggleFeedback.dataset.updateId}"]`);
      if (list) list.classList.toggle('hidden');
      return;
    }
    const toggleForm = e.target.closest('[data-action="toggle-feedback-form"]');
    if (toggleForm) {
      requireAuthOr(() => {
        const form = $(`form[data-action="submit-feedback"][data-update-id="${toggleForm.dataset.updateId}"]`);
        if (form) form.classList.toggle('open');
      });
      return;
    }
    const star = e.target.closest('[data-action="pick-star"]');
    if (star) {
      const picker = star.closest('[data-role="star-picker"]');
      picker.dataset.value = star.dataset.value;
      $$('button', picker).forEach(b => b.classList.toggle('active', Number(b.dataset.value) <= Number(star.dataset.value)));
    }
  });

  $('#lab-detail-content').addEventListener('submit', async e => {
    const form = e.target.closest('[data-action="submit-feedback"]');
    if (!form) return;
    e.preventDefault();
    const updateId = form.dataset.updateId;
    const errorEl = $('[data-role="feedback-error"]', form);
    const picker = $('[data-role="star-picker"]', form);
    const rating = Number(picker.dataset.value || 0);
    if (!rating) { errorEl.textContent = 'Elegí una valoración de 1 a 5 estrellas.'; return; }
    if (!currentUser) { errorEl.textContent = 'Iniciá sesión para dejar feedback.'; return; }
    const comment = $('[data-role="feedback-comment"]', form).value.trim();
    const submitBtn = $('button[type="submit"]', form);
    submitBtn.disabled = true;
    try {
      await FB.feedback.leave({
        labId: currentLabId,
        updateId,
        authorUid: currentUser.uid,
        authorName: currentUser.displayName,
        rating,
        comment
      });
      form.reset();
      picker.dataset.value = '';
      $$('button', picker).forEach(b => b.classList.remove('active'));
      form.classList.remove('open');
    } catch (error) {
      errorEl.textContent = 'No pudimos guardar tu feedback. Probá de nuevo.';
      console.warn(error);
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ---------- routing ---------- */
  function route() {
    const hash = location.hash || '#labs';
    const match = hash.match(/^#lab\/(.+)$/);
    if (match) {
      $('#view-home').classList.add('hidden');
      $('#view-lab').classList.remove('hidden');
      loadLabDetail(decodeURIComponent(match[1]));
      window.scrollTo(0, 0);
    } else {
      $('#view-lab').classList.add('hidden');
      $('#view-home').classList.remove('hidden');
      stopLabDetail();
    }
  }
  window.addEventListener('hashchange', route);

  /* ---------- auth modal ---------- */
  $$('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.authTab === 'login';
      $('#form-login').classList.toggle('hidden', !isLogin);
      $('#form-signup').classList.toggle('hidden', isLogin);
    });
  });

  $('#form-login').addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = $('#login-error');
    errorEl.textContent = '';
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    try {
      await FB.auth.signIn(email, password);
      closeModal('modal-auth');
      e.target.reset();
    } catch (error) {
      errorEl.textContent = 'No pudimos iniciar sesión. Revisá tu email y contraseña.';
      console.warn(error);
    }
  });

  $('#form-signup').addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = $('#signup-error');
    errorEl.textContent = '';
    const name = $('#signup-name').value.trim();
    const email = $('#signup-email').value.trim();
    const password = $('#signup-password').value;
    try {
      await FB.auth.signUp(email, password, name);
      closeModal('modal-auth');
      e.target.reset();
    } catch (error) {
      errorEl.textContent = 'No pudimos crear tu cuenta. ¿Ese email ya está registrado?';
      console.warn(error);
    }
  });

  /* ---------- create lab modal ---------- */
  ['btn-create-lab-hero', 'btn-create-lab', 'btn-create-lab-empty'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => requireAuthOr(() => openModal('modal-create-lab')));
  });

  $('#form-create-lab').addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = $('#create-lab-error');
    errorEl.textContent = '';
    if (!currentUser) { errorEl.textContent = 'Iniciá sesión primero.'; return; }
    const submitBtn = $('button[type="submit"]', e.target);
    submitBtn.disabled = true;
    try {
      const labId = await FB.labs.create({
        ownerUid: currentUser.uid,
        ownerName: currentUser.displayName,
        name: $('#lab-name').value.trim(),
        tagline: $('#lab-tagline').value.trim(),
        description: $('#lab-description').value.trim(),
        category: $('#lab-category').value,
        links: parseLinks($('#lab-links').value)
      });
      closeModal('modal-create-lab');
      e.target.reset();
      location.hash = '#lab/' + labId;
    } catch (error) {
      errorEl.textContent = 'No pudimos crear tu Lab. Probá de nuevo.';
      console.warn(error);
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ---------- post update modal ---------- */
  $('#form-post-update').addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = $('#post-update-error');
    errorEl.textContent = '';
    if (!currentUser || !currentLabId) { errorEl.textContent = 'Iniciá sesión primero.'; return; }
    const submitBtn = $('button[type="submit"]', e.target);
    submitBtn.disabled = true;
    try {
      await FB.updates.post({
        labId: currentLabId,
        authorUid: currentUser.uid,
        authorName: currentUser.displayName,
        title: $('#update-title').value.trim(),
        body: $('#update-body').value.trim()
      });
      closeModal('modal-post-update');
      e.target.reset();
    } catch (error) {
      errorEl.textContent = 'No pudimos publicar la actualización. Probá de nuevo.';
      console.warn(error);
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ---------- scroll reveal ---------- */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
  }, { threshold: 0.15 });
  $$('.reveal').forEach(el => observer.observe(el));

  /* ---------- boot ---------- */
  FB.auth.onAuthChange(user => {
    currentUser = user;
    renderHeader();
    renderLabDetail();
  });
  FB.labs.subscribe(list => {
    labs = list;
    renderLabsGrid();
    if (currentLabId) renderLabDetail();
  });
  renderHeader();
  route();
})();
