# IA aplicada al Retail — Landing

Sección de producto que recrea la captura "IA aplicada al Retail" (QuartzSales): fondo con gradiente de marca animado y 3 cards con mockups de teléfono — Reconocimiento de imágenes, Reconocimiento de precios y Planificación y ejecución inteligente.

Inspirada en el lenguaje de animación de sitios de agencia tipo awsmd.com (reveal escalonado por scroll, tipografía que entra palabra por palabra, mockups flotando con leve tilt 3D al mouse) aplicado con la identidad visual de QuartzSales.

## Ruta

`projects/ia-retail-landing/`

## Ver online

`https://jestitaro.github.io/designrebels/projects/ia-retail-landing/`

## Estructura

- `index.html` — landing de una sola sección: header mínimo, hero "IA aplicada al Retail" y el grid de 3 cards.
- `styles.css` — tokens de marca (mismos que `ia-pdv-demo`/`gestion-pedidos`), gradiente animado de fondo, mockups de teléfono dibujados en CSS y todas las animaciones.
- `app.js` — split del título en palabras para el reveal escalonado, `IntersectionObserver` para el scroll-reveal de título/lead/cards, y tilt 3D en los mockups siguiendo el mouse.

## Animaciones

- **Reveal por scroll**: título se revela palabra por palabra, lead y cards con fade + slide-up escalonado (`--d` por card).
- **Fondo vivo**: 3 blobs con blur que derivan lentamente (gradiente de marca `--brand-1 → --brand-2`).
- **Mockups flotando**: animación idle de flotación suave, con tilt 3D al mover el mouse sobre cada card (`perspective` + `rotateX/rotateY`).
- **Micro-loops de "IA en vivo"**: bounding box de reconocimiento pulsando y card de producto reconocido apareciendo/desapareciendo en loop (card 1), tickets de precio con pulso periódico (card 2), chip de dropdown con bounce (card 3).
- Respeta `prefers-reduced-motion: reduce` (desactiva loops, tilt y transiciones).

## Tecnología

Sin build ni dependencias de npm: HTML + CSS + JavaScript vanilla, Google Fonts (Nunito). Los mockups de teléfono son 100% CSS (sin imágenes ni screenshots reales de producto).

## Pendiente / conocido

- No se pudo acceder a `awsmd.com` desde el entorno de desarrollo (bloqueado por política de red del sandbox), así que las animaciones son una recreación de patrones típicos de landing de agencia premium, no una copia 1:1 del sitio de referencia — a validar visualmente contra el sitio real.

## Estado

Landing / trabajo en curso.
