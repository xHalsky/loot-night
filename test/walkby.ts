// Hoodie walk-by (#22): green Mood at bedtime, she says good night at your door. No check, once a night.
// Run: npx tsx test/walkby.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { updateVisits } from '../src/systems/visits';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (mood: number) => {
  S.g = initialState(); startNight(); const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9;
  n.clock = T.BED_FROM + 1; n.mood = mood; n.monitor = 'rpg'; n.apt.t = 0.01; n.apt.lastVisitEnd = -999; n.apt.moving = 0;
  let kinds: string[] = [];
  for (let i = 0; i < 60 * 30; i++) { const before = n.visit.stage; updateVisits(1 / 60); if (before === 'idle' && n.visit.stage !== 'idle') kinds.push(n.visit.kind); }
  return { n, kinds };
};
let { n, kinds } = night(20);
ok(kinds[0] === 'night', `green at bedtime: she comes by to say good night (${kinds.join(',') || 'none'})`);
ok(n.catches === 0 && n.mood === 20 + T.WALKBY_MOOD, `game on screen, no catch; Mood ${n.mood}`);
ok(n.apt.asleep, '...then she goes to bed');
ok(kinds.filter(k => k === 'night').length === 1, 'once a night');
({ n, kinds } = night(T.MOOD_GREEN + 10));
ok(!kinds.includes('night'), `not green: straight to bed (${kinds.join(',') || 'no visit'})`);
console.log(fails ? `${fails} FAILED` : 'PASS');
