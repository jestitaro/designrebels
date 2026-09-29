import { PHONE } from '../devices/Phone';
import { LAPTOP } from '../devices/Laptop';
import { Rect, zoomToRect } from '../camera/keyframes';

/**
 * Rect de la pantalla del teléfono en coordenadas de mundo, dado el centro del device y su escala.
 * Con zoomToRect(phoneScreenRect(...)) se obtiene el keyframe final del zoom through.
 */
export const phoneScreenRect = (cx: number, cy: number, scale = 1): Rect => ({
  x: cx - (PHONE.screenW * scale) / 2,
  y: cy - (PHONE.screenH * scale) / 2,
  width: PHONE.screenW * scale,
  height: PHONE.screenH * scale,
});

export const laptopScreenRect = (cx: number, cy: number, scale = 1): Rect => {
  const lidTop = cy - ((LAPTOP.lidH + LAPTOP.baseH) * scale) / 2;
  return {
    x: cx - (LAPTOP.screenW * scale) / 2,
    y: lidTop + LAPTOP.bezel * scale,
    width: LAPTOP.screenW * scale,
    height: LAPTOP.screenH * scale,
  };
};

/**
 * Keyframe final de zoom through a un área de la pantalla (por ej. una card concreta de la UI).
 * `area` en coordenadas de pantalla del teléfono (0..390, 0..844).
 */
export const zoomThroughPhoneArea = (cx: number, cy: number, scale: number, area: Rect, fit: 'cover' | 'contain' = 'cover') => {
  const s = phoneScreenRect(cx, cy, scale);
  return zoomToRect({ x: s.x + area.x * scale, y: s.y + area.y * scale, width: area.width * scale, height: area.height * scale }, fit);
};
