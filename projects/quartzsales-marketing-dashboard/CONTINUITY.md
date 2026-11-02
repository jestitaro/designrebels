# Documento de continuidad — QuartzSales Marketing Dashboard

> Preparado para retomar el trabajo en un chat nuevo sin perder contexto.
> Última actualización: commit `89d5c245ed05e2afce04456e4556ad8b194ee825` en `main`.

## 1. Objetivo del proyecto

Convertir un mockup HTML estático de un dashboard de contenido para
QuartzSales (SaaS de trade marketing/retail execution) en una **demo
funcional de costo casi cero**, deployable en Cloudflare Pages desde el
monorepo `jestitaro/designrebels`, que:

- abre y se navega completa sin ningún secreto configurado;
- no dispara llamadas pagas por cada visita (LinkedIn/YouTube/competidores
  se sincronizan 1 vez por día vía GitHub Actions, no en vivo);
- ofrece un generador de posts con IA acotado por cupo diario;
- no guarda tokens ni cookies en el navegador;
- tiene iconografía consistente (Font Awesome, no emoji) y un onboarding
  guiado para nuevos usuarios.

## 2. Ubicación y alcance (repo, paths, ramas)

- **Repo**: `jestitaro/designrebels` (monorepo con otros proyectos:
  `prode2026/`, `projects/qs-league/`, `projects/content-visual-editor/`,
  hub raíz en `index.html`/`assets/`). **Nunca tocar esos otros proyectos.**
- **Proyecto**: `projects/quartzsales-marketing-dashboard/` — todo el código
  autocontenido ahí.
- **Workflow dedicado**: `.github/workflows/quartzsales-sync.yml` (en la
  raíz del repo porque GitHub Actions sólo lee workflows desde ahí; no se
  puede anidar dentro del proyecto).
- **Alcance permitido en cualquier tarea futura sobre este proyecto,
  salvo instrucción explícita en contrario**: únicamente esos dos paths.
- **URL de producción**: `https://quartzsales-marketing-dashboard.pages.dev/`
- **Ramas usadas** (ambas ya mergeadas a `main`, tratarlas como stale/no
  reusar — crear una rama nueva para el próximo trabajo):
  - `claude/quartzales-dashboard-review-e7naaw` (build inicial + refactor de
    seguridad + arquitectura de demo)
  - `claude/quartzsales-icons-onboarding` (íconos + tour)
- **Estado de `main`**: limpio, sin cambios pendientes, HEAD en
  `89d5c245ed05e2afce04456e4556ad8b194ee825`.

## 3. Decisiones aprobadas (por el usuario, en orden cronológico)

1. El proyecto vive en `projects/quartzsales-marketing-dashboard/` dentro de
   `designrebels` (no en un repo nuevo separado, decisión posterior a un
   primer intento donde sí se había armado como repo standalone).
2. Deploy en Cloudflare Pages: **Repository** `jestitaro/designrebels`,
   **Production branch** `main`, **Root directory**
   `projects/quartzsales-marketing-dashboard`, **Build command** vacío,
   **Build output directory** `.`.
3. Arquitectura de datos: GitHub Actions ejecuta el sync 1 vez por día →
   escribe `data/dashboard-snapshot.json` → el frontend sólo lee ese
   archivo. El botón "Actualizar métricas" **no** llama a Apify/YouTube,
   sólo relee el JSON.
4. Seguridad: cero tokens/API keys/cookies en `localStorage` o en el HTML
   público. Las integraciones que necesitan secretos corren server-side
   (Cloudflare Pages Functions o GitHub Actions). No se usa ni se pide la
   cookie `li_at` de LinkedIn.
5. Generador de IA: modelo económico (Haiku) configurable por env var, cupo
   diario con Cloudflare KV (5/IP, 30/global), 3 ejemplos pre-generados
   siempre disponibles y marcados explícitamente como demostración.
6. Íconos: Font Awesome **Free** vía CDN (no requiere el kit pago de la
   empresa). Reemplazo 1:1 de cada emoji ya existente — sin agregar
   iconografía nueva donde no había. Corolario explícito del usuario: un
   ícono de menú colapsable sólo se justificaría si el sidebar llegara a
   colapsar (hoy no colapsa, por eso no se agregó).
7. Ítem "para qué sirve y cómo se usa": **tour interactivo guiado** (no una
   página estática aparte), con contenido redactado por Claude (el usuario
   eligió explícitamente "redactalo vos" en vez de pegar contenido propio).
8. Cada publicación a `main` se hizo sólo tras pedido explícito del usuario
   ("mergea", "hacé commit y push a main") — **no asumir merge automático
   en trabajo futuro salvo que se pida**.

## 4. Componentes modificados (nombres exactos)

```
projects/quartzsales-marketing-dashboard/
├── index.html                    # dashboard SPA, HTML+CSS+JS inline, sin build
├── functions/
│   ├── _utils.js                 # helpers JSON + cupo diario (KV)
│   └── api/
│       └── generate-script.js    # GET (cupo)/POST (generar) — único endpoint con proveedor pago
├── config/
│   └── sources.json              # competidores + URLs LinkedIn + grupo A/B/C + own
├── data/
│   └── dashboard-snapshot.json   # generado por scripts/sync.js, leído por index.html
├── scripts/
│   └── sync.js                   # Node sin deps, corre en GitHub Actions
├── README.md                     # guía de setup/arquitectura para humanos
├── CONTINUITY.md                 # este documento
└── .gitignore

.github/workflows/quartzsales-sync.yml   # único workflow de este proyecto
```

**Eliminados en el camino** (ya no existen, no recrearlos):
`functions/api/linkedin.js`, `functions/api/youtube.js` (llamaban a
Apify/YouTube en vivo desde el navegador — reemplazados por el snapshot
diario), `data/competitors.json` (reemplazado por el snapshot consolidado).

### 4.1. `scripts/sync.js` — funciones y constantes clave

- `SOURCES_PATH` = `config/sources.json`, `DATA_PATH` = `data/dashboard-snapshot.json`
- `GROUPS = ['A', 'B', 'C']`; `groupForToday()` = `día_del_año % 3` (override
  vía env var `SYNC_GROUP` = `A`|`B`|`C`|`ALL`|vacío=auto)
- `APIFY_ACTOR = 'harvestapi~linkedin-company'`;
  `APIFY_URL = https://api.apify.com/v2/acts/harvestapi~linkedin-company/run-sync-get-dataset-items`
- **Body correcto a Apify**: `{ companies: [linkedinUrl] }` — **no**
  `{ linkedInUrls: [...] }` (ese campo quedó obsoleto tras un cambio de
  esquema del Actor, fue un hotfix real ya aplicado).
- `extractFollowers(company)` prioriza `company.followerCount`, con
  fallbacks (`followersCount`, `followers`, `companyFollowersCount`,
  `numberOfFollowers`).
- `extractEmployees(company)` prioriza `company.employeeCount`.
- `fetchLinkedInCompany(token, linkedinUrl)`, `fetchYouTubeChannel(apiKey, handle)`
- `syncOwnLinkedIn()` y `syncOwnYouTube()` corren **en toda corrida** (no
  atadas a la cadencia A/B/C). `syncCompetitors()` sólo sincroniza el grupo
  del día (o `ALL`).
- Si falta `YOUTUBE_API_KEY`: no falla, marca `syncStatus: "skipped"` con
  `syncError: "YOUTUBE_API_KEY no configurado"`.
- Si falta `APIFY_TOKEN`: el script sale con `process.exit(1)` y mensaje
  claro (es obligatorio).
- Mensaje de error mejorado cuando Apify devuelve array vacío: aclara que
  puede ser slug inválido **o** cambio de esquema del Actor.
- Salida: `data/dashboard-snapshot.json` con forma
  `{ generatedAt, group, own: { linkedin, youtube }, competitors: [...] }`.
  `own.linkedin`/`own.youtube` guardan **números crudos** (no strings
  formateados); `competitors[].stats.followers` sí guarda string
  preformateado (`"12.4K"`) — son dos convenciones distintas, a propósito,
  no unificar sin revisar `formatNum()` en el frontend.

### 4.2. `config/sources.json` — estado actual exacto

```
own: { id: "quartzsales", linkedinUrl: ".../company/quartz-sales/", youtubeHandle: "esaurio1591" }
Grupo A: involves, ailet, checkpos, storecheck
Grupo B: repsly, trax-retail, frogmi, persat
Grupo C: pitcher, retail-velocity, shelf-track
```

### 4.3. `functions/_utils.js`

- `json(obj, status)`, `jsonError(message, status)` → siempre
  `{ success:false, error }` en error.
- `DEMO_LIMITS = { perIp: 5, global: 30 }`
- `KV_KEY_TTL_SECONDS = 172800` (48h)
- Claves KV: `ip:<YYYY-MM-DD>:<ip>` y `global:<YYYY-MM-DD>` (fecha en UTC).
- `getClientIP(request)` → header `CF-Connecting-IP` (fallback `x-forwarded-for`).
- `peekQuota(env, ip)` → sólo lee, no gasta cupo (usado por `GET`).
- `consumeQuota(env, ip)` → suma 1, sólo se llama tras una generación
  **exitosa** (un error de Anthropic no gasta cupo del usuario).
- Si `env.DEMO_USAGE_KV` no existe: no bloquea, devuelve `devWarning` con el
  texto exacto `"DEMO_USAGE_KV no está vinculado en este entorno — los
  límites de la demo no se están aplicando (esto sólo debería verse en
  desarrollo local)."`

### 4.4. `functions/api/generate-script.js`

- `DEFAULT_MODEL = 'claude-haiku-4-5-20251001'` (override vía env var
  `ANTHROPIC_MODEL`)
- `MAX_OUTPUT_TOKENS = 350`, `MAX_TOPIC_LENGTH = 300`
- `ALLOWED_CHANNELS = ['linkedin', 'youtube']`; `format` se valida contra
  `FORMAT_DESCRIPTIONS` (post_corto, post_largo, carrusel, video_corto) —
  cualquier otro valor cae a `post_corto`.
- `onRequestGet` → `{ remaining, limits, devWarning? }` (no gasta cupo).
- `onRequestPost` → valida body → chequea cupo (`peekQuota`) → llama a
  Anthropic → si OK, `consumeQuota` → responde
  `{ success:true, content, remaining, devWarning? }`. Si falla Anthropic:
  `502` genérico, **nunca** reenvía el body de error del proveedor al
  cliente ni a los logs (sólo el status HTTP).
- Al agotar cupo: `429` con el mensaje exacto pedido por el usuario:
  `"La cuota diaria de la demo fue alcanzada. Podés seguir recorriendo el
  dashboard y usar los ejemplos disponibles."`

### 4.5. `index.html` — mapa de funciones/constantes clave

**Datos y snapshot:**
`SNAPSHOT_URL = 'data/dashboard-snapshot.json'`, `LIVE_FRESHNESS_HOURS = 36`
(más viejo que esto → `"cached"` en vez de `"live"`), `DASHBOARD` (estado
global), `loadDashboardData(showToast)`, `renderDashboard()`,
`computeSnapshotSource()`, `resolveChannelSource()`, `formatUpdatedAt()`,
`sourceLabel()` → `"Datos actualizados"` / `"Datos almacenados"` / `"Modo
demo"`. `refreshMetrics()` sólo llama a `loadDashboardData(true)`.

**Fallbacks de demo** (constantes, nunca se llaman "generado en vivo"):
`DEMO_COMPETITORS` (11 items, misma data que `config/sources.json` pero con
`stats` de referencia), `DEMO_OWN_LINKEDIN`, `DEMO_OWN_YOUTUBE`,
`DEMO_RESEARCH_RESULTS` (3 items, se usan si GitHub+HN fallan los dos a la
vez), `DEMO_SCRIPT_EXAMPLES` (3 keys: `institucional`, `caso_exito`,
`producto`), `demoPipelineSeed()` (4 tarjetas, sólo si no hay nada en
`localStorage.qs_pipeline`).

**Generador de posts:** `openScriptModal()`, `refreshQuotaDisplay()` (GET al
montar el modal), `generateScript()` (con guard `isGeneratingScript` contra
doble click + `btn.disabled`), `useDemoExample(key)` (carga uno de los 3
ejemplos, cambia el label a "Ejemplo de demostración — ... (no generado en
vivo)").

**Onboarding tour** (agregado en la última tarea):
`ONBOARDING_STEPS` (array de 9 pasos: bienvenida centrada → métricas →
botón actualizar → research → pipeline → generador de IA (abre el modal
real) → competidores → configuración → cierre centrado),
`onboardingStepIndex`, `onboardingActive`, `startOnboardingTour()`,
`endOnboardingTour()`, `onboardingNext()`, `onboardingBack()`,
`renderOnboardingStep()`, `positionOnboardingCenter()`,
`positionOnboardingNear(target)`, `maybeOfferOnboardingTour()` (se llama
desde `init()`, auto-ofrece el tour 900ms después de cargar si
`!localStorage.qs_onboarding_seen`). Escape cierra el tour (hook agregado al
listener `keydown` existente).

**IDs de DOM relevantes para el tour**: `#onboarding-overlay`,
`#onboarding-spotlight`, `#onboarding-card`, `#onboarding-counter`,
`#onboarding-title`, `#onboarding-text`, `#onboarding-back`,
`#onboarding-skip`, `#onboarding-next`, `#btn-help-tour` (botón "Ayuda"),
`#btn-open-config` (botón "Configuración", separado del de Ayuda).

**Toasts/íconos:** `escapeHtml(str)`, `TOAST_ICONS` (`success` →
`fa-circle-check`, `error` → `fa-triangle-exclamation`, `info` →
`fa-circle-info`), `toast()` ahora arma `innerHTML` con ícono + texto
escapado (antes era `textContent` con emoji embebido en cada mensaje).

**localStorage keys usadas por el dashboard**: `qs_cfg` (sólo
`{ liHandle, ytHandle }`, nunca secretos), `qs_pipeline`, `qs_li_hist`,
`qs_li_hist_last_gen` (dedupe de historial de seguidores), `qs_onboarding_seen`.

**Íconos**: Font Awesome Free vía
`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css`
(agregado en `<head>`, mismo patrón que el link de Google Fonts ya
existente). Clases CSS nuevas: `.status-dot.demo`, `.demo-banner`,
`.onboarding-overlay`, `.onboarding-spotlight`, `.onboarding-card` (+
variantes `.centered`), `.onboarding-card-header`, `.onboarding-counter`,
`.onboarding-title`, `.onboarding-text`, `.onboarding-actions`, `.toast i`.

## 5. Configuración — nombres exactos por plataforma

### GitHub Actions (repo → Settings → Secrets and variables → Actions)

| Secret | Estado | Uso |
|---|---|---|
| `APIFY_TOKEN` | **configurado y funcionando** (confirmado en producción) | `scripts/sync.js` — obligatorio |
| `YOUTUBE_API_KEY` | **no configurado** | `scripts/sync.js` — opcional, YouTube propio queda en `"skipped"` sin esto |

### Cloudflare Pages (proyecto → Settings)

| Variable/binding | Estado | Uso |
|---|---|---|
| `ANTHROPIC_API_KEY` | Configurado por el usuario (confirmado por él) | `functions/api/generate-script.js` |
| `ANTHROPIC_MODEL` | Configurado por el usuario (opcional, default `claude-haiku-4-5-20251001`) | ídem |
| KV binding `DEMO_USAGE_KV` | Configurado por el usuario | cupo diario del generador |

- **Deploy config**: Repository `jestitaro/designrebels`, Production branch
  `main`, Root directory `projects/quartzsales-marketing-dashboard`, Build
  command vacío, Build output directory `.`.
- Cron del workflow: `0 9 * * *` (09:00 UTC, diario) +
  `workflow_dispatch` manual con input `group`
  (`auto`/`A`/`B`/`C`/`ALL`), `node-version: '24'`.

## 6. Restricciones (no negociables salvo pedido explícito)

- No modificar/reconstruir/desplegar `prode2026/`, `projects/qs-league/`,
  `projects/content-visual-editor/`, el hub raíz (`index.html`, `assets/`),
  ni ningún otro workflow que no sea `quartzsales-sync.yml`.
- No agregar tokens, API keys ni cookies en HTML/JS público ni en
  `localStorage`. No usar la cookie `li_at` de LinkedIn.
- No mergear a `main` sin que el usuario lo pida explícitamente (el patrón
  en esta conversación fue: trabajar en una rama nueva, avisar, y mergear
  sólo cuando el usuario dice "mergea"/"hacé push a main").
- Antes de tocar `scripts/sync.js` o el Actor de Apify: **verificar el
  esquema actual del Actor** antes de asumir nombres de campo (ya pasó una
  vez que Apify cambió `linkedInUrls` → `companies` sin aviso).
- Este entorno de trabajo (sandbox) **bloquea salida de red a dominios
  arbitrarios** (Apify, Anthropic, api.apify.com, cdnjs, etc. vía proxy con
  política de allowlist). No se puede probar contra las APIs reales desde
  acá — las pruebas se hacen con `fetch` mockeado o Chromium headless
  contra un server local. La verificación en vivo real la hace el usuario
  desde GitHub Actions / el sitio publicado.

## 7. Estado actual en producción (al momento de escribir esto)

`data/dashboard-snapshot.json` en `main`:
- `generatedAt`: `2026-07-16T11:06:05.203Z`, último `group` sincronizado: `C`
- `own.linkedin`: **ok**, 2874 seguidores, 8 empleados
- `own.youtube`: `"skipped"` (falta `YOUTUBE_API_KEY`)
- Competidores **ok**: `involves`, `ailet`, `repsly`, `frogmi`, `retail-velocity`
- Competidores **error** (array vacío de Apify — slug a verificar):
  `checkpos`, `storecheck`, `trax-retail`, `persat`, `pitcher`, `shelf-track`

## 8. Tareas terminadas (resumen cronológico)

1. Construcción inicial del proyecto completo (index.html, sync.js,
   sources.json, workflow, README) a partir de un mockup HTML subido, en
   `quartzsales-dashboard/` en la raíz del repo.
2. Movido a su ubicación definitiva `projects/quartzsales-marketing-dashboard/`
   por pedido del usuario, tras mergear la carpeta ya creada en `main`.
3. Refactor de seguridad: se sacaron todos los tokens/API keys/cookie
   `li_at` del modal de Configuración y de `localStorage`; se crearon
   Cloudflare Pages Functions (`linkedin.js`, `youtube.js`,
   `generate-script.js`) para mover esas integraciones al servidor.
4. Rearquitectura completa a "demo de costo casi cero": snapshot diario
   consolidado (`dashboard-snapshot.json`), eliminación de las Functions de
   LinkedIn/YouTube (ya no hacen falta), cupo diario con KV para el
   generador, datos de demo/fallback en toda la UI, 3 ejemplos
   pre-generados, README con arquitectura completa.
5. Primera publicación a `main` (merge con alcance verificado).
6. Hotfix en producción: el Actor de Apify cambió su input de `linkedInUrls`
   a `companies` — corregido, probado con mocks, Node 20→24 en el workflow.
7. Reemplazo de emojis por Font Awesome Free (1:1, sin agregar iconografía
   nueva) + construcción de un tour de onboarding interactivo de 9 pasos
   (botón "Ayuda"), con contenido redactado por Claude. Mergeado a `main`.

## 9. Próximos pasos / pendientes conocidos

- **Verificar manualmente los 6 slugs de LinkedIn con error** en
  `config/sources.json`: `checkpos`, `storecheck`, `trax-retail`, `persat`,
  `pitcher`, `shelf-track` (abrir cada URL, corregir el segmento después de
  `/company/`).
- **`YOUTUBE_API_KEY`** no está cargado en GitHub Actions — YouTube propio
  sigue en modo demo hasta que se agregue (opcional, no bloqueante).
- El archivo `instructivo-quartzsales-marketing-dashboard.html` mencionado
  en un pedido anterior **nunca llegó adjunto** — el usuario optó por el
  tour interactivo en su lugar, pero si en algún momento quieren además una
  página estática `/instructivo.html` separada, es un pedido pendiente sin
  resolver, no builder todavía.
- El contenido de los 9 pasos del tour lo redactó Claude por decisión del
  usuario ("redactalo vos") — el usuario puede querer ajustar tono o
  énfasis; no se resolvió por él, queda para revisión editorial.
- Sidebar sin colapsar (no responsive/mobile) — no se construyó porque no
  fue pedido; si se agrega en el futuro, ahí sí correspondería un ícono de
  menú hamburguesa (criterio explícito del usuario).
- Separar el `<style>`/`<script>` inline de `index.html` en `css/`/`js/`
  sigue pendiente como mejora cosmética de organización (mencionado en el
  README, nunca priorizado).
