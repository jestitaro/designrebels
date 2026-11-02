# Dino Cup (ex QS League)

Landing pública de QuartzSales para seguir el ranking de los Kahoots de equipo, sin login. Todo lo que modifica puntos (cargar resultados, aplicar descuentos, anular) vive detrás de un panel administrativo separado, con acceso discreto desde el footer.

Rebrandeada el 23/07/2026 a partir de un front-end propio armado con ChatGPT (mismo repo, mismos datos de la temporada actual). El 23/07/2026 también se separó la experiencia pública de las acciones administrativas y se migró la persistencia de un blob único en `localStorage`/Firestore a un modelo real de datos (roster + cargas + ledger de movimientos) en Firestore, con Firebase Authentication protegiendo cada escritura.

## Arquitectura

Sin capas de parches, un archivo por responsabilidad:

- `index.html` — landing pública (hero con podio, features con modales de Reglamento / Campeones / Resultados parciales, próximamente) + los modales de login y panel administrativo.
- `assets/styles.css` — un solo stylesheet; la sección de admin reutiliza los mismos tokens (cyan/violeta/magenta, Press Start 2P, modales, scrollbar) y solo agrega lo que la landing pública no tenía (tabs, tablas, chips de estado).
- `assets/roster.js` — roster/casas/alias y helpers de formato (`fmt`, `fmtPoints`, `longDate`), compartido por `app.js` y `admin.js`.
- `assets/kahoot-parser.js` — parseo de XLSX/CSV de Kahoot + hash del archivo (para detectar duplicados), compartido por ambos.
- `assets/firebase.js` — conexión a Firebase (Auth + Firestore + Storage), expuesta como `window.DinoCupFirebase`. Es la única puerta de entrada a la base: define qué se puede leer/escribir desde el resto del código.
- `assets/app.js` — **solo lectura**. Se suscribe a `dinocup_players` y a los `dinocup_movements` con estado `APPLIED`, y calcula podio / resultados parciales / actividad reciente en el cliente. No escribe nada en Firestore.
- `assets/admin.js` — **todo lo que escribe**. Login, panel protegido, wizard de carga, descuentos, historial y anulaciones. Nunca se importa desde `app.js`.

Las reglas de negocio (puntaje, moderador, ausencias, ajustes, desafíos 1v1, desempate, etc.) están documentadas en `REGLAS.md` y son la fuente de verdad; el modal "Reglamento oficial" de la landing es el resumen para los participantes. El modelo de datos completo (colecciones, tipos de movimiento, estados) está en `REGLAS.md` §19.

## Acceso administrativo

Un enlace "Admin" al final del footer (misma tipografía que el resto del footer, sin competir con la navegación pública):

- Sin sesión → abre un modal de login (email, contraseña, botón "Ingresar", estado de carga, mensaje de error).
- Con sesión de administrador → abre directo el panel.

Hay un único rol (`ADMIN`), verificado contra `dinocup_users/{uid}.role` — ese documento nunca se escribe desde el cliente, así nadie puede otorgarse permisos desde el navegador. Un administrador se da de alta a mano: se crea el usuario en Firebase Authentication y se crea su doc en `dinocup_users` con `role: "ADMIN"` (consola de Firebase o Admin SDK).

El panel tiene cuatro secciones + cerrar sesión: **Resumen**, **Cargar resultados**, **Aplicar descuentos**, **Movimientos**.

## Persistencia

Todo (roster, cargas, ledger) vive en Firestore, en un proyecto Firebase propio y exclusivo de Dino Cup (`dino-cup`, sin compartir base con QuartzProde ni con la `qsleague_state` vieja), en las colecciones `dinocup_users`, `dinocup_players`, `dinocup_matches`, `dinocup_movements`. Cualquiera que entre a la página ve el mismo estado, y se actualiza en vivo si un administrador carga un informe o hace un ajuste desde otro dispositivo.

El archivo original de cada informe se guarda en Firebase Storage (`dinocup_reports/{matchId}/...`), descargable solo por administradores desde el detalle de una carga.

**El ranking nunca se calcula desde un total guardado en el jugador**: se recalcula sumando los `dinocup_movements` con estado `APPLIED` cada vez que se pinta la pantalla. Un total cacheado es solo una optimización futura, nunca la fuente de verdad.

## Flujo de un informe de Kahoot (panel → Cargar resultados)

Wizard de 3 pasos:

1. **Datos**: moderador de la fecha (obligatorio: no compite, no suma y no cuenta como ausente), fecha de la sesión, archivo XLSX/XLS/CSV. El nombre de la fecha se detecta automáticamente del archivo; no hay un input manual para escribirlo. Se calcula un hash del archivo para detectar duplicados y se guarda el archivo original.
2. **Descuentos opcionales**: cero, una o varias personas ausentes, cada una con persona + descuento (-1 avisó / -3 sin aviso) + motivo (obligatorio). No se puede repetir la misma persona dos veces.
3. **Vista previa**: sin tocar todavía la clasificación. Muestra nombre detectado, fecha, moderador, archivo, posiciones y puntos a asignar, descuentos, personas que no pudieron relacionarse con el roster, y una advertencia si ya existe un informe aplicado para esa fecha o ese mismo archivo (bloquea "Confirmar y aplicar" hasta revisar la carga anterior).

Al confirmar: se excluye al moderador, se recalcula el podio real de la fecha, se crean los movimientos `REPORT_RESULT` (+3/+2/+1) y `ABSENCE_PENALTY` en un solo batch de Firestore junto con el match en estado `APPLIED` — si algo falla, el match queda en estado `ERROR` con el motivo guardado y no se aplica ningún punto parcial.

## Aplicar descuentos sin subir un informe

Acción separada en el panel ("Aplicar descuentos"): una o varias filas de persona + descuento + motivo + fecha, con vista previa antes de confirmar. Crea movimientos `ABSENCE_PENALTY` con `sourceType: "MANUAL_PENALTY"`, sin crear ningún match.

## Historial y anulaciones

- **Historial de cargas** (dentro de "Cargar resultados"): filtros por fecha/moderador/estado/administrador, detalle con archivo original descargable, movimientos generados y motivo de anulación si corresponde. "Anular carga" muestra exactamente qué se va a revertir, pide motivo obligatorio, y crea un movimiento `REPORT_REVERSAL`/`PENALTY_REVERSAL` por cada movimiento activo relacionado (nunca se borra nada, solo se marca `ANNULLED`).
- **Movimientos**: el ledger completo con filtros (tipo/jugador/fecha/estado/administrador). Cada descuento `APPLIED` tiene su "Anular descuento", con motivo obligatorio, que crea un `PENALTY_REVERSAL` inverso.

Para corregir un movimiento (p. ej. cambiar un -1 por un -3) no se edita: se anula el original y se carga uno nuevo.

## Columnas soportadas por el importador

- Nickname / Player / Name / Nombre / Participante / Jugador / Identifier / Email.
- Score / Points / Puntos / Puntaje / Total Score / Current Total.
- Rank / Puesto / Position / Ranking / Place.
- Correct / Correctas / Correct Answers.

## Seguridad

`firestore.rules` y `storage.rules` (en la raíz de este proyecto) definen: lectura pública de `dinocup_players`/`dinocup_matches`/`dinocup_movements`, escritura solo para usuarios autenticados con `role: ADMIN`, sin deletes físicos desde el cliente, y `dinocup_users` de solo lectura (nunca escribible desde el navegador). El archivo original de cada informe en Storage es de lectura/escritura solo para administradores, con límite de tamaño y validación de tipo.

`firestore.rules` y `storage.rules` son rulesets completos e independientes para el proyecto `dino-cup` (que no aloja ninguna otra app) — se despliegan tal cual, sin fusionar con nada. `.firebaserc` ya apunta el proyecto default a `dino-cup`, así que `firebase deploy --only firestore:rules,storage` alcanza.

## Pendiente

Ver `REGLAS.md` §20: formulario de ajuste manual "genérico" (sumar puntos sueltos, no solo descuentos por ausencia), exportación de ranking, administración de roster/alias desde el panel, cierre de temporada hacia Leyendas.
