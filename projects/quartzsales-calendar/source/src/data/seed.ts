import type { CalendarEvent, Recurrence } from '../types';
import { TIMEZONE_BY_COUNTRY } from './defaults';

/**
 * Catálogo inicial público. Se mergea por ID con los datos locales (ver mergeSeed):
 * nunca pisa ediciones del usuario. Subir SEED_VERSION cada vez que cambie el contenido.
 *
 * Regla: nada inventado. "confirmado" solo con fuente oficial (sourceUrl) verificada
 * el 03/11/2026. Lo que solo apareció en medios queda "pendiente" con nota.
 * El reporte completo está en el README del proyecto.
 */
export const SEED_VERSION = 4;

const VERIFIED = '2026-11-03';
const STAMP = '2026-11-03T00:00:00.000Z';

type SeedInput = Pick<CalendarEvent, 'id' | 'title' | 'category' | 'country' | 'startDate' | 'relevance' | 'verification' | 'source'> &
  Partial<CalendarEvent>;

const fixed: Recurrence = { type: 'yearly-fixed' };
const once: Recurrence = { type: 'none' };

function seed(e: SeedInput): CalendarEvent {
  const recurrence = e.recurrence ?? fixed;
  return {
    summary: '',
    description: '',
    history: '',
    traditions: '',
    allDay: true,
    timezone: TIMEZONE_BY_COUNTRY[e.country] ?? 'UTC',
    recurrence,
    dateType: recurrence.type === 'yearly-fixed' ? 'fija' : recurrence.type === 'none' ? 'edición anual' : 'variable',
    holidayObservances: [],
    contentIdeas: [],
    favorite: false,
    archived: false,
    editorialStatus: 'sin evaluar',
    provenance: 'seed',
    userModified: false,
    createdAt: STAMP,
    updatedAt: STAMP,
    lastVerifiedAt: e.verification === 'confirmado' ? VERIFIED : undefined,
    ...e,
  };
}

export const SEED_EVENTS: CalendarEvent[] = [
  /* ───────── Argentina ───────── */
  seed({
    id: 'seed-ar-tradicion', title: 'Día de la Tradición', category: 'cultura', subcategory: 'cul-celebraciones-tradicionales',
    country: 'ar', startDate: '2026-11-10', relevance: 'alta', verification: 'confirmado',
    summary: 'Homenaje a José Hernández, autor de El gaucho Martín Fierro, nacido un 10 de noviembre.',
    history: 'Se oficializó en la provincia de Buenos Aires en 1939 y la Ley nacional 21.154 (1975) la consagró para todo el país.',
    source: 'Ministerio de Cultura de la Nación', sourceUrl: 'https://www.cultura.gob.ar/por-que-se-celebra-el-dia-de-la-tradicion-en-argentina-8528/',
  }),
  seed({
    id: 'seed-ar-soberania', isHoliday: true,  title: 'Día de la Soberanía Nacional', category: 'efemerides', subcategory: 'efe-nacionales',
    country: 'ar', startDate: '2026-11-20', relevance: 'media', verification: 'confirmado',
    summary: 'Feriado nacional del 20 de noviembre establecido por la Ley 27.399.',
    holidayObservances: [{ year: 2026, date: '2026-11-23', note: 'Figura como día inhábil "Día de la Soberanía Nacional (20/11)" en el calendario del Tribunal Fiscal de la Nación. Confirmar la norma de traslado.' }],
    source: 'Ley 27.399 (Infoleg / argentina.gob.ar)', sourceUrl: 'https://www.argentina.gob.ar/normativa/nacional/norma-281835/texto',
  }),
  seed({
    id: 'seed-ar-mate', title: 'Día Nacional del Mate', category: 'cultura', subcategory: 'cul-gastronomicas',
    country: 'ar', startDate: '2026-11-30', relevance: 'alta', verification: 'confirmado',
    summary: 'Instituido por la Ley 27.117 en homenaje al natalicio de Andrés Guacurarí y Artigas.',
    history: 'La Ley 26.871 (2013) declaró al mate infusión nacional y la Ley 27.117 (2015) instituyó el 30 de noviembre como su día.',
    contentIdeas: ['Encuesta sobre las bebidas del equipo.'],
    source: 'Ley 27.117 (argentina.gob.ar)', sourceUrl: 'https://www.argentina.gob.ar/normativa/nacional/ley-27117-241355/texto',
  }),
  seed({
    id: 'seed-ar-vino', title: 'Día del Vino Argentino Bebida Nacional', category: 'cultura', subcategory: 'cul-gastronomicas',
    country: 'ar', startDate: '2026-11-24', relevance: 'media', verification: 'confirmado',
    summary: 'Recuerda el Decreto 1800/2010 que declaró al vino argentino bebida nacional.',
    history: 'Decreto 1800/2010, ratificado por la Ley 26.870 (2013).',
    source: 'Gobierno de la Nación', sourceUrl: 'https://www.argentina.gob.ar/noticias/vino-argentino-bebida-nacional',
  }),
  seed({
    id: 'seed-ar-musica', title: 'Día de la Música', category: 'efemerides', subcategory: 'efe-dias-conmemorativos',
    country: 'ar', startDate: '2026-11-22', relevance: 'media', verification: 'confirmado',
    summary: 'Se celebra en homenaje a Santa Cecilia, patrona de los músicos.',
    source: 'Ministerio de Cultura de la Nación', sourceUrl: 'https://www.cultura.gob.ar/por-que-se-festeja-el-dia-de-la-musica_5127/',
  }),
  seed({
    id: 'seed-ar-noche-museos-2026', title: 'La Noche de los Museos 2026', category: 'entretenimiento', subcategory: 'ent-noches-tematicas',
    country: 'ar', region: 'ar-caba', startDate: '2026-11-14', recurrence: once, allDay: false, startTime: '19:00',
    relevance: 'media', verification: 'confirmado',
    summary: '22.ª edición, sábado 14/11 de 19 a 2 h, con entrada libre.',
    source: 'Turismo Buenos Aires (GCBA)', sourceUrl: 'https://turismo.buenosaires.gob.ar/es/article/la-noche-de-los-museos',
  }),
  seed({
    id: 'seed-ar-noche-heladerias-2026', title: 'La Noche de las Heladerías 2026', category: 'entretenimiento', subcategory: 'ent-noches-tematicas',
    country: 'ar', startDate: '2026-11-18', recurrence: once, relevance: 'media', verification: 'pendiente',
    verificationNote: 'La fecha (miércoles 18/11) solo apareció en medios. Falta confirmarla en los canales oficiales de AFADHYA.',
    source: 'iProfesional (medio)', sourceUrl: 'https://www.iprofesional.com/actualidad/467888-cuando-es-la-noche-de-las-heladerias-2026-y-como-aprovechar-la-promocion-2x1',
  }),
  seed({
    id: 'seed-ar-cybermonday-2026', title: 'CyberMonday 2026 (Argentina)', category: 'comerciales', subcategory: 'com-cybermonday',
    country: 'ar', startDate: '2026-11-02', endDate: '2026-11-04', recurrence: once, relevance: 'media', verification: 'pendiente',
    verificationNote: 'Fechas (2 al 4/11) publicadas por medios. Falta confirmarlas en el sitio oficial de la CACE (cybermonday.com.ar).',
    source: 'Noticias NQN (medio)', sourceUrl: 'https://www.noticiasnqn.com.ar/noticias/2026/10/28/358518-cybermonday-2026-en-argentina-tres-dias-de-ofertas-cuotas-y-descuentos-desde-el-2-de-noviembre',
  }),

  /* ───────── México ───────── */
  seed({
    id: 'seed-mx-dia-de-muertos', title: 'Día de Muertos', category: 'cultura', subcategory: 'cul-celebraciones-tradicionales',
    country: 'mx', startDate: '2026-11-01', endDate: '2026-11-02', relevance: 'alta', verification: 'confirmado',
    summary: 'Se celebra principalmente el 1 y 2 de noviembre; según la tradición, las almas regresan a convivir con los vivos.',
    traditions: 'Ofrendas, flores de cempasúchil, velas e incienso; limpieza y adorno de las tumbas.',
    contentIdeas: ['Cómo se vive en México y en Ecuador, respetando sus diferencias.'],
    source: 'Secretaría de Cultura (gob.mx)', sourceUrl: 'https://www.gob.mx/cultura/prensa/mexico-se-prepara-para-celebrar-a-sus-muertos',
  }),
  seed({
    id: 'seed-mx-revolucion', title: 'Aniversario de la Revolución Mexicana', category: 'efemerides', subcategory: 'efe-nacionales',
    country: 'mx', startDate: '2026-11-20', relevance: 'media', verification: 'confirmado',
    summary: 'Se conmemora el 20 de noviembre; el descanso obligatorio es el tercer lunes de noviembre (LFT, art. 74).',
    source: 'PROFEDET (gob.mx)', sourceUrl: 'https://www.gob.mx/profedet/articulos/sabes-cuales-son-los-dias-de-descanso-obligatorio-para-este-2026',
  }),
  seed({
    id: 'seed-mx-dia-del-libro', title: 'Día Nacional del Libro (México)', category: 'efemerides', subcategory: 'efe-dias-conmemorativos',
    country: 'mx', startDate: '2026-11-12', relevance: 'media', verification: 'confirmado',
    summary: 'Dedicado a la divulgación del libro, en el natalicio de Sor Juana Inés de la Cruz (decreto de 1979).',
    source: 'Diario Oficial de la Federación', sourceUrl: 'https://dof.gob.mx/nota_detalle.php?codigo=4842539&fecha=06/11/1979',
  }),
  seed({
    id: 'seed-mx-gastronomia', title: 'Día Nacional de la Gastronomía Mexicana', category: 'cultura', subcategory: 'cul-gastronomicas',
    country: 'mx', startDate: '2026-11-16', relevance: 'media', verification: 'confirmado',
    summary: 'Recuerda la inscripción de la cocina tradicional mexicana en la lista de Patrimonio Cultural Inmaterial de la UNESCO (16/11/2010).',
    source: 'Diario Oficial de la Federación', sourceUrl: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5456816&fecha=14%2F10%2F2016',
  }),
  seed({
    id: 'seed-mx-buen-fin-2026', title: 'El Buen Fin 2026', category: 'comerciales', subcategory: 'com-el-buen-fin',
    country: 'mx', startDate: '2026-11-13', endDate: '2026-11-17', recurrence: once, relevance: 'alta', verification: 'confirmado',
    summary: '16.ª edición, de viernes a martes, con cobertura nacional.',
    source: 'Reglas de Operación 2026 (elbuenfin.org)', sourceUrl: 'https://www.elbuenfin.org/assets/documents/REGLAS_DE_OPERACION_BUEN_FIN.pdf',
  }),

  /* ───────── Ecuador ───────── */
  seed({
    id: 'seed-ec-difuntos', isHoliday: true,  title: 'Día de los Difuntos (Ecuador)', category: 'cultura', subcategory: 'cul-celebraciones-religiosas',
    country: 'ec', startDate: '2026-11-02', relevance: 'alta', verification: 'confirmado',
    summary: 'Feriado nacional del 2 de noviembre.',
    contentIdeas: ['Cómo se vive en México y en Ecuador, respetando sus diferencias.'],
    source: 'Registro Civil del Ecuador', sourceUrl: 'https://www.registrocivil.gob.ec/gobierno-del-ecuador-garantiza-la-atencion-del-registro-civil-durante-el-feriado-por-el-dia-de-los-difuntos-y-la-independencia-de-cuenca',
  }),
  seed({
    id: 'seed-ec-independencia-cuenca', isHoliday: true,  title: 'Independencia de Cuenca', category: 'efemerides', subcategory: 'efe-nacionales',
    country: 'ec', startDate: '2026-11-03', relevance: 'media', verification: 'confirmado',
    summary: 'Feriado nacional del 3 de noviembre; la ciudad organiza más de 300 actividades.',
    source: 'Alcaldía de Cuenca', sourceUrl: 'https://www.cuenca.gob.ec/content/cuenca-tendra-mas-de-300-eventos-en-sus-fiestas-de-independencia-gracias-al-apoyo-de-la',
  }),
  seed({
    id: 'seed-ec-artes-vivas-loja-2026', title: 'Festival Internacional de Artes Vivas de Loja 2026', category: 'entretenimiento', subcategory: 'ent-festivales',
    country: 'ec', startDate: '2026-11-12', endDate: '2026-11-22', recurrence: once, relevance: 'media', verification: 'confirmado',
    summary: '11.ª edición, del 12 al 22/11, con delegaciones de 12 países y Alemania como invitado de honor.',
    source: 'Municipio de Loja', sourceUrl: 'https://www.loja.gob.ec/noticia/2026-10/presentaron-programacion-del-festival-de-artes-vivas-2026',
  }),
  seed({
    id: 'seed-ec-fundacion-quito', title: 'Fundación de Quito', category: 'efemerides', subcategory: 'efe-aniversarios',
    country: 'ec', startDate: '2026-12-06', relevance: 'media', verification: 'confirmado',
    summary: 'Conmemora el primer cabildo y la fundación española de San Francisco de Quito (1534).',
    source: 'Archivo Metropolitano de Historia de Quito', sourceUrl: 'http://archivoqhistorico.quito.gob.ec/index.php/quito-y-sus-historias/23-los-origenes-de-las-fiestas-de-quito',
  }),

  /* ───────── España (fiestas laborales de ámbito nacional) ───────── */
  ...((): CalendarEvent[] => {
    const BOE = 'BOE: fiestas laborales 2026 (Resolución de 17/10/2025)';
    const BOE_URL = 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667';
    const base = { country: 'es', verification: 'confirmado' as const, source: BOE, sourceUrl: BOE_URL, isHoliday: true, category: 'feriados' };
    return [
      seed({ ...base, id: 'seed-es-ano-nuevo', title: 'Año Nuevo (España)', startDate: '2026-01-01', relevance: 'media', summary: 'Fiesta laboral de ámbito nacional.' }),
      seed({ ...base, id: 'seed-es-reyes', title: 'Epifanía del Señor (Reyes)', startDate: '2026-01-06', relevance: 'alta', summary: 'Fiesta laboral de ámbito nacional.' }),
      seed({ ...base, id: 'seed-es-viernes-santo', title: 'Viernes Santo (España)', startDate: '2026-04-03', recurrence: { type: 'yearly-easter', offsetDays: -2 }, relevance: 'media',
        summary: 'Fiesta laboral de ámbito nacional. En 2026 fue el 3 de abril; varía cada año con la Pascua.' }),
      seed({ ...base, id: 'seed-es-trabajo', title: 'Fiesta del Trabajo (España)', startDate: '2026-05-01', relevance: 'media', summary: 'Fiesta laboral de ámbito nacional.' }),
      seed({ ...base, id: 'seed-es-fiesta-nacional', title: 'Fiesta Nacional de España', startDate: '2026-10-12', relevance: 'media', summary: 'Fiesta laboral de ámbito nacional.' }),
      seed({ ...base, id: 'seed-es-constitucion', title: 'Día de la Constitución Española', startDate: '2026-12-06', relevance: 'media', summary: 'Fiesta laboral de ámbito nacional.',
        holidayObservances: [{ year: 2026, date: '2026-12-07', note: 'Cae en domingo: descanso el lunes 7/12 en varias comunidades (Andalucía, Aragón, Asturias, Cantabria, Castilla y León, Extremadura, Madrid, Murcia, La Rioja y Melilla, según el anexo del BOE; verificar la de cada comunidad).' }] }),
      seed({ ...base, id: 'seed-es-navidad', title: 'Natividad del Señor (España)', startDate: '2026-12-25', relevance: 'alta', summary: 'Fiesta laboral de ámbito nacional.' }),
    ];
  })(),

  /* ───────── Feriados nacionales (días no laborables) ───────── */
  ...((): CalendarEvent[] => {
    const AR = { country: 'ar', category: 'feriados', verification: 'confirmado' as const, isHoliday: true,
      source: 'Ley 27.399 de feriados nacionales', sourceUrl: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/280000-284999/281835/norma.htm' };
    const MX = { country: 'mx', category: 'feriados', verification: 'confirmado' as const, isHoliday: true,
      source: 'Ley Federal del Trabajo, art. 74', sourceUrl: 'https://www.gob.mx/profedet/articulos/sabes-cuales-son-los-dias-de-descanso-obligatorio-para-este-2026' };
    const EC = { country: 'ec', category: 'feriados', verification: 'confirmado' as const, isHoliday: true,
      source: 'LOSEP, Disposición General Cuarta (reforma 2016)', sourceUrl: 'https://www.asambleanacional.gob.ec/es/blogs/herman-moya/47579-ley-de-feriados' };
    const carnaval = { type: 'yearly-easter' as const, offsetDays: -48 };
    const viernesSanto = { type: 'yearly-easter' as const, offsetDays: -2 };
    return [
      seed({ ...AR, id: 'seed-ar-feriado-ano-nuevo', title: 'Año Nuevo (Argentina)', startDate: '2026-01-01', relevance: 'media' }),
      seed({ ...AR, id: 'seed-ar-carnaval', title: 'Carnaval (Argentina)', startDate: '2026-02-16', endDate: '2026-02-17', recurrence: carnaval, relevance: 'media' }),
      seed({ ...AR, id: 'seed-ar-memoria', title: 'Día Nacional de la Memoria por la Verdad y la Justicia', startDate: '2026-03-24', relevance: 'media' }),
      seed({ ...AR, id: 'seed-ar-malvinas', title: 'Día del Veterano y de los Caídos en Malvinas', startDate: '2026-04-02', relevance: 'media' }),
      seed({ ...AR, id: 'seed-ar-viernes-santo', title: 'Viernes Santo (Argentina)', startDate: '2026-04-03', recurrence: viernesSanto, relevance: 'baja' }),
      seed({ ...AR, id: 'seed-ar-trabajo', title: 'Día del Trabajador (Argentina)', startDate: '2026-05-01', relevance: 'media' }),
      seed({ ...AR, id: 'seed-ar-25-mayo', title: 'Revolución de Mayo', startDate: '2026-05-25', relevance: 'media' }),
      seed({ ...AR, id: 'seed-ar-guemes', title: 'Paso a la Inmortalidad de Güemes', startDate: '2026-06-17', relevance: 'baja',
        holidayObservances: [{ year: 2026, date: '2026-06-15', note: 'Trasladable: cae miércoles, pasa al lunes anterior (art. 6).' }] }),
      seed({ ...AR, id: 'seed-ar-belgrano', title: 'Paso a la Inmortalidad de Belgrano (Día de la Bandera)', startDate: '2026-06-20', relevance: 'media' }),
      seed({ ...AR, id: 'seed-ar-independencia', title: 'Día de la Independencia (Argentina)', startDate: '2026-07-09', relevance: 'alta' }),
      seed({ ...AR, id: 'seed-ar-san-martin', title: 'Paso a la Inmortalidad de San Martín', startDate: '2026-08-17', relevance: 'baja' }),
      seed({ ...AR, id: 'seed-ar-diversidad', title: 'Día del Respeto a la Diversidad Cultural', startDate: '2026-10-12', relevance: 'baja' }),
      seed({ ...AR, id: 'seed-ar-inmaculada', title: 'Inmaculada Concepción (Argentina)', startDate: '2026-12-08', relevance: 'baja' }),
      seed({ ...AR, id: 'seed-ar-navidad', title: 'Navidad (Argentina)', startDate: '2026-12-25', relevance: 'alta' }),

      seed({ ...MX, id: 'seed-mx-ano-nuevo', title: 'Año Nuevo (México)', startDate: '2026-01-01', relevance: 'media' }),
      seed({ ...MX, id: 'seed-mx-constitucion', title: 'Día de la Constitución (descanso)', startDate: '2026-02-02',
        recurrence: { type: 'yearly-nth-weekday', month: 2, weekday: 0, nth: 1, offsetDays: 0 }, relevance: 'baja' }),
      seed({ ...MX, id: 'seed-mx-juarez', title: 'Natalicio de Benito Juárez (descanso)', startDate: '2026-03-16',
        recurrence: { type: 'yearly-nth-weekday', month: 3, weekday: 0, nth: 3, offsetDays: 0 }, relevance: 'baja' }),
      seed({ ...MX, id: 'seed-mx-trabajo', title: 'Día del Trabajo (México)', startDate: '2026-05-01', relevance: 'media' }),
      seed({ ...MX, id: 'seed-mx-independencia', title: 'Día de la Independencia (México)', startDate: '2026-09-16', relevance: 'alta' }),
      seed({ ...MX, id: 'seed-mx-revolucion-descanso', title: 'Revolución Mexicana (descanso)', startDate: '2026-11-16',
        recurrence: { type: 'yearly-nth-weekday', month: 11, weekday: 0, nth: 3, offsetDays: 0 }, relevance: 'baja' }),
      seed({ ...MX, id: 'seed-mx-navidad', title: 'Navidad (México)', startDate: '2026-12-25', relevance: 'alta' }),

      seed({ ...EC, id: 'seed-ec-ano-nuevo', title: 'Año Nuevo (Ecuador)', startDate: '2026-01-01', relevance: 'media' }),
      seed({ ...EC, id: 'seed-ec-carnaval', title: 'Carnaval (Ecuador)', startDate: '2026-02-16', endDate: '2026-02-17', recurrence: carnaval, relevance: 'media' }),
      seed({ ...EC, id: 'seed-ec-viernes-santo', title: 'Viernes Santo (Ecuador)', startDate: '2026-04-03', recurrence: viernesSanto, relevance: 'baja' }),
      seed({ ...EC, id: 'seed-ec-trabajo', title: 'Día del Trabajo (Ecuador)', startDate: '2026-05-01', relevance: 'media' }),
      seed({ ...EC, id: 'seed-ec-pichincha', title: 'Batalla de Pichincha', startDate: '2026-05-24', relevance: 'baja',
        holidayObservances: [{ year: 2026, date: '2026-05-25', note: 'Cae domingo: pasa al lunes siguiente (regla de traslado de la LOSEP).' }] }),
      seed({ ...EC, id: 'seed-ec-primer-grito', title: 'Primer Grito de Independencia', startDate: '2026-08-10', relevance: 'media' }),
      seed({ ...EC, id: 'seed-ec-guayaquil', title: 'Independencia de Guayaquil', startDate: '2026-10-09', relevance: 'media' }),
      seed({ ...EC, id: 'seed-ec-navidad', title: 'Navidad (Ecuador)', startDate: '2026-12-25', relevance: 'alta' }),
    ];
  })(),

  /* ───────── Internacional ───────── */
  seed({
    id: 'seed-intl-usabilidad', areas: ['Producto y Diseño'],  title: 'Día Mundial de la Usabilidad', category: 'profesiones', subcategory: 'pro-ux-ui',
    country: 'intl', startDate: '2026-11-12', recurrence: { type: 'yearly-nth-weekday', month: 11, weekday: 3, nth: 2, offsetDays: 0 },
    relevance: 'alta', verification: 'confirmado',
    summary: 'Segundo jueves de noviembre. Tema 2026: "Designing a Sustainable Future with Ethical AI".',
    contentIdeas: ['Errores cotidianos de UX.', 'Desafío: detectar problemas en una interfaz.'],
    source: 'World Usability Day', sourceUrl: 'https://worldusabilityday.org/',
  }),
  seed({
    id: 'seed-intl-project-management', areas: ['Gestión de Proyectos'],  title: 'Día Internacional de la Gestión de Proyectos', category: 'profesiones', subcategory: 'pro-gestion-de-proyectos',
    country: 'intl', startDate: '2026-11-05', recurrence: { type: 'yearly-nth-weekday', month: 11, weekday: 3, nth: 1, offsetDays: 0 },
    relevance: 'media', verification: 'confirmado',
    summary: 'Primer jueves de noviembre, impulsado por el International Institute for Learning desde 2004.',
    source: 'International Institute for Learning (IIL)', sourceUrl: 'https://www.iil.com/international-project-management-day/frequently-asked-questions/',
  }),
  seed({
    id: 'seed-intl-diseno', areas: ['Producto y Diseño'],  title: 'Día Internacional del Diseño', category: 'profesiones', subcategory: 'pro-diseno-grafico',
    country: 'intl', startDate: '2026-04-27', relevance: 'media', verification: 'confirmado',
    summary: 'Recuerda la fundación del International Council of Design (ICoD) el 27 de abril de 1963.',
    source: 'International Council of Design', sourceUrl: 'https://www.theicod.org/activities/international-design-day',
  }),
  seed({
    id: 'seed-intl-black-friday', title: 'Black Friday', category: 'comerciales', subcategory: 'com-black-friday',
    country: 'intl', startDate: '2026-11-27', recurrence: { type: 'yearly-nth-weekday', month: 11, weekday: 3, nth: 4, offsetDays: 1 },
    relevance: 'media', verification: 'pendiente',
    verificationNote: 'Fecha comercial por convención (día siguiente al Día de Acción de Gracias de EE. UU.). No hay un organismo oficial que la publique.',
    source: '',
  }),
];
