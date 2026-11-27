// The week (#56): the schedule's rules night by night, what is off before its night, Monday's 01:00 end, the replay
// after the plug, How to hide's tiles, the Shop by night, week two, and a save from before the week.
// Run: npx tsx test/week.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight, checkNightEnd, endNight } from '../src/systems/night';
import { rulesFor, rules, on, dayName, howtoTiles, howtoOpens, bedAt } from '../src/systems/week';
import { pickKind, startVisit, updateVisits } from '../src/systems/visits';
import { NIGHT_CHAT, FIRST_CHAT } from '../src/data/voice';
import { chatAt } from '../src/render/phoneView';
import { updateTired } from '../src/systems/tired';
import { openMonster } from '../src/systems/monster';
import { shopState } from '../src/systems/shop';
import { updateApartment } from '../src/systems/apartment';
import { load } from '../src/systems/save';
import { step } from '../src/core/loop';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (day: number) => { S.g = initialState(); S.g.day = day; startNight(); S.g.howto = false; const n = N(); return n; };

// --- the schedule ---
const names = [0, 1, 2, 3, 4, 5, 6].map(d => rulesFor(d).name).join(' ');
ok(names === 'Monday Tuesday Wednesday Thursday Friday Saturday Sunday', `the nights: ${names}`);
const has = (d: number, f: string) => rulesFor(d).on.includes(f);
ok(['peek', 'snack', 'q4', 'shop'].every(f => has(0, f)) && !['chat', 'headset', 'tired', 'phone', 'messages', 'dog', 'cuddle', 'fuel', 'bed', 'witching'].some(f => has(0, f)),
  'Monday: her, peek and snack, Q4, the Shop; nothing else');
ok(['chat', 'headset', 'tired', 'onDesk'].every(f => has(1, f) && !has(0, f)), 'Tuesday adds chat visits, the headset, Tiredness, her on the desk');
ok(['phone', 'messages'].every(f => has(2, f) && !has(1, f)), 'Wednesday: the phone rings, Messages');
ok(['dog', 'cuddle', 'friends', 'fuel', 'home'].every(f => has(3, f) && !has(2, f)), 'Thursday: the dog, cuddles, the boys, the Goblin Fuel, the smart home and the battery');
ok(['bed', 'witching'].every(f => has(4, f) && !has(3, f)), 'Friday: she goes to bed, the Witching Hour');
ok([1, 2, 3, 4, 5, 6].every(d => rulesFor(d - 1).on.every(f => has(d, f))), 'what came in stays on');
const vis = [0, 1, 2, 3, 4, 5, 6].map(d => rulesFor(d).visits).join(' ');
ok(vis === '1 1.2 1.2 1.2 1.2 1.4 1.6', `visits by night: ${vis}`);
const beds = [0, 1, 2, 3, 4, 5, 6].map(d => rulesFor(d).bed).join(' ');
ok(beds === `0 0 0 0 ${24 * 60} ${25 * 60} ${25 * 60}`, 'she goes to bed: from Friday at 00:00, the weekend at 01:00');
ok(rulesFor(0).end === 25 * 60 && [1, 2, 3, 4, 5, 6].every(d => !rulesFor(d).end), 'only Monday ends at 01:00');
ok(rulesFor(3).dog?.[0] === 90 && !rulesFor(2).dog, 'the dog from Thursday, first at 90 s');
ok(rulesFor(3).friends === 1 && rulesFor(2).friends === 0, 'the boys from Thursday, once a night');
// week two: everything on, nothing new, she goes to bed every night
const w2 = rulesFor(7), w2s = rulesFor(12);
ok(w2.name === 'Monday' && w2.week === 2 && rulesFor(6).on.every(f => w2.on.includes(f)) && !w2.isNew.length && w2.bed === T.WEEK_TWO_BED && !w2.end && w2.visits === 1,
  'week two, Monday: everything on, nothing new, bed at 00:00, no 01:00 end, its own visits');
ok(w2s.name === 'Saturday' && w2s.bed === 25 * 60 && w2s.visits === 1.4, 'week two, Saturday: the weekend\'s bed and visits');

// --- Monday: what is off is off ---
let n = night(0);
ok(on('q4') && !on('tired') && n.tired === 0, 'Monday: no Tiredness');
n.clock = 23 * 60; updateTired(1, 30); ok(n.tired === 0, 'Monday: it stays 0 past 22:00');
ok(n.phoneScript.length === 0 && n.friendsLeft === 0, 'Monday: the phone never rings');
ok(n.dog.next === Infinity, 'Monday: no dog');
ok(S.g.monsters === 0, 'Monday: no cans (the top-up waits for Thursday)');
openMonster(); ok(!n.game, 'Monday: G does nothing');
ok(['tv', 'tea', 'toilet', 'phone', 'shower'].every(a => [0, 0.5, 0.9].every(r => ['peek', 'snack'].includes(pickKind(a, false, true, r)))), 'Monday: only peeks and snack runs');
ok(bedAt() === Infinity, 'Monday: she stays up');
ok(['fuel', 'chew', 'fridge', 'chair'].every(id => shopState(id as 'fuel') === 'soon') && shopState('keys') !== 'soon', 'Monday: the Shop sells Q4\'s keys, the rest waits for its night');
// Monday ends at 01:00 as a Sleep, mid-run: the run is banked
n = night(0); n.location = 'dungeon'; n.phase = 'battle'; n.clock = 25 * 60;
checkNightEnd();
ok(S.g.screen === 'results' && S.g.results?.ending === 'sleep' && !!S.g.results?.bedtime, 'Monday: 01:00 ends the night as a Sleep (even mid-battle)');
ok(S.g.day === 1 && dayName() === 'Tuesday', 'the next night is Tuesday');
n = night(0); n.clock = 25 * 60 - T.BEDTIME_WARN_MIN; checkNightEnd(); ok(n.log.some(l => l.text.includes('Bedtime at 01:00')) || n.toasts.some(t => t.text.includes('Bedtime at 01:00')), 'a warning 15 minutes before');
// Tuesday runs on past 01:00
n = night(1); n.clock = 25 * 60 + 5; checkNightEnd(); ok(S.g.screen === 'night', 'Tuesday: the night goes on past 01:00');
ok(S.g.heroes.some(h => h.id === 'rogue'), 'Tuesday: Hixx is in the party (from night 1, #96)');
n.clock = 23 * 60; updateTired(1, 30); ok(n.tired > 0, 'Tuesday: Tiredness');

// --- the replay ---
n = night(1); n.mood = T.MOOD_MAX; checkNightEnd();
ok(S.g.results?.ending === 'unplugged' && S.g.day === 1 && dayName() === 'Tuesday', 'unplugged on Tuesday: Tuesday, again');
ok(S.g.nightsPlayed === 1, '...the nights still count');
n = night(1); endNight('dawn'); ok(S.g.day === 2, 'dawn moves on to Wednesday');

// --- Thursday, Friday ---
n = night(3);
ok(S.g.monsters === T.MONSTER_PER_NIGHT && n.dog.next === 90 && n.friendsLeft === 1 && n.phoneScript.length === 3, 'Thursday: 3 cans, the dog at 90 s, the boys once, the three calls');
n.clock = 24 * 60 + 1; n.apt.t = 0; n.apt.lastVisitEnd = n.threat; updateApartment(1 / 60); ok(!n.apt.asleep, 'Thursday: she stays up past midnight');
n = night(4); n.clock = 24 * 60 + 1; n.apt.t = 0; n.apt.lastVisitEnd = n.threat; n.mood = 60; updateApartment(1 / 60); ok(n.apt.asleep, 'Friday: she goes to bed at 00:00');
n = night(5); n.clock = 24 * 60 + 1; n.apt.t = 0; n.apt.lastVisitEnd = n.threat; n.mood = 60; updateApartment(1 / 60); ok(!n.apt.asleep, 'Saturday: not at 00:00...');
n.clock = 25 * 60 + 1; n.apt.t = 0; n.apt.moving = 0; n.apt.towelAsk = false; n.apt.wineAt = -1; n.apt.lastVisitEnd = n.threat; updateApartment(1 / 60); ok(n.apt.asleep, '...at 01:00');

// --- her pace: the gaps shrink with the night's visits ---
// her odds never come up (random 0.99): she comes when the longest gap runs out, DOOR_MAX_GAP_SEC / the night's visits
const gapAt = (day: number) => { n = night(day); n.mood = 60; n.noise = 0; n.apt.lastVisitEnd = n.threat; const r = Math.random; Math.random = () => 0.99; let t = 0;
  for (; t < 300; t += 1 / 30) { n.threat += 1 / 30; n.apt.t = 0; n.apt.moving = 0; if (updateApartment(1 / 30) === 'door') break; } Math.random = r; return t; };
const g0 = gapAt(0), g6 = gapAt(6);
ok(Math.abs(g0 - T.DOOR_MAX_GAP_SEC) < 0.5 && Math.abs(g6 - T.DOOR_MAX_GAP_SEC / 1.6) < 0.5, `the longest gap: ${g0.toFixed(1)} s Monday, ${g6.toFixed(1)} s Sunday`);

// --- How to hide ---
const tiles = (d: number) => { S.g.day = d; const k = howtoTiles(); return `${k.ids.join(',')}|${k.isNew.join(',')}|${k.answer}|${howtoOpens()}`; };
ok(tiles(0) === 'listen,tab,peek,answer||mon|true', `Monday: four tiles (the door's crack until lean in), the card opens (${tiles(0)})`);
ok(tiles(1) === 'listen,tab,answer,headset,lean|headset,lean,answer|tue|true', `Tuesday: the headset, lean in and the chat in What she wants new (${tiles(1)})`);
ok(tiles(2) === 'listen,tab,answer,headset,lean||tue|false', `Wednesday: nothing new to hide from, no card (${tiles(2)})`);
ok(tiles(3) === 'listen,tab,answer,headset,lean|answer|thu|true', `Thursday: the cans and the cuddle in What she wants (${tiles(3)})`);
ok(tiles(7) === 'listen,tab,answer,headset,lean||thu|false', `week two: no card (${tiles(7)})`);

// --- the boys at 20:00: always their chat, never a voice note (#102, #108) ---
n = night(0); ok(S.g.voice?.chat?.length === FIRST_CHAT.length && new Set(S.g.voice.chat.map(c => c[0])).size === 3 && S.g.voice?.date === 'Today 20:00', 'Monday: the boys\' chat, all three of them');
ok(S.g.voice!.chat[0][0] === 'Billy' && S.g.voice!.chat[0][1] === "yo. realm's up" && S.g.voice!.chat.some(c => c[1].startsWith('11 sharp')), "Billy opens it: the realm's up, 11 sharp (#109)");
{ const end = chatAt(FIRST_CHAT, 99), mid = chatAt(FIRST_CHAT, 1.0); let t = 0; while (chatAt(FIRST_CHAT, t).shown < FIRST_CHAT.length) t += 0.05;
  ok(end.shown === FIRST_CHAT.length && !end.typing && mid.shown < FIRST_CHAT.length && t <= 7, `the bubbles come one at a time with typing dots, all in by ${t.toFixed(1)} s`); }
S.g = initialState(); S.g.day = 0; startNight(); ok(S.g.howto && !!S.g.voice, 'the night waits for it (howto), the card after it');
ok([1, 2, 3, 4, 5, 6].every(d => { S.g = initialState(); S.g.day = d; startNight(); return S.g.voice?.chat.length === 3 && new Set(S.g.voice.chat.map(c => c[0])).size === 3; }), 'their chat every night of week one, all three of them');
ok([...Object.values(NIGHT_CHAT).flat(), ...FIRST_CHAT].map(c => c[1]).every(l => !/[\u2013\u2014]/.test(l) && l.replace(/\b[A-Z]{2,}\b|\(G\)/g, '') === l.replace(/\b[A-Z]{2,}\b|\(G\)/g, '').toLowerCase()), 'their chat voice: lowercase (shouted words aside), no dashes');
S.g = initialState(); S.g.day = 7; startNight(); ok(!S.g.voice && !S.g.howto, 'week two: no note, no card');
n = night(1); n.mood = T.MOOD_MAX; checkNightEnd(); startNight();
ok(S.g.voice?.date === 'Tuesday, again' && S.g.voice.chat[0][1] === 'game over man. GAME OVER.' && S.g.voice.chat[1][1] === 'tuesday again then.' && S.g.voice.chat[2][0] === 'Lance', 'after the plug: Billy, then Lance, in their chat (#109)');

// --- the first chance: her first visit is tonight's new type, early and safe ---
n = night(1); ok(n.apt.forceKind === 'chat' && n.firstSafe === 'chat', 'Tuesday: her first visit is a chat');
startVisit(); ok(n.visit.kind === 'chat' && !!n.visit.safe && !n.visit.fake && !n.firstSafe, '...not a fake-out, and safe');
n.visit.stage = 'in'; n.visit.result = 'chat'; n.monitor = 'rpg'; n.monitorOff = 0; const c0 = n.catches, m0 = n.mood; updateVisits(1 / 60);
ok(n.catches === c0 && n.mood === m0 && n.visit.result === 'forgiven', `a catch on it is let go (catches ${n.catches}, Mood ${n.mood})`);
n = night(0); ok(!n.firstSafe && n.apt.forceKind === null, 'Monday: nothing scripted');
n = night(3); ok(n.apt.forceKind === 'snack', 'Thursday: her first visit is a snack run');
startVisit(); const cans = S.g.monsters; n.visit.stage = 'handle'; n.visit.t = 0.001; n.cansHidden = false; updateVisits(1 / 60); updateVisits(1 / 60);   // the door opens, then she looks
ok(S.g.monsters === cans && n.visit.result === 'offer', `cans in sight on it: she lets it go, the plate is still yours (${S.g.monsters} cans, ${n.visit.result})`);
S.g = initialState(); S.g.day = 8; startNight(); ok(!N().firstSafe, 'week two: nothing scripted');

// --- a save from before the week ---
S.g = initialState(); S.g.nightsPlayed = 3; S.g.day = 3; S.g.screen = 'title';
store['lootnight.save.v3'] = JSON.stringify({ v: 1, nightsPlayed: 3, heroes: S.g.heroes, bag: [], gold: 100 });   // the shape before the week
S.g = initialState(); load(); ok(S.g.day === 3, `an old save picks up on night ${S.g.nightsPlayed + 1}: ${dayName()}`);

// --- the night runs: a Monday with the real loop, 30 s ---
n = night(0); for (let i = 0; i < 30 * 30; i++) step(1 / 30); ok(S.g.screen === 'night' && n.tired === 0 && !n.interrupts.length, 'a Monday runs: no Tiredness, no phone');
void rules;
console.log(fails ? `${fails} FAILED` : 'PASS');
