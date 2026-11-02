# El caso de los tokens desaparecidos

Juego de Halloween estilo Clue para QuartzSales: interrogás a 19 compañeros, juntás pistas, respondés 3 preguntas y hacés la acusación final (quién, cómo y para qué).

- **Estado:** Live · Halloween 2026
- **Stack:** HTML/CSS/JS en un solo archivo. Ranking en Firestore (proyecto `quartzprode2026`, colección `caso_tokens_ranking`, independiente del Prode).
- **Ranking:** cuenta solo la primera partida por persona (doc id = nombre normalizado) y entra si la acusación es 3/3; orden por tiempo y desempate por puntaje. Para resetearlo, borrar la colección desde la consola de Firebase.
- **Publicación:** se sirve desde este repo (GitHub Pages / Cloudflare Pages) en `projects/caso-tokens/`.
- **Ajustes rápidos:** `MIN_INTERVIEWS` y `MIN_CLUES` al inicio del script definen cuánto hay que investigar para avanzar.
