import { queueAbility } from '../src/systems/battle';
// Headless night simulation with a simple bot player. Run: npx tsx test/sim.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { startNight } from '../src/systems/night';
import { travelToDungeon, chooseNextFloor } from '../src/systems/dungeon';
import { altTab } from '../src/systems/excel';
import { openPhone, momReply, bossPick, answerSlide, setPhoneHold, textReply } from '../src/systems/interrupts';
import { petStroke, plugIn } from '../src/systems/pets';
import { answer as lapAnswer } from '../src/systems/lap';
import { openMonster, monsterOpenFridge, monsterPlaced, monsterOpenCan, setMonsterHold, monsterBinned } from '../src/systems/monster';
import { wakeUp } from '../src/systems/tired';
import { skipDrop } from '../src/systems/loot';
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
let lastFloor = 1; let monsters = 0; let lastTired = 0; let texts = 0, wakes = 0, maxWake = 0, noiseSum = 0, noiseN = 0;
while (S.g.screen === 'night' && t < 2000) {
  const n = N();
  if (mode === 'good') {
    // Visits: go to Excel during the telegraph, back after she leaves.
    const v = n.visit.stage;
    const wantExcel = v === 'far' || v === 'hall' || v === 'handle' || v === 'in' || (n.busy < 45 && n.phase === 'mapChoice');
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
    S.g.heroes.forEach((h, i) => { [1, 2].forEach(s => { if (n.action === 'none' && n.monitor === 'rpg' && h.cd[s] <= 0 && h.level >= T.ABILITY_UNLOCK[s] && n.phase === 'battle' && !h.downed && n.enemies.some(e => e.hp > 0)) queueAbility(i, s); }); });
    if (n.clock >= sleepAt && n.phase !== 'battle') { endNight('sleep'); break; }
  } else {
    if (n.phase === 'mapChoice') chooseNextFloor(null);
    if (n.dropPopup) skipDrop();
  }
  const before = n.catches;
  const vs = n.visit.stage;
  step(dt); t += dt;
  if (S.g.night && N().catches > before) caught++;
  if (vs === 'handle' && S.g.night && N().visit.stage === 'in') visits++;
  if (S.g.night && N().floor < lastFloor) wipes++;
  if (S.g.night) { lastTired = N().tired; lastFloor = N().floor; const a = N().apt; maxWake = Math.max(maxWake, a.wake); noiseSum += N().noise; noiseN++; for (const tt of N().toasts) { if (tt.t > 3.99 && tt.text.startsWith('Text from')) texts++; if (tt.t > 3.99 && tt.text.startsWith('You woke')) wakes++; } }
}
const r = S.g.results!; const N0tired = lastTired;
console.log(JSON.stringify({ mode, realSec: Math.round(t), ending: r.ending, stars: r.stars, depth: r.depth, endClock: r.endClock, mood: r.mood, visits, caught, wipes, texts, wakes, maxWake: Math.round(maxWake), monsters, tired: Math.round(N0tired), avgNoise: Math.round(noiseSum / noiseN), debt: r.debtAfter, gold: S.g.gold, bag: S.g.bag.length, levels: S.g.heroes.map(h => h.level), near: r.nearMisses }));
