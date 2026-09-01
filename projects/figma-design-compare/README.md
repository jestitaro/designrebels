# Design Compare — plugin de Figma + backend

Compara un frame/componente de Figma ("diseño original") contra una captura de
la implementación real, y devuelve un listado de diferencias para pasar a
mano a una smartlist en Jira.

## Estado actual

**En producción.** El backend está desplegado en Render:
`https://designrebels.onrender.com`. El plugin exporta el frame
seleccionado, subís la captura de la implementación, y **Comparar con
backend** le pega de verdad a ese servidor, que llama a Claude (vision) y
devuelve el listado de diferencias en el textarea copiable.

Es el plan free de Render: si no recibe tráfico por 15 minutos se duerme, y
la primera comparación después de eso tarda ~30-50s en responder mientras
arranca de nuevo (el plugin avisa esto en el status mientras espera).

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

## Cómo usarlo

1. Compilar y cargar el plugin en Figma (solo hace falta una vez):

   ```bash
   cd plugin
   npm install
   npm run build   # genera code.js a partir de code.ts
   ```

   En Figma desktop: **Plugins → Development → Import plugin from manifest…**
   apuntando a `plugin/manifest.json`, y correrlo desde
   **Plugins → Development → Design Compare**.

2. En el plugin: seleccionar un frame/componente → **Exportar selección
   actual**, subir la captura de la implementación real, y tocar
   **Comparar con backend**. El resultado aparece en el textarea, listo para
   copiar a una smartlist de Jira.

No hace falta levantar nada en local — el plugin le pega directo al backend
en Render.

## El backend (Render)

Deployado desde la branch `claude/figma-design-implementation-compare-li9fpn`
del repo, con **Root Directory** `projects/figma-design-compare/backend`,
build `npm install && npm run build`, start `npm start`, plan **Free**.

Variables de entorno configuradas en el dashboard de Render (no en el repo):
`ANTHROPIC_API_KEY` y `ANTHROPIC_WORKSPACE_ID`.

Para desarrollar/debuggear el backend en local, ver `backend/README.md` — el
mismo setup con `.env` y `npm run dev` sigue funcionando para probar cambios
antes de pushearlos (Render redeploya solo con cada push a la branch
conectada).

## Pendiente

- Si en algún momento se mergea esta branch a `main`, cambiar la branch que
  Render tiene conectada para que el deploy siga el historial de `main`.
- Evaluar pasar al plan Starter de Render ($7/mes) si el cold-start de 30-50s
  del free tier resulta molesto en el uso diario.
