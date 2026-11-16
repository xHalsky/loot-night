// On-desk scenes drawn over the desk panel (no windows): the dog, the cable fix, and her sitting on the desk.
// Design doc section 10. Rules live in systems/pets.ts and systems/lap.ts.
import { S } from '../core/state';
import { petStroke, plugIn, PLUGS, CABLE_COLORS } from '../systems/pets';
import { LAP_QS } from '../systems/lap';
import { drawHerLap, OUTFIT_BY_ACTIVITY } from './her';
import { pixelSprite, blit, smooth, cel } from './pixel';
import { sfx } from './audio';

const DW = 680, DH = 720;
let scale = 1;
export function setDeskScale(s: number) { scale = s; }

// ---------- dog (pixel sprite, 84 x 110 at 3x) ----------
// He stands on the floor next to your chair: only head, chest and front paws (on the desk edge) are in view.
const DOG_PX = 2, DOG_W = 120, DOG_H = 116, DOG_X0 = 340 - (DOG_W / 2) * DOG_PX, DOG_Y0 = 720 - DOG_H * DOG_PX;
const HEAD = { x: 340, y: DOG_Y0 + 40 * DOG_PX };
let dogY = 360, lastT = 0, petting = false, last = { x: 0, y: 0, t: 0 };
let hearts: { x: number; y: number; vy: number; t: number }[] = [];
const SWEET: [number, number][] = [[-38, -48], [38, -48], [0, 38]];   // left ear, right ear, chin (from head centre)

// ---------- cables ----------
const SOCKETS = [130, 265, 400, 535].map(x => ({ x, y: 190 }));
const PLUG_HOME = [150, 272, 408, 530].map((x, i) => ({ x, y: 470 + (i % 2) * 18 }));
const plugPos = PLUG_HOME.map(p => ({ ...p }));
let dragPlug = -1, shake = 0;

function toDesk(ev: PointerEvent) {
  const r = document.getElementById('deskInner')!.getBoundingClientRect();
  return { x: (ev.clientX - r.left) / scale, y: (ev.clientY - r.top) / scale };
}

document.addEventListener('pointerdown', ev => {
  const n = S.g.night;
  if (!n || S.g.paused || n.game) return;
  const p = toDesk(ev);
  if (n.unplugged) {
    for (let i = 0; i < n.unplugged.kinds.length; i++) if (!n.unplugged.plugged[i] && Math.hypot(p.x - plugPos[i].x, p.y - plugPos[i].y - 10) < 36) {
      dragPlug = i; ev.preventDefault(); ev.stopImmediatePropagation(); sfx.click(); return;
    }
  }
  if (n.dog.stage === 'up' && !n.lap) {
    if (Math.hypot(p.x - HEAD.x, (p.y - (HEAD.y + dogY)) * 1.1) < 80) { petting = true; last = { ...p, t: performance.now() }; ev.preventDefault(); ev.stopImmediatePropagation(); }
  }
}, true);
document.addEventListener('pointermove', ev => {
  const n = S.g.night;
  if (!n) return;
  const p = toDesk(ev);
  if (dragPlug >= 0) { plugPos[dragPlug].x = p.x; plugPos[dragPlug].y = p.y - 10; return; }
  if (petting) {
    const now = performance.now();
    const dist = Math.hypot(p.x - last.x, p.y - last.y), dt = Math.max(1, now - last.t) / 1000;
    const sweet = SWEET[n.dog.sweet];
    const onSweet = Math.hypot(p.x - (HEAD.x + sweet[0]), p.y - (HEAD.y + dogY + sweet[1])) < 30;
    if (dist > 0.5) petStroke(dist, dist / dt, onSweet);
    if (onSweet && Math.random() < 0.15) hearts.push({ x: p.x, y: p.y, vy: -40, t: 1 });
    last = { ...p, t: now };
  }
});
document.addEventListener('pointerup', () => {
  const n = S.g.night;
  petting = false;
  if (dragPlug < 0 || !n || !n.unplugged) { dragPlug = -1; return; }
  const i = dragPlug; dragPlug = -1;
  let ok = false;
  for (let s = 0; s < SOCKETS.length; s++) if (Math.hypot(plugPos[i].x - SOCKETS[s].x, plugPos[i].y - SOCKETS[s].y) < 40) {
    ok = plugIn(i, s);
    if (ok) { plugPos[i].x = SOCKETS[s].x; plugPos[i].y = SOCKETS[s].y; } else shake = 0.35;
    break;
  }
  if (!ok) { plugPos[i].x = PLUG_HOME[i].x; plugPos[i].y = PLUG_HOME[i].y; }
});

// ---------- dog ----------
const FUR = '#e48f3e', FUR_S = '#b9652a', CREAM = '#fbe6c4', CREAM_S = '#e2c497';
function dogSprite(t: number, blissed: boolean, waiting: boolean) {
  const flap = waiting ? Math.round(Math.sin(t * 10) * 1.5) : 0;
  const happy = blissed || S.g.night!.dog.stage === 'happy';
  return pixelSprite('dog', DOG_W, DOG_H, c => {
    const ln = { color: '#3b2016', w: 0.9 };
    // chest rising from below the frame + cream bib
    cel(c, smooth([[30, 62], [90, 62], [101, 90], [106, 120], [14, 120], [19, 90]]), FUR, FUR_S, 1.4, ln);
    c.fillStyle = CREAM; c.fill(smooth([[42, 60], [78, 60], [83, 84], [60, 108], [37, 84]]));
    c.strokeStyle = CREAM_S; c.lineWidth = 0.7; c.beginPath(); c.moveTo(48, 80); c.lineTo(52, 86); c.moveTo(72, 80); c.lineTo(68, 86); c.moveTo(60, 88); c.lineTo(60, 95); c.stroke();   // fluff
    // front legs up on the desk edge
    for (const sd of [-1, 1]) {
      cel(c, smooth([[60 + sd * 26, 118], [60 + sd * 40, 118], [60 + sd * 42, 100], [60 + sd * 44, 90], [60 + sd * 34, 86], [60 + sd * 28, 98]]), FUR, FUR_S, 0.8, ln);
      cel(c, smooth([[60 + sd * 28, 84], [60 + sd * 37, 79], [60 + sd * 48, 81], [60 + sd * 51, 88], [60 + sd * 44, 93], [60 + sd * 32, 92]]), CREAM, CREAM_S, 0.6, ln);
      c.strokeStyle = CREAM_S; c.lineWidth = 0.8; c.beginPath();
      for (const k of [0, 1, 2]) { c.moveTo(60 + sd * (36 + k * 4.5), 82); c.lineTo(60 + sd * (37 + k * 4.5), 87); }
      c.stroke();
    }
    // ears (behind the head)
    for (const sd of [-1, 1]) {
      const tip = 60 + sd * (26 + flap);
      cel(c, smooth([[60 + sd * 10, 18], [tip, 2, 1], [60 + sd * 27, 30]]), FUR, FUR_S, 0.8, ln);
      c.fillStyle = '#f2b2a0'; c.fill(smooth([[60 + sd * 14, 19], [tip - sd * 2, 7, 1], [60 + sd * 23, 27]]));
    }
    // head
    cel(c, smooth([[34, 32], [38, 17], [60, 11], [82, 17], [86, 32], [84, 48], [72, 60], [48, 60], [36, 48]]), FUR, FUR_S, 1.2, ln);
    c.fillStyle = CREAM; c.fill(smooth([[39, 44], [51, 38], [60, 41], [69, 38], [81, 44], [77, 56], [60, 63], [43, 56]]));
    c.fillStyle = CREAM; c.beginPath(); c.ellipse(49, 25, 2.4, 1.6, 0, 0, Math.PI * 2); c.ellipse(71, 25, 2.4, 1.6, 0, 0, Math.PI * 2); c.fill();    // shiba brow dots
    for (const sd of [-1, 1]) {
      const ex = 60 + sd * 11, ey = 34;
      if (happy) { c.strokeStyle = '#2a160e'; c.lineWidth = 1.6; c.beginPath(); c.arc(ex, ey + 1.5, 3.6, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      else {
        c.fillStyle = '#1e120c'; c.beginPath(); c.ellipse(ex, ey, 4.4, 5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#5a3a24'; c.beginPath(); c.ellipse(ex, ey + 1.5, 3, 2.6, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 1.2, ey - 1.8, 1.5, 0, Math.PI * 2); c.fill(); c.fillRect(ex - 2, ey + 1.5, 1, 1);
        if (waiting) { c.strokeStyle = FUR_S; c.lineWidth = 1.1; c.beginPath(); c.moveTo(ex - sd * 3, ey - 7); c.lineTo(ex + sd * 4, ey - 9); c.stroke(); }
      }
    }
    c.fillStyle = '#22140f'; c.beginPath(); c.ellipse(60, 46, 4.6, 3.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(58, 44.4, 2, 1.1);
    c.strokeStyle = '#22140f'; c.lineWidth = 1; c.beginPath(); c.moveTo(60, 49); c.lineTo(60, 52); c.moveTo(53.5, 52.5); c.quadraticCurveTo(60, 56.5, 66.5, 52.5); c.stroke();
    if (happy) cel(c, smooth([[57, 53], [63.5, 53], [64.5, 62], [60, 65], [56, 61]]), '#f07d8e', '#c9566a', 0.5, ln);
  }, { redraw: true });
}

function drawDog(c: CanvasRenderingContext2D, t: number) {
  const n = S.g.night!;
  const d = n.dog;
  const target = d.stage === 'up' ? 0 : 360;
  dogY += (target - dogY) * 0.16;
  if (dogY > 340) return;
  const blissed = petting && d.pet > 0.15;
  const waiting = d.stage === 'up' && !petting;
  const hop = waiting ? Math.round(Math.abs(Math.sin(t * 5)) * -4) * 2 : 0;
  const sp = dogSprite(t, blissed, waiting);
  const wiggle = Math.round(Math.sin(t * (6 + d.pet * 16)) * d.pet * 3) * 2;      // happier = more wiggle (his tail is wagging below)
  const shiver = d.flinch > 0 ? Math.round(Math.sin(t * 60)) * 2 : 0;
  blit(c, sp, DOG_X0 + shiver + wiggle, DOG_Y0 + dogY + hop, DOG_PX);
  const hy = HEAD.y + dogY + hop;
  if (waiting && Math.floor(t * 1.2) % 3 === 0) { c.fillStyle = '#fff'; c.font = '700 15px Inter, sans-serif'; c.textAlign = 'center'; c.fillText(d.t < 4 ? 'woof! WOOF!' : '*whine*', HEAD.x + 130, hy - 40); }
  if (waiting && d.pet === 0) { c.fillStyle = 'rgba(255,255,255,.8)'; c.font = '600 13px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('stroke his head (gently)', HEAD.x, hy - 98); }
}

function drawHearts(c: CanvasRenderingContext2D, dt: number) {
  hearts = hearts.filter(h => (h.t -= dt) > 0);
  for (const h of hearts) { h.y += h.vy * dt; c.globalAlpha = h.t; c.fillStyle = '#ff6b8f'; c.font = '20px sans-serif'; c.textAlign = 'center'; c.fillText('♥', h.x, h.y); c.globalAlpha = 1; }
}

// ---------- cables: 9 port shapes ----------
function portPath(k: number, x: number, y: number, s: number): Path2D {
  const p = new Path2D();
  const R = (w: number, h: number, r = 0) => p.roundRect(x - w * s / 2, y - h * s / 2, w * s, h * s, r * s);
  const trap = (wt: number, wb: number, h: number) => { p.moveTo(x - wt * s / 2, y - h * s / 2); p.lineTo(x + wt * s / 2, y - h * s / 2); p.lineTo(x + wb * s / 2, y + h * s / 2); p.lineTo(x - wb * s / 2, y + h * s / 2); p.closePath(); };
  switch (k) {
    case 0: trap(44, 34, 15); break;                                                                    // HDMI
    case 1: p.moveTo(x - 20 * s, y - 8 * s); p.lineTo(x + 20 * s, y - 8 * s); p.lineTo(x + 20 * s, y + 2 * s); p.lineTo(x + 14 * s, y + 8 * s); p.lineTo(x - 20 * s, y + 8 * s); p.closePath(); break;   // DisplayPort
    case 2: p.ellipse(x - 8 * s, y, 9 * s, 9 * s, 0, 0, Math.PI * 2); p.ellipse(x + 8 * s, y, 9 * s, 9 * s, 0, 0, Math.PI * 2); break;   // figure-8 power
    case 3: R(36, 12, 1); break;                                                                        // USB-A
    case 4: R(26, 9, 4.5); break;                                                                       // USB-C
    case 5: R(54, 18, 2); break;                                                                        // DVI
    case 6: trap(46, 36, 22); break;                                                                    // VGA
    case 7: p.moveTo(x - 13 * s, y - 11 * s); p.lineTo(x + 13 * s, y - 11 * s); p.lineTo(x + 13 * s, y + 6 * s); p.lineTo(x + 5 * s, y + 6 * s); p.lineTo(x + 5 * s, y + 11 * s); p.lineTo(x - 5 * s, y + 11 * s); p.lineTo(x - 5 * s, y + 6 * s); p.lineTo(x - 13 * s, y + 6 * s); p.closePath(); break;   // Ethernet
    default: p.ellipse(x, y, 7 * s, 7 * s, 0, 0, Math.PI * 2);                                           // 3.5 mm audio
  }
  return p;
}
function portDetail(c: CanvasRenderingContext2D, k: number, x: number, y: number, s: number, col: string) {
  c.fillStyle = col;
  if (k === 3) c.fillRect(x - 14 * s, y - 2 * s, 28 * s, 4 * s);
  if (k === 4) c.fillRect(x - 8 * s, y - 1 * s, 16 * s, 2 * s);
  if (k === 5) for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) c.fillRect(x - 20 * s + i * 4.5 * s, y - 5 * s + j * 4.5 * s, 1.6 * s, 1.6 * s);
  if (k === 6) for (let j = 0; j < 3; j++) for (let i = 0; i < 5 - (j === 2 ? 1 : 0); i++) c.fillRect(x - 13 * s + i * 6.5 * s + j * 2, y - 6 * s + j * 6 * s, 2 * s, 2 * s);
  if (k === 7) for (let i = 0; i < 8; i++) c.fillRect(x - 10 * s + i * 2.8 * s, y - 9 * s, 1.2 * s, 5 * s);
  if (k === 8) { c.beginPath(); c.arc(x, y, 2.4 * s, 0, Math.PI * 2); c.fill(); }
  if (k === 2) { c.beginPath(); c.arc(x - 8 * s, y, 2.2 * s, 0, Math.PI * 2); c.arc(x + 8 * s, y, 2.2 * s, 0, Math.PI * 2); c.fill(); }
  if (k === 0 || k === 1) c.fillRect(x - 13 * s, y - 2 * s, 26 * s, 3 * s);
}

function drawCables(c: CanvasRenderingContext2D, t: number) {
  const u = S.g.night!.unplugged!;
  const sx = shake > 0 ? Math.sin(t * 80) * 4 : 0;
  c.fillStyle = '#1b1820'; c.beginPath(); c.roundRect(22, 16, 636, 400, 6); c.fill();
  c.fillStyle = '#24212b'; for (let i = 0; i < 18; i++) { c.beginPath(); c.roundRect(60 + i * 32, 300, 18, 70, 4); c.fill(); }
  c.fillStyle = '#e8e4d4'; c.font = '700 16px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('Behind the monitor: plug each cable into the port of the same shape', 340, 60);
  c.fillStyle = '#a999bd'; c.font = '13px Inter, sans-serif'; c.fillText('the dog knocked them out', 340, 82);
  SOCKETS.forEach((s, slot) => {
    const k = u.kinds[u.sockets[slot]];
    c.fillStyle = '#0d0c11'; c.beginPath(); c.roundRect(s.x - 46 + sx, s.y - 34, 92, 68, 8); c.fill();
    const p = portPath(k, s.x + sx, s.y, 1.15);
    c.fillStyle = '#000'; c.fill(p); c.strokeStyle = '#7a7488'; c.lineWidth = 2; c.stroke(p);
    portDetail(c, k, s.x + sx, s.y, 1.15, '#3a3644');
    c.fillStyle = '#8a8496'; c.font = '600 11px Inter, sans-serif'; c.fillText(PLUGS[k], s.x + sx, s.y + 52);
  });
  u.kinds.forEach((k, i) => {
    const p = plugPos[i], col = CABLE_COLORS[u.colors[i]], plugged = u.plugged[i];
    c.strokeStyle = col; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(PLUG_HOME[i].x, DH + 10); c.bezierCurveTo(PLUG_HOME[i].x, 640, p.x, p.y + 130, p.x, p.y + 30); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = col; c.beginPath(); c.roundRect(p.x - 22, p.y + 8, 44, 30, 6); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.stroke();
    const head = portPath(k, p.x, p.y, 1);
    c.fillStyle = plugged ? '#c9a46a' : '#d9d4c6'; c.fill(head); c.strokeStyle = '#6a6458'; c.lineWidth = 1.2; c.stroke(head);
    portDetail(c, k, p.x, p.y, 1, '#8a8474');
    if (!plugged && dragPlug !== i) { c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.setLineDash([4, 4]); c.lineDashOffset = -t * 20; c.beginPath(); c.arc(p.x, p.y + 12, 34, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
  });
}

// ---------- her on the desk, first person ----------
function drawLap(c: CanvasRenderingContext2D, t: number) {
  const l = S.g.night!.lap!;
  const look = OUTFIT_BY_ACTIVITY[l.outfit] ?? OUTFIT_BY_ACTIVITY.tv;
  const k = l.stage === 'arrive' ? Math.max(0, l.t / 1.2) : l.stage === 'leave' ? 1 - Math.max(0, l.t / 1.4) : 0;
  const breathe = Math.sin(t * 1.6) > 0 ? 3 : 0;
  const pose = Math.min(2, l.sweet);
  c.fillStyle = `rgba(0,0,0,${0.35 * (1 - k)})`; c.fillRect(0, 0, DW, 440);
  drawHerLap(c, { outfit: look.outfit, face: l.face, blink: (t % 4.1) < 0.13 }, pose, Math.round(k * 240 / 3) * 3, Math.round((k * 60 + breathe) / 3) * 3, 1 - k);
}

export function drawDeskFx() {
  const cv = document.getElementById('deskFx') as HTMLCanvasElement | null;
  const n = S.g.night;
  if (!cv) return;
  const c = cv.getContext('2d')!;
  c.clearRect(0, 0, DW, DH);
  if (!n) return;
  const t = performance.now() / 1000;
  const dt = Math.min(0.05, lastT ? t - lastT : 0.016); lastT = t;
  shake = Math.max(0, shake - dt);
  if (n.unplugged) drawCables(c, t);
  else for (let i = 0; i < PLUG_HOME.length; i++) { plugPos[i].x = PLUG_HOME[i].x; plugPos[i].y = PLUG_HOME[i].y; }
  if (n.lap) drawLap(c, t);
  drawDog(c, t);
  drawHearts(c, dt);
}

/** DOM part of the lap scene: her line and the three answers. */
export function lapUiHtml(): string {
  const l = S.g.night?.lap;
  if (!l) return '';
  const bubble = `<div class="lap-bubble">${l.line}</div>`;
  if (l.stage !== 'ask') return bubble;
  const q = LAP_QS[l.q];
  return `${bubble}<div class="lap-answers">${l.order.map(k => `<button class="lap-ans" data-act="lapAns" data-arg="${k}">${q.a[k]}</button>`).join('')}
    <div class="lap-timer"><i style="width:${Math.max(0, Math.round(l.t / 7 * 20) * 5)}%"></i></div></div>`;
}
