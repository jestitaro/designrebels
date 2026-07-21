/* ========================================================
   Editor de imagen para noticias — QuartzSales
   - Estado en px "reales" del lienzo (1080 de ancho),
     escalado sólo visualmente con transform.
   - Resize con 8 nodos, guías de alineación, undo/redo,
     edición de texto en el lienzo, avisos en un popover.
   ======================================================== */

/* ========================================================
   NOTA PARA GUILLE — qué se agregó/cambió en esta ronda de trabajo
   (todo escrito en CSS plano en styles.css, siguiendo el estilo que ya
   tenía el prototipo; para integrarlo al ABM real hay que reescribir
   los estilos en Tailwind, pero la lógica de JS de acá se puede
   reusar casi tal cual — son funciones autocontenidas)

   1. Galería de recursos (buscar "galería de imágenes" más abajo):
      - Recursos predefinidos por categoría (DEFAULT_RESOURCES), hoy
        14 íconos de producto etiquetados como marca "unilever".
      - Toggle de marca activa (QuartzSales / Unilever, variable
        libraryBrand) que filtra tanto los predefinidos como "Tus
        recursos" (lo que sube el usuario, en IndexedDB con fallback a
        memoria si el navegador bloquea el storage — ver
        ensureLibraryMode). Cada recurso subido queda tageado con la
        marca activa al momento de subirlo (ver libraryAdd).
      - Filtro por tipo (Todos / Íconos / Imágenes, variable libraryKind)
        y buscador por nombre sin tildes (librarySearchQuery,
        normalizeSearch) que filtran ambas secciones a la vez.
   2. Guardar / abrir el diseño como archivo editable (buscar
      "exportDesignFile"): descarga un .json con formato + fondo +
      elementos (reusa snapshot()/restore() del historial de undo) y
      lo puede volver a cargar, a diferencia de "Exportar PNG" que es
      la imagen final ya no editable.
   3. Al agregar un elemento (o insertar uno desde la Galería) ya no
      salta de pestaña — antes te mandaba siempre a "Propiedades" y
      cortaba el flujo de agregar varios elementos seguidos. Ver
      selectElement(id, { switchTab: false }) y su uso en addElement().
   ======================================================== */

const FORMATS = {
  square: { w: 1080, h: 1080, label: 'Cuadrado 1:1' },
  story:  { w: 1080, h: 1920, label: 'Historia 9:16' }
};

const SAFE_MARGIN = 32;      // área segura
const MIN_FONT_SIZE = 26;    // por debajo de esto, aviso de "muy chico"
const MIN_CONTRAST = 4.5;    // WCAG AA texto normal
const MIN_W = 40;            // tamaño mínimo de un elemento (px reales)
const MIN_H = 24;
const STORAGE_KEY = 'qs-image-editor-v1';
const BRAND_COLORS_KEY = 'qs-image-editor-brand-colors-v1'; // paleta de la empresa: persiste aparte del diseño
const LIBRARY_DB_NAME = 'qs-image-editor-library-v1';
const LIBRARY_STORE = 'resources';

const BG_PRESETS = [
  { id: 'p1', type: 'color', value: '#130D5D' },
  { id: 'p2', type: 'color', value: '#6366f1' },
  { id: 'p3', type: 'gradient', value: 'linear-gradient(135deg,#6366f1,#130D5D)' },
  { id: 'p4', type: 'color', value: '#F9FAFB' },
  { id: 'p5', type: 'gradient', value: 'linear-gradient(135deg,#8b5cf6,#4f46e5)' }
];

const state = {
  format: 'square',
  elements: [],
  selectedId: null,
  editingId: null,
  nextId: 1,
  nextZ: 1,
  background: { type: 'color', value: '#130D5D' }
};

let brandColors = []; // [{id, name, value}]

let fitScale = 1;   // escala para que el lienzo entre en el viewport
let zoom = 1;       // multiplicador elegido por el usuario
let scale = 1;      // escala efectiva = fitScale * zoom
let drag = null;
let resizeDrag = null;

const TEXT_TYPES = ['title', 'subtitle', 'paragraph', 'tag', 'date'];

// ---------- helpers ----------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function uid() { return 'el_' + (state.nextId++); }
function getEl(id) { return state.elements.find(e => e.id === id); }
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
function fmt() { return FORMATS[state.format]; }

const TYPE_LABEL = {
  title: 'Título', subtitle: 'Bajada', paragraph: 'Párrafo',
  tag: 'Tag', date: 'Fecha', plate: 'Placa de fondo', image: 'Imagen'
};

function elementLabel(el) {
  const base = TYPE_LABEL[el.type] || el.type;
  if ('content' in el && el.content) {
    const short = el.content.replace(/\s+/g, ' ').trim().slice(0, 18);
    return `${base}: "${short}${el.content.length > 18 ? '…' : ''}"`;
  }
  return base;
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------- toasts ----------
function toast(message, type = 'info', opts = {}) {
  const wrap = $('#toasts');
  const t = document.createElement('div');
  t.className = `toast is-${type}`;
  const icons = {
    success: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  };
  t.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;
  if (opts.actionLabel) {
    const btn = document.createElement('button');
    btn.textContent = opts.actionLabel;
    btn.addEventListener('click', () => { dismiss(); opts.onAction && opts.onAction(); });
    t.appendChild(btn);
  }
  wrap.appendChild(t);
  let timer = setTimeout(dismiss, opts.duration || 3500);
  function dismiss() {
    clearTimeout(timer);
    t.classList.add('leaving');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }
}

// ---------- historial (undo / redo) ----------
const history = { past: [], future: [] };

function snapshot() {
  return JSON.stringify({
    format: state.format,
    background: state.background,
    elements: state.elements.map(({ _overflow, ...rest }) => rest)
  });
}

let lastSnapshot = null;

function commit() {
  const snap = snapshot();
  if (snap === lastSnapshot) return;
  if (lastSnapshot !== null) {
    history.past.push(lastSnapshot);
    if (history.past.length > 60) history.past.shift();
  }
  history.future = [];
  lastSnapshot = snap;
  updateHistoryButtons();
  persist(snap);
}

let commitTimer = null;
function debouncedCommit() {
  clearTimeout(commitTimer);
  commitTimer = setTimeout(commit, 500);
}

function restore(snap) {
  const data = JSON.parse(snap);
  state.format = data.format;
  state.background = data.background;
  state.elements = data.elements;
  state.selectedId = state.elements.some(e => e.id === state.selectedId) ? state.selectedId : null;
  state.editingId = null;
  state.nextId = state.elements.reduce((m, e) => Math.max(m, parseInt(e.id.replace('el_', ''), 10) || 0), 0) + 1;
  state.nextZ = state.elements.reduce((m, e) => Math.max(m, e.z), 0) + 1;
  lastSnapshot = snap;
  $$('.format-btn').forEach(b => b.classList.toggle('is-active', b.dataset.format === state.format));
  renderBgPresets();
  layoutCanvas();
  render();
  renderProps();
  updateHistoryButtons();
  persist(snap);
}

function undo() {
  if (!history.past.length) return;
  history.future.push(lastSnapshot);
  restore(history.past.pop());
}

function redo() {
  if (!history.future.length) return;
  history.past.push(lastSnapshot);
  restore(history.future.pop());
}

function updateHistoryButtons() {
  $('#btnUndo').disabled = history.past.length === 0;
  $('#btnRedo').disabled = history.future.length === 0;
}

$('#btnUndo').addEventListener('click', undo);
$('#btnRedo').addEventListener('click', redo);

// ---------- persistencia local ----------
function persist(snap) {
  try { localStorage.setItem(STORAGE_KEY, snap); } catch (e) { /* cuota llena: seguimos sin guardar */ }
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.elements) || !FORMATS[data.format]) return null;
    return raw;
  } catch (e) { return null; }
}

// ---------- guardar / abrir el diseño como archivo editable ----------
// A diferencia de "Exportar PNG" (una imagen final, no editable), esto
// descarga el estado completo de la noticia en JSON para retomarla después,
// en esta computadora o en otra (el autoguardado en localStorage no viaja).
const DESIGN_FILE_APP_ID = 'qs-content-visual-editor';

function exportDesignFile() {
  const data = JSON.parse(snapshot());
  data.app = DESIGN_FILE_APP_ID;
  data.version = 1;
  data.savedAt = new Date().toISOString();

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const f = fmt();
  link.download = `noticia-${f.w}x${f.h}-editable.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  toast('Diseño guardado como archivo editable', 'success');
}

// el archivo viene de afuera (pudo haber sido editado a mano): se sanitiza
// lo mínimo para no romper el render en vez de confiar en su forma
function sanitizeImportedElements(elements) {
  return elements
    .filter(el => el && typeof el === 'object' && typeof el.type === 'string')
    .map((el, i) => ({
      ...el,
      id: (typeof el.id === 'string' && el.id) ? el.id : ('el_' + (i + 1)),
      x: Number(el.x) || 0,
      y: Number(el.y) || 0,
      w: Number(el.w) || MIN_W,
      h: Number(el.h) || MIN_H,
      z: Number(el.z) || (i + 1),
      hidden: !!el.hidden
    }));
}

function importDesignFile(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    let data;
    try { data = JSON.parse(ev.target.result); }
    catch (e) { toast('Ese archivo no es un diseño válido para este editor', 'error'); return; }

    if (!data || !Array.isArray(data.elements) || !FORMATS[data.format]) {
      toast('Ese archivo no es un diseño válido para este editor', 'error');
      return;
    }

    const background = (data.background && typeof data.background === 'object' && data.background.type)
      ? data.background
      : { type: 'color', value: '#130D5D' };

    history.past = [];
    history.future = [];
    restore(JSON.stringify({
      format: data.format,
      background,
      elements: sanitizeImportedElements(data.elements)
    }));
    deselect();
    toast('Diseño cargado desde el archivo', 'success');
  };
  reader.onerror = () => toast('No se pudo leer el archivo', 'error');
  reader.readAsText(file);
}

$('#btnSaveDesign').addEventListener('click', exportDesignFile);
$('#btnOpenDesign').addEventListener('click', () => $('#inputOpenDesign').click());
$('#inputOpenDesign').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) importDesignFile(file);
  e.target.value = '';
});

// ---------- galería de imágenes: recursos predefinidos (categorías) ----------
// Vienen con el editor (no se suben ni se guardan en IndexedDB) y no se pueden
// borrar desde la galería: son el punto de partida para etiquetar una noticia
// por marca y categoría de producto. Cada uno declara su marca (brand) y si es
// un ícono ilustrado o una imagen (foto), para poder filtrarlos en la galería.
const DEFAULT_RESOURCES = [
  { id: 'preset_aderezos', name: 'Aderezos', src: 'assets/categorias/Aderezos.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_cremas', name: 'Cremas', src: 'assets/categorias/Cremas.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_deos', name: 'Deos', src: 'assets/categorias/Deos.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_jabon_ropa_1', name: 'Jabón para ropa 1', src: 'assets/categorias/JabonRopa1.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_jabon_ropa_2', name: 'Jabón para ropa 2', src: 'assets/categorias/JabonRopa2.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_jabon_tocador', name: 'Jabón de tocador', src: 'assets/categorias/JabonTocador.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_lavavajillas', name: 'Lavavajillas', src: 'assets/categorias/Lavavajillas.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_limpiadores', name: 'Limpiadores', src: 'assets/categorias/Limpiadores.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_pelo', name: 'Pelo', src: 'assets/categorias/Pelo.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_salsas_1', name: 'Salsas 1', src: 'assets/categorias/Salsas1.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_salsas_2', name: 'Salsas 2', src: 'assets/categorias/Salsas2.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_savoury', name: 'Savoury', src: 'assets/categorias/Savoury.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_suavizantes_1', name: 'Suavizantes 1', src: 'assets/categorias/Suavizantes1.png', brand: 'unilever', kind: 'icono' },
  { id: 'preset_suavizantes_2', name: 'Suavizantes 2', src: 'assets/categorias/Suavizantes2.png', brand: 'unilever', kind: 'icono' }
];

const BRAND_LABELS = { quartzsales: 'QuartzSales', unilever: 'Unilever' };

// estado de los filtros de la galería (marca, tipo de recurso y búsqueda)
let libraryBrand = 'quartzsales';
let libraryKind = 'all';
let librarySearchQuery = '';

// sin tildes y en minúsculas, para que "jabon" encuentre "Jabón"
function normalizeSearch(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function matchesLibrarySearch(name) {
  if (!librarySearchQuery) return true;
  return normalizeSearch(name).includes(librarySearchQuery);
}

function renderDefaultLibrary() {
  const grid = $('#libraryDefaultGrid');
  const empty = $('#libraryDefaultEmpty');
  const emptyText = $('#libraryDefaultEmptyText');
  if (!grid) return;

  const items = DEFAULT_RESOURCES.filter(item =>
    item.brand === libraryBrand &&
    (libraryKind === 'all' || item.kind === libraryKind) &&
    matchesLibrarySearch(item.name)
  );

  if (empty) empty.style.display = items.length ? 'none' : 'flex';
  if (emptyText) {
    emptyText.textContent = librarySearchQuery
      ? `No hay recursos de ${BRAND_LABELS[libraryBrand] || libraryBrand} que coincidan con "${librarySearchQuery}".`
      : `Todavía no hay recursos de ${BRAND_LABELS[libraryBrand] || libraryBrand} en esta categoría.`;
  }

  grid.innerHTML = '';
  items.forEach(item => grid.appendChild(buildLibraryCell(item, { deletable: false })));
}

// buscador, marca y tipo son controles de la galería: filtran tanto las
// categorías predefinidas como los recursos subidos por el usuario
$('#librarySearchInput').addEventListener('input', e => {
  librarySearchQuery = normalizeSearch(e.target.value);
  renderDefaultLibrary();
  renderLibrary();
});

$('#libraryBrandToggle').addEventListener('click', e => {
  const btn = e.target.closest('.pill-toggle-btn');
  if (!btn || btn.dataset.brand === libraryBrand) return;
  libraryBrand = btn.dataset.brand;
  $$('.pill-toggle-btn', $('#libraryBrandToggle')).forEach(b => b.classList.toggle('is-active', b === btn));
  renderDefaultLibrary();
  renderLibrary(); // "Tus recursos" también está por marca/cliente
});

$('#libraryKindFilter').addEventListener('click', e => {
  const btn = e.target.closest('.pill-toggle-btn');
  if (!btn || btn.dataset.kind === libraryKind) return;
  libraryKind = btn.dataset.kind;
  $$('.pill-toggle-btn', $('#libraryKindFilter')).forEach(b => b.classList.toggle('is-active', b === btn));
  renderDefaultLibrary();
});

// ---------- galería de imágenes: librería de recursos (IndexedDB) ----------
// Se guardan como dataURL (igual que el resto de las imágenes del editor) para
// poder usarse directo como fondo o elemento sin conversiones adicionales.
// IndexedDB en vez de localStorage porque varias imágenes en base64 superan
// rápido la cuota de ~5MB de localStorage.
//
// Si IndexedDB no está disponible (por ej. embebido en un iframe de otro
// origen con storage de terceros bloqueado), se cae a una lista en memoria:
// la galería sigue funcionando durante la sesión, pero avisamos que no
// persiste al recargar, en vez de decir "guardado" y perderlo en silencio.
let libraryDB = null;
let libraryMode = null; // 'idb' | 'memory', se decide una sola vez
const memoryLibrary = new Map(); // id -> item, solo se usa en modo 'memory'

function openLibraryDB() {
  return new Promise((resolve, reject) => {
    if (libraryDB) return resolve(libraryDB);
    if (!window.indexedDB) return reject(new Error('IndexedDB no disponible'));
    const req = indexedDB.open(LIBRARY_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LIBRARY_STORE)) {
        db.createObjectStore(LIBRARY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => { libraryDB = req.result; resolve(libraryDB); };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB bloqueada'));
  });
}

async function ensureLibraryMode() {
  if (libraryMode) return libraryMode;
  try {
    await openLibraryDB();
    libraryMode = 'idb';
  } catch (e) {
    console.warn('Galería de imágenes: IndexedDB no disponible, se usa memoria de la sesión (no persiste al recargar).', e);
    libraryMode = 'memory';
  }
  return libraryMode;
}

async function libraryAdd(name, dataUrl, w, h) {
  const item = {
    id: 'res_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: name || 'Imagen', dataUrl, w: w || 0, h: h || 0, createdAt: Date.now(),
    brand: libraryBrand // el recurso queda asociado a la marca/cliente elegido al subirlo
  };
  const mode = await ensureLibraryMode();
  if (mode === 'memory') { memoryLibrary.set(item.id, item); return item; }

  const db = await openLibraryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LIBRARY_STORE, 'readwrite');
    tx.objectStore(LIBRARY_STORE).add(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

async function libraryGetAll() {
  const mode = await ensureLibraryMode();
  if (mode === 'memory') {
    return [...memoryLibrary.values()].sort((a, b) => b.createdAt - a.createdAt);
  }
  const db = await openLibraryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LIBRARY_STORE, 'readonly');
    const req = tx.objectStore(LIBRARY_STORE).getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.createdAt - a.createdAt));
    req.onerror = () => reject(req.error);
  });
}

async function libraryDelete(id) {
  const mode = await ensureLibraryMode();
  if (mode === 'memory') { memoryLibrary.delete(id); return; }
  const db = await openLibraryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LIBRARY_STORE, 'readwrite');
    tx.objectStore(LIBRARY_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// agrega un recurso a la galería, refresca la vista si está abierta y devuelve
// si realmente se pudo guardar (para no avisar "guardado" cuando falló)
async function addResourceToLibrary(name, dataUrl, w, h) {
  try {
    await libraryAdd(name, dataUrl, w, h);
    renderLibrary();
    return true;
  } catch (e) {
    console.warn('No se pudo guardar el recurso en la galería', e);
    renderLibrary();
    return false;
  }
}

// mismo flujo que addResourceToLibrary, pero calculando el ancho/alto a partir del dataURL
function saveToLibrary(file, dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    const name = (file && file.name) || 'Imagen';
    img.onload = () => resolve(addResourceToLibrary(name, dataUrl, img.naturalWidth, img.naturalHeight));
    img.onerror = () => resolve(addResourceToLibrary(name, dataUrl, 0, 0));
    img.src = dataUrl;
  });
}

// arma una celda de la galería, para un recurso predefinido (categoría) o uno
// subido por el usuario; solo los subidos por el usuario se pueden borrar
function buildLibraryCell(item, opts = {}) {
  const src = item.src || item.dataUrl;
  const cell = document.createElement('div');
  cell.className = 'library-item';
  cell.innerHTML = `
    <img src="${src}" alt="${escapeHtml(item.name)}" title="${escapeHtml(item.name)}" loading="lazy">
    <div class="library-item-actions">
      <button type="button" data-action="insert" title="Insertar en el lienzo" aria-label="Insertar en el lienzo">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      </button>
      <button type="button" data-action="bg" title="Usar como fondo del lienzo" aria-label="Usar como fondo del lienzo">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
      </button>
      ${opts.deletable ? `<button type="button" data-action="delete" title="Eliminar de la galería" aria-label="Eliminar de la galería">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>` : ''}
    </div>
  `;
  cell.querySelector('[data-action="insert"]').addEventListener('click', () => {
    addImageElement(src);
  });
  cell.querySelector('[data-action="bg"]').addEventListener('click', () => {
    setBackgroundImage(src);
    toast('Fondo actualizado desde la galería', 'success');
  });
  if (opts.deletable) {
    cell.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      try {
        await libraryDelete(item.id);
        renderLibrary();
        toast(`"${item.name}" eliminado de la galería`, 'info');
      } catch (e) { toast('No se pudo eliminar ese recurso', 'error'); }
    });
  }
  return cell;
}

async function renderLibrary() {
  const grid = $('#libraryGrid');
  const empty = $('#libraryEmpty');
  const emptyText = $('#libraryEmptyText');
  const warning = $('#libraryWarning');
  if (!grid || !empty) return;

  const brandLabel = BRAND_LABELS[libraryBrand] || libraryBrand;

  let allItems = [];
  try { allItems = await libraryGetAll(); } catch (e) { allItems = []; }
  // items sin marca son de antes de este cambio: se muestran para cualquier
  // marca en vez de quedar huérfanos
  const brandItems = allItems.filter(item => !item.brand || item.brand === libraryBrand);
  const items = brandItems.filter(item => matchesLibrarySearch(item.name));

  if (warning) warning.hidden = libraryMode !== 'memory';
  empty.style.display = items.length ? 'none' : 'flex';
  if (emptyText) {
    emptyText.textContent = (librarySearchQuery && brandItems.length)
      ? `Ningún recurso de ${brandLabel} coincide con "${librarySearchQuery}".`
      : `Todavía no subiste recursos de ${brandLabel}. Subí una imagen para empezar.`;
  }
  grid.innerHTML = '';
  items.forEach(item => grid.appendChild(buildLibraryCell(item, { deletable: true })));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => resolve(ev.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

$('#btnLibraryUpload').addEventListener('click', () => $('#inputLibraryUpload').click());
$('#inputLibraryUpload').addEventListener('change', async e => {
  const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
  e.target.value = '';
  if (!files.length) return;

  const results = await Promise.all(files.map(async file => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      return saveToLibrary(file, dataUrl);
    } catch (err) { return false; }
  }));
  const okCount = results.filter(Boolean).length;

  if (okCount === files.length) {
    toast(okCount === 1 ? 'Recurso guardado en la galería' : `${okCount} recursos guardados en la galería`, 'success');
  } else if (okCount > 0) {
    toast(`Se guardaron ${okCount} de ${files.length} recursos, el resto no se pudo guardar`, 'error');
  } else {
    toast('No se pudo guardar en la galería en este navegador', 'error');
  }
});

// ---------- factory de elementos ----------
function defaultElement(type) {
  const f = fmt();
  const cx = f.w / 2;
  const base = { id: uid(), type, x: 0, y: 0, w: 100, h: 100, z: state.nextZ++, hidden: false };

  switch (type) {
    case 'title':
      return { ...base, x: cx - 450, y: 120, w: 900, h: 150, content: 'Título de la noticia',
        fontSize: 64, weight: 700, color: '#ffffff', align: 'left' };
    case 'subtitle':
      return { ...base, x: cx - 450, y: 290, w: 900, h: 90, content: 'Bajada breve que resume la noticia',
        fontSize: 34, weight: 500, color: '#e5e7eb', align: 'left' };
    case 'paragraph':
      return { ...base, x: cx - 450, y: 400, w: 900, h: 200, content: 'Párrafo breve con el detalle de la noticia, pensado para acompañar el título y la bajada.',
        fontSize: 26, weight: 400, color: '#e5e7eb', align: 'left' };
    case 'tag':
      return { ...base, x: cx - 450, y: 80, w: 220, h: 56, content: 'NOVEDAD',
        fontSize: 22, weight: 600, color: '#ffffff', align: 'center', bg: '#6366f1' };
    case 'date':
      return { ...base, x: cx - 450, y: f.h - 100, w: 260, h: 46, content: '08 de julio de 2026',
        fontSize: 22, weight: 500, color: '#e5e7eb', align: 'left' };
    case 'plate':
      return { ...base, x: cx - 470, y: 260, w: 940, h: 360,
        color: '#111827', opacity: 0.55, radius: 12 };
    case 'image':
      return { ...base, x: cx - 200, y: cx - 200, w: 400, h: 400, src: null,
        radius: 8, fit: 'cover' };
  }
}

function addElement(type, extra = {}) {
  const el = { ...defaultElement(type), ...extra };
  state.elements.push(el);
  // no cambia de pestaña: si el usuario está agregando varios elementos
  // seguidos (desde "Elementos" o desde la Galería), lo queremos dejar
  // donde está en vez de mandarlo a "Propiedades" después de cada uno
  selectElement(el.id, { switchTab: false });
  render();
  commit();
  return el;
}

// agrega una imagen respetando su proporción real
function addImageElement(src) {
  const img = new Image();
  img.onload = () => {
    const f = fmt();
    const maxSide = Math.min(f.w, f.h) * 0.6;
    const ratio = img.naturalWidth / img.naturalHeight || 1;
    let w = maxSide, h = maxSide;
    if (ratio >= 1) h = Math.round(maxSide / ratio);
    else w = Math.round(maxSide * ratio);
    addElement('image', { src, w, h, x: Math.round((f.w - w) / 2), y: Math.round((f.h - h) / 2) });
    toast('Imagen agregada al lienzo', 'success');
  };
  img.onerror = () => toast('No se pudo leer esa imagen', 'error');
  img.src = src;
}

// ---------- selección ----------
// switchTab: false evita el salto a "Propiedades" (usado al agregar elementos,
// para no interrumpir a quien está agregando varios seguidos); en el resto de
// los casos (clic en el lienzo, en una capa, o en un aviso) sí conviene saltar,
// porque ahí seleccionar algo es, justamente, para ir a editarlo.
function selectElement(id, opts = {}) {
  state.selectedId = id;
  if (id && opts.switchTab !== false) switchTab('propiedades');
  renderSelection();
  renderProps();
  renderLayers();
}

function deselect() {
  state.selectedId = null;
  renderSelection();
  renderProps();
  renderLayers();
}

// ---------- tabs del panel izquierdo ----------
function switchTab(tab) {
  $$('.panel-tab').forEach(b => b.classList.toggle('is-active', b.dataset.tab === tab));
  $$('.panel-tab-content').forEach(s => s.classList.toggle('is-active', s.dataset.tabContent === tab));
}

$('#panelTabs').addEventListener('click', e => {
  const btn = e.target.closest('.panel-tab');
  if (!btn) return;
  switchTab(btn.dataset.tab);
});

// ---------- vistas Subir / Crear ----------
$$('.source-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.source-tab').forEach(t => t.classList.toggle('is-active', t === tab));
    const isUpload = tab.dataset.source === 'upload';
    $('#uploadView').hidden = !isUpload;
    $('#editorView').style.display = isUpload ? 'none' : '';
    if (!isUpload) { layoutCanvas(); render(); }
  });
});

// ---------- formato ----------
$('#formatToggle').addEventListener('click', e => {
  const btn = e.target.closest('.format-btn');
  if (!btn || btn.dataset.format === state.format) return;
  state.format = btn.dataset.format;
  $$('.format-btn').forEach(b => b.classList.toggle('is-active', b === btn));
  layoutCanvas();
  render();
  commit();
});

// ---------- agregar elementos ----------
$$('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.add;
    if (type === 'image') {
      $('#inputImageElement').click();
      return;
    }
    addElement(type);
  });
});

$('#inputImageElement').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { addImageElement(ev.target.result); saveToLibrary(file, ev.target.result); };
  reader.readAsDataURL(file);
  e.target.value = '';
});

// ---------- fondo ----------
function renderBgPresets() {
  const wrap = $('#bgPresets');
  wrap.innerHTML = '';
  BG_PRESETS.forEach(p => {
    const b = document.createElement('button');
    b.className = 'bg-preset' + (state.background.type !== 'image' && state.background.value === p.value ? ' is-active' : '');
    b.style.background = p.value;
    b.title = 'Fondo predefinido';
    b.addEventListener('click', () => {
      state.background = { type: p.type === 'gradient' ? 'gradient' : 'color', value: p.value };
      renderBgPresets();
      renderCanvasBackground();
      render();
      commit();
    });
    wrap.appendChild(b);
  });
  syncBgColorPicker();
}

function setBackgroundImage(src) {
  state.background = { type: 'image', value: src };
  renderBgPresets();
  renderCanvasBackground();
  render();
  commit();
}

$('#btnUploadBg').addEventListener('click', () => $('#inputBgImage').click());
$('#inputBgImage').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    setBackgroundImage(ev.target.result);
    saveToLibrary(file, ev.target.result);
    toast('Fondo actualizado', 'success');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

function renderCanvasBackground() {
  const stage = $('#canvasStage');
  if (state.background.type === 'image') {
    stage.style.background = `url(${state.background.value}) center/cover no-repeat`;
  } else {
    stage.style.background = state.background.value;
  }
}

// color personalizado del fondo (además de los presets)
$('#bgColorPicker').addEventListener('input', e => {
  state.background = { type: 'color', value: e.target.value };
  renderCanvasBackground();
  renderValidations(); // el contraste puede cambiar en vivo
});
$('#bgColorPicker').addEventListener('change', () => {
  renderBgPresets();
  render();
  commit();
});

function syncBgColorPicker() {
  if (state.background.type === 'color') $('#bgColorPicker').value = state.background.value;
}

// ---------- colores de la empresa (paleta con nombre, ej. por categoría) ----------
function loadBrandColors() {
  try {
    const raw = localStorage.getItem(BRAND_COLORS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    brandColors = Array.isArray(parsed) ? parsed.filter(c => c && c.name && /^#[0-9a-f]{6}$/i.test(c.value)) : [];
  } catch (e) { brandColors = []; }
}

function persistBrandColors() {
  try { localStorage.setItem(BRAND_COLORS_KEY, JSON.stringify(brandColors)); } catch (e) { /* cuota llena: seguimos sin guardar */ }
}

function renderBrandColors() {
  const wrap = $('#brandColors');
  const empty = $('#brandColorsEmpty');
  wrap.innerHTML = '';
  empty.hidden = brandColors.length > 0;

  brandColors.forEach(c => {
    const item = document.createElement('div');
    item.className = 'brand-color-item';

    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'brand-color-swatch';
    swatch.style.background = c.value;
    swatch.title = `Usar "${c.name}" como fondo del lienzo`;
    swatch.addEventListener('click', () => {
      state.background = { type: 'color', value: c.value };
      renderBgPresets();
      renderCanvasBackground();
      render();
      commit();
      toast(`Fondo: ${c.name}`, 'success');
    });

    const label = document.createElement('span');
    label.className = 'brand-color-name';
    label.textContent = c.name;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'brand-color-delete';
    del.title = 'Eliminar color';
    del.setAttribute('aria-label', `Eliminar color ${c.name}`);
    del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    del.addEventListener('click', ev => { ev.stopPropagation(); removeBrandColor(c.id); });

    item.appendChild(swatch);
    item.appendChild(label);
    item.appendChild(del);
    wrap.appendChild(item);
  });
}

function addBrandColor(name, value) {
  const id = 'bc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  brandColors.push({ id, name, value });
  persistBrandColors();
  renderBrandColors();
  renderProps(); // refresca las mini paletas del panel de propiedades, si hay uno abierto
}

function removeBrandColor(id) {
  const idx = brandColors.findIndex(c => c.id === id);
  if (idx === -1) return;
  const [removed] = brandColors.splice(idx, 1);
  persistBrandColors();
  renderBrandColors();
  renderProps();
  toast(`Color "${removed.name}" eliminado`, 'info', {
    actionLabel: 'Deshacer',
    onAction: () => {
      brandColors.splice(idx, 0, removed);
      persistBrandColors();
      renderBrandColors();
      renderProps();
    }
  });
}

$('#btnAddBrandColor').addEventListener('click', () => {
  const nameInput = $('#brandColorName');
  const name = nameInput.value.trim();
  const value = $('#brandColorPicker').value;
  if (!name) {
    toast('Poné un nombre para el color (ej: Deportes)', 'error');
    nameInput.focus();
    return;
  }
  if (brandColors.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    toast('Ya existe un color guardado con ese nombre', 'error');
    return;
  }
  addBrandColor(name, value);
  nameInput.value = '';
  toast(`Color "${name}" guardado`, 'success');
});
$('#brandColorName').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); $('#btnAddBrandColor').click(); }
});

// debajo de cada input de color del panel de propiedades, ofrece la paleta de la empresa
function attachBrandSwatches(container) {
  if (!brandColors.length) return;
  $$('input[type="color"][data-prop]', container).forEach(input => {
    const row = document.createElement('div');
    row.className = 'brand-swatch-row';
    brandColors.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'brand-swatch-mini';
      b.style.background = c.value;
      b.title = c.name;
      b.setAttribute('aria-label', `Usar color ${c.name}`);
      b.addEventListener('click', () => {
        input.value = c.value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      row.appendChild(b);
    });
    input.closest('.field').appendChild(row);
  });
}

// ---------- layout del canvas (tamaño real vs escala visual) ----------
function layoutCanvas() {
  const f = fmt();
  const viewport = $('#canvasViewport');
  const maxW = viewport.clientWidth - 48;
  const maxH = viewport.clientHeight - 48 || 560;

  fitScale = Math.min(maxW / f.w, maxH / f.h, 1);
  scale = fitScale * zoom;

  const wrap = $('#canvasWrap');
  wrap.style.width = (f.w * scale) + 'px';
  wrap.style.height = (f.h * scale) + 'px';

  const stage = $('#canvasStage');
  stage.style.width = f.w + 'px';
  stage.style.height = f.h + 'px';
  stage.style.transform = `scale(${scale})`;

  const safe = $('#safeArea');
  safe.style.left = SAFE_MARGIN + 'px';
  safe.style.top = SAFE_MARGIN + 'px';
  safe.style.width = (f.w - SAFE_MARGIN * 2) + 'px';
  safe.style.height = (f.h - SAFE_MARGIN * 2) + 'px';
  safe.style.borderWidth = Math.max(2, 2 / scale) + 'px';

  $('#canvasDims').textContent = `${f.w} × ${f.h}px · ${f.label}`;
  $('#btnZoomFit').textContent = Math.round(scale * 100) + '%';

  renderCanvasBackground();
  updateOverlay();
}

window.addEventListener('resize', () => { layoutCanvas(); render(); });

// ---------- zoom ----------
function setZoom(z) {
  zoom = clamp(z, 0.5, 4);
  layoutCanvas();
}
$('#btnZoomIn').addEventListener('click', () => setZoom(zoom * 1.25));
$('#btnZoomOut').addEventListener('click', () => setZoom(zoom / 1.25));
$('#btnZoomFit').addEventListener('click', () => setZoom(1));

// ---------- validaciones ----------
function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex) {
  if (!hex) return null;
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  if (la === null || lb === null) return null;
  const [l1, l2] = la > lb ? [la, lb] : [lb, la];
  return (l1 + 0.05) / (l2 + 0.05);
}

// contra qué se lee un texto: la placa que tenga debajo (si hay), si no el fondo del lienzo
function backgroundBehind(el) {
  const under = state.elements
    .filter(o => o.type === 'plate' && !o.hidden && o.z < el.z && overlaps(o, el))
    .sort((a, b) => b.z - a.z)[0];
  if (under) return under.color;
  if (state.background.type === 'color') return state.background.value;
  return null; // imagen o degradé: no se puede calcular de forma confiable
}

function overlaps(a, b) {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

function validateElement(el) {
  const issues = []; // {level: 'error'|'warning', message}
  const f = fmt();

  const outOfCanvas = el.x < 0 || el.y < 0 || el.x + el.w > f.w || el.y + el.h > f.h;
  if (outOfCanvas) {
    issues.push({ level: 'error', message: 'Se corta con el borde del lienzo. Ajustá tamaño o posición.' });
  } else {
    const outsideSafe = el.x < SAFE_MARGIN || el.y < SAFE_MARGIN ||
      el.x + el.w > f.w - SAFE_MARGIN || el.y + el.h > f.h - SAFE_MARGIN;
    if (outsideSafe) {
      issues.push({ level: 'error', message: `Está fuera del área segura de ${SAFE_MARGIN}px.` });
    }
  }

  if (TEXT_TYPES.includes(el.type)) {
    if (el.fontSize < MIN_FONT_SIZE) {
      issues.push({ level: 'warning', message: `Texto muy chico (${el.fontSize}px), puede no leerse bien.` });
    }
    const bg = backgroundBehind(el);
    if (bg) {
      const ratio = contrastRatio(el.color, bg);
      if (ratio && ratio < MIN_CONTRAST) {
        issues.push({ level: 'warning', message: `Bajo contraste (${ratio.toFixed(1)}:1). Elegí colores más contrastantes.` });
      }
    }
  }

  return issues;
}

function collectValidations() {
  const all = [];
  state.elements.forEach(el => {
    if (el.hidden) return;
    const issues = validateElement(el);
    if (el._overflow) {
      issues.push({ level: 'error', message: 'El texto no entra en su caja. Agrandá el cuadro o reducí el texto.' });
    }
    issues.forEach(i => all.push({ el, ...i }));
  });
  return all;
}

// ---------- chip de estado + popover ----------
let lastIssueCount = 0;

function renderValidations() {
  const list = collectValidations();
  const chip = $('#statusChip');
  const label = $('#statusChipLabel');
  const count = $('#statusChipCount');
  const hasError = list.some(i => i.level === 'error');

  chip.classList.remove('is-ok', 'is-warning', 'is-error');
  if (list.length === 0) {
    chip.classList.add('is-ok');
    label.textContent = 'Todo en orden';
    count.hidden = true;
  } else {
    chip.classList.add(hasError ? 'is-error' : 'is-warning');
    label.textContent = list.length === 1 ? '1 aviso' : `${list.length} avisos`;
    count.hidden = true;
  }
  if (list.length > lastIssueCount) {
    chip.classList.remove('pulse');
    void chip.offsetWidth; // reinicia la animación
    chip.classList.add('pulse');
  }
  lastIssueCount = list.length;

  // popover
  const ul = $('#statusPopoverList');
  const ok = $('#statusPopoverOk');
  ul.innerHTML = '';
  ok.style.display = list.length ? 'none' : 'flex';
  $('#statusPopover .status-popover-hint').style.display = list.length ? '' : 'none';

  list.forEach(item => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = `validation-item level-${item.level}`;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
      <span><b>${escapeHtml(elementLabel(item.el))}:</b> ${escapeHtml(item.message)}</span>
    `;
    btn.addEventListener('click', () => {
      closeStatusPopover();
      selectElement(item.el.id);
    });
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function openStatusPopover() {
  $('#statusPopover').hidden = false;
  $('#statusChip').setAttribute('aria-expanded', 'true');
}
function closeStatusPopover() {
  $('#statusPopover').hidden = true;
  $('#statusChip').setAttribute('aria-expanded', 'false');
}
$('#statusChip').addEventListener('click', () => {
  $('#statusPopover').hidden ? openStatusPopover() : closeStatusPopover();
});
$('#statusPopoverClose').addEventListener('click', closeStatusPopover);
document.addEventListener('pointerdown', e => {
  if (!$('#statusPopover').hidden && !e.target.closest('.status-wrap')) closeStatusPopover();
});

// ---------- ayuda ----------
$('#btnHelp').addEventListener('click', () => { $('#helpModal').hidden = false; });
$('#helpModalClose').addEventListener('click', () => { $('#helpModal').hidden = true; });
$('#helpModal').addEventListener('click', e => {
  if (e.target === $('#helpModal')) $('#helpModal').hidden = true;
});

// ---------- render de elementos en el canvas ----------
function renderElements(retry) {
  const stage = $('#canvasStage');
  $$('.canvas-element', stage).forEach(n => n.remove());

  const sorted = [...state.elements].sort((a, b) => a.z - b.z);

  sorted.forEach(el => {
    const node = document.createElement('div');
    node.className = 'canvas-element';
    node.dataset.id = el.id;
    node.style.left = el.x + 'px';
    node.style.top = el.y + 'px';
    node.style.width = el.w + 'px';
    node.style.height = el.h + 'px';
    node.style.zIndex = el.z;
    if (el.hidden) node.classList.add('is-hidden-el');

    node.appendChild(buildElementContent(el));

    node.addEventListener('pointerdown', ev => {
      if (state.editingId === el.id) return;
      selectElement(el.id);
      startDrag(ev, el);
    });

    if (TEXT_TYPES.includes(el.type)) {
      node.addEventListener('dblclick', () => startTextEdit(el));
    }

    stage.appendChild(node);
  });

  // overflow de texto: comparar scrollHeight vs clientHeight ya renderizados.
  // el texto nunca debería quedar cortado en silencio: si no entra, primero
  // agrandamos la caja; si agrandarla la sacaría del lienzo (esa parte
  // quedaría igual de cortada, sólo que por el borde del lienzo en vez de
  // por la caja), la topeamos ahí y en cambio achicamos la letra hasta que
  // entre. Si ni así entra, queda el aviso visible de siempre.
  let grew = false;
  const f = fmt();
  sorted.forEach(el => {
    if (!TEXT_TYPES.includes(el.type)) { el._overflow = false; return; }
    const content = stage.querySelector(`.canvas-element[data-id="${el.id}"] .el-content`);
    if (!content) { el._overflow = false; return; }

    const overflowing = content.scrollHeight > content.clientHeight + 1;
    el._overflow = overflowing;
    if (!overflowing) return;

    const maxH = Math.max(MIN_H, f.h - el.y); // más allá de esto, ya no lo vería nadie
    const needed = Math.ceil(content.scrollHeight) + 2;

    if (needed <= maxH) {
      el.h = needed;
      el._overflow = false;
      grew = true;
      return;
    }

    // ni llenando el lienzo entra: probamos achicar la letra hasta que entre
    const outer = content.parentElement;
    outer.style.height = maxH + 'px';
    const textNode = content.querySelector('.el-text');
    if (textNode) {
      let fs = el.fontSize;
      while (fs > 10 && content.scrollHeight > content.clientHeight + 1) {
        fs -= 1;
        textNode.style.fontSize = fs + 'px';
      }
      if (fs !== el.fontSize) { el.fontSize = fs; grew = true; }
    }
    el.h = maxH;
    el._overflow = content.scrollHeight > content.clientHeight + 1;
    if (el._overflow) grew = true; // nos quedamos con el mejor esfuerzo (h tope + letra mínima) y refrescamos
  });

  // las cajas y/o tamaños de letra cambiaron: volvemos a renderizar una vez
  // más con las medidas correctas (se corta después de unas vueltas por las
  // dudas, no debería hacer falta más de una o dos)
  if (grew && (retry || 0) < 4) {
    renderElements((retry || 0) + 1);
    return;
  }

  // si el auto-ajuste cambió el tamaño de letra del elemento seleccionado,
  // reflejarlo en el input sin reconstruir el panel entero (no perder el foco)
  const selFsInput = $('#propsForm [data-prop="fontSize"]');
  const selEl = getEl(state.selectedId);
  if (selFsInput && selEl && Number(selFsInput.value) !== selEl.fontSize) {
    selFsInput.value = selEl.fontSize;
  }

  // marcar con aviso los que se cortan / desbordan
  sorted.forEach(el => {
    const node = stage.querySelector(`.canvas-element[data-id="${el.id}"]`);
    if (!node) return;
    const issues = validateElement(el);
    const hasError = issues.some(i => i.level === 'error') || el._overflow;
    node.classList.toggle('has-error', hasError);
  });

  renderValidations();
  updateOverlay();
}

function buildElementContent(el) {
  const wrap = document.createElement('div');

  if (el.type === 'image') {
    wrap.className = 'el-content';
    wrap.style.borderRadius = (el.radius || 0) + 'px';
    if (el.src) {
      const img = document.createElement('img');
      img.src = el.src;
      img.style.objectFit = el.fit || 'cover';
      wrap.appendChild(img);
    } else {
      wrap.style.background = 'rgba(255,255,255,.85)';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      wrap.style.color = '#6b7280';
      wrap.style.fontSize = '28px';
      wrap.textContent = 'Sin imagen';
    }
    return wrap;
  }

  if (el.type === 'plate') {
    wrap.className = 'el-content';
    wrap.style.background = hexToRgba(el.color, el.opacity);
    wrap.style.borderRadius = (el.radius || 0) + 'px';
    return wrap;
  }

  // elementos de texto
  wrap.className = `el-content align-${el.align || 'left'}`;
  wrap.style.alignItems = el.type === 'tag' ? 'center' : 'flex-start';

  const textNode = document.createElement('div');
  textNode.className = 'el-text';
  textNode.style.fontSize = el.fontSize + 'px';
  textNode.style.fontWeight = el.weight;
  textNode.style.color = el.color;
  textNode.style.lineHeight = '1.25';
  textNode.style.width = '100%';
  textNode.style.whiteSpace = 'pre-wrap';
  textNode.textContent = el.content;

  if (el.type === 'tag') {
    textNode.classList.add('el-tag');
    textNode.style.background = el.bg;
    textNode.style.lineHeight = 'normal';
  }

  wrap.appendChild(textNode);
  return wrap;
}

function hexToRgba(hex, opacity) {
  const rgb = hexToRgb(hex) || { r: 17, g: 24, b: 39 };
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity ?? 1})`;
}

// ---------- edición de texto en el lienzo ----------
function startTextEdit(el) {
  const node = $(`#canvasStage .canvas-element[data-id="${el.id}"] .el-text`);
  if (!node) return;
  state.editingId = el.id;
  const original = el.content;
  node.contentEditable = 'true';
  node.focus();
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  function finish(save) {
    node.contentEditable = 'false';
    state.editingId = null;
    if (save) {
      el.content = node.innerText.replace(/\n{3,}/g, '\n\n');
    }
    render();
    renderProps();
    if (save) commit();
  }

  node.addEventListener('blur', () => finish(true), { once: true });
  node.addEventListener('keydown', ev => {
    ev.stopPropagation();
    if (ev.key === 'Escape') {
      node.innerText = original;
      node.blur();
    }
  });
}

// ---------- overlay de selección: caja, nodos y toolbar (sin escalar) ----------
function updateOverlay() {
  const overlay = $('#selectionOverlay');
  const toolbar = $('#elementToolbar');
  const el = getEl(state.selectedId);

  if (!el || el.hidden) {
    overlay.hidden = true;
    toolbar.hidden = true;
    return;
  }

  overlay.hidden = false;
  overlay.style.left = (el.x * scale) + 'px';
  overlay.style.top = (el.y * scale) + 'px';
  overlay.style.width = (el.w * scale) + 'px';
  overlay.style.height = (el.h * scale) + 'px';

  // mientras se arrastra o redimensiona, la toolbar molesta: se oculta
  if (drag || resizeDrag) {
    toolbar.hidden = true;
    return;
  }

  toolbar.hidden = false;
  if (!toolbar.dataset.forId || toolbar.dataset.forId !== el.id) {
    buildToolbar(toolbar, el);
  }
  const wrap = $('#canvasWrap');
  const tbW = toolbar.offsetWidth || 120;
  const tLeft = clamp(el.x * scale, 2, Math.max(2, wrap.clientWidth - tbW - 2));
  let tTop = el.y * scale - 34;
  // si no entra arriba, va debajo del elemento (nunca encima, para no tapar el drag)
  if (tTop < 2) tTop = clamp((el.y + el.h) * scale + 10, 2, wrap.clientHeight - 30);
  toolbar.style.left = tLeft + 'px';
  toolbar.style.top = tTop + 'px';
}

function buildToolbar(bar, el) {
  bar.innerHTML = '';
  bar.dataset.forId = el.id;
  bar.appendChild(toolbarBtn('M8 8h10v10H8z M6 16H5a1 1 0 01-1-1V5a1 1 0 011-1h10a1 1 0 011 1v1', 'Duplicar (Ctrl+D)', () => duplicateElement(el.id)));
  bar.appendChild(toolbarBtn('M12 19V5M5 12l7-7 7 7', 'Traer al frente', () => bringToFront(el.id)));
  bar.appendChild(toolbarBtn('M12 5v14M5 12l7 7 7-7', 'Enviar atrás', () => sendToBack(el.id)));
  const del = toolbarBtn('M6 6l12 12M18 6L6 18', 'Eliminar (Supr)', () => removeElement(el.id));
  del.classList.add('danger');
  bar.appendChild(del);
}

function toolbarBtn(path, title, onClick) {
  const b = document.createElement('button');
  b.title = title;
  b.setAttribute('aria-label', title);
  b.innerHTML = `<svg viewBox="0 0 24 24"><path d="${path}"/></svg>`;
  b.addEventListener('pointerdown', ev => ev.stopPropagation());
  b.addEventListener('click', ev => { ev.stopPropagation(); onClick(); });
  return b;
}

function duplicateElement(id) {
  const el = getEl(id);
  if (!el) return;
  const copy = { ...el, id: uid(), x: el.x + 24, y: el.y + 24, z: state.nextZ++ };
  state.elements.push(copy);
  selectElement(copy.id);
  render();
  commit();
}

function bringToFront(id) {
  const el = getEl(id);
  if (!el) return;
  el.z = state.nextZ++;
  render();
  commit();
}

function sendToBack(id) {
  const minZ = Math.min(...state.elements.map(e => e.z), 0);
  const el = getEl(id);
  if (!el) return;
  el.z = minZ - 1;
  render();
  commit();
}

// mueve una capa un paso hacia adelante/atrás en el orden z
function stepLayer(id, dir) {
  const sorted = [...state.elements].sort((a, b) => a.z - b.z);
  const idx = sorted.findIndex(e => e.id === id);
  const swapWith = sorted[idx + dir];
  if (!swapWith) return;
  const el = sorted[idx];
  [el.z, swapWith.z] = [swapWith.z, el.z];
  render();
  commit();
}

function removeElement(id) {
  const el = getEl(id);
  state.elements = state.elements.filter(e => e.id !== id);
  if (state.selectedId === id) state.selectedId = null;
  render();
  renderProps();
  commit();
  if (el) {
    toast(`${TYPE_LABEL[el.type] || 'Elemento'} eliminado`, 'info', {
      actionLabel: 'Deshacer',
      onAction: undo
    });
  }
}

// ---------- badge de posición / tamaño ----------
function showBadge(el, text) {
  const badge = $('#dragBadge');
  const wrap = $('#canvasWrap');
  badge.hidden = false;
  badge.textContent = text;
  badge.style.left = clamp((el.x + el.w / 2) * scale, 30, wrap.clientWidth - 30) + 'px';
  badge.style.top = clamp((el.y + el.h) * scale + 10, 0, wrap.clientHeight - 26) + 'px';
}
function hideBadge() { $('#dragBadge').hidden = true; }

// ---------- guías de alineación ----------
function showGuideV(x) {
  const g = $('#guideV');
  g.hidden = false;
  g.style.left = x + 'px';
  g.style.width = Math.max(2, 2 / scale) + 'px';
}
function showGuideH(y) {
  const g = $('#guideH');
  g.hidden = false;
  g.style.top = y + 'px';
  g.style.height = Math.max(2, 2 / scale) + 'px';
}
function hideGuides() {
  $('#guideV').hidden = true;
  $('#guideH').hidden = true;
}

// ---------- drag (coordenadas reales del lienzo) ----------
function startDrag(ev, el) {
  if (ev.button !== undefined && ev.button !== 0) return;
  ev.preventDefault();
  drag = {
    id: el.id, startX: ev.clientX, startY: ev.clientY,
    elX: el.x, elY: el.y, moved: false,
    node: $(`#canvasStage .canvas-element[data-id="${el.id}"]`)
  };
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', stopDrag);
}

function onDrag(ev) {
  if (!drag) return;
  const el = getEl(drag.id);
  if (!el) return;
  const dx = (ev.clientX - drag.startX) / scale;
  const dy = (ev.clientY - drag.startY) / scale;
  if (!drag.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
  drag.moved = true;

  const f = fmt();
  let x = clamp(drag.elX + dx, -el.w * 0.7, f.w - el.w * 0.3);
  let y = clamp(drag.elY + dy, -el.h * 0.7, f.h - el.h * 0.3);

  // snapping: centro del lienzo, área segura y bordes
  const threshold = 6 / scale * 1.5 + 4; // px reales; se siente parejo en cualquier zoom
  hideGuides();

  const candidatesX = [
    { at: f.w / 2 - el.w / 2, guide: f.w / 2 },            // centro
    { at: SAFE_MARGIN, guide: SAFE_MARGIN },               // safe izq.
    { at: f.w - SAFE_MARGIN - el.w, guide: f.w - SAFE_MARGIN }, // safe der.
    { at: 0, guide: 0 },
    { at: f.w - el.w, guide: f.w }
  ];
  for (const c of candidatesX) {
    if (Math.abs(x - c.at) < threshold) { x = c.at; showGuideV(c.guide); break; }
  }

  const candidatesY = [
    { at: f.h / 2 - el.h / 2, guide: f.h / 2 },
    { at: SAFE_MARGIN, guide: SAFE_MARGIN },
    { at: f.h - SAFE_MARGIN - el.h, guide: f.h - SAFE_MARGIN },
    { at: 0, guide: 0 },
    { at: f.h - el.h, guide: f.h }
  ];
  for (const c of candidatesY) {
    if (Math.abs(y - c.at) < threshold) { y = c.at; showGuideH(c.guide); break; }
  }

  el.x = x;
  el.y = y;

  // feedback en vivo sin re-render completo
  drag.node.style.left = el.x + 'px';
  drag.node.style.top = el.y + 'px';
  updateOverlay();
  showBadge(el, `${Math.round(el.x)}, ${Math.round(el.y)}`);
}

function stopDrag() {
  const moved = drag && drag.moved;
  drag = null;
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', stopDrag);
  hideGuides();
  hideBadge();
  if (moved) {
    render();
    renderProps();
    commit();
  }
}

// ---------- resize con 8 nodos ----------
$$('#selectionOverlay .handle').forEach(handle => {
  handle.addEventListener('pointerdown', ev => {
    const el = getEl(state.selectedId);
    if (!el) return;
    ev.preventDefault();
    ev.stopPropagation();
    startResize(ev, el, handle.dataset.handle);
  });
});

function startResize(ev, el, handle) {
  resizeDrag = {
    id: el.id, handle,
    startX: ev.clientX, startY: ev.clientY,
    x: el.x, y: el.y, w: el.w, h: el.h,
    fontSize: el.fontSize || null,
    ratio: el.w / el.h,
    node: $(`#canvasStage .canvas-element[data-id="${el.id}"]`)
  };
  window.addEventListener('pointermove', onResize);
  window.addEventListener('pointerup', stopResize);
}

function onResize(ev) {
  if (!resizeDrag) return;
  const el = getEl(resizeDrag.id);
  if (!el) return;
  const r = resizeDrag;
  const h = r.handle;
  const dx = (ev.clientX - r.startX) / scale;
  const dy = (ev.clientY - r.startY) / scale;

  let x = r.x, y = r.y, w = r.w, hh = r.h;

  if (h.includes('e')) w = r.w + dx;
  if (h.includes('w')) { w = r.w - dx; x = r.x + dx; }
  if (h.includes('s')) hh = r.h + dy;
  if (h.includes('n')) { hh = r.h - dy; y = r.y + dy; }

  const isCorner = h.length === 2;
  // proporción: imágenes con nodos de esquina la mantienen (Shift la libera);
  // en el resto, Shift la fuerza
  const keepRatio = isCorner && ((el.type === 'image') !== ev.shiftKey);

  if (keepRatio) {
    if (Math.abs(w - r.w) >= Math.abs(hh - r.h) * r.ratio) hh = w / r.ratio;
    else w = hh * r.ratio;
    if (h.includes('w')) x = r.x + (r.w - w);
    if (h.includes('n')) y = r.y + (r.h - hh);
  }

  // mínimos, manteniendo fijo el borde opuesto
  if (w < MIN_W) {
    if (h.includes('w')) x = r.x + r.w - MIN_W;
    w = MIN_W;
  }
  if (hh < MIN_H) {
    if (h.includes('n')) y = r.y + r.h - MIN_H;
    hh = MIN_H;
  }

  el.x = x; el.y = y; el.w = w; el.h = hh;

  // en textos, los nodos de esquina también escalan la tipografía (como Canva)
  if (isCorner && r.fontSize && TEXT_TYPES.includes(el.type)) {
    el.fontSize = clamp(Math.round(r.fontSize * (w / r.w)), 10, 220);
    const textNode = r.node.querySelector('.el-text');
    if (textNode) textNode.style.fontSize = el.fontSize + 'px';
  }

  r.node.style.left = el.x + 'px';
  r.node.style.top = el.y + 'px';
  r.node.style.width = el.w + 'px';
  r.node.style.height = el.h + 'px';
  updateOverlay();
  showBadge(el, `${Math.round(el.w)} × ${Math.round(el.h)}`);
}

function stopResize() {
  const was = resizeDrag;
  resizeDrag = null;
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', stopResize);
  hideBadge();
  if (was) {
    const el = getEl(was.id);
    if (el) { el.w = Math.round(el.w); el.h = Math.round(el.h); el.x = Math.round(el.x); el.y = Math.round(el.y); }
    render();
    renderProps();
    commit();
  }
}

// clic en el fondo del canvas: deselecciona
$('#canvasStage').addEventListener('pointerdown', ev => {
  if (ev.target.id === 'canvasStage' || ev.target.id === 'safeArea') deselect();
});
$('#canvasViewport').addEventListener('pointerdown', ev => {
  if (ev.target.id === 'canvasViewport') deselect();
});

// ---------- selección visual ----------
function renderSelection() {
  updateOverlay();
}

// ---------- panel de propiedades ----------
function renderProps() {
  const empty = $('#propsEmpty');
  const form = $('#propsForm');
  const el = getEl(state.selectedId);

  if (!el) {
    empty.style.display = 'flex';
    form.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  const rows = [];
  rows.push(`<span class="props-type-badge">${TYPE_LABEL[el.type]}</span>`);

  if (TEXT_TYPES.includes(el.type)) {
    rows.push(field('Contenido', `<textarea data-prop="content">${escapeHtml(el.content)}</textarea>`));
    rows.push(`<div class="field-row">
      ${field('Tamaño de texto', `<input type="number" min="10" max="220" data-prop="fontSize" value="${el.fontSize}">`)}
      ${field('Color de texto', `<input type="color" data-prop="color" value="${el.color}">`)}
    </div>`);
    rows.push(field('Alineación del texto', `
      <div class="align-group">
        ${['left', 'center', 'right'].map(a => `<button type="button" class="align-btn${el.align === a ? ' is-active' : ''}" data-align="${a}">${a === 'left' ? 'Izq.' : a === 'center' ? 'Centro' : 'Der.'}</button>`).join('')}
      </div>`));
    rows.push(field('Grosor', `
      <div class="weight-group">
        ${[400, 600, 700].map(w => `<button type="button" class="weight-btn${el.weight === w ? ' is-active' : ''}" data-weight="${w}">${w === 400 ? 'Normal' : w === 600 ? 'Semibold' : 'Bold'}</button>`).join('')}
      </div>`));
    if (el.type === 'tag') {
      rows.push(field('Color de fondo del tag', `<input type="color" data-prop="bg" value="${el.bg}">`));
    }
  }

  if (el.type === 'plate') {
    rows.push(field('Color', `<input type="color" data-prop="color" value="${el.color}">`));
    rows.push(field(`Opacidad (${Math.round(el.opacity * 100)}%)`, `<input type="range" min="0" max="1" step="0.05" data-prop="opacity" value="${el.opacity}">`));
    rows.push(field(`Bordes redondeados (${el.radius}px)`, `<input type="range" min="0" max="60" data-prop="radius" value="${el.radius}">`));
  }

  if (el.type === 'image') {
    rows.push(field('Imagen', `<button type="button" class="btn btn-secondary btn-block" id="btnReplaceImg">Reemplazar imagen</button>`));
    rows.push(field(`Bordes redondeados (${el.radius}px)`, `<input type="range" min="0" max="60" data-prop="radius" value="${el.radius}">`));
    rows.push(field('Ajuste', `<select data-prop="fit"><option value="cover"${el.fit === 'cover' ? ' selected' : ''}>Cubrir (cover)</option><option value="contain"${el.fit === 'contain' ? ' selected' : ''}>Contener (contain)</option></select>`));
  }

  // acomodar en el lienzo con un clic (para no depender de X/Y)
  rows.push(field('Acomodar en el lienzo', `
    <div class="canvas-align-group" style="margin-bottom:0.4rem">
      <button type="button" class="canvas-align-btn" data-canvas-align="left" title="Alinear a la izquierda"><svg viewBox="0 0 24 24"><path d="M4 4v16M8 9h10v6H8z"/></svg></button>
      <button type="button" class="canvas-align-btn" data-canvas-align="center-h" title="Centrar horizontalmente"><svg viewBox="0 0 24 24"><path d="M12 4v16M7 9h10v6H7z"/></svg></button>
      <button type="button" class="canvas-align-btn" data-canvas-align="right" title="Alinear a la derecha"><svg viewBox="0 0 24 24"><path d="M20 4v16M6 9h10v6H6z"/></svg></button>
    </div>
    <div class="canvas-align-group">
      <button type="button" class="canvas-align-btn" data-canvas-align="top" title="Alinear arriba"><svg viewBox="0 0 24 24"><path d="M4 4h16M9 8h6v10H9z"/></svg></button>
      <button type="button" class="canvas-align-btn" data-canvas-align="center-v" title="Centrar verticalmente"><svg viewBox="0 0 24 24"><path d="M4 12h16M9 7h6v10H9z"/></svg></button>
      <button type="button" class="canvas-align-btn" data-canvas-align="bottom" title="Alinear abajo"><svg viewBox="0 0 24 24"><path d="M4 20h16M9 6h6v10H9z"/></svg></button>
    </div>`));

  rows.push(field('Posición X / Y', `<div class="field-row">
      <input type="number" data-prop="x" value="${Math.round(el.x)}">
      <input type="number" data-prop="y" value="${Math.round(el.y)}">
    </div>`, true));
  rows.push(field('Ancho / Alto', `<div class="field-row">
      <input type="number" data-prop="w" value="${Math.round(el.w)}">
      <input type="number" data-prop="h" value="${Math.round(el.h)}">
    </div>`, true));

  form.innerHTML = rows.join('');

  $$('[data-prop]', form).forEach(input => {
    input.addEventListener('input', () => {
      const prop = input.dataset.prop;
      let val = input.value;
      if (['fontSize', 'x', 'y', 'w', 'h'].includes(prop)) val = Number(val) || 0;
      if (prop === 'opacity' || prop === 'radius') val = Number(val);
      if (prop === 'w') val = Math.max(val, MIN_W);
      if (prop === 'h') val = Math.max(val, MIN_H);
      el[prop] = val;
      renderElements();
      renderLayers();
      debouncedCommit();
    });
  });

  $$('.align-btn', form).forEach(b => b.addEventListener('click', () => { el.align = b.dataset.align; render(); renderProps(); commit(); }));
  $$('.weight-btn', form).forEach(b => b.addEventListener('click', () => { el.weight = Number(b.dataset.weight); render(); renderProps(); commit(); }));

  $$('.canvas-align-btn', form).forEach(b => b.addEventListener('click', () => {
    const f = fmt();
    switch (b.dataset.canvasAlign) {
      case 'left': el.x = SAFE_MARGIN; break;
      case 'center-h': el.x = Math.round((f.w - el.w) / 2); break;
      case 'right': el.x = f.w - SAFE_MARGIN - el.w; break;
      case 'top': el.y = SAFE_MARGIN; break;
      case 'center-v': el.y = Math.round((f.h - el.h) / 2); break;
      case 'bottom': el.y = f.h - SAFE_MARGIN - el.h; break;
    }
    render();
    renderProps();
    commit();
  }));

  const replaceBtn = $('#btnReplaceImg', form);
  if (replaceBtn) {
    replaceBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          el.src = ev.target.result;
          render();
          commit();
          saveToLibrary(file, ev.target.result);
        };
        reader.readAsDataURL(file);
      });
      input.click();
    });
  }

  attachBrandSwatches(form);
}

function field(label, inner, small) {
  return `<div class="field${small ? ' field-small' : ''}"><label>${label}</label>${inner}</div>`;
}

// ---------- capas ----------
function renderLayers() {
  const ul = $('#layersList');
  const empty = $('#layersEmpty');
  const count = $('#layerCount');

  count.textContent = state.elements.length ? `(${state.elements.length})` : '';

  if (state.elements.length === 0) {
    ul.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  const sorted = [...state.elements].sort((a, b) => b.z - a.z); // arriba = más adelante
  ul.innerHTML = '';

  sorted.forEach(el => {
    const issues = validateElement(el);
    const hasError = issues.some(i => i.level === 'error') || el._overflow;

    const li = document.createElement('li');
    li.className = 'layer-row' + (el.id === state.selectedId ? ' is-selected' : '') + (el.hidden ? ' is-hidden' : '') + (hasError ? ' has-error' : '');
    li.innerHTML = `
      ${hasError ? '<span class="layer-error-dot" title="Tiene un aviso"></span>' : ''}
      <span class="layer-icon">${layerIcon(el.type)}</span>
      <span class="layer-name">${escapeHtml(elementLabel(el))}</span>
      <span class="layer-actions">
        <button data-action="up" title="Subir capa"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
        <button data-action="down" title="Bajar capa"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></button>
        <button data-action="toggle" title="${el.hidden ? 'Mostrar' : 'Ocultar'}">${el.hidden ? '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.8 21.8 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.8 21.8 0 01-2.16 3.19M1 1l22 22"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'}</button>
        <button data-action="delete" title="Eliminar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </span>
    `;
    li.addEventListener('click', ev => {
      if (ev.target.closest('button')) return;
      selectElement(el.id);
    });
    li.querySelector('[data-action="up"]').addEventListener('click', () => stepLayer(el.id, +1));
    li.querySelector('[data-action="down"]').addEventListener('click', () => stepLayer(el.id, -1));
    li.querySelector('[data-action="toggle"]').addEventListener('click', () => { el.hidden = !el.hidden; render(); commit(); });
    li.querySelector('[data-action="delete"]').addEventListener('click', () => removeElement(el.id));
    ul.appendChild(li);
  });
}

function layerIcon(type) {
  const icons = {
    title: '<svg viewBox="0 0 24 24"><path d="M5 4h14M12 4v16"/></svg>',
    subtitle: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h10"/></svg>',
    paragraph: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    tag: '<svg viewBox="0 0 24 24"><path d="M20.59 13.41L11 3.83A2 2 0 009.59 3.24L4 3a1 1 0 00-1 1l.24 5.59a2 2 0 00.59 1.41l9.58 9.58a2 2 0 002.83 0l4.35-4.35a2 2 0 000-2.82z"/></svg>',
    date: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/></svg>',
    plate: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="10" rx="2"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
  };
  return icons[type] || '';
}

// ---------- atajos de teclado ----------
window.addEventListener('keydown', ev => {
  const target = ev.target;
  const typing = target.matches?.('input, textarea, select') || target.isContentEditable;

  if (ev.key === 'Escape') {
    if (!$('#helpModal').hidden) { $('#helpModal').hidden = true; return; }
    if (!$('#statusPopover').hidden) { closeStatusPopover(); return; }
    if (!typing) deselect();
    return;
  }
  if (typing) return;

  const mod = ev.ctrlKey || ev.metaKey;

  if (mod && ev.key.toLowerCase() === 'z') {
    ev.preventDefault();
    ev.shiftKey ? redo() : undo();
    return;
  }
  if (mod && ev.key.toLowerCase() === 'y') {
    ev.preventDefault();
    redo();
    return;
  }

  const el = getEl(state.selectedId);
  if (!el) return;

  if (mod && ev.key.toLowerCase() === 'd') {
    ev.preventDefault();
    duplicateElement(el.id);
    return;
  }
  if (ev.key === 'Delete' || ev.key === 'Backspace') {
    ev.preventDefault();
    removeElement(el.id);
    return;
  }

  const step = ev.shiftKey ? 10 : 1;
  let movedKey = true;
  switch (ev.key) {
    case 'ArrowLeft': el.x -= step; break;
    case 'ArrowRight': el.x += step; break;
    case 'ArrowUp': el.y -= step; break;
    case 'ArrowDown': el.y += step; break;
    default: movedKey = false;
  }
  if (movedKey) {
    ev.preventDefault();
    renderElements();
    renderProps();
    debouncedCommit();
  }
});

// ---------- vista "Subir archivo" ----------
const dropzone = $('#uploadDropzone');
let uploadedFile = null; // {src, name, w, h}

dropzone.addEventListener('click', () => $('#inputUploadFile').click());
dropzone.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $('#inputUploadFile').click(); }
});
dropzone.addEventListener('dragover', ev => { ev.preventDefault(); dropzone.classList.add('is-dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
dropzone.addEventListener('drop', ev => {
  ev.preventDefault();
  dropzone.classList.remove('is-dragover');
  const file = ev.dataTransfer.files[0];
  if (file) readUploadFile(file);
});
$('#inputUploadFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) readUploadFile(file);
  e.target.value = '';
});

function readUploadFile(file) {
  if (!file.type.startsWith('image/')) {
    toast('Ese archivo no es una imagen', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    const src = ev.target.result;
    const img = new Image();
    img.onload = () => {
      uploadedFile = { src, name: file.name, w: img.naturalWidth, h: img.naturalHeight };
      $('#uploadPreviewImg').src = src;
      $('#uploadPreviewName').textContent = file.name;
      $('#uploadPreviewMeta').textContent = `${img.naturalWidth} × ${img.naturalHeight} px · ${Math.round(file.size / 1024)} KB`;
      $('#uploadPreview').hidden = false;
      dropzone.hidden = true;
      addResourceToLibrary(file.name, src, img.naturalWidth, img.naturalHeight);
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
}

function switchToEditor() {
  $$('.source-tab').forEach(t => t.classList.toggle('is-active', t.dataset.source === 'editor'));
  $('#uploadView').hidden = true;
  $('#editorView').style.display = '';
  layoutCanvas();
  render();
}

$('#btnUploadAsBg').addEventListener('click', () => {
  if (!uploadedFile) return;
  setBackgroundImage(uploadedFile.src);
  switchToEditor();
  toast('La imagen quedó como fondo del lienzo', 'success');
});
$('#btnUploadAsElement').addEventListener('click', () => {
  if (!uploadedFile) return;
  switchToEditor();
  addImageElement(uploadedFile.src);
});
$('#btnUploadClear').addEventListener('click', () => {
  uploadedFile = null;
  $('#uploadPreview').hidden = true;
  dropzone.hidden = false;
});

// ---------- export PNG ----------
async function exportPNG() {
  const stage = $('#canvasStage');
  const btn = $('#btnExport');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Generando…';

  const prevSelected = state.selectedId;
  state.selectedId = null;
  stage.classList.add('is-exporting');
  const prevTransform = stage.style.transform;
  stage.style.transform = 'none';
  renderElements();

  try {
    const canvas = await html2canvas(stage, { backgroundColor: null, useCORS: true, scale: 1 });
    const link = document.createElement('a');
    const f = fmt();
    link.download = `noticia-${f.w}x${f.h}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('Imagen exportada en tamaño real', 'success');
    return true;
  } catch (err) {
    toast('No se pudo exportar la imagen', 'error');
    console.error(err);
    return false;
  } finally {
    stage.classList.remove('is-exporting');
    stage.style.transform = prevTransform;
    state.selectedId = prevSelected;
    btn.disabled = false;
    btn.innerHTML = original;
    render();
  }
}

$('#btnExport').addEventListener('click', exportPNG);

// "Usar esta imagen": exporta y simula el enganche con el flujo real de subida
$('#btnUseImage').addEventListener('click', async () => {
  const ok = await exportPNG();
  if (ok) toast('En el ABM real, esta imagen quedaría cargada en la noticia', 'info', { duration: 5000 });
});

$('#btnCancelEditor').addEventListener('click', () => {
  if (confirm('¿Empezar de nuevo? Se pierde el diseño actual.')) {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    history.past = [];
    history.future = [];
    lastSnapshot = null;
    state.elements = [];
    state.selectedId = null;
    state.nextId = 1;
    state.nextZ = 1;
    state.format = 'square';
    state.background = { type: 'color', value: '#130D5D' };
    $$('.format-btn').forEach(b => b.classList.toggle('is-active', b.dataset.format === 'square'));
    renderBgPresets();
    layoutCanvas();
    seedTemplate();
    toast('Editor reiniciado', 'info');
  }
});

// ---------- render general ----------
function render() {
  renderElements();
  renderLayers();
}

// ---------- init ----------
function seedTemplate() {
  addElement('plate');
  addElement('title');
  addElement('subtitle');
  addElement('date');
  deselect();
  commit();
}

function init() {
  loadBrandColors();
  renderBrandColors();
  renderBgPresets();
  renderDefaultLibrary();
  renderLibrary();
  layoutCanvas();

  const saved = loadPersisted();
  if (saved) {
    restore(saved);
    deselect();
    toast('Restauramos tu último diseño', 'info', {
      actionLabel: 'Empezar de nuevo',
      duration: 6000,
      onAction: () => $('#btnCancelEditor').click()
    });
  } else {
    seedTemplate();
  }
  // el primer layout puede correr antes de que cargue la fuente: recalcular al estar lista
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { layoutCanvas(); render(); });
  }
}

init();
