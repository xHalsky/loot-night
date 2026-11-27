// ===========================================================================
// LOOT NIGHT — Moonwell 32 renderer (browser Canvas 2D, no WebGL)
// Pipeline per frame:
//   parallax layers + sprites  ->  albedo VALUE + MATERIAL buffers
//   coloured lights            ->  lit value + light tint
//   hue-shifted material ramps ->  full-colour frame (the "source")
//   Bayer 8x8 heavy ordered dither + OKLab LUT -> 32-colour palette
// UI/text write palette indices directly (pixel-exact, never dithered).
// ===========================================================================
let W = 384, H = 220;

// ---------- the 32-colour palette ----------
// four world families (stone · moss · dusk · umber), 8 levels each: they share the
// same violet-black shadow and moon-white highlight, and all hue-shift the same way
// (shadows lean violet, highlights lean warm). + 4 golds (loot), crimson, arcane.
let PAL = ["#0a0814", "#1e1a3e", "#263160", "#2d4e80", "#39719d", "#5398b5", "#81c1c8", "#092334", "#113c44", "#135a54", "#3f7960", "#749970", "#aebb89", "#241939", "#452750", "#6b3b62", "#925673", "#b87a83", "#d9a69c", "#241c2e", "#452c3d", "#6a4240", "#8a614d", "#aa8667", "#c7b18c", "#f2efdc", "#852e30", "#c16229", "#f1a934", "#fae299", "#d23c5a", "#8b5ad6"];
const P = {void: 0, s1: 1, s2: 2, s3: 3, s4: 4, s5: 5, s6: 6, g1: 7, g2: 8, g3: 9, g4: 10, g5: 11, g6: 12, d1: 13, d2: 14, d3: 15, d4: 16, d5: 17, d6: 18, u1: 19, u2: 20, u3: 21, u4: 22, u5: 23, u6: 24, moon: 25, wine: 26, copper: 27, gold: 28, pale: 29, crimson: 30, arcane: 31};
// materials
const M_STONE = 0, M_LOOT = 1, M_MAGIC = 2, M_DANGER = 3, M_MOSS = 4, M_DUSK = 5, M_UMBER = 6;
const RAMP_IDX = [
  [P.void, P.s1, P.s2, P.s3, P.s4, P.s5, P.s6, P.moon],          // 0 stone (night blue)
  [P.void, P.d2, P.wine, P.copper, P.gold, P.pale],               // 1 loot  (plum shadow -> pale gold)
  [P.void, P.s1, P.arcane, P.s5, P.s6, P.moon],                   // 2 magic
  [P.void, P.d2, P.wine, P.crimson],                              // 3 danger
  [P.void, P.g1, P.g2, P.g3, P.g4, P.g5, P.g6, P.moon],          // 4 moss
  [P.void, P.d1, P.d2, P.d3, P.d4, P.d5, P.d6, P.moon],          // 5 dusk
  [P.void, P.u1, P.u2, P.u3, P.u4, P.u5, P.u6, P.moon],          // 6 umber
];

// ---------- colour science ----------
const s2l = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const l2s = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
function oklab(r, g, b) { // r,g,b in 0..1 sRGB
  r = s2l(r); g = s2l(g); b = s2l(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromOklab(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [l2s(Math.max(0, Math.min(1, r))), l2s(Math.max(0, Math.min(1, g))), l2s(Math.max(0, Math.min(1, bb)))];
}

// ---------- palette sets ----------
// A palette set is a 32-colour palette (same slots as above), its material ramps (256 steps, interpolated in OKLab
// between palette anchors, so they hue-shift the way the anchors do) and a 64^3 sRGB -> nearest-colour LUT.
// The RPG uses Moonwell 32; other parts of the screen (the desk) can swap in their own set around compose().
// lutN: only the first lutN colours take part in dithering; any after them are UI-only (written by index)
function makePalSet(hexes, rampIdx, lutN = hexes.length) {
  const rgb = hexes.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const lab = rgb.map(([r, g, b]) => oklab(r / 255, g / 255, b / 255));
  const ramps = rampIdx.map((idx) => {
    const t = new Float32Array(256 * 3);
    for (let k = 0; k < 256; k++) {
      const p = (k / 255) * (idx.length - 1), lo = Math.min(idx.length - 2, Math.floor(p)), f = p - lo;
      const A = lab[idx[lo]], Bc = lab[idx[lo + 1]];
      const c = fromOklab(A[0] + (Bc[0] - A[0]) * f, A[1] + (Bc[1] - A[1]) * f, A[2] + (Bc[2] - A[2]) * f);
      t[k * 3] = c[0]; t[k * 3 + 1] = c[1]; t[k * 3 + 2] = c[2];
    }
    return t;
  });
  const lut = new Uint8Array(64 * 64 * 64);
  for (let r = 0; r < 64; r++) for (let g = 0; g < 64; g++) for (let b = 0; b < 64; b++) {
    const L = oklab(r / 63, g / 63, b / 63);
    let best = 0, bd = 1e9;
    for (let k = 0; k < lutN; k++) { const Q = lab[k], dl = (L[0] - Q[0]) * 1.3, da = L[1] - Q[1], db = L[2] - Q[2], d = dl * dl + da * da + db * db; if (d < bd) { bd = d; best = k; } }
    lut[(r << 12) | (g << 6) | b] = best;
  }
  return { PAL: hexes, PAL_RGB: rgb, PAL_LAB: lab, RAMPS: ramps, LUT: lut };
}
let PAL_RGB, PAL_LAB, RAMPS, LUT;
function usePal(set) { PAL = set.PAL; PAL_RGB = set.PAL_RGB; PAL_LAB = set.PAL_LAB; RAMPS = set.RAMPS; LUT = set.LUT; }
// + two UI-only slots after the 32 (kept out of the dither): Flow's yellow and its pale top row (2026-11-20)
const FLOW_Y = '#eadf3a', FLOW_Y2 = '#fbf5a8';
P.flow = 32; P.flowHi = 33;
const PAL_BASE = makePalSet([...PAL, FLOW_Y, FLOW_Y2], RAMP_IDX, 32);
usePal(PAL_BASE);

// Bayer 8x8 ordered-dither thresholds
const BAYER8 = new Float32Array(64);
(function () {
  const M = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  for (let k = 0; k < 64; k++) BAYER8[k] = (M[k] + 0.5) / 64;
})();

// ---------- buffers ----------
let B = null, BW = W, BH = H;
let MAT = 0, EMI = 0, TAG = 0, DXV = 0;
function mkBuf(w, h, frame) {
  const n = w * h;
  const b = { w, h, V: new Float32Array(n), M: new Uint8Array(n), E: new Uint8Array(n), T: new Uint8Array(n), A: new Uint8Array(n), DX: new Int16Array(n) };
  if (frame) { b.I = new Int16Array(n).fill(-1); b.G = new Float32Array(n).fill(1); b.X = new Float32Array(n); }
  return b;
}
function bind(b) { B = b; BW = b.w; BH = b.h; }
function clearFrame(b) { b.V.fill(0); b.M.fill(0); b.E.fill(0); b.T.fill(0); b.A.fill(0); b.DX.fill(0); b.I.fill(-1); b.G.fill(1); b.X.fill(0); }
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sv = (v, x, y) => (typeof v === 'function' ? v(x, y) : v);

// ---------- noise ----------
function hash(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// periodic value noise: lattice wraps every P cells in x (P=0: no wrap)
function vnoise(x, y, s = 0, P = 0) {
  let xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const wx = (q) => (P ? ((q % P) + P) % P : q);
  const a = hash(wx(xi), yi, s), b = hash(wx(xi + 1), yi, s), c = hash(wx(xi), yi + 1, s), d = hash(wx(xi + 1), yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, s = 0, P = 0) { return (vnoise(x, y, s, P) * 0.57 + vnoise(x * 2, y * 2, s + 17, P * 2) * 0.29 + vnoise(x * 4, y * 4, s + 34, P * 4) * 0.14); }

// ordered blend between two materials (used for soft family transitions, e.g. sky -> dusk horizon)
const mixMat = (x, y, a, b, f) => (f > BAYER8[((y & 7) << 3) | (x & 7)] ? b : a);

// ---------- primitives (into bound buffer) ----------
function put(x, y, v, mat = MAT, emi = EMI) {
  x |= 0; y |= 0; if (x < 0 || y < 0 || x >= BW || y >= BH) return;
  const i = y * BW + x; B.V[i] = v; B.M[i] = mat; B.E[i] = emi; B.T[i] = TAG; B.A[i] = 1; B.DX[i] = DXV;
}
function rect(x, y, w, h, v, mat = MAT, emi = EMI) {
  const x0 = Math.max(0, Math.floor(x)), x1 = Math.min(BW, Math.floor(x + w)), y0 = Math.max(0, Math.floor(y)), y1 = Math.min(BH, Math.floor(y + h));
  for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) put(i, j, sv(v, i, j), mat, emi);
}
function ellipse(cx, cy, rx, ry, v, mat = MAT, emi = EMI) {
  for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) {
    const dy = (j + 0.5 - cy) / ry;
    for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) { const dx = (i + 0.5 - cx) / rx; if (dx * dx + dy * dy <= 1) put(i, j, sv(v, i, j), mat, emi); }
  }
}
function poly(pts, v, mat = MAT, emi = EMI) {
  let minY = 1e9, maxY = -1e9; for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  for (let j = Math.floor(minY); j <= Math.ceil(maxY); j++) {
    const sy = j + 0.5, xs = [];
    for (let k = 0; k < pts.length; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length]; if ((y0 <= sy && y1 > sy) || (y1 <= sy && y0 > sy)) xs.push(x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.ceil(xs[k] - 0.5); i <= Math.floor(xs[k + 1] - 0.5); i++) put(i, j, sv(v, i, j), mat, emi);
  }
}
function line(x0, y0, x1, y1, v, mat = MAT, emi = EMI) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (;;) { put(x0, y0, sv(v, x0, y0), mat, emi); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function mulEllipse(cx, cy, rx, ry, f) {
  for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
    if (i < 0 || j < 0 || i >= BW || j >= BH) continue;
    const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) B.V[j * BW + i] *= lerp(f, 1, d * d);
  }
}
const grad = (x0, y0, x1, y1, v0, v1) => { const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1; return (x, y) => lerp(v0, v1, clamp(((x - x0) * dx + (y - y0) * dy) / L)); };
const cyl = (x0, w, lo = 0.35, hi = 0.85) => (x) => lo + (hi - lo) * Math.sin(clamp((x - x0 + 0.5) / w) * Math.PI) * (1 - 0.35 * clamp((x - x0) / w));

// ---------- layers ----------
// copy a (horizontally periodic) layer into the frame with integer offset ox
function blit(F, L, ox, y0 = 0, y1 = L.h, wrap = true) {
  const lw = L.w;
  for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) {
    const row = y * lw, frow = y * W;
    for (let x = 0; x < W; x++) {
      let lx = x + ox; if (wrap) lx = ((lx % lw) + lw) % lw; else if (lx < 0 || lx >= lw) continue;
      const li = row + lx; if (!L.A[li]) continue;
      const i = frow + x; F.V[i] = L.V[li]; F.M[i] = L.M[li]; F.E[i] = L.E[li]; F.T[i] = 0; F.A[i] = 1; F.DX[i] = ox;
    }
  }
}

// ---------- silhouette pass ----------
// actors (tagged sprites: party, interactables, enemies) are separated from the set by: a small value lift,
// a rim of light on their top/left/right edges, the 1 px void outline, and a soft dark halo in the set behind them.
const ACTOR = { lift: 1.08, fill: [0.15, 0.16, 0.2], rimTop: 0.075, rimLeft: 0.05, rimRight: 0.06, halo: 5.5, haloK: 0.4 };
let HALO_D = null;
function outline(F, rim = 0.3) {
  const T = F.T, V = F.V, E = F.E, out = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (T[i]) {
      if (!E[i]) {
        let v = V[i] * ACTOR.lift;
        if (T[i + 1] === 0) { v += rim; F.X[i] += ACTOR.rimRight; } else if (T[i - W] === 0) F.X[i] += ACTOR.rimTop; else if (T[i - 1] === 0) F.X[i] += ACTOR.rimLeft;
        V[i] = clamp(v);
      }
      continue;
    }
    if (T[i - 1] || T[i + 1] || T[i - W] || T[i + W]) out.push(i);
  }
  for (const i of out) { V[i] = 0; F.M[i] = 0; F.E[i] = 1; }
  // halo: chamfer distance from the actors outward, darken the set within ACTOR.halo px (actor bounding box only)
  const R = ACTOR.halo, pad = Math.ceil(R) + 1;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (const i of out) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return;
  x0 = Math.max(1, x0 - pad); x1 = Math.min(W - 2, x1 + pad); y0 = Math.max(1, y0 - pad); y1 = Math.min(H - 2, y1 + pad);
  if (!HALO_D || HALO_D.length !== W * H) HALO_D = new Float32Array(W * H);
  const D = HALO_D;
  for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) { const i = y * W + x; D[i] = T[i] ? 0 : 99; }
  for (const i of out) D[i] = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * W + x; let d = D[i]; if (d === 0) continue;
    const a = D[i - 1] + 1, b = D[i - W] + 1, c = D[i - W - 1] + 1.41, e = D[i - W + 1] + 1.41;
    if (a < d) d = a; if (b < d) d = b; if (c < d) d = c; if (e < d) d = e; D[i] = d;
  }
  for (let y = y1; y >= y0; y--) for (let x = x1; x >= x0; x--) {
    const i = y * W + x; let d = D[i]; if (d === 0) continue;
    const a = D[i + 1] + 1, b = D[i + W] + 1, c = D[i + W + 1] + 1.41, e = D[i + W - 1] + 1.41;
    if (a < d) d = a; if (b < d) d = b; if (c < d) d = c; if (e < d) d = e; D[i] = d;
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x, d = D[i]; if (d > 0 && d < R && !E[i] && !T[i]) V[i] *= 1 - ACTOR.haloK * (1 - d / R) ** 1.5; }
}

// ---------- UI (palette-index) writes ----------
let CLIP = null;
function putI(x, y, idx) {
  x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (CLIP && (x < CLIP[0] || y < CLIP[1] || x >= CLIP[2] || y >= CLIP[3])) return;
  B.I[y * W + x] = idx;
}
function rectI(x, y, w, h, idx) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) putI(i, j, idx); }
function frameI(x, y, w, h, idx) { rectI(x, y, w, 1, idx); rectI(x, y + h - 1, w, 1, idx); rectI(x, y, 1, h, idx); rectI(x + w - 1, y, 1, h, idx); }
function dimRect(x, y, w, h, g) {
  for (let j = Math.max(0, y); j < Math.min(H, y + h); j++) for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) {
    if (CLIP && (i < CLIP[0] || j < CLIP[1] || i >= CLIP[2] || j >= CLIP[3])) continue;
    B.G[j * W + i] = g;
  }
}
function spr(x, y, rows, map) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (map[c] != null) putI(x + i, y + j, map[c]); })); }

// ---------- text (cached glyph masks, crisp at native size) ----------
const FONTS = { silkb: { fam: 'silkb', size: 8, cap: 5 }, silk: { fam: 'silk', size: 8, cap: 5 }, tiny: { fam: 'tiny5', size: 8, cap: 5 }, micro: { fam: 'm5', size: 11, cap: 5 }, tinyL: { fam: 'tiny5', size: 16, cap: 10 }, black: { fam: 'jb9', size: 13, cap: 9 }, head: { fam: 'j10', size: 1400 / 75, cap: 10 } };   // head: Jersey 10 at its native size (a font pixel = a grid pixel), the big headings (#106); tinyL is Tiny5 doubled
let TC = null, TX = null; const TCACHE = new Map();
function glyphs(str, f, ls = 0) {
  const key = f + '|' + ls + '|' + str; let g = TCACHE.get(key); if (g) return g;
  const F = FONTS[f];
  TX.font = `${F.size}px ${F.fam}`; TX.letterSpacing = ls + 'px';
  const w = Math.round(TX.measureText(str).width) - ls;
  TX.clearRect(0, 0, TC.width, TC.height); TX.fillStyle = '#fff'; TX.textBaseline = 'alphabetic'; TX.fillText(str, 4, 40);
  const d = TX.getImageData(0, 0, TC.width, TC.height).data, pts = [];
  for (let j = 0; j < TC.height; j++) for (let i = 0; i < TC.width; i++) if (d[(j * TC.width + i) * 4 + 3] > 127) pts.push(i - 4, j - 40 + F.cap);
  g = { w, pts }; TCACHE.set(key, g); return g;
}
const measure = (s, f, ls = 0) => glyphs(s, f, ls).w;
function text(str, x, y, f, idx, o = {}) {
  const g = glyphs(str, f, o.ls || 0), p = g.pts;
  const x0 = Math.round(o.align === 'c' ? x - g.w / 2 : o.align === 'r' ? x - g.w : x);
  if (o.outline != null) for (let k = 0; k < p.length; k += 2) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) putI(p[k] + x0 + dx, p[k + 1] + y + dy, o.outline);
  if (o.shadow != null) for (let k = 0; k < p.length; k += 2) putI(p[k] + x0 + 1, p[k + 1] + y + 1, o.shadow);
  for (let k = 0; k < p.length; k += 2) putI(p[k] + x0, p[k + 1] + y, idx);
  return g.w;
}

// ---------- compose: light, hue-shifted ramps, quantize ----------
const VIEW = { mode: 'dither', strength: 0.2 }; // mode: 'dither' | 'posterize' | 'source'
// vignette (precomputed): darker corners and ceiling, for chiaroscuro
let VIG = null;
// switch the working viewport (battle area / side panel / map), rebuilds the vignette
const VIG_CACHE = new Map();
function setRes(w, h, vh = h) {
  W = w; H = h; const key = w + 'x' + h + ':' + vh; VIG = VIG_CACHE.get(key);
  if (VIG) return;
  VIG = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const nx = (x - W / 2) / (W / 2), ny = (y - vh * 0.6) / (vh / 2); VIG[y * W + x] = 1 - 0.55 * clamp(nx * nx * 0.55 + ny * ny * 0.5 - 0.12); }
  VIG_CACHE.set(key, VIG);
}
setRes(W, H);
function compose(F, img, lights, ambient, tintK = 0.4, vig = 0) {
  const D = img.data, str = VIEW.mode === 'posterize' ? 0 : VIEW.strength, src = VIEW.mode === 'source';
  const nl = lights.length;
  for (const l of lights) {
    l.r2 = l.r * l.r; l.sy = l.sy || 1; const c = l.c, s = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15; l.n = [c[0] / s, c[1] / s, c[2] / s];
    if (l.beam) { l.dx = l.x1 - l.x; l.dy = l.y1 - l.y; l.len2 = l.dx * l.dx + l.dy * l.dy; }
  }
  const aS = ambient[0] * 0.3 + ambient[1] * 0.55 + ambient[2] * 0.15;
  const RL = []; let nl2 = 0;
  for (let y = 0; y < H; y++) {
  // cull lights to the ones that can reach this row
  nl2 = 0;
  for (let k = 0; k < nl; k++) {
    const l = lights[k];
    if (l.beam) { if (y + 0.5 >= Math.min(l.y, l.y1) - l.w && y + 0.5 <= Math.max(l.y, l.y1) + l.w) RL[nl2++] = l; }
    else if (Math.abs(y + 0.5 - l.y) * l.sy < l.r) RL[nl2++] = l;
  }
  for (let x = 0; x < W; x++) {
    const i = y * W + x, o = i * 4;
    const ui = F.I[i];
    if (ui >= 0) { const c = PAL_RGB[ui]; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255; continue; }
    let v = F.V[i], tr = 1, tg = 1, tb = 1, air = 0;
    if (!F.E[i]) {
      let Lr = ambient[0], Lg = ambient[1], Lb = ambient[2];
      if (F.LM) { const k3 = i * 3; Lr += F.LM[k3]; Lg += F.LM[k3 + 1]; Lb += F.LM[k3 + 2]; }
      for (let k = 0; k < nl2; k++) {
        const l = RL[k];
        if (l.beam) {
          const px = x + 0.5 - l.x, py = y + 0.5 - l.y, u = (px * l.dx + py * l.dy) / l.len2;
          if (u < 0 || u > 1) continue;
          const qx = px - u * l.dx, qy = py - u * l.dy, w = l.w * (0.55 + 0.45 * u), d = Math.sqrt(qx * qx + qy * qy);
          if (d < w) { let f = 1 - d / w; f = f * Math.sqrt(f) * l.i; Lr += l.n[0] * f; Lg += l.n[1] * f; Lb += l.n[2] * f; air += f * l.air; }
          continue;
        }
        const dx = x + 0.5 - l.x; if (dx > l.r || dx < -l.r) continue;
        const dy = (y + 0.5 - l.y) * l.sy, d2 = dx * dx + dy * dy;
        if (d2 < l.r2) { let f = 1 - Math.sqrt(d2) / l.r; f = f * f * l.i; Lr += l.n[0] * f; Lg += l.n[1] * f; Lb += l.n[2] * f; }
      }
      if (F.T[i]) { Lr += ACTOR.fill[0]; Lg += ACTOR.fill[1]; Lb += ACTOR.fill[2]; }
      let Ls = Lr * 0.3 + Lg * 0.55 + Lb * 0.15;
      const Lk = Ls > 0.85 ? 0.85 + (Ls - 0.85) / (1 + (Ls - 0.85) * 1.6) : Ls;
      Lr *= Lk / Ls; Lg *= Lk / Ls; Lb *= Lk / Ls; Ls = Lk;
      v = v * Ls + air;
      if (Ls > 0) { tr = 1 + (Lr / Ls - 1) * tintK; tg = 1 + (Lg / Ls - 1) * tintK; tb = 1 + (Lb / Ls - 1) * tintK; }
    }
    v += F.X[i]; v *= F.G[i]; if (vig && F.E[i] !== 2) v *= VIG[i];
    const R = RAMPS[F.M[i]] || RAMPS[0], k = (v <= 0 ? 0 : v >= 1 ? 255 : (v * 255) | 0) * 3;
    let r = R[k] * tr, g = R[k + 1] * tg, b = R[k + 2] * tb;
    if (src) { D[o] = clamp(r) * 255; D[o + 1] = clamp(g) * 255; D[o + 2] = clamp(b) * 255; D[o + 3] = 255; continue; }
    const t = (BAYER8[((y & 7) << 3) | ((x + F.DX[i]) & 7)] - 0.5) * str;
    r += t; g += t; b += t;
    const ri = r <= 0 ? 0 : r >= 1 ? 63 : (r * 63 + 0.5) | 0, gi = g <= 0 ? 0 : g >= 1 ? 63 : (g * 63 + 0.5) | 0, bi = b <= 0 ? 0 : b >= 1 ? 63 : (b * 63 + 0.5) | 0;
    const q = LUT[(ri << 12) | (gi << 6) | bi];
    const c = PAL_RGB[q]; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255;
  }
  }
}
