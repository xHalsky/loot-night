// The fallen (#154): a kill lays a corpse where the enemy stood (a boss's own; the ones who ran after the boss fell
// leave none), a swarm leaves one wreck per body it loses, the corpses go with the floor as the party walks, age, and
// are gone after CORPSE_SEC + CORPSE_FADE_SEC; a new floor or the town clears them. Run: npx tsx test/corpses.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { travelToDungeon, returnToTown } from '../src/systems/dungeon';
import { spawnBattle, updateBattle } from '../src/systems/battle';
import { updateCorpses, walkCorpses, clearCorpses } from '../src/systems/corpses';
import { ensureParty } from '../src/systems/positions';

let fail = 0;
const ok = (c: boolean, what: string) => { console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fail++; };
S.g = initialState(); S.g.day = 3; S.g.realLifeOff = true; startNight(); S.g.howto = false; S.g.voice = null; ensureParty();
travelToDungeon(1);
const n = N();
n.phase = 'battle'; spawnBattle(1, false, false);
const e = n.enemies[0];
e.hp = 0; updateBattle(0.016);
ok((n.corpses ?? []).length === 1 && n.corpses![0].defId === e.defId && n.corpses![0].slot === e.slot && n.corpses![0].t === 0, 'a kill lays a corpse where it stood, of its kind');
// a swarm: one wreck per body lost, the rest when it falls
clearCorpses();
const sw = n.enemies.find(x => x.hp > 0)!;
sw.per = sw.hp / 5; sw.bodiesSeen = undefined; updateCorpses(0.016);
sw.hp = sw.per * 3; updateCorpses(0.016);
ok(n.corpses!.length === 2 && n.corpses!.map(c => c.body).join() === '4,3', 'a swarm losing two bodies: their two wrecks (bodies 4 and 3)');
sw.hp = 0; updateBattle(0.016);
ok(n.corpses!.length === 5 && n.corpses!.slice(2).map(c => c.body).join() === '2,1,0', 'it falls: the last three wrecks');
// the boss: his own; the rest run and leave nothing
clearCorpses(); n.enemies = []; spawnBattle(5, true, false);
const boss = n.enemies.find(x => x.boss)!, others = n.enemies.filter(x => !x.boss).length;
boss.hp = 0; updateBattle(0.016);
ok(n.corpses!.length === 1 && n.corpses![0].boss && n.corpses![0].defId === boss.defId, `the boss: his own pile; the ${others} who ran leave none`);
// they go with the floor, age, and go
walkCorpses(30);
ok(n.corpses![0].dx === 30, 'the walk carries them with the floor');
updateCorpses(T.CORPSE_SEC);
ok(n.corpses!.length === 1, 'still there after CORPSE_SEC (fading)');
updateCorpses(T.CORPSE_FADE_SEC + 0.01);
ok(n.corpses!.length === 0, 'gone after its fade');
// the town clears them (the corridor is somewhere else)
n.corpses = [{ uid: 1, defId: 'skeleton', slot: 0, boss: false, dx: 0, t: 0 }];
n.phase = 'walk'; n.enemies = []; n.reserve = []; returnToTown();
ok(!(n.corpses ?? []).length, 'back to town: no corpses');
console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
