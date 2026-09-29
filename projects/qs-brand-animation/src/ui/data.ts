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

export const SKUS = [
  { ean: '7790001234567', name: 'Detergente concentrado 750 ml', category: 'Limpieza', price: 1890.5 },
  { ean: '7790002345678', name: 'Salsa de tomate 520 g', category: 'Almacén', price: 1245.0 },
  { ean: '7790003456789', name: 'Shampoo reparación 400 ml', category: 'Personal care', price: 3420.75 },
  { ean: '7790004567890', name: 'Desodorante aerosol 150 ml', category: 'Personal care', price: 2760.0 },
  { ean: '7790005678901', name: 'Suavizante doypack 900 ml', category: 'Limpieza', price: 1530.25 },
  { ean: '7790006789012', name: 'Mayonesa frasco 250 g', category: 'Almacén', price: 1180.0 },
] as const;

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
