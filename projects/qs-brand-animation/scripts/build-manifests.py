#!/usr/bin/env python3
"""
Regenera src/characters/poses.ts y src/ui/products.ts a partir de /public.
Mide el bounding box del canal alfa de cada PNG (alfa > 16).
Uso: npm run manifests   (requiere Python 3 + Pillow)
"""
import glob
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Alturas aproximadas a ojo. Referencias acordadas: lavandina 25 cm, crema dental 11,5 cm.
PRODUCT_INFO = {
    'bidon-lavandina-amarillo': ('lavandina', 25, 'Lavandina 2 L'),
    'bidon-limpiador-amarillo': ('lavandina', 22, 'Lavandina en gel 1 L'),
    'detergente-liquido-celeste': ('ropa', 28, 'Jabón líquido para ropa 3 L'),
    'lavavajillas-amarillo': ('lavavajillas', 19, 'Lavavajillas 500 ml'),
    'rociador-limpiador-verde': ('limpiadores', 24, 'Limpiador multiuso gatillo 500 ml'),
    'set-limpieza-celeste': ('limpiadores', 25, 'Limpiador baño + inodoro'),
    'aerosol-verde': ('limpiadores', 20, 'Desinfectante aerosol 360 ml'),
    'shampoo-violeta': ('cuidado', 19, 'Shampoo 400 ml'),
    'shampoo-azul': ('cuidado', 20, 'Shampoo 400 ml azul'),
    'set-cosmetica-violeta': ('cuidado', 20, 'Shampoo + acondicionador'),
    'dispensador-jabon-celeste': ('cuidado', 16, 'Jabón líquido de manos 250 ml'),
    'dispensador-jabon-rosa': ('cuidado', 17, 'Jabón líquido de manos 300 ml'),
    'set-desodorante-aerosol-rollon': ('cuidado', 15, 'Desodorante aerosol + roll-on'),
    'tubo-crema-celeste': ('cuidado', 11.5, 'Crema dental 90 g'),
    'set-crema-rosa': ('cuidado', 12, 'Crema corporal tubo + pote'),
    'doypack-salsa-pizza': ('almacen', 18, 'Salsa para pizza doypack 340 g'),
}

POSE_KIND = {
    'mostrando-celu': 'closeup',
    'sentada': 'seated',
    'sentado': 'seated',
    'durmiendo': 'seated',
    'caida': 'fallen',
}


def bbox(path):
    im = Image.open(path)
    bb = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    return im.size, bb


def fmt(v):
    return str(v).rstrip('0').rstrip('.') if isinstance(v, float) else str(v)


def build_poses():
    lines = [
        '/* Generado por scripts/build-manifests.py (bounding box del alfa > 16). No editar a mano. */',
        "export type PoseKind = 'standing' | 'seated' | 'fallen' | 'closeup';",
        'export type PoseMeta = { w: number; h: number; bbox: [number, number, number, number]; kind: PoseKind };',
        '',
        'export const POSES = {',
    ]
    for who in ['caro', 'nico']:
        lines.append(f'  {who}: {{')
        for f in sorted(glob.glob(os.path.join(ROOT, f'public/characters/{who}/*.png'))):
            name = os.path.basename(f)[:-4]
            (w, h), bb = bbox(f)
            kind = POSE_KIND.get(name, 'standing')
            lines.append(f"    '{name}': {{ w: {w}, h: {h}, bbox: [{', '.join(map(str, bb))}], kind: '{kind}' }},")
        lines.append('  },')
    lines += [
        '} as const satisfies Record<string, Record<string, PoseMeta>>;',
        '',
        'export type CaroPose = keyof typeof POSES.caro;',
        'export type NicoPose = keyof typeof POSES.nico;',
    ]
    open(os.path.join(ROOT, 'src/characters/poses.ts'), 'w').write('\n'.join(lines) + '\n')


def build_products():
    lines = [
        '/* Generado por scripts/build-manifests.py. Alturas a ojo (referencia: lavandina 25 cm, crema dental 11,5 cm). */',
        "export type ProductCategory = 'lavandina' | 'ropa' | 'lavavajillas' | 'limpiadores' | 'cuidado' | 'almacen';",
        'export type ProductMeta = { file: string; name: string; category: ProductCategory; heightCm: number; w: number; h: number; bbox: [number, number, number, number] };',
        '',
        'export const PRODUCTS = {',
    ]
    missing = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'public/products/*.png'))):
        k = os.path.basename(f)[:-4]
        if k not in PRODUCT_INFO:
            missing.append(k)
            continue
        c, cm, n = PRODUCT_INFO[k]
        (w, h), bb = bbox(f)
        lines.append(f"  '{k}': {{ file: 'products/{k}.png', name: '{n}', category: '{c}', heightCm: {fmt(cm)}, w: {w}, h: {h}, bbox: [{', '.join(map(str, bb))}] }},")
    lines += ['} as const satisfies Record<string, ProductMeta>;', '', 'export type ProductId = keyof typeof PRODUCTS;']
    open(os.path.join(ROOT, 'src/ui/products.ts'), 'w').write('\n'.join(lines) + '\n')
    if missing:
        print('Productos sin datos en PRODUCT_INFO (no incluidos):', ', '.join(missing))


if __name__ == '__main__':
    build_poses()
    build_products()
    print('poses.ts y products.ts regenerados')
