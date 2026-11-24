// ===========================================================================
// The right screen: desk + monitor, 492 × 360 at x 148 of the 640 × 360 grid. Real life, drawn as modern pixel
// art: a dark room lit almost only by the monitor, whose light takes the colour of what is on screen (sampled
// every frame). Mac OS 8 Platinum chrome on the taskbar, iOS on the phone, flat glass cards for YOU and the feed,
// the Tonight note in a slanted ballpoint hand. The game screen (474 × 232) is pasted in at 9, 8.
// ===========================================================================
const RS_W = 492, RS_H = 360;
const RSZ = { bezel: [4, 3, 484, 260], game: [9, 8, 474, 232], task: [9, 241, 474, 15], desk: [0, 263, 492, 97], phone: [0, 268, 120, 92], keys: [96, 282, 360, 78], note: [208, 248, 74, 45], you: [355, 267, 133, 26], feed: [355, 296, 133, 61] };

// ---------------------------------------------------------------- the desk's own palette (three variants + backup)
// Three worlds, one core. Every world palette keeps the same eight anchors in the same slots: the ink (void), the
// paper (moon), and the six meaning colours: gold (money, the next action), crimson (danger), arcane (Tired, magic),
// dusk pink (her), pale cyan (Zone, the headset), moss (HP, zl, success). The other 24 slots are the world's own,
// so the desk code (which names slots, not colours) draws in any of them.
const CORE8 = { void: '#0a0814', moon: '#f2efdc', gold: '#f1a934', crimson: '#d23c5a', arcane: '#8b5ad6', d6: '#d9a69c', s6: '#81c1c8', g5: '#749970' };
// slot 32, 'steel', is the knight's class colour (Moonwell's s5): with violet and gold it makes the three class
// colours the desk shares with the game, so a hero's keys light in the colour of his portrait's outline
const STEEL = '#5398b5'; P.steel = 32;
// slot 33, 'ember', is Garrote's class colour (Moonwell's copper): UI-only on the desk, so it never enters the dither
const EMBER = '#c16229'; P.ember = 33;
// slots 34 to 36: the Windows 98 title-bar blues (navy, blue, sky), UI-only, only ever on the monitor's glass (win98.js)
const WIN98 = ['#0b1d5a', '#1f4a9c', '#4a86cf']; P.wnavy = 34; P.wblue = 35; P.wsky = 36;
const deskHexes = (o) => [CORE8.void, o.s1, o.s2, o.s3, o.s4, o.s5, CORE8.s6, o.g1, o.g2, o.g3, o.g4, CORE8.g5, o.g6, o.d1, o.d2, o.d3, o.d4, o.d5, CORE8.d6,
  o.u1, o.u2, o.u3, o.u4, o.u5, o.u6, CORE8.moon, o.wine, o.copper, CORE8.gold, o.pale, CORE8.crimson, CORE8.arcane, STEEL, EMBER, ...WIN98];
const DESK_RAMPS = [
  [P.void, P.s1, P.s2, P.s3, P.s4, P.s5, P.moon],            // hardware: the world's neutrals (no cyan in it: cyan means Zone)
  [P.void, P.d2, P.wine, P.copper, P.gold, P.pale],
  [P.void, P.s2, P.arcane, P.d6, P.moon],
  [P.void, P.d2, P.wine, P.crimson],
  [P.void, P.g1, P.g2, P.g3, P.g4, P.g5, P.g6, P.moon],
  [P.void, P.d1, P.d2, P.d3, P.d4, P.d5, P.d6, P.moon],
  [P.void, P.u1, P.u2, P.u3, P.u4, P.u5, P.u6, P.moon],
];
const DESK_VARIANTS = {
  moonwell: { name: 'Moonwell 32 (backup)', amb: [0.1, 0.09, 0.15], knight: 's5' },
  // A: the home is warm. Walnut, brass, beige, warm graphite; shadows sink to aubergine, highlights to cream. The
  // cold comes only from the screen; a faint warm light from the room behind you (her side) meets it on the desk.
  tungsten: { name: 'A · Tungsten', amb: [0.12, 0.09, 0.08], knight: 's5', behind: [1.35, 0.82, 0.48], hexes: deskHexes({
    s1: '#1a1619', s2: '#2a2428', s3: '#3e373a', s4: '#5b5352', s5: '#8a8079',
    g1: '#141a12', g2: '#22301c', g3: '#34512a', g4: '#50733f', g6: '#b9c693',
    d1: '#1d1316', d2: '#321e23', d3: '#4c2c31', d4: '#6e4144', d5: '#9a6160',
    u1: '#1e130e', u2: '#351f15', u3: '#54301d', u4: '#7a4a2b', u5: '#a9835c', u6: '#d8c6a2',
    wine: '#6e2626', copper: '#c4682c', pale: '#f8dfa0' }) },
  // B: reality is grey. Neutral greys with no hue shift, greige wood, true Platinum grey; the meaning colours and
  // the screen's light are the only colour on the desk.
  graphite: { name: 'B · Graphite (chosen)', amb: [0.145, 0.145, 0.155], knight: 's5', hexes: deskHexes({
    s1: '#17191e', s2: '#24272e', s3: '#363b44', s4: '#525a65', s5: '#828b96',
    g1: '#171b19', g2: '#232b27', g3: '#33473b', g4: '#4c6553', g6: '#b3bdb2',
    d1: '#1b191c', d2: '#2b282c', d3: '#423d43', d4: '#625b62', d5: '#8e858d',
    u1: '#1b1917', u2: '#2b2723', u3: '#433d37', u4: '#625a51', u5: '#8d8479', u6: '#c9c3b8',
    wine: '#5e333a', copper: '#a9744b', pale: '#eee5c6' }) },
  // C: a gamer's room at 2 a.m. Split tone: violet shadows, teal mids, peach highlights; a magenta LED strip
  // behind the monitor washes the wall.
  neon: { name: 'C · Neon', amb: [0.12, 0.07, 0.16], knight: 'moon', led: [1.5, 0.45, 1.15], hexes: deskHexes({
    s1: '#160f26', s2: '#22183e', s3: '#31245c', s4: '#46377d', s5: '#6c5ca6',
    g1: '#0a1c21', g2: '#0c3337', g3: '#0f5049', g4: '#1d7a66', g6: '#92e0bf',
    d1: '#200d28', d2: '#3b123f', d3: '#631c5c', d4: '#962c78', d5: '#d0509a',
    u1: '#22121e', u2: '#3a1c29', u3: '#5d2f36', u4: '#8a4a45', u5: '#c0775e', u6: '#efb38a',
    wine: '#671d3c', copper: '#e57338', pale: '#ffdda6' }) },
};
let DESK_VARIANT = 'graphite';
function deskSet(v) { const d = DESK_VARIANTS[v]; return d.set || (d.set = d.hexes ? makePalSet(d.hexes, DESK_RAMPS, 33) : makePalSet([...PAL_BASE.PAL.slice(0, 32), STEEL, EMBER, ...WIN98], RAMP_IDX, 33)); }

// small glyphs Tiny5 does not have
const GL = {
  star: ['..x..', '.xxx.', 'xxxxx', '.x.x.'],
  check: ['....x', '...x.', 'x.x..', '.x...'],
  cross: ['x..x', '.xx.', '.xx.', 'x..x'],
  bang: ['x', 'x', '.', 'x'],
  power: ['..x..', 'x.x.x', 'x...x', 'x...x', '.xxx.'],
  phone: ['xx...', 'x....', 'x....', '.x..x', '..xxx'],
  bolt: ['..x', '.x.', 'xxx', '.x.', 'x..'],
  lstroke: ['.x..', '.x.x', '.xx.', 'xx..', '.x..', '.x..'],
  sigma: ['xxxx', 'x...', '.x..', 'x...', 'xxxx'],
  batt: ['xxxxx.', 'xxxxxx', 'xxxxx.'],
  wifi: ['.xxx.', 'x...x', '.xxx.', '..x..'],
};
const glyph = (g, x, y, idx) => GL[g].forEach((r, j) => [...r].forEach((c, i) => { if (c === 'x') putI(x + i, y + j, idx); }));
// handwriting: Tiny5 sheared into a slant, each word on its own slightly wandering baseline, plus a tilt
function scrawl(str, x, y, idx, o = {}) {
  const tilt = o.tilt ?? 20, sd = o.sd ?? 1; let cx = x;
  for (const [k, word] of str.split(' ').entries()) {
    if (word) {
      const g = glyphs(word, 'tiny'), dy = (hash(k, y, sd) < 0.3 ? 1 : 0) - Math.floor((cx - (o.x0 ?? x)) / tilt);
      for (let n = 0; n < g.pts.length; n += 2) { const px = g.pts[n], py = g.pts[n + 1]; putI(cx + px + Math.floor((6 - py) / 4), y + py + dy, idx); }
      cx += g.w;
    }
    cx += 3;
  }
  return cx - x - 3;
}

// ---------------------------------------------------------------- the static layer: room, bezel, desk, mat, keyboard
let DESK_LAYER = null;
const KEYROWS = [
  [['Esc', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['⌫', 2]],
  [['Tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
  [['Caps', 1.75], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ['\'', 1], ['Enter', 2.25]],
  [['Shift', 2.25], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['Shift', 2.75]],
  [['Ctrl', 1.25], ['Opt', 1.25], ['Cmd', 1.25], ['', 6.25], ['Cmd', 1.25], ['Opt', 1.25], ['Fn', 1.25], ['Ctrl', 1.25]],
];
// hotkeys light up in the colour of what they drive: knight steel, Garrote ember, mage arcane, priest gold;
// Tab (Excel) green; H (headset, Zone) cyan; G (Goblin Fuel) moss
const KEYLIT = { '1': 'steel', '2': 'steel', '3': 'steel', Z: 'ember', X: 'ember', C: 'ember', Q: 'arcane', W: 'arcane', E: 'arcane', A: 'gold', S: 'gold', D: 'gold', Tab: 'g5', H: 's6', G: 'g5' };
const KEYGLOW = { steel: [0.6, 0.95, 1.3], ember: [1.4, 0.72, 0.42], arcane: [0.95, 0.65, 1.5], gold: [1.3, 0.9, 0.5], g5: [0.7, 1.2, 0.8], s6: [0.6, 1.05, 1.3] };
// ---------------------------------------------------------------- the camera
// First person, looking straight at the monitor; eye level at the monitor's top edge, so the desk's depth lines run
// to a vanishing point at (246, 3). World units: the eye's height above the desk = 1. A point (X across, Z ahead,
// Y up from the desk) lands at x = 246 + f X / Z, y = 3 + f (1 - Y) / Z. The monitor's foot is at Z = f / 260.
const CAM = { cx: 246, cy: 3, f: 479 };
const proj = (X, Z, Y = 0) => [CAM.cx + (CAM.f * X) / Z, CAM.cy + (CAM.f * (1 - Y)) / Z];
const unproj = (x, y, Y = 0) => { const Z = (CAM.f * (1 - Y)) / (y - CAM.cy); return [((x - CAM.cx) * Z) / CAM.f, Z]; };
// convex polygon fill (screen space), fn(x, y) per pixel
function fillPoly(pts, fn) {
  let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.max(0, Math.ceil(y0 - 0.5)); y <= Math.min(RS_H - 1, Math.floor(y1 - 0.5)); y++) {
    const yc = y + 0.5; let a = Infinity, b = -Infinity;
    for (let k = 0; k < pts.length; k++) { const [x1, y1_] = pts[k], [x2, y2] = pts[(k + 1) % pts.length]; if ((y1_ <= yc && y2 > yc) || (y2 <= yc && y1_ > yc)) { const x = x1 + ((yc - y1_) * (x2 - x1)) / (y2 - y1_); a = Math.min(a, x); b = Math.max(b, x); } }
    if (a > b) continue;
    for (let x = Math.max(0, Math.ceil(a - 0.5)); x <= Math.min(RS_W - 1, Math.floor(b - 0.5)); x++) fn(x, y);
  }
}
const putW = (x, y, v, m, e = 0) => { put(x, y, v, m, e); B.I[y * W + x] = -1; };   // world pixel over anything

// the keyboard (75 % layout, dark aluminium) and the mat, in world units
const KB = { x0: -0.42, x1: 0.56, zf: 1.57, zn: 1.18, plate: 0.02, cap: 0.032, rim: 0.022, rise: 0.09, sculpt: 0.016 };
const plateY = (Z) => KB.plate + (Z - KB.zn) * KB.rise;   // the typing angle: the back of the keyboard sits higher
KB.u = (KB.x1 - KB.x0 - 2 * KB.rim) / 15;
const MATW = { x0: -0.47, x1: 1.6, zf: 1.71, zn: 1.2 };
const PHONE = { cx: -0.625, cz: 1.47, w: 0.215, l: 0.46, yaw: 0, t: 0.024 };  // square to the desk: its long edges run to the same point as the keyboard's sides
const KEYS = []; // { lab, r, cx, cy, lit }

function deskWood(x, y) {
  const [X, Z] = unproj(x, y);
  let w = 0.36 + 0.1 * (vnoise(X * 2.2, Z * 26, 301) - 0.5) + 0.05 * (vnoise(X * 0.7, Z * 60, 302) - 0.5);
  const streak = vnoise(X * 1.2, Z * 80, 303); if (streak > 0.74) w -= 0.07; else if (streak < 0.2) w += 0.05;
  return w;
}
function buildDeskLayer() {
  const L = mkBuf(RS_W, RS_H, true); clearFrame(L); bind(L); CLIP = null; MAT = M_STONE; EMI = 0; TAG = 0; DXV = 0;
  // the room behind and around the monitor: a dark wall
  for (let y = 0; y < 263; y++) for (let x = 0; x < RS_W; x++) put(x, y, 0.12 + 0.03 * (vnoise(x * 0.1, y * 0.1, 7) - 0.5), M_DUSK, 0);
  // the desk top, the monitor's foot, the mat: one pass over the desk plane
  for (let y = 263; y < RS_H; y++) for (let x = 0; x < RS_W; x++) {
    const [X, Z] = unproj(x, y);
    if (y === 263) { put(x, y, 0.2, M_UMBER, 0); continue; }
    if (Math.abs(X) < 0.19 && Z > 1.755) { const e = Z > 1.83 || Math.abs(X) > 0.18; put(x, y, e ? 0.62 : 0.4 - 0.25 * (X + 0.19) - (Z < 1.765 ? 0.18 : 0), M_STONE, 0); continue; }
    if (X > MATW.x0 && X < MATW.x1 && Z < MATW.zf && Z > MATW.zn) {
      const ex = Math.min(X - MATW.x0, MATW.zf - Z), st = ex > 0.011 && ex < 0.017 && Math.floor((X - MATW.x0 < MATW.zf - Z ? Z : X) * 90) % 2 === 0;
      put(x, y, ex < 0.006 ? 0.22 : st ? 0.3 : 0.11 + 0.02 * (vnoise(X * 20, Z * 30, 9) - 0.5), st ? M_UMBER : M_STONE, 0); continue;
    }
    put(x, y, deskWood(x, y), M_UMBER, 0);
  }
  // keyboard case: the plate (top), its far lip catching the monitor's light, the visible inner side
  const P0 = proj(KB.x0, KB.zf, plateY(KB.zf)), P1 = proj(KB.x1, KB.zf, plateY(KB.zf)), P2 = proj(KB.x1, KB.zn, plateY(KB.zn)), P3 = proj(KB.x0, KB.zn, plateY(KB.zn));
  fillPoly([proj(KB.x0, KB.zf, 0), P0, P3, proj(KB.x0, KB.zn, 0)], (x, y) => putW(x, y, 0.3, M_STONE));           // left side wall (faces you and the centre)
  const KID = new Int16Array(RS_W * RS_H), PLATE = new Uint8Array(RS_W * RS_H);
  fillPoly([P0, P1, P2, P3], (x, y) => { const [, Z] = unproj(x, y, plateY(KB.zf - 0.02)); const lip = KB.zf - Z; putW(x, y, lip < 0.005 ? 0.66 : lip < 0.011 ? 0.46 : 0.1, M_STONE); if (lip >= 0.011) PLATE[y * W + x] = 1; });
  // keys: far rows first; each keycap is a block: a lit top face, a dark front skirt, the side that faces the centre
  KEYS.length = 0;
  KEYROWS.forEach((row, r) => {
    const zf = KB.zf - KB.rim - r * KB.u, zn = zf - KB.u, g = 0.0015, ins = 0.0055;
    let a = KB.x0 + KB.rim;
    for (const [lab, wu] of row) {
      const b = a + wu * KB.u, lit = KEYLIT[lab], ka = a + g, kb = b - g, kzf = zf - g, kzn = zn + g, yb = plateY((zf + zn) / 2), yt = yb + KB.cap, ytf = yt + KB.sculpt;
      const id = KEYS.length + 1, own = (x, y) => { KID[y * W + x] = id; PLATE[y * W + x] = 0; };
      // the cap's top is sculpted: its far edge stands higher, so the face tilts toward you
      const T = [proj(ka + ins, kzf - ins * 0.5, ytf), proj(kb - ins, kzf - ins * 0.5, ytf), proj(kb - ins, kzn + ins * 0.8, yt), proj(ka + ins, kzn + ins * 0.8, yt)];
      const Bs = [proj(ka, kzf, yb), proj(kb, kzf, yb), proj(kb, kzn, yb), proj(ka, kzn, yb)];
      const mid = (ka + kb) / 2;
      if (mid < 0) fillPoly([T[1], Bs[1], Bs[2], T[2]], (x, y) => { putW(x, y, 0.32, M_STONE); own(x, y); });     // right side, facing the centre
      else fillPoly([Bs[0], T[0], T[3], Bs[3]], (x, y) => { putW(x, y, 0.32, M_STONE); own(x, y); });           // left side
      fillPoly([T[3], T[2], Bs[2], Bs[3]], (x, y) => { const q = (y - T[3][1]) / Math.max(1, Bs[3][1] - T[3][1]); putW(x, y, 0.26 - 0.12 * q, M_STONE); own(x, y); });   // front skirt
      fillPoly(T, (x, y) => { const q = (y - T[0][1]) / Math.max(1, T[3][1] - T[0][1]), [X] = unproj(x, y, yt + KB.sculpt * (1 - q)), sx = (X - ka - ins) / (kb - ka - 2 * ins);
        putW(x, y, (q < 0.14 ? 0.74 : 0.54 - 0.08 * q) + (sx < 0.1 ? 0.07 : sx > 0.9 ? -0.08 : 0), M_STONE); own(x, y); });
      const cx = (T[0][0] + T[1][0] + T[2][0] + T[3][0]) / 4, cy = (T[0][1] + T[3][1]) / 2;
      KEYS.push({ lab, r, cx: Math.round(cx), cy: Math.round(cy), lit, base: proj(mid, kzn - 0.004, yb), sx0: Math.ceil(T[3][0]), sx1: Math.floor(T[2][0]) - 1, T3: T[3], T2: T[2], T0: T[0] });
      a = b;
    }
  });
  // underglow: light leaking from under a lit cap, as a line along the lowest visible edge of its skirt
  KEYS.forEach((K, n) => {
    if (!K.lit) return;
    // a line of light along the lowest row of the cap's top face that stays visible across the whole cap (the row in
    // front hides the face's last rows)
    const yTop = Math.round(K.T0[1]), yEnd = Math.round(K.T3[1]); let yl = yEnd;
    for (let x = K.sx0 + 1; x <= K.sx1 - 1; x++) { let yb = -1; for (let y = yTop; y <= yEnd; y++) if (KID[y * W + x] === n + 1) yb = y; if (yb >= 0) yl = Math.min(yl, yb); }
    if (yl >= 0 && yl < RS_H) for (let x = K.sx0; x <= K.sx1; x++) if (KID[yl * W + x] === n + 1) B.I[yl * W + x] = P[K.lit];
  });
  DXV = 0;
  return (DESK_LAYER = L);
}

// ---------------------------------------------------------------- desk states (moments)
// hit regions for the live desk (V3, #68): filled while drawDeskLive draws, in right-screen grid px
let DESK_HITS = null;
const dhit = (x, y, w, h, act, arg = '', tip = '') => { if (DESK_HITS) DESK_HITS.push({ x, y, w, h, act, arg: String(arg), tip }); };
const FEED_TAG = { YOU: 'u6', HER: 'd6', PHONE: 'moon', GAME: 'gold', LOOT: 's6', EXCEL: 'g6', DOG: 'copper', NIGHT: 's5', PARTY: 'u5', GUILD: 'u5', MAGOO: 'arcane', HEALERO: 'g5' };
const DESK_MOMENTS = {
  calm: { clock: '20:40', zl: 50, tired: 10, zone: 0, cans: 3, note: ['y', 'y', 'y'], feed: [
    ['20:40', 'GAME', 'Floor 2 cleared. +8 gold.'], ['20:39', 'LOOT', 'Grave Ring', 's6'], ['20:36', 'MAGOO', 'pick the next floor. hover a node to see what is there'],
    ['20:31', 'HER', 'I\'m watching my show, babe. Don\'t play all night, okay?'], ['20:25', 'PHONE', 'Missed delivery. The parcel goes back to the depot.'], ['20:20', 'HEALERO', 'her thing just ended, she\'s getting up'] ] },
  ring: { clock: '20:52', zl: 50, tired: 14, zone: 0, cans: 3, phone: 'call', note: ['y', 'y', 'y'], feed: [
    ['20:52', 'PHONE', 'Mom is calling.'], ['20:50', 'LOOT', 'Fine Signet', 'g6'], ['20:47', 'GAME', 'Floor 3. The crypt goes deeper.'],
    ['20:44', 'HER', 'Warning: Flow reset.'], ['20:41', 'MAGOO', 'answer your mum man, she calls twice'], ['20:40', 'GAME', 'Floor 2 cleared. +8 gold.'] ] },
  tired: { clock: '22:18', zl: 74, tired: 36, zone: 0, cans: 2, note: ['y', 'y', '!'], feed: [
    ['22:18', 'YOU', 'Yawn. Your eyes sting.'], ['22:16', 'NIGHT', 'Tired 30. Yawning starts. A can would help.'], ['22:12', 'LOOT', 'Ember Blade', 'copper'],
    ['22:10', 'HEALERO', 'u ok? u missed two heals'], ['22:02', 'HER', 'Coming to bed soon?'], ['21:58', 'GAME', 'Floor 4 cleared. +14 gold.'] ] },
  headset: { clock: '21:26', zl: 50, tired: 18, zone: 19, cans: 3, headset: true, note: ['y', 'y', 'y'], feed: [
    ['21:26', 'YOU', 'Headset on. You hear nothing.'], ['21:25', 'GAME', 'Flow x2.2'], ['21:24', 'LOOT', 'Bone Charm', 's6'],
    ['21:21', 'MAGOO', 'zone mode. dont talk to him'], ['21:18', 'HER', 'In the shower, back in 20.'], ['21:15', 'DOG', 'The dog sighs at the door.'] ] },
  dog: { clock: '21:05', zl: 50, tired: 12, zone: 0, cans: 3, dog: true, note: ['y', 'y', 'y'], feed: [
    ['21:05', 'DOG', 'The dog jumps up at the desk. Pet him!'], ['21:04', 'MAGOO', 'the dog wants pets. ignore him and he goes for the cable'], ['21:02', 'GAME', 'The party walks past.'],
    ['20:58', 'LOOT', 'Bone Charm', 's6'], ['20:55', 'HER', 'I\'m watching my show, babe.'], ['20:50', 'GAME', 'Floor 2 cleared. +8 gold.'] ] },
  witching: { clock: '01:12', zl: 132, tired: 52, zone: 6, cans: 0, witching: true, note: ['y', 'x', 'y'], feed: [
    ['01:12', 'LOOT', 'Grave Crown', 'copper'], ['01:00', 'NIGHT', 'Witching hour. Drops can shift up a rarity.'], ['00:52', 'HER', 'zzz'],
    ['00:47', 'EXCEL', 'Saved. Nobody saw.'], ['00:31', 'GUILD', 'raid tomorrow? same time?'], ['00:20', 'GAME', 'Floor 6 cleared. +31 gold.'] ] },
};

// ---------------------------------------------------------------- per-frame pieces
function taskbar(st, t, screen) {
  const [x0, y0, w] = RSZ.task, x1 = x0 + w - 1;
  rectI(x0, y0, w, 1, P.u2); rectI(x0, y0 + 1, w, 1, P.moon); rectI(x0, y0 + 2, w, 12, P.u6); rectI(x0, y0 + 14, w, 1, P.u4);
  // desktop glyph
  rectI(x0 + 4, y0 + 4, 9, 8, P.u3); rectI(x0 + 5, y0 + 5, 3, 2, P.s4); rectI(x0 + 9, y0 + 5, 3, 2, P.s4); rectI(x0 + 5, y0 + 8, 3, 2, P.s4); rectI(x0 + 9, y0 + 8, 3, 2, P.s4);
  rectI(x0 + 16, y0 + 3, 1, 10, P.u4); rectI(x0 + 17, y0 + 3, 1, 10, P.moon);
  // application switcher tabs (Mac OS 8.5): the front app's tab is raised and pale
  const tab = (x, label, ic, front, flash) => {
    const tw = measure(label, 'tiny') + 20, face = flash ? P.copper : front ? P.moon : P.u6;
    rectI(x + 1, y0 + 2, tw - 2, 12, face); rectI(x, y0 + 3, 1, 11, P.u3); rectI(x + tw - 1, y0 + 3, 1, 11, P.u3); rectI(x + 1, y0 + 2, tw - 2, 1, P.u3);
    if (front) { rectI(x + 1, y0 + 3, tw - 2, 1, P.moon); rectI(x + 1, y0 + 13, tw - 2, 1, P.moon); rectI(x + tw - 2, y0 + 3, 1, 10, P.u5); }
    else rectI(x + 1, y0 + 13, tw - 2, 1, P.u4);
    ic(x + 4, y0 + 4);
    text(label, x + 15, y0 + 5, 'tiny', flash ? P.moon : front ? P.u1 : P.u3);
    return tw;
  };
  const lnIcon = (x, y) => { rectI(x, y, 8, 8, P.arcane); rectI(x, y + 7, 8, 1, P.d2); lineI(x + 1, y + 1, x + 6, y + 6, P.moon); lineI(x + 6, y + 1, x + 1, y + 6, P.moon); putI(x + 1, y + 6, P.gold); putI(x + 6, y + 6, P.gold); };
  const xlIcon = (x, y) => { rectI(x, y, 8, 8, P.g3); rectI(x + 1, y + 2, 6, 5, P.moon); rectI(x + 3, y + 2, 1, 5, P.g4); rectI(x + 1, y + 4, 6, 1, P.g4); rectI(x, y, 8, 1, P.g4); };
  const flash = st.flash && Math.floor(t * 2.5) % 2 === 0;
  let x = x0 + 21;
  x += tab(x, 'Loot Night', lnIcon, screen !== 'excel', flash) + 2;
  x += tab(x, 'Excel', xlIcon, screen === 'excel', false) + 6;
  text('Tab = switch', x, y0 + 5, 'tiny', P.u4);
  // right: Sleep (power), clock, wallet
  const sl = 'Sleep (23:00+)', sw = measure(sl, 'tiny') + 17, sx = x1 - sw - 2, on = st.clock < '20' && st.clock >= '00' ? true : st.clock >= '23';
  rectI(sx, y0 + 2, sw, 12, P.u3); rectI(sx + 1, y0 + 3, sw - 2, 10, on ? P.moon : P.u6); rectI(sx + 1, y0 + 3, sw - 2, 1, P.moon); rectI(sx + 1, y0 + 12, sw - 2, 1, P.u5); rectI(sx + sw - 2, y0 + 3, 1, 10, P.u5);
  glyph('power', sx + 4, y0 + 5, on ? P.u1 : P.u4); text(on ? 'Sleep' : sl, sx + 12, y0 + 5, 'tiny', on ? P.u1 : P.u4);
  let cx = sx - 6;
  if (st.witching) { const ww = measure('witching hour', 'tiny'); text('witching hour', cx, y0 + 5, 'tiny', P.wine, { align: 'r' }); cx -= ww + 4; }
  const cw = text(st.clock, cx, y0 + 5, 'tiny', st.witching ? P.crimson : P.u1, { align: 'r' }); cx -= cw + 7;
  // wallet in zl (the l with its stroke drawn by hand)
  glyph('lstroke', cx - 3, y0 + 4, P.g3); const zs = st.zl + ' z', zw = measure(zs, 'tiny') + 4; text(zs, cx - 3, y0 + 5, 'tiny', P.g3, { align: 'r' });
  rectI(cx - zw - 5, y0 + 3, 1, 10, P.u4); rectI(cx - zw - 4, y0 + 3, 1, 10, P.moon);
}
// the Tonight note, stuck on the bezel's bottom edge, tilted a little, slanted ballpoint
function tonightNote(st) {
  const [x0, y0, w, h] = RSZ.note, tiltAt = (x) => Math.floor((x - x0) / 25);
  shadowU(x0, y0 + 1, w, h, { k: 0.6, r: 3, dx: 1, dy: 2 });
  // flat paper, stepped for the tilt, a lifted lower-right corner
  for (let x = x0; x < x0 + w; x++) {
    const top = y0 - tiltAt(x), bot = y0 + h - 1 - tiltAt(x);
    for (let y = top; y <= bot; y++) {
      const cx = x - (x0 + w - 8), cy = y - (bot - 8); if (cx > 0 && cy > 0 && cx + cy > 8) continue;
      const fold = cx > 0 && cy > 0 && cx + cy >= 7;
      putI(x, y, fold ? P.copper : y === bot || x === x0 + w - 1 ? P.gold : y > bot - 4 ? (x + y) % 2 ? P.pale : P.gold : P.pale);
    }
  }
  for (let k = 1; k <= 7; k++) for (let j = 0; j < k; j++) { const x = x0 + w - 8 + j + 1, y = y0 + h - 1 - tiltAt(x) - k + (k - j) - 1; putI(x, y, j === k - 1 ? P.copper : P.gold); }
  // a strip of tape over the bezel edge
  for (let x = x0 + 24; x < x0 + 48; x++) for (let y = y0 - 4; y <= y0 + 1; y++) putI(x, y - tiltAt(x), y === y0 - 4 || y === y0 + 1 ? P.u5 : (x + y) % 7 === 0 ? P.moon : P.u6);
  const ink = P.s2, ok = { y: ['check', P.g3], '!': ['bang', P.copper], x: ['cross', P.crimson] };
  const line = (k) => y0 + 4 + k * 8;
  let x = x0 + 3;
  x += scrawl('Tonight', x, line(0), ink, { x0, sd: 3, tilt: 25 }) + 5; glyph('power', x, line(0) - tiltAt(x), ink); scrawl((st.sleepOk ?? st.witching) ? 'any time' : '23:00+', x + 7, line(0), ink, { x0, sd: 4, tilt: 25 });
  dhit(x0, y0 - 2, w, h + 2, '', '', 'tonight');
  // tonight's three stars as three handwritten lines (Deep, Unseen, Sweet), each ticked, warned or crossed out
  for (let k = 0; k < 3; k++) {
    let xx = x0 + 3; const y = line(k + 1) + 1;
    xx += scrawl(['floor ' + (st.floorGoal || 8), 'don\'t get caught', 'keep her happy'][k], xx, y, ink, { x0, sd: 5 + k, tilt: 25 }) + 3;
    const [g, c] = ok[st.note[k]]; glyph(g, xx, y + 1 - tiltAt(xx), c);
  }
}
// flat glass cards (iOS widgets): a solid fill, a lit top edge, rounded corners, a soft shadow on the desk
function glassCard(x, y, w, h) {
  shadowU(x, y, w, h, { k: 0.7, r: 5, dx: 2, dy: 4 });
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cr = (i === 0 || i === w - 1) && (j === 0 || j === h - 1); if (cr) continue;
    const c2 = (i === 0 || i === w - 1) && (j === 1 || j === h - 2) || (j === 0 || j === h - 1) && (i === 1 || i === w - 2);
    putI(x + i, y + j, j === 0 ? P.s3 : c2 || i === 0 || i === w - 1 || j === h - 1 ? P.s2 : P.s1);
  }
}
// the Goblin Fuel can's 6 x 13 button icon (the can canvas, B "Chest Burst"), in its print colours; dark with no cans
const CAN_ICON = { rows: ['.abba.', 'cddcee', 'fghgij', 'klmmln', 'folloi', 'fphppi', 'oqhhhq', 'rqshrt', 'cddcee', 'cooooe', 'cqqqqe', 'cddcee', '.uaau.'],
  pal: { a: '#525a65', b: '#c9c3b8', c: '#452750', d: '#6b3b62', e: '#241939', f: '#7cc21f', g: '#b8e637', h: '#f1a934', i: '#3b8424', j: '#1d4f26', k: '#3f7960', l: '#749970', m: '#aebb89', n: '#135a54', o: '#fae299', p: '#f2efdc', q: '#c16229', r: '#8a614d', s: '#6a4240', t: '#452c3d', u: '#363b44' } };
let YOU_CAN = null;
function canIconOverlay(ctx) {
  if (!YOU_CAN) return;
  const [x, y, cans] = YOU_CAN;
  CAN_ICON.rows.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch === '.') return;
    let h = CAN_ICON.pal[ch];
    if (!cans) { const v = (parseInt(h.slice(1, 3), 16) * 0.3 + parseInt(h.slice(3, 5), 16) * 0.59 + parseInt(h.slice(5, 7), 16) * 0.11); h = v > 150 ? '#525a65' : v > 80 ? '#363b44' : '#24272e'; }   // no cans: greyed
    ctx.fillStyle = h; ctx.fillRect(x + i, y + j, 1, 1);
  }));
  if (!cans) { ctx.fillStyle = '#d23c5a'; for (let k = 0; k <= 13; k++) ctx.fillRect(Math.round(x - 1 + k * 8 / 13), y + 13 - k, 1, 1); }   // struck out
}
function youCard(st, t) {
  const [x, y, w, h] = RSZ.you;
  glassCard(x, y, w, h);
  const bar = (yy, label, v, max, fill, mark) => {
    text(label, x + 5, yy, 'tiny', P.u5);
    const bx = x + 28, bw = 46; rectI(bx, yy + 1, bw, 3, P.void); rectI(bx, yy + 1, Math.round((bw * v) / max), 3, fill);
    if (v > 0) putI(bx, yy + 1, P.moon);
    if (mark) rectI(bx + Math.round((bw * mark) / max), yy - 1, 1, 7, v >= mark ? P.gold : P.u5);
    text(String(v), x + 86, yy, 'tiny', P.moon, { align: 'r' });
  };
  const yawn = st.yawn ?? 30;   // where yawning starts (the game passes TIRED_YAWN)
  bar(y + 5, 'TIRED', st.tired, 100, P.arcane, yawn);
  bar(y + 15, 'ZONE', st.zone, 30, P.s6, 0);
  dhit(x, y, 88, 13, '', '', 'tired'); dhit(x, y + 13, 88, 13, '', '', 'zone');
  // the Monster button: glows gold (the next action) from the yawn mark while a can is left
  const bx = x + 90, by = y + 3, bw = 40, bh = 20, glow = (st.tired >= yawn && st.cans > 0) || st.hideCans, pulse = 0.5 + 0.5 * Math.sin(t * (st.hideCans ? 8 : 4));
  if (glow) for (let j = -2; j < bh + 2; j++) for (let i = -2; i < bw + 2; i++) { const e = i < 0 || j < 0 || i >= bw || j >= bh; if (e && (i + j) % 2 === (pulse > 0.5 ? 0 : 1)) putI(bx + i, by + j, P.copper); }
  rectI(bx, by, bw, bh, glow ? P.gold : st.cans ? P.s3 : P.s2); rectI(bx + 1, by + 1, bw - 2, bh - 2, glow ? P.d2 : P.s2); rectI(bx + 1, by + 1, bw - 2, 1, glow ? P.copper : P.s3);
  // the Goblin Fuel can (its 6 x 13 icon, in its own print colours) goes on after compose: canIconOverlay
  const cx = bx + 3, cy = by + 4; YOU_CAN = [cx, cy - 1, st.cans];
  text(st.hideCans ? 'Hide' : st.cansHidden ? 'Hidden' : 'x' + st.cans, bx + 12, by + 4, 'tiny', st.hideCans ? P.void : st.cans && !st.cansHidden ? P.moon : P.u4);
  if (st.drinkAct) dhit(bx, by, bw, bh, st.drinkAct, '', 'drink'); else dhit(bx, by, bw, bh, '', '', 'drink');
  // a little keycap with G on it
  const kx = bx + bw - 10; rectI(kx, by + 3, 8, 8, P.s3); rectI(kx + 1, by + 3, 6, 6, P.s4); text('G', kx + 4, by + 4, 'tiny', P.moon, { align: 'c' });
  text(st.hideCans ? 'cans' : 'Drink', bx + 12, by + 12, 'tiny', st.hideCans ? P.void : glow ? P.pale : P.u5);
}
function feedCard(st) {
  const [x, y, w, h] = RSZ.feed;
  glassCard(x, y, w, h);
  const fade = [P.moon, P.u6, P.u5, P.u4, P.u3, P.u3];
  let yy = y + 4; const tx = x + 25, maxW = x + w - 4 - tx;
  for (const [k, [tm, tag, msg, rar]] of st.feed.entries()) {
    if (yy > y + h - 9) break;
    text(tm, x + 4, yy, 'tiny', k ? P.u3 : P.u4);
    const tc = P[rar || FEED_TAG[tag] || 'u6'], tw = text(tag, tx, yy, 'tiny', k > 2 ? P.u4 : tc) + 4;
    // wrap to two lines at most, the second indented to the text column
    const words = msg.split(' '); let line = '', lx = tx + tw, row = 0;
    for (const wd of words) {
      const tryS = line ? line + ' ' + wd : wd;
      if (measure(tryS, 'tiny') > maxW - (lx - tx) && line) {
        if (row === 1) { line += '...'; break; }
        text(line, lx, yy, 'tiny', fade[k]); yy += 7; row++; lx = tx; line = wd;
      } else line = tryS;
    }
    text(line, lx, yy, 'tiny', fade[k]);
    yy += 8;
  }
}
// the phone, lying flat on the desk, a little turned: graphite rails, Dynamic Island; dark glass that reflects the
// monitor, or the incoming call. Everything is placed through the camera; glyphs stay unscaled (pixel-exact) and sit
// at their projected spots, so the screen keeps its perspective and stays readable.
function phoneLocal(u, v, Y = PHONE.t) { // u across (-1..1), v along (0 top .. 1 bottom) -> screen
  const ca = Math.cos(PHONE.yaw), sa = Math.sin(PHONE.yaw), lx = (u * PHONE.w) / 2, lz = (0.5 - v) * PHONE.l;
  return proj(PHONE.cx + lx * ca + lz * sa, PHONE.cz - lx * sa + lz * ca, Y);
}
function phoneUV(x, y, Y = PHONE.t) { // screen -> phone local (u, v) on the plane at height Y
  const [X, Z] = unproj(x, y, Y), dx = X - PHONE.cx, dz = Z - PHONE.cz, ca = Math.cos(PHONE.yaw), sa = Math.sin(PHONE.yaw);
  const lx = dx * ca - dz * sa, lz = dx * sa + dz * ca;
  return [(lx * 2) / PHONE.w, 0.5 - lz / PHONE.l];
}
// the body as a rounded rectangle in metres (local x across, z along from the far end): its corners are the in-hand
// phone's (r 17 on 124 px across = 0.137 of the width), so it reads as the same phone lying down
const PH_R = 0.137 * PHONE.w;
function phoneSDF(u, v) {   // signed distance to the body's outline in metres, negative inside
  const qx = Math.abs(u * PHONE.w / 2) - (PHONE.w / 2 - PH_R), qz = Math.abs((v - 0.5) * PHONE.l) - (PHONE.l / 2 - PH_R);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - PH_R;
}
function phone(st, t, lights) {
  // what the phone shows (phone.js holds the OS; this is the same OS seen lying on the desk)
  //   off: dark glass with the monitor in it · call: someone is calling (st.caller) · lock: notification banners (st.banners)
  //   down: face down, the back up · downGlow: face down, a message lights the desk round it · hand: it is in your hand
  const S = st.phone || 'off';
  if (S === 'hand') return;   // in your hand (phone.js draws it over the frame): the spot on the desk is empty
  const down = S === 'down' || S === 'downGlow', ring = S === 'call', lit = ring || S === 'lock' || S === 'lowbat' || S === 'dead';
  const jx = ring && Math.floor(t * 18) % 4 < 2 && t % 1.2 < 0.7 ? 1 : 0;
  const corners = [phoneLocal(-1, 0), phoneLocal(1, 0), phoneLocal(1, 1), phoneLocal(-1, 1), phoneLocal(1, 0, 0), phoneLocal(1, 1, 0)];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9; for (const [x, y] of corners) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); }
  // the lit screen is a texture laid on the glass through the camera (phone.js deskScreen): text, avatar and buttons
  // all in perspective; the wallpaper is material, dithered here in screen space
  const TX = lit ? PHONEOS.deskScreen(st, t) : null, DT = PHONEOS.DT;
  const C = ring ? PHONEOS.CALLERS[st.caller || 'mom'] : null;
  // face down it is silent (#47): only its light shows, a soft cool glow on the desk round it; it pulses during a
  // call and flares on each new message (st.glowKind 'call' | 'msg'; here a message every 3 s)
  const glow = S !== 'downGlow' ? 0 : st.glowKind === 'call' ? 0.55 + 0.45 * Math.sin(t * 4.5) : Math.exp(-((t % 3) / 0.9)) * 0.95 + 0.05;
  for (let y = Math.max(263, Math.floor(y0) - 8); y < RS_H; y++) for (let x = Math.max(0, Math.floor(x0) - 10); x <= Math.min(RS_W - 1, Math.ceil(x1) + 10); x++) {
    const xs = x - jx;
    // top face (glass + frame, or the back when it lies face down)
    const [u, v] = phoneUV(xs, y), sd = phoneSDF(u, v);
    if (sd <= 0) {
      const dep = -sd, ed = dep < 0.0045, rail = dep < 0.0105;
      let val, m = M_STONE, e = 0;
      if (ed) val = u < 0 ? 0.62 : 0.4;                                            // the polished rim catches the monitor
      else if (down) {                                                               // the back: frosted glass, the camera block top left
        val = 0.16 + 0.03 * (u * 0.5 + v);
        const cu = (u + 0.52) / 0.36, cv = (v - 0.13) / 0.1;
        if (Math.abs(cu) < 1 && Math.abs(cv) < 1 && Math.hypot(Math.max(Math.abs(cu) - 0.6, 0), Math.max(Math.abs(cv) - 0.6, 0)) < 0.4) { val = 0.24; const l1 = Math.hypot(cu + 0.4, cv + 0.45), l2 = Math.hypot(cu - 0.4, cv + 0.45), l3 = Math.hypot(cu + 0.4, cv - 0.5); if (Math.min(l1, l2, l3) < 0.42) val = Math.min(l1, l2, l3) < 0.26 ? 0.02 : 0.4; }
      }
      else if (rail) val = 0.07;
      else if (TX) {
        const k = Math.min(DT.h - 1, Math.max(0, Math.floor(v * DT.h))) * DT.w + Math.min(DT.w - 1, Math.max(0, Math.floor((u + 1) * 0.5 * DT.w)));
        if (TX.I[k] >= 0) { putI(x, y, TX.I[k]); continue; }
        if (TX.A[k]) { putW(x, y, TX.V[k], TX.M[k], 1); continue; }
        val = 0.03; m = M_DUSK; e = 1;
      }
      else { const q = u * 0.5 + v * 1.4; val = q > 0.35 && q < 0.62 ? 0.18 + 0.06 * (q - 0.35) / 0.27 : 0.05; if (q > 0.33 && q < 0.36) val = 0.32; }
      // Dynamic Island (the lit screens carry their own)
      if (!down && !TX && !rail && Math.abs(u) < 0.17 && v > 0.05 && v < 0.08) { putI(x, y, P.void); continue; }
      putW(x, y, val, m, e); continue;
    }
    // the side that faces the centre of the desk: the right rail, standing up from the desk, round the corners too
    let side = false;
    for (const f of [0.25, 0.5, 0.75, 0]) { const [us, vs] = phoneUV(xs, y, PHONE.t * f); if (phoneSDF(us, vs) <= 0 && us > -0.2) { side = true; break; } }
    if (side) { putW(x, y, 0.3, M_STONE); continue; }
    // face down, a message: the screen's light leaks out from under the phone onto the desk
    if (glow > 0) { const dd = sd - (u > 0 ? 0.012 : 0); if (dd > 0 && dd < 0.05) { const f = (1 - dd / 0.05) ** 1.8 * glow; if (f > BAYER8[((y & 7) << 3) | (x & 7)] * 1.15) putI(x, y, f > 0.8 ? P.moon : f > 0.5 ? P.s5 : f > 0.25 ? P.s4 : P.s3); } }
  }
  const at = (u, v) => { const [x, y] = phoneLocal(u, v); return [Math.round(x) + jx, Math.round(y)]; };
  dhit(Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0) + 1, RS_H - Math.floor(y0), 'phone', '', 'phone');
  if (ring) {   // the red Decline under the slide pill (phone.js deskScreen draws it at 32, 73 on its 64 x 100 texture)
    const [dx, dy] = phoneLocal((32 / DT.w) * 2 - 1, 73 / DT.h);
    dhit(Math.round(dx) - 7, Math.round(dy) - 6, 14, 12, 'decline', '', 'decline');
  }
  if (glow > 0) { const c = at(0.3, 0.45); lights.push({ x: c[0], y: c[1], r: 70, i: 0.9 * glow, c: [0.85, 0.95, 1.2] }); }
  if (ring) {
    // outside the phone, only the gold chip above it: the countdown and the hint in one (gold = the next action)
    const left = st.ringLeft ?? 8 - ((t * 0.96) % 8), lab = 'pick up · ' + Math.ceil(left) + ' s', [cx, cy] = at(0.35, -0.1), lw = measure(lab, 'tiny') + 8;
    rectI(cx - (lw >> 1), cy - 4, lw, 9, P.gold); putI(cx - (lw >> 1), cy - 4, -1); putI(cx - (lw >> 1) + lw - 1, cy - 4, -1); putI(cx - (lw >> 1), cy + 4, -1); putI(cx - (lw >> 1) + lw - 1, cy + 4, -1);
    rectI(cx - (lw >> 1) + 1, cy + 5, lw - 2, 1, P.wine);
    text(lab, cx, cy - 2, 'tiny', P.void, { align: 'c' });
    const c = at(0, 0.45); lights.push({ x: c[0], y: c[1], r: 75, i: 0.55, c: st.caller === 'boys' ? [1.0, 0.85, 1.3] : st.caller === 'courier' ? [0.8, 0.98, 1.25] : [1.15, 0.92, 0.8] });
    if (jx) for (const [u, v] of [[-1.25, 0.3], [-1.3, 0.38], [1.3, 0.3], [1.35, 0.38]]) { const p = at(u, v); putI(p[0], p[1], P.s4); }
  } else if (S === 'lowbat') {
    const c = at(0, 0.4); lights.push({ x: c[0], y: c[1], r: 55, i: 0.35, c: [1.25, 0.75, 0.8] });
  } else if (S === 'lock') {
    const bn = st.banners || [{ who: 'Babe' }], c = at(0, 0.4);
    if (st.hover) {   // idle, pointed at: it wakes, and a gold chip says what a click does (the ringing chip, no seconds)
      const lab = 'pick up', [cx, cy] = at(0.35, -0.1), lw = measure(lab, 'tiny') + 8;
      rectI(cx - (lw >> 1), cy - 4, lw, 9, P.gold); for (const [a, b] of [[0, -4], [lw - 1, -4], [0, 4], [lw - 1, 4]]) putI(cx - (lw >> 1) + a, cy + b, -1);
      rectI(cx - (lw >> 1) + 1, cy + 5, lw - 2, 1, P.wine); text(lab, cx, cy - 2, 'tiny', P.void, { align: 'c' });
      const q = at(0.15, 0.55); smPtr(q[0], q[1]);
    }
    lights.push({ x: c[0], y: c[1], r: 60, i: 0.35, c: bn.some((b) => b.who === 'Babe') ? [1.15, 0.85, 0.9] : [0.9, 0.95, 1.1] });
  }
}
function keyLights(lights, st, lightsOnly, v = DESK_VARIANT) {
  for (const k of KEYS) {
    if (k.cy >= RS_H - 2) continue;
    if (lightsOnly) { if (k.lit) lights.push({ x: k.base[0], y: k.base[1] + 1, r: 13, i: 0.35, c: KEYGLOW[k.lit] }); continue; }
    let idx = k.lit ? P[k.lit] : P.s3;
    if (k.lab === 'R' || k.lab === 'F' || k.lab === '4') idx = P.u2;          // the locked fourth skills
    if (k.lab === 'G' && st.cans === 0) idx = P.u2;                         // Goblin Fuel: dark with no cans
    const { cx, cy } = k;
    if (k.lab === '⌫') { lineI(cx - 2, cy, cx + 2, cy, idx); putI(cx - 3, cy, idx); putI(cx - 2, cy - 1, idx); putI(cx - 2, cy + 1, idx); continue; }
    if (k.lab) text(k.lab, cx, cy - 2, 'tiny', idx, { align: 'c' });
  }
}
// the monitor: thin modern bezel, the webcam module on top, a power light
function bezel(st, t) {
  const [x0, y0, w, h] = RSZ.bezel, x1 = x0 + w - 1, y1 = y0 + h - 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const inScreen = x >= 9 && x <= 482 && y >= 8 && y <= 257; if (inScreen) continue;
    const cr = (x - x0 < 3 || x1 - x < 3) && (y - y0 < 3 || y1 - y < 3) && Math.hypot(Math.max(0, Math.max(x0 + 3 - x, x - (x1 - 3)) - 0.5), Math.max(0, Math.max(y0 + 3 - y, y - (y1 - 3)) - 0.5)) > 3; if (cr) continue;
    const outer = x === x0 || y === y0 || x === x1 || y === y1, inner = x === 8 || x === 483 || y === 7 || y === 258;
    let v = 0.13;
    if (outer) v = x === x0 || y === y0 ? 0.3 : 0.08;
    else if (inner) v = y === 258 || x === 483 ? 0.3 : 0.22;   // the inner lip catches the screen's light
    if (y > 258 && y < y1 && !outer) v = 0.11 + (y === 259 ? 0.06 : 0);
    putU(x, y, v, M_STONE);
  }
  // screen glass margins (black)
  for (let x = 9; x <= 482; x++) { putI(x, 240, P.void); putI(x, 256, P.void); putI(x, 257, P.void); }
  // webcam module on the top edge, lens and a green light: it is on
  for (let x = 233; x <= 259; x++) for (let y = 0; y <= 5; y++) { const end = (x === 233 || x === 259) && (y === 0 || y === 5); if (end) continue; putU(x, y, y === 0 ? 0.3 : y === 5 ? 0.08 : 0.15, M_STONE); }
  discI(246, 3, 2.2, P.s1); putI(246, 3, P.void); putI(245, 2, P.s4); putI(251, 3, P.g6); putI(241, 3, P.s2);
  // power light, bottom right of the chin
  putI(x1 - 8, y1 - 2, st.witching ? P.u4 : P.s5);
}
// Zone aura: with the headset on, a cyan glow around the monitor that grows with Zone
function zoneAura(st, t, lights) {
  if (!st.headset) return;
  const k = Math.min(1, st.zone / 30) * (0.8 + 0.2 * Math.sin(t * 2)), [x0, y0, w, h] = RSZ.bezel, x1 = x0 + w - 1, y1 = y0 + h - 1;
  for (let y = 0; y < y1 + 15; y++) for (let x = 0; x < RS_W; x++) {
    if (y >= y0 && y <= y1 && x >= x0) { if (x > x1) continue; x = x1; continue; }   // skip the monitor itself
    const dx = Math.max(x0 - x, x - x1, 0), dy = Math.max(y0 - y, y - y1, 0), d = Math.hypot(dx, dy);
    if (d === 0) continue;
    const f = d < 14 ? (1 - d / 14) ** 1.6 : 0; if (f <= 0) continue;
    const i = y * W + x; if (B.I[i] >= 0) continue;
    B.X[i] += f * k * 0.7; B.M[i] = mixMat(x, y, B.M[i], M_STONE, f * 2 * k);
  }
  // the bezel's outer rim lights up cyan
  const rim = k > 0.5 ? P.s6 : P.s5;
  for (let x = x0 + 3; x <= x1 - 3; x++) { putI(x, y0, rim); putI(x, y1, rim); }
  for (let y = y0 + 3; y <= y1 - 3; y++) { putI(x0, y, rim); putI(x1, y, rim); }
  for (const lx of [30, 130, 246, 362, 462]) lights.push({ x: lx, y: 266, r: 80, i: 0.5 * k, c: [0.55, 1.05, 1.35], sy: 1.6 });
}
// C: a magenta LED strip behind the monitor washes the wall around it
function ledWash(t) {
  const [x0, y0, w, h] = RSZ.bezel, x1 = x0 + w - 1, y1 = y0 + h - 1;
  for (let y = 0; y < 263; y++) for (let x = 0; x < RS_W; x++) {
    if (y >= y0 && y <= y1 && x >= x0 && x <= x1) { x = x1; continue; }
    const i = y * W + x; if (B.I[i] >= 0 || B.M[i] !== M_DUSK) continue;
    B.V[i] = Math.min(1, B.V[i] + 0.3 + 0.05 * Math.sin(t * 1.5));
  }
}
// ---------------------------------------------------------------- monitor light: sampled from what is on screen
// the falloff of the screen's light is fixed; only its colour changes. So the falloff of each of the eight
// screen lamps is precomputed once for the rows they reach, and each frame only re-tints them into the light map.
let SAMP = null, MON_W = null, MON_LM = null; const MON_K = 8, MON_Y0 = 236;
function monWeights() {
  const N = (RS_H - MON_Y0) * RS_W; MON_W = new Float32Array(MON_K * N);
  for (let k = 0; k < MON_K; k++) { const lx = 9 + (k + 0.5) * (474 / MON_K), ly = 252, r = 190, sy = 1.5;
    for (let y = MON_Y0; y < RS_H; y++) for (let x = 0; x < RS_W; x++) { const d = Math.hypot(x + 0.5 - lx, (y + 0.5 - ly) * sy); if (d < r) MON_W[k * N + (y - MON_Y0) * RS_W + x] = (1 - d / r) ** 2; } }
  MON_LM = new Float32Array(RS_W * RS_H * 3);
}
// the static lights, baked once per desk variant: the pale taskbar's fill along the desk's far edge, the keyboard's
// backlight, and the variant's own (A: a warm light from the room behind you; C: the LED strip behind the monitor)
const MON_BASES = {};
function monBase(v) {
  if (MON_BASES[v]) return MON_BASES[v];
  const D = DESK_VARIANTS[v], MON_BASE = (MON_BASES[v] = new Float32Array(RS_W * RS_H * 3));
  const st = []; st.push({ x: 246, y: 258, r: 260, sy: 3.2, i: 0.22, c: [1.15, 1.0, 0.82] }); keyLights(st, { cans: 1 }, true, v);
  if (D.behind) st.push({ x: 190, y: 452, r: 300, sy: 1.25, i: 0.8, c: D.behind });
  if (D.led) for (const lx of [60, 246, 432]) st.push({ x: lx, y: 262, r: 120, sy: 2.6, i: 0.32, c: D.led });
  for (const l of st) { const c = l.c, cs = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, sy = l.sy || 1;
    for (let y = Math.max(0, Math.floor(l.y - l.r / sy)); y < Math.min(RS_H, l.y + l.r / sy); y++) for (let x = Math.max(0, Math.floor(l.x - l.r)); x < Math.min(RS_W, l.x + l.r); x++) {
      const d = Math.hypot(x + 0.5 - l.x, (y + 0.5 - l.y) * sy); if (d >= l.r) continue; const f = (1 - d / l.r) ** 2 * l.i, j = (y * RS_W + x) * 3;
      MON_BASE[j] += (c[0] / cs) * f; MON_BASE[j + 1] += (c[1] / cs) * f; MON_BASE[j + 2] += (c[2] / cs) * f; } }
  return MON_BASE;
}
let MON_LAST = null, MON_TICK = 0, MON_AVG = [0.75, 0.82, 1.1];
function screenLights(src, lights, st, v) {
  if (!SAMP) { SAMP = document.createElement('canvas'); SAMP.width = MON_K; SAMP.height = 2; monWeights(); }
  // the screen's colours drift slowly: sample every few frames, re-tint only when they moved
  if (MON_LAST && MON_LAST.src === src && MON_LAST.v === v && ++MON_TICK % 5) return MON_LM;
  const g = SAMP.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'medium';
  g.drawImage(src, 0, 0, src.width, src.height, 0, 0, MON_K, 2);
  const d = g.getImageData(0, 0, MON_K, 2).data, C = [];
  for (let k = 0; k < MON_K; k++) {
    let r = 0, gg = 0, b = 0; for (const row of [0, 1]) { const o = (row * MON_K + k) * 4, wgt = row ? 0.65 : 0.35; r += (d[o] / 255) * wgt; gg += (d[o + 1] / 255) * wgt; b += (d[o + 2] / 255) * wgt; }
    const lum = r * 0.3 + gg * 0.55 + b * 0.15, s = Math.max(0.05, lum), c = [r / s + 0.15, gg / s + 0.15, b / s + 0.25], cs = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, I = (0.18 + lum * 1.9) * 1.35;
    C.push([(c[0] / cs) * I, (c[1] / cs) * I, (c[2] / cs) * I]);
  }
  MON_AVG = [0, 1, 2].map((q) => C.reduce((s, c) => s + c[q], 0) / MON_K);   // the screen's overall light, for his face in her panel
  const sig = C.flat().map((v) => Math.round(v * 40)).join(',');
  if (MON_LAST && MON_LAST.sig === sig && MON_LAST.src === src && MON_LAST.v === v) return MON_LM;
  MON_LAST = { sig, src, v };
  const N = (RS_H - MON_Y0) * RS_W, LM = MON_LM, o3 = MON_Y0 * RS_W * 3;
  LM.set(monBase(v));
  for (let k = 0; k < MON_K; k++) { const [cr, cg, cb] = C[k], base = k * N; for (let i = 0; i < N; i++) { const w = MON_W[base + i]; if (!w) continue; const j = o3 + i * 3; LM[j] += w * cr; LM[j + 1] += w * cg; LM[j + 2] += w * cb; } }
  return LM;
}

// the dog lives in dog.js (drawn over the desk, before the cards)

// ---------------------------------------------------------------- frame
let RS_CANVAS = null, SHAKE_C = null;
function drawDesk(screen, tScreen, t, moment = 'calm', o = {}) {
  const st = { ...DESK_MOMENTS[moment] }; if (screen === 'excel') st.flash = true;
  if (o.phone) Object.assign(st, o.phone);   // the phone's state from the page (phone.js): { phone, caller, banners }
  if (o.deskSt) Object.assign(st, o.deskSt);
  const v = o.variant || DESK_VARIANT, D = DESK_VARIANTS[v], set = deskSet(v);
  const DV = (st.dog || o.dog) ? dogView(st, t, o) : null;   // the dog (dog.js): decided first, since a slam cuts the signal
  const src0 = screen === 'excel' ? (typeof drawQ4 === 'function' ? drawQ4(tScreen, v) : drawExcel(tScreen, v)) : drawScreen(screen, tScreen, o);
  const src = DV && DV.noSignal ? drawNoSignal(t, v, DV.noSignal) : src0;   // NO SIGNAL: the room goes dark with the screen
  if (!RS_CANVAS) { RS_CANVAS = document.createElement('canvas'); RS_CANVAS.width = RS_W; RS_CANVAS.height = RS_H; }
  const ctx = RS_CANVAS.getContext('2d', { willReadFrequently: true });
  setRes(RS_W, RS_H);
  const L = DESK_LAYER || buildDeskLayer();
  const F = buf('desk', RS_W, RS_H); bind(F); CLIP = null;
  F.V.set(L.V); F.M.set(L.M); F.E.set(L.E); F.A.set(L.A); F.I.set(L.I); F.T.fill(0); F.DX.fill(0); F.G.fill(1); F.X.fill(0);
  MAT = M_STONE; EMI = 0; TAG = 0;
  const lights = [];
  F.LM = screenLights(src, lights, st, v);
  for (let y = 8; y < 240; y++) F.I.fill(P.void, y * W + 9, y * W + 483);      // the game screen goes here
  bezel(st, t);
  (typeof taskbar98 === 'function' ? taskbar98 : taskbar)(st, t, screen);
  keyLights(lights, st, false, v);
  phone(st, t, lights);
  zoneAura(st, t, lights);
  if (D.led) ledWash(t);
  tonightNote(st);
  const DGV = DV ? drawDog(st, t, set, o, DV) : null;
  youCard(st, t);
  feedCard(st);
  if (DGV) dogCard(DGV, t);
  const ds = VIEW.strength; VIEW.strength = 0.09;
  usePal(set);
  composeInto(ctx, F, { lights, ambient: D.amb, tint: 0.5, vig: 0 }, 0);
  usePal(PAL_BASE);
  VIEW.strength = ds;
  canIconOverlay(ctx);
  ctx.drawImage(src, 0, 0, 474, 232, 9, 8, 474, 232);
  if (DV && DV.shake > 0) {   // the slam: the whole desk jolts
    if (!SHAKE_C) { SHAKE_C = document.createElement('canvas'); SHAKE_C.width = RS_W; SHAKE_C.height = RS_H; }
    const g = SHAKE_C.getContext('2d'); g.drawImage(RS_CANVAS, 0, 0);
    const a = DV.shake * 3, dx = Math.round(Math.sin(t * 61) * a), dy = Math.round(Math.cos(t * 47) * a * 0.7);
    ctx.fillStyle = '#0a0814'; ctx.fillRect(0, 0, RS_W, RS_H); ctx.drawImage(SHAKE_C, dx, dy);
  }
  if (DV) { setRes(RS_W, RS_H); dogOverlay(ctx, DV, t, set); }
  if (o.eb) drawEnergyBreak(ctx, o.eb, o.ebT ?? t);
  if (DV && DV.kind === 'cables' && typeof drawCableFix === 'function') drawCableFix(ctx, o.dogT ?? t);
  return RS_CANVAS;
}

// ---------------------------------------------------------------- the live desk (V3, #68): the game's own right screen
// drawDesk above shows the page's fixed moments; this draws the same right screen from the game's state (st, from
// src/render/deskView.ts) around the game screen (src: what the monitor shows, 474 x 232, for the light), and
// returns the hit regions of what you can click or hover. The dog and the energy break stay the game's own for now.
// The game's desk (V3): the same pipeline in two halves the game can put on different frames (phase 1 builds the
// frame: geometry, lights, cards, hits; phase 2 lights it and pastes the screen in). Phase 0 does both at once.
let DESK_PENDING = null;
function drawDeskLive(src, st, t, phase = 0) {
  const v = DESK_VARIANT, D = DESK_VARIANTS[v], set = deskSet(v);
  if (!RS_CANVAS) { RS_CANVAS = document.createElement('canvas'); RS_CANVAS.width = RS_W; RS_CANVAS.height = RS_H; }
  const ctx = RS_CANVAS.getContext('2d', { willReadFrequently: true });
  setRes(RS_W, RS_H);
  if (phase === 2) return deskLight(ctx, set, D);
  const L = DESK_LAYER || buildDeskLayer();
  const F = buf('desk', RS_W, RS_H); bind(F); CLIP = null;
  F.V.set(L.V); F.M.set(L.M); F.E.set(L.E); F.A.set(L.A); F.I.set(L.I); F.T.fill(0); F.DX.fill(0); F.G.fill(1); F.X.fill(0);
  MAT = M_STONE; EMI = 0; TAG = 0;
  DESK_HITS = [];
  const lights = [];
  F.LM = screenLights(src, lights, st, v);
  for (let y = 8; y < 240; y++) F.I.fill(P.void, y * W + 9, y * W + 483);      // the game screen goes here
  bezel(st, t);
  (typeof taskbar98 === 'function' ? taskbar98 : taskbar)(st, t, st.screen);
  keyLights(lights, st, false, v);
  phone(st, t, lights);
  zoneAura(st, t, lights);
  if (D.led) ledWash(t);
  tonightNote(st);
  youCard(st, t);
  feedCard(st);
  DESK_PENDING = { F, lights, src, hits: DESK_HITS }; DESK_HITS = null;
  return phase === 1 ? null : deskLight(ctx, set, D);
}
function deskLight(ctx, set, D) {
  const p = DESK_PENDING; if (!p) return null;
  DESK_PENDING = null; bind(p.F); CLIP = null;
  const ds = VIEW.strength; VIEW.strength = 0.09;
  usePal(set);
  composeInto(ctx, p.F, { lights: p.lights, ambient: D.amb, tint: 0.5, vig: 0 }, 0);
  usePal(PAL_BASE);
  VIEW.strength = ds;
  canIconOverlay(ctx);
  ctx.drawImage(p.src, 0, 0, p.src.width, p.src.height, 9, 8, 474, 232);
  return { canvas: RS_CANVAS, hits: p.hits };
}

// ---------------------------------------------------------------- Excel (Tab): a Mac OS 8 spreadsheet window with Tetris in it
let XL_CANVAS = null;
const XL_COLS = (() => { const c = [[14, '']]; c.push([54, 'A']); for (let k = 0; k < 10; k++) c.push([16, 'BCDEFGHIJK'[k]]); c.push([44, 'L'], [44, 'M'], [44, 'N'], [44, 'O'], [60, 'P']); return c; })();
const XL_DATA = { 1: ['Q3 budget', '', 'FINAL'], 2: ['Rent'], 3: ['Power'], 4: ['Food'], 5: ['Internet'], 6: ['Phone'], 7: ['Server'], 8: ['Misc'], 10: ['Total'], 12: ['Notes'], 13: ['check w/ Tom'] };
const XL_NUMS = { 2: [2400, 2400, 2400], 3: [312, 288, 341], 4: [1150, 980, 1210], 5: [89, 89, 89], 6: [120, 95, 140], 7: [45, 45, 60], 8: [230, 410, 175], 10: [4346, 4307, 4415] };
const XL_STACK = [ // the Tetris board, bottom up: colour letter per column (B..K), '.' empty
  'gg.ssoocc.', 'gggsoo.ccr', '.gs.sso.rr', '..s..o...r',
];
const XL_FILL = { g: 'g5', s: 's5', o: 'gold', c: 'copper', r: 'd5', x: 'arcane' };
function drawExcel(t, v = DESK_VARIANT) {
  if (!XL_CANVAS) { XL_CANVAS = document.createElement('canvas'); XL_CANVAS.width = GS_W; XL_CANVAS.height = GS_H; }
  setRes(GS_W, GS_H);
  const F = buf('xl', GS_W, GS_H); clearFrame(F); bind(F); CLIP = null;
  rectI(0, 0, W, H, P.moon);
  // title bar: Platinum racing stripes, close box, title, zoom and collapse boxes
  rectI(0, 0, W, 12, P.u6); rectI(0, 0, W, 1, P.moon); rectI(0, 11, W, 1, P.u3);
  for (let y = 2; y <= 9; y += 2) { rectI(4, y, W - 8, 1, P.u4); rectI(4, y + 1, W - 8, 1, P.moon); }
  const title = 'Q3_budget_FINAL_v7.xls', tw = measure(title, 'tiny') + 12; rectI(W / 2 - tw / 2, 1, tw, 10, P.u6); text(title, W / 2, 3, 'tiny', P.u1, { align: 'c' });
  for (const bx of [6, W - 28, W - 16]) { rectI(bx, 2, 9, 8, P.u3); rectI(bx + 1, 3, 7, 6, P.u6); rectI(bx + 1, 3, 7, 1, P.moon); }
  rectI(W - 26, 4, 5, 4, P.u3); rectI(W - 14, 5, 5, 2, P.u3);
  // the app's green toolbar
  rectI(0, 12, W, 14, P.g3); rectI(0, 12, W, 1, P.g4); rectI(0, 25, W, 1, P.g1);
  const tools = ['new', 'open', 'save', '|', 'cut', 'copy', 'paste', '|', 'sum', 'sort', 'chart', '|', 'pct', 'cur', 'bold'];
  let x = 6;
  for (const k of tools) {
    if (k === '|') { rectI(x + 1, 15, 1, 8, P.g2); rectI(x + 2, 15, 1, 8, P.g4); x += 6; continue; }
    rectI(x, 14, 11, 10, P.g4); rectI(x, 14, 11, 1, P.g5); rectI(x, 23, 11, 1, P.g2);
    const ic = { new: () => { rectI(x + 3, 16, 5, 7, P.moon); putI(x + 7, 16, P.g4); }, open: () => { rectI(x + 2, 17, 7, 5, P.gold); rectI(x + 2, 16, 3, 1, P.gold); }, save: () => { rectI(x + 2, 16, 7, 7, P.s3); rectI(x + 4, 16, 3, 2, P.moon); rectI(x + 3, 20, 5, 3, P.moon); },
      cut: () => { lineI(x + 3, 16, x + 7, 22, P.moon); lineI(x + 7, 16, x + 3, 22, P.moon); }, copy: () => { rectI(x + 2, 16, 4, 5, P.moon); rectI(x + 5, 18, 4, 5, P.pale); }, paste: () => { rectI(x + 3, 17, 5, 6, P.u5); rectI(x + 4, 16, 3, 1, P.u3); rectI(x + 4, 18, 3, 4, P.moon); },
      sum: () => glyph('sigma', x + 4, 16, P.moon), sort: () => { text('A', x + 2, 16, 'tiny', P.moon); putI(x + 8, 17, P.pale); putI(x + 8, 19, P.pale); putI(x + 8, 21, P.pale); }, chart: () => { rectI(x + 2, 19, 2, 4, P.gold); rectI(x + 5, 17, 2, 6, P.s5); rectI(x + 8, 20, 1, 3, P.crimson); },
      pct: () => text('%', x + 3, 16, 'tiny', P.moon), cur: () => text('$', x + 3, 16, 'tiny', P.moon), bold: () => text('B', x + 3, 16, 'tiny', P.moon) };
    ic[k](); x += 13;
  }
  text('Arial', x + 8, 17, 'tiny', P.g6); rectI(x + 5, 14, 40, 10, P.g2); text('Arial', x + 8, 17, 'tiny', P.g6); text('10', x + 50, 17, 'tiny', P.g6);
  // formula bar
  rectI(0, 26, W, 11, P.u6); rectI(0, 36, W, 1, P.u3);
  rectI(3, 27, 26, 9, P.moon); frameI(3, 27, 26, 9, P.u4); text('B7', 6, 29, 'tiny', P.u1);
  text('fx', 34, 29, 'tiny', P.g3); rectI(44, 27, W - 48, 9, P.moon); frameI(44, 27, W - 48, 9, P.u4); text('=SUM(B2:B8)*1.23', 47, 29, 'tiny', P.u1);
  // the sheet: header row, row numbers, grid, the budget, and the Tetris in columns B to K
  const top = 37, rh = 10, rows = Math.floor((H - top - 22) / rh) - 1;
  let cx = 0; const colX = XL_COLS.map(([w]) => { const a = cx; cx += w; return a; });
  rectI(0, top, W, rh, P.u6);
  XL_COLS.forEach(([w, l], k) => { const a = colX[k]; rectI(a + w - 1, top, 1, rh, P.u4); if (l) text(l, a + w / 2, top + 3, 'tiny', P.u2, { align: 'c' }); });
  rectI(0, top + rh - 1, W, 1, P.u4);
  const fall = Math.floor(t * 2.2) % 12, piece = [[0, 0], [1, 0], [2, 0], [1, 1]], pcol = 4 + Math.floor(t * 0.7) % 3;
  for (let r = 1; r <= rows; r++) {
    const y = top + r * rh;
    rectI(0, y, 14, rh, P.u6); text(String(r), 7, y + 3, 'tiny', P.u2, { align: 'c' }); rectI(13, y, 1, rh, P.u4);
    for (let k = 1; k < XL_COLS.length; k++) { rectI(colX[k] + XL_COLS[k][0] - 1, y, 1, rh, P.u6); }
    rectI(14, y + rh - 1, W - 14, 1, P.u6);
    const lab = XL_DATA[r]; if (lab) text(lab[0], colX[1] + 2, y + 3, 'tiny', r === 1 || r === 10 ? P.g3 : P.u2);
    if (r === 1 && lab) text('FINAL', colX[13] + 2, y + 3, 'tiny', P.crimson);
    const nums = XL_NUMS[r]; if (nums) nums.forEach((n, j) => text(n.toLocaleString('en-US'), colX[12 + j] + XL_COLS[12 + j][0] - 3, y + 3, 'tiny', r === 10 ? P.u1 : P.u3, { align: 'r' }));
    // the board: rows from the bottom
    const br = rows - r; // 0 = bottom row
    for (let c = 0; c < 10; c++) {
      let ch = XL_STACK[br] ? XL_STACK[br][c] : '.';
      const pr = rows - 1 - fall; for (const [dx, dy] of piece) if (br === pr - dy && c === pcol + dx) ch = 'x';
      if (ch === '.') continue;
      const a = colX[2 + c], cw = XL_COLS[2 + c][0], col = P[XL_FILL[ch]];
      rectI(a, y, cw - 1, rh - 1, col); rectI(a, y, cw - 1, 1, P.moon); rectI(a, y + rh - 2, cw - 1, 1, ch === 'x' ? P.d2 : P.u3);
    }
  }
  // the selected cell
  frameI(colX[2] - 1, top + 7 * rh - 1, XL_COLS[2][0] + 1, rh + 1, P.g3);
  // sheet tabs and status bar
  const sy = H - 22; rectI(0, sy, W, 11, P.u6); rectI(0, sy, W, 1, P.u4);
  for (const [k, n] of ['Sheet1', 'Sheet2', 'Sheet3'].entries()) { const tx = 6 + k * 40; rectI(tx, sy + 1, 38, 9, k ? P.u6 : P.moon); frameI(tx, sy, 38, 10, P.u4); text(n, tx + 19, sy + 3, 'tiny', P.u2, { align: 'c' }); }
  rectI(0, H - 11, W, 11, P.u6); rectI(0, H - 11, W, 1, P.moon); text('Ready', 6, H - 8, 'tiny', P.u2); text('Sum: 4,346', W - 6, H - 8, 'tiny', P.u2, { align: 'r' });
  usePal(deskSet(v));
  composeInto(XL_CANVAS.getContext('2d'), F, { lights: [], ambient: [1, 1, 1], tint: 0, vig: 0 }, 0);
  usePal(PAL_BASE);
  return XL_CANVAS;
}
