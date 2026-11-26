// Her: pixel-anime figure (docs/design/her.md). Vector shapes rendered through ui/pixel.ts
// at low resolution (hard edges, 1px outline, nearest-neighbour upscale). Poses: standing at the door,
// leaning on the frame (barefoot, one foot against her calf), leaning into your face from the right (the
// questions, upper body), and asleep in bed seen from the foot end (bare soles out from under the blanket).
import { pixelSprite, blit, smooth, poly, mirror, rows, cel, type Pt } from './pixel';

export type Outfit = 'lounge' | 'towel' | 'hoodie' | 'bighoodie' | 'pajama' | 'tank'   // bighoodie: your gaming hoodie on her, sleeves over her hands
  | 'blouse' | 'sweater' | 'yoga' | 'fury' | 'cathoodie' | 'pjset';   // fan-service 3 and 4 (#90, #91): home from work, the couch, yoga; her gifts
/** What's on her feet (#90): it changes her footsteps. */
export type Feet = 'bare' | 'slippers' | 'socks' | 'fluffy' | 'knee';
export type Face = 'smile' | 'neutral' | 'angry' | 'pout' | 'blush' | 'sleepy' | 'suspicious' | 'wink' | 'surprised' | 'furious';
export type Item = 'none' | 'mug' | 'phone' | 'remote' | 'plate';
export interface HerOpts { outfit: Outfit; face: Face; pose?: 'stand' | 'lean'; item?: Item; blink?: boolean; feet?: Feet }

const C = {
  skin: '#f9d8c2', skinS: '#e9ad96', skinD: '#c9846f', skinH: '#fff1e6', sole: '#f7c4b2',
  hair: '#30222b', hairS: '#1b1218', hairL: '#57404f',
  iris: '#2f9282', irisD: '#173f3c', lash: '#24121a', lip: '#d4607a', nail: '#f3a2ab',
  line: '#3a1d24',
};
let LW = 1;   // outline width in local units (≈1 output pixel), set per render

// Outfits: [base, shade] colours
const CLOTH: Record<string, [string, string]> = {
  tee: ['#f4f1ea', '#d3cdc2'], denim: ['#5c7aaa', '#3f5a8a'], tank: ['#2e2d3a', '#1d1c26'], sweat: ['#a7aec0', '#7d8598'],
  hoodie: ['#b8a4e2', '#8b77bf'], gamer: ['#2c2f3a', '#1c1e26'], shirt: ['#d3e3f4', '#a5bfdb'], towel: ['#f7f4ef', '#d9d2c6'],
  // the set (#90) and her gifts (#91)
  // picked on her panel's PC-98 colours, so the dither keeps them solid (pastels between two of them read see-through)
  blouse: ['#f6f1ec', '#d6ccc6'], skirt: ['#343a52', '#232838'], knit: ['#bb9977', '#774433'], yogatop: ['#7a4f8c', '#56356a'], legging: ['#3c3248', '#29222f'],
  fury: ['#2a2630', '#18161c'], cat: ['#d9a69c', '#ee6688'], satin: ['#aa88cc', '#553366'],
  sock: ['#efeae2', '#cfc6ba'], fluffy: ['#f2efdc', '#aa88cc'], knee: ['#f4f1ea', '#cfc8bd'], slipper: ['#aa88cc', '#553366'],
};

// ---------------------------------------------------------------- head (shared by all poses)
const FACE: Pt[] = [[-15.5, 15], [-15, 27], [-11.5, 35.5], [-5.5, 41.5], [0, 43.5, 1], [5.5, 41.5], [11.5, 35.5], [15, 27], [15.5, 15], [12, 3], [0, -1], [-12, 3]];
const BACK_HAIR: Pt[] = [[-16, 8], [-23, 30], [-26, 60], [-27, 92], [-23, 110], [-13, 104], [0, 109], [13, 104], [23, 110], [27, 92], [26, 60], [23, 30], [16, 8], [0, -3]];
const BANGS: Pt[] = [[-17.5, 26], [-19, 9], [-12, -1.5], [0, -4], [12, -1.5], [19, 9], [17.5, 26], [14.5, 15], [11.5, 24, 1], [8.5, 13], [4.5, 22, 1], [1.5, 12], [-2.5, 23, 1], [-6, 12], [-10, 23, 1], [-13.5, 14]];
const LOCK_L: Pt[] = [[-16, 11], [-19.5, 30], [-21.5, 54], [-22.5, 76], [-19, 90, 1], [-16.5, 72], [-14.5, 48], [-13.5, 27]];

function eye(c: CanvasRenderingContext2D, side: number, f: Face, blink: boolean) {
  c.save(); c.scale(side, 1);
  if (f === 'wink' && side < 0) {   // happy closed eye ^
    c.strokeStyle = C.lash; c.lineWidth = 1.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4.6, 1.2); c.quadraticCurveTo(0, -3.4, 4.8, 1); c.stroke();
    c.restore(); return;
  }
  if (blink || f === 'sleepy') {
    c.strokeStyle = C.lash; c.lineWidth = 1.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4.8, 0.5); c.quadraticCurveTo(0, 2.6, 5, 0); c.lineTo(6.3, -1.4); c.stroke();
    c.restore(); return;
  }
  const white = smooth([[-5, 0.4], [-2.2, -3.2], [2.8, -3.5], [5.2, -1], [3.6, 2.8], [-1.8, 3.1]]);
  c.fillStyle = '#fffaf6'; c.fill(white);
  c.save(); c.clip(white);
  c.fillStyle = C.iris; c.beginPath(); c.ellipse(0.3, 0.4, 2.9, 3.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.irisD; c.fillRect(-3, -4, 6.6, 3.2);
  c.fillStyle = '#0e1d1c'; c.beginPath(); c.ellipse(0.3, 0.6, 1.1, 1.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(1.4, -1.2, 1.15, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(-1, 1.9, 0.55, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(58,29,36,.35)'; c.fillRect(-6, -4, 12, 1.6);           // lid shadow
  if (f === 'suspicious' || f === 'angry' || f === 'furious') { c.fillStyle = C.skin; c.fillRect(-6, -5, 12, f === 'suspicious' ? 3.4 : 2.4); }   // narrowed lids
  c.restore();
  if (f === 'surprised') { c.fillStyle = '#fff'; c.beginPath(); c.arc(0.3, 0.4, 1, 0, Math.PI * 2); c.fill(); }
  // lashes: heavy upper line with a wing, thin lower line
  c.strokeStyle = C.lash; c.lineCap = 'round';
  const lid = f === 'suspicious' ? 1.6 : f === 'angry' || f === 'furious' ? 1 : f === 'surprised' ? -0.8 : 0;
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(-5.3, 0.6 + lid * 0.5); c.quadraticCurveTo(-1, -4.3 + lid, 5.4, -1.6 + lid * 0.6); c.lineTo(6.9, -3.2 + lid * 0.4); c.stroke();
  c.lineWidth = 0.7; c.strokeStyle = '#9a5a62'; c.beginPath(); c.moveTo(-2.6, 3.2); c.quadraticCurveTo(1, 3.6, 3.8, 2.6); c.stroke();
  c.restore();
}

function head(c: CanvasRenderingContext2D, o: { outfit: Outfit; face: Face; blink?: boolean }, front: boolean) {
  const towel = o.outfit === 'towel';
  if (!front) {   // back layer: long hair behind the body
    if (!towel) cel(c, smooth(BACK_HAIR), C.hair, C.hairS, 1);
    return;
  }
  const face = smooth(FACE);
  cel(c, face, C.skin, C.skinS, 0.9);
  c.save(); c.clip(face); c.fillStyle = C.skinS; c.beginPath(); c.ellipse(0, 15, 17, 6, 0, 0, Math.PI * 2); c.fill(); c.restore();   // shadow under bangs
  // eyes
  c.save(); c.translate(-7.4, 27.4); eye(c, -1, o.face, !!o.blink); c.restore();
  c.save(); c.translate(7.4, 27.4); eye(c, 1, o.face, !!o.blink); c.restore();
  // nose, mouth
  c.fillStyle = C.skinD; c.fillRect(0.4, 33.4, 1.2, 0.9);
  c.strokeStyle = C.lip; c.lineCap = 'round'; c.lineWidth = 1;
  const f = o.face;
  c.beginPath();
  if (f === 'smile' || f === 'blush') { c.moveTo(-2.8, 38); c.quadraticCurveTo(0, 40.4, 2.8, 38); c.stroke(); if (f === 'blush') { c.fillStyle = '#b24a62'; c.beginPath(); c.moveTo(-1.6, 38.6); c.quadraticCurveTo(0, 40.6, 1.6, 38.6); c.fill(); } }
  else if (f === 'angry') { c.moveTo(-2.6, 39.4); c.quadraticCurveTo(0, 37.6, 2.6, 39.4); c.stroke(); }
  else if (f === 'furious') { c.fillStyle = '#fff'; c.fillRect(-3, 37.4, 6, 2.2); c.strokeStyle = '#b24a62'; c.strokeRect(-3, 37.4, 6, 2.2); c.beginPath(); c.moveTo(-1, 37.4); c.lineTo(-1, 39.6); c.moveTo(1, 37.4); c.lineTo(1, 39.6); c.stroke(); }
  else if (f === 'surprised') { c.fillStyle = '#9a3a52'; c.ellipse(0, 39, 1.4, 1.9, 0, 0, Math.PI * 2); c.fill(); }
  else if (f === 'suspicious') { c.moveTo(-2.2, 38.8); c.lineTo(2.4, 38); c.stroke(); }
  else if (f === 'wink') { c.moveTo(-2.8, 37.8); c.quadraticCurveTo(0, 40.6, 2.8, 37.8); c.stroke(); c.fillStyle = '#e8728a'; c.fillRect(0.6, 38.6, 1.4, 1.2); }
  else if (f === 'pout') { c.fillStyle = '#d96d86'; c.ellipse(0, 38.8, 1.6, 1.3, 0, 0, Math.PI * 2); c.fill(); }
  else if (f === 'sleepy') { c.fillStyle = '#b24a62'; c.ellipse(0, 38.8, 1, 1.1, 0, 0, Math.PI * 2); c.fill(); }
  else { c.moveTo(-1.8, 38.6); c.lineTo(1.8, 38.6); c.stroke(); }
  if (f === 'blush' || f === 'smile' || f === 'pout' || f === 'wink' || f === 'furious') {
    c.fillStyle = 'rgba(244,120,140,.38)'; c.beginPath(); c.ellipse(-9.5, 33, 3.6, 1.8, 0, 0, Math.PI * 2); c.ellipse(9.5, 33, 3.6, 1.8, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(220,80,110,.7)'; c.lineWidth = 0.6; c.beginPath();
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.moveTo(s * (8 + i * 1.6), 32); c.lineTo(s * (8 + i * 1.6) - 1, 34); }
    c.stroke();
  }
  // hair
  if (towel) {
    cel(c, smooth([[-18, 22], [-20.5, 5], [-12, -8], [1, -12], [15, -9], [22.5, 2], [19, 22], [11, 12], [0, 10.5], [-11, 12.5]]), CLOTH.towel[0], CLOTH.towel[1], 1, { color: C.line, w: LW });
    cel(c, smooth([[5, -10], [15, -19], [25, -13], [19, -3]]), CLOTH.towel[0], CLOTH.towel[1], 1, { color: C.line, w: LW });
    c.fillStyle = C.hair; for (const s of [-1, 1]) c.fill(smooth([[s * 15.5, 15], [s * 17.5, 26], [s * 15.5, 34, 1], [s * 14, 22]]));   // wet strands
  } else {
    cel(c, smooth(BANGS), C.hair, C.hairS, 1);
    c.strokeStyle = C.hairL; c.lineWidth = 1.3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-11, 5); c.quadraticCurveTo(-7, 2, -3, 3); c.moveTo(3, 2.5); c.quadraticCurveTo(8, 1.5, 11.5, 4.5); c.stroke();   // angel ring
    c.fillStyle = '#e65a80'; c.fill(smooth([[11, 4], [16, 1.5], [17, 5.5], [12.5, 7]]));                                                         // hair clip
    if (o.outfit === 'cathoodie') {   // the hood up over her crown, its cat ears (#91)
      const ln = { color: C.line, w: LW };
      for (const k of [-1, 1]) { cel(c, poly([[k * 17, 1], [k * 15, -16], [k * 5, -7]]), CLOTH.cat[0], CLOTH.cat[1], 0.6, ln); c.fillStyle = '#e8728a'; c.fill(poly([[k * 14.5, -1], [k * 14, -11], [k * 8, -6]])); }
      cel(c, smooth([[-21, 20], [-22, 4], [-13, -8], [0, -11], [13, -8], [22, 4], [21, 20], [18, 7], [0, -3], [-18, 7]]), CLOTH.cat[0], CLOTH.cat[1], 1, ln);
    }
  }
  // brows peek over the bangs
  c.strokeStyle = 'rgba(36,18,26,.75)'; c.lineWidth = 0.9;
  const bt = f === 'angry' || f === 'furious' ? 1.8 : f === 'pout' || f === 'sleepy' ? -1 : f === 'surprised' ? -1.6 : 0;
  const raise = f === 'suspicious' ? -1.8 : 0;   // one raised brow
  c.beginPath(); c.moveTo(-10.5, 20.5 - bt * 0.3); c.lineTo(-4, 20.8 + bt); c.moveTo(10.5, 20.5 - bt * 0.3 + raise); c.lineTo(4, 20.8 + bt + raise); c.stroke();
  if (f === 'furious') {   // anger mark on the forehead
    c.strokeStyle = '#e0304a'; c.lineWidth = 1.2; c.beginPath();
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.moveTo(12 + dx * 1, 8 + dy * 1); c.lineTo(12 + dx * 3, 8 + dy * 3); }
    c.stroke();
  }
}
function locks(c: CanvasRenderingContext2D, outfit: Outfit, rightTucked = false) {
  if (outfit === 'towel') return;
  cel(c, smooth(LOCK_L), C.hair, C.hairS, 1);
  if (!rightTucked) cel(c, smooth(mirror(LOCK_L)), C.hair, C.hairS, 1);
}

// ---------------------------------------------------------------- body geometry
interface Geo {
  torso: Path2D; neck: Path2D; legs: Path2D[]; arms: Path2D[]; armsBack: Path2D[]; hands: Path2D[]; feet: Path2D[]; extra?: (c: CanvasRenderingContext2D) => void;
  front?: (c: CanvasRenderingContext2D) => void;   // drawn over the head (a finger on her lips)
  head: { x: number; y: number; s: number; r: number };
  bands: Record<Outfit, { on: 'torso' | 'legs' | 'legL' | 'legR' | 'armL' | 'armR' | 'arms'; poly: number[][]; cloth: string }[]>;
  hand: [number, number];      // where an item is held
  bust: number;                // y of the bust shading
  shoulder: number;
}

const ARM_L: Pt[] = [[-23, 55], [-28.5, 58], [-31.5, 69], [-32, 85], [-31.2, 99], [-30.3, 113], [-29, 124], [-24.6, 124], [-25.6, 112], [-26.2, 98], [-25.6, 86], [-24.4, 73]];
const HAND_L: Pt[] = [[-30.5, 121], [-31.5, 130], [-28.5, 136.5], [-24.6, 134.5], [-24, 126]];
const LEG_L: Pt[] = [[-24, 121], [-24.8, 138], [-22.2, 155], [-18.6, 170], [-19.2, 183], [-17.2, 199], [-14.2, 214], [-12.6, 224], [-7.4, 224], [-6.8, 212], [-6.4, 197], [-6, 183], [-5, 170], [-3.4, 152], [-1.4, 135], [0, 129, 1]];
const FOOT_L: Pt[] = [[-13.6, 221], [-15.4, 228.5], [-16.6, 234.5], [-14.8, 239], [-9, 239.8], [-5.4, 238], [-5.8, 231], [-7.4, 222]];
const TORSO: Pt[] = [[-5, 50], [-17, 53], [-24, 57], [-26.4, 64], [-24.4, 76], [-20.4, 88], [-16.6, 100], [-18.6, 110], [-23, 120], [-24.2, 128], [0, 133], [24.2, 128], [23, 120], [18.6, 110], [16.6, 100], [20.4, 88], [24.4, 76], [26.4, 64], [24, 57], [17, 53], [5, 50]];

function standGeo(lean: boolean): Geo {
  const legs = [smooth(LEG_L)];
  const feet = [smooth(FOOT_L)];
  let arms = [smooth(ARM_L), smooth(mirror(ARM_L))], hands = [smooth(HAND_L), smooth(mirror(HAND_L))];
  let extra: Geo['extra'];
  if (!lean) { legs.push(smooth(mirror(LEG_L))); feet.push(smooth(mirror(FOOT_L))); }
  else {
    // right leg bent: thigh forward, shin crossing back, pointed bare foot resting on the left calf
    legs.push(smooth([[24.2, 121], [23.6, 139], [18.6, 156], [14.6, 167], [8.6, 172], [3.6, 166], [3.4, 152], [1.4, 135], [0, 129, 1]]));
    extra = (c) => {
      cel(c, smooth([[13.8, 164], [9.4, 178], [2.4, 190], [-3.6, 197.6], [-8.2, 195.6], [-3.4, 185.8], [3, 173.6], [6, 164]]), C.skin, C.skinS, 0.9, { color: C.line, w: LW });
      const foot = smooth([[-3.2, 193.4], [-1.4, 199.4], [-3.4, 205.2], [-9.6, 209.6], [-16.4, 212.2, 1], [-15, 207.6], [-10.8, 202.8], [-8.6, 196.4]]);
      cel(c, foot, C.skin, C.skinS, 0.8, { color: C.line, w: LW });
      c.fillStyle = C.sole; c.fill(smooth([[-2, 200], [-4, 205], [-9, 208.4], [-6, 203.6]]));      // a glimpse of the sole
      c.fillStyle = C.nail; c.fillRect(-16.4, 210, 2.2, 1.6);
    };
    arms = [smooth(ARM_L), smooth([[22, 54], [30, 52], [38, 44], [40.5, 34], [39.5, 22], [37, 13], [32.5, 14], [34, 24], [34.5, 34], [31, 42], [24, 50]])];
    hands = [smooth(HAND_L), smooth([[32, 13], [34, 6], [39.5, 5.5], [40.5, 12], [37, 15]])];
  }
  const B = (y0: number, y1: number) => rows(y0, y1);
  return {
    torso: smooth(TORSO), neck: poly([[-5, 36], [5, 36], [5.6, 53], [-5.6, 53]]), legs, arms, armsBack: [], hands, feet, extra,
    head: { x: 0, y: 0, s: 1, r: 0 }, hand: lean ? [-27, 131] : [27, 131], bust: 79, shoulder: 54,
    bands: {
      lounge: [
        { on: 'torso', poly: [[-999, 65], [-14, 57.5], [6, 52], [999, 49], [999, 116], [-999, 116]], cloth: 'tee' },
        { on: 'armR', poly: B(-999, 71), cloth: 'tee' }, { on: 'armL', poly: B(63.5, 77.5), cloth: 'tee' },
        { on: 'torso', poly: B(113, 999), cloth: 'denim' }, { on: 'legs', poly: [[-999, 0], [999, 0], [999, 135], [-999, 137]], cloth: 'denim' },
      ],
      tank: [
        { on: 'torso', poly: [[-999, 62], [-13, 60], [-8, 68], [0, 71.5], [8, 68], [13, 60], [999, 62], [999, 97], [-999, 97]], cloth: 'tank' },
        { on: 'torso', poly: B(114, 999), cloth: 'sweat' }, { on: 'legs', poly: B(-999, 133), cloth: 'sweat' },
      ],
      hoodie: [{ on: 'torso', poly: B(49, 999), cloth: 'hoodie' }, { on: 'legs', poly: B(-999, 142), cloth: 'hoodie' }, { on: 'arms', poly: B(-999, 126), cloth: 'hoodie' }],
      bighoodie: [{ on: 'torso', poly: B(49, 999), cloth: 'gamer' }, { on: 'legs', poly: B(-999, 150), cloth: 'gamer' }, { on: 'arms', poly: B(-999, 999), cloth: 'gamer' }],
      pajama: [{ on: 'torso', poly: [[-999, 51], [-7, 51], [0, 73], [7, 51], [999, 51], [999, 999], [-999, 999]], cloth: 'shirt' }, { on: 'legs', poly: B(-999, 152), cloth: 'shirt' }, { on: 'arms', poly: B(-999, 97), cloth: 'shirt' }],
      towel: [{ on: 'torso', poly: [[-999, 70], [-10, 66], [10, 66], [999, 70], [999, 999], [-999, 999]], cloth: 'towel' }, { on: 'legs', poly: [[-999, 0], [999, 0], [999, 138], [-999, 143]], cloth: 'towel' }],
      blouse: [{ on: 'torso', poly: [[-999, 53], [-7, 53], [0, 67], [7, 53], [999, 53], [999, 117], [-999, 117]], cloth: 'blouse' }, { on: 'torso', poly: B(113, 999), cloth: 'skirt' }, { on: 'legs', poly: B(-999, 164), cloth: 'skirt' }, { on: 'arms', poly: B(-999, 104), cloth: 'blouse' }],
      sweater: [{ on: 'torso', poly: B(49, 999), cloth: 'knit' }, { on: 'legs', poly: B(-999, 140), cloth: 'knit' }, { on: 'arms', poly: B(-999, 124), cloth: 'knit' }],
      yoga: [{ on: 'torso', poly: [[-999, 60], [-12, 58], [0, 64], [12, 58], [999, 60], [999, 94], [-999, 94]], cloth: 'yogatop' }, { on: 'torso', poly: B(112, 999), cloth: 'legging' }, { on: 'legs', poly: B(-999, 222), cloth: 'legging' }],
      fury: [{ on: 'torso', poly: B(52, 999), cloth: 'fury' }, { on: 'legs', poly: B(-999, 138), cloth: 'fury' }, { on: 'arms', poly: B(-999, 78), cloth: 'fury' }],
      cathoodie: [{ on: 'torso', poly: B(49, 999), cloth: 'cat' }, { on: 'legs', poly: B(-999, 142), cloth: 'cat' }, { on: 'arms', poly: B(-999, 126), cloth: 'cat' }],
      pjset: [{ on: 'torso', poly: [[-999, 51], [-7, 51], [0, 72], [7, 51], [999, 51], [999, 116], [-999, 116]], cloth: 'satin' }, { on: 'torso', poly: B(114, 999), cloth: 'satin' }, { on: 'legs', poly: B(-999, 136), cloth: 'satin' }, { on: 'arms', poly: B(-999, 82), cloth: 'satin' }],
    },
  };
}

const B2 = (a: number, b: number) => rows(a, b);

// Leaning into your face from the right (the questions, #65): bent forward at the waist, seen from the chest up;
// the body runs off the bottom right. Drawn upright here and turned by PEEK_LEAN in drawHerPeek; the head turns
// back about the chin (PEEK_HEAD), so she tilts her head without breaking her neck.
// Poses: 0 a finger on her lips (shh), 1 twirling her hair, 2 her chin on her fist.
const PEEK_HEAD = 0.42;
function peekGeo(pose: number): Geo {
  const T: Pt[] = [[-6, 49], [-17, 52], [-26, 56], [-29, 64], [-28.5, 76], [-25, 87], [-18, 99], [-19.5, 106], [-29, 114], [-33, 124], [-34, 150], [-30, 200], [0, 206], [30, 200], [34, 150], [33, 124], [29, 114], [19.5, 106], [18, 99], [25, 87], [28.5, 76], [29, 64], [26, 56], [17, 52], [6, 49]];
  const toChin = smooth([[-24, 55], [-32, 59], [-35, 70], [-35, 83], [-31, 94], [-23, 98], [-15, 94], [-8, 82], [-3, 68], [1, 55], [-7, 49], [-12, 60], [-17, 73], [-22, 82], [-26, 79], [-28, 70], [-27, 62]]);
  const twirl = smooth([[25, 55], [33, 57], [40, 48], [42, 38], [38, 30], [32, 24], [26, 22], [24, 27], [30, 31], [34, 38], [33, 48], [27, 60]]);
  const twirlHand = smooth([[21, 23], [25, 17], [31, 19], [31, 26], [25, 29]]);
  const arms = pose === 1 ? [smooth(ARM_L), twirl] : [toChin, smooth(mirror(ARM_L))];
  const hands = pose === 1 ? [smooth(HAND_L), twirlHand] : [smooth(mirror(HAND_L))];
  // the fist under her chin, drawn over the face in head space: pose 0 raises the index finger to her lips
  const front = pose === 1 ? undefined : (c: CanvasRenderingContext2D) => {
    const ln = { color: C.line, w: LW };
    c.save(); c.translate(40 * Math.sin(PEEK_HEAD), 40 - 40 * Math.cos(PEEK_HEAD)); c.rotate(PEEK_HEAD);
    if (pose === 0) {
      cel(c, smooth([[-1.3, 45], [-1.5, 37.4], [-0.5, 35.5], [0.9, 35.6], [1.6, 37.4], [1.5, 45]]), C.skin, C.skinS, 0.4, ln);
      c.fillStyle = C.nail; c.fillRect(-0.6, 35.9, 1.4, 1.1);
    }
    cel(c, smooth([[-4.8, 45.5], [-3.2, 42.8], [1.8, 42.6], [4.6, 44.8], [4.8, 49.2], [2.6, 52.4], [-2.6, 52.6], [-5, 49.8]]), C.skin, C.skinS, 0.6, ln);
    c.strokeStyle = C.skinD; c.lineWidth = 0.5; c.beginPath();
    for (const y of [46, 48.6]) { c.moveTo(-3.6, y); c.lineTo(3.2, y + 0.3); }   // curled fingers
    c.stroke(); c.restore();
  };
  // the off-shoulder tee: the sleeve sits low on the near arm and up on the other one
  const sleeve0 = pose === 1 ? B2(63, 77) : [[-999, 63], [-23, 63], [-23, 77], [-999, 77]];
  const sleeve1 = pose === 1 ? B2(9999, 9999) : B2(-999, 71);   // the raised arm is the bare shoulder
  return {
    torso: smooth(T), neck: poly([[-5, 36], [5, 36], [5.6, 52], [-5.6, 52]]), legs: [], arms, armsBack: [], hands, feet: [], front,
    head: { x: 40 * Math.sin(PEEK_HEAD), y: 40 - 40 * Math.cos(PEEK_HEAD), s: 1, r: PEEK_HEAD }, hand: [0, 0], bust: 77, shoulder: 54,
    bands: {
      lounge: [
        { on: 'torso', poly: [[-999, 66], [-15, 57.5], [6, 52], [999, 49], [999, 101], [-999, 103]], cloth: 'tee' },
        { on: 'armL', poly: sleeve0, cloth: 'tee' }, { on: 'armR', poly: sleeve1, cloth: 'tee' },
        { on: 'torso', poly: B2(111, 999), cloth: 'denim' },
      ],
      tank: [
        { on: 'torso', poly: [[-999, 62], [-14, 60], [-8, 68], [0, 71.5], [8, 68], [14, 60], [999, 62], [999, 93], [-999, 93]], cloth: 'tank' },
        { on: 'torso', poly: B2(110, 999), cloth: 'sweat' },
      ],
      hoodie: [{ on: 'torso', poly: B2(49, 999), cloth: 'hoodie' }, { on: 'arms', poly: B2(-999, 999), cloth: 'hoodie' }],
      bighoodie: [{ on: 'torso', poly: B2(49, 999), cloth: 'gamer' }, { on: 'arms', poly: B2(-999, 999), cloth: 'gamer' }],
      pajama: [{ on: 'torso', poly: [[-999, 51], [-7, 51], [0, 76], [7, 51], [999, 51], [999, 999], [-999, 999]], cloth: 'shirt' }, { on: 'arms', poly: B2(-999, 999), cloth: 'shirt' }],
      towel: [{ on: 'torso', poly: [[-999, 70], [-10, 66], [10, 66], [999, 70], [999, 999], [-999, 999]], cloth: 'towel' }],
      blouse: [{ on: 'torso', poly: [[-999, 53], [-7, 53], [0, 67], [7, 53], [999, 53], [999, 999], [-999, 999]], cloth: 'blouse' }, { on: 'arms', poly: B2(-999, 999), cloth: 'blouse' }],
      sweater: [{ on: 'torso', poly: B2(49, 999), cloth: 'knit' }, { on: 'arms', poly: B2(-999, 999), cloth: 'knit' }],
      yoga: [{ on: 'torso', poly: [[-999, 60], [-12, 58], [0, 64], [12, 58], [999, 60], [999, 92], [-999, 92]], cloth: 'yogatop' }, { on: 'torso', poly: B2(110, 999), cloth: 'legging' }],
      fury: [{ on: 'torso', poly: B2(52, 999), cloth: 'fury' }, { on: 'armL', poly: B2(-999, 76), cloth: 'fury' }, { on: 'armR', poly: B2(-999, 76), cloth: 'fury' }],
      cathoodie: [{ on: 'torso', poly: B2(49, 999), cloth: 'cat' }, { on: 'arms', poly: B2(-999, 999), cloth: 'cat' }],
      pjset: [{ on: 'torso', poly: [[-999, 51], [-7, 51], [0, 74], [7, 51], [999, 51], [999, 999], [-999, 999]], cloth: 'satin' }, { on: 'arms', poly: B2(-999, 84), cloth: 'satin' }],
    },
  };
}

function band(c: CanvasRenderingContext2D, clipPath: Path2D, bandPoly: number[][], cloth: string) {
  const [base, shade] = CLOTH[cloth];
  const bp = poly(bandPoly);
  c.save(); c.clip(clipPath); c.clip(bp);
  c.fillStyle = shade; c.fillRect(-999, -999, 1999, 1999);
  c.save(); c.translate(-1.7, -1.3); c.fillStyle = base; c.fill(clipPath); c.restore();
  if (cloth === 'denim') { c.strokeStyle = '#cbd6ea'; c.lineWidth = 0.5; c.setLineDash([1, 1]); c.stroke(bp); c.setLineDash([]); }
  c.strokeStyle = C.line; c.lineWidth = LW; c.stroke(bp);      // seams / hems
  c.restore();
}

function figure(c: CanvasRenderingContext2D, g: Geo, o: HerOpts & { outfit: Outfit }) {
  const ln = { color: C.line, w: LW };
  const headAt = () => { c.save(); c.translate(g.head.x, g.head.y); c.rotate(g.head.r); };
  headAt(); head(c, o, false); c.restore();
  const hood = o.outfit === 'hoodie' ? 'hoodie' : o.outfit === 'bighoodie' ? 'gamer' : o.outfit === 'cathoodie' ? 'cat' : '';
  if (hood) { const cl = CLOTH[hood]; cel(c, smooth([[-21, 47], [-25, 40], [-14, 38], [0, 44], [14, 38], [25, 40], [21, 47], [0, 53]]), cl[0], cl[1], 1, ln); }
  const sleeve = hood || (o.outfit === 'pajama' ? 'shirt' : o.outfit === 'sweater' ? 'knit' : '');
  for (const a of g.armsBack) { cel(c, a, C.skin, C.skinS, 1, ln); if (sleeve) band(c, a, rows(-999, 999), sleeve); }
  const bands = g.bands[o.outfit];
  const feet = o.feet ?? 'bare', sock = feet === 'bare' ? '' : feet === 'slippers' ? 'slipper' : feet === 'socks' ? 'sock' : feet;
  for (const f of g.feet) {
    if (feet === 'fluffy') { c.save(); c.translate(0, -0.6); c.scale(1.08, 1.06); cel(c, f, CLOTH.fluffy[0], CLOTH.fluffy[1], 0.8, ln); c.restore(); }   // fluffy: a little bigger
    else cel(c, f, sock ? CLOTH[sock][0] : C.skin, sock ? CLOTH[sock][1] : C.skinS, 0.8, ln);
    if (feet === 'slippers') { c.save(); c.clip(f); c.fillStyle = '#3a2840'; c.fillRect(-999, 238, 1999, 4); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-999, 226, 1999, 1.2); c.restore(); }   // the sole, the band
  }
  // toes: nails + separations on the bare feet
  if (g.feet.length && feet === 'bare') {
    const toes = (cx: number, dir: number) => {
      for (let i = 0; i < 4; i++) { const x = cx + dir * i * 2.1; c.fillStyle = C.nail; c.fillRect(x - 0.7, 237.4, 1.5, 1.2); if (i) { c.strokeStyle = C.skinS; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x + dir * 1.05, 236); c.lineTo(x + dir * 1.05, 239.4); c.stroke(); } }
    };
    toes(-7.2, -1); if (g.feet.length > 1) toes(7.2, 1);
  }
  g.legs.forEach((l, i) => {
    cel(c, l, C.skin, C.skinS, 1.2, ln);
    for (const b of bands) if (b.on === 'legs' || (b.on === 'legL' && i === 0) || (b.on === 'legR' && i === 1)) band(c, l, b.poly, b.cloth);
    if (feet === 'knee') { band(c, l, rows(172, 999), 'knee'); c.save(); c.clip(l); c.fillStyle = '#d6607a'; c.fillRect(-999, 175, 1999, 1.4); c.fillRect(-999, 178, 1999, 1.4); c.restore(); }   // knee socks, two stripes
    else if (feet === 'socks' || feet === 'fluffy') band(c, l, rows(feet === 'fluffy' ? 210 : 214, 999), feet === 'fluffy' ? 'fluffy' : 'sock');
    if (i === 0 && g.extra && !g.feet.length) g.extra(c);
  });
  if (g.extra && g.feet.length) g.extra(c);
  c.fillStyle = C.skinS; c.fill(g.neck);
  c.save(); c.translate(-1, 0); c.fillStyle = C.skin; c.fill(poly([[-5, 41], [4, 41], [4.6, 53], [-5.6, 53]])); c.restore();
  cel(c, g.torso, C.skin, C.skinS, 1.2, ln);
  // collarbones + navel
  c.strokeStyle = C.skinS; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-3, 53.5); c.quadraticCurveTo(-11, 56.5, -19, 56); c.moveTo(3, 53.5); c.quadraticCurveTo(11, 56.5, 19, 56); c.moveTo(0, 105.5); c.lineTo(0, 107.5); c.stroke();
  for (const b of bands) if (b.on === 'torso') band(c, g.torso, b.poly, b.cloth);
  // bust: cel-shaded volume in whatever covers the chest
  const cover = bands.find(b => b.on === 'torso' && Math.min(...b.poly.map(p => p[1])) < g.bust - 4 && Math.max(...b.poly.map(p => p[1])) > g.bust + 6);
  const [bBase, bShade] = cover ? CLOTH[cover.cloth] : [C.skin, C.skinS];
  c.save(); c.clip(g.torso);
  for (const sx of [-1, 1]) {
    c.globalAlpha = 0.75; c.fillStyle = bShade; c.beginPath(); c.ellipse(sx * 9, g.bust + 1.5, 9, 5.2, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.fillStyle = bBase; c.beginPath(); c.ellipse(sx * 9 - 1, g.bust - 0.8, 8.4, 4.6, 0, 0, Math.PI * 2); c.fill();
    if (!cover || ['tee', 'blouse', 'towel', 'shirt'].includes(cover.cloth)) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(sx * 9 - 3, g.bust - 3, 3, 1.4, -0.3, 0, Math.PI * 2); c.fill(); }   // a sheen only on light cloth: on darker colours the dither made it two dots
  }
  c.fillStyle = bShade; c.fillRect(-0.5, g.bust - 3, 1, 5);
  c.restore();
  if (o.outfit === 'tank') { c.strokeStyle = CLOTH.tank[0]; c.lineWidth = 2; c.beginPath(); c.moveTo(-13, 61); c.lineTo(-12, 53); c.moveTo(13, 61); c.lineTo(12, 53); c.stroke(); }
  if (o.outfit === 'bighoodie') { c.fillStyle = '#6ef06e'; c.fillRect(-6, 74, 12, 3); c.fillStyle = '#c8ffc8'; c.fillRect(-4, 75, 3, 1); }   // a guild logo on your hoodie
  if (o.outfit === 'hoodie') { c.strokeStyle = '#fff'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3.5, 53); c.lineTo(-4.5, 70); c.moveTo(3.5, 53); c.lineTo(4.5, 68); c.stroke(); }
  if (o.outfit === 'pajama') { c.fillStyle = '#7f98b8'; for (let y = 80; y < 150; y += 12) c.fillRect(-0.5, y, 1.2, 1.2); }
  if (o.outfit === 'pjset') { c.fillStyle = '#f2efdc'; for (let y = 78; y < 116; y += 10) c.fillRect(-0.5, y, 1.2, 1.2); c.strokeStyle = '#efe6ff'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-7, 51); c.lineTo(0, 72); c.lineTo(7, 51); c.stroke(); }   // buttons, piping
  if (o.outfit === 'blouse') { c.fillStyle = '#c9bfb9'; for (let y = 72; y < 112; y += 9) c.fillRect(-0.5, y, 1.1, 1.1); }   // the buttons, the collar undone
  if (o.outfit === 'sweater') { c.strokeStyle = 'rgba(140,118,86,.55)'; c.lineWidth = 0.5; c.beginPath(); for (let x = -18; x <= 18; x += 4) { c.moveTo(x, 60); c.lineTo(x, 130); } c.stroke(); }   // the knit's ribs
  if (o.outfit === 'fury') { c.fillStyle = '#7cc21f'; c.fillRect(-6, 74, 12, 9); c.fillStyle = '#f1a934'; c.fillRect(-4, 76, 2, 2); c.fillRect(2, 76, 2, 2); c.fillStyle = '#2a2630'; c.fillRect(-3, 80, 6, 1.2); c.fillStyle = '#7cc21f'; c.fillRect(-7, 85, 14, 1.4); }   // Goblin Fury: the goblin, the title bar
  if (o.outfit === 'cathoodie') { c.strokeStyle = '#fff'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3.5, 53); c.lineTo(-4.5, 70); c.moveTo(3.5, 53); c.lineTo(4.5, 68); c.stroke(); c.fillStyle = '#ee6688'; c.fillRect(-9, 96, 18, 8); }   // strings, the pocket
  if (o.outfit === 'towel') {
    c.fillStyle = CLOTH.towel[1]; c.fill(poly([[13, 68], [20, 70], [16, 83]]));
    c.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y] of [[-14, 59], [12, 56], [-4, 64], [19, 63], [-21, 66]]) c.fillRect(x, y, 1, 1.4);
  }
  g.arms.forEach((a, i) => {
    cel(c, a, C.skin, C.skinS, 1, ln);
    for (const b of bands) if (b.on === 'arms' || (b.on === 'armL' && i === 0) || (b.on === 'armR' && i === 1)) band(c, a, b.poly, b.cloth);
  });
  for (const h of g.hands) o.outfit === 'bighoodie' ? cel(c, h, CLOTH.gamer[0], CLOTH.gamer[1], 0.6, ln) : o.outfit === 'sweater' ? cel(c, h, CLOTH.knit[0], CLOTH.knit[1], 0.6, ln) : cel(c, h, C.skin, C.skinS, 0.6, ln);   // sleeves past her hands
  const item = o.item ?? 'none';
  if (item !== 'none') {
    const [x, y] = g.hand;
    if (item === 'mug') { c.fillStyle = '#e8657f'; c.fillRect(x - 4, y - 7, 8, 9); c.strokeStyle = C.line; c.lineWidth = LW; c.strokeRect(x - 4, y - 7, 8, 9); c.fillStyle = '#fff'; c.fillRect(x - 2, y - 4, 3, 2); }
    if (item === 'phone') { c.fillStyle = '#1d2230'; c.fillRect(x - 2.5, y - 9, 5, 10); c.fillStyle = '#8fc0ff'; c.fillRect(x - 1.6, y - 8, 3.2, 7); }
    if (item === 'plate') { c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(x, y - 4, 13, 4, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = C.line; c.lineWidth = LW; c.stroke(); c.fillStyle = '#d9a35a'; c.fillRect(x - 7, y - 10, 14, 5); c.fillStyle = '#7cc46a'; c.fillRect(x - 7, y - 11, 14, 1.6); c.fillStyle = '#e8d2a6'; c.fillRect(x - 7, y - 13, 14, 2.4); }
    if (item === 'remote') { c.fillStyle = '#2c2c34'; c.fillRect(x - 1.8, y - 10, 3.6, 13); c.fillStyle = '#e0524a'; c.fillRect(x - 0.8, y - 8.6, 1.6, 1.4); }
  }
  headAt(); head(c, o, true); locks(c, o.outfit, false); c.restore();
  if (g.front) g.front(c);
}

// ---------------------------------------------------------------- public: standing / leaning (door)
const S_W = 100, S_TOP = 24, S_H = 270;
/** Draws her standing with the head top at (x, y). s = output scale, px = pixel size. */
export function drawHer(c: CanvasRenderingContext2D, x: number, y: number, s: number, o: HerOpts, px = 1) {
  const ls = s / px;
  const w = Math.ceil(S_W * ls) + 4, h = Math.ceil(S_H * ls) + 4;
  const ox = (S_W / 2) * ls + 2, oy = S_TOP * ls + 2;
  const key = `her:${o.pose ?? 'stand'}:${o.outfit}:${o.face}:${o.item ?? 'none'}:${o.blink ? 1 : 0}:${o.feet ?? 'bare'}:${ls.toFixed(3)}`;
  const sp = pixelSprite(key, w, h, cc => { LW = 0.9 / ls; cc.translate(ox, oy); cc.scale(ls, ls); figure(cc, standGeo(o.pose === 'lean'), { ...o, outfit: o.outfit }); });
  blit(c, sp, x - ox * px, y - oy * px, px);
}

/** Her leaning into your face from the right (the questions, #65), over the whole stage. The top of her head is at
 *  (x, y) in stage px; her body runs off the bottom right. Pixel size 3. */
export const PEEK_LEAN = -0.75;
export function drawHerPeek(c: CanvasRenderingContext2D, o: HerOpts, pose: number, x: number, y: number, alpha = 1) {
  const px = 3, s = 1.75, W = 270, H = 260, ax = 40, ay = 40;
  const key = `peek:${o.outfit}:${o.face}:${o.blink ? 1 : 0}:${pose}`;
  const sp = pixelSprite(key, W, H, cc => { LW = 0.9 / s; cc.translate(ax, ay); cc.rotate(PEEK_LEAN); cc.scale(s, s); figure(cc, peekGeo(pose), { ...o, item: 'none' }); });
  blit(c, sp, x - ax * px, y - ay * px, px, alpha);
}

/** Her from behind (through the crack: at the kitchen counter). Head top at (x, y), s = output scale.
 *  One small pose: long hair over her back, arms forward at the counter, bare legs and heels. */
const BACK_TOP: Record<Outfit, string> = { lounge: 'tee', hoodie: 'hoodie', tank: 'tank', bighoodie: 'gamer', pajama: 'shirt', towel: 'towel', blouse: 'blouse', sweater: 'knit', yoga: 'yogatop', fury: 'fury', cathoodie: 'cat', pjset: 'satin' };
export function drawHerBack(c: CanvasRenderingContext2D, x: number, y: number, s: number, outfit: Outfit) {
  const W = Math.ceil(70 * s) + 4, H = Math.ceil(240 * s) + 4, ox = 35 * s + 2, oy = 6 * s + 2;
  const sp = pixelSprite(`herback:${outfit}:${s.toFixed(3)}`, W, H, cc => {
    LW = 0.9 / s; cc.translate(ox, oy); cc.scale(s, s);
    const [cb, cs] = CLOTH[BACK_TOP[outfit]];
    const long = outfit === 'hoodie' || outfit === 'bighoodie' || outfit === 'sweater' || outfit === 'cathoodie';
    for (const k of [-1, 1]) {   // legs, bare, a little apart; heels lifted off the floor
      cel(cc, smooth([[k * 4, 140], [k * 13, 140], [k * 12.5, 182], [k * 10.5, 222], [k * 9, 228, 1], [k * 4.5, 228, 1], [k * 4.5, 200], [k * 3.5, 170]]), C.skin, C.skinS, 1);
      cel(cc, smooth([[k * 4.5, 224], [k * 10, 224], [k * 9.5, 231, 1], [k * 5, 231, 1]]), C.sole, C.skinS, 0.6);
    }
    cel(cc, smooth([[-18, 44], [-21, 70], [-19, 100], [-17, long ? 150 : 128], [0, long ? 152 : 130], [17, long ? 150 : 128], [19, 100], [21, 70], [18, 44], [0, 40]]), cb, cs, 1);   // top
    for (const k of [-1, 1]) cel(cc, smooth([[k * 17, 46], [k * 24, 58], [k * 24, 92, 1], [k * 19, 94], [k * 18, 60]]), long ? cb : C.skin, long ? cs : C.skinS, 1);   // upper arms, forearms on the counter
    cel(cc, smooth([[-12, 6], [-14, 28], [-11, 44], [0, 46], [11, 44], [14, 28], [12, 6], [0, -2]]), C.skin, C.skinS, 1);   // neck and head under the hair
    cel(cc, smooth(BACK_HAIR.map(([px, py, k]) => [px * 0.95, py * 1.05 + 1, k ?? 0] as Pt)), C.hair, C.hairS, 1);
    cc.fillStyle = '#e65a80'; cc.fill(smooth([[9, 6], [14, 3.5], [15, 7.5], [10.5, 9]]));   // the pink clip
  });
  blit(c, sp, x - ox, y - oy, 1);
}

/** Blurry shape behind frosted glass (peek during her shower). */
export function drawHerFrosted(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.save();
  c.filter = 'brightness(.75) sepia(.6) blur(3px)';
  c.globalAlpha = 0.55;
  drawHer(c, x, y, s, { outfit: 'towel', face: 'neutral', pose: 'stand' });
  c.restore();
}

// What she wears by what she was doing (fan-service 3, #90): the outfit tells you where she has been. The rules on top
// (home from work, getting ready for bed, her gifts) are systems/wardrobe.ts herLook; draw with that, not this table.
export const OUTFIT_BY_ACTIVITY: Record<string, { outfit: Outfit; item: Item; feet?: Feet }> = {
  tv: { outfit: 'sweater', item: 'remote', feet: 'socks' },     // on the couch: a knit sweater
  tea: { outfit: 'bighoodie', item: 'mug', feet: 'slippers' },  // in the kitchen: your hoodie, bare legs
  toilet: { outfit: 'lounge', item: 'none' },                   // anything else: the cream wide-neck tee and the pink clip
  phone: { outfit: 'lounge', item: 'phone' },
  shower: { outfit: 'towel', item: 'none' },
  bath: { outfit: 'towel', item: 'none' },
  yoga: { outfit: 'yoga', item: 'none' },                       // Tuesday's yoga (lean in, #77)
  sleep: { outfit: 'pajama', item: 'none' },
  night: { outfit: 'bighoodie', item: 'none', feet: 'slippers' },   // the walk-by, come to bed: your gaming hoodie
};

/** The shower panel (docs/design/eye-candy.md, #22): a frosted glass cabin with her silhouette, water and steam.
 *  fog 0..1 thickens through the shower; clear 0..1 is the glass clearing bottom-up once the water stops.
 *  Under the blur she wears the towel outfit, so the silhouette is suggestive only, never more. 176 x 176. */
export function drawShowerPanel(c: CanvasRenderingContext2D, t: number, fog: number, clear: number) {
  const W = 176, H = 176, gx = 34, gy = 16, gw = 108, gh = 146;
  c.clearRect(0, 0, W, H);
  // wall tiles and floor
  c.fillStyle = '#cfe3ea'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(120,150,165,.35)'; c.lineWidth = 1;
  for (let y = 0; y < H; y += 14) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke(); }
  for (let x = 0; x < W; x += 14) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); c.stroke(); }
  c.fillStyle = '#9fb7c4'; c.fillRect(0, gy + gh, W, H - gy - gh);
  // inside the cabin: darker, steamy
  c.fillStyle = '#aac4cf'; c.fillRect(gx, gy, gw, gh);
  const water = clear <= 0;
  // her silhouette: sways, shifts her weight
  const sway = Math.sin(t * 0.9) * 4, bob = Math.sin(t * 1.8) * 1.2, sx = gx + gw / 2 - 4 + sway, sy = gy + 10 + bob;   // sx: her centre
  const figure = (blur: number, alpha: number) => {
    c.save(); c.beginPath(); c.rect(gx, gy, gw, gh); c.clip();
    c.filter = `blur(${blur}px) saturate(.8)`; c.globalAlpha = alpha;
    drawHer(c, sx, sy, 0.78, { outfit: 'towel', face: 'neutral', pose: 'stand' });
    c.restore();
  };
  figure(4.5, 0.75);
  // water from the shower head
  c.fillStyle = '#e8eef2'; c.fillRect(gx + gw / 2 - 10, gy - 6, 20, 5);
  if (water) {
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const x = gx + gw / 2 - 18 + ((i * 37) % 36), y0 = gy + ((t * 160 + i * 23) % gh);
      c.beginPath(); c.moveTo(x + 0.5, y0); c.lineTo(x + 0.5, Math.min(gy + gh, y0 + 10)); c.stroke();
    }
  }
  // fog on the glass, thickening; clearing from the bottom once the water stops
  const clearH = gh * clear;
  c.fillStyle = `rgba(245,250,252,${(0.28 + 0.6 * fog).toFixed(2)})`; c.fillRect(gx, gy, gw, gh - clearH);
  if (clearH > 0) {
    c.fillStyle = 'rgba(245,250,252,.12)'; c.fillRect(gx, gy + gh - clearH, gw, clearH);
    c.save(); c.beginPath(); c.rect(gx, gy + gh - clearH, gw, clearH); c.clip(); figure(1.6, 0.9); c.restore();
    c.fillStyle = 'rgba(245,250,252,.15)'; c.fillRect(gx, gy + gh - clearH, gw, clearH);
  }
  // steam puffs above the cabin
  for (let i = 0; i < 4; i++) {
    const k = ((t * 0.25 + i * 0.27) % 1), r = 8 + k * 14;
    c.fillStyle = `rgba(255,255,255,${(0.35 * (1 - k) * (water ? 1 : 0.4)).toFixed(2)})`;
    c.beginPath(); c.arc(gx + 20 + i * 24 + Math.sin(t + i) * 4, gy + 10 - k * 18, r, 0, Math.PI * 2); c.fill();
  }
  // drips on the glass
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1;
  for (let i = 0; i < 6; i++) { const x = gx + 8 + i * 17, y = gy + 20 + ((t * 9 + i * 31) % (gh - 40)); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6); c.stroke(); }
  // chrome frame
  c.strokeStyle = '#eef3f6'; c.lineWidth = 3; c.strokeRect(gx, gy, gw, gh);
  c.strokeStyle = '#8fa2ad'; c.lineWidth = 1; c.strokeRect(gx - 1.5, gy - 1.5, gw + 3, gh + 3);
  c.fillStyle = '#eef3f6'; c.fillRect(gx + gw - 8, gy + gh / 2 - 12, 3, 24);   // handle
}

// Test hook: test/her_screens.py draws her model sheets (every outfit, every face) with the game's own code.
if (typeof window !== 'undefined') (window as unknown as { __lnHer: unknown }).__lnHer = { drawHer, drawHerBack, drawHerFrosted, drawHerPeek, drawShowerPanel, OUTFIT_BY_ACTIVITY };
