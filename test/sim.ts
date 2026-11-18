import { queueAbility } from '../src/systems/battle';
// Headless night simulation with a simple bot player. Run: npx tsx test/sim.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { startNight } from '../src/systems/night';
import { travelToDungeon, chooseNextFloor } from '../src/systems/dungeon';
import { altTab } from '../src/systems/excel';
import { openPhone, momReply, bossPick, answerSlide, setPhoneHold, textReply, talkPick } from '../src/systems/interrupts';
import { petStroke, plugIn } from '../src/systems/pets';
import { answer as lapAnswer } from '../src/systems/lap';
import { openMonster, monsterOpenFridge, monsterPlaced, monsterOpenCan, setMonsterHold, monsterBinned } from '../src/systems/monster';
import { wakeUp } from '../src/systems/tired';
import { hideCans, takePlate, chatAnswer, cuddleAnswer } from '../src/systems/visits';
import { cuddleDot, cuddlePointer } from '../src/systems/cuddle';
import { skipDrop } from '../src/systems/loot';
import { chooseCurio, curioBlocked } from '../src/systems/curios';
import { startPre, preBlocked, episodeAnswer } from '../src/systems/preemptive';
import { CURIO_BY_ID } from '../src/data/curios';
import { T } from '../src/config/tuning';
import { endNight } from '../src/systems/night';
import { heroStats, heroBaseStats } from '../src/systems/stats';
import { equipOn, clickBagSlot } from '../src/systems/bag';
import { salvage, vendor, buildCity, salvageYield } from '../src/systems/town';
import { CITY } from '../src/data/city';
import { STAT_BASE } from '../src/data/items';
const gearBot = process.argv[4] === 'gear';
// TUNE='{"ENEMY_HP_PER_FLOOR":0.35}' tries tuning values without editing tuning.ts (balance experiments, #49).
if (process.env.TUNE) Object.assign(T as any, JSON.parse(process.env.TUNE));
if (process.env.TUNE_STAT) Object.assign(STAT_BASE as any, JSON.parse(process.env.TUNE_STAT));   // item stat curves: {"atk":[2,2]}
function score(st: any) { return st.atk * 3 + st.hp * 0.3 + st.armor * 2 + st.speed * 3 + st.crit; }
let equips = 0, skipped = 0, swapped = 0;
function tryEquip() {
  for (const e of [...S.g.bag]) {
    if (e.kind !== 'item' || !e.item.identified) continue;
    let best = -1, gain = 0;
    S.g.heroes.forEach((h, i) => { const d = score(heroStats(h, { [e.item.slot]: e.item })) - score(heroStats(h)); if (d > gain) { gain = d; best = i; } });
    if (best >= 0) { N().selected = e.id; equipOn(best); equips++; }
  }
}

const mode = process.argv[2] ?? 'good';   // good | idle
const sleepAt = Number(process.argv[3] ?? T.BEDTIME);
// NIGHTS=n plays n nights in a row (the save carries over). Before each later night the bot does what a player does
// at 20:00 in the city: equip upgrades, salvage the cheapest items for the cheapest building's scraps, sell the rest,
// then build every building it can afford, cheapest first (docs/design/city.md, #2).
const NIGHTS = Number(process.env.NIGHTS ?? 1);
const cheapestNext = () => CITY.filter(c => (S.g.furniture[c.id] ?? 0) < 3).map(c => ({ c, lvl: S.g.furniture[c.id] ?? 0 }))
  .map(x => ({ ...x, gold: x.c.gold[x.lvl], mats: x.c.mats[x.lvl] })).sort((a, b) => a.gold - b.gold)[0];
let bagValue = 0;
function cityRound(): string[] {
  tryEquip();
  const sellOf = (e: any) => Math.round(e.item.value * (e.item.identified ? 1 : T.UNIDENTIFIED_VENDOR_MULT));
  const loose = () => S.g.bag.filter((e: any) => e.kind === 'item' && !e.item.locked);
  bagValue = loose().reduce((a, e: any) => a + sellOf(e), 0);
  if (process.env.DBG_CITY) console.error('city: gold', S.g.gold, 'mats', S.g.mats, 'bag value', bagValue, 'items', loose().length);
  const built: string[] = [];
  for (let k = 0; k < 40; k++) {
    const next = cheapestNext();
    if (!next) break;
    if (S.g.gold >= next.gold && S.g.mats >= next.mats) { buildCity(next.c.id); built.push(`${next.c.id}${next.lvl + 1}`); continue; }
    const items = loose().sort((a: any, b: any) => sellOf(a) - sellOf(b));
    if (!items.length) break;
    N().selected = (S.g.mats < next.mats ? items[0] : items[items.length - 1]).id;   // short of scraps: salvage the cheapest; of gold: sell the best
    if (S.g.mats < next.mats) salvage(); else vendor();
  }
  return built;
}
void salvageYield;
S.g = initialState();
for (let night = 1; night <= NIGHTS; night++) {
let built: string[] = [];
startNight(); S.g.howto = false; /* the bot reads the how-to card (#28) */
if (night > 1) built = cityRound();
const goldAfterCity = S.g.gold;
const next = cheapestNext();
travelToDungeon();
const dt = 1 / 60;
let t = 0, caught = 0, visits = 0, wipes = 0;
const kinds: Record<string, number> = {}; const outcomes: Record<string, number> = {};
const lvlAt: number[] = []; let lastFloor = 1;
const curioPicks: Record<string, number> = {};
const preUsed: Record<string, number> = {};
const calls: Record<string, number> = {};
const wipeAt: number[] = [];
let epicFound = 0; let monsters = 0; let lastTired = 0; let texts = 0, wakes = 0, maxWake = 0, noiseSum = 0, noiseN = 0;
while (S.g.screen === 'night' && t < 2000) {
  const n = N();
  if (mode === 'good') {
    // Visits: go to Excel during the telegraph, back after she leaves.
    const v = n.visit.stage;
    const k = n.visit.kind;   // a perfect listener knows the visit type from the hallway cue
    const coming = v === 'far' || v === 'hall' || v === 'handle' || v === 'in';
    const a0 = n.apt;
    const preTea = !!process.env.PRE && v === 'idle' && !a0.asleep && a0.moving <= 0 && a0.calm <= 0 && n.location === 'dungeon'
      && (a0.room === 'living' || a0.room === 'bedroom') && (n.preUses.tea ?? 0) < 2;
    const wantExcel = (coming && (k === 'peek' || k === 'chat')) || preTea || !!n.pre?.away;   // PRE: Excel up before going away
    if (coming && k === 'snack' && !n.game) hideCans();
    if (v === 'in' && n.visit.result === 'offer') takePlate();
    if (v === 'in' && n.visit.result === 'chat') chatAnswer(0);
    if (v === 'in' && n.visit.result === 'ask') cuddleAnswer(true);
    if (n.game?.kind === 'cuddle') { const [x, y] = cuddleDot(1 - n.game.t / n.game.max); cuddlePointer(x, y); }
    if (wantExcel && n.monitor === 'rpg' && !n.visit.fake) altTab();
    if (!wantExcel && n.monitor === 'excel' && v !== 'in') altTab();
    if (!n.game && n.interrupts.length && (v === 'idle')) openPhone();
    if (!n.game && v === 'idle' && n.tired >= 50 && S.g.monsters > 0 && n.boost <= 0 && n.crash <= 0) { openMonster(); monsters++; }
    wakeUp();
    const g = n.game;
    if (g?.kind === 'phone') {
      if (g.stage === 'ringing') answerSlide(1);
      else if (g.stage === 'locked') setPhoneHold(true);
      else if (g.stage === 'call' && g.sweep > g.zone + 0.1) momReply(g.need);
      else if (g.stage === 'chat' && g.app === 'boss' && g.t < g.max - 1.5) { const r = g.rows[g.row]; bossPick(r.a + r.b); }
      else if (g.stage === 'chat' && g.app === 'text') textReply();
      else if (g.stage === 'talk' && g.t < g.max - 1.2) { calls[g.app] = (calls[g.app] ?? 0) + (g.beat === 0 ? 1 : 0); talkPick(g.need); }
    }
    if (n.dog.stage === 'up' && mode === 'good') petStroke(40, 400, false);
    if (n.unplugged) n.unplugged.sockets.forEach((k, slot) => plugIn(k, slot));
    if (n.lap?.stage === 'ask') lapAnswer(0);
    if (g?.kind === 'monster') {
      if (g.stage === 'fridge') monsterOpenFridge();
      else if (g.stage === 'grab') monsterPlaced(240);
      else if (g.stage === 'open') monsterOpenCan();
      else if (g.stage === 'drink') { if (!g.holding) setMonsterHold(true); else if (g.gulp >= 0.75) setMonsterHold(false); }
      else if (g.stage === 'toss') monsterBinned([...n.bin, { ax: 330, ay: 200, bx: 340, by: 214 }], 'swish');
    }
    if (n.phase === 'mapChoice' && !n.selected) { const m = S.g.bag.find(e => e.kind === 'map'); chooseNextFloor(m ? m.id : null); }
    if (n.dropPopup) {
      // the gear bot keeps its bag useful: a full bag swaps its least valuable item for a better new drop
      const nv = (e: any) => e.kind === 'item' ? e.item.value : 15;
      const worst = gearBot ? S.g.bag.filter((e: any) => !(e.kind === 'item' && e.item.locked)).sort((a, b) => nv(a) - nv(b))[0] : undefined;
      if (worst && nv(n.dropPopup.entry) > nv(worst)) { clickBagSlot(worst.id); swapped++; } else { skipDrop(); skipped++; }
    }
    if (gearBot && n.phase === 'loot') tryEquip();
    // Abilities when ready.
    // PRE=1: a bot that knows where she is and uses pre-emptive actions where they work (an upper bound):
    // tea when she is in the living room or bedroom (Excel up first, above), else a text while she is busy; 2 of each.
    if (process.env.PRE && v === 'idle' && !n.pre && !n.switching && n.apt.calm <= 0) {
      if (preTea && n.monitor === 'excel' && !preBlocked('tea')) { startPre('tea'); preUsed.tea = (preUsed.tea ?? 0) + 1; }
      else if (!preTea && !n.apt.asleep && n.apt.moving <= 0 && n.apt.activity !== 'shower' && (n.preUses.text ?? 0) < 2 && !preBlocked('text')) { startPre('text'); preUsed.text = (preUsed.text ?? 0) + 1; }
    }
    if (n.pre?.stage === 'ask') episodeAnswer(process.env.PRE !== 'decline');
    // curios: the first choice (usually the quiet one), else the second; a curio counts how often each was taken
    if (n.phase === 'curio' && n.curio?.stage === 'ask' && n.monitor === 'rpg' && !n.switching) {
      const ch = process.env.CURIO === 'loud' ? CURIO_BY_ID[n.curio.id].reckless : CURIO_BY_ID[n.curio.id].choices.map(c => c.id).find(c => !curioBlocked(c));
      if (ch) { curioPicks[ch] = (curioPicks[ch] ?? 0) + 1; chooseCurio(ch); }
    }
    S.g.heroes.forEach((h, i) => { [1, 2, 3].forEach(s => { if (n.action === 'none' && n.monitor === 'rpg' && h.cd[s] <= 0 && h.level >= T.ABILITY_UNLOCK[s] && n.phase === 'battle' && !h.downed && n.enemies.some(e => e.hp > 0)) queueAbility(i, s); }); });
    epicFound = n.unidentifiedFound;
    if (n.clock >= sleepAt && n.phase !== 'battle') { endNight('sleep'); break; }
  } else {
    if (n.phase === 'mapChoice') chooseNextFloor(null);
    if (n.dropPopup) skipDrop();
  }
  const before = n.catches;
  const vs = n.visit.stage;
  step(dt); t += dt;
  if (S.g.night && N().catches > before) { caught++; if (process.env.DBG) console.error('CAUGHT', N().visit.kind, N().visit.from, 'monitor', N().monitor, 'sw', !!N().switching, 'stage', vs, 'clock', Math.round(N().clock)); }
  if (vs === 'handle' && S.g.night && N().visit.stage === 'in') { visits++; kinds[N().visit.kind] = (kinds[N().visit.kind] ?? 0) + 1; }
  if (S.g.night && N().visit.stage === 'in' && N().visit.t < 0.02 && N().visit.result) outcomes[N().visit.result] = 1 + (outcomes[N().visit.result] ?? 0);
  if (S.g.night && N().floor < lastFloor) { wipes++; wipeAt.push(lastFloor); }
  if (S.g.night && S.g.heroes[0].level > lvlAt.length + 1) lvlAt.push(Math.round(t));
  if (S.g.night) { lastTired = N().tired; lastFloor = N().floor; const a = N().apt; maxWake = Math.max(maxWake, a.wake); noiseSum += N().noise; noiseN++; for (const tt of N().toasts) { if (tt.t > 3.99 && (tt.text.startsWith('Text from') || tt.text.startsWith('Babe: "are you coming'))) texts++; if (tt.t > 3.99 && tt.text.startsWith('You woke')) wakes++; } }
}
const r = S.g.results!; const N0tired = lastTired;
const gear = S.g.heroes.map(h => { const st = heroStats(h), b = heroBaseStats(h); return { atk: (st.atk - b.atk) / st.atk, hp: (st.hp - b.hp) / st.hp, slots: Object.values(h.gear).filter(Boolean).length, ilvl: Object.values(h.gear).reduce((a, it: any) => a + (it?.ilvl ?? 0), 0) }; });
const gearStats = { equips, skipped, swapped, gearAtk: +(gear.reduce((a, x) => a + x.atk, 0) / 3).toFixed(2), gearHp: +(gear.reduce((a, x) => a + x.hp, 0) / 3).toFixed(2),
  slots: gear.reduce((a, x) => a + x.slots, 0), gearIlvl: +(gear.reduce((a, x) => a + x.ilvl, 0) / Math.max(1, gear.reduce((a, x) => a + x.slots, 0))).toFixed(1), wipeAt };
console.log(JSON.stringify({ mode, night, ...gearStats, built, bagValue, city: { ...S.g.furniture }, goldAfterCity, nextCost: next ? [next.gold, next.mats] : null, realSec: Math.round(t), ending: r.ending, stars: r.stars, depth: r.depth, endClock: r.endClock, mood: r.mood, visits, kinds, caught, wipes, texts, wakes, maxWake: Math.round(maxWake), monsters, tired: Math.round(N0tired), avgNoise: Math.round(noiseSum / noiseN), debt: r.debtAfter, gold: S.g.gold, mats: S.g.mats, sell: S.g.bag.map(e => e.kind === 'item' ? Math.round(e.item.value * (e.item.identified ? 1 : T.UNIDENTIFIED_VENDOR_MULT)) : 15), bagRar: S.g.bag.map(e => e.kind === 'item' ? ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(e.item.rarity) : -1), salvage: S.g.bag.reduce((a, e) => a + (e.kind === 'item' ? T.SALVAGE_YIELD[['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(e.item.rarity)] : 0), 0), bag: S.g.bag.length, levels: S.g.heroes.map(h => h.level), lvlAt, curioPicks, preUsed, calls, epicFound, rarePlus: S.g.bag.filter(e => e.kind === 'item' && ['rare', 'epic', 'legendary'].includes(e.item.rarity)).length, witched: S.g.bag.filter(e => e.kind === 'item' && e.item.witched).length, near: r.nearMisses }));
}
