# QuartzSales Calendar

App personal para planificar las comunicaciones internas de QuartzSales: fechas especiales por país y región (efemérides, fiestas, días profesionales, cultura pop), saludos para el equipo y recordatorios. Se usa en la compu o en el celular y se instala como app (PWA).

Se publica en `designrebels.pages.dev/projects/quartzsales-calendar/`.

**Sin backend, sin login, sin servicios externos ni pagos.** Todo se guarda en el navegador de cada dispositivo.

---

## Qué hay en esta carpeta

```text
projects/quartzsales-calendar/
├── index.html, assets/, icons/,        ← versión publicada (la genera el build,
│   sw.js, workbox-*.js,                   no se edita a mano)
│   manifest.webmanifest
├── README.md                           ← este archivo
└── source/                             ← código fuente (React + TypeScript + Vite)
```

El sitio de Design Rebels sirve los archivos tal como están commiteados, sin ningún paso de build. Por eso el build de esta app se commitea ya generado, igual que el resto de los proyectos, y no hace falta tocar la configuración de Cloudflare.

---

## Logo de QuartzSales

El logo es el isotipo oficial (`source/public/brand/iso-qs.svg`, servido desde la propia app para que funcione offline) más el wordmark "QuartzSales" tipeado en Nunito, igual que en el dashboard.

---

## Correrla en la compu (desarrollo)

Necesitás [Node.js](https://nodejs.org) 20 o superior.

```bash
cd projects/quartzsales-calendar/source
```

```bash
npm install
```

```bash
npm run dev
```

Abrí la URL que aparece (por ejemplo `http://localhost:5173`).

Otros comandos útiles:

| Comando | Qué hace |
|---|---|
| `npm test` | Corre los tests |
| `npm run build` | Revisa tipos, genera la versión publicada y la copia a `projects/quartzsales-calendar/` |
| `npm run preview` | Sirve el repo entero en `http://localhost:4173/projects/quartzsales-calendar/` para probar el build en su subcarpeta real |

---

## Publicar una versión nueva en Design Rebels (paso a paso)

1. **Generá el build** (desde `projects/quartzsales-calendar/source`):
   ```bash
   npm run build
   ```
   Tiene que terminar con `Build publicado en …/projects/quartzsales-calendar`. Si aparece un error, no sigas: el build no se publica.
2. **Probalo localmente** (opcional, recomendado):
   ```bash
   npm run preview
   ```
   Abrí `http://localhost:4173/projects/quartzsales-calendar/` y navegá un poco.
3. **Commiteá todo lo de `projects/quartzsales-calendar/`**: el código de `source/` y los archivos generados (`index.html`, `assets/`, `icons/`, `sw.js`, `workbox-*.js`, `manifest.webmanifest`). Que se borren archivos viejos de `assets/` es normal: cada build genera nombres nuevos.
4. **Subí los cambios** a la rama de producción del repo (o mergeá el PR). Cloudflare Pages publica solo cuando detecta el cambio, en uno o dos minutos.

### Verificar que quedó bien

- Abrí `https://designrebels.pages.dev/projects/quartzsales-calendar/`. Tiene que cargar el Inicio.
- Recargá estando en cualquier pantalla (por ejemplo `…/#/saludos`): no tiene que dar 404.
- En **Configuración**, al pie, figura `build dd/mm/aaaa hh:mm`. Tiene que coincidir con el build que acabás de publicar.
- Abrí otro proyecto (por ejemplo `/projects/the-rebel-run/`) y confirmá que funciona igual que antes.

### En el celular

1. Abrí la URL en Chrome (Android) o Safari (iPhone).
2. Instalala: en Android, menú ⋮ → **Instalar app** o **Agregar a la pantalla principal**. En iPhone, botón Compartir → **Agregar a inicio**.
3. Abrila desde el ícono: se ve a pantalla completa y funciona sin conexión.

### Forzar la actualización

La app **se actualiza sola**: al abrirla (y cada hora, y al volver a la pestaña) busca una versión nueva, la activa y recarga. Tus datos no se tocan. Si alguna vez aparece **"Hay una versión nueva — Recargar"**, tocá **Recargar**.

Si aun así ves una versión vieja: cerrá todas las pestañas de la app y abrila de nuevo. Como último recurso, borrá los datos del sitio desde la configuración del navegador, pero **antes exportá un respaldo**, porque eso también borra tus eventos y saludos.

---

## Qué guarda cada cosa

- **Fecha:** nombre, categoría, país, cuándo (todos los años, solo una vez o una regla como "3.er domingo de octubre" o "según Pascua"), si es feriado, para qué áreas es el saludo y un link de imagen opcional.
- **Ediciones:** cuando una fecha se hace en otro día según la provincia o la ciudad (como la Noche de los Museos), cada lugar es una edición con su fecha, horario (puede pasar la medianoche, ej. 19 a 2 h), nombre local opcional, link y estado (confirmada o pendiente). Se cargan en el detalle de la fecha con **Agregar edición**; **Duplicar** copia una edición para cambiar solo el lugar y la fecha. En el calendario se ve "Noche de los Museos · Córdoba", y "A quién saludar" usa el lugar de cada edición. Las que ya pasaron se ven atenuadas ("Ya se hizo"). No se repiten solas: el año siguiente se cargan de nuevo cuando haya fecha confirmada.
- **Saludo:** el texto, un link de imagen y el estado (pendiente, listo o compartido). "Copiar mensaje" lo copia para pegarlo donde quieras.
- **Imágenes:** la app no genera ni guarda imágenes, solo el link. Pedile la imagen a Claude en el chat, guardala en Drive, Canva o donde prefieras y pegá el link en la fecha o en el saludo.

---

## El equipo

En **Inicio** (tarjeta "El equipo hoy") y en el panel de cada día del calendario ves:

- **A quién saludar:** las personas del país de cada fecha (las internacionales son para todos). Si la fecha indica áreas, como el Día de la Usabilidad para Producto y Diseño, solo esas.
- **De feriado:** quienes viven en un país donde ese día es feriado. Si el feriado se traslada, cuenta el día trasladado.
- **De vacaciones:** según las vacaciones cargadas en cada persona.

Con **"Copiar semana para Slack"** (en la misma tarjeta) se copia un resumen de la semana del día elegido —quién está de feriado cada día y quién de vacaciones— con formato de Slack, para pegarlo en #general y fijarlo. No hay conexión con Slack: se pega a mano.

El equipo se carga en **Configuración → Equipo**: agregar personas, editar puestos y áreas (el organigrama puede cambiar), desactivar a quien se va, cargar vacaciones, o importar y exportar el archivo del equipo. **Los datos del equipo no están en el código ni en el sitio publicado:** viven solo en el navegador de quien los carga y se incluyen en el respaldo JSON.

---

## Respaldos

Tus datos viven **solo en el navegador y el dispositivo donde los cargaste**. No hay nube ni sincronización.

- **Exportar:** Configuración → **Exportar todo (JSON)**. Descarga un archivo con eventos, saludos, configuración, países y categorías. Guardalo en un lugar seguro (Drive, por ejemplo). La app muestra la fecha del último respaldo.
- **Importar:** Configuración → **Importar respaldo**. Antes de aplicar nada, muestra cuántos registros son nuevos, cuántos duplicados y cuántos tienen conflicto, y te deja elegir:
  - **Combinar:** suma lo nuevo y, en los conflictos, se queda con la versión editada más recientemente.
  - **Reemplazar todo:** borra lo local y carga el respaldo tal cual.
- **Pasar datos de la compu al celular:** exportá en uno e importá en el otro.
- **CSV:** para cargar muchos eventos desde una planilla, descargá la plantilla en Configuración o en Biblioteca. Antes de importar vas a ver los errores fila por fila y los posibles duplicados (mismo título, misma fecha y mismo país).
- **Calendario del celular:** con **Exportar .ics** (en Configuración, Próximos o el detalle de un evento) descargás un archivo con alarmas según los días de anticipación configurados.

---

## Limitaciones conocidas

- **Sin sincronización:** cada navegador y dispositivo tiene sus propios datos.
- **Recordatorios solo dentro de la app:** no hay notificaciones push ni con la app cerrada. Para tener alarmas, usá el export `.ics`.
- **Borrar los datos del navegador borra la app.** También puede pasar en modo incógnito o si el navegador libera espacio. Exportá respaldos seguido.
- En iPhone, Safari puede borrar los datos de sitios que no abrís por varias semanas. Instalar la app en la pantalla de inicio reduce ese riesgo.
- El selector completo de emojis es el del sistema (`Win + .` en Windows, `Ctrl + Cmd + Espacio` en Mac o el teclado del celular). La app incluye solo un set de emojis frecuentes.
- La app no descarga imágenes externas: el link de imagen de un evento se guarda solo como referencia.

---

## Datos iniciales (seed) y verificación

El catálogo inicial viaja en el código (`source/src/data/seed.ts`). Al publicar una versión con el seed actualizado, la app lo **mergea por ID sin pisar tus ediciones**: los eventos que editaste conservan tu versión, los que borraste no vuelven y los que no tocaste se actualizan.

Verificación hecha el **03/11/2026**. Las fuentes quedan documentadas acá; la app ya no las muestra. Solo se marcó como *confirmado* lo respaldado por una fuente oficial (gobierno, boletín oficial, municipio u organizador). Desde el entorno de desarrollo no se pudieron abrir directamente algunos sitios oficiales, así que la verificación se hizo con búsquedas limitadas a esos dominios.

### Confirmados (23)

| Evento | Fecha | Fuente |
|---|---|---|
| Día de la Tradición | 10/11 | [Ministerio de Cultura](https://www.cultura.gob.ar/por-que-se-celebra-el-dia-de-la-tradicion-en-argentina-8528/) |
| Día de la Soberanía Nacional | 20/11 (feriado trasladado 23/11/2026*) | [Ley 27.399](https://www.argentina.gob.ar/normativa/nacional/norma-281835/texto) |
| Día Nacional del Mate | 30/11 | [Ley 27.117](https://www.argentina.gob.ar/normativa/nacional/ley-27117-241355/texto) |
| Día del Vino Argentino Bebida Nacional | 24/11 | [argentina.gob.ar](https://www.argentina.gob.ar/noticias/vino-argentino-bebida-nacional) |
| Día de la Música | 22/11 | [Ministerio de Cultura](https://www.cultura.gob.ar/por-que-se-festeja-el-dia-de-la-musica_5127/) |
| Día de Muertos | 01–02/11 | [Secretaría de Cultura (gob.mx)](https://www.gob.mx/cultura/prensa/mexico-se-prepara-para-celebrar-a-sus-muertos) |
| Aniversario de la Revolución Mexicana | 20/11 (descanso 16/11/2026) | [PROFEDET](https://www.gob.mx/profedet/articulos/sabes-cuales-son-los-dias-de-descanso-obligatorio-para-este-2026) |
| Día Nacional del Libro (México) | 12/11 | [DOF 1979](https://dof.gob.mx/nota_detalle.php?codigo=4842539&fecha=06/11/1979) |
| Día Nacional de la Gastronomía Mexicana | 16/11 | [DOF 2016](https://www.dof.gob.mx/nota_detalle.php?codigo=5456816&fecha=14%2F10%2F2016) |
| Día de los Difuntos (Ecuador) | 02/11 | [Registro Civil](https://www.registrocivil.gob.ec/gobierno-del-ecuador-garantiza-la-atencion-del-registro-civil-durante-el-feriado-por-el-dia-de-los-difuntos-y-la-independencia-de-cuenca) |
| Independencia de Cuenca | 03/11 | [Alcaldía de Cuenca](https://www.cuenca.gob.ec/content/cuenca-tendra-mas-de-300-eventos-en-sus-fiestas-de-independencia-gracias-al-apoyo-de-la) |
| Festival Internacional de Artes Vivas de Loja 2026 | 12–22/11/2026 | [Municipio de Loja](https://www.loja.gob.ec/noticia/2026-10/presentaron-programacion-del-festival-de-artes-vivas-2026) |
| Fundación de Quito | 06/12 | [Archivo Metropolitano de Quito](http://archivoqhistorico.quito.gob.ec/index.php/quito-y-sus-historias/23-los-origenes-de-las-fiestas-de-quito) |
| Día Mundial de la Usabilidad | 2.º jueves de noviembre | [World Usability Day](https://worldusabilityday.org/) |
| Día Internacional de la Gestión de Proyectos | 1.er jueves de noviembre | [IIL](https://www.iil.com/international-project-management-day/frequently-asked-questions/) |
| Día Internacional del Diseño | 27/04 | [ICoD](https://www.theicod.org/activities/international-design-day) |
| España: Año Nuevo, Epifanía (Reyes), Viernes Santo**, Fiesta del Trabajo, Fiesta Nacional, Constitución*** y Navidad | 01/01, 06/01, Pascua −2, 01/05, 12/10, 06/12, 25/12 | [BOE-A-2025-21667](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667) |

\*\* Viernes Santo usa la regla "según Pascua" (en 2026, 3/04; en 2027, 26/03).
\*\*\* En 2026 cae domingo: varias comunidades descansan el lunes 7/12. Está cargado como feriado trasladado con la lista de comunidades del anexo del BOE, a verificar por comunidad. Las fiestas propias de cada comunidad autónoma no están cargadas.

\* El traslado al 23/11 figura en el calendario oficial de días inhábiles del Tribunal Fiscal de la Nación. Está cargado como feriado trasladado con la nota de confirmar la norma.

### Pendientes, cargados con nota (1)

| Evento | Qué falta |
|---|---|
| La Noche de las Heladerías 2026 (18/11) | La fecha solo apareció en medios. Confirmar en los canales de AFADHYA. |

### La Noche de los Museos 2026: ediciones por región

Verificado el **13/11/2026**. Todas gratuitas.

| Región | Fecha | Horario | Estado | Fuente |
|---|---|---|---|---|
| Tucumán | sáb 31/10 | — | Pendiente | No apareció en fuentes oficiales (en 2025 fue el 4/10). Confirmar con la Red de Museos de Tucumán. |
| Entre Ríos | vie 06/11 | 19 a 24 h | Confirmada | [Gobierno de Entre Ríos](https://www.entrerios.gov.ar/cultura/se-prepara-una-nueva-edicion-de-la-noche-de-los-museos-entrerrianos/) |
| Corrientes | sáb 07/11 | 18 a 1 h | Pendiente | Sin fuente oficial 2026 (en 2025 fue el 8/11). |
| Córdoba (capital e interior) | vie 13/11 | 20 a 1 h | Confirmada | [Municipalidad de Córdoba](https://cordoba.gob.ar/noche-museos-cordoba-2026/) |
| CABA | sáb 14/11 | 19 a 2 h | Confirmada | [Turismo Buenos Aires](https://turismo.buenosaires.gob.ar/es/article/la-noche-de-los-museos) |
| La Plata y Ensenada ("Museos a la luz de la luna") | sáb 14/11 | 19 a 24 h | Confirmada | [Facultad de Ingeniería UNLP](https://ing.unlp.edu.ar/noche-de-los-museos-a-la-luz-de-la-luna-2026/) |

Los sitios de Entre Ríos, Córdoba y la UNLP no se pudieron abrir desde el entorno de desarrollo: se verificaron con búsquedas sobre esos dominios oficiales.

**Podrían tener ediciones regionales pero no se cargaron:** la Noche de las Heladerías (es nacional según AFADHYA, pero algunas ciudades suman actividades propias) y otras noches de museos municipales (Mar del Plata, Rosario) que no están entre los lugares del equipo.

### Feriados nacionales

Cargados en la categoría **Feriados** (se puede ocultar del calendario en Configuración), marcados como feriado para saber quién no trabaja:

- **Argentina:** Ley 27.399 ([Infoleg](https://servicios.infoleg.gob.ar/infolegInternet/anexos/280000-284999/281835/norma.htm)). Carnaval y Viernes Santo según Pascua; traslados 2026 calculados con el art. 6 (Güemes al 15/6, Soberanía al 23/11). Los días turísticos no están cargados.
- **México:** art. 74 de la Ley Federal del Trabajo ([PROFEDET](https://www.gob.mx/profedet/articulos/sabes-cuales-son-los-dias-de-descanso-obligatorio-para-este-2026)). Constitución, Juárez y Revolución como "n-ésimo lunes".
- **Ecuador:** LOSEP, Disposición General Cuarta ([Asamblea Nacional](https://www.asambleanacional.gob.ec/es/blogs/herman-moya/47579-ley-de-feriados)). Traslado 2026 de Pichincha al 25/5 calculado con la regla de la ley; los traslados de otros años hay que cargarlos.
- **España:** fiestas nacionales del BOE (ver arriba).

**Regionales y locales** (donde vive el equipo; aplican solo a quien vive en esa región o ciudad):

- **Comunidad de Madrid:** Jueves Santo, 2 de mayo y, en 2026, los descansos del 2/11 y 7/12 ([Comunidad de Madrid](https://www.comunidad.madrid/empleo/calendario-laboral-comunidad-madrid-municipios)). **Ciudad de Madrid:** San Isidro (15/5) y la Almudena (9/11) ([Ayuntamiento](https://www.madrid.es/portales/munimadrid/es/Inicio/Buscador/Calendario-oficial-laboral-y-de-dias-inhabiles-y-festivos-2026-para-Madrid/?vgnextfmt=default&vgnextoid=b59770d1c3589910VgnVCM100000891ecb1aRCRD&vgnextchannel=7db8fc12aa936610VgnVCM1000008a4a900aRCRD)).
- **Cataluña:** Lunes de Pascua, Sant Joan, Diada y Sant Esteve. **Barcelona:** Lunes de Pascua Granada y La Mercè ([Ajuntament](https://ajuntament.barcelona.cat/calendarifestius/ca/)).
- **Guayaquil:** Fundación (25/7; en 2026 el feriado pasó al 24/7) ([Municipalidad](https://guayaquil.gob.ec/mercados-parques-atractivos-turisticos-invitan-disfrutar-feriado-fundacion-guayaquil/)).
- **Mendoza:** Santiago Apóstol (25/7, Ley 4.081).
- **Visita del papa León XIV (2026):** 9/11 en todo el país, 10/11 en Córdoba y CABA, 11/11 en Provincia de Buenos Aires (Decreto DNU 1103/2026).
- No cargados: asueto de La Plata del 19/11 (solo administración municipal), Tucumán 24/9 (sin fuente oficial que lo confirme), y los feriados municipales de los partidos del conurbano.

Para que funcionen, cada persona tiene que tener cargada su provincia o región y su ciudad en Configuración → Equipo.

### Sacados para simplificar

**Fechas comerciales** (CyberMonday, Black Friday, El Buen Fin) y su categoría. Aniversarios de ciudades (La Plata, Bahía Blanca, Corrientes, Mendoza), Día del Sánguche de Milanesa y Festival de Calaveras (ya pasó). Al actualizar, la app los saca de tu calendario salvo que los hayas editado o tengan un saludo.

### No incluidos

- **Sin fecha 2026 confirmada:** Fiesta Nacional de la Tradición (San Antonio de Areco), Mama Negra (Latacunga, edición de noviembre) y Fiesta Nacional del Sánguche de Milanesa (Tucumán). Cargar a mano cuando se publiquen.
- **No verificados en esta pasada:** Fiesta del Maní (Córdoba), Avicultura y Asado con Cuero (Entre Ríos), colada morada y guaguas de pan como tradición del Día de Difuntos, cumpleaños de artistas y aniversarios de películas o series. Se dejaron afuera para no cargar datos sin fuente.
- **QuartzSales:** sin seed, por definición. Esos eventos se cargan a mano.

---

## Notas técnicas

- **Diseño:** mismo sistema visual que el QuartzSales Content Dashboard (Nunito + Roboto self-hosteadas, degradado #3C9FF1 → #7025E0, botones, tarjetas y sidebar equivalentes), en tema claro y oscuro.
- **Stack:** React 19 + TypeScript + Vite 8, Tailwind CSS 4, Lucide, React Router (hash), Dexie (IndexedDB), Zod, vite-plugin-pwa. Tests con Vitest + Testing Library + fake-indexeddb.
- **Dexie en lugar de idb:** trae versionado de esquema y migraciones listos, y consultas reactivas (`useLiveQuery`) que mantienen la UI al día con el guardado automático.
- **Rutas con hash** (`#/calendario`): recargar cualquier pantalla nunca da 404 y no depende de reglas de redirect.
- **Paths relativos** (`base: './'`): la app funciona aunque se renombre la carpeta.
- **Dominio compartido:** el service worker tiene scope `/projects/quartzsales-calendar/` y no controla ni cachea otros proyectos. Esto está verificado: la home y `/projects/the-rebel-run/` no quedan controladas. La base IndexedDB se llama `qs-calendar` y las claves de `localStorage`/`sessionStorage` usan el prefijo `qs-calendar:`.
- **Recurrencias:** anual fija, n-ésimo día de la semana del mes, relativa a Pascua (cálculo gregoriano) y edición única.
- **Fechas:** los eventos de día completo se guardan como `YYYY-MM-DD` y se calculan sin pasar por la zona horaria del navegador. La semana empieza el lunes.
- **Migraciones:** `source/src/db/db.ts` (esquema de IndexedDB) y `source/src/lib/backup.ts` (respaldos JSON). Para cambiar el esquema, sumá una `version(n)` nueva con su `upgrade`, subí `SCHEMA_VERSION` y agregá la migración de respaldos correspondiente.
