import { T } from '../config/tuning';
import { N, type CuddleGame } from '../core/state';
import { clamp } from '../core/rng';
import { cuddleDone } from './visits';

// Cuddle (docs/design/her.md): she asks you over. Follow her slow breathing: a dot drifts along a heart-shaped
// path over CUDDLE_SEC; keep the cursor near it without rushing. Warmth builds near the dot and drains when you
// are far or jerky. Forced on you, so the party keeps the normal (safe) autopilot and Flow is frozen.

export const CUDDLE_W = 420, CUDDLE_H = 230;

/** The breathing dot: a slow heart curve in window coordinates, p in 0..1. */
export function cuddleDot(p: number): [number, number] {
  const a = p * Math.PI * 2;
  const x = 16 * Math.sin(a) ** 3;
  const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
  return [CUDDLE_W / 2 + x * 9, CUDDLE_H / 2 - 10 - y * 7.5];
}

export function startCuddle() {
  const n = N();
  const [x, y] = cuddleDot(0);
  n.game = { kind: 'cuddle', t: T.CUDDLE_SEC, max: T.CUDDLE_SEC, warmth: 0.3, mx: x, my: y, lastMx: x, lastMy: y, jerk: 0 };
  n.action = 'miniGame';
}

/** Cursor position inside the cuddle window. */
export function cuddlePointer(x: number, y: number) {
  const g = N().game;
  if (g?.kind !== 'cuddle') return;
  g.mx = x; g.my = y;
}

export function updateCuddle(dt: number) {
  const n = N();
  const g = n.game as CuddleGame | null;
  if (g?.kind !== 'cuddle') return;
  g.t -= dt;
  const speed = Math.hypot(g.mx - g.lastMx, g.my - g.lastMy) / Math.max(dt, 1e-3);
  g.lastMx = g.mx; g.lastMy = g.my;
  g.jerk = speed > T.CUDDLE_JERK ? 0.4 : Math.max(0, g.jerk - dt);
  const [dx, dy] = cuddleDot(1 - g.t / g.max);
  const near = Math.hypot(g.mx - dx, g.my - dy) < T.CUDDLE_RADIUS;
  g.warmth = clamp(g.warmth + (g.jerk > 0 ? -0.5 : near ? 0.16 : -0.1) * dt, 0, 1);
  if (g.t <= 0) endCuddle(g.warmth);
}

/** score null = you pulled away (closed the window). */
export function endCuddle(score: number | null) {
  const n = N();
  if (n.game?.kind !== 'cuddle') return;
  n.game = null; n.action = 'none';
  cuddleDone(score);
}
