import { random } from 'remotion';

/** Wrappers sobre random(seed) de Remotion. Siempre con seeds fijas: nunca Math.random(). */
export const rand = (seed: string | number) => random(seed);
export const randRange = (seed: string | number, min: number, max: number) => min + random(seed) * (max - min);
export const randInt = (seed: string | number, min: number, max: number) => Math.floor(randRange(seed, min, max + 1));
export const pick = <T,>(seed: string | number, items: readonly T[]): T => items[Math.floor(random(seed) * items.length)];
export const randSigned = (seed: string | number, amp = 1) => (random(seed) * 2 - 1) * amp;
