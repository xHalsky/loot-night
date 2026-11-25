(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { startNight } from '../src/systems/night';
import { travelToDungeon, choosePath } from '../src/systems/dungeon';
import { altTab } from '../src/systems/excel';
import { skipDrop } from '../src/systems/loot';
S.g = initialState(); S.g.day = 4; startNight();   // Friday: everything the build has is on (#56)
 S.g.howto = false; /* the bot reads the how-to card (#28) */ travelToDungeon();
let prev = '';
for (let t = 0; t < 200; t += 1/60) {
  const n = N(); const v = n.visit.stage;
  const want = v !== 'idle' && v !== 'passing';
  if (want && n.monitor === 'rpg' && !n.visit.fake) altTab();
  if (!want && n.monitor === 'excel') altTab();
  if (n.phase === 'mapChoice') choosePath(N().safest);
  if (n.dropPopup) skipDrop();
  step(1/60);
  if (!S.g.night) break;
  const s = N().visit.stage + (N().visit.checked ? N().visit.result : '');
  if (s !== prev) { console.log(t.toFixed(1), s, 'mon', N().monitor, 'q4', Math.round(N().q4.tonight)); prev = s; }
}
