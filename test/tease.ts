// Her tease visit (fan-service step 1, #85) and "come to bed" (step 2, #89): when she comes, looking at her (Eyes busy,
// Goodwill, three hearts), ignoring her (once more, then Mood), never a catch, Excel counts as ignoring, come to bed
// after 01:00 from Friday, and Coming, babe ending the night like Sleep with the green morning.
// Run: npx tsx test/tease.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { rulesFor } from '../src/systems/week';
import { updateVisits, triggerVisitNow, comingBabe } from '../src/systems/visits';
import { eyesBusy } from '../src/systems/eyes';
import { abilitiesLocked } from '../src/systems/battle';
import { morningScene } from '../src/render/morningView';
import { step } from '../src/core/loop';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (day = 5) => {
  S.g = initialState(); S.g.day = day; startNight(); S.g.howto = false;
  const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; n.apt.lastVisitEnd = 1e9; n.apt.t = 999; n.location = 'dungeon'; n.monitor = 'rpg';
  return n;
};
const run = (sec: number) => { for (let i = 0; i < sec * 60; i++) updateVisits(1 / 60); };

// --- when ---
ok([0, 1, 2, 3, 4].every(d => rulesFor(d).teases[1] === 0) && rulesFor(5).teases.join() === '1,2' && rulesFor(6).teases.join() === '2,3', 'teases: none on weekdays, 1 to 2 Saturday, 2 to 3 Sunday');
let n = night(5); ok(n.tease.left >= 1 && n.tease.left <= 2, `Saturday: ${n.tease.left} tonight`);
n = night(4); ok(n.tease.left === 0 && n.tease.bedAt >= T.BED_TEASE_AT[0], 'Friday: no tease, but come to bed after 01:00');

// --- the tease: her call, the doorway ---
n = night(5); triggerVisitNow('tease');
ok(n.visit.stage === 'far' && n.apt.heardWhat === 'BABE?' && !n.visit.fake, 'no footsteps: her soft "babe?"');
run(T.TEASE_CALL_SEC + 0.05); ok(n.visit.stage === 'in', 'then she is in the doorway');
// looking at her
n.looking = true; const g0 = S.g.goodwill, f0 = n.flow;
ok(eyesBusy() && abilitiesLocked() === 'Eyes busy', 'the pointer on the webcam, the game up: Eyes busy (skills blocked)');
run(1); ok(Math.abs(S.g.goodwill - g0 - T.TEASE_GOODWILL_PER_SEC) < 0.2, `Goodwill +${(S.g.goodwill - g0).toFixed(1)} in a second of looking`);
step(1 / 30); ok(n.flow <= f0, 'Flow does not build while you look');
run(T.TEASE_LOOK_SEC); ok(n.visit.result === 'kissed' && n.catches === 0, '3 s of looking: a blown kiss, no catch');
run(2); ok(n.visit.stage === 'idle', 'and she goes');
// ignored: once more, then she leaves pouting
n = night(5); triggerVisitNow('tease'); run(T.TEASE_CALL_SEC + 0.05); const m0 = n.mood;
run(T.TEASE_SEC + 0.05); ok(!!n.visit.esc && n.visit.stage === 'in' && n.mood === m0, '"Baaabe.": she asks once more');
run(T.TEASE_ESCALATE_SEC + 0.05); ok(n.visit.result === 'pout' && n.mood === m0 + T.TEASE_IGNORE_MOOD && n.catches === 0, `still ignored: she leaves pouting, Mood +${T.TEASE_IGNORE_MOOD}, never a catch`);
// Excel counts as ignoring
n = night(5); triggerVisitNow('tease'); run(T.TEASE_CALL_SEC + 0.05); n.looking = true; n.monitor = 'excel';
ok(!eyesBusy(), 'Excel up: looking does not count'); const g1 = S.g.goodwill; run(2); ok(S.g.goodwill === g1, '...no Goodwill');

// --- when in the night: on a schedule, early for the worst moments ---
const due = (hot: boolean, early: number) => { n = night(5); n.tease.left = 2; n.tease.next = 200; n.threat = 200 - early; n.lastDemand = -99; n.apt.calm = 0; n.apt.lastVisitEnd = 1e9; if (hot) n.enemies = [{ wind: 1, hp: 10 } as never]; updateVisits(1 / 60); return n.visit.kind === 'tease' && n.visit.stage !== 'idle'; };
ok(!due(false, 30) && due(true, 30) && !due(true, T.TEASE_HOT_EARLY_SEC + 5), `a boss wind-up brings her up to ${T.TEASE_HOT_EARLY_SEC} s early`);
ok(due(false, 0) && n.tease.left === 1 && n.tease.next >= n.threat + T.TEASE_GAP_SEC[0], 'due: she comes, and the next is a gap later');
n = night(5); n.tease.next = 0; n.threat = 100; n.lastDemand = 95; updateVisits(1 / 60); ok(n.visit.stage === 'idle', 'never on top of another demand (real life is one at a time)');

// --- come to bed (Friday on) ---
n = night(4); n.apt.asleep = true; n.clock = 25 * 60 + 50; n.lastDemand = -99; n.apt.lastVisitEnd = 1e9; updateVisits(1 / 60);
ok(n.visit.kind === 'tease' && !!n.visit.bed && !n.apt.asleep, 'after 01:00 she gets up: come to bed');
run(T.TEASE_CALL_SEC + 0.05); n.looking = true; const g2 = S.g.goodwill; run(1);
ok(Math.abs(S.g.goodwill - g2 - T.TEASE_GOODWILL_PER_SEC * T.BED_TEASE_GOODWILL_MULT) < 0.3, 'looking pays x2');
n.looking = false; const m2 = n.mood; run(T.TEASE_SEC + T.TEASE_ESCALATE_SEC + 0.1);
ok(n.mood === m2 + Math.round(T.TEASE_IGNORE_MOOD * T.BED_TEASE_MOOD_MULT), `ignored: Mood x1.5 (+${n.mood - m2})`);
run(2); ok(n.apt.asleep && n.tease.bedDone, 'she goes back to bed; once a night');
// Coming, babe
n = night(4); n.mood = 80; n.apt.asleep = true; n.clock = 25 * 60 + 50; n.lastDemand = -99; n.apt.lastVisitEnd = 1e9; updateVisits(1 / 60); run(T.TEASE_CALL_SEC + 0.05);
n.phase = 'battle'; const debt0 = S.g.sleepDebt; comingBabe();
ok(S.g.screen === 'results' && S.g.results?.ending === 'sleep' && !!S.g.results?.coming, 'Coming, babe: the night ends like Sleep (even mid-battle)');
ok(morningScene() === 'green' && !S.g.results?.goals.sweet, 'the green morning whatever her Mood; Sweet still goes by her Mood');
ok(S.g.sleepDebt === Math.min(T.SLEEP_DEBT_MAX, debt0 + Math.ceil((Math.floor(25 * 60 + 50) - T.BEDTIME) / T.SLEEP_DEBT_STEP_MIN)), 'sleep debt as Sleep at that hour');
// weekdays: none
n = night(2); n.threat = 999; n.lastDemand = -99; let any = false; for (let i = 0; i < 600; i++) { updateVisits(1); if (n.visit.kind === 'tease' && n.visit.stage !== 'idle') any = true; } ok(!any, 'Wednesday: never a tease');
console.log(fails ? `${fails} FAILED` : 'PASS');
