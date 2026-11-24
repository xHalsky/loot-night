// ===========================================================================
// Town kit, 16-bit: uneven coursed masonry, Voronoi cobbles, hip / front-gable / cone roofs with shingle courses,
// framed windows, arched doors, props and plants. Lit from the upper left (the moon). Casters write their shadow
// length into the layer's DX (via DXV) and castShadows() lays the moon shadows and contact shadows down.
// ===========================================================================

// ---------------------------------------------------------------- surface shaders: (x, y) -> value offset
// masonry: courses of uneven height, stones of uneven length; joints dark (partly worn), each stone lit on its
// top and left edge, shaded on its right
function masonry(x0, y0, w, h, sd, o = {}) {
  const hmin = o.hmin ?? 3, hmax = o.hmax ?? 4, lmin = o.lmin ?? 4, lmax = o.lmax ?? 8;
  const J = o.joint ?? 0.2, VAR = o.vary ?? 0.14, HI = o.hi ?? 0.12, BR = o.bridge ?? 0.15, PAD = 10, N = h + 2 * PAD;
  const rowOf = new Int16Array(N), rowK = new Int8Array(N), rows = [];
  for (let y = 0, r = 0; y < N; r++) {
    const rh = hmin + Math.floor(hash(r, 1, sd) * (hmax - hmin + 1)), br = [];
    let x = -Math.floor(hash(r, 2, sd) * lmax) - 2, k = 0;
    while (x <= w + lmax) { br.push(x); x += lmin + Math.floor(hash(r, 10 + k++, sd) * (lmax - lmin + 1)); }
    br.push(x); rows.push({ rh, br });
    for (let k2 = 0; k2 < rh && y < N; k2++, y++) { rowOf[y] = r; rowK[y] = k2; }
  }
  return (x, y) => {
    const ly = Math.max(0, Math.min(N - 1, y - y0 + PAD)), lx = x - x0, r = rowOf[ly], k = rowK[ly], R = rows[r];
    let s = 0; while (s + 2 < R.br.length && R.br[s + 1] <= lx) s++;
    const a = R.br[s], b = R.br[s + 1];
    if (k === 0 || lx === a) return hash(x, y, sd + 7) < BR ? -J * 0.45 : -J;
    let d = (hash(r, s * 7 + 3, sd) - 0.5) * VAR;
    if (k === 1) d += HI; else if (k === R.rh - 1 && R.rh > 2) d -= HI * 0.4;
    if (lx === a + 1) d += HI * 0.45; else if (lx === b - 1) d -= HI * 0.6;
    return d;
  };
}
// slate / wood shingles: courses ch tall, tiles tw wide, staggered; a shadow under each course, odd tiles broken
function shingles(sd, o = {}) {
  const ch = o.ch ?? 3, tw = o.tw ?? 4, S = o.shadow ?? 0.13, VAR = o.vary ?? 0.05;
  return (x, y) => {
    const r = Math.floor(y / ch), k = y - r * ch, off = (r * 2 + Math.floor(hash(r, 0, sd) * 2)) % tw, c = Math.floor((x + off) / tw), lx = x + off - c * tw;
    let d = (hash(c, r, sd + 1) - 0.5) * VAR;
    const t = hash(c, r, sd + 2); if (t < 0.025) d -= 0.14; else if (t > 0.975) d += 0.08;
    if (k === ch - 1) d -= S; else if (k === 0) d += S * 0.45;
    if (lx === 0 && k > 0) d -= S * 0.45;
    return d;
  };
}
// clay barrel tiles: rounded columns, overlapping every 4 rows
function clayTiles(sd) {
  return (x, y) => {
    const c = Math.floor(x / 3), lx = x - c * 3, r = Math.floor(y / 4), k = y - r * 4;
    let d = [0.13, 0.03, -0.15][lx] + (hash(c, r, sd) - 0.5) * 0.08;
    if (k === 3) d -= 0.1; else if (k === 0) d += 0.04;
    if (hash(c, r, sd + 1) < 0.03) d -= 0.14;
    return d;
  };
}
// thatch: long straw streaks, a shadow band at each layer
function thatch(sd) { return (x, y) => 0.13 * (vnoise(x * 0.75, y * 0.16, sd) - 0.5) * 2 + (y % 5 === 4 ? -0.09 : y % 5 === 0 ? 0.04 : 0); }
// fish-scale slates (the appraiser's spire)
function scales(sd) {
  return (x, y) => {
    const r = Math.floor(y / 2), k = y & 1, off = r & 1 ? 1 : 0, c = Math.floor((x + off) / 3), lx = x + off - c * 3;
    let d = (hash(c, r, sd) - 0.5) * 0.08;
    if (k === 1 && lx !== 1) d -= 0.15; else if (k === 0 && lx === 0) d += 0.08;
    return d;
  };
}
// horizontal clapboard
function clapboard(sd, bh = 3) {
  return (x, y) => {
    const r = Math.floor(y / bh), k = y - r * bh, off = Math.floor(hash(r, 0, sd) * 9), len = 8 + Math.floor(hash(r, 1, sd) * 6);
    let d = (hash(r, Math.floor((x + off) / len), sd) - 0.5) * 0.08 + 0.06 * (vnoise(x * 0.35, y * 1.6, sd) - 0.5);
    if (k === 0) d += 0.08; if (k === bh - 1) d -= 0.14; if ((x + off) % len === 0) d -= 0.1;
    return d;
  };
}
// vertical boards (doors, sheds)
function vplanks(sd, bw = 2) {
  return (x, y) => { const c = Math.floor(x / bw), k = x - c * bw; let d = (hash(c, 0, sd) - 0.5) * 0.1 + 0.05 * (vnoise(x * 1.5, y * 0.3, sd) - 0.5); if (k === 0) d += 0.05; if (k === bw - 1) d -= 0.11; return d; };
}
// lime plaster: blotchy, grainy
function plaster(sd) { return (x, y) => 0.07 * (fbm(x * 0.16, y * 0.16, sd) - 0.5); }

// ---------------------------------------------------------------- Voronoi cells (cobbles, rock, flagstones)
let VF1 = 0, VF2 = 0, VDX = 0, VDY = 0, VID = 0;
function vcell(x, y, cw, ch, sd) {
  const gx = Math.floor(x / cw), gy = Math.floor(y / ch); VF1 = VF2 = 1e9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j, px = (cx + 0.2 + 0.6 * hash(cx, cy, sd)) * cw, py = (cy + 0.2 + 0.6 * hash(cx, cy, sd + 1)) * ch;
    const dx = (x + 0.5 - px) / cw, dy = (y + 0.5 - py) / ch, d = Math.sqrt(dx * dx + dy * dy);
    if (d < VF1) { VF2 = VF1; VF1 = d; VDX = dx; VDY = dy; VID = cx * 7919 + cy * 104729; } else if (d < VF2) VF2 = d;
  }
}
// rounded cobble: dark gaps, each stone lit on its upper left; returns -1 in a gap
function cobbleV(x, y, base = 0.34, cw = 6, ch = 4, sd = 31) {
  vcell(x, y, cw, ch, sd);
  const e = VF2 - VF1; if (e < 0.13) return -1;
  return base + 0.07 * (hash(VID, 0, sd) - 0.5) - 0.16 * (VDX + VDY) - (e < 0.26 ? 0.04 : 0);
}
// boulders for cliffs and rubble
function rockV(x, y, base = 0.26, cw = 9, ch = 6, sd = 61) {
  vcell(x, y, cw, ch, sd);
  const e = VF2 - VF1; if (e < 0.1) return base * 0.25;
  return base + 0.12 * (hash(VID, 0, sd) - 0.5) - 0.3 * (VDX + VDY) - (e < 0.22 ? 0.07 : 0);
}
// grass: broad light and dark patches, and tufts placed one per cell at most (no per-pixel noise: without dither it
// would read as salt and pepper)
function grassV(x, y) {
  let v = 0.3 + 0.12 * (fbm(x * 0.06, y * 0.06, 21) - 0.5) + 0.05 * (fbm(x * 0.18, y * 0.18, 23) - 0.5);
  const cx = Math.floor(x / 5), cy = Math.floor(y / 4);
  if (hash(cx, cy, 26) < 0.42) {
    const dx = x - (cx * 5 + 1 + Math.floor(hash(cx, cy, 24) * 3)), dy = y - (cy * 4 + Math.floor(hash(cx, cy, 25) * 2));
    if (dx === 0 && dy === 0) v += 0.13; else if (Math.abs(dx) === 1 && dy === 1) v += 0.08; else if (dx === 0 && dy === 1) v -= 0.04; else if (dx === 0 && dy === 2) v -= 0.08;
  }
  return v;
}
// dirt: broad patches, a pebble in some cells (lit top, shadow under)
function dirtV(x, y, base = 0.3) {
  let v = base + 0.08 * (fbm(x * 0.12, y * 0.12, 22) - 0.5);
  const cx = Math.floor(x / 4), cy = Math.floor(y / 3);
  if (hash(cx, cy, 27) < 0.22) { const dx = x - (cx * 4 + 1 + Math.floor(hash(cx, cy, 28) * 2)), dy = y - cy * 3; if (dy === 0 && (dx === 0 || dx === 1)) v += dx ? 0.06 : 0.12; else if (dy === 1 && dx === 0) v -= 0.08; }
  return v;
}

// ---------------------------------------------------------------- walls
function facade(x0, y0, w, h, o = {}) {
  const mat = o.mat ?? M_STONE, base = o.v ?? 0.4, sd = o.sd ?? ((x0 * 31 + y0 * 17) & 1023);
  const tex = o.tex ?? masonry(x0, y0, w, h, sd, o.m || {}), eave = o.eave ?? 2, pl = o.plinth ?? (o.tex ? 3 : 2);
  const pMat = o.tex ? M_STONE : mat, pBase = o.tex ? 0.34 : base - 0.05;
  const plinth = pl ? masonry(x0, y0 + h - pl, w, pl, sd + 5, { hmin: pl + 1, hmax: pl + 1, lmin: 4, lmax: 8, hi: 0.1 }) : null;
  const side = o.side ?? 0.09;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const ty = y - y0, by = y0 + h - 1 - y;
    let v, m = mat;
    if (plinth && by < pl) { v = pBase + plinth(x, y - 1); m = pMat; } else v = base + tex(x, y);
    v -= side * (x - x0) / w;
    const st = fbm(x * 0.55, y * 0.05, sd + 3); if (st > 0.62) v -= (st - 0.62) * 0.55;      // rain streaks
    if (ty < eave) v *= ty === 0 ? 0.42 : 0.68;                                             // under the eave
    if (by < 3) v *= 1 - (3 - by) * 0.055;                                                  // ground contact
    if (o.moss !== false && by < 1 + 3 * fbm(x * 0.2, y0, sd + 9) && fbm(x * 0.4, y * 0.4, sd + 4) > 0.58) { m = M_MOSS; v = 0.26 + 0.12 * hash(x >> 1, y >> 1, sd); }
    put(x, y, v, m, 0);
  }
  if (o.quoins !== false) quoins(x0, y0 + eave, w, h - eave - (pl || 0), o.quoinMat ?? (o.tex ? M_STONE : mat), (o.tex ? 0.5 : base + 0.08), sd);
}
// dressed corner stones, long and short in turn, the long ones standing a pixel proud of the wall
function quoins(x0, y0, w, h, mat, v, sd) {
  for (const side of [0, 1]) {
    for (let y = y0, k = 0; y < y0 + h; k++) {
      const bh = 3, long = (k + side) & 1, bw = long ? 3 : 2;
      for (let j = 0; j < bh && y + j < y0 + h; j++) for (let i = -(long ? 1 : 0); i < bw; i++) {
        const x = side ? x0 + w - 1 - i : x0 + i, edge = j === bh - 1;
        let q = v + (hash(k, side, sd) - 0.5) * 0.08 + (j === 0 ? 0.08 : 0) - (edge ? 0.2 : 0) - (side ? 0.1 : 0) - (i === bw - 1 ? 0.05 : 0);
        if (i < 0) q -= 0.1;
        put(x, y + j, q, mat, 0);
      }
      y += bh;
    }
  }
}
// half-timbering over plaster: posts, a rail, braces in alternate panels
function timber(x0, y0, w, h, o = {}) {
  const step = o.step ?? 8, rails = o.rails ?? [0, h - 1], v = o.v ?? 0.22;
  const beam = (x, y, lit) => put(x, y, (lit ? v + 0.1 : v), M_UMBER, 0);
  for (const r of rails) for (let x = x0; x < x0 + w; x++) beam(x, y0 + r, r === rails[0]);
  const posts = []; for (let x = x0; x < x0 + w; x += step) posts.push(x); posts.push(x0 + w - 2);
  for (const px of posts) for (let y = y0; y < y0 + h; y++) { beam(px, y, true); beam(px + 1, y, false); }
  if (o.braces !== false) posts.forEach((px, k) => {
    if (k === posts.length - 1 || k % 2) return; const nx = posts[k + 1]; if (!nx || nx - px < 5) return;
    for (const [a, b] of (o.cross ? [[0, 1], [1, 0]] : [[0, 1]])) line(px + 2, y0 + 1 + (h - 3) * a, nx - 1, y0 + 1 + (h - 3) * b, v + 0.04, M_UMBER, 0);
  });
}
// ivy climbing a wall from the ground
function ivy(x, yBase, w, hgt, sd = 5) {
  for (let y = yBase - hgt; y <= yBase; y++) for (let i = -w; i <= w; i++) {
    const q = (yBase - y) / hgt, n = fbm((x + i) * 0.45, y * 0.45, sd), reach = w * (1 - q * 0.75) * (0.6 + n);
    if (Math.abs(i) > reach || n < 0.35 + q * 0.25) continue;
    const leaf = hash(x + i, y, sd); put(x + i, y, leaf > 0.7 ? 0.42 : leaf > 0.3 ? 0.28 : 0.14, M_MOSS, 0);
  }
}

// ---------------------------------------------------------------- roofs
// hip roof seen steeply from the south: back slope, ridge, front slope, and the two hip ends; the lit west hip,
// the dark east hip; shingle courses; a ragged eave
function hipRoof(x0, y0, w, h, o = {}) {
  const mat = o.mat ?? M_STONE, base = o.v ?? 0.3, x1 = x0 + w - 1, yb = y0 + h - 1, sd = o.sd ?? ((x0 * 13 + y0 * 7) & 1023);
  const yr = y0 + Math.max(1, Math.round(h * (o.back ?? 0.34))), ri = o.ri ?? Math.max(2, Math.min(Math.floor(w / 2) - 3, Math.round(h * 0.75)));
  const tex = o.tex || shingles(sd, o.sh || {});
  const SH = [0.26, 0.2, -0.17, 0.15, 0];
  for (let y = y0; y <= yb; y++) {
    const bl = y <= yr ? x0 + (ri * (y - y0)) / Math.max(1, yr - y0) : x0 + (ri * (yb - y)) / Math.max(1, yb - yr), br = x1 - (bl - x0);
    for (let x = x0; x <= x1; x++) {
      if (y === y0 && (x === x0 || x === x1)) continue;                       // soften the back corners
      if (o.round) {                                                           // rounded (thatch) corners
        const rx = Math.min(x - x0, x1 - x), [rt, rb] = o.round;
        if (yb - y < rb && rx < rb && Math.hypot(rb - rx - 0.5, rb - (yb - y) - 0.5) > rb) continue;
        if (y - y0 < rt && rx < rt && Math.hypot(rt - rx - 0.5, rt - (y - y0) - 0.5) > rt) continue;
      }
      const pl = x < bl - 0.5 ? 1 : x > br + 0.5 ? 2 : y < yr ? 3 : y === yr ? 0 : 4;
      let v = base + SH[pl], m = mat;
      if (pl === 0) v += ((x - x0) % 3 === 0 ? -0.07 : 0.02);
      else if (pl === 1 || pl === 2) v += 0.7 * tex(pl === 1 ? y + 50 : 200 - y, pl === 1 ? x0 + 99 - x : x + 31, pl);  // hip ends: courses run along their (vertical) eaves
      else v += tex(x, y, pl);
      if (pl && (Math.abs(x - bl) < 0.75 || Math.abs(x - br) < 0.75)) v = base + (x < (x0 + x1) / 2 ? 0.3 : 0.06);  // hip caps
      if (y === y0) v += 0.06;
      if (o.lip) { const ey = o.round && Math.min(x - x0, x1 - x) < o.round[1] ? yb - (o.round[1] - Math.sqrt(Math.max(0, o.round[1] ** 2 - (o.round[1] - Math.min(x - x0, x1 - x) - 0.5) ** 2))) : yb; if (y > ey - o.lip && y <= ey - 1) v += 0.13; if (y > ey - 1) v -= 0.22; }
      else if (y === yb) v -= 0.16;
      v += 0.06 * (fbm(x * 0.1, y * 0.16, sd + 1) - 0.5);
      if (o.soot) v -= o.soot * clamp((fbm(x * 0.18, y * 0.25, sd + 3) - 0.45) * 3);
      if (o.moss && (pl === 4 || pl === 1) && y > yr + 1 && fbm(x * 0.25, y * 0.3, sd + 2) > 1 - o.moss) { m = M_MOSS; v = 0.26 + 0.1 * hash(x >> 1, y >> 1, sd); }
      put(x, y, v, m, 0);
    }
  }
  // ragged eave: tile tips hanging a pixel low
  if (!o.round) for (let x = x0 + 1; x < x1; x++) if (hash(x >> 1, yb, sd + 4) < 0.4) put(x, yb + 1, base * 0.55, mat, 0);
  return { yr, ri };
}
// front-gable roof (ridge running away from the viewer): two slopes split by the ridge, a V of bargeboards
// over the gable wall. The gable wall itself is drawn by facade() beforehand.
function frontGable(x0, y0, w, h, gh, o = {}) {
  const mat = o.mat ?? M_STONE, base = o.v ?? 0.3, cx = x0 + (w - 1) / 2, hw = w / 2, sd = o.sd ?? ((x0 * 11 + y0 * 5) & 1023);
  const ch = 2, tw = o.tw ?? 4;
  for (let x = x0; x < x0 + w; x++) {
    const ax = Math.abs(x - cx), bot = y0 + h + (gh * ax) / hw;
    for (let y = y0; y < bot; y++) {
      const c = Math.floor(ax / ch), k = Math.floor(ax) - c * ch, r = Math.floor((y + c * 2) / tw), ly = y + c * 2 - r * tw;
      let v = base + (x < cx ? 0.07 : -0.09) + (hash(c, r, sd) - 0.5) * 0.1;
      if (k === ch - 1) v -= 0.13; if (ly === 0) v -= 0.06;
      if (ax < 0.6) v = base + 0.2;                                       // ridge
      if (bot - y < 1.6) v = base + (x < cx ? 0.24 : 0.04);               // bargeboard
      v += 0.07 * (fbm(x * 0.15, y * 0.2, sd + 1) - 0.5);
      if (y === y0 && ax > hw - 1.5) continue;
      put(x, y, v, mat, 0);
    }
  }
  if (o.shade) for (let x = x0; x < x0 + w; x++) { const b = Math.ceil(y0 + h + (gh * Math.abs(x - cx)) / hw); for (const [d, f] of [[0, 0.45], [1, 0.7]]) { const yy = b + d; if (yy >= 0 && yy < BH && x >= 0 && x < BW) B.V[yy * BW + x] *= f; } }
  if (o.finial) { put(Math.round(cx), y0 + h - 1, 0.7, M_STONE, 0); put(Math.round(cx), y0 + h - 2, 0.6, M_STONE, 0); }
}
// cone roof over a round tower, fish-scale slates in courses that curve around it
function coneRoof(cx, y0, h, r, o = {}) {
  const mat = o.mat ?? M_DUSK, base = o.v ?? 0.32, tex = o.tex || scales(o.sd ?? 17), ry = o.ry ?? 2.5;
  for (let y = y0; y <= y0 + h + ry; y++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
    const u = (x + 0.5 - cx) / r; if (Math.abs(u) > 1) continue;
    const bot = y0 + h + ry * Math.sqrt(1 - u * u), hwy = r * clamp((y - y0) / h);
    if (y > bot || Math.abs(x + 0.5 - cx) > hwy + 0.5) continue;
    const curve = Math.round(ry * Math.sqrt(1 - u * u) * clamp((y - y0) / h));
    const lam = Math.max(0, -0.62 * u + 0.78 * Math.sqrt(1 - u * u));
    let v = base * (0.5 + 0.75 * lam) + tex(x, y - curve) * (0.6 + 0.6 * lam);
    if (bot - y < 1) v -= 0.1;
    put(x, y, v, mat, 0);
  }
}
// a dormer on a roof slope: little front-gable roof over a window
function dormer(x, y, o = {}) {
  const mat = o.mat ?? M_STONE, v = o.v ?? 0.3;
  const rows = [[2, 4], [1, 5], [0, 6], [0, 6]];
  rows.forEach(([a, b], j) => { for (let i = a; i <= b; i++) put(x + i, y + j, j === 3 ? v - 0.12 : i < 3 ? v + 0.12 : i === 3 ? v + 0.2 : v - 0.06, mat, 0); });
  for (let j = 4; j <= 6; j++) for (let i = 1; i <= 5; i++) put(x + i, y + j, (j === 4 ? 0.3 : 0.5) - (i === 5 ? 0.12 : 0), o.wall ?? M_UMBER, 0);
  if (o.lit) { put(x + 2, y + 5, 0.82, M_LOOT, 1); put(x + 3, y + 5, 0.92, M_LOOT, 1); put(x + 2, y + 6, 0.9, M_LOOT, 1); put(x + 3, y + 6, 0.86, M_LOOT, 1); }
  else for (let j = 5; j <= 6; j++) for (let i = 2; i <= 3; i++) put(x + i, y + j, i === 2 && j === 5 ? 0.38 : 0.08, M_STONE, 0);
  put(x + 4, y + 5, 0.14, M_STONE, 0); put(x + 4, y + 6, 0.14, M_STONE, 0);
}
function chimney16(x, y, w = 4, h = 7, o = {}) {
  const tex = masonry(x, y, w, h, x * 3 + y, { hmin: 2, hmax: 3, lmin: 2, lmax: 3, joint: 0.17, hi: 0.1 }), mat = o.mat ?? M_STONE, b = o.v ?? 0.48;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, b + tex(x + i, y + j) - (0.16 * i) / w + (i === 0 ? 0.06 : 0) - (o.soot ? 0.12 * clamp(1 - j / 4) : 0), mat, 0);
  for (let i = -1; i <= w; i++) put(x + i, y, 0.54 - (0.14 * (i + 1)) / (w + 1), mat, 0);
  for (let i = 0; i < w; i++) put(x + i, y - 1, i === 0 ? 0.5 : i === w - 1 ? 0.36 : 0.05, mat, 0);
  return [x + (w >> 1), y - 2];
}

// ---------------------------------------------------------------- openings
// window: dressed surround, lintel, a sill with a shadow under it, mullions; lit glass is emissive
function win16(x, y, w, h, o = {}) {
  const lit = o.lit ?? true, gm = o.glass ?? M_LOOT, fm = o.frame ?? M_STONE, fv = o.fv ?? 0.52;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    if (j >= 0 && j < h && i >= 0 && i < w) continue;
    if (o.arch && j === -1 && (i === -1 || i === w)) continue;
    put(x + i, y + j, fv + (i < 0 || j < 0 ? 0.08 : -0.14), fm, 0);
  }
  if (o.lintel !== false && !o.arch) for (let i = -2; i <= w + 1; i++) put(x + i, y - 2, fv + 0.1 - (i > w ? 0.14 : 0), fm, 0);
  if (o.sill !== false) for (let i = -2; i <= w + 1; i++) { put(x + i, y + h + 1, fv + 0.12 - (i > w ? 0.14 : 0), fm, 0); put(x + i, y + h + 2, 0.1, M_STONE, 0); }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (o.arch && j === 0 && (i === 0 || i === w - 1)) { put(x + i, y + j, fv, fm, 0); continue; }
    const mull = o.cross ? (i === w >> 1 || j === h >> 1) : (j === 1 && h >= 4) || (w >= 5 && i === w >> 1);
    if (mull && !o.noMull) put(x + i, y + j, 0.16, M_UMBER, 0);
    else if (lit) put(x + i, y + j, (j === 0 ? 0.66 : 0.9) - (i === 0 && j > 1 ? 0.2 : 0) - (i === w - 1 ? 0.08 : 0), gm, 1);
    else put(x + i, y + j, i === 0 && j === 0 ? 0.4 : j === 0 ? 0.16 : 0.07, M_STONE, 0);
  }
  if (o.shutters != null) for (let j = -1; j <= h; j++) for (const [sx, d] of [[x - 3, 0.04], [x - 2, -0.04], [x + w + 1, -0.02], [x + w + 2, -0.12]]) put(sx, y + j, 0.4 + d + (j === -1 || j === h ? -0.1 : 0) + (j === (h >> 1) ? -0.08 : 0), o.shutters, 0);
  if (o.box) flowerBox(x - 1, y + h + 1, w + 2, o.box);
}
function flowerBox(x, y, w, mats = [M_DANGER, M_LOOT]) {
  for (let i = 0; i < w; i++) { put(x + i, y + 1, 0.42, M_UMBER, 0); put(x + i, y + 2, 0.26, M_UMBER, 0); put(x + i, y + 3, 0.1, M_STONE, 0); }
  for (let i = 0; i < w; i++) { const h = hash(x + i, y, 9); put(x + i, y, h > 0.45 ? 0.8 : 0.36, h > 0.45 ? mats[Math.floor(h * 7) % mats.length] : M_MOSS, 0); if (h > 0.7) put(x + i, y - 1, 0.32, M_MOSS, 0); }
}
// door: arched opening in a ring of voussoirs, boards, iron straps, a step
function door16(x, y, w, h, o = {}) {
  const r = o.arch === false ? 0 : w / 2, open = o.open, fm = o.frame ?? M_STONE, fv = o.fv ?? 0.52, wood = vplanks(x + y, 2);
  const inside = (i, j) => { if (i < 0 || i >= w || j >= h) return false; if (j >= r) return j >= 0; const dy = r - j - 0.5, hw = Math.sqrt(Math.max(0, r * r - dy * dy)); return Math.abs(i + 0.5 - w / 2) < hw + 0.3; };
  for (let j = -2; j < h; j++) for (let i = -2; i < w + 2; i++) {
    if (inside(i, j)) {
      if (open) put(x + i, y + j, (j < 1 ? 0.62 : 0.88) - (i === 0 ? 0.2 : 0), M_LOOT, 1);
      else { let v = 0.34 + wood(x + i, y + j); if (j === Math.round(h * 0.28) || j === Math.round(h * 0.72)) v = 0.48 - (i === w - 1 ? 0.1 : 0); put(x + i, y + j, v, j === Math.round(h * 0.28) || j === Math.round(h * 0.72) ? M_STONE : M_UMBER, 0); }
      continue;
    }
    let near = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]]) if (inside(i + a, j + b)) near = true;
    if (near) put(x + i, y + j, fv + (i < w / 2 ? 0.08 : -0.12) - ((i + j) % 3 === 0 ? 0.1 : 0), fm, 0);
  }
  if (!open) put(x + w - 2, y + Math.round(h * 0.55), 0.85, M_LOOT, 0);
  if (o.step !== false) for (let i = -2; i < w + 2; i++) { put(x + i, y + h, 0.6 - (i > w ? 0.12 : 0), M_STONE, 0); put(x + i, y + h + 1, 0.3, M_STONE, 0); }
}

// ---------------------------------------------------------------- props
function barrel(x, y, o = {}) {
  const m = o.mat ?? M_UMBER, col = [0.46, 0.56, 0.48, 0.36, 0.24];
  for (let i = 1; i < 4; i++) put(x + i, y, 0.6 - i * 0.04, m, 0);
  for (let i = 0; i < 5; i++) put(x + i, y + 1, i === 0 || i === 4 ? 0.42 : o.water ? 0.2 : 0.34, o.water && i && i < 4 ? M_STONE : m, o.water && i === 1 ? 1 : 0);
  for (let j = 2; j < 7; j++) for (let i = 0; i < 5; i++) {
    if (j === 6 && (i === 0 || i === 4)) continue;
    const hoop = j === 2 || j === 5;
    put(x + i, y + j, col[i] + (hoop ? 0.06 : 0) - (j === 6 ? 0.12 : 0), hoop ? M_STONE : m, 0);
  }
}
function barrelSide(x, y) { // lying down: round end facing the viewer
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const d = Math.hypot(i - 2, j - 2); if (d > 2.5) continue; put(x + i, y + j, d > 1.6 ? 0.5 - (i + j) * 0.04 : d < 0.8 ? 0.26 : 0.38, d > 1.6 ? M_STONE : M_UMBER, 0); }
}
function crate(x, y, w = 5, h = 5, o = {}) {
  const m = o.mat ?? M_UMBER;
  for (let i = 0; i < w; i++) { put(x + i, y, 0.66 - (i / w) * 0.1, m, 0); put(x + i, y + 1, 0.56 - (i / w) * 0.1, m, 0); }
  for (let j = 2; j < h; j++) for (let i = 0; i < w; i++) {
    const frame = i === 0 || i === w - 1 || j === 2 || j === h - 1, brace = Math.abs((i - 0.5) / (w - 1) - (j - 2) / (h - 3)) < 0.18;
    put(x + i, y + j, frame || brace ? 0.5 - (i === w - 1 ? 0.12 : 0) : 0.3, m, 0);
  }
}
function sack(x, y, o = {}) {
  const rows = ['.oo.', 'oooo', 'oooo', '.oo.'];
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'o') put(x + i, y + j + 1, 0.72 - (i + j) * 0.07, o.mat ?? M_UMBER, 0); }));
  put(x + 1, y, 0.5, M_UMBER, 0); put(x + 2, y, 0.4, M_UMBER, 0);
}
function pot(x, y, o = {}) {
  const m = o.mat ?? M_UMBER;
  for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) { if ((j === 0 || j === 4) && (i === 0 || i === 3)) continue; put(x + i, y + j, j === 0 ? 0.18 : 0.62 - i * 0.12 - (j === 4 ? 0.12 : 0), m, 0); }
  if (o.plant) { put(x + 1, y - 1, 0.42, M_MOSS, 0); put(x + 2, y - 2, 0.36, M_MOSS, 0); put(x, y - 2, 0.3, M_MOSS, 0); put(x + 3, y - 1, 0.26, M_MOSS, 0); put(x + 1, y - 3, o.plant === true ? 0.32 : 0.8, o.plant === true ? M_MOSS : o.plant, 0); }
}
// round stack of logs, ends facing the viewer
function woodpile(x, y, w, h) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const cx = Math.floor(i / 2), cy = Math.floor(j / 2), e = (i & 1) + (j & 1); put(x + i, y + j, e === 0 ? 0.66 : e === 2 ? 0.22 : 0.48 + 0.06 * hash(cx, cy, 4), M_UMBER, 0); }
}
// 3D block: lit top face, darker front face
function block(x, y, w, h, top = 2, o = {}) {
  const m = o.mat ?? M_STONE, b = o.v ?? 0.5;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, (j < top ? b + 0.12 - (j ? 0.04 : 0) : b - 0.12 - (j === h - 1 ? 0.08 : 0)) - (i === w - 1 ? 0.08 : 0) + (i === 0 ? 0.04 : 0) + 0.04 * (hash(x + i, y + j, 2) - 0.5), m, 0);
}
function bench(x, y, w) { for (let i = 0; i < w; i++) { put(x + i, y, 0.62 - (i / w) * 0.12, M_UMBER, 0); put(x + i, y + 1, 0.32, M_UMBER, 0); } put(x + 1, y + 2, 0.24, M_UMBER, 0); put(x + w - 2, y + 2, 0.24, M_UMBER, 0); }

// ---------------------------------------------------------------- plants
// clumpy shrub: ragged outline, leaf clusters lit on the upper left, dark underside
function bush(cx, cy, rx, ry, sd = 1, o = {}) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy, n = 0.45 * (vnoise(x * 0.8, y * 0.8, sd) - 0.5);
    if (d > 1 + n) continue;
    let v = (o.v ?? 0.34) - 0.14 * (dx + dy) + 0.03;
    const c = hash(x >> 1, y >> 1, sd + 3), lx = x & 1, ly = y & 1;
    if (c > 0.45) v += lx === 0 && ly === 0 ? 0.16 : lx && ly ? -0.1 : 0.04;
    if (d > 0.62 && dy > 0.2) v -= 0.14;
    if (o.flowers && hash(x, y, sd + 7) > 0.88 && dy < 0.4) { put(x, y, 0.82, o.flowers, 0); continue; }
    put(x, y, v, M_MOSS, 0);
  }
}
// cypress: a tall flame of dark foliage
function cypress(cx, by, h, hw = 3, sd = 2) {
  for (let y = by - h; y <= by; y++) {
    const t = (y - (by - h)) / h, w = hw * (t < 0.3 ? Math.sqrt(t / 0.3) : 1 - ((t - 0.3) / 0.7) ** 2 * 0.45);
    for (let x = Math.floor(cx - w - 1); x <= Math.ceil(cx + w); x++) {
      const dx = (x + 0.5 - cx) / Math.max(0.6, w); if (Math.abs(dx) > 1 + 0.25 * (vnoise(x * 0.9, y * 0.9, sd) - 0.5)) continue;
      let v = 0.32 - 0.16 * dx - 0.06 * t; const c = hash(x >> 1, y >> 1, sd), lx = x & 1, ly = y & 1;
      if (c > 0.45) v += lx === 0 && ly === 0 ? 0.14 : lx && ly ? -0.1 : 0.03;
      put(x, y, v, M_MOSS, 0);
    }
  }
  put(cx, by + 1, 0.2, M_UMBER, 0);
}
// broad tree: three or four canopy lobes over a short trunk
function tree(cx, by, r, sd = 3) {
  for (let j = 0; j < 4; j++) put(cx, by - j, 0.3 - (j ? 0 : 0.1), M_UMBER, 0), put(cx + 1, by - j, 0.18, M_UMBER, 0);
  const lobes = [[0, -r * 1.1, r], [-r * 0.6, -r * 0.6, r * 0.75], [r * 0.6, -r * 0.55, r * 0.75], [0, -r * 1.7, r * 0.7]];
  for (const [ox, oy, rr] of lobes) bush(cx + ox, by - 3 + oy, rr, rr * 0.85, sd + ox, { v: 0.22 });
}
function hedge(x, y, w, h, sd = 4) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const n = vnoise((x + i) * 0.7, (y + j) * 0.7, sd); if ((j === 0 || i === 0 || i === w - 1) && n < 0.4) continue;
    let v = j < 2 ? 0.34 : 0.2; const c = hash((x + i) >> 1, (y + j) >> 1, sd); if (c > 0.55) v += (i & 1) === 0 && (j & 1) === 0 ? 0.1 : -0.03;
    if (j === h - 1) v -= 0.08; v -= (0.08 * i) / w;
    put(x + i, y + j, v, M_MOSS, 0);
  }
}
function tufts(x0, y0, w, h, n, sd = 6) {
  for (let k = 0; k < n; k++) { const x = x0 + Math.floor(hash(k, 1, sd) * w), y = y0 + Math.floor(hash(k, 2, sd) * h); put(x, y, 0.34, M_MOSS, 0); put(x - 1, y + 1, 0.28, M_MOSS, 0); put(x + 1, y + 1, 0.24, M_MOSS, 0); put(x, y + 1, 0.14, M_MOSS, 0); }
}
// picket fence along a row: pointed pickets, two rails
function picket(x0, x1, y, o = {}) {
  const m = o.mat ?? M_UMBER, b = o.v ?? 0.6;
  for (let x = x0; x <= x1; x++) { put(x, y + 1, b - 0.1, m, 0); put(x, y + 3, b - 0.16, m, 0); }
  for (let x = x0; x <= x1; x += 2) { put(x, y - 1, b + 0.08, m, 0); for (let j = 0; j < 5; j++) put(x, y + j, b - (j === 4 ? 0.2 : 0) + (j === 0 ? 0.04 : 0), m, 0); }
}
// low dry-stone wall with cap stones
function lowWall(x0, y0, w, o = {}) {
  const tex = masonry(x0, y0, w, 4, x0 + y0, { hmin: 2, hmax: 2, lmin: 3, lmax: 5, joint: 0.18 });
  for (let x = x0; x < x0 + w; x++) { put(x, y0, 0.56 + 0.06 * (hash(x >> 2, y0, 1) - 0.5), M_STONE, 0); for (let j = 1; j < 4; j++) put(x, y0 + j, 0.34 + tex(x, y0 + j) - (j === 3 ? 0.06 : 0), M_STONE, 0); }
}

// ---------------------------------------------------------------- moon shadows + contact shadows on the ground
function castShadows(L, S = 16, k = 0.6) {
  const D = L.DX, V = L.V;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (D[i] || L.E[i]) continue;
    let f = 1;
    for (let s = 1; s <= S; s++) { const xx = x - s, yy = y - (s >> 1); if (xx < 0 || yy < 0) break; if (D[yy * W + xx] >= s) { f = s >= D[yy * W + xx] - 1 && (x + y) & 1 ? k + 0.22 : k; break; } }
    if (y > 0 && D[i - W]) f *= 0.66; else if (y > 1 && D[i - 2 * W]) f *= 0.84;
    // a dark rim on the ground around every caster: the selective outline of 16-bit sprites
    if ((x > 0 && D[i - 1]) || (x < W - 1 && D[i + 1]) || (y < H - 1 && D[i + W]) || (y > 0 && D[i - W])) f *= 0.62;
    V[i] *= f;
  }
}
