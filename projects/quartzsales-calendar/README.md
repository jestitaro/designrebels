# QuartzSales Calendar

App personal para planificar las comunicaciones internas de QuartzSales: fechas especiales por país y región (efemérides, fiestas, días profesionales, cultura pop, fechas comerciales), saludos para el equipo y recordatorios. Se usa en la compu o en el celular y se instala como app (PWA).

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

Cuando hay una versión nueva, la app muestra arriba **"Hay una versión nueva — Recargar"**. Tocá **Recargar** y listo. La app busca actualizaciones al abrirse, cada hora y cada vez que volvés a la pestaña.

Si aun así ves una versión vieja: cerrá todas las pestañas de la app y abrila de nuevo. Como último recurso, borrá los datos del sitio desde la configuración del navegador, pero **antes exportá un respaldo**, porque eso también borra tus eventos y saludos.

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

Verificación hecha el **03/11/2026**. Solo se marcó como *confirmado* lo respaldado por una fuente oficial (gobierno, boletín oficial, municipio u organizador). Desde el entorno de desarrollo no se pudieron abrir directamente algunos sitios oficiales, así que la verificación se hizo con búsquedas limitadas a esos dominios.

### Confirmados (25)

| Evento | Fecha | Fuente |
|---|---|---|
| Día de la Tradición | 10/11 | [Ministerio de Cultura](https://www.cultura.gob.ar/por-que-se-celebra-el-dia-de-la-tradicion-en-argentina-8528/) |
| Día de la Soberanía Nacional | 20/11 (feriado trasladado 23/11/2026*) | [Ley 27.399](https://www.argentina.gob.ar/normativa/nacional/norma-281835/texto) |
| Feriado por la visita del papa León XIV | 09/11/2026 | [Decreto DNU 1103/2026](https://www.argentina.gob.ar/normativa/nacional/norma-430580/texto) |
| Día Nacional del Mate | 30/11 | [Ley 27.117](https://www.argentina.gob.ar/normativa/nacional/ley-27117-241355/texto) |
| Día del Vino Argentino Bebida Nacional | 24/11 | [argentina.gob.ar](https://www.argentina.gob.ar/noticias/vino-argentino-bebida-nacional) |
| Día de la Música | 22/11 | [Ministerio de Cultura](https://www.cultura.gob.ar/por-que-se-festeja-el-dia-de-la-musica_5127/) |
| Aniversario de La Plata | 19/11 | [Municipalidad de La Plata](https://www.cultura.laplata.gob.ar/efemerides/piedra-fundamental) |
| Aniversario de Bahía Blanca | 11/04 | [argentina.gob.ar](https://www.argentina.gob.ar/cultura/monumentos/plaza-rivadavia-antigua-fortaleza-protectora-argentina) |
| Aniversario de Corrientes | 03/04 | [Municipalidad de Corrientes](https://ciudaddecorrientes.gov.ar/la-ciudad/fundaci-n-de-la-ciudad-de-corrientes) |
| Aniversario de Mendoza | 02/03 | [Ciudad de Mendoza](https://prensa.ciudaddemendoza.gob.ar/2026/03/02/ulpiano-suarez-encabezo-el-acto-por-los-465-anos-de-la-ciudad-de-mendoza/) |
| Día del Sánguche de Milanesa (Tucumán) | 18/03 | [Ente Tucumán Turismo](https://www.tucumanturismo.gob.ar/articulos/articulo/153/sanguche-de-milanesa) |
| La Noche de los Museos 2026 | 14/11/2026 | [Turismo Buenos Aires](https://turismo.buenosaires.gob.ar/es/article/la-noche-de-los-museos) |
| Día de Muertos | 01–02/11 | [Secretaría de Cultura (gob.mx)](https://www.gob.mx/cultura/prensa/mexico-se-prepara-para-celebrar-a-sus-muertos) |
| Aniversario de la Revolución Mexicana | 20/11 (descanso 16/11/2026) | [PROFEDET](https://www.gob.mx/profedet/articulos/sabes-cuales-son-los-dias-de-descanso-obligatorio-para-este-2026) |
| Día Nacional del Libro (México) | 12/11 | [DOF 1979](https://dof.gob.mx/nota_detalle.php?codigo=4842539&fecha=06/11/1979) |
| Día Nacional de la Gastronomía Mexicana | 16/11 | [DOF 2016](https://www.dof.gob.mx/nota_detalle.php?codigo=5456816&fecha=14%2F10%2F2016) |
| El Buen Fin 2026 | 13–17/11/2026 | [Reglas de Operación 2026](https://www.elbuenfin.org/assets/documents/REGLAS_DE_OPERACION_BUEN_FIN.pdf) |
| Festival Cultural de Calaveras 2026 (Aguascalientes) | 30/10–08/11/2026 | [Gobierno de Aguascalientes](https://informacion.aguascalientes.gob.mx/news/%C2%A1todo-listo-para-el-festival-cultural-de-calaveras-2026) |
| Día de los Difuntos (Ecuador) | 02/11 | [Registro Civil](https://www.registrocivil.gob.ec/gobierno-del-ecuador-garantiza-la-atencion-del-registro-civil-durante-el-feriado-por-el-dia-de-los-difuntos-y-la-independencia-de-cuenca) |
| Independencia de Cuenca | 03/11 | [Alcaldía de Cuenca](https://www.cuenca.gob.ec/content/cuenca-tendra-mas-de-300-eventos-en-sus-fiestas-de-independencia-gracias-al-apoyo-de-la) |
| Festival Internacional de Artes Vivas de Loja 2026 | 12–22/11/2026 | [Municipio de Loja](https://www.loja.gob.ec/noticia/2026-10/presentaron-programacion-del-festival-de-artes-vivas-2026) |
| Fundación de Quito | 06/12 | [Archivo Metropolitano de Quito](http://archivoqhistorico.quito.gob.ec/index.php/quito-y-sus-historias/23-los-origenes-de-las-fiestas-de-quito) |
| Día Mundial de la Usabilidad | 2.º jueves de noviembre | [World Usability Day](https://worldusabilityday.org/) |
| Día Internacional de la Gestión de Proyectos | 1.er jueves de noviembre | [IIL](https://www.iil.com/international-project-management-day/frequently-asked-questions/) |
| Día Internacional del Diseño | 27/04 | [ICoD](https://www.theicod.org/activities/international-design-day) |

\* El traslado al 23/11 figura en el calendario oficial de días inhábiles del Tribunal Fiscal de la Nación. Está cargado como feriado trasladado con la nota de confirmar la norma.

### Pendientes, cargados con nota (3)

| Evento | Qué falta |
|---|---|
| La Noche de las Heladerías 2026 (18/11) | La fecha solo apareció en medios. Confirmar en los canales de AFADHYA. |
| CyberMonday 2026 Argentina (02–04/11) | Fechas de medios. Confirmar en cybermonday.com.ar (CACE). |
| Black Friday (día siguiente al 4.º jueves de noviembre) | Es una fecha comercial por convención: no hay un organismo oficial que la publique. |

### No incluidos

- **Sin fecha 2026 confirmada:** Fiesta Nacional de la Tradición (San Antonio de Areco), Mama Negra (Latacunga, edición de noviembre) y Fiesta Nacional del Sánguche de Milanesa (Tucumán). Cargar a mano cuando se publiquen.
- **No verificados en esta pasada:** Fiesta del Maní (Córdoba), Avicultura y Asado con Cuero (Entre Ríos), colada morada y guaguas de pan como tradición del Día de Difuntos, cumpleaños de artistas y aniversarios de películas o series. Se dejaron afuera para no cargar datos sin fuente.
- **QuartzSales:** sin seed, por definición. Esos eventos se cargan a mano.

---

## Notas técnicas

- **Stack:** React 19 + TypeScript + Vite 8, Tailwind CSS 4, Lucide, React Router (hash), Dexie (IndexedDB), Zod, vite-plugin-pwa. Tests con Vitest + Testing Library + fake-indexeddb.
- **Dexie en lugar de idb:** trae versionado de esquema y migraciones listos, y consultas reactivas (`useLiveQuery`) que mantienen la UI al día con el guardado automático.
- **Rutas con hash** (`#/calendario`): recargar cualquier pantalla nunca da 404 y no depende de reglas de redirect.
- **Paths relativos** (`base: './'`): la app funciona aunque se renombre la carpeta.
- **Dominio compartido:** el service worker tiene scope `/projects/quartzsales-calendar/` y no controla ni cachea otros proyectos. Esto está verificado: la home y `/projects/the-rebel-run/` no quedan controladas. La base IndexedDB se llama `qs-calendar` y las claves de `localStorage`/`sessionStorage` usan el prefijo `qs-calendar:`.
- **Fechas:** los eventos de día completo se guardan como `YYYY-MM-DD` y se calculan sin pasar por la zona horaria del navegador. La semana empieza el lunes.
- **Migraciones:** `source/src/db/db.ts` (esquema de IndexedDB) y `source/src/lib/backup.ts` (respaldos JSON). Para cambiar el esquema, sumá una `version(n)` nueva con su `upgrade`, subí `SCHEMA_VERSION` y agregá la migración de respaldos correspondiente.
