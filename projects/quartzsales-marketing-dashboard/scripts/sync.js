#!/usr/bin/env node
'use strict';

// Sync diario de métricas para el Content Dashboard de QuartzSales. Sin
// dependencias npm: usa fetch/fs/path nativos de Node. Corre en GitHub
// Actions (nunca en el navegador) y escribe todo en un único archivo que el
// dashboard consume por fetch(): data/dashboard-snapshot.json.
//
// Qué actualiza cada corrida:
//  - LinkedIn propio (QuartzSales) y YouTube propio: siempre, en toda corrida.
//  - Competidores (seguidores/empleados): sólo el grupo del día (cadencia
//    A/B/C, ver abajo), para no gastar de más la cuota de Apify con 11
//    empresas por corrida.
//  - Posts recientes de los competidores "Directo" (los más comparables —
//    quedan afuera los "Adyacente"): sólo los lunes, priorizando los posts
//    de los últimos 7 días (la semana anterior a la corrida). Si una
//    empresa no publicó nada en esa ventana pero sí tiene posts más viejos,
//    se muestra igual el más reciente marcado como `stale: true` — así el
//    dashboard puede avisar "no postearon esta semana" en vez de no mostrar
//    nada. Es barato — 6 empresas x hasta 5 posts por semana — así que no
//    hace falta repartirlo en grupos como las métricas.
//
// Cadencia A/B/C: config/sources.json asigna cada competidor a un grupo
// (A, B o C). Cada corrida sólo sincroniza el grupo del día, rotando
// A -> B -> C -> A... según el día del año.
//
// Override manual: SYNC_GROUP=A|B|C fuerza un grupo puntual, SYNC_GROUP=ALL
// sincroniza todos los competidores en la misma corrida (útil para la primera
// carga de datos). SYNC_POSTS=true|false fuerza (o salta) la sincronización de
// posts sin importar qué día es — útil para probar manualmente.
//
// IMPORTANTE — sin verificar en vivo: este entorno de desarrollo no tiene
// salida de red hacia apify.com, así que el nombre exacto de los campos de
// input/output del actor de posts (unseenuser/company-posts) se armó con la
// mejor información disponible por búsqueda, no confirmando el schema real
// en la consola de Apify. Si la primera corrida (manual, con SYNC_POSTS=true)
// devuelve 0 posts para TODOS los competidores, lo más probable es que haya
// que ajustar el body de fetchCompanyPosts() — revisar el tab "Input" del
// actor en https://console.apify.com antes de asumir que el actor está roto.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCES_PATH = path.join(ROOT, 'config', 'sources.json');
const DATA_PATH = path.join(ROOT, 'data', 'dashboard-snapshot.json');

const GROUPS = ['A', 'B', 'C'];
const APIFY_ACTOR = 'harvestapi~linkedin-company';
const APIFY_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items`;
const APIFY_POSTS_ACTOR = 'unseenuser~company-posts';
const APIFY_POSTS_URL = `https://api.apify.com/v2/acts/${APIFY_POSTS_ACTOR}/run-sync-get-dataset-items`;
const MAX_POSTS_PER_COMPANY = 5;
const POSTS_LOOKBACK_DAYS = 7; // sólo posts de la última semana (corre los lunes)
const POSTS_FETCH_CANDIDATES = 20; // candidatos pedidos a Apify antes de filtrar por fecha
const DELAY_BETWEEN_REQUESTS_MS = 1500;

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - start) / 86400000);
}

function groupForToday() {
  const forced = (process.env.SYNC_GROUP || '').trim().toUpperCase();
  if (forced === 'ALL') return 'ALL';
  if (GROUPS.includes(forced)) return forced;
  return GROUPS[dayOfYear(new Date()) % GROUPS.length];
}

function shouldSyncPosts() {
  const forced = (process.env.SYNC_POSTS || '').trim().toLowerCase();
  if (forced === 'true') return true;
  if (forced === 'false') return false;
  return new Date().getUTCDay() === 1; // lunes (UTC)
}

function formatFollowers(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function extractFollowers(company) {
  const followers = company?.followerCount ?? company?.followersCount ?? company?.followers
    ?? company?.companyFollowersCount ?? company?.numberOfFollowers ?? null;
  return typeof followers === 'number' ? followers : null;
}

function extractEmployees(company) {
  const employees = company?.employeeCount ?? company?.employees ?? company?.staffCount
    ?? company?.companySize ?? company?.numberOfEmployees ?? null;
  return typeof employees === 'number' ? employees : null;
}

async function fetchLinkedInCompany(token, linkedinUrl) {
  const url = `${APIFY_URL}?token=${encodeURIComponent(token)}&timeout=60&memory=256`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // El actor harvestapi~linkedin-company espera `companies` (lista de URLs
    // o slugs de empresa), no `linkedInUrls` — ese input quedó obsoleto tras
    // un cambio de esquema del Actor.
    body: JSON.stringify({ companies: [linkedinUrl] }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Apify respondió ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`);
  }

  const data = await res.json();
  const company = Array.isArray(data) ? data[0] : data;
  if (!company) {
    throw new Error(
      'Apify devolvió un array vacío para esta URL — puede deberse a un slug de LinkedIn inválido, ' +
      'o a un cambio en el formato de input que espera el Actor (verificá el esquema actual de ' +
      'harvestapi~linkedin-company en Apify antes de asumir que es sólo el slug).'
    );
  }

  return { followers: extractFollowers(company), employees: extractEmployees(company) };
}

// Nombres de campo confirmados en vivo (corrida del 2026-11-02 con
// DEBUG_POSTS=true, ver job log): content, post_url, posted_at, likes,
// comments. Se dejan los nombres adivinados antes como fallback por si el
// actor cambia de esquema de nuevo (mismo criterio que fetchLinkedInCompany).
function extractPost(raw) {
  const text = raw?.content ?? raw?.text ?? raw?.postText ?? raw?.commentary ?? null;
  const url = raw?.post_url ?? raw?.url ?? raw?.postUrl ?? raw?.link ?? null;
  const date = raw?.posted_at ?? raw?.postedAt ?? raw?.publishedAt ?? raw?.date ?? raw?.timestamp ?? null;
  const likes = typeof raw?.likes === 'number' ? raw.likes
    : typeof raw?.likesCount === 'number' ? raw.likesCount
    : typeof raw?.numLikes === 'number' ? raw.numLikes
    : null;
  const comments = typeof raw?.comments === 'number' ? raw.comments
    : typeof raw?.commentsCount === 'number' ? raw.commentsCount
    : typeof raw?.numComments === 'number' ? raw.numComments
    : null;

  return {
    text: typeof text === 'string' ? text.slice(0, 500) : null,
    url: typeof url === 'string' ? url : null,
    date: typeof date === 'string' ? date : null,
    likes,
    comments,
  };
}

// Un post sin fecha parseable NO se descarta — es más probable que sea un
// nombre de campo de fecha distinto al esperado (schema sin verificar, ver
// nota al inicio del archivo) que un post realmente viejo.
function isWithinLookback(post) {
  if (!post.date) return true;
  const d = new Date(post.date);
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() >= Date.now() - POSTS_LOOKBACK_DAYS * 24 * 3600 * 1000;
}

// El actor devuelve este texto como único item cuando la empresa no tiene
// ningún post (no es contenido real, no hay que mostrarlo ni usarlo como
// fallback de "última publicación").
function isPlaceholderPost(post) {
  return post.text === 'No posts found on this company page.' && !post.url && !post.date;
}

// Más reciente primero. Fechas no parseables/ausentes quedan al final (no
// sabemos cuándo fueron, pero preferimos mostrar antes algo con fecha cierta).
function sortByDateDesc(posts) {
  return posts.slice().sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : NaN;
    const db = b.date ? new Date(b.date).getTime() : NaN;
    if (Number.isNaN(da) && Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return 1;
    if (Number.isNaN(db)) return -1;
    return db - da;
  });
}

async function fetchCompanyPosts(token, linkedinUrl) {
  const url = `${APIFY_POSTS_URL}?token=${encodeURIComponent(token)}&timeout=90&memory=256`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // `companies` (probado el 2026-11-02 con DEBUG_POSTS=true) NO es el
    // campo correcto: el actor devolvió error "No LinkedIn company URLs
    // were provided" / "...the 'LinkedIn company URLs' field", que es el
    // label de Apify, no la key JSON real. En vez de seguir adivinando una
    // por una, mandamos varios alias plausibles a la vez — el actor ya
    // demostró que tolera claves de más sin rechazar el request entero.
    // Pedimos más candidatos de los que mostramos (POSTS_FETCH_CANDIDATES)
    // porque después filtramos por fecha (últimos POSTS_LOOKBACK_DAYS días)
    // y el orden de Apify no está garantizado que sea cronológico.
    body: JSON.stringify({
      linkedinUrls: [linkedinUrl],
      companyUrls: [linkedinUrl],
      urls: [linkedinUrl],
      linkedinCompanyUrls: [linkedinUrl],
      maxPosts: POSTS_FETCH_CANDIDATES,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Apify (posts) respondió ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`);
  }

  const data = await res.json();
  const items = Array.isArray(data) ? data : [];

  // DEBUG_POSTS=true loguea, para CADA empresa, el primer item crudo que
  // devuelve el actor — o si vino vacío, la respuesta cruda completa (puede
  // no ser ni siquiera un array) — para poder diagnosticar por qué algunas
  // empresas sí traen posts y otras no, sin tener que adivinar. No se
  // activa solo: hay que pasarlo por env/workflow_dispatch.
  if ((process.env.DEBUG_POSTS || '').trim().toLowerCase() === 'true') {
    if (items.length) {
      console.log(`    (debug schema) item crudo de ${linkedinUrl}:`, JSON.stringify(items[0]).slice(0, 3000));
    } else {
      console.log(`    (debug schema) respuesta cruda (0 items) de ${linkedinUrl}:`, JSON.stringify(data).slice(0, 3000));
    }
  }

  const realPosts = sortByDateDesc(items.map(extractPost).filter((p) => !isPlaceholderPost(p)));
  const recentPosts = realPosts.filter(isWithinLookback).slice(0, MAX_POSTS_PER_COMPANY);

  let posts;
  if (recentPosts.length > 0) {
    posts = recentPosts.map((p) => ({ ...p, stale: false }));
  } else if (realPosts.length > 0) {
    // Nada en los últimos POSTS_LOOKBACK_DAYS días, pero la empresa sí tiene
    // posts más viejos — mostramos el más reciente igual, marcado `stale`,
    // para que el dashboard pueda avisar "no postearon esta semana, la
    // última vez fue el <fecha>" en vez de no mostrar nada.
    posts = [{ ...realPosts[0], stale: true }];
  } else {
    posts = [];
  }

  if (items.length === 0) {
    console.warn(
      `    (posts) 0 resultados para ${linkedinUrl} — puede ser que la empresa no haya posteado ` +
      'recientemente, o que cambió el esquema del actor (sin verificar en vivo, ver nota al inicio del archivo).'
    );
  } else if (realPosts.length === 0) {
    console.warn(`    (posts) ${linkedinUrl}: sin posts reales (sólo placeholder "no posts found" del actor).`);
  } else if (recentPosts.length === 0) {
    console.warn(
      `    (posts) ${linkedinUrl}: ${realPosts.length} posts encontrados pero ninguno de los últimos ` +
      `${POSTS_LOOKBACK_DAYS} días — mostrando el más reciente (${realPosts[0].date || 'sin fecha'}) como referencia.`
    );
  }

  return posts;
}

async function fetchYouTubeChannel(apiKey, handle) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube respondió ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`);
  }

  const data = await res.json();
  const ch = data.items?.[0];
  if (!ch) throw new Error('Canal no encontrado (¿el handle es correcto?)');

  const s = ch.statistics;
  const videos = parseInt(s.videoCount || 0, 10);
  const views = parseInt(s.viewCount || 0, 10);
  return {
    subs: parseInt(s.subscriberCount || 0, 10),
    videos,
    views,
    avgViews: videos > 0 ? Math.round(views / videos) : 0,
  };
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`No existe ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blankCompetitor(src) {
  return {
    id: src.id,
    name: src.name,
    location: src.location,
    category: src.category,
    gradStart: src.gradStart,
    gradEnd: src.gradEnd,
    size: src.size,
    stats: { followers: '—', posts_mes: 0, engagement: '—', funding: src.funding || 'Sin datos' },
    bars: src.bars || [],
    tags: src.tags || [],
    lastSynced: null,
    syncStatus: 'pending',
    syncError: null,
    posts: [],
    postsLastSynced: null,
    postsSyncStatus: 'pending',
    postsSyncError: null,
  };
}

async function syncCompetitors(token, sources, currentCompetitors, group) {
  const byId = new Map((currentCompetitors || []).map((c) => [c.id, c]));

  // Asegura que todo lo que está en sources.json exista en data, aunque no le
  // toque sync hoy (así el dashboard siempre puede listarlo).
  for (const src of sources.competitors) {
    if (!byId.has(src.id)) byId.set(src.id, blankCompetitor(src));
  }

  const targets = sources.competitors.filter((c) => group === 'ALL' || c.group === group);
  console.log(`Competidores: sincronizando ${targets.length} de ${sources.competitors.length} (grupo ${group}).`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const src = targets[i];
    const existing = byId.get(src.id);
    try {
      const result = await fetchLinkedInCompany(token, src.linkedinUrl);
      const formatted = formatFollowers(result.followers);
      if (formatted) existing.stats.followers = formatted;
      existing.lastSynced = new Date().toISOString();
      existing.syncStatus = 'ok';
      existing.syncError = null;
      ok++;
      console.log(`  OK  ${src.name}: ${formatted || 'sin cambio'}`);
    } catch (err) {
      existing.syncStatus = 'error';
      existing.syncError = err.message;
      failed++;
      console.error(`  ERR ${src.name}: ${err.message}`);
    }

    if (i < targets.length - 1) await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  return {
    competitors: sources.competitors.map((src) => byId.get(src.id)),
    ok,
    failed,
  };
}

// A diferencia de syncCompetitors() (que reparte las 11 empresas en grupos
// A/B/C), esto siempre trae a los competidores "Directo" (ver filtro de
// `targets` abajo) — pero sólo corre 1 vez por semana (ver shouldSyncPosts()),
// así que el costo total sigue siendo bajo. `competitors` es el array que ya
// devolvió syncCompetitors (mismas referencias que terminan en el snapshot)
// y no trae `linkedinUrl`/`category` — por eso recibe `sources` aparte, que
// sí los tiene.
async function syncCompetitorPosts(token, sources, competitors) {
  const byId = new Map(competitors.map((c) => [c.id, c]));
  // Sólo los competidores "Directo" (mismo criterio que usa el dashboard
  // para separarlos de los "Adyacente") — son los más comparables, y
  // reduce el costo/ruido semanal de traer posts de los 11.
  const targets = sources.competitors.filter((src) => (src.category || '').startsWith('Directo'));
  console.log(`Posts de competidores: sincronizando ${targets.length} directos de ${sources.competitors.length} (corrida semanal).`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const src = targets[i];
    const c = byId.get(src.id);
    try {
      const posts = await fetchCompanyPosts(token, src.linkedinUrl);
      if (c) {
        c.posts = posts;
        c.postsLastSynced = new Date().toISOString();
        c.postsSyncStatus = 'ok';
        c.postsSyncError = null;
      }
      ok++;
      console.log(`  OK  ${src.name}: ${posts.length} posts`);
    } catch (err) {
      // Conserva los posts de la corrida anterior si esta falla — no los pisa.
      if (c) {
        c.postsSyncStatus = 'error';
        c.postsSyncError = err.message;
      }
      failed++;
      console.error(`  ERR ${src.name} (posts): ${err.message}`);
    }

    if (i < targets.length - 1) await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  return { ok, failed };
}

async function syncOwnLinkedIn(token, sources, previousOwn) {
  if (!sources.own) return { entry: previousOwn?.linkedin || null, ok: 0, failed: 0 };

  try {
    const result = await fetchLinkedInCompany(token, sources.own.linkedinUrl);
    console.log(`  OK  ${sources.own.name} (LinkedIn propio): ${result.followers ?? 'sin cambio'} seguidores`);
    return {
      entry: {
        followers: result.followers,
        employees: result.employees,
        lastSynced: new Date().toISOString(),
        syncStatus: 'ok',
        syncError: null,
      },
      ok: 1,
      failed: 0,
    };
  } catch (err) {
    console.error(`  ERR ${sources.own.name} (LinkedIn propio): ${err.message}`);
    return {
      entry: {
        followers: previousOwn?.linkedin?.followers ?? null,
        employees: previousOwn?.linkedin?.employees ?? null,
        lastSynced: previousOwn?.linkedin?.lastSynced ?? null,
        syncStatus: 'error',
        syncError: err.message,
      },
      ok: 0,
      failed: 1,
    };
  }
}

async function syncOwnYouTube(apiKey, sources, previousOwn) {
  if (!sources.own?.youtubeHandle) return { entry: previousOwn?.youtube || null, ok: 0, failed: 0 };

  if (!apiKey) {
    console.warn('  SKIP YouTube propio: falta YOUTUBE_API_KEY en el entorno (opcional; ver README).');
    return {
      entry: {
        ...(previousOwn?.youtube || { subs: null, videos: null, views: null, avgViews: null, lastSynced: null }),
        syncStatus: 'skipped',
        syncError: 'YOUTUBE_API_KEY no configurado',
      },
      ok: 0,
      failed: 0,
    };
  }

  try {
    const result = await fetchYouTubeChannel(apiKey, sources.own.youtubeHandle);
    console.log(`  OK  YouTube propio: ${result.subs} suscriptores`);
    return {
      entry: { ...result, lastSynced: new Date().toISOString(), syncStatus: 'ok', syncError: null },
      ok: 1,
      failed: 0,
    };
  } catch (err) {
    console.error(`  ERR YouTube propio: ${err.message}`);
    return {
      entry: {
        subs: previousOwn?.youtube?.subs ?? null,
        videos: previousOwn?.youtube?.videos ?? null,
        views: previousOwn?.youtube?.views ?? null,
        avgViews: previousOwn?.youtube?.avgViews ?? null,
        lastSynced: previousOwn?.youtube?.lastSynced ?? null,
        syncStatus: 'error',
        syncError: err.message,
      },
      ok: 0,
      failed: 1,
    };
  }
}

async function main() {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) {
    console.error('Falta APIFY_TOKEN en el entorno. Configurá el secret en GitHub Actions (ver README).');
    process.exit(1);
  }
  const youtubeApiKey = process.env.YOUTUBE_API_KEY || '';

  const sources = loadJson(SOURCES_PATH);
  const currentData = loadJson(DATA_PATH, { generatedAt: null, group: null, own: null, competitors: [] });

  const group = groupForToday();
  console.log(`Sync QuartzSales dashboard — ${new Date().toISOString()} — grupo del día: ${group}`);

  console.log('LinkedIn / YouTube propios:');
  const [ownLinkedIn, ownYouTube] = await Promise.all([
    syncOwnLinkedIn(apifyToken, sources, currentData.own),
    syncOwnYouTube(youtubeApiKey, sources, currentData.own),
  ]);

  const competitorsResult = await syncCompetitors(apifyToken, sources, currentData.competitors, group);

  let postsResult = { ok: 0, failed: 0 };
  if (shouldSyncPosts()) {
    postsResult = await syncCompetitorPosts(apifyToken, sources, competitorsResult.competitors);
  } else {
    console.log('Posts de competidores: hoy no toca (corre los lunes UTC; forzar con SYNC_POSTS=true).');
  }

  const ok = ownLinkedIn.ok + ownYouTube.ok + competitorsResult.ok + postsResult.ok;
  const failed = ownLinkedIn.failed + ownYouTube.failed + competitorsResult.failed + postsResult.failed;

  const output = {
    generatedAt: new Date().toISOString(),
    group,
    own: {
      linkedin: ownLinkedIn.entry,
      youtube: ownYouTube.entry,
    },
    competitors: competitorsResult.competitors,
  };

  saveJson(DATA_PATH, output);
  console.log(`Listo. OK=${ok} ERROR=${failed}. Escrito en ${path.relative(ROOT, DATA_PATH)}`);

  if (ok === 0 && failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fallo inesperado en sync.js:', err);
  process.exit(1);
});
