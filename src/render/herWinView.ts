// Her windows (V9, #74; grid doc 7g): the cuddle break's view for the renderer (PK.cuddle). The rules stay in
// systems/cuddle.ts, in the build's units (the old DOM window's CSS px); the renderer's window draws the same heart at
// half that size round its own centre, so the two map exactly (the ring's 17 px is the rules' 34, "too fast" at 450
// px/s is their 900).
import { N, type CuddleGame } from '../core/state';
import { T } from '../config/tuning';
import { cuddleDot, CUDDLE_W, CUDDLE_H } from '../systems/cuddle';

/** The window on the right screen (grid px; its pink name tab sits 9 px above). */
export const CUD_WIN = { x: 112, y: 20, w: 268, h: 204 };
const BUILD = { x: CUDDLE_W / 2, y: CUDDLE_H / 2 - 10 }, WIN = { x: 134, y: 92 };   // the heart's centre in each
export const winToCuddle = (x: number, y: number): [number, number] => [BUILD.x + (x - WIN.x) * 2, BUILD.y + (y - WIN.y) * 2];

/** mouse: the cursor in window px, or null off the window (the hand is the cursor, drawn only over the window). */
export function cuddleView(mouse: [number, number] | null) {
  const g = N().game as CuddleGame;
  const p = 1 - g.t / g.max, [dx, dy] = cuddleDot(Math.min(1, Math.max(0, p)));
  return {
    p, warmth: g.warmth, jerk: g.jerk, near: Math.hypot(g.mx - dx, g.my - dy) < T.CUDDLE_RADIUS,
    mx: mouse ? mouse[0] : null, my: mouse ? mouse[1] : null, secs: Math.max(1, Math.ceil(g.t)),
  };
}
