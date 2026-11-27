// ===========================================================================
// LOGOS: the Age of Judgment title logo and the two studio stings (Halsky Labs, Procrastination Studios).
// Halsky Labs' mark is Paweł's logo as a two-tone bitmap (HALSKY_MARK); everything else is drawn.
// Vector type is rasterised crisp at its native size (threshold, no anti-aliasing), then shaded by hand into the
// palette: a chiselled bevel lit from the upper left, a metal gradient on the face, outlines and a drop shadow.
// Everything here writes palette indices to the UI layer (putI), so it is exact; glows go into the lit scene.
// ===========================================================================
const LG_FONTS = { czd: 'cinzel-decorative-latin-900-normal', cz: 'cinzel-latin-900-normal', sync: 'syncopate-latin-700-normal', outf: 'outfit-latin-600-normal' };
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
  const ls = o.ls || 0, arch = o.arch || 0, key = font + '|' + ls + '|' + arch + '|' + str;
  let M = LGCACHE.get(key); if (M) return M;
  const g = lgCtx(); g.font = font; g.letterSpacing = ls + 'px'; g.textBaseline = 'alphabetic';
  const mt = g.measureText(str), pad = 6, asc = Math.ceil(mt.actualBoundingBoxAscent), desc = Math.ceil(mt.actualBoundingBoxDescent);
  const left = Math.floor(-mt.actualBoundingBoxLeft), tw = Math.ceil(mt.actualBoundingBoxRight) - left;
  const w = tw + pad * 2, h0 = asc + desc + pad * 2, h = h0 + arch;
  g.clearRect(0, 0, LGC.width, LGC.height); g.fillStyle = '#fff'; g.fillText(str, pad - left, pad + asc);
  const d = g.getImageData(0, 0, w, h0).data, m = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) { const q = (x - pad) / Math.max(1, tw) * 2 - 1, sh = arch - Math.round(arch * (1 - q * q)); for (let y = 0; y < h0; y++) if (d[(y * w + x) * 4 + 3] > 120) m[(y + sh) * w + x] = 1; }
  g.font = font; const cap = Math.ceil(g.measureText('H').actualBoundingBoxAscent);
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
// HALSKY LABS (#133, Paweł 2026-11-27: sleeker, an 80s Japanese studio-gear flair; original, no real brand's shapes).
// Paweł's mark (HALSKY_MARK, a stippled face on a white sticker, void and moon only) with HALSKY in a wide, heavy
// face (Syncopate Bold) in brushed chrome, a red rule ending in a LABS badge like a model badge on a rack unit,
// "presents" under it. In: a red power-on line sweeps across; the mark rasters in top to bottom behind a bright
// scanline; HALSKY flies in from the right on speed lines and locks with a flash and a lens streak; the badge lights
// like a panel LED (two flickers); "presents"; a glint across the chrome. Then it holds (the face's grain alive) until
// the next screen fades in over it: no animation out.
// ---------------------------------------------------------------------------
let HM = null;   // the mark's pixels, once: [x, y, kind (0 void, 1 face, 2 rim)]
function halskyMarkPx() {
  if (HM) return HM;
  const rows = HALSKY_MARK, mh = rows.length, mw = rows[0].length, px = [];
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const ch = rows[y][x]; if (ch === '.') continue; px.push([x, y, ch === 'r' ? 2 : ch === '0' ? 0 : 1, ch === 'r' || ch === '0' ? 0 : +ch]); }
  HM = { px, mw, mh }; return HM;
}
const HL_T = { line: 0.2, lineLen: 0.42, scan: 0.45, scanLen: 0.75, fly: 1.0, flyLen: 0.42, badge: 1.6, presents: 2.15, glint: 2.7, glintLen: 0.7 };
const eOut3 = (k) => 1 - (1 - k) ** 3;
function halskyLabs(u, len, cx, cy) {
  const M = halskyMarkPx(), WF = '36px sync', WMk = typeMask('HALSKY', WF, { ls: 2 }), wordW = WMk.tw, cap = WMk.cap;
  const gap = 16, lockW = M.mw + gap + wordW, lx0 = Math.round(cx - lockW / 2);
  const mx0 = lx0, my0 = Math.round(cy - M.mh / 2), wx = lx0 + M.mw + gap, base = Math.round(cy + 6);
  const BW = 31, BH = 11, bx = wx + wordW - BW, by = base + 5, ruleY = by + 5;
  // 1. the red power-on line, under where the word will stand, ending at the badge
  const lp = eIO(clamp((u - HL_T.line) / HL_T.lineLen)), rx1 = Math.round(lerp(wx - 2, bx - 3, lp));
  if (lp > 0) { for (let x = wx - 2; x <= rx1; x++) { putI(x, ruleY, P.crimson); putI(x, ruleY + 1, P.wine); } if (lp < 1) { putI(rx1 + 1, ruleY, P.pale); putI(rx1 + 2, ruleY, P.moon); putI(rx1 + 1, ruleY + 1, P.crimson); } }
  // 2. the mark rasters in, top to bottom, behind a bright scanline; its grain lives while it holds
  const sp = clamp((u - HL_T.scan) / HL_T.scanLen), row = sp * (M.mh + 2), grainF = Math.floor(u * 8), held = sp >= 1;
  if (sp > 0) for (const [x, y, kind, L] of M.px) {
    const X = mx0 + x, Y = my0 + y;
    if (y > row) continue;
    if (!held && y > row - 1.5) { putI(X, Y, kind === 0 ? P.d6 : P.moon); continue; }   // the scanline
    if (!held && y > row - 4 && kind !== 0 && ((y + x) & 1)) { putI(X, Y, P.d6); continue; }   // its afterglow
    let on = kind !== 0;
    if (held && kind === 1 && L <= 6 && hash(x, y, 9712 + grainF) < 0.07) on = false;
    putI(X, Y, on ? P.moon : P.void);
  }
  // 3. HALSKY flies in from the right on speed lines (ghosts trailing), and locks
  const fp = clamp((u - HL_T.fly) / HL_T.flyLen), dx = Math.round((1 - eOut3(fp)) * 230), locked = u >= HL_T.fly + HL_T.flyLen;
  const flash = locked && u < HL_T.fly + HL_T.flyLen + 0.08;
  const gl = u > HL_T.glint && u < HL_T.glint + HL_T.glintLen ? (u - HL_T.glint) / HL_T.glintLen : null;
  const chrome = (sx, sy) => {   // 80s banded chrome, hard steps on the ramp's nodes (no dither): bright top, a dark horizon
    const r = (sy - (base - cap)) / cap;   // just above the middle, then the lower half brightening toward the floor's reflection
    return r < 0.24 ? 1 : r < 0.44 ? 0.8 : r < 0.52 ? 0.2 : r < 0.66 ? 0.4 : r < 0.84 ? 0.6 : 0.8;
  };
  if (fp > 0) {
    if (!locked) for (const [k, col] of [[2, P.s2], [1, P.s3]]) {   // ghosts
      const gx = wx + dx + k * Math.round(14 * (1 - fp)); if (k * (1 - fp) < 0.15) continue;
      shadeMask(WMk, gx - WMk.pad, base + WMk.oy, { ramp: [col, col], B: 0, face: () => 1 });
    }
    shadeMask(WMk, wx + dx - WMk.pad, base + WMk.oy, { ramp: [P.s2, P.s3, P.s4, P.s5, P.s6, P.moon], B: 0, o1: P.void, face: flash ? () => 1.2 : chrome,
      add: gl != null ? (sx, sy) => { const g = (sx - wx) / wordW - (gl * 1.5 - 0.25) - (sy - base) * 0.025; return Math.abs(g) < 0.035 ? 0.6 : Math.abs(g) < 0.07 ? 0.25 : 0; } : null });
    if (!locked) for (const [yy, col, l0] of [[base - cap + 3, P.crimson, 60], [base - Math.round(cap * 0.55), P.s5, 90], [base - 3, P.crimson, 44], [base - Math.round(cap * 0.3), P.s3, 70]]) {   // speed lines
      const x1 = wx + dx + wordW + 4, L = Math.round(l0 * (1 - fp) + 6);
      for (let x = x1; x < x1 + L; x++) if (x < W && ((x - x1) < L * 0.7 || lgBay(x, yy) < 0.5)) putI(x, yy, col);
    }
  }
  // the lock: a lens streak through the word, and a four-point glint at its top right
  const st = locked ? clamp((u - HL_T.fly - HL_T.flyLen) / 0.45) : 0;
  if (st > 0 && st < 1) {
    const yy = base - Math.round(cap * 0.62), half = Math.round(20 + 150 * eOut3(st)), mid = wx + wordW / 2;
    for (let x = Math.round(mid - half); x <= Math.round(mid + half); x++) { const f = 1 - Math.abs(x - mid) / half; if (lgBay(x, yy) < f * (1 - st)) putI(x, yy, f > 0.6 ? P.moon : P.s6); }
    const sx = wx + wordW - 3, sy = base - cap - 1, r = Math.round(6 * (1 - st));
    for (let k = -r; k <= r; k++) { putI(sx + k, sy, Math.abs(k) < 2 ? P.moon : P.s6); putI(sx, sy + k, Math.abs(k) < 2 ? P.moon : P.s6); }
  }
  // 4. the LABS badge lights like a panel LED: two flickers, then on
  const bu = u - HL_T.badge, bon = bu >= 0 && !(bu > 0.05 && bu < 0.1) && !(bu > 0.15 && bu < 0.2);
  if (bu >= 0) {
    if (bon) { rectI(bx, by, BW, BH, P.crimson); rectI(bx, by, BW, 1, P.pale); rectI(bx, by + BH - 1, BW, 1, P.wine); text('LABS', bx + BW / 2 + 1, by + 2, 'silkb', P.void, { align: 'c' }); }
    else { frameI(bx, by, BW, BH, P.wine); }
  }
  // 5. "presents", dithered in
  const pr = clamp((u - HL_T.presents) / 0.4);
  if (pr > 0) text('presents', cx, base + 34, 'tiny', fadeIdx(pr, [P.void, P.s2, P.s3, P.s4]), { align: 'c', ls: 2 });
  return { mx: wx + wordW / 2, my: base - cap / 2, glow: flash ? 1 : st > 0 ? 0.6 * (1 - st) : 0 };
}

// ---------------------------------------------------------------------------
// PROCRASTINATION STUDIOS (#133, Paweł: the name and the tagline stay; more professional and sleek). A stacked lockup:
// a thin ring with an hourglass inside (copper sand), PROCRASTINATION in Outfit SemiBold, spaced, a copper rule,
// S T U D I O S, the tagline. In: the ring draws itself from the top; the hourglass fades in and its sand starts; the
// letters rise from behind the baseline one after another, all but the last N, which arrives a beat late; the rule
// opens from the middle; STUDIOS; "est. eventually" types itself, late; the hourglass turns over once. Then it holds
// until the title fades in over it.
// ---------------------------------------------------------------------------
const PS_T = { ring: 0.3, ringLen: 0.6, glass: 0.75, word: 1.1, late: 2.05, rule: 2.2, type: 2.8, flip: 3.55, flipLen: 0.4 };   // the ring starts during the fade in
function psHourglass(cx, cy, rot, sand, stream, vis) {
  // in local coords: caps at y = +-12, two glass triangles meeting at the centre; sand: 0 all on top, 1 all below
  const c = Math.cos(rot), s2 = Math.sin(rot), topL = -11 + 10 * Math.sqrt(sand), botL = 11 - 10 * Math.sqrt(1 - (1 - sand));
  for (let j = -14; j <= 14; j++) for (let i = -14; i <= 14; i++) {
    const X = cx + i, Y = cy + j; if (vis < 1 && lgBay(X, Y) >= vis) continue;
    const lx = (i + 0.5) * c + (j + 0.5) * s2, ly = -(i + 0.5) * s2 + (j + 0.5) * c, ax = Math.abs(lx), ay = Math.abs(ly);
    if (ay >= 11.6 && ay <= 13 && ax <= 8.5) { putI(X, Y, P.moon); continue; }   // the caps
    const half = 0.6 + 7 * (ay / 11.6); if (ay >= 11.6 || ax > half + 0.5) continue;
    if (ax > half - 0.6) { putI(X, Y, P.s5); continue; }   // the glass, a fine line
    if (ly < 0 && ly > topL) { putI(X, Y, P.copper); continue; }   // the sand still on top, draining
    if (ly > 0 && ly > botL + ax * 0.6) { putI(X, Y, P.copper); continue; }   // the pile below
    if (stream && ax < 0.7 && ly > -1 && ly < botL + 0.5) { putI(X, Y, P.copper); continue; }
  }
}
function procrastinationStudios(u, len, cx, cy) {
  const mcx = cx, mcy = cy - 30, R = 19, base = cy + 10;
  // 1. the ring draws itself clockwise from the top, a bright head
  const rp = eIO(clamp((u - PS_T.ring) / PS_T.ringLen));
  if (rp > 0) for (let a = 0; a < 240; a++) { const q = a / 240; if (q > rp) break; const an = q * Math.PI * 2 - Math.PI / 2; putI(Math.round(mcx + Math.cos(an) * R - 0.5), Math.round(mcy + Math.sin(an) * R - 0.5), rp < 1 && q > rp - 0.03 ? P.moon : P.s5); }
  // 2. the hourglass fades in (dithered); its sand runs; it turns over once and starts again
  const gv = clamp((u - PS_T.glass) / 0.4), fl = clamp((u - PS_T.flip) / PS_T.flipLen);
  if (gv > 0) {
    const s0 = clamp((u - PS_T.glass - 0.15) / 2.6), sAtFlip = clamp((PS_T.flip - PS_T.glass - 0.15) / 2.6);
    const sand = fl <= 0 ? s0 : fl < 1 ? sAtFlip : clamp(1 - sAtFlip + (u - PS_T.flip - PS_T.flipLen) / 2.6);
    psHourglass(mcx, mcy, Math.PI * eIO(fl), sand, fl <= 0 || fl >= 1, gv);
  }
  // 3. PROCRASTINATION: each letter rises from behind the baseline, one after another; the last N a beat late
  const WORD = 'PROCRASTINATION', font = '18px outf', LS = 3, g = lgCtx(); g.font = font; g.letterSpacing = LS + 'px';
  const ww = g.measureText(WORD).width - LS, wx = Math.round(cx - ww / 2);
  for (let k = 0; k < WORD.length; k++) {
    const late = k === WORD.length - 1, p = clamp((u - (late ? PS_T.late : PS_T.word + k * 0.035)) / 0.28); if (p <= 0) continue;
    g.font = font; g.letterSpacing = LS + 'px'; const lx = wx + g.measureText(WORD.slice(0, k)).width;
    const Mk = typeMask(WORD[k], font), dy = Math.round((1 - eOut3(p)) * 9);
    shadeMask(Mk, Math.round(lx + Mk.ox), base + Mk.oy + dy, { ramp: [P.s6, P.moon], B: 0, face: () => 1, show: (sx, sy) => (sy <= base ? 0 : false) });
  }
  // 4. the copper rule opens from the middle; S T U D I O S under it
  const rl = eIO(clamp((u - PS_T.rule) / 0.4)), half = Math.round(rl * 46);
  if (half > 0) for (let x = cx - half; x <= cx + half; x++) putI(x, base + 6, P.copper);
  const so = clamp((u - PS_T.rule - 0.05) / 0.4);
  if (so > 0) text('S T U D I O S', cx + 1, base + 11, 'tiny', fadeIdx(so, [P.void, P.s2, P.s4, P.s5]), { align: 'c' });
  // 5. the tagline types itself, late
  if (u > PS_T.type) {
    const tag = 'est. eventually', n = Math.min(tag.length, Math.floor((u - PS_T.type) / 0.045)), done = n >= tag.length;
    const caret = !done || (u - PS_T.type - tag.length * 0.045 < 0.6 && Math.floor(u * 3) % 2 === 0);
    const tw = measure(tag, 'tiny'), tx = Math.round(cx - tw / 2);
    text(tag.slice(0, n), tx, base + 24, 'tiny', P.s4);
    if (caret) text('_', tx + measure(tag.slice(0, n), 'tiny') + 1, base + 24, 'tiny', P.s4);
  }
  return { bx: mcx, by: mcy, glow: 0.5 * gv };
}
