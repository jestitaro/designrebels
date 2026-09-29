# QS Brand Animation

Brand animation de QuartzSales en Remotion (React → MP4). 1920×1080, 30 fps.

**Estado:** Fase 0, la infraestructura visual y técnica. Las escenas finales todavía no empezaron.
Faltan los assets oficiales (logos y personajes) y la validación del ComponentShowcase.

## Uso

```bash
npm install
npm run dev              # Remotion Studio
npm run typecheck
npm run stills           # stills de validación → out/
npm run list-assets      # logos y poses presentes en /public
npm run export-markers   # markers.csv para sound design
```

Composiciones: `Main` (timeline de las 14 escenas, hoy con slates), `ComponentShowcase` (6 láminas animadas),
`Showcase-*` (cada lámina suelta), `CameraLab` (parallax + zoom through) y `TransitionsLab` (las 6 transiciones).
En `Main`, `showMarkers: true` muestra el overlay de sound design.

## Assets pendientes

Alcanza con copiar los archivos a estas rutas: los placeholders se reemplazan solos (se detectan con `getStaticFiles()`).

| Asset | Ruta |
|---|---|
| Isotipo | `public/logos/iso-qs.svg` |
| Logo full color | `public/logos/logo-qs-fullcolor.svg` |
| Wordmark fondo claro | `public/logos/tipo-qs-bg-light.svg` |
| Caro | `public/characters/caro/<pose>.png` |
| Nico | `public/characters/nico/<pose>.png` |

El nombre del archivo, sin la extensión, es el nombre de la pose: `<Character who="caro" pose="saludo" />`.

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
