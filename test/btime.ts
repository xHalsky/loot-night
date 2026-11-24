(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { startNight } from '../src/systems/night';
import { travelToDungeon, choosePath } from '../src/systems/dungeon';
import { skipDrop } from '../src/systems/loot';
S.g = initialState(); startNight(); S.g.howto = false; /* the bot reads the how-to card (#28) */ travelToDungeon();
N().visit.t = 1e9; N().nextInterruptAt = 1e9;
let bt = 0, battles = 0, inB = false, drops = 0, t = 0;
while (t < 480) {
  const n = N();
  if (n.phase === 'mapChoice') choosePath(N().safest);
  if (n.dropPopup) { skipDrop(); }
  const q = n.dropQueue.length;
  step(1/60); t += 1/60;
  if (N().phase === 'battle') { bt += 1/60; if (!inB) { battles++; inB = true; } } else inB = false;
}
console.log({ battles, avgBattleSec: (bt / battles).toFixed(1), floor: N().floor, clock: Math.floor(N().clock/60)+':'+String(Math.floor(N().clock%60)).padStart(2,'0'), bag: S.g.bag.length, levels: S.g.heroes.map(h=>h.level) });
