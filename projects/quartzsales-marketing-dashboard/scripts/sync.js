#!/usr/bin/env node
'use strict';

// Sync de métricas de LinkedIn de competidores para el Content Dashboard de
// QuartzSales. Sin dependencias npm: usa fetch/fs/path nativos de Node.
//
// Cadencia A/B/C: config/sources.json asigna cada competidor a un grupo
// (A, B o C). Cada corrida sólo sincroniza el grupo del día, rotando
// A -> B -> C -> A... según el día del año. Así se reparte el consumo de la
// cuenta de Apify entre corridas en vez de scrapear todo siempre.
//
// Override manual: SYNC_GROUP=A|B|C fuerza un grupo puntual, SYNC_GROUP=ALL
// sincroniza todos los competidores en la misma corrida (útil para la primera
// carga de datos).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCES_PATH = path.join(ROOT, 'config', 'sources.json');
const DATA_PATH = path.join(ROOT, 'data', 'competitors.json');

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

  return { followersRaw: extractFollowers(company) };
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

function blankEntry(src) {
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

async function main() {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.error('Falta APIFY_TOKEN en el entorno. Configurá el secret en GitHub Actions (ver README).');
    process.exit(1);
  }

  const sources = loadJson(SOURCES_PATH);
  const currentData = loadJson(DATA_PATH, { generatedAt: null, group: null, own: null, competitors: [] });

  const group = groupForToday();
  console.log(`Cadencia: grupo ${group} — ${new Date().toISOString()}`);

  const byId = new Map((currentData.competitors || []).map((c) => [c.id, c]));

  // Asegura que todo lo que está en sources.json exista en data, aunque no le
  // toque sync hoy (así el dashboard siempre puede listarlo).
  for (const src of sources.competitors) {
    if (!byId.has(src.id)) byId.set(src.id, blankEntry(src));
  }

  const targets = sources.competitors.filter((c) => group === 'ALL' || c.group === group);
  console.log(`Sincronizando ${targets.length} de ${sources.competitors.length} competidores...`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const src = targets[i];
    const existing = byId.get(src.id);
    try {
      const result = await fetchLinkedInCompany(token, src.linkedinUrl);
      const formatted = formatFollowers(result.followersRaw);
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

  let own = currentData.own || sources.own || null;
  if (sources.own && (group === 'ALL' || group === GROUPS[0])) {
    // La métrica propia de QuartzSales viaja siempre en el grupo A para que se
    // actualice al menos una vez por ciclo de 3 días.
    try {
      const result = await fetchLinkedInCompany(token, sources.own.linkedinUrl);
      const formatted = formatFollowers(result.followersRaw);
      own = {
        id: sources.own.id,
        name: sources.own.name,
        linkedinUrl: sources.own.linkedinUrl,
        followers: formatted || own?.followers || null,
        lastSynced: new Date().toISOString(),
        syncStatus: 'ok',
        syncError: null,
      };
      ok++;
      console.log(`  OK  ${sources.own.name} (propio): ${formatted || 'sin cambio'}`);
    } catch (err) {
      own = {
        id: sources.own.id,
        name: sources.own.name,
        linkedinUrl: sources.own.linkedinUrl,
        followers: own?.followers || null,
        lastSynced: own?.lastSynced || null,
        syncStatus: 'error',
        syncError: err.message,
      };
      failed++;
      console.error(`  ERR ${sources.own.name} (propio): ${err.message}`);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    group,
    own,
    competitors: sources.competitors.map((src) => byId.get(src.id)),
  };

  saveJson(DATA_PATH, output);
  console.log(`Listo. OK=${ok} ERROR=${failed}. Escrito en ${path.relative(ROOT, DATA_PATH)}`);

  if (ok === 0 && failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fallo inesperado en sync.js:', err);
  process.exit(1);
});
