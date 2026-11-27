# QuartzSales · LEGO Q

El isotipo de QuartzSales construido solo con piezas LEGO reales, con el mismo motor y lenguaje visual del arbolito. Todo lo de esta carpeta se genera desde el modelo: no se edita a mano.

```bash
cd ../source && npm run build:q    # regenera modelos, .ldr, inventarios y manuales
```

## Variantes

| | Compacta (por defecto) | Detalle |
|---|---|---|
| Ancho | 12 studs | 26 studs |
| Piezas | 47 | 163 |
| Capas | 11 | 23 |
| Uso | Hero, piezas grandes, lectura de juguete | Diagonales y saliente más definidos |

## Entregables

| Archivo | Qué es |
|---|---|
| `lego-q-<variante>.json` | Modelo: ID, referencia LEGO/LDraw, X/Y/Z (LDU), rotación, color, capa, orden de montaje y conexiones de cada pieza |
| `lego-q-<variante>.ldr` | Archivo LDraw, un `STEP` por capa |
| `INVENTARIO-<variante>.md` | Inventario contado desde el modelo, por pieza y color |
| `MANUAL-<variante>.md` | Montaje por capas, de la punta inferior al cierre superior |
| `vista-frontal-*.png` · `vista-isometrica-*.png` · `vista-explotada-*.png` | Vistas renderizadas con el motor de la app |

El modelo 3D funcional y la animación de armado y desarmado están en la app: hero de la home y `#/lego-q` (manual interactivo con vistas, slider por capa e inventario).

## Cómo se construye

1. **Silueta.** Se parte del SVG original (`source/src/assets/iso-qs.svg`, no de reinterpretaciones). Cada triángulo se agranda un 14 % desde su centro para cerrar las juntas finas, y se rasteriza a una grilla de 20 LDU de ancho × 24 LDU de alto (un stud × un ladrillo).
2. **Ladrillos.** Cada fila se arma con 3005 / 3004 / 3010, trabada con la fila de abajo (filas alternas arrancan con 1×1). Los cortes no siguen el color: cada pieza toma el color mayoritario de sus celdas, así las juntas no quedan alineadas.
3. **Diagonales inferiores.** Donde una fila sobresale 1 stud sobre la de abajo, la punta de esa fila es un **3665** (inverted slope 2×1), que encastra con su único tubo sobre la fila inferior.
4. **Escalones superiores.** Donde queda un stud expuesto junto a la fila de arriba, va una **54200** (cheese slope) apoyada en ese stud. Si fueran dos studs, iría una **3040**: en esta silueta las diagonales suben de a un stud, así que no hizo falta.
5. **Saliente interior.** En el logo es un triángulo bajo que nace del borde inferior del anillo; al rasterizarlo quedaba como una torre angosta, así que se limita a sus filas más bajas (1 en la compacta, 2 en la de detalle). Si el remate tiene 2 studs, lleva una cheese slope de cada lado.
6. **Conectividad.** Si alguna parte queda suelta, el generador cambia la traba fila por fila hasta que todo es una sola estructura.

## Validación (automática, en cada build)

- Solo piezas del catálogo permitido: 3005, 3004, 3010, 3665, 54200 (3003, 3040 y 35787 permitidas, no usadas en esta silueta).
- Ninguna pieza escalada ni deformada: cada referencia tiene su geometría fija (proporciones LDraw: stud 20 LDU, ladrillo 24, plate 8; cheese slope 16).
- Sin colisiones (una celda, una pieza).
- Conexiones reales: una pieza conecta con la de abajo solo donde hay stud y tubo compatibles (las slopes 3040 solo tienen stud en la parte alta; las 3665 solo tubo en la parte alta; las cheese no tienen studs).
- Una sola estructura conectada, sin piezas flotantes.

## Limitaciones conocidas

- **Espesor de 1 stud.** Es una pared: válida como modelo, pero para exhibirla físicamente conviene una base o un soporte atrás (no incluido, para mostrar solo la Q).
- **Colores.** Son los de marca en sólido; en el `.ldr` van como colores directos LDraw (`0x2RRGGBB`). La equivalencia con colores LEGO de catálogo está en el inventario y es aproximada.
- **Orientación de slopes en el `.ldr`.** Posiciones y rotaciones de ladrillos siguen la convención LDraw. Para 3040/3665/54200 la rotación asume la pendiente nativa hacia −Z; conviene verificarla en Studio o LDCad antes de pedir piezas. El JSON es la fuente de verdad.
