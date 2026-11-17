// Special affixes (#27): roll rates per rarity, and each effect switches on.
// Run: npx tsx test/affixes.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState, RARITIES } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { genItem } from '../src/systems/loot';
import { heroStats } from '../src/systems/stats';
import { hasLife, overtimeGold, specialText } from '../src/systems/affixes';

S.g = initialState(); startNight();
const N0 = 6000, by: Record<string, { n: number; life: number; cross: number }> = {};
for (let i = 0; i < N0; i++) {
  const it = genItem(8);
  const r = (by[it.rarity] ??= { n: 0, life: 0, cross: 0 });
  r.n++;
  if (it.special) { if (specialText(it)!.life) r.life++; else r.cross++; }
}
for (const k of RARITIES) if (by[k]) console.log(k.padEnd(10), `n ${String(by[k].n).padStart(4)}  life ${(100 * by[k].life / by[k].n).toFixed(0)}%  cross ${(100 * by[k].cross / by[k].n).toFixed(0)}%`);

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const k = S.g.heroes[0], n = N();
const item = (special: string, specialAmt = 5) => ({ id: 'x' + special, name: special, slot: 'ring' as const, rarity: 'epic' as const, ilvl: 8, affixes: [], value: 1, identified: true, special, specialAmt });
k.gear.ring = item('headset', 6);
n.headset = false; const c0 = heroStats(k).crit; n.headset = true; const c1 = heroStats(k).crit;
ok(c1 - c0 === 6, `Headset Hero: crit ${c0} -> ${c1} with the headset on`);
k.gear.ring = item('spreadsheet', 3); n.monitor = 'excel'; ok(overtimeGold() === 3, 'Spreadsheet Warrior pays 3 gold per kill on Excel'); n.monitor = 'rpg'; ok(overtimeGold() === 0, '...and nothing on the game');
k.gear.ring = item('owl'); ok(hasLife('owl'), 'Night Owl counts when worn');
k.gear.ring = { ...item('owl'), identified: false }; ok(!hasLife('owl'), '...but not while unidentified');
console.log(fails ? `${fails} FAILED` : 'PASS');
