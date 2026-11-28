// The launch (#127, the v2 redesign): the whole of it on the first Monday, from the login every night after; when it plays, its clock, the chat paced to it, what it holds
// back, and its cue sheet played at speed (each cue once, in order; nothing for a jump past it). The sound itself and
// the skip in the browser: test/launch.py.
// Run: npx tsx test/launch.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
(globalThis as any).performance ??= { now: () => Date.now() };
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight, endNight } from '../src/systems/night';
import { FIRST_CHAT } from '../src/data/voice';
import { chatDown } from '../src/systems/week';
import { updateLaunch, launchT, launchHolds, launchChatAt, launchChatTime, skipLaunch, launchSkipped, launchRate } from '../src/systems/launch';
import { stepLaunchSheet, LAUNCH_JUMP_SEC } from '../src/systems/launchSheet';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };

// --- the cue sheet, from the page's aoj.js (the one source) ---
const src = readFileSync(new URL('../src/render/page/aoj.js', import.meta.url), 'utf8');
const a = src.indexOf('const LAUNCH_SOUND = ['), b = src.indexOf('\n', src.indexOf('const LAUNCH_MUSIC', a));
const sheet = runInNewContext(src.slice(a, b) + '\n({ sound: LAUNCH_SOUND, loops: LAUNCH_LOOPS, music: LAUNCH_MUSIC })') as { sound: [number, string, string][]; loops: [string, number, number, number, number][]; music: { cue: string; at: number; end: number } };
ok(sheet.sound.length >= 45 && sheet.sound.length <= 70, `the cue sheet: ${sheet.sound.length} cues (about 50)`);
const strike = sheet.sound.find(c => c[1] === 'aoj_strike');
ok(!!strike && Math.abs(strike[0] - 21.15) < 1e-9, 'the strike at 21.15 s (the second bolt, the theme\'s downbeat; 19.15 before the developer\'s logo held longer, #151, #153)');
ok(sheet.music.cue === 'aoj_theme' && sheet.music.at === 6.2 && sheet.music.end > 41, 'the theme from 6.2 s to after the town is in');
ok(sheet.loops.some(([c, from, to]) => c === 'rain' && from === 17 && to < T.LAUNCH_SEC), 'the rain under the title, the login and the loading');
ok(sheet.sound.every(([at]) => at > 0 && at < T.LAUNCH_SEC), 'every cue inside the launch');
const sorted = [...sheet.sound].sort((x, y) => x[0] - y[0]);

// played at speed: 60 fps with now and then a hitch up to the loop's clamp (0.25 s): each cue once, in time order
let fired: [number, string][] = [], t = 0;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
while (t < 42) { const dt = rnd() < 0.03 ? 0.25 : 1 / 60; stepLaunchSheet(sorted, t, t + dt, (at, cue) => fired.push([at, cue])); t += dt; }
ok(fired.length === sheet.sound.length, `at speed: ${fired.length} of ${sheet.sound.length} fired`);
ok(fired.every((f, k) => k === 0 || f[0] >= fired[k - 1][0]), 'in order');
ok(new Set(fired.map(f => f.join())).size === fired.length || fired.length === sheet.sound.length, 'each once');
// a jump (the skip) fires nothing it passes
fired = [];
for (t = 0; t < 10; t += 1 / 60) stepLaunchSheet(sorted, t, t + 1 / 60, (at, cue) => fired.push([at, cue]));
const before = fired.length;
stepLaunchSheet(sorted, 10, 40, (at, cue) => fired.push([at, cue]));
ok(fired.length === before && 40 - 10 > LAUNCH_JUMP_SEC, 'a jump from 10 s to 40 s fires nothing it jumps over');

// --- when it plays: the first Monday only ---
S.g = initialState(); S.g.day = 0; startNight();
ok(!!S.g.voice?.launch && S.g.voice.chat === FIRST_CHAT && S.g.howto, 'the first Monday: the boys\' first chat with the launch');
const run = (sec: number, dt = 1 / 60) => { for (let k = 0; k < Math.round(sec / dt); k++) updateLaunch(dt); };
run(0.5);
ok(Math.abs(launchT() - 0.5) < 0.02 && launchHolds(), 'its clock runs from when the chat comes up; it holds the night');
const n = N(), clock0 = n.clock;
S.g.paused = true; run(3); S.g.paused = false;
ok(Math.abs(launchT() - 0.5) < 0.02, 'pause stops it');
// the chat paced to it: eight bubbles (#133: four to read while it boots; #135: Mike's Tab tip gone, the How-to cards
// teach it), each after 1.6 s of the typing dots, none over the developer's scroller and the title's heavy sounds (15 to 23 s), the last 3 s
// before the town comes in (#135)
const at = T.CHAT_LAUNCH_AT;
ok(at.length === FIRST_CHAT.length && at.join() === '2.6,5,8.4,10.2,12.8,23.4,29.6,37' && T.CHAT_LAUNCH_TYPING === 1.6, 'one arrival time per bubble');
ok(at.every((a2, k) => k === 0 || a2 - T.CHAT_LAUNCH_TYPING >= at[k - 1]), 'each one types after the one before has landed');
ok(!at.some(a2 => a2 > 15 && a2 - T.CHAT_LAUNCH_TYPING < 23.4 - T.CHAT_LAUNCH_TYPING), 'nothing lands on the developer\'s scroller or the title (15 to 23 s)');
const loginReal = (t: number) => t <= T.LAUNCH_FAST_FROM ? t - T.LAUNCH_LOGIN_AT : T.LAUNCH_FAST_FROM - T.LAUNCH_LOGIN_AT + (Math.min(t, T.LAUNCH_SEC) - T.LAUNCH_FAST_FROM) / launchRate(T.LAUNCH_FAST_FROM, T.LAUNCH_LOGIN_AT);   // a login night's T in real seconds (#149)
ok(Math.abs(T.LAUNCH_SEC - at[at.length - 1] - 3) < 1e-9 && Math.abs(loginReal(T.LAUNCH_SEC) - loginReal(T.CHAT_LOGIN_TO) - 3) < 1e-9, 'the chat ends 3 real s before the town comes in (the first Monday and the login nights)');
ok(!FIRST_CHAT.some(c => /tab to excel/i.test(c[1])) && FIRST_CHAT[FIRST_CHAT.length - 1][1].startsWith('11 sharp'), 'no Tab tip (the How-to cards have it); Billy\'s 11 sharp is the last');
const shownAt = (s: number) => launchChatAt(FIRST_CHAT, s);
ok(shownAt(0.9).shown === 0 && shownAt(0.9).typing === null && shownAt(1.1).typing === 'Billy' && shownAt(2.61).shown === 1, 'Billy types from 1.0 s, his bubble lands at 2.6');
ok(shownAt(4.0).typing === 'Mike' && shownAt(12.81).shown === 5, 'four lines to read while it boots, all in by 12.8 s');
ok(shownAt(22).shown === 5 && shownAt(22).typing === 'Lance' && shownAt(23.41).shown === 6, 'Lance\'s at 23.4, clear of the title\'s sounds');
ok(shownAt(28.5).typing === 'Lance' && shownAt(29.61).shown === 7, 'Lance types while the nine stars go in (27.9 to 28.9 s), lands at 29.6');
ok(shownAt(36.99).shown === 7 && shownAt(37.01).shown === 8 && shownAt(38).typing === null, 'Billy\'s lands at 37.0, the last');
run(39.4);
ok(launchT() > 39.85 && launchT() < 40 && launchHolds() && !!S.g.voice, 'just before 40 s: still loading, the chat still up');
ok(n.clock === clock0, 'the night\'s clock waits all through it');
ok(!n.log.some(l => l.text.startsWith('Welcome to Age of Judgment')), 'no welcome line before the town is in');
run(0.2);
ok(!launchHolds() && n.log.some(l => l.text.startsWith('Welcome to Age of Judgment') && l.tag === 'GAME'), 'at 40 s: the welcome in the feed');
ok(!!S.g.voice && !launchHolds(), 'and the phone stays up: Let\'s go is there now, the player clicks it (#142)');
run(3); ok(!!S.g.voice, 'it waits for the player');
chatDown();
ok(!S.g.voice && S.g.howto === true && S.g.boysThread?.length === FIRST_CHAT.length + 1 && S.g.boysThread[1].text === "Billy: yo. realm's up", "Let's go: the chat in The Boys', the How-to cards next");
// the skip (F1)
S.g = initialState(); S.g.day = 0; startNight(); run(5);
skipLaunch();
run(1 / 60);
ok(launchT() >= T.LAUNCH_SEC && !launchHolds() && launchSkipped() && !!S.g.voice, 'Skip the launch: straight to its end, Let\'s go up');

// --- every night after the first Monday: from the login (Paweł, 2026-11-27): the replays and week two too ---
const fromLogin = (setup: () => void) => { setup(); startNight(); run(1 / 60); return S.g.voice; };
let v = fromLogin(() => { S.g = initialState(); S.g.day = 0; startNight(); S.g.howto = false; S.g.voice = null; N().mood = T.MOOD_MAX; endNight('unplugged'); });
ok(!!v && v.launch === 'login' && v.date === 'Monday, again' && launchT() >= T.LAUNCH_LOGIN_AT && launchT() < T.LAUNCH_LOGIN_AT + 0.1, 'Monday\'s replay: the replay\'s chat, the launch from the login (T 25)');
ok([1, 2, 3, 4, 5, 6].every(d => { const w = fromLogin(() => { S.g = initialState(); S.g.day = d; }); return w?.launch === 'login' && w.chat.length === 3 && launchT() >= 25 && launchT() < 25.1; }), 'Tuesday to Sunday: their three bubbles with the launch from the login');
v = fromLogin(() => { S.g = initialState(); S.g.day = 7; });
ok(!!v && v.launch === 'login' && v.chat.length === 0, 'week two: the login plays (no news from the boys, only the loading pill)');
// the chat spread evenly from 26.6 to 29.4 s (before Log in is pressed at 30.0), each after up to 1.6 s of typing
S.g = initialState(); S.g.day = 1; startNight(); run(1 / 60);
const chat3 = S.g.voice!.chat, at3 = (s: number) => launchChatAt(chat3, s, T.LAUNCH_LOGIN_AT);
ok(at3(25.01).typing === chat3[0][0] && at3(26.59).shown === 0 && at3(26.61).shown === 1, 'the first lands at 26.6 (typing from the start)');
ok(at3(27.99).shown === 1 && at3(28.01).shown === 2 && at3(29.39).shown === 2 && at3(29.41).shown === 3, 'then 28.0 and 29.4');
ok(T.CHAT_LOGIN_TO < T.LAUNCH_FAST_FROM, 'all of it lands before the fast part (none flies by unread)');
const rep = ['a', 'b', 'c', 'd'].map(x => [x, x] as [string, string]);
ok(Math.abs(launchChatTime(1, 4, 25) - (26.6 + 2.8 / 3)) < 1e-9 && launchChatTime(3, 4, 25) === 29.4, 'the replay\'s four: 26.6, 27.5, 28.5 and 29.4');
ok(launchChatAt(rep, 29.41, 25).shown === 4, 'all in by 29.4');
// the fast boot (#149, Paweł 2026-11-28): the login and the typing at their pace, then from the Log in press the
// connecting, verified and the loading bar in LAUNCH_FAST_SEC; the first Monday at its own pace all through
ok(launchRate(27, 25) === 1 && launchRate(30.3, 25) === 1 && Math.abs(launchRate(32, 25) - (40 - 30.4) / 2) < 1e-9 && launchRate(40, 25) === 1, 'later nights: 1x through the typing, fast from 30.4 to the town, 1x after');
ok([5, 20, 30.4, 32, 39].every(t2 => launchRate(t2, 0) === 1), 'the first Monday: 1x all through (the long boot sets the mood)');
ok(T.LAUNCH_FAST_FROM > 30.35 && T.LAUNCH_FAST_FROM < 30.6, 'the fast part starts once the Log in button is up again (pressed 30.0 to 30.35)');
const lc0 = N().clock, r0 = launchT(); let real = 0;
while (launchHolds() && real < 20) { updateLaunch(1 / 60); real += 1 / 60; }
const want = T.LAUNCH_FAST_FROM - r0 + T.LAUNCH_FAST_SEC;
ok(Math.abs(real - want) < 0.05 && want < 8, `the town in ${real.toFixed(2)} real s from the chat coming up (was 15)`);
ok(N().clock === lc0, 'the night\'s clock waits all through it');
run(0.2);
ok(!launchHolds() && N().log.some(l => l.text.startsWith('Welcome to Age of Judgment')) && !!S.g.voice, 'at 40 s: the welcome, Let\'s go up');
chatDown(); ok(!S.g.voice && S.g.howto === true, 'Let\'s go: How to hide next (Tuesday\'s new tile)');
// its sound: nothing before T 25 fires (the stepper starts at the login's T); the fast part's frames are not jumps
fired = []; for (t = 25; t < 41;) { const r = launchRate(t, 25), d = (rnd() < 0.03 ? 0.1 : 1 / 60) * r; stepLaunchSheet(sorted, t, t + d, (at, cue) => fired.push([at, cue]), r); t += d; }
ok(fired.length > 0 && fired.every(([at2]) => at2 > 25) && fired.length === sheet.sound.filter(([at2]) => at2 > 25).length, `from the login: the ${fired.length} cues after 25 s fire at the fast pace, none before`);

console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
