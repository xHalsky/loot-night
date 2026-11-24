// Acceptance test for alt-tab lag: switching on the handle cue gets caught, on the hallway cue passes.
// Run: npx tsx test/alttab.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { startNight } from '../src/systems/night';
import { travelToDungeon } from '../src/systems/dungeon';
import { altTab } from '../src/systems/excel';
import { startVisit } from '../src/systems/visits';

function trial(cue: 'hall' | 'handle'): string {
  S.g = initialState();
  startNight(); S.g.howto = false; /* the bot reads the how-to card (#28) */ travelToDungeon();
  const n = N();
  n.interrupts = []; n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9;
  startVisit(false, 'peek');
  n.visit.fake = false; n.visit.lean = false;
  let switched = false;
  for (let i = 0; i < 60 * 30; i++) {
    if (!switched && n.visit.stage === cue) { altTab(); switched = true; }
    step(1 / 60);
    if (n.visit.result) return n.visit.result;
  }
  return 'none';
}
const N_TRIALS = 200;
for (const cue of ['hall', 'handle'] as const) {
  const r: Record<string, number> = {};
  for (let k = 0; k < N_TRIALS; k++) { const x = trial(cue); r[x] = (r[x] ?? 0) + 1; }
  console.log(`switch on ${cue} cue:`, JSON.stringify(r));
}
