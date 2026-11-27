// The smart home and the phone battery (step 6, #57): the battery night by night, what drains it, low and dead, Charge,
// the New phone, and each device's rule (the vacuum, the speakers, the TV cast, the door seal, bubble tea).
// Run: npx tsx test/home.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState, type ActivityId, type Room } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { ACT_BY_ID } from '../src/data/apartment';
import { battOn, battery, battCost, drain, phoneDead, useDevice, orderTea, deviceBlocked, deviceState, updateHome } from '../src/systems/home';
import { hearing, updateApartment } from '../src/systems/apartment';
import { updateInterrupts, spawnInterrupt, openPhone } from '../src/systems/interrupts';
import { updateVisits } from '../src/systems/visits';
import { shopState } from '../src/systems/shop';
import { rules } from '../src/systems/week';
import { step } from '../src/core/loop';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (day = 3, act: ActivityId = 'tv', room?: Room) => {
  S.g = initialState(); S.g.day = day; S.g.owned.push('vacuum', 'speaker', 'tv', 'seal'); startNight(); S.g.howto = false;
  const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; n.apt.lastVisitEnd = 1e9;
  n.apt.activity = act; n.apt.room = room ?? ACT_BY_ID[act].room; n.apt.moving = 0; n.apt.t = 999; n.apt.asleep = false;
  return n;
};
const home = (sec: number) => { for (let i = 0; i < sec * 30; i++) { N().threat += 1 / 30; updateHome(1 / 30); } };

// --- the battery, by night ---
let n = night(2); ok(!battOn() && battery() === 100 && shopState('vacuum') === 'soon', 'Wednesday: no battery, no devices to buy');
n = night(3); ok(battOn() && n.home.batt === 100 && shopState('phone') !== 'soon', 'Thursday: 100%, the Shop sells the devices and the New phone');
// a call or text you answer: 2%
spawnInterrupt('boss', true); openPhone(); ok(n.home.batt === 100 - T.BATTERY_ANSWER, `a text answered: -${T.BATTERY_ANSWER}%`);
// the New phone
n = night(); S.g.owned.push('phone'); ok(battCost(T.HOME_BATT.vacuum) === Math.round(20 * T.NEW_PHONE_DRAIN), `the New phone: the vacuum takes ${battCost(T.HOME_BATT.vacuum)}%`);
// low at 20% and 10%, dead at 0
n = night(); n.home.batt = 24; drain(T.HOME_BATT.seal); ok(n.home.lowShow > 0 && n.home.lowAt === 20, '20%: the desk phone wakes, crimson');
n.home.lowShow = 0; n.home.batt = 12; drain(T.HOME_BATT.seal); ok(n.home.lowShow > 0 && n.home.lowAt === 10, '10%: again');
n.home.batt = 4; drain(T.HOME_BATT.seal); ok(phoneDead() && n.home.deadShow > 0, 'dead at 0%');
ok(deviceBlocked('vacuum') === 'The phone is dead' && deviceBlocked('tea') === 'The phone is dead', 'dead: no Home app');
ok(!spawnInterrupt('courier', true) && !spawnInterrupt('text', true), 'dead: no calls, no texts');
n.phoneScript = [{ kind: 'mom', at: 0, done: false }]; n.threat = 999; const m0 = n.mood; updateInterrupts(1 / 30);
ok(n.phoneScript[0].done && n.mood > m0, `dead: Mom's call counts as ignored (Mood +${n.mood - m0}: she calls your girlfriend)`);
n.phoneScript = [{ kind: 'friends' as 'mom', at: 0, done: false }]; const no0 = n.noise; updateInterrupts(1 / 30); ok(n.noise > no0, 'dead: the boys call Discord on the PC instead (Noise)');
ok(deviceBlocked('seal') === 'The phone is dead', 'not enough battery for anything');

// --- the vacuum ---
n = night(3, 'tea'); let c0 = n.apt.calm;
ok(useDevice('vacuum', 'kitchen') && n.home.batt === 80 && n.apt.calm === c0 + T.VACUUM_CALM, 'the vacuum in her room: -20%, her next visit 45 s later');
ok(deviceState('vacuum') === 'running' && deviceBlocked('vacuum') === 'Running', 'it runs');
home(T.APT_MOVE_SEC + 2); ok(typeof deviceState('vacuum') === 'number' && deviceBlocked('vacuum') === 'Resting', 'she stops it; it rests');
home(T.VACUUM_REST); ok(deviceState('vacuum') === 'ready', `ready again after ${T.VACUUM_REST / 60} min`);
n = night(3, 'tea'); n.home.vac = null; useDevice('vacuum', 'bathroom'); ok(n.apt.calm >= T.VACUUM_CALM, 'next door (the bath, she is in the kitchen): she goes');
n = night(3, 'tea'); useDevice('vacuum', 'living'); ok(n.apt.calm === 0 && n.apt.room === 'kitchen', 'the living room, she is in the kitchen: nothing');
n = night(3, 'phone'); n.apt.asleep = true; useDevice('vacuum', 'bedroom'); ok(n.apt.calm === 0, 'asleep: she sleeps through it');

// --- the speakers ---
n = night(3, 'tv'); useDevice('speaker', 'kitchen');
ok(n.apt.calm === T.SPEAKER_CALM && n.apt.room === 'kitchen' && n.apt.moving > 0 && n.home.batt === 90, 'a timer in the kitchen: she goes to check it, next visit 30 s later, -10%');
ok(deviceBlocked('speaker') === 'Resting', 'the pair rests together');
const mm = n.mood; n.home.rest = {}; useDevice('speaker', 'bathroom'); n.home.rest = {}; useDevice('speaker', 'kitchen');
ok(n.mood === mm + T.SPEAKER_MOOD, `the 3rd timer tonight: Mood +${T.SPEAKER_MOOD}`);

// --- the TV cast ---
n = night(3, 'tv'); n.apt.t = 2; n.apt.cued = true; useDevice('tv');
ok(n.apt.t > 10 && !n.apt.cued && n.home.batt === 92, 'at the credits: one more episode (-8%)');
n = night(3, 'tv'); n.apt.t = 20; n.apt.cued = false; useDevice('tv'); ok(n.apt.t === 20 && n.home.batt === 92, 'mid-episode: nothing happens, the use and the battery are gone');
n.home.rest = {}; useDevice('tv'); n.home.rest = {}; const mt = n.mood; useDevice('tv');
ok(n.mood === mt + T.TV_NOTICE_MOOD && n.apt.forceDoor, 'the 3rd time she notices: Mood +10, she comes to your door');

// --- the door seal: the towel's effect and downside ---
n = night(3, 'tv'); const h0 = hearing(); useDevice('seal');
ok(n.seal && Math.abs(hearing() / h0 - (1 - T.SEAL_NOISE)) < 1e-9 && n.home.batt === 96, `sealed: your Noise reaches her ${Math.round(hearing() / h0 * 100)}%, -4%`);
n.apt.t = 10; n.apt.cued = true; for (let i = 0; i < 60; i++) updateApartment(1 / 60);
ok(Math.abs(n.apt.t - (10 - (1 - T.SEAL_SLOW) * rules().visits)) < 0.02, 'her routine runs 30% slower');
useDevice('seal'); ok(!n.seal && n.home.batt === 92, 'unsealed: another 4%');
n = night(3, 'tv'); useDevice('seal'); n.visit.stage = 'handle'; n.visit.t = 0.001; n.visit.kind = 'peek'; n.monitor = 'excel'; const ms = n.mood; updateVisits(1 / 60); updateVisits(1 / 60);
ok((n.say ?? []).some(l => l.text.includes('Why is your door sealed')) && n.mood === ms + T.SEAL_SEEN_MOOD + T.PEEK_PASS_MOOD, 'she asks about it on every visit (Mood +5, then the pass)');

// --- bubble tea ---
n = night(3, 'tv'); const z0 = S.g.zl = 100;
ok(orderTea() && S.g.zl === z0 - T.SHOP_ZL.tea && n.home.batt === 94 && n.home.bells.length === 1, 'ordered: 25 zł, -6%, the doorbell coming');
n.lastDemand = -99; home(T.TEA_DELAY_SEC - 1); ok(n.home.bells.length === 1, 'not yet');
home(2); ok(!n.home.bells.length && n.apt.calm >= T.TEA_CALM - 1 && n.apt.room === 'living', 'the doorbell: she takes it to the couch, no visits for 120 s');
orderTea(); ok(!orderTea() && deviceBlocked('tea') === `${T.TEA_MAX} of ${T.TEA_MAX} tonight`, 'twice a night');
n = night(3, 'tv'); S.g.zl = 100; orderTea(); n.interrupts.push({ kind: 'courier', t: 99, max: 99, msgs: [], pend: [], pingAt: -9 }); home(T.TEA_DELAY_SEC + 5);
ok(n.home.bells.length === 1, 'the collision rule: it slides later while the phone rings');
n.interrupts = []; n.lastDemand = -99; home(1); ok(!n.home.bells.length, '...and rings once it is free');
n = night(3, 'phone'); S.g.zl = 100; orderTea(); n.apt.asleep = true; n.lastDemand = -99; home(T.TEA_DELAY_SEC + 1);
ok(n.apt.wake >= T.TEA_WAKE && n.apt.calm === 0, 'asleep: the doorbell wakes her a bit');

// --- not installed, the real loop ---
n = night(); S.g.owned = []; ok(deviceBlocked('vacuum') === 'Not installed', 'a device you did not buy');
n = night(4); for (let i = 0; i < 30 * 20; i++) step(1 / 30); ok(S.g.screen === 'night' && n.home.batt === 100, 'a Friday runs with the battery at 100%');
console.log(fails ? `${fails} FAILED` : 'all passed');
