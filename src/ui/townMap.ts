// Ravenhold at night (#50): a jRPG town seen top-down at an angle, drawn in code as a prototype for the art
// redesign. Streets of cobblestone between thick stone buildings, a fountain in the middle, the dungeon portal at
// the top centre. Windows are lit by candles, the streets by lanterns. Plots that are not built yet are
// construction sites. Names are signs on the buildings; a building glows when the mouse is over it.
// Rules live in systems/town.ts; the clicks are wired in main.ts (townHit).
import { S, N } from '../core/state';
import { type CityId } from '../data/city';
import { BATTLE_W, GAME_H } from './layout';

const W = BATTLE_W, H = GAME_H;   // the whole battle area: 668 x 464
const FONT = '"Pixelify Sans", monospace';
export type TownSpotId = CityId | 'appraiser' | 'auction' | 'merchant' | 'salvage' | 'portal';
/** What you can click: the services, the four plots and the portal. Footprints in battle-area pixels. */
export const TOWN_SPOTS: { id: TownSpotId; x: number; y: number; w: number; h: number; name: string; sign: [number, number] }[] = [
  { id: 'portal', x: 284, y: 2, w: 100, h: 124, name: 'Dungeon Portal', sign: [334, 18] },
  { id: 'appraiser', x: 36, y: 6, w: 100, h: 180, name: 'Appraiser', sign: [86, 190] },
  { id: 'library', x: 160, y: 60, w: 124, h: 166, name: 'Library', sign: [222, 232] },
  { id: 'auction', x: 396, y: 10, w: 124, h: 182, name: 'Auction House', sign: [458, 196] },
  { id: 'treasury', x: 548, y: 84, w: 106, h: 106, name: 'Treasury', sign: [601, 196] },
  { id: 'merchant', x: 10, y: 300, w: 132, h: 104, name: 'Merchant', sign: [82, 408] },
  { id: 'training', x: 166, y: 270, w: 112, h: 172, name: 'Training Grounds', sign: [222, 450] },
  { id: 'salvage', x: 400, y: 262, w: 118, h: 130, name: 'Salvage Forge', sign: [458, 398] },
  { id: 'inn', x: 520, y: 250, w: 134, h: 144, name: 'Inn', sign: [588, 400] },
];
export const townHit = (x: number, y: number): TownSpotId | null => {
  for (const s of TOWN_SPOTS) if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s.id;
  return null;
};
/** The spot under the mouse (main.ts sets it); it glows. */
export const townHover: { id: TownSpotId | null } = { id: null };

// ---------- the plan: streets, the plaza, the lanterns ----------
type Pt = [number, number];
const ROADS: { pts: Pt[]; w: number }[] = [
  { pts: [[334, 118], [334, 214]], w: 40 },              // from the portal steps to the plaza
  { pts: [[332, 330], [320, 400], [302, 480]], w: 40 },  // the plaza to the south gate
  { pts: [[-14, 298], [140, 290], [272, 280]], w: 30 },  // the west street
  { pts: [[396, 258], [522, 248], [684, 236]], w: 30 },  // the east street
  { pts: [[530, 250], [530, 70]], w: 20 },               // the alley between the Auction House and the Treasury
  { pts: [[152, 292], [152, 480]], w: 20 },              // the alley between the Merchant and the Training Grounds
  { pts: [[146, 288], [146, 176]], w: 16 },              // the alley behind the Appraiser
];
const PLAZA = { x: 334, y: 268, r: 70 };
const LANTERNS: Pt[] = [[286, 214], [384, 212], [282, 330], [388, 328], [92, 276], [222, 266], [468, 234], [612, 222], [350, 420], [300, 150], [368, 150], [168, 470]];
// people out late, walking the streets (a few carry a lantern)
const WALKS: Pt[][] = [
  [[334, 132], [334, 204]], [[10, 300], [140, 291], [266, 282]], [[402, 258], [522, 249], [664, 238]],
  [[330, 336], [318, 402], [304, 462]], [[530, 240], [530, 90]], [[152, 300], [152, 460]],
];

// ---------- small drawing helpers ----------
const R = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const rnd = (i: number, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
type Light = { x: number; y: number; r: number; col: 'warm' | 'cold' | 'arcane' | 'fire'; a: number };

/** A stone building seen from above at an angle: a slate roof, then its front wall with windows and a door.
 *  Lit windows add candle lights. Returns the wall's top y. */
function house(c: CanvasRenderingContext2D, L: Light[], o: { x: number; y: number; w: number; roofH: number; wallH: number; wall?: string; roof?: string;
  win?: number[]; lit?: boolean[]; door?: number; gable?: boolean; chimney?: number; arched?: boolean; seed?: number }): number {
  const { x, y, w, roofH, wallH } = o;
  const wall = o.wall ?? '#46425a', roof = o.roof ?? '#2c2f4a';
  R(c, x + 4, y + 6, w + 2, roofH + wallH, 'rgba(0,0,0,.35)');                               // its shadow on the ground
  // roof: slate rows, a dark ridge, light eaves, the right side a little darker
  R(c, x - 3, y, w + 6, roofH, roof);
  for (let r = y + 4; r < y + roofH - 2; r += 4) R(c, x - 3, r, w + 6, 1, 'rgba(0,0,0,.28)');
  for (let r = y + 4, k = 0; r < y + roofH - 2; r += 4, k++) for (let s = x - 3 + (k % 2) * 5; s < x + w + 3; s += 10) R(c, s, r - 3, 1, 3, 'rgba(0,0,0,.18)');
  R(c, x - 3, y, w + 6, 3, 'rgba(0,0,0,.35)'); R(c, x - 3, y, w + 6, 1, 'rgba(170,190,255,.22)');   // moonlight on the ridge
  R(c, x - 3, y, 1, roofH, 'rgba(170,190,255,.12)');
  R(c, x + w * 0.7, y, w * 0.3 + 3, roofH, 'rgba(0,0,0,.14)');
  R(c, x - 3, y + roofH - 2, w + 6, 2, 'rgba(255,255,255,.08)');
  if (o.chimney !== undefined) { R(c, x + o.chimney, y - 8, 8, 14, '#2c2a36'); R(c, x + o.chimney - 1, y - 9, 10, 2, '#1c1a24'); }
  // the front wall: stone blocks, quoins at the corners, a shadow under the eaves
  const wy = y + roofH;
  R(c, x, wy, w, wallH, wall);
  for (let r = wy + 4, k = 0; r < wy + wallH; r += 5, k++) { R(c, x, r, w, 1, 'rgba(0,0,0,.22)'); for (let s = x + (k % 2) * 4; s < x + w; s += 8) R(c, s, r - 4, 1, 4, 'rgba(0,0,0,.14)'); }
  R(c, x, wy, w, 3, 'rgba(0,0,0,.35)');
  for (let r = wy + 3; r < wy + wallH; r += 6) { R(c, x, r, 3, 3, 'rgba(255,255,255,.07)'); R(c, x + w - 3, r + 3, 3, 3, 'rgba(255,255,255,.05)'); }
  if (o.gable) {   // a pointed gable over the door
    const gx = x + w / 2, gw = Math.min(40, w * 0.4);
    c.fillStyle = wall; c.beginPath(); c.moveTo(gx - gw / 2, wy + 1); c.lineTo(gx, wy - roofH * 0.6); c.lineTo(gx + gw / 2, wy + 1); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx - gw / 2 - 2, wy + 1); c.lineTo(gx, wy - roofH * 0.6 - 2); c.lineTo(gx + gw / 2 + 2, wy + 1); c.stroke();
    win(c, L, gx - 3, wy - roofH * 0.32, true, 'round');
  }
  // windows (x offsets), lit or dark; a door
  (o.win ?? []).forEach((dx, i) => win(c, L, x + dx, wy + 7, o.lit?.[i] ?? rnd((o.seed ?? 1) + i) > 0.35, o.arched === false ? 'square' : 'arch'));
  if (o.door !== undefined) door(c, L, x + o.door, wy + wallH - 13);
  return wy;
}
function win(c: CanvasRenderingContext2D, L: Light[], x: number, y: number, lit: boolean, shape: 'arch' | 'square' | 'round') {
  const col = lit ? '#f4c25e' : '#141220';
  if (shape === 'round') { c.fillStyle = '#1c1a26'; c.beginPath(); c.arc(x + 3, y + 3, 4, 0, Math.PI * 2); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x + 3, y + 3, 2.6, 0, Math.PI * 2); c.fill(); }
  else {
    R(c, x - 1, y - 1, 8, 11, '#1c1a26');
    R(c, x, y + 2, 6, 8, col);
    if (shape === 'arch') { c.fillStyle = col; c.beginPath(); c.arc(x + 3, y + 3, 3, Math.PI, 0); c.fill(); } else R(c, x, y, 6, 2, col);
    R(c, x + 2.5, y, 1, 10, '#1c1a26'); R(c, x, y + 5, 6, 1, '#1c1a26');   // the leading
  }
  if (lit) L.push({ x: x + 3, y: y + 5, r: 16, col: 'warm', a: 0.55 });
}
function door(c: CanvasRenderingContext2D, L: Light[], x: number, y: number) {
  R(c, x - 1, y - 2, 12, 15, '#1c1a24');
  c.fillStyle = '#3a2618'; c.beginPath(); c.moveTo(x, y + 13); c.lineTo(x, y + 4); c.arc(x + 5, y + 4, 5, Math.PI, 0); c.lineTo(x + 10, y + 13); c.fill();
  R(c, x + 4.5, y, 1, 13, 'rgba(0,0,0,.4)'); R(c, x + 7, y + 7, 1.5, 1.5, '#8a7a5a');
  R(c, x + 12, y + 1, 3, 4, '#f4c25e');                       // a small lamp by the door
  L.push({ x: x + 13, y: y + 3, r: 22, col: 'warm', a: 0.7 });
}
function sign(c: CanvasRenderingContext2D, x: number, y: number, text: string, post = false) {
  c.font = `400 10px ${FONT}`;
  const w = Math.ceil(c.measureText(text).width) + 8;
  const sx = Math.round(x - w / 2), sy = Math.round(y - 6);
  if (post) R(c, x - 1, sy + 12, 2, 12, '#3a2a1c'); else { R(c, sx + 3, sy - 4, 1, 4, '#2a2420'); R(c, sx + w - 4, sy - 4, 1, 4, '#2a2420'); }
  R(c, sx, sy, w, 13, '#2e2018'); R(c, sx, sy, w, 1, '#4a3424'); R(c, sx, sy + 12, w, 1, '#1a120c');
}
function signText(c: CanvasRenderingContext2D, x: number, y: number, text: string, hot: boolean) {
  c.font = `400 10px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillStyle = hot ? '#fae299' : 'rgba(217,199,160,.82)';
  c.fillText(text, Math.round(x), Math.round(y + 4));
}
function deadTree(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.strokeStyle = '#0b0910'; c.lineCap = 'round';
  c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 22 * s); c.stroke();
  c.lineWidth = 1.5 * s;
  for (const [a, l] of [[-0.9, 14], [0.7, 12], [-0.3, 10], [1.1, 9]] as [number, number][]) { c.beginPath(); c.moveTo(x, y - 14 * s); c.lineTo(x + Math.sin(a) * l * s, y - 14 * s - Math.cos(a) * l * s); c.stroke(); }
  R(c, x - 6 * s, y - 1, 12 * s, 2, 'rgba(0,0,0,.4)');
}
function lanternPost(c: CanvasRenderingContext2D, L: Light[], x: number, y: number) {
  R(c, x - 3, y - 1, 7, 3, 'rgba(0,0,0,.4)');
  R(c, x - 1, y - 22, 2, 22, '#15131c');
  R(c, x - 3, y - 27, 6, 6, '#15131c'); R(c, x - 2, y - 26, 4, 4, '#ffd27a');
  L.push({ x, y: y - 24, r: 56, col: 'warm', a: 0.9 });
}
function gravestone(c: CanvasRenderingContext2D, x: number, y: number) {
  R(c, x - 3, y - 9, 7, 9, '#3a3648'); c.fillStyle = '#3a3648'; c.beginPath(); c.arc(x + 0.5, y - 9, 3.5, Math.PI, 0); c.fill();
  R(c, x - 1, y - 9, 3, 1, '#211e2a'); R(c, x, y - 11, 1, 5, '#211e2a'); R(c, x - 4, y, 9, 2, 'rgba(0,0,0,.4)');
}

// ---------- the services ----------
function appraiser(c: CanvasRenderingContext2D, L: Light[]) {
  // a narrow tower with a spire and an eye-shaped window, behind a small annex
  R(c, 50, 54, 34, 80, '#46425a'); R(c, 50, 54, 3, 80, 'rgba(255,255,255,.06)'); R(c, 80, 54, 4, 80, 'rgba(0,0,0,.25)');
  for (let r = 58; r < 134; r += 5) R(c, 50, r, 34, 1, 'rgba(0,0,0,.2)');
  c.fillStyle = '#2a2c48'; c.beginPath(); c.moveTo(46, 56); c.lineTo(67, 14); c.lineTo(88, 56); c.fill();
  c.strokeStyle = 'rgba(170,190,255,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(46, 56); c.lineTo(67, 14); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(67, 14); c.lineTo(88, 56); c.lineTo(72, 56); c.fill();
  R(c, 66, 6, 2, 9, '#8a82a0');
  c.fillStyle = '#120f1e'; c.beginPath(); c.ellipse(67, 82, 9, 6, 0, 0, Math.PI * 2); c.fill();      // the eye
  c.fillStyle = '#b58cff'; c.beginPath(); c.ellipse(67, 82, 7, 4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a1650'; c.beginPath(); c.arc(67, 82, 2.2, 0, Math.PI * 2); c.fill();
  L.push({ x: 67, y: 82, r: 34, col: 'arcane', a: 0.8 });
  win(c, L, 64, 104, true, 'arch');
  house(c, L, { x: 40, y: 110, w: 92, roofH: 34, wallH: 38, roof: '#251f3a', win: [10, 74], lit: [true, false], door: 46, seed: 3 });
}
function auction(c: CanvasRenderingContext2D, L: Light[]) {
  // a big gothic hall with a rose window over the doors and a bell tower at the back right
  R(c, 484, 44, 28, 66, '#46425a'); for (let r = 48; r < 110; r += 5) R(c, 484, r, 28, 1, 'rgba(0,0,0,.2)');
  c.fillStyle = '#2a2c48'; c.beginPath(); c.moveTo(480, 46); c.lineTo(498, 12); c.lineTo(516, 46); c.fill();
  c.strokeStyle = 'rgba(170,190,255,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(480, 46); c.lineTo(498, 12); c.stroke();
  R(c, 491, 54, 14, 14, '#141220'); c.fillStyle = '#8a7a4a'; c.beginPath(); c.arc(498, 64, 4, Math.PI, 0); c.fill(); R(c, 494, 64, 8, 2, '#8a7a4a');   // the bell
  const wy = house(c, L, { x: 400, y: 92, w: 116, roofH: 50, wallH: 46, gable: true, win: [10, 26, 84, 100], lit: [true, false, true, true], seed: 7 });
  // double doors and two dusk-red banners
  R(c, 447, wy + 22, 22, 24, '#1c1a24'); c.fillStyle = '#3a2618'; c.beginPath(); c.moveTo(449, wy + 46); c.lineTo(449, wy + 30); c.arc(458, wy + 30, 9, Math.PI, 0); c.lineTo(467, wy + 46); c.fill();
  R(c, 457.5, wy + 22, 1, 24, 'rgba(0,0,0,.4)');
  for (const bx of [432, 476]) { R(c, bx, wy + 4, 8, 20, '#6b3b62'); c.fillStyle = '#6b3b62'; c.beginPath(); c.moveTo(bx, wy + 24); c.lineTo(bx + 4, wy + 20); c.lineTo(bx + 8, wy + 24); c.fill(); R(c, bx + 3, wy + 9, 2, 6, '#d9a69c'); }
  L.push({ x: 458, y: wy + 30, r: 26, col: 'warm', a: 0.7 });
}
function merchant(c: CanvasRenderingContext2D, L: Light[]) {
  const wy = house(c, L, { x: 30, y: 318, w: 104, roofH: 42, wallH: 40, win: [12], lit: [true], door: 82, chimney: 14, seed: 11 });
  R(c, 44, wy + 8, 30, 14, '#1c1a24'); R(c, 46, wy + 10, 26, 10, '#f4c25e'); R(c, 58, wy + 10, 1, 10, '#1c1a24');   // a wide shop window
  L.push({ x: 59, y: wy + 15, r: 30, col: 'warm', a: 0.7 });
  for (let i = 0; i < 6; i++) R(c, 28 + i * 13, wy - 2, 13, 9, i % 2 ? '#3a2a30' : '#6b3b3b');   // a striped awning
  R(c, 28, wy + 7, 78, 1, 'rgba(0,0,0,.4)');
  // crates and barrels by the door
  R(c, 110, wy + 30, 12, 10, '#5a4030'); R(c, 110, wy + 30, 12, 1, '#7a5a40'); R(c, 120, wy + 26, 10, 9, '#4a3428');
  c.fillStyle = '#4a3020'; c.beginPath(); c.ellipse(20, wy + 36, 6, 7, 0, 0, Math.PI * 2); c.fill(); R(c, 14, wy + 33, 12, 1, '#2a1c14'); R(c, 14, wy + 39, 12, 1, '#2a1c14');
}
function forge(c: CanvasRenderingContext2D, L: Light[]) {
  R(c, 488, 268, 16, 40, '#3a3648'); R(c, 488, 268, 1, 40, 'rgba(170,190,255,.25)'); R(c, 486, 266, 20, 4, '#24222e');    // the big chimney
  const wy = house(c, L, { x: 404, y: 300, w: 110, roofH: 42, wallH: 44, roof: '#28232e', win: [10], lit: [false], seed: 13 });
  // the open furnace: orange light pours out
  R(c, 440, wy + 14, 30, 30, '#1c1a24'); R(c, 443, wy + 18, 24, 26, '#ff8a2a'); R(c, 447, wy + 26, 16, 18, '#ffd27a');
  c.fillStyle = '#ff8a2a'; c.beginPath(); c.arc(455, wy + 18, 12, Math.PI, 0); c.fill();
  L.push({ x: 455, y: wy + 30, r: 58, col: 'fire', a: 0.95 });
  // an anvil and a scrap pile outside
  R(c, 488, wy + 38, 16, 4, '#2a2a34'); R(c, 492, wy + 42, 8, 6, '#2a2a34'); R(c, 484, wy + 36, 6, 3, '#2a2a34');
  for (let i = 0; i < 7; i++) R(c, 408 + rnd(i, 4) * 26, wy + 44 + rnd(i, 5) * 6, 4 + rnd(i, 6) * 5, 3, ['#5a5f68', '#7a6a5a', '#3a3a44'][i % 3]);
}

// ---------- the four plots: a construction site at level 0, then the building grows with each level ----------
function site(c: CanvasRenderingContext2D, L: Light[], x: number, y: number, w: number, h: number) {
  const base = y + h;
  R(c, x + 4, y + h * 0.35 + 6, w, h * 0.65, 'rgba(0,0,0,.25)');
  R(c, x, y + h * 0.35, w, h * 0.65 - 4, '#262330');                         // the cleared ground and the foundation
  c.strokeStyle = '#4a4658'; c.lineWidth = 3; c.strokeRect(x + 4, y + h * 0.35 + 4, w - 8, h * 0.55);
  // half-built front wall, ragged on top
  const wy = base - 26;
  for (let s = x + 4; s < x + w - 4; s += 8) { const t = 10 + Math.round(rnd(s, 2) * 14); R(c, s, wy + 26 - t, 8, t, '#3e3b4c'); R(c, s, wy + 26 - t, 8, 1, 'rgba(255,255,255,.08)'); R(c, s + 7, wy + 26 - t, 1, t, 'rgba(0,0,0,.3)'); }
  // scaffolding: poles, two decks, cross braces
  c.strokeStyle = '#7a5a36'; c.lineWidth = 2;
  for (let s = x + 6; s <= x + w - 6; s += Math.max(18, (w - 12) / 4)) { c.beginPath(); c.moveTo(s, base); c.lineTo(s, y + 6); c.stroke(); }
  for (const dy of [0.32, 0.62]) { R(c, x + 4, y + h * dy, w - 8, 3, '#8a6a40'); R(c, x + 4, y + h * dy + 3, w - 8, 1, 'rgba(0,0,0,.4)'); }
  c.strokeStyle = 'rgba(122,90,54,.8)'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x + 8, y + h * 0.62); c.lineTo(x + w / 2, y + h * 0.32); c.moveTo(x + w / 2, y + h * 0.62); c.lineTo(x + w - 8, y + h * 0.32); c.stroke();
  // a crane with a stone hanging off it, blocks waiting on the ground, a work lamp
  R(c, x + w - 14, y - 6, 3, h * 0.5, '#5a4028'); R(c, x + w - 34, y - 6, 26, 3, '#5a4028');
  R(c, x + w - 32, y - 3, 1, 18, '#a89a80'); R(c, x + w - 36, y + 15, 9, 7, '#5a566a');
  for (let i = 0; i < 4; i++) R(c, x + 6 + i * 9, base - 8 - (i % 2) * 6, 8, 6, '#5a566a');
  R(c, x + 2, base - 18, 2, 18, '#3a2a1c'); R(c, x, base - 22, 6, 5, '#ffd27a');
  L.push({ x: x + 3, y: base - 20, r: 30, col: 'warm', a: 0.7 });
}
function training(c: CanvasRenderingContext2D, L: Light[], lv: number) {
  const x = 170, y = 322, w = 104, h = 116;
  if (!lv) return site(c, L, x, y, w, h);
  if (lv >= 2) house(c, L, { x: 182, y: 322, w: 80, roofH: 30, wallH: 28, win: [8, 62], lit: [true, true], door: 34, seed: 17 });   // stone barracks
  if (lv >= 3) {   // a watchtower with a banner
    R(c, 250, 300, 18, 70, '#3a3648'); c.fillStyle = '#1d1f33'; c.beginPath(); c.moveTo(246, 302); c.lineTo(259, 280); c.lineTo(272, 302); c.fill();
    R(c, 258, 270, 1, 12, '#8a82a0'); R(c, 259, 270, 10, 6, '#852e30'); win(c, L, 256, 318, true, 'arch');
  }
  // the yard: a fence, straw dummies, a weapon rack
  const yy = lv >= 2 ? 382 : 352;
  R(c, x, yy, w, 438 - yy, '#2a2620');
  c.strokeStyle = '#5a4028'; c.lineWidth = 2; c.strokeRect(x + 1, yy + 1, w - 2, 436 - yy);
  for (let s = x; s <= x + w; s += 10) R(c, s, yy - 3, 2, 6, '#5a4028');
  for (const dx of [22, 52]) { R(c, x + dx, yy + 18, 2, 18, '#5a4028'); R(c, x + dx - 7, yy + 22, 16, 2, '#5a4028'); c.fillStyle = '#a8864a'; c.beginPath(); c.arc(x + dx + 1, yy + 16, 5, 0, Math.PI * 2); c.fill(); R(c, x + dx - 3, yy + 22, 8, 10, '#a8864a'); }
  R(c, x + 78, yy + 14, 18, 2, '#5a4028'); for (let i = 0; i < 4; i++) R(c, x + 80 + i * 4, yy + 8, 1, 18, '#b8bcc8');
  L.push({ x: x + 50, y: yy + 30, r: 24, col: 'warm', a: 0.35 });
}
function inn(c: CanvasRenderingContext2D, L: Light[], lv: number) {
  if (!lv) return site(c, L, 530, 286, 116, 104);
  if (lv >= 2) house(c, L, { x: 526, y: 344, w: 40, roofH: 22, wallH: 26, roof: '#2a2420', win: [8], lit: [true], seed: 19 });   // a stable wing
  const x = lv >= 2 ? 556 : 530, w = lv >= 2 ? 92 : 116, top = lv >= 3 ? 256 : 286;
  const wy = house(c, L, { x, y: top, w, roofH: 40, wallH: 390 - top - 40, gable: lv >= 3, chimney: 10,
    win: lv >= 2 ? [8, 24, 62, 78] : [10, 30, 76, 96], lit: [true, true, false, true], door: lv >= 2 ? 40 : 52, seed: 23 });
  if (lv >= 3) { win(c, L, x + 8, wy + 40, true, 'arch'); win(c, L, x + 78, wy + 40, true, 'arch'); R(c, x - 2, wy + 32, w + 4, 2, '#2a2420'); }   // a third floor with a balcony rail
  // a hanging tankard sign
  R(c, x + w - 2, 360, 2, 8, '#2a2420'); R(c, x + w - 8, 366, 10, 9, '#8a6a3a'); R(c, x + w - 5, 368, 4, 5, '#f4c25e');
}
function library(c: CanvasRenderingContext2D, L: Light[], lv: number) {
  const x = 164, y = 112, w = 116, h = 112;
  if (!lv) return site(c, L, x, y, w, h);
  if (lv >= 2) {   // a tower with a spire
    R(c, 236, 96, 30, 60, '#3e3b4c'); for (let r = 100; r < 156; r += 5) R(c, 236, r, 30, 1, 'rgba(0,0,0,.2)');
    c.fillStyle = '#1d1f33'; c.beginPath(); c.moveTo(232, 98); c.lineTo(251, 62); c.lineTo(270, 98); c.fill(); win(c, L, 248, 112, true, 'arch');
  }
  if (lv >= 3) {   // a domed observatory that glows
    c.fillStyle = '#2d2850'; c.beginPath(); c.arc(196, 132, 18, Math.PI, 0); c.fill();
    c.fillStyle = '#8b5ad6'; c.beginPath(); c.arc(196, 132, 18, Math.PI * 1.35, Math.PI * 1.5); c.lineTo(196, 132); c.fill();
    R(c, 178, 132, 36, 4, '#3e3b4c'); L.push({ x: 196, y: 124, r: 40, col: 'arcane', a: 0.7 });
  }
  house(c, L, { x: 164, y: 136, w: 112, roofH: 42, wallH: 46, roof: '#1f2238', gable: true, win: [10, 26, 78, 94], lit: [true, true, true, false], door: 51, seed: 29 });
}
function treasury(c: CanvasRenderingContext2D, L: Light[], lv: number) {
  const x = 552, y = 92, w = 98, h = 96;
  if (!lv) return site(c, L, x, y, w, h);
  const wy = house(c, L, { x: 556, y: 100, w: 90, roofH: 36, wallH: 50, wall: '#46424f', roof: '#1e1c2a', win: [8, 76], lit: [false, false], arched: false, seed: 31 });
  // a heavy iron-banded door, gold behind it
  R(c, 588, wy + 18, 26, 32, '#1c1a24'); R(c, 590, wy + 20, 22, 30, '#2e2a30');
  for (const dy of [26, 36, 46]) R(c, 590, wy + dy, 22, 2, '#5a5662');
  R(c, 600, wy + 32, 3, 3, '#f1a934');
  if (lv >= 2) { for (const cx of [578, 618]) { R(c, cx, wy + 4, 6, 46, '#5a5662'); R(c, cx - 1, wy + 2, 8, 3, '#f1a934'); } }
  if (lv >= 3) {   // braziers by the door and a gold glow on the roof
    for (const bx of [572, 628]) { R(c, bx, wy + 40, 6, 10, '#2a2a34'); c.fillStyle = '#ffb347'; c.beginPath(); c.arc(bx + 3, wy + 38, 3.5, 0, Math.PI * 2); c.fill(); L.push({ x: bx + 3, y: wy + 36, r: 26, col: 'fire', a: 0.8 }); }
    c.fillStyle = '#f1a934'; c.beginPath(); c.arc(601, 104, 10, Math.PI, 0); c.fill(); L.push({ x: 601, y: 98, r: 30, col: 'warm', a: 0.6 });
  }
}

// ---------- the static picture, cached until a building changes ----------
let cache: { key: string; cv: HTMLCanvasElement; lights: Light[]; sprites: Partial<Record<TownSpotId, HTMLCanvasElement>>; sil: Partial<Record<TownSpotId, HTMLCanvasElement>> } | null = null;
const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv; };

function ground(c: CanvasRenderingContext2D) {
  R(c, 0, 0, W, H, '#1a221d');
  for (let i = 0; i < 900; i++) R(c, rnd(i, 1) * W, rnd(i, 2) * H, 2, 1, rnd(i, 3) > 0.5 ? '#222b24' : '#131813');
  // the streets: a curb, then cobblestones
  const stroke = (cc: CanvasRenderingContext2D, extra: number) => {
    for (const r of ROADS) { cc.lineWidth = r.w + extra; cc.lineCap = 'round'; cc.lineJoin = 'round'; cc.beginPath(); r.pts.forEach(([x, y], i) => (i ? cc.lineTo(x, y) : cc.moveTo(x, y))); cc.stroke(); }
    cc.beginPath(); cc.arc(PLAZA.x, PLAZA.y, PLAZA.r + extra / 2, 0, Math.PI * 2); cc.fill();
  };
  c.strokeStyle = c.fillStyle = '#2a2634'; stroke(c, 6);
  const st = mk(), s = st.getContext('2d')!;
  R(s, 0, 0, W, H, '#45415a');
  for (let y = 0, k = 0; y < H; y += 5, k++) for (let x = -(k % 2) * 4; x < W; x += 8) {
    const v = rnd(x * 0.37 + y, k);
    R(s, x + 1, y + 1, 6, 3, v > 0.66 ? '#57526c' : v > 0.33 ? '#4e4a62' : '#454158');
    R(s, x + 1, y + 4, 6, 1, 'rgba(0,0,0,.35)');
  }
  s.globalCompositeOperation = 'destination-in'; s.strokeStyle = s.fillStyle = '#000'; stroke(s, 0);
  c.drawImage(st, 0, 0);
  // the plaza: a ring of larger flagstones around the fountain
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1;
  for (const rr of [44, 58]) { c.beginPath(); c.arc(PLAZA.x, PLAZA.y, rr, 0, Math.PI * 2); c.stroke(); }
}
function ridge(c: CanvasRenderingContext2D) {
  // dark rock across the top, broken by the portal's crypt in the middle
  c.fillStyle = '#100d18'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, 30);
  for (let x = W; x >= 0; x -= 14) c.lineTo(x, 34 + rnd(x, 8) * 26 + (Math.abs(x - 334) < 70 ? 30 : 0));
  c.closePath(); c.fill();
  for (let i = 0; i < 60; i++) R(c, rnd(i, 9) * W, rnd(i, 10) * 40, 3, 2, '#1a1626');
}
function portalFrame(c: CanvasRenderingContext2D, L: Light[]) {
  // the crypt: steps, a pointed arch of black stone with teeth, skulls, chains and two braziers
  for (let i = 0; i < 3; i++) R(c, 302 - i * 4, 112 + i * 4, 64 + i * 8, 4, ['#2a2734', '#322e3e', '#3a3648'][i]);
  const arch = (o: number) => { c.beginPath(); c.moveTo(288 + o, 114); c.lineTo(288 + o, 52); c.quadraticCurveTo(288 + o, 18 + o, 334, 4 + o * 1.3); c.quadraticCurveTo(380 - o, 18 + o, 380 - o, 52); c.lineTo(380 - o, 114); c.closePath(); };
  c.fillStyle = '#2a2638'; arch(0); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(334, 4); c.quadraticCurveTo(380, 18, 380, 52); c.lineTo(380, 114); c.lineTo(366, 114); c.lineTo(366, 52); c.fill();
  for (let a = 0; a < 9; a++) {   // stone teeth around the arch
    const t = a / 8, px = 288 + t * 92, py = 52 - Math.sin(t * Math.PI) * 44;
    c.fillStyle = '#3a3550'; c.beginPath(); c.moveTo(px - 4, py + 2); c.lineTo(px, py - 9); c.lineTo(px + 4, py + 2); c.fill();
  }
  c.fillStyle = '#05030a'; arch(10); c.fill();                       // the opening (the vortex is drawn per frame)
  for (const sx of [292, 368]) { c.fillStyle = '#c7b18c'; c.beginPath(); c.arc(sx + 4, 62, 4, 0, Math.PI * 2); c.fill(); R(c, sx + 2, 62, 2, 2, '#100d18'); R(c, sx + 5, 62, 2, 2, '#100d18'); R(c, sx + 2, 65, 5, 2, '#aa8667'); }
  c.strokeStyle = '#2a2a32'; c.lineWidth = 1.5; for (const sx of [294, 374]) { c.beginPath(); c.moveTo(sx, 70); c.quadraticCurveTo(sx + (sx < 334 ? 6 : -6), 92, sx, 108); c.stroke(); }
  for (const bx of [274, 386]) { R(c, bx, 96, 10, 14, '#22202a'); R(c, bx - 2, 94, 14, 3, '#2a2834'); L.push({ x: bx + 5, y: 88, r: 34, col: 'arcane', a: 0.8 }); }
  // graves and dead trees around the crypt
  for (const [gx, gy] of [[200, 96], [212, 106], [190, 110], [414, 74], [428, 82], [442, 72]] as Pt[]) gravestone(c, gx, gy);
  deadTree(c, 222, 84, 1.1); deadTree(c, 462, 80, 1); deadTree(c, 16, 252, 0.9); deadTree(c, 654, 300, 1); deadTree(c, 646, 452, 0.9);
}
function fillers(c: CanvasRenderingContext2D, L: Light[]) {
  house(c, L, { x: 52, y: 214, w: 74, roofH: 28, wallH: 26, win: [10, 54], seed: 37 });
  house(c, L, { x: 32, y: 420, w: 84, roofH: 28, wallH: 30, win: [12, 60], door: 36, seed: 41 });
  house(c, L, { x: 404, y: 414, w: 92, roofH: 28, wallH: 30, win: [10, 70], door: 40, chimney: 60, seed: 43 });
  house(c, L, { x: 540, y: 412, w: 90, roofH: 28, wallH: 30, win: [12, 66], seed: 47 });
  // a well and a cart on the east street
  c.fillStyle = '#3a3648'; c.beginPath(); c.arc(600, 274, 7, 0, Math.PI * 2); c.fill(); c.fillStyle = '#0a0814'; c.beginPath(); c.arc(600, 274, 4, 0, Math.PI * 2); c.fill();
  R(c, 592, 262, 2, 10, '#3a2a1c'); R(c, 606, 262, 2, 10, '#3a2a1c'); R(c, 590, 260, 20, 3, '#3a2a1c');
}
function fountainBase(c: CanvasRenderingContext2D) {
  const { x, y } = PLAZA;
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x + 3, y + 5, 34, 22, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#4a4658'; c.beginPath(); c.ellipse(x, y, 34, 22, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a2834'; c.beginPath(); c.ellipse(x, y, 29, 18, 0, 0, Math.PI * 2); c.fill();
}
function build(levels: Record<CityId, number>) {
  const cv = mk(), c = cv.getContext('2d')!, L: Light[] = [];
  c.imageSmoothingEnabled = false;
  ground(c); ridge(c); portalFrame(c, L); fillers(c, L); fountainBase(c);
  for (const p of LANTERNS) lanternPost(c, L, p[0], p[1]);
  // each clickable building also gets its own layer, for the hover glow
  const sprites: Partial<Record<TownSpotId, HTMLCanvasElement>> = {};
  const draw = (id: TownSpotId, f: (cc: CanvasRenderingContext2D, LL: Light[]) => void) => {
    const sp = mk(), s = sp.getContext('2d')!; f(s, L); c.drawImage(sp, 0, 0); sprites[id] = sp;
  };
  // back to front
  draw('appraiser', appraiser); draw('auction', auction); draw('treasury', (cc, LL) => treasury(cc, LL, levels.treasury));
  draw('library', (cc, LL) => library(cc, LL, levels.library));
  draw('salvage', forge); draw('inn', (cc, LL) => inn(cc, LL, levels.inn));
  draw('merchant', merchant); draw('training', (cc, LL) => training(cc, LL, levels.training));
  for (const s of TOWN_SPOTS) if (s.id !== 'portal') { sign(c, s.sign[0], s.sign[1], s.name, !levels[s.id as CityId] && s.id in levels); }
  sign(c, 334, 18, 'Dungeon Portal', false);
  return { cv, lights: L, sprites };
}

// ---------- per frame: the portal, the fountain, smoke, people, the night, the signs, the hover glow ----------
let lightCv: HTMLCanvasElement | null = null, haloCv: HTMLCanvasElement | null = null;
const walkers = WALKS.map((p, i) => ({ path: p, d: rnd(i, 20) * 200, dir: i % 2 ? 1 : -1, lamp: i % 3 === 0 }));
let lastT = 0;
function pathPos(p: Pt[], d: number): [number, number, number] {
  let len = 0; const seg: number[] = [];
  for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); seg.push(l); len += l; }
  let t = ((d % (2 * len)) + 2 * len) % (2 * len); const back = t > len; if (back) t = 2 * len - t;
  for (let i = 0; i < seg.length; i++) { if (t <= seg[i]) { const k = t / seg[i]; return [p[i][0] + (p[i + 1][0] - p[i][0]) * k, p[i][1] + (p[i + 1][1] - p[i][1]) * k, back ? -1 : 1]; } t -= seg[i]; }
  return [p[p.length - 1][0], p[p.length - 1][1], 1];
}

export function drawTownMap(c: CanvasRenderingContext2D) {
  const g = S.g;
  const levels = { training: g.furniture.training ?? 0, inn: g.furniture.inn ?? 0, library: g.furniture.library ?? 0, treasury: g.furniture.treasury ?? 0 } as Record<CityId, number>;
  const key = JSON.stringify(levels);
  if (!cache || cache.key !== key) cache = { key, ...build(levels), sil: {} };
  const t = performance.now() / 1000, dt = Math.min(0.1, lastT ? t - lastT : 0); lastT = t;
  c.imageSmoothingEnabled = false;
  c.drawImage(cache.cv, 0, 0);
  const dyn: Light[] = [];
  // the portal's vortex: crimson and violet, turning, sucking motes in
  c.save(); c.beginPath(); c.moveTo(298, 114); c.lineTo(298, 52); c.quadraticCurveTo(298, 31, 334, 17); c.quadraticCurveTo(370, 31, 370, 52); c.lineTo(370, 114); c.closePath(); c.clip();
  const vg = c.createRadialGradient(334, 70, 2, 334, 70, 50); vg.addColorStop(0, '#05030a'); vg.addColorStop(0.35, '#3a0c2a'); vg.addColorStop(0.7, '#6a2a8a'); vg.addColorStop(1, '#14061e');
  c.fillStyle = vg; c.fillRect(288, 10, 92, 110);
  for (let k = 0; k < 3; k++) {
    c.strokeStyle = k === 1 ? 'rgba(210,60,90,.75)' : 'rgba(150,100,230,.6)'; c.lineWidth = 2; c.beginPath();
    for (let a = 0; a < 7; a += 0.2) { const r = 4 + a * 6, ang = a - t * (1.4 + k * 0.3) + k * 2.1; const px = 334 + Math.cos(ang) * r, py = 70 + Math.sin(ang) * r * 1.15; a ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
  }
  for (let i = 0; i < 10; i++) { const ph = (t * 0.4 + i / 10) % 1, ang = i * 2.4 + t; const r = 46 * (1 - ph); R(c, 334 + Math.cos(ang) * r, 70 + Math.sin(ang) * r, 2, 2, `rgba(250,226,153,${ph})`); }
  c.restore();
  // braziers: violet flames
  for (const bx of [274, 386]) { const f = Math.sin(t * 9 + bx) * 1.5; c.fillStyle = '#8b5ad6'; c.beginPath(); c.moveTo(bx + 1, 95); c.quadraticCurveTo(bx + 5, 82 + f, bx + 9, 95); c.fill(); c.fillStyle = '#e2c8ff'; c.beginPath(); c.moveTo(bx + 3, 95); c.quadraticCurveTo(bx + 5, 88 + f, bx + 7, 95); c.fill(); }
  dyn.push({ x: 334, y: 68, r: 96 + Math.sin(t * 2) * 6, col: 'arcane', a: 0.95 });
  // the fountain: water in the basin, a statue, spouts
  const { x: fx, y: fy } = PLAZA;
  c.fillStyle = '#1f3a66'; c.beginPath(); c.ellipse(fx, fy, 27, 16, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 3; i++) { const p = (t * 0.5 + i / 3) % 1; c.strokeStyle = `rgba(129,193,200,${0.45 * (1 - p)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(fx, fy, 6 + p * 20, 4 + p * 11, 0, 0, Math.PI * 2); c.stroke(); }
  R(c, fx - 4, fy - 6, 8, 8, '#4a4658'); R(c, fx - 2, fy - 18, 4, 12, '#5a566a'); c.fillStyle = '#5a566a'; c.beginPath(); c.arc(fx, fy - 20, 3, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 6; i++) { const p = (t * 1.2 + i / 6) % 1; R(c, fx - 6 + i * 2.4, fy - 16 + p * 14, 1, 2, `rgba(180,220,255,${1 - p})`); }
  dyn.push({ x: fx, y: fy, r: 36, col: 'cold', a: 0.35 });
  // smoke from the forge and the chimneys
  for (const [sx, sy] of [[496, 262], [52, 304], [470, 404]] as Pt[]) for (let i = 0; i < 4; i++) { const p = (t * 0.25 + i / 4) % 1; c.fillStyle = `rgba(60,56,72,${0.5 * (1 - p)})`; c.beginPath(); c.arc(sx + Math.sin(p * 6 + i) * 4, sy - p * 34, 3 + p * 6, 0, Math.PI * 2); c.fill(); }
  for (let i = 0; i < 5; i++) { const p = (t * 0.9 + i / 5) % 1; R(c, 494 + Math.sin(i * 3 + t) * 6, 262 - p * 30, 1, 1, `rgba(255,170,80,${1 - p})`); }
  // people out late
  for (const w of walkers) {
    w.d += dt * 13;
    const [px, py, face] = pathPos(w.path, w.d);
    const bob = Math.floor(t * 6 + w.d) % 2;
    R(c, px - 3, py + 1, 7, 2, 'rgba(0,0,0,.4)');
    R(c, px - 2, py - 8 + bob * 0, 5, 9, '#24203a'); R(c, px - 2, py - 10, 5, 3, '#1a1628'); R(c, px + (face > 0 ? 1 : -1), py - 8, 1, 1, '#c7b18c');
    if (w.lamp) { R(c, px + 3 * face, py - 4, 2, 3, '#ffd27a'); dyn.push({ x: px + 3 * face, y: py - 3, r: 20, col: 'warm', a: 0.7 }); }
  }
  // the night: dark everywhere, light where there are lamps, candles, fire and magic
  if (!lightCv) lightCv = mk();
  const l = lightCv.getContext('2d')!;
  l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, W, H);
  l.fillStyle = 'rgba(8,10,28,.52)'; l.fillRect(0, 0, W, H);   // moonlit night: the streets still read
  l.globalCompositeOperation = 'destination-out';
  const all = cache.lights.concat(dyn);
  all.forEach((p, i) => {
    const fl = p.col === 'cold' ? 1 : 1 + Math.sin(t * (7 + (i % 5)) + i) * 0.06 + Math.sin(t * 17 + i * 3) * 0.03;
    const r = p.r * fl, gr = l.createRadialGradient(p.x, p.y, 1, p.x, p.y, r);
    gr.addColorStop(0, `rgba(0,0,0,${p.a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = gr; l.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  });
  c.drawImage(lightCv, 0, 0);
  // coloured light on top: warm candles and lanterns, orange fire, violet magic
  c.save(); c.globalCompositeOperation = 'lighter';
  const COL = { warm: '255,170,80', fire: '255,120,40', arcane: '150,80,230', cold: '90,140,200' };
  for (const p of all) { const r = p.r * 0.7, gr = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, r); gr.addColorStop(0, `rgba(${COL[p.col]},${0.22 * p.a})`); gr.addColorStop(1, `rgba(${COL[p.col]},0)`); c.fillStyle = gr; c.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
  c.restore();
  // the hover glow: the building lights up along its outline
  const hot = townHover.id;
  if (hot) {
    const sp = cache.sprites[hot];
    c.save();
    if (sp) {   // a soft halo just outside its outline, breathing a little, and the faintest lift on the building
      const si = cache.sil[hot] ?? (cache.sil[hot] = (() => { const cv = mk(), s2 = cv.getContext('2d')!; s2.drawImage(sp, 0, 0); s2.globalCompositeOperation = 'source-in'; s2.fillStyle = '#fae299'; s2.fillRect(0, 0, W, H); return cv; })());
      if (!haloCv) haloCv = mk();
      const h = haloCv.getContext('2d')!;
      h.globalCompositeOperation = 'source-over'; h.clearRect(0, 0, W, H); h.filter = 'blur(4px)'; h.drawImage(si, 0, 0); h.drawImage(si, 0, 0); h.filter = 'none';
      h.globalCompositeOperation = 'destination-out'; h.drawImage(si, 0, 0);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(t * 4) * 0.12; c.drawImage(haloCv, 0, 0);
      c.globalAlpha = 0.06; c.drawImage(si, 0, 0);
    }
    else { const s = TOWN_SPOTS.find(x => x.id === hot)!; c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(334, 66, 10, 334, 66, 80); gr.addColorStop(0, 'rgba(180,120,255,.45)'); gr.addColorStop(1, 'rgba(180,120,255,0)'); c.fillStyle = gr; c.fillRect(s.x - 20, s.y - 10, s.w + 40, s.h + 20); }
    c.restore();
  }
  // the names on their signs (subtle; the one under the mouse brightens)
  for (const s of TOWN_SPOTS) signText(c, s.sign[0], s.sign[1], s.name, s.id === hot);
  void N;
}
