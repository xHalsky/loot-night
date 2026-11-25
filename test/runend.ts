// How a night's end treats a run still going (#52, 1.4; decided 2026-11-24): Sleep banks it; dawn and unplugged lose
// it like a wipe (Souls kept), with a warning in the feed before each. npx tsx test/runend.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight, endNight, checkNightEnd } from '../src/systems/night';
import { travelToDungeon } from '../src/systems/dungeon';
import { genItem, itemEntry } from '../src/systems/loot';

let fail = 0;
const ok = (c: boolean, what: string) => { console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fail++; };
/** A night in the dungeon at 23:30 with 3 banked items, 4 unbanked, 200 unbanked gold and 30 Souls earned. */
function setup() {
  S.g = initialState(); S.g.day = 4; S.g.realLifeOff = true; startNight();   // Friday: the night runs to dawn (#56) S.g.howto = false;
  for (let i = 0; i < 3; i++) S.g.bag.push(itemEntry(genItem(3, 1)));
  travelToDungeon();
  const n = N(); n.clock = 23.5 * 60; n.phase = 'walk';
  for (let i = 0; i < 4; i++) { const e = itemEntry(genItem(3, 2)); e.run = true; if (e.kind === 'item') e.item.run = true; S.g.bag.push(e); }
  n.run!.gold = 200; n.run!.souls = 30; S.g.mats = 30;
  return { gold: S.g.gold };
}
let s = setup(); endNight('sleep');
ok(S.g.bag.length === 7 && S.g.gold === s.gold + 200 && !S.g.bag.some(e => e.run), `Sleep banks the run: bag ${S.g.bag.length}, gold +${S.g.gold - s.gold}`);
s = setup(); N().clock = T.DAWN; checkNightEnd();
ok(S.g.results?.ending === 'dawn' && S.g.bag.length === 3 && S.g.gold === s.gold && S.g.mats === 30, `dawn loses it: bag ${S.g.bag.length}, gold +${S.g.gold - s.gold}, Souls ${S.g.mats}`);
ok(!!S.g.results?.nearMisses.some(l => l.startsWith('Dawn ended the run')), 'the results say what dawn took');
s = setup(); N().mood = T.MOOD_MAX; checkNightEnd();
ok(S.g.results?.ending === 'unplugged' && S.g.bag.length === 2 && S.g.gold === s.gold, `unplugged loses it, then the cheaper half of the rest (3 left, 2 kept): bag ${S.g.bag.length}`);
s = setup(); N().clock = T.DAWN - T.RUN_WARN_DAWN_MIN; checkNightEnd(); N().mood = T.MOOD_RED; checkNightEnd(); checkNightEnd();
const warns = N().log.filter(l => /Dawn in|pulling the plug/.test(l.text)).length;
ok(warns === 2, `one warning each before dawn and the plug (${warns})`);
s = setup(); N().location = 'town'; N().run = null; N().clock = T.DAWN - 5; checkNightEnd();
ok(!N().log.some(l => /Dawn in/.test(l.text)), 'no warning in town (nothing at stake)');
console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
