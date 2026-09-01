# Design Compare — plugin de Figma + backend

Compara un frame/componente de Figma ("diseño original") contra una captura de
la implementación real, y devuelve un listado de diferencias para pasar a
mano a una smartlist en Jira.

## Estado actual

Flujo completo funcionando end-to-end en local: el plugin exporta el frame
seleccionado, subís la captura de la implementación, y **Comparar con
backend** le pega de verdad a `POST /compare`, que llama a Claude (vision) y
devuelve el listado de diferencias en el textarea copiable.

Falta únicamente desplegar el backend a un dominio real (hoy solo corre en
`localhost:3000`, apto para desarrollo).

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

## Cómo probarlo completo

1. Levantar el backend (ver `backend/README.md` para el setup con
   `ANTHROPIC_API_KEY` y, si hace falta, `ANTHROPIC_WORKSPACE_ID`):

   ```bash
   cd backend
   npm install
   cp .env.example .env   # completar las keys
   npm run dev             # localhost:3000
   ```

2. Compilar y cargar el plugin en Figma:

   ```bash
   cd plugin
   npm install
   npm run build   # genera code.js a partir de code.ts
   ```

   En Figma desktop: **Plugins → Development → Import plugin from manifest…**
   apuntando a `plugin/manifest.json`, y correrlo desde
   **Plugins → Development → Design Compare**.

3. En el plugin: seleccionar un frame/componente → **Exportar selección
   actual**, subir la captura de la implementación real, y tocar
   **Comparar con backend**. El resultado aparece en el textarea, listo para
   copiar a una smartlist de Jira.

## Pendiente para producción

- Desplegar el backend a un dominio propio (HTTPS) y actualizar:
  - `plugin/manifest.json` → `networkAccess.allowedDomains` con ese dominio.
  - `BACKEND_URL` en `plugin/ui.html` (hoy apunta a `http://localhost:3000/compare`).
- `devAllowedDomains` en el manifest ya cubre el desarrollo local — no hace
  falta ngrok mientras se prueba en la misma máquina donde corre el backend.
