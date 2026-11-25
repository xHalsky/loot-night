// Goodwill (#29, part 2): earned, spent on Forgiveness and the Raid pass, half carries over.
// Run: npx tsx test/goodwill.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { rules } from '../src/systems/week';
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { startVisit, updateVisits, cuddleDone } from '../src/systems/visits';
import { startPre, updatePre, preBlocked } from '../src/systems/preemptive';
import { updateApartment } from '../src/systems/apartment';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const fresh = (gw = 0) => { S.g = initialState(); S.g.day = 4; startNight(); S.g.goodwill = gw; const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; return n; };
const catchNow = (n: ReturnType<typeof fresh>) => { n.monitor = 'rpg'; n.mood = T.MOOD_GREEN + 5; startVisit(false, 'peek'); n.visit.stage = 'handle'; n.visit.t = 0.01; for (let i = 0; i < 10; i++) updateVisits(1 / 60); n.visit.stage = 'idle'; };

let n = fresh(); startVisit(false, 'cuddle'); n.visit.stage = 'in'; cuddleDone(1); ok(S.g.goodwill === T.GOODWILL_CUDDLE, `a good cuddle: Goodwill ${S.g.goodwill}`);
n = fresh(30); catchNow(n); ok(n.catches === 1 && S.g.goodwill === 30 + T.GOODWILL_CATCH, `caught: Goodwill ${S.g.goodwill}`);
n = fresh(70); catchNow(n); ok(n.catches === 0 && S.g.goodwill === 70 - T.GOODWILL_FORGIVE && !n.everCaught, `Goodwill 70, caught: forgiven, no catch counts (Goodwill ${S.g.goodwill})`);
S.g.goodwill = 90; catchNow(n); ok(n.catches === 1, '...but only once a night');

n = fresh(30); ok(!!preBlocked('raid'), `Raid pass with 30 Goodwill: "${preBlocked('raid')}"`);
n = fresh(50); startPre('raid'); for (let i = 0; i < 4 * 60; i++) updatePre(1 / 60);
ok(n.apt.calm === T.RAID_CALM_SEC && !!n.apt.calmHard && S.g.goodwill === 50 - T.GOODWILL_RAID, `Raid pass: calm ${n.apt.calm} s, Goodwill ${S.g.goodwill}`);
n.noise = 100; n.apt.activity = 'tv'; n.apt.room = 'living'; n.apt.moving = 0; updateApartment(1 / 60);
ok(n.apt.calm > 0 && !n.apt.forceDoor, '...and full Noise does not end it');
n = fresh(80); n.clock = rules().bed + 5; ok(preBlocked('raid') === 'She is in bed', 'no Raid pass after midnight');
S.g.goodwill = 61; startNight(); ok(S.g.goodwill === 30, `next night: half carries over (${S.g.goodwill})`);
console.log(fails ? `${fails} FAILED` : 'PASS');
