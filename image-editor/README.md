# Editor de imagen para noticias (prototipo)

Mini editor tipo Canva para crear la imagen de una noticia (1080×1080 o 1080×1920) sin herramientas externas. Es 100 % estático: HTML + CSS + JS, sin build.

## Publicar en Netlify

Opción A — desde el repo (recomendada):
1. En Netlify: **Add new site → Import an existing project** y elegí este repo (`jestitaro/designrebels`).
2. Branch a deployar: la que corresponda (por ej. `main` una vez mergeado).
3. No hace falta configurar nada más: el `netlify.toml` de la raíz publica el repo completo y redirige `/` a `/image-editor/`.

Opción B — arrastrar y soltar:
1. Entrá a https://app.netlify.com/drop
2. Arrastrá la carpeta `image-editor/`. Listo.

## Qué se puede hacer

- Mover elementos arrastrándolos (mouse o táctil), con guías de alineación que "enganchan" al centro y al área segura.
- Cambiar el tamaño con los 8 nodos del borde. En textos, los nodos de esquina escalan también la tipografía; en imágenes mantienen la proporción (Shift la libera/fuerza).
- Editar textos con doble clic directamente sobre el lienzo.
- Deshacer / rehacer (botones o Ctrl+Z / Ctrl+Shift+Z), duplicar (Ctrl+D), borrar (Supr), mover con flechas.
- Avisos de diseño (se corta, fuera del área segura, texto chico, bajo contraste WCAG) en el ícono de estado del preview, no en un panel fijo.
- Ayuda y atajos en el ícono "?" del header.
- Zoom, dos formatos (1:1 y 9:16), fondos predefinidos o imagen propia, capas.
- Exportar PNG en tamaño real.
- El diseño se autoguarda en el navegador (localStorage).
