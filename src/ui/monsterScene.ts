// Goblin Fuel, the energy break (#61, docs/design/desk.md). Five steps on one canvas, in a dark room:
// 1 Drawer: top-down at the corner of the desk; grab the handle and pull the drawer out.
// 2 Grab: drag a can from the drawer onto the desk (same shot).
// 3 Open: a close-up of the lid; pull the tab up until the seal pops.
// 4 Drink: side view of him. Hold the can with the mouse, hold Space to tilt it, let go to tilt back.
// 5 Toss: one throw at the bin; a miss stays on the floor for good (S.g.floorCans).
// He is the left panel's silhouette (ui/him.ts) turned to profile, through the same pixel pipeline.
// Physics: systems/fuelPhysics.ts. Rules and outcomes: systems/monster.ts (code names still say "monster").
import { T } from '../config/tuning';
import { S, type MonsterGame } from '../core/state';
import { monsterDrawerOpen, monsterPlaced, monsterOpenCan, monsterCough, monsterDrank, monsterClank, monsterTossed } from '../systems/monster';
import {
  type V, type Pour, type Toss, newPour, stepPour, share, holeAt, DESK_TOP, REST, HEAD_O, MOUTH,
  newToss, launch, stepToss, tossStyle, tossPoses, FLOOR, BIN, CR, CHL, HAND, PULL_MAX, LAUNCH, DESK_T, GRAV,
} from '../systems/fuelPhysics';
import { pixelSprite, blit, smooth, cel, type Pt } from './pixel';
import { sfx } from './audio';

export const SW = 600, SH = 300;
type Ctx = CanvasRenderingContext2D;
const HC = { body: '#0d0d11', bodyS: '#09090c', head: '#0f0f13', headS: '#0b0b0e', hair: '#0a0a0d', hairS: '#070709', shine: '#2a2a33', chair: '#15151a', chairS: '#101014', rim: '#2e2e38', frame: '#030304', lens: '#fbfbff', line: '#3e3e4a' };
const FUEL = '#8fe33a', FUEL_RGB = '143,227,58';
const WOOD = '#241a12', WOOD_D = '#160f0a';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (i: number, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function say(c: Ctx, t: string, x: number, y: number, font: string, fill: string, align: CanvasTextAlign = 'center', alpha = 1) {
  c.save(); c.globalAlpha = alpha; c.font = font; c.fillStyle = fill; c.textAlign = align; c.textBaseline = 'middle';
  c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(t, x, y); c.fillText(t, x, y); c.restore();
}
function ringHint(c: Ctx, x: number, y: number, rx: number, ry: number, t: number) {
  c.save(); c.strokeStyle = `rgba(${FUEL_RGB},${0.55 + Math.sin(t * 5) * 0.3})`; c.lineWidth = 2; c.setLineDash([6, 5]); c.lineDashOffset = -t * 18;
  c.beginPath(); c.ellipse(x, y, rx + Math.sin(t * 5) * 2, ry + Math.sin(t * 5) * 1.5, 0, 0, Math.PI * 2); c.stroke(); c.restore();
}

// ---------- him in profile (facing left; the throw view mirrors him) ----------
const PF: Pt[] = [[34, -6], [30, -34], [10, -48], [-16, -46], [-30, -34], [-35, -18], [-34, -10], [-38, -2], [-46, 10, 1], [-38, 15, 1], [-38, 21], [-35, 25, 1], [-38, 29], [-35, 36], [-33, 44], [-20, 50], [0, 46], [18, 30], [30, 14]];
const PH: Pt[] = [[-38, -14], [-42, -30], [-32, -50], [-8, -60], [20, -57], [38, -42], [45, -18], [42, 8], [34, 28], [24, 36, 1], [20, 16], [16, -4], [6, -12, 1], [-6, -16], [-13, -9, 1], [-19, -19], [-27, -11, 1], [-31, -21], [-38, -8, 1]];
const PE: Pt[] = [[0, -6], [10, -10], [14, 2], [8, 12], [2, 8]];
const PN: Pt[] = [[-22, 40], [4, 38], [14, 72], [-18, 74]];
const PT: Pt[] = [[-24, 62], [-4, 56], [30, 60], [56, 76], [68, 110], [72, 190, 1], [-42, 190, 1], [-46, 132], [-40, 96]];
const PT_SIT: Pt[] = [[-24, 62], [-4, 56], [30, 60], [56, 76], [66, 110], [62, 150], [42, 168, 1], [-30, 168, 1], [-42, 132], [-40, 96]];
const P_THIGH: Pt[] = [[34, 140, 1], [-84, 140], [-96, 154], [-86, 172], [34, 174, 1]];
const P_SHIN: Pt[] = [[-98, 150], [-74, 156], [-76, 244, 1], [-100, 246, 1]];
const P_FOOT: Pt[] = [[-104, 238, 1], [-74, 238], [-70, 258, 1], [-116, 258, 1], [-116, 250]];
const P_BACK: Pt[] = [[56, -14], [86, -20, 1], [92, 150, 1], [60, 160, 1]];
const P_CHAIR_D: Pt[] = [[56, -14], [86, -20, 1], [94, 190, 1], [62, 190, 1]];

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
  cel(c, smooth(P_CHAIR_D), HC.chair, HC.chairS, 1);
  cel(c, smooth(PT), HC.body, HC.bodyS, 1.2);
  cel(c, smooth(PN), HC.body, HC.bodyS, 1);
  head(c);
}
function bodySeated(c: Ctx) {
  cel(c, smooth(P_BACK), HC.chair, HC.chairS, 1);
  c.fillStyle = HC.chair;
  c.fillRect(-44, 150, 96, 20); c.fillRect(2, 170, 14, 58); c.fillRect(-46, 226, 108, 10);       // seat, pole, base
  for (const x of [-38, 54]) { c.beginPath(); c.arc(x, 246, 10, 0, Math.PI * 2); c.fill(); }      // wheels
  cel(c, smooth(P_THIGH), HC.body, HC.bodyS, 1);
  cel(c, smooth(P_SHIN), HC.body, HC.bodyS, 1);
  cel(c, smooth(P_FOOT), '#121216', '#0c0c0f', 1);
  cel(c, smooth(PT_SIT), HC.body, HC.bodyS, 1.2);
  cel(c, smooth(PN), HC.body, HC.bodyS, 1);
  head(c);
}
/** From above (the drawer shot): the top of his head and his shoulders. He faces up the screen,
 *  so the white lenses peek over his brow. */
function bodyTop(c: Ctx) {
  cel(c, smooth([[-118, 28], [-96, -2], [-44, -16], [0, -18], [44, -16], [96, -2], [118, 28], [100, 70, 1], [-100, 70, 1]]), HC.body, HC.bodyS, 1.2);
  for (const s of [-1, 1]) { c.fillStyle = HC.lens; c.beginPath(); c.roundRect(s * 15 - 8, -50, 16, 6, 3); c.fill(); }      // lens tops over his brow
  cel(c, smooth([[-46, 2], [-44, -26], [-30, -42], [-12, -46, 1], [-4, -40], [6, -47, 1], [16, -41], [28, -45, 1], [42, -28], [46, 2], [36, 30], [0, 40], [-36, 30]]), HC.hair, HC.hairS, 1.2);
  c.fillStyle = HC.shine; c.fillRect(-18, -12, 14, 2); c.fillRect(6, -4, 12, 2); c.fillRect(-6, 10, 9, 2);
  c.strokeStyle = HC.rim; c.lineWidth = 2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 38, -28); c.lineTo(s * 45, 4); c.stroke(); }   // the glasses' arms over his ears
}
const TOP = { x: 150, y: 286, w: 260, h: 140, ox: 130, oy: 60 };
const himTop = () => pixelSprite('himP:top', TOP.w, TOP.h, cc => { cc.translate(TOP.ox, TOP.oy); bodyTop(cc); }, { outline: HC.line });
const DRINK_SP = { w: 236, h: 262, ox: 126, oy: 72 };
const SIT = { x: 220, y: 97, s: 0.68, w: 156, h: 228, ox: 72, oy: 46 };
const himDrink = () => pixelSprite('himP:drink', DRINK_SP.w, DRINK_SP.h, cc => { cc.translate(DRINK_SP.ox, DRINK_SP.oy); bodyDrink(cc); }, { outline: HC.line });
const himSeated = () => pixelSprite('himP:sit', SIT.w, SIT.h, cc => { cc.translate(SIT.ox, SIT.oy); cc.scale(-SIT.s, SIT.s); bodySeated(cc); }, { outline: HC.line });
/** The screen's light on his lens. */
function lensGlow(c: Ctx, x: number, y: number, t: number, r = 20) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(220,232,255,${0.5 + Math.sin(t * 2) * 0.04})`); g.addColorStop(0.5, 'rgba(220,232,255,.14)'); g.addColorStop(1, 'rgba(220,232,255,0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
/** Elbow for a two-bone arm from s to h; of the two answers, the lower one (elbows hang). */
function elbow(s: V, h: V, l1: number, l2: number): V {
  const dx = h[0] - s[0], dy = h[1] - s[1], D = Math.hypot(dx, dy) || 1, d = Math.min(D, l1 + l2 - 0.5);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / D, uy = dy / D, mx = s[0] + ux * a, my = s[1] + uy * a;
  const e1: V = [mx - uy * hh, my + ux * hh], e2: V = [mx + uy * hh, my - ux * hh];
  return e1[1] > e2[1] ? e1 : e2;
}
/** A sleeve through the points: outline first, like the sprites. */
function limb(c: Ctx, pts: V[], w: number) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  const path = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
  c.strokeStyle = HC.line; c.lineWidth = w + 2.5; path(); c.stroke();
  c.strokeStyle = HC.body; c.lineWidth = w; path(); c.stroke();
}
function hand(c: Ctx, x: number, y: number, ang: number, s = 1) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = HC.line; rr(c, -13 * s - 1.2, -9 * s - 1.2, 26 * s + 2.4, 18 * s + 2.4, 7 * s); c.fill();
  c.fillStyle = '#111116'; rr(c, -13 * s, -9 * s, 26 * s, 18 * s, 7 * s); c.fill();
  c.strokeStyle = '#24242c'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-13 * s + i * 6.5 * s, -8 * s); c.lineTo(-13 * s + i * 6.5 * s, -2 * s); c.stroke(); }
  c.restore();
}
/** A monitor seen from the side, its screen facing right, with its light thrown across the room. */
function monitorSide(c: Ctx, x: number, top: number, bot: number, desk: number, reach: number) {
  const mid = (top + bot) / 2;
  c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x + 3, mid); c.scale(1, 0.62);
  const g = c.createRadialGradient(0, 0, 4, 0, 0, reach); g.addColorStop(0, 'rgba(130,150,255,.22)'); g.addColorStop(0.35, 'rgba(130,150,255,.08)'); g.addColorStop(1, 'rgba(130,150,255,0)');
  c.fillStyle = g; c.fillRect(-reach, -reach, reach * 2, reach * 2);
  c.restore();
  c.fillStyle = '#101015'; c.beginPath(); c.moveTo(x - 6, top + 14); c.lineTo(x - 20, mid - 22); c.lineTo(x - 20, mid + 22); c.lineTo(x - 6, bot - 14); c.fill();   // the back
  c.fillStyle = '#16161c'; rr(c, x - 7, top, 9, bot - top, 2); c.fill();                                                   // the panel
  c.fillStyle = '#c4ceff'; c.fillRect(x + 2, top + 3, 2, bot - top - 6);                                                   // the lit screen
  c.fillStyle = '#121217'; c.fillRect(x - 15, mid, 7, desk - mid); rr(c, x - 30, desk - 5, 40, 5, 2); c.fill();            // stand and foot
}

// ---------- the cans ----------
function goblinFace(c: Ctx, x: number, y: number, s: number, col = '#1a1424', eyes = '#ffd23a') {
  c.fillStyle = col;
  for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d * 9 * s, y - 5 * s); c.lineTo(x + d * 3.5 * s, y - 1.5 * s); c.lineTo(x + d * 3.2 * s, y + 2.5 * s); c.closePath(); c.fill(); }
  c.beginPath(); c.ellipse(x, y + 1 * s, 5 * s, 5.5 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = eyes; c.fillRect(x - 3 * s, y - 1 * s, 2 * s, 1.6 * s); c.fillRect(x + 1 * s, y - 1 * s, 2 * s, 1.6 * s);
  c.strokeStyle = eyes; c.lineWidth = 0.9 * s; c.beginPath(); c.arc(x, y + 1.6 * s, 2.6 * s, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
}
function lyingCan(c: Ctx, x: number, y: number, s = 1, ang = 0) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, -35, -9, 74, 24, 11); c.fill();
  const g = c.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, '#2c5a12'); g.addColorStop(0.4, '#8fd14a'); g.addColorStop(0.6, '#5aa02a'); g.addColorStop(1, '#1d3a0c');
  c.fillStyle = g; rr(c, -36, -12, 72, 24, 10); c.fill();
  const m = c.createLinearGradient(0, -12, 0, 12); m.addColorStop(0, '#6a6e78'); m.addColorStop(0.45, '#e6e9ee'); m.addColorStop(1, '#5a5e68');
  c.fillStyle = m; rr(c, -36, -12, 7, 24, 4); c.fill(); rr(c, 30, -12, 6, 24, 3); c.fill();
  goblinFace(c, -14, 0, 1.15);
  c.fillStyle = '#f2f2f2'; c.font = '800 7px Inter, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('GOBLIN FUEL', -3, 1);
  c.restore();
}
function standingCan(c: Ctx, x: number, y: number, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.ellipse(4, 20, 24, 10, 0, 0, Math.PI * 2); c.fill();
  const g = c.createLinearGradient(-21, 0, 21, 0); g.addColorStop(0, '#1d3a0c'); g.addColorStop(0.35, '#8fd14a'); g.addColorStop(0.6, '#4f9a26'); g.addColorStop(1, '#16290a');
  c.fillStyle = g; c.fillRect(-21, 0, 42, 16); c.beginPath(); c.ellipse(0, 16, 21, 9, 0, 0, Math.PI); c.fill();
  goblinFace(c, 0, 10, 0.9);
  c.fillStyle = '#c4c9d2'; c.beginPath(); c.ellipse(0, 0, 21, 10, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#959ca7'; c.beginPath(); c.ellipse(0, 0.5, 17, 8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#d6dae1'; rr(c, -4, -3, 8, 9, 3); c.fill();
  c.restore();
}
function sideCanBack(c: Ctx, x: number, y: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = 'rgba(79,154,38,.16)'; rr(c, -22, -42, 44, 84, 6); c.fill();
  c.restore();
}
function sideCanFront(c: Ctx, x: number, y: number, a: number, open: boolean) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.strokeStyle = 'rgba(214,226,206,.92)'; c.lineWidth = 2; rr(c, -22, -42, 44, 84, 6); c.stroke();
  c.fillStyle = '#c4c9d2'; c.fillRect(-21, -43, 42, 4); c.fillRect(-21, 38, 42, 4);
  if (open) { c.fillStyle = '#0b0b0e'; c.fillRect(5, -43, 14, 4); c.fillStyle = '#d6dae1'; c.save(); c.translate(-2, -43); c.rotate(-0.5); c.fillRect(-2, -3, 12, 3); c.restore(); }
  c.globalAlpha = 0.35; goblinFace(c, 0, -2, 1.8, '#0e1a08', '#e8ffc0');
  c.font = '800 8px Inter, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#e8ffc0'; c.fillText('GOBLIN', 0, 20); c.fillText('FUEL', 0, 29);
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-17, -38, 4, 76);
  c.restore();
}
function smallCan(c: Ctx, x: number, y: number, a: number, glow = false) {
  c.save(); c.translate(x, y); c.rotate(a);
  if (glow) { c.shadowColor = FUEL; c.shadowBlur = 12; }
  const L = CHL + CR, W2 = CR;
  const g = c.createLinearGradient(0, -W2, 0, W2); g.addColorStop(0, '#1d3a0c'); g.addColorStop(0.4, '#7cc843'); g.addColorStop(0.65, '#4f9a26'); g.addColorStop(1, '#16290a');
  c.fillStyle = g; rr(c, -L, -W2, L * 2, W2 * 2, 5); c.fill(); c.shadowBlur = 0;
  c.fillStyle = '#b8bec8'; c.fillRect(-L, -W2 + 1, 3, W2 * 2 - 2); c.fillRect(L - 3, -W2 + 1, 3, W2 * 2 - 2);
  goblinFace(c, -3, 0, 0.75);
  c.restore();
}

// ---------- scene state (outcomes go through systems/monster.ts) ----------
let lastGame: MonsterGame | null = null, lastStage = '', lastT = 0, shake = 0, tilting = false;
let pointer = { x: 0, y: 0, down: false };
const G = () => { const g = S.g.night?.game; return g && g.kind === 'monster' ? g : null; };
/** Space held / let go (main.ts): tilts the can while drinking. */
export function monsterTilt(on: boolean) { tilting = on; }

// 1-2 the drawer
const EDGE = 150, EDGE_H = 12;
const DRW = { x: 296, w: 268, face: 34, depth: 112, max: 92 };
const HANDLE_X = DRW.x + DRW.w / 2;
const SHOULDER_TOP: V = [244, SH + 4];                                  // his right shoulder (from above)
let drawer = 0, drawerHold: { py: number; d0: number } | null = null, drawerTo = -1, slideCd = 0;
let carry: { i: number; x: number; y: number } | null = null, placed: { x: number; y: number; t: number; i: number } | null = null;
const faceY = () => EDGE + EDGE_H + drawer;
const drawerCan = (i: number): V => [DRW.x + 62, faceY() - 22 - i * 27];
// 3 the tab
const LID = { x: 300, y: 142, rx: 132, ry: 114 };
let tab = 0, tabHold: { py: number; l0: number } | null = null, popT = -1, creakCd = 0;
let sprays: { x: number; y: number; vx: number; vy: number; t: number; foam: boolean }[] = [];
const ringY = () => LID.y - 6 + (74 * Math.cos(tab * 1.35) + 4) * 0.55 + 6;
// 4 the drink
let pour: Pour = newPour(), doneT = -1, splashCd = 0;
// 5 the throw
let toss: Toss = newToss([]), aim: V | null = null, followT = 0, tossDone = -1, verdict = '', clankCd = 0;

function reset(g: MonsterGame) {
  lastGame = g; lastStage = ''; shake = 0; tilting = false;
  drawer = 0; drawerHold = null; drawerTo = -1; carry = null; placed = null;
  tab = 0; tabHold = null; popT = -1; sprays = [];
}
function enterStage(stage: string) {
  if (stage === 'drink') { pour = newPour(); doneT = -1; }
  if (stage === 'toss') { toss = newToss([...(S.g.night?.bin ?? []), ...S.g.floorCans]); aim = null; followT = 0; tossDone = -1; verdict = ''; }
}

// ---------- input ----------
function toScene(ev: PointerEvent, cv: HTMLCanvasElement): V {
  const r = cv.getBoundingClientRect();
  return [((ev.clientX - r.left) / r.width) * SW, ((ev.clientY - r.top) / r.height) * SH];
}
document.addEventListener('pointerdown', ev => {
  const cv = (ev.target as HTMLElement)?.closest?.('#mcv') as HTMLCanvasElement | null;
  const g = G();
  if (!cv || !g || S.g.paused) return;
  ev.preventDefault();
  const [x, y] = toScene(ev, cv);
  pointer = { x, y, down: true };
  if (g.stage === 'drawer') { const f = faceY(); if (Math.abs(x - HANDLE_X) < 52 && y > f + 2 && y < f + 32) { drawerHold = { py: y, d0: drawer }; drawerTo = -1; sfx.click(); } return; }
  if (g.stage === 'grab' && !carry && !placed) {
    for (let i = 0; i < Math.min(3, S.g.monsters); i++) { const [cx, cy] = drawerCan(i); if (Math.abs(x - cx) < 40 && Math.abs(y - cy) < 14) { carry = { i, x: cx, y: cy }; sfx.click(); return; } }
    return;
  }
  if (g.stage === 'open' && popT < 0) { if (Math.abs(x - LID.x) < 46 && Math.abs(y - ringY()) < 38) tabHold = { py: y, l0: tab }; return; }
  if (g.stage === 'drink' && doneT < 0) {
    const cs = Math.cos(pour.a), sn = Math.sin(pour.a), dx = x - pour.x, dy = y - pour.y;
    if (Math.abs(dx * cs + dy * sn) < 36 && Math.abs(-dx * sn + dy * cs) < 54) { pour.held = true; sfx.click(); }
    return;
  }
  if (g.stage === 'toss' && !toss.thrown && tossDone < 0 && Math.hypot(x - HAND[0], y - HAND[1]) < 40) { aim = [0, 0]; sfx.click(); }
});
document.addEventListener('pointermove', ev => {
  const cv = document.getElementById('mcv') as HTMLCanvasElement | null;
  if (!cv) return;
  const [x, y] = toScene(ev, cv);
  pointer.x = x; pointer.y = y;
});
document.addEventListener('pointerup', () => {
  pointer.down = false;
  const g = G();
  if (!g) return;
  if (drawerHold) { drawerHold = null; drawerTo = drawer > DRW.max * 0.5 ? DRW.max : 0; }
  if (carry && g.stage === 'grab') {
    if (pointer.y < EDGE - 8) { placed = { x: clamp(pointer.x, 40, 560), y: clamp(pointer.y, 34, EDGE - 34), t: 0, i: carry.i }; sfx.canOnDesk(); }
    carry = null;
  }
  tabHold = null;
  pour.held = false;
  if (aim) throwCan();
});
function throwCan() {
  if (!aim) return;
  const [px, py] = aim;
  aim = null;
  if (Math.hypot(px, py) < 10) return;                     // barely pulled: nothing happens
  launch(toss, px, py); followT = 0.35; sfx.flip();
}

// ---------- 1-2: the drawer and the can, top-down ----------
function deskTop(c: Ctx) {
  const ug = c.createLinearGradient(0, EDGE, 0, SH); ug.addColorStop(0, '#040406'); ug.addColorStop(1, '#09080e');
  c.fillStyle = ug; c.fillRect(0, EDGE, SW, SH - EDGE);
  const lap = c.createRadialGradient(TOP.x, 214, 10, TOP.x, 214, 130); lap.addColorStop(0, 'rgba(22,22,30,.9)'); lap.addColorStop(1, 'rgba(22,22,30,0)');
  c.fillStyle = lap; c.fillRect(TOP.x - 140, EDGE, 280, SH - EDGE);                            // his lap, in the desk's shadow
  blit(c, himTop(), TOP.x - TOP.ox, TOP.y - TOP.oy, 1);                                        // him, from above
  c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, EDGE + EDGE_H, SW, 22);                       // the desk's shadow on his knees
  // the desk top: dark planks, grain
  c.fillStyle = WOOD; c.fillRect(0, 0, SW, EDGE);
  for (let i = 0; i < 70; i++) { c.fillStyle = rnd(i, 1) > 0.5 ? '#2a1f16' : '#1f1610'; c.fillRect(rnd(i, 2) * SW, rnd(i, 3) * EDGE, 30 + rnd(i, 4) * 80, 1); }
  for (const px of [140, 300, 460]) { c.fillStyle = '#18110b'; c.fillRect(px, 0, 1.5, EDGE); }
  c.fillStyle = '#0e0e12'; rr(c, -20, 8, 236, 92, 8); c.fill();                               // keyboard corner, backlit
  for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) { c.fillStyle = '#18181e'; rr(c, -6 + k * 24 + (r % 2) * 6, 16 + r * 20, 20, 16, 3); c.fill(); c.fillStyle = 'rgba(79,209,232,.25)'; c.fillRect(-6 + k * 24 + (r % 2) * 6, 31 + r * 20, 20, 1); }
  c.fillStyle = '#0c0c10'; rr(c, 470, 8, 140, 124, 10); c.fill();                               // mouse pad and mouse
  c.fillStyle = '#16161c'; c.beginPath(); c.ellipse(532, 66, 20, 30, 0.1, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(79,209,232,.6)'; c.fillRect(530, 44, 3, 8);
  c.strokeStyle = '#0c0c10'; c.lineWidth = 3; c.beginPath(); c.moveTo(532, 36); c.quadraticCurveTo(520, 6, 560, -10); c.stroke();
  for (let i = 0; i < 3; i++) { c.strokeStyle = `rgba(${FUEL_RGB},${0.12 + i * 0.04})`; c.lineWidth = 2.5; c.beginPath(); c.ellipse(336 + i * 7 - 7, 86 + (i % 2) * 5, 22, 11, 0, 0, Math.PI * 2); c.stroke(); }   // old rings
  for (let i = 0; i < 14; i++) { c.fillStyle = '#3a2c1c'; c.fillRect(250 + rnd(i, 5) * 180, 30 + rnd(i, 6) * 100, 2, 2); }   // crumbs
  c.fillStyle = WOOD_D; c.fillRect(0, EDGE, SW, EDGE_H); c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, EDGE, SW, 1);
  const lg = c.createLinearGradient(0, 0, 0, EDGE + 40); lg.addColorStop(0, 'rgba(120,140,255,.16)'); lg.addColorStop(1, 'rgba(120,140,255,0)');
  c.fillStyle = lg; c.fillRect(0, 0, SW, EDGE + 40);                                             // the monitor's light from above
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
/** His right arm from below the frame to a point on the desk. */
function reach(c: Ctx, hx: number, hy: number, ang: number) {
  const e = elbow(SHOULDER_TOP, [hx, hy + 10], 104, 100);
  limb(c, [SHOULDER_TOP, e, [hx + 2, hy + 10]], 26);
  hand(c, hx, hy, ang, 1);
}
function drawTop(c: Ctx, g: MonsterGame, dt: number, t: number) {
  if (drawerHold) {
    const pulled = pointer.y - drawerHold.py;
    const want = clamp(drawerHold.d0 + (drawerHold.d0 > 0 ? pulled : Math.max(0, pulled - 6)) * 0.92, 0, DRW.max);   // it sticks a little at first
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

  deskTop(c);
  drawerBox(c, t, g);
  if (placed) standingCan(c, placed.x, placed.y);
  if (g.stage === 'grab' && !placed) { ringHint(c, 336, 92, 30, 18, t); if (!carry) say(c, 'drag a can to the desk', 336, 128, '700 13px Inter, sans-serif', FUEL); }
  const f = faceY();
  if (drawerHold || (g.stage === 'drawer' && drawerTo >= 0)) reach(c, HANDLE_X, f + 18, 0);
  else if (carry) {
    if (carry.y < EDGE) standingCan(c, carry.x, carry.y - 6, 1.08); else lyingCan(c, carry.x, carry.y - 4, 1.1, -0.15);
    reach(c, carry.x + 6, carry.y + 10, -0.4);
  }
  if (g.stage === 'drawer' && !drawerHold && drawerTo < 0) {
    ringHint(c, HANDLE_X, f + 18, 52, 14, t);
    say(c, 'grab the handle, pull ↓', HANDLE_X, f + 52, '700 13px Inter, sans-serif', FUEL);
  }
}

// ---------- 3: the tab ----------
function drawLid(c: Ctx, g: MonsterGame, dt: number, t: number) {
  if (tabHold && popT < 0) {
    const want = clamp(tabHold.l0 + (tabHold.py - pointer.y) / 115, 0, 1);
    creakCd -= dt;
    if (want > tab + 0.03 && creakCd <= 0) { sfx.tabCreak(); creakCd = 0.05; }
    tab = want;
    if (tab >= 0.62) {                                        // the seal gives: POP
      popT = 0; tabHold = null; shake = 0.35;
      sfx.pop(); sfx.canOpen();
      for (let i = 0; i < 46; i++) { const a = -Math.PI / 2 + (rnd(i, 7) - 0.5) * 2.4, v = 60 + rnd(i, 8) * 260; sprays.push({ x: LID.x, y: LID.y - 58, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, foam: i % 3 === 0 }); }
    }
  } else if (popT < 0) tab = Math.max(0, tab - dt * 3);
  if (popT >= 0) {
    popT += dt;
    tab += ((popT < 0.25 ? 0.55 : 0.18) - tab) * Math.min(1, dt * 8);
    if (popT > 1.15 && g.stage === 'open') monsterOpenCan();
  }
  c.fillStyle = '#1a130d'; c.fillRect(0, 0, SW, SH);
  for (let i = 0; i < 40; i++) { c.fillStyle = rnd(i, 9) > 0.5 ? '#21180f' : '#140e09'; c.fillRect(0, rnd(i, 10) * SH, SW, 1 + rnd(i, 11) * 2); }
  const bg = c.createLinearGradient(LID.x - LID.rx, 0, LID.x + LID.rx, 0); bg.addColorStop(0, '#16290a'); bg.addColorStop(0.35, '#7cc843'); bg.addColorStop(0.6, '#4f9a26'); bg.addColorStop(1, '#122207');
  c.fillStyle = bg; c.beginPath(); c.ellipse(LID.x, LID.y + 40, LID.rx, LID.ry, 0, 0, Math.PI); c.lineTo(LID.x - LID.rx, LID.y); c.fill();
  c.fillRect(LID.x - LID.rx, LID.y, LID.rx * 2, 40);
  c.fillStyle = '#c9ced6'; c.beginPath(); c.ellipse(LID.x, LID.y, LID.rx, LID.ry, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#7c838e'; c.beginPath(); c.ellipse(LID.x, LID.y + 2, LID.rx - 10, LID.ry - 9, 0, 0, Math.PI * 2); c.fill();
  const pg = c.createRadialGradient(LID.x - 40, LID.y - 50, 10, LID.x, LID.y, LID.rx); pg.addColorStop(0, '#c3c9d2'); pg.addColorStop(1, '#858c97');
  c.fillStyle = pg; c.beginPath(); c.ellipse(LID.x, LID.y + 3, LID.rx - 17, LID.ry - 15, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#6e7580'; c.font = '800 13px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GOBLIN FUEL', LID.x, LID.y + 74);
  c.font = '600 9px Inter, sans-serif'; c.fillText("RECYCLE ME. OR DON'T.", LID.x, LID.y + 88);
  const ox = LID.x, oy = LID.y - 58;
  const tongue = () => { c.beginPath(); c.moveTo(ox - 30, oy + 18); c.quadraticCurveTo(ox - 34, oy - 26, ox, oy - 28); c.quadraticCurveTo(ox + 34, oy - 26, ox + 30, oy + 18); c.quadraticCurveTo(ox, oy + 30, ox - 30, oy + 18); };
  if (popT < 0) { c.strokeStyle = '#6e7580'; c.lineWidth = 2; tongue(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; c.save(); c.translate(0, 1.5); tongue(); c.stroke(); c.restore(); }
  else {
    c.fillStyle = '#060607'; tongue(); c.fill();
    c.fillStyle = 'rgba(143,227,58,.5)'; c.beginPath(); c.ellipse(ox, oy + 8, 18, 8, 0, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 9; i++) { const k = (t * 1.3 + i / 9) % 1; c.fillStyle = `rgba(230,255,210,${0.8 * (1 - k)})`; c.beginPath(); c.arc(ox - 20 + rnd(i, 12) * 40, oy + 12 - k * 22, 1.5 + rnd(i, 13) * 2, 0, Math.PI * 2); c.fill(); }
  }
  const th = tab * 1.35, len = 74 * Math.cos(th) + 4, wid = 58 * (1 + 0.14 * Math.sin(th)), ry = LID.y - 6;
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(LID.x + 4, ry + 40 + tab * 10, 30, 42 * Math.cos(th) + 4, 0, 0, Math.PI * 2); c.fill();
  const tg = c.createLinearGradient(0, ry - 30, 0, ry + len); tg.addColorStop(0, '#aeb4be'); tg.addColorStop(1, tab > 0.1 ? '#eef1f5' : '#ccd1d9');
  c.fillStyle = tg; rr(c, LID.x - wid / 2, ry - 30 + tab * 6, wid, 30 + len - tab * 6, 16); c.fill();
  c.strokeStyle = '#7c838e'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#4a505a'; c.beginPath(); c.ellipse(LID.x, ry + 6 + len * 0.55, 18 * (1 + 0.1 * Math.sin(th)), 12 * Math.cos(th) + 3, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#9aa1ad'; c.beginPath(); c.arc(LID.x, ry, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#c4c9d2'; c.beginPath(); c.arc(LID.x - 2, ry - 2, 3, 0, Math.PI * 2); c.fill();
  if (tabHold) {                                               // his finger in the ring
    const fy = ry + len * 0.55 + 6;
    limb(c, [[LID.x + 120, SH + 40], [LID.x + 40, fy + 70], [LID.x + 6, fy + 10]], 22);
    c.fillStyle = HC.line; rr(c, LID.x - 6.5, fy - 9, 13, 26, 6); c.fill(); c.fillStyle = '#111116'; rr(c, LID.x - 5, fy - 8, 10, 24, 5); c.fill();
  }
  for (const p of sprays) { p.t += dt; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  sprays = sprays.filter(p => p.t < 1.1);
  for (const p of sprays) { c.fillStyle = p.foam ? `rgba(240,255,225,${1 - p.t})` : `rgba(${FUEL_RGB},${1 - p.t})`; c.beginPath(); c.arc(p.x, p.y, p.foam ? 3 + p.t * 3 : 2.4, 0, Math.PI * 2); c.fill(); }
  if (popT >= 0 && popT < 1.1) say(c, 'PSSHHT!', LID.x + 150, 60 - popT * 10, `900 ${30 + Math.min(1, popT * 6) * 10}px Inter, sans-serif`, '#f4ffe0', 'center', 1 - Math.max(0, popT - 0.6) * 2);
  if (popT < 0 && !tabHold) { ringHint(c, LID.x, ringY(), 30, 22, t); say(c, 'pull the tab up ↑', LID.x + 150, ry + 60, '700 13px Inter, sans-serif', FUEL); }
}

// ---------- 4: the drink ----------
function drinkRoom(c: Ctx) {
  const wg = c.createLinearGradient(0, 0, 0, SH); wg.addColorStop(0, '#09090e'); wg.addColorStop(1, '#0d0c12');
  c.fillStyle = wg; c.fillRect(0, 0, SW, SH);
  // the window behind him: a night sky, a few far lights; his outline reads against it
  const wx = 498, wy = 22, ww = 92, wh = 128;
  const sky = c.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#141a2c'); sky.addColorStop(1, '#1b2134');
  c.fillStyle = '#070709'; c.fillRect(wx - 5, wy - 5, ww + 10, wh + 10); c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 12; i++) { c.fillStyle = rnd(i, 21) > 0.6 ? 'rgba(255,214,140,.55)' : 'rgba(180,200,255,.35)'; c.fillRect(wx + rnd(i, 22) * ww, wy + wh * 0.55 + rnd(i, 23) * wh * 0.4, 2, 2); }
  c.fillStyle = '#070709'; c.fillRect(wx + ww / 2 - 2, wy, 4, wh); c.fillRect(wx, wy + wh * 0.45, ww, 4);
  // a shelf with a figure and a box on it
  c.fillStyle = '#100e15'; c.fillRect(150, 62, 120, 5); c.fillRect(170, 36, 18, 26); c.fillRect(226, 28, 30, 34); c.beginPath(); c.arc(202, 52, 9, 0, Math.PI * 2); c.fill();
  // the desk
  c.fillStyle = '#2a1f16'; c.fillRect(0, DESK_TOP, 404, 3); c.fillStyle = WOOD; c.fillRect(0, DESK_TOP + 3, 404, 9); c.fillStyle = '#100b07'; c.fillRect(0, DESK_TOP + 12, 404, SH - DESK_TOP);
  c.fillStyle = '#0e0e12'; rr(c, 110, DESK_TOP - 9, 130, 9, 3); c.fill(); c.fillStyle = 'rgba(79,209,232,.35)'; c.fillRect(114, DESK_TOP - 2, 122, 1);
  monitorSide(c, 44, 70, 196, DESK_TOP, 560);
}
function drawDrink(c: Ctx, g: MonsterGame, dt: number, t: number) {
  const [rx] = REST;
  stepPour(pour, dt, { held: pour.held, tx: pointer.x, ty: pointer.y, tilt: tilting }, {
    gulp: () => sfx.gulp(),
    splash: () => { if (splashCd <= 0) { sfx.splash(); splashCd = 0.12; } },
    cough: () => { monsterCough(); shake = 0.25; },
  });
  splashCd -= dt;
  if (pour.done && doneT < 0) doneT = 0;
  if (doneT >= 0) { doneT += dt; if (doneT > 1.3 && g.stage === 'drink') monsterDrank(share(pour)); }
  drinkRoom(c);
  for (const x of pour.puddle) { c.fillStyle = `rgba(${FUEL_RGB},.55)`; c.beginPath(); c.ellipse(x, DESK_TOP + 1, 6, 2, 0, 0, Math.PI * 2); c.fill(); }
  // him, then what his face does
  const [ox, oy] = HEAD_O;
  blit(c, himDrink(), ox - DRINK_SP.ox, oy - DRINK_SP.oy, 1);
  const full = pour.mouth / T.MONSTER_MOUTH_CAP;
  if (full > 0.15) {                                            // cheeks puff as his mouth fills
    const r = 3 + full * 6;
    c.fillStyle = HC.head; c.beginPath(); c.arc(ox - 28, oy + 20, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = HC.line; c.lineWidth = 1.2; c.beginPath(); c.arc(ox - 28, oy + 20, r, Math.PI * 0.55, Math.PI * 1.45); c.stroke();
  }
  if (pour.open > 0.05) {
    c.fillStyle = '#020203'; c.beginPath(); c.ellipse(ox - 36, oy + 26, 3, 0.6 + pour.open * 3.4, 0, 0, Math.PI * 2); c.fill();
    if (pour.mouth > 0.5) { c.fillStyle = FUEL; c.beginPath(); c.ellipse(ox - 36, oy + 27, 2, pour.open * 2, 0, 0, Math.PI * 2); c.fill(); }
  }
  if (pour.gulp > 0) { const gy = oy + 48 + (1 - pour.gulp) * 18; c.fillStyle = HC.body; c.beginPath(); c.arc(ox - 21, gy, 3.5, 0, Math.PI * 2); c.fill(); c.strokeStyle = HC.line; c.lineWidth = 1.2; c.beginPath(); c.arc(ox - 21, gy, 3.5, Math.PI * 0.6, Math.PI * 1.4); c.stroke(); }
  lensGlow(c, ox - 40, oy - 7, t);
  // the can: back wall, the drink, the outline; his hand on it
  sideCanBack(c, pour.x, pour.y, pour.a);
  for (const d of pour.drops) if (d.s === 0 || d.s === 1) { c.fillStyle = FUEL; c.beginPath(); c.arc(d.x, d.y, d.s === 0 ? 4.2 : 3, 0, Math.PI * 2); c.fill(); }
  for (const d of pour.drops) if (d.s === 0) { c.fillStyle = 'rgba(230,255,200,.35)'; c.fillRect(d.x - 1.5, d.y - 2.5, 2, 1.5); }
  for (const d of pour.drops) if (d.s === 3 && d.t < 1.6) { c.fillStyle = `rgba(${FUEL_RGB},${1 - d.t / 1.6})`; c.beginPath(); c.arc(d.x, d.y, 2.4, 0, Math.PI * 2); c.fill(); }
  sideCanFront(c, pour.x, pour.y, pour.a, g.opened);
  const sh: V = [ox + 6, oy + 78], cs = Math.cos(pour.a), sn = Math.sin(pour.a);
  if (pour.held || Math.abs(pour.x - rx) > 3) {
    const grip: V = [pour.x + 27 * cs - 6 * sn, pour.y + 27 * sn + 6 * cs];
    limb(c, [sh, elbow(sh, grip, 60, 58), grip], 20); hand(c, grip[0] - 2 * cs, grip[1] - 2 * sn, pour.a + Math.PI / 2, 0.95);
  } else { limb(c, [sh, [446, 238], [400, DESK_TOP - 8]], 20); hand(c, 396, DESK_TOP - 8, 0, 0.95); }
  // the light of the drink itself
  let cx = 0, cy = 0, k = 0; for (const d of pour.drops) if (d.s === 0) { cx += d.x; cy += d.y; k++; }
  if (k) { cx /= k; cy /= k; c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(cx, cy, 4, cx, cy, 110); lg.addColorStop(0, `rgba(${FUEL_RGB},.14)`); lg.addColorStop(1, `rgba(${FUEL_RGB},0)`); c.fillStyle = lg; c.fillRect(cx - 110, cy - 110, 220, 220); c.restore(); }
  // the meter: how much went down, with the half and full marks
  const sh2 = share(pour), bx = 16, by = 14, bw = 170;
  c.fillStyle = 'rgba(0,0,0,.6)'; rr(c, bx - 6, by - 6, bw + 12, 44, 8); c.fill();
  c.fillStyle = '#1e1b26'; rr(c, bx, by + 12, bw, 10, 4); c.fill();
  c.fillStyle = sh2 >= T.MONSTER_DRINK_FULL ? FUEL : sh2 >= T.MONSTER_DRINK_HALF ? '#f1b434' : '#8a84a0'; rr(c, bx, by + 12, Math.max(2, bw * sh2), 10, 4); c.fill();
  for (const [m, lab] of [[T.MONSTER_DRINK_HALF, 'half'], [T.MONSTER_DRINK_FULL, 'full']] as [number, string][]) { c.fillStyle = '#e8e4f0'; c.fillRect(bx + bw * m - 1, by + 9, 2, 16); say(c, lab, bx + bw * m, by + 31, '600 9px Inter, sans-serif', '#b8b0c8'); }
  say(c, `in you: ${Math.round(sh2 * 100)}%`, bx, by + 3, '700 11px Inter, sans-serif', '#e8e4f0', 'left');
  if (doneT < 0 && pour.drops.some(d => d.s === 0)) {
    const [hx, hy] = holeAt(pour.x, pour.y, pour.a);
    if (!pour.held) { ringHint(c, pour.x, pour.y, 34, 50, t); say(c, 'hold the can (mouse)', pour.x, pour.y - 66, '700 13px Inter, sans-serif', FUEL); }
    else if (Math.hypot(hx - MOUTH.x, hy - MOUTH.y) > T.MONSTER_LIPS * 1.6) { ringHint(c, MOUTH.x, MOUTH.y, 12, 10, t); say(c, 'to his mouth', MOUTH.x - 30, MOUTH.y - 52, '700 12px Inter, sans-serif', FUEL); }
    else if (pour.a < 0.3 && !tilting) {
      c.fillStyle = 'rgba(0,0,0,.6)'; rr(c, 210, 262, 186, 26, 6); c.fill(); c.strokeStyle = '#e8e4f0'; c.lineWidth = 1.5; rr(c, 220, 267, 54, 16, 3); c.stroke();
      say(c, 'SPACE', 247, 275, '700 9px Inter, sans-serif', '#e8e4f0'); say(c, 'hold to tilt, tap to ease', 334, 275, '700 11px Inter, sans-serif', FUEL);
    } else if (full > 0.8) say(c, 'mmf!', ox - 64, oy - 4, '800 13px Inter, sans-serif', '#ffb070');
  } else if (doneT >= 0) {
    const r = share(pour), fu = r >= T.MONSTER_DRINK_FULL, hf = r >= T.MONSTER_DRINK_HALF;
    say(c, `${Math.round(r * 100)}%: ${fu ? 'FULL BOOST' : hf ? 'HALF A BOOST' : 'NO BOOST'}`, 240, 120, '900 28px Inter, sans-serif', fu ? FUEL : hf ? '#f1b434' : '#ff8a80');
  }
}

// ---------- 5: the throw ----------
function drawToss(c: Ctx, g: MonsterGame, dt: number, t: number) {
  if (aim) { let dx = pointer.x - HAND[0], dy = pointer.y - HAND[1]; const d = Math.hypot(dx, dy); if (d > PULL_MAX) { dx *= PULL_MAX / d; dy *= PULL_MAX / d; } aim = [dx, dy]; }
  clankCd -= dt;
  stepToss(toss, dt, {
    clank: p => { if (clankCd <= 0) { sfx.clank(p); monsterClank(p); clankCd = 0.07; } },
    binDrop: () => sfx.binDrop(),
  });
  followT = Math.max(0, followT - dt);
  if (toss.settled && tossDone < 0) { tossDone = 0; verdict = toss.inBin ? ({ swish: 'SWISH!', bank: 'BANK SHOT!', rim: 'IN OFF THE RIM' } as const)[tossStyle(toss)] : 'MISS. IT STAYS THERE.'; }
  if (tossDone >= 0) {
    tossDone += dt;
    if (tossDone > 1.2 && g.stage === 'toss') { const p = tossPoses(toss); monsterTossed(p.bin, p.floor, toss.inBin, tossStyle(toss)); }
  }
  // the room
  const wg = c.createLinearGradient(0, 0, 0, FLOOR); wg.addColorStop(0, '#08080d'); wg.addColorStop(1, '#0e0d14');
  c.fillStyle = wg; c.fillRect(0, 0, SW, FLOOR);
  c.fillStyle = '#121019'; c.fillRect(352, 34, 66, 90); c.fillStyle = '#1a1622'; c.fillRect(358, 40, 54, 78); c.fillStyle = 'rgba(181,140,255,.12)'; c.beginPath(); c.moveTo(385, 52); c.lineTo(402, 100); c.lineTo(368, 100); c.fill();   // a poster
  c.fillStyle = '#100c09'; c.fillRect(0, FLOOR, SW, SH - FLOOR); c.fillStyle = '#1a140f'; c.fillRect(0, FLOOR, SW, 2);
  for (let x = 30; x < SW; x += 70) { c.fillStyle = '#0c0907'; c.fillRect(x, FLOOR, 1.5, SH - FLOOR); }
  c.fillStyle = '#15121c'; c.fillRect(0, FLOOR - 8, SW, 8);
  c.fillStyle = WOOD; c.fillRect(DESK_T.x1, DESK_T.y, DESK_T.x2 - DESK_T.x1, 8); c.fillStyle = '#100b07'; c.fillRect(6, DESK_T.y + 8, 7, FLOOR - DESK_T.y - 8); c.fillRect(DESK_T.x2 - 12, DESK_T.y + 8, 7, FLOOR - DESK_T.y - 8);
  monitorSide(c, 70, 92, 160, DESK_T.y, 520);
  // him, turned on his chair toward the bin
  blit(c, himSeated(), SIT.x - SIT.ox, SIT.y - SIT.oy, 1);
  lensGlow(c, SIT.x + 40 * SIT.s, SIT.y - 7 * SIT.s, t, 15);
  // the bin's back, the cans, the bin's front mesh
  c.fillStyle = '#16141c'; c.beginPath(); c.moveTo(BIN.l, BIN.top); c.lineTo(BIN.r, BIN.top); c.lineTo(BIN.br, FLOOR); c.lineTo(BIN.bl, FLOOR); c.fill();
  for (const b of toss.bodies) if (b !== toss.thrown) smallCan(c, b.x, b.y, b.a);
  if (toss.thrown) smallCan(c, toss.thrown.x, toss.thrown.y, toss.thrown.a);
  c.fillStyle = 'rgba(60,62,76,.45)'; c.beginPath(); c.moveTo(BIN.l, BIN.top + 6); c.lineTo(BIN.r, BIN.top + 6); c.lineTo(BIN.br, FLOOR); c.lineTo(BIN.bl, FLOOR); c.fill();
  c.strokeStyle = 'rgba(20,20,26,.7)'; c.lineWidth = 1;
  for (let i = 1; i < 9; i++) { const fx = BIN.l + (i * (BIN.r - BIN.l)) / 9; c.beginPath(); c.moveTo(fx, BIN.top + 6); c.lineTo(BIN.bl + (i * (BIN.br - BIN.bl)) / 9, FLOOR); c.stroke(); }
  c.fillStyle = '#2a2a34'; rr(c, BIN.l - 4, BIN.top - 2, BIN.r - BIN.l + 8, 8, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(BIN.l - 3, BIN.top - 2, BIN.r - BIN.l + 6, 1);
  // his arm: the can in hand, pulled back, or the follow-through
  const sh: V = [SIT.x - 8 * SIT.s, SIT.y + 78 * SIT.s];
  if (!toss.thrown) {
    const [ax, ay] = aim ?? [Math.sin(t * 2) * 1.5, Math.sin(t * 3) * 2];
    const hx = HAND[0] + ax, hy = HAND[1] + ay;
    smallCan(c, hx, hy - 3, -Math.PI / 2 + ax * 0.006, !aim && tossDone < 0);
    limb(c, [sh, elbow(sh, [hx - 2, hy + 6], 36, 36), [hx - 2, hy + 6]], 14); hand(c, hx - 2, hy + 6, 0.3, 0.62);
  } else {
    const k = followT / 0.35, hx = HAND[0] + 26 * (1 - k), hy = HAND[1] - 22 * (1 - k);
    limb(c, [sh, elbow(sh, [hx, hy], 36, 36), [hx, hy]], 14); hand(c, hx, hy, 0.3, 0.62);
  }
  // aim: the first part of the arc only (one try, no free answer)
  if (aim && Math.hypot(aim[0], aim[1]) > 10) {
    let x = HAND[0] + aim[0], y = HAND[1] + aim[1], vx = -aim[0] * LAUNCH, vy = -aim[1] * LAUNCH;
    for (let i = 0; i < 10; i++) { const st = 1 / 40; vy += GRAV * st; x += vx * st; y += vy * st; c.fillStyle = `rgba(230,240,255,${0.8 - i * 0.07})`; c.beginPath(); c.arc(x, y, 2.6 - i * 0.12, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = 'rgba(143,227,58,.3)'; c.lineWidth = 1.5; c.setLineDash([5, 5]); c.beginPath(); c.arc(HAND[0], HAND[1], PULL_MAX, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
  }
  const onFloor = toss.bodies.length - (toss.thrown ? 1 : 0) - (S.g.night?.bin.length ?? 0);
  if (onFloor > 0) say(c, `on the floor: ${onFloor}`, 590, 286, '600 10px Inter, sans-serif', '#8a84a0', 'right');
  if (!toss.thrown && !aim && tossDone < 0) { ringHint(c, HAND[0], HAND[1] - 3, 24, 26, t); say(c, 'one throw: grab it, pull back, let go', 330, 30, '700 13px Inter, sans-serif', FUEL); }
  if (tossDone >= 0) say(c, verdict, 330, 70, '900 26px Inter, sans-serif', toss.inBin ? FUEL : '#ff8a80');
}

// ---------- main draw ----------
export function drawMonsterScene() {
  const cv = document.getElementById('mcv') as HTMLCanvasElement | null;
  const g = G();
  if (!cv || !g) { lastGame = null; return; }
  if (lastGame !== g) reset(g);
  if (lastStage !== g.stage) { lastStage = g.stage; enterStage(g.stage); }
  const now = performance.now() / 1000;
  const dt = Math.min(1 / 30, lastT ? now - lastT : 1 / 60); lastT = now;
  const c = cv.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, SW, SH);
  if (S.g.paused) return;
  shake = Math.max(0, shake - dt);
  if (shake > 0) c.translate((Math.random() - 0.5) * shake * 16, (Math.random() - 0.5) * shake * 16);
  if (g.stage === 'drawer' || g.stage === 'grab') drawTop(c, g, dt, now);
  else if (g.stage === 'open') drawLid(c, g, dt, now);
  else if (g.stage === 'drink') drawDrink(c, g, dt, now);
  else drawToss(c, g, dt, now);
}

// Test hooks (playtest scripts)
const W = window as unknown as Record<string, unknown>;
W.__lnThrow = (vx: number, vy: number) => { if (toss.thrown || tossDone >= 0) return false; aim = [-vx / LAUNCH, -vy / LAUNCH]; throwCan(); return true; };
W.__lnFluid = () => ({ n: pour.drops.length, drunk: pour.drunk, inCan: pour.drops.filter(d => d.s === 0).length, free: pour.drops.filter(d => d.s === 1).length, mouth: pour.mouth, a: pour.a, held: pour.held, x: pour.x, y: pour.y });
W.__lnToss = () => ({ bodies: toss.bodies.length, thrown: toss.thrown ? { x: toss.thrown.x, y: toss.thrown.y, asleep: toss.thrown.asleep } : null, done: tossDone, verdict });
