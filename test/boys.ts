// The boys' lines (#109): who says what, their chat voice, the banned names, and the chat between the calls (a moment
// posts a line in The Boys' chat, spaced, once a night where it should be). Run: npx tsx test/boys.ts
import { S, initialState } from '../src/core/state';
import { T } from '../src/config/tuning';
import { startNight } from '../src/systems/night';
import { boysSay, updateBoys } from '../src/systems/boys';
import { BOYS_LINES, BOYS_ONCE, type BoysTrigger } from '../src/data/boys';
import { FIRST_CHAT, NIGHT_CHAT, replayChat } from '../src/data/voice';
import { FRIENDS_TALKS } from '../src/data/content';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

// every line the boys say, with its speaker
const said: [string, string][] = [...FIRST_CHAT, ...Object.values(NIGHT_CHAT).flat(), ...replayChat('Tuesday'), ...Object.values(BOYS_LINES).flat(2) as [string, string][]];
for (const t of FRIENDS_TALKS.flat()) { const m = /^(\w+): "(.*)"$/.exec(t.line); if (m) said.push([m[1], m[2]]); }
ok(said.every(([w]) => ['Billy', 'Mike', 'Lance'].includes(w)), `only Billy, Mike and Lance speak (${said.length} lines)`);
ok(said.every(([, s]) => !/[–—]/.test(s)), 'no dashes');
ok(said.every(([, s]) => s.replace(/\b[A-Z]{2,}\b|\(G\)/g, '') === s.replace(/\b[A-Z]{2,}\b|\(G\)/g, '').toLowerCase()), 'lowercase, shouted words aside');
ok(!said.some(([, s]) => /magoo|garrote|healero|knightenstein|danny|kuba/i.test(s)), 'no old names');
ok(said.some(([, s]) => /\baoj\b/.test(s)), 'they call the game aoj');
ok(FRIENDS_TALKS.every(t => t[0].line.startsWith('Billy:')), 'Billy makes the call');
ok(FRIENDS_TALKS.every(t => t.every(st => st.wrong.length === 2)), 'every line has the polite, the shouting and the rude reply');
ok(Object.keys(BOYS_LINES).every(k => BOYS_LINES[k as BoysTrigger].length > 0), 'every moment has a line');

// the chat between the calls
S.g = initialState(); S.g.day = 2; startNight(); S.g.screen = 'night'; S.g.howto = false; S.g.voice = null;
const n = S.g.night!;
S.g.boysThread = [];
const len = () => (S.g.boysThread ?? []).length;
ok(boysSay('invite') && len() === 3, `the first trip down: the raid invite, an exchange of 3 (${len()})`);
ok(!boysSay('wipe'), `spaced: nothing within ${T.BOYS_GAP_SEC} s`);
n.threat += T.BOYS_GAP_SEC + 1; ok(boysSay('wipe') && (S.g.boysThread ?? []).at(-1)!.text.length > 0, 'a wipe after the gap');
n.threat += T.BOYS_GAP_SEC + 1; ok(!boysSay('wipe'), `the same moment waits ${T.BOYS_SAME_GAP_SEC} s`);
n.threat += T.BOYS_SAME_GAP_SEC + 1; ok(boysSay('wipe'), '...then speaks again');
n.threat += T.BOYS_SAME_GAP_SEC + 1; ok(BOYS_ONCE.includes('invite') && !boysSay('invite'), 'the invite once a night');
const lines = S.g.boysThread!.map(l => l.text);
ok(lines.every(l => /^(Billy|Mike|Lance): /.test(l) && S.g.boysThread!.every(x => x.s === 'l')), 'grey lines, the speaker first');
for (let i = 0; i < 40; i++) { n.threat += T.BOYS_GAP_SEC + 1; S.g.boysThread!.push(...S.g.boysThread!.slice(0, 1)); }
n.threat += T.BOYS_SAME_GAP_SEC + 1; boysSay('bossKill'); ok(len() <= T.BOYS_THREAD_MAX, `the thread keeps ${T.BOYS_THREAD_MAX} lines`);
// the odd line in the dungeon
S.g.boysThread = []; n.location = 'dungeon'; n.phase = 'walk';
for (let i = 0; i < T.BOYS_RANDOM_SEC[1] * 30 + 30; i++) { n.threat += 1 / 30; updateBoys(1 / 30); }
ok(len() > 0, `a line now and then in the dungeon (${len()} in ${T.BOYS_RANDOM_SEC[1]} s)`);
// the clock: "it's 20:15" only while it is about 20:15
let late = false; for (let i = 0; i < 40; i++) { S.g = initialState(); S.g.day = 2; startNight(); S.g.screen = 'night'; S.g.night!.clock = 22 * 60; S.g.boysThread = []; boysSay('invite'); if (S.g.boysThread.some(l => l.text.includes("it's 20:15"))) late = true; }
ok(!late, 'at 22:00 nobody says it is 20:15');

console.log(fails ? `${fails} FAILED` : 'all passed');
if (fails) process.exit(1);
