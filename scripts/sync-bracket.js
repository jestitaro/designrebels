/**
 * sync-bracket.js — QuartzProde 2026
 * Al terminar la Fase de Grupos, lee las posiciones finales de cada grupo desde
 * ESPN y resuelve los placeholders del bracket (1A, 2B, 3A/B/C/D/F, ...) a los
 * equipos reales que clasificaron. Escribe la colección Firestore `bracket`.
 *
 * Cada documento: { slot:"1A", equipo:"Argentina", grupo:"A", posicion:1, timestamp }
 * (el doc id es el slot saneado — Firestore no admite "/" en los ids).
 *
 * Los cruces que dependen de partidos eliminatorios (G73, P101, ...) NO se
 * resuelven acá: los resuelve sync-results.js a medida que se juegan, leyendo
 * este `bracket` + la colección `resultados`.
 *
 * Requiere variable de entorno: FIREBASE_SERVICE_ACCOUNT (JSON del service account)
 * Opcional: STANDINGS_URL (override del endpoint de standings de ESPN)
 *           NOTIFY_URL (webhook para notificaciones, ej. Slack/Discord)
 */

const admin = require('firebase-admin');
const https = require('https');

// ─── Firebase init ────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── Slots de tercer puesto del fixture (dieciseisavos) ────────────────────
// Cada slot de "mejor tercero" admite el tercero de un subconjunto de grupos.
// Tomado tal cual de data.js (equipoB de los partidos 74,78,79,80,81,82,85,87).
const THIRD_PLACE_SLOTS = [
  { slot: "3A/B/C/D/F", grupos: ["A","B","C","D","F"] }, // partido 74
  { slot: "3C/D/F/G/H", grupos: ["C","D","F","G","H"] }, // partido 78
  { slot: "3C/E/F/H/I", grupos: ["C","E","F","H","I"] }, // partido 79
  { slot: "3E/H/I/J/K", grupos: ["E","H","I","J","K"] }, // partido 80
  { slot: "3B/E/F/I/J", grupos: ["B","E","F","I","J"] }, // partido 81
  { slot: "3A/E/H/I/J", grupos: ["A","E","H","I","J"] }, // partido 82
  { slot: "3E/F/G/I/J", grupos: ["E","F","G","I","J"] }, // partido 85
  { slot: "3D/E/I/J/L", grupos: ["D","E","I","J","L"] }, // partido 87
];

// ─── Asignación FINAL de mejores terceros (manual y definitiva) ────────────
// IMPORTANTE: la tabla oficial de FIFA que asigna los 8 mejores terceros a cada
// cruce NO se puede deducir solo con las restricciones de grupo (hay varias
// combinaciones válidas). Por eso NO la calculamos por algoritmo: se fija a mano
// acá. Cada slot listado se ESCRIBE SIEMPRE con este valor (idempotente, se
// autocorrige en cada corrida). Los slots que NO estén acá no se tocan: se dejan
// tal cual estén en Firestore.
const THIRD_PLACE_FINAL = {
  "3A/B/C/D/F": { equipo: "Paraguay", grupo: "D" }, // partido 74 — 3º Grupo D
  "3C/D/F/G/H": { equipo: "Sweden",   grupo: "F" }, // partido 78 — 3º Grupo F
  "3B/E/F/I/J": { equipo: "Bosnia",   grupo: "B" }, // partido 81 — 3º Grupo B
  // Los otros 5 slots (3C/E/F/H/I, 3E/H/I/J/K, 3A/E/H/I/J, 3E/F/G/I/J,
  // 3D/E/I/J/L) ya están correctos en Firestore y no se sobrescriben.
  // Si querés fijarlos también acá, agregá: "slot": { equipo, grupo }.
};

const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// ─── Normalización de nombres de equipos (ESPN → data.js) ─────────────────
// (mismo mapa que sync-results.js para mantener consistencia)
const ESPN_NAME_MAP = {
  'United States':               'USA',
  'Turkey':                      'Türkiye',
  'Czech Republic':              'Czechia',
  'Curacao':                     'Curaçao',
  "Cote d'Ivoire":               'Ivory Coast',
  "Côte d'Ivoire":               'Ivory Coast',
  'Côte D\'Ivoire':              'Ivory Coast',
  'DR Congo':                    'DR Congo',
  'Democratic Republic of Congo':'DR Congo',
  'Congo DR':                    'DR Congo',
  'Bosnia & Herzegovina':        'Bosnia',
  'Bosnia and Herzegovina':      'Bosnia',
  'Korea Republic':              'South Korea',
  'Republic of Korea':           'South Korea',
  'Cape Verde Islands':          'Cape Verde',
  'Cabo Verde':                  'Cape Verde',
};

function norm(name = '') {
  return ESPN_NAME_MAP[name] || name;
}

// El doc id no puede contener "/" — lo saneamos para los slots de tercero.
function slotDocId(slot) {
  return slot.replace(/\//g, '_');
}

// ─── Fetch ESPN standings ───────────────────────────────────────────────────
function fetchStandings() {
  const url = process.env.STANDINGS_URL
    || 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch(e) { reject(new Error(`JSON parse error standings: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

// ─── Parseo de standings ────────────────────────────────────────────────────
// Devuelve { A: [{equipo,pts,gd,gf,rank}, ...ordenado 1°..4°], B: [...], ... }
function statVal(entry, names) {
  const stats = entry.stats || [];
  for (const n of names) {
    const s = stats.find(x => x.name === n || x.type === n || x.abbreviation === n);
    if (s && s.value !== undefined && s.value !== null) return Number(s.value);
  }
  return 0;
}

function parseGroups(data) {
  // ESPN suele anidar los grupos en children[].standings.entries
  const children = data.children || (data.standings ? [data] : []);
  const grupos = {};

  for (const child of children) {
    const rawName = child.name || child.displayName || child.abbreviation || '';
    const m = String(rawName).match(/Group\s+([A-L])/i) || String(rawName).match(/Grupo\s+([A-L])/i);
    if (!m) continue;
    const letter = m[1].toUpperCase();

    const entries = (child.standings && child.standings.entries) || child.entries || [];
    const tabla = entries.map(e => {
      const team = e.team || {};
      return {
        equipo: norm(team.displayName || team.shortDisplayName || team.name || ''),
        rank:   statVal(e, ['rank']),
        pts:    statVal(e, ['points', 'pts']),
        gd:     statVal(e, ['pointDifferential', 'goalDifferential', 'goalDiff']),
        gf:     statVal(e, ['pointsFor', 'goalsFor']),
      };
    }).filter(t => t.equipo);

    // Orden final del grupo: rank si viene, si no por pts → gd → gf
    tabla.sort((a, b) => {
      if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd  !== a.gd)  return b.gd  - a.gd;
      return b.gf - a.gf;
    });

    grupos[letter] = tabla;
  }
  return grupos;
}

// (La asignación automática de mejores terceros por backtracking se eliminó:
//  no reproducía la tabla oficial de FIFA y pisaba las correcciones manuales.
//  Ahora los terceros se fijan a mano en THIRD_PLACE_FINAL.)

// ─── Notificación opcional (webhook Slack/Discord) ────────────────────────
async function notify(message) {
  const url = process.env.NOTIFY_URL;
  if (!url) return;

  const body = JSON.stringify({ text: message });
  const parsed = new URL(url);
  return new Promise(resolve => {
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { res.resume(); resolve(); });
    req.on('error', e => { console.warn('Notify error:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== QuartzProde Bracket Sync ===', new Date().toISOString());

  let data;
  try {
    data = await fetchStandings();
  } catch(e) {
    console.error('Error fetching standings:', e.message);
    process.exit(1);
  }

  const grupos = parseGroups(data);
  const letrasOk = GROUP_LETTERS.filter(g => (grupos[g] || []).length >= 3);
  console.log(`Grupos leídos de ESPN: ${letrasOk.length}/12 [${letrasOk.join(', ')}]`);

  if (letrasOk.length < 12) {
    console.warn('⚠ Aún no hay 12 grupos completos en ESPN — puede que la Fase de Grupos no haya terminado.');
  }

  // Slots a escribir: { slot, equipo, grupo, posicion }
  const docs = [];

  // 1) Primeros y segundos de cada grupo (1A,2A,1B,2B,...)
  for (const g of GROUP_LETTERS) {
    const tabla = grupos[g] || [];
    for (const pos of [1, 2]) {
      const t = tabla[pos - 1];
      if (!t || !t.equipo) {
        console.log(`  → Sin dato para ${pos}${g} (grupo incompleto)`);
        continue;
      }
      docs.push({ slot: `${pos}${g}`, equipo: t.equipo, grupo: g, posicion: pos });
    }
  }

  // 2) Mejores terceros → asignación manual definitiva (THIRD_PLACE_FINAL).
  // No se recalcula por algoritmo: se escriben SIEMPRE los slots fijados a mano.
  // Los slots no listados se dejan como estén (no se sobrescriben).
  for (const [slot, info] of Object.entries(THIRD_PLACE_FINAL)) {
    docs.push({ slot, equipo: info.equipo, grupo: info.grupo, posicion: 3 });
  }

  // Escritura en Firestore (batch)
  const batch = db.batch();
  for (const d of docs) {
    const ref = db.collection('bracket').doc(slotDocId(d.slot));
    batch.set(ref, { ...d, timestamp: Date.now() }, { merge: true });
  }
  await batch.commit();

  // Resumen
  console.log(`\n=== Resumen ===`);
  console.log(`Slots escritos en 'bracket': ${docs.length}`);
  docs.forEach(d => console.log(`  ✓ ${d.slot} → ${d.equipo} (grupo ${d.grupo}, ${d.posicion}°)`));

  if (docs.length > 0) {
    await notify(
      `🗺️ QuartzProde — bracket resuelto (${docs.length} slots):\n` +
      docs.map(d => `${d.slot} → ${d.equipo}`).join('\n')
    );
  }

  process.exit(0);
}

main().catch(e => {
  console.error('Error fatal:', e);
  process.exit(1);
});
