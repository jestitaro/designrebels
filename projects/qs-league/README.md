# QS League

MVP interno gamer para DinoCoins, Kahoots, equipos y desafíos.

## Incluye

- Login local MVP.
- Dashboard responsive.
- Ranking grupal e individual.
- Podio con oro, plata y bronce.
- Conexión MVP con Kahoot por reporte exportado.
- Importador XLSX/CSV de reportes de Kahoot.
- Importación en lote: se pueden seleccionar varios reportes a la vez.
- Detección de hoja `Final Scores`, `Scores`, `Raw Report Data`, `Raw data` o similar.
- Detección de encabezados aunque Kahoot ponga el título del reporte en las primeras filas.
- Mapeo de nicknames contra participantes reales.
- Resumen de importación: reportes detectados, participantes, mapeados y sin mapear.
- Descarga de CSV demo para probar el flujo.
- Reglas iniciales: oro +3, plata +2, bronce +1 por cada reporte.
- Estado en `localStorage` para validar UX antes de conectar backend.

## Flujo Kahoot

1. Jugar el Kahoot.
2. Descargar cada reporte desde Kahoot Reports.
3. Seleccionar varios `.xlsx` o `.csv` juntos en la pantalla `Kahoot`.
4. Revisar el preview agrupado por reporte.
5. Mapear manualmente los nicknames no detectados.
6. Aplicar puntos. Cada reporte reparte su propio oro, plata y bronce.

Columnas soportadas por el importador:

- Nickname / Player / Name / Nombre / Participante / Jugador / Identifier / Email.
- Score / Points / Puntos / Puntaje / Total Score / Current Total.
- Rank / Puesto / Position / Ranking / Place.
- Correct / Correctas / Correct Answers.

## Próximo paso

Conectar Firebase Auth + Firestore como en Prode:

- `users`
- `teams`
- `kahoot_sessions`
- `coin_ledger`
- `challenges`
- `absences`
- `survival_tokens`

Para conexión automática directa con Kahoot API harían falta credenciales y acceso API habilitado en la cuenta de Kahoot. Hasta entonces, el flujo confiable es exportar reportes y subirlos en lote.
