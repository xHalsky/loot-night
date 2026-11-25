// Loot rules (#52, 1.8): at most 3 affix lines by rarity, every legendary a named one for a hero in the party, set
// pieces among the epics, and each legendary rule and set bonus at work. npx tsx test/loot.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { T } from '../src/config/tuning';
import { S, N, initialState, type Item, type HeroId } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { travelToDungeon } from '../src/systems/dungeon';
import { genItem } from '../src/systems/loot';
import { spawnBattle, queueAbility, updateBattle } from '../src/systems/battle';
import { heroStats, maxHp } from '../src/systems/stats';
import { ensureParty, heroById } from '../src/systems/ranks';
import { LEGENDS, SETS, type LegendId, type SetId } from '../src/data/legendaries';

let fail = 0;
const ok = (c: boolean, what: string) => { console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fail++; };
function party(n: number) { S.g = initialState(); S.g.day = n - 1; S.g.realLifeOff = true; startNight(); S.g.howto = false; ensureParty(); for (const h of S.g.heroes) h.level = 6;
  S.g.trees = Object.fromEntries(S.g.heroes.map(h => [h.id, ['g1', 'g2', 's2', 'm1', 'm2', 'm3', 'ult']])); }   // skills come from the tree (#53)
const H = (id: HeroId) => heroById(id)!;

// affix lines
party(2);
const lines: Record<string, Set<number>> = {}; let legends = 0, legendOk = 0, epics = 0, sets = 0, setOk = 0;
for (let i = 0; i < 6000; i++) {
  const it = genItem(8, i % 3 === 0 ? 3 : 0);
  (lines[it.rarity] ??= new Set()).add(it.affixes.length - 1 + (it.special ? 1 : 0));
  if (it.rarity === 'legendary') { legends++; if (it.legend && LEGENDS.find(l => l.id === it.legend)!.slot === it.slot) legendOk++; }
  if (it.rarity === 'epic') { epics++; if (it.set) { sets++; if (['weapon', 'armor', 'trinket'].includes(it.slot)) setOk++; } }
}
for (const r of Object.keys(lines)) ok([...lines[r]].every(k => k === T.AFFIX_LINES[r]), `${r}: ${[...lines[r]].join('/')} affix lines (wants ${T.AFFIX_LINES[r]})`);
ok(legends > 0 && legendOk === legends, `every legendary is a named one in its slot (${legendOk}/${legends})`);
ok(Math.abs(sets / epics - T.SET_CHANCE) < 0.05 && setOk === sets, `set pieces: ${(100 * sets / epics).toFixed(0)}% of epics, all weapon, armor or trinket`);
party(1);
let rogueStuff = 0;
for (let i = 0; i < 3000; i++) { const it = genItem(8, 3); if ((it.legend && LEGENDS.find(l => l.id === it.legend)!.hero === 'rogue') || (it.set && SETS.find(s => s.id === it.set)!.hero === 'rogue')) rogueStuff++; }
ok(rogueStuff === 0, 'without Garrote, none of his legendaries or his set drop');

// equip helpers
const gear = (h: HeroId, slot: 'weapon' | 'armor' | 'trinket', mod: Partial<Item>) => { H(h).gear[slot] = { id: `${h}${slot}${Math.random()}`, name: 'x', slot, rarity: 'epic', ilvl: 1, affixes: [], value: 1, identified: true, ...mod }; };
const legend = (id: LegendId) => { const L = LEGENDS.find(l => l.id === id)!; gear(L.hero, L.slot as 'weapon', { legend: id, rarity: 'legendary' }); };
const set = (id: SetId, k: number) => { const St = SETS.find(s => s.id === id)!; (['weapon', 'armor', 'trinket'] as const).slice(0, k).forEach(sl => gear(St.hero, sl, { set: id })); };
function fight(floor = 3) { travelToDungeon(); const n = N(); n.floor = floor; spawnBattle(floor, false, false); n.phase = 'battle'; n.enemies.forEach(e => { e.hp = e.maxHp = 1e9; e.atk = 0; e.armor = 0; }); n.tired = 0; return n; }
const cast = (id: HeroId, slot: number) => { const h = H(id); h.cd[slot] = 0; queueAbility(S.g.heroes.indexOf(h), slot); };

// legendaries
party(2); let n = fight(); legend('frostbinder'); cast('mage', 2);
ok(n.enemies.filter(e => e.marks?.chill! > 0).length === 2, 'Frostbinder: Frost chills two enemies');
party(2); n = fight(); legend('lantern'); H('knight').cd[1] = 9; n.enemies.forEach(e => { e.marks = { stagger: 5 }; }); cast('knight', 2);
ok(H('knight').cd[1] === 0, 'Last Lantern: Bash on a Staggered enemy resets Taunt');
party(2); n = fight(); legend('widow'); let crits = 0;
for (let i = 0; i < 20; i++) { n.enemies[0].marks = { chill: 5 }; n.fx = []; cast('rogue', 1); if (n.fx.some(f => f.text.endsWith('!') && f.text.startsWith('-'))) crits++; }
ok(crits === 20, `Widow's Kiss: Backstab on Chilled always crits (${crits}/20)`);
party(2); n = fight(); legend('vigil'); H('healer').ult = 1; n.ward = 0; cast('healer', 3);
ok(n.ward >= T.LEGEND_VIGIL_WARD_SEC - 0.01, 'Vigil Censer: Miracle raises Ward');
party(2); n = fight(); legend('ashchoir'); n.partyBuffs = [{ name: 'Curse', dmg: -0.15, floor: true } as any]; n.crash = 5; cast('healer', 1);
ok(!n.partyBuffs.length && n.crash === 0, 'Ash Choir: Mend clears the curse and the crash');
party(2); n = fight(); legend('tithe'); const g0 = S.g.gold + (n.run?.gold ?? 0); cast('knight', 1);
n.enemies.forEach(e => { e.atk = 5; e.atb = 99.9; }); updateBattle(0.05);
ok(S.g.gold + (n.run?.gold ?? 0) > g0, 'The Tithe: Taunted hits on the Knight drop gold');
party(2); n = fight(); legend('stormcoil'); { const m = H('mage'); n.enemies.forEach(e => { e.hp = e.maxHp = 1; }); const alive0 = n.enemies.filter(e => e.hp > 0).length; m.atb = 99.99; updateBattle(0.01); ok(alive0 - n.enemies.filter(e => e.hp > 0).length >= 2, 'Stormcoil: a killing Bolt jumps to another enemy'); }

// sets
party(2); const a0 = heroStats(H('knight')).armor; set('ironwake', 2);
ok(heroStats(H('knight')).armor > a0 * (1 + T.SET_IRONWAKE_ARMOR) - 0.5, `Ironwake 2: armor ${a0} -> ${heroStats(H('knight')).armor.toFixed(1)}`);
party(2); const c0 = heroStats(H('rogue')).crit; set('nightglass', 2); ok(heroStats(H('rogue')).crit === c0 + T.SET_NIGHTGLASS_CRIT, 'Nightglass 2: +10 crit');
party(2); const cK = heroStats(H('knight')).crit; set('nightglass', 2); H('knight').gear = { ...H('rogue').gear }; H('rogue').gear = {};
ok(heroStats(H('knight')).crit === cK, 'a set on another hero gives no set bonus');
party(2); n = fight(); set('ironwake', 3); H('knight').hp = 20; cast('knight', 1); ok(H('knight').hp >= 20 + maxHp(H('knight')) * T.SET_IRONWAKE_HEAL - 1, 'Ironwake 3: Taunt heals the Knight');
party(2); n = fight(); set('embervow', 3); n.enemies.forEach(e => { e.hp = e.maxHp = 1; }); cast('mage', 1); ok(H('mage').cd[1] === 0, 'Embervow 3: Fire resets when it kills 3 or more');
party(2); n = fight(); set('dawnward', 3); n.ward = 5; for (const h of S.g.heroes) h.hp = 10; updateBattle(1); ok(S.g.heroes.every(h => h.hp > 10), 'Dawnward 3: Ward heals over time');
party(2); n = fight(); set('nightglass', 3); cast('rogue', 2); ok(S.g.heroes.every(h => h.nextCrit), "Nightglass 3: Smoke Bomb makes everyone's next hit a crit");

console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
