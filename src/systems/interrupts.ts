import { T } from '../config/tuning';
import { rules, on, bedAt } from './week';
import { S, N, isCall, type InterruptKind, type PhoneGame } from '../core/state';
import { rand, randi, pick } from '../core/rng';
import { addMood } from './meters';
import { visitSooner } from './visits';
import { replyText } from './apartment';
import { maxHp } from './stats';
import { toastAs } from '../core/fx';
const toast = toastAs('PHONE');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { MOM_LINES, MOM_REPLIES, COURIER_TALKS, FRIENDS_TALKS, type TalkStep } from '../data/content';
import { PRE_BY_ID, type PreId } from '../data/preemptive';
import { addBuff } from './curios';
import { coach } from './coach';
import { realLifeFree } from './reallife';
import { herSay, boysLog, herRead } from './messages';
import { phoneDead, drain } from './home';

export const BOSS_MSGS = ['you there?', 'quick question', 'need the Q4 totals for the deck', 'asap pls', 'hello??'];
export const HER_MSGS = ['are you coming to bed?', 'babe', 'its really late', 'hello??'];

// One phone on the desk (#54, 3.2): fewer events, each worth taking. A night script instead of a random timer: the
// courier once (20:30 to 21:30), Mom once around 21:00 (she calls back once if you decline), the boss's texts once
// around 22:00, the boys 1 or 2 times during the floor before a boss floor, her texts after midnight. Only calls buzz;
// texts wait silently on the lock screen. Every event takes about 5 s and 1 or 2 taps. Calls: speaker (hands free,
// Noise) or pick up (hands busy). Face-down is Do Not Disturb. Nothing starts unless real life is free (reallife.ts).

/** Tonight's script, made at 20:00: a minute in each kind's window. */
export function planPhone() {
  const n = N();
  n.phoneScript = !on('phone') ? [] : Object.entries(T.PHONE_SCRIPT).map(([kind, [a, b]]) => ({ kind: kind as InterruptKind, at: Math.round(rand(a, b)), done: false })).sort((x, y) => x.at - y.at);
  n.friendsLeft = on('friends') ? rules().friends : 0; n.friendsFloor = 0;   // the week (#56): the phone rings from Wednesday, the boys from Thursday
  n.lastDemand = 0;
}
/** The boys call during the floor before a boss floor, once a floor. */
const friendsDue = () => { const n = N(); return n.friendsLeft > 0 && n.location === 'dungeon' && n.floor % T.CHECKPOINT_EVERY === T.CHECKPOINT_EVERY - 1 && n.friendsFloor !== n.floor && n.phase !== 'mapChoice'; };

/** The phone is taken: something is on it, or it is in your hand (a call or chat, the Messages list, sending a text). */
export const phoneBusy = () => { const n = N(); return n.interrupts.length > 0 || n.game?.kind === 'phone' || n.preMenu === 'phone' || phoneAction(); };
/** A phone action under way (texting her, asking the boys to raid): it plays out in the phone in your hand (#63). */
export const phoneAction = () => { const p = N().pre; return !!p && PRE_BY_ID[p.id as PreId]?.where === 'phone'; };
const timerMult = () => (N().tired >= T.TIRED_SLUGGISH ? T.SLUGGISH_TIMER_MULT : 1);

/** A phone event lands on the desk. Her text (she is awake and wondering) only waits for the phone to be free; every
 *  other one waits for real life to be free too. */
export function spawnInterrupt(k: InterruptKind, force = false) {
  const n = N();
  if (phoneDead()) return false;   // nothing reaches a dead phone (#57)
  if (phoneBusy() || (k !== 'text' && !force && !realLifeFree())) return false;
  const base = { mom: T.MOM_TIMER, boss: T.TEXT_DEADLINE_SEC, text: T.TEXT_DEADLINE_SEC, courier: T.COURIER_TIMER, friends: T.FRIENDS_TIMER }[k];
  const max = base * (isCall(k) ? timerMult() : 1);
  // messages come in bursts of 1-3 (each one buzzes once); the boss may follow up mid-way
  const pend: number[] = [];
  if (!isCall(k)) {
    const a = randi(1, 3); for (let i = 0; i < a; i++) pend.push(i * 0.8);
    if (k === 'boss' && Math.random() < 0.7) { const b = randi(1, 2); for (let i = 0; i < b; i++) pend.push(max * 0.5 + i * 0.8); }
  }
  n.interrupts.push({ kind: k, t: max, max, msgs: [], pend, pingAt: -9 });
  if (isCall(k) && n.phoneDown <= 0) sfx.vibCall();   // only calls buzz; face-down (Do Not Disturb): nothing does
  coach('phone');
  return true;
}

export function updateInterrupts(dt: number) {
  const n = N();
  if (phoneDead()) {   // dead (#57): what was on it and what comes due counts as ignored; the boys call Discord, Mom calls Babe
    for (const i of n.interrupts.splice(0)) fail(i.kind, 'ignored');
    const late = n.threat >= T.PHONE_FIRST_SEC ? n.phoneScript.find(s => !s.done && n.clock >= s.at) : undefined;
    if (late) { late.done = true; fail(late.kind, 'ignored'); }
    else if (friendsDue()) { n.friendsLeft--; n.friendsFloor = n.floor; fail('friends', 'ignored'); }
    else if (n.momCallback && n.threat >= n.momCallback) { n.momCallback = 0; fail('mom', 'ignored'); }
  }
  // the script: the first event due whose time has come; it slides later until real life is free
  const due = n.threat >= T.PHONE_FIRST_SEC ? n.phoneScript.find(s => !s.done && n.clock >= s.at) : undefined;
  if (due && spawnInterrupt(due.kind)) due.done = true;
  else if (friendsDue() && spawnInterrupt('friends')) { n.friendsLeft--; n.friendsFloor = n.floor; }
  else if (n.momCallback && n.threat >= n.momCallback && n.clock < bedAt() && spawnInterrupt('mom')) n.momCallback = 0;
  for (const i of n.interrupts) i.t -= dt;
  const expired = n.interrupts.filter(i => i.t <= 0);
  n.interrupts = n.interrupts.filter(i => i.t > 0);
  expired.forEach(i => { if (i.kind === 'text') i.msgs.forEach(m => herSay('l', m)); fail(i.kind, 'ignored'); });   // her texts stay in her chat   // face-down too: Do Not Disturb, and a missed event is ignored
  // the phone keeps vibrating: calls every 1.4 s, messages every 3 s (same rhythm as the shake on the desk)
  for (const i of n.interrupts) {
    const e = i.max - i.t;
    if (isCall(i.kind)) { if (n.phoneDown <= 0 && Math.floor(e / 1.4) !== Math.floor((e - dt) / 1.4)) sfx.vibCall(); continue; }
    while (i.pend.length && e >= i.pend[0]) {
      i.pend.shift(); i.pingAt = e;
      const pool = i.kind === 'boss' ? BOSS_MSGS : HER_MSGS;
      i.msgs.push(pool[Math.min(i.msgs.length, pool.length - 1)]);   // silent: texts only light the lock screen
    }
  }

  const g = n.game;
  if (!g || g.kind !== 'phone') return;
  if (g.speaker && !n.headset && (g.stage === 'talk' || g.stage === 'call')) n.noise = Math.min(100, n.noise + T.SPEAKER_NOISE * dt);   // on speaker: she may hear
  if (g.stage === 'locked' && g.holding) {
    g.unlock += dt / T.FACE_UNLOCK_SEC;
    if (g.unlock >= 1) { sfx.good(); g.stage = 'chat'; g.t = g.app === 'boss' ? T.BOSS_WINDOW_SEC : T.TEXT_CHAT_SEC; g.max = g.t; g.feedback = ''; }
  } else if (g.stage === 'locked' && !g.holding) g.unlock = Math.max(0, g.unlock - dt * 2);
  if (g.stage === 'call' && g.read > 0) g.read = Math.max(0, g.read - dt);
  else if (g.stage === 'call') {
    g.sweep += dt / T.MOM_SWEEP_SEC;
    if (g.sweep > 1) { g.misses++; g.feedback = 'Too slow. She keeps talking.'; sfx.bad(); nextMomBeat(g, false); }
    if (g.misses >= T.MOM_MAX_MISSES) { closeGame(false); return; }
  }
  if (g.t > 0) { g.t -= dt; if (g.t <= 0) closeGame(false); }
}

function nextMomBeat(g: PhoneGame, advance: boolean) {
  if (advance) g.beat++;
  const line = pick(MOM_LINES);
  g.line = line.text; g.need = line.need; g.sweep = 0; g.zone = rand(0.3, 0.65); g.read = 0;   // the marker starts right away
}

export function openPhone() {
  const n = N();
  if (n.game || n.phoneDown > 0) return;
  if (!n.interrupts.length) {   // the idle phone: up into your hand at the home screen (V8: Messages, later the Shop and Home)
    n.preMenu = n.preMenu === 'phone' ? null : 'phone'; n.phApp = 'home'; n.phScroll = 0; n.phUp = performance.now(); sfx.click(); return;
  }
  const it = n.interrupts.shift();
  if (!it) return;
  drain(T.BATTERY_ANSWER);   // every call or text you answer (#57)
  n.action = 'miniGame';   // picked up: hands busy (speaker gives them back)
  n.phUp = performance.now();
  sfx.click();
  const g: PhoneGame = {
    kind: 'phone', app: it.kind, stage: isCall(it.kind) ? 'ringing' : 'locked',
    t: it.t, max: it.max, unlock: 0, holding: false, drag: 0,
    beat: 0, misses: 0, sweep: 0, zone: 0.5, need: 0, line: '', read: 0, row: 0, rows: [], feedback: '',
    msgs: it.msgs.length ? [...it.msgs] : [(it.kind === 'boss' ? BOSS_MSGS : HER_MSGS)[0]],
  };
  if (it.kind === 'boss') {
    g.rows = Array.from({ length: T.BOSS_ROWS }, () => {
      const a = randi(2, 9), b = randi(2, 9), sum = a + b;
      const options = [sum, sum + pick([3, 4, 5]), Math.max(1, sum - pick([2, 3, 4]))].sort(() => Math.random() - 0.5);
      return { a, b, options };
    });
  }
  n.game = g;
}

/** Speaker (#54, 3.2): answer a call without holding the phone. Your hands stay free (keep playing, skills still
 *  cast) but the call is loud while it lasts (Noise, none with the headset on). From the desk or from your hand. */
export function answerSpeaker() {
  const n = N();
  if (!n.game && n.interrupts[0] && isCall(n.interrupts[0].kind)) openPhone();
  const g = n.game;
  if (!g || g.kind !== 'phone' || g.stage !== 'ringing') return;
  g.speaker = true; n.action = 'none';
  answerSlide(1);
}
/** Slide to answer (Mom). Called when the drag ends. */
export function answerSlide(progress: number) {
  const g = N().game;
  if (!g || g.kind !== 'phone' || g.stage !== 'ringing') return;
  if (progress < 0.9) { g.drag = 0; return; }
  sfx.good();
  if (g.app === 'courier' || g.app === 'friends') { startTalk(g); return; }
  g.stage = 'call'; g.t = 0; g.drag = 0; g.feedback = '';   // the phone says it: tap the reply in the zone
  nextMomBeat(g, false);
}

// ---------- Courier and the boys: a two-step dialogue (#23) ----------
const talkSteps = (g: PhoneGame): TalkStep[] => (g.app === 'courier' ? COURIER_TALKS : FRIENDS_TALKS)[g.talk ?? 0];
function startTalk(g: PhoneGame) {
  g.stage = 'talk'; g.talk = randi(0, (g.app === 'courier' ? COURIER_TALKS : FRIENDS_TALKS).length - 1);
  g.t = g.max = g.app === 'courier' ? T.COURIER_TALK_SEC : T.FRIENDS_TALK_SEC;
  g.beat = 0; g.misses = 0; g.feedback = g.speaker && !N().headset ? 'On speaker!' : '';
  talkStep(g);
}
function talkStep(g: PhoneGame) {
  const st = talkSteps(g)[g.beat];
  g.line = st.line;
  if (g.app === 'friends') (g.log ??= []).push(['l', st.line.replace(/"/g, '')]);   // for The Boys' chat
  g.opts = [st.right, ...st.wrong].sort(() => Math.random() - 0.5);
  g.need = g.opts.indexOf(st.right) as 0 | 1 | 2;
}
/** A reply in the courier / friends dialogue. */
export function talkPick(i: number) {
  const n = N();
  const g = n.game;
  if (!g || g.kind !== 'phone' || g.stage !== 'talk') return;
  if (g.app === 'friends' && g.opts?.[i]) (g.log ??= []).push(['r', g.opts[i]]);
  if (i === g.need) {
    sfx.good(); g.beat++;
    if (g.beat >= talkSteps(g).length) { closeGame(true); return; }
    talkStep(g); g.feedback = '';
    return;
  }
  sfx.bad();
  if (g.app === 'courier') { g.feedback = `"${g.opts?.[i]}"?`; closeGame(false); return; }   // he gives up
  g.misses++; n.noise = Math.min(100, n.noise + (n.headset || !g.speaker ? 0 : T.FRIENDS_RUDE_NOISE));
  g.feedback = 'Rude. They get louder.';
  if (g.misses >= T.FRIENDS_MAX_MISSES) { closeGame(false); return; }
  talkStep(g);
}

export function setPhoneHold(on: boolean) {
  const g = N().game;
  if (g && g.kind === 'phone') g.holding = on;
}

export function momReply(i: number) {
  const g = N().game;
  if (!g || g.kind !== 'phone' || g.stage !== 'call' || g.read > 0) return;
  const inZone = g.sweep >= g.zone && g.sweep <= g.zone + T.MOM_ZONE;
  if (inZone && i === g.need) {
    sfx.good(); g.feedback = `"${MOM_REPLIES[i]}" Good.`;
    if (g.beat + 1 >= T.MOM_BEATS) { closeGame(true); return; }
    nextMomBeat(g, true);
  } else {
    sfx.bad(); g.misses++;
    g.feedback = inZone ? `Wrong reply. "${MOM_REPLIES[i]}"?!` : 'Off the beat. She noticed.';
    if (g.misses >= T.MOM_MAX_MISSES) closeGame(false); else nextMomBeat(g, false);
  }
}

export function bossPick(v: number) {
  const g = N().game;
  if (!g || g.kind !== 'phone' || g.stage !== 'chat' || g.app !== 'boss') return;
  const r = g.rows[g.row];
  if (v === r.a + r.b) {
    sfx.key(); g.row++; g.feedback = '';
    if (g.row >= g.rows.length) closeGame(true);
  } else { sfx.bad(); g.t -= 2; g.feedback = 'Wrong total. -2 s'; }
}

export function textReply() {
  const g = N().game;
  if (!g || g.kind !== 'phone' || g.app !== 'text' || g.stage !== 'chat') return;
  closeGame(true);
}

export function closeGame(success: boolean) {
  const n = N();
  const g = n.game;
  if (!g || g.kind !== 'phone') return;
  n.game = null; n.action = 'none';
  // the chats keep what was said (V8): her texts and your answer; the boys' exchange and how it ended
  if (g.app === 'text') { g.msgs.forEach(m => herSay('l', m)); if (success) herSay('r', 'Five more minutes, love ♥'); herRead(); }
  if (g.app === 'friends' && g.log?.length) boysLog([...g.log, ['l', success ? 'Danny: ok np, buffing you from here' : "Mike: fine, raid's on without you"]]);
  if (success) succeed(g.app);
  else if (g.stage === 'ringing' && isCall(g.app)) declined(g.app);   // Decline on the ringing screen: Mom calls back, the others give up
  else fail(g.app, 'failed');
}

function succeed(kind: InterruptKind) {
  if (kind === 'mom') {   // a whole party back on its feet
    S.g.heroes.forEach(h => { h.downed = false; h.hp = maxHp(h); });
    toast('Mom: "Love you, eat something!" Party fully healed, the fallen get up.', '#6fcf7f'); sfx.heal();
  } else if (kind === 'boss') {   // money rule: real life pays in zł
    S.g.zl += T.BOSS_ZL;
    toast(`Report fixed. Overtime pay +${T.BOSS_ZL} zł.`, '#6fcf7f'); sfx.good();
  } else if (kind === 'courier') {
    addBuff({ name: 'Gaming mouse', dmg: 0, speed: 0, cd: T.COURIER_MOUSE_CD, t: 1, max: 1, icon: 'mouse', night: true });
    toast(`"Okay, flat 12." Your new gaming mouse: skill cooldowns -${Math.round(T.COURIER_MOUSE_CD * 100)}% until dawn.`, '#6fcf7f'); sfx.good();
  } else if (kind === 'friends') {
    addBuff({ name: 'Raid buff', dmg: T.FRIENDS_BUFF_DMG, speed: T.FRIENDS_BUFF_SPD, t: 1, max: 1, icon: 'raid', untilBoss: true });
    toast(`Danny: "ok np, buffing you from here." Raid buff: party +${Math.round(T.FRIENDS_BUFF_DMG * 100)}% damage until the boss is down.`, '#6fcf7f'); sfx.good();
  } else replyText(true);
}

function fail(kind: InterruptKind, how: string) {
  if (kind === 'text') { replyText(false); return; }
  if (kind === 'boss') { toast('The boss gave up. No overtime tonight.', '#a999bd'); return; }   // costs nothing (#54, 3.2)
  if (kind === 'courier') { toast(how === 'declined' ? 'Declined. The courier leaves a note. No parcel tonight.' : 'Missed delivery. The parcel goes back to the depot.', '#ffb07a'); return; }
  if (kind === 'friends') { friendsBlast(how); return; }
  addMood(T.MOM_FAIL_MOOD); visitSooner();
  toast(`Mom call ${how}. She called your girlfriend. Mood +${T.MOM_FAIL_MOOD}.`, '#ff8a80');
  sfx.bad();
}

/** The boys did not get a polite no: Discord on the PC rings at full volume (declined: the group chat spam pings).
 *  With the headset on it all goes into your ears. */
function friendsBlast(how: string) {
  const n = N();
  const declined = how === 'declined';
  const v = n.headset ? 0 : declined ? T.FRIENDS_DECLINE_NOISE : T.FRIENDS_FAIL_NOISE;
  n.noise = Math.min(100, n.noise + v);
  if (n.headset) toast(declined ? 'The group chat pings into your headset. Ow.' : 'Discord rings straight into your headset. Ow. At least she did not hear.', '#ffb07a');
  else toast(declined ? `Declined. They spam the group chat: ping ping ping. Noise +${v}.` : `They call Discord on the PC instead. FULL VOLUME. Noise +${v}.`, '#ff8a80');
  sfx.bad();
}

// ---------- Declining without picking up (docs/design/desk.md) ----------
// A call: hold the red Decline button (slower than ignoring, much faster than talking to Mom).
// Face-down is Do Not Disturb (#54, 3.2): swipe the phone over and everything is silent until you flip it back; the
// screen only glows out from under it. What runs out meanwhile counts as ignored (Mom calls your girlfriend).


/** Swipe the desk phone over: Do Not Disturb until you flip it back. */
export function togglePhoneDown() {
  const n = N();
  if (n.game?.kind === 'phone') return;
  sfx.flip();
  n.phoneDown = n.phoneDown > 0 ? 0 : 1;
  if (n.phoneDown) toast('Phone face-down: Do Not Disturb.', '#a999bd');
}


/** A call declined (Decline on the ringing screen): Mom calls back once, the courier leaves, the boys spam the chat. */
/** Decline on the phone lying on the desk, without picking it up. */
export function declineCall() {
  const n = N(), it = n.interrupts[0];
  if (!it || !isCall(it.kind) || n.game) return;
  n.interrupts.shift(); declined(it.kind);
}
function declined(kind: InterruptKind) {
  const n = N();
  sfx.click();
  if (kind === 'courier' || kind === 'friends') { fail(kind, 'declined'); return; }
  addMood(T.MOM_DECLINE_MOOD);
  n.momCallback = n.threat + rand(...T.MOM_CALLBACK_SEC);
  toast(`Declined. Mom texts: "CALL ME BACK!!" She will try again. Mood +${T.MOM_DECLINE_MOOD}.`, '#ffb07a');
}
