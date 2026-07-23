# Dino Cup (ex QS League)

Landing interna de QuartzSales para llevar el ranking de los Kahoots de equipo. Sin login: entra directo a la landing.

Rebrandeada el 23/07/2026 a partir de un front-end propio armado con ChatGPT (mismo repo, mismos datos de la temporada actual): se reordenó el código duplicado/sin usar y se le conectó la funcionalidad real de carga de informes y ajustes manuales, manteniendo el visual tal cual se recibió.

## Arquitectura

Cuatro archivos, sin capas de parches:

- `index.html` — landing de una sola página (hero con podio, features con modales de Reglamento / Campeones / Resultados parciales, y el modal de carga de informe).
- `assets/styles.css` — un solo stylesheet.
- `assets/app.js` — un solo módulo. El ranking nunca se muta a mano: `computeStandings()` recalcula puntos y medallas desde `state.imports` + `state.manual` cada vez que se pinta la pantalla, así no hace falta reconciliar nada entre sesiones.
- `assets/firebase.js` — conexión a Firestore (ver "Persistencia" abajo).

Las reglas de negocio (puntaje, moderador, ausencias, ajustes, desafíos 1v1, desempate, etc.) están documentadas en `REGLAS.md` y son la fuente de verdad; el modal "Reglamento oficial" de la landing es el resumen para los participantes.

## Persistencia

Los informes, el ledger manual y los jugadores nuevos se guardan en Firestore, reusando el mismo proyecto Firebase que QuartzProde (`quartzprode2026`), en su propia colección (`qsleague_state`, doc `season02`) para no tocar los datos de Prode. Cualquiera que entre a la página ve el mismo estado, y se actualiza en vivo (`onSnapshot`) si otra persona carga un informe o hace un ajuste desde otro dispositivo.

`localStorage` se mantiene como cache local: pinta al instante mientras carga Firestore, y sirve de respaldo si no hay red — si la sincronización falla, el cambio queda guardado localmente y avisa con un toast.

## Flujo de un informe de Kahoot

1. Abrí **Cargar resultados**, elegí el **moderador de la fecha** (obligatorio: no compite, no suma y no cuenta como ausente) y la fecha de la sesión.
2. Arrastrá o seleccioná el XLSX/CSV que exporta Kahoot Reports. El parser reconoce nickname/puntaje/puesto aunque el formato del export varíe, y mapea cada nickname contra el roster oficial y sus alias.
3. Si alguien faltó, agregalo en **Descuento por ausencias** (botón "Agregar ausencia") y elegí el descuento: -1 punto (avisó) o -3 puntos (sin aviso). Es un paso manual, no se auto-detecta contra el roster.
4. Si la fecha ya estaba cargada, el sistema avisa antes de aplicarla de nuevo para evitar duplicar puntos.
5. Al aplicar: se excluye al moderador y se recalcula el podio real de la fecha, 1°/2°/3° reciben +3/+2/+1 puntos, los descuentos por ausencia se restan, y todo queda guardado (Firestore + localStorage).

## Cargar un descuento sin subir informe

Los descuentos por ausencia se cargan siempre junto con un informe (ver arriba). No hay todavía un formulario aparte para cargar un ajuste manual sin subir un Kahoot — está anotado como pendiente en `REGLAS.md` §19.

## Columnas soportadas por el importador

- Nickname / Player / Name / Nombre / Participante / Jugador / Identifier / Email.
- Score / Points / Puntos / Puntaje / Total Score / Current Total.
- Rank / Puesto / Position / Ranking / Place.
- Correct / Correctas / Correct Answers.

## Próximo paso

Firebase Auth si en algún momento vuelve a hacer falta login. Por ahora Dino Cup entra directo, igual que hoy. Un formulario de ajuste manual standalone (para cargar/quitar puntos sin subir un informe) sigue pendiente — ver `REGLAS.md` §19.
