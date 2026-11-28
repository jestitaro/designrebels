# QuartzSales · LEGO Q

El isotipo de QuartzSales construido solo con piezas LEGO reales, con el mismo motor y lenguaje visual del arbolito. Todo lo de esta carpeta se genera desde el modelo: no se edita a mano.

```bash
cd ../source && npm run build:q    # node scripts/build-q.mjs <ancho> <fondo> <variante>
```

## Variantes

| | Volumen (por defecto) | Detalle |
|---|---|---|
| Tamaño | 10 × 2 studs (ancho × fondo) | 26 × 1 studs |
| Piezas | 41 | 161 |
| Capas | 9 | 23 |
| Estructura | 2×2 (3003) + 1×2 girados | 1×1, 1×2, 1×4 |
| Uso | Hero: Q gruesa, pocas piezas grandes, en tres cuartos | Diagonales más definidas |

La variante volumen sigue la dirección de la imagen de referencia (Q con espesor, saliente bajo con perillas), pero con piezas y encastres válidos: la punta es de inverted slopes, no una pirámide.

## Q ↔ arbolito con las mismas piezas

En el hero, la Q (variante volumen) se desarma y con **las mismas 41 piezas** se arma un arbolito: maceta, tronco, tres pisos de ramas con inverted slopes en las puntas y cheese slopes en los escalones, y un 1×2 de remate. Mismo inventario exacto (16× 3003, 5× 3004, 12× 3665, 8× 54200), sin colisiones. Cada pieza conserva su color (un ladrillo real no cambia de color): se asignan para que los celestes queden arriba y los violetas abajo. La disposición del árbol está en `source/src/lib/legoTree.js`. La estrella de la punta es un adorno de la animación, no una pieza LEGO.

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
2. **Ladrillos.** Con fondo de 1 stud, cada fila se arma con 3005 / 3004 / 3010; con fondo de 2, con 3003 (2×2) y 3004 girados 90°. Siempre trabada con la fila de abajo (filas alternas arrancan desplazadas). Los cortes no siguen el color: cada pieza toma el color mayoritario de sus celdas, así las juntas no quedan alineadas.
3. **Diagonales inferiores.** Donde una fila sobresale 1 stud sobre la de abajo, la punta de esa fila es un **3665** (inverted slope 2×1), que encastra con su único tubo sobre la fila inferior.
4. **Escalones superiores.** Donde queda un stud expuesto junto a la fila de arriba, va una **54200** (cheese slope) apoyada en ese stud. Si fueran dos studs, iría una **3040**: en esta silueta las diagonales suben de a un stud, así que no hizo falta.
5. **Saliente interior.** En el logo es un triángulo bajo que nace del borde inferior del anillo; al rasterizarlo quedaba como una torre angosta, así que se limita a sus filas más bajas (1 en volumen, 2 en detalle) y queda con perillas, sin remates en punta.
6. **Conectividad.** Si alguna parte queda suelta, el generador cambia la traba fila por fila hasta que todo es una sola estructura.

## Validación (automática, en cada build)

- Solo piezas del catálogo permitido (ver inventario de cada variante; las permitidas que no se usan figuran ahí).
- Ninguna pieza escalada ni deformada: cada referencia tiene su geometría fija (proporciones LDraw: stud 20 LDU, ladrillo 24, plate 8; cheese slope 16).
- Sin colisiones (una celda, una pieza).
- Conexiones reales: una pieza conecta con la de abajo solo donde hay stud y tubo compatibles (las slopes 3040 solo tienen stud en la parte alta; las 3665 solo tubo en la parte alta; las cheese no tienen studs).
- Una sola estructura conectada, sin piezas flotantes.

## Limitaciones conocidas

- **Apoyo.** La Q se apoya sobre la punta: para exhibirla físicamente conviene una base o un soporte atrás (no incluido, para mostrar solo la Q). La variante de detalle, con 1 stud de fondo, es además una pared fina.
- **Colores.** Son los de marca en sólido; en el `.ldr` van como colores directos LDraw (`0x2RRGGBB`). La equivalencia con colores LEGO de catálogo está en el inventario y es aproximada.
- **Orientación de slopes en el `.ldr`.** Posiciones y rotaciones de ladrillos siguen la convención LDraw. Para 3040/3665/54200 la rotación asume la pendiente nativa hacia −Z; conviene verificarla en Studio o LDCad antes de pedir piezas. El JSON es la fuente de verdad.
