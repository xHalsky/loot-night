export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randi = (a: number, b: number) => Math.floor(rand(a, b + 1));
export const chance = (p: number) => Math.random() < p;
export function pick<T>(xs: readonly T[]): T { return xs[Math.floor(Math.random() * xs.length)]; }
export function weighted(weights: number[]): number {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) { r -= Math.max(0, weights[i]); if (r <= 0) return i; }
  return weights.length - 1;
}
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
