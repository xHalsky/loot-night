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
