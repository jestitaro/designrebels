# QS League

MVP interno gamer para DinoCoins, Kahoots, equipos y desafíos.

## Incluye

- Login local MVP.
- Dashboard responsive.
- Ranking grupal e individual.
- Podio con oro, plata y bronce.
- Conexión MVP con Kahoot por reporte exportado.
- Importador XLSX/CSV de reportes de Kahoot.
- Detección de hoja `Final Scores`, `Scores`, `Raw data` o similar.
- Mapeo de nicknames contra participantes reales.
- Resumen de importación: participantes detectados, mapeados, sin mapear y hoja usada.
- Descarga de CSV demo para probar el flujo.
- Reglas iniciales: oro +3, plata +2, bronce +1.
- Estado en `localStorage` para validar UX antes de conectar backend.

## Flujo Kahoot

1. Jugar el Kahoot.
2. Descargar el reporte desde Kahoot Reports.
3. Subir el `.xlsx` o `.csv` en la pantalla `Kahoot`.
4. Revisar el preview.
5. Mapear manualmente los nicknames no detectados.
6. Aplicar puntos.

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

Para conexión automática directa con Kahoot API harían falta credenciales y acceso API habilitado en la cuenta de Kahoot. Hasta entonces, el flujo confiable es exportar reporte y subirlo.
