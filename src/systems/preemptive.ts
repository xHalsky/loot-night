import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { PRE_BY_ID, HER_REPLIES, SUSPICIOUS_LINES, type PreId } from '../data/preemptive';
import { pick, rand, clamp } from '../core/rng';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { addMood } from './meters';
import { screenGlance } from './visits';

// Pre-emptive actions (docs/design/preemptive.md, #19). Used BEFORE a visit to shape it: push her next visit
// (apartment calm), set the next visit's type, or lower Mood. Where she is decides whether it works, and that
// is read when you start the action (you go to her, or text her, now).
// While busy, n.action = 'pre': skills say "Hands busy" and the party is on the reckless autopilot.

/** Why an action can't start right now ('' = it can). These are about you, never about where she is. */
export function preBlocked(id: PreId): string {
  const n = N();
  if (n.pre) return 'Busy';
  if (n.visit.stage !== 'idle' && n.visit.stage !== 'passing') return 'Too late, she is coming';
  if (n.game || n.lap || n.unplugged || n.switching) return 'Hands full';
  if ((id === 'text' || id === 'raid') && n.phoneDown > 0) return 'The phone is face-down';
  if (id === 'raid' && S.g.goodwill < T.GOODWILL_RAID) return `Needs ${T.GOODWILL_RAID} Goodwill (${Math.floor(S.g.goodwill)})`;
  if (id === 'raid' && (n.clock >= T.BED_FROM || n.apt.asleep)) return 'She is in bed';
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
  let outcome = 'ok';
  if (id === 'text') outcome = a.asleep ? 'asleep' : moving ? 'moving' : a.activity === 'shower' ? 'shower' : 'ok';
  if (id === 'tea') outcome = a.asleep ? 'asleep' : moving ? 'hallway' : a.room === 'kitchen' ? 'kitchen' : a.room === 'bathroom' ? 'cold' : 'ok';
  const sec = id === 'text' || id === 'raid' ? T.PRE_TEXT_SEC : id === 'tea' ? T.PRE_TEA_SEC + (outcome === 'kitchen' ? T.PRE_TEA_HUG_SEC : 0) : T.PRE_TOWEL_SEC;
  n.pre = { id, stage: 'doing', t: sec, max: sec, away: !!def.away, withHer: id === 'tea' && outcome === 'ok' && mult > 0, mult, outcome };
  n.action = 'pre';
  sfx.click();
  if (id === 'tea') {
    if (outcome === 'hallway') screenGlance('On your way to the kitchen you pass her in the hallway.');
    if (outcome === 'kitchen') { addMood(T.PRE_TEA_HUG_MOOD); toast('She is already in the kitchen. "You? Making tea?" She hugs you and won\'t let go.', '#ff9ab8'); }
    else toast('You get up to make her tea. The party is on its own.', '#ff9ab8');
  }
  if (id === 'towel') toast(n.towel ? 'You pull the towel away from the door.' : 'You roll up a towel and push it under the door.', '#c9b8a8');
}

/** Every frame (real seconds: you are doing it, the battle speed doesn't matter). */
export function updatePre(dt: number) {
  const n = N();
  if (n.herReply) {
    if (n.herReply.wait > 0) { n.herReply.wait -= dt; if (n.herReply.wait <= 0) sfx.ping(); }
    else if ((n.herReply.t -= dt) <= 0) n.herReply = null;
  }
  const p = n.pre;
  if (!p) return;
  p.t -= dt;
  if (p.t > 0) return;
  if (p.stage === 'ask') return episodeAnswer(false);   // no answer = "no"
  if (p.stage === 'episode') { finishPre(); n.apt.calm = Math.max(n.apt.calm, T.PRE_EPISODE_CALM * p.mult); toast('The credits roll. She kisses you. "Go on, play."', '#ff9ab8'); return; }
  land(p.id as PreId);
}

/** The action is done: its effect (or backfire) lands. */
function land(id: PreId) {
  const n = N();
  const p = n.pre!;
  const a = n.apt;
  if (p.mult === 0 && !PRE_BY_ID[id].toggle && !PRE_BY_ID[id].goodwill) {   // the 3rd time: she gets suspicious
    finishPre(); a.forceKind = 'peek'; addMood(T.PRE_SUSPICIOUS_MOOD);
    toast(`${pick(SUSPICIOUS_LINES)} Her next visit is a check. Mood +${T.PRE_SUSPICIOUS_MOOD}.`, '#ff8a80'); sfx.bad();
    return;
  }
  if (id === 'text') {
    finishPre();
    if (p.outcome === 'asleep') { a.wake = clamp(a.wake + T.PRE_TEXT_WAKE, 0, T.WAKE_UP); toast('Your text buzzes on her nightstand. She stirs.', '#ff8a80'); return; }
    if (p.outcome === 'moving') { a.forceKind = 'chat'; a.forceDoor = true; a.t = Math.min(a.t, T.PRE_TEXT_SOON); reply('moving'); return; }
    if (p.outcome === 'shower') { a.forceKind = 'chat'; a.forceDoor = true; reply('shower'); return; }
    a.calm += T.PRE_TEXT_CALM * p.mult; addMood(T.PRE_TEXT_MOOD * p.mult);   // pushes her next visit: adds up
    reply(a.activity);
    return;
  }
  if (id === 'tea') {
    if (p.outcome === 'ok') {
      addMood(T.PRE_TEA_MOOD * p.mult);
      if (a.activity === 'tv') { p.stage = 'ask'; p.t = p.max = T.PRE_EPISODE_ASK_SEC; toast('"Ooh, thank you. Stay for one episode?"', '#ff9ab8'); sfx.kiss(); return; }
      a.calm = Math.max(a.calm, T.PRE_TEA_CALM * p.mult);
      toast('She takes the tea and smiles. She will be busy for a while.', '#ff9ab8');
    } else if (p.outcome === 'cold') { addMood(T.PRE_TEA_COLD_MOOD); toast('She is in the bathroom. You leave the tea on the table. It goes cold.', '#ffb07a'); }
    else if (p.outcome === 'asleep') toast('She is asleep. You drink the tea yourself.', '#a999bd');
    else if (p.outcome === 'kitchen') toast('She finally lets go. The tea is somewhere.', '#ffb07a');
    else toast('You bring the tea back to your own desk. Hm.', '#a999bd');
    finishPre();
    return;
  }
  if (id === 'raid') {   // paid with Goodwill: the strongest calm, and noise does not end it
    finishPre();
    if (S.g.goodwill < T.GOODWILL_RAID || a.asleep) { toast('"Not tonight."', '#ffb07a'); return; }
    S.g.goodwill -= T.GOODWILL_RAID;
    a.calm = Math.max(a.calm, T.RAID_CALM_SEC); a.calmHard = true;
    n.herReply = { msg: 'ok go raid, nerd \u2665 i\'ll watch my show', t: T.PRE_REPLY_SHOW, wait: 1.5 };
    toast(`Raid pass: no visits for ${T.RAID_CALM_SEC} s. Get loud. (Goodwill -${T.GOODWILL_RAID})`, '#ff9ab8'); sfx.good();
    return;
  }
  if (id === 'towel') { n.towel = !n.towel; finishPre(); toast(n.towel ? 'Towel in. Quieter, but you can\'t see under the door.' : 'Towel out. You can see under the door again.', '#c9b8a8'); }
}

/** Her answer to "stay for one episode?" is yours: yes = longer away, longer calm; no = Mood up, half the calm. */
export function episodeAnswer(yes: boolean) {
  const n = N();
  const p = n.pre;
  if (!p || p.stage !== 'ask') return;
  if (yes) { p.stage = 'episode'; p.t = p.max = T.PRE_EPISODE_SEC; toast('You sit down next to her. One episode. Your party is on its own.', '#ff9ab8'); sfx.kiss(); return; }
  addMood(T.PRE_EPISODE_DECLINE_MOOD);
  n.apt.calm = Math.max(n.apt.calm, T.PRE_TEA_CALM * p.mult * 0.5);
  toast(`"Oh. Okay." Mood +${T.PRE_EPISODE_DECLINE_MOOD}.`, '#ffb07a');
  finishPre();
}

/** Back to the desk early (the ✕): no effect, the use still counts. */
export function cancelPre() {
  const n = N();
  const p = n.pre;
  if (!p) return;
  if (p.stage === 'ask') return episodeAnswer(false);
  if (p.stage === 'episode') { addMood(T.PRE_EPISODE_DECLINE_MOOD); toast(`You get up halfway through. "Seriously?" Mood +${T.PRE_EPISODE_DECLINE_MOOD}.`, '#ff8a80'); }
  else toast('You stop and get back to the desk.', '#a999bd');
  finishPre();
}

function finishPre() { const n = N(); n.pre = null; if (n.action === 'pre') n.action = 'none'; }

function reply(kind: string) {
  const n = N();
  n.herReply = { msg: pick(HER_REPLIES[kind] ?? HER_REPLIES.tv), t: T.PRE_REPLY_SHOW, wait: rand(...T.PRE_REPLY_SEC) };
}

// ---- Effects other systems read ----
/** The towel: your Noise reaches her this much (apartment.hearing, waking). */
export const towelNoise = () => (N().towel ? 1 - T.PRE_TOWEL_NOISE : 1);
/** The towel: her activity timers run this fast (she gets up less often). */
export const towelPace = () => (N().towel ? 1 - T.PRE_TOWEL_SLOW : 1);
/** The towel: her steps are this loud. */
export const towelSteps = () => (N().towel ? T.PRE_TOWEL_STEPS : 1);
export const isOutOfRoom = () => !!N().pre?.away;
export { S };
