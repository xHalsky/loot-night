// Route choice acceptance test (#52, 1.5): every feature puts its curio (or its map) on the floor, every condition
// does what its card says, the away timer takes the safest path and never a map card.
// npx tsx test/routes.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { startNight } from '../src/systems/night';
import { travelToDungeon, choosePath, debugEndFloor } from '../src/systems/dungeon';
import { skipDrop } from '../src/systems/loot';
import { FEATURES, CONDITIONS, type FeatureId, type ConditionId, type PathCard } from '../src/data/routes';

function fresh() { S.g = initialState(); S.g.realLifeOff = true; startNight(); S.g.howto = false; travelToDungeon(); }
function toMap() { debugEndFloor(); }
function runFloor(card: PathCard, sec = 90) {
  const n = N(); n.paths = [card]; n.safest = 0; choosePath(0);
  const seen: string[] = [];
  for (let t = 0; t < sec; t += 1 / 30) {
    const m = N();
    if (m.curio && !seen.includes(m.curio.id)) seen.push(m.curio.id);
    if (m.dropPopup) skipDrop();
    if (m.phase === 'mapChoice' || m.location !== 'dungeon') break;
    step(1 / 30);
  }
  return seen;
}
let fail = 0;
const ok = (cond: boolean, what: string) => { console.log((cond ? 'ok   ' : 'FAIL ') + what); if (!cond) fail++; };

// features
for (const f of Object.keys(FEATURES) as FeatureId[]) {
  fresh(); for (const h of S.g.heroes) h.level = 12; toMap();
  const want = FEATURES[f];
  const seen = runFloor({ feat: f });
  if (want.curio) ok(seen.includes(want.curio), `feature ${f}: the ${want.curio} curio stood on the floor (saw ${seen.join(', ') || 'none'})`);
  else { fresh(); toMap(); N().paths = [{ feat: f }]; choosePath(0); ok(N().floorMap === want.map, `feature ${f}: floor map ${N().floorMap}`); }
}
// conditions stay for the floor and go with it
for (const c of Object.keys(CONDITIONS) as ConditionId[]) {
  fresh(); toMap(); N().paths = [{ cond: c }]; choosePath(0);
  ok(N().cond === c && (!CONDITIONS[c].map || N().floorMap === CONDITIONS[c].map), `condition ${c}: on the floor${CONDITIONS[c].map ? ', map ' + N().floorMap : ''}`);
}
// away: the safest card is taken after MAP_AWAY_SEC in all, never a map
fresh(); toMap();
let n = N(); n.paths = [{ map: 'x', mapKind: 'vault' }, { cond: 'cursed' }, { feat: 'shrine', cond: 'silent' }]; n.safest = 2;
n.monitor = 'excel';
for (let t = 0; t < 2.5; t += 1 / 30) step(1 / 30);
n.monitor = 'rpg'; for (let t = 0; t < 3; t += 1 / 30) step(1 / 30);
ok(N().phase === 'mapChoice', 'away 2.5 s then back: still choosing');
N().monitor = 'excel'; for (let t = 0; t < 2.7; t += 1 / 30) step(1 / 30);
ok(N().phase !== 'mapChoice' && N().cond === 'silent' && N().feature === 'shrine', `away 5 s in all: the safest path was taken (${N().feature}, ${N().cond})`);
// generation: the safest is never a map, a boss floor has one card
let mapSafest = 0, bossOk = 0;
for (let i = 0; i < 200; i++) {
  fresh(); S.g.bag.push({ kind: 'map', id: 'm' + i, map: 'vault' } as any); N().floor = i % 2 ? 9 : 6; toMap();
  const p = N().paths!;
  if (p[N().safest].map) mapSafest++;
  if (N().floor === 9) bossOk += +(p.length === 1 && !!p[0].boss); else bossOk += +(p.length >= 2 && p.length <= 3);
}
ok(mapSafest === 0, `the safest card is never a map (${mapSafest}/200)`);
ok(bossOk === 200, `card counts: one before a boss, 2 or 3 otherwise (${bossOk}/200)`);
console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
