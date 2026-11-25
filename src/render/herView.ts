// Her panel's view (V4, #69; grid doc 7b): what the renderer's her.js drawHerLive needs, read from the game. No rules
// here, only reading; the texts are the ones her DOM panel had (docs/design/her.md, screen.md).
import { S, N } from '../core/state';
import { T } from '../config/tuning';
import { moodZone } from '../systems/meters';
import { hasLife } from '../systems/affixes';
import { preBlocked, nextMult } from '../systems/preemptive';
import { PRE_ACTIONS } from '../data/preemptive';
import { END_HINT } from '../data/tips';
import { CHAT_QS, VISIT_CUE } from '../data/content';
import { ROOM_NAME } from '../data/apartment';
import { webcamSide } from '../ui/door';

type Col = 'rose' | 'lilac' | 'cyan' | 'purple' | 'pink' | 'brown' | 'crimson' | 'moss' | 'gold';
interface Pill { name: string; cost?: string; act: string; arg: string; tip?: string }

const up = (s: string) => s.toUpperCase();

function heard(): { glyph: 'note' | '?' | 'hs'; glyphCol?: Col; parts: [string, Col][] } | null {
  const n = N(), a = n.apt;
  if (n.visit.stage === 'in') return null;   // she is in the doorway: you see her, the last sound does not matter
  const ago = n.threat - a.heardAt;
  const earplugs = n.headset && a.heardWhat === 'STEPS' && ago < 3 && hasLife('earplugs');
  if (n.headset && !earplugs) return { glyph: 'hs', glyphCol: 'cyan', parts: [['Headset on. You hear nothing.', 'cyan']] };
  if (!a.heard) return { glyph: '?', parts: [['Nothing yet. Listen.', 'lilac']] };
  const when = a.heardWhat === 'ZZZ' ? '' : ` · ${ago < 1.5 ? 'now' : `${Math.floor(ago)} s ago`}`;
  const rest = ` · ${ROOM_NAME[a.heard].toLowerCase()}${when}`;
  return ago > T.APT_STALE_SEC && a.heardWhat !== 'ZZZ'
    ? { glyph: '?', parts: [[a.heardWhat, 'lilac'], [rest, 'purple']] }
    : { glyph: 'note', parts: [[a.heardWhat, 'rose'], [rest, 'lilac']] };
}

/** Her note, or a window of hers with answers, or her question with your three answers. */
function middle(hover: string) {
  const n = N(), v = n.visit;
  let label = 'her', body = n.headset ? 'In the zone. She could be anywhere.' : 'She is busy with her own thing.', tone: 'calm' | 'warn' | 'alarm' = 'calm';
  if (v.stage === 'idle' && n.apt.asleep) {   // asleep: the waking meter in her window
    return { win: { label: 'ASLEEP', labelCol: 'purple' as Col, right: n.apt.wake >= T.WAKE_TEXT ? 'stirring' : 'shh', bar: Math.min(1, n.apt.wake / 100), barCol: 'lilac' as Col,
      marks: [T.WAKE_TEXT / 100], barLabels: [[T.WAKE_TEXT / 100, 'texts you'], [1, 'gets up']] as [number, string][], barTip: 'wake' } };
  }
  if (v.stage === 'idle' && S.g.nightsPlayed === 0 && n.apt.cued && !n.headset && END_HINT[n.apt.activity]) { label = 'listen'; body = END_HINT[n.apt.activity]; tone = 'warn'; }   // first night: name the tell
  if (v.stage === 'far' && !n.headset) { label = 'footsteps'; body = 'Footsteps... is she coming?'; tone = 'warn'; }
  if (v.stage === 'hall') { label = 'at the door'; body = S.g.nightsPlayed === 0 ? VISIT_CUE[v.kind] : 'Her shadow is at the door.'; tone = 'alarm'; }
  if (v.stage === 'handle') { label = 'door'; body = 'The handle is turning!'; tone = 'alarm'; }
  if (v.stage === 'passing') { label = 'footsteps'; body = 'She walked past. Phew.'; tone = 'warn'; }
  if (v.stage === 'in') {
    label = 'she is in'; body = v.result === 'caught' ? 'Caught.' : v.result === 'look' ? '"Nothing. Just looking at you."' : v.checked ? 'She bought it.' : '"Still working, babe?"'; tone = v.result === 'caught' ? 'alarm' : 'warn';
    if (v.result === 'pass' && n.q4.asked) body = '"What are you working on?"';   // looking busy (#55): you sat idle in Excel
    const secs = `${Math.max(0, Math.ceil(v.t))} s`;
    if (v.result === 'offer') return { win: { label: 'SNACK RUN', right: secs, line: '"I made you a sandwich."', warm: true, pills: [{ name: 'Take the plate', cost: `party +${Math.round(T.SNACK_HEAL * 100)}% HP`, act: 'takePlate', arg: '0', tip: 'plate' }] as Pill[] } };
    if (v.result === 'ask') return { win: { label: 'CUDDLE', right: secs, line: '"Come cuddle for a bit?"', pills: [{ name: 'Come here', cost: `${T.CUDDLE_SEC} s with her`, act: 'cuddle', arg: '1', tip: 'cuddleYes' }, { name: 'One sec, babe', cost: 'she sighs', act: 'cuddle', arg: '0', tip: 'cuddleNo' }] as Pill[] } };
    if (v.result === 'chat' && v.chat) {
      const q = CHAT_QS[v.chat.order[v.chat.asked]];
      const order = [0, 1, 2].sort((a, b) => ((v.chat!.order[0] * 7 + a * 5 + v.chat!.asked) % 3) - ((v.chat!.order[0] * 7 + b * 5 + v.chat!.asked) % 3));
      return { chat: { label: `CHAT ${v.chat.asked + 1}/${T.CHAT_QUESTIONS}`, right: 'KEEP EXCEL UP', q: v.chat.line, a: order.map(k => ({ text: q.a[k], act: 'chatAnswer', arg: String(k) })), hover } };
    }
    if (v.result === 'snackFail') { label = 'snack'; body = '"Another one?!" She takes a can.'; tone = 'alarm'; }
    if (v.result === 'snackOk') { label = 'snack'; body = 'Sandwich. She ruffles your hair.'; tone = 'calm'; }
    if (v.result === 'deaf') { label = 'chat'; body = '"Are you even listening?" (headset)'; tone = 'alarm'; }
    if (v.result === 'chatGood') { label = 'chat'; body = '"Okay, back to your spreadsheets, cutie."'; tone = 'calm'; }
    if (v.result === 'chatBad') { label = 'chat'; body = '"Wow. Okay."'; tone = 'alarm'; }
    if (v.result === 'chatMeh') { label = 'chat'; body = '"Mhm. Talk later."'; tone = 'warn'; }
    if (v.result === 'cuddling') { label = 'cuddle'; body = 'Warm. The party fights on without you.'; tone = 'calm'; }
    if (v.result === 'cuddleGood') { label = 'cuddle'; body = '"Okay, go play. Love you."'; tone = 'calm'; }
    if (v.result === 'cuddleMeh') { label = 'cuddle'; body = '"You are so restless."'; tone = 'warn'; }
    if (v.result === 'refused') { label = 'cuddle'; body = 'She sighs and leaves.'; tone = 'alarm'; }
    if (v.result === 'night') { label = 'good night'; body = '"Night, babe." Your hoodie, sleeves past her hands.'; tone = 'calm'; }
    if (v.result === 'forgiven') { label = 'forgiven'; body = '"I know, I know. Raid night." She lets it go.'; tone = 'warn'; }
  }
  return { note: { label: up(label), body, tone } };
}

/** The two things you can do at the door before she comes (pre-emptive, #19): pink buttons, why not on a dim one. */
function buttons() {
  const n = N();
  if (n.visit.stage !== 'idle') return null;
  return PRE_ACTIONS.filter(a => a.where === 'door').map(d => {
    const why = preBlocked(d.id), used = n.preUses[d.id] ?? 0;
    const name = d.id === 'towel' ? (n.towel ? 'Towel out' : 'Towel under door') : d.name;
    const cost = d.id === 'tea' ? `${T.PRE_TEA_SEC} s away` : d.id === 'towel' ? `${T.PRE_TOWEL_SEC} s` : '';
    const m = !d.toggle && !d.goodwill && used ? nextMult(d.id) : 1;
    return { name, sub: why || (m === 0 ? 'suspicious next' : m < 1 ? `${cost} · half` : cost), subCol: !why && m === 0 ? 'crimson' : undefined, off: !!why, act: 'pre', arg: d.id, tip: `pre:${d.id}` };
  });
}

export function herView(hover = '') {
  const n = N(), zone = moodZone(n.mood);
  return {
    mood: n.apt.asleep ? 'asleep' : zone === 'green' ? 'happy' : zone === 'yellow' ? 'annoyed' : 'furious',
    heard: heard(),
    ...middle(hover),
    buttons: buttons(),
    hover,
    stats: {
      patience: Math.ceil((100 - n.mood) / 20), caught: n.catches, goodwill: Math.floor(S.g.goodwill), noise: Math.round(n.noise),
      gwMarks: [T.GOODWILL_RAID / 100, T.GOODWILL_FORGIVE / 100], noiseMarks: n.apt.asleep ? [T.WAKE_NOISE_FLOOR / 100] : [],
    },
    side: webcamSide(),
  };
}

/** Tooltips for the panel's hit regions (her PC-98 tooltip look comes with the small pieces, V11). */
export function herTip(key: string): string {
  const n = N();
  switch (key) {
    case 'mood': return 'Her mood. It sours when she catches you or you ignore her, and recovers when you are sweet.';
    case 'heard': return 'The last thing you heard her do, and where. Her sounds tell you where she is.';
    case 'patience': return `Patience ${Math.round(100 - n.mood)}. Every heart she loses brings her to your door sooner.`;
    case 'caught': return `Caught ${n.catches} tonight. Every catch brings Guilt; the 1st also resets Flow, the 3rd turns your monitor off.`;
    case 'goodwill': return `Goodwill: earned with her. ${T.GOODWILL_RAID} buys a Raid night, ${T.GOODWILL_FORGIVE} forgives a catch.`;
    case 'noise': return `Your Noise.${n.apt.asleep ? ` Above ${T.WAKE_NOISE_FLOOR} it wakes her.` : ' How much reaches her depends on where she is.'}`;
    case 'wake': return `Waking up ${Math.round(n.apt.wake)}. At ${T.WAKE_TEXT} she texts you; full, she gets up.`;
    case 'plate': return 'Take it and say thanks: the party heals.';
    case 'cuddleYes': return 'Go to her. The party fights on without you.';
    case 'cuddleNo': return 'Stay. She will not be happy.';
    case 'door': return 'Your door. Hold it to peek out: the crack shows what she is doing.';
    case 'plan': return 'The plan: who hears you, what the crack shows. Click it to open it.';
    default: return '';
  }
}
