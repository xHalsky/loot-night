// Goblin Fuel, the energy break (#61, #62; the look: V5, #70, grid doc 7c). Five steps in the desk's glass window over
// the right screen, drawn by the renderer (render/page/ebreak.js, through PK.ebreak):
// 1 Drawer: grab the handle and pull the drawer out.
// 2 Grab: drag a can out of the drawer to its spot on the desk, right of the mouse mat.
// 3 Open: the whole can on the desk; pull the tab up until the seal pops.
// 4 Drink: close on him, side-on. One click picks the can up and it follows the mouse; hold Space to tilt it, let go
//   to tilt back. 85% down for the full boost.
// 5 Toss: the room behind him; one throw. A miss stays on the floor for good (S.g.floorCans).
// This file keeps each step's input and moment-to-moment state, runs the physics (systems/fuelPhysics.ts) and hands the
// renderer a view of it. Pointers are scene px (392 x 258, the renderer's cameras); PK.ebMap turns them into the
// physics' px and back. The rules are systems/monster.ts (code names say "monster").
import { PK } from 'virtual:pagekit';
import { T } from '../config/tuning';
import { S, type MonsterGame } from '../core/state';
import { monsterDrawerOpen, monsterPlaced, monsterOpenCan, monsterCough, monsterDrank, monsterClank, monsterTossed } from '../systems/monster';
import {
  type V, type Pour, type Toss, newPour, stepPour, share, inCan, holeAt, HEAD_TILT, MOUTH,
  newToss, launch, stepToss, tossStyle, tossPoses, HAND, PULL_MAX, LAUNCH, GRAV,
} from '../systems/fuelPhysics';
import { sfx } from './audio';

/** The scene inside the window, in right-screen grid px (the renderer's EB_SC and its size). */
export const EB_SCENE = { x: 50, y: 68, w: 392, h: 258 };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (x: number) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

let lastGame: MonsterGame | null = null, lastStage = '', lastT = 0, tilting = false;
let ptr = { x: 0, y: 0 };                                   // the pointer, scene px
const G = () => { const g = S.g.night?.game; return g && g.kind === 'monster' ? g : null; };
const cansInDrawer = () => clamp(S.g.monsters, 1, 3);
/** Space held / let go (main.ts): tilts the can while drinking. */
export function monsterTilt(on: boolean) { tilting = on; }

// 1 the drawer, in cm pulled out (the renderer's camera knows where its handle is)
const DR_OPEN = 22;
let drawer = 0, drawerHold: { dy: number } | null = null, drawerTo = -1, slideCd = 0;
// 2 the can, along its way from the drawer to its spot (0 in the drawer, 1 on the spot)
let carry = false, grabK = 0, placedT = -1;
// 3 the tab (1: the seal gives)
let tab = 0, tabHold: { y0: number; l0: number } | null = null, popT = -1, creakCd = 0;
// 4 the drink
let pour: Pour = newPour(), doneT = -1, splashCd = 0, lastA = 0, slosh = 0.4;
// 5 the throw
let toss: Toss = newToss([]), aim: V | null = null, tossDone = -1, verdict = '', clankCd = 0, binCans = 0;

function reset(g: MonsterGame) {
  lastGame = g; lastStage = ''; tilting = false;
  drawer = 0; drawerHold = null; drawerTo = -1; carry = false; grabK = 0; placedT = -1;
  tab = 0; tabHold = null; popT = -1;
}
function enterStage(stage: string) {
  if (stage === 'drink') { pour = newPour(); doneT = -1; lastA = 0; slosh = 0.4; }
  if (stage === 'toss') { const bin = S.g.night?.bin ?? []; binCans = bin.length; toss = newToss([...bin, ...S.g.floorCans]); aim = null; tossDone = -1; verdict = ''; }
}

// ---------- the physics' px and the scene's ----------
/** The drink: his lips in the picture sit on the physics' mouth (the can is drawn 1:1 with the physics' can). */
const drinkOff = (): V => { const l = PK.ebMap.lips(HEAD_TILT); return [l[0] - MOUTH.x, l[1] - MOUTH.y]; };
const tossScene = (x: number, y: number) => PK.ebMap.tossToScene(x, y);
const tossPhys = (x: number, y: number): V => { const p = PK.ebMap.sceneToToss(x, y); return [p[0], p[1]]; };
/** Last nights' misses lie round the bin, not in a row along it: each its own depth (cm), by its place in the list. */
const MISS_Z = [10, -8, 14, -14, 4, -4, 18, -18];

// ---------- input (main.ts hands over the scene px) ----------
export function monsterDown(x: number, y: number) {
  const g = G(); if (!g || S.g.paused) return false;
  ptr = { x, y };
  if (g.stage === 'drawer') {
    const h = PK.ebMap.drawerHandle(drawer);
    if (Math.abs(x - h[0]) < 26 && Math.abs(y - h[1]) < 10) { drawerHold = { dy: y - h[1] }; drawerTo = -1; sfx.click(); }
    return true;
  }
  if (g.stage === 'grab' && !carry && placedT < 0) {
    if (PK.ebMap.drawerCans(cansInDrawer()).some(c => Math.abs(x - c[0]) < 26 && Math.abs(y - c[1]) < 11)) { carry = true; sfx.click(); }
    return true;
  }
  if (g.stage === 'open' && popT < 0) { const p = PK.ebMap.openTab(tab); if (Math.abs(x - p[0]) < 10 && Math.abs(y - p[1]) < 10) tabHold = { y0: y, l0: tab }; return true; }
  if (g.stage === 'drink' && doneT < 0) { if (!pour.held) { pour.held = true; sfx.click(); } return true; }   // one click picks the can up; it follows the mouse
  if (g.stage === 'toss' && !toss.thrown && tossDone < 0) { const [px, py] = tossPhys(x, y); if (Math.hypot(px - HAND[0], py - HAND[1]) < 40) { aim = [0, 0]; sfx.click(); } }
  return true;
}
export function monsterMove(x: number, y: number) { ptr = { x, y }; }
export function monsterUp() {
  const g = G(); if (!g) return;
  if (drawerHold) { drawerHold = null; drawerTo = drawer > DR_OPEN / 2 ? DR_OPEN : 0; }
  if (carry && g.stage === 'grab') { carry = false; if (grabK > 0.6) { placedT = 0; sfx.canOnDesk(); } }
  tabHold = null;
  if (aim) throwCan();
}
/** Grabbing (for the cursor): the fist while something is held. */
export function monsterGrabbing() { return !!(drawerHold || carry || tabHold || aim || (G()?.stage === 'drink' && pour.held)); }
function throwCan() {
  if (!aim) return;
  const [px, py] = aim;
  aim = null;
  if (Math.hypot(px, py) < 10) return;                     // barely pulled: nothing happens
  launch(toss, px, py); sfx.flip();
}

// ---------- each frame: the steps' motion, then what the renderer draws ----------
function stepDrawer(g: MonsterGame, dt: number) {
  if (drawerHold) {
    // the drawer follows the hand: the pull that puts the handle under the pointer (it sticks a little at first)
    const want = ptr.y - drawerHold.dy;
    let best = drawer, bd = 1e9;
    for (let o = 0; o <= DR_OPEN; o += 0.25) { const d = Math.abs(PK.ebMap.drawerHandle(o)[1] - want); if (d < bd) { bd = d; best = o; } }
    if (drawer === 0 && best < 1.2) best = 0;
    const dv = best - drawer; drawer = best;
    slideCd -= dt;
    if (Math.abs(dv) > 0.4 && slideCd <= 0) { sfx.drawerSlide(clamp(Math.abs(dv) / 3, 0, 1)); slideCd = 0.07; }
    if (drawer >= DR_OPEN - 0.3 && g.stage === 'drawer') { drawerHold = null; drawerTo = DR_OPEN; }
  } else if (drawerTo >= 0) {
    const before = drawer;
    drawer += (drawerTo - drawer) * Math.min(1, dt * 12);
    slideCd -= dt; if (Math.abs(drawer - before) > 0.3 && slideCd <= 0) { sfx.drawerSlide(0.5); slideCd = 0.08; }
    if (Math.abs(drawer - drawerTo) < 0.15) {
      drawer = drawerTo; drawerTo = -1; sfx.drawerThunk();
      if (drawer >= DR_OPEN && g.stage === 'drawer') monsterDrawerOpen();
    }
  }
  return { o: drawer, hint: !drawerHold && drawerTo < 0 };
}
function stepGrab(g: MonsterGame, dt: number) {
  if (carry) {   // the can follows the pointer along its way up out of the drawer and onto its spot
    const a = PK.ebMap.grabAt(0), b = PK.ebMap.grabAt(1), dx = b[0] - a[0], dy = b[1] - a[1];
    const k = clamp(((ptr.x - a[0]) * dx + (ptr.y - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
    grabK += (k - grabK) * Math.min(1, dt * 14);
  } else if (placedT >= 0) {
    placedT += dt; grabK += (1 - grabK) * Math.min(1, dt * 14);
    if (placedT > 0.75 && g.stage === 'grab') monsterPlaced();
  } else grabK += (0 - grabK) * Math.min(1, dt * 10);           // let go short of the spot: it drops back
  const settle = placedT < 0 ? 0 : placedT < 0.35 ? 2 * (1 - ease(placedT / 0.35)) : 0;
  return { k: grabK, carrying: carry, placed: placedT >= 0, settle };
}
function stepOpen(g: MonsterGame, dt: number) {
  if (tabHold && popT < 0) {
    const want = clamp(tabHold.l0 + (tabHold.y0 - ptr.y) / 18, 0, 1);
    creakCd -= dt;
    if (want > tab + 0.05 && creakCd <= 0) { sfx.tabCreak(); creakCd = 0.05; }
    tab = want;
    if (tab >= 1) { popT = 0; tabHold = null; sfx.pop(); sfx.canOpen(); }   // the seal gives: POP
  } else if (popT < 0) tab = Math.max(0, tab - dt * 3);
  if (popT >= 0) { popT += dt; if (popT > 1.15 && g.stage === 'open') monsterOpenCan(); }
  return { lift: tab, pop: popT, holding: !!tabHold };
}
function stepDrink(g: MonsterGame, dt: number, t: number) {
  const [ox, oy] = drinkOff();
  stepPour(pour, dt, { held: pour.held, tx: Math.max(ptr.x - ox, MOUTH.x - 230), ty: ptr.y - oy, tilt: tilting }, {
    gulp: () => sfx.gulp(),
    splash: () => { if (splashCd <= 0) { sfx.splash(); splashCd = 0.12; } },
    cough: () => monsterCough(),
  });
  splashCd -= dt;
  if (pour.done && doneT < 0) doneT = 0;
  if (doneT >= 0) { doneT += dt; if (doneT > 1.3 && g.stage === 'drink') monsterDrank(share(pour)); }
  slosh += (Math.min(2.6, 0.4 + (Math.abs(pour.a - lastA) / Math.max(dt, 1e-3)) * 0.9) - slosh) * Math.min(1, dt * 6); lastA = pour.a;
  const a = pour.a, top: V = [pour.x + 41 * Math.sin(a) + ox, pour.y - 41 * Math.cos(a) + oy];   // the lid's centre (the physics' hole is on its lower edge)
  const air: V[] = [], spill: [number, number, number][] = [];
  for (const d of pour.drops) {
    if (d.s === 1) air.push([d.x + ox, d.y + oy]);
    else if (d.s === 3 && d.t < 1.6) spill.push([d.x + ox, d.y + oy, 1 - d.t / 1.6]);
  }
  const pct = Math.round(share(pour) * 100), live = doneT < 0 && inCan(pour) > 0, [hx, hy] = holeAt(pour.x, pour.y, a);
  const far = Math.hypot(hx - MOUTH.x, hy - MOUTH.y) > T.MONSTER_LIPS * 1.6, full = pour.mouth / T.MONSTER_MOUTH_CAP;
  const lips: V = [MOUTH.x + ox, MOUTH.y + oy];
  let ring: number[] | null = null, hint: (string | number)[] | null = null;
  if (live && !pour.held) { ring = [pour.x + ox, pour.y + oy, 30]; hint = ['click to pick up the can', pour.x + ox - 40, pour.y + oy - 58]; }
  else if (live && far) { ring = [lips[0], lips[1], 9]; hint = ['to his mouth', lips[0] - 50, lips[1] - 26]; }
  else if (live && full > 0.8) hint = ['mmf!', lips[0] - 30, lips[1] - 22, 'warn'];
  else if (live && a < 0.3 && !tilting) hint = ['hold Space to tilt', 260, 214];
  const r = share(pour), fu = r >= T.MONSTER_DRINK_FULL, hf = r >= T.MONSTER_DRINK_HALF;
  void t;
  return {
    th: HEAD_TILT, open: pour.open > 0.4, top, phi: a, fill: inCan(pour) / pour.drops.length, slosh, air, spill, ring, hint, space: tilting,
    pct, half: Math.round(T.MONSTER_DRINK_HALF * 100), full: Math.round(T.MONSTER_DRINK_FULL * 100),
    verdict: doneT >= 0 ? [`${pct}%: ${fu ? 'FULL BOOST' : hf ? 'HALF A BOOST' : 'NO BOOST'}`, fu ? 'full' : hf ? 'half' : 'none'] : null,
  };
}
function stepThrow(g: MonsterGame, dt: number) {
  if (aim) { const [px, py] = tossPhys(ptr.x, ptr.y); let dx = px - HAND[0], dy = py - HAND[1]; const d = Math.hypot(dx, dy); if (d > PULL_MAX) { dx *= PULL_MAX / d; dy *= PULL_MAX / d; } aim = [dx, dy]; }
  clankCd -= dt;
  stepToss(toss, dt, {
    clank: p => { if (clankCd <= 0) { sfx.clank(p); monsterClank(p); clankCd = 0.07; } },
    binDrop: () => sfx.binDrop(),
  });
  if (toss.settled && tossDone < 0) { tossDone = 0; verdict = toss.inBin ? ({ swish: 'SWISH!', bank: 'BANK SHOT!', rim: 'IN OFF THE RIM' } as const)[tossStyle(toss)] : 'MISS. IT STAYS THERE.'; }
  if (tossDone >= 0) {
    tossDone += dt;
    if (tossDone > 1.2 && g.stage === 'toss') { const p = tossPoses(toss); monsterTossed(p.bin, p.floor, toss.inBin, tossStyle(toss)); }
  }
  const quarter = (a: number) => (((Math.round((a + Math.PI / 2) / (Math.PI / 2))) % 4) + 4) % 4;
  const cans: number[][] = [];
  toss.bodies.forEach((b, i) => {
    if (b === toss.thrown) return;
    const j = i - binCans, p = j < 0 ? tossScene(b.x, b.y) : PK.ebMap.floorAt(b.x, -118 + MISS_Z[j % MISS_Z.length]);
    cans.push([p[0], p[1], quarter(b.a), j < 0 ? 0.4 : 0.5, p[2]]);
  });
  const hand = tossScene(HAND[0], HAND[1]);
  let held: number[] | null = null, dots: number[][] = [], ring = 0;
  if (aim) {
    held = tossScene(HAND[0] + aim[0], HAND[1] + aim[1]);
    ring = Math.abs(tossScene(HAND[0] + PULL_MAX, HAND[1])[0] - hand[0]);
    if (Math.hypot(aim[0], aim[1]) > 10) {
      let x = HAND[0] + aim[0], y = HAND[1] + aim[1], vx = -aim[0] * LAUNCH, vy = -aim[1] * LAUNCH;
      for (let i = 0; i < 10; i++) { const st = 1 / 40; vy += GRAV * st; x += vx * st; y += vy * st; dots.push(tossScene(x, y)); }
    }
  }
  const th = toss.thrown ? tossScene(toss.thrown.x, toss.thrown.y) : null;
  const floor = toss.bodies.length - (toss.thrown ? 1 : 0) - binCans;
  return {
    cans, hand, held, dots, ring, ready: !toss.thrown && !aim && tossDone < 0,
    thrown: th ? [th[0], th[1], quarter(toss.thrown!.a), th[2]] : null,
    verdict: tossDone >= 0 ? [verdict, toss.inBin] : null, floor,
  };
}

const STEP_NO: Record<MonsterGame['stage'], number> = { drawer: 1, grab: 2, open: 3, drink: 4, toss: 5 };
const SAY: Record<MonsterGame['stage'], string> = {
  drawer: 'Pull the drawer open.', grab: 'Drag a can to its spot on the desk.', open: 'Pull the tab up.',
  drink: 'Hold the can at his mouth. Hold Space to tilt, let go to tilt back.', toss: 'One throw. A miss stays on the floor.',
};
/** One frame of the break: its motion, and the renderer's view of it (null when there is no break). */
export function monsterView() {
  const g = G();
  if (!g) { lastGame = null; return null; }
  if (lastGame !== g) { reset(g); (document.activeElement as HTMLElement | null)?.blur?.(); }   // a focused button would eat Space
  if (lastStage !== g.stage) { lastStage = g.stage; enterStage(g.stage); }
  const now = performance.now() / 1000, dt = Math.min(1 / 30, lastT ? now - lastT : 1 / 60); lastT = now;
  if (S.g.paused) return null;
  const stage = g.stage;   // a step may end this frame (the rules move the stage on): this frame still shows it
  const scene = stage === 'drawer' ? stepDrawer(g, dt) : stage === 'grab' ? stepGrab(g, dt) : stage === 'open' ? stepOpen(g, dt) : stage === 'drink' ? stepDrink(g, dt, now) : stepThrow(g, dt);
  return { step: STEP_NO[stage], say: SAY[stage], note: g.feedback || '', n: cansInDrawer(), scene };
}

// Test hooks (playtest scripts): the physics, and where a physics or scene point is on the page's right screen.
const W = window as unknown as Record<string, unknown>;
W.__lnThrow = (vx: number, vy: number) => { if (toss.thrown || tossDone >= 0) return false; aim = [-vx / LAUNCH, -vy / LAUNCH]; throwCan(); return true; };
W.__lnFluid = () => ({ drunk: pour.drunk, inCan: inCan(pour), held: pour.held, a: pour.a, x: pour.x, y: pour.y, mx: MOUTH.x, my: MOUTH.y });
W.__lnToss = () => ({ bodies: toss.bodies.length, thrown: toss.thrown ? { x: toss.thrown.x, y: toss.thrown.y, asleep: toss.thrown.asleep } : null, done: tossDone, verdict });
W.__lnEb = () => ({ drawer, grabK, tab, popT, handle: PK.ebMap.drawerHandle(drawer), cans: PK.ebMap.drawerCans(cansInDrawer()), spot: PK.ebMap.grabAt(1), tabAt: PK.ebMap.openTab(tab), drinkOff: drinkOff(), hand: tossScene(HAND[0], HAND[1]) });
