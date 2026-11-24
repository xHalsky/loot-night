// Marching order (#52, 1.6) and Garrote (1.7) acceptance test: default orders and Garrote joining on night 2, home
// ranks, the four auras, swaps (1 s without acting), Hook and Shove, EXECUTE by rank, Smoke Bomb, Heist, Backstab, and
// when the line breakers come. npx tsx test/ranks.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { T } from '../src/config/tuning';
import { S, N, initialState, type Hero } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { travelToDungeon } from '../src/systems/dungeon';
import { updateBattle, spawnBattle, queueAbility } from '../src/systems/battle';
import { updateMeters } from '../src/systems/meters';
import { maxHp } from '../src/systems/stats';
import { swapHeroes, hookLine, shoveLine, outOfRank, rankMult, auraTaken, auraCrit, auraCd, auraRegen, ensureParty, heroById } from '../src/systems/ranks';

let fail = 0;
const ok = (c: boolean, what: string) => { console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fail++; };
const order = () => S.g.heroes.map(h => h.id).join(',');
const H = (id: string) => heroById(id as any)!;
function night(n: number) { S.g = initialState(); S.g.nightsPlayed = n - 1; S.g.realLifeOff = true; startNight(); S.g.howto = false; }
function fight(floor = 3) { travelToDungeon(); const n = N(); n.floor = floor; spawnBattle(floor, false, false); n.phase = 'battle'; }
function tick(sec: number, dt = 1 / 30) { for (let t = 0; t < sec; t += dt) { updateMeters(dt); updateBattle(dt); } }

// default orders, Garrote joins on night 2
night(1); ok(order() === 'knight,healer,mage', `night 1: ${order()}`);
night(T.ROGUE_JOINS_NIGHT); ok(order() === 'knight,rogue,mage,healer' && H('rogue').level >= 1, `night ${T.ROGUE_JOINS_NIGHT}: ${order()}, Garrote level ${H('rogue').level}`);
ok(N().log.some(l => l.text.startsWith('Garrote joined')), 'a feed line says Garrote joined');
S.g = initialState(); S.g.heroes = [S.g.heroes[0], S.g.heroes[2], S.g.heroes[1]]; delete S.g.orderSet; ensureParty();   // an old save: knight, mage, healer
ok(order() === 'knight,healer,mage', `an old save gets the default order once: ${order()}`);
swapHeroes(1, 2); ensureParty(); ok(order() === 'knight,mage,healer', `after that the order is the player's: ${order()}`);

// home ranks and the 0.7
night(2);
ok(!S.g.heroes.some(outOfRank), 'the default order is in position');
swapHeroes(0, 2);   // in town: free, no walk
ok(order() === 'mage,rogue,knight,healer' && !S.g.heroes.some(h => h.moving), `a swap in town is free: ${order()}`);
ok(outOfRank(H('mage')) && rankMult(H('mage')) === T.OUT_OF_RANK_MULT && outOfRank(H('knight')), 'mage at rank 1 and knight at rank 3 are out of position (x0.7)');
swapHeroes(0, 2);

// auras
ok(auraTaken(H('rogue')) === 1 - T.AURA_KNIGHT_TAKEN && auraTaken(H('mage')) === 1, "the Knight's wall covers only the hero behind him");
ok(auraCrit(H('knight')) === T.AURA_ROGUE_CRIT && auraCrit(H('mage')) === 0, "Garrote's crit goes to the hero in front of him");
ok(auraCd(H('rogue')) === 1 - T.AURA_MAGE_CD && auraCd(H('knight')) === 1, "Magoo's haste goes to the hero in front of him");
H('mage').hp = 10; H('knight').hp = 10; auraRegen(10, maxHp);
ok(H('mage').hp > 10 && H('knight').hp === 10, "Healero's blessing: the mage in front regenerates, the knight two ranks up does not");
H('rogue').downed = true; ok(auraCrit(H('knight')) === 0, 'a downed hero gives no aura'); H('rogue').downed = false;

// a swap in the dungeon: both walk for SWAP_SEC and don't act
night(2); for (const h of S.g.heroes) h.level = 5; fight();
const k = H('knight'), r = H('rogue');
swapHeroes(0, 1);
ok(k.moving === T.SWAP_SEC && r.moving === T.SWAP_SEC && !H('mage').moving, 'a swap: both heroes walk for SWAP_SEC, the others stay');
const atb0 = k.atb; queueAbility(S.g.heroes.indexOf(k), 1);
ok(N().taunt === 0, 'a hero walking to his rank cannot cast'); tick(0.5); ok(k.atb === atb0, 'nor attack');
tick(0.6); ok(!k.moving && !r.moving, 'after SWAP_SEC they are in place');

// Hook and Shove
night(2); fight();
hookLine(); ok(order() === 'healer,knight,rogue,mage' && S.g.heroes.every(h => h.moving), `Hook: the last to the front, the others back one: ${order()}`);
night(2); fight();
shoveLine(); ok(order() === 'rogue,knight,mage,healer', `Shove: rank 1 and 2 trade places: ${order()}`);

// EXECUTE names a rank: whoever stands there takes it
night(2); for (const h of S.g.heroes) h.level = 8; travelToDungeon(); N().floor = 15; spawnBattle(15, true, false); N().phase = 'battle';
const bk = N().enemies.find(e => e.boss)!;
H('healer').hp = 20;   // the most hurt
bk.acts = T.EVICT_EVERY - 1; bk.atb = 99.9; tick(0.1);
ok(bk.evict === 3 && (bk.wind ?? 0) > 0, `EXECUTE targets rank ${(bk.evict ?? -1) + 1} (Healero's)`);
swapHeroes(3, 2);   // Healero out, Magoo in
const mageHp = H('mage').hp; tick(T.EVICT_WINDUP_SEC + 0.1);
ok(H('mage').hp < mageHp - maxHp(H('mage')) * 0.2, 'swapped in, Magoo takes the EXECUTE');

// Smoke Bomb: about half the hits miss
night(2); for (const h of S.g.heroes) h.level = 5; fight(8);
N().enemies.forEach(e => { e.hp = e.maxHp = 1e9; e.atk = 1; }); N().smoke = 999; N().fx = [];
let misses = 0, hits = 0; const hp0 = new Map(S.g.heroes.map(h => [h, h.hp]));
for (let t = 0; t < 30; t += 1 / 30) { updateBattle(1 / 30); for (const f of N().fx) { if (f.t === 1 && f.text === 'miss') misses++; if (f.t === 1 && /^-\d/.test(f.text) && f.x < 150) hits++; f.t = 0.99; } }
ok(misses > 0 && Math.abs(misses / (misses + hits) - T.SMOKE_MISS) < 0.15, `Smoke Bomb: ${misses} misses, ${hits} hits`);
void hp0;

// Heist: every kill drops
night(2); fight(4); N().heist = 99; N().floorLoot = [];
const kills = N().enemies.length; N().enemies.forEach(e => { e.hp = 0; }); updateBattle(0.01);
ok(N().floorLoot.length >= kills, `Heist: ${kills} kills, ${N().floorLoot.length} drops`);

// Backstab: x2 on a Staggered enemy (and spends the mark)
night(2); for (const h of S.g.heroes) h.level = 5; fight(2);
const e0 = N().enemies[0]; e0.hp = e0.maxHp = 1e9; e0.armor = 0; N().tired = 0;
let plain = 0, stag = 0;
for (let i = 0; i < 40; i++) { const r0 = H('rogue'); r0.cd[1] = 0; const b = e0.hp; queueAbility(S.g.heroes.indexOf(r0), 1); plain += b - e0.hp; }
for (let i = 0; i < 40; i++) { const r0 = H('rogue'); r0.cd[1] = 0; e0.marks = { stagger: 5 }; const b = e0.hp; queueAbility(S.g.heroes.indexOf(r0), 1); stag += b - e0.hp; }
ok(Math.abs(stag / plain - T.MARK_STAGGER_BACKSTAB) < 0.25 && !e0.marks?.stagger, `Backstab on Staggered: x${(stag / plain).toFixed(2)}, the mark is spent`);

// line breakers: none before LINE_BREAK_FROM, none with the boss, about LINE_BREAK_CHANCE after
night(2); travelToDungeon();
let early = 0, late = 0, boss = 0;
for (let i = 0; i < 300; i++) {
  spawnBattle(T.LINE_BREAK_FROM - 1, false, false); early += +[...N().enemies, ...N().reserve].some((e: any) => e.defId === 'ghoul' || e.defId === 'brute');
  spawnBattle(T.LINE_BREAK_FROM + 2, false, false); late += +[...N().enemies, ...N().reserve].some((e: any) => e.defId === 'ghoul' || e.defId === 'brute');
  spawnBattle(10, true, false); boss += +[...N().enemies, ...N().reserve].some((e: any) => e.defId === 'ghoul' || e.defId === 'brute');
}
ok(early === 0 && boss === 0 && Math.abs(late / 300 - T.LINE_BREAK_CHANCE) < 0.08, `line breakers: floor ${T.LINE_BREAK_FROM - 1} ${early}/300, floor ${T.LINE_BREAK_FROM + 2} ${late}/300, boss ${boss}/300`);

console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
