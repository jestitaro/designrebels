# Storyboard técnico — Brand animation QuartzSales

Fase 1. Fuente de verdad del timing: `src/timeline.ts`. Los markers de sonido salen de `src/markers.ts` (`npm run export-markers`).

- **Duración:** 65,9 s. El brief pedía unos 68; se ajusta cuando llegue la VO.
- **Frames:** van a 30 fps (animatic). A 60 fps se duplican; los segundos no cambian.
- **Cámara:** `x`, `y` en px de mundo (1920×1080, centro 960/540) y `zoom`. Curva `easeInOut` salvo que se indique otra.
- **Capas:** fg 1.4 · mg 1 · bg 0.5 · sky 0 (fondo).
- **Legibilidad:** si una pantalla tiene que leerse, el caption de 12 px × zoom × escala del teléfono ≥ 22 px. Con el teléfono a escala 0.82 hace falta zoom ≥ 2.24; con escala 1.1, zoom ≥ 1.67.

## Resumen

| # | Escena | s | frames @30 | Entrada | Salida | Overlap | Personajes |
|---|---|---|---|---|---|---|---|
| 1 | Problema | 0.0–4.5 | 0–134 | — | object wipe (card) | 0 | Caro |
| 2 | Complejidad | 4.5–8.5 | 135–254 | object wipe | shape morph (compresión) | 0 | — |
| 3 | Aparece QuartzSales | 8.5–13.0 | 255–389 | shape morph | zoom through | 0 | — |
| 4 | Planificación | 13.0–18.0 | 390–539 | zoom through | match cut (pin) | 0 | — |
| 5 | Ruteo | 18.0–23.0 | 540–689 | match cut | shape morph (línea de ruta) | 0.4 | — |
| 6 | Comunicación | 22.6–27.6 | 678–827 | shape morph | shape morph (mensaje → form) | 0.4 | Nico fg · Caro bg |
| 7 | Captura de datos | 27.2–32.2 | 816–965 | shape morph | push-out | 0.3 | — |
| 8 | Tiempo real | 31.9–37.9 | 957–1136 | push-out | shape morph (gráfico → góndola) | 0.5 | — |
| 9 | AiFred | 37.4–42.4 | 1122–1271 | shape morph | zoom through | 0 | Nico |
| 10 | Visión artificial | 42.4–49.4 | 1272–1481 | zoom through | match cut | 0 | — |
| 11 | Offline | 49.4–54.4 | 1482–1631 | match cut | push-out | 0 | — |
| 12 | Ecosistema | 54.4–59.4 | 1632–1781 | push-out | shape morph (colapso) | 0 | — |
| 13 | Transición a marca | 59.4–62.4 | 1782–1871 | shape morph | mask reveal | 0.5 | — |
| 14 | Cierre | 61.9–65.9 | 1857–1976 | mask reveal | — | — | — |

**Conteo de transiciones** (6 tipos, ninguno fuera de la familia):

| Tipo | Veces | Escenas |
|---|---|---|
| Shape morph | 5 | 2, 5, 6, 8, 12 |
| Zoom through | 2 | 3, 9 |
| Match cut | 2 | 4, 10 |
| Push-out | 2 | 7, 11 |
| Object wipe | 1 | 1 |
| Mask reveal | 1 | 13 |

---

## 1 · Problema — 0.0–4.5 s (f 0–134)

**Qué pasa:** Caro aparece chica en una composición amplia sobre violeta oscuro. A su alrededor aparecen, en profundidad, cards reales: ListRow de visitas, Toast de alertas, FormField, KPI y MapCard. La cámara hace push-in y las cards se multiplican. Al final, una card pasa delante de cámara y cubre el frame.

- **Cámara**
  - t0: `960, 560, z 0.9`
  - t3.2: `1010, 540, z 1.15`
  - t4.5: el ObjectWipe cubre el frame. La cámara no se mueve; se mueve la card.
- **Capas**
  - sky: `GradientBackground arc="problem"`
  - bg: 6–8 cards chicas sobre tercios, con DepthBlur (única capa con blur)
  - mg: Caro (`estres` → swap a `pensando` en t2.2) a 300 px de alto, en el tercio izquierdo, y 3 cards cercanas
  - fg: 2 cards grandes que cruzan con drift
- **Salida:** `ObjectWipe` de la card ChartCard `bars` desde (1320, 330), t3.6 → 4.5. Esa card es el primer plano de la escena 2.
- **Markers:** 0.6 cardEntry · 1.4 cardEntry · 2.2 notification · 3.0 cardEntry · 3.9 whoosh

## 2 · Complejidad — 4.5–8.5 s (f 135–254)

**Qué pasa:** arranca con la card del wipe a pantalla completa y la cámara se aleja hacia una nube de cards y pantallas: rutas, PDVs, formularios, tareas e indicadores. La cámara la atraviesa con parallax fuerte. Después todo se comprime y se alinea.

- **Cámara**
  - t0: `zoomToRect(card)`
  - t0.8: `960, 540, z 1`
  - t2.6: `1100, 520, z 1.6` (atraviesa)
  - t4: `960, 540, z 1`
- **Capas**
  - sky: problema con `driftAmount` 60
  - bg: pantallas enteras de teléfono (VisitsScreen, FormScreen) a escala 0.5 y sin device
  - mg: cards
  - fg: 3 cards con parallax 1.4 que pasan muy cerca de cámara
- **Salida:** shape morph de compresión, t2.8 → 4. Cada card interpola su rect hacia una grilla vertical centrada del ancho de la pantalla del teléfono (390 × escala). El stack comprimido es el primer frame de la escena 3.
- **Markers:** 0.2 whoosh · 1.8 whoosh · 3.3 whoosh

## 3 · Aparece QuartzSales — 8.5–13.0 s (f 255–389)

**Qué pasa:** el teléfono entra desde abajo a la derecha y las cards se magnetizan hacia su pantalla (spring `magnet`, estela con 2 copias al 30 % y 15 % de opacidad, retrasadas 2 y 4 frames). El fondo pasa de problema a solución: es el primer alivio.

- **Cámara**
  - t0: `960, 540, z 1`
  - t2.8: `1120, 540, z 1.2`
  - t4.5: `zoomToRect(phoneScreenRect(1120, 540, 0.9))`
- **Capas**
  - sky: `GradientBackground mix` 0 → 1 entre t1.6 y t3
  - bg: Rings y blobs de solución
  - mg: Phone a escala 0.9 con VisitsScreen (progress entra en t2)
  - fg: la estela de las cards
- **Salida:** zoom through. En t4.5 la pantalla llena el frame y la escena 4 arranca con la misma VisitsScreen a escala 1.
- **Markers:** 0.5 whoosh · 1.6 cardEntry · 2.4 success · 4.1 whoosh

## 4 · Planificación — 13.0–18.0 s (f 390–539)

**Qué pasa:** la pantalla de visitas ocupa el frame y las cards de visita entran y se ordenan; se marca el PDV activo. Después hay un zoom out y aparece el teléfono flotante. Alrededor surgen pines, rutas, avatares del equipo (TEAM) y badges chicos, sin saturar.

- **Cámara**
  - t0: `zoomToRect(screen)`, con la UI legible (caption ≈ 29 px)
  - t2.2: hold
  - t3.6: `960, 540, z 1`
  - t5: `1000, 520, z 1.08`
- **Capas**
  - sky: solución
  - bg: MapCard grande desenfocado (sin blur: opacidad 0.5 y escala 1.6)
  - mg: Phone a escala 0.9 con VisitsScreen (`highlight` 1)
  - fg: 3 pines con número, 2 avatares y Badge "Ruta optimizada"
- **Salida:** match cut. El pin 4 queda en (1260, 520) a escala 1 y la escena 5 arranca con ese mismo pin en esa misma posición.
- **Markers:** 0.3 cardEntry · 0.9 cardEntry · 1.5 tap · 2.8 whoosh · 3.6 notification

## 5 · Ruteo — 18.0–23.0 s (f 540–689)

**Qué pasa:** el pin sale de la pantalla y la cámara lo sigue. El fondo se vuelve mapa (`StyledMap` a pantalla completa) y la ruta se dibuja con `evolvePath`. El teléfono reaparece de costado y la ruta termina en un PDV.

- **Cámara**
  - t0: `1260, 520, z 1`
  - t1.2: `1180, 480, z 1.25`, siguiendo el pin
  - t3.6: `960, 540, z 1`
  - t5: `900, 560, z 0.95`
- **Capas**
  - sky: StyledMap a 1920×1248
  - mg: ruta y paradas
  - fg: Phone entrando desde la izquierda con PricesScreen parcial y ListRow del PDV destino flotando
- **Salida:** shape morph de la línea de ruta, t4.4 → 5. El último tramo de la ruta se engrosa y se redondea hasta ser la burbuja de chat de la escena 6.
- **Markers:** 0.4 whoosh · 1.2 whoosh · 3.8 success

## 6 · Comunicación — 22.6–27.6 s (f 678–827)

**Qué pasa:** un elemento del mapa se transforma en burbuja de chat. Nico está en foreground y Caro más atrás; los mensajes flotan entre los dos y el teléfono queda como elemento intermedio. No van uno a cada lado.

- **Cámara**
  - t0: `960, 540, z 1.1`
  - t2.5: `1000, 540, z 1`
  - t5: `1040, 520, z 1.05`
- **Capas**
  - sky: solución
  - bg: Caro `celular-sonriendo`, 380 px de alto, en (1450, 900)
  - mg: Phone a escala 0.8 con ChatScreen en (1160, 540) y ChatBubbles flotando entre los dos
  - fg: Nico `celular`, 820 px de alto, en (560, 1180), cortado abajo
- **Kinetic type:** "Optimiza la comunicación", headline 96/800, en el tercio superior izquierdo, t2.4 → 4.2 (entra por palabras)
- **Salida:** shape morph del mensaje al form, t4.4 → 5. La última ChatBubble se interpola hasta el rect de la Card de formulario.
- **Markers:** 0.3 notification · 1.4 notification · 2.4 cardEntry

## 7 · Captura de datos — 27.2–32.2 s (f 816–965)

**Qué pasa:** el mensaje crece hasta volverse una card de formulario. Zoom in: el formulario ocupa la pantalla. Hay tap, check y avance del progress. Las cards de datos salen del teléfono hacia el espacio.

- **Cámara**
  - t0: `960, 540, z 1`
  - t1: `zoomThroughPhoneArea(form)`, con la UI legible
  - t3: hold
  - t5: `960, 540, z 0.85` (push-out)
- **Capas**
  - sky: solución
  - mg: Phone a escala 1 con FormScreen (`press` en t0.8, `done` en t1.6)
  - fg: KPI y Toast "Formulario enviado" que salen del teléfono en diagonal
- **Kinetic type:** "Agiliza la captura de datos", t2.2 → 4
- **Salida:** push-out. Las cards salientes siguen viaje hacia la derecha y son las que llegan al dashboard de la escena 8.
- **Markers:** 0.8 tap · 1.6 success · 2.4 cardEntry · 4.6 whoosh

## 8 · Información en tiempo real — 31.9–37.9 s (f 957–1136)

**Qué pasa:** las cards vuelan hacia un Laptop con dashboard. Los KPIs se animan por etapas, nunca todos juntos: count up → barras → gauges (medio círculo) → OSA → alertas.

- **Cámara**
  - t0: `900, 540, z 0.9`
  - t1.2: `960, 520, z 1`
  - t3.6: `1080, 500, z 1.3`, sobre los gauges
  - t6: `960, 540, z 1.05`
- **Capas**
  - sky: solución
  - mg: Laptop a escala 1.1 con el dashboard (KPI × 3, ChartCard bars y GaugeCard × 3)
  - fg: IndicatorCard y Toast "12 alertas" flotando
- **Kinetic type:** "Información en tiempo real", t1.6 → 3.4
- **Salida:** shape morph del gráfico a la góndola, t5.4 → 6. La barra más alta de ChartCard se estira en horizontal hasta ser el estante de la escena 9.
- **Markers:** 0.6 cardEntry · 1.5 cardEntry · 2.6 cardEntry · 3.4 success · 4.3 notification · 5.5 whoosh

## 9 · AiFred — 37.4–42.4 s (f 1122–1271)

**Qué pasa:** entorno de supermercado. Nico entra caminando con travelling lateral, sobre góndolas con `Shelf` a escala real (sin marcas ni texto legible; lavandina 25 cm, crema dental 11,5 cm). Levanta el celular y la cámara hace zoom through.

- **Cámara**
  - t0: `600, 540, z 1`
  - t3: `1200, 540, z 1` (travelling)
  - t3.4: hold
  - t5: `zoomToRect(pantalla del celular)`
- **Capas**
  - sky: pasillo (gradiente claro con 2 góndolas de fondo)
  - bg: Shelf × 2 con parallax 0.5
  - mg: góndola principal (lavandina, ropa, cuidado personal)
  - fg: Nico. Usa `CharacterWalk` en t0 → 3.2 y después hace swap a `producto-celular` → `celular`.
- **Salida:** zoom through al celular de Nico. Queda pendiente el PNG con el celular en primer plano: hoy se usa `mostrando-pantalla`.
- **Markers:** 0.3 whoosh · 3.4 tap · 4.6 whoosh

## 10 · Visión artificial — 42.4–49.4 s (f 1272–1481)

**Qué pasa:** el celular ocupa la pantalla, sobre la góndola. La detección es progresiva y sigue este orden:

1. ScanLine, t0.4 → 1.4
2. primera DetectionBox, t1.6
3. cascada de detecciones con stagger de 0.25 s, t2.2 → 3.4
4. precios (PriceTag), t4.2
5. validación contra planograma con checks, t5.2 → 6.4

AiFred se presenta como IA aplicada: nada aparece de golpe.

- **Cámara**
  - t0: `zoomToRect(pantalla)`
  - t3.5: `1000, 540, z 1.12`, push-in leve
  - t7: igual
- **Capas**
  - sky: Shelf de la escena 9 a escala 1.4, el mismo plano
  - mg: UI de cámara (overlay oscuro, "Finalizar reconocimiento") con DetectionBox y ScanLine
  - fg: panel de ítems reconocidos (ProductThumb + EAN)
- **Salida:** match cut. El header de la UI de cámara se conserva y la escena 11 arranca con esa misma pantalla.
- **Markers:** 0.5 scan · 1.6 cardEntry · 2.4 cardEntry · 3.0 cardEntry · 4.4 cardEntry · 5.4 success · 6.2 success

## 11 · Offline — 49.4–54.4 s (f 1482–1631)

**Qué pasa:** aparece el badge "Modo sin conexión" y la interfaz sigue funcionando. Hay un check con "Guardado localmente" y el indicador de sync pendiente. Vuelve la conectividad y se completa el sync.

- **Cámara**
  - t0: `960, 540, z 1.25`, sobre OfflineScreen
  - t3.4: hold
  - t5: `960, 540, z 0.9` (push-out)
- **Capas**
  - sky: solución algo más fría (mix 0.85)
  - mg: Phone a escala 1 con OfflineScreen. El estado va `offline` → `saved` → `pending` → `syncing` (con `syncProgress`) → `synced`.
  - fg: SyncIndicator grande flotando y Toast
- **Kinetic type:** "Incluso sin conexión", t1.2 → 3
- **Salida:** push-out continuo hasta el plano abierto de la escena 12.
- **Markers:** 0.4 notification · 1.6 tap · 2.2 success · 3.6 sync · 4.4 success

## 12 · Ecosistema — 54.4–59.4 s (f 1632–1781)

**Qué pasa:** zoom out del teléfono. A su alrededor aparecen los módulos Ejecución, Indicadores, Información, Gestión y AI como cards con UI real (no íconos gigantes), conectados en órbitas suaves (Rings con dash que rota).

- **Cámara**
  - t0: `960, 540, z 1.1`
  - t1.4: `960, 540, z 0.8`
  - t4: `960, 540, z 0.78`
  - t5: `960, 540, z 0.9`
- **Capas**
  - sky: solución
  - bg: Rings
  - mg: Phone a escala 0.7 en el centro y 5 módulos en órbita. Cada módulo es una card chica con su UI: GaugeCard, MapCard, ChatBubble, CategoryAccordion y DetectionBox.
- **Salida:** shape morph de colapso, t4 → 5. Los módulos convergen al centro y se reducen.
- **Markers:** 0.6 whoosh · 1.4 cardEntry · 2.2 cardEntry · 3.0 cardEntry · 4.6 whoosh

## 13 · Transición a marca — 59.4–62.4 s (f 1782–1871)

**Qué pasa:** los módulos colapsados se transforman en los 20 triángulos del isotipo (`IsoTriangles`, paths del SVG oficial). Cada partícula viaja a su triángulo con spring `soft` y stagger radial desde el centro. Rotación de −40° a 0° y escala de 0.3 a 1.

- **Cámara:** `960, 540, z 1`, fija
- **Capas**
  - sky: fondo solución → blanco
  - mg: IsoTriangles a 360 px en el centro
- **Salida:** mask reveal, t2.5 → 3. El fondo de cierre se revela desde el centro con una máscara blob.
- **Markers:** 0.4 whoosh · 2.0 logoReveal

## 14 · Cierre — 61.9–65.9 s (f 1857–1976)

**Qué pasa:** fondo blanco o violeta muy claro. Primero se ve el isotipo, después el wordmark.

- **Cámara:** fija
- **Capas**
  - sky: `GradientBackground arc="closing"`
  - mg:
    - Logo `fullColor` a 110 px de alto. El isotipo se desplaza a la izquierda y entra el wordmark con mask reveal lateral entre t0.6 y t1.2.
    - "QuartzSales Trade Marketing" en tagline 48/700, `primary`, t1
    - "Llevá tu negocio al futuro." en tagline 48/700, t1.8
- **Hold:** t2 → 4 (2 s)
- **Markers:** 0.3 logoReveal · 1.0 cardEntry · 1.8 cardEntry

---

## Pendientes y decisiones abiertas

- **Caminata de Nico (escena 9):** los fotogramas actuales son una sola fase de la zancada. Esperamos los de la fase opuesta; mientras tanto se usa `CharacterWalk` con swap y rebote vertical.
- **Nico levantando el celular (escena 9 → 10):** el zoom through queda más limpio con un PNG del celular de frente. Hoy se resuelve con `mostrando-pantalla`.
- **Música:** los cortes se alinean al beat cuando llegue el BPM. Los markers están en `markers.ts`.
- **Duración total:** 65,9 s contra los 68 del brief. Hay margen para estirar holds (escenas 4, 10 y 14) cuando esté la VO.
