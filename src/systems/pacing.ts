import { S, N, RARITIES } from '../core/state';
import { nodeCost } from './tree';

// Live pacing numbers for the debug overlay (#52, 1.1; targets in docs/design/handoff-redesign.md 1.9): how long an
// encounter and a floor take, and how much drops per minute of combat. Reset at the start of each night.
export const PACE = { combat: 0, encounters: 0, encounterSum: 0, lastEncounter: 0, floors: 0, floorSum: 0, lastFloor: 0, items: 0, rarePlus: 0, rareWhy: {} as Record<string, number> };
let curBattle = 0, inBattle = false, floorT = 0, lastFloorNo = -1;

export function resetPacing() {
  Object.assign(PACE, { combat: 0, encounters: 0, encounterSum: 0, lastEncounter: 0, floors: 0, floorSum: 0, lastFloor: 0, items: 0, rarePlus: 0, rareWhy: {} });
  curBattle = 0; inBattle = false; floorT = 0; lastFloorNo = -1;
}
/** A drop hit the floor (systems/loot.ts). */
export function noteDrop(rarity: string | null, why = 'roll') {
  PACE.items++;
  if (rarity && RARITIES.indexOf(rarity as (typeof RARITIES)[number]) >= 2) { PACE.rarePlus++; PACE.rareWhy[why] = (PACE.rareWhy[why] ?? 0) + 1; }
}
/** Why the last generated item came out rare or better (for the pacing numbers): roll, sure, pity, first, cursed, witching. */
export let rareWhy = 'roll';
export function setRareWhy(w: string) { rareWhy = w; }
let runT = 0, runRef: unknown = null;   // how long the current run has gone (town portal to now)
export function updatePacing(dt: number) {
  const n = N();
  if (n.run !== runRef) { runRef = n.run; runT = 0; }
  if (n.run) runT += dt;
  if (n.location !== 'dungeon') { inBattle = false; lastFloorNo = -1; return; }
  const battling = n.phase === 'battle';
  if (battling) { curBattle += dt; PACE.combat += dt; }
  if (inBattle && !battling) { PACE.encounters++; PACE.encounterSum += curBattle; PACE.lastEncounter = curBattle; curBattle = 0; }
  inBattle = battling;
  if (n.floor !== lastFloorNo) {
    if (lastFloorNo >= 0) { PACE.floors++; PACE.floorSum += floorT; PACE.lastFloor = floorT; }
    lastFloorNo = n.floor; floorT = 0;
  }
  if (n.phase !== 'mapChoice') floorT += dt;
}
/** One line for the F1 overlay (#52 1.1): encounter, floor and run length, drops per minute of combat, Souls this
 * run, and what each hero's next tree node costs (a stat node; unlocks and rules cost 2x, autocasts 3x). Q4's
 * income joins it in step 4. */
export function pacingLine(): string {
  const p = PACE, min = p.combat / 60, n = S.g.night;
  const avg = (s: number, k: number) => (k ? (s / k).toFixed(1) : '-');
  const run = n?.run ? ` · run ${Math.floor(runT / 60)}:${String(Math.floor(runT % 60)).padStart(2, '0')}, ${n.run.souls} Souls` : '';
  const nodes = S.g.heroes.map(h => `${h.name[0]} ${nodeCost(h.id, 'g1')}`).join(' ');
  return `pacing · encounter ${avg(p.encounterSum, p.encounters)} s (last ${p.lastEncounter.toFixed(1)}) · floor ${avg(p.floorSum, p.floors)} s${run} · items/min ${min > 0.05 ? (p.items / min).toFixed(1) : '-'} · rare+/min ${min > 0.05 ? (p.rarePlus / min).toFixed(1) : '-'} · combat ${Math.round(p.combat)} s · stat node ${nodes}`;
}
