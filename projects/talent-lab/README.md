# Talent Lab · by QuartzSales

Landing estática (sin backend, sin login) con dos partes:

1. **Vidriera**: proyectos reales creados por gente de QuartzSales por iniciativa propia. Cada talento tiene su propia página de detalle en `talentos/` (hoy: Talent Games by Design Rebels).
2. **Clasificados**: búsquedas abiertas dentro de QuartzSales para las que todavía nadie se postuló — las "páginas amarillas" del talento interno.

No hay carga por admin ni cuentas: el contenido es fijo, se edita directo en el HTML.

## Arquitectura

```
projects/talent-lab/
├── index.html                    landing principal (hero, vidriera, clasificados, CTA)
├── README.md
├── talentos/
│   └── talent-games.html         página de detalle de un talento (ver abajo)
└── assets/
    ├── styles.css       tokens de color reutilizados del hub de Design Rebels + el layout
    ├── app.js            scroll-reveal (compartido por index.html y las páginas de talentos/)
    ├── hero-physics.js   caída de los íconos del hero de index.html (ver abajo)
    └── vendor/
        ├── matter.min.js          Matter.js vendorizado (sin depender de un CDN externo)
        └── matter-js-LICENSE.txt  su licencia MIT
```

### Página de un talento (`talentos/*.html`)

Cada card de la Vidriera enlaza a su propia página dentro de `talentos/`, en vez de abrir un "caso destacado" dentro de `index.html`. Todas siguen la misma estructura, con las mismas secciones a pantalla completa que el resto del sitio:

1. Intro (idea en una línea + links de acción, ej. jugar los juegos)
2. La idea
3. Qué resuelve
4. Quién lo lleva adelante
5. Por qué lo eligió (como pull-quote, reutilizando `.quote-stack`)
6. Carrusel horizontal con otros talentos (`.carousel`) + link de vuelta a la vidriera
7. Footer (el mismo `.tl-footer` de `index.html`)

Para sumar un talento nuevo: copiar `talentos/talent-games.html`, reemplazar el contenido de cada sección, y agregar una `.scatter-card` en `index.html` (`#talentos`) apuntando a `talentos/<archivo>.html`.

Diseño inspirado en la estructura de una landing de referencia (ritmo de secciones a pantalla completa con colores planos alternados, header flotante fijo, cards de portfolio rotadas/superpuestas, sección de testimonio con capas de color apiladas) — la identidad visual (colores, tipografía Poppins) es la de Design Rebels, no una copia literal de la referencia.

### El hero: caída con física real, no animación guionada

Los íconos del hero (mouse, celular, teclado, laptop, anteojos, cuaderno, cerebro, lamparita) caen con una simulación de física real (gravedad + colisiones) hecha con [Matter.js](https://brm.io/matter-js/), no con un `@keyframes` de CSS. La referencia que se usó de base para esto también usa un motor de física sobre un `<canvas>` — acá se hace lo mismo pero renderizando sobre los mismos `<div>`/`<svg>` del DOM (se lee la posición/ángulo de cada body de Matter.js en cada frame y se aplica como `transform`), para no perder el hover ni la semántica de los íconos.

Por eso el orden en que aterrizan y cómo quedan apilados nunca es igual dos veces — lo resuelve el motor, no un guion. Arranca recién cuando `.icon-shelf` entra bien en pantalla (`IntersectionObserver` con `rootMargin` negativo, para exigir scroll real y no un pixel asomando en el borde) y se detiene solo cuando todos los cuerpos quedan dormidos (`engine.enableSleeping`), para no gastar CPU de más. Al pasar el mouse por un ícono ya aterrizado, se le aplica un impulso real (`Body.applyForce`) — lo despierta y lo hace reaccionar físicamente, no una transición CSS simulando el efecto.

Con `prefers-reduced-motion: reduce` no corre la simulación: los íconos se acomodan en una fila fija, sin animación.

## Cómo actualizar el contenido

Todo vive directo en `index.html`, en texto plano:

- **Vidriera** (`#talentos`): cada talento es una `.scatter-card` dentro de `.scatter`, que enlaza a su página en `talentos/`. Hoy hay 1 real + 2 "slots" vacíos invitando a sumar más — reemplazar los slots por cards reales (y su página en `talentos/`) a medida que entren proyectos.
- **Página de un talento** (`talentos/talent-games.html`): ver "Página de un talento" más arriba.
- **Clasificados** (`#clasificados`): cada búsqueda es un `.ad-card` dentro de `.ads-grid`. Los 3 actuales están marcados "Ejemplo" — reemplazar por las búsquedas reales y sacar el badge `<span class="example">`.
- **Contacto**: hoy apunta a `talentlab@quartzsales.com` (placeholder) en dos lugares (`.chrome-cta` del header no, pero sí `#clasificados` y `#contacto`) — cambiar por el canal de contacto real (mail de equipo, WhatsApp, formulario).

## Pendiente

- Definir el canal de contacto real para "Me postulo" (hoy `mailto:talentlab@quartzsales.com`, un placeholder).
- Cargar los talentos y clasificados reales que reemplacen a los de ejemplo.
- Si en algún momento se necesita que cualquiera pueda publicar su propio talento o clasificado sin pasar por el código, ahí sí hace falta volver a un backend (Firebase, como en `../qs-league`) — decisión consciente, no la versión actual.
