#!/usr/bin/env node
'use strict';

// Sync diario de métricas para el Content Dashboard de QuartzSales. Sin
// dependencias npm: usa fetch/fs/path nativos de Node. Corre en GitHub
// Actions (nunca en el navegador) y escribe todo en un único archivo que el
// dashboard consume por fetch(): data/dashboard-snapshot.json.
//
// Qué actualiza cada corrida:
//  - LinkedIn propio (QuartzSales) y YouTube propio: siempre, en toda corrida.
//  - Competidores: sólo el grupo del día (cadencia A/B/C, ver abajo), para no
//    gastar de más la cuota de Apify con 11 empresas por corrida.
//
// Cadencia A/B/C: config/sources.json asigna cada competidor a un grupo
// (A, B o C). Cada corrida sólo sincroniza el grupo del día, rotando
// A -> B -> C -> A... según el día del año.
//
// Override manual: SYNC_GROUP=A|B|C fuerza un grupo puntual, SYNC_GROUP=ALL
// sincroniza todos los competidores en la misma corrida (útil para la primera
// carga de datos).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCES_PATH = path.join(ROOT, 'config', 'sources.json');
const DATA_PATH = path.join(ROOT, 'data', 'dashboard-snapshot.json');

const GROUPS = ['A', 'B', 'C'];
const APIFY_ACTOR = 'harvestapi~linkedin-company';
const APIFY_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items`;
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

function formatFollowers(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function extractFollowers(company) {
  const followers = company?.followersCount ?? company?.followers ?? company?.followerCount
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
    body: JSON.stringify({ linkedInUrls: [linkedinUrl] }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Apify respondió ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`);
  }

  const data = await res.json();
  const company = Array.isArray(data) ? data[0] : data;
  if (!company) throw new Error('Apify no devolvió datos para esta URL (¿el slug de LinkedIn es correcto?)');

  return { followers: extractFollowers(company), employees: extractEmployees(company) };
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

  const ok = ownLinkedIn.ok + ownYouTube.ok + competitorsResult.ok;
  const failed = ownLinkedIn.failed + ownYouTube.failed + competitorsResult.failed;

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
