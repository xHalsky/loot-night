import { T } from '../config/tuning';
import { S, N, type Q4Night } from '../core/state';
import { Q4_TITLES, MACROS, type MacroId } from '../data/q4';
import { sfx } from '../ui/audio';
import { toastAs } from '../core/fx';
import { tip } from './tips';
const toast = toastAs('Q4');

// Q4, the Excel clicker (handoff step 4, #55; docs/design/desk.md, Q4). Excel is your job: every toy pays zl into the
// wallet the Auction House pays into, the titles come fast from lifetime zl, and the macros keep earning all night,
// in the RPG and the town too. Hustle rewards short stints in Excel (her visits); looking busy (FNAF 2's mask) moves
// her visit along while she is in. All numbers in tuning.ts (grid doc 7i).

export function newQ4Night(): Q4Night {
  return { tonight: 0, sortT: 0, sortCd: 0, flapT: 0, charge: 1, hustle: 0, lastAct: -99, asked: false, roll: 0, stamp: 0, sums: 0,
    fill: null, pivot: { ang: 0.6, om: 0, acc: 0, grab: false }, auto: { sum: 0, fill: 0, turn: 0 }, pops: [], promo: null, last: 'sum' };
}

/** The title from lifetime zl (an index into Q4_TITLES). */
export function q4Title(life = S.g.q4.life): number { let k = 0; T.Q4_TITLE_AT.forEach((at, i) => { if (life >= at) k = i; }); return k; }
export const q4TitleName = (k = q4Title()) => Q4_TITLES[k];
export const macroLv = (id: MacroId) => S.g.q4.macros[id] ?? 0;
export const macroCost = (id: MacroId) => Math.round(T.Q4_MACRO_BASE[id] * T.Q4_MACRO_GROWTH ** macroLv(id));
export const macroUnlocked = (id: MacroId) => q4Title() >= T.Q4_MACRO_AT[id];
export const pivotUnlocked = () => q4Title() >= T.Q4_PIVOT_AT;
const titleMult = () => T.Q4_TITLE_MULT ** q4Title();
const sortMult = () => (N().q4.sortT > 0 ? T.Q4_SORT_MULT : 1);
/** What the toys pay times: the title, Sort, Hustle (x1 to x3). */
export const toyMult = () => titleMult() * sortMult() * (1 + (T.Q4_HUSTLE_MAX - 1) * N().q4.hustle);
/** What the macros pay times: the title, Sort, Power Query (not Hustle). */
const macroMult = () => titleMult() * sortMult() * (1 + T.Q4_PQ * macroLv('pq'));
export const balancedChance = () => Math.min(T.Q4_COND_MAX, T.Q4_BALANCED_CHANCE + T.Q4_COND * macroLv('cond'));
const cellPay = () => T.Q4_FILL_CELL * (1 + T.Q4_VLOOKUP * macroLv('vlookup'));
/** What the macros make a second right now (the sheet's "Pays" row). */
export function q4Rate(): number {
  return macroMult() * (macroLv('intern') * T.Q4_INTERN_SUMS * T.Q4_SUM * (1 + balancedChance() * (T.Q4_BALANCED_MULT - 1))
    + macroLv('autofill') * T.Q4_AUTOFILL_CELLS * cellPay() + macroLv('pivotm') * T.Q4_PIVOTM_TURNS * T.Q4_PIVOT_TURN);
}
export const q4Up = () => { const n = N(); return n.monitor === 'excel' && !n.switching && n.monitorOff <= 0; };
const fmtZl = (v: number) => (v >= 100 ? String(Math.round(v)) : v.toFixed(1));

function pay(zl: number, toy: string, i = 0) {
  const n = N(), q = n.q4;
  S.g.zl += zl; q.tonight += zl; S.g.q4.life += zl;
  if (q4Up() && zl > 0) { q.pops.push({ s: '+' + fmtZl(zl), toy, i, t: 0 }); if (q.pops.length > 14) q.pops.shift(); }
  const k = q4Title();
  if (k > S.g.q4.rank) {   // a promotion: the dialog shows in Excel (now, or the next time it is up)
    S.g.q4.rank = k; q.promo = { title: k, t: 0 };
    toast(`Promoted: ${Q4_TITLES[k]}. Q4 pays x${T.Q4_TITLE_MULT} more.`, '#9fe08a');
    if (q4Up()) sfx.q4Promo();
  }
}
/** A toy was used: you look busy; it makes a little Noise (the Silent keys halve it, step 4.6). */
function act(noise: number) {
  const n = N();
  n.q4.lastAct = n.threat; n.q4.asked = false;
  n.noise += noise * (S.g.owned?.includes('keys') ? 0.5 : 1);
}
const canAct = () => q4Up() && !N().q4.promo;

/** AutoSum: Space or the big sigma. The column rolls; now and then it lands BALANCED (x5). */
export function q4Sum() {
  if (!canAct()) return;
  const q = N().q4, bal = Math.random() < balancedChance();
  q.roll = T.Q4_ROLL_SEC; q.sums++; q.last = 'sum';
  if (bal) q.stamp = 0.7;
  pay(T.Q4_SUM * toyMult() * (bal ? T.Q4_BALANCED_MULT : 1), 'sum');
  act(T.Q4_NOISE); bal ? sfx.q4Stamp() : sfx.q4Sum();
}
/** Fill flick: the cells a flick fills (the UI works them out from how far and how fast you dragged). */
export function q4Fill(cells: number) {
  if (!canAct()) return;
  const q = N().q4, n = Math.max(1, Math.min(T.Q4_FILL_MAX, Math.round(cells)));
  q.fill = { n, done: 0, t: 0, hold: 0 }; q.last = 'fill';
  act(T.Q4_NOISE_FLICK);
}
/** Sort: everything (toys and macros) pays x2 for a while; then it cools down. */
export function q4Sort() {
  const q = N().q4;
  if (!canAct() || q.sortCd > 0) return;
  q.sortT = T.Q4_SORT_SEC; q.sortCd = T.Q4_SORT_CD - (q4Title() >= 4 ? T.Q4_SORT_CD_LEAD : 0); q.flapT = T.Q4_SORT_FLAP_SEC; q.last = 'sort';
  act(T.Q4_NOISE_SORT); sfx.q4Clack();
}
/** The pivot spinner: grab it (it stops), turn it by hand, let go with a spin. Every full turn pays. */
export function q4PivotGrab(on: boolean, spin = 0) {
  if (!pivotUnlocked() || (on && !canAct())) return;
  const p = N().q4.pivot;
  p.grab = on; N().q4.last = 'pivot';
  if (on) p.om = 0; else { p.om = Math.max(-T.Q4_PIVOT_MAX, Math.min(T.Q4_PIVOT_MAX, spin)); if (Math.abs(p.om) > 1) { act(T.Q4_NOISE_SPIN); sfx.q4Whir(); } }
}
export function q4PivotTurn(dAng: number) { const p = N().q4.pivot; if (!p.grab) return; p.ang += dAng; turnPay(Math.abs(dAng)); }
function turnPay(d: number) {
  const p = N().q4.pivot;
  p.acc += d;
  while (p.acc >= Math.PI * 2) { p.acc -= Math.PI * 2; pay(T.Q4_PIVOT_TURN * toyMult(), 'pivot'); sfx.q4Tick(); }
}
/** A macro level, bought in the Macros pane. */
export function q4Buy(id: MacroId): boolean {
  if (!q4Up() || !macroUnlocked(id) || S.g.zl < macroCost(id)) return false;
  S.g.zl -= macroCost(id); S.g.q4.macros[id] = macroLv(id) + 1;
  act(0); sfx.coin();
  return true;
}
export function q4PromoOk() { N().q4.promo = null; sfx.click(); }
/** The switch to Excel just finished: Hustle is what the RPG charged. */
export function q4Enter() { const q = N().q4; q.hustle = q.charge; q.charge = 0; tip('q4'); }

/** Looking busy (step 4.5): while she is in and Excel is up, how fast her visit runs. Busy (a toy in the last 2 s):
 *  x1.5, she leaves sooner. Idle 3 s: it waits ("What are you working on?") until you act. Never a catch by itself. */
export function q4Look(): number {
  const n = N(), idle = n.threat - n.q4.lastAct;
  n.q4.asked = idle >= T.Q4_IDLE_SEC;
  return idle < T.Q4_BUSY_SEC ? T.Q4_BUSY_MULT : n.q4.asked ? 0 : 1;
}

export function updateQ4(dt: number) {
  const n = N(), q = n.q4, up = q4Up();
  if (up) q.hustle = Math.max(0, q.hustle - dt / T.HUSTLE_DECAY_SEC);
  else if (n.monitor === 'rpg' && !n.switching) q.charge = Math.min(1, q.charge + dt / T.HUSTLE_RECHARGE_SEC);
  q.sortT = Math.max(0, q.sortT - dt); q.sortCd = Math.max(0, q.sortCd - dt); q.flapT = Math.max(0, q.flapT - dt);
  q.roll = Math.max(0, q.roll - dt); q.stamp = Math.max(0, q.stamp - dt);
  // the flick's cascade: a cell every 40 ms, a tick each; then it holds a moment and the column resets
  if (q.fill) {
    const f = q.fill;
    if (f.done < f.n) { f.t += dt; while (f.t >= T.Q4_FILL_TICK_SEC && f.done < f.n) { f.t -= T.Q4_FILL_TICK_SEC; f.done++; pay(cellPay() * toyMult(), 'fill', f.done); sfx.q4Tick(); } }
    else if ((f.hold += dt) > 0.6) q.fill = null;
  }
  // the spinner: momentum and friction; every full turn pays
  const p = q.pivot;
  if (!p.grab && Math.abs(p.om) > 0.01) { p.ang += p.om * dt; turnPay(Math.abs(p.om) * dt); p.om *= Math.exp(-T.Q4_PIVOT_FRICTION * dt); if (Math.abs(p.om) < 0.05) p.om = 0; }
  // the macros: all night, in the RPG and the town too (not while paused, not between nights)
  const a = q.auto;
  a.sum += macroLv('intern') * T.Q4_INTERN_SUMS * dt;
  while (a.sum >= 1) { a.sum -= 1; const bal = Math.random() < balancedChance(); pay(T.Q4_SUM * macroMult() * (bal ? T.Q4_BALANCED_MULT : 1), 'msum'); if (up) { q.roll = T.Q4_ROLL_SEC; q.sums++; if (bal) q.stamp = 0.7; } }
  a.fill += macroLv('autofill') * T.Q4_AUTOFILL_CELLS * dt;
  while (a.fill >= 1) { a.fill -= 1; pay(cellPay() * macroMult(), 'mfill'); }
  const turns = macroLv('pivotm') * T.Q4_PIVOTM_TURNS * dt;
  if (turns > 0) { a.turn += turns; if (!p.grab) p.ang += turns * Math.PI * 2; while (a.turn >= 1) { a.turn -= 1; pay(T.Q4_PIVOT_TURN * macroMult(), 'mpivot'); } }
  for (const o of q.pops) o.t += dt;
  q.pops = q.pops.filter(o => o.t < 1);
  if (q.promo) q.promo.t += dt;
}
export { MACROS };
