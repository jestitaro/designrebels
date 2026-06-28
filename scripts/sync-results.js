/**
 * sync-results.js — QuartzProde 2026
 * Lee resultados finalizados de ESPN y los escribe en Firestore.
 * 
 * Requiere variable de entorno: FIREBASE_SERVICE_ACCOUNT (JSON del service account)
 * Opcional: NOTIFY_URL (webhook para notificaciones, ej. Slack/Discord)
 */

const admin  = require('firebase-admin');
const https  = require('https');

// ─── Firebase init ────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── Datos del prode (Fase de Grupos — equipos reales) ─────────────────────
// Los partidos de fase eliminatoria se resuelven por fecha (equipoA/B son TBD en data.js)
const PARTIDOS_GRUPOS = [
  { id:1,  fecha:"2026-06-11", equipoA:"Mexico",       equipoB:"South Africa"  },
  { id:2,  fecha:"2026-06-11", equipoA:"South Korea",  equipoB:"Czechia"       },
  { id:3,  fecha:"2026-06-12", equipoA:"Canada",       equipoB:"Bosnia"        },
  { id:4,  fecha:"2026-06-12", equipoA:"USA",          equipoB:"Paraguay"      },
  { id:5,  fecha:"2026-06-13", equipoA:"Qatar",        equipoB:"Switzerland"   },
  { id:6,  fecha:"2026-06-13", equipoA:"Brazil",       equipoB:"Morocco"       },
  { id:7,  fecha:"2026-06-13", equipoA:"Haiti",        equipoB:"Scotland"      },
  { id:8,  fecha:"2026-06-13", equipoA:"Australia",    equipoB:"Türkiye"       },
  { id:9,  fecha:"2026-06-14", equipoA:"Germany",      equipoB:"Curaçao"       },
  { id:10, fecha:"2026-06-14", equipoA:"Netherlands",  equipoB:"Japan"         },
  { id:11, fecha:"2026-06-14", equipoA:"Ivory Coast",  equipoB:"Ecuador"       },
  { id:12, fecha:"2026-06-14", equipoA:"Sweden",       equipoB:"Tunisia"       },
  { id:13, fecha:"2026-06-15", equipoA:"Spain",        equipoB:"Cape Verde"    },
  { id:14, fecha:"2026-06-15", equipoA:"Belgium",      equipoB:"Egypt"         },
  { id:15, fecha:"2026-06-15", equipoA:"Saudi Arabia", equipoB:"Uruguay"       },
  { id:16, fecha:"2026-06-15", equipoA:"Iran",         equipoB:"New Zealand"   },
  { id:17, fecha:"2026-06-16", equipoA:"France",       equipoB:"Senegal"       },
  { id:18, fecha:"2026-06-16", equipoA:"Iraq",         equipoB:"Norway"        },
  { id:19, fecha:"2026-06-16", equipoA:"Argentina",    equipoB:"Algeria"       },
  { id:20, fecha:"2026-06-16", equipoA:"Austria",      equipoB:"Jordan"        },
  { id:21, fecha:"2026-06-17", equipoA:"Portugal",     equipoB:"DR Congo"      },
  { id:22, fecha:"2026-06-17", equipoA:"England",      equipoB:"Croatia"       },
  { id:23, fecha:"2026-06-17", equipoA:"Ghana",        equipoB:"Panama"        },
  { id:24, fecha:"2026-06-17", equipoA:"Uzbekistan",   equipoB:"Colombia"      },
  { id:25, fecha:"2026-06-18", equipoA:"Czechia",      equipoB:"South Africa"  },
  { id:26, fecha:"2026-06-18", equipoA:"Switzerland",  equipoB:"Bosnia"        },
  { id:27, fecha:"2026-06-18", equipoA:"Canada",       equipoB:"Qatar"         },
  { id:28, fecha:"2026-06-18", equipoA:"Mexico",       equipoB:"South Korea"   },
  { id:29, fecha:"2026-06-19", equipoA:"USA",          equipoB:"Australia"     },
  { id:30, fecha:"2026-06-19", equipoA:"Scotland",     equipoB:"Morocco"       },
  { id:31, fecha:"2026-06-19", equipoA:"Brazil",       equipoB:"Haiti"         },
  { id:32, fecha:"2026-06-19", equipoA:"Türkiye",      equipoB:"Paraguay"      },
  { id:33, fecha:"2026-06-20", equipoA:"Netherlands",  equipoB:"Sweden"        },
  { id:34, fecha:"2026-06-20", equipoA:"Germany",      equipoB:"Ivory Coast"   },
  { id:35, fecha:"2026-06-20", equipoA:"Ecuador",      equipoB:"Curaçao"       },
  { id:36, fecha:"2026-06-20", equipoA:"Tunisia",      equipoB:"Japan"         },
  { id:37, fecha:"2026-06-21", equipoA:"Spain",        equipoB:"Saudi Arabia"  },
  { id:38, fecha:"2026-06-21", equipoA:"Belgium",      equipoB:"Iran"          },
  { id:39, fecha:"2026-06-21", equipoA:"Uruguay",      equipoB:"Cape Verde"    },
  { id:40, fecha:"2026-06-21", equipoA:"New Zealand",  equipoB:"Egypt"         },
  { id:41, fecha:"2026-06-22", equipoA:"Argentina",    equipoB:"Austria"       },
  { id:42, fecha:"2026-06-22", equipoA:"France",       equipoB:"Iraq"          },
  { id:43, fecha:"2026-06-22", equipoA:"Norway",       equipoB:"Senegal"       },
  { id:44, fecha:"2026-06-22", equipoA:"Jordan",       equipoB:"Algeria"       },
  { id:45, fecha:"2026-06-23", equipoA:"Portugal",     equipoB:"Uzbekistan"    },
  { id:46, fecha:"2026-06-23", equipoA:"England",      equipoB:"Ghana"         },
  { id:47, fecha:"2026-06-23", equipoA:"Panama",       equipoB:"Croatia"       },
  { id:48, fecha:"2026-06-23", equipoA:"Colombia",     equipoB:"DR Congo"      },
  { id:49, fecha:"2026-06-24", equipoA:"Switzerland",  equipoB:"Canada"        },
  { id:50, fecha:"2026-06-24", equipoA:"Bosnia",       equipoB:"Qatar"         },
  { id:51, fecha:"2026-06-24", equipoA:"Morocco",      equipoB:"Haiti"         },
  { id:52, fecha:"2026-06-24", equipoA:"Scotland",     equipoB:"Brazil"        },
  { id:53, fecha:"2026-06-24", equipoA:"South Africa", equipoB:"South Korea"   },
  { id:54, fecha:"2026-06-24", equipoA:"Czechia",      equipoB:"Mexico"        },
  { id:55, fecha:"2026-06-25", equipoA:"Curaçao",      equipoB:"Ivory Coast"   },
  { id:56, fecha:"2026-06-25", equipoA:"Ecuador",      equipoB:"Germany"       },
  { id:57, fecha:"2026-06-25", equipoA:"Tunisia",      equipoB:"Netherlands"   },
  { id:58, fecha:"2026-06-25", equipoA:"Japan",        equipoB:"Sweden"        },
  { id:59, fecha:"2026-06-25", equipoA:"Türkiye",      equipoB:"USA"           },
  { id:60, fecha:"2026-06-25", equipoA:"Paraguay",     equipoB:"Australia"     },
  { id:61, fecha:"2026-06-26", equipoA:"Norway",       equipoB:"France"        },
  { id:62, fecha:"2026-06-26", equipoA:"Senegal",      equipoB:"Iraq"          },
  { id:63, fecha:"2026-06-26", equipoA:"Cape Verde",   equipoB:"Saudi Arabia"  },
  { id:64, fecha:"2026-06-26", equipoA:"Uruguay",      equipoB:"Spain"         },
  { id:65, fecha:"2026-06-26", equipoA:"New Zealand",  equipoB:"Belgium"       },
  { id:66, fecha:"2026-06-26", equipoA:"Egypt",        equipoB:"Iran"          },
  { id:67, fecha:"2026-06-27", equipoA:"Panama",       equipoB:"England"       },
  { id:68, fecha:"2026-06-27", equipoA:"Croatia",      equipoB:"Ghana"         },
  { id:69, fecha:"2026-06-27", equipoA:"Colombia",     equipoB:"Portugal"      },
  { id:70, fecha:"2026-06-27", equipoA:"DR Congo",     equipoB:"Uzbekistan"    },
  { id:71, fecha:"2026-06-27", equipoA:"Algeria",      equipoB:"Austria"       },
  { id:72, fecha:"2026-06-27", equipoA:"Jordan",       equipoB:"Argentina"     },
];

// Partidos eliminatorios (ids 73-104) — equipoA/B son placeholders (data.js).
// Tokens: "1A"/"2B"/"3A/B/C/D/F" → se resuelven leyendo la colección `bracket`;
//         "G73" (ganador) / "P101" (perdedor) → se resuelven con `resultados`.
const PARTIDOS_ELIM = [
  { id:73,  fecha:"2026-06-28", fase:"Dieciseisavos de Final", equipoA:"2A",  equipoB:"2B"          },
  { id:74,  fecha:"2026-06-29", fase:"Dieciseisavos de Final", equipoA:"1E",  equipoB:"3A/B/C/D/F"  },
  { id:75,  fecha:"2026-06-29", fase:"Dieciseisavos de Final", equipoA:"1F",  equipoB:"2C"          },
  { id:76,  fecha:"2026-06-29", fase:"Dieciseisavos de Final", equipoA:"1C",  equipoB:"2F"          },
  { id:77,  fecha:"2026-06-30", fase:"Dieciseisavos de Final", equipoA:"2E",  equipoB:"2I"          },
  { id:78,  fecha:"2026-06-30", fase:"Dieciseisavos de Final", equipoA:"1I",  equipoB:"3C/D/F/G/H"  },
  { id:79,  fecha:"2026-06-30", fase:"Dieciseisavos de Final", equipoA:"1A",  equipoB:"3C/E/F/H/I"  },
  { id:80,  fecha:"2026-07-01", fase:"Dieciseisavos de Final", equipoA:"1L",  equipoB:"3E/H/I/J/K"  },
  { id:81,  fecha:"2026-07-01", fase:"Dieciseisavos de Final", equipoA:"1D",  equipoB:"3B/E/F/I/J"  },
  { id:82,  fecha:"2026-07-01", fase:"Dieciseisavos de Final", equipoA:"1G",  equipoB:"3A/E/H/I/J"  },
  { id:83,  fecha:"2026-07-02", fase:"Dieciseisavos de Final", equipoA:"2K",  equipoB:"2L"          },
  { id:84,  fecha:"2026-07-02", fase:"Dieciseisavos de Final", equipoA:"1H",  equipoB:"2J"          },
  { id:85,  fecha:"2026-07-03", fase:"Dieciseisavos de Final", equipoA:"1B",  equipoB:"3E/F/G/I/J"  },
  { id:86,  fecha:"2026-07-03", fase:"Dieciseisavos de Final", equipoA:"1J",  equipoB:"2H"          },
  { id:87,  fecha:"2026-07-03", fase:"Dieciseisavos de Final", equipoA:"1K",  equipoB:"3D/E/I/J/L"  },
  { id:88,  fecha:"2026-07-03", fase:"Dieciseisavos de Final", equipoA:"2D",  equipoB:"2G"          },
  { id:89,  fecha:"2026-07-04", fase:"Octavos de Final",       equipoA:"G73", equipoB:"G76"         },
  { id:90,  fecha:"2026-07-04", fase:"Octavos de Final",       equipoA:"G74", equipoB:"G77"         },
  { id:91,  fecha:"2026-07-05", fase:"Octavos de Final",       equipoA:"G75", equipoB:"G78"         },
  { id:92,  fecha:"2026-07-05", fase:"Octavos de Final",       equipoA:"G79", equipoB:"G80"         },
  { id:93,  fecha:"2026-07-06", fase:"Octavos de Final",       equipoA:"G83", equipoB:"G84"         },
  { id:94,  fecha:"2026-07-06", fase:"Octavos de Final",       equipoA:"G81", equipoB:"G82"         },
  { id:95,  fecha:"2026-07-07", fase:"Octavos de Final",       equipoA:"G86", equipoB:"G88"         },
  { id:96,  fecha:"2026-07-07", fase:"Octavos de Final",       equipoA:"G85", equipoB:"G87"         },
  { id:97,  fecha:"2026-07-09", fase:"Cuartos de Final",       equipoA:"G89", equipoB:"G90"         },
  { id:98,  fecha:"2026-07-10", fase:"Cuartos de Final",       equipoA:"G93", equipoB:"G94"         },
  { id:99,  fecha:"2026-07-11", fase:"Cuartos de Final",       equipoA:"G91", equipoB:"G92"         },
  { id:100, fecha:"2026-07-11", fase:"Cuartos de Final",       equipoA:"G95", equipoB:"G96"         },
  { id:101, fecha:"2026-07-14", fase:"Semifinales",            equipoA:"G97", equipoB:"G98"         },
  { id:102, fecha:"2026-07-15", fase:"Semifinales",            equipoA:"G99", equipoB:"G100"        },
  { id:103, fecha:"2026-07-18", fase:"Tercer puesto",          equipoA:"P101",equipoB:"P102"        },
  { id:104, fecha:"2026-07-19", fase:"Final",                  equipoA:"G101",equipoB:"G102"        },
];

// Índice por id de todos los partidos eliminatorios (para resolución recursiva)
const ELIM_BY_ID = Object.fromEntries(PARTIDOS_ELIM.map(p => [p.id, p]));

// ─── Normalización de nombres de equipos (ESPN → data.js) ─────────────────
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

// ─── Resolución de placeholders eliminatorios ──────────────────────────────
// Lee la colección `bracket` (escrita por sync-bracket.js) y la usa, junto con
// los resultados ya guardados, para resolver los placeholders de cada partido
// eliminatorio a equipos reales:
//   "1A","2B","3A/B/C/D/F"  → bracket[slot].equipo
//   "G73" (ganador 73)      → equipo ganador del partido 73 (bracket + resultados)
//   "P101" (perdedor 101)   → equipo perdedor del partido 101
const PLACEHOLDER_GRUPO  = /^[123][A-L]$/;   // 1A, 2B, 3C...
const PLACEHOLDER_TERCERO= /\//;             // 3A/B/C/D/F
const PLACEHOLDER_GANADOR= /^G(\d+)$/;       // G73
const PLACEHOLDER_PERDEDOR=/^P(\d+)$/;       // P101

async function loadBracket() {
  const snap = await db.collection('bracket').get();
  const map = {};
  snap.forEach(doc => {
    const d = doc.data();
    if (d.slot && d.equipo) map[d.slot] = norm(d.equipo);
  });
  return map;
}

// Resuelve un token a nombre real de equipo, o null si todavía no se puede.
function resolvePlaceholder(token, bracketMap, resultadosMap, seen = new Set()) {
  if (!token) return null;

  // Slot de grupo o de mejor tercero → viene del bracket
  if (PLACEHOLDER_GRUPO.test(token) || PLACEHOLDER_TERCERO.test(token)) {
    return bracketMap[token] || null;
  }

  // Ganador / perdedor de un partido eliminatorio previo
  const mG = token.match(PLACEHOLDER_GANADOR);
  const mP = token.match(PLACEHOLDER_PERDEDOR);
  if (mG || mP) {
    const refId = Number((mG || mP)[1]);
    if (seen.has(refId)) return null;            // evita ciclos
    seen.add(refId);

    const ref = ELIM_BY_ID[refId];
    if (!ref) return null;
    const res = resultadosMap[String(refId)];
    if (!res || !res.signo || res.signo === 'X') return null; // sin resultado válido aún

    const a = resolvePlaceholder(ref.equipoA, bracketMap, resultadosMap, seen);
    const b = resolvePlaceholder(ref.equipoB, bracketMap, resultadosMap, seen);
    if (!a || !b) return null;

    const ganador  = res.signo === 'A' ? a : b;
    const perdedor = res.signo === 'A' ? b : a;
    return mG ? ganador : perdedor;
  }

  // Ya es un nombre real
  return norm(token);
}

// ─── Fetch ESPN scoreboard ─────────────────────────────────────────────────
function fetchDay(dateStr) {
  return new Promise((resolve, reject) => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}&limit=50`;
    https.get(url, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch(e) { reject(new Error(`JSON parse error for ${dateStr}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

// ─── Determinar signo a partir de un evento ESPN ──────────────────────────
function getSigno(competition, isSinEmpate, equipoAName) {
  const competitors = competition.competitors;
  if (!competitors || competitors.length < 2) return null;

  const home = competitors.find(c => c.homeAway === 'home');
  const away = competitors.find(c => c.homeAway === 'away');
  if (!home || !away) return null;

  if (isSinEmpate) {
    // Para eliminatorias, ESPN marca winner=true en el ganador final (incluye penales)
    const winner = competitors.find(c => c.winner === true);
    if (!winner) return null;
    const winnerName = norm(winner.team.displayName || winner.team.shortDisplayName || winner.team.name);
    // Si el ganador es equipoA → A, si es equipoB → B
    if (equipoAName && winnerName === norm(equipoAName)) return 'A';
    if (equipoAName && winnerName !== norm(equipoAName)) return 'B';
    return null;
  }

  const scoreHome = parseInt(home.score, 10);
  const scoreAway = parseInt(away.score, 10);
  if (isNaN(scoreHome) || isNaN(scoreAway)) return null;

  const homeTeam = norm(home.team.displayName || home.team.shortDisplayName || home.team.name);

  // Determinar si home es equipoA o equipoB
  const homeIsA = homeTeam === norm(equipoAName);

  if (scoreHome === scoreAway) return 'X';
  if (scoreHome > scoreAway)   return homeIsA ? 'A' : 'B';
  return homeIsA ? 'B' : 'A';
}

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
  console.log('=== QuartzProde Sync ===', new Date().toISOString());

  // Fechas a consultar: los últimos 3 días + hoy (cubre desfasajes de zona horaria)
  const datesToCheck = [];
  for (let i = -3; i <= 0; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    datesToCheck.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }
  console.log('Fechas a consultar:', datesToCheck.join(', '));

  // Resultados ya guardados en Firestore (id → { signo })
  const existingSnap = await db.collection('resultados').get();
  const existing = new Set();
  const resultadosMap = {};
  existingSnap.forEach(doc => {
    existing.add(doc.id);
    resultadosMap[doc.id] = doc.data();
  });
  console.log(`Resultados existentes en Firestore: ${existing.size}`);

  // Bracket resuelto por sync-bracket.js (slot → equipo real)
  const bracketMap = await loadBracket();
  console.log(`Slots en 'bracket': ${Object.keys(bracketMap).length}`);

  const saved    = [];
  const unmatched = [];

  const FASES_SIN_EMPATE = [
    "Dieciseisavos de Final", "Octavos de Final",
    "Cuartos de Final", "Semifinales", "Tercer puesto", "Final"
  ];

  // Partidos eliminatorios con equipoA/equipoB resueltos a nombres reales.
  // Los que todavía no se pueden resolver (faltan bracket o resultados) quedan fuera.
  const elimResueltos = [];
  for (const p of PARTIDOS_ELIM) {
    if (existing.has(String(p.id))) continue;
    const equipoA = resolvePlaceholder(p.equipoA, bracketMap, resultadosMap);
    const equipoB = resolvePlaceholder(p.equipoB, bracketMap, resultadosMap);
    if (!equipoA || !equipoB) continue;
    elimResueltos.push({ ...p, equipoA, equipoB });
  }
  console.log(`Partidos eliminatorios resueltos vía bracket: ${elimResueltos.length}`);

  for (const dateStr of datesToCheck) {
    let data;
    try {
      data = await fetchDay(dateStr);
    } catch(e) {
      console.error(`Error fetching ${dateStr}:`, e.message);
      continue;
    }

    const events = data.events || [];
    if (!events.length) continue;
    console.log(`\n${dateStr}: ${events.length} evento(s) en ESPN`);

    for (const event of events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const statusName = competition.status?.type?.name || '';
      const isFinished = statusName === 'STATUS_FULL_TIME'
                      || statusName === 'STATUS_FINAL'
                      || statusName === 'STATUS_FT'
                      || competition.status?.type?.completed === true;

      if (!isFinished) {
        console.log(`  → Pendiente/En curso: ${event.name} (${statusName})`);
        continue;
      }

      const competitors = competition.competitors || [];
      const home = competitors.find(c => c.homeAway === 'home');
      const away = competitors.find(c => c.homeAway === 'away');
      if (!home || !away) continue;

      const homeTeam = norm(home.team.displayName || home.team.shortDisplayName || home.team.name);
      const awayTeam = norm(away.team.displayName || away.team.shortDisplayName || away.team.name);

      const matchByName = (p) =>
        (norm(p.equipoA) === homeTeam && norm(p.equipoB) === awayTeam) ||
        (norm(p.equipoA) === awayTeam && norm(p.equipoB) === homeTeam);

      // 1) Fase de Grupos: match directo por nombre de equipos
      let partido = PARTIDOS_GRUPOS.find(matchByName);

      // 2) Fase eliminatoria: match por los nombres reales resueltos desde el bracket
      if (!partido) partido = elimResueltos.find(matchByName);

      if (!partido) {
        console.log(`  → Sin match: ${homeTeam} vs ${awayTeam}`);
        unmatched.push(`${homeTeam} vs ${awayTeam} (${dateStr})`);
        continue;
      }

      if (existing.has(String(partido.id))) {
        console.log(`  → Ya guardado: #${partido.id}`);
        continue;
      }

      // Regla QuartzProde: en TODAS las fases se evalúa el resultado a los 120'
      // (90' + alargue), donde el empate es válido. NO se usa el ganador por
      // penales. Por eso siempre se calcula por el marcador (isSinEmpate=false).
      const equipoAName = partido.equipoA; // ya es un nombre real en ambas fases

      const signo = getSigno(competition, false, equipoAName);
      if (!signo) {
        console.log(`  → No se pudo calcular signo para #${partido.id}`);
        continue;
      }

      await db.collection('resultados').doc(String(partido.id)).set({
        signo,
        estado: 'Finalizado',
        timestamp: Date.now()
      });

      existing.add(String(partido.id));
      saved.push(`#${partido.id} ${homeTeam} vs ${awayTeam} → ${signo}`);
      console.log(`  ✓ Guardado #${partido.id}: ${homeTeam} vs ${awayTeam} → ${signo}`);
    }
  }

  // Resumen
  console.log(`\n=== Resumen ===`);
  console.log(`Nuevos resultados guardados: ${saved.length}`);
  if (saved.length)     console.log(saved.join('\n'));
  if (unmatched.length) console.log(`Sin match: ${unmatched.join(', ')}`);

  // Notificación
  if (saved.length > 0) {
    await notify(
      `⚽ QuartzProde — ${saved.length} resultado(s) nuevo(s):\n${saved.join('\n')}`
    );
  }

  process.exit(0);
}

main().catch(e => {
  console.error('Error fatal:', e);
  process.exit(1);
});
