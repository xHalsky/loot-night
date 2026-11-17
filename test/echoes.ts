// Cross-layer echoes and payouts (#29, part 1): each one lands.
// Run: npx tsx test/echoes.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { genItem, updateDrops } from '../src/systems/loot';
import { travelToDungeon, updateDungeon } from '../src/systems/dungeon';
import { spawnBattle, updateBattle, BOSSES } from '../src/systems/battle';
import { updateMeters } from '../src/systems/meters';
import { altTab } from '../src/systems/excel';
import { petStroke, triggerUnplug, plugIn } from '../src/systems/pets';
import { addBuff, battleEnded, partyCrit } from '../src/systems/curios';
import { cuddleDone, startVisit, updateVisits } from '../src/systems/visits';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const fresh = () => { S.g = initialState(); startNight(); const n = N(); n.nextInterruptAt = 1e9; n.dog.next = 1e9; n.noise = 0; return n; };
const legendary = () => { let it = genItem(10, 4); while (it.rarity !== 'legendary') it = genItem(10, 4); return { kind: 'item' as const, id: it.id, item: it }; };

let n = fresh(); n.dropQueue.push(legendary()); updateDrops(0); ok(n.noise === T.ECHO_YELL_NOISE, `legendary: he yells, Noise +${n.noise}`);
n = fresh(); n.headset = true; n.dropQueue.push(legendary()); updateDrops(0); ok(n.noise === T.ECHO_YELL_HEADSET, `...into the headset mic: Noise +${n.noise}`);

// Enrage: a boss under 25% HP
n = fresh(); travelToDungeon(); n.floor = 5; spawnBattle(5, true, false); n.phase = 'battle';
const boss = n.enemies.find(e => e.boss)!; boss.hp = Math.round(boss.maxHp * 0.26); n.enemies.filter(e => !e.boss).forEach(e => { e.hp = 0; e.maxHp = 0; });
for (let i = 0; i < 600 && !boss.enraged; i++) updateBattle(1 / 60);
ok(!!boss.enraged, 'a boss under 25% HP enrages');
n.flow = 1; n.monitor = 'rpg'; n.action = 'none'; updateMeters(1); const f1 = n.flow; n.flow = 1; boss.enraged = false; updateMeters(1); const f0 = n.flow; boss.enraged = true;
ok(Math.abs((f1 - 1) / (f0 - 1) - T.ECHO_ENRAGE_FLOW) < 0.01, `enraged: Flow builds x${((f1 - 1) / (f0 - 1)).toFixed(2)}`);
n.flow = 2.5; altTab(); ok(n.flow === T.FLOW_MIN, 'alt-tab during the enrage: Flow reset');

// Wipe: desk slam, the dog comes
n = fresh(); travelToDungeon(); spawnBattle(1, false, false); n.phase = 'battle'; n.dog.stage = 'away'; n.dog.next = 99;
S.g.heroes.forEach(h => { h.hp = 0; h.downed = true; }); n.noise = 0;
updateDungeon(1 / 60);   // the battle sees no heroes standing: wipe
ok(n.noise >= T.ECHO_SLAM_NOISE && n.dog.next === 0, `wipe: desk slam (Noise ${Math.round(n.noise)}) and the dog comes over`);

// Loved after a good cuddle, used up by one battle
n = fresh(); startVisit(false, 'cuddle'); n.visit.stage = 'in'; cuddleDone(1);
ok(n.partyBuffs.some(b => b.name === 'Loved') && partyCrit() === T.ECHO_LOVED_CRIT, 'a good cuddle: Loved (+crit, +damage)');
battleEnded(); ok(!n.partyBuffs.some(b => b.name === 'Loved'), '...gone after the next fight');

// Drowsy misses
n = fresh(); travelToDungeon(); n.tired = 80; spawnBattle(1, false, false); n.phase = 'battle';
let misses = 0, hits = 0;
for (let k = 0; k < 400; k++) {
  n.enemies.forEach(e => { e.hp = e.maxHp = 1e6; e.atb = 0; });
  const before = n.enemies.map(e => e.hp).reduce((a, b) => a + b, 0);
  S.g.heroes.forEach(h => { h.atb = 99.99; h.hp = 999; h.downed = false; }); n.fx = [];
  updateBattle(1 / 60);
  const zzz = n.fx.filter(f => f.text === 'zzz').length; misses += zzz; hits += 3 - zzz;
  void before;
}
ok(Math.abs(misses / (misses + hits) - T.ECHO_DROWSY_MISS) < 0.03, `Tired 80: ${Math.round(misses / (misses + hits) * 100)}% of hero hits miss`);

// Guilt on the first catch
n = fresh(); n.monitor = 'rpg'; n.mood = T.MOOD_GREEN + 5; startVisit(false, 'peek'); n.visit.stage = 'handle'; n.visit.t = 0.01;   // not green: no lean-only visit
for (let i = 0; i < 10; i++) updateVisits(1 / 60);
ok(n.catches === 1 && n.guilt > 0, 'the first catch already brings Guilt');

// Good Boy
n = fresh(); n.dog.stage = 'up'; n.dog.pet = 0; n.dog.sweetPet = 0; for (let i = 0; i < 400 && n.dog.stage === 'up'; i++) petStroke(10, 100, true);
ok(n.goodDog === T.GOOD_BOY_SEC, 'petted on his favourite spot: Good Boy');
n = fresh(); n.dog.stage = 'up'; n.dog.pet = 0; n.dog.sweetPet = 0; for (let i = 0; i < 400 && n.dog.stage === 'up'; i++) petStroke(10, 100, false);
ok(n.goodDog === 0, 'petted anywhere else: just a good boy');

// Fast cable fix
const fix = (n: ReturnType<typeof fresh>) => { const u = n.unplugged!; u.sockets.forEach((plug, slot) => plugIn(plug, slot)); };
n = fresh(); n.flow = 2.6; triggerUnplug(); n.flow = 1; n.threat += 4; fix(n); ok(n.flow === 2.6, 'cables back in 4 s: Flow restored');
n = fresh(); n.flow = 2.6; triggerUnplug(); n.flow = 1; n.threat += 9; fix(n); ok(n.flow === 1, 'cables back in 9 s: Flow stays lost');
void BOSSES; void addBuff;
console.log(fails ? `${fails} FAILED` : 'PASS');
