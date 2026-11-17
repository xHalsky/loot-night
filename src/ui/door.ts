import { S } from '../core/state';
import { drawHer, drawHerFrosted, OUTFIT_BY_ACTIVITY, type Face } from './her';

// Your door, seen from your desk. Hold it to peek: it opens a crack, and the light in the gap hints where she is.
export const DOOR_W = 280, DOOR_H = 396;
const TOP = 34, BOT = 370, X0 = 48, DW = 184;   // door opening

const SIL: [number, number, number, number][] = [[5,0,5,2],[4,2,7,4],[3,2,2,7],[5,6,5,2],[3,8,9,9],[1,9,2,7],[12,9,2,5],[4,17,7,3],[4,20,3,9],[8,20,3,9],[3,29,4,1],[8,29,4,1]];

function silhouette(c: CanvasRenderingContext2D, x: number, y: number, s: number, col = '#1a1220') {
  c.fillStyle = col;
  for (const [a, b, w, h] of SIL) c.fillRect(x + a * s, y + b * s, w * s, h * s);
}

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
    const p = n?.peek ?? 0;
    const gap = p * DW * 0.34;
    if (gap > 0.5) drawGap(c, X0 + DW - gap, TOP, gap, H, t);
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

/** What you see through the crack. Vague on purpose: light and shapes, not a map marker. */
function drawGap(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const n = S.g.night!;
  const a = n.apt;
  const v = n.visit.stage;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  // hallway: dim wall, floor
  c.fillStyle = '#2a2230'; c.fillRect(x, y, w, h);
  c.fillStyle = '#3a2e2a'; c.fillRect(x, y + h * 0.78, w, h * 0.22);
  const room = v === 'idle' ? (a.moving > 0 ? 'hallway' : a.room) : 'hallway';
  const near = v === 'hall' || v === 'handle';
  if (a.asleep && v === 'idle') {
    c.fillStyle = 'rgba(80,90,140,.25)'; c.fillRect(x, y, w, h);
  } else if (room === 'living') {
    const f = a.activity === 'tv' ? 0.35 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.08 : 0.3;
    c.fillStyle = a.activity === 'tv' ? `rgba(110,150,255,${f})` : `rgba(255,210,140,${f})`; c.fillRect(x, y, w * 0.7, h * 0.8);
  } else if (room === 'kitchen') {
    c.fillStyle = 'rgba(255,230,160,.35)'; c.fillRect(x + w * 0.4, y, w * 0.6, h * 0.8);
  } else if (room === 'bathroom') {
    c.fillStyle = 'rgba(220,240,255,.22)'; c.fillRect(x + w * 0.2, y, w * 0.5, h * 0.8);
    if (a.activity === 'shower') { c.fillStyle = 'rgba(210,230,245,.35)'; c.fillRect(x, y, w, h * 0.8); drawHerFrosted(c, x + w * 0.5, y + 20, 0.9); }
    if (a.activity === 'shower') for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(240,240,255,.12)'; c.beginPath(); c.arc(x + w * 0.4 + Math.sin(t + i) * 8, y + 30 + i * 14 - (t * 10 % 14), 10, 0, Math.PI * 2); c.fill(); }
  } else if (room === 'bedroom') {
    if (a.activity === 'phone') { c.fillStyle = 'rgba(160,200,255,.18)'; c.fillRect(x + w * 0.5, y + h * 0.3, w * 0.3, h * 0.3); }
  } else if (room === 'hallway') {
    c.fillStyle = 'rgba(255,220,160,.25)'; c.fillRect(x, y, w, h);
    if (near) {
      const look = OUTFIT_BY_ACTIVITY[n.visit.from ?? 'tv'] ?? OUTFIT_BY_ACTIVITY.tv;
      drawHer(c, x + w * 0.2, y + 18, 1.26, { outfit: look.outfit, item: look.item, face: 'neutral', pose: 'stand' });
    } else silhouette(c, x + w * 0.25, y + h * 0.3, 5, '#1a1220');
  }
  c.restore();
}

/** Her face when she comes in, by situation (docs/design/her.md). */
function herFace(v: { checked: boolean; result: string; from?: string; kind?: string }, catches: number, mood: number, t: number): Face {
  if (v.result === 'caught') return catches >= 2 ? 'furious' : 'angry';
  const byResult: Record<string, Face> = { offer: 'smile', snackOk: 'wink', snackFail: 'angry', deaf: 'angry', chat: 'neutral', chatGood: 'smile', chatBad: 'pout', chatMeh: 'neutral', ask: 'blush', cuddling: 'blush', cuddleGood: 'wink', cuddleMeh: 'pout', refused: 'pout' };
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
