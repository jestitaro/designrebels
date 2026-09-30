/**
 * Contenido realista de trade marketing. Nombres de PDV genéricos, SKUs sin marca.
 * Todas las pantallas toman de acá para que el video cuente una sola historia.
 */
export const PDVS = [
  { id: 'pdv-01', name: 'Autoservicio Los Álamos', address: 'Av. Rivadavia 4520, Caballito', time: '09:00 – 09:45', status: 'done' as const },
  { id: 'pdv-02', name: 'Supermercado San Martín', address: 'Av. San Martín 1180, Villa Crespo', time: '10:15 – 11:00', status: 'active' as const },
  { id: 'pdv-03', name: 'Mayorista Del Oeste', address: 'Av. Gaona 3301, Flores', time: '11:30 – 12:30', status: 'scheduled' as const },
  { id: 'pdv-04', name: 'Kiosco La Esquina', address: 'Juan B. Justo 2045, Palermo', time: '13:30 – 14:00', status: 'scheduled' as const },
  { id: 'pdv-05', name: 'Minimercado Centro', address: 'Corrientes 3890, Almagro', time: '14:30 – 15:15', status: 'warning' as const },
] as const;

export type PdvStatus = (typeof PDVS)[number]['status'];

/** SKUs genéricos, cada uno con su imagen de producto (public/products). EAN ficticios. */
export const SKUS = [
  { product: 'detergente-liquido-celeste', ean: '7790001234567', name: 'Jabón líquido para ropa 3 L', category: 'Jabón para la ropa', price: 8890.5 },
  { product: 'bidon-lavandina-amarillo', ean: '7790002345678', name: 'Lavandina 2 L', category: 'Lavandina', price: 2345.0 },
  { product: 'bidon-limpiador-amarillo', ean: '7790003456789', name: 'Lavandina en gel 1 L', category: 'Lavandina', price: 1990.75 },
  { product: 'lavavajillas-amarillo', ean: '7790004567890', name: 'Lavavajillas 500 ml', category: 'Lavavajillas', price: 1760.0 },
  { product: 'rociador-limpiador-verde', ean: '7790005678901', name: 'Limpiador multiuso 500 ml', category: 'Limpiadores', price: 2530.25 },
  { product: 'aerosol-verde', ean: '7790006789012', name: 'Desinfectante aerosol 360 ml', category: 'Limpiadores', price: 3180.0 },
  { product: 'shampoo-violeta', ean: '7790007890123', name: 'Shampoo 400 ml', category: 'Cuidado personal', price: 3420.75 },
  { product: 'tubo-crema-celeste', ean: '7790008901234', name: 'Crema dental 90 g', category: 'Cuidado personal', price: 1299.0 },
  { product: 'set-desodorante-aerosol-rollon', ean: '7790009012345', name: 'Desodorante aerosol 150 ml', category: 'Cuidado personal', price: 2760.0 },
  { product: 'dispensador-jabon-celeste', ean: '7790000123456', name: 'Jabón líquido de manos 250 ml', category: 'Cuidado personal', price: 1845.5 },
  { product: 'dispensador-jabon-rosa', ean: '7790000234561', name: 'Jabón líquido de manos 300 ml', category: 'Cuidado personal', price: 2015.0 },
  { product: 'shampoo-azul', ean: '7790000345672', name: 'Shampoo control caspa 400 ml', category: 'Cuidado personal', price: 3690.0 },
  { product: 'doypack-salsa-pizza', ean: '7790000456783', name: 'Salsa para pizza doypack 340 g', category: 'Salsas y aderezos', price: 1390.0 },
] as const;

export type Sku = (typeof SKUS)[number];

/** Categorías del formulario de precios, en el orden de PSMob. */
export const CATEGORIES = ['Lavandina', 'Jabón para la ropa', 'Lavavajillas', 'Limpiadores', 'Cuidado personal', 'Salsas y aderezos'] as const;
export const skusOf = (category: (typeof CATEGORIES)[number]) => SKUS.filter((s) => s.category === category);

export const KPIS = {
  osa: { label: 'OSA', value: 94, unit: '%', delta: '+3,2 pp' },
  visits: { label: 'Visitas hoy', value: 38, unit: '', delta: '+6' },
  alerts: { label: 'Alertas', value: 12, unit: '', delta: '−4' },
  compliance: { label: 'Planograma', value: 87, unit: '%', delta: '+5 pp' },
  shareOfShelf: { label: 'Share of shelf', value: 31, unit: '%', delta: '+1,4 pp' },
} as const;

export const WEEK = [
  { d: 'Lun', v: 0.62 },
  { d: 'Mar', v: 0.74 },
  { d: 'Mié', v: 0.58 },
  { d: 'Jue', v: 0.81 },
  { d: 'Vie', v: 0.9 },
  { d: 'Sáb', v: 0.7 },
  { d: 'Dom', v: 0.46 },
] as const;

export const TEAM = [
  { name: 'Lucía Ferreyra', role: 'Supervisora', initials: 'LF' },
  { name: 'Martín Sosa', role: 'Repositor', initials: 'MS' },
  { name: 'Paula Giménez', role: 'Promotora', initials: 'PG' },
] as const;

export const MESSAGES = [
  { from: 'Lucía Ferreyra', side: 'in' as const, text: 'Hoy priorizá la góndola de limpieza en San Martín.', time: '09:12' },
  { from: 'Vos', side: 'out' as const, text: 'Perfecto, llego 10:15. Subo fotos del exhibidor.', time: '09:14' },
  { from: 'Lucía Ferreyra', side: 'in' as const, text: 'Genial. Revisá precios del frente de caja.', time: '09:15' },
] as const;

/** Moneda estilo AR: $1.234,07 */
export const formatARS = (n: number) =>
  '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatInt = (n: number) => Math.round(n).toLocaleString('es-AR');
