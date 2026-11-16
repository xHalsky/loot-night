// Her: pixel-anime figure (docs/design/her.md). Vector shapes rendered through ui/pixel.ts
// at low resolution (hard edges, 1px outline, nearest-neighbour upscale). Poses: standing at the door,
// leaning on the frame (barefoot, one foot against her calf), sitting on your desk in first person (thighs up),
// and asleep in bed seen from the foot end (bare soles out from under the blanket).
import { pixelSprite, blit, smooth, poly, mirror, rows, cel, type Pt } from './pixel';

export type Outfit = 'lounge' | 'towel' | 'hoodie' | 'pajama' | 'tank';
export type Face = 'smile' | 'neutral' | 'angry' | 'pout' | 'blush' | 'sleepy' | 'suspicious' | 'wink' | 'surprised' | 'furious';
export type Item = 'none' | 'mug' | 'phone' | 'remote' | 'plate';
export interface HerOpts { outfit: Outfit; face: Face; pose?: 'stand' | 'lean'; item?: Item; blink?: boolean }

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
  hoodie: ['#b8a4e2', '#8b77bf'], shirt: ['#d3e3f4', '#a5bfdb'], towel: ['#f7f4ef', '#d9d2c6'],
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
      pajama: [{ on: 'torso', poly: [[-999, 51], [-7, 51], [0, 73], [7, 51], [999, 51], [999, 999], [-999, 999]], cloth: 'shirt' }, { on: 'legs', poly: B(-999, 152), cloth: 'shirt' }, { on: 'arms', poly: B(-999, 97), cloth: 'shirt' }],
      towel: [{ on: 'torso', poly: [[-999, 70], [-10, 66], [10, 66], [999, 70], [999, 999], [-999, 999]], cloth: 'towel' }, { on: 'legs', poly: [[-999, 0], [999, 0], [999, 138], [-999, 143]], cloth: 'towel' }],
    },
  };
}

// First person: she sits on the desk right in front of you, legs crossed, framed from the thighs up.
// Poses: 0 hands on her crossed knee, 1 twirling her hair, 2 leaning back on her hands.
function lapGeo(pose: number): Geo {
  const T: Pt[] = [[-6, 49], [-17, 52], [-26, 56], [-29, 64], [-28.5, 76], [-25, 87], [-18, 99], [-19.5, 106], [-29, 114], [-34, 121], [0, 126], [34, 121], [29, 114], [19.5, 106], [18, 99], [25, 87], [28.5, 76], [29, 64], [26, 56], [17, 52], [6, 49]];
  // knees together, both legs angled a little to her right: a softer, more flattering line than straight-on
  const thighL: Pt[] = [[-33, 114], [-41, 132], [-50, 160], [-58, 192], [-19, 192], [-13, 162], [-6, 138], [-1.5, 125], [0, 121, 1]];
  const thighR: Pt[] = [[33, 113], [34, 130], [27, 150], [15, 170], [3, 192], [-23, 194], [-15, 168], [-6, 147], [1.5, 130], [1, 121]];
  let arms: Path2D[], hands: Path2D[], armsBack: Path2D[] = [], r = 0;
  if (pose === 0) {
    // hands resting lightly on her thighs
    arms = [smooth([[-24, 55], [-31, 58], [-35.5, 70], [-37, 86], [-36, 102], [-34, 118], [-31, 134], [-25, 134], [-28.5, 118], [-30.5, 102], [-30.5, 86], [-28, 70]]),
      smooth([[24, 55], [31, 58], [35.5, 70], [36.5, 86], [34, 102], [28, 120], [20, 138], [14, 137], [22, 119], [28.5, 102], [30, 86], [28, 70]])];
    hands = [smooth([[-33, 131], [-34, 139], [-30, 145], [-24.5, 144], [-25, 136], [-26, 131]]), smooth([[20.5, 135], [19, 143], [14, 148], [9.5, 146], [12, 139], [14.5, 135]])];
    r = -0.07;
  } else if (pose === 1) {
    arms = [smooth([[-24, 55], [-31, 58], [-37, 70], [-40, 86], [-43, 102], [-45, 114], [-38, 116], [-36, 102], [-33, 86], [-29, 70]]),
      smooth([[25, 55], [33, 57], [41, 48], [43, 36], [37, 26], [28, 18], [21, 17], [19, 23], [28, 30], [35, 38], [34, 48], [27, 62]])];
    hands = [smooth([[-49, 110], [-52, 118], [-44, 121], [-36, 119], [-38, 111]]), smooth([[16, 13], [21, 9], [26, 14], [23, 22], [17, 21]])];
    r = 0.07;
  } else {
    // leaning back on her hands: arms go out and back down to the desk behind her
    armsBack = [smooth([[-25, 55], [-35, 58], [-43, 70], [-49, 88], [-53, 106], [-55, 118], [-47, 120], [-44, 106], [-39, 88], [-32, 72]]),
      smooth([[25, 55], [35, 58], [43, 70], [49, 88], [53, 106], [55, 118], [47, 120], [44, 106], [39, 88], [32, 72]])];
    arms = []; hands = []; r = -0.12;
  }
  const legs = (h: number, _c: number, cloth: string) => [
    { on: 'legL' as const, poly: [[-300, -999], [300, -999], [300, h - 10], [-300, h + 4]], cloth }, { on: 'legR' as const, poly: [[-300, -999], [300, -999], [300, h - 12], [-300, h + 6]], cloth }];
  return {
    torso: smooth(T), neck: poly([[-5, 36], [5, 36], [5.6, 52], [-5.6, 52]]), legs: [smooth(thighL), smooth(thighR)], arms, armsBack, hands, feet: [],
    head: { x: 0, y: 0, s: 1, r }, hand: [-40, 114], bust: 77, shoulder: 54,
    extra: (c) => { c.save(); c.clip(smooth(thighL)); c.fillStyle = 'rgba(120,60,60,.28)'; c.translate(3, 4); c.fill(smooth(thighR)); c.restore(); },   // crossing-leg shadow
    bands: {
      lounge: [
        { on: 'torso', poly: [[-999, 66], [-15, 57.5], [6, 52], [999, 49], [999, 101], [-999, 103]], cloth: 'tee' },
        { on: 'armR', poly: B2(-999, 71), cloth: 'tee' }, { on: 'armL', poly: B2(63, 77), cloth: 'tee' },
        { on: 'torso', poly: B2(111, 999), cloth: 'denim' }, ...legs(140, 110, 'denim'),
      ],
      tank: [
        { on: 'torso', poly: [[-999, 62], [-14, 60], [-8, 68], [0, 71.5], [8, 68], [14, 60], [999, 62], [999, 93], [-999, 93]], cloth: 'tank' },
        { on: 'torso', poly: B2(110, 999), cloth: 'sweat' }, ...legs(130, 106, 'sweat'),
      ],
      hoodie: [{ on: 'torso', poly: B2(49, 999), cloth: 'hoodie' }, ...legs(146, 122, 'hoodie'), { on: 'arms', poly: B2(-999, 118), cloth: 'hoodie' }],
      pajama: [{ on: 'torso', poly: [[-999, 51], [-7, 51], [0, 76], [7, 51], [999, 51], [999, 999], [-999, 999]], cloth: 'shirt' }, ...legs(156, 132, 'shirt'), { on: 'arms', poly: B2(-999, 88), cloth: 'shirt' }],
      towel: [{ on: 'torso', poly: [[-999, 70], [-10, 66], [10, 66], [999, 70], [999, 999], [-999, 999]], cloth: 'towel' }, ...legs(142, 118, 'towel')],
    },
  };
}
const B2 = (a: number, b: number) => rows(a, b);

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
  if (o.outfit === 'hoodie') cel(c, smooth([[-21, 47], [-25, 40], [-14, 38], [0, 44], [14, 38], [25, 40], [21, 47], [0, 53]]), CLOTH.hoodie[0], CLOTH.hoodie[1], 1, ln);
  for (const a of g.armsBack) { cel(c, a, C.skin, C.skinS, 1, ln); if (o.outfit === 'hoodie' || o.outfit === 'pajama') band(c, a, rows(-999, 999), o.outfit === 'hoodie' ? 'hoodie' : 'shirt'); }
  const bands = g.bands[o.outfit];
  for (const f of g.feet) cel(c, f, C.skin, C.skinS, 0.8, ln);
  // toes: nails + separations on the bare feet
  if (g.feet.length) {
    const toes = (cx: number, dir: number) => {
      for (let i = 0; i < 4; i++) { const x = cx + dir * i * 2.1; c.fillStyle = C.nail; c.fillRect(x - 0.7, 237.4, 1.5, 1.2); if (i) { c.strokeStyle = C.skinS; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x + dir * 1.05, 236); c.lineTo(x + dir * 1.05, 239.4); c.stroke(); } }
    };
    toes(-7.2, -1); if (g.feet.length > 1) toes(7.2, 1);
  }
  g.legs.forEach((l, i) => {
    cel(c, l, C.skin, C.skinS, 1.2, ln);
    for (const b of bands) if (b.on === 'legs' || (b.on === 'legL' && i === 0) || (b.on === 'legR' && i === 1)) band(c, l, b.poly, b.cloth);
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
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(sx * 9 - 3, g.bust - 3, 3, 1.4, -0.3, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = bShade; c.fillRect(-0.5, g.bust - 3, 1, 5);
  c.restore();
  if (o.outfit === 'tank') { c.strokeStyle = CLOTH.tank[0]; c.lineWidth = 2; c.beginPath(); c.moveTo(-13, 61); c.lineTo(-12, 53); c.moveTo(13, 61); c.lineTo(12, 53); c.stroke(); }
  if (o.outfit === 'hoodie') { c.strokeStyle = '#fff'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3.5, 53); c.lineTo(-4.5, 70); c.moveTo(3.5, 53); c.lineTo(4.5, 68); c.stroke(); }
  if (o.outfit === 'pajama') { c.fillStyle = '#7f98b8'; for (let y = 80; y < 150; y += 12) c.fillRect(-0.5, y, 1.2, 1.2); }
  if (o.outfit === 'towel') {
    c.fillStyle = CLOTH.towel[1]; c.fill(poly([[13, 68], [20, 70], [16, 83]]));
    c.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y] of [[-14, 59], [12, 56], [-4, 64], [19, 63], [-21, 66]]) c.fillRect(x, y, 1, 1.4);
  }
  g.arms.forEach((a, i) => {
    cel(c, a, C.skin, C.skinS, 1, ln);
    for (const b of bands) if (b.on === 'arms' || (b.on === 'armL' && i === 0) || (b.on === 'armR' && i === 1)) band(c, a, b.poly, b.cloth);
  });
  for (const h of g.hands) cel(c, h, C.skin, C.skinS, 0.6, ln);
  const item = o.item ?? 'none';
  if (item !== 'none') {
    const [x, y] = g.hand;
    if (item === 'mug') { c.fillStyle = '#e8657f'; c.fillRect(x - 4, y - 7, 8, 9); c.strokeStyle = C.line; c.lineWidth = LW; c.strokeRect(x - 4, y - 7, 8, 9); c.fillStyle = '#fff'; c.fillRect(x - 2, y - 4, 3, 2); }
    if (item === 'phone') { c.fillStyle = '#1d2230'; c.fillRect(x - 2.5, y - 9, 5, 10); c.fillStyle = '#8fc0ff'; c.fillRect(x - 1.6, y - 8, 3.2, 7); }
    if (item === 'plate') { c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(x, y - 4, 13, 4, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = C.line; c.lineWidth = LW; c.stroke(); c.fillStyle = '#d9a35a'; c.fillRect(x - 7, y - 10, 14, 5); c.fillStyle = '#7cc46a'; c.fillRect(x - 7, y - 11, 14, 1.6); c.fillStyle = '#e8d2a6'; c.fillRect(x - 7, y - 13, 14, 2.4); }
    if (item === 'remote') { c.fillStyle = '#2c2c34'; c.fillRect(x - 1.8, y - 10, 3.6, 13); c.fillStyle = '#e0524a'; c.fillRect(x - 0.8, y - 8.6, 1.6, 1.4); }
  }
  headAt(); head(c, o, true); locks(c, o.outfit, false); c.restore();
}

// ---------------------------------------------------------------- public: standing / leaning (door)
const S_W = 100, S_TOP = 24, S_H = 270;
/** Draws her standing with the head top at (x, y). s = output scale, px = pixel size. */
export function drawHer(c: CanvasRenderingContext2D, x: number, y: number, s: number, o: HerOpts, px = 1) {
  const ls = s / px;
  const w = Math.ceil(S_W * ls) + 4, h = Math.ceil(S_H * ls) + 4;
  const ox = (S_W / 2) * ls + 2, oy = S_TOP * ls + 2;
  const key = `her:${o.pose ?? 'stand'}:${o.outfit}:${o.face}:${o.item ?? 'none'}:${o.blink ? 1 : 0}:${ls.toFixed(3)}`;
  const sp = pixelSprite(key, w, h, cc => { LW = 0.9 / ls; cc.translate(ox, oy); cc.scale(ls, ls); figure(cc, standGeo(o.pose === 'lean'), { ...o, outfit: o.outfit }); });
  blit(c, sp, x - ox * px, y - oy * px, px);
}

/** First-person view of her sitting on the desk. Fills a 680 x 720 canvas (pixel size 3). */
export function drawHerLap(c: CanvasRenderingContext2D, o: HerOpts, pose: number, dx = 0, dy = 0, alpha = 1) {
  const px = 2, W = 340, H = 360, s = 2.16;
  const key = `lap:${o.outfit}:${o.face}:${o.blink ? 1 : 0}:${pose}`;
  const sp = pixelSprite(key, W, H, cc => { LW = 0.9 / s; cc.translate(170, 10); cc.scale(s, s); figure(cc, lapGeo(pose), { ...o, item: 'none' }); });
  blit(c, sp, dx, dy, px, alpha);
}

/** Morning: asleep in your shirt, seen from the foot of the bed, bare soles out from under the blanket. 480 x 240. */
export function drawHerBed(c: CanvasRenderingContext2D, t: number) {
  const breathe = Math.sin(t * 1.3) > 0 ? 1 : 0;
  const sp = pixelSprite(`bed:${breathe}`, 240, 120, cc => {
    LW = 0.7; cc.scale(1.5, 1.5);
    // room: wall with morning light, bed
    cc.fillStyle = '#e9d3c4'; cc.fillRect(0, 0, 160, 80);
    cc.fillStyle = 'rgba(255,230,170,.55)'; cc.beginPath(); cc.moveTo(98, 0); cc.lineTo(130, 0); cc.lineTo(110, 80); cc.lineTo(74, 80); cc.fill();
    cc.fillStyle = '#8a5a44'; cc.fillRect(18, 6, 124, 14);                                  // headboard
    cc.fillStyle = '#f4efe8'; cc.fillRect(22, 18, 116, 50);                                 // sheet
    cel(cc, smooth([[52, 15], [108, 15], [112, 26], [48, 26]]), '#ffffff', '#dcd6cc', 1, { color: C.line, w: 1 });   // pillow
    // her head on the pillow (sleeping face), hair spread
    cc.save(); cc.translate(80, 6); cc.scale(0.42, 0.42);
    cc.fillStyle = C.hair; cc.fill(smooth([[-34, 10], [-40, 36], [-30, 58], [0, 50], [30, 58], [40, 36], [34, 10], [0, -6]]));
    head(cc, { outfit: 'pajama', face: 'sleepy' }, true);
    cc.restore();
    // blanket: soft mound with folds; one shoulder of your shirt peeking out
    cel(cc, smooth([[24, 30], [60, 24], [100, 24], [136, 30], [140, 52], [134, 66], [26, 66], [20, 52]]), '#9fb7d9', '#7a93bd', 1.5, { color: C.line, w: 1 });
    cc.strokeStyle = '#7a93bd'; cc.lineWidth = 1; cc.beginPath(); cc.moveTo(46, 36 + breathe); cc.quadraticCurveTo(70, 44, 92, 34 + breathe); cc.moveTo(66, 52); cc.quadraticCurveTo(90, 58, 120, 50); cc.stroke();
    cel(cc, smooth([[66, 26], [78, 23], [80, 30], [68, 31]]), CLOTH.shirt[0], CLOTH.shirt[1], 0.5);
    // the feet: soles toward you, toes up, resting on the sheet
    const sole = (cx: number, dir: number) => {
      const p = smooth([[cx - 6.5 * dir, 56], [cx - 7.5 * dir, 62], [cx - 6 * dir, 68], [cx - 4 * dir, 74], [cx, 77.5], [cx + 4 * dir, 75], [cx + 5 * dir, 68], [cx + 6.5 * dir, 61], [cx + 6 * dir, 55]]);
      cel(cc, p, C.sole, C.skinS, 0.8, { color: C.line, w: 1 });
      cc.fillStyle = C.skinH; cc.beginPath(); cc.ellipse(cx - 0.5 * dir, 60, 4, 2.4, 0, 0, Math.PI * 2); cc.fill();       // ball of the foot
      cc.fillStyle = C.skinS; cc.beginPath(); cc.ellipse(cx + 2 * dir, 67, 2.2, 3.4, 0, 0, Math.PI * 2); cc.fill();       // arch
      cc.fillStyle = C.skinH; cc.beginPath(); cc.ellipse(cx, 74, 3, 2.2, 0, 0, Math.PI * 2); cc.fill();                   // heel
      const tx = [-5.2, -2.2, 0.6, 3.2, 5.2], ty = [52.4, 52, 52.6, 53.4, 54.8], tr = [2, 1.6, 1.5, 1.3, 1.1];
      tx.forEach((x, i) => { const xx = cx + x * dir; cc.fillStyle = C.sole; cc.beginPath(); cc.ellipse(xx, ty[i], tr[i], tr[i] * 1.25, 0, 0, Math.PI * 2); cc.fill(); cc.strokeStyle = C.line; cc.lineWidth = 0.6; cc.stroke(); });
    };
    sole(66, -1); sole(90, 1);
  });
  blit(c, sp, 0, 0, 2);
}

/** Blurry shape behind frosted glass (peek during her shower). */
export function drawHerFrosted(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.save();
  c.filter = 'brightness(.75) sepia(.6) blur(3px)';
  c.globalAlpha = 0.55;
  drawHer(c, x, y, s, { outfit: 'towel', face: 'neutral', pose: 'stand' });
  c.restore();
}

export const OUTFIT_BY_ACTIVITY: Record<string, { outfit: Outfit; item: Item }> = {
  tv: { outfit: 'lounge', item: 'remote' },
  tea: { outfit: 'hoodie', item: 'mug' },
  toilet: { outfit: 'tank', item: 'none' },
  phone: { outfit: 'tank', item: 'phone' },
  shower: { outfit: 'towel', item: 'none' },
  sleep: { outfit: 'pajama', item: 'none' },
};
