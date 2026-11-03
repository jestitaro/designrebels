import type { Category, Country, Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  leadDays: 3,
};

const sub = (prefix: string, names: string[]) =>
  names.map((name) => ({
    id: `${prefix}-${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    name,
  }));

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'efemerides', name: 'Efemérides', color: 'blue', visible: true, order: 0,
    subcategories: sub('efe', ['Históricas', 'Aniversarios', 'Nacionales', 'Internacionales', 'Días conmemorativos']),
  },
  {
    id: 'profesiones', name: 'Profesiones', color: 'teal', visible: true, order: 1,
    subcategories: sub('pro', ['Diseño gráfico', 'UX/UI', 'Desarrollo', 'Programación', 'Marketing', 'Gestión de proyectos', 'QA', 'RRHH', 'IA', 'Tecnología', 'Otras']),
  },
  {
    id: 'cultura', name: 'Cultura y tradiciones', color: 'amber', visible: true, order: 2,
    subcategories: sub('cul', ['Fiestas nacionales', 'Fiestas provinciales', 'Celebraciones religiosas', 'Celebraciones tradicionales', 'Gastronómicas', 'Costumbres populares', 'Festivales folklóricos']),
  },
  {
    id: 'entretenimiento', name: 'Eventos y entretenimiento', color: 'pink', visible: true, order: 3,
    subcategories: sub('ent', ['Noches temáticas', 'Conciertos', 'Festivales', 'Ferias', 'Eventos gastronómicos', 'Celebraciones de ciudades']),
  },
  {
    id: 'pop', name: 'Cultura pop', color: 'fuchsia', visible: true, order: 4,
    subcategories: sub('pop', ['Cumpleaños de artistas', 'Películas', 'Series', 'Videojuegos', 'Dibujos animados', 'Personajes ficticios', 'Fechas curiosas']),
  },
  {
    id: 'comerciales', name: 'Comerciales', color: 'green', visible: true, order: 5,
    subcategories: sub('com', ['CyberMonday', 'Black Friday', 'El Buen Fin', 'Retail', 'Trade marketing', 'E-commerce']),
  },
  {
    id: 'quartzsales', name: 'QuartzSales', color: 'brand', visible: true, order: 6,
    subcategories: sub('qs', ['Eventos internos', 'Aniversarios de producto', 'Lanzamientos', 'Actividades del equipo']),
  },
];

const city = (id: string, name: string) => ({ id, name, active: true });

export const DEFAULT_COUNTRIES: Country[] = [
  {
    id: 'ar', name: 'Argentina', active: true, order: 0,
    regions: [
      { id: 'ar-caba', name: 'CABA', active: true, cities: [] },
      {
        id: 'ar-ba', name: 'Provincia de Buenos Aires', active: true,
        cities: [city('ar-ba-amba', 'AMBA'), city('ar-ba-laplata', 'La Plata'), city('ar-ba-bahiablanca', 'Bahía Blanca'), city('ar-ba-capitansarmiento', 'Capitán Sarmiento')],
      },
      { id: 'ar-cba', name: 'Córdoba', active: true, cities: [] },
      { id: 'ar-tuc', name: 'Tucumán', active: true, cities: [] },
      { id: 'ar-mza', name: 'Mendoza', active: true, cities: [] },
      { id: 'ar-ctes', name: 'Corrientes', active: true, cities: [] },
      { id: 'ar-er', name: 'Entre Ríos', active: true, cities: [] },
    ],
  },
  {
    id: 'mx', name: 'México', active: true, order: 1,
    regions: [{ id: 'mx-ags', name: 'Aguascalientes', active: true, cities: [] }],
  },
  { id: 'ec', name: 'Ecuador', active: true, order: 2, regions: [] },
  { id: 'es', name: 'España', active: true, order: 3, regions: [] },
  { id: 'intl', name: 'Internacional', active: true, order: 4, regions: [] },
];

export const TIMEZONE_BY_COUNTRY: Record<string, string> = {
  ar: 'America/Argentina/Buenos_Aires',
  mx: 'America/Mexico_City',
  ec: 'America/Guayaquil',
  es: 'Europe/Madrid',
  intl: 'UTC',
};
