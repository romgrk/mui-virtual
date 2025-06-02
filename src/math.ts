import type { float, integer } from './primitives';

export const abs = Math.abs;
export const ceil = Math.ceil;
export const floor = Math.floor;
export const min = Math.min;
export const max = Math.max;
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
export const round = (value: float, decimals: integer) =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;
