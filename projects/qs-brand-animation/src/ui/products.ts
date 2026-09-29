/* Generado desde public/products (bounding box del alfa > 16). Alturas aproximadas a ojo (referencia: lavandina 25 cm, crema dental 11,5 cm). Ajustables. */
export type ProductCategory = 'lavandina' | 'ropa' | 'lavavajillas' | 'limpiadores' | 'cuidado';
export type ProductMeta = { file: string; name: string; category: ProductCategory; heightCm: number; w: number; h: number; bbox: [number, number, number, number] };

export const PRODUCTS = {
  'aerosol-verde': { file: 'products/aerosol-verde.png', name: 'Desinfectante aerosol 360 ml', category: 'limpiadores', heightCm: 20, w: 1254, h: 1254, bbox: [410, 55, 844, 1200] },
  'bidon-lavandina-amarillo': { file: 'products/bidon-lavandina-amarillo.png', name: 'Lavandina 2 L', category: 'lavandina', heightCm: 25, w: 1312, h: 1199, bbox: [321, 26, 1029, 1175] },
  'bidon-limpiador-amarillo': { file: 'products/bidon-limpiador-amarillo.png', name: 'Lavandina en gel 1 L', category: 'lavandina', heightCm: 22, w: 1254, h: 1254, bbox: [401, 87, 889, 1172] },
  'detergente-liquido-celeste': { file: 'products/detergente-liquido-celeste.png', name: 'Jabón líquido para ropa 3 L', category: 'ropa', heightCm: 28, w: 1254, h: 1254, bbox: [322, 55, 961, 1202] },
  'dispensador-jabon-celeste': { file: 'products/dispensador-jabon-celeste.png', name: 'Jabón líquido de manos 250 ml', category: 'cuidado', heightCm: 16, w: 1254, h: 1254, bbox: [360, 78, 930, 1185] },
  'lavavajillas-amarillo': { file: 'products/lavavajillas-amarillo.png', name: 'Lavavajillas 500 ml', category: 'lavavajillas', heightCm: 19, w: 1254, h: 1254, bbox: [354, 82, 900, 1186] },
  'rociador-limpiador-verde': { file: 'products/rociador-limpiador-verde.png', name: 'Limpiador multiuso gatillo 500 ml', category: 'limpiadores', heightCm: 24, w: 1144, h: 1375, bbox: [236, 26, 936, 1340] },
  'set-cosmetica-violeta': { file: 'products/set-cosmetica-violeta.png', name: 'Shampoo + acondicionador', category: 'cuidado', heightCm: 20, w: 1254, h: 1254, bbox: [280, 106, 1023, 1186] },
  'set-crema-rosa': { file: 'products/set-crema-rosa.png', name: 'Crema corporal tubo + pote', category: 'cuidado', heightCm: 12, w: 1254, h: 1254, bbox: [141, 136, 1148, 1119] },
  'set-desodorante-aerosol-rollon': { file: 'products/set-desodorante-aerosol-rollon.png', name: 'Desodorante aerosol + roll-on', category: 'cuidado', heightCm: 15, w: 1254, h: 1254, bbox: [289, 93, 1010, 1179] },
  'set-limpieza-celeste': { file: 'products/set-limpieza-celeste.png', name: 'Limpiador baño + inodoro', category: 'limpiadores', heightCm: 25, w: 1254, h: 1254, bbox: [155, 116, 1129, 1162] },
  'shampoo-violeta': { file: 'products/shampoo-violeta.png', name: 'Shampoo 400 ml', category: 'cuidado', heightCm: 19, w: 1312, h: 1199, bbox: [418, 12, 894, 1180] },
  'tubo-crema-celeste': { file: 'products/tubo-crema-celeste.png', name: 'Crema dental 90 g', category: 'cuidado', heightCm: 11.5, w: 1254, h: 1254, bbox: [384, 74, 861, 1192] },
} as const satisfies Record<string, ProductMeta>;

export type ProductId = keyof typeof PRODUCTS;
