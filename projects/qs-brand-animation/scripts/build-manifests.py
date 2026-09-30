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


# Poses con un celular de frente: se mide el rect de la pantalla (región blanca) para el zoom through.
SCREEN_SEED = {'mostrando-celu': 'auto'}


def screen_rect(path):
    """Rect de la pantalla blanca del celular: flood fill desde el punto blanco más denso de la mitad izquierda."""
    from collections import deque
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    px = im.load()

    def white(x, y):
        r, g, b, a = px[x, y]
        return r > 235 and g > 235 and b > 235 and a > 200

    # semilla: primer píxel blanco en una grilla sobre la mitad izquierda con vecinos blancos
    seed = None
    for y in range(int(h * 0.3), int(h * 0.7), 8):
        for x in range(int(w * 0.1), int(w * 0.5), 8):
            if all(white(x + dx, y + dy) for dx in (-6, 0, 6) for dy in (-6, 0, 6)):
                seed = (x, y)
                break
        if seed:
            break
    if not seed:
        return None
    seen = {seed}
    q = deque([seed])
    x0 = x1 = seed[0]
    y0 = y1 = seed[1]
    while q:
        x, y = q.popleft()
        x0, x1, y0, y1 = min(x0, x), max(x1, x), min(y0, y), max(y1, y)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and white(nx, ny):
                seen.add((nx, ny))
                q.append((nx, ny))
    return [x0, y0, x1, y1]


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
        '/** screen: rect de la pantalla del celular (poses con celular de frente), para el zoom through */',
        'export type PoseMeta = { w: number; h: number; bbox: [number, number, number, number]; kind: PoseKind; screen?: [number, number, number, number] };',
        '',
        'export const POSES = {',
    ]
    for who in ['caro', 'nico']:
        lines.append(f'  {who}: {{')
        for f in sorted(glob.glob(os.path.join(ROOT, f'public/characters/{who}/*.png'))):
            name = os.path.basename(f)[:-4]
            (w, h), bb = bbox(f)
            kind = POSE_KIND.get(name, 'standing')
            extra = ''
            if name in SCREEN_SEED:
                sr = screen_rect(f)
                if sr:
                    extra = f", screen: [{', '.join(map(str, sr))}]"
            lines.append(f"    '{name}': {{ w: {w}, h: {h}, bbox: [{', '.join(map(str, bb))}], kind: '{kind}'{extra} }},")
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
