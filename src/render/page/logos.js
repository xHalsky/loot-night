// ===========================================================================
// LOGOS: the Age of Judgment title logo and the two studio stings (Halsky Labs, Procrastination Studios).
// Halsky Labs' mark is Paweł's logo as a two-tone bitmap (HALSKY_MARK); everything else is drawn.
// Vector type is rasterised crisp at its native size (threshold, no anti-aliasing), then shaded by hand into the
// palette: a chiselled bevel lit from the upper left, a metal gradient on the face, outlines and a drop shadow.
// Everything here writes palette indices to the UI layer (putI), so it is exact; glows go into the lit scene.
// ===========================================================================
const LG_FONTS = { czd: 'cinzel-decorative-latin-900-normal', cz: 'cinzel-latin-900-normal', sync: 'syncopate-latin-700-normal', rock: 'new-rocker-latin-400-normal', unci: 'uncial-antiqua-latin-400-normal' };
let LGC = null, LGX = null; const LGCACHE = new Map();
function lgCtx() { if (!LGC) { LGC = document.createElement('canvas'); LGC.width = 1024; LGC.height = 360; LGX = LGC.getContext('2d', { willReadFrequently: true }); } return LGX; }
const eIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const eBack = (k, s = 1.7) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2;
const lgBay = (x, y) => BAYER8[((y & 7) << 3) | (x & 7)];
// a value 0..1 to a ramp of palette indices, ordered-dithered between neighbours
function rampI(ramp, v, x, y, k = 1) { const n = ramp.length - 1, p = clamp(v) * n, lo = Math.floor(p); let f = p - lo; if (k !== 1) f = clamp((f - 0.5) * k + 0.5); return ramp[Math.min(n, lo + (f > lgBay(x, y) ? 1 : 0))]; }
let LOGO_TEXT = 'JudGMent';   // Cinzel Decorative: its capitals are the swash forms (G, M), its lower case plain capitals

// inside and outside chamfer distances for a padded mask
function maskDist(M) {
  const { w, h, m } = M, din = new Float32Array(w * h), dout = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { din[i] = m[i] ? 99 : 0; dout[i] = m[i] ? 0 : 99; }
  for (const D of [din, dout]) {
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!D[i]) continue; D[i] = Math.min(D[i], D[i - 1] + 1, D[i - w] + 1, D[i - w - 1] + 1.41, D[i - w + 1] + 1.41); }
    for (let y = h - 2; y > 0; y--) for (let x = w - 2; x > 0; x--) { const i = y * w + x; if (!D[i]) continue; D[i] = Math.min(D[i], D[i + 1] + 1, D[i + w] + 1, D[i + w + 1] + 1.41, D[i + w - 1] + 1.41); }
  }
  M.din = din; M.dout = dout; return M;
}
// a string as a mask: pen at (0, baseline); arch lifts the middle of the word by `arch` px (an arc warp)
function typeMask(str, font, o = {}) {
  const ls = o.ls || 0, arch = o.arch || 0, sy = o.sy || 1, key = font + '|' + ls + '|' + arch + '|' + sy + '|' + str;
  let M = LGCACHE.get(key); if (M) return M;
  const g = lgCtx(); g.font = font; g.letterSpacing = ls + 'px'; g.textBaseline = 'alphabetic';
  const mt = g.measureText(str), pad = 6, asc = Math.ceil(mt.actualBoundingBoxAscent * sy), desc = Math.ceil(mt.actualBoundingBoxDescent * sy);
  const left = Math.floor(-mt.actualBoundingBoxLeft), tw = Math.ceil(mt.actualBoundingBoxRight) - left;
  const w = tw + pad * 2, h0 = asc + desc + pad * 2, h = h0 + arch;
  g.clearRect(0, 0, LGC.width, LGC.height); g.fillStyle = '#fff';
  if (sy !== 1) { g.setTransform(1, 0, 0, sy, 0, pad + asc); g.fillText(str, pad - left, 0); g.setTransform(1, 0, 0, 1, 0, 0); } else g.fillText(str, pad - left, pad + asc);
  const d = g.getImageData(0, 0, w, h0).data, m = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) { const q = (x - pad) / Math.max(1, tw) * 2 - 1, sh = arch - Math.round(arch * (1 - q * q)); for (let y = 0; y < h0; y++) if (d[(y * w + x) * 4 + 3] > 120) m[(y + sh) * w + x] = 1; }
  g.font = font; const cap = Math.ceil(g.measureText('H').actualBoundingBoxAscent * sy);
  M = maskDist({ w, h, m, ox: left - pad, oy: -(pad + asc), cap, tw, pad, arch, adv: mt.width - ls });
  LGCACHE.set(key, M); return M;
}
// a mask from a function over a w x h box (cached by key)
function fnMask(key, w, h, fn) { let M = LGCACHE.get(key); if (M) return M; const m = new Uint8Array(w * h); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) m[y * w + x] = fn(x, y) ? 1 : 0; M = maskDist({ w, h, m }); LGCACHE.set(key, M); return M; }

// shade a mask into the UI layer at (x0, y0) = the mask box's top-left
// o: ramp, B (bevel px), face(sx, sy, i) -> 0..1, o1/o2 outline indices, shadow [dx, dy], show(sx, sy) -> false | heat 0..1,
//    gain (multiplies), add(sx, sy) -> extra value (glints), edge(sx, sy, i, M) -> index or null (custom lips)
function shadeMask(M, x0, y0, o) {
  const { w, h, m, din, dout } = M, B = o.B ?? 2, ramp = o.ramp, gain = o.gain ?? 1;
  const ht = (i) => (m[i] ? Math.min(din[i], B + 0.5) : 0);
  if (o.shadow) { const [sdx, sdy] = o.shadow; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (dout[i] > 2.5) continue; const sx = x0 + x + sdx, sy = y0 + y + sdy; if (o.show && o.show(sx - sdx, sy - sdy) === false) continue; if (((sx + sy) & 1) === 0 || o.shadowSolid) putI(sx, sy, P.void); } }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, sx = x0 + x, sy = y0 + y;
    if (!m[i]) { const d = dout[i]; if (d > 2.5 || (d > 1.5 && o.o2 == null) || o.o1 == null) continue; if (o.show && o.show(sx, sy) === false) continue; putI(sx, sy, d <= 1.5 ? o.o1 : o.o2); continue; }
    let heat = 0; if (o.show) { const s = o.show(sx, sy); if (s === false) continue; heat = s || 0; }
    if (o.edge) { const e = o.edge(sx, sy, i, M); if (e != null) { putI(sx, sy, e); continue; } }
    let v = o.face ? o.face(sx, sy, i) : 0.6;
    if (din[i] <= B) { const gx = ht(i + 1) - ht(i - 1), gy = ht(i + w) - ht(i - w), len = Math.hypot(gx, gy); if (len > 0) { const dot = (gx * 0.6 + gy * 0.8) / len; v = lerp(v, 0.5 + 0.52 * dot, o.bevelK ?? 0.78); } }
    else if (o.inline && din[i] > B && din[i] <= B + 1) v *= o.inline;
    v = v * gain + (o.add ? o.add(sx, sy) : 0) + heat;
    putI(sx, sy, rampI(ramp, v, sx, sy));
  }
}

// ---------------------------------------------------------------------------
// AGE OF JUDGMENT: the broken halo (iron, gilt lips, rivets, the crimson spark in its gap) behind "Judgment" in
// carved gilt capitals on a gentle arch, "AGE OF" inside the ring between two gilt rules.
// s = scale (1 = the splash, about 0.5 at the top of the login). o: ring, word, ageOf, sub (0..1 reveals), spark,
// glint (0..1 sweep position or null), flash, heat
// ---------------------------------------------------------------------------
const R_GILT = [P.u1, P.u2, P.u3, P.u4, P.u5, P.u6, P.moon];
const R_IRON = [P.void, P.s1, P.s2, P.s3, P.s4, P.s5, P.s6];
const GAP_AN = -Math.PI / 4, GAP_HW = 0.2;
function aojLogo(cx, cy, s, t, o = {}) {
  const fs = Math.max(18, Math.round(60 * s)), rc = 86 * s, rw = Math.max(4, Math.round(11 * s)), B = s > 0.75 ? 2 : 1;
  const flash = o.flash || 0, ring = o.ring ?? 1, word = o.word ?? 1;
  // ---- the ring
  const RB = Math.ceil(rc + rw / 2 + 4), RS = RB * 2 + 1, rx0 = Math.round(cx) - RB, ry0 = Math.round(cy) - RB;
  const RM = fnMask('ring|' + rc.toFixed(1) + '|' + rw, RS, RS, (x, y) => {
    const dx = x - RB, dy = y - RB, rr = Math.hypot(dx, dy); if (Math.abs(rr - rc) > rw / 2) return false;
    let d = Math.atan2(dy, dx) - GAP_AN; d = Math.atan2(Math.sin(d), Math.cos(d));
    const rag = (hash(Math.round(rr), d > 0 ? 1 : 2, 951) - 0.5) * 0.06;
    return Math.abs(d) > GAP_HW + rag;
  });
  const span = Math.PI * 2 - GAP_HW * 2, ringParam = (sx, sy) => { let a = Math.atan2(sy - cy, sx - cx) - (GAP_AN + GAP_HW); a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return a / span; };
  if (ring > 0) {
    shadeMask(RM, rx0, ry0, {
      ramp: R_IRON, B: Math.max(1, B), o1: P.void, shadow: [Math.round(2 * s) + 1, Math.round(3 * s) + 1], gain: 1 + flash * 0.5,
      show: ring >= 1 ? null : (sx, sy) => { const p = ringParam(sx, sy); if (p > ring) return false; const behind = ring - p; return behind < 0.05 ? 0.7 : 0.45 * Math.exp(-behind / 0.12); },
      face: (sx, sy) => { const an = Math.atan2(sy - cy, sx - cx), tick = s > 0.75 && Math.abs(((an / (Math.PI / 30)) % 1 + 1) % 1 - 0.5) > 0.42 && Math.abs(Math.hypot(sx - cx, sy - cy) - rc) < rw / 2 - 2.2; return 0.26 + 0.16 * Math.cos(an + 2.36) - (tick ? 0.12 : 0); },
      edge: (sx, sy, i, M) => {
        const rr = Math.hypot(sx - cx, sy - cy), an = Math.atan2(sy - cy, sx - cx), lit = Math.cos(an + 2.36);
        if (M.din[i] <= 1.01) { const outer = rr > rc; return rampI(R_GILT, (outer ? 0.45 : 0.62) + 0.3 * lit + flash * 0.3, sx, sy); }
        // rivets every 24 degrees on the centre line
        const k = Math.round(an / (Math.PI / 7.5)), ra = k * Math.PI / 7.5; let dg = ra - GAP_AN; dg = Math.atan2(Math.sin(dg), Math.cos(dg));
        if (Math.abs(dg) > GAP_HW + 0.12) { const px = cx + Math.cos(ra) * rc, py = cy + Math.sin(ra) * rc, d = Math.hypot(sx - px, sy - py); if (d < Math.max(1, 1.6 * s + 0.4)) return (sx - px) + (sy - py) < 0 ? P.u6 : P.u3; }
        return null;
      },
    });
  }
  // ---- the spark in the gap
  const spx = Math.round(cx + Math.cos(GAP_AN) * rc), spy = Math.round(cy + Math.sin(GAP_AN) * rc);
  AOJ.logoSpark = [spx, spy];
  if (o.spark > 0) {
    const k = o.spark, pulse = 0.5 + 0.5 * Math.sin(t * 3.1), sm = Math.max(0.55, s), burst = o.sparkBurst || 0;
    const L = Math.round((5 + 4 * pulse * k + burst * 16) * sm), G = Math.round((6 + 2 * pulse + burst * 10) * sm);
    for (let j = -G; j <= G; j++) for (let i = -G; i <= G; i++) { const d = Math.hypot(i, j); if (d > 2 && d <= G && lgBay(spx + i, spy + j) < 0.42 * (1 - d / G) * k) putI(spx + i, spy + j, d < G * 0.5 ? P.crimson : P.wine); }
    if (burst > 0) { const R = (1 - burst) * 26 * sm + 4; for (let a2 = 0; a2 < 160; a2++) { const an = a2 / 160 * Math.PI * 2, x = Math.round(spx + Math.cos(an) * R), y = Math.round(spy + Math.sin(an) * R); if (lgBay(x, y) < burst) putI(x, y, burst > 0.5 ? P.d6 : P.crimson); } }
    for (let r2 = -L; r2 <= L; r2++) { const a = Math.abs(r2), idx = a <= 1 ? P.moon : a <= L * 0.4 ? P.d6 : P.crimson; if (a > L * 0.75 && ((a + Math.floor(t * 8)) & 1)) continue; putI(spx + r2, spy, idx); putI(spx, spy + r2, idx); }
    const Ld = Math.round(L * 0.4); for (let r2 = 1; r2 <= Ld; r2++) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) putI(spx + dx * r2, spy + dy * r2, r2 <= 1 ? P.d6 : P.crimson);
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) putI(spx + dx, spy + dy, dx || dy ? P.d6 : P.moon);
  }
  // ---- "AGE OF" between two gilt rules, inside the ring's top
  const capW = typeMask(LOGO_TEXT, `${fs}px czd`, { ls: Math.round(fs * 0.03), arch: Math.round(8 * s) });
  const WM = capW, wx0 = Math.round(cx - WM.tw / 2) - WM.pad, by = Math.round(cy + WM.cap / 2), wy0 = by + WM.oy;
  const ayB = Math.round(wy0 + WM.pad - 10 * s - 2);
  if ((o.ageOf ?? 1) > 0) {
    const a = o.ageOf ?? 1, small = fs < 40;
    let aw, mid;
    if (small) { const ti = fadeIdx(a, [P.void, P.u2, P.u4, P.u5, P.u6]); aw = text('AGE OF', cx, ayB - 5, 'tiny', ti, { align: 'c', ls: 2, shadow: P.void }); mid = ayB - 3; }
    else {
      const AM = typeMask('AGE OF', `${Math.round(fs * 0.27)}px cz`, { ls: Math.round(fs * 0.07) }); aw = AM.tw; mid = ayB - Math.round(AM.cap / 2);
      shadeMask(AM, Math.round(cx - AM.tw / 2) - AM.pad, ayB + AM.oy, { ramp: R_GILT, B: 1, o1: P.void, shadow: [1, 1], shadowSolid: true, gain: 0.4 + 0.6 * a, face: (sx, sy) => 0.86 - 0.26 * clamp((sy - (ayB - AM.cap)) / AM.cap) + flash * 0.2, show: a >= 1 ? null : (sx) => (Math.abs(sx - cx) < AM.tw * 0.5 * clamp(a * 1.6) + 2 ? 0 : false) });
    }
    const ruleL = Math.round((small ? 12 : 30 * s) * eIO(clamp((a - 0.25) / 0.75))), gx = Math.round(aw / 2) + (small ? 4 : Math.round(7 * s));
    for (const dir of [-1, 1]) for (let k = 0; k < ruleL; k++) { const x = Math.round(cx) + dir * (gx + k); putI(x, mid, k > ruleL - 4 ? P.u3 : P.u5); putI(x, mid + 1, P.void); if (k === ruleL - 1 && ruleL > 4) { putI(x + dir, mid, P.u6); putI(x, mid - 1, P.u4); putI(x, mid + 1, P.u3); putI(x + dir * 2, mid, P.u3); } }
  }
  // ---- "Judgment": carved gilt capitals on a gentle arch, a fine inline, a dark iron rim and a drop shadow
  if (word > 0) {
    const capTop = by - WM.cap, gl = o.glint;
    const wHalf = WM.tw / 2 * clamp(word * 1.15), heatK = o.heat || 0;
    shadeMask(WM, wx0, wy0, {
      ramp: R_GILT, B, o1: P.void, o2: P.s1, shadow: [Math.round(2 * s) + 1, Math.round(3 * s) + 1], shadowSolid: s < 0.75, inline: 0.78, gain: (0.55 + 0.45 * clamp(word * 1.3 - 0.3)) * (1 + flash * 0.4),
      show: word >= 1 ? null : (sx) => { const dx = Math.abs(sx - cx); if (dx > wHalf) return false; return dx > wHalf - 5 * s ? 0.6 : 0.25 * (1 - word); },
      face: (sx, sy) => {
        const q = (sy - WM.arch * ((sx - cx) / (WM.tw / 2)) ** 2 - capTop) / WM.cap;   // un-arched row position, 0 top .. 1 baseline
        let v = q < 0.46 ? 0.98 - 0.36 * (q / 0.46) : q < 0.53 ? 0.34 : q < 1 ? 0.5 + 0.34 * ((q - 0.53) / 0.47) : 0.62 - 0.4 * (q - 1);
        return v + heatK * 0.3;
      },
      add: gl == null ? null : (sx, sy) => { const g = (sx - cx) / WM.tw + 0.5 + (sy - capTop) / WM.tw * 0.55 - gl * 1.5 + 0.25; return Math.abs(g) < 0.005 ? 0.5 : Math.abs(g) < 0.011 ? 0.22 : 0; },
    });
  }
  return { by, capTop: by - WM.cap, wordW: WM.tw, ringR: rc };
}

// Halsky Labs mark (tools: halsky_mark.py from Paweł's logo, design/v2/assets/halsky-labs-logo-source.png).
// 75 x 88: . outside, r rim (moon), 0 dark (void), 1-9 lit (moon), the digit its brightness.
const HALSKY_MARK = [
  '......................................rrrr.................................',
  '...................................rrrrrrrrrrr.............................',
  '.................................rrrrrrrrrrrrrrrrr.........................',
  '...............................rrrrrrr00000rrrrrrrrrr......................',
  '.............................rrrrrr000000000000rrrrrrrrr...................',
  '...........................rrrrrr000000000000000000rrrrrrr.................',
  '..........................rrrrrr0000000000000000000000rrrrrr...............',
  '........................rrrrr000000000450000000000000000rrrrr..............',
  '......................rrrrrr000000340050540550450000000000rrrrr............',
  '.....................rrrrr0000040000450065066060556550000000rrrr...........',
  '....................rrrr0000000440400655005006506607600000000rrrrr.........',
  '..................rrrrr000004400505500500050560506005500000000rrrrr........',
  '.................rrrr0000000004055005500550000500550066500000000rrr........',
  '................rrrr000000440040056067056005505000055005404000000rrr.......',
  '...............rrrr0000000000004006677050055050450057600004000000rrrr......',
  '...............rrr000000030044005006060055000505665087650555000000rrr......',
  '..............rrrr000000003000003004066005550066006670676706400000rrrr.....',
  '..............rrr00000034000400004505776000550606600670067005000000rrr.....',
  '.............rrrr00000004550403400406087660660056660067770666040000rrrr....',
  '.............rrr0000033000400400500500770678760607760670766005040000rrr....',
  '.............rrr00000000000405055055056067880766070777777004660000005rrr...',
  '............rrr000004003450450500650550067077066777770077706806650000rrr...',
  '............rrr0000040000500666660006776066076007898707707788877000000rrr..',
  '...........rrrr0000400300556060065560077067887668998777870607880660000rrr..',
  '...........rrr00000000000056005500777887600770767870780066706076670000rrrr.',
  '..........rrrr00000000000000405660777870777607807700698506055006700000rrrr.',
  '..........rrr0000000330000000050767889877706677707777880066606606650000rrr.',
  '.........rrr0000000000000000000060079888067070077707700550056060006400rrrr.',
  '........rrrr00000000000000000000550780997077777607606760660050040600000rrr.',
  '........rrr000000000000000000000005067788770077067700670656004005506400rrr.',
  '.......rrrr000003000036500000000005060067988870770777777005500400056000rrrr',
  '......rrrr0000040030048860560000040660068888870777777007660660655000540rrrr',
  '......rrr00000055500000899990000056776500779877777070660600786705400500rrrr',
  '.....rrrr00000005005400579970000478980000007707806660550056777700550000rrrr',
  '.....rrr000000305055055005600030089980000000005770770055050078750054000rrrr',
  '....rrrr000000456600550050065003688970000000000050605005006770065700400rrrr',
  '...rrrr0000000006770606667760005998700000000000000505500466006677000400rrrr',
  '...rrrr0000003407777067700600450997003000000000000056600560506607540000rrr.',
  '..rrrrr0000000570087078760550568980054004400000003050054000550006055000rrr.',
  '..rrrr0000003007778787007600500986050044076000000000576005400040500000rrrr.',
  '.rrrrr0000000467880787670040579987660500078604750030077660005400550400rrrr.',
  '.rrrr00000040060077780660040789980678705006899970000077076045066065000rrr..',
  '.rrrr00000000056679987000005899960678760005078800000460050050055005000rrr..',
  'rrrr00000000450078898700300689996006708656600005003005600045000056000rrrr..',
  'rrrr00000000050060670640000579870400779987055004004005044000440004000rrr...',
  'rrrr00000003004506006000000006060650689997777650660550050540004000000rrr...',
  'rrr000000000004004004000000000006700699999999870787700400500005030000rrr...',
  'rrr000000000300040540540000000004600799999999999999876000045045000000rrrr..',
  'rrr0000000003004005000000000000000458999999999999998870440040004000000rrr..',
  'rrr0000000000040030000000000000000068999999999999998876005500400000000rrrr.',
  'rrr00000000000400000000000040000030679999999988999998060500045505600000rrr.',
  'rrr00000000020000000000000000000457709999999988999986000550469999997000rrr.',
  'rrr00000000030000000000000000004789989999999999999970550040689998765000rrrr',
  'rrr00000000000000000003564000000699878999999889999970650000680050000000rrrr',
  'rrr00000000040000000000067750000068807899998888999876005504005667000000rrrr',
  'rrr00000000054000000000000660400007987770898988888006666600007999755000rrrr',
  'rrr00000000300400000000000000400047980787798988887050050050039999876000rrr.',
  'rrr00000000000404003400000000000000778997077899997050005064008987700000rrr.',
  'rrr00000000040056000675000000030005007888770899997666404076007998870000rrr.',
  'rrr0000000000305055006760550000030044077088870898006600557876899996000rrrr.',
  'rrr0000000000000050400077886000000450077770777806600666069998999980000rrr..',
  '.rr000000000000004000000578704000005667066060880054000509999999970000rrrr..',
  '.rrr0000000030030000000000776500020066060066776000044006999999900000rrrr...',
  '.rrr000000000030004000000460776500460776055006004400000799999900000rrrrr...',
  '.rrr00000000000030040000005608876006606006005600065003578777700000rrrrr....',
  '.rrr0000000000040404500460057780750060044004004400540079708800000rrrrr.....',
  '.rrr000000000004050055056500507870550500050055005000009980000000rrrrr......',
  '..rrr0000000000000560066005500067005040004005055000004600000000rrrrr.......',
  '..rrr000000000004568777066600650750000000055005000000000000000rrrrr........',
  '..rrr00000000000007878987076676000004043004004003000000000000rrrrr.........',
  '..rrr000000000030000689870050005555040004004000000000000000rrrrrr..........',
  '...rrr00000000000300000056005505605000003004000000000000rrrrrrrr...........',
  '...rrr000000000000004000065050005000000000000000000000rrrrrrrr.............',
  '...rrrr0000000000000000200550030000000000000000000000rrrrrrrr..............',
  '....rrr000000000000000000400500000000000000000000000rrrrrrr................',
  '....rrr00000000000000000000000000000000000000000000rrrrr...................',
  '....rrrr000000000000000000000000000000000000000000rrrrr....................',
  '.....rrrr000000000000000000000000000000000000000rrrrrr.....................',
  '.....rrrrr000000000000000000000000000000000000rrrrrr.......................',
  '......rrrrr0000000000000000000000000000000000rrrrrr........................',
  '.......rrrrrr00000000000000000000000000000rrrrrrr..........................',
  '........rrrrrr0000000000000000000000000rrrrrrrr............................',
  '..........rrrrrr000000000000000000000rrrrrrrrr.............................',
  '...........rrrrrrr000000000000rrrrrrrrrrrrrr...............................',
  '.............rrrrrrrrrrrrrrrrrrrrrrrrrrrr..................................',
  '...............rrrrrrrrrrrrrrrrrrrrrrr.....................................',
  '.................rrrrrrrrrrrrrrrr..........................................',
  '...................rrrrr...................................................'];

// ---------------------------------------------------------------------------
// THE SCENE'S TOOLS (#133, Paweł 2026-11-27: both studio logos with the flair of the 16-bit cracktro and demo scene's
// logos): a parallax starfield, copper bars, chrome letters with an extrusion, sparkles, a mirror reflection, a sine
// scroller. All palette-exact (putI).
// ---------------------------------------------------------------------------
function sceneStars(t, vis = 1, n = 110, seed = 7) {
  for (let k = 0; k < n; k++) {
    const layer = k % 3, sp = [10, 24, 55][layer], span = W + 40;
    const x = Math.floor((((hash(k, 1, seed) * span - t * sp) % span) + span) % span) - 20, y = Math.floor(hash(k, 2, seed) * H);
    if (x < 0 || x >= W || (vis < 1 && lgBay(x, y) >= vis)) continue;
    putI(x, y, [P.s2, P.s4, P.s6][layer]);
    if (layer === 2) { putI(x + 1, y, P.s3); if (hash(k, 3, seed) > 0.75) putI(x + 2, y, P.s2); }
  }
}
const COPPER_FIRE = [P.wine, P.crimson, P.copper, P.gold, P.pale, P.moon, P.pale, P.gold, P.copper, P.crimson, P.wine];
const COPPER_DUSK = [P.d1, P.d2, P.d3, P.d4, P.d5, P.d6, P.moon, P.d6, P.d5, P.d4, P.d3, P.d2, P.d1];
const COPPER_SEA = [P.s1, P.s2, P.s3, P.s4, P.s5, P.s6, P.moon, P.s6, P.s5, P.s4, P.s3, P.s2, P.s1];
function copperBar(cy, ramp, vis = 1, x0 = 0, x1 = W) {
  const y0 = Math.round(cy - ramp.length / 2);
  for (let j = 0; j < ramp.length; j++) for (let x = x0; x < x1; x++) if (vis >= 1 || lgBay(x, y0 + j) < vis) putI(x, y0 + j, ramp[j]);
}
// a four-point sparkle, s 0..1 its size
function sparkle(x, y, s) {
  const L = Math.round(s * 4); if (L <= 0) return;
  putI(x, y, P.moon);
  for (let k = 1; k <= L; k++) { const idx = k === 1 ? P.moon : k === 2 ? P.s6 : P.s4; putI(x + k, y, idx); putI(x - k, y, idx); putI(x, y + k, idx); putI(x, y - k, idx); }
  if (L >= 3) for (const [dx, dy] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) putI(x + dx, y + dy, P.s5);
}
// where a mask's sparkles may sit: pixels on its upper and left edges, spread out (cached)
function sparkSites(M, key) {
  const c = LGCACHE.get('sp|' + key); if (c) return c;
  const { w, h, m } = M, out = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (m[i] && (!m[i - w] || !m[i - 1]) && hash(x, y, 4417) < 0.05) out.push([x, y]); }
  LGCACHE.set('sp|' + key, out); return out;
}
// sparkles twinkling over a mask at (x0, y0) (its box top-left): each site on its own phase, about one in five lit
function sparkles(M, key, x0, y0, t, rate = 1, burst = 0) {
  sparkSites(M, key).forEach(([x, y], k) => {
    const ph = (t * 0.8 * rate + hash(k, 7, 4418)) % 1, on = hash(k, Math.floor(t * 0.8 * rate + hash(k, 7, 4418)), 4419) < 0.22;
    let sz = on ? Math.sin(ph * Math.PI) : 0;
    if (burst > 0 && hash(k, 9, 4420) < 0.45) sz = Math.max(sz, burst * (0.6 + 0.4 * hash(k, 8, 4420)));
    if (sz > 0.15) sparkle(x0 + x, y0 + y, sz);
  });
}
// chrome letters: an extrusion down and right (depth d, the side colours back to front), a void rim, a face in hard
// bands (bands: [[row fraction, index], ...] from the cap's top), lit top and left edges
function chromeMask(M, x0, y0, o) {
  const { w, h, m } = M, D = o.depth ?? 4, side = o.side, capTop = o.capTop, cap = o.cap, xo = o.xoff || (() => 0);
  if (D > 0) for (let d = D + 1; d >= 1; d--) {
    const idx = d === D + 1 ? P.void : side[Math.min(side.length - 1, Math.floor(((d - 1) / Math.max(1, D)) * side.length))];
    for (let y = 0; y < h; y++) { const ox = xo(y0 + y); for (let x = 0; x < w; x++) if (m[y * w + x]) { const X = x0 + x + d + ox, Y = y0 + y + d; if (!o.show || o.show(X, Y) !== false) putI(X, Y, idx); } }
  }
  const band = (sy) => { const r = (sy - capTop) / cap; for (const [lim, idx] of o.bands) if (r < lim) return idx; return o.bands[o.bands.length - 1][1]; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, X = x0 + x + xo(y0 + y), Y = y0 + y;
    if (!m[i]) { if (M.dout[i] <= 1.5 && (!o.show || o.show(X, Y) !== false)) putI(X, Y, P.void); continue; }
    if (o.show && o.show(X, Y) === false) continue;
    let idx = o.flash ? P.moon : band(Y);
    if (!o.flash) { const r = (Y - capTop) / cap; if (!m[i - w]) idx = r < 0.5 ? P.moon : o.lipLow ?? P.d6; else if (!m[i - 1]) idx = r < 0.5 ? P.s6 : o.lipLow ?? P.d5; else if (!m[i + w] || !m[i + 1]) idx = o.dark ?? P.s2; }
    if (o.glint) { const g = o.glint(X, Y); if (g) idx = g; }
    putI(X, Y, idx);
  }
}
// a mirror reflection under a mask: squashed to half, darker with depth, rippling, dithered out
function reflectMask(M, x0, yTop, t, ramp, rows, squash = 1.15, from = null) {
  const { w, h, m } = M, o_sq = (r) => Math.round(r * squash), top = from ?? h - 1;   // from: the mask row it mirrors from (the baseline)
  for (let r = 0; r < rows; r++) {
    const sy = top - o_sq(r); if (sy < 0) break;
    const fade = 1 - r / rows, dx = Math.round(Math.sin(r * 0.9 + t * 3) * (r > 2 ? 1 : 0)), Y = yTop + r;
    for (let x = 0; x < w; x++) if (m[sy * w + x]) { const X = x0 + x + dx; if (lgBay(X, Y) < 0.35 + 0.65 * fade) putI(X, Y, ramp[Math.min(ramp.length - 1, Math.floor((r / rows) * ramp.length))]); }
  }
}
// text painted row by row from a ramp (a copper gradient through the letters)
function textRows(str, x, y, f, rowIdx, o = {}) {
  const g = glyphs(str, f, o.ls || 0), p = g.pts, x0 = Math.round(o.align === 'c' ? x - g.w / 2 : x);
  for (let k = 0; k < p.length; k += 2) { const X = p[k] + x0, Y = p[k + 1] + y; if (o.show && o.show(X, Y) === false) continue; if (o.shadow != null) putI(X + 1, Y + 1, o.shadow); }
  for (let k = 0; k < p.length; k += 2) { const X = p[k] + x0, Y = p[k + 1] + y; if (o.show && o.show(X, Y) === false) continue; putI(X, Y, rowIdx(p[k + 1], X)); }
  return g.w;
}
// a sine scroller, the scene's snake (#151, Paweł: the letters move one by one, as the Amiga's did, not as one still
// wave): the text moves left at speed px/s from the right edge through a sine that stays nearly put on the screen
// (it drifts at drift px/s), and every pixel column rides it, so each letter bends and bobs as it passes through and
// the line slithers like a snake. o.k: the wave's number (radians per px), o.amp its height in px.
function sineScroller(str, y, t, o = {}) {
  const f = o.font || 'head', sp = o.speed || 95, amp = o.amp ?? 6, ramp = o.ramp || COPPER_FIRE, k = o.k ?? 0.03, drift = o.drift ?? 18;
  const off = (X) => Math.round(Math.sin((X + t * drift) * k) * amp + Math.sin((X + t * drift * 2.4) * k * 2.3) * amp * 0.25);
  let x = W - t * sp;
  for (let n = 0; n < str.length; n++) {
    const ch = str[n], cw = measure(ch, f) + 1;
    if (x > W) break;
    if (x + cw > 0 && ch !== ' ') {
      const p = glyphs(ch, f, 0).pts, x0 = Math.round(x);
      for (let q = 0; q < p.length; q += 2) { const X = p[q] + x0; putI(X + 1, y + p[q + 1] + off(X + 1) + 1, P.void); }   // its shadow, on the wave too
      for (let q = 0; q < p.length; q += 2) { const X = p[q] + x0, dy = p[q + 1]; putI(X, y + dy + off(X), ramp[Math.min(ramp.length - 1, Math.max(0, dy + (o.rampOff || 0)))]); }
    }
    x += cw;
  }
}

// ---------------------------------------------------------------------------
// HALSKY LABS (#133, Paweł 2026-11-27: an 80s Japanese studio-gear flair, then the scene's flair, more detail). Paweł's
// mark (HALSKY_MARK, a stippled face on a white sticker, void and moon only) beside HALSKY in a wide, heavy face
// (Syncopate Bold) in banded chrome with a deep extrusion, a red copper rule ending in a LABS badge like a rack unit's
// model badge (screws in its corners), and PRESENTS, spaced, between two rules the lockup's width, centred under it.
// A slow starfield behind. In: the stars; a red power-on line; the mark rasters in top to bottom behind a scanline;
// HALSKY flies in from the right on speed lines and locks with a flash, a lens streak and a burst of sparkles, its
// extrusion pushing out; the badge flickers on like a panel LED; PRESENTS opens from the middle; a glint across the
// chrome. Then it holds (the face's grain alive, the sparkles twinkling) until the next screen fades in over it.
// ---------------------------------------------------------------------------
let HM = null;   // the mark's pixels, once: [x, y, kind (0 void, 1 face, 2 rim), level]
function halskyMarkPx() {
  if (HM) return HM;
  const rows = HALSKY_MARK, mh = rows.length, mw = rows[0].length, px = [];
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const ch = rows[y][x]; if (ch === '.') continue; px.push([x, y, ch === 'r' ? 2 : ch === '0' ? 0 : 1, ch === 'r' || ch === '0' ? 0 : +ch]); }
  HM = { px, mw, mh }; return HM;
}
// the sticker's rim as a mask (for its sparkles)
function halskyRimMask() { const M = halskyMarkPx(); return fnMask('hlrim', M.mw + 2, M.mh + 2, (x, y) => { const r = HALSKY_MARK[y - 1]; return !!r && x >= 1 && x <= M.mw && r[x - 1] === 'r'; }); }
const HL_T = { line: 0.2, lineLen: 0.42, scan: 0.45, scanLen: 0.75, fly: 1.0, flyLen: 0.42, badge: 1.6, presents: 2.0, glint: 2.7, glintLen: 0.7 };
const eOut3 = (k) => 1 - (1 - k) ** 3;
const HL_BANDS = [[0.14, P.moon], [0.3, P.s6], [0.44, P.s5], [0.52, P.s2], [0.62, P.s3], [0.76, P.s4], [0.9, P.s5], [1.01, P.s6]];
function halskyLabs(u, len, cx, cy) {
  const M = halskyMarkPx(), WF = '36px sync', WMk = typeMask('HALSKY', WF, { ls: 2 }), wordW = WMk.tw, cap = WMk.cap;
  const gap = 16, lockW = M.mw + gap + wordW, lx0 = Math.round(cx - lockW / 2);
  const mx0 = lx0, my0 = Math.round(cy - M.mh / 2) - 8, wx = lx0 + M.mw + gap, base = Math.round(cy - 2);
  const BW = 34, BH = 12, bx = wx + wordW - BW, by = base + 7, ruleY = by + 5;
  sceneStars(u, clamp(u / 0.4));
  // 1. the red power-on line (a three-row copper rule), ending at the badge
  const lp = eIO(clamp((u - HL_T.line) / HL_T.lineLen)), rx1 = Math.round(lerp(wx - 2, bx - 3, lp));
  if (lp > 0) { for (let x = wx - 2; x <= rx1; x++) { putI(x, ruleY - 1, P.pale); putI(x, ruleY, P.crimson); putI(x, ruleY + 1, P.wine); } if (lp < 1) for (const [dx, idx] of [[1, P.moon], [2, P.pale], [3, P.crimson]]) putI(rx1 + dx, ruleY, idx); }
  // 2. the mark rasters in, top to bottom, behind a bright scanline; its grain lives while it holds. Once the word
  //    locks, the sticker gets the same extrusion, and sparkles on its rim
  const sp = clamp((u - HL_T.scan) / HL_T.scanLen), row = sp * (M.mh + 2), grainF = Math.floor(u * 8), held = sp >= 1;
  const mDepth = u >= HL_T.fly + HL_T.flyLen ? Math.round(5 * eOut3(clamp((u - HL_T.fly - HL_T.flyLen) / 0.3))) : 0;
  if (held && mDepth > 0) for (let d = mDepth + 1; d >= 1; d--) { const idx = d === mDepth + 1 ? P.void : [P.d2, P.s1, P.d1][Math.min(2, Math.floor(((d - 1) / mDepth) * 3))]; for (const [x, y] of M.px) putI(mx0 + x + d, my0 + y + d, idx); }
  if (sp > 0) for (const [x, y, kind, L] of M.px) {
    const X = mx0 + x, Y = my0 + y;
    if (y > row) continue;
    if (!held && y > row - 1.5) { putI(X, Y, kind === 0 ? P.d6 : P.moon); continue; }
    if (!held && y > row - 4 && kind !== 0 && ((y + x) & 1)) { putI(X, Y, P.d6); continue; }
    let on = kind !== 0;
    if (held && kind === 1 && L <= 6 && hash(x, y, 9712 + grainF) < 0.07) on = false;
    putI(X, Y, on ? P.moon : P.void);
  }
  // 3. HALSKY flies in from the right on speed lines (ghosts trailing), locks, and its extrusion pushes out
  const fp = clamp((u - HL_T.fly) / HL_T.flyLen), dx = Math.round((1 - eOut3(fp)) * 230), lockAt = HL_T.fly + HL_T.flyLen, locked = u >= lockAt;
  const flash = locked && u < lockAt + 0.08, depth = locked ? Math.round(5 * eOut3(clamp((u - lockAt) / 0.3))) : 0;
  const gl = u > HL_T.glint && u < HL_T.glint + HL_T.glintLen ? (u - HL_T.glint) / HL_T.glintLen : null;
  const X0 = wx + dx - WMk.pad, Y0 = base + WMk.oy;
  if (fp > 0) {
    if (!locked) for (const [k, col] of [[2, P.s2], [1, P.s3]]) { const gx = wx + dx + k * Math.round(14 * (1 - fp)); if (k * (1 - fp) < 0.15) continue; shadeMask(WMk, gx - WMk.pad, Y0, { ramp: [col, col], B: 0, face: () => 1 }); }
    chromeMask(WMk, X0, Y0, { depth, side: [P.d2, P.s1, P.d1], bands: HL_BANDS, capTop: base - cap, cap, flash, lipLow: P.s6, dark: P.s2,
      glint: gl != null ? (X, Y) => { const g = (X - wx) / wordW - (gl * 1.5 - 0.25) - (Y - base) * 0.025; return Math.abs(g) < 0.03 ? P.moon : Math.abs(g) < 0.06 ? P.s6 : 0; } : null });
    if (!locked) for (const [yy, col, l0] of [[base - cap + 3, P.crimson, 60], [base - Math.round(cap * 0.55), P.s5, 90], [base - 3, P.crimson, 44], [base - Math.round(cap * 0.3), P.s3, 70]]) {
      const x1 = wx + dx + wordW + 4, L = Math.round(l0 * (1 - fp) + 6);
      for (let x = x1; x < x1 + L; x++) if (x < W && ((x - x1) < L * 0.7 || lgBay(x, yy) < 0.5)) putI(x, yy, col);
    }
  }
  // the lock: a lens streak through the word, a burst of sparkles, then they twinkle
  const st = locked ? clamp((u - lockAt) / 0.45) : 0;
  if (st > 0 && st < 1) { const yy = base - Math.round(cap * 0.62), half = Math.round(20 + 150 * eOut3(st)), mid = wx + wordW / 2; for (let x = Math.round(mid - half); x <= Math.round(mid + half); x++) { const f = 1 - Math.abs(x - mid) / half; if (lgBay(x, yy) < f * (1 - st)) putI(x, yy, f > 0.6 ? P.moon : P.s6); } }
  if (locked) { sparkles(WMk, 'halsky', X0, Y0, u, 1, st < 1 ? 1 - st : 0); sparkles(halskyRimMask(), 'halskyRim', mx0 - 1, my0 - 1, u + 0.37, 0.8, 0); }
  // 4. the LABS badge lights like a panel LED: two flickers, then on (screws in its corners)
  const bu = u - HL_T.badge, bon = bu >= 0 && !(bu > 0.05 && bu < 0.1) && !(bu > 0.15 && bu < 0.2);
  if (bu >= 0) {
    if (bon) {
      rectI(bx, by, BW, BH, P.crimson); rectI(bx, by, BW, 1, P.pale); rectI(bx, by + BH - 1, BW, 1, P.wine); rectI(bx + BW - 1, by + 1, 1, BH - 2, P.wine);
      for (const [sx, sy] of [[bx + 2, by + 2], [bx + BW - 3, by + 2], [bx + 2, by + BH - 3], [bx + BW - 3, by + BH - 3]]) putI(sx, sy, P.wine);
      text('LABS', bx + BW / 2 + 1, by + 3, 'silkb', P.void, { align: 'c' });
    } else frameI(bx, by, BW, BH, P.wine);
  }
  // 5. PRESENTS, spaced, centred under the lockup between two rules as wide as it (they open from the middle)
  const pr = clamp((u - HL_T.presents) / 0.45), py = my0 + M.mh + 12;
  if (pr > 0) {
    const pw = measure('PRESENTS', 'tinyL', 3), half = Math.round((lockW / 2) * eIO(pr)), gapW = pw / 2 + 8;
    for (let x = cx - half; x <= cx + half; x++) { if (Math.abs(x - cx) < gapW) continue; putI(x, py + 4, P.s3); putI(x, py + 5, P.s1); }
    textRows('PRESENTS', cx, py, 'tinyL', (dy) => (pr < 1 && lgBay(cx + dy, py + dy) > pr ? P.s2 : [P.moon, P.moon, P.s6, P.s6, P.s5, P.s5, P.s4, P.s4, P.s3, P.s3][Math.min(9, dy)]), { align: 'c', ls: 3, shadow: P.void });
  }
  return { mx: wx + wordW / 2, my: base - cap / 2, glow: flash ? 1 : st > 0 ? 0.6 * (1 - st) : 0 };
}

// ---------------------------------------------------------------------------
// PROCRASTINATION STUDIOS (#133, Paweł: changed completely, after the old cracktros and demos the pirate scene put
// before the games; the name and "est. eventually" kept). A big chrome PROCRASTINATION in a spiky display face (New
// Rocker) with a deep extrusion, sparkles and a rippling mirror reflection; STUDIOS tagged at its right like an artist's
// signature; "est. eventually" in uncial lettering, a copper gradient through it, in a dark band between two rules; a
// sine scroller over two copper bars at the bottom; a parallax starfield. In: it fades in over Halsky Labs with the
// stars; the logo drops in from above and bounces, wobbling, and lands in a burst of sparkles; its reflection; the band
// opens; the copper bars swing in and the scroller starts. Then it holds until the title fades in over it.
// ---------------------------------------------------------------------------
const PS_T = { drop: 0.15, land: 0.55, refl: 0.8, band: 1.0, studios: 1.35, bars: 0.7, scroll: 0.8 };   // the bars and the scroller sooner (#151)
const PS_BANDS = [[0.1, P.moon], [0.24, P.s6], [0.36, P.s5], [0.44, P.d5], [0.52, P.s2], [0.6, P.d3], [0.72, P.d4], [0.86, P.d5], [1.01, P.d6]];
// read whole before the title comes in (#151): about 8 s of scrolling at 100 px/s
const PS_SCROLL = 'YO! THIS INTRO WAS DUE IN MARCH.   GREETZ TO DUTCH, HIXX, HUDZOR AND ARKBISHOP.   ';
function procrastinationStudios(u, len, cx, cy) {
  const font = '40px rock', LM = typeMask('PROCRASTINATION', font, { sy: 1.45 }), cap = LM.cap, base = 74;
  const lx = Math.round(cx - LM.tw / 2) - 2;
  sceneStars(u + 4.4, 1, 120, 11);
  // the copper bars swing in at the bottom, the scroller rides over them
  const bv = clamp((u - PS_T.bars) / 0.4);
  if (bv > 0) { copperBar(182 + Math.sin(u * 2.1) * 12, COPPER_SEA, bv); copperBar(206 + Math.sin(u * 2.1 + 2.6) * 10, COPPER_DUSK, bv); }
  if (u > PS_T.scroll) sineScroller(PS_SCROLL, 190, u - PS_T.scroll, { speed: 100, amp: 7, k: 0.03, drift: 18, ramp: COPPER_FIRE.slice(1), rampOff: 0 });
  // the logo drops in from above, bounces twice and lands; it wobbles row by row while it moves
  let dy = 0;
  if (u < PS_T.land) { const k = clamp((u - PS_T.drop) / (PS_T.land - PS_T.drop)); dy = -Math.round((1 - k * k) * 110); }
  else { const q = u - PS_T.land; dy = -Math.round(Math.abs(Math.sin(q * 9)) * 14 * Math.exp(-q * 6)); }
  const moving = u < PS_T.land + 0.55, wob = moving ? 3 * Math.exp(-Math.max(0, u - PS_T.land) * 5) : 0;
  const X0 = lx - LM.pad, Y0 = base + LM.oy + dy;
  if (u > PS_T.drop) {
    chromeMask(LM, X0, Y0, { depth: 5, side: [P.d3, P.d2, P.s1, P.d1], bands: PS_BANDS, capTop: base - cap + dy, cap, lipLow: P.d6, dark: P.d2,
      xoff: wob > 0.2 ? (Y) => Math.round(Math.sin(Y * 0.32 + u * 26) * wob) : null });   // it wobbles row by row while it bounces
    // the reflection under it
    if (u > PS_T.refl) reflectMask(LM, X0 + 2, base + 9, u, [P.d5, P.d5, P.d4, P.d4, P.d3, P.s2], Math.round(20 * clamp((u - PS_T.refl) / 0.4)), 1.5, -LM.oy - 1);
    sparkles(LM, 'procrastination', X0, Y0, u, 1.2, u > PS_T.land && u < PS_T.land + 0.6 ? 1 - (u - PS_T.land) / 0.6 : 0);
  }
  // STUDIOS tagged at its right under the reflection, like the artist's signature on a logo
  const so = clamp((u - PS_T.studios) / 0.3);
  if (so > 0) { const tw = measure('STUDIOS', 'silkb', 3), sy0 = base + 31; textRows('STUDIOS', lx + LM.tw - tw - 2, sy0, 'silkb', (dy2, X) => (lgBay(X, sy0 + dy2) < so ? [P.moon, P.s6, P.s6, P.s5, P.s5, P.s4][Math.min(5, dy2)] : P.void), { ls: 3, shadow: P.void }); }
  // the tagline band: two rules opening from the middle, a dark band, "est. eventually" with a copper gradient
  const ba = eIO(clamp((u - PS_T.band) / 0.45)), bandY = 136, half = Math.round(150 * ba);
  if (half > 0) {
    for (let x = cx - half; x <= cx + half; x++) {
      const e = 1 - Math.abs(x - cx) / 152, bh = Math.round(9 * Math.sqrt(Math.max(0, e)));
      for (let y = bandY - bh; y <= bandY + bh; y++) if (lgBay(x, y) < 0.75) putI(x, y, P.d1);
      putI(x, bandY - 12, (x & 1) ? P.d4 : P.d3); putI(x, bandY + 12, (x & 1) ? P.d4 : P.d3);
    }
    const TM = typeMask('est. eventually', '18px unci'), tx = Math.round(cx - TM.tw / 2) - TM.pad, ty = bandY + 5 + TM.oy;
    const tv = clamp((u - PS_T.band - 0.2) / 0.4);
    shadeMask(TM, tx, ty, { ramp: [P.d4, P.d5, P.d6, P.pale, P.moon], B: 0, o1: P.void, face: (sx, sy) => 1 - clamp((sy - (bandY + 5 - TM.cap)) / TM.cap) * 0.85, show: (sx, sy) => (lgBay(sx, sy) < tv ? 0 : false) });
  }
  return { bx: cx, by: base - cap / 2, glow: u > PS_T.land && u < PS_T.land + 0.3 ? 1 - (u - PS_T.land) / 0.3 : 0 };
}
