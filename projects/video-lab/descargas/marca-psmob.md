# Manual de marca para video · PSMob

Versión octubre 2026. Resumen del design system de PSMob para mostrar la app en un video.

**Cómo usarlo:** adjuntalo en el chat de Claude cuando el video muestre pantallas de PSMob. Va junto con el brief del video y con `marca-quartzsales-esaurio.md`.

**Regla de convivencia:** lo que está *dentro* de la pantalla del celular sigue este archivo. Todo lo que está *alrededor* (títulos, fondos, placa de cierre, logo) sigue el manual de QuartzSales.

---

## 1. Qué es PSMob

La app de campo de QuartzSales. La usan promotores y repositores para gestionar visitas a puntos de venta (PDV), formularios, relevamiento de productos, control de vencimientos, equipos y galerías de fotos.

- App móvil, en vertical. Ancho de referencia: 390 px.
- En un video, las pantallas van dentro de un marco de celular, con esa proporción.

## 2. Colores

### Primarios y acento

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#2196F3` | Encabezado, elementos activos, links |
| `primary-dark` | `#1976D2` | Encabezado, botón de confirmar |
| `primary-darker` | `#1565C0` | Parte alta del encabezado, degradés |
| `primary-light` | `#E3F2FD` | Fondo de etiqueta "Programado" |
| `accent` | `#7C5CFC` | Botón flotante (+), etiquetas de categoría |
| `accent-light` | `#EDE9FE` | Fondo de etiquetas de categoría |
| `accent-darker` | `#5B21B6` | Texto de etiquetas de categoría |

Degradé de visita activa: `#2196F3 → #1976D2`, vertical.

### Estados

| Estado | Color | Fondo suave |
|---|---|---|
| Correcto | `#4CAF50` / `#2E7D32` | `#E8F5E9` |
| Atención | `#FF9800` / `#E65100` | `#FFF3E0` |
| Crítico | `#F44336` / `#B71C1C` | `#FFEBEE` |

### Neutros

| Token | Hex |
|---|---|
| Superficie (tarjetas) | `#FFFFFF` |
| Fondo de pantalla | `#F5F5F5` |
| Borde | `#E0E0E0` |
| Texto principal | `#212121` |
| Texto secundario | `#616161` |
| Texto deshabilitado | `#9E9E9E` |
| Insignia numérica | `#F44336` con texto blanco |

## 3. Tipografía

- Tipografía de sistema. Para recrear pantallas: **Roboto**, con respaldo del sistema.
- Códigos y EAN: **Roboto Mono**.
- Tamaños dentro de la pantalla: 10 a 22 px. Títulos de pantalla 18 px peso 600; título de tarjeta 14 px peso 600; subtexto 12 px; metadatos 11 px.

## 4. Estructura de una pantalla

```
Encabezado (azul)          56 px · título + íconos a la derecha
Subencabezado opcional     filtros, visita activa
Contenido                  fondo #F5F5F5 · margen 16 px · scroll vertical
Navegación inferior        60 px · 4 o 5 pestañas con ícono y etiqueta
```

- **Encabezado:** degradé `#1976D2 → #2196F3` o sólido. Texto blanco 18 px peso 600. Flecha de volver a la izquierda.
- **Navegación inferior:** fondo blanco, borde superior `#E0E0E0`. Activo en `#2196F3`; inactivo en `#9E9E9E`. Pestañas típicas: Inicio, Info PDV, Visitas, Forms, Productos.

## 5. Componentes que más se ven

- **Tarjeta de lista:** fondo blanco, esquinas 12 px, margen interno 16 px, sombra `0 1px 3px rgba(0,0,0,0.1)`. Título, dirección con ícono de pin, metadatos y etiquetas de estado.
- **Etiquetas de estado:** forma de píldora, 11 a 12 px, peso 500.
  - Visita activa: fondo `#2E7D32`, texto blanco, punto verde que late.
  - Programado: fondo `#E3F2FD`, texto `#1565C0`.
  - Completado: fondo `#E8F5E9`, texto `#2E7D32`.
  - Advertencia: fondo `#FFF3E0`, texto `#E65100`.
  - Categoría: fondo `#EDE9FE`, texto `#5B21B6`.
- **Botón flotante (+):** `#7C5CFC`, 56 px, redondo, sombra `0 4px 12px rgba(124,92,252,0.4)`. Abajo a la derecha, sobre la navegación.
- **Botones:** primario violeta `#7C5CFC` o azul `#1976D2`, texto blanco, esquinas 8 px. Secundario con borde gris.
- **Campos:** borde `#E0E0E0` de 1,5 px, esquinas 8 px, foco en `#2196F3`, etiqueta arriba.
- **Hoja inferior (modal):** esquinas superiores 16 px, título y X para cerrar.
- **Cámara y reconocimiento:** fondo negro con la imagen de cámara, recuadros sobre los productos reconocidos y botón "Finalizar reconocimiento" translúcido abajo.
- **Módulos de Inicio:** tarjetas cuadradas con ícono duotono (azul y violeta), nombre y subtexto, con insignia roja si hay pendientes.

## 6. Pantallas principales

| Pantalla | Qué se ve |
|---|---|
| Inicio | Grilla de módulos y "Mantenimientos a realizar" |
| Visitas | Lista de PDV con etiquetas de estado, botón flotante violeta |
| Visita activa | Fondo en degradé azul, tarjeta con el estado y botón Finalizar |
| Info PDV / Producto | Encabezado azul, datos de precios, ventas y stock |
| Formularios | Categorías desplegables con productos y campo de valor |
| Galerías | Grilla de fotos en 3 columnas con etiquetas de categoría |
| Cámara | Pantalla negra con reconocimiento superpuesto |
| Vencimientos / OSA | Hoja inferior con la lista agrupada por PDV |

## 7. Convenciones de contenido

- Nombre del PDV en MAYÚSCULAS, dirección en minúscula.
- Fechas: `DD/MM/AAAA`.
- Moneda: `$1.234,07` (punto para miles, coma para decimales).
- EAN y códigos en tipografía monoespaciada, color de texto secundario.
- El estado de la visita siempre visible, en el encabezado o en una etiqueta destacada.

## 8. Aplicación en video

Criterios de trabajo para video. Si Diseño o Producto definen otra cosa, prevalece lo que definan.

- Mostrá **pantallas reales** o recreadas fielmente. No inventes funciones que la app no tiene.
- Usá **datos verosímiles pero ficticios**: nada de clientes, PDV ni precios reales sin permiso.
- Una acción por escena: tocar, completar, confirmar. Marcá el toque con un círculo suave.
- Acercá la cámara a la zona donde pasa la acción; el texto de la app es chico para un video.
- El marco del celular es neutro, sin marca de fabricante.

## 9. Checklist

- [ ] Las pantallas usan los colores y componentes de este archivo.
- [ ] No aparece ninguna función inexistente.
- [ ] Los datos son ficticios y verosímiles.
- [ ] Lo que rodea al celular sigue el manual de QuartzSales.
- [ ] Lo importante de cada pantalla se llega a leer.
