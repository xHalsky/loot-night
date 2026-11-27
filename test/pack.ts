// The pack in the corridor (#118): enemies stand still and the party walks up to them. The pack is placed off the
// right edge once the walk has gone PACK_PLANT_SEC (further if loot still lies ahead), comes in with the corridor,
// sees the party when its front enemy is in view ("!", a sound), and the fight starts when it is in position.
// Nothing attacks or can be hit meanwhile; the walk lasts about as long as before. npx tsx test/pack.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { travelToDungeon, updateDungeon } from '../src/systems/dungeon';
import { queueAbility } from '../src/systems/battle';
import { ENEMY_SLOTS, POS_X, LOOTER_REACH } from '../src/core/arena';

let fail = 0;
const ok = (c: boolean, what: string) => { console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fail++; };
function fresh() { S.g = initialState(); S.g.realLifeOff = true; startNight(); S.g.howto = false; const n = N(); n.dog.next = 1e9; travelToDungeon(); n.curioPlan = []; return n; }
const DT = 1 / 60;

// a fresh floor: the walk, then the pack is placed off the right edge
let n = fresh();
ok(n.phase === 'walk' && !n.pack, 'the floor starts with a walk, no pack yet');
let t = 0; while (!n.pack && t < 5) { updateDungeon(DT); t += DT; }
ok(!!n.pack && Math.abs(t - T.PACK_PLANT_SEC) < 0.05, `the pack is placed after ${t.toFixed(2)} s of walking`);
const p = n.pack!;
ok(p.front === Math.min(...n.enemies.map(e => ENEMY_SLOTS[e.slot].x)) && p.front + p.at >= T.PACK_ENTER_X, `its front enemy starts off the right edge (x ${p.front + p.at}, the area is 334 wide)`);
ok(n.enemies.length > 0 && n.enemies.every(e => ENEMY_SLOTS[e.slot].x + p.at >= T.PACK_ENTER_X) && p.spot < 0, 'every enemy stands off screen, not seen yet');
ok(n.phase === 'walk', 'the party keeps walking');
// they stand still: the gap closes exactly as fast as the corridor moves
const at0 = p.at, scroll0 = n.walkScroll; updateDungeon(0.1);
ok(Math.abs((at0 - n.pack!.at) - (n.walkScroll - scroll0) * 0.7) < 1e-6, 'the pack stands still: it comes in exactly with the corridor');
// nothing to hit yet
queueAbility(0, 1);
ok(n.enemies.every(e => e.hp === e.maxHp), 'no skill reaches it while it is coming up');
// it sees the party when its front enemy is in view
let spotAt = -1; t = 0;
while (n.phase === 'walk' && t < 10) { updateDungeon(DT); t += DT; if (spotAt < 0 && n.pack && n.pack.spot >= 0) spotAt = n.pack.front + n.pack.at; }
ok(spotAt > 0 && spotAt <= T.PACK_SPOT_X && spotAt > T.PACK_SPOT_X - 3, `"!" when the front enemy is in view (x ${spotAt.toFixed(0)})`);
ok(n.phase === 'battle' && !n.pack, 'in position, the fight starts');
const walkTotal = T.PACK_PLANT_SEC + (T.PACK_ENTER_X - ENEMY_SLOTS[0].x) / (T.PACK_PACE * 0.7);
ok(walkTotal > T.WALK_SEC - 0.5 && walkTotal < T.WALK_SEC + 1, `a walk with no loot lasts ${walkTotal.toFixed(1)} s (WALK_SEC was the old ${T.WALK_SEC} s)`);

// loot lying ahead: the pack waits beyond it, so he picks it all up first
n = fresh();
const item = (id: string) => ({ kind: 'item', item: { id, name: id, slot: 'ring', rarity: 'common', ilvl: 1, affixes: [], value: 1, identified: true } }) as any;
n.floorLoot = [{ entry: item('a'), x: 420, t: 0 }, { entry: item('b'), x: 200, t: 0 }];
t = 0; while (!n.pack && t < 5) { updateDungeon(DT); t += DT; }
ok(!!n.pack && n.pack.front + n.pack.at > 420 - T.PACK_PLANT_SEC * T.WALK_HURRY_PACE * 0.7 - (POS_X[0] + LOOTER_REACH) + n.pack.front - 10, `loot far ahead: the pack is placed beyond it (gap ${n.pack!.at.toFixed(0)} px)`);
while (n.phase === 'walk' && t < 15) { updateDungeon(DT); t += DT; }
ok(n.phase === 'battle' && n.floorLoot.length === 0, 'all the loot is picked up before the fight');

// a curio: the pack waits until the curio would be gone by the time it arrives
n = fresh(); n.curioPlan = [0];
t = 0; while (n.phase !== 'curio' && t < 10) { updateDungeon(DT); t += DT; }
ok(n.phase === 'curio' && !n.pack, 'at a curio: no pack yet');
n.curio = null; n.phase = 'walk'; n.curioAt!.passed = true; n.phaseT = 0;
let seen = false; t = 0;
while (n.phase === 'walk' && t < 15) { updateDungeon(DT); t += DT; if (n.pack && n.curioAt && !seen) { seen = true; ok(n.curioAt.x < T.CURIO_GONE_X + n.pack.at + 1, 'placed while the curio passes behind, but it is off screen by the time the pack arrives'); } }
ok(n.phase === 'battle' && !n.curioAt, 'the curio is gone when the fight starts');

// the floor's last fight: the walk out, no pack
n = fresh(); n.battleIdx = T.BATTLES_PER_FLOOR;
t = 0; while (n.phase === 'walk' && t < 10) { updateDungeon(DT); t += DT; }
ok(!n.pack && n.phase !== 'battle', `after the last fight: the walk out (${n.phase})`);

// leaving for town mid-approach clears it
n = fresh(); t = 0; while (!n.pack && t < 5) { updateDungeon(DT); t += DT; }
const { returnToTown } = await import('../src/systems/dungeon');
returnToTown(); ok(!N().pack && N().enemies.length === 0, 'the portal home clears the pack');

console.log(fail ? `${fail} FAILED` : 'PASS');
process.exit(fail ? 1 : 0);
