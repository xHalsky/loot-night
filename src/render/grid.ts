/** The redesign's one pixel grid (V1, #66; grid doc §1): the whole game is 640 x 360 grid pixels, shown at a whole
 *  number of screen pixels per grid pixel (x2 720p and the Steam Deck, x3 1080p, x4 1440p, x6 4K) and letterboxed
 *  in anything else. */
export const GRID_W = 640, GRID_H = 360;
/** The DOM stage is still laid out in CSS pixels at x2 (1280 x 720) while the parts move onto the grid. */
export const STAGE_K = 2;
/** The largest whole-number scale that fits the window, counted in device pixels so it stays crisp at any OS zoom. */
export function gridScale(w: number, h: number, dpr: number): number {
  return Math.max(1, Math.floor(Math.min((w * dpr) / GRID_W, (h * dpr) / GRID_H)));
}
