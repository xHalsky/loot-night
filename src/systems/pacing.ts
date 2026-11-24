import { N, RARITIES } from '../core/state';

// Live pacing numbers for the debug overlay (#52, 1.1; targets in docs/design/handoff-redesign.md 1.9): how long an
// encounter and a floor take, and how much drops per minute of combat. Reset at the start of each night.
export const PACE = { combat: 0, encounters: 0, encounterSum: 0, lastEncounter: 0, floors: 0, floorSum: 0, lastFloor: 0, items: 0, rarePlus: 0 };
let curBattle = 0, inBattle = false, floorT = 0, lastFloorNo = -1;

export function resetPacing() {
  Object.assign(PACE, { combat: 0, encounters: 0, encounterSum: 0, lastEncounter: 0, floors: 0, floorSum: 0, lastFloor: 0, items: 0, rarePlus: 0 });
  curBattle = 0; inBattle = false; floorT = 0; lastFloorNo = -1;
}
/** A drop hit the floor (systems/loot.ts). */
export function noteDrop(rarity: string | null) {
  PACE.items++;
  if (rarity && RARITIES.indexOf(rarity as (typeof RARITIES)[number]) >= 2) PACE.rarePlus++;
}
export function updatePacing(dt: number) {
  const n = N();
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
/** One line for the F1 overlay. */
export function pacingLine(): string {
  const p = PACE, min = p.combat / 60;
  const avg = (s: number, k: number) => (k ? (s / k).toFixed(1) : '-');
  return `pacing · encounter ${avg(p.encounterSum, p.encounters)} s (last ${p.lastEncounter.toFixed(1)}) · floor ${avg(p.floorSum, p.floors)} s · items/min ${min > 0.05 ? (p.items / min).toFixed(1) : '-'} · rare+/min ${min > 0.05 ? (p.rarePlus / min).toFixed(1) : '-'} · combat ${Math.round(p.combat)} s`;
}
