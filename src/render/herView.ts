// Her panel's view (V4, #69; grid doc 7b): what the renderer's her.js drawHerLive needs, read from the game. No rules
// here, only reading; the texts are the ones her DOM panel had (docs/design/her.md, screen.md).
import { eyesBusy } from '../systems/eyes';
import { askAwaySec } from '../systems/asks';
import { lapSitQ } from '../systems/lapsit';
import { S, N } from '../core/state';
import { T } from '../config/tuning';
import { moodZone } from '../systems/meters';
import { hasLife } from '../systems/affixes';
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
  if (v.stage === 'idle' && S.g.day === 0 && n.apt.cued && !n.headset && END_HINT[n.apt.activity]) { label = 'listen'; body = END_HINT[n.apt.activity]; tone = 'warn'; }   // first night: name the tell
  if (n.leanSpotted && v.stage === 'idle') return { win: { label: 'HER', pink: true, line: n.leanSpotted.good ? '"Enjoying the view?" She blushes and turns back.' : '"Enjoying the view, creep?"' } };   // she saw you leaning in (#77)
  if (v.kind === 'tease') return teaseWin();   // she wants you (#85, #89)
  if (v.stage === 'idle' && n.herAsk) return askWin();       // "Babe, towel!", "Babe, bring my wine?" (#93, #88)
  if (v.stage === 'idle' && n.herThanks && !n.pre) return thanksWin();
  if (v.stage === 'far' && !n.headset) { label = 'footsteps'; body = 'Footsteps... is she coming?'; tone = 'warn'; }
  if (v.stage === 'hall') { label = 'at the door'; body = S.g.day === 0 ? VISIT_CUE[v.kind] : 'Her shadow is at the door.'; tone = 'alarm'; }
  if (v.stage === 'handle') { label = 'door'; body = 'The handle is turning!'; tone = 'alarm'; }
  if (v.stage === 'passing') { label = 'footsteps'; body = 'She walked past. Phew.'; tone = 'warn'; }
  if (v.stage === 'in') {
    label = 'she is in'; body = v.result === 'caught' ? 'Caught.' : v.result === 'look' ? '"Nothing. Just looking at you."' : v.checked ? 'She bought it.' : '"Still working, babe?"'; tone = v.result === 'caught' ? 'alarm' : 'warn';
    if (v.result === 'pass' && n.q4.asked) body = '"What are you working on?"';   // looking busy (#55): you sat idle in Excel
    if (v.ask && v.result !== 'caught') body = v.ask === 'towel' ? 'In a towel, dripping: "Found one myself."' : 'In a towel, dripping: "Got my wine myself."';   // ignored her request (#93, #88)
    const secs = `${Math.max(0, Math.ceil(v.t))} s`;
    if (v.result === 'offer') return { win: { label: 'SNACK RUN', right: secs, line: '"Made you a plate. Eat something, babe."', warm: true, pills: [{ name: 'Take the plate', cost: `party +${Math.round(T.SNACK_HEAL * 100)}% HP`, act: 'takePlate', arg: '0', tip: 'plate' }] as Pill[] } };
    if (v.result === 'ask') return { win: { label: 'CUDDLE', right: secs, line: '"Come cuddle for a bit?"', pills: [{ name: 'Come here', cost: `${T.CUDDLE_SEC} s with her`, act: 'cuddle', arg: '1', tip: 'cuddleYes' }, { name: 'One sec, babe', cost: 'she sighs', act: 'cuddle', arg: '0', tip: 'cuddleNo' }] as Pill[] } };
    if (v.result === 'lap' && v.chat) {   // on your lap (#86): the chat's window, KEEP PLAYING
      const q = lapSitQ()!, c = v.chat;
      const order = [0, 1, 2].sort((a, b) => ((c.order[0] * 7 + a * 5 + c.asked) % 3) - ((c.order[0] * 7 + b * 5 + c.asked) % 3));
      return { chat: { label: `ON YOUR LAP ${Math.min(T.CHAT_QUESTIONS, c.asked + 1)}/${T.CHAT_QUESTIONS}`, right: 'KEEP PLAYING', q: c.line, a: order.map(k => ({ text: q.a[k], act: 'lapSitAnswer', arg: String(k) })), hover } };
    }
    if (v.result === 'lapGood') { label = 'on your lap'; body = 'She kisses your cheek and hops off. "Go get them, knight."'; tone = 'calm'; }
    if (v.result === 'lapMeh') { label = 'on your lap'; body = '"Okay, nerd. I\'ll let you play."'; tone = 'warn'; }
    if (v.result === 'lapBad') { label = 'on your lap'; body = '"Fine. Enjoy your elf."'; tone = 'alarm'; }
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


/** Her tease in her window (grid doc 7m): the pink line, HER, three hearts for the looking she wants, her line, her
 *  time; come to bed with Coming, babe. */
function askWin() {
  const k = N().herAsk!, towel = k.kind === 'towel';
  return { win: {
    label: towel ? 'BABE, TOWEL!' : 'BABE, WINE?', pink: true, right: `${Math.max(0, Math.ceil(k.t))} s`,
    line: towel ? '"I forgot my towel. Bring me one?"' : '"Bring my wine? It\'s on the counter."',
    pills: [{ name: towel ? 'Bring her a towel' : 'Bring it to her', cost: `${askAwaySec(k.kind)} s away`, act: 'herAsk', arg: '1', tip: 'ask' }] as Pill[],
  } };
}
function thanksWin() {
  const k = N().herThanks!;
  return { win: { label: 'HER', pink: true, look: 3, line: k.kind === 'towel' ? 'She opens the door in her towel, steam behind her. "My hero."' : 'Foam to her shoulders, she takes the glass. "Mmm. Thank you."' } };
}

function teaseWin() {
  const v = N().visit, bed = !!v.bed;
  const look = Math.min(3, Math.floor(((v.looked ?? 0) / T.TEASE_LOOK_SEC) * 3 + (v.result === 'kissed' ? 3 : 0)));
  if (v.stage === 'far') return { win: { label: 'HER', pink: true, line: bed ? '"babe...?"' : '"babe?"' } };
  if (v.result === 'kissed') return { win: { label: 'HER', pink: true, look: 3, line: bed ? 'She smiles, half asleep. "Don\'t be long."' : 'She blows you a kiss. "Ok. Go play."' } };
  if (v.result === 'pout') return { win: { label: 'HER', pink: true, look, line: bed ? '"Fine. Goodnight."' : '"Fine. Enjoy your elves."' } };
  return { win: {
    label: bed ? 'COME TO BED' : 'HER', pink: true, fast: !!v.esc, look,
    line: v.esc ? (bed ? '"Babe... come to bed."' : '"Baaabe."') : bed ? '"come to bed... it\'s late"' : '"babe? come here a sec..."',
    bar: bed ? undefined : Math.max(0, v.t / (v.esc ? T.TEASE_ESCALATE_SEC : T.TEASE_SEC)), barCol: 'rose' as Col,
    right: bed ? `${Math.max(0, Math.ceil(v.t))} s` : undefined,   // with the pill, the seconds in the corner (as the cuddle ask)
    pills: bed ? [{ name: 'Coming, babe', cost: 'ends the night', act: 'comingBabe', arg: '0', tip: 'coming' }] as Pill[] : undefined,
  } };
}

export function herView(hover = '') {
  const n = N(), zone = moodZone(n.mood), v = n.visit, tease = v.kind === 'tease' && v.stage === 'in';
  const mid = middle(hover), said = n.say?.[0]?.text, shown = (mid as { win?: { line?: string } }).win?.line ?? '';
  return {
    say: said && !shown.includes(said.slice(0, 14)) ? { text: said, open: v.stage === 'in' } : undefined,   // what she says (#139): from behind the door, or above her in the open doorway; not when her window already shows it
    gwTag: tease && (v.gw ?? 0) >= 1 ? `+${Math.floor(v.gw ?? 0)}${v.bed && eyesBusy() ? ' x2' : ''}` : undefined,   // looking at her: Goodwill rises on its bar
    mood: n.leanSpotted?.good || (tease && v.result === 'kissed') ? 'flustered' : tease && v.bed ? 'sleepy' : n.apt.asleep ? 'asleep' : zone === 'green' ? 'happy' : zone === 'yellow' ? 'annoyed' : 'furious',
    heard: heard(),
    ...mid,
    buttons: null,   // Make her tea and the towel went with step 6 (#57): bubble tea and the door seal are in the Home app
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
    case 'ask': return `Go and bring it. You're away from the PC for a few seconds; the party fights on. Ignore her and she gets it herself, by way of your door (Mood +${T.ASK_IGNORE_MOOD}).`;
    case 'coming': return 'Go to bed with her. The night ends here, like Sleep, and the morning is the best one. No Witching Hour tonight.';
    case 'cuddleYes': return 'Go to her. The party fights on without you.';
    case 'cuddleNo': return 'Stay. She will not be happy.';
    case 'door': return 'Your door. Hold it to peek out: the crack shows what she is doing.';
    case 'headset': return n.headset ? 'Headset: on. Click your head or press H to take it off and hear her again.' : `Headset: click your head or press H. After ${T.ZONE_FILL_SEC} s you are in the Zone, but you can't hear her.`;   // the shared tooltip (#103)
    case 'plan': return 'The plan: who hears you, what the crack shows. Click it to open it.';
    default: return '';
  }
}
