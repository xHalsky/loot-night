// Him: the player, seen by the webcam on top of his monitor (docs/design/screen.md, Left panel; #36).
// One fixed head pose facing the camera, a back-of-head variant for when he turns to peek, expressions as
// small face layers and gear as layers on top (#37, #38). Placeholder art through pixel.ts until #5.
import { pixelSprite, blit, smooth, cel, mirror, type Pt } from './pixel';

export type HisFace = 'neutral' | 'guilty' | 'relief' | 'panic' | 'blush' | 'grin' | 'meh' | 'rude' | 'tired' | 'yawn' | 'asleep' | 'focused';
export interface HimOpts { face: HisFace; back?: boolean; blink?: boolean; look?: number; headset?: boolean; jitter?: number }

const C = {
  skin: '#f0c4a2', skinS: '#d49a78', skinD: '#b07658', blush: '#e88a86',
  hair: '#3a2a20', hairS: '#22170f', hairL: '#5c4232',
  tee: '#33415f', teeS: '#232f48', teeL: '#46577a',
  chair: '#2a2027', chairS: '#181217', chairR: '#b8323a',
  white: '#f6f2ea', iris: '#4a3121', brow: '#2a1b11', mouth: '#8e3f3a', tongue: '#d46a6a', line: '#3a1d24',
  set: '#26262e', setS: '#15151a', setL: '#9a6bff',
};
const W = 200, H = 300, OX = 100, OY = 30;   // sprite size and where the head's top-centre sits in it

const FACE: Pt[] = [[-34, 30], [-33, 52], [-29, 70], [-20, 84], [-9, 91], [0, 92, 1], [9, 91], [20, 84], [29, 70], [33, 52], [34, 30], [28, 8], [0, 1], [-28, 8]];
const HAIR_FRONT: Pt[] = [[-38, 36], [-41, 14], [-33, -3], [-17, -11], [0, -13], [18, -11], [34, -3], [41, 14], [38, 36], [35, 26], [31, 16], [22, 22, 1], [16, 11], [6, 20, 1], [-2, 9], [-11, 20, 1], [-19, 9], [-27, 21, 1], [-34, 24]];
const HAIR_BACK: Pt[] = [[-38, 40], [-41, 14], [-33, -3], [-17, -11], [0, -13], [18, -11], [34, -3], [41, 14], [38, 40], [34, 70], [22, 84], [0, 88], [-22, 84], [-34, 70]];
const TORSO: Pt[] = [[-26, 96], [-60, 108], [-86, 128], [-96, 178], [-98, 270, 1], [98, 270, 1], [96, 178], [86, 128], [60, 108], [26, 96]];
const CHAIR: Pt[] = [[-44, -16], [44, -16, 1], [46, 150, 1], [-46, 150, 1]];

function eyes(c: CanvasRenderingContext2D, f: HisFace, blink: boolean, look: number) {
  const closed = blink || f === 'asleep' || f === 'relief';
  for (const s of [-1, 1]) {
    const ex = s * 15;
    if (closed) {   // a closed eye: a soft arc (relieved, asleep) or a line (blink)
      c.strokeStyle = C.line; c.lineWidth = 2; c.beginPath();
      if (f === 'relief' || f === 'asleep') c.arc(ex, 49, 6, 0.15 * Math.PI, 0.85 * Math.PI); else { c.moveTo(ex - 7, 51); c.lineTo(ex + 7, 51); }
      c.stroke(); continue;
    }
    const ry = f === 'panic' ? 6.5 : f === 'tired' || f === 'yawn' ? 2.6 : f === 'focused' ? 3.6 : 4.6;
    c.fillStyle = C.white; c.beginPath(); c.ellipse(ex, 50, 7.5, ry, 0, 0, Math.PI * 2); c.fill();
    const ir = f === 'panic' ? 2.6 : 3.6;
    c.fillStyle = C.iris; c.beginPath(); c.arc(ex + look * 3, 50.5, Math.min(ir, ry), 0, Math.PI * 2); c.fill();
    c.fillStyle = '#140c08'; c.beginPath(); c.arc(ex + look * 3, 50.5, Math.min(1.7, ry * 0.5), 0, Math.PI * 2); c.fill();
    if (ry > 3) { c.fillStyle = '#fff'; c.fillRect(ex + look * 3 - 2, 48, 1.6, 1.6); }
    c.fillStyle = C.line; c.fillRect(ex - 7.5, 50 - ry - 0.6, 15, 1.8);            // upper lid line
    if (f === 'tired' || f === 'yawn') { c.fillStyle = C.skinS; c.fillRect(ex - 7.5, 50 - ry - 3, 15, 3); }   // heavy lids
  }
}

function brows(c: CanvasRenderingContext2D, f: HisFace) {
  c.fillStyle = C.brow;
  for (const s of [-1, 1]) {
    c.save(); c.scale(s, 1);
    // [inner y, outer y]: worried brows go up in the middle, angry ones down
    const [yi, yo] = f === 'panic' || f === 'guilty' ? [34, 40] : f === 'rude' || f === 'focused' ? [42, 37] : f === 'tired' || f === 'asleep' ? [42, 43] : f === 'grin' ? [37, 37] : [39, 38];
    c.beginPath(); c.moveTo(6, yi); c.lineTo(23, yo - 1); c.lineTo(23, yo + 2.6); c.lineTo(6, yi + 3.2); c.closePath(); c.fill();
    c.restore();
  }
}

function mouth(c: CanvasRenderingContext2D, f: HisFace) {
  c.strokeStyle = C.mouth; c.fillStyle = C.mouth; c.lineWidth = 2.2; c.lineCap = 'round';
  const line = (pts: [number, number][]) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  switch (f) {
    case 'guilty': line([[-9, 77], [-3, 79], [3, 78], [9, 75]]); break;                       // crooked, guilty smile
    case 'relief': line([[-8, 77], [0, 80], [8, 77]]); break;
    case 'grin': case 'blush':
      c.beginPath(); c.moveTo(-11, 75); c.quadraticCurveTo(0, 88, 11, 75); c.closePath(); c.fill();
      c.fillStyle = C.white; c.fillRect(-8, 75, 16, 3); break;
    case 'panic': c.beginPath(); c.ellipse(0, 79, 5, 6.5, 0, 0, Math.PI * 2); c.fill(); break;
    case 'yawn': c.beginPath(); c.ellipse(0, 79, 6.5, 9, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = C.tongue; c.beginPath(); c.ellipse(0, 84, 4, 3, 0, 0, Math.PI * 2); c.fill(); break;
    case 'meh': line([[-7, 78], [7, 78]]); line([[7, 78], [9, 76]]); break;
    case 'rude': line([[-8, 80], [0, 77], [8, 80]]); break;
    case 'asleep': c.beginPath(); c.ellipse(0, 80, 2.5, 2, 0, 0, Math.PI * 2); c.fill(); break;
    case 'focused': line([[-6, 78], [6, 78]]); break;
    default: line([[-7, 78], [0, 79], [7, 78]]);
  }
}

function headset(c: CanvasRenderingContext2D, back: boolean) {
  c.strokeStyle = C.set; c.lineWidth = 6; c.beginPath(); c.arc(0, 34, 42, Math.PI * 1.08, Math.PI * 1.92); c.stroke();   // the band
  for (const s of [-1, 1]) {
    cel(c, smooth([[s * 34, 32], [s * 46, 30], [s * 48, 62, 1], [s * 34, 64, 1]]), C.set, C.setS, 1);
    if (!back) { c.fillStyle = C.setL; c.fillRect(s > 0 ? 44 : -46, 40, 2, 14); }   // the purple RGB strip
  }
  if (!back) { c.strokeStyle = C.set; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-42, 58); c.quadraticCurveTo(-36, 80, -14, 82); c.stroke(); }   // the mic
}

function figure(c: CanvasRenderingContext2D, o: HimOpts) {
  cel(c, smooth(CHAIR), C.chair, C.chairS, 1);
  c.fillStyle = C.chairR; c.fillRect(-30, -10, 7, 150); c.fillRect(23, -10, 7, 150);       // gaming-chair stripes
  cel(c, smooth([[-15, 72], [-16, 104], [0, 110], [16, 104], [15, 72]]), C.skin, C.skinS, 1);   // neck
  cel(c, smooth(TORSO), C.tee, C.teeS, 1.4);
  if (!o.back) {
    cel(c, smooth([[-17, 97], [-7, 106], [0, 108, 1], [7, 106], [17, 97], [0, 100]]), C.skin, C.skinS, 0.6);   // neckline
    c.fillStyle = C.teeL; c.fillRect(-60, 150, 18, 3); c.fillRect(-60, 156, 12, 3);                              // a small print
  }
  if (o.back) {   // turned toward the door: the back of his head
    for (const s of [-1, 1]) cel(c, smooth([[s * 33, 38], [s * 41, 42], [s * 40, 60], [s * 33, 62]]), C.skin, C.skinS, 1);
    cel(c, smooth(HAIR_BACK), C.hair, C.hairS, 1.2);
    c.fillStyle = C.hairL; c.fillRect(-12, 6, 10, 3); c.fillRect(6, 14, 8, 3);
    if (o.headset) headset(c, true);
    return;
  }
  for (const s of [-1, 1]) cel(c, smooth([[s * 32, 38], [s * 40, 40], [s * 41, 58], [s * 33, 62]]), C.skin, C.skinS, 1);   // ears
  cel(c, smooth(FACE), C.skin, C.skinS, 1);
  c.fillStyle = C.skinS; c.beginPath(); c.moveTo(2, 56); c.lineTo(5, 66); c.lineTo(0, 68); c.closePath(); c.fill();   // nose shadow
  if (o.face === 'blush') { c.fillStyle = C.blush; for (const s of [-1, 1]) c.fillRect(s * 22 - 6, 62, 12, 5); }
  eyes(c, o.face, !!o.blink, o.look ?? 0);
  brows(c, o.face);
  mouth(c, o.face);
  if (o.face === 'panic' || o.face === 'guilty') { c.fillStyle = '#9fd4ff'; c.beginPath(); c.ellipse(31, 24, 3, 5, 0, 0, Math.PI * 2); c.fill(); }   // a drop of sweat
  cel(c, smooth(HAIR_FRONT), C.hair, C.hairS, 1.2);
  c.fillStyle = C.hairL; c.fillRect(-20, -4, 12, 3); c.fillRect(8, -6, 10, 3);
  if (o.headset) headset(c, false);
}
void mirror;

/** Draws him with the top-centre of his head at (x, y). */
export function drawHim(c: CanvasRenderingContext2D, x: number, y: number, o: HimOpts) {
  const key = `him:${o.back ? 'b' : o.face}:${o.blink ? 1 : 0}:${o.look ?? 0}:${o.headset ? 1 : 0}`;
  const sp = pixelSprite(key, W, H, cc => { cc.translate(OX, OY); figure(cc, o); });
  blit(c, sp, x - OX + (o.jitter ?? 0), y - OY, 1);
}
