import { chewDelay } from './shop';
import { rules, on } from './week';
import { T } from '../config/tuning';
import { N } from '../core/state';
import { rand, randi } from '../core/rng';
import { toastAs } from '../core/fx';
const toast = toastAs('DOG');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { realLifeFree } from './reallife';

// The dog (docs/design/desk.md). He jumps up at the desk for attention: pet him (a minigame on the desk, no window)
// and he lies back down at your feet for a while. Ignore him 1-3 times (random) and he bumps the desk:
// the monitor cables come out and you have to plug them back in (another on-desk minigame).

export const PLUGS = ['HDMI', 'DisplayPort', 'Power', 'USB-A', 'USB-C', 'DVI', 'VGA', 'Ethernet', 'Audio'];
export const CABLE_COLORS = ['#e0524a', '#2f6fed', '#3fbf6a', '#f2c94c', '#9b5de5', '#ff8c42', '#f2f2f2', '#2a2a30', '#ff7ab8'];
export const CABLE_COUNT = 4;

export function updateDog(dt: number) {
  const n = N();
  const d = n.dog;
  const plan = rules().dog;
  if (!plan || !on('dog') || n.lap || n.game?.kind === 'cuddle') return;   // the dog comes in on Thursday (#56)
  const every = () => rand(plan[1], plan[2]);
  if (n.unplugged) n.monitorOff = Math.max(n.monitorOff, 0.5);
  d.flinch = Math.max(0, d.flinch - dt);
  if (d.stage === 'away') {
    d.next -= dt;
    if (d.next <= 0 && !n.unplugged && realLifeFree()) { d.stage = 'up';   // his arrival slides later, never drops (#54, 3.2)
      d.t = T.DOG_WAIT_SEC; d.pet = 0; d.sweetPet = 0; d.sweet = randi(0, 2); sfx.bark(); toast('The dog jumps up at the desk.', '#f2c46b'); }
    return;
  }
  if (d.stage === 'happy') { d.t -= dt; if (d.t <= 0) { d.stage = 'away'; d.next = every() + chewDelay(); } return; }
  // up: whining, waiting for you
  d.t -= dt;
  n.noise = Math.min(100, n.noise + T.DOG_WHINE_NOISE * dt);
  if (Math.floor(d.t * 0.8) !== Math.floor((d.t + dt) * 0.8)) sfx.whine();
  if (d.t <= 0) {
    d.ignores++;
    if (d.ignores >= d.limit) {
      d.ignores = 0; d.limit = randi(1, 3);
      d.stage = 'away'; d.next = every() + chewDelay();
      bump();
    } else {
      d.stage = 'away'; d.next = rand(...T.DOG_AGAIN_SEC) + chewDelay();
      toast('The dog gives up and lies down. He looks offended.', '#a999bd');
    }
  }
}

/** A stroke over his head. `dist` px moved, `speed` px/s, `sweet` = on his favourite spot. */
export function petStroke(dist: number, speed: number, sweet: boolean) {
  const d = N().dog;
  if (d.stage !== 'up') return;
  if (speed > T.DOG_FAST) { d.flinch = 0.4; d.pet = Math.max(0, d.pet - 0.04); return; }
  const add = dist * T.DOG_PET_RATE * (sweet ? T.DOG_SWEET_MULT : 1);
  d.pet += add;
  if (sweet) d.sweetPet = (d.sweetPet ?? 0) + add;
  if (d.pet >= 1) {
    d.stage = 'happy'; d.t = 1.2; d.ignores = 0; N().goodBoy = T.AFFIX_DOG_SEC;   // Good Boy affixes count for a while
    if ((d.sweetPet ?? 0) / d.pet >= T.GOOD_BOY_SWEET_SHARE) {   // mostly on his favourite spot: Good Boy
      N().goodDog = T.GOOD_BOY_SEC;
      toast(`GOOD BOY! He found you a lucky sock. Loot goblins x${T.GOOD_BOY_GOBLIN} for ${T.GOOD_BOY_SEC} s.`, '#6fcf7f');
    } else toast('Good boy! He licks your hand and flops down at your feet.', '#6fcf7f');
    sfx.heal();
  }
}

const shuffle = <X,>(a: X[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function bump() {
  const n = N();
  // a fresh mix every time: which plugs, which cable colours, which socket order
  const kinds = shuffle([...PLUGS.keys()]).slice(0, CABLE_COUNT);
  const colors = shuffle([...CABLE_COLORS.keys()]).slice(0, CABLE_COUNT);
  const sockets = shuffle([...Array(CABLE_COUNT).keys()]);
  n.unplugged = { kinds, colors, sockets, plugged: Array(CABLE_COUNT).fill(false), t0: n.threat + T.CABLE_SHOW_SEC, flow: n.flow };   // the fast fix counts once the cables show
  n.monitorOff = 1;
  sfx.sting();
  toast('The dog slams into the desk. The monitor cables are out!', '#ff8a80');
}

/** Cable `plug` dropped on socket slot `slot`. */
export function plugIn(plug: number, slot: number): boolean {
  const n = N();
  const u = n.unplugged;
  if (!u || u.plugged[plug]) return false;
  if (u.sockets[slot] !== plug) { sfx.bad(); return false; }
  u.plugged[plug] = true; sfx.plug();
  if (u.plugged.every(Boolean)) {
    const fast = u.t0 !== undefined && n.threat - u.t0 <= T.CABLE_FAST_SEC;
    n.unplugged = null; n.monitorOff = 0; sfx.good();
    if (fast && u.flow !== undefined) { n.flow = Math.max(n.flow, u.flow); toast(`Signal back in ${Math.max(1, Math.round(n.threat - u.t0!))} s. Flow restored.`, '#6fcf7f'); }   // payout: a fast fix
    else toast('Signal back. Good as new.', '#6fcf7f');
  }
  return true;
}

export function triggerDog() { const d = N().dog; d.stage = 'away'; d.next = 0; }
export function triggerUnplug() { bump(); }
