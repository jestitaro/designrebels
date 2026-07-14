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
├── functions/
│   ├── _utils.js                 # helpers de respuesta JSON compartidos
│   └── api/
│       ├── linkedin.js           # GET  /api/linkedin?handle=...   (usa APIFY_TOKEN)
│       ├── youtube.js            # GET  /api/youtube?handle=...    (usa YOUTUBE_API_KEY)
│       └── generate-script.js    # POST /api/generate-script       (usa ANTHROPIC_API_KEY)
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

`functions/` en cambio sí lo levanta Cloudflare Pages automáticamente por
convención de carpeta: cualquier archivo bajo `functions/api/` se publica
como ruta `/api/...` del propio sitio, siempre que el **Root directory** del
proyecto de Pages sea `projects/quartzsales-marketing-dashboard` (ver deploy
más abajo).

## Estructura esperada vs. estado actual

La convención del monorepo para este proyecto separa `css/`, `js/` y
`functions/`. Ya existe `functions/` (con las tres integraciones que
necesitaban secretos). Lo que sigue pendiente, y no es un problema de
seguridad sino de organización de archivos, es separar el `<style>`/
`<script>` inline de `index.html` en `css/`/`js/` — es un refactor cosmético,
no bloqueante.

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

### Variables de entorno / secrets — quién necesita qué

Hay dos sistemas de secretos independientes, cada uno alimenta un proceso
distinto. No son intercambiables ni se leen entre sí:

| Secreto | Dónde se configura | Quién lo lee | Para qué |
|---|---|---|---|
| `APIFY_TOKEN` | GitHub → repo `designrebels` → Settings → Secrets and variables → **Actions** | `scripts/sync.js` (workflow `quartzsales-sync.yml`) | Sincronizar seguidores de los competidores en `data/competitors.json` |
| `APIFY_TOKEN` | Cloudflare Pages → proyecto → Settings → **Environment variables** | `functions/api/linkedin.js` | Métricas propias de LinkedIn (botón "Actualizar métricas") |
| `YOUTUBE_API_KEY` | Cloudflare Pages → proyecto → Settings → **Environment variables** | `functions/api/youtube.js` | Métricas propias de YouTube |
| `ANTHROPIC_API_KEY` | Cloudflare Pages → proyecto → Settings → **Environment variables** | `functions/api/generate-script.js` | Generador de posts (✨ Generar) |

`APIFY_TOKEN` aparece dos veces porque son dos plataformas distintas
(GitHub Actions y Cloudflare Pages) que no comparten secretos entre sí —
hay que cargarlo en las dos si querés ambas cosas funcionando (el sync
automático de competidores y el botón de métricas propias). Puede ser el
mismo valor de token en los dos lados.

Ninguna de las cuatro es obligatoria para que el sitio **cargue** — sin
ellas, el HTML/CSS/JS estático y la pestaña Competidores (que lee
`data/competitors.json`) funcionan igual; sólo fallan con un toast de error
las acciones que dependen de esa integración puntual (botón "Actualizar
métricas" o "✨ Generar").

## Seguridad

Ninguna integración guarda tokens en el navegador. Los tres endpoints bajo
`functions/api/` corren server-side en Cloudflare Pages Functions y leen sus
credenciales de variables de entorno (`context.env`), nunca del cliente:

- **`functions/api/linkedin.js`**: usa `APIFY_TOKEN` para pedirle a Apify
  (`harvestapi~linkedin-company`) los seguidores/empleados de un handle de
  LinkedIn. No usa ni pide cookies de sesión (`li_at`) — el actor de Apify
  no las necesita.
- **`functions/api/youtube.js`**: usa `YOUTUBE_API_KEY` contra la API de
  YouTube Data v3.
- **`functions/api/generate-script.js`**: usa `ANTHROPIC_API_KEY` para
  generar el post con Claude, con el prompt armado enteramente en el
  servidor.

El modal ⚙️ Configuración del dashboard sólo guarda dos identificadores no
sensibles en `localStorage` (`liHandle`, `ytHandle`: qué empresa/canal
consultar) — cero tokens, cero claves, cero cookies.

`scripts/sync.js` (el sync de competidores) sigue el mismo principio: corre
en GitHub Actions, lee `APIFY_TOKEN` de un secret y nunca lo expone —
`data/competitors.json` sólo contiene números de seguidores, nunca el token.

## Qué hace cada parte

- **`index.html`**: sólo guarda en `localStorage` los handles de LinkedIn/
  YouTube a consultar (no son secretos). El botón "Actualizar métricas"
  llama a `/api/linkedin` y `/api/youtube`; "✨ Generar" llama a
  `/api/generate-script`. Ninguno de los tres requiere configuración previa
  en el navegador — dependen de que Cloudflare Pages tenga cargadas sus
  variables de entorno (ver tabla arriba).
- **`functions/api/*.js`**: las tres integraciones que antes vivían en el
  navegador. Devuelven JSON (`{ ... }` en éxito, `{ error: "..." }` con
  status ≥ 400 en falla) para que el frontend muestre un toast claro en vez
  de romperse.
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

### 3. Cargar las variables de entorno en Cloudflare Pages

En el proyecto de Cloudflare Pages → **Settings** → **Environment
variables** → agregar (como *secret*, no como texto plano) para el entorno
de **Production**:

- `APIFY_TOKEN`
- `YOUTUBE_API_KEY`
- `ANTHROPIC_API_KEY`

Sin esto, el sitio sigue sirviendo normalmente — sólo el botón "Actualizar
métricas" y "✨ Generar" muestran un toast de error indicando qué variable
falta.

### 4. Disparar la primera sync manual desde GitHub Actions

1. En el repo → pestaña **Actions** → workflow **QuartzSales dashboard —
   Sync competitor LinkedIn metrics**.
2. **Run workflow** → rama `main` → input `group`: elegí **ALL** para la
   primera corrida (así se completan los 11 competidores de una).
3. **Run workflow**. Al final vas a ver un resumen `OK=X ERROR=Y` en el log.
4. Si todo salió bien, el job hace commit y push de
   `projects/quartzsales-marketing-dashboard/data/competitors.json`
   automáticamente.

### 5. Verificar los primeros datos en `data/competitors.json`

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

## Probar las Functions localmente (opcional)

Con [Wrangler](https://developers.cloudflare.com/workers/wrangler/) instalado:

```bash
cd projects/quartzsales-marketing-dashboard
APIFY_TOKEN=tu_token YOUTUBE_API_KEY=tu_key ANTHROPIC_API_KEY=tu_key \
  npx wrangler pages dev . --compatibility-date=2024-01-01
```

Esto sirve `index.html` y las rutas `/api/*` juntas, igual que en producción.
