// Q4 (step 4, #55; grid doc 7i): what the renderer's Excel window shows, and the mouse on it. The rules are in
// systems/q4.ts; here: the view model, the drag of the fill handle (how far and how fast decide the cells), the grab
// and fling of the pivot table (its angle follows the pointer round the disc; the fling's speed is the spin), and
// which button is held down.
import { S, N } from '../core/state';
import { T } from '../config/tuning';
import { Q4_TITLES } from '../data/q4';
import { q4Title, q4Rate, toyMult, macroLv, macroCost, macroUnlocked, pivotUnlocked, q4Sum, q4Sort, q4Fill, q4PivotGrab, q4PivotTurn, q4Buy, q4PromoOk, MACROS } from '../systems/q4';

type Hit = { x: number; y: number; w: number; h: number; act: string; arg: string };
let hits: Hit[] = [], press = '', pressT = 0;
let drag: { y0: number; y: number; samples: [number, number][] } | null = null;
let grab: { a: number; samples: [number, number][] } | null = null;
let flashUntil = 0, flashTitle = -1;
const PIVOT_C = [266, 134];   // the disc's centre on the game screen (q4.js: column E, row 6), its height squashed x0.42

const UNLOCKS = (k: number) => {
  const m = MACROS.filter(x => T.Q4_MACRO_AT[x.id] === k).map(x => x.name);
  if (k === T.Q4_PIVOT_AT) m.unshift('the pivot spinner');
  if (k === 4) m.push(`Sort cools down ${T.Q4_SORT_CD_LEAD} s faster`);
  return m.join(', ');
};

export function q4View(now: number) {
  const g = S.g, n = N(), q = n.q4, k = q4Title(), next = k + 1 < Q4_TITLES.length ? k + 1 : -1;
  if (q.promo && q.promo.title !== flashTitle) { flashTitle = q.promo.title; flashUntil = now + 2500; }
  if (press && now - pressT > 120) press = '';
  const newly = now < flashUntil ? flashTitle : -1;
  return {
    title: Q4_TITLES[k], next: next >= 0 ? Q4_TITLES[next] : null, life: Math.floor(g.q4.life), need: next >= 0 ? T.Q4_TITLE_AT[next] : 1,
    zlps: q4Rate(), tonight: q.tonight, wallet: Math.floor(g.zl),
    sortT: q.sortT, sortCd: q.sortCd, flap: q.flapT > 0 ? 1 - q.flapT / T.Q4_SORT_FLAP_SEC : -1,
    hustle: 1 + (T.Q4_HUSTLE_MAX - 1) * q.hustle,
    sums: q.sums, roll: q.roll > 0, stamp: q.stamp,
    fill: { done: q.fill?.done ?? 0, sel: drag ? Math.max(0, (drag.y - drag.y0) / 12) : 0 },
    pivot: { ang: q.pivot.ang, om: q.pivot.om, grab: q.pivot.grab, unlocked: pivotUnlocked(), at: Q4_TITLES[T.Q4_PIVOT_AT] },
    macros: MACROS.map(m => ({ id: m.id, name: m.name, lv: macroLv(m.id), cost: macroCost(m.id), fx: m.fx(Math.max(1, macroLv(m.id))),
      locked: !macroUnlocked(m.id), at: Q4_TITLES[T.Q4_MACRO_AT[m.id]], ok: macroUnlocked(m.id) && g.zl >= macroCost(m.id), flash: newly >= 0 && T.Q4_MACRO_AT[m.id] === newly })),
    pops: q.pops.map(p => ({ s: p.s, toy: p.toy, i: p.i, k: p.t })),
    promo: q.promo ? { title: Q4_TITLES[q.promo.title], mult: T.Q4_TITLE_MULT, unlocks: UNLOCKS(q.promo.title), k: q.promo.t } : null,
    press, last: q.last,
    status: q.promo ? 'Promoted!' : drag ? 'Drag to fill' : q.sortT > 0 ? 'Sorted. Everything x2.' : n.q4.asked ? 'What are you working on?' : toyMult() > 1.05 && q.hustle > 0 ? 'Hustle!' : 'Ready',
  };
}
export function q4SetHits(h: Hit[]) { hits = h; }
const hitAt = (x: number, y: number) => hits.find(h => x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) ?? null;
const angAt = (x: number, y: number) => Math.atan2((y - PIVOT_C[1]) / 0.42, x - PIVOT_C[0]);

/** The pointer went down on the game screen (its px): a button, the fill handle, the pivot. True when it was Q4's. */
export function q4Down(x: number, y: number, now: number): boolean {
  const h = hitAt(x, y);
  if (!h) return false;
  if (h.act === 'q4PromoOk') { q4PromoOk(); return true; }
  if (N().q4.promo) return true;   // the dialog first
  if (h.act === 'q4Sum') { q4Sum(); press = 'sum'; pressT = now; }
  else if (h.act === 'q4Sort') { if (N().q4.sortCd <= 0) { q4Sort(); press = 'sort'; pressT = now; } }
  else if (h.act === 'q4Fill') drag = { y0: y, y, samples: [[now, y]] };
  else if (h.act === 'q4Pivot') { q4PivotGrab(true); grab = { a: angAt(x, y), samples: [[now, angAt(x, y)]] }; }
  else if (h.act === 'q4Buy') q4Buy(h.arg as never);
  return true;
}
export function q4Move(x: number, y: number, now: number) {
  if (drag) { drag.y = Math.max(drag.y0, y); drag.samples.push([now, drag.y]); drag.samples = drag.samples.filter(s => now - s[0] < 150); }
  if (grab) {
    const a = angAt(x, y); let d = a - grab.a; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
    grab.a = a; q4PivotTurn(d); grab.samples.push([now, d]); grab.samples = grab.samples.filter(s => now - s[0] < 120);
  }
}
/** Let go: a flick fills cells by how far (rows) and how fast you dragged; a fling spins the pivot at its speed. */
export function q4Up(now: number) {
  if (drag) {
    const rows = (drag.y - drag.y0) / 12, s = drag.samples, dt = s.length > 1 ? (s[s.length - 1][0] - s[0][0]) / 1000 : 0;
    const speed = dt > 0 ? (s[s.length - 1][1] - s[0][1]) / 12 / dt : 0;   // rows a second at the end of the flick
    if (rows >= 0.5) q4Fill(rows * (1 + Math.min(1, Math.max(0, speed) / 20)));
    drag = null;
  }
  if (grab) {
    const s = grab.samples, span = s.length > 1 ? (now - s[0][0]) / 1000 : 0, sum = s.reduce((a, b) => a + b[1], 0);
    q4PivotGrab(false, span > 0.01 ? sum / span : 0);
    grab = null;
  }
}
/** The pointer's look over the sheet: Excel's arrow, the cell cross, the fill cross on the handle. */
export function q4CursorKind(x: number, y: number): 'arrow' | 'cell' | 'fill' | 'pointer' {
  if (drag) return 'fill';
  const h = hitAt(x, y);
  if (h?.act === 'q4Fill') return 'fill';
  if (h) return 'pointer';
  return x >= 14 && x < 314 && y >= 64 && y < 204 ? 'cell' : 'arrow';
}
export const q4Dragging = () => !!drag || !!grab;
