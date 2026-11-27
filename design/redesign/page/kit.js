// ===========================================================================
// Loot Night RPG — 90s PC-RPG UI kit on the 640x360 grid (Moonwell 32 palette)
// Bronze bevels, engraved headers, recessed slots, riveted corners.
// Everything here writes palette indices (never dithered, never on texture).
// ===========================================================================
const PX = {
  v: 'void', 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5', 6: 's6', M: 'moon',
  a: 'd1', b: 'd2', c: 'd3', d: 'd4', e: 'd5', f: 'd6',
  p: 'u1', q: 'u2', r: 'u3', s: 'u4', t: 'u5', u: 'u6',
  g: 'g1', h: 'g2', i: 'g3', j: 'g4', k: 'g5', l: 'g6',
  W: 'wine', C: 'copper', O: 'gold', Y: 'pale', R: 'crimson', X: 'arcane',
};
function sprite(x, y, rows, recolor) {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i]; if (c === '.' || c === ' ') continue; let n = PX[c]; if (recolor && recolor[c]) n = recolor[c]; if (n != null) putI(x + i, y + j, P[n]); } });
}
function lineI(x0, y0, x1, y1, idx) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (;;) { putI(x0, y0, idx); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function discI(cx, cy, r, idx) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) putI(x, y, idx); }
function ringI(cx, cy, r, idx) { for (let a = 0; a < 64; a++) putI(Math.round(cx + Math.cos(a / 64 * 6.283) * r - 0.5), Math.round(cy + Math.sin(a / 64 * 6.283) * r - 0.5), idx); }

// ---------------------------------------------------------------- colours with meaning
const UIC = {
  bg: () => P.u1, inset: () => P.void, hi: () => P.u5, mid: () => P.u3, lo: () => P.u2, rivet: () => P.u6,
  text: () => P.u6, textHi: () => P.moon, dim: () => P.u4, gold: () => P.gold,
};
const RARITY = { common: 'u5', uncommon: 'g5', rare: 's5', epic: 'arcane', legendary: 'copper' };
const RARITY_TEXT = { common: 'u6', uncommon: 'g6', rare: 's6', epic: 'arcane', legendary: 'copper' };

// ---------------------------------------------------------------- UI materials
// Surfaces go into VALUE + MATERIAL with E=2 (unlit, no vignette), so compose runs them through the same
// hue-shifted ramps and Bayer dither as the world. Text, icons and meaning-lines stay palette-exact (I).
function putU(x, y, v, mat = M_UMBER) {
  x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (CLIP && (x < CLIP[0] || y < CLIP[1] || x >= CLIP[2] || y >= CLIP[3])) return;
  const i = y * W + x; B.V[i] = v; B.M[i] = mat; B.E[i] = 2; B.A[i] = 1; B.T[i] = 0; B.DX[i] = 0; B.X[i] = 0; B.G[i] = 1; B.I[i] = -1;
}
function fillU(x, y, w, h, v, mat = M_UMBER) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) putU(i, j, sv(v, i, j), mat); }
// soft cast shadow: darkens whatever is underneath (scene or UI surface), the dither does the falloff
function shadowU(x, y, w, h, o = {}) {
  const k = o.k ?? 0.6, r = o.r ?? 4, dx = o.dx ?? 2, dy = o.dy ?? 3, X0 = x + dx, Y0 = y + dy;
  for (let j = Math.max(0, Y0 - r); j < Math.min(H, Y0 + h + r); j++) for (let i = Math.max(0, X0 - r); i < Math.min(W, X0 + w + r); i++) {
    if (CLIP && (i < CLIP[0] || j < CLIP[1] || i >= CLIP[2] || j >= CLIP[3])) continue;
    const ex = Math.max(X0 - i - 0.5, i + 0.5 - (X0 + w), 0), ey = Math.max(Y0 - j - 0.5, j + 0.5 - (Y0 + h), 0), d = Math.hypot(ex, ey);
    if (d >= r) continue;
    B.G[j * W + i] *= 1 - k * (1 - d / r) ** 1.4;
  }
}
// radial darkening (smoke behind HUD text on the scene)
function smokeU(cx, cy, rx, ry, k) {
  for (let j = Math.max(0, Math.floor(cy - ry)); j < Math.min(H, cy + ry); j++) for (let i = Math.max(0, Math.floor(cx - rx)); i < Math.min(W, cx + rx); i++) {
    const d = ((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2; if (d >= 1) continue;
    B.G[j * W + i] *= 1 - k * (1 - d) ** 1.2;
  }
}
// grain: tileable value noise for leather, bronze and parchment
const GRT = new Float32Array(256 * 128);
for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) GRT[y * 256 + x] = fbm(x * 0.21, y * 0.21, 5, 54) * 0.7 + hash(x, y, 77) * 0.3;
const GR = (x, y) => GRT[((y & 127) << 8) | (x & 255)];

// raised bronze plate: void rim, lit top-left edge, shaded bottom-right, vertical sheen, grain
function plateU(x, y, w, h, o = {}) {
  const mat = o.mat ?? M_UMBER, top = o.top ?? 0.5, bot = o.bot ?? 0.26, hi = o.hi ?? 0.8, lo = o.lo ?? 0.12, g = o.grain ?? 0.07, rim = o.rim ?? 0.02;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const ox = i === x || i === x + w - 1, oy = j === y || j === y + h - 1;
    if (ox && oy && !o.square) continue;
    let v;
    if (ox || oy) v = rim;
    else if (j === y + 1 || i === x + 1) { putU(i, j, (j === y + 1 && i === x + 1) ? Math.min(1, hi + 0.08) : (j === y + 1 ? hi : hi - 0.1), o.hiMat ?? mat); continue; }
    else if (j === y + h - 2 || i === x + w - 2) v = lo;
    else v = lerp(top, bot, (j - y - 2) / Math.max(1, h - 5)) + g * (GR(i, j) - 0.5);
    putU(i, j, v, mat);
  }
}
// recessed well: dark interior with an inner shadow under the top-left lip and a lit bottom-right lip
function wellU(x, y, w, h, o = {}) {
  const mat = o.mat ?? M_DUSK, base = o.v ?? 0.12, lip = o.lip ?? 0.5;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    let v, m = mat;
    if (j === y || i === x) v = 0;
    else if (j === y + h - 1 || i === x + w - 1) { v = lip; m = M_UMBER; }
    else { const d = Math.min(i - x - 1, j - y - 1); v = base * clamp(d / 3.5) + 0.02 * (GR(i + 31, j) - 0.5); }
    putU(i, j, v, m);
  }
}
// carved frame moulding (2px ridge + grooves) with domed corner bosses
function mouldU(x, y, w, h, o = {}) {
  const mat = o.mat ?? M_UMBER, k = o.k ?? 1;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const dx = Math.min(i - x, x + w - 1 - i), dy = Math.min(j - y, y + h - 1 - j), d = Math.min(dx, dy);
    if (d > 3) continue;
    const tl = (i - x <= 3 && i - x <= y + h - 1 - j) || (j - y <= 3 && j - y <= x + w - 1 - i);
    let v;
    if (d === 0 || d === 3) v = 0.02;
    else if (d === 1) v = tl ? 0.86 : 0.34;
    else v = tl ? 0.6 : 0.18;
    putU(i, j, Math.min(1, v * k + 0.05 * (GR(i, j + 40) - 0.5)), mat);
  }
  if (o.bosses !== false) for (const [cx, cy] of [[x + 1, y + 1], [x + w - 6, y + 1], [x + 1, y + h - 6], [x + w - 6, y + h - 6]]) bossU(cx, cy, 5, mat);
}
// domed stud
function bossU(x, y, s, mat = M_UMBER) {
  const r = s / 2, cx = x + r, cy = y + r;
  for (let j = y; j < y + s; j++) for (let i = x; i < x + s; i++) {
    const dx = (i + 0.5 - cx) / r, dy = (j + 0.5 - cy) / r, d = dx * dx + dy * dy; if (d > 1.15) continue;
    putU(i, j, d > 0.8 ? 0.04 : clamp(0.45 + 0.5 * (-dx * 0.5 - dy * 0.7) + 0.25 * (1 - d)), mat);
  }
}
// leather / dark wood backing with a vignette toward the edges
function leatherU(x, y, w, h, o = {}) {
  const base = o.v ?? 0.17, vg = o.vig ?? 0.55, mat = o.mat ?? M_UMBER;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const nx = (i + 0.5 - x - w / 2) / (w / 2), ny = (j + 0.5 - y - h / 2) / (h / 2);
    const e = 1 - vg * clamp(Math.max(Math.abs(nx), Math.abs(ny)) ** 6 * 0.8 + (nx * nx + ny * ny) * 0.12);
    putU(i, j, (base + 0.07 * (GR(i, j) - 0.5)) * e, mat);
  }
}
// parchment surface: mottled, darker and scorched toward the edges
function parchU(x, y, w, h, o = {}) {
  const top = o.v ?? 0.8, burn = o.burn ?? 0.32;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const d = Math.min(i - x, x + w - 1 - i, j - y, y + h - 1 - j);
    if (o.torn && d < Math.floor(hash(Math.floor((i * 7 + j * 3) / 5), 9, 3) * (o.torn + 1.4))) continue;
    let v = top - 0.1 * fbm(i * 0.08, j * 0.08, 41) - 0.05 * (GR(i, j) - 0.5);
    v -= burn * clamp(1 - d / 5) ** 2;
    putU(i, j, v, M_UMBER);
  }
}

// ---------------------------------------------------------------- frames (kit API, now with depth)
function bevel(x, y, w, h) { plateU(x, y, w, h); }
function inset(x, y, w, h) { wellU(x, y, w, h); }
function windowFrame(x, y, w, h, o = {}) {
  shadowU(x, y, w, h, { k: 0.65, r: 5, dx: 3, dy: 4 });
  leatherU(x + 3, y + 3, w - 6, h - 6, { v: o.v ?? 0.16 });
  mouldU(x, y, w, h);
}
// engraved bronze header strip with a label (Silkscreen) and optional right-hand text
function headerBar(x, y, w, label, right, o = {}) {
  for (let j = 0; j < 10; j++) for (let i = x; i < x + w; i++) {
    const v = j === 0 ? 0.74 : j === 1 ? 0.5 : j === 9 ? 0 : j === 8 ? 0.12 : lerp(0.42, 0.22, (j - 2) / 5) + 0.06 * (GR(i, y + j) - 0.5);
    putU(i, y + j, v, M_UMBER);
  }
  for (const cx of [x + 2, x + w - 3]) { putU(cx, y + 4, 0.9); putU(cx, y + 5, 0.55); putU(cx - 1, y + 5, 0.08); putU(cx + 1, y + 5, 0.08); }
  text(label, x + 6, y + 3, 'silkb', o.color ?? P.u6, { shadow: P.void });
  if (right) text(right, x + w - 6, y + 3, 'tiny', o.rightColor ?? P.u5, { align: 'r', shadow: P.void });
}
function button(x, y, w, h, lines, o = {}) {
  const on = !o.off;
  if (!o.flat) shadowU(x, y, w, h, { k: 0.55, r: 3, dx: 1, dy: 2 });
  const mat = o.mat ?? M_UMBER;
  plateU(x, y, w, h, o.mat === M_MAGIC ? { mat, top: 0.4, bot: 0.3, hi: 0.86, hiMat: M_DUSK, lo: 0.2, grain: 0.03 } : { mat, top: on ? 0.48 : 0.3, bot: on ? 0.24 : 0.16, hi: on ? 0.78 : 0.42, lo: 0.1 });
  lines.forEach(([s, f, idx], k) => text(s, x + (w >> 1), y + 3 + k * 7, f, on ? idx : P.u4, { align: 'c', shadow: P.void }));
}
function closeX(x, y) {
  for (let j = y; j < y + 9; j++) for (let i = x; i < x + 9; i++) {
    const dx = (i + 0.5 - x - 4.5) / 4.5, dy = (j + 0.5 - y - 4.5) / 4.5, d = dx * dx + dy * dy; if (d > 1) continue;
    putU(i, j, d > 0.62 ? 0.02 : clamp(0.62 - 0.35 * (dx * 0.4 + dy * 0.7)), M_UMBER);
  }
  for (let k = 0; k < 5; k++) { putI(x + 2 + k, y + 2 + k, P.crimson); putI(x + 6 - k, y + 2 + k, P.crimson); }
}

const COIN = ['.aaa.', 'abbba', 'abcba', 'abbba', '.aaa.'];
const SKULL = ['.aaa.', 'aaaaa', 'a.a.a', 'aaaaa', '.a.a.'];
const ARROW = ['a..', 'aa.', 'aaa', 'aa.', 'a..'];
// ---------------------------------------------------------------- icons (11x11)
const ICON = {
  cleave: ['.......Mu..', '......M65..', '.M...M65...', 'M...M65....', 'M..M65.....', '.MM65......', '..65.......', '.su........', 'tqs........', 'qt.........', 't..........'],
  taunt: ['....RRR....', '...RRWRR...', '..3456666..', 'R.3vvvvvv.R', '.R345v566R.', 'R.345v566.R', '..2345566..', '...23455...', '...........', '...........', '...........'],
  shield: ['.ttttttttt.', '.tccdddcct.', '.tcdduddct.', '.tcduuudct.', '.tcdduddct.', '.tccdddcct.', '..tcccccq..', '..tqccccq..', '...tcccq...', '....tqt....', '.....t.....'],
  hellfire: ['.....u.....', '....uu.....', '...ttu..t..', '..tuuMt.t..', '..tuMMut...', '.stuMMMuts.', '.stuMMMuts.', 'rstuMMMutsr', 'rsstuuutssr', '.rssttttsr.', '..rrrsssr..'],
  frost: ['.....M.....', '..6..M..6..', '...6.M.6...', '6...656...6', '.6..5M5..6.', 'MMM5MMM5MMM', '.6..5M5..6.', '6...656...6', '...6.M.6...', '..6..M..6..', '.....M.....'],
  soul: ['......XX...', '....XXMXX..', '...XMMMMX..', '..XMM6MMX..', '..XM6X6MX..', '..XMM6MMX..', '...XMMMX...', '..XXXXX....', '.XX........', 'X..X.......', '..X........'],
  mend: ['....kkk....', '....klk....', '....klk....', '.kkkklkkkk.', '.kllllllllk', '.kkkklkkkk.', '....klk....', '....klk....', '....klk....', '....kkk....', '...........'],
  ward: ['...........', '...YYYYY...', '.YYu...uYY.', '.Yu..O..uY.', 'Yu...O...uY', 'Yu.OOOOO.uY', 'Yu...O...uY', '.Yu..O..uY.', '.YYu...uYY.', '...YYYYY...', '...........'],
  judge: ['u....u....u', '.u...u...u.', '..u.....u..', '...MMMMM...', 'uu.M666M.uu', '...M666M...', '..uMMMMMu..', '.u..qrq..u.', '....qrq....', '....qrq....', '....qtq....'],
  lock: ['...........', '...33333...', '..3.....3..', '..3.....3..', '..3.....3..', '.222222222.', '.233333332.', '.2333v3332.', '.2333v3332.', '.222222222.', '...........'],
  // buffs
  can: ['...6666....', '..6MMMM6...', '..jjjjjj...', '..jklkkj...', '..jkllkj...', '..jklkkj...', '..jkklkj...', '..jklkkj...', '..jjjjjj...', '..666666...', '...........'],
  crash: ['....RR.....', '....RR.....', '....RR.....', '..RRRRRR...', '...RRRR....', '....RR.....', '...........', '..MMMMM....', '..M666M....', '..MMMMM....', '...........'],
};
// skill icons 13x13, themed by class: knight = steel and blood, heavy; mage = arcane elements, glowing;
// priest = gold, ivory and green light. Dark 1 px outline baked in so silhouettes read at a glance.
const SKILL_ICON = {
  cleave: ['M6v...vRRRvv.', '5M6v...vWRRRv', 'v5M6v...vvWRR', '.v5M6v....vRR', '..v5M6v...vWR', '...v5M6v..vRR', '....v5M6vvWRv', '....vv5M6RRv.', '...vOOv5MRv..', '....vOCOvv...', '.....vOsv....', '......vsrv...', '.......vOOv..'],
  taunt: ['....vRRRv....', '...vRRWRRv...', 'v.v3456666v.v', 'Rvv3456M66vvR', 'vRv3vvvvvvvRv', '.vR345v566Rv.', 'vRv345v566vRv', 'Rvv3455566vvR', 'v.v2345566v.v', '...v23455v...', '....vvvvv....', '.............', '.............'],
  shield: ['.vvvvvvvvvYvY', 'v5666666MvvYv', 'v5WWWWWW6vYvY', 'v5WWROWW6vv.v', 'v5WROOOW6v...', 'v5WWROWW6v...', 'v5WWWOWW6v...', 'v5WWWWWW6v...', 'v45WWWW65v...', '.v45WW65v....', '..v4556v.....', '...v45v......', '....vv.......'],
  hellfire: ['.....vRv..v..', '....vRCv.vRv.', '...vRCCvvRCv.', '..vRCOCvRCCv.', '.vRCOOCRCOCv.', '.vRCOYOCOOCRv', 'vRCOYYYOOYCRv', 'vRCOYMMYYOCRv', 'vRCOYMMMYOCRv', '.vRCOYYYOCRv.', '..vRCCOCCRv..', '...vRRRRRv...', '....vvvvv....'],
  frost: ['.....vMv.....', '..v.vM6Mv.v..', '.v6vvM6Mvv6v.', '..v6v565v6v..', 'vvvv6M6M6vvvv', '656M66M66M656', 'vvvv6M6M6vvvv', '..v6v565v6v..', '.v6vvM6Mvv6v.', '..v.vM6Mv.v..', '.....vMv.....', '......v......', '.............'],
  soul: ['....vXXXXv...', '...vXMMMMXv..', '..vXMMMMMMXv.', '..vXMvvMvvXv.', '..vXMvvMvvXv.', '..vXMMMvMMXv.', '...vXMvvvXv..', '..vXXMvMvXv..', '.vXXvXXXXv...', 'vXXv.vvvv....', 'XXv..........', 'vv...........', '.............'],
  mend: ['....vkkkv....', '....vklkv....', '..v..vlv..v..', '.vkv.vlv.vkv.', 'vklvvklkvvlkv', 'klllllOllllkv', 'vklvvklkvvlkv', '.vkv.vlv.vkv.', '..v..vlv..v..', '....vklkv....', '....vkkkv....', '.....vvv.....', '.............'],
  ward: ['..vvYYYYYvv..', '.vYYuuuuuYYv.', 'vYuMvvvvvuYv.', 'vYMv.vOv.vuYv', 'Yuv.vvOvv.vuY', 'YuvvOOOOOvvuY', 'Yuv.vvOvv.vuY', 'vYuv.vOv.vuYv', 'vYuvvvvvvvuYv', '.vYYuuuuuYYv.', '..vvYYYYYvv..', '....vvvvv....', '.............'],
  judge: ['.....vYv.....', '.vvvvYOYvvvv.', 'vOOOOOOOOOOOv', 'vOvvvvOvvvvOv', 'OvOv.vOv.vOvO', 'OvvOvvOvvOvvO', 'YYYYYvOvYYYYY', 'vOOOvvOvvOOOv', '.vvv.vOv.vvv.', '....vvOvv....', '...vCOOOCv...', '..vCCCCCCCv..', '...vvvvvvv...'],
  backstab: ['....vCOCv....', '.....vCv.....', '....vqrsv....', '...vvqrsvv...', '..vCOOYOOCv..', '..vCv46MvCv..', '...vv46Mvv...', '....v46Mv....', '.v..v46Mv..v.', 'vWvvv46MvvvWv', '.vvRv56MvRvv.', '.vRvvvMvvvRv.', '..vvRvRvWvv..'],
  pickpocket: ['........vutrq', '......vvtssrq', '.....vM5vtrvv', '....vuvv.vv..', '...vstsv.....', '...vqrqv.....', '..vsssttv....', '.vrrsssttvvv.', '.vrdrssstvOYv', '.vqrOYsssvCOv', '.vqqrrrssvvvv', '..vvqrrvv.vOC', '....vvv....vv'],
  smoke: ['..........vCY', '..........vOO', '.........vCvv', '.....v..vqv..', '....vdvvrsv..', '.vvvdveeeev..', 'vefevbbcccev.', 'efMfebbbbfMv.', 'fMffaabbbbcev', 'effedaaabbbv.', 'vedvvaaaabbv.', 'dvvdcvaaaav..', 'vvcvvdvvvv...'],
};
const SKILL_CLASS = { cleave: 'knight', taunt: 'knight', shield: 'knight', backstab: 'rogue', smoke: 'rogue', pickpocket: 'rogue', hellfire: 'mage', frost: 'mage', soul: 'mage', mend: 'priest', ward: 'priest', judge: 'priest' };
// class tile behind a skill icon: riveted iron / violet rune field / gilded rays
function skillTile(x, y, w, h, cls) {
  const cx = x + w / 2, cy = y + 6.5;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const dx = (i + 0.5 - cx) / (w / 2), dy = (j + 0.5 - cy) / 7, d = Math.hypot(dx, dy), g = GR(i, j) - 0.5;
    if (cls === 'knight') {
      const scratch = ((i + j * 2 + 3) % 11 === 0 && hash(i, j, 5) > 0.4) ? 0.08 : 0;
      putU(i, j, 0.44 - 0.2 * (j - y) / h + 0.06 * g + scratch - (i === x || j === y ? 0.12 : 0), M_STONE);
    } else if (cls === 'rogue') {
      // the cloak: dark plum weave, a shadow pooling at the edges, one faint diagonal cut
      const cut = Math.abs((i - x) - (j - y) * 0.8 - 1) < 0.6 && hash(i, j, 8) > 0.35;
      putU(i, j, clamp(0.16 + 0.24 * (1 - d) + ((i + j) % 3 === 0 ? -0.03 : 0) + 0.03 * g + (cut ? 0.1 : 0)), M_DUSK);
    } else if (cls === 'mage') {
      const ring = Math.abs(d - 0.86) < 0.09;
      putU(i, j, ring ? 0.36 : clamp(0.14 + 0.36 * (1 - d) + 0.04 * g), ring ? M_MAGIC : M_DUSK);
    } else {
      const an = Math.atan2(dy, dx), ray = Math.cos(an * 8) > 0.55 ? 0.07 : 0;
      putU(i, j, clamp(0.24 + 0.4 * (1 - d) + ray * (1 - d) + 0.04 * g), M_UMBER);
    }
  }
  if (cls === 'knight') for (const [rx, ry] of [[x + 1, y + 1], [x + w - 2, y + 1], [x + w - 2, y + h - 2]]) { putI(rx, ry, P.s4); putI(rx + 1, ry + 1, P.s1); }
}
const ITEM = {
  sword: ['..........M.', '.........M6.', '........M6..', '.......M6...', '......M6....', '.....M6.....', '.t..M6......', '..tM6.......', '..rt........', '.rqst.......', 'rq..........', 'q...........'],
  helm: ['............', '....3455....', '...345566...', '..34556666..', '..34556666..', '..3vvvvvv6..', '..34v55v66..', '..34556666..', '..34556666..', '...3455.66..', '...34...6...', '............'],
  armor: ['............', '.t44....44t.', 'tt445..544tt', 'tt4556655 4t', '.t45566554t.', '..4556M554..', '..4556M554..', '..4556M554..', '..tttttttt..', '..4555 554..', '..44.....4..', '............'],
  boots: ['............', '...qr.......', '...qrs......', '...qrs......', '...qrs......', '...qrs......', '...qrss.....', '...qrsss....', '...qrssss...', '..qrrsssst..', '..qqqqqqqq..', '............'],
  ring: ['............', '.....XX.....', '....XMMX....', '.....XX.....', '....tutt....', '...t....t...', '..t......t..', '..t......t..', '..t......q..', '...t....q...', '....tqqq....', '............'],
  amulet: ['...t....t...', '....t..t....', '.....tt.....', '.....tt.....', '....tuut....', '...tu66ut...', '...t6MM6t...', '...t6MM6t...', '...tu66ut...', '....tuut....', '.....tt.....', '............'],
  map: ['............', '.tuuuuuuuut.', 'quu.uuuu.uuq', 'qu.r.uu.R.uq', 'quu.r..rRuuq', 'quuu.rr.uuuq', 'quuuuu.r.uuq', 'qu.uuuuu.r.q', 'quuuuuuuuuuq', '.tuuuuuuuut.', '..qqqqqqqq..', '............'],
  feather: ['.........MM.', '........M66.', '.......M66..', '......M665..', '.....M665...', '....M665....', '...M665.....', '..M665......', '..665.......', '.u5.........', 'u...........', '............'],
  unknown: ['............', '....XXXX....', '...XX..XX...', '...XX..XX...', '......XX....', '.....XX.....', '.....XX.....', '............', '.....XX.....', '.....XX.....', '............', '............'],
  tome: ['............', '..qqqqqqqq..', '.qrsssssrrq.', '.qsuMuuuusq.', '.qsuXXXuusq.', '.qsuMXMuusq.', '.qsuXXXuusq.', '.qsuMuuuusq.', '.qrsssssrrq.', '.qqqqqqqqqq.', '..3.3.3.3...', '............'],
  dagger: ['............', '............', '..........M.', '.........M6.', '........M6..', '.......M6...', '......M6....', '..O..M6.....', '...OM6......', '...rOO......', '..rq........', '.CC.........'],
  hood: ['....bcd.....', '...bccdd....', '..bccddde...', '..bcvvvde...', '.bcvvvvvde..', '.bcvvvvvde..', '.bccvvvdde..', '.bbccvcdde..', 'abbcccddeee.', 'abbbccdddee.', 'aabbbcccddd.', '............'],
  wire: ['....6666....', '..66....66..', '.6........6.', '.6........6.', '.6........5.', '..5......5..', '...55..55...', '.....55.....', '....5..5....', '...tt..tt...', '..tu....tu..', '..qs....qs..'],
  potion: ['....qq......', '....tt......', '....tt......', '...qXXq.....', '..qXXMXq....', '..XXXXMX....', '..XXXXXX....', '..qXXXXq....', '...qqqq.....', '............', '............', '............'],
};
function icon(name, x, y, o = {}) {
  const rows = ICON[name] || ITEM[name];
  if (o.shadow !== false) rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.' && r[i] !== ' ') putI(x + i + 1, y + j + 1, P.void); });
  sprite(x, y, rows);
}

// ---------------------------------------------------------------- portraits (18x20)
const PORTRAIT = {
  knight: [
    '.4M..bc...........',
    '45M.abcd..........',
    '.42M.ab4566.......',
    '.42M..345t66......',
    '..42M.34ttt6......',
    '..42M.345t66......',
    '...42M1vvvv545....',
    '...422345v653.....',
    '.3rttu345v553.34M.',
    '32343234v55632346M',
    '222341234554223456',
    '112233v1111v123445',
    'v1112r123M43t23344',
    '111rr2123M433tu344',
    'qrr22v123M43v45uut',
    '12221v1236431v3455',
    'v111v122v6v32v2344',
    '1221112v253v3223u4',
    '122112v22533v323Y4',
    '12112v2225333v3244',
  ],
  mage: [
    '..........ab......',
    '.........abc......',
    '........abcd......',
    '.......abccd......',
    '......abccdde.....',
    '.....abcqqrdde....',
    '....abcqrssrdd....',
    '....abqrsMXsdd....',
    '....abqrsssrsde...',
    '....abqrtuutsde...',
    '...aabqtuMuutcd...',
    '...abbqtuuuutcd...',
    '..abbcqtuuuutccd..',
    '.abcccdqtuMtqcddd.',
    'abccdddqtuuqdddeec',
    'aqtbcddeqtuqeedtqc',
    'abccddeeeutqeeddcc',
    'abbccddeeettddcccb',
    'aabbccddeeeedddccb',
    'aabbccddddddddccbb',
  ],
  rogue: [
    '......bc..........',
    '.....abccd........',
    '....abcccdde......',
    '...abccdddeee.....',
    '...abcdeefffff....',
    '..abcdefvvvvvff...',
    '..abcdevvvvvvvfe..',
    '..abcdevCOvvYCve..',
    '..abcdevvvvvvvee..',
    '..abccdevvvvvvee..',
    '..abbcdevvqrveed..',
    '..abbccdeevvedd...',
    '.aabbcWWWWWWWcdd..',
    '.6abbbcWWWWWcddd..',
    'M5abbbbcqrcccdddd.',
    'M5abbbbccqrtccddd.',
    '5aabbbbcccqrccddd.',
    'qaabbbbbcccqrcddde',
    'raaabbbbbccccrsdde',
    'aaabbbbbbccccccdde',
  ],
  priest: [
    '........tu........',
    '.......tuuu.......',
    '......tuiuuu......',
    '......tuiuuu......',
    '.....ttuiuuuu.....',
    '.....tuuiuuuu.....',
    '.....jiiiiiiik....',
    '.....qrsstttq.....',
    '.....qrsvstvs.....',
    '.....qrsstttu.....',
    '....hqrssstts.....',
    '....h.qrsrrsq.....',
    '...hh..qrssq......',
    '..hh.uutttuuu.....',
    '.hijkuMuuuuMukj...',
    'hijkkkluuuulkkjih.',
    'hijjkkkluulkkkjjih',
    'hiijjkklMulkkjjiih',
    'hiijjkkklukkkjjiih',
    'hhiijjkkluukkjjiih',
  ],
};
// lit + dithered portraits: the art is converted to value/material, lit like the scene (warm key from the
// upper right, cold rim from the left, candle glow behind the head), then baked to palette indices once.
const LETTER_MV = (() => {
  const m = { M: [M_STONE, 1], v: [M_STONE, 0], W: [M_LOOT, 0.4], C: [M_LOOT, 0.6], O: [M_LOOT, 0.8], Y: [M_LOOT, 1], R: [M_DANGER, 1], X: [M_MAGIC, 0.4] };
  [['123456', M_STONE], ['abcdef', M_DUSK], ['pqrstu', M_UMBER], ['ghijkl', M_MOSS]].forEach(([s, mat]) => [...s].forEach((c, k) => (m[c] = [mat, (k + 1) / 7])));
  return m;
})();
const RGB2IDX = new Map(PAL_RGB.map((c, k) => [(c[0] << 16) | (c[1] << 8) | c[2], k]));
const PORTRAIT_LIT = {};
function bakePortrait(kind) {
  const rows = PORTRAIT[kind], w = 18, h = 20, sW = W, sH = H, sVIG = VIG, sB = B;
  W = w; H = h; VIG = null;
  const F = mkBuf(w, h, true); clearFrame(F); bind(F);
  const bg = { knight: M_STONE, rogue: M_DUSK, mage: M_DUSK, priest: M_MOSS }[kind] ?? M_DUSK;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const c = rows[j][i];
    if (c === '.' || c === ' ') { const d = Math.hypot((i + 0.5 - 10) / 10, (j + 0.5 - 7) / 11); put(i, j, clamp(0.3 - 0.24 * d), d < 0.7 ? M_UMBER : bg, 1); }
    else { const [m, v] = (c === 'M' && kind !== 'knight' && kind !== 'rogue') ? [M_UMBER, 1] : (LETTER_MV[c] || [M_STONE, 0.5]); put(i, j, v, m, kind === 'rogue' && (c === 'O' || c === 'C' || c === 'Y') ? 1 : 0); }
  }
  const lights = [{ x: 21, y: -1, r: 30, i: 0.5, c: [1.2, 1.0, 0.8] }, { x: -4, y: 9, r: 14, i: 0.4, c: [0.7, 0.85, 1.35] }];
  const sStr = VIEW.strength; VIEW.strength = 0.1;
  const img = new ImageData(w, h); compose(F, img, lights, [0.74, 0.74, 0.8], 0.28, 0);
  VIEW.strength = sStr;
  const out = new Int16Array(w * h);
  for (let k = 0; k < w * h; k++) { const d = img.data; out[k] = RGB2IDX.get((d[k * 4] << 16) | (d[k * 4 + 1] << 8) | d[k * 4 + 2]) ?? 0; }
  W = sW; H = sH; VIG = sVIG; if (sB) bind(sB);
  return (PORTRAIT_LIT[kind] = out);
}
// class colours: each hero's portrait carries a 1 px outline in it, and his keys on the desk keyboard light in it
// (knight steel, rogue ember, mage violet, priest gold)
const CLASS_COL = { knight: 's5', rogue: 'copper', mage: 'arcane', priest: 'gold' };
function portrait(kind, x, y, o = {}) {
  const w = 22, h = 24, mat = o.selected ? M_LOOT : M_UMBER, cc = CLASS_COL[kind];
  if (!o.noShadow) shadowU(x, y, w, h, { k: 0.5, r: 3, dx: 1, dy: 2 });
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const d = Math.min(i - x, x + w - 1 - i, j - y, y + h - 1 - j); if (d > 1) continue;
    const tl = (i - x) + (j - y) < (x + w - 1 - i) + (y + h - 1 - j);
    if (d === 0 && cc) { const corner = (i === x || i === x + w - 1) && (j === y || j === y + h - 1); if (corner) putU(i, j, 0.02, mat); else putI(i, j, P[cc]); continue; }
    putU(i, j, d === 0 ? 0.02 : o.selected ? (tl ? 1 : 0.62) : (tl ? 0.8 : 0.3), mat);
  }
  const L = PORTRAIT_LIT[kind] || bakePortrait(kind);
  for (let j = 0; j < 20; j++) for (let i = 0; i < 18; i++) putI(x + 2 + i, y + 2 + j, L[j * 18 + i]);
  if (o.downed) for (let j = y + 2; j < y + h - 2; j++) for (let i = x + 2; i < x + w - 2; i++) if ((i + j) & 1) putI(i, j, P.void);
}
// party card mini-portrait: face crop 12x12 of the same art
function face(kind, x, y) {
  const L = PORTRAIT_LIT[kind] || bakePortrait(kind);
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) putI(x + i, y + j, L[(j + 4) * 18 + i + 3]);
}
