// The Witching Hour (#29, part 3): after 01:00 drops shift up and insomniac affixes roll.
// Run: npx tsx test/witching.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { genItem } from '../src/systems/loot';
import { heroStats } from '../src/systems/stats';
import { INSOMNIAC_AFFIXES } from '../src/data/affixes';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
S.g = initialState(); startNight(); const n = N();
const ins = new Set(INSOMNIAC_AFFIXES.map(a => a.id));
const roll = (k: number) => { let w = 0, ii = 0, nonLeg = 0; for (let i = 0; i < k; i++) { const it = genItem(8); if (it.witched) w++; if (it.special && ins.has(it.special)) ii++; if (it.rarity !== 'legendary' || it.witched) nonLeg++; } return { w, ii, nonLeg }; };
n.clock = T.WITCHING_FROM - 10; let r = roll(4000);
ok(r.w === 0 && r.ii === 0, `before 01:00: no shifts, no insomniac affixes (${r.w}, ${r.ii})`);
n.clock = T.WITCHING_FROM + 10; r = roll(4000);
ok(Math.abs(r.w / r.nonLeg - T.WITCHING_UPGRADE) < 0.03, `after 01:00: ${Math.round(r.w / r.nonLeg * 100)}% of drops shift up a rarity`);
ok(r.ii > 0, `...and insomniac affixes roll (${r.ii} in 4000 drops)`);
const k = S.g.heroes[0];
k.gear.ring = { id: 'x', name: 'x', slot: 'ring', rarity: 'rare', ilvl: 8, affixes: [], value: 1, identified: true, special: 'nightShift', specialAmt: 7 };
n.clock = T.WITCHING_FROM - 10; const a0 = heroStats(k).atk; n.clock = T.WITCHING_FROM + 10; const a1 = heroStats(k).atk;
ok(Math.round(a1 - a0) === 7, `Night Shift: +7 attack only after 01:00 (${a0} -> ${a1})`);
k.gear.ring = { ...k.gear.ring, special: 'redEyes' }; n.tired = 50; const c0 = heroStats(k).crit; n.tired = 75; const c1 = heroStats(k).crit;
ok(Math.round(c1 - c0) === 7, `Red Eyes: +7 crit at Tired 70+ (${c0} -> ${c1})`);
console.log(fails ? `${fails} FAILED` : 'PASS');
