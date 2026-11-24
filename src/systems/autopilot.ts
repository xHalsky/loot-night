import { T } from '../config/tuning';
import { N } from '../core/state';
import { pick } from '../core/rng';
import { toastAs } from '../core/fx';
const toast = toastAs('PARTY');   // feed tag (#49)

// Away from the game (docs/design/dungeon.md). When the player CHOSE to leave the game (Excel, switching, a minigame
// window, cables out because the dog was ignored), nobody casts the manual skills or the ultimates: the party fights
// on with its auto attacks (#52, 1.2; the reckless autopilot went with it). Her desk visit and the monitor she
// switched off are forced on the player: those don't count as away.

export function isAway(): boolean {
  const n = N();
  if (n.location !== 'dungeon' || n.lap || n.monitorOff > 0 || n.game?.kind === 'cuddle') return false;
  return n.monitor === 'excel' || !!n.switching || n.action !== 'none' || !!n.unplugged;
}

const PULL_LINES = ['Healero: pulling, keep up', 'Magoo: ok we go without him', 'Healero: no time, next pack', 'Magoo: afk again? pulling'];
let lastLine = -99;

/** Party chat when they pull without you. Rate-limited so the feed stays readable. */
export function autopilotPull() {
  const n = N();
  if (n.threat - lastLine < T.AUTOPILOT_CHAT_GAP_SEC) return;
  lastLine = n.threat;
  toast(`[Party] ${pick(PULL_LINES)}`, '#8fd0ff');
}
