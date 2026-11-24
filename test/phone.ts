// The phone (#54, 3.2): a night script, one demand at a time, only calls buzz, speaker or pick up, Do Not Disturb,
// and what each event pays or costs. Run: npx tsx test/phone.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { spawnInterrupt, openPhone, answerSlide, answerSpeaker, talkPick, momReply, bossPick, updateInterrupts, declineCall, togglePhoneDown } from '../src/systems/interrupts';
import { updateRealLife, realLifeFree } from '../src/systems/reallife';
import { battleEnded, partyCdMult } from '../src/systems/curios';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const fresh = () => {
  S.g = initialState(); startNight(); S.g.howto = false;
  const n = N(); n.noise = 0; n.dog.next = 1e9; n.threat = 100; n.lastDemand = 0;
  return n;
};
const tick = (sec: number) => { const n = N(); for (let i = 0; i < sec * 60; i++) { n.threat += 1 / 60; updateRealLife(); updateInterrupts(1 / 60); } };
const hhmm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

// --- the script ---
let n = fresh();
ok(n.phoneScript.length === 3, `tonight's script: ${n.phoneScript.map(s => `${s.kind} ${hhmm(s.at)}`).join(', ')}`);
ok(n.phoneScript.every(s => s.at >= T.PHONE_SCRIPT[s.kind][0] && s.at <= T.PHONE_SCRIPT[s.kind][1]), 'each event in its window');
ok(n.friendsLeft >= T.FRIENDS_PER_NIGHT[0] && n.friendsLeft <= T.FRIENDS_PER_NIGHT[1], `the boys: ${n.friendsLeft} call(s) tonight`);
n = fresh(); n.threat = 10; n.clock = 23 * 60; tick(1); ok(!n.interrupts.length, `nothing before ${T.PHONE_FIRST_SEC} s into the night`);
n = fresh(); n.clock = n.phoneScript[0].at; tick(0.1); ok(n.interrupts[0]?.kind === n.phoneScript[0].kind && n.phoneScript[0].done, 'the first event arrives at its time');

// --- one demand at a time ---
n = fresh(); n.clock = n.phoneScript[0].at; n.dog.stage = 'up'; tick(2); ok(!n.interrupts.length, 'the dog is up: the phone waits');
n.dog.stage = 'away'; tick(T.REAL_LIFE_GAP_SEC - 1); ok(!n.interrupts.length, `then ${T.REAL_LIFE_GAP_SEC} s apart`);
tick(1.5); ok(n.interrupts.length === 1, 'then it arrives (slid later, never dropped)');
n = fresh(); n.clock = n.phoneScript[0].at; n.visit.stage = 'hall'; tick(1); ok(!n.interrupts.length, 'her footsteps: no new phone event');
n = fresh(); n.clock = n.phoneScript[0].at; n.apt.activity = 'shower'; tick(1); ok(!n.interrupts.length, 'her shower: no new phone event');
n = fresh(); n.clock = n.phoneScript[0].at; n.apt.calm = 30; tick(1); ok(!n.interrupts.length, 'a calm you earned: no new phone event');
n = fresh(); n.enemies = [{ wind: 2 } as never]; ok(!realLifeFree(), 'a boss wind-up: real life waits');
n = fresh(); n.clock = n.phoneScript[0].at; tick(0.1); ok(!realLifeFree(), 'a ringing phone: the dog waits too');
n = fresh(); n.dog.stage = 'up'; ok(spawnInterrupt('text'), 'her text only waits for the phone itself');

// --- only calls buzz; texts wait a minute ---
n = fresh(); spawnInterrupt('boss', true); ok(n.interrupts[0].max === T.TEXT_DEADLINE_SEC, `texts wait ${T.TEXT_DEADLINE_SEC} s on the lock screen`);

// --- each event ---
n = fresh(); spawnInterrupt('boss', true); openPhone(); n.game!.stage = 'chat';
ok(n.game!.rows.length === T.BOSS_ROWS, `the boss asks ${T.BOSS_ROWS} row of sums`);
const zl = S.g.zl, gold = S.g.gold, r = n.game!.rows[0]; bossPick(r.a + r.b);
ok(S.g.zl === zl + T.BOSS_ZL && S.g.gold === gold, `the boss answered: +${T.BOSS_ZL} zł, no gold`);
n = fresh(); const mood = n.mood; spawnInterrupt('boss', true); tick(T.TEXT_DEADLINE_SEC + 0.1); ok(n.mood === mood && !n.interrupts.length, 'the boss ignored: nothing happens');
n = fresh(); S.g.heroes[1].downed = true; S.g.heroes[1].hp = 0; S.g.heroes[0].hp = 1; spawnInterrupt('mom', true); openPhone(); answerSlide(1);
for (let b = 0; b < T.MOM_BEATS; b++) { const g = n.game; if (!g) break; g.read = 0; g.sweep = g.zone + 0.01; momReply(g.need); }
ok(!n.game && S.g.heroes.every(h => !h.downed && h.hp > 1), `Mom, ${T.MOM_BEATS} beats: party healed, the fallen get up`);
n = fresh(); const m0 = n.mood; spawnInterrupt('mom', true); tick(T.MOM_TIMER + 0.1); ok(n.mood === m0 + T.MOM_FAIL_MOOD, 'Mom ignored: she calls your girlfriend');
n = fresh(); spawnInterrupt('mom', true); declineCall(); ok(n.momCallback > 0, 'Mom declined: she calls back once');
n = fresh(); spawnInterrupt('courier', true); openPhone(); answerSlide(1); talkPick(n.game!.need); talkPick(n.game!.need);
ok(n.partyBuffs.some(b => b.name === 'Gaming mouse' && b.night) && Math.abs(partyCdMult() - (1 - T.COURIER_MOUSE_CD)) < 1e-9 && !n.dropQueue.length, 'the courier: a gaming mouse, cooldowns down until dawn, no loot');
battleEnded(true); ok(n.partyBuffs.some(b => b.name === 'Gaming mouse'), 'the mouse outlasts a boss');
n = fresh(); spawnInterrupt('friends', true); openPhone(); answerSlide(1); talkPick(n.game!.need); talkPick(n.game!.need);
ok(n.partyBuffs.some(b => b.name === 'Raid buff' && b.untilBoss), 'the boys: Raid buff');
battleEnded(false); ok(n.partyBuffs.some(b => b.name === 'Raid buff'), 'it lasts through normal fights');
battleEnded(true); ok(!n.partyBuffs.some(b => b.name === 'Raid buff'), 'and ends with the boss fight');
n = fresh(); spawnInterrupt('friends', true); tick(T.FRIENDS_TIMER + 0.1); ok(n.noise === T.FRIENDS_FAIL_NOISE, `the boys ignored: Noise +${n.noise}`);
n = fresh(); n.friendsLeft = 2; n.location = 'dungeon'; n.floor = T.CHECKPOINT_EVERY - 1; n.phase = 'walk'; n.phoneScript = []; tick(0.1);
ok(n.interrupts[0]?.kind === 'friends' && n.friendsLeft === 1, 'the boys call on the floor before a boss floor');
n.interrupts = []; tick(T.REAL_LIFE_GAP_SEC + 1); ok(!n.interrupts.length, 'once a floor');

// --- speaker or pick up ---
n = fresh(); spawnInterrupt('friends', true); openPhone(); ok(n.action === 'miniGame', 'picked up: hands busy');
n = fresh(); spawnInterrupt('friends', true); answerSpeaker(); ok(n.action === 'none' && !!n.game?.speaker && n.game.stage === 'talk', 'speaker from the desk: hands free, the call is on');
tick(2); ok(Math.abs(n.noise - 2 * T.SPEAKER_NOISE) < 0.5, `on speaker: Noise ${n.noise.toFixed(1)} after 2 s`);
n = fresh(); n.headset = true; spawnInterrupt('mom', true); answerSpeaker(); tick(1); ok(n.noise === 0, 'speaker with the headset on: in your ears, no Noise');
n = fresh(); spawnInterrupt('courier', true); openPhone(); answerSlide(1); tick(2); ok(n.noise === 0, 'picked up: quiet');

// --- face-down: Do Not Disturb ---
n = fresh(); togglePhoneDown(); spawnInterrupt('boss', true); tick(T.TEXT_DEADLINE_SEC + 0.1); ok(!n.interrupts.length && n.phoneDown > 0, 'face-down: the boss runs out (ignored), the phone stays down');
n = fresh(); togglePhoneDown(); const m1 = n.mood; spawnInterrupt('mom', true); tick(T.MOM_TIMER + 0.1); ok(n.mood === m1 + T.MOM_FAIL_MOOD, 'face-down: a missed Mom call counts as ignored (she calls your girlfriend)');

console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
