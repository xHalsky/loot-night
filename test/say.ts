// Her words and the chats (#138 to #141): what she says leaves the feed and comes from behind the door (a speech
// bubble on her panel, one at a time); what happened stays in the feed; her texts stay texts; your own words stay
// yours. The feed is a chat (oldest first) with no tips; the boys never teach.
// Run: npx tsx test/say.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { step } from '../src/core/loop';
import { toast, herWords } from '../src/core/fx';
import { feedView } from '../src/render/deskView';
import { NIGHT_CHAT, FIRST_CHAT, replayChat } from '../src/data/voice';
import { TIPS } from '../src/data/tips';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const night = (day: number) => { S.g = initialState(); S.g.day = day; startNight(); S.g.howto = false; S.g.voice = null; S.g.screen = 'night'; return N(); };
const last = () => N().log.at(-1)!;

// --- her words: the quotes, unless someone else is named before them ---
ok(herWords('CAUGHT! "Work, huh?"').said === 'Work, huh?' && herWords('CAUGHT! "Work, huh?"').rest === 'CAUGHT!', 'CAUGHT! stays, "Work, huh?" is said');
ok(herWords('"Fine. Enjoy your elves." Mood +5.').rest === 'Mood +5.', 'the effect stays without the quote');
ok(herWords('"Night, babe." She is wearing your hoodie. "Don\'t stay up."').said === "Night, babe. Don't stay up." && herWords('"Night, babe." She is wearing your hoodie. "Don\'t stay up."').rest === 'She is wearing your hoodie.', 'two quotes: one bubble, the narration in the feed');
ok(herWords('"Baaabe."').rest === '', 'only words: nothing left for the feed');
ok(herWords('You: "It\'s for work." She squints.').said === '', 'your words are yours');

let n = night(2);
const len0 = N().log.length;
toast('"Fine. Enjoy your elves." Mood +5.', '#ffb07a', 'HER');
ok(n.say?.at(-1)?.text === 'Fine. Enjoy your elves.' && last().text === 'Mood +5.' && last().tag === 'HER', 'her line: the bubble at the door, "Mood +5." in the feed under HER');
toast('"Baaabe."', '#ff9ab8', 'HER');
ok(N().log.length === len0 + 1 && n.say!.at(-1)!.text === 'Baaabe.', 'only words: a bubble and no feed line');
toast('[Her] "what was that??"', '#ff9ab8', 'LOOT');
ok(n.say!.at(-1)!.text === 'what was that??', '[Her] lines from other modules go to the door too');
toast('[Phone] Babe: "Not tonight."', '#ffb07a', 'HER');
ok(last().text === 'Babe: "Not tonight."' && last().tag === 'PHONE' && n.say!.at(-1)!.text !== 'Not tonight.', 'her texts stay texts (the feed, under PHONE)');
toast('Mom: "Love you, eat something!" Party fully healed.', '#6fcf7f', 'PHONE');
ok(last().text.startsWith('Mom: "Love you'), "Mom's words stay in the feed");
toast(`You: "It's a team-building exercise, for work." She squints.`, '#ff7ab8', 'HER');
ok(last().text.startsWith('You: "It\'s a team-building'), 'your excuse stays yours, in the feed');

// --- one at a time, each long enough to read; a pile-up keeps the one showing and the two newest ---
n = night(2);
toast('"one."', '#fff', 'HER'); toast('"two."', '#fff', 'HER'); toast('"three."', '#fff', 'HER'); toast('"four."', '#fff', 'HER');
ok(n.say!.map(s => s.text).join() === 'one.,three.,four.', `a pile-up: ${n.say!.map(s => s.text).join(' ')}`);
const first = n.say![0].max; for (let i = 0; i < Math.ceil(first * 60) + 2; i++) step(1 / 60);
ok(n.say![0].text === 'three.' && first >= 2.6, `the next one after ${first.toFixed(1)} s`);
toast('"Hey."', '#fff', 'HER'); toast('"Hey."', '#fff', 'HER');
ok(n.say!.filter(s => s.text === 'Hey.').length === 1, 'the same line twice in a row: once');

// --- the feed: a chat, oldest first, every line, no tips ---
n = night(2);
toast('first', '#fff', 'GAME'); toast('second', '#fff', 'GAME');
const rows = feedView().rows;
ok(rows.at(-1)![2] === 'second' && rows.at(-2)![2] === 'first', 'the feed: oldest first, the newest at the bottom');
for (let i = 0; i < 70; i++) toast(`line ${i}`, '#fff', 'GAME');
ok(feedView().rows.length === 60 && feedView().you, `it keeps 60 lines to scroll back through (${feedView().rows.length}); the YOU card is above it on Wednesday`);
S.g = initialState(); S.g.day = 0; startNight(); S.g.howto = false; S.g.voice = null;
ok(!feedView().you, 'Monday: no YOU card, the feed takes the column');
ok(Object.keys(TIPS).join() === 'her_show', 'the only first-time line left is hers');

// --- the boys never teach (#141): banter about her and the raid ---
const TEACH = /\b(press|click|hold|tab to|tab out|answer|pet him|keep it down|hide the|hide your|mind the|pick up quick|text her|lean in|stay sharp|make it to bed|\(G\)|BEFORE)\b/i;
const boys = [...FIRST_CHAT, ...Object.values(NIGHT_CHAT).flat(), ...replayChat('Tuesday')];
const teach = boys.filter(([, s]) => TEACH.test(s));
ok(!teach.length, `no instructions in their chats${teach.length ? ': ' + teach.map(c => c[1]).join(' | ') : ''}`);
ok(!FIRST_CHAT.some(c => /star|password/.test(c[1])), "Lance can't see your screen: no password line");
ok(T.CHAT_LAUNCH_AT.length === FIRST_CHAT.length, 'one arrival per bubble');

console.log(fails ? `${fails} FAILED` : 'PASS');
process.exit(fails ? 1 : 0);
