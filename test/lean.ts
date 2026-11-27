// Lean in (fan-service steps 7 and 12, V12 #77): from Tuesday, hold the door past 0.6 s and you lean in (Eyes busy);
// her glances (the tell, then she looks) fill the red bar, faster the wider the slit; spotted: "Enjoying the view?",
// never a catch; the wheel's notches and the creak; the hall mirror (clear, fogged); her timers' stages; Tuesday's
// first yoga; the sheet mask before bed; the plan change's hearing (the bathroom far, the bedroom middle).
// Run: npx tsx test/lean.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { updateLean, leanNotch, leanTo, leanFocus, leanMirror, leanStage, leanAct, spotMult } from '../src/systems/lean';
import { abilitiesLocked } from '../src/systems/battle';
import { closeCoach, updateCoach } from '../src/systems/coach';
import { ROOM_DISTANCE } from '../src/data/apartment';
import { updateApartment } from '../src/systems/apartment';
import { bedAt, howtoTiles, voiceNote } from '../src/systems/week';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (day = 1) => {
  S.g = initialState(); S.g.day = day; startNight(); S.g.howto = false; S.g.voice = null;
  const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; n.apt.lastVisitEnd = 1e9; n.location = 'dungeon'; n.phase = 'battle'; n.enemies = [{ hp: 9 } as never]; n.tease.left = 0; n.tease.bedAt = 1e9;
  return n;
};
const run = (sec: number) => { for (let i = 0; i < sec * 60; i++) updateLean(1 / 60); };
const yoga = (t = 80) => { const a = N().apt; a.activity = 'yoga'; a.room = 'living'; a.t = t; a.dur = 90; a.moving = 0; a.asleep = false; };

// --- when ---
ok(ROOM_DISTANCE.bathroom === 'far' && ROOM_DISTANCE.bedroom === 'middle', 'the plan change: the bathroom at the far end, the bedroom in the middle');
let n = night(0); n.peeking = true; run(2); ok(!n.lean, 'Monday: holding the door is only the glance');
n = night(1);
ok(n.apt.activity === 'yoga' && n.apt.calm > 0 && n.apt.calmHard, 'Tuesday opens with her yoga, and no visit while it lasts');
ok(howtoTiles().ids.join() === 'listen,tab,answer,headset,lean' && howtoTiles().isNew.includes('lean'), 'How to hide: five tiles, Lean in new tonight');
ok(voiceNote()!.chat[1][1].includes('lean in'), "the boys' chat names it");
updateLean(0.01); ok(n.coach?.id === 'lean', 'coach mark 1: the door (she is doing yoga)'); closeCoach();
n.peeking = true; run(T.LEAN_DELAY - 0.1); ok(!n.lean, 'holding the door: not yet...');
run(0.2); ok(!!n.lean && n.coach?.id === 'leanview', `...past ${T.LEAN_DELAY} s you lean in (coach mark 2)`); closeCoach();
ok(abilitiesLocked() === 'Eyes busy', 'Eyes busy: no skills');
// the first lean is safe for 6 s
yoga(); n.lean!.lookT = 0.1; run(T.LEAN_FIRST_SAFE_SEC - 0.5); ok(n.lean!.look === 'busy' && n.lean!.bar === 0, `the first lean: no tell in its first ${T.LEAN_FIRST_SAFE_SEC} s`);
run(0.6); ok(n.lean!.look === 'tell' && n.coach?.id === 'tell', 'then her tell (coach mark 3)');
run(3); ok(n.lean!.look === 'tell' && n.lean!.bar === 0, 'the first tell crawls till you let go: it never spots you');
n.peeking = false; run(0.05); updateCoach(0.01); ok(!n.lean && !n.coach, 'let go: back to the game');

// --- the red bar ---
const bar = (slit: number, focus = false) => {
  const n = night(1); yoga(); S.g.tipsSeen.push('lean:first', 'coach:tell', 'coach:leanview', 'coach:lean'); n.peeking = true; run(T.LEAN_DELAY + 0.05);
  n.lean!.slit = slit; n.lean!.focus = focus; n.lean!.lookT = 0.01; const m0 = n.mood, g0 = S.g.goodwill;
  run(T.SPOT_TELL_SEC + T.LEAN_LOOK_SEC + 0.05); return { lean: n.lean, m: n.mood - m0, g: S.g.goodwill - g0, sp: n.leanSpotted };
};
const narrow = bar(24);
ok(!!narrow.lean && narrow.lean.bar > 0.6 && narrow.lean.bar < 1, `24 px: she looks ${T.LEAN_LOOK_SEC} s, the bar to ${narrow.lean?.bar.toFixed(2)}: not seen`);
const wide = bar(160);
ok(!wide.lean && !!wide.sp && wide.m === T.LEAN_SPOT_MOOD, `160 px: spotted, "Enjoying the view, creep?" (Mood +${T.LEAN_SPOT_MOOD}), the lean ends`);
ok(N().catches === 0, 'never a catch');
S.g = initialState();
const focus = bar(24, true); ok(!focus.lean, 'the closer framing: x1.5, spotted at 24 px');
// Goodwill 40+: flustered
n = night(1); yoga(); S.g.goodwill = 50; S.g.tipsSeen.push('lean:first', 'coach:tell'); n.peeking = true; run(T.LEAN_DELAY + 0.05); n.lean!.slit = 160; n.lean!.lookT = 0.01;
run(T.SPOT_TELL_SEC + T.LEAN_LOOK_SEC); ok(!!n.leanSpotted?.good && S.g.goodwill >= 50 + T.LEAN_SPOT_GW - 1, `Goodwill 50: she blushes, Goodwill +${T.LEAN_SPOT_GW}`);
// where she can't see your door, no glances
n = night(1); const a = n.apt; a.activity = 'shower'; a.room = 'bathroom'; a.t = 80; a.moving = 0; S.g.tipsSeen.push('lean:first'); n.peeking = true; run(T.LEAN_DELAY + 0.05); n.lean!.lookT = 0.01;
run(5); ok(leanAct() === 'shut' && n.lean!.look === 'busy' && n.lean!.bar === 0, 'the shower: the door shut, she never looks');

// --- the wheel, the creak ---
n = night(1); yoga(); n.peeking = true; run(T.LEAN_DELAY + 0.05); const s0 = n.lean!.slit, nz = n.noise;
leanNotch(1); run(1); leanNotch(1); ok(n.lean!.slit === s0 + 2 * T.LEAN_NOTCH && n.noise === nz, 'two notches apart: wider, quietly');
leanNotch(1); run(0.1); leanNotch(1); ok(n.noise >= nz + T.LEAN_CREAK_NOISE - 0.01, `two within ${T.LEAN_CREAK_SEC} s: it creaks, Noise +${T.LEAN_CREAK_NOISE}`);
for (let i = 0; i < 30; i++) leanNotch(-1); ok(n.lean!.slit === T.LEAN_SLIT[0], `the slit: ${T.LEAN_SLIT[0]} px at least`);
ok(Math.abs(spotMult(n.lean!) - T.LEAN_SPOT_MIN) < 1e-9, 'its bar rate x1');

// --- the mirror ---
leanTo(0.8); ok(leanMirror() === 'off', 'past 3 without the mirror: nothing round the corner');
S.g.owned.push('mirror'); ok(leanMirror() === 'clear', 'the hall mirror (bought): round the corner');
n.apt.activity = 'shower'; n.apt.moving = 0; run(0.1); ok(leanMirror() === 'fog', 'her shower steam fogs it');
n.apt.activity = 'tv'; run(T.MIRROR_DEFOG_SEC - 1); ok(leanMirror() === 'fog', '...a while');
run(1.5); ok(leanMirror() === 'clear', `...clears ${T.MIRROR_DEFOG_SEC} s later`);
leanFocus(true); ok(n.lean!.focus, 'the right button: the closer framing');

// --- her timers' stages ---
yoga(85); ok(leanStage() === 0, 'yoga, just started: standing'); yoga(40); ok(leanStage() === 1, 'halfway: on the floor'); yoga(10); ok(leanStage() === 2, 'the last stretch: lying flat');

// --- the sheet mask before bed (Friday) ---
n = night(4); n.clock = bedAt() - T.MASK_BEFORE_BED_MIN + 1; n.apt.t = 0; n.apt.moving = 0; n.apt.calm = 5; n.apt.forceDoor = false; n.apt.showerUsed = true; updateApartment(1 / 60);
ok(n.apt.activity === 'mask', 'Friday, before bed: her sheet mask (once)');
console.log(fails ? `${fails} FAILED` : 'PASS');
