// Cloudflare Pages Function — Pipeline de contenido compartido entre todo
// el equipo. Antes vivía sólo en localStorage: cada persona tenía su
// propia copia, sin ver los cambios de nadie más. Ahora se guarda en un
// único documento en el mismo binding de KV que ya usan otras Functions.
//
//   GET  /api/pipeline  -> { pipeline: <último estado guardado> | null }
//   POST /api/pipeline  -> reemplaza el estado completo, body = el Pipeline
//
// No es tiempo real: cada quien ve los cambios de los demás al cargar o
// refrescar la pestaña Pipeline (ver loadPipelineFromServer() en
// index.html). Si dos personas guardan en el mismo momento, gana el
// último POST que llegue (last-write-wins) — aceptable para un equipo
// chico editando ideas de a poco, no pensado para edición simultánea.
import { json, jsonError } from '../_utils.js';

const KV_KEY = 'shared:pipeline';
const COLUMNS = ['ideas', 'ready', 'edit', 'done', 'published'];
const MAX_BODY_BYTES = 200 * 1024; // 200KB de sobra para un pipeline de ideas de texto

const NO_KV_MESSAGE = 'El Pipeline compartido no está configurado en este entorno (falta el binding de KV DEMO_USAGE_KV). Ver README.';

function isValidPipeline(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return COLUMNS.every((col) => Array.isArray(obj[col]));
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DEMO_USAGE_KV) return jsonError(NO_KV_MESSAGE, 500);

  const raw = await env.DEMO_USAGE_KV.get(KV_KEY);
  if (!raw) return json({ pipeline: null });

  try {
    return json({ pipeline: JSON.parse(raw) });
  } catch {
    console.error('pipeline: JSON corrupto en KV, clave', KV_KEY);
    return jsonError('El Pipeline guardado está corrupto — contactar a quien administra el dashboard.', 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DEMO_USAGE_KV) return jsonError(NO_KV_MESSAGE, 500);

  const bodyText = await request.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return jsonError('El Pipeline es demasiado grande para guardar.', 413);
  }

  let pipeline;
  try {
    pipeline = JSON.parse(bodyText);
  } catch {
    return jsonError('Body inválido, se esperaba JSON.', 400);
  }

  if (!isValidPipeline(pipeline)) {
    return jsonError('El Pipeline no tiene la forma esperada (faltan columnas: ' + COLUMNS.join(', ') + ').', 400);
  }

  await env.DEMO_USAGE_KV.put(KV_KEY, JSON.stringify(pipeline));
  return json({ success: true, savedAt: new Date().toISOString() });
}
