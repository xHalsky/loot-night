// ===========================================================================
// AGE OF JUDGMENT · world samples. Built on the Game Frame's renderer (engine.js), its crypt, heroes and HUD.
// The premise: when the sky passed judgment, iron angels came down burning and died where they fell. The world was
// rebuilt on their bodies. Ravenhold stands in the ribcage of one; under the crypts, something grows in its body.
// Meanings hold: iron = the stone family, dark and riveted; the angels' eye-lights = crimson (danger, enemies);
// gilding on buildings = umber highs (gold stays loot). Every word stays medieval: saints, relics, iron.
// ===========================================================================
const easeO = (k) => 1 - (1 - k) ** 3;
const AOJ = { biome: 'crypt' };

// ---------------------------------------------------------------- iron helpers
function ironRod(x0, y0, x1, y1, w = 2, d = 1) { limb(x0, y0, x1, y1, w, w * 0.85, 0.1 * d, 0.5 * d, M_STONE); }
function ironJoint(x, y, r = 1.7, d = 1) { ellipse(x + 0.5, y + 0.5, r, r, (xx) => (0.22 + 0.42 * clamp((x + r - xx) / (2 * r))) * d, M_STONE); put(x, y, 0.82 * d, M_STONE); }
function rivets(x0, y0, x1, y1, n, v = 0.78) { for (let k = 0; k < n; k++) { const q = n === 1 ? 0.5 : k / (n - 1); put(Math.round(lerp(x0, x1, q)), Math.round(lerp(y0, y1, q)), v, M_STONE); } }
function eyeLight(x, y, t, seed, big) {
  const p = 0.8 + 0.2 * Math.sin(t * 4 + seed);
  put(x, y, p, M_DANGER, 1);
  if (big) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(x + dx, y + dy, p * 0.62, M_DANGER, 1);
}
// the broken halo: a ring with a gap at the upper right and a crimson spark in the gap. The world's emblem.
function brokenHalo(cx, cy, r, v, mat, t, o = {}) {
  const w = o.w || 1, gap = o.gap || 0.55, g0 = -Math.PI / 4;
  const n = Math.max(24, Math.round(r * 9));
  for (let k = 0; k < n; k++) {
    const an = (k / n) * Math.PI * 2 - Math.PI;
    let d = an - g0; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < gap / 2) continue;
    const lit = 0.72 + 0.32 * Math.cos(an + (3 * Math.PI) / 4);
    for (let j = 0; j < w; j++) { const rr = r - j; put(Math.round(cx + Math.cos(an) * rr - 0.5), Math.round(cy + Math.sin(an) * rr - 0.5), clamp(v * lit * (j ? 0.72 : 1)), mat, o.emi || 0); }
  }
  if (o.spark !== false) { const sx = Math.round(cx + Math.cos(g0) * (r - w / 2) - 0.5), sy = Math.round(cy + Math.sin(g0) * (r - w / 2) - 0.5); eyeLight(sx, sy, t || 0, cx, o.bigSpark); }
}

// polygon edges lit from the upper left: edges facing up/left get a bright lip, the others a dark one
function litEdges(pts, hi, lo, mat, skip = []) {
  const cx0 = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy0 = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  for (let k = 0; k < pts.length; k++) {
    if (skip.includes(k)) continue;
    const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length], mx = (x0 + x1) / 2 - cx0, my = (y0 + y1) / 2 - cy0;
    let nx = y1 - y0, ny = -(x1 - x0); if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
    const L = Math.hypot(nx, ny) || 1, f = (nx + ny * 1.2) / L;
    const v = f < -0.35 ? hi : f > 0.35 ? lo : null;
    if (v != null) line(x0, y0, x1, y1, v, mat);
  }
}
function plate(pts, lo, hi, mat = M_STONE, o = {}) {
  let x0 = 1e9, x1 = -1e9; for (const [x] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  poly(pts, (x, y) => lo + (hi - lo) * clamp((x1 - x) / (x1 - x0 || 1)) ** 1.2 - (o.grain ? 0.04 * (GR(x, y) - 0.5) : 0), mat);
  if (o.edge !== false) litEdges(pts, o.edgeHi ?? Math.min(1, hi + 0.32), o.edgeLo ?? Math.max(0, lo - 0.1), mat, o.skip);
}
function rustPatch(x, y, w, h, seed, k = 0.62) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const n = vnoise((x + i) / 2.2, (y + j) / 2.2, seed); if (n > k) put(x + i, y + j, 0.42 + 0.34 * (n - k) / (1 - k) + 0.08 * hash(i, j, seed), M_UMBER); } }

// ---------------------------------------------------------------- the Hollow (replaces the skeleton)
// A dead knight in blackened, rusted armour. Where the armour broke he is an iron frame underneath: riveted rods,
// joint discs, a crimson heart-lens. strip 0: armoured · 1: the breastplate torn open · 2: the bare frame.
function hollow(cx, fy, t, o = {}) {
  const st = o.strip || 0, Y = fy + (o.b || 0), sw = o.swing ? 1 : 0;
  const IR = (x0, y0, x1, y1, w, d = 1) => ironRod(x0, y0, x1, y1, w, d);
  // far leg
  if (st >= 2) { IR(cx + 3, Y - 27, cx + 7, fy - 14, 2.4, 0.75); ironJoint(cx + 7, fy - 14, 1.6, 0.75); IR(cx + 7, fy - 14, cx + 9, fy - 3, 2.2, 0.75); plate([[cx + 5, fy - 3], [cx + 12, fy - 2], [cx + 12, fy], [cx + 5, fy]], 0.14, 0.3); }
  else { limb(cx + 3, Y - 27, cx + 7, fy - 14, 5, 4.2, 0.07, 0.24, M_STONE); limb(cx + 7, fy - 14, cx + 9, fy - 3, 4.2, 3.6, 0.07, 0.24, M_STONE); plate([[cx + 4, fy - 4], [cx + 12, fy - 3], [cx + 13, fy], [cx + 4, fy]], 0.1, 0.26); }
  // far arm and the kite shield: dark wine field, iron rim, the broken halo painted in bone
  if (st >= 2) { IR(cx + 4, Y - 45, cx + 9, Y - 38, 2.2, 0.75); ironJoint(cx + 9, Y - 38, 1.5, 0.75); IR(cx + 9, Y - 38, cx + 11, Y - 30, 2, 0.75); }
  else limb(cx + 4, Y - 45, cx + 10, Y - 37, 4, 3.4, 0.08, 0.26, M_STONE);
  if (o.shield !== false && st < 2) {
    const sx = cx + 6, sy = Y - 48, S = [[sx, sy], [sx + 12, sy + 1], [sx + 13, sy + 14], [sx + 7, sy + 28], [sx, sy + 15]];
    plate(S, 0.2, 0.42, M_DUSK, { grain: true, edge: false });
    litEdges(S, 0.82, 0.12, M_STONE);
    brokenHalo(sx + 6.5, sy + 11, 4.5, 0.9, M_UMBER, t, { w: 1, bigSpark: false });
    rustPatch(sx + 1, sy + 16, 10, 10, 61, 0.55);
  }
  // tabard's back flap and the far pauldron
  if (st < 2) { poly([[cx - 1, Y - 30], [cx + 6, Y - 30], [cx + 8, fy - 12], [cx + 1, fy - 13]], 0.2, M_DUSK); ragHem(cx + 1, cx + 8, fy - 13, 5, 62, 0.18, M_DUSK); }
  if (st < 2) plate([[cx + 1, Y - 50], [cx + 6, Y - 51], [cx + 9, Y - 47], [cx + 8, Y - 43], [cx + 2, Y - 44]], 0.1, 0.3);
  // torso
  if (st < 2) {
    const T = [[cx - 8, Y - 49], [cx + 6, Y - 49], [cx + 7, Y - 42], [cx + 5, Y - 31], [cx - 5, Y - 31], [cx - 8, Y - 40]];
    plate(T, 0.2, 0.72, M_STONE, { edgeHi: 1 });
    line(cx - 3, Y - 47, cx - 2, Y - 33, 0.78, M_STONE); line(cx - 2, Y - 47, cx - 1, Y - 33, 0.08, M_STONE);
    for (const yy of [Y - 41, Y - 36]) { line(cx - 7, yy, cx + 5, yy + 1, 0.04, M_STONE); line(cx - 7, yy + 1, cx + 5, yy + 2, 0.5, M_STONE); }
    rustPatch(cx - 7, Y - 48, 14, 16, 51, 0.56);
    if (st === 1) {
      ellipse(cx + 1, Y - 41, 5.6, 5.4, 0.02, M_DUSK);
      for (let a = 0; a < 56; a++) { const an = a / 56 * 6.283, rr = 5.6 + 1.3 * hash(a, 2, 63), x = cx + 1 + Math.cos(an) * rr, y = Y - 41 + Math.sin(an) * rr * 0.95; put(Math.round(x), Math.round(y), Math.cos(an + 2.4) > 0 ? 0.9 : 0.3, M_STONE); }
      for (const dy of [-4, 4]) line(cx - 3, Y - 41 + dy, cx + 5, Y - 41 + dy, 0.5, M_STONE);
      ironRod(cx + 1, Y - 46, cx + 1, Y - 36, 1.6, 0.8);
      rect(cx - 1, Y - 43, 4, 4, 0.55, M_DANGER, 1); eyeLight(cx, Y - 42, t, 7, true); put(cx + 1, Y - 42, 1, M_DANGER, 1);
    }
  } else {
    IR(cx + 1, Y - 49, cx + 1, Y - 29, 2.6, 0.95);
    for (let k = 0; k < 4; k++) {
      const y0 = Y - 47 + k * 4;
      for (let s = 0; s <= 10; s++) { const q = s / 10, x = cx + 1 - q * (9 - k), y = y0 + Math.sin(q * Math.PI) * -1.4 + q * q * 2.5; put(Math.round(x), Math.round(y), 0.82 - 0.36 * q, M_STONE); put(Math.round(x), Math.round(y) + 1, 0.16, M_STONE); }
      put(cx - 3 + k, y0 + 1, 0.95, M_STONE);
    }
    eyeLight(cx - 2, Y - 41, t, 7, true);
    plate([[cx - 5, Y - 31], [cx + 5, Y - 31], [cx + 4, Y - 26], [cx - 4, Y - 26]], 0.16, 0.5);
    rivets(cx - 3, Y - 29, cx + 3, Y - 29, 3, 0.9);
  }
  // belt; the tabard's front with a faded broken halo
  rect(cx - 6, Y - 32, 12, 2, 0.22, M_UMBER); rect(cx - 2, Y - 32, 3, 2, 0.8, M_UMBER);
  if (st < 2) {
    poly([[cx - 6, Y - 30], [cx + 1, Y - 30], [cx + 2, fy - 10], [cx - 6, fy - 11]], (x, y) => 0.42 + 0.2 * clamp((cx + 2 - x) / 8) - ((x + y) % 5 === 0 ? 0.08 : 0), M_DUSK);
    ragHem(cx - 6, cx + 2, fy - 11, 6, 65, 0.36, M_DUSK);
    brokenHalo(cx - 2, Y - 23, 2.5, 0.62, M_UMBER, t, { spark: false });
  }
  // near leg
  if (st >= 2) { IR(cx - 2, Y - 27, cx - 7, fy - 14, 2.6); ironJoint(cx - 7, fy - 14, 1.8); IR(cx - 7, fy - 14, cx - 9, fy - 3, 2.4); plate([[cx - 15, fy - 3], [cx - 7, fy - 3], [cx - 6, fy], [cx - 15, fy]], 0.16, 0.56); }
  else {
    limb(cx - 2, Y - 27, cx - 7, fy - 14, 5.4, 4.6, 0.2, 0.74, M_STONE); limb(cx - 7, fy - 14, cx - 9, fy - 3, 4.6, 4, 0.2, 0.74, M_STONE);
    ellipse(cx - 7, fy - 14.5, 2.6, 2.2, (x) => 0.3 + 0.5 * clamp((cx - 5 - x) / 5), M_STONE);
    plate([[cx - 16, fy - 4], [cx - 7, fy - 5], [cx - 6, fy], [cx - 17, fy]], 0.2, 0.7);
    rustPatch(cx - 10, fy - 13, 5, 9, 66, 0.55);
  }
  // near pauldron: three lames
  if (st < 2) {
    for (let k = 2; k >= 0; k--) { const py = Y - 47 + k * 2.4, px = cx - 6 - k * 0.6; plate([[px - 5, py + 1], [px - 2, py - 2], [px + 3, py - 2], [px + 5, py + 1], [px + 4, py + 3], [px - 4, py + 3]], 0.2, k === 0 ? 0.78 : 0.56, M_STONE, { edgeHi: 1 });
      put(px - 3, py + 2, 0.8, M_UMBER); put(px + 1, py + 2, 0.8, M_UMBER); }
    rustPatch(cx - 11, Y - 49, 9, 7, 67, 0.58);
  } else ironJoint(cx - 6, Y - 45, 2);
  // near arm and the greatsword: raised, or cut down on the swing
  const sh = [cx - 6, Y - 45], el = sw ? [cx - 11, Y - 40] : [cx - 13, Y - 39], hd = sw ? [cx - 18, Y - 37] : [cx - 16, Y - 48];
  const tip = sw ? [hd[0] - 21, hd[1] + 7] : [hd[0] - 2, hd[1] - 25], bx = tip[0] - hd[0], by = tip[1] - hd[1], bl = Math.hypot(bx, by), nx = -by / bl, ny = bx / bl;
  for (let s = 3; s <= bl; s++) { const q = s / bl, x = hd[0] + bx * q, y = hd[1] + by * q, w = q > 0.92 ? 0.6 : 1.4; for (let o2 = -w; o2 <= w; o2 += 0.5) put(Math.round(x + nx * o2), Math.round(y + ny * o2), o2 < -0.5 ? 0.98 : o2 > 0.5 ? 0.3 : 0.62, M_STONE); }
  rustPatch(Math.round(hd[0] + bx * 0.4) - 1, Math.round(hd[1] + by * 0.4) - 2, 3, 5, 69, 0.5);
  for (let o2 = -3.5; o2 <= 3.5; o2 += 0.5) put(Math.round(hd[0] + bx / bl * 2 + nx * o2), Math.round(hd[1] + by / bl * 2 + ny * o2), 0.72, M_UMBER);
  ellipse(hd[0] - bx / bl * 3 + 0.5, hd[1] - by / bl * 3 + 0.5, 1.3, 1.3, 0.8, M_UMBER);
  if (st >= 2 || o.armBare) { IR(sh[0], sh[1], el[0], el[1], 2.4); ironJoint(el[0], el[1], 1.6); IR(el[0], el[1], hd[0], hd[1], 2.2); }
  else { limb(sh[0], sh[1], el[0], el[1], 4.2, 3.6, 0.22, 0.76, M_STONE); limb(el[0], el[1], hd[0], hd[1], 3.6, 3.4, 0.22, 0.76, M_STONE); }
  ellipse(hd[0] + 0.5, hd[1] + 0.5, 1.9, 1.9, 0.5, M_STONE);
  // head: the great helm, a cross-slit with two embers; or the riveted iron skull of the frame
  const hx = cx - 3, hy = Y - 56;
  if (st < 2) {
    const HL = [[hx - 6, hy - 5], [hx - 4, hy - 8], [hx + 3, hy - 8], [hx + 5, hy - 5], [hx + 5, hy + 6], [hx - 6, hy + 6]];
    plate(HL, 0.2, 0.76, M_STONE, { edgeHi: 1 });
    rect(hx - 6, hy - 6, 11, 1, 0.82, M_UMBER); rect(hx - 6, hy - 5, 11, 1, 0.4, M_UMBER);
    line(hx - 4, hy - 7, hx + 1, hy - 7, 0.86, M_STONE); put(hx - 5, hy - 6, 0.8, M_STONE);
    line(hx - 6, hy + 1, hx + 5, hy + 1, 0.06, M_STONE);
    rect(hx - 6, hy - 3, 9, 2, 0.02, M_DUSK);
    for (const ex of [hx - 5, hx - 2]) { eyeLight(ex, hy - 3, t, ex); eyeLight(ex + 1, hy - 3, t, ex + 1); put(ex, hy - 2, 0.45, M_DANGER, 1); }
    for (const [dx, dy] of [[-5, 3], [-3, 3], [-5, 5], [-3, 5], [-1, 4]]) put(hx + dx, hy + dy, 0.03, M_DUSK);
    rustPatch(hx, hy - 7, 6, 8, 68, 0.55);
    if (st === 1) { line(hx + 1, hy - 8, hx + 3, hy - 3, 0.02, M_DUSK); put(hx + 2, hy - 6, 0.36, M_STONE); }
  } else {
    plate([[hx - 4, hy - 5], [hx + 3, hy - 6], [hx + 5, hy - 1], [hx + 4, hy + 3], [hx - 4, hy + 3], [hx - 5, hy - 1]], 0.12, 0.6);
    rect(hx - 4, hy - 2, 2, 2, 0.02, M_DUSK); rect(hx - 1, hy - 2, 2, 2, 0.02, M_DUSK);
    eyeLight(hx - 4, hy - 2, t, 1); eyeLight(hx - 1, hy - 2, t, 3);
    rivets(hx - 4, hy - 4, hx + 3, hy - 5, 4, 0.95);
    plate([[hx - 4, hy + 4], [hx + 3, hy + 4], [hx + 2, hy + 7], [hx - 3, hy + 7]], 0.16, 0.46);
    for (let x = hx - 3; x <= hx + 1; x += 2) line(x, hy + 4, x, hy + 6, 0.03, M_DUSK);
    IR(hx + 1, hy + 6, cx, Y - 49, 2);
  }
  EFX.warrior = [cx - 2, Y - 38];
}

// ---------------------------------------------------------------- the Penitent (replaces the zombie)
// A flagellant pilgrim, gaunt and bowed, bare to the waist, his back striped with lashes, a dark robe below. An iron
// cage over his head with a candle stub on top (a small warm light). He swings a scourge over his own shoulder.
function penitent(cx, fy, t, o = {}) {
  const ph = o.ph || 0, lash = Math.sin(t * 3.2 + ph), Y = fy + (Math.sin(t * 1.5 + ph) > 0.8 ? -1 : 0), SK = M_UMBER;
  // the robe from the waist: dark, heavy folds, a ragged hem; bare feet
  poly([[cx - 6, Y - 29], [cx + 6, Y - 29], [cx + 9, fy - 3], [cx + 5, fy - 1], [cx - 7, fy - 1], [cx - 9, fy - 4]], (x, y) => 0.1 + 0.2 * clamp((cx + 8 - x) / 17) - ((x * 3 + y) % 7 === 0 ? 0.03 : 0), M_DUSK);
  for (const [x0, l] of [[cx - 4, 22], [cx + 1, 24], [cx + 5, 20]]) for (let j = 0; j < l; j++) put(x0 + (j > 13 ? 1 : 0), Y - 26 + j, 0.04, M_DUSK);
  ragHem(cx - 9, cx + 9, fy - 4, 4, 81, 0.1, M_DUSK);
  poly([[cx - 13, fy - 2], [cx - 6, fy - 3], [cx - 5, fy], [cx - 13, fy]], (x) => 0.5 + 0.34 * clamp((cx - 5 - x) / 8), SK);
  // far arm, clutching his chest
  limb(cx + 4, Y - 45, cx + 3, Y - 37, 2.6, 2.2, 0.34, 0.56, SK); limb(cx + 3, Y - 37, cx - 2, Y - 37, 2.2, 2, 0.34, 0.56, SK);
  // the bare torso, bowed a little forward: gaunt, ribs showing, lashes across the back (his right side)
  const TB = [[cx - 7, Y - 47], [cx + 5, Y - 48], [cx + 6, Y - 41], [cx + 4, Y - 30], [cx - 4, Y - 30], [cx - 6, Y - 38]];
  plate(TB, 0.44, 0.86, SK, { edgeHi: 0.96, edgeLo: 0.22 });
  for (let k = 0; k < 4; k++) { const yy = Y - 44 + k * 3; for (let x = cx - 5; x <= cx; x++) if ((x + k) % 2 === 0) put(x, yy + Math.round((x - cx) * 0.25), 0.34, SK); }
  for (let y = Y - 36; y <= Y - 31; y++) put(cx - 1, y, 0.36, SK);
  for (let k = 0; k < 4; k++) { const y0 = Y - 46 + k * 4; for (let s = 0; s < 5; s++) { const x = cx + 1 + s, y = y0 + Math.round(s * 0.5); if (hash(k, s, 82) > 0.15) put(x, y, 0.64 + 0.3 * hash(s, k, 83), M_DANGER); } }
  // the rope belt with its knotted end
  for (let x = cx - 6; x <= cx + 6; x++) put(x, Y - 30 + ((x & 1) ? 0 : 1), 0.7, SK);
  for (let j = 0; j < 8; j++) put(cx - 4 + (j > 3 ? -1 : 0), Y - 29 + j, j === 7 ? 0.9 : 0.6, SK);
  // the neck and the head, bowed, inside the iron cage; the candle stub on top
  limb(cx - 2, Y - 47, cx - 4, Y - 51, 2.6, 2.4, 0.5, 0.8, SK);
  const hx = cx - 5, hy = Y - 54;
  ellipse(hx + 0.5, hy + 0.5, 3.4, 3.8, (x) => 0.62 + 0.32 * clamp((hx + 3 - x) / 7), SK);
  rect(hx - 3, hy, 2, 2, 0.02, M_DUSK); rect(hx, hy, 2, 2, 0.02, M_DUSK);
  eyeLight(hx - 3, hy + 1, t, 11); eyeLight(hx, hy + 1, t, 12);
  rect(hx - 2, hy + 3, 3, 1, 0.06, M_DUSK);
  const cageTop = (x) => hy - 6 + Math.round(((x - hx) / 5.5) ** 2 * 3);
  for (let x = hx - 5; x <= hx + 5; x += 2) for (let y = cageTop(x); y <= hy + 5; y++) put(x, y, x <= hx ? 0.86 : 0.44, M_STONE);
  for (let x = hx - 5; x <= hx + 5; x++) { put(x, cageTop(x), x <= hx ? 0.8 : 0.5, M_STONE); put(x, hy + 5, x < hx ? 0.7 : 0.3, M_STONE); }
  ellipse(hx + 0.5, hy - 7.5, 1.6, 1.2, 0.66, M_STONE);
  rect(hx - 1, hy - 13, 3, 5, (x) => (x === hx - 1 ? 0.96 : 0.74), SK); put(hx + 2, hy - 10, 0.84, SK); put(hx + 2, hy - 9, 0.7, SK);
  AOJ.candles = AOJ.candles || []; AOJ.candles.push([hx, hy - 14, t, cx]);
  // near arm raised high, the scourge thrown back over his shoulder: three cords with iron weights
  const hd = [cx - 10, Y - 62 + Math.round(lash)], el = [cx - 11, Y - 49];
  limb(cx - 5, Y - 46, el[0], el[1], 3, 2.6, 0.5, 0.88, SK); limb(el[0], el[1], hd[0], hd[1], 2.6, 2.2, 0.5, 0.88, SK);
  rect(hd[0] - 1, hd[1] - 4, 2, 5, 0.4, M_UMBER);
  for (let c = 0; c < 3; c++) {
    let px = hd[0], py = hd[1] - 4;
    for (let s = 1; s <= 12; s++) { const q = s / 12, x = hd[0] + q * (13 + c * 2) + lash * 1.5 * q, y = hd[1] - 4 + q * (12 + c * 3) - Math.sin(q * Math.PI) * 6; line(px, py, x, y, 0.56, M_UMBER); px = x; py = y; }
    put(Math.round(px), Math.round(py), 0.92, M_STONE); put(Math.round(px) + 1, Math.round(py), 0.4, M_STONE); put(Math.round(px), Math.round(py) + 1, 0.3, M_STONE);
  }
  EFX.mouth = [hx - 2, hy + 3];
}
function candleFlames(t) { for (const [x, y, , seed] of AOJ.candles || []) { const f = hash(Math.floor(t * 13), seed, 7); put(x, y, 1, M_UMBER, 1); put(x, y - 1, 0.92, M_UMBER, 1); if (f > 0.5) put(x + (f > 0.8 ? 1 : 0), y - 2, 0.8, M_UMBER, 1); } }

// ---------------------------------------------------------------- the Confessor (replaces the necromancer)
// A tall priest of a heretic serpent cult: a pointed hood, an iron confessional grille for a face with a crimson glow
// behind it, a serpent crozier, a censer swinging on its chain and breathing violet smoke.
function confessor(cx, fy, t, o = {}) {
  const Y = fy - 1 + Math.round(Math.sin(t * 1.4)), sw = Math.sin(t * 2.4);
  // a summoning ring on the floor: candles round a crimson-inked circle
  for (let a = 0; a < 90; a++) { const an = a / 90 * 6.283 + t * 0.4, x = cx + Math.cos(an) * 19, y = fy + 1 + Math.sin(an) * 4; if (a % 3) put(Math.round(x), Math.round(y), a % 15 === 0 ? 0.9 : 0.5, M_DANGER, 1); }
  // the robe: tall, flared, deep dusk, a gilt stole down the front
  poly([[cx - 6, Y - 50], [cx + 6, Y - 50], [cx + 12, fy - 4], [cx + 8, fy - 1], [cx + 3, fy - 4], [cx - 2, fy - 1], [cx - 7, fy - 4], [cx - 12, fy - 2]], (x, y) => 0.12 + 0.24 * Math.sin(clamp((x - cx + 12) / 24) * Math.PI) * (1.1 - 0.3 * clamp((x - cx) / 12)) - (((x - cx + 40) % 4 === 0 && y > Y - 38) ? 0.05 : 0), M_DUSK);
  for (const sx of [cx - 3, cx + 1]) { rect(sx, Y - 46, 2, fy - Y + 40, (x) => (x === sx ? 0.82 : 0.56), M_UMBER); }
  for (const sx of [cx - 3, cx + 1]) { rect(sx - 1, fy - 8, 4, 2, 0.62, M_UMBER); brokenHalo(sx + 1, fy - 12, 1.6, 0.7, M_UMBER, t, { spark: false }); }
  // far arm out with the censer on its chain (violet smoke)
  line(cx + 5, Y - 44, cx + 10, Y - 38, 0.24, M_DUSK); line(cx + 5, Y - 43, cx + 10, Y - 37, 0.18, M_DUSK);
  rect(cx + 10, Y - 38, 2, 2, 0.6, M_UMBER);
  const cxn = cx + 11 + Math.round(sw * 5), cyn = Y - 22 - Math.round(Math.abs(sw) * 2);
  line(cx + 11, Y - 36, cxn, cyn - 3, 0.5, M_STONE);
  ellipse(cxn + 0.5, cyn + 0.5, 2.6, 2.4, (x) => 0.4 + 0.4 * clamp((cxn + 2 - x) / 5), M_UMBER); put(cxn - 1, cyn, 0.9, M_MAGIC, 1); put(cxn + 1, cyn + 1, 0.8, M_MAGIC, 1);
  for (let k = 0; k < 7; k++) { const q = (t * 0.6 + k / 7) % 1, x = cxn + Math.sin(q * 7 + k) * 2.5 + q * 4, y = cyn - 3 - q * 26; put(Math.round(x), Math.round(y), 0.85 - q * 0.6, M_MAGIC, 1); if (q < 0.5) put(Math.round(x) + 1, Math.round(y), 0.6 - q * 0.6, M_MAGIC, 1); }
  // the pointed hood and the iron grille: a crimson glow through the lattice
  const hx = cx - 1, hy = Y - 57;
  poly([[hx - 6, hy + 6], [hx - 6, hy - 2], [hx - 2, hy - 10], [hx + 1, hy - 17], [hx + 3, hy - 9], [hx + 7, hy - 2], [hx + 7, hy + 7]], (x, y) => 0.16 + 0.26 * clamp((hx + 7 - x) / 13) * (1 - 0.3 * clamp((hy - y) / 15)), M_DUSK);
  for (let y = hy - 4; y <= hy + 4; y++) for (let x = hx - 4; x <= hx + 2; x++) {
    const lat = (x + y) % 3 === 0 || (x - y + 30) % 3 === 0;
    if (lat) put(x, y, x < hx - 1 ? 0.62 : 0.44, M_STONE); else put(x, y, 0.35 + 0.35 * clamp(1 - Math.hypot(x - hx + 1, y - hy + 1) / 4), M_DANGER, 1);
  }
  frameLine(hx - 5, hy - 5, 8, 11);
  // the serpent crozier in the near hand: a coiled snake for its crook, a crimson eye
  const sx = cx - 13;
  for (let y = Y - 66; y < fy; y++) put(sx + ((y >> 2) & 1 ? 0 : 0), y, 0.42 + (y & 1) * 0.12, M_UMBER);
  for (let k = 0; k <= 30; k++) { const q = k / 30, an = -Math.PI / 2 - q * 4.6, r = 6 - q * 3, x = sx + 6 + Math.cos(an) * r - 6, y = Y - 70 + Math.sin(an) * r + 4; const w = 1.6 - q * 0.6; ellipse(x + 0.5, y + 0.5, w, w, 0.6 - 0.2 * q + (k % 4 === 0 ? 0.2 : 0), M_STONE); }
  const shx = sx - 1, shy = Y - 69; ellipse(shx + 0.5, shy + 0.5, 2.2, 1.6, 0.66, M_STONE); eyeLight(shx - 1, shy, t, 21); put(shx - 3, shy + 1, 0.8, M_DANGER, 1);
  limb(cx - 5, Y - 45, cx - 10, Y - 40, 3, 2.6, 0.12, 0.3, M_DUSK); limb(cx - 10, Y - 40, sx + 1, Y - 44, 2.6, 2.4, 0.12, 0.3, M_DUSK);
  rect(sx - 1, Y - 46, 3, 3, 0.66, M_UMBER);
  EFX.necro = [cxn, cyn]; EFX.staff = [shx, shy];
}
function frameLine(x, y, w, h) { for (let i = x; i < x + w; i++) { put(i, y, 0.3, M_DUSK); put(i, y + h - 1, 0.1, M_DUSK); } for (let j = y; j < y + h; j++) { put(x, j, 0.3, M_DUSK); put(x + w - 1, j, 0.1, M_DUSK); } }

// ---------------------------------------------------------------- Cherubs (replace the imps)
// Baroque putti with iron wings: a round baby head with a blank porcelain face and an open mouth, a chubby body,
// a broken iron halo floating over the head with its spark.
function cherub(x, y, t, n) {
  const flap = Math.floor(t * 10 + n * 1.7) % 4, ang = [-1.15, -0.55, 0.25, -0.55][flap], Y = Math.round(y + Math.sin(t * 3 + n) * 2);
  const wing = (wx, wy, d) => {
    for (let k = 0; k < 5; k++) {
      const a = ang + k * 0.28, L = 12 - k * 1.6;
      for (let s = 1; s <= L; s++) { const px = Math.round(wx + Math.cos(a) * s), py = Math.round(wy + Math.sin(a) * s); put(px, py, (s >= L - 1 ? 0.9 : 0.62 - 0.07 * k) * d, M_STONE); put(px, py + 1, 0.14 * d, M_STONE); }
      put(Math.round(wx + Math.cos(a) * 4), Math.round(wy + Math.sin(a) * 4), 0.95 * d, M_STONE);
    }
  };
  wing(x + 2, Y - 7, 0.62);
  // the body: chubby, pale; little legs tucked under
  ellipse(x + 0.5, Y - 2.5, 3.6, 4.4, (xx, yy) => 0.64 + 0.3 * clamp((x + 3 - xx) / 7) - 0.12 * clamp((yy - Y + 2) / 4), M_UMBER);
  ellipse(x - 1.5, Y + 2.5, 1.8, 1.5, 0.66, M_UMBER); ellipse(x + 2.5, Y + 2, 1.6, 1.4, 0.48, M_UMBER);
  line(x - 2, Y - 5, x - 5, Y - 2 + (flap & 1), 0.78, M_UMBER); put(x - 5, Y - 2 + (flap & 1), 0.9, M_UMBER);
  // the head: round, a porcelain face with no eyes, a dark open mouth, a curl on top
  ellipse(x - 0.5, Y - 10, 4.2, 4, (xx, yy) => 0.76 + 0.22 * clamp((x + 2 - xx) / 7) - 0.08 * clamp((yy - Y + 10) / 4), M_UMBER);
  rect(x - 4, Y - 11, 2, 1, 0.08, M_DUSK); rect(x - 1, Y - 11, 2, 1, 0.08, M_DUSK);
  rect(x - 3, Y - 8, 2, 2, 0.03, M_DUSK);
  put(x, Y - 15, 0.6, M_UMBER); put(x + 1, Y - 14, 0.5, M_UMBER);
  // the halo floating over the head, seen at an angle: a flat broken ring
  for (let k = 0; k < 28; k++) { const an = k / 28 * 6.283; if (an > 5.2 && an < 5.9) continue; put(Math.round(x - 0.5 + Math.cos(an) * 4.5), Math.round(Y - 17 + Math.sin(an) * 1.4), Math.sin(an) > 0 ? 0.9 : 0.6, M_STONE); }
  eyeLight(Math.round(x + 3), Y - 18, t, n);
  wing(x + 1, Y - 6, 1);
}

// ---------------------------------------------------------------- the Hunter (an elite)
// Seen as a heat shimmer: the set bends where it stands. Only its trophies show, hanging in the air. Every few
// seconds the cloak fails for a moment and it shows: tall, gaunt, a smooth iron face with one slit, a hooked spear.
const HUNT = { mask: null };
function hunterBody(cx, fy, t) {
  const Y = fy;
  // cloak, long and ragged
  poly([[cx - 6, Y - 60], [cx + 7, Y - 62], [cx + 14, Y - 30], [cx + 16, fy - 2], [cx + 10, fy - 5], [cx + 6, fy - 1], [cx + 1, fy - 6], [cx - 4, fy - 2], [cx - 9, fy - 8], [cx - 8, Y - 40]], (x, y) => 0.1 + 0.18 * clamp((cx + 14 - x) / 24) - ((x + y * 2) % 6 === 0 ? 0.03 : 0), M_DUSK);
  // long legs in a crouch
  limb(cx - 3, Y - 30, cx - 10, fy - 15, 3, 2.6, 0.08, 0.26, M_STONE); limb(cx - 10, fy - 15, cx - 8, fy - 2, 2.6, 2.2, 0.08, 0.26, M_STONE);
  poly([[cx - 14, fy - 2], [cx - 7, fy - 3], [cx - 6, fy], [cx - 14, fy]], 0.3, M_STONE);
  // arms: the near one long, holding the hooked spear across the body
  limb(cx - 4, Y - 55, cx - 12, Y - 44, 3, 2.6, 0.1, 0.32, M_DUSK); limb(cx - 12, Y - 44, cx - 16, Y - 32, 2.6, 2.2, 0.1, 0.32, M_DUSK);
  const s0 = [cx - 26, Y - 18], s1 = [cx + 10, Y - 66];
  line(s0[0], s0[1], s1[0], s1[1], 0.42, M_UMBER);
  poly([[s0[0] - 1, s0[1]], [s0[0] - 9, s0[1] + 4], [s0[0] - 4, s0[1] - 1], [s0[0] - 6, s0[1] - 5]], (x) => 0.5 + 0.4 * clamp((s0[0] - x) / 9), M_STONE);
  // the head: hooded, a smooth iron face with one slit
  const hx = cx - 3, hy = Y - 63;
  poly([[hx - 4, hy + 4], [hx - 5, hy - 2], [hx - 1, hy - 7], [hx + 4, hy - 6], [hx + 6, hy + 2], [hx + 5, hy + 6]], 0.14, M_DUSK);
  ellipse(hx - 1, hy, 2.8, 3.6, (x) => 0.34 + 0.4 * clamp((hx + 1 - x) / 5), M_STONE);
  rect(hx - 3, hy - 1, 4, 1, 0.03, M_DUSK);
}
function hunterTrophies(cx, fy, t, cloaked) {
  const sway = Math.sin(t * 1.3) * 1.2, Y = fy;
  // a cord at the hip: three skulls and a dented helm, swinging a little
  const pts = [[cx + 1, Y - 31], [cx + 4, Y - 26], [cx + 7, Y - 22], [cx + 10, Y - 25]];
  for (let k = 0; k < pts.length - 1; k++) line(pts[k][0] + sway * k * 0.3, pts[k][1], pts[k + 1][0] + sway * (k + 1) * 0.3, pts[k + 1][1], 0.32, M_UMBER);
  skull(Math.round(cx + 1 + sway * 0.3), Y - 27, 0.74); skull(Math.round(cx + 5 + sway * 0.6), Y - 23, 0.66); skull(Math.round(cx + 9 + sway), Y - 26, 0.6);
  const hx = Math.round(cx + 4 + sway * 0.5), hy = Y - 17;
  poly([[hx - 3, hy], [hx - 2, hy - 3], [hx + 2, hy - 3], [hx + 3, hy], [hx + 3, hy + 3], [hx - 3, hy + 3]], (x) => 0.3 + 0.4 * clamp((hx + 3 - x) / 6), M_STONE);
  line(hx - 3, hy + 1, hx + 1, hy + 1, 0.05, M_DUSK); line(hx + 2, hy - 2, hx + 3, hy + 1, 0.12, M_STONE);
}
// draw the Hunter's body into its own mask buffer (W x H); the fx pass bends the frame through it
function hunterMask(cx, fy, t) {
  if (!HUNT.mask || HUNT.mask.w !== W || HUNT.mask.h !== H) HUNT.mask = mkBuf(W, H);
  const M = HUNT.mask, prev = B; M.V.fill(0); M.M.fill(0); M.E.fill(0); M.A.fill(0); M.T.fill(0); M.DX.fill(0);
  bind(M); const tg = TAG; TAG = 0; hunterBody(cx, fy, t); TAG = tg; bind(prev);
  HUNT.at = [cx, fy];
}
// state: 0 cloaked, 1 revealed, flicker between; returns how revealed it is now
function hunterReveal(t) { const q = t % 5; return q > 3.9 && q < 4.75 ? (q < 4.02 || (q > 4.6 && Math.floor(q * 40) % 2) ? 0.5 : 1) : 0; }
function hunterFX(F, t, lights) {
  const M = HUNT.mask; if (!M) return;
  const rv = hunterReveal(t), V0 = F.V.slice(), M0 = F.M.slice(), E0 = F.E.slice();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (!M.A[i]) continue;
    const edge = !M.A[i - 1] || !M.A[i + 1] || !M.A[i - W] || !M.A[i + W];
    if (rv >= 1 || (rv > 0 && (y & 1))) { F.V[i] = M.V[i]; F.M[i] = M.M[i]; F.E[i] = 0; F.T[i] = 20; if (edge) { F.V[i] = 0; F.E[i] = 1; } continue; }
    const dx = Math.round(2.6 * Math.sin(y * 0.33 + t * 3.4) + 1.2 * Math.sin(x * 0.21 - t * 2)), sx = clamp(x + dx, 0, W - 1), si = y * W + sx;
    F.V[i] = V0[si] * 0.9 + 0.04; F.M[i] = M0[si]; F.E[i] = E0[si];
    if (edge) { const g = 0.5 + 0.5 * Math.sin(t * 9 + y * 0.7 + x * 0.3); F.X[i] += 0.1 + 0.16 * g; F.M[i] = M_STONE; }
  }
  if (rv) {   // the cloak failing: arcane crackle over its outline, the slit's ember
    for (let k = 0; k < 26; k++) { const a = Math.floor(hash(k, Math.floor(t * 30), 71) * W * H); for (let s = 0; s < 400; s++) { const i = (a + s * 37) % (W * H); if (M.A[i] && (!M.A[i - 1] || !M.A[i + 1])) { put(i % W, (i / W) | 0, 0.9, M_MAGIC, 1); break; } } }
    const [cx, fy] = HUNT.at; eyeLight(cx - 6, fy - 64, t, 31); eyeLight(cx - 4, fy - 64, t, 32);
    lights.push({ x: cx, y: fy - 40, r: 50, i: 0.4, c: [1.0, 0.8, 1.6] });
  }
}

// ---------------------------------------------------------------- the Brood: drones crawling on walls and vaults
function drone(x, y, t, n, ang = 0, d = 1) {
  const c = Math.cos(ang), s = Math.sin(ang), P2 = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  const step = Math.floor(t * 10 + n * 3) & 1;
  for (let k = -1; k <= 1; k++) for (const side of [-1, 1]) {
    const [ax, ay] = P2(k * 2.2, side * 1.5), [bx, by] = P2(k * 2.2 + ((k + (step ? 1 : 0)) & 1 ? 2 : -1), side * 4.5), [ex, ey] = P2(k * 2.2 + ((k + (step ? 1 : 0)) & 1 ? 3 : -2), side * 6);
    line(ax, ay, bx, by, 0.3 * d, M_DUSK); line(bx, by, ex, ey, 0.22 * d, M_DUSK);
  }
  for (const [u, r, v] of [[4, 2.0, 0.46], [0.5, 2.6, 0.36], [-4, 3.2, 0.3]]) { const [px, py] = P2(u, 0); ellipse(px + 0.5, py + 0.5, r, r * 0.8, (xx, yy) => (v + 0.22 * clamp(1 - Math.hypot(xx - px + 1, yy - py + 1) / r)) * d, M_DUSK); }
  for (const u of [-5, -3, -1]) { const [px, py] = P2(u, 0); put(Math.round(px), Math.round(py), 0.6 * d, M_MOSS); }
  const [ex, ey] = P2(5.5, 0); put(Math.round(ex), Math.round(ey), 0.95 * d, M_MOSS, 1);
  const [mx, my] = P2(6.5, -1), [nx, ny] = P2(6.5, 1); put(Math.round(mx), Math.round(my), 0.4 * d, M_DUSK); put(Math.round(nx), Math.round(ny), 0.4 * d, M_DUSK);
}

// ---------------------------------------------------------------- the roster sheet: every new enemy on one floor, named
let AOJ_C = null;
function aojCanvas(w, h) { if (!AOJ_C || AOJ_C.width !== w || AOJ_C.height !== h) { AOJ_C = document.createElement('canvas'); AOJ_C.width = w; AOJ_C.height = h; } return AOJ_C; }
function screenRoster(t) {
  const c = aojCanvas(GS_W, GS_H), ctx = c.getContext('2d');
  setRes(GS_W, GS_H); const F = buf('roster', GS_W, GS_H); clearFrame(F); bind(F); CLIP = null; MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0;
  // a plain crypt wall and floor to stand them on, lit like a museum case
  rect(0, 0, W, 168, (x, y) => { const row = Math.floor(y / 8), off = (row & 1) * 9, rx = (x + off) % 18; if (y % 8 === 7 || rx === 17) return 0.12; return (0.3 + 0.08 * hash(Math.floor((x + off) / 18), row, 3)) * lerp(0.55, 1, y / 168); });
  rect(0, 168, W, H - 168, (x, y) => ((y - 168) % 9 === 0 ? 0.14 : 0.36 + 0.06 * hash(x >> 4, (y - 168) / 9 | 0, 5)), M_UMBER);
  const lights = [], FY = 200;
  const cast = [
    ['Hollow', 30, () => hollow(30, FY, t, {})],
    ['Hollow, torn', 80, () => hollow(80, FY, t, { strip: 1, shield: false })],
    ['Hollow, iron', 128, () => hollow(128, FY, t, { strip: 2 })],
    ['Penitent', 176, () => penitent(176, FY, t, {})],
    ['Confessor', 228, () => confessor(228, FY, t, {})],
    ['Cherubs', 278, () => { cherub(272, 124, t, 0); cherub(290, 146, t, 1); }],
    ['Hunter', 334, () => { hunterBody(334, FY, t); hunterTrophies(334, FY, t); }],
    ['Hunter, cloaked', 394, () => { hunterMask(394, FY, t); hunterTrophies(394, FY, t, true); }],
    ['Drones', 446, () => { drone(444, 104, t, 0, -Math.PI / 2); drone(452, 150, t, 1, 0.3); }],
  ];
  AOJ.candles = [];
  cast.forEach(([, x, fn], n) => { if (n < 5 || n === 6) mulEllipse(x, FY, 11, 3, 0.4); TAG = 11 + n; fn(); TAG = 0; });
  outline(F, 0.3);
  hunterFX(F, 1.2, lights);
  candleFlames(t);
  for (const [, x] of cast) lights.push({ x: x - 14, y: 120, r: 80, i: 0.5, c: WARM });
  for (const [x, y] of AOJ.candles) lights.push({ x, y, r: 26, i: 0.6, c: WARM });
  cast.forEach(([name, x]) => { const w = measure(name, 'tiny') + 6; rectI(Math.round(x - w / 2), 208, w, 9, P.u1); frameI(Math.round(x - w / 2), 208, w, 9, P.u3); text(name, x, 210, 'tiny', P.u6, { align: 'c' }); });
  smokeU(0, 0, 150, 14, 0.6); text('Age of Judgment · the new roster', 4, 4, 'tiny', P.u6, { shadow: P.void });
  const img = ctx.createImageData(W, H); compose(F, img, lights, [0.32, 0.32, 0.42], 0.24, 0); ctx.putImageData(img, 0, 0);
  return c;
}

// ---------------------------------------------------------------- setup and the page's entry point
function aojInit() {
  AOJ.orig = snapDG(); AOJ.orig.far = cloneBuf(DG.far); AOJ.orig.mid = cloneBuf(DG.mid); AOJ.orig.fore = cloneBuf(DG.fore);
  cryptTells(); AOJ.crypt = snapDG();
  AOJ.ossuary = buildOssuary();
  AOJ.iron = buildIronSaint();
  AOJ.brood = buildBrood();
}
const BASE_FN = { floor: drawFloor, mist: drawMist, cart: potionCart };
const BIOME_FN = {
  ossuary: { floor: floorOssuary, cart: reliquary },
  iron: { floor: floorIron },
  brood: { floor: floorBrood, mist: mistBrood, cart: floorCocoon },
};
function useBiome(k) {
  Object.assign(DG, k === 'orig' ? AOJ.orig : AOJ[k]); AOJ.biome = k;
  const fn = { ...BASE_FN, ...(BIOME_FN[k] || {}) };
  drawFloor = fn.floor; drawMist = fn.mist; potionCart = fn.cart;
}
let GS2 = null;
function gameScreen(drawBA, side) {
  if (!GS2) { GS2 = document.createElement('canvas'); GS2.width = GS_W; GS2.height = GS_H; }
  const ctx = GS2.getContext('2d'); drawBA(ctx); drawSide(ctx, side, 0); return GS2;
}
function aojDraw(name, t, o = {}) {
  if (name === 'deskTest') { const c = drawDesk('battle', t, t, 'calm', { phone: { phone: 'hand' } }); const g = c.getContext('2d'); drawPhoneOver(g, PHONE_AT[0], PHONE_AT[1], 'boyschat', t, { rise: 1 }); return c; }
  if (name === 'launch') return launchDesk(t);
  if (name.startsWith('launch_')) return launchScreen(t, name.slice(7));
  if (name === 'roster') return screenRoster(t);
  if (name === 'boot') return screenBoot(t);
  if (name === 'st1') return screenSpriteTest(t, [() => hollow(22, 84, t, {}), () => hollow(62, 84, t, { strip: 1, shield: false }), () => hollow(100, 84, t, { strip: 2 }), () => penitent(140, 84, t, {}), () => confessor(178, 84, t, {})]);
  if (name === 'st2') return screenSpriteTest(t, [() => cherub(20, 40, t, 0), () => cherub(40, 60, t, 1), () => hunterBody(80, 84, t), () => hunterTrophies(80, 84, t), () => drone(130, 40, t, 0, 0), () => drone(160, 60, t, 1, -1.2), () => hollow(185, 84, t, { swing: true })]);
  if (name === 'orig_battle') { useBiome('orig'); return drawScreen('battle', t, { force: true }); }
  if (name === 'orig_dungeon') { useBiome('orig'); return drawScreen('dungeon', t, { force: true }); }
  if (name === 'orig_town') return drawScreen('town', t, { force: true });
  if (name === 'crypt_battle') { useBiome('crypt'); return gameScreen((ctx) => aojBattle(ctx, t, { roster: 'crypt' }), SIDE_MAGE); }
  if (WALKS[name.replace('_walk', '')] && name.endsWith('_walk') && name !== 'crypt_walk') { const b = name.replace('_walk', ''); useBiome(b); return gameScreen((ctx) => aojWalk(ctx, t, b), SIDE_KNIGHT); }
  if (name === 'town') return gameScreen((ctx) => aojTown(ctx, t), { town: true, tab: 'town', ...SIDE_TOWN, souls: 26 });
  if (name === 'iron_battle') { useBiome('iron'); return gameScreen((ctx) => aojBattle(ctx, t, { roster: 'iron', cam: o.cam ?? 1393, brazier: false, amb: [0.06, 0.055, 0.13], fx: (F, t, lights) => eyeLightsInto(lights, t) }), SIDE_ROGUE); }
  if (name === 'crypt_walk') { useBiome('crypt'); const c = drawScreen('dungeon', t, { force: true }); return c; }
  useBiome('orig');
  return drawScreen('battle', t, { force: true });
}

// ---------------------------------------------------------------- biome 1: the Shadow Crypt, with iron under the stone
// The crypt as approved, plus three tells: colossal riveted ribs in the far hall (seen through the arches), masonry
// spalled off a wall to show black iron plating behind it, and the Church's broken halo on the saint and the banner.
const snapDG = () => ({ far: DG.far, mid: DG.mid, fore: DG.fore, flames: DG.flames, lamps: DG.lamps, beams: DG.beams, farFlames: DG.farFlames, foreFlames: DG.foreFlames, foreLamps: DG.foreLamps, props: DG.props });
const cloneBuf = (b) => ({ ...b, V: b.V.slice(), M: b.M.slice(), E: b.E.slice(), T: b.T.slice(), A: b.A.slice(), DX: b.DX.slice() });
function ironRibV(x, y, x0, w, d) {   // a riveted iron beam's value across its width (lit from the left)
  const u = (x + 0.5 - x0) / w;
  if (u < 0 || u > 1) return -1;
  let v = (0.1 + 0.34 * Math.sin(u * Math.PI) * (1 - 0.45 * u)) * d;
  if (u < 0.12) v = 0.42 * d; if (u > 0.9) v = 0.05 * d;
  if ((u > 0.18 && u < 0.26) || (u > 0.74 && u < 0.82)) { if (y % 6 === 0) v = 0.62 * d; else if (y % 6 === 1) v = 0.08 * d; }
  if (y % 22 === 0) v *= 0.4;
  return v;
}
function cryptTells() {
  MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0;
  // FAR: three colossal bowed ribs rise through the far hall, a dim eye-light on one of them
  bind(DG.far);
  for (let k = 0; k < 3; k++) {
    const xr = 40 + k * 110;
    for (let y = 0; y < 128; y++) { const bow = 16 * ((y - 64) / 64) ** 2, x0 = xr + bow - 8 + (k === 1 ? -4 : 0); for (let x = Math.floor(x0) - 1; x < x0 + 18; x++) { const v = ironRibV(x, y, x0, 17, lerp(0.55, 0.95, y / 128)); if (v >= 0) put(((x % FAR_P) + FAR_P) % FAR_P, y, v, M_STONE); } }
  }
  put(155, 70, 0.75, M_DANGER, 1); put(156, 70, 0.45, M_DANGER, 1);
  // MID: the saint's halo is broken, a spark in the gap; the banner's sun becomes the broken halo
  bind(DG.mid);
  { const cx = 165; for (let a = 0; a < 64; a++) { const an = (a / 64) * Math.PI * 2; put(Math.round(cx + Math.cos(an) * 8), Math.round(70 + Math.sin(an) * 8), 0.03); }
    brokenHalo(cx + 0.5, 70.5, 8, 0.62, M_STONE, 0, { gap: 0.7 }); }
  { const cx = 385; for (let y = 44; y <= 60; y++) for (let x = cx - 8; x <= cx + 8; x++) put(x, y, 0.32 + 0.3 * Math.sin(clamp((x - cx + 9.5) / 19) * Math.PI) - ((y - 32) % 10 === 0 ? 0.08 : 0), M_DUSK);
    brokenHalo(cx + 0.5, 52.5, 6, 0.86, M_UMBER, 0, { w: 2, gap: 0.8 }); }
  // MID: masonry spalled off beside the sarcophagus: black iron plating behind, a seam and rivets
  const spall = (x0, y0, w, h, seed) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const u = (x - x0) / w - 0.5, v = (y - y0) / h - 0.5, r = Math.hypot(u * 1.1, v) + 0.12 * (vnoise(x / 3, y / 3, seed) - 0.5);
      if (r > 0.5) continue;
      if (r > 0.44) { put(x, y, 0.5 + 0.2 * hash(x, y, seed), M_STONE); continue; }
      let iv = 0.1 + 0.08 * clamp(0.5 - u) + 0.03 * hash(x >> 2, y, seed + 1);
      const sy = y0 + Math.round(h * 0.46);
      if (y === sy) iv = 0.03; else if (y === sy + 1) iv = 0.3;
      if ((y === sy - 3 || y === sy + 4) && (x - x0) % 4 === 1) iv = 0.62;
      if (x === x0 + Math.round(w * 0.62)) iv = 0.04;
      put(x, y, iv, M_STONE);
      if (hash(x, y, seed + 2) > 0.93) put(x, y, 0.36, M_UMBER);
    }
  };
  // MID: the saint in the moonlit alcove is an iron angel (foes.js: ironAngelStatue)
  bind(DG.mid); ironAngelStatue(165);
}

// ---------------------------------------------------------------- the battle, staged with any roster in any biome
const DRAW_FOE = {
  hollow: (f, fy, tt, q) => hollow(f.x, fy, tt, { ...(f.o || {}), b: Math.sin(tt * 2) > 0.6 ? -1 : 0, swing: f.id === 's1' && q > 4.4 && q < 4.8 }),
  penitent: (f, fy, tt) => penitent(f.x, fy, tt, f.o || {}),
  confessor: (f, fy, tt, q, t) => confessor(f.x, fy, t, {}),
  hunter: (f, fy, tt, q, t) => { hunterMask(f.x, fy, t); },
  skel: (f, fy, tt, q) => skeletonWarrior(f.x, fy, tt, { b: Math.sin(tt * 2) > 0.6 ? -1 : 0, swing: f.id === 's1' && q > 4.4 && q < 4.8 ? 3 : 0, ...(f.o || {}) }),
};
const ROSTER = {
  crypt: {
    where: 'Shadow Crypt · floor 4 · battle 2/3', cast: ['Last Rites', 'confessor'],
    foes: [
      { id: 's3', kind: 'hollow', x: 205, lane: 'back', hp: 0.9, ph: 1.7, o: { strip: 1, shield: false } },
      { id: 'z2', kind: 'penitent', x: 246, lane: 'back', hp: 1, ph: 2.3, tag: ['TAUNTED', 'd5'] },
      { id: 'lt', kind: 'confessor', x: 304, lane: 'mid', hp: 0.92 },
      { id: 's1', kind: 'hollow', x: 186, lane: 'front', hp: 0.46, ph: 0, tag: ['STAGGERED', 'u6'] },
      { id: 'z1', kind: 'penitent', x: 228, lane: 'front', hp: 0.8, ph: 0.9 },
      { id: 's2', kind: 'hollow', x: 268, lane: 'front', hp: 0.7, ph: 3.1, o: { shield: false, armBare: true } },
    ],
  },
  iron: {
    where: 'The Iron Saint · floor 12 · elite', cast: ['Hunt · position 4', 'hunter'],
    foes: [
      { id: 's3', kind: 'hollow', x: 206, lane: 'back', hp: 0.8, ph: 1.7, o: { strip: 2 } },
      { id: 's4', kind: 'hollow', x: 248, lane: 'back', hp: 1, ph: 2.6, o: { strip: 2 } },
      { id: 'lt', kind: 'hunter', x: 300, lane: 'mid', hp: 1, elite: true },
      { id: 's1', kind: 'hollow', x: 186, lane: 'front', hp: 0.46, ph: 0, tag: ['STAGGERED', 'u6'], o: { strip: 2 } },
      { id: 's2', kind: 'hollow', x: 228, lane: 'front', hp: 0.7, ph: 3.1, o: { strip: 1, shield: false, armBare: true } },
    ],
  },
};
function aojBattle(ctx, t, cfg) {
  const R = ROSTER[cfg.roster];
  setRes(BA_W, GS_H, BAR_Y); CX = 167;
  const F = buf('ba', BA_W, GS_H); clearFrame(F); bind(F);
  const L = 6, q = t % L, KN = PARTY.find((m) => m.id === 'knight'), LT = R.foes.find((f) => f.id === 'lt');
  AOJ.candles = [];
  const r = drawDungeon(F, t, {
    battle: true, cam: cfg.cam ?? 1004, foreOff: 98,
    enemies(F, t, lights) {
      if (cfg.brazier !== false) {   // a brazier at the back, between the lanes and the lieutenant
        const bx = 286, by = 186;
        MAT = M_STONE; poly([[bx - 6, by - 14], [bx + 6, by - 14], [bx + 4, by - 10], [bx - 4, by - 10]], 0.4); line(bx - 4, by - 10, bx - 6, by, 0.35); line(bx + 4, by - 10, bx + 6, by, 0.35); line(bx, by - 10, bx, by, 0.3);
        for (let k = 0; k < 7; k++) { const h = 3 + Math.round(3 * (0.5 + 0.5 * Math.sin(t * 11 + k * 1.9))); for (let j = 0; j < h; j++) put(bx - 3 + k, by - 15 - j, 1 - j * 0.1, M_UMBER, 1); }
        lights.push({ x: bx, y: by - 18, r: 95, i: 0.95 + 0.1 * Math.sin(t * 9), c: [1.2, 1.0, 0.74] });
      }
      skull(LOOT_AT[0] - 7, LOOT_AT[1] - 2, 0.7); bones(LOOT_AT[0] - 1, LOOT_AT[1] + 2, 0.6);
      R.foes.forEach((f, n) => {
        const fy = LANE[f.lane], tt = t + (f.ph || 0);
        if (f.kind !== 'hunter') mulEllipse(f.x, fy, f.kind === 'confessor' ? 0 : 11, 3, 0.3);
        TAG = 11 + n; DRAW_FOE[f.kind](f, fy, tt, q, t);
        if (f.id === 's1') EFX.hit = [...EFX.warrior];
        TAG = 0;
        if (f.kind === 'hunter') { TAG = 11 + n; hunterTrophies(f.x, fy, t, true); TAG = 0; }
      });
      const backT = new Set(R.foes.map((f, n) => (f.lane === 'back' ? 11 + n : 0)).filter(Boolean));
      for (let i = 0; i < W * H; i++) if (backT.has(F.T[i])) { F.G[i] *= 0.66; if (F.E[i] === 0) F.V[i] *= 0.9; }
      lights.push({ beam: true, x: 232, y: 0, x1: 206, y1: 204, w: 66, i: 0.62, air: 0.05, c: COLD, r: 1 });
      if (LT.kind === 'confessor') { lights.push({ x: EFX.necro[0], y: EFX.necro[1], r: 60, i: 0.55, c: [1.0, 0.8, 1.6] }); lights.push({ x: EFX.staff[0], y: EFX.staff[1], r: 40, i: 0.5, c: [1.5, 0.6, 0.65] }); }
      if (cfg.enemiesFX) cfg.enemiesFX(F, t, lights);
    },
    fx(F, t, lights) {
      candleFlames(t);
      for (const [x, y] of AOJ.candles) lights.push({ x, y, r: 34, i: 0.7 + 0.1 * Math.sin(t * 13 + x), c: WARM });
      for (const f of R.foes) if (f.kind === 'hollow' && (f.o || {}).strip) lights.push({ x: f.x - 1, y: LANE[f.lane] - 42, r: 14, i: 0.4, c: [1.6, 0.55, 0.6] });
      if (LT.kind === 'hunter') hunterFX(F, t, lights);
      // the drop: a ring glinting on the bone pile, its beam
      { const [IX, IY] = LOOT_AT, pulse = 0.5 + 0.5 * Math.sin(t * 3);
        for (let y = IY - 3; y >= IY - 60; y--) { const a = (1 - (IY - 3 - y) / 57) ** 1.25; if (a * 1.2 > BAYER8[((y & 7) << 3) | (IX & 7)]) put(IX, y, 0.66 + 0.33 * a, M_STONE, 1); }
        const RING = ['...g...', '..6M6..', '.66666.', '6.....6', '.55555.'];
        RING.forEach((rw, j) => [...rw].forEach((c, i3) => { if (c === '.') return; put(IX - 3 + i3, IY - 3 + j, c === 'M' ? 1 : c === 'g' ? (pulse > 0.6 ? 0.95 : 0.7) : c === '6' ? 0.86 : 0.62, M_STONE, 1); }));
        lights.push({ x: IX, y: IY - 3, r: 34, i: 0.5 + 0.15 * pulse, c: [0.8, 1.0, 1.3] }); }
      // hellfire on the front Hollow
      if (q > 2.9 && q < 3.8) {
        const k = (q - 2.9) / 0.9, [wx, wy] = EFX.hit;
        for (let n = 0; n < 40; n++) { const an = hash(n, 1, 3) * 6.28, d = k * (6 + hash(n, 2, 3) * 16), up = k * k * 14 * hash(n, 3, 3); if (hash(n, Math.floor(t * 14), 5) < 0.2) continue; put(Math.round(wx + Math.cos(an) * d), Math.round(wy + Math.sin(an) * d * 0.8 - up), 1 - k * 0.5, M_UMBER, 1); }
        ellipse(wx, wy, 6 * (1 - k) + 1, 6 * (1 - k) + 1, 1, M_UMBER, 1);
        lights.push({ x: wx, y: wy, r: 80 * (1 - k * 0.5), i: 1.2 * (1 - k), c: [1.2, 1.0, 0.72] });
      }
      if (cfg.fx) cfg.fx(F, t, lights);
    },
  });
  if (cfg.amb) r.ambient = cfg.amb;
  bind(F); CLIP = null;
  const HPB = { knight: 0.82, rogue: 0.74, mage: 0.58, priest: 0.9 }, hp = HEROES.map((h) => HPB[h.id]);
  PARTY.forEach((m) => hpBar(m.x, 120, HPB[m.id]));
  for (const f of R.foes) {
    if (f.kind === 'hunter' && !hunterReveal(t)) continue;
    const by = BAR_YF[f.lane] - (f.kind === 'hunter' ? 8 : 0);
    hpBar(f.x - 2, by, f.hp, true);
    if (f.tag) markTag(f.x - 2, by - 10, f.tag[0], P[f.tag[1]]);
  }
  windup(LT.x - 2, LT.kind === 'hunter' ? 96 : 104, R.cast[0], (t % 6) / 6);
  if (q > 3.1 && q < 4.2) { const k = (q - 3.1) / 1.1; floater('38', EFX.hit[0] - 2, Math.round(166 - k * 12), P.moon, true); }
  { const k = clamp((t % 6) / 1.6); text('Grave Ring', LOOT_AT[0], Math.round(LOOT_AT[1] - 12 - k * 50), 'tiny', P.s6, { align: 'c', outline: P.void }); }
  cornerOverlay({ where: R.where, flow: '1.6', flowBar: 0.12 }, t);
  portalButton({ inBattle: true });
  buffs([{ icon: 'can', label: '61s' }, { icon: 'ward', label: '4s', sweep: 0.75 }, { icon: 'taunt', label: '6s' }], t);
  skillBar({ selected: 2, hp, cooldown: { 1: { f: 0.62, s: 4 }, X: { f: 0.8, s: 6 }, Q: { f: 0.35, s: 2 }, E: { f: 0.7, s: 21 } }, combo: { key: '2', label: 'x2' }, answer: 'S', queued: 'W', ult: { C: { need: 2 } }, autocast: { 1: true, Q: false } }, t);
  composeInto(ctx, F, r, 0);
}
// a flat-lit test card for sprite work (not on the page)
function screenSpriteTest(t, list) {
  const c = aojCanvas(200, 90), ctx = c.getContext('2d');
  setRes(200, 90); const F = buf('st', 200, 90); clearFrame(F); bind(F); CLIP = null; MAT = M_STONE; EMI = 0; TAG = 0;
  rect(0, 0, W, H, (x, y) => 0.3 + 0.05 * ((x >> 3) + (y >> 3) & 1), M_STONE);
  AOJ.candles = [];
  list.forEach((fn, n) => { TAG = 11 + n; fn(); TAG = 0; });
  outline(F, 0.3); candleFlames(t);
  const img = ctx.createImageData(W, H); compose(F, img, [{ x: 60, y: 10, r: 260, i: 0.5, c: WARM }], [0.62, 0.6, 0.68], 0.2, 0); ctx.putImageData(img, 0, 0);
  return c;
}

// ---------------------------------------------------------------- shared bits for the biomes
function skl(x, y, v, mat = M_UMBER, eye = 0.03) {
  ['.###.', '#####', '#o#o#', '##.##', '.#.#.'].forEach((r, j) => [...r].forEach((c, i) => {
    if (c === '#') put(x + i, y + j, clamp(v * (i < 2 ? 1.06 : i > 3 ? 0.74 : 0.92) * (j > 2 ? 0.86 : 1)), mat); else if (c === 'o') put(x + i, y + j, eye, M_DUSK);
  }));
}
function boneH(x, y, len, v, mat = M_UMBER) {
  for (let i = 1; i < len - 1; i++) { put(x + i, y, v, mat); put(x + i, y + 1, v * 0.6, mat); }
  for (const ex of [x, x + len - 1]) { put(ex, y - 1, v * 0.92, mat); put(ex, y, v, mat); put(ex, y + 1, v * 0.74, mat); put(ex, y + 2, v * 0.5, mat); }
}
function archMask(x, y, ax, springY, hs) { return inPointed(x, y, ax, springY, hs); }
const BIOME = {};
function biomeLayers(b) { return { far: mkBuf(FAR_P, FLOOR_Y), mid: mkBuf(MID_P, FLOOR_Y), fore: mkBuf(FORE_P, H), flames: [], lamps: [], beams: [], farFlames: [], foreFlames: [], foreLamps: [], props: [] }; }

// ---------------------------------------------------------------- biome 2: the Ossuary (umber: bone, gilt, candle)
// Walls of stacked skulls and long bones, pillars of skulls, arches of femurs. A jewelled catacomb saint sits in his
// niche in gilt armour; a chandelier of bones hangs from the vault. Cherubs flutter under it. Warm and close.
function buildOssuary() {
  const L = biomeLayers(); MAT = M_UMBER; EMI = 0; TAG = 0; DXV = 0;
  // FAR: an endless arcade of skull pillars in the dark
  bind(L.far);
  rect(0, 0, FAR_P, 128, (x, y) => 0.04 + 0.03 * vnoise(x / 6, y / 6, 501, FAR_P / 6), M_DUSK);
  for (let k = 0; k < 5; k++) {
    const px = 33 + k * 66;
    for (let y = 30; y < 128; y += 6) for (let c = -1; c <= 1; c++) skl(px - 2 + c * 5 + ((y / 6) & 1 ? 2 : 0), y, 0.2 + 0.06 * hash(k, y, 502), M_UMBER, 0.02);
    for (let y = 0; y < 30; y++) { const w = 10 + Math.round((30 - y) * 0.9); for (let x = px - w; x <= px + w; x++) if (hash(x, y, 503) > 0.55) put(((x % FAR_P) + FAR_P) % FAR_P, y, 0.1 + 0.06 * hash(x, y, 504), M_UMBER); }
    L.farFlames.push([px - 6, 118], [px + 7, 120]);
  }
  rect(0, 128, FAR_P, 22, (x, y) => ((y - 128) % 5 === 0 ? 0.05 : 0.12 + 0.05 * vnoise(x / 3, y, 505, FAR_P / 3)), M_UMBER);
  // MID: the bone wall
  bind(L.mid);
  const bay = (k) => 55 + k * 110, springY = 82, hs = 30, ARCH = [0, 2];
  for (let y = 0; y < FLOOR_Y; y++) for (let x = 0; x < MID_P; x++) {
    let inArch = false; for (const k of ARCH) if (archMask(x, y, bay(k), springY, hs)) inArch = true;
    if (inArch) continue;
    if (y < 30) { put(x, y, 0.05 + 0.04 * (y / 30), M_DUSK); continue; }
    const band = (y - 30) % 10, row = Math.floor((y - 30) / 10), dk = lerp(0.62, 1, clamp((y - 30) / 80));
    if (band < 6) { put(x, y, 0.035, M_DUSK); }
    else { put(x, y, 0.035, M_DUSK); }
  }
  // skull rows and femur bands
  for (let row = 0; row < 11; row++) {
    const y0 = 30 + row * 10, dk = lerp(0.58, 1, clamp(row / 8));
    for (let x = (row & 1) * 3; x < MID_P; x += 6) { let skip = false; for (const k of ARCH) if (archMask(x + 2, y0 + 2, bay(k), springY, hs + 5)) skip = true; if (!skip) skl(x, y0, (0.5 + 0.14 * hash(x, row, 506)) * dk, M_UMBER, 0.02); }
    for (let x = (row & 1) * 7; x < MID_P; x += 14) { let skip = false; for (const k of ARCH) if (archMask(x + 7, y0 + 7, bay(k), springY, hs + 5)) skip = true; if (!skip) boneH(x, y0 + 6, 13, (0.62 + 0.12 * hash(x, row, 507)) * dk); }
  }
  // arches of femurs, radiating
  for (const k of ARCH) {
    const ax = bay(k);
    for (let y = 30; y < FLOOR_Y; y++) for (let x = ax - hs - 9; x <= ax + hs + 9; x++) {
      if (archMask(x, y, ax, springY, hs)) continue;
      if (!archMask(x, y, ax, springY, hs + 7)) continue;
      const a = y < springY ? Math.atan2(springY - y, Math.abs(x + 0.5 - ax)) : 0, seg = y < springY ? Math.floor(a / 0.16) : Math.floor((y - springY) / 7);
      const ring = archMask(x, y, ax, springY, hs + 1) ? 0 : archMask(x, y, ax, springY, hs + 6) ? 1 : 2;
      let v = ring === 1 ? 0.7 - 0.2 * ((y < springY ? (a / 0.16) % 1 : ((y - springY) % 7) / 7) < 0.2 ? 1 : 0) : 0.3;
      put(x, y, v * lerp(0.7, 1, clamp((y - 30) / 60)) + (x < ax ? 0.04 : -0.06), M_UMBER);
    }
    skl(ax - 2, springY - 45, 0.86, M_UMBER, 0.02);
  }
  // pillars of stacked skulls with a femur capital
  for (let k = 0; k < 4; k++) for (const sh of [0, MID_P]) {
    const cx = k * 110 + sh;
    rect(cx - 9, 30, 18, 112, 0.03, M_DUSK);
    for (let y = 32; y < 140; y += 6) for (let c = 0; c < 3; c++) skl(cx - 8 + c * 6 + ((y >> 1) & 1 ? 1 : 0) - 1, y, (0.62 + 0.12 * hash(c, y, 508)) * (c === 0 ? 1.06 : c === 2 ? 0.78 : 0.92), M_UMBER, 0.02);
    for (let j = 0; j < 3; j++) boneH(cx - 11, 26 + j * 3, 22, 0.78 - j * 0.1);
    rect(cx - 12, 140, 24, 6, (x) => 0.36 + 0.24 * clamp((cx + 12 - x) / 24), M_UMBER);
    rect(cx - 10, 84, 20, 2, 0.44, M_UMBER); for (const [ox, h] of [[-9, 5], [-1, 8], [8, 5]]) candleWax(cx + ox, 81 + (ox === -1 ? 3 : 0), h, sh === 0 ? L.flames : []);
    if (sh === 0) L.lamps.push([cx, 74, 120, 0.95]);
  }
  // bay 1: the jewelled saint seated in his niche, gilt armour on bones, a crown, candles at his feet
  {
    const cx = bay(1);
    rect(cx - 18, 52, 36, 88, 0.025, M_DUSK); ellipse(cx, 52, 18, 12, 0.025, M_DUSK);
    for (let y = 40; y < 140; y++) for (let x = cx - 21; x <= cx + 21; x++) { const inner = y >= 52 ? Math.abs(x + 0.5 - cx) <= 18 : Math.hypot((x + 0.5 - cx) / 18, (y + 0.5 - 52) / 12) <= 1, outer = y >= 52 ? Math.abs(x + 0.5 - cx) <= 21 : Math.hypot((x + 0.5 - cx) / 21, (y + 0.5 - 52) / 14) <= 1; if (outer && !inner) put(x, y, 0.62 + 0.3 * clamp((cx + 21 - x) / 42) * (((x + y) % 4) ? 1 : 0.7), M_UMBER); }
    // throne
    rect(cx - 12, 108, 24, 4, 0.5, M_UMBER); rect(cx - 12, 70, 3, 40, 0.42, M_UMBER); rect(cx + 9, 70, 3, 40, 0.32, M_UMBER); rect(cx - 10, 112, 20, 28, (x) => 0.18 + 0.2 * clamp((cx + 10 - x) / 20), M_UMBER);
    // legs (bone), gilt greaves
    for (const sd of [-1, 1]) { rect(cx + sd * 4 - 1, 112, 3, 18, (x) => (x === cx + sd * 4 - 1 ? 0.95 : 0.7), M_UMBER); rect(cx + sd * 4 - 2, 130, 5, 3, 0.9, M_UMBER); }
    // gilt breastplate with gems, ribs showing above
    poly([[cx - 8, 86], [cx + 8, 86], [cx + 7, 108], [cx - 7, 108]], (x, y) => 0.64 + 0.34 * clamp((cx + 8 - x) / 16) - ((y - 86) % 5 === 0 ? 0.14 : 0), M_UMBER);
    for (const [gx, gy, m] of [[cx - 3, 92, M_MAGIC], [cx + 3, 92, M_MOSS], [cx, 99, M_MAGIC], [cx - 4, 103, M_MOSS], [cx + 4, 103, M_MAGIC]]) { put(gx, gy, 0.95, m, 1); put(gx + 1, gy, 0.6, m, 1); }
    for (let k = 0; k < 3; k++) line(cx - 6, 80 + k * 2, cx + 6, 80 + k * 2, 0.86, M_UMBER);
    // arms on the throne's arms, a sceptre
    for (const sd of [-1, 1]) { line(cx + sd * 8, 86, cx + sd * 11, 100, 0.86, M_UMBER); line(cx + sd * 11, 100, cx + sd * 10, 107, 0.8, M_UMBER); }
    line(cx - 12, 94, cx - 12, 74, 0.9, M_UMBER); ellipse(cx - 11.5, 72.5, 2, 2, 0.95, M_UMBER);
    // the skull wearing a crown, a veil
    skl(cx - 2, 71, 0.96, M_UMBER, 0.02);
    for (let x = cx - 4; x <= cx + 4; x++) put(x, 70, 0.92, M_UMBER);
    for (const px of [cx - 4, cx - 1, cx + 2, cx + 4]) { put(px, 69, 0.9, M_UMBER); put(px, 68, 0.95, M_UMBER); }
    put(cx, 69, 0.9, M_MAGIC, 1);
    for (const [ox, h] of [[-16, 8], [-13, 5], [-19, 4], [14, 7], [17, 5], [12, 4]]) candleWax(cx + ox, 140, h, L.flames);
    L.lamps.push([cx - 14, 130, 80, 0.75], [cx + 14, 131, 80, 0.7], [cx, 96, 50, 0.35]);
  }
  // bay 3: the bone chandelier hanging from the vault, candles on its tiers
  {
    const cx = bay(3);
    for (let y = 0; y < 30; y++) put(cx, y, 0.45, M_UMBER);
    const tier = (ty, rx, n) => {
      for (let k = 0; k < n; k++) { const a = (k / (n - 1)) * Math.PI, x = cx - Math.cos(a) * rx, y = ty + Math.sin(a) * 4; skl(Math.round(x) - 2, Math.round(y), 0.82 - 0.2 * (k / n), M_UMBER, 0.02); }
      for (let x = cx - rx; x <= cx + rx; x++) put(x, ty + 5 + Math.round(Math.sin((x - cx + rx) / (2 * rx) * Math.PI) * 4), 0.7, M_UMBER);
    };
    tier(30, 10, 5); tier(42, 18, 7); tier(56, 26, 9);
    for (let k = 0; k < 9; k++) { const x = cx - 26 + k * 6.5, y = 56 + Math.round(Math.sin(k / 8 * Math.PI) * 4); line(x, y + 6, x, y + 14 + (k % 3) * 3, 0.66, M_UMBER); }
    for (const [ox, oy] of [[-10, 30], [10, 30], [-18, 42], [18, 42], [0, 42], [-26, 56], [26, 56], [-13, 56], [13, 56]]) candleWax(cx + ox, oy, 4, L.flames);
    L.lamps.push([cx, 46, 110, 1.1], [cx - 22, 58, 60, 0.5], [cx + 22, 58, 60, 0.5]);
  }
  // FORE: a pillar of skulls and a garland of bones
  bind(L.fore); EMI = 1;
  for (let y = 0; y < H; y += 6) for (let c = 0; c < 4; c++) skl(78 + c * 6 + ((y >> 1) & 1 ? 2 : 0), y, 0.12 + (c === 3 ? 0.12 : 0), M_UMBER, 0.01);
  for (let k = 0; k <= 30; k++) { const q = k / 30, x = 300 + q * 70, y = 6 + Math.sin(q * Math.PI) * 26; skl(Math.round(x) - 2, Math.round(y), 0.14, M_UMBER, 0.01); }
  for (const [x, y] of [[470, 212], [478, 214], [486, 211], [474, 206], [482, 205], [478, 199]]) skl(x, y, 0.16, M_UMBER, 0.01);
  EMI = 0;
  L.props = [[60, 172, 's'], [140, 205, 'b'], [230, 183, 'b'], [300, 214, 's'], [410, 176, 's'], [520, 200, 'b'], [610, 187, 's'], [700, 168, 'b'], [790, 209, 'b'], [860, 180, 's']];
  return L;
}
function floorOssuary(F, cam) {
  for (let y = FLOOR_Y; y < H; y++) {
    const sp = spdAt(y + 0.5), dk = lerp(0.6, 1, (y - FLOOR_Y) / (H - FLOOR_Y)), dx = Math.round(cam * sp);
    for (let x = 0; x < W; x++) {
      const i = y * W + x, wx = cam + (x + 0.5 - CX) / sp, rowF = 9 / sp;
      let v = 0.22 + 0.08 * vnoise(wx / 7, rowF * 2.2, 511) + 0.05 * (hash(Math.floor(wx / 2), Math.floor(rowF * 4), 512) - 0.5), m = M_UMBER;
      const sh = hash(Math.floor(wx / 3), Math.floor(rowF * 3), 513);
      if (sh > 0.93) v = 0.62 + 0.25 * hash(Math.floor(wx), y, 514);
      if (vnoise(wx / 18, rowF * 1.4, 515) > 0.72) { v = 0.08; m = M_DUSK; }
      F.V[i] = v * dk; F.M[i] = m; F.E[i] = 0; F.T[i] = 0; F.A[i] = 1; F.DX[i] = dx;
    }
  }
}
// the Ossuary's curio: a gilt reliquary on a stand, a crowned skull behind its glass
function reliquary(cx, fy, t) {
  MAT = M_UMBER;
  rect(cx - 3, fy - 14, 6, 14, (x) => 0.36 + 0.3 * clamp((cx + 3 - x) / 6)); rect(cx - 9, fy - 2, 18, 2, 0.5);
  poly([[cx - 13, fy - 34], [cx + 13, fy - 34], [cx + 12, fy - 14], [cx - 12, fy - 14]], (x, y) => 0.62 + 0.32 * clamp((cx + 13 - x) / 26) - ((x + y) % 5 === 0 ? 0.1 : 0));
  rect(cx - 9, fy - 31, 18, 14, 0.06, M_DUSK); for (let y = fy - 31; y < fy - 17; y++) put(cx - 9 + ((y - fy) & 7), y, 0.3, M_STONE, 1);
  skl(cx - 3, fy - 26, 0.92, M_UMBER, 0.02); for (let x = cx - 4; x <= cx + 2; x++) put(x, fy - 27, 0.95); for (const px of [cx - 4, cx - 1, cx + 2]) put(px, fy - 28, 0.95);
  poly([[cx - 14, fy - 34], [cx, fy - 44], [cx + 14, fy - 34]], (x) => 0.7 + 0.28 * clamp((cx + 14 - x) / 28));
  line(cx, fy - 44, cx, fy - 49, 0.9); line(cx - 2, fy - 47, cx + 2, fy - 47, 0.9);
  for (const sx of [cx - 14, cx + 13]) rect(sx, fy - 34, 1, 20, 0.9);
  candleWax(cx - 18, fy, 6, []); candleWax(cx + 17, fy, 8, []);
  for (const [x, h] of [[cx - 17, 6], [cx + 18, 8]]) { put(x, fy - h - 1, 1, M_UMBER, 1); put(x, fy - h - 2, 0.85, M_UMBER, 1); }
}

// ---------------------------------------------------------------- a biome walk: the party walking, the biome's curio ahead
const WALKS = {
  crypt: { where: 'Shadow Crypt · floor 4 · battle 1/3', amb: null },
  ossuary: { where: 'The Ossuary · floor 7 · battle 1/3', amb: [0.1, 0.07, 0.12],
    enemies(F, t, lights) { for (let n = 0; n < 4; n++) { const x = 220 + n * 22 + Math.round(Math.sin(t * 0.9 + n * 2) * 10), y = 62 + (n % 2) * 18 + Math.round(Math.cos(t * 1.3 + n) * 6); TAG = 21 + n; cherub(x, y, t, n); TAG = 0; } } },
  brood: { where: 'The Brood · floor 17 · battle 1/3', amb: [0.075, 0.115, 0.13],
    enemies(F, t, lights) { dronesOnWalls(t); },
    fx(F, t, lights) { broodLightsInto(lights, t); lights.push({ x: DG.cartX || 260, y: 180, r: 50, i: 0.5, c: [0.6, 1.25, 1.05] }); } },
  iron: { where: 'The Iron Saint · floor 12 · battle 1/3', amb: [0.06, 0.055, 0.13], fx(F, t, lights) { eyeLightsInto(lights, t); } },
};
function aojWalk(ctx, t, b) {
  const WK = WALKS[b];
  setRes(BA_W, GS_H, BAR_Y); CX = 167;
  const F = buf('ba', BA_W, GS_H); clearFrame(F); bind(F);
  AOJ.candles = [];
  const r = drawDungeon(F, t, { enemies: WK.enemies, fx(F, t, lights) { candleFlames(t); for (const [x, y] of AOJ.candles) lights.push({ x, y, r: 30, i: 0.6, c: WARM }); if (WK.fx) WK.fx(F, t, lights); } });
  if (WK.amb) r.ambient = WK.amb;
  if (WK.post) WK.post(r, t);
  bind(F); CLIP = null;
  const HPD = { knight: 0.92, rogue: 0.84, mage: 0.7, priest: 0.95 }, hp = HEROES.map((h) => HPD[h.id]);
  PARTY.forEach((m) => hpBar(m.x, 120, HPD[m.id]));
  cornerOverlay({ where: WK.where, flow: '1.4', flowBar: 0.42 }, t);
  portalButton({ inBattle: false });
  buffs([{ icon: 'can', label: '84s' }, { icon: 'ward', label: '12s', sweep: 0.45 }], t);
  skillBar({ selected: 0, hp, cooldown: {}, queued: null }, t);
  composeInto(ctx, F, r, 0);
}

// ---------------------------------------------------------------- biome 3: the Iron Saint (stone darks, crimson eye-lights)
// Inside the fallen angel: riveted hull plates streaked with rust, colossal ribs, pipes like an organ, a gothic tracery
// plate with crimson light behind it, the great eye: an iron socket of rings round a crimson lens. A tear in the hull
// lets the moon in. The Hollows here are bare frames; a Hunter stalks the floor.
const EYE_LIGHTS = [];   // [x, y, r, i] in mid-layer space: crimson lights, pulsing
function buildIronSaint() {
  const L = biomeLayers(); MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0; EYE_LIGHTS.length = 0;
  // FAR: the dark hollow of the body, ribs receding, a few far eye-lights
  bind(L.far);
  rect(0, 0, FAR_P, 128, (x, y) => 0.03 + 0.03 * vnoise(x / 9, y / 9, 601, FAR_P / 9), M_STONE);
  for (let k = 0; k < 6; k++) { const xr = 20 + k * 55; for (let y = 0; y < 128; y++) { const x0 = xr + 10 * ((y - 60) / 60) ** 2 - 5; for (let x = Math.floor(x0); x < x0 + 9; x++) { const v = ironRibV(x, y, x0, 9, 0.5); if (v >= 0) put(((x % FAR_P) + FAR_P) % FAR_P, y, v * 0.7, M_STONE); } } }
  for (const [x, y] of [[48, 40], [161, 72], [270, 55]]) { put(x, y, 0.7, M_DANGER, 1); put(x + 1, y, 0.4, M_DANGER, 1); }
  rect(0, 128, FAR_P, 22, (x, y) => ((y - 128) % 4 === 0 ? 0.04 : 0.1 + 0.04 * hash(x >> 2, y, 602)), M_STONE);
  // MID: riveted hull plates with rust streaks
  bind(L.mid);
  const bay = (k) => 55 + k * 110;
  for (let y = 0; y < FLOOR_Y; y++) for (let x = 0; x < MID_P; x++) {
    const row = Math.floor(y / 24), off = (row & 1) * 18, px = Math.floor((x + off) / 36), fx = (x + off) % 36, fy = y % 24;
    let v = 0.2 + 0.08 * hash(px, row, 603) + 0.06 * (fbm(x / 7, y / 7, 604, MID_P / 7) - 0.5) - 0.06 * (fy / 24);
    if (fx === 0 || fy === 0) v = 0.03; else if (fx === 1 || fy === 1) v += 0.14;
    if ((fy === 3 || fy === 21) && fx % 5 === 2) v = 0.72; if ((fx === 3 || fx === 33) && fy % 5 === 2) v = 0.66;
    let m = M_STONE;
    if (hash(Math.floor(x / 2), row, 605) > 0.86 && fy > 4 && fy < 4 + 14 * hash(Math.floor(x / 2), row, 606)) { m = M_UMBER; v = 0.22 + 0.12 * hash(x, y, 607); }
    put(x, y, v * lerp(0.5, 1, clamp(y / 90)), m);
  }
  // bay 2: a tear in the hull, the night sky and the moon outside; bent plate edges
  {
    const cx = bay(2), pts = [[cx - 26, 24], [cx - 10, 14], [cx + 4, 20], [cx + 22, 12], [cx + 30, 30], [cx + 22, 52], [cx + 28, 74], [cx + 8, 96], [cx - 14, 88], [cx - 28, 66], [cx - 20, 44]];
    poly(pts, (x, y) => { const sky = 0.16 + 0.22 * (1 - y / 100); return hash(x, y, 608) > 0.985 ? 0.9 : sky; }, M_STONE, 1);
    ellipse(cx + 10, 36, 9, 9, (x, y) => (Math.hypot(x - cx - 6, y - 32) < 8 ? 0.96 : 0.8), M_STONE, 1);
    for (let k = 0; k < pts.length; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length]; line(x0, y0, x1, y1, 0.78, M_STONE); line(x0 + 1, y0 + 1, x1 + 1, y1 + 1, 0.3, M_STONE); }
    L.beams.push([cx + 6, 30, cx - 30, 146, 22]);
  }
  // bay 1: pipes like an organ, banded, bell mouths, vents breathing a crimson glow
  {
    const cx = bay(1);
    rect(cx - 36, 40, 72, 100, 0.03, M_STONE);
    for (let k = 0; k < 11; k++) {
      const px = cx - 33 + k * 6, top = 44 + Math.round(Math.abs(k - 5) * 7 + 6 * hash(k, 1, 609));
      rect(px, top, 5, 140 - top, (x) => [0.18, 0.5, 0.66, 0.42, 0.12][x - px], M_STONE);
      rect(px - 1, top - 2, 7, 2, 0.72, M_STONE); rect(px - 1, top, 7, 1, 0.1, M_STONE);
      for (let y = top + 10; y < 136; y += 16) { rect(px, y, 5, 1, 0.8, M_STONE); rect(px, y + 1, 5, 1, 0.08, M_STONE); }
      if (k % 3 === 1) { rect(px + 1, top + 4, 3, 2, 0.7, M_DANGER, 1); EYE_LIGHTS.push([px + 2, top + 5, 30, 0.35]); }
    }
    rect(cx - 38, 136, 76, 6, (x) => 0.3 + 0.3 * clamp((cx + 38 - x) / 76), M_STONE); rivets(cx - 36, 138, cx + 36, 138, 14, 0.85);
  }
  // bay 0: a plate cut in gothic tracery, crimson light behind it
  {
    const cx = bay(0), r0 = 26;
    for (let y = 26; y < 140; y++) for (let x = cx - 32; x <= cx + 32; x++) {
      const inArch = inPointed(x, y, cx, 70, 28), inner = inPointed(x, y, cx, 70, 25);
      if (!inArch) continue;
      if (!inner) { put(x, y, 0.5 + 0.3 * clamp((cx - x) / 30), M_STONE); continue; }
      const u = x + 0.5 - cx, vv = y + 0.5;
      const q1 = Math.hypot(u, vv - 52) < 10 && !(Math.hypot(u, vv - 52) < 2.5), qf = [[-6, 52], [6, 52], [0, 46], [0, 58]].some(([a, b]) => Math.hypot(u - a, vv - b) < 5.4);
      const lancet = (Math.abs(u) > 3 && Math.abs(u) < 11 && vv > 74 && vv < 132) || (Math.abs(u) > 14 && Math.abs(u) < 21 && vv > 82 && vv < 132);
      const cut = qf || lancet;
      if (cut) put(x, y, 0.42 + 0.4 * clamp(1 - Math.hypot(u, vv - 90) / 50), M_DANGER, 1); else put(x, y, 0.14 + 0.1 * clamp((cx - x) / 25) + (q1 && !qf ? 0.2 : 0), M_STONE);
    }
    EYE_LIGHTS.push([cx, 90, 90, 0.55]);
  }
  // bay 3: the great eye. An iron socket of concentric rings, radial bolts, the crimson lens
  {
    const cx = bay(3), cy = 98, R = 48;
    for (let y = cy - R; y <= Math.min(FLOOR_Y - 1, cy + R); y++) for (let x = cx - R; x <= cx + R; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R * 44, a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx), lit = 0.5 + 0.5 * Math.cos(a + 2.3);
      if (d > 43.5) continue;
      let v, m = M_STONE, e = 0;
      if (d > 39) v = 0.3 + 0.5 * lit; else if (d > 37) v = 0.05; else if (d > 28) { v = 0.3 + 0.34 * lit; if (Math.abs(((a + Math.PI) / (Math.PI / 8)) % 1 - 0.5) < 0.12 && d > 30 && d < 35) v = 0.92; }
      else if (d > 26) v = 0.04; else if (d > 18) v = 0.22 + 0.22 * lit + ((Math.floor(a * 6) & 1) ? 0.08 : 0); else if (d > 16) v = 0.8 * lit + 0.12;
      else { m = M_DANGER; e = 1; v = 0.35 + 0.6 * (1 - d / 16) ** 1.4; if (Math.hypot(x - cx + 6, y - cy + 6) < 3.5) { m = M_STONE; v = 0.95; } }
      put(x, y, v, m, e);
    }
    EYE_LIGHTS.push([cx, cy, 130, 1.0]);
  }
  // ribs at the bay joints: colossal riveted beams, bowed
  for (let k = 0; k < 4; k++) for (const sh of [0, MID_P]) {
    const xr = k * 110 + sh;
    for (let y = 0; y < FLOOR_Y; y++) { const x0 = xr - 12 + 10 * ((y - 70) / 80) ** 2; for (let x = Math.floor(x0) - 1; x < x0 + 24; x++) { const v = ironRibV(x, y, x0, 23, 1.15); if (v >= 0) put(x, y, Math.min(0.95, v), M_STONE); } }
    for (let y = 8; y < 146; y += 34) { for (let x = xr - 13; x < xr + 13; x++) put(x, y, 0.06, M_STONE); }
  }
  // chains hanging from the dark
  for (const [cx, len] of [[100, 46], [212, 30], [318, 54]]) for (let y = 0; y < len; y += 3) { rect(cx, y, 1, 2, 0.5); rect(cx - 1, y + 2, 3, 1, 0.3); }
  // FORE: a rib in silhouette, a hanging chain
  bind(L.fore); EMI = 1;
  for (let y = 0; y < H; y++) { const x0 = 80 + 8 * ((y - 100) / 120) ** 2; for (let x = Math.floor(x0); x < x0 + 26; x++) { const u = (x - x0) / 26; put(x, y, u > 0.86 ? 0.2 : u > 0.8 ? 0.1 : 0.03 + (y % 10 === 0 && u > 0.2 && u < 0.3 ? 0.18 : 0), M_STONE); } }
  for (let y = 0; y < 60; y += 4) { rect(420, y, 2, 3, 0.07); rect(419, y + 3, 4, 1, 0.14); }
  EMI = 0;
  L.props = [];
  return L;
}
function floorIron(F, cam) {
  let prevRow = -1;
  for (let y = FLOOR_Y; y < H; y++) {
    const sp = spdAt(y + 0.5), rowF = 9 / sp, row = Math.floor(rowF), joint = row !== prevRow && y > FLOOR_Y, dk = lerp(0.55, 1, (y - FLOOR_Y) / (H - FLOOR_Y)), dx = Math.round(cam * sp);
    prevRow = row;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, wx = cam + (x + 0.5 - CX) / sp, cF = wx / 30, col = Math.floor(cF), fx = cF - col;
      let v = 0.2 + 0.08 * hash(col, row, 611), m = M_STONE;
      if (joint) v = 0.03; else if (fx < 0.04) v = 0.04; else if (fx < 0.08) v += 0.16;
      const gx = (wx / 3) % 1, gy = (rowF * 3) % 1;
      if (!joint && fx > 0.12 && fx < 0.9 && gx < 0.5 && gy < 0.45 && hash(col, row, 612) > 0.4) v = 0.05;
      if (hash(col, row, 613) > 0.88) { v = 0.02; m = M_STONE; }
      if (hash(Math.floor(wx / 4), row, 614) > 0.9 && !joint) { m = M_UMBER; v = 0.24; }
      F.V[i] = v * dk; F.M[i] = m; F.E[i] = 0; F.T[i] = 0; F.A[i] = 1; F.DX[i] = dx;
    }
  }
}
function eyeLightsInto(lights, t) {
  const mm = ((Math.round(DG.cam * 0.7) % MID_P) + MID_P) % MID_P;
  EYE_LIGHTS.forEach(([lx, ly, r, i], n) => { for (const b of [lx - mm, lx - mm + MID_P]) if (b > -r && b < W + r) lights.push({ x: b, y: ly, r, i: i * (0.8 + 0.2 * Math.sin(t * 2.2 + n)), c: [1.7, 0.45, 0.55] }); });
}

// ---------------------------------------------------------------- biome 4: the Brood (moss and dusk: resin, cocoons, cold glow)
// The crypt again, deeper, overgrown: ribbed, glistening resin over the baroque carving, cocoons with pilgrims inside,
// strands from the vault, pale glowing nodules. Drones crawl the walls. Cold and wet.
const BROOD_LIGHTS = [];
function resinV(x, y, s) {   // ribbed, glistening resin
  const warp = fbm(x / 14, y / 18, s) * 6, rib = Math.sin(x * 0.8 + warp + y * 0.05), r2 = Math.sin(y * 0.35 + warp * 0.7);
  let v = 0.2 + 0.26 * Math.max(0, rib) ** 2 + 0.05 * r2;
  if (rib > 0.9) v = 0.66 + 0.2 * hash(x, y, s);
  if (rib < -0.8) v = 0.04;
  return v;
}
function buildBrood() {
  const L = biomeLayers(); MAT = M_MOSS; EMI = 0; TAG = 0; DXV = 0; BROOD_LIGHTS.length = 0;
  L.far = cloneBuf(AOJ.orig.far); L.mid = cloneBuf(AOJ.orig.mid);
  // FAR: resin over the far hall
  bind(L.far);
  for (let y = 0; y < FLOOR_Y; y++) for (let x = 0; x < FAR_P; x++) { const n = fbm(x / 20, y / 16, 701, FAR_P / 20); if (n > 0.42) put(x, y, resinV(x, y, 702) * 0.6, n > 0.55 ? M_MOSS : M_DUSK); }
  for (const [x, y] of [[40, 60], [120, 90], [210, 50], [290, 100]]) { put(x, y, 0.8, M_MOSS, 1); put(x + 1, y, 0.5, M_MOSS, 1); }
  // MID: resin creeping over the carving; most of the wall, thickest at the vault and the floor
  bind(L.mid);
  for (let y = 0; y < FLOOR_Y; y++) for (let x = 0; x < MID_P; x++) {
    const i = y * MID_P + x; if (!L.mid.A[i]) continue;
    const reach = 0.5 - 0.22 * Math.cos((y / FLOOR_Y) * Math.PI * 2) * 0.6, n = fbm(x / 26, y / 20, 703, MID_P / 26) + 0.12 * (vnoise(x / 6, y / 6, 704) - 0.5);
    if (n < reach - 0.06) continue;
    const edge = n < reach;
    put(x, y, edge ? 0.06 : resinV(x, y, 705), (hash(x >> 3, y >> 3, 706) > 0.6 || edge) ? M_DUSK : M_MOSS);
  }
  // glowing nodules on the resin
  for (let k = 0; k < 34; k++) {
    const x = Math.floor(hash(k, 1, 707) * MID_P), y = 30 + Math.floor(hash(k, 2, 707) * 110), i = y * MID_P + x;
    if (L.mid.M[i] !== M_MOSS && L.mid.M[i] !== M_DUSK) continue;
    const r = 1 + Math.floor(hash(k, 3, 707) * 2.5);
    ellipse(x + 0.5, y + 0.5, r, r, (xx, yy) => 0.6 + 0.4 * clamp(1 - Math.hypot(xx - x, yy - y) / r), M_MOSS, 1);
    if (r > 1) BROOD_LIGHTS.push([x, y, 40 + r * 8, 0.45]);
  }
  // cocoons hanging in the bays: ribbed membranes, a pilgrim's shape inside, a faint glow
  const cocoon = (cx, top, h, w, glow) => {
    for (let y = top - 30; y < top; y++) put(cx + Math.round(Math.sin(y * 0.3) * 0.6), y, 0.36, M_MOSS);
    for (let y = top; y < top + h; y++) for (let x = cx - w; x <= cx + w; x++) {
      const u = (x + 0.5 - cx) / w, q = (y - top) / h, prof = Math.sin(clamp(q) * Math.PI) ** 0.7 * (1 - 0.15 * q);
      if (Math.abs(u) > prof) continue;
      const rib = Math.sin(y * 0.9 + u * 2) > 0.7, inside = Math.abs(u) < prof * 0.45 && q > 0.18 && q < 0.88;
      let v = 0.2 + 0.36 * (1 - Math.abs(u) / prof) * (u < 0 ? 1 : 0.7) + (rib ? 0.14 : 0), m = M_MOSS, e = 0;
      if (inside) { v = glow * (0.5 + 0.3 * (1 - Math.abs(u) / (prof * 0.45))) * (q < 0.32 ? 1.1 : 1); m = M_MOSS; e = 1; if (Math.abs(u) < prof * 0.28 && ((q > 0.22 && q < 0.33) || q > 0.4)) { v = 0.06; m = M_DUSK; e = 0; } }
      put(x, y, v, m, e);
    }
    BROOD_LIGHTS.push([cx, top + h * 0.5, 80, glow * 1.1]);
  };
  cocoon(165, 46, 46, 9, 0.62); cocoon(190, 60, 38, 8, 0.4); cocoon(385, 44, 52, 10, 0.7); cocoon(360, 66, 34, 7, 0.36); cocoon(52, 70, 30, 7, 0.4);
  // strands and drips from the vault
  for (let k = 0; k < 26; k++) { const x = Math.floor(hash(k, 4, 708) * MID_P), len = 8 + Math.floor(hash(k, 5, 708) * 34); for (let y = 0; y < len; y++) put(x + (y > len * 0.6 ? 1 : 0), y, 0.3 + 0.2 * (y === len - 1 ? 1 : 0), M_MOSS); put(x + 1, len, 0.8, M_MOSS, 1); }
  // FORE: curtains of resin and a cocoon in silhouette
  bind(L.fore); EMI = 1;
  for (let y = 0; y < H; y++) { const w = 14 + 8 * Math.sin(y * 0.05) + 6 * fbm(y / 20, 1, 709); for (let x = 84 - w / 2; x < 84 + w / 2; x++) put(x, y, (x > 84 + w / 2 - 3 ? 0.16 : 0.03) + (Math.sin(x * 1.1 + y * 0.1) > 0.9 ? 0.08 : 0), M_MOSS); }
  for (let y = 0; y < 90; y++) { const w = 5 + 4 * Math.sin(y / 90 * Math.PI); for (let x = 400 - w; x < 400 + w; x++) put(x, y, x > 400 + w - 2 ? 0.18 : 0.04, M_MOSS); }
  for (let k = 0; k < 8; k++) { const x = 520 + k * 13; for (let y = 0; y < 30 + (k % 3) * 14; y++) put(x, y, 0.06, M_MOSS); }
  EMI = 0;
  L.flames = []; L.lamps = []; L.farFlames = []; L.foreFlames = []; L.foreLamps = [];
  L.beams = [];
  L.props = [[60, 172, 's'], [230, 183, 'b'], [410, 176, 's'], [610, 187, 's'], [790, 209, 'b']];
  return L;
}
function floorBrood(F, cam) {
  BASE_FN.floor(F, cam);
  for (let y = FLOOR_Y; y < H; y++) {
    const sp = spdAt(y + 0.5), rowF = 9 / sp;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, wx = cam + (x + 0.5 - CX) / sp, n = fbm(wx / 30, rowF * 0.9, 711);
      if (n < 0.44) continue;
      const pool = n > 0.6;
      F.M[i] = pool ? M_MOSS : (n > 0.5 ? M_MOSS : M_DUSK);
      F.V[i] = pool ? 0.12 + (hash(Math.floor(wx / 2), y, 712) > 0.94 ? 0.6 : 0) + 0.18 * Math.max(0, Math.sin(wx * 0.4 + rowF)) ** 6 : resinV(Math.round(wx), y, 713) * lerp(0.6, 1, (y - FLOOR_Y) / (H - FLOOR_Y));
    }
  }
}
function mistBrood(F, cam, t) {
  for (let y = 150; y < H; y++) {
    const sp = spdAt(y + 0.5), base = clamp((y - 150) / 46);
    for (let x = 0; x < W; x++) {
      const wx = cam + (x - CX) / sp + t * 3, d = vnoise(wx / 30, y / 6 + t * 0.05, 93) * 0.65 + vnoise(wx / 11, y / 3, 94) * 0.35, a = clamp((d - 0.38) * 2.2) * (0.3 + 0.6 * base);
      if (a <= 0.02) continue;
      const i = y * W + x; F.V[i] = lerp(F.V[i], 0.42, a * 0.55); F.X[i] += a * 0.15;
      if (a > 0.28 && !F.T[i]) F.M[i] = mixMat(x, y, M_MOSS, M_STONE, 0.4);
    }
  }
}
// the Brood's curio: a cocoon lying on the floor, a hand pressed against the membrane from inside
function floorCocoon(cx, fy, t) {
  for (let y = fy - 18; y <= fy; y++) for (let x = cx - 22; x <= cx + 22; x++) {
    const u = (x + 0.5 - cx) / 22, q = (y - fy + 18) / 18, prof = Math.sqrt(Math.max(0, 1 - u * u)) * 18;
    if (fy - y > prof * 0.95) continue;
    const rib = Math.sin(x * 0.8 + y * 0.2) > 0.75;
    let v = 0.22 + 0.4 * clamp(1 - (fy - y) / (prof + 1)) * 0.6 + (rib ? 0.16 : 0) + (u < 0 ? 0.08 : 0), m = M_MOSS, e = 0;
    if (Math.abs(u) < 0.6 && fy - y < prof * 0.7 && fy - y > 3) { v = 0.42 + 0.28 * Math.sin(t * 2) * 0.3; e = 1; }
    put(x, y, v, m, e);
  }
  const hx = cx - 6, hy = fy - 9; for (const [dx, dy] of [[0, 0], [1, -3], [3, -4], [5, -3], [6, -1], [2, 1], [4, 1]]) { put(hx + dx, hy + dy, 0.08, M_DUSK); put(hx + dx, hy + dy + 1, 0.1, M_DUSK); }
  rect(hx + 1, hy - 1, 5, 4, 0.08, M_DUSK);
}
function broodLightsInto(lights, t) {
  const mm = ((Math.round(DG.cam * 0.7) % MID_P) + MID_P) % MID_P;
  BROOD_LIGHTS.forEach(([lx, ly, r, i], n) => { for (const b of [lx - mm, lx - mm + MID_P]) if (b > -r && b < W + r) lights.push({ x: b, y: ly, r, i: i * (0.8 + 0.2 * Math.sin(t * 1.6 + n * 1.3)), c: [0.6, 1.25, 1.05] }); });
}
// drones crawling over the vault and the walls (anchored to the wall plane)
const DRONES = Array.from({ length: 6 }, (_, k) => ({ x0: hash(k, 1, 721) * MID_P, y0: 20 + hash(k, 2, 721) * 90, sp: 0.3 + hash(k, 3, 721) * 0.6, ph: hash(k, 4, 721) * 6.28, r: 10 + hash(k, 5, 721) * 22 }));
function dronesOnWalls(t) {
  const mm = ((Math.round(DG.cam * 0.7) % MID_P) + MID_P) % MID_P;
  DRONES.forEach((d, n) => {
    const a = t * d.sp + d.ph, x = d.x0 + Math.cos(a) * d.r, y = d.y0 + Math.sin(a * 1.3) * d.r * 0.5, dxa = -Math.sin(a) * d.r, dya = Math.cos(a * 1.3) * 1.3 * d.r * 0.5;
    for (const b of [x - mm, x - mm + MID_P]) if (b > -10 && b < W + 10) { TAG = 30 + n; drone(b, y, t, n, Math.atan2(dya, dxa), 0.9); TAG = 0; }
  });
}

// ---------------------------------------------------------------- Ravenhold, AoJ: rain, wet streets, the iron gate, the halo
// The approved 16-bit town, plus: it rains, the streets shine with puddles and lantern reflections, the portal is
// framed by two pairs of colossal iron ribs rising out of the court (the town sits in the angel's chest, a crimson
// heart-light where they meet), and the fountain's statue is a broken iron halo standing in the basin.
const STREETS = () => [...TW.ew.map(([y, h]) => [0, y, W, h]), ...TW.ns.map(([x, w]) => [x, 10, w, H]), [TW.ave[0], 131, TW.ave[1], H], TW.plaza, TW.court];
function ravenholdIron(L) {
  bind(L); MAT = M_STONE; EMI = 0; TAG = 0; CLIP = null;
  // puddles on the streets: dark mirrors with a pale rim on their far edge
  const SR = STREETS();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!SR.some(([rx, ry, rw, rh]) => x >= rx && x < rx + rw && y >= ry && y < ry + rh)) continue;
    const i = y * W + x; if (L.BT && L.BT[i]) continue;
    const n = vnoise(x / 9, y / 4, 811) * 0.7 + vnoise(x / 3, y / 2, 812) * 0.3; if (n < 0.6) continue;
    const up = vnoise(x / 9, (y - 1) / 4, 811) * 0.7 + vnoise(x / 3, (y - 1) / 2, 812) * 0.3;
    L.V[i] = up < 0.6 ? 0.62 : 0.2 + 0.08 * vnoise(x / 5, y, 813); L.M[i] = M_STONE; L.E[i] = 0; L.DX[i] = 0;
  }
  // the iron ribs: two pairs rising out of the court, arching in over the portal
  DXV = 6;
  const rib = (side, x0, y0, x1, y1, bend, w) => {
    const n = 160; let prev = null;
    for (let s = 0; s <= n; s++) {
      const q = s / n, x = x0 + (x1 - x0) * q ** 2.2, y = y0 + (y1 - y0) * Math.sin(q * Math.PI / 2) - bend * Math.sin(q * Math.PI) * 0;
      if (prev) { const dx = x - prev[0], dy = y - prev[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        for (let o = -w / 2; o <= w / 2; o += 0.5) {
          const u = (o + w / 2) / w, lu = side < 0 ? u : 1 - u;   // lu: 0 at the lit (outer) edge
          let v = lu < 0.14 ? 0.62 : lu < 0.3 ? 0.34 : lu > 0.86 ? 0.04 : 0.16 + 0.06 * Math.sin(lu * Math.PI);
          if (s % 9 === 0 && lu > 0.3 && lu < 0.75) v = 0.78;
          if (s % 9 === 1 && lu > 0.3 && lu < 0.75) v = 0.06;
          put(Math.round(x + nx * o), Math.round(y + ny * o), v, M_STONE, 0);
        } }
      prev = [x, y];
    }
  };
  rib(-1, 133, 58, 165, 3, 6, 5); rib(1, 201, 58, 169, 3, 6, 5);
  rib(-1, 121, 66, 165, -4, 12, 8); rib(1, 213, 66, 169, -4, 12, 8);
  for (const [x, y] of [[124, 64], [210, 64], [133, 58], [201, 58]]) { ellipse(x + 0.5, y + 1.5, 4, 2, 0.08, M_STONE, 0); }
  ellipse(167.5, 2.5, 4, 3.5, 0.2, M_STONE, 0); eyeLight(167, 2, 0, 1, true);
  // the fountain's statue: a broken iron halo standing in the basin
  const [fx, fy] = TW.fountain;
  for (let y = fy - 22; y <= fy - 8; y++) for (let x = fx - 10; x <= fx + 10; x++) { const i = y * W + x; if (L.M[i] === M_STONE && L.V[i] < 0.75 && Math.abs(x - fx) > 1) { /* keep the basin */ } }
  for (let k = 0; k < 90; k++) {
    const an = (k / 90) * Math.PI * 2 - Math.PI; let d = an + Math.PI / 4; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 0.38) continue;
    const lit = 0.55 + 0.4 * Math.cos(an + 2.4);
    for (const [r, f] of [[11, 1], [10, 0.7], [9, 0.4]]) put(Math.round(fx + Math.cos(an) * r * 0.9), Math.round(fy - 19 + Math.sin(an) * r), lit * f, M_STONE, 0);
  }
  rect(fx - 1, fy - 9, 3, 9, (x) => (x === fx - 1 ? 0.7 : 0.4), M_STONE, 0);
  eyeLight(Math.round(fx + Math.cos(-Math.PI / 4) * 9), Math.round(fy - 19 + Math.sin(-Math.PI / 4) * 10), 0, 2, true);
  DXV = 0;
}
function townRain(F, t, lights) {
  // lantern and brazier reflections on the wet stones: shimmering streaks below each light
  const refl = (lx, ly, len, v) => { for (let j = 2; j < len; j++) { const y = ly + j, x = lx + Math.round(Math.sin(t * 3 + j * 0.9 + lx) * 0.7), i = y * W + x; if (y >= H || F.T[i]) continue; if (BAYER8[((y & 7) << 3) | (x & 7)] < (1 - j / len) * 0.8) put(x, y, v - j * 0.03, M_UMBER, 1); } };
  for (const [lx, ly] of LANTERNS) refl(lx, ly - 6, 13, 0.82);
  for (const [bx, by] of [[121, 84], [212, 84], [121, 125], [212, 125]]) { refl(bx, by + 1, 11, 0.86); refl(bx - 1, by + 1, 8, 0.7); refl(bx + 1, by + 1, 8, 0.7); }
  // the heart-light where the ribs meet
  lights.push({ x: 167, y: 4, r: 30, i: 0.5 + 0.2 * Math.sin(t * 2.2), c: [1.7, 0.45, 0.55] });
  // rain: slanted streaks over everything, splashes on the ground
  for (let k = 0; k < 340; k++) {
    const sp = 150 + hash(k, 2, 801) * 90, y0 = ((t * sp + hash(k, 3, 801) * 900) % (H + 24)) - 12, x0 = hash(k, 1, 801) * (W + 60) - 30 + y0 * 0.22, len = 3 + (k % 3);
    for (let s = 0; s < len; s++) { const x = Math.round(x0 + s * 0.22), y = Math.round(y0 + s); if (x < 0 || y < 0 || x >= W || y >= H) continue; const i = y * W + x; F.V[i] = Math.max(F.V[i] * 0.6, 0.5 + 0.2 * (s / len)); F.M[i] = M_STONE; F.E[i] = 1; }
  }
  for (let k = 0; k < 70; k++) {
    const ph = (t * 5 + hash(k, 4, 802) * 7), cyc = Math.floor(ph), f = ph - cyc; if (f > 0.35) continue;
    const x = Math.floor(hash(k, cyc, 803) * W), y = Math.floor(hash(k, cyc, 804) * H), r = f < 0.15 ? 0 : 1;
    if (y >= H - 1 || F.T[y * W + x]) continue;
    put(x, y, 0.8, M_STONE, 1); if (r) { put(x - 1, y - 1, 0.6, M_STONE, 1); put(x + 1, y - 1, 0.6, M_STONE, 1); }
  }
}
function aojTown(ctx, t) {
  if (!AOJ.townL) { const orig = TOWN_LAYER || buildTownLayer(); const L = buildTownLayer(); ravenholdIron(L); AOJ.townL = L; TOWN_LAYER = orig; AOJ.townOrig = orig; }
  const saveL = TOWN_LAYER, saveA = TOWN_AMB; TOWN_LAYER = AOJ.townL; TOWN_AMB = [0.56, 0.6, 0.84];
  setRes(BA_W, GS_H); CX = 167;
  const L = TOWN_LAYER, F = buf('ba', BA_W, GS_H); bind(F); CLIP = null;
  F.V.set(L.V); F.M.set(L.M); F.E.set(L.E); F.A.set(L.A); F.T.fill(0); F.DX.fill(0); F.I.set(L.I); F.G.fill(1); F.X.fill(0); F.LM = L.LM;
  MAT = M_STONE; EMI = 0; TAG = 0;
  const lights = [];
  townLife(F, t, lights, {});
  townRain(F, t, lights);
  for (const id of Object.keys(MARK_AT)) markSign(id, false);
  { const w = measure('Dungeon Portal', 'tiny') + 6, x = Math.round(167 - w / 2); shadowU(x, 0, w, 8, { k: 0.5, r: 2, dx: 1, dy: 2 }); rectI(x, 0, w, 8, P.void); rectI(x + 1, 0, w - 2, 7, P.u2); rectI(x + 1, 0, w - 2, 1, P.u3); text('Dungeon Portal', x + 3, 1, 'tiny', P.u6); }
  for (const sp of SPOTS) nameSign(sp, false);
  smokeU(0, 0, 92, 18, 0.62);
  text('Ravenhold · town', 4, 4, 'tiny', P.u6, { shadow: P.void });
  const ds = VIEW.strength; VIEW.strength = TOWN_DITHER;
  composeInto(ctx, F, { lights, ambient: TOWN_AMB, tint: 0.26, vig: 0 }, 0);
  VIEW.strength = ds; TOWN_LAYER = saveL; TOWN_AMB = saveA;
}

// ---------------------------------------------------------------- the boot screen: Age of Judgment launching on the PC
// Rain over Ravenhold at night. Behind the town, the fallen angel: its ribs rise out of the hills and arch over the
// rooftops; its broken halo stands in the sky with the spark in its gap. Lightning now and then shows the whole of it.
// The title sits on a riveted iron plaque; under it, the realm connecting.
function screenBoot(t, o = {}) {
  const c = aojCanvas(GS_W, GS_H), ctx = c.getContext('2d');
  setRes(GS_W, GS_H); const F = buf('boot', GS_W, GS_H); clearFrame(F); bind(F); CLIP = null; MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0;
  const flashQ = t % 7.3, flash = o.flash ?? (flashQ > 5.6 && flashQ < 5.95 ? (flashQ < 5.66 || (flashQ > 5.75 && flashQ < 5.82) ? 1 : 0.45) : 0);
  const HZ = 176;
  // sky: a cold gradient, low clouds, the moon behind them
  rect(0, 0, W, HZ, (x, y) => { const g = 0.1 + 0.22 * (y / HZ) ** 1.4, cl = fbm(x / 60 + t * 0.01, y / 18, 901) - 0.5; return g + 0.1 * Math.max(0, cl) + flash * 0.25; }, M_STONE, 1);
  ellipse(86, 46, 13, 13, (x, y) => (Math.hypot(x - 82, y - 42) < 11 ? 0.92 : 0.78), M_STONE, 1);
  for (let y = 30; y < 60; y++) for (let x = 60; x < 120; x++) { const cl = fbm(x / 26 + t * 0.02, y / 7, 902); if (cl > 0.55) put(x, y, 0.3 + 0.2 * (cl - 0.55) + flash * 0.2, M_STONE, 1); }
  // the angel's ribs: rising out of the hills, arching over the town toward the right, cut by the frame
  const TIPS = [];
  for (let k = 0; k < 7; k++) {
    const x0 = 40 + k * 52, base = HZ + 4, top = 6 + Math.abs(k - 3) * 8, reach = 70 + k * 6, w = 11 - Math.abs(k - 3);
    TIPS.push([x0 + reach, top]);
    let prev = null;
    for (let s = 0; s <= 200; s++) {
      const q = s / 200, x = x0 + reach * q ** 2.4, y = base - (base - top) * Math.sin(q * Math.PI / 2);
      if (prev) { const dx = x - prev[0], dy = y - prev[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        for (let o = -w / 2; o <= w / 2; o += 0.5) { const u = (o + w / 2) / w; let v = u < 0.16 ? 0.22 : 0.035; if (u < 0.08) v = 0.34; if (s % 14 === 0 && u > 0.3 && u < 0.6) v = 0.18; put(Math.round(x + nx * o), Math.round(y + ny * o), v + flash * (u < 0.3 ? 0.45 : 0.18), M_STONE, 1); } }
      prev = [x, y];
    }
    if (k === 2 || k === 5) eyeLight(Math.round(x0 + 4), Math.round(top + (base - top) * 0.55), t, k);
  }
  // the spine the ribs hang from: vertebrae along the top, running out of the frame
  for (let k = 0; k < TIPS.length - 1; k++) {
    const [ax, ay] = TIPS[k], [bx, by] = TIPS[k + 1];
    for (let s2 = 0; s2 <= 40; s2++) { const q = s2 / 40, x = lerp(ax, bx, q), y = lerp(ay, by, q) - 6; for (let o = -6; o <= 6; o++) { const v = Math.abs(o) > 4 ? 0.04 : o < -2 ? 0.28 : 0.06; put(Math.round(x), Math.round(y + o), v + flash * 0.3, M_STONE, 1); } if (s2 % 10 === 0) for (let o = -9; o <= -6; o++) put(Math.round(x), Math.round(y + o), 0.2 + flash * 0.3, M_STONE, 1); }
  }
  // the broken halo standing in the sky over the ribs: riveted, the spark in its gap (the logo carries it when shown)
  const HX = 237, HY = 104, HR = 58;
  if (o.halo !== false) {
  for (let k = 0; k < 900; k++) {
    const an = (k / 900) * Math.PI * 2 - Math.PI; let d = an + Math.PI / 4; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 0.2) continue;
    const ragged = Math.abs(d) < 0.32 ? Math.round(3 * hash(k, 0, 903)) : 0;
    for (let w = ragged; w < 11; w++) { const r = HR - w, x = Math.round(HX + Math.cos(an) * r), y = Math.round(HY + Math.sin(an) * r); if (y >= HZ + 10) continue; const lit = 0.5 + 0.5 * Math.cos(an + 2.4); put(x, y, w === 0 ? 0.62 + 0.36 * lit : w === 1 ? 0.36 + 0.2 * lit : w >= 9 ? (w === 9 ? 0.4 * lit + 0.1 : 0.04) : (k % 30 < 3 && w > 2 && w < 8 ? 0.6 : 0.1 + 0.12 * lit) + flash * 0.3, M_UMBER, 1); }
  }
  { const sx = Math.round(HX + Math.cos(-Math.PI / 4) * (HR - 4)), sy = Math.round(HY + Math.sin(-Math.PI / 4) * (HR - 4)); ellipse(sx + 0.5, sy + 0.5, 6, 6, (x, y) => 0.45 + 0.55 * (1 - Math.hypot(x - sx, y - sy) / 6), M_DANGER, 1); put(sx, sy, 1, M_STONE, 1); AOJ.spark = [sx, sy]; }
  }
  // hills
  rect(0, HZ - 10, W, 40, (x, y) => (y > HZ - 6 + 6 * Math.sin(x / 40) + 4 * fbm(x / 20, 1, 904) ? 0.06 + flash * 0.1 : -1), M_STONE, 1);
  for (let i = 0; i < W * H; i++) if (F.V[i] < 0) { F.A[i] = 0; F.V[i] = 0; }
  // Ravenhold's skyline in the ribs: roofs, spires, the cathedral, lit windows
  const sky = (x) => { let h = 150 + 8 * Math.sin(x / 13) + 10 * hash(x >> 3, 0, 905); if (Math.abs(x - 236) < 6) h = 92 + Math.abs(x - 236) * 6; if (Math.abs(x - 236) < 20) h = Math.min(h, 124); if (Math.abs(x - 150) < 3) h = 112 + Math.abs(x - 150) * 6; if (Math.abs(x - 330) < 3) h = 118 + Math.abs(x - 330) * 7; if ((x >> 4) % 3 === 0 && (x & 15) > 10) h -= 6; return h; };
  for (let x = 0; x < W; x++) { const h = Math.round(sky(x)); for (let y = h; y < HZ + 6; y++) put(x, y, (y === h ? 0.18 : 0.045) + flash * 0.12, y > HZ - 4 ? M_STONE : M_DUSK, 1); }
  for (let k = 0; k < 120; k++) { const x = Math.floor(hash(k, 1, 906) * W), y = Math.round(sky(x)) + 4 + Math.floor(hash(k, 2, 906) * 20); if (y < HZ && hash(k, Math.floor(t * 0.3), 907) > 0.12) { put(x, y, 0.8 + 0.2 * hash(k, 3, 906), M_UMBER, 1); if (k % 3 === 0) put(x + 1, y, 0.7, M_UMBER, 1); } }
  for (let y = 98; y < 124; y += 7) { put(234, y, 0.9, M_UMBER, 1); put(238, y + 3, 0.85, M_UMBER, 1); }
  // the foreground: a rocky ledge and a lone knight looking at the town, his cloak in the wind
  rect(0, HZ + 6, W, H - HZ - 6, (x, y) => 0.03 + 0.03 * fbm(x / 12, y / 8, 908) + flash * 0.06, M_STONE, 1);
  poly([[0, 196], [60, 184], [96, 188], [120, 200], [120, 232], [0, 232]], (x, y) => 0.06 + (y < 190 + (x - 60) * 0.1 ? 0.06 : 0) + flash * 0.12, M_STONE, 1);
  { const kx = 74, ky = 186, fl = Math.sin(t * 3) * 2;
    poly([[kx - 3, ky - 22], [kx + 4, ky - 22], [kx + 6, ky], [kx - 5, ky]], (x) => (x >= kx + 4 ? 0.3 : 0.04) + flash * 0.2, M_STONE, 1);
    poly([[kx + 3, ky - 20], [kx + 14 + fl, ky - 14], [kx + 18 + fl, ky - 4], [kx + 6, ky - 2]], 0.05 + flash * 0.2, M_DUSK, 1);
    ellipse(kx, ky - 25, 3, 3.5, 0.05 + flash * 0.25, M_STONE, 1); line(kx - 4, ky - 24, kx - 2, ky - 30, 0.06, M_STONE, 1);
    line(kx - 6, ky - 18, kx - 6, ky + 2, 0.3 + flash * 0.4, M_STONE, 1); line(kx - 8, ky - 14, kx - 4, ky - 14, 0.3, M_STONE, 1); }
  // lightning
  if (flash) { let x = 400, y = 0; for (let s = 0; s < 40 && y < 150; s++) { const nx = x + Math.round((hash(s, Math.floor(t / 7.3), 909) - 0.55) * 10), ny = y + 4 + Math.floor(hash(s, 1, 909) * 4); line(x, y, nx, ny, 1, M_STONE, 1); x = nx; y = ny; } }
  // rain over everything
  for (let k = 0; k < 520; k++) {
    const sp = 170 + hash(k, 2, 910) * 110, y0 = ((t * sp + hash(k, 3, 910) * 900) % (H + 30)) - 15, x0 = hash(k, 1, 910) * (W + 80) - 40 + y0 * 0.3, len = 4 + (k % 4);
    for (let s = 0; s < len; s++) { const x = Math.round(x0 + s * 0.3), y = Math.round(y0 + s); if (x < 0 || y < 0 || x >= W || y >= H) continue; const i = y * W + x; F.V[i] = Math.max(F.V[i], 0.32 + 0.22 * (s / len)); F.M[i] = M_STONE; F.E[i] = 1; F.A[i] = 1; }
  }
  // ---- UI: the title on an iron plaque, the realm connecting
  if (o.vis != null) F.G.fill(o.vis);
  const PW = 176, PX = Math.round((W - PW) / 2), PY = 10 + (o.plaqueDy || 0), PH = 34;
  if (o.plaque !== false) {
  shadowU(PX, PY, PW, PH, { k: 0.7, r: 4, dx: 3, dy: 4 });
  plateU(PX, PY, PW, PH, { mat: M_STONE, v: 0.34 });
  frameI(PX, PY, PW, PH, P.void); frameI(PX + 2, PY + 2, PW - 4, PH - 4, P.s1);
  for (const [rx, ry] of [[PX + 5, PY + 5], [PX + PW - 6, PY + 5], [PX + 5, PY + PH - 6], [PX + PW - 6, PY + PH - 6]]) { putI(rx, ry, P.s6); putI(rx + 1, ry + 1, P.void); }
  text('AGE OF', W / 2, PY + 6, 'tiny', P.s5, { align: 'c', ls: 2, shadow: P.void });
  text('Judgment', W / 2, PY + 15, 'black', P.moon, { align: 'c', ls: 1, outline: P.void });
  }
  if (o.bar !== false) {
  // connecting
  const prog = clamp(((t % 9) / 7.5)), steps = ['Checking files', 'Patching 2 of 3', 'Connecting to realm Ravenhold', 'Connecting to realm Ravenhold'], st = steps[Math.min(3, Math.floor(prog * 4))];
  const BW2 = 220, BX = Math.round((W - BW2) / 2), BY = 212;
  smokeU(W / 2, BY + 2, 140, 18, 0.7);
  text(st + (Math.floor(t * 3) % 4 === 0 ? '' : '.'.repeat(Math.floor(t * 3) % 4)), BX, BY - 9, 'tiny', P.u6, { shadow: P.void });
  text(Math.round(prog * 100) + '%', BX + BW2, BY - 9, 'tiny', P.u5, { align: 'r', shadow: P.void });
  groove(BX, BY, BW2, 6, prog, M_STONE, [0.78, 0.55]);
  text('v 2.4.1 · Patch notes', W - 4, H - 8, 'tiny', P.s4, { align: 'r', shadow: P.void });
  text('Realm: Ravenhold · PvE', 4, H - 8, 'tiny', P.s4, { shadow: P.void });
  }
  if (o.ui) o.ui(F, t);
  const lights = [{ x: AOJ.spark[0], y: AOJ.spark[1], r: 70, i: (o.sparkI ?? 1) * (0.9 + 0.2 * Math.sin(t * 3)), c: [1.7, 0.45, 0.55] }, { x: 236, y: 150, r: 120, i: 0.4, c: WARM }, ...(o.lights || [])];
  const img = ctx.createImageData(W, H); compose(F, img, lights, [0.5, 0.52, 0.7], 0.22, 0); ctx.putImageData(img, 0, 0);
  return c;
}

// ===========================================================================
// THE LAUNCH (night one, 20:00): not interactive, it sets the mood. On the monitor: Windows 98, the icon
// double-clicked; the display mode switches and the engine boots; the publisher's logo; the developer's logo; the
// Age of Judgment title; the login screen, account and password typed in, Log in pressed; logging in; the world
// loading; then Ravenhold. Meanwhile, on the phone in your hand, the boys' first chat comes in a bubble at a time,
// paced to the launch, and Let's go lights only when the game has loaded.
// ===========================================================================
const LAUNCH = [['desktop', 0, 3.2], ['engine', 3.2, 6.2], ['publisher', 6.2, 10.6], ['developer', 10.6, 15], ['title', 15, 23], ['login', 23, 31], ['enter', 31, 38], ['game', 38, 1e9]];
const LAUNCH_END = 38;
const launchPhase = (T) => { for (const [k, a, b] of LAUNCH) if (T >= a && T < b) return [k, T - a, b - a]; return ['game', T - LAUNCH_END, 1e9]; };
// the boys' first chat (data/voice.ts FIRST_CHAT), each bubble's arrival in launch seconds; typing dots before each
const FIRST_CHAT_AT = [['Billy', "yo. realm's up", 2.6], ['Billy', 'patch notes are forty pages, i read zero', 10.2], ['Lance', 'would you like to know more?', 21.4], ['Billy', '11 sharp. and careful with her tonight, they mostly come at night', 26.4], ['Mike', 'steps in the hall = tab to excel. BEFORE the door opens', 35.4]];
const TYPING_SEC = 1.6;
// THE LAUNCH'S SOUND (aoj-world §7b): the cue sheet in launch seconds, fired once as T passes each time; one music cue
// from 6.2 s to the town; the rain under the title, the login and the loading. Times follow the code above exactly.
// [T, cue, what]. 'pc': the real PC (clean); every other cue is the game's own and goes through the PS1 chain.
const LAUNCH_SOUND = [
  // Windows 98
  [1.25, 'mouse', 'pc: the double-click, first'], [1.45, 'mouse', 'pc: the double-click, second'],
  [1.6, 'hdd', 'pc: the hard drive chatters while the hourglass turns (1.2 s)'],
  [2.85, 'crt', 'pc: the display mode switches: a relay clunk, the whine cut, the line collapses'],
  // the engine
  [3.25, 'cdspin', 'pc: the CD drive spins up under the start-up lines (2.6 s, quiet)'],
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => [3.45 + n * 0.34, 'bootline', 'the engine: a soft tick per start-up line']),
  // Halsky Labs (publisher), u = T - 6.2
  [6.35, 'hl_point', 'a point of light: a high glass ting, a long tail'],
  [6.62, 'hl_trace', 'the rim draws itself round both ways: a rising bowed shimmer, one voice per side (0.68 s)'],
  [7.3, 'hl_seal', 'the rim closes at the bottom: a soft low click-thump'],
  [7.35, 'hl_develop', 'the face develops: grain crackling thicker over a low swell (0.8 s), into'],
  [8.15, 'hl_land', 'the face lands with the shockwave: a deep warm boom, a long tail (the sting\'s one big beat)'],
  [8.25, 'hl_slide', 'the mark slides left, HALSKY comes out: a soft whoosh'],
  ...[0, 1, 2, 3].map((k) => [8.55 + k * 0.07, 'hl_labs', 'L A B S: a tiny bright pip per letter, rising']),
  [9.93, 'hl_out', 'the word slides back, the face fades: a reversed swell drawing in (0.42 s)'],
  [10.35, 'hl_blink', 'the point blinks out: a tiny high blip'],
  // Procrastination Studios (developer), u = T - 10.6
  [10.8, 'ps_wait', 'the spinner: a quick soft ticking (0.72 s)'],
  [11.52, 'ps_pop', 'the badge pops in, in a hurry: a bouncy pop that overshoots and settles'],
  [11.75, 'ps_move', 'it moves into place: a short whoosh'],
  [12.0, 'ps_letters', 'Procrastination drops in a letter at a time: a run of 14 soft wooden taps (0.6 s)'],
  [13.02, 'ps_late', 'the last n is late: it hurries in from the right, skids, bumps into place'],
  [13.45, 'ps_type', '"est. eventually" types itself: 15 soft ticks (0.7 s)'],
  [13.9, 'ps_flip', 'the hourglass is turned over: a wooden creak, the sand starts to hiss'],
  // the title, u = T - 15
  [15.9, 'thunder_near', 'the first bolt shows the angel: a crack on the flash, a roll for 3 s'],
  [17.2, 'aoj_ring', 'the halo forged round from its gap: iron dragged round under strain, rising, a forge\'s hiss (1 s); it closes at 18.2 and rings out like a cracked bell (2.5 s)'],
  [18.15, 'aoj_spark', 'the spark ignites: an electric crackle, a burst, a thin high crimson tone (1.2 s)'],
  [18.4, 'aoj_word', 'JUDGMENT struck out from the centre, white-hot: a furnace roar widening with the word, a reversed cymbal rising into the strike (0.75 s)'],
  [19.15, 'aoj_strike', 'the second bolt as it lands, the shake: the loudest moment of the launch. A thunder crack on the frame, a massive iron impact (anvil and slam, pitched low), a sub drop, a long tail. The theme\'s downbeat'],
  [19.2, 'aoj_quench', 'white-hot cooling: hot iron hissing (0.6 s), under the strike\'s tail'],
  [19.55, 'aoj_ageof', 'AGE OF and its two gilt rules running out: a low gong for the letters, two metal slides left and right, a bright tink each at 20.25'],
  [20.3, 'aoj_glint', 'the glint runs across the gilt: a quiet shimmer sweeping left to right (0.9 s)'],
  [22.0, 'aoj_glint', 'the second glint'],
  // the login, u = T - 23
  [23.45, 'ui_panel', 'the iron panel slides up: stone and iron, a soft stop at 23.9'],
  [23.95, 'mouse', 'pc: a click in Account'],
  ...[1, 2, 3, 4, 5].map((k) => [23 + 1.1 + k * 0.18, 'key', 'pc: "dutch" typed (the desk\'s keyboard cue)']),
  [25.7, 'mouse', 'pc: a click in Password'],
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => [23 + 2.75 + k * 1.15 / 9, 'key', 'pc: nine stars typed']),
  [28.0, 'mouse', 'pc: Log in clicked'], [28.0, 'ui_login', 'Log in pressed: a heavy iron button, a low bell tap'],
  [28.3, 'thunder_far', 'the scene\'s lightning (27.5): far thunder, a rumble with no crack'],
  // logging in, u = T - 31
  [32.7, 'ui_verified', 'Account verified: a solemn two-note bell, soft'],
  [35.8, 'thunder_far', 'the scene\'s lightning (34.8): far thunder'],
];
// loops: [cue, from, to, fade in, fade out]
const LAUNCH_LOOPS = [['rain', 15.0, 37.2, 0.8, 0.8]];
// the music: one through-composed cue from 6.2 s; its sections, for the timeline and the brief (aoj-world §7b)
const LAUNCH_MUSIC = { cue: 'aoj_theme', at: 6.2, end: 39.6, parts: [[6.2, 15.0, 'the deep'], [15.0, 16.4, 'rain'], [16.4, 19.15, 'the rise'], [19.15, 37.15, 'the theme'], [37.15, 39.6, 'last chord']] };

function launchBuf() { setRes(GS_W, GS_H); const F = buf('launch', GS_W, GS_H); clearFrame(F); bind(F); CLIP = null; MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0; return F; }
function launchOut(F, lights = [], amb = [0.5, 0.5, 0.6], dither = true) {
  const c = aojCanvas(GS_W, GS_H), ctx = c.getContext('2d'), ds = VIEW.strength; if (!dither) VIEW.strength = 0.02;
  const img = ctx.createImageData(W, H); compose(F, img, lights, amb, 0.2, 0); ctx.putImageData(img, 0, 0); VIEW.strength = ds; return c;
}
const fadeIdx = (a, ramp) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(a * (ramp.length - 1))))];
const fadeAt = (u, len, inT = 0.8, outT = 0.7) => clamp(Math.min(u / inT, (len - u) / outT));
// a palette-exact dithered fade to black over an already drawn canvas (no off-palette blends)
function ditherBlack(c, a) {
  if (a <= 0) return; const g = c.getContext('2d'), img = g.getImageData(0, 0, c.width, c.height), D = img.data, v = PAL_RGB[P.void];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (BAYER8[((y & 7) << 3) | (x & 7)] < a) { const o = (y * c.width + x) * 4; D[o] = v[0]; D[o + 1] = v[1]; D[o + 2] = v[2]; }
  g.putImageData(img, 0, 0);
}
// the Windows 98 pointer and hourglass, palette-exact
const PTR = ['X.........', 'XX........', 'XoX.......', 'XooX......', 'XoooX.....', 'XooooX....', 'XoooooX...', 'XooooooX..', 'XoooooooX.', 'XooooXXXXX', 'XoXooX....', 'XX.XooX...', 'X..XooX...', '....XooX..', '....XooX..', '.....XX...'];
const HOURGLASS = ['XXXXXXXXX', 'XoooooooX', '.XoooooX.', '.XooyooX.', '..XoyoX..', '...XyX...', '...XoX...', '..XoooX..', '.XooyooX.', '.XoyyyoX.', 'XoyyyyyoX', 'XXXXXXXXX'];
function pointer(x, y, kind = 'arrow') { spr(Math.round(x), Math.round(y), kind === 'wait' ? HOURGLASS : PTR, { X: P.void, o: P.moon, y: P.gold }); }

// ---- 1. Windows 98: the desktop, the Age of Judgment icon double-clicked, the hourglass, then black
function launchDesktop(u) {
  const F = launchBuf();
  rectI(0, 0, W, H, P.g3);
  const icons = [['Age of Judgment', 'aoj'], ['My Computer', 'pc'], ['Recycle Bin', 'bin'], ['Q3_report.xls', 'xls']];
  const sel = u > 1.25;
  icons.forEach(([lab, k], n) => {
    const x = 22, y = 10 + n * 40, on = sel && k === 'aoj';
    if (k === 'pc') { rectI(x + 3, y, 16, 12, P.u5); rectI(x + 5, y + 2, 12, 8, on ? P.s2 : P.s3); rectI(x + 6, y + 3, 4, 2, P.s5); rectI(x + 7, y + 13, 8, 2, P.u4); rectI(x + 2, y + 15, 18, 3, P.u5); }
    if (k === 'bin') { for (let j = 0; j < 15; j++) { const w = 12 - Math.floor(j / 5); rectI(x + 11 - w / 2 | 0, y + 2 + j, w, 1, j % 3 === 0 ? P.s3 : P.s5); } rectI(x + 3, y + 1, 16, 2, P.s4); }
    if (k === 'aoj') { rectI(x + 2, y, 18, 18, P.void); for (let a = 0; a < 40; a++) { const an = a / 40 * 6.283 - Math.PI; let d = an + Math.PI / 4; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 0.5) continue; putI(Math.round(x + 11 + Math.cos(an) * 6), Math.round(y + 9 + Math.sin(an) * 6), Math.cos(an + 2.4) > 0 ? P.u6 : P.u4); } putI(x + 15, y + 5, P.crimson); }
    if (k === 'xls') { rectI(x + 5, y, 12, 17, P.moon); rectI(x + 5, y, 12, 3, P.g4); for (let j = 5; j < 16; j += 3) rectI(x + 6, y + j, 10, 1, P.g5); rectI(x + 2, y + 9, 7, 7, P.g4); text('x', x + 4, y + 10, 'tiny', P.moon); }
    const tw = measure(lab, 'tiny'), lx = x + 11 - Math.floor(tw / 2);
    if (on) { rectI(lx - 2, y + 21, tw + 4, 9, P.s2); frameI(lx - 2, y + 21, tw + 4, 9, P.moon); }
    text(lab, x + 11, y + 23, 'tiny', P.moon, { align: 'c', shadow: on ? null : P.void });
  });
  // the pointer: in from the right, onto the icon, two clicks, then the hourglass while it starts
  const k = clamp(u / 1.1), ease = 1 - (1 - k) ** 3, px0 = 300, py0 = 150, px1 = 33, py1 = 17;
  const px = lerp(px0, px1, ease), py = lerp(py0, py1, ease), clickA = u > 1.25 && u < 1.33, clickB = u > 1.45 && u < 1.53;
  if (clickA || clickB) for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) putI(px1 + dx, py1 + dy, P.moon);
  pointer(px, py, u > 1.6 ? 'wait' : 'arrow');
  const c = launchOut(F, [], [1, 1, 1], false);
  // the display mode switching: black, a line collapsing
  if (u > 2.85) { const g = c.getContext('2d'); g.fillStyle = PAL[P.void]; g.fillRect(0, 0, W, H); if (u < 3.0) { g.fillStyle = PAL[P.moon]; g.fillRect(0, H / 2 - 1, W, 2); } }
  return c;
}
// ---- 2. the engine booting: black, lines of text a little at a time
const ENGINE_LINES = [['AGE OF JUDGMENT  v2.4.1', ''], ['Iron Engine 3 · Procrastination Studios', ''], ['Video: 640 x 480, 16-bit colour', 'OK'], ['Sound: 44 kHz stereo', 'OK'], ['Input: keyboard, mouse', 'OK'], ['Loading ravenhold.pak', 'OK'], ['Patch server: up to date', 'OK']];
function launchEngine(u) {
  const F = launchBuf(); rectI(0, 0, W, H, P.void);
  const shown = Math.floor((u - 0.25) / 0.34);
  ENGINE_LINES.forEach(([l, ok], n) => {
    if (n > shown) return;
    const y = 14 + n * 10 + (n > 1 ? 6 : 0);
    text(l, 14, y, 'tiny', n < 2 ? P.moon : P.s5);
    if (ok) { const dots = '.'.repeat(Math.max(2, 34 - l.length)); text(dots, 14 + measure(l, 'tiny') + 3, y, 'tiny', P.s2); text(ok, 190, y, 'tiny', n === shown && (u * 6) % 1 < 0.5 ? P.s3 : P.g5); }
  });
  if (Math.floor(u * 3) % 2 === 0) rectI(14, 14 + (Math.min(shown, ENGINE_LINES.length - 1) + 1) * 10 + 6, 4, 6, P.s5);
  return launchOut(F, [], [1, 1, 1], false);
}
// ---- 3. the publisher: Halsky Labs (logos.js)
function launchPublisher(u, len) {
  const F = launchBuf(), cx = 237, cy = 100;
  rect(0, 0, W, H, 0.03, M_MAGIC);
  const r = halskyLabs(u, len, cx, cy), out = clamp((u - 3.72) / 0.5);
  if (u > 2.9 && out < 0.33) text('presents', cx, cy + 58, 'tiny', fadeIdx(clamp((u - 2.9) / 0.4) * (1 - clamp(out * 3)), [P.void, P.s2, P.s3, P.s4]), { align: 'c', ls: 1 });
  return launchOut(F, [{ x: r.mx, y: r.my, r: 110, i: 0.9 * r.glow, c: [1.05, 0.7, 1.6] }], [0.3, 0.3, 0.4]);
}
// ---- 4. the developer: Procrastination Studios (logos.js); it fades out dithered
function launchDeveloper(u, len) {
  const F = launchBuf(), cx = 237, cy = 100;
  rect(0, 0, W, H, 0.03, M_UMBER);
  const r = procrastinationStudios(u, len, cx, cy);
  const c = launchOut(F, [{ x: r.bx, y: r.by, r: 100, i: 0.7 * r.glow, c: [1.4, 0.9, 0.55] }], [0.3, 0.3, 0.4]);
  ditherBlack(c, clamp((u - (len - 0.55)) / 0.45));
  return c;
}
// ---- 5. the title: black and rain, lightning shows the fallen angel; the halo is forged round, its spark lights,
// "Judgment" is struck out from the centre, a second bolt as it lands; "AGE OF"; a glint runs across the gilt
const LOGO_BIG = [237, 100], LOGO_SMALL = [237, 48];
function titleLogo(u) {
  const ring = eIO(clamp((u - 2.2) / 1.0)), spark = clamp((u - 3.15) / 0.12), burst = u > 3.15 ? Math.max(0, 1 - (u - 3.15) / 0.4) : 0;
  const word = eIO(clamp((u - 3.4) / 0.75)), heat = u < 4.15 ? (u > 3.4 ? 0.6 : 0) : Math.max(0, 0.6 - (u - 4.15) / 0.9);
  const shake = u > 4.15 && u < 4.45 ? Math.round(Math.sin(u * 95) * 1.6 * (1 - (u - 4.15) / 0.3)) : 0;
  const gl = u > 5.3 && u < 6.2 ? (u - 5.3) / 0.9 : u > 7.0 && u < 7.9 ? (u - 7.0) / 0.9 : null;
  const flash = u > 4.15 && u < 4.4 ? (u < 4.22 ? 1 : 0.4) : 0;
  return { ring, spark, burst, word, heat, shake, gl, flash, ageOf: clamp((u - 4.55) / 0.7) };
}
function launchTitle(u) {
  const vis = u < 0.9 ? 0.04 : u < 1.18 ? 1 : lerp(0.25, 1, clamp((u - 1.3) / 1.8));
  const L = titleLogo(u), flash = u > 0.9 && u < 1.18 ? (u < 0.98 || u > 1.08 ? 1 : 0.5) : L.flash * 0.7;
  const [cx, cy] = LOGO_BIG;
  return screenBoot(15 + u, { vis, flash, halo: false, plaque: false, bar: false, sparkI: L.spark * (1 + L.burst * 1.5), lights: [{ x: cx, y: cy + 20, r: 150, i: 0.35 * L.word, c: WARM }], ui: (F, t) => {
    smokeU(cx, cy + 12, 240, 52, 0.55 * L.word);
    aojLogo(cx + L.shake, cy + L.shake, 1, t, { ring: L.ring, spark: L.spark, sparkBurst: L.burst, word: L.word, heat: L.heat, glint: L.gl, flash: L.flash, ageOf: L.ageOf });
    AOJ.spark = AOJ.logoSpark;
    if (u > 5.6) { const ti = fadeIdx(clamp((u - 5.6) / 0.8), [P.void, P.s1, P.s3, P.s5]); text('The realm of Ravenhold', cx, cy + 96, 'tiny', ti, { align: 'c', ls: 1, shadow: P.void }); }
    // a few streaks of rain in front of the logo
    for (let k = 0; k < 60; k++) { const sp = 260 + hash(k, 2, 971) * 90, y0 = ((t * sp + hash(k, 3, 971) * 900) % (H + 30)) - 15, x0 = hash(k, 1, 971) * (W + 80) - 40 + y0 * 0.3; for (let s2 = 0; s2 < 6; s2++) { const x = Math.round(x0 + s2 * 0.3), y = Math.round(y0 + s2); if (s2 > 1) putI(x, y, s2 > 4 ? P.s4 : P.s3); } }
  } });
}
// ---- 6. the login screen: account and password typed in, Log in pressed
const ACCOUNT = 'dutch';
function loginPanel(u, st) {
  const PX = 162, PY = 118 + (st.dy || 0), PW = 150, PH = 78;
  shadowU(PX, PY, PW, PH, { k: 0.7, r: 4, dx: 3, dy: 4 });
  plateU(PX, PY, PW, PH, { mat: M_STONE, v: 0.3 }); frameI(PX, PY, PW, PH, P.void); frameI(PX + 2, PY + 2, PW - 4, PH - 4, P.s1);
  if (st.dialog) {   // logging in: a small status line with the halo turning beside it
    const [line, idx] = st.dialog, cx0 = PX + 20, cy0 = PY + 39, rot = u * 3;
    for (let k = 0; k < 24; k++) { const an = k / 24 * 6.283 + rot; let d = an + Math.PI / 4 + rot; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 0.7) continue; putI(Math.round(cx0 + Math.cos(an) * 6), Math.round(cy0 + Math.sin(an) * 6), Math.sin(an) < 0 ? P.u6 : P.u4); }
    putI(Math.round(cx0 + Math.cos(-Math.PI / 4 - rot) * 6), Math.round(cy0 + Math.sin(-Math.PI / 4 - rot) * 6), P.crimson);
    text(line, PX + 34, PY + 32, 'tiny', idx, { shadow: P.void });
    text('Realm: Ravenhold · PvE', PX + 34, PY + 42, 'tiny', P.s4, { shadow: P.void });
    return;
  }
  text('Account', PX + 10, PY + 8, 'tiny', P.s5, { shadow: P.void });
  wellU(PX + 10, PY + 16, PW - 20, 11, { mat: M_STONE, v: 0.08 });
  text(st.acc, PX + 14, PY + 19, 'tiny', P.moon);
  text('Password', PX + 10, PY + 31, 'tiny', P.s5, { shadow: P.void });
  wellU(PX + 10, PY + 39, PW - 20, 11, { mat: M_STONE, v: 0.08 });
  text('*'.repeat(st.pw), PX + 14, PY + 43, 'tiny', P.moon);
  if (st.caret && Math.floor(u * 3) % 2 === 0) { const [fx, txt] = st.caret === 'acc' ? [PY + 18, st.acc] : [PY + 41, '*'.repeat(st.pw)]; rectI(PX + 14 + measure(txt, 'tiny') + 1, fx, 1, 7, P.moon); }
  wellU(PX + 10, PY + 58, 7, 7, { mat: M_STONE, v: 0.1 }); putI(PX + 12, PY + 61, P.moon); putI(PX + 13, PY + 62, P.moon); putI(PX + 14, PY + 61, P.moon); putI(PX + 15, PY + 60, P.moon);
  text('Remember', PX + 20, PY + 59, 'tiny', P.s5, { shadow: P.void });
  const bx = PX + PW - 58, by = PY + 56, dn = st.pressed ? 1 : 0;
  rectI(bx, by + 1, 48, 13, P.wine); rectI(bx, by + dn, 48, 13, st.pressed ? P.copper : P.gold); frameI(bx, by + dn, 48, 13, P.void);
  text('Log in', bx + 24, by + 4 + dn, 'tiny', P.void, { align: 'c' });
  st.btn = [bx + 24, by + 7];
}
function launchLogin(u, len) {
  const typed = (u0, u1, n) => Math.max(0, Math.min(n, Math.floor((u - u0) / (u1 - u0) * n)));
  const st = { acc: ACCOUNT.slice(0, typed(1.1, 2.0, ACCOUNT.length)), pw: typed(2.75, 3.9, 9), caret: u > 1.0 && u < 2.3 ? 'acc' : u > 2.65 && u < 4.1 ? 'pw' : null, pressed: u > 5.0 && u < 5.35 };
  // the pointer: field, field, the button
  const path = [[0, 340, 200], [0.9, 190, 141], [2.3, 190, 141], [2.65, 190, 164], [4.2, 190, 164], [4.95, 286, 181], [8, 286, 181]];
  let p = path[0]; for (let k = 1; k < path.length; k++) if (u >= path[k - 1][0]) { const [t0, x0, y0] = path[k - 1], [t1, x1, y1] = path[k], q = easeO(clamp((u - t0) / (t1 - t0))); p = [0, lerp(x0, x1, q), lerp(y0, y1, q)]; }
  const e = eIO(clamp(u / 0.9)), sc = lerp(1, 0.5, e), cx = 237, cy = lerp(LOGO_BIG[1], LOGO_SMALL[1], e), pin = clamp((u - 0.45) / 0.45);
  st.dy = Math.round((1 - eIO(pin)) * 40);
  return screenBoot(15 + 8 + u, { vis: lerp(1, 0.74, e), halo: false, plaque: false, bar: false, ui: (F, t) => {
    smokeU(cx, cy + 6, 240 * sc, 52 * sc, 0.55);
    aojLogo(cx, cy, sc, t, { spark: 1 });
    AOJ.spark = AOJ.logoSpark;
    if (pin > 0) loginPanel(u, st);
    if (pin > 0.8) { text('Options', 196, 206, 'tiny', P.s5, { shadow: P.void }); text('Credits', 226, 206, 'tiny', P.s5, { shadow: P.void }); text('Quit', 256, 206, 'tiny', P.s5, { shadow: P.void }); }
    text('v 2.4.1', W - 4, H - 8, 'tiny', P.s4, { align: 'r', shadow: P.void });
    text('Realm: Ravenhold · PvE', 4, H - 8, 'tiny', P.s4, { shadow: P.void });
    if (u > 0.3) pointer(p[1], p[2], u > 5.5 ? 'wait' : 'arrow');
  } });
}
// ---- 7. logging in: connecting, authenticating, verified; then the world loading with a tip; then black
const TIP = 'Tip: what breaks off a Hollow is iron underneath. It keeps coming.';
function launchEnter(u, len) {
  if (u < 2.6) {
    const line = u < 0.9 ? ['Connecting to Ravenhold' + '.'.repeat(Math.floor(u * 4) % 4), P.u6] : u < 1.7 ? ['Authenticating' + '.'.repeat(Math.floor(u * 4) % 4), P.u6] : ['Account verified', P.g5];
    return screenBoot(31 + u, { vis: 0.74, halo: false, plaque: false, bar: false, ui: (F, t) => { smokeU(LOGO_SMALL[0], LOGO_SMALL[1] + 6, 120, 26, 0.55); aojLogo(LOGO_SMALL[0], LOGO_SMALL[1], 0.5, t, { spark: 1 }); AOJ.spark = AOJ.logoSpark; loginPanel(u, { dialog: line }); text('v 2.4.1', W - 4, H - 8, 'tiny', P.s4, { align: 'r', shadow: P.void }); } });
  }
  const q = u - 2.6, prog = clamp(q / 3.5), out = clamp((u - (len - 0.8)) / 0.8);
  const c = screenBoot(31 + u, { vis: 0.42, plaque: false, bar: false, ui: () => {
    smokeU(W / 2, 92, 120, 30, 0.6);
    text('Ravenhold', W / 2, 78, 'black', P.moon, { align: 'c', outline: P.void });
    text('Entering the world', W / 2, 98, 'tiny', P.s5, { align: 'c', shadow: P.void });
    const BW2 = 220, BX = Math.round((W - BW2) / 2), BY = 196;
    smokeU(W / 2, BY + 2, 150, 22, 0.75);
    text(TIP, W / 2, BY - 14, 'tiny', P.u5, { align: 'c', shadow: P.void });
    groove(BX, BY, BW2, 6, prog, M_STONE, [0.78, 0.55]);
    text(['Loading the town', 'Loading your party', 'Loading the night'][Math.min(2, Math.floor(prog * 3))], BX, BY + 9, 'tiny', P.s4, { shadow: P.void });
    text(Math.round(prog * 100) + '%', BX + BW2, BY + 9, 'tiny', P.s4, { align: 'r', shadow: P.void });
  } });
  ditherBlack(c, out);
  return c;
}
// ---- 8. the game: Ravenhold fades in from black (dithered), the party in town, the night ahead
let LAUNCH_GAME = null;
function launchGame(u) {
  const src = gameScreen((ctx) => aojTown(ctx, 1 + u), { town: true, tab: 'town', ...SIDE_TOWN, souls: 26 });
  if (!LAUNCH_GAME) { LAUNCH_GAME = document.createElement('canvas'); LAUNCH_GAME.width = GS_W; LAUNCH_GAME.height = GS_H; }
  const g = LAUNCH_GAME.getContext('2d'); g.drawImage(src, 0, 0);
  ditherBlack(LAUNCH_GAME, 1 - clamp(u / 0.9));
  return LAUNCH_GAME;
}
function launchScreen(T, only) {
  const [k, u, len] = only ? [only, T, LAUNCH.find((p) => p[0] === only)[2] - LAUNCH.find((p) => p[0] === only)[1]] : launchPhase(T);
  if (k === 'desktop') return launchDesktop(only ? u % len : u);
  if (k === 'engine') return launchEngine(only ? u % len : u);
  if (k === 'publisher') return launchPublisher(only ? u % len : u, len);
  if (k === 'developer') return launchDeveloper(only ? u % len : u, len);
  if (k === 'title') return launchTitle(only ? u % len : u);
  if (k === 'login') return launchLogin(only ? u % len : u, len);
  if (k === 'enter') return launchEnter(only ? u % len : u, len);
  return launchGame(u);
}

// the whole right screen: the desk, the monitor running the launch, the phone in your hand
DESK_MOMENTS.launch = { clock: '20:00', zl: 50, tired: 0, zone: 0, cans: 3, note: ['y', 'y', 'y'], feed: [] };
DESK_MOMENTS.launched = { clock: '20:00', zl: 50, tired: 0, zone: 0, cans: 3, note: ['y', 'y', 'y'], feed: [['20:00', 'GAME', "Welcome to Age of Judgment. Have fun, don't get caught."]] };
const _drawScreen = drawScreen;
drawScreen = function (name, t, o) { if (typeof name === 'string' && name.startsWith('launch:')) return launchScreen(t, name.slice(7) || null); return _drawScreen(name, t, o); };
function launchDesk(T) {
  const c = drawDesk('launch:', T, T, T >= LAUNCH_END ? 'launched' : 'launch', { phone: { phone: 'hand' } });
  drawPhoneOver(c.getContext('2d'), PHONE_AT[0], PHONE_AT[1], 'firstchat', T, { T, rise: clamp(T / 0.6) });
  return c;
}
