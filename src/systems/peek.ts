import { T } from '../config/tuning';
import { N } from '../core/state';
import { rand } from '../core/rng';
import { addMood } from './meters';
import { toast } from '../core/fx';
import { sfx } from '../ui/audio';

// Peeking through your door (design doc section 5). Hold the door: it opens a crack and the light gives a hint
// of where she is; the map shows a vague blob only while you peek. If she is somewhere she can see your door
// (hallway, living room), she may notice and come straight over: mood up, Flow reset.

export function setPeeking(on: boolean) {
  const n = N();
  if (on && !n.peeking && n.visit.stage !== 'in') { n.peekOff = [rand(-16, 16), rand(-8, 8)]; sfx.creak(); }
  n.peeking = on && n.visit.stage !== 'in';
}

function seenRate(): number {
  const n = N();
  const v = n.visit.stage;
  if (v === 'hall' || v === 'handle') return 50;
  if (v === 'far' || v === 'passing') return T.PEEK_SEEN.hallway;
  if (v === 'in') return 0;
  const a = n.apt;
  if (a.asleep) return 0;
  if (a.moving > 0 || a.room === 'hallway') return T.PEEK_SEEN.hallway;
  if (a.room === 'living') return a.activity === 'tv' ? T.PEEK_SEEN.tv : T.PEEK_SEEN.living;
  return 0;
}

export function updatePeek(dt: number) {
  const n = N();
  const target = n.peeking ? 1 : 0;
  n.peek += Math.sign(target - n.peek) * Math.min(Math.abs(target - n.peek), dt / T.PEEK_OPEN_SEC);
  if (n.peek > 0.5) n.peekReveal = Math.min(1, n.peekReveal + dt / T.PEEK_REVEAL_SEC);
  else n.peekReveal = Math.max(0, n.peekReveal - dt / T.PEEK_FORGET_SEC);
  if (n.peek > 0.3) n.peekSus += seenRate() * dt * n.peek;
  else n.peekSus = Math.max(0, n.peekSus - dt * 0.4);
  if (n.peekSus >= 1) spotted();
}

function spotted() {
  const n = N();
  const v = n.visit;
  n.peekSus = 0; n.peeking = false;
  addMood(T.PEEK_CAUGHT_MOOD);
  n.flow = T.FLOW_MIN;
  toast(`She saw you peeking. "What are you doing?!" Mood +${T.PEEK_CAUGHT_MOOD}, Flow reset. She is coming.`, '#ff8a80');
  sfx.sting();
  // She rushes over: straight to the hallway stage, short.
  if (v.stage === 'idle' || v.stage === 'far' || v.stage === 'passing') {
    if (v.stage === 'idle') { v.from = n.apt.activity; n.apt.room = 'hallway'; n.apt.asleep = false; }
    v.stage = 'hall'; v.t = 1.2; v.fake = false; v.checked = false; v.result = '';
  } else if (v.stage === 'hall') v.t = Math.min(v.t, 0.4);
}
