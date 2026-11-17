import { T } from '../config/tuning';
import { N } from '../core/state';
import { addMood } from './meters';
import { toast } from '../core/fx';
import { sfx } from '../ui/audio';

// Peeking through your door (docs/design/her.md). Hold the door: it opens to a narrow crack, then creeps wider;
// the crack shows the hallway and her tells in the doorways (door.ts). If she is somewhere she can see your door
// (hallway, living room), she may notice and come straight over: mood up, Flow reset. Wider = easier to notice.

export function setPeeking(on: boolean) {
  const n = N();
  if (on && !n.peeking && n.visit.stage !== 'in') sfx.creak();
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
  const narrow = T.PEEK_CRACK_MIN / T.PEEK_CRACK_MAX;
  if (!n.peeking) n.peek = Math.max(0, n.peek - dt / T.PEEK_OPEN_SEC);                      // let go: it closes
  else if (n.peek < narrow) n.peek = Math.min(narrow, n.peek + dt * narrow / T.PEEK_OPEN_SEC);   // quickly to a crack
  else n.peek = Math.min(1, n.peek + dt * (1 - narrow) / T.PEEK_CREEP_SEC);                 // then it creeps wider
  if (n.peek > 0.1) n.peekSus += seenRate() * dt * n.peek;
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
