import { T } from '../config/tuning';
import { S, N, type BinCan } from '../core/state';
import { toastAs } from '../core/fx';
const toast = toastAs('YOU');   // feed tag (#49)
import { sfx } from '../ui/audio';

// Monster: a boost you operate by hand (docs/design/desk.md).
// 1 open the fridge, 2 grab any can and put it anywhere on the desk, 3 click it open (click + psst),
// 4 drink: hold to bring it to your mouth, release in the green band, x3 (boost starts here),
// 5 toss the empty: throw it into the bin (physics). Cans stay in the bin all night.
// The scene and its physics live in ui/monsterScene.ts; this file holds the rules.

export function openMonster() {
  const n = N();
  if (n.game) return;
  if (S.g.monsters <= 0) { toast(`Your heart says no. ${T.MONSTER_PER_NIGHT} a night is the limit.`, '#a999bd'); sfx.bad(); return; }
  n.action = 'miniGame';
  n.game = { kind: 'monster', stage: 'fridge', drag: 0, drink: 1, holding: false, gulp: 0, gulps: 0, coughed: false, opened: false, feedback: '', canX: 0 };
  sfx.click();
}

const G = () => { const g = N().game; return g && g.kind === 'monster' ? g : null; };

export function monsterOpenFridge() { const g = G(); if (g?.stage === 'fridge') { g.stage = 'grab'; sfx.fridge(); } }

/** The can was put down on the desk at x. */
export function monsterPlaced(x: number) { const g = G(); if (g?.stage === 'grab') { g.canX = x; g.stage = 'open'; sfx.clank(0.1); } }

/** One click: tab up and back, the hiss. */
export function monsterOpenCan() {
  const g = G();
  if (!g || g.stage !== 'open') return;
  const n = N();
  n.noise = Math.min(100, n.noise + T.MONSTER_QUIET_NOISE);
  sfx.hiss(false);
  g.opened = true; S.g.monsters--;
  g.stage = 'drink'; g.feedback = '';
}

export function setMonsterHold(on: boolean) {
  const g = G();
  if (!g || g.stage !== 'drink') return;
  if (on) { if (!g.coughed) g.holding = true; return; }
  // Release: judge the gulp.
  if (g.holding) {
    const [lo, hi] = T.MONSTER_GULP_GOOD;
    if (g.gulp >= lo && g.gulp <= hi) { g.drink = Math.max(0, g.drink - 0.34); g.gulps++; g.feedback = 'Big gulp!'; sfx.gulp(); }
    else if (g.gulp > 0.12) { g.drink = Math.max(0, g.drink - 0.1); g.feedback = 'Just a sip. Hold a bit longer.'; sfx.gulp(); }
    if (g.drink <= 0.02) { g.drink = 0; g.stage = 'toss'; g.feedback = ''; boost(); }
  }
  g.holding = false; g.gulp = 0; g.coughed = false;
}

export function updateMonster(dt: number) {
  const g = G();
  if (!g || g.stage !== 'drink' || !g.holding) return;
  g.gulp += dt / T.MONSTER_GULP_SEC;
  if (g.gulp > T.MONSTER_GULP_GOOD[1] + 0.15) {
    const n = N();
    n.noise = Math.min(100, n.noise + T.MONSTER_COUGH_NOISE);
    g.holding = false; g.gulp = 0; g.coughed = true;
    g.feedback = '*cough cough* Too long! (Noise) Let go and try again.';
    sfx.bad();
  }
}

function boost() {
  const n = N();
  n.tired = Math.max(0, n.tired + T.MONSTER_TIRED);
  n.boost = T.MONSTER_BOOST_SEC; n.crash = 0;
  n.blink = { state: 'open', lid: 0, nextIn: Math.max(n.blink.nextIn, T.MONSTER_BOOST_SEC) };
  toast(`GOBLIN FUEL! Party acts 30% faster for ${T.MONSTER_BOOST_SEC} s. Tiredness ${T.MONSTER_TIRED}.`, '#6fcf7f');
  sfx.level();
}

/** A thrown can hit something hard (noise for loud bounces). */
export function monsterClank(power: number) {
  const n = N();
  if (power > 0.5) n.noise = Math.min(100, n.noise + T.MONSTER_CLANK_NOISE * power);
}

/** The can came to rest inside the bin. `bin` is the settled state of every can in it. */
export function monsterBinned(bin: BinCan[], style: 'swish' | 'bank' | 'rim') {
  const n = N();
  const g = G();
  if (!g || g.stage !== 'toss') return;
  n.bin = bin;
  n.cans = bin.length;
  n.game = null; n.action = 'none';
  const line = style === 'swish' ? 'Swish! Nothing but bin.' : style === 'bank' ? 'Off the wall and in. Clean.' : 'Rattled in off the rim.';
  toast(line, '#6fcf7f');
  if (style !== 'rim') n.flow = Math.min(T.FLOW_MAX, n.flow + T.MONSTER_SWISH_FLOW);
}

/** Closing early: before it is open nothing is lost; while drinking the can is wasted; after drinking it stays on the floor. */
export function cancelMonster() {
  const n = N();
  const g = G();
  if (!g) return;
  n.game = null; n.action = 'none';
  if (g.opened && g.stage === 'drink') toast('You put it down half full. Wasted.', '#a999bd');
  if (g.stage === 'toss') toast('Empty can left on the floor. She will see that.', '#a999bd');
}
