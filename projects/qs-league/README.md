# QS League · DinoCoin Arena

Landing interna de QuartzSales para llevar el ranking de los Kahoots de equipo. Sin login: entra directo a la arena.

## Arquitectura

Tres archivos, sin capas de parches:

- `index.html` — landing de una sola página (hero, podio, ranking, subir informe, ajuste manual, y un bloque "Más" con actividad completa / leyendas / reglas).
- `assets/styles.css` — un solo stylesheet.
- `assets/app.js` — un solo módulo. El ranking nunca se muta a mano: `computeStandings()` recalcula coins, medallas y meteoritos desde `state.imports` + `state.manual` cada vez que se pinta la pantalla, así no hace falta reconciliar nada entre sesiones.

Las reglas de negocio (puntaje, moderador, ausencias, ajustes) están documentadas en `REGLAS.md` y son la fuente de verdad.

## Flujo de un informe de Kahoot

1. Elegí el **moderador de la fecha** (obligatorio: no compite, no suma y no cuenta como ausente).
2. Arrastrá o seleccioná el XLSX/CSV que exporta Kahoot Reports.
3. Revisá el preview: mapeo de nicknames contra el roster oficial, alta de personas nuevas si Kahoot trae a alguien no reconocido, y opción de ignorar una fila (invitados, filas basura).
4. Si Kahoot detecta ausentes del roster oficial (excluyendo al moderador), hay que clasificar cada ausencia como "avisó 24 h antes" (-1 DinoCoin) o "sin aviso" (-3 DinoCoins). Todas suman +1 meteorito.
5. Si el nombre de la fecha ya está cargado, hay que tildar explícitamente que se quiere cargar igual.
6. Al aplicar, 1°/2°/3° reciben +3/+2/+1 DinoCoins y la arena se actualiza con confetti.

## Cargar un meteorito sin subir informe

La sección **Ajuste manual** permite cargar (o quitar) un meteorito o DinoCoins sueltos a cualquier persona directamente desde la landing, siempre con motivo obligatorio. Sirve para faltas que se resuelven antes de que salga el próximo informe.

## Columnas soportadas por el importador

- Nickname / Player / Name / Nombre / Participante / Jugador / Identifier / Email.
- Score / Points / Puntos / Puntaje / Total Score / Current Total.
- Rank / Puesto / Position / Ranking / Place.
- Correct / Correctas / Correct Answers.

## Próximo paso

Conectar Firebase Auth + Firestore como en Prode (`users`, `kahoot_sessions`, `coin_ledger`, `absences`) para reemplazar `localStorage` y compartir el estado entre todos los que entran a la liga.
