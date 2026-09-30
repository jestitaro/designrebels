/* Generado por scripts/build-manifests.py (bounding box del alfa > 16). No editar a mano. */
export type PoseKind = 'standing' | 'seated' | 'fallen' | 'closeup';
export type PoseMeta = { w: number; h: number; bbox: [number, number, number, number]; kind: PoseKind };

export const POSES = {
  caro: {
    'caida': { w: 1024, h: 1536, bbox: [52, 182, 1012, 1274], kind: 'fallen' },
    'caminando-cerca-2': { w: 1024, h: 1536, bbox: [204, 33, 918, 1493], kind: 'standing' },
    'caminando-cerca': { w: 1024, h: 1536, bbox: [178, 27, 936, 1493], kind: 'standing' },
    'caminando-ciclo-01': { w: 1024, h: 1536, bbox: [136, 177, 797, 1418], kind: 'standing' },
    'caminando-ciclo-02': { w: 1024, h: 1536, bbox: [161, 179, 719, 1416], kind: 'standing' },
    'caminando-ciclo-03': { w: 1024, h: 1536, bbox: [171, 179, 730, 1416], kind: 'standing' },
    'caminando-ciclo-04': { w: 1024, h: 1536, bbox: [204, 177, 664, 1418], kind: 'standing' },
    'caminando-ciclo-05': { w: 1024, h: 1536, bbox: [185, 177, 715, 1417], kind: 'standing' },
    'caminando-ciclo-06': { w: 1024, h: 1536, bbox: [177, 176, 798, 1419], kind: 'standing' },
    'caminando': { w: 1024, h: 1536, bbox: [197, 28, 877, 1487], kind: 'standing' },
    'celular-sonriendo': { w: 1024, h: 1536, bbox: [257, 34, 762, 1514], kind: 'standing' },
    'celular': { w: 1024, h: 1536, bbox: [257, 35, 759, 1513], kind: 'standing' },
    'durmiendo': { w: 1086, h: 1448, bbox: [243, 25, 861, 1418], kind: 'seated' },
    'estres': { w: 1024, h: 1536, bbox: [241, 36, 800, 1516], kind: 'standing' },
    'mostrando-celu': { w: 1448, h: 1086, bbox: [170, 0, 1448, 1086], kind: 'closeup' },
    'mostrando-pantalla': { w: 1086, h: 1448, bbox: [276, 30, 772, 1429], kind: 'standing' },
    'pensando': { w: 1024, h: 1536, bbox: [249, 39, 728, 1510], kind: 'standing' },
    'producto-celular': { w: 1024, h: 1536, bbox: [162, 41, 917, 1498], kind: 'standing' },
    'sentada': { w: 1086, h: 1448, bbox: [229, 69, 885, 1398], kind: 'seated' },
  },
  nico: {
    'caminando-cerca-2': { w: 1024, h: 1536, bbox: [224, 26, 893, 1495], kind: 'standing' },
    'caminando-cerca': { w: 1024, h: 1536, bbox: [164, 30, 932, 1495], kind: 'standing' },
    'caminando-ciclo-01': { w: 1024, h: 1536, bbox: [226, 204, 844, 1452], kind: 'standing' },
    'caminando-ciclo-02': { w: 1024, h: 1536, bbox: [304, 202, 686, 1452], kind: 'standing' },
    'caminando-ciclo-03': { w: 1024, h: 1536, bbox: [187, 210, 870, 1452], kind: 'standing' },
    'caminando-ciclo-04': { w: 1024, h: 1536, bbox: [348, 206, 684, 1452], kind: 'standing' },
    'caminando-ciclo-05': { w: 1024, h: 1536, bbox: [213, 202, 848, 1452], kind: 'standing' },
    'caminando-ciclo-06': { w: 1024, h: 1536, bbox: [277, 203, 696, 1451], kind: 'standing' },
    'caminando': { w: 1024, h: 1536, bbox: [163, 29, 875, 1507], kind: 'standing' },
    'celular-sonriendo': { w: 1024, h: 1536, bbox: [257, 39, 805, 1530], kind: 'standing' },
    'celular': { w: 941, h: 1672, bbox: [219, 51, 770, 1643], kind: 'standing' },
    'durmiendo': { w: 1086, h: 1448, bbox: [225, 42, 902, 1416], kind: 'seated' },
    'explicando': { w: 941, h: 1672, bbox: [67, 48, 801, 1645], kind: 'standing' },
    'mostrando-celu': { w: 1448, h: 1086, bbox: [263, 0, 1448, 1086], kind: 'closeup' },
    'mostrando-pantalla': { w: 1086, h: 1448, bbox: [261, 18, 868, 1423], kind: 'standing' },
    'producto-celular': { w: 1024, h: 1536, bbox: [191, 31, 823, 1502], kind: 'standing' },
    'sentado': { w: 1086, h: 1448, bbox: [180, 56, 962, 1409], kind: 'seated' },
  },
} as const satisfies Record<string, Record<string, PoseMeta>>;

export type CaroPose = keyof typeof POSES.caro;
export type NicoPose = keyof typeof POSES.nico;
