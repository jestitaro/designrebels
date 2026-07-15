# Content Visual Editor

Editor visual de contenidos para crear piezas de noticias y comunicación interna de QuartzSales sin depender de herramientas externas.

## Ruta

`projects/content-visual-editor/`

## Ver online

`https://jestitaro.github.io/designrebels/projects/content-visual-editor/`

## Tecnología

Proyecto estático, sin build:

- HTML
- CSS
- JavaScript
- `html2canvas` desde CDN para exportar PNG

## Funcionalidades

- Formatos 1:1 y 9:16.
- Textos, placas, tags, fechas e imágenes movibles y redimensionables.
- Guías de alineación y área segura.
- Capas, duplicado, deshacer y rehacer.
- Fondos, colores corporativos y galería persistente.
- Alertas de corte, contraste, tamaño y desborde.
- Guardar/abrir la noticia como archivo `.json` editable, para retomarla en esta computadora o en otra.
- Exportación PNG en tamaño real (formato final, no editable).
- Autoguardado local mediante `localStorage` e `IndexedDB`.

## Privacidad

El editor no utiliza API keys ni servicios de backend. Los diseños, colores e imágenes cargadas se guardan únicamente en el navegador del usuario.

## Publicación

GitHub Pages sirve esta carpeta como parte del repositorio `jestitaro/designrebels`. Los cambios en `main` quedan disponibles automáticamente en la URL indicada arriba.
