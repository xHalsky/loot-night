// ===========================================================================
// The cuddle break (redesign of the build's cuddle minigame, docs/design/her.md). The build gives the content and the
// rules: she asks you over, a dot drifts once round a heart over 12 s (her slow breathing); keep the cursor within 17 px
// (34 CSS px) of it; warmth builds near it, drains when far, drops fast if the mouse rushes (over 450 px/s here, the
// build's 900 CSS px/s), "too fast!"; 60% warmth at the end passes; the close box is pulling away. The look is hers:
// her panel's 16 PC-98 colours, a night-plum window with her name on a pink tab (like the caught screen's window), the
// heart as a stitched line that fills in rose behind the dot, the window glowing warmer as warmth builds, your hand
// as the cursor. Over the right screen, which dims behind it like the energy break.
// ===========================================================================
const CUD = { x: 112, y: 20, w: 268, h: 204 };            // the window, right-screen px
const CUD_SEC = 12, CUD_R = 17, CUD_PASS = 0.6, CUD_JERK = 450;
const CUD_FIELD = { x: 6, y: 25, w: 256, h: 152 };        // the heart's field inside the window
// the heart in window px, p 0..1 (the build's curve, halved to the grid)
function cudDot(p) {
  const a = p * Math.PI * 2, x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
  return [CUD_FIELD.x + CUD_FIELD.w / 2 + x * 4.5, CUD_FIELD.y + CUD_FIELD.h / 2 - 9 - y * 3.75];
}
// the heart as one clean 1 px line: dense samples, consecutive duplicates dropped, L-corners removed
const CUD_PATH = (() => {
  const pts = [];
  for (let k = 0; k <= 4000; k++) {
    const [x, y] = cudDot(k / 4000), q = [Math.round(x), Math.round(y), k / 4000], l = pts[pts.length - 1];
    if (!l || l[0] !== q[0] || l[1] !== q[1]) pts.push(q);
  }
  for (let i = 1; i < pts.length - 1; i++) {   // an L-corner: the neighbours touch diagonally, so the middle pixel is extra
    const a = pts[i - 1], c = pts[i + 1];
    if (Math.abs(a[0] - c[0]) === 1 && Math.abs(a[1] - c[1]) === 1) { pts.splice(i, 1); i--; }
  }
  return pts;
})();
const CUD_GLYPH = {
  heart5: ['.x.x.', 'xxxxx', '.xxx.', '..x..'],
  heart9: ['.xx...xx.', 'xxxx.xxxx', 'xxxxxxxxx', 'xxxxxxxxx', '.xxxxxxx.', '..xxxxx..', '...xxx...', '....x....'],
  hand: ['...oo.....', '..o##o.o..', '..o##oo#o.', 'o.o##o##o.', 'ooo##o##oo', 'o#o##o##o#o', 'o##########o', '.o#########o', '.o########o.', '..o######o..', '...o####o...', '...oooooo...'],
};
function cudGlyph(rows, x, y, map) { rows.forEach((r, j) => [...r].forEach((c, i) => { const v = map[c]; if (v != null) putI(x + i, y + j, v); })); }
// a heart with a plum edge and a moon shine, from a mask
function cudHeart(rows, x, y, body, edge, shine) {
  const h = rows.length, w = rows[0].length, at = (i, j) => j >= 0 && j < h && i >= 0 && i < w && rows[j][i] === 'x';
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (at(i, j)) putI(x + i, y + j, !at(i - 1, j) || !at(i + 1, j) || !at(i, j - 1) || !at(i, j + 1) ? edge : body);
  if (shine != null) { putI(x + 2, y + 1, shine); putI(x + 1, y + 2, shine); }
}
let CUD_BUF = null, CUD_CANVAS = null;
// st: { p: 0..1 round the heart, warmth: 0..1, mx, my: the cursor in window px (null: off the window), jerk: s left of
// "too fast", near: cursor within the ring }. Hearts that float up are seeded from t, so a still is repeatable.
function cuddleWindow(st, t) {
  const { w, h } = CUD;
  if (!CUD_BUF) { CUD_BUF = mkBuf(w + 2, h + 12, true); CUD_CANVAS = document.createElement('canvas'); CUD_CANVAS.width = w + 2; CUD_CANVAS.height = h + 12; }
  setRes(w + 2, h + 12); CLIP = null; const F = CUD_BUF; F.I.fill(-1); bind(F);
  const oy = 9;   // room for her name tab above the window
  // the window: night plum with a lilac edge and a purple bevel, a void shadow (the caught screen's text window)
  win9(0, oy, w, h, { fill: C9.plum, hi: C9.purple, lo: C9.void, edge: C9.lilac });
  // her name on a pink tab
  win9(10, 0, 42, 13, { fill: C9.pink, hi: C9.skin, lo: C9.rose, edge: C9.plum, shadow: false });
  heart9(14, 3, true); text('Babe', 24, 3, 'tiny', C9.plum);
  // the title, the hint, the close box (pulling away: she won't like it)
  text('Cuddle break', 9, oy + 5, 'tinyL', C9.skin, { shadow: C9.void });
  text('stay on her breathing, slowly', 9 + measure('Cuddle break', 'tinyL') + 7, oy + 10, 'tiny', C9.lilac);
  win9(w - 17, oy + 5, 12, 12, { fill: C9.plum, hi: C9.purple, lo: C9.void, edge: C9.lilac, shadow: false });
  [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 4], [1, 3], [3, 1], [4, 0]].forEach(([i, j]) => putI(w - 13 + i, oy + 9 + j, C9.crimson));
  // the field: plum; inside the heart, warmth: plum and purple at first, purple, then rose once she's warm enough
  const fx = CUD_FIELD.x, fy = CUD_FIELD.y + oy, fw = CUD_FIELD.w, fh = CUD_FIELD.h, wm = clamp(st.warmth);
  rectI(fx, fy, fw, fh, C9.plum);
  const inside = cudInside(), tone = wm >= CUD_PASS ? 2 : wm >= 0.3 ? 1 : 0;
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
    if (!inside[(CUD_FIELD.y + j) * CUD.w + CUD_FIELD.x + i]) continue;
    const x = fx + i, y = fy + j, ck = (x + y) & 1;
    putI(x, y, tone === 0 ? (ck ? C9.purple : C9.plum) : tone === 1 ? C9.purple : (ck ? C9.rose : C9.purple));
  }
  for (let i = fx; i < fx + fw; i++) { putI(i, fy - 1, C9.purple); putI(i, fy + fh, C9.purple); }
  // the heart: a stitched line ahead of the dot; behind it the line fills in rose with a purple glow
  const n = CUD_PATH.length, at = Math.round(clamp(st.p) * (n - 1));
  for (let k = 0; k < n; k++) {
    const [x, y] = CUD_PATH[k], px = x, py = y + oy;
    if (k <= at) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = F.I[(py + dy) * (w + 2) + px + dx]; if (q === C9.plum || q === C9.purple) putI(px + dx, py + dy, C9.purple); } }
  }
  for (let k = 0; k < n; k++) {
    const [x, y] = CUD_PATH[k];
    if (k <= at) putI(x, y + oy, C9.rose);
    else if ((k >> 1) % 2 === 0) putI(x, y + oy, C9.lilac);   // stitches: 2 on, 2 off
  }
  // the dot: her breath. The ring is how close you must stay; it breathes with her (4 s a breath)
  const [dx0, dy0] = cudDot(st.p), breath = 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 4);
  const jx = st.jerk > 0 ? Math.round(Math.sin(t * 70) * 1.5) : 0;
  const cx = Math.round(dx0) + jx, cy = Math.round(dy0) + oy, R = CUD_R + (breath > 0.5 ? 1 : 0);
  const ringC = st.jerk > 0 ? C9.crimson : st.near ? C9.rose : C9.lilac;
  for (let a = 0; a < 360; a += 0.5) {
    const x = Math.round(cx + R * Math.cos((a * Math.PI) / 180)), y = Math.round(cy + R * Math.sin((a * Math.PI) / 180));
    if (st.near || st.jerk > 0 || (Math.floor(a / 9) & 1) === 0) putI(x, y, ringC);
  }
  if (st.near) for (let j = -6; j <= 6; j++) for (let i = -7; i <= 7; i++) if (i * i / 49 + j * j / 36 <= 1 && ((cx + i + cy + j) & 1)) { const q = F.I[(cy + j) * (w + 2) + cx + i]; if (q === C9.plum) putI(cx + i, cy + j, C9.purple); }
  if (breath > 0.5) cudHeart(CUD_GLYPH.heart9, cx - 4, cy - 4, st.jerk > 0 ? C9.crimson : C9.rose, C9.plum, C9.moon);
  else cudHeart(heartRows7(), cx - 3, cy - 3, st.jerk > 0 ? C9.crimson : C9.rose, C9.plum, C9.moon);
  // near: small hearts float up from her, a new one every 0.45 s, each for 1.6 s
  if (st.near) for (let k = 0; k < 4; k++) {
    const age = ((t + k * 0.45) % 1.8), seed = Math.floor((t + k * 0.45) / 1.8) * 7 + k;
    if (age > 1.6) continue;
    const hx = cx + Math.round(Math.sin(seed * 2.3) * 9 + Math.sin(age * 4 + seed) * 2), hy = cy - 8 - Math.round(age * 15);
    cudHeart(CUD_GLYPH.heart5, hx - 2, hy, age < 0.9 ? C9.pink : C9.purple, age < 0.9 ? C9.rose : C9.plum, null);
  }
  if (st.jerk > 0) text('too fast!', cx, cy - R - 12, 'tiny', C9.crimson, { align: 'c', outline: C9.void });
  // your hand: the cursor
  if (st.mx != null) cudGlyph(CUD_GLYPH.hand, Math.round(st.mx) - 5, Math.round(st.my) + oy - 6, { o: C9.brown, '#': C9.skin });
  // the foot: warmth (the 60% mark wears a little heart that fills once you're past it), the seconds left
  const by = oy + h - 17, bx = 46, bw = w - 46 - 34;
  text('warmth', 9, by, 'tiny', C9.beige);
  const pass = wm >= CUD_PASS, fillC = st.jerk > 0 ? C9.crimson : pass ? C9.rose : C9.lilac;
  for (let j = 0; j < 7; j++) for (let i = 0; i < bw; i++) {
    if ((i === 0 || i === bw - 1) && (j === 0 || j === 6)) continue;
    const edge = j === 0 || j === 6 || i === 0 || i === bw - 1, filled = i - 1 < Math.round((bw - 2) * wm);
    putI(bx + i, by + j, edge ? C9.purple : filled ? (j === 1 ? C9.moon : fillC) : ((bx + i + by + j) & 1) ? C9.plum : C9.void);
  }
  const mxk = bx + 1 + Math.round((bw - 2) * CUD_PASS);
  for (let j = -1; j <= 7; j++) putI(mxk, by + j, C9.beige);
  cudHeart(CUD_GLYPH.heart5, mxk - 2, by - 6, pass ? C9.rose : C9.plum, pass ? C9.skin : C9.lilac, null);
  text(st.secs != null ? st.secs + ' s' : Math.max(1, Math.ceil(CUD_SEC * (1 - st.p))) + ' s', w - 9, by, 'tiny', C9.beige, { align: 'r' });
  // out
  const W2 = w + 2, H2 = h + 12, ctx = CUD_CANVAS.getContext('2d'), img = ctx.createImageData(W2, H2), D = img.data;
  for (let k = 0; k < W2 * H2; k++) { const q = F.I[k]; if (q < 0) continue; const c = PC98_RGB[q]; D[k * 4] = c[0]; D[k * 4 + 1] = c[1]; D[k * 4 + 2] = c[2]; D[k * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return CUD_CANVAS;
}
// which window pixels lie inside the heart (even-odd against its line), once
let CUD_IN = null;
function cudInside() {
  if (CUD_IN) return CUD_IN;
  const m = new Uint8Array(CUD.w * CUD.h), P2 = CUD_PATH;
  for (let y = 0; y < CUD.h; y++) {
    const xs = [];
    for (let k = 0; k < P2.length; k++) { const a = P2[k], b = P2[(k + 1) % P2.length]; if ((a[1] <= y + 0.01) !== (b[1] <= y + 0.01)) xs.push(a[0] + ((y + 0.01 - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] + 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) if (x >= 0 && x < CUD.w) m[y * CUD.w + x] = 1;
  }
  return (CUD_IN = m);
}
const heartRows7 = () => ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'];
// dim the right screen behind a window (the energy break's way: each colour x 0.42 back into the desk palette, a soft
// shadow round the window)
function dimRS(ctx, x, y, w, h) {
  const img = ctx.getImageData(0, 0, RS_W, RS_H), D = img.data, lut = deskSet('graphite').LUT;
  for (let j = 0; j < RS_H; j++) for (let i = 0; i < RS_W; i++) {
    const ex = Math.max(x + 3 - i - 0.5, i + 0.5 - (x + w + 3), 0), ey = Math.max(y + 5 - j - 0.5, j + 0.5 - (y + h + 5), 0), d = Math.hypot(ex, ey);
    const k = 0.42 * (d < 8 ? 0.55 + 0.45 * (d / 8) : 1), o = (j * RS_W + i) * 4, th = (BAYER8[((j & 7) << 3) | (i & 7)] - 0.5) * 0.06;
    const r = (D[o] / 255) * k + th, g = (D[o + 1] / 255) * k + th, b = (D[o + 2] / 255) * k + th;
    const q = lut[((r <= 0 ? 0 : r >= 1 ? 63 : (r * 63 + 0.5) | 0) << 12) | ((g <= 0 ? 0 : g >= 1 ? 63 : (g * 63 + 0.5) | 0) << 6) | (b <= 0 ? 0 : b >= 1 ? 63 : (b * 63 + 0.5) | 0)], c = EB_RGB[q];
    D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2];
  }
  ctx.putImageData(img, 0, 0);
}
// onto the right screen's canvas
function drawCuddle(ctx, st, t) {
  dimRS(ctx, CUD.x, CUD.y, CUD.w, CUD.h + 9);
  ctx.drawImage(cuddleWindow(st, t), CUD.x, CUD.y - 9);
}
// the rules (the build's), for the page: step the state by dt with the cursor at mx, my (window px)
function cuddleStep(st, dt, mx, my) {
  st.time = (st.time || 0) + dt; st.p = clamp(st.time / CUD_SEC);
  const sp = st.lmx == null || mx == null ? 0 : Math.hypot(mx - st.lmx, my - st.lmy) / Math.max(dt, 1e-3);
  st.lmx = mx; st.lmy = my; st.mx = mx; st.my = my;
  st.jerk = sp > CUD_JERK ? 0.4 : Math.max(0, (st.jerk || 0) - dt);
  const [dx, dy] = cudDot(st.p);
  st.near = mx != null && Math.hypot(mx - dx, my - dy) < CUD_R;
  st.warmth = clamp((st.warmth ?? 0.3) + (st.jerk > 0 ? -0.5 : st.near ? 0.16 : -0.1) * dt);
  st.done = st.p >= 1;
  return st;
}

// ---------------------------------------------------------------- live (V9, #74): the game's cuddle
// The rules stay the game's (systems/cuddle.ts, in the build's units, twice the grid's); the view comes in window px.
// bg: the right screen to dim behind the window (four times a second, as under the energy break), or null to keep it.
let CUD_BG = null, CUD_OUT = null;
function drawCuddleLive(bg, st, t) {
  if (!CUD_OUT) { CUD_OUT = document.createElement('canvas'); CUD_OUT.width = RS_W; CUD_OUT.height = RS_H; }
  if (bg) {
    if (!CUD_BG) { CUD_BG = document.createElement('canvas'); CUD_BG.width = RS_W; CUD_BG.height = RS_H; }
    const b = CUD_BG.getContext('2d', { willReadFrequently: true }); b.drawImage(bg, 0, 0); dimRS(b, CUD.x, CUD.y, CUD.w, CUD.h + 9);
  }
  const ctx = CUD_OUT.getContext('2d');
  if (CUD_BG) ctx.drawImage(CUD_BG, 0, 0); else { ctx.fillStyle = EB_PAL[P.void]; ctx.fillRect(0, 0, RS_W, RS_H); }
  ctx.drawImage(cuddleWindow(st, t), CUD.x, CUD.y - 9);
  return { canvas: CUD_OUT, hits: [{ x: CUD.x + CUD.w - 17, y: CUD.y + 5, w: 12, h: 12, act: 'cuddleQuit', arg: '', tip: 'cuddleQuit' }] };
}
