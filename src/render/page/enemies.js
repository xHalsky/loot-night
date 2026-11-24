// ===========================================================================
// Enemies — face left. Bone = umber high, iron = stone, cloth = dusk/moss,
// necromancy = magic (arcane), eyes = danger (crimson embers).
// ===========================================================================
const EFX = {};
function boneLine(x0, y0, x1, y1, v = 0.86) { line(x0, y0, x1, y1, v, M_UMBER); line(x0 + 1, y0, x1 + 1, y1, v * 0.68, M_UMBER); }
function emberEye(x, y, t, seed) { put(x, y, 0.85 + 0.15 * Math.sin(t * 6 + seed), M_DANGER, 1); }

// tapered, shaded ivory bone with knobbed ends (lit from the upper left, facing the party)
function bone(x0, y0, x1, y1, w0, w1, d = 1) {
  limb(x0, y0, x1, y1, w0, w1, 0.5 * d, 0.97 * d, M_UMBER);
  ellipse(x1 + 0.5, y1 + 0.5, w1 * 0.66, w1 * 0.66, 0.88 * d, M_UMBER);
}
function rust(x, y, w, h, seed) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (hash(x + i, y + j, seed) > 0.72) put(x + i, y + j, 0.42 + 0.2 * hash(i, j, seed + 1), M_UMBER); }
function ragHem(x0, x1, y, len, seed, v, mat) { for (let x = x0; x <= x1; x++) { const l = Math.round(len * (0.4 + 0.6 * hash(x >> 1, 0, seed))); for (let j = 0; j < l; j++) put(x, y + j, v - 0.08 * (j / Math.max(1, l)), mat); } }

// skeleton warrior: upright and wide, ivory bones with dark gaps. Rusted nasal helm, crimson rag scarf, curved
// falchion raised in the near hand, rotten plank shield on the far arm, spiked pauldron, loincloth, one boot.
function skeletonWarrior(cx, fy, t, o = {}) {
  const b = o.b || 0, Y = fy + b, sw = o.swing ? 1 : 0, fl = Math.sin(t * 3.2), jaw = Math.sin(t * 5) > 0.3 ? 1 : 0;
  // far leg: bare bone, splayed toes
  bone(cx + 3, Y - 26, cx + 8, fy - 14, 2.8, 2.4, 0.74); bone(cx + 8, fy - 14, cx + 11, fy - 3, 2.4, 2, 0.74);
  for (const [dx, dy] of [[-4, 2], [-3, 3], [-1, 3]]) line(cx + 11, fy - 2, cx + 11 + dx, fy - 2 + dy, 0.68, M_UMBER);
  // far arm + rotten plank shield with iron bands and a broken corner
  bone(cx + 4, Y - 45, cx + 10, Y - 38, 2.4, 2.1, 0.72); bone(cx + 10, Y - 38, cx + 12, Y - 31, 2.1, 1.9, 0.72);
  const sx0 = cx + 8, sy0 = Y - 43;
  if (o.shield !== false) {
  poly([[sx0, sy0], [sx0 + 10, sy0 + 3], [sx0 + 10, sy0 + 22], [sx0 + 6, sy0 + 25], [sx0 + 3, sy0 + 21], [sx0, sy0 + 21]], (x, y) => {
    const pl = Math.floor((x - sx0) / 3.4), seam = Math.abs(((x - sx0) % 3.4) - 3.4) < 0.6;
    return seam ? 0.1 : 0.34 + 0.07 * (pl % 2) + 0.07 * (GR(x, y) - 0.5) - 0.12 * clamp((x - sx0) / 10);
  }, M_UMBER);
  for (const by of [5, 16]) { for (let x = sx0; x <= sx0 + 10; x++) { const y = Math.round(sy0 + by + (x - sx0) * 0.3); put(x, y, 0.4 - 0.15 * clamp((x - sx0) / 10), M_STONE); put(x, y + 1, 0.22, M_STONE); } for (const rx of [1, 5, 9]) put(sx0 + rx, Math.round(sy0 + by + rx * 0.3), 0.85, M_STONE); }
  }
  // ragged loincloth: back flap, then belt, then front flap (over the front thigh)
  poly([[cx - 1, Y - 27], [cx + 6, Y - 27], [cx + 7, Y - 18], [cx + 1, Y - 19]], 0.24, M_DUSK); ragHem(cx + 1, cx + 7, Y - 19, 6, 71, 0.22, M_DUSK);
  // front leg into a crumpled boot
  bone(cx - 2, Y - 26, cx - 8, fy - 14, 3, 2.6); bone(cx - 8, fy - 14, cx - 10, fy - 8, 2.6, 2.4);
  poly([[cx - 13, fy - 10], [cx - 7, fy - 11], [cx - 7, fy - 5], [cx - 6, fy - 2], [cx - 7, fy], [cx - 17, fy], [cx - 17, fy - 2], [cx - 12, fy - 4]], (x, y) => 0.36 + 0.22 * clamp((cx - 6 - x) / 11) - ((y - fy + 8) % 3 === 0 && x > cx - 13 ? 0.1 : 0), M_UMBER);
  line(cx - 13, fy - 10, cx - 7, fy - 11, 0.62, M_UMBER); rect(cx - 17, fy - 1, 11, 1, 0.12, M_UMBER); line(cx - 12, fy - 6, cx - 8, fy - 7, 0.14, M_UMBER);
  // lumbar spine between ribcage and belt: the skeleton's tell-tale waist
  for (let y = Y - 35; y <= Y - 28; y++) { put(cx + 1, y, y % 2 ? 0.96 : 0.58, M_UMBER); put(cx + 2, y, y % 2 ? 0.62 : 0.36, M_UMBER); if (y % 2) put(cx, y, 0.5, M_UMBER); }
  poly([[cx - 4, Y - 29], [cx + 4, Y - 29], [cx + 5, Y - 26], [cx - 5, Y - 26]], (x) => 0.62 + 0.3 * clamp((cx + 5 - x) / 10), M_UMBER);
  rect(cx - 6, Y - 27, 12, 2, (x) => 0.26 + 0.1 * clamp((cx + 6 - x) / 12), M_UMBER); rect(cx - 3, Y - 27, 3, 2, 0.8, M_STONE); put(cx - 2, Y - 26, 0.2, M_STONE);
  poly([[cx - 6, Y - 25], [cx + 1, Y - 25], [cx + 2, Y - 16], [cx - 5, Y - 17]], (x, y) => 0.3 + 0.12 * clamp((cx + 2 - x) / 8) - ((x + y) % 4 === 0 ? 0.05 : 0), M_DUSK); ragHem(cx - 5, cx + 2, Y - 17, 6, 72, 0.3, M_DUSK);
  // spiked pauldron on the far shoulder: behind the ribcage, so drawn before it
  ellipse(cx + 4, Y - 45, 4.2, 3, (x, y) => 0.32 + 0.4 * clamp(1 - Math.hypot(x - cx - 2, y - Y + 47) / 4.5), M_STONE);
  for (const [dx, dy] of [[1, -4], [4, -3], [6, -1]]) line(cx + 4 + dx * 0.6, Y - 45 + dy * 0.5, cx + 4 + dx, Y - 45 + dy, 0.75, M_STONE);
  rust(cx + 2, Y - 47, 6, 4, 36);
  // ribcage: dark hollow, curved ribs, sternum
  poly([[cx + 4, Y - 47], [cx - 7, Y - 47], [cx - 9, Y - 42], [cx - 7, Y - 37], [cx + 3, Y - 36]], 0.04, M_DUSK);
  for (let k = 0; k < 5; k++) {
    const y0 = Y - 46 + k * 2.2, L = 11 - k * 0.7;
    for (let s2 = 0; s2 <= 12; s2++) { const q = s2 / 12, x = cx + 3 - q * L, y = y0 + Math.sin(q * Math.PI * 0.9) * -1.2 + q * q * 2.2; put(Math.round(x), Math.round(y), 0.96 - 0.2 * (1 - q), M_UMBER); put(Math.round(x), Math.round(y) + 1, 0.5, M_UMBER); }
  }
  line(cx - 7, Y - 45, cx - 6, Y - 39, 0.86, M_UMBER);
  for (let y = Y - 47; y <= Y - 36; y++) put(cx + 3, y, y % 2 ? 0.62 : 0.4, M_UMBER);
  // near arm and the curved falchion: raised high, or cut forward on the swing
  const sh = [cx - 5, Y - 44], el = sw ? [cx - 10, Y - 40] : [cx - 11, Y - 37], hd = sw ? [cx - 17, Y - 37] : [cx - 13, Y - 46];
  bone(sh[0], sh[1], el[0], el[1], 2.6, 2.2); bone(el[0], el[1], hd[0], hd[1], 2.2, 2);
  rect(Math.round((el[0] + hd[0]) / 2) - 1, Math.round((el[1] + hd[1]) / 2) - 1, 3, 3, 0.62, M_DANGER);
  const C = sw ? [[hd[0], hd[1]], [hd[0] - 10, hd[1] - 4], [hd[0] - 18, hd[1] + 6]] : [[hd[0], hd[1] - 1], [hd[0] - 7, hd[1] - 12], [hd[0] - 2, hd[1] - 22]];
  for (let s2 = 0; s2 <= 26; s2++) {
    const q = s2 / 26, x = qb(C[0][0], C[1][0], C[2][0], q), y = qb(C[0][1], C[1][1], C[2][1], q), w = q < 0.8 ? 1.4 : 1.4 * (1 - q) / 0.2;
    const tx = 2 * (1 - q) * (C[1][0] - C[0][0]) + 2 * q * (C[2][0] - C[1][0]), ty = 2 * (1 - q) * (C[1][1] - C[0][1]) + 2 * q * (C[2][1] - C[1][1]), tl = Math.hypot(tx, ty), nx = -ty / tl, ny = tx / tl;
    for (let o2 = -w; o2 <= w; o2 += 0.5) put(Math.round(x + nx * o2), Math.round(y + ny * o2), o2 < -0.6 ? 0.98 : o2 > 0.6 ? 0.42 : 0.7, M_STONE);
  }
  line(hd[0] - 3, hd[1], hd[0] + 3, hd[1], 0.86, M_UMBER); rect(hd[0] - 1, hd[1] + 1, 2, 3, 0.3, M_UMBER); put(hd[0], hd[1] + 4, 0.86, M_UMBER);
  // crimson rag scarf: wrapped at the neck, one tail fluttering back, one end hanging over the ribs
  if (o.scarf !== false) {
  poly([[cx - 7, Y - 47], [cx + 3, Y - 47], [cx + 4, Y - 44], [cx - 6, Y - 43]], (x) => 0.62 + 0.3 * clamp((cx + 4 - x) / 11), M_DANGER);
  poly([[cx + 2, Y - 47], [cx + 6, Y - 47 + fl * 0.5], [cx + 9, Y - 43 + fl], [cx + 7, Y - 42 + fl], [cx + 6, Y - 40 + fl], [cx + 3, Y - 44]], 0.56, M_DANGER);
  poly([[cx - 6, Y - 44], [cx - 3, Y - 44], [cx - 3, Y - 38], [cx - 4, Y - 36], [cx - 5, Y - 39], [cx - 6, Y - 37]], 0.72, M_DANGER);
  }
  // skull: big, grinning, the jaw working; ember eyes under a rusted nasal helm with a bronze brow band
  const hx = cx - 5, hy = Y - 53;
  ellipse(hx, hy - 1, 4.8, 5, (x, y) => 0.7 + 0.28 * clamp((hx + 3 - x) / 8), M_UMBER);
  rect(hx - 4, hy - 1, 2, 3, 0.03, M_DUSK); rect(hx - 1, hy - 1, 2, 3, 0.03, M_DUSK);
  emberEye(hx - 4, hy, t, 1); emberEye(hx - 1, hy, t, 3);
  put(hx - 3, hy + 2, 0.1, M_DUSK);
  for (let x = hx - 5; x <= hx + 1; x++) put(x, hy + 3, x % 2 ? 0.98 : 0.4, M_UMBER);
  rect(hx - 5, hy + 4, 6, 1 + jaw, 0.04, M_DUSK);
  poly([[hx - 6, hy + 5 + jaw], [hx + 1, hy + 5 + jaw], [hx + 3, hy + 2], [hx + 3, hy + 4], [hx + 1, hy + 7 + jaw], [hx - 5, hy + 7 + jaw]], (x) => 0.6 + 0.3 * clamp((hx + 3 - x) / 9), M_UMBER);
  for (let x = hx - 5; x <= hx; x += 2) put(x, hy + 5 + jaw, 0.98, M_UMBER);
  if (o.helm === false) { line(hx - 1, hy - 5, hx + 1, hy - 3, 0.3, M_UMBER); put(hx + 2, hy - 3, 0.3, M_UMBER); } else {
  poly([[hx - 5, hy - 2], [hx - 4, hy - 6], [hx, hy - 8], [hx + 4, hy - 6], [hx + 5, hy - 2]], (x, y) => 0.3 + 0.44 * clamp((hx + 5 - x) / 10) * (1 - 0.3 * clamp((y - hy + 8) / 6)), M_STONE);
  rust(hx - 2, hy - 7, 7, 4, 37);
  line(hx - 5, hy - 2, hx + 5, hy - 2, 0.88, M_UMBER); line(hx - 4, hy - 3, hx + 4, hy - 3, 0.6, M_UMBER);
  rect(hx - 3, hy - 2, 1, 4, 0.72, M_STONE); put(hx - 3, hy + 2, 0.5, M_STONE);
  line(hx - 2, hy - 7, hx + 1, hy - 8, 0.9, M_STONE);
  }
  EFX.warrior = [cx - 2, Y - 38];
}

// zombie: tall, gaunt, emaciated. Grey-green rot, ribs and a sunken belly showing through the skin, long arms
// hanging (the near hand reaching), bald skull-like head bowed, one eye still glowing, a torn leather skirt,
// a broken sword stuck through its side, wounds on forearm and shin, bare feet.
function zombie(cx, fy, t, o = {}) {
  const sway = Math.sin(t * 1.4), Y = fy + (sway > 0.7 ? -1 : 0), hs = Math.round(sway), F = M_MOSS;
  // far leg and foot
  limb(cx + 2, Y - 30, cx + 4, fy - 15, 3.2, 2.6, 0.3, 0.5, F); limb(cx + 4, fy - 15, cx + 6, fy - 3, 2.6, 2.2, 0.3, 0.5, F);
  poly([[cx + 1, fy - 2], [cx + 7, fy - 3], [cx + 7, fy], [cx, fy]], 0.42, F);
  // far arm hanging long behind
  limb(cx + 3, Y - 49, cx + 6, Y - 39, 3, 2.4, 0.3, 0.48, F); limb(cx + 6, Y - 39, cx + 5 + hs, Y - 29, 2.4, 2, 0.3, 0.48, F);
  for (const dx of [-1, 0, 1]) line(cx + 5 + hs, Y - 29, cx + 4 + hs + dx, Y - 25, 0.42, F);
  // the broken blade's point coming out of the back
  if (o.sword !== false) { line(cx + 4, Y - 34, cx + 9, Y - 30, 0.6, M_STONE); put(cx + 9, Y - 30, 0.9, M_STONE); }
  // near leg, wound on the shin with bone showing
  limb(cx - 2, Y - 30, cx - 5, fy - 15, 3.4, 2.8, 0.4, 0.68, F); limb(cx - 5, fy - 15, cx - 6, fy - 3, 2.8, 2.4, 0.4, 0.68, F);
  rect(cx - 6, fy - 11, 2, 4, 0.62, M_DANGER); line(cx - 6, fy - 11, cx - 6, fy - 7, 0.86, M_UMBER);
  poly([[cx - 12, fy - 2], [cx - 5, fy - 3], [cx - 4, fy], [cx - 12, fy]], 0.56, F);
  // gaunt torso: chest, ribs under the skin, sunken belly, narrow waist
  poly([[cx - 4, Y - 51], [cx + 4, Y - 50], [cx + 5, Y - 43], [cx + 3, Y - 36], [cx + 2, Y - 31], [cx - 3, Y - 31], [cx - 4, Y - 36], [cx - 6, Y - 43]],
    (x, y) => 0.44 + 0.3 * clamp((cx + 5 - x) / 11) - (y > Y - 37 ? 0.1 : 0), F);
  for (let k = 0; k < 4; k++) { const yy = Y - 46 + k * 2.5; for (let x = cx - 5; x <= cx + 3; x++) put(x, Math.round(yy + Math.abs(x - cx + 1) * 0.25), 0.26, F); }
  line(cx - 4, Y - 50, cx + 3, Y - 49, 0.8, F); line(cx - 1, Y - 47, cx - 1, Y - 38, 0.62, F);
  for (let x = cx - 3; x <= cx + 2; x++) put(x, Y - 36, 0.24, F);
  // torn leather skirt, hem longer on one side, strap across
  poly([[cx - 5, Y - 32], [cx + 5, Y - 32], [cx + 7, Y - 22], [cx + 6, fy - 9], [cx + 3, fy - 12], [cx, fy - 15], [cx - 4, fy - 18], [cx - 6, Y - 24]],
    (x, y) => 0.34 + 0.16 * clamp((cx + 7 - x) / 13) - (hash(x >> 1, y >> 1, 75) > 0.9 ? 0.16 : 0) - ((x * 2 + y) % 5 === 0 ? 0.05 : 0), M_UMBER);
  for (const [x0, y0, l] of [[cx + 5, fy - 10, 4], [cx + 2, fy - 13, 3], [cx - 3, fy - 17, 3]]) line(x0, y0, x0 - 1, y0 + l, 0.3, M_UMBER);
  put(cx - 3, Y - 26, 0.12, M_UMBER); put(cx + 2, Y - 22, 0.12, M_UMBER);
  line(cx - 5, Y - 31, cx + 5, Y - 33, 0.22, M_UMBER); line(cx - 6, Y - 26, cx + 2, Y - 31, 0.24, M_UMBER);
  // a broken sword stuck through the side: grip and crossguard out of the front flank
  if (o.sword !== false) {
  line(cx - 4, Y - 35, cx - 9, Y - 41, 0.62, M_STONE); line(cx - 3, Y - 35, cx - 8, Y - 41, 0.4, M_STONE);
  line(cx - 11, Y - 39, cx - 6, Y - 44, 0.72, M_UMBER); line(cx - 10, Y - 38, cx - 5, Y - 43, 0.4, M_UMBER);
  line(cx - 9, Y - 42, cx - 13, Y - 47, 0.3, M_UMBER); line(cx - 10, Y - 42, cx - 14, Y - 47, 0.22, M_UMBER); ellipse(cx - 14, Y - 48, 1.2, 1.2, 0.6, M_STONE);
  for (const [dx, dy] of [[-2, 1], [-1, 2], [0, 2]]) put(cx - 3 + dx, Y - 35 + dy, 0.62, M_DANGER);
  } else { rect(cx - 4, Y - 41, 3, 2, 0.62, M_DANGER); put(cx - 3, Y - 39, 0.5, M_DANGER); }
  // near arm hanging forward, hand reaching; a raw wound on the forearm
  limb(cx - 3, Y - 49, cx - 7, Y - 40, 3.2, 2.6, 0.42, 0.72, F); limb(cx - 7, Y - 40, cx - 12, Y - 32 - hs, 2.6, 2.2, 0.42, 0.72, F);
  rect(cx - 10, Y - 37, 2, 2, 0.62, M_DANGER);
  for (const [dx, dy] of [[-3, 3], [-2, 4], [-1, 4], [0, 3]]) line(cx - 12, Y - 32 - hs, cx - 12 + dx, Y - 32 - hs + dy, 0.66, F);
  // neck pushed forward, head bowed: bald, skull-like, one eye still glowing
  limb(cx - 1, Y - 50, cx - 4, Y - 54, 2.6, 2.4, 0.4, 0.6, F);
  const hx = cx - 6 + hs, hy = Y - 57;
  poly([[hx - 4, hy - 1], [hx - 3, hy - 4], [hx + 1, hy - 6], [hx + 4, hy - 4], [hx + 5, hy], [hx + 3, hy + 4], [hx, hy + 6], [hx - 3, hy + 6], [hx - 5, hy + 3]],
    (x, y) => 0.5 + 0.3 * clamp((hx + 5 - x) / 10) - 0.1 * clamp((y - hy) / 6), F);
  poly([[hx + 1, hy - 6], [hx + 4, hy - 4], [hx + 3, hy - 2], [hx + 1, hy - 4]], 0.82, M_UMBER);
  line(hx - 4, hy - 1, hx - 1, hy - 2, 0.82, F);
  rect(hx - 4, hy, 2, 2, 0.04, M_DUSK); put(hx - 4, hy, 0.95, M_LOOT, 1);
  rect(hx - 1, hy, 2, 2, 0.06, M_DUSK);
  put(hx - 5, hy + 2, 0.12, M_DUSK);
  for (let x = hx - 4; x <= hx; x++) put(x, hy + 4, x % 2 ? 0.88 : 0.2, M_UMBER);
  line(hx - 3, hy + 5, hx + 1, hy + 5, 0.3, F);
  put(hx + 3, hy + 1, 0.3, F); put(hx + 4, hy + 2, 0.36, F);
  EFX.mouth = [hx - 3, hy + 4];
}

function necromancer(cx, fy, t, o = {}) {
  const Y = fy - 2 + Math.round(Math.sin(t * 1.6));
  // rune circle on the floor (rotating)
  for (let a = 0; a < 90; a++) {
    const an = a / 90 * Math.PI * 2 + t * 0.6, x = cx + Math.cos(an) * 20, y = fy + 1 + Math.sin(an) * 4;
    put(Math.round(x), Math.round(y), (a % 9 === 0) ? 1 : 0.62, M_MAGIC, 1);
  }
  for (let k = 0; k < 6; k++) { const an = k / 6 * Math.PI * 2 - t * 0.9; put(Math.round(cx + Math.cos(an) * 13), Math.round(fy + 1 + Math.sin(an) * 2.5), 0.9, M_MAGIC, 1); }
  // robe, flared, ragged hem
  poly([[cx - 6, Y - 46], [cx + 6, Y - 46], [cx + 12, fy - 6], [cx + 9, fy - 3], [cx + 6, fy - 6], [cx + 2, fy - 2], [cx - 2, fy - 6], [cx - 6, fy - 3], [cx - 10, fy - 7], [cx - 12, fy - 5]],
    (x, y) => 0.16 + 0.22 * Math.sin(clamp((x - cx + 12) / 24) * Math.PI) - (((x - cx + 40) % 4 === 0 && y > Y - 34) ? 0.06 : 0), M_DUSK);
  line(cx - 1, Y - 34, cx - 1, fy - 3, 0.6, M_MAGIC);
  // ribcage motif in bone on the chest
  for (let k = 0; k < 4; k++) { const yy = Y - 42 + k * 3; line(cx - 1, yy, cx - 6, yy + 2, 0.82, M_UMBER); line(cx, yy, cx + 4, yy + 2, 0.6, M_UMBER); }
  rect(cx - 1, Y - 43, 2, 13, 0.85, M_UMBER);
  // spiked high collar behind the head
  poly([[cx + 2, Y - 46], [cx + 9, Y - 58], [cx + 7, Y - 50], [cx + 11, Y - 54], [cx + 6, Y - 44]], 0.3, M_DUSK);
  poly([[cx - 4, Y - 46], [cx - 9, Y - 57], [cx - 6, Y - 50], [cx - 10, Y - 52], [cx - 5, Y - 44]], 0.22, M_DUSK);
  // the raised casting arm (back), from under the far pauldron
  line(cx + 5, Y - 42, cx + 10, Y - 52, 0.3, M_DUSK); rect(cx + 9, Y - 55, 2, 3, 0.68, M_UMBER);
  // skull pauldrons
  for (const [px, d] of [[cx - 7, 1], [cx + 6, 0.75]]) { ellipse(px, Y - 45, 3.6, 3.2, (x) => (0.72 + 0.22 * clamp((px + 2 - x) / 5)) * d, M_UMBER); rect(px - 2, Y - 46, 1, 1, 0.05, M_STONE); rect(px + 1, Y - 46, 1, 1, 0.05, M_STONE); rect(px - 1, Y - 43, 3, 1, 0.4, M_UMBER); }
  // hood, spiked crown, gaunt face, arcane eyes
  poly([[cx - 5, Y - 56], [cx + 3, Y - 57], [cx + 5, Y - 50], [cx + 3, Y - 46], [cx - 5, Y - 46], [cx - 6, Y - 51]], (x) => 0.18 + 0.2 * clamp((x - cx + 6) / 11), M_DUSK);
  for (let k = 0; k < 4; k++) { const x = cx - 4 + k * 2.5; line(x, Y - 57, x - 1 + (k & 1), Y - 61 - (k === 1 || k === 2 ? 2 : 0), 0.7, M_STONE); }
  rect(cx - 5, Y - 57, 9, 1, 0.55, M_STONE);
  rect(cx - 4, Y - 54, 5, 7, (x) => 0.6 + 0.18 * clamp((cx + 1 - x) / 5), M_UMBER);
  put(cx - 4, Y - 52, 1, M_MAGIC, 1); put(cx - 2, Y - 52, 0.9, M_MAGIC, 1); rect(cx - 4, Y - 49, 3, 1, 0.2, M_UMBER); put(cx - 5, Y - 50, 0.35, M_UMBER);
  // staff with burning skull (front hand)
  const sx = cx - 13;
  for (let y = Y - 70; y < fy; y++) put(sx + (Math.floor(y / 4) & 1), y, 0.42 + (y & 1) * 0.1, M_UMBER);
  ellipse(sx + 0.5, Y - 73, 3.4, 3.2, 0.82, M_UMBER); rect(sx - 2, Y - 74, 1, 1, 0.05, M_STONE); rect(sx + 1, Y - 74, 1, 1, 0.05, M_STONE);
  for (let k = 0; k < 6; k++) { const ph = t * 9 + k * 1.7, h = 3 + Math.round(2 * (0.5 + 0.5 * Math.sin(ph))); for (let j = 0; j < h; j++) put(sx - 2 + k, Y - 77 - j, 1 - j * 0.12, M_MAGIC, 1); }
  rect(sx - 1, Y - 44, 3, 3, 0.66, M_UMBER);
  // raised casting hand (back), gathering souls (its arm is drawn under the pauldrons, above)
  const cast = o.cast || 0;
  for (let k = 0; k < 10; k++) { const q = (t * 0.7 + k / 10) % 1, r = (1 - q) * (14 + 10 * cast), an = k * 2.4 + t; put(Math.round(cx + 10 + Math.cos(an) * r), Math.round(Y - 54 + Math.sin(an) * r * 0.7), 0.5 + 0.5 * q, M_MAGIC, 1); }
  // soul wisps orbiting
  for (let k = 0; k < 3; k++) {
    const an = t * 1.1 + k * 2.09, x = cx + Math.cos(an) * 19, y = Y - 30 + Math.sin(an * 1.3) * 10;
    for (let j = 0; j < 4; j++) put(Math.round(x + Math.cos(an - 0.3 * j) * 2 * j * 0.6), Math.round(y + j), 0.95 - j * 0.18, M_MAGIC, 1);
  }
  EFX.necro = [cx + 10, Y - 54]; EFX.staff = [sx, Y - 75];
}
