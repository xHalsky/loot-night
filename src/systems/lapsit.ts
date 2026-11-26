// The lap sit (fan-service step 10, #86; grid doc 7m). From Saturday, at Goodwill LAP_GOODWILL or more, a chat visit
// becomes her on your lap: she comes in humming as for a chat, then sits on your lap facing the monitor to watch you
// play. No check (she knows what you're doing): KEEP PLAYING. The back of her head and her shoulder cover the battle's
// left third and you play around her. She asks three things about the game (sweet / meh / rude, as the chat); a
// question ignored for LAP_SIT_ASK_SEC and she takes your mouse ("You stopped talking to me. My turn!"): skills blocked
// LAP_MOUSE_SEC, or till you answer her. "ooh, shiny" on rare or better drops. She gets up after the three, or after
// LAP_SIT_SEC. The chat's Mood and Goodwill.
import { T } from '../config/tuning';
import { N } from '../core/state';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');
import { sfx } from '../ui/audio';
import { addMood } from './meters';
import { addGoodwill } from './goodwill';

export interface LapSitQ { q: string; a: [string, string, string] }   // [sweet, meh, rude]
export const LAP_SIT_QS: LapSitQ[] = [
  { q: 'Which one is you? The one with the shield?', a: ['Yep. I protect everyone.', 'The knight.', 'Shh, boss fight.'] },
  { q: 'What does the purple one do?', a: ['Magic. Like you.', 'Fire, mostly.', 'Stop pointing at the screen.'] },
  { q: 'Can I name the next sword?', a: ['Only after you.', 'Sure, whatever.', 'No. It has stats.'] },
  { q: 'Is that gold? Are we rich?', a: ['Rich in you.', 'Kind of.', 'It is pretend gold, babe.'] },
  { q: 'Why is everyone so angry in there?', a: ['They are jealous of you.', 'It is a dungeon.', 'You are blocking the healer.'] },
  { q: 'Do I get loot for sitting here?', a: ['You ARE the loot.', 'No.', 'You get a talk about aggro.'] },
];
export const LAP_MOUSE_Q: LapSitQ = { q: 'You stopped talking to me. My turn!', a: ["Okay, I'm here.", 'Give it back!', 'The boss!'] };

/** The question on the table right now. */
export function lapSitQ(): LapSitQ | null {
  const c = N().visit.chat;
  if (N().visit.result !== 'lap' || !c) return null;
  return c.mouse ? LAP_MOUSE_Q : LAP_SIT_QS[c.order[c.asked]];
}

/** She comes in and sits on your lap. */
export function sitDown() {
  const n = N(), v = n.visit;
  const order = LAP_SIT_QS.map((_, i) => i).sort(() => Math.random() - 0.5);
  v.result = 'lap'; v.t = T.LAP_SIT_SEC;
  v.chat = { order, asked: 0, good: 0, bad: 0, t: T.LAP_SIT_ASK_SEC, line: `"${LAP_SIT_QS[order[0]].q}"`, last: -1 };
  n.lapMouse = 0; n.lapSay = null; seen.clear(); seed();
  sfx.kiss();
  toast('She sits on your lap. "Keep playing, I wanna watch."', '#ff9ab8');
}

/** kind: 0 sweet, 1 meh, 2 rude. Answering her "My turn!" gets your mouse back. */
export function lapSitAnswer(kind: number, timeout = false) {
  const n = N(), v = n.visit, c = v.chat;
  if (v.result !== 'lap' || !c) return;
  const wasMouse = !!c.mouse;
  if (kind === 0) { c.good++; sfx.kiss(); } else if (kind === 2) { c.bad++; sfx.bad(); } else if (!timeout) sfx.click();
  c.last = kind; c.asked++; c.mouse = false;
  if (wasMouse) n.lapMouse = 0;
  if (c.asked >= T.CHAT_QUESTIONS || c.bad >= 2) { lapSitEnd(); return; }
  if (timeout && !wasMouse) {   // ignored: she takes your mouse
    c.mouse = true; c.t = T.LAP_MOUSE_SEC; n.lapMouse = T.LAP_MOUSE_SEC; c.line = `"${LAP_MOUSE_Q.q}"`;
    n.lapSay = { text: 'my turn!', t: T.LAP_MOUSE_SEC };
    return;
  }
  c.t = T.LAP_SIT_ASK_SEC; c.line = `"${LAP_SIT_QS[c.order[c.asked]].q}"`;
}

/** She gets up: the chat's outcome. */
export function lapSitEnd() {
  const n = N(), v = n.visit, c = v.chat;
  if (v.result !== 'lap') return;
  v.chat = null; v.t = 1.6; n.lapMouse = 0; n.lapSay = null;
  const good = c?.good ?? 0, bad = c?.bad ?? 0;
  if (good >= 2) { v.result = 'lapGood'; addMood(T.CHAT_PASS_MOOD); addGoodwill(T.GOODWILL_CHAT, 'on your lap'); toast(`She kisses your cheek and hops off. "Go get them, knight." Mood ${T.CHAT_PASS_MOOD}.`, '#6fcf7f'); }
  else if (bad >= 2) { v.result = 'lapBad'; addMood(T.CHAT_BAD_MOOD); toast(`"Fine. Enjoy your elf." She gets up. Mood +${T.CHAT_BAD_MOOD}.`, '#ff8a80'); }
  else { v.result = 'lapMeh'; addMood(T.CHAT_MEH_MOOD); toast('"Okay, nerd. I\'ll let you play."', '#ffb07a'); }
}

// "ooh, shiny": new rare or better items on the floor while she sits with you
const seen = new Set<unknown>();
const shiny = (l: { entry: { kind: string; item?: { rarity: string } } }) => l.entry.kind === 'item' && ['rare', 'epic', 'legendary'].includes(l.entry.item!.rarity);
function seed() { N().floorLoot.forEach(l => seen.add(l)); }

/** Every frame while she sits on your lap. */
export function updateLapSit(dt: number) {
  const n = N(), c = n.visit.chat;
  n.lapMouse = Math.max(0, n.lapMouse - dt);
  if (n.lapSay && (n.lapSay.t -= dt) <= 0) n.lapSay = null;
  for (const l of n.floorLoot) if (!seen.has(l)) { seen.add(l); if (shiny(l as never)) { n.lapSay = { text: (l as never as { entry: { item: { rarity: string } } }).entry.item.rarity === 'legendary' ? 'OOH. shiny!!' : 'ooh, shiny', t: T.LAP_SAY_SEC }; sfx.kiss(); } }
  if (!c) return;
  c.t -= dt;
  if (c.t <= 0) lapSitAnswer(1, true);   // silence: meh (and the first time, she takes the mouse)
}

/** The skills are blocked while she has your mouse. */
export const lapMouse = () => { const n = N(); return n.visit.result === 'lap' && n.lapMouse > 0; };
/** She is on your lap right now (the webcam, the overlay). */
export const onLap = () => { const v = N().visit; return v.stage === 'in' && v.result === 'lap'; };
