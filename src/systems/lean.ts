// Lean in (fan-service steps 7 and 12, V12 #77; grid doc 7l; docs/design/her.md, Lean in). From Tuesday, holding your
// door open past LEAN_DELAY turns the right screen into his view through the crack: a slit of her flat as wide as the
// door is open. The mouse leans (the plan's 1 2 3 and the mirror), the wheel opens the door a notch, the right button
// looks closer. What she's doing is drawn into her scene in three stages (her timers): how far along she is tells you
// how long you're safe. It costs Eyes busy and the game screen, and she can see you: now and then she glances at your
// door (her tell first: let go), and while she looks the red bar fills, faster the wider the slit. Full: "Enjoying the
// view?" Never a catch (she sees you, not the game): flustered at Goodwill 40+ (+10), teasing below (Mood +5).
import { T } from '../config/tuning';
import { S, N, type LeanState } from '../core/state';
import { on } from './week';
import { rand, clamp } from '../core/rng';
import { addMood } from './meters';
import { addGoodwill } from './goodwill';
import { owns } from './shop';
import { coach } from './coach';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');
import { sfx } from '../ui/audio';

/** Holding the door: does tonight have lean in? */
export const leanOn = () => !!N()?.lean;

/** What the lean shows of her: the page's activity names (lean.js leanScene and herPlace). */
export function leanAct(): string {
  const a = N().apt;
  if (a.asleep || a.moving > 0) return 'none';
  switch (a.activity) {
    case 'yoga': return 'yoga';
    case 'tv': return 'couch';
    case 'tea': return 'kitchen';
    case 'mask': return 'mask';
    case 'bath': return a.ajar ? 'bath' : 'shut';
    case 'shower': case 'toilet': return 'shut';
    default: return 'none';
  }
}
/** Her timer's stage: just started, about halfway, the last stretch. */
export function leanStage(): number {
  const a = N().apt, dur = a.dur || a.t || 1, left = clamp(a.t / dur, 0, 1);
  return left > 0.66 ? 0 : left > 0.25 && a.t > 15 ? 1 : 2;
}
/** She can glance at your door from where she is (she's in a room the lean reaches, doing her thing). */
const canLook = () => ['yoga', 'couch', 'kitchen', 'bath', 'mask'].includes(leanAct());
/** The lean's view of the hall mirror (199 zl, the Shop's Home tab): past the third stop. */
export function leanMirror(): 'off' | 'clear' | 'fog' {
  const l = N().lean;
  if (!l || !owns('mirror') || l.u < 0.74) return 'off';
  return N().leanFog > 0 ? 'fog' : 'clear';
}
const inMirror = () => leanMirror() !== 'off' && leanAct() === 'mask';

function start() {
  const n = N(), first = !S.g.tipsSeen.includes('lean:first');
  const u = n.apt.activity === 'tea' ? 0.1 : n.apt.activity === 'mask' ? 0.84 : n.apt.room === 'bathroom' ? 0.38 : 0.64;   // each activity opens centred on her
  n.lean = { u, u0: u, slit: T.LEAN_SLIT_START, focus: false, look: 'busy', lookT: rand(...T.LEAN_LOOK_GAP), bar: 0, notchAt: -9, t: 0, safe: first ? T.LEAN_FIRST_SAFE_SEC : 0 };
  if (first) S.g.tipsSeen.push('lean:first');
  coach('leanview');
}
export function stopLean() { const n = N(); n.lean = null; n.leanHold = 0; }

/** Every frame (game time): the hold, her glances, the red bar, the mirror's fog. */
export function updateLean(dt: number) {
  const n = N(), a = n.apt;
  if ((a.activity === 'shower' || a.activity === 'bath') && a.moving <= 0) n.leanFog = T.MIRROR_DEFOG_SEC; else n.leanFog = Math.max(0, n.leanFog - dt);
  if (n.leanSpotted && (n.leanSpotted.t -= dt) <= 0) n.leanSpotted = null;
  if (on('lean') && !n.lean && a.activity === 'yoga' && a.moving <= 0 && n.visit.stage === 'idle' && !n.game && n.location === 'dungeon') coach('lean');   // the first chance (week one 2b)
  if (!n.peeking || !on('lean') || n.visit.stage === 'in' || n.pre?.away) { if (n.lean) stopLean(); n.leanHold = 0; return; }
  n.leanHold += dt;
  if (!n.lean) { if (n.leanHold >= T.LEAN_DELAY) start(); return; }
  const l = n.lean;
  l.t += dt; l.safe = Math.max(0, l.safe - dt);
  // her glances: busy, her tell (let go now), then she looks; only from where she can see your door
  if (!canLook()) { l.look = 'busy'; l.lookT = Math.max(l.lookT, 1); }
  else {
    l.lookT -= dt;
    if (l.look === 'busy' && l.lookT <= 0 && l.safe <= 0) { l.look = 'tell'; l.lookT = T.SPOT_TELL_SEC; coach('tell'); }
    else if (l.look === 'tell' && l.lookT <= 0 && n.coach?.id !== 'tell') { l.look = 'sees'; l.lookT = T.LEAN_LOOK_SEC; }   // her first tell crawls until you let go
    else if (l.look === 'sees' && l.lookT <= 0) { l.look = 'busy'; l.lookT = rand(...T.LEAN_LOOK_GAP); }
  }
  if (l.look === 'sees') l.bar += T.LEAN_SPOT_RATE * spotMult(l) * dt;
  else l.bar = Math.max(0, l.bar - T.LEAN_SPOT_DECAY * dt);
  if (l.bar >= 1) spotted();
}
/** How fast the red bar fills: the slit's width, the closer framing, the mirror. */
export function spotMult(l: LeanState): number {
  const k = (l.slit - T.LEAN_SLIT[0]) / (T.LEAN_SLIT[1] - T.LEAN_SLIT[0]);
  return (T.LEAN_SPOT_MIN + (T.LEAN_SPOT_MAX - T.LEAN_SPOT_MIN) * k) * (l.focus ? T.LEAN_FOCUS_SPOT : 1) * (inMirror() ? T.MIRROR_SPOT : 1);
}

function spotted() {
  const n = N(), good = S.g.goodwill >= T.LEAN_SPOT_GOODWILL;
  n.leanSpotted = { t: 3.5, good };
  if (good) { addGoodwill(T.LEAN_SPOT_GW, 'she caught you looking'); toast('"Enjoying the view?" She blushes and turns back.', '#ff9ab8'); sfx.kiss(); }
  else { addMood(T.LEAN_SPOT_MOOD); toast(`"Enjoying the view, creep?" Mood +${T.LEAN_SPOT_MOOD}.`, '#ffb07a'); sfx.bad(); }
  n.peeking = false; stopLean();   // you let go of the door, red-faced
}

// ---- input (main.ts) ----
/** The mouse across the right screen leans (0 the kitchen .. 1 past the mirror). */
export function leanTo(u: number) { const l = N()?.lean; if (l) l.u = clamp(u, 0, 1); }
/** The wheel: a notch wider (+1) or narrower (-1); two notches close together creak. */
export function leanNotch(dir: number) {
  const n = N(), l = n.lean;
  if (!l) return;
  const was = l.slit;
  l.slit = clamp(l.slit + dir * T.LEAN_NOTCH, T.LEAN_SLIT[0], T.LEAN_SLIT[1]);
  if (l.slit === was) return;
  if (l.t - l.notchAt < T.LEAN_CREAK_SEC) { n.noise = Math.min(100, n.noise + T.LEAN_CREAK_NOISE); sfx.creak(); }
  l.notchAt = l.t;
}
export function leanFocus(on: boolean) { const l = N()?.lean; if (l) l.focus = on; }
/** The lean's view for the renderer. */
export function leanView(t: number) {
  const l = N().lean!;
  return { act: leanAct(), stage: leanStage(), u: l.u, slit: l.slit, focus: l.focus, mirror: leanMirror(), look: l.look, bar: l.bar, t };
}
