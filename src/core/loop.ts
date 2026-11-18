import { updatePeek } from '../systems/peek';
import { updateSwitch } from '../systems/excel';
import { updateLap } from '../systems/lap';
import { updateDog } from '../systems/pets';
import { S } from './state';
import { updateMeters } from '../systems/meters';
import { updateVisits } from '../systems/visits';
import { updatePre } from '../systems/preemptive';
import { updateCurioTimers } from '../systems/curios';
import { updateInterrupts } from '../systems/interrupts';
import { updateMonster } from '../systems/monster';
import { updateCuddle } from '../systems/cuddle';
import { updateExcel } from '../systems/excel';
import { updateDungeon } from '../systems/dungeon';
import { updateDrops } from '../systems/loot';
import { checkNightEnd } from '../systems/night';
import { updateHim } from '../systems/him';
import { updateTips } from '../systems/tips';
import { updateCoach, coachScale } from '../systems/coach';

const STEP = 1 / 60;

/** One fixed step of the game, systems see docs/design/tech.md. */
export function step(dt: number) {
  const g = S.g;
  if (g.screen !== 'night' || g.paused || g.howto || !g.night) return;
  updateMeters(dt);      // clocks, flow, mood, noise, busy, buffs
  updatePre(dt);
  updateCurioTimers(dt);   // party buffs, Rafał's sulk
  updateVisits(dt);
  updatePeek(dt);
  updateHim(dt);
  updateTips(dt);
  updateLap(dt);
  updateDog(dt);
  const busyWithHer = !!g.night.lap || g.night.game?.kind === 'cuddle';
  if (!busyWithHer) updateInterrupts(dt); else g.night.nextInterruptAt += dt;   // her time: the phone waits
  updateMonster(dt);
  updateCuddle(dt);
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
    const real = Math.min(0.25, (now - last) / 1000);
    updateCoach(real);
    acc += real * S.g.timeScale * coachScale();   // a coach mark makes the game crawl (#42)
    last = now;
    while (acc >= STEP) { step(STEP); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
