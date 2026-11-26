// The lap sit (fan-service step 10, #86): from Saturday at Goodwill 70+, a chat visit becomes her on your lap. No check
// (the game on screen is fine), three questions about the game, ignored she takes your mouse (She has the mouse, skills
// blocked 3 s, or till you answer her), "ooh, shiny" on rare drops, up after the three or 20 s; the chat's outcomes.
// Run: npx tsx test/lapsit.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { updateVisits, triggerVisitNow } from '../src/systems/visits';
import { lapSitAnswer, lapMouse, onLap, lapSitQ, LAP_MOUSE_Q } from '../src/systems/lapsit';
import { abilitiesLocked } from '../src/systems/battle';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (day = 5, gw = 80) => {
  S.g = initialState(); S.g.day = day; startNight(); S.g.howto = false; S.g.goodwill = gw;
  const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; n.apt.lastVisitEnd = 1e9; n.location = 'dungeon'; n.monitor = 'rpg'; n.tease.left = 0; n.tease.bedAt = 1e9;
  n.enemies = [{ hp: 10 } as never]; n.phase = 'battle';
  return n;
};
const run = (sec: number) => { for (let i = 0; i < sec * 60; i++) updateVisits(1 / 60); };
const toIn = () => { for (let i = 0; i < 60 * 15 && N().visit.stage !== 'in'; i++) updateVisits(1 / 60); updateVisits(1 / 60); };

// --- when ---
let n = night(5, 80); triggerVisitNow('chat'); ok(!!n.visit.lapSit, 'Saturday, Goodwill 80: her chat visit is a lap sit');
n = night(5, 60); triggerVisitNow('chat'); ok(!n.visit.lapSit, 'Goodwill 60: a chat');
n = night(4, 90); triggerVisitNow('chat'); ok(!n.visit.lapSit, 'Friday: a chat');

// --- she sits down: no check ---
n = night(5); triggerVisitNow('chat'); toIn();
ok(n.visit.result === 'lap' && onLap() && n.catches === 0, 'the game on screen: no catch, she sits on your lap (KEEP PLAYING)');
ok(!!lapSitQ() && n.visit.chat!.t === T.LAP_SIT_ASK_SEC, `her first question, ${T.LAP_SIT_ASK_SEC} s`);
ok(!abilitiesLocked(), 'you keep playing: the skills work');
// sweet answers: the chat's outcome
const m0 = n.mood, g0 = S.g.goodwill;
lapSitAnswer(0); lapSitAnswer(0); lapSitAnswer(1);
ok(n.visit.result === 'lapGood' && n.mood === Math.max(0, m0 + T.CHAT_PASS_MOOD) && S.g.goodwill > g0, 'two sweet: a kiss on the cheek, Mood and Goodwill as a good chat');
run(2); ok(n.visit.stage === 'idle', 'and she gets up');

// --- ignored: she takes the mouse ---
n = night(5); triggerVisitNow('chat'); toIn();
run(T.LAP_SIT_ASK_SEC + 0.05);
ok(n.visit.chat?.mouse === true && lapMouse() && abilitiesLocked() === 'She has the mouse' && lapSitQ() === LAP_MOUSE_Q, '10 s ignored: "You stopped talking to me. My turn!", SHE HAS THE MOUSE');
ok(n.lapSay?.text === 'my turn!', '"my turn!" by her head');
lapSitAnswer(0); ok(!lapMouse() && !abilitiesLocked(), 'answer her: the mouse is yours again');
// ...or 3 s
run(T.LAP_SIT_ASK_SEC + 0.05); ok(lapMouse() || n.visit.result !== 'lap', 'ignored again');
// 20 s in total
n = night(5); triggerVisitNow('chat'); toIn(); run(T.LAP_SIT_ASK_SEC + 0.05); run(T.LAP_MOUSE_SEC + 0.05);
ok(!lapMouse(), `the mouse back after ${T.LAP_MOUSE_SEC} s`);
run(T.LAP_SIT_SEC); ok(n.visit.result !== 'lap', `up after ${T.LAP_SIT_SEC} s at most`);

// --- ooh, shiny ---
n = night(5); triggerVisitNow('chat'); toIn();
n.floorLoot.push({ entry: { kind: 'item', item: { rarity: 'common' } } } as never); run(0.1); ok(!n.lapSay, 'a common drop: nothing');
n.floorLoot.push({ entry: { kind: 'item', item: { rarity: 'rare' } } } as never); run(0.1); ok(n.lapSay?.text === 'ooh, shiny', 'a rare drop: "ooh, shiny"');
run(T.LAP_SAY_SEC + 0.1); ok(!n.lapSay, '...for a moment');
// rude: the chat's outcome
n = night(5); triggerVisitNow('chat'); toIn(); const m1 = n.mood; lapSitAnswer(2); lapSitAnswer(2);
ok(n.visit.result === 'lapBad' && n.mood === m1 + T.CHAT_BAD_MOOD, '"Fine. Enjoy your elf."');
console.log(fails ? `${fails} FAILED` : 'PASS');
