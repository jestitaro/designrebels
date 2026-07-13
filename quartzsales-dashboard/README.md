# QuartzSales · Content Dashboard

Dashboard estático (HTML/CSS/JS sin build, sin frameworks) para el equipo de
contenido de QuartzSales: métricas propias de LinkedIn/YouTube, research de
tendencias, pipeline de ideas (kanban) y radar de competidores de trade
marketing / retail execution.

```
quartzsales-dashboard/
├── index.html                    # el dashboard (única página, todo client-side)
├── config/
│   └── sources.json              # competidores a monitorear + URL de LinkedIn + grupo A/B/C
├── data/
│   └── competitors.json          # generado/actualizado por scripts/sync.js
├── scripts/
│   └── sync.js                   # sync Node.js (sin deps) de métricas de LinkedIn vía Apify
└── .github/workflows/sync.yml    # corre sync.js en un cron diario + botón manual
```

**Nota:** este README asume que el contenido de esta carpeta va a ser la
**raíz** de un repo de GitHub nuevo. Si estás viendo esto dentro del repo
`designrebels`, copiá el contenido de `quartzsales-dashboard/` (no la carpeta
en sí) a la raíz del repo nuevo antes de seguir los pasos de abajo.

---

## Qué hace cada parte

- **`index.html`**: todo corre en el navegador. Los tokens (Apify, Claude,
  YouTube API Key, cookie `li_at` de LinkedIn) se guardan en `localStorage`
  del navegador, nunca se commitean. El botón "Actualizar métricas" pega
  directo a Apify/YouTube/Claude desde el browser para las métricas *propias*
  de QuartzSales — eso ya estaba así en el dashboard original y no requiere
  backend.
- **La pestaña "Competidores"** carga `data/competitors.json` por `fetch()` al
  iniciar. Si el archivo no existe o el fetch falla (por ejemplo abriendo el
  HTML como `file://` local), usa datos de referencia embebidos como
  fallback, así el panel nunca se ve vacío.
- **`scripts/sync.js`** es lo que mantiene `data/competitors.json` al día:
  corre en GitHub Actions (no en el navegador), usa el secret `APIFY_TOKEN` y
  no expone ningún token en el frontend.

### Cadencia de sync (grupos A/B/C)

Para no gastar de más la cuota de Apify, cada competidor en
`config/sources.json` tiene un `group: "A" | "B" | "C"`. Cada corrida del
workflow sólo sincroniza el grupo que le toca según el día del año
(`día_del_año % 3`), rotando A → B → C → A... Cada competidor se actualiza
entonces aproximadamente 1 vez cada 3 días. Podés forzar un grupo puntual o
sincronizar todo de una:

- Manual desde GitHub Actions → input `group`: `auto` (default, respeta la
  cadencia), `A`, `B`, `C`, o `ALL` (todos, ideal para la primera corrida).
- Local: `SYNC_GROUP=ALL APIFY_TOKEN=xxx node scripts/sync.js`

---

## Setup paso a paso

### 1. Crear el repo privado en GitHub

1. En GitHub, **New repository**.
2. Nombre a elección (ej. `quartzsales-content-dashboard`).
3. Visibilidad: **Private**.
4. No inicialices con README/gitignore (ya los tenés acá).
5. Subí el contenido de esta carpeta a la raíz del repo:
   ```bash
   cd quartzsales-dashboard
   git init
   git add .
   git commit -m "Initial commit: QuartzSales Content Dashboard"
   git branch -M main
   git remote add origin git@github.com:TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```

### 2. Agregar el secret `APIFY_TOKEN` en GitHub Actions

1. Conseguí tu token en [Apify Console → Settings → Integrations](https://console.apify.com/account/integrations).
2. En el repo → **Settings** → **Secrets and variables** → **Actions**.
3. **New repository secret**.
4. Nombre: `APIFY_TOKEN` — Valor: el token de Apify.
5. Guardar.

Sin este secret, `scripts/sync.js` falla explícitamente con un mensaje claro
(no falla en silencio ni rompe el resto del workflow).

### 3. Conectar el repo a Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** →
   pestaña **Pages** → **Connect to Git**.
2. Autorizá Cloudflare para acceder a tu cuenta/organización de GitHub y
   seleccioná el repo privado recién creado.
3. Configuración de build:
   - **Production branch**: `main`
   - **Build command**: *(vacío)* — es HTML estático, no hay build.
   - **Build output directory**: `/`
4. **Save and Deploy**. Cloudflare va a servir `index.html` (y `data/`,
   `config/`) directo, sin transformar nada.
5. Cada `git push` a `main` (incluidos los commits automáticos del sync)
   dispara un nuevo deploy.

### 4. Disparar la primera sync manual desde GitHub Actions

1. En el repo → pestaña **Actions** → workflow **Sync competitor LinkedIn
   metrics**.
2. **Run workflow** → rama `main` → input `group`: elegí **ALL** para la
   primera corrida (así se completan los 11 competidores de una).
3. **Run workflow**. Se puede seguir el log en tiempo real; al final vas a
   ver un resumen `OK=X ERROR=Y`.
4. Si todo salió bien, el job hace commit y push de `data/competitors.json`
   automáticamente (usando el token por defecto del workflow — no hace falta
   configurar nada extra para esto).

### 5. Verificar los primeros datos en `data/competitors.json`

1. Después de que el workflow termine, refrescá el repo en GitHub y abrí
   `data/competitors.json` — debería tener un commit nuevo de
   `github-actions[bot]`.
2. Revisá el campo `generatedAt` (timestamp de la corrida) y, por
   competidor, `lastSynced` / `syncStatus`:
   - `"syncStatus": "ok"` → se actualizó `stats.followers` con el dato real.
   - `"syncStatus": "error"` → revisá `syncError`; el motivo más común es una
     URL de LinkedIn mal escrita (ver nota abajo) o rate-limit de Apify.
3. Abrí el sitio publicado en Cloudflare Pages y entrá a la pestaña
   **Competidores** — debería reflejar esos mismos `followers` actualizados
   (puede tardar unos segundos en verse el nuevo deploy de Cloudflare).

### Nota importante: verificar los LinkedIn URLs antes de la primera corrida

Los `linkedinUrl` en `config/sources.json` son **slugs inferidos** a partir
del nombre de cada empresa (ej. `linkedin.com/company/involves/`), no están
verificados uno por uno contra el perfil real de LinkedIn de cada
competidor. Antes de correr el sync por primera vez:

1. Abrí cada URL de `config/sources.json` en el navegador y confirmá que
   apunta a la página de empresa correcta (no a un perfil personal, una
   empresa homónima de otro país, etc.).
2. Corregí el slug si hace falta — es el segmento después de
   `/company/` y antes de la barra final.
3. Un slug incorrecto no rompe el resto del sync: `scripts/sync.js` marca
   ese competidor puntual con `syncStatus: "error"` y sigue con los demás.

---

## Correr el sync localmente (opcional, para debug)

```bash
cd quartzsales-dashboard
APIFY_TOKEN=tu_token SYNC_GROUP=ALL node scripts/sync.js
```

No requiere `npm install`: el script usa sólo `fetch`, `fs` y `path`
nativos de Node 18+.
