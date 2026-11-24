// Stars that reward greed (#54, 3.1): three goals, a star each, and a morning reward per star.
// npx tsx test/stars.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { S, initialState } from '../src/core/state';
import { T } from '../src/config/tuning';
import { startNight, endNight, toMorning } from '../src/systems/night';

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
function night(set: (n: NonNullable<typeof S.g.night>) => void, ending: 'sleep' | 'dawn' | 'unplugged' = 'sleep') {
  startNight();
  const n = S.g.night!;
  n.clock = T.EARLIEST_SLEEP + 10; n.location = 'town';
  set(n);
  endNight(ending);
  return S.g.results!;
}
S.g = initialState(); S.g.realLifeOff = true;
S.g.record = 1;
let r = night(n => { ok(n.deepTarget === T.STAR_DEEP_MIN, `target is at least ${T.STAR_DEEP_MIN} (record 1)`); n.deepest = 3; n.mood = 20; });
ok(r.goals.deep && r.goals.unseen && r.goals.sweet && r.stars === 3, 'floor 3, never caught, happy: three stars');
const debt = S.g.sleepDebt = 2, bag = S.g.bag.length;
toMorning();
ok(!!S.g.morning?.chest && S.g.bag.length === bag + 1, 'Deep: a chest item lands in the bag');
ok(S.g.morning!.chest!.ilvl === 3, 'the chest rolls at tonight\'s deepest floor');
ok(S.g.sleepDebt === debt - T.STAR_SWEET_DEBT, 'Sweet: breakfast takes sleep debt down');
ok(S.g.carry?.goodwill === T.STAR_UNSEEN_GOODWILL, 'Unseen: Trust waits for the next night');
S.g.goodwill = 0;
startNight();
ok(S.g.goodwill === T.STAR_UNSEEN_GOODWILL && !S.g.carry, 'the next night starts with the Trust Goodwill');

S.g.record = 6;
r = night(n => { ok(n.deepTarget === 6 + T.STAR_DEEP_OFFSET, 'target follows the record'); n.deepest = 4; n.everCaught = true; n.catches = 2; n.mood = T.MOOD_RED + 3; });
ok(!r.goals.deep && !r.goals.unseen && !r.goals.sweet && r.stars === 0, 'short, caught, red: no stars');
ok(r.nearMisses.some(m => m.includes('2 floors short of tonight')), 'near miss names the floors short');
S.g.carry = undefined;
toMorning();
ok(!S.g.morning!.chest && !S.g.morning!.trust && !S.g.morning!.breakfast && !S.g.carry, 'no stars: no rewards');

r = night(n => { n.deepest = 20; n.mood = 10; }, 'unplugged');
ok(r.stars === 0, 'unplugged: no stars, whatever else happened');

// a full bag: the chest waits as the next night's first drop
r = night(n => { n.deepest = n.deepTarget; n.mood = 10; });
while (S.g.bag.length < S.g.bagSize) S.g.bag.push({ kind: 'feather', id: 'f' + S.g.bag.length });
toMorning();
ok(S.g.morning!.chestWaits && S.g.carry!.drops.length === 1, 'bag full: the chest waits');
startNight();
ok(S.g.night!.dropQueue.length === 1, 'and drops first thing tonight (the bag-full flow takes it from there)');

console.log(fails ? `${fails} failed` : 'all passed');
process.exit(fails ? 1 : 0);
