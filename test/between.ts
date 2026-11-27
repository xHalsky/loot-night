// Party skills between fights (#122): Arkbishop's Mend, Ward and Miracle, Dutch's Last Stand and Hixx's Heist go off on
// the walk (the next pack coming up included) and at a curio; the rest need an enemy ("No enemies in reach"); town and
// the floor map refuse them all. Cooldowns run between fights too; a Ward cast as the pack comes up carries into the
// fight. npx tsx test/between.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState, type HeroId } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { travelToDungeon, updateDungeon, returnToTown } from '../src/systems/dungeon';
import { queueAbility, castableNow, partySkill } from '../src/systems/battle';
import { maxHp } from '../src/systems/stats';
import { heroById } from '../src/systems/positions';
import { step } from '../src/core/loop';

let fail = 0;
const ok = (c: boolean, what: string) => { console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fail++; };
const FULL = ['g1', 'g2', 's2', 'm1', 'm2', 'm3', 'ult'];
function fresh() {
  S.g = initialState(); S.g.realLifeOff = true; S.g.trees = { knight: FULL, rogue: FULL, mage: FULL, healer: FULL } as never;
  startNight(); S.g.howto = false; const n = N(); n.dog.next = 1e9; travelToDungeon(); n.curioPlan = [];
  return n;
}
const H = (id: HeroId) => heroById(id)!;
const idx = (id: HeroId) => S.g.heroes.indexOf(H(id));
const cast = (id: HeroId, slot: number) => { N().toasts = []; queueAbility(idx(id), slot); return N().toasts.map(t => t.text).join(' | '); };   // the feed is capped: start it empty

// on the walk: Mend heals everyone and goes on cooldown, which the walk runs down
let n = fresh();
ok(n.phase === 'walk', 'a fresh floor starts on the walk');
S.g.heroes.forEach(h => { h.hp = Math.round(maxHp(h) * 0.4); });
const before = S.g.heroes.map(h => h.hp);
cast('healer', 1);
ok(S.g.heroes.every((h, i) => h.hp > before[i]), `Mend heals the party between fights (${before.join('/')} -> ${S.g.heroes.map(h => Math.round(h.hp)).join('/')})`);
const cd0 = H('healer').cd[1];
ok(cd0 > 0, `and goes on cooldown (${cd0.toFixed(1)} s)`);
for (let k = 0; k < 30 && n.phase === 'walk'; k++) updateDungeon(1 / 30);
ok(Math.abs(H('healer').cd[1] - (cd0 - 1)) < 0.01, `the walk runs cooldowns down too (${cd0.toFixed(1)} -> ${H('healer').cd[1].toFixed(1)} s after 1 s)`);
// Ward, Miracle, Last Stand, Heist
cast('healer', 2); ok(n.ward > 0, `Ward between fights (${n.ward.toFixed(1)} s)`);
H('mage').downed = true; H('mage').hp = 0; H('healer').ult = 1;
cast('healer', 3); ok(!H('mage').downed && S.g.heroes.every(h => h.hp === maxHp(h)), 'Miracle between fights: the fallen get up, everyone full');
H('knight').ult = 1; cast('knight', 3); ok(n.lastStand > 0, 'Last Stand between fights');
H('rogue').ult = 1; cast('rogue', 3); ok(n.heist > 0, 'Heist between fights');
// the rest need an enemy
H('mage').ult = 1;
const refused: [HeroId, number, string][] = [['knight', 1, 'Taunt'], ['knight', 2, 'Bash'], ['rogue', 1, 'Backstab'], ['rogue', 2, 'Smoke Bomb'], ['mage', 1, 'Fire'], ['mage', 2, 'Frost'], ['mage', 3, 'Cataclysm']];
const res = refused.map(([id, s, name]) => { const cdB = H(id).cd[s], ultB = H(id).ult, msg = cast(id, s); return { name, ok: /No enemies in reach/.test(msg) && H(id).cd[s] === cdB && H(id).ult === ultB, msg }; });
ok(res.every(r => r.ok), `the rest need an enemy: ${res.map(r => r.name + (r.ok ? '' : ' (cast!)')).join(', ')} say "No enemies in reach"`);
ok(['knight', 'rogue', 'mage', 'healer'].flatMap(id => [1, 2, 3].filter(s => partySkill(id as HeroId, s)).map(s => `${id}${s}`)).join(' ') === 'knight3 rogue3 healer1 healer2 healer3', 'the party skills: Last Stand, Heist, Mend, Ward, Miracle');

// the next pack coming up: still between fights; a Ward cast now carries into the fight
n = fresh();
let t = 0; while (!n.pack && t < 5) { updateDungeon(1 / 30); t += 1 / 30; }
ok(!!n.pack && castableNow('healer', 2) && !castableNow('mage', 1), 'while the pack comes up: Ward yes, Fire no');
n.visit.nextAt = 1e9; n.phoneScript = [];
while (n.pack && n.pack.at > (T.PACK_PACE * 0.7) * 2) step(1 / 30);   // about 2 s out, the whole game ticking (Ward's time too)
cast('healer', 2);
while (n.phase === 'walk') step(1 / 30);
ok(n.phase === 'battle' && n.ward > 2 && n.ward < 5, `a Ward cast as the pack comes up is still on when the fight starts (${n.ward.toFixed(1)} s left)`);
ok(castableNow('mage', 1), 'in the fight everything goes');

// at a curio
n = fresh(); n.curioPlan = [0];
t = 0; while (n.phase !== 'curio' && t < 10) { updateDungeon(1 / 30); t += 1 / 30; }
H('knight').hp = 5; cast('healer', 1);
ok(n.phase === 'curio' && H('knight').hp > 5, 'at a curio: Mend works');

// town and the floor map: nothing
n = fresh(); returnToTown(); H('knight').hp = 5;
cast('healer', 1); ok(H('knight').hp === 5, 'in town: no skills');
n = fresh(); n.phase = 'mapChoice'; H('knight').hp = 5;
cast('healer', 1); ok(H('knight').hp === 5, 'on the floor map: no skills');

console.log(fail ? `${fail} FAILED` : 'all passed');
process.exit(fail ? 1 : 0);
