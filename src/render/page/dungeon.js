// ===========================================================================
// SHADOW CRYPT — dark baroque ossuary. Side-view walk, potion-cart event.
// planes: far catacomb 0.3 · ossuary arcade 0.7 · floor 0.7→1.16 (per-row) ·
//         party 1.0 · ground mist · foreground 1.45
// light:  warm candles vs cold ambient + moon shaft through a ceiling grate
// ===========================================================================
const DG = {};
let CX = 167;
const FLOOR_Y = 150, VPY = 42.7, CHAR_Y = 196;
const spdAt = (y) => (y - VPY) / (CHAR_Y - VPY);
const WALK = 28, LOOP = 28;
const CART_Y = 188, CART_S = spdAt(CART_Y);
const MID_P = 440, FAR_P = 330, FORE_P = 700, PROP_P = 900;
const WARM = [1.2, 1.0, 0.74], COLD = [0.82, 1.0, 1.22];

function speedAt(p) { if (p < 5.5) return 1; if (p < 6.5) return 6.5 - p; if (p < 13.5) return 0; if (p < 14.5) return p - 13.5; return 1; }
function distAt(p) {
  let d = Math.min(p, 5.5) * WALK;
  if (p > 5.5) { const q = Math.min(p, 6.5) - 5.5; d += WALK * (q - q * q / 2); }
  if (p > 13.5) { const q = Math.min(p, 14.5) - 13.5; d += WALK * q * q / 2; }
  if (p > 14.5) d += (p - 14.5) * WALK;
  return d;
}
const LOOP_D = distAt(LOOP);
const camAt = (t) => { const k = Math.floor(t / LOOP); return k * LOOP_D + distAt(t - k * LOOP); };

// ---------------------------------------------------------------- shapes
function inPointed(x, y, ax, springY, hs, rf = 1.35) {
  if (y + 0.5 >= springY) return Math.abs(x + 0.5 - ax) <= hs;
  const R = hs * rf, off = R - hs, dy = y + 0.5 - springY, a = x + 0.5 - (ax + off), b = x + 0.5 - (ax - off);
  return a * a + dy * dy <= R * R && b * b + dy * dy <= R * R;
}
function skull_shadowed(x, y, v, mat = M_UMBER) {
  ['.###.', '#####', '#o#o#', '##.##', '.#.#.'].forEach((r, j) => [...r].forEach((c, i) => {
    if (c === '#') put(x + i, y + j, v * (i < 2 ? 1.08 : i > 3 ? 0.78 : 0.95), mat); else if (c === 'o') put(x + i, y + j, 0.03, M_STONE);
  }));
}
function bones(x, y, v) { line(x, y, x + 7, y - 1, v, M_UMBER); put(x - 1, y, v, M_UMBER); put(x - 1, y + 1, v, M_UMBER); put(x + 8, y - 2, v, M_UMBER); put(x + 8, y - 1, v, M_UMBER); }
// Solomonic (twisted) column with undulating silhouette
function solomonic(cx, y0, y1, w, d = 1, mat = M_STONE) {
  for (let y = y0; y < y1; y++) {
    const hw = (w / 2) * (0.82 + 0.18 * Math.sin(y * 0.52));
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const u = clamp((x + 0.5 - (cx - hw)) / (2 * hw)), round = Math.sin(u * Math.PI), sp = Math.sin(y * 0.52 + u * 5.2);
      let v = (0.16 + 0.62 * round * (1 - 0.4 * u)) * (0.7 + 0.32 * sp);
      if (sp < -0.82) v *= 0.45;
      put(x, y, v * d, mat);
    }
  }
}
function capital(cx, y, w, d = 1) {
  rect(cx - w / 2 - 4, y - 3, w + 8, 3, 0.7 * d); rect(cx - w / 2 - 4, y, w + 8, 1, 0.14 * d);
  for (let k = 0; k < 4; k++) ellipse(cx - w / 2 - 1 + k * ((w + 2) / 3), y + 3, 2.6, 2.6, (x) => (0.32 + 0.4 * clamp((cx + w - x) / (w * 2))) * d);
  rect(cx - w / 2, y + 5, w, 2, 0.45 * d);
}
function base(cx, y, w, d = 1) { rect(cx - w / 2 - 2, y - 6, w + 4, 3, 0.5 * d); rect(cx - w / 2 - 4, y - 3, w + 8, 3, 0.62 * d); rect(cx - w / 2 - 4, y - 3, w + 8, 1, 0.78 * d); }
function candleWax(x, y, h, flames) {
  rect(x, y - h, 2, h, (xx) => (xx === x ? 0.82 : 0.6), M_UMBER);
  if (h > 4) put(x + (h & 1 ? 2 : -1), y - h + 2, 0.7, M_UMBER);
  flames.push([x + 1, y - h]);
}

// ---------------------------------------------------------------- layers
function buildDungeon() {
  MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0;
  // ---------- FAR: catacomb hall beyond the arches ----------
  DG.far = mkBuf(FAR_P, FLOOR_Y); bind(DG.far);
  rect(0, 0, FAR_P, 128, (x, y) => {
    const row = Math.floor(y / 6), off = (row & 1) * 6, bx = Math.floor((x + off) / 12) % (FAR_P / 12);
    if (y % 6 === 5 || (x + off) % 12 === 11) return 0.05;
    return (0.11 + 0.08 * hash(bx, row, 3)) * lerp(0.45, 1, y / 128);
  });
  for (let k = 0; k < 5; k++) {
    const ax = 33 + k * 66;
    for (let y = 56; y < 128; y++) for (let x = ax - 18; x <= ax + 18; x++) {
      if (inPointed(x, y, ax, 84, 12)) put(x, y, 0.02); else if (inPointed(x, y, ax, 84, 15)) put(x, y, 0.2);
    }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) skull(ax - 9 + c * 13, 34 + r * 8, 0.22);
    rect(k * 66 - 3, 40, 6, 88, (x) => 0.13 + 0.08 * Math.sin(clamp((x - k * 66 + 3) / 6) * Math.PI));
    rect(ax - 1, 122, 1, 3, 0.5, M_UMBER); rect(ax + 2, 123, 1, 2, 0.5, M_UMBER);
  }
  rect(0, 128, FAR_P, 22, (x, y) => ((y - 128) % 5 === 0 ? 0.05 : 0.13 + 0.05 * vnoise(x / 3, y, 5, FAR_P / 3)), M_UMBER);
  DG.farFlames = []; for (let k = 0; k < 5; k++) DG.farFlames.push([33 + k * 66 - 0.5, 121], [33 + k * 66 + 2.5, 122]);

  // ---------- MID: ossuary arcade ----------
  DG.mid = mkBuf(MID_P, FLOOR_Y); bind(DG.mid);
  DG.flames = []; DG.lamps = []; DG.beams = [];
  const bay = (k) => 55 + k * 110;
  const ARCH = [0, 2], springY = 82, hs = 30;
  for (let y = 0; y < FLOOR_Y; y++) for (let x = 0; x < MID_P; x++) {
    let arch = -1; for (const k of ARCH) { if (inPointed(x, y, bay(k), springY, hs)) arch = 0; else if (arch < 0 && inPointed(x, y, bay(k), springY, hs + 7)) arch = 1 + Math.floor((Math.max(Math.abs(x + 0.5 - bay(k)) - hs, 0) + (y < springY ? 0 : 0)) * 0); }
    if (arch === 0) continue;
    if (arch > 0) {
      let ring = 0; for (const k of ARCH) for (let r = 1; r <= 7; r++) if (inPointed(x, y, bay(k), springY, hs + r) && !inPointed(x, y, bay(k), springY, hs + r - 1)) ring = r;
      put(x, y, [0, 0.1, 0.62, 0.3, 0.5, 0.72, 0.22, 0.4][ring] * lerp(0.6, 1, clamp(y / 90)));
      continue;
    }
    const row = Math.floor(y / 8), off = (row & 1) * 9, bx = Math.floor((x + off) / 18) % (MID_P / 18), ry = y % 8, rx = (x + off) % 18;
    let v;
    if (ry === 7 || rx === 17) v = 0.05;
    else { v = 0.2 + 0.13 * hash(bx, row, 3) + 0.12 * (fbm(x / 5, y / 4, 1, MID_P / 5) - 0.5); if (ry === 0) v += 0.08; if (ry === 6) v -= 0.05; }
    const damp = y > 100 && vnoise(x / 16, y / 10, 70, MID_P / 16) > 0.62;
    put(x, y, v * lerp(0.45, 1, clamp((y - 20) / 70)), damp ? M_MOSS : M_STONE);
  }
  // skull keystones + portcullis on the second arch
  for (const k of ARCH) { const ax = bay(k), top = springY - Math.round(hs * Math.sqrt(1.35 * 1.35 - 0.35 * 0.35 * 1)) ; skull(ax - 2, springY - 47, 0.78); }
  for (let x = bay(2) - 26; x <= bay(2) + 26; x += 5) for (let y = 40; y < 92; y++) if (inPointed(x, y, bay(2), springY, hs)) put(x, y, y > 86 ? 0.5 : 0.16 + (x % 2) * 0.05);
  for (const y of [60, 76]) for (let x = bay(2) - 28; x <= bay(2) + 28; x++) if (inPointed(x, y, bay(2), springY, hs)) put(x, y, 0.2);
  // ossuary bay 1: skull niches around a saint in an alcove, moon shaft from a grate
  {
    const cx = bay(1);
    rect(cx - 50, 36, 100, 104, (x, y) => 0.1 + 0.05 * vnoise(x / 4, y / 4, 7));
    for (let r = 0; r < 6; r++) for (let c = -3; c <= 3; c++) {
      if (Math.abs(c) <= 1) continue;
      const nx = cx + c * 14 - 5, ny = 40 + r * 16;
      rect(nx, ny + 2, 11, 12, 0.03); ellipse(nx + 5.5, ny + 2.5, 5.5, 3, 0.03);
      rect(nx - 1, ny + 14, 13, 1, 0.42);
      if ((r + c) % 3 === 0) { bones(nx + 2, ny + 11, 0.55); bones(nx + 2, ny + 9, 0.48); } else skull(nx + 3, ny + 7, 0.62 + 0.15 * hash(r, c, 4));
    }
    rect(cx - 16, 44, 32, 96, 0.03); ellipse(cx, 44, 16, 10, 0.03);
    for (let y = 34; y < 140; y++) for (let x = cx - 19; x <= cx + 19; x++) { const inner = (y >= 44 ? Math.abs(x + 0.5 - cx) <= 16 : Math.hypot((x + 0.5 - cx) / 16, (y + 0.5 - 44) / 10) <= 1), outer = (y >= 44 ? Math.abs(x + 0.5 - cx) <= 19 : Math.hypot((x + 0.5 - cx) / 19, (y + 0.5 - 44) / 12) <= 1); if (outer && !inner) put(x, y, 0.55 + 0.2 * clamp((cx + 19 - x) / 38)); }
    // the saint: halo, hood bowed, praying hands, plinth
    for (let a = 0; a < 64; a++) { const an = (a / 64) * Math.PI * 2; put(Math.round(cx + Math.cos(an) * 8), Math.round(70 + Math.sin(an) * 8), 0.55); }
    rect(cx - 10, 128, 20, 12, (x) => 0.38 + 0.25 * clamp((cx + 10 - x) / 20)); rect(cx - 11, 127, 22, 1, 0.7);
    poly([[cx - 5, 80], [cx + 6, 80], [cx + 9, 127], [cx - 9, 127]], (x) => 0.26 + 0.42 * Math.sin(clamp((x - cx + 9) / 18) * Math.PI) - (((x - cx + 30) % 3) === 0 ? 0.06 : 0));
    ellipse(cx + 1, 73, 6, 8, (x) => 0.3 + 0.38 * clamp((x - cx + 5) / 11)); rect(cx + 2, 72, 4, 6, 0.08);
    rect(cx + 2, 92, 4, 6, 0.72); rect(cx + 3, 91, 2, 1, 0.6);
    // candle clusters at the plinth
    for (const [ox, h] of [[-15, 9], [-12, 6], [-18, 5], [13, 8], [16, 5], [11, 4]]) candleWax(cx + ox, 140, h, DG.flames);
    DG.lamps.push([cx - 14, 132, 75, 0.6], [cx + 14, 133, 75, 0.55]);
    rect(cx + 24, 0, 8, 4, 0.95, M_STONE, 1); for (let x = cx + 24; x < cx + 32; x += 2) rect(x, 0, 1, 4, 0.2, M_STONE, 1);
    DG.beams.push([cx + 28, 2, cx - 4, 146, 15]);
  }
  // bay 3: niche wall with a sarcophagus and banner
  {
    const cx = bay(3);
    for (let r = 0; r < 3; r++) for (let c = -3; c <= 3; c++) { const nx = cx + c * 13 - 5, ny = 44 + r * 15; rect(nx, ny, 10, 9, 0.04); rect(nx - 1, ny + 9, 12, 1, 0.4); skull(nx + 2, ny + 3, 0.5 + 0.2 * hash(r, c, 9)); }
    // tattered banner
    poly([[cx - 9, 32], [cx + 9, 32], [cx + 9, 86], [cx + 5, 80], [cx + 1, 90], [cx - 3, 82], [cx - 9, 88]], (x, y) => 0.32 + 0.3 * Math.sin(clamp((x - cx + 9.5) / 19) * Math.PI) - ((y - 32) % 10 === 0 ? 0.08 : 0), M_DUSK);
    rect(cx - 11, 30, 22, 2, 0.6, M_UMBER);
    for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; line(cx + Math.cos(an) * 2, 52 + Math.sin(an) * 2, cx + Math.cos(an) * (a % 2 ? 4 : 6), 52 + Math.sin(an) * (a % 2 ? 4 : 6), 0.8, M_UMBER); }
    ellipse(cx + 0.5, 52.5, 2, 2, 0.88, M_UMBER);
    // sarcophagus with effigy
    rect(cx - 27, 122, 54, 18, (x) => 0.3 + 0.24 * clamp((cx + 27 - x) / 54));
    for (let k = 0; k < 3; k++) { const px = cx - 23 + k * 16; rect(px, 125, 13, 12, 0.48); rect(px + 1, 126, 11, 10, 0.2); skull(px + 4, 129, 0.55, M_STONE); }
    poly([[cx - 29, 122], [cx + 29, 122], [cx + 27, 117], [cx - 27, 117]], (x) => 0.45 + 0.3 * clamp((cx + 29 - x) / 58));
    ellipse(cx - 20, 114, 3, 3, 0.68); rect(cx - 17, 113, 30, 4, (x) => 0.52 + 0.2 * clamp((cx + 13 - x) / 30)); rect(cx - 4, 111, 4, 2, 0.7); rect(cx + 13, 114, 3, 3, 0.55);
    for (const [ox, h] of [[-24, 7], [-21, 4], [22, 6], [25, 9]]) candleWax(cx + ox, 117, h, DG.flames);
    DG.lamps.push([cx - 22, 110, 80, 0.8], [cx + 23, 109, 80, 0.85]);
  }
  // columns: twisted, carved capitals, candelabra brackets
  for (let k = 0; k < 4; k++) for (const sh of [0, MID_P]) {
    const cx = k * 110 + sh;
    solomonic(cx, 36, 138, 16);
    capital(cx, 34, 16); base(cx, 146, 16);
    rect(cx - 10, 84, 20, 2, 0.42, M_UMBER); rect(cx - 1, 84, 2, 8, 0.36, M_UMBER); for (const ox of [-9, 8]) rect(cx + ox, 81, 2, 3, 0.5, M_UMBER);
    for (const [ox, h] of [[-9, 5], [-1, 8], [8, 5]]) candleWax(cx + ox, 81 + (ox === -1 ? 3 : 0), h, sh === 0 ? DG.flames : []);
    if (sh === 0) DG.lamps.push([cx, 74, 120, 0.95]);
  }
  // cornice with dentils + ribbed vault
  rect(0, 22, MID_P, 9, (x, y) => (y === 22 ? 0.72 : y === 23 ? 0.12 : y >= 28 ? ((x % 4) < 2 ? 0.55 : 0.18) : 0.45));
  rect(0, 0, MID_P, 22, (x, y) => 0.06 + 0.06 * (y / 22));
  for (let k = 0; k < 4; k++) for (const sh of [0, MID_P]) {
    const c0 = k * 110 + sh, c1 = c0 + 110, m = (c0 + c1) / 2;
    for (let x = c0; x <= c1; x++) { const u = (x - c0) / 110, y = Math.round(21 - 19 * Math.sin(u * Math.PI)); put(x, y, 0.42); put(x, y + 1, 0.18); }
    for (let x = c0 - 30; x <= c0 + 30; x++) { const y = Math.round(21 - Math.abs(30 - Math.abs(x - c0)) * 0.55); if (y > 2) put(x, y, 0.3); }
  }
  for (const [cx, len] of [[28, 30], [248, 24], [140, 18]]) for (let y = 0; y < len; y += 3) { rect(cx, y, 1, 2, 0.5); rect(cx - 1, y + 2, 3, 1, 0.35); }

  // ---------- FORE: twisted pillar, gibbet cage, candelabra, skull pile ----------
  DG.fore = mkBuf(FORE_P, H); bind(DG.fore); EMI = 1;
  DG.foreFlames = []; DG.foreLamps = [];
  for (let y = 0; y < H; y++) { const hw = 13 * (0.82 + 0.18 * Math.sin(y * 0.35)); for (let x = Math.floor(90 - hw); x <= 90 + hw; x++) { const u = (x - 90 + hw) / (2 * hw), sp = Math.sin(y * 0.35 + u * 5); put(x, y, (u > 0.82 && sp > 0 ? 0.24 : 0.03), u > 0.82 ? M_UMBER : M_STONE); } }
  rect(70, 186, 40, 34, 0.035);
  for (let y = 0; y < 34; y += 4) { rect(330, y, 2, 3, 0.06); rect(329, y + 3, 4, 1, 0.14); }
  ellipse(331, 38, 9, 3, 0.07); rect(322, 38, 19, 1, 0.16);
  for (let x = 322; x <= 340; x += 3) rect(x, 38, 1, 30, x > 335 ? 0.2 : 0.07, x > 335 ? M_UMBER : M_STONE);
  rect(322, 67, 19, 2, 0.08); ellipse(331, 70, 9, 2.5, 0.06);
  skull(327, 45, 0.2); line(329, 51, 329, 60, 0.16, M_UMBER); for (let y = 52; y < 60; y += 2) line(326, y, 333, y, 0.13, M_UMBER);
  rect(559, 136, 3, 84, (x) => (x === 561 ? 0.22 : 0.05), M_UMBER);
  line(548, 140, 572, 140, 0.06); rect(546, 133, 2, 7, 0.05); rect(573, 133, 2, 7, 0.05);
  rect(552, 205, 18, 3, 0.05); rect(548, 208, 26, 12, 0.04);
  for (const [x, y, h] of [[546, 133, 6], [559, 129, 9], [573, 133, 6]]) { EMI = 0; rect(x, y - h, 2, h, 0.7, M_UMBER); EMI = 1; DG.foreFlames.push([x + 1, y - h]); }
  DG.foreLamps.push([560, 124, 110, 1.0]);
  for (const [x, y] of [[470, 212], [478, 214], [486, 211], [474, 206], [482, 205], [478, 199]]) skull(x, y, 0.16);
  EMI = 0;

  // ---------- floor props (world-anchored, periodic) ----------
  DG.props = [[60, 172, 's'], [140, 205, 'b'], [230, 183, 'b'], [300, 214, 's'], [410, 176, 's'], [520, 200, 'b'], [610, 187, 's'], [700, 168, 'b'], [790, 209, 'b'], [860, 180, 's']];
}

// ---------------------------------------------------------------- floor: grave slabs, puddles
function drawFloor(F, cam) {
  let prevRow = -1;
  for (let y = FLOOR_Y; y < H; y++) {
    const sp = spdAt(y + 0.5), rowF = 9 / sp, row = Math.floor(rowF), fy = rowF - row, joint = row !== prevRow && y > FLOOR_Y, bevel = Math.floor(9 / spdAt(y - 0.5)) !== Math.floor(9 / spdAt(y - 1.5));
    prevRow = row;
    const dk = lerp(0.6, 1, (y - FLOOR_Y) / (H - FLOOR_Y)), dx = Math.round(cam * sp);
    let prevCol = null;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, wx = cam + (x + 0.5 - CX) / sp, cF = wx / 36 + (row & 1) * 0.5, col = Math.floor(cF), fx = cF - col;
      const pair = Math.floor(col / 2), slab = hash(pair, row, 23) < 0.22 && (row & 1) === 0;
      let v, m = M_STONE;
      if (joint) v = 0.04;
      else if (prevCol !== null && col !== prevCol && !(slab && (col & 1) === 1)) v = 0.06;
      else {
        m = hash(col, row, 13) < 0.5 ? M_UMBER : M_STONE;
        v = 0.3 + 0.13 * hash(col, row, 9) + 0.13 * (vnoise(wx / 5, y / 2.2, 4) - 0.5); if (bevel) v += 0.1;
        if (slab) {
          m = M_STONE; const gx = ((col & 1) + fx) / 2;
          v = 0.36 + 0.08 * vnoise(wx / 6, y / 2, 8);
          if (gx < 0.06 || gx > 0.94 || fy < 0.12 || fy > 0.88) { v = 0.62; m = M_UMBER; }
          else if ((Math.abs(gx - 0.3) < 0.03 && fy > 0.25 && fy < 0.75) || (Math.abs(fy - 0.42) < 0.07 && Math.abs(gx - 0.3) < 0.09)) v = 0.12;
          else if (gx > 0.45 && gx < 0.85 && (Math.abs(fy - 0.4) < 0.05 || Math.abs(fy - 0.6) < 0.05) && hash(Math.floor(gx * 40), row, 3) > 0.35) v = 0.15;
        }
        const pud = vnoise(wx / 22, rowF * 1.6, 41);
        if (pud > 0.7) { v = 0.07 + (pud > 0.74 && hash(Math.floor(wx / 3), y, 5) > 0.92 ? 0.5 : 0); m = M_STONE; }
      }
      prevCol = col;
      F.V[i] = v * dk; F.M[i] = m; F.E[i] = 0; F.T[i] = 0; F.A[i] = 1; F.DX[i] = dx;
    }
  }
}

// ---------------------------------------------------------------- cart: baroque peddler
function potionCart(cx, fy, t) {
  MAT = M_UMBER;
  line(cx - 21, fy - 18, cx - 42, fy - 7, 0.38); line(cx - 21, fy - 17, cx - 42, fy - 6, 0.22);
  for (const px of [cx - 22, cx + 20]) { rect(px, fy - 49, 2, 21, (x) => (x === px ? 0.58 : 0.3)); ellipse(px + 1, fy - 51, 2, 2, 0.78); }
  poly([[cx - 26, fy - 49], [cx + 26, fy - 49], [cx + 24, fy - 44], [cx - 24, fy - 44]], (x) => 0.36 + 0.26 * clamp((cx + 26 - x) / 52), M_DUSK);
  for (let x = cx - 24; x < cx + 24; x += 4) { const l = 2 + Math.round(hash(x - cx, 3, 5) * 3); rect(x, fy - 44, 2, l, 0.3, M_DUSK); put(x + 1, fy - 44 + l, 0.75, M_UMBER); }
  rect(cx - 27, fy - 50, 54, 1, 0.72);
  rect(cx - 21, fy - 30, 42, 20, (x, y) => 0.22 + 0.1 * vnoise((x - cx) / 3, y, 31));
  for (let k = 0; k < 3; k++) { const px = cx - 18 + k * 13; rect(px, fy - 27, 11, 14, 0.44); rect(px + 1, fy - 26, 9, 12, 0.17); ellipse(px + 5.5, fy - 20, 2, 2, 0.52); }
  rect(cx - 23, fy - 32, 46, 2, 0.62); rect(cx - 23, fy - 11, 46, 1, 0.5);
  for (const [px, py] of [[cx - 23, fy - 32], [cx + 21, fy - 32], [cx - 23, fy - 12], [cx + 21, fy - 12]]) rect(px, py, 2, 2, 0.9);
  rect(cx - 19, fy - 37, 9, 5, (x) => 0.65 + 0.35 * clamp((cx - 10 - x) / 9), M_LOOT); rect(cx - 17, fy - 37, 5, 1, 0.1, M_LOOT);
  const bottle = (bx, h, v) => {
    rect(bx - 3, fy - 32 - h, 7, h, (x, y) => (y < fy - 32 - h + 3 ? 0.35 : v + 0.35 * clamp((bx + 4 - x) / 7)), M_MAGIC, 1);
    rect(bx - 1, fy - 36 - h, 3, 4, 0.45, M_MAGIC, 1); rect(bx - 1, fy - 38 - h, 3, 2, 0.3);
    rect(bx - 2, fy - 29 - h, 1, h - 4, 1, M_MAGIC, 1);
  };
  const g = 0.08 * Math.sin(t * 3);
  bottle(cx - 5, 9, 0.5 + g); bottle(cx + 3, 7, 0.55 - g); bottle(cx + 11, 9, 0.45 + g);
  line(cx - 25, fy - 44, cx - 25, fy - 40, 0.3, M_STONE);
  rect(cx - 28, fy - 40, 7, 9, 0.15, M_STONE); rect(cx - 27, fy - 39, 5, 7, 0.9 + 0.1 * Math.sin(t * 11), M_UMBER, 1); rect(cx - 25, fy - 39, 1, 7, 0.65, M_UMBER, 1); rect(cx - 29, fy - 41, 9, 1, 0.35, M_STONE);
  for (const wx of [cx - 13, cx + 13]) {
    ellipse(wx, fy - 8, 8, 8, 0.24, M_STONE); ellipse(wx, fy - 8, 6.5, 6.5, 0.36); ellipse(wx, fy - 8, 5, 5, 0.05);
    for (let a = 0; a < 8; a++) line(wx, fy - 8, wx + Math.cos(a * 0.785 + 0.3) * 5, fy - 8 + Math.sin(a * 0.785 + 0.3) * 5, 0.34);
    ellipse(wx, fy - 8, 1.6, 1.6, 0.75, M_STONE);
  }
  MAT = M_STONE;
}

// ---------------------------------------------------------------- per-frame bits
const MOTES = Array.from({ length: 46 }, (_, k) => ({ x: hash(k, 1, 7) * 640, y: 20 + hash(k, 2, 7) * 180, s: 0.45 + hash(k, 3, 7) * 1.1, ph: hash(k, 4, 7) * 6.28 }));
function flame_shadowed(x, y, t, seed, big) {
  const f = hash(Math.floor(t * 14), seed, 3), h = (big ? 3 : 2) + (f > 0.6 ? 1 : 0), lean = f < 0.2 ? -1 : f > 0.85 ? 1 : 0;
  for (let k = 0; k < h; k++) put(Math.round(x + (k === h - 1 ? lean : 0)), y - 1 - k, k === 0 ? 1 : 0.92 - k * 0.08, M_UMBER, 1);
  if (big) put(Math.round(x) - 1, y - 2, 0.75, M_UMBER, 1);
  return f;
}
function drawMist(F, cam, t) {
  for (let y = 158; y < H; y++) {
    const sp = spdAt(y + 0.5), base = clamp((y - 158) / 46);
    for (let x = 0; x < W; x++) {
      const wx = cam + (x - CX) / sp + t * 5;
      const d = vnoise(wx / 34, y / 7 + t * 0.05, 91) * 0.65 + vnoise(wx / 12, y / 3, 92) * 0.35;
      const a = clamp((d - 0.42) * 2.2) * (0.25 + 0.55 * base);
      if (a <= 0.02) continue;
      const i = y * W + x; F.V[i] = lerp(F.V[i], 0.45, a * 0.55); F.X[i] += a * 0.17;
      if (a > 0.3 && !F.T[i]) F.M[i] = mixMat(x, y, M_STONE, M_DUSK, 0.45);
    }
  }
}

// ---------------------------------------------------------------- frame
const PROF = {};
const tick = (k, t0) => { PROF[k] = (PROF[k] || 0) * 0.9 + (performance.now() - t0) * 0.1; return performance.now(); };
// marching order, back to front: priest, mage, Garrote (2nd behind the knight), knight
const PARTY = [{ id: 'priest', x: 21, ph: 0.0, hp: 0.55 }, { id: 'mage', x: 56, ph: 1.3, hp: 0.3 }, { id: 'rogue', x: 87, ph: 3.4, hp: 0.62 }, { id: 'knight', x: 126, ph: 2.6, hp: 0.68 }];
const PARTY_DRAW = { priest: (...a) => priest(...a), mage: (...a) => mage(...a), rogue: (...a) => rogue(...a), knight: (...a) => knight(...a) };
function drawDungeon(F, t, o = {}) {
  const p = o.battle ? 9 : t - Math.floor(t / LOOP) * LOOP, cam = o.battle ? o.cam : camAt(t), walking = !o.battle && speedAt(p) > 0.15;
  let T0 = performance.now();
  bind(F); MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0;
  const offFar = Math.round(cam * 0.3) + 60, offMid = Math.round(cam * 0.7), offFore = o.foreOff ?? (Math.round(cam * 1.45) - 40);
  blit(F, DG.far, offFar, 0, FLOOR_Y);
  blit(F, DG.mid, offMid, 0, FLOOR_Y);
  T0 = tick('layers', T0);
  drawFloor(F, cam);
  T0 = tick('floor', T0);
  bind(F);
  const lights = [];
  // far candles (no light)
  const mf = ((offFar % FAR_P) + FAR_P) % FAR_P;
  DG.farFlames.forEach(([lx, ly]) => { for (const b of [lx - mf, lx - mf + FAR_P, lx - mf + 2 * FAR_P]) { const bx = Math.round(b); if (bx < 0 || bx >= W) continue; const mx = (((bx + offMid) % MID_P) + MID_P) % MID_P; if (!DG.mid.A[(ly - 1) * MID_P + mx]) put(bx, ly - 1, 0.9, M_UMBER, 1); } });
  // arcade candles, lamps, moon shafts
  const mm = ((offMid % MID_P) + MID_P) % MID_P;
  DG.flames.forEach(([lx, ly], n) => { for (const b of [lx - mm, lx - mm + MID_P]) if (b > -4 && b < W + 4) flame(b, ly, t, n, false); });
  DG.lamps.forEach(([lx, ly, r, i], n) => { for (const b of [lx - mm, lx - mm + MID_P]) if (b > -r && b < W + r) lights.push({ x: b, y: ly, r, i: i * (0.88 + 0.14 * hash(Math.floor(t * 10), n, 6)), c: WARM }); });
  DG.beams.forEach(([x0, y0, x1, y1, w]) => { for (const b of [-mm, MID_P - mm]) if (x0 + b > -40 && x1 + b < W + 40) lights.push({ beam: true, x: x0 + b, y: y0, x1: x1 + b, y1, w, i: 0.36, air: 0.11, c: COLD, r: 1 }); });
  // floor props (bones and skulls), world-anchored
  const kP = Math.floor(cam / PROP_P);
  for (let k = kP - 1; k <= kP + 1; k++) for (const [wx, y, kind] of DG.props) {
    const sx = Math.round(CX + (k * PROP_P + wx - cam) * spdAt(y)); if (sx < -10 || sx > W + 10) continue;
    DXV = -sx; if (kind === 's') { skull(sx, y - 4, 0.6); bones(sx + 6, y, 0.5); } else { bones(sx, y, 0.55); bones(sx + 3, y - 2, 0.45); }
  }
  DXV = 0;
  // carts (one per loop, parked ahead)
  const k0 = Math.floor(cam / LOOP_D);
  for (let k = k0 - 1; k <= k0 + 1 && !o.battle; k++) {
    const wx = k * LOOP_D + distAt(6.5) + 108 / CART_S, sx = Math.round(CX + (wx - cam) * CART_S);
    if (sx < -60 || sx > W + 60) continue;
    mulEllipse(sx, CART_Y, 28, 3.5, 0.25);
    TAG = 4; DXV = -sx; potionCart(sx, CART_Y, t); TAG = 0; DXV = 0;
    DG.cartX = sx;
    lights.push({ x: sx - 25, y: CART_Y - 36, r: 90, i: 0.9, c: WARM });
  }
  T0 = tick('props', T0);
  // party
  PARTY.forEach((m, n) => {
    const f = walking ? Math.floor(t * 8 + m.ph * 1.3) % 4 : 0;
    const s = walking ? [0, 2, 0, -2][f] : 0, b = walking ? [0, -1, 0, -1][f] : (Math.sin(t * 2.1 + m.ph) > 0.55 ? -1 : 0);
    mulEllipse(m.x, CHAR_Y, 13, 3.5, 0.25);
    TAG = n + 1;
    // out of battle Garrote carries his daggers reverse-gripped; walking, he runs his own gait (phase quantized to 8 frames)
    const wp = walking ? Math.floor((((t / ROGUE_WALK.T) + m.ph * 0.2) % 1) * ROGUE_WALK.frames) / ROGUE_WALK.frames : null;
    PARTY_DRAW[m.id](m.x, CHAR_Y, s, b, t, !o.battle, wp);
    TAG = 0; MAT = M_STONE;
  });
  lights.push({ x: CX, y: 292, r: 190, i: 0.42, c: COLD, sy: 1.6 });
  lights.push({ x: FX.book[0], y: FX.book[1], r: 150, i: 0.9 + 0.1 * Math.sin(t * 5), c: [1.0, 0.85, 1.45] });
  lights.push({ x: FX.sun[0], y: FX.sun[1], r: 70, i: 0.5, c: WARM });
  lights.push({ x: FX.censer[0], y: FX.censer[1], r: 34, i: 0.55, c: WARM });
  lights.push({ x: FX.eyes[0], y: FX.eyes[1], r: 9, i: 0.5, c: [1.4, 0.75, 0.45] });
  T0 = tick('party', T0);
  if (o.enemies) o.enemies(F, t, lights);
  partyFX(F, t);
  outline(F, 0.3);
  T0 = tick('fx+outline', T0);
  drawMist(F, cam, t);
  T0 = tick('mist', T0);
  // dust motes drifting through the light
  for (const m of MOTES) {
    const x = ((m.x - cam * m.s + t * 4 * m.s) % 640 + 640) % 640 - 120, y = m.y + Math.sin(t * 0.6 + m.ph) * 5 - (t * 1.5 % 20);
    if (x < 0 || x >= W) continue;
    put(x, y, 0.4 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2 + m.ph)), m.s > 1 ? M_UMBER : M_STONE, 1);
  }
  // heal sparkles (holy)
  if (!o.battle && p > 11.1 && p < 12.7) {
    const q = (p - 11.1) / 1.6;
    for (let k = 0; k < 30; k++) {
      const x = 30 + hash(k, 9, 1) * 140, y = 194 - q * (40 + hash(k, 8, 1) * 50) - hash(k, 7, 1) * 20;
      if (hash(k, Math.floor(t * 10), 2) < 0.25) continue;
      put(x, y, 1, M_UMBER, 1); if (k % 3 === 0) { put(x - 1, y, 0.7, M_UMBER, 1); put(x + 1, y, 0.7, M_UMBER, 1); put(x, y - 1, 0.7, M_UMBER, 1); put(x, y + 1, 0.7, M_UMBER, 1); }
    }
    lights.push({ x: 100, y: 160, r: 120, i: 0.6 * Math.sin(q * Math.PI), c: WARM });
  }
  // foreground plane
  blit(F, DG.fore, offFore, 0, H);
  const mfo = ((offFore % FORE_P) + FORE_P) % FORE_P;
  bind(F);
  DG.foreFlames.forEach(([lx, ly], n) => { for (const b of [lx - mfo, lx - mfo + FORE_P]) if (b > -4 && b < W + 4) flame(b, ly, t, 50 + n, true); });
  DG.foreLamps.forEach(([lx, ly, r, i]) => { for (const b of [lx - mfo, lx - mfo + FORE_P]) if (b > -r && b < W + r) lights.push({ x: b, y: ly, r, i, c: WARM }); });
  T0 = tick('fore', T0);
  DG.lights = lights; DG.p = p; DG.cam = cam;
  if (o.fx) o.fx(F, t, lights);
  return { lights, ambient: [0.075, 0.068, 0.15], tint: 0.28, vig: 1, p };
}

