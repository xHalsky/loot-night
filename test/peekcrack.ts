// Peek through the crack (#34): how the door opens and how long you can look before she notices.
// Run: npx tsx test/peekcrack.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { setPeeking, updatePeek } from '../src/systems/peek';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const setup = (room: string, activity: string, moving = 0) => {
  S.g = initialState(); startNight(); const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9;
  Object.assign(n.apt, { room, activity, moving, asleep: activity === 'sleep', t: 999 });
  return n;
};
/** Seconds of holding the door until she notices (or null within 15 s); also when the crack passed `at`. */
function hold(room: string, activity: string, moving = 0, at = 1) {
  const n = setup(room, activity, moving);
  setPeeking(true);
  let reached: number | null = null;
  for (let i = 1; i <= 60 * 15; i++) {
    updatePeek(1 / 60);
    if (reached === null && n.peek >= at) reached = i / 60;
    if (!n.peeking) return { spotted: i / 60, reached };
  }
  return { spotted: null, reached };
}
const narrow = T.PEEK_CRACK_MIN / T.PEEK_CRACK_MAX;
let n = setup('kitchen', 'tea'); setPeeking(true);
for (let i = 0; i < 30; i++) updatePeek(1 / 60);
ok(Math.abs(n.peek - narrow) < 0.01, `opens to a narrow crack in ${T.PEEK_OPEN_SEC} s (${(n.peek * T.PEEK_CRACK_MAX).toFixed(2)} of the door)`);
for (let i = 0; i < 60 * T.PEEK_CREEP_SEC + 2; i++) updatePeek(1 / 60);
ok(n.peek >= 0.99, `creeps to PEEK_CRACK_MAX (${T.PEEK_CRACK_MAX}) over ${T.PEEK_CREEP_SEC} s`);
setPeeking(false); for (let i = 0; i < 32; i++) updatePeek(1 / 60);
ok(n.peek === 0, 'let go: it closes');
const k = hold('kitchen', 'tea'); ok(k.spotted === null, 'kitchen: she never sees you');
const s = hold('bathroom', 'shower'); ok(s.spotted === null, 'shower: she never sees you');
const b = hold('bedroom', 'phone'); ok(b.spotted === null, 'bedroom: she never sees you');
const h = hold('living', 'phone', 1.5); ok(h.spotted !== null && h.spotted < 3, `hallway: noticed fast (${h.spotted?.toFixed(1)} s)`);
// the living room shows once the crack passes about 0.58 of the door (x <= 125 in drawHallway)
const tv = hold('living', 'tv', 0, 0.58 / T.PEEK_CRACK_MAX);
ok(tv.spotted !== null && tv.reached !== null && tv.spotted - tv.reached > 1.5,
  `TV: the living room shows at ${tv.reached?.toFixed(1)} s, she notices at ${tv.spotted?.toFixed(1)} s (a short look is safe)`);
console.log(fails ? `${fails} FAILED` : 'PASS');
