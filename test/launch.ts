// The launch on the first Monday (#127, the v2 redesign): when it plays, its clock, the chat paced to it, what it holds
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
import { updateLaunch, launchT, launchHolds, launchChatAt, skipLaunch, launchSkipped } from '../src/systems/launch';
import { stepLaunchSheet, LAUNCH_JUMP_SEC } from '../src/systems/launchSheet';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };

// --- the cue sheet, from the page's aoj.js (the one source) ---
const src = readFileSync(new URL('../src/render/page/aoj.js', import.meta.url), 'utf8');
const a = src.indexOf('const LAUNCH_SOUND = ['), b = src.indexOf('\n', src.indexOf('const LAUNCH_MUSIC', a));
const sheet = runInNewContext(src.slice(a, b) + '\n({ sound: LAUNCH_SOUND, loops: LAUNCH_LOOPS, music: LAUNCH_MUSIC })') as { sound: [number, string, string][]; loops: [string, number, number, number, number][]; music: { cue: string; at: number; end: number } };
ok(sheet.sound.length >= 55 && sheet.sound.length <= 70, `the cue sheet: ${sheet.sound.length} cues (about 60)`);
const strike = sheet.sound.find(c => c[1] === 'aoj_strike');
ok(!!strike && Math.abs(strike[0] - 19.15) < 1e-9, 'the strike at 19.15 s (the second bolt, the theme\'s downbeat)');
ok(sheet.music.cue === 'aoj_theme' && sheet.music.at === 6.2 && sheet.music.end > 39, 'the theme from 6.2 s to after the town is in');
ok(sheet.loops.some(([c, from, to]) => c === 'rain' && from === 15 && to < T.LAUNCH_SEC), 'the rain under the title, the login and the loading');
ok(sheet.sound.every(([at]) => at > 0 && at < T.LAUNCH_SEC), 'every cue inside the launch');
const sorted = [...sheet.sound].sort((x, y) => x[0] - y[0]);

// played at speed: 60 fps with now and then a hitch up to the loop's clamp (0.25 s): each cue once, in time order
let fired: [number, string][] = [], t = 0;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
while (t < 40) { const dt = rnd() < 0.03 ? 0.25 : 1 / 60; stepLaunchSheet(sorted, t, t + dt, (at, cue) => fired.push([at, cue])); t += dt; }
ok(fired.length === sheet.sound.length, `at speed: ${fired.length} of ${sheet.sound.length} fired`);
ok(fired.every((f, k) => k === 0 || f[0] >= fired[k - 1][0]), 'in order');
ok(new Set(fired.map(f => f.join())).size === fired.length || fired.length === sheet.sound.length, 'each once');
// a jump (the skip) fires nothing it passes
fired = [];
for (t = 0; t < 10; t += 1 / 60) stepLaunchSheet(sorted, t, t + 1 / 60, (at, cue) => fired.push([at, cue]));
const before = fired.length;
stepLaunchSheet(sorted, 10, 38, (at, cue) => fired.push([at, cue]));
ok(fired.length === before && 38 - 10 > LAUNCH_JUMP_SEC, 'a jump from 10 s to 38 s fires nothing it jumps over');

// --- when it plays: the first Monday only ---
S.g = initialState(); S.g.day = 0; startNight();
ok(!!S.g.voice?.launch && S.g.voice.chat === FIRST_CHAT && S.g.howto, 'the first Monday: the boys\' first chat with the launch');
const run = (sec: number, dt = 1 / 60) => { for (let k = 0; k < Math.round(sec / dt); k++) updateLaunch(dt); };
run(0.5);
ok(Math.abs(launchT() - 0.5) < 0.02 && launchHolds(), 'its clock runs from when the chat comes up; it holds the night');
const n = N(), clock0 = n.clock;
S.g.paused = true; run(3); S.g.paused = false;
ok(Math.abs(launchT() - 0.5) < 0.02, 'pause stops it');
// the chat paced to it: the bubbles at 2.6, 10.2, 21.4, 26.4 and 35.4 s, each after 1.6 s of the typing dots
const at = T.CHAT_LAUNCH_AT;
ok(at.length === FIRST_CHAT.length && at.join() === '2.6,10.2,21.4,26.4,35.4' && T.CHAT_LAUNCH_TYPING === 1.6, 'one arrival time per bubble');
const shownAt = (s: number) => launchChatAt(FIRST_CHAT, s);
ok(shownAt(0.9).shown === 0 && shownAt(0.9).typing === null && shownAt(1.1).typing === 'Billy' && shownAt(2.61).shown === 1, 'Billy types from 1.0 s, his bubble lands at 2.6');
ok(shownAt(20).shown === 2 && shownAt(20).typing === 'Lance' && shownAt(21.41).shown === 3, 'Lance\'s at 21.4, clear of the title\'s sounds');
ok(shownAt(35.39).shown === 4 && shownAt(35.41).shown === 5 && shownAt(37).typing === null, 'Mike\'s lands at 35.4, the last');
run(37.4);
ok(launchT() > 37.85 && launchT() < 38 && launchHolds() && !!S.g.voice, 'just before 38 s: still loading, the chat still up');
ok(n.clock === clock0, 'the night\'s clock waits all through it');
ok(!n.log.some(l => l.text.startsWith('Welcome to Age of Judgment')), 'no welcome line before the town is in');
run(0.2);
ok(!launchHolds() && n.log.some(l => l.text.startsWith('Welcome to Age of Judgment') && l.tag === 'GAME'), 'at 38 s: Let\'s go, and the welcome in the feed');
// the skip (F1)
S.g = initialState(); S.g.day = 0; startNight(); run(5);
skipLaunch();
ok(launchT() >= T.LAUNCH_SEC && !launchHolds() && launchSkipped(), 'Skip the launch: straight to its end');

// --- not on the replay, not on later nights, not in week two ---
S.g = initialState(); S.g.day = 0; startNight(); S.g.howto = false; S.g.voice = null; N().mood = T.MOOD_MAX; endNight('unplugged'); startNight();
ok(!!S.g.voice && !S.g.voice.launch && S.g.voice.date === 'Monday, again', 'Monday\'s replay: the replay\'s chat, no launch');
ok([1, 2, 3, 4, 5, 6].every(d => { S.g = initialState(); S.g.day = d; startNight(); return !S.g.voice?.launch; }), 'Tuesday to Sunday: no launch');
S.g = initialState(); S.g.day = 7; startNight();
ok(!S.g.voice, 'week two\'s Monday: no chat, no launch');

console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
