import { T } from '../config/tuning';
import { maybeSelfie } from './selfies';
import { wearing } from './wardrobe';
import { rules, bedAt, on, isNewTonight } from './week';
import { S, N, type ActivityId, type Room } from '../core/state';
import { ACTIVITIES, ACT_BY_ID, ROOM_DISTANCE, wet } from '../data/apartment';
import { askFree, startAsk } from './asks';
import { rand, weighted, chance, clamp } from '../core/rng';
import { moodZone, addMood } from './meters';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');   // feed tag (#49)
import { sfx, setHeadset, ambienceFor } from '../ui/audio';
import { spawnInterrupt } from './interrupts';
import { hasLife } from './affixes';
import { sealNoise, sealPace, sealSteps } from './home';
import { ROOM_ACTIVITY } from '../data/home';
import { addGoodwill } from './goodwill';
import { tip } from './tips';

// Where she is between visits (docs/design/her.md, FNAF layer).
// You track her by sound; the headset muffles it (and costs your Zone to take off); after midnight she sleeps.

export function initApartment() {
  const n = N();
  n.apt = { room: 'living', activity: 'tv', t: rand(...ACT_BY_ID.tv.dur), moving: 0, soundT: 1,
    heard: 'living', heardWhat: 'TV', heardAt: 0, showerUsed: false, lastVisitEnd: 0, forceDoor: false,
    asleep: false, wake: 0, textSent: false, cued: false, calm: 0, forceKind: null };
  n.apt.dur = n.apt.t;
  // lean in's first chance (#77, week one 2b): the night it comes in she starts with yoga in the living room, where the
  // lean reaches (stop 3), and no visit comes while that first yoga lasts
  if (isNewTonight('lean')) { const a = n.apt; a.activity = 'yoga'; a.t = a.dur = rand(...ACT_BY_ID.yoga.dur); a.heardWhat = 'VIDEO'; a.calm = a.t; a.calmHard = true; }
}

/** Called by visits.ts when she leaves your door or walks past it. */
export function afterVisit() {
  const a = N().apt;
  a.lastVisitEnd = N().threat;
  if (N().clock >= bedAt()) { goToBed(T.WAKE_AFTER_VISIT); return; }
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
  if (first) tip('bed');
}

function pickActivity() {
  const n = N();
  const a = n.apt;
  let id: ActivityId;
  const bath = on('bath');   // the weekend: her shower is a bath (#88)
  if (!a.showerUsed && n.clock >= T.SHOWER_FROM && n.clock < bedAt() && chance(bath ? T.BATH_CHANCE : T.SHOWER_CHANCE)) {
    id = bath ? 'bath' : 'shower'; a.showerUsed = true; if (!n.headset && !bath) tip('shower');
  }
  else if (on('mask') && !a.maskUsed && n.clock >= bedAt() - T.MASK_BEFORE_BED_MIN && n.clock < bedAt()) { id = 'mask'; a.maskUsed = true; }   // getting ready for bed (#77)
  else {
    const w = (x: typeof ACTIVITIES[number]) => x.id === 'yoga' ? (on('lean') ? 1 : 0) : x.weight;   // yoga from Tuesday (lean in, #77)
    const pool = ACTIVITIES.filter(x => w(x) > 0 && x.id !== a.activity);
    id = pool[weighted(pool.map(w))].id;
  }
  a.activity = id; a.room = ACT_BY_ID[id].room; a.t = a.dur = rand(...ACT_BY_ID[id].dur);
  a.moving = T.APT_MOVE_SEC; a.soundT = 0.5; a.cued = false;
  // her requests from the bathroom (#93, #88), decided as she goes in; the door ajar for her bath music
  a.ajar = id === 'bath' && chance(T.BATH_DOOR_AJAR);
  a.towelAsk = wet(id) && on('towelReq') && chance(T.TOWEL_CHANCE);
  a.wineAt = id === 'bath' && on('wine') && chance(T.WINE_CHANCE) ? a.t - rand(...T.WINE_AT_SEC) : -1;
}

/** How much of your Noise reaches her, by room and what she is doing (never shown). Asleep: not used. */
export function hearing(): number {
  const a = N().apt;
  const room = a.moving > 0 ? 'hallway' : a.room;
  const ajar = a.activity === 'bath' && a.ajar && a.moving <= 0 ? T.BATH_AJAR_HEAR : 1;   // the bath's door ajar for her music
  return T.HEAR_DISTANCE[ROOM_DISTANCE[room]] * (a.moving > 0 ? 1 : T.HEAR_MASK[a.activity] ?? 1) * ajar * sealNoise();
}
export const heardNoise = () => N().noise * hearing();

/** Her continuous sound right now (TV, kettle, shower) and how loud: null while she moves, visits or sleeps.
 *  The loop stops at the end cue, which takes over (credits, the kettle clicking off, the hair dryer). */
export function aptAmbience(): { cue: string; room: Room; level: number } | null {
  const n = N();
  const a = n.apt;
  if (!n || n.visit.stage !== 'idle' || n.lap || n.pre?.withHer || a.asleep || a.moving > 0 || a.cued) return null;
  const cue = ambienceFor(a.activity);
  if (!cue) return null;
  const level = a.activity === 'tea' ? clamp(1.1 - a.t / 20, 0.5, 1) : a.activity === 'bath' ? (a.ajar ? 1 : 0.55) : 1;   // the kettle gets louder towards the boil; her bath music through the door, or ajar
  return { cue, room: a.room, level };
}

/** Returns true when she decides to come to your door (visits.ts starts the telegraph). */
export function updateApartment(dt: number): 'door' | 'wake' | null {
  const n = N();
  const a = n.apt;
  a.calm = Math.max(0, a.calm - dt);
  if (a.calm <= 0) a.calmHard = false;
  if (a.calm > 0 && !a.calmHard && !a.asleep && heardNoise() > T.PRE_CALM_BREAK_NOISE) { a.calm = 0; a.forceDoor = true; hear(a.room, 'HUH?'); }   // too loud: the calm is over
  if (n.pre?.withHer || n.herAsk) return null;   // you're bringing her something, or she waits for it: her routine waits (#93, #88)
  if (a.moving > 0) {
    a.moving -= dt;
    a.soundT -= dt;
    if (a.soundT <= 0) { a.soundT = 0.5; sfx.step(0.15 * sealSteps()); hear('hallway', 'STEPS', hearsHallway()); }
    if (a.moving <= 0) { a.soundT = 0.3; sfx.aptStart(a.activity, a.room); }
    return null;
  }
  const act = ACT_BY_ID[a.activity];
  a.soundT -= dt;
  if (a.soundT <= 0) {
    a.soundT = act.id === 'shower' ? 1.5 : act.id === 'sleep' ? 3 : 2.5;   // the bath's music: 2.5
    if (act.sound) { sfx.aptTick(act.id, a.room); hear(act.room, act.sound); }
  }

  if (a.asleep) return updateSleep(dt);

  // High Noise makes her wrap up whatever she is doing (except the shower).
  // the door seal: she gets up less often; the week's visits (#56): she gets through her things faster (not the shower)
  a.t -= dt * (heardNoise() > T.NOISE_HURRY ? 2 : 1) * sealPace() * (wet(a.activity) ? 1 : rules().visits);
  // from the bathroom: "Babe, bring my wine?" partway into her bath, "Babe, towel!" as she gets out (#88, #93)
  if (a.activity === 'bath' && (a.wineAt ?? -1) >= 0 && a.t <= a.wineAt! && askFree()) { a.wineAt = -1; startAsk('wine'); return null; }
  if (wet(a.activity) && a.towelAsk && a.t <= T.END_CUE_SEC) { a.towelAsk = false; if (askFree()) { startAsk('towel'); return null; } }
  if (!a.cued && a.t <= T.END_CUE_SEC && act.end) {      // the tell: this activity is ending, she is about to move
    a.cued = true; sfx.endCue(act.id, a.room); hear(act.room, act.end); if (!n.headset) tip('endcue');
  }
  // how often she comes is the week's (#56): x1 Monday to x1.6 Sunday; the gaps shrink and her odds grow with it
  const gap = n.threat - a.lastVisitEnd, vm = rules().visits, minGap = T.DOOR_MIN_GAP_SEC / vm, maxGap = T.DOOR_MAX_GAP_SEC / vm;
  if (a.t > 0 && !(a.forceDoor && gap >= minGap)) return null;
  if (n.clock >= bedAt()) {
    if (!n.walkby && moodZone(n.mood) === 'green') { n.walkby = true; a.forceKind = 'night'; a.room = 'hallway'; return 'door'; }   // good night, in your hoodie
    goToBed(); return null;
  }
  if (a.calm > 0 && !a.forceDoor) { pickActivity(); return null; }   // a pre-emptive action bought some quiet
  let p = (T.DOOR_BASE_CHANCE + Math.min(100, heardNoise()) * T.DOOR_NOISE_CHANCE + (moodZone(n.mood) === 'red' ? T.DOOR_RED_CHANCE : 0)) * vm;
  if (n.tired >= T.TIRED_WRECKED) p += 0.15;
  if (gap > maxGap || a.forceDoor) p = 1;
  if (gap < minGap) p = 0;          // even a forced visit waits for the minimum gap
  if (chance(p)) { a.forceDoor = false; a.room = 'hallway'; return 'door'; }
  pickActivity();
  return null;
}

/** Asleep: Noise above the floor wakes her. First a text, then she gets up. */
function updateSleep(dt: number): 'wake' | null {
  const n = N();
  const a = n.apt;
  const owl = hasLife('owl') ? 1 - T.AFFIX_OWL : 1;   // of Slumber
  a.wake = clamp(a.wake + Math.max(0, n.noise * sealNoise() - T.WAKE_NOISE_FLOOR) * T.WAKE_RATE * owl * (wearing('pjset') ? T.GIFT_PJ_WAKE : 1) * dt - T.WAKE_DECAY * dt, 0, T.WAKE_UP);
  if (a.wake >= T.WAKE_TEXT && !a.textSent) {
    if (spawnInterrupt('text')) {
      a.textSent = true;
      const photo = on('selfies') && maybeSelfie();   // her photo with it (#92)
      toast(photo ? '[Phone] Babe sent a photo. "are you coming to bed?"' : '[Phone] Babe: "are you coming to bed?"', '#b98cff');
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
    toast('[Phone] You: "Five more minutes, love." She dozes off.', '#6fcf7f'); sfx.good();
    addGoodwill(T.GOODWILL_TEXT, 'answered her text');
  } else {
    a.wake = clamp(a.wake + T.TEXT_IGNORE_WAKE, 0, T.WAKE_UP); addMood(T.TEXT_IGNORE_MOOD);
    a.textSent = false;
    toast('You left her on read. She is wide awake now.', '#ff8a80'); sfx.bad();
  }
}

/** A device sent her (the Home app, #57): she walks to that room, sees to it for a moment, then back to her things. */
export function sendHerTo(room: Room, what: string, sec = T.CHECK_SEC) {
  const a = N().apt;
  a.room = room; a.activity = ROOM_ACTIVITY[room]; a.t = a.dur = sec + T.APT_MOVE_SEC; a.moving = T.APT_MOVE_SEC; a.cued = false; a.soundT = 0.3;
  hear(room, what);
}

/** Mom's failed call: she gets a call and heads your way soon. */
export function sendHerSoon() { const a = N().apt; if (a.asleep) return; a.forceDoor = true; a.t = Math.min(a.t, 3); }

export function toggleHeadset() {
  const n = N();
  n.headset = !n.headset;
  if (n.headset) { tip('headset'); if (!S.g.tipsSeen.includes('coach:headset')) S.g.tipsSeen.push('coach:headset'); }   // found it alone: no coach mark (#49)
  if (!n.headset && n.zone > 0) toast('[You] Headset off: Zone lost.', '#ff9a4d');
  setHeadset(n.headset);
  sfx.click();
}

