import { T } from '../config/tuning';
import { S, N, type RunState } from '../core/state';
import type { BlessingId } from '../data/blessings';
import { toastAs } from '../core/fx';
const toast = toastAs('GAME');

// Runs (#52, 1.4; docs/design/dungeon.md): a run goes from the town portal until the town portal (banked) or a wipe
// (lost). Items and gold picked up on the way are "unbanked" (the bag's dashed mark) until then. Souls are kept either way.

/** Gold the RPG pays: unbanked while a run is on, straight to your purse otherwise. */
export function gainGold(amount: number) {
  const n = S.g.night;
  if (n?.run && n.location === 'dungeon') n.run.gold += amount; else S.g.gold += amount;
}
/** Souls the run earns go straight to the pool (one pool for the trees and the buildings); the run counts them. */
export function gainSouls(amount: number) {
  amount = Math.round(amount * blessPow('ritual', T.BLESS_RITUAL_SOULS));   // the chant
  S.g.mats += amount;
  const n = S.g.night;
  if (n?.run) n.run.souls += amount;
}
/** How many of this run blessing the run carries (they stack). */
export function blessCount(id: BlessingId): number { const r = S.g.night?.run; return r ? r.blessings.filter(b => b === id).length : 0; }
/** (1 + k)^count for a stacking run blessing: the multiplier its rule applies. */
export function blessPow(id: BlessingId, k: number): number { return (1 + k) ** blessCount(id); }
export function addBlessing(id: BlessingId) { const r = S.g.night?.run; if (r) r.blessings.push(id); }

export function startRun(floor: number) {
  const n = N();
  n.run = { startFloor: floor, deepest: floor, gold: 0, items: 0, souls: 0, blessings: [], oath: false };
}
/** What the run would bank or lose now: items and maps in the bag and on the heroes picked up this run. */
export function unbanked(): { items: number; gold: number } {
  const n = S.g.night;
  if (!n?.run) return { items: 0, gold: 0 };
  const inBag = S.g.bag.filter(e => e.run).length;
  const worn = S.g.heroes.reduce((a, h) => a + Object.values(h.gear).filter(it => it?.run).length, 0);
  return { items: inBag + worn, gold: n.run.gold };
}
/** The town portal: everything picked up this run is yours. */
export function bankRun() {
  const n = N();
  if (!n.run) return;
  const u = unbanked();
  S.g.gold += n.run.gold;
  for (const e of S.g.bag) { delete e.run; if (e.kind === 'item') delete e.item.run; }
  for (const h of S.g.heroes) for (const it of Object.values(h.gear)) if (it) delete it.run;
  endRun(n.run, true, u.items);
}
/** A wipe: the unbanked items and gold are lost (locked ones too); the Souls stay. */
export function loseRun() {
  const n = N();
  if (!n.run) return;
  const u = unbanked();
  S.g.bag = S.g.bag.filter(e => !e.run);
  for (const h of S.g.heroes) for (const [k, it] of Object.entries(h.gear)) if (it?.run) delete h.gear[k as keyof typeof h.gear];
  if (n.selected && !S.g.bag.some(e => e.id === n.selected)) n.selected = null;
  endRun(n.run, false, u.items);
}
function endRun(r: RunState, banked: boolean, items: number) {
  const n = N();
  n.runCard = { ...r, items, banked, t: T.RUN_CARD_SEC };
  toast(banked
    ? `Run banked: floor ${r.deepest}, ${items} items, ${r.gold} gold, ${r.souls} Souls.`
    : `PARTY WIPE. Lost ${items} items and ${r.gold} gold. Kept ${r.souls} Souls.`, banked ? '#f2b84b' : '#ff8a80');
  n.run = null;
}
