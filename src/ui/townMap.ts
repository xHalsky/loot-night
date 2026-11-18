// Ravenhold at night (#50, #51): a jRPG town seen from above at an angle, drawn in code as a prototype for the art
// redesign. Streets meet at right angles like a SNES town. The plaza with its fountain and the court in front of the
// Dungeon Portal are where people gather, so they get the most light and the biggest crowds. Every building shows
// its trade; an unbuilt plot is cleared ground with its materials stacked and a clue to what will stand there.
// Names are signs in the scene; a building glows under the mouse.
// Rules live in systems/town.ts; the clicks are wired in main.ts (townHit).
import { S } from '../core/state';
import { type CityId } from '../data/city';
import { BATTLE_W, GAME_H } from './layout';

const W = BATTLE_W, H = GAME_H;   // the whole battle area: 668 x 464
const FONT = '"Pixelify Sans", monospace';
export type TownSpotId = CityId | 'appraiser' | 'auction' | 'merchant' | 'salvage' | 'portal';
/** What you can click: the services, the four plots and the portal. Footprints in battle-area pixels. */
export const TOWN_SPOTS: { id: TownSpotId; x: number; y: number; w: number; h: number; name: string; sign: [number, number] }[] = [
  { id: 'portal', x: 276, y: 0, w: 116, h: 122, name: 'Dungeon Portal', sign: [334, 14] },
  { id: 'appraiser', x: 4, y: 0, w: 130, h: 138, name: 'Appraiser', sign: [54, 152] },
  { id: 'library', x: 158, y: 10, w: 100, h: 128, name: 'Library', sign: [208, 152] },
  { id: 'auction', x: 408, y: 0, w: 120, h: 138, name: 'Auction House', sign: [469, 152] },
  { id: 'treasury', x: 552, y: 30, w: 112, h: 108, name: 'Treasury', sign: [609, 152] },
  { id: 'merchant', x: 398, y: 162, w: 130, h: 98, name: 'Merchant', sign: [486, 279] },
  { id: 'training', x: 158, y: 286, w: 154, h: 94, name: 'Training Grounds', sign: [234, 393] },
  { id: 'salvage', x: 356, y: 264, w: 172, h: 116, name: 'Salvage Forge', sign: [442, 393] },
  { id: 'inn', x: 552, y: 268, w: 112, h: 112, name: 'Inn', sign: [612, 393] },
];
export const townHit = (x: number, y: number): TownSpotId | null => {
  for (const s of TOWN_SPOTS) if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s.id;
  return null;
};
/** The spot under the mouse (main.ts sets it); it glows. */
export const townHover: { id: TownSpotId | null } = { id: null };

// ---------- the plan: a grid of streets, the plaza, the portal court ----------
type Pt = [number, number];
type Box = [number, number, number, number];
const STREETS: Box[] = [
  [0, 138, W, 20], [0, 262, W, 24], [0, 382, W, 18],     // three streets east to west
  [136, 24, 20, H - 24], [530, 24, 20, H - 24],          // two north to south
  [314, 286, 40, H - 286],                               // the avenue south from the plaza
];
const COURT: Box = [262, 104, 144, 34];                   // flagstones in front of the portal
const PLAZA: Box = [232, 158, 204, 104];
const FX = 334, FY = 208;                                 // the fountain
const LAMPS: Pt[] = [[18, 156], [120, 156], [172, 156], [516, 156], [566, 156], [650, 156],
  [18, 284], [120, 284], [172, 284], [566, 284], [650, 284],
  [18, 398], [120, 398], [172, 398], [300, 398], [368, 398], [516, 398], [556, 398], [650, 398],
  [154, 222], [548, 222], [154, 344], [548, 344]];

// ---------- small drawing helpers ----------
type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const rnd = (i: number, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const ell = (c: Ctx, x: number, y: number, rx: number, ry: number, col: string) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
const tri = (c: Ctx, a: Pt, b: Pt, d: Pt, col: string) => { c.fillStyle = col; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.fill(); };
const GOLD = '#e0a83a', IRON = '#5a5662', WOOD = '#5a4028', DARK = '#1c1a24';
type LightCol = 'warm' | 'cold' | 'arcane' | 'fire' | 'gold';
type Light = { x: number; y: number; r: number; col: LightCol; a: number; f?: boolean };   // f: flickers (drawn per frame)
type Flame = { x: number; y: number; s: number; col: 'fire' | 'arcane' };
interface Scene { L: Light[]; A: Actor[]; flames: Flame[]; smokes: Pt[]; items: { x: number; y: number; col: string }[]; glints: Pt[]; steam: Pt[] }

/** A building seen from above at an angle: its roof, then the front wall with windows and a door.
 *  Returns the wall's top y. Walls: stone (default), timber (plaster and beams) or planks. */
interface HouseOpt { x: number; y: number; w: number; roofH: number; wallH: number; wall?: string; roof?: string; win?: number[]; lit?: boolean[];
  shape?: WinShape; door?: number; gable?: boolean | 'none'; chimney?: number; seed?: number; timber?: boolean; planks?: boolean; crenel?: boolean; trim?: string; shingle?: boolean }
function house(c: Ctx, z: Scene, o: HouseOpt): number {
  const { x, y, w, roofH, wallH } = o;
  const wall = o.wall ?? '#46425a', roof = o.roof ?? '#2c2f4a';
  R(c, x + 4, y + 6, w + 2, roofH + wallH, 'rgba(0,0,0,.35)');                               // its shadow on the ground
  R(c, x - 3, y, w + 6, roofH, roof);
  if (o.shingle) { for (let r = y + 3, k = 0; r < y + roofH - 2; r += 3, k++) for (let s = x - 3 + (k % 2) * 3; s < x + w + 3; s += 6) R(c, s, r, 5, 1, 'rgba(0,0,0,.25)'); }
  else {
    for (let r = y + 4; r < y + roofH - 2; r += 4) R(c, x - 3, r, w + 6, 1, 'rgba(0,0,0,.28)');
    for (let r = y + 4, k = 0; r < y + roofH - 2; r += 4, k++) for (let s = x - 3 + (k % 2) * 5; s < x + w + 3; s += 10) R(c, s, r - 3, 1, 3, 'rgba(0,0,0,.18)');
  }
  R(c, x - 3, y, w + 6, 3, 'rgba(0,0,0,.35)'); R(c, x - 3, y, w + 6, 1, o.trim ?? 'rgba(170,190,255,.22)');   // moonlight (or gold) on the ridge
  R(c, x - 3, y, 1, roofH, 'rgba(170,190,255,.12)');
  R(c, x + w * 0.7, y, w * 0.3 + 3, roofH, 'rgba(0,0,0,.14)');
  R(c, x - 3, y + roofH - 2, w + 6, 2, 'rgba(255,255,255,.08)');
  if (o.crenel) for (let s = x - 3; s < x + w; s += 9) { R(c, s, y - 5, 6, 6, roof); R(c, s, y - 5, 6, 1, 'rgba(170,190,255,.25)'); }
  if (o.chimney !== undefined) { R(c, x + o.chimney, y - 8, 8, 14, '#2c2a36'); R(c, x + o.chimney, y - 8, 1, 14, 'rgba(170,190,255,.2)'); R(c, x + o.chimney - 1, y - 9, 10, 2, '#1c1a24'); z.smokes.push([x + o.chimney + 4, y - 10]); }
  const wy = y + roofH;
  R(c, x, wy, w, wallH, wall);
  if (o.timber) {   // plaster between dark beams, braces in the panels
    for (let i = 0; i < 120; i++) R(c, x + rnd(i + x, 5) * w, wy + rnd(i, 6) * wallH, 2, 1, 'rgba(0,0,0,.08)');
    const B = '#2a1c14';
    for (let s = x; s <= x + w - 3; s += 18) R(c, s, wy, 3, wallH, B);
    R(c, x + w - 3, wy, 3, wallH, B); R(c, x, wy + Math.round(wallH * 0.45), w, 3, B); R(c, x, wy + wallH - 3, w, 3, B);
    c.strokeStyle = B; c.lineWidth = 2;
    for (let s = x; s + 18 <= x + w; s += 36) { c.beginPath(); c.moveTo(s + 3, wy + wallH * 0.45); c.lineTo(s + 18, wy + 3); c.moveTo(s + 21, wy + wallH - 3); c.lineTo(s + 33, wy + wallH * 0.45 + 3); c.stroke(); }
  } else if (o.planks) {
    for (let s = x + 4; s < x + w; s += 5) R(c, s, wy, 1, wallH, 'rgba(0,0,0,.28)');
    R(c, x, wy + Math.round(wallH * 0.5), w, 2, 'rgba(0,0,0,.25)');
  } else {
    for (let r = wy + 4, k = 0; r < wy + wallH; r += 5, k++) { R(c, x, r, w, 1, 'rgba(0,0,0,.22)'); for (let s = x + (k % 2) * 4; s < x + w; s += 8) R(c, s, r - 4, 1, 4, 'rgba(0,0,0,.14)'); }
    for (let r = wy + 3; r < wy + wallH; r += 6) { R(c, x, r, 3, 3, 'rgba(255,255,255,.07)'); R(c, x + w - 3, r + 3, 3, 3, 'rgba(255,255,255,.05)'); }
  }
  R(c, x, wy, w, 3, 'rgba(0,0,0,.35)');
  if (o.gable && o.gable !== 'none') {   // a pointed gable over the door
    const gx = x + w / 2, gw = Math.min(40, w * 0.4);
    tri(c, [gx - gw / 2, wy + 1], [gx, wy - roofH * 0.6], [gx + gw / 2, wy + 1], wall);
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx - gw / 2 - 2, wy + 1); c.lineTo(gx, wy - roofH * 0.6 - 2); c.lineTo(gx + gw / 2 + 2, wy + 1); c.stroke();
  }
  (o.win ?? []).forEach((dx, i) => win(c, z, x + dx, wy + 7, o.lit?.[i] ?? rnd((o.seed ?? 1) + i) > 0.35, o.shape ?? 'arch'));
  if (o.door !== undefined) door(c, z, x + o.door, wy + wallH - 13);
  return wy;
}
type WinShape = 'arch' | 'square' | 'round' | 'stained' | 'bars' | 'bottle';
function win(c: Ctx, z: Scene, x: number, y: number, lit: boolean, shape: WinShape) {
  const col = lit ? '#f4c25e' : '#141220';
  if (shape === 'round') { ell(c, x + 3, y + 3, 4, 4, DARK); ell(c, x + 3, y + 3, 2.6, 2.6, col); }
  else if (shape === 'stained') {   // tall, arched, coloured panes
    R(c, x - 1, y - 1, 10, 19, DARK); ell(c, x + 4, y + 3, 5, 5, DARK);
    const P = ['#d0503c', '#4a6ad0', '#e8b84a', '#4aa070', '#a058c8'];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) R(c, x + i * 4, y + 3 + j * 4, 4, 4, P[(i + j + Math.round(x)) % 5]);
    c.fillStyle = P[(Math.round(x) + 2) % 5]; c.beginPath(); c.arc(x + 4, y + 3, 4, Math.PI, 0); c.fill();
    R(c, x + 3.5, y, 1, 18, DARK); for (let j = 1; j < 4; j++) R(c, x, y + 3 + j * 4, 8, 1, DARK);
    z.L.push({ x: x + 4, y: y + 9, r: 20, col: 'warm', a: 0.55 });
    return;
  } else if (shape === 'bars') {
    R(c, x - 1, y - 1, 8, 11, DARK); R(c, x, y, 6, 9, lit ? '#a8781e' : '#141220'); R(c, x + 1, y, 1, 9, '#6a6672'); R(c, x + 4, y, 1, 9, '#6a6672');
    if (lit) z.L.push({ x: x + 3, y: y + 5, r: 14, col: 'gold', a: 0.5 });
    return;
  } else if (shape === 'bottle') {   // the inn's round bottle-glass panes
    R(c, x - 1, y - 1, 12, 12, '#2a1c14'); R(c, x, y, 10, 10, '#f0b04a');
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) ell(c, x + 2.5 + i * 5, y + 2.5 + j * 5, 1.5, 1.5, '#ffe0a0');
    R(c, x + 4.5, y, 1, 10, '#2a1c14'); R(c, x, y + 4.5, 10, 1, '#2a1c14');
    z.L.push({ x: x + 5, y: y + 5, r: 22, col: 'warm', a: 0.7 });
    return;
  } else {
    R(c, x - 1, y - 1, 8, 11, DARK);
    R(c, x, y + 2, 6, 8, col);
    if (shape === 'arch') { c.fillStyle = col; c.beginPath(); c.arc(x + 3, y + 3, 3, Math.PI, 0); c.fill(); } else R(c, x, y, 6, 2, col);
    R(c, x + 2.5, y, 1, 10, DARK); R(c, x, y + 5, 6, 1, DARK);   // the leading
  }
  if (lit) z.L.push({ x: x + 3, y: y + 5, r: 16, col: 'warm', a: 0.55 });
}
function door(c: Ctx, z: Scene, x: number, y: number, lamp = true) {
  R(c, x - 1, y - 2, 12, 15, '#1c1a24');
  c.fillStyle = '#3a2618'; c.beginPath(); c.moveTo(x, y + 13); c.lineTo(x, y + 4); c.arc(x + 5, y + 4, 5, Math.PI, 0); c.lineTo(x + 10, y + 13); c.fill();
  R(c, x + 4.5, y, 1, 13, 'rgba(0,0,0,.4)'); R(c, x + 7, y + 7, 1.5, 1.5, '#8a7a5a');
  if (lamp) { R(c, x + 12, y + 1, 3, 4, '#f4c25e'); z.L.push({ x: x + 13, y: y + 3, r: 22, col: 'warm', a: 0.7 }); }
}
/** A trade's mark, 12 x 12: on the hanging shop signs and the plots' notice boards. */
type Icon = 'eye' | 'book' | 'gavel' | 'coin' | 'scales' | 'swords' | 'anvil' | 'tankard';
function icon(c: Ctx, k: Icon, x: number, y: number) {
  const L = (x0: number, y0: number, x1: number, y1: number, col: string, w = 1.5) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  switch (k) {
    case 'eye': ell(c, x + 6, y + 6, 6, 3.6, '#120f1e'); ell(c, x + 6, y + 6, 5, 2.8, '#b58cff'); ell(c, x + 6, y + 6, 1.8, 1.8, '#2a1650'); break;
    case 'book': R(c, x, y + 2, 6, 8, '#e8dcc0'); R(c, x + 6, y + 2, 6, 8, '#d0c4a8'); R(c, x + 5.5, y + 2, 1, 8, '#5a3a28');
      for (let j = 0; j < 3; j++) { R(c, x + 1, y + 4 + j * 2, 4, 1, '#8a7a60'); R(c, x + 7, y + 4 + j * 2, 4, 1, '#8a7a60'); } R(c, x - 1, y + 10, 14, 1.5, '#7a2a2a'); break;
    case 'gavel': L(x + 2, y + 10, x + 8, y + 4, '#7a5030', 2); R(c, x + 5, y, 7, 5, '#9a6a3a'); R(c, x + 7, y, 1, 5, '#5a3a20'); R(c, x + 10, y, 1, 5, '#5a3a20'); R(c, x, y + 10, 8, 2, '#5a3a20'); break;
    case 'coin': ell(c, x + 6, y + 6, 6, 6, '#a8781e'); ell(c, x + 6, y + 6, 5, 5, '#f1b434'); ell(c, x + 6, y + 6, 2.5, 2.5, '#c88a20'); R(c, x + 3, y + 3, 2, 1, '#fff0b0'); break;
    case 'scales': R(c, x + 5.5, y, 1, 11, '#c8b070'); R(c, x + 1, y + 2, 10, 1, '#c8b070'); L(x + 1.5, y + 2, x + 1, y + 7, '#a89860', 1); L(x + 10.5, y + 2, x + 11, y + 6, '#a89860', 1);
      R(c, x - 1, y + 7, 5, 2, '#d8c080'); R(c, x + 9, y + 6, 5, 2, '#d8c080'); R(c, x + 3, y + 11, 6, 1.5, '#a89860'); break;
    case 'swords': L(x + 1, y + 1, x + 11, y + 11, '#c8ccd8'); L(x + 11, y + 1, x + 1, y + 11, '#c8ccd8'); R(c, x + 1, y + 8, 4, 1.5, GOLD); R(c, x + 7, y + 8, 4, 1.5, GOLD); break;
    case 'anvil': R(c, x + 2, y + 5, 10, 3, '#8a8a96'); R(c, x, y + 5, 3, 2, '#8a8a96'); R(c, x + 5, y + 8, 4, 2, '#6a6a76'); R(c, x + 3, y + 10, 8, 2, '#6a6a76');
      R(c, x + 7, y, 5, 3, '#9a9aa6'); L(x + 9, y + 3, x + 6, y + 5, '#7a5030', 1.2); break;
    case 'tankard': R(c, x + 2, y + 3, 7, 9, '#c8963a'); R(c, x + 1, y + 1, 9, 3, '#f0ead8'); R(c, x + 9, y + 5, 3, 1.5, '#c8963a'); R(c, x + 11, y + 5, 1.5, 4, '#c8963a'); R(c, x + 9, y + 8, 3, 1.5, '#c8963a');
      R(c, x + 2, y + 6, 7, 1, '#7a5a20'); R(c, x + 2, y + 9, 7, 1, '#7a5a20'); break;
  }
}
/** An iron bracket out from a wall with a shop sign hanging from it, lit by a small lamp. */
function hangSign(c: Ctx, z: Scene, x: number, y: number, k: Icon, dir: 1 | -1) {
  const bx = dir > 0 ? x : x - 14;
  R(c, bx, y, 14, 2, '#15131c'); R(c, dir > 0 ? x : x - 4, y + 2, 4, 1, '#15131c');
  const sx = dir > 0 ? x + 1 : x - 16;
  R(c, sx + 2, y + 2, 1, 3, '#15131c'); R(c, sx + 13, y + 2, 1, 3, '#15131c');
  R(c, sx, y + 5, 16, 16, '#24180f'); R(c, sx + 1, y + 6, 14, 14, '#4a3424'); R(c, sx + 1, y + 6, 14, 1, '#6a4e36');
  icon(c, k, sx + 2, y + 7);
  z.L.push({ x: sx + 8, y: y + 12, r: 20, col: 'warm', a: 0.75 });
}
/** A notice board on a post, on a plot: what will be built here. */
function board(c: Ctx, z: Scene, x: number, y: number, k: Icon) {
  R(c, x - 1, y - 6, 2, 12, '#3a2a1c'); R(c, x - 2, y + 5, 4, 2, 'rgba(0,0,0,.4)');
  R(c, x - 10, y - 21, 20, 16, '#24180f'); R(c, x - 9, y - 20, 18, 14, '#5a4430'); R(c, x - 9, y - 20, 18, 1, '#7a5e40');
  R(c, x - 8, y - 19, 3, 2, '#d8ccb0');                                     // a nail and a scrap of paper
  icon(c, k, x - 6, y - 19);
  z.L.push({ x, y: y - 13, r: 18, col: 'warm', a: 0.55 });
}
function sign(c: Ctx, x: number, y: number, text: string) {
  c.font = `400 10px ${FONT}`;
  const w = Math.ceil(c.measureText(text).width) + 8;
  const sx = Math.round(x - w / 2), sy = Math.round(y - 6);
  R(c, sx + 1, sy + 1, w, 13, 'rgba(0,0,0,.4)');
  R(c, sx, sy, w, 13, '#2e2018'); R(c, sx, sy, w, 1, '#4a3424'); R(c, sx, sy + 12, w, 1, '#1a120c');
}
function signText(c: Ctx, x: number, y: number, text: string, hot: boolean) {
  c.font = `400 10px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillStyle = hot ? '#fae299' : 'rgba(217,199,160,.85)';
  c.fillText(text, Math.round(x), Math.round(y + 4));
}
function deadTree(c: Ctx, x: number, y: number, s: number) {
  c.strokeStyle = '#0b0910'; c.lineCap = 'round';
  c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 22 * s); c.stroke();
  c.lineWidth = 1.5 * s;
  for (const [a, l] of [[-0.9, 14], [0.7, 12], [-0.3, 10], [1.1, 9]] as Pt[]) { c.beginPath(); c.moveTo(x, y - 14 * s); c.lineTo(x + Math.sin(a) * l * s, y - 14 * s - Math.cos(a) * l * s); c.stroke(); }
  c.lineCap = 'butt';
}
function lanternPost(c: Ctx, z: Scene, x: number, y: number) {
  R(c, x - 3, y - 1, 7, 3, 'rgba(0,0,0,.4)');
  R(c, x - 1, y - 22, 2, 22, '#15131c'); R(c, x - 2, y - 2, 4, 2, '#15131c');
  R(c, x - 3, y - 27, 6, 6, '#15131c'); R(c, x - 2, y - 26, 4, 4, '#ffd27a'); R(c, x - 4, y - 28, 8, 2, '#15131c');
  z.L.push({ x, y: y - 24, r: 56, col: 'warm', a: 0.9, f: true });
}
function brazier(c: Ctx, z: Scene, x: number, y: number, col: 'fire' | 'arcane', big = 1) {
  R(c, x - 6 * big, y, 12 * big, 3, 'rgba(0,0,0,.45)');
  R(c, x - 3, y - 10 * big, 6, 10 * big, '#2a2834'); R(c, x - 3, y - 10 * big, 1, 10 * big, 'rgba(170,190,255,.2)');
  R(c, x - 7 * big, y - 13 * big, 14 * big, 4, '#22202a'); R(c, x - 7 * big, y - 13 * big, 14 * big, 1, '#3a3648');
  z.flames.push({ x, y: y - 13 * big, s: big, col });
  z.L.push({ x, y: y - 18 * big, r: col === 'fire' ? 64 * big : 40, col, a: 0.95, f: true });
}
function gravestone(c: Ctx, x: number, y: number) {
  R(c, x - 3, y - 9, 7, 9, '#3a3648'); c.fillStyle = '#3a3648'; c.beginPath(); c.arc(x + 0.5, y - 9, 3.5, Math.PI, 0); c.fill();
  R(c, x, y - 11, 1, 5, '#211e2a'); R(c, x - 1, y - 9, 3, 1, '#211e2a'); R(c, x - 4, y, 9, 2, 'rgba(0,0,0,.4)');
}
// plot materials
function plotGround(c: Ctx, x: number, y: number, w: number, h: number) {
  R(c, x, y, w, h, '#2b251f');
  for (let i = 0; i < w * h / 30; i++) R(c, x + rnd(i + x, 3) * w, y + rnd(i + y, 4) * h, 2, 1, rnd(i, 5) > 0.5 ? '#352d25' : '#221d18');
  // stakes and string: where the walls will go
  const sx = x + 6, sy = y + 6, sw = w - 12, sh = h - 12;
  c.strokeStyle = 'rgba(220,206,170,.55)'; c.lineWidth = 1; c.strokeRect(sx + 0.5, sy + 0.5, sw, sh);
  for (const [px, py] of [[sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh], [sx + sw / 2, sy], [sx + sw / 2, sy + sh]] as Pt[]) { R(c, px - 1, py - 4, 2, 6, '#b09a6a'); R(c, px - 1, py - 4, 2, 1, '#e0d0a0'); }
}
function stones(c: Ctx, x: number, y: number, cols: number, rows: number) {
  R(c, x + 2, y + 1, cols * 9 + 2, 3, 'rgba(0,0,0,.4)');
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols - (j ? 1 : 0); i++) {
    const bx = x + i * 9 + (j ? 4 : 0), by = y - 6 - j * 6;
    R(c, bx, by, 8, 6, '#5e5a70'); R(c, bx, by, 8, 1, '#7a768c'); R(c, bx + 7, by, 1, 6, '#3e3a4c');
  }
}
function planks(c: Ctx, x: number, y: number, w: number, n = 4) {
  R(c, x + 2, y + 1, w + 2, 3, 'rgba(0,0,0,.4)');
  for (let j = 0; j < n; j++) { R(c, x + (j % 2) * 2, y - 3 - j * 3, w, 3, ['#8a6a40', '#7a5a36'][j % 2]); R(c, x + (j % 2) * 2, y - 3 - j * 3, 1, 3, '#4a3420'); }
}
function logs(c: Ctx, x: number, y: number, n: number) {
  R(c, x - 2, y, n * 7 + 4, 3, 'rgba(0,0,0,.4)');
  for (let j = 0; j < n; j++) for (let i = 0; i < n - j; i++) { const lx = x + 3 + i * 7 + j * 3.5, ly = y - 3 - j * 6; ell(c, lx, ly, 3.5, 3.5, '#5a4028'); ell(c, lx, ly, 2.4, 2.4, '#a8864a'); R(c, lx, ly, 1, 1, '#5a4028'); }
}
function crate(c: Ctx, x: number, y: number, w: number, h: number, col = '#6a4a30') {
  R(c, x + 2, y + h - 1, w, 3, 'rgba(0,0,0,.4)');
  R(c, x, y, w, h, col); R(c, x, y, w, 2, 'rgba(255,255,255,.14)'); R(c, x, y, 1, h, '#3a2818'); R(c, x + w - 1, y, 1, h, '#3a2818'); R(c, x, y + h - 1, w, 1, '#3a2818');
  c.strokeStyle = '#3a2818'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 1, y + 2); c.lineTo(x + w - 1, y + h - 1); c.stroke();
}
function barrel(c: Ctx, x: number, y: number, s = 1) {
  R(c, x - 4 * s, y - 1, 9 * s, 2, 'rgba(0,0,0,.4)');
  R(c, x - 4 * s, y - 10 * s, 8 * s, 10 * s, '#5a3a22'); R(c, x - 4 * s, y - 10 * s, 2, 10 * s, 'rgba(255,255,255,.1)');
  R(c, x - 4 * s, y - 8 * s, 8 * s, 1, '#22160e'); R(c, x - 4 * s, y - 3 * s, 8 * s, 1, '#22160e');
  ell(c, x, y - 10 * s, 4 * s, 1.6 * s, '#7a5434');
}
function workLamp(c: Ctx, z: Scene, x: number, y: number) {
  R(c, x, y - 14, 2, 14, '#3a2a1c'); R(c, x - 2, y - 19, 6, 5, '#15131c'); R(c, x - 1, y - 18, 4, 3, '#ffd27a');
  z.L.push({ x: x + 1, y: y - 17, r: 32, col: 'warm', a: 0.75, f: true });
}

// ---------- the services ----------
function appraiser(c: Ctx, z: Scene) {
  // a crooked arcane tower: crystal on the spire, the eye, star banners, a telescope; a curio shop at its foot
  const awy = house(c, z, { x: 10, y: 84, w: 48, roofH: 24, wallH: 28, roof: '#2c1f48', door: 30, seed: 3 });
  R(c, 15, awy + 7, 16, 13, DARK); R(c, 16, awy + 8, 14, 11, '#2a1840');      // the shop window: a crystal ball on a stand
  ell(c, 23, awy + 13, 4, 4, '#b58cff'); ell(c, 22, awy + 12, 1.5, 1.5, '#f0e0ff'); R(c, 20, awy + 17, 6, 2, GOLD);
  z.L.push({ x: 23, y: awy + 13, r: 22, col: 'arcane', a: 0.8 });
  hangSign(c, z, 58, awy + 2, 'eye', 1);
  crate(c, 12, 128, 12, 8, '#4a2a3a'); R(c, 16, 127, 4, 2, '#7ad0ff');
  const tx = 84, tw = 36, ty = 48, base = 136, cx = tx + tw / 2;
  R(c, tx + 4, ty + 6, tw, base - ty, 'rgba(0,0,0,.35)');
  R(c, tx, ty, tw, base - ty, '#4a4560');
  R(c, tx, ty, 4, base - ty, 'rgba(255,255,255,.09)'); R(c, tx + 4, ty, 5, base - ty, 'rgba(255,255,255,.04)'); R(c, tx + tw - 9, ty, 9, base - ty, 'rgba(0,0,0,.25)');
  for (let r = ty + 5, k = 0; r < base; r += 5, k++) { R(c, tx, r, tw, 1, 'rgba(0,0,0,.2)'); for (let s = tx + (k % 2) * 5; s < tx + tw; s += 10) R(c, s, r - 4, 1, 4, 'rgba(0,0,0,.12)'); }
  for (let mx = tx - 2; mx < tx + tw; mx += 7) { R(c, mx, ty - 5, 5, 6, '#4a4560'); R(c, mx, ty - 5, 5, 1, 'rgba(170,190,255,.25)'); }
  R(c, tx - 2, ty, tw + 4, 3, '#3a3550');
  // the spire, violet slate, and a gold finial holding the crystal (the crystal glows, drawn per frame)
  tri(c, [tx - 4, ty - 4], [cx, 14], [tx + tw + 4, ty - 4], '#2c2350');
  tri(c, [cx, 14], [tx + tw + 4, ty - 4], [cx + 4, ty - 4], 'rgba(0,0,0,.3)');
  c.strokeStyle = 'rgba(170,190,255,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx - 4, ty - 4); c.lineTo(cx, 14); c.stroke();
  for (let r = 22; r < ty - 4; r += 5) { const k = (r - 14) / (ty - 18); R(c, cx - k * (tw / 2 + 4), r, k * (tw + 8), 1, 'rgba(0,0,0,.2)'); }
  R(c, cx - 1, 9, 2, 6, GOLD);
  for (const bx of [tx + 2, tx + tw - 10]) {   // star banners
    R(c, bx, 84, 8, 18, '#1e2a5a'); tri(c, [bx, 102], [bx + 4, 98], [bx + 8, 102], '#1e2a5a'); R(c, bx, 84, 8, 1, GOLD);
    R(c, bx + 3, 88, 2, 2, '#f4d27a'); R(c, bx + 5, 93, 1, 1, '#f4d27a'); R(c, bx + 2, 95, 1, 1, '#f4d27a');
  }
  ell(c, cx, 70, 10, 6.5, '#120f1e'); ell(c, cx, 70, 8, 4.5, '#b58cff'); ell(c, cx, 70, 2.4, 2.4, '#2a1650');   // the eye
  z.L.push({ x: cx, y: 70, r: 36, col: 'arcane', a: 0.85 });
  // a balcony with a brass telescope aimed at the sky
  R(c, tx - 10, 100, 10, 2, '#2a2638'); R(c, tx - 10, 96, 1, 6, '#2a2638');
  c.strokeStyle = '#c8963a'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx - 1, 97); c.lineTo(tx - 13, 88); c.stroke();
  R(c, tx - 16, 86, 3, 3, '#e8c070');
  win(c, z, cx - 3, 106, true, 'arch');
  door(c, z, cx - 5, base - 13, false);
  // a rune circle glowing on the street at its door: the appraiser works standing in it
  c.strokeStyle = 'rgba(181,140,255,.6)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx + 4, 143, 16, 4.5, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.ellipse(cx + 4, 143, 10, 2.8, 0, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; R(c, cx + 4 + Math.cos(a) * 16 - 1, 143 + Math.sin(a) * 4.5 - 1, 2, 2, '#d8c0ff'); }
  z.L.push({ x: cx + 4, y: 142, r: 28, col: 'arcane', a: 0.65 });
  z.A.push(P('scholar', cx, 143, 1, 'book'), P('noble', cx + 12, 144, -1, 'orb'));
}
function auction(c: Ctx, z: Scene) {
  // a pale guildhall with a columned porch, a gold coin in the pediment, lots on pedestals, a bell tower
  R(c, 500, 30, 22, 48, '#5c586e'); for (let r = 34; r < 78; r += 5) R(c, 500, r, 22, 1, 'rgba(0,0,0,.2)');
  tri(c, [496, 32], [511, 4], [526, 32], '#3a1c28'); c.strokeStyle = 'rgba(170,190,255,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(496, 32); c.lineTo(511, 4); c.stroke();
  R(c, 505, 40, 12, 12, '#141220'); c.fillStyle = '#b8902a'; c.beginPath(); c.arc(511, 49, 4, Math.PI, 0); c.fill(); R(c, 507, 49, 8, 2, '#b8902a');
  const wy = house(c, z, { x: 412, y: 58, w: 114, roofH: 30, wallH: 48, wall: '#5c586e', roof: '#3a1c28', trim: GOLD, win: [4, 102], lit: [true, true], seed: 7 });
  // the pediment over the porch, a coin in it
  tri(c, [440, wy + 6], [469, wy - 18], [498, wy + 6], '#6a667e'); tri(c, [444, wy + 4], [469, wy - 14], [494, wy + 4], '#5c586e');
  R(c, 438, wy + 4, 62, 3, '#7a768e'); R(c, 438, wy + 4, 62, 1, GOLD);
  icon(c, 'coin', 463, wy - 10); z.L.push({ x: 469, y: wy - 4, r: 18, col: 'gold', a: 0.6 });
  // columns and steps
  for (const cx of [440, 452, 482, 494]) { R(c, cx + 2, wy + 7, 6, 42, 'rgba(0,0,0,.25)'); R(c, cx, wy + 7, 6, 40, '#8e8aa4'); R(c, cx, wy + 7, 2, 40, '#a8a4bc'); R(c, cx - 1, wy + 7, 8, 3, '#a8a4bc'); R(c, cx - 1, wy + 44, 8, 3, '#7a768e'); }
  R(c, 459, wy + 16, 20, 32, DARK); c.fillStyle = '#4a2a1a'; c.beginPath(); c.moveTo(461, wy + 48); c.lineTo(461, wy + 26); c.arc(469, wy + 26, 8, Math.PI, 0); c.lineTo(477, wy + 48); c.fill();
  R(c, 468.5, wy + 18, 1, 30, 'rgba(0,0,0,.4)'); R(c, 465, wy + 34, 2, 2, GOLD); R(c, 471, wy + 34, 2, 2, GOLD);
  z.L.push({ x: 469, y: wy + 30, r: 30, col: 'warm', a: 0.75 });
  for (const bx of [422, 508]) { R(c, bx, wy + 10, 9, 22, '#4a1e5a'); tri(c, [bx, wy + 32], [bx + 4.5, wy + 27], [bx + 9, wy + 32], '#4a1e5a'); R(c, bx, wy + 10, 9, 1, GOLD); icon(c, 'coin', bx - 1.5, wy + 14); }
  R(c, 434, 132, 70, 3, '#7a768e'); R(c, 430, 135, 78, 3, '#6a667e');
  // lots on pedestals: they glow in their rarity colour
  for (const [px, col] of [[416, '#b98cff'], [520, '#ff9a4d']] as [number, string][]) {
    R(c, px - 4, 122, 8, 14, '#8e8aa4'); R(c, px - 5, 120, 10, 3, '#a8a4bc'); R(c, px - 5, 134, 10, 2, '#6a667e');
    z.items.push({ x: px, y: 114, col });
  }
  hangSign(c, z, 412, wy + 4, 'gavel', -1);
  z.A.push(P('noble', 469, 136, 1, 'gavel', 'raise'),
    P('folk', 436, 143, 1, 'paddle'), P('lady', 447, 144, 1, 'paddle'), P('noble', 491, 144, -1, 'paddle'), P('knight', 502, 143, -1, 'paddle'), P('rogue', 424, 141, 1));
}
function merchant(c: Ctx, z: Scene) {
  // a wooden shopfront with a striped awning, goods on the counter, two market stalls on the plaza
  const wy = house(c, z, { x: 446, y: 184, w: 80, roofH: 30, wallH: 44, roof: '#3a2620', wall: '#4e4036', planks: true, chimney: 62, seed: 11, shingle: true });
  R(c, 452, wy + 9, 30, 18, DARK); R(c, 453, wy + 10, 28, 16, '#f4c25e');                       // the shop window, full of bottles
  for (let i = 0; i < 6; i++) { const col = ['#d04a4a', '#4a8ad0', '#4ab070', '#b58cff', '#e8b84a', '#d07a3a'][i]; R(c, 455 + i * 4.3, wy + 16, 3, 7, col); R(c, 456 + i * 4.3, wy + 14, 1, 2, col); }
  R(c, 453, wy + 23, 28, 1, '#5a4030'); z.L.push({ x: 467, y: wy + 17, r: 32, col: 'warm', a: 0.8 });
  door(c, z, 494, wy + 31);
  for (let i = 0; i < 7; i++) R(c, 444 + i * 12, wy - 2, 12, 10, i % 2 ? '#e8dcc0' : '#a83a3a');   // the awning, scalloped
  for (let i = 0; i < 14; i++) { c.fillStyle = (Math.floor(i / 2) % 2) ? '#e8dcc0' : '#a83a3a'; c.beginPath(); c.arc(447 + i * 6, wy + 8, 3, 0, Math.PI); c.fill(); }
  R(c, 444, wy - 2, 84, 1, 'rgba(255,255,255,.2)');
  // the counter: apples, pears, potions, cloth, sacks
  R(c, 448, 248, 42, 10, '#6a4a30'); R(c, 448, 248, 42, 2, '#8a6a40'); R(c, 450, 258, 38, 2, 'rgba(0,0,0,.4)');
  for (let i = 0; i < 9; i++) ell(c, 452 + i * 2.6, 246 - (i % 3), 1.6, 1.6, i % 2 ? '#d04a3a' : '#c8b040');
  for (let i = 0; i < 4; i++) { R(c, 476 + i * 3, 242, 2, 6, ['#4a8ad0', '#b58cff', '#4ab070', '#d04a4a'][i]); }
  ell(c, 512, 254, 5, 3, '#8a7a5a'); ell(c, 520, 256, 5, 3, '#7a6a4a'); barrel(c, 516, 248);
  hangSign(c, z, 446, wy + 2, 'scales', -1);
  stall(c, z, 404, 204, '#3a5aa0', 0); stall(c, z, 404, 244, '#3a7a4a', 1);
  z.A.push(P('merchant', 470, 246, 1), P('lady', 456, 266, 1), P('merchant', 434, 202, -1), P('folk', 434, 242, -1),
    P('folk', 396, 212, 1, 'crate'), P('kid', 396, 252, 1));
}
function stall(c: Ctx, z: Scene, x: number, y: number, col: string, k: number) {
  R(c, x + 2, y + 1, 30, 3, 'rgba(0,0,0,.4)');
  R(c, x, y - 8, 28, 8, '#5a4030'); R(c, x, y - 8, 28, 2, '#7a5a3a');                       // the table
  R(c, x + 1, y - 26, 2, 26, WOOD); R(c, x + 25, y - 26, 2, 26, WOOD);
  for (let i = 0; i < 4; i++) R(c, x - 2 + i * 8, y - 30, 8, 7, i % 2 ? '#e8dcc0' : col);   // a striped canopy
  R(c, x - 2, y - 30, 32, 1, 'rgba(255,255,255,.2)');
  const goods = k ? ['#c8b040', '#d04a3a', '#c8b040', '#4ab070'] : ['#e8dcc0', '#4a8ad0', '#d07a3a', '#a058c8'];
  goods.forEach((g, i) => (k ? ell(c, x + 5 + i * 6, y - 10, 2.5, 2, g) : R(c, x + 3 + i * 6, y - 13, 5, 4, g)));
  R(c, x + 26, y - 23, 3, 4, '#ffd27a'); z.L.push({ x: x + 27, y: y - 21, r: 26, col: 'warm', a: 0.8, f: true });
}
function forge(c: Ctx, z: Scene) {
  // a stone smithy with its hearth open to the street, a lean-to over the anvil, scrap heaped up to be broken down
  R(c, 420, 270, 16, 38, '#3a3648'); R(c, 420, 270, 1, 38, 'rgba(170,190,255,.25)'); R(c, 418, 268, 20, 4, '#24222e');
  z.smokes.push([428, 266], [428, 262]);
  const wy = house(c, z, { x: 360, y: 300, w: 80, roofH: 30, wallH: 48, roof: '#2a2228', seed: 13 });
  R(c, 368, wy + 12, 44, 36, DARK); c.fillStyle = DARK; c.beginPath(); c.arc(390, wy + 14, 22, Math.PI, 0); c.fill();   // the hearth
  R(c, 371, wy + 18, 38, 30, '#ff7420'); c.fillStyle = '#ff7420'; c.beginPath(); c.arc(390, wy + 18, 19, Math.PI, 0); c.fill();
  R(c, 376, wy + 28, 28, 20, '#ffb040'); R(c, 382, wy + 36, 16, 12, '#ffe090');
  for (let i = 0; i < 8; i++) R(c, 374 + i * 4, wy + 44, 3, 2, i % 2 ? '#ff4a10' : '#3a1a10');                // coals
  z.L.push({ x: 390, y: wy + 30, r: 74, col: 'fire', a: 0.95, f: true });
  for (const [fx0, fs] of [[380, 0.8], [390, 1.1], [401, 0.75]] as Pt[]) z.flames.push({ x: fx0, y: wy + 44, s: fs, col: 'fire' });
  hangSign(c, z, 360, wy + 2, 'anvil', -1);
  // the lean-to: a shingled roof on posts, tools on the back wall, the scrap heap, the anvil, a quench barrel
  R(c, 440, 336, 86, 22, '#1e1a22');
  for (const [tx, h] of [[452, 10], [460, 8], [468, 12], [500, 9], [508, 11]] as Pt[]) { R(c, tx, 340, 1, h, '#6a6a76'); R(c, tx - 1, 340 + h, 3, 3, '#7a7a86'); }
  c.fillStyle = '#4a3424'; c.beginPath(); c.moveTo(436, 336); c.lineTo(440, 318); c.lineTo(530, 318); c.lineTo(530, 336); c.fill();
  for (let r = 321; r < 336; r += 3) R(c, 438, r, 92, 1, 'rgba(0,0,0,.3)');
  R(c, 436, 336, 94, 2, '#2a1c14'); R(c, 438, 318, 92, 1, 'rgba(170,190,255,.2)');
  R(c, 442, 338, 3, 42, WOOD); R(c, 524, 338, 3, 42, WOOD);
  // scrap: broken blades, dented helms, split shields
  for (let i = 0; i < 9; i++) { const sx = 450 + rnd(i, 7) * 22, sy = 362 + rnd(i, 8) * 12; R(c, sx, sy, 8, 2, '#8a8e9a'); R(c, sx, sy, 8, 1, '#b8bcc8'); }
  for (const [hx, hy] of [[454, 368], [468, 372], [460, 376]] as Pt[]) { c.fillStyle = '#6a6e7a'; c.beginPath(); c.arc(hx, hy, 4, Math.PI, 0); c.fill(); R(c, hx - 4, hy, 8, 1, '#4a4e5a'); }
  for (const [hx, hy, col] of [[448, 376, '#7a3a2a'], [474, 366, '#5a4a2a']] as [number, number, string][]) { c.fillStyle = col; c.beginPath(); c.arc(hx, hy, 5, Math.PI, 0); c.fill(); R(c, hx - 1, hy - 5, 2, 5, GOLD); }
  R(c, 488, 368, 18, 4, '#3a3a46'); R(c, 484, 368, 5, 2, '#3a3a46'); R(c, 493, 372, 8, 4, '#2a2a34'); R(c, 490, 376, 14, 3, '#2a2a34'); R(c, 488, 368, 18, 1, '#6a6a76');   // the anvil
  barrel(c, 516, 378); ell(c, 516, 368, 4, 1.6, '#2a4a6a'); z.steam.push([516, 366]);
  z.A.push(P('smith', 482, 380, 1, 'hammer', 'hammer'));
}
function portal(c: Ctx, z: Scene) {
  // the crypt cut into the cliff: steps, a pointed arch of black stone with teeth, skulls, chains, violet braziers
  tri(c, [262, 26], [334, -10], [406, 26], '#151220');
  for (let i = 0; i < 3; i++) R(c, 302 - i * 4, 112 + i * 4, 64 + i * 8, 4, ['#2a2734', '#322e3e', '#3a3648'][i]);
  const arch = (o: number) => { c.beginPath(); c.moveTo(288 + o, 114); c.lineTo(288 + o, 52); c.quadraticCurveTo(288 + o, 18 + o, 334, 4 + o * 1.3); c.quadraticCurveTo(380 - o, 18 + o, 380 - o, 52); c.lineTo(380 - o, 114); c.closePath(); };
  c.fillStyle = '#2a2638'; arch(0); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(334, 4); c.quadraticCurveTo(380, 18, 380, 52); c.lineTo(380, 114); c.lineTo(366, 114); c.lineTo(366, 52); c.fill();
  for (let a = 0; a < 9; a++) { const t = a / 8, px = 288 + t * 92, py = 52 - Math.sin(t * Math.PI) * 44; tri(c, [px - 4, py + 2], [px, py - 9], [px + 4, py + 2], '#3a3550'); }
  c.fillStyle = '#05030a'; arch(10); c.fill();                       // the opening (the vortex is drawn per frame)
  for (const sx of [292, 368]) { ell(c, sx + 4, 62, 4, 4, '#c7b18c'); R(c, sx + 2, 62, 2, 2, '#100d18'); R(c, sx + 5, 62, 2, 2, '#100d18'); R(c, sx + 2, 65, 5, 2, '#aa8667'); }
  c.strokeStyle = '#2a2a32'; c.lineWidth = 1.5; for (const sx of [294, 374]) { c.beginPath(); c.moveTo(sx, 70); c.quadraticCurveTo(sx + (sx < 334 ? 6 : -6), 92, sx, 108); c.stroke(); }
  brazier(c, z, 279, 110, 'arcane'); brazier(c, z, 389, 110, 'arcane');
  for (const [gx, gy] of [[266, 56], [278, 66], [270, 84], [396, 58], [400, 80]] as Pt[]) gravestone(c, gx, gy);
  // a rune ring on the court's flagstones, torches at its corners, a board where parties gather
  c.strokeStyle = 'rgba(181,140,255,.45)'; c.lineWidth = 2; c.beginPath(); c.ellipse(334, 130, 40, 6, 0, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; R(c, 334 + Math.cos(a) * 40 - 1, 130 + Math.sin(a) * 6 - 1, 3, 2, '#d8c0ff'); }
  z.L.push({ x: 334, y: 128, r: 48, col: 'arcane', a: 0.6 });
  for (const tx of [266, 402]) { R(c, tx - 3, 135, 7, 3, 'rgba(0,0,0,.45)'); R(c, tx - 1, 116, 2, 20, '#3a2a1c'); R(c, tx - 2, 114, 4, 3, '#2a2a34'); z.flames.push({ x: tx, y: 114, s: 0.8, col: 'fire' }); z.L.push({ x: tx, y: 110, r: 54, col: 'fire', a: 0.9, f: true }); }
}
function fountain(c: Ctx, z: Scene) {
  ell(c, FX + 3, FY + 6, 42, 25, 'rgba(0,0,0,.35)');
  ell(c, FX, FY, 42, 25, '#6a6684'); ell(c, FX, FY - 1, 42, 24, '#5a5674'); ell(c, FX, FY - 1, 37, 20, '#2a2834');
  R(c, FX - 42, FY - 1, 1, 2, 'rgba(255,255,255,.2)');
  z.L.push({ x: FX, y: FY, r: 96, col: 'warm', a: 0.65 });
  for (const [x0, x1, y0, sag] of [[246, 422, 160, 12], [246, 422, 250, 6]] as [number, number, number, number][]) {
    c.strokeStyle = '#15131c'; c.lineWidth = 1; c.beginPath();
    for (let x = x0; x <= x1; x += 4) { const u = (x - x0) / (x1 - x0), y = y0 + sag * 4 * u * (1 - u); if (x === x0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
    for (let x = x0 + 8, i = 0; x < x1 - 4; x += 11, i++) {
      const u = (x - x0) / (x1 - x0), y = y0 + sag * 4 * u * (1 - u) + 1;
      R(c, x - 1, y, 3, 3, ['#ffd27a', '#ffb070', '#fff0b0'][i % 3]);
      z.L.push({ x, y: y + 1, r: 16, col: 'warm', a: 0.55 });
    }
  }
  // the plaza's brightest lights: four fire bowls, two at the top corners, two flanking the avenue
  for (const [bx, by] of [[250, 172], [418, 172], [296, 258], [372, 258]] as Pt[]) brazier(c, z, bx, by, 'fire', 1.2);
}
// ---------- the four plots: cleared ground with materials and a clue at level 0, then the building grows ----------
function library(c: Ctx, z: Scene, lv: number) {
  if (!lv) {
    plotGround(c, 160, 70, 96, 66);
    stones(c, 168, 126, 3, 2); planks(c, 196, 132, 30);
    crate(c, 226, 104, 14, 11); crate(c, 236, 114, 14, 11);                                   // crates of books
    for (let i = 0; i < 5; i++) { R(c, 228 + i * 2.4, 101, 2, 4, ['#7a2a2a', '#2a4a7a', '#2a6a3a', '#7a5a2a', '#4a2a6a'][i]); R(c, 238 + i * 2.4, 111, 2, 4, ['#2a4a7a', '#7a2a2a', '#7a5a2a', '#2a6a3a', '#4a2a6a'][i]); }
    for (let i = 0; i < 4; i++) { ell(c, 212 + i * 4, 124 - (i % 2) * 2, 2, 2, '#e8dcc0'); R(c, 210 + i * 4, 122 - (i % 2) * 2, 4, 1, '#c8b890'); }   // scrolls
    R(c, 178, 86, 12, 14, '#6a5a7a'); tri(c, [176, 86], [184, 80], [192, 86], '#6a5a7a'); R(c, 182, 100, 4, 4, WOOD);   // a lectern under a cloth
    board(c, z, 246, 92, 'book'); workLamp(c, z, 164, 104);
    z.A.push(P('scholar', 222, 134, -1, 'book'));
    return;
  }
  if (lv >= 2) {   // a clock tower
    R(c, 166, 24, 22, 48, '#4a4660'); for (let r = 28; r < 72; r += 5) R(c, 166, r, 22, 1, 'rgba(0,0,0,.2)');
    tri(c, [162, 26], [177, 2], [192, 26], '#1c2a36'); c.strokeStyle = 'rgba(170,190,255,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(162, 26); c.lineTo(177, 2); c.stroke();
    ell(c, 177, 42, 7, 7, '#2a2834'); ell(c, 177, 42, 5.5, 5.5, '#e8dcb0'); R(c, 176.5, 38, 1, 4.5, '#2a2834'); R(c, 177, 41.5, 3.5, 1, '#2a2834');
    z.L.push({ x: 177, y: 42, r: 18, col: 'warm', a: 0.6 });
  }
  if (lv >= 3) {   // an observatory dome full of stars
    ell(c, 236, 66, 18, 18, '#2a3a5a'); R(c, 216, 66, 40, 18, '#2a3a5a');
    c.fillStyle = '#0a0e24'; c.beginPath(); c.moveTo(232, 50); c.lineTo(240, 50); c.lineTo(242, 70); c.lineTo(230, 70); c.fill();
    c.strokeStyle = '#c8963a'; c.lineWidth = 3; c.beginPath(); c.moveTo(236, 62); c.lineTo(248, 44); c.stroke();
    R(c, 216, 66, 40, 2, '#3a4a6a'); z.L.push({ x: 236, y: 60, r: 40, col: 'cold', a: 0.7 });
    z.glints.push([226, 58], [244, 56], [232, 54]);
  }
  const wy = house(c, z, { x: 162, y: 66, w: 92, roofH: 34, wallH: 36, roof: '#1c2a36', gable: true, seed: 29 });
  for (const wx of [168, 182, 228, 242]) win(c, z, wx, wy + 7, true, 'stained');
  icon(c, 'book', 202, wy - 13); z.L.push({ x: 208, y: wy - 8, r: 18, col: 'warm', a: 0.5 });
  door(c, z, 203, wy + 23);
  for (const [bx, n] of [[190, 4], [218, 3]] as Pt[]) for (let i = 0; i < n; i++) R(c, bx + (i % 2), 132 - i * 2, 8, 2, ['#7a2a2a', '#2a4a7a', '#2a6a3a', '#7a5a2a'][i]);
  hangSign(c, z, 162, wy + 2, 'book', -1);
  z.A.push(P('scholar', 236, 142, -1, 'book'), P('mage', 182, 142, 1, 'book'));
  if (lv >= 3) z.A.push(P('scholar', 248, 143, -1, 'book'));
}
function treasury(c: Ctx, z: Scene, lv: number) {
  if (!lv) {
    plotGround(c, 556, 74, 104, 62);
    R(c, 566, 92, 3, 34, WOOD); R(c, 586, 92, 3, 34, WOOD); R(c, 566, 92, 23, 3, WOOD);       // a vault door leaning on a frame
    R(c, 568, 98, 20, 28, '#3a3842'); for (const dy of [104, 112, 120]) R(c, 568, dy, 20, 2, IRON);
    ell(c, 578, 112, 4, 4, '#a8781e'); ell(c, 578, 112, 2, 2, '#3a3842');
    for (const [cx, cy] of [[598, 128], [614, 128], [606, 118]] as Pt[]) { crate(c, cx, cy - 8, 14, 9, '#4a3020'); R(c, cx, cy - 6, 14, 1, GOLD); R(c, cx + 6, cy - 5, 2, 3, GOLD); }   // strongboxes
    for (let i = 0; i < 6; i++) R(c, 628, 128 - i * 1.5, 22, 1, i % 2 ? '#7a7a86' : '#5a5a66');   // iron bars
    stones(c, 630, 112, 3, 2); board(c, z, 652, 96, 'coin'); workLamp(c, z, 560, 104);
    z.A.push(P('guard', 622, 134, -1, 'spear'));
    return;
  }
  if (lv >= 3) { ell(c, 609, 58, 16, 16, '#c88a20'); R(c, 593, 58, 32, 6, '#c88a20'); R(c, 600, 46, 4, 3, '#ffe090'); R(c, 608, 40, 2, 6, GOLD); z.L.push({ x: 609, y: 52, r: 36, col: 'gold', a: 0.7 }); }
  const wy = house(c, z, { x: 560, y: 60, w: 98, roofH: 22, wallH: 54, wall: '#3c3846', roof: '#24202e', crenel: true, trim: lv >= 2 ? GOLD : undefined, seed: 31 });
  for (const bx of [558, 582, 632, 654]) { R(c, bx, wy, 6, 54, '#46424f'); R(c, bx, wy, 1, 54, 'rgba(255,255,255,.08)'); R(c, bx + 5, wy, 1, 54, 'rgba(0,0,0,.3)'); }
  for (const wx of [570, 644]) win(c, z, wx, wy + 10, true, 'bars');
  R(c, 596, wy + 20, 26, 34, DARK); R(c, 598, wy + 22, 22, 32, '#2e2a30');
  for (const dy of [27, 36, 45]) { R(c, 598, wy + dy, 22, 2, IRON); for (let s = 600; s < 620; s += 5) R(c, s, wy + dy, 1.5, 1.5, '#8a8692'); }
  ell(c, 609, wy + 38, 3, 3, '#f1a934');
  icon(c, 'coin', 603, wy + 5); z.L.push({ x: 609, y: wy + 11, r: 18, col: 'gold', a: 0.6 });
  if (lv >= 2) {
    for (const cx of [590, 624]) { R(c, cx, wy + 4, 5, 50, '#5a5662'); R(c, cx - 1, wy + 2, 7, 3, GOLD); R(c, cx - 1, wy + 51, 7, 3, GOLD); }
    R(c, 560, wy, 98, 2, GOLD);
  }
  if (lv >= 3) { brazier(c, z, 584, 136, 'fire'); brazier(c, z, 634, 136, 'fire'); z.glints.push([576, wy + 16], [650, wy + 16], [609, 46]); }
  hangSign(c, z, 560, wy + 2, 'coin', -1);
  z.A.push(P('guard', 591, 140, 1, 'spear'), P('guard', 627, 140, -1, 'spear'));
}
function training(c: Ctx, z: Scene, lv: number) {
  if (!lv) {
    plotGround(c, 160, 292, 150, 86);
    logs(c, 170, 366, 3); planks(c, 200, 372, 26, 3);
    R(c, 232, 360, 18, 6, '#a8864a'); ell(c, 252, 362, 4, 4, '#a8864a'); R(c, 226, 362, 6, 2, WOOD);   // a straw dummy on its back
    crate(c, 262, 346, 18, 12); for (let i = 0; i < 4; i++) { R(c, 265 + i * 4, 340, 1, 7, '#a8864a'); R(c, 264 + i * 4, 344, 3, 1, WOOD); }   // practice swords
    ell(c, 188, 342, 9, 9, '#e8dcc0'); ell(c, 188, 342, 6.5, 6.5, '#b83a3a'); ell(c, 188, 342, 4, 4, '#e8dcc0'); ell(c, 188, 342, 1.8, 1.8, '#b83a3a');   // a target leaning on the logs
    ell(c, 292, 368, 12, 5, '#6a5a40'); ell(c, 292, 366, 8, 3, '#7a6a4a');   // sand for the yard
    board(c, z, 298, 322, 'swords'); workLamp(c, z, 166, 320);
    return;
  }
  const yy = lv >= 2 ? 340 : 296;
  if (lv >= 2) {   // barracks with a banner
    house(c, z, { x: 164, y: 290, w: 66, roofH: 20, wallH: 26, roof: '#2a2420', win: [8, 48], lit: [true, true], door: 28, seed: 17 });
    R(c, 194, 292, 1, 12, '#8a82a0'); R(c, 195, 292, 9, 6, '#852e30');
  }
  // the yard: packed sand inside a fence
  R(c, 160, yy, 150, 378 - yy, '#3a3326'); for (let i = 0; i < 90; i++) R(c, 160 + rnd(i, 21) * 150, yy + rnd(i, 22) * (378 - yy), 2, 1, '#463d2e');
  if (lv >= 2) R(c, 232, 296, 78, 44, '#3a3326');
  c.strokeStyle = WOOD; c.lineWidth = 2; c.strokeRect(161, lv >= 2 ? 297 : yy + 1, 148, 378 - (lv >= 2 ? 297 : yy) - 1);
  for (let s = 160; s <= 310; s += 10) { if (s > 222 && s < 246) continue; R(c, s, 375, 2, 6, WOOD); }
  // the gate: two posts with the crossed-swords banner, torches
  for (const gx of [222, 246]) { R(c, gx, 360, 4, 22, WOOD); z.flames.push({ x: gx + 2, y: 358, s: 0.7, col: 'fire' }); z.L.push({ x: gx + 2, y: 354, r: 40, col: 'fire', a: 0.85, f: true }); }
  R(c, 226, 362, 20, 14, '#6a2a2a'); R(c, 226, 362, 20, 1, GOLD); icon(c, 'swords', 230, 363);
  // straw dummies, archery targets, a weapon rack, a sparring ring
  for (const dx of lv >= 2 ? [172, 196] : [176, 200]) { const dy = lv >= 2 ? 352 : 330; R(c, dx, dy, 2, 18, WOOD); R(c, dx - 7, dy + 4, 16, 2, WOOD); ell(c, dx + 1, dy - 2, 5, 5, '#a8864a'); R(c, dx - 3, dy + 4, 8, 10, '#a8864a'); R(c, dx - 1, dy - 3, 2, 1, '#5a4028'); }
  for (const tx of [280, 300]) { const ty = 312; R(c, tx - 1, ty, 2, 14, WOOD); ell(c, tx, ty, 7, 7, '#e8dcc0'); ell(c, tx, ty, 5, 5, '#b83a3a'); ell(c, tx, ty, 3, 3, '#e8dcc0'); ell(c, tx, ty, 1.4, 1.4, '#b83a3a'); R(c, tx - 3, ty - 2, 4, 1, '#7a5a36'); }
  R(c, 240, 306, 22, 2, WOOD); R(c, 240, 318, 22, 2, WOOD); for (let i = 0; i < 5; i++) R(c, 242 + i * 4, 300, 1, 18, i % 2 ? '#b8bcc8' : '#7a5a36');
  c.strokeStyle = 'rgba(232,220,192,.35)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(270, 352, 20, 9, 0, 0, Math.PI * 2); c.stroke();
  if (lv >= 3) {   // a watchtower
    R(c, 294, 268, 18, 72, 'rgba(0,0,0,.35)'); R(c, 290, 266, 18, 74, '#4a4660'); R(c, 290, 266, 2, 74, 'rgba(255,255,255,.08)'); for (let r = 270; r < 340; r += 5) R(c, 290, r, 18, 1, 'rgba(0,0,0,.2)');
    R(c, 284, 258, 30, 8, WOOD); R(c, 284, 258, 30, 1, '#8a6a40'); R(c, 285, 244, 2, 14, WOOD); R(c, 311, 244, 2, 14, WOOD);
    tri(c, [281, 246], [299, 232], [317, 246], '#3a2420'); R(c, 281, 245, 36, 2, '#24160e');
    R(c, 298, 220, 1, 13, '#8a82a0'); R(c, 299, 220, 12, 7, '#852e30'); R(c, 299, 220, 12, 1, GOLD); win(c, z, 296, 290, true, 'arch');
    R(c, 296, 254, 2, 4, WOOD); z.flames.push({ x: 297, y: 254, s: 0.6, col: 'fire' }); z.L.push({ x: 297, y: 250, r: 40, col: 'fire', a: 0.85, f: true });
  }
  z.A.push(P('knight', 262, 356, 1, 'shield', 'spar'), P('rogue', 278, 356, -1, 'sword', 'spar'));
  if (lv >= 2) z.A.push(P('archer', 256, 330, 1, 'bow'), P('knight', 214, 372, 1, 'sword', 'cheer'));
  if (lv >= 3) z.A.push(P('knight', 184, 372, 1, 'shield', 'spar'), P('guard', 198, 372, -1, 'spear', 'spar'));
}
function inn(c: Ctx, z: Scene, lv: number) {
  if (!lv) {
    plotGround(c, 556, 292, 106, 86);
    for (const [bx, by] of [[568, 370], [578, 370], [588, 370], [573, 360], [583, 360], [578, 350]] as Pt[]) barrel(c, bx, by);   // kegs stacked
    planks(c, 600, 372, 30);
    R(c, 626, 342, 26, 4, '#6a4a30'); R(c, 628, 346, 2, 8, '#4a3420'); R(c, 648, 346, 2, 8, '#4a3420');   // a table and benches, stacked
    R(c, 626, 352, 26, 3, '#5a4028'); R(c, 626, 358, 26, 3, '#5a4028');
    R(c, 638, 320, 18, 18, '#24180f'); R(c, 639, 321, 16, 16, '#4a3424'); icon(c, 'tankard', 641, 323); R(c, 640, 338, 2, 6, WOOD);   // the inn's sign, waiting
    R(c, 596, 318, 30, 14, '#5a4028'); ell(c, 611, 316, 14, 6, '#c8a848'); ell(c, 600, 333, 4, 4, '#3a2a1c'); ell(c, 622, 333, 4, 4, '#3a2a1c');   // a hay cart
    board(c, z, 652, 312, 'tankard'); workLamp(c, z, 560, 320);
    z.A.push(P('folk', 594, 368, 1, 'mug', 'idle', true));
    return;
  }
  if (lv >= 2) {   // a stable: half door, a horse looking out, hay
    house(c, z, { x: 556, y: 318, w: 36, roofH: 18, wallH: 42, roof: '#2a2018', wall: '#3a2a1e', planks: true, seed: 19 });
    R(c, 564, 352, 18, 24, DARK); R(c, 564, 366, 18, 10, '#4a3424');
    R(c, 568, 352, 8, 12, '#6a4428'); R(c, 572, 356, 7, 6, '#6a4428'); R(c, 568, 352, 2, 4, '#2a1a10'); R(c, 577, 358, 1, 1, '#140f0a');
    ell(c, 586, 378, 6, 3, '#c8a848');
  }
  const x = lv >= 2 ? 596 : 560, w = lv >= 2 ? 64 : 98, top = lv >= 3 ? 268 : 296;
  const wh = 378 - top - 30;
  const wy = house(c, z, { x, y: top, w, roofH: 30, wallH: wh, roof: '#3a2420', wall: '#7a6a56', timber: true, chimney: w - 16, shingle: true, seed: 23 });
  const rows = lv >= 3 ? [wy + 8, wy + 36] : [wy + 8];
  for (const ry of rows) for (let wx = x + 8; wx < x + w - 10; wx += 18) if (Math.abs(wx + 5 - (x + w / 2)) > 9 || ry !== rows[rows.length - 1]) win(c, z, wx, ry, true, 'bottle');
  door(c, z, x + w / 2 - 5, 365);
  if (lv >= 3) { R(c, x - 3, wy + 28, w + 6, 2, '#2a1c14'); for (let s = x - 2; s < x + w + 2; s += 4) R(c, s, wy + 22, 1, 6, '#2a1c14'); R(c, x - 3, wy + 22, w + 6, 1, '#4a3424'); }
  barrel(c, x + w / 2 + 12, 378); barrel(c, x + w / 2 + 20, 378);
  hangSign(c, z, x, wy + 4, 'tankard', -1);
  R(c, 562, 382, 30, 3, '#4a3424'); R(c, 564, 385, 2, 3, '#2a1c14'); R(c, 588, 385, 2, 3, '#2a1c14');   // a bench out front
  z.A.push(P('folk', 570, 390, 1, 'mug', 'idle', true), P('knight', 584, 390, -1, 'mug', 'idle', true));
  if (lv >= 3) z.A.push(P('bard', x + w / 2, wy + 28, 1, 'lute', 'lute'));
}
// ---------- the houses around them ----------
function fillers(c: Ctx, z: Scene) {
  house(c, z, { x: 8, y: 194, w: 54, roofH: 26, wallH: 38, win: [8, 40], door: 22, seed: 37 });
  house(c, z, { x: 72, y: 184, w: 58, roofH: 30, wallH: 44, roof: '#2a2432', win: [8, 44], door: 24, chimney: 40, seed: 39 });
  // a small chapel: a rose window, a bell
  R(c, 190, 162, 12, 18, '#46425a'); tri(c, [188, 164], [196, 150], [204, 164], '#22203a'); R(c, 194, 168, 4, 5, '#b8902a');
  const cw = house(c, z, { x: 166, y: 180, w: 60, roofH: 28, wallH: 50, roof: '#22203a', gable: true, seed: 41 });
  win(c, z, 170, cw + 10, true, 'stained'); win(c, z, 212, cw + 10, true, 'stained');
  ell(c, 196, cw - 6, 6, 6, DARK); ell(c, 196, cw - 6, 4.5, 4.5, '#a058c8'); R(c, 195.5, cw - 10, 1, 8, DARK); R(c, 192, cw - 6.5, 8, 1, DARK);
  door(c, z, 191, cw + 37);
  house(c, z, { x: 556, y: 188, w: 50, roofH: 26, wallH: 44, win: [8, 36], door: 20, seed: 43 });
  house(c, z, { x: 614, y: 180, w: 50, roofH: 30, wallH: 48, roof: '#2a2432', win: [8, 34], lit: [false, true], door: 20, chimney: 30, seed: 45 });
  house(c, z, { x: 8, y: 298, w: 58, roofH: 28, wallH: 52, win: [8, 42], door: 24, chimney: 8, seed: 47 });
  house(c, z, { x: 74, y: 306, w: 56, roofH: 26, wallH: 46, roof: '#2a2432', win: [10, 40], door: 23, seed: 49 });
  for (const [x, w, seed] of [[10, 58, 51], [76, 54, 53], [166, 66, 55], [242, 62, 57], [362, 70, 59], [444, 80, 61], [560, 50, 63], [614, 50, 65]] as Pt3[])
    house(c, z, { x, y: 408 + (seed % 3) * 2, w, roofH: 28, wallH: 40, roof: seed % 2 ? '#2c2f4a' : '#2a2432', win: [8, w - 14], seed, chimney: seed % 3 ? undefined : w - 20 });
}
type Pt3 = [number, number, number];

// ---------- people ----------
type Kind = 'knight' | 'mage' | 'rogue' | 'archer' | 'cleric' | 'guard' | 'folk' | 'lady' | 'kid' | 'smith' | 'scholar' | 'merchant' | 'bard' | 'noble';
type Gear = 'sword' | 'staff' | 'bow' | 'shield' | 'spear' | 'lantern' | 'mug' | 'paddle' | 'hammer' | 'gavel' | 'book' | 'lute' | 'crate' | 'orb';
type Act = 'idle' | 'cheer' | 'raise' | 'hammer' | 'spar' | 'lute';
interface Actor { x: number; y: number; k: Kind; f: 1 | -1; s: number; g?: Gear; act?: Act; sit?: boolean;
  path?: Pt[]; loop?: boolean; v?: number; d?: number; ring?: [number, number, number, number, number] }
let seedN = 1;
function P(k: Kind, x: number, y: number, f: 1 | -1, g?: Gear, act: Act = 'idle', sit = false): Actor { return { k, x, y, f, g, act, sit, s: seedN++ * 7 }; }
const SKIN = ['#e0b090', '#c89070', '#a87050', '#7a5038', '#f0c8a0'];
const TUNIC = ['#6b4a3a', '#4a5a6b', '#7a6a4a', '#5a3a4a', '#3a5a4a', '#6a5a7a', '#7a4030', '#4a4a3a'];
const HAIR = ['#2a1c14', '#5a3a1c', '#8a6a3a', '#1a1a1a', '#a0a0a0', '#7a2a1a'];
const ROBE = ['#3b3a8a', '#5a2a6a', '#2a4a6a', '#6a2a2a'];

/** The crowd: adventurers at the portal, townsfolk round the fountain, people walking the streets. */
function crowd(): Actor[] {
  const A: Actor[] = [];
  const court: [Kind, number, number, 1 | -1, Gear?, Act?][] = [
    ['knight', 270, 134, 1, 'shield'], ['mage', 281, 130, -1, 'staff'], ['cleric', 276, 143, 1],
    ['rogue', 302, 127, 1, 'sword'], ['archer', 312, 131, -1, 'bow'],
    ['guard', 292, 121, 1, 'spear'], ['guard', 376, 121, -1, 'spear'],
    ['knight', 358, 128, -1, 'sword'], ['mage', 368, 132, -1, 'staff', 'raise'],
    ['archer', 392, 134, -1, 'bow'], ['knight', 398, 146, -1, 'shield'], ['rogue', 386, 148, 1],
    ['mage', 318, 145, 1, 'staff'], ['cleric', 350, 147, -1], ['knight', 292, 151, 1, 'sword', 'cheer'],
    ['folk', 334, 154, 1, 'lantern'], ['archer', 374, 155, -1, 'bow'], ['lady', 266, 153, 1], ['mage', 304, 156, 1, 'staff'],
  ];
  for (const [k, x, y, f, g, a] of court) A.push(P(k, x, y, f, g, a));
  const plaza: [Kind, number, number, 1 | -1, Gear?, Act?, boolean?][] = [
    ['bard', 262, 200, 1, 'lute', 'lute'], ['folk', 252, 212, 1], ['lady', 274, 212, -1], ['kid', 264, 218, -1, undefined, 'cheer'],
    ['folk', 314, 236, 1, 'mug', 'idle', true], ['lady', 352, 237, -1, undefined, 'idle', true], ['kid', 366, 236, 1, undefined, 'idle', true],
    ['folk', 270, 178, 1], ['lady', 278, 179, -1],
    ['folk', 256, 248, 1], ['noble', 266, 250, -1], ['kid', 250, 255, 1, undefined, 'cheer'],
    ['guard', 344, 254, -1, 'spear'], ['folk', 356, 256, -1, 'lantern'],
    ['folk', 378, 176, 1], ['lady', 386, 176, -1], ['cleric', 300, 170, 1],
    ['folk', 240, 230, 1, 'crate'], ['lady', 250, 232, -1],
  ];
  for (const [k, x, y, f, g, a, sit] of plaza) A.push(P(k, x, y, f, g, a, sit));
  // two kids chasing each other round the fountain
  for (let i = 0; i < 2; i++) { const a = P('kid', 0, 0, 1); a.ring = [FX, FY + 4, 52, 33, 0.9 + i * 0.05]; a.d = i * 0.6; A.push(a); }
  const walks: [Kind, Pt[], number, Gear?][] = [
    ['folk', [[6, 146], [258, 146]], 14, 'lantern'], ['guard', [[410, 147], [662, 147]], 11, 'spear'],
    ['folk', [[662, 271], [6, 271]], 15], ['lady', [[6, 270], [230, 270]], 12],
    ['folk', [[6, 388], [662, 388]], 13, 'crate'], ['rogue', [[662, 387], [6, 387]], 16],
    ['folk', [[146, 30], [146, 458]], 13, 'lantern'], ['knight', [[540, 458], [540, 30]], 12, 'shield'],
    ['folk', [[334, 458], [334, 292]], 14], ['archer', [[146, 458], [146, 280], [236, 280], [236, 200]], 13, 'bow'],
    ['merchant', [[540, 146], [540, 270], [440, 270]], 12, 'crate'], ['lady', [[540, 300], [540, 387], [600, 387]], 11],
    ['guard', [[6, 388], [320, 388], [320, 300]], 10, 'spear'],
  ];
  for (const [k, path, v, g] of walks) { const a = P(k, path[0][0], path[0][1], 1, g); a.path = path; a.v = v; a.d = rnd(a.s, 30) * 400; A.push(a); }
  // adventurers heading into the portal; they vanish in a violet flash
  const pilgrims: [Kind, Pt[], Gear?][] = [
    ['knight', [[284, 282], [284, 152], [334, 152], [334, 120]], 'sword'],
    ['mage', [[384, 282], [384, 152], [334, 152], [334, 120]], 'staff'],
    ['rogue', [[334, 458], [334, 290], [284, 290], [284, 152], [334, 152], [334, 120]]],
    ['archer', [[6, 146], [334, 146], [334, 120]], 'bow'],
  ];
  pilgrims.forEach(([k, path, g], i) => { const a = P(k, path[0][0], path[0][1], 1, g); a.path = path; a.loop = true; a.v = 17; a.d = i * 70; A.push(a); });
  return A;
}

type Fx = { L: Light[]; sparks: Pt[]; notes: Pt[] };
function person(c: Ctx, a: Actor, X: number, Y: number, t: number, walk: boolean, fx: Fx) {
  const x = Math.round(X), y = Math.round(Y), f = a.f, s = a.s;
  const kid = a.k === 'kid', h = kid ? 10 : 14, sit = !!a.sit;
  const top = y - h + (sit ? 3 : 0) + (!walk && Math.sin(t * 1.7 + s) > 0.8 ? 1 : 0);   // they breathe
  const skin = SKIN[s % SKIN.length], hair = HAIR[(s >> 2) % HAIR.length];
  let body = TUNIC[(s >> 1) % TUNIC.length], legs = '#2e2620', head: 'helm' | 'hood' | 'wizard' | 'hair' | 'cap' | 'bald' | 'long' = 'hair';
  let robe = false, hoodCol = '#2a2630', capCol = '#7a2a2a', trim = '';
  switch (a.k) {
    case 'knight': body = '#8a90a0'; legs = '#4a4a58'; head = 'helm'; trim = '#7a2a30'; break;
    case 'guard': body = '#6a2a2a'; legs = '#3a3a48'; head = 'helm'; trim = GOLD; break;
    case 'mage': body = ROBE[s % 4]; robe = true; head = 'wizard'; break;
    case 'rogue': body = '#34303c'; legs = '#24202c'; head = 'hood'; hoodCol = '#24202c'; break;
    case 'archer': body = '#3e5a38'; legs = '#3a2e22'; head = 'hood'; hoodCol = '#2e4a2a'; break;
    case 'cleric': body = '#d6cdb8'; robe = true; trim = GOLD; break;
    case 'lady': robe = true; head = 'long'; break;
    case 'smith': body = '#5a3a28'; head = 'bald'; trim = '#2a1c14'; break;
    case 'scholar': body = '#2a3a5a'; robe = true; head = 'cap'; capCol = '#1e2a40'; break;
    case 'merchant': body = '#7a5a2a'; head = 'cap'; capCol = '#8a2a2a'; break;
    case 'bard': body = '#6a2a5a'; head = 'cap'; capCol = '#3a6a3a'; break;
    case 'noble': body = '#4a2a5a'; robe = true; trim = GOLD; break;
  }
  const O = '#0b0910', legH = kid ? 2 : 4, tb = robe ? h - 4 - (sit ? 3 : 0) : h - 4 - legH;
  R(c, x - 4, y - 1, 9, 2, 'rgba(0,0,0,.45)');
  R(c, x - 3, top - 1, 6, 6, O); R(c, x - 4, top + 3, 8, tb + 2, O);
  if (!robe && !sit) R(c, x - 3, y - legH - 1, 6, legH + 1, O);
  if (sit) { R(c, x - 2 + f * 2, y - 4, 4, 2, legs); R(c, x - 1 + f * 4, y - 4, 2, 4, legs); }
  else if (!robe) { const p = walk ? Math.floor(t * 8 + s) % 2 : 0; R(c, x - 2, y - legH, 2, legH - (walk && p ? 1 : 0), legs); R(c, x, y - legH, 2, legH - (walk && !p ? 1 : 0), legs); }
  R(c, x - 3, top + 4, 6, tb, body);
  if (robe && !sit) R(c, x - 3, y - 2, 6, 2, 'rgba(0,0,0,.25)');
  if (trim) R(c, x - 1, top + 4, 2, Math.min(tb, 5), trim);
  R(c, x - 3, top + 4, 6, 1, 'rgba(255,255,255,.12)');
  // arms: up for a cheer, a bid, a toast, a swing
  const cyc = Math.sin(t * 1.3 + s * 0.7);
  const up = (a.act === 'cheer' && cyc > 0.3) || (a.act === 'raise' && cyc > 0) || ((a.g === 'paddle' || a.g === 'mug') && Math.sin(t * 1.1 + s * 2) > 0.55);
  const fa = f > 0 ? x + 3 : x - 4, ba = f > 0 ? x - 4 : x + 3;
  R(c, ba, top + 5, 1, 4, 'rgba(0,0,0,.35)');
  if (up) { R(c, fa, top - 1, 1, 6, body); R(c, fa, top - 2, 1, 1, skin); } else { R(c, fa, top + 5, 1, 4, body); R(c, fa, top + 8, 1, 1, skin); }
  if (a.act === 'cheer' && up) { R(c, ba, top - 1, 1, 6, body); R(c, ba, top - 2, 1, 1, skin); }
  // the head
  R(c, x - 2, top, 4, 4, skin);
  const eye = () => R(c, f > 0 ? x + 1 : x - 2, top + 2, 1, 1, '#140f18');
  switch (head) {
    case 'helm': R(c, x - 2, top - 1, 4, 3, '#a0a6b4'); R(c, x - 2, top - 1, 4, 1, '#c8ccd8'); R(c, f > 0 ? x - 2 : x + 1, top + 2, 1, 2, '#a0a6b4'); R(c, f > 0 ? x : x - 2, top + 2, 2, 1, '#140f18');
      if (a.k === 'knight') R(c, x - (f > 0 ? 1 : 0), top - 3, 1, 2, '#c84040'); break;
    case 'hood': R(c, x - 2, top - 1, 4, 3, hoodCol); R(c, f > 0 ? x - 3 : x + 2, top, 1, 5, hoodCol); R(c, f > 0 ? x - 2 : x + 1, top + 2, 1, 2, hoodCol); eye(); break;
    case 'wizard': R(c, x - 3, top + 1, 6, 1, body); R(c, x - 2, top - 1, 4, 2, body); R(c, x - 1, top - 3, 2, 2, body); R(c, x - (f > 0 ? 1 : 0) - f, top - 4, 1, 1, body); R(c, x - 2, top, 4, 1, GOLD); eye(); break;
    case 'cap': R(c, x - 2, top, 4, 1, hair); R(c, x - 2, top - 1, 4, 2, capCol); R(c, f > 0 ? x + 2 : x - 3, top, 1, 1, capCol); eye(); break;
    case 'bald': R(c, x - 2, top, 4, 1, 'rgba(255,255,255,.15)'); R(c, f > 0 ? x - 2 : x + 1, top + 1, 1, 2, hair); eye(); break;
    case 'long': R(c, x - 2, top - 1, 4, 2, hair); R(c, f > 0 ? x - 3 : x + 2, top, 1, 6, hair); R(c, f > 0 ? x - 2 : x + 1, top + 1, 1, 4, hair); eye(); break;
    default: R(c, x - 2, top - 1, 4, 2, hair); R(c, f > 0 ? x - 2 : x + 1, top + 1, 1, 2, hair); eye();
  }
  // what they carry
  const gx = x + 4 * f;
  switch (a.g) {
    case 'sword': R(c, x - 3 * f, top + 1, 1, 9, '#c8ccd8'); R(c, x - 3 * f - 1, top + 3, 3, 1, GOLD); break;
    case 'shield': R(c, f > 0 ? x + 2 : x - 5, top + 5, 3, 6, '#7a2a30'); R(c, f > 0 ? x + 2 : x - 5, top + 5, 3, 1, GOLD); R(c, f > 0 ? x + 3 : x - 4, top + 7, 1, 2, GOLD); break;
    case 'staff': R(c, gx, top - 4, 1, h + 3, '#6a4a2a'); R(c, gx - 1, top - 7, 3, 3, ['#b58cff', '#7ad0ff', '#ff9a4d'][s % 3]); fx.L.push({ x: gx, y: top - 6, r: 18, col: 'arcane', a: 0.7 }); break;
    case 'spear': R(c, gx, top - 5, 1, h + 4, '#5a4a3a'); R(c, gx - 1, top - 8, 3, 3, '#c8ccd8'); R(c, gx, top - 9, 1, 1, '#c8ccd8'); break;
    case 'bow': R(c, x - 4 * f, top + 2, 1, 9, '#7a5a30'); R(c, x - 3 * f, top + 3, 1, 7, 'rgba(220,220,220,.4)'); break;
    case 'lantern': R(c, gx, top + 6, 1, 2, O); R(c, gx - 1, top + 8, 3, 3, '#ffd27a'); fx.L.push({ x: gx, y: top + 9, r: 26, col: 'warm', a: 0.8 }); break;
    case 'mug': if (up) { R(c, gx - 1, top - 3, 3, 3, '#c8a050'); R(c, gx - 1, top - 4, 3, 1, '#f0ead8'); } else R(c, gx - 1, top + 7, 3, 3, '#c8a050'); break;
    case 'paddle': if (up) { R(c, gx, top - 6, 1, 6, '#6a4a2a'); R(c, gx - 2, top - 10, 5, 4, '#e8dcc0'); R(c, gx - 1, top - 9, 3, 2, '#b04040'); } else { R(c, gx, top + 6, 1, 5, '#6a4a2a'); R(c, gx - 1, top + 10, 3, 3, '#e8dcc0'); } break;
    case 'gavel': { const g2 = Math.sin(t * 5 + s) > 0; R(c, gx, g2 ? top - 4 : top + 2, 1, 5, '#6a4a2a'); R(c, gx - 2, g2 ? top - 5 : top + 1, 5, 2, '#8a5a30'); break; }
    case 'hammer': {
      const k = ((t + s * 0.1) / 0.9) % 1, hy = k < 0.6 ? top - 2 - k * 6 : top + 4;
      R(c, gx, hy, 1, 6, '#6a4a2a'); R(c, gx - 1, hy - 1, 4, 3, '#7a7a86');
      if (k > 0.62 && k < 0.8) fx.sparks.push([x + 10 * f, y - 10]);
      break;
    }
    case 'book': R(c, x + 2 * f - 1, top + 6, 4, 3, '#7a3a2a'); R(c, x + 2 * f - 1, top + 6, 4, 1, '#e8dcc0'); break;
    case 'lute': R(c, x + f - 2, top + 6, 5, 4, '#a0703a'); R(c, f > 0 ? x + 3 : x - 6, top + 4, 4, 1, '#6a4a2a'); if (Math.floor(t * 1.4 + s) % 2 === 0) fx.notes.push([x + 6 * f, top - 4 - ((t * 1.4 + s) % 1) * 10]); break;
    case 'crate': R(c, x - 4, top + 4, 8, 6, '#6a4a30'); R(c, x - 4, top + 4, 8, 1, '#8a6a40'); break;
    case 'orb': R(c, gx - 1, top + 1, 3, 3, '#b58cff'); fx.L.push({ x: gx, y: top + 2, r: 14, col: 'arcane', a: 0.8 }); break;
  }
  if (a.act === 'spar') { const sw = Math.sin(t * 6 + s); if (sw > 0) R(c, gx, top - 3, 1, 8, '#d8dce8'); else R(c, f > 0 ? x + 4 : x - 10, top + 6, 7, 1, '#d8dce8'); if (sw > 0.97) fx.sparks.push([x + 7 * f, y - 9]); }
}

// ---------- the static picture, cached until a building changes ----------
let cache: { key: string; cv: HTMLCanvasElement; holes: HTMLCanvasElement; glow: HTMLCanvasElement; z: Scene; sprites: Partial<Record<TownSpotId, HTMLCanvasElement>>; sil: Partial<Record<TownSpotId, HTMLCanvasElement>> } | null = null;
const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv; };
const COL: Record<LightCol, string> = { warm: '255,170,80', fire: '255,120,40', arcane: '150,80,230', cold: '90,140,200', gold: '255,200,80' };

function ground(c: Ctx) {
  R(c, 0, 0, W, H, '#1a221d');
  for (let i = 0; i < 1100; i++) R(c, rnd(i, 1) * W, rnd(i, 2) * H, 2, 1, rnd(i, 3) > 0.5 ? '#232c25' : '#131813');
  for (const [x, y, w, h] of [...STREETS, COURT, PLAZA]) R(c, x - 2, y - 2, w + 4, h + 4, '#2a2634');   // curbs
  const st = mk(), s = st.getContext('2d')!;
  R(s, 0, 0, W, H, '#45415a');
  for (let y = 0, k = 0; y < H; y += 5, k++) for (let x = -(k % 2) * 4; x < W; x += 8) {
    const v = rnd(x * 0.37 + y, k);
    R(s, x + 1, y + 1, 6, 3, v > 0.66 ? '#57526c' : v > 0.33 ? '#4e4a62' : '#454158');
    R(s, x + 1, y + 4, 6, 1, 'rgba(0,0,0,.35)');
  }
  s.globalCompositeOperation = 'destination-in'; s.fillStyle = '#000';
  for (const [x, y, w, h] of STREETS) s.fillRect(x, y, w, h);
  c.drawImage(st, 0, 0);
  // the plaza: big pale flagstones, a ring of darker stone round the fountain
  const flags = (b: Box, fw: number, fh: number, cols: string[]) => {
    const [bx, by, bw, bh] = b;
    for (let y = by, k = 0; y < by + bh; y += fh, k++) for (let x = bx - (k % 2) * (fw / 2); x < bx + bw; x += fw) {
      const x0 = Math.max(x, bx), x1 = Math.min(x + fw, bx + bw), y1 = Math.min(y + fh, by + bh), v = rnd(x + y * 3, 4);
      R(c, x0, y, x1 - x0 - 1, y1 - y - 1, v > 0.6 ? cols[0] : v > 0.3 ? cols[1] : cols[2]);
    }
  };
  flags(PLAZA, 12, 8, ['#625d7a', '#5a5672', '#54506a']);
  c.strokeStyle = '#3e3a50'; c.lineWidth = 6; c.beginPath(); c.ellipse(FX, FY + 2, 58, 37, 0, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#6e6888'; c.lineWidth = 1; c.beginPath(); c.ellipse(FX, FY + 2, 61, 40, 0, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; R(c, FX + Math.cos(a) * 58 - 1, FY + 2 + Math.sin(a) * 37 - 1, 2, 2, '#2a2634'); }
  flags(COURT, 10, 6, ['#3e3a4e', '#38344a', '#322e42']);
  for (const [x, y, w] of [...STREETS, COURT, PLAZA]) R(c, x, y, w, 1, 'rgba(255,255,255,.06)');
}
function cliff(c: Ctx) {
  // rock above the town; the crypt is cut into it
  R(c, 0, 0, W, 24, '#110e19');
  for (let i = 0; i < 90; i++) R(c, rnd(i, 9) * W, rnd(i, 10) * 16, 2 + rnd(i, 11) * 5, 2, '#1b1726');
  R(c, 0, 16, W, 9, '#1c1828');
  for (let x = 0; x < W; x += 5) R(c, x + Math.round(rnd(x, 12) * 2), 16, 1, 7 + Math.round(rnd(x, 13) * 2), 'rgba(0,0,0,.45)');
  R(c, 0, 16, W, 1, 'rgba(170,190,255,.14)'); R(c, 0, 25, W, 3, 'rgba(0,0,0,.4)');
  for (const [x, s] of [[24, 0.8], [112, 0.7], [452, 0.6], [590, 0.8], [652, 0.7]] as Pt[]) deadTree(c, x, 16, s);
}
function build(levels: Record<CityId, number>) {
  const cv = mk(), c = cv.getContext('2d')!;
  const z: Scene = { L: [], A: [], flames: [], smokes: [], items: [], glints: [], steam: [] };
  c.imageSmoothingEnabled = false;
  seedN = 1;
  ground(c); cliff(c);
  const sprites: Partial<Record<TownSpotId, HTMLCanvasElement>> = {};
  const draw = (id: TownSpotId, f: (cc: Ctx) => void) => { const sp = mk(), s = sp.getContext('2d')!; f(s); c.drawImage(sp, 0, 0); sprites[id] = sp; };
  portal(c, z);
  // back to front, row by row
  draw('appraiser', cc => appraiser(cc, z)); draw('library', cc => library(cc, z, levels.library));
  draw('auction', cc => auction(cc, z)); draw('treasury', cc => treasury(cc, z, levels.treasury));
  fillers(c, z); fountain(c, z);
  draw('merchant', cc => merchant(cc, z));
  draw('training', cc => training(cc, z, levels.training)); draw('salvage', cc => forge(cc, z)); draw('inn', cc => inn(cc, z, levels.inn));
  for (const p of LAMPS) lanternPost(c, z, p[0], p[1]);
  for (const s of TOWN_SPOTS) sign(c, s.sign[0], s.sign[1], s.name);
  z.A.push(...crowd());
  // the lights that never flicker are baked once: the holes they cut in the night, and their colour
  const holes = mk(), hc = holes.getContext('2d')!, glow = mk(), gc = glow.getContext('2d')!;
  gc.globalCompositeOperation = 'lighter';
  for (const p of z.L) if (!p.f) {
    const g1 = hc.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r); g1.addColorStop(0, `rgba(0,0,0,${p.a})`); g1.addColorStop(1, 'rgba(0,0,0,0)');
    hc.fillStyle = g1; hc.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    const r = p.r * 0.7, g2 = gc.createRadialGradient(p.x, p.y, 1, p.x, p.y, r); g2.addColorStop(0, `rgba(${COL[p.col]},${0.22 * p.a})`); g2.addColorStop(1, `rgba(${COL[p.col]},0)`);
    gc.fillStyle = g2; gc.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  }
  z.L = z.L.filter(p => p.f);
  return { cv, holes, glow, z, sprites };
}

// ---------- per frame: magic, water, fire, smoke, people, the night, the hover glow, the signs ----------
let lightCv: HTMLCanvasElement | null = null, haloCv: HTMLCanvasElement | null = null;
let lastT = 0;
const flashes: { x: number; y: number; t: number }[] = [];
function along(p: Pt[], d: number, loop: boolean): [number, number, number, boolean] {
  let len = 0; const seg: number[] = [];
  for (let i = 1; i < p.length; i++) { const l = Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]); seg.push(l); len += l; }
  let t = loop ? d % len : ((d % (2 * len)) + 2 * len) % (2 * len); const back = !loop && t > len; if (back) t = 2 * len - t;
  for (let i = 0; i < seg.length; i++) if (t <= seg[i]) {
    const k = seg[i] ? t / seg[i] : 0, dx = p[i + 1][0] - p[i][0];
    return [p[i][0] + dx * k, p[i][1] + (p[i + 1][1] - p[i][1]) * k, dx === 0 ? 0 : Math.sign(dx) * (back ? -1 : 1), true];
  } else t -= seg[i];
  return [p[p.length - 1][0], p[p.length - 1][1], 0, true];
}
function flame(c: Ctx, fl: Flame, t: number, i: number) {
  const f = Math.sin(t * 9 + i * 1.7) * 1.5 * fl.s, w = 6 * fl.s, hgt = 12 * fl.s;
  const [o, m, n] = fl.col === 'fire' ? ['#ff6a1a', '#ffb040', '#fff0b0'] : ['#7a3ad6', '#b58cff', '#f0e0ff'];
  c.fillStyle = o; c.beginPath(); c.moveTo(fl.x - w, fl.y); c.quadraticCurveTo(fl.x - w * 0.3, fl.y - hgt * 0.6, fl.x + f * 0.5, fl.y - hgt + f); c.quadraticCurveTo(fl.x + w * 0.3, fl.y - hgt * 0.6, fl.x + w, fl.y); c.fill();
  c.fillStyle = m; c.beginPath(); c.moveTo(fl.x - w * 0.6, fl.y); c.quadraticCurveTo(fl.x, fl.y - hgt * 0.8 + f, fl.x + w * 0.6, fl.y); c.fill();
  c.fillStyle = n; c.beginPath(); c.moveTo(fl.x - w * 0.25, fl.y); c.quadraticCurveTo(fl.x, fl.y - hgt * 0.4, fl.x + w * 0.25, fl.y); c.fill();
}

export function drawTownMap(c: Ctx) {
  const g = S.g;
  const levels = { training: g.furniture.training ?? 0, inn: g.furniture.inn ?? 0, library: g.furniture.library ?? 0, treasury: g.furniture.treasury ?? 0 } as Record<CityId, number>;
  const key = JSON.stringify(levels);
  if (!cache || cache.key !== key) cache = { key, ...build(levels), sil: {} };
  const z = cache.z;
  const t = performance.now() / 1000, dt = Math.min(0.1, lastT ? t - lastT : 0); lastT = t;
  c.imageSmoothingEnabled = false;
  c.drawImage(cache.cv, 0, 0);
  const fx: Fx = { L: [], sparks: [], notes: [] };
  // the portal's vortex: crimson and violet, turning, sucking motes in
  c.save(); c.beginPath(); c.moveTo(298, 114); c.lineTo(298, 52); c.quadraticCurveTo(298, 31, 334, 17); c.quadraticCurveTo(370, 31, 370, 52); c.lineTo(370, 114); c.closePath(); c.clip();
  const vg = c.createRadialGradient(334, 70, 2, 334, 70, 50); vg.addColorStop(0, '#05030a'); vg.addColorStop(0.35, '#3a0c2a'); vg.addColorStop(0.7, '#6a2a8a'); vg.addColorStop(1, '#14061e');
  c.fillStyle = vg; c.fillRect(288, 10, 92, 110);
  for (let k = 0; k < 3; k++) {
    c.strokeStyle = k === 1 ? 'rgba(210,60,90,.75)' : 'rgba(150,100,230,.6)'; c.lineWidth = 2; c.beginPath();
    for (let a = 0; a < 7; a += 0.2) { const r = 4 + a * 6, ang = a - t * (1.4 + k * 0.3) + k * 2.1; const px = 334 + Math.cos(ang) * r, py = 70 + Math.sin(ang) * r * 1.15; if (a) c.lineTo(px, py); else c.moveTo(px, py); }
    c.stroke();
  }
  for (let i = 0; i < 10; i++) { const ph = (t * 0.4 + i / 10) % 1, ang = i * 2.4 + t; const r = 46 * (1 - ph); R(c, 334 + Math.cos(ang) * r, 70 + Math.sin(ang) * r, 2, 2, `rgba(250,226,153,${ph})`); }
  c.restore();
  fx.L.push({ x: 334, y: 72, r: 110 + Math.sin(t * 2) * 6, col: 'arcane', a: 0.95 });
  // the court's rune ring pulses
  c.strokeStyle = `rgba(200,160,255,${0.25 + Math.sin(t * 2.2) * 0.15})`; c.lineWidth = 1; c.beginPath(); c.ellipse(334, 130, 40 + Math.sin(t * 2.2) * 2, 6, 0, 0, Math.PI * 2); c.stroke();
  // fire bowls, torches, the hearth
  z.flames.forEach((fl, i) => flame(c, fl, t, i));
  // the fountain: water, a two-tier statue, spouts, light dancing on it
  ell(c, FX, FY - 1, 36, 19, '#1f3a66');
  for (let i = 0; i < 4; i++) { const p = (t * 0.5 + i / 4) % 1; c.strokeStyle = `rgba(150,210,230,${0.5 * (1 - p)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(FX, FY - 1, 8 + p * 27, 4 + p * 14, 0, 0, Math.PI * 2); c.stroke(); }
  for (let i = 0; i < 6; i++) R(c, FX - 24 + rnd(i, 40) * 48, FY - 10 + rnd(i, 41) * 18, 3, 1, `rgba(255,220,160,${0.3 + 0.3 * Math.sin(t * 3 + i * 2)})`);
  R(c, FX - 5, FY - 8, 10, 9, '#5a5674'); ell(c, FX, FY - 10, 11, 4, '#6a6684'); ell(c, FX, FY - 10, 9, 3, '#2a5a8a');
  R(c, FX - 2, FY - 24, 4, 14, '#6a6684'); ell(c, FX, FY - 26, 3.5, 3.5, '#6a6684'); R(c, FX - 2, FY - 30, 4, 3, '#7a7694');
  for (let i = 0; i < 8; i++) { const p = (t * 1.2 + i / 8) % 1, sx = FX + (i % 2 ? 1 : -1) * (2 + p * 9); R(c, sx, FY - 27 + p * p * 18, 1, 2, `rgba(190,230,255,${1 - p})`); }
  fx.L.push({ x: FX, y: FY - 6, r: 44, col: 'cold', a: 0.5 });
  // the appraiser's crystal and its runes
  const cp = 0.75 + Math.sin(t * 2) * 0.25;
  c.fillStyle = `rgba(200,160,255,${cp})`; c.beginPath(); c.moveTo(102, 0); c.lineTo(106, 5); c.lineTo(102, 11); c.lineTo(98, 5); c.fill();
  R(c, 101, 3, 1, 3, '#f8f0ff'); fx.L.push({ x: 102, y: 6, r: 30 + cp * 8, col: 'arcane', a: 0.9 });
  for (let i = 0; i < 4; i++) { const a = t * 0.8 + i * Math.PI / 2, rx = 102 + Math.cos(a) * 24, ry = 40 + Math.sin(a) * 6; if (Math.sin(a) > -0.2) { R(c, rx - 1, ry - 2, 3, 1, '#d8c0ff'); R(c, rx, ry - 2, 1, 4, '#d8c0ff'); } }
  // lots glowing on their pedestals, coin glints, stars in the dome
  z.items.forEach((it, i) => { const by = it.y + Math.sin(t * 2 + i) * 1.5; c.fillStyle = it.col; c.beginPath(); c.moveTo(it.x, by - 4); c.lineTo(it.x + 3, by); c.lineTo(it.x, by + 4); c.lineTo(it.x - 3, by); c.fill(); fx.L.push({ x: it.x, y: by, r: 20, col: i ? 'fire' : 'arcane', a: 0.8 }); });
  z.glints.forEach(([gx, gy], i) => { const k = (t * 0.7 + i * 0.37) % 1; if (k < 0.15) { const a = 1 - k / 0.15; R(c, gx - 2, gy, 5, 1, `rgba(255,240,180,${a})`); R(c, gx, gy - 2, 1, 5, `rgba(255,240,180,${a})`); } });
  // smoke, steam, forge sparks
  for (const [sx, sy] of z.smokes) for (let i = 0; i < 4; i++) { const p = (t * 0.25 + i / 4 + sx * 0.01) % 1; c.fillStyle = `rgba(60,56,72,${0.45 * (1 - p)})`; c.beginPath(); c.arc(sx + Math.sin(p * 6 + i) * 4, sy - p * 34, 3 + p * 6, 0, Math.PI * 2); c.fill(); }
  for (const [sx, sy] of z.steam) for (let i = 0; i < 3; i++) { const p = (t * 0.6 + i / 3) % 1; c.fillStyle = `rgba(200,210,230,${0.35 * (1 - p)})`; c.beginPath(); c.arc(sx + Math.sin(p * 5 + i) * 3, sy - p * 18, 2 + p * 3, 0, Math.PI * 2); c.fill(); }
  for (let i = 0; i < 6; i++) { const p = (t * 0.9 + i / 6) % 1; R(c, 428 + Math.sin(i * 3 + t) * 6, 266 - p * 30, 1, 1, `rgba(255,170,80,${1 - p})`); }
  // people, back to front
  const placed: [Actor, number, number, boolean][] = [];
  for (const a of z.A) {
    if (a.ring) { a.d = (a.d ?? 0) + dt * a.ring[4]; const ang = a.d; const x = a.ring[0] + Math.cos(ang) * a.ring[2], y = a.ring[1] + Math.sin(ang) * a.ring[3]; a.f = Math.sin(ang) > 0 ? -1 : 1; placed.push([a, x, y, true]); continue; }
    if (a.path) {
      const before = a.d ?? 0; a.d = before + dt * (a.v ?? 12);
      if (a.loop) { const len = a.path.slice(1).reduce((s, p, i) => s + Math.abs(p[0] - a.path![i][0]) + Math.abs(p[1] - a.path![i][1]), 0); if (Math.floor(a.d / len) > Math.floor(before / len)) flashes.push({ x: a.path[a.path.length - 1][0], y: a.path[a.path.length - 1][1], t }); }
      const [x, y, dir] = along(a.path, a.d, !!a.loop); if (dir) a.f = dir > 0 ? 1 : -1;
      placed.push([a, x, y, true]); continue;
    }
    placed.push([a, a.x, a.y, false]);
  }
  placed.sort((p, q) => p[2] - q[2]);
  for (const [a, x, y, walk] of placed) {
    if (a.loop) { const end = a.path![a.path!.length - 1]; const dist = Math.abs(x - end[0]) + Math.abs(y - end[1]); if (dist < 10) { c.globalAlpha = dist / 10; person(c, a, x, y, t, walk, fx); c.globalAlpha = 1; continue; } }
    person(c, a, x, y, t, walk, fx);
  }
  for (const [sx, sy] of fx.sparks) for (let i = 0; i < 5; i++) { const a = rnd(i + Math.floor(t * 10), 50) * Math.PI - Math.PI, r = 3 + rnd(i, 51) * 7; R(c, sx + Math.cos(a) * r, sy + Math.sin(a) * r * 0.7, 1, 1, i % 2 ? '#ffd27a' : '#ff8a2a'); fx.L.push({ x: sx, y: sy, r: 14, col: 'fire', a: 0.6 }); }
  for (const [nx, ny] of fx.notes) { R(c, nx, ny, 1, 4, '#f4e0a0'); R(c, nx - 2, ny + 3, 3, 2, '#f4e0a0'); R(c, nx + 1, ny, 2, 1, '#f4e0a0'); }
  for (let i = flashes.length - 1; i >= 0; i--) {
    const fl = flashes[i], k = (t - fl.t) / 0.5;
    if (k > 1 || k < 0) { flashes.splice(i, 1); continue; }
    c.strokeStyle = `rgba(210,170,255,${1 - k})`; c.lineWidth = 2; c.beginPath(); c.ellipse(fl.x, fl.y - 8, 4 + k * 14, 6 + k * 18, 0, 0, Math.PI * 2); c.stroke();
    fx.L.push({ x: fl.x, y: fl.y - 8, r: 30 * (1 - k) + 10, col: 'arcane', a: 1 - k });
  }
  // the night: dark everywhere, light where there are lamps, candles, fire and magic
  if (!lightCv) lightCv = mk();
  const l = lightCv.getContext('2d')!;
  l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, W, H);
  l.fillStyle = 'rgba(8,10,28,.55)'; l.fillRect(0, 0, W, H);
  l.globalCompositeOperation = 'destination-out';
  l.drawImage(cache.holes, 0, 0);
  const live = z.L.concat(fx.L);
  live.forEach((p, i) => {
    const fl = p.f ? 1 + Math.sin(t * (7 + (i % 5)) + i) * 0.06 + Math.sin(t * 17 + i * 3) * 0.03 : 1;
    const r = p.r * fl, gr = l.createRadialGradient(p.x, p.y, 1, p.x, p.y, r);
    gr.addColorStop(0, `rgba(0,0,0,${p.a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = gr; l.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  });
  c.drawImage(lightCv, 0, 0);
  // coloured light on top: warm candles and lanterns, orange fire, violet magic
  c.save(); c.globalCompositeOperation = 'lighter';
  c.drawImage(cache.glow, 0, 0);
  for (const p of live) { const r = p.r * 0.7, gr = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, r); gr.addColorStop(0, `rgba(${COL[p.col]},${0.22 * p.a})`); gr.addColorStop(1, `rgba(${COL[p.col]},0)`); c.fillStyle = gr; c.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
  c.restore();
  // the hover glow: a soft halo just outside the building's outline, breathing a little
  const hot = townHover.id;
  if (hot) {
    const sp = cache.sprites[hot];
    c.save();
    if (sp) {
      const si = cache.sil[hot] ?? (cache.sil[hot] = (() => { const cv = mk(), s2 = cv.getContext('2d')!; s2.drawImage(sp, 0, 0); s2.globalCompositeOperation = 'source-in'; s2.fillStyle = '#fae299'; s2.fillRect(0, 0, W, H); return cv; })());
      if (!haloCv) haloCv = mk();
      const h = haloCv.getContext('2d')!;
      h.globalCompositeOperation = 'source-over'; h.clearRect(0, 0, W, H); h.filter = 'blur(4px)'; h.drawImage(si, 0, 0); h.drawImage(si, 0, 0); h.filter = 'none';
      h.globalCompositeOperation = 'destination-out'; h.drawImage(si, 0, 0);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(t * 4) * 0.12; c.drawImage(haloCv, 0, 0);
      c.globalAlpha = 0.06; c.drawImage(si, 0, 0);
    } else { const s = TOWN_SPOTS.find(x => x.id === hot)!; c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(334, 66, 10, 334, 66, 80); gr.addColorStop(0, 'rgba(180,120,255,.45)'); gr.addColorStop(1, 'rgba(180,120,255,0)'); c.fillStyle = gr; c.fillRect(s.x - 20, s.y - 10, s.w + 40, s.h + 20); }
    c.restore();
  }
  for (const s of TOWN_SPOTS) signText(c, s.sign[0], s.sign[1], s.name, s.id === hot);
}
