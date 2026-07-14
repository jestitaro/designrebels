# QuartzSales Marketing Dashboard

Proyecto independiente del monorepo `designrebels`.

## Ruta del proyecto

`projects/quartzsales-marketing-dashboard/`

Todo el código del dashboard debe quedar autocontenido dentro de esta carpeta.

## Estructura esperada

- `index.html`
- `css/`
- `js/`
- `assets/`
- `functions/` para integraciones que requieran secretos

## Deploy en Cloudflare Pages

- Repository: `jestitaro/designrebels`
- Production branch: `main`
- Root directory: `projects/quartzsales-marketing-dashboard`
- Build command: vacío, si continúa como HTML, CSS y JavaScript sin framework
- Build output directory: `.`

## Seguridad

No guardar tokens o claves privadas en HTML, JavaScript público, archivos versionados ni `localStorage`. Las integraciones con Apify, YouTube o Anthropic deben ejecutarse mediante Cloudflare Pages Functions o un Worker y leer los secretos desde variables de entorno.
