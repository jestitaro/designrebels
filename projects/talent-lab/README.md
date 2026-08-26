# Talent Lab · by QuartzSales

Landing estática (sin backend, sin login) con dos partes:

1. **Vidriera**: proyectos reales creados por gente de QuartzSales por iniciativa propia, con un caso destacado (hoy: Talent Games by Design Rebels).
2. **Clasificados**: búsquedas abiertas dentro de QuartzSales para las que todavía nadie se postuló — las "páginas amarillas" del talento interno.

No hay carga por admin ni cuentas: el contenido es fijo, se edita directo en `index.html`.

## Arquitectura

```
projects/talent-lab/
├── index.html      toda la landing (secciones a pantalla completa, sin backend)
├── README.md
└── assets/
    ├── styles.css    tokens de color reutilizados del hub de Design Rebels + el nuevo layout
    └── app.js         una sola cosa: la animación de scroll-reveal
```

Diseño inspirado en la estructura de una landing de referencia (ritmo de secciones a pantalla completa con colores planos alternados, header flotante fijo, cards de portfolio rotadas/superpuestas, sección de testimonio con capas de color apiladas) — la identidad visual (colores, tipografía Manrope) es la de Design Rebels, no una copia literal de la referencia.

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
