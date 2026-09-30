/**
 * Material real de campo (public/footage). Las personas aparecen solo acá, siempre enmascaradas.
 * Los tiempos de cada momento están en segundos del clip original (25 fps).
 */
export const CLIPS = {
  loginIngreso: {
    src: 'footage/login-ingreso.mp4',
    w: 1440,
    h: 1080,
    fps: 25,
    duration: 17,
    moments: {
      /** manos con el celular: login en PSMob y carga */
      login: 0,
      /** pantalla azul de PSMob cargando */
      cargando: 7,
      /** entra al supermercado y sonríe */
      ingreso: 14,
    },
  },
  pasilloFoto: {
    src: 'footage/pasillo-foto-gondola.mp4',
    w: 1440,
    h: 1080,
    fps: 25,
    duration: 10,
    moments: {
      /** pasillo abierto, góndola llena */
      pasillo: 0,
      /** levanta el celular y saca la foto */
      foto: 5,
    },
  },
} as const;

export type ClipId = keyof typeof CLIPS;

export const PHOTOS = {
  reconocimiento: { src: 'footage/reconocimiento-en-uso.jpg', w: 2000, h: 1125 },
  shampoo: { src: 'footage/repositora-gondola-shampoo.jpg', w: 2000, h: 1125 },
  planograma: { src: 'footage/foto-planograma.jpg', w: 2000, h: 1125 },
  fotografia: { src: 'footage/repositora-fotografia-gondola.jpg', w: 2000, h: 1125 },
  sedal: { src: 'footage/repositora-sedal-sonrie.jpg', w: 2000, h: 1125 },
  /** baja resolución (360 px): solo en tamaños chicos */
  verticalA: { src: 'footage/foto-gondola-vertical-a.jpg', w: 360, h: 638 },
  verticalB: { src: 'footage/foto-gondola-vertical-b.jpg', w: 360, h: 640 },
} as const;

export type PhotoId = keyof typeof PHOTOS;
