# IA en el PDV — Landing

Landing de producto para el módulo de detección de quiebres de stock por IA en góndola: el mercaderista recorre el lineal grabando con el celular y la IA identifica en tiempo real qué SKU están y cuáles faltan — propios y de la competencia.

Sigue la misma estructura que `projects/gestion-pedidos/` (header, hero, demo interactivo embebido, cómo funciona, pensado para, CTA de contacto, footer) para que ambas landings de producto se lean como una sola familia.

## Ruta

`projects/ia-pdv-demo/`

## Ver online

`https://jestitaro.github.io/designrebels/projects/ia-pdv-demo/`

## Estructura

- `index.html` — landing completa. La sección "Demo interactiva" (`#ai-demo`) muestra un video horizontal (mercaderista grabando la góndola) junto a un marco de celular con la grabación de pantalla de la app real, en lugar de una simulación interactiva en JS.
- `styles.css` — chrome de la landing: tokens de marca, header, hero, cards, stats de la sección "Números", flow de "cómo funciona", CTA de contacto y footer. Mismos tokens que `projects/gestion-pedidos/styles.css`. El inline `<style>` de `index.html` cubre únicamente la sección oscura "Demo interactiva" y el marco de celular.
- `app.js` — header con sombra al scrollear, drawer mobile, scroll-to en los CTAs, línea de progreso de "cómo funciona", count-up animado de los números de la sección "Números" y el submit del formulario de contacto.
- `media/` — los dos videos del demo, comprimidos para web a partir de los originales alojados en quartzsales.com:
  - `quiebres-demo-horizontal-shelf.mp4` — mercaderista escaneando la góndola con el celular (video horizontal).
  - `quiebres-demo-vertical-screen.mp4` — grabación de pantalla de la app real detectando productos (video vertical, dentro del marco de celular).

## Tecnología

Sin build ni dependencias de npm:

- HTML + CSS
- JavaScript vanilla
- Google Fonts (Nunito + Poppins) y Font Awesome Kit vía CDN

## Identidad de marca

Aplicado el manual de identidad QuartzSales:

- Tipografía **Nunito** en toda la landing (header, hero, números, funcionalidades, cómo funciona, modelo, pensado para, CTA, footer).
- Paleta de marca: `--dark-bg: #130D5D`, gradiente `--brand-blue → --brand-1` (`#3C9FF1 → #7025E0`) en eyebrow/logo, `--brand-1 → --brand-2` (`#7025E0 → #A172FF`) en botones — mismos tokens que `gestion-pedidos`.
- La sección "Demo interactiva" conserva su propio tema oscuro (fondo `--qs-dark`, acento `--qs-cyan`) para que el marco de celular y el video se lean como una pieza de producto, no como comunicación de marca.

## Pendiente / conocido

- El marco de celular de la "Demo interactiva" (`.qs-app-frame`/`.qs-app-screen`) no tiene todavía un breakpoint mobile más allá de apilar el video horizontal y el celular en una columna. El resto de la landing es responsive.

## Estado

Landing / trabajo en curso.
