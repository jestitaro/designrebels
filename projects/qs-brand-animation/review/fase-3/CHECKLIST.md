# Animatic v1 · autorrevisión

`animatic-v1.mp4` · 960×540 (scale 0.5) · 30 fps · 65,9 s · 14 escenas · sin audio.
Cámara y timing son los del storyboard; el detalle de UI todavía es provisional.

| Criterio | Estado | Nota |
|---|---|---|
| Composición | ✅ con 2 pendientes | Protagonista único por plano y tercios. Pendientes: escena 5 (el teléfono entra muy al borde) y escena 13 (los primeros 0,5 s quedan casi vacíos). |
| Ritmo | ⚠️ | Las escenas 4 y 11 tienen un hold largo sobre la pantalla; se ajustan con la VO. La 13 es corta para leer el armado del isotipo. |
| Profundidad | ✅ | fg / mg / bg con parallax en todas las escenas de cámara. Blur solo en 1 capa (escenas 1 y 10). |
| Consistencia de UI | ✅ | Mismos componentes PSMob en todo el video; los datos coinciden entre escenas (OSA, Precios 79, PDV, productos). |
| Escalas | ✅ | Productos a escala real. El material real siempre va enmascarado y nunca a pantalla completa. |
| Legibilidad (22 px) | ✅ con 1 pendiente | Pantallas legibles en las escenas 3, 4, 7, 8, 10 y 11. Pendiente: en la escena 6 el chat se ve a escala 0,8 y queda por debajo de 22 px; no está pensado para leerse palabra por palabra. |
| Transiciones | ✅ 6 tipos | Shape morph ×5 (2, 5, 6, 8, 12), zoom through ×2 (3, 9), match cut ×2 (4, 10), push-out ×2 (7, 11), object wipe ×1 (1), mask reveal ×1 (13). |
| Texto en pantalla | ✅ | Solo los 6 textos permitidos. |
| Personajes ilustrados | ✅ | No aparecen (dirección v2). |

## Limitaciones del animatic (se resuelven en el draft)

- **Overlaps (escenas 5→6, 6→7, 7→8 y 8→9):** hoy la escena entrante corta sobre la saliente. En el draft el objeto del morph va a ser el mismo elemento en los dos lados.
- **Zoom through de la 9 a la 10:** entra a la pantalla del celular de la foto real, pero el encuadre de la escena 10 no coincide todavía al píxel.
- **Shape morph de las escenas 5 y 6:** tienen su comportamiento propio (trazo que se infla, burbuja que crece), pero con formas simples; falta el pulido de paths.
- **Sonido:** no hay audio. Los markers están en `markers.csv` (`npm run export-markers`).
