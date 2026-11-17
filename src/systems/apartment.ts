import { T } from '../config/tuning';
import { S, N, type ActivityId, type Room } from '../core/state';
import { ACTIVITIES, ACT_BY_ID, ROOM_DISTANCE } from '../data/apartment';
import { rand, weighted, chance, clamp } from '../core/rng';
import { moodZone, addMood } from './meters';
import { toast } from '../core/fx';
import { sfx, setHeadset } from '../ui/audio';
import { spawnInterrupt } from './interrupts';
import { hasLife } from './affixes';
import { towelNoise, towelPace, towelSteps } from './preemptive';
import { addGoodwill } from './goodwill';

// Where she is between visits (docs/design/her.md, FNAF layer).
// You track her by sound; the headset muffles it (and costs your Zone to take off); after midnight she sleeps.

export function initApartment() {
  const n = N();
  n.apt = { room: 'living', activity: 'tv', t: rand(...ACT_BY_ID.tv.dur), moving: 0, soundT: 1,
    heard: 'living', heardWhat: 'TV', heardAt: 0, showerUsed: false, lastVisitEnd: 0, forceDoor: false,
    asleep: false, wake: 0, textSent: false, cued: false, calm: 0, forceKind: null };
}

/** Called by visits.ts when she leaves your door or walks past it. */
export function afterVisit() {
  const a = N().apt;
  a.lastVisitEnd = N().threat;
  if (N().clock >= T.BED_FROM) { goToBed(T.WAKE_AFTER_VISIT); return; }
  pickActivity();
}

export const hearsApartment = () => !N().headset;
/** Hallway steps: also heard through the headset with Earplugs of Peace. */
export const hearsHallway = () => hearsApartment() || hasLife('earplugs');

function hear(room: Room, what: string, force = false) {
  const n = N();
  if (!force && !hearsApartment()) return;
  n.apt.heard = room; n.apt.heardWhat = what; n.apt.heardAt = n.threat;
}

function goToBed(wake = 0) {
  const n = N();
  const a = n.apt;
  const first = !a.asleep && a.activity !== 'sleep';
  a.activity = 'sleep'; a.room = 'bedroom'; a.asleep = true; a.wake = wake; a.textSent = false;
  a.t = 99999; a.moving = T.APT_MOVE_SEC; a.soundT = 1; a.cued = false;
  if (first || wake > 0) toast(first ? 'She went to bed. Keep the Noise down.' : 'She went back to bed.', '#b98cff');
}

function pickActivity() {
  const n = N();
  const a = n.apt;
  let id: ActivityId;
  if (!a.showerUsed && n.clock >= T.SHOWER_FROM && n.clock < T.BED_FROM && chance(T.SHOWER_CHANCE)) { id = 'shower'; a.showerUsed = true; }
  else {
    const pool = ACTIVITIES.filter(x => x.weight > 0 && x.id !== a.activity);
    id = pool[weighted(pool.map(x => x.weight))].id;
  }
  a.activity = id; a.room = ACT_BY_ID[id].room; a.t = rand(...ACT_BY_ID[id].dur);
  a.moving = T.APT_MOVE_SEC; a.soundT = 0.5; a.cued = false;
}

/** How much of your Noise reaches her, by room and what she is doing (never shown). Asleep: not used. */
export function hearing(): number {
  const a = N().apt;
  const room = a.moving > 0 ? 'hallway' : a.room;
  return T.HEAR_DISTANCE[ROOM_DISTANCE[room]] * (a.moving > 0 ? 1 : T.HEAR_MASK[a.activity] ?? 1) * towelNoise();
}
export const heardNoise = () => N().noise * hearing();

/** Returns true when she decides to come to your door (visits.ts starts the telegraph). */
export function updateApartment(dt: number): 'door' | 'wake' | null {
  const n = N();
  const a = n.apt;
  a.calm = Math.max(0, a.calm - dt);
  if (a.calm <= 0) a.calmHard = false;
  if (a.calm > 0 && !a.calmHard && !a.asleep && heardNoise() > T.PRE_CALM_BREAK_NOISE) { a.calm = 0; a.forceDoor = true; hear(a.room, 'HUH?'); }   // too loud: the calm is over
  if (n.pre?.withHer) return null;               // you brought her tea: she is with you, her routine waits
  if (a.moving > 0) {
    a.moving -= dt;
    a.soundT -= dt;
    if (a.soundT <= 0) { a.soundT = 0.5; sfx.step(0.15 * towelSteps()); hear('hallway', 'STEPS', hearsHallway()); }
    if (a.moving <= 0) a.soundT = 0.3;
    return null;
  }
  const act = ACT_BY_ID[a.activity];
  a.soundT -= dt;
  if (a.soundT <= 0) {
    a.soundT = act.id === 'shower' ? 1.5 : act.id === 'sleep' ? 3 : 2.5;
    if (act.sound) { sfx.apt(act.id); hear(act.room, act.sound); }
  }

  if (a.asleep) return updateSleep(dt);

  // High Noise makes her wrap up whatever she is doing (except the shower).
  a.t -= dt * (heardNoise() > 70 ? 2 : 1) * towelPace();   // the towel: she gets up less often
  if (!a.cued && a.t <= T.END_CUE_SEC && act.end) {      // the tell: this activity is ending, she is about to move
    a.cued = true; sfx.endCue(act.id); hear(act.room, act.end);
  }
  const gap = n.threat - a.lastVisitEnd;
  if (a.t > 0 && !(a.forceDoor && gap >= T.DOOR_MIN_GAP_SEC)) return null;
  if (n.clock >= T.BED_FROM) {
    if (!n.walkby && moodZone(n.mood) === 'green') { n.walkby = true; a.forceKind = 'night'; a.room = 'hallway'; return 'door'; }   // good night, in your hoodie
    goToBed(); return null;
  }
  if (a.calm > 0 && !a.forceDoor) { pickActivity(); return null; }   // a pre-emptive action bought some quiet
  let p = T.DOOR_BASE_CHANCE + Math.min(100, heardNoise()) * T.DOOR_NOISE_CHANCE + (moodZone(n.mood) === 'red' ? T.DOOR_RED_CHANCE : 0);
  if (n.tired >= T.TIRED_WRECKED) p += 0.15;
  if (gap > T.DOOR_MAX_GAP_SEC || a.forceDoor) p = 1;
  if (gap < T.DOOR_MIN_GAP_SEC) p = 0;          // even a forced visit waits for the minimum gap
  if (chance(p)) { a.forceDoor = false; a.room = 'hallway'; return 'door'; }
  pickActivity();
  return null;
}

/** Asleep: Noise above the floor wakes her. First a text, then she gets up. */
function updateSleep(dt: number): 'wake' | null {
  const n = N();
  const a = n.apt;
  const owl = hasLife('owl') ? 1 - T.AFFIX_OWL : 1;   // of the Night Owl
  a.wake = clamp(a.wake + Math.max(0, n.noise * towelNoise() - T.WAKE_NOISE_FLOOR) * T.WAKE_RATE * owl * dt - T.WAKE_DECAY * dt, 0, T.WAKE_UP);
  if (a.wake >= T.WAKE_TEXT && !a.textSent) {
    if (spawnInterrupt('text')) {
      a.textSent = true;
      toast('Text from her: "are you coming to bed?"', '#b98cff');
    }
  }
  if (a.wake >= T.WAKE_UP) {
    a.asleep = false; a.activity = 'phone'; a.room = 'hallway';
    toast('You woke her up. She is coming.', '#ff8a80');
    hear('bedroom', 'AWAKE', true);
    return 'wake';
  }
  return null;
}

/** Reply to her bedtime text (no mini-game: one click). */
export function replyText(ok: boolean) {
  const n = N();
  const a = n.apt;
  if (ok) {
    a.wake = clamp(a.wake + T.TEXT_REPLY_WAKE, 0, T.WAKE_UP); addMood(T.TEXT_REPLY_MOOD);
    toast('You: "Five more minutes, love." She dozes off.', '#6fcf7f'); sfx.good();
    addGoodwill(T.GOODWILL_TEXT, 'answered her text');
  } else {
    a.wake = clamp(a.wake + T.TEXT_IGNORE_WAKE, 0, T.WAKE_UP); addMood(T.TEXT_IGNORE_MOOD);
    a.textSent = false;
    toast('You left her on read. She is wide awake now.', '#ff8a80'); sfx.bad();
  }
}

/** Mom's failed call: she gets a call and heads your way soon. */
export function sendHerSoon() { const a = N().apt; if (a.asleep) return; a.forceDoor = true; a.t = Math.min(a.t, 3); }

export function toggleHeadset() {
  const n = N();
  n.headset = !n.headset;
  if (!n.headset && n.zone > 0) toast('Headset off: Zone lost.', '#ff9a4d');
  setHeadset(n.headset);
  sfx.click();
}

