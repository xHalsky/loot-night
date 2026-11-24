// The battle area drawn by the redesign's renderer (V2, #67): a 334 x 232 canvas over the old one, shown at the
// stage's scale, redrawn at 30 fps. Clicks and hovers come back through the renderer's hit regions (grid px).
import { PK } from 'virtual:pagekit';
import { S } from '../core/state';
import { buildBattleView, liveActive, type PartyPointer } from './rpgView';

type Hit = { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string };
let started = false, ready = false, lastDraw = 0, shown = false;
let hits: Hit[] = [];
let msAvg = 0;
let ptr: [number, number] | null = null, hovPath = -1, hovT = 0;
/** The pointer over the battle area (grid px), for hovers the renderer draws (the floor map's paths, a hero's card). */
export function livePointer(p: [number, number] | null) { ptr = p; if (drag && p) { drag.x = p[0]; drag.y = p[1]; if (Math.hypot(p[0] - drag.x0, p[1] - drag.y0) > 4) drag.moved = true; } }
// Swap by drag (marching order, #52 1.6): press on a portrait or a hero, drag onto another, let go.
let drag: { from: number; x0: number; y0: number; x: number; y: number; moved: boolean } | null = null;
const heroAt = (x: number, y: number) => { const h = liveHitAt(x, y); return h && (h.act === 'heroTab' || h.act === 'hero') ? Number(h.arg) : -1; };
export function liveDragStart(x: number, y: number): boolean {
  const i = heroAt(x, y);
  if (i < 0) return false;
  drag = { from: i, x0: x, y0: y, x, y, moved: false };
  return true;
}
/** The drag ends: a swap when it was dropped on another hero, else the press was a click (select the hero). */
export function liveDragEnd(): { from: number; to: number; moved: boolean } | null {
  if (!drag) return null;
  const d = drag; drag = null;
  return { from: d.from, to: d.moved ? heroAt(d.x, d.y) : -1, moved: d.moved };
}
export const liveDragging = () => !!drag?.moved;
/** The renderer's cost per drawn frame (ms, smoothed), for the F1 overlay. */
export function liveMs(): number { return shown ? msAvg : 0; }
const FRAME_MS = 1000 / 30;

/** True while the live battle area is on screen (the old canvas and its DOM overlays stand down). */
export function liveShown(): boolean { return shown; }

export function drawLiveRpg(cv: HTMLCanvasElement) {
  if (!started) { started = true; PK.init().then(() => { ready = true; }); }
  const n = S.g.night;
  const on = ready && liveActive() && !!n && n.monitor === 'rpg' && !n.switching && n.monitorOff <= 0;
  if (on !== shown) { shown = on; cv.style.display = on ? 'block' : 'none'; if (!on) hits = []; }
  if (!on) return;
  const now = performance.now();
  if (now - lastDraw < FRAME_MS - 1) return;
  lastDraw = now;
  const h = ptr ? liveHitAt(ptr[0], ptr[1]) : null, hp = h?.act === 'path' ? Number(h.arg) : -1;
  if (hp !== hovPath) { hovPath = hp; hovT = now / 1000; }
  const pp: PartyPointer = { drag: drag?.moved ? { from: drag.from, x: drag.x, y: drag.y, over: heroAt(drag.x, drag.y) } : null, hover: h?.act === 'hero' ? Number(h.arg) : -1 };
  const r = PK.battleArea(buildBattleView(now, hovPath, hovT, pp), now / 1000);
  cv.getContext('2d')!.drawImage(r.canvas, 0, 0);
  const ms = performance.now() - now; msAvg = msAvg ? msAvg * 0.9 + ms * 0.1 : ms;
  hits = r.hits;
}

/** The topmost hit region under a point in grid px (later regions are drawn over earlier ones). */
export function liveHitAt(x: number, y: number): Hit | null {
  for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return h; }
  return null;
}
