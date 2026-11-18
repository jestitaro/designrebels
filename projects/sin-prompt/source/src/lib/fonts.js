// Fuentes autoalojadas (solo subset latino) registradas con la FontFace API.
// Las mismas fuentes se embeben en el SVG al exportar la postal a PNG.
import p400 from '@fontsource/poppins/files/poppins-latin-400-normal.woff2?url';
import p500 from '@fontsource/poppins/files/poppins-latin-500-normal.woff2?url';
import p600 from '@fontsource/poppins/files/poppins-latin-600-normal.woff2?url';
import p700 from '@fontsource/poppins/files/poppins-latin-700-normal.woff2?url';
import m400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import m600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2?url';

const FACES = [
  ['Poppins', p400, '400'],
  ['Poppins', p500, '500'],
  ['Poppins', p600, '600'],
  ['Poppins', p700, '700'],
  ['JetBrains Mono', m400, '400'],
  ['JetBrains Mono', m600, '600'],
];

let loading;
export function loadFonts() {
  if (!loading) {
    loading = Promise.all(
      FACES.map(([family, url, weight]) => {
        const face = new FontFace(family, `url(${url}) format('woff2')`, { weight, display: 'swap' });
        document.fonts.add(face);
        return face.load().catch(() => null);
      }),
    );
  }
  return loading;
}

const toDataUrl = (url) =>
  url.startsWith('data:')
    ? Promise.resolve(url)
    : fetch(url)
        .then((r) => r.blob())
        .then(
          (b) =>
            new Promise((res) => {
              const fr = new FileReader();
              fr.onload = () => res(fr.result);
              fr.readAsDataURL(b);
            }),
        );

let cssCache;
/** CSS con @font-face embebidos, para SVG que se rasteriza fuera del DOM. */
export function getEmbeddedFontCss() {
  if (!cssCache) {
    cssCache = Promise.all(
      FACES.map(async ([family, url, weight]) => {
        const data = await toDataUrl(url);
        return `@font-face{font-family:'${family}';font-weight:${weight};src:url(${data}) format('woff2');}`;
      }),
    ).then((rules) => rules.join(''));
  }
  return cssCache;
}
