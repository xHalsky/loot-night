// ===========================================================================
// Ravenhold at night: top-down 3/4 town (SNES jRPG angle) on the 640x360 grid.
// Layout from the UI inventory §6, halved. The static town is a cached, lit layer with its
// static lights baked into a light map (F.LM); life, fire, the vortex and the UI go on top each frame.
// ===========================================================================
const TW = { ew: [[69, 10], [131, 12], [191, 9]], ns: [[68, 10], [265, 10]], ave: [157, 20], plaza: [116, 79, 102, 52], fountain: [167, 104], court: [131, 52, 72, 17] };
const SPOTS = [
  { id: 'portal', name: 'Dungeon Portal', kind: 'gate', box: [138, 0, 58, 61], line: 'Down into the dungeon', sub: '15 min' },
  { id: 'appraiser', name: 'Appraiser', kind: 'service', box: [2, 0, 65, 69], line: 'Identifies unknown items', sign: [34, 70], mark: 'eye' },
  { id: 'library', name: 'Library', kind: 'plot', lv: 1, box: [79, 5, 50, 64], sign: [104, 70], mark: 'book' },
  { id: 'auction', name: 'Auction House', kind: 'service', box: [204, 0, 60, 69], line: 'Sells loot for real money', sign: [234, 70], mark: 'gavel' },
  { id: 'treasury', name: 'Treasury', kind: 'plot', lv: 0, box: [276, 15, 56, 54], sign: [304, 70], mark: 'coin' },
  { id: 'merchant', name: 'Merchant', kind: 'service', box: [199, 81, 65, 49], line: 'Buys loot for gold', sign: [242, 132], mark: 'scales' },
  { id: 'training', name: 'Training Grounds', kind: 'plot', lv: 1, box: [79, 143, 77, 47], sign: [117, 192], mark: 'swords' },
  { id: 'forge', name: 'Salvage Forge', kind: 'service', box: [178, 132, 86, 58], line: 'Melts gear into Souls', sign: [221, 192], mark: 'anvil' },
  { id: 'inn', name: 'Inn', kind: 'plot', lv: 1, box: [276, 134, 56, 56], sign: [304, 192], mark: 'tankard' },
];
// the build's city (src/data/city.ts): gold and Souls (were scraps) per level
const BUILD = {
  training: { name: 'Training Grounds', fx: (l) => `Attack +${[0, 10, 18, 25][l]}%`, cost: [[250, 6], [600, 14], [1300, 26]] },
  inn: { name: 'Inn', fx: (l) => `Max HP +${[0, 10, 18, 25][l]}%`, cost: [[250, 6], [600, 14], [1300, 26]] },
  library: { name: 'Library', fx: (l) => `Cooldowns -${[0, 8, 15, 22][l]}%`, cost: [[350, 8], [800, 18], [1600, 32]] },
  treasury: { name: 'Treasury', fx: (l) => `Bag +${l * 2} slots`, cost: [[400, 10], [900, 20], [1800, 36]] },
};
const MARK = {
  eye: ['.......', '..OOO..', '.O.X.O.', 'O.XXX.O', '.O.X.O.', '..OOO..', '.......'],
  book: ['.......', 'OOO.OOO', 'OuO.OuO', 'OOO.OOO', 'OuO.OuO', 'OOOOOOO', '.......'],
  gavel: ['OOO....', 'OOOO...', '.OOOO..', '..O.O..', '....O..', '.....O.', '.OOOOOO'],
  coin: ['..OOO..', '.OYYYO.', 'OYOOOYO', 'OYO.OYO', 'OYOOOYO', '.OYYYO.', '..OOO..'],
  scales: ['...O...', 'OOOOOOO', 'O..O..O', 'O..O..O', 'OO.O.OO', '...O...', '..OOO..'],
  swords: ['M.....M', '.M...M.', '..M.M..', '...M...', '..M.M..', 'OO...OO', 'O.....O'],
  anvil: ['.......', 'OOOOOO.', '.OOOOOO', '..OOO..', '..OOO..', '.OOOOO.', '.......'],
  tankard: ['OOOOO..', 'OYYYO..', 'O...OO.', 'O...O.O', 'O...OO.', 'O...O..', 'OOOOO..'],
};


// ---------------------------------------------------------------- light map
const TLIGHTS = [];
function tl(x, y, r, i, c) { TLIGHTS.push({ x, y, r, i, c }); }
const WARMC = [1.25, 0.95, 0.62], VIOLETC = [0.95, 0.65, 1.5], COLDC = [0.7, 0.85, 1.3], FIREC = [1.35, 0.85, 0.5];
function bakeLM(L) {
  L.LM = new Float32Array(W * H * 3);
  for (const l of TLIGHTS) {
    const c = l.c, s = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, n = [c[0] / s, c[1] / s, c[2] / s];
    for (let y = Math.max(0, Math.floor(l.y - l.r)); y < Math.min(H, l.y + l.r); y++) for (let x = Math.max(0, Math.floor(l.x - l.r)); x < Math.min(W, l.x + l.r); x++) {
      const d = Math.hypot(x + 0.5 - l.x, (y + 0.5 - l.y) * 1.15); if (d >= l.r) continue;
      const f = (1 - d / l.r) ** 2 * l.i * 1.35, k = (y * W + x) * 3; L.LM[k] += n[0] * f; L.LM[k + 1] += n[1] * f; L.LM[k + 2] += n[2] * f;
    }
  }
}
const CHIMS = [];

// ---------------------------------------------------------------- ground: grass, worn dirt, cobbled streets with ragged edges, paved plaza and court
function paintGround() {
  const streets = [...TW.ew.map(([y, h]) => [-20, y, W + 40, h]), ...TW.ns.map(([x, w]) => [x, 10, w, H + 20]), [TW.ave[0], 131, TW.ave[1], H + 20]];
  const sdist = (x, y, r) => Math.min(x - r[0] + 0.5, r[0] + r[2] - 0.5 - x, y - r[1] + 0.5, r[1] + r[3] - 0.5 - y);
  const plaza = masonry(TW.plaza[0], TW.plaza[1], TW.plaza[2], TW.plaza[3], 77, { hmin: 4, hmax: 5, lmin: 6, lmax: 11, joint: 0.22, hi: 0.09, vary: 0.14, bridge: 0.1 });
  const court = masonry(TW.court[0], TW.court[1], TW.court[2], TW.court[3], 78, { hmin: 4, hmax: 5, lmin: 5, lmax: 9, joint: 0.22, hi: 0.09, bridge: 0.1 });
  DXV = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = (fbm(x * 0.35, y * 0.35, 82) - 0.5) * 3.4;
    let ds = -99; for (const r of streets) ds = Math.max(ds, sdist(x, y, r));
    const dp = sdist(x, y, TW.plaza) + n * 0.3, dc = sdist(x, y, TW.court) + n * 0.3;
    if (dp > 0 || dc > 0) {
      const P = dp > 0, d = (P ? plaza : court)(x, y);
      if (d < -0.07 && fbm(x * 0.25, y * 0.25, 86) > 0.62) { put(x, y, 0.3, M_MOSS, 0); continue; }
      put(x, y, (P ? 0.54 : 0.46) + d + 0.08 * (fbm(x * 0.1, y * 0.1, 87) - 0.5), P ? M_UMBER : M_STONE, 0);
      continue;
    }
    if (ds + n > 0) {
      const c = cobbleV(x, y, 0.29 + 0.06 * (fbm(x * 0.05, y * 0.05, 88) - 0.5), 5, 4);
      if (c >= 0) put(x, y, c, M_STONE, 0);
      else if (fbm(x * 0.2, y * 0.2, 85) > 0.63 || ds + n < 1.2) put(x, y, 0.26, M_MOSS, 0);
      else put(x, y, 0.18, M_STONE, 0);
      continue;
    }
    if (ds + n > -2.2 + 1.6 * fbm(x * 0.3, y * 0.3, 84)) { put(x, y, dirtV(x, y), M_UMBER, 0); continue; }
    put(x, y, grassV(x, y), M_MOSS, 0);
  }
  // the cliff along the top: boulders, a grass lip, a dark foot
  DXV = 5;
  for (let x = 0; x < W; x++) {
    const edge = 10 + Math.round(2.5 * fbm(x * 0.12, 3, 61)), lip = 1 + Math.round(2 * fbm(x * 0.3, 0, 63));
    for (let y = 0; y <= edge; y++) {
      if (y < lip) { put(x, y, grassV(x, y) + 0.08, M_MOSS, 0); continue; }
      put(x, y, rockV(x, y, 0.27, 8, 5) * (y === edge ? 0.45 : y === lip ? 0.8 : 1), M_STONE, 0);
    }
  }
  DXV = 0;
}
function fountain() {
  const [fx, fy] = TW.fountain; DXV = 2;
  for (let y = fy - 12; y <= fy + 12; y++) for (let x = fx - 22; x <= fx + 22; x++) {
    const dx = (x + 0.5 - fx) / 20.5, dy = (y + 0.5 - fy) / 11.5, d = Math.hypot(dx, dy); if (d >= 1) continue;
    if (d > 0.84) { const a = Math.atan2(dy, dx) + Math.PI, seg = Math.floor(a / (Math.PI / 7)); put(x, y, (d < 0.9 ? 0.68 : 0.5) - 0.16 * dx - 0.1 * dy + 0.08 * (hash(seg, 0, 9) - 0.5) - (a % (Math.PI / 7) < 0.14 ? 0.16 : 0), M_STONE, 0); }
    else put(x, y, 0.18, M_STONE, 0);
  }
  for (let x = fx - 20; x <= fx + 20; x++) { const u = (x + 0.5 - fx) / 20.5, yy = fy + Math.floor(11.5 * Math.sqrt(Math.max(0, 1 - u * u))); put(x, yy + 1, 0.34 - 0.1 * u, M_STONE, 0); put(x, yy + 2, 0.2 - 0.06 * u, M_STONE, 0); }
  DXV = 0;
}
function brazier(bx, by) {
  const d = DXV; DXV = 4;
  for (let i = -2; i <= 2; i++) { put(bx + i, by, i === -2 ? 0.58 : 0.46 - i * 0.05, M_STONE, 0); if (Math.abs(i) < 2) put(bx + i, by + 1, 0.26 - i * 0.04, M_STONE, 0); }
  put(bx - 1, by + 2, 0.32, M_STONE, 0); put(bx + 1, by + 2, 0.22, M_STONE, 0); put(bx - 2, by + 3, 0.3, M_STONE, 0); put(bx + 2, by + 3, 0.18, M_STONE, 0); put(bx, by + 3, 0.22, M_STONE, 0);
  DXV = d;
}
function lampPost(lx, ly) {
  const d = DXV; DXV = 7;
  put(lx - 1, ly, 0.4, M_STONE, 0); put(lx, ly, 0.34, M_STONE, 0); put(lx + 1, ly, 0.22, M_STONE, 0);
  for (let j = 1; j < 7; j++) put(lx, ly - j, j === 6 ? 0.5 : 0.36 - (j & 1) * 0.04, M_STONE, 0);
  DXV = d;
}
function well(cx, cy) {
  const d = DXV; DXV = 7;
  for (let y = cy - 3; y <= cy + 4; y++) for (let x = cx - 5; x <= cx + 5; x++) {
    const e = Math.hypot((x + 0.5 - cx) / 5, (y + 0.5 - cy) / 3); if (e > 1 && !(y > cy && Math.abs(x + 0.5 - cx) < 5 && y <= cy + 4)) continue;
    if (e < 0.55) put(x, y, 0.08, M_STONE, 0); else if (e <= 1) put(x, y, 0.58 - 0.14 * ((x - cx) / 5) - (hash(x >> 1, y, 4) < 0.3 ? 0.12 : 0), M_STONE, 0);
    else put(x, y, 0.34 - 0.12 * ((x - cx) / 5) - ((x + y) % 3 === 0 ? 0.08 : 0), M_STONE, 0);
  }
  for (const px of [cx - 5, cx + 4]) for (let j = cy - 9; j <= cy; j++) put(px, j, px < cx ? 0.46 : 0.28, M_UMBER, 0);
  for (let i = -6; i <= 5; i++) { put(cx + i, cy - 11, 0.5 - i * 0.02, M_DANGER, 0); put(cx + i, cy - 10, 0.38 - i * 0.02, M_DANGER, 0); }
  for (let i = -4; i <= 3; i++) put(cx + i, cy - 12, 0.6, M_DANGER, 0);
  put(cx, cy - 8, 0.4, M_UMBER, 0); put(cx, cy - 7, 0.3, M_UMBER, 0); put(cx, cy - 6, 0.5, M_STONE, 0);
  DXV = d;
}
function cart(x, y) {
  const d = DXV; DXV = 5;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 11; i++) put(x + i, y + j, j === 0 ? 0.62 - i * 0.02 : j === 3 ? 0.2 : 0.42 - (i % 3 === 0 ? 0.1 : 0), M_UMBER, 0);
  for (let i = 0; i < 9; i++) { const h = hash(x + i, y, 5); if (h > 0.3) put(x + 1 + i, y - 1, 0.7, h > 0.7 ? M_LOOT : M_UMBER, 0); }
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const e = Math.hypot(i - 2, j - 2); if (e > 2.5) continue; put(x + 2 + i, y + 3 + j, e > 1.6 ? 0.46 - (i + j) * 0.03 : e < 0.7 ? 0.5 : (i + j) % 2 ? 0.08 : 0.3, M_UMBER, 0); }
  line(x + 11, y + 1, x + 15, y + 3, 0.4, M_UMBER, 0);
  DXV = d;
}
function skull(x, y, v = 0.82) {
  ['.ooo.', 'ooooo', 'oxoxo', '.ooo.', '.o.o.'].forEach((r, j) => [...r].forEach((c, i) => { if (c === 'o') put(x + i, y + j, v - i * 0.06 - (j === 4 ? 0.2 : 0), M_UMBER, 0); else if (c === 'x') put(x + i, y + j, 0.04, M_DUSK, 0); }));
}
function grave(x, y, kind) {
  const d = DXV; DXV = 5;
  for (let i = -1; i <= 5; i++) { put(x + i, y + 7, dirtV(x + i, y + 7, 0.3), M_UMBER, 0); put(x + i, y + 8, dirtV(x + i, y + 8, 0.2), M_UMBER, 0); }
  if (kind) { for (let j = 0; j < 7; j++) put(x + 2, y + j, 0.5 - j * 0.02, M_STONE, 0); for (let i = 0; i < 5; i++) put(x + i, y + 2, i === 4 ? 0.3 : 0.56, M_STONE, 0); put(x + 3, y + 3, 0.22, M_STONE, 0); }
  else ['.ooo.', 'ooooo', 'ooooo', 'ooooo', 'ooooo', 'ooooo', 'mmmmm'].forEach((r, j) => [...r].forEach((c, i) => { if (c === 'o') put(x + i, y + j, 0.56 - i * 0.07 + (j === 0 ? 0.06 : 0) - (i === 2 && j > 1 && j < 5 ? 0.14 : 0), M_STONE, 0); else if (c === 'm') put(x + i, y + j, 0.32, M_MOSS, 0); }));
  DXV = d;
}
function banner(x, y, len, mat, emblem) { // hanging cloth, three columns of folds, a swallowtail
  for (let j = 0; j < len; j++) for (let i = 0; i < 3; i++) { if (j === len - 1 && i === 1) continue; put(x + i, y + j, [0.56, 0.44, 0.3][i] + (j === 0 ? 0.1 : 0), mat, 0); }
  if (emblem) put(x + 1, y + 3, 0.95, emblem, 1);
}

// ---------------------------------------------------------------- an ordinary house: hip or gable roof, stone / plaster / clapboard front
function house16(x0, y0, w, rh, wh, o = {}) {
  const dv = DXV; DXV = o.cast ?? 10;
  const wy0 = y0 + rh, sd = o.sd ?? ((x0 * 37 + y0 * 11) & 1023), kind = o.wall || 'stone';
  const tex = kind === 'plaster' ? plaster(sd) : kind === 'clap' ? clapboard(sd) : null;
  facade(x0 + 1, wy0, w - 2, wh, { mat: o.wallMat ?? (kind === 'stone' ? M_STONE : M_UMBER), v: o.wallV ?? (kind === 'plaster' ? 0.66 : kind === 'clap' ? 0.48 : 0.48), tex, sd, quoins: o.quoins });
  const n = o.win ?? Math.max(1, Math.round((w - 6) / 9)), dx = o.door ?? (o.door === null ? null : Math.round(x0 + w / 2) - 2);
  const wins = []; for (let k = 0; k < n; k++) { let wx = x0 + 2 + Math.round(((k + 0.5) * (w - 4)) / n) - 1; if (dx != null && Math.abs(wx + 1 - (dx + 2)) < 5) wx += wx < dx ? -4 : 5; if (wx > x0 + 2 && wx + 3 < x0 + w - 2) wins.push(wx); }
  if (kind === 'plaster') { timber(x0 + 1, wy0 + 1, w - 2, wh - 4, { step: o.step ?? 7, v: 0.2 }); }
  const wyy = wy0 + Math.max(3, Math.round(wh / 2) - 4);
  wins.forEach((wx, k) => win16(wx, wyy, 3, 5, { lit: hash(x0, k, 31) < (o.lit ?? 0.7), shutters: o.shutters, box: o.boxes && k % 2 === 0 ? o.boxes : null, frame: kind === 'stone' ? M_STONE : M_UMBER, fv: kind === 'stone' ? 0.5 : 0.36, arch: o.arch }));
  if (dx != null) door16(dx, wy0 + wh - 8, 4, 7, {});
  if (o.gable) frontGable(x0, y0, w, Math.max(2, rh - o.gable), o.gable, { mat: o.roofMat ?? M_STONE, v: o.roofV ?? 0.4, finial: true });
  else hipRoof(x0, y0, w, rh, { mat: o.roofMat ?? M_STONE, v: o.roofV ?? 0.4, moss: o.moss ?? 0.22, sh: o.sh });
  for (const ox of o.dormers || []) dormer(x0 + ox, y0 + Math.round(rh * 0.42), { mat: o.roofMat ?? M_STONE, v: o.roofV ?? 0.4, lit: hash(x0, ox, 3) < 0.6 });
  // a cross-gable wing stepping forward of the front: breaks the box
  if (o.wing) {
    const [ox, ww, drop] = o.wing, wx = x0 + ox, gh = 6, apex = wy0 + drop - gh;
    facade(wx + 1, apex, ww - 2, wh + drop + gh, { mat: o.wallMat ?? (kind === 'stone' ? M_STONE : M_UMBER), v: (o.wallV ?? (kind === 'plaster' ? 0.66 : 0.48)) + 0.04, tex: kind === 'plaster' ? plaster(sd + 1) : kind === 'clap' ? clapboard(sd + 1) : null, sd: sd + 1, eave: 0, quoins: kind !== 'plaster' });
    if (kind === 'plaster') timber(wx + 1, wy0 + drop + 1, ww - 2, wh - 4, { step: 5, v: 0.2, braces: false });
    frontGable(wx, y0 + 3, ww, apex - y0 - 3, gh, { mat: o.roofMat ?? M_STONE, v: (o.roofV ?? 0.4) + 0.02, shade: true, finial: true });
    win16(wx + Math.floor(ww / 2) - 1, wy0 + drop + Math.max(3, Math.round(wh / 2) - 4), 3, 5, { lit: hash(wx, 7, 31) < 0.7, frame: kind === 'stone' ? M_STONE : M_UMBER, fv: kind === 'stone' ? 0.5 : 0.36, box: o.boxes || null });
    put(wx + Math.floor(ww / 2), apex + 3, 0.1, M_STONE, 0); put(wx + Math.floor(ww / 2), apex + 2, 0.4, M_STONE, 0);
  }
  if (o.chimney != null) CHIMS.push(chimney16(x0 + o.chimney, y0 - 4, 4, 8));
  DXV = dv;
}

// ---------------------------------------------------------------- the buildings
// Dungeon Portal: a pointed arch of voussoirs cut into a mound of boulders, on worn steps; skulls, chains, graves,
// violet braziers
function bPortal() {
  const cx = 167;
  DXV = 9;
  for (let y = 0; y <= 52; y++) for (let x = 138; x <= 196; x++) {
    const dx = (x - cx) / 28, top = 2 + Math.abs(dx) ** 2 * 10 + 1.5 * (fbm(x * 0.3, 0, 44) - 0.5);
    if (y < top) continue;
    let v = rockV(x, y, 0.27, 10, 7, 45) - 0.05 * Math.abs(dx), m = M_STONE;
    if (y < top + 1.5 + 2 * fbm(x * 0.4, 1, 46)) { m = M_MOSS; v = 0.24 + 0.12 * hash(x >> 1, y >> 1, 47); }
    put(x, y, v, m, 0);
  }
  // the pointed arch: wedge-shaped voussoirs around the opening, jamb blocks below the springing line
  for (let y = 5; y <= 50; y++) for (let x = 144; x <= 190; x++) {
    const ox = Math.abs(x + 0.5 - cx), inner = y < 26 ? 17 - Math.max(0, 26 - y) ** 1.5 * 0.2 : 17, outer = y < 26 ? 22 - Math.max(0, 25 - y) ** 1.5 * 0.2 : 22;
    if (ox > outer) continue;
    if (ox <= inner) { put(x, y, 0.03, M_DUSK, 0); continue; }
    let joint, sid;
    if (y >= 26) { joint = (y - 26) % 4 === 0; sid = Math.floor((y - 26) / 4) + (x < cx ? 0 : 50); }
    else { const a = Math.atan2(26 - y, ox) / 0.21; joint = a % 1 < 0.2; sid = Math.floor(a) + (x < cx ? 100 : 150); }
    let v = 0.44 + 0.1 * (hash(sid, 0, 48) - 0.5) + (x < cx ? 0.06 : -0.08);
    if (ox < inner + 1.2) v += 0.16; else if (ox > outer - 1) v -= 0.12;
    if (joint) v = 0.14;
    put(x, y, v, M_STONE, 0);
  }
  // keystone skull, two skulls on the jambs, chains
  skull(cx - 2, 2); skull(146, 30, 0.76); skull(184, 30, 0.7);
  for (const x of [151, 182]) for (let y = 13; y < 32; y++) { const k = (y >> 1) & 1; put(x + (k && y & 1 ? 1 : 0), y, k ? 0.6 : 0.38, M_STONE, 0); if (!k) put(x - 1, y, 0.2, M_STONE, 0); }
  // worn steps
  DXV = 1;
  for (let k = 0; k < 4; k++) for (let x = 145 - k * 2; x <= 189 + k * 2; x++) {
    const wear = Math.max(0, 1 - Math.abs(x - cx) / 14) * 0.08, jt = hash(Math.floor((x + k * 3) / 6), k, 49) < 0.2 || (x + k * 3) % 6 === 0;
    put(x, 51 + k * 2, 0.52 - k * 0.03 + wear - (jt ? 0.14 : 0) + 0.04 * (GR(x, k) - 0.5) - (x - 145) * 0.0015, M_STONE, 0);
    put(x, 52 + k * 2, 0.24 - (x > cx ? 0.04 : 0), M_STONE, 0);
  }
  for (const [x, y] of [[147, 52], [186, 54], [150, 56], [183, 58]]) { put(x, y, 0.3, M_MOSS, 0); put(x + 1, y, 0.22, M_MOSS, 0); }
  // graves either side, braziers (bowls; flames are animated)
  grave(139, 36, 0); grave(134, 44, 1); grave(191, 37, 1); grave(196, 45, 0);
  brazier(143, 46); brazier(191, 46);
  DXV = 0;
  tl(cx, 30, 70, 0.9, VIOLETC); tl(143, 43, 26, 0.6, VIOLETC); tl(191, 43, 26, 0.6, VIOLETC);
}
// Appraiser: a round violet tower under a fish-scale cone, a corbelled gallery, the glowing eye window, a crystal on
// the spire, star banners, a brass telescope; a curio shop at its foot with a crystal ball in a bay window
function bAppraiser() {
  // curio shop
  DXV = 9;
  facade(7, 48, 22, 18, { mat: M_UMBER, v: 0.56, tex: plaster(12), sd: 12 });
  timber(7, 49, 22, 13, { step: 7, braces: false, v: 0.18 });
  hipRoof(5, 37, 26, 11, { mat: M_DUSK, v: 0.3, moss: 0.2 });
  // bay window: its own little roof, panes of violet light, the crystal ball
  for (let x = 8; x <= 18; x++) { put(x, 51, 0.48 - (x - 8) * 0.02, M_DUSK, 0); put(x, 52, 0.3 - (x - 8) * 0.015, M_DUSK, 0); put(x, 53, 0.12, M_DUSK, 0); }
  for (let y = 54; y <= 60; y++) for (let x = 9; x <= 17; x++) {
    const fr = x === 9 || x === 17 || y === 60, mul = x === 12 || x === 15;
    if (fr) put(x, y, x === 9 ? 0.5 : 0.28, M_UMBER, 0); else if (mul) put(x, y, 0.16, M_UMBER, 0); else put(x, y, (y === 54 ? 0.48 : 0.62) + 0.06 * hash(x, y, 3), M_MAGIC, 1);
  }
  ellipse(13.5, 57.5, 2.1, 2.1, (x, y) => (Math.hypot(x - 12.6, y - 56.6) < 1.1 ? 1 : 0.78), M_MAGIC, 1); rect(12, 59, 4, 1, 0.5, M_UMBER, 0);
  for (let x = 8; x <= 18; x++) { put(x, 61, 0.56 - (x - 8) * 0.02, M_UMBER, 0); put(x, 62, 0.12, M_STONE, 0); }
  door16(21, 57, 4, 8, { frame: M_UMBER, fv: 0.46 });
  DXV = 3; pot(26, 61, { plant: M_MAGIC }); pot(17, 63, { plant: true });
  // the tower: curved courses (they bow down toward the viewer), lit on the left, flared at the foot
  DXV = 16;
  const cx = 40.5, tex = masonry(30, 18, 22, 52, 41, { hmin: 3, hmax: 3, lmin: 3, lmax: 6, joint: 0.18, hi: 0.1 });
  for (let y = 18; y <= 66; y++) {
    const r = y > 62 ? 10.5 : 9.5;
    for (let x = 29; x <= 52; x++) {
      const u = (x + 0.5 - cx) / r; if (Math.abs(u) >= 1) continue;
      const curve = Math.round(2 * (1 - u * u));
      const lam = Math.max(0, -0.62 * u + 0.78 * Math.sqrt(1 - u * u));
      let v = 0.2 + 0.36 * lam + tex(x, y - curve) * (0.6 + 0.6 * lam);
      if (y < 22) v *= y === 18 ? 0.4 : y === 19 ? 0.55 : 0.75;
      if (y === 62) v += 0.12;
      let m = M_DUSK; if (y > 63 && fbm(x * 0.5, y * 0.5, 42) > 0.56) { m = M_MOSS; v = 0.28 + 0.1 * hash(x >> 1, y >> 1, 1); }
      put(x, y, v, m, 0);
    }
  }
  // corbelled gallery under the cone
  for (let x = 28; x <= 53; x++) {
    const u = (x + 0.5 - cx) / 12.5; if (Math.abs(u) >= 1) continue;
    const b = 17 + Math.round(2 * Math.sqrt(1 - u * u));
    put(x, b - 2, 0.56 - 0.18 * u, M_DUSK, 0); put(x, b - 1, 0.44 - 0.18 * u, M_DUSK, 0);
    put(x, b, (x % 3 === 0 ? 0.08 : 0.4 - 0.16 * u), M_DUSK, 0); if (x % 3) put(x, b + 1, 0.26 - 0.1 * u, M_DUSK, 0);
  }
  coneRoof(cx, 0, 14, 11.5, { mat: M_DUSK, v: 0.36, ry: 3 });
  // the eye window
  for (let y = 22; y <= 30; y++) for (let x = 34; x <= 47; x++) {
    const e = ((x - 40.5) / 6.5) ** 2 + ((y - 26) / 3.6) ** 2;
    if (e < 1) put(x, y, e < 0.24 ? 0.12 : e < 0.55 ? 0.92 : 0.62, M_MAGIC, 1); else if (e < 1.35) put(x, y, x < 40 ? 0.56 : 0.3, M_DUSK, 0);
  }
  put(40, 25, 1, M_STONE, 1);
  // arrow slits, door, star banners
  for (const [sx, sy] of [[36, 38], [45, 38], [40, 47]]) { for (let j = -1; j <= 4; j++) put(sx, sy + j, 0.54, M_DUSK, 0), put(sx + 1, sy + j, 0.18, M_DUSK, 0); for (let j = 0; j < 4; j++) put(sx, sy + j, j ? 0.7 : 0.5, M_MAGIC, 1); }
  door16(38, 57, 5, 9, { frame: M_DUSK, fv: 0.5 });
  banner(32, 32, 12, M_MAGIC, M_LOOT); banner(47, 32, 12, M_MAGIC, M_LOOT);
  // brass telescope off the gallery
  for (let k = 0; k <= 10; k++) { const x = 51 + k, y = Math.round(19 - k * 0.6); put(x, y, 0.84 - k * 0.01, M_LOOT, 0); put(x, y + 1, 0.46, M_LOOT, 0); }
  put(62, 12, 0.95, M_LOOT, 0); put(62, 13, 0.7, M_LOOT, 0); put(61, 13, 0.9, M_STONE, 1);
  // the spire crystal (runes circle it)
  poly([[40, -2], [42, 1], [40, 5], [38, 1]], (x) => (x < 40 ? 0.95 : 0.7), M_MAGIC, 1);
  DXV = 0;
  tl(40, 26, 36, 0.55, VIOLETC); tl(40, 2, 30, 0.5, VIOLETC); tl(13, 57, 16, 0.4, VIOLETC);
}
// pointed (lancet) window of stained glass in a stone surround
function lancet(x, y, w, h, k, glass) {
  const a = Math.ceil(w / 2) + 1, hw = (j) => (w / 2) * Math.min(1, (j + 0.9) / a) ** 0.55, inside = (i, j) => j >= 0 && j < h && Math.abs(i + 0.5 - w / 2) < hw(j);
  for (let j = -2; j <= h; j++) for (let i = -2; i < w + 2; i++) {
    if (inside(i, j)) {
      const lead = i === Math.floor(w / 2) || (j - 1) % 4 === 0;
      if (lead) put(x + i, y + j, 0.12, M_STONE, 0); else put(x + i, y + j, 0.58 + 0.28 * hash(x + (i >> 1), (j >> 2) + k, 5), glass[(Math.floor(j / 4) + (i > w / 2 ? 1 : 0) + k) % glass.length], 1);
      continue;
    }
    let near = false; for (const [p, q] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (inside(i + p, j + q)) near = true;
    if (near) put(x + i, y + j, i < w / 2 ? 0.6 : 0.3, M_STONE, 0);
  }
  for (let i = -2; i < w + 2; i++) { put(x + i, y + h + 1, 0.62 - (i > w ? 0.14 : 0), M_STONE, 0); put(x + i, y + h + 2, 0.12, M_STONE, 0); }
}
// Library (Lv1): a gothic hall under a steep front gable: rose window, buttresses with pinnacles, four tall windows
// of stained glass, the book over a deep pointed door, book stacks outside
function bLibrary() {
  DXV = 12;
  facade(81, 14, 46, 52, { mat: M_STONE, v: 0.46, sd: 51, m: { hmin: 3, hmax: 4, lmin: 5, lmax: 9 }, eave: 0, quoins: false });
  frontGable(80, 5, 48, 9, 18, { mat: M_STONE, v: 0.28, finial: true, shade: true });
  // rose window in the gable
  for (let y = 16; y <= 30; y++) for (let x = 97; x <= 111; x++) {
    const d = Math.hypot(x + 0.5 - 104, y + 0.5 - 23), a = Math.atan2(y + 0.5 - 23, x + 0.5 - 104);
    if (d < 4.8) { const sp = Math.abs(((a + 3.2) * 8 / 6.283) % 1 - 0.5) < 0.12 && d > 1.5; put(x, y, sp ? 0.12 : d < 1.4 ? 0.92 : 0.62 + 0.24 * hash(Math.floor((a + 3.2) * 1.3), 0, 6), sp ? M_STONE : d < 1.4 ? M_LOOT : Math.floor((a + 3.2) * 1.3) % 2 ? M_DANGER : M_MAGIC, sp ? 0 : 1); }
    else if (d < 6.2) put(x, y, (d < 5.5 ? 0.6 : 0.3) + (x < 104 ? 0.06 : -0.08) - ((Math.floor((a + 3.2) * 4) & 1) ? 0.08 : 0), M_STONE, 0);
  }
  // buttresses with set-offs and pinnacles that break the roof line
  for (const [bx, top] of [[80, 30], [92, 21], [113, 21], [125, 30]]) {
    for (let y = top; y <= 65; y++) { const wv = y > 48 ? 3 : 2; for (let i = 0; i < wv; i++) put(bx + i, y, (i === 0 ? 0.6 : i === wv - 1 ? 0.24 : 0.42) - ((y - top) % 5 === 0 ? 0.1 : 0) + (y === 48 ? 0.14 : 0), M_STONE, 0); }
    for (let j = 1; j <= 6; j++) { const pw = j < 3 ? 1 : 2; for (let i = 0; i < pw; i++) put(bx + i + (pw === 1 ? (j === 1 ? 0 : 0) : 0), top - 7 + j, i === 0 ? 0.62 : 0.3, M_STONE, 0); }
    put(bx, top - 7, 0.7, M_STONE, 0);
  }
  // four tall windows
  const glass = [M_DANGER, M_MAGIC, M_LOOT, M_MOSS];
  [[84, 0], [96, 1], [107, 2], [118, 3]].forEach(([wx, k]) => lancet(wx, 36, 5, 18, k, glass));
  // the deep pointed door: two archivolt rings, iron-strapped boards; the book over it
  const dx = 101, dy = 54, dw = 7, dh = 11;
  for (let ring = 3; ring >= 0; ring--) {
    const a = Math.ceil((dw + ring * 2) / 2) + 1, hw = (j) => ((dw + ring * 2) / 2) * Math.min(1, (j + 0.9) / a) ** 0.55;
    for (let j = 0; j < dh + ring; j++) for (let i = -ring; i < dw + ring; i++) {
      if (Math.abs(i + 0.5 - dw / 2) >= hw(j)) continue;
      const y = dy - ring + j;
      if (ring === 0) { let v = 0.3 + vplanks(7)(dx + i, y); if (j === 4 || j === 8) v = 0.48; put(dx + i, y, v, j === 4 || j === 8 ? M_STONE : M_UMBER, 0); }
      else put(dx + i, y, ring === 2 ? 0.2 : (i < dw / 2 ? 0.62 : 0.36) - ring * 0.04, M_STONE, 0);
    }
  }
  put(dx + 5, dy + 7, 0.85, M_LOOT, 0);
  for (let y = 46; y <= 50; y++) for (let x = 100; x <= 108; x++) { const edge = y === 46 || y === 50 || x === 100 || x === 108, spine = x === 104; put(x, y, edge ? 0.3 : spine ? 0.4 : 0.86 - (x > 104 ? 0.1 : 0) - (y === 48 && !spine ? 0.18 : 0), M_UMBER, edge ? 0 : 1); }
  // steps and book stacks
  DXV = 1;
  for (const [y, a, b, v] of [[66, 96, 112, 0.6], [67, 96, 112, 0.3], [68, 93, 115, 0.54]]) for (let x = a; x <= b; x++) put(x, y, v - (x - a) * 0.004 - ((x * 7 + y) % 6 === 0 ? 0.1 : 0), M_STONE, 0);
  DXV = 4;
  for (const [bx, by] of [[86, 60], [117, 61]]) for (let k = 0; k < 3; k++) { const m = [M_DANGER, M_UMBER, M_MOSS][k], x = bx + (k & 1); for (let i = 0; i < 5; i++) { put(x + i, by - k * 2, 0.86 - i * 0.04, M_UMBER, 0); put(x + i, by - k * 2 + 1, 0.56 - i * 0.06, m, 0); } }
  ivy(82, 65, 3, 18, 8);
  DXV = 0;
  tl(90, 46, 22, 0.45, WARMC); tl(118, 46, 22, 0.45, WARMC); tl(104, 23, 18, 0.35, VIOLETC); tl(104, 60, 20, 0.4, WARMC);
}
// Auction House: a pale guildhall under red barrel tiles with a bell cupola; a pediment with the gold coin, a
// dentilled entablature, four fluted columns, broad steps, lots glowing on two pedestals, coin banners
function bAuction() {
  DXV = 12;
  // bell cupola
  facade(247, 4, 10, 10, { mat: M_UMBER, v: 0.74, sd: 61, m: { hmin: 2, hmax: 3, lmin: 3, lmax: 5 }, eave: 1, plinth: 0, quoins: false, moss: false });
  for (let y = 6; y <= 12; y++) for (let x = 248; x <= 255; x++) { const ax = Math.abs(x + 0.5 - 252), top = 6 + (ax > 2.5 ? 1 : 0) + (ax > 3.4 ? 1 : 0); if (y < top) continue; put(x, y, x === 248 || x === 255 || y === top ? (x < 252 ? 0.88 : 0.6) : 0.06, x === 248 || x === 255 || y === top ? M_UMBER : M_DUSK, 0); }
  ellipse(252, 9.2, 1.9, 2, (x) => (x < 251.5 ? 0.9 : 0.62), M_LOOT, 0); put(251, 11, 0.5, M_LOOT, 0);
  hipRoof(245, 0, 14, 5, { mat: M_DANGER, v: 0.55, tex: clayTiles(62), ri: 6, back: 0.45 });
  put(251, 0, 0.95, M_LOOT, 0); put(252, 0, 0.7, M_LOOT, 0);
  // main roof
  hipRoof(205, 8, 58, 14, { mat: M_DANGER, v: 0.52, tex: clayTiles(63) });
  // the back wall of the portico, in shade, with the lit doors and windows
  facade(206, 34, 56, 23, { mat: M_UMBER, v: 0.48, sd: 64, m: { hmin: 3, hmax: 3, lmin: 5, lmax: 8, joint: 0.16 }, eave: 3, plinth: 0, quoins: false, moss: false });
  for (const wx of [214, 250]) win16(wx, 40, 4, 6, { arch: true, frame: M_UMBER, fv: 0.7 });
  door16(229, 41, 10, 15, { open: true, frame: M_UMBER, fv: 0.72, step: false });
  // pediment: cornice band and a recessed tympanum with the coin
  for (let y = 14; y <= 27; y++) { const hw = ((y - 14) / 13) * 29; for (let x = Math.round(234 - hw); x <= Math.round(234 + hw); x++) { const edge = hw - Math.abs(x - 234) < 2.2 || y === 27; put(x, y, edge ? (x < 234 ? 0.92 : 0.74) : 0.6 - 0.1 * ((x - 205) / 58) + 0.04 * (GR(x, y) - 0.5), M_UMBER, 0); } }
  ellipse(234.5, 22, 3.6, 3.4, (x, y) => (Math.hypot(x - 233.4, y - 20.8) < 1.6 ? 1 : 0.78), M_LOOT, 0); put(234, 22, 0.55, M_LOOT, 0); put(235, 22, 0.55, M_LOOT, 0);
  // cornice, frieze, dentils
  for (let x = 204; x <= 264; x++) { put(x, 28, 0.94 - 0.14 * ((x - 204) / 60), M_UMBER, 0); put(x, 29, 0.36, M_UMBER, 0); put(x, 30, 0.8 - 0.12 * ((x - 204) / 60), M_UMBER, 0); put(x, 31, 0.72 - 0.12 * ((x - 204) / 60), M_UMBER, 0); put(x, 32, x % 2 ? 0.4 : 0.84 - 0.1 * ((x - 204) / 60), M_UMBER, 0); put(x, 33, 0.3, M_UMBER, 0); }
  // columns: capital, fluted shaft, base
  for (const cx of [209, 221, 244, 256]) {
    for (let i = -1; i <= 4; i++) { put(cx + i, 34, 0.92 - i * 0.05, M_UMBER, 0); put(cx + i, 35, 0.6 - i * 0.04, M_UMBER, 0); put(cx + i, 55, 0.84 - i * 0.06, M_UMBER, 0); put(cx + i, 56, 0.5 - i * 0.04, M_UMBER, 0); }
    for (let y = 36; y <= 54; y++) for (let i = 0; i < 4; i++) put(cx + i, y, [0.96, 0.86, 0.7, 0.48][i] - ((y + i) % 7 === 0 ? 0.06 : 0), M_UMBER, 0);
  }
  // coin banners at the corners
  banner(205, 34, 11, M_DANGER, M_LOOT); banner(260, 34, 11, M_DANGER, M_LOOT);
  // broad steps
  DXV = 1;
  for (let k = 0; k < 4; k++) for (let x = 207 - k; x <= 261 + k; x++) { const jt = (x * 5 + k * 3) % 9 === 0; put(x, 57 + k * 2, 0.8 - k * 0.05 - 0.12 * ((x - 204) / 60) - (jt ? 0.14 : 0), M_UMBER, 0); put(x, 58 + k * 2, 0.46 - k * 0.03, M_UMBER, 0); }
  // pedestals with glowing lots, urns at the step ends
  DXV = 5;
  for (const [px, m] of [[210, M_MAGIC], [256, M_LOOT]]) { block(px, 59, 5, 6, 2, { mat: M_UMBER, v: 0.68 }); ellipse(px + 2.5, 56.8, 1.7, 1.7, 0.96, m, 1); }
  pot(202, 61, { plant: true, mat: M_UMBER }); pot(263, 61, { plant: true, mat: M_UMBER });
  DXV = 0;
  tl(234, 46, 30, 0.55, WARMC); tl(212, 57, 14, 0.5, VIOLETC); tl(258, 57, 14, 0.55, FIREC);
}
// Treasury, level 0: cleared ground with ragged edges, stakes and string, a work lamp, a notice board; the vault door
// leaning in a timber frame, gold-banded strongboxes, dressed stone blocks, iron bars, a sand pile, a barrow
function bTreasury0() {
  DXV = 0;
  for (let y = 16; y < 69; y++) for (let x = 276; x < 334; x++) {
    const d = Math.min(x - 276, 333 - x, y - 16, 68 - y) + 5 * (fbm(x * 0.18, y * 0.18, 91) - 0.5); if (d < 0.5) continue;
    let v = dirtV(x, y, 0.28); if (Math.abs(y - 63 + (x - 276) * 0.05) < 0.6 || Math.abs(y - 60 + (x - 276) * 0.05) < 0.6) v -= 0.08;
    put(x, y, v, M_UMBER, 0);
  }
  const sx0 = 284, sy0 = 30, sx1 = 324, sy1 = 62;
  for (let x = sx0; x <= sx1; x++) if (x % 3) { put(x, sy0, 0.62, M_UMBER, 0); put(x, sy1, 0.62, M_UMBER, 0); }
  for (let y = sy0; y <= sy1; y++) if (y % 3) { put(sx0, y, 0.62, M_UMBER, 0); put(sx1, y, 0.62, M_UMBER, 0); }
  DXV = 4;
  for (const [x, y] of [[sx0, sy0], [sx1, sy0], [sx0, sy1], [sx1, sy1], [304, sy0], [304, sy1]]) { for (let j = -3; j <= 0; j++) put(x, y + j, j === -3 ? 0.8 : 0.66, M_UMBER, 0); }
  // sand pile and barrow
  for (let y = 54; y <= 60; y++) for (let x = 290; x <= 304; x++) { const e = Math.hypot((x + 0.5 - 297) / 7, (y + 0.5 - 60) / 6); if (e < 1 && y <= 60) put(x, y, 0.72 - 0.25 * ((x - 297) / 7) - 0.15 * ((y - 55) / 5) + (hash(x >> 1, y, 3) > 0.8 ? 0.06 : 0), M_UMBER, 0); }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 7 - j; i++) put(307 + i + j, 57 + j, j === 0 ? 0.54 : 0.34 - i * 0.02, M_STONE, 0);
  put(309, 60, 0.4, M_UMBER, 0); put(310, 61, 0.2, M_UMBER, 0); line(314, 57, 318, 59, 0.5, M_UMBER, 0);
  // the vault door in its frame
  DXV = 9;
  for (let y = 31; y <= 51; y++) { put(296, y, 0.52, M_UMBER, 0); put(297, y, 0.3, M_UMBER, 0); put(312, y, 0.46, M_UMBER, 0); put(313, y, 0.26, M_UMBER, 0); }
  for (let x = 295; x <= 314; x++) { put(x, 31, 0.6 - (x - 295) * 0.01, M_UMBER, 0); put(x, 32, 0.34, M_UMBER, 0); }
  for (let y = 34; y <= 51; y++) for (let x = 298; x <= 312; x++) {
    const d = Math.hypot(x + 0.5 - 305, y + 0.5 - 43); if (d >= 7.2) continue;
    let v = 0.42 + 0.24 * clamp((305 - x) / 7) - 0.1 * clamp((y - 43) / 7);
    if (d > 6.2) v = 0.3 + 0.2 * clamp((305 - x) / 7); else if (Math.abs(d - 5.4) < 0.5) v = (Math.round(Math.atan2(y - 43, x - 305) * 3) & 1) ? 0.72 : 0.22;
    else if (Math.abs(d - 3.4) < 0.5) v -= 0.18;
    put(x, y, v, M_STONE, 0);
  }
  ellipse(305.5, 43.5, 1.8, 1.8, 0.92, M_LOOT, 0); for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) { put(305 + dx, 43 + dy, 0.86, M_LOOT, 0); }
  // strongboxes with gold bands, dressed stone blocks, iron bars
  DXV = 3;
  for (const [bx, by] of [[285, 49], [291, 52], [284, 55]]) { block(bx, by, 6, 5, 2, { mat: M_UMBER, v: 0.42 }); for (let j = 0; j < 5; j++) put(bx + 2, by + j, j < 2 ? 0.92 : 0.76, M_LOOT, 0); for (let i = 0; i < 6; i++) put(bx + i, by + 3, 0.78 - i * 0.04, M_LOOT, 0); }
  block(317, 41, 6, 4, 2, { v: 0.5 }); block(322, 43, 6, 4, 2, { v: 0.46 }); block(318, 45, 6, 4, 2, { v: 0.54 });
  for (let k = 0; k < 4; k++) line(316, 55 + k, 327, 51 + k, 0.56 + (k & 1) * 0.12, M_STONE, 0);
  // work lamp, notice board
  DXV = 8;
  for (let y = 34; y <= 49; y++) put(281, y, 0.4, M_UMBER, 0); put(282, 34, 0.4, M_UMBER, 0); rect(282, 35, 2, 3, 0.95, M_LOOT, 1);
  for (let y = 59; y <= 66; y++) { put(318, y, 0.38, M_UMBER, 0); put(326, y, 0.3, M_UMBER, 0); }
  for (let y = 55; y <= 60; y++) for (let x = 317; x <= 327; x++) put(x, y, y === 55 ? 0.6 : 0.4 - (x - 317) * 0.01, M_UMBER, 0);
  for (const [px, py] of [[319, 57], [323, 57]]) { put(px, py, 0.86, M_UMBER, 0); put(px + 1, py, 0.8, M_UMBER, 0); put(px, py + 1, 0.7, M_UMBER, 0); put(px + 1, py + 1, 0.66, M_UMBER, 0); }
  DXV = 0;
  tl(283, 37, 26, 0.6, WARMC);
}
// ---- the plots follow the build's levels (0.62). The redesign drew the Library, Training Grounds and Inn at Lv 1
// and the Treasury at Lv 0 (grid doc §9); these add the other Lv 0 plots and the Treasury's vault, from the
// inventory §6 and city.md. Lv 2 and 3 show the Lv 1 building until they are drawn.
let TOWN_LV = null, TOWN_KEY = '';   // the levels the cached layer was built for (null: the page's own scene)
const plotLevel = (id) => (TOWN_LV && TOWN_LV[id] != null ? TOWN_LV[id] : SPOTS.find((s) => s.id === id).lv);
const PLOT_BOARD = {};   // an unbuilt plot's notice board: its mark hangs there
// cleared ground with ragged edges, stakes and string, a work lamp and a notice board (as the Treasury's plot)
function plotGround(id, sd) {
  const [bx, by, bw, bh] = SPOTS.find((s) => s.id === id).box;
  DXV = 0;
  for (let y = by + 1; y < by + bh; y++) for (let x = bx; x < bx + bw + 2; x++) {
    const d = Math.min(x - bx, bx + bw + 1 - x, y - by - 1, by + bh - 1 - y) + 5 * (fbm(x * 0.18, y * 0.18, sd) - 0.5); if (d < 0.5) continue;
    put(x, y, dirtV(x, y, 0.28), M_UMBER, 0);
  }
  const sx0 = bx + 8, sy0 = by + 15, sx1 = bx + bw - 8, sy1 = by + bh - 7, mx = Math.round((sx0 + sx1) / 2);
  for (let x = sx0; x <= sx1; x++) if (x % 3) { put(x, sy0, 0.62, M_UMBER, 0); put(x, sy1, 0.62, M_UMBER, 0); }
  for (let y = sy0; y <= sy1; y++) if (y % 3) { put(sx0, y, 0.62, M_UMBER, 0); put(sx1, y, 0.62, M_UMBER, 0); }
  DXV = 4;
  for (const [x, y] of [[sx0, sy0], [sx1, sy0], [sx0, sy1], [sx1, sy1], [mx, sy0], [mx, sy1]]) for (let j = -3; j <= 0; j++) put(x, y + j, j === -3 ? 0.8 : 0.66, M_UMBER, 0);
  DXV = 8;
  const lx = bx + 5, ly = sy0 + 4;
  for (let y = ly; y <= ly + 15; y++) put(lx, y, 0.4, M_UMBER, 0); put(lx + 1, ly, 0.4, M_UMBER, 0); rect(lx + 1, ly + 1, 2, 3, 0.95, M_LOOT, 1);
  const nx = sx1 - 7, ny = sy1 - 7;
  for (let y = ny + 4; y <= ny + 11; y++) { put(nx + 1, y, 0.38, M_UMBER, 0); put(nx + 9, y, 0.3, M_UMBER, 0); }
  for (let y = ny; y <= ny + 5; y++) for (let x = nx; x <= nx + 10; x++) put(x, y, y === ny ? 0.6 : 0.4 - (x - nx) * 0.01, M_UMBER, 0);
  PLOT_BOARD[id] = [nx + 1, ny + 1];
  DXV = 0;
  tl(lx + 2, ly + 3, 26, 0.6, WARMC);
  return [sx0, sy0];
}
function sandPile(cx, by, rx, ry) {
  for (let y = by - ry; y <= by; y++) for (let x = cx - rx; x <= cx + rx; x++) { const e = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - by) / ry); if (e < 1) put(x, y, 0.72 - 0.25 * ((x - cx) / rx) - 0.15 * ((y - by + ry) / ry) + (hash(x >> 1, y, 3) > 0.8 ? 0.06 : 0), M_UMBER, 0); }
}
function planks(x, y, len, n) { for (let k = 0; k < n; k++) line(x, y + 3 + k, x + len, y + k, 0.5 + (k & 1) * 0.14, M_UMBER, 0); }
// Library, Lv 0: stone, planks, crates of books, scrolls, a lectern under a cloth (a scholar waits on the street)
function bLibrary0() {
  const [a, b] = plotGround('library', 93);
  DXV = 3;
  block(a + 3, b + 26, 6, 4, 2, { v: 0.5 }); block(a + 8, b + 28, 6, 4, 2, { v: 0.46 }); block(a + 4, b + 30, 6, 4, 2, { v: 0.54 });
  planks(a + 3, b + 4, 12, 4);
  for (const [cx, cy] of [[a + 18, b + 6], [a + 25, b + 8], [a + 20, b + 14]]) { crate(cx, cy, 6, 6); for (let i = 1; i < 5; i++) { const m = [M_DANGER, M_MAGIC, M_MOSS, M_LOOT][(i + cx) % 4]; put(cx + i, cy, 0.62, m, 0); put(cx + i, cy + 1, 0.44, m, 0); } }
  for (const [x, y] of [[a + 4, b + 14], [a + 6, b + 16], [a + 3, b + 18]]) { for (let i = 0; i < 5; i++) put(x + i, y, i === 0 || i === 4 ? 0.6 : 0.86, M_UMBER, 0); put(x + 1, y + 1, 0.3, M_UMBER, 0); put(x + 3, y + 1, 0.26, M_UMBER, 0); }
  DXV = 6;
  const lx = a + 27, ly = b + 20;
  for (let j = 0; j < 9; j++) for (let i = -Math.min(j, 4); i <= Math.min(j, 4); i++) put(lx + i, ly + j, 0.42 - i * 0.04 - (j === 8 ? 0.1 : 0) + (hash(i, j, 9) > 0.8 ? 0.06 : 0), M_DUSK, 0);
  put(lx - 2, ly + 9, 0.3, M_UMBER, 0); put(lx + 2, ly + 9, 0.24, M_UMBER, 0);
  DXV = 0;
}
// Training Grounds, Lv 0: logs, fence posts, a straw dummy on its back, a crate of practice swords, a target, sand
function bTraining0() {
  const [a, b] = plotGround('training', 94);
  DXV = 4;
  woodpile(a + 3, b + 3, 10, 6);
  for (let k = 0; k < 3; k++) line(a + 15, b + 5 + k * 2, a + 27, b + 3 + k * 2, 0.58 - k * 0.06, M_UMBER, 0);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) put(a + 32 + i, b + 5 + j, 0.6 - j * 0.12 + (hash(i, j, 4) > 0.7 ? 0.08 : 0), M_LOOT, 0);
  line(a + 35, b + 3, a + 35, b + 9, 0.42, M_UMBER, 0); ellipse(a + 43, b + 6.5, 2, 2, 0.58, M_UMBER, 0);
  crate(a + 5, b + 14, 7, 6); for (const i of [1, 3, 5]) for (let j = 1; j <= 4; j++) put(a + 5 + i, b + 14 - j, j === 4 ? 0.9 : 0.66, M_STONE, 0);
  const tx = a + 19, ty = b + 16;
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const d = Math.hypot(i, j); if (d > 3.4) continue; put(tx + i, ty + j, d > 2.4 ? 0.5 : d > 1.3 ? 0.85 : 0.62, d > 2.4 || d <= 1.3 ? M_DANGER : M_UMBER, 0); }
  line(tx + 2, ty + 3, tx + 4, ty + 6, 0.36, M_UMBER, 0);
  sandPile(a + 37, b + 22, 8, 6);
  DXV = 0;
}
// Inn, Lv 0: stacked kegs, planks, a table and benches, the tankard sign leaning, a hay cart
function bInn0() {
  const [a, b] = plotGround('inn', 95);
  DXV = 4;
  barrel(a + 3, b + 3); barrel(a + 8, b + 4);
  barrelSide(a + 3, b + 16); barrelSide(a + 8, b + 16); barrelSide(a + 5, b + 12);
  planks(a + 15, b + 2, 12, 4);
  bench(a + 15, b + 12, 10);
  for (let i = 0; i < 10; i++) { put(a + 15 + i, b + 15, 0.66 - i * 0.02, M_UMBER, 0); put(a + 15 + i, b + 16, 0.48 - i * 0.02, M_UMBER, 0); put(a + 15 + i, b + 17, 0.22, M_UMBER, 0); }
  bench(a + 15, b + 19, 10);
  const sx = a + 11, sy = b + 9;
  for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) put(sx + i, sy + j, i === 0 || j === 0 || i === 5 || j === 5 ? 0.3 : 0.46, M_UMBER, 0);
  for (const [i, j] of [[1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3]]) put(sx + i, sy + j, i === 4 ? 0.62 : 0.85 - j * 0.06, M_LOOT, 0);
  cart(a + 25, b + 6); for (let i = 0; i < 9; i++) { const h = 2 + Math.round(1.5 * Math.sin((i + 0.5) / 9 * Math.PI)); for (let j = 0; j < h; j++) put(a + 26 + i, b + 5 - j, 0.5 + 0.1 * (h - j) / h + (hash(i, j, 6) > 0.75 ? 0.1 : 0), M_LOOT, 0); }
  DXV = 0;
}
// Treasury, Lv 1: a squat vault with battlements and buttresses, barred windows, an iron-banded door with a gold lock
function bTreasury1() {
  DXV = 10;
  for (let y = 22; y < 31; y++) for (let x = 282; x < 327; x++) put(x, y, 0.3 + 0.05 * (hash(x >> 2, y >> 1, 61) - 0.5) + (y === 22 ? 0.12 : 0), M_STONE, 0);
  facade(282, 34, 45, 28, { v: 0.44, sd: 61, eave: 2 });
  for (let x = 280; x < 329; x++) { for (let y = 31; y < 34; y++) put(x, y, (y === 31 ? 0.62 : 0.46) - (x - 280) * 0.002, M_STONE, 0); if ((x - 280) % 6 < 3) for (let y = 27; y < 31; y++) put(x, y, y === 27 ? 0.72 : 0.54 - ((x - 280) % 6 === 2 ? 0.1 : 0), M_STONE, 0); }
  DXV = 6;
  for (const bx of [279, 293, 312, 325]) block(bx, 40, 4, 22, 2, { v: 0.5 });
  for (const wx of [286, 317]) {
    for (let i = -1; i <= 5; i++) put(wx + i, 39, 0.3, M_STONE, 0);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) { const bar = i % 2 === 1; put(wx + i, 40 + j, bar ? 0.56 : 0.5 - j * 0.03, bar ? M_STONE : M_LOOT, bar ? 0 : 1); }
    for (let i = -1; i <= 5; i++) put(wx + i, 47, 0.58, M_STONE, 0);
    tl(wx + 2, 44, 12, 0.3, WARMC);
  }
  door16(300, 47, 9, 14, { frame: M_STONE, fv: 0.6 });
  put(304, 54, 0.95, M_LOOT, 1); put(304, 55, 0.8, M_LOOT, 0);
  for (const tx of [297, 311]) { put(tx, 51, 0.3, M_UMBER, 0); put(tx, 50, 0.9, M_LOOT, 1); put(tx, 49, 0.75, M_LOOT, 1); tl(tx, 49, 20, 0.6, WARMC); }
  DXV = 0;
}
// Merchant: a clapboard shop under wooden shingles, a bay window of bottles, a striped awning with a scalloped
// edge, a counter of fruit and potions, goods piled outside; two market stalls on the plaza
function bMerchant() {
  DXV = 11;
  facade(219, 96, 44, 32, { mat: M_UMBER, v: 0.42, tex: clapboard(72), sd: 72 });
  hipRoof(217, 83, 48, 13, { mat: M_UMBER, v: 0.36, tex: shingles(71, { ch: 3, tw: 3, shadow: 0.16 }) });
  CHIMS.push(chimney16(253, 79, 4, 8));
  // bay window of bottles
  for (let x = 221; x <= 238; x++) { put(x, 97, 0.5 - (x - 221) * 0.012, M_UMBER, 0); put(x, 98, 0.3, M_UMBER, 0); put(x, 106, 0.6 - (x - 221) * 0.012, M_UMBER, 0); put(x, 107, 0.12, M_STONE, 0); }
  for (let y = 99; y <= 105; y++) for (let x = 221; x <= 238; x++) {
    if (x === 221 || x === 238) { put(x, y, x === 221 ? 0.5 : 0.24, M_UMBER, 0); continue; }
    if (x === 227 || x === 232) { put(x, y, 0.18, M_UMBER, 0); continue; }
    put(x, y, (y === 99 ? 0.7 : 0.88) + 0.05 * hash(x, y, 2), M_LOOT, 1);
  }
  for (let k = 0; k < 7; k++) { const bx = 223 + k * 2 + (k > 1 ? 1 : 0) + (k > 4 ? 1 : 0), m = [M_MOSS, M_DANGER, M_MAGIC, M_STONE, M_MOSS, M_DANGER, M_MAGIC][k]; if (bx === 227 || bx === 232) continue; for (let j = 0; j < 3; j++) put(bx, 102 + j, 0.72 - j * 0.1, m, 1); put(bx, 101, 0.5, m, 1); }
  win16(250, 99, 3, 4, { shutters: M_DANGER, box: [M_DANGER, M_LOOT], sill: true });
  // striped awning: sloping cloth, scalloped edge, the shadow under it
  for (let y = 108; y <= 116; y++) for (let x = 216; x <= 264; x++) {
    const s = Math.floor((x - 216) / 4), lx = (x - 216) % 4, q = (y - 108) / 8;
    if (y === 116 && (lx === 0 || lx === 3)) continue;
    put(x, y, (s % 2 ? 0.86 : 0.72) - 0.22 * q + (lx === 0 ? 0.04 : lx === 3 ? -0.06 : 0) - (y === 116 ? 0.1 : 0), s % 2 ? M_UMBER : M_DANGER, 0);
  }
  for (let x = 219; x <= 262; x++) { const i = 117 * BW + x; B.V[i] *= 0.45; B.V[i + BW] *= 0.7; }
  // counter with fruit baskets and potions; the door
  for (let y = 119; y <= 124; y++) for (let x = 221; x <= 239; x++) put(x, y, y === 119 ? 0.66 - (x - 221) * 0.01 : y === 120 ? 0.46 : 0.32 + vplanks(4)(x, y) * 0.6, M_UMBER, 0);
  for (const [bx, m] of [[222, M_DANGER], [227, M_LOOT], [232, M_MOSS]]) { for (let i = 0; i < 4; i++) { put(bx + i, 118, 0.46, M_UMBER, 0); put(bx + i, 117, 0.84 - i * 0.07, m, 0); } put(bx + 1, 116, 0.92, m, 0); }
  for (const px of [237, 238]) { put(px, 117, 0.8, M_MAGIC, 1); put(px, 118, 0.7, M_MAGIC, 1); }
  door16(243, 118, 4, 9, { arch: false });
  // goods outside: barrels, crates, sacks
  DXV = 4;
  barrel(251, 120); barrel(256, 121); crate(258, 115, 5, 6); sack(250, 125); sack(254, 126, { mat: M_UMBER });
  // two market stalls on the plaza
  DXV = 7;
  for (const [sx, sy, m] of [[199, 86, M_MOSS], [199, 108, M_STONE]]) {
    for (let y = sy; y < sy + 5; y++) for (let x = sx - 1; x < sx + 16; x++) { const s = Math.floor((x - sx + 1) / 3) % 2; if (y === sy + 4 && (x - sx + 1) % 3 === 2) continue; put(x, y, (s ? 0.86 : 0.6) - 0.08 * (y - sy) - (x === sx - 1 ? 0 : 0), s ? M_UMBER : m, 0); }
    for (let j = sy + 5; j < sy + 13; j++) { put(sx, j, 0.46, M_UMBER, 0); put(sx + 14, j, 0.3, M_UMBER, 0); }
    for (let x = sx; x <= sx + 14; x++) { put(x, sy + 9, 0.62 - (x - sx) * 0.01, M_UMBER, 0); put(x, sy + 10, 0.36, M_UMBER, 0); put(x, sy + 11, 0.26, M_UMBER, 0); }
    for (let k = 0; k < 6; k++) { const gx = sx + 2 + k * 2, gm = [M_LOOT, M_DANGER, M_MOSS][k % 3]; put(gx, sy + 8, 0.8, gm, 0); put(gx + 1, sy + 8, 0.56, gm, 0); put(gx, sy + 7, 0.62, gm, 0); }
    crate(sx + 3, sy + 11, 4, 4);
  }
  DXV = 0;
  tl(230, 102, 26, 0.6, WARMC); tl(206, 96, 14, 0.35, WARMC); tl(206, 118, 14, 0.35, WARMC);
}
// Training Grounds (Lv1): a sand yard with ragged edges behind a log palisade, a gate with the crossed-swords
// banner and torches, straw dummies, targets on easels, a weapon rack, a roped sparring ring, hay bales
function bTraining() {
  DXV = 0;
  for (let y = 144; y <= 190; y++) for (let x = 79; x <= 157; x++) {
    const d = Math.min(x - 80, 156 - x, y - 146, 189 - y) + 3 * (fbm(x * 0.25, y * 0.25, 93) - 0.5); if (d < 0) continue;
    let v = 0.36 + dirtV(x, y, 0.28);
    if (d < 1.5) v -= 0.1;
    put(x, y, v, M_UMBER, 0);
  }
  // sparring ring: rope on short posts
  for (let a = 0; a < 90; a++) { const an = (a / 90) * 6.283; put(Math.round(124 + Math.cos(an) * 14), Math.round(171 + Math.sin(an) * 7.5), 0.86, M_UMBER, 0); }
  DXV = 3;
  for (let k = 0; k < 8; k++) { const an = (k / 8) * 6.283, px = Math.round(124 + Math.cos(an) * 14), py = Math.round(171 + Math.sin(an) * 7.5); put(px, py - 2, 0.7, M_UMBER, 0); put(px, py - 1, 0.5, M_UMBER, 0); put(px, py, 0.34, M_UMBER, 0); }
  // log palisade along the back, a gap for the gate
  DXV = 8;
  for (let x = 80; x <= 155; x++) {
    if (x >= 112 && x <= 123) continue;
    const k = Math.floor((x - 80) / 2), lx = (x - 80) & 1, top = 141 - Math.floor(hash(k, 0, 96) * 2);
    for (let y = top; y <= 148; y++) put(x, y, (lx ? 0.3 : 0.52) + 0.06 * (hash(k, 1, 96) - 0.5) - (y === top && lx ? 0.3 : 0) + (y === top && !lx ? 0.14 : 0) - (y === 148 ? 0.12 : 0) + (y === 144 ? 0.12 : 0), y === 144 ? M_LOOT : M_UMBER, 0);
  }
  // low post-and-rail fence on the sides and front
  DXV = 3;
  for (let y = 149; y <= 187; y++) { put(80, y, 0.5, M_UMBER, 0); put(155, y, 0.34, M_UMBER, 0); if (y % 6 === 0) { put(81, y, 0.3, M_UMBER, 0); put(156, y, 0.2, M_UMBER, 0); } }
  for (let x = 80; x <= 155; x++) { if (x >= 112 && x <= 123) continue; put(x, 186, 0.56, M_UMBER, 0); put(x, 188, 0.4, M_UMBER, 0); if (x % 6 === 2) for (let j = 184; j <= 189; j++) put(x, j, j === 184 ? 0.66 : 0.46, M_UMBER, 0); }
  // the gate: two log posts, a lintel, the banner, torch brackets
  DXV = 12;
  for (const gx of [110, 123]) for (let y = 134; y <= 148; y++) { put(gx, y, 0.6, M_UMBER, 0); put(gx + 1, y, 0.42, M_UMBER, 0); put(gx + 2, y, 0.24, M_UMBER, 0); }
  for (let x = 108; x <= 127; x++) { put(x, 133, 0.66 - (x - 108) * 0.01, M_UMBER, 0); put(x, 134, 0.44, M_UMBER, 0); put(x, 135, 0.22, M_UMBER, 0); }
  put(107, 134, 0.5, M_UMBER, 0); put(128, 134, 0.3, M_UMBER, 0);
  for (let y = 136; y <= 146; y++) for (let x = 114; x <= 120; x++) { if (y >= 145 && x === 117) continue; put(x, y, [0.62, 0.66, 0.6, 0.54, 0.5, 0.44, 0.36][x - 114] - (y === 146 ? 0.1 : 0), M_DANGER, 0); }
  ['M...M', '.M.M.', '..M..', '.M.M.', 'O...O'].forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') put(115 + i, 138 + j, c === 'M' ? 0.86 : 0.6, c === 'M' ? M_STONE : M_UMBER, 0); }));
  for (const tx of [112, 124]) { put(tx, 141, 0.4, M_UMBER, 0); put(tx, 140, 0.3, M_UMBER, 0); }
  // dummies: straw sacks on posts with arms
  DXV = 6;
  for (const [dx, dy] of [[90, 160], [100, 166], [92, 176]]) {
    for (let j = 0; j < 8; j++) put(dx, dy + j, j > 5 ? 0.3 : 0.36, M_UMBER, 0);
    for (let i = -3; i <= 4; i++) put(dx + i, dy + 1, 0.44 - i * 0.02, M_UMBER, 0);
    for (let y = dy - 3; y <= dy + 4; y++) for (let x = dx - 2; x <= dx + 2; x++) { const e = Math.hypot((x + 0.5 - dx - 0.5) / 2.5, (y + 0.5 - dy - 0.5) / 4); if (e < 1) put(x, y, 0.78 - 0.16 * ((x - dx) / 2) - 0.1 * ((y - dy) / 4) - (y === dy + 1 ? 0.2 : 0), M_LOOT, 0); }
    for (let y = dy - 6; y <= dy - 4; y++) for (let x = dx - 1; x <= dx + 1; x++) put(x, y, 0.7 - (x - dx) * 0.12 - (y === dy - 4 ? 0.1 : 0), M_UMBER, 0);
  }
  // targets on easels
  for (const [tx, ty] of [[146, 156], [146, 170]]) {
    put(tx - 2, ty + 4, 0.4, M_UMBER, 0); put(tx - 3, ty + 5, 0.4, M_UMBER, 0); put(tx + 2, ty + 4, 0.3, M_UMBER, 0); put(tx + 3, ty + 5, 0.3, M_UMBER, 0); put(tx, ty + 4, 0.26, M_UMBER, 0); put(tx, ty + 5, 0.26, M_UMBER, 0);
    for (let y = ty - 3; y <= ty + 3; y++) for (let x = tx - 3; x <= tx + 3; x++) { const d = Math.hypot(x - tx, y - ty); if (d <= 3.3) put(x, y, (Math.floor(d) % 2 ? 0.86 : 0.74) - 0.06 * (x - tx) / 3, Math.floor(d) % 2 ? M_UMBER : M_DANGER, 0); }
    put(tx + 1, ty - 1, 0.5, M_STONE, 0); line(tx + 1, ty - 1, tx + 3, ty - 3, 0.6, M_UMBER, 0);
  }
  // weapon rack
  DXV = 5;
  for (let x = 131; x <= 143; x++) { put(x, 150, 0.58, M_UMBER, 0); put(x, 156, 0.46, M_UMBER, 0); }
  for (let k = 0; k < 6; k++) { const x = 132 + k * 2; for (let y = 148; y <= 157; y++) put(x, y, y < 150 ? 0.9 : 0.66 - (k & 1) * 0.12, y < 150 ? M_STONE : M_STONE, 0); put(x, 158, 0.4, M_UMBER, 0); }
  for (const x of [130, 144]) for (let y = 149; y <= 159; y++) put(x, y, 0.36, M_UMBER, 0);
  // hay bales, a water trough
  DXV = 4;
  for (const [hx, hy] of [[136, 176], [140, 179], [132, 180]]) block(hx, hy, 6, 5, 2, { mat: M_LOOT, v: 0.56 });
  for (let y = 180; y <= 183; y++) for (let x = 106; x <= 115; x++) put(x, y, y === 180 ? 0.56 : y === 181 && x > 106 && x < 115 ? 0.3 : 0.36 - (x - 106) * 0.01, y === 181 && x > 106 && x < 115 ? M_STONE : M_UMBER, y === 181 && x === 108 ? 1 : 0);
  brazier(86, 182); brazier(150, 182);
  DXV = 0;
  tl(112, 140, 26, 0.6, FIREC); tl(124, 140, 26, 0.6, FIREC);
  for (const [bx, by] of [[86, 182], [150, 182]]) tl(bx, by - 2, 30, 0.6, FIREC);
}
// Salvage Forge: a rubble-stone smithy under soot-black slates, the hearth open to the street in an arch of
// voussoirs, a tall rubble chimney; a plank lean-to with tools on the wall, a heap of broken blades, helms and
// shields, the anvil on a stump, a steaming quench barrel, a coal pile, a woodpile
function bForge() {
  DXV = 12;
  facade(179, 154, 48, 34, { mat: M_STONE, v: 0.42, sd: 81, m: { hmin: 3, hmax: 5, lmin: 3, lmax: 7, joint: 0.24, vary: 0.2, hi: 0.13 } });
  hipRoof(177, 139, 52, 15, { mat: M_STONE, v: 0.4, soot: 0.12 });
  // the hearth: an arch of voussoirs, soot inside, a bed of embers (flames are animated)
  const hx = 199;
  for (let y = 158; y <= 187; y++) for (let x = 184; x <= 214; x++) {
    const ox = Math.abs(x + 0.5 - hx), top = 164 + Math.max(0, ox - 5) ** 1.6 * 0.42, rTop = top - 3.2;
    if (ox <= 11 && y >= top) {
      if (y < top + 3) put(x, y, 0.08 + 0.06 * hash(x, y, 3), M_STONE, 0);
      else put(x, y, lerp(0.5, 0.98, clamp((y - 168) / 18)) + 0.05 * hash(x, y, 2), M_LOOT, 1);
    } else if (ox <= 14 && y >= rTop && y < 178) {
      const a = Math.atan2(y - 178, x + 0.5 - hx) / 0.26, jt = a % 1 > 0.8;
      put(x, y, jt ? 0.12 : 0.48 + 0.1 * (hash(Math.floor(a), 0, 4) - 0.5) + (x < hx ? 0.06 : -0.08) + (y < top - 2 ? -0.08 : 0.08), M_STONE, 0);
    }
  }
  // bellows by the hearth
  for (let j = 0; j < 5; j++) for (let i = 0; i <= j; i++) put(181 + i, 177 + j, 0.44 - i * 0.04, M_UMBER, 0);
  // tall chimney of rubble, tapering
  DXV = 16;
  const ct = masonry(213, 120, 10, 36, 82, { hmin: 2, hmax: 3, lmin: 2, lmax: 4, joint: 0.2 });
  for (let y = 122; y <= 155; y++) { const inset = y < 128 ? 1 : 0; for (let x = 214 + inset; x <= 221 - inset; x++) put(x, y, 0.46 + ct(x, y) - 0.2 * ((x - 214) / 7) + (x === 214 + inset ? 0.06 : 0) - (y < 126 ? 0.1 : 0), M_STONE, 0); }
  for (let x = 213; x <= 222; x++) { put(x, 121, 0.5 - (x - 213) * 0.02, M_STONE, 0); put(x, 122, 0.3, M_STONE, 0); }
  for (let x = 215; x <= 220; x++) put(x, 120, x === 215 ? 0.4 : 0.05, M_STONE, 0);
  // lean-to: posts, sagging plank roof, a dark inside with tools on the back wall
  DXV = 9;
  const vp = vplanks(83, 2);
  for (let y = 150; y <= 158; y++) for (let x = 227; x <= 263; x++) { const sag = Math.round(Math.sin(((x - 227) / 36) * Math.PI) * 1); if (y > 157 + sag) continue; put(x, y, 0.42 + vp(x, y) - 0.03 * (y - 150) - (y >= 157 + sag ? 0.14 : 0) - 0.08 * ((x - 227) / 36), M_UMBER, 0); }
  for (let y = 159; y <= 187; y++) for (let x = 229; x <= 261; x++) put(x, y, 0.13 + vp(x, y) * 0.4 - (y < 161 ? 0.06 : 0), M_DUSK, 0);
  for (const px of [227, 261]) for (let y = 158; y <= 187; y++) { put(px, y, 0.52, M_UMBER, 0); put(px + 1, y, 0.3, M_UMBER, 0); }
  for (const [tx, kind] of [[233, 0], [238, 1], [243, 0], [248, 2], [254, 1]]) {
    put(tx, 161, 0.6, M_STONE, 0); line(tx, 162, tx, 167, 0.6, M_UMBER, 0);
    if (kind === 0) { rect(tx - 1, 161, 3, 2, 0.74, M_STONE, 0); put(tx + 1, 162, 0.5, M_STONE, 0); }
    else if (kind === 1) { line(tx - 1, 167, tx - 2, 170, 0.66, M_STONE, 0); line(tx + 1, 167, tx + 2, 170, 0.5, M_STONE, 0); }
    else { rect(tx - 1, 167, 3, 3, 0.66, M_STONE, 0); put(tx + 1, 169, 0.42, M_STONE, 0); }
  }
  woodpile(249, 171, 10, 6);
  // the heap of broken gear
  DXV = 4;
  for (let y = 177; y <= 187; y++) for (let x = 236; x <= 254; x++) { const e = Math.hypot((x + 0.5 - 245) / 9.5, (y + 0.5 - 187) / 9); if (e < 1) put(x, y, 0.2 + 0.1 * hash(x >> 1, y >> 1, 7) - 0.06 * ((x - 245) / 9), M_UMBER, 0); }
  for (let k = 0; k < 10; k++) { const sx = 239 + hash(k, 1, 51) * 12, sy = 180 + hash(k, 2, 51) * 5; line(sx - 3, sy + 1, sx + 3, sy - 1, 0.62 + 0.26 * hash(k, 3, 51), M_STONE, 0); }
  for (const [ex, ey, m, v] of [[242, 181, M_STONE, 0.66], [249, 183, M_UMBER, 0.5], [244, 185, M_DANGER, 0.5], [251, 179, M_STONE, 0.56]]) { ellipse(ex, ey, 2.2, 1.8, (x, y) => v - 0.18 * (x - ex) / 2 - 0.1 * (y - ey) / 2, m, 0); put(Math.round(ex - 0.6), Math.round(ey - 0.6), v + 0.22, m, 0); }
  put(249, 183, 0.85, M_LOOT, 0);
  // anvil on its stump, quench barrel, coal pile
  for (let y = 182; y <= 187; y++) for (let x = 229; x <= 234; x++) put(x, y, y === 182 ? 0.62 : 0.38 - (x - 229) * 0.03, M_UMBER, 0);
  for (let x = 227; x <= 236; x++) { put(x, 179, x === 227 ? 0.5 : 0.84 - (x - 227) * 0.03, M_STONE, 0); put(x, 180, x === 227 ? 0.3 : 0.5 - (x - 227) * 0.02, M_STONE, 0); }
  for (let x = 230; x <= 233; x++) put(x, 181, 0.36, M_STONE, 0);
  barrel(255, 178, { water: true });
  for (let y = 183; y <= 187; y++) for (let x = 215; x <= 224; x++) { const e = Math.hypot((x + 0.5 - 219.5) / 5, (y + 0.5 - 187.5) / 5); if (e < 1) put(x, y, hash(x >> 1, y, 9) > 0.8 && (x & 1) ? 0.46 : 0.1, M_STONE, 0); }
  DXV = 0;
  tl(199, 178, 54, 1.1, FIREC); tl(232, 176, 22, 0.4, FIREC);
}
// Inn (Lv1): two half-timbered storeys under a deep rounded thatch with an eyebrow window, the upper floor jettied out
// over the lower, bottle-glass windows, an open door spilling light, barrels, a bench, flower boxes, a stone chimney
function bInn() {
  DXV = 12;
  CHIMS.push(chimney16(322, 126, 5, 12, { soot: true }));
  // ground floor (set back), jetty joists, upper floor
  facade(278, 168, 52, 20, { mat: M_UMBER, v: 0.68, tex: plaster(92), sd: 92, eave: 3, quoins: false });
  timber(278, 171, 52, 14, { step: 9, rails: [0, 13], v: 0.2 });
  facade(276, 152, 56, 16, { mat: M_UMBER, v: 0.74, tex: plaster(93), sd: 93, eave: 2, plinth: 0, quoins: false, moss: false });
  timber(276, 154, 56, 13, { step: 9, rails: [0, 12], v: 0.2, cross: true });
  for (let x = 276; x <= 331; x++) put(x, 167, x % 3 === 0 ? 0.56 : 0.16, M_UMBER, 0);
  // thatch: a hip roof with rounded hips and a thick lip
  hipRoof(274, 133, 60, 20, { mat: M_UMBER, v: 0.44, tex: thatch(91), round: [5, 8], lip: 3, ri: 13, back: 0.32 })
  // eyebrow window in the thatch
  for (let y = 141; y <= 147; y++) for (let x = 299; x <= 309; x++) { const e = Math.hypot((x + 0.5 - 304) / 5.5, (y + 0.5 - 147) / 6); if (e < 1) put(x, y, e > 0.72 ? 0.64 - 0.2 * ((x - 304) / 5) : 0.3, M_UMBER, 0); }
  for (let y = 144; y <= 147; y++) for (let x = 302; x <= 306; x++) put(x, y, x === 304 ? 0.2 : (y === 144 ? 0.72 : 0.9), x === 304 ? M_UMBER : M_LOOT, x === 304 ? 0 : 1);
  // bottle-glass windows (leaded rounds, warm), flower boxes
  const bottle = (wx, wy) => { for (let j = -1; j <= 5; j++) for (let i = -1; i <= 6; i++) { const fr = j < 0 || j > 4 || i < 0 || i > 5; if (fr) put(wx + i, wy + j, j < 0 || i < 0 ? 0.32 : 0.14, M_UMBER, 0); else put(wx + i, wy + j, (i + j) % 2 ? 0.96 : 0.74, M_LOOT, 1); } };
  for (const [wx, wy] of [[281, 156], [299, 156], [317, 156]]) { bottle(wx, wy); flowerBox(wx - 1, wy + 6, 8, [M_DANGER, M_MAGIC, M_LOOT]); }
  bottle(281, 173); bottle(316, 173);
  door16(299, 177, 6, 10, { open: true, arch: false, frame: M_UMBER, fv: 0.36 });
  put(307, 176, 0.3, M_STONE, 0); put(307, 177, 1, M_LOOT, 1); put(307, 178, 0.9, M_LOOT, 1); put(307, 179, 0.3, M_STONE, 0);
  // barrels, a bench
  DXV = 4;
  barrel(278, 181); barrel(283, 182); barrelSide(280, 177); bench(309, 186, 13);
  DXV = 0;
  tl(304, 170, 34, 0.75, WARMC); tl(307, 178, 14, 0.4, WARMC);
}
// plain houses, a chapel, gardens
function bScenery() {
  house16(1, 81, 32, 16, 14, { chimney: 22, dormers: [7, 19], shutters: M_MOSS, boxes: [M_DANGER, M_LOOT] });
  house16(35, 85, 31, 13, 13, { wall: 'plaster', roofMat: M_DUSK, roofV: 0.38, lit: 0.5, chimney: 6, wing: [18, 12, 3], door: 41 });
  house16(1, 145, 32, 16, 13, { wall: 'plaster', roofMat: M_DUSK, roofV: 0.38, dormers: [12], lit: 0.6 });
  house16(35, 147, 31, 14, 13, { chimney: 21, shutters: M_DANGER, lit: 0.6, wing: [0, 12, 3], door: 54 });
  house16(276, 81, 30, 16, 14, { wall: 'plaster', chimney: 20, roofMat: M_DUSK, roofV: 0.38, wing: [1, 12, 3], door: 293 });
  house16(307, 85, 27, 13, 13, { lit: 0.6, shutters: M_MOSS, boxes: [M_MAGIC, M_LOOT] });
  // chapel with a rose window under a steep front gable
  DXV = 12;
  facade(81, 88, 33, 39, { mat: M_STONE, v: 0.4, sd: 33, eave: 0 });
  frontGable(80, 82, 35, 6, 12, { mat: M_DUSK, v: 0.28, shade: true });
  for (let y = 98; y <= 112; y++) for (let x = 90; x <= 104; x++) {
    const d = Math.hypot(x + 0.5 - 97.5, y + 0.5 - 105), a = Math.atan2(y + 0.5 - 105, x + 0.5 - 97.5);
    if (d < 5) put(x, y, d < 1.3 ? 0.9 : ((Math.round(a * 2.5) & 1) ? 0.78 : 0.6), d < 1.3 ? M_LOOT : Math.round(a * 2.5) % 3 === 0 ? M_DANGER : M_MAGIC, 1);
    else if (d < 6.4) put(x, y, (d < 5.7 ? 0.6 : 0.28) + (x < 97 ? 0.06 : -0.08), M_STONE, 0);
  }
  for (let j = 0; j < 6; j++) put(97, 76 + j, 0.62, M_STONE, 0); for (let i = -2; i <= 2; i++) put(97 + i, 78, i < 0 ? 0.66 : 0.46, M_STONE, 0);
  door16(95, 118, 5, 9, {});
  // bottom row, cut by the frame
  const row = [[1, 33, 'stone', M_STONE], [35, 32, 'plaster', M_DUSK], [79, 38, 'clap', M_STONE], [119, 37, 'stone', M_DUSK], [179, 42, 'plaster', M_STONE], [223, 40, 'stone', M_DUSK], [277, 28, 'clap', M_DUSK], [306, 28, 'plaster', M_STONE]];
  row.forEach(([x, w, wall, rm], k) => house16(x, 202, w, 16, 14, { wall, roofMat: rm, roofV: 0.38, chimney: k % 3 === 0 ? Math.round(w * 0.7) : null, dormers: w > 34 && k % 2 ? [Math.round(w / 2) - 3] : [], lit: 0.6, shutters: k % 2 ? M_MOSS : undefined, wing: w > 34 && !(k % 2) ? [w - 14, 13, 3] : k === 1 ? [0, 12, 3] : null, door: w > 34 && !(k % 2) ? x + 8 : k === 1 ? x + 20 : undefined }));
  // gardens, yards, trees
  DXV = 3;
  picket(2, 13, 125); picket(21, 32, 125);
  bush(6, 117, 4, 3, 11, { flowers: M_DANGER }); bush(28, 117, 4, 3, 12);
  woodpile(37, 113, 8, 4); well(45, 124);
  hedge(2, 183, 18, 4, 21); bush(26, 184, 4, 3, 13, { flowers: M_LOOT }); crate(46, 178, 5, 5); crate(51, 180, 4, 4); barrel(57, 179);
  hedge(278, 124, 12, 4, 22); cart(293, 120); bush(318, 124, 4, 3, 14); barrel(312, 116); crate(317, 116, 5, 5); bush(328, 120, 4, 3, 15, { flowers: M_MAGIC });
  DXV = 8;
  cypress(34, 112, 14, 3, 31); tree(63, 40, 5, 38); cypress(3, 34, 13, 3, 39); bush(56, 64, 4, 3, 40, { flowers: M_MAGIC }); cypress(133, 50, 15, 3, 32); cypress(134, 26, 13, 3, 33); cypress(200, 48, 15, 3, 34);
  tree(20, 186, 5, 35); cypress(331, 128, 12, 3, 36); cypress(117, 128, 11, 3, 37);
  DXV = 0;
}
// lantern posts at the street corners (flames animated)
const LANTERNS = [[66, 66], [79, 66], [263, 66], [276, 66], [66, 128], [79, 128], [263, 128], [276, 128], [66, 188], [79, 188], [155, 188], [178, 188], [263, 188], [276, 188]];

function buildTownLayer() {
  TLIGHTS.length = 0; CHIMS.length = 0;
  const L = mkBuf(BA_W, GS_H, true); clearFrame(L); bind(L); CLIP = null; MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0;
  L.BT = new Uint8Array(W * H);
  paintGround();
  fountain();
  for (const [bx, by] of [[121, 84], [212, 84], [121, 125], [212, 125]]) { brazier(bx, by); tl(bx, by - 2, 34, 0.75, FIREC); }
  tl(167, 61, 30, 0.45, VIOLETC); for (const tx of [134, 199]) { DXV = 7; for (let y = 56; y <= 62; y++) put(tx, y, 0.42, M_UMBER, 0); put(tx - 1, 62, 0.3, M_STONE, 0); put(tx + 1, 62, 0.2, M_STONE, 0); tl(tx, 54, 22, 0.55, FIREC); }
  tl(TW.fountain[0], TW.fountain[1], 30, 0.45, COLDC);
  bScenery();
  // the named buildings, each tagged for the hover halo
  const tagBy = (id, fn) => { const k = SPOTS.findIndex((s) => s.id === id) + 1, V0 = L.V.slice(), M0 = L.M.slice(), E0 = L.E.slice(); fn(); for (let i = 0; i < W * H; i++) if (L.V[i] !== V0[i] || L.M[i] !== M0[i] || L.E[i] !== E0[i]) L.BT[i] = k; };
  tagBy('portal', bPortal); tagBy('appraiser', bAppraiser); tagBy('library', plotLevel('library') ? bLibrary : bLibrary0); tagBy('auction', bAuction);
  tagBy('treasury', plotLevel('treasury') ? bTreasury1 : bTreasury0); tagBy('merchant', bMerchant); tagBy('training', plotLevel('training') ? bTraining : bTraining0); tagBy('forge', bForge); tagBy('inn', plotLevel('inn') ? bInn : bInn0);
  for (const [lx, ly] of LANTERNS) { lampPost(lx, ly); tl(lx, ly - 7, 20, 0.5, WARMC); }
  DXV = 0;
  castShadows(L);
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = y * W + x; if (L.E[i] && L.M[i] === M_LOOT && L.V[i] > 0.7 && hash(x, y, 71) < 0.12) tl(x, y + 2, 9, 0.18, WARMC); }
  bakeLM(L);
  L.chimneys = [...CHIMS, [217, 122]];
  return (TOWN_LAYER = L);
}
let TOWN_LAYER = null;
let TOWN_AMB = [0.56, 0.6, 0.84];   // a colder night (#128, the v2 redesign: Ravenhold in rain; was [0.72, 0.72, 0.9])
let TOWN_DITHER = 0.03; // the town is hand-textured pixel art: almost no ordered dither

// ---------------------------------------------------------------- frame
function screenTown(ctx, t, o = {}) {
  setRes(BA_W, GS_H); CX = 167;
  // the live town is rebuilt (and its lights re-baked) only when a building's level changes
  const lv = o.live?.levels ? { library: o.live.levels.library | 0, treasury: o.live.levels.treasury | 0, training: o.live.levels.training | 0, inn: o.live.levels.inn | 0 } : null, key = lv ? JSON.stringify(lv) : '';
  if (key !== TOWN_KEY) { TOWN_LV = lv; TOWN_KEY = key; TOWN_LAYER = null; }
  if (!TOWN_LAYER) ravenholdIron(buildTownLayer());   // Ravenhold in the angel's chest (#128): the puddles, the ribs over the portal, the halo fountain
  const L = TOWN_LAYER;
  const F = buf('ba', BA_W, GS_H); bind(F); CLIP = null;
  F.V.set(L.V); F.M.set(L.M); F.E.set(L.E); F.A.set(L.A); F.T.fill(0); F.DX.fill(0); F.I.set(L.I); F.G.fill(1); F.X.fill(0); F.LM = L.LM;
  MAT = M_STONE; EMI = 0; TAG = 0;
  const lights = [];
  if (o.preview) { const LMs = F.LM, ds = VIEW.strength; VIEW.strength = TOWN_DITHER; F.LM = null; composeInto(ctx, F, { lights, ambient: [0.85, 0.85, 0.9], tint: 0, vig: 0 }, 0); F.LM = LMs; VIEW.strength = ds; return; }
  if (!o.noLife) { townLife(F, t, lights, o); townRain(F, t, lights); }   // it always rains (#128): over the town, under its UI
  if (!o.noUI) townUI(F, t, lights, o);
  const ds = VIEW.strength; VIEW.strength = TOWN_DITHER;
  composeInto(ctx, F, { lights, ambient: TOWN_AMB, tint: 0.26, vig: 0 }, 0);
  VIEW.strength = ds;
}
// ---------------------------------------------------------------- townsfolk: 6 px tall, 3 wide
const FOLK = {
  knight: { hd: [M_STONE, 0.75], bd: [M_STONE, 0.55], lg: [M_STONE, 0.35] },
  mage: { hd: [M_DUSK, 0.45], bd: [M_DUSK, 0.38], lg: [M_DUSK, 0.3], staff: true },
  archer: { hd: [M_MOSS, 0.45], bd: [M_MOSS, 0.38], lg: [M_UMBER, 0.3], bow: true },
  rogue: { hd: [M_DUSK, 0.2], bd: [M_DUSK, 0.22], lg: [M_DUSK, 0.18] },
  cleric: { hd: [M_UMBER, 0.85], bd: [M_UMBER, 0.78], lg: [M_UMBER, 0.6] },
  guard: { hd: [M_STONE, 0.7], bd: [M_DANGER, 0.6], lg: [M_STONE, 0.3], spear: true },
  folkA: { hd: [M_UMBER, 0.55], bd: [M_UMBER, 0.42], lg: [M_UMBER, 0.28] },
  folkB: { hd: [M_UMBER, 0.55], bd: [M_DUSK, 0.45], lg: [M_DUSK, 0.28] },
  folkC: { hd: [M_UMBER, 0.55], bd: [M_MOSS, 0.42], lg: [M_UMBER, 0.28] },
  kid: { hd: [M_UMBER, 0.6], bd: [M_DANGER, 0.55], lg: [M_UMBER, 0.3], small: true },
  bard: { hd: [M_UMBER, 0.6], bd: [M_LOOT, 0.55], lg: [M_DUSK, 0.3], lute: true },
  smith: { hd: [M_UMBER, 0.55], bd: [M_UMBER, 0.3], lg: [M_UMBER, 0.22] },
};
function folk(x, y, kind, t, walk = 0, face = 1, o = {}) {
  const K = FOLK[kind] || FOLK.folkA, s = K.small ? 1 : 0, step = walk ? (Math.floor(t * 6 + walk * 7) & 1) : 0;
  x = Math.round(x); y = Math.round(y);
  const H0 = y - 6 + s * 2;
  put(x, H0, K.hd[1] * 0.7, K.hd[0]); put(x + 1, H0, K.hd[1] * 0.7, K.hd[0]);                                  // hair / hood / helm
  put(x, H0 + 1, 0.62, M_UMBER); put(x + 1, H0 + 1, 0.5, M_UMBER);                                             // face
  if (kind === 'knight' || kind === 'guard') { put(x, H0, 0.85, M_STONE); put(x + 1, H0, 0.7, M_STONE); put(x + 1, H0 + 1, 0.3, M_STONE); }
  for (let j = 2; j <= 3 - s; j++) for (let i = -1 + s; i <= 2 - s; i++) put(x + i, H0 + j, K.bd[1] * (i === -1 + s ? 1.15 : i === 2 - s ? 0.8 : 1), K.bd[0]);
  put(x + (step ? -0 : 0), y - 1, K.lg[1], K.lg[0]); put(x + 1, y - 1, K.lg[1] * 0.8, K.lg[0]);
  put(x + (step ? -1 : 0), y, K.lg[1] * 0.8, K.lg[0]); put(x + (step ? 2 : 1), y, K.lg[1] * 0.7, K.lg[0]);
  const hx = face > 0 ? x + 2 : x - 1;
  if (K.staff) { for (let j = 0; j < 7; j++) put(hx, y - 1 - j, 0.4, M_UMBER); put(hx, y - 8, 1, M_MAGIC, 1); o.lights && o.lights.push({ x: hx, y: y - 8, r: 9, i: 0.5, c: VIOLETC }); }
  if (K.spear) { for (let j = 0; j < 9; j++) put(hx, y - 1 - j, 0.4, M_UMBER); put(hx, y - 10, 0.85, M_STONE); }
  if (K.bow) { put(hx, H0 + 1, 0.55, M_UMBER); put(hx, H0 + 2, 0.55, M_UMBER); put(hx, H0 + 3, 0.55, M_UMBER); }
  if (K.lute) { put(hx, H0 + 3, 0.7, M_UMBER); put(hx + face, H0 + 2, 0.55, M_UMBER); }
  if (o.lantern) { put(hx, H0 + 3, 1, M_LOOT, 1); o.lights && o.lights.push({ x: hx, y: H0 + 3, r: 14, i: 0.45, c: WARMC }); }
  if (o.crate) { rect(hx - (face > 0 ? 0 : 1), H0 + 2, 2, 2, 0.45, M_UMBER); }
  if (o.raise) { put(x + 2, H0 - 1, 0.62, M_UMBER); put(x + 2, H0 - 2, 0.9, o.raise, 1); }
}
// walkers on the street grid: each follows a loop of points at its own pace
const ROUTES = [
  [[0, 74], [334, 74]], [[334, 136], [0, 136]], [[0, 196], [334, 196]], [[73, 14], [73, 232]], [[270, 232], [270, 14]],
  [[166, 232], [166, 132]], [[60, 74], [73, 74], [73, 136], [155, 136]], [[334, 74], [270, 74], [270, 196], [180, 196]],
];
const WALKERS = Array.from({ length: 26 }, (_, k) => ({ r: k % ROUTES.length, off: hash(k, 1, 91), sp: 0.012 + hash(k, 2, 91) * 0.012, kind: ['folkA', 'folkB', 'folkC', 'guard', 'folkA', 'archer', 'folkB', 'cleric'][k % 8], lantern: k % 5 === 1, crate: k % 7 === 3 }));
function routePos(R, q) {
  let L = 0; const seg = []; for (let k = 0; k < R.length - 1; k++) { const d = Math.hypot(R[k + 1][0] - R[k][0], R[k + 1][1] - R[k][1]); seg.push(d); L += d; }
  let d = (q % 1) * L; for (let k = 0; k < seg.length; k++) { if (d <= seg[k]) { const f = d / seg[k]; return [lerp(R[k][0], R[k + 1][0], f), lerp(R[k][1], R[k + 1][1], f), Math.sign(R[k + 1][0] - R[k][0]) || 1]; } d -= seg[k]; }
  return [R[R.length - 1][0], R[R.length - 1][1], 1];
}
// the crowds: adventurers at the portal court, townsfolk on the plaza, each building's own people
const CROWD = [
  ...[[138, 60, 'knight'], [144, 63, 'mage'], [150, 59, 'archer'], [156, 64, 'cleric'], [161, 58, 'rogue'], [176, 63, 'knight'], [182, 59, 'mage'], [188, 64, 'archer'], [193, 60, 'cleric'], [171, 66, 'rogue'], [140, 67, 'mage'], [196, 67, 'knight'], [148, 67, 'folkB'], [186, 67, 'folkA']],
  ...[[150, 51, 'guard'], [184, 51, 'guard']],
  ...[[128, 92, 'bard'], [124, 97, 'folkA'], [132, 98, 'folkB'], [127, 101, 'folkC'], [136, 94, 'folkA'], [146, 115, 'folkB'], [188, 116, 'folkC'], [150, 93, 'folkA'], [184, 92, 'folkB'], [196, 124, 'guard'], [140, 126, 'folkC'], [176, 127, 'folkA'], [122, 118, 'folkB'], [208, 100, 'folkA'], [205, 122, 'folkC']],
  ...[[33, 76, 'mage'], [39, 77, 'folkB'], [256, 80, 'folkA'], [252, 66, 'folkB'], [218, 66, 'folkC'], [212, 64, 'folkA'], [236, 125, 'folkB'], [229, 125, 'smith'], [290, 66, 'guard'], [96, 66, 'cleric'], [114, 66, 'folkC'], [310, 189, 'folkA'], [316, 189, 'folkB'], [294, 189, 'folkC'], [287, 180, 'folkA']],
];
function flame(x, y, t, n, mat = M_LOOT, h = 3) { for (let j = 0; j < h; j++) { const w = j === 0 ? 1 : 0; for (let i = -w; i <= w; i++) put(x + i + (j === h - 1 && hash(n, Math.floor(t * 9), 4) > 0.5 ? 1 : 0), y - j, 1 - j * 0.16 - (i ? 0.1 : 0), mat, 1); } }
function smoke(x, y, t, n, len = 18) { for (let k = 0; k < 6; k++) { const q = ((t * 0.18 + k / 6 + hash(n, 0, 5)) % 1), sx = x + Math.sin(q * 5 + n) * 2 + q * 6, sy = y - q * len, r = 0.6 + q * 2.2; for (let j = Math.floor(sy - r); j <= sy + r; j++) for (let i = Math.floor(sx - r); i <= sx + r; i++) { if (i < 0 || j < 0 || i >= W || j >= H) continue; const d = Math.hypot(i - sx, j - sy) / r; if (d < 1) { const ii = j * W + i; B.X[ii] += (1 - d) * 0.08 * (1 - q); } } } }

function townLife(F, t, lights, o) {
  // portal: the vortex turning inside the arch, violet braziers, the rune ring in the court
  const cx = 167;
  for (let y = 8; y <= 49; y++) for (let x = 151; x <= 183; x++) {
    const i = y * W + x; if (F.M[i] !== M_DUSK || F.V[i] > 0.05) continue;
    const dx = x + 0.5 - cx, dy = (y + 0.5 - 30) * 1.15, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const sw = Math.sin(a * 2 + r * 0.42 - t * 3.2), g = clamp(1 - r / 24);
    put(x, y, clamp(0.2 + 0.55 * g + 0.25 * sw * g + (r < 3 ? 0.4 : 0)), sw > 0.55 && g > 0.2 ? M_DANGER : M_MAGIC, 1);
  }
  lights.push({ x: cx, y: 30, r: 46, i: 0.55 + 0.1 * Math.sin(t * 2), c: VIOLETC });
  for (const bx of [143, 191]) { flame(bx, 45, t, bx, M_MAGIC, 4); }
  for (let a = 0; a < 120; a++) { const an = a / 120 * 6.283 + t * 0.3, x = Math.round(167 + Math.cos(an) * 25), y = Math.round(61 + Math.sin(an) * 4.5); if (a % 6 < 4) put(x, y, a % 12 === 0 ? 1 : 0.62, M_MAGIC, 1); }
  // a hero walking up the steps and vanishing in a violet flash
  { const q = (t % 7) / 7; if (q < 0.7) folk(167, Math.round(58 - q / 0.7 * 12), 'knight', t, 1, 1); else if (q < 0.82) { const k = (q - 0.7) / 0.12; for (let n = 0; n < 10; n++) put(Math.round(167 + Math.cos(n * 0.63) * k * 7), Math.round(44 + Math.sin(n * 0.63) * k * 5), 1 - k * 0.6, M_MAGIC, 1); lights.push({ x: 167, y: 44, r: 30, i: 0.9 * (1 - k), c: VIOLETC }); } }
  // court torches, fire bowls, lanterns
  for (const tx of [134, 199]) flame(tx, 55, t, tx, M_LOOT, 3);
  for (const [bx, by] of [[121, 84], [212, 84], [121, 125], [212, 125]]) { flame(bx, by - 1, t, bx + by, M_LOOT, 4); flame(bx - 1, by - 1, t, bx * 3, M_LOOT, 2); flame(bx + 1, by - 1, t, by * 5, M_LOOT, 2); }
  for (const [lx, ly] of LANTERNS) { put(lx - 1, ly - 7, 0.3, M_STONE); put(lx + 1, ly - 7, 0.3, M_STONE); put(lx, ly - 7, 0.9 + 0.1 * Math.sin(t * 7 + lx), M_LOOT, 1); put(lx, ly - 8, 0.4, M_STONE); }
  // the fountain: water lit from inside, rings moving out
  { const [fx, fy] = TW.fountain; for (let y = fy - 10; y <= fy + 10; y++) for (let x = fx - 19; x <= fx + 19; x++) { const d = Math.hypot((x - fx) / 17, (y - fy) / 9.5); if (d >= 1) continue; const rip = Math.sin(d * 14 - t * 3) > 0.7; put(x, y, 0.42 + 0.3 * (1 - d) + (rip ? 0.18 : 0), M_STONE, 1); }
    rect(fx - 1, fy - 9, 3, 9, (x) => (x === fx - 1 ? 0.7 : 0.45), M_STONE, 0); ellipse(fx + 0.5, fy - 9.5, 3, 1.4, 0.62, M_STONE, 0);
    for (let k = 0; k < 6; k++) { const q = (t * 1.4 + k / 6) % 1, an = k * 1.05; put(Math.round(fx + Math.cos(an) * q * 6), Math.round(fy - 10 + q * q * 9 - q * 3), 0.95 - q * 0.4, M_STONE, 1); }
    lights.push({ x: fx, y: fy, r: 26, i: 0.3, c: COLDC }); }
  // two strings of lights across the plaza
  for (const [a, b] of [[[121, 82], [212, 82]], [[121, 123], [212, 123]]]) for (let k = 0; k <= 22; k++) { const q = k / 22, x = Math.round(lerp(a[0], b[0], q)), y = Math.round(lerp(a[1], b[1], q) + Math.sin(q * Math.PI) * 4); put(x, y, (k + Math.floor(t * 2)) % 5 === 0 ? 0.7 : 1, M_LOOT, 1); }
  // appraiser: runes circling the spire crystal, the appraiser in a rune circle with a customer
  for (let k = 0; k < 5; k++) { const an = t * 1.6 + k * 1.256; put(Math.round(40 + Math.cos(an) * 6), Math.round(2 + Math.sin(an) * 2), 0.9, M_MAGIC, 1); }
  for (let a = 0; a < 40; a++) { const an = a / 40 * 6.283 - t; if (a % 3) put(Math.round(36 + Math.cos(an) * 6), Math.round(77 + Math.sin(an) * 2), 0.7, M_MAGIC, 1); }
  // forge: the hearth roaring, sparks off the anvil, smoke from the tall chimney
  for (let k = 0; k < 14; k++) { const x = 190 + k * 1.6, h = 4 + Math.round(5 * (0.5 + 0.5 * Math.sin(t * 10 + k * 1.7))); for (let j = 0; j < h; j++) put(Math.round(x), 186 - j, 1 - j * 0.07, M_LOOT, 1); }
  lights.push({ x: 199, y: 178, r: 40, i: 0.35 + 0.15 * Math.sin(t * 9), c: FIREC });
  { const hit = (t * 2.2) % 1 < 0.15; folk(229, 182, 'smith', t, 0, 1, { raise: hit ? null : M_STONE }); if (hit) { for (let k = 0; k < 7; k++) put(Math.round(232 + Math.cos(k) * 4 * ((t * 2.2) % 1 / 0.15)), Math.round(178 - Math.abs(Math.sin(k)) * 4 * ((t * 2.2) % 1 / 0.15)), 1, M_LOOT, 1); lights.push({ x: 232, y: 178, r: 18, i: 0.6, c: FIREC }); } }
  smoke(258, 176, t, 3, 10);
  // chimney smoke everywhere, sparks from the forge chimney
  for (const [i0, [sx, sy]] of (TOWN_LAYER.chimneys || []).entries()) smoke(sx, sy, t, i0, i0 === TOWN_LAYER.chimneys.length - 1 ? 26 : 16);
  for (let k = 0; k < 5; k++) { const q = (t * 0.5 + k / 5) % 1; put(Math.round(218 + Math.sin(q * 9 + k) * 3), Math.round(122 - q * 22), 1 - q * 0.7, M_LOOT, 1); }
  // training grounds: two sparring in the ring (once it is built)
  if (plotLevel('training')) { const sw = Math.sin(t * 5); folk(119 + Math.round(sw), 173, 'knight', t, 0, 1); folk(128 - Math.round(sw), 173, 'folkC', t, 0, -1); if (sw > 0.9) put(124, 168, 1, M_STONE, 1); }
  if (plotLevel('training')) { for (const tx of [112, 124]) flame(tx, 139, t, tx * 7, M_LOOT, 3); for (const [bx, by] of [[86, 182], [150, 182]]) flame(bx, by - 1, t, bx * 11, M_LOOT, 3); }
  // treasury plot: the work lamp flickers, a guard already on watch
  folk(292, 66, 'guard', t, 0, 1);
  // bard's notes rising
  for (let k = 0; k < 3; k++) { const q = (t * 0.4 + k / 3) % 1; const x = Math.round(130 + q * 6 + Math.sin(q * 6) * 2), y = Math.round(86 - q * 14); put(x, y, 0.9 - q * 0.5, M_LOOT, 1); put(x + 1, y - 1, 0.7 - q * 0.4, M_LOOT, 1); put(x + 1, y - 2, 0.7 - q * 0.4, M_LOOT, 1); }
  // auction: bidders raising paddles in turn
  // crowds and walkers
  CROWD.forEach(([x, y, kind], k) => folk(x, y, kind, t, 0, k % 3 === 0 ? -1 : 1, { lights, raise: (kind === 'folkA' || kind === 'folkC') && y > 60 && y < 70 && x > 205 && x < 262 && Math.floor(t * 0.8 + k) % 4 === 0 ? M_LOOT : null }));
  // kids chasing around the fountain
  for (let k = 0; k < 3; k++) { const an = t * 1.3 + k * 0.6, [fx, fy] = TW.fountain; folk(fx + Math.cos(an) * 25, fy + 2 + Math.sin(an) * 14, 'kid', t, 1 + k, Math.sin(an) > 0 ? -1 : 1); }
  for (const w of WALKERS) { const [x, y, f] = routePos(ROUTES[w.r], t * w.sp + w.off); folk(x, y + 2, w.kind, t, 1 + w.off, f, { lights, lantern: w.lantern, crate: w.crate }); }
}

// ---------------------------------------------------------------- map UI: halo, trade signs, name signs, overlay, tooltip
const MARK_AT = { appraiser: [52, 44], library: [124, 44], auction: [264, 38], treasury: [318, 56], merchant: [210, 96], training: [114, 141], forge: [226, 158], inn: [325, 158] };
function markSign(id, hot) {
  const plot = SPOTS.find((s) => s.id === id).kind === 'plot', lv = plot ? plotLevel(id) : 1, board = plot && !lv;
  const [x, y] = board ? PLOT_BOARD[id] ?? MARK_AT[id] : id === 'treasury' ? [316, 49] : MARK_AT[id], m = SPOTS.find((s) => s.id === id).mark;
  if (!board && id !== 'training') { put(x + 4, y - 2, 0.4, M_STONE); put(x + 1, y - 2, 0.4, M_STONE); put(x + 2, y - 2, 0.4, M_STONE); put(x + 3, y - 2, 0.4, M_STONE); put(x + 1, y - 1, 0.3, M_STONE); put(x + 7, y - 1, 0.3, M_STONE); }
  if (board || id !== 'training') { rectI(x, y, 9, 9, P.void); rectI(x + 1, y + 1, 7, 7, hot ? P.u3 : P.u2); }
  sprite(x + 1, y + 1, MARK[m], { O: hot ? 'pale' : 'u6', Y: 'gold', X: 'arcane', M: 'moon', u: 'u4' });
}
function nameSign(sp, hot) {
  if (!sp.sign) return;
  const [cx, y] = sp.sign, w = measure(sp.name, 'tiny') + 6, x = Math.round(cx - w / 2);
  shadowU(x, y, w, 8, { k: 0.55, r: 2, dx: 1, dy: 2 });
  for (const px of [x + 2, x + w - 3]) { put(px, y + 8, 0.3, M_UMBER, 0); put(px, y + 9, 0.22, M_UMBER, 0); }
  rectI(x, y, w, 8, P.void); rectI(x + 1, y + 1, w - 2, 6, hot ? P.u3 : P.u2); rectI(x + 1, y + 1, w - 2, 1, hot ? P.u5 : P.u3);
  text(sp.name, x + 3, y + 2, 'tiny', hot ? P.moon : P.u6);
}
function hoverHalo(L, k, t, mat) {
  const sp = SPOTS[k - 1], [bx, by, bw, bh] = sp.box, R = 4, a = 0.5 + 0.5 * Math.sin(t * 2.6);
  const x0 = Math.max(1, bx - 5), x1 = Math.min(W - 2, bx + bw + 5), y0 = Math.max(1, by - 5), y1 = Math.min(H - 2, by + bh + 5);
  const D = new Float32Array((x1 - x0 + 1) * (y1 - y0 + 1)), ww = x1 - x0 + 1, at = (x, y) => (y - y0) * ww + (x - x0);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) D[at(x, y)] = L.BT[y * W + x] === k ? 0 : 99;
  for (let y = y0 + 1; y <= y1; y++) for (let x = x0 + 1; x < x1; x++) { const i = at(x, y); if (!D[i]) continue; D[i] = Math.min(D[i], D[i - 1] + 1, D[i - ww] + 1, D[i - ww - 1] + 1.41, D[i - ww + 1] + 1.41); }
  for (let y = y1 - 1; y >= y0; y--) for (let x = x1 - 1; x > x0; x--) { const i = at(x, y); if (!D[i]) continue; D[i] = Math.min(D[i], D[i + 1] + 1, D[i + ww] + 1, D[i + ww + 1] + 1.41, D[i + ww - 1] + 1.41); }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const d = D[at(x, y)], i = y * W + x;
    if (d === 0) { B.X[i] += 0.05 + 0.04 * a; continue; }
    if (d < R) { const g = (1 - d / R) ** 1.2 * (0.6 + 0.4 * a); B.X[i] += g * (mat === M_LOOT ? 1.05 : 0.6); B.M[i] = mixMat(x, y, B.M[i], mat, Math.min(1, g * 2.4)); B.E[i] = 0; }
  }
}
function tooltip(sp, st, t) {
  const lines = [];
  if (sp.kind === 'plot') {
    const b = BUILD[sp.id], lv = st.levels[sp.id];
    lines.push([lv ? `Level ${lv}: ${b.fx(lv)}` : 'Empty plot, materials ready.', P.u5]);
    if (lv < 3) { const [g, sc] = b.cost[lv]; lines.push([`${lv ? 'Upgrade' : 'Build'}: ${b.fx(lv + 1)}`, P.u6]); lines.push([`${g} g · ${sc} Souls`, g <= st.gold && sc <= (st.souls ?? st.scraps) ? P.gold : P.u4]); }
  } else { lines.push([sp.line, P.u6]); if (sp.sub) lines.push([sp.sub, P.d6]); }
  const tw = Math.max(measure(sp.name.toUpperCase(), 'silkb', 1), ...lines.map(([l]) => measure(l, 'tiny'))) + 14, th = 16 + lines.length * 7;
  let [bx, by, bw, bh] = sp.box; let x = Math.round(bx + bw / 2 - tw / 2), y = by + bh + 12;
  if (y + th > H - 4) y = by - th - 4; if (y < 4) y = by + bh + 12; x = Math.max(4, Math.min(W - tw - 4, x));
  if (sp.id === 'portal') { x = 204; y = 4; }
  shadowU(x, y, tw, th, { k: 0.7, r: 5, dx: 3, dy: 4 });
  leatherU(x + 3, y + 3, tw - 6, th - 6, { v: 0.14, vig: 0.3 });
  mouldU(x, y, tw, th, { mat: sp.id === 'portal' ? M_MAGIC : M_UMBER, bosses: false, k: sp.id === 'portal' ? 1.1 : 1 });
  text(sp.name.toUpperCase(), x + 7, y + 6, 'silkb', sp.id === 'portal' ? P.moon : P.u6, { ls: 1, shadow: P.void });
  lines.forEach(([l, c], k) => text(l, x + 7, y + 14 + k * 7, 'tiny', c, { shadow: P.void }));
}
function townUI(F, t, lights, o) {
  const L = TOWN_LAYER, st = { ...SIDE_TOWN };
  const order = ['appraiser', 'treasury', 'portal', 'forge', 'library', 'merchant', 'inn', 'auction', 'training'];
  const hid = o.live ? o.hover : o.hover ?? order[Math.floor(t / 3) % order.length], hk = SPOTS.findIndex((s) => s.id === hid) + 1;
  if (hk > 0) hoverHalo(L, hk, t, hid === 'portal' ? M_MAGIC : M_LOOT);
  if (hid === 'portal') lights.push({ x: 167, y: 30, r: 60, i: 0.35 + 0.15 * Math.sin(t * 2.6), c: VIOLETC });
  for (const id of Object.keys(MARK_AT)) markSign(id, id === hid);
  // the portal's name sits on the cliff over the arch
  { const w = measure('Dungeon Portal', 'tiny') + 6, x = Math.round(167 - w / 2), hot = hid === 'portal'; shadowU(x, 0, w, 8, { k: 0.5, r: 2, dx: 1, dy: 2 }); rectI(x, 0, w, 8, P.void); rectI(x + 1, 0, w - 2, 7, hot ? P.d2 : P.u2); rectI(x + 1, 0, w - 2, 1, hot ? P.d4 : P.u3); text('Dungeon Portal', x + 3, 1, 'tiny', hot ? P.moon : P.u6); }
  for (const sp of SPOTS) nameSign(sp, sp.id === hid);
  smokeU(0, 0, 92, 18, 0.62);
  text('Ravenhold · town', 4, 4, 'tiny', P.u6, { shadow: P.void });
  if (!o.noTip && hk > 0) tooltip(SPOTS[hk - 1], o.live ? { ...st, ...o.live } : st, t);
}
const SIDE_TOWN = { gold: 650, scraps: 26, record: 4, floor: 1, autoSalvage: true, levels: { training: 1, inn: 1, library: 1, treasury: 0 },
  bag: [{ icon: 'armor', r: 'epic', pow: 41 }, { icon: 'ring', r: 'rare', pow: 27 }, { icon: 'boots', r: 'uncommon', pow: 14 }, { icon: 'unknown', r: 'epic' }, { icon: 'map', r: 'rare' }] };
const GEAR5 = ['.u.u.', 'uuuuu', 'uu.uu', 'uuuuu', '.u.u.'];
const PIP_ON = ['..O..', '.OYO.', 'OYYYO', '.OYO.', '..O..'], PIP_OFF = ['..v..', '.v2v.', 'v222v', '.v2v.', '..v..'];
function sidePanelTown(st, t) {
  leatherU(0, 0, W, H, { v: 0.16, vig: 0.45 });
  for (let j = 0; j < H; j++) { putU(0, j, 0.02); putU(1, j, 0.78 + 0.06 * (GR(1, j) - 0.5)); putU(2, j, 0.3); putU(3, j, 0.05); }
  const X0 = 4, PW = W - 4;
  headerBar(X0, 0, PW, 'RAVENHOLD · BUILD', '');
  const order = ['appraiser', 'treasury', 'portal', 'forge', 'library', 'merchant', 'inn', 'auction', 'training'], hid = order[Math.floor(t / 3) % order.length];
  ['training', 'inn', 'library', 'treasury'].forEach((id, k) => {
    const b = BUILD[id], lv = st.levels[id], y = 11 + k * 19, hot = id === hid;
    if (hot) { for (let j = y; j < y + 18; j++) for (let i = X0; i < X0 + PW; i++) putU(i, j, 0.3 - 0.1 * ((j - y) / 18) + 0.03 * (GR(i, j) - 0.5)); rectI(X0, y, 1, 18, P.gold); }
    for (let i = X0 + 2; i < X0 + PW - 2; i++) { putU(i, y + 18, 0.04); putU(i, y + 19, 0.32); }
    const nw = text(b.name, X0 + 4, y + 3, 'tiny', hot ? P.moon : P.u6, { shadow: P.void });
    for (let p = 0; p < 3; p++) sprite(X0 + 7 + nw + p * 6, y + 3, p < lv ? PIP_ON : PIP_OFF, { O: 'gold', Y: 'pale' });
    text(lv >= 3 ? b.fx(lv) : `Next: ${b.fx(lv + 1)}`, X0 + 4, y + 11, 'tiny', P.u5, { shadow: P.void });
    const bw = 40, bx = X0 + PW - bw - 3, by = y + 2;
    if (lv >= 3) { text('MAX LEVEL', bx + bw / 2, by + 5, 'tiny', P.u4, { align: 'c' }); return; }
    const [g, sc] = b.cost[lv], ok = g <= st.gold && sc <= (st.souls ?? st.scraps);
    shadowU(bx, by, bw, 15, { k: 0.5, r: 2, dx: 1, dy: 2 });
    plateU(bx, by, bw, 15, ok ? { top: 0.5, bot: 0.26, hi: 0.82 } : { top: 0.26, bot: 0.16, hi: 0.4, lo: 0.08 });
    text(lv ? 'Upgrade' : 'Build', bx + bw / 2, by + 2, 'tiny', ok ? P.moon : P.u4, { align: 'c', shadow: ok ? P.void : undefined });
    const cs = `${g}g ${sc}`, cw = measure(cs, 'tiny') + 6, cx0 = Math.round(bx + bw / 2 - cw / 2);
    text(cs, cx0, by + 9, 'tiny', ok ? P.gold : P.u4, { shadow: ok ? P.void : undefined }); soulGlyph(cx0 + cw - 5, by + 8, !ok);
  });
  // enter the dungeon
  { const bx = X0 + 2, by = 90, bw = PW - 4, bh = 16;
    shadowU(bx, by, bw, bh, { k: 0.6, r: 3, dx: 1, dy: 2 });
    plateU(bx, by, bw, bh, { mat: M_MAGIC, top: 0.4, bot: 0.3, hi: 0.86, hiMat: M_DUSK, lo: 0.2, grain: 0.03 });
    text(`Enter the dungeon · floor ${st.floor}`, bx + bw / 2, by + 6, 'tiny', P.moon, { align: 'c', shadow: P.void }); }
  // bag, treasury row and footer, as in the dungeon
  headerBar(X0, 113, PW, 'BAG', '');
  const cnt = st.bag.filter(Boolean).length + '/18';
  text(cnt, X0 + 34, 116, 'tiny', P.u6, { shadow: P.void });
  const ax = X0 + PW - 34;
  wellU(ax, 114, 31, 8, { v: 0.08 });
  if (st.autoSalvage) for (let j = 115; j < 121; j++) for (let i = ax + 1; i < ax + 30; i++) putU(i, j, lerp(0.42, 0.2, (j - 115) / 5), M_MOSS);
  sprite(ax + 2, 116, ['.qqq.', 'qssss', '.qq..', '.q.q.']);
  text(st.autoSalvage ? 'AUTO' : 'off', ax + 9, 116, 'tiny', st.autoSalvage ? P.g6 : P.u4, { shadow: P.void });
  for (let k = 0; k < 18; k++) itemCell(X0 + 2 + (k % 6) * 22, 126 + Math.floor(k / 6) * 22, st.bag[k], {});
  const open = st.levels.treasury * 2;
  for (let k = 0; k < 6; k++) itemCell(X0 + 2 + k * 22, 194, null, { locked: k >= open });
  footerMoney(X0, PW, st);
}
