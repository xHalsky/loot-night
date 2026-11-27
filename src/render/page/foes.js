// ===========================================================================
// AGE OF JUDGMENT (the v2 redesign): the rest of the roster and the crypt's iron angel statue. Approved 2026-11-27.
// Every enemy the build can show gets the world's look. The Church's crypt under Ravenhold: its prisoners and its
// keepers, and what grows on the angel's light. Facing left (toward the party), lit from the upper left.
//   Bat → the Ironwing or the Vigil (rolled per bat) · Brute → Gravedigger · Ogre → the Gaoler
//   Warlock → the Bellringer · Black Knight → the Inquisitor · Troll (the curio and its fight) → the Abbot
// Draw order follows depth in every pose; attacks are wind-up, a fast hit, recovery (strikeTimeline).
// ===========================================================================

// ---------------------------------------------------------------- shared helpers
const lgB = (x, y) => BAYER8[((y & 7) << 3) | (x & 7)];
// a polygon fill whose value function may return null to leave a pixel empty (tears, holes)
function polyF(pts, f, mat = MAT, emi = EMI) {
  let minY = 1e9, maxY = -1e9; for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  for (let j = Math.floor(minY); j <= Math.ceil(maxY); j++) {
    const sy = j + 0.5, xs = [];
    for (let k = 0; k < pts.length; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length]; if ((y0 <= sy && y1 > sy) || (y1 <= sy && y0 > sy)) xs.push(x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.ceil(xs[k] - 0.5); i <= Math.floor(xs[k + 1] - 0.5); i++) { const v = f(i, j); if (v != null) put(i, j, v, mat, emi); }
  }
}
// a frame turned by angle a about (sx, sy) and mirrored by side: P(u, v) to the screen, L(x, y) back to (u, v)
function wingFrame(sx, sy, side, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return { P: (u, v) => [sx + side * (u * c - v * s), sy + (u * s + v * c)], L: (x, y) => { const X = (x + 0.5 - sx) * side, Yy = y + 0.5 - sy; return [X * c + Yy * s, -X * s + Yy * c]; } };
}
// two-bone reach: the elbow for a shoulder, a hand and the two lengths; bend picks the side the elbow goes to
function ik2(sx, sy, hx, hy, L1, L2, bend) {
  const dx = hx - sx, dy = hy - sy, D = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01) || 0.01;
  const a = Math.acos(clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1)), an = Math.atan2(dy, dx) + bend * a;
  return [sx + Math.cos(an) * L1, sy + Math.sin(an) * L1];
}
// a thick iron bar along a path, lit along its top-left
function ironBar(pts, w, d = 1, gilt = false) {
  for (let k = 1; k < pts.length; k++) limb(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], w, w, 0.1 * d, 0.62 * d, M_STONE);
  for (let k = 1; k < pts.length; k++) { const [ax, ay] = pts[k - 1], [bx, by] = pts[k], L = Math.hypot(bx - ax, by - ay) || 1, nx = (by - ay) / L, ny = -(bx - ax) / L, o = (ny < 0 ? 1 : -1) * (w / 2 - 0.5);
    line(ax + nx * o, ay + ny * o, bx + nx * o, by + ny * o, gilt ? 0.88 * d : 0.92 * d, gilt ? M_UMBER : M_STONE); }
}
function rimPoly(pts, grow = 1.3, v = 0.01, mat = M_DUSK) {
  const cx0 = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy0 = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  poly(pts.map(([x, y]) => { const dx = x - cx0, dy = y - cy0, L = Math.hypot(dx, dy) || 1; return [x + dx / L * grow, y + dy / L * grow]; }), v, mat);
}
function frameLine2(x, y, w, h, hi, lo, mat) { for (let i = x; i < x + w; i++) { put(i, y, hi, mat); put(i, y + h - 1, lo, mat); } for (let j = y; j < y + h; j++) { put(x, j, hi, mat); put(x + w - 1, j, lo, mat); } }
function chainLinks(pts, d = 1) {   // iron links along a path, alternating face-on and edge-on
  let k = 0;
  for (let s = 1; s < pts.length; s++) {
    const [ax, ay] = pts[s - 1], [bx, by] = pts[s], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 3));
    for (let j = 0; j < n; j++) { const x = Math.round(lerp(ax, bx, j / n)), y = Math.round(lerp(ay, by, j / n)); if (k++ & 1) { put(x, y, 0.75 * d, M_STONE); put(x + 1, y, 0.4 * d, M_STONE); } else { put(x - 1, y, 0.62 * d, M_STONE); put(x + 1, y, 0.3 * d, M_STONE); put(x, y - 1, 0.7 * d, M_STONE); put(x, y + 1, 0.25 * d, M_STONE); put(x, y, 0.03, M_DUSK); } }
  }
}
const sag = (ax, ay, bx, by, drop, n = 16) => Array.from({ length: n + 1 }, (_, k) => { const q = k / n; return [lerp(ax, bx, q), lerp(ay, by, q) + Math.sin(q * Math.PI) * drop]; });
// a dented iron lantern on a short chain: a warm light (pushed to AOJ.lamps)
function cageLantern(lx, ly, d = 1) {
  chainLinks([[lx + 2, ly - 5], [lx + 2, ly - 1]], d);
  rect(lx, ly, 5, 7, 0.04, M_DUSK); rect(lx + 1, ly + 1, 3, 5, 0.95, M_UMBER, 1); put(lx + 2, ly + 3, 1, M_UMBER, 1);
  for (const x of [lx, lx + 2, lx + 4]) for (let y = ly; y < ly + 7; y++) put(x, y, x === lx ? 0.86 * d : x === lx + 2 ? 0.5 * d : 0.3 * d, M_STONE);
  rect(lx - 1, ly - 1, 7, 1, 0.74 * d, M_STONE); rect(lx, ly - 2, 5, 1, 0.5 * d, M_STONE); rect(lx - 1, ly + 7, 7, 1, 0.34 * d, M_STONE); put(lx + 2, ly + 8, 0.5 * d, M_STONE);
  AOJ.lamps = AOJ.lamps || []; AOJ.lamps.push([lx + 2, ly + 3]);
}


// ---------------------------------------------------------------- the Ironwing (replaces the bat) · option A
// When the crypt's bats died on the angel's poisoned light, the Church's smiths rebuilt them in angel iron: an iron
// skull with blade ears and fangs, a cage of ribs round a crimson heart-lens, wings of iron finger-struts with black
// leather stretched between them, torn and patched; hooked talons. Old: its joints spit sparks.
function ironwing(cx, cy, t, n = 0, d = 1) {
  const fr = Math.floor(t * 12 + n * 1.7) % 4, A = [-0.85, -0.28, 0.45, -0.28][fr];
  const Y = Math.round(cy + Math.sin(t * 4 + n * 2.1) * 2 + (fr === 2 ? 1 : 0));
  const WR = [8, -5], FT = [[21, -7], [23, 2], [18, 8], [10, 10]];
  const wing = (side, dd) => {
    const F = wingFrame(cx + side * 4, Y - 1, side, A * (side < 0 ? 1 : 0.88)), lit = side < 0 ? 1 : 0.7;
    const pts = [[0, 3], WR, FT[0]];
    for (let k = 1; k < FT.length; k++) { const [ax, ay] = FT[k - 1], [bx, by] = FT[k]; pts.push([lerp((ax + bx) / 2, WR[0], 0.32), lerp((ay + by) / 2, WR[1], 0.32)]); pts.push(FT[k]); }
    pts.push([5, 8]); pts.push([1, 6]);
    const segD = (u, v, ax, ay, bx, by) => { const L2 = (bx - ax) ** 2 + (by - ay) ** 2, q = clamp(((u - ax) * (bx - ax) + (v - ay) * (by - ay)) / L2); return Math.hypot(u - ax - q * (bx - ax), v - ay - q * (by - ay)); };
    polyF(pts.map(([u, v]) => F.P(u, v)), (x, y) => {
      const [u, v] = F.L(x, y); if (u > 9 && v > 0 && vnoise(u / 2, v / 2, 1201 + n) > 0.83) return null;   // tears
      const near = Math.min(...FT.map(([fx, fy2]) => segD(u, v, WR[0], WR[1], fx, fy2)), segD(u, v, 0, 0, WR[0], WR[1]));
      return (0.2 + 0.16 * clamp(1 - near / 3.5) * lit + 0.12 * clamp((6 - v) / 14) * lit - ((Math.round(u * 0.7) + Math.round(v)) % 4 === 0 ? 0.04 : 0)) * dd;
    }, M_DUSK);
    { const [px, py] = F.P(14, 3); rect(Math.round(px) - 1, Math.round(py) - 1, 3, 3, 0.36 * dd, M_UMBER); put(Math.round(px) - 1, Math.round(py) - 1, 0.9 * dd, M_STONE); put(Math.round(px) + 1, Math.round(py) + 1, 0.7 * dd, M_STONE); }
    const S0 = F.P(0, 0), W0 = F.P(...WR);
    for (const [k, [fx, fy2]] of FT.entries()) { const [ex, ey] = F.P(fx, fy2); limb(W0[0], W0[1], ex, ey, 2.2, 1.2, 0.12 * dd, (k === 0 ? 0.74 : 0.5) * dd, M_STONE); const [hx, hy] = F.P(fx + 1.2, fy2 + 2); put(Math.round(hx), Math.round(hy), 0.86 * dd, M_STONE); }
    limb(S0[0], S0[1], W0[0], W0[1], 4, 3, 0.14 * dd, 0.82 * dd, M_STONE);
    { const [rx, ry] = F.P(3, -1.5), [rx2, ry2] = F.P(6, -3.5); put(Math.round(rx), Math.round(ry), 0.98 * dd, M_STONE); put(Math.round(rx2), Math.round(ry2), 0.98 * dd, M_STONE); }
    for (let a = 0; a < 12; a++) { const an = a / 12 * Math.PI * 2; put(Math.round(W0[0] + Math.cos(an) * 2.7), Math.round(W0[1] + Math.sin(an) * 2.7), (a & 1 ? 0.24 : 0.7) * dd, M_STONE); }
    ironJoint(Math.round(W0[0]), Math.round(W0[1]), 2, dd);
    { const [t1x, t1y] = F.P(WR[0] - 1, WR[1] - 5), [t2x, t2y] = F.P(WR[0] - 3, WR[1] - 6); line(W0[0], W0[1], t1x, t1y, 0.86 * dd, M_STONE); put(Math.round(t2x), Math.round(t2y), 0.95 * dd, M_STONE); }
    return W0;
  };
  const Wf = wing(1, 0.64 * d);
  // the body: a cage of ribs round the crimson heart-lens, the spine rod
  ellipse(cx + 0.5, Y + 2.5, 4.4, 5.6, 0.03, M_DUSK);
  rect(cx - 1, Y + 1, 3, 3, 0.66, M_DANGER, 1); eyeLight(cx, Y + 2, t, n + 41, true); put(cx, Y + 2, 1, M_DANGER, 1);
  for (let k = 0; k < 3; k++) { const yy = Y - 1 + k * 3; for (const sd of [-1, 1]) { for (let s2 = 0; s2 <= 4 - k * 0.6; s2 += 0.5) { const x = Math.round(cx + 0.5 + sd * s2), y = Math.round(yy + s2 * 0.45); put(x, y, (sd < 0 ? 0.92 - s2 * 0.05 : 0.5) * d, M_STONE); } } }
  ironRod(cx + 1, Y - 3, cx + 1, Y + 9, 1.8, d);
  for (const [sd, dd] of [[1, 0.6], [-1, 1]]) { const fx = cx + 1 + sd * 2, tx = fx + sd + Math.round(Math.sin(t * 3 + n) * 0.6); limb(fx, Y + 8, tx, Y + 12, 2, 1.4, 0.1 * dd * d, 0.6 * dd * d, M_STONE); put(tx - 1, Y + 13, 0.92 * dd * d, M_STONE); put(tx - 2, Y + 12, 0.8 * dd * d, M_STONE); put(tx + 1, Y + 13, 0.7 * dd * d, M_STONE); put(tx + 2, Y + 12, 0.5 * dd * d, M_STONE); }
  // the head: an iron skull, tall blade ears, open jaws with iron fangs, two embers
  const hx = cx, hy = Y - 7;
  for (const [ex, tip, dd] of [[hx + 3, [hx + 6, hy - 13], 0.62], [hx - 3, [hx - 5, hy - 13], 1]]) poly([[ex - 2, hy - 3], [ex + 2, hy - 3], tip], (x) => clamp(0.2 + 0.72 * clamp((ex + 1 - x) / 4)) * dd * d, M_STONE);
  const SK = [[hx - 6, hy - 4], [hx + 6, hy - 4], [hx + 7, hy + 1], [hx + 3, hy + 5], [hx - 4, hy + 5], [hx - 8, hy + 2]];
  plate(SK, 0.18 * d, 0.86 * d, M_STONE, { edgeHi: 0.98 * d });
  for (const ex of [hx - 5, hx]) { rect(ex, hy - 2, 3, 2, 0.02, M_DUSK); put(ex + 1, hy - 2, 0.95, M_DANGER, 1); put(ex, hy - 2, 0.7, M_DANGER, 1); put(ex + 1, hy - 1, 0.5, M_DANGER, 1); }
  eyeLight(hx - 4, hy - 2, t, n + 3, false); eyeLight(hx + 1, hy - 2, t, n + 5, false);
  line(hx - 1, hy - 3, hx - 1, hy + 2, 0.1 * d, M_STONE);
  rect(hx - 6, hy + 3, 8, 3, 0.02, M_DUSK);
  for (const x of [hx - 6, hx - 4, hx - 1, hx + 1]) put(x, hy + 3, 0.96 * d, M_STONE);
  for (const x of [hx - 5, hx - 2]) put(x, hy + 5, 0.9 * d, M_STONE);
  plate([[hx - 6, hy + 6], [hx + 3, hy + 6], [hx + 2, hy + 8], [hx - 5, hy + 8]], 0.16 * d, 0.6 * d, M_STONE);
  rivets(hx - 4, hy - 4, hx + 4, hy - 4, 3, 0.98 * d); rustPatch(hx + 1, hy - 3, 5, 6, 1241 + n, 0.6);
  const Wn = wing(-1, d);
  for (const [W0, k] of [[Wn, 0], [Wf, 1]]) { const ph = (t * 1.7 + n * 0.31 + k * 0.5) % 1; if (ph < 0.32) for (let s = 0; s < 3; s++) { const q = ph / 0.32, x = Math.round(W0[0] + (s - 1) * 2 * q + (k ? 1 : -1) * q * 2), y = Math.round(W0[1] + q * q * 8 + s); put(x, y, 0.95 - q * 0.4, M_UMBER, 1); } }
  EFX.moth = [cx, Y];
}

// ---------------------------------------------------------------- the Vigil (replaces the bat) · option B
// An old flying watcher of the Church: a riveted iron drum held up by a rotor of three iron feathers. Its face is one
// window, rimmed by the broken halo in gilt, and in it a fallen angel's crimson eye that follows you; an iron shutter
// blinks over it. Two iron feather-fins steady it; three hooked blades swing under it on chains. Old and bent: a
// nicked rotor blade, rust, smoke and sparks from the hub.
function vigil(cx, cy, t, n = 0, d = 1) {
  const Y = Math.round(cy + Math.sin(t * 2.6 + n * 1.9) * 2.2), sw = Math.sin(t * 2.1 + n * 1.3), hubY = Y - 17;
  const spin = t * 17 + n * 1.3;
  for (let a = 0; a < 110; a++) { const an = a / 110 * Math.PI * 2, x = Math.round(cx + Math.cos(an) * 18), y = Math.round(hubY + Math.sin(an) * 3); if (lgB(x, y) < 0.4) put(x, y, 0.4 * d, M_STONE); }
  const blades = (front) => { for (let k = 0; k < 3; k++) {
    const an = spin + k * 2.094, s = Math.sin(an); if ((s > 0) !== front) continue;
    const L = k === 0 ? 14 : 18, ex = cx + Math.cos(an) * L, ey = hubY + s * 3;
    limb(cx, hubY, ex, ey, 3, 1.4, (s > 0 ? 0.24 : 0.1) * d, (s > 0 ? 0.94 : 0.5) * d, M_STONE);
    put(Math.round(ex), Math.round(ey), 0.98 * d, M_STONE);
  } };
  blades(false);
  ironRod(cx, hubY, cx, Y - 10, 2.4, d); ellipse(cx + 0.5, hubY + 0.5, 3, 2, (x) => (0.4 + 0.55 * clamp((cx + 2 - x) / 5)) * d, M_STONE); put(cx, hubY - 2, 0.9 * d, M_STONE);
  blades(true);
  // the fins: two iron feathers angled down from the drum's sides
  for (const [sd, dd] of [[1, 0.62], [-1, 1]]) poly([[cx + sd * 7, Y - 6], [cx + sd * 7, Y], [cx + sd * 15, Y + 9], [cx + sd * 13, Y + 3]], (x) => (0.16 + 0.6 * clamp((cx + sd * 15 - x) * -sd / 8)) * dd * d, M_STONE);
  // the drum: a domed cap, riveted bands, a coned base
  ellipse(cx + 0.5, Y - 9.5, 8, 3.4, (x) => (0.22 + 0.66 * clamp((cx + 6 - x) / 13) ** 1.2) * d, M_STONE);
  rect(cx - 7, Y - 9, 15, 17, (x, y) => (0.1 + 0.6 * Math.sin(clamp((x - cx + 7.5) / 15) * Math.PI) ** 0.8 * (1.1 - 0.5 * clamp((x - cx + 2) / 9))) * d, M_STONE);
  for (const yy of [Y - 8, Y + 6]) { rect(cx - 7, yy, 15, 1, (x) => (0.5 + 0.48 * clamp((cx + 3 - x) / 10)) * d, M_STONE); rivets(cx - 6, yy, cx + 6, yy, 5, 0.98 * d); }
  poly([[cx - 7, Y + 8], [cx + 8, Y + 8], [cx + 2, Y + 14], [cx - 1, Y + 14]], (x) => (0.18 + 0.5 * clamp((cx + 6 - x) / 12)) * d, M_STONE);
  rustPatch(cx + 2, Y - 8, 6, 14, 1211 + n, 0.55); rustPatch(cx - 7, Y + 7, 9, 3, 1212 + n, 0.6);
  // the window: the broken halo for its rim, the crimson eye in it with a slit pupil; the shutter blinks
  const ex = cx - 1, ey = Y - 1, ph = (t * 0.6 + n * 0.37) % 1, shut = ph < 0.07;
  ellipse(ex + 0.5, ey + 0.5, 5, 5, 0.02, M_DUSK);
  if (!shut) {
    ellipse(ex + 0.5, ey + 0.5, 4, 4, (x, y) => 0.4 + 0.55 * clamp(1 - Math.hypot(x + 0.5 - ex - 0.5, y + 0.5 - ey - 0.5) / 4.2), M_DANGER, 1);
    const px = ex - 1 + Math.round(Math.sin(t * 0.9 + n) * 0.6); for (let y = ey - 2; y <= ey + 2; y++) put(px, y, 0.02, M_DUSK);
    put(ex + 1, ey - 2, 1, M_DANGER, 1); put(ex + 2, ey - 2, 0.8, M_DANGER, 1);
  } else { rect(ex - 4, ey - 4, 9, 9, (x, y) => ((y - ey) % 2 === 0 ? 0.7 : 0.3) * d, M_STONE); }
  brokenHalo(ex + 0.5, ey + 0.5, 5.6, 0.96 * d, M_UMBER, t, { w: 2, bigSpark: true });
  // three hooked blades on short chains, swinging
  for (let k = 0; k < 3; k++) {
    const ox = (k - 1) * 3, L = 8 + (k === 1 ? 3 : 0), bx = cx + ox + Math.round(sw * (1.6 + k * 0.4)), by = Y + 14 + L, dk = (k === 2 ? 0.7 : 1) * d;
    chainLinks([[cx + ox, Y + 14], [bx, by - 2]], dk);
    const hd = k === 0 ? -1 : 1;
    limb(bx, by - 3, bx, by + 2, 2, 2, 0.2 * dk, 0.9 * dk, M_STONE); line(bx, by + 2, bx + hd * 2, by + 4, 0.86 * dk, M_STONE); put(bx + hd * 3, by + 3, 0.98 * dk, M_STONE); put(bx + hd * 3, by + 2, 0.7 * dk, M_STONE);
  }
  for (let k = 0; k < 5; k++) { const q = (t * 0.5 + k / 5 + n * 0.23) % 1, x = Math.round(cx + 2 + q * 6 + Math.sin(q * 6 + k) * 1.5), y = Math.round(hubY - 3 - q * 12); if (lgB(x, y) < (1 - q) * 0.7) put(x, y, 0.32 + 0.12 * (1 - q), M_STONE); }
  { const p2 = (t * 1.3 + n * 0.37) % 1; if (p2 < 0.2) put(Math.round(cx - 2 - p2 * 10), Math.round(hubY + p2 * 12), 0.95, M_UMBER, 1); }
  EFX.moth = [cx, Y];
}

// ---------------------------------------------------------------- the Gravedigger (replaces the Brute)
// The Church's gravedigger: a hulking, hunched brute in a black oilskin coat and hood. Under the hood, a riveted iron
// face-plate cut from a coffin lid, one slit, two embers. An iron collar with a padlocked chain; a heavy pauldron on
// the near shoulder; iron bracers; a pick slung across his back; an iron cage lantern at his hip. He leans on a
// great iron grave-spade, its edge ground sharp; Shove drives it at you flat and hard.
function gravedigger(cx, fy, t, o = {}) {
  const Y = fy + (Math.sin(t * 1.6) > 0.85 ? 1 : 0), sw = o.swing ? 1 : 0, lean = sw ? -3 : 0;
  // the pick slung across his back: the haft from his far hip up past his far shoulder, the head over it
  { const a = [cx + 13, Y - 22], b = [cx + 11 + lean, Y - 68]; ironBar([a, b], 2, 0.7);
    const P = [[b[0] - 10, b[1] + 5], [b[0] - 2, b[1] - 1], [b[0] + 3, b[1] - 2], [b[0] + 13, b[1] - 6], [b[0] + 3, b[1] + 1], [b[0] - 2, b[1] + 2]];
    plate(P, 0.08, 0.6, M_STONE, { edgeHi: 0.9, edgeLo: 0.02 }); put(b[0] - 10, b[1] + 5, 0.95, M_STONE); put(b[0] + 13, b[1] - 6, 0.8, M_STONE); rect(b[0] - 1, b[1] - 2, 3, 4, 0.3, M_STONE); }
  // the legs (the coat hides the thighs): heavy boots with iron toe caps, iron-strapped shins
  for (const [hx0, kx, ax, d] of [[cx + 6, cx + 10, cx + 11, 0.62], [cx - 4, cx - 8, cx - 10, 1]]) {
    limb(hx0, Y - 26, kx, fy - 12, 9, 7.5, 0.06 * d, 0.24 * d, M_DUSK); limb(kx, fy - 12, ax, fy - 3, 7, 6, 0.08 * d, 0.3 * d, M_UMBER);
    for (const yy of [fy - 9, fy - 6]) line(ax - 3, yy, ax + 3, yy - 1, 0.7 * d, M_STONE);
    plate([[ax - 7, fy - 5], [ax + 4, fy - 5], [ax + 5, fy], [ax - 8, fy]], 0.05 * d, 0.3 * d, M_UMBER);
    plate([[ax - 8, fy - 4], [ax - 4, fy - 5], [ax - 3, fy], [ax - 8, fy]], 0.3 * d, 0.92 * d, M_STONE);
  }
  // the spade's grip and hands, then the far arm (behind the body unless it comes forward to the grip)
  const grip = sw ? [cx + 7, Y - 33] : [cx - 21, Y - 47];
  const end = sw ? [cx - 26, Y - 37] : [cx - 22, fy - 11];
  const fhand = sw ? [grip[0] - 1, grip[1] + 1] : [grip[0] + 1, grip[1] + 5], fsh = [cx + 8 + lean, Y - 50];
  const fel = ik2(fsh[0], fsh[1], fhand[0], fhand[1], 13, 13, sw ? -1 : 1);
  limb(fsh[0], fsh[1], fel[0], fel[1], 8, 7, 0.06, 0.22, M_DUSK);
  if (!sw) limb(fel[0], fel[1], fhand[0], fhand[1], 7, 6, 0.06, 0.22, M_DUSK);
  // the coat: a hunched black oilskin, the hump of his back, the skirt to the shins, a ragged hem
  const CT = [[cx - 11 + lean, Y - 50], [cx - 2 + lean, Y - 56], [cx + 8 + lean, Y - 57], [cx + 15, Y - 49], [cx + 17, Y - 32], [cx + 18, fy - 10], [cx + 6, fy - 8], [cx - 4, fy - 10], [cx - 13, fy - 9], [cx - 14, Y - 30], [cx - 13 + lean, Y - 42]];
  poly(CT, (x, y) => { const lx = clamp((cx + 18 - x) / 32), top = clamp((Y - 30 - y) / 26); return 0.06 + 0.16 * lx ** 1.4 + 0.08 * top * lx - (((x - cx + 60) % 6 === 0 && y > Y - 30) ? 0.03 : 0) + (vnoise(x / 3, y / 5, 1221) > 0.78 ? 0.05 : 0); }, M_DUSK);
  litEdges(CT, 0.5, 0.02, M_DUSK);
  for (let x = cx - 10 + lean; x <= cx + 14; x++) { let y = Y - 60; while (y < Y - 30 && !(B.A[y * BW + x] && B.M[y * BW + x] === M_DUSK)) y++; if (y < Y - 30) put(x, y, x < cx + 6 ? 0.56 : 0.4, M_DUSK); }
  ragHem(cx - 13, cx + 18, fy - 10, 3, 1222, 0.08, M_DUSK);
  for (const x0 of [cx - 3, cx + 7]) for (let y = Y - 30; y < fy - 10; y++) put(x0 + ((y >> 3) & 1), y, 0.02, M_DUSK);
  // straps: a bandolier across the chest, the belt with an iron buckle; the lantern at his near hip
  for (let s = 0; s <= 26; s++) { const q = s / 26, x = Math.round(lerp(cx - 11 + lean, cx + 13, q)), y = Math.round(lerp(Y - 46, Y - 27, q)); put(x, y, 0.3, M_UMBER); put(x, y + 1, 0.12, M_UMBER); if (s % 7 === 3) { put(x, y, 0.92, M_STONE); put(x + 1, y, 0.5, M_STONE); } }
  rect(cx - 14, Y - 29, 31, 3, (x) => 0.1 + 0.16 * clamp((cx + 17 - x) / 31), M_UMBER);
  rect(cx - 7, Y - 30, 5, 5, (x, y) => (x === cx - 7 || y === Y - 30 ? 0.94 : 0.5), M_STONE); rect(cx - 6, Y - 29, 3, 3, 0.04, M_DUSK); put(cx - 5, Y - 28, 0.8, M_STONE);
  // three coffin lids of iron hung from the belt as tassets, riveted, a nail-cross on each, rusted
  for (const [k, x0, d] of [[2, cx + 1, 0.62], [1, cx - 5, 0.8], [0, cx - 12, 1]]) {
    const y0 = Y - 27 + k, yb = fy - 11 + (k & 1), P = [[x0 + 1.5, y0], [x0 + 5.5, y0], [x0 + 7.5, y0 + 4], [x0 + 5.5, yb], [x0 + 1.5, yb], [x0 - 0.5, y0 + 4]];
    rimPoly(P, 1); plate(P, 0.06 * d, 0.56 * d, M_STONE, { edgeHi: 0.92 * d, edgeLo: 0.02 });
    line(x0 + 3, y0 + 4, x0 + 3, y0 + 10, 0.03, M_DUSK); line(x0 + 1, y0 + 6, x0 + 5, y0 + 6, 0.03, M_DUSK);
    put(x0 + 2, y0 + 1, 0.98 * d, M_STONE); put(x0 + 5, y0 + 1, 0.8 * d, M_STONE); put(x0 + 2, yb - 1, 0.7 * d, M_STONE);
    rustPatch(x0 + 1, y0 + 9, 6, 7, 1227 + k, 0.66);
  }
  cageLantern(cx + 15, Y - 20, 0.8);
  // the iron collar and its chain to a padlock on his chest
  const nx = cx - 6 + lean, ny = Y - 52;
  for (let x = nx - 5; x <= nx + 6; x++) { put(x, ny, x < nx ? 0.96 : 0.6, M_STONE); put(x, ny + 1, x < nx ? 0.6 : 0.3, M_STONE); put(x, ny + 2, 0.1, M_STONE); }
  rivets(nx - 4, ny + 1, nx + 5, ny + 1, 4, 1);
  chainLinks(sag(nx - 1, ny + 3, nx - 2, Y - 37, 1, 6));
  rect(nx - 4, Y - 37, 5, 5, (x, y) => (x === nx - 4 || y === Y - 37 ? 0.92 : 0.46), M_STONE); put(nx - 2, Y - 35, 0.04, M_DUSK); put(nx - 2, Y - 34, 0.04, M_DUSK);
  rustPatch(nx - 4, Y - 35, 5, 4, 1223, 0.55);
  // the spade: an iron shaft, a D-grip, a broad blade with a ground edge, earth caked on it, rivets at the socket
  const ux = end[0] - grip[0], uy = end[1] - grip[1], uL = Math.hypot(ux, uy), dx = ux / uL, dy = uy / uL, pnx = -dy, pny = dx;
  for (let s2 = 2; s2 <= uL; s2 += 0.5) for (let w = -1; w <= 1; w += 0.5) put(Math.round(grip[0] + dx * s2 + pnx * w), Math.round(grip[1] + dy * s2 + pny * w), w <= -0.5 ? 0.86 : w >= 0.5 ? 0.18 : 0.5, M_STONE);
  for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2, x = grip[0] - dx * 1 + Math.cos(an) * 2.6, y = grip[1] - dy * 1 + Math.sin(an) * 2.6; put(Math.round(x), Math.round(y), Math.cos(an + 2.4) > 0 ? 0.92 : 0.4, M_STONE); }
  const BB = (u, v) => [end[0] + dx * u + pnx * v, end[1] + dy * u + pny * v];
  const BL = [BB(-2, -5), BB(-2, 5), BB(10, 5.5), BB(14, 2), BB(15, 0), BB(14, -2), BB(10, -5.5)];
  plate(BL, 0.18, 0.7, M_STONE, { edgeHi: 0.98 });
  for (let u = 9; u <= 15; u += 0.5) for (const v of [-5.5 + (u - 9) * 0.6, 5.5 - (u - 9) * 0.6]) { const [x, y] = BB(u, v * (u > 13 ? 0.6 : 1)); put(Math.round(x), Math.round(y), 1, M_STONE); }
  rect(Math.round(BB(-3, 0)[0]) - 2, Math.round(BB(-3, 0)[1]) - 2, 4, 4, 0.36, M_STONE);
  for (const v of [-2.5, 2.5]) { const [x, y] = BB(0, v); put(Math.round(x), Math.round(y), 0.98, M_STONE); }
  for (let k = 0; k < 9; k++) { const [x, y] = BB(1 + hash(k, 1, 1224) * 8, (hash(k, 2, 1224) - 0.5) * 8); put(Math.round(x), Math.round(y), 0.14 + 0.1 * hash(k, 3, 1224), k % 3 ? M_UMBER : M_MOSS); }
  rustPatch(Math.round(Math.min(BB(2, -4)[0], BB(8, 4)[0])), Math.round(Math.min(BB(2, -4)[1], BB(8, 4)[1])), 6, 6, 1225, 0.6);
  // the far hand on the grip (for Shove the far forearm comes forward over the coat to the grip)
  if (sw) limb(fel[0], fel[1], fhand[0], fhand[1], 7, 6, 0.1, 0.34, M_DUSK);
  ellipse(fhand[0] + 0.5, fhand[1] + 0.5, 3, 2.8, (x) => 0.12 + 0.24 * clamp((fhand[0] + 2 - x) / 5), M_UMBER);
  // the head, low and forward: the hood, the coffin-lid face-plate, the slit and its embers
  const hx = cx - 8 + lean, hy = Y - 57;
  const HD = [[hx - 7, hy + 7], [hx - 8, hy - 1], [hx - 4, hy - 7], [hx + 3, hy - 9], [hx + 9, hy - 5], [hx + 11, hy + 3], [hx + 8, hy + 8]];
  poly(HD, (x, y) => 0.05 + 0.2 * clamp((hx + 11 - x) / 19) ** 1.3 * (1 - 0.4 * clamp((y - hy) / 8)), M_DUSK); litEdges(HD, 0.4, 0.02, M_DUSK);
  ellipse(hx - 1.5, hy + 1.5, 5, 5.6, 0.01, M_DUSK);
  const FP = [[hx - 5, hy - 3], [hx + 1, hy - 4], [hx + 3, hy], [hx + 2, hy + 6], [hx - 2, hy + 8], [hx - 6, hy + 5]];
  plate(FP, 0.24, 0.84, M_STONE, { edgeHi: 1, edgeLo: 0.06 });
  rect(hx - 5, hy, 7, 2, 0.01, M_DUSK); eyeLight(hx - 4, hy, t, 1231, false); eyeLight(hx - 1, hy, t, 1232, false); put(hx - 4, hy + 1, 0.4, M_DANGER, 1); put(hx - 1, hy + 1, 0.4, M_DANGER, 1);
  for (const x of [hx - 4, hx - 2, hx]) line(x, hy + 4, x, hy + 6, 0.04, M_DUSK);
  rivets(hx - 4, hy - 3, hx + 1, hy - 3, 3, 1); put(hx - 5, hy + 4, 0.98, M_STONE); put(hx + 2, hy + 4, 0.7, M_STONE);
  for (let y = hy + 2; y < hy + 8; y++) put(hx - 3, y, 0.5 + 0.2 * hash(y, 0, 1233), M_UMBER);
  // the near shoulder: a heavy riveted plate, strapped over the coat
  const ps = [cx - 10 + lean, Y - 50];
  ellipse(ps[0] + 0.5, ps[1] + 0.5, 7, 5.5, (x, y) => { const lx = (x + 0.5 - ps[0]) / 7, ly = (y + 0.5 - ps[1]) / 5.5, nz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly)); return 0.12 + 0.78 * clamp(-lx * 0.55 - ly * 0.6 + nz * 0.5) ** 1.3; }, M_STONE);
  for (let x = ps[0] - 6; x <= ps[0] + 6; x++) put(x, ps[1] + 4 + Math.round(((x - ps[0]) / 7) ** 2 * 2), 0.06, M_STONE);
  rivets(ps[0] - 5, ps[1] + 2, ps[0] + 4, ps[1] + 3, 4, 0.98); rustPatch(ps[0] - 1, ps[1] - 3, 7, 6, 1234, 0.58);
  // the near arm to the shaft, an iron bracer, the big gloved fist over it
  const nhand = sw ? [cx - 16, Y - 36] : [grip[0] + 1, grip[1] - 1];
  const nel = ik2(ps[0] - 2, ps[1] + 2, nhand[0], nhand[1], 11, 11, sw ? 1 : -1);
  limb(ps[0] - 2, ps[1] + 2, nel[0], nel[1], 8, 7, 0.14, 0.4, M_DUSK); limb(nel[0], nel[1], nhand[0], nhand[1], 7, 6, 0.14, 0.4, M_DUSK);
  { const q0 = 0.35, q1 = 0.8, a0 = [lerp(nel[0], nhand[0], q0), lerp(nel[1], nhand[1], q0)], a1 = [lerp(nel[0], nhand[0], q1), lerp(nel[1], nhand[1], q1)]; limb(a0[0], a0[1], a1[0], a1[1], 7.2, 6.6, 0.24, 0.92, M_STONE); }
  ellipse(nhand[0] + 0.5, nhand[1] + 0.5, 3.4, 3, (x) => 0.18 + 0.34 * clamp((nhand[0] + 3 - x) / 6), M_UMBER);
  put(nhand[0] - 2, nhand[1] - 1, 0.5, M_UMBER);
  EFX.digger = [hx, hy];
}

// ---------------------------------------------------------------- attack timelines (shared)
// Every big attack reads in three phases: anticipation (a slow, readable wind-up under the cast bar), the attack itself
// (fast: a cut or a slam that accelerates into the hit), and recovery. u is seconds since the cast began.
function strikeTimeline(u, wind, hold = 0.25, strike = 0.15, after = 0.5, recover = 0.7) {
  if (u < 0) return {};
  if (u < wind) return { wind: u / wind };
  u -= wind; if (u < hold) return { wind: 1 };
  u -= hold; if (u < strike) return { strike: Math.max(0.001, u / strike) };
  u -= strike; if (u < after) return { strike: 1, after: u / after };
  u -= after; if (u < recover) return { recover: u / recover };
  return {};
}
const smoothQ = (k) => k * k * (3 - 2 * k);
const angLerp = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k; };
function rotAbout(px, py, th) { const c = Math.cos(th), s = Math.sin(th); return (x, y) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c]; }
// a speed smear: dithered pale streaks along a path of earlier positions, the oldest faintest
function smear(paths, k0 = 0.85) {
  paths.forEach((pts, j) => { const f = 1 - j / paths.length; for (const [x, y] of pts) { const xi = Math.round(x), yi = Math.round(y); if (lgB(xi, yi) < f * 0.75) put(xi, yi, k0 * (0.55 + 0.45 * f), M_STONE, 1); } });
}

// ---------------------------------------------------------------- the Gaoler (replaces the Ogre, boss)
// The keeper of the crypt's cells, a giant: a black leather hood with an iron muzzle riveted over the jaw, a bare
// scarred chest crossed by straps, a ring of great keys at his belt, a broken manacle on his wrist. He drags an iron
// ball on a chain. SMASH is how a ball and chain is used: he hauls it up off the floor, whirls it overhead on a taut
// chain, faster and faster (the cast), then brings it over his shoulder and down in one accelerating arc onto the
// floor in front of him, bending into it; it bites in, the chain goes slack, and he drags it back.
// Draw order follows depth in every pose: at rest his arms hang behind and beside the body; raised, both arms come
// up in front of the hood; the ball is drawn behind him while it is on the far side of its circle or over his back.
function gaoler(cx, fy, t, o = {}) {
  const Y = fy + (Math.sin(t * 1.3) > 0.8 ? 1 : 0), S = M_UMBER, br = 8;
  const w = clamp(o.wind || 0), s = clamp(o.strike || 0), r = clamp(o.recover || 0), active = w > 0 || s > 0 || (r > 0 && r < 0.75);
  const restF = [cx + 20, Y - 34], restN = [cx - 23, Y - 31], restBall = [cx - 33, fy - 9];
  const F0 = [cx - 2, Y - 84], Fd = [cx - 26, Y - 36], impact = [cx - 46, fy - 9];
  const N = 4, phiEnd = -0.6, O = [F0[0], F0[1] - 4], R0 = 24, RY = 6;
  let fist, ball, lean = 0, chain = 'taut', behind = false, trail = null, liftK = 1;
  if (s > 0 || (o.strike != null && o.strike >= 1)) {             // the slam: over and down, accelerating
    const e = s ** 1.8, ss = smoothQ(s);
    fist = [lerp(F0[0], Fd[0], ss) - Math.sin(ss * Math.PI) * 5, lerp(F0[1], Fd[1], ss)]; lean = -10 * e;
    const p0 = [O[0] + R0 * Math.cos(phiEnd), O[1] + RY * Math.sin(phiEnd)], v0 = [p0[0] - F0[0], p0[1] - F0[1]];
    const psi0 = Math.atan2(v0[1], v0[0]), C0 = Math.hypot(...v0), v1 = [impact[0] - Fd[0], impact[1] - Fd[1]], psi1 = Math.atan2(v1[1], v1[0]) - 2 * Math.PI, C1 = Math.hypot(...v1);
    const at = (k) => { const ek = k ** 1.8, sk = smoothQ(k), fx = lerp(F0[0], Fd[0], sk) - Math.sin(sk * Math.PI) * 5, fyy = lerp(F0[1], Fd[1], sk), ps = lerp(psi0, psi1, ek), C = lerp(C0, C1, k ** 1.2); return [fx + C * Math.cos(ps), Math.min(fy - 9, fyy + C * Math.sin(ps))]; };
    ball = s >= 1 ? impact.slice() : at(s); behind = s < 0.3;
    if (s > 0.15 && s < 1) trail = Array.from({ length: 7 }, (_, j) => { const k = Math.max(0, s - (j + 1) * 0.05); const p = at(k); return Array.from({ length: 9 }, (_, m) => [p[0] + Math.cos(m * 0.7) * br * 0.6, p[1] + Math.sin(m * 0.7) * br * 0.6]); });
    if (s >= 1) { chain = 'slack'; ball[1] += 1; }
  } else if (r > 0) {                                                // dragging it back
    const rr = smoothQ(r); lean = -10 * (1 - rr);
    fist = [lerp(Fd[0], restF[0], rr), lerp(Fd[1], restF[1], rr)]; ball = [lerp(impact[0], restBall[0], rr), restBall[1]]; chain = 'slack';
  } else if (w > 0) {
    if (w < 0.2) {                                                   // hauling it up off the floor
      const u = smoothQ(w / 0.2), phi0 = phiEnd - 2 * Math.PI * N, B0 = [O[0] + R0 * Math.cos(phi0), O[1] + RY * Math.sin(phi0)];
      fist = [lerp(restF[0], F0[0], u), lerp(restF[1], F0[1], u) - Math.sin(u * Math.PI) * 6]; liftK = u;
      ball = [lerp(restBall[0], B0[0], u) - Math.sin(u * Math.PI) * 10, lerp(restBall[1], B0[1], u) - Math.sin(u * Math.PI) * 14];
      chain = u < 0.5 ? 'slack' : 'taut';
    } else {                                                         // whirling overhead, faster and faster
      const u = (w - 0.2) / 0.8, phi = phiEnd - 2 * Math.PI * N * (1 - u ** 1.7);
      fist = [F0[0] + 3 * Math.cos(phi), F0[1] + 1.5 * Math.sin(phi)];
      ball = [O[0] + R0 * Math.cos(phi), O[1] + RY * Math.sin(phi)]; behind = Math.sin(phi) < 0;
      const spd = 0.5 + 1.2 * u ** 0.7;   // radians of trail behind the ball
      trail = Array.from({ length: 8 }, (_, j) => { const a = phi - (j + 1) * spd / 8; const p = [O[0] + R0 * Math.cos(a), O[1] + RY * Math.sin(a)]; return Array.from({ length: 7 }, (_, m) => [p[0] + Math.cos(m * 0.9) * br * 0.55, p[1] + Math.sin(m * 0.9) * br * 0.4]); });
      if (u > 0.5) { const ring = []; for (let a = 0; a < 80; a++) { const an = a / 80 * Math.PI * 2; if (Math.sin(an) < 0 === behind) ring.push([O[0] + R0 * Math.cos(an), O[1] + RY * Math.sin(an)]); } trail.push(ring); }
    }
  } else { fist = null; ball = restBall.slice(); }
  const raised = !!fist && active && liftK > 0.35;
  const fh = fist && r === 0 ? [lerp(restF[0], fist[0] + 2, liftK), lerp(restF[1], fist[1], liftK)] : fist ? [fist[0], fist[1]] : restF;
  const nh = fist && r === 0 ? [lerp(restN[0], fist[0] - 3, liftK), lerp(restN[1], fist[1] + 2, liftK)] : fist ? [lerp(fist[0] - 3, restN[0], smoothQ(r)), lerp(fist[1] + 2, restN[1], smoothQ(r))] : restN;
  // the upper body leans into the slam (a skew above the belt)
  const SX = (x, y) => x + lean * clamp((Y - 34 - y) / 32), LY = Math.round(-lean * 0.5);
  const skin = (x, y, x0, x1, k = 1) => (0.36 + 0.46 * clamp((x1 - x) / (x1 - x0)) ** 0.9) * k;
  const fSh = [SX(cx + 11, Y - 60), Y - 60 + LY], nSh = [SX(cx - 15, Y - 56), Y - 56 + LY];
  const blendE = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], restK = fist ? (r > 0 ? clamp((r - 0.6) / 0.4) : 1 - clamp(liftK / 0.5)) : 1;
  const fe = blendE(ik2(fSh[0], fSh[1], fh[0], fh[1], 17, 17, 1), [cx + 19, Y - 47], restK);
  const ne = blendE(ik2(nSh[0], nSh[1], nh[0], nh[1], 17, 17, -1), [cx - 20, Y - 46], restK);
  const drawBall = () => {
    if (trail) smear(trail, 0.8);
    ellipse(ball[0] + 0.5, ball[1] + 0.5, br, br, (x, y) => { const lx = (x + 0.5 - ball[0]) / br, ly = (y + 0.5 - ball[1]) / br, nz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly)); return 0.16 + 0.72 * clamp(-lx * 0.5 - ly * 0.6 + nz * 0.55) ** 1.4; }, M_STONE);
    for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2, x = Math.round(ball[0] + Math.cos(an) * br * 0.98), y = Math.round(ball[1] + Math.sin(an) * br * 0.32); if (Math.sin(an) > 0) put(x, y, Math.cos(an) < 0 ? 0.5 : 0.24, M_STONE); }
    for (const [dx, dy] of [[-4, -4], [3, -5], [-6, 1], [5, 2], [-1, -7]]) { put(Math.round(ball[0] + dx), Math.round(ball[1] + dy), 0.95, M_STONE); put(Math.round(ball[0] + dx) + 1, Math.round(ball[1] + dy) + 1, 0.2, M_STONE); }
    rustPatch(Math.round(ball[0]) - 1, Math.round(ball[1]) + 1, 8, 6, 942, 0.6);
    put(Math.round(ball[0]) + 1, Math.round(ball[1] - br), 0.7, M_STONE); put(Math.round(ball[0]), Math.round(ball[1] - br) - 1, 0.86, M_STONE);
  };
  const drawChain = () => {
    if (!fist) return;
    const a = [fh[0] - 2, fh[1] + 1], b = [ball[0] + (ball[0] < a[0] ? 3 : -3), ball[1] + (ball[1] > a[1] ? -br + 2 : 0)];
    chainLinks(chain === 'taut' ? [a, b] : sag(a[0], a[1], b[0], b[1], 8 + Math.abs(b[0] - a[0]) * 0.2, 10));
  };
  // the far leg
  limb(cx + 7, Y - 30, cx + 10, fy - 14, 11, 10, 0.08, 0.2, S); limb(cx + 10, fy - 14, cx + 11, fy - 3, 9, 8, 0.1, 0.3, M_STONE);
  plate([[cx + 6, fy - 4], [cx + 19, fy - 3], [cx + 19, fy], [cx + 6, fy]], 0.08, 0.2, S);
  if (behind) { drawChain(); drawBall(); }
  const farArm = () => { limb(fSh[0], fSh[1], fe[0], fe[1], 10, 9, 0.18, 0.34, S); limb(fe[0], fe[1], fh[0], fh[1], 9, 8, 0.18, 0.34, S); ellipse(fh[0] + 0.5, fh[1] + 0.5, 4.2, 3.8, 0.3, S); };
  if (!raised) farArm();
  // the torso: broad shoulders, a scarred chest, the belly pushed forward
  const TR = [[cx - 14, Y - 61], [cx - 4, Y - 66], [cx + 12, Y - 63], [cx + 13, Y - 50], [cx + 10, Y - 36], [cx - 9, Y - 34], [cx - 12, Y - 46]].map(([x, y]) => [SX(x, y), y + (y < Y - 40 ? LY : 0)]);
  poly(TR, (x, y) => skin(x, y, cx - 14 + lean, cx + 13) - 0.12 * clamp((y - Y + 56) / 20), S); litEdges(TR, 0.86, 0.1, S);
  { const ccx = SX(cx - 3.5, Y - 42); ellipse(ccx, Y - 41.5, 10, 8, (x, y) => { const lx = (x + 0.5 - ccx) / 10, ly = (y + 0.5 - Y + 41.5) / 8, nz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly)); return 0.22 + 0.56 * clamp(-lx * 0.55 - ly * 0.5 + nz * 0.5); }, S); }
  const L = (x0, y0, x1, y1, v, m) => line(SX(x0, y0), y0 + (y0 < Y - 40 ? LY : 0), SX(x1, y1), y1 + (y1 < Y - 40 ? LY : 0), v, m);
  L(cx - 8, Y - 55, cx + 1, Y - 57, 0.22, S); L(cx + 1, Y - 57, cx + 8, Y - 55, 0.16, S); L(cx, Y - 56, cx, Y - 50, 0.2, S);
  for (const [x0, y0, x1, y1] of [[cx - 10, Y - 58, cx - 3, Y - 50], [cx + 4, Y - 45, cx + 10, Y - 53]]) { L(x0, y0, x1, y1, 0.14, M_DUSK); for (let k = 1; k < 4; k++) put(Math.round(SX(lerp(x0, x1, k / 4), lerp(y0, y1, k / 4))) - 1, Math.round(lerp(y0, y1, k / 4)) - 1 + LY, 0.74, S); }
  for (const [ax, ay, bx, by] of [[cx - 12, Y - 60, cx + 10, Y - 37], [cx + 10, Y - 62, cx - 8, Y - 36]]) { L(ax, ay, bx, by, 0.12, S); L(ax + 1, ay, bx + 1, by, 0.22, S); }
  { const rx = SX(cx + 0.5, Y - 48); ellipse(rx, Y - 48.5, 2.8, 2.8, 0.72, M_STONE); ellipse(rx, Y - 48.5, 1.3, 1.3, 0.05, M_DUSK); put(Math.round(rx) - 2, Y - 50, 0.95, M_STONE); }
  // the belt, the leather skirt in strips, the ring of keys
  rect(cx - 11, Y - 36, 24, 4, (x) => 0.14 + 0.1 * clamp((cx + 13 - x) / 24), S); rect(cx - 2, Y - 36, 5, 4, 0.72, M_STONE); rect(cx - 1, Y - 35, 3, 2, 0.1, M_DUSK);
  for (let k = 0; k < 5; k++) { const x0 = cx - 11 + k * 5; poly([[x0, Y - 32], [x0 + 5, Y - 32], [x0 + 4.5, fy - 17 + (k & 1) * 2], [x0 + 0.5, fy - 17 + (k & 1) * 2]], (x) => (x === x0 ? 0.3 : 0.12 + 0.06 * (k & 1)), S); }
  const kr = [cx - 12, Y - 29]; for (let a = 0; a < 30; a++) { const an = a / 30 * 6.283; put(Math.round(kr[0] + Math.cos(an) * 4), Math.round(kr[1] + Math.sin(an) * 4), Math.cos(an + 2.4) > 0 ? 0.88 : 0.36, M_STONE); }
  for (let k = 0; k < 5; k++) { const an = 0.6 + k * 0.4, x0 = kr[0] + Math.cos(an) * 4, y0 = kr[1] + Math.sin(an) * 4, sw2 = Math.sin(t * 2 + k) * 0.08 + (s > 0 && s < 1 ? -0.4 : 0), ex = x0 + Math.cos(an + sw2) * 9, ey = y0 + Math.sin(an + sw2) * 9;
    line(x0, y0, ex, ey, 0.68, M_STONE); put(Math.round(ex), Math.round(ey), 0.88, M_STONE); put(Math.round(ex) + 1, Math.round(ey), 0.5, M_STONE); put(Math.round(ex), Math.round(ey) + 1, 0.4, M_STONE); }
  // the near leg, an iron greave, a shackle on the ankle trailing a broken chain
  limb(cx - 3, Y - 30, cx - 7, fy - 14, 12, 11, 0.16, 0.44, S); limb(cx - 7, fy - 14, cx - 9, fy - 3, 10, 9, 0.22, 0.74, M_STONE);
  plate([[cx - 20, fy - 4], [cx - 7, fy - 5], [cx - 5, fy], [cx - 21, fy]], 0.12, 0.38, S);
  rect(cx - 14, fy - 10, 10, 3, (x) => (x < cx - 11 ? 0.82 : 0.4), M_STONE); chainLinks(sag(cx - 14, fy - 8, cx - 24, fy - 1, 1, 6));
  // at rest: the long chain from the far hand down along the floor to the ball
  if (!fist) chainLinks([...sag(fh[0], fh[1] + 2, cx - 4, fy - 1, 4, 10), ...sag(cx - 4, fy - 1, ball[0] + 7, ball[1] + 4, 1, 8)]);
  const nearArm = () => {
    ellipse(nSh[0] + 1.5, nSh[1] - 2.5, 6.5, 6, (x, y) => skin(x, y, nSh[0] - 5, nSh[0] + 8, 1.06), S);
    limb(nSh[0], nSh[1], ne[0], ne[1], 10, 9, 0.36, 0.84, S); limb(ne[0], ne[1], nh[0], nh[1], 9, 8, 0.36, 0.84, S);
    const dx = nh[0] - ne[0], dy = nh[1] - ne[1], Lh = Math.hypot(dx, dy) || 1, ux = dx / Lh, uy = dy / Lh;
    const m = [nh[0] - ux * 5, nh[1] - uy * 5];   // the manacle on the wrist, wherever the arm points
    limb(m[0] - ux * 2, m[1] - uy * 2, m[0] + ux * 2, m[1] + uy * 2, 10, 10, 0.4, 0.9, M_STONE);
    put(Math.round(m[0] - uy * 3), Math.round(m[1] + ux * 3), 0.96, M_STONE); put(Math.round(m[0]), Math.round(m[1]), 0.96, M_STONE);
    ellipse(nh[0] + 0.5, nh[1] + 0.5, 4.4, 4, (x) => 0.5 + 0.3 * clamp((nh[0] + 3 - x) / 7), S);
    if (!fist) chainLinks(sag(nh[0] - 2, nh[1] - 2, nh[0] - 6 + Math.sin(t * 2.2) * 2, nh[1] + 12, 1, 6));
  };
  if (!raised) nearArm();
  // the head, low between the shoulders: the executioner's hood, peaked, its capelet over the shoulders
  const hx = Math.round(cx - 4 + lean), hy = Y - 70 + LY * 2;
  const CP = [[hx - 10, hy + 10], [hx - 6, hy + 2], [hx + 7, hy + 2], [hx + 15, hy + 9], [hx + 9, hy + 13], [hx - 4, hy + 14]];
  poly(CP, (x) => 0.05 + 0.16 * clamp((hx + 15 - x) / 25), M_DUSK); litEdges(CP, 0.3, 0.02, M_DUSK);
  const HD = [[hx - 7, hy + 4], [hx - 7, hy - 4], [hx - 4, hy - 11], [hx + 1, hy - 17], [hx + 4, hy - 10], [hx + 7, hy - 3], [hx + 7, hy + 4]];
  poly(HD, (x, y) => 0.06 + 0.22 * clamp((hx + 7 - x) / 14) * (1 - 0.3 * clamp((hy - y) / 16)), M_DUSK); litEdges(HD, 0.36, 0.02, M_DUSK);
  for (let y = hy - 14; y < hy + 2; y += 2) put(hx + 2, y, 0.02, M_DUSK);
  for (const ex of [hx - 5, hx - 1]) { rect(ex, hy - 3, 3, 2, 0, M_DUSK); eyeLight(ex + 1, hy - 3, t, ex, false); put(ex, hy - 3, 0.5, M_DANGER, 1); }
  const MZ = [[hx - 7, hy], [hx + 4, hy], [hx + 5, hy + 5], [hx + 2, hy + 8], [hx - 6, hy + 8], [hx - 8, hy + 4]];
  plate(MZ, 0.24, 0.8, M_STONE, { edgeHi: 1 }); for (let x = hx - 5; x <= hx + 2; x += 2) line(x, hy + 3, x, hy + 6, 0.04, M_DUSK);
  rivets(hx - 6, hy + 1, hx + 3, hy + 1, 4, 0.98); rustPatch(hx - 4, hy + 4, 8, 4, 941, 0.5);
  // raised: the arms come up in front of the hood
  if (raised) { farArm(); nearArm(); }
  if (!behind) { drawChain(); drawBall(); }
  EFX.gaoler = [hx, hy]; EFX.ball = ball;
}
const smashAt = (u, wind = 2.9) => strikeTimeline(u, wind, 0, 0.3, 0.5, 0.8);

// ---------------------------------------------------------------- the Bellringer (replaces the Warlock, boss)
// A tall, stooped bell-priest under a wooden yoke from which an iron bell hangs over his head, a candle on each post.
// His eyes are bound with a white band, embers showing through it; his mouth is open in the hymn. SUMMON: he hauls the
// rope and the bell tolls, the rings go out, and the choir comes (Cherubs, a Confessor). The bell bears the broken halo.
function bellringer(cx, fy, t, o = {}) {
  const toll = o.toll ? clamp(o.toll) : 0, sw = Math.sin(t * 1.7) * 0.08 + Math.sin(t * 9) * 0.32 * toll, Y = fy - 1 + Math.round(Math.sin(t * 1.2));
  // the yoke behind him: two posts from his shoulders, a crossbar, iron brackets, a candle on each post
  const pL = [cx - 11, Y - 100], pR = [cx + 15, Y - 100];
  for (const [px, d] of [[pR, 0.7], [pL, 1]]) { limb(px[0] + (px === pL ? 4 : -4), Y - 52, px[0], px[1], 3, 3, 0.2 * d, 0.5 * d, M_UMBER); }
  rect(pL[0] - 3, Y - 100, pR[0] - pL[0] + 7, 4, (x, y) => (y === Y - 100 ? 0.66 : 0.3 + 0.14 * clamp((pR[0] - x) / 26)), M_UMBER);
  for (const px of [pL, pR]) { rect(px[0] - 2, Y - 101, 5, 6, (x) => (x === px[0] - 2 ? 0.7 : 0.3), M_STONE); rect(px[0], Y - 106, 2, 5, (x) => (x === px[0] ? 0.92 : 0.7), M_UMBER); AOJ.candles = AOJ.candles || []; AOJ.candles.push([px[0] + 1, Y - 107, t, px[0]]); }
  // the bell, swinging from the crossbar: crown, waist, flared lip; a gilt band, the broken halo cast on it, a crack
  const hx0 = cx + 2, hy0 = Y - 97, BH = 25, cs = Math.cos(sw), sn = Math.sin(sw);
  const hw = (q) => (q < 0.1 ? 4.6 + 2.4 * Math.sqrt(q / 0.1) : 7 + 3.6 * ((q - 0.1) / 0.9) ** 2.2) + (q > 0.84 ? (q - 0.84) * 24 : 0);
  for (let j = 0; j <= BH; j++) { const q = j / BH, w = hw(q); for (let u = -w; u <= w; u += 0.5) {
    const x = Math.round(hx0 + u * cs - j * sn), y = Math.round(hy0 + u * sn + j * cs);
    let v = 0.14 + 0.62 * clamp(1 - (u + w) / (2 * w)) ** 1.3; if (Math.abs(u + w * 0.45) < 0.7) v = 0.88;
    let mat = M_STONE; if (Math.abs(q - 0.8) < 0.04) { mat = M_UMBER; v = 0.5 + 0.4 * clamp(1 - (u + w) / (2 * w)); }
    if (j === BH) v = 0.08;
    if (Math.abs(u - 4 + (BH - j) * 0.12) < 0.5 && q > 0.55 && j < BH) v = 0.03;
    put(x, y, v, mat); } }
  { const bx = hx0 - 13 * sn, by = hy0 + 13 * cs; brokenHalo(bx + 0.5, by + 0.5, 3.6, 0.88, M_UMBER, t, { w: 1 }); }
  for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; put(Math.round(hx0 + Math.cos(an) * 2), Math.round(hy0 - 2 + Math.sin(an) * 2), Math.cos(an + 2.4) > 0 ? 0.8 : 0.3, M_STONE); }
  const clap = [Math.round(hx0 - (BH + 2) * sn + sw * 14), Math.round(hy0 + (BH + 2) * cs)]; ellipse(clap[0] + 0.5, clap[1] + 0.5, 1.8, 1.8, 0.4, M_STONE);
  // the robe: a long dusk cassock, stooped, a ragged hem, the gilt stole
  const RB = [[cx - 7, Y - 54], [cx + 8, Y - 54], [cx + 13, fy - 3], [cx + 8, fy - 1], [cx + 2, fy - 3], [cx - 4, fy - 1], [cx - 10, fy - 3], [cx - 13, fy - 2]];
  poly(RB, (x, y) => 0.1 + 0.26 * Math.sin(clamp((x - cx + 13) / 26) * Math.PI) * (1.1 - 0.35 * clamp((x - cx) / 13)) - (((x - cx + 40) % 5 === 0 && y > Y - 40) ? 0.05 : 0), M_DUSK);
  ragHem(cx - 13, cx + 13, fy - 3, 3, 951, 0.1, M_DUSK);
  for (const sx of [cx - 3, cx + 2]) rect(sx, Y - 50, 2, fy - Y + 42, (x) => (x === sx ? 0.84 : 0.58), M_UMBER);
  for (const sx of [cx - 3, cx + 2]) brokenHalo(sx + 1, fy - 11, 1.6, 0.72, M_UMBER, t, { spark: false });
  // the far arm raised, conducting; the sleeve falling back from a thin wrist
  limb(cx + 6, Y - 50, cx + 14, Y - 58, 5, 4, 0.08, 0.22, M_DUSK); limb(cx + 14, Y - 58, cx + 17, Y - 68 - Math.round(toll * 4), 2.4, 2, 0.4, 0.66, M_UMBER);
  for (const [dx, dy] of [[0, -2], [-1, -3], [1, -3], [2, -1]]) put(cx + 17 + dx, Y - 68 - Math.round(toll * 4) + dy, 0.6, M_UMBER);
  // the rope from the bell's lip down to his near hand, raised beside his head; the near arm hauling on it
  const lip = [Math.round(hx0 - hw(1) * cs - BH * sn) + 1, Math.round(hy0 - hw(1) * sn + BH * cs)], rh = [cx - 14, Y - 60 + Math.round(toll * 8)];
  line(lip[0], lip[1], rh[0] + 1, rh[1] - 2, 0.66, M_UMBER); line(lip[0] + 1, lip[1], rh[0] + 2, rh[1] - 2, 0.3, M_UMBER);
  for (let k = 0; k < 8; k++) put(rh[0] + 1, rh[1] + 2 + k, k & 1 ? 0.62 : 0.4, M_UMBER);
  limb(cx - 5, Y - 50, cx - 13, Y - 48, 5, 4.4, 0.14, 0.34, M_DUSK); limb(cx - 13, Y - 48, rh[0], rh[1], 3, 2.6, 0.5, 0.8, M_UMBER);
  ellipse(rh[0] + 0.5, rh[1] + 0.5, 2, 2, 0.76, M_UMBER);
  // the head: bald, stooped forward, the eyes bound in white with embers through the cloth, the mouth open in the hymn
  const hx = cx - 3, hy = Y - 59;
  limb(cx - 1, Y - 53, hx, hy + 4, 4, 3.6, 0.4, 0.7, M_UMBER);
  ellipse(hx + 0.5, hy + 0.5, 4.6, 5.4, (x, y) => 0.5 + 0.38 * clamp((hx + 4 - x) / 9) - 0.08 * clamp((y - hy) / 5), M_UMBER);
  rect(hx - 4, hy - 2, 10, 3, (x, y) => (y === hy - 2 ? 0.98 : 0.84), M_UMBER); put(hx + 5, hy - 1, 0.6, M_UMBER); put(hx + 6, hy, 0.55, M_UMBER); put(hx + 6, hy + 2, 0.5, M_UMBER);
  for (const ex of [hx - 3, hx]) { put(ex, hy - 1, 0.72, M_DANGER, 1); put(ex + 1, hy - 1, 0.45, M_DANGER, 1); }
  ellipse(hx - 1.5, hy + 3.5, 1.4, 1.6 + toll * 0.5, 0.03, M_DUSK);
  // the tolling: rings going out from the bell
  if (toll > 0) for (let k = 0; k < 3; k++) { const q = ((t * 1.6 + k / 3) % 1), R = 10 + q * 34; for (let a = 0; a < 70; a++) { const an = a / 70 * Math.PI * 2; if (Math.abs(Math.sin(an)) > 0.9) continue; const x = Math.round(hx0 + Math.cos(an) * R), y = Math.round(hy0 + 12 + Math.sin(an) * R * 0.6); if (lgB(x, y) < (1 - q) * toll * 0.8) put(x, y, 0.8 - q * 0.4, M_STONE, 1); } }
  EFX.bell = [hx0, hy0 + 10];
}

// ---------------------------------------------------------------- the Inquisitor (replaces the Black Knight, boss)
// The Church's judge in black iron. Angel-iron wings spread and raised behind him, each a curtain of blade-feathers
// hanging from an iron bone; massive layered pauldrons with high neck guards, so the helm sits sunk between them; a
// helm faced with a serene angel's mask, embers in its closed eyes; the broken halo behind his head; a tower shield
// with the halo on the far arm (Bash breaks it off). At rest the headsman's sword stands planted point-down before
// him under his fist. EXECUTE: the wings flare, he hauls the sword up through the air and back over his head.
// Draw order follows depth in every pose: the blade passes behind the helm only once it is over his back; the near
// arm raised comes up in front of the helm, out from under the near pauldron.
function inquisitor(cx, fy, t, o = {}) {
  const Y = fy + (Math.sin(t * 1.2) > 0.85 ? 1 : 0), shield = o.shield !== false;
  const w = clamp(o.wind || 0), s = clamp(o.strike || 0), r = clamp(o.recover || 0), ee = smoothQ(w);
  const flare = s > 0 ? 1 : r > 0 ? 1 - smoothQ(r) : ee, lift = Math.round(flare * 5);
  // the wings: an iron bone up from the shoulder blade to the wrist and out to a hooked tip; blade-feathers fanning
  // down and out from it; scalloped coverts over their roots
  const wingSp = (side, d) => {
    const E = [[cx + side * 6 + (side > 0 ? 2 : 0), Y - 60], [cx + side * 16, Y - 78 - lift], [cx + side * 27, Y - 100 - lift], [cx + side * 40, Y - 93 - lift * 1.4]];
    const seg = [], tot = [0]; for (let k = 1; k < E.length; k++) { seg.push(Math.hypot(E[k][0] - E[k - 1][0], E[k][1] - E[k - 1][1])); tot.push(tot[k - 1] + seg[k - 1]); }
    const at = (q) => { const s = q * tot[tot.length - 1]; let k = 0; while (k < seg.length - 1 && s > tot[k + 1]) k++; const f = clamp((s - tot[k]) / seg[k]); return [lerp(E[k][0], E[k + 1][0], f), lerp(E[k][1], E[k + 1][1], f)]; };
    const N = 12;
    for (let k = 0; k < N; k++) {
      const q = (k + 0.5) / N, [bx, by] = at(q), phi = lerp(0.06, 1.05, q ** 1.3) + (side > 0 ? 0.05 : 0);
      const len = (14 + 24 * Math.sin(clamp(q * 1.25) * Math.PI / 2) - (q > 0.82 ? (q - 0.82) * 55 : 0)) * (side > 0 ? 0.94 : 1);
      const dx = side * Math.sin(phi), dy = Math.cos(phi), nx = -dy, ny = dx, wB = 2.4;
      const P = [[bx + nx * wB, by + ny * wB], [bx + dx * len * 0.72 + nx * wB, by + dy * len * 0.72 + ny * wB], [bx + dx * len, by + dy * len], [bx + dx * len * 0.72 - nx * wB, by + dy * len * 0.72 - ny * wB], [bx - nx * wB, by - ny * wB]];
      const lit = side < 0 ? 1 : -1;   // which side of each blade faces the light (upper left)
      poly(P, (x, y) => { const r = ((x + 0.5 - bx) * nx + (y + 0.5 - by) * ny) / wB * lit, s = ((x + 0.5 - bx) * dx + (y + 0.5 - by) * dy) / len;
        let v = r > 0.5 ? 0.62 + 0.3 * (1 - s) : r < -0.5 ? 0.04 : Math.abs(r) < 0.18 && s > 0.12 && s < 0.7 ? 0.08 : 0.22 + 0.16 * (1 - s); return v * d; }, M_STONE);
      put(Math.round(bx + dx * len), Math.round(by + dy * len), 0.98 * d, M_STONE);
    }
    // coverts: a row of short rounded plates over the feather roots
    for (let k = 0; k < 8; k++) { const q = 0.18 + (k + 0.3) / 8 * 0.78, [bx, by] = at(q); const P = [[bx - 3, by - 1], [bx + 3, by - 1], [bx + 2 + side, by + 5], [bx + side * 1.5, by + 7], [bx - 2 + side, by + 5]]; plate(P, 0.06 * d, 0.5 * d, M_STONE, { edgeHi: 0.8 * d, edgeLo: 0.02 }); }
    // the bone: a riveted iron bar, gilt along its top, a hooked claw at the tip, a spur at the wrist
    ironBar(E, 3.4, d, true);
    for (let k = 1; k < 8; k++) { const [x, y] = at(k / 8); put(Math.round(x), Math.round(y), 0.98 * d, M_STONE); }
    const T = E[3]; line(T[0], T[1], T[0] + side * 3, T[1] + 4, 0.9 * d, M_STONE); put(T[0] + side * 3, T[1] + 5, 0.98 * d, M_STONE);
    const Wr = E[2]; poly([[Wr[0] - 1.5, Wr[1]], [Wr[0] + 1.5, Wr[1]], [Wr[0] + side * 1.5, Wr[1] - 7]], (x) => (0.5 + 0.45 * clamp((Wr[0] + 1 - x) / 3)) * d, M_UMBER);
  };
  wingSp(1, 0.66); wingSp(-1, 1);
  // the broken halo behind his head
  const hx = cx - 3, hy = Y - 71;
  brokenHalo(hx + 2.5, hy - 4.5, 11, 0.94, M_UMBER, t, { w: 2, bigSpark: true });
  // the far leg, a wide planted stance
  limb(cx + 5, Y - 30, cx + 10, fy - 15, 8, 7, 0.08, 0.3, M_STONE); limb(cx + 10, fy - 15, cx + 12, fy - 3, 7, 6, 0.08, 0.3, M_STONE);
  plate([[cx + 7, fy - 4], [cx + 18, fy - 3], [cx + 18, fy], [cx + 7, fy]], 0.08, 0.28);
  // the tower shield on the far arm (or the arm bare, once Bash breaks it)
  if (shield) {
    const SH = [[cx + 7, Y - 66], [cx + 27, Y - 64], [cx + 27, Y - 24], [cx + 17, Y - 10], [cx + 7, Y - 24]];
    poly(SH, (x, y) => 0.14 + 0.2 * clamp((cx + 27 - x) / 20) - ((x + y * 3) % 9 === 0 ? 0.03 : 0), M_DUSK);
    litEdges(SH, 0.9, 0.2, M_UMBER); for (const [x, y] of SH) put(Math.round(x), Math.round(y), 0.95, M_UMBER);
    brokenHalo(cx + 17.5, Y - 44, 6.5, 0.92, M_UMBER, t, { w: 2, bigSpark: true });
    rustPatch(cx + 9, Y - 30, 15, 15, 961, 0.6);
  } else { limb(cx + 10, Y - 58, cx + 15, Y - 44, 6, 5, 0.08, 0.3, M_STONE); limb(cx + 15, Y - 44, cx + 14, Y - 33, 5, 4.4, 0.08, 0.3, M_STONE); ellipse(cx + 14.5, Y - 31.5, 2.8, 2.8, 0.24, M_STONE); }
  // the cuirass: broad, black iron, gilt edges, a ridge, the halo embossed; leaning into the fight
  const CU = [[cx - 12, Y - 63], [cx + 10, Y - 64], [cx + 12, Y - 52], [cx + 8, Y - 36], [cx - 8, Y - 36], [cx - 12, Y - 50]];
  plate(CU, 0.1, 0.62, M_STONE, { edge: false }); litEdges(CU, 0.86, 0.3, M_UMBER);
  line(cx - 2, Y - 62, cx - 1, Y - 38, 0.8, M_STONE); line(cx - 1, Y - 62, cx, Y - 38, 0.06, M_STONE);
  for (const yy of [Y - 44, Y - 40]) { line(cx - 9, yy, cx + 9, yy - 1, 0.04, M_STONE); line(cx - 9, yy + 1, cx + 9, yy, 0.46, M_STONE); }
  brokenHalo(cx - 1.5, Y - 53, 3.8, 0.84, M_UMBER, t, { spark: false });
  // the surcoat from the waist: dusk-wine, a gilt hem, the belt
  const SC = [[cx - 9, Y - 36], [cx + 9, Y - 36], [cx + 11, fy - 8], [cx + 4, fy - 6], [cx - 2, fy - 8], [cx - 10, fy - 6]];
  poly(SC, (x, y) => 0.22 + 0.22 * clamp((cx + 11 - x) / 21) - ((x - cx + 30) % 4 === 0 ? 0.05 : 0), M_DUSK);
  for (let x = cx - 10; x <= cx + 11; x++) { const y = fy - 7 - (x > cx + 3 ? 1 : 0) + ((x - cx) % 6 === 0 ? 1 : 0); put(x, y, 0.82, M_UMBER); }
  rect(cx - 10, Y - 37, 21, 3, (x) => 0.2 + 0.2 * clamp((cx + 10 - x) / 20), M_UMBER); rect(cx - 2, Y - 37, 3, 3, 0.9, M_UMBER);
  // the near leg in plate, bent forward
  limb(cx - 4, Y - 30, cx - 9, fy - 15, 8, 7, 0.24, 0.78, M_STONE); limb(cx - 9, fy - 15, cx - 12, fy - 3, 7, 6, 0.24, 0.78, M_STONE);
  ellipse(cx - 9, fy - 15.5, 3.2, 2.6, (x) => 0.36 + 0.5 * clamp((cx - 6 - x) / 6), M_STONE);
  plate([[cx - 21, fy - 4], [cx - 11, fy - 5], [cx - 9, fy], [cx - 22, fy]], 0.2, 0.76);
  // the headsman's sword: planted point-down under his fist at rest; for EXECUTE hauled up forward and back over
  // his head. Broad, square-tipped, a fuller, a gilt guard and pommel.
  // The raise may bend the arm; the cut is a straight arm swung from the shoulder, accelerating, the blade snapping
  // through from over his back to forward and down; he holds the follow-through, then brings it back to rest.
  const sh = [cx - 12, Y - 60], h0 = [cx - 19, Y - 40], h1 = [cx - 9, Y - 86], A0 = Math.PI / 2 + 0.04, A1 = A0 + Math.PI + 1.12;
  const aUp = Math.atan2(h1[1] - sh[1], h1[0] - sh[0]), aDown = aUp - 2.55, LA = Math.hypot(h1[0] - sh[0], h1[1] - sh[1]);
  const off0 = Math.atan2(Math.sin(A1 - aUp), Math.cos(A1 - aUp));
  const cutAt = (k) => { const a = lerp(aUp, aDown, k ** 1.6), q = smoothQ(clamp(k * 1.5)); return { hd: [sh[0] + LA * Math.cos(a), sh[1] + LA * Math.sin(a)], ang: a + off0 * (1 - q) - 0.12 * q }; };
  let hd, ang, straight = false;
  if (s > 0) { const c = cutAt(s); hd = c.hd; ang = c.ang; straight = true; }
  else if (r > 0) { const c = cutAt(1), rr = smoothQ(r); hd = [lerp(c.hd[0], h0[0], rr), lerp(c.hd[1], h0[1], rr)]; ang = angLerp(c.ang, A0, rr); }
  else { hd = [lerp(h0[0], h1[0], ee) - Math.sin(ee * Math.PI) * 12, lerp(h0[1], h1[1], ee)]; ang = A0 + ee * (Math.PI + 1.12); }
  hd = hd.map(Math.round);
  const bL = 36, bxv = Math.cos(ang), byv = Math.sin(ang), bnx = -byv, bny = bxv;
  const behind = bxv > 0.05 && byv < 0.4 && hd[1] < Y - 70;   // the blade over his back passes behind the helm
  const cutTrail = s > 0.25 && (o.after || 0) < 0.35 ? Array.from({ length: 8 }, (_, j) => { const k = s - (j + 1) * 0.055; if (k < 0.18) return []; const c = cutAt(k), ex = Math.cos(c.ang), ey = Math.sin(c.ang); return Array.from({ length: 11 }, (_, m) => [c.hd[0] + ex * (16 + m * 2), c.hd[1] + ey * (16 + m * 2)]); }) : null;
  const blade = () => {
    for (let s = 5; s <= bL; s++) { const w = 2.8; for (let o2 = -w; o2 <= w; o2 += 0.5) { const x = Math.round(hd[0] + bxv * s + bnx * o2), y = Math.round(hd[1] + byv * s + bny * o2); const lit = (bnx * -0.6 + bny * -0.8) > 0 ? o2 : -o2; let v = lit > 1.4 ? 0.98 : lit < -1.4 ? 0.26 : 0.6; if (Math.abs(o2) < 0.4 && s > 8 && s < bL - 5) v = 0.12; if (s >= bL - 1) v = 0.5; put(x, y, v, M_STONE); } }
    for (const s of [bL - 9, bL - 5]) put(Math.round(hd[0] + bxv * s), Math.round(hd[1] + byv * s), 0.02, M_DUSK);
    for (let o2 = -6; o2 <= 6; o2 += 0.5) put(Math.round(hd[0] + bxv * 4 + bnx * o2), Math.round(hd[1] + byv * 4 + bny * o2), o2 * (bnx < 0 ? 1 : -1) < 0 ? 0.94 : 0.62, M_UMBER);
    for (let s = -5; s < 3; s++) put(Math.round(hd[0] + bxv * s), Math.round(hd[1] + byv * s), 0.3, M_UMBER);
    ellipse(hd[0] - bxv * 6 + 0.5, hd[1] - byv * 6 + 0.5, 1.8, 1.8, 0.9, M_UMBER);
  };
  if (behind) blade();
  // the gorget and the far pauldron
  plate([[hx - 6, Y - 66], [hx + 9, Y - 66], [hx + 8, Y - 61], [hx - 5, Y - 61]], 0.12, 0.6);
  const bigPauldron = (px, py, dir, d, th = 0, piv = null) => {   // dir: +1 the far shoulder (flares right), -1 the near; th turns it about piv
    const T = th ? rotAbout(piv[0], piv[1], th) : (x, y) => [x, y], TP = (pts) => pts.map(([x, y]) => T(x, y)), PT = (x, y, v, m) => { const [a, b] = T(x, y); put(Math.round(a), Math.round(b), v, m); };
    for (let k = 3; k >= 1; k--) { const cxk = px + dir * (k * 1.8 + 1), hw = 7 + k * 0.6, top = py + 2 + k * 3.2;
      const L = TP([[cxk - hw, top + (dir < 0 ? 1.5 : 0)], [cxk + hw, top + (dir > 0 ? 1.5 : 0)], [cxk + hw - 1, top + 4], [cxk - hw + 1, top + 4]]);
      rimPoly(L, 1); plate(L, 0.04 * d, (0.26 + 0.06 * (3 - k)) * d, M_STONE, { edge: false }); line(L[0][0], L[0][1], L[1][0], L[1][1], 0.86 * d, M_UMBER); line(L[3][0], L[3][1], L[2][0], L[2][1], 0.02, M_STONE); }
    // the cap: a broad angular plate of black iron sweeping up to a point at the outer edge, gilt along its rim
    const o = dir, CAP = TP([[px - o * 7, py + 4], [px - o * 7, py - 3], [px - o * 2, py - 6], [px + o * 6, py - 6], [px + o * 13, py - 13], [px + o * 12, py - 3], [px + o * 10, py + 5]]);
    const LC = th ? rotAbout(piv[0], piv[1], -th) : (x, y) => [x, y];
    rimPoly(CAP, 1.6);
    poly(CAP, (x, y) => { const [lx, ly] = LC(x, y), u = clamp(((lx - px) * -o + 8) / 22), w = clamp((py + 5 - ly) / 18); return (0.06 + 0.34 * (o < 0 ? 1 - u : u * 0.6 + 0.2) ** 1.2 + 0.12 * w) * d; }, M_STONE);
    litEdges(CAP, 0.9 * d, 0.03, M_UMBER);
    for (let s2 = 0; s2 <= 18; s2++) { const q = s2 / 18, x = lerp(px - o * 5, px + o * 12, q), y = lerp(py - 1, py - 11, q ** 1.6); PT(x, y, 0.94 * d, M_STONE); PT(x, y + 1, 0.04, M_STONE); }
    for (let x = Math.min(px - o * 7, px + o * 10); x <= Math.max(px - o * 7, px + o * 10); x++) PT(x, py + 4 + (((x - px) * o) > 6 ? 1 : 0), 0.86 * d, M_UMBER);
    // the high neck guard on the inner edge
    const gx = px - o * 6, NG = TP([[gx - 2, py - 3], [gx + 2, py - 3], [gx + 2 + o * 2, py - 13], [gx - 2 + o, py - 13]]); rimPoly(NG, 1); poly(NG, (x) => (0.12 + 0.46 * clamp((Math.min(...NG.map((p) => p[0])) + 4 - x) / 5)) * d, M_STONE);
    line(NG[3][0], NG[3][1], NG[2][0], NG[2][1], 0.94 * d, M_UMBER);
    for (let k = 0; k < 3; k++) PT(lerp(px - 4, px + 6 * o, k / 2), lerp(py + 1, py - 1, k / 2), 0.94 * d, M_STONE);
    { const [rx, ry] = T(px - 3, py - 4); rustPatch(Math.round(rx), Math.round(ry), 8, 6, 963 + dir, 0.62); }
  };
  bigPauldron(cx + 11, Y - 62, 1, 0.66);
  // the helm, sunk between the pauldrons, faced with the angel's mask
  const HL = [[hx - 8, hy + 8], [hx - 8, hy - 6], [hx - 5, hy - 11], [hx + 5, hy - 11], [hx + 8, hy - 6], [hx + 8, hy + 8]];
  rimPoly(HL, 1.2); plate(HL, 0.06, 0.42, M_STONE, { edge: false }); litEdges(HL, 0.84, 0.03, M_UMBER);
  for (let k = 0; k < 5; k++) { const x0 = hx - 5 + k * 2; poly([[x0, hy - 11], [x0 + 2, hy - 11], [x0 + 1, hy - 16 - (k === 2 ? 5 : k === 1 || k === 3 ? 3 : 0)]], k < 3 ? 0.84 : 0.48, M_STONE); }
  ellipse(hx - 1.5, hy + 1.5, 5.2, 6.6, (x, y) => 0.48 + 0.36 * clamp((hx + 2 - x) / 9) - 0.12 * clamp((y - hy) / 6), M_STONE);
  for (const ex2 of [hx - 5, hx]) { line(ex2, hy, ex2 + 2, hy, 0.03, M_DUSK); put(ex2 + 1, hy, 0.95, M_DANGER, 1); put(ex2 + 1, hy + 1, 0.55, M_DANGER, 1); put(ex2 + 1, hy + 2, 0.3, M_DANGER, 1); }
  line(hx - 2, hy, hx - 2, hy + 5, 0.94, M_STONE); put(hx - 1, hy + 5, 0.2, M_STONE);
  line(hx - 4, hy + 7, hx, hy + 7, 0.14, M_STONE);
  rect(hx - 8, hy - 7, 17, 1, 0.88, M_UMBER); rect(hx - 8, hy - 6, 17, 1, 0.3, M_UMBER);
  // the near arm: the upper arm, then the near pauldron over its shoulder, then the forearm and the fist
  const el = straight ? [lerp(sh[0], hd[0], 0.5), lerp(sh[1], hd[1], 0.5)] : ik2(sh[0], sh[1], hd[0], hd[1], 14, 14, s === 0 && r === 0 && ee > 0.5 ? -1 : 1);
  // the near pauldron is strapped to the upper arm: it lifts and turns with it about the shoulder
  const restEl = ik2(sh[0], sh[1], h0[0], h0[1], 14, 14, 1);
  let du = Math.atan2(el[1] - sh[1], el[0] - sh[0]) - Math.atan2(restEl[1] - sh[1], restEl[0] - sh[0]); while (du < -0.6) du += Math.PI * 2; while (du > Math.PI * 2 - 0.6) du -= Math.PI * 2;
  limb(sh[0], sh[1], el[0], el[1], 6, 5.4, 0.22, 0.78, M_STONE);
  bigPauldron(cx - 13, Y - 62, -1, 1, clamp(du * 0.3, 0, 0.75), [cx - 6, Y - 65]);
  limb(el[0], el[1], hd[0], hd[1], 5.4, 4.8, 0.22, 0.78, M_STONE);
  ellipse(el[0] + 0.5, el[1] + 0.5, 2.6, 2.6, (x) => 0.3 + 0.6 * clamp((el[0] + 2 - x) / 5), M_STONE);
  if (cutTrail) smear(cutTrail, 0.9);
  if (!behind) blade();
  ellipse(hd[0] + 0.5, hd[1] + 0.5, 3, 2.8, (x) => 0.24 + 0.6 * clamp((hd[0] + 2 - x) / 5), M_STONE); put(hd[0] - 2, hd[1] - 1, 0.95, M_STONE);
  EFX.inq = [hx, hy];
}

// ---------------------------------------------------------------- the Abbot (replaces the troll: the curio and its fight)
// The abbot of the crypt's chapter, who kept the tithe and armed himself to keep it: a war-priest in black iron and a
// black habit. A deep cowl over a gaunt grey face, embers sunk in its sockets, the lower jaw an iron plate riveted on,
// slotted for his breath, an iron pipe from it into his collar. A high iron collar stands behind his head; heavy
// domed pauldrons, the near one carrying a reliquary candle; a gothic breastplate with a gilt ridge, the broken halo
// boss and wax seals on cords; a wine tabard with the halo in the split of his habit; the tithe ledger, iron-bound,
// chained to his belt. On his back a banner pole: a wine banner with the gilt halo, a candle at each end of its bar.
// His weapon is a great iron mace on a long haft, its head a broken halo ringed with flanges, swung two-handed: up
// over his shoulder, then down in one fast arc with straight arms.
// Asleep (the curio) he sits slumped on the tithe heap, the banner planted behind him; now and then an eye opens.
function titheHeap(cx, fy, t, w = 26) {
  for (let x = cx - w; x <= cx + w; x++) { const q = (x - cx) / w, h = Math.round(13 * (1 - q * q) + 2 * hash(x, 0, 971)); for (let j = 0; j < h; j++) { const y = fy - j, coin = ((x * 3 + j * 5) % 7 === 0); put(x, y, coin ? 1 : 0.62 + 0.3 * clamp(-q * 0.6 + 0.4 + 0.3 * (j / Math.max(1, h))) - (hash(x, y, 972) > 0.8 ? 0.14 : 0), M_LOOT); } }
  rect(cx + 12, fy - 18, 5, 2, 0.8, M_LOOT); rect(cx + 13, fy - 16, 3, 3, 0.66, M_LOOT); rect(cx + 14, fy - 13, 1, 3, 0.6, M_LOOT); rect(cx + 12, fy - 11, 5, 1, 0.7, M_LOOT);
  for (const [dx, dy, m] of [[-8, -9, M_MAGIC], [6, -11, M_MOSS], [18, -6, M_DANGER], [-14, -5, M_MOSS]]) { put(cx + dx, fy + dy, 0.95, m, 1); put(cx + dx + 1, fy + dy, 0.6, m, 1); }
  const sn = Math.max(0, Math.sin(t * 2.1)); for (let k = 0; k < 4; k++) if (sn > 0.7) put(cx - 16 + k * 10, fy - 13 + Math.round(-2 * hash(k, Math.floor(t * 8), 973) * (1 - k * 0.1)) - (k === 1 ? 2 : 0), 0.98, M_LOOT);
}
// the mace's head: a broken halo of iron ringed with flanges
function haloMace(x, y, r, d = 1, ang = 0) {
  for (let k = 0; k < 8; k++) { const an = ang + k / 8 * Math.PI * 2, ox = Math.cos(an), oy = Math.sin(an); poly([[x + ox * r - oy * 1.8, y + oy * r + ox * 1.8], [x + ox * (r + 4.5), y + oy * (r + 4.5)], [x + ox * r + oy * 1.8, y + oy * r - ox * 1.8]], (xx) => (0.3 + 0.6 * clamp((x + r - xx) / (2 * r))) * d, M_STONE); }
  brokenHalo(x, y, r + 0.5, 0.96 * d, M_STONE, 0, { w: 2, spark: false });
  ellipse(x, y, r - 1.5, r - 1.5, 0.03, M_DUSK);
  for (let k = 0; k < 8; k++) { const an = ang + k / 8 * Math.PI * 2; put(Math.round(x - 0.5 + Math.cos(an) * (r - 0.5)), Math.round(y - 0.5 + Math.sin(an) * (r - 0.5)), 0.86 * d, M_UMBER); }
}
// the war-priest's pieces, shared by the standing and the sleeping Abbot
function abbotBanner(px, py, top, t, d = 1, sway = 1) {   // the banner pole from (px, py) up to y top
  ironBar([[px, py], [px + 2, top]], 2.2, d);
  const bx0 = px - 6, bx1 = px + 12, by0 = top + 4, sw = Math.sin(t * 1.3) * sway;
  rect(bx0 - 1, top + 2, bx1 - bx0 + 3, 2, (x) => (0.3 + 0.6 * clamp((bx1 - x) / 18)) * d, M_STONE);
  const BN = [[bx0, by0], [bx1, by0], [bx1 + sw, by0 + 26], [px + 3 + sw, by0 + 20], [bx0 + sw, by0 + 26]];
  poly(BN, (x, y) => (0.22 + 0.22 * clamp((bx1 - x) / 18) - ((x + Math.round(y * 0.2)) % 5 === 0 ? 0.07 : 0)) * d, M_DUSK);
  for (const [a, b] of [[BN[0], BN[4]], [BN[1], BN[2]]]) line(a[0], a[1], b[0], b[1], 0.7 * d, M_UMBER);
  line(BN[4][0], BN[4][1], BN[3][0], BN[3][1], 0.62 * d, M_UMBER); line(BN[3][0], BN[3][1], BN[2][0], BN[2][1], 0.5 * d, M_UMBER);
  brokenHalo(px + 3.5 + sw * 0.5, by0 + 10, 4.2, 0.9 * d, M_UMBER, t, { w: 1, spark: false });
  poly([[px + 1, top + 1], [px + 4, top + 1], [px + 2.5, top - 5]], 0.86 * d, M_UMBER);
  for (const x of [bx0 - 1, bx1 + 1]) { rect(x, top - 3, 2, 5, (xx) => (xx === x ? 0.92 : 0.7) * d, M_UMBER); AOJ.candles = AOJ.candles || []; AOJ.candles.push([x, top - 4, t, x]); }
}
function abbotPauldron(px, py, dir, d, th = 0, piv = null, candle = null) {   // domed, two lames, a gilt rim; dir -1 near
  const T = th ? rotAbout(piv[0], piv[1], th) : (x, y) => [x, y];
  for (let k = 2; k >= 1; k--) { const cxk = px + dir * k * 1.5, hw = 8 + k * 0.6, top = py + 3 + k * 3;
    const L = [[cxk - hw, top], [cxk + hw, top], [cxk + hw - 1, top + 4], [cxk - hw + 1, top + 4]].map(([x, y]) => T(x, y));
    rimPoly(L, 1); plate(L, 0.04 * d, (0.3 + 0.08 * (2 - k)) * d, M_STONE, { edge: false }); line(L[0][0], L[0][1], L[1][0], L[1][1], 0.8 * d, M_UMBER); }
  const DM = Array.from({ length: 18 }, (_, k) => { const a = Math.PI + k / 17 * Math.PI; return T(px + Math.cos(a) * 9, py + 4 + Math.sin(a) * 9); });
  rimPoly(DM, 1.3);
  poly(DM, (x, y) => { const [lx, ly] = th ? rotAbout(piv[0], piv[1], -th)(x + 0.5, y + 0.5) : [x + 0.5, y + 0.5]; const u = (lx - px) / 9, v = (ly - py - 4) / 9, nz = Math.sqrt(Math.max(0, 1 - u * u - v * v)); return (0.08 + 0.78 * clamp(-u * 0.55 - v * 0.6 + nz * 0.45) ** 1.4) * d; }, M_STONE);
  for (let k = 0; k <= 17; k++) { const [x, y] = DM[k]; if (k % 3 === 0) put(Math.round(x), Math.round(y), 0.9 * d, M_UMBER); }
  { const [a, b] = [T(px - 9, py + 4), T(px + 9, py + 4)]; line(a[0], a[1], b[0], b[1], 0.86 * d, M_UMBER); }
  for (let k = 0; k < 5; k++) { const [x, y] = T(px - 6 + k * 3, py + 2); put(Math.round(x), Math.round(y), 0.96 * d, M_STONE); }
  { const [x, y] = T(px - 2, py - 1); rustPatch(Math.round(x), Math.round(y), 6, 4, 1321 + dir, 0.62); }
  if (candle) {   // a little iron reliquary on the dome with a candle burning on it, wax run down
    const [x, y] = T(px + 1, py - 4); const X = Math.round(x), Yc = Math.round(y);
    rect(X - 2, Yc - 2, 5, 3, (xx) => (xx === X - 2 ? 0.9 : 0.4) * d, M_STONE); rect(X - 1, Yc - 7, 2, 5, (xx) => (xx === X - 1 ? 0.96 : 0.74) * d, M_UMBER);
    put(X - 2, Yc + 1, 0.86, M_UMBER); put(X - 2, Yc + 2, 0.8, M_UMBER); put(X + 2, Yc + 1, 0.7, M_UMBER);
    AOJ.candles = AOJ.candles || []; AOJ.candles.push([X - 1, Yc - 8, candle, X]);
  }
}
function abbotHead(hx, hy, t, o = {}) {   // the cowl, the gaunt face, the iron jaw; o.bow bows it, o.shut closes the eyes
  const HD = [[hx - 8, hy + 9], [hx - 9, hy - 1], [hx - 5, hy - 8], [hx + 2, hy - 10], [hx + 8, hy - 5], [hx + 10, hy + 3], [hx + 9, hy + 11]];
  rimPoly(HD, 1); poly(HD, (x, y) => 0.05 + 0.24 * clamp((hx + 10 - x) / 19) ** 1.3 * (1 - 0.35 * clamp((y - hy + 4) / 14)), M_DUSK); litEdges(HD, 0.44, 0.02, M_DUSK);
  ellipse(hx - 1.5, hy + 1.5, 5.4, 6.4, 0.01, M_DUSK);
  const lit = o.bow ? 0.55 : 1;
  ellipse(hx - 1.5, hy + 1.5, 4.4, 5.4, (x, y) => (0.46 + 0.4 * clamp((hx + 2 - x) / 7) - 0.26 * clamp((hy - 1 - y) / 4)) * lit, M_UMBER);
  for (let x = hx - 5; x <= hx + 2; x++) put(x, hy - 2, 0.06, M_UMBER);
  for (const ex of [hx - 5, hx - 1]) {
    rect(ex, hy - 1, 3, 2, 0.02, M_DUSK);
    if (!o.shut) { eyeLight(ex + 1, hy, t, ex, false); put(ex, hy, 0.5, M_DANGER, 1); }
    else if (o.peek && ex === hx - 1) { put(ex + 1, hy, 0.95, M_DANGER, 1); put(ex + 2, hy, 0.5, M_DANGER, 1); }
  }
  put(hx - 3, hy + 1, 0.8 * lit, M_UMBER); put(hx - 3, hy + 2, 0.62 * lit, M_UMBER);
  put(hx - 6, hy + 2, 0.12, M_UMBER); put(hx + 1, hy + 2, 0.1, M_UMBER);
  const JW = [[hx - 6, hy + 3], [hx + 2, hy + 3], [hx + 3, hy + 6], [hx + 1, hy + 9], [hx - 5, hy + 9], [hx - 7, hy + 6]];
  plate(JW, 0.2 * lit, 0.86 * lit, M_STONE, { edgeHi: lit, edgeLo: 0.04 });
  for (const x of [hx - 5, hx - 3, hx - 1]) line(x, hy + 5, x, hy + 7, 0.03, M_DUSK);
  rivets(hx - 6, hy + 4, hx + 2, hy + 4, 3, lit); rustPatch(hx - 3, hy + 7, 5, 3, 1331, 0.55);
  // the breathing pipe from the jaw back into the collar
  for (let k = 0; k <= 8; k++) { const q = k / 8, x = Math.round(hx + 2 + q * 5), y = Math.round(hy + 7 + Math.sin(q * Math.PI) * 2 + q * 3); put(x, y, 0.8 * lit, M_STONE); put(x, y + 1, 0.2, M_STONE); }
}
function abbot(cx, fy, t, o = {}) {
  const Y = fy + (Math.sin(t * 1.6) > 0.85 ? 1 : 0), SK = M_UMBER;
  const w = clamp(o.wind || 0), s = clamp(o.strike || 0), r = clamp(o.recover || 0), ee = smoothQ(w);
  // the mace's pose: upright in his near hand at rest; raised over his near shoulder; then the cut, arms straight
  const sh = [cx - 13, Y - 57], h0 = [cx - 20, Y - 44], A0 = -Math.PI / 2 - 0.03, LA = 24, aUp = -1.92, A1 = -0.3, aDown = aUp - 2.3;
  const h1 = [sh[0] + LA * Math.cos(aUp), sh[1] + LA * Math.sin(aUp)];
  const cutAt = (k) => { const a = lerp(aUp, aDown, k ** 1.6), off = (A1 - aUp) * (1 - smoothQ(clamp(k * 1.4))); return { hd: [sh[0] + LA * Math.cos(a), sh[1] + LA * Math.sin(a)], ang: a + off }; };
  let hd, ang, straight = false, butt;
  if (s > 0) { const c = cutAt(s); hd = c.hd; ang = c.ang; straight = true; butt = 10; }
  else if (r > 0) { const c = cutAt(1), rr = smoothQ(r); hd = [lerp(c.hd[0], h0[0], rr), lerp(c.hd[1], h0[1], rr)]; ang = angLerp(c.ang, A0, rr); butt = lerp(10, 43, rr); }
  else { hd = [lerp(h0[0], h1[0], ee) - Math.sin(ee * Math.PI) * 6, lerp(h0[1], h1[1], ee)]; ang = angLerp(A0, A1, ee); butt = lerp(43, 10, clamp(ee * 2)); }
  hd = hd.map(Math.round);
  const dx = Math.cos(ang), dy = Math.sin(ang), headAt = [hd[0] + dx * 36, hd[1] + dy * 36];
  const two = s > 0 ? 1 : r > 0 ? 1 - smoothQ(r) : clamp(w * 3), behind = dx > 0.1 && headAt[1] < Y - 66;
  const el = straight ? [lerp(sh[0], hd[0], 0.5), lerp(sh[1], hd[1], 0.5)] : ik2(sh[0], sh[1], hd[0], hd[1], 12, 12, 1);
  const restEl = ik2(sh[0], sh[1], h0[0], h0[1], 12, 12, 1);
  let du = Math.atan2(el[1] - sh[1], el[0] - sh[0]) - Math.atan2(restEl[1] - sh[1], restEl[0] - sh[0]); while (du < -0.6) du += Math.PI * 2; while (du > Math.PI * 2 - 0.6) du -= Math.PI * 2;
  const th = clamp(du * 0.3, 0, 0.75);
  const fsh = [cx + 10, Y - 57], restF = [cx + 13, Y - 33], onHaft = [hd[0] - dx * 6, hd[1] - dy * 6];
  const fhand = [lerp(restF[0], onHaft[0], two), lerp(restF[1], onHaft[1], two)];
  const fel = two > 0.5 ? (straight ? [lerp(fsh[0], fhand[0], 0.5), lerp(fsh[1], fhand[1], 0.5) - 2] : ik2(fsh[0], fsh[1], fhand[0], fhand[1], 14, 14, 1)) : [cx + 15, Y - 45];
  const mace = (trail) => {
    if (trail) smear(trail, 0.85);
    const b0 = [hd[0] - dx * butt, hd[1] - dy * butt];
    ironBar([b0, headAt], 2.4, 1);
    for (const k of [0.3, 0.6]) { const x = Math.round(lerp(b0[0], headAt[0], k)), y = Math.round(lerp(b0[1], headAt[1], k)); put(x, y, 0.86, M_UMBER); }
    haloMace(headAt[0] + dx * 2, headAt[1] + dy * 2, 5.6, 1, ang);
  };
  const cutTrail = s > 0.25 && (o.after || 0) < 0.35 ? Array.from({ length: 7 }, (_, j) => { const k = s - (j + 1) * 0.06; if (k < 0.15) return []; const c = cutAt(k), ex = Math.cos(c.ang), ey = Math.sin(c.ang); return Array.from({ length: 12 }, (_, m) => [c.hd[0] + ex * (24 + m * 1.5), c.hd[1] + ey * (24 + m * 1.5)]); }) : null;
  // the banner on his back
  abbotBanner(cx + 8, Y - 42, Y - 104, t, 0.9, 1);
  if (behind) mace(null);
  // the legs in plate below the habit
  for (const [h, k, a, d] of [[cx + 4, cx + 7, cx + 8, 0.62], [cx - 4, cx - 8, cx - 10, 1]]) { limb(h, Y - 30, k, fy - 14, 8, 7, 0.1 * d, 0.6 * d, M_STONE); limb(k, fy - 14, a, fy - 3, 7, 6, 0.12 * d, 0.7 * d, M_STONE); plate([[a - 7, fy - 4], [a + 4, fy - 4], [a + 5, fy], [a - 8, fy]], 0.1 * d, 0.66 * d, M_STONE); }
  // the far arm at rest, hanging behind his hip to the ledger
  if (two <= 0.5) { limb(fsh[0], fsh[1], fel[0], fel[1], 7, 6, 0.04, 0.2, M_DUSK); limb(fel[0], fel[1], fhand[0], fhand[1], 6, 5, 0.04, 0.2, M_DUSK); }
  // the ledger: iron-bound, chained to the belt, at his far hip
  chainLinks(sag(cx + 8, Y - 35, cx + 14, Y - 30, 1, 4), 0.8);
  rect(cx + 10, Y - 30, 9, 11, (x) => 0.04 + 0.16 * clamp((cx + 19 - x) / 9), M_DUSK); rect(cx + 10, Y - 30, 9, 1, 0.8, SK); rect(cx + 18, Y - 29, 1, 10, 0.5, SK);
  for (const [x, y] of [[cx + 10, Y - 30], [cx + 18, Y - 30], [cx + 10, Y - 20], [cx + 18, Y - 20]]) put(x, y, 0.96, M_STONE); rect(cx + 12, Y - 26, 2, 3, 0.86, M_STONE);
  if (two <= 0.5) ellipse(fhand[0] + 0.5, fhand[1] - 1.5, 2.6, 2.4, 0.42, SK);
  // the habit: black, to the shins, split in front over the wine tabard with the halo
  const HB = [[cx - 12, Y - 37], [cx + 12, Y - 37], [cx + 16, fy - 7], [cx + 9, fy - 6], [cx + 3, fy - 8], [cx - 7, fy - 7], [cx - 15, fy - 6]];
  poly(HB, (x, y) => 0.04 + 0.18 * clamp((cx + 16 - x) / 31) ** 1.2 - (((x - cx + 60) % 5 === 0 && y > Y - 30) ? 0.03 : 0), M_DUSK); litEdges(HB, 0.34, 0.02, M_DUSK);
  ragHem(cx - 15, cx + 16, fy - 7, 2, 1341, 0.05, M_DUSK);
  const TB = [[cx - 6, Y - 36], [cx + 2, Y - 36], [cx + 3, fy - 9], [cx - 7, fy - 9]];
  poly(TB, (x, y) => 0.3 + 0.18 * clamp((cx + 3 - x) / 10) - ((x + y) % 6 === 0 ? 0.05 : 0), M_DUSK);
  for (let x = cx - 7; x <= cx + 3; x++) put(x, fy - 9, 0.86, SK); for (let y = Y - 36; y < fy - 9; y++) { put(cx - 6, y, 0.6, SK); put(cx + 2, y, 0.4, SK); }
  brokenHalo(cx - 1.5, Y - 24, 2.6, 0.84, SK, t, { spark: false });
  // the belt: dark leather, iron studs, a gilt buckle
  rect(cx - 12, Y - 38, 25, 3, (x) => 0.12 + 0.12 * clamp((cx + 13 - x) / 25), SK); for (let x = cx - 10; x < cx + 12; x += 4) put(x, Y - 37, 0.92, M_STONE);
  rect(cx - 3, Y - 39, 5, 5, (x, y) => (x === cx - 3 || y === Y - 39 ? 0.98 : 0.7), SK); rect(cx - 2, Y - 38, 3, 3, 0.1, M_DUSK);
  // the high collar standing behind his head, then the breastplate in front of its foot
  const CL = [[cx - 13, Y - 57], [cx - 14, Y - 72], [cx - 9, Y - 81], [cx + 5, Y - 82], [cx + 12, Y - 74], [cx + 11, Y - 57]];
  rimPoly(CL, 1.2); poly(CL, (x, y) => 0.06 + 0.3 * clamp((cx + 11 - x) / 25) ** 1.2 + 0.08 * clamp((Y - 60 - y) / 18), M_STONE); litEdges(CL, 0.92, 0.04, SK);
  for (const [x, y] of [[cx - 12, Y - 70], [cx - 8, Y - 77], [cx + 3, Y - 78], [cx + 9, Y - 72]]) put(x, y, 0.98, M_STONE);
  const BP = [[cx - 12, Y - 60], [cx + 10, Y - 61], [cx + 12, Y - 50], [cx + 9, Y - 37], [cx - 9, Y - 37], [cx - 13, Y - 49]];
  rimPoly(BP, 1); plate(BP, 0.06, 0.52, M_STONE, { edge: false }); litEdges(BP, 0.9, 0.2, SK);
  line(cx - 2, Y - 59, cx - 1, Y - 39, 0.86, SK); line(cx - 1, Y - 59, cx, Y - 39, 0.06, M_STONE);
  for (const yy of [Y - 45, Y - 41]) { line(cx - 10, yy, cx + 10, yy - 1, 0.03, M_STONE); line(cx - 10, yy + 1, cx + 10, yy, 0.42, M_STONE); }
  brokenHalo(cx - 1.5, Y - 51.5, 3.2, 0.94, SK, t, { w: 1, spark: false }); put(cx - 2, Y - 52, 0.9, SK);
  // wax seals on cords, bronze wax and pale strips
  for (const [x, y, n] of [[cx - 8, Y - 55, 1351], [cx + 6, Y - 57, 1352]]) {
    for (const ox of [-1, 1]) for (let j = 0; j < 7; j++) put(x + ox + Math.round(Math.sin(t * 2 + j * 0.6 + n) * 0.5 * (j / 7)), y + 2 + j, j === 6 ? 0.5 : 0.84 - j * 0.03, M_STONE);
    ellipse(x + 0.5, y + 0.5, 2, 2, (xx) => 0.5 + 0.34 * clamp((x + 1 - xx) / 3), SK); put(x, y, 0.2, SK);
  }
  // the far pauldron
  abbotPauldron(cx + 11, Y - 60, 1, 0.66);
  // the head
  const hx = cx - 2, hy = Y - 67;
  abbotHead(hx, hy, t);
  // the near arm: the upper arm, the near pauldron lifting with it, then the forearm; the far arm joins on the haft
  limb(sh[0], sh[1], el[0], el[1], 7, 6, 0.06, 0.26, M_DUSK);
  abbotPauldron(cx - 15, Y - 59, -1, 1, th, [cx - 7, Y - 62], t);
  limb(el[0], el[1], hd[0], hd[1], 6, 5, 0.06, 0.26, M_DUSK);
  { const ux = hd[0] - el[0], uy = hd[1] - el[1], L = Math.hypot(ux, uy) || 1, c = [hd[0] - ux / L * 3, hd[1] - uy / L * 3]; limb(c[0] - ux / L * 2, c[1] - uy / L * 2, c[0] + ux / L * 1, c[1] + uy / L * 1, 6.4, 6.4, 0.24, 0.92, M_STONE); }
  if (two > 0.5) { limb(fsh[0], fsh[1], fel[0], fel[1], 7, 6, 0.06, 0.24, M_DUSK); limb(fel[0], fel[1], fhand[0], fhand[1], 6, 5, 0.06, 0.24, M_DUSK); }
  if (!behind) mace(cutTrail);
  if (two > 0.5) ellipse(fhand[0] + 0.5, fhand[1] + 0.5, 2.6, 2.4, 0.4, SK);
  ellipse(hd[0] + 0.5, hd[1] + 0.5, 2.8, 2.6, (x) => 0.36 + 0.36 * clamp((hd[0] + 2 - x) / 5), SK);
  EFX.abbot = [hx, hy]; EFX.mace = headAt;
}
function abbotAsleep(cx, fy, t, o = {}) {
  const SK = M_UMBER, breath = Math.sin(t * 2.1), by = fy - 11, bb = Math.round(breath * 0.6);
  // the banner planted in the heap behind him, hanging still; the iron-bound chest he leans on
  abbotBanner(cx + 15, fy - 8, by - 80, t, 0.85, 0.2);
  titheHeap(cx + 2, fy, t, o.heap || 30);   // smaller once an armful has been taken (#131)
  rect(cx + 6, by - 24, 18, 22, (x, y) => (y === by - 24 ? 0.6 : 0.06 + 0.14 * clamp((cx + 24 - x) / 18)), M_DUSK);
  for (const x of [cx + 7, cx + 15, cx + 22]) for (let y = by - 24; y < by - 2; y++) put(x, y, x === cx + 7 ? 0.9 : 0.44, M_STONE);
  rect(cx + 6, by - 14, 18, 2, (x) => (x < cx + 12 ? 0.86 : 0.42), M_STONE); rect(cx + 13, by - 15, 4, 4, 0.7, M_STONE); put(cx + 14, by - 13, 0.04, M_DUSK);
  // the legs in plate out over the heap, the habit over his lap
  for (const [k, a, d] of [[[cx - 13, by - 5], [cx - 17, fy - 9], 0.66], [[cx - 16, by - 3], [cx - 21, fy - 7], 1]]) { limb(cx - 2, by - 4, k[0], k[1], 8, 7, 0.1 * d, 0.6 * d, M_STONE); limb(k[0], k[1], a[0], a[1], 7, 6, 0.12 * d, 0.7 * d, M_STONE); plate([[a[0] - 7, a[1] - 3], [a[0] + 3, a[1] - 3], [a[0] + 4, a[1] + 1], [a[0] - 8, a[1] + 1]], 0.1 * d, 0.66 * d, M_STONE); }
  const LP = [[cx + 8, by - 30], [cx + 11, by], [cx - 4, by + 1], [cx - 15, by - 1], [cx - 16, by - 8], [cx - 6, by - 12]];
  poly(LP, (x) => 0.04 + 0.18 * clamp((cx + 11 - x) / 27) ** 1.2, M_DUSK); litEdges(LP, 0.3, 0.02, M_DUSK);
  // the collar, the breastplate slumped forward, the pauldrons
  const CL = [[cx - 12, by - 34], [cx - 14, by - 46], [cx - 7, by - 53], [cx + 5, by - 53], [cx + 11, by - 46], [cx + 10, by - 34]];
  rimPoly(CL, 1.2); poly(CL, (x, y) => 0.06 + 0.28 * clamp((cx + 11 - x) / 25) ** 1.2, M_STONE); litEdges(CL, 0.86, 0.04, SK);
  const BP = [[cx - 13, by - 36], [cx + 8, by - 36], [cx + 10, by - 24], [cx + 6, by - 12], [cx - 11, by - 12], [cx - 14, by - 24]];
  rimPoly(BP, 1); plate(BP, 0.06, 0.48, M_STONE, { edge: false }); litEdges(BP, 0.86, 0.2, SK);
  line(cx - 3, by - 35, cx - 2, by - 14, 0.82, SK);
  ellipse(cx - 2.5, by - 26.5, 3.4, 3.4, 0.05, M_DUSK); brokenHalo(cx - 2.5, by - 26.5, 3.1, 0.88, SK, t, { w: 1, spark: false });
  for (const [x, y, n] of [[cx - 9, by - 31, 1351]]) { for (const ox of [-1, 1]) for (let j = 0; j < 6; j++) put(x + ox, y + 2 + j, 0.82 - j * 0.04, M_STONE); ellipse(x + 0.5, y + 0.5, 2, 2, 0.66, SK); }
  abbotPauldron(cx + 10, by - 35, 1, 0.6);
  // the ledger in his folded hands on his lap
  rect(cx - 12, by - 14, 10, 7, (x) => 0.04 + 0.14 * clamp((cx - 2 - x) / 10), M_DUSK); rect(cx - 12, by - 14, 10, 1, 0.74, SK); for (const [x, y] of [[cx - 12, by - 14], [cx - 3, by - 14], [cx - 12, by - 8], [cx - 3, by - 8]]) put(x, y, 0.95, M_STONE);
  ellipse(cx - 9.5, by - 7.5, 3, 2.2, 0.36, SK); ellipse(cx - 4.5, by - 9, 2.4, 2, 0.3, SK);
  chainLinks(sag(cx - 3, by - 10, cx + 6, by - 4, 2, 5), 0.7);
  // the head bowed forward in the cowl, the face in shadow; now and then an eye opens
  const peek = (t % 7) > 5.2 && (t % 7) < 6.1;
  abbotHead(cx - 5, by - 41 + bb, t, { bow: true, shut: true, peek });
  abbotPauldron(cx - 15, by - 34, -1, 1, 0, null, t);
  // the mace leaning on his near shoulder, its butt in the heap
  ironBar([[cx - 25, fy - 6], [cx - 15, by - 56]], 2.4, 0.9); haloMace(cx - 14, by - 61, 5.6, 0.9, -1.3);
  // his breath fogs in the cold when he snores
  if (breath > 0.5) { const q = (breath - 0.5) / 0.5; for (let k = 0; k < 4; k++) { const x = cx - 14 - k - Math.round(q * 3), y = by - 31 + bb - k; if (lgB(x, y) < 0.62 - k * 0.12) put(x, y, 0.5 - k * 0.08, M_STONE); } }
  EFX.abbot = [cx - 6, by - 39];
}

// ---------------------------------------------------------------- the iron angel in the crypt's alcove (detailed)
// The saint in the moonlit alcove is one of the fallen: an iron angel set up as a statue by the Church. Serene iron
// face, one eye still an ember that weeps rust; the broken halo behind its head; folded wings of riveted iron feathers
// rising above its shoulders; a plated robe in fluted folds; its hands on the pommel of a great sword, point down;
// green patina in the recesses; chains from the alcove's walls holding its wings; a carved plinth with its name worn
// away, the halo cut into it, wax run down its front.
function ironAngelStatue(cx) {
  const base = 127;
  // clear the alcove's back (the old saint), keep its arch
  for (let y = 33; y < 140; y++) for (let x = cx - 16; x <= cx + 16; x++) { const inArch = y >= 44 ? true : Math.hypot((x + 0.5 - cx) / 16, (y + 0.5 - 44) / 10) <= 1; if (inArch) put(x, y, 0.025 + 0.025 * vnoise(x / 4, y / 4, 7), M_STONE); }
  const moss = (x, y) => y > 92 && vnoise(x / 3, y / 3, 981) > 0.76;
  const P = (x, y, v, recess) => put(x, y, recess && v < 0.3 && moss(x, y) ? v + 0.1 : v, recess && v < 0.3 && moss(x, y) ? M_MOSS : M_STONE);
  // the wings, folded: they rise to points above the halo, swell at the shoulders and run down behind the body to
  // the knees; coverts in scalloped rows above, long primaries in strips below
  const outer = (y) => (y < 62 ? 11.5 + 3.5 * Math.sin(clamp((y - 36) / 26) * Math.PI / 2) : y < 104 ? 15 - (y - 62) * 0.07 : 12 - (y - 104) * 0.4);
  const inner = (y) => (y < 62 ? 11.5 - 5.5 * clamp((y - 36) / 26) ** 0.8 : 6);
  for (const sd of [1, -1]) {
    const lit = sd < 0;
    for (let y = 36; y <= 114; y++) {
      const o2 = outer(y), i2 = inner(y); if (o2 <= i2 + 0.3) continue;
      for (let x = Math.round(cx + sd * i2); sd > 0 ? x <= Math.round(cx + sd * o2) : x >= Math.round(cx + sd * o2); x += sd) {
        const u = clamp((Math.abs(x - cx) - i2) / Math.max(1, o2 - i2));   // 0 at the body, 1 at the wing's edge
        let v;
        if (y < 62) {   // coverts: rows of scallops
          const row = Math.floor((y - 36) / 4), ry = (y - 36) % 4, sc = Math.round(Math.abs(Math.sin((Math.abs(x - cx) + row * 2) * 0.9)) * 1.6);
          v = lit ? 0.46 + 0.32 * u : 0.24 - 0.08 * u; if (ry >= 3 - sc) v = lit ? 0.18 : 0.08; if (ry === 0) v += lit ? 0.14 : 0.06;
        } else {        // primaries: strips three wide, their pointed tips staggered at the bottom
          const strip = Math.floor((Math.abs(x - cx) - 6) / 3), sx2 = (Math.abs(x - cx) - 6) % 3, end = 100 + strip * 4;
          if (y > end + (sx2 === 1 ? 2 : 0)) continue;
          v = lit ? 0.4 + 0.12 * strip - 0.14 * clamp((y - 62) / 44) : 0.22 - 0.03 * strip - 0.06 * clamp((y - 62) / 44);
          if (sx2 === (lit ? 2 : 0)) v = lit ? 0.14 : 0.06; else if (sx2 === (lit ? 0 : 2)) v += lit ? 0.16 : 0.06;
        }
        P(x, y, v, true);
      }
      // the leading edge: a bright rim on the lit wing, the moon's cold rim on the other
      const ex = Math.round(cx + sd * outer(y)); put(ex, y, lit ? 0.86 : 0.56, M_STONE);
    }
    for (let y = 40; y < 62; y += 4) put(Math.round(cx + sd * (inner(y) + 1)), y + 1, lit ? 0.95 : 0.5, M_STONE);
  }
  // the halo behind the head: gilt, broken, its spark
  brokenHalo(cx + 0.5, 53.5, 10, 0.92, M_UMBER, 0, { w: 2, bigSpark: true });
  // the robe from the waist: three deep folds, two riveted bands, flaring to the plinth
  for (let y = 80; y < base; y++) {
    const q = (y - 80) / (base - 80), hw = 7 + q * 3.5;
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      const u = (x - cx + hw) / (2 * hw);
      let v = 0.62 - 0.46 * u;
      for (const [f, d] of [[0.24, 1], [0.6, 0.8], [0.86, 0.6]]) { const dd = u - f - q * 0.02; if (Math.abs(dd) < 0.04) v = 0.08; else if (dd > 0 && dd < 0.1) v += 0.14 * d; }
      if (y === 100 || y === 114) v = 0.1; else if (y === 101 || y === 115) v += 0.18;
      P(x, y, v, u > 0.5);
    }
    if (y === 102 || y === 116) for (let x = Math.round(cx - hw) + 2; x < cx + hw - 1; x += 3) put(x, y, 0.92, M_STONE);
  }
  // the arms down to the hands on the pommel
  limb(cx + 8, 66, cx + 9, 77, 4, 3.6, 0.1, 0.32, M_STONE); limb(cx + 9, 77, cx + 3, 85, 3.6, 3, 0.1, 0.32, M_STONE);
  // the breastplate and the shoulders: the halo embossed on it
  const BP = [[cx - 8, 64], [cx + 8, 64], [cx + 7, 74], [cx + 6, 81], [cx - 6, 81], [cx - 7, 74]];
  poly(BP, (x, y) => 0.18 + 0.56 * clamp((cx + 7 - x) / 15) ** 1.1 - 0.06 * clamp((y - 64) / 17), M_STONE); litEdges(BP, 0.94, 0.05, M_STONE);
  brokenHalo(cx - 0.5, 72.5, 3, 0.86, M_UMBER, 0, { spark: false });
  line(cx - 7, 80, cx + 6, 80, 0.86, M_UMBER); line(cx - 6, 81, cx + 6, 81, 0.3, M_UMBER);
  for (const sd of [-1, 1]) { const P2 = [[cx + sd * 3, 64], [cx + sd * 10, 63], [cx + sd * 11, 67], [cx + sd * 9, 70], [cx + sd * 4, 67]]; poly(P2, sd < 0 ? 0.72 : 0.28, M_STONE); litEdges(P2, sd < 0 ? 0.96 : 0.44, 0.05, M_STONE); }
  limb(cx - 8, 66, cx - 9, 77, 4, 3.6, 0.24, 0.8, M_STONE); limb(cx - 9, 77, cx - 3, 85, 3.6, 3, 0.24, 0.8, M_STONE);
  // the great sword, point down: gilt crossguard and pommel, the hands folded over it
  for (let y = 90; y < base; y++) { put(cx - 1, y, 0.92, M_STONE); put(cx, y, 0.58, M_STONE); put(cx + 1, y, 0.2, M_STONE); }
  put(cx, base - 1, 0.4, M_STONE);
  for (let x = cx - 7; x <= cx + 7; x++) { put(x, 89, x < cx ? 0.92 : 0.6, M_UMBER); put(x, 90, 0.28, M_UMBER); }
  put(cx - 8, 88, 0.8, M_UMBER); put(cx + 8, 88, 0.5, M_UMBER);
  ellipse(cx - 1.5, 85.5, 3, 2.4, (x) => 0.3 + 0.5 * clamp((cx - x) / 4), M_STONE); ellipse(cx + 2.5, 85.5, 3, 2.4, 0.26, M_STONE);
  for (const x of [cx - 3, cx - 1, cx + 2]) put(x, 86, 0.06, M_STONE);
  put(cx, 83, 0.94, M_UMBER); put(cx + 1, 83, 0.6, M_UMBER);
  // the head: a serene iron face, hair in long locks, the eyes closed; one still an ember, weeping a line of rust
  const hx = cx, hy = 56;
  for (const sd of [-1, 1]) for (let y = hy - 5; y < hy + 8; y++) for (let k = 0; k < 2; k++) { const x = hx + sd * (4 + k) + (y > hy + 4 ? sd : 0); put(x, y, (sd < 0 ? 0.56 - k * 0.14 : 0.24 - k * 0.06) + ((y + k) % 3 === 0 ? -0.08 : 0), M_STONE); }
  ellipse(hx + 0.5, hy + 0.5, 4, 5.6, (x, y) => 0.3 + 0.56 * clamp((hx + 3.5 - x) / 7.5) ** 0.9 - 0.1 * clamp((y - hy) / 6), M_STONE);
  for (let x = hx - 4; x <= hx + 4; x++) put(x, hy - 5 + Math.round(Math.abs(x - hx) * 0.35), x < hx ? 0.7 : 0.4, M_STONE);
  line(hx - 3, hy, hx - 1, hy, 0.06, M_STONE); line(hx + 1, hy, hx + 2, hy, 0.06, M_STONE);
  put(hx + 2, hy, 1, M_DANGER, 1); put(hx + 3, hy, 0.6, M_DANGER, 1); put(hx + 2, hy + 1, 0.55, M_DANGER, 1);
  for (let y = hy + 2; y < hy + 10; y++) put(hx + 2, y, 0.6 + 0.2 * hash(y, 0, 982), M_UMBER);
  line(hx - 1, hy, hx - 1, hy + 3, 0.92, M_STONE); put(hx, hy + 3, 0.2, M_STONE);
  put(hx - 1, hy + 5, 0.12, M_STONE); put(hx, hy + 5, 0.12, M_STONE);
  for (let y = hy + 6; y < 64; y++) { put(hx - 1, y, 0.5, M_STONE); put(hx, y, 0.32, M_STONE); put(hx + 1, y, 0.18, M_STONE); }
  // the wing tips above the halo catch the light
  for (const sd of [-1, 1]) for (let y = 36; y < 44; y++) { const x = Math.round(cx + sd * outer(y)); put(x, y, sd < 0 ? 0.95 : 0.7, M_STONE); put(x - sd, y, sd < 0 ? 0.7 : 0.4, M_STONE); }
  // the moon's rim down the statue's right side, so it stands off the dark alcove
  for (let y = 62; y < base; y++) { let rx = -1; for (let x = cx + 16; x > cx; x--) { const i = y * BW + x; if (B.V[i] > 0.07 && B.M[i] !== M_UMBER) { rx = x; break; } } if (rx > 0 && rx > cx + 3) put(rx, y, 0.6, M_STONE); }
  // a few rust runs from the rivets
  for (const [x, y0, l] of [[cx - 6, 103, 4], [cx + 4, 117, 5], [cx - 3, 117, 3], [cx + 7, 103, 3]]) for (let j = 0; j < l; j++) put(x, y0 + j, 0.36 + 0.14 * hash(j, x, 984), M_UMBER);
  // the plinth: carved, stepped, its name worn away, the halo cut into it, wax run down its front
  rect(cx - 13, base, 27, 13, (x, y) => 0.24 + 0.34 * clamp((cx + 13 - x) / 27) - (y === base + 12 ? 0.1 : 0), M_STONE);
  rect(cx - 14, base, 29, 2, (x) => 0.52 + 0.32 * clamp((cx + 14 - x) / 29), M_STONE); rect(cx - 14, base + 2, 29, 1, 0.06, M_STONE);
  for (let x = cx - 10; x <= cx + 10; x++) if (hash(x, 0, 985) > 0.35 && (x - cx + 20) % 4 !== 3) put(x, base + 4, 0.1, M_STONE);
  brokenHalo(cx + 0.5, base + 9, 3, 0.74, M_UMBER, 0, { spark: false });
  for (const [x, l] of [[cx - 9, 5], [cx - 7, 3], [cx + 8, 6], [cx + 10, 3]]) for (let j = 0; j < l; j++) put(x, base + 2 + j, j === l - 1 ? 0.86 : 0.74, M_UMBER);
}

// ================================================================ the build's glue (W4, #130)
// One enemy of the live battle (render/rpgView.ts gives its look and pose) drawn as its v2 figure, with its own lights.
// look: hollow guardian revenant penitent confessor cherub ironwing vigil gravedigger gaoler bellringer inquisitor abbot.
// f.pose: { wind, strike, after, recover } from the attack timelines; f.toll, f.swing, f.shield, f.bodies, f.fly.
const FOE_FLY = { ironwing: true, vigil: true, cherub: true };
function cherubAt(f, k) { return [f.x + (k % 2) * 16 - 8 + (k >> 1) * 6, (f.fly || 50) + (k % 2) * 14 - (k >> 1) * 10]; }
function drawFoe(f, x, fy, tt, t, lights) {
  const k = f.look, p = f.pose || {};
  if (k === 'hollow' || k === 'guardian' || k === 'revenant') {
    hollow(x, fy, tt, { shield: k === 'guardian' && f.shield, strip: k === 'revenant' || (k === 'guardian' && !f.shield) ? 1 : 0, armBare: k === 'revenant', b: Math.sin(tt * 2) > 0.6 ? -1 : 0, swing: !!f.swing });
    if (k === 'revenant' || (k === 'guardian' && !f.shield)) lights.push({ x: x - 1, y: fy - 42, r: 14, i: 0.4, c: [1.6, 0.55, 0.6] });   // the heart-lens through the torn plate
  } else if (k === 'penitent') penitent(x, fy, tt, { ph: f.ph || 0 });
  else if (k === 'confessor') {
    confessor(x, fy, t + (f.ph || 0), {});
    if (EFX.necro) lights.push({ x: EFX.necro[0], y: EFX.necro[1], r: 60, i: 0.55, c: [1.0, 0.8, 1.6] });
    if (EFX.staff) lights.push({ x: EFX.staff[0], y: EFX.staff[1], r: 40, i: 0.5, c: [1.5, 0.6, 0.65] });
  } else if (k === 'cherub') {
    for (let b = 0; b < (f.bodies || 1); b++) { const [cx2, fly] = cherubAt({ ...f, x }, b); cherub(cx2, fy - fly, tt + b * 0.7, b); }
  } else if (k === 'ironwing' || k === 'vigil') {
    (k === 'ironwing' ? ironwing : vigil)(x, fy - f.fly, tt, f.n || 0);
    lights.push({ x: x - 1, y: fy - f.fly + (k === 'vigil' ? -1 : 2), r: 18, i: f.back ? 0.5 : 0.35, c: [1.6, 0.55, 0.6] });   // its heart or its eye: it reads in the back lane
  } else if (k === 'gravedigger') gravedigger(x, fy, tt, { swing: !!f.swing });
  else if (k === 'gaoler') {
    gaoler(x, fy, t, p);
    if (p.after != null && p.after < 1 && EFX.ball) {   // the ball lands: a flash and dust
      const q = p.after * 0.5, [bx, by] = EFX.ball;
      lights.push({ x: bx, y: by, r: 80, i: 1.0 * (1 - q / 0.5), c: [1.2, 1.0, 0.74] });
      for (let j = 0; j < 30; j++) { const an = hash(j, 1, 991) * Math.PI, d = q * 60 * (0.4 + hash(j, 2, 991)); put(Math.round(bx + Math.cos(an) * d), Math.round(by + 6 - Math.sin(an) * d * 0.4), 0.7 - q, M_UMBER, 1); }
    }
  } else if (k === 'bellringer') {
    bellringer(x, fy, t, { toll: f.toll || 0 });
    if (f.toll && EFX.bell) lights.push({ x: EFX.bell[0], y: EFX.bell[1], r: 90, i: 0.5, c: [0.9, 1.0, 1.4] });   // the bell's cold light while it tolls
  } else if (k === 'inquisitor') inquisitor(x, fy, t, { ...p, shield: !!f.shield });
  else if (k === 'abbot') abbot(x, fy, t, p);
  if (f.boss) lights.push({ x: x - 10, y: 110, r: 110, i: 0.5, c: WARM });
}
