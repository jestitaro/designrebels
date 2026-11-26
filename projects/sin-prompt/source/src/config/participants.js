// ─────────────────────────────────────────────────────────────────────────────
// EQUIPO DE QUARTZSALES (modo demo)
//
// Nombres y roles tomados del organigrama que usan otros proyectos de Design
// Rebels (ESC). En producción la lista vive en la tabla `participants` de
// Supabase (ver supabase/schema.sql) y NO se lee de acá.
//
// Para editarla: sumá, sacá o cambiá personas. `roleKey` define qué postales
// se sugieren primero cuando alguien le escribe a esa persona.
// Claves: direction · sales · product · design · dev · data · infra ·
// support · projects · people · qa · field
// ─────────────────────────────────────────────────────────────────────────────

export const PARTICIPANTS = [
  { id: 'qs-pablo-gimenez', name: 'Pablo Hernán Giménez', role: 'Visionary', roleKey: 'direction' },
  { id: 'qs-nicolas-rivero', name: 'Nicolás Rivero Segura', role: 'Integrator · Administration Manager', roleKey: 'direction' },
  { id: 'qs-agustin-goni', name: 'Agustín Goñi Piuma', role: 'Chief of Sales', roleKey: 'sales' },
  { id: 'qs-julieta-piccioni', name: 'Julieta Piccioni', role: 'Account Manager', roleKey: 'sales' },
  { id: 'qs-sebastian-carnota', name: 'Sebastián Carnota', role: 'CPO', roleKey: 'product' },
  { id: 'qs-jesica-titaro', name: 'Jésica Títaro', role: 'Design Rebel', roleKey: 'design' },
  { id: 'qs-matias-herrera', name: 'Matías Herrera', role: 'Fullstack', roleKey: 'dev' },
  { id: 'qs-jonathan-torres', name: 'Jonathan Torres', role: 'Fullstack', roleKey: 'dev' },
  { id: 'qs-francisco-tapia', name: 'Francisco Tapia', role: 'Angular / Ionic', roleKey: 'dev' },
  { id: 'qs-david-troila', name: 'David Troila', role: 'Android', roleKey: 'dev' },
  { id: 'qs-sergio-maturano', name: 'Sergio Maturano', role: 'iOS', roleKey: 'dev' },
  { id: 'qs-javier-de-vergilio', name: 'Javier Ignacio De Vergilio', role: 'BI Tech Lead', roleKey: 'data' },
  { id: 'qs-loreana-lucero', name: 'Loreana Lucero', role: 'BI Analyst · Líder de Proyectos', roleKey: 'data' },
  { id: 'qs-valeria-ventura', name: 'Valeria Ventura', role: 'BI Analyst', roleKey: 'data' },
  { id: 'qs-adolfo-wetzel', name: 'Adolfo Wetzel', role: 'IT & DevOps', roleKey: 'infra' },
  { id: 'qs-mayra-milanesio', name: 'Mayra Milanesio', role: 'Client Support Lead · Líder de Proyectos', roleKey: 'support' },
  { id: 'qs-eugenio-balbastro', name: 'Eugenio Balbastro Fages', role: 'Líder de Proyectos', roleKey: 'projects' },
  { id: 'qs-lucrecia-moralejo', name: 'Lucrecia Moralejo', role: 'Líder de Proyectos', roleKey: 'projects' },
  { id: 'qs-mariana-azua', name: 'Mariana Azúa', role: 'Admin & HR', roleKey: 'people' },
];

// Semilla del sorteo en demo. Cambiarla cambia todas las asignaciones.
export const DEMO_ASSIGNMENT_SEED = 'quartzsales-fin-de-ano-2026';

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const firstName = (name = '') => name.split(/\s+/)[0] || name;
