// Him: the player, seen by the webcam on top of his monitor (docs/design/screen.md, Left panel; #36, #40).
// A dark silhouette in a dark room; his glasses catch the screen and shine white. Stoic, like the serious one in
// a comedy anime: no face at all until something embarrassing happens, then the exaggerated emotes break out.
// One head pose, emote layers on top, gear as layers (#38). Placeholder art through pixel.ts until #5.
import { pixelSprite, blit, smooth, cel, type Pt } from './pixel';

export type HisFace = 'neutral' | 'guilty' | 'relief' | 'panic' | 'blush' | 'grin' | 'meh' | 'rude' | 'tired' | 'yawn' | 'asleep' | 'focused';
export interface HimOpts { face: HisFace; back?: boolean; look?: number; headset?: boolean; jitter?: number; glow?: string; lens?: string }

const C = {
  body: '#0d0d11', bodyS: '#09090c', head: '#0f0f13', headS: '#0b0b0e', hair: '#0a0a0d', hairS: '#070709', shine: '#2a2a33',
  rim: '#2e2e38', frame: '#030304',
  lens: '#fbfbff', dim: '#8a8a98', off: '#34343e', fog: '#ffd9e4',
  mouth: '#e8607a', mouthD: '#5a1424', teeth: '#f4f1ea', sweat: '#a8dcff', blush: '#ff7a9a', puff: '#d8d8e0',
  set: '#141418', setS: '#0e0e11', setL: '#4fd1e8',   // the cups light up in the Zone's cyan (#49)
};
const SC = 0.9;                                       // the whole figure, so he fits under the door as a bust
const W = 200, H = 200, OX = 100, OY = 20;            // sprite size; head top-centre at (OX, OY)

const FACE: Pt[] = [[-34, 30], [-33, 52], [-29, 70], [-20, 84], [-9, 91], [0, 92, 1], [9, 91], [20, 84], [29, 70], [33, 52], [34, 30], [28, 8], [0, 1], [-28, 8]];
const HAIR_FRONT: Pt[] = [[-39, 40], [-42, 14], [-33, -4], [-17, -13], [0, -15], [18, -13], [34, -4], [42, 14], [39, 40], [35, 28], [30, 16], [22, 24, 1], [15, 12], [6, 22, 1], [-2, 10], [-11, 22, 1], [-19, 10], [-27, 24, 1], [-35, 26]];
const HAIR_BACK: Pt[] = [[-39, 44], [-42, 14], [-33, -4], [-17, -13], [0, -15], [18, -13], [34, -4], [42, 14], [39, 44], [34, 72], [22, 86], [0, 90], [-22, 86], [-34, 72]];
const TORSO: Pt[] = [[-24, 94], [-62, 108], [-92, 130], [-104, 180], [-106, 200, 1], [106, 200, 1], [104, 180], [92, 130], [62, 108], [24, 94]];

/** Where the lenses sit and what they look like, by face. y is the lens centre. */
function lensState(f: HisFace): { state: 'on' | 'dim' | 'off' | 'fog' | 'shock'; dy: number; tilt: number } {
  if (f === 'asleep') return { state: 'off', dy: 7, tilt: 0.12 };      // glasses slid down his nose
  if (f === 'panic') return { state: 'shock', dy: 0, tilt: -0.08 };
  if (f === 'blush') return { state: 'fog', dy: 0, tilt: 0 };
  if (f === 'tired') return { state: 'dim', dy: 2, tilt: 0 };
  if (f === 'yawn') return { state: 'on', dy: -2, tilt: 0.06 };
  return { state: 'on', dy: 0, tilt: 0 };
}

function glasses(c: CanvasRenderingContext2D, f: HisFace, look: number, lens?: string) {
  const L = lensState(f);
  c.save(); c.translate(look * 4, 50 + L.dy); c.rotate(L.tilt);
  for (const s of [-1, 1]) {
    const cx = s * 15;
    c.fillStyle = C.frame;
    if (L.state === 'shock') { c.beginPath(); c.arc(cx, 0, 14, 0, Math.PI * 2); c.fill(); }
    else { c.beginPath(); c.roundRect(cx - 12.5, -8, 25, 16, 6); c.fill(); }
    c.fillStyle = L.state === 'dim' ? C.dim : L.state === 'off' ? C.off : L.state === 'fog' ? C.fog : lens ?? C.lens;
    if (L.state === 'shock') { c.beginPath(); c.arc(cx, 0, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(cx + look * 2, 1, 1.8, 0, Math.PI * 2); c.fill(); }   // eyes popping
    else { c.beginPath(); c.roundRect(cx - 10.5, -6, 21, 12, 5); c.fill(); }
  }
  c.fillStyle = C.frame; c.fillRect(-4, -2, 8, 2.5);                                       // bridge
  c.fillRect(-36, -3, 10, 2); c.fillRect(26, -3, 10, 2);                                  // temples
  c.restore();
}

function emote(c: CanvasRenderingContext2D, f: HisFace) {
  const m = C.mouth;
  c.lineCap = 'round';
  const line = (pts: [number, number][], w = 2.4, col = m) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  const drop = (x: number, y: number, s = 1) => { c.fillStyle = C.sweat; c.beginPath(); c.moveTo(x, y - 7 * s); c.quadraticCurveTo(x + 5 * s, y + 1 * s, x, y + 4 * s); c.quadraticCurveTo(x - 5 * s, y + 1 * s, x, y - 7 * s); c.fill(); };
  switch (f) {
    case 'guilty':   // she walked in: a wobbly mouth and a big sweat drop, the stoic face cracks
      line([[-9, 77], [-5, 75], [-1, 78], [3, 75], [7, 78], [10, 76]]); drop(34, 24, 1.3); break;
    case 'panic':   // caught: the full meltdown
      c.fillStyle = m; c.beginPath(); c.ellipse(0, 79, 9, 11, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = C.mouthD; c.beginPath(); c.ellipse(0, 81, 6, 7.5, 0, 0, Math.PI * 2); c.fill();
      drop(36, 22, 1.4); drop(-38, 30, 1.1); drop(30, 62, 0.9); break;
    case 'blush':   // fogged glasses, blush lines, steam from the head
      c.strokeStyle = C.blush; c.lineWidth = 1.6;
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(s * (14 + i * 5), 63); c.lineTo(s * (11 + i * 5), 69); c.stroke(); }
      line([[-4, 79], [0, 80], [4, 79]], 2);
      c.fillStyle = C.puff; for (const [x, y, r] of [[30, -18, 5], [38, -26, 4], [24, -28, 3]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
      break;
    case 'grin':   // a big drop: the satisfied, slightly evil grin
      c.fillStyle = m; c.beginPath(); c.moveTo(-17, 72); c.quadraticCurveTo(0, 92, 17, 72); c.quadraticCurveTo(0, 80, -17, 72); c.fill();
      c.fillStyle = C.teeth; c.beginPath(); c.moveTo(-13, 74.5); c.quadraticCurveTo(0, 81, 13, 74.5); c.quadraticCurveTo(0, 78.5, -13, 74.5); c.fill(); break;
    case 'rude':   // a smug smirk
      line([[-6, 79], [3, 79], [9, 75]]); break;
    case 'meh': line([[-5, 79], [5, 79]], 2); break;
    case 'relief':   // a small exhale
      c.fillStyle = C.puff; for (const [x, y, r] of [[18, 82, 3], [25, 84, 4.5], [34, 85, 3.5]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
      break;
    case 'yawn':
      c.fillStyle = m; c.beginPath(); c.ellipse(0, 80, 8, 12, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = C.mouthD; c.beginPath(); c.ellipse(0, 82, 5, 8, 0, 0, Math.PI * 2); c.fill(); break;
    case 'asleep':   // eyes shut above the slipped glasses, mouth open a little
      line([[-21, 44], [-9, 44]], 1.6, C.rim); line([[9, 44], [21, 44]], 1.6, C.rim);
      c.fillStyle = m; c.beginPath(); c.ellipse(0, 82, 3, 2.5, 0, 0, Math.PI * 2); c.fill(); break;
  }
}

/** Zone: hands steepled in front of his face. */
function steepled(c: CanvasRenderingContext2D) {
  const edge = { color: '#3c3c48', w: 1.4 };
  cel(c, smooth([[-46, 200, 1], [-34, 120], [-14, 92], [0, 70, 1], [14, 92], [34, 120], [46, 200, 1]]), '#16161b', '#121216', 1, edge);   // forearms
  cel(c, smooth([[-22, 104], [-20, 78], [-12, 66], [0, 62, 1], [12, 66], [20, 78], [22, 104], [0, 112]]), '#1b1b21', '#16161b', 1, edge);   // the hands
  c.strokeStyle = '#3c3c48'; c.lineWidth = 1.2;
  for (const x of [-12, -5, 5, 12]) { c.beginPath(); c.moveTo(x, 84); c.lineTo(x * 0.6, 102); c.stroke(); }
  c.beginPath(); c.moveTo(0, 63); c.lineTo(0, 92); c.stroke();
}

function headset(c: CanvasRenderingContext2D, back: boolean) {
  c.strokeStyle = C.set; c.lineWidth = 7; c.beginPath(); c.arc(0, 34, 44, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
  for (const s of [-1, 1]) {
    cel(c, smooth([[s * 35, 32], [s * 48, 30], [s * 50, 64, 1], [s * 35, 66, 1]]), C.set, C.setS, 1);
    if (!back) { c.fillStyle = C.setL; c.fillRect(s > 0 ? 46 : -48, 40, 2, 16); }
  }
}

function figure(c: CanvasRenderingContext2D, o: HimOpts) {
  cel(c, smooth([[-15, 72], [-16, 104], [0, 110], [16, 104], [15, 72]]), C.body, C.bodyS, 1);   // neck
  cel(c, smooth(TORSO), C.body, C.bodyS, 1.2);
  if (o.back) {   // turned toward the door
    for (const s of [-1, 1]) cel(c, smooth([[s * 33, 38], [s * 41, 42], [s * 40, 60], [s * 33, 62]]), C.head, C.headS, 1);
    cel(c, smooth(HAIR_BACK), C.hair, C.hairS, 1.2);
    c.fillStyle = C.shine; c.fillRect(-14, 4, 12, 2); c.fillRect(6, 12, 9, 2);
    c.fillStyle = C.rim; c.fillRect(-40, 44, 6, 1.5); c.fillRect(34, 44, 6, 1.5);   // the glasses' arms over his ears
    if (o.headset) headset(c, true);
    return;
  }
  const look = o.look ?? 0;
  c.save(); c.translate(look * 3, 0);   // a sound: his head turns a little toward it
  for (const s of [-1, 1]) cel(c, smooth([[s * 32, 38], [s * 40, 40], [s * 41, 58], [s * 33, 62]]), C.head, C.headS, 1);
  cel(c, smooth(FACE), C.head, C.headS, 1);
  if (o.face !== 'focused') emote(c, o.face);
  cel(c, smooth(HAIR_FRONT), C.hair, C.hairS, 1.2);
  c.fillStyle = C.shine; c.fillRect(-22, -6, 13, 2); c.fillRect(8, -8, 11, 2); c.fillRect(-6, 0, 8, 2);   // anime hair shine
  glasses(c, o.face, look, o.lens);
  if (o.face === 'focused') steepled(c);
  if (o.headset) headset(c, false);
  c.restore();
}

/** Draws him with the top-centre of his head at (x, y), then the screen's glow on his lenses. */
export function drawHim(c: CanvasRenderingContext2D, x: number, y: number, o: HimOpts) {
  const look = o.look ?? 0;
  const key = `him3:${o.back ? 'b' : o.face}:${look}:${o.headset ? 1 : 0}:${o.lens ?? ''}`;
  const sp = pixelSprite(key, W, H, cc => { cc.translate(OX, OY); cc.scale(SC, SC); figure(cc, o); }, { outline: '#3e3e4a' });
  const jx = o.jitter ?? 0;
  blit(c, sp, x - OX + jx, y - OY, 1);
  if (o.back) return;
  const L = lensState(o.face);
  if (L.state === 'off' || L.state === 'dim') return;
  const glow = o.glow ?? 'rgba(220,232,255,';
  for (const s of [-1, 1]) {   // bloom: the lenses catch the monitor
    const gx = x + jx + (s * 15 + look * 7) * SC, gy = y + (50 + L.dy) * SC;
    const g = c.createRadialGradient(gx, gy, 2, gx, gy, 22);
    g.addColorStop(0, `${glow}0.55)`); g.addColorStop(0.5, `${glow}0.16)`); g.addColorStop(1, `${glow}0)`);
    c.fillStyle = g; c.fillRect(gx - 22, gy - 22, 44, 44);
  }
  if (o.face === 'rude' || o.face === 'grin' || o.face === 'focused') {   // the glint: a sharp star on one lens
    const gx = x + jx + (15 + look * 7) * SC + 5, gy = y + (50 + L.dy) * SC - 4;
    c.fillStyle = '#fff'; c.fillRect(gx - 7, gy, 15, 1); c.fillRect(gx, gy - 7, 1, 15); c.fillRect(gx - 2, gy - 2, 5, 5);
  }
}

// ---------- His chair (V4, #69; grid doc 7k): a gaming chair in Paweł's reference shape, no logos ----------
// One tall back with a broad arched top (no separate headrest), sides that run down almost straight, bolsters whose
// inner edge (the piping) runs from near the top corners down and in, outer piping down the lower sides, a seam over
// the lumbar curving down to the sides. Black leather with a faint dither, grey piping, the top edge catching the
// screen. The webcam is close and the back reclines toward it, so it widens toward the frame's bottom and runs past it.
// It is drawn in whole grid px (2 x 2 CSS px) because her panel is dithered onto the 640 x 360 grid; he sits in it:
// the chair goes before him, and from his shoulders down the bolsters come forward over his shoulders' outer 4 px.
const GP = 2;                                                    // CSS px per grid px
const CHAIR_HC = { void: '#0a0814', s1: '#17191e', s2: '#24272e', s3: '#363b44' };   // the desk's Graphite
const CH_TOP = 9, CH_ROWS = 80, CH_W = 46;                      // grid px: its top is 9 over his head; rows drawn
const BAY = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
const chSide = (r: number) => 23 + 21 * Math.pow(Math.max(0, r) / 78, 2.2);   // half width r grid px under its top
function chTop(dx: number) {   // the top edge: a broad arch, 3 px lower at the sides, its corners rounded
  const a = Math.abs(dx), R = 6, w = 23;
  return 3 * (a / w) ** 2 + (a > w - R ? R - Math.sqrt(Math.max(0, R * R - (a - (w - R)) ** 2)) : 0);
}
const chIn = (dx: number, r: number) => r >= chTop(dx) && Math.abs(dx) <= chSide(r);
const chInner = (r: number) => (r < 56 ? 21 - (r / 56) * 9 : 12) * (23 / 28);   // the bolsters' inner edge
const chSeam = (dx: number) => 34 + 3 * (dx / 10) ** 2;                         // the lumbar's seam
function chairPx(dx: number, r: number): keyof typeof CHAIR_HC | null {
  if (!chIn(dx, r)) return null;
  if (!chIn(dx, r - 1)) return 's3';                                            // the top edge catches the screen
  if (!chIn(dx - 1, r) || !chIn(dx + 1, r)) return 's2';                        // a thin grey down the sides
  const a = Math.abs(dx), side = chSide(r), inner = Math.round(chInner(r));
  if (r - chTop(dx) < 2.2) return 's2';
  if (r > 30 && a === Math.floor(side) - 2) return 's1';                        // the outer piping
  if (a === inner) return 's1';                                                 // the bolsters' piping
  if (r === Math.round(chSeam(dx)) && a < inner) return 's1';                   // the seam over the lumbar
  return (0.06 - 0.04 * a / side) > ((BAY[((r & 7) << 3) | ((dx + 64) & 7)] + 0.5) / 64) * 0.4 ? 's1' : 'void';
}
// his half width in grid px, r grid px under the chair's top (his shoulders, from the TORSO polygon at SC)
function himHW(r: number) {
  const u = (r - CH_TOP) * GP / SC;   // sprite units under his head's top
  const T0 = TORSO.slice(0, 5).map(p => [-p[0], p[1]]).reverse() as [number, number][];   // (hw, y) down his left side
  if (u < T0[T0.length - 1][1]) return 0;
  for (let i = T0.length - 1; i > 0; i--) { const [w0, y0] = T0[i], [w1, y1] = T0[i - 1]; if (u >= y0 && u <= y1) return ((w0 + (w1 - w0) * (u - y0) / (y1 - y0)) * SC) / GP; }
  return (T0[0][0] * SC) / GP;
}
let chairCv: HTMLCanvasElement | null = null, wrapCv: HTMLCanvasElement | null = null;
function chairCanvases() {
  if (chairCv) return;
  const mk = () => { const cv = document.createElement('canvas'); cv.width = (CH_W * 2 + 1) * GP; cv.height = CH_ROWS * GP; return cv; };
  chairCv = mk(); wrapCv = mk();
  const a = chairCv.getContext('2d')!, b = wrapCv.getContext('2d')!;
  for (let r = 0; r < CH_ROWS; r++) for (let dx = -CH_W; dx <= CH_W; dx++) {
    const c = chairPx(dx, r); if (!c) continue;
    const x = (dx + CH_W) * GP, y = r * GP, d = Math.abs(dx), hw = himHW(r);
    a.fillStyle = CHAIR_HC[c]; a.fillRect(x, y, GP, GP);
    // from his shoulders down, the bolsters cover his shoulders' outer 4 px (outside the piping)
    if (hw > 0 && r >= CH_TOP + 41 && d <= hw && d >= hw - 4 && d > chInner(r) + 2) { b.fillStyle = CHAIR_HC[c]; b.fillRect(x, y, GP, GP); }
  }
}
/** His chair, behind him; (x, y) as drawHim's: the top-centre of his head, on whole grid px. */
export function drawChair(c: CanvasRenderingContext2D, x: number, y: number) {
  chairCanvases();
  c.drawImage(chairCv!, x - CH_W * GP, y - CH_TOP * GP);
}
/** The bolsters over his shoulders, after him. */
export function drawChairWrap(c: CanvasRenderingContext2D, x: number, y: number) {
  chairCanvases();
  c.drawImage(wrapCv!, x - CH_W * GP, y - CH_TOP * GP);
}
