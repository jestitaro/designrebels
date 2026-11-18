// Catálogo de postales prediseñadas. El arte de cada una vive en
// components/PostcardArt.jsx (mismo `id`). `roles` define a quién se sugiere.
export const POSTCARDS = [
  { id: 'commit', title: 'git commit', roles: ['dev'], line: 'git commit -m "Gracias por este año"' },
  { id: 'encaje', title: 'Todo encaja', roles: ['design'], line: 'Gracias por hacer que todo encaje.' },
  { id: 'uptime', title: 'Uptime', roles: ['infra'], line: 'Que lo único que se caiga sea el año.' },
  { id: 'metas', title: 'Metas', roles: ['sales'], line: 'Por todas las metas que compartimos.' },
  { id: 'aprobado', title: 'Aprobado', roles: ['qa'], line: 'Probado y aprobado: trabajar con vos.' },
  { id: 'hecho', title: 'Hecho', roles: ['product'], line: 'Gracias por priorizar lo importante.' },
  { id: 'correlacion', title: 'Correlación', roles: ['data'], line: 'Correlación positiva: vos y los buenos días.' },
  { id: 'otrolado', title: 'Del otro lado', roles: ['support'], line: 'Gracias por estar siempre del otro lado.' },
  { id: 'cuidarnos', title: 'Nosotros', roles: ['people'], line: 'Gracias por cuidar lo que no sale en ningún tablero.' },
  { id: 'kilometros', title: 'Kilómetros', roles: ['field'], line: 'Por cada kilómetro que hicimos juntos.' },
  { id: 'cursor', title: 'Sin prompt', roles: [], line: 'Esto no lo escribió ninguna IA.' },
  { id: 'bloques', title: 'Entre todos', roles: [], line: 'Este año lo armamos entre todos.' },
  { id: 'cierre', title: 'Cierre', roles: [], line: '2026: cerrado, mergeado y agradecido.' },
];

export const getPostcard = (id) => POSTCARDS.find((p) => p.id === id) || POSTCARDS[0];

// Postales sugeridas primero para un rol; el resto después.
export function orderForRole(roleKey) {
  const match = POSTCARDS.filter((p) => p.roles.includes(roleKey));
  const neutral = POSTCARDS.filter((p) => p.roles.length === 0);
  const rest = POSTCARDS.filter((p) => !match.includes(p) && !neutral.includes(p));
  return [...match, ...neutral, ...rest];
}

// "Prompts para humanos": ideas para el editor de dibujo.
export const HUMAN_PROMPTS = [
  'Su escritorio un viernes a las 18.',
  'La cara que pone cuando el deploy pasa a la primera.',
  'Lo que le regalarías si el presupuesto fuera infinito.',
  'Un árbol, pero hecho con lo que hay en tu escritorio.',
  'Su superpoder laboral, en forma de dibujo.',
  'La reunión que debió ser un mail.',
  'El mate (o el café) que compartieron.',
  'Cómo te imaginás sus vacaciones.',
];
