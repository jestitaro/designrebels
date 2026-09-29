/** FPS de trabajo. Todas las duraciones del proyecto se expresan en segundos vía sec(). */
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const sec = (n: number, fps: number = FPS) => Math.round(n * fps);

export type Range = { from: number; to: number };

/** Rango en frames a partir de segundos. */
export const secRange = (fromSec: number, durSec: number, fps: number = FPS): Range => ({
  from: sec(fromSec, fps),
  to: sec(fromSec + durSec, fps),
});

export const inRange = (frame: number, r: Range) => frame >= r.from && frame < r.to;

/** Timecode HH:MM:SS:FF */
export const timecode = (frame: number, fps: number = FPS) => {
  const ff = frame % fps;
  const total = Math.floor(frame / fps);
  const ss = total % 60;
  const mm = Math.floor(total / 60) % 60;
  const hh = Math.floor(total / 3600);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`;
};
