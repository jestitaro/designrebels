/* Dino Cup — public landing.
   Read-only: podium, resultados parciales, campeones, reglas, próximamente.
   Standings are always *derived* from live dinocup_players + dinocup_movements
   (status APPLIED) — nothing here writes to Firestore. All mutating actions
   (cargar resultados, aplicar descuentos, anular) live in assets/admin.js
   behind an authenticated admin session. */

(function () {
const { fmt, fmtPoints, house, longDate, MONTHS_ES, ROSTER, findPlayerByNickname, norm } = window.DinoCupData;

/* ---------- helpers ---------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
function renderIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
}

/* ---------- live state (players + applied movements) ---------- */
let players = [];
let movements = [];
let matches = [];

function movementTime(movement) {
  return typeof movement.createdAt?.toMillis === 'function' ? movement.createdAt.toMillis() : Date.now();
}

/* "Meteorito" movements (ABSENCE_PENALTY and their PENALTY_REVERSAL) don't
   reflect how someone actually played, so they're excluded from
   gamePoints — used only to find who lost the most Kahoots, not who has
   the lowest overall balance. The real point totals/podium still include
   them, unchanged. */
const METEORITO_TYPES = new Set(['ABSENCE_PENALTY', 'PENALTY_REVERSAL']);

function computeStandings() {
  const totals = new Map(players.map(p => [p.id, { ...p, points: 0, gamePoints: 0, medals: { gold: 0, silver: 0, bronze: 0 } }]));
  const ledger = [];
  movements.forEach(movement => {
    const total = totals.get(movement.playerId);
    if (!total) return;
    total.points += movement.points || 0;
    if (!METEORITO_TYPES.has(movement.type)) total.gamePoints += movement.points || 0;
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
/* Who "lost the most" — lowest gamePoints, ignoring meteoritos. Not
   necessarily the last row of the main (total-points) ranking. Returns
   null until there's at least one real game result, so nobody gets
   badged off an all-zero tie before the season has actually started. */
function worstGamePlayerId() {
  if (!movements.some(movement => movement.type === 'REPORT_RESULT')) return null;
  const { totals } = computeStandings();
  const ranked = [...totals.values()]
    .sort((a, b) => (a.gamePoints - b.gamePoints) || a.name.localeCompare(b.name, 'es'));
  return ranked[0]?.id ?? null;
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

/* Whoever's currently last overall gets called out — same badge everywhere
   the ranking shows up (hero mini-lists, full ranking modal). */
function lastPlaceBadgeHtml() {
  return ' <span class="last-place-badge">Perdió más</span>';
}

function competitorLiHtml(item, position, prefix, isWorstGamePlayer) {
  const h = house(item.house);
  const negative = item.points < 0 ? ` ${prefix}__points--negative` : '';
  return `<li>
    <span class="${prefix}__position">${String(position).padStart(2, '0')}</span>
    <span class="${prefix}__avatar ${prefix}__avatar--${h.avatarClass}">${item.name.charAt(0).toUpperCase()}</span>
    <span class="${prefix}__info"><strong>${item.name}</strong><small>${h.name}${isWorstGamePlayer ? lastPlaceBadgeHtml() : ''}</small></span>
    <span class="${prefix}__points${negative}">${fmtPoints(item.points)}</span>
  </li>`;
}
function renderCompetitorLists(rows) {
  const rest = rows.slice(3);
  const visible = rest.slice(0, 3);
  const extra = rest.slice(3);
  const worstId = worstGamePlayerId();

  const mobileVisible = $('.mobile-competitors__list--visible');
  if (mobileVisible) mobileVisible.innerHTML = visible.map((item, i) => competitorLiHtml(item, i + 4, 'mobile-competitor', item.id === worstId)).join('');

  const mobileExtraList = $('#allCompetitors .mobile-competitors__list');
  if (mobileExtraList) {
    mobileExtraList.setAttribute('start', '7');
    mobileExtraList.innerHTML = extra.map((item, i) => competitorLiHtml(item, i + 7, 'mobile-competitor', item.id === worstId)).join('');
  }

  const desktopList = $('.desktop-competitors__list');
  if (desktopList) desktopList.innerHTML = visible.map((item, i) => competitorLiHtml(item, i + 4, 'desktop-competitor', item.id === worstId)).join('');
}

function renderResultsModal(rows) {
  const list = $('.partial-ranking-list');
  if (list) {
    const worstId = worstGamePlayerId();
    list.innerHTML = rows.map((item, index) => {
      const h = house(item.house);
      const negative = item.points < 0 ? ' partial-score--negative' : '';
      const subtitle = `${h.name}${item.role ? ' · ' + item.role : ''}`;
      return `<li>
        <span class="partial-position">${String(index + 1).padStart(2, '0')}</span>
        <span class="partial-avatar partial-avatar--${h.avatarClass}">${item.name.charAt(0).toUpperCase()}</span>
        <span class="partial-player"><strong>${item.name}</strong><small>${subtitle}${item.id === worstId ? lastPlaceBadgeHtml() : ''}</small></span>
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

/* REPORT_RESULT movements created before sessionDate was stored on the
   movement itself don't have that field — fall back to parsing it out of
   their reason text ("23 de julio 2026 · +3 puntos"), which every
   REPORT_RESULT has always included. */
function movementSessionDate(movement) {
  if (movement.sessionDate) return movement.sessionDate;
  const match = (movement.reason || '').match(/^(\d{1,2}) de (\p{L}+) (\d{4})/u);
  if (!match) return null;
  const monthIndex = MONTHS_ES.findIndex(month => month.toLowerCase() === match[2].toLowerCase());
  if (monthIndex < 0) return null;
  return `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
}

function renderSeasonChip() {
  const chip = $('#lastFechaChip');
  if (!chip) return;
  const dated = movements
    .filter(movement => movement.type === 'REPORT_RESULT')
    .map(movement => ({ movement, date: movementSessionDate(movement) }))
    .filter(entry => entry.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  chip.textContent = dated ? dated.date.split('-').reverse().join('/') : '—';
}

/* Next moderator/suplente comes from the most recent applied match's
   detected results: last place moderates the next session, second-to-last
   is the backup — same as the "el que sale último modera" house rule,
   with the moderator of that session excluded from the running. */
function computeNextModerator() {
  const lastMatch = matches
    .filter(match => match.status === 'APPLIED' && match.sessionDate)
    .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))[0];
  const rows = (lastMatch?.detectedResults || [])
    .filter(row => row.playerId && row.playerId !== lastMatch.moderatorId)
    .sort((a, b) => a.rank - b.rank);
  return {
    sessionDate: lastMatch?.sessionDate || null,
    moderator: rows[rows.length - 1]?.playerName || null,
    backup: rows[rows.length - 2]?.playerName || null
  };
}
function renderNextModerator() {
  const modEl = $('#nextModerator');
  const backupEl = $('#nextModeratorBackup');
  if (!modEl || !backupEl) return;
  const next = computeNextModerator();
  modEl.textContent = next.moderator || '—';
  backupEl.textContent = next.backup || '—';
}

/* ============================================================
   REX — el oráculo jurásico. Un chat con onda "personaje que
   explica cosas", pero sin IA real detrás: esto es un sitio 100%
   estático sin backend, así que no hay dónde guardar una API key
   sin exponerla en el navegador de cualquiera. En cambio, REX
   interpreta preguntas por patrones (español, con o sin tildes) y
   contesta con los datos reales del ranking — fechas que ganó
   alguien, cuántas veces ganó/perdió, puntos, posición, etc. —
   con variedad de frases para que no suene siempre igual.
   ============================================================ */
function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }

/* Última fecha de la que se habló, para que un "¿y quién perdió?" sin
   fecha propia siga hablando de la misma sesión que la pregunta anterior. */
let rexLastDateMention = null;

function rexKnownDatesList() {
  const dates = [...new Set(matches.filter(m => m.status === 'APPLIED' && m.sessionDate).map(m => m.sessionDate))].sort();
  if (!dates.length) return '';
  return ` Las fechas que tengo cargadas son: ${dates.map(d => longDate(d)).join(', ')}.`;
}

/* Reconstruye, por jugador, en qué fechas quedó en el podio (ganó)
   y en cuáles participó sin llegar a medalla (perdió) — usando el
   detectedResults de cada match aplicado, excluyendo al moderador
   de esa fecha, igual que "Próximo moderador" y que el wizard. */
function computeMatchHistory() {
  const history = new Map();
  matches
    .filter(match => match.status === 'APPLIED' && match.sessionDate && Array.isArray(match.detectedResults))
    .forEach(match => {
      const effective = match.detectedResults
        .filter(row => row.playerId && row.playerId !== match.moderatorId)
        .sort((a, b) => a.rank - b.rank)
        .map((row, index) => ({ ...row, effectiveRank: index + 1 }));
      effective.forEach(row => {
        if (!history.has(row.playerId)) history.set(row.playerId, { wins: [], losses: [] });
        const bucket = row.effectiveRank <= 3 ? 'wins' : 'losses';
        history.get(row.playerId)[bucket].push({ sessionDate: match.sessionDate, effectiveRank: row.effectiveRank });
      });
    });
  return history;
}

/* Busca qué jugador del roster se menciona en el mensaje, probando
   todos sus alias (incluye nombre completo) — se queda con el alias
   más largo que matchee para evitar falsos positivos cortos. */
function findMentionedPlayer(text) {
  const normText = ` ${norm(text).replace(/[¿?¡!.,;:()"']/g, ' ')} `;
  let best = null;
  ROSTER.forEach(p => {
    [p.id, p.name, p.fullName, ...p.aliases].forEach(alias => {
      const a = norm(alias);
      if (a.length < 2 || !normText.includes(` ${a} `)) return;
      if (!best || a.length > best.aliasLen) best = { player: p, aliasLen: a.length };
    });
  });
  return best?.player || null;
}

/* ---------- trivia del equipo (window.DinoCupTrivia, ver assets/trivia.js) ----------
   Roster propio, separado del de Dino Cup: incluye gente que no compite
   en la copa. Mismo criterio de matcheo por alias que findMentionedPlayer. */
const TRIVIA_PEOPLE = window.DinoCupTrivia?.PEOPLE || [];
function findTriviaPerson(text) {
  const normText = ` ${norm(text).replace(/[¿?¡!.,;:()"']/g, ' ')} `;
  let best = null;
  TRIVIA_PEOPLE.forEach(p => {
    [p.id, p.name, ...p.aliases].forEach(alias => {
      const a = norm(alias);
      if (a.length < 2 || !normText.includes(` ${a} `)) return;
      if (!best || a.length > best.aliasLen) best = { person: p, aliasLen: a.length };
    });
  });
  return best?.person || null;
}

/* Cola barajada de todos los datos, sin repetir hasta agotarla — así
   "otro" y "otro" y "otro" no repiten antes de recorrer todo el pool. */
let rexTriviaQueue = [];
let rexLastFactPersonId = null;
function nextTriviaFact() {
  if (!rexTriviaQueue.length) {
    const pool = [];
    TRIVIA_PEOPLE.forEach(p => p.facts.forEach(fact => pool.push({ id: p.id, name: p.name, fact })));
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    rexTriviaQueue = pool;
  }
  let entry = rexTriviaQueue.pop() || null;
  // Dos datos seguidos de la misma persona se sienten repetitivo — si toca,
  // buscamos el próximo de otra persona más adelante en la cola y lo
  // adelantamos, devolviendo el descartado al fondo para más tarde.
  if (entry && entry.id === rexLastFactPersonId && rexTriviaQueue.length) {
    const swapIndex = rexTriviaQueue.findIndex(candidate => candidate.id !== entry.id);
    if (swapIndex !== -1) {
      const alt = rexTriviaQueue.splice(swapIndex, 1)[0];
      rexTriviaQueue.unshift(entry);
      entry = alt;
    }
  }
  if (entry) rexLastFactPersonId = entry.id;
  return entry;
}

/* Último dato de trivia contado, para que "¿quién?" pueda revelar a
   quién pertenecía si se contó como misterio. */
let rexLastTriviaFact = null;

const REX_CARNOTAURIO = 'Uno confirmado: el Carnota-urio. Y evolucionó hasta VP of Engineering.';

/* Cuando el dato se cuenta como misterio (sin nombre), igual necesita un
   sujeto — si no, la frase queda flotando sin contexto. Estas aperturas le
   dan marco de "excavación/hallazgo" sin revelar a quién pertenece. */
const REX_MYSTERY_INTROS = [
  'Hay alguien acá de quien se dice esto:',
  'Encontramos esto sin etiqueta en la excavación de hoy:',
  'Registro recuperado, todavía sin identificar:',
  'Un hallazgo fresco, sin nombre por ahora:',
  'Esto salió de un fósil sin catalogar:'
];

/* Saca una fecha del mensaje (ISO, DD/MM/YYYY, o "13 de agosto [2026]"
   con nombre de mes — el año es opcional, se asume el actual). Palabras
   sueltas como "el jueves" no rompen el match, el regex las ignora. */
function parseDateMention(text) {
  const normText = norm(text);
  const iso = normText.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, '0')}-${String(iso[3]).padStart(2, '0')}`;
  const dmy = normText.match(/(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
  const monthPattern = new RegExp(`(\\d{1,2})\\s*(?:de\\s+)?(${MONTHS_ES.join('|')})(?:\\s*(?:de\\s+)?(20\\d{2}))?`);
  const named = normText.match(monthPattern);
  if (named) {
    const monthIndex = MONTHS_ES.findIndex(month => month === named[2]);
    const year = named[3] || String(new Date().getFullYear());
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(named[1]).padStart(2, '0')}`;
  }
  return null;
}

/* Fecha del informe aplicado más reciente — lo que "la última vez" quiere decir. */
function resolveLastMatchDate() {
  const applied = matches.filter(m => m.status === 'APPLIED' && m.sessionDate);
  if (!applied.length) return null;
  return applied.reduce((max, m) => (!max || m.sessionDate > max) ? m.sessionDate : max, null);
}

const REX_GREETINGS = [
  '🦖 ¡RRRAWR! Digo, hola. Soy Mr. DNA, el oráculo jurásico del ranking. Preguntame lo que quieras saber.',
  'Ahora que el Sr. Hammond está tomando el té, tengo unos minutos libres. ¿En qué te ayudo?',
  'Ejem, perdón, me estaba haciendo un estudio de sangre. ¿En qué te ayudo con el ranking?',
  '65 millones de años esperando esta conversación. Dale, preguntame.',
  'Salí de un mosquito atrapado en ámbar solo para esto. Preguntame lo que quieras.',
  '"La vida se abre camino"... y las preguntas también. Dale, largá.'
];
const REX_HELP = 'Puedo contarte, por ejemplo: "¿cuántas veces ganó Javi?", "¿qué fechas ganó May?", "¿cuántas veces perdió Nico?", "¿cuántos DinoCoins tiene Agustin?", "¿en qué puesto está Pablo?", "¿quién ganó más?", "¿quién perdió más?", "¿quién ganó la última vez?" o "¿quién modera la próxima vez?". También tengo datos curiosos del equipo — pedime "un dato random" o "otro", o preguntame por alguien en particular. Decime un nombre o una fecha y te tiro toda la data.';
const REX_FALLBACKS = [
  'Eso no está en mi ADN. Probá con otra pregunta, o quejate con la diseñadora de eSaurio.',
  'Ni idea, no está en mi ADN. Escribí "ayuda" si querés ver qué sí sé responder.',
  'Esa secuencia no me la cargaron en el ADN. Probá con otra, o reclamale a la diseñadora de eSaurio.'
];

function playerLabel(entry) { return entry.effectiveRank === 1 ? '🥇' : entry.effectiveRank === 2 ? '🥈' : '🥉'; }
function fechaList(entries) {
  return entries.map(e => longDate(e.sessionDate)).join(', ');
}
function vezVeces(n) { return n === 1 ? 'vez' : 'veces'; }

function rexAnswer(rawText) {
  const text = (rawText || '').trim();
  if (!text) return pickRandom(REX_FALLBACKS);
  const normText = norm(text);
  const mentioned = findMentionedPlayer(text);

  if (!mentioned && /^(hola|holis|buenas|hey|ey+|que tal|buen dia|buenas tardes|buenas noches)\b/.test(normText)) {
    return pickRandom(REX_GREETINGS);
  }
  if (/ayuda|que sabes hacer|que pod[ei]s hacer|que me pod[ei]s preguntar|que onda|quien sos/.test(normText)) {
    return REX_HELP;
  }

  // ---------- trivia del equipo (dato curioso, easter eggs) ----------
  if (/dinosaurio|carnotauro/.test(normText)) {
    return REX_CARNOTAURIO;
  }
  const bareWhoQuestion = normText.replace(/[¿?¡!.,;:]/g, '').trim();
  if (['quien', 'quien es', 'de quien', 'y quien'].includes(bareWhoQuestion) && rexLastTriviaFact) {
    if (!rexLastTriviaFact.revealed) {
      rexLastTriviaFact.revealed = true;
      return `${rexLastTriviaFact.name}. ${rexLastTriviaFact.fact}`;
    }
    return `Ya te lo dije: es ${rexLastTriviaFact.name}. Pedime "otro dato" si querés más.`;
  }
  const triviaPerson = findTriviaPerson(text);
  const wantsTrivia = /\bdato\b|curiosidad|curioso|trivia|cont[aá]me|sab[eé]s de|conoc[eé]s de|conoc[eé]s algo/.test(normText);
  const wantsAnother = /^otro\b/.test(normText) || bareWhoQuestion === 'otro';
  if (triviaPerson && (wantsTrivia || wantsAnother || !mentioned)) {
    const fact = pickRandom(triviaPerson.facts);
    rexLastTriviaFact = { name: triviaPerson.name, fact, revealed: true };
    return `${triviaPerson.name}: ${fact}`;
  }
  if (!triviaPerson && (wantsTrivia || wantsAnother)) {
    const entry = nextTriviaFact();
    if (!entry) return pickRandom(REX_FALLBACKS);
    // A veces se cuenta como misterio y solo se revela el nombre si preguntan "¿quién?".
    const reveal = Math.random() < 0.45;
    rexLastTriviaFact = { name: entry.name, fact: entry.fact, revealed: reveal };
    return reveal ? `${entry.name}: ${entry.fact}` : `${pickRandom(REX_MYSTERY_INTROS)} ${entry.fact}`;
  }

  const history = computeMatchHistory();
  const { totals } = computeStandings();

  if (/quien\s+(gan|es el que mas gan)/.test(normText) && /mas/.test(normText)) {
    const ranked = [...history.entries()].map(([id, h]) => ({ player: totals.get(id), wins: h.wins.length })).filter(r => r.player);
    ranked.sort((a, b) => b.wins - a.wins);
    const top = ranked[0];
    if (!top || top.wins === 0) return 'Todavía nadie se subió al podio en esta temporada. La era de los campeones no empezó.';
    return `🏆 ${top.player.name} es quien más ganó: ${top.wins} ${vezVeces(top.wins)} en el podio. El resto, a extinguirse de la envidia.`;
  }
  if (/quien\s+perdi/.test(normText) && /mas/.test(normText)) {
    const ranked = [...history.entries()].map(([id, h]) => ({ player: totals.get(id), losses: h.losses.length })).filter(r => r.player);
    ranked.sort((a, b) => b.losses - a.losses);
    const top = ranked[0];
    if (!top || top.losses === 0) return 'Todavía nadie se quedó afuera del podio esta temporada. O ganaron todos, o nadie jugó — la extinción sigue esperando.';
    return `💀 ${top.player.name} es quien más veces se quedó sin podio: ${top.losses} ${vezVeces(top.losses)}. Ojo que esto no cuenta meteoritos, solo Kahoots reales.`;
  }

  if (/quien\s+modera|proximo\s+moderador|moderador(a)?\s+de\s+la\s+proxima|quien\s+es\s+el\s+moderador/.test(normText)) {
    const next = computeNextModerator();
    if (!next.moderator) return 'Todavía no tengo suficientes informes cargados como para saber quién modera la próxima. Volvé a preguntar cuando haya más data.';
    return `🎙️ ${next.moderator} modera la próxima, con ${next.backup || 'alguien a confirmar'} como suplente. Consecuencia directa de haber salido último en el ${longDate(next.sessionDate)}.`;
  }

  const asksAboutWin = /gan/.test(normText);
  const asksAboutLoss = /perdi/.test(normText);
  if (!mentioned && (asksAboutWin || asksAboutLoss)) {
    const wantsLastTime = /ultima\s+vez|ultimo\s+encuentro|ultima\s+fecha|ultimo\s+kahoot|ultima\s+jugada/.test(normText);
    // Sin fecha propia en el mensaje, un "¿y quién perdió?" sigue hablando
    // de la última fecha que se mencionó en la conversación; "la última
    // vez" apunta directo al informe más reciente cargado.
    const dateMention = parseDateMention(text) || (wantsLastTime ? resolveLastMatchDate() : null) || rexLastDateMention;
    if (dateMention) {
      const match = matches.find(m => m.status === 'APPLIED' && m.sessionDate === dateMention);
      if (!match) return `No tengo ningún informe cargado para el ${longDate(dateMention)}.${rexKnownDatesList()}`;
      rexLastDateMention = dateMention;
      const effective = (match.detectedResults || [])
        .filter(row => row.playerId && row.playerId !== match.moderatorId)
        .sort((a, b) => a.rank - b.rank)
        .map((row, index) => ({ ...row, effectiveRank: index + 1 }));
      if (!effective.length) return `Tengo el informe del ${longDate(match.sessionDate)} pero sin datos legibles. Rarísimo, como un fósil sin huesos.`;

      if (asksAboutLoss && !asksAboutWin) {
        const losers = effective.filter(row => row.effectiveRank > 3);
        if (!losers.length) return `El ${longDate(match.sessionDate)} entraron todos al podio — día sin perdedores, cosa rara en esta era.`;
        let response = `El ${longDate(match.sessionDate)} se quedaron sin podio: ${losers.map(row => row.playerName).join(', ')}. Moderó ${match.moderatorName || '—'}.`;
        // Solo si esta fue la fecha más reciente tiene sentido hablar de
        // "próximo moderador" — para una fecha vieja ya se sabe cómo siguió.
        if (match.sessionDate === resolveLastMatchDate()) {
          const next = computeNextModerator();
          if (next.moderator) response += ` Aunque no llegó a la extinción, ${next.moderator} es el próximo moderador${next.backup ? ` y ${next.backup} su suplente` : ''}.`;
        }
        return response;
      }
      const podium = effective.slice(0, 3);
      const medals = ['🥇', '🥈', '🥉'];
      const podiumText = podium.map((row, i) => `${medals[i]} ${row.playerName}`).join(', ');
      return `El ${longDate(match.sessionDate)} el podio fue: ${podiumText}. Moderó ${match.moderatorName || '—'}.`;
    }
  }

  if (mentioned) {
    const entry = history.get(mentioned.id) || { wins: [], losses: [] };
    const total = totals.get(mentioned.id);
    const name = total?.name || mentioned.name;

    if (/fecha/.test(normText) && /gan/.test(normText)) {
      if (!entry.wins.length) return `${name} todavía no ganó ninguna fecha. Su cadena evolutiva de victorias sigue en cero.`;
      return `🗓️ ${name} ganó el ${fechaList(entry.wins)}${entry.wins.length > 1 ? ' (en ese orden)' : ''}. ${entry.wins.length > 1 ? 'Un depredador constante.' : 'Un solo zarpazo, pero bien dado.'}`;
    }
    if (/fecha/.test(normText) && /perdi/.test(normText)) {
      if (!entry.losses.length) return `${name} no tiene fechas sin podio registradas — o ganó siempre, o todavía no jugó.`;
      return `${name} se quedó afuera del podio el ${fechaList(entry.losses)}. Nadie es perfecto, ni los dinosaurios.`;
    }
    if (/cuant[oa]s?\b.*\bgan/.test(normText) || /\bgan[oó]\b.*cuant[oa]s?/.test(normText)) {
      const n = entry.wins.length;
      if (n === 0) return `${name} ganó 0 veces. Todavía no probó las mieles de la victoria, pero la extinción de los dinosaurios tampoco pasó de la noche a la mañana.`;
      return `${name} ganó ${n} ${vezVeces(n)}. ${n >= 3 ? '¡Un T-Rex del ranking!' : 'Nada mal para empezar.'}`;
    }
    if (/cuant[oa]s?\b.*perdi/.test(normText) || /perdi[oó]\b.*cuant[oa]s?/.test(normText)) {
      const n = entry.losses.length;
      if (n === 0) return `${name} nunca se quedó sin podio (o directamente no jugó todavía). Prontuario limpio.`;
      return `${name} se quedó sin medalla ${n} ${vezVeces(n)}. Le pasa a los mejores, incluso a los que tienen 65 millones de años de experiencia como yo.`;
    }
    if (/puntos|dinocoins/.test(normText)) {
      return `${name} tiene ${fmtPoints(total?.points ?? 0)} en el ranking. ${(total?.points ?? 0) < 0 ? 'Números rojos, hay que remontar.' : 'Sumando fósiles de gloria.'}`;
    }
    if (/puesto|posicion|lugar/.test(normText)) {
      const ranked = standingsPlayers();
      const position = ranked.findIndex(p => p.id === mentioned.id) + 1;
      return `${name} está en el puesto ${position} de ${ranked.length}. ${position === 1 ? '¡La cima del Cretácico!' : position === ranked.length ? 'Bueno, alguien tiene que estar último.' : 'En plena carrera.'}`;
    }

    const winCount = entry.wins.length;
    const lossCount = entry.losses.length;
    return `${name} tiene ${fmtPoints(total?.points ?? 0)}, ganó ${winCount} ${vezVeces(winCount)} y se quedó sin podio ${lossCount} ${vezVeces(lossCount)}. Preguntame algo más específico si querés fechas exactas.`;
  }

  return pickRandom(REX_FALLBACKS);
}

function rexBubbleHtml(text, who) {
  return `<div class="dna-chat-bubble dna-chat-bubble--${who}">${text}</div>`;
}
function rexAddMessage(text, who) {
  const body = $('#dnaChatBody');
  if (!body) return;
  body.insertAdjacentHTML('beforeend', rexBubbleHtml(text, who));
  body.scrollTop = body.scrollHeight;
}
function rexAsk(question) {
  const trimmed = (question || '').trim();
  if (!trimmed) return;
  rexAddMessage(esc(trimmed), 'user');
  const body = $('#dnaChatBody');
  const typingEl = document.createElement('div');
  typingEl.className = 'dna-chat-bubble dna-chat-bubble--rex dna-chat-bubble--typing';
  typingEl.textContent = '···';
  body?.appendChild(typingEl);
  if (body) body.scrollTop = body.scrollHeight;
  window.setTimeout(() => {
    typingEl.remove();
    rexAddMessage(esc(rexAnswer(trimmed)), 'rex');
  }, 450 + Math.random() * 400);
}
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

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
  fb.matches.subscribe(data => { matches = data; renderNextModerator(); });
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

const dnaChatModal = $('#dnaChatModal');
const openDnaChatButtons = $$('[data-open-dna-chat]');
const closeDnaChatButtons = $$('[data-close-dna-chat]');

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

let dnaChatGreeted = false;
function openDnaChatModal() {
  toggleModal(dnaChatModal, true);
  if (!dnaChatGreeted) {
    dnaChatGreeted = true;
    rexAddMessage(pickRandom(REX_GREETINGS), 'rex');
  }
}
function closeDnaChatModal() { toggleModal(dnaChatModal, false, $('[data-open-dna-chat]')); }

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
  openDnaChatButtons.forEach(button => button.addEventListener('click', openDnaChatModal));

  closeLegendsButtons.forEach(button => button.addEventListener('click', closeLegendsModal));
  closeRulesButtons.forEach(button => button.addEventListener('click', closeRulesModal));
  closeResultsButtons.forEach(button => button.addEventListener('click', closeResultsModal));
  closeDnaChatButtons.forEach(button => button.addEventListener('click', closeDnaChatModal));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (legendsModal.classList.contains('is-open')) closeLegendsModal();
    if (rulesModal.classList.contains('is-open')) closeRulesModal();
    if (resultsModal.classList.contains('is-open')) closeResultsModal();
    if (dnaChatModal.classList.contains('is-open')) closeDnaChatModal();
  });

  const dnaChatForm = $('#dnaChatForm');
  const dnaChatInput = $('#dnaChatInput');
  dnaChatForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!dnaChatInput.value.trim()) return;
    rexAsk(dnaChatInput.value);
    dnaChatInput.value = '';
  });
  $$('[data-dna-suggestion]').forEach(chip => chip.addEventListener('click', () => rexAsk(chip.textContent)));

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
