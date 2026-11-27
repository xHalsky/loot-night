import { queueAbility, abilityUnlocked } from '../src/systems/battle';
import { swapHeroes, outOfPosition } from '../src/systems/positions';
import { buyNode, nodeState, owns } from '../src/systems/tree';
import { DEFAULT_ORDER } from '../src/data/heroes';
// the good bot puts the line back after a Hook or a Shove (#52, 1.6)
let lineFixes = 0, nodesBought = 0;
// the bot's skill trees (#53): in town, skill 2 first, then the way to the ultimate, the rules, the autocasts
const TREE_PLAN = ['g1', 'g2', 's2', 'm1', 'm2', 'm3', 'p1', 'r1a', 'ult', 'p2', 'r2a', 'q1', 'a1', 'q2', 'a2'] as const;
function buyTrees() {
  for (let pass = 0; pass < 40; pass++) {
    let any = false;
    for (const h of S.g.heroes) { const next = TREE_PLAN.find(id => !owns(h.id, id) && nodeState(h.id, id) !== 'shut'); if (next && nodeState(h.id, next) === 'buy') { buyNode(h.id, next); nodesBought++; any = true; } }
    if (!any) break;
  }
}
function fixLine() {
  const want = DEFAULT_ORDER[S.g.heroes.length >= 4 ? 1 : 0];
  if (!S.g.heroes.some(outOfPosition) || S.g.heroes.some(h => h.moving)) return;
  const i = S.g.heroes.findIndex((h, k) => h.id !== want[k]);
  if (i < 0) return;
  swapHeroes(i, S.g.heroes.findIndex(h => h.id === want[i])); lineFixes++;
}
// Headless night simulation with a simple bot player. Run: npx tsx test/sim.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { PACE } from '../src/systems/pacing';
import { maxHp } from '../src/systems/stats';
import { dayName } from '../src/systems/week';
import { startNight } from '../src/systems/night';
import { travelToDungeon, choosePath, returnToTown } from '../src/systems/dungeon';
import { altTab } from '../src/systems/excel';
import { q4Sum } from '../src/systems/q4';
import { openPhone, momReply, bossPick, answerSlide, setPhoneHold, textReply, talkPick } from '../src/systems/interrupts';
import { petStroke, plugIn } from '../src/systems/pets';
import { answer as lapAnswer } from '../src/systems/lap';
import { openMonster, monsterDrawerOpen, monsterPlaced, monsterOpenCan, monsterDrank, monsterTossed } from '../src/systems/monster';
import { wakeUp } from '../src/systems/tired';
import { hideCans, takePlate, chatAnswer, cuddleAnswer } from '../src/systems/visits';
import { cuddleDot, cuddlePointer } from '../src/systems/cuddle';
import { skipDrop } from '../src/systems/loot';
import { chooseCurio, curioBlocked } from '../src/systems/curios';
import { startPre, preBlocked } from '../src/systems/preemptive';
import { battOn, battery, deviceBlocked, useDevice, orderTea, phoneDead } from '../src/systems/home';
import type { DeviceId } from '../src/data/home';
import type { Room } from '../src/core/state';
import { CURIO_BY_ID } from '../src/data/curios';
import { T } from '../src/config/tuning';
import { lapSitAnswer } from '../src/systems/lapsit';
import { takeAsk } from '../src/systems/asks';
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
if (process.env.HOME === '1') S.g.owned.push('vacuum', 'speaker', 'tv', 'seal');   // HOME=1 (#57): every device installed
S.g.day = Number(process.env.DAY ?? 0);   // the week (#56): DAY=n starts on that night (0 = Monday); the save's day carries over with NIGHTS
for (let night = 1; night <= NIGHTS; night++) {
let built: string[] = [];
startNight(); S.g.howto = false; /* the bot reads the how-to card (#28) */
if (process.env.LIFE === 'off') S.g.realLifeOff = true;   // #52, 1.1: the RPG alone
if (night > 1) built = cityRound();
if (!process.env.NOTREE) buyTrees();   // #53: Souls into the trees before the night's first run
const goldAfterCity = S.g.gold;
const next = cheapestNext();
S.g.startFloor = Math.max(...S.g.checkpoints);   // runs start at the deepest checkpoint (#52, 1.4)
if (mode === 'good' && process.env.AUTOSALVAGE) S.g.autoSalvage = true;   // off by default since 0.60: with rares every 30 s the commons and uncommons are the early upgrades
travelToDungeon();
const dt = 1 / 60;
let q4Acc = 0;
let runs = 1, banked = 0;
// each run's end (1.9 pacing): deepest floor, banked or wiped, real seconds; the first legendary's drop count
const runEnds: string[] = []; let runT0 = 0, firstLegend = 0, lastCard: unknown = null;
let t = 0, caught = 0, visits = 0, wipes = 0;
const kinds: Record<string, number> = {}; const outcomes: Record<string, number> = {};
const lvlAt: number[] = []; let lastFloor = 1;
const curioPicks: Record<string, number> = {};
const preUsed: Record<string, number> = {};
const homeUsed: Record<string, number> = {};   // HOME=1: the devices used, charges, whether it died
const calls: Record<string, number> = {};
const wipeAt: number[] = [];
let demands = 0, t01 = 0, teases = 0, lastTease = '';
const asks: Record<string, number> = {}; let baths = 0, lastAct = '', laps = 0, lapSeen = false;   // the week (#56): what real life asked of you before 01:00 (her visits, the phone, the dog) and when 01:00 came
let epicFound = 0; let monsters = 0; let lastTired = 0; let texts = 0, wakes = 0, maxWake = 0, noiseSum = 0, noiseN = 0;
while (S.g.screen === 'night' && t < 2000) {
  const n = N();
  if (mode === 'good') {
    // Visits: go to Excel during the telegraph, back after she leaves.
    const v = n.visit.stage;
    const k = n.visit.kind;   // a perfect listener knows the visit type from the hallway cue
    const coming = v === 'far' || v === 'hall' || v === 'handle' || v === 'in';
    const a0 = n.apt;
    // HOME=1 (#57): before charging (15 s away) the bot puts Excel up, as before any time away
    const goCharge = process.env.HOME === '1' && battOn() && v === 'idle' && battery() <= 25 && !n.pre && !n.game && !preBlocked('charge');
    const wantExcel = (coming && (k === 'peek' || k === 'chat')) || goCharge || !!n.pre?.away;
    if (coming && k === 'snack' && !n.game) hideCans();
    if (v === 'in' && n.visit.result === 'offer') takePlate();
    if (v === 'in' && n.visit.result === 'chat') chatAnswer(0);
    if (v === 'in' && n.visit.result === 'lap') { if (!lapSeen) laps++; lapSeen = true; lapSitAnswer(0); } else if (v !== 'in') lapSeen = false;   // on your lap (#86): sweet
    if (v === 'in' && n.visit.result === 'ask') cuddleAnswer(true);
    if (n.herAsk && !n.game && !n.pre) { takeAsk(); asks[n.pre?.id ?? '?'] = (asks[n.pre?.id ?? '?'] ?? 0) + 1; }   // her towel, her wine (#93, #88): a good player brings it
    n.looking = v === 'in' && k === 'tease';   // her tease (#85): a good player looks at her (Eyes busy) till she blows the kiss
    if (k === 'tease' && n.visit.result && n.visit.result !== lastTease) teases += n.visit.result === 'kissed' ? 1 : 0;
    lastTease = k === 'tease' ? n.visit.result ?? '' : '';
    if (n.game?.kind === 'cuddle') { const [x, y] = cuddleDot(1 - n.game.t / n.game.max); cuddlePointer(x, y); }
    if (n.monitor === 'excel' && !n.switching) { q4Acc += dt; if (q4Acc >= 0.5) { q4Acc = 0; q4Sum(); } }   // Q4 (#55): looks busy, two AutoSums a second
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
    if (n.dog.stage === 'up' && mode === 'good') petStroke(20, 200, false);
    if (n.unplugged) n.unplugged.sockets.forEach((k, slot) => plugIn(k, slot));
    if (n.lap?.stage === 'ask') lapAnswer(0);
    if (g?.kind === 'monster') {
      if (g.stage === 'drawer') monsterDrawerOpen();
      else if (g.stage === 'grab') monsterPlaced();
      else if (g.stage === 'open') monsterOpenCan();
      else if (g.stage === 'drink') monsterDrank(0.9);
      else if (g.stage === 'toss') monsterTossed([...n.bin, { x: 505, y: 260, a: Math.PI / 2 }], S.g.floorCans, true, 'swish');
    }
    if (n.phase === 'mapChoice' && !n.selected) {
      // bank the run when the party is hurt or the bag is nearly full (a careful player), else go on
      const hp = S.g.heroes.reduce((a, h) => a + h.hp / maxHp(h), 0) / S.g.heroes.length;
      if (mode === 'good' && (hp < 0.45 || S.g.bag.length >= S.g.bagSize - 2)) returnToTown();
      else { const k = n.paths?.findIndex(c => c.map) ?? -1; choosePath(k >= 0 ? k : 0); }   // a map card if it has one, else the first path
    }
    if (n.dropPopup) {
      // the gear bot keeps its bag useful: a full bag swaps its least valuable item for a better new drop
      const nv = (e: any) => e.kind === 'item' ? e.item.value : 15;
      const worst = gearBot ? S.g.bag.filter((e: any) => !(e.kind === 'item' && e.item.locked)).sort((a, b) => nv(a) - nv(b))[0] : undefined;
      if (worst && nv(n.dropPopup.entry) > nv(worst)) { clickBagSlot(worst.id); swapped++; } else { skipDrop(); skipped++; }
    }
    if ((gearBot || mode === 'good') && n.phase === 'walk' && Math.floor(t * 2) !== Math.floor((t - dt) * 2)) tryEquip();   // the good bot gears up on the walk (#49): twice a second
    // Abilities when ready.
    // PRE=1: a bot that texts her while she is busy, twice a night (an upper bound: it knows where she is)
    if (process.env.PRE && v === 'idle' && !n.pre && !n.switching && n.apt.calm <= 0) {
      if (!n.apt.asleep && n.apt.moving <= 0 && n.apt.activity !== 'shower' && (n.preUses.text ?? 0) < 2 && !preBlocked('text')) { startPre('text'); preUsed.text = (preUsed.text ?? 0) + 1; }
    }
    // HOME=1 (#57): every device installed; the bot uses them where they work (an upper bound: it knows where she is):
    // the TV cast at the credits, the vacuum in her room, the speakers when she is up, bubble tea, the seal while she
    // sleeps; it charges at 25% or under (Excel up first, above)
    if (process.env.HOME === '1' && battOn() && v === 'idle' && !n.pre && !n.switching && !n.game) {
      const a1 = n.apt, up = !a1.asleep && a1.activity !== 'shower' && a1.moving <= 0, use = (id: DeviceId, room?: Room) => { if (!deviceBlocked(id) && useDevice(id, room)) homeUsed[id] = (homeUsed[id] ?? 0) + 1; };
      if (goCharge && n.monitor === 'excel') { startPre('charge'); homeUsed.charge = (homeUsed.charge ?? 0) + 1; }
      else if (a1.activity === 'tv' && a1.cued && up && (n.home.uses.tv ?? 0) < T.TV_MAX) use('tv');
      else if (up && a1.calm <= 0 && battery() > 35) { if (!deviceBlocked('vacuum')) use('vacuum', a1.room); else if (!deviceBlocked('speaker')) use('speaker', 'kitchen'); else if (!deviceBlocked('tea') && !n.home.bells.length) { orderTea(); homeUsed.tea = (homeUsed.tea ?? 0) + 1; } }
      else if (a1.asleep !== n.seal && !deviceBlocked('seal')) use('seal');
      if (phoneDead()) homeUsed.dead = 1;
    }
    // curios: the first choice (usually the quiet one), else the second; a curio counts how often each was taken
    if (n.phase === 'curio' && n.curio?.stage === 'ask' && n.monitor === 'rpg' && !n.switching) {
      const ch = process.env.CURIO === 'loud' ? CURIO_BY_ID[n.curio.id].reckless : CURIO_BY_ID[n.curio.id].choices.map(c => c.id).find(c => !curioBlocked(c));
      if (ch) { curioPicks[ch] = (curioPicks[ch] ?? 0) + 1; chooseCurio(ch); }
    }
    if (mode === 'good' && n.action === 'none' && n.monitor === 'rpg' && !n.switching) fixLine();
    S.g.heroes.forEach((h, i) => { [1, 2, 3].forEach(s => { if (n.action === 'none' && n.monitor === 'rpg' && h.cd[s] <= 0 && abilityUnlocked(h, s) && (s !== 3 || h.ult >= 1) && n.phase === 'battle' && !h.downed && n.enemies.some(e => e.hp > 0)) queueAbility(i, s); }); });
    epicFound = n.unidentifiedFound;
    if (n.clock >= sleepAt && n.phase !== 'battle') { endNight('sleep'); break; }
  } else {
    if (n.phase === 'mapChoice') choosePath(N().safest);
    if (n.dropPopup) skipDrop();
  }
  if (n.apt.activity !== lastAct) { if (n.apt.activity === 'bath') baths++; lastAct = n.apt.activity; }
  const before = n.catches;
  const vs = n.visit.stage, ni = n.interrupts.length, dogWas = n.dog.stage, askWas = !!n.herAsk;
  step(dt); t += dt;
  if (S.g.night && N().clock < T.BEDTIME) { const m = N(); demands += ((vs === 'handle' || (vs === 'far' && m.visit.kind === 'tease')) && m.visit.stage === 'in' ? 1 : 0) + (m.interrupts.length > ni ? 1 : 0) + (dogWas === 'away' && m.dog.stage === 'up' ? 1 : 0) + (!askWas && m.herAsk ? 1 : 0); t01 = t; }   // as the week doc's model: visits she came in on, phone events, the dog
  if (S.g.night && N().catches > before) { caught++; if (process.env.DBG) console.error('CAUGHT', N().visit.kind, N().visit.from, 'monitor', N().monitor, 'sw', !!N().switching, 'stage', vs, 'clock', Math.round(N().clock)); }
  if ((vs === 'handle' || (vs === 'far' && N().visit.kind === 'tease')) && S.g.night && N().visit.stage === 'in') { visits++; kinds[N().visit.kind] = (kinds[N().visit.kind] ?? 0) + 1; }
  if (S.g.night && N().visit.stage === 'in' && N().visit.t < 0.02 && N().visit.result) outcomes[N().visit.result] = 1 + (outcomes[N().visit.result] ?? 0);
  if (S.g.night && N().runCard && N().runCard !== lastCard) { lastCard = N().runCard; runEnds.push(`${N().runCard!.deepest}${N().runCard!.banked ? 'b' : 'w'}${Math.round(t - runT0)}s`); runT0 = t; if (N().runCard!.banked) banked++; else { wipes++; wipeAt.push(lastFloor); } }
  if (!firstLegend && S.g.legendaryFound) firstLegend = S.g.drops;
  // back in town after a wipe or a bank: the next run starts at the deepest checkpoint (#52, 1.4)
  if (S.g.night && N().location === 'town' && S.g.screen === 'night' && !process.env.STAY) { if (!process.env.NOTREE) buyTrees(); S.g.startFloor = Math.max(...S.g.checkpoints); travelToDungeon(); runs++; }
  if (S.g.night && S.g.heroes[0].level > lvlAt.length + 1) lvlAt.push(Math.round(t));
  if (S.g.night) { lastTired = N().tired; lastFloor = N().floor; const a = N().apt; maxWake = Math.max(maxWake, a.wake); noiseSum += N().noise; noiseN++; for (const tt of N().toasts) { if (tt.t > 3.99 && (tt.text.startsWith('Text from') || tt.text.startsWith('Babe: "are you coming'))) texts++; if (tt.t > 3.99 && tt.text.startsWith('You woke')) wakes++; } }
}
const r = S.g.results!; const N0tired = lastTired;
const gear = S.g.heroes.map(h => { const st = heroStats(h), b = heroBaseStats(h); return { atk: (st.atk - b.atk) / st.atk, hp: (st.hp - b.hp) / st.hp, slots: Object.values(h.gear).filter(Boolean).length, ilvl: Object.values(h.gear).reduce((a, it: any) => a + (it?.ilvl ?? 0), 0) }; });
const gearStats = { equips, skipped, swapped, gearAtk: +(gear.reduce((a, x) => a + x.atk, 0) / gear.length).toFixed(2), gearHp: +(gear.reduce((a, x) => a + x.hp, 0) / gear.length).toFixed(2),
  slots: gear.reduce((a, x) => a + x.slots, 0), gearIlvl: +(gear.reduce((a, x) => a + x.ilvl, 0) / Math.max(1, gear.reduce((a, x) => a + x.slots, 0))).toFixed(1), wipeAt };
console.log(JSON.stringify({ mode, night, day: dayName(r.day), home: homeUsed, battEnd: battOn() ? battery() : null, demands, teases, asks, baths, laps, gwEnd: Math.round(S.g.goodwill), secApart: demands ? Math.round(t01 / demands) : null, q4: S.g.results?.q4 ?? 0, zl: Math.floor(S.g.zl), q4title: S.g.q4.rank, ...gearStats, built, bagValue, city: { ...S.g.furniture }, goldAfterCity, nextCost: next ? [next.gold, next.mats] : null, realSec: Math.round(t), ending: r.ending, stars: r.stars, depth: r.depth, endClock: r.endClock, mood: r.mood, visits, kinds, caught, wipes, texts, wakes, maxWake: Math.round(maxWake), monsters, tired: Math.round(N0tired), avgNoise: Math.round(noiseSum / noiseN), debt: r.debtAfter, gold: S.g.gold, mats: S.g.mats, sell: S.g.bag.map(e => e.kind === 'item' ? Math.round(e.item.value * (e.item.identified ? 1 : T.UNIDENTIFIED_VENDOR_MULT)) : 15), bagRar: S.g.bag.map(e => e.kind === 'item' ? ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(e.item.rarity) : -1), salvage: S.g.bag.reduce((a, e) => a + (e.kind === 'item' ? T.SALVAGE_YIELD[['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(e.item.rarity)] : 0), 0), bag: S.g.bag.length, levels: S.g.heroes.map(h => h.level), party: S.g.heroes.map(h => h.id).join(','), lineFixes, nodesBought, trees: S.g.heroes.map(h => (S.g.trees?.[h.id] ?? []).length).join(','), runEnds, firstLegend, lvlAt, curioPicks, preUsed, calls, epicFound, rarePlus: S.g.bag.filter(e => e.kind === 'item' && ['rare', 'epic', 'legendary'].includes(e.item.rarity)).length, witched: S.g.bag.filter(e => e.kind === 'item' && e.item.witched).length, near: r.nearMisses, runs, banked, pace: { ...PACE, combat: Math.round(PACE.combat), encounter: +(PACE.encounterSum / Math.max(1, PACE.encounters)).toFixed(1), floor: +(PACE.floorSum / Math.max(1, PACE.floors)).toFixed(1) } }));
}
