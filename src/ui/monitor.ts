import { T } from '../config/tuning';
import { PK } from 'virtual:pagekit';
import { S, N } from '../core/state';
import {  type Px } from '../data/heroes';
import { q4View, q4SetHits } from '../render/q4View';
import { sfx } from './audio';
import { GAME_W, GAME_H, BATTLE_W } from './layout';

/** The canvas is the whole game screen (#49); the side panel is DOM over its right part. */
export const MON_W = GAME_W, MON_H = GAME_H;
const FONT = '"Pixelify Sans", monospace';


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
/** The loot goblin runs across the battle area (grid px, core/arena.ts). */
export const goblinPos = () => { const n = N(); if (!n.goblin) return null; return { x: 320 - (1 - n.goblin.t / T.GOBLIN_SEC) * 330, y: 200 }; };

export function drawMonitor(c: CanvasRenderingContext2D, live = false) {
  const n = S.g.night;
  c.imageSmoothingEnabled = false;
  if (n?.switching) { drawSwitching(c, n.switching); return; }   // before clearing: it grabs the last frame
  c.clearRect(0, 0, MON_W, MON_H);
  if (!n) { c.fillStyle = '#09070c'; c.fillRect(0, 0, MON_W, MON_H); return; }
  if (n.monitorOff > 0) {
    c.fillStyle = '#000'; c.fillRect(0, 0, MON_W, MON_H);
    if (n.unplugged && PK.ready()) { c.drawImage(PK.noSignal(performance.now() / 1000), 0, 0, 474, 232, 0, 0, MON_W, MON_H); return; }   // V6 (#71): the monitor's own message box
    if (n.unplugged) { text(c, 'NO SIGNAL', MON_W / 2, 170, 22, '#6e6280', 'center'); text(c, 'check the cable', MON_W / 2, 196, 13, '#4a3a5c', 'center'); return; }
    text(c, 'She turned the monitor off.', MON_W / 2, 170, 18, '#6e6280', 'center');
    text(c, `${Math.ceil(n.monitorOff)} s · the party fights on, drops are lost`, MON_W / 2, 196, 13, '#4a3a5c', 'center');
    return;
  }
  if (n.monitor === 'excel') { drawExcel(c); return; }
  if (live) { sidePanelBack(c); return; }   // V2: the dungeon, the town and the panel are drawn by the renderer (render/liveRpg.ts)
  drawDungeon(c);
}

/** Until the renderer is ready (its fonts load in a moment), the battle area stays dark (V2 draws the RPG). */
function drawDungeon(c: CanvasRenderingContext2D) {
  c.fillStyle = '#0a0814'; c.fillRect(0, 0, BATTLE_W, GAME_H);
  sidePanelBack(c);
}
/** Under the DOM side panel: its colour, so a frozen frame (the alt-tab switch) still shows a panel there. */
function sidePanelBack(c: CanvasRenderingContext2D) { c.fillStyle = '#2a1f14'; c.fillRect(BATTLE_W, 0, GAME_W - BATTLE_W, GAME_H); }


// ---------------- Excel: Q4, the clicker that pays zl (step 4, #55), drawn by the renderer ----------------
let q4At = 0, q4Last: HTMLCanvasElement | null = null;
function drawExcel(c: CanvasRenderingContext2D) {
  if (!PK.ready()) { c.fillStyle = '#c0c0c0'; c.fillRect(0, 0, MON_W, MON_H); return; }
  const now = performance.now();
  if (!q4Last || now - q4At >= 33) {   // 30 fps
    q4At = now;
    const r = PK.q4(q4View(now), now / 1000);
    q4SetHits(r.hits); q4Last = r.canvas;
  }
  c.imageSmoothingEnabled = false;
  c.drawImage(q4Last, 0, 0, 474, 232, 0, 0, MON_W, MON_H);
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
  const icons = ['My Computer', 'Recycle Bin', 'Age of Judgment', 'Q3_report.xls'];
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
  ['Age of Judgment', 'Q3_report.xls'].forEach((name, i) => {
    const x = 62 + i * 140;
    c.fillStyle = '#c0c0c0'; c.fillRect(x, MON_H - 19, 134, 16);
    c.strokeStyle = '#fff'; c.strokeRect(x + 0.5, MON_H - 18.5, 133, 15);
    c.fillStyle = '#000'; c.font = '11px Tahoma, Arial, sans-serif'; c.fillText(name, x + 6, MON_H - 7);
  });
  c.fillStyle = '#000'; c.textAlign = 'right'; c.fillText(new Date().toTimeString().slice(0, 5), MON_W - 8, MON_H - 7);
}
function drawTarget(c: CanvasRenderingContext2D, to: string) {
  c.clearRect(0, 0, MON_W, MON_H);
  if (to === 'excel') drawExcel(c);
  else { drawDungeon(c); liveFrame(c); }
}
/** The renderer's last RPG frame (its battle area and side panel are canvases of their own, over this one), so the
 *  alt-tab switch freezes and brings back the real picture, not the dark monitor under it. */
function liveFrame(c: CanvasRenderingContext2D) {
  const a = document.getElementById('rpgArea') as HTMLCanvasElement | null, b = document.getElementById('spArea') as HTMLCanvasElement | null;
  c.imageSmoothingEnabled = false;
  if (a?.width) c.drawImage(a, 0, 0, BATTLE_W, GAME_H);
  if (b?.width) c.drawImage(b, BATTLE_W, 0, GAME_W - BATTLE_W, GAME_H);
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
    if (sw.to === 'excel') liveFrame(s);   // leaving the RPG: freeze the renderer's picture
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
