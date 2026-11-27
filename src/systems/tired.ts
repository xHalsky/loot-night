import { T } from '../config/tuning';
import { on } from './week';
import { hasLife } from './affixes';
import { S, N } from '../core/state';
import { rand } from '../core/rng';
import { toastAs } from '../core/fx';
const toast = toastAs('YOU');   // feed tag (#49)
import { tip } from './tips';
import { boysSay } from './boys';

// Tiredness: the live form of sleep debt (docs/design/night.md).
// 30+: yawns blur the desk. 50+: microsleeps (eyelids drift shut, any click or key snaps them open).
// 70+: phone timers 15% shorter, Flow builds 25% slower. 90+: she comes to check on you more often.

export const startTired = () => on('tired') ? Math.min(100, T.TIRED_BASE + S.g.sleepDebt * T.TIRED_PER_DEBT) : 0;   // Tiredness from Tuesday (#56)

export function updateTired(dt: number, clockDelta: number) {
  const n = N();
  if (!on('tired')) return;
  if (n.clock > T.TIRED_FROM && clockDelta > 0) n.tired = Math.min(100, n.tired + clockDelta * T.TIRED_PER_GAME_MIN * (hasLife('fiveMore') ? 1 - T.AFFIX_TIRED : 1) * (S.g.owned.includes('chair') ? T.SHOP_CHAIR_TIRED : 1));   // the ergo chair (Shop, #55)

  // Monster boost, then the crash.
  if (n.boost > 0) {
    n.boost -= dt;
    if (n.boost <= 0) { n.boost = 0; n.crash = T.MONSTER_CRASH_SEC; n.tired = Math.min(100, n.tired + T.MONSTER_CRASH_TIRED); toast('Sugar crash. Party 15% slower for 20 s.', '#ff9a4d'); boysSay('slow'); }
  } else if (n.crash > 0) n.crash = Math.max(0, n.crash - dt);

  // Yawns.
  if (n.tired >= T.TIRED_YAWN) {
    n.nextYawn -= dt;
    if (n.nextYawn <= 0) { n.nextYawn = T.YAWN_EVERY_SEC * (1.3 - n.tired / 200); n.yawn = T.YAWN_SEC; tip('yawn'); boysSay('tired'); }
  }
  n.yawn = Math.max(0, n.yawn - dt);

  // Microsleeps.
  const b = n.blink;
  if (b.state === 'open') {
    if (n.tired >= T.TIRED_MICROSLEEP && n.boost <= 0) {
      b.nextIn -= dt;
      if (b.nextIn <= 0) { b.state = 'closing'; b.lid = 0; }
    }
  } else if (b.state === 'closing') {
    b.lid += dt / T.MICROSLEEP_CLOSE_SEC;
    if (b.lid >= 1) { b.lid = 1; b.state = 'closed'; }
  }
}

/** Any click or key while the eyelids are drifting shut snaps them open. */
export function wakeUp(): boolean {
  const n = S.g.night;
  if (!n || n.blink.state === 'open') return false;
  const wasClosed = n.blink.state === 'closed';
  const scale = 1.4 - n.tired / 100;
  n.blink = { state: 'open', lid: 0, nextIn: rand(...T.MICROSLEEP_EVERY_SEC) * Math.max(0.5, scale) };
  if (wasClosed) toast('You jolt awake.', '#8fb3ff');
  return true;
}

export const speedMult = () => { const n = N(); return 1 + (n.boost > 0 ? T.MONSTER_SPEED : 0) + (n.crash > 0 ? T.MONSTER_CRASH_SPEED : 0); };
