// ---------------------------------------------------------------- lean in (fan-service steps 7 and 12, grid doc 7l)
// Hold the door open past LEAN_DELAY and the right screen becomes his view through the crack. One camera: his eye 3
// units (16 cm) behind the gap at your door's latch jamb, at seated height, aimed at the gap; the mouse moves his head
// (the eye slides along y), so the world beyond pans while the door stays put (parallax). The flat is the build's plan
// as Paweł approved it on 2026-11-20 (the bathroom behind the far-end door, the living room's corner open, the hall
// mirror on the left wall). Plan units: 1 u = 5.5 cm; heights in u (eye 21 = 1.15 m, doors 36, ceiling 47).
// What shows through the slit: her 16 PC-98 colours plus the desk's darks and greiges (as the webcam bake). The door's
// leaf and frame: the desk's Graphite. Nothing is scaled: every picture is drawn at its size for this camera.

const LEAN_LAST = { xl: 200, xr: 296 };   // the slit's edges in the last frame drawn (the coach marks point at them)
const LEAN = { f: 650, cx: 246, hy: 226, eyeZ: 21, d: 3, slit: [140, 88.4], W: 492, H: 360 };   // the gap's middle (the jamb at y 88)
// the lean's stops (the eye's y; x stays 143): 1 the kitchen, 2 the bathroom straight down the hallway, 3 the living
// room through the far opening and the arch, then the mirror at the far end of the lean
const LEAN_STOPS = [{ k: '1', y: 91.0, u: 0.1 }, { k: '2', y: 88.28, u: 0.38 }, { k: '3', y: 87.44, u: 0.64 }, { k: 'mirror', y: 86.8, u: 0.84 }, { k: '', y: 85.9, u: 1 }];
const LEAN_PAL = [...PC98, '#17191e', '#24272e', '#363b44', '#2b2723', '#433d37', '#625a51', '#8d8479', '#c9c3b8'];
const LEAN_RGB = LEAN_PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const LC = { ...C9, s1: 16, s2: 17, s3: 18, u2: 19, u3: 20, u4: 21, u5: 22, u6: 23 };
// material ramps, dark to light (PC-98: flat tones with a checker between)
const LM = {
  hallWall: [LC.void, LC.u2, LC.u3, LC.brown, LC.u4, LC.tan, LC.u5, LC.beige],
  wood: [LC.void, LC.u2, LC.plum, LC.brown, LC.u4, LC.tan],
  ceil: [LC.void, LC.u2, LC.u3, LC.u4, LC.u5],
  trim: [LC.void, LC.u2, LC.u4, LC.u5, LC.u6, LC.moon],
  bathWall: [LC.void, LC.s2, LC.purple, LC.lilac, LC.beige, LC.moon],
  bathFloor: [LC.void, LC.plum, LC.purple, LC.lilac, LC.moon],
  livWall: [LC.void, LC.plum, LC.purple, LC.lilac],
  bedWall: [LC.void, LC.plum, LC.purple, LC.denim, LC.lilac],
  kitWall: [LC.void, LC.u2, LC.u3, LC.u4, LC.u5, LC.u6],
  kitFloor: [LC.void, LC.s2, LC.s3, LC.u4, LC.u5],
  counter: [LC.void, LC.s2, LC.s3, LC.u5, LC.u6],
  cabinet: [LC.void, LC.plum, LC.brown, LC.tan, LC.beige],
  couch: [LC.void, LC.s2, LC.denim, LC.cyan],
  rug: [LC.void, LC.plum, LC.crimson, LC.rose, LC.pink],
  mat: [LC.void, LC.purple, LC.rose, LC.pink],
  runner: [LC.void, LC.plum, LC.crimson, LC.rose],
  tvbody: [LC.void, LC.s1, LC.s2, LC.s3],
  tub: [LC.void, LC.tan, LC.beige, LC.moon],
  foam: [LC.lilac, LC.beige, LC.moon, LC.moon],
  water: [LC.void, LC.denim, LC.cyan],
  ceramic: [LC.void, LC.u4, LC.beige, LC.moon],
  frosted: [LC.void, LC.purple, LC.lilac, LC.moon],
  fridge: [LC.void, LC.s3, LC.u5, LC.u6, LC.moon],
  door: [LC.void, LC.u2, LC.u4, LC.u5, LC.u6, LC.moon],
  shade: [LC.brown, LC.tan, LC.beige, LC.gold, LC.moon],
  mug: [LC.void, LC.crimson, LC.rose, LC.pink],
  steel: [LC.void, LC.s3, LC.u5, LC.moon],
  mirror: [LC.void, LC.s2, LC.denim, LC.cyan, LC.moon],
};
// rooms: what a point belongs to (for its walls, floor, ceiling and ambient light)
const LROOMS = [
  { n: 'hall', r: [70, 84, 140, 108], wall: 'hallWall', floor: 'wood', amb: 0.18 },
  { n: 'bath', r: [2, 56, 70, 100], wall: 'bathWall', floor: 'bathFloor', amb: 0.1 },
  { n: 'bed', r: [70, 2, 110, 84], wall: 'bedWall', floor: 'wood', amb: 0.04 }, { n: 'bed', r: [2, 2, 70, 56], wall: 'bedWall', floor: 'wood', amb: 0.04 },
  { n: 'kit', r: [110, 2, 198, 84], wall: 'kitWall', floor: 'kitFloor', amb: 0.16 },
  { n: 'liv', r: [2, 100, 70, 108], wall: 'livWall', floor: 'wood', amb: 0.12 }, { n: 'liv', r: [2, 108, 140, 198], wall: 'livWall', floor: 'wood', amb: 0.12 },
  { n: 'you', r: [140, 84, 198, 198], wall: 'hallWall', floor: 'wood', amb: 0.02 },
];
const roomAt = (x, y) => { for (const R of LROOMS) if (x >= R.r[0] && x <= R.r[2] && y >= R.r[1] && y <= R.r[3]) return R; return LROOMS[0]; };
// walls: [x0, y0, x1, y1, z0, z1]; full height unless a header over a doorway
const LWALLS = [
  [2, 2, 198, 2], [2, 2, 2, 198], [2, 198, 198, 198], [198, 2, 198, 198],
  [70, 84, 80, 84], [98, 84, 112, 84], [136, 84, 198, 84],            // the hallway's right wall: the bedroom door, the kitchen's opening
  [70, 56, 70, 85], [70, 99, 70, 101],                                // the far end: the bathroom's door 85..99, the living room 101..108
  [2, 100, 70, 100], [2, 56, 70, 56], [110, 2, 110, 84],
  [96, 108, 98, 108], [98, 108, 121, 108, 'mirror'], [121, 108, 140, 108],   // the left wall: the arch 70..96, the mirror 98..121
  [80, 84, 98, 84, 36, 47], [112, 84, 136, 84, 40, 47], [70, 85, 70, 99, 36, 47], [70, 101, 70, 108, 40, 47], [70, 108, 96, 108, 40, 47],
].map((w) => ({ a: [w[0], w[1]], b: [w[2], w[3]], z0: typeof w[4] === 'number' ? w[4] : 0, z1: typeof w[5] === 'number' ? w[5] : 47, mirror: w[4] === 'mirror' }));
const MIRROR = { x0: 98, x1: 121, y: 108, z0: 2, z1: 34 };
const LCEIL = 47;
// furniture: [x0, y0, x1, y1, z0, z1, material, opts]; the scene adds what the activity needs (lean state)
const LBOX = [
  [2, 127, 8, 153, 0, 9, 'tvbody'], [2, 129, 3.5, 150, 15, 28, 'tvbody', { tv: true }],
  [24, 130, 38, 156, 0, 8, 'couch'], [35, 130, 38, 156, 8, 16, 'couch'], [24, 130, 38, 132.5, 8, 12, 'couch'], [24, 153.5, 38, 156, 8, 12, 'couch'],
  [6, 103, 7, 104, 0, 29, 'steel'], [4.5, 101.5, 8.5, 105.5, 28, 33, 'shade', { glow: 0.85 }],
  [17, 104, 27, 128, 0, 0.3, 'mat'],
  [14, 88, 46, 89.5, 0, 10, 'tub'], [14, 98, 46, 99.5, 0, 10, 'tub'], [44.5, 88, 46, 99.5, 0, 10, 'tub'], [14, 88, 15.5, 99.5, 0, 10, 'tub'],
  [8, 56, 22, 61, 0, 14, 'cabinet'], [8, 56, 22, 62, 14, 16, 'ceramic'], [8, 56, 22, 56.6, 19, 31, 'mirror'],
  [52, 56, 70, 72, 0, 40, 'frosted'], [2, 72, 8, 80, 0, 8, 'ceramic'],
  [110, 48, 117, 83, 0, 16.5, 'cabinet', { top: 'counter' }], [110, 52, 115, 82, 30, 31, 'cabinet'],
  [118, 2, 132, 12, 0, 34, 'fridge'], [111.5, 61.5, 114.5, 64.5, 16.5, 20.5, 'steel'], [111, 66, 113, 68, 31, 33.2, 'mug'], [111, 69.5, 113, 71.5, 31, 33.2, 'mug'], [111, 76, 113, 78, 31, 33.2, 'mug'],
  [70, 60, 76, 78, 0, 15, 'cabinet'], [70, 60, 70.6, 78, 20, 32, 'mirror'],
  [103, 95, 107, 97, 45.5, 47, 'shade', { glow: 1 }],
].map((b) => ({ r: [b[0], b[1], b[2], b[3]], z0: b[4], z1: b[5], m: b[6], ...(b[7] || {}) }));
// floor overlays (material by area): the hallway runner, the living room's rug
const LFLOOR = [{ r: [74, 91, 136, 101], m: 'runner' }, { r: [12, 116, 56, 152], m: 'rug' }];

// what the activity puts in the scene: lights, the doors' angles, props, her
function leanScene(act, stage, o = {}) {
  const S = { act, stage, lights: [{ p: [104, 96, 44], c: 1.35, r: 42 }], boxes: [], doors: [], tv: null, steam: 0, foam: null, bowl: null, candles: null, wine: null };
  const k = [0.12, 0.5, 0.9][stage];
  // the bathroom's door slides into the wall north of it (a pocket door): ajar for her music during the bath, it
  // opens a gap from the north jamb, so the tub's foot end shows; open otherwise
  S.bathOpen = act === 'bath' ? 11 : act === 'shut' ? 0 : 14;   // shut: the shower, the toilet, a bath with the door shut (the game, #77)
  if (S.bathOpen < 14) S.boxes.push({ r: [69.6, 85 + S.bathOpen, 70.4, 99], z0: 0, z1: 36, m: 'door' });
  S.doors.push({ h: [98, 84], len: 18, ang: 84, dir: [-1, 0], swing: 1 });   // the bedroom's, open
  if (act === 'yoga' || act === 'couch') {
    S.lights.push({ p: [6.5, 103.5, 31], c: 0.75, r: 26 }, { p: [5, 140, 22], c: 0.55, r: 30, cool: true });
    S.tv = act === 'yoga' ? { kind: 'yoga', k } : { kind: stage === 2 ? 'credits' : 'film', k };
  }
  if (act === 'couch') S.bowl = [1, 0.5, 0][stage];
  if (act === 'bath') {
    S.lights.push({ p: [45.3, 94.5, 11.8], c: 0.9, r: 20 });
    S.foam = { level: [12.6, 10.3, 8.2][stage], k: [1, 0.55, 0.18][stage] }; S.candles = [2.6, 1.5, 0.5][stage]; S.wine = [0.85, 0.45, 0.06][stage];
  } else S.lights.push({ p: [36, 78, 46], c: act === 'mask' ? 0.85 : 0.35, r: 34 });
  if (act === 'kitchen') { S.lights.push({ p: [115, 66, 30], c: 1.2, r: 26 }); S.steam = [0.2, 0.6, 1][stage]; }
  else S.lights.push({ p: [115, 68, 30], c: 0.3, r: 26 });
  S.lights.push({ p: [73, 69, 19], c: 0.5, r: 18 });   // her bedside lamp, on the dresser
  if (S.foam) S.boxes.push({ r: [15.5, 89.5, 44.5, 98], z0: 0, z1: S.foam.level, m: S.foam.k > 0.3 ? 'foam' : 'water', foamK: S.foam.k });
  if (S.candles) for (const [cy, h] of [[91.0, 1], [92.2, 0.8]]) S.boxes.push({ r: [45, cy, 45.7, cy + 0.7], z0: 10, z1: 10 + S.candles * h, m: 'ceramic', candle: true });
  return S;
}

// ---------------------------------------------------------------- the camera
function leanCam(eyeY, f = LEAN.f, aim) {
  const E = [143, eyeY], A = aim || LEAN.slit, dx = A[0] - E[0], dy = A[1] - E[1], L = Math.hypot(dx, dy);
  const F = [dx / L, dy / L], R = [-F[1], F[0]];
  return { E, F, R, f, cx: LEAN.cx, hy: LEAN.hy, z: LEAN.eyeZ };
}
const camProj = (C, x, y, z) => { const vx = x - C.E[0], vy = y - C.E[1], d = vx * C.F[0] + vy * C.F[1], r = vx * C.R[0] + vy * C.R[1]; return { sx: C.cx + C.f * r / d, sy: C.hy - C.f * (z - C.z) / d, d }; };

// 2D ray against a segment: t along d (|d| need not be 1), or Infinity
function segHit(o, d, a, b) {
  const ex = b[0] - a[0], ey = b[1] - a[1], den = d[0] * ey - d[1] * ex;
  if (Math.abs(den) < 1e-12) return Infinity;
  const t = ((a[0] - o[0]) * ey - (a[1] - o[1]) * ex) / den, u = ((a[0] - o[0]) * d[1] - (a[1] - o[1]) * d[0]) / den;
  return t > 1e-6 && u >= 0 && u <= 1 ? t : Infinity;
}
function boxHit(o, d, r) {   // slab: [tin, tout, face of entry] or null
  let tin = -Infinity, tout = Infinity, face = 0;
  for (let k = 0; k < 2; k++) {
    if (Math.abs(d[k]) < 1e-12) { if (o[k] < r[k] || o[k] > r[k + 2]) return null; continue; }
    let t1 = (r[k] - o[k]) / d[k], t2 = (r[k + 2] - o[k]) / d[k], f1 = k * 2, f2 = k * 2 + 1;
    if (t1 > t2) { [t1, t2] = [t2, t1]; [f1, f2] = [f2, f1]; }
    if (t1 > tin) { tin = t1; face = f1; } if (t2 < tout) tout = t2;
  }
  return tout > Math.max(tin, 1e-6) ? [tin, tout, face] : null;
}
const FACE_N = [[-1, 0], [1, 0], [0, -1], [0, 1]];
// a door leaf as a wall segment
const doorSeg = (D) => { const a = D.ang * Math.PI / 180, ex = D.h[0] + (D.dir[0] * Math.cos(a) - D.dir[1] * Math.sin(a) * D.swing) * D.len, ey = D.h[1] + (D.dir[1] * Math.cos(a) + D.dir[0] * Math.sin(a) * D.swing) * D.len; return { a: D.h, b: [ex, ey], z0: 0, z1: 36, door: true }; };

// light at a point with a normal (n may be null: lit from every side, for small things)
function leanLight(S, x, y, z, n, room) {
  let L = room.amb;
  for (const l of S.lights) {
    const vx = l.p[0] - x, vy = l.p[1] - y, vz = l.p[2] - z, d = Math.hypot(vx, vy, vz) || 1;
    let c = 1; if (n) c = Math.max(0, (vx * n[0] + vy * n[1] + vz * n[2]) / d); else c = 0.7;
    // walls between the light and the point: rooms don't light each other except through doorways (cheap test: same room, or the hallway)
    const lr = l.room || (l.room = roomAt(l.p[0], l.p[1]));
    if (lr !== room && lr.n !== room.n && !(lr.n === 'hall' || room.n === 'hall')) c *= 0.15;
    L += l.c * c / (1 + (d / l.r) ** 2);
  }
  return L;
}

// cast one column: per row the nearest hit (a palette index and its depth along the unfolded ray), with one bounce in
// the hall mirror. out: { idx: Int16Array(H), depth: Float32Array(H), mir: Uint8Array(H), sx }
function leanColumn(S, C, sx, out, extra) {
  const dx = C.F[0] + C.R[0] * (sx - C.cx) / C.f, dy = C.F[1] + C.R[1] * (sx - C.cx) / C.f;
  const rows = []; for (let y = 0; y < LEAN.H; y++) rows.push(y);
  out.sx = sx; trace(S, C, C.E, [dx, dy], 0, rows, out, 0, extra);
}
function trace(S, C, o, d, t0, rows, out, bounce, extra) {
  // everything this 2D ray crosses: walls (a thin hit) and boxes (an interval), sorted by entry
  const cand = [];
  for (const w of extra.walls) { const t = segHit(o, d, w.a, w.b); if (t < Infinity) cand.push({ t0: t, t1: t, w }); }
  for (const b of extra.boxes) { const h = boxHit(o, d, b.r); if (h) cand.push({ t0: h[0], t1: h[1], face: h[2], b }); }
  cand.sort((p, q) => p.t0 - q.t0);
  const mirRows = []; let mirO = null;
  for (const y of rows) {
    const kz = (C.hy - y) / C.f;   // z rises kz per unit of depth
    let best = Infinity, hit = null;
    if (kz < 0) { const tf = C.z / -kz - t0; if (tf > 0) { best = tf; hit = { kind: 'floor' }; } }
    else if (kz > 0) { const tc = (LCEIL - C.z) / kz - t0; if (tc > 0) { best = tc; hit = { kind: 'ceil' }; } }
    for (const c of cand) {
      if (c.t0 >= best) break;
      if (c.w) {
        const z = C.z + kz * (t0 + c.t0);
        if (z >= c.w.z0 && z <= c.w.z1) { best = c.t0; hit = { kind: 'wall', w: c.w }; break; }
      } else {
        const b = c.b, te = Math.max(c.t0, 0), zin = C.z + kz * (t0 + te);
        if (c.t0 > 0 && zin >= b.z0 && zin <= b.z1) { best = c.t0; hit = { kind: 'box', b, face: c.face }; break; }
        const zt = kz < 0 ? b.z1 : b.z0, tt = kz !== 0 ? (zt - C.z) / kz - t0 : Infinity;
        if (tt > te && tt <= c.t1 && tt < best && ((kz < 0 && zin > b.z1) || (kz > 0 && zin < b.z0))) { best = tt; hit = { kind: 'box', b, face: kz < 0 ? 4 : 5 }; break; }
      }
    }
    if (!hit) { out.idx[y] = LC.void; out.depth[y] = 1e9; continue; }
    const t = best, px = o[0] + d[0] * t, py = o[1] + d[1] * t, pz = C.z + kz * (t0 + t);
    if (hit.kind === 'wall' && hit.w.mirror && bounce === 0 && extra.mirror && pz >= MIRROR.z0 && pz <= MIRROR.z1 && px >= MIRROR.x0 + 0.6 && px <= MIRROR.x1 - 0.6) {
      mirRows.push(y); mirO = [px, py, t0 + t]; out.mir[y] = 1; continue;
    }
    out.idx[y] = shadeHit(S, hit, px, py, pz, d, out.sx, y, extra);
    out.depth[y] = t0 + t;
  }
  // the hall mirror: the rest of the ray goes on reflected across y = 108 (the same for every row of this column)
  if (mirRows.length) trace(S, C, [mirO[0], mirO[1] - 1e-4], [d[0], -d[1]], mirO[2], mirRows, out, 1, extra);
}
// the colour of a hit: the material's ramp at the light there, with the material's pattern
function shadeHit(S, hit, x, y, z, d, sx, sy, extra) {
  const room = roomAt(x - d[0] * 0.05, y - d[1] * 0.05);
  let ramp, n, L, pat = 0;
  if (hit.kind === 'floor') {
    const fr = roomAt(x, y), ov = LFLOOR.find((f) => x >= f.r[0] && x <= f.r[2] && y >= f.r[1] && y <= f.r[3]);
    ramp = LM[ov ? ov.m : fr.floor]; n = [0, 0, 1]; L = leanLight(S, x, y, z, n, fr);
    if (!ov && fr.floor === 'wood') { const bx = fr.n === 'liv' ? y : x, row = Math.floor((fr.n === 'liv' ? x : y) / 2.6); if (Math.abs(((row * 37) % 23) + bx) % 19 < 0.35 || ((fr.n === 'liv' ? x : y) % 2.6) < 0.22) pat = -0.18; }
    if (!ov && (fr.floor === 'bathFloor' || fr.floor === 'kitFloor')) { if ((Math.floor(x / 3) + Math.floor(y / 3)) & 1) pat = -0.08; if (x % 3 < 0.2 || y % 3 < 0.2) pat = -0.2; }
    if (ov && ov.m === 'rug' && (Math.abs(x - 12) < 1.2 || Math.abs(x - 56) < 1.2 || Math.abs(y - 112) < 1.2 || Math.abs(y - 150) < 1.2)) pat = 0.15;
  } else if (hit.kind === 'ceil') {
    ramp = LM.ceil; n = [0, 0, -1]; L = leanLight(S, x, y, z, n, room) * 0.9;
  } else if (hit.kind === 'wall') {
    const w = hit.w, wx = w.b[0] - w.a[0], wy = w.b[1] - w.a[1], wl = Math.hypot(wx, wy);
    let nx = -wy / wl, ny = wx / wl; if (nx * d[0] + ny * d[1] > 0) { nx = -nx; ny = -ny; }
    n = [nx, ny, 0];
    if (w.door) { ramp = LM.door; L = leanLight(S, x, y, z, n, room); if (Math.abs(z - 27) < 0.25 || Math.abs(z - 9) < 0.25) pat = -0.12; }
    else if (w.mirror && extra.mirror) { ramp = LM.mirror; L = 0.35; }
    else {
      ramp = LM[room.wall]; L = leanLight(S, x, y, z, n, room);
      if (z < 1.3) { ramp = LM.trim; pat = -0.05; }                                       // the skirting
      if (room.wall === 'bathWall' && (z % 3 < 0.22 || ((Math.abs(x) + Math.abs(y)) % 3) < 0.22)) pat = -0.18;   // tiles
      if (room.wall === 'kitWall' && z > 16.5 && z < 30 && (z % 2.5 < 0.2 || ((x + y) % 4) < 0.2)) pat = -0.12;
      if (room.wall === 'hallWall' && (Math.floor((x + y) * 1.2) % 6 === 0) && z > 1.3) pat = -0.05;   // wallpaper stripe
      // the casings round the doorways: off-white, 1.2 u wide
      for (const g of LDOORWAYS) if (Math.hypot(x - g[0], y - g[1]) < 1.3 && z < g[2] + 1.2) { ramp = LM.trim; break; }
      if (w.z0 > 0 && z < w.z0 + 1.2) ramp = LM.trim;   // the header's casing
    }
  } else {
    const b = hit.b; n = hit.face < 4 ? [...FACE_N[hit.face], 0] : hit.face === 4 ? [0, 0, 1] : [0, 0, -1];
    ramp = LM[hit.face === 4 && b.top ? b.top : b.m]; L = leanLight(S, x, y, z, b.candle ? null : n, room);
    if (b.glow) return tone(LM.shade, b.glow + (hit.face === 4 ? 0.1 : 0), sx, sy);
    if (b.tv && hit.face === 1) return tvPixel(S, (150 - y) / 21, (28 - z) / 13, sx, sy, extra.t);
    if (b.m === 'foam' || b.m === 'water') {
      if (hit.face === 4) { const k = b.foamK, q = Math.sin(x * 1.7 + y * 2.3) + Math.sin(x * 0.9 - y * 3.1) * 0.8; if (q * 0.5 + 0.5 < k * 1.15) { ramp = LM.foam; L = 0.35 + L * 0.8 + (q > 0.6 ? 0.15 : 0); } else { ramp = LM.water; L = 0.25 + L * 0.5; } }
    }
    if (b.candle && z > b.z1 - 0.05) return LC.moon;
  }
  return toneB(ramp, L + pat, sx, sy);
}
// doorway edges (x, y, height): the casings
const toneB = (ramp, L, x, y) => { const t = clamp(L) * (ramp.length - 1), b = Math.floor(t), f = t - b; return ramp[Math.min(ramp.length - 1, b + (f > (BAYER8[((y & 7) << 3) | (x & 7)] + 0.5) / 64 ? 1 : 0))]; };
const LDOORWAYS = [[80, 84, 36], [98, 84, 36], [112, 84, 40], [136, 84, 40], [70, 85, 36], [70, 99, 36], [70, 101, 40], [96, 108, 40]];

// the TV: what is on it (u across from its left, v down), emissive. The yoga video with its progress line; a film;
// the credits rolling
function tvPixel(S, u, v, x, y, t) {
  if (u < 0.03 || u > 0.97 || v < 0.05 || v > 0.95) return LC.s1;   // its bezel
  const tv = S.tv; if (!tv) return LC.void;
  if (v > 0.84) {   // the progress line along the bottom
    if (v < 0.87 || v > 0.92) return tv.kind === 'credits' ? LC.void : LC.s2;
    return u - 0.05 < tv.k * 0.9 ? LC.moon : LC.s3;
  }
  if (tv.kind === 'yoga') {   // a bright studio, the instructor in a pose that matches hers
    const bg = v < 0.55 ? (chk(x, y) && v > 0.45 ? LC.beige : LC.moon) : LC.beige;
    const cx = 0.5, fy = (v - 0.18) / 0.62, dx = Math.abs(u - cx);
    if (S.stage === 0 && ((dx < 0.05 && fy > 0 && fy < 1) || (dx < 0.12 && fy > 0.15 && fy < 0.22))) return LC.rose;
    if (S.stage === 1 && ((Math.abs(u - 0.42) < 0.06 && fy > 0.35 && fy < 0.8) || (u > 0.42 && u < 0.78 && fy > 0.72 && fy < 0.82))) return LC.rose;
    if (S.stage === 2 && u > 0.2 && u < 0.8 && fy > 0.78 && fy < 0.88) return LC.rose;
    return bg;
  }
  if (tv.kind === 'film') { const k = Math.sin(u * 7 + t * 0.7) * 0.5 + 0.5; return v < 0.5 ? (k > 0.6 ? LC.denim : LC.purple) : (k > 0.75 ? LC.lilac : LC.plum); }
  // credits: white lines scrolling up on black
  const row = Math.floor((v * 12 + t * 0.9)), col = (row * 7) % 5;
  return ((v * 12 + t * 0.9) % 1) < 0.4 && Math.abs(u - 0.5) < 0.12 + col * 0.03 ? LC.moon : LC.void;
}

// ---------------------------------------------------------------- her stand-in: a small rig, drawn at the camera's size
// Her prototype look (long straight black hair, blunt bangs, the pink clip, green eyes, no glasses), as capsules and
// ellipses through the phone's vector painter: lit from the upper left, a checker between two tones, a 1 px line. Poses
// are joints in her height (H = 1, y up from what she stands or sits on, x across the picture). A placeholder until
// Paweł draws her (the art list: one per activity and stage, and a closer framing each).
const HC = C9;
const KIT = {
  skin: { fill: HC.skin, shade: HC.tan, line: HC.brown, cut: 0.38 }, skinF: { fill: HC.beige, shade: HC.tan, line: HC.brown, cut: 0.1 },
  hair: { fill: HC.plum, shade: HC.void, hi: HC.purple, hiCut: -0.5, line: HC.void, tex: (x, y, c) => (c !== HC.void && ((x * 5 + Math.floor(y / 9) * 3) % 13 === 0) ? (c === HC.purple ? HC.plum : HC.void) : c) },
  tee: { fill: HC.beige, shade: HC.tan, hi: HC.moon, hiCut: -0.45, line: HC.brown }, shorts: { fill: HC.denim, shade: HC.purple, line: HC.plum },
  top: { fill: HC.pink, shade: HC.rose, line: HC.plum }, legs: { fill: HC.purple, shade: HC.plum, hi: HC.lilac, hiCut: -0.6, line: HC.void },
  pj: { fill: HC.lilac, shade: HC.purple, hi: HC.moon, hiCut: -0.8, line: HC.plum }, towel: { fill: HC.moon, shade: HC.beige, line: HC.tan },
};
// outfits: what covers which part
const OUTFIT = {
  yoga: { chest: 'top', mid: 'skin', pelvis: 'legs', thigh: 'legs', shin: 'legs', upper: 'skin', fore: 'skin' },
  home: { chest: 'tee', mid: 'tee', pelvis: 'shorts', thigh: 'skin', shin: 'skin', upper: 'tee', fore: 'skin', shorts: 'shorts' },
  reach: { chest: 'tee', mid: 'skin', pelvis: 'shorts', thigh: 'skin', shin: 'skin', upper: 'tee', fore: 'skin', shorts: 'shorts' },   // the tee rides up
  pj: { chest: 'pj', mid: 'pj', pelvis: 'pj', thigh: 'skin', shin: 'skin', upper: 'skin', fore: 'skin', shorts: 'pj' },
  bath: { chest: 'skin', mid: 'skin', pelvis: 'skin', thigh: 'skin', shin: 'skin', upper: 'skin', fore: 'skin' },
};
// poses: joints [x, y] in H. side views face left (x < 0 is in front of her). Torso radii [chest, waist, hip].
const POSES = {
  yogaStand: { view: 'side', head: 'side', tr: [0.062, 0.047, 0.07], fit: 'yoga',
    j: { toe: [-0.085, 0.004], an: [0, 0.03], kn: [-0.006, 0.27], hip: [0, 0.5], toeF: [-0.07, 0.004], anF: [0.016, 0.03], knF: [0.012, 0.27], hipF: [0.014, 0.5],
      waist: [0.004, 0.61], neck: [0.0, 0.83], head: [-0.012, 0.925], sh: [0.004, 0.8], el: [-0.012, 0.965], wr: [-0.02, 1.12], shF: [0.02, 0.8], elF: [0.01, 0.965], wrF: [-0.004, 1.12] } },
  yogaFloor: { view: 'side', head: 'side', tr: [0.062, 0.047, 0.072], fit: 'yoga',
    j: { hip: [0.02, 0.075], hipF: [0.035, 0.075], kn: [-0.22, 0.075], knF: [-0.2, 0.08], an: [-0.44, 0.04], anF: [-0.42, 0.045], toe: [-0.47, 0.11], toeF: [-0.45, 0.115],
      waist: [0.0, 0.2], neck: [-0.11, 0.37], head: [-0.17, 0.43], sh: [-0.1, 0.35], el: [-0.22, 0.26], wr: [-0.35, 0.18], shF: [-0.08, 0.36], elF: [-0.2, 0.28], wrF: [-0.33, 0.2] } },
  yogaLie: { view: 'side', head: 'up', tr: [0.06, 0.046, 0.068], fit: 'yoga', lying: true,
    j: { head: [0.43, 0.065], neck: [0.345, 0.055], sh: [0.31, 0.055], waist: [0.12, 0.055], hip: [0.03, 0.06], kn: [-0.22, 0.055], an: [-0.46, 0.04], toe: [-0.5, 0.1],
      hipF: [0.03, 0.06], knF: [-0.22, 0.06], anF: [-0.46, 0.045], toeF: [-0.495, 0.105], el: [0.17, 0.035], wr: [0.02, 0.03], shF: [0.31, 0.06], elF: [0.17, 0.08], wrF: [0.03, 0.085] } },
  couch: { view: 'back', head: 'back', tr: [0.08, 0.06, 0.085], fit: 'home',
    j: { hip: [0.04, 0.0], hipF: [-0.04, 0.0], waist: [0, 0.12], neck: [0, 0.34], head: [0.004, 0.43], sh: [0.075, 0.31], el: [0.15, 0.2], wr: [0.21, 0.16], shF: [-0.075, 0.31], elF: [-0.12, 0.19], wrF: [-0.1, 0.12] } },
  kitLean: { view: 'back', head: 'back3q', tr: [0.078, 0.058, 0.085], fit: 'home',
    j: { toe: [0.05, 0.0], an: [0.045, 0.03], kn: [0.05, 0.27], hip: [0.045, 0.5], toeF: [-0.05, 0.0], anF: [-0.045, 0.03], knF: [-0.045, 0.27], hipF: [-0.045, 0.5],
      waist: [0, 0.6], neck: [-0.01, 0.815], head: [-0.02, 0.91], sh: [0.08, 0.79], el: [0.11, 0.66], wr: [0.06, 0.58], shF: [-0.085, 0.79], elF: [-0.12, 0.67], wrF: [-0.07, 0.59] } },
  kitReach: { view: 'back', head: 'back3q', tr: [0.076, 0.056, 0.085], fit: 'reach', tiptoe: true,
    j: { toe: [0.05, 0.0], an: [0.045, 0.06], kn: [0.05, 0.3], hip: [0.045, 0.53], toeF: [-0.05, 0.0], anF: [-0.045, 0.06], knF: [-0.045, 0.3], hipF: [-0.045, 0.53],
      waist: [0, 0.64], neck: [0.005, 0.85], head: [0.0, 0.945], sh: [0.08, 0.83], el: [0.11, 1.0], wr: [0.12, 1.15], shF: [-0.085, 0.82], elF: [-0.13, 0.7], wrF: [-0.09, 0.6] } },
  kitMug: { view: 'back', head: 'back3q', tr: [0.078, 0.058, 0.085], fit: 'home',
    j: { toe: [0.05, 0.0], an: [0.045, 0.03], kn: [0.05, 0.27], hip: [0.045, 0.5], toeF: [-0.05, 0.0], anF: [-0.045, 0.03], knF: [-0.045, 0.27], hipF: [-0.045, 0.5],
      waist: [0, 0.6], neck: [-0.01, 0.815], head: [-0.015, 0.91], sh: [0.08, 0.79], el: [0.12, 0.65], wr: [0.05, 0.72], shF: [-0.085, 0.79], elF: [-0.11, 0.66], wrF: [-0.03, 0.72] }, mug: true },
  maskSit: { view: 'front', head: 'front', tr: [0.078, 0.056, 0.09], fit: 'pj', sit: true, phone: true,
    j: { hip: [0.05, 0.33], hipF: [-0.05, 0.33], kn: [0.06, 0.25], knF: [-0.06, 0.25], an: [0.055, 0.03], anF: [-0.055, 0.03], toe: [0.06, 0.0], toeF: [-0.06, 0.0],
      waist: [0, 0.44], neck: [0, 0.65], head: [0, 0.745], sh: [0.085, 0.62], el: [0.11, 0.5], wr: [0.05, 0.47], shF: [-0.085, 0.62], elF: [-0.11, 0.5], wrF: [-0.05, 0.47] } },
  maskSmooth: { view: 'front', head: 'front', tr: [0.078, 0.056, 0.09], fit: 'pj', sit: true,
    j: { hip: [0.05, 0.33], hipF: [-0.05, 0.33], kn: [0.06, 0.25], knF: [-0.06, 0.25], an: [0.055, 0.03], anF: [-0.055, 0.03], toe: [0.06, 0.0], toeF: [-0.06, 0.0],
      waist: [0, 0.44], neck: [0, 0.65], head: [0, 0.745], sh: [0.085, 0.62], el: [0.12, 0.62], wr: [0.045, 0.73], shF: [-0.085, 0.62], elF: [-0.12, 0.62], wrF: [-0.045, 0.73] } },
  maskPeel: { view: 'front', head: 'front', tr: [0.078, 0.056, 0.09], fit: 'pj', sit: true,
    j: { hip: [0.05, 0.33], hipF: [-0.05, 0.33], kn: [0.06, 0.25], knF: [-0.06, 0.25], an: [0.055, 0.03], anF: [-0.055, 0.03], toe: [0.06, 0.0], toeF: [-0.06, 0.0],
      waist: [0, 0.44], neck: [0, 0.65], head: [0, 0.745], sh: [0.085, 0.62], el: [0.12, 0.6], wr: [0.03, 0.69], shF: [-0.085, 0.62], elF: [-0.11, 0.5], wrF: [-0.05, 0.47] } },
  bathHead: { view: 'front', head: 'front', tr: [0.08, 0.056, 0.09], fit: 'bath', bun: true,
    j: { waist: [0, 0.1], neck: [0, 0.25], head: [0, 0.345], sh: [0.09, 0.22], el: [0.17, 0.14], wr: [0.2, 0.08], shF: [-0.09, 0.22], elF: [-0.17, 0.14], wrF: [-0.2, 0.08], hip: [0.04, 0], hipF: [-0.04, 0] } },
  mirrorMask: { view: 'side', head: 'side', tr: [0.062, 0.047, 0.07], fit: 'pj', mask: true,
    j: { toe: [-0.08, 0.004], an: [0, 0.03], kn: [-0.01, 0.27], hip: [0, 0.5], toeF: [-0.065, 0.004], anF: [0.016, 0.03], knF: [0.008, 0.27], hipF: [0.014, 0.5],
      waist: [0.004, 0.61], neck: [-0.004, 0.83], head: [-0.016, 0.925], sh: [0.004, 0.8], el: [-0.03, 0.7], wr: [-0.07, 0.88], shF: [0.02, 0.8], elF: [0.03, 0.68], wrF: [0.01, 0.6] } },
};
const FIG_CACHE = new Map();
// her figure at Hpx tall. look: 'busy' | 'tell' (she pauses, her head turns toward the door) | 'sees' (looking at you)
function herFigure(name, Hpx, look = 'busy', o = {}) {
  const key = name + '|' + Math.round(Hpx) + '|' + look + '|' + (o.mask || '') + '|' + (o.flip ? 1 : 0);
  if (FIG_CACHE.has(key)) return FIG_CACHE.get(key);
  const P0 = POSES[name], J = P0.j, fit = OUTFIT[P0.fit], H = Hpx;
  const xs = Object.values(J).map((p) => p[0]), ys = Object.values(J).map((p) => p[1]);
  const pad = 0.12 * H, x0 = Math.min(...xs) * H - pad, x1 = Math.max(...xs) * H + pad, y1 = Math.max(...ys) * H + pad + 0.08 * H, y0 = Math.min(...ys) * H - pad * 0.5;
  const W = Math.ceil(x1 - x0), HH = Math.ceil(y1 - y0), ax = -x0, ay = y1;   // anchor: x 0, y 0 of the pose
  const X = (p) => ax + p[0] * H, Y = (p) => ay - p[1] * H, pt = (p) => [X(p), Y(p)];
  const S = [], cap = (a, b, r0, r1, kit) => { if (J[a] && J[b]) S.push({ cap: [X(J[a]), Y(J[a]), X(J[b]), Y(J[b]), r0 * H, r1 * H], ...KIT[kit] }); };
  const ell = (p, rx, ry, kit, extra = {}) => S.push({ ell: [X(p), Y(p), rx * H, ry * H], ...KIT[kit], ...extra });
  const near = (k) => KIT[k] && k === 'skin' ? 'skin' : k, far = (k) => (k === 'skin' ? 'skinF' : k);
  const turned = look === 'busy' ? P0.head : P0.view === 'back' ? 'over' : P0.view === 'side' ? (look === 'tell' ? '3q' : 'front3q') : P0.head;
  const [rc, rw, rh] = P0.tr.map((v) => v * 1.18);
  // her hair hangs behind her body when she faces you; over her back when she doesn't
  const hairLen = P0.bun ? 0 : P0.lying ? 0.0 : 0.36;
  const hairBack = () => {
    if (!hairLen || !J.head) return;
    const hd = J.head, nk = J.neck, wa = J.waist || nk, ux = wa[0] - nk[0], uy = wa[1] - nk[1], ul = Math.hypot(ux, uy) || 1;
    const tip = [nk[0] + ux / ul * hairLen, nk[1] + uy / ul * hairLen], back = P0.view === 'side' ? 0.035 : 0;
    S.push({ cap: [X([hd[0] + back, hd[1]]), Y(hd), X([tip[0] + back * 1.6, tip[1]]), Y(tip), (P0.view === 'side' ? 0.068 : 0.095) * H, (P0.view === 'side' ? 0.05 : 0.082) * H], ...KIT.hair });
  };
  if (P0.view === 'front') hairBack();
  // far limbs
  cap('hipF', 'knF', 0.06, 0.038, far(fit.thigh)); if (fit.shorts && J.hipF && J.knF) { const a = J.hipF, k = J.knF, m = [a[0] + (k[0] - a[0]) * 0.4, a[1] + (k[1] - a[1]) * 0.4]; S.push({ cap: [X(a), Y(a), X(m), Y(m), 0.066 * H, 0.056 * H], ...KIT[fit.shorts] }); } cap('knF', 'anF', 0.037, 0.022, far(fit.shin)); cap('anF', 'toeF', 0.02, 0.015, 'skinF');
  cap('shF', 'elF', 0.029, 0.024, far(fit.upper)); cap('elF', 'wrF', 0.023, 0.017, far(fit.fore)); if (J.wrF) ell(J.wrF, 0.022, 0.025, 'skinF');
  // the torso: chest (the top), midriff, pelvis
  if (J.neck && J.waist) {
    const nk = J.neck, wa = J.waist, mid = [nk[0] + (wa[0] - nk[0]) * 0.72, nk[1] + (wa[1] - nk[1]) * 0.72];
    S.push({ cap: [X(nk), Y(nk), X(mid), Y(mid), rc * H, (rc + rw) / 2 * H], ...KIT[fit.chest] });
    S.push({ cap: [X(mid), Y(mid), X(wa), Y(wa), (rc + rw) / 2 * H * 0.96, rw * H], ...KIT[fit.mid] });
    if (J.hip) { const hp = [(J.hip[0] + (J.hipF || J.hip)[0]) / 2, (J.hip[1] + (J.hipF || J.hip)[1]) / 2]; S.push({ cap: [X(wa), Y(wa), X(hp), Y(hp), rw * H, rh * H], ...KIT[fit.pelvis] }); }
  }
  if (P0.view !== 'front') hairBack();
  // near limbs
  cap('hip', 'kn', 0.062, 0.04, near(fit.thigh)); if (fit.shorts && J.hip && J.kn) { const a = J.hip, k = J.kn, m = [a[0] + (k[0] - a[0]) * 0.4, a[1] + (k[1] - a[1]) * 0.4]; S.push({ cap: [X(a), Y(a), X(m), Y(m), 0.068 * H, 0.058 * H], ...KIT[fit.shorts] }); } cap('kn', 'an', 0.039, 0.023, near(fit.shin)); cap('an', 'toe', 0.021, 0.016, 'skin');
  // the head
  const hd = J.head, hr = [0.066, 0.076];
  if (hd) {
    cap('neck', 'head', 0.025, 0.025, 'skin');
    headShapes(S, X(hd), Y(hd), hr[0] * H, hr[1] * H, turned, P0, look);
  }
  cap('sh', 'el', 0.03, 0.025, fit.upper); cap('el', 'wr', 0.024, 0.018, fit.fore); if (J.wr) ell(J.wr, 0.023, 0.026, 'skin');
  if (P0.phone && J.wr) S.push({ poly: [[X(J.wr) - 0.045 * H, Y(J.wr) - 0.035 * H], [X(J.wr) + 0.045 * H, Y(J.wr) - 0.035 * H], [X(J.wr) + 0.04 * H, Y(J.wr) + 0.01 * H], [X(J.wr) - 0.04 * H, Y(J.wr) + 0.01 * H]], fill: HC.void, hi: HC.denim, hiCut: -0.4, line: HC.void });
  if (P0.mug && J.wr) S.push({ ell: [X(J.wr) - 0.02 * H, Y(J.wr) - 0.03 * H, 0.022 * H, 0.03 * H], fill: HC.rose, shade: HC.crimson, line: HC.plum });
  let I = PHONEOS.vPaint(W, HH, () => -1, S);
  if (hd) faceMarks(I, W, HH, X(hd), Y(hd), hr[0] * H, hr[1] * H, turned, P0, look, o, name);
  if (o.flip) { const F = new Int16Array(I.length); for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) F[y * W + x] = I[y * W + (W - 1 - x)]; I = F; }
  const R = { I, w: W, h: HH, ax: o.flip ? W - ax : ax, ay };
  FIG_CACHE.set(key, R); if (FIG_CACHE.size > 120) FIG_CACHE.delete(FIG_CACHE.keys().next().value);
  return R;
}
// the head: skin, the hair cap and bangs, long locks; turned: 'side' (profile, facing left), 'up' (lying, face up),
// 'front', 'back', 'back3q' (from behind, a cheek showing), 'over' (looking back over her shoulder), '3q', 'front3q'
function headShapes(S, cx, cy, rx, ry, turned, P0, look) {
  const hair = KIT.hair, skin = KIT.skin;
  if (turned === 'back' || turned === 'back3q') {
    if (turned === 'back3q') S.push({ ell: [cx - rx * 0.55, cy + ry * 0.12, rx * 0.5, ry * 0.62], ...skin });
    S.push({ ell: [cx, cy, rx * 1.06, ry * 1.04], ...hair });
    S.push({ ell: [cx + rx * 0.62, cy - ry * 0.45, rx * 0.18, ry * 0.18], fill: HC.pink, shade: HC.rose, line: HC.plum });   // the clip
    return;
  }
  if (turned === 'up') {   // lying on her back: the face turned up, hair spread under her head
    S.push({ ell: [cx + rx * 0.5, cy + ry * 0.2, rx * 1.2, ry * 0.7], ...hair });
    S.push({ ell: [cx, cy, rx * 1.0, ry * 0.85], ...skin });
    S.push({ poly: [[cx - rx * 0.2, cy - ry * 0.95], [cx + rx * 1.1, cy - ry * 0.7], [cx + rx * 1.15, cy + ry * 0.5], [cx + rx * 0.35, cy + ry * 0.4]], ...hair });
    return;
  }
  const front = turned === 'front' || turned === 'front3q' || turned === '3q' || turned === 'over';
  if (P0.bun) S.push({ ell: [cx, cy - ry * 1.05, rx * 0.62, ry * 0.45], ...hair });
  S.push({ ell: [cx, cy, rx, ry], ...skin, light: [0.6, 0.4] });
  if (!front) {   // profile, facing left: hair over the back of the head and down, the bangs to the brow, an ear
    S.push({ poly: [[cx - rx * 0.95, cy - ry * 0.55], [cx - rx * 0.4, cy - ry * 1.08], [cx + rx * 0.7, cy - ry * 1.02], [cx + rx * 1.12, cy - ry * 0.3], [cx + rx * 1.15, cy + ry * 0.9], [cx + rx * 0.35, cy + ry * 0.95], [cx + rx * 0.3, cy - ry * 0.05], [cx - rx * 0.62, cy - ry * 0.18], [cx - rx * 1.0, cy - ry * 0.2]], ...hair });
    S.push({ ell: [cx + rx * 0.62, cy - ry * 0.62, rx * 0.2, ry * 0.18], fill: HC.pink, shade: HC.rose, line: HC.plum });
    return;
  }
  const sh = turned === '3q' || turned === 'over' ? -0.28 : turned === 'front3q' ? -0.15 : 0;   // turned toward the door (left)
  if (!P0.bun) {
    S.push({ poly: [[cx - rx * 1.1, cy - ry * 0.2], [cx - rx * 1.2, cy + ry * 1.7], [cx - rx * 0.7, cy + ry * 1.75], [cx - rx * 0.78, cy + ry * 0.1]], ...hair });
    S.push({ poly: [[cx + rx * 1.1, cy - ry * 0.2], [cx + rx * 1.2, cy + ry * 1.7], [cx + rx * 0.7, cy + ry * 1.75], [cx + rx * 0.78, cy + ry * 0.1]], ...hair });
  }
  const bangs = PHONEOS.arcCut(cx + sh * rx * 0.4, cy + ry * 0.05, rx * 1.1, ry * 1.12, cy - ry * 0.18);
  S.push({ poly: bangs, ...hair, tex: (x, y, c) => (Math.round(y) === Math.round(cy - ry * 0.2) && Math.round(x) % 4 === 0 ? HC.skin : c) });
  S.push({ ell: [cx + rx * 0.72 + sh * rx * 0.4, cy - ry * 0.62, rx * 0.2, ry * 0.18], fill: HC.pink, shade: HC.rose, line: HC.plum });
}
// eyes, mouth, blush, the sheet mask: placed pixels at this size
function faceMarks(I, W, H, cx, cy, rx, ry, turned, P0, look, o, name) {
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H && I[y * W + x] >= 0) I[y * W + x] = c; };
  const eyeH = Math.max(1, Math.round(ry * 0.22)), eyeW = Math.max(1, Math.round(rx * 0.32));
  const eye = (ex, ey, open = 1) => { for (let i = -1; i <= eyeW; i++) put(ex + i, ey - 1, HC.void); if (open > 0.3) for (let j = 0; j < eyeH; j++) for (let i = 0; i < eyeW; i++) put(ex + i, ey + j, i === 0 && j === 0 ? HC.moon : j >= eyeH - 1 ? HC.void : HC.moss); };
  const mask = P0.mask || name.startsWith('mask'), peel = name === 'maskPeel';
  if (turned === 'side') {
    put(cx - rx * 0.98, cy + ry * 0.12, HC.skin); put(cx - rx * 1.06, cy + ry * 0.18, HC.brown);   // the nose
    if (mask) for (let y = Math.round(cy - ry * 0.15); y < cy + ry * 0.85; y++) for (let x = Math.round(cx - rx * 1.0); x < cx + rx * 0.2; x++) if (I[y * W + x] === HC.skin || I[y * W + x] === HC.tan) put(x, y, (x + y) % 5 === 0 ? HC.beige : HC.moon);
    eye(cx - rx * 0.62, cy + ry * 0.05); put(cx - rx * 0.8, cy + ry * 0.55, HC.rose);
    return;
  }
  if (turned === 'up' || turned === 'back' || turned === 'back3q') return;
  const sh = turned === '3q' || turned === 'over' ? -0.28 : turned === 'front3q' ? -0.15 : 0, ox = cx + sh * rx;
  const ey = cy + ry * 0.12, gap = rx * 0.38, closed = name === 'bathHead' && look === 'busy';
  if (mask) {   // the sheet mask: white over the face, holes for the eyes and the mouth; peeled from the chin at the end
    const top = cy - ry * 0.2, bot = peel ? cy + ry * 0.35 : cy + ry * 0.92;
    for (let y = Math.round(top); y <= bot; y++) for (let x = Math.round(cx - rx); x <= cx + rx; x++) { const k = I[y * W + x]; if (k === HC.skin || k === HC.tan) put(x, y, (x * 3 + y) % 7 === 0 ? HC.beige : HC.moon); }
    if (peel) for (let i = 0; i < rx * 1.6; i++) { put(cx - rx * 0.8 + i, bot + 1 + Math.sin(i / rx * 3) * 1.2, HC.beige); put(cx - rx * 0.8 + i, bot + 2, HC.moon); }
  }
  if (closed) { for (const s of [-1, 1]) for (let i = 0; i < eyeW + 1; i++) put(ox + s * gap - eyeW / 2 + i, ey + 1 + (i === 0 || i === eyeW ? -1 : 0), HC.void); }
  else { eye(ox - gap - eyeW / 2, ey); eye(ox + gap - eyeW / 2, ey); }
  if (look === 'sees') { put(ox - gap * 1.4, ey + ry * 0.35, HC.rose); put(ox + gap * 1.4, ey + ry * 0.35, HC.rose); put(ox - gap * 1.2, ey + ry * 0.38, HC.rose); put(ox + gap * 1.2, ey + ry * 0.38, HC.rose); }
  const my = cy + ry * 0.58;
  if (!mask || peel || look === 'sees') { if (look === 'sees') { put(ox - 1, my, HC.rose); put(ox, my + 1, HC.rose); put(ox + 1, my + 1, HC.rose); put(ox + 2, my, HC.rose); } else put(ox, my, HC.rose); }
}

// ---------------------------------------------------------------- the view
// where she is, per activity and stage: [pose, plan x, y, z of what she stands or sits on]
function herPlace(act, stage, mirror) {
  if (mirror !== 'off') return act === 'mask' ? [{ pose: 'mirrorMask', at: [15, 64.5, 0], refl: true }] : [];   // the game: in the mirror only at her sheet mask
  if (act === 'yoga') return [{ pose: ['yogaStand', 'yogaFloor', 'yogaLie'][stage], at: [22, [114, 110, 112][stage], 0.3] }];
  if (act === 'couch') return [{ pose: 'couch', at: [30.5, 134.5, 7.6] }];
  if (act === 'bath') return [{ pose: 'bathHead', at: [19, 94.2, 2.8] }, { leg: true }];
  if (act === 'kitchen') return [{ pose: ['kitLean', 'kitReach', 'kitMug'][stage], at: [119.5, [73.5, 72, 74][stage], 0] }];
  if (act === 'mask') return [{ pose: ['maskSmooth', 'maskSit', 'maskPeel'][stage], at: [48, 91.5, 0] }];
  return [];
}
POSES.bathLeg = { view: 'front', head: null, tr: [0.05, 0.05, 0.05], fit: 'bath',
  j: { kn: [0.03, 0.22], an: [0.0, 0.035], toe: [-0.012, 0.1] } };
// what the closer framing aims at (focus): plan x, y, z
const FOCUS_AIM = { yoga: [[22, 114, 20], [17, 116, 7], [22, 112, 2.5]], couch: [30.5, 134.5, 15], bath: [40, 93, 11], kitchen: [114.5, 66, 27], mask: [48, 91.5, 19], mirror: [15, 64.5, 23] };

const LEANBUF = { idx: null, depth: null, fx: null, fy: null };
let LEAN_CANVAS = null;
// o: { act, stage, u (the lean, 0..1), slit (px), focus, mirror: 'off' | 'clear' | 'fog', look, t, grid }
function drawLean(o) {
  const W = LEAN.W, H = LEAN.H;
  if (!LEAN_CANVAS) { LEAN_CANVAS = document.createElement('canvas'); LEAN_CANVAS.width = W; LEAN_CANVAS.height = H; LEANBUF.idx = new Int16Array(W * H); LEANBUF.depth = new Float32Array(W * H); LEANBUF.her = new Uint8Array(W * H); }
  const S = leanScene(o.act, o.stage), mirror = o.mirror || 'off';
  if (mirror !== 'off') { S.lights.push({ p: [36, 70, 46], c: 0.9, r: 34 }); S.boxes = S.boxes.filter((b) => b.m !== 'door'); }
  const extra = { walls: LWALLS.concat(S.doors.map(doorSeg)), boxes: LBOX.concat(S.boxes), mirror: mirror !== 'off', t: o.t };
  const eyeY = leanEye(o.u);
  let C = leanCam(eyeY), herK = 1;
  if (o.focus) {   // a cut to a closer framing: the same eye, a longer lens aimed at her, drawn again (never a zoom)
    const aimA = FOCUS_AIM[mirror !== 'off' ? 'mirror' : o.act], aim = Array.isArray(aimA[0]) ? aimA[o.stage] : aimA;
    let ax = aim[0], ay = aim[1]; if (mirror !== 'off') ay = 2 * MIRROR.y - ay;
    C = leanCam(eyeY, LEAN.f * 2.4, [ax, ay]); const d = Math.hypot(ax - C.E[0], ay - C.E[1]); C.hy = 180 + C.f * (aim[2] - C.z) / d; herK = 2.4;
  }
  const w = Math.max(24, Math.min(160, Math.round(o.slit || 64))), xl = Math.round(LEAN.cx - w / 2), xr = xl + w;
  const { idx, depth } = LEANBUF; idx.fill(-1); depth.fill(1e9); LEANBUF.her.fill(0);
  const col = { idx: new Int16Array(H), depth: new Float32Array(H), mir: new Uint8Array(H), sx: 0 };
  const floorHit = o.grid ? new Float32Array(W * H * 2).fill(NaN) : null;
  for (let sx = xl; sx < xr; sx++) {
    col.mir.fill(0); leanColumn(S, C, sx, col, extra);
    for (let y = 0; y < H; y++) { idx[y * W + sx] = col.idx[y]; depth[y * W + sx] = col.depth[y] + (col.mir[y] ? 0 : 0); if (col.mir[y]) depth[y * W + sx] = -col.depth[y]; }
  }
  // her, and the small things drawn as pictures: z-tested against the scene (mirror pixels hold their depth negated)
  const place = herPlace(o.act, o.stage, mirror);
  for (const h of place) {
    if (h.leg) { bathLeg(C, xl, xr); continue; }
    let [px, py, pz] = h.at; const refl = !!h.refl; if (refl) py = 2 * MIRROR.y - py;
    const pr = camProj(C, px, py, pz); if (pr.d <= 1) continue;
    const Hpx = C.f * 30 / pr.d;
    const look = h.pose === 'bathLeg' ? 'busy' : o.look;
    const F = herFigure(h.pose, Hpx, look, { flip: refl });
    blitFig(F, Math.round(pr.sx - F.ax), Math.round(pr.sy - F.ay), pr.d, xl, xr, refl);
  }
  propSprites(S, C, xl, xr, o);
  // the hall mirror fogged: her outline only, in a pale wash
  if (mirror === 'fog') fogMirror(xl, xr, o.t);
  // to pixels: what's in the slit in her colours; the door and its frame in the desk's Graphite
  const ctx = LEAN_CANVAS.getContext('2d'), img = ctx.createImageData(W, H), D = img.data;
  const G = (n) => GPAL(n);
  const gp = { s1: G('s1'), s2: G('s2'), s3: G('s3'), s4: G('s4'), u2: G('u2'), u3: G('u3'), u4: G('u4'), u5: G('u5'), u6: G('u6'), void: G('void'), d2: G('d2') };
  const edgeL = Math.round(3 + 3 * (0.5 - (o.u ?? 0.5))), jamb = 12;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 4; let c;
    if (x >= xl && x < xr) { const k = idx[y * W + x]; c = LEAN_RGB[k < 0 ? 0 : k]; }
    else if (x < xl) {   // the leaf: its edge lit by the hallway, its face dark, a little of the gap's light on it
      const dx = xl - x;
      if (dx <= edgeL) c = dx === edgeL ? gp.s1 : (y + x) & 1 && dx > edgeL - 2 ? gp.u4 : gp.u5;
      else { const g = Math.max(0, 1 - (dx - edgeL) / 60) * 0.5 + (y > 300 ? 0.08 : 0), b = BAYER8[((y & 7) << 3) | (x & 7)] / 64; c = g > b + 0.3 ? gp.u2 : g > b * 0.6 + 0.08 ? gp.s2 : gp.s1;
        if (Math.abs(x - (xl - edgeL - 70)) < 1 || Math.abs(y - 60) < 1 && x < xl - edgeL - 70) c = gp.s3; }
    } else {   // the frame: the jamb's inner face lit warm, the stop, the casing, your room's wall in the dark
      const dx = x - xr;
      if (dx < jamb) c = dx < 2 ? gp.u6 : (dx + y) & 1 && dx > jamb - 4 ? gp.u4 : gp.u5;
      else if (dx < jamb + 3) c = gp.s3; else if (dx < jamb + 22) c = dx === jamb + 21 ? gp.s1 : (BAYER8[((y & 7) << 3) | (x & 7)] / 64 < 0.25 - dx * 0.004 ? gp.s3 : gp.s2);
      else c = BAYER8[((y & 7) << 3) | (x & 7)] / 64 < 0.12 ? gp.s2 : gp.s1;
    }
    D[p] = c[0]; D[p + 1] = c[1]; D[p + 2] = c[2]; D[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (o.grid) leanGrid(ctx, C, xl, xr);
  LEAN_LAST.xl = xl; LEAN_LAST.xr = xr;
  leanUI(ctx, o, w, xl, xr);
  return LEAN_CANVAS;
}
// the mouse's lean to the eye: three stops and the mirror, with a soft detent at each
function leanEye(u = 0.38) {
  const st = LEAN_STOPS, n = st.length; if (u <= st[0].u) return st[0].y; if (u >= st[n - 1].u) return st[n - 1].y;
  for (let k = 0; k < n - 1; k++) if (u <= st[k + 1].u) { let f = (u - st[k].u) / (st[k + 1].u - st[k].u); f = f * f * (3 - 2 * f); return st[k].y + (st[k + 1].y - st[k].y) * f; }
  return st[1].y;
}
function blitFig(F, x0, y0, d, xl, xr, refl) {
  const W = LEAN.W, { idx, depth } = LEANBUF;
  for (let j = 0; j < F.h; j++) { const y = y0 + j; if (y < 0 || y >= LEAN.H) continue;
    for (let i = 0; i < F.w; i++) { const x = x0 + i; if (x < xl || x >= xr) continue; const c = F.I[j * F.w + i]; if (c < 0) continue;
      const q = y * W + x, dz = depth[q];
      if (refl) { if (dz < 0 && d < -dz + 0.5) { idx[q] = c; LEANBUF.her[q] = 1; } } else if (dz > 0 && d < dz + 0.5) idx[q] = c; } }
}
// small things, drawn at their size for this camera and z-tested: the snack bowl, the wine glass, the candles' flames,
// the kettle's steam and its light
function propAt(C, x, y, z) { const p = camProj(C, x, y, z); return p.d > 1 ? p : null; }
function propPut(x, y, d, c, xl, xr) {
  x = Math.round(x); y = Math.round(y); if (x < xl || x >= xr || y < 0 || y >= LEAN.H) return;
  const q = y * LEAN.W + x, dz = LEANBUF.depth[q]; if (dz > 0 && d < dz + 0.4) LEANBUF.idx[q] = c;
}
function propSprites(S, C, xl, xr, o) {
  const t = o.t || 0;
  if (S.bowl != null) {   // on the couch's near armrest
    const p = propAt(C, 26.6, 131.2, 12); if (p) { const k = C.f / p.d, rw = 1.9 * k, rh = 1.5 * k, top = p.sy - rh;
      for (let j = 0; j <= rh; j++) { const hw = rw * Math.sqrt(Math.max(0, 1 - (j / rh) ** 2)) * (1 - j / rh * 0.25); for (let i = -hw; i <= hw; i++) propPut(p.sx + i, top + j, p.d, Math.abs(Math.abs(i) - hw) < 1 || j >= rh - 0.6 ? HC.plum : (i < -hw * 0.3 ? HC.pink : HC.rose), xl, xr); }
      const fill = S.bowl, mh = fill * 1.3 * k;   // the chips: a mound over the rim, then level, then crumbs
      for (let j = -mh; j <= 0.5; j++) { const hw = rw * 0.9 * (fill > 0.6 ? Math.sqrt(Math.max(0, 1 + j / Math.max(1, mh))) : 1); for (let i = -hw; i <= hw; i++) { const x = p.sx + i, y = top + j; if (fill <= 0.05) { if (((Math.round(x) * 7 + Math.round(y) * 3) % 11) === 0 && j > -0.5) propPut(x, y + 1, p.d - 0.1, HC.tan, xl, xr); continue; } if (j > 0 && fill < 0.6 && Math.abs(i) > hw * 0.75) continue; propPut(x, y, p.d - 0.1, (Math.round(x) + Math.round(y)) & 1 ? HC.gold : HC.tan, xl, xr); } }
      if (fill <= 0.05) for (let i = -rw * 0.85; i <= rw * 0.85; i++) propPut(p.sx + i, top, p.d - 0.1, HC.plum, xl, xr);
    }
  }
  if (S.wine != null) {   // the wine glass on the tub's foot end, the wine going down
    const p = propAt(C, 45.4, 94.6, 10); if (p) { const k = C.f / p.d, bw = 1.15 * k, bh = 2.4 * k, sh = 1.7 * k, base = p.sy;
      for (let j = 0; j < sh; j++) propPut(p.sx, base - j, p.d, HC.lilac, xl, xr); for (let i = -bw * 0.6; i <= bw * 0.6; i++) propPut(p.sx + i, base, p.d, HC.lilac, xl, xr);
      const bt = base - sh - bh;
      for (let j = 0; j <= bh; j++) { const f = j / bh, hw = bw * (f < 0.7 ? 0.7 + f * 0.43 : 1 - (f - 0.7) * 0.9); const wine = j <= bh * S.wine;
        for (let i = -hw; i <= hw; i++) { const edge = Math.abs(Math.abs(i) - hw) < 1; propPut(p.sx + i, base - sh - j, p.d, edge ? HC.lilac : wine ? (i < 0 ? HC.crimson : HC.plum) : ((Math.round(i) + j) % 3 === 0 ? HC.lilac : -1) , xl, xr); } }
      if (S.wine > 0.08) for (let i = -bw * 0.9; i <= bw * 0.9; i++) propPut(p.sx + i, base - sh - bh * S.wine, p.d - 0.05, HC.rose, xl, xr);
      void bt;
    }
  }
  if (S.candles) for (const [cy, h] of [[91.35, 1], [92.55, 0.8]]) {   // their flames flicker
    const p = propAt(C, 45.35, cy, 10 + S.candles * h); if (!p) continue; const k = C.f / p.d, fl = Math.sin(t * 13 + cy) > 0.3 ? 1 : 0;
    const fh = Math.max(3, 1.1 * k), fw = Math.max(1, 0.35 * k);
    for (let j = 0; j < fh; j++) { const hw = fw * Math.sin(Math.PI * (j + 1) / (fh + 1)); for (let i = -hw; i <= hw; i++) propPut(p.sx + i + (j > fh * 0.6 ? fl : 0), p.sy - 1 - j, p.d - 0.2, j < fh * 0.35 ? HC.moon : HC.gold, xl, xr); }
  }
  // the kettle: its light on while it boils (off at the click), the steam growing
  const kp = propAt(C, 114.6, 63, 18.5); if (kp) propPut(kp.sx, kp.sy, kp.d - 0.1, S.act === 'kitchen' && S.stage < 2 ? HC.cyan : LC.s2, xl, xr);
  if (S.steam > 0) {
    const n = Math.round(4 + S.steam * 14);
    for (let k = 0; k < n; k++) {
      const ph = ((t * 0.45 + k / n) % 1), rise = ph * (6 + S.steam * 14), sway = Math.sin(ph * 6 + k) * (0.6 + ph * 1.5);
      const p = propAt(C, 113 + sway * 0.4, 63 + sway, 21 + rise); if (!p) continue;
      const r = (0.5 + ph * (0.8 + S.steam * 1.6)) * C.f / p.d;
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (i * i + j * j > r * r) continue; const x = Math.round(p.sx + i), y = Math.round(p.sy + j); if (((x + y) & 1) && ph > 0.25) continue; if (ph > 0.7 && (x * 3 + y) % 4) continue; propPut(x, y, p.d, i + j < 0 ? HC.moon : HC.beige, xl, xr); }
    }
  }
}
// the hall mirror in her steam: a pale wash, only her shape showing through as a darker blur
function fogMirror(xl, xr, t) {
  const W = LEAN.W, { idx, depth, her } = LEANBUF;
  for (let y = 0; y < LEAN.H; y++) for (let x = xl; x < xr; x++) {
    const q = y * W + x; if (depth[q] >= 0) continue;
    let nh = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const qq = q + dy * W + dx; if (qq >= 0 && qq < her.length && her[qq]) nh++; }
    const b = BAYER8[((y & 7) << 3) | (x & 7)] / 64, drip = (x * 13) % 17 === 0 && ((y + Math.floor(t * 3)) % 40) < 6;
    idx[q] = nh > 10 ? (b < 0.5 ? HC.purple : HC.lilac) : nh > 3 ? (b < 0.3 ? HC.purple : HC.lilac) : drip ? HC.lilac : b < 0.18 ? HC.lilac : b < 0.6 ? HC.beige : HC.moon;
  }
}
// Show grid: the horizon, the hallway's vanishing point, the floor's 8-unit grid where the floor is in view
function leanGrid(ctx, C, xl, xr) {
  ctx.fillStyle = '#81c1c8';
  for (let x = 0; x < LEAN.W; x += 4) ctx.fillRect(x, Math.round(C.hy), 2, 1);
  const vx = C.cx + C.f * (-C.R[0]) / (-C.F[0]);
  if (vx > -50 && vx < LEAN.W + 50) { ctx.fillRect(Math.round(vx) - 4, Math.round(C.hy), 9, 1); ctx.fillRect(Math.round(vx), Math.round(C.hy) - 4, 1, 9); }
  for (let sx = xl; sx < xr; sx++) {
    const dx = C.F[0] + C.R[0] * (sx - C.cx) / C.f, dy = C.F[1] + C.R[1] * (sx - C.cx) / C.f;
    for (let y = Math.ceil(C.hy) + 1; y < LEAN.H; y++) {
      const tf = C.z * C.f / (y - C.hy), dz = LEANBUF.depth[y * LEAN.W + sx]; if (Math.abs(dz - tf) > 0.3) continue;
      const wx = C.E[0] + dx * tf, wy = C.E[1] + dy * tf, mx = ((wx % 8) + 8) % 8, my = ((wy % 8) + 8) % 8, e = 0.0025 * tf;
      if (mx < e || mx > 8 - e || my < e || my > 8 - e) ctx.fillRect(sx, y, 1, 1);
    }
  }
}
// the UI over the lean: the red bar (she can see you) at the top, over the slit, where the eyes are; the lean's stops
// at the bottom. The bar fills faster the wider the slit (x1 at 24 px to x2.5 at 160), x1.5 more while you focus.
function leanUI(ctx, o, w, xl, xr) {
  const crim = '#d23c5a', t = o.t || 0, look = o.look || 'busy';
  const rate = (1 + 1.5 * (w - 24) / 136) * (o.focus ? 1.5 : 1);
  const fill = o.bar != null ? o.bar : look === 'sees' ? Math.min(1, (t % 3.2) * 0.28 * rate) : 0;   // the game passes its bar
  const bw = 72, bx = Math.round(LEAN.cx - bw / 2 + 7), by = 9;
  // the eye: shut while she's busy, half open at her tell, open and red when she sees you
  const ex = bx - 14, ey = by + 2;
  ctx.fillStyle = '#0a0814'; ctx.fillRect(ex - 2, by - 3, bw + 18, 10);
  ctx.fillStyle = look === 'busy' ? '#525a65' : crim;
  if (look === 'busy') ctx.fillRect(ex, ey, 9, 1);
  else { const open = look === 'tell' ? (Math.sin(t * 9) > 0 ? 1 : 2) : 2; ctx.fillRect(ex + 2, ey - open, 5, 1); ctx.fillRect(ex, ey, 9, 1); ctx.fillRect(ex + 2, ey + open, 5, 1); ctx.fillRect(ex + 1, ey - 1, 1, 1); ctx.fillRect(ex + 7, ey - 1, 1, 1); ctx.fillRect(ex + 1, ey + 1, 1, 1); ctx.fillRect(ex + 7, ey + 1, 1, 1); if (open > 1) ctx.fillRect(ex + 4, ey - 1, 2, 3); }
  ctx.fillStyle = '#363b44'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6); ctx.fillStyle = '#0a0814'; ctx.fillRect(bx, by, bw, 4);
  if (fill > 0) { ctx.fillStyle = crim; ctx.fillRect(bx, by, Math.round(bw * fill), 4); ctx.fillStyle = '#e88a9c'; ctx.fillRect(bx, by, Math.round(bw * fill), 1); }
  if (look === 'tell') { ctx.fillStyle = crim; for (let x = 0; x < bw; x += 4) if (Math.sin(t * 9) > 0) ctx.fillRect(bx + x, by + 1, 2, 2); }
  // the lean's stops: 1 2 3 in her pink, a gold tick under where you are
  const st = LEAN_STOPS, sy = LEAN.H - 14, sx0 = Math.max(14, xl - 120);
  ctx.fillStyle = '#0a0814'; ctx.fillRect(sx0 - 4, sy - 3, 88, 11);
  st.slice(0, 4).forEach((s, k) => { const x = sx0 + k * 26; if (k < 3) text9(ctx, s.k, x, sy - 1); else { ctx.fillStyle = '#d9a69c'; ctx.fillRect(x - 1, sy - 1, 5, 6); ctx.fillStyle = '#0a0814'; ctx.fillRect(x, sy, 3, 4); } });
  const u = o.u ?? 0.38; let px = sx0; for (let k = 0; k < 3; k++) if (u > st[k].u) px = sx0 + (k + Math.min(1, (u - st[k].u) / (st[k + 1].u - st[k].u))) * 26; if (u > st[3].u) px = sx0 + 78 + Math.min(1, (u - st[3].u) / (1 - st[3].u)) * 6;
  ctx.fillStyle = '#f1a934'; ctx.fillRect(Math.round(px), sy + 6, 3, 1);
}
// a digit in her pink (Tiny5 isn't drawn on this canvas: 3 x 5 pixel digits)
const DIG9 = { 1: ['.x.', 'xx.', '.x.', '.x.', 'xxx'], 2: ['xx.', '..x', '.x.', 'x..', 'xxx'], 3: ['xx.', '..x', '.x.', '..x', 'xx.'] };
function text9(ctx, ch, x, y) { ctx.fillStyle = '#d9a69c'; DIG9[ch].forEach((r, j) => [...r].forEach((c, i) => { if (c === 'x') ctx.fillRect(x + i, y + j, 1, 1); })); }

// her leg up on the tub's foot end: the knee over the foam, the calf on the rim, the foot past it, sole toward you
function bathLeg(C, xl, xr) {
  const hp = camProj(C, 31, 93, 7), kn = camProj(C, 37, 91.4, 15.8), an = camProj(C, 37.8, 87.4, 10.9), toe = camProj(C, 38.2, 85.4, 7.2);
  if (kn.d <= 1 || an.d <= 1) return;
  const x0 = Math.floor(Math.min(hp.sx, kn.sx, an.sx, toe.sx)) - 16, y0 = Math.floor(Math.min(hp.sy, kn.sy, an.sy, toe.sy)) - 16;
  const W = Math.ceil(Math.max(hp.sx, kn.sx, an.sx, toe.sx)) + 16 - x0, H = Math.ceil(Math.max(hp.sy, kn.sy, an.sy, toe.sy)) + 16 - y0;
  const k = (p) => C.f / p.d, sk = KIT.skin;
  const shapes = [
    { cap: [hp.sx - x0, hp.sy - y0, kn.sx - x0, kn.sy - y0, 2.4 * k(hp), 1.8 * k(kn)], ...sk },
    { cap: [kn.sx - x0, kn.sy - y0, an.sx - x0, an.sy - y0, 1.75 * k(kn), 1.15 * k(an)], ...sk },
    { ell: [kn.sx - x0, kn.sy - y0, 1.9 * k(kn), 1.7 * k(kn)], ...sk },
    { cap: [an.sx - x0, an.sy - y0, toe.sx - x0, toe.sy - y0, 1.05 * k(an), 0.85 * k(toe)], ...sk },
    { ell: [toe.sx - x0, toe.sy - y0, 0.9 * k(toe), 1.5 * k(toe)], fill: HC.skin, shade: HC.pink, line: HC.brown, cut: 0.1 },
  ];
  const I = PHONEOS.vPaint(W, H, () => -1, shapes);
  // her toes, a row of little pads over the sole
  const tx = toe.sx - x0, ty = toe.sy - y0 + 1.3 * k(toe); for (let i = -1; i <= 1; i++) { const x = Math.round(tx + i * 0.45 * k(toe)), y = Math.round(ty); if (x >= 0 && x < W && y >= 0 && y < H) I[y * W + x] = HC.pink; }
  blitFig({ I, w: W, h: H }, x0, y0, kn.d - 1.5, xl, xr, false);
}
