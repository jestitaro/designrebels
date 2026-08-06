# IA en el PDV — Landing

Landing de producto para el módulo de reconocimiento de productos por IA en góndola: un repositor apunta la cámara del celular, la IA detecta cada producto y el formulario de relevamiento se completa solo con los precios.

Sigue la misma estructura que `projects/gestion-pedidos/` (header, hero, demo interactivo embebido, cómo funciona, pensado para, CTA de contacto, footer) para que ambas landings de producto se lean como una sola familia.

## Ruta

`projects/ia-pdv-demo/`

## Ver online

`https://jestitaro.github.io/designrebels/projects/ia-pdv-demo/`

## Estructura

- `index.html` — landing completa. El demo interactivo (sección `#ai-demo`) vive inline dentro del mismo archivo, con su propio `<style>`/`<script>` self-contained (incluye los productos de ejemplo embebidos como imágenes en base64).
- `styles.css` — chrome de la landing: tokens de marca, header, hero, cards, flow de "cómo funciona", CTA de contacto y footer. Mismos tokens que `projects/gestion-pedidos/styles.css`.
- `app.js` — header con sombra al scrollear, drawer mobile, scroll-to en los CTAs, línea de progreso de "cómo funciona" y el submit del formulario de contacto.

## Tecnología

Sin build ni dependencias de npm:

- HTML + CSS
- JavaScript vanilla
- Google Fonts (Nunito + Poppins) y Font Awesome Kit vía CDN

## Identidad de marca

Aplicado el manual de identidad QuartzSales:

- Tipografía **Nunito** en toda la landing (header, hero, cómo funciona, pensado para, CTA, footer) y en el panel de marca del demo interactivo.
- Paleta de marca: `--dark-bg: #130D5D`, gradiente `--brand-blue → --brand-1` (`#3C9FF1 → #7025E0`) en eyebrow/logo, `--brand-1 → --brand-2` (`#7025E0 → #A172FF`) en botones — mismos tokens que `gestion-pedidos`.
- El panel derecho del demo, que simula la app real de campo, conserva **Poppins** — es UI de producto, no comunicación de marca (regla del manual: Nunito para marca, Poppins solo para UI interna de producto).

## Pendiente / conocido

- El demo interactivo (panel góndola + panel app, `.qs-demo-wrap`) no tiene todavía un breakpoint mobile: en pantallas angostas el panel izquierdo queda casi oculto. El resto de la landing (header, hero, cómo funciona, pensado para, CTA, footer) sí es responsive.

## Estado

Landing / trabajo en curso.
