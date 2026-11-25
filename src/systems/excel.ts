import { T } from '../config/tuning';
import { hasLife } from './affixes';
import { N } from '../core/state';
import { rand } from '../core/rng';
import { sfx } from '../ui/audio';
import { toastAs } from '../core/fx';
import { q4Enter } from './q4';
const toast = toastAs('EXCEL');   // feed tag (#49)

// Excel, the cover screen. Since #55 it is Q4, the clicker that pays zl (systems/q4.ts); this file is the alt-tab.

/** Alt-tab is not instant: the screen goes through an old-Windows mode switch for a random 1.0-2.5 s.
 *  Until it finishes you are still on the screen you switched FROM (that is what she sees), and input is blocked. */
export function altTab() {
  const n = N();
  if (n.switching) return;
  const lag = rand(...T.ALT_TAB_LAG_SEC) * (hasLife('quick') ? 1 - T.AFFIX_QUICK : 1);   // of Quick Fingers
  n.switching = { to: n.monitor === 'rpg' ? 'excel' : 'rpg', t: lag, max: lag };
  sfx.monClick();
  if (n.switching.to === 'excel' && n.location === 'dungeon' && n.enemies.some(e => e.enraged && e.hp > 0) && n.flow > T.FLOW_MIN) {
    n.flow = T.FLOW_MIN; toast('You looked away from an enraged boss. Flow reset.', '#ff8a80');   // echo: the fight of the night
  }
}

export function updateSwitch(dt: number) {
  const n = N();
  const sw = n.switching;
  if (!sw) return;
  sw.t -= dt;
  if (sw.t <= 0) { n.monitor = sw.to; n.switching = null; sfx.monClick(); if (n.monitor === 'excel') q4Enter(); }
}
