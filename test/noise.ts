// Acceptance test for Noise by distance and masking (#17).
// Done when: a boss kill during her shower doesn't shorten the visit timer; the same kill next door does, a lot.
// Run: npx tsx test/noise.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { T } from '../src/config/tuning';
import { S, N, initialState, type ActivityId } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { hearing, heardNoise } from '../src/systems/apartment';
import { ACT_BY_ID } from '../src/data/apartment';

S.g = initialState(); startNight();
const n = N();
const doorChance = () => T.DOOR_BASE_CHANCE + Math.min(100, heardNoise()) * T.DOOR_NOISE_CHANCE;
let fail = 0;
for (const act of ['shower', 'tea', 'tv', 'toilet', 'phone'] as ActivityId[]) {
  n.apt.activity = act; n.apt.room = ACT_BY_ID[act].room; n.apt.moving = 0;
  n.noise = 0; const quiet = doorChance();
  n.noise = T.NOISE_BOSS_KILL + 30;          // a boss kill on top of a busy fight
  const loud = doorChance();
  const speedsUp = heardNoise() > 70;
  console.log(`${act.padEnd(7)} ${n.apt.room.padEnd(9)} hearing x${hearing()}  door chance ${(quiet * 100).toFixed(0)}% -> ${(loud * 100).toFixed(0)}%${speedsUp ? '  (she wraps up early)' : ''}`);
  if (act === 'shower' && loud !== quiet) fail++;
  if (act === 'tea' && loud - quiet < 0.3) fail++;
}
console.log(fail ? `FAIL (${fail})` : 'PASS');
