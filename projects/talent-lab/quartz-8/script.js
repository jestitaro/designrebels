/* QuartzEight — lógica real del mazo: armar, ver, cambiar y guardar
 * cartas. No hay backend: "guardar" persiste en localStorage de este
 * navegador y ofrece copiar el mazo como texto (nada de mail falso). */
var STORAGE_KEY = 'quartzeight_saved_deck';

var modal = document.getElementById('startModal');
var toast = document.getElementById('toast');
var heroDeck = document.getElementById('heroDeck');

var deckEditor = document.getElementById('deckEditor');
var deckEditorIdea = document.getElementById('deckEditorIdea');
var deckGrid = document.getElementById('deckGrid');
var detailTags = document.getElementById('detailTags');
var detailTitle = document.getElementById('detailTitle');
var detailPrompt = document.getElementById('detailPrompt');
var saveNote = document.getElementById('saveNote');
var btnResumeDeck = document.getElementById('btnResumeDeck');

var swapModal = document.getElementById('swapModal');
var swapHeadTitle = document.getElementById('swapHeadTitle');
var swapFiltersEl = document.getElementById('swapFilters');
var swapGrid = document.getElementById('swapGrid');
var swapPreview = document.getElementById('swapPreview');

var state = {
  hand: [],
  selectedIndex: 0,
  ideaText: '',
  swapTargetIndex: null,
  mode: null, // 'swap' | 'explore'
  filters: { category: 'todas', tipo: 'todas' }
};

function showToast(text, duration) {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, duration || 2200);
}

function shuffleArray(arr) {
  var copy = arr.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
  }
  return copy;
}

function cardById(id) {
  for (var i = 0; i < QUARTZ8_CARDS.length; i++) {
    if (QUARTZ8_CARDS[i].id === id) return QUARTZ8_CARDS[i];
  }
  return null;
}

/* ---------- modal de inicio ---------- */
function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(function () { document.getElementById('ideaInput').focus(); }, 120);
}
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-start]').forEach(function (btn) {
  btn.addEventListener('click', openModal);
});
document.querySelectorAll('#startModal [data-close]').forEach(function (el) {
  el.addEventListener('click', closeModal);
});
document.querySelectorAll('.mode').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.mode').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

document.getElementById('shuffleBtn').addEventListener('click', function () {
  var input = document.getElementById('ideaInput');
  var count = parseInt(document.querySelector('.mode.active').dataset.count, 10);
  if (!input.value.trim()) {
    input.focus();
    input.style.borderColor = '#7025e0';
    return;
  }
  heroDeck.classList.add('shuffle');
  setTimeout(function () { heroDeck.classList.remove('shuffle'); }, 900);
  startSession(count, input.value.trim());
  closeModal();
  input.value = '';
  input.style.borderColor = '';
  openDeckEditor();
  showToast('✦ Armamos tu mazo de ' + count + ' cartas');
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (!swapModal.hidden) { closeSwap(); return; }
  if (!deckEditor.hidden) { closeDeckEditor(); return; }
  if (modal.classList.contains('open')) closeModal();
});

/* ---------- armar / retomar un mazo ---------- */
function startSession(count, ideaText, seedCard) {
  var pool = QUARTZ8_CARDS.slice();
  var hand = [];
  if (seedCard) hand.push(seedCard);
  var excludeIds = hand.map(function (c) { return c.id; });
  var remaining = shuffleArray(pool.filter(function (c) { return excludeIds.indexOf(c.id) === -1; }));
  while (hand.length < count && remaining.length) hand.push(remaining.shift());
  state.hand = hand;
  state.ideaText = ideaText || '';
  state.selectedIndex = 0;
}

function persistDeck() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ideaText: state.ideaText,
      cardIds: state.hand.map(function (c) { return c.id; }),
      savedAt: Date.now()
    }));
    return true;
  } catch (e) {
    return false;
  }
}

function loadSavedDeck() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function checkResumeButton() {
  var saved = loadSavedDeck();
  if (saved && saved.cardIds && saved.cardIds.length) {
    btnResumeDeck.hidden = false;
  }
}
checkResumeButton();

btnResumeDeck.addEventListener('click', function () {
  var saved = loadSavedDeck();
  if (!saved) return;
  var cards = saved.cardIds.map(cardById).filter(Boolean);
  if (!cards.length) return;
  state.hand = cards;
  state.ideaText = saved.ideaText || '';
  state.selectedIndex = 0;
  openDeckEditor();
});

/* ---------- editor del mazo ---------- */
function openDeckEditor() {
  deckEditor.hidden = false;
  document.body.classList.add('lightbox-open');
  renderDeckEditor();
}
function closeDeckEditor() {
  deckEditor.hidden = true;
  document.body.classList.remove('lightbox-open');
}
document.getElementById('deckEditorClose').addEventListener('click', closeDeckEditor);

function renderDeckEditor() {
  if (state.ideaText) {
    deckEditorIdea.hidden = false;
    deckEditorIdea.innerHTML = '<span>Idea</span> ' + escapeHtml(state.ideaText);
  } else {
    deckEditorIdea.hidden = true;
  }
  renderDeckGrid();
  renderDetail();
}

function renderDeckGrid() {
  deckGrid.innerHTML = '';
  state.hand.forEach(function (card, i) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'de-card' + (i === state.selectedIndex ? ' is-selected' : '');
    el.innerHTML =
      '<span class="de-card-cat">' + QUARTZ8_CATEGORIES[card.category] + '</span>' +
      '<b>' + escapeHtml(card.title) + '</b>';
    el.addEventListener('click', function () { selectCard(i); });
    deckGrid.appendChild(el);
  });
}

function selectCard(i) {
  state.selectedIndex = i;
  renderDeckGrid();
  renderDetail();
}

function renderDetail() {
  var card = state.hand[state.selectedIndex];
  if (!card) return;
  detailTags.innerHTML =
    '<span>' + QUARTZ8_CATEGORIES[card.category] + '</span><span>' + QUARTZ8_TIPOS[card.tipo] + '</span>';
  detailTitle.textContent = card.title;
  detailPrompt.textContent = card.prompt;
  saveNote.hidden = true;
}

document.getElementById('btnSwapCard').addEventListener('click', function () {
  openSwap(state.selectedIndex);
});

document.getElementById('btnSaveDeck').addEventListener('click', function () {
  var ok = persistDeck();
  saveNote.hidden = false;
  saveNote.innerHTML = ok
    ? 'Guardado en este navegador ✓ <button type="button" id="btnCopyDeck" class="text-btn">Copiar como texto</button>'
    : 'No se pudo guardar en este navegador.';
  if (ok) {
    document.getElementById('btnCopyDeck').addEventListener('click', copyDeckAsText);
    btnResumeDeck.hidden = false;
  }
});

function copyDeckAsText() {
  var lines = ['QuartzEight — ' + (state.ideaText || 'sin idea guardada')];
  state.hand.forEach(function (card, i) {
    lines.push((i + 1) + '. [' + QUARTZ8_CATEGORIES[card.category] + '] ' + card.title + ': ' + card.prompt);
  });
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showToast('✦ Mazo copiado al portapapeles');
    }).catch(function () {
      showToast('No se pudo copiar');
    });
  }
}

/* ---------- cambiar / explorar cartas ---------- */
function openSwap(index) {
  state.mode = 'swap';
  state.swapTargetIndex = index;
  state.filters = { category: 'todas', tipo: 'todas' };
  swapHeadTitle.textContent = '◆ Cambiar esta carta';
  swapModal.hidden = false;
  renderSwapFilters();
  renderSwapGrid();
  renderSwapPreview(null);
}

function openExplore(categoryKey) {
  state.mode = 'explore';
  state.swapTargetIndex = null;
  state.filters = { category: categoryKey || 'todas', tipo: 'todas' };
  swapHeadTitle.textContent = '◆ Explorá el mazo ' + (QUARTZ8_CATEGORIES[categoryKey] || '');
  swapModal.hidden = false;
  renderSwapFilters();
  renderSwapGrid();
  renderSwapPreview(null);
}

function closeSwap() {
  swapModal.hidden = true;
}
document.getElementById('swapClose').addEventListener('click', closeSwap);

function renderSwapFilters() {
  var catChips = ['todas'].concat(Object.keys(QUARTZ8_CATEGORIES)).map(function (key) {
    var label = key === 'todas' ? 'Todos los mazos' : QUARTZ8_CATEGORIES[key];
    var active = state.filters.category === key ? ' is-active' : '';
    return '<button type="button" class="swap-chip' + active + '" data-filter-category="' + key + '">' + label + '</button>';
  }).join('');
  var tipoChips = ['todas'].concat(Object.keys(QUARTZ8_TIPOS)).map(function (key) {
    var label = key === 'todas' ? 'Todos los tipos' : QUARTZ8_TIPOS[key];
    var active = state.filters.tipo === key ? ' is-active' : '';
    return '<button type="button" class="swap-chip' + active + '" data-filter-tipo="' + key + '">' + label + '</button>';
  }).join('');
  swapFiltersEl.innerHTML =
    '<div class="swap-filter-row">' + catChips + '</div>' +
    '<div class="swap-filter-row">' + tipoChips + '</div>';

  swapFiltersEl.querySelectorAll('[data-filter-category]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.filters.category = btn.dataset.filterCategory;
      renderSwapFilters();
      renderSwapGrid();
    });
  });
  swapFiltersEl.querySelectorAll('[data-filter-tipo]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.filters.tipo = btn.dataset.filterTipo;
      renderSwapFilters();
      renderSwapGrid();
    });
  });
}

function candidateCards() {
  var excludeIds = state.mode === 'swap'
    ? state.hand.map(function (c) { return c.id; })
    : [];
  return QUARTZ8_CARDS.filter(function (c) {
    if (excludeIds.indexOf(c.id) !== -1) return false;
    if (state.filters.category !== 'todas' && c.category !== state.filters.category) return false;
    if (state.filters.tipo !== 'todas' && c.tipo !== state.filters.tipo) return false;
    return true;
  });
}

function renderSwapGrid() {
  var cards = candidateCards();
  swapGrid.innerHTML = '';
  if (!cards.length) {
    swapGrid.innerHTML = '<p class="swap-empty">No hay cartas con estos filtros.</p>';
    return;
  }
  cards.forEach(function (card) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'de-card';
    el.innerHTML =
      '<span class="de-card-cat">' + QUARTZ8_CATEGORIES[card.category] + '</span>' +
      '<b>' + escapeHtml(card.title) + '</b>';
    el.addEventListener('click', function () { renderSwapPreview(card); });
    swapGrid.appendChild(el);
  });
}

function renderSwapPreview(card) {
  if (!card) {
    swapPreview.innerHTML = '<p class="swap-preview-empty">Elegí una carta para ver el detalle.</p>';
    return;
  }
  var actionLabel = state.mode === 'swap' ? 'Usar esta carta' : 'Empezar un mazo con esta carta';
  swapPreview.innerHTML =
    '<div class="de-detail-tags"><span>' + QUARTZ8_CATEGORIES[card.category] + '</span><span>' + QUARTZ8_TIPOS[card.tipo] + '</span></div>' +
    '<h2>' + escapeHtml(card.title) + '</h2>' +
    '<p>' + escapeHtml(card.prompt) + '</p>' +
    '<button class="btn btn-primary" type="button" id="btnUseCard">' + actionLabel + '</button>';
  document.getElementById('btnUseCard').addEventListener('click', function () {
    if (state.mode === 'swap') {
      state.hand[state.swapTargetIndex] = card;
      closeSwap();
      renderDeckEditor();
      selectCard(state.swapTargetIndex);
      showToast('✦ Carta cambiada');
    } else {
      closeSwap();
      startSession(3, '', card);
      openDeckEditor();
    }
  });
}

document.querySelectorAll('[data-explore]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    openExplore(btn.dataset.explore);
  });
});

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- animaciones de landing (scroll-in, mazo demo) ---------- */
document.querySelectorAll('.deck-card').forEach(function (card) {
  card.addEventListener('click', function (e) {
    if (e.target.closest('[data-explore]')) return;
    var name = card.dataset.deck;
    toast.textContent = 'Mazo "' + name + '" seleccionado — usá "Ver cartas" para explorarlo';
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 1800);
  });
});

var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.animate([
        { opacity: 0, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });

document.querySelectorAll('.step-card,.deck-card,.workspace-card,.manifesto-card').forEach(function (el) {
  observer.observe(el);
});

var shuffleStyle = document.createElement('style');
shuffleStyle.textContent =
  '.deck.shuffle .card-1{animation:shuffleA .75s ease}' +
  '.deck.shuffle .card-2{animation:shuffleB .75s ease}' +
  '.deck.shuffle .card-3{animation:shuffleC .75s ease}' +
  '@keyframes shuffleA{40%{transform:rotate(15deg) translate(140px,-15px)}}' +
  '@keyframes shuffleB{40%{transform:rotate(-18deg) translate(-150px,20px)}}' +
  '@keyframes shuffleC{40%{transform:rotate(8deg) translateY(-35px)}}';
document.head.appendChild(shuffleStyle);
