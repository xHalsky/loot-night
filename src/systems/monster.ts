import { T } from '../config/tuning';
import { S, N, type CanPose } from '../core/state';
import { toastAs } from '../core/fx';
const toast = toastAs('YOU');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { DROPPED } from './fuelPhysics';

// Goblin Fuel: a boost you operate by hand (docs/design/desk.md, #61). Code names still say "monster".
// 1 pull the desk drawer open, 2 drag a can onto the desk, 3 pull the tab until it pops,
// 4 pour it into your mouth (side view, liquid physics: what goes down sets the boost),
// 5 one throw at the bin; a miss stays on the floor for good (S.g.floorCans).
// The scene and its input live in ui/monsterScene.ts, the physics in systems/fuelPhysics.ts; this file holds the rules.

export function openMonster() {
  const n = N();
  if (n.game) return;
  if (S.g.monsters <= 0) { toast('No cans left in the drawer. The Shop on your phone has more.', '#a999bd'); sfx.bad(); return; }
  n.action = 'miniGame';
  // the mini fridge (Shop, #55): a cold can already waits on the desk, so the break starts at the can
  n.game = { kind: 'monster', stage: S.g.owned.includes('fridge') ? 'open' : 'drawer', opened: false, feedback: '', drunk: 0, result: null };
  sfx.click();
}

const G = () => { const g = N().game; return g && g.kind === 'monster' ? g : null; };

export function monsterDrawerOpen() { const g = G(); if (g?.stage === 'drawer') g.stage = 'grab'; }

/** The can stands on the desk. */
export function monsterPlaced() { const g = G(); if (g?.stage === 'grab') g.stage = 'open'; }

/** The tab popped: the can is open (a little Noise), one can used. */
export function monsterOpenCan() {
  const g = G();
  if (!g || g.stage !== 'open') return;
  const n = N();
  n.noise = Math.min(100, n.noise + T.MONSTER_QUIET_NOISE);
  g.opened = true; S.g.monsters--;
  g.stage = 'drink'; g.feedback = '';
}

/** Poured too fast: it went the wrong way. */
export function monsterCough() {
  const g = G();
  if (!g) return;
  const n = N();
  n.noise = Math.min(100, n.noise + T.MONSTER_COUGH_NOISE);
  g.feedback = '*cough cough* Too fast! (Noise)';
  sfx.bad();
}

/** The can is empty: `share` of it went down. 85%+ is the full boost, 60%+ half of it, less is nothing. */
export function monsterDrank(share: number) {
  const g = G();
  if (!g || g.stage !== 'drink') return;
  g.drunk = share;
  const pct = Math.round(share * 100);
  if (share >= T.MONSTER_DRINK_FULL) { g.result = 'full'; boost(1, pct); }
  else if (share >= T.MONSTER_DRINK_HALF) { g.result = 'half'; boost(T.MONSTER_HALF_MULT, pct); }
  else { g.result = 'none'; toast(`Only ${pct}% went down. The rest is on your shirt and the desk. No boost.`, '#ff8a80'); sfx.bad(); }
  g.stage = 'toss'; g.feedback = '';
}

function boost(mult: number, pct: number) {
  const n = N();
  const sec = Math.round(T.MONSTER_BOOST_SEC * mult), tired = Math.round(T.MONSTER_TIRED * mult);
  n.tired = Math.max(0, n.tired + tired);
  n.boost = sec; n.crash = 0;
  n.blink = { state: 'open', lid: 0, nextIn: Math.max(n.blink.nextIn, sec) };
  toast(mult >= 1 ? `GOBLIN FUEL! ${pct}% down. Party acts 30% faster for ${sec} s. Tiredness ${tired}.`
    : `${pct}% down: half a boost. Party acts 30% faster for ${sec} s. Tiredness ${tired}.`, '#6fcf7f');
  sfx.level();
}

/** A thrown can hit something hard (Noise for loud bounces). */
export function monsterClank(power: number) {
  const n = N();
  if (power > 0.5) n.noise = Math.min(100, n.noise + T.MONSTER_CLANK_NOISE * power);
}

/** The throw is over. `bin` and `floor` are where every can now lies (the floor ones stay for good). */
export function monsterTossed(bin: CanPose[], floor: CanPose[], inBin: boolean, style: 'swish' | 'bank' | 'rim') {
  const n = N();
  const g = G();
  if (!g || g.stage !== 'toss') return;
  n.bin = bin; n.cans = bin.length;
  S.g.floorCans = floor.slice(-T.MONSTER_FLOOR_CANS_MAX);
  n.game = null; n.action = 'none';
  if (inBin) {
    toast(style === 'swish' ? 'Swish! Nothing but bin.' : style === 'bank' ? 'Off the wall and in. Clean.' : 'Rattled in off the rim.', '#6fcf7f');
    if (style !== 'rim') n.flow = Math.min(T.FLOW_MAX, n.flow + T.MONSTER_SWISH_FLOW);
  } else {
    const k = S.g.floorCans.length;
    toast(`Missed. It stays there.${k > 1 ? ` ${k} cans on the floor now.` : ''}`, '#a999bd');
  }
}

/** Closing early: before it is open nothing is lost; while drinking the can is wasted; after drinking it stays on the floor. */
export function cancelMonster() {
  const n = N();
  const g = G();
  if (!g) return;
  n.game = null; n.action = 'none';
  if (g.opened && g.stage === 'drink') toast('You put it down half full. Wasted.', '#a999bd');
  if (g.stage === 'toss') {
    S.g.floorCans = [...S.g.floorCans, { ...DROPPED, x: DROPPED.x + (S.g.floorCans.length % 5) * 7 }].slice(-T.MONSTER_FLOOR_CANS_MAX);
    toast('You drop the empty by your chair. It stays there.', '#a999bd');
  }
}
