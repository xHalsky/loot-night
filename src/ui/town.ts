// The MMO city hub, drawn on the monitor. All hub actions happen here (docs/design/city.md):
// click the buttons by the buildings, build on empty plots, enter the dungeon portal.
import { T } from '../config/tuning';
import { S, N, RARITIES, type BagEntry } from '../core/state';
import { CITY_BY_ID, type CityId } from '../data/city';
import { TRADE_CHAT } from '../data/content';
import { MAP_INFO } from '../data/items';
import { RARITY_COLOR } from '../data/items';
import { entryName, entryValue } from '../systems/loot';
import { vendorValue, salvageYield, listValue } from '../systems/town';
import { icon, glyph, ABILITY_GLYPHS } from './icons';
import { ABILITIES, HOTKEYS, HERO_COLORS } from '../data/heroes';
import { abilitiesLocked, abilityUnlocked } from '../systems/battle';
import { maxHp } from '../systems/stats';

const FONT = '"Pixelify Sans", monospace';
export type ServiceId = 'appraiser' | 'auction' | 'merchant' | 'salvage';

// Layout (monitor pixels, 616x352). Back row stands on y=150, plots on y=346.
export const SERVICES: { id: ServiceId | 'portal'; label: string; btn: string; x: number; w: number; base: number }[] = [
  { id: 'appraiser', label: 'Appraiser', btn: 'Identify', x: 10, w: 104, base: 150 },
  { id: 'auction', label: 'Auction House', btn: 'Trade', x: 120, w: 140, base: 150 },
  { id: 'portal', label: 'Dungeon Portal', btn: 'Enter dungeon', x: 266, w: 86, base: 150 },
  { id: 'merchant', label: 'Merchant', btn: 'Sell', x: 358, w: 120, base: 150 },
  { id: 'salvage', label: 'Salvage Forge', btn: 'Salvage', x: 484, w: 122, base: 150 },
];
export const PLOTS: { id: CityId; x: number; w: number; base: number }[] = [
  { id: 'training', x: 10, w: 140, base: 346 },
  { id: 'inn', x: 160, w: 140, base: 346 },
  { id: 'library', x: 316, w: 140, base: 346 },
  { id: 'treasury', x: 466, w: 140, base: 346 },
];

const lvl = (id: CityId) => S.g.furniture[id] ?? 0;

function txt(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center', weight = 400) {
  c.font = `${weight} ${size}px ${FONT}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(s, x, y);
}
function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function roof(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string, dark: string) {
  c.fillStyle = col; c.beginPath(); c.moveTo(x - 6, y + h); c.lineTo(x + w / 2, y); c.lineTo(x + w + 6, y + h); c.closePath(); c.fill();
  c.strokeStyle = dark; c.lineWidth = 1;
  for (let i = 1; i < 4; i++) { const yy = y + (h * i) / 4; const half = ((w + 12) / 2) * (i / 4); c.beginPath(); c.moveTo(x + w / 2 - half, yy); c.lineTo(x + w / 2 + half, yy); c.stroke(); }
}
function windows(c: CanvasRenderingContext2D, x: number, y: number, w: number, rows: number, lit = '#ffd27a') {
  for (let r = 0; r < rows; r++) for (let i = 0; i < 3; i++) { rect(c, x + 10 + i * ((w - 20) / 3) + 2, y + 8 + r * 24, 10, 12, lit); rect(c, x + 10 + i * ((w - 20) / 3) + 6, y + 8 + r * 24, 2, 12, '#5a3a20'); }
}
function timberHouse(c: CanvasRenderingContext2D, x: number, base: number, w: number, floors: number, wall: string, roofCol: string, roofDark: string) {
  const fh = 26, h = floors * fh;
  rect(c, x, base - 10, w, 10, '#5a5a66');                       // stone foundation
  rect(c, x + 2, base - 10 - h, w - 4, h, wall);
  c.strokeStyle = '#4a3020'; c.lineWidth = 2;
  for (let f = 0; f <= floors; f++) { c.beginPath(); c.moveTo(x + 2, base - 10 - f * fh); c.lineTo(x + w - 2, base - 10 - f * fh); c.stroke(); }
  for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(x + 2 + (i * (w - 4)) / 4, base - 10); c.lineTo(x + 2 + (i * (w - 4)) / 4, base - 10 - h); c.stroke(); }
  windows(c, x, base - 10 - h, w, floors);
  rect(c, x + w / 2 - 8, base - 30, 16, 20, '#3a2414');
  roof(c, x, base - 10 - h - 30, w, 30, roofCol, roofDark);
  return base - 10 - h - 30;
}
function banner(c: CanvasRenderingContext2D, x: number, y: number, col: string, t: number) {
  rect(c, x, y, 2, 26, '#3a2a1a');
  const wave = Math.sin(t * 3 + x) * 2;
  c.fillStyle = col; c.beginPath(); c.moveTo(x + 2, y + 2); c.lineTo(x + 16 + wave, y + 5); c.lineTo(x + 2, y + 12); c.fill();
}
function signBoard(c: CanvasRenderingContext2D, x: number, y: number, label: string) {
  rect(c, x - 22, y, 44, 12, '#6a4a2a'); rect(c, x - 21, y + 1, 42, 10, '#8a6a3a');
  txt(c, label, x, y + 9, 8, '#2a1a0a');
}

// ---------- the service buildings ----------
function drawAppraiser(c: CanvasRenderingContext2D, x: number, base: number, w: number, t: number) {
  rect(c, x + 22, base - 100, w - 44, 90, '#6a6a8a'); rect(c, x + 22, base - 10, w - 44, 10, '#4a4a5a');
  c.strokeStyle = '#4a4a6a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x + 22, base - 20 - i * 14); c.lineTo(x + w - 22, base - 20 - i * 14); c.stroke(); }
  roof(c, x + 22, base - 140, w - 44, 40, '#5b3aa8', '#3a2470');
  const glow = 0.6 + Math.sin(t * 2) * 0.3;
  c.fillStyle = `rgba(200,160,255,${glow})`; c.beginPath(); c.arc(x + w / 2, base - 70, 10, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a1a4a'; c.beginPath(); c.arc(x + w / 2, base - 70, 4, 0, Math.PI * 2); c.fill();
  rect(c, x + w / 2 - 7, base - 30, 14, 20, '#2a1a3a');
}
function drawAuction(c: CanvasRenderingContext2D, x: number, base: number, w: number, t: number) {
  rect(c, x, base - 8, w, 8, '#bfb8a8'); rect(c, x + 6, base - 14, w - 12, 6, '#d8d0bc');
  rect(c, x + 10, base - 84, w - 20, 70, '#e2dccb');
  for (let i = 0; i < 5; i++) { rect(c, x + 16 + i * ((w - 40) / 4), base - 80, 8, 66, '#f4efe2'); rect(c, x + 16 + i * ((w - 40) / 4), base - 80, 2, 66, '#c9c2b0'); }
  c.fillStyle = '#c9a46a'; c.beginPath(); c.moveTo(x + 4, base - 84); c.lineTo(x + w / 2, base - 112); c.lineTo(x + w - 4, base - 84); c.fill();
  c.fillStyle = '#e8c06a'; c.beginPath(); c.arc(x + w / 2, base - 112, 16, Math.PI, 0); c.fill();
  txt(c, 'AH', x + w / 2, base - 90, 10, '#5a3a10', 'center', 600);
  rect(c, x + w / 2 - 10, base - 44, 20, 30, '#3a2a14');
  banner(c, x + 6, base - 120, '#2f6fed', t); banner(c, x + w - 8, base - 120, '#2f6fed', t);
}
function drawPortal(c: CanvasRenderingContext2D, x: number, base: number, w: number, t: number) {
  rect(c, x + 4, base - 100, 16, 100, '#5a5a6a'); rect(c, x + w - 20, base - 100, 16, 100, '#5a5a6a');
  c.fillStyle = '#5a5a6a'; c.beginPath(); c.arc(x + w / 2, base - 96, w / 2 - 4, Math.PI, 0); c.lineTo(x + w - 20, base - 96); c.arc(x + w / 2, base - 96, w / 2 - 20, 0, Math.PI, true); c.fill();
  const g = c.createRadialGradient(x + w / 2, base - 56, 4, x + w / 2, base - 56, 46);
  const pulse = 0.55 + Math.sin(t * 2.5) * 0.15;
  g.addColorStop(0, `rgba(230,200,255,${pulse + 0.3})`); g.addColorStop(0.5, `rgba(140,80,255,${pulse})`); g.addColorStop(1, 'rgba(60,20,120,0.8)');
  c.fillStyle = g; c.beginPath(); c.ellipse(x + w / 2, base - 62, w / 2 - 20, 58, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(x + w / 2, base - 62, (w / 2 - 26) * Math.abs(Math.sin(t)), 40, t, 0, Math.PI * 1.5); c.stroke();
  for (let i = 0; i < 4; i++) { const yy = base - 90 + i * 20; rect(c, x + 9, yy, 6, 3, '#9a7aff'); rect(c, x + w - 15, yy, 6, 3, '#9a7aff'); }
}
function drawMerchant(c: CanvasRenderingContext2D, x: number, base: number, w: number) {
  timberHouse(c, x + 10, base, w - 20, 2, '#d8c49a', '#8a3a2a', '#5a2418');
  // market stall awning in front
  for (let i = 0; i < 6; i++) rect(c, x + 4 + i * ((w - 8) / 6), base - 46, (w - 8) / 6, 10, i % 2 ? '#f2f2f2' : '#c0392b');
  rect(c, x + 6, base - 36, 4, 36, '#5a3a20'); rect(c, x + w - 10, base - 36, 4, 36, '#5a3a20');
  rect(c, x + 14, base - 16, 24, 14, '#8a5a2a'); rect(c, x + w - 38, base - 16, 24, 14, '#8a5a2a');
  c.fillStyle = '#f2b84b'; c.beginPath(); c.arc(x + 26, base - 18, 4, 0, Math.PI * 2); c.fill();
}
function drawForge(c: CanvasRenderingContext2D, x: number, base: number, w: number, t: number) {
  rect(c, x + 6, base - 70, w - 12, 70, '#6a625a'); rect(c, x + 6, base - 72, w - 12, 6, '#4a423a');
  c.strokeStyle = '#4a423a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x + 6, base - 12 - i * 14); c.lineTo(x + w - 6, base - 12 - i * 14); c.stroke(); }
  rect(c, x + w - 34, base - 112, 20, 42, '#5a524a');
  for (let i = 0; i < 4; i++) { const p = ((t * 0.5 + i * 0.25) % 1); c.fillStyle = `rgba(160,160,170,${0.5 * (1 - p)})`; c.beginPath(); c.arc(x + w - 24 + Math.sin(p * 6) * 6, base - 116 - p * 40, 6 + p * 8, 0, Math.PI * 2); c.fill(); }
  const f = 0.7 + Math.sin(t * 9) * 0.2;
  rect(c, x + 20, base - 40, 30, 30, `rgba(255,${Math.round(120 + f * 60)},40,${f})`);
  rect(c, x + 62, base - 22, 28, 8, '#2a2a30'); rect(c, x + 70, base - 14, 12, 14, '#2a2a30');
}

// ---------- the buildable plots ----------
function drawPlot(c: CanvasRenderingContext2D, id: CityId, x: number, base: number, w: number, t: number) {
  const L = lvl(id);
  if (L === 0) {
    rect(c, x + 6, base - 22, w - 12, 18, '#6a5236');
    for (let i = 0; i < 6; i++) { rect(c, x + 8 + i * ((w - 20) / 5), base - 34, 4, 30, '#8a6a3a'); }
    rect(c, x + 8, base - 30, w - 16, 3, '#8a6a3a');
    rect(c, x + w / 2 - 1, base - 58, 3, 30, '#5a3a20'); signBoard(c, x + w / 2, base - 62, 'FOR SALE');
    return;
  }
  if (id === 'training') {
    rect(c, x + 6, base - 16, w - 12, 16, '#7a6a4a');
    const dummy = (dx: number) => { rect(c, x + dx, base - 46, 4, 32, '#6a4a2a'); rect(c, x + dx - 8, base - 40, 20, 4, '#6a4a2a'); c.fillStyle = '#c9a46a'; c.beginPath(); c.arc(x + dx + 2, base - 50, 7, 0, Math.PI * 2); c.fill(); };
    dummy(18); dummy(44);
    if (L >= 2) { rect(c, x + 66, base - 56, 60, 40, '#a07a4a'); c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(x + 62, base - 56); c.lineTo(x + 96, base - 80); c.lineTo(x + 130, base - 56); c.fill(); }
    if (L >= 3) { rect(c, x + 66, base - 96, 60, 40, '#8a8a96'); for (let i = 0; i < 4; i++) rect(c, x + 66 + i * 16, base - 104, 10, 8, '#8a8a96'); banner(c, x + 94, base - 132, '#c0392b', t); }
    for (let i = 0; i < 3; i++) rect(c, x + 8 + i * 6, base - 30, 2, 16, '#cfd6e4');
  } else if (id === 'inn') {
    const top = timberHouse(c, x + 14, base, w - 28, L, '#e8d4a8', '#6a4a2a', '#4a3018');
    rect(c, x + w - 30, base - 60, 18, 14, '#8a6a3a'); txt(c, 'INN', x + w - 21, base - 50, 7, '#2a1a0a');
    if (L >= 3) { banner(c, x + 20, top - 20, '#f2b84b', t); rect(c, x + 14, base - 64, w - 28, 3, '#5a3a20'); }
    const lamp = 0.6 + Math.sin(t * 4) * 0.2; c.fillStyle = `rgba(255,210,120,${lamp})`; c.beginPath(); c.arc(x + 20, base - 40, 4, 0, Math.PI * 2); c.fill();
  } else if (id === 'library') {
    rect(c, x + 14, base - 50, w - 28, 50, '#b8b0c8'); rect(c, x + 14, base - 52, w - 28, 4, '#8a82a0');
    for (let i = 0; i < 4; i++) rect(c, x + 24 + i * 24, base - 40, 10, 16, '#ffe9a8');
    roof(c, x + 14, base - 80, w - 28, 28, '#3d5a9a', '#24386a');
    if (L >= 2) { rect(c, x + w - 44, base - 120, 26, 70, '#a8a0b8'); rect(c, x + w - 38, base - 104, 14, 14, '#ffe9a8'); }
    if (L >= 3) { c.fillStyle = '#4f7ad8'; c.beginPath(); c.arc(x + w - 31, base - 120, 16, Math.PI, 0); c.fill(); for (let i = 0; i < 3; i++) rect(c, x + w - 38 + i * 6, base - 130 + (i % 2) * 4, 2, 2, '#fff'); }
    rect(c, x + w / 2 - 6, base - 24, 12, 24, '#3a2a4a');
  } else {
    rect(c, x + 18, base - 54, w - 36, 54, '#9a8a6a'); rect(c, x + 18, base - 58, w - 36, 6, '#c9a46a');
    rect(c, x + w / 2 - 12, base - 34, 24, 34, '#4a4a52'); c.strokeStyle = '#2a2a30'; c.lineWidth = 2; c.strokeRect(x + w / 2 - 10, base - 32, 20, 30);
    if (L >= 2) { rect(c, x + 18, base - 58, w - 36, 3, '#f2c46b'); rect(c, x + 22, base - 50, 8, 40, '#c9a46a'); rect(c, x + w - 30, base - 50, 8, 40, '#c9a46a'); }
    if (L >= 3) { const g = c.createLinearGradient(0, base - 100, 0, base - 58); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#c98a1a'); c.fillStyle = g; c.beginPath(); c.arc(x + w / 2, base - 58, 34, Math.PI, 0); c.fill(); banner(c, x + 24, base - 96, '#f2b84b', t); banner(c, x + w - 28, base - 96, '#f2b84b', t); }
  }
  // level pips
  for (let i = 0; i < 3; i++) rect(c, x + w - 30 + i * 8, base - 8, 6, 6, i < L ? '#f2c46b' : '#3a2a1a');
}

// ---------- other players on the plaza: some stand, some roam; one chat bubble at a time ----------
const NAMES = ['Kubson', 'xXBartekXx', 'Wiktor', 'GoldSeller99', 'Ania_Heals', 'LeeroyPL', 'Zbyszek', 'DarkLord2009', 'ImNotAfk'];
const COLORS = ['#d9534f', '#6fcf7f', '#6aa8ff', '#f2b84b', '#c98aff', '#ff9a4d', '#9ad9d9', '#555', '#e8e4d4'];
const GUILDS = ['<Night Owls>', '<Loot Goblins>', '', '<Night Owls>', '<Heal Me Pls>', '', '<Loot Goblins>', '<Edgy>', ''];
const PHRASES = ['LF2M healer, no noobs', 'WTB [Monster of Haste]', 'inv pls', 'gz!', 'afk bio', 'brb gf', 'selling portals 5g', 'anyone for raid?',
  'ninja looted my sword >:(', 'whats the drop rate on legendaries?', 'need carry pls', 'lagggg', '/dance', 'duel me noob', 'first time?', 'lol',
  'who is pulling??', 'is it reset yet', 'Sunday raid, must have Zyn', '1 more floor then bed', 'my wife thinks I am working'];
interface Plr { name: string; color: string; guild: string; x: number; y: number; tx: number; ty: number; wait: number; roam: boolean; face: number; walk: number }
let players: Plr[] = [];
let bubble: { i: number; text: string; t: number } | null = null;
let nextBubble = 2, lastT = 0;
const PLAZA = { x0: 24, x1: 592, y0: 170, y1: 212 };
const inFountain = (x: number, y: number) => ((x - 308) / 62) ** 2 + ((y - 200) / 24) ** 2 < 1;
function randSpot(): [number, number] {
  for (let k = 0; k < 20; k++) { const x = PLAZA.x0 + Math.random() * (PLAZA.x1 - PLAZA.x0), y = PLAZA.y0 + Math.random() * (PLAZA.y1 - PLAZA.y0); if (!inFountain(x, y)) return [x, y]; }
  return [80, 190];
}
function initPlayers() {
  players = NAMES.map((name, i) => { const [x, y] = randSpot(); return { name, color: COLORS[i], guild: GUILDS[i], x, y, tx: x, ty: y, wait: Math.random() * 4, roam: i % 3 !== 0, face: 1, walk: 0 }; });
}
function drawPlayers(c: CanvasRenderingContext2D, t: number) {
  if (!players.length) initPlayers();
  const dt = Math.min(0.1, lastT ? t - lastT : 0); lastT = t;
  for (const p of players) {
    const d = Math.hypot(p.tx - p.x, p.ty - p.y);
    if (d < 1) {
      p.walk = 0; p.wait -= dt;
      if (p.wait <= 0) {
        if (p.roam || Math.random() < 0.15) { [p.tx, p.ty] = randSpot(); p.wait = 2 + Math.random() * 5; }
        else p.wait = 3 + Math.random() * 6;
        if (!p.roam && Math.random() < 0.3) p.face *= -1;
      }
    } else {
      const sp = 22 * dt;
      p.x += ((p.tx - p.x) / d) * Math.min(sp, d); p.y += ((p.ty - p.y) / d) * Math.min(sp, d);
      if (inFountain(p.x, p.y)) { [p.tx, p.ty] = randSpot(); }
      p.face = p.tx > p.x ? 1 : -1; p.walk += dt * 8;
    }
  }
  nextBubble -= dt;
  if (bubble) { bubble.t -= dt; if (bubble.t <= 0) { bubble = null; nextBubble = 2 + Math.random() * 4; } }
  else if (nextBubble <= 0) bubble = { i: Math.floor(Math.random() * players.length), text: PHRASES[Math.floor(Math.random() * PHRASES.length)], t: 3.2 };
  for (const p of [...players].sort((a, b) => a.y - b.y)) {
    const px = Math.round(p.x - 5), py = Math.round(p.y);
    const step = p.walk ? Math.sin(p.walk) * 2 : 0;
    rect(c, px, py - 1, 12, 3, 'rgba(0,0,0,.25)');
    rect(c, px + 1, py - 6 + Math.max(0, step), 3, 6 - Math.max(0, step), '#2a2a30'); rect(c, px + 6, py - 6 + Math.max(0, -step), 3, 6 - Math.max(0, -step), '#2a2a30');
    rect(c, px, py - 19, 10, 14, p.color); rect(c, px - 2, py - 19, 14, 4, '#c9c2b0');
    rect(c, px + 2, py - 25, 6, 6, '#e8b98a'); rect(c, px + (p.face > 0 ? 6 : 2), py - 23, 1, 1, '#1d2330');
    txt(c, p.name, px + 5, py - 30, 9, '#6fe08a');
    if (p.guild) txt(c, p.guild, px + 5, py - 39, 7, '#a9b3c9');
  }
  if (bubble) {
    const p = players[bubble.i];
    c.font = `400 10px ${FONT}`;
    const w = Math.min(200, c.measureText(bubble.text).width + 12);
    const bx = Math.max(4, Math.min(612 - w, p.x - w / 2)), by = p.y - (p.guild ? 64 : 56);
    c.globalAlpha = Math.min(1, bubble.t * 3);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(bx, by, w, 16, 5); c.fill();
    c.beginPath(); c.moveTo(p.x - 4, by + 16); c.lineTo(p.x + 4, by + 16); c.lineTo(p.x, by + 22); c.fill();
    txt(c, bubble.text, bx + w / 2, by + 12, 10, '#1d2330');
    c.globalAlpha = 1;
  }
}

export function drawTown(c: CanvasRenderingContext2D) {
  const t = performance.now() / 1000;
  const W = 616, H = 352;
  // night sky, moon, stars
  const sky = c.createLinearGradient(0, 0, 0, 120);
  sky.addColorStop(0, '#0f1230'); sky.addColorStop(1, '#3a2a5a');
  c.fillStyle = sky; c.fillRect(0, 0, W, 120);
  for (let i = 0; i < 30; i++) rect(c, (i * 97) % W, (i * 37) % 60, 2, 2, `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t + i)})`);
  c.fillStyle = '#f2e9d8'; c.beginPath(); c.arc(560, 30, 14, 0, Math.PI * 2); c.fill();
  // city wall with towers behind the back row
  rect(c, 0, 66, W, 50, '#4a4658');
  for (let x = 0; x < W; x += 20) rect(c, x, 58, 12, 10, '#4a4658');
  for (const tx of [0, 300, 590]) { rect(c, tx - 4, 30, 34, 86, '#55516a'); for (let i = 0; i < 3; i++) rect(c, tx - 4 + i * 12, 22, 8, 10, '#55516a'); rect(c, tx + 8, 50, 8, 12, '#ffd27a'); }
  // plaza: cobblestones
  rect(c, 0, 150, W, H - 150, '#6a6676');
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1;
  for (let y = 152; y < H; y += 10) for (let x = (y / 10) % 2 ? 0 : 8; x < W; x += 16) c.strokeRect(x + 0.5, y + 0.5, 16, 10);
  // fountain
  const fx = 308, fy = 200;
  c.fillStyle = '#8a8698'; c.beginPath(); c.ellipse(fx, fy, 50, 16, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#4f8ad8'; c.beginPath(); c.ellipse(fx, fy - 2, 42, 11, 0, 0, Math.PI * 2); c.fill();
  rect(c, fx - 5, fy - 30, 10, 28, '#9a96a8');
  for (let i = 0; i < 6; i++) { const p = ((t * 0.8 + i / 6) % 1); c.fillStyle = `rgba(180,220,255,${1 - p})`; c.fillRect(fx - 14 + i * 5, fy - 30 + p * 26, 2, 3); }
  // lamp posts
  for (const lx of [150, 466]) { rect(c, lx, 168, 3, 50, '#2a2a30'); const g = c.createRadialGradient(lx + 1, 166, 1, lx + 1, 166, 26); g.addColorStop(0, 'rgba(255,220,140,.7)'); g.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = g; c.fillRect(lx - 25, 140, 52, 52); rect(c, lx - 3, 160, 9, 8, '#ffd27a'); }
  // back row
  for (const s of SERVICES) {
    if (s.id === 'appraiser') drawAppraiser(c, s.x, s.base, s.w, t);
    if (s.id === 'auction') drawAuction(c, s.x, s.base, s.w, t);
    if (s.id === 'portal') drawPortal(c, s.x, s.base, s.w, t);
    if (s.id === 'merchant') drawMerchant(c, s.x, s.base, s.w);
    if (s.id === 'salvage') drawForge(c, s.x, s.base, s.w, t);
  }
  drawPlayers(c, t);
  // front row: plots
  for (const p of PLOTS) drawPlot(c, p.id, p.x, p.base, p.w, t);
  // top bar + trade chat
  rect(c, 0, 0, W, 18, 'rgba(10,8,20,.75)');
  txt(c, 'LEDGERFALL', 8, 13, 10, '#f2c46b', 'left');
  const k = Math.floor(t / 4) % TRADE_CHAT.length;
  txt(c, `[Trade] ${TRADE_CHAT[k][0]}: ${TRADE_CHAT[k][1]}`, W - 8, 13, 10, '#ff9a4d', 'right');
}

// ---------- DOM overlay: buttons by the buildings, and the service windows ----------
const b = (act: string, label: string, arg: string, cls: string, style: string) => `<button class="tbtn ${cls}" data-act="${act}" data-arg="${arg}" style="${style}">${label}</button>`;

export function townOverlayHtml(): string {
  const g = S.g;
  let h = '';
  for (const s of SERVICES) {
    const cx = s.x + s.w / 2;
    h += `<div class="tname" style="left:${cx}px;top:${s.id === 'portal' ? 26 : 36}px">${s.label}</div>`;
    h += s.id === 'portal'
      ? b('portal', `Enter floor ${N().checkpoint} <small>15 min</small>`, '', 'portal', `left:${cx}px;top:${s.base - 26}px`)
      : b('townWin', s.btn, s.id, '', `left:${cx}px;top:${s.base - 24}px`);
  }
  for (const p of PLOTS) {
    const d = CITY_BY_ID[p.id];
    const L = g.furniture[p.id] ?? 0;
    const cx = p.x + p.w / 2;
    const afford = L < 3 && g.gold >= d.gold[L] && g.mats >= d.mats[L];
    h += `<div class="tname plot" style="left:${cx}px;top:${p.base - 128}px">${d.name}${L ? ` <span>Lv ${L}</span>` : ''}<em>${L ? d.effect[L - 1] : 'empty plot'}</em></div>`;
    h += L >= 3
      ? `<div class="tbtn max" style="left:${cx}px;top:${p.base - 22}px">MAX LEVEL</div>`
      : b('build', `${L ? 'Upgrade' : 'Build'} · ${d.gold[L]}g ${d.mats[L]}<i class="scrap"></i>`, p.id, (afford ? 'gold' : 'off') + ' plotbtn', `left:${cx}px;top:${p.base - 24}px`) + `<div class="tname next" style="left:${cx}px;top:${p.base - 104}px">${L ? 'next: ' : ''}${d.effect[L]}</div>`;
  }
  return h + serviceWindowHtml();
}

const SVC_INFO: Record<ServiceId, { title: string; hint: string }> = {
  merchant: { title: 'Merchant', hint: 'Sell items for gold, instantly.' },
  appraiser: { title: 'Appraiser', hint: 'Reveal epic and legendary items. 10 min each.' },
  salvage: { title: 'Salvage Forge', hint: 'Break items into scraps for city buildings.' },
  auction: { title: 'Auction House', hint: 'List items for real money (zł). Paid tomorrow morning. 5 min each.' },
};

function serviceWindowHtml(): string {
  const w = S.g.townWin;
  if (!w) return '';
  const info = SVC_INFO[w];
  const items = S.g.bag.filter(e => (w === 'appraiser' ? e.kind === 'item' && !e.item.identified : w === 'salvage' || w === 'auction' ? e.kind === 'item' : true));
  const row = (e: BagEntry) => {
    const col = e.kind === 'item' ? RARITY_COLOR[e.item.rarity] : '#c9b08a';
    const ico = e.kind === 'item' ? icon(e.item.slot, '#f2e9d8', 20, !e.item.identified) : icon(e.kind === 'map' ? 'map' : 'feather', col, 20);
    let action = '';
    if (w === 'merchant') action = b('svc', `Sell +${vendorValue(e.id)} g`, `vendor:${e.id}`, 'row', '');
    if (w === 'salvage') action = b('svc', `+${salvageYield(e.id)} scraps`, `salvage:${e.id}`, 'row', '');
    if (w === 'auction') action = b('svc', `List ~${listValue(e.id)} zł`, `list:${e.id}`, 'row green', '');
    if (w === 'appraiser' && e.kind === 'item') {
      const cost = e.item.rarity === 'legendary' ? T.IDENTIFY_COST.legendary : T.IDENTIFY_COST.epic;
      action = b('svc', `Identify ${cost} g`, `identify:${e.id}`, 'row ' + (S.g.gold >= cost ? 'gold' : 'off'), '');
    }
    const r = e.kind === 'item' ? RARITIES.indexOf(e.item.rarity) : -1;
    return `<div class="svc-row"><span class="svc-ico" style="border-color:${col}">${ico}</span><span class="svc-name" style="color:${col}">${entryName(e)}${r >= 0 ? `<small>${e.kind === 'item' ? e.item.rarity : ''} · value ${entryValue(e)}</small>` : ''}</span>${action}</div>`;
  };
  return `<div class="svc-win">
    <div class="svc-head"><b>${info.title}</b><span>${info.hint}</span>${b('townWin', '×', '', 'x', '')}</div>
    <div class="svc-list">${items.length ? items.map(row).join('') : '<div class="svc-empty">Nothing to do here. Bring loot from the dungeon.</div>'}</div>
    <div class="svc-foot">Gold ${S.g.gold} · Scraps ${S.g.mats} · zł ${S.g.zl}</div>
  </div>`;
}

// ---------- Floor node map (Slay the Spire style), shown on the monitor when a floor ends ----------
type NodeKind = 'plain' | 'boss' | 'elite' | 'shrine' | 'vault' | 'unknown';
const NODE_COL: Record<NodeKind, string> = { plain: '#c9b08a', boss: '#e0524a', elite: '#f2b84b', shrine: '#6fcf7f', vault: '#ff9a4d', unknown: '#6a5a4a' };
function nodeGlyph(k: NodeKind, col: string): string {
  const s = `stroke="${col}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  switch (k) {
    case 'plain': return `<path d="M-9 9 L7 -7 M3 -9 L9 -9 L9 -3 M9 9 L-7 -7 M-3 -9 L-9 -9 L-9 -3" ${s}/>`;
    case 'boss': return `<path d="M-11 6 L-11 -6 L-5 0 L0 -9 L5 0 L11 -6 L11 6 Z" fill="${col}" stroke="#2a1a10" stroke-width="1.5"/>`;
    case 'elite': return `<path d="M-8 -2 a8 8 0 0 1 16 0 v4 h-4 v5 h-8 v-5 h-4 z" fill="${col}"/><circle cx="-3.5" cy="-1" r="2.2" fill="#2a1a10"/><circle cx="3.5" cy="-1" r="2.2" fill="#2a1a10"/>`;
    case 'shrine': return `<path d="M0 -10 V10 M-9 0 H9" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
    case 'vault': return `<rect x="-10" y="-5" width="20" height="13" rx="2" fill="${col}"/><path d="M-10 -1 H10" stroke="#2a1a10" stroke-width="2"/><rect x="-2" y="-3" width="4" height="5" fill="#2a1a10"/>`;
    default: return `<text x="0" y="6" text-anchor="middle" font-size="16" fill="${col}" font-family="Pixelify Sans, monospace">?</text>`;
  }
}

function nodeMapHtml(): string {
  const n = N();
  const next = n.floor + 1, after = n.floor + 2;
  const bossNext = next % T.CHECKPOINT_EVERY === 0, bossAfter = after % T.CHECKPOINT_EVERY === 0;
  const opts: { kind: NodeKind; id: string; name: string; desc: string }[] = [
    { kind: bossNext ? 'boss' : 'plain', id: '', name: bossNext ? `Floor ${next}: Boss floor` : `Floor ${next}`, desc: bossNext ? '3 battles, boss at the end. Checkpoint after.' : '3 battles, normal loot' },
  ];
  const seen = new Set<string>();
  for (const e of S.g.bag) if (e.kind === 'map' && !seen.has(e.map)) {
    seen.add(e.map);
    const count = S.g.bag.filter(x => x.kind === 'map' && x.map === e.map).length;
    opts.push({ kind: e.map, id: e.id, name: MAP_INFO[e.map].name + (count > 1 ? ` ×${count}` : ''), desc: MAP_INFO[e.map].desc + ' · uses the map' });
  }
  const W = 616, rowY = [300, 186, 72];
  const xs = (k: number, i: number) => W / 2 + (i - (k - 1) / 2) * Math.min(130, 520 / Math.max(1, k));
  const prev = bossAfter ? [{ kind: 'boss' as NodeKind }] : [{ kind: 'unknown' as NodeKind }, { kind: 'unknown' as NodeKind }, { kind: 'unknown' as NodeKind }];
  let lines = '', svgNodes = '';
  const cx0 = W / 2;
  opts.forEach((o, i) => {
    const x = xs(opts.length, i);
    lines += `<path d="M${cx0} ${rowY[0] - 20} L${x} ${rowY[1] + 24}" stroke="#c9b08a" stroke-width="2" stroke-dasharray="4 5"/>`;
    prev.forEach((_, j) => { lines += `<path d="M${x} ${rowY[1] - 24} L${xs(prev.length, j)} ${rowY[2] + 18}" stroke="#4a3a2a" stroke-width="2" stroke-dasharray="3 6"/>`; });
  });
  prev.forEach((p, j) => { const x = xs(prev.length, j); svgNodes += `<g transform="translate(${x} ${rowY[2]})" opacity=".45"><circle r="17" fill="#1a120c" stroke="${NODE_COL[p.kind]}" stroke-width="2"/>${nodeGlyph(p.kind, NODE_COL[p.kind])}</g>`; });
  svgNodes += `<g transform="translate(${cx0} ${rowY[0]})"><circle r="18" fill="#3a2a1a" stroke="#8a7a5a" stroke-width="2"/><path d="M-7 0 L-2 6 L8 -6" stroke="#6fcf7f" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`;
  const buttons = opts.map((o, i) => {
    const x = xs(opts.length, i), col = NODE_COL[o.kind];
    return `<button class="mnode" data-act="nextFloor" data-arg="${o.id}" style="left:${x}px;top:${rowY[1]}px;--nc:${col}">
      <svg viewBox="-24 -24 48 48" width="48" height="48"><circle r="21" fill="#1a120c" stroke="${col}" stroke-width="3"/>${nodeGlyph(o.kind, col)}</svg>
      <span class="mn-tip"><b style="color:${col}">${o.name}</b>${o.desc}</span></button>`;
  }).join('');
  return `<div class="nodemap">
    <svg class="nm-svg" viewBox="0 0 ${W} 352" width="${W}" height="352">${lines}${svgNodes}</svg>
    <div class="nm-title">Floor ${n.floor} cleared · choose your path</div>
    <div class="nm-lab" style="top:${rowY[0] + 24}px">you are here</div>
    <div class="nm-lab" style="top:${rowY[2] + 22}px">floor ${after}${bossAfter ? ' · BOSS' : ' · unknown'}</div>
    ${buttons}
    <button class="tbtn tportal" data-act="toTown">Town portal <small>15 min · come back to floor ${n.checkpoint}</small></button>
    <div class="nm-foot">Maps from loot add paths. The night clock runs at 25% while you choose.</div>
  </div>`;
}

export function monUiHtml(): string {
  const n = S.g.night;
  if (!n || n.monitor === 'excel' || n.monitorOff > 0 || n.switching) return '';
  return buffsHtml(n) + monUiInner(n);
}
function monUiInner(n: NonNullable<typeof S.g.night>): string {
  if (n.location === 'town') return townOverlayHtml();
  if (n.phase === 'mapChoice') return nodeMapHtml();
  const ok = n.phase !== 'battle';
  return `<button class="tbtn tportal ${ok ? '' : 'off'}" data-act="toTown">Town portal <small>${ok ? '15 min' : 'after battle'}</small></button>${skillBarHtml()}`;
}

/** A mark on the field that this skill cashes in: the button glows gold (docs/design/dungeon.md, ability marks). */
function comboReady(id: string, si: number): string {
  const alive = N().enemies.filter(e => e.hp > 0);
  const has = (e: { marks?: Record<string, number | undefined> } | undefined, m: string) => !!e && (e.marks?.[m] ?? 0) > 0;
  if (id === 'mage' && si === 1 && alive.some(e => has(e, 'stagger'))) return `x${T.MARK_STAGGER_FIRE}`;
  if (id === 'knight' && si === 2 && has(alive.find(e => (e.wind ?? 0) > 0) ?? alive[0], 'chill')) return `x${T.MARK_CHILL_BASH}`;
  if (id === 'healer' && si === 2 && alive.some(e => has(e, 'taunted'))) return '\u21a9';
  return '';
}

// ---------- Infinity Engine style action bar on the dungeon screen: portrait + 5 skills per hero ----------
function skillBarHtml(): string {
  const n = N();
  const lock = abilitiesLocked();
  const groups = S.g.heroes.map((h, hi) => {
    const mx = maxHp(h), hp = h.downed ? 0 : h.hp / mx;
    const por = `<button class="ie-por ${n.heroTab === hi ? 'sel' : ''} ${h.downed ? 'down' : ''}" data-act="heroTab" data-arg="${hi}" data-tip="hero:${hi}" style="--hc:${HERO_COLORS[h.id]}">
      <span class="ie-face">${portrait(h.id)}</span><span class="ie-hp"><i style="height:${Math.round(hp * 100)}%;background:${hp > 0.5 ? '#4fbf5f' : hp > 0 ? '#d9a33a' : '#a33'}"></i></span><span class="ie-name">${h.name}</span></button>`;
    const sk = ABILITIES[h.id].map((a, si) => {
      if (si === 0) return '';                    // auto attack is always on: no button
      const unlocked = si === 0 || abilityUnlocked(h, si);
      const cd = h.cd[si];
      const [gname, gcol] = ABILITY_GLYPHS[h.id][si];
      let cls = 'ie-sk', over = '';
      if (si === 0) cls += ' auto';
      else if (!unlocked) { cls += ' locked'; over = `<b class="ie-tag">${si <= 3 ? `Lv${T.ABILITY_UNLOCK[si]}` : '--'}</b>`; }
      else if (cd > 0) { cls += ' cd'; over = `<i class="ie-sweep" style="--p:${Math.round((cd / ABILITIES[h.id][si].cd) * 36) * 10}deg"></i><b class="ie-cd">${Math.ceil(cd)}</b>`; }
      else cls += ' ready';
      if (h.queued === si) cls += ' queued';
      if (lock && si > 0) cls += ' blocked';
      const wind = n.enemies.find(e => e.hp > 0 && (e.wind ?? 0) > 0);
      if (wind && unlocked && cd <= 0 && ((h.id === 'knight' && (si === 1 || (si === 2 && !wind.braced))) || (h.id === 'healer' && si === 2))) cls += ' answer';
      else if (unlocked && cd <= 0 && !h.downed && comboReady(h.id, si)) { cls += ' combo'; over += `<b class="ie-combo">${comboReady(h.id, si)}</b>`; }
      return `<button class="${cls}" data-act="ability" data-arg="${hi},${si}" data-tip="skill:${hi}:${si}">${glyph(gname, unlocked ? gcol : '#4a4440', 20)}${over}<span class="ie-key">${HOTKEYS[h.id][si].toUpperCase()}</span></button>`;
    }).join('');
    return `<div class="ie-grp ${h.downed ? 'downed' : ''}">${por}<div class="ie-sks">${sk}</div></div>`;
  }).join('');
  return `<div class="ie-bar ${lock ? 'locked' : ''}">${groups}${lock ? `<div class="ie-lock">${lock}</div>` : ''}</div>`;
}

/** Tiny pixel portrait per class (CSS-drawn placeholder until real portraits exist). */
function portrait(id: string): string {
  const hair = id === 'knight' ? '#6a4a2a' : id === 'mage' ? '#2a2a3a' : '#c9a46a';
  const hat = id === 'knight' ? '<rect x="3" y="1" width="10" height="5" fill="#8a96a8"/><rect x="3" y="5" width="10" height="1" fill="#5a6678"/>' : id === 'mage' ? '<path d="M3 6 L8 0 L13 6 Z" fill="#6a3ab8"/>' : `<rect x="3" y="2" width="10" height="4" fill="${hair}"/>`;
  return `<svg viewBox="0 0 16 18" width="34" height="38" shape-rendering="crispEdges"><rect width="16" height="18" fill="#1a1410"/>
    <rect x="4" y="4" width="8" height="8" fill="#e8b98a"/>${hat}<rect x="5" y="8" width="2" height="1" fill="#1d2330"/><rect x="9" y="8" width="2" height="1" fill="#1d2330"/>
    <rect x="2" y="13" width="12" height="5" fill="${HERO_COLORS[id as keyof typeof HERO_COLORS]}"/><rect x="7" y="11" width="2" height="1" fill="#b05a5a"/></svg>`;
}

// ---------- Buffs and debuffs on you (WoW style: icon squares, timer under each) ----------
const BI: Record<string, string> = {
  monster: '<rect x="6" y="2" width="10" height="18" rx="2" fill="#111"/><ellipse cx="11" cy="3" rx="5" ry="1.4" fill="#c9ced6"/><path d="M8.5 6 L9.5 14 M11 5.5 L11 15 M13.5 6 L12.5 14" stroke="#6fe08a" stroke-width="1.6"/>',
  crash: '<rect x="6" y="5" width="10" height="15" rx="2" fill="#333"/><path d="M11 1 V9 M7.5 6 L11 10 L14.5 6" stroke="#ff8a80" stroke-width="2" fill="none"/>',
  zone: '<path d="M4 14 C4 4, 18 4, 18 14" stroke="#c9a8ff" stroke-width="2.4" fill="none"/><rect x="2" y="12" width="5" height="8" rx="2" fill="#9a7aff"/><rect x="15" y="12" width="5" height="8" rx="2" fill="#9a7aff"/>',
  flow: '<path d="M11 2 C15 7, 18 10, 15 16 C13 20, 8 20, 6 16 C4 12, 8 10, 9 6 C10 9, 12 10, 11 2 Z" fill="#ff9a4d"/><path d="M11 10 C13 13, 13 16, 11 18 C9 16, 9 13, 11 10 Z" fill="#ffe08a"/>',
  guilt: '<path d="M11 19 L3 10 C0 6, 5 1, 9 5 L11 7 L13 5 C17 1, 22 6, 19 10 Z" fill="#e05a7a"/><path d="M11 7 L9 11 L12 13 L10 18" stroke="#14101a" stroke-width="1.6" fill="none"/>',
  tired: '<text x="3" y="12" font-size="9" font-weight="700" fill="#8fa8d9" font-family="Inter">Z</text><text x="9" y="17" font-size="7" font-weight="700" fill="#8fa8d9" font-family="Inter">z</text><text x="14" y="21" font-size="5" font-weight="700" fill="#8fa8d9" font-family="Inter">z</text>',
  taunt: '<path d="M11 2 L19 5 V11 C19 16, 15 19, 11 21 C7 19, 3 16, 3 11 V5 Z" fill="#6aa8ff"/><path d="M8 9 L14 15 M14 9 L8 15" stroke="#14101a" stroke-width="2"/>',
  ward: '<circle cx="11" cy="11" r="8" fill="none" stroke="#6fcf7f" stroke-width="2.4"/><circle cx="11" cy="11" r="3" fill="#6fcf7f"/>',
};
function buffsHtml(n: NonNullable<typeof S.g.night>): string {
  type B = { k: string; name: string; de?: boolean; left?: number; max?: number; label?: string };
  const list: B[] = [];
  if (n.boost > 0) list.push({ k: 'monster', name: 'Monster: party acts 30% faster', left: n.boost, max: T.MONSTER_BOOST_SEC });
  if (n.crash > 0) list.push({ k: 'crash', name: 'Sugar crash: party slower', de: true, left: n.crash, max: T.MONSTER_CRASH_SEC });
  if (n.headset) list.push({ k: 'zone', name: n.zone >= 1 ? 'In the Zone: Flow builds 25% faster, +10% loot luck (until the headset comes off)' : 'Zone building (headset on, you hear nothing)', label: n.zone >= 1 ? '\u221E' : `${Math.floor(n.zone * 100)}%` });
  if (n.flow > 1.05) list.push({ k: 'flow', name: `Flow: party damage x${n.flow.toFixed(1)}`, label: `x${n.flow.toFixed(1)}` });
  if (n.taunt > 0) list.push({ k: 'taunt', name: 'Taunt: enemies hit the knight', left: n.taunt, max: 5 });
  if (n.ward > 0) list.push({ k: 'ward', name: 'Ward: party protected', left: n.ward, max: 6 });
  if (n.guilt > 0) list.push({ k: 'guilt', name: 'Guilt: party -10% damage', de: true, left: n.guilt, max: T.GUILT_SEC });
  if (n.tired >= T.TIRED_YAWN) list.push({ k: 'tired', de: true, name: n.tired >= T.TIRED_SLUGGISH ? 'Sluggish: timers shorter, eyes closing' : n.tired >= T.TIRED_MICROSLEEP ? 'Microsleeps: your eyes close' : 'Yawning: the screen blurs now and then', label: n.tired >= T.TIRED_SLUGGISH ? 'III' : n.tired >= T.TIRED_MICROSLEEP ? 'II' : 'I' });
  if (!list.length) return '';
  return `<div class="buffs">${list.map(b => {
    const pct = b.left !== undefined && b.max ? Math.round((1 - b.left / b.max) * 36) * 10 : 0;
    const label = b.label ?? `${Math.ceil(b.left ?? 0)}s`;
    return `<div class="buff ${b.de ? 'de' : ''} ${b.left !== undefined && b.left < 5 ? 'low' : ''}" title="${b.name}"><div class="bi"><svg viewBox="0 0 22 22" width="22" height="22">${BI[b.k]}</svg>${pct ? `<i class="sweep" style="--p:${pct}deg"></i>` : ''}</div><span class="bt">${label}</span></div>`;
  }).join('')}</div>`;
}
