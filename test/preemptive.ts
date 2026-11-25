// Pre-emptive actions (#19): each outcome lands as designed.
// Run: npx tsx test/preemptive.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { rules } from '../src/systems/week';
import { T } from '../src/config/tuning';
import { S, N, initialState, type ActivityId } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { ACT_BY_ID } from '../src/data/apartment';
import { startPre, updatePre, episodeAnswer, nextMult } from '../src/systems/preemptive';
import { updateApartment, hearing } from '../src/systems/apartment';
import { updateVisits, startVisit } from '../src/systems/visits';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const fresh = (act: ActivityId, moving = false) => {
  S.g = initialState(); S.g.day = 4; startNight();   // Friday: Messages, tea and the towel are on (#56)
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

// Make her tea
n = fresh('tv'); const m1 = n.mood; startPre('tea'); ok(n.pre!.away && n.pre!.withHer, 'tea while she watches TV: you are away, she waits with you');
run(T.PRE_TEA_SEC + 0.1); ok(n.pre?.stage === 'ask' && n.mood === m1 + T.PRE_TEA_MOOD, '"stay for one episode?" after the tea, Mood -15');
episodeAnswer(true); run(T.PRE_EPISODE_SEC + 0.1); ok(!n.pre && n.apt.calm === T.PRE_EPISODE_CALM, `stayed: back at the desk, calm ${n.apt.calm} s`);
n = fresh('phone'); startPre('tea'); run(T.PRE_TEA_SEC + 0.1); ok(!n.pre && n.apt.calm === T.PRE_TEA_CALM, 'tea in the bedroom: no question, calm 2 min');
n = fresh('tv'); startPre('tea'); run(T.PRE_TEA_SEC + 0.1); episodeAnswer(false); ok(n.apt.calm === T.PRE_TEA_CALM / 2, 'declined the episode: half the calm');
n = fresh('tea'); startPre('tea'); ok(n.pre!.max === T.PRE_TEA_SEC + T.PRE_TEA_HUG_SEC && !n.pre!.withHer, 'tea while she is in the kitchen: a long hug, no calm');
n = fresh('tv', true); n.monitor = 'rpg'; startPre('tea'); ok(n.catches === 1, 'tea while she walks the hallway, game on screen: she glances, caught');
n = fresh('tv', true); n.monitor = 'excel'; startPre('tea'); ok(n.catches === 0, '...with Excel up: fine');

// A visit while you are away sees the screen
n = fresh('tv', true); n.monitor = 'excel'; startPre('tea'); startVisit(false, 'chat');
for (let i = 0; i < 60 * 8 && n.visit.stage !== 'in'; i++) updateVisits(1 / 60); updateVisits(1 / 60);
ok(n.visit.result === 'pass', `away, Excel up: she finds the empty chair and Excel (${n.visit.result})`);

// Towel
n = fresh('tv'); const h0 = hearing(); startPre('towel'); run(T.PRE_TOWEL_SEC + 0.1);
ok(n.towel && Math.abs(hearing() / h0 - (1 - T.PRE_TOWEL_NOISE)) < 1e-9, `towel: your Noise reaches her ${Math.round(hearing() / h0 * 100)}%`);
n.apt.t = 10; for (let i = 0; i < 60; i++) updateApartment(1 / 60); ok(Math.abs(n.apt.t - (10 - (1 - T.PRE_TOWEL_SLOW) * rules().visits)) < 0.02, 'towel: her routine runs 30% slower');   // x the week's pace (#56)
ok(nextMult('towel') === 1, 'towel is a toggle: no diminishing returns');

// Calm blocks the door roll
n = fresh('tv'); n.apt.calm = 30; n.apt.t = 0.01; n.apt.lastVisitEnd = -999;
let door = false; for (let i = 0; i < 60; i++) door = door || updateApartment(1 / 60) === 'door';
ok(!door, 'calm: no visit roll even past the max gap');

console.log(fails ? `${fails} FAILED` : 'PASS');
