/* Dino Cup — admin module.
   Everything that mutates results/points/discounts lives here, behind an
   authenticated ADMIN session (Firebase Auth + dinocup_users/{uid}.role).
   The public landing (assets/app.js) never imports or calls into this file. */

(function () {
const { ROSTER, findPlayerByNickname, player, fmt, longDate, shortDate, award, house, MONTHS_ES } = window.DinoCupData;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
function icons() { if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } }); }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* Some Firebase Storage calls can hang instead of rejecting quickly when
   Storage isn't provisioned yet on the project. Never let a best-effort
   step like "save the original file" block the whole apply flow forever. */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error(`${label || 'Operación'} tardó demasiado.`)), ms))
  ]);
}

/* Admin-only: the game's real currency is DinoCoins (see REGLAS.md §2), and
   absence penalties are "meteoritos" — the public landing keeps its existing
   pt/pts copy untouched, this is just for everything rendered in here. */
function fmtCoins(value) {
  const abs = Math.abs(value);
  const unit = abs === 1 ? 'DinoCoin' : 'DinoCoins';
  return `${value < 0 ? '−' : ''}${fmt(abs)} ${unit}`;
}

const DISCOUNT_OPTIONS = [
  { value: -1, label: '-1 DinoCoin · ausencia con aviso', category: 'Ausencia con aviso' },
  { value: -3, label: '-3 DinoCoins · ausencia sin aviso', category: 'Ausencia sin aviso' }
];
function discountOption(value) { return DISCOUNT_OPTIONS.find(option => option.value === Number(value)); }
function personOptionsHtml(selected = '') {
  return `<option value="">Elegir persona</option>` +
    ROSTER.map(p => `<option value="${p.id}" ${p.id === selected ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
}
function discountOptionsHtml(selected = '') {
  return `<option value="">Elegir meteorito</option>` +
    DISCOUNT_OPTIONS.map(option => `<option value="${option.value}" ${String(option.value) === String(selected) ? 'selected' : ''}>${esc(option.label)}</option>`).join('');
}

/* ---------- auth state ---------- */
let currentAdmin = null;
let adminMatches = [];
let adminMovements = [];
let unsubMatches = null;
let unsubMovements = null;
let activeTab = 'cargar';
let cargarSubview = 'nueva';

const adminLoginModal = $('#adminLoginModal');
const adminPanelModal = $('#adminPanelModal');
const adminAccessLinks = $$('#adminAccessLink, #adminAccessLinkHeader');
const adminAccessLink = adminAccessLinks[0];
const adminLoginForm = $('#adminLoginForm');
const adminLoginError = $('#adminLoginError');
const adminLoginSubmit = $('#adminLoginSubmit');
const adminEmailInput = $('#adminEmail');
const adminPasswordInput = $('#adminPassword');
const adminLogoutButton = $('#adminLogoutButton');
const adminTabs = $('#adminTabs');
const adminViewContent = $('#adminViewContent');
const adminPanelSubtitle = $('#adminPanelSubtitle');

function toggleModal(modal, open, focusTarget) {
  modal.classList.toggle('is-open', open);
  modal.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('modal-open', open || $$('.modal.is-open, .admin-page.is-open').length > 0);
  if (open) window.setTimeout(() => modal.querySelector('.modal-close, .admin-page__back, input')?.focus(), 150);
  else focusTarget?.focus();
}
function openLoginModal() { adminLoginError.hidden = true; adminLoginForm.reset(); toggleModal(adminLoginModal, true); }
function closeLoginModal() { toggleModal(adminLoginModal, false, adminAccessLink); }
function openAdminPanel() {
  toggleModal(adminPanelModal, true);
  setActiveTab('cargar');
}
function closeAdminPanel() { toggleModal(adminPanelModal, false, adminAccessLink); }

adminAccessLinks.forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  if (currentAdmin?.isAdmin) openAdminPanel();
  else openLoginModal();
}));

// Reflect an active admin session on both "Admin" entry points (header + footer)
// so leaving the panel without logging out still shows the session is live.
function updateAdminAccessLinks() {
  const isActive = Boolean(currentAdmin?.isAdmin);
  adminAccessLinks.forEach(link => {
    link.classList.toggle('is-authenticated', isActive);
    link.title = isActive ? `Sesión de administrador activa (${currentAdmin.email})` : '';
    link.innerHTML = isActive ? '<span class="admin-status-dot" aria-hidden="true"></span>Admin' : 'Admin';
  });
}
$$('[data-close-admin-login]').forEach(el => el.addEventListener('click', closeLoginModal));
$$('[data-close-admin-panel]').forEach(el => el.addEventListener('click', closeAdminPanel));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (adminLoginModal.classList.contains('is-open')) closeLoginModal();
  if (adminPanelModal.classList.contains('is-open')) closeAdminPanel();
});

adminLoginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  adminLoginError.hidden = true;
  adminLoginSubmit.classList.add('is-loading');
  try {
    const user = await window.DinoCupFirebase.auth.signIn(adminEmailInput.value.trim(), adminPasswordInput.value);
    await activateAdminSession(user);
    closeLoginModal();
    openAdminPanel();
  } catch (error) {
    adminLoginError.textContent = friendlyAuthError(error);
    adminLoginError.hidden = false;
  } finally {
    adminLoginSubmit.classList.remove('is-loading');
    adminPasswordInput.value = '';
  }
});
function friendlyAuthError(error) {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Email o contraseña incorrectos.';
  if (code.includes('too-many-requests')) return 'Demasiados intentos. Probá de nuevo en unos minutos.';
  if (error?.message?.includes('permisos de administrador')) return error.message;
  return 'No pudimos verificar tu acceso. Probá de nuevo.';
}

adminLogoutButton?.addEventListener('click', async () => {
  await window.DinoCupFirebase.auth.signOut();
  closeAdminPanel();
});

adminTabs?.addEventListener('click', event => {
  const tabButton = event.target.closest('[data-admin-tab]');
  if (!tabButton) return;
  setActiveTab(tabButton.dataset.adminTab);
});
function setActiveTab(name) {
  activeTab = name;
  $$('.admin-tab[data-admin-tab]', adminTabs).forEach(btn => btn.classList.toggle('is-active', btn.dataset.adminTab === name));
  renderActiveTab();
}
function renderActiveTab() {
  if (!currentAdmin?.isAdmin) { adminViewContent.innerHTML = '<p class="admin-empty">Sesión no autorizada.</p>'; return; }
  if (activeTab === 'cargar') renderCargarTab();
  else if (activeTab === 'descuentos') renderDescuentosTab();
  else if (activeTab === 'movimientos') renderMovimientosTab();
  icons();
}

/* ---------- shared formatting ---------- */
function toDate(ts) { return typeof ts?.toDate === 'function' ? ts.toDate() : (ts ? new Date(ts) : null); }
function fmtDateTime(ts) {
  const date = toDate(ts);
  if (!date) return '—';
  return date.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
const STATUS_LABEL = { DRAFT: 'Borrador', PROCESSING: 'Procesando', APPLIED: 'Aplicado', ERROR: 'Error', ANNULLED: 'Anulado' };
const STATUS_CLASS = { DRAFT: 'muted', PROCESSING: 'violet', APPLIED: 'green', ERROR: 'magenta', ANNULLED: 'muted' };
function statusChip(status) { return `<span class="status-chip status-chip--${STATUS_CLASS[status] || 'muted'}">${STATUS_LABEL[status] || status}</span>`; }
const TYPE_LABEL = { REPORT_RESULT: 'Resultado de informe', ABSENCE_PENALTY: 'Meteorito', REPORT_REVERSAL: 'Anulación de resultado', PENALTY_REVERSAL: 'Anulación de meteorito' };

/* ============================================================
   CARGAR RESULTADOS (wizard + historial)
   ============================================================ */
const uploadWizard = {
  step: 1, moderatorId: '', moderatorAutoDetected: false, sessionDate: '',
  file: null, parsed: null, parsingFile: false, absences: [], duplicate: null, busy: false
};
function resetWizard() {
  uploadWizard.step = 1; uploadWizard.moderatorId = ''; uploadWizard.moderatorAutoDetected = false; uploadWizard.sessionDate = '';
  uploadWizard.file = null; uploadWizard.parsed = null; uploadWizard.parsingFile = false;
  uploadWizard.absences = []; uploadWizard.duplicate = null; uploadWizard.busy = false;
}

/* Best-effort auto-detection from the report's file name + detected title,
   so the admin usually doesn't have to touch these fields at all. */
function detectSessionDateFromText(text) {
  const iso = text.match(/(20\d{2})[-_.](\d{1,2})[-_.](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, '0')}-${String(iso[3]).padStart(2, '0')}`;
  // day-month-year (es-AR convention, e.g. "16-07-2026" or "16/07/2026")
  const dmy = text.match(/(\d{1,2})[-_./](\d{1,2})[-_./](20\d{2})/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
  // day + Spanish month name + year (e.g. "23 de julio 2026", "23 julio de 2026")
  const monthPattern = new RegExp(`(\\d{1,2})\\s*(?:de\\s+)?(${MONTHS_ES.join('|')})\\s*(?:de\\s+)?(20\\d{2})`, 'i');
  const named = text.match(monthPattern);
  if (named) {
    const monthIndex = MONTHS_ES.findIndex(month => month.toLowerCase() === named[2].toLowerCase());
    return `${named[3]}-${String(monthIndex + 1).padStart(2, '0')}-${String(named[1]).padStart(2, '0')}`;
  }
  return '';
}
function detectModeratorFromText(text) {
  const tokens = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  for (const token of tokens) {
    const match = findPlayerByNickname(token);
    if (match) return match;
  }
  return null;
}

function renderCargarTab() {
  adminViewContent.innerHTML = `
    <div class="admin-subnav">
      <button type="button" class="admin-subtab ${cargarSubview === 'nueva' ? 'is-active' : ''}" data-sub="nueva">Nueva carga</button>
      <button type="button" class="admin-subtab ${cargarSubview === 'historial' ? 'is-active' : ''}" data-sub="historial">Historial de cargas</button>
    </div>
    <div id="cargarSubviewContent"></div>`;
  $$('[data-sub]', adminViewContent).forEach(btn => btn.addEventListener('click', () => {
    cargarSubview = btn.dataset.sub;
    renderCargarTab();
  }));
  if (cargarSubview === 'nueva') renderWizard();
  else renderHistorialCargas();
  icons();
}

function wizardStepsHtml() {
  return `<ol class="wizard-steps">
    <li class="${uploadWizard.step === 1 ? 'is-active' : uploadWizard.step > 1 ? 'is-done' : ''}"><span>1</span>Datos</li>
    <li class="${uploadWizard.step === 2 ? 'is-active' : uploadWizard.step > 2 ? 'is-done' : ''}"><span>2</span>Meteoritos</li>
    <li class="${uploadWizard.step === 3 ? 'is-active' : ''}"><span>3</span>Vista previa</li>
  </ol>`;
}

function renderWizard() {
  const target = $('#cargarSubviewContent');
  if (uploadWizard.step === 1) target.innerHTML = wizardStepsHtml() + wizardStep1Html();
  else if (uploadWizard.step === 2) target.innerHTML = wizardStepsHtml() + wizardStep2Html();
  else target.innerHTML = wizardStepsHtml() + wizardStep3Html();
  bindWizardStep();
  icons();
}

function wizardStep1Html() {
  const parsing = uploadWizard.parsingFile;
  const ready = Boolean(uploadWizard.file) && !parsing && Boolean(uploadWizard.parsed);

  const dropzoneHtml = ready ? `
    <div class="dropzone dropzone--loaded" id="wizardDropzone">
      <input id="wizardFileInput" type="file" accept=".xlsx,.xls,.csv" hidden />
      <i class="dropzone-icon dropzone-icon--success" data-lucide="check-circle-2" aria-hidden="true"></i>
      <strong>Archivo cargado</strong>
      <span class="file-name">${esc(uploadWizard.file.name)}</span>
      <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" id="wizardChangeFile">Cambiar archivo</button>
    </div>
  ` : `
    <label class="dropzone ${parsing ? 'dropzone--parsing' : ''}" id="wizardDropzone">
      <input id="wizardFileInput" type="file" accept=".xlsx,.xls,.csv" hidden />
      <i class="dropzone-icon" data-lucide="cloud-upload" aria-hidden="true"></i>
      <strong>${parsing ? 'Procesando informe…' : 'Arrastrá el informe acá'}</strong>
      <small>${parsing ? 'Un momento, estamos leyendo el archivo.' : 'o hacé clic para elegir XLSX / CSV'}</small>
      ${parsing ? '' : '<span class="file-name" id="wizardFileName">Todavía no seleccionaste un archivo.</span>'}
    </label>
  `;

  return `
    <form id="wizardStep1Form" class="admin-form">
      ${dropzoneHtml}

      ${ready ? `
      <div class="form-grid">
        <label>
          <span>Fecha de la sesión</span>
          <input id="wizardSessionDate" type="date" value="${esc(uploadWizard.sessionDate)}" required />
        </label>

        <div class="wizard-moderator-field">
          <span>Moderador de la fecha</span>
          ${uploadWizard.moderatorAutoDetected ? `
            <div class="wizard-detected-chip">
              <span>${esc(player(uploadWizard.moderatorId)?.name || '')}<small>detectado del archivo</small></span>
              <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" id="wizardChangeModerator">Cambiar</button>
            </div>
          ` : `<select id="wizardModerator" required>${personOptionsHtml(uploadWizard.moderatorId)}</select>`}
        </div>
      </div>
      ` : ''}

      <p class="admin-form-error" id="wizardStep1Error" hidden></p>

      <div class="admin-wizard-actions">
        <button type="button" class="admin-btn admin-btn--ghost" data-wizard-cancel>Cancelar</button>
        <button type="submit" class="button button--primary modal-submit" id="wizardStep1Submit" ${ready ? '' : 'disabled'}>
          <span class="submit-label">Siguiente</span>
          <span class="submit-loading" aria-hidden="true"><span>Procesando informe</span><span class="loading-pixels"><span></span><span></span><span></span><span></span></span></span>
        </button>
      </div>
    </form>`;
}

function wizardStep2Html() {
  return `
    <section class="absence-section" aria-labelledby="wizardAbsenceTitle">
      <div class="absence-section__header">
        <div>
          <span class="absence-section__eyebrow">Ajuste opcional</span>
          <h3 id="wizardAbsenceTitle">Meteoritos por ausencia</h3>
          <p>Agregá a cada persona que faltó, el meteorito y el motivo (obligatorio).</p>
        </div>
        <button class="absence-add-button" id="wizardAddAbsence" type="button"><i data-lucide="user-plus" aria-hidden="true"></i>Agregar ausencia</button>
      </div>
      <div class="absence-list" id="wizardAbsenceList">${uploadWizard.absences.map((row, index) => wizardAbsenceRowHtml(row, index)).join('')}</div>
    </section>
    <p class="admin-form-error" id="wizardStep2Error" hidden></p>
    <div class="admin-wizard-actions">
      <button type="button" class="admin-btn admin-btn--ghost" data-wizard-cancel>Cancelar</button>
      <button type="button" class="admin-btn" data-wizard-back>Volver</button>
      <button type="button" class="button button--primary" id="wizardStep2Next">Siguiente</button>
    </div>`;
}
function isAbsenceRowComplete(row) { return Boolean(row.person && row.discount && row.reason && row.reason.trim()); }

function wizardAbsenceRowHtml(row, index) {
  if (row.saved) return savedAbsenceRowHtml(row, index, 'wizard');
  const usedElsewhere = uploadWizard.absences.filter((r, i) => i !== index).map(r => r.person);
  const options = `<option value="">Elegir persona</option>` + ROSTER.map(p => `<option value="${p.id}" ${p.id === row.person ? 'selected' : ''} ${usedElsewhere.includes(p.id) ? 'disabled' : ''}>${esc(p.name)}</option>`).join('');
  return `<div class="absence-row" data-index="${index}">
    <label><span>Persona</span><select class="absence-person" data-field="person">${options}</select></label>
    <label><span>Meteorito</span><select class="absence-points" data-field="discount">${discountOptionsHtml(row.discount)}</select></label>
    <label><span>Motivo</span><input type="text" data-field="reason" value="${esc(row.reason || '')}" placeholder="Motivo de la ausencia" /></label>
    <button class="absence-save-button" type="button" data-save aria-label="Guardar ausencia" title="Guardar" ${row.person ? '' : 'disabled'}><i data-lucide="check" aria-hidden="true"></i></button>
  </div>`;
}

/* Shared by the wizard's step-2 rows and the standalone "Aplicar meteoritos"
   rows: once a row is complete and saved, show a compact summary with
   edit/eliminar instead of the trash can sitting next to an empty form. */
function savedAbsenceRowHtml(row, index) {
  const option = discountOption(row.discount);
  const dateLabel = row.date ? ` · ${shortDate(row.date)}` : '';
  return `<div class="absence-row absence-row--saved" data-index="${index}">
    <div class="absence-row__summary">
      <strong>${esc(player(row.person)?.name || row.person)}</strong>
      <span>${esc(option?.label || '')}</span>
      <small>${esc(row.reason)}${dateLabel}</small>
    </div>
    <div class="absence-row__actions">
      <button class="absence-edit-button" type="button" data-edit aria-label="Editar ausencia" title="Editar"><i data-lucide="pencil" aria-hidden="true"></i></button>
      <button class="absence-remove-button" type="button" data-remove aria-label="Eliminar ausencia" title="Eliminar"><i data-lucide="trash-2" aria-hidden="true"></i></button>
    </div>
  </div>`;
}

function wizardStep3Html() {
  const rows = (uploadWizard.parsed?.rows || []).map(row => ({ ...row, match: findPlayerByNickname(row.nickname) }));
  const mapped = rows.map(row => ({ nickname: row.nickname, rank: row.rank, playerId: row.match?.id || '', playerName: row.match?.name || '' }));
  const effective = mapped.filter(row => row.playerId && row.playerId !== uploadWizard.moderatorId).sort((a, b) => a.rank - b.rank).map((row, index) => ({ ...row, effectiveRank: index + 1 }));
  const top3 = effective.filter(row => row.effectiveRank <= 3);
  const unmapped = mapped.filter(row => !row.playerId);
  const moderator = player(uploadWizard.moderatorId);

  const duplicateWarning = uploadWizard.duplicate ? `
    <div class="admin-warning">
      <p>Ya existe un informe cargado para esta fecha. Revisá la carga anterior antes de continuar.</p>
      <button type="button" class="admin-btn admin-btn--ghost" id="wizardViewDuplicate">Ver carga anterior</button>
    </div>` : '';

  return `
    <div class="admin-preview">
      <p class="admin-preview__meta"><strong>${esc(uploadWizard.parsed?.detectedTitle || 'Informe sin título')}</strong> · ${shortDate(uploadWizard.sessionDate)} · Moderador: ${esc(moderator?.name || '—')} · Archivo: ${esc(uploadWizard.file?.name || '—')}</p>

      <h4>Resultados detectados</h4>
      ${top3.length ? `<ol class="admin-result-list">${top3.map(row => `<li>${row.effectiveRank}. ${esc(row.playerName)} · +${fmtCoins(award(row.effectiveRank).delta)}</li>`).join('')}</ol>` : '<p class="admin-empty">No se detectaron posiciones válidas.</p>'}

      ${uploadWizard.absences.length ? `<h4>Meteoritos</h4><ul class="admin-result-list">${uploadWizard.absences.map(row => `<li>${esc(player(row.person)?.name || row.person)} · ${fmtCoins(Number(row.discount))} · ${esc(row.reason)}</li>`).join('')}</ul>` : ''}

      ${unmapped.length ? `<h4>Personas que no pudieron relacionarse</h4><ul class="admin-result-list admin-result-list--muted">${unmapped.map(row => `<li>${esc(row.nickname)} (fila ${row.rank})</li>`).join('')}</ul>` : ''}

      ${duplicateWarning}
    </div>
    <div class="admin-wizard-actions">
      <button type="button" class="admin-btn admin-btn--ghost" data-wizard-cancel>Cancelar</button>
      <button type="button" class="admin-btn" data-wizard-back>Volver</button>
      <button type="button" class="button button--primary modal-submit" id="wizardConfirm" ${uploadWizard.duplicate ? 'disabled' : ''}>
        <span class="submit-label">Confirmar y aplicar</span>
        <span class="submit-loading" aria-hidden="true"><span>Aplicando</span><span class="loading-pixels"><span></span><span></span><span></span><span></span></span></span>
      </button>
    </div>`;
}

function bindWizardStep() {
  $$('[data-wizard-cancel]').forEach(btn => btn.addEventListener('click', () => { resetWizard(); renderWizard(); }));
  $$('[data-wizard-back]').forEach(btn => btn.addEventListener('click', () => { uploadWizard.step -= 1; renderWizard(); }));

  if (uploadWizard.step === 1) {
    const form = $('#wizardStep1Form');
    const dropzone = $('#wizardDropzone');
    const fileInput = $('#wizardFileInput');
    $('#wizardChangeFile')?.addEventListener('click', () => fileInput.click());

    async function handleFile(file) {
      const errorEl = $('#wizardStep1Error');
      errorEl.hidden = true;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        errorEl.textContent = 'Formato no válido. Elegí un XLSX, XLS o CSV.';
        errorEl.hidden = false;
        return;
      }
      uploadWizard.file = file;
      uploadWizard.parsed = null;
      uploadWizard.parsingFile = true;
      uploadWizard.moderatorId = '';
      uploadWizard.moderatorAutoDetected = false;
      uploadWizard.sessionDate = '';
      renderWizard();
      try {
        const parsed = await window.DinoCupParser.parseKahootFile(file);
        if (!parsed.rows.length) {
          uploadWizard.file = null;
          uploadWizard.parsingFile = false;
          renderWizard();
          const retryError = $('#wizardStep1Error');
          retryError.textContent = 'No pude leer resultados en el informe. Probá con el XLSX de Kahoot Reports.';
          retryError.hidden = false;
          return;
        }
        uploadWizard.parsed = parsed;
        uploadWizard.parsingFile = false;
        // Best-effort: read the session date and the moderator straight from
        // the file name / detected title, so the admin usually only has to
        // drop the file. The moderator dropdown only shows up as a fallback.
        const detectText = `${file.name} ${parsed.detectedTitle}`;
        uploadWizard.sessionDate = detectSessionDateFromText(detectText);
        const moderator = detectModeratorFromText(detectText);
        if (moderator) {
          uploadWizard.moderatorId = moderator.id;
          uploadWizard.moderatorAutoDetected = true;
        }
        renderWizard();
      } catch (error) {
        console.error(error);
        uploadWizard.file = null;
        uploadWizard.parsingFile = false;
        renderWizard();
        const retryError = $('#wizardStep1Error');
        retryError.textContent = 'Ocurrió un error al procesar el informe. Probá de nuevo.';
        retryError.hidden = false;
      }
    }

    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });
    ['dragenter', 'dragover'].forEach(name => dropzone.addEventListener(name, e => { e.preventDefault(); dropzone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach(name => dropzone.addEventListener(name, e => { e.preventDefault(); dropzone.classList.remove('is-dragging'); }));
    dropzone.addEventListener('drop', e => {
      const [file] = e.dataTransfer.files;
      if (!file) return;
      const transfer = new DataTransfer(); transfer.items.add(file); fileInput.files = transfer.files;
      handleFile(file);
    });

    $('#wizardChangeModerator')?.addEventListener('click', () => {
      uploadWizard.moderatorAutoDetected = false;
      renderWizard();
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const errorEl = $('#wizardStep1Error');
      if (!uploadWizard.moderatorAutoDetected) uploadWizard.moderatorId = $('#wizardModerator')?.value || '';
      uploadWizard.sessionDate = $('#wizardSessionDate')?.value || uploadWizard.sessionDate;
      if (!uploadWizard.file || !uploadWizard.parsed || !uploadWizard.moderatorId || !uploadWizard.sessionDate) {
        errorEl.textContent = 'Completá el moderador y la fecha antes de continuar.';
        errorEl.hidden = false;
        return;
      }
      uploadWizard.step = 2;
      renderWizard();
    });
  }

  if (uploadWizard.step === 2) {
    const list = $('#wizardAbsenceList');
    $('#wizardAddAbsence').addEventListener('click', () => {
      uploadWizard.absences.push({ person: '', discount: '', reason: '', saved: false });
      renderWizard();
    });
    $$('.absence-row', list).forEach(row => {
      const index = Number(row.dataset.index);
      // Only <select> fields need a full re-render (they update the disabled
      // options on sibling rows). Re-rendering on the reason <input>'s change/blur
      // would destroy the "Siguiente" button mid-click if focus was still on it.
      row.querySelectorAll('select[data-field]').forEach(field => field.addEventListener('change', () => {
        uploadWizard.absences[index][field.dataset.field] = field.value;
        renderWizard();
      }));
      row.querySelector('[data-field="reason"]')?.addEventListener('input', event => { uploadWizard.absences[index].reason = event.target.value; });
      row.querySelector('[data-save]')?.addEventListener('click', () => {
        // The button is already disabled until a persona is chosen — saving
        // here shouldn't re-impose a stricter check than that, since meteorito
        // and motivo can still be filled in later via "Editar".
        uploadWizard.absences[index].saved = true;
        renderWizard();
      });
      row.querySelector('[data-edit]')?.addEventListener('click', () => { uploadWizard.absences[index].saved = false; renderWizard(); });
      row.querySelector('[data-remove]')?.addEventListener('click', () => { uploadWizard.absences.splice(index, 1); renderWizard(); });
    });
    $('#wizardStep2Next').addEventListener('click', async () => {
      // A row added via "Agregar ausencia" but never touched shouldn't block
      // progress or force the admin to delete it manually — just drop it.
      uploadWizard.absences = uploadWizard.absences.filter(row => row.person || row.discount || row.reason.trim());
      const incomplete = uploadWizard.absences.some(row => !isAbsenceRowComplete(row));
      if (incomplete) {
        renderWizard();
        const errorEl = $('#wizardStep2Error');
        errorEl.textContent = 'Completá persona, meteorito y motivo en cada fila (o eliminala).';
        errorEl.hidden = false;
        return;
      }
      uploadWizard.absences.forEach(row => { row.saved = true; });
      $('#wizardStep2Error').hidden = true;
      const fb = window.DinoCupFirebase;
      const [byDate, byHash] = await Promise.all([
        fb.matches.findByDate(uploadWizard.sessionDate),
        fb.matches.findByFileHash(uploadWizard.parsed.fileHash)
      ]);
      uploadWizard.duplicate = byDate || byHash || null;
      uploadWizard.step = 3;
      renderWizard();
    });
  }

  if (uploadWizard.step === 3) {
    if (uploadWizard.duplicate) {
      $('#wizardViewDuplicate')?.addEventListener('click', () => {
        resetWizard();
        cargarSubview = 'historial';
        renderCargarTab();
        window.setTimeout(() => openMatchDetail(uploadWizard.duplicate?.id), 50);
      });
    }
    const confirmBtn = $('#wizardConfirm');
    confirmBtn?.addEventListener('click', () => confirmWizardApply(confirmBtn));
  }
}

async function confirmWizardApply(confirmBtn) {
  if (uploadWizard.busy) return;
  uploadWizard.busy = true;
  confirmBtn.classList.add('is-loading');
  const fb = window.DinoCupFirebase;
  const matchRef = fb.matches.newRef();
  try {
    let originalFileUrl = null;
    try {
      const uploaded = await withTimeout(fb.storage.uploadOriginalFile(matchRef.id, uploadWizard.file), 8000, 'Guardar el archivo original');
      originalFileUrl = uploaded.url;
    } catch (storageError) {
      console.warn('Dino Cup admin: no pude guardar el archivo original (¿Storage habilitado en el proyecto?).', storageError);
    }

    const moderator = player(uploadWizard.moderatorId);
    const mapped = uploadWizard.parsed.rows.map(row => {
      const match = findPlayerByNickname(row.nickname);
      return { nickname: row.nickname, rank: row.rank, playerId: match?.id || '', playerName: match?.name || '' };
    });
    const effective = mapped.filter(row => row.playerId && row.playerId !== uploadWizard.moderatorId).sort((a, b) => a.rank - b.rank).map((row, index) => ({ ...row, effectiveRank: index + 1 }));

    await withTimeout(fb.matches.createDraft(matchRef.id, {
      detectedTitle: uploadWizard.parsed.detectedTitle,
      sessionDate: uploadWizard.sessionDate,
      moderatorId: uploadWizard.moderatorId,
      moderatorName: moderator?.name || '',
      originalFileName: uploadWizard.file.name,
      originalFileUrl,
      fileHash: uploadWizard.parsed.fileHash,
      uploadedBy: currentAdmin.uid,
      uploadedByEmail: currentAdmin.email,
      detectedResults: mapped
    }), 15000, 'Crear la carga');

    const movements = [];
    effective.filter(row => row.effectiveRank <= 3).forEach(row => {
      const prize = award(row.effectiveRank);
      movements.push({
        type: 'REPORT_RESULT', playerId: row.playerId, playerName: row.playerName, points: prize.delta,
        reason: `${longDate(uploadWizard.sessionDate)} · +${prize.delta} ${prize.delta === 1 ? 'punto' : 'puntos'}`,
        sourceType: 'KAHOOT_IMPORT', sourceId: matchRef.id, createdBy: currentAdmin.uid, createdByEmail: currentAdmin.email
      });
    });
    uploadWizard.absences.forEach(row => {
      const p = player(row.person);
      const option = discountOption(row.discount);
      movements.push({
        type: 'ABSENCE_PENALTY', playerId: row.person, playerName: p?.name || row.person, points: Number(row.discount),
        reason: `${option?.category || ''} · ${row.reason}`.replace(/^ · /, ''),
        sourceType: 'KAHOOT_IMPORT', sourceId: matchRef.id, createdBy: currentAdmin.uid, createdByEmail: currentAdmin.email
      });
    });

    await withTimeout(fb.matches.applyWithMovements({ matchId: matchRef.id, movements }), 15000, 'Aplicar los resultados');
    resetWizard();
    cargarSubview = 'nueva';
    renderCargarTab();
    showAdminToast('Resultados cargados y aplicados correctamente.');
  } catch (error) {
    console.error(error);
    try { await withTimeout(fb.matches.markError(matchRef.id, error.message), 5000, 'Registrar el error'); } catch { /* best-effort */ }
    window.alert(`Ocurrió un error al aplicar la carga (${error.message || 'error desconocido'}). No se aplicó ningún punto.`);
  } finally {
    uploadWizard.busy = false;
    confirmBtn?.classList.remove('is-loading');
  }
}

/* ---------- historial de cargas ---------- */
let cargasFilter = { date: '', moderator: '', status: '', admin: '' };
function renderHistorialCargas() {
  const target = $('#cargarSubviewContent');
  const moderators = [...new Set(adminMatches.map(m => m.moderatorName).filter(Boolean))];
  const admins = [...new Set(adminMatches.map(m => m.uploadedByEmail).filter(Boolean))];
  const filtered = adminMatches.filter(m =>
    (!cargasFilter.date || m.sessionDate === cargasFilter.date) &&
    (!cargasFilter.moderator || m.moderatorName === cargasFilter.moderator) &&
    (!cargasFilter.status || m.status === cargasFilter.status) &&
    (!cargasFilter.admin || m.uploadedByEmail === cargasFilter.admin)
  );

  target.innerHTML = `
    <div class="admin-filters">
      <input type="date" id="filterCargaDate" value="${esc(cargasFilter.date)}" />
      <select id="filterCargaModerator"><option value="">Todos los moderadores</option>${moderators.map(m => `<option ${m === cargasFilter.moderator ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
      <select id="filterCargaStatus"><option value="">Todos los estados</option>${Object.keys(STATUS_LABEL).map(s => `<option value="${s}" ${s === cargasFilter.status ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select>
      <select id="filterCargaAdmin"><option value="">Todos los administradores</option>${admins.map(a => `<option ${a === cargasFilter.admin ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Fecha</th><th>Nombre detectado</th><th>Moderador</th><th>Archivo</th><th>Estado</th><th>Cargado</th><th>Admin</th><th></th></tr></thead>
        <tbody>${filtered.length ? filtered.map(m => `
          <tr>
            <td>${shortDate(m.sessionDate)}</td>
            <td>${esc(m.detectedTitle || '—')}</td>
            <td>${esc(m.moderatorName || '—')}</td>
            <td>${esc(m.originalFileName || '—')}</td>
            <td>${statusChip(m.status)}</td>
            <td>${fmtDateTime(m.uploadedAt)}</td>
            <td>${esc(m.uploadedByEmail || '—')}</td>
            <td><button type="button" class="admin-btn admin-btn--ghost admin-btn--small" data-detail="${m.id}">Ver detalle</button></td>
          </tr>`).join('') : `<tr><td colspan="8" class="admin-empty">No hay cargas para este filtro.</td></tr>`}</tbody>
      </table>
    </div>
    <div id="matchDetail"></div>`;

  $('#filterCargaDate').addEventListener('input', e => { cargasFilter.date = e.target.value; renderHistorialCargas(); });
  $('#filterCargaModerator').addEventListener('change', e => { cargasFilter.moderator = e.target.value; renderHistorialCargas(); });
  $('#filterCargaStatus').addEventListener('change', e => { cargasFilter.status = e.target.value; renderHistorialCargas(); });
  $('#filterCargaAdmin').addEventListener('change', e => { cargasFilter.admin = e.target.value; renderHistorialCargas(); });
  $$('[data-detail]', target).forEach(btn => btn.addEventListener('click', () => openMatchDetail(btn.dataset.detail)));
  icons();
}

function openMatchDetail(matchId) {
  const match = adminMatches.find(m => m.id === matchId);
  const detailEl = $('#matchDetail');
  if (!match || !detailEl) return;
  const related = adminMovements.filter(m => m.sourceId === matchId);
  detailEl.innerHTML = `
    <article class="admin-card admin-detail">
      <h3>${esc(match.detectedTitle || 'Carga')} ${statusChip(match.status)}</h3>
      <p class="admin-card__meta">${shortDate(match.sessionDate)} · Moderador: ${esc(match.moderatorName || '—')} · Cargado por ${esc(match.uploadedByEmail || '—')} el ${fmtDateTime(match.uploadedAt)}</p>
      ${match.originalFileUrl ? `<a class="admin-btn admin-btn--ghost admin-btn--small" href="${esc(match.originalFileUrl)}" target="_blank" rel="noopener">Descargar archivo original</a>` : '<p class="admin-empty">Archivo original no disponible.</p>'}

      <h4>Movimientos generados</h4>
      ${related.length ? `<ul class="admin-result-list">${related.map(m => `<li>${esc(m.playerName)} · ${fmtCoins(m.points)} · ${esc(m.reason || '')} ${statusChip(m.status)}</li>`).join('')}</ul>` : '<p class="admin-empty">Sin movimientos asociados.</p>'}

      ${match.status === 'ANNULLED' ? `<p class="admin-card__meta">Anulado por ${esc(match.annulledBy || '—')} el ${fmtDateTime(match.annulledAt)} · Motivo: ${esc(match.annulmentReason || '—')}</p>` : ''}

      ${match.status === 'APPLIED' ? `<button type="button" class="admin-btn admin-btn--danger" id="annulMatchBtn">Anular carga</button>` : ''}
    </article>`;
  $('#annulMatchBtn')?.addEventListener('click', () => renderAnnulMatchConfirm(match, related));
  icons();
}

function renderAnnulMatchConfirm(match, related) {
  const detailEl = $('#matchDetail');
  const active = related.filter(m => m.status === 'APPLIED');
  detailEl.innerHTML = `
    <article class="admin-card admin-confirm">
      <h3>Anular carga</h3>
      <p>Se revertirán:</p>
      <ul class="admin-result-list">${active.map(m => `<li>${esc(m.playerName)} · ${fmtCoins(-m.points)}</li>`).join('')}</ul>
      <label><span>Motivo de la anulación</span><textarea id="annulMatchReason" required></textarea></label>
      <p class="admin-form-error" id="annulMatchError" hidden></p>
      <div class="admin-wizard-actions">
        <button type="button" class="admin-btn admin-btn--ghost" id="annulMatchCancel">Cancelar</button>
        <button type="button" class="button button--primary modal-submit" id="annulMatchConfirm">
          <span class="submit-label">Confirmar anulación</span>
          <span class="submit-loading" aria-hidden="true"><span>Anulando</span><span class="loading-pixels"><span></span><span></span><span></span><span></span></span></span>
        </button>
      </div>
    </article>`;
  $('#annulMatchCancel').addEventListener('click', () => openMatchDetail(match.id));
  $('#annulMatchConfirm').addEventListener('click', async event => {
    const reason = $('#annulMatchReason').value.trim();
    if (!reason) { $('#annulMatchError').textContent = 'El motivo es obligatorio.'; $('#annulMatchError').hidden = false; return; }
    event.currentTarget.classList.add('is-loading');
    try {
      await withTimeout(window.DinoCupFirebase.matches.annul({ match, reason, adminUid: currentAdmin.uid, adminEmail: currentAdmin.email }), 15000, 'Anular la carga');
      showAdminToast('Carga anulada correctamente.');
      renderHistorialCargas();
    } catch (error) {
      console.error(error);
      $('#annulMatchError').textContent = 'No pude anular la carga. Probá de nuevo.';
      $('#annulMatchError').hidden = false;
      event.currentTarget.classList.remove('is-loading');
    }
  });
  icons();
}

/* ============================================================
   APLICAR DESCUENTOS (standalone)
   ============================================================ */
let standaloneDiscounts = [];
function renderDescuentosTab() {
  if (!standaloneDiscounts.length) standaloneDiscounts = [{ person: '', discount: '', reason: '', date: new Date().toISOString().slice(0, 10), saved: false }];
  adminViewContent.innerHTML = `
    <p class="admin-intro">Cargá un meteorito por ausencia sin necesidad de subir un informe.</p>
    <div class="absence-list" id="standaloneList">${standaloneDiscounts.map((row, index) => standaloneRowHtml(row, index)).join('')}</div>
    <button class="absence-add-button" id="standaloneAdd" type="button"><i data-lucide="user-plus" aria-hidden="true"></i>Agregar otra ausencia</button>

    <p class="admin-form-error" id="standaloneError" hidden></p>

    <div class="admin-wizard-actions">
      <button type="button" class="admin-btn admin-btn--ghost" id="standaloneCancel">Cancelar</button>
      <button type="button" class="button button--primary modal-submit" id="standaloneConfirm">
        <span class="submit-label">Confirmar y aplicar</span>
        <span class="submit-loading" aria-hidden="true"><span>Aplicando</span><span class="loading-pixels"><span></span><span></span><span></span><span></span></span></span>
      </button>
    </div>`;
  bindStandalone();
  icons();
}
function standaloneRowHtml(row, index) {
  if (row.saved) return savedAbsenceRowHtml(row, index);
  const usedElsewhere = standaloneDiscounts.filter((r, i) => i !== index).map(r => r.person);
  const options = `<option value="">Elegir persona</option>` + ROSTER.map(p => `<option value="${p.id}" ${p.id === row.person ? 'selected' : ''} ${usedElsewhere.includes(p.id) ? 'disabled' : ''}>${esc(p.name)}</option>`).join('');
  return `<div class="absence-row absence-row--with-date" data-index="${index}">
    <label><span>Persona</span><select class="absence-person" data-field="person">${options}</select></label>
    <label><span>Meteorito</span><select class="absence-points" data-field="discount">${discountOptionsHtml(row.discount)}</select></label>
    <label><span>Motivo</span><input type="text" data-field="reason" value="${esc(row.reason)}" placeholder="Motivo de la ausencia" /></label>
    <label><span>Fecha</span><input type="date" data-field="date" value="${esc(row.date)}" /></label>
    <button class="absence-save-button" type="button" data-save aria-label="Guardar ausencia" title="Guardar" ${row.person ? '' : 'disabled'}><i data-lucide="check" aria-hidden="true"></i></button>
  </div>`;
}
function bindStandalone() {
  const list = $('#standaloneList');
  $('#standaloneAdd').addEventListener('click', () => {
    standaloneDiscounts.push({ person: '', discount: '', reason: '', date: new Date().toISOString().slice(0, 10), saved: false });
    renderDescuentosTab();
  });
  $$('.absence-row', list).forEach(row => {
    const index = Number(row.dataset.index);
    // Only <select> fields re-render (person options need to stay in sync across
    // rows, and the preview list needs updating); text/date inputs just update
    // state so a blur triggered by clicking another button can't destroy it mid-click.
    row.querySelectorAll('select[data-field]').forEach(field => {
      field.addEventListener('change', () => { standaloneDiscounts[index][field.dataset.field] = field.value; renderDescuentosTab(); });
    });
    row.querySelectorAll('input[data-field]').forEach(field => {
      field.addEventListener('input', () => { standaloneDiscounts[index][field.dataset.field] = field.value; });
    });
    row.querySelector('[data-save]')?.addEventListener('click', () => {
      // The button is already disabled until a persona is chosen — saving
      // here shouldn't re-impose a stricter check than that, since meteorito
      // and motivo can still be filled in later via "Editar".
      standaloneDiscounts[index].saved = true;
      renderDescuentosTab();
    });
    row.querySelector('[data-edit]')?.addEventListener('click', () => { standaloneDiscounts[index].saved = false; renderDescuentosTab(); });
    row.querySelector('[data-remove]')?.addEventListener('click', () => {
      standaloneDiscounts.splice(index, 1);
      renderDescuentosTab();
    });
  });
  $('#standaloneCancel').addEventListener('click', () => { standaloneDiscounts = []; renderDescuentosTab(); });
  $('#standaloneConfirm').addEventListener('click', async event => {
    // Completing a row is optional, not mandatory — silently drop anything
    // incomplete (empty or partial) instead of blocking the whole submission.
    const complete = standaloneDiscounts.filter(row => isAbsenceRowComplete(row));
    if (!complete.length) {
      renderDescuentosTab();
      const freshError = $('#standaloneError');
      freshError.textContent = 'Agregá al menos una ausencia.';
      freshError.hidden = false;
      return;
    }
    standaloneDiscounts = complete;
    standaloneDiscounts.forEach(row => { row.saved = true; });
    $('#standaloneError').hidden = true;
    event.currentTarget.classList.add('is-loading');
    try {
      const entries = standaloneDiscounts.map(row => {
        const option = discountOption(row.discount);
        return {
          playerId: row.person, playerName: player(row.person)?.name || row.person, points: Number(row.discount),
          reason: `${option?.category || ''} · ${row.reason}`.replace(/^ · /, ''),
          createdBy: currentAdmin.uid, createdByEmail: currentAdmin.email
        };
      });
      await withTimeout(window.DinoCupFirebase.movements.createManualPenalties(entries), 15000, 'Aplicar los meteoritos');
      standaloneDiscounts = [];
      showAdminToast('Meteoritos aplicados correctamente.');
      renderDescuentosTab();
    } catch (error) {
      console.error(error);
      const errorEl = $('#standaloneError');
      errorEl.textContent = 'No pude aplicar los meteoritos. Probá de nuevo.';
      errorEl.hidden = false;
    } finally {
      event.currentTarget.classList.remove('is-loading');
    }
  });
}

/* ============================================================
   MOVIMIENTOS (historial + anular descuento)
   ============================================================ */
let movFilter = { tipo: '', player: '', date: '', status: '', admin: '' };
function renderMovimientosTab() {
  const admins = [...new Set(adminMovements.map(m => m.createdByEmail).filter(Boolean))];
  const filtered = adminMovements.filter(m =>
    (!movFilter.tipo || m.type === movFilter.tipo) &&
    (!movFilter.player || m.playerId === movFilter.player) &&
    (!movFilter.date || (toDate(m.createdAt) && toDate(m.createdAt).toISOString().slice(0, 10) === movFilter.date)) &&
    (!movFilter.status || m.status === movFilter.status) &&
    (!movFilter.admin || m.createdByEmail === movFilter.admin)
  );

  adminViewContent.innerHTML = `
    <div class="admin-filters">
      <select id="filterMovTipo">
        <option value="">Todos</option>
        <option value="REPORT_RESULT" ${movFilter.tipo === 'REPORT_RESULT' ? 'selected' : ''}>Resultados</option>
        <option value="ABSENCE_PENALTY" ${movFilter.tipo === 'ABSENCE_PENALTY' ? 'selected' : ''}>Meteoritos</option>
        <option value="REPORT_REVERSAL" ${movFilter.tipo === 'REPORT_REVERSAL' ? 'selected' : ''}>Anulaciones de resultado</option>
        <option value="PENALTY_REVERSAL" ${movFilter.tipo === 'PENALTY_REVERSAL' ? 'selected' : ''}>Anulaciones de meteorito</option>
      </select>
      <select id="filterMovPlayer"><option value="">Todos los jugadores</option>${ROSTER.map(p => `<option value="${p.id}" ${p.id === movFilter.player ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
      <input type="date" id="filterMovDate" value="${esc(movFilter.date)}" />
      <select id="filterMovStatus"><option value="">Todos los estados</option><option value="APPLIED" ${movFilter.status === 'APPLIED' ? 'selected' : ''}>Aplicado</option><option value="ANNULLED" ${movFilter.status === 'ANNULLED' ? 'selected' : ''}>Anulado</option></select>
      <select id="filterMovAdmin"><option value="">Todos los administradores</option>${admins.map(a => `<option ${a === movFilter.admin ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Jugador</th><th>DinoCoins</th><th>Motivo</th><th>Estado</th><th>Admin</th><th></th></tr></thead>
        <tbody>${filtered.length ? filtered.map(m => `
          <tr>
            <td>${fmtDateTime(m.createdAt)}</td>
            <td>${TYPE_LABEL[m.type] || m.type}</td>
            <td>${esc(m.playerName)}</td>
            <td>${fmtCoins(m.points)}</td>
            <td>${esc(m.reason || '—')}</td>
            <td>${statusChip(m.status)}</td>
            <td>${esc(m.createdByEmail || '—')}</td>
            <td>${m.type === 'ABSENCE_PENALTY' && m.status === 'APPLIED' ? `<button type="button" class="admin-btn admin-btn--ghost admin-btn--small" data-annul-mov="${m.id}">Anular meteorito</button>` : ''}</td>
          </tr>`).join('') : `<tr><td colspan="8" class="admin-empty">No hay movimientos para este filtro.</td></tr>`}</tbody>
      </table>
    </div>
    <div id="movementDetail"></div>`;

  $('#filterMovTipo').addEventListener('change', e => { movFilter.tipo = e.target.value; renderMovimientosTab(); });
  $('#filterMovPlayer').addEventListener('change', e => { movFilter.player = e.target.value; renderMovimientosTab(); });
  $('#filterMovDate').addEventListener('input', e => { movFilter.date = e.target.value; renderMovimientosTab(); });
  $('#filterMovStatus').addEventListener('change', e => { movFilter.status = e.target.value; renderMovimientosTab(); });
  $('#filterMovAdmin').addEventListener('change', e => { movFilter.admin = e.target.value; renderMovimientosTab(); });
  $$('[data-annul-mov]', adminViewContent).forEach(btn => btn.addEventListener('click', () => renderAnnulMovementConfirm(btn.dataset.annulMov)));
  icons();
}

function renderAnnulMovementConfirm(movementId) {
  const movement = adminMovements.find(m => m.id === movementId);
  const detailEl = $('#movementDetail');
  if (!movement || !detailEl) return;
  detailEl.innerHTML = `
    <article class="admin-card admin-confirm">
      <h3>Anular meteorito</h3>
      <p><strong>${esc(movement.playerName)}</strong> · ${fmtCoins(movement.points)} · ${esc(movement.reason || '')} · ${fmtDateTime(movement.createdAt)}</p>
      <label><span>Motivo de la anulación</span><textarea id="annulMovReason" required></textarea></label>
      <p class="admin-form-error" id="annulMovError" hidden></p>
      <div class="admin-wizard-actions">
        <button type="button" class="admin-btn admin-btn--ghost" id="annulMovCancel">Cancelar</button>
        <button type="button" class="button button--primary modal-submit" id="annulMovConfirm">
          <span class="submit-label">Confirmar anulación</span>
          <span class="submit-loading" aria-hidden="true"><span>Anulando</span><span class="loading-pixels"><span></span><span></span><span></span><span></span></span></span>
        </button>
      </div>
    </article>`;
  $('#annulMovCancel').addEventListener('click', () => { detailEl.innerHTML = ''; });
  $('#annulMovConfirm').addEventListener('click', async event => {
    const reason = $('#annulMovReason').value.trim();
    if (!reason) { $('#annulMovError').textContent = 'El motivo es obligatorio.'; $('#annulMovError').hidden = false; return; }
    event.currentTarget.classList.add('is-loading');
    try {
      await withTimeout(window.DinoCupFirebase.movements.annul({ movement, reason, adminUid: currentAdmin.uid, adminEmail: currentAdmin.email }), 15000, 'Anular el meteorito');
      showAdminToast('Meteorito anulado correctamente.');
      detailEl.innerHTML = '';
      renderMovimientosTab();
    } catch (error) {
      console.error(error);
      $('#annulMovError').textContent = 'No pude anular el meteorito. Probá de nuevo.';
      $('#annulMovError').hidden = false;
      event.currentTarget.classList.remove('is-loading');
    }
  });
  icons();
}

/* ---------- admin toast (reuses the public toast element) ---------- */
function showAdminToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showAdminToast.timer);
  showAdminToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

/* ---------- bootstrap + subscriptions ---------- */
function startAdminSubscriptions() {
  if (unsubMatches) return;
  const fb = window.DinoCupFirebase;
  unsubMatches = fb.matches.subscribe(data => { adminMatches = data; if (adminPanelModal.classList.contains('is-open')) renderActiveTab(); });
  unsubMovements = fb.movements.subscribeAll(data => { adminMovements = data; if (adminPanelModal.classList.contains('is-open')) renderActiveTab(); });
}
function stopAdminSubscriptions() {
  unsubMatches?.(); unsubMovements?.();
  unsubMatches = null; unsubMovements = null;
  adminMatches = []; adminMovements = [];
}

async function activateAdminSession(user) {
  if (currentAdmin?.uid === user.uid) return; // already active (e.g. signIn() already did this)
  currentAdmin = user;
  adminPanelSubtitle.textContent = `Sesión iniciada como ${user.email}.`;
  updateAdminAccessLinks();
  startAdminSubscriptions();
  try {
    await window.DinoCupFirebase.players.ensureSeeded(ROSTER);
  } catch (error) {
    console.warn('Dino Cup admin: no pude inicializar los datos base.', error);
  }
}
function deactivateAdminSession() {
  currentAdmin = null;
  updateAdminAccessLinks();
  stopAdminSubscriptions();
  if (adminPanelModal.classList.contains('is-open')) closeAdminPanel();
}

if (window.DinoCupFirebase) window.DinoCupFirebase.auth.onAuthChange(async user => {
  if (user?.isAdmin) {
    await activateAdminSession(user);
  } else {
    deactivateAdminSession();
  }
});
})();
