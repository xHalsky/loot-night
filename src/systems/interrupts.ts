import { T } from '../config/tuning';
import { S, N, type InterruptKind, type PhoneGame } from '../core/state';
import { rand, randi, pick } from '../core/rng';
import { addMood } from './meters';
import { visitSooner } from './visits';
import { replyText } from './apartment';
import { maxHp } from './stats';
import { toast } from '../core/fx';
import { sfx } from '../ui/audio';
import { MOM_LINES, MOM_REPLIES } from '../data/content';

export const BOSS_MSGS = ['you there?', 'quick question', 'need the Q4 totals for the deck', 'asap pls', 'hello??'];
export const HER_MSGS = ['are you coming to bed?', 'babe', 'its really late', 'hello??'];

// One phone on the desk. Mom calls (slide to answer), the boss and the girlfriend
// message (hold the phone to your face to unlock). One notification at a time.

export function scheduleInterrupt(first = false) {
  const n = N();
  n.nextInterruptAt = n.threat + (first ? T.INTERRUPT_FIRST_DELAY_SEC : rand(...T.INTERRUPT_INTERVAL_SEC));
}

export const phoneBusy = () => { const n = N(); return n.interrupts.length > 0 || n.game?.kind === 'phone'; };
const timerMult = () => (N().tired >= T.TIRED_SLUGGISH ? T.SLUGGISH_TIMER_MULT : 1);

export function spawnInterrupt(kind?: InterruptKind) {
  const n = N();
  if (phoneBusy()) return false;
  const quiet = n.threat < n.bossQuiet;   // you answered him recently
  const kinds: InterruptKind[] = (n.clock >= T.BED_FROM ? ['boss'] : ['mom', 'boss']).filter(k => !(k === 'boss' && quiet)) as InterruptKind[];   // Mom sleeps after midnight
  if (!kinds.length && !kind) return false;
  const k = kind ?? pick(kinds);
  const max = (k === 'mom' ? T.MOM_TIMER : k === 'boss' ? T.BOSS_TIMER : T.TEXT_TIMER) * timerMult();
  // messages come in bursts of 1-3 (each one buzzes once); the boss may follow up mid-way
  const pend: number[] = [];
  if (k !== 'mom') {
    const a = randi(1, 3); for (let i = 0; i < a; i++) pend.push(i * 0.8);
    if (k === 'boss' && Math.random() < 0.7) { const b = randi(1, 2); for (let i = 0; i < b; i++) pend.push(max * 0.5 + i * 0.8); }
  }
  n.interrupts.push({ kind: k, t: max, max, msgs: [], pend, pingAt: -9 });
  if (k === 'mom') sfx.vibCall();
  return true;
}

export function updateInterrupts(dt: number) {
  const n = N();
  if (n.threat >= n.nextInterruptAt) { spawnInterrupt(); scheduleInterrupt(); }
  if (n.momCallback && n.threat >= n.momCallback && !phoneBusy() && n.clock < T.BED_FROM) { n.momCallback = 0; spawnInterrupt('mom'); }
  if (n.bossCallback && n.threat >= n.bossCallback && !phoneBusy()) { n.bossCallback = 0; spawnInterrupt('boss'); }
  updateDeclines(dt);
  for (const i of n.interrupts) i.t -= dt;
  const expired = n.interrupts.filter(i => i.t <= 0);
  n.interrupts = n.interrupts.filter(i => i.t > 0);
  expired.forEach(i => fail(i.kind, n.phoneDown > 0 && i.kind !== 'mom' ? 'unseen' : 'ignored'));
  // the phone keeps vibrating: calls every 1.4 s, messages every 3 s (same rhythm as the shake on the desk)
  for (const i of n.interrupts) {
    const e = i.max - i.t;
    if (i.kind === 'mom') { if (Math.floor(e / 1.4) !== Math.floor((e - dt) / 1.4)) sfx.vibCall(); continue; }
    while (i.pend.length && e >= i.pend[0]) {
      i.pend.shift(); i.pingAt = e;
      const pool = i.kind === 'boss' ? BOSS_MSGS : HER_MSGS;
      i.msgs.push(pool[Math.min(i.msgs.length, pool.length - 1)]);
      sfx.vibMsg();
    }
  }

  const g = n.game;
  if (!g || g.kind !== 'phone') return;
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
  if (!n.interrupts.length) { n.preMenu = n.preMenu === 'phone' ? null : 'phone'; sfx.click(); return; }   // idle phone: its pre-emptive actions
  const it = n.interrupts.shift();
  if (!it) return;
  n.action = 'miniGame';
  sfx.click();
  const g: PhoneGame = {
    kind: 'phone', app: it.kind, stage: it.kind === 'mom' ? 'ringing' : 'locked',
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

/** Slide to answer (Mom). Called when the drag ends. */
export function answerSlide(progress: number) {
  const g = N().game;
  if (!g || g.kind !== 'phone' || g.stage !== 'ringing') return;
  if (progress < 0.9) { g.drag = 0; return; }
  sfx.good();
  g.stage = 'call'; g.t = 0; g.drag = 0; g.feedback = 'Reply when the marker is inside the box.';
  nextMomBeat(g, false);
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
  if (success) succeed(g.app); else fail(g.app, g.stage === 'ringing' ? 'declined' : 'failed');
}

function succeed(kind: InterruptKind) {
  const n = N();
  if (kind === 'mom') {
    S.g.heroes.forEach(h => { if (!h.downed) h.hp = maxHp(h); });
    toast('Mom: "Love you, eat something!" Party fully healed.', '#6fcf7f'); sfx.heal();
  } else if (kind === 'boss') {
    S.g.gold += T.BOSS_GOLD; n.bossQuiet = n.threat + T.BOSS_QUIET_SEC;
    toast(`Report fixed. Overtime bonus +${T.BOSS_GOLD} gold, and he leaves you alone for a while.`, '#6fcf7f'); sfx.good();
  } else replyText(true);
}

function fail(kind: InterruptKind, how: string) {
  const n = N();
  if (how === 'unseen') {   // the phone was face-down: you honestly did not see it
    if (kind === 'text') { n.apt.wake = Math.min(T.WAKE_UP, n.apt.wake + T.TEXT_FLIP_WAKE); n.apt.textSent = false; addMood(T.TEXT_FLIP_MOOD); toast('Her text went unseen (phone face-down).', '#ffb07a'); }
    else { addMood(Math.round(T.BOSS_FAIL_MOOD / 2)); toast(`Boss ping unseen (phone face-down). Mood +${Math.round(T.BOSS_FAIL_MOOD / 2)}.`, '#ffb07a'); }
    return;
  }
  if (kind === 'text') { replyText(false); return; }
  if (kind === 'mom') {
    addMood(T.MOM_FAIL_MOOD); visitSooner();
    toast(`Mom call ${how}. She called your girlfriend. Mood +${T.MOM_FAIL_MOOD}.`, '#ff8a80');
  } else {
    addMood(T.BOSS_FAIL_MOOD);
    toast(`Boss ping ${how}. Mood +${T.BOSS_FAIL_MOOD}.`, '#ff8a80');
  }
  sfx.bad();
}

// ---------- Declining without picking up (docs/design/desk.md) ----------
// A call: hold the red Decline button (slower than ignoring, much faster than talking to Mom).
// A message: drag the phone down to flip it face-down. It stays face-down for a while: new notifications only buzz.

export function setDeclineHold(on: boolean) {
  const n = N();
  n.declineHold = on && n.interrupts[0]?.kind === 'mom' && !n.game;
}

/** Swipe the desk phone over. Face-down: a waiting message is dismissed (cheaper than ignoring it),
 *  later messages only buzz and cost half if they run out unseen. Mom's call keeps ringing. */
export function togglePhoneDown() {
  const n = N();
  if (n.game?.kind === 'phone') return;
  sfx.flip();
  if (n.phoneDown > 0) { n.phoneDown = 0; return; }
  n.phoneDown = 1;
  const it = n.interrupts[0];
  if (it && it.kind !== 'mom') {
    n.interrupts.shift();
    if (it.kind === 'boss') { n.bossCallback = n.threat + rand(...T.BOSS_FLIP_FOLLOWUP_SEC); toast('Phone face-down. The boss can wait. He will ping again soon.', '#ffb07a'); }
    else {
      const a = n.apt; a.wake = Math.min(T.WAKE_UP, a.wake + T.TEXT_FLIP_WAKE); a.textSent = false; addMood(T.TEXT_FLIP_MOOD);
      toast(`Phone face-down. She saw "delivered", no reply. Mood +${T.TEXT_FLIP_MOOD}.`, '#ffb07a');
    }
  }
}

function updateDeclines(dt: number) {
  const n = N();
  if (n.declineHold && n.interrupts[0]?.kind === 'mom' && n.phoneDown <= 0) {
    n.decline += dt / T.DECLINE_SEC;
    if (n.decline >= 1) {
      n.interrupts.shift(); n.decline = 0; n.declineHold = false;
      addMood(T.MOM_DECLINE_MOOD);
      n.momCallback = n.threat + rand(...T.MOM_CALLBACK_SEC);
      toast(`Declined. Mom texts: "CALL ME BACK!!" She will try again. Mood +${T.MOM_DECLINE_MOOD}.`, '#ffb07a'); sfx.click();
    }
  } else n.decline = Math.max(0, n.decline - dt * 2);
}

/** Tap the red button on the ringing desk phone: the call is declined at once. */
export function declineCall() {
  const n = N();
  if (n.interrupts[0]?.kind !== 'mom' || n.game) return;
  n.interrupts.shift(); n.decline = 0;
  addMood(T.MOM_DECLINE_MOOD);
  n.momCallback = n.threat + rand(...T.MOM_CALLBACK_SEC);
  toast(`Declined. Mom texts: "CALL ME BACK!!" She will try again. Mood +${T.MOM_DECLINE_MOOD}.`, '#ffb07a'); sfx.click();
}
