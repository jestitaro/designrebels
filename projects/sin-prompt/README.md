# Este año, sin prompt · QuartzSales 2026

Saludo de fin de año de QuartzSales. Cada persona escribe dos postales (una que asigna el destino, otra que elige), cada postal suma una pieza a un árbol colectivo, y hay un minijuego con ranking para armar el árbol contra reloj.

Publicado en `projects/sin-prompt/` (un solo `index.html` autocontenido: también se puede descargar y abrir sin servidor).

## Estado: prototipo en modo demo

Sin variables de Supabase la app corre en **modo demo** y lo dice en pantalla (botón “Modo demo”, abajo a la izquierda).

| | Demo (hoy) | Con Supabase |
|---|---|---|
| Participantes | Equipo real (19 personas, del organigrama de ESC) en `source/src/config/participants.js` | Tabla `participants` |
| Identificación | Elegir el nombre (sin verificación) | Link mágico al mail habilitado |
| Sorteo | Ciclo determinístico con semilla fija sobre el listado completo | `generate_assignments()`, una vez, en el servidor |
| Postales, dibujos, árbol, galería, ranking | Solo en este navegador (`localStorage`) | Compartidos, validados por RPC + RLS |
| Datos de ejemplo | Postales y tiempos marcados “Ejemplo” | No hay |

En demo nada se comparte entre personas. No es una simulación de datos compartidos.

## Recorrido

1. Bienvenida: un prompt se escribe y se borra (“Mejor no.”), el título se arma con bloques. Identificación.
2. El destino decide: revelación del destinatario asignado (fijo).
3. Creador: elegir postal (14 diseños por rol + neutrales, carrusel con vista ampliada) o dibujar (lápiz, goma, texto, colores QS, grosores, deshacer/rehacer, limpiar con confirmación, PNG; mouse, touch y lápiz con presión). Mensaje propio, vista previa con dorso, privada/pública, envío con sobre.
4. Vos elegís: buscador de personas, cualquier destinatario salvo vos.
5. Árbol colectivo en CSS 3D: girable (arrastre o flechas), cada pieza es una postal; las privadas no muestran nombres. Vista de lista accesible.
6. Minijuego “Armá el árbol”: 14 piezas, encastre por snap, error con rebote, cronómetro, mejor tiempo por persona.
7. Galería (solo públicas) y Recibidas (sobre que se abre, postal que se da vuelta, descarga PNG).

Nav persistente para volver a galería, recibidas o juego en cualquier momento. El progreso y los borradores sobreviven a recargar.

## LEGO Q

El hero muestra el isotipo armado con piezas LEGO reales (variante volumen, generada por `source/scripts/build-q.mjs`): el hover lo desarma, un click en una pieza arma el arbolito con esas mismas 41 piezas, otro click vuelve a la Q. El manual interactivo está en `#/lego-q` (sin link desde la home), y los entregables (JSON, `.ldr`, inventario, manual por capas, vistas) en [`lego-q/`](./lego-q/).

## Desarrollo

```bash
cd source
npm install
npm run dev      # desarrollo
npm run build    # genera dist/ y copia el index.html autocontenido a ../index.html
npm run build:q  # regenera la LEGO Q (modelos, .ldr, inventarios, manuales)
```

Para conectar Supabase: copiá `source/.env.example` a `source/.env`, completá las variables y volvé a buildear. Pasos de base de datos en [`supabase/README.md`](./supabase/README.md).

## Estructura

```
index.html                 build publicado (autocontenido)
supabase/schema.sql        tablas, RLS, RPC, storage
source/src/
  config/participants.js   lista demo editable + semilla del sorteo
  config/postcards.js      catálogo de postales y "prompts para humanos"
  lib/api/demo.js          adaptador demo (localStorage, mismas validaciones)
  lib/api/supabase.js      adaptador real (solo llama RPC)
  lib/assign.js            PRNG y sorteo en ciclo
  lib/exportPng.jsx        postal completa (frente + dorso) a PNG
  components/              PostcardArt (SVG), Postcard, Tree3D, Brick, Envelope…
  screens/                 Intro, Reveal, Choose, Creator, DrawEditor, TreeScreen, Game, Gallery, Mailbox, Journey
```

## Decisiones

- **Sin Three.js.** El árbol y las piezas son CSS 3D: liviano, nítido, sin WebGL. Alcanza para girarlo, explorarlo y animar el encastre.
- **Poppins** como pidió el brief (el manual de marca indica Nunito para comunicación externa; es un cambio de una línea en `lib/fonts.js` si se prefiere).
- Accesibilidad: navegación por teclado en todo (incluido el juego: Tab + Enter coloca la pieza), foco visible, diálogos con trampa de foco, `prefers-reduced-motion` respetado, objetivos táctiles de 44 px.
