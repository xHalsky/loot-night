// Skill trees (#53): costs and their +15% step, pairs, the ultimate's 6 nodes, respec, skills only from the tree,
// autocast (fires while you're away, stops while changing places), and a sample of rules and stat nodes at work.
// npx tsx test/tree.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { T } from '../src/config/tuning';
import { S, N, initialState, type HeroId } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { travelToDungeon } from '../src/systems/dungeon';
import { spawnBattle, queueAbility, updateBattle, abilityUnlocked, wardTaken } from '../src/systems/battle';
import { heroStats, maxHp } from '../src/systems/stats';
import { ensureParty, heroById, swapHeroes, auraTaken } from '../src/systems/ranks';
import { buyNode, nodeState, nodeCost, respec, owns, autocastOn, toggleAutocast } from '../src/systems/tree';
import type { NodeId } from '../src/data/trees';

let fail = 0;
const ok = (c: boolean, what: string) => { console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fail++; };
const H = (id: HeroId) => heroById(id)!;
function party(souls = 5000) { S.g = initialState(); S.g.day = 1; S.g.realLifeOff = true; startNight(); S.g.howto = false; ensureParty(); S.g.mats = souls; for (const h of S.g.heroes) h.level = 6; }
const buy = (h: HeroId, ...ids: NodeId[]) => ids.forEach(id => buyNode(h, id));
function fight(floor = 3) { travelToDungeon(); const n = N(); n.floor = floor; spawnBattle(floor, false, false); n.phase = 'battle'; n.enemies.forEach(e => { e.hp = e.maxHp = 1e9; e.atk = 0; e.armor = 0; }); n.tired = 0; return n; }

// buying
party(200);
ok(!abilityUnlocked(H('knight'), 2) && !abilityUnlocked(H('knight'), 3) && abilityUnlocked(H('knight'), 1), 'a new hero has skill 1 only');
ok(nodeState('knight', 's2') === 'locked' && nodeState('knight', 'g1') === 'buy', 'skill 2 waits behind its two stats');
const c0 = nodeCost('knight', 'g1'); buy('knight', 'g1'); const c1 = nodeCost('knight', 'g2');
ok(c0 === T.TREE_COST.stat && c1 === Math.round(T.TREE_COST.stat * (1 + T.TREE_COST_STEP)) && S.g.mats === 200 - c0, `costs: ${c0}, then ${c1} (+15% a node)`);
buy('knight', 'g2', 's2'); ok(abilityUnlocked(H('knight'), 2), 'buying Bash unlocks skill 2');
party();
buy('knight', 'g1', 'g2', 's2', 'p2', 'r2a'); ok(nodeState('knight', 'r2b') === 'shut', 'a rule pair: Cleaving Bash shuts Concussion');
ok(nodeState('knight', 'ult') === 'locked', 'the ultimate needs 6 nodes (5 bought)'); buy('knight', 'm1'); ok(nodeState('knight', 'ult') === 'buy', '...and opens at 6');
buy('knight', 'ult'); ok(abilityUnlocked(H('knight'), 3), 'Last Stand bought');
const before = S.g.mats; respec('knight'); ok(!owns('knight', 's2') && S.g.mats > before && nodeState('knight', 'r2b') !== 'shut', `respec refunds (${S.g.mats - before} Souls) and frees the pair`);
travelToDungeon(); ok(!buyNode('knight', 'g1'), 'no buying in the dungeon');

// autocast
party(); buy('healer', 'q1', 'a1'); ok(autocastOn('healer', 1), 'an autocast starts on');
let n = fight(); n.monitor = 'excel'; for (const h of S.g.heroes) h.hp = 20;
updateBattle(0.05); ok(H('healer').cd[1] > 0, 'autocast Mend fires with Excel up');
toggleAutocast('healer', 1); H('healer').cd[1] = 0; updateBattle(0.05); ok(H('healer').cd[1] === 0, 'switched off, it waits');
toggleAutocast('healer', 1); swapHeroes(S.g.heroes.indexOf(H('healer')), S.g.heroes.indexOf(H('mage'))); updateBattle(0.05); ok(H('healer').cd[1] === 0, 'changing places stops it');

// rules and stats
party(); const k0 = heroStats(H('knight')); buy('knight', 'm1', 'm2'); const k1 = heroStats(H('knight'));
ok(Math.round(k1.armor * 10) === Math.round(k0.armor * 1.15 * 10) && maxHp(H('knight')) > k0.hp, 'Stalwart and Tower Shield: HP and armor');
buy('knight', 'm3'); ok(Math.abs(auraTaken(H('rogue')) - 0.65) < 1e-9, "Shield Brother: the Knight's aura goes to 35%");
party(); buy('rogue', 'p1'); ok(heroStats(H('rogue')).crit === heroStats(H('rogue'), {}).crit && heroStats(H('rogue')).crit >= 22, 'Keen Eye: +10 crit');
party(); buy('healer', 'g1', 'g2', 's2', 'p2'); ok(Math.abs(wardTaken() - (1 - 0.4 * 1.2)) < 1e-9, 'Bastion: Ward soaks 20% more');
party(); buy('knight', 'g1', 'g2', 's2', 'p2', 'r2b'); n = fight(); H('knight').cd[2] = 0; queueAbility(S.g.heroes.indexOf(H('knight')), 2);
ok(n.enemies.some(e => Math.abs(e.stunned - T.BASH_STUN_SEC * T.RULE_CONCUSSION) < 0.01), 'Concussion: Bash stuns twice as long');
party(); buy('knight', 'g1', 'g2', 's2', 'p2', 'r2a'); n = fight(); queueAbility(S.g.heroes.indexOf(H('knight')), 2);
ok(n.enemies.filter(e => e.marks?.stagger! > 0).length === 2, 'Cleaving Bash: the two front enemies');
party(); buy('mage', 'p1', 'r1a'); n = fight(); queueAbility(S.g.heroes.indexOf(H('mage')), 1);
ok(n.enemies.every(e => (e.burn ?? 0) > 0), 'Wildfire: every enemy Fire hits burns');
party(); buy('rogue', 'g1', 'g2', 's2', 'p2', 'r2b'); n = fight(); n.enemies.forEach(e => { e.atk = 5; }); queueAbility(S.g.heroes.indexOf(H('rogue')), 2);
const rhp = H('rogue').hp; for (let i = 0; i < 120; i++) updateBattle(1 / 30); ok(H('rogue').hp === rhp, 'Vanish: nobody hits Garrote during Smoke Bomb');
party(); buy('healer', 'p1', 'r1a'); n = fight(); queueAbility(S.g.heroes.indexOf(H('healer')), 1); ok((n.sanctuary ?? 0) > 0, 'Sanctuary: Mend raises the party\'s armor');

console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
