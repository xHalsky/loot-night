// ===========================================================================
// THE FALLEN (#154, Paweł 2026-11-28): an enemy at 0 HP crumbles to the ground and leaves a corpse, a pile of iron
// bones of its own kind, that fades out after a while. The roster is iron under the cloth (the angels' iron, the
// Church's smiths), so every pile is iron bones and the pieces that make the figure itself: the Hollow's helm and
// greatsword, the Guardian's halo shield, the Revenant's heart-lens, the Penitent's head-cage and candle, the
// Confessor's grille and crozier, the Cherubs' wings, the Ironwing's struts, the Vigil's rotor, the Gravedigger's
// spade, and the bosses' own: the Gaoler's ball and chain, the Bellringer's bell, the Inquisitor's wings and sword,
// the Abbot's halo mace and banner. Lit from the upper left like the figures; the outline pass rings them.
//   The fall: the figure drawn as it stood, broken into 3 px chunks that drop under gravity (a little apart, staggered)
//   and pile up on the floor, its eye-lights going out; then its pile dithers in over them. A corpse dithers out at the
//   end. Every random is a hash of the corpse's seed: the same death looks the same every time.
// ===========================================================================
const PILE_LIFT = 1.45;   // the piles' iron values, lifted
const EMBER_SEC = 3.2;   // a pile's last ember (an eye, a heart-lens, a candle's wick) dies over this long
let CE_REC = null;   // while a pile is cached: its embers are noted (drawn live over the cached pile while they burn)
function cEmber(x, y, age, seed, big) {   // a crimson ember going out
  if (CE_REC) { CE_REC.push(x, y, seed, big ? 1 : 0); return; }
  const k = 1 - age / EMBER_SEC; if (k <= 0) return;
  const f = k * (0.7 + 0.3 * hash(Math.floor(age * 9), seed, 1501));
  put(x, y, 0.5 + 0.5 * f, M_DANGER, 1);
  if (big && k > 0.4) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(x + dx, y + dy, 0.3 + 0.35 * f, M_DANGER, 1);
}
// an iron bone lying on the floor: a rod with a knuckle at each end, lit along the top
function cBone(x0, y0, x1, y1, w = 2.6, d = 1) {
  limb(x0, y0, x1, y1, w, w * 0.9, 0.12 * d, 0.9 * d, M_STONE);
  for (const [x, y, r] of [[x0, y0, w * 0.75], [x1, y1, w * 0.65]]) { ellipse(Math.round(x) + 0.5, Math.round(y) + 0.5, r, r, (xx, yy) => (0.18 + 0.78 * clamp(1 - Math.hypot(xx - x + r * 0.4, yy - y + r * 0.4) / (r * 1.5))) * d, M_STONE); }
}
// a heap of iron bones: n bones crossed every way in a low mound w wide and h high, the lowest drawn first
function cHeap(cx, fy, w, h, n, seed, d = 1, thick = 2.6) {
  const bones = [];
  for (let k = 0; k < n; k++) {
    const u = (hash(k, 1, seed) * 2 - 1) * (0.55 + 0.45 * hash(k, 5, seed)), lift = (1 - u * u) * h * (0.25 + 0.75 * hash(k, 2, seed));
    const len = 7 + hash(k, 3, seed) * 7, an = (hash(k, 4, seed) - 0.5) * (k % 3 === 0 ? 2.2 : 0.9);
    bones.push([cx + u * w, fy - 1 - lift, len, an, thick * (0.8 + 0.3 * hash(k, 6, seed))]);
  }
  bones.sort((a, b) => b[1] - a[1]);   // the low ones first, the top of the heap last
  for (const [x, y, len, an, th] of bones) { const dx = Math.cos(an) * len / 2, dy = Math.sin(an) * len / 2; cBone(x - dx, y - dy, x + dx, y + dy, th, d); }
}
// a rib cage fallen on its side: the spine along the floor, ribs arching up and back over it
function cRibs(x0, y0, len, n, h, d = 1) {
  limb(x0, y0, x0 + len, y0 + 1, 2.6, 2.4, 0.12 * d, 0.84 * d, M_STONE); for (let x = x0 + 2; x < x0 + len; x += 3) put(x, y0 - 1, 0.95 * d, M_STONE);   // the spine, its vertebrae
  for (let k = 0; k < n; k++) {
    const sx = x0 + 2 + k * (len - 4) / Math.max(1, n - 1), hh = h * (1 - k * 0.12);
    for (let s = 0; s <= 12; s++) {
      const q = s / 12, x = sx + q * 4 - q * q * 2, y = y0 - Math.sin(q * Math.PI * 0.9) * hh;
      put(Math.round(x), Math.round(y), (q < 0.5 ? 0.95 : 0.7 - 0.2 * q) * d, M_STONE); put(Math.round(x) + 1, Math.round(y), 0.08 * d, M_STONE); put(Math.round(x), Math.round(y) + 1, 0.3 * d, M_STONE);
    }
  }
}
// the Hollow frame's iron skull lying on its side (eyes dark; its last ember going out)
function cSkull(x, y, age, seed, d = 1, jaw = true) {
  plate([[x - 4, y - 5], [x + 3, y - 6], [x + 5, y - 2], [x + 4, y + 2], [x - 3, y + 3], [x - 5, y - 1]], 0.16 * d, 0.86 * d, M_STONE, { edgeHi: 1 });
  rect(x - 4, y - 2, 2, 2, 0.02, M_DUSK); rect(x - 1, y - 2, 2, 2, 0.02, M_DUSK);
  rivets(x - 4, y - 4, x + 3, y - 5, 4, 0.92 * d);
  cEmber(x - 4, y - 2, age, seed);
  if (jaw) { plate([[x + 2, y + 2], [x + 8, y + 1], [x + 8, y + 3], [x + 3, y + 4]], 0.12 * d, 0.46 * d); for (let i = x + 3; i <= x + 7; i += 2) put(i, y + 2, 0.03, M_DUSK); }
}
// a great helm rolled on its side, the visor slit toward us, empty
function cHelm(x, y, d = 1, gilt = true) {
  const HL = [[x - 7, y - 3], [x - 4, y - 7], [x + 4, y - 7], [x + 7, y - 4], [x + 7, y + 3], [x - 6, y + 3]];
  plate(HL, 0.2 * d, 0.88 * d, M_STONE, { edgeHi: 1 });
  if (gilt) { line(x - 5, y - 6, x + 5, y - 6, 0.8 * d, M_UMBER); line(x - 5, y - 5, x + 5, y - 5, 0.4 * d, M_UMBER); }
  rect(x - 5, y - 2, 9, 2, 0.02, M_DUSK);
  line(x - 6, y + 1, x + 6, y + 1, 0.06 * d, M_STONE);
  rustPatch(x, y - 6, 6, 8, 1531, 0.55);
}
// a sword lying flat: the blade lit along its upper edge, a gilt crossguard, the grip and pommel
function cSword(x0, y0, x1, y1, d = 1, w = 1.4) {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
  for (let s = 0; s <= L; s++) { const x = x0 + ux * s, y = y0 + uy * s, ww = s > L - 3 ? 0.5 : w; for (let o2 = -ww; o2 <= ww; o2 += 0.5) put(Math.round(x + nx * o2), Math.round(y + ny * o2), (o2 < -0.4 ? 0.96 : o2 > 0.4 ? 0.28 : 0.6) * d, M_STONE); }
  for (let o2 = -3.5; o2 <= 3.5; o2 += 0.5) put(Math.round(x0 + nx * o2), Math.round(y0 + ny * o2), 0.74 * d, M_UMBER);
  line(x0 - ux * 4, y0 - uy * 4, x0, y0, 0.36 * d, M_UMBER); ellipse(x0 - ux * 5 + 0.5, y0 - uy * 5 + 0.5, 1.4, 1.4, 0.82 * d, M_UMBER);
  rustPatch(Math.round(x0 + ux * L * 0.45), Math.round(y0 + uy * L * 0.45) - 1, 4, 3, 1533, 0.5);
}
// a heap of cloth (a tabard, a robe, an oilskin): low, ragged, its folds dark
function cCloth(x0, x1, fy, h, seed, v = 0.22, mat = M_DUSK) {
  for (let x = x0; x <= x1; x++) {
    const q = (x - x0) / (x1 - x0 || 1), hh = Math.round(h * Math.sin(q * Math.PI) ** 0.6 + 1.5 * (hash(x >> 1, 1, seed) - 0.5));
    for (let j = 0; j <= hh; j++) put(x, fy - j, (v + 0.16 * (1 - q) + (j === hh ? 0.16 : 0) - ((x * 3 + j) % 7 === 0 ? 0.06 : 0)), mat);
  }
}
// iron bits and rivets strewn on the floor round a pile
function cBits(cx, fy, w, n, seed, d = 1) {
  for (let k = 0; k < n; k++) { const x = Math.round(cx - w + hash(k, 1, seed) * 2 * w), l = 1 + Math.floor(hash(k, 2, seed) * 3); for (let i = 0; i < l; i++) put(x + i, fy, (i === 0 ? 0.7 : 0.3) * d, M_STONE); }
}
// a kite shield lying tilted: dark wine field, iron rim, the broken halo painted in bone; cracked when broken
function cKite(x, y, w, d = 1, cracked = false, seed = 0) {
  const S = [[x, y], [x + w, y - 2], [x + w + 2, y + w * 0.5], [x + w * 0.4, y + w * 0.62], [x - 3, y + w * 0.4]].map(([a, b]) => [Math.round(a), Math.round(b)]);
  plate(S, 0.18 * d, 0.4 * d, M_DUSK, { grain: true, edge: false });
  litEdges(S, 0.84 * d, 0.12 * d, M_STONE);
  brokenHalo(x + w * 0.48, y + w * 0.22, w * 0.27, 0.9 * d, M_UMBER, 0, { w: 1, spark: false });
  if (cracked) { let px = x + w * 0.55, py = y - 1; for (let s = 0; s < w * 0.6; s++) { px += hash(s, 1, seed) > 0.5 ? 1 : 0; py += 1; put(Math.round(px), Math.round(py), 0.02, M_DUSK); } }
  rustPatch(Math.round(x + 1), Math.round(y + w * 0.25), Math.round(w * 0.5), 4, 1537, 0.55);
}

// ---------------------------------------------------------------- the piles, one per kind (cx where it stood, fy its floor)
const PILE = {
  // the Hollow: a heap of his iron frame on his tabard, the rib cage on top, his great helm rolled toward the party,
  // the greatsword across the front, the kite shield half under the heap
  hollow(cx, fy, age, s) {
    cCloth(cx - 15, cx + 14, fy, 3, s);
    cKite(cx + 7, fy - 12, 12, 0.85, false, s);
    cHeap(cx, fy, 11, 7, 7, s);
    cRibs(cx - 6, fy - 6, 13, 4, 7);
    cHelm(cx - 15, fy - 5);
    cSword(cx - 1, fy, cx - 30, fy - 2);
    cBits(cx, fy, 20, 5, s);
  },
  // the Guardian: the same heap under his great shield, face up, the broken halo on it, cracked through
  guardian(cx, fy, age, s) {
    cCloth(cx - 15, cx + 14, fy, 3, s);
    cHeap(cx + 2, fy, 12, 6, 7, s);
    cHelm(cx - 17, fy - 4, 0.95);
    cKite(cx - 8, fy - 13, 18, 1, true, s);
    cSword(cx + 9, fy, cx + 28, fy - 3, 0.85);
    cBits(cx, fy, 20, 5, s);
  },
  // the Revenant: the bare frame come apart, rods and joints in a high heap, the rib cage split open round the
  // heart-lens going dark, the riveted iron skull, the greatsword
  revenant(cx, fy, age, s) {
    cSword(cx + 2, fy, cx + 27, fy - 1, 0.8);
    cHeap(cx, fy, 13, 9, 9, s);
    cRibs(cx - 7, fy - 7, 13, 4, 8);
    rect(cx - 1, fy - 11, 3, 3, 0.4, M_DANGER, 1); cEmber(cx, fy - 10, age, s, true);
    cSkull(cx - 16, fy - 4, age, s + 1);
    cBits(cx, fy, 20, 6, s);
  },
  // the Penitent: his robe in a heap, his iron bones on it, the head-cage rolled off with the candle stub fallen out
  // (snuffed, a last thread of smoke), the scourge with its iron weights
  penitent(cx, fy, age, s) {
    cCloth(cx - 11, cx + 15, fy, 6, s, 0.16);
    cHeap(cx + 2, fy - 2, 10, 5, 6, s, 1, 2.2);
    const hx = cx - 14, hy = fy - 5;   // the cage, rolled over
    for (let x = hx - 4; x <= hx + 4; x += 2) for (let y = hy - 3; y <= hy + 4; y++) put(x, y, x <= hx ? 0.92 : 0.55, M_STONE);
    for (let x = hx - 4; x <= hx + 4; x++) { put(x, hy - 4, x <= hx ? 0.9 : 0.6, M_STONE); put(x, hy + 4, 0.4, M_STONE); }
    rect(hx + 5, hy - 2, 4, 2, (x) => (x === hx + 5 ? 0.96 : 0.76), M_UMBER);   // the candle stub, fallen out sideways
    for (let c = 0; c < 3; c++) { let px = cx + 8, py = fy - 1; for (let k = 1; k <= 8; k++) { const x = cx + 8 + k * 1.6, y = fy - 1 + Math.sin(k * 0.9 + c) * 1.2 - c * 0.6; line(px, py, x, y, 0.62, M_UMBER); px = x; py = y; } put(Math.round(px), Math.round(py), 0.95, M_STONE); put(Math.round(px) + 1, Math.round(py), 0.45, M_STONE); }
    cBits(cx, fy, 16, 3, s);
  },
  // the Confessor: his tall robe fallen flat, the gilt stole across it, his bones, the iron grille of his face with
  // the glow behind it going out, the serpent crozier across the front, the censer breathing its last smoke
  confessor(cx, fy, age, s) {
    cCloth(cx - 16, cx + 12, fy, 5, s, 0.18);
    for (let x = cx - 12; x <= cx + 8; x++) put(x, fy - 4 + Math.round(Math.sin(x * 0.3) * 0.6), x & 1 ? 0.84 : 0.6, M_UMBER);
    cHeap(cx - 1, fy - 3, 9, 5, 5, s, 1, 2.2);
    const gx = cx - 18, gy = fy - 7;   // the grille, lying tilted
    for (let y = gy - 3; y <= gy + 3; y++) for (let x = gx - 3; x <= gx + 3; x++) { const lat = (x + y) % 3 === 0 || (x - y + 30) % 3 === 0; put(x, y, lat ? (x < gx ? 0.8 : 0.55) : 0.03, lat ? M_STONE : M_DUSK); }   // its glow: PILE_HOT
    frameLine(gx - 4, gy - 4, 9, 9);
    for (let x = cx - 26; x <= cx + 6; x++) put(x, fy - 1 + (x > cx - 4 ? 0 : -1), 0.5 + (x & 1) * 0.16, M_UMBER);   // the crozier's shaft
    for (let k = 0; k <= 20; k++) { const q = k / 20, an = Math.PI - q * 4.2, r = 5 - q * 2.5, x = cx - 28 + Math.cos(an) * r, y = fy - 5 + Math.sin(an) * r; put(Math.round(x), Math.round(y), 0.8 - 0.35 * q, M_STONE); }
    cEmber(cx - 33, fy - 5, age, s + 3);
    const nx = cx + 14, ny = fy - 2;   // the censer
    ellipse(nx + 0.5, ny + 0.5, 2.6, 2.2, (x) => 0.45 + 0.45 * clamp((nx + 2 - x) / 5), M_UMBER); line(nx - 2, ny - 2, nx - 8, ny - 3, 0.6, M_STONE);
  },
  // a Cherub: a broken iron wing, its little iron bones, the porcelain head cracked and face down, its halo on its side
  cherub(cx, fy, age, s) {
    for (let k = 0; k < 4; k++) { const a = 0.15 + k * 0.2, L = 11 - k * 1.8; for (let q = 1; q <= L; q++) { const px = Math.round(cx + 2 + Math.cos(a) * q), py = Math.round(fy - 1 - Math.sin(a) * q * 0.55 - k * 0.5); put(px, py, (q >= L - 1 ? 0.98 : 0.72 - 0.08 * k), M_STONE); put(px, py + 1, 0.12, M_STONE); } }
    cBone(cx - 1, fy - 1, cx + 5, fy - 2, 1.8); cBone(cx + 3, fy - 1, cx + 7, fy + 0, 1.6);
    ellipse(cx - 2.5, fy - 2.5, 3.6, 3, (x, y) => 0.76 + 0.22 * clamp((cx - x) / 6) - 0.1 * clamp((y - fy + 3) / 3), M_UMBER);
    line(cx - 4, fy - 5, cx - 2, fy - 1, 0.22, M_UMBER);   // the crack
    rect(cx - 4, fy - 2, 2, 1, 0.04, M_DUSK);
    for (let k = 0; k < 14; k++) { const an = k / 14 * 6.283; if (an > 5 && an < 5.8) continue; put(Math.round(cx - 8 + Math.cos(an) * 1.4), Math.round(fy - 3 + Math.sin(an) * 3), Math.cos(an) < 0 ? 0.95 : 0.6, M_STONE); }
  },
  // the Ironwing: crashed, its wings' iron finger-struts splayed on the floor with the black leather torn between
  // them, the cage of ribs round the heart-lens going dark, the iron skull with its blade ears
  ironwing(cx, fy, age, s) {
    // the far wing broken upward, its struts fanned against the dark; the near one flat on the floor
    const strut = (ang, L, k, flat) => [cx + Math.cos(ang) * L, fy - 2 + Math.sin(ang) * L * (flat ? 0.35 : 1)];
    for (const [a0, da, flat] of [[-0.55, -0.24, false], [Math.PI + 0.12, 0.16, true]]) for (let k = 0; k < 4; k++) {
      const L = 16 - k * 2.4, [ex, ey] = strut(a0 + da * k, L, k, flat);
      if (k < 3) { const [fx, fy2] = strut(a0 + da * (k + 1), 16 - (k + 1) * 2.4, k, flat); polyF([[cx, fy - 2], [ex, ey], [fx, fy2]], (x, y) => (hash(x, y, s + k) < 0.14 ? null : 0.22 + 0.12 * (x & 1)), M_DUSK); }
      line(cx, fy - 2, ex, ey, (flat ? 0.8 : 1) - k * 0.1, M_STONE); put(Math.round(ex), Math.round(ey), 1, M_STONE); put(Math.round(ex), Math.round(ey) + 1, 0.4, M_STONE);
    }
    cHeap(cx + 1, fy - 1, 5, 3, 3, s, 1, 2);
    cRibs(cx - 4, fy - 3, 8, 3, 5);
    cEmber(cx, fy - 5, age, s, true);
    const hx = cx - 10, hy = fy - 4;   // the skull with its blade ears
    plate([[hx - 4, hy - 2], [hx + 2, hy - 3], [hx + 4, hy + 1], [hx - 3, hy + 2]], 0.18, 0.84, M_STONE, { edgeHi: 1 });
    poly([[hx - 2, hy - 2], [hx, hy - 8], [hx + 1, hy - 2]], 0.92, M_STONE); poly([[hx + 1, hy - 3], [hx + 4, hy - 7], [hx + 3, hy - 2]], 0.6, M_STONE);
    put(hx - 3, hy, 0.03, M_DUSK); put(hx - 4, hy + 1, 0.95, M_STONE); put(hx - 2, hy + 1, 0.95, M_STONE);
  },
  // the Vigil: its rotor of iron feathers broken and fanned out, the riveted drum on its side, the fallen angel's eye
  // in its broken-halo window going dark, the hooked blades on their chains
  vigil(cx, fy, age, s) {
    for (let k = 0; k < 7; k++) { const an = Math.PI * (0.05 + k * 0.13), L = 13 - (k % 3) * 2, ex = cx + 4 + Math.cos(an) * L, ey = fy - 2 - Math.sin(an) * L * 0.5; ironBar([[cx + 4, fy - 2], [ex, ey]], 2, k % 2 ? 0.85 : 1.05); }
    const dx = cx - 4, dy = fy - 5;   // the drum
    ellipse(dx + 0.5, dy + 0.5, 6, 5, (x) => 0.22 + 0.62 * clamp((dx + 6 - x) / 12), M_STONE);
    rivets(dx - 4, dy - 3, dx + 4, dy - 3, 5, 0.98);
    brokenHalo(dx + 0.5, dy + 0.5, 3.2, 0.92, M_UMBER, 0, { w: 1, spark: false });
    cEmber(dx, dy, age, s, true);
    chainLinks([[cx - 9, fy - 2], [cx - 16, fy - 1]], 1.2); poly([[cx - 20, fy - 1], [cx - 16, fy - 4], [cx - 15, fy - 1]], 0.95, M_STONE);
    chainLinks([[cx + 10, fy - 1], [cx + 17, fy]], 1.2); poly([[cx + 17, fy], [cx + 21, fy - 3], [cx + 21, fy]], 0.7, M_STONE);
  },
  // the Gravedigger: his iron bones in a big heap on the black oilskin, his coffin-lid face-plate on top with its slit,
  // the pick, the cage lantern on its side gone dark, and his great grave-spade driven into the floor where he fell
  gravedigger(cx, fy, age, s) {
    ironBar([[cx + 13, fy + 1], [cx + 18, fy - 28]], 2.6, 1.05);   // the spade's haft, standing
    poly([[cx + 10, fy + 1], [cx + 17, fy + 1], [cx + 16, fy - 8], [cx + 11, fy - 8]], (x) => 0.25 + 0.68 * clamp((cx + 17 - x) / 7), M_STONE);
    line(cx + 10, fy, cx + 17, fy, 1, M_STONE);
    rect(cx + 16, fy - 32, 5, 2, 0.8, M_STONE);
    cCloth(cx - 17, cx + 11, fy, 6, s, 0.1);
    cHeap(cx - 3, fy - 1, 13, 9, 10, s, 1, 3);
    plate([[cx - 7, fy - 15], [cx + 2, fy - 17], [cx + 4, fy - 10], [cx - 5, fy - 8]], 0.25, 0.62, M_UMBER);   // the coffin-lid plate
    line(cx - 5, fy - 13, cx + 2, fy - 14, 0.03, M_DUSK); rivets(cx - 6, fy - 10, cx + 3, fy - 11, 3, 0.95);
    cEmber(cx - 3, fy - 13, age, s);
    const lx = cx - 22, ly = fy - 5;   // the lantern, on its side
    rect(lx, ly, 7, 5, 0.04, M_DUSK); for (const y of [ly, ly + 2, ly + 4]) for (let x = lx; x < lx + 7; x++) put(x, y, y === ly ? 0.92 : 0.5, M_STONE);
    line(cx + 2, fy - 3, cx - 15, fy - 10, 0.66, M_UMBER); poly([[cx - 18, fy - 13], [cx - 14, fy - 9], [cx - 17, fy - 7]], 0.86, M_STONE);   // the pick
    cBits(cx, fy, 24, 6, s);
  },
  // the Gaoler: a giant's bones in a long heap on his leather, the great iron ball sunk where it dropped with its chain
  // coiled beside it, his iron muzzle with its embers going out, the ring of keys and the broken manacle
  gaoler(cx, fy, age, s) {
    cCloth(cx - 30, cx + 18, fy, 6, s, 0.16, M_UMBER);
    cHeap(cx - 6, fy - 1, 22, 13, 16, s, 1, 3.6);
    cRibs(cx - 18, fy - 10, 22, 6, 11);
    const bx = cx + 26, by = fy - 9;   // the ball
    ellipse(bx + 0.5, by + 0.5, 9.5, 9.5, (x, y) => 0.14 + 0.78 * clamp(1 - Math.hypot(x - bx + 4, y - by + 4) / 13), M_STONE);
    rivets(bx - 6, by - 3, bx + 2, by - 7, 4, 1); line(bx - 8, by + 3, bx + 6, by + 7, 0.06, M_STONE);
    chainLinks(sag(bx - 8, by + 4, cx - 2, fy - 2, 3, 20), 1.2);
    const mx = cx - 32, my = fy - 6;   // the muzzle
    plate([[mx - 6, my - 4], [mx + 5, my - 5], [mx + 6, my + 3], [mx - 5, my + 4]], 0.18, 0.86, M_STONE, { edgeHi: 1 });
    for (let x = mx - 4; x <= mx + 4; x += 2) line(x, my - 3, x, my + 3, 0.04, M_DUSK);
    cEmber(mx - 2, my - 1, age, s, true);
    for (let k = 0; k < 4; k++) ellipse(cx + 6 + k * 3.5, fy - 1, 1.6, 1.2, 0.84, M_UMBER);   // the keys
    for (let k = 0; k < 18; k++) { const an = k / 18 * 6.283; put(Math.round(cx - 12 + Math.cos(an) * 3), Math.round(fy - 2 + Math.sin(an) * 1.6), Math.cos(an) < 0 ? 0.95 : 0.5, M_STONE); }
    cBits(cx, fy, 38, 10, s);
  },
  // the Bellringer: his great iron bell fallen on its side and cracked through the broken halo cast on it, the yoke
  // snapped, the rope in a coil, his bones in a heap and the white band of his eyes
  bellringer(cx, fy, age, s) {
    cCloth(cx - 26, cx + 4, fy, 4, s, 0.16);
    cHeap(cx - 14, fy - 1, 12, 8, 9, s, 1, 3);
    const bx = cx + 8, by = fy - 12;   // the bell on its side: crown to the right, mouth to the left
    poly([[bx + 14, by - 8], [bx + 14, by + 8], [bx - 6, by + 12], [bx - 9, by + 11], [bx - 9, by - 11], [bx - 6, by - 12]], (x, y) => 0.16 + 0.7 * clamp(1 - (y - by + 12) / 26) * (0.6 + 0.4 * clamp((bx + 14 - x) / 23)), M_STONE);
    ellipse(bx - 8.5, by + 0.5, 3, 11.5, 0.03, M_DUSK);   // its mouth
    for (let y = by - 11; y <= by + 11; y++) put(bx - 9 - (Math.abs(y - by) < 10 ? 1 : 0), y, 0.92, M_STONE);
    brokenHalo(bx + 4, by, 5, 0.96, M_UMBER, 0, { w: 1, spark: false });
    { let px = bx + 2, py = by - 9; for (let k = 0; k < 18; k++) { px += hash(k, 1, s) > 0.35 ? 0 : 1; py += 1; put(Math.round(px), Math.round(py), 0.02, M_DUSK); } }   // the crack
    rect(bx + 14, by - 3, 4, 6, (x) => (x === bx + 14 ? 0.9 : 0.5), M_STONE);
    ironBar([[cx - 28, fy - 1], [cx - 8, fy - 14]], 2.6, 0.95, true);   // the yoke, snapped
    for (let k = 0; k < 26; k++) { const an = k / 26 * 6.283 * 1.6, r = 5 - k * 0.12; put(Math.round(cx - 8 + Math.cos(an) * r * 1.6), Math.round(fy - 2 + Math.sin(an) * r * 0.5), 0.66 + 0.2 * (k & 1), M_UMBER); }   // the rope
    rect(cx - 32, fy - 4, 7, 2, 0.96, M_UMBER); cEmber(cx - 30, fy - 4, age, s); cEmber(cx - 27, fy - 4, age, s + 1);   // the white band, its embers
    cBits(cx, fy, 32, 8, s);
  },
  // the Inquisitor: his angel-iron wings collapsed flat on the floor, blade-feathers fanned out, his bones heaped
  // between the massive pauldrons, the angel-masked helm face up with its closed eyes going dark, the tower shield
  // cracked, and the headsman's sword lying its whole length in front
  inquisitor(cx, fy, age, s) {
    // the far wing broken upward behind the heap, its blade-feathers fanned; the near one flat on the floor
    for (let k = 0; k < 6; k++) {
      const ang = -0.35 - k * 0.15, L = 30 - k * 2.5, ex = cx + 6 + Math.cos(ang) * L, ey = fy - 6 + Math.sin(ang) * L * 0.8;
      poly([[cx + 6, fy - 7], [ex, ey], [ex - 2, ey + 3], [cx + 6, fy - 4]], (x) => 0.2 + 0.46 * clamp((cx + 36 - x) / 30) - (k & 1 ? 0.07 : 0), M_STONE);
      line(cx + 6, fy - 7, ex, ey, 0.96 - k * 0.07, M_STONE);
    }
    for (let k = 0; k < 6; k++) {
      const ang = Math.PI + 0.06 + k * 0.1, L = 32 - k * 3, ex = cx + 4 + Math.cos(ang) * L, ey = fy - 3 - Math.abs(Math.sin(ang)) * L * 0.45;
      poly([[cx + 4, fy - 4], [ex, ey - 1], [ex - 3, ey + 1], [cx + 4, fy - 2]], (x) => 0.24 + 0.5 * clamp((cx + 32 - x) / 64) - (k & 1 ? 0.07 : 0), M_STONE);
      line(cx + 4, fy - 4, ex, ey - 1, 0.95 - k * 0.06, M_STONE);
    }
    cCloth(cx - 12, cx + 18, fy, 5, s, 0.12);
    cHeap(cx + 2, fy - 2, 12, 7, 10, s, 1, 3.2);
    cKite(cx + 12, fy - 14, 14, 0.9, true, s);
    for (const [px, d] of [[cx - 7, 1], [cx + 8, 0.8]]) { const DM = Array.from({ length: 14 }, (_, k) => { const a = Math.PI + k / 13 * Math.PI; return [px + Math.cos(a) * 8, fy - 5 + Math.sin(a) * 6]; }); poly(DM, (x) => (0.16 + 0.72 * clamp((px + 8 - x) / 16)) * d, M_STONE); line(px - 8, fy - 5, px + 8, fy - 5, 0.88 * d, M_UMBER); rect(px - 2, fy - 14, 5, 4, (x) => (x === px - 2 ? 0.96 : 0.5) * d, M_STONE); }
    const hx = cx - 19, hy = fy - 7;   // the helm, its angel mask to the sky
    ellipse(hx + 0.5, hy + 0.5, 6, 5, (x, y) => 0.22 + 0.74 * clamp(1 - Math.hypot(x - hx + 2, y - hy + 2) / 8), M_STONE);
    line(hx - 3, hy - 1, hx - 1, hy - 1, 0.04, M_DUSK); line(hx + 1, hy - 1, hx + 3, hy - 1, 0.04, M_DUSK); cEmber(hx - 2, hy, age, s); cEmber(hx + 2, hy, age, s + 1);
    brokenHalo(hx + 0.5, hy - 1.5, 7.5, 0.9, M_UMBER, 0, { w: 1, spark: false });
    cSword(cx - 2, fy + 1, cx - 46, fy - 1, 1, 2);
    cBits(cx, fy, 42, 9, s);
  },
  // the Abbot: his bones heaped on the black habit, the gilt-rimmed pauldrons, the cowled head with its iron jaw,
  // the halo mace dropped beside him, the ledger on its chain, and his banner fallen across the floor
  abbot(cx, fy, age, s) {
    ironBar([[cx + 32, fy - 1], [cx + 4, fy - 15]], 2.2, 0.95);   // the banner, fallen
    poly([[cx + 10, fy - 12], [cx + 26, fy - 4], [cx + 22, fy], [cx + 6, fy - 5]], (x, y) => 0.24 + 0.2 * clamp((cx + 26 - x) / 20) - ((x + y) % 5 === 0 ? 0.06 : 0), M_DUSK);
    brokenHalo(cx + 16, fy - 6, 3.6, 0.92, M_UMBER, 0, { w: 1, spark: false });
    cCloth(cx - 24, cx + 10, fy, 6, s, 0.12);
    cHeap(cx - 7, fy - 1, 15, 10, 12, s, 1, 3.2);
    for (const [px, d] of [[cx - 5, 1], [cx + 6, 0.8]]) { const DM = Array.from({ length: 12 }, (_, k) => { const a = Math.PI + k / 11 * Math.PI; return [px + Math.cos(a) * 6, fy - 5 + Math.sin(a) * 5]; }); poly(DM, (x) => (0.16 + 0.68 * clamp((px + 6 - x) / 12)) * d, M_STONE); line(px - 6, fy - 5, px + 6, fy - 5, 0.9 * d, M_UMBER); }
    const hx = cx - 24, hy = fy - 7;   // the cowl and the iron jaw
    poly([[hx - 6, hy + 5], [hx - 5, hy - 3], [hx, hy - 6], [hx + 5, hy - 3], [hx + 6, hy + 5]], (x) => 0.16 + 0.22 * clamp((hx + 6 - x) / 12), M_DUSK);
    ellipse(hx + 0.5, hy + 1.5, 3, 3, 0.46, M_UMBER); plate([[hx - 3, hy + 3], [hx + 3, hy + 3], [hx + 2, hy + 6], [hx - 2, hy + 6]], 0.2, 0.78);
    cEmber(hx - 1, hy + 1, age, s); cEmber(hx + 1, hy + 1, age, s + 1);
    haloMace(cx - 38, fy - 6, 4, 1, 0.4); ironBar([[cx - 34, fy - 4], [cx - 16, fy - 1]], 2, 0.95);
    rect(cx + 4, fy - 3, 7, 3, (x) => (x === cx + 4 ? 0.6 : 0.3), M_UMBER); chainLinks([[cx + 3, fy - 2], [cx - 2, fy - 4]]);   // the ledger
    cBits(cx, fy, 38, 9, s);
  },
};

// what moves on a pile while it is fresh (drawn live over the cached pile): the Penitent's last thread of candle smoke,
// the Confessor's glow behind his grille and his censer's last smoke. Same places as in the piles above.
const HOT_SEC = 4.8;
const PILE_HOT = {
  penitent(cx, fy, age) {
    const hx = cx - 14, hy = fy - 5, k0 = 1 - age / HOT_SEC;
    for (let k = 0; k < 6; k++) { const q = (age * 0.8 + k / 6) % 1, X = hx + 9 + Math.round(Math.sin(q * 6 + k) * 1.5), Y = hy - 3 - Math.round(q * 14); if (lgB(X, Y) < 0.55 * k0) put(X, Y, 0.55, M_STONE, 1); }
  },
  confessor(cx, fy, age) {
    const gx = cx - 18, gy = fy - 7, g = 1 - age / EMBER_SEC;
    if (g > 0) for (let y = gy - 3; y <= gy + 3; y++) for (let x = gx - 3; x <= gx + 3; x++) if (!((x + y) % 3 === 0 || (x - y + 30) % 3 === 0)) put(x, y, 0.3 + 0.45 * g * clamp(1 - Math.hypot(x - gx, y - gy) / 4), M_DANGER, 1);
    const nx = cx + 14, ny = fy - 2;
    if (age < 3) for (let k = 0; k < 5; k++) { const q = (age * 0.6 + k / 5) % 1; if (q < 1 - age / 3) put(Math.round(nx + Math.sin(q * 7 + k) * 2 + q * 3), Math.round(ny - 3 - q * 18), 0.8 - q * 0.5, M_MAGIC, 1); }
  },
};
// a pile is drawn once, into its own small buffer, and kept: its pixels relative to where it lies (it moves with the
// floor, so its grain moves with it), already lifted; its embers noted
const PILE_CACHE = new Map();
let PILE_BUF = null;
function pileOf(look, s) {
  const key = look + '|' + s; let pc = PILE_CACHE.get(key); if (pc) return pc;
  if (PILE_CACHE.size > 48) PILE_CACHE.clear();
  const bw = 240, bh = 80, ox = 120, oy = 74, prev = B, pm = MAT, pe = EMI, pt = TAG, pd = DXV;
  if (!PILE_BUF) PILE_BUF = mkBuf(bw, bh, true);
  clearFrame(PILE_BUF); bind(PILE_BUF); MAT = M_STONE; EMI = 0; DXV = 0; TAG = 1;
  CE_REC = []; (PILE[look] || PILE.hollow)(ox, oy, 99, s); const embers = CE_REC; CE_REC = null;
  TAG = pt; MAT = pm; EMI = pe; DXV = pd; bind(prev);
  const B2 = PILE_BUF, xs = [], ys = [], V = [], M = [], E = [], DX = [];
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const i = y * bw + x; if (!B2.T[i]) continue; xs.push(x - ox); ys.push(y - oy); M.push(B2.M[i]); E.push(B2.E[i]); DX.push(B2.DX[i]); V.push(B2.E[i] ? B2.V[i] : Math.min(1, B2.V[i] * PILE_LIFT)); }
  for (let k = 0; k < embers.length; k += 4) { embers[k] -= ox; embers[k + 1] -= oy; }
  pc = { xs, ys, V, M, E, DX, embers }; PILE_CACHE.set(key, pc); return pc;
}
// ---------------------------------------------------------------- the fall and the fade
// What a buffer region held, so a figure or a pile can be drawn, read off and the region put back (its pixels then
// written again where they fall, or only where the dither shows them)
let CS_SNAP = null;
function csDraw(F, x0, y0, w, h, tag, draw) {
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); const x1 = Math.min(W, x0 + w), y1 = Math.min(H, y0 + h);
  if (x1 <= x0 || y1 <= y0) return [];
  const n = (x1 - x0) * (y1 - y0);
  if (!CS_SNAP || CS_SNAP.n < n) CS_SNAP = { n, V: new Float32Array(n), M: new Uint8Array(n), E: new Uint8Array(n), T: new Uint8Array(n), A: new Uint8Array(n), DX: new Int16Array(n), I: new Int16Array(n), G: new Float32Array(n), X: new Float32Array(n) };
  const S_ = CS_SNAP, FV = F.V, FM = F.M, FE = F.E, FT = F.T, FA = F.A, FD = F.DX, FI = F.I, FG = F.G, FX = F.X;
  let k = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++, k++) { const i = y * W + x; S_.V[k] = FV[i]; S_.M[k] = FM[i]; S_.E[k] = FE[i]; S_.T[k] = FT[i]; S_.A[k] = FA[i]; S_.DX[k] = FD[i]; S_.I[k] = FI[i]; S_.G[k] = FG[i]; S_.X[k] = FX[i]; }
  const cand = AOJ.candles ? AOJ.candles.length : 0, lamps = AOJ.lamps ? AOJ.lamps.length : 0;
  TAG = tag; draw(); TAG = 0;
  if (AOJ.candles) AOJ.candles.length = cand; if (AOJ.lamps) AOJ.lamps.length = lamps;   // a fallen figure's candles are out
  const px = [];
  k = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++, k++) {
    const i = y * W + x;
    if (FT[i] === tag) px.push(x, y, FV[i], FM[i], FE[i], FD[i]);
    FV[i] = S_.V[k]; FM[i] = S_.M[k]; FE[i] = S_.E[k]; FT[i] = S_.T[k]; FA[i] = S_.A[k]; FD[i] = S_.DX[k]; FI[i] = S_.I[k]; FG[i] = S_.G[k]; FX[i] = S_.X[k];
  }
  return px;
}
function csPut(F, x, y, p, q, tag) {   // one read-off pixel written back at (x, y)
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = y * W + x; F.V[i] = p[q + 2]; F.M[i] = p[q + 3]; F.E[i] = p[q + 4]; F.T[i] = tag; F.A[i] = 1; F.DX[i] = p[q + 5];
}
// a corpse: c from the game's view (look, x, lane, fly, k 0..1 through the fall, fade 0..1 at its end, age in seconds,
// seed); the fall's gravity runs on the age (620 px/s²)
function drawCorpse(F, c, t, lights, tag) {
  const fy = LANE[c.lane] || CHAR_Y, x = Math.round(c.x), s = c.seed | 0;
  const big = c.boss || c.look === 'abbot', bw = big ? 200 : c.look === 'cherub' ? 50 : 110, bh = big ? 170 : 130;
  const pileIn = clamp((c.k - 0.62) / 0.36), pileOut = c.fade;
  // the pile: dithered in over the falling pieces, dithered out at the end; its iron a little lifted (it lies low, where
  // the crypt's light hardly reaches) and caught by a soft cold light, as the loot on the floor is
  if (pileIn > 0 && pileOut < 1) {
    const pc = pileOf(c.look, s), all = pileIn >= 1 && pileOut <= 0;
    for (let q = 0; q < pc.xs.length; q++) {
      const X = x + pc.xs[q], Y = fy + pc.ys[q]; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      if (!all) { const b = lgB(X, Y); if (b >= pileIn || b < pileOut) continue; }
      const i = Y * W + X; F.V[i] = pc.V[q]; F.M[i] = pc.M[q]; F.E[i] = pc.E[q]; F.DX[i] = pc.DX[q]; F.T[i] = tag; F.A[i] = 1;
      if (c.back) { F.G[i] *= 0.62; if (!pc.E[q]) F.V[i] *= 0.9; }
    }
    if (c.age < HOT_SEC && pileOut <= 0) {   // the embers going out, the last smoke
      TAG = tag; for (let k = 0; k < pc.embers.length; k += 4) cEmber(x + pc.embers[k], fy + pc.embers[k + 1], c.age, pc.embers[k + 2], pc.embers[k + 3]);
      if (PILE_HOT[c.look]) PILE_HOT[c.look](x, fy, c.age, s); TAG = 0;
    }
    lights.push({ x: x - 4, y: fy - 10, r: big ? 56 : 30, i: (big ? 0.55 : 0.45) * pileIn * (1 - pileOut), c: [0.85, 0.95, 1.25] });
  }
  if (c.k >= 1) return;
  // the fall: the figure as it stood, broken into chunks that drop, spread a little and pile up; its lights go out
  const f = { look: c.look, x, fly: c.fly, n: c.n, ph: 0, back: c.back, boss: c.boss, bodies: 1, pose: {} };
  const px = csDraw(F, x - bw / 2, fy - bh + 6, bw, bh, tag, () => {
    if (c.look === 'cherub') cherub(x, fy - c.fly, t, c.n); else drawFoe(f, x, fy, t, t, []);
  });
  if (!px.length) return;
  let top = 1e9; for (let q = 1; q < px.length; q += 6) top = Math.min(top, px[q]);
  const sec = c.age, spread = big ? 16 : c.look === 'cherub' ? 5 : 9, dark = clamp((c.k - 0.15) / 0.3);
  for (let q = 0; q < px.length; q += 6) {
    const X = px[q], Y = px[q + 1], cxk = (X + (hash(Y >> 2, 0, s) * 2 | 0)) >> 2, cyk = (Y - top) >> 2;
    const h1 = hash(cxk, cyk, s), h2 = hash(cxk, cyk, s + 7), h3 = hash(cxk, cyk, s + 13);
    const start = 0.04 + 0.2 * h1 + 0.09 * clamp((fy - Y) / 80), tau = Math.max(0, sec - start);   // seconds: the high pieces a little first
    const bottom = top + cyk * 4 + 3, land = fy - 1 - Math.floor(h2 * (big ? 7 : 4));
    const drop = Math.min(0.5 * 620 * tau * tau, Math.max(0, land - bottom)), sideK = Math.min(1, tau / 0.35);
    const nx = Math.round(X + ((h3 - 0.5) * 2 * spread + Math.sign(X - x) * spread * 0.4) * sideK), ny = Math.round(Y + drop);
    if (lgB(nx, ny) < pileIn) continue;   // the pile is taking its place
    csPut(F, nx, ny, px, q, tag);
    if (c.back && nx >= 0 && ny >= 0 && nx < W && ny < H) { const i = ny * W + nx; F.G[i] *= 0.62; if (!px[q + 4]) F.V[i] *= 0.9; }
    if (dark > 0 && px[q + 4]) { const i = ny * W + nx; if (nx >= 0 && ny >= 0 && nx < W && ny < H) { F.V[i] *= 1 - 0.7 * dark; if (dark >= 1) F.E[i] = 0; } }   // the eyes go out
  }
  // dust where the pieces land
  const dk = clamp((c.k - 0.3) / 0.5);
  if (dk > 0 && dk < 1) for (let k = 0; k < (big ? 26 : 12); k++) {
    const dx = (hash(k, 1, s) - 0.5) * (big ? 70 : 34), up = dk * (3 + hash(k, 2, s) * 7), X = Math.round(x + dx * (0.6 + 0.4 * dk)), Y = Math.round(fy - 1 - up);
    if (lgB(X, Y) < 0.6 * (1 - dk)) put(X, Y, 0.32, M_STONE);
  }
  if (c.k < 0.5) lights.push({ x, y: fy - 20, r: big ? 60 : 30, i: 0.25 * (1 - c.k * 2), c: [1.4, 0.6, 0.6] });   // its eye-lights' last glow
}
