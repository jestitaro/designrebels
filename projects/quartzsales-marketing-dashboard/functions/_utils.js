// Helpers compartidos por las Cloudflare Pages Functions de /functions/api.
// No exponen nada sensible: sólo arman las respuestas JSON.

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonError(message, status = 500) {
  return json({ error: message }, status);
}
