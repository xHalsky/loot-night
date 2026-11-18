import { T } from '../config/tuning';
import { S, N, type Vfx } from '../core/state';
import { HERO_SPRITES, type Px } from '../data/heroes';
import { ENEMY_BY_ID } from '../data/enemies';
import { HERO_X, ENEMY_X, UNIT_Y } from '../systems/battle';
import { maxHp } from '../systems/stats';
import { MAP_INFO } from '../data/items';
import { NPCS, TRADE_CHAT } from '../data/content';
import { PIECES } from '../systems/excel';
import { drawTownMap } from './townMap';
import { sfx } from './audio';
import { drawDungeonScene } from './dungeon';
import { GAME_W, GAME_H, BATTLE_W, BAND_H, SCENE_H } from './layout';

/** The canvas is the whole game screen (#49); the side panel is DOM over its right part. */
export const MON_W = GAME_W, MON_H = GAME_H;
const FONT = '"Pixelify Sans", monospace';

export function drawPx(c: CanvasRenderingContext2D, px: Px[], x: number, y: number, s: number, alpha = 1) {
  c.globalAlpha = alpha;
  for (const [a, b, w, h, col] of px) { c.fillStyle = col; c.fillRect(x + a * s, y + b * s, w * s, h * s); }
  c.globalAlpha = 1;
}

export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', weight = 400) {
  c.font = `${weight} ${size}px ${FONT}`;
  c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic';
  c.fillText(s, x, y);
}

export function bar(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pct: number, color: string) {
  c.fillStyle = '#0d0a12'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#4a3a5c'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  c.fillStyle = color; c.fillRect(x + 2, y + 2, Math.max(0, (w - 4) * Math.min(1, pct)), h - 4);
}

export const GOBLIN: Px[] = [[3, 0, 6, 4, '#4caf50'], [4, 1, 1, 1, '#ffeb3b'], [7, 1, 1, 1, '#ffeb3b'], [2, 4, 8, 6, '#795548'], [9, 3, 3, 5, '#f2b84b'], [3, 10, 2, 3, '#4caf50'], [7, 10, 2, 3, '#4caf50']];
export const goblinPos = () => { const n = N(); if (!n.goblin) return null; return { x: 600 - (1 - n.goblin.t / T.GOBLIN_SEC) * 640, y: 262 }; };

export function drawMonitor(c: CanvasRenderingContext2D) {
  const n = S.g.night;
  c.imageSmoothingEnabled = false;
  if (n?.switching) { drawSwitching(c, n.switching); return; }   // before clearing: it grabs the last frame
  c.clearRect(0, 0, MON_W, MON_H);
  if (!n) { c.fillStyle = '#09070c'; c.fillRect(0, 0, MON_W, MON_H); return; }
  if (n.monitorOff > 0) {
    c.fillStyle = '#000'; c.fillRect(0, 0, MON_W, MON_H);
    if (n.unplugged) { text(c, 'NO SIGNAL', MON_W / 2, 170, 22, '#6e6280', 'center'); text(c, 'the party fights on, drops are lost', MON_W / 2, 196, 13, '#4a3a5c', 'center'); return; }
    text(c, 'She turned the monitor off.', MON_W / 2, 170, 18, '#6e6280', 'center');
    text(c, `${Math.ceil(n.monitorOff)} s · the party fights on, drops are lost`, MON_W / 2, 196, 13, '#4a3a5c', 'center');
    return;
  }
  if (n.monitor === 'excel') { drawExcel(c); return; }
  if (n.location === 'town') { drawTownScreen(c); return; }
  drawDungeon(c);
}

function drawDungeon(c: CanvasRenderingContext2D) {
  // the band above the scene (#49): the cave's ceiling going up into the dark; curio windows open over it
  const g = c.createLinearGradient(0, 0, 0, BAND_H + 24);
  g.addColorStop(0, '#040306'); g.addColorStop(1, '#0c0810');
  c.fillStyle = g; c.fillRect(0, 0, BATTLE_W, BAND_H + 24);
  for (let i = 0; i < 9; i++) {   // a few roots and stalactites hanging out of the dark
    const x = 30 + ((i * 83) % (BATTLE_W - 40)), h = 18 + ((i * 37) % 46);
    c.fillStyle = '#100b14'; c.beginPath(); c.moveTo(x - 10, BAND_H + 24 - h - 30); c.lineTo(x + 10, BAND_H + 24 - h - 30); c.lineTo(x + 1, BAND_H + 24); c.fill();
  }
  c.save(); c.translate(0, BAND_H); c.beginPath(); c.rect(0, 0, BATTLE_W, SCENE_H); c.clip();
  drawDungeonScene(c);
  c.restore();
  sidePanelBack(c);
}
/** Under the DOM side panel: its colour, so a frozen frame (the alt-tab switch) still shows a panel there. */
function sidePanelBack(c: CanvasRenderingContext2D) { c.fillStyle = '#2a1f14'; c.fillRect(BATTLE_W, 0, GAME_W - BATTLE_W, GAME_H); }
function drawTownScreen(c: CanvasRenderingContext2D) {
  drawTownMap(c);   // Ravenhold at night fills the whole battle area (#50)
  sidePanelBack(c);
}


// ---------------- Excel: a spreadsheet that happens to be Tetris ----------------
// Layout mimics Excel: title bar, ribbon, formula bar, column letters, row numbers, sheet tabs.
export const XL = { x: 98, y: 104, cw: 34, ch: 18 };
export const XL_BUTTONS: { cmd: 'left' | 'rotate' | 'down' | 'right' | 'drop'; label: string; x: number; w: number }[] = [
  { cmd: 'left', label: '< Move', x: 330, w: 52 }, { cmd: 'right', label: 'Move >', x: 386, w: 52 }, { cmd: 'rotate', label: 'Rotate', x: 442, w: 52 },
  { cmd: 'down', label: 'Down', x: 498, w: 44 }, { cmd: 'drop', label: 'Drop', x: 546, w: 60 },
];
export const XL_BTN_Y = 42, XL_BTN_H = 22, XL_BTN_W = 0;
const XL_FILL = ['#ddebf7', '#ffeb9c', '#c6efce', '#e2efda', '#fce4d6', '#ededed', '#ffc7ce'];
const XL_INK = ['#1f4e79', '#7f6000', '#006100', '#375623', '#843c0c', '#3a3a3a', '#9c0006'];
const SANS = 'Inter, Calibri, Arial, sans-serif';
const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['AA', 'AB', 'AC']);

function xlText(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', weight = 400) {
  c.font = `${weight} ${size}px ${SANS}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(s, x, y);
}
const cellValue = (cx: number, cy: number, k: number) => ((cx * 731 + cy * 397 + k * 157) % 9000 + 120).toLocaleString('en-US');

function drawExcel(c: CanvasRenderingContext2D) {
  const n = N();
  const ex = n.excel;
  const { x: bx, y: by, cw, ch } = XL;
  const NC = Math.ceil((MON_W - 30) / cw), NR = Math.floor((MON_H - by - 20) / ch);   // the sheet fills the whole game screen (#49)
  // Title bar
  c.fillStyle = '#217346'; c.fillRect(0, 0, MON_W, 22);
  xlText(c, 'AutoSave', 8, 15, 10, '#d9ead3'); c.fillStyle = '#d9ead3'; c.fillRect(56, 8, 14, 7);
  xlText(c, 'Q4_report_FINAL_v3.xlsx - Excel', MON_W / 2, 15, 11, '#ffffff', 'center', 600);
  xlText(c, '—   ▢   ✕', MON_W - 10, 15, 11, '#ffffff', 'right');
  // Ribbon tabs
  c.fillStyle = '#f3f3f3'; c.fillRect(0, 22, MON_W, 18);
  ['File', 'Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'].forEach((t, i) => {
    const x = 10 + [0, 32, 72, 114, 184, 246, 284, 330][i];
    xlText(c, t, x, 35, 10, i === 1 ? '#217346' : '#444', 'left', i === 1 ? 600 : 400);
    if (i === 1) { c.fillStyle = '#217346'; c.fillRect(x, 38, 28, 2); }
  });
  // Ribbon toolbar (left: fake tools, right: the controls as ribbon buttons)
  c.fillStyle = '#fbfbfb'; c.fillRect(0, 40, MON_W, 26);
  c.strokeStyle = '#e1e1e1'; c.beginPath(); c.moveTo(0, 65.5); c.lineTo(MON_W, 65.5); c.stroke();
  xlText(c, 'Paste', 10, 57, 10, '#444'); xlText(c, 'Calibri', 50, 57, 10, '#444'); xlText(c, '11', 96, 57, 10, '#444');
  xlText(c, 'B', 118, 57, 11, '#444', 'left', 700); xlText(c, 'I', 132, 57, 11, '#444'); xlText(c, 'U', 142, 57, 11, '#444');
  xlText(c, 'Conditional Formatting', 164, 57, 10, '#444'); xlText(c, 'Σ AutoSum', 276, 57, 10, '#444');
  for (const b of XL_BUTTONS) {
    c.fillStyle = '#ffffff'; c.fillRect(b.x, XL_BTN_Y, b.w, XL_BTN_H);
    c.strokeStyle = '#c8c8c8'; c.strokeRect(b.x + 0.5, XL_BTN_Y + 0.5, b.w - 1, XL_BTN_H - 1);
    xlText(c, b.label, b.x + b.w / 2, XL_BTN_Y + 15, 10, b.cmd === 'drop' ? '#217346' : '#333', 'center', b.cmd === 'drop' ? 600 : 400);
  }
  // Formula bar
  const p = ex.piece;
  const active = p ? `${COLS[2 + p.x]}${Math.max(1, p.y + 1)}` : 'C1';
  c.fillStyle = '#ffffff'; c.fillRect(0, 66, MON_W, 20);
  c.strokeStyle = '#d4d4d4'; c.strokeRect(4.5, 68.5, 50, 15);
  xlText(c, active, 8, 80, 10, '#333');
  xlText(c, 'fx', 66, 80, 11, '#777', 'left', 600);
  xlText(c, p ? `=SUM(C${Math.max(1, p.y + 1)}:J${Math.max(1, p.y + 1)})` : '=SUM(C1:J1)', 86, 80, 10, '#333');
  // Column letters + row numbers
  c.fillStyle = '#f0f0f0'; c.fillRect(0, 86, MON_W, 18); c.fillRect(0, 104, 30, ch * NR);
  for (let i = 0; i < NC; i++) {
    const x = 30 + i * cw;
    const inBoard = i >= 2 && i < 10;
    if (p && inBoard && p.cells.some(([cx]) => 2 + p.x + cx === i)) { c.fillStyle = '#d2e4d6'; c.fillRect(x, 86, cw, 18); }
    xlText(c, COLS[i], x + cw / 2, 99, 10, '#555', 'center');
  }
  for (let j = 0; j < NR; j++) xlText(c, String(j + 1), 15, by + j * ch + 13, 10, '#555', 'center');
  // Grid
  c.fillStyle = '#ffffff'; c.fillRect(30, by, MON_W - 30, ch * NR);
  c.strokeStyle = '#e1e1e1'; c.lineWidth = 1;
  for (let i = 0; i <= NC; i++) { c.beginPath(); c.moveTo(30 + i * cw + 0.5, 86); c.lineTo(30 + i * cw + 0.5, by + NR * ch); c.stroke(); }
  for (let j = 0; j <= NR; j++) { c.beginPath(); c.moveTo(0, by + j * ch + 0.5); c.lineTo(MON_W, by + j * ch + 0.5); c.stroke(); }
  // Column A/B labels for realism
  ['Region', 'North', 'South', 'East', 'West', 'Central', 'Online', 'Retail', 'B2B', 'Export', 'Misc', 'TOTAL'].forEach((t, j) => xlText(c, t, 34, by + j * ch + 13, 10, j === 0 || j === 11 ? '#000' : '#333', 'left', j === 0 || j === 11 ? 700 : 400));
  // Board frame (print area style, dashed)
  c.save(); c.setLineDash([4, 3]); c.strokeStyle = '#7f7f7f'; c.strokeRect(bx + 0.5, by + 0.5, 8 * cw, 12 * ch); c.restore();
  const cell = (cx: number, cy: number, k: number, mode: 'data' | 'active' | 'ghost') => {
    if (cy < 0) return;
    const px = bx + cx * cw, py = by + cy * ch;
    if (mode === 'ghost') {
      c.save(); c.setLineDash([3, 2]); c.strokeStyle = '#217346'; c.strokeRect(px + 1.5, py + 1.5, cw - 3, ch - 3); c.restore();
      return;
    }
    c.fillStyle = mode === 'active' ? '#e8f2ea' : XL_FILL[k];
    c.fillRect(px + 1, py + 1, cw - 1, ch - 1);
    xlText(c, cellValue(cx, cy, k), px + cw - 3, py + 13, 9, mode === 'active' ? '#000' : XL_INK[k], 'right');
  };
  ex.board.forEach((row, j) => row.forEach((v, i) => { if (v) cell(i, j, v - 1, 'data'); }));
  if (p) {
    let gy = p.y;
    const fitsAt = (yy: number) => p.cells.every(([cx, cy]) => { const yyy = yy + cy; return yyy < 12 && (yyy < 0 || ex.board[yyy][p.x + cx] === 0); });
    while (fitsAt(gy + 1)) gy++;
    if (gy !== p.y) p.cells.forEach(([cx, cy]) => cell(p.x + cx, gy + cy, p.k, 'ghost'));
    p.cells.forEach(([cx, cy]) => cell(p.x + cx, p.y + cy, p.k, 'active'));
    // Excel selection border around the active block + fill handle
    c.strokeStyle = '#217346'; c.lineWidth = 2;
    const has = (x: number, y: number) => p.cells.some(([cx, cy]) => cx === x && cy === y);
    for (const [cx, cy] of p.cells) {
      if (p.y + cy < 0) continue;
      const px = bx + (p.x + cx) * cw, py = by + (p.y + cy) * ch;
      c.beginPath();
      if (!has(cx, cy - 1)) { c.moveTo(px, py + 1); c.lineTo(px + cw, py + 1); }
      if (!has(cx, cy + 1)) { c.moveTo(px, py + ch); c.lineTo(px + cw, py + ch); }
      if (!has(cx - 1, cy)) { c.moveTo(px + 1, py); c.lineTo(px + 1, py + ch); }
      if (!has(cx + 1, cy)) { c.moveTo(px + cw, py); c.lineTo(px + cw, py + ch); }
      c.stroke();
    }
    const last = p.cells.reduce((a, b) => (b[1] > a[1] || (b[1] === a[1] && b[0] > a[0]) ? b : a));
    if (p.y + last[1] >= 0) { c.fillStyle = '#217346'; c.fillRect(bx + (p.x + last[0] + 1) * cw - 3, by + (p.y + last[1] + 1) * ch - 3, 5, 5); }
    c.lineWidth = 1;
  }
  if (ex.clearFx > 0) { c.fillStyle = `rgba(198,239,206,${ex.clearFx})`; c.fillRect(bx, by, 8 * cw, 12 * ch); }
  if (ex.crashFx > 0) { c.fillStyle = `rgba(255,199,206,${Math.min(0.85, ex.crashFx)})`; c.fillRect(bx, by, 8 * cw, 12 * ch); xlText(c, '#REF!', bx + 4 * cw, by + 110, 22, '#9c0006', 'center', 700); }
  // Side table in columns L:P (a real-looking little report)
  const tx = 30 + 11 * cw, tw = 5 * cw;
  c.fillStyle = '#217346'; c.fillRect(tx, by, tw, ch);
  xlText(c, 'Overtime log', tx + 4, by + 13, 10, '#fff', 'left', 600);
  const rows: [string, string][] = [['Rows filled', String(ex.rows)], ['Overtime pay', `${ex.pay} g`], ['Per row', `${T.EXCEL_ROW_GOLD} g`], ['Next block', '']];
  rows.forEach(([k, v], i) => {
    const y = by + (i + 1) * ch;
    c.fillStyle = i % 2 ? '#f2f8f4' : '#ffffff'; c.fillRect(tx, y, tw, ch);
    xlText(c, k, tx + 4, y + 13, 10, '#333'); xlText(c, v, tx + tw - 4, y + 13, 10, '#000', 'right', 600);
  });
  PIECES[ex.next].forEach(([cx, cy]) => { c.fillStyle = XL_FILL[ex.next]; c.fillRect(tx + 3 * cw + cx * 9, by + 4 * ch + 3 + cy * 7, 8, 6); c.strokeStyle = '#999'; c.strokeRect(tx + 3 * cw + cx * 9 + 0.5, by + 4 * ch + 3 + cy * 7 + 0.5, 7, 5); });
  c.strokeStyle = '#a6a6a6'; c.strokeRect(tx + 0.5, by + 0.5, tw, ch * 5);
  // Note (Excel comment) with the rules
  const nx = tx + 4, ny = by + 6 * ch + 4;
  c.fillStyle = '#fff2cc'; c.fillRect(nx, ny, tw - 8, ch * 5 + 10);
  c.strokeStyle = '#bf9000'; c.strokeRect(nx + 0.5, ny + 0.5, tw - 9, ch * 5 + 9);
  c.fillStyle = '#c00000'; c.beginPath(); c.moveTo(nx + tw - 16, ny); c.lineTo(nx + tw - 8, ny); c.lineTo(nx + tw - 8, ny + 8); c.fill();
  ['Note:', 'Fill a whole row C:J', 'and it clears + pays', 'overtime. Excel open =', 'she sees you work.', 'A/D W S Space · Tab'].forEach((l, i) => xlText(c, l, nx + 5, ny + 13 + i * 15, 10, '#3f3100', 'left', i === 0 ? 700 : 400));
  // Sheet tabs + status bar
  const sb = by + NR * ch;
  c.fillStyle = '#f0f0f0'; c.fillRect(0, sb, MON_W, MON_H - sb);
  c.fillStyle = '#ffffff'; c.fillRect(40, sb, 54, 18);
  xlText(c, 'Q4', 67, sb + 13, 10, '#217346', 'center', 600); c.fillStyle = '#217346'; c.fillRect(40, sb + 16, 54, 2);
  xlText(c, 'Overtime', 120, sb + 13, 10, '#555', 'center'); xlText(c, '+', 160, sb + 13, 12, '#555', 'center');
  xlText(c, `Ready     Overtime ${n.excel.pay} g`, MON_W - 8, sb + 13, 10, '#555', 'right');
}

// ---------------- Battle VFX ----------------
const rnd = (seed: number, k: number) => { const v = Math.sin(seed * 999 + k * 12.9898) * 43758.5453; return v - Math.floor(v); };
export function drawVfx(c: CanvasRenderingContext2D, v: Vfx) {
  const p = v.t / v.dur;
  const a = Math.max(0, 1 - p);
  c.save();
  c.lineCap = 'round';
  switch (v.kind) {
    case 'slash': {
      const sweep = Math.min(1, p * 2.5);
      c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 6 * a + 1;
      c.beginPath(); c.arc(v.x - 6, v.y - 4, 30, -2.6, -2.6 + sweep * 2.4); c.stroke();
      c.strokeStyle = `rgba(255,220,140,${a})`; c.lineWidth = 2;
      c.beginPath(); c.arc(v.x - 6, v.y - 4, 24, -2.6, -2.6 + sweep * 2.4); c.stroke();
      break;
    }
    case 'claw': {
      const len = Math.min(1, p * 4);
      c.strokeStyle = `rgba(255,70,70,${a})`; c.lineWidth = 4;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(v.x + 12 - k * 10, v.y - 20); c.lineTo(v.x + 12 - k * 10 - 14 * len, v.y - 20 + 34 * len); c.stroke(); }
      break;
    }
    case 'bolt': case 'fire': {
      const travel = v.kind === 'bolt' ? 0.55 : 0.4;
      const col = v.kind === 'bolt' ? '185,140,255' : '255,140,60';
      if (p < travel) {
        const q = p / travel;
        const hx = v.x2 + (v.x - v.x2) * q, hy = v.y2 - 10 + (v.y - v.y2 + 10) * q - Math.sin(q * Math.PI) * 20;
        c.strokeStyle = `rgba(${col},0.5)`; c.lineWidth = 4;
        c.beginPath(); c.moveTo(v.x2, v.y2 - 10); c.lineTo(hx, hy); c.stroke();
        c.fillStyle = `rgb(${col})`; c.beginPath(); c.arc(hx, hy, v.kind === 'fire' ? 8 : 6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(hx, hy, 3, 0, Math.PI * 2); c.fill();
      } else {
        const q = (p - travel) / (1 - travel);
        const n = v.kind === 'fire' ? 14 : 8;
        for (let k = 0; k < n; k++) {
          const ang = rnd(v.seed, k) * Math.PI * 2, r = q * (v.kind === 'fire' ? 34 : 22) * (0.5 + rnd(v.seed, k + 50));
          c.fillStyle = k % 3 === 0 ? `rgba(255,240,160,${1 - q})` : `rgba(${col},${1 - q})`;
          c.fillRect(v.x + Math.cos(ang) * r - 3, v.y + Math.sin(ang) * r - 3, 6, 6);
        }
      }
      break;
    }
    case 'frost': {
      const q = Math.min(1, p * 2);
      c.strokeStyle = `rgba(160,225,255,${a})`; c.lineWidth = 3;
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2;
        c.beginPath(); c.moveTo(v.x, v.y); c.lineTo(v.x + Math.cos(ang) * 28 * q, v.y + Math.sin(ang) * 28 * q); c.stroke();
      }
      c.fillStyle = `rgba(200,240,255,${a * 0.5})`;
      c.beginPath(); c.moveTo(v.x, v.y - 22 * q); c.lineTo(v.x + 14 * q, v.y); c.lineTo(v.x, v.y + 22 * q); c.lineTo(v.x - 14 * q, v.y); c.fill();
      break;
    }
    case 'heal': {
      for (let k = 0; k < 4; k++) {
        const ox = (rnd(v.seed, k) - 0.5) * 40, rise = p * 40 + k * 6;
        c.fillStyle = `rgba(111,207,127,${a})`;
        c.fillRect(v.x + ox - 2, v.y - rise - 6, 4, 12); c.fillRect(v.x + ox - 6, v.y - rise - 2, 12, 4);
      }
      break;
    }
    case 'taunt': {
      for (let k = 0; k < 2; k++) {
        const q = Math.max(0, p - k * 0.25) / (1 - k * 0.25);
        c.strokeStyle = `rgba(255,90,70,${1 - q})`; c.lineWidth = 3;
        c.beginPath(); c.arc(v.x, v.y, 10 + q * 60, 0, Math.PI * 2); c.stroke();
      }
      text(c, '!', v.x, v.y - 50 - p * 10, 26, `rgba(255,90,70,${a})`, 'center', 600);
      break;
    }
    case 'bash': {
      const r = 10 + p * 24;
      c.fillStyle = `rgba(255,220,90,${a})`;
      c.beginPath();
      for (let k = 0; k < 16; k++) { const ang = (k / 16) * Math.PI * 2, rr = k % 2 ? r * 0.45 : r; c.lineTo(v.x + Math.cos(ang) * rr, v.y + Math.sin(ang) * rr); }
      c.fill();
      break;
    }
    case 'smite': {
      const g = c.createLinearGradient(0, 40, 0, v.y + 30);
      g.addColorStop(0, 'rgba(255,240,170,0)'); g.addColorStop(1, `rgba(255,240,170,${a})`);
      c.fillStyle = g; c.fillRect(v.x - 8 + p * 4, 40, 16 - p * 8, v.y - 10);
      c.fillStyle = `rgba(255,250,210,${a})`; c.beginPath(); c.arc(v.x, v.y, 10 + p * 10, 0, Math.PI * 2); c.fill();
      break;
    }
    case 'ward': {
      c.strokeStyle = `rgba(143,179,255,${a})`; c.lineWidth = 3;
      c.fillStyle = `rgba(143,179,255,${a * 0.15})`;
      c.beginPath(); c.ellipse(v.x, v.y, 60 + p * 80, 30 + p * 40, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      break;
    }
  }
  c.restore();
}

/** Alt-tab, old-Windows style (a fullscreen game changing display modes). Over the random lag:
 *  1. freeze: the last frame hangs and tears (shifted horizontal slices),
 *  2. desktop: the teal Win9x desktop shows through; the frozen window shrinks toward the taskbar in stutters,
 *     leaving stale copies behind (the window "smear"),
 *  3. mode change: black, with a monitor-OSD flash,
 *  4. the new screen comes in at a blocky low resolution that sharpens, still tearing a little.
 *  An hourglass cursor sits on top throughout. */
let swSnap: HTMLCanvasElement | null = null, swSmear: HTMLCanvasElement | null = null, swTarget: HTMLCanvasElement | null = null;
let swRef: object | null = null, swPhase = 0, swScratch: HTMLCanvasElement | null = null;
const mk = () => { const c = document.createElement('canvas'); c.width = MON_W; c.height = MON_H; return c; };

function hourglass(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  c.save(); c.translate(x, y); c.rotate(Math.floor(t * 2) % 4 === 3 ? Math.PI / 2 * ((t * 8) % 1) : 0);
  c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-7, -11); c.lineTo(7, -11); c.lineTo(7, -8); c.lineTo(1.5, 0); c.lineTo(7, 8); c.lineTo(7, 11); c.lineTo(-7, 11); c.lineTo(-7, 8); c.lineTo(-1.5, 0); c.lineTo(-7, -8); c.closePath(); c.fill(); c.stroke();
  const k = (t * 0.8) % 1;
  c.fillStyle = '#c9a46a';
  c.beginPath(); c.moveTo(-5 + k * 3, -8 + k * 6); c.lineTo(5 - k * 3, -8 + k * 6); c.lineTo(0.8, -1); c.lineTo(-0.8, -1); c.fill();
  c.fillRect(-5, 9 - k * 6, 10, k * 6);
  c.restore();
}
function tear(c: CanvasRenderingContext2D, img: HTMLCanvasElement, amount: number) {
  let y = 0;
  while (y < MON_H) {
    const h = 6 + Math.floor(Math.random() * 30);
    const dx = Math.random() < 0.5 ? 0 : Math.round((Math.random() - 0.5) * amount);
    c.drawImage(img, 0, y, MON_W, h, dx, y, MON_W, h);
    if (dx > 0) c.drawImage(img, MON_W - dx, y, dx, h, 0, y, dx, h);
    y += h;
  }
}
function desktop(c: CanvasRenderingContext2D) {
  c.fillStyle = '#008080'; c.fillRect(0, 0, MON_W, MON_H);
  const icons = ['My Computer', 'Recycle Bin', 'Loot Night', 'Q3_report.xls'];
  icons.forEach((name, i) => {
    const y = 14 + i * 58;
    c.fillStyle = i === 3 ? '#1f7a3a' : i === 2 ? '#5b3aa8' : '#c0c0c0'; c.fillRect(22, y, 28, 24);
    c.fillStyle = '#000'; c.fillRect(22, y + 24, 28, 2);
    c.font = '10px "MS Sans Serif", Tahoma, Arial, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(name, 36, y + 38);
  });
  // taskbar
  c.fillStyle = '#c0c0c0'; c.fillRect(0, MON_H - 22, MON_W, 22);
  c.fillStyle = '#fff'; c.fillRect(0, MON_H - 22, MON_W, 1);
  c.fillStyle = '#c0c0c0'; c.fillRect(3, MON_H - 19, 54, 16);
  c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(3.5, MON_H - 3.5); c.lineTo(3.5, MON_H - 18.5); c.lineTo(56.5, MON_H - 18.5); c.stroke();
  c.strokeStyle = '#404040'; c.beginPath(); c.moveTo(56.5, MON_H - 18.5); c.lineTo(56.5, MON_H - 3.5); c.lineTo(3.5, MON_H - 3.5); c.stroke();
  c.fillStyle = '#000'; c.font = 'bold 11px Tahoma, Arial, sans-serif'; c.textAlign = 'left'; c.fillText('Start', 22, MON_H - 7);
  c.fillStyle = '#e04a2a'; c.fillRect(8, MON_H - 15, 5, 4); c.fillStyle = '#3aa83a'; c.fillRect(13, MON_H - 15, 5, 4); c.fillStyle = '#2a5ae0'; c.fillRect(8, MON_H - 11, 5, 4); c.fillStyle = '#e0c02a'; c.fillRect(13, MON_H - 11, 5, 4);
  ['Loot Night', 'Q3_report.xls'].forEach((name, i) => {
    const x = 62 + i * 140;
    c.fillStyle = '#c0c0c0'; c.fillRect(x, MON_H - 19, 134, 16);
    c.strokeStyle = '#fff'; c.strokeRect(x + 0.5, MON_H - 18.5, 133, 15);
    c.fillStyle = '#000'; c.font = '11px Tahoma, Arial, sans-serif'; c.fillText(name, x + 6, MON_H - 7);
  });
  c.fillStyle = '#000'; c.textAlign = 'right'; c.fillText(new Date().toTimeString().slice(0, 5), MON_W - 8, MON_H - 7);
}
function drawTarget(c: CanvasRenderingContext2D, to: string) {
  const n = S.g.night!;
  c.clearRect(0, 0, MON_W, MON_H);
  if (to === 'excel') drawExcel(c);
  else if (n.location === 'town') drawTownScreen(c);
  else drawDungeon(c);
}

function drawSwitching(c: CanvasRenderingContext2D, sw: { to: string; t: number; max: number }) {
  const t = performance.now() / 1000;
  const p = 1 - sw.t / sw.max;
  if (swRef !== sw) {                 // first frame of this switch: grab what was on screen
    swRef = sw; swPhase = 0;
    swSnap = swSnap ?? mk(); swSmear = swSmear ?? mk(); swTarget = swTarget ?? mk();
    const s = swSnap.getContext('2d')!;
    s.clearRect(0, 0, MON_W, MON_H);
    s.drawImage(c.canvas, 0, 0);
    swSmear.getContext('2d')!.clearRect(0, 0, MON_W, MON_H);
  }
  c.clearRect(0, 0, MON_W, MON_H);
  const snap = swSnap!;
  if (p < 0.22) {
    // 1. frozen, tearing
    c.fillStyle = '#000'; c.fillRect(0, 0, MON_W, MON_H);
    if (Math.random() < 0.85) tear(c, snap, 90 * (p / 0.22) + 14); else c.drawImage(snap, 0, 0);
    if (Math.random() < 0.25) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; c.drawImage(snap, 3, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  } else if (p < 0.55) {
    // 2. desktop shows; the frozen window shrinks in stutters toward its taskbar button, leaving a smear
    const k = (p - 0.22) / 0.33;
    const steps = 5, stepK = (1 + Math.floor(k * steps)) / (steps + 1);   // stutter: a few distinct sizes, desktop visible from the start
    const sm = swSmear!.getContext('2d')!;
    const w = MON_W * (1 - stepK * 0.82), h = MON_H * (1 - stepK * 0.9);
    const x = (62 + 0) * stepK, y = (MON_H - 22 - h) * stepK;
    sm.drawImage(snap, x, y, w, h);                                   // never cleared: stale copies stay behind
    desktop(c);
    c.drawImage(swSmear!, 0, 0);
    if (swPhase < 1) { swPhase = 1; }
  } else if (p < 0.75) {
    // 3. display mode change: black, monitor OSD flashes
    if (swPhase < 2) { swPhase = 2; sfx.monClick(); }
    c.fillStyle = '#000'; c.fillRect(0, 0, MON_W, MON_H);
    const k = (p - 0.55) / 0.2;
    if (k < 0.12) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, MON_H / 2 - 1, MON_W, 2); }
    if (k > 0.3) {
      c.fillStyle = '#1a3a1a'; c.fillRect(MON_W - 150, 14, 136, 34);
      c.font = '11px monospace'; c.textAlign = 'left'; c.fillStyle = '#4fe04f';
      c.fillText(sw.to === 'excel' ? '1024 x 768  60Hz' : '800 x 600  75Hz', MON_W - 142, 28);
      c.fillText('Analog', MON_W - 142, 42);
    }
  } else {
    // 4. the new screen arrives blocky and sharpens, a few tears on the way
    const k = (p - 0.75) / 0.25;
    drawTarget(swTarget!.getContext('2d')!, sw.to);
    const px = Math.max(1, Math.round(12 * (1 - k)));
    if (px > 1) {
      const lw = Math.ceil(MON_W / px), lh = Math.ceil(MON_H / px);
      c.imageSmoothingEnabled = false;
      c.drawImage(swTarget!, 0, 0, MON_W, MON_H, 0, 0, lw, lh);
      c.drawImage(c.canvas, 0, 0, lw, lh, 0, 0, MON_W, MON_H);
    } else c.drawImage(swTarget!, 0, 0);
    if (k < 0.5 && Math.random() < 0.5) { swScratch = swScratch ?? mk(); const g = swScratch.getContext('2d')!; g.clearRect(0, 0, MON_W, MON_H); g.drawImage(c.canvas, 0, 0); tear(c, swScratch, 24); }
  }
  hourglass(c, MON_W / 2 + 8, MON_H / 2 + 4, t);
}
