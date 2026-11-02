# The Rebel Run — prompt para Claude Code

> Pegá este prompt en Claude Code dentro de una carpeta vacía (o el repo donde viva el proyecto) y adjuntá `rebel-run.html`, el prototipo de referencia.

---

## Rol y forma de trabajo

Sos un/a ingeniero/a frontend senior con criterio de product designer. Vas a construir **The Rebel Run**, una web app interna de QuartzSales para una carrera a distancia entre equipos. El archivo `rebel-run.html` adjunto es el **prototipo de referencia aprobado**: respetá su arquitectura de UX, jerarquía visual, copy, tokens y micro-interacciones. No es código para copiar tal cual: es la especificación viva. Si algo del prototipo es técnicamente frágil, mejoralo sin cambiar la experiencia.

Antes de escribir código:
1. Leé el prototipo completo y resumime en 10 líneas qué entendiste (pantallas, estados, tokens, copy por tema).
2. Proponé el stack y la arquitectura (ver "Decisiones que tomás vos") en un plan corto con fases.
3. Listá las preguntas que realmente bloquean (máximo 5). Lo demás, decidilo y anotalo en `DECISIONS.md`.

Trabajá por fases, con commits chicos y descriptivos. Al cerrar cada fase, corré la app, verificá en viewport mobile (390×844) y desktop (1440×900), y contame qué quedó y qué falta.

Idioma de la UI: **español rioplatense (vos)**. Código, nombres de variables y commits en inglés.

**Tono del copy: profesional.** Claro, directo, sin juegos de palabras ni términos aniñados ("hechizo", "aquelarre", "fantasmas", "sellar", etc.). La temática de Halloween se expresa en lo visual (paleta, tipografía, decoración), no en el texto. El copy del prototipo ya está en ese tono: usalo como base.

---

## Producto

**Equipos = casas.** Para el lanzamiento compiten cuatro casas: **Gryffindor, Slytherin, Ravenclaw y Hufflepuff** (la asignación de personas ya está definida internamente; preguntame el listado). En toda la UI se dice "casa", no "equipo". Los nombres, iniciales y colores de las casas son **datos editables desde admin**, no constantes en el código: después de Halloween se van a renombrar.

**Qué es:** una landing con vista de aplicación (en desktop, el teléfono convive con un hero; en mobile, la app ocupa toda la pantalla) donde todas las personas de QuartzSales suman kilómetros caminando o corriendo para su equipo.

**Ciclo de vida:** se lanza para **Halloween 2026** con una piel temática, pero tiene que seguir funcionando después **sin temática**. El tema es una capa intercambiable, nunca lógica de negocio.

**Usuario tipo:** gente de oficina, no atletas. Usa el celular en la calle, con una mano, a veces con guantes o transpirada. Prioridad: claridad, botones grandes, cero fricción, feedback inmediato.

### Pantallas (mismas que el prototipo)

1. **Onboarding (3 pasos):** nombre → elegir equipo (cards con selección animada) → objetivo personal (5/10/21/42 km). En producción el nombre viene del login; el paso 1 pasa a ser confirmación/alias.
2. **Inicio:** anillo de progreso personal vs. objetivo, próximo hito, CTA "Iniciar actividad" + "Manual", card del equipo (posición, barra de progreso hacia meta de equipo), meta colectiva de toda la empresa con un "caminante" que avanza sobre la barra, historial de actividades.
3. **Correr:** selector GPS / Demo (demo solo visible en entorno dev o con flag), indicador de señal GPS (3 barras por precisión), dial con km grandes + tiempo, órbita animada que gira solo mientras corrés, ritmo /km, total acumulado, botón play/pause que morfa, botón terminar con **mantener presionado 1,1 s** (anillo que se llena; si soltás antes, rebota y vuelve).
4. **Resumen (bottom sheet):** km editables con stepper (±0,1, con auto-repeat acelerado al mantener), tipo Caminata/Corrida, duración (solo en carga manual), Guardar / Descartar (`btn-text-danger`). Drag-to-close en carga manual.
5. **Ranking:** mapa con camino sinuoso SVG y fichas de equipo posicionadas con `getPointAtLength` según % de la meta; segmented Equipos/Personas; lista con reordenamiento animado (FLIP).
6. **Logros:** grilla de hitos (1, 5, 10, 21, 42, 60 km) bloqueados/desbloqueados, cards que se dan vuelta al tocarlas. Al cruzar un hito: overlay de desbloqueo con giro 3D + burst de partículas + vibración.
7. **Live activity:** si hay una actividad en curso y navegás a otra tab, aparece una píldora en el header con tiempo y km (tap = volver a Correr) y un punto pulsante en la tab Correr.

---

## Sistema de temas (lo más importante de la arquitectura)

- Todos los colores, tipografías, radios y sombras son **tokens CSS** definidos por `[data-theme="base"]` y `[data-theme="halloween"]`. Ningún componente usa un hex directo.
- El **copy** vive en diccionarios por tema (`copy/base.ts`, `copy/halloween.ts`) con las mismas keys. El componente pide `t('runPaused')`, nunca un string literal temático.
- La **decoración** (luna, niebla, murciélagos, telaraña, lápidas, calabazas, fantasma mascota, costuras punteadas en cards) se monta en componentes `<ThemeOnly theme="halloween">` y se puede borrar sin romper nada.
- **Tema activo:** configurable desde backend (flag global con fecha de inicio/fin, ej. hasta el 2 de noviembre) + override por usuario. Cambio de tema con View Transitions API: revelado circular desde el botón que lo dispara; fallback a cambio directo.
- Debe ser trivial agregar un tercer tema (ej. "Fin de año") creando tokens + copy + decoración, sin tocar componentes.

### Tokens de referencia (del prototipo)

| Token | Base | Halloween |
|---|---|---|
| bg / surface / surface-2 | #f3f3fa / #fff / #f2f2fa | #130a1f / #221338 / #2c1a47 |
| ink / muted | #17172b / #6b6b88 | #f5ecd9 / #b9a8d2 |
| accent / accent-2 | #6366f1 / #10b981 | #ff9a1f / #8fd3c8 |
| danger | #ef4444 | #ff6474 |
| display / body | Poppins 700 / Poppins | Mystery Quest / Lato |
| casas t0–t3 (fondo / texto) | rojo #c0392b, verde #1f8a5b, azul #2f5fb3 (texto blanco), amarillo #e0a91b (texto #1d1405) | versiones más claras para fondo oscuro: #e2493b, #2fa874, #4a7fd6, #efbe3a |

### Restricción de IP (no negociable)

La estética está inspirada en el cine stop-motion gótico y caprichoso, pero **no** se usa ningún personaje, logo, ilustración, tipografía oficial, frase ni elemento icónico de *The Nightmare Before Christmas* ni de Disney. Todo el arte es original: SVG propios (fantasma, calabaza genérica, murciélago, lápida, luna, camino sinuoso). Si generás o pedís ilustraciones nuevas, que sean originales.

Lo mismo para las casas: se usan **solo sus nombres como texto** y un color plano por casa. Nada de escudos, animales emblema, lemas, tipografías ni identidad visual oficial de Harry Potter / Warner Bros. El badge de cada casa es su inicial sobre su color.

---

## Registro de actividad (iniciar / pausar como un reloj)

Modo principal: **GPS en el navegador + fallback de corrección manual.**

- `navigator.geolocation.watchPosition` con `enableHighAccuracy: true`.
- Filtros: descartar puntos con precisión > 35 m; ignorar deltas < 3 m (jitter); descartar saltos con velocidad implícita > 9 m/s; al pausar, resetear el último punto para no sumar lo recorrido durante la pausa.
- Distancia con Haversine. Tiempo con `performance.now()` acumulado (no con `setInterval` contando segundos).
- **Wake Lock API** para mantener la pantalla encendida mientras corre; re-solicitarlo en `visibilitychange`. Avisar con microcopy que si se bloquea la pantalla el navegador puede pausar el GPS.
- **Persistir la sesión en curso** (IndexedDB/localStorage) cada pocos segundos: si el navegador mata la pestaña, al volver se ofrece "Tenés una actividad sin terminar: retomar / guardar / descartar".
- Al terminar, siempre se muestra el resumen editable: la persona puede corregir con lo que marcó su reloj.
- Carga manual independiente para actividades hechas sin el celular.
- Estados de error claros: permiso denegado, sin señal, dispositivo sin GPS → sugerir carga manual sin bloquear el cronómetro.
- Evaluá y dejá documentado (no implementado en v1) cómo sumar integración con Strava / Google Fit / Apple Health.

### Reglas anti-trampa livianas (v1)
- Velocidad media máxima por actividad (ej. 20 km/h); por encima, se marca para revisión.
- Tope diario por persona (configurable, ej. 30 km).
- Las actividades guardan `source: gps | manual` y, si fue editada, `km_measured` y `km_reported`. El ranking puede mostrar ambas cosas a admins.

---

## Backend y datos

Los datos son **compartidos de verdad** entre todas las personas de la empresa.

- Auth: login con Google restringido al dominio corporativo de QuartzSales (preguntame cuál si no está claro). Nada de passwords propias.
- Modelo mínimo: `users` (id, name, avatar, team_id, goal_km, theme_override), `teams` (id, name, short, color, color_ink, goal_km, season) — editables desde admin, `activities` (id, user_id, km, km_measured, secs, type, source, started_at, created_at, flagged), `settings` (company_goal_km, active_theme, theme_until, milestones).
- Agregados (km por equipo, por persona, total empresa) calculados en la base (vistas o funciones), no en el cliente.
- Ranking en vivo con suscripción realtime o polling corto; la UI anima los cambios (FLIP + tween de números).
- Reglas de seguridad: cada persona solo crea/edita/borra sus actividades; equipos y settings solo admin.
- Panel admin mínimo (puede ser una ruta protegida simple): crear equipos, mover personas, ver actividades marcadas, cambiar tema activo y metas.
- Seed de datos para desarrollo con las cuatro casas y personas ficticias como en el prototipo.

---

## Decisiones que tomás vos (justificalas en `DECISIONS.md`)

- **Stack** (framework, estilos, backend). Criterios: liviano, rápido en mobile 4G, deploy simple, realtime sencillo, fácil de mantener por una sola persona diseñadora. El sitio actual vive en Cloudflare Pages; considerá mantenerlo ahí.
- Si conviene PWA (instalable, ícono en home). Recomendado si no complica.
- Librería de animación solo si aporta algo que CSS + WAAPI no resuelven bien.

---

## Micro-interacciones (todas presentes en el prototipo; mantenelas o mejoralas)

- Play → pause con morph de ícono (escala + rotación) y botón que pasa de círculo a squircle; ripple continuo mientras corre.
- Órbita del dial: un murciélago (Halloween) o un punto (base) gira solo en estado running; se congela en pausa.
- Progreso del km en curso dibujado en el anillo exterior.
- Mantener para terminar: anillo de progreso, vibración al inicio, shake + rebote si soltás antes.
- Números que cuentan hasta el valor nuevo (ease-out quart), nunca saltan.
- Barras con relleno animado; en Halloween, rayado tipo caramelo en movimiento.
- Al guardar: el "+X km" vuela hacia el anillo, toast temático, burst de partículas (murciélagos y calabazas / confeti de puntos), ranking se reordena animado.
- Desbloqueo de hito: overlay con card que gira en 3D, ícono flotando, vibración patrón.
- Tab bar con indicador que se desliza con spring; en Halloween un murciélago "asoma" sobre el indicador.
- Onboarding: selección de equipo con tilt, check que aparece con spring, badge que rota.
- Segmented controls con píldora deslizante.
- Stepper con auto-repeat acelerado y "bump" del número.
- Cambio de tema con revelado circular (View Transitions).
- Landing desktop: palabras del título que saltan al hover, luna que respira, niebla que deriva, murciélagos cruzando, título con parpadeo de vela.
- Hápticos con `navigator.vibrate` donde exista.

Reglas: duraciones 150–500 ms para feedback, hasta ~1,3 s solo para progreso. Easing spring `cubic-bezier(.34,1.56,.64,1)` para elementos que "aparecen", out `cubic-bezier(.22,1,.36,1)` para movimientos. Animar solo `transform` y `opacity` (y `stroke-dashoffset` en SVG). **`prefers-reduced-motion` desactiva partículas, órbita, bursts y vuelos**, manteniendo los cambios de estado instantáneos.

---

## Accesibilidad y calidad

- Contraste AA en ambos temas (verificalo; el naranja sobre violeta oscuro y el muted sobre surface son los puntos a mirar).
- Targets táctiles ≥ 44×44 px; controles principales de carrera ≥ 72 px.
- Mantener-para-terminar tiene alternativa por teclado (Enter/Espacio) y lector de pantalla (`aria-label` descriptivo).
- `aria-live="polite"` para estado de carrera y toasts; no anunciar el cronómetro cada segundo.
- Navegación por teclado completa, foco visible con el accent, foco atrapado en sheets y overlays, Escape cierra.
- Tabular nums en todos los números.
- Lighthouse mobile ≥ 90 en performance y accesibilidad. Fuentes con `display=swap` y fallback métrico parecido.
- Funciona en Safari iOS y Chrome Android (probá Wake Lock y geolocalización en ambos; documentá diferencias).

---

## Fases sugeridas

1. **Fundaciones:** stack, tokens y sistema de temas, layout landing + device, tab bar, navegación entre pantallas.
2. **Motor de carrera:** GPS, cronómetro, pausa, wake lock, recuperación de sesión, resumen editable, carga manual. Con datos locales.
3. **Backend:** auth por dominio, modelo, reglas, agregados, realtime, seed.
4. **Ranking, logros y meta colectiva** conectados a datos reales.
5. **Pulido de micro-interacciones**, reduced motion, accesibilidad, PWA.
6. **Admin + deploy** y guía corta en `README.md` para cambiar el tema y las metas sin tocar código.

## Criterios de aceptación

- Puedo renombrar las casas y cambiar sus colores desde admin sin tocar código.
- Puedo apagar Halloween desde settings y la app queda coherente, sin restos de decoración ni copy temático.
- Una persona nueva entra con Google, elige equipo y objetivo en menos de 30 segundos.
- Iniciar, pausar, reanudar y terminar funciona con una mano y sin mirar la pantalla más de un segundo.
- Si cierro la pestaña en medio de una actividad, al volver puedo recuperarla.
- Dos personas de distintos equipos ven el ranking actualizarse sin recargar.
- Con `prefers-reduced-motion` no hay animaciones decorativas.
- Ningún asset ni texto remite a personajes o marcas de terceros.
