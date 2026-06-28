// app.js — QuartzProde 2026

// ── HELPERS GLOBALES (van primero para estar disponibles en todo el archivo) ──
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatFecha(iso) {
  if (!iso) return '';
  const [,m,d] = iso.split('-');
  const meses = ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m)]}`;
}

const HOGWARTS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzN_N1r29vMrWXoHyko1pQ-Zd5k9fYDcMBxCAct00wrmQ4VMYpwDmEcvpO0hHNJRFB1oQ/exec";

let hogwartsMembers = {}; // { "Nombre": "Casa" }

let currentUser       = null;
let myPreds           = {};
let resultados        = {};
let allUsers          = [];
let allPreds          = [];
let fasesHabilitadas  = [];
let bracket           = {}; // { slot: equipo } resuelto desde Firestore
let currentFase       = "Fase de Grupos";
let currentModal      = null;

const CASA_COLORS = {
  Gryffindor: "#E11D48",
  Hufflepuff: "#F59E0B",
  Ravenclaw:  "#2563EB",
  Slytherin:  "#059669"
};
const CASA_INITIAL = { Gryffindor:"G", Hufflepuff:"H", Ravenclaw:"R", Slytherin:"S" };

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Bloquear scroll solo en desktop (en mobile necesitamos scroll en el login)
  if (window.innerWidth > 768) {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  setupNav();
  setupModal();
  setupLogin();

  const saved = localStorage.getItem('qp2026_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.nombre && parsed?.email) {
        // Verificar que el usuario todavía existe en Firebase
        const userDoc = await window.dbGetUser(parsed.email);
        if (userDoc) {
          currentUser = parsed;
          await initApp();
          return;
        } else {
          // Usuario borrado de Firebase — limpiar sesión
          localStorage.removeItem('qp2026_user');
        }
      }
    } catch(e) {}
    localStorage.removeItem('qp2026_user');
  }
});

// ── HOGWARTZ LOOKUP ───────────────────────────
function jsonpFetch(url) {
  return new Promise((resolve, reject) => {
    const cb = "__hq_" + Date.now() + "_" + Math.floor(Math.random() * 1e5);
    const timeout = setTimeout(() => { cleanup(); reject(new Error("Timeout")); }, 15000);
    function cleanup() {
      clearTimeout(timeout);
      try { delete window[cb]; } catch(e) {}
      document.getElementById("__hq_s")?.remove();
    }
    window[cb] = p => { cleanup(); resolve(p); };
    const s = document.createElement("script");
    s.id = "__hq_s";
    s.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
    s.onerror = () => { cleanup(); reject(new Error("Script error")); };
    document.head.appendChild(s);
  });
}

async function loadHogwartsMembers(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await jsonpFetch(HOGWARTS_ENDPOINT + "?action=state");
      if (!data?.ok) continue;
      hogwartsMembers = {};
      Object.entries(data.houses || {}).forEach(([casa, h]) => {
        (h.members || []).forEach(n => {
          if (n?.trim()) hogwartsMembers[n.trim()] = casa;
        });
      });
      if (Object.keys(hogwartsMembers).length > 0) return true;
    } catch(e) {
      console.warn(`Hogwartz intento ${i+1} fallido:`, e);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1500));
    }
  }
  // Fallback si el endpoint no responde
  console.warn('Usando lista hardcodeada como fallback');
  hogwartsMembers = {
    "Agus":"Slytherin","Ale":"Hufflepuff","Chino":"Gryffindor",
    "David":"Ravenclaw","Euge":"Ravenclaw","Fran":"Ravenclaw",
    "Guille":"Hufflepuff","Javi":"Gryffindor","Jesi":"Gryffindor",
    "Jona":"Hufflepuff","Lore":"Gryffindor","Lucre":"Hufflepuff",
    "Marian":"Hufflepuff","Mati":"Slytherin","May(ra)":"Gryffindor","Menta":"Hufflepuff",
    "Nico":"Slytherin","Pablo":"Slytherin","Picci":"Ravenclaw",
    "Sebas":"Ravenclaw","Sergio":"Gryffindor","Vale":"Ravenclaw"
  };
  return true;
}

// ── LOGIN ─────────────────────────────────────
function setupLogin() {
  const selectEl = document.getElementById('login-name-search');

  loadHogwartsMembers().then(ok => {
    selectEl.innerHTML = '<option value="">— Seleccioná tu nombre —</option>';
    if (ok) {
      const names = Object.keys(hogwartsMembers).sort();
      names.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        selectEl.appendChild(opt);
      });
      selectEl.disabled = false;
    } else {
      selectEl.innerHTML = '<option value="">⚠ Error al cargar — tocá para reintentar</option>';
      selectEl.disabled = false;
      selectEl.addEventListener('focus', async function retry() {
        selectEl.innerHTML = '<option value="">Cargando…</option>';
        selectEl.disabled = true;
        const ok2 = await loadHogwartsMembers();
        if (ok2) {
          selectEl.innerHTML = '<option value="">— Seleccioná tu nombre —</option>';
          Object.keys(hogwartsMembers).sort().forEach(name => {
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = name;
            selectEl.appendChild(opt);
          });
          selectEl.removeEventListener('focus', retry);
        } else {
          selectEl.innerHTML = '<option value="">⚠ Error al cargar — tocá para reintentar</option>';
        }
        selectEl.disabled = false;
      });
    }
  });

  // Toggle contraseña
  document.getElementById('toggle-pass').addEventListener('click', () => {
    const input = document.getElementById('login-password');
    const icon  = document.getElementById('toggle-pass-icon');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.className = input.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
  });

  // Botón login
  document.getElementById('btn-login').addEventListener('click', async () => {
    const nombre   = selectEl.value;
    const password = document.getElementById('login-password').value;
    const casa     = hogwartsMembers[nombre] || null;

    if (!nombre)                          return showToast('Seleccioná tu nombre', 'warn');
    if (!password || password.length < 4) return showToast('Ingresá una contraseña de al menos 4 caracteres', 'warn');
    if (!casa)                            return showToast('No se pudo obtener tu casa — recargá la página', 'warn');

    const btn = document.getElementById('btn-login');
    btn.innerHTML = 'Entrando… <i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled  = true;

    try {
      const emailInterno = nombre.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') + '@quartzprode.internal';
      const result = await window.dbSaveUser({ nombre, email: emailInterno, casa, password });

      if (result === 'wrong_password') {
        showToast('Contraseña incorrecta. Si es tu primera vez, creá una nueva.', 'error');
        document.getElementById('login-password').value = '';
        document.getElementById('login-password').focus();
        btn.innerHTML = 'Entrar al prode <i class="fa-solid fa-arrow-right"></i>';
        btn.disabled  = false;
        return;
      }

      currentUser = { nombre, email: emailInterno, casa };
      localStorage.setItem('qp2026_user', JSON.stringify(currentUser));
      launchConfetti();
      setTimeout(() => initApp(), 900);
    } catch(e) {
      console.error('Login error:', e);
      showToast('Error al conectar con Firebase', 'error');
      btn.innerHTML = 'Entrar al prode <i class="fa-solid fa-arrow-right"></i>';
      btn.disabled  = false;
    }
  });
}

// ── INIT APP ──────────────────────────────────
async function initApp() {
  try {
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-app').classList.add('active');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.background = 'var(--surface)';

    document.getElementById('user-name-display').textContent = currentUser.nombre;
    window._currentUserEmail = currentUser.email;

    const badge = document.getElementById('user-casa-badge');
    if (badge) {
      badge.style.background = CASA_COLORS[currentUser.casa] || '#64748b';
      badge.textContent = CASA_INITIAL[currentUser.casa] || '•';
    }

    // Logout — remover listener viejo si existe
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      const fresh = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(fresh, logoutBtn);
      fresh.addEventListener('click', logout);
    }

    await refreshData();
    currentFase = (fasesHabilitadas && fasesHabilitadas[0]) || 'Fase de Grupos';
    renderFaseFilter();
    renderPartidos();
  } catch(e) {
    console.error('initApp error:', e);
    document.getElementById('partidos-grid').innerHTML =
      `<p style="color:red;padding:40px;font-weight:700">Error al iniciar: ${e.message}</p>`;
  }
}

async function refreshData() {
  try {
    const [preds, res, users, apreds, fases, brk] = await Promise.all([
      window.dbGetMyPreds(currentUser.email),
      window.dbGetResultados(),
      window.dbGetAllUsers(),
      window.dbGetAllPreds(),
      window.dbGetFasesHabilitadas(),
      window.dbGetBracket()
    ]);
    myPreds          = preds   || {};
    resultados       = res     || {};
    allUsers         = users   || [];
    allPreds         = apreds  || [];
    fasesHabilitadas = fases   || [];
    bracket          = brk     || {};
    // Reemplazar los placeholders (1A, 3A/B/C/D/F, G73, P101…) por equipos reales
    resolveBracket();
  } catch(e) {
    console.error('refreshData error:', e);
    fasesHabilitadas = [];
    showToast('Error al cargar datos de Firebase', 'error');
  }
}

// ── RESOLUCIÓN DE PLACEHOLDERS DEL BRACKET ────────────────────
// Un placeholder NO es un nombre de país real: empieza con dígito ("1A","2B"),
// contiene "/" ("3A/B/C/D/F"), o es "G"/"P" + número ("G73","P101").
function isPlaceholder(token) {
  if (!token) return false;
  return /^\d/.test(token) || token.includes('/') || /^[GP]\d+$/.test(token);
}

// Resuelve un token a nombre de equipo real, o lo deja igual si todavía no se puede.
function resolveToken(token) {
  if (!isPlaceholder(token)) return token; // ya es un país real

  // Ganador / perdedor de un partido eliminatorio previo (G73 / P101)
  const m = /^([GP])(\d+)$/.exec(token);
  if (m) {
    const tipo  = m[1];                  // 'G' ganador | 'P' perdedor
    const refId = Number(m[2]);
    const ref   = PARTIDOS.find(x => x.id === refId);
    if (!ref) return token;
    // El cruce referido debe estar ya resuelto a equipos reales
    if (isPlaceholder(ref.equipoA) || isPlaceholder(ref.equipoB)) return token;
    const res = resultados[refId];
    if (!res || res.estado !== 'Finalizado' || (res.signo !== 'A' && res.signo !== 'B')) return token;
    const ganador  = res.signo === 'A' ? ref.equipoA : ref.equipoB;
    const perdedor = res.signo === 'A' ? ref.equipoB : ref.equipoA;
    return tipo === 'G' ? ganador : perdedor;
  }

  // Slot de grupo / mejor tercero (1A, 2B, 3A/B/C/D/F): viene del bracket
  return bracket[token] || token;
}

// Recorre PARTIDOS en orden de id (rondas tempranas primero, así G73/P101
// pueden apoyarse en cruces ya resueltos) y reemplaza los placeholders.
function resolveBracket() {
  if (!window.PARTIDOS) return;
  PARTIDOS.forEach(p => {
    if (isPlaceholder(p.equipoA)) p.equipoA = resolveToken(p.equipoA);
    if (isPlaceholder(p.equipoB)) p.equipoB = resolveToken(p.equipoB);
  });
}

// ── NAV ───────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      document.getElementById('view-' + view).classList.add('active');
      if (view === 'ranking') {
        renderRanking();
        renderCasas();
      }
    });
  });
}

// ── FASE FILTER ───────────────────────────────
function renderFaseFilter() {
  const container = document.getElementById('fase-filter');
  container.innerHTML = '';
  FASES_ORDEN.forEach(fase => {
    const habilitada = fasesHabilitadas.includes(fase);
    const chip = document.createElement('button');
    chip.className = 'fase-chip'
      + (fase === currentFase ? ' active' : '')
      + (!habilitada ? ' locked' : '');
    chip.innerHTML = habilitada
      ? escHtml(fase)
      : `${escHtml(fase)} <i class="fa-solid fa-lock"></i>`;
    chip.addEventListener('click', () => {
      currentFase = fase;
      document.querySelectorAll('.fase-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderPartidos();
    });
    container.appendChild(chip);
  });
}

// ── flag helpers ──────────────────────────────
function flagSpan(equipo) {
  const code = window.getFlag(equipo);
  if (code) {
    return `<span class="team-flag fi fi-${code}"></span>`;
  }
  return `<span class="team-flag placeholder">${escHtml(equipo)}</span>`;
}

function setFlagOnSpan(spanId, equipo) {
  const el = document.getElementById(spanId);
  const code = window.getFlag(equipo);
  if (code) {
    el.className = `score-flag fi fi-${code}`;
    el.textContent = '';
  } else {
    el.className = 'score-flag placeholder';
    el.textContent = equipo;
  }
}

// ── PARTIDOS ──────────────────────────────────
function buildCard(p, faseHabilitada) {
  const pred   = myPreds[p.id];
  const res    = resultados[p.id];
  const fin    = res && res.estado === 'Finalizado';
  const ptInfo = (fin && pred) ? calcularPuntos(pred.signo, res.signo) : null;
  // Cerrado por tiempo: faltan <2 h para ESTE partido.
  const cerradoPorTiempo = window.isPartidoLocked(p);
  // Bloqueado para editar = (fase no habilitada o ya cerrado por tiempo) y no finalizado.
  const locked = (!faseHabilitada || cerradoPorTiempo) && !fin;

  const card = document.createElement('div');
  card.className = 'partido-card'
    + (pred && !locked ? ' has-prediction' : '')
    + (fin    ? ' finalizado' : '')
    + (locked ? ' fase-locked' : '');

  // Texto legible del signo
  function signoLabel(signo, pa, pb) {
    if (signo === 'X') return 'Empate';
    if (signo === 'A') return pa;
    if (signo === 'B') return pb;
    return '—';
  }

  let predHtml;
  if (fin) {
    predHtml = pred
      ? `<div class="partido-prediction ${ptInfo ? 'pts-'+ptInfo.tipo : ''}">
           <span>Tu pred:</span>
           <span class="pred-score">${escHtml(signoLabel(pred.signo, p.equipoA, p.equipoB))}</span>
           ${ptInfo ? `<span>${ptInfo.puntos} pt${ptInfo.puntos !== 1 ? 's' : ''}</span>` : ''}
         </div>`
      : `<div class="partido-prediction"><span>Sin predicción · 0 puntos</span></div>`;
  } else if (locked) {
    // cerradoPorTiempo → ya pasó el límite de edición (lock); si no, la fase aún no se habilitó (clock).
    predHtml = pred
      ? `<div class="partido-prediction">
           <span>Tu pred:</span>
           <span class="pred-score">${escHtml(signoLabel(pred.signo, p.equipoA, p.equipoB))}</span>
         </div>`
      : `<div class="partido-prediction locked-pred">
           <i class="fa-solid fa-${cerradoPorTiempo ? 'lock' : 'clock'}"></i>
           <span>${cerradoPorTiempo ? 'Edición cerrada' : 'Disponible próximamente'}</span>
         </div>`;
  } else {
    predHtml = pred
      ? `<div class="partido-prediction">
           <span>Tu pred:</span>
           <span class="pred-score">${escHtml(signoLabel(pred.signo, p.equipoA, p.equipoB))}</span>
         </div>`
      : `<div class="partido-prediction"><span>Sin predicción — hacé clic para cargar</span></div>`;
  }

  const realLabel = res?.signo === 'X' ? 'Empate'
                  : res?.signo === 'A' ? p.equipoA
                  : res?.signo === 'B' ? p.equipoB : '';
  const realHtml = fin
    ? `<div class="partido-real-score">Real: <span class="real-badge">${escHtml(realLabel)}</span></div>`
    : '';

  card.innerHTML = `
    <div class="partido-fase">${p.fase} · #${p.id}</div>
    <div class="partido-matchup">
      <div class="partido-team">
        ${flagSpan(p.equipoA)}
        <span>${p.equipoA}</span>
      </div>
      <span class="partido-vs">vs</span>
      <div class="partido-team">
        ${flagSpan(p.equipoB)}
        <span>${p.equipoB}</span>
      </div>
    </div>
    <div class="partido-meta">
      <span><i class="fa-regular fa-calendar"></i> ${formatFecha(p.fecha)}</span>
      <span><i class="fa-solid fa-location-dot"></i> ${p.ciudad}</span>
    </div>
    ${realHtml}${predHtml}
  `;

  if (!locked) card.addEventListener('click', () => openModal(p.id));
  return card;
}

function renderPartidos() {
  const grid      = document.getElementById('partidos-grid');
  if (!grid) return;
  if (!window.PARTIDOS || !window.GRUPOS_MAPA) {
    grid.innerHTML = '<p style="color:red;padding:40px">Error: datos no cargados. Recargá la página.</p>';
    return;
  }
  // La fase debe estar habilitada por el admin; dentro de ella, cada partido
  // se bloquea individualmente 2 h antes de su kickoff (ver buildCard).
  const faseHabilitada = fasesHabilitadas.includes(currentFase);
  grid.innerHTML  = '';

  if (currentFase === 'Fase de Grupos') {
    grid.className = 'partidos-grid grupos-view';
    ['A','B','C','D','E','F','G','H','I','J','K','L'].forEach(g => {
      const section = document.createElement('div');
      section.className = 'grupo-section';

      // header del grupo
      const equipos = GRUPOS_EQUIPOS[g] || [];
      const teamsHtml = equipos.map(e => {
        return `<span class="grupo-team-item">${flagSpan(e)} ${escHtml(e)}</span>`;
      }).join('');
      const ids = GRUPOS_MAPA[g] || [];
      const total = ids.length;
      const completados = ids.filter(id => myPreds[Number(id)]).length;
      const pct = total ? Math.round(completados / total * 100) : 0;

      const header = document.createElement('div');
      header.className = 'grupo-header';
      header.innerHTML = `
        <span class="grupo-badge">Grupo ${g}</span>
        <span class="grupo-teams-list">${teamsHtml}</span>
        <span class="grupo-progress">
          <span class="grupo-progress-bar"><span class="grupo-progress-fill" style="width:${pct}%"></span></span>
          ${completados}/${total}
        </span>
      `;
      section.appendChild(header);

      // subgrid con las 6 cards
      const subGrid = document.createElement('div');
      subGrid.className = 'partidos-grid';
      (GRUPOS_MAPA[g] || []).forEach(id => {
        const p = PARTIDOS.find(x => x.id === id);
        if (p) subGrid.appendChild(buildCard(p, faseHabilitada));
      });
      section.appendChild(subGrid);
      grid.appendChild(section);
    });

  } else {
    grid.className = 'partidos-grid';
    const lista = PARTIDOS.filter(p => p.fase === currentFase);
    if (!lista.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);padding:40px;text-align:center;font-weight:600">No hay partidos en esta fase.</p>';
      return;
    }
    lista.forEach(p => grid.appendChild(buildCard(p, faseHabilitada)));
  }
}

// ── MODAL ─────────────────────────────────────
function setupModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-save').addEventListener('click', savePred);

  // Botones de signo — selección exclusiva
  document.querySelectorAll('.signo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.signo-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      // Habilitar botón guardar
      const saveBtn = document.getElementById('modal-save');
      if (saveBtn) saveBtn.disabled = false;
    });
  });
}

function openModal(matchId) {
  currentModal = matchId;
  const p    = PARTIDOS.find(x => x.id === matchId);
  const res  = resultados[matchId];
  const fin  = res && res.estado === 'Finalizado';

  if (!fin && !fasesHabilitadas.includes(p.fase)) {
    showToast('Las predicciones de esta fase todavía no están disponibles', 'warn');
    return;
  }
  if (!fin && window.isPartidoLocked(p)) {
    showToast('La edición de este partido cerró (2 h antes del inicio)', 'warn');
    return;
  }

  const pred = myPreds[matchId];
  const sinEmpate = FASES_SIN_EMPATE.includes(p.fase);

  document.getElementById('modal-match-header').innerHTML = `
    <div class="match-fase">${p.fase} · Partido #${p.id}</div>
    <div class="match-teams">
      <span>${p.equipoA}</span><span class="match-vs">vs</span><span>${p.equipoB}</span>
    </div>
    <div class="match-date">
      <i class="fa-regular fa-calendar"></i> ${formatFecha(p.fecha)} ${p.hora} · ${p.estadio}
    </div>
  `;

  // Banderas en botones
  setFlagOnSpan('modal-flag-a', p.equipoA);
  setFlagOnSpan('modal-flag-b', p.equipoB);
  document.getElementById('modal-team-a').textContent = p.equipoA;
  document.getElementById('modal-team-b').textContent = p.equipoB;

  // Mostrar/ocultar botón empate
  const btnEmpate = document.getElementById('modal-btn-x');
  btnEmpate.style.display = sinEmpate ? 'none' : 'flex';

  // Marcar selección actual
  ['A','X','B'].forEach(s => {
    document.getElementById('modal-btn-' + s.toLowerCase())
      ?.classList.toggle('selected', pred?.signo === s);
  });

  // Deshabilitar si terminó
  ['modal-btn-a','modal-btn-x','modal-btn-b'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = fin;
  });

  const saveBtn = document.getElementById('modal-save');
  const noteEl  = document.getElementById('modal-note');
  if (fin) {
    saveBtn.style.display = 'none';
    noteEl.textContent = 'El partido ya finalizó.';
  } else {
    saveBtn.style.display = 'flex';
    saveBtn.textContent = pred ? 'Actualizar predicción' : 'Guardar predicción';
    // Disabled hasta que elijan una opción (si no hay pred previa)
    saveBtn.disabled = !pred;
    noteEl.textContent = '';
  }

  const resEl = document.getElementById('modal-result-real');
  if (fin && res) {
    resEl.style.display = 'block';
    const realLabel = res.signo === 'X' ? 'Empate'
                    : res.signo === 'A' ? p.equipoA
                    : p.equipoB;
    document.getElementById('modal-score-real').textContent = `Resultado: ${realLabel}`;
    const badge = document.getElementById('modal-puntos-badge');
    if (pred) {
      const pt = calcularPuntos(pred.signo, res.signo);
      badge.className = 'modal-puntos-badge ' + pt.tipo;
      badge.innerHTML = pt.tipo === 'acierto'
        ? `<i class="fa-solid fa-check"></i> Acierto · +1 punto`
        : `<i class="fa-solid fa-xmark"></i> Sin puntos`;
    } else {
      badge.className = 'modal-puntos-badge sin-pred';
      badge.textContent = 'Sin predicción · 0 puntos';
    }
  } else {
    resEl.style.display = 'none';
  }

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  currentModal = null;
}

async function savePred() {
  const signo = document.querySelector('#modal-signo-btns .signo-btn.selected')?.dataset.signo;
  if (!signo) return showToast('Elegí un resultado', 'warn');

  // Revalidar el cierre por si el modal quedó abierto pasado el límite de 2 h.
  const p = PARTIDOS.find(x => x.id === currentModal);
  if (p && window.isPartidoLocked(p)) {
    showToast('La edición de este partido cerró (2 h antes del inicio)', 'warn');
    closeModal();
    renderPartidos();
    return;
  }

  const btn = document.getElementById('modal-save');
  btn.textContent = 'Guardando…';
  btn.disabled = true;

  try {
    await window.dbSavePred(currentModal, signo);
    myPreds[Number(currentModal)] = { signo };
    showToast('Predicción guardada', 'ok');
    closeModal();
    renderPartidos();
  } catch(e) {
    console.error('savePred error:', e);
    showToast('Error al guardar', 'error');
  } finally {
    btn.textContent = 'Guardar predicción';
    btn.disabled = false;
  }
}

// ── RANKING PARTICIPANTES ─────────────────────
function renderRanking() {
  const scoreMap = {};
  allUsers.forEach(u => {
    scoreMap[u.email] = { nombre: u.nombre, email: u.email, casa: u.casa,
      puntos: 0, exactos: 0, signos: 0 };
  });
  allPreds.forEach(pred => {
    const res = resultados[pred.matchId];
    if (!res || res.estado !== 'Finalizado') return;
    const pt = calcularPuntos(pred.signo, res.signo);
    if (!pt || !scoreMap[pred.email]) return;
    scoreMap[pred.email].puntos += pt.puntos;
    if (pt.tipo === 'acierto') scoreMap[pred.email].exactos++;
  });

  const sorted = Object.values(scoreMap).sort((a,b) => b.puntos - a.puntos || b.exactos - a.exactos);
  const tbody  = document.getElementById('ranking-tbody');
  const empty  = document.getElementById('ranking-empty');
  tbody.innerHTML = '';

  if (!sorted.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  sorted.forEach((u, i) => {
    const isMe = u.email === currentUser.email;
    const allZero = sorted.every(x => x.puntos === 0);
    const pos = allZero
      ? `<span class="rank-pos">${i+1}</span>`
      : i < 3
        ? `<span class="rank-pos ${['gold','silver','bronze'][i]}"><i class="fa-solid fa-medal"></i></span>`
        : `<span class="rank-pos">${i+1}</span>`;
    const initial = CASA_INITIAL[u.casa] || '?';
    const tr   = document.createElement('tr');
    if (isMe) tr.classList.add('my-row');
    tr.innerHTML = `
      <td>${pos}</td>
      <td><span class="rank-name">${escHtml(u.nombre)}${isMe ? ' <i class="fa-solid fa-arrow-left"></i>' : ''}</span></td>
      <td><span class="casa-mark ${u.casa}" title="${u.casa}">${initial}</span></td>
      <td><span class="rank-pts">${u.puntos}</span></td>
      <td>${u.exactos}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── RANKING CASAS ─────────────────────────────
function renderCasas() {
  const scoreMap = {};
  allUsers.forEach(u => { scoreMap[u.email] = { casa: u.casa, puntos: 0, exactos: 0 }; });
  allPreds.forEach(pred => {
    const res = resultados[pred.matchId];
    if (!res || res.estado !== 'Finalizado' || !scoreMap[pred.email]) return;
    const pt = calcularPuntos(pred.signo, res.signo);
    if (!pt) return;
    scoreMap[pred.email].puntos  += pt.puntos;
    scoreMap[pred.email].exactos += pt.tipo === 'acierto' ? 1 : 0;
  });

  const casaTotals = {};
  Object.keys(CASA_COLORS).forEach(c => { casaTotals[c] = { casa: c, puntos: 0, exactos: 0, miembros: 0 }; });
  allUsers.forEach(u => { if (casaTotals[u.casa]) casaTotals[u.casa].miembros++; });
  // Calcular multiplicador dinámico por casa: promedio_global / miembros_casa
  const totalMiembros = Object.values(casaTotals).reduce((s, c) => s + c.miembros, 0);
  const casasConMiembros = Object.values(casaTotals).filter(c => c.miembros > 0).length;
  const promedio = casasConMiembros > 0 ? totalMiembros / casasConMiembros : 1;

  Object.values(scoreMap).forEach(u => {
    if (casaTotals[u.casa]) {
      const miembros = casaTotals[u.casa].miembros;
      const mult = miembros > 0 ? promedio / miembros : 1;
      casaTotals[u.casa].puntos  += Math.round(u.puntos * mult);
      casaTotals[u.casa].exactos += u.exactos;
    }
  });

  const sorted = Object.values(casaTotals).sort((a,b) => b.puntos - a.puntos);

  // Mini cards arriba
  const casasGrid = document.getElementById('casas-grid');
  casasGrid.innerHTML = '';
  sorted.forEach((c, i) => {
    const ppp  = c.miembros > 0 ? (c.puntos / c.miembros).toFixed(1) : '—';
    const multC = c.miembros > 0 ? promedio / c.miembros : 1;
    const multStr = Number.isInteger(multC) ? `×${multC}` : `×${multC.toFixed(2)}`;
    const multBadgeCard = Math.abs(multC - 1) > 0.01
      ? ` <span class="mult-badge">${multStr}</span>` : '';
    const div  = document.createElement('div');
    div.className = `casa-mini-card ${c.casa}`;
    div.innerHTML = `
      <div class="casa-mini-mark">${CASA_INITIAL[c.casa]}</div>
      <div class="casa-mini-info">
        <div class="casa-mini-name">${c.casa}${multBadgeCard}</div>
        <div class="casa-mini-pts">${c.puntos} <span>pts</span></div>
      </div>
    `;
    casasGrid.appendChild(div);
  });

  // Tabla
  const tbody = document.getElementById('casas-tbody');
  tbody.innerHTML = '';
  sorted.forEach((c, i) => {
    const ppp = c.miembros > 0 ? Math.round(c.puntos / c.miembros) : '—';
    const multDisplay = c.miembros > 0 ? (promedio / c.miembros) : 1;
    const multStrT = Number.isInteger(multDisplay) ? `×${multDisplay}` : `×${multDisplay.toFixed(2)}`;
    const multBadge = Math.abs(multDisplay - 1) > 0.01
      ? ` <span class="mult-badge">${multStrT}</span>` : '';
    const allZero = sorted.every(x => x.puntos === 0);
    const isLast = i === sorted.length - 1;
    const pos = allZero
      ? `<span class="rank-pos">${i+1}</span>`
      : i < 3
        ? `<span class="rank-pos ${['gold','silver','bronze'][i]}"><i class="fa-solid fa-medal"></i></span>`
        : isLast
          ? `<span class="rank-pos last"><i class="fa-solid fa-face-sad-tear"></i></span>`
          : `<span class="rank-pos">${i+1}</span>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pos}</td>
      <td>
        <span class="casa-pill ${c.casa}">
          <span class="casa-mark ${c.casa}">${CASA_INITIAL[c.casa]}</span>${c.casa}${multBadge}
        </span>
      </td>
      <td>${c.miembros}</td>
      <td><span class="rank-pts">${c.puntos}</span></td>
      <td>${ppp}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── LOGOUT ────────────────────────────────────
function logout() {
  localStorage.removeItem('qp2026_user');
  currentUser = null; myPreds = {}; resultados = {}; allUsers = []; allPreds = [];

  // Reset form
  const btn = document.getElementById('btn-login');
  btn.innerHTML = 'Entrar al prode <i class="fa-solid fa-arrow-right"></i>';
  btn.disabled  = false;
  document.getElementById('login-name-search').value = '';
  document.getElementById('login-password').value    = '';
  const dd = document.getElementById('name-picker-dropdown');
  if (dd) { dd.innerHTML = ''; dd.hidden = true; }

  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.background = '';
}

// ── HELPERS ───────────────────────────────────
function showToast(msg, type) {
  const t = document.getElementById('toast');
  const icon = type === 'ok'    ? '<i class="fa-solid fa-check"></i> '
            : type === 'warn'  ? '<i class="fa-solid fa-triangle-exclamation"></i> '
            : type === 'error' ? '<i class="fa-solid fa-circle-xmark"></i> '
            : '';
  t.innerHTML = icon + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function formatFecha(iso) {
  if (!iso) return '';
  const [,m,d] = iso.split('-');
  const meses = ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m)]}`;
}

// ── EFECTOS VISUALES LOGIN ─────────────────────

// ── Papel picado (confetti) ──
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.style.display = 'block';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = [
    '#7c3aed','#f59e0b','#10b981','#ef4444','#3b82f6',
    '#ec4899','#f97316','#06b6d4','#84cc16','#a855f7',
    // colores de banderas
    '#003087','#ce1126','#009b3a','#ffd700','#ff6b35'
  ];
  const pieces = [];
  const COUNT  = 160;

  for (let i = 0; i < COUNT; i++) {
    pieces.push({
      x:     Math.random() * canvas.width,
      y:     -10 - Math.random() * 200,
      w:     6  + Math.random() * 10,
      h:     3  + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot:   Math.random() * Math.PI * 2,
      vx:    (Math.random() - .5) * 3,
      vy:    3  + Math.random() * 4,
      vr:    (Math.random() - .5) * .2,
      alpha: 1
    });
  }

  let start = null;
  const DURATION = 2200;

  function draw(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = false;
    pieces.forEach(p => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.vr;
      p.vy  += 0.08; // gravedad suave
      if (elapsed > DURATION * .6) p.alpha = Math.max(0, p.alpha - .018);

      if (p.y < canvas.height + 20) alive = true;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });

    if (alive && elapsed < DURATION + 800) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }
  requestAnimationFrame(draw);
}

// ── BANDERITAS VOLANDO AL HOVER DEL TROFEO ──────────────────
(function() {
  const CODES = [
    'ar','mx','za','kr','cz','ca','ba','us','py','qa','ch','br','ma','ht',
    'gb-sct','au','tr','de','cw','nl','jp','ci','ec','se','tn','es','cv',
    'be','eg','sa','uy','ir','nz','fr','sn','iq','no','dz','at','jo','pt',
    'cd','gb-eng','hr','gh','pa','uz','co'
  ];

  let cooldown = false;

  function shootFlags(originX, originY) {
    if (cooldown) return;
    cooldown = true;
    setTimeout(() => cooldown = false, 800);

    // Lanzar 14 banderitas aleatorias
    const picks = [...CODES].sort(() => Math.random() - .5).slice(0, 14);

    picks.forEach((code, i) => {
      const el = document.createElement('span');
      el.className = `flag-particle fi fi-${code}`;

      // Dirección aleatoria en 360°
      const angle  = (Math.PI * 2 / picks.length) * i + (Math.random() - .5) * .8;
      const dist   = 120 + Math.random() * 160;
      const tx     = Math.round(Math.cos(angle) * dist);
      const ty     = Math.round(Math.sin(angle) * dist);
      const dur    = (.55 + Math.random() * .35).toFixed(2) + 's';
      const rot0   = Math.round(Math.random() * 40 - 20) + 'deg';
      const rot1   = Math.round(Math.random() * 360 - 180) + 'deg';
      const w      = 28 + Math.floor(Math.random() * 14);
      const h      = Math.round(w * .67);

      el.style.cssText = `
        left: ${originX}px; top: ${originY}px;
        width: ${w}px; height: ${h}px;
        --tx: ${tx}px; --ty: ${ty}px;
        --dur: ${dur};
        --rot0: ${rot0}; --rot1: ${rot1};
        margin-left: ${-w/2}px; margin-top: ${-h/2}px;
        background-size: cover;
      `;

      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const img = document.querySelector('.login-hero-img');
    if (!img) return;

    img.addEventListener('mouseenter', e => {
      const r = img.getBoundingClientRect();
      shootFlags(r.left + r.width / 2, r.top + r.height * .35);
    });

    // Touch para mobile
    img.addEventListener('touchstart', e => {
      const r = img.getBoundingClientRect();
      shootFlags(r.left + r.width / 2, r.top + r.height * .35);
    }, { passive: true });
  });
})();
