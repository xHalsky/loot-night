import { updatePeek } from '../systems/peek';
import { updateSwitch } from '../systems/excel';
import { updateLap } from '../systems/lap';
import { updateDog } from '../systems/pets';
import { S } from './state';
import { updateMeters } from '../systems/meters';
import { updateVisits } from '../systems/visits';
import { updateInterrupts } from '../systems/interrupts';
import { updateMonster } from '../systems/monster';
import { updateExcel } from '../systems/excel';
import { updateDungeon } from '../systems/dungeon';
import { updateDrops } from '../systems/loot';
import { checkNightEnd } from '../systems/night';

const STEP = 1 / 60;

/** One fixed step of the game, systems in the order of design doc section 9. */
export function step(dt: number) {
  const g = S.g;
  if (g.screen !== 'night' || g.paused || !g.night) return;
  updateMeters(dt);      // clocks, flow, mood, noise, busy, buffs
  updateVisits(dt);
  updatePeek(dt);
  updateLap(dt);
  updateDog(dt);
  if (!g.night.lap) updateInterrupts(dt);
  updateMonster(dt);
  updateSwitch(dt);
  updateExcel(dt);
  updateDungeon(dt);     // walking, battle, loot
  updateDrops(dt);
  checkNightEnd();
}

export function startLoop(render: () => void) {
  let last = performance.now();
  let acc = 0;
  const frame = (now: number) => {
    acc += Math.min(0.25, (now - last) / 1000) * S.g.timeScale;
    last = now;
    while (acc >= STEP) { step(STEP); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
