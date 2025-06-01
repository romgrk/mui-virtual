export const ceil = Math.ceil;
export const floor = Math.floor;
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
