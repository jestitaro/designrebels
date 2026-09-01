# Design Compare — plugin de Figma

Compara un frame/componente de Figma ("diseño original") contra una captura de
la implementación real, y devuelve un listado de diferencias para pasar a
mano a una smartlist en Jira.

## Estado actual

Esqueleto del plugin únicamente. El flujo de exportar + subir archivo está
completo y funcional; el llamado al backend es un **stub** (`compareWithBackend`
en `plugin/ui.html`) que devuelve data de ejemplo sin pegarle a ningún
servidor todavía. El backend Node/Express con la llamada a la API de Claude
(vision) es la siguiente etapa.

## Estructura

```text
plugin/
├── manifest.json   # config del plugin, incluye networkAccess.allowedDomains
├── code.ts         # hilo principal: exporta la selección a PNG
├── ui.html          # UI del plugin (iframe sandboxed, HTML+JS plano)
├── package.json
└── tsconfig.json
```

## Cómo probarlo en Figma

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

## Pendiente para la próxima etapa

- Backend Node/Express con endpoint `POST /compare` que reciba `design` e
  `implementation` en base64 y llame a la API de Claude (vision) pidiendo
  JSON con schema fijo: `{ diffs: [{ description, location, type }] }`.
- Reemplazar el dominio placeholder en `manifest.json` →
  `networkAccess.allowedDomains` por el dominio real del backend (HTTPS
  requerido; para desarrollo local usar `devAllowedDomains` + ngrok o un
  túnel HTTPS).
- Conectar `compareWithBackend()` en `ui.html` al fetch real.
