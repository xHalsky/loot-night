import { S } from '../core/state';
import { drawHer, drawHerFrosted, drawHerBack, OUTFIT_BY_ACTIVITY, type Face } from './her';
import { T } from '../config/tuning';

// Your door, seen from your desk. Hold it to peek: it opens a crack onto the hallway (drawHallway).
export const DOOR_W = 280, DOOR_H = 396;
const TOP = 34, BOT = 370, X0 = 48, DW = 184;   // door opening



export function drawDoor(c: CanvasRenderingContext2D) {
  const n = S.g.night;
  const t = performance.now() / 1000;
  c.imageSmoothingEnabled = false;
  c.fillStyle = '#110d17'; c.fillRect(0, 0, DOOR_W, DOOR_H);
  for (let x = 0; x < DOOR_W; x += 36) { c.fillStyle = '#16111d'; c.fillRect(x, 0, 18, BOT); c.fillStyle = '#130f19'; c.fillRect(x + 18, 0, 18, BOT); }
  c.fillStyle = '#3d2a1e'; c.fillRect(X0 - 6, TOP - 6, DW + 12, BOT - TOP + 6);       // frame
  const stage = n?.visit.stage ?? 'idle';
  const H = BOT - TOP;
  if (stage === 'in') {
    // the lit hallway behind her: back wall, skirting, floorboards in perspective
    const g = c.createLinearGradient(0, TOP, 0, BOT); g.addColorStop(0, '#ffe2aa'); g.addColorStop(1, '#f0b874');
    c.fillStyle = g; c.fillRect(X0, TOP, DW, H);
    const FY = BOT - 46;
    c.fillStyle = '#d99a5a'; c.fillRect(X0, FY - 8, DW, 8);
    const fg = c.createLinearGradient(0, FY, 0, BOT); fg.addColorStop(0, '#b47a48'); fg.addColorStop(1, '#8a5a34');
    c.fillStyle = fg; c.fillRect(X0, FY, DW, BOT - FY);
    c.strokeStyle = 'rgba(70,40,20,.35)'; c.lineWidth = 1;
    for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(X0 + DW / 2 + i * 12, FY); c.lineTo(X0 + DW / 2 + i * 34, BOT); c.stroke(); }
    c.fillStyle = '#4a3324'; c.fillRect(X0, TOP, 20, H);
    const v = n!.visit;
    const look = OUTFIT_BY_ACTIVITY[v.from ?? 'tv'] ?? OUTFIT_BY_ACTIVITY.tv;
    const face = herFace(v, n!.catches, n!.mood, t);
    const lean = v.result === 'look';
    const s = 1.24, feet = BOT - 6;
    const top = feet - 239.5 * s;
    const cx = X0 + DW / 2 + (lean ? -12 : 4);
    c.save(); c.beginPath(); c.rect(X0, TOP, DW, H); c.clip();
    c.fillStyle = 'rgba(60,30,10,.35)'; c.beginPath(); c.ellipse(cx, feet, 30, 6, 0, 0, Math.PI * 2); c.fill();     // contact shadow
    const item = lean ? 'none' : v.kind === 'snack' && v.result !== 'snackOk' ? 'plate' : look.item;
    drawHer(c, cx, top, s, { outfit: look.outfit, item, face, pose: lean ? 'lean' : 'stand', blink: face !== 'wink' && (t % 3.7) < 0.12 });
    c.restore();
    emote(c, cx + 34, top - 6, face, t);
  } else {
    const p = n?.peek ?? 0;                       // 0 shut .. 1 = PEEK_CRACK_MAX of the door's width
    const gap = p * DW * T.PEEK_CRACK_MAX;
    if (gap > 0.5) drawHallway(c, X0 + DW - gap, TOP, gap, H, t);
    // the door panel swings toward you: narrower and darker as it opens
    const w = DW - gap;
    c.fillStyle = p > 0 ? `rgb(${74 - p * 20},${51 - p * 14},${36 - p * 10})` : '#4a3324';
    c.beginPath(); c.moveTo(X0, TOP); c.lineTo(X0 + w, TOP - p * 6); c.lineTo(X0 + w, BOT + p * 6); c.lineTo(X0, BOT); c.fill();
    c.strokeStyle = '#3a281c'; c.lineWidth = 3;
    const k = w / DW;
    c.strokeRect(X0 + 14 * k, TOP + 18, (DW - 28) * k, 130); c.strokeRect(X0 + 14 * k, TOP + 168, (DW - 28) * k, 146);
    c.fillStyle = '#d9a441'; c.fillRect(X0 + w - 20 * k, stage === 'handle' ? TOP + 164 : TOP + 156, 14 * k + 2, 7);
  }
  if (n?.towel) {   // a towel blocks the gap: no light, so no toes and no shadows (docs/design/preemptive.md)
    c.fillStyle = '#7a8aa8'; c.fillRect(X0 - 10, BOT - 2, DW + 20, 9);
    for (let i = 0; i < DW + 20; i += 14) { c.fillStyle = '#5a6a88'; c.fillRect(X0 - 10 + i, BOT - 2, 6, 9); }
    c.fillStyle = '#9aaac8'; c.fillRect(X0 - 10, BOT - 2, DW + 20, 2);
  } else {
    // light gap under the door
    c.fillStyle = '#ffcf7a'; c.fillRect(X0, BOT, DW, 6);
    const rg = c.createRadialGradient(140, BOT + 6, 4, 140, BOT + 6, 100);
    rg.addColorStop(0, 'rgba(255,207,122,0.35)'); rg.addColorStop(1, 'rgba(255,207,122,0)');
    c.fillStyle = rg; c.fillRect(20, BOT + 6, 240, DOOR_H - BOT - 6);
    if (stage === 'hall' || stage === 'handle') {
      // her bare toes in the light gap under the door
      for (const fx of [104, 150]) {
        c.fillStyle = 'rgba(17,13,23,.55)'; c.fillRect(fx - 4, BOT, 34, 6);
        for (let i = 0; i < 5; i++) {
          const tw = i === 0 ? 8 : 6, tx = fx + (fx < 140 ? 20 - i * 6 - (i ? 2 : 0) : i * 6);
          c.fillStyle = '#e9ad96'; c.fillRect(tx, BOT + 2 - (i === 0 ? 0 : i > 2 ? -1 : 0), tw, 4);
          c.fillStyle = '#f9d8c2'; c.fillRect(tx, BOT + 2, tw - 2, 2);
          c.fillStyle = '#f3a2ab'; c.fillRect(tx + 1, BOT + 4, tw - 4, 2);
        }
      }
    }
    if (stage === 'passing' && n) { const x = X0 + (1 - n.visit.t / 2) * DW; c.fillStyle = '#110d17'; c.fillRect(x - 12, BOT, 16, 6); c.fillRect(x + 8, BOT, 16, 6); }
    if (n && stage === 'idle' && n.apt.moving > 0 && !n.headset) {   // she walks by in the hallway: a shadow crosses the light
      const x = X0 + ((t * 70) % (DW + 40)) - 20; c.fillStyle = 'rgba(17,13,23,.75)'; c.fillRect(x, BOT, 18, 6); c.fillRect(x + 22, BOT, 18, 6);
    }
  }
  c.fillStyle = '#1b1520'; c.fillRect(0, BOT + 6, DOOR_W, 2);
  // suspicion: she is noticing the door
  if (n && n.peekSus > 0.05) {
    c.fillStyle = `rgba(224,82,74,${Math.min(0.9, n.peekSus)})`; c.fillRect(X0, TOP - 14, DW * Math.min(1, n.peekSus), 5);
  }
  if (n && n.peek <= 0 && stage === 'idle') { c.fillStyle = 'rgba(255,220,200,.35)'; c.font = '14px "Patrick Hand", sans-serif'; c.textAlign = 'center'; c.fillText('hold the door to peek', X0 + DW / 2, BOT + 20); }
}

// ---------- The hallway behind your door (docs/design/her.md, Peeking) ----------
// One fixed picture, laid out like the blueprint and seen from your door: the crack opens from the door's right
// edge, so the kitchen right across shows at a narrow crack, the bathroom door at a medium one, and the bedroom
// door and the living-room opening at the far end only when wide. Lights and her tell where she is.
const VP: [number, number] = [150, 160];                        // vanishing point
const RW = 175, END_L = 100;                                     // right wall starts at x 175; far end wall x 100..175
const yTop = (x: number) => VP[1] - 1.44 * (x - VP[0]);         // right wall: ceiling line
const yBot = (x: number) => VP[1] + 2.16 * (x - VP[0]);         // right wall: floor line
/** A door or opening on the right wall between x0 and x1, from `top` (0 = ceiling, 1 = floor) down to the floor. */
function wallQuad(x0: number, x1: number, top: number): [number, number][] {
  const t = (x: number) => yTop(x) + (yBot(x) - yTop(x)) * top;
  return [[x0, t(x0)], [x1, t(x1)], [x1, yBot(x1)], [x0, yBot(x0)]];
}
function fillPoly(c: CanvasRenderingContext2D, pts: [number, number][], style: string | CanvasGradient) {
  c.fillStyle = style; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
}

function drawHallway(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const n = S.g.night!;
  const a = n.apt;
  const v = n.visit.stage;
  const room = v === 'idle' && !n.pre?.withHer ? (a.moving > 0 ? 'hallway' : a.room) : 'hallway';
  const act = a.activity;
  const XR = X0 + DW;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  // ceiling, walls, floor (a dim night light in the hallway)
  fillPoly(c, [[X0, TOP], [XR, TOP], [XR, yTop(XR)], [RW, yTop(RW)], [END_L, yTop(RW)], [X0, 87]], '#211a24');
  fillPoly(c, [[RW, yTop(RW)], [XR, yTop(XR)], [XR, yBot(XR)], [RW, yBot(RW)]], '#43363f');                 // right wall
  fillPoly(c, [[X0, 87], [END_L, yTop(RW)], [END_L, yBot(RW)], [X0, 270]], '#3a2e37');                       // left wall (your side)
  fillPoly(c, [[END_L, yTop(RW)], [RW, yTop(RW)], [RW, yBot(RW)], [END_L, yBot(RW)]], '#4a3c46');           // the far end
  const fl = c.createLinearGradient(0, yBot(RW), 0, BOT); fl.addColorStop(0, '#3e2a1f'); fl.addColorStop(1, '#6a4630');
  fillPoly(c, [[X0, 270], [END_L, yBot(RW)], [RW, yBot(RW)], [XR, yBot(XR)], [XR, BOT], [X0, BOT]], fl);
  c.strokeStyle = 'rgba(30,18,12,.45)'; c.lineWidth = 1;
  for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(VP[0] + i * 9, yBot(RW)); c.lineTo(VP[0] + i * 46, BOT + 40); c.stroke(); }
  c.fillStyle = '#2c2128'; c.fillRect(END_L, yBot(RW) - 3, RW - END_L, 3);                                    // skirting at the end
  const lamp = c.createRadialGradient(150, 70, 4, 150, 70, 150); lamp.addColorStop(0, 'rgba(255,200,140,.16)'); lamp.addColorStop(1, 'rgba(255,200,140,0)');
  c.fillStyle = lamp; c.fillRect(X0, TOP, DW, BOT - TOP);

  // --- kitchen opening, right across your door (narrow crack)
  const kq = wallQuad(207, XR, 0.1);
  const kitchen = room === 'kitchen';
  if (kitchen) {
    const kg = c.createLinearGradient(207, 0, XR, 0); kg.addColorStop(0, '#f5c27e'); kg.addColorStop(1, '#ffe2a8');
    fillPoly(c, kq, kg);
    c.fillStyle = '#c99a62'; c.fillRect(207, 214, XR - 207, 10); c.fillStyle = '#8a6440'; c.fillRect(207, 224, XR - 207, 70);   // the counter
    c.fillStyle = '#d0d4dc'; c.fillRect(216, 198, 10, 16); c.fillStyle = '#2a2a30'; c.fillRect(215, 196, 12, 3);                  // the kettle
    for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i / 4) % 1; c.fillStyle = `rgba(255,255,255,${0.35 * (1 - k)})`; c.beginPath(); c.arc(221 + Math.sin(t * 2 + i) * 4, 192 - k * 50, 4 + k * 6, 0, Math.PI * 2); c.fill(); }
    if (act === 'tea') {   // her at the counter, from behind (inside the opening)
      c.save(); c.beginPath(); kq.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.clip();
      drawHerBack(c, 224, 150, 0.6, OUTFIT_BY_ACTIVITY.tea.outfit); c.restore();
    }
    const spill = c.createLinearGradient(0, yBot(207), 0, BOT); spill.addColorStop(0, 'rgba(255,214,150,.35)'); spill.addColorStop(1, 'rgba(255,214,150,0)');
    fillPoly(c, [[207, yBot(207)], [XR, yBot(XR)], [XR, BOT], [196, BOT]], spill);
  } else {
    fillPoly(c, kq, '#141016');
    c.fillStyle = '#3aff9a'; c.fillRect(222, 205, 2, 2);   // the fridge's little LED
  }
  c.fillStyle = '#2c2128'; c.fillRect(205, yTop(205) + 2, 3, yBot(205) - yTop(205));   // door frame edge

  // --- bathroom door, across and a bit further (medium crack)
  const bq = wallQuad(182, 200, 0.2);
  const bath = room === 'bathroom';
  fillPoly(c, bq, bath ? '#cdbfa6' : '#a99c88');
  const gl = wallQuad(185, 197, 0.28).map(([px, py], i) => [px, i < 2 ? py : py - (yBot(px) - yTop(px)) * 0.38] as [number, number]);   // the frosted glass panel
  fillPoly(c, gl, bath ? 'rgba(235,240,250,.9)' : '#8d8b95');
  if (bath && act === 'shower') {
    c.save(); c.beginPath(); gl.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.clip();
    drawHerFrosted(c, 191, gl[0][1] + 2, 0.36); c.restore();
    for (let i = 0; i < 6; i++) { const k = (t * 0.35 + i / 6) % 1; c.fillStyle = `rgba(240,244,255,${0.32 * (1 - k)})`; c.beginPath(); c.arc(184 + Math.sin(t + i * 1.7) * 6 - k * 12, yTop(186) + 30 + i * 8 - k * 30, 5 + k * 9, 0, Math.PI * 2); c.fill(); }   // steam leaking out
  }
  if (bath) {   // light strip under the door, and its glow on the floor
    c.fillStyle = '#ffe9a8'; c.beginPath(); c.moveTo(182, yBot(182) - 1); c.lineTo(200, yBot(200) - 1); c.lineTo(200, yBot(200) + 1); c.lineTo(182, yBot(182) + 1); c.fill();
    const bgw = c.createRadialGradient(191, yBot(191) + 6, 1, 191, yBot(191) + 6, 26); bgw.addColorStop(0, 'rgba(255,233,168,.35)'); bgw.addColorStop(1, 'rgba(255,233,168,0)');
    c.fillStyle = bgw; c.fillRect(160, yBot(182) - 10, 60, 40);
  }

  // --- the far end: living-room opening (your side) and the bedroom door (wide crack)
  const tv = room === 'living' && act === 'tv';
  c.fillStyle = '#120e15'; c.fillRect(106, 140, 32, yBot(RW) - 140);                      // living-room opening
  if (room === 'living') {
    const f = tv ? 0.55 + Math.sin(t * 9) * 0.15 + Math.sin(t * 23) * 0.1 : 0.4;
    c.fillStyle = tv ? `rgba(90,140,255,${f})` : `rgba(255,200,130,${f})`; c.fillRect(106, 140, 32, yBot(RW) - 140);
    if (tv) { c.fillStyle = `rgba(110,150,255,${f * 0.35})`; c.fillRect(END_L, yTop(RW), RW - END_L, yBot(RW) - yTop(RW)); }   // blue flicker on the wall
    c.fillStyle = '#4a3a5a'; c.fillRect(110, 192, 28, 22); c.fillStyle = '#5c4a6e'; c.fillRect(110, 188, 28, 6);              // the sofa's armrest
    for (const [fx, fy] of [[120, 182], [129, 184]]) {                                                                         // her bare feet on it
      c.fillStyle = '#e9ad96'; c.fillRect(fx, fy, 7, 6); c.fillStyle = '#f9d8c2'; c.fillRect(fx, fy, 6, 5);
      c.fillStyle = '#f7c4b2'; c.fillRect(fx + 1, fy + 1, 3, 3); c.fillStyle = '#f9d8c2'; c.fillRect(fx + 6, fy - 2, 2, 3);
    }
  }
  c.fillStyle = '#2c2128'; c.fillRect(104, 138, 36, 3); c.fillRect(104, 140, 2, yBot(RW) - 140); c.fillRect(138, 140, 2, yBot(RW) - 140);
  const inBed = room === 'bedroom';
  const ajar = inBed ? 7 : 0;
  c.fillStyle = '#2c2128'; c.fillRect(144, 136, 26, yBot(RW) - 136);                        // bedroom door frame
  c.fillStyle = inBed && act === 'phone' && !a.asleep ? '#5a78c8' : '#0c0a10'; c.fillRect(146, 138, 22, yBot(RW) - 138);   // inside (seen when ajar)
  c.fillStyle = '#9a8a78'; c.fillRect(146 + ajar, 138, 22 - ajar, yBot(RW) - 138);           // the door
  c.fillStyle = '#c9a441'; c.fillRect(146 + ajar + 2, 178, 2, 3);
  if (inBed && act === 'phone' && !a.asleep) {   // cold blue phone glow on the ceiling
    const pg = c.createRadialGradient(150, yTop(RW) + 4, 2, 150, yTop(RW) + 4, 46); pg.addColorStop(0, 'rgba(140,180,255,.55)'); pg.addColorStop(1, 'rgba(140,180,255,0)');
    c.fillStyle = pg; c.fillRect(100, 80, 100, 70);
  }

  // --- her in the hallway: head to toe, close when she is at your door
  if (room === 'hallway' && v !== 'in') {
    const near = v === 'hall' || v === 'handle';
    const look = OUTFIT_BY_ACTIVITY[v === 'idle' ? a.activity : (n.visit.from ?? 'tv')] ?? OUTFIT_BY_ACTIVITY.tv;
    const s = near ? 1.18 : 0.66, feet = near ? BOT - 4 : 300;
    drawHer(c, near ? 214 : 210, feet - 239.5 * s, s, { outfit: look.outfit, item: look.item, face: near ? 'neutral' : 'smile', pose: 'stand' });
  }
  c.restore();
}

/** Her face when she comes in, by situation (docs/design/her.md). */
function herFace(v: { checked: boolean; result: string; from?: string; kind?: string }, catches: number, mood: number, t: number): Face {
  if (v.result === 'caught') return catches >= 2 ? 'furious' : 'angry';
  const byResult: Record<string, Face> = { night: 'sleepy', forgiven: 'pout', offer: 'smile', snackOk: 'wink', snackFail: 'angry', deaf: 'angry', chat: 'neutral', chatGood: 'smile', chatBad: 'pout', chatMeh: 'neutral', ask: 'blush', cuddling: 'blush', cuddleGood: 'wink', cuddleMeh: 'pout', refused: 'pout' };
  if (byResult[v.result]) return byResult[v.result];
  if (!v.checked && v.kind === 'cuddle') return 'blush';
  if (!v.checked && v.kind === 'snack') return 'smile';
  if (v.result === 'look') return Math.floor(t / 1.6) % 3 === 2 ? 'wink' : 'blush';
  if (v.result === 'pass') return v.from === 'sleep' ? 'sleepy' : mood > 66 ? 'neutral' : 'smile';
  if (v.from === 'sleep') return 'pout';
  return mood > 66 ? 'angry' : 'suspicious';
}
/** A small reaction bubble over her head. */
function emote(c: CanvasRenderingContext2D, x: number, y: number, f: Face, t: number) {
  const sym: Partial<Record<Face, [string, string]>> = { suspicious: ['?', '#6a4a8a'], angry: ['!', '#e0304a'], furious: ['!!', '#e0304a'], smile: ['\u2665', '#e05a7a'], blush: ['\u2665', '#e05a7a'], wink: ['\u2665', '#e05a7a'], pout: ['...', '#6a4a8a'], sleepy: ['z', '#6a6aa8'] };
  const e = sym[f];
  if (!e) return;
  const bob = Math.round(Math.sin(t * 4) * 2);
  c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 13, y - 13 + bob, 26, 22, 8); c.fill();
  c.beginPath(); c.moveTo(x - 6, y + 8 + bob); c.lineTo(x - 12, y + 15 + bob); c.lineTo(x + 1, y + 8 + bob); c.fill();
  c.strokeStyle = '#3a1d24'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(x - 13, y - 13 + bob, 26, 22, 8); c.stroke();
  c.fillStyle = e[1]; c.font = '700 15px Inter, sans-serif'; c.textAlign = 'center'; c.fillText(e[0], x, y + 4 + bob);
}
