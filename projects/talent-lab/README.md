# Talent Lab · by QuartzSales

Landing estática (sin backend, sin login) con dos partes:

1. **Vidriera**: proyectos reales creados por gente de QuartzSales por iniciativa propia, con un caso destacado (hoy: Talent Games by Design Rebels).
2. **Clasificados**: búsquedas abiertas dentro de QuartzSales para las que todavía nadie se postuló — las "páginas amarillas" del talento interno.

No hay carga por admin ni cuentas: el contenido es fijo, se edita directo en `index.html`.

## Arquitectura

```
projects/talent-lab/
├── index.html          toda la landing (secciones a pantalla completa, sin backend)
├── README.md
└── assets/
    ├── styles.css       tokens de color reutilizados del hub de Design Rebels + el layout
    ├── app.js            scroll-reveal del resto de la página
    ├── hero-physics.js   caída de los íconos del hero (ver abajo)
    └── vendor/
        ├── matter.min.js          Matter.js vendorizado (sin depender de un CDN externo)
        └── matter-js-LICENSE.txt  su licencia MIT
```

Diseño inspirado en la estructura de una landing de referencia (ritmo de secciones a pantalla completa con colores planos alternados, header flotante fijo, cards de portfolio rotadas/superpuestas, sección de testimonio con capas de color apiladas) — la identidad visual (colores, tipografía Manrope) es la de Design Rebels, no una copia literal de la referencia.

### El hero: caída con física real, no animación guionada

Los íconos del hero (mouse, celular, teclado, laptop, anteojos, cuaderno, cerebro, lamparita) caen con una simulación de física real (gravedad + colisiones) hecha con [Matter.js](https://brm.io/matter-js/), no con un `@keyframes` de CSS. La referencia que se usó de base para esto también usa un motor de física sobre un `<canvas>` — acá se hace lo mismo pero renderizando sobre los mismos `<div>`/`<svg>` del DOM (se lee la posición/ángulo de cada body de Matter.js en cada frame y se aplica como `transform`), para no perder el hover ni la semántica de los íconos.

Por eso el orden en que aterrizan y cómo quedan apilados nunca es igual dos veces — lo resuelve el motor, no un guion. Arranca recién cuando `.icon-shelf` entra bien en pantalla (`IntersectionObserver` con `rootMargin` negativo, para exigir scroll real y no un pixel asomando en el borde) y se detiene solo cuando todos los cuerpos quedan dormidos (`engine.enableSleeping`), para no gastar CPU de más. Al pasar el mouse por un ícono ya aterrizado, se le aplica un impulso real (`Body.applyForce`) — lo despierta y lo hace reaccionar físicamente, no una transición CSS simulando el efecto.

Con `prefers-reduced-motion: reduce` no corre la simulación: los íconos se acomodan en una fila fija, sin animación.

## Cómo actualizar el contenido

Todo vive directo en `index.html`, en texto plano:

- **Vidriera** (`#talentos`): cada talento es una `.scatter-card` dentro de `.scatter`. Hoy hay 1 real + 2 "slots" vacíos invitando a sumar más — reemplazar los slots por cards reales a medida que entren proyectos.
- **Caso destacado** (`#talent-games`): sección `.case` con la descripción larga y los links a los juegos ya publicados en este repo (`../dino-chomp/`, `../dino-escape/`, `../meteorito-run/`).
- **Clasificados** (`#clasificados`): cada búsqueda es un `.ad-card` dentro de `.ads-grid`. Los 3 actuales están marcados "Ejemplo" — reemplazar por las búsquedas reales y sacar el badge `<span class="example">`.
- **Contacto**: hoy apunta a `talentlab@quartzsales.com` (placeholder) en dos lugares (`.chrome-cta` del header no, pero sí `#clasificados` y `#contacto`) — cambiar por el canal de contacto real (mail de equipo, WhatsApp, formulario).

## Pendiente

- Definir el canal de contacto real para "Me postulo" (hoy `mailto:talentlab@quartzsales.com`, un placeholder).
- Cargar los talentos y clasificados reales que reemplacen a los de ejemplo.
- Si en algún momento se necesita que cualquiera pueda publicar su propio talento o clasificado sin pasar por el código, ahí sí hace falta volver a un backend (Firebase, como en `../qs-league`) — decisión consciente, no la versión actual.
