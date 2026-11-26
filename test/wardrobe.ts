// What she wears (fan-service steps 3 and 4, #90, #91): her outfit by what she was doing, home from work, ready for bed;
// her feet and her footsteps; her gifts in the Shop (one per slot a night, the newest the night after, Goodwill the
// first time) and their trade-offs.
// Run: npx tsx test/wardrobe.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { herLook, wearing } from '../src/systems/wardrobe';
import { updateVisits, triggerVisitNow } from '../src/systems/visits';
import { shopBuy, shopState } from '../src/systems/shop';
import { bedAt } from '../src/systems/week';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (day = 2, keep = false) => {
  if (!keep) S.g = initialState();
  S.g.day = day; startNight(); S.g.howto = false;
  const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; n.apt.lastVisitEnd = 1e9; n.location = 'dungeon'; n.monitor = 'rpg'; n.tease.bedAt = 1e9;
  return n;
};

// --- the set (#90) ---
let n = night(2); n.clock = 22 * 60;
const L = (a: string) => herLook(a);
ok(L('tv').outfit === 'sweater' && L('tv').feet === 'socks', 'on the couch: a knit sweater, socks');
ok(L('tea').outfit === 'bighoodie' && L('tea').feet === 'slippers', 'in the kitchen: your hoodie, slippers');
ok(L('toilet').outfit === 'lounge' && L('toilet').feet === 'bare', 'anything else: the cream tee, barefoot');
ok(L('shower').outfit === 'towel' && L('bath').outfit === 'towel', 'the shower, the bath: the towel');
n.clock = 20 * 60 + 30; ok(L('tv').outfit === 'blouse' && L('shower').outfit === 'towel', 'Wednesday 20:30: home from work, her blouse (not in the shower)');
n = night(5); n.clock = 20 * 60 + 30; ok(L('tv').outfit === 'sweater', 'Saturday 20:30: no work, no blouse');
n.clock = 23 * 60 + 40; ok(L('phone').outfit === 'pajama' && L('tv').outfit === 'sweater', 'in the bedroom after 23:30: her pajama shorts');

// --- her feet, her footsteps ---
const walk = (from: string) => {
  const n = night(5); n.clock = 22 * 60; n.apt.activity = from as never; n.apt.heard = null; n.apt.heardWhat = '';
  triggerVisitNow('peek'); const t0 = n.visit.t, heard: string[] = [];
  for (let i = 0; i < 60 * 12 && n.visit.stage !== 'in'; i++) { const st = n.visit.stage; updateVisits(1 / 60); if (n.apt.heardWhat === 'STEPS' && !heard.includes(st)) heard.push(st); }
  return { t0, heard, feet: n.visit.feet };
};
const bare = walk('toilet'), slip = walk('tea'), sock = walk('tv');
ok(bare.feet === 'bare' && bare.heard[0] === 'far', 'barefoot: heard from the start of her walk');
ok(slip.feet === 'slippers' && Math.abs(slip.t0 - bare.t0 - T.SLIPPERS_EARLY_SEC) < 1e-9 && slip.heard[0] === 'far', `slippers: heard ${T.SLIPPERS_EARLY_SEC} s earlier`);
ok(sock.feet === 'socks' && sock.heard[0] === 'hall', 'socks: heard only from the hallway (2 s later)');

// --- her gifts (#91) ---
n = night(0); S.g.zl = 5000;
ok(shopState('fluffy') === 'buy' && shopBuy('fluffy') && S.g.owned.includes('fluffy') && !wearing('fluffy'), 'Fluffy socks bought: not tonight...');
const g0 = S.g.goodwill;
n = night(1, true);
ok(wearing('fluffy') && Math.round(S.g.goodwill - g0) >= T.GIFT_GOODWILL, `...the night after, and Goodwill +${T.GIFT_GOODWILL} the first time`);
ok(herLook('tv').feet === 'fluffy' && herLook('shower').feet === 'bare', 'on her feet (barefoot out of the shower)');
const fl = (() => { n.clock = 22 * 60; n.apt.activity = 'toilet'; n.apt.heardWhat = ''; triggerVisitNow('peek'); let heard = false; for (let i = 0; i < 60 * 12 && n.visit.stage !== 'in'; i++) { updateVisits(1 / 60); if (n.apt.heardWhat === 'STEPS') heard = true; } return heard; })();
ok(!fl, 'fluffy socks: her steps are silent (only the handle)');
const g1 = S.g.goodwill; n = night(2, true); ok(wearing('fluffy') && S.g.goodwill - g1 < T.GIFT_GOODWILL, 'the Goodwill only the first time');
shopBuy('knee'); n = night(3, true); ok(wearing('knee') && !wearing('fluffy'), 'the newest the night after (one per slot)');
let both = new Set<string>(); for (let i = 0; i < 30; i++) { n = night(4, true); both.add(n.wear.feet!); } ok(both.has('fluffy') && both.has('knee'), 'then one at random');
// the Goblin Fury tee: a catch costs half
shopBuy('fury'); n = night(2, true); ok(wearing('fury') && herLook('tv').outfit === 'fury' && herLook('night').outfit === 'bighoodie' && herLook('bath').outfit === 'towel', 'the Fury tee: over the set (not your hoodie, not the towel)');
n.monitor = 'rpg'; n.clock = 22 * 60; S.g.goodwill = 0; triggerVisitNow('peek'); n.visit.lean = false; n.visit.safe = false; /* not a lean visit, no Goodwill to forgive it */ for (let i = 0; i < 60 * 12 && n.visit.stage !== 'in'; i++) updateVisits(1 / 60); const m0 = n.mood; updateVisits(1 / 60);
ok(n.catches === 1 && n.mood - m0 === Math.round(T.CATCH_MOOD[0] * T.GIFT_FURY_CATCH_MOOD), `a catch: Mood +${Math.round(T.CATCH_MOOD[0] * T.GIFT_FURY_CATCH_MOOD)} (half) [${n.catches} ${n.mood - m0} ${n.visit.result} ${n.visit.kind}]`);
// the pajama set: bed 30 min earlier, the waking meter faster
S.g.owned = S.g.owned.filter(x => x !== 'fury'); shopBuy('pjset'); n = night(4, true);
ok(wearing('pjset') && bedAt() === 24 * 60 - T.GIFT_PJ_BED_MIN, `the pajama set, Friday: bed at 23:${60 - T.GIFT_PJ_BED_MIN}`);
// the cat-ear hoodie: one more tease, any night
S.g.owned = S.g.owned.filter(x => x !== 'pjset'); shopBuy('cathoodie'); n = night(1, true);
ok(wearing('cathoodie') && n.tease.left === T.GIFT_CAT_TEASES, 'the cat-ear hoodie: a tease on Tuesday too');
console.log(fails ? `${fails} FAILED` : 'PASS');
