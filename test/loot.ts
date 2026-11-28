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
import { ensureParty, heroById } from '../src/systems/positions';
import { LEGENDS, SETS, type LegendId, type SetId } from '../src/data/legendaries';
import { CLASS_NOUNS, NOUNS, isClassSlot, SOFT_NOUNS, METAL_ADJECTIVES } from '../src/data/items';
import { canWear } from '../src/systems/gear';
import { equipItemOn, unequip, trashItem } from '../src/systems/bag';
import { classGear } from '../src/systems/save';
import { itemEntry, nameIsCurrent, mapEntry, featherEntry } from '../src/systems/loot';

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
party(1); S.g.heroes = S.g.heroes.filter(h => h.id !== 'rogue');   // a party without him (he is in from night 1 now, #96)
let rogueStuff = 0;
for (let i = 0; i < 3000; i++) { const it = genItem(8, 3); if ((it.legend && LEGENDS.find(l => l.id === it.legend)!.hero === 'rogue') || (it.set && SETS.find(s => s.id === it.set)!.hero === 'rogue')) rogueStuff++; }
ok(rogueStuff === 0, 'without Hixx, none of his legendaries or his set drop');

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

// class gear (#113): weapons, helms and armor belong to one class; boots, rings and trinkets to anyone
party(2);
{
  const ids = S.g.heroes.map(h => h.id), seen: Record<string, number> = {}; let classed = 0, shared = 0, nameOk = 0, soft = 0, all = 0, ownOk = 0, owned = 0;
  for (let i = 0; i < 6000; i++) {
    const it = genItem(8, i % 4 === 0 ? 3 : 0); all++;
    if (isClassSlot(it.slot)) {
      if (it.cls && ids.includes(it.cls)) classed++;
      seen[it.cls!] = (seen[it.cls!] ?? 0) + 1;
      const noun = it.legend || it.set ? '' : it.name.split(' ')[1];
      if (!noun || CLASS_NOUNS[it.cls!][it.slot].includes(noun)) nameOk++;
      if (noun && SOFT_NOUNS.has(noun) && METAL_ADJECTIVES.has(it.name.split(' ')[0])) soft++;
      if (it.legend || it.set) { owned++; if (it.cls === (it.legend ? LEGENDS.find(l => l.id === it.legend)!.hero : SETS.find(x => x.id === it.set)!.hero)) ownOk++; }
    } else { if (!it.cls) shared++; if (it.legend || it.set || NOUNS[it.slot as 'ring'].includes(it.name.split(' ')[1])) nameOk++; }
  }
  const nClass = Object.values(seen).reduce((a, b) => a + b, 0);
  ok(classed === nClass && shared === all - nClass, `weapons, helms, armor have a party class (${classed}/${nClass}); boots, rings, trinkets none (${shared})`);
  ok(ids.every(id => Math.abs(seen[id] / nClass - 1 / ids.length) < 0.04), `class gear spreads over the party: ${ids.map(id => `${id} ${Math.round(100 * seen[id] / nClass)}%`).join(', ')}`);
  ok(nameOk === all, `every item is named from its class's words or the shared ones (${nameOk}/${all})`);
  ok(soft === 0, 'no Iron, Bronze or Steel on cloth or leather');
  ok(owned > 0 && ownOk === owned, `a legendary or set weapon or armor is its own hero's class (${ownOk}/${owned})`);
}
// equip: right class goes on, wrong class stays in the bag and shakes, shared gear goes on anyone
party(2);
{
  const item = (slot: Item['slot'], cls?: HeroId): Item => ({ id: `t${Math.random()}`, name: 'x', slot, rarity: 'rare', ilvl: 3, affixes: [{ stat: 'atk', amount: 5 }], value: 1, identified: true, ...(cls ? { cls } : {}) });
  const staff = item('weapon', 'mage'), ring = item('ring');
  S.g.bag = [itemEntry(staff), itemEntry(ring)];
  const ki = S.g.heroes.findIndex(h => h.id === 'knight'), mi = S.g.heroes.findIndex(h => h.id === 'mage');
  ok(!canWear(H('knight'), staff) && canWear(H('mage'), staff) && canWear(H('knight'), ring), 'canWear: a mage staff is the mage\'s, a ring anyone\'s');
  const went = equipItemOn(staff.id, ki, 'weapon');
  ok(!went && S.g.bag.some(e => e.id === staff.id) && H('knight').gear.weapon?.id !== staff.id, 'a mage staff on the knight: refused, still in the bag');
  ok(N().reject?.id === staff.id && N().reject!.t === T.WRONG_CLASS_SHAKE_SEC, 'and it shakes in its square');
  ok(equipItemOn(staff.id, mi) && H('mage').gear.weapon?.id === staff.id, 'on the mage it goes on');
  ok(equipItemOn(ring.id, ki) && H('knight').gear.ring?.id === ring.id, 'a ring goes on the knight');
  ok(unequip(ki, 'ring') && S.g.bag.some(e => e.id === ring.id), 'and comes back off');
}
// an old save: worn gear becomes its wearer's class (renamed to his words), a bag item goes by its word
party(2);
{
  const old = (name: string, slot: Item['slot'], mod: Partial<Item> = {}): Item => ({ id: `o${Math.random()}`, name, slot, rarity: 'uncommon', ilvl: 2, affixes: [], value: 1, identified: true, ...mod });
  H('knight').gear.armor = old('Iron Robe', 'armor'); H('rogue').gear.weapon = old('Fine Spear', 'weapon');
  const fb = old('Frostbinder', 'weapon', { legend: 'frostbinder', rarity: 'legendary' }); H('healer').gear.weapon = fb;
  const robe = old('Fine Robe', 'armor'), axe = old('Iron Axe', 'weapon'), ring = old('Iron Ring', 'ring');
  S.g.bag = [itemEntry(robe), itemEntry(axe), itemEntry(ring)];
  classGear(); [H('knight').gear.armor!, H('rogue').gear.weapon!].forEach(it => { if (!nameIsCurrent(it)) it.name = 'renamed'; });
  ok(H('knight').gear.armor!.cls === 'knight' && H('rogue').gear.weapon!.cls === 'rogue', 'worn: the knight\'s old robe is his, the rogue\'s old spear is his');
  ok(H('knight').gear.armor!.name === 'renamed', 'and a worn word that is not his class\'s gets renamed');
  ok(fb.cls === 'mage' && !H('healer').gear.weapon && S.g.bag.some(e => e.id === fb.id), 'Frostbinder on the priest goes back to the bag as the mage\'s');
  ok(robe.cls === 'mage' && axe.cls === 'knight' && !ring.cls, 'in the bag: a Robe is the mage\'s, an Axe the knight\'s, a ring nobody\'s');
}

// the trash can (#148): a bag item, a map, a worn piece go for good and give nothing; a locked one stays
party(2);
{
  const gold = S.g.gold, mats = S.g.mats, a = itemEntry(genItem(3)), m = mapEntry('vault'), f = featherEntry();
  S.g.bag = [a, m, f]; N().fresh = [{ id: a.id, t: 1 }];
  ok(trashItem({ bag: a.id }) && !S.g.bag.some(e => e.id === a.id) && !N().fresh.length, 'trash: a bag item goes, and its blink with it');
  ok(trashItem({ bag: m.id }) && trashItem({ bag: f.id }) && S.g.bag.length === 0, 'trash: a map and a feather go too');
  ok(S.g.gold === gold && S.g.mats === mats, 'trash: nothing back (no gold, no Souls)');
  const l = itemEntry(genItem(3)); (l as { item: Item }).item.locked = true; S.g.bag = [l];
  ok(!trashItem({ bag: l.id }) && S.g.bag.length === 1, 'trash: a locked item stays in the bag');
  const h = S.g.heroes[0], it = genItem(3); it.slot = 'boots'; it.cls = undefined; h.gear.boots = it; h.hp = maxHp(h);
  const n0 = S.g.bag.length;
  ok(trashItem({ hero: 0, slot: 'boots' }) && !h.gear.boots && S.g.bag.length === n0 && h.hp <= maxHp(h) && h.hp >= 1, 'trash: a worn piece goes off the hero, not into the bag; his HP stays in range');
  const it2 = genItem(3); it2.slot = 'ring'; it2.cls = undefined; it2.locked = true; h.gear.ring = it2;
  ok(!trashItem({ hero: 0, slot: 'ring' }) && h.gear.ring === it2, 'trash: a locked worn piece stays on');
  delete h.gear.helm;
  ok(!trashItem({ bag: 'nope' }) && !trashItem({ hero: 0, slot: 'helm' }), 'trash: nothing there, nothing happens');
}

console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
