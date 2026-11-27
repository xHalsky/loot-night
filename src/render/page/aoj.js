// ===========================================================================
// AGE OF JUDGMENT, the v2 redesign (design/v2/, docs/design/aoj-world.md; #127 to #131), ported from its samples page.
// Built on the Game Frame's renderer (engine.js), its crypt, heroes and HUD.
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

// one 474 x 232 canvas the launch's screens draw into (the game screen: the battle area and the side panel)
let LAUNCH_C = null;
function launchCanvas() { if (!LAUNCH_C) { LAUNCH_C = document.createElement('canvas'); LAUNCH_C.width = GS_W; LAUNCH_C.height = GS_H; } return LAUNCH_C; }

// ================================================================ the roster (W4, #130): the first four, from the samples page
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

// ---------------------------------------------------------------- the Shadow Crypt's tells (W3, #129)
// The crypt as approved, plus three tells: colossal riveted ribs in the far hall (seen through the arches), the iron
// angel in the moonlit alcove (foes.js ironAngelStatue) and the Church's broken halo on the banner. Drawn once into the
// crypt's layers after buildDungeon (facade.js pkInit); the build's crypt is the page's, so the coordinates hold.
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
  // MID: the saint in the moonlit alcove is an iron angel (foes.js: ironAngelStatue)
  bind(DG.mid); ironAngelStatue(165);
}

// ---------------------------------------------------------------- Ravenhold, AoJ: rain, wet streets, the iron gate, the halo (W2, #128)
// In the build: town.js screenTown runs ravenholdIron on its layer once, when it is built (and rebuilt for a building's
// new level), and townRain every frame after the town's life, under its UI (signs and outlines are the UI layer).
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

// ---------------------------------------------------------------- the boot screen: Age of Judgment launching on the PC
// Rain over Ravenhold at night. Behind the town, the fallen angel: its ribs rise out of the hills and arch over the
// rooftops; its broken halo stands in the sky with the spark in its gap. Lightning now and then shows the whole of it.
// The title sits on a riveted iron plaque; under it, the realm connecting.
function screenBoot(t, o = {}) {
  const c = launchCanvas(), ctx = c.getContext('2d');
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
const FIRST_CHAT_AT = [['Billy', "yo. realm's up", 2.6], ['Mike', "launching. still can't skip the intro", 5.0], ['Lance', "good. it's the best part", 8.4], ['Billy', 'patch notes are forty pages, i read zero', 10.2], ['Billy', 'this intro looks like an old crack intro lol', 12.8], ['Lance', 'would you like to know more?', 21.4], ['Lance', 'nine stars. strong password', 27.6], ['Billy', '11 sharp. and careful with her tonight, they mostly come at night', 35.0]];
const TYPING_SEC = 1.6;
// THE LAUNCH'S SOUND (aoj-world §7b): the cue sheet in launch seconds, fired once as T passes each time; one music cue
// from 6.2 s to the town; the rain under the title, the login and the loading. Times follow the code above exactly.
// [T, cue, what]. 'pc': the real PC (clean); every other cue is the game's own and goes through the PS1 chain.
const LAUNCH_SOUND = [
  // Windows 98
  [1.25, 'mouse', 'pc: the double-click, first'], [1.45, 'mouse', 'pc: the double-click, second'],
  [2.85, 'crt', 'pc: the display mode switches: a relay clunk, the whine cut, the line collapses'],
  // the engine
  [3.25, 'cdspin', 'pc: the CD drive spins up under the start-up lines (2.6 s, quiet)'],
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => [3.45 + n * 0.34, 'bootline', 'the engine: a soft tick per start-up line']),
  // Halsky Labs (publisher), u = T - 6.2 (#133: the scene's flair, an 80s studio-gear sting through the Amiga's sound;
  // it holds, the next screen fades in over it)
  [6.4, 'hl_line', 'the red power-on line sweeps across: an analog synth sweeping up through its filter, settling on a tone (0.45 s)'],
  [6.65, 'hl_scan', 'the mark rasters in behind its scanline: a soft digital data chirp (0.75 s)'],
  [7.2, 'hl_fly', 'HALSKY flies in from the right: a whoosh rising into the lock (0.42 s)'],
  [7.62, 'hl_hit', 'HALSKY locks with the flash, the lens streak and a burst of sparkles, its extrusion pushing out: a sampler orchestra stab with a gated snare and an FM bell chord ringing on (the sting\'s one big beat)'],
  [7.8, 'hl_badge', 'the LABS badge lights like a panel LED: three short digital blips (two flickers, then on)'],
  [8.2, 'hl_presents', 'PRESENTS opens from the middle: a soft FM chime, two notes'],
  [8.9, 'hl_glint', 'the glint runs across the chrome: a thin bright shimmer (0.7 s)'],
  // Procrastination Studios (developer), u = T - 10.6 (#133: a cracktro; it fades in over Halsky Labs and holds)
  [10.75, 'ps_drop', 'the logo drops in from above: a falling whistle (0.4 s)'],
  [11.15, 'ps_mod', 'it lands on the first kick of a 4-channel tracker jingle (125 BPM, arpeggio chords, a bass, the drums, a lead) that ends on a D minor chord ringing out by 15 s'],
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
  ...[1, 2, 3, 4, 5].map((k) => [23 + 1.1 + k * 0.18, 'kb_clack', 'pc: "dutch" typed on a clacky mechanical keyboard']),
  [25.7, 'mouse', 'pc: a click in Password'],
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => [23 + 2.75 + k * 1.15 / 9, 'kb_clack', 'pc: nine stars typed']),
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
  const c = launchCanvas(), ctx = c.getContext('2d'), ds = VIEW.strength; if (!dither) VIEW.strength = 0.02;
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

// Age of Judgment's desktop icon, 18 x 18: the broken halo on a dark tile, its spark crimson (#127; the taskbar's is
// lnIcon8 in win98.js). The monitor's own desktop (ui/monitor.ts) shows it too.
function aojIcon18(x, y) { rectI(x, y, 18, 18, P.void); for (let a = 0; a < 40; a++) { const an = a / 40 * 6.283 - Math.PI; let d = an + Math.PI / 4; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 0.5) continue; putI(Math.round(x + 9 + Math.cos(an) * 6), Math.round(y + 9 + Math.sin(an) * 6), Math.cos(an + 2.4) > 0 ? P.u6 : P.u4); } putI(x + 13, y + 5, P.crimson); }
let AOJ_ICON = null;
function aojIconCanvas() {
  if (AOJ_ICON) return AOJ_ICON;
  setRes(18, 18); const F = buf('aojicon', 18, 18); clearFrame(F); bind(F); CLIP = null; aojIcon18(0, 0);
  const c = document.createElement('canvas'); c.width = 18; c.height = 18; const g = c.getContext('2d'), img = g.createImageData(18, 18); compose(F, img, [], [1, 1, 1], 0.02, 0); g.putImageData(img, 0, 0);
  return (AOJ_ICON = c);
}
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
    if (k === 'aoj') aojIcon18(x + 2, y);
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
// ---- 3. the publisher: Halsky Labs (logos.js). It holds once it is in; the developer's screen fades in over it.
function launchPublisher(u, len) {
  const F = launchBuf(), cx = 237, cy = 100;
  rect(0, 0, W, H, 0.02, M_STONE);
  const r = halskyLabs(u, len, cx, cy);
  return launchOut(F, [{ x: r.mx, y: r.my, r: 120, i: 0.8 * r.glow, c: [1.2, 1.15, 1.3] }], [0.3, 0.3, 0.4]);
}
// ---- 4. the developer: Procrastination Studios (logos.js), faded in over Halsky Labs; it holds, the title fades in
function launchDeveloper(u, len) {
  if (u < LAUNCH_XFADE) { const prev = snapLaunch(launchPublisher(LAUNCH_LEN.publisher, LAUNCH_LEN.publisher)); return ditherFrom(developerFrame(u, len), prev, u / LAUNCH_XFADE); }
  return developerFrame(u, len);
}
function developerFrame(u, len) {
  const F = launchBuf(), cx = 237, cy = 100;
  rect(0, 0, W, H, 0.025, M_DUSK);
  const r = procrastinationStudios(u, len, cx, cy);
  return launchOut(F, [{ x: r.bx, y: r.by, r: 80, i: 0.45 * r.glow, c: [1.4, 0.9, 0.55] }], [0.3, 0.3, 0.4]);
}
// The studio logos hold and the next screen fades in over them (#133, Paweł: no animation out): a palette-exact
// dithered crossfade over LAUNCH_XFADE seconds. snapLaunch copies a frame aside (every screen draws into one canvas).
const LAUNCH_XFADE = 0.5, LAUNCH_LEN = { publisher: 4.4 - 1e-3, developer: 4.4 - 1e-3 };
let LAUNCH_SNAP = null;
function snapLaunch(c) { if (!LAUNCH_SNAP || LAUNCH_SNAP.width !== c.width || LAUNCH_SNAP.height !== c.height) { LAUNCH_SNAP = document.createElement('canvas'); LAUNCH_SNAP.width = c.width; LAUNCH_SNAP.height = c.height; } const g = LAUNCH_SNAP.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(c, 0, 0); return LAUNCH_SNAP; }
// over c, keep the old frame where the Bayer value is at or above k (k: 0 all old, 1 all new)
function ditherFrom(c, old, k) {
  if (k >= 1) return c;
  const g = c.getContext('2d'), A = g.getImageData(0, 0, c.width, c.height), B = old.getContext('2d').getImageData(0, 0, c.width, c.height), D = A.data, E = B.data;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (BAYER8[((y & 7) << 3) | (x & 7)] >= k) { const o = (y * c.width + x) * 4; D[o] = E[o]; D[o + 1] = E[o + 1]; D[o + 2] = E[o + 2]; }
  g.putImageData(A, 0, 0); return c;
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
  if (u < LAUNCH_XFADE) { const prev = snapLaunch(developerFrame(LAUNCH_LEN.developer, LAUNCH_LEN.developer)); return ditherFrom(titleFrame(u), prev, u / LAUNCH_XFADE); }
  return titleFrame(u);
}
function titleFrame(u) {
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
function launchScreen(T, only) {
  const [k, u, len] = only ? [only, T, LAUNCH.find((p) => p[0] === only)[2] - LAUNCH.find((p) => p[0] === only)[1]] : launchPhase(T);
  if (k === 'desktop') return launchDesktop(only ? u % len : u);
  if (k === 'engine') return launchEngine(only ? u % len : u);
  if (k === 'publisher') return launchPublisher(only ? u % len : u, len);
  if (k === 'developer') return launchDeveloper(only ? u % len : u, len);
  if (k === 'title') return launchTitle(only ? u % len : u);
  if (k === 'login') return launchLogin(only ? u % len : u, len);
  if (k === 'enter') return launchEnter(only ? u % len : u, len);
  return null;   // the game: the build fades its live town in (liveRpg.ts, ditherBlack)
}
