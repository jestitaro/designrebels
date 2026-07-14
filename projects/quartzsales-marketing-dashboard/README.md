# QuartzSales Marketing Dashboard

Demo funcional de costo casi cero para el equipo de contenido de QuartzSales:
métricas propias de LinkedIn/YouTube, research de tendencias, pipeline de
ideas (kanban), radar de competidores, y un generador de posts con IA
controlado por cupo diario. Diseñada para abrir y navegarse completa **sin
ningún secreto configurado**, mostrando datos de demostración realistas
hasta que se conectan las integraciones reales.

## Ruta del proyecto

`projects/quartzsales-marketing-dashboard/` dentro del monorepo `designrebels`.
Todo el código del dashboard queda autocontenido en esta carpeta.

```
projects/quartzsales-marketing-dashboard/
├── index.html                    # el dashboard (HTML + CSS + JS inline, sin build)
├── functions/
│   ├── _utils.js                 # JSON helpers + cupo diario en Cloudflare KV
│   └── api/
│       └── generate-script.js    # GET (cupo restante) / POST (generar) — usa ANTHROPIC_API_KEY
├── config/
│   └── sources.json              # competidores a monitorear + URL de LinkedIn + grupo A/B/C
├── data/
│   └── dashboard-snapshot.json   # generado/actualizado por scripts/sync.js — 1 vez por día
├── scripts/
│   └── sync.js                   # sync Node.js (sin deps): LinkedIn + YouTube + competidores
└── .gitignore
```

El workflow que corre `scripts/sync.js` vive en
`.github/workflows/quartzsales-sync.yml` (en la raíz del repo, porque GitHub
Actions sólo lee workflows desde ahí). Usa `working-directory:
projects/quartzsales-marketing-dashboard` para no tocar otros proyectos del
monorepo (`prode2026`, etc.).

`functions/` lo levanta Cloudflare Pages automáticamente por convención de
carpeta: cualquier archivo bajo `functions/api/` se publica como ruta
`/api/...` del propio sitio, siempre que el **Root directory** del proyecto
de Pages sea `projects/quartzsales-marketing-dashboard`.

---

## Arquitectura de la demo

```text
GitHub Actions (1 vez por día)
  → Apify (LinkedIn propio + competidores) + YouTube Data API
  → escribe data/dashboard-snapshot.json
  → commit + push automático

index.html
  → fetch('data/dashboard-snapshot.json') al cargar
  → si no existe o falla: usa datos de demostración embebidos
  → "Actualizar métricas" vuelve a leer el mismo archivo — NO llama a
    Apify/YouTube desde el navegador

functions/api/generate-script.js (Cloudflare Pages Function)
  → único endpoint que sigue llamando a un proveedor de pago (Anthropic)
  → protegido con cupo diario en Cloudflare KV (por IP y global)
  → si no hay ANTHROPIC_API_KEY, se agotó el cupo, o Anthropic falla:
    el usuario puede usar 3 ejemplos pre-generados en vez de generar
```

Ninguna acción del usuario (abrir el dashboard, tocar "Actualizar
métricas", navegar a Competidores) dispara una llamada paga. La única
llamada paga posible es generar un post con IA, y esa está limitada a 5
veces por IP y 30 veces en total por día.

### Qué funciona sin ningún secreto configurado

Todo el dashboard abre y se navega igual: Overview, Research (usa GitHub y
Hacker News, APIs públicas gratuitas), Pipeline, y Competidores — con datos
de demostración marcados como "Modo demo". El generador de posts también
funciona sin secretos: ofrece los 3 ejemplos pre-generados aunque no haya
`ANTHROPIC_API_KEY`.

### Qué requiere secretos

| Funcionalidad | Requiere | Sin eso... |
|---|---|---|
| Sync diario de LinkedIn/YouTube/competidores | `APIFY_TOKEN` (+ `YOUTUBE_API_KEY` opcional) en GitHub Actions | El dashboard sigue mostrando el último snapshot generado, o datos de demo si nunca corrió |
| Generación de posts en vivo con Claude | `ANTHROPIC_API_KEY` en Cloudflare Pages | El botón "✨ Generar" devuelve un error amigable; los 3 ejemplos pre-generados siguen disponibles |
| Cupo diario del generador | binding de KV `DEMO_USAGE_KV` en Cloudflare Pages | La Function sigue funcionando (útil en desarrollo local) pero sin aplicar el límite — ver advertencia más abajo |

---

## 1. Datos: snapshot diario en vez de llamadas en vivo

`scripts/sync.js` corre 1 vez por día desde GitHub Actions y actualiza en una
sola corrida:

- LinkedIn propio de QuartzSales (seguidores, empleados).
- YouTube propio (suscriptores, videos, vistas).
- Competidores, con cadencia **A/B/C**: cada uno tiene un `group` en
  `config/sources.json`, y cada corrida sólo sincroniza el grupo del día
  (rotando A → B → C → A... según el día del año) para no gastar de más la
  cuota de Apify con 11 empresas todos los días. LinkedIn/YouTube propios se
  actualizan **todos los días** (son 1-2 llamadas extra, no 11).
- `generatedAt`: fecha/hora de esa corrida.

Todo se escribe en `data/dashboard-snapshot.json`, que el frontend lee por
`fetch()`. Podés forzar un grupo puntual o sincronizar todo de una desde el
input `group` del `workflow_dispatch`: `auto` (default), `A`, `B`, `C`, o
`ALL` (todos, ideal para la primera corrida).

### Qué muestra el frontend

- **Datos actualizados** (verde): el snapshot tiene menos de 36 horas.
- **Datos almacenados** (amarillo): hay un snapshot real, pero más viejo
  (por ejemplo, si el workflow dejó de correr) — sigue siendo un dato real,
  no inventado.
- **Modo demo** (violeta): no hay snapshot todavía, o esa métrica puntual
  nunca se sincronizó con éxito. Se muestran los datos de referencia
  embebidos en `index.html` (`DEMO_OWN_LINKEDIN`, `DEMO_OWN_YOUTUBE`,
  `DEMO_COMPETITORS`).

Cada tarjeta de LinkedIn/YouTube en Overview, y el radar de Competidores,
muestran su propio estado y un "Última actualización: ..." — o el aviso
"Todavía no corrió ninguna actualización automática — mostrando datos de
demostración" si nunca hubo sync.

### El botón "Actualizar métricas"

No dispara ninguna llamada a Apify/YouTube. Vuelve a leer
`data/dashboard-snapshot.json` (con `cache: 'no-store'`) y refresca la
vista, mostrando un toast con la fecha de la última sync real disponible.
La actualización real de los datos sigue pasando 1 vez por día, en GitHub
Actions.

---

## 2. Datos de respaldo (demo)

Overview, Pipeline y Research nunca se ven vacíos ni muestran errores
técnicos:

- **LinkedIn/YouTube propios y Competidores**: fallback embebido en
  `index.html`, activado automáticamente si `data/dashboard-snapshot.json`
  no existe o el fetch falla.
- **Pipeline**: en la primera visita (sin nada guardado en `localStorage`)
  se pre-cargan 4 ideas de ejemplo distribuidas en las columnas del kanban,
  para que Overview y Pipeline tengan datos desde el primer segundo. A
  partir de ahí es 100% editable por quien lo usa.
- **Research**: usa GitHub y Hacker News (APIs públicas, sin costo ni
  secreto). Si ambas fuentes fallan al mismo tiempo (por ejemplo, sin salida
  de red), muestra 3 resultados de ejemplo en vez de un error o una pantalla
  vacía, marcados como ejemplos.
- **Generador de posts**: 3 ejemplos pre-generados (ver sección 4).

---

## 3. Generador de posts con IA — controlado y de costo acotado

`functions/api/generate-script.js`:

- Usa el modelo **Haiku** (la línea más económica de Claude) por defecto:
  `claude-haiku-4-5-20251001`. Se puede pisar sin tocar código con la
  variable de entorno `ANTHROPIC_MODEL` en Cloudflare Pages.
- Limita la respuesta a `max_tokens: 350` — corto a propósito para acotar el
  costo por generación. Los formatos ofrecidos (post corto, post largo,
  carrusel de 4 slides, guión breve) están redactados como "versión breve de
  demo" para que el largo pedido sea consistente con ese límite.
- El prompt del sistema (reglas de tono, contexto de marca) se arma
  enteramente en el servidor — el navegador sólo manda `{ topic, channel,
  format }`.
- Valida el payload: `topic` no puede estar vacío ni superar 300
  caracteres; `channel` y `format` se validan contra una lista cerrada de
  valores permitidos (cualquier otro valor cae a un default seguro).
- Nunca expone `ANTHROPIC_API_KEY`, ni reenvía al cliente el cuerpo de la
  respuesta de error de Anthropic (evita filtrar cualquier detalle interno
  del proveedor); los logs del lado servidor sólo registran el status HTTP,
  nunca la API key ni el cuerpo completo.
- Sólo responde a `GET` (consultar cupo) y `POST` (generar) — cualquier
  otro método HTTP recibe 405 automáticamente (comportamiento por defecto de
  Cloudflare Pages Functions cuando no se define ese handler).

### Cupo diario (Cloudflare KV)

- **5 generaciones por día por IP** y **30 generaciones por día en total**
  (lo que se alcance primero).
- Contador en el binding de KV `DEMO_USAGE_KV`, con una clave por día UTC
  (`ip:<fecha>:<ip>` y `global:<fecha>`) y `expirationTtl` de 48 horas — las
  claves se autolimpian, no hace falta ningún job de mantenimiento.
- Sólo se descuenta cupo en una generación **exitosa**: un error temporal
  de Anthropic no le gasta el cupo al usuario.
- `GET /api/generate-script` consulta el cupo restante sin gastarlo (lo usa
  el modal para mostrar "Te quedan N generaciones hoy" antes de generar).
- `POST /api/generate-script` responde:
  ```json
  { "success": true, "content": "...", "remaining": 3 }
  ```
  y al agotar el cupo, HTTP 429:
  ```json
  { "success": false, "error": "La cuota diaria de la demo fue alcanzada. Podés seguir recorriendo el dashboard y usar los ejemplos disponibles." }
  ```
- **Si `DEMO_USAGE_KV` no está vinculado** (típicamente sólo en desarrollo
  local sin Wrangler configurado), la Function sigue respondiendo
  normalmente pero sin aplicar el límite, y devuelve un `devWarning` en el
  JSON que el modal muestra como aviso amarillo. En producción (Cloudflare
  Pages con el binding configurado) esto no debería verse nunca.

---

## 4. Ejemplos pre-generados

El modal del generador siempre muestra 3 botones — **Institucional**,
**Caso de éxito** y **Producto** — con contenido ya escrito
(`DEMO_SCRIPT_EXAMPLES` en `index.html`). Están disponibles sin importar el
estado de Anthropic: con o sin `ANTHROPIC_API_KEY`, con cupo agotado, o con
Anthropic caído. Al usarlos, el label del resultado cambia a "Ejemplo de
demostración — ... (no generado en vivo)" — nunca se presentan como si
hubieran sido generados en el momento.

---

## 5. Seguridad

- Cero tokens, API keys o cookies en `localStorage` — sólo se guardan ahí
  dos identificadores no sensibles (`liHandle`, `ytHandle`, qué canal
  consultar) y el estado del kanban.
- No se usa ni se pide la cookie `li_at` de LinkedIn — el actor de Apify
  (`harvestapi~linkedin-company`) no la necesita.
- Ninguna API key aparece en el HTML ni en el JavaScript público: viven
  exclusivamente en variables de entorno del lado servidor
  (`context.env` en Cloudflare Pages Functions, secrets en GitHub Actions).
- Los errores de proveedores externos (Anthropic, Apify, YouTube) nunca se
  reenvían tal cual al cliente ni a los logs — sólo un mensaje genérico y,
  como mucho, el status HTTP.
- Validación de parámetros en toda Function: método HTTP, presencia y
  longitud máxima del `topic`, valores permitidos de `channel`/`format`.

---

## 6. Configuración — secretos por plataforma

### GitHub Actions (repo `designrebels` → Settings → Secrets and variables → Actions)

| Secret | Obligatorio | Para qué |
|---|---|---|
| `APIFY_TOKEN` | Sí | `scripts/sync.js`: LinkedIn propio + competidores |
| `YOUTUBE_API_KEY` | No (recomendado) | `scripts/sync.js`: YouTube propio. Si falta, esa parte del snapshot queda en `syncStatus: "skipped"` sin romper el resto de la corrida |

### Cloudflare Pages (proyecto → Settings → Environment variables / Functions → KV bindings)

| Variable / binding | Obligatorio | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí, para generación en vivo | `functions/api/generate-script.js` |
| `ANTHROPIC_MODEL` | No (default: `claude-haiku-4-5-20251001`) | Pisar el modelo sin tocar código |
| Binding de KV `DEMO_USAGE_KV` | Sí, para que el límite diario se aplique | Cupo de generaciones por IP/global |

Cloudflare Pages **no** necesita `APIFY_TOKEN` ni `YOUTUBE_API_KEY`: esas
integraciones se retiraron de las Functions (ya no hay `functions/api/
linkedin.js` ni `youtube.js`) porque las métricas ahora se generan
exclusivamente desde GitHub Actions, no on-demand desde el navegador.

### Cómo crear y vincular `DEMO_USAGE_KV`

1. Cloudflare Dashboard → **Workers & Pages** → **KV** → **Create a
   namespace**. Nombre sugerido: `quartzsales-demo-usage`.
2. En el proyecto de Cloudflare Pages → **Settings** → **Functions** → **KV
   namespace bindings** → **Add binding**.
3. Variable name: `DEMO_USAGE_KV` (tiene que ser exactamente ese nombre,
   es el que usa `functions/api/generate-script.js`). Namespace: el que
   creaste en el paso 1.
4. Guardar y volver a desplegar (o esperar al próximo deploy) para que el
   binding quede activo.

### Deploy — configuración exacta de Cloudflare Pages

- Repository: `jestitaro/designrebels`
- Production branch: `main`
- Root directory: `projects/quartzsales-marketing-dashboard`
- Build command: vacío
- Build output directory: `.`

Como el repo es un monorepo con varios proyectos, este debe ser su **propio
proyecto de Cloudflare Pages** con este Root directory — no reutilizar el
proyecto de Pages de otro subdirectorio si existiera uno.

---

## Setup paso a paso

### 1. Agregar los secrets en GitHub Actions

1. Conseguí tu token en [Apify Console → Settings → Integrations](https://console.apify.com/account/integrations)
   y (opcional) una API key en [Google Cloud Console → YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com).
2. En `jestitaro/designrebels` → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**.
3. Cargá `APIFY_TOKEN` (obligatorio) y `YOUTUBE_API_KEY` (opcional).

### 2. Conectar (o confirmar) el proyecto en Cloudflare Pages

Ver "Deploy — configuración exacta" arriba. Si ya existe el proyecto de
Pages para este repo, confirmá que su **Root directory** sea
`projects/quartzsales-marketing-dashboard`.

### 3. Cargar las variables de entorno y el binding de KV en Cloudflare Pages

En el proyecto de Cloudflare Pages → **Settings** → **Environment
variables**, para **Production**:

- `ANTHROPIC_API_KEY` (secret)
- `ANTHROPIC_MODEL` (opcional; texto plano, ej. `claude-haiku-4-5-20251001`)

Y en **Settings** → **Functions** → **KV namespace bindings**: el binding
`DEMO_USAGE_KV` (ver instrucciones arriba). Sin esto, el sitio sigue
sirviendo normal — sólo el generador de posts en vivo no funciona (los
ejemplos pre-generados siguen disponibles).

### 4. Disparar la primera sync manual desde GitHub Actions

1. En el repo → pestaña **Actions** → workflow **QuartzSales dashboard —
   Sync diario (LinkedIn + YouTube + competidores)**.
2. **Run workflow** → rama `main` → input `group`: elegí **ALL** para la
   primera corrida (así se completan los 11 competidores de una).
3. **Run workflow**. Al final vas a ver un resumen `OK=X ERROR=Y` en el log.
4. Si todo salió bien, el job hace commit y push de
   `data/dashboard-snapshot.json` automáticamente.

### 5. Verificar los primeros datos

1. Abrí `projects/quartzsales-marketing-dashboard/data/dashboard-snapshot.json`
   en GitHub — debería tener un commit nuevo de `github-actions[bot]`.
2. Revisá `own.linkedin` / `own.youtube` y, por competidor, `lastSynced` /
   `syncStatus`:
   - `"ok"` → se actualizó con el dato real.
   - `"error"` → revisá `syncError` (URL de LinkedIn mal escrita — ver nota
     abajo — o rate-limit de Apify/YouTube).
   - `"skipped"` (sólo YouTube propio) → falta `YOUTUBE_API_KEY`.
3. Abrí el sitio publicado en Cloudflare Pages — Overview y Competidores
   deberían mostrar "Datos actualizados" en vez de "Modo demo".

### Nota importante: verificar los LinkedIn URLs antes de la primera corrida

Los `linkedinUrl` en `config/sources.json` son **slugs inferidos** a partir
del nombre de cada empresa, no están verificados uno por uno contra el
perfil real de LinkedIn de cada competidor. Antes de correr el sync por
primera vez, abrí cada URL en el navegador y corregí el slug si hace falta
(el segmento entre `/company/` y la barra final). Un slug incorrecto no
rompe el resto del sync: ese competidor puntual queda con
`syncStatus: "error"`.

---

## Cómo ejecutar localmente

### El sync (Node, sin dependencias)

```bash
cd projects/quartzsales-marketing-dashboard
APIFY_TOKEN=tu_token YOUTUBE_API_KEY=tu_key SYNC_GROUP=ALL node scripts/sync.js
```

### El sitio + la Function del generador (con Wrangler)

```bash
cd projects/quartzsales-marketing-dashboard
ANTHROPIC_API_KEY=tu_key ANTHROPIC_MODEL=claude-haiku-4-5-20251001 \
  npx wrangler pages dev . --compatibility-date=2024-01-01
```

Sin pasarle un binding de KV real, vas a ver el `devWarning` de
`DEMO_USAGE_KV no está vinculado` en el modal del generador — es esperado
en local. Para probar el cupo real localmente, agregá `--kv DEMO_USAGE_KV`
al comando de Wrangler (crea un namespace de KV local de prueba).

## Cómo inspeccionar o reiniciar los límites de uso

- **Ver el uso de hoy**: `GET /api/generate-script` devuelve `remaining`
  sin gastar cupo — es lo mismo que usa el modal.
- **Inspeccionar el detalle**: Cloudflare Dashboard → **Workers & Pages** →
  **KV** → el namespace vinculado a `DEMO_USAGE_KV` → ahí están las claves
  `ip:<fecha>:<ip>` y `global:<fecha>` con su conteo.
- **Reiniciar el cupo antes de que expire solo**: borrá manualmente esas
  claves desde el mismo panel de KV, o esperá a que expiren solas (48h).
- **Qué pasa al agotar la cuota**: el generador devuelve HTTP 429 con el
  mensaje "La cuota diaria de la demo fue alcanzada. Podés seguir
  recorriendo el dashboard y usar los ejemplos disponibles." — el resto del
  dashboard (Overview, Research, Pipeline, Competidores, y los 3 ejemplos
  pre-generados) sigue funcionando normalmente.
