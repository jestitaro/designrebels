# Votación · Nuevo logo de PSMob

Landing interna para que el equipo de QuartzSales vote entre las 3 propuestas finalistas del logo de PSMob (cada una en colores QuartzSales o colores PSMob), con negativos, reducciones y montaje en la app (ícono, splash y login).

## Cómo funciona

- **Front:** `index.html` (estático). Las imágenes viven en `assets/` y se sirven desde GitHub Pages.
- **Votos:** funciones de Vercel en `api/` + Vercel Blob (store privado).
  - `POST /api/vote` → registra `{ option, palette }`. **1 voto por IP**: la IP nunca se guarda, solo un hash con sal secreta (`VOTE_SALT`).
  - `GET /api/status` → dice si esa IP ya votó y, solo en ese caso, devuelve los resultados.
  - `GET /api/admin?key=ADMIN_KEY` → resultados completos; `&format=csv` descarga el registro (fecha, opción, paleta, votante anónimo).
- El orden de las opciones se mezcla por visitante para que la posición no influya.

## Publicación

- Vercel: proyecto `psmob-logo-vote` (variables `BLOB_READ_WRITE_TOKEN`, `VOTE_SALT`, `ADMIN_KEY`).
- Fuente de los diseños: Figma «RECURSOS (QuartzSales / e·Saurio / Turbo)», página Logos, Section 4.

## Limitación conocida

Un voto por IP: dos personas que compartan conexión (misma casa o VPN) cuentan como una sola.
