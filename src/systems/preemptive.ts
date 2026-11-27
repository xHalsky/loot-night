import { T } from '../config/tuning';
import { askLanded, askIgnored } from './asks';
import { wet } from '../data/apartment';
import { on, bedAt } from './week';
import { S, N } from '../core/state';
import { PRE_BY_ID, HER_REPLIES, SUSPICIOUS_LINES, type PreId } from '../data/preemptive';
import { pick, rand, clamp } from '../core/rng';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { addMood } from './meters';
import { herSay, boysLog } from './messages';
import { phoneDead, battery, charged } from './home';
import { boysSay } from './boys';

// Pre-emptive actions (docs/design/preemptive.md, #19). Used BEFORE a visit to shape it: push her next visit
// (apartment calm), set the next visit's type, or lower Mood. Where she is decides whether it works, and that
// is read when you start the action (you go to her, or text her, now).
// While busy, n.action = 'pre': skills say "Hands busy" and the party is on the reckless autopilot.

/** Why an action can't start right now ('' = it can). These are about you, never about where she is. */
export function preBlocked(id: PreId): string {
  const n = N();
  if (!on(id === 'charge' ? 'home' : 'messages')) return 'Not tonight';   // the week (#56): the views leave it out
  if (n.pre) return 'Busy';
  if (n.visit.stage !== 'idle' && n.visit.stage !== 'passing') return 'Too late, she is coming';
  if (n.game || n.lap || n.unplugged || n.switching) return 'Hands full';
  if ((id === 'text' || id === 'raid') && n.phoneDown > 0) return 'The phone is face-down';
  if ((id === 'text' || id === 'raid') && phoneDead()) return 'The phone is dead';
  if (id === 'charge' && battery() >= 100) return 'Full';
  if (id === 'raid' && S.g.goodwill < T.GOODWILL_RAID) return `Needs ${T.GOODWILL_RAID} Goodwill (${Math.floor(S.g.goodwill)})`;
  if (id === 'raid' && (n.clock >= bedAt() || n.apt.asleep)) return 'She is in bed';
  return '';
}

/** Uses tonight → how strong this use is: 1, PRE_SECOND_MULT, or 0 (suspicious). Toggles always 1. */
export function nextMult(id: PreId): number {
  const used = N().preUses[id] ?? 0;
  if (PRE_BY_ID[id].toggle || PRE_BY_ID[id].goodwill) return 1;
  return used + 1 >= T.PRE_SUSPICIOUS_AT ? 0 : used >= 1 ? T.PRE_SECOND_MULT : 1;
}

export function startPre(id: PreId) {
  const n = N();
  if (preBlocked(id)) return;
  const def = PRE_BY_ID[id];
  const mult = nextMult(id);
  n.preUses[id] = (n.preUses[id] ?? 0) + 1;
  n.preMenu = null;
  const a = n.apt;
  // Where she is right now decides the outcome.
  const moving = a.moving > 0 || a.room === 'hallway';
  const outcome = id === 'text' ? (a.asleep ? 'asleep' : moving ? 'moving' : wet(a.activity) ? 'shower' : 'ok') : 'ok';
  const sec = id === 'charge' ? T.CHARGE_SEC : T.PRE_TEXT_SEC;
  n.pre = { id, stage: 'doing', t: sec, max: sec, away: !!def.away, withHer: false, mult, outcome };
  n.action = 'pre';
  sfx.click();
  if (id === 'charge') toast('You plug the phone in by the bed. The party is on its own.', '#9fe08a');
}

/** Every frame (real seconds: you are doing it, the battle speed doesn't matter). */
export function updatePre(dt: number) {
  const n = N();
  if (n.herReply) {
    if (n.herReply.wait > 0) { n.herReply.wait -= dt; if (n.herReply.wait <= 0) { sfx.ping(); herSay('l', n.herReply.msg); } }   // into her chat
    else if ((n.herReply.t -= dt) <= 0) n.herReply = null;
  }
  const p = n.pre;
  if (!p) return;
  p.t -= dt;
  if (p.t > 0) return;
  if (p.id === 'towel' || p.id === 'wine') { askLanded(p.id); return; }   // you're back from the bathroom door (#93, #88)
  land(p.id as PreId);
}

/** The action is done: its effect (or backfire) lands. */
function land(id: PreId) {
  const n = N();
  const p = n.pre!;
  const a = n.apt;
  if (id === 'charge') { finishPre(); charged(); return; }
  if (p.mult === 0 && !PRE_BY_ID[id].toggle && !PRE_BY_ID[id].goodwill) {   // the 3rd time: she gets suspicious
    finishPre(); a.forceKind = 'peek'; addMood(T.PRE_SUSPICIOUS_MOOD);
    toast(`${pick(SUSPICIOUS_LINES)} Her next visit is a check. Mood +${T.PRE_SUSPICIOUS_MOOD}.`, '#ff8a80'); sfx.bad();
    return;
  }
  if (id === 'text') {
    finishPre(); herSay('r', 'what are you up to? ♥');
    if (p.outcome === 'asleep') { a.wake = clamp(a.wake + T.PRE_TEXT_WAKE, 0, T.WAKE_UP); toast('Your text buzzes on her nightstand. She stirs.', '#ff8a80'); return; }
    if (p.outcome === 'moving') { a.forceKind = 'chat'; a.forceDoor = true; a.t = Math.min(a.t, T.PRE_TEXT_SOON); reply('moving'); return; }
    if (p.outcome === 'shower') { a.forceKind = 'chat'; a.forceDoor = true; reply(a.activity === 'bath' ? 'bath' : 'shower'); return; }
    a.calm += T.PRE_TEXT_CALM * p.mult; addMood(T.PRE_TEXT_MOOD * p.mult);   // pushes her next visit: adds up
    reply(a.activity);
    return;
  }
  // the raid pass: paid with Goodwill, the strongest calm, and noise does not end it
  finishPre(); boysLog([['r', 'raid night? need a carry'], ['l', 'Billy: SAY LESS']]);
  if (S.g.goodwill < T.GOODWILL_RAID || a.asleep) { toast('"Not tonight."', '#ffb07a'); return; }
  S.g.goodwill -= T.GOODWILL_RAID;
  if (n.clock > 23 * 60) boysSay('raidLate');   // the boys' chat (#109): the raid is at 11
  a.calm = Math.max(a.calm, T.RAID_CALM_SEC); a.calmHard = true;
  n.herReply = { msg: 'ok go raid, nerd \u2665 i\'ll watch my show', t: T.PRE_REPLY_SHOW, wait: 1.5 };
  toast(`Raid pass: no visits for ${T.RAID_CALM_SEC} s. Get loud. (Goodwill -${T.GOODWILL_RAID})`, '#ff9ab8'); sfx.good();
}

/** Back to the desk early (the ✕): no effect, the use still counts. */
export function cancelPre() {
  const p = N().pre;
  if (!p) return;
  toast('You stop and get back to the desk.', '#a999bd');
  finishPre();
  if (p.id === 'towel' || p.id === 'wine') askIgnored(p.id);   // back without it: she gets it herself
}

function finishPre() { const n = N(); n.pre = null; if (n.action === 'pre') n.action = 'none'; }

function reply(kind: string) {
  const n = N();
  n.herReply = { msg: pick(HER_REPLIES[kind] ?? HER_REPLIES.tv), t: T.PRE_REPLY_SHOW, wait: rand(...T.PRE_REPLY_SEC) };
}

// ---- Effects other systems read ----
export const isOutOfRoom = () => !!N().pre?.away;
export { S };
