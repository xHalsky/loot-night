// Pre-emptive actions (#19): each outcome lands as designed.
// Run: npx tsx test/preemptive.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState, type ActivityId } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { ACT_BY_ID } from '../src/data/apartment';
import { startPre, updatePre, nextMult, preBlocked } from '../src/systems/preemptive';
import { PRE_ACTIONS } from '../src/data/preemptive';
import { updateApartment } from '../src/systems/apartment';
import { updateVisits, startVisit } from '../src/systems/visits';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const fresh = (act: ActivityId, moving = false) => {
  S.g = initialState(); S.g.day = 4; startNight();   // Friday: Messages and the battery are on (#56)
  const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9;
  n.apt.activity = act; n.apt.room = moving ? 'hallway' : ACT_BY_ID[act].room; n.apt.moving = moving ? 1 : 0; n.apt.t = 999;
  return n;
};
const run = (sec: number) => { for (let i = 0; i < sec * 60; i++) updatePre(1 / 60); };

// Text her
let n = fresh('tv'); const m0 = n.mood; startPre('text'); ok(n.action === 'pre', 'texting: hands busy (the party is on autopilot)'); run(T.PRE_TEXT_SEC + 0.1);
ok(n.apt.calm === T.PRE_TEXT_CALM && n.mood === m0 + T.PRE_TEXT_MOOD && !!n.herReply, `text while she watches TV: calm ${n.apt.calm} s, Mood ${n.mood - m0}, a reply comes`);
n = fresh('tv', true); startPre('text'); run(T.PRE_TEXT_SEC + 0.1);
ok(n.apt.forceKind === 'chat' && n.apt.forceDoor && n.apt.t <= T.PRE_TEXT_SOON, 'text while she walks: a Chat visit within 10 s');
n = fresh('shower'); startPre('text'); run(T.PRE_TEXT_SEC + 0.1);
ok(n.apt.forceKind === 'chat' && n.apt.forceDoor && n.apt.calm === 0, 'text during the shower: Chat right after');

// Diminishing returns
n = fresh('tv'); startPre('text'); run(4); ok(nextMult('text') === T.PRE_SECOND_MULT, '2nd text: half');
startPre('text'); run(4); ok(n.apt.calm > T.PRE_TEXT_CALM && n.apt.calm < T.PRE_TEXT_CALM * 1.5 + 1, `...it adds half (calm ${Math.round(n.apt.calm)})`);
ok(nextMult('text') === 0, '3rd: suspicious'); startPre('text'); run(4); ok(n.apt.forceKind === 'peek', '...and her next visit is a Peek');

// Charge (step 6, #57): away from the PC for CHARGE_SEC, then +40%; a visit meanwhile sees the screen
n = fresh('tv', true); n.home.batt = 30; n.monitor = 'excel'; startPre('charge'); ok(!!n.pre?.away && nextMult('charge') === 1, 'Charge: away, no diminishing returns');
startVisit(false, 'chat');
for (let i = 0; i < 60 * 8 && n.visit.stage !== 'in'; i++) { updateVisits(1 / 60); updatePre(1 / 60); } updateVisits(1 / 60);
ok(n.visit.result === 'pass', `away, Excel up: she finds the empty chair and Excel (${n.visit.result})`);
n = fresh('tv'); n.home.batt = 30; startPre('charge'); run(T.CHARGE_SEC + 0.1); ok(!n.pre && n.home.batt === 70, `charged: ${n.home.batt}%`);
n = fresh('tv'); ok(!!preBlocked('charge'), 'at 100%: nothing to charge');
ok(PRE_ACTIONS.every(a => a.id !== ('tea' as string) && a.id !== ('towel' as string)), 'Make her tea and the towel are gone (the Home app has bubble tea and the door seal)');

// Calm blocks the door roll
n = fresh('tv'); n.apt.calm = 30; n.apt.t = 0.01; n.apt.lastVisitEnd = -999;
let door = false; for (let i = 0; i < 60; i++) door = door || updateApartment(1 / 60) === 'door';
ok(!door, 'calm: no visit roll even past the max gap');

console.log(fails ? `${fails} FAILED` : 'PASS');
