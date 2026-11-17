// Courier and the boys' group call (#23): each outcome lands as designed.
// Run: npx tsx test/calls.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState, RARITIES } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { spawnInterrupt, openPhone, answerSlide, talkPick, updateInterrupts, declineCall } from '../src/systems/interrupts';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const fresh = () => { S.g = initialState(); startNight(); const n = N(); n.nextInterruptAt = 1e9; n.noise = 0; return n; };
const pick = (kind: 'courier' | 'friends') => { spawnInterrupt(kind); openPhone(); answerSlide(1); };
const tick = (sec: number) => { for (let i = 0; i < sec * 60; i++) updateInterrupts(1 / 60); };

let n = fresh(); pick('courier'); talkPick(n.game!.need); talkPick(n.game!.need);
const got = n.dropQueue[n.dropQueue.length - 1];
ok(got?.kind === 'item' && RARITIES.indexOf(got.item.rarity) >= 2, `courier, two right replies: a ${got?.kind === 'item' ? got.item.rarity : '?'} parcel in the bag queue`);
n = fresh(); pick('courier'); talkPick((n.game!.need + 1) % 3); ok(!n.game && !n.dropQueue.length, 'courier, one wrong reply: he leaves, no parcel');
n = fresh(); spawnInterrupt('courier'); tick(T.COURIER_TIMER + 0.1); ok(!n.interrupts.length && !n.dropQueue.length && n.noise === 0, 'courier ignored: parcel lost, nothing else');

n = fresh(); pick('friends'); tick(2); const spk = n.noise; ok(Math.abs(spk - 2 * T.FRIENDS_SPEAKER_NOISE) < 0.5, `the boys on speaker: Noise ${spk.toFixed(1)} after 2 s`);
talkPick(n.game!.need); talkPick(n.game!.need);
ok(n.partyBuffs.some(b => b.name === 'Raid buff' && b.dmg === T.FRIENDS_BUFF_DMG), 'the boys, two polite replies: Raid buff');
n = fresh(); n.headset = true; pick('friends'); tick(2); ok(n.noise === 0, 'headset on: the call is in your ears, no Noise');
n = fresh(); pick('friends'); n.noise = 0; talkPick((n.game!.need + 1) % 3); ok(n.noise === T.FRIENDS_RUDE_NOISE && !!n.game, 'one rude reply: louder, still on the call');
talkPick((n.game!.need + 1) % 3); ok(!n.game && n.noise >= T.FRIENDS_RUDE_NOISE * 2 + T.FRIENDS_FAIL_NOISE, `two rude replies: they hang up and Discord rings (Noise ${Math.round(n.noise)})`);
n = fresh(); spawnInterrupt('friends'); tick(T.FRIENDS_TIMER + 0.1); ok(n.noise === T.FRIENDS_FAIL_NOISE, `the boys ignored: Noise +${n.noise}`);
n = fresh(); n.headset = true; spawnInterrupt('friends'); tick(T.FRIENDS_TIMER + 0.1); ok(n.noise === 0, 'ignored with the headset on: it rings in your ears');
n = fresh(); spawnInterrupt('friends'); declineCall(); ok(n.noise === T.FRIENDS_DECLINE_NOISE, `declined: group chat spam, Noise +${n.noise} (less than ignoring)`);

n = fresh(); let made = 0; for (let i = 0; i < 6; i++) { if (spawnInterrupt('friends')) made++; n.interrupts = []; }
ok(n.callsTonight.friends === 6, 'debug spawns ignore the cap (explicit kind)');
n = fresh(); n.clock = T.COURIER_UNTIL + 1; const seen = new Set<string>(); for (let i = 0; i < 300; i++) { spawnInterrupt(); seen.add(n.interrupts[0]?.kind ?? '-'); n.interrupts = []; }
ok(!seen.has('courier'), `after 22:00 no courier (saw ${[...seen].join(', ')})`);
ok((n.callsTonight.friends ?? 0) <= T.INTERRUPT_PER_NIGHT.friends, `the boys at most ${T.INTERRUPT_PER_NIGHT.friends} a night (${n.callsTonight.friends})`);
console.log(fails ? `${fails} FAILED` : 'PASS');
