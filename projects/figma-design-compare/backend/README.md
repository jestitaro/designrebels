# Design Compare — backend

Backend Node/Express con un único endpoint `POST /compare`: recibe el diseño
original y la captura de la implementación (ambos en base64) y le pide a
Claude (vision) que devuelva un listado estructurado de diferencias.

## Setup

```bash
npm install
cp .env.example .env   # completar ANTHROPIC_API_KEY
npm run dev             # levanta en http://localhost:3000 con nodemon
```

## Endpoint

`POST /compare`

```json
{
  "originalImage": "<base64 PNG/JPEG>",
  "implementedImage": "<base64 PNG/JPEG>"
}
```

Respuesta (`200`):

```json
{
  "diffs": [
    {
      "description": "El botón CTA usa azul #2563eb en vez del #6366f1 del diseño",
      "location": "header, botón CTA superior derecho",
      "type": "visual"
    }
  ]
}
```

- `400` — body inválido (falta `originalImage` o `implementedImage`).
- `502` — Claude no devolvió un resultado válido, o rechazó la solicitud.

El JSON se fuerza vía **structured outputs** de la API de Claude (`output_config.format`
con un schema de Zod), y se revalida con el mismo schema del lado del servidor
antes de responder — no depende de que el modelo "se porte bien" con el prompt.

## Probar con curl (sin el plugin)

1. Necesitás dos imágenes de prueba en base64 puro (sin el prefijo `data:image/png;base64,`).
   Por ejemplo, a partir de dos PNG locales:

   ```bash
   ORIGINAL=$(base64 -w0 diseño.png)      # macOS: base64 -i diseño.png | tr -d '\n'
   IMPLEMENTADO=$(base64 -w0 captura.png)
   ```

2. Armá el JSON y mandalo al endpoint:

   ```bash
   jq -n --arg original "$ORIGINAL" --arg implementado "$IMPLEMENTADO" \
     '{originalImage: $original, implementedImage: $implementado}' \
     > /tmp/compare-payload.json

   curl -s -X POST http://localhost:3000/compare \
     -H "Content-Type: application/json" \
     -d @/tmp/compare-payload.json | jq
   ```

   (Si no tenés `jq`, armá el JSON a mano — ojo que el base64 no debe llevar saltos de línea.)

3. Chequeo rápido de que el server está arriba, sin gastar tokens:

   ```bash
   curl -s http://localhost:3000/health
   ```

4. Para simular un body inválido y confirmar el manejo de errores:

   ```bash
   curl -s -X POST http://localhost:3000/compare -H "Content-Type: application/json" -d '{}'
   ```

## Notas

- CORS está abierto (`cors()` sin restricciones) porque el plugin de Figma
  corre en un iframe sandboxed que manda `Origin: null`. Para un despliegue
  público conviene restringirlo a los orígenes que realmente necesites.
- El límite del body JSON está en 20mb para dar margen a capturas grandes.
- El detector de tipo de imagen mira los primeros bytes (magic numbers) y
  soporta PNG y JPEG — son los dos formatos que el plugin puede producir.
