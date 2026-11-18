# ESC · Juegos de pausa de QuartzSales

Publicado en `projects/esc/`.

Landing con seis juegos cortos que cambian todos los días, ranking compartido y recordatorio de calendario.

| Juego | Mecánica | Ranking |
|---|---|---|
| Ruta | Unir números en orden pasando por todas las celdas (tipo Zip) | Primera partida del día, por tiempo |
| Góndola | Un producto por fila, columna y sección, sin tocarse (tipo Queens) | Primera partida del día, por tiempo |
| Equilibrio | Mate y café, 3 y 3 por fila/columna, sin tres seguidos, `=` y `×` (tipo Tango) | Primera partida del día, por tiempo |
| Sudoku | Mini sudoku 6×6 con cajas de 2×3 | Primera partida del día, por tiempo |
| Teclazo | Adaptación de ZType con vocabulario de retail y QuartzSales; dispara la Q | Mejor puntaje del día |
| Pasala | El cliente manda un pedido y el equipo se lo pasa por áreas en orden, sin que toque el piso | Mejor puntaje del día |

El organigrama que usa Pasala está en `assets/games/pasala.js` (`AREAS`): para sumar personas o áreas alcanza con editar esa lista.

## Cómo funciona

- **Tablero del día:** cada puzzle sale de una semilla `fecha:juego` (hora de Buenos Aires), así que todo el mundo juega el mismo. Góndola, Equilibrio y Sudoku se generan con solución única.
- **Ranking:** Firestore del proyecto `quartzprode2026` (el mismo de *El caso de los tokens*), colección `esc_scores`. Doc id `fecha__juego__jugador`. La lectura filtra por `date == hoy`.
- **Local:** jugador, resultados y racha en `localStorage` (`esc.v1`).
- **Recordatorio:** link a Google Calendar con `RRULE` semanal y descarga `.ics` (Outlook / Apple) con alarma al inicio.
- **Hero:** piezas con física real (Matter.js, vendorizado igual que en Talent Lab), abanico de cards y la mascota Cuarzo.

## Reglas de Firestore

Si las reglas del proyecto limitan colecciones, hay que sumar `esc_scores` (lectura pública; create sin update para puzzles; update solo si `value` sube para `teclazo`).

## Archivos

```
index.html
assets/styles.css
assets/core.js        semilla, PRNG, guardado local, ranking
assets/app.js         launcher, overlay de juego, Hoy, ranking, recordatorio
assets/hero.js        física, mascota, etiquetas de gente jugando
assets/games/*.js     un archivo por juego (generate + mount)
assets/vendor/        matter.min.js (MIT)
```
