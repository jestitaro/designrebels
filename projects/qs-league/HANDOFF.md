# Dino Cup — Handoff (para arrancar un chat nuevo)

Este documento es un resumen de todo lo que se construyó en `projects/qs-league` para que, si empezás una conversación nueva con Claude, no haga falta re-explicar el contexto. Para el detalle técnico permanente (arquitectura, modelo de datos, reglas del juego) la fuente de verdad sigue siendo `README.md` y `REGLAS.md` en esta misma carpeta — este archivo es más bien la "historia" y el estado actual.

## Qué es esto

Landing de QuartzSales para el ranking de los Kahoots de equipo ("Dino Cup"). Empezó como una landing GPT-armada desprolija ("QS League"), se reconstruyó por completo con estética retro-synthwave, y terminó con un panel administrativo completo detrás de login, separado de la landing pública.

## Estado actual (24/07/2026)

- **En producción y funcionando**: hay una sesión real (`jesica.titaro@e-saurio.com`) logueada como admin, cargando resultados y viéndose reflejados en Firestore correctamente. Auth + Firestore + el usuario ADMIN ya están configurados en el proyecto Firebase real.
- **Sin confirmar**: si Storage está habilitado en el proyecto `dino-cup`. El upload del archivo original tiene un timeout de 8s y sigue funcionando aunque Storage falle (ver sección "Decisiones técnicas"), así que no es bloqueante, pero la descarga del archivo original desde "Historial de cargas" puede no andar hasta confirmarlo.
- **Reglas de Firestore/Storage**: `firestore.rules` y `storage.rules` están en el repo listos para desplegar tal cual (rulesets completos e independientes, `dino-cup` no aloja nada más). No tengo confirmación de que se hayan desplegado — dado que las escrituras funcionan, probablemente sí, pero vale la pena chequear `firebase deploy --only firestore:rules,storage` si algo de permisos falla.

## Arquitectura (resumen — detalle completo en README.md)

```
projects/qs-league/
├── index.html              landing pública + modales (login, panel admin, reglas, campeones, resultados)
├── firebase.json            apunta a firestore.rules / storage.rules
├── .firebaserc               proyecto default: dino-cup
├── firestore.rules          reglas completas del proyecto dino-cup
├── storage.rules            reglas completas del proyecto dino-cup
├── README.md                 arquitectura + flujos, actualizado
├── REGLAS.md                  reglas de negocio + modelo de datos, fuente de verdad
├── HANDOFF.md                 este archivo
└── assets/
    ├── roster.js              roster, casas, alias, helpers de formato (fmt/fmtPoints/longDate) — compartido
    ├── kahoot-parser.js       parseo XLSX/CSV + hash de archivo — compartido
    ├── firebase.js            Auth + Firestore + Storage (compat SDK) — window.DinoCupFirebase
    ├── app.js                  SOLO LECTURA — landing pública, nunca escribe en Firestore
    ├── admin.js                TODO LO QUE ESCRIBE — login, panel, wizard, historial, anulaciones
    ├── styles.css              un solo stylesheet (retro synthwave: violeta/cian/magenta, Press Start 2P)
    └── logo-dino-cup.png
```

Separación estricta: `app.js` (público) nunca importa ni llama a `admin.js`. Todo lo que modifica puntos vive en `admin.js`, detrás de sesión.

## Modelo de datos (Firestore, proyecto `dino-cup`)

```
dinocup_users      {uid, email, role, displayName, createdAt} — solo lectura desde el cliente, nunca escribible
dinocup_players    roster — se siembra una sola vez al primer login admin
dinocup_matches    una carga por informe Kahoot (DRAFT→PROCESSING→APPLIED/ERROR/ANNULLED)
dinocup_movements  el ledger real (REPORT_RESULT/ABSENCE_PENALTY/REPORT_REVERSAL/PENALTY_REVERSAL)
```

El ranking **nunca** se lee de un total cacheado — siempre se recalcula sumando `dinocup_movements` con `status: APPLIED`. Anular una carga o un meteorito no borra nada: crea un movimiento inverso y marca el original `ANNULLED`.

## Acceso admin

- Un rol único: `ADMIN`, verificado contra `dinocup_users/{uid}.role`.
- Ese doc **nunca se escribe desde el cliente** — un admin se da de alta a mano (Firebase console: crear usuario en Authentication + crear su doc en `dinocup_users` con `role: "ADMIN"`).
- Entrada: link "Admin" en el header Y en el footer (antes solo estaba en el footer, se agregó al header a pedido). Si hay sesión activa, ambos links se ponen verdes con un puntito — así si volvés a la landing sin cerrar sesión, se nota que seguís logueado.
- El panel es una **página completa** (no un modal) con su propio header, tabs (Resumen / Cargar resultados / Aplicar meteoritos / Movimientos) y "Volver al sitio" + "Cerrar sesión" agrupados arriba a la derecha con distinto peso visual (Volver = sutil, Cerrar sesión = magenta marcado).

## Terminología (importante, es una decisión deliberada)

Dentro del **panel admin** se usa "meteorito" (no "descuento") y "DinoCoins" (no "puntos") — vía un helper `fmtCoins()` en `admin.js`, separado del `fmtPoints()` compartido en `roster.js`.

La **landing pública** y el texto guardado en `movement.reason` (el que alimenta la actividad reciente) siguen diciendo "puntos" — porque hay un spec exacto anterior en esta sesión que pedía ese formato literal ("+3 puntos"). Es una inconsistencia deliberada, no un olvido: si en algún momento se pide unificarlo, hay que decidir conscientemente si el texto guardado en Firestore (compartido entre admin y público) pasa a decir "DinoCoins" en los dos lados.

## Flujo de carga de un informe (wizard de 3 pasos)

1. **Datos**: se arrastra/selecciona el archivo PRIMERO. Al seleccionarlo se parsea al toque y se intenta detectar automáticamente la fecha (patrones numéricos DD/MM/YYYY, YYYY-MM-DD, o "23 de julio 2026" con nombre de mes) y el moderador (matcheando tokens del nombre de archivo contra el roster y sus alias). Si no se detecta el moderador, aparece el dropdown como fallback; si se detecta, se puede igual tocar "Cambiar".
2. **Meteoritos** (opcional): cada fila tiene Persona / Meteorito (-1 o -3) / Motivo. Mientras se edita una fila sin guardar, el botón es un check ("Guardar"); una vez guardada se colapsa a un resumen compacto con Editar/Eliminar. Filas totalmente vacías se descartan solas al avanzar, no bloquean.
3. **Vista previa**: muestra resultados detectados, meteoritos, personas sin relacionar, y bloquea si detecta una carga duplicada (mismo hash de archivo o misma fecha ya aplicada).

Al confirmar: se excluye al moderador del cálculo, se recalcula el podio real de la fecha, y todo se aplica en un batch de Firestore. Todas las llamadas a Firebase en el flujo de aplicar/anular tienen timeout (8-15s) para que nunca se quede colgado en "Aplicando..." si Storage u otra llamada no responde.

## Bugs reales encontrados y arreglados en esta sesión (por si vuelven a aparecer)

- **Race condition de login**: `signIn()` hacía su propia consulta de rol pero devolvía el user crudo de Firebase; el panel dependía de un listener separado (`onAuthStateChanged`) con su propia consulta async para saber que había sesión — a veces el panel se abría antes de que ese listener terminara, mostrando "Sesión no autorizada". Se arregló haciendo que `signIn()` devuelva la sesión ya resuelta y que el login la use directo.
- **Estilos rotos al convertir el panel de modal a página completa**: muchos selectores CSS (`label`, `input`, `select`, dropzone) estaban scopeados a `.modal-panel`; al dejar de ser modal, se rompieron. Se agregó `.admin-view` como scope alternativo.
- **Botones desalineados entre pasos del wizard**: `.modal-submit` traía un `margin-left:auto` viejo (pensado para un solo botón) que peleaba con el `justify-content:flex-end` del contenedor de acciones, separando "Cancelar" de "Siguiente" en unos pasos sí y en otros no.
- **Grid roto al agregar el campo Motivo**: `.absence-row` se quedó con el ancho de columnas viejo (2 campos) cuando se agregó un tercer/cuarto campo, así que Motivo (y en el flujo standalone, también Fecha) se aplastaban o se iban a una segunda fila.
- **Alias de apodos incorrectos**: "Heroe" estaba mal asignado a Pablo (en vez de a Agustín) y el apodo real de Pablo ("Tuki") no estaba cargado. Se reemplazó toda la lista de alias por la lista real que pasó el equipo.
- **"Confirmar y aplicar" se quedaba colgado**: si Storage no está aprovisionado en el proyecto, la llamada podía quedarse esperando en vez de fallar rápido. Se envolvieron todas las llamadas a Firebase del panel en un timeout.
- **Filas de meteorito vacías bloqueaban avanzar**: agregar una fila con "Agregar ausencia" y no completarla obligaba a borrarla a mano. Ahora se descarta sola si queda vacía; solo bloquea si tiene datos parciales.
- **UX de guardar/eliminar poco clara**: se agregó un estado explícito de "editando" (botón check/Guardar) vs "guardada" (resumen compacto + Editar/Eliminar), en vez de mostrar siempre el tacho de basura.

## Metodología de testing usada en esta sesión

Esta sandbox bloquea la salida de red hacia `gstatic.com`/`unpkg.com`/`cdn.jsdelivr.net`, así que Firebase real, Lucide y SheetJS no cargan acá. Para poder probar el panel admin de punta a punta sin depender de la red, se armó un `stub-firebase.js` de prueba (solo en el scratchpad de la sesión, nunca en el repo) que imita exactamente la forma de `window.DinoCupFirebase`, incluyendo delays deliberados para simular la latencia real de Auth→Firestore y detectar race conditions. Si se abre un chat nuevo y hay que verificar algo end-to-end sin acceso a internet real, ese es el patrón a repetir: copiar los assets a un directorio temporal, reemplazar los `<script>` de Firebase/Lucide/XLSX por un stub local, y servir con `python3 -m http.server`.

## Pendiente (ver también REGLAS.md §20)

- Formulario de ajuste manual "genérico" (sumar DinoCoins sueltos, no solo restar por ausencia).
- Exportación de ranking.
- Administración de roster/alias desde el panel (hoy el roster se siembra una sola vez desde `assets/roster.js` y no se puede editar desde la UI).
- Cierre de temporada (mandar Arena actual a Leyendas).
- Confirmar si Storage está habilitado en el proyecto `dino-cup` y si las reglas ya se desplegaron.
- Decidir si el texto de "actividad reciente" (`movement.reason`, dice "puntos") se unifica con el resto del panel admin (que dice "DinoCoins").

## Dónde mirar si algo se rompe

- **No abre el panel / login falla**: revisar `assets/firebase.js` (config de `dino-cup`) y que exista el doc `dinocup_users/{uid}` con `role: "ADMIN"`.
- **El ranking público no se actualiza**: `assets/app.js`, función `computeStandings()` — se suscribe a `dinocup_players` + `dinocup_movements` (solo `APPLIED`).
- **Algo del wizard de carga**: todo vive en `assets/admin.js`, buscar `uploadWizard` (el estado) y `confirmWizardApply` (la aplicación final).
- **Terminología o roster**: `assets/roster.js` (ROSTER, alias, casas) y las constantes al principio de `assets/admin.js` (`DISCOUNT_OPTIONS`, `fmtCoins`).
