# Design Compare — plugin de Figma + backend

Compara un frame/componente de Figma ("diseño original") contra una captura de
la implementación real, y devuelve un listado de diferencias para pasar a
mano a una smartlist en Jira.

## Estado actual

- **Plugin**: el flujo de exportar + subir archivo está completo y funcional.
  El llamado al backend sigue siendo un **stub** (`compareWithBackend` en
  `plugin/ui.html`) — todavía no está conectado al fetch real.
- **Backend**: `POST /compare` funcional, llama a Claude (vision) y devuelve
  el JSON validado. Falta conectarlo desde el plugin.

## Estructura

```text
plugin/
├── manifest.json   # config del plugin, incluye networkAccess.allowedDomains
├── code.ts         # hilo principal: exporta la selección a PNG
├── ui.html          # UI del plugin (iframe sandboxed, HTML+JS plano)
├── package.json
└── tsconfig.json

backend/
├── src/
│   ├── index.ts     # server Express, endpoint POST /compare
│   └── compare.ts   # llamada a Claude con structured outputs (Zod)
├── package.json
├── tsconfig.json
└── .env.example
```

## Cómo probar el plugin en Figma

1. Instalar dependencias y compilar:

   ```bash
   cd plugin
   npm install
   npm run build   # genera code.js a partir de code.ts
   ```

2. En Figma desktop: **Plugins → Development → Import plugin from manifest…**
   y apuntar a `plugin/manifest.json`.
3. Correr el plugin desde **Plugins → Development → Design Compare**.
4. Seleccionar un frame/componente en el canvas → **Exportar selección actual**.
5. Subir una captura de pantalla de la implementación real desde la compu.
6. Con ambas imágenes cargadas se habilita **Comparar con backend** (por ahora
   usa el stub y muestra data de ejemplo).

## Cómo probar el backend

Ver `backend/README.md` — setup, endpoint, y ejemplos de curl para probarlo
de forma aislada antes de conectar el plugin.

## Pendiente para la próxima etapa

- Reemplazar el dominio placeholder en `plugin/manifest.json` →
  `networkAccess.allowedDomains` por el dominio real del backend (HTTPS
  requerido; para desarrollo local usar `devAllowedDomains` + ngrok o un
  túnel HTTPS).
- Conectar `compareWithBackend()` en `plugin/ui.html` al fetch real contra
  `POST /compare`.
