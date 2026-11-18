// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANTES DE EJEMPLO (modo demo)
//
// Esta lista es ficticia. En producción la lista real vive en la tabla
// `participants` de Supabase (ver supabase/schema.sql) y NO se lee de acá.
//
// Para editarla en demo: sumá, sacá o cambiá personas. `roleKey` define qué
// postales se sugieren primero cuando alguien le escribe a esa persona.
// Claves disponibles: dev · design · infra · sales · qa · product · data ·
// support · people · field
// ─────────────────────────────────────────────────────────────────────────────

export const PARTICIPANTS = [
  { id: 'p01', name: 'Ana Ferreyra', role: 'Development', roleKey: 'dev' },
  { id: 'p02', name: 'Bruno Sosa', role: 'Diseño UX/UI', roleKey: 'design' },
  { id: 'p03', name: 'Camila Ríos', role: 'QA', roleKey: 'qa' },
  { id: 'p04', name: 'Diego Paz', role: 'Infraestructura', roleKey: 'infra' },
  { id: 'p05', name: 'Elena Quiroga', role: 'Comercial', roleKey: 'sales' },
  { id: 'p06', name: 'Facundo Medina', role: 'Producto', roleKey: 'product' },
  { id: 'p07', name: 'Gala Benítez', role: 'Datos', roleKey: 'data' },
  { id: 'p08', name: 'Hernán Luna', role: 'Soporte', roleKey: 'support' },
  { id: 'p09', name: 'Inés Aguirre', role: 'People', roleKey: 'people' },
  { id: 'p10', name: 'Joaquín Vera', role: 'Operaciones de campo', roleKey: 'field' },
  { id: 'p11', name: 'Karen Ortiz', role: 'Development', roleKey: 'dev' },
  { id: 'p12', name: 'Lucas Méndez', role: 'Development', roleKey: 'dev' },
  { id: 'p13', name: 'Martina Gil', role: 'Diseño UX/UI', roleKey: 'design' },
  { id: 'p14', name: 'Nicolás Rey', role: 'Comercial', roleKey: 'sales' },
  { id: 'p15', name: 'Olivia Torres', role: 'QA', roleKey: 'qa' },
  { id: 'p16', name: 'Pablo Ibarra', role: 'Infraestructura', roleKey: 'infra' },
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
