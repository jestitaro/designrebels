# QS Brand Animation

Brand animation de QuartzSales en Remotion (React → MP4). 1920×1080, 30 fps.

**Estado:** Fase 0 completa, con todos los assets cargados. Falta validar el ComponentShowcase antes de pasar a los style frames.

## Uso

```bash
npm install
npm run dev              # Remotion Studio
npm run typecheck
npm run stills           # stills de validación → out/
npm run list-assets      # logos y poses presentes en /public
npm run export-markers   # markers.csv para sound design
```

Composiciones: `Main` (timeline de las 14 escenas, hoy con slates), `ComponentShowcase` (8 láminas animadas),
`Showcase-*` (cada lámina suelta), `CameraLab` (parallax + zoom through) y `TransitionsLab` (las 6 transiciones).
En `Main`, `showMarkers: true` muestra el overlay de sound design.

## Assets

Todo está cargado en `/public`: logos oficiales, 18 poses de Caro, 15 de Nico y 13 productos genéricos.

| Asset | Ruta |
|---|---|
| Logos | `public/logos/iso-qs.svg`, `logo-qs-fullcolor.svg`, `tipo-qs-bg-light.svg` |
| Caro / Nico | `public/characters/<nombre>/<pose>.png` |
| Productos | `public/products/*.png` (fondo transparente) |

- **Poses:** `src/characters/poses.ts` guarda el bounding box de cada pose. `<Character height={…}>` escala de forma uniforme para que la figura mida lo mismo de pie en todas las poses, con los pies en `y`. Las poses sentadas y la caída usan un factor aproximado.
- **Caminata:** `<CharacterWalk frames={WALK_FRAMES.nico}>` alterna los fotogramas de la zancada con un leve rebote vertical. Los fotogramas entregados son de una sola fase; para un ciclo completo faltan los de la pierna contraria.
- **Productos:** `src/ui/products.ts` guarda la categoría y la altura real (cm) de cada producto. `<Product>` y `<Shelf>` dibujan a escala real, así que una crema dental no mide lo mismo que una lavandina. `<ProductThumb>` es la miniatura para listas. Las alturas son aproximadas y se pueden ajustar.
- **Indicadores:** `<Gauge>` es el medio círculo de `indicadores_svg`, con valor coloreado por estado y un punto que marca el objetivo. Tiene tres variantes: `GaugeCard` (fondo claro), `GaugeTile` (sobre el header) e `IndicatorCard` (resumen de la home). El color sale del cumplimiento del objetivo (valor ÷ objetivo): verde solo si llega al 100 %, amarillo de 50 % a 99 % y rojo por debajo de 50 %. Sin objetivo, el indicador va en azul neutral.
- **Isotipo:** `src/brand/isoPaths.ts` separa el SVG oficial en 20 triángulos (uno por subpath) para la escena 13, sin redibujar nada. `<IsoTriangles triangle={(i) => …}>` los anima por separado.
- **Referencia de pantallas PSMob:** `reference/psmob/`.

## Estructura

```
src/
  Root.tsx            composiciones
  Main.tsx            timeline principal (slates hasta que existan las escenas)
  timeline.ts         inicio, duración, overlap y transición de salida de cada escena
  markers.ts          markers de sound design
  tokens.ts           colores, tipografía, spacing, radius, sombras, easings, springs
  fonts.ts            Nunito + DM Sans autoalojadas (public/fonts, OFL)
  assets.ts           registro y detección de logos y personajes
  lib/                sec(), easing/progress, random(seed), legibilidad (regla de 22 px)
  camera/             Camera, DepthLayer (fg 1.4 · mg 1 · bg 0.5), keyframes, zoomToRect
  devices/            Phone (390×844), Laptop (1280×800), genéricos y sin marca
  ui/                 componentes PSMob + pantallas armadas
  shapes/             blobs, ondas, superficies diagonales, anillos, fondos por arco
  transitions/        zoom through, object wipe, match cut, mask reveal, shape morph, push-in/out
  characters/         Character (PNG con respiración y swap de pose, o placeholder)
  brand/              Logo (SVG oficial o placeholder)
  showcase/           láminas y labs de validación
  scenes/             ScenePlaceholder (las escenas S01–S14 van acá)
review/fase-0/        stills entregados en el checkpoint
```

## Convenciones

- **Determinismo:** solo `useCurrentFrame`, `interpolate`, `spring` y `random(seed)`. Nada de `Math.random`, timers, `Date` ni animaciones o transiciones CSS.
- **Duraciones en segundos** con `sec()`. Cambiar `FPS` en `lib/time.ts` no rompe el timing.
- **Progress:** todo componente de UI y toda transición recibe `progress` 0→1 que ya viene con curva (`progressAt`, `springAt`). Adentro no se vuelve a aplicar easing.
- **Colores:** solo los tokens. Los tintes se derivan con `alpha()`.
- **Blur:** como máximo 1 o 2 capas por frame (`DepthBlur`). Los fondos logran la suavidad con gradientes radiales en SVG.
