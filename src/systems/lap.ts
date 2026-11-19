import { T } from '../config/tuning';
import { addGoodwill } from './goodwill';
import { N } from '../core/state';
import { chance } from '../core/rng';
import { addMood, moodZone } from './meters';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');   // feed tag (#49)
import { sfx } from '../ui/audio';

// She leans into your face (docs/design/her.md, #65). Not a punishment: it happens when a visit goes well and she
// is in a good mood. She leans in from the right over the whole screen (hotkeys still work). No other interrupts
// meanwhile.
// To get your screen back you have to be sweet: she asks three things; sweet answers make her leave happy,
// rude ones make her sulk off.

export interface LapQ { q: string; a: [string, string, string] }   // [sweet, meh, rude]
export const LAP_QS: LapQ[] = [
  { q: 'Do you love me more than your elf?', a: ['More than all my loot.', 'Depends on her stats.', 'Shh, boss fight.'] },
  { q: 'What are you playing, babe?', a: ['Something boring. You are way more fun.', 'Just a game.', 'Can you move? I cannot see.'] },
  { q: 'Do I look cute in this?', a: ['You look amazing.', 'Sure.', 'Is that my shirt?'] },
  { q: 'Did you miss me?', a: ['Every second.', 'You were gone?', 'I was busy.'] },
  { q: 'Guess what I am thinking.', a: ['That I am the luckiest guy alive.', 'Food?', 'That I should log off? No.'] },
  { q: 'Are you coming to bed soon?', a: ['Five more minutes, I promise.', 'Maybe.', 'After this floor. And the next.'] },
  { q: 'Can I stay here a bit?', a: ['Always. Best view in the house.', 'I guess.', 'You are blocking the healer.'] },
];
let lastLap = -999;
const GUILD = [['xXBartekXx', 'who is that?? 👀'], ['Kubson', 'bro is AFK, his girl is in the way'], ['Ania_Heals', 'tell her I said hi!'], ['LeeroyPL', 'tank stopped moving, everyone ok?'],
  ['Wiktor', 'screenshot or it did not happen'], ['GoldSeller99', 'selling: girlfriend patience potions, 5g'], ['Zbyszek', 'gg, he is gone'], ['DarkLord2009', 'imagine having a gf lol']];
const guild = () => { const [who, msg] = GUILD[Math.floor(Math.random() * GUILD.length)]; toast(`[Guild] ${who}: ${msg}`, '#6fe08a'); };

/** Called when a visit passes. Returns true if she decides to lean in instead of leaving. */
export function maybeLap(): boolean {
  const n = N();
  if (n.lap || n.clock >= T.BED_FROM || moodZone(n.mood) !== 'green') return false;
  if (n.threat - lastLap < T.LAP_MIN_GAP_SEC || !chance(T.LAP_CHANCE)) return false;
  startLap();
  return true;
}

export function startLap() {
  const n = N();
  lastLap = n.threat;
  const qs = LAP_QS.map((_, i) => i).sort(() => Math.random() - 0.5);
  n.lap = { stage: 'arrive', t: 1.2, q: qs[0], asked: 0, order: [0, 1, 2].sort(() => Math.random() - 0.5), sweet: 0, rude: 0, face: 'smile', line: '"Aww, you work so hard..."', outfit: n.visit.from ?? 'tv' };
  (n.lap as unknown as { qs: number[] }).qs = qs;
  n.visit.stage = 'idle';
  sfx.kiss();
  toast('She leans in between you and the screen.', '#ff9ab8');
  guild();
}

export function updateLap(dt: number) {
  const n = N();
  const l = n.lap;
  if (!l) return;
  l.t -= dt;
  if (l.t > 0) return;
  if (l.stage === 'arrive' || l.stage === 'react') {
    if (l.asked >= T.LAP_QUESTIONS) { leave(); return; }
    const qs = (l as unknown as { qs: number[] }).qs;
    l.q = qs[l.asked]; l.order = [0, 1, 2].sort(() => Math.random() - 0.5);
    if (Math.random() < 0.6) guild();
    l.stage = 'ask'; l.t = T.LAP_ASK_SEC; l.face = l.sweet >= 2 ? 'wink' : 'smile'; l.line = `"${LAP_QS[l.q].q}"`;
  } else if (l.stage === 'ask') answer(1, true);          // silence counts as "meh"
  else if (l.stage === 'leave') { n.lap = null; n.apt.lastVisitEnd = n.threat + T.LAP_CALM_SEC; }
}

/** kind: 0 sweet, 1 meh, 2 rude. */
export function answer(kind: number, timeout = false) {
  const n = N();
  const l = n.lap;
  if (!l || l.stage !== 'ask') return;
  l.asked++;
  l.stage = 'react'; l.t = 1.6;
  if (kind === 0) { l.sweet++; l.face = l.sweet >= 2 ? 'wink' : 'blush'; l.line = ['"Hehe. Good answer."', '"You are sweet."', '"Mwah."'][l.asked % 3]; sfx.kiss(); }
  else if (kind === 1) { l.face = 'pout'; l.line = timeout ? '"...Hello? Earth to you?"' : '"Hmm. Okay."'; sfx.click(); }
  else { l.rude++; l.face = 'pout'; l.line = '"Wow. Rude."'; addMood(T.LAP_RUDE_MOOD); sfx.bad(); }
  if (l.rude >= 2) { l.asked = T.LAP_QUESTIONS; }
}

function leave() {
  const n = N();
  const l = n.lap!;
  l.stage = 'leave'; l.t = 1.4;
  if (l.sweet >= 2) {
    addMood(T.LAP_HAPPY_MOOD); l.face = 'blush'; l.line = '"Okay, I will let you play. Love you!" *kiss*';
    toast(`She kisses your cheek and leaves happy. Patience +${-T.LAP_HAPPY_MOOD}. She will leave you alone for a while.`, '#ff9ab8'); sfx.kiss();
    addGoodwill(T.GOODWILL_LAP, 'sweet answers');
  } else if (l.rude >= 2) {
    addMood(T.LAP_SULK_MOOD); l.face = 'pout'; l.line = '"Fine. Enjoy your elf."';
    toast(`She sulks off. Patience -${T.LAP_SULK_MOOD}.`, '#ff8a80');
  } else { l.face = 'neutral'; l.line = '"Okay, nerd. Have fun."'; toast('She leaves you to it.', '#ffb3c7'); }
}
