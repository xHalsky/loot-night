import { q4Look, q4Up } from './q4';
import { eyesBusy } from './eyes';
import { realLifeFree } from './reallife';
import { bedAt } from './week';
import { endNight } from './night';
import { rules, on } from './week';
import { T } from '../config/tuning';
import { S, N, type VisitKind } from '../core/state';
import { chance, pick, weighted, rand } from '../core/rng';
import { addMood, moodZone } from './meters';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');   // feed tag (#49)
import { sfx, ambience } from '../ui/audio';
import { PEEK_PASS, PEEK_CAUGHT, FAKEOUT_LINES, CHAT_QS } from '../data/content';
import { maybeLap } from './lap';
import { maxHp } from './stats';
import { updateApartment, afterVisit, sendHerSoon, hearsApartment, hearsHallway, initApartment, aptAmbience } from './apartment';
import { hasLife } from './affixes';
import { startCuddle } from './cuddle';
import { sealSteps } from './home';
import { addBuff } from './curios';
import { addGoodwill, tryForgive } from './goodwill';
import { tip } from './tips';
import { coach } from './coach';

// Her visits (docs/design/her.md). Her movements between visits come from apartment.ts.
// Each visit type asks for a different answer:
//   Peek:   she checks the screen. Excel + Looks busy 60.
//   Snack:  she brings food and never looks at the screen; she checks the desk for Monster cans.
//   Chat:   she checks the screen, wants the headset off, then asks 3 things while you stay on Excel.
//   Cuddle: no check. She asks you to come over; yes = a cuddle minigame, "one sec" = a sulk.
const FAR = T.TELEGRAPH_SEC.far - T.TELEGRAPH_SEC.hall;
const HALL = T.TELEGRAPH_SEC.hall - T.TELEGRAPH_SEC.handle;
const HANDLE = T.TELEGRAPH_SEC.handle;
let stepTimer = 0, cueTimer = 0;

export function initVisits() {
  const v = N().visit;
  v.stage = 'idle'; v.checked = false; v.result = ''; v.kind = 'peek'; v.chat = null;
  initApartment();
  N().apt.lastVisitEnd = -(T.DOOR_MAX_GAP_SEC / rules().visits - T.VISIT_FIRST_DELAY_SEC);   // her first visit comes VISIT_FIRST_DELAY_SEC in at the latest
  // the night's first chance (the week, #56): her first visit is tonight's new type, early, and safe
  const f = rules().first;
  if (f && on(f)) { N().apt.forceKind = f as VisitKind; N().firstSafe = f; }
}

function endVisit() {
  const n = N();
  const v = n.visit;
  if (v.stage === 'in') sfx.doorClose();      // she pulls the door shut behind her
  const passed = v.stage === 'in' && v.result !== 'caught';
  v.stage = 'idle'; v.checked = false; v.chat = null;
  if (passed && on('headset') && !S.g.tipsSeen.includes('headset')) coach('headset');   // you can listen now: time to learn what the headset costs (#49)
  n.cansHidden = false;                       // you pull the cans back out
  afterVisit();
}

/** Draws the next visit type from what she was doing (T.VISIT_BIAS), so listening predicts it.
 *  VISIT_RANDOM of the time the bias is ignored and the flat table is used instead.
 *  Cuddle only while she is happy (green). Woken visits are always Peeks. */
export function pickKind(from: string, woken = false, green = moodZone(N().mood) === 'green', roll = Math.random()): VisitKind {
  if (woken) return 'peek';
  const table = roll < T.VISIT_RANDOM || !T.VISIT_BIAS[from] ? T.VISIT_FLAT : T.VISIT_BIAS[from];
  const kinds = Object.keys(table).filter(k => on(k) && (k !== 'cuddle' || green)) as VisitKind[];   // the week (#56): chat from Tuesday, cuddle Thursday
  if (!kinds.length) return 'peek';
  return kinds[weighted(kinds.map(k => table[k]))];
}

export function startVisit(woken = false, kind?: VisitKind) {
  const v = N().visit;
  if (v.stage !== 'idle') return;
  coach('steps');
  v.stage = 'far'; v.t = FAR; v.fake = !woken && !kind && !N().apt.forceKind && chance(T.FAKEOUT_CHANCE); v.checked = false; v.result = ''; v.chat = null;
  v.bed = false; v.looked = 0; v.gw = 0; v.esc = false;
  v.from = woken ? 'sleep' : N().apt.activity;
  v.kind = kind ?? N().apt.forceKind ?? pickKind(v.from, woken);   // a pre-emptive action can set the type
  if (!kind) N().apt.forceKind = null;
  if (v.kind === 'night') v.from = 'night';   // the hoodie outfit
  v.safe = !woken && !!N().firstSafe && v.kind === N().firstSafe; if (v.safe) N().firstSafe = '';
  v.lean = v.kind === 'peek' && !woken && !v.fake && moodZone(N().mood) === 'green' && chance(T.LEAN_CHANCE);
  if (v.kind === 'tease') {   // she wants you (#85): no footsteps, her soft call, then the doorway
    const n = N(); v.t = T.TEASE_CALL_SEC; v.fake = false; v.safe = false; v.lean = false;
    n.apt.heard = 'hallway'; n.apt.heardWhat = 'BABE?'; n.apt.heardAt = n.threat; sfx.hum();
    return;
  }
  if (v.kind === 'snack' && !v.fake && on('fuel') && hasLife('cans') && !N().cansHidden) { N().cansHidden = true; toast('Plates clinking. Your cans slide under the desk by themselves.', '#ff7ab8'); }
}
export const visitSooner = () => sendHerSoon();
export const triggerVisitNow = (kind?: VisitKind) => startVisit(false, kind);

/** Footstep tempo and the hallway cue sound per visit type. */
function telegraphSounds(dt: number) {
  const n = N();
  const v = n.visit;
  stepTimer -= dt;
  const slow = (v.kind === 'cuddle' || v.kind === 'night') && v.stage !== 'passing';
  if (stepTimer <= 0) {
    stepTimer = slow ? 0.8 : 0.45;
    const loud = (v.stage === 'hall' ? 0.7 : v.stage === 'passing' ? 0.25 : 0.35) * (slow ? 0.6 : 1);
    sfx.step(loud * sealSteps());   // the door seal muffles her steps too
    if (n.headset && hasLife('earplugs')) sfx.stepClear(loud);   // Earplugs of Peace: the steps come through the headset
    if (hearsHallway()) { n.apt.heard = 'hallway'; n.apt.heardWhat = 'STEPS'; n.apt.heardAt = n.threat; }
  }
  if (v.stage !== 'hall' && v.stage !== 'far') return;
  cueTimer -= dt;
  if (cueTimer <= 0 && !v.fake) {
    cueTimer = v.kind === 'chat' ? 1.1 : 0.9;
    if (v.kind === 'snack') sfx.plates();
    if (v.kind === 'chat') sfx.hum();
  }
}

export function updateVisits(dt: number) {
  const n = N();
  const v = n.visit;
  n.scare = Math.max(0, n.scare - dt);
  const amb = aptAmbience();
  ambience(amb?.cue ?? null, amb?.room, amb?.level);   // her TV, kettle or shower, while she is at it
  if (n.lap) return;                 // she is leaning in: the apartment waits
  if (v.stage === 'idle') {
    const tz = teaseDue(dt);   // her tease, or come to bed (#85, #89): one demand at a time, like the rest of her
    if (tz) { startVisit(false, 'tease'); if (tz === 'bed') { v.bed = true; v.from = 'night'; n.apt.asleep = false; n.apt.wake = 0; n.apt.heardWhat = 'BABE?'; } return; }
    const r = updateApartment(dt);
    if (r) startVisit(r === 'wake');
    return;
  }
  if (v.kind === 'tease') { updateTease(dt); return; }
  if (v.stage === 'far' || v.stage === 'hall' || v.stage === 'passing') telegraphSounds(dt);
  if (v.stage === 'in' && n.game?.kind === 'cuddle') return;     // you are cuddling: the visit waits for it
  // looking busy (#55, 4.5): she watches you work in Excel; busy, she leaves sooner; idle, she waits and asks
  const look = v.stage === 'in' && v.checked && v.result === 'pass' && q4Up() ? q4Look() : 1;
  if (look !== 1 || v.stage !== 'in') n.q4.asked = look === 0;
  v.t -= dt * look;
  if (v.stage === 'in') { updateIn(dt); if (v.t > 0) return; }
  if (v.t > 0) return;
  switch (v.stage) {
    case 'far':
      if (v.fake) { v.stage = 'passing'; v.t = 2; } else { v.stage = 'hall'; v.t = HALL; }
      break;
    case 'passing': if (hearsApartment()) toast(pick(FAKEOUT_LINES), '#a999bd'); endVisit(); break;
    case 'hall': v.stage = 'handle'; v.t = HANDLE; sfx.handle(); break;
    case 'handle': v.stage = 'in'; v.t = T.VISIT_IN_SEC; v.checked = false; sfx.door(); coach('door'); break;
    case 'in': leave(); break;
  }
}

/** What happens while she stands in the doorway. */
function updateIn(dt: number) {
  const n = N();
  const v = n.visit;
  if (!v.checked) {
    v.checked = true;
    if (n.seal) { addMood(T.SEAL_SEEN_MOOD); toast(`"Why is your door sealed? What are you doing in there?" Mood +${T.SEAL_SEEN_MOOD}.`, '#ffb07a'); }
    if (n.pre?.away) { emptyChair(); return; }
    if (v.lean) lookOnly();
    else if (v.kind === 'snack') snackArrive();
    else if (v.kind === 'cuddle') { v.result = 'ask'; v.t = T.CUDDLE_ASK_SEC; sfx.kiss(); }
    else if (v.kind === 'night') walkBy();
    else check();
    return;
  }
  // Switching back to the game while she still watches (Peek, Chat) gets you caught.
  if ((v.result === 'pass' || v.result === 'chat') && n.monitor === 'rpg' && n.monitorOff <= 0) { v.result = 'caught'; v.chat = null; v.t = T.VISIT_IN_SEC; caught(); return; }
  if (v.result === 'chat' && v.chat) {
    const c = v.chat;
    c.t -= dt;
    if (c.t <= 0) chatAnswer(1, true);          // silence counts as "meh"
    v.t = Math.max(v.t, 1);
  }
}

/** Leaves the doorway; timeouts of open prompts resolve here. */
function leave() {
  const n = N();
  const v = n.visit;
  if (v.result === 'offer') { addMood(T.SNACK_IGNORE_MOOD); toast('"Fine. More for me." She takes the plate back.', '#ffb07a'); }
  if (v.result === 'ask') { cuddleAnswer(false); return; }
  if ((v.result === 'pass' || v.result === 'chatGood') && maybeLap()) { afterVisit(); v.stage = 'idle'; v.checked = false; n.cansHidden = false; return; }
  endVisit();
}

/** Is a tease due now (#85), or "come to bed" (#89)? Her odds run while she is up and real life is free, x3 at the
 *  worst moments (a boss wind-up, a legendary on the floor). Come to bed: once, after 01:00, from her bed. */
function teaseDue(dt: number): 'tease' | 'bed' | null {
  const n = N(), tz = n.tease, a = n.apt;
  if (!realLifeFree(true) || S.g.realLifeOff) return null;   // one demand at a time, but a boss wind-up is fair game
  if (on('comeToBed') && !tz.bedDone && a.asleep && n.clock >= Math.max(tz.bedAt, T.BEDTIME)) { tz.bedDone = true; return 'bed'; }
  if (!on('tease') || tz.left <= 0 || a.asleep || a.activity === 'shower' || a.moving > 0 || n.clock >= bedAt()) return null;
  const hot = n.enemies.some(e => (e.wind ?? 0) > 0 && e.hp > 0) || n.floorLoot.some(l => l.entry.kind === 'item' && l.entry.item.rarity === 'legendary');
  if (n.threat < tz.next - (hot ? T.TEASE_HOT_EARLY_SEC : 0)) return null;   // due, or early for the worst moment
  tz.left--; tz.next = n.threat + rand(...T.TEASE_GAP_SEC);
  return 'tease';
}

/** The tease in your doorway (#85): look at her (the pointer on the webcam, the game on screen) and Goodwill fills; 3 s
 *  of looking and she's happy. Ignored, she asks once more, then leaves pouting. Never a catch: she knows you're
 *  gaming. Come to bed (#89) is the same, stronger, and Coming, babe ends the night. */
function updateTease(dt: number) {
  const n = N(), v = n.visit;
  v.t -= dt;
  if (v.stage === 'far') { if (v.t <= 0) { v.stage = 'in'; v.t = T.TEASE_SEC; v.checked = true; sfx.door(); } return; }
  if (v.stage !== 'in') { endTease(); return; }
  if (v.result) { if (v.t <= 0) endTease(); return; }   // kissed or pouting: she goes
  if (eyesBusy()) {
    const gw = T.TEASE_GOODWILL_PER_SEC * dt * (v.bed ? T.BED_TEASE_GOODWILL_MULT : 1);
    S.g.goodwill = Math.min(T.GOODWILL_MAX, S.g.goodwill + gw); v.gw = (v.gw ?? 0) + gw;
    v.looked = (v.looked ?? 0) + dt;
    if (v.looked >= T.TEASE_LOOK_SEC) {
      v.result = 'kissed'; v.t = 1.8; sfx.kiss();
      toast(`${v.bed ? 'She smiles, half asleep. "Don\'t be long."' : 'She blows you a kiss. "Ok. Go play."'} Goodwill +${Math.round(v.gw ?? 0)}.`, '#ff9ab8');
    }
    return;
  }
  if (v.t > 0) return;
  if (!v.esc) { v.esc = true; v.t = T.TEASE_ESCALATE_SEC; sfx.hum(); toast(v.bed ? '"Babe... come to bed."' : '"Baaabe."', '#ff9ab8'); return; }
  const m = Math.round(T.TEASE_IGNORE_MOOD * (v.bed ? T.BED_TEASE_MOOD_MULT : 1));
  addMood(m); v.result = 'pout'; v.t = 1.5;
  toast(`${v.bed ? '"Fine. Goodnight."' : '"Fine. Enjoy your elves."'} Mood +${m}.`, '#ffb07a');
}
function endTease() {
  const n = N(), bed = n.visit.bed;
  endVisit();
  if (bed) { n.apt.asleep = true; n.apt.wake = 0; }   // back to bed
}
/** Coming, babe (#89): the night ends like Sleep, in bed with her: the green morning whatever her Mood. */
export function comingBabe() {
  const v = N().visit;
  if (v.kind !== 'tease' || !v.bed || v.stage !== 'in' || v.result) return;
  endNight('sleep', true, true);
}

/** She comes in while you are out of the room: the screen speaks for you. */
function emptyChair() {
  const v = N().visit;
  if (screenPasses()) { v.result = 'pass'; toast('She finds your chair empty. Excel is open. "Hm. Working, I guess."', '#6fcf7f'); return; }
  v.result = 'caught'; toast('She finds your chair empty, and the game running.', '#ff8a80'); caught();
}

/** Outside a visit: she passes and looks at your screen (a pre-emptive backfire). */
export function screenGlance(why: string) {
  if (screenPasses()) { toast(`${why} She glances at your screen: Excel. Fine.`, '#ffb07a'); return; }
  toast(`${why} She glances at your screen.`, '#ff8a80');
  caught();
}

/** Green Mood at bedtime: she stops at your door in your gaming hoodie on her way to bed. No check. */
function walkBy() {
  const v = N().visit;
  v.result = 'night'; v.t = T.WALKBY_SEC;
  addMood(T.WALKBY_MOOD);
  toast('"Night, babe." She is wearing your gaming hoodie, sleeves past her hands. "Don\'t stay up too late."', '#ff9ab8'); sfx.kiss();
}

/** She just leans on the door frame and looks at you: no check, a little warmth. */
function lookOnly() {
  const v = N().visit;
  v.result = 'look';
  addMood(T.LEAN_MOOD);
  addGoodwill(T.GOODWILL_LEAN, 'she just wanted to look at you');
  toast(pick(['She leans on the door frame, barefoot, watching you. "Nothing. Carry on."', '"Just checking on my nerd." She smiles and stays a moment.', 'She leans in the doorway, rubbing one foot against her calf. "...Hi."']), '#ff9ab8');
}

const screenPasses = () => { const n = N(); return n.monitorOff > 0 || n.monitor === 'excel'; };   // Excel on screen = pass

/** Peek and Chat: she looks at the screen. */
function check() {
  const n = N();
  const v = n.visit;
  if (!screenPasses()) { v.result = 'caught'; caught(); return; }
  if (v.kind === 'chat') {
    if (n.headset) {
      v.result = 'deaf'; addMood(T.CHAT_HEADSET_MOOD);
      toast(`"Babe? BABE. Are you even listening?" Headset on. Mood +${T.CHAT_HEADSET_MOOD}.`, '#ff8a80'); sfx.bad();
      return;
    }
    const order = CHAT_QS.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, T.CHAT_QUESTIONS);
    v.chat = { order, asked: 0, good: 0, bad: 0, t: T.CHAT_ASK_SEC, line: `"${CHAT_QS[order[0]].q}"`, last: -1 };
    v.result = 'chat'; v.t = T.CHAT_ASK_SEC + 1;
    return;
  }
  v.result = 'pass'; tip('pass');
  addMood(T.PEEK_PASS_MOOD);
  toast(`Peek passed. ${pick(PEEK_PASS)}`, '#6fcf7f'); sfx.good();
}

// ---------- Snack run ----------
export const cansInSight = () => { const n = N(); return n.game?.kind === 'monster' || (on('fuel') && S.g.monsters > 0 && !n.cansHidden); };   // before Thursday (#56) there are no cans to find

function snackArrive() {
  const n = N();
  const v = n.visit;
  if (cansInSight() && v.safe) {   // the night's first chance (#56): she only points at them
    v.safe = false;
    toast('"Are those cans? Hide them when you hear me coming." She lets it go. Once.', '#ff9ab8');
  } else if (cansInSight()) {
    v.result = 'snackFail';
    addMood(T.SNACK_FAIL_MOOD);
    if (S.g.monsters > 0) S.g.monsters--;
    toast(`"Another one?! I am taking this." She confiscates a can. Mood +${T.SNACK_FAIL_MOOD}.`, '#ff8a80'); sfx.bad();
    return;
  }
  v.result = 'offer'; v.t = T.SNACK_TAKE_SEC;
  toast('"Made you a plate. Eat something, babe." Take the plate!', '#ff9ab8');
}

export function takePlate() {
  const n = N();
  const v = n.visit;
  if (v.stage !== 'in' || v.result !== 'offer') return;
  v.result = 'snackOk'; v.t = 1.4;
  addMood(T.SNACK_PASS_MOOD);
  S.g.heroes.forEach(h => { if (!h.downed) h.hp = Math.min(maxHp(h), h.hp + Math.round(maxHp(h) * T.SNACK_HEAL)); });
  toast(`Sandwich! Party healed ${Math.round(T.SNACK_HEAL * 100)}%. "Eat, nerd."`, '#6fcf7f'); sfx.heal();
}

/** Click the Monster cans during a visit's footsteps: shove them under the desk. */
export function hideCans() {
  const n = N();
  if (n.visit.stage === 'idle' || n.cansHidden) return false;
  n.cansHidden = true; sfx.click();
  return true;
}

// ---------- Chat ----------
/** kind: 0 good, 1 meh, 2 bad. */
export function chatAnswer(kind: number, timeout = false) {
  const n = N();
  const v = n.visit;
  const c = v.chat;
  if (!c || v.result !== 'chat') return;
  c.last = kind;
  if (kind === 0) { c.good++; sfx.good(); }
  else if (kind === 2) { c.bad++; sfx.bad(); }
  else if (!timeout) sfx.click();
  c.asked++;
  if (c.asked >= T.CHAT_QUESTIONS || c.bad >= 2) {
    v.chat = null; v.t = 1.6;
    if (c.good >= 2) { v.result = 'chatGood'; addMood(T.CHAT_PASS_MOOD); toast(`Nice talk. "Okay, back to your spreadsheets, cutie." Mood ${T.CHAT_PASS_MOOD}.`, '#6fcf7f'); addGoodwill(T.GOODWILL_CHAT, 'good chat'); }
    else if (c.bad >= 2) { v.result = 'chatBad'; addMood(T.CHAT_BAD_MOOD); toast(`"Wow. Okay." She leaves. Mood +${T.CHAT_BAD_MOOD}.`, '#ff8a80'); }
    else { v.result = 'chatMeh'; addMood(T.CHAT_MEH_MOOD); toast('"Mhm. Talk later."', '#ffb07a'); }
    return;
  }
  c.t = T.CHAT_ASK_SEC; c.line = `"${CHAT_QS[c.order[c.asked]].q}"`;
  v.t = T.CHAT_ASK_SEC + 1;
}

// ---------- Cuddle ----------
export function cuddleAnswer(yes: boolean) {
  const n = N();
  const v = n.visit;
  if (v.stage !== 'in' || v.result !== 'ask') return;
  if (yes) { v.result = 'cuddling'; startCuddle(); return; }
  v.result = 'refused'; v.t = 1.6;
  addMood(T.CUDDLE_REFUSE_MOOD);
  toast(`"One sec, babe." She sighs and leaves. Mood +${T.CUDDLE_REFUSE_MOOD}.`, '#ff8a80'); sfx.bad();
}
/** Called by the cuddle minigame when it ends. */
export function cuddleDone(score: number | null) {
  const v = N().visit;
  if (v.stage !== 'in') return;
  v.t = 1.6;
  if (score === null) { v.result = 'refused'; addMood(T.CUDDLE_REFUSE_MOOD); toast(`You pulled away for the game. Mood +${T.CUDDLE_REFUSE_MOOD}.`, '#ff8a80'); return; }
  if (score >= T.CUDDLE_PASS) {
    v.result = 'cuddleGood'; addMood(T.CUDDLE_PASS_MOOD); toast(`Warm. "Okay, go play, I love you." Mood ${T.CUDDLE_PASS_MOOD}.`, '#ff9ab8'); sfx.kiss();
    addGoodwill(T.GOODWILL_CUDDLE, 'cuddle');
    addBuff({ name: 'Loved', dmg: T.ECHO_LOVED_DMG, speed: 0, crit: T.ECHO_LOVED_CRIT, t: 1, max: 1, icon: 'loved', fights: 1 });   // echo: life feeds the RPG
    toast(`Loved: party +${Math.round(T.ECHO_LOVED_DMG * 100)}% damage, +${T.ECHO_LOVED_CRIT}% crit for the next fight.`, '#ff9ab8');
  }
  else { v.result = 'cuddleMeh'; addMood(T.CUDDLE_FAIL_MOOD); toast(`"You are so restless." Mood +${T.CUDDLE_FAIL_MOOD}.`, '#ffb07a'); }
}

function caught() {
  const n = N();
  if (n.visit.safe) {   // the night's first chance (#56): she lets it go, once
    n.visit.safe = false; n.visit.result = 'forgiven'; n.visit.chat = null; n.visit.t = 1.8;
    toast('She sees the game. "Raid night? Fine. Just this once." First time: she lets it go.', '#ff9ab8'); sfx.kiss(); tip('caught');
    return;
  }
  if (hasLife('excuses') && !n.excused) {   // of Infinite Excuses: once a night she buys it
    n.excused = true; n.visit.result = 'pass';
    addMood(T.AFFIX_EXCUSE_MOOD);
    toast(`"It's a team-building exercise, for work." She squints. She buys it. Once. Mood +${T.AFFIX_EXCUSE_MOOD}.`, '#ff7ab8'); sfx.good();
    return;
  }
  tip('caught');
  if (tryForgive()) {   // Goodwill 60+: once a night she lets it go (and leaves: no second look)
    n.visit.result = 'forgiven'; n.visit.chat = null; n.visit.t = 1.8;
    toast(`She sees the game. Sighs. "I know, I know. Raid night." Forgiven (Goodwill -${T.GOODWILL_FORGIVE}).`, '#ff9ab8'); sfx.kiss();
    return;
  }
  n.everCaught = true;
  n.catches++;
  addGoodwill(T.GOODWILL_CATCH, 'caught');
  n.scare = T.SCARE_SEC;
  sfx.sting();
  const step = Math.min(n.catches, 3);
  toast(`CAUGHT! ${pick(PEEK_CAUGHT)}`, '#ff8a80');
  addMood(T.CATCH_MOOD[step - 1]);
  n.guilt = T.GUILT_SEC; toast(`Guilt: party -${Math.round(T.GUILT_DMG * 100)}% damage for ${T.GUILT_SEC} s.`, '#ff8a80');   // every rung (echo)
  if (step === 1) { n.flow = T.FLOW_MIN; toast('Warning: Flow reset.', '#ff8a80'); }
  if (step === 3) { n.monitorOff = T.MONITOR_OFF_SEC; n.flow = T.FLOW_MIN; toast('She turned the monitor off!', '#ff8a80'); }
}
