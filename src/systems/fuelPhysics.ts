// Goblin Fuel physics (#61): the drink (particles in a tilting can, his mouth swallows at a steady rate) and the
// throw (rigid capsules with friction, sleeping cans as walls until hit). No drawing here: ui/monsterScene.ts draws
// and feeds input; test/pour.ts and test/toss.ts run these headless. Scene units are px of the 600x300 canvas.
import { T } from '../config/tuning';

export type V = [number, number];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const GRAV = 1100;

// ---------- the drink (side view) ----------
export const DESK_TOP = 236;                       // off screen in the zoomed drink view, but spills still land on it
export const REST: V = [322, 168];                 // where the can floats when you let go of it
/** His head (the profile sprite's origin). He tips it back to drink: the head turns by HEAD_TILT about the neck. */
export const HEAD_O: V = [470, 118];
export const HEAD_TILT = 0.3, NECK: V = [-4, 38];
/** A point of his profile (head coords) where it is now, with the head tipped back. */
export function headPt(px: number, py: number): V {
  const dx = px - NECK[0], dy = py - NECK[1], c = Math.cos(HEAD_TILT), s = Math.sin(HEAD_TILT);
  return [HEAD_O[0] + NECK[0] + dx * c - dy * s, HEAD_O[1] + NECK[1] + dx * s + dy * c];
}
const LIPS = headPt(-38, 26);
export const MOUTH = { x: LIPS[0], y: LIPS[1], rx: 8, ry: 7 };
/** The can's inside in its own coords (y down, the top at -39), and the opening in the lid. */
export const IN = { l: -19, r: 19, t: -39, b: 40 }, HOLE = { l: 4, r: 19 };
/** A rough outline of his face and of his body: drink that hits them is spilled. */
const FACE_HIT: V[] = [[34, -6], [30, -34], [10, -48], [-16, -46], [-30, -34], [-35, -18], [-38, -2], [-46, 10], [-38, 15], [-38, 21], [-35, 25], [-38, 29], [-35, 36], [-33, 44], [-20, 50], [0, 46], [18, 30], [30, 14]];
const BODY_HIT: V[] = [[-26, 62], [-6, 56], [30, 60], [56, 76], [66, 110], [70, 190], [-40, 190], [-44, 130], [-38, 96]];
const FACE_W = FACE_HIT.map(([x, y]) => headPt(x, y)), BODY_W = BODY_HIT.map(([x, y]) => [HEAD_O[0] + x, HEAD_O[1] + y] as V);
export function inPoly(pts: V[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const PD = 5.2;                                    // particle spacing

/** s: 0 in the can, 1 in the air, 2 swallowed, 3 spilled. */
export interface Drop { x: number; y: number; px: number; py: number; vx: number; vy: number; s: 0 | 1 | 2 | 3; t: number; over?: boolean }
export interface Pour {
  x: number; y: number; a: number; held: boolean;
  drops: Drop[]; mouth: number; drunk: number; open: number; gulp: number;
  gulpAcc: number; overflow: number[]; coughCd: number; t: number; puddle: number[]; done: boolean;
}
export interface PourInput { held: boolean; tx: number; ty: number; tilt: boolean }
export interface PourEvents { gulp?(): void; splash?(): void; cough?(): void }

export function newPour(): Pour {
  const [rx, ry] = REST, drops: Drop[] = [], cols = 7;
  for (let i = 0; i < T.MONSTER_FLUID_N; i++) {
    const lx = -15.6 + (i % cols) * 5.2 + (Math.floor(i / cols) % 2) * 1.3, ly = IN.b - 2.6 - Math.floor(i / cols) * 4.6;
    drops.push({ x: rx + lx, y: ry + ly, px: rx + lx, py: ry + ly, vx: 0, vy: 0, s: 0, t: 0 });
  }
  return { x: rx, y: ry, a: 0, held: false, drops, mouth: 0, drunk: 0, open: 0, gulp: 0, gulpAcc: 0, overflow: [], coughCd: 0, t: 0, puddle: [], done: false };
}
/** Where the opening is in the scene, for a can at (x, y) tilted by a (clockwise, toward him). */
export function holeAt(x: number, y: number, a: number): V { return [x + 12 * Math.cos(a) + 40 * Math.sin(a), y + 12 * Math.sin(a) - 40 * Math.cos(a)]; }
/** Where to hold the can so its opening sits on (hx, hy) at tilt a. */
export function canFor(hx: number, hy: number, a: number): V { return [hx - (12 * Math.cos(a) + 40 * Math.sin(a)), hy - (12 * Math.sin(a) - 40 * Math.cos(a))]; }
export const share = (p: Pour) => p.drunk / p.drops.length;
export const inCan = (p: Pour) => p.drops.reduce((k, d) => k + (d.s === 0 ? 1 : 0), 0);
export const inAir = (p: Pour) => p.drops.reduce((k, d) => k + (d.s === 1 ? 1 : 0), 0);

function fluidStep(p: Pour, dt: number) {
  const cs = Math.cos(p.a), sn = Math.sin(p.a);
  const act = p.drops.filter(d => d.s < 2);
  for (const d of act) { d.vy += GRAV * dt; d.px = d.x; d.py = d.y; d.x += d.vx * dt; d.y += d.vy * dt; }
  for (let it = 0; it < 2; it++) {
    for (let i = 0; i < act.length; i++) {
      const a = act[i];
      for (let j = i + 1; j < act.length; j++) {
        const b = act[j], dx = b.x - a.x, dy = b.y - a.y;
        if (dx > PD || dx < -PD || dy > PD || dy < -PD) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 >= PD * PD || d2 < 1e-6) continue;
        const d = Math.sqrt(d2), k = ((PD - d) / d) * 0.4;
        a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k;
      }
    }
    for (const d of act) if (d.s === 0) {
      const dx = d.x - p.x, dy = d.y - p.y;
      let lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;
      if (ly < IN.t) { if (lx > HOLE.l && lx <= HOLE.r + 0.5) { d.s = 1; continue; } ly = IN.t; }
      ly = Math.min(ly, IN.b); lx = clamp(lx, IN.l, IN.r);
      d.x = p.x + lx * cs - ly * sn; d.y = p.y + lx * sn + ly * cs;
    }
  }
  for (const d of act) {
    const damp = d.s === 0 ? 0.985 : 0.998;        // the can's walls calm the slosh a little
    d.vx = ((d.x - d.px) / dt) * damp; d.vy = ((d.y - d.py) / dt) * damp;
    const sp = Math.hypot(d.vx, d.vy); if (sp > 700) { d.vx *= 700 / sp; d.vy *= 700 / sp; }
  }
}

/** One frame of the drink. The can follows the hand while held; Space tilts it toward him, letting go tilts it back. */
export function stepPour(p: Pour, dt: number, inp: PourInput, ev: PourEvents = {}) {
  p.t += dt;
  p.held = inp.held && !p.done;
  const [rx, ry] = REST;
  if (p.held) {
    const k = Math.min(1, dt * 10);
    p.x += (clamp(inp.tx, 160, 410) - p.x) * k; p.y += (clamp(inp.ty, 60, ry) - p.y) * k;
  } else { const k = Math.min(1, dt * 8); p.x += (rx - p.x) * k; p.y += (ry - p.y) * k; }
  if (p.held && inp.tilt) p.a = Math.min(T.MONSTER_TILT_MAX, p.a + T.MONSTER_TILT_SPEED * dt);
  else p.a = Math.max(0, p.a - T.MONSTER_TILT_BACK * dt);
  for (let i = 0; i < 3; i++) fluidStep(p, dt / 3);
  // the mouth opens when the opening comes close to it
  const [hx, hy] = holeAt(p.x, p.y, p.a);
  p.open += ((p.held && Math.hypot(hx - MOUTH.x, hy - MOUTH.y) < 46 ? 1 : 0) - p.open) * Math.min(1, dt * 10);
  // lips on the opening: what comes out goes in (as fast as he can swallow)
  const lips = p.open > 0.5 && Math.hypot(hx - MOUTH.x, hy - MOUTH.y) < T.MONSTER_LIPS;
  for (const d of p.drops) {
    if (d.s === 1) {
      const mx = (d.x - MOUTH.x) / MOUTH.rx, my = (d.y - MOUTH.y) / MOUTH.ry;
      if (!d.over && ((lips && Math.hypot(d.x - hx, d.y - hy) < 12) || (mx * mx + my * my < 1 && p.open > 0.4))) {
        if (p.mouth < T.MONSTER_MOUTH_CAP) { d.s = 2; p.mouth++; p.drunk++; }
        else { d.over = true; d.vx = 50; d.vy = 40; p.overflow.push(p.t); }        // too much at once: down his chin
      } else if (inPoly(FACE_W, d.x, d.y) || inPoly(BODY_W, d.x, d.y)) { d.s = 3; d.t = 0; d.vx = 0; d.vy = 30; }
      else if (d.y > DESK_TOP - 2.6 && d.x < 404) { d.s = 3; d.t = 0; d.y = DESK_TOP; d.vy = 0; p.puddle.push(d.x); ev.splash?.(); }
      else if (d.y > 320 || d.x < -10 || d.x > 610) { d.s = 3; d.t = 9; }
    } else if (d.s === 3) { d.t += dt; d.y += d.vy * dt; d.vy = Math.max(0, d.vy - 40 * dt); }
  }
  // he swallows at a steady rate
  const sw = Math.min(p.mouth, T.MONSTER_SWALLOW * dt);
  p.mouth -= sw; p.gulpAcc += sw;
  if (p.gulpAcc >= 6) { p.gulpAcc -= 6; p.gulp = 1; ev.gulp?.(); }
  p.gulp = Math.max(0, p.gulp - dt * 3);
  p.overflow = p.overflow.filter(x => p.t - x < 0.7);
  p.coughCd -= dt;
  if (p.overflow.length >= 5 && p.coughCd <= 0) {                                 // choked on it: what's at his lips sprays out
    p.coughCd = 2.5; p.overflow = [];
    for (const d of p.drops) if (d.s === 1 && Math.hypot(d.x - MOUTH.x, d.y - MOUTH.y) < 40) { d.vx = -160 - Math.random() * 120; d.vy = -60; d.over = true; }
    ev.cough?.();
  }
  if (!p.done && inCan(p) <= 2 && inAir(p) === 0 && p.mouth < 0.5) { p.done = true; p.held = false; }
}

// ---------- the throw (side view) ----------
export const FLOOR = 272, BIN = { l: 468, r: 542, top: 196, bl: 477, br: 533 };
export const CR = 8.5, CHL = 13;                  // a can: a capsule of radius CR around a segment of half-length CHL
const INERTIA = 95;
export const HAND: V = [272, 146], PULL_MAX = 62, LAUNCH = 13;   // his throwing hand; the slingshot's reach and strength
export const DESK_T = { y: 168, x1: 0, x2: 150 };
const SW = 600;
const STATICS: [number, number, number, number][] = [
  [-40, FLOOR, SW + 40, FLOOR], [0, -60, 0, FLOOR], [SW, -60, SW, FLOOR], [0, 0, SW, 0], [DESK_T.x1, DESK_T.y, DESK_T.x2, DESK_T.y],
  [BIN.l, BIN.top, BIN.bl, FLOOR], [BIN.r, BIN.top, BIN.br, FLOOR],
];
/** Where an empty dropped by the chair lies (toss-view px). */
export const DROPPED = { x: 318, y: FLOOR - CR - 0.8, a: 0 };

export interface Body { x: number; y: number; vx: number; vy: number; a: number; w: number; sleep: number; asleep: boolean }
export interface Toss { bodies: Body[]; thrown: Body | null; t: number; touched: { rim: boolean; wall: boolean }; entered: boolean; settled: boolean; inBin: boolean }
export interface TossEvents { clank?(power: number): void; binDrop?(): void }
export const inBinAt = (x: number, y: number) => x > BIN.bl - 2 && x < BIN.br + 2 && y > BIN.top;

export function newToss(poses: { x: number; y: number; a: number }[]): Toss {
  return { bodies: poses.map(p => ({ x: p.x, y: p.y, vx: 0, vy: 0, a: p.a, w: 0, sleep: 1, asleep: true })), thrown: null, t: 0, touched: { rim: false, wall: false }, entered: false, settled: false, inBin: false };
}
/** The slingshot: the can starts where it was pulled to (hand + pull) and flies the other way. */
export function launch(s: Toss, pullX: number, pullY: number) {
  const b: Body = { x: HAND[0] + pullX, y: HAND[1] + pullY, vx: -pullX * LAUNCH, vy: -pullY * LAUNCH, a: -Math.PI / 2, w: clamp(-pullX * 0.06, -6, 6) + 2, sleep: 0, asleep: false };
  s.thrown = b; s.bodies.push(b);
}

const axis = (b: Body): [number, number, number, number] => { const ux = Math.cos(b.a) * CHL, uy = Math.sin(b.a) * CHL; return [b.x - ux, b.y - uy, b.x + ux, b.y + uy]; };
function closestSegSeg(p1x: number, p1y: number, q1x: number, q1y: number, p2x: number, p2y: number, q2x: number, q2y: number): [number, number, number, number] {
  const d1x = q1x - p1x, d1y = q1y - p1y, d2x = q2x - p2x, d2y = q2y - p2y, rx = p1x - p2x, ry = p1y - p2y;
  const a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry;
  let s = 0, t = 0;
  if (a <= 1e-9 && e <= 1e-9) { s = 0; t = 0; }
  else if (a <= 1e-9) { t = clamp(f / e, 0, 1); }
  else {
    const cc = d1x * rx + d1y * ry;
    if (e <= 1e-9) { s = clamp(-cc / a, 0, 1); }
    else {
      const b = d1x * d2x + d1y * d2y, den = a * e - b * b;
      s = den > 1e-9 ? clamp((b * f - cc * e) / den, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-cc / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - cc) / a, 0, 1); }
    }
  }
  return [p1x + d1x * s, p1y + d1y * s, p2x + d2x * t, p2y + d2y * t];
}
function closestPtSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number): V {
  const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy, k = l ? clamp(((px - x1) * dx + (py - y1) * dy) / l, 0, 1) : 0;
  return [x1 + dx * k, y1 + dy * k];
}
/** One contact, A against B (null = a wall). n points from B to A. Returns the closing speed. */
function resolve(A: Body, B: Body | null, cx: number, cy: number, nx: number, ny: number, pen: number): number {
  const invB = B ? 1 : 0, invIB = invB / INERTIA;
  const corr = (Math.max(0, pen - 0.2) * 0.7) / (1 + invB);
  A.x += nx * corr; A.y += ny * corr; if (B) { B.x -= nx * corr; B.y -= ny * corr; }
  const rax = cx - A.x, ray = cy - A.y, rbx = B ? cx - B.x : 0, rby = B ? cy - B.y : 0;
  const vax = A.vx - A.w * ray, vay = A.vy + A.w * rax, vbx = B ? B.vx - B.w * rby : 0, vby = B ? B.vy + B.w * rbx : 0;
  const vn = (vax - vbx) * nx + (vay - vby) * ny;
  if (vn >= 0) return 0;
  const ran = rax * ny - ray * nx, rbn = rbx * ny - rby * nx;
  const kn = 1 + invB + (ran * ran) / INERTIA + rbn * rbn * invIB;
  const e = -vn > 70 ? 0.3 : 0;
  const j = (-(1 + e) * vn) / kn;
  A.vx += j * nx; A.vy += j * ny; A.w += (ran * j) / INERTIA;
  if (B) { B.vx -= j * nx; B.vy -= j * ny; B.w -= rbn * j * invIB; }
  const tx = -ny, ty = nx;                         // friction
  const vax2 = A.vx - A.w * ray, vay2 = A.vy + A.w * rax, vbx2 = B ? B.vx - B.w * rby : 0, vby2 = B ? B.vy + B.w * rbx : 0;
  const vt = (vax2 - vbx2) * tx + (vay2 - vby2) * ty;
  const rat = rax * ty - ray * tx, rbt = rbx * ty - rby * tx;
  const kt = 1 + invB + (rat * rat) / INERTIA + rbt * rbt * invIB;
  const jt = clamp(-vt / kt, -0.45 * j, 0.45 * j);
  A.vx += jt * tx; A.vy += jt * ty; A.w += (rat * jt) / INERTIA;
  if (B) { B.vx -= jt * tx; B.vy -= jt * ty; B.w -= rbt * jt * invIB; }
  return -vn;
}
function bodiesStep(s: Toss, dt: number): number {
  let hit = 0;
  const { bodies, thrown } = s;
  for (const b of bodies) if (!b.asleep) { b.vy += GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt; b.w *= 0.997; }
  for (let it = 0; it < 4; it++) {
    for (const A of bodies) {
      if (A.asleep) continue;
      const [ax1, ay1, ax2, ay2] = axis(A);
      for (const [sx1, sy1, sx2, sy2] of STATICS) {
        const cands: [number, number, number, number][] = [];
        for (const [px, py] of [[ax1, ay1], [ax2, ay2]] as V[]) { const [qx, qy] = closestPtSeg(px, py, sx1, sy1, sx2, sy2); cands.push([px, py, qx, qy]); }
        cands.push(closestSegSeg(ax1, ay1, ax2, ay2, sx1, sy1, sx2, sy2));
        for (const [px, py, qx, qy] of cands) {
          let nx = px - qx, ny = py - qy; const d = Math.hypot(nx, ny), pen = CR + 1 - d;
          if (pen <= 0) continue;
          if (d < 1e-6) { nx = 0; ny = -1; } else { nx /= d; ny /= d; }
          const v = resolve(A, null, px - nx * CR, py - ny * CR, nx, ny, pen);
          hit = Math.max(hit, v);
          if (A === thrown && v > 30) {
            if ((sx1 === BIN.l || sx1 === BIN.r) && qy < BIN.top + 16) s.touched.rim = true;
            if (sx1 === SW || (sy1 === 0 && sy2 === 0)) s.touched.wall = true;
          }
        }
      }
    }
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const A = bodies[i], B = bodies[j];
      if (A.asleep && B.asleep) continue;
      if (Math.abs(A.x - B.x) > 2 * (CHL + CR) + 2 || Math.abs(A.y - B.y) > 2 * (CHL + CR) + 2) continue;
      const [a1, a2, a3, a4] = axis(A), [b1, b2, b3, b4] = axis(B);
      const [px, py, qx, qy] = closestSegSeg(a1, a2, a3, a4, b1, b2, b3, b4);
      let nx = px - qx, ny = py - qy; const d = Math.hypot(nx, ny), pen = 2 * CR - d;
      if (pen <= 0) continue;
      if (d < 1e-6) { nx = 0; ny = -1; } else { nx /= d; ny /= d; }
      const mover = A.asleep ? B : A, other = mover === A ? B : A, sg = mover === A ? 1 : -1;
      // a sleeping can is a wall until it is hit hard enough to wake
      const v = resolve(mover, other.asleep ? null : other, (px + qx) / 2, (py + qy) / 2, nx * sg, ny * sg, pen);
      if (other.asleep && v > 25) { other.asleep = false; other.sleep = 0; }
      hit = Math.max(hit, v);
    }
  }
  for (const b of bodies) if (!b.asleep) {
    if (Math.hypot(b.vx, b.vy) < 7 && Math.abs(b.w) < 0.5) { b.sleep += dt; if (b.sleep > 0.45) { b.asleep = true; b.vx = b.vy = b.w = 0; } } else b.sleep = 0;
  }
  return hit;
}
/** One frame of the throw. Settles once the thrown can sleeps (or after 7 s). */
export function stepToss(s: Toss, dt: number, ev: TossEvents = {}) {
  let hit = 0;
  for (let i = 0; i < 6; i++) hit = Math.max(hit, bodiesStep(s, dt / 6));
  if (hit > 90) ev.clank?.(clamp(hit / 700, 0, 1));
  const b = s.thrown;
  if (!b || s.settled) return;
  s.t += dt;
  const inside = b.x > BIN.bl && b.x < BIN.br && b.y > BIN.top + 4;
  if (inside && !s.entered) { s.entered = true; ev.binDrop?.(); }
  if (b.asleep || s.t > 7) { s.settled = true; s.inBin = inside; }
}
export function tossStyle(s: Toss): 'swish' | 'bank' | 'rim' { return s.touched.wall ? 'bank' : s.touched.rim ? 'rim' : 'swish'; }
/** Every can's resting place, split into the bin and the floor. */
export function tossPoses(s: Toss) {
  const bin: { x: number; y: number; a: number }[] = [], floor: { x: number; y: number; a: number }[] = [];
  for (const b of s.bodies) (inBinAt(b.x, b.y) ? bin : floor).push({ x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, a: Math.round(b.a * 100) / 100 });
  return { bin, floor };
}
