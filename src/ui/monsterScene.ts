// The Monster break, drawn on one canvas inside its window (docs/design/desk.md).
// Fridge -> grab any can, put it anywhere on the desk -> click it open -> hold to drink (can goes to your mouth)
// -> throw the empty into the bin (Verlet capsule physics; the bin keeps its cans all night).
import { T } from '../config/tuning';
import { S, N, type MonsterGame, type BinCan } from '../core/state';
import { monsterOpenFridge, monsterPlaced, monsterOpenCan, setMonsterHold, monsterClank, monsterBinned } from '../systems/monster';
import { sfx } from './audio';
import { pixelSprite, smooth, cel } from './pixel';

export const SW = 440, SH = 236;
const DESK_Y = 176;                 // desk top (desk view)
const CAN_L = 46, CAN_W = 22;       // can size in the desk view
const NECK = { x: 392, y: 150 };
/** Mouth position with the head tilted back by `tilt` radians. */
const GUY_DX = 20;   // the whole guy sits this much further left than his drawing coordinates
function mouthAt(tilt: number) { const dx = 358 - NECK.x, dy = 110 - NECK.y; return { x: NECK.x - GUY_DX + dx * Math.cos(tilt) - dy * Math.sin(tilt), y: NECK.y + dx * Math.sin(tilt) + dy * Math.cos(tilt) }; }
// Text is drawn at full resolution on top of the pixelated scene.
let texts: { t: string; x: number; y: number; font: string; fill: string; align: CanvasTextAlign; alpha: number }[] = [];
function say(c: CanvasRenderingContext2D, t: string, x: number, y: number) { texts.push({ t, x, y, font: c.font, fill: c.fillStyle as string, align: c.textAlign, alpha: c.globalAlpha }); }
let buf: HTMLCanvasElement | null = null;
const FRIDGE = { x: 12, y: 54, w: 132, h: 182 };
const SLOTS: { x: number; y: number }[] = [];
for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) SLOTS.push({ x: FRIDGE.x + 25 + i * 27, y: FRIDGE.y + 38 + r * 54 });

// Toss view geometry
const FLOOR = 222, R = 8, STICK = 28;
const BIN = { l: 300, r: 372, top: 148, inL: 306, inR: 366 };
const BIN_SEGS: [number, number, number, number][] = [[BIN.l, BIN.top, BIN.inL, FLOOR], [BIN.r, BIN.top, BIN.inR, FLOOR]];
const SLING = { x: 92, y: 120 };          // where the empty can floats, ready to fling
const PULL_MAX = 84, LAUNCH_K = 10.5;

interface P { x: number; y: number; px: number; py: number }
interface Body { a: P; b: P; still: number; touchedWall: boolean; touchedRim: boolean }

// ---------- scene-local state (UI only; outcomes go through systems/monster.ts) ----------
let doorT = 0;
let taken = -1;                      // fridge slot the can came from
let grab: { slot: number; x: number; y: number; vx: number; back: number } | null = null;
let falling: { x: number; y: number; vy: number } | null = null;
let openFx = 0;
let arm = 0;                         // 0 = can on desk, 1 = can at the mouth
let pointer = { x: 0, y: 0, down: false };
let toss: { body: Body; held: boolean; flying: boolean; samples: { x: number; y: number; t: number }[]; missed: boolean; reset: number; pull: { x: number; y: number } } | null = null;
let binBodies: Body[] = [];
let lastGame: MonsterGame | null = null;
let lastT = 0;

const mkP = (x: number, y: number): P => ({ x, y, px: x, py: y });
const mkBody = (ax: number, ay: number, bx: number, by: number): Body => ({ a: mkP(ax, ay), b: mkP(bx, by), still: 0, touchedWall: false, touchedRim: false });

function reset(g: MonsterGame) {
  doorT = 0; taken = -1; grab = null; falling = null; openFx = 0; arm = 0; toss = null;
  binBodies = N().bin.map(c => mkBody(c.ax, c.ay, c.bx, c.by));
  lastGame = g;
}

function toScene(ev: PointerEvent, cv: HTMLCanvasElement) {
  const r = cv.getBoundingClientRect();
  return { x: ((ev.clientX - r.left) / r.width) * SW, y: ((ev.clientY - r.top) / r.height) * SH };
}

const fridgeCans = () => Math.max(0, 12 - N().cans);
const G = () => { const g = S.g.night?.game; return g && g.kind === 'monster' ? g : null; };

// ---------- input ----------
document.addEventListener('pointerdown', ev => {
  const cv = (ev.target as HTMLElement)?.closest?.('#mcv') as HTMLCanvasElement | null;
  const g = G();
  if (!cv || !g || S.g.paused) return;
  ev.preventDefault();
  const p = toScene(ev, cv);
  pointer = { ...p, down: true };
  if (g.stage === 'fridge') { if (p.x < FRIDGE.x + FRIDGE.w + 10) monsterOpenFridge(); return; }
  if (g.stage === 'grab' && !grab && !falling) {
    const n = fridgeCans();
    for (let i = 0; i < n; i++) {
      const s = SLOTS[i];
      if (i !== taken && Math.abs(p.x - s.x) < 14 && Math.abs(p.y - s.y) < 26) { grab = { slot: i, x: s.x, y: s.y, vx: 0, back: 0 }; sfx.click(); return; }
    }
    return;
  }
  if (g.stage === 'open') { if (Math.abs(p.x - g.canX) < 30 && p.y > DESK_Y - CAN_L - 20) monsterOpenCan(), openFx = 1; return; }
  if (g.stage === 'drink') { setMonsterHold(true); return; }
  if (g.stage === 'toss' && toss && !toss.flying && toss.reset <= 0) {
    const c = mid(toss.body);
    if (Math.hypot(p.x - c.x, p.y - c.y) < 50) { toss.held = true; sfx.click(); }
  }
});
document.addEventListener('pointermove', ev => {
  const cv = document.getElementById('mcv') as HTMLCanvasElement | null;
  if (!cv) return;
  const p = toScene(ev, cv);
  pointer.x = p.x; pointer.y = p.y;
});
document.addEventListener('pointerup', () => {
  pointer.down = false;
  const g = G();
  if (!g) return;
  if (grab && g.stage === 'grab') {
    const onDesk = grab.x > 168 && grab.x < 318 && grab.y < SH;
    if (onDesk) { falling = { x: grab.x, y: grab.y, vy: 0 }; taken = grab.slot; grab = null; }
    else grab.back = 1;
  }
  if (toss?.held) release();
});

function release() {
  if (!toss) return;
  toss.held = false;
  const pl = Math.hypot(toss.pull.x, toss.pull.y);
  if (pl < 12) { toss.pull = { x: 0, y: 0 }; placeInSling(); return; }   // barely pulled: nothing happens
  const vx = -toss.pull.x * LAUNCH_K, vy = -toss.pull.y * LAUNCH_K;
  const dt = 1 / 240;
  for (const p of [toss.body.a, toss.body.b]) { p.px = p.x - vx * dt; p.py = p.y - vy * dt; }
  toss.body.a.px += vy * dt * 0.06; toss.body.b.px -= vy * dt * 0.06;     // a bit of spin
  toss.flying = true; toss.body.still = 0; toss.body.touchedWall = false; toss.body.touchedRim = false;
  toss.pull = { x: 0, y: 0 };
  sfx.flip();
}
function placeInSling() {
  if (!toss) return;
  const b = toss.body;
  const x = SLING.x + toss.pull.x, y = SLING.y + toss.pull.y;
  b.a.x = b.a.px = x; b.a.y = b.a.py = y - STICK / 2; b.b.x = b.b.px = x; b.b.y = b.b.py = y + STICK / 2;
}
/** Where the can will fly: the dotted arc (no collisions). */
function trajectory(c: CanvasRenderingContext2D) {
  if (!toss) return;
  let x = SLING.x + toss.pull.x, y = SLING.y + toss.pull.y;
  let vx = -toss.pull.x * LAUNCH_K, vy = -toss.pull.y * LAUNCH_K;
  const dt = 1 / 30;
  for (let i = 0; i < 26; i++) {
    vy += 1500 * dt; x += vx * dt; y += vy * dt;
    if (y > FLOOR || x > SW) break;
    c.fillStyle = `rgba(255,255,255,${0.9 - i * 0.03})`; c.beginPath(); c.arc(x, y, 3 - i * 0.07, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(29,35,48,.35)'; c.lineWidth = 1; c.stroke();
  }
}

// ---------- physics (toss view) ----------
const mid = (b: Body) => ({ x: (b.a.x + b.b.x) / 2, y: (b.a.y + b.b.y) / 2 });

function collideSeg(p: P, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / (dx * dx + dy * dy)));
  const cx = x1 + dx * t, cy = y1 + dy * t;
  let nx = p.x - cx, ny = p.y - cy;
  const d = Math.hypot(nx, ny);
  if (d >= R || d === 0) return 0;
  nx /= d; ny /= d;
  const vx = p.x - p.px, vy = p.y - p.py;
  const vn = vx * nx + vy * ny;
  p.x = cx + nx * R; p.y = cy + ny * R;
  if (vn < 0) { const e = 0.35; p.px = p.x - (vx - (1 + e) * vn * nx) * 0.9; p.py = p.y - (vy - (1 + e) * vn * ny) * 0.9; }
  return Math.abs(vn);
}

function stepPhysics(dt: number) {
  const bodies = [...binBodies, ...(toss && toss.flying ? [toss.body] : [])];
  const g = 1500;
  for (const b of bodies) for (const p of [b.a, b.b]) {
    const vx = (p.x - p.px) * 0.999, vy = (p.y - p.py) * 0.999;
    p.px = p.x; p.py = p.y;
    p.x += vx; p.y += vy + g * dt * dt;
  }
  let hit = 0;
  for (let it = 0; it < 4; it++) {
    for (const b of bodies) {
      // stick
      const dx = b.b.x - b.a.x, dy = b.b.y - b.a.y, d = Math.hypot(dx, dy) || 1, k = (d - STICK) / d / 2;
      b.a.x += dx * k; b.a.y += dy * k; b.b.x -= dx * k; b.b.y -= dy * k;
      for (const p of [b.a, b.b]) {
        if (p.y > FLOOR - R) { const vy = p.y - p.py; p.y = FLOOR - R; p.py = p.y + vy * 0.3; p.px = p.x - (p.x - p.px) * 0.8; hit = Math.max(hit, Math.abs(vy)); }
        if (p.y < R) { p.y = R; p.py = p.y; }
        if (p.x < R) { p.x = R; p.px = p.x + (p.x - p.px) * 0.4; }
        if (p.x > SW - R) { const vx = p.x - p.px; p.x = SW - R; p.px = p.x + vx * 0.4; if (b === toss?.body) b.touchedWall = true; hit = Math.max(hit, Math.abs(vx)); }
        for (const s of BIN_SEGS) {
          const h = collideSeg(p, ...s);
          if (h && b === toss?.body && p.y < BIN.top + 20) b.touchedRim = true;
          hit = Math.max(hit, h);
        }
      }
    }
    // can vs can
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      for (const p of [bodies[i].a, bodies[i].b]) for (const q of [bodies[j].a, bodies[j].b]) {
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < R * 2) { const k = (R * 2 - d) / d / 2; p.x -= dx * k; p.y -= dy * k; q.x += dx * k; q.y += dy * k; }
      }
    }
  }
  return hit;
}

let clankCd = 0;
function updateToss(g: MonsterGame, dt: number) {
  if (!toss) { toss = { body: mkBody(SLING.x, SLING.y - STICK / 2, SLING.x, SLING.y + STICK / 2), held: false, flying: false, samples: [], missed: false, reset: 0, pull: { x: 0, y: 0 } }; }
  if (toss.reset > 0) {
    toss.reset -= dt;
    if (toss.reset <= 0) { toss.flying = false; toss.pull = { x: 0, y: 0 }; placeInSling(); sfx.click(); }
  }
  if (toss.held) {
    let dx = pointer.x - SLING.x, dy = pointer.y - SLING.y;
    const d = Math.hypot(dx, dy);
    if (d > PULL_MAX) { dx *= PULL_MAX / d; dy *= PULL_MAX / d; }
    toss.pull = { x: dx, y: dy };
    placeInSling();
  } else if (!toss.flying && toss.reset <= 0) { placeInSling(); const bob = Math.sin(performance.now() / 300) * 3; for (const p of [toss.body.a, toss.body.b]) { p.y += bob; p.py = p.y; } }
  clankCd -= dt;
  const sub = 4;
  let hit = 0;
  for (let i = 0; i < sub; i++) hit = Math.max(hit, stepPhysics(dt / sub));
  if (hit > 2.5 && clankCd <= 0) { const pw = Math.min(1, hit / 12); sfx.clank(pw); monsterClank(pw); clankCd = 0.08; }
  if (toss.flying && toss.reset <= 0) {
    const b = toss.body;
    const v = Math.hypot(b.a.x - b.a.px, b.a.y - b.a.py) + Math.hypot(b.b.x - b.b.px, b.b.y - b.b.py);
    b.still = v < 0.6 ? b.still + dt : 0;
    if (b.still > 0.5) {
      const inBin = [b.a, b.b].every(p => p.x > BIN.l && p.x < BIN.r && p.y > BIN.top);
      if (inBin) {
        sfx.binDrop();
        const all = [...binBodies, b].map(x => ({ ax: x.a.x, ay: x.a.y, bx: x.b.x, by: x.b.y }) as BinCan);
        const style = b.touchedWall ? 'bank' : b.touchedRim ? 'rim' : 'swish';
        binBodies.push(b);
        toss = null;
        monsterBinned(all, style);
      } else {
        toss.missed = true; toss.reset = 0.7;
        g.feedback = 'Missed! Reloading...';
      }
    }
  }
}

// ---------- drawing helpers ----------
function canAt(c: CanvasRenderingContext2D, x: number, y: number, ang: number, s = 1, o: { open?: boolean; empty?: boolean; glow?: boolean } = {}) {
  const L = CAN_L * s, W = CAN_W * s;
  c.save(); c.translate(x, y); c.rotate(ang);
  if (o.glow) { c.shadowColor = '#2f6fed'; c.shadowBlur = 14; }
  const gr = c.createLinearGradient(-W / 2, 0, W / 2, 0);
  gr.addColorStop(0, '#060606'); gr.addColorStop(0.35, '#3c3c3c'); gr.addColorStop(0.55, '#141414'); gr.addColorStop(1, '#030303');
  c.fillStyle = gr; rr(c, -W / 2, -L / 2 + 2 * s, W, L - 2 * s, 4 * s); c.fill();
  c.shadowBlur = 0;
  c.fillStyle = '#c9ced6'; c.beginPath(); c.ellipse(0, -L / 2 + 3 * s, W / 2 - 1, 3 * s, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#8a919c'; c.lineWidth = 1; c.stroke();
  if (o.open) { c.fillStyle = '#111'; c.beginPath(); c.ellipse(-2 * s, -L / 2 + 3 * s, 3 * s, 1.3 * s, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#e6e9ee'; c.fillRect(1 * s, -L / 2 + 1.5 * s, 6 * s, 2.5 * s);
  c.strokeStyle = '#6fe08a'; c.lineWidth = 2.6 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-6 * s, -L / 2 + 12 * s); c.lineTo(-4 * s, L / 2 - 16 * s); c.moveTo(0, -L / 2 + 10 * s); c.lineTo(0.6 * s, L / 2 - 14 * s); c.moveTo(6 * s, -L / 2 + 12 * s); c.lineTo(4 * s, L / 2 - 16 * s); c.stroke();
  c.fillStyle = '#fff'; c.font = `800 ${Math.max(4, 4.6 * s)}px Inter, sans-serif`; c.textAlign = 'center'; c.fillText('MONSTER', 0, L / 2 - 7 * s);
  if (o.empty) { c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, -W / 2, -L / 2, W, L, 4 * s); c.fill(); }
  c.restore();
}
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
const SKIN = '#e8b98a', SKIN_D = '#c9946a', SLEEVE = '#3a4a6a';
/** Arm from (sx,sy) to a hand gripping a can at (x,y) with angle ang. Fingers drawn over the can. */
function armBehind(c: CanvasRenderingContext2D, sx: number, sy: number, x: number, y: number) {
  c.strokeStyle = SLEEVE; c.lineWidth = 26; c.lineCap = 'round';
  const ex = (sx + x) / 2 + 30, ey = (sy + y) / 2 + 20;
  c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(ex, ey, x - 6, y + 10); c.stroke();
  c.strokeStyle = SKIN; c.lineWidth = 16; c.beginPath(); c.moveTo(x - 20, y + 18); c.lineTo(x - 4, y + 4); c.stroke();
}
function fingers(c: CanvasRenderingContext2D, x: number, y: number, ang: number, s = 1) {
  c.save(); c.translate(x, y); c.rotate(ang);
  // palm wraps the left side, four fingers across the front, thumb on top
  c.fillStyle = SKIN; rr(c, -CAN_W * s / 2 - 7, -12 * s, 12, 26 * s, 6); c.fill();
  for (let i = 0; i < 4; i++) {
    const fy = -9 * s + i * 6.4 * s;
    c.fillStyle = SKIN; rr(c, -CAN_W * s / 2 - 2, fy, CAN_W * s + 5 - i, 6 * s, 3 * s); c.fill();
    c.strokeStyle = SKIN_D; c.lineWidth = 1; c.beginPath(); c.moveTo(-CAN_W * s / 2 + 2, fy + 6 * s); c.lineTo(CAN_W * s / 2 + 1 - i, fy + 6 * s); c.stroke();
    c.fillStyle = '#f2d2b4'; c.fillRect(CAN_W * s / 2 - 1 - i, fy + 1.4 * s, 3, 3 * s);   // nails
  }
  c.fillStyle = SKIN; rr(c, -CAN_W * s / 2 - 6, -18 * s, 9, 12 * s, 4); c.fill();       // thumb
  c.restore();
}
const G_SKIN = '#f7d6c0', G_SKIN_S = '#e0a88e', G_HAIR = '#2b2438', G_HAIR_S = '#191522', G_HAIR_L = '#4a4062', G_HOOD = '#3d4b70', G_HOOD_S = '#2a3553', G_LINE = '#24141c';
/** You, in profile (facing left), same pixel-anime style as her: tousled fringe over the forehead, layered spikes
 *  at the back, a gaming headset around the neck. tilt = head back while drinking. */
function guy(c: CanvasRenderingContext2D, tilt: number, gulp: number, t: number) {
  const blink = (t % 4.3) < 0.12 || gulp > 0;
  const sp = pixelSprite('guy', 140, 236, g => {
    g.translate(-300 - GUY_DX, 0);
    const ln = { color: G_LINE, w: 1.8 };
    // hoodie + hood bunched behind the neck
    cel(g, smooth([[400, 138], [424, 128], [442, 134], [442, 172], [412, 166]]), G_HOOD_S, '#222a42', 2, ln);
    cel(g, smooth([[392, 150], [372, 160], [356, 182], [348, 210], [344, 240], [442, 240], [442, 152], [418, 146]]), G_HOOD, G_HOOD_S, 2.4, ln);
    g.strokeStyle = '#e8e4f0'; g.lineWidth = 2; g.beginPath(); g.moveTo(374, 168); g.lineTo(369, 198); g.moveTo(384, 168); g.lineTo(382, 194); g.stroke();
    // neck
    cel(g, smooth([[370, 124], [396, 122], [404, 156], [378, 166]]), G_SKIN, G_SKIN_S, 1.6, ln);
    if (gulp > 0) { g.fillStyle = G_SKIN_S; g.beginPath(); g.ellipse(373, 146 + Math.sin(t * 16) * 3, 3, 4, 0, 0, Math.PI * 2); g.fill(); }
    // headset resting around the neck
    g.strokeStyle = '#1b1b22'; g.lineWidth = 5; g.beginPath(); g.ellipse(390, 156, 22, 8, 0.1, 0, Math.PI); g.stroke();
    cel(g, smooth([[370, 146], [380, 144], [382, 160], [372, 162]]), '#3a3446', '#24202e', 1, ln);
    g.fillStyle = '#9a7aff'; g.fillRect(373, 151, 5, 2);
    // head
    g.save(); g.translate(NECK.x, NECK.y); g.rotate(tilt); g.translate(-NECK.x, -NECK.y);
    // back hair mass (behind the face): layered spikes down the back of the head to the nape
    cel(g, smooth([[380, 46], [396, 34], [418, 34], [436, 46], [446, 64], [452, 74, 1], [442, 82], [450, 96, 1], [438, 102], [442, 118, 1], [428, 114], [424, 128, 1], [414, 116], [404, 104], [392, 74]]), G_HAIR, G_HAIR_S, 2, ln);
    // face + skull in profile
    cel(g, smooth([[372, 56], [398, 46], [424, 56], [430, 82], [424, 106], [412, 122], [394, 130], [378, 131], [367, 125], [363, 117], [358, 115], [361, 110], [356.5, 106], [359, 101], [352, 95, 1], [358, 88], [361, 76], [366, 64]]), G_SKIN, G_SKIN_S, 2, ln);
    // ear with a little shading
    cel(g, smooth([[405, 84], [413, 81], [417, 92], [414, 101], [407, 100]]), G_SKIN, G_SKIN_S, 1, ln);
    g.fillStyle = G_SKIN_S; g.fillRect(408, 88, 4, 7);
    // top + fringe: volume over the crown, tousled strands falling over the forehead to the brow
    cel(g, smooth([[364, 70], [362, 56], [372, 42], [388, 33], [406, 30], [424, 34], [436, 44], [430, 52], [418, 48], [408, 58, 1], [404, 50], [394, 56], [388, 66, 1], [384, 56], [378, 62], [374, 76, 1], [370, 64], [366, 78, 1]]), G_HAIR, G_HAIR_S, 2, ln);
    // sideburn in front of the ear
    g.fillStyle = G_HAIR; g.fill(smooth([[400, 70], [406, 68], [405, 90], [400, 88]]));
    // shine strands
    g.strokeStyle = G_HAIR_L; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(386, 40); g.quadraticCurveTo(400, 36, 414, 40); g.moveTo(420, 52); g.quadraticCurveTo(430, 60, 436, 74); g.stroke();
    // eye: anime profile, iris toward the front; closes while gulping
    if (blink) { g.strokeStyle = G_LINE; g.lineWidth = 2.4; g.beginPath(); g.moveTo(363, 85); g.quadraticCurveTo(370, 89, 377, 84); g.stroke(); }
    else {
      g.fillStyle = '#fffaf6'; g.fill(smooth([[362, 84], [370, 79], [377, 83], [369, 90]]));
      g.fillStyle = '#3b5d9a'; g.beginPath(); g.ellipse(366.6, 84.6, 2.8, 3.9, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1a2440'; g.beginPath(); g.ellipse(366, 84.6, 1.2, 2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.fillRect(366.6, 81.8, 1.6, 1.6);
      g.strokeStyle = G_LINE; g.lineWidth = 2.6; g.beginPath(); g.moveTo(360, 82); g.quadraticCurveTo(369, 77.5, 378, 82); g.stroke();
    }
    g.strokeStyle = G_HAIR; g.lineWidth = 2.4; g.beginPath(); g.moveTo(361, 75); g.quadraticCurveTo(370, 72, 379, 73.5); g.stroke();   // brow
    // nose shade, mouth
    g.fillStyle = G_SKIN_S; g.fillRect(356, 98, 3, 2);
    if (gulp > 0) { g.fillStyle = '#8a3040'; g.beginPath(); g.ellipse(359.5, 110, 2.4, 2.8, 0, 0, Math.PI * 2); g.fill(); }
    else { g.strokeStyle = '#b05a5a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(357.5, 110); g.quadraticCurveTo(361, 111.5, 364, 110.5); g.stroke(); }
    g.restore();
  }, { redraw: true });
  const prev = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
  c.drawImage(sp, 300, 0, 140, 236);
  c.imageSmoothingEnabled = prev;
}
function wall(c: CanvasRenderingContext2D) {
  const g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#e9ecf1'); g.addColorStop(1, '#cfd5de');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
}
function desk(c: CanvasRenderingContext2D) {
  c.fillStyle = '#9a7652'; c.fillRect(150, DESK_Y, SW - 150, 10);
  c.fillStyle = '#7a5a3c'; c.fillRect(150, DESK_Y + 10, SW - 150, SH - DESK_Y - 10);
  c.fillStyle = 'rgba(0,0,0,.15)'; for (let x = 160; x < SW; x += 46) c.fillRect(x, DESK_Y + 2, 30, 1);
  c.fillStyle = '#5a412a'; c.fillRect(150, DESK_Y + 10, SW - 150, 3);
}
function fridge(c: CanvasRenderingContext2D, t: number, g: MonsterGame) {
  const { x, y, w, h } = FRIDGE;
  c.fillStyle = '#9aa2ad'; rr(c, x, y + 4, w, h, 10); c.fill();
  c.fillStyle = '#eef1f5'; rr(c, x, y, w, h, 10); c.fill();
  if (doorT > 0) {
    const ig = c.createLinearGradient(0, y, 0, y + h); ig.addColorStop(0, '#fffbe3'); ig.addColorStop(1, '#efe2ad');
    c.fillStyle = ig; rr(c, x + 7, y + 7, w - 14, h - 14, 6); c.fill();
    c.fillStyle = 'rgba(255,240,180,.35)'; c.fillRect(x + 7, y + 7, w - 14, 10);
    for (let r = 0; r < 3; r++) { c.fillStyle = '#c9d0da'; c.fillRect(x + 7, SLOTS[r * 4].y + 24, w - 14, 4); }
    const n = fridgeCans();
    for (let i = 0; i < n; i++) if ((!grab || grab.slot !== i) && i !== taken && !(falling && i === taken)) canAt(c, SLOTS[i].x, SLOTS[i].y, 0, 1, { glow: g.stage === 'grab' && !grab && !falling && Math.sin(t * 4 + i) > 0.6 });
    // the door, swung open to the left, seen edge-on
    const dw = (1 - doorT) * w;
    c.fillStyle = '#dfe4ea'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dw, y + doorT * 10); c.lineTo(x + dw, y + h - doorT * 10); c.lineTo(x, y + h); c.fill();
    c.fillStyle = '#c9d0da'; c.fillRect(x + Math.max(0, dw - 6), y + doorT * 10, 6, h - doorT * 20);
  } else {
    c.strokeStyle = '#d5dbe2'; c.lineWidth = 2; rr(c, x + 6, y + 6, w - 12, h - 12, 8); c.stroke();
    const glow = 0.5 + Math.sin(t * 5) * 0.5;
    c.shadowColor = '#2f6fed'; c.shadowBlur = 8 + glow * 12;
    const hg = c.createLinearGradient(x + w - 26, 0, x + w - 12, 0); hg.addColorStop(0, '#8d95a1'); hg.addColorStop(0.5, '#f4f6f9'); hg.addColorStop(1, '#8d95a1');
    c.fillStyle = hg; rr(c, x + w - 26, y + 50, 13, 80, 6); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#9aa3ad'; c.font = '600 10px Inter, sans-serif'; c.textAlign = 'left'; say(c, 'mini fridge', x + 14, y + h - 14);
    c.strokeStyle = '#2f6fed'; c.globalAlpha = 0.35 + glow * 0.5; c.lineWidth = 3; rr(c, x + 2, y + 2, w - 4, h - 4, 10); c.stroke(); c.globalAlpha = 1;
  }
}
function ring(c: CanvasRenderingContext2D, x: number, y: number, t: number, r = 16) {
  c.strokeStyle = '#2f6fed'; c.lineWidth = 3; c.setLineDash([5, 4]); c.lineDashOffset = -t * 20;
  c.beginPath(); c.arc(x, y, r + Math.sin(t * 6) * 2, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
}
function gulpMeter(c: CanvasRenderingContext2D, g: MonsterGame) {
  const x = 168, y = 24, h = 132, w = 22;
  const [lo, hi] = T.MONSTER_GULP_GOOD;
  c.fillStyle = '#fff'; rr(c, x, y, w, h, 6); c.fill(); c.strokeStyle = '#1d2330'; c.lineWidth = 2.5; c.stroke();
  const by = (v: number) => y + h - (v / 1.15) * h;
  c.fillStyle = 'rgba(62,207,110,.3)'; c.fillRect(x + 2, by(hi), w - 4, by(lo) - by(hi));
  c.fillStyle = '#3ecf6e'; c.fillRect(x + 2, by(hi), w - 4, 2); c.fillRect(x + 2, by(lo), w - 4, 2);
  const v = Math.min(1.15, g.gulp);
  c.fillStyle = g.gulp >= lo && g.gulp <= hi ? '#3ecf6e' : g.gulp > hi ? '#e0524a' : '#f2b84b';
  if (v > 0) c.fillRect(x + 5, by(v), w - 10, y + h - by(v) - 3);
  c.fillStyle = '#1d2330'; c.font = '700 9px Inter, sans-serif'; c.textAlign = 'center'; say(c, 'GULP', x + w / 2, y - 6);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + w / 2 - 14 + i * 14, y + h + 12, 5, 0, Math.PI * 2); c.fillStyle = i < g.gulps ? '#2f6fed' : '#fff'; c.fill(); c.strokeStyle = '#2f6fed'; c.lineWidth = 2; c.stroke(); }
}

// ---------- main draw ----------
export function drawMonsterScene() {
  const cv = document.getElementById('mcv') as HTMLCanvasElement | null;
  const g = G();
  if (!cv || !g) { lastGame = null; return; }
  if (lastGame !== g) reset(g);
  const now = performance.now() / 1000;
  const dt = Math.min(0.05, lastT ? now - lastT : 0.016); lastT = now;
  const main = cv.getContext('2d')!;
  if (!buf) { buf = document.createElement('canvas'); buf.width = SW; buf.height = SH; }
  const c = buf.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, SW, SH);
  texts = [];
  drawBody(c, g, dt, now);
  main.imageSmoothingEnabled = false;
  main.clearRect(0, 0, SW, SH);
  main.drawImage(buf, 0, 0, SW, SH);
  for (const x of texts) { main.globalAlpha = x.alpha; main.font = x.font; main.fillStyle = x.fill; main.textAlign = x.align; main.fillText(x.t, x.x, x.y); }
  main.globalAlpha = 1;
}

function drawBody(c: CanvasRenderingContext2D, g: MonsterGame, dt: number, now: number) {
  if (g.stage === 'toss') { drawToss(c, g, dt, now); return; }

  // animations
  if (g.stage !== 'fridge') doorT = Math.min(1, doorT + dt * 3);
  if (grab) {
    if (grab.back > 0) {
      const s = SLOTS[grab.slot]; grab.x += (s.x - grab.x) * Math.min(1, dt * 12); grab.y += (s.y - grab.y) * Math.min(1, dt * 12);
      if (Math.hypot(s.x - grab.x, s.y - grab.y) < 1) grab = null;
    } else {
      const nx = grab.x + (pointer.x - grab.x) * Math.min(1, dt * 18);
      grab.vx = (nx - grab.x) / Math.max(dt, 0.001); grab.x = nx; grab.y += (pointer.y - grab.y) * Math.min(1, dt * 18);
    }
  }
  if (falling) {
    falling.vy += 1600 * dt; falling.y += falling.vy * dt;
    const rest = DESK_Y - CAN_L / 2;
    if (falling.y >= rest) { const x = Math.max(178, Math.min(310, falling.x)); falling = null; sfx.clank(0.3); monsterPlaced(x); }
  }
  const drinking = g.stage === 'drink';
  arm += ((drinking && g.holding ? 1 : 0) - arm) * Math.min(1, dt * 8);
  openFx = Math.max(0, openFx - dt * 1.5);

  wall(c);
  // window + poster to make it a room
  c.fillStyle = '#b9c6d8'; rr(c, 196, 14, 110, 78, 4); c.fill(); c.fillStyle = '#1d2a44'; c.fillRect(202, 20, 98, 66);
  c.fillStyle = '#f2e9d8'; c.beginPath(); c.arc(276, 38, 7, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 9; i++) c.fillRect(206 + ((i * 37) % 90), 26 + ((i * 23) % 50), 1.5, 1.5);
  guy(c, arm * 0.24, drinking && g.holding ? g.gulp : 0, now);
  fridge(c, now, g);
  desk(c);

  if (g.stage === 'grab') {
    // where the can can go
    c.fillStyle = grab ? 'rgba(47,111,237,.16)' : 'rgba(47,111,237,.07)'; c.fillRect(168, DESK_Y - 4, 150, 8);
    if (grab) canAt(c, grab.x, grab.y, Math.max(-0.5, Math.min(0.5, grab.vx / 2500)), 1);
    if (falling) canAt(c, falling.x, falling.y, 0, 1);
    if (!grab && !falling) { c.fillStyle = '#2f6fed'; c.font = '700 13px Inter, sans-serif'; c.textAlign = 'center'; say(c, 'any can → the desk', 242, DESK_Y - 60); }
  }
  if (g.stage === 'open') {
    canAt(c, g.canX, DESK_Y - CAN_L / 2, 0, 1);
    ring(c, g.canX + 2, DESK_Y - CAN_L + 3, now);
  }
  if (drinking) {
    const deskP = { x: g.canX, y: DESK_Y - CAN_L / 2 };
    const m = mouthAt(arm * 0.24);
    const mouthP = { x: m.x - 20, y: m.y + 6 };
    const x = deskP.x + (mouthP.x - deskP.x) * arm, y = deskP.y + (mouthP.y - deskP.y) * arm;
    const ang = arm * (1.25 + Math.min(1, g.gulp) * 0.35);
    canAt(c, x, y, ang, 1, { open: true });
    if (g.holding && g.gulp > 0) for (let i = 0; i < 3; i++) { c.fillStyle = '#9dffb0'; c.beginPath(); c.arc(m.x - 2 + Math.sin(now * 20 + i) * 2, m.y + 4 + ((now * 60 + i * 7) % 14), 1.6, 0, Math.PI * 2); c.fill(); }
    gulpMeter(c, g);
    if (!g.holding && g.gulps === 0) { c.fillStyle = '#2f6fed'; c.font = '700 13px Inter, sans-serif'; c.textAlign = 'center'; say(c, 'hold', g.canX, DESK_Y - CAN_L - 14); }
  }
  if (openFx > 0) {
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i - 4.5) * 0.18, r = (1 - openFx) * 40; c.fillStyle = `rgba(200,255,210,${openFx})`; c.beginPath(); c.arc(g.canX + Math.cos(a) * r, DESK_Y - CAN_L + Math.sin(a) * r, 1.6, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = `rgba(29,35,48,${openFx})`; c.font = 'italic 700 16px Inter, sans-serif'; c.textAlign = 'center'; say(c, '*tsk* psshh', g.canX, DESK_Y - CAN_L - 30 - (1 - openFx) * 10);
  }
}

function drawCapsule(c: CanvasRenderingContext2D, b: Body, glow = false) {
  const m = mid(b);
  const ang = Math.atan2(b.b.y - b.a.y, b.b.x - b.a.x) - Math.PI / 2;
  canAt(c, m.x, m.y, ang, 0.9, { open: true, empty: true, glow });
}

function drawToss(c: CanvasRenderingContext2D, g: MonsterGame, dt: number, t: number) {
  updateToss(g, dt);
  wall(c);
  c.fillStyle = '#d5dbe3'; c.fillRect(SW - 14, 0, 14, FLOOR);                                    // side wall
  c.fillStyle = '#a3b1c4'; c.fillRect(0, FLOOR - 16, SW, 6);                                       // skirting
  const fg = c.createLinearGradient(0, FLOOR, 0, SH); fg.addColorStop(0, '#8a6a4c'); fg.addColorStop(1, '#5e4530');
  c.fillStyle = fg; c.fillRect(0, FLOOR - 10, SW, SH);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < SW; x += 54) c.fillRect(x, FLOOR - 10, 1, SH);
  // bin back
  c.fillStyle = '#4a5a6e'; c.beginPath(); c.moveTo(BIN.l, BIN.top); c.lineTo(BIN.r, BIN.top); c.lineTo(BIN.inR + 2, FLOOR); c.lineTo(BIN.inL - 2, FLOOR); c.fill();
  for (const b of binBodies) drawCapsule(c, b);
  if (toss && toss.reset <= 0.35) { c.globalAlpha = toss.reset > 0 ? 1 - toss.reset / 0.35 : 1; drawCapsule(c, toss.body, !toss.flying && !toss.held); c.globalAlpha = 1; }
  else if (toss) drawCapsule(c, toss.body);
  // bin front (mesh)
  c.fillStyle = 'rgba(110,128,150,.55)'; c.beginPath(); c.moveTo(BIN.l, BIN.top + 8); c.lineTo(BIN.r, BIN.top + 8); c.lineTo(BIN.inR + 2, FLOOR); c.lineTo(BIN.inL - 2, FLOOR); c.fill();
  c.strokeStyle = 'rgba(40,52,68,.5)'; c.lineWidth = 1;
  for (let i = 1; i < 8; i++) { const fx = BIN.l + (i * (BIN.r - BIN.l)) / 8; c.beginPath(); c.moveTo(fx, BIN.top + 8); c.lineTo(BIN.inL + (i * (BIN.inR - BIN.inL)) / 8, FLOOR); c.stroke(); }
  c.fillStyle = '#2a3442'; rr(c, BIN.l - 4, BIN.top - 2, BIN.r - BIN.l + 8, 10, 4); c.fill();
  c.fillStyle = '#fff'; c.font = '700 11px Inter, sans-serif'; c.textAlign = 'center'; say(c, `${binBodies.length}`, (BIN.l + BIN.r) / 2, FLOOR - 26);
  if (toss?.held && Math.hypot(toss.pull.x, toss.pull.y) > 8) trajectory(c);
  if (toss && toss.reset > 0) { c.fillStyle = 'rgba(29,35,48,.6)'; c.font = '700 14px Inter, sans-serif'; c.textAlign = 'center'; say(c, 'reloading...', SLING.x, SLING.y - 50); }
  if (toss?.held) {                       // pull radius + the anchor the can snaps away from
    c.strokeStyle = 'rgba(47,111,237,.35)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.arc(SLING.x, SLING.y, PULL_MAX, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(47,111,237,.6)'; c.beginPath(); c.arc(SLING.x, SLING.y, 5, 0, Math.PI * 2); c.fill();
  }
  if (toss && !toss.flying && !toss.held && toss.reset <= 0) {
    c.fillStyle = '#2f6fed'; c.font = '700 13px Inter, sans-serif'; c.textAlign = 'left'; say(c, 'grab it, pull back, aim, let go', SLING.x + 30, SLING.y - 40);
    const k = (t * 1.2) % 1; c.globalAlpha = 1 - k;
    c.fillStyle = '#2f6fed'; c.beginPath(); c.arc(SLING.x - 30 * k, SLING.y + 20 * k, 6, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(47,111,237,.25)'; c.lineWidth = 2; c.beginPath(); c.ellipse(SLING.x, SLING.y + 34, 16, 4, 0, 0, Math.PI * 2); c.stroke();   // hover shadow
  }
}

// Test hook (playtest scripts): throw the waiting can with a given velocity.
(window as unknown as Record<string, unknown>).__lnThrow = (vx: number, vy: number) => {
  if (!toss || toss.flying || toss.reset > 0) return false;
  toss.pull = { x: -vx / LAUNCH_K, y: -vy / LAUNCH_K }; placeInSling(); toss.held = true; release(); return true;
};
(window as unknown as Record<string, unknown>).__lnCan = () => toss ? { ...mid(toss.body), flying: toss.flying } : null;
