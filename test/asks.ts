// The bath and her requests from the bathroom (fan-service steps 8 and 13, #93, #88): on the weekend her shower is a
// bath (her music through the door, ajar half the time); "Babe, bring my wine?" partway in, "Babe, towel!" as she gets
// out; bring it (away from the PC, Goodwill) or ignore it (she gets it herself by way of your door, Mood, catch rules).
// Run: npx tsx test/asks.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { on } from '../src/systems/week';
import { updateVisits } from '../src/systems/visits';
import { updatePre, cancelPre } from '../src/systems/preemptive';
import { takeAsk } from '../src/systems/asks';
import { hearing } from '../src/systems/apartment';
import { realLifeFree } from '../src/systems/reallife';
import { wet } from '../src/data/apartment';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (day = 5) => {
  S.g = initialState(); S.g.day = day; startNight(); S.g.howto = false;
  const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; n.apt.lastVisitEnd = 1e9; n.location = 'dungeon'; n.monitor = 'rpg'; n.tease.left = 0; n.tease.bedAt = 1e9;
  return n;
};
const run = (sec: number) => { for (let i = 0; i < sec * 60; i++) { updateVisits(1 / 60); updatePre(1 / 60); } };
const inBath = (kind: 'bath' | 'shower', t: number) => { const a = N().apt; a.activity = kind; a.room = 'bathroom'; a.moving = 0; a.t = t; a.cued = false; a.asleep = false; a.calm = 0; a.wineAt = -1; a.towelAsk = false; a.ajar = false; };

// --- the bath on the weekend ---
ok([5, 6].every(d => { S.g.day = d; return on('bath') && on('wine') && on('towelReq'); }) && [0, 1, 2, 3, 4].every(d => { S.g.day = d; return !on('bath'); }), 'the bath, the wine and the towel: Saturday and Sunday');
ok(wet('bath') && wet('shower') && !wet('tv'), 'in the water: the shower or the bath');
const seen = (day: number) => {
  let bath = 0, shower = 0;
  for (let k = 0; k < 40; k++) {
    const n = night(day); n.clock = T.SHOWER_FROM + 1; n.apt.lastVisitEnd = n.threat;
    for (let i = 0; i < 60 * 300 && !n.apt.showerUsed; i++) { updateVisits(1 / 60); n.apt.lastVisitEnd = n.threat; }
    if (n.apt.activity === 'bath') bath++; if (n.apt.activity === 'shower') shower++;
  }
  return [bath, shower];
};
const [sb, ss] = seen(5), [wb, ws] = seen(2);
ok(sb >= 36 && ss === 0, `Saturday after 21:30: a bath (${sb} of 40 nights within 5 minutes), never a shower`);
ok(wb === 0, `Wednesday: never a bath (${ws} showers of 40)`);
let n = night(5); inBath('bath', 130);
const h0 = hearing(); n.apt.ajar = true; const h1 = hearing();
ok(Math.abs(h0 - T.HEAR_DISTANCE.middle * T.HEAR_MASK.bath) < 1e-9 && Math.abs(h1 - h0 * T.BATH_AJAR_HEAR) < 1e-9, `her bath music covers some of your Noise (x${T.HEAR_MASK.bath}), with the door ajar she hears twice as much (x${T.HEAR_MASK.bath * T.BATH_AJAR_HEAR})`);
ok(!realLifeFree(), 'in the bath: real life waits (no phone, no dog, no visits)');

// --- the wine ---
n = night(5); inBath('bath', 120); n.apt.wineAt = 110;
run(10.1); ok(n.herAsk?.kind === 'wine' && n.apt.heardWhat === 'BABE, WINE?', '10 s in: "Babe, bring my wine?"');
const t0 = n.apt.t; run(3); ok(n.apt.t === t0, 'her bath waits while she asks');
const g0 = S.g.goodwill; takeAsk();
ok(!n.herAsk && n.pre?.id === 'wine' && n.pre.away && n.pre.max === T.WINE_AWAY_SEC, `Bring it to her: ${T.WINE_AWAY_SEC} s away from the PC`);
run(T.WINE_AWAY_SEC + 0.1); ok(!n.pre && Math.round(S.g.goodwill - g0) === T.ASK_GOODWILL && n.herThanks?.kind === 'wine', `back: Goodwill +${T.ASK_GOODWILL}, her thank-you`);
ok(n.apt.activity === 'bath' && n.apt.t < t0, 'and her bath goes on');

// --- the towel, ignored ---
n = night(5); inBath('shower', T.END_CUE_SEC + 1); n.apt.towelAsk = true;
run(1.1); ok(n.herAsk?.kind === 'towel', 'getting out: "Babe, towel!"');
const m0 = n.mood; run(T.ASK_SEC + 0.05);
ok(!n.herAsk && n.mood === m0 + T.ASK_IGNORE_MOOD && n.visit.stage !== 'idle' && n.visit.kind === 'peek' && n.visit.ask === 'towel' && n.visit.from === 'shower', `ignored: Mood +${T.ASK_IGNORE_MOOD}, she comes to your door in her towel to get one (a peek)`);
for (let i = 0; i < 60 * 12 && n.visit.stage !== 'in'; i++) updateVisits(1 / 60);
updateVisits(1 / 60); ok(n.catches === 1, 'the game on screen when she looks in: caught (catch rules apply)');

// --- the towel, brought: then she finishes ---
n = night(6); inBath('bath', T.END_CUE_SEC + 1); n.apt.towelAsk = true; run(1.1); takeAsk();
ok(n.pre?.id === 'towel' && n.pre.max === T.TOWEL_AWAY_SEC, `Bring her a towel: ${T.TOWEL_AWAY_SEC} s away`);
run(T.TOWEL_AWAY_SEC + 0.2); ok(n.apt.cued, 'back: the drain, her bath is over');
run(T.END_CUE_SEC + 1); ok(n.apt.activity !== 'bath' || n.visit.stage !== 'idle', 'and she moves on');

// --- back early: you came back without it ---
n = night(5); inBath('shower', T.END_CUE_SEC + 1); n.apt.towelAsk = true; run(1.1); takeAsk(); run(2); const m1 = n.mood; cancelPre();
ok(!n.pre && n.mood === m1 + T.ASK_IGNORE_MOOD && n.visit.ask === 'towel', 'back early: she gets it herself');

// --- one at a time ---
n = night(5); inBath('bath', 100); n.apt.wineAt = 99; n.pre = { id: 'text', stage: 'doing', t: 5, max: 5, away: false, withHer: false, mult: 1, outcome: 'ok' }; n.action = 'pre';
for (let i = 0; i < 60 * 3; i++) updateVisits(1 / 60);
ok(!n.herAsk && n.apt.wineAt === 99, 'busy on your phone: she waits to ask');
n.pre = null; n.action = 'none'; run(0.1); ok(n.herAsk?.kind === 'wine', 'then asks');
// weekdays: the shower, no requests on Monday to Friday
n = night(4); inBath('shower', T.END_CUE_SEC + 1); n.apt.towelAsk = on('towelReq') && true; run(1.1); ok(!n.herAsk, 'Friday: no towel request');
console.log(fails ? `${fails} FAILED` : 'PASS');
