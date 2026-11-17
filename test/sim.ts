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
import { heroStats } from '../src/systems/stats';
import { equipOn } from '../src/systems/bag';
const gearBot = process.argv[4] === 'gear';
function score(st: any) { return st.atk * 3 + st.hp * 0.3 + st.armor * 2 + st.speed * 3 + st.crit; }
function tryEquip() {
  for (const e of [...S.g.bag]) {
    if (e.kind !== 'item' || !e.item.identified) continue;
    let best = -1, gain = 0;
    S.g.heroes.forEach((h, i) => { const d = score(heroStats(h, { [e.item.slot]: e.item })) - score(heroStats(h)); if (d > gain) { gain = d; best = i; } });
    if (best >= 0) { N().selected = e.id; equipOn(best); }
  }
}

const mode = process.argv[2] ?? 'good';   // good | idle
const sleepAt = Number(process.argv[3] ?? T.BEDTIME);
S.g = initialState();
startNight();
travelToDungeon();
const dt = 1 / 60;
let t = 0, caught = 0, visits = 0, wipes = 0;
const kinds: Record<string, number> = {}; const outcomes: Record<string, number> = {};
const lvlAt: number[] = []; let lastFloor = 1;
const curioPicks: Record<string, number> = {};
const preUsed: Record<string, number> = {};
const calls: Record<string, number> = {}; let monsters = 0; let lastTired = 0; let texts = 0, wakes = 0, maxWake = 0, noiseSum = 0, noiseN = 0;
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
    if (n.dropPopup) skipDrop();
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
  if (S.g.night && N().floor < lastFloor) wipes++;
  if (S.g.night && S.g.heroes[0].level > lvlAt.length + 1) lvlAt.push(Math.round(t));
  if (S.g.night) { lastTired = N().tired; lastFloor = N().floor; const a = N().apt; maxWake = Math.max(maxWake, a.wake); noiseSum += N().noise; noiseN++; for (const tt of N().toasts) { if (tt.t > 3.99 && tt.text.startsWith('Text from')) texts++; if (tt.t > 3.99 && tt.text.startsWith('You woke')) wakes++; } }
}
const r = S.g.results!; const N0tired = lastTired;
console.log(JSON.stringify({ mode, realSec: Math.round(t), ending: r.ending, stars: r.stars, depth: r.depth, endClock: r.endClock, mood: r.mood, visits, kinds, caught, wipes, texts, wakes, maxWake: Math.round(maxWake), monsters, tired: Math.round(N0tired), avgNoise: Math.round(noiseSum / noiseN), debt: r.debtAfter, gold: S.g.gold, bag: S.g.bag.length, levels: S.g.heroes.map(h => h.level), lvlAt, curioPicks, preUsed, calls, near: r.nearMisses }));
