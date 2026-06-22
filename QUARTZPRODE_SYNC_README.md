# QuartzProde 2026 — Sync de resultados

Script que lee resultados del Mundial 2026 desde la API de ESPN y los escribe automáticamente en Firestore, sin tocar el admin panel.

## Cómo funciona

Corre cada 30 minutos via GitHub Actions. Busca partidos finalizados en ESPN, los mapea a los IDs de tu prode, y guarda `{ signo, estado, timestamp }` en la colección `resultados`.

- **Fase de Grupos (partidos 1–72):** matching por nombre de equipos.
- **Fases eliminatorias (73–104):** los `equipoA`/`equipoB` de `data.js` son placeholders (`1A`, `2B`, `3A/B/C/D/F`, `G73`, `P101`, …). El sync los resuelve a equipos reales leyendo la colección `bracket` (más los `resultados` ya cargados para los cruces tipo "ganador/perdedor de #N") y recién ahí matchea con ESPN por nombre.

### Resolución del bracket (`sync-bracket.js`)

Al terminar la Fase de Grupos, `scripts/sync-bracket.js` lee las posiciones finales de cada grupo desde el endpoint de **standings** de ESPN y escribe la colección `bracket`, un documento por slot:

```
{ slot: "1A", equipo: "Argentina", grupo: "A", posicion: 1, timestamp }
```

Resuelve los primeros y segundos de cada grupo (`1A`…`2L`) y asigna los 8 mejores terceros a sus slots (`3A/B/C/D/F`, …) respetando los grupos admitidos por cada cruce. Los cruces que dependen de partidos eliminatorios (`G73`, `P101`, …) **no** se escriben acá: los resuelve `sync-results.js` a medida que se juegan.

> Nota: el doc id sanea las barras (`3A/B/C/D/F` → `3A_B_C_D_F`) porque Firestore no admite `/` en los ids; el slot original queda en el campo `slot`.

---

## Setup (una sola vez)

### 1. Obtener el Service Account de Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com) → Proyecto `quartzprode2026`
2. ⚙️ → **Configuración del proyecto** → pestaña **Cuentas de servicio**
3. Click en **Generar nueva clave privada** → Descargar el JSON

### 2. Crear el repo en GitHub (si no lo tenés)

Subí estos archivos respetando la estructura:
```
tu-repo/
├── scripts/
│   ├── sync-results.js
│   ├── sync-bracket.js
│   └── package.json
└── .github/
    └── workflows/
        └── sync.yml
```

### 3. Agregar el secret en GitHub

1. Ir al repo → **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Nombre: `FIREBASE_SERVICE_ACCOUNT`
4. Valor: el contenido completo del JSON descargado en el paso 1

### 4. Verificar las reglas de Firestore

Para que el script pueda escribir sin autenticación de usuario, las reglas deben permitir escritura desde el Admin SDK. El Admin SDK bypasea las reglas de seguridad por defecto, así que no necesitás tocarlas.

---

## Correr manualmente

En GitHub → tu repo → pestaña **Actions** → **Sync QuartzProde Results** → **Run workflow**.

El job `ESPN standings → bracket` corre automáticamente solo el **27 y 28 de junio de 2026** (fin de la Fase de Grupos), o cuando lo lances a mano con **Run workflow**.

También podés correrlo local si tenés Node.js:
```bash
cd scripts
npm install
FIREBASE_SERVICE_ACCOUNT='{ ...contenido del JSON... }' node sync-results.js
# Una sola vez, al cerrar la Fase de Grupos:
FIREBASE_SERVICE_ACCOUNT='{ ...contenido del JSON... }' node sync-bracket.js
```

---

## Notificaciones (opcional)

Si querés recibir un mensaje cuando se guardan resultados nuevos, agregá un secret `NOTIFY_URL` con la URL de un webhook de Slack o Discord, y descomentá la línea correspondiente en `sync.yml`.

---

## Logs

Podés ver el historial de ejecuciones en GitHub → **Actions**. Cada run muestra qué partidos procesó y cuáles guardó.
