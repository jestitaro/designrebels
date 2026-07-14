# QuartzSales Marketing Dashboard

Dashboard estático (HTML/CSS/JS sin build, sin frameworks) para el equipo de
contenido de QuartzSales: métricas propias de LinkedIn/YouTube, research de
tendencias, pipeline de ideas (kanban) y radar de competidores de trade
marketing / retail execution.

## Ruta del proyecto

`projects/quartzsales-marketing-dashboard/` dentro del monorepo `designrebels`.
Todo el código del dashboard queda autocontenido en esta carpeta.

```
projects/quartzsales-marketing-dashboard/
├── index.html                    # el dashboard (HTML + CSS + JS inline, sin build)
├── config/
│   └── sources.json              # competidores a monitorear + URL de LinkedIn + grupo A/B/C
├── data/
│   └── competitors.json          # generado/actualizado por scripts/sync.js
├── scripts/
│   └── sync.js                   # sync Node.js (sin deps) de métricas de LinkedIn vía Apify
└── .gitignore
```

El workflow que corre `scripts/sync.js` vive en
`.github/workflows/quartzsales-sync.yml` (en la raíz del repo, porque GitHub
Actions sólo lee workflows desde ahí — no se puede anidar dentro del
proyecto). Está configurado con `working-directory:
projects/quartzsales-marketing-dashboard` para operar sobre esta carpeta sin
tocar otros proyectos del monorepo (`prode2026`, etc.).

## Estructura esperada vs. estado actual

La convención del monorepo para este proyecto (ver commit inicial de
`projects/quartzsales-marketing-dashboard/`) es separar `css/`, `js/` y
`functions/`. Hoy el dashboard es un único `index.html` con `<style>`/
`<script>` inline y sin `functions/` de Cloudflare — heredado de la versión
original de una sola página. Funciona igual, pero si el equipo quiere que
converja a esa estructura (útil para el punto de Seguridad de abajo), es un
refactor pendiente, no incluido en este commit.

## Deploy en Cloudflare Pages

- Repository: `jestitaro/designrebels`
- Production branch: `main`
- Root directory: `projects/quartzsales-marketing-dashboard`
- Build command: vacío (HTML/CSS/JS sin framework, no hay build)
- Build output directory: `.`

Como el repo es un monorepo con varios proyectos, este debe configurarse como
su **propio proyecto de Cloudflare Pages** apuntando al mismo repo con este
Root directory — no reutilizar el proyecto de Pages de otro subdirectorio si
existiera uno.

### Variables de entorno / secrets que necesita Cloudflare

- **`APIFY_TOKEN`**: no lo usa Cloudflare Pages en sí — lo consume el
  workflow `quartzsales-sync.yml` en **GitHub Actions** (Settings → Secrets
  and variables → Actions del repo `designrebels`), no como env var de
  Cloudflare. Se necesita para que `scripts/sync.js` pueda pegarle a Apify.
- **Ninguna otra variable es obligatoria para que el sitio sirva** — es HTML
  estático, no hay build ni server-side rendering.
- Si más adelante se migran las integraciones del navegador (ver
  "Seguridad") a Cloudflare Pages Functions, ahí sí habría que cargar como
  **variables de entorno del proyecto de Cloudflare Pages** (no como
  secrets de GitHub): `APIFY_TOKEN`, `ANTHROPIC_API_KEY`, `YOUTUBE_API_KEY`
  y `LINKEDIN_LI_AT_COOKIE`. Hoy esas cuatro no existen como env vars de
  Cloudflare porque el usuario las tipea en el modal ⚙️ Configuración y
  quedan en `localStorage` del navegador (ver limitación de seguridad).

## Seguridad

**Limitación conocida, no resuelta en este commit:** el modal ⚙️
Configuración del dashboard guarda el Apify Token, la Claude API Key, la
YouTube API Key y la cookie `li_at` de LinkedIn en `localStorage` del
navegador, y el botón "Actualizar métricas" / "Generar post" los usa para
pegarle *directo desde el navegador* a Apify, YouTube y la API de Anthropic.
Esto contradice la convención de seguridad de este proyecto (no guardar
tokens en HTML, JS público ni `localStorage`; esas integraciones deberían
correr en Cloudflare Pages Functions o un Worker, leyendo secretos desde
variables de entorno). Es un riesgo bajo mientras el repo sea privado y el
token quede sólo en el navegador de quien lo carga manualmente, pero no
cumple la política documentada acá. Queda como refactor pendiente: mover
`fetchLinkedIn`, `fetchYouTube` y `generateScript` (dentro de `index.html`) a
funciones en `functions/api/*.js` que lean los secretos de variables de
entorno de Cloudflare Pages en vez de pedirlos al usuario.

`scripts/sync.js` (el sync de competidores) **sí** cumple la convención: corre
en GitHub Actions, lee `APIFY_TOKEN` de un secret y nunca lo expone en el
frontend — `data/competitors.json` sólo contiene números de seguidores, nunca
el token.

## Qué hace cada parte

- **`index.html`**: los tokens propios de QuartzSales (Apify, Claude,
  YouTube, cookie `li_at`) se guardan en `localStorage` del navegador de
  quien los carga — ver limitación de seguridad arriba. El botón "Actualizar
  métricas" pega directo a Apify/YouTube desde el browser para las métricas
  *propias* de QuartzSales.
- **La pestaña "Competidores"** carga `data/competitors.json` por `fetch()`
  al iniciar (ruta relativa, funciona sin importar en qué carpeta del sitio
  viva `index.html`). Si el archivo no existe o el fetch falla, usa datos de
  referencia embebidos como fallback, así el panel nunca se ve vacío.
- **`scripts/sync.js`** mantiene `data/competitors.json` al día: corre en
  GitHub Actions, no en el navegador, y no expone ningún token en el
  frontend.

### Cadencia de sync (grupos A/B/C)

Para no gastar de más la cuota de Apify, cada competidor en
`config/sources.json` tiene un `group: "A" | "B" | "C"`. Cada corrida del
workflow sólo sincroniza el grupo que le toca según el día del año
(`día_del_año % 3`), rotando A → B → C → A... Cada competidor se actualiza
entonces aproximadamente 1 vez cada 3 días. Podés forzar un grupo puntual o
sincronizar todo de una desde el input `group` del `workflow_dispatch`:
`auto` (default), `A`, `B`, `C`, o `ALL` (todos, ideal para la primera
corrida).

## Setup paso a paso

### 1. Agregar el secret `APIFY_TOKEN` en GitHub Actions

1. Conseguí tu token en [Apify Console → Settings → Integrations](https://console.apify.com/account/integrations).
2. En `jestitaro/designrebels` → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**.
3. Nombre: `APIFY_TOKEN` — Valor: el token de Apify.

### 2. Conectar (o confirmar) el proyecto en Cloudflare Pages

Ver la sección "Deploy en Cloudflare Pages" arriba. Si ya existe el
proyecto de Pages para este repo, sólo hace falta confirmar que su **Root
directory** sea `projects/quartzsales-marketing-dashboard` (no la raíz del
repo, porque conviven otros proyectos como `prode2026` y el hub de
`designrebels`).

### 3. Disparar la primera sync manual desde GitHub Actions

1. En el repo → pestaña **Actions** → workflow **QuartzSales dashboard —
   Sync competitor LinkedIn metrics**.
2. **Run workflow** → rama `main` → input `group`: elegí **ALL** para la
   primera corrida (así se completan los 11 competidores de una).
3. **Run workflow**. Al final vas a ver un resumen `OK=X ERROR=Y` en el log.
4. Si todo salió bien, el job hace commit y push de
   `projects/quartzsales-marketing-dashboard/data/competitors.json`
   automáticamente.

### 4. Verificar los primeros datos en `data/competitors.json`

1. Después de que el workflow termine, abrí
   `projects/quartzsales-marketing-dashboard/data/competitors.json` en
   GitHub — debería tener un commit nuevo de `github-actions[bot]`.
2. Revisá, por competidor, `lastSynced` / `syncStatus`:
   - `"syncStatus": "ok"` → se actualizó `stats.followers` con el dato real.
   - `"syncStatus": "error"` → revisá `syncError`; el motivo más común es una
     URL de LinkedIn mal escrita (ver nota abajo) o rate-limit de Apify.
3. Abrí el sitio publicado en Cloudflare Pages → pestaña **Competidores** —
   debería reflejar esos mismos `followers` actualizados.

### Nota importante: verificar los LinkedIn URLs antes de la primera corrida

Los `linkedinUrl` en `config/sources.json` son **slugs inferidos** a partir
del nombre de cada empresa (ej. `linkedin.com/company/involves/`), no están
verificados uno por uno contra el perfil real de LinkedIn de cada
competidor. Antes de correr el sync por primera vez, abrí cada URL en el
navegador y corregí el slug si hace falta (el segmento entre `/company/` y
la barra final). Un slug incorrecto no rompe el resto del sync: ese
competidor puntual queda con `syncStatus: "error"` y el resto sigue.

## Correr el sync localmente (opcional, para debug)

```bash
cd projects/quartzsales-marketing-dashboard
APIFY_TOKEN=tu_token SYNC_GROUP=ALL node scripts/sync.js
```

No requiere `npm install`: el script usa sólo `fetch`, `fs` y `path`
nativos de Node 18+.
