// Goblin Fuel, the energy break (#61, #62, docs/design/desk.md). Five steps on one canvas, in a dark room:
// 1 Drawer: top-down, close on the drawer; grab the handle and pull it out.
// 2 Grab: drag a can from the drawer to its spot on the desk, right of the mouse pad (same shot).
// 3 Open: the whole can on the desk, its branding in view; pull the tab up until the seal pops.
// 4 Drink: close on him in profile, his head tipped back. The can floats: hold it with the mouse, hold Space to
//   tilt it, let go to tilt back.
// 5 Toss: the floating can, the bin and the room; one throw. A miss stays on the floor for good (S.g.floorCans).
// The cursor does the handling (no hands); he appears only in the drink, as the left panel's silhouette in profile
// through the same pixel pipeline. Physics: systems/fuelPhysics.ts. Rules: systems/monster.ts (code names say "monster").
import { T } from '../config/tuning';
import { S, type MonsterGame } from '../core/state';
import { monsterDrawerOpen, monsterPlaced, monsterOpenCan, monsterCough, monsterDrank, monsterClank, monsterTossed } from '../systems/monster';
import {
  type V, type Pour, type Toss, newPour, stepPour, share, holeAt, HEAD_O, HEAD_TILT, NECK, headPt, MOUTH,
  newToss, launch, stepToss, tossStyle, tossPoses, FLOOR, BIN, CR, CHL, HAND, PULL_MAX, LAUNCH, DESK_T, GRAV,
} from '../systems/fuelPhysics';
import { pixelSprite, smooth, cel, type Pt } from './pixel';
import { sfx } from './audio';

export const SW = 600, SH = 300;
type Ctx = CanvasRenderingContext2D;
const HC = { body: '#0d0d11', bodyS: '#09090c', head: '#0f0f13', headS: '#0b0b0e', hair: '#0a0a0d', hairS: '#070709', shine: '#2a2a33', chair: '#15151a', chairS: '#101014', rim: '#2e2e38', frame: '#030304', lens: '#fbfbff', line: '#3e3e4a' };
const FUEL = '#b8e637', FUEL_RGB = '184,230,55';
const WOOD = '#241a12', WOOD_D = '#160f0a';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (i: number, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); c.roundRect(x, y, w, h, r); }
/** Crisp text in canvas px (call after screen()). */
function say(c: Ctx, t: string, x: number, y: number, font: string, fill: string, align: CanvasTextAlign = 'center', alpha = 1) {
  c.save(); c.globalAlpha = alpha; c.font = font; c.fillStyle = fill; c.textAlign = align; c.textBaseline = 'middle';
  c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(t, x, y); c.fillText(t, x, y); c.restore();
}
function ringHint(c: Ctx, x: number, y: number, rx: number, ry: number, t: number) {
  c.save(); c.strokeStyle = `rgba(${FUEL_RGB},${0.55 + Math.sin(t * 5) * 0.3})`; c.lineWidth = 2; c.setLineDash([6, 5]); c.lineDashOffset = -t * 18;
  c.beginPath(); c.ellipse(x, y, rx + Math.sin(t * 5) * 2, ry + Math.sin(t * 5) * 1.5, 0, 0, Math.PI * 2); c.stroke(); c.restore();
}

// ---------- cameras: steps 1-2 and 4 are drawn closer (world px = the physics' scene px) ----------
interface Cam { s: number; ox: number; oy: number }
const CAM_TOP: Cam = { s: 1.4, ox: 170, oy: 76 }, CAM_DRINK: Cam = { s: 1.6, ox: 200, oy: 48 }, CAM_FLAT: Cam = { s: 1, ox: 0, oy: 0 };
const camFor = (stage: MonsterGame['stage']) => (stage === 'drawer' || stage === 'grab' ? CAM_TOP : stage === 'drink' ? CAM_DRINK : CAM_FLAT);
let cam = CAM_FLAT;
const toScr = (x: number, y: number): V => [(x - cam.ox) * cam.s, (y - cam.oy) * cam.s];
function world(c: Ctx) { c.setTransform(cam.s, 0, 0, cam.s, -cam.ox * cam.s + shakeX, -cam.oy * cam.s + shakeY); }
function screen(c: Ctx) { c.setTransform(1, 0, 0, 1, shakeX, shakeY); }
let shakeX = 0, shakeY = 0;

// ---------- him in profile (facing left), only in the drink: the left panel's silhouette, head tipped back ----------
const PF: Pt[] = [[34, -6], [30, -34], [10, -48], [-16, -46], [-30, -34], [-35, -18], [-34, -10], [-38, -2], [-46, 10, 1], [-38, 15, 1], [-38, 21], [-35, 25, 1], [-38, 29], [-35, 36], [-33, 44], [-20, 50], [0, 46], [18, 30], [30, 14]];
const PH: Pt[] = [[-38, -14], [-42, -30], [-32, -50], [-8, -60], [20, -57], [38, -42], [45, -18], [42, 8], [34, 28], [24, 36, 1], [20, 16], [16, -4], [6, -12, 1], [-6, -16], [-13, -9, 1], [-19, -19], [-27, -11, 1], [-31, -21], [-38, -8, 1]];
const PE: Pt[] = [[0, -6], [10, -10], [14, 2], [8, 12], [2, 8]];
const PN: Pt[] = [[-22, 40], [4, 38], [14, 72], [-18, 74]];
const PT: Pt[] = [[-24, 62], [-4, 56], [30, 60], [56, 76], [68, 110], [72, 190, 1], [-42, 190, 1], [-46, 132], [-40, 96]];
const P_CHAIR: Pt[] = [[56, -14], [86, -20, 1], [94, 190, 1], [62, 190, 1]];
function head(c: Ctx) {
  cel(c, smooth(PF), HC.head, HC.headS, 1);
  cel(c, smooth(PH), HC.hair, HC.hairS, 1.2);
  cel(c, smooth(PE), HC.head, HC.headS, 0.8);
  c.fillStyle = HC.shine; c.fillRect(-20, -52, 13, 2); c.fillRect(4, -56, 11, 2); c.fillRect(24, -46, 8, 2);   // anime hair shine
  c.strokeStyle = HC.rim; c.lineWidth = 2; c.beginPath(); c.moveTo(-35, -7); c.lineTo(4, -3); c.stroke();     // the glasses' arm
  c.fillStyle = HC.frame; c.beginPath(); c.roundRect(-45, -16, 10, 17, 4); c.fill();
  c.fillStyle = HC.lens; c.beginPath(); c.roundRect(-44, -15, 7.5, 14.5, 3.5); c.fill();
}
function bodyDrink(c: Ctx) {
  cel(c, smooth(P_CHAIR), HC.chair, HC.chairS, 1);
  cel(c, smooth(PT), HC.body, HC.bodyS, 1.2);
  cel(c, smooth(PN), HC.body, HC.bodyS, 1);
  c.save(); c.translate(NECK[0], NECK[1]); c.rotate(HEAD_TILT); c.translate(-NECK[0], -NECK[1]); head(c); c.restore();
}
/** Drawn at the drink camera's scale so the 1px outline stays 1px on screen. */
const SP = { w: 236, h: 262, ox: 126, oy: 72 };
const himDrink = () => pixelSprite('himP:drink2', Math.round(SP.w * CAM_DRINK.s), Math.round(SP.h * CAM_DRINK.s), cc => { cc.scale(CAM_DRINK.s, CAM_DRINK.s); cc.translate(SP.ox, SP.oy); bodyDrink(cc); }, { outline: HC.line });
/** The screen's light on his lens. */
function lensGlow(c: Ctx, x: number, y: number, t: number, r = 20) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(220,232,255,${0.5 + Math.sin(t * 2) * 0.04})`); g.addColorStop(0.5, 'rgba(220,232,255,.14)'); g.addColorStop(1, 'rgba(220,232,255,0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
/** A monitor seen from the side, its screen facing right, its light thrown across the room. */
function monitorSide(c: Ctx, x: number, top: number, bot: number, desk: number, reach: number) {
  const mid = (top + bot) / 2;
  c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x + 3, mid); c.scale(1, 0.62);
  const g = c.createRadialGradient(0, 0, 4, 0, 0, reach); g.addColorStop(0, 'rgba(130,150,255,.22)'); g.addColorStop(0.35, 'rgba(130,150,255,.08)'); g.addColorStop(1, 'rgba(130,150,255,0)');
  c.fillStyle = g; c.fillRect(-reach, -reach, reach * 2, reach * 2);
  c.restore();
  c.fillStyle = '#101015'; c.beginPath(); c.moveTo(x - 6, top + 14); c.lineTo(x - 20, mid - 22); c.lineTo(x - 20, mid + 22); c.lineTo(x - 6, bot - 14); c.fill();
  c.fillStyle = '#16161c'; rr(c, x - 7, top, 9, bot - top, 2); c.fill();
  c.fillStyle = '#c4ceff'; c.fillRect(x + 2, top + 3, 2, bot - top - 6);
  c.fillStyle = '#121217'; c.fillRect(x - 15, mid, 7, desk - mid); rr(c, x - 30, desk - 5, 40, 5, 2); c.fill();
}

// ---------- the cans: B "Chest Burst" (design chat, docs/design/desk.md) ----------
// A vector stand-in for the pixel sprites until their PNGs are in the repo: plum neck band ("100% GREED"),
// acid-green field, a gold burst, the crowned goblin bursting out of a loot chest (coin and ruby held up),
// a plum band with the wordmark. One painter, cached per size, used by every view of the can.
const GF = {
  a1: '#1d4f26', a2: '#3b8424', a3: '#7cc21f', a4: '#b8e637', a5: '#e6f58c',
  plum: '#3d1f42', plumL: '#5b3062', gold: '#e8b830', pale: '#f8e38c', copper: '#b4642a', wine: '#6a2236', ruby: '#d8304a',
  wood: '#6b3f22', woodD: '#3e2316', skin: '#6f9e86', skinD: '#4b7563', eye: '#ffd23a',
  metal: '#c9ced6', metalD: '#7c838e', metalL: '#eef1f5',
};
function star(c: Ctx, x: number, y: number, n: number, R: number, r: number, sy = 1) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, d = i % 2 ? r : R; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * sy; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath();
}
function paintLabel(c: Ctx, w: number, h: number, detail: boolean) {
  const band = h * 0.1, foot = h * 0.25, mid = band + (h - band - foot) / 2;
  const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, GF.a3); g.addColorStop(0.28, GF.a4); g.addColorStop(0.62, GF.a3); g.addColorStop(1, GF.a2);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  // the gold burst
  const bx = w / 2, by = mid - h * 0.02;
  c.fillStyle = GF.gold; star(c, bx, by, 12, w * 0.5, w * 0.31, 1.15); c.fill();
  c.fillStyle = GF.pale; star(c, bx, by, 12, w * 0.34, w * 0.22, 1.15); c.fill();
  // coins flung in the air
  if (detail) for (const [cx, cy, r] of [[0.14, 0.2, 0.05], [0.86, 0.24, 0.045], [0.1, 0.5, 0.04], [0.9, 0.55, 0.05]] as number[][]) {
    c.fillStyle = GF.copper; c.beginPath(); c.arc(w * cx + 0.6, h * cy + 0.6, w * r, 0, Math.PI * 2); c.fill();
    c.fillStyle = GF.gold; c.beginPath(); c.arc(w * cx, h * cy, w * r, 0, Math.PI * 2); c.fill();
  }
  // the goblin: arms up (a coin, a ruby), ears, head, crown, the grin
  const hx = w / 2, hy = mid - h * 0.04, hr = w * 0.15;
  c.strokeStyle = GF.skinD; c.lineCap = 'round'; c.lineWidth = w * 0.085;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(hx + s * hr * 0.8, hy + hr * 1.5); c.quadraticCurveTo(hx + s * w * 0.36, hy + hr * 0.6, hx + s * w * 0.33, hy - hr * 1.4); c.stroke(); }
  c.strokeStyle = GF.skin; c.lineWidth = w * 0.06;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(hx + s * hr * 0.8, hy + hr * 1.5); c.quadraticCurveTo(hx + s * w * 0.36, hy + hr * 0.6, hx + s * w * 0.33, hy - hr * 1.4); c.stroke(); }
  c.fillStyle = GF.gold; c.beginPath(); c.arc(hx - w * 0.33, hy - hr * 1.75, w * 0.06, 0, Math.PI * 2); c.fill();
  c.fillStyle = GF.ruby; c.beginPath(); c.moveTo(hx + w * 0.33, hy - hr * 2.3); c.lineTo(hx + w * 0.39, hy - hr * 1.75); c.lineTo(hx + w * 0.33, hy - hr * 1.2); c.lineTo(hx + w * 0.27, hy - hr * 1.75); c.closePath(); c.fill();
  for (const s of [-1, 1]) {
    c.fillStyle = GF.skin; c.beginPath(); c.moveTo(hx + s * hr * 0.7, hy - hr * 0.3); c.lineTo(hx + s * hr * 2.2, hy - hr * 0.9); c.lineTo(hx + s * hr * 0.8, hy + hr * 0.35); c.closePath(); c.fill();
    c.fillStyle = GF.wine; c.beginPath(); c.moveTo(hx + s * hr * 0.9, hy - hr * 0.2); c.lineTo(hx + s * hr * 1.8, hy - hr * 0.68); c.lineTo(hx + s * hr * 0.95, hy + hr * 0.15); c.closePath(); c.fill();
  }
  c.fillStyle = GF.skin; c.beginPath(); c.ellipse(hx, hy, hr, hr * 1.05, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(hx + hr * 0.15, hy - hr * 0.95); c.rotate(0.22);                         // the crown, tipped
  c.fillStyle = GF.gold; c.beginPath(); c.moveTo(-hr * 0.6, 0); c.lineTo(-hr * 0.6, -hr * 0.5); c.lineTo(-hr * 0.3, -hr * 0.2); c.lineTo(0, -hr * 0.6); c.lineTo(hr * 0.3, -hr * 0.2); c.lineTo(hr * 0.6, -hr * 0.5); c.lineTo(hr * 0.6, 0); c.closePath(); c.fill();
  c.restore();
  c.fillStyle = GF.eye; c.beginPath(); c.ellipse(hx - hr * 0.38, hy - hr * 0.12, hr * 0.3, hr * 0.32, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(hx + hr * 0.4, hy - hr * 0.16, hr * 0.24, hr * 0.26, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#120a0e'; c.fillRect(hx - hr * 0.42, hy - hr * 0.14, Math.max(1, hr * 0.12), Math.max(1, hr * 0.12)); c.fillRect(hx + hr * 0.44, hy - hr * 0.2, Math.max(1, hr * 0.12), Math.max(1, hr * 0.12));
  c.fillStyle = '#120a0e'; c.beginPath(); c.moveTo(hx - hr * 0.7, hy + hr * 0.3); c.quadraticCurveTo(hx, hy + hr * 1.05, hx + hr * 0.7, hy + hr * 0.3); c.closePath(); c.fill();
  if (detail) { c.fillStyle = '#f4f1ea'; for (let i = -2; i <= 2; i++) c.fillRect(hx + i * hr * 0.25 - hr * 0.05, hy + hr * 0.32, hr * 0.1, hr * 0.14); c.fillStyle = GF.gold; c.fillRect(hx + hr * 0.2, hy + hr * 0.32, hr * 0.12, hr * 0.16); }
  // the chest, lid open, gold spilling over the lip
  const cx0 = w * 0.18, cw = w * 0.64, cy0 = mid + h * 0.1, chh = h * 0.13;
  c.fillStyle = GF.woodD; c.fillRect(cx0, cy0 - chh * 0.25, cw, chh * 0.25);
  c.fillStyle = GF.gold; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(cx0 + cw * (0.1 + i * 0.16), cy0 - chh * 0.12, w * 0.05, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = GF.wood; c.fillRect(cx0, cy0, cw, chh);
  c.fillStyle = GF.copper; c.fillRect(cx0 + cw * 0.12, cy0, cw * 0.07, chh); c.fillRect(cx0 + cw * 0.81, cy0, cw * 0.07, chh);
  c.fillStyle = GF.gold; c.fillRect(cx0, cy0, cw, Math.max(1, chh * 0.12)); c.fillRect(cx0 + cw * 0.42, cy0 + chh * 0.3, cw * 0.16, chh * 0.4);
  // the plum bands and the wordmark
  c.fillStyle = GF.plum; c.fillRect(0, 0, w, band); c.fillRect(0, h - foot, w, foot);
  c.fillStyle = GF.plumL; c.fillRect(0, band - 1, w, 1); c.fillRect(0, h - foot, w, 1);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (detail) { c.fillStyle = GF.gold; c.font = `700 ${Math.max(5, band * 0.62)}px Inter, sans-serif`; c.fillText('100% GREED', w / 2, band / 2 + 0.5); }
  c.fillStyle = GF.a1; c.font = `700 ${foot * 0.4}px "Pixelify Sans", sans-serif`; c.fillText('Goblin', w / 2 + 0.8, h - foot * 0.66 + 0.8);
  c.fillStyle = GF.a4; c.fillText('Goblin', w / 2, h - foot * 0.66);
  c.font = `900 ${foot * 0.46}px Inter, sans-serif`;
  c.fillStyle = GF.wine; c.fillText('FUEL', w / 2 + 1, h - foot * 0.25 + 1);
  const fg = c.createLinearGradient(0, h - foot * 0.45, 0, h - foot * 0.05); fg.addColorStop(0, GF.pale); fg.addColorStop(0.5, GF.gold); fg.addColorStop(1, GF.copper);
  c.fillStyle = fg; c.fillText('FUEL', w / 2, h - foot * 0.25);
}
const labels = new Map<string, HTMLCanvasElement>();
/** The label, painted once per size (at 2x for crisp edges). */
function label(w: number, h: number, detail = true): HTMLCanvasElement {
  const key = `${w}x${h}:${detail ? 1 : 0}`;
  let cv = labels.get(key);
  if (!cv) { cv = document.createElement('canvas'); cv.width = Math.ceil(w * 2); cv.height = Math.ceil(h * 2); const c = cv.getContext('2d')!; c.scale(2, 2); paintLabel(c, w, h, detail); labels.set(key, cv); }
  return cv;
}
/** Light across a standing can: key from the upper left, a spec stripe, the screen's cyan rim on the right. */
function cylShade(c: Ctx, x: number, y: number, w: number, h: number) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(0.14, 'rgba(0,0,0,0)'); g.addColorStop(0.2, 'rgba(255,255,255,.22)'); g.addColorStop(0.26, 'rgba(255,255,255,0)');
  g.addColorStop(0.75, 'rgba(0,0,0,.12)'); g.addColorStop(0.96, 'rgba(0,0,0,.42)'); g.addColorStop(1, 'rgba(110,220,240,.45)');
  c.fillStyle = g; c.fillRect(x, y, w, h);
}
/** Lying on its side, seen from above (in the drawer, or carried). The lid end points right. */
function lyingCan(c: Ctx, x: number, y: number, s = 1, ang = 0) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, -35, -9, 74, 24, 11); c.fill();
  c.save(); c.beginPath(); c.roundRect(-36, -12, 72, 24, 9); c.clip();
  c.save(); c.translate(30, -12); c.rotate(Math.PI / 2); c.drawImage(label(24, 60, false), 0, 0, 24, 60); c.restore();
  const g = c.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(0.3, 'rgba(255,255,255,.18)'); g.addColorStop(0.42, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
  c.fillStyle = g; c.fillRect(-36, -12, 72, 24);
  c.restore();
  const m = c.createLinearGradient(0, -12, 0, 12); m.addColorStop(0, '#6a6e78'); m.addColorStop(0.45, '#e6e9ee'); m.addColorStop(1, '#5a5e68');
  c.fillStyle = m; rr(c, 29, -11, 7, 22, 3); c.fill(); rr(c, -36, -11, 6, 22, 3); c.fill();
  c.restore();
}
/** Standing on the desk, seen from above at an angle: the lid and the top of the neck band. */
function standingCan(c: Ctx, x: number, y: number, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.ellipse(4, 20, 24, 10, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.beginPath(); c.rect(-21, 0, 42, 16); c.ellipse(0, 16, 21, 9, 0, 0, Math.PI); c.clip();
  c.drawImage(label(42, 100, false), -21, -2, 42, 100); cylShade(c, -21, 0, 42, 26);
  c.restore();
  c.fillStyle = GF.metal; c.beginPath(); c.ellipse(0, 0, 21, 10, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#959ca7'; c.beginPath(); c.ellipse(0, 0.5, 17, 8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#d6dae1'; rr(c, -4, -3, 8, 9, 3); c.fill();
  c.restore();
}
function sideCanBack(c: Ctx, x: number, y: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = 'rgba(59,132,36,.16)'; rr(c, -22, -42, 44, 84, 6); c.fill();
  c.restore();
}
/** The drink view's can: see-through walls (the label faint over the liquid), a solid outline. */
function sideCanFront(c: Ctx, x: number, y: number, a: number, open: boolean) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.save(); c.beginPath(); c.roundRect(-22, -42, 44, 84, 6); c.clip(); c.globalAlpha = 0.3; c.drawImage(label(44, 84, false), -22, -42, 44, 84); c.restore();
  c.strokeStyle = 'rgba(214,226,206,.92)'; c.lineWidth = 2; rr(c, -22, -42, 44, 84, 6); c.stroke();
  c.fillStyle = GF.metal; c.fillRect(-21, -43, 42, 4); c.fillRect(-21, 38, 42, 4);
  if (open) { c.fillStyle = '#0b0b0e'; c.fillRect(5, -43, 14, 4); c.fillStyle = '#d6dae1'; c.save(); c.translate(-2, -43); c.rotate(-0.5); c.fillRect(-2, -3, 12, 3); c.restore(); }
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-17, -38, 4, 76);
  c.restore();
}
/** A small empty can for the throw: a capsule of half-length CHL and radius CR, lid end at +x. */
function smallCan(c: Ctx, x: number, y: number, a: number, glow = false) {
  c.save(); c.translate(x, y); c.rotate(a);
  if (glow) { c.shadowColor = GF.a4; c.shadowBlur = 12; }
  const L = CHL + CR, W2 = CR;
  c.fillStyle = GF.a3; rr(c, -L, -W2, L * 2, W2 * 2, 5); c.fill(); c.shadowBlur = 0;
  c.save(); c.beginPath(); c.roundRect(-L, -W2, L * 2, W2 * 2, 5); c.clip();
  c.save(); c.translate(L - 3, -W2); c.rotate(Math.PI / 2); c.drawImage(label(W2 * 2, L * 2 - 6, false), 0, 0, W2 * 2, L * 2 - 6); c.restore();
  const g = c.createLinearGradient(0, -W2, 0, W2); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(0.3, 'rgba(255,255,255,.2)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
  c.fillStyle = g; c.fillRect(-L, -W2, L * 2, W2 * 2);
  c.restore();
  c.fillStyle = '#b8bec8'; c.fillRect(-L, -W2 + 1, 3, W2 * 2 - 2); c.fillRect(L - 3, -W2 + 1, 3, W2 * 2 - 2);
  c.restore();
}

// ---------- scene state (outcomes go through systems/monster.ts) ----------
let lastGame: MonsterGame | null = null, lastStage = '', lastT = 0, shake = 0, tilting = false;
let scr = { x: 0, y: 0 };                                   // the pointer in canvas px
let pointer = { x: 0, y: 0 };                               // ... and in world px for the current shot
const G = () => { const g = S.g.night?.game; return g && g.kind === 'monster' ? g : null; };
/** Space held / let go (main.ts): tilts the can while drinking. */
export function monsterTilt(on: boolean) { tilting = on; }

// 1-2 the drawer
const EDGE = 150, EDGE_H = 12;
const DRW = { x: 296, w: 268, face: 34, depth: 112, max: 92 };
const HANDLE_X = DRW.x + DRW.w / 2;
const SPOT: V = [424, 104];                                 // his usual spot: right of the mouse pad, the old green rings
let drawer = 0, drawerHold: { py: number; d0: number } | null = null, drawerTo = -1, slideCd = 0;
let carry: { i: number; x: number; y: number } | null = null, placed: { x: number; y: number; t: number; i: number } | null = null;
const faceY = () => EDGE + EDGE_H + drawer;
const drawerCan = (i: number): V => [DRW.x + 62, faceY() - 22 - i * 27];
// 3 the tab, on the whole can
const CAN3 = { x: 300, top: 66, w: 92, h: 198 };
let tab = 0, tabHold: { py: number; l0: number } | null = null, popT = -1, creakCd = 0;
let sprays: { x: number; y: number; vx: number; vy: number; t: number; foam: boolean }[] = [];
const ringY = () => CAN3.top + 9 - tab * 30;
// 4 the drink
let pour: Pour = newPour(), doneT = -1, splashCd = 0;
// 5 the throw
let toss: Toss = newToss([]), aim: V | null = null, tossDone = -1, verdict = '', clankCd = 0;

function reset(g: MonsterGame) {
  lastGame = g; lastStage = ''; shake = 0; tilting = false;
  drawer = 0; drawerHold = null; drawerTo = -1; carry = null; placed = null;
  tab = 0; tabHold = null; popT = -1; sprays = [];
}
function enterStage(stage: string) {
  if (stage === 'drink') { pour = newPour(); doneT = -1; }
  if (stage === 'toss') { toss = newToss([...(S.g.night?.bin ?? []), ...S.g.floorCans]); aim = null; tossDone = -1; verdict = ''; }
}

// ---------- input ----------
function toCanvas(ev: PointerEvent, cv: HTMLCanvasElement): V {
  const r = cv.getBoundingClientRect();
  return [((ev.clientX - r.left) / r.width) * SW, ((ev.clientY - r.top) / r.height) * SH];
}
function track(x: number, y: number, stage: MonsterGame['stage']) {
  scr = { x, y };
  const k = camFor(stage);
  pointer = { x: x / k.s + k.ox, y: y / k.s + k.oy };
}
document.addEventListener('pointerdown', ev => {
  const cv = (ev.target as HTMLElement)?.closest?.('#mcv') as HTMLCanvasElement | null;
  const g = G();
  if (!cv || !g || S.g.paused) return;
  ev.preventDefault();
  const [sx, sy] = toCanvas(ev, cv);
  track(sx, sy, g.stage);
  const { x, y } = pointer;
  if (g.stage === 'drawer') { const f = faceY(); if (Math.abs(x - HANDLE_X) < 52 && y > f + 2 && y < f + 32) { drawerHold = { py: y, d0: drawer }; drawerTo = -1; sfx.click(); } return; }
  if (g.stage === 'grab' && !carry && !placed) {
    for (let i = 0; i < Math.min(3, S.g.monsters); i++) { const [cx, cy] = drawerCan(i); if (Math.abs(x - cx) < 40 && Math.abs(y - cy) < 14) { carry = { i, x: cx, y: cy }; sfx.click(); return; } }
    return;
  }
  if (g.stage === 'open' && popT < 0) { if (Math.abs(x - CAN3.x) < 44 && Math.abs(y - ringY()) < 26) tabHold = { py: y, l0: tab }; return; }
  if (g.stage === 'drink' && doneT < 0) { if (!pour.held) { pour.held = true; sfx.click(); } return; }   // one click picks the can up; it follows the mouse
  if (g.stage === 'toss' && !toss.thrown && tossDone < 0 && Math.hypot(x - HAND[0], y - HAND[1]) < 40) { aim = [0, 0]; sfx.click(); }
});
document.addEventListener('pointermove', ev => {
  const cv = document.getElementById('mcv') as HTMLCanvasElement | null;
  const g = G();
  if (!cv || !g) return;
  const [x, y] = toCanvas(ev, cv);
  track(x, y, g.stage);
});
document.addEventListener('pointerup', () => {
  const g = G();
  if (!g) return;
  if (drawerHold) { drawerHold = null; drawerTo = drawer > DRW.max * 0.5 ? DRW.max : 0; }
  if (carry && g.stage === 'grab') {
    if (pointer.y < EDGE - 8) { placed = { x: clamp(pointer.x, 200, 572), y: clamp(pointer.y, 98, 120), t: 0, i: carry.i }; sfx.canOnDesk(); }
    carry = null;
  }
  tabHold = null;
  if (aim) throwCan();
});
function throwCan() {
  if (!aim) return;
  const [px, py] = aim;
  aim = null;
  if (Math.hypot(px, py) < 10) return;                     // barely pulled: nothing happens
  launch(toss, px, py); sfx.flip();
}

// ---------- 1-2: the drawer and the can, top-down, close ----------
function deskTop(c: Ctx) {
  const ug = c.createLinearGradient(0, EDGE, 0, 300); ug.addColorStop(0, '#040406'); ug.addColorStop(1, '#0a0910');
  c.fillStyle = ug; c.fillRect(0, EDGE, SW, 160);
  // under the desk: a power strip, its LED, the cables
  c.strokeStyle = '#141419'; c.lineWidth = 3; for (const [x0, x1] of [[214, 250], [236, 300], [258, 216]]) { c.beginPath(); c.moveTo(x0, 262); c.bezierCurveTo(x0, 220, x1, 200, x1, 160); c.stroke(); }
  c.fillStyle = '#18181e'; rr(c, 190, 256, 100, 16, 4); c.fill();
  for (let i = 0; i < 4; i++) { c.fillStyle = '#0a0a0d'; rr(c, 200 + i * 20, 260, 12, 8, 2); c.fill(); }
  c.fillStyle = '#ff5050'; c.fillRect(282, 262, 3, 3);
  // the desk top: dark planks, grain
  c.fillStyle = WOOD; c.fillRect(0, 0, SW, EDGE);
  for (let i = 0; i < 70; i++) { c.fillStyle = rnd(i, 1) > 0.5 ? '#2a1f16' : '#1f1610'; c.fillRect(rnd(i, 2) * SW, rnd(i, 3) * EDGE, 30 + rnd(i, 4) * 80, 1); }
  for (const px of [140, 300, 460]) { c.fillStyle = '#18110b'; c.fillRect(px, 0, 1.5, EDGE); }
  // keyboard (its right end), the mouse pad right next to it, then his spot
  c.fillStyle = '#0e0e12'; rr(c, -20, 8, 236, 104, 8); c.fill();
  for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) { c.fillStyle = '#18181e'; rr(c, -6 + k * 24 + (r % 2) * 6, 16 + r * 23, 20, 18, 3); c.fill(); c.fillStyle = 'rgba(79,209,232,.25)'; c.fillRect(-6 + k * 24 + (r % 2) * 6, 33 + r * 23, 20, 1); }
  c.fillStyle = '#0c0c10'; rr(c, 226, 18, 112, 112, 10); c.fill(); c.strokeStyle = '#16161c'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#16161c'; c.beginPath(); c.ellipse(282, 86, 17, 26, 0.08, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(79,209,232,.6)'; c.fillRect(280, 68, 3, 7);
  c.strokeStyle = '#0c0c10'; c.lineWidth = 3; c.beginPath(); c.moveTo(282, 60); c.quadraticCurveTo(272, 30, 300, -10); c.stroke();
  for (let i = 0; i < 3; i++) { c.strokeStyle = `rgba(${FUEL_RGB},${0.12 + i * 0.04})`; c.lineWidth = 2.5; c.beginPath(); c.ellipse(SPOT[0] + i * 7 - 7, SPOT[1] + 4 + (i % 2) * 5, 22, 11, 0, 0, Math.PI * 2); c.stroke(); }   // old rings
  for (let i = 0; i < 14; i++) { c.fillStyle = '#3a2c1c'; c.fillRect(350 + rnd(i, 5) * 200, 80 + rnd(i, 6) * 60, 2, 2); }   // crumbs
  c.fillStyle = WOOD_D; c.fillRect(0, EDGE, SW, EDGE_H); c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, EDGE, SW, 1);
  const lg = c.createLinearGradient(0, 0, 0, EDGE + 40); lg.addColorStop(0, 'rgba(120,140,255,.16)'); lg.addColorStop(1, 'rgba(120,140,255,0)');
  c.fillStyle = lg; c.fillRect(0, 0, SW, EDGE + 40);
}
function drawerBox(c: Ctx, t: number, g: MonsterGame) {
  const f = faceY();
  if (drawer > 0.5) {
    c.save(); c.beginPath(); c.rect(DRW.x, EDGE + EDGE_H, DRW.w, drawer); c.clip();
    const top = f - DRW.depth;
    c.fillStyle = '#1b130d'; c.fillRect(DRW.x, top, DRW.w, DRW.depth);
    for (let i = 0; i < 6; i++) { c.fillStyle = '#20170f'; c.fillRect(DRW.x, top + i * 19, DRW.w, 1); }
    c.fillStyle = '#2a1d13'; c.fillRect(DRW.x, top, 7, DRW.depth); c.fillRect(DRW.x + DRW.w - 7, top, 7, DRW.depth);
    // a gamer's drawer: a coiled cable, a receipt, wrappers, a dead controller
    c.strokeStyle = '#26262e'; c.lineWidth = 3; for (const r of [15, 10]) { c.beginPath(); c.arc(DRW.x + 180, f - 36, r, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = '#26262e'; c.fillRect(DRW.x + 192, f - 30, 12, 5);
    c.fillStyle = '#4a4740'; c.save(); c.translate(DRW.x + 150, f - 76); c.rotate(-0.3); c.fillRect(-12, -18, 24, 36); c.fillStyle = '#3a3832'; for (let i = 0; i < 6; i++) c.fillRect(-8, -12 + i * 5, 14, 1.5); c.restore();
    c.fillStyle = '#7a2a3a'; c.beginPath(); c.moveTo(DRW.x + 214, f - 66); c.lineTo(DRW.x + 236, f - 72); c.lineTo(DRW.x + 244, f - 58); c.lineTo(DRW.x + 226, f - 52); c.closePath(); c.fill();
    c.fillStyle = '#2a4a7a'; c.beginPath(); c.moveTo(DRW.x + 228, f - 30); c.lineTo(DRW.x + 248, f - 34); c.lineTo(DRW.x + 252, f - 18); c.lineTo(DRW.x + 232, f - 16); c.closePath(); c.fill();
    c.fillStyle = '#1c1c22'; rr(c, DRW.x + 120, f - 30, 34, 18, 8); c.fill(); c.fillStyle = '#303038'; c.fillRect(DRW.x + 126, f - 24, 6, 2); c.fillRect(DRW.x + 128, f - 26, 2, 6);
    const n = Math.min(3, S.g.monsters);
    for (let i = 0; i < n; i++) {
      if (carry?.i === i || placed?.i === i) continue;
      const [cx, cy] = drawerCan(i);
      lyingCan(c, cx, cy);
      if (g.stage === 'grab' && !carry && !placed && Math.sin(t * 4 + i) > 0.5) { c.strokeStyle = `rgba(${FUEL_RGB},.5)`; c.lineWidth = 2; rr(c, cx - 38, cy - 14, 76, 28, 12); c.stroke(); }
    }
    const sg = c.createLinearGradient(0, EDGE + EDGE_H, 0, EDGE + EDGE_H + 16); sg.addColorStop(0, 'rgba(0,0,0,.7)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.fillRect(DRW.x, EDGE + EDGE_H, DRW.w, 16);
    c.restore();
  }
  c.fillStyle = '#2b2016'; c.fillRect(DRW.x - 2, f, DRW.w + 4, DRW.face);
  c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(DRW.x - 2, f, DRW.w + 4, 1.5); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(DRW.x - 2, f + DRW.face - 3, DRW.w + 4, 3);
  const hg = c.createLinearGradient(0, f + 12, 0, f + 22); hg.addColorStop(0, '#6a6e78'); hg.addColorStop(0.45, '#c8ccd6'); hg.addColorStop(1, '#5a5e68');
  c.fillStyle = '#121216'; c.fillRect(HANDLE_X - 33, f + 10, 6, 6); c.fillRect(HANDLE_X + 27, f + 10, 6, 6);
  c.fillStyle = hg; rr(c, HANDLE_X - 38, f + 14, 76, 8, 4); c.fill();
}
function drawTop(c: Ctx, g: MonsterGame, dt: number, t: number) {
  if (drawerHold) {
    const pulled = pointer.y - drawerHold.py;
    const want = clamp(drawerHold.d0 + (drawerHold.d0 > 0 ? pulled : Math.max(0, pulled - 5)) * 0.92, 0, DRW.max);   // it sticks a little at first
    const dv = want - drawer; drawer = want;
    slideCd -= dt;
    if (Math.abs(dv) > 1.5 && slideCd <= 0) { sfx.drawerSlide(clamp(Math.abs(dv) / 10, 0, 1)); slideCd = 0.07; }
    if (drawer >= DRW.max - 0.5 && g.stage === 'drawer') { drawerHold = null; drawerTo = DRW.max; }
  } else if (drawerTo >= 0) {
    const before = drawer;
    drawer += (drawerTo - drawer) * Math.min(1, dt * 12);
    slideCd -= dt; if (Math.abs(drawer - before) > 1 && slideCd <= 0) { sfx.drawerSlide(0.5); slideCd = 0.08; }
    if (Math.abs(drawer - drawerTo) < 0.6) {
      drawer = drawerTo; drawerTo = -1; sfx.drawerThunk();
      if (drawer >= DRW.max && g.stage === 'drawer') monsterDrawerOpen();
      if (drawer <= 0 && g.stage === 'grab' && placed) monsterPlaced();
    }
  }
  if (placed) { placed.t += dt; if (placed.t > 0.35 && drawerTo < 0 && drawer > 0) drawerTo = 0; }
  if (carry) { carry.x += (pointer.x - carry.x) * Math.min(1, dt * 20); carry.y += (pointer.y - carry.y) * Math.min(1, dt * 20); }
  world(c);
  deskTop(c);
  drawerBox(c, t, g);
  if (placed) standingCan(c, placed.x, placed.y);
  if (g.stage === 'grab' && !placed) ringHint(c, SPOT[0], SPOT[1] + 6, 30, 18, t);
  if (carry) { if (carry.y < EDGE) standingCan(c, carry.x, carry.y - 6, 1.08); else lyingCan(c, carry.x, carry.y - 4, 1.1, -0.15); }
  const f = faceY();
  if (g.stage === 'drawer' && !drawerHold && drawerTo < 0) ringHint(c, HANDLE_X, f + 18, 52, 14, t);
  screen(c);
  if (g.stage === 'grab' && !placed && !carry) { const [x, y] = toScr(SPOT[0], SPOT[1] + 34); say(c, 'put a can here', x, y, '700 13px Inter, sans-serif', FUEL); }
  if (g.stage === 'drawer' && !drawerHold && drawerTo < 0) { const [x, y] = toScr(HANDLE_X, f + 44); say(c, 'grab the handle, pull ↓', x, y, '700 13px Inter, sans-serif', FUEL); }
}

// ---------- 3: the whole can on the desk; pull the tab ----------
function drawLid(c: Ctx, g: MonsterGame, dt: number, t: number) {
  if (tabHold && popT < 0) {
    const want = clamp(tabHold.l0 + (tabHold.py - pointer.y) / 70, 0, 1);
    creakCd -= dt;
    if (want > tab + 0.03 && creakCd <= 0) { sfx.tabCreak(); creakCd = 0.05; }
    tab = want;
    if (tab >= 0.62) {                                         // the seal gives: POP
      popT = 0; tabHold = null; shake = 0.35;
      sfx.pop(); sfx.canOpen();
      for (let i = 0; i < 40; i++) { const a = -Math.PI / 2 + (rnd(i, 7) - 0.5) * 2.2, v = 50 + rnd(i, 8) * 200; sprays.push({ x: CAN3.x, y: CAN3.top - 5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, t: 0, foam: i % 3 === 0 }); }
    }
  } else if (popT < 0) tab = Math.max(0, tab - dt * 3);
  if (popT >= 0) {
    popT += dt;
    tab += ((popT < 0.25 ? 0.7 : 0.35) - tab) * Math.min(1, dt * 8);
    if (popT > 1.15 && g.stage === 'open') monsterOpenCan();
  }
  const { x, top, w, h } = CAN3, x0 = x - w / 2, bot = top + h;
  screen(c);
  // the room behind, the desk top in front
  const wg = c.createLinearGradient(0, 0, 0, 200); wg.addColorStop(0, '#0b0b12'); wg.addColorStop(1, '#100e16');
  c.fillStyle = wg; c.fillRect(0, 0, SW, SH);
  c.fillStyle = WOOD; c.fillRect(0, 214, SW, SH - 214); c.fillStyle = '#2a1f16'; c.fillRect(0, 214, SW, 2);
  for (let i = 0; i < 24; i++) { c.fillStyle = rnd(i, 9) > 0.5 ? '#2a1f16' : '#1a130d'; c.fillRect(0, 218 + rnd(i, 10) * 80, SW, 1 + rnd(i, 11) * 1.5); }
  c.save(); c.globalCompositeOperation = 'lighter';
  const mg = c.createRadialGradient(80, 40, 10, 80, 40, 520); mg.addColorStop(0, 'rgba(130,150,255,.2)'); mg.addColorStop(1, 'rgba(130,150,255,0)');
  c.fillStyle = mg; c.fillRect(0, 0, SW, SH); c.restore();
  c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.ellipse(x + 10, bot + 4, w * 0.62, 12, 0, 0, Math.PI * 2); c.fill();
  // the can: body (the label), the necked shoulder, the lid
  c.save(); c.beginPath(); c.moveTo(x0, top + 6); c.lineTo(x0, bot); c.ellipse(x, bot, w / 2, 12, 0, Math.PI, 0, true); c.lineTo(x0 + w, top + 6); c.closePath(); c.clip();
  c.drawImage(label(w, h - 14), x0, top + 14, w, h - 14);
  const sh = c.createLinearGradient(x0, 0, x0 + w, 0); sh.addColorStop(0, '#6a6e78'); sh.addColorStop(0.22, GF.metalL); sh.addColorStop(0.6, '#a7adb7'); sh.addColorStop(1, '#4e535c');
  c.fillStyle = sh; c.fillRect(x0, top, w, 16);
  cylShade(c, x0, top, w, h + 14);
  c.restore();
  c.fillStyle = '#5a5e68'; c.beginPath(); c.ellipse(x, bot, w / 2, 12, 0, 0, Math.PI); c.lineTo(x0, bot); c.fill();
  c.save(); c.beginPath(); c.ellipse(x, bot, w / 2 - 1, 11, 0, 0, Math.PI); c.clip(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x0, bot, w, 4); c.restore();
  c.fillStyle = GF.metal; c.beginPath(); c.ellipse(x, top, w / 2 - 3, 15, 0, 0, Math.PI * 2); c.fill();
  const pg = c.createLinearGradient(x0, top - 12, x0 + w, top + 12); pg.addColorStop(0, '#c3c9d2'); pg.addColorStop(1, '#7c838e');
  c.fillStyle = pg; c.beginPath(); c.ellipse(x, top + 1, w / 2 - 9, 11, 0, 0, Math.PI * 2); c.fill();
  // the opening: scored, then a dark hole with fizz
  if (popT < 0) { c.strokeStyle = '#6e7580'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, top - 5, 10, 4, 0, 0, Math.PI * 2); c.stroke(); }
  else {
    c.fillStyle = '#060607'; c.beginPath(); c.ellipse(x, top - 5, 10, 4, 0, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 7; i++) { const k = (t * 1.3 + i / 7) % 1; c.fillStyle = `rgba(230,255,210,${0.8 * (1 - k)})`; c.beginPath(); c.arc(x - 8 + rnd(i, 12) * 16, top - 6 - k * 18, 1.2 + rnd(i, 13) * 1.4, 0, Math.PI * 2); c.fill(); }
  }
  // the tab: hinged at the rivet; the ring end lifts up toward you
  const ry = ringY();
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + 2, top + 9, 9, 3.5, 0, 0, Math.PI * 2); c.fill();
  const tg = c.createLinearGradient(0, Math.min(ry, top) - 6, 0, Math.max(ry, top) + 6); tg.addColorStop(0, GF.metalL); tg.addColorStop(1, '#aeb4be');
  c.fillStyle = tg; rr(c, x - 7, Math.min(top - 3, ry - 5), 14, Math.abs(ry - top) + 9, 6); c.fill(); c.strokeStyle = '#7c838e'; c.lineWidth = 1; c.stroke();
  c.fillStyle = '#4a505a'; c.beginPath(); c.ellipse(x, ry, 4.5, 2 + tab * 2, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#9aa1ad'; c.beginPath(); c.arc(x, top + 1, 2.6, 0, Math.PI * 2); c.fill();
  for (const p of sprays) { p.t += dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  sprays = sprays.filter(p => p.t < 1.1);
  for (const p of sprays) { c.fillStyle = p.foam ? `rgba(240,255,225,${1 - p.t})` : `rgba(${FUEL_RGB},${1 - p.t})`; c.beginPath(); c.arc(p.x, p.y, p.foam ? 2.5 + p.t * 2.5 : 2, 0, Math.PI * 2); c.fill(); }
  if (popT >= 0 && popT < 1.1) say(c, 'PSSHHT!', x + 150, 56 - popT * 10, `900 ${30 + Math.min(1, popT * 6) * 10}px Inter, sans-serif`, '#f4ffe0', 'center', 1 - Math.max(0, popT - 0.6) * 2);
  if (popT < 0 && !tabHold) { ringHint(c, x, ry, 20, 11, t); say(c, 'pull the tab up ↑', x + 130, top + 30, '700 13px Inter, sans-serif', FUEL); }
}

// ---------- 4: the drink, close on him ----------
function drawDrink(c: Ctx, g: MonsterGame, dt: number, t: number) {
  stepPour(pour, dt, { held: pour.held, tx: pointer.x, ty: pointer.y, tilt: tilting }, {
    gulp: () => sfx.gulp(),
    splash: () => { if (splashCd <= 0) { sfx.splash(); splashCd = 0.12; } },
    cough: () => { monsterCough(); shake = 0.25; },
  });
  splashCd -= dt;
  if (pour.done && doneT < 0) doneT = 0;
  if (doneT >= 0) { doneT += dt; if (doneT > 1.3 && g.stage === 'drink') monsterDrank(share(pour)); }
  world(c);
  // the room: a dark wall, the window behind him, the monitor he faces (no desk in this shot)
  const wg = c.createLinearGradient(0, 40, 0, 240); wg.addColorStop(0, '#09090e'); wg.addColorStop(1, '#0d0c12');
  c.fillStyle = wg; c.fillRect(180, 30, 420, 230);
  const wx = 498, wy = 22, ww = 92, wh = 128;
  const sky = c.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#141a2c'); sky.addColorStop(1, '#1b2134');
  c.fillStyle = '#070709'; c.fillRect(wx - 5, wy - 5, ww + 10, wh + 10); c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 12; i++) { c.fillStyle = rnd(i, 21) > 0.6 ? 'rgba(255,214,140,.55)' : 'rgba(180,200,255,.35)'; c.fillRect(wx + rnd(i, 22) * ww, wy + wh * 0.55 + rnd(i, 23) * wh * 0.4, 2, 2); }
  c.fillStyle = '#070709'; c.fillRect(wx + ww / 2 - 2, wy, 4, wh); c.fillRect(wx, wy + wh * 0.45, ww, 4);
  monitorSide(c, 262, 62, 196, 240, 360);
  // him (screen px, 1:1), then what his face does
  screen(c);
  const [bx, by] = toScr(HEAD_O[0] - SP.ox, HEAD_O[1] - SP.oy);
  c.imageSmoothingEnabled = false; c.drawImage(himDrink(), Math.round(bx), Math.round(by)); c.imageSmoothingEnabled = true;
  world(c);
  const full = pour.mouth / T.MONSTER_MOUTH_CAP;
  if (full > 0.15) {                                            // cheeks puff as his mouth fills
    const [cx, cy] = headPt(-28, 20), r = 3 + full * 6;
    c.fillStyle = HC.head; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = HC.line; c.lineWidth = 0.8; c.beginPath(); c.arc(cx, cy, r, Math.PI * 0.55 + HEAD_TILT, Math.PI * 1.45 + HEAD_TILT); c.stroke();
  }
  if (pour.open > 0.05) {
    const [mx, my] = headPt(-36, 26);
    c.save(); c.translate(mx, my); c.rotate(HEAD_TILT);
    c.fillStyle = '#020203'; c.beginPath(); c.ellipse(0, 0, 3, 0.6 + pour.open * 3.4, 0, 0, Math.PI * 2); c.fill();
    if (pour.mouth > 0.5) { c.fillStyle = FUEL; c.beginPath(); c.ellipse(0, 1, 2, pour.open * 2, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  if (pour.gulp > 0) { const gx = HEAD_O[0] - 21, gy = HEAD_O[1] + 50 + (1 - pour.gulp) * 16; c.fillStyle = HC.body; c.beginPath(); c.arc(gx, gy, 3.5, 0, Math.PI * 2); c.fill(); c.strokeStyle = HC.line; c.lineWidth = 0.8; c.beginPath(); c.arc(gx, gy, 3.5, Math.PI * 0.6, Math.PI * 1.4); c.stroke(); }
  const [lx, ly] = headPt(-40, -7); lensGlow(c, lx, ly, t, 16);
  // the floating can: back wall, the drink, the outline
  sideCanBack(c, pour.x, pour.y, pour.a);
  for (const d of pour.drops) if (d.s === 0 || d.s === 1) { c.fillStyle = FUEL; c.beginPath(); c.arc(d.x, d.y, d.s === 0 ? 4.2 : 3, 0, Math.PI * 2); c.fill(); }
  for (const d of pour.drops) if (d.s === 0) { c.fillStyle = 'rgba(240,255,210,.4)'; c.fillRect(d.x - 1.5, d.y - 2.5, 2, 1.5); }
  for (const d of pour.drops) if (d.s === 3 && d.t < 1.6) { c.fillStyle = `rgba(${FUEL_RGB},${1 - d.t / 1.6})`; c.beginPath(); c.arc(d.x, d.y, 2.4, 0, Math.PI * 2); c.fill(); }
  sideCanFront(c, pour.x, pour.y, pour.a, g.opened);
  let cx = 0, cy = 0, k = 0; for (const d of pour.drops) if (d.s === 0) { cx += d.x; cy += d.y; k++; }
  if (k) { cx /= k; cy /= k; c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(cx, cy, 4, cx, cy, 90); lg.addColorStop(0, `rgba(${FUEL_RGB},.12)`); lg.addColorStop(1, `rgba(${FUEL_RGB},0)`); c.fillStyle = lg; c.fillRect(cx - 90, cy - 90, 180, 180); c.restore(); }
  const live = doneT < 0 && pour.drops.some(d => d.s === 0);
  const [hx, hy] = holeAt(pour.x, pour.y, pour.a);
  if (live && !pour.held) ringHint(c, pour.x, pour.y, 34, 50, t);
  else if (live && Math.hypot(hx - MOUTH.x, hy - MOUTH.y) > T.MONSTER_LIPS * 1.6) ringHint(c, MOUTH.x, MOUTH.y, 10, 8, t);
  // the meter and the hints (canvas px)
  screen(c);
  const sh2 = share(pour), bx2 = 16, by2 = 14, bw = 170;
  c.fillStyle = 'rgba(0,0,0,.6)'; rr(c, bx2 - 6, by2 - 6, bw + 12, 44, 8); c.fill();
  c.fillStyle = '#1e1b26'; rr(c, bx2, by2 + 12, bw, 10, 4); c.fill();
  c.fillStyle = sh2 >= T.MONSTER_DRINK_FULL ? FUEL : sh2 >= T.MONSTER_DRINK_HALF ? '#f1b434' : '#8a84a0'; rr(c, bx2, by2 + 12, Math.max(2, bw * sh2), 10, 4); c.fill();
  for (const [m, lab] of [[T.MONSTER_DRINK_HALF, 'half'], [T.MONSTER_DRINK_FULL, 'full']] as [number, string][]) { c.fillStyle = '#e8e4f0'; c.fillRect(bx2 + bw * m - 1, by2 + 9, 2, 16); say(c, lab, bx2 + bw * m, by2 + 31, '600 9px Inter, sans-serif', '#b8b0c8'); }
  say(c, `in you: ${Math.round(sh2 * 100)}%`, bx2, by2 + 3, '700 11px Inter, sans-serif', '#e8e4f0', 'left');
  if (live) {
    if (!pour.held) { const [x, y] = toScr(pour.x, pour.y - 64); say(c, 'click to pick up the can', x, y, '700 13px Inter, sans-serif', FUEL); }
    else if (Math.hypot(hx - MOUTH.x, hy - MOUTH.y) > T.MONSTER_LIPS * 1.6) { const [x, y] = toScr(MOUTH.x - 26, MOUTH.y - 34); say(c, 'to his mouth', x, y, '700 12px Inter, sans-serif', FUEL); }
    else if (full > 0.8) { const [x, y] = toScr(MOUTH.x - 36, MOUTH.y - 26); say(c, 'mmf!', x, y, '800 13px Inter, sans-serif', '#ffb070'); }
    if (pour.a < 0.3 && !tilting) {
      c.fillStyle = 'rgba(0,0,0,.6)'; rr(c, 200, 262, 196, 26, 6); c.fill(); c.strokeStyle = '#e8e4f0'; c.lineWidth = 1.5; rr(c, 210, 267, 54, 16, 3); c.stroke();
      say(c, 'SPACE', 237, 275, '700 9px Inter, sans-serif', '#e8e4f0'); say(c, 'hold to tilt, tap to ease', 329, 275, '700 11px Inter, sans-serif', FUEL);
    }
  } else if (doneT >= 0) {
    const r = share(pour), fu = r >= T.MONSTER_DRINK_FULL, hf = r >= T.MONSTER_DRINK_HALF;
    say(c, `${Math.round(r * 100)}%: ${fu ? 'FULL BOOST' : hf ? 'HALF A BOOST' : 'NO BOOST'}`, 220, 150, '900 28px Inter, sans-serif', fu ? FUEL : hf ? '#f1b434' : '#ff8a80');
  }
}

// ---------- 5: the throw: the can, the bin, the room ----------
function drawToss(c: Ctx, g: MonsterGame, dt: number, t: number) {
  if (aim) { let dx = pointer.x - HAND[0], dy = pointer.y - HAND[1]; const d = Math.hypot(dx, dy); if (d > PULL_MAX) { dx *= PULL_MAX / d; dy *= PULL_MAX / d; } aim = [dx, dy]; }
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
  screen(c);
  const wg = c.createLinearGradient(0, 0, 0, FLOOR); wg.addColorStop(0, '#08080d'); wg.addColorStop(1, '#0e0d14');
  c.fillStyle = wg; c.fillRect(0, 0, SW, FLOOR);
  c.fillStyle = '#121019'; c.fillRect(352, 34, 66, 90); c.fillStyle = '#1a1622'; c.fillRect(358, 40, 54, 78); c.fillStyle = 'rgba(181,140,255,.12)'; c.beginPath(); c.moveTo(385, 52); c.lineTo(402, 100); c.lineTo(368, 100); c.fill();   // a poster
  c.fillStyle = '#100c09'; c.fillRect(0, FLOOR, SW, SH - FLOOR); c.fillStyle = '#1a140f'; c.fillRect(0, FLOOR, SW, 2);
  for (let x = 30; x < SW; x += 70) { c.fillStyle = '#0c0907'; c.fillRect(x, FLOOR, 1.5, SH - FLOOR); }
  c.fillStyle = '#15121c'; c.fillRect(0, FLOOR - 8, SW, 8);
  c.fillStyle = WOOD; c.fillRect(DESK_T.x1, DESK_T.y, DESK_T.x2 - DESK_T.x1, 8); c.fillStyle = '#100b07'; c.fillRect(6, DESK_T.y + 8, 7, FLOOR - DESK_T.y - 8); c.fillRect(DESK_T.x2 - 12, DESK_T.y + 8, 7, FLOOR - DESK_T.y - 8);
  monitorSide(c, 70, 92, 160, DESK_T.y, 520);
  c.fillStyle = '#16141c'; c.beginPath(); c.moveTo(BIN.l, BIN.top); c.lineTo(BIN.r, BIN.top); c.lineTo(BIN.br, FLOOR); c.lineTo(BIN.bl, FLOOR); c.fill();
  for (const b of toss.bodies) if (b !== toss.thrown) smallCan(c, b.x, b.y, b.a);
  if (toss.thrown) smallCan(c, toss.thrown.x, toss.thrown.y, toss.thrown.a);
  c.fillStyle = 'rgba(60,62,76,.45)'; c.beginPath(); c.moveTo(BIN.l, BIN.top + 6); c.lineTo(BIN.r, BIN.top + 6); c.lineTo(BIN.br, FLOOR); c.lineTo(BIN.bl, FLOOR); c.fill();
  c.strokeStyle = 'rgba(20,20,26,.7)'; c.lineWidth = 1;
  for (let i = 1; i < 9; i++) { const fx = BIN.l + (i * (BIN.r - BIN.l)) / 9; c.beginPath(); c.moveTo(fx, BIN.top + 6); c.lineTo(BIN.bl + (i * (BIN.br - BIN.bl)) / 9, FLOOR); c.stroke(); }
  c.fillStyle = '#2a2a34'; rr(c, BIN.l - 4, BIN.top - 2, BIN.r - BIN.l + 8, 8, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(BIN.l - 3, BIN.top - 2, BIN.r - BIN.l + 6, 1);
  // the empty floats, ready; pulled back while aiming
  if (!toss.thrown) {
    const [ax, ay] = aim ?? [0, Math.sin(t * 2.4) * 3];
    smallCan(c, HAND[0] + ax, HAND[1] + ay, -Math.PI / 2 + ax * 0.006, !aim && tossDone < 0);
  }
  if (aim && Math.hypot(aim[0], aim[1]) > 10) {
    let x = HAND[0] + aim[0], y = HAND[1] + aim[1], vx = -aim[0] * LAUNCH, vy = -aim[1] * LAUNCH;
    for (let i = 0; i < 10; i++) { const st = 1 / 40; vy += GRAV * st; x += vx * st; y += vy * st; c.fillStyle = `rgba(230,240,255,${0.8 - i * 0.07})`; c.beginPath(); c.arc(x, y, 2.6 - i * 0.12, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = `rgba(${FUEL_RGB},.3)`; c.lineWidth = 1.5; c.setLineDash([5, 5]); c.beginPath(); c.arc(HAND[0], HAND[1], PULL_MAX, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
  }
  const onFloor = toss.bodies.length - (toss.thrown ? 1 : 0) - (S.g.night?.bin.length ?? 0);
  if (onFloor > 0) say(c, `on the floor: ${onFloor}`, 590, 286, '600 10px Inter, sans-serif', '#8a84a0', 'right');
  if (!toss.thrown && !aim && tossDone < 0) { ringHint(c, HAND[0], HAND[1], 24, 26, t); say(c, 'one throw: grab it, pull back, let go', 330, 30, '700 13px Inter, sans-serif', FUEL); }
  if (tossDone >= 0) say(c, verdict, 330, 70, '900 26px Inter, sans-serif', toss.inBin ? FUEL : '#ff8a80');
}

// ---------- main draw ----------
export function drawMonsterScene() {
  const cv = document.getElementById('mcv') as HTMLCanvasElement | null;
  const g = G();
  if (!cv || !g) { lastGame = null; return; }
  if (lastGame !== g) { reset(g); (document.activeElement as HTMLElement | null)?.blur?.(); }   // a focused button would eat Space
  if (lastStage !== g.stage) { lastStage = g.stage; enterStage(g.stage); track(scr.x, scr.y, g.stage); }
  const now = performance.now() / 1000;
  const dt = Math.min(1 / 30, lastT ? now - lastT : 1 / 60); lastT = now;
  const c = cv.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, SW, SH);
  if (S.g.paused) return;
  shake = Math.max(0, shake - dt);
  shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 16 : 0; shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 16 : 0;
  cam = camFor(g.stage);
  if (g.stage === 'drawer' || g.stage === 'grab') drawTop(c, g, dt, now);
  else if (g.stage === 'open') drawLid(c, g, dt, now);
  else if (g.stage === 'drink') drawDrink(c, g, dt, now);
  else drawToss(c, g, dt, now);
  c.setTransform(1, 0, 0, 1, 0, 0);
}

// Test hooks (playtest scripts). __lnScreen converts world px to canvas px for the current shot.
const W = window as unknown as Record<string, unknown>;
W.__lnThrow = (vx: number, vy: number) => { if (toss.thrown || tossDone >= 0) return false; aim = [-vx / LAUNCH, -vy / LAUNCH]; throwCan(); return true; };
W.__lnFluid = () => ({ n: pour.drops.length, drunk: pour.drunk, inCan: pour.drops.filter(d => d.s === 0).length, free: pour.drops.filter(d => d.s === 1).length, mouth: pour.mouth, a: pour.a, held: pour.held, x: pour.x, y: pour.y, mx: MOUTH.x, my: MOUTH.y });
W.__lnToss = () => ({ bodies: toss.bodies.length, thrown: toss.thrown ? { x: toss.thrown.x, y: toss.thrown.y, asleep: toss.thrown.asleep } : null, done: tossDone, verdict });
W.__lnScreen = (x: number, y: number) => { const g = G(); const k = g ? camFor(g.stage) : CAM_FLAT; return [(x - k.ox) * k.s, (y - k.oy) * k.s]; };
