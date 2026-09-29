import { getStaticFiles, staticFile } from 'remotion';

/**
 * Registro de assets aprobados. Los archivos se detectan en /public:
 * cuando lleguen los SVG oficiales y los PNG de personajes, alcanza con copiarlos
 * a las rutas de abajo: los placeholders se reemplazan solos.
 */
export const LOGO_FILES = {
  iso: 'logos/iso-qs.svg',
  fullColor: 'logos/logo-qs-fullcolor.svg',
  wordmarkLight: 'logos/tipo-qs-bg-light.svg',
} as const;

export type LogoKey = keyof typeof LOGO_FILES;

export type CharacterName = 'caro' | 'nico';

const files = () => {
  try {
    return getStaticFiles().map((f) => f.name.replace(/^\/+/, ''));
  } catch {
    return [] as string[];
  }
};

export const hasAsset = (path: string) => files().includes(path);

export const logoSrc = (key: LogoKey): string | null => (hasAsset(LOGO_FILES[key]) ? staticFile(LOGO_FILES[key]) : null);

/** Poses disponibles: nombre de archivo sin extensión en public/characters/<nombre>/*.png */
export const characterPoses = (who: CharacterName): string[] =>
  files()
    .filter((f) => f.startsWith(`characters/${who}/`) && f.toLowerCase().endsWith('.png'))
    .map((f) => f.slice(`characters/${who}/`.length, -4))
    .sort();

export const characterSrc = (who: CharacterName, pose: string): string | null => {
  const path = `characters/${who}/${pose}.png`;
  return hasAsset(path) ? staticFile(path) : null;
};
