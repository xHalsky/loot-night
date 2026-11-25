// ===========================================================================
// Energy break: five hands-on steps in a window over the right screen. It is real life, so it is the desk's world:
// Graphite neutrals lit by the monitor (its light takes the screen's colour), the can in its own print colours.
// Every scene is ray-cast through one pinhole camera (world in cm: X right, Y up, Z toward you; the desk's front
// edge at Z = 0, the floor at Y = 0), so desk, drawer, floor, room and cans share one perspective by construction.
// Sprites from the can canvas (variant B, Chest Burst) are used where the camera matches the angle they were drawn
// at; elsewhere the can is a ray-cast cylinder wrapped in the 36 x 87 sprite, the lid drawn in the desk's greys.
// ===========================================================================
const EB_WIN = [46, 30, 400, 300], EB_SC = [50, 68], EBW = 392, EBH = 258;
const EB_STEPS = [
  { name: 'Drawer', say: 'Pull the drawer open.' },
  { name: 'Grab', say: 'Drag a can to its spot on the desk.' },
  { name: 'Open', say: 'Pull the tab up.' },
  { name: 'Drink', say: 'Hold the can at his mouth. Hold Space to tilt, let go to tilt back.' },
  { name: 'Toss', say: 'One throw. A miss stays on the floor.' },
];
const EB_RGB = EB_PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const EBI = Object.fromEntries(EB_PAL.map((h, k) => [h, k]));       // hex -> index
const EBX = { a1: EBI['#0f2a22'], a2: EBI['#1d4f26'], a3: EBI['#3b8424'], a4: EBI['#7cc21f'], a5: EBI['#b8e637'], a6: EBI['#e6f58c'], plum: EBI['#452750'], plumD: EBI['#241939'] };
let EB_LUT = null;
const ebLUT = () => EB_LUT || (EB_LUT = makePalSet(EB_PAL, DESK_RAMPS, EB_PAL.length).LUT);
const EB_SPR = {};
for (const [k, [w, h, b64]] of Object.entries(EB_SPR_SRC)) { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); EB_SPR[k] = { w, h, a }; }

// ---------------------------------------------------------------- camera
// yaw 0 looks toward -Z (at the wall behind the desk); pitch > 0 looks down
function ebCam(E, yaw, pitch, f, cx, cy) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cw = Math.cos(yaw), sw = Math.sin(yaw);
  const F = [sw * cp, -sp, -cw * cp], R = [cw, 0, sw], U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  return { E, F, R, U, f, cx, cy };
}
function camP(C, X, Y, Z) {
  const dx = X - C.E[0], dy = Y - C.E[1], dz = Z - C.E[2], z = dx * C.F[0] + dy * C.F[1] + dz * C.F[2];
  return [C.cx + (C.f * (dx * C.R[0] + dy * C.R[1] + dz * C.R[2])) / z, C.cy - (C.f * (dx * C.U[0] + dy * C.U[1] + dz * C.U[2])) / z, z];
}
// vanishing point of a world direction (null if it runs parallel to the picture)
function camVP(C, d) {
  const z = d[0] * C.F[0] + d[1] * C.F[1] + d[2] * C.F[2]; if (Math.abs(z) < 1e-6) return null;
  return [C.cx + (C.f * (d[0] * C.R[0] + d[1] * C.R[1] + d[2] * C.R[2])) / z, C.cy - (C.f * (d[0] * C.U[0] + d[1] * C.U[1] + d[2] * C.U[2])) / z];
}

// ---------------------------------------------------------------- ray caster
// prims: boxes (axis-aligned), capped cylinders (any axis, top optionally open), ellipsoids, discs. Each has a
// shader sh(h) that writes OUT (value + material, or an RGB colour for sprite texels) and may read the light.
const OUT = { v: 0, m: 0, e: 0, rgb: false, r: 0, g: 0, b: 0, i: -1 };
const HT = { t: 0, P: [0, 0, 0], N: [0, 0, 0], face: 0, h: 0, su: 0, cu: 0, inner: false, q: null, D: [0, 0, 0] };
const box = (a, b, sh, o = {}) => ({ k: 0, a, b, sh, sw: o.shadow !== false, ...o });
const rCyl = (o_, ax, L, r, sh, o = {}) => { const n = Math.hypot(...ax); return { k: 1, o: o_, A: ax.map((v) => v / n), L, r, sh, sw: o.shadow !== false, ...o }; };
const ell = (c, r, sh, o = {}) => ({ k: 2, c, r, sh, sw: o.shadow !== false, ...o });
let RT_T = 0, RT_F = 0, RT_H = 0, RT_SU = 0, RT_CU = 0, RT_IN = false, RT_NX = 0, RT_NY = 0, RT_NZ = 0;
function hitPrim(q, ox, oy, oz, dx, dy, dz, tmax) {
  if (q.k === 0) {
    let t0 = 1e-3, t1 = tmax, f = -1;
    const a = q.a, b = q.b;
    if (dx === 0) { if (ox < a[0] || ox > b[0]) return false; } else { let ta = (a[0] - ox) / dx, tb = (b[0] - ox) / dx, fn = 0; if (ta > tb) { const s = ta; ta = tb; tb = s; fn = 1; } if (ta > t0) { t0 = ta; f = fn; } if (tb < t1) t1 = tb; if (t0 > t1) return false; }
    if (dy === 0) { if (oy < a[1] || oy > b[1]) return false; } else { let ta = (a[1] - oy) / dy, tb = (b[1] - oy) / dy, fn = 2; if (ta > tb) { const s = ta; ta = tb; tb = s; fn = 3; } if (ta > t0) { t0 = ta; f = fn; } if (tb < t1) t1 = tb; if (t0 > t1) return false; }
    if (dz === 0) { if (oz < a[2] || oz > b[2]) return false; } else { let ta = (a[2] - oz) / dz, tb = (b[2] - oz) / dz, fn = 4; if (ta > tb) { const s = ta; ta = tb; tb = s; fn = 5; } if (ta > t0) { t0 = ta; f = fn; } if (tb < t1) t1 = tb; if (t0 > t1) return false; }
    if (f < 0) return false;
    RT_T = t0; RT_F = f; RT_NX = f === 0 ? -1 : f === 1 ? 1 : 0; RT_NY = f === 2 ? -1 : f === 3 ? 1 : 0; RT_NZ = f === 4 ? -1 : f === 5 ? 1 : 0; return true;
  }
  if (q.k === 1) {
    const A = q.A, wx = ox - q.o[0], wy = oy - q.o[1], wz = oz - q.o[2];
    const dA = dx * A[0] + dy * A[1] + dz * A[2], wA = wx * A[0] + wy * A[1] + wz * A[2];
    const px = dx - dA * A[0], py = dy - dA * A[1], pz = dz - dA * A[2], qx = wx - wA * A[0], qy = wy - wA * A[1], qz = wz - wA * A[2];
    const a2 = px * px + py * py + pz * pz, b2 = 2 * (px * qx + py * qy + pz * qz), c2 = qx * qx + qy * qy + qz * qz - q.r * q.r;
    let best = tmax, f = -1, hh = 0;
    if (a2 > 1e-12) {
      const disc = b2 * b2 - 4 * a2 * c2;
      if (disc >= 0) {
        const s = Math.sqrt(disc), t1 = (-b2 - s) / (2 * a2), t2 = (-b2 + s) / (2 * a2);
        const h1 = wA + t1 * dA; if (t1 > 1e-3 && t1 < best && h1 >= 0 && h1 <= q.L) { best = t1; f = 0; hh = h1; }
        if (q.open && f < 0) { const h2 = wA + t2 * dA; if (t2 > 1e-3 && t2 < best && h2 >= 0 && h2 <= q.L) { best = t2; f = 3; hh = h2; } }
      }
    }
    if (Math.abs(dA) > 1e-12) {
      for (const [hc, ff] of q.open ? [[0, 1]] : [[0, 1], [q.L, 2]]) {
        const t = (hc - wA) / dA; if (t <= 1e-3 || t >= best) continue;
        const ex = qx + t * px, ey = qy + t * py, ez = qz + t * pz; if (ex * ex + ey * ey + ez * ez <= q.r * q.r) { best = t; f = ff; hh = hc; }
      }
    }
    if (f < 0) return false;
    RT_T = best; RT_F = f; RT_H = hh; RT_IN = f === 3;
    if (f === 1) { RT_NX = -A[0]; RT_NY = -A[1]; RT_NZ = -A[2]; } else if (f === 2) { RT_NX = A[0]; RT_NY = A[1]; RT_NZ = A[2]; }
    else { const nx = qx + best * px, ny = qy + best * py, nz = qz + best * pz, n = Math.hypot(nx, ny, nz) * (f === 3 ? -1 : 1); RT_NX = nx / n; RT_NY = ny / n; RT_NZ = nz / n; }
    return true;
  }
  if (q.k === 2) {
    const r = q.r, cx_ = (ox - q.c[0]) / r[0], cy_ = (oy - q.c[1]) / r[1], cz_ = (oz - q.c[2]) / r[2], ex = dx / r[0], ey = dy / r[1], ez = dz / r[2];
    const a2 = ex * ex + ey * ey + ez * ez, b2 = 2 * (cx_ * ex + cy_ * ey + cz_ * ez), c2 = cx_ * cx_ + cy_ * cy_ + cz_ * cz_ - 1, disc = b2 * b2 - 4 * a2 * c2;
    if (disc < 0) return false;
    const t = (-b2 - Math.sqrt(disc)) / (2 * a2); if (t <= 1e-3 || t >= tmax) return false;
    const py_ = oy + t * dy; if (q.ymin != null && py_ < q.ymin) return false;
    const nx = (cx_ + t * ex) / r[0], ny = (cy_ + t * ey) / r[1], nz = (cz_ + t * ez) / r[2], n = Math.hypot(nx, ny, nz);
    RT_T = t; RT_F = 0; RT_NX = nx / n; RT_NY = ny / n; RT_NZ = nz / n; return true;
  }
  if (q.k === 4) {   // torus round the Z axis through c (major R, minor r): sphere-traced within its bounding sphere
    const ox_ = ox - q.c[0], oy_ = oy - q.c[1], oz_ = oz - q.c[2], B = q.R + q.r, b = ox_ * dx + oy_ * dy + oz_ * dz, c = ox_ * ox_ + oy_ * oy_ + oz_ * oz_ - B * B, d = b * b - c;
    if (d < 0) return false;
    let t = Math.max(1e-3, -b - Math.sqrt(d)); const t1 = Math.min(tmax, -b + Math.sqrt(d));
    for (let k = 0; k < 64 && t < t1; k++) {
      const px = ox_ + t * dx, py = oy_ + t * dy, pz = oz_ + t * dz, kq = Math.hypot(px, py), sd = Math.hypot(kq - q.R, pz) - q.r;
      if (sd < 0.004) { const f = 1 - q.R / kq, nx = px * f, ny = py * f, n = Math.hypot(nx, ny, pz); RT_T = t; RT_F = 0; RT_NX = nx / n; RT_NY = ny / n; RT_NZ = pz / n; return true; }
      t += sd;
    }
    return false;
  }
  if (q.k === 3) {   // disc: centre c, normal n (unit), radius r; or an infinite plane when r is 0
    const n = q.n, dn = dx * n[0] + dy * n[1] + dz * n[2]; if (Math.abs(dn) < 1e-9) return false;
    const t = ((q.c[0] - ox) * n[0] + (q.c[1] - oy) * n[1] + (q.c[2] - oz) * n[2]) / dn; if (t <= 1e-3 || t >= tmax) return false;
    if (q.r) { const ex = ox + t * dx - q.c[0], ey = oy + t * dy - q.c[1], ez = oz + t * dz - q.c[2]; if (ex * ex + ey * ey + ez * ez > q.r * q.r) return false; }
    RT_T = t; RT_F = 0; const s = dn < 0 ? 1 : -1; RT_NX = n[0] * s; RT_NY = n[1] * s; RT_NZ = n[2] * s; return true;
  }
  return false;
}
const disc = (c, n, r, sh, o = {}) => ({ k: 3, c, n, r, sh, sw: o.shadow !== false, ...o });
// nearest hit along a ray; fills HT
function rtCast(prims, ox, oy, oz, dx, dy, dz, tmax = 1e9) {
  let best = tmax, q0 = null, f = 0, h = 0, inn = false, nx = 0, ny = 0, nz = 0;
  for (let k = 0; k < prims.length; k++) {
    const q = prims[k]; if (q.off) continue;
    if (hitPrim(q, ox, oy, oz, dx, dy, dz, best)) { best = RT_T; q0 = q; f = RT_F; h = RT_H; inn = RT_IN; nx = RT_NX; ny = RT_NY; nz = RT_NZ; }
  }
  if (!q0) return null;
  HT.t = best; HT.q = q0; HT.face = f; HT.h = h; HT.inner = inn; HT.P[0] = ox + best * dx; HT.P[1] = oy + best * dy; HT.P[2] = oz + best * dz; HT.N[0] = nx; HT.N[1] = ny; HT.N[2] = nz; HT.D[0] = dx; HT.D[1] = dy; HT.D[2] = dz;
  return HT;
}
function rtBlocked(prims, ox, oy, oz, dx, dy, dz, tmax) {
  for (let k = 0; k < prims.length; k++) { const q = prims[k]; if (q.off || !q.sw) continue; if (hitPrim(q, ox, oy, oz, dx, dy, dz, tmax)) return true; }
  return false;
}
// the scene's light at a point: ambient + lights (soft cosine, falloff, optional emitter facing), hard shadows
let RT_SCENE = null;
function ebLight(P, N, o = {}) {
  const S = RT_SCENE; let s = S.amb;
  for (const L of S.lights) {
    let lx = L.p[0] - P[0], ly = L.p[1] - P[1], lz = L.p[2] - P[2]; const d = Math.hypot(lx, ly, lz); lx /= d; ly /= d; lz /= d;
    let k = lx * N[0] + ly * N[1] + lz * N[2]; if (k <= 0) continue;
    k = k * 0.7 + 0.3 * k * k;
    if (L.face) { const e = -(lx * L.face[0] + ly * L.face[1] + lz * L.face[2]); if (e <= 0) continue; k *= 0.35 + 0.65 * e; }
    k *= L.i / (1 + (d / L.r) * (d / L.r));
    if (k > 0.01 && L.shadow !== false && !o.noShadow && rtBlocked(S.prims, P[0] + N[0] * 0.08, P[1] + N[1] * 0.08, P[2] + N[2] * 0.08, lx, ly, lz, d)) k *= L.sk ?? 0.12;
    s += k;
  }
  return s;
}

// ---------------------------------------------------------------- the scene buffer
function ebBuf() {
  const n = EBW * EBH, F = mkBuf(EBW, EBH, true);
  F.O = new Int32Array(n); F.S = new Uint8Array(n); F.R = new Float32Array(n); F.Gc = new Float32Array(n); F.Bc = new Float32Array(n); F.Z = new Float32Array(n).fill(1e9);
  return F;
}
function ebCopy(dst, src) { for (const k of ['V', 'M', 'E', 'S', 'R', 'Gc', 'Bc', 'Z']) dst[k].set(src[k]); dst.I.fill(-1); dst.G.fill(1); dst.A.fill(0); }
// cast every pixel of a rectangle; only pixels whose hit is nearer than the buffer's depth are written
function ebCastRect(F, C, prims, x0 = 0, y0 = 0, x1 = EBW, y1 = EBH, depthTest = false) {
  const E = C.E;
  for (let y = Math.max(0, y0 | 0); y < Math.min(EBH, Math.ceil(y1)); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(EBW, Math.ceil(x1)); x++) {
    const a = (x + 0.5 - C.cx) / C.f, b = -(y + 0.5 - C.cy) / C.f;
    let dx = C.F[0] + C.R[0] * a + C.U[0] * b, dy = C.F[1] + C.R[1] * a + C.U[1] * b, dz = C.F[2] + C.R[2] * a + C.U[2] * b; const n = Math.hypot(dx, dy, dz); dx /= n; dy /= n; dz /= n;
    const i = y * EBW + x, h = rtCast(prims, E[0], E[1], E[2], dx, dy, dz, depthTest ? F.Z[i] : 1e9);
    if (!h) continue;
    OUT.v = 0; OUT.m = M_STONE; OUT.e = 0; OUT.rgb = false; OUT.i = -1;
    if (h.q.sh(h, x, y) === false) continue;
    F.Z[i] = h.t; F.A[i] = 1;
    if (OUT.i >= 0) { F.I[i] = OUT.i; F.S[i] = 0; continue; }
    if (OUT.rgb) { F.S[i] = 1; F.R[i] = OUT.r; F.Gc[i] = OUT.g; F.Bc[i] = OUT.b; F.E[i] = OUT.e; }
    else { F.S[i] = 0; F.V[i] = OUT.v; F.M[i] = OUT.m; F.E[i] = OUT.e; }
  }
}
// palette: materials quantise to the desk's own 34 colours; sprite texels to the desk + acid + print colours
function ebCompose(F, ctx, tint, str = 0.11) {
  const img = ctx.createImageData(EBW, EBH), D = img.data, set = deskSet('graphite'), R = set.RAMPS, dl = set.LUT, el = ebLUT();
  for (let y = 0; y < EBH; y++) for (let x = 0; x < EBW; x++) {
    const i = y * EBW + x, o = i * 4, ui = F.I[i];
    let q;
    if (ui >= 0) q = ui;
    else {
      const th = (BAYER8[((y & 7) << 3) | (x & 7)] - 0.5) * str, g = F.G[i];
      if (F.S[i] === 2) { const o2 = F.O[i], D2 = EB_SCREEN.data, k2 = 0.9; const r = (D2[o2] / 255) * k2 + th, gg = (D2[o2 + 1] / 255) * k2 + th, b = (D2[o2 + 2] / 255) * k2 + th; q = el[((r <= 0 ? 0 : r >= 1 ? 63 : (r * 63 + 0.5) | 0) << 12) | ((gg <= 0 ? 0 : gg >= 1 ? 63 : (gg * 63 + 0.5) | 0) << 6) | (b <= 0 ? 0 : b >= 1 ? 63 : (b * 63 + 0.5) | 0)]; }
      else if (F.S[i]) {
        const r = F.R[i] * tint[0] * g + th, gg = F.Gc[i] * tint[1] * g + th, b = F.Bc[i] * tint[2] * g + th;
        q = el[((r <= 0 ? 0 : r >= 1 ? 63 : (r * 63 + 0.5) | 0) << 12) | ((gg <= 0 ? 0 : gg >= 1 ? 63 : (gg * 63 + 0.5) | 0) << 6) | (b <= 0 ? 0 : b >= 1 ? 63 : (b * 63 + 0.5) | 0)];
      } else {
        const v = F.V[i] * g, Rm = R[F.M[i]] || R[0], k = (v <= 0 ? 0 : v >= 1 ? 255 : (v * 255) | 0) * 3, e = F.E[i];
        const r = Rm[k] * (e ? 1 : tint[0]) + th, gg = Rm[k + 1] * (e ? 1 : tint[1]) + th, b = Rm[k + 2] * (e ? 1 : tint[2]) + th;
        q = dl[((r <= 0 ? 0 : r >= 1 ? 63 : (r * 63 + 0.5) | 0) << 12) | ((gg <= 0 ? 0 : gg >= 1 ? 63 : (gg * 63 + 0.5) | 0) << 6) | (b <= 0 ? 0 : b >= 1 ? 63 : (b * 63 + 0.5) | 0)];
      }
    }
    const c = EB_RGB[q]; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
// the screen's colour, normalised, as a light tint (half strength: the room stays grey, the screen tints it)
function ebTint() { const m = MON_AVG, s = m[0] * 0.3 + m[1] * 0.55 + m[2] * 0.15 || 1; return m.map((c) => 1 + (c / s - 1) * 0.42); }

// ---------------------------------------------------------------- sprite texels
// the can's side: the 36 x 87 sprite wrapped round the cylinder (orthographic column mapping, label facing the
// camera); rows 5..83 are the side, 0..4 the lid's rim and 84..86 the base bevel in the drawing
// proportions from the can's drawing (its side is 161 px tall to 72 px wide), so sprite and cylinder agree
const CAN = { r: 3.62, L: 16.8, side0: 5, side1: 84 };
function sprTexel(s, u, v) {   // u, v in 0..1 -> sets OUT rgb, false if transparent
  const S = EB_SPR[s], x = Math.min(S.w - 1, Math.max(0, (u * S.w) | 0)), y = Math.min(S.h - 1, Math.max(0, (v * S.h) | 0)), k = S.a[y * S.w + x];
  if (k === 255) return false;
  const c = EB_RGB[k]; OUT.rgb = true; OUT.r = c[0] / 255; OUT.g = c[1] / 255; OUT.b = c[2] / 255; return true;
}
// camera-facing reference around a cylinder's axis at the hit (for the label and the lid's orientation)
function canFrame(h, E) {
  const q = h.q, A = q.A, cx = q.o[0] + A[0] * h.h, cy = q.o[1] + A[1] * h.h, cz = q.o[2] + A[2] * h.h;
  let rx = E[0] - cx, ry = E[1] - cy, rz = E[2] - cz; const d = rx * A[0] + ry * A[1] + rz * A[2]; rx -= d * A[0]; ry -= d * A[1]; rz -= d * A[2];
  const n = Math.hypot(rx, ry, rz) || 1; return [rx / n, ry / n, rz / n];
}
// a can: side wrapped in the sprite (lit softly so its own drawn light survives), the lid and base in desk greys
function canShader(E, o = {}) {
  const tex = o.tex || 'can38', open = o.open || 0;
  return (h) => {
    const q = h.q, A = q.A;
    if (h.face === 0) {
      const ref = canFrame(h, E), N = h.N;
      const s = (ref[1] * N[2] - ref[2] * N[1]) * A[0] + (ref[2] * N[0] - ref[0] * N[2]) * A[1] + (ref[0] * N[1] - ref[1] * N[0]) * A[2];
      const v = (CAN.side1 - (h.h / q.L) * (CAN.side1 - CAN.side0)) / EB_SPR[tex].h;
      if (!sprTexel(tex, 0.5 + 0.5 * s, v)) { OUT.v = 0.1; OUT.m = M_STONE; return; }
      const l = ebLight(h.P, N), k = clamp(0.32 + 0.62 * l, 0, 1.08);
      OUT.r *= k; OUT.g *= k; OUT.b *= k; return;
    }
    // caps: local 2D on the lid, 'fwd' toward the camera
    const c = h.face === 2 ? q.L : 0, cx = q.o[0] + A[0] * c, cy = q.o[1] + A[1] * c, cz = q.o[2] + A[2] * c;
    const ref = canFrame({ q, h: c }, E), side = [A[1] * ref[2] - A[2] * ref[1], A[2] * ref[0] - A[0] * ref[2], A[0] * ref[1] - A[1] * ref[0]];
    const px = h.P[0] - cx, py = h.P[1] - cy, pz = h.P[2] - cz, fu = px * ref[0] + py * ref[1] + pz * ref[2], su = px * side[0] + py * side[1] + pz * side[2], r = Math.hypot(fu, su);
    const l = ebLight(h.P, h.N), m = M_STONE;
    if (h.face === 1) { OUT.v = (r > 2.9 ? 0.34 : 0.2) * l; OUT.m = m; return; }
    let v;
    if (r > 3.0) v = 0.78;                                  // the rolled rim
    else if (r > 2.7) v = 0.42;                             // the groove inside it
    else v = 0.6 - 0.06 * (fu / 3);                         // the lid panel
    // the mouth (a rounded slot toward you) and the tab (from the rivet back)
    const mo = (fu - 1.55) / 0.85, ms = su / 1.05;
    if (mo * mo + ms * ms < 1) v = open ? 0.04 : 0.48;
    const tb = (fu + 0.35) / 1.55, ts = su / 0.62;
    if (!open && tb > -1 && tb < 1 && Math.abs(ts) < 1) v = Math.abs(ts) > 0.6 || Math.abs(tb) > 0.82 ? 0.86 : tb > 0.15 && tb < 0.55 && Math.abs(ts) < 0.4 ? 0.3 : 0.7;
    if (Math.hypot(fu - 0.1, su) < 0.32) v = 0.92;          // the rivet
    OUT.v = v * clamp(0.45 + 0.6 * l, 0, 1.2); OUT.m = m;
  };
}
// a lying can (axis along X): lid to the given side
const lyingCan = (x, y, z, dir, E, o) => rCyl(dir > 0 ? [x, y, z] : [x + CAN.L, y, z], [dir, 0, 0], CAN.L, CAN.r, canShader(E, o), o);

// ---------------------------------------------------------------- UI pieces drawn into scenes (palette-exact)
const CUR = {   // the game's cursor: an open hand and a grabbing fist, moon with an ink outline
  hand: ['..oo.....', '.o##ooo..', '.o#o##oo.', '.o#o#o#o.', 'oo#o#o#oo', 'o##o#o#o#o', 'o#######o', 'o######o.', '.o#####o.', '..o###o..', '...ooo...'],
  grab: ['.........', '..ooooo..', '.o#o#o#o.', 'oo#o#o#oo', 'o#######o', 'o#######o', 'o######o.', '.o#####o.', '..o###o..', '...ooo...'],
  arrow: ['o.......', 'oo......', 'o#o.....', 'o##o....', 'o###o...', 'o####o..', 'o#####o.', 'o###ooo.', 'o#o#o...', 'oo.o#o..', '....oo..'],
};
function ebCursor(kind, x, y) { spr(Math.round(x) - 4, Math.round(y) - 4, CUR[kind], { o: P.void, '#': P.moon }); }
// a dashed ring around a world circle (centre, radius, plane normal), projected point by point
function ebRing(C, c, r, n, idx, t = 0, dash = 5) {
  const a = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]], un = Math.hypot(...u);
  u[0] /= un; u[1] /= un; u[2] /= un; const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const pts = []; for (let k = 0; k < 160; k++) { const th = (k / 160) * Math.PI * 2, p = camP(C, c[0] + r * (u[0] * Math.cos(th) + v[0] * Math.sin(th)), c[1] + r * (u[1] * Math.cos(th) + v[1] * Math.sin(th)), c[2] + r * (u[2] * Math.cos(th) + v[2] * Math.sin(th))); pts.push(p); }
  let len = 0;
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k], p2 = pts[(k + 1) % pts.length]; len += Math.hypot(p2[0] - p[0], p2[1] - p[1]);
    if (Math.floor(len / dash + t * 2) % 2 === 0) putI(Math.floor(p[0]), Math.floor(p[1]), idx);
  }
}

// ---------------------------------------------------------------- shared materials
const lit = (h) => ebLight(h.P, h.N);
// the desk's wood, the same greige grain as the desk in the main view (grain runs left-right)
const woodV = (X, Z) => { let w = 0.36 + 0.1 * (vnoise(X * 0.05, Z * 0.58, 301) - 0.5) + 0.05 * (vnoise(X * 0.016, Z * 1.3, 302) - 0.5); const s = vnoise(X * 0.027, Z * 1.8, 303); if (s > 0.74) w -= 0.07; else if (s < 0.2) w += 0.05; return w; };
// laminate floor: planks along Z (toward you), 19 cm wide, staggered end joints
function floorV(X, Z) {
  const pw = 19, k = Math.floor(X / pw), fx = X - k * pw, off = hash(k, 0, 41) * 120, L = 128, fz = ((Z + off) % L + L) % L;
  let v = 0.25 + 0.05 * (hash(k, Math.floor((Z + off) / L), 42) - 0.5) + 0.06 * (vnoise(X * 0.09, Z * 0.012 + k * 7, 43) - 0.5);
  if (fx < 0.35 || fx > pw - 0.35 || fz < 0.3) v = 0.12;
  return v;
}
// a thin curve decal: distance from a point to a polyline (cm)
function polyDist(X, Z, pts) { let d = 1e9; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], vx = bx - ax, vz = bz - az, t = clamp(((X - ax) * vx + (Z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(X - ax - t * vx, Z - az - t * vz)); } return d; }
// a rotated rectangle decal: local coords or null
function rrect(X, Z, cx, cz, w, l, ang) { const c = Math.cos(ang), s = Math.sin(ang), x = (X - cx) * c + (Z - cz) * s, z = -(X - cx) * s + (Z - cz) * c; return Math.abs(x) <= w / 2 && Math.abs(z) <= l / 2 ? [x / w + 0.5, z / l + 0.5] : null; }

// ---------------------------------------------------------------- 1 Drawer + 2 Grab: one camera, looking down at the
// drawer from above and in front (58 degrees down). Desk top above the fold, the pedestal's top drawer below it.
// the can's spot sits 12 cm in from the desk's edge, right of the mouse mat; the camera stands back with a longer lens
// (54 degrees down) so the mouse, the can standing on its spot and the open drawer all fit, the drawer cans still 1:1
const DR = { open: 22, spot: [36.5, -12], cans: [-6, -13.4, -20.8] };
const DR_CAM = ebCam([26, 240, 130], 0, (54 * Math.PI) / 180, 1116, 196, 175);
const MOUSE = [5, -20];   // the mouse's centre on the mat, well back from the edge
const MOUSE_CABLE = [[5, -26.1], [5.4, -31], [7.6, -38], [6, -46], [2.4, -55], [3, -64]];
const DESK_CABLE = [[64, -52], [58, -46], [50, -40], [43, -35], [40, -31]];
const MUG = { c: [50, -22], r: 4.1, h: 9.5 };
function deskTopSh(h) {
  const [X, , Z] = h.P, l = lit(h);
  if (h.face === 5) { OUT.v = (h.P[1] > 74.4 ? 0.5 : 0.3) * l; OUT.m = M_UMBER; return; }
  if (h.face !== 3) { OUT.v = 0.06 * l; OUT.m = M_UMBER; return; }
  let v = woodV(X, Z), m = M_UMBER;
  // ring stains where the cans always go (a few, overlapping), crumbs, a receipt, two coins, the phone charger cable
  for (const [dx, dz, k] of [[0, 0, 0.07], [1.6, -1.1, 0.05], [-1.3, 0.7, 0.045], [0.6, 1.5, 0.035]]) { const r = Math.hypot(X - DR.spot[0] - dx, Z - DR.spot[1] - dz); if (Math.abs(r - 3.25) < 0.28) v -= k; }
  if (hash(Math.floor(X * 2.2), Math.floor(Z * 2.2), 61) > 0.985 && X > 20) v = 0.54;
  const rc = rrect(X, Z, 25.5, -19, 7.5, 12, 0.32);
  if (rc) { v = 0.6 + (rc[1] * 12 % 1.2 < 0.25 && rc[0] > 0.15 && rc[0] < 0.8 && rc[1] > 0.12 ? -0.18 : 0); if (rc[0] < 0.06 || rc[1] < 0.03) v -= 0.08; m = M_STONE; }
  for (const [cx, cz, r] of [[44.5, -4.6, 1.25], [46.6, -6.4, 1.0]]) { const d = Math.hypot(X - cx, Z - cz); if (d < r) { v = d > r - 0.25 ? 0.72 : 0.52 + 0.1 * ((X - cx) / r); m = M_STONE; } }
  const cd = polyDist(X, Z, DESK_CABLE); if (cd < 0.32) { v = cd < 0.12 ? 0.3 : 0.12; m = M_STONE; }
  OUT.v = v * l; OUT.m = m;
}
function matSh(h) {
  const [X, , Z] = h.P, l = lit(h);
  if (h.face !== 3) { OUT.v = 0.16 * l; OUT.m = M_STONE; return; }
  const ex = Math.min(18 - X, Z + 62, -1.2 - Z), st = ex > 0.55 && ex < 0.85 && Math.floor((18 - X < -1.2 - Z ? Z : X) * 1.6) % 2 === 0;
  let v = ex < 0.3 ? 0.24 : st ? 0.32 : 0.11 + 0.02 * (vnoise(X * 0.6, Z * 0.6, 9) - 0.5), m = st ? M_UMBER : M_STONE;
  const cd = polyDist(X, Z, MOUSE_CABLE); if (cd < 0.32) { v = cd < 0.14 ? ((Math.floor(Z * 3) & 1) ? 0.3 : 0.18) : 0.05; m = M_STONE; }   // braided
  OUT.v = v * l; OUT.m = m;
}
// a gaming mouse, matte black, no lights: a high palm hump, a flared thumb rest with two side buttons, a rubber-ridged
// wheel standing proud between split main buttons, a DPI button behind it, chevron panel seams, dotted rubber grips
function mouseSh(h) {
  const [X, Y, Z] = h.P, l = lit(h), N = h.N, dx = X - MOUSE[0], dz = Z - MOUSE[1];
  let v = 0.13 + 0.26 * Math.max(0, N[1]) ** 4 + 0.06 * Math.max(0, -N[2]);      // satin black: a sheen along the top (kept under the cold highlight, so nothing reads as a light)
  if (dz < -1.3 && Math.abs(dx) < 0.13 && N[1] > 0.3) v = 0.03;                                         // the split
  if (Math.abs(dz + 1.25 + 0.06 * dx * dx) < 0.12 && Math.abs(dx) < 2.7 && N[1] > 0.35) v = 0.03;     // the buttons' back seam
  if (Math.abs(dx) < 0.5 && dz > -1.0 && dz < 0.1 && N[1] > 0.75) v = Math.abs(dx) < 0.32 && dz > -0.85 && dz < -0.05 ? 0.3 : 0.04;   // DPI
  const ch = Math.abs(dx) * 0.85 + (dz - 2.6); if (Math.abs(ch) < 0.12 && Math.abs(dx) < 2.3 && N[1] > 0.3) v = 0.04;               // chevron seam
  if (Math.abs(N[0]) > 0.6 && N[1] < 0.55 && Y > 75.9) v = (Math.floor(Z * 2.4) + Math.floor(Y * 2.4)) & 1 ? 0.06 : 0.15;           // grips
  if (Y < 75.85) v = 0.04;
  OUT.v = v * l; OUT.m = M_STONE;
}
const wheelSh = (h) => { OUT.m = M_STONE; if (h.face !== 0) { OUT.v = 0.08 * lit(h); return; } const a = Math.atan2(h.N[1], h.N[2]); OUT.v = (Math.floor(a * 5) & 1 ? 0.3 : 0.08) * lit(h); };
const sideBtnSh = (h) => { OUT.m = M_STONE; OUT.v = (h.face === 0 ? 0.3 : h.face === 3 ? 0.34 : 0.1) * lit(h); };
function mousePrims() {
  const [x, z] = MOUSE, base = 75.3, Q = [];
  Q.push(ell([x, base, z], [3.2, 3.4, 6.1], mouseSh, { ymin: base }), ell([x + 0.2, base, z + 2.4], [3.05, 4.0, 3.5], mouseSh, { ymin: base }), ell([x - 2.9, base, z + 0.8], [1.6, 1.5, 4.3], mouseSh, { ymin: base }));
  Q.push(rCyl([x - 0.55, base + 2.35, z - 3.3], [1, 0, 0], 1.1, 1.15, wheelSh));
  Q.push(box([x - 3.45, base + 1.3, z - 2.6], [x - 2.75, base + 2.05, z - 0.5], sideBtnSh), box([x - 3.45, base + 1.3, z - 0.2], [x - 2.75, base + 2.05, z + 1.9], sideBtnSh));
  return Q;
}
const keySh = (h) => { const l = lit(h); OUT.m = M_STONE; OUT.v = (h.face === 3 ? 0.5 : h.face === 5 ? 0.24 : 0.3) * l; };
const caseSh = (h) => { OUT.m = M_STONE; OUT.v = (h.face === 3 ? 0.1 : 0.2) * lit(h); };
// a white glazed mug: a rolled rim, coffee inside with a glint, a round C handle
function mugSh(h) {
  const l = lit(h), q = h.q;
  if (h.face === 2) {
    const r = Math.hypot(h.P[0] - q.o[0], h.P[2] - q.o[2]);
    if (r > 3.7) { OUT.m = M_STONE; OUT.v = 0.95 * l; return; }
    if (r > 3.45) { OUT.m = M_STONE; OUT.v = 0.55 * l; return; }
    OUT.m = M_UMBER; OUT.v = (0.06 + (Math.hypot(h.P[0] - q.o[0] + 1.2, h.P[2] - q.o[2] + 1.3) < 0.75 ? 0.24 : 0)) * l; return;
  }
  if (h.face === 1) { OUT.m = M_STONE; OUT.v = 0.3 * l; return; }
  const y = (h.P[1] - q.o[1]) / q.L; OUT.m = M_STONE; OUT.v = (0.88 - 0.1 * (1 - y) + (y > 0.94 ? 0.06 : 0) - (y < 0.05 ? 0.25 : 0)) * l;
}
const glazeSh = (h) => { OUT.m = M_STONE; OUT.v = (0.84 + 0.08 * Math.max(0, h.N[1])) * lit(h); };
function mugPrims() {
  const [x, z] = MUG.c, Q = [rCyl([x, 75, z], [0, 1, 0], MUG.h, MUG.r, mugSh)];
  // the handle: a round loop on the mug's right side, standing out from the wall
  const hx = x + MUG.r + 1.15, hy = 75 + MUG.h * 0.52, R = 2.5;
  Q.push({ k: 4, c: [hx, hy, z], R, r: 0.66, sh: glazeSh, sw: true });   // a ring; its inner half is inside the mug's wall
  return Q;
}
function bagSh(h) {   // a crumpled crisp bag: silver foil, hard crinkles
  const [X, , Z] = h.P, l = lit(h), c = vnoise(X * 1.3, Z * 1.3, 71), c2 = vnoise(X * 3.1, Z * 2.7, 72);
  let v = 0.46 + 0.32 * (c > 0.6 ? 1 : c < 0.32 ? -0.55 : 0) + 0.12 * (c2 - 0.5);
  const lab = rrect(X, Z, 34, -25, 9, 4.6, -0.25); if (lab) { v = lab[0] > 0.12 && lab[0] < 0.88 && Math.abs(lab[1] - 0.5) < 0.16 ? 0.8 : 0.42 + 0.2 * (c - 0.5); OUT.m = lab[0] > 0.12 && lab[0] < 0.88 && Math.abs(lab[1] - 0.5) < 0.16 ? M_STONE : M_DANGER; OUT.v = v * l; return; }
  OUT.v = v * l; OUT.m = M_STONE;
}
const pedSh = (h) => { OUT.m = M_UMBER; OUT.v = (h.face === 5 ? 0.3 : h.face === 3 ? 0.34 : 0.18) * lit(h); };
// a drawer front: lacquered greige, a lit top lip, slightly darker toward its foot
const frontSh = (y0, y1) => (h) => { OUT.m = M_UMBER; const q = (h.P[1] - y0) / (y1 - y0); OUT.v = (h.face === 5 ? (q > 0.97 ? 0.44 : 0.27 + 0.06 * q) : h.face === 3 ? 0.42 : 0.2) * lit(h); };
const gapSh = (h) => { OUT.m = M_UMBER; OUT.v = 0.05 * lit(h); };
const handleSh = (h) => { OUT.m = M_STONE; OUT.v = (h.face === 3 ? 0.78 : h.face === 5 ? 0.5 : 0.36) * lit(h); };
function drawerSh(o) {
  return (h) => {
    const [X, Y, Z] = h.P, l = lit(h), zl = Z - o;   // zl: depth from the drawer's front
    if (h.face === 3 && Y < 57.2) {                   // the drawer's floor and what lies flat on it
      let v = 0.2 + 0.04 * (vnoise(X * 0.4, Z * 0.4, 81) - 0.5), m = M_UMBER;
      // a receipt, a sticky-note pad's peeled sheet, a coiled USB cable, AA batteries' shadow side is cast anyway
      const rc = rrect(X, zl, 37, -27, 7, 9.5, -0.4); if (rc) { v = 0.58 - (Math.floor(rc[1] * 14) % 2 && rc[0] > 0.2 && rc[0] < 0.75 ? 0.14 : 0); m = M_STONE; }
      const r = Math.hypot(X - 31, zl + 21); if (r > 2.2 && r < 4.4 && Math.abs(((r - 2.2) % 0.55) - 0.27) < 0.13) { v = 0.12; m = M_STONE; }
      const pad = rrect(X, zl, 38.5, -9, 6, 6, 0.12); if (pad) { v = pad[1] < 0.18 ? 0.45 : 0.68; m = M_LOOT; if (pad[1] > 0.4 && Math.abs(pad[0] - 0.5) < 0.3 && Math.floor(pad[1] * 10) % 3 === 0) v = 0.4; }
      OUT.v = v * l; OUT.m = m; return;
    }
    OUT.m = M_UMBER; OUT.v = (h.face === 3 ? 0.4 : h.face === 5 ? 0.32 : 0.22) * l;
  };
}
function padSh(h) { OUT.m = M_STONE; const [X, , Z] = h.P; let v = 0.14 + 0.08 * h.N[1]; if (h.face === 0 && h.N[1] > 0.7) { const c = h.q.c; const dx = X - c[0], dz = Z - c[2]; if (Math.hypot(dx + 2.4, dz + 0.2) < 0.9 || Math.hypot(dx - 1.2, dz - 1) < 0.9) v = 0.06; if (Math.hypot(dx - 2.6, dz + 0.8) < 0.38 || Math.hypot(dx - 3.3, dz + 0.1) < 0.38) v = 0.42; if (Math.abs(dx + 2.4) < 0.25 && Math.abs(dz + 1.9) < 0.7) v = 0.3; } OUT.v = v * lit(h); }
const battSh = (h) => { OUT.m = h.face === 0 && h.h < 1.2 ? M_STONE : M_LOOT; OUT.v = (h.face === 0 ? (h.h < 1.2 ? 0.55 : 0.5) : 0.5) * lit(h); };
function floorSh(h) {
  const [X, , Z] = h.P, l = lit(h); let v = floorV(X, Z), m = M_UMBER;
  const cd = polyDist(X, Z, [[-60, -40], [-30, -10], [-14, 6], [-2, 14], [-8, 30], [-30, 44]]); if (cd < 0.45) { v = cd < 0.18 ? 0.26 : 0.06; m = M_STONE; }
  const sock = rrect(X, Z, 70, 22, 9, 22, 0.6); if (sock && Math.hypot(sock[0] - 0.5, (sock[1] - 0.5) * 1.6) < 0.5) { v = 0.42 + 0.06 * (vnoise(X, Z, 5) - 0.5); m = M_STONE; }
  OUT.v = v * l; OUT.m = m;
}
function stripSh(h) {   // a power strip: pale casing, dark sockets, a red-lit switch
  const [X, , Z] = h.P, l = lit(h); OUT.m = M_STONE; let v = 0.5;
  if (h.face === 3) { const k = Math.floor((X + 44) / 5.6), fx = (X + 44) - k * 5.6; if (k >= 1 && k <= 4 && fx > 1.2 && fx < 4.4 && Math.abs(Z - 7.5) < 1.6) v = 0.1; if (k === 0 && fx > 1 && fx < 4 && Math.abs(Z - 7.5) < 1.4) { OUT.m = M_DANGER; OUT.v = 0.9; OUT.e = 1; return; } }
  else v = 0.32;
  OUT.v = v * l;
}
function drawerPrims(o, E, nCans = 3) {
  const Q = [];
  // the top drawer: front panel, box, a bar handle on two posts
  Q.push(box([4.4, 54.2, o - 1.8], [45.6, 71.6, o], frontSh(54.2, 71.6)));
  Q.push(box([6.2, 56, o - 37], [7.2, 69.5, o - 1.8], drawerSh(o)), box([42.8, 56, o - 37], [43.8, 69.5, o - 1.8], drawerSh(o)), box([6.2, 56, o - 37.5], [43.8, 69.5, o - 36.5], drawerSh(o)), box([6.2, 55.4, o - 37], [43.8, 57, o - 1.8], drawerSh(o)));
  Q.push(box([15, 62.4, o + 1.8], [35, 64.2, o + 3], handleSh), box([16, 62.6, o], [17.4, 64, o + 1.8], handleSh), box([32.6, 62.6, o], [34, 64, o + 1.8], handleSh));
  // three cans lying side by side, lids toward the middle (toward you, the eye is over x 26)
  DR.cans.slice(0, nCans).forEach((dz, k) => Q.push(lyingCan(8.6 - k * 0.3, 57 + CAN.r, o + dz, 1, E)));
  // a dead gamepad, AA batteries
  const gp = o - 15.5;
  Q.push(ell([33.5, 57, gp], [4.4, 1.7, 2.9], padSh, { ymin: 57 }), ell([29.6, 57, gp + 2], [1.8, 1.6, 2.6], padSh, { ymin: 57 }), ell([37.4, 57, gp + 2], [1.8, 1.6, 2.6], padSh, { ymin: 57 }));
  Q.push(rCyl([28.5, 57.7, o - 4], [0, 0, -1], 5, 0.72, battSh), rCyl([30.2, 57.7, o - 4.4], [0, 0, -1], 5, 0.72, battSh));
  return Q;
}
function deskPrims(E, o, nCans = 3) {
  const Q = [];
  Q.push(box([-95, 72, -82], [64, 75, 0], deskTopSh));
  Q.push(box([-95, 75, -62], [18, 75.3, -1.2], matSh));
  Q.push(box([-62, 75.3, -36], [-7, 77, -14], caseSh));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { if (r === 3 && c === 0) continue; const x0 = -27.5 + c * 1.95 + (r === 2 ? 0.95 : 0), z0 = -34 + r * 1.95; if (r === 2 && c === 3) continue; Q.push(box([x0, 77, z0], [x0 + 1.72, 78.1, z0 + 1.72], keySh)); }
  Q.push(...mousePrims(), ...mugPrims());
  // the pedestal (carcass, the lower drawer and its handle), the desk's right leg panel, the floor, a power strip
  Q.push(box([4, 0, -60], [5.6, 72, -0.3], pedSh), box([44.4, 0, -60], [46, 72, -0.3], pedSh), box([4, 0, -60], [46, 2.6, -0.3], pedSh), box([4, 52.4, -60], [46, 53.8, -2.2], gapSh), box([4, 0, -61], [46, 72, -60], pedSh));
  Q.push(box([4.4, 3, -1.8], [45.6, 52, 0], frontSh(3, 52)), box([15, 41, 1.8], [35, 42.8, 3], handleSh), box([16, 41.2, 0], [17.4, 42.6, 1.8], handleSh), box([32.6, 41.2, 0], [34, 42.6, 1.8], handleSh));
  Q.push(box([60, 0, -80], [62.5, 72, 0], pedSh));
  Q.push(box([-44, 0, 5.5], [-14, 3.4, 9.5], stripSh));
  Q.push(disc([0, 0, 0], [0, 1, 0], 0, floorSh));
  return Q.concat(drawerPrims(o, E, nCans));
}
// the monitor (cold, casts the shadows) and a soft fill from over your shoulder, so the dark room still reads
const MON_LIGHT = (o = {}) => [{ p: [-22, 108, -70], face: [0, 0, 1], i: o.i ?? 3.2, r: o.r ?? 120 }, { p: o.fill ?? [30, 200, 140], i: o.fi ?? 1.05, r: 300, shadow: false }];

// ---------------------------------------------------------------- baking and the per-step pictures
const EB_CACHE = new Map();
function ebBake(key, C, prims, lights, amb = 0.16) {
  let F = EB_CACHE.get(key); if (F) return F;
  RT_SCENE = { prims, lights, amb };
  F = ebBuf(); ebCastRect(F, C, prims); EB_CACHE.set(key, F); return F;
}
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const EBF = { buf: null, canvas: null };
let EB_GUIDES = false;
function ebLabel(s, x, y, idx = P.gold, align) { text(s, Math.round(x), Math.round(y), 'tiny', idx, { shadow: P.void, align }); }
function ebArrow(x, y, dir, idx = P.gold) { const rows = dir === 'down' ? ['.x.', '.x.', 'xxx', '.x.'] : ['.x.', 'xxx', '.x.', '.x.']; spr(Math.round(x) - 1, Math.round(y), rows.map((r) => r), { x: idx }); }

// 1 Drawer: the cursor grabs the handle and pulls; the drawer slides out on its runners
function ebDrawer(t) {
  const T = t % 3.4, pull = T < 0.9 ? 0 : T < 2.1 ? ease((T - 0.9) / 1.2) : 1, o = Math.round(pull * 8) * 3;
  const C = DR_CAM, base = ebBake('drawer' + o, C, deskPrims(C.E, o), MON_LIGHT());
  const F = EBF.buf; ebCopy(F, base); bind(F);
  const hp = camP(C, 25, 63.3, o + 3), rest = [hp[0] + 70, hp[1] + 40];
  if (T < 0.9) {
    const k = ease(T / 0.7), x = lerp(rest[0], hp[0], k), y = lerp(rest[1], hp[1], k);
    if (T > 0.2) { ebArrow(hp[0] + 34, hp[1] - 6, 'down'); ebLabel('pull', hp[0] + 39, hp[1] - 5); }
    ebCursor(T > 0.7 ? 'grab' : 'hand', x, y);
  } else ebCursor(T < 2.3 ? 'grab' : 'hand', hp[0], hp[1]);
  return C;
}
// 2 Grab: the front can comes up out of the drawer, turns upright on the way and lands on its spot (on the old rings)
function ebGrab(t) {
  const C = DR_CAM, o = DR.open, T = t % 4.4;
  const prims = deskPrims(C.E, o).filter((q) => !(q.k === 1 && q.L === CAN.L && Math.abs(q.o[2] - (o + DR.cans[0])) < 0.01));
  const base = ebBake('grab', C, prims, MON_LIGHT());
  const F = EBF.buf; ebCopy(F, base); bind(F);
  // the dragged can's path: from the drawer, up and over the desk edge, turning upright, down onto the spot
  const p0 = [8.6 + CAN.L / 2, 57 + CAN.r, o + DR.cans[0]], p1 = [DR.spot[0], 75 + CAN.L / 2, DR.spot[1]];
  const k = T < 0.8 ? 0 : T < 2.5 ? ease((T - 0.8) / 1.7) : 1, lift = Math.sin(Math.PI * Math.min(1, k)) * 16, settle = T < 2.5 ? 2 : T < 2.85 ? 2 * (1 - ease((T - 2.5) / 0.35)) : 0;
  const c = lerp3(p0, p1, k); c[1] += lift + settle;
  const turn = ease((k - 0.35) / 0.55), ax = [Math.cos(turn * Math.PI / 2), Math.sin(turn * Math.PI / 2), 0];
  const can = rCyl([c[0] - ax[0] * CAN.L / 2, c[1] - ax[1] * CAN.L / 2, c[2] - ax[2] * CAN.L / 2], ax, CAN.L, CAN.r, canShader(C.E));
  RT_SCENE = { prims: prims.concat([can]), lights: MON_LIGHT(), amb: 0.16 };
  const pa = camP(C, can.o[0], can.o[1], can.o[2]), pb = camP(C, can.o[0] + ax[0] * CAN.L, can.o[1] + ax[1] * CAN.L, can.o[2] + ax[2] * CAN.L), rr = 3.3 * C.f / Math.min(pa[2], pb[2]) + 3;
  ebCastRect(F, C, [can], Math.min(pa[0], pb[0]) - rr, Math.min(pa[1], pb[1]) - rr, Math.max(pa[0], pb[0]) + rr, Math.max(pa[1], pb[1]) + rr, true);
  const done = T >= 2.85, ring = [DR.spot[0], 75.02, DR.spot[1]], rp = camP(C, ring[0] + 5.2, ring[1], ring[2]);
  if (!done) { ebRing(C, ring, 4.6, [0, 1, 0], P.gold, t, 4); if (T > 0.2) ebLabel('put it here', rp[0] + 3, rp[1] - 3); }
  else { ebRing(C, ring, 4.6, [0, 1, 0], P.g5, 0, 99); glyph('check', Math.round(rp[0] + 3), Math.round(rp[1] - 2), P.g5); }
  const cp = camP(C, c[0], c[1] + (ax[1] > 0.5 ? CAN.L * 0.25 : CAN.r), c[2]), rest = [cp[0] + 60, cp[1] + 30];
  if (T < 0.8) { const e = ease(T / 0.6); ebCursor(T > 0.6 ? 'grab' : 'hand', lerp(rest[0], cp[0], e), lerp(rest[1], cp[1], e)); }
  else ebCursor(T < 2.85 ? 'grab' : 'hand', cp[0], cp[1]);
  return C;
}
const EB_SCENES = { 1: ebDrawer, 2: ebGrab };
function drawEbScene(step, t) {
  if (!EBF.buf) { EBF.buf = ebBuf(); EBF.canvas = document.createElement('canvas'); EBF.canvas.width = EBW; EBF.canvas.height = EBH; }
  setRes(EBW, EBH); CLIP = null;
  const C = (EB_SCENES[step] || ebDrawer)(t);
  EBF.cam = C; if (EB_GUIDES) ebGuides(step);
  ebCompose(EBF.buf, EBF.canvas.getContext('2d'), ebTint());
  return EBF.canvas;
}

// ---------------------------------------------------------------- the window over the right screen (palette-exact UI)
const EBWIN = { buf: null, canvas: null };
function ebWindowCanvas(step, t) {
  const [, , w, h] = EB_WIN;
  if (!EBWIN.buf) { EBWIN.buf = mkBuf(w, h, true); EBWIN.canvas = document.createElement('canvas'); EBWIN.canvas.width = w; EBWIN.canvas.height = h; }
  setRes(w, h); CLIP = null; const F = EBWIN.buf; F.I.fill(-1); bind(F);
  const x = 0, y = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = i < 2 || i >= w - 2, cy = j < 2 || j >= h - 2;
    if (cx && cy && (i === 0 || i === w - 1) && (j === 0 || j === h - 1)) continue;
    if (cx && cy && (i === 0 || i === w - 1 || j === 0 || j === h - 1)) { putI(i, j, P.s2); continue; }
    putI(i, j, j === 0 ? P.s3 : i === 0 || i === w - 1 || j === h - 1 ? P.s2 : P.s1);
  }
  // the desk's text is Tiny5 only (Silkscreen and blackletter belong to the RPG)
  text('Energy break', x + 8, y + 6, 'tiny', P.moon);
  text('Hands busy: abilities paused', x + 8 + measure('Energy break', 'tiny') + 8, y + 6, 'tiny', P.u4);
  rectI(w - 15, 4, 10, 10, P.s2); frameI(w - 15, 4, 10, 10, P.s3); glyph('cross', w - 12, 7, P.u5);
  // the five steps: done (moss check), now (gold: the next action), to come (dim)
  const pw = 74, gap = 3;
  EB_STEPS.forEach((s, k) => {
    const px = 8 + k * (pw + gap), py = 18, now = k === step - 1, done = k < step - 1, bg = now ? P.gold : done ? P.g2 : P.s2;
    rectI(px + 1, py, pw - 2, 11, bg); rectI(px, py + 1, pw, 9, bg);
    if (done) glyph('check', px + 4, py + 4, P.g5);
    else { rectI(px + 2, py + 2, 7, 7, now ? P.void : P.s3); rectI(px + 3, py + 1, 5, 9, now ? P.void : P.s3); text(String(k + 1), px + 6, py + 3, 'tiny', now ? P.gold : P.u4, { align: 'c' }); }
    text(s.name, px + 13, py + 3, 'tiny', now ? P.void : done ? P.u5 : P.u4);
  });
  const st = EB_STEPS[step - 1] || EB_STEPS[0];
  text(st.say, 8, 31, 'tiny', P.moon);
  frameI(3, 37, EBW + 2, EBH + 2, P.void);
  const ctx = EBWIN.canvas.getContext('2d'), img = ctx.createImageData(w, h), D = img.data;
  for (let k = 0; k < w * h; k++) { const q = F.I[k]; if (q < 0) continue; const c = EB_RGB[q]; D[k * 4] = c[0]; D[k * 4 + 1] = c[1]; D[k * 4 + 2] = c[2]; D[k * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return EBWIN.canvas;
}
// dim the right screen behind the window: each colour times 0.42, back into the desk palette; a soft shadow under it
function ebDim(ctx) {
  const img = ctx.getImageData(0, 0, RS_W, RS_H), D = img.data, lut = deskSet('graphite').LUT, [x, y, w, h] = EB_WIN;
  for (let j = 0; j < RS_H; j++) for (let i = 0; i < RS_W; i++) {
    const ex = Math.max(x + 3 - i - 0.5, i + 0.5 - (x + w + 3), 0), ey = Math.max(y + 5 - j - 0.5, j + 0.5 - (y + h + 5), 0), d = Math.hypot(ex, ey);
    const k = 0.42 * (d < 8 ? 0.55 + 0.45 * (d / 8) : 1), o = (j * RS_W + i) * 4, th = (BAYER8[((j & 7) << 3) | (i & 7)] - 0.5) * 0.06;
    const r = (D[o] / 255) * k + th, g = (D[o + 1] / 255) * k + th, b = (D[o + 2] / 255) * k + th;
    const q = lut[((r <= 0 ? 0 : r >= 1 ? 63 : (r * 63 + 0.5) | 0) << 12) | ((g <= 0 ? 0 : g >= 1 ? 63 : (g * 63 + 0.5) | 0) << 6) | (b <= 0 ? 0 : b >= 1 ? 63 : (b * 63 + 0.5) | 0)], c = EB_RGB[q];
    D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2];
  }
  ctx.putImageData(img, 0, 0);
}
function drawEnergyBreak(ctx, step, t) {
  EB_SCREEN = ctx.getImageData(9, 8, 474, 232);
  ebDim(ctx);
  ctx.drawImage(ebWindowCanvas(step, t), EB_WIN[0], EB_WIN[1]);
  ctx.drawImage(drawEbScene(step, t), EB_SC[0], EB_SC[1]);
}

// ---------------------------------------------------------------- 3 Open: the whole can on its spot, seen from the
// front-left at the angle its sprite was drawn at (15 degrees down, a long lens, so lid and base curve alike)
const OPEN = { c: [DR.spot[0], 75 + CAN.L / 2, DR.spot[1]], yaw: (12 * Math.PI) / 180, pitch: (14.5 * Math.PI) / 180, D: 300, f: 2968, at: [150, 138] };
const OPEN_CAM = (() => {
  const C0 = ebCam([0, 0, 0], OPEN.yaw, OPEN.pitch, OPEN.f, 0, 0), E = [OPEN.c[0] - C0.F[0] * OPEN.D, OPEN.c[1] - C0.F[1] * OPEN.D, OPEN.c[2] - C0.F[2] * OPEN.D];
  return ebCam(E, OPEN.yaw, OPEN.pitch, OPEN.f, OPEN.at[0], OPEN.at[1]);
})();
function wallSh(h) {
  const [X, Y] = h.P; let v = 0.2 + 0.03 * (vnoise(X * 0.08, Y * 0.08, 7) - 0.5), m = M_DUSK;
  // a framed print: a grey mountain under a moon (the only colour here is the screen's light)
  const fx = (X - 22) / 44, fy = (Y - 98) / 32;
  if (fx > 0 && fx < 1 && fy > 0 && fy < 1) {
    m = M_STONE; const e = Math.min(fx * 44, (1 - fx) * 44, fy * 32, (1 - fy) * 32);
    if (e < 1.4) v = 0.12; else if (e < 3.6) v = 0.62;
    else { const mx = fx - 0.5, ridge = 0.32 + 0.38 * (1 - Math.abs(mx) * 2.2) + 0.05 * Math.sin(fx * 40); v = fy < ridge ? 0.3 + 0.05 * Math.sin(fx * 70 + fy * 30) : 0.5 + 0.1 * fy; if (Math.hypot(fx - 0.74, (fy - 0.78) * 0.72) < 0.07) v = 0.86; }
  }
  // a wall socket with the desk's cables going in
  const sx = (X - 50) / 8, sy = (Y - 80) / 8; if (sx > 0 && sx < 1 && sy > 0 && sy < 1) { m = M_STONE; v = Math.hypot(sx - 0.5, sy - 0.5) < 0.18 ? 0.1 : 0.56; }
  OUT.v = v * lit(h); OUT.m = m;
}
// behind the desk: the wall, a pair of desk speakers, a little painted knight on a base
function backProps() {
  const spk = (h) => { OUT.m = M_STONE; const c = [h.q.a[0] / 2 + h.q.b[0] / 2, 0]; let v = h.face === 5 ? 0.14 : 0.2; if (h.face === 5) { const d = Math.hypot(h.P[0] - c[0], h.P[1] - 86); if (d < 3.4) v = d > 2.8 ? 0.36 : d < 1.2 ? 0.3 : 0.06; if (Math.hypot(h.P[0] - c[0], h.P[1] - 94.5) < 1.1) v = 0.32; } OUT.v = v * lit(h); };
  const fig = (v0, mat) => (h) => { OUT.m = mat; OUT.v = v0 * lit(h); };
  return [box([-100, 0, -84], [120, 200, -82], wallSh), box([52, 75, -76], [62, 99, -66], spk)];
}
// the can sprite stood on the spot: its base ellipse's centre on the spot's projection, texels lit softly from the left
function canSprite(F, C, name, base, o = {}) {
  const S = EB_SPR[name], b = camP(C, base[0], base[1], base[2]), bx = Math.round(b[0] - S.w / 2), by = Math.round(b[1] - (o.baseRow ?? S.h - 8)), z = b[2] - 4;
  for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) {
    const k = S.a[j * S.w + i]; if (k === 255) continue;
    const x = bx + i, y = by + j; if (x < 0 || y < 0 || x >= EBW || y >= EBH) continue;
    const n = y * EBW + x, c = EB_RGB[k], l = o.light ? o.light(i / S.w, j / S.h) : 1;
    F.S[n] = 1; F.R[n] = (c[0] / 255) * l; F.Gc[n] = (c[1] / 255) * l; F.Bc[n] = (c[2] / 255) * l; F.Z[n] = z; F.I[n] = -1;
  }
  return [bx, by];
}
function ebOpen(t) {
  const C = OPEN_CAM, T = t % 3.8;
  const prims = deskPrims(C.E, 0).concat(backProps());
  const base = ebBake('open', C, prims, MON_LIGHT({ fill: [10, 190, 150], fi: 0.8 }));
  const F = EBF.buf; ebCopy(F, base); bind(F);
  // lit like its drawing (key from the upper left), a touch darker at the foot where the desk's shade is
  const [bx, by] = canSprite(F, C, 'can76', [OPEN.c[0], 75, OPEN.c[2]], { baseRow: 166, light: (u, v) => 0.94 + 0.08 * (1 - u) - 0.12 * Math.max(0, v - 0.85) });
  // the lid: the tab lifts on its rivet, the mouth breaks open, the fizz comes up acid green
  const lift = T < 0.7 ? 0 : T < 1.5 ? ease((T - 0.7) / 0.8) : 1, opened = T >= 1.5, cx = bx + 37, ly = by + 5;
  if (lift > 0) {
    for (let i = -5; i <= 5; i++) for (let j = -1; j <= 1; j++) if (Math.abs(i) + Math.abs(j) * 3 < 6) putI(cx + i, ly + j, P.s3);    // the tab's bed, bare
    const hgt = Math.round(lift * 10);
    for (let j = 0; j <= hgt; j++) for (let i = -3; i <= 3; i++) {
      const edge = Math.abs(i) === 3 || j === hgt, ring = j > hgt - 5 && j < hgt - 1 && Math.abs(i) < 2;
      if (Math.abs(i) === 3 && j === hgt) continue;
      putI(cx + i, ly - j, ring ? P.void : edge ? P.s4 : i < 0 ? P.moon : P.u6);
    }
    putI(cx, ly, P.s5);
  }
  if (opened) {
    for (let i = -6; i <= 4; i++) for (let j = 0; j <= 2; j++) if (Math.abs(i + 1) + (j === 1 ? 0 : 2) <= 5) putI(cx + i, ly + 2 + j, j === 1 && Math.abs(i + 1) < 4 ? P.void : P.s1);
    const ft = T - 1.5;
    for (let k = 0; k < 30; k++) {
      const a = hash(k, 3, 9), sp = 0.6 + hash(k, 4, 9), age = (ft * 1.6 + hash(k, 5, 9)) % 1.3; if (ft < 0.05) continue;
      const x = cx - 2 + (a - 0.5) * 24 * age + Math.sin(age * 9 + k) * 1.5, y = ly + 2 - age * 36 * sp;
      if (age < 1.15) putI(Math.round(x), Math.round(y), [EBX.a6, EBX.a5, EBX.a4][k % 3]);
    }
    if (ft < 1) ebLabel('psssht', cx + 16, ly - 20 - ft * 8, EBX.a5);
  }
  // the hint and the cursor on the tab's ring
  const tip = [cx + 6, ly - Math.round(lift * 10) + 3];
  if (!opened) { ebArrow(cx + 28, ly - 16, 'up'); ebLabel('pull the tab up', cx + 32, ly - 15); }
  if (T < 0.7) { const e = ease(T / 0.6); ebCursor(T > 0.55 ? 'grab' : 'hand', lerp(cx + 70, tip[0], e), lerp(ly + 40, tip[1], e)); }
  else ebCursor(T < 1.7 ? 'grab' : 'hand', tip[0], tip[1]);
  return C;
}
EB_SCENES[3] = ebOpen;

// ---------------------------------------------------------------- 4 Drink: close on him, from his left side, the camera
// level with his eyes (so the horizon runs through his glasses). No desk: the monitor glows at the far left, the
// room's wall behind him, a window with blinds and the moon. He is the one from her panel, turned side-on: a dark
// silhouette, short dark hair, glasses lit white by the screen, red lips; the sweat drop.
const DRINK_CAM = ebCam([-20, 106, 85], 0, 0, 440, 196, 112);
const DK = { neck: [300, 150], s: 5.18 };   // the head's pivot on screen, px per cm at his depth; a positive angle tips his head back
let EB_SCREEN = null;                        // the game screen's pixels this frame (for the monitor's glass)
function drinkWallSh(h) {
  const [X, Y] = h.P; let v = 0.17 + 0.03 * (vnoise(X * 0.06, Y * 0.06, 17) - 0.5), m = M_DUSK;
  // the window: a pale frame, the blinds lit in slats by the moon, dark sky between them
  const wx = (X + 14) / 96, wy = (Y - 89) / 104;
  if (wx > 0 && wx < 1 && wy > 0 && wy < 1) {
    const e = Math.min(wx * 96, (1 - wx) * 96, wy * 104, (1 - wy) * 104); m = M_STONE;
    if (e < 3.2) v = e < 1 ? 0.2 : 0.44;
    else { const sl = ((Y - 92) % 4.2 + 4.2) % 4.2; v = sl < 2.6 ? 0.3 + 0.12 * wx + (sl < 0.8 ? 0.12 : 0) : 0.05; if (Math.abs(X - 34) < 0.5) v = 0.42; OUT.v = v; OUT.m = M_STONE; OUT.e = 1; return; }   // moonlit slats: they glow on their own
  }
  // a poster: a shield and two crossed swords, the RPG's own (stone ink on paper)
  const px = (X + 62) / 26, py = (Y - 108) / 36;
  if (px > 0 && px < 1 && py > 0 && py < 1) {
    m = M_UMBER; const cx = px - 0.5, cy = py - 0.42; v = 0.46 + 0.04 * (vnoise(X, Y, 3) - 0.5);
    if (Math.abs(cx) < 0.26 && cy > -0.24 && cy < 0.2 - Math.abs(cx) * 0.6) v = Math.abs(cx) < 0.2 && cy < 0.14 - Math.abs(cx) * 0.6 ? 0.3 : 0.14;
    if (Math.abs(Math.abs(cx) - (0.5 - py) * 0.62) < 0.035 && py < 0.7) v = 0.18;
    if (py < 0.06 || py > 0.94 || px < 0.04 || px > 0.96) v = 0.36;
    if (py > 0.78 && py < 0.86 && Math.abs(cx) < 0.3 && Math.floor(px * 18) % 2) v = 0.2;
  }
  OUT.v = v * lit(h); OUT.m = m;
}
function drinkPrims() {
  const mon = (h) => {   // the monitor seen side-on: its screen faces him; glass shows the game, a thin bezel
    if (h.face === 1) {
      const u = (h.P[2] + 28) / 56, v = (122 - h.P[1]) / 42;
      if (u > 0.02 && u < 0.98 && v > 0.03 && v < 0.97) { OUT.rgb = true; OUT.e = 1; OUT.r = -1; OUT.g = u; OUT.b = v; return; }   // filled per frame
      OUT.v = 0.1; OUT.m = M_STONE; return;
    }
    OUT.v = (h.face === 5 ? 0.16 : 0.08) * lit(h); OUT.m = M_STONE;
  };
  const shelf = (h) => { OUT.m = M_UMBER; OUT.v = (h.face === 2 ? 0.22 : h.face === 5 ? 0.36 : 0.3) * lit(h); };
  const book = (v0, mat) => (h) => { OUT.m = mat; OUT.v = (h.face === 5 ? v0 : v0 * 0.7) * lit(h); };
  return [box([-200, 0, -72], [200, 300, -70], drinkWallSh), box([-18, 85.5, -70], [86, 89, -61], shelf),
    box([-58.5, 78, -28], [-55, 122, 28], mon), box([-60.5, 96, -6], [-58.5, 104, 6], mon),
    box([-98, 149, -70], [-36, 152, -51], shelf),
    box([-93, 152, -68], [-90, 170, -55], book(0.3, M_STONE)), box([-90, 152, -68], [-86.5, 172, -55], book(0.22, M_UMBER)), box([-86.5, 152, -68], [-83.5, 168, -55], book(0.38, M_STONE)), box([-83, 152, -66], [-80, 166, -57], book(0.26, M_DUSK)),
    rCyl([-56, 152, -61], [0, 1, 0], 8, 3.4, book(0.44, M_LOOT)), ell([-56, 164, -61], [3.6, 4, 3.6], book(0.5, M_LOOT)), box([-60, 152, -65], [-52, 154, -57], book(0.3, M_STONE))];
}
const DRINK_LIGHT = () => [{ p: [-55, 100, 0], face: [1, 0, 0], i: 2.8, r: 120 }, { p: [34, 150, -55], face: [0, 0, 1], i: 0.55, r: 140, shadow: false }, { p: [40, 220, 200], i: 0.35, r: 300, shadow: false }];

// his profile, in cm about the head's pivot (+x back, +y down); the face looks left, toward the monitor
const HEAD = {
  skin: [[0, -18.2], [-6.8, -16.6], [-9.4, -12.4], [-10.2, -8.9], [-9.5, -7.6], [-10.3, -6.8], [-12.5, -3.6], [-10.5, -2.6], [-10.5, -1.5], [-10, -0.7], [-10.3, 0], [-9.7, 1], [-9.9, 2.4], [-8.4, 3.7], [-3.6, 3.1], [-2.6, 3.6], [1.4, 3.4], [5.4, 1.6], [7.4, -1.4], [8.9, -6], [8.2, -11], [4.6, -15.6]],
  hair: [[-9.6, -12.2], [-10.7, -11.6], [-9.4, -13.6], [-10.2, -13.3], [-8.4, -15.6], [-6.8, -17.2], [0, -18.9], [4.9, -16.4], [8.6, -11.4], [9.4, -6], [7.9, -1.6], [5.6, 0.8], [3.4, -1.6], [1.6, -5.2], [-0.8, -6.6], [-1.6, -10.2], [-4.6, -11.2], [-7.2, -11], [-8.4, -12.6]],
  ear: [[1.5, -7.6], [3.4, -8], [4, -5.6], [3.2, -3.4], [1.6, -3.8], [2.4, -5.6]],
  // the open mouth (shown when he drinks): between the lips at the profile edge
  mouth: [[-10.6, -1.0], [-8.6, -1.1], [-8.6, -0.1], [-10.6, 0.3]],
};
// the torso and arms stay put: shoulders in a dark tee, his near shoulder toward you
const TORSO = [[-4.4, 10.4], [0.8, 7.6], [6.6, 6.2], [12, 9.6], [19, 12], [24, 18], [26, 40], [-14, 40], [-13, 24], [-9, 15]];
// the neck: from under his jaw and his nape (turning with the head) down to the throat's base and the collar at the
// back (staying with the body), each side a gentle curve, so the outline runs clean from chin to collarbone at any tilt
function neckPoly(th) {
  const S = (p) => [DK.neck[0] + p[0] * DK.s, DK.neck[1] + p[1] * DK.s];
  const J = headPt([-2.6, 3.6], th), F0 = S([-4.4, 10.4]);
  const curve = (a, b, bow) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(...d) || 1, c = [m[0] - (d[1] / n) * bow, m[1] + (d[0] / n) * bow], out = [];
    for (let k = 0; k <= 8; k++) { const u = k / 8; out.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]]); } return out; };
  return [...curve(J, F0, -1.2 * DK.s), ...curve(S([6.6, 6.2]), headPt([7.4, -1.4], th), -0.2 * DK.s), headPt([5.4, 1.6], th), headPt([1.4, 3.4], th)];   // the back of the neck: from the collar at the back straight up to the back of the skull, a touch hollow; it never runs outside the shirt
}
function polyFill(pts, fn) {   // screen-space polygon (even-odd)
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(EBH - 1, Math.ceil(y1)); y++) {
    const yc = y + 0.5, xs = [];
    for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(EBW - 1, Math.floor(xs[k + 1] - 0.5)); x++) fn(x, y);
  }
}
const headPt = (p, th, o = [0, 0]) => { const c = Math.cos(th), s = Math.sin(th), x = p[0] + o[0], y = p[1] + o[1]; return [DK.neck[0] + (x * c - y * s) * DK.s, DK.neck[1] + (x * s + y * c) * DK.s]; };
// draw him: a mask first (body 1, skin 2, hair 3, ear 4), then shade it (dark, a cold rim where the monitor
// catches the profile, a faint moon rim on the back of his head), then glasses, lips and the drop on top
function drawHim(F, th, open, t) {
  const MK = drawHim.MK || (drawHim.MK = new Uint8Array(EBW * EBH)); MK.fill(0);
  polyFill(TORSO.map((p) => [DK.neck[0] + p[0] * DK.s, DK.neck[1] + p[1] * DK.s]), (x, y) => { MK[y * EBW + x] = 1; });
  polyFill(neckPoly(th), (x, y) => { MK[y * EBW + x] = 2; });
  polyFill(HEAD.skin.map((p) => headPt(p, th)), (x, y) => { MK[y * EBW + x] = 2; });
  polyFill(HEAD.hair.map((p) => headPt(p, th)), (x, y) => { MK[y * EBW + x] = 3; });
  polyFill(HEAD.ear.map((p) => headPt(p, th)), (x, y) => { MK[y * EBW + x] = 4; });
  // close pinholes where the shapes meet (an empty pixel with 3 or 4 filled neighbours joins them), so no seam is rimmed
  for (let pass = 0; pass < 2; pass++) for (let y = 1; y < EBH - 1; y++) for (let x = 1; x < EBW - 1; x++) {
    const i = y * EBW + x; if (MK[i]) continue; const a = MK[i - 1], b = MK[i + 1], c = MK[i - EBW], d = MK[i + EBW];
    if ((a ? 1 : 0) + (b ? 1 : 0) + (c ? 1 : 0) + (d ? 1 : 0) >= 3) MK[i] = Math.max(a, b, c, d) === 1 ? 1 : 2;
  }
  for (let y = 1; y < EBH - 1; y++) for (let x = 1; x < EBW - 1; x++) {
    const i = y * EBW + x, k = MK[i]; if (!k) continue;
    const out = (dx, dy) => !MK[(y + dy) * EBW + x + dx];
    let v = k === 1 ? 0.08 : k === 3 ? 0.06 + (hash(x >> 1, y, 5) > 0.88 ? 0.08 : 0) : k === 4 ? 0.13 : 0.1;
    if (out(-1, 0) || out(-1, -1) && k > 1) v += k === 1 ? 0.3 : 0.66;            // the screen's rim on his profile
    else if ((out(-2, 0) || out(-2, -1)) && k > 1) v += 0.26;
    else if (out(-3, 0) && k > 1) v += 0.08;
    if (k === 3 && (out(1, 0) || out(0, -1)) && x > DK.neck[0]) v += 0.08;       // the moon on his hair (only the hair: the neck and back stay a clean dark shape)
    F.V[i] = v; F.M[i] = M_STONE; F.E[i] = 0; F.S[i] = 0; F.Z[i] = 80; F.I[i] = -1;
  }
  // the hair's few strands, in a slightly lighter dark
  for (const [a, b] of [[[-6, -16.4], [-2, -13.4]], [[-2, -17.6], [3, -14]], [[4, -15], [6.4, -10.4]], [[1, -12], [4, -8.6]]]) { const p = headPt(a, th), q = headPt(b, th); line(p[0], p[1], q[0], q[1], 0.15, M_STONE); }
  // the glasses: the temple back to the ear, the lens edge-on in front of his eye, lit white, a halo round it
  const t0 = headPt([-10.6, -8.4], th), t1 = headPt([1.6, -7.6], th); line(t0[0], t0[1], t1[0], t1[1], 0.22, M_STONE);
  const lc = headPt([-10.6, -7.4], th);
  for (let y = -15; y <= 15; y++) for (let x = -15; x <= 15; x++) { const d = Math.hypot(x, y * 0.8), i = (Math.round(lc[1]) + y) * EBW + Math.round(lc[0]) + x; if (d < 14 && F.S[i] === 0 && !F.E[i]) F.V[i] = Math.min(0.9, F.V[i] + 0.26 * (1 - d / 14) ** 1.5); }
  const lens = [[-11.3, -9.3], [-10.4, -9.5], [-9.8, -8.2], [-9.8, -6.6], [-10.4, -5.5], [-11.2, -5.6], [-11.6, -7.4]].map((p) => headPt(p, th));
  polyFill(lens, (x, y) => { const i = y * EBW + x; F.V[i] = 0.95; F.M[i] = M_STONE; F.E[i] = 1; });
  // lips: red where the profile turns at the mouth; open, a dark gap
  const ul = headPt([-10.3, -1.2], th), ll = headPt([-10.1, open ? 0.6 : 0], th);
  if (open) polyFill(HEAD.mouth.map((p, k) => headPt(k === 2 || k === 3 ? [p[0], p[1] + 0.6] : p, th)), (x, y) => { const i = y * EBW + x; F.V[i] = 0.02; F.M[i] = M_DANGER; });
  spr(Math.round(ul[0]), Math.round(ul[1]) - 1, ['cc', 'cw'], { c: P.crimson, w: P.wine }); spr(Math.round(ll[0]), Math.round(ll[1]), ['ccw', '.w.'], { c: P.crimson, w: P.wine });
  // the sweat drop, on his temple
  const sd = headPt([-5.4, -10.6], th), sy = Math.round(sd[1] + ((t * 6) % 6 > 4.5 ? 1 : 0));
  spr(Math.round(sd[0]) - 1, sy - 2, ['.c.', 'ccc', 'cwc', '.c.'], { c: P.s6, w: P.moon });
  return { lips: headPt([-10.2, -0.5], th) };
}

// ---------------------------------------------------------------- the liquid
// Not blobs: one continuous body. The can's inside is a rectangle in the picture; the free surface is a horizontal
// line placed so the area under it inside that rectangle is the fill (volume kept as the can turns), plus two
// standing-wave modes whose height follows how fast the tilt is changing (slosh), damped. Depth shading runs
// down the acid ramp and is ordered-dithered like everything else; a 1 px meniscus line, single-pixel fizz.
function polyClipBelow(pts, ys) {   // part of a convex polygon with y >= ys
  const out = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k], b = pts[(k + 1) % pts.length], ia = a[1] >= ys, ib = b[1] >= ys;
    if (ia) out.push(a);
    if (ia !== ib) { const u = (ys - a[1]) / (b[1] - a[1]); out.push([a[0] + u * (b[0] - a[0]), ys]); }
  }
  return out;
}
const polyArea = (p) => { let s = 0; for (let k = 0; k < p.length; k++) { const a = p[k], b = p[(k + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
function surfaceY(inner, fill) {
  const A = polyArea(inner); let lo = Math.min(...inner.map((p) => p[1])), hi = Math.max(...inner.map((p) => p[1]));
  for (let k = 0; k < 26; k++) { const m = (lo + hi) / 2; if (polyArea(polyClipBelow(inner, m)) > fill * A) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const ACID = [[0x1d, 0x4f, 0x26], [0x3b, 0x84, 0x24], [0x7c, 0xc2, 0x1f], [0xb8, 0xe6, 0x37], [0xe6, 0xf5, 0x8c]].map((c) => c.map((v) => v / 255));
function acidAt(k) { k = clamp(k, 0, 4); const a = Math.floor(Math.min(3, k)), f = k - a; return [lerp(ACID[a][0], ACID[a + 1][0], f), lerp(ACID[a][1], ACID[a + 1][1], f), lerp(ACID[a][2], ACID[a + 1][2], f)]; }
// the see-through can at tilt phi (0 upright, turning toward him), its lid's centre at 'top'; returns the mouth
function drawDrinkCan(F, top, phi, fill, t, slosh) {
  const S = EB_SPR.can38, L = S.h, r = S.w / 2, ax = [Math.sin(phi), -Math.cos(phi)], nx = [Math.cos(phi), Math.sin(phi)];
  const at = (a, c) => [top[0] - ax[0] * a + nx[0] * c, top[1] - ax[1] * a + nx[1] * c];   // a: px from the lid down the can, c: across
  const inner = [at(7, -r + 2.5), at(7, r - 2.5), at(L - 4, r - 2.5), at(L - 4, -r + 2.5)];
  const ys = surfaceY(inner, fill), xsL = [], hit = [];
  // where the surface meets the walls (for the slosh modes across it)
  for (let k = 0; k < 4; k++) { const a = inner[k], b = inner[(k + 1) % 4]; if ((a[1] - ys) * (b[1] - ys) <= 0 && a[1] !== b[1]) { const u = (ys - a[1]) / (b[1] - a[1]); hit.push(a[0] + u * (b[0] - a[0])); } }
  const x0 = Math.min(...hit), x1 = Math.max(...hit), wv = (x) => { const s = clamp((x - x0) / Math.max(1, x1 - x0)); return slosh * (Math.cos(Math.PI * s) * Math.sin(t * 7.1) + 0.45 * Math.cos(2 * Math.PI * s) * Math.sin(t * 11.3 + 1.3)) + 0.35 * Math.sin(s * 9 + t * 5); };
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; for (const p of [at(0, -r), at(0, r), at(L, r), at(L, -r)]) { bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); by0 = Math.min(by0, p[1]); by1 = Math.max(by1, p[1]); }
  const inPoly = (p, x, y) => { let s = 0; for (let k = 0; k < 4; k++) { const a = p[k], b = p[(k + 1) % 4], c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); if (c > 0) s++; else if (c < 0) s--; } return Math.abs(s) === 4; };
  for (let y = Math.max(0, Math.floor(by0)); y <= Math.min(EBH - 1, Math.ceil(by1)); y++) for (let x = Math.max(0, Math.floor(bx0)); x <= Math.min(EBW - 1, Math.ceil(bx1)); x++) {
    const px = x + 0.5 - top[0], py = y + 0.5 - top[1], a = -(px * ax[0] + py * ax[1]), c = px * nx[0] + py * nx[1];
    const row = Math.floor(a), col = Math.floor(c + r); if (row < 0 || row >= L || col < 0 || col >= S.w) continue;
    const k = S.a[row * S.w + col]; if (k === 255) continue;
    const tc = EB_RGB[k], T = [tc[0] / 255, tc[1] / 255, tc[2] / 255], i = y * EBW + x;
    let rgb;
    if (row < 6 || row > L - 4 || Math.abs(c) > r - 2) rgb = T;                    // the metal: lid, base, the rolled edges
    else if (inPoly(inner, x + 0.5, y + 0.5) && y + 0.5 > ys + wv(x + 0.5)) {
      const d = y + 0.5 - (ys + wv(x + 0.5)), side = (Math.abs(c) / r) ** 2;
      const L0 = d < 1 ? acidAt(4) : d < 2.5 ? acidAt(3.4) : acidAt(3 - Math.min(2.3, d / 11) - side * 0.6);
      rgb = [lerp(L0[0], T[0], 0.22), lerp(L0[1], T[1], 0.22), lerp(L0[2], T[2], 0.22)];
    } else rgb = [lerp(0.04, T[0], 0.36), lerp(0.05, T[1], 0.36), lerp(0.06, T[2], 0.36)];   // the empty part: the inside's dark, the print faint
    F.S[i] = 1; F.R[i] = rgb[0]; F.Gc[i] = rgb[1]; F.Bc[i] = rgb[2]; F.E[i] = 0; F.Z[i] = 70; F.I[i] = -1;
  }
  // fizz: single pixels rising through the liquid, gone at the surface
  for (let k = 0; k < 22; k++) {
    const c = (hash(k, 1, 33) - 0.5) * (2 * r - 8), a0 = 10 + hash(k, 2, 33) * (L - 18), sp = 9 + hash(k, 3, 33) * 14;
    const p = at(a0, c), y = p[1] - ((t * sp + hash(k, 4, 33) * 40) % 40), x = p[0] + Math.sin(t * 3 + k) * 0.8;
    if (y > ys + wv(x) + 1.5 && inPoly(inner, x, y)) putI(Math.round(x), Math.round(y), EBX.a6);
  }
  return { mouth: at(1, r - 5), surf: ys };   // the hole the drink comes out of: on the lid's lower edge (c > 0 is the low side at every tilt), where the liquid pools
}
// the pour: a ribbon from the mouth into his, a parabola under gravity; its width is the flow
function drawStream(F, a, b, flow, t) {
  const w = 0.7 + flow * 1.9, n = 24, mid = [(a[0] + b[0]) / 2 - 2, Math.max(a[1], b[1]) + 3];
  for (let k = 0; k <= n; k++) {
    const u = k / n, x = (1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mid[0] + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * mid[1] + u * u * b[1];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const d = Math.hypot(dx, dy); if (d > w) continue; const i = (Math.round(y) + dy) * EBW + Math.round(x) + dx; if (i < 0 || i >= EBW * EBH) continue;
      const c = acidAt(dy < 0 && d > w - 1 ? 4 : 2.6 + 0.4 * Math.sin(u * 12 - t * 20)); F.S[i] = 1; F.R[i] = c[0]; F.Gc[i] = c[1]; F.Bc[i] = c[2]; F.Z[i] = 60; F.I[i] = -1;
    }
  }
}
// the script of one sip (7 s): bring it up, hold Space (it tilts), he swallows, let go (it eases back)
function sipAt(T) {
  const phi = T < 0.8 ? lerp(20, 84, ease(T / 0.8)) : T < 1.4 ? lerp(84, 122, ease((T - 0.8) / 0.6)) : T < 3.7 ? lerp(122, 142, (T - 1.4) / 2.3) : T < 4.2 ? lerp(142, 154, ease((T - 3.7) / 0.5)) : T < 5 ? lerp(154, 92, ease((T - 4.2) / 0.8)) : 92;
  const fill = T < 1.25 ? 0.97 : T < 4.3 ? lerp(0.97, 0.13, (T - 1.25) / 3.05) : 0.13;
  const pouring = T > 1.25 && T < 4.3, space = T > 0.8 && T < 4.2;
  const head = T < 1 ? 0.15 * ease(T) : T < 4.3 ? lerp(0.15, 0.72, ease((T - 1) / 2.4)) : lerp(0.72, 0.1, ease((T - 4.3) / 1.2));   // tipped back up to 41 degrees: his mouth turns up to the can
  return { phi: (phi * Math.PI) / 180, fill, pouring, space, head, dphi: 0 };
}
function ebDrink(t) {
  const C = DRINK_CAM, T = t % 7;
  const prims = drinkPrims(), base = ebBake('drink', C, prims, DRINK_LIGHT(), 0.12);
  const F = EBF.buf; ebCopy(F, base); bind(F);
  // the monitor's glass shows the game, squeezed into its perspective (texels marked R = -1 by the bake)
  if (EB_SCREEN) { const D = EB_SCREEN.data; for (let i = 0; i < EBW * EBH; i++) if (F.S[i] && F.R[i] < 0) { const u = F.Gc[i], v = F.Bc[i], sx = Math.min(473, (u * 474) | 0), sy = Math.min(231, (v * 232) | 0), o = (sy * 474 + sx) * 4; F.R[i] = 0; F.S[i] = 2; F.V[i] = 0; F.M[i] = 0; F.E[i] = 1; F.X[i] = 0; F.Gc[i] = u; F.Bc[i] = v; F.DX[i] = 0; F.T[i] = 0; F.O[i] = o; } }
  const s = sipAt(T), s2 = sipAt(T + 0.05), dphi = Math.abs(s2.phi - s.phi) / 0.05;
  const him = drawHim(F, s.head, s.pouring || (T > 0.9 && T < 4.6), t);
  // the can, held by the cursor, its mouth just over his lips
  const r = EB_SPR.can38.w / 2, nx = [Math.cos(s.phi), Math.sin(s.phi)], ax = [Math.sin(s.phi), -Math.cos(s.phi)];
  const approach = T < 0.8 ? (1 - ease(T / 0.8)) * 40 : T > 4.6 ? ease((T - 4.6) / 0.6) * 26 : 0;
  const top = [him.lips[0] - nx[0] * (r - 5) + ax[0] * 1.5 - 2 - approach, him.lips[1] - nx[1] * (r - 5) + ax[1] * 1.5 - approach * 0.4];   // the lid's lower edge, with the hole, on his lower lip; the rest of the top end above it, against his upper lip
  const can = drawDrinkCan(F, top, s.phi, s.fill, t, Math.min(2.6, 0.4 + dphi * 0.9));
  if (s.pouring) drawStream(F, can.mouth, [him.lips[0] + 1, him.lips[1]], 0.5 + 0.5 * Math.sin(t * 9) * 0.3, t);
  const cb = [top[0] - ax[0] * 40, top[1] - ax[1] * 40]; ebCursor('grab', cb[0], cb[1]);
  // in you: the bar with its half (60) and full (85) marks; the Space key held while it tilts
  const pct = Math.round(clamp((0.97 - s.fill) / 0.97) * 100), bx = 10, by = 12, bw = 120;
  text('IN YOU', bx, by, 'tiny', P.u5); text(pct + '%', bx + bw + 4, by + 8, 'tiny', pct >= 85 ? P.gold : P.moon);
  rectI(bx, by + 9, bw, 4, P.void); rectI(bx, by + 9, Math.round((bw * pct) / 100), 4, EBX.a4); if (pct) rectI(bx, by + 9, Math.round((bw * pct) / 100), 1, EBX.a6);
  for (const [m, lab] of [[60, 'half'], [85, 'full']]) { const mx = bx + Math.round((bw * m) / 100); rectI(mx, by + 7, 1, 8, pct >= m ? P.gold : P.u5); text(lab, mx, by + 16, 'tiny', pct >= m ? P.gold : P.u4, { align: 'c' }); }
  if (pct >= 85 && T > 4.4) ebLabel('full boost', bx, by + 26, P.gold);
  const kx = EBW - 66, ky = EBH - 22, dn = s.space ? 1 : 0;
  rectI(kx, ky + 2, 40, 13, P.s1); rectI(kx, ky + dn, 40, 12, dn ? P.s3 : P.s4); rectI(kx + 1, ky + 1 + dn, 38, 9, dn ? P.s4 : P.s5);
  text('Space', kx + 20, ky + 3 + dn, 'tiny', dn ? P.moon : P.s1, { align: 'c' }); text(dn ? 'tilting' : 'tilt', kx + 44, ky + 4, 'tiny', dn ? P.gold : P.u5);
  return C;
}
EB_SCENES[4] = ebDrink;

// ---------------------------------------------------------------- 5 Toss: the room, seen from his chair (12 degrees
// down). No desk. The bin by the window wall, the can held up at the bin's depth (so it keeps its size as it
// flies across), last nights' misses where they fell. The monitor behind you lights the room, the moon comes in.
const TOSS = { z: -118, bin: [55, 0, -118], binR: 13, binH: 32, wall: -150, side: 92 };
// the monitor is behind you here (you turned round in the chair): it lights the room from your side; the moon
// comes in through the blinds
const TOSS_LIGHT = () => [{ p: [-12, 104, 165], face: [0, 0, -1], i: 2.6, r: 200 }, { p: [30, 150, -146], face: [0, 0, 1], i: 1, r: 140, shadow: false }, { p: [40, 230, 60], i: 0.24, r: 300, shadow: false }];   // a dark corner: the monitor behind you is far off and fades before it gets here, the moon at the window is the brightest thing
const TOSS_CAM = ebCam([0, 115, 110], 0, (9 * Math.PI) / 180, 486, 196, 74);
function roomWallSh(h) {
  const [X, Y, Z] = h.P; let v = 0.2 + 0.025 * (vnoise(X * 0.05 + Z * 0.05, Y * 0.05, 23) - 0.5), m = M_DUSK;
  if (Y < 8) { OUT.v = (Y > 7 ? 0.36 : 0.26) * lit(h); OUT.m = M_UMBER; return; }           // the skirting board
  if (h.face === 5) {
    // the window on the far wall: frame, blinds glowing in moonlit slats
    const wx = (X + 10) / 80, wy = (Y - 92) / 110;
    if (wx > 0 && wx < 1 && wy > 0 && wy < 1) {
      const e = Math.min(wx * 80, (1 - wx) * 80, wy * 110, (1 - wy) * 110);
      if (e < 3.4) { OUT.v = (e < 1 ? 0.2 : 0.46) * lit(h); OUT.m = M_STONE; return; }
      const sl = ((Y - 95) % 4.4 + 4.4) % 4.4; OUT.v = sl < 2.8 ? 0.28 + 0.1 * wx + (sl < 0.8 ? 0.12 : 0) : 0.05; OUT.m = M_STONE; OUT.e = 1; return;
    }
    // a poster: a dragon's eye, the RPG's own
    const px = (X + 92) / 34, py = (Y - 98) / 46;
    if (px > 0 && px < 1 && py > 0 && py < 1) { m = M_UMBER; const d = Math.hypot(px - 0.5, (py - 0.45) * 1.3); v = d < 0.2 ? (Math.abs(px - 0.5) < 0.04 ? 0.08 : 0.5) : d < 0.24 ? 0.2 : 0.38 + 0.05 * Math.sin(px * 30 + py * 20); if (px < 0.05 || px > 0.95 || py < 0.04 || py > 0.96) v = 0.6; }
  } else {
    // the side wall: a calendar and a light switch, seen at a slant
    const cz = (Z + 110) / 26, cy = (Y - 110) / 36; if (cz > 0 && cz < 1 && cy > 0 && cy < 1) { m = M_STONE; v = cy > 0.72 ? 0.32 : (Math.floor(cz * 7) + Math.floor(cy * 9)) % 2 ? 0.58 : 0.52; }
    const sw = (Z + 50) / 8, sy = (Y - 104) / 12; if (sw > 0 && sw < 1 && sy > 0 && sy < 1) { m = M_STONE; v = 0.6; }
  }
  OUT.v = v * lit(h); OUT.m = m;
}
function roomFloorSh(h) {
  const [X, , Z] = h.P; let v = floorV(X, Z), m = M_UMBER;
  // an oval rug with a border, two cables, a sock
  const ru = Math.hypot((X + 10) / 70, (Z + 40) / 44); if (ru < 1) { m = M_DUSK; v = ru > 0.86 ? 0.34 : ru > 0.8 ? 0.2 : 0.28 + 0.04 * (vnoise(X * 0.3, Z * 0.3, 8) - 0.5); }
  const cd = polyDist(X, Z, [[-150, 60], [-90, 40], [-60, 10], [-70, -30], [-40, -60]]); if (cd < 0.7) { v = cd < 0.3 ? 0.3 : 0.08; m = M_STONE; }
  const sk = rrect(X, Z, -30, -128, 9, 22, -0.8); if (sk && Math.hypot(sk[0] - 0.5, (sk[1] - 0.5) * 1.6) < 0.5) { v = 0.46; m = M_STONE; }
  OUT.v = v * lit(h); OUT.m = m;
}
function binSh(h) {   // a mesh office bin: dark wire grid over the dim inside; inside, paper balls
  const q = h.q, l = lit(h);
  if (h.inner || h.face === 1) { OUT.v = 0.07 * l; OUT.m = M_STONE; return; }
  const a = Math.atan2(h.P[2] - q.o[2], h.P[0] - q.o[0]), y = h.P[1] - q.o[1];
  const mesh = (Math.abs(((a * 13) / Math.PI) % 1) < 0.18) || (y % 2.6 < 0.5), rim = y > q.L - 1.4 || y < 1.4;
  OUT.v = (rim ? 0.5 : mesh ? 0.34 : 0.1) * l; OUT.m = M_STONE;
}
function tossPrims() {
  const wood = (v0) => (h) => { OUT.m = M_UMBER; OUT.v = (h.face === 3 ? v0 + 0.06 : h.face === 5 ? v0 : v0 * 0.7) * lit(h); };
  const st = (v0, m = M_STONE) => (h) => { OUT.m = m; OUT.v = v0 * lit(h); };
  const rad = (h) => { OUT.m = M_STONE; OUT.v = (h.face === 5 ? ((((h.P[0] + 400) % 4.5) < 2.8 ? 0.5 : 0.24) - (h.P[1] > 64 || h.P[1] < 32 ? 0.12 : 0)) : 0.36) * lit(h); };
  const leaf = (h) => { OUT.m = M_MOSS; const n = vnoise(h.P[0] * 0.9, h.P[1] * 0.9 + h.P[2] * 0.5, 44); OUT.v = (n > 0.62 ? 0.62 : n < 0.34 ? 0.18 : 0.38) * lit(h); };
  const cloth = (v0) => (h) => { OUT.m = M_DUSK; OUT.v = (v0 + 0.06 * (vnoise(h.P[0] * 0.4, h.P[2] * 0.4, 31) - 0.5)) * lit(h); };
  return [
    disc([0, 0, 0], [0, 1, 0], 0, roomFloorSh), box([-300, 0, -152], [300, 300, -150], roomWallSh), box([92, 0, -152], [94, 300, 200], roomWallSh),
    box([-6, 30, -150], [66, 66, -142], rad), box([-14, 88, -150], [74, 92, -138], wood(0.42)),
    // a low cabinet with a few things on it: a little castle, a plant, a stack of game boxes
    box([-110, 0, -150], [-50, 58, -118], wood(0.3)), box([-111, 58, -150], [-49, 60, -116], wood(0.36)),
    box([-100, 60, -144], [-86, 72, -130], st(0.34)), box([-98, 72, -142], [-94, 78, -138], st(0.4)), box([-91, 72, -142], [-87, 80, -138], st(0.4)),
    rCyl([-62, 60, -136], [0, 1, 0], 10, 5, st(0.3, M_UMBER)), ell([-62, 77, -136], [10, 10, 9], leaf), ell([-55, 84, -133], [5, 7, 5], leaf), ell([-69, 82, -138], [5, 6, 5], leaf),
    box([-82, 60, -132], [-68, 62, -122], st(0.5, M_DANGER)), box([-81, 62, -131], [-69, 64, -123], st(0.44)), box([-82, 64, -132], [-68, 66, -122], st(0.36, M_LOOT)),
    // the bin, paper balls inside
    rCyl(TOSS.bin, [0, 1, 0], TOSS.binH, TOSS.binR, binSh, { open: true }),
    ell([TOSS.bin[0] - 3, 20, TOSS.bin[2] + 2], [5, 5, 5], st(0.6)), ell([TOSS.bin[0] + 5, 18, TOSS.bin[2] - 3], [4.5, 4.5, 4.5], st(0.5)),
  ];
}
// last nights' misses, lying where they fell: whole cans (15 x 36) turned onto their sides, at the floor's scale there
const MISSES = [[24, -108, 1], [84, -104, 3], [-10, -126, 3], [78, -134, 1]];   // whole cans, lying on their sides round the bin
function sprBlit(F, name, x, y, rot = 0, light = 1, z = 1) {
  const S = EB_SPR[name], w = rot % 2 ? S.h : S.w, h = rot % 2 ? S.w : S.h;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const [si, sj] = rot === 0 ? [i, j] : rot === 1 ? [j, S.h - 1 - i] : rot === 2 ? [S.w - 1 - i, S.h - 1 - j] : [S.w - 1 - j, i];
    const k = S.a[sj * S.w + si]; if (k === 255) continue;
    const X = Math.round(x - w / 2) + i, Y = Math.round(y - h / 2) + j; if (X < 0 || Y < 0 || X >= EBW || Y >= EBH) continue;
    const n = Y * EBW + X; if (F.Z[n] < z) continue; const c = EB_RGB[k]; F.S[n] = 1; F.R[n] = (c[0] / 255) * light; F.Gc[n] = (c[1] / 255) * light; F.Bc[n] = (c[2] / 255) * light; F.Z[n] = z; F.I[n] = -1;
  }
}
function ebToss(t) {
  const C = TOSS_CAM, T = t % 4.6, base = ebBake('toss', C, tossPrims(), TOSS_LIGHT(), 0.1);
  const F = EBF.buf; ebCopy(F, base); bind(F);
  for (const [x, z, rot] of MISSES) { const p = camP(C, x, 3.3, z); sprBlit(F, 'st_closed', p[0], p[1], rot, 0.5, p[2]); }   // the misses lie in the dark by the bin
  // the throw: grab, pull back (a band from where you grabbed), let go; it flies an arc at the bin's depth, spinning
  const z = TOSS.z, start = [-46, 70, z], top = [TOSS.bin[0], TOSS.binH + 2, z];
  const sp = camP(C, ...start), bp = camP(C, top[0], top[1], top[2] + 2);
  let cp = sp, rot = 0, inBin = false;
  const pull = T < 0.8 ? 0 : T < 1.7 ? ease((T - 0.8) / 0.9) : 0;
  if (T < 1.7) cp = [sp[0] - pull * 34, sp[1] + pull * 20];
  else if (T < 2.75) {
    const u = (T - 1.7) / 1.05, X = lerp(start[0], top[0], u), Y = lerp(start[1], top[1], u) + 70 * u * (1 - u) * 1.6;
    cp = camP(C, X, Y, z); rot = Math.floor(u * 7) % 4;
  } else inBin = true;
  const ring = [sp[0], sp[1]];
  if (T < 1.7) {
    if (T >= 0.8) { for (let k = 0; k <= 14; k++) { const u = k / 14; if (k % 2 === 0) putI(Math.round(lerp(ring[0], cp[0], u)), Math.round(lerp(ring[1], cp[1], u)), P.gold); } }
    for (let a = 0; a < 48; a++) if (Math.floor(a / 3 + t * 4) % 2 === 0) putI(Math.round(ring[0] + Math.cos((a / 48) * 6.283) * 22), Math.round(ring[1] + Math.sin((a / 48) * 6.283) * 22), P.gold);
    if (T < 0.8) { ebLabel('one throw: grab it, pull back, let go', ring[0] + 26, ring[1] - 26); }
  }
  if (!inBin) sprBlit(F, 'st_closed', cp[0], cp[1], rot, 0.88, 1);
  else { ebLabel('in', bp[0] + 18, bp[1] - 22, P.g5); glyph('check', Math.round(bp[0] + 30), Math.round(bp[1] - 21), P.g5); }
  if (T < 0.8) { const e = ease(T / 0.7); ebCursor(T > 0.65 ? 'grab' : 'hand', lerp(sp[0] + 60, cp[0], e), lerp(sp[1] + 40, cp[1], e)); }
  else if (T < 1.7) ebCursor('grab', cp[0], cp[1]);
  else ebCursor('hand', sp[0] - 34, sp[1] + 20);
  return C;
}
EB_SCENES[5] = ebToss;

// ---------------------------------------------------------------- perspective check (Show grid): the scene's own camera
// draws its vanishing points, the horizon and a grid on the main plane; every edge in the picture should run along it
function ebSeg(C, a, b, idx, dash = 0) {
  const z0 = C.F[0] * (a[0] - C.E[0]) + C.F[1] * (a[1] - C.E[1]) + C.F[2] * (a[2] - C.E[2]), z1 = C.F[0] * (b[0] - C.E[0]) + C.F[1] * (b[1] - C.E[1]) + C.F[2] * (b[2] - C.E[2]);
  if (z0 < 1 && z1 < 1) return;
  if (z0 < 1 || z1 < 1) { const u = (1 - z0) / (z1 - z0), c = lerp3(a, b, u); if (z0 < 1) a = c; else b = c; }
  const p = camP(C, ...a), q = camP(C, ...b), n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]));
  for (let k = 0; k <= n; k++) { if (dash && Math.floor(k / dash) % 2) continue; const u = k / Math.max(1, n); putI(Math.floor(lerp(p[0], q[0], u)), Math.floor(lerp(p[1], q[1], u)), idx); }
}
function ebVPMark(C, d, idx, lab) {
  const v = camVP(C, d); if (!v) return;
  const x = clamp(v[0], 2, EBW - 3), y = clamp(v[1], 2, EBH - 3), inside = x === v[0] && y === v[1];
  for (let k = -3; k <= 3; k++) { putI(Math.round(x) + k, Math.round(y), idx); putI(Math.round(x), Math.round(y) + k, idx); }
  text(lab + (inside ? '' : ' (off frame)'), Math.round(x) + 5, Math.round(clamp(y, 2, EBH - 9)), 'tiny', idx, { shadow: P.void });
}
function ebGuides(step) {
  const C = EBF.cam; if (!C) return;
  const hz = camVP(C, [C.F[0], 0, C.F[2]]); if (hz && hz[1] > 0 && hz[1] < EBH) for (let x = 0; x < EBW; x += 2) putI(x, Math.round(hz[1]), P.gold);
  if (step <= 3) {   // the desk top's grid (Y 75): depth lines to the vanishing point, cross lines level
    for (let x = -96; x <= 64; x += 8) ebSeg(C, [x, 75, -82], [x, 75, 0], P.crimson, 2);
    for (let z = -80; z <= 0; z += 8) ebSeg(C, [-96, 75, z], [64, 75, z], P.s6, 2);
    if (step <= 2) for (const x of [4.4, 45.6]) for (const y of [0, 54, 72]) ebSeg(C, [x, y, -60], [x, y, 40], P.crimson, 2);
  } else if (step === 4) {
    for (let y = 60; y <= 200; y += 20) ebSeg(C, [-200, y, -70], [-200, y, 60], P.crimson, 2), ebSeg(C, [200, y, -70], [200, y, 60], P.crimson, 2);
    for (const y of [85.5, 89, 149, 152]) ebSeg(C, [-200, y, -70], [200, y, -70], P.s6, 2);
  } else {
    for (let x = -120; x <= 92; x += 16) ebSeg(C, [x, 0, -150], [x, 0, 100], P.crimson, 2);
    for (let z = -150; z <= 40; z += 16) ebSeg(C, [-200, 0, z], [92, 0, z], P.s6, 2);
    for (const x of [-110, -50, 92]) ebSeg(C, [x, 0, -150], [x, 200, -150], P.s6, 2);
  }
  ebVPMark(C, [0, 0, -1], P.crimson, 'depth');
  if (Math.abs(C.F[1]) > 0.05) ebVPMark(C, [0, -1, 0], P.s6, 'verticals');
}

// ================================================================ the game's energy break (V5, #70; grid doc 7c)
// The game drives the five scenes: its rules (systems/monster.ts) and both physics (systems/fuelPhysics.ts: the drink's
// particles, the throw's rigid cans) stay the game's. The cameras live here, and the game asks EB_MAP where things are
// on screen (scene px, 392 x 258) and where a pointer is in its physics. The static part of each scene is ray-cast in
// slices over idle frames before it is needed (a whole one is 0.2 to 0.7 s on a slow machine); the moving can, him,
// the liquid and the UI are drawn each frame. The cursor is the game's CSS cursor (the hand below, at full rate).
const EB_DR_STOPS = [0, 22, 12, 6, 18, 3, 9, 15, 21];          // the drawer's bakes, cm pulled (the ends first)
// the drawer is drawn at the nearest pull already baked (while the rest bake, it moves in bigger steps)
const ebDrStop = (o, n) => EB_DR_STOPS.filter((s) => s === 0 || EB_CACHE.has('drawer:' + n + ':' + s)).reduce((b, s) => (Math.abs(s - o) < Math.abs(b - o) ? s : b), 0);
function ebGrabPrims(n) {   // the open drawer with its front can taken out (the one you drag)
  const o = DR.open;
  return deskPrims(DR_CAM.E, o, n).filter((q) => !(q.k === 1 && q.L === CAN.L && Math.abs(q.o[2] - (o + DR.cans[0])) < 0.01));
}
// between two pulls only the drawer's part of the picture changes: every pull but the shut one is the shut bake with
// that part cast again (the drawer, its box, its shadow on the pedestal and the floor below it)
let EB_DR_RECT = null;
function ebDrRect() {
  if (EB_DR_RECT) return EB_DR_RECT;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9;
  for (const o of [0, DR.open]) for (const X of [4.4, 45.6]) for (const Y of [54, 72]) for (const Z of [o - 37.5, o + 3]) { const p = camP(DR_CAM, X, Y, Z); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); }
  return (EB_DR_RECT = [Math.max(0, Math.floor(x0 - 14)), Math.max(0, Math.floor(y0 - 6)), Math.min(EBW, Math.ceil(x1 + 30)), EBH]);
}
function ebJobs(n) {   // what a break with n cans in the drawer needs, in the order it needs them
  const shut = 'drawer:' + n + ':0';
  const J = EB_DR_STOPS.map((o) => ['drawer:' + n + ':' + o, DR_CAM, () => deskPrims(DR_CAM.E, o, n), MON_LIGHT, 0.16, o ? shut : null]);
  J.push(['grab:' + n, DR_CAM, () => ebGrabPrims(n), MON_LIGHT, 0.16, shut]);
  J.push(['open', OPEN_CAM, () => deskPrims(OPEN_CAM.E, 0, 0).concat(backProps()), () => MON_LIGHT({ fill: [10, 190, 150], fi: 0.8 }), 0.16]);
  J.push(['drink', DRINK_CAM, drinkPrims, DRINK_LIGHT, 0.12]);
  J.push(['toss', TOSS_CAM, tossPrims, TOSS_LIGHT, 0.1]);
  return J;
}
const EB_PEND = new Map();   // key -> { F, y, prims, lights, amb, C }
// cast rows of one bake until the budget is spent; true when it is complete
function ebBakeStep(job, ms) {
  const [key, C, primsFn, lightsFn, amb, from] = job;
  if (EB_CACHE.has(key)) return true;
  let P0 = EB_PEND.get(key);
  if (!P0) {
    if (from && !EB_CACHE.has(from)) return false;   // it starts from the shut drawer's bake
    const F = ebBuf(), R = from ? ebDrRect() : [0, 0, EBW, EBH];
    if (from) { const B = EB_CACHE.get(from); for (const k of ['V', 'M', 'E', 'S', 'R', 'Gc', 'Bc', 'Z', 'I', 'A', 'O']) F[k].set(B[k]); }
    P0 = { F, R, y: R[1], prims: primsFn(), lights: lightsFn(), amb, C }; EB_PEND.set(key, P0);
  }
  RT_SCENE = { prims: P0.prims, lights: P0.lights, amb: P0.amb };
  const t0 = performance.now(), [x0, , x1, y1] = P0.R;
  while (P0.y < y1) { ebCastRect(P0.F, C, P0.prims, x0, P0.y, x1, P0.y + 1); P0.y += 1; if (performance.now() - t0 > ms) break; }
  if (P0.y >= y1) { EB_CACHE.set(key, P0.F); EB_PEND.delete(key); return true; }
  return false;
}
/** Bake ahead for a break with n cans; spends about ms. True when everything is ready. */
let EB_N = 0;
function ebWarm(n, ms) {
  if (n !== EB_N) {   // the drawer's bakes are for this many cans: another count's are let go (a set is ~35 MB)
    for (const k of [...EB_CACHE.keys(), ...EB_PEND.keys()]) if (/^(drawer|grab):/.test(k) && !k.startsWith('drawer:' + n + ':') && k !== 'grab:' + n) { EB_CACHE.delete(k); EB_PEND.delete(k); }
    EB_N = n;
  }
  const t0 = performance.now();
  let all = true;
  for (const job of ebJobs(n)) { if (EB_CACHE.has(job[0])) continue; all = false; const left = ms - (performance.now() - t0); if (left <= 0) return false; ebBakeStep(job, left); }
  return all;
}
function ebBase(key, n) {   // a bake now (finished at once if the warm-up has not got to it)
  if (!EB_CACHE.has(key)) { const J = ebJobs(n), job = J.find((j) => j[0] === key); if (job[5]) ebBakeStep(J.find((j) => j[0] === job[5]), 1e9); ebBakeStep(job, 1e9); }
  return EB_CACHE.get(key);
}

// where things are, for the game's input (scene px)
const EB_MAP = {
  drawerHandle: (o) => camP(DR_CAM, 25, 63.3, o + 3),
  drawerCans: (n) => DR.cans.slice(0, n).map((dz, k) => camP(DR_CAM, 8.6 - k * 0.3 + CAN.L / 2, 57 + CAN.r, DR.open + dz)),
  grabAt: (k) => { const p0 = [8.6 + CAN.L / 2, 57 + CAN.r, DR.open + DR.cans[0]], p1 = [DR.spot[0], 75 + CAN.L / 2, DR.spot[1]], c = lerp3(p0, p1, k); c[1] += Math.sin(Math.PI * Math.min(1, k)) * 16; return camP(DR_CAM, c[0], c[1], c[2]); },
  spot: () => camP(DR_CAM, DR.spot[0], 75.02, DR.spot[1]),
  openTab: (lift) => { const b = camP(OPEN_CAM, OPEN.c[0], 75, OPEN.c[2]), S = EB_SPR.can76, bx = Math.round(b[0] - S.w / 2), by = Math.round(b[1] - 166); return [bx + 37 + 6, by + 5 - Math.round(lift * 10) + 3]; },
  lips: (th) => headPt([-10.2, -0.5], th),
  // the throw's plane: the 2D physics stands at the bin's depth, its bin on the bin, its floor on the floor
  toss: { bx: 505, sx: 26 / 74, sy: 32 / 76, floor: 272 },
  tossToScene: (x, y) => { const M = EB_MAP.toss; return camP(TOSS_CAM, TOSS.bin[0] + (x - M.bx) * M.sx, (M.floor - y) * M.sy, TOSS.z); },
  sceneToToss: (px, py) => {   // the ray through the pixel, met with the bin's plane
    const C = TOSS_CAM, a = (px + 0.5 - C.cx) / C.f, b = -(py + 0.5 - C.cy) / C.f;
    const d = [C.F[0] + C.R[0] * a + C.U[0] * b, C.F[1] + C.R[1] * a + C.U[1] * b, C.F[2] + C.R[2] * a + C.U[2] * b], k = (TOSS.z - C.E[2]) / d[2];
    const X = C.E[0] + d[0] * k, Y = C.E[1] + d[1] * k, M = EB_MAP.toss; return [M.bx + (X - TOSS.bin[0]) / M.sx, M.floor - Y / M.sy];
  },
  // a lying can on the floor at depth z (cm), for last nights' misses (they lie round the bin, not in a row)
  floorAt: (x, z) => { const M = EB_MAP.toss; return camP(TOSS_CAM, TOSS.bin[0] + (x - M.bx) * M.sx, 3.3, z); },
};
// the game's cursor as a CSS cursor (2x, a hotspot at the palm): the hand and the grabbing fist
const EB_CURSORS = {};
function ebCursorURL(kind) {
  if (EB_CURSORS[kind]) return EB_CURSORS[kind];
  const rows = CUR[kind], w = Math.max(...rows.map((r) => r.length)), h = rows.length, c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
  const g = c.getContext('2d'), col = { o: EB_PAL[P.void], '#': EB_PAL[P.moon] };
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (col[ch]) { g.fillStyle = col[ch]; g.fillRect(i * 2, j * 2, 2, 2); } }));
  return (EB_CURSORS[kind] = `url(${c.toDataURL()}) 8 8, ${kind === 'grab' ? 'grabbing' : 'grab'}`);
}

// ---------------------------------------------------------------- the scenes, from the game's state
function ebDrawerLive(s) {
  const C = DR_CAM, o = ebDrStop(s.o, s.n), F = EBF.buf; ebCopy(F, ebBase('drawer:' + s.n + ':' + o, s.n)); bind(F);
  if (s.hint) { const hp = camP(C, 25, 63.3, o + 3); ebArrow(hp[0] + 34, hp[1] - 6, 'down'); ebLabel('grab the handle, pull', hp[0] + 39, hp[1] - 5); }
  return C;
}
function ebGrabLive(s) {
  const C = DR_CAM, o = DR.open, F = EBF.buf, prims = ebGrabPrims(s.n); ebCopy(F, ebBase('grab:' + s.n, s.n)); bind(F);
  const k = s.k, p0 = [8.6 + CAN.L / 2, 57 + CAN.r, o + DR.cans[0]], p1 = [DR.spot[0], 75 + CAN.L / 2, DR.spot[1]];
  const c = lerp3(p0, p1, k); c[1] += Math.sin(Math.PI * Math.min(1, k)) * 16 + (s.settle || 0);
  const turn = ease((k - 0.35) / 0.55), ax = [Math.cos(turn * Math.PI / 2), Math.sin(turn * Math.PI / 2), 0];
  const can = rCyl([c[0] - ax[0] * CAN.L / 2, c[1] - ax[1] * CAN.L / 2, c[2] - ax[2] * CAN.L / 2], ax, CAN.L, CAN.r, canShader(C.E));
  RT_SCENE = { prims: prims.concat([can]), lights: MON_LIGHT(), amb: 0.16 };
  const pa = camP(C, can.o[0], can.o[1], can.o[2]), pb = camP(C, can.o[0] + ax[0] * CAN.L, can.o[1] + ax[1] * CAN.L, can.o[2] + ax[2] * CAN.L), rr = 3.3 * C.f / Math.min(pa[2], pb[2]) + 3;
  ebCastRect(F, C, [can], Math.min(pa[0], pb[0]) - rr, Math.min(pa[1], pb[1]) - rr, Math.max(pa[0], pb[0]) + rr, Math.max(pa[1], pb[1]) + rr, true);
  const ring = [DR.spot[0], 75.02, DR.spot[1]], rp = camP(C, ring[0] + 5.2, ring[1], ring[2]);
  if (!s.placed) { ebRing(C, ring, 4.6, [0, 1, 0], P.gold, s.t, 4); if (!s.carrying) ebLabel('put it here', rp[0] + 3, rp[1] - 3); }
  else { ebRing(C, ring, 4.6, [0, 1, 0], P.g5, 0, 99); glyph('check', Math.round(rp[0] + 3), Math.round(rp[1] - 2), P.g5); }
  if (!s.carrying && !s.placed) { const q = camP(C, p0[0], p0[1] + CAN.r, p0[2]); ebLabel('drag a can', q[0] + 26, q[1] - 6); }
  return C;
}
function ebOpenLive(s) {
  const C = OPEN_CAM, F = EBF.buf; ebCopy(F, ebBase('open', s.n)); bind(F);
  const [bx, by] = canSprite(F, C, 'can76', [OPEN.c[0], 75, OPEN.c[2]], { baseRow: 166, light: (u, v) => 0.94 + 0.08 * (1 - u) - 0.12 * Math.max(0, v - 0.85) });
  const lift = s.lift, opened = s.pop >= 0, cx = bx + 37, ly = by + 5;
  if (lift > 0) {
    for (let i = -5; i <= 5; i++) for (let j = -1; j <= 1; j++) if (Math.abs(i) + Math.abs(j) * 3 < 6) putI(cx + i, ly + j, P.s3);
    const hgt = Math.round(lift * 10);
    for (let j = 0; j <= hgt; j++) for (let i = -3; i <= 3; i++) {
      const edge = Math.abs(i) === 3 || j === hgt, ring = j > hgt - 5 && j < hgt - 1 && Math.abs(i) < 2;
      if (Math.abs(i) === 3 && j === hgt) continue;
      putI(cx + i, ly - j, ring ? P.void : edge ? P.s4 : i < 0 ? P.moon : P.u6);
    }
    putI(cx, ly, P.s5);
  }
  if (opened) {
    for (let i = -6; i <= 4; i++) for (let j = 0; j <= 2; j++) if (Math.abs(i + 1) + (j === 1 ? 0 : 2) <= 5) putI(cx + i, ly + 2 + j, j === 1 && Math.abs(i + 1) < 4 ? P.void : P.s1);
    const ft = s.pop;
    for (let k = 0; k < 30; k++) {
      const a = hash(k, 3, 9), sp = 0.6 + hash(k, 4, 9), age = (ft * 1.6 + hash(k, 5, 9)) % 1.3; if (ft < 0.05) continue;
      const x = cx - 2 + (a - 0.5) * 24 * age + Math.sin(age * 9 + k) * 1.5, y = ly + 2 - age * 36 * sp;
      if (age < 1.15) putI(Math.round(x), Math.round(y), [EBX.a6, EBX.a5, EBX.a4][k % 3]);
    }
    if (ft < 1) ebLabel('psssht', cx + 16, ly - 20 - ft * 8, EBX.a5);
  } else if (!s.holding) { ebArrow(cx + 28, ly - 16, 'up'); ebLabel('pull the tab up', cx + 32, ly - 15); }
  return C;
}
function ebDrinkLive(s) {
  const C = DRINK_CAM, F = EBF.buf; ebCopy(F, ebBase('drink', s.n)); bind(F);
  if (EB_SCREEN) { const D = EB_SCREEN.data; for (let i = 0; i < EBW * EBH; i++) if (F.S[i] && F.R[i] < 0) { const u = F.Gc[i], v = F.Bc[i], sx = Math.min(473, (u * 474) | 0), sy = Math.min(231, (v * 232) | 0), o = (sy * 474 + sx) * 4; F.R[i] = 0; F.S[i] = 2; F.V[i] = 0; F.M[i] = 0; F.E[i] = 1; F.O[i] = o; } }
  drawHim(F, s.th, s.open, s.t);
  // spilled drink: what missed his mouth, falling and fading; then the can; then what is in the air
  for (const [x, y, a] of s.spill) { const X = Math.round(x), Y = Math.round(y); if (X >= 0 && Y >= 0 && X < EBW && Y < EBH) { const c = acidAt(1 + 2 * a), i = Y * EBW + X; F.S[i] = 1; F.R[i] = c[0]; F.Gc[i] = c[1]; F.Bc[i] = c[2]; F.Z[i] = 50; F.I[i] = -1; } }
  drawDrinkCan(F, s.top, s.phi, s.fill, s.t, s.slosh);
  for (const [x, y] of s.air) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const X = Math.round(x - 0.5) + dx, Y = Math.round(y - 0.5) + dy; if (X >= 0 && Y >= 0 && X < EBW && Y < EBH) { const c = acidAt(dy ? 2.8 : 3.8), i = Y * EBW + X; F.S[i] = 1; F.R[i] = c[0]; F.Gc[i] = c[1]; F.Bc[i] = c[2]; F.Z[i] = 40; F.I[i] = -1; } }
  if (s.ring) ebRing2(s.ring[0], s.ring[1], s.ring[2], s.t);
  if (s.hint) ebLabel(s.hint[0], s.hint[1], s.hint[2], s.hint[3] === 'warn' ? P.copper : P.gold);
  // in you: the bar with its half and full marks; the Space key held while it tilts
  const pct = s.pct, bx = 10, by = 12, bw = 120;
  text('IN YOU', bx, by, 'tiny', P.u5); text(pct + '%', bx + bw + 4, by + 8, 'tiny', pct >= s.full ? P.gold : P.moon);
  rectI(bx, by + 9, bw, 4, P.void); rectI(bx, by + 9, Math.round((bw * pct) / 100), 4, EBX.a4); if (pct) rectI(bx, by + 9, Math.round((bw * pct) / 100), 1, EBX.a6);
  for (const [m, lab] of [[s.half, 'half'], [s.full, 'full']]) { const mx = bx + Math.round((bw * m) / 100); rectI(mx, by + 7, 1, 8, pct >= m ? P.gold : P.u5); text(lab, mx, by + 16, 'tiny', pct >= m ? P.gold : P.u4, { align: 'c' }); }
  const kx = EBW - 66, ky = EBH - 22, dn = s.space ? 1 : 0;
  rectI(kx, ky + 2, 40, 13, P.s1); rectI(kx, ky + dn, 40, 12, dn ? P.s3 : P.s4); rectI(kx + 1, ky + 1 + dn, 38, 9, dn ? P.s4 : P.s5);
  text('Space', kx + 20, ky + 3 + dn, 'tiny', dn ? P.moon : P.s1, { align: 'c' }); text(dn ? 'tilting' : 'tilt', kx + 44, ky + 4, 'tiny', dn ? P.gold : P.u5);
  if (s.verdict) ebLabel(s.verdict[0], EBW / 2 - 60, 44, s.verdict[1] === 'full' ? P.gold : s.verdict[1] === 'half' ? P.copper : P.crimson);
  return C;
}
// a dashed gold ring in scene px (a screen-space ellipse), marching
function ebRing2(cx, cy, r, t, idx = P.gold) { const n = Math.max(24, Math.round(r * 2.4)); for (let a = 0; a < n; a++) if (Math.floor(a / 3 + t * 4) % 2 === 0) putI(Math.round(cx + Math.cos((a / n) * 6.283) * r), Math.round(cy + Math.sin((a / n) * 6.283) * r * 0.9), idx); }
function ebTossLive(s) {
  const C = TOSS_CAM, F = EBF.buf; ebCopy(F, ebBase('toss', s.n)); bind(F);
  for (const [x, y, rot, light, z] of s.cans) sprBlit(F, 'st_closed', x, y, rot, light, z);
  if (s.held) {   // the can pulled back on its band; the slingshot's reach
    const [hx, hy] = s.hand, [cx, cy] = s.held;
    if (s.ring) ebRing2(hx, hy, s.ring, s.t);
    for (let k = 0; k <= 14; k++) { const u = k / 14; if (k % 2 === 0) putI(Math.round(lerp(hx, cx, u)), Math.round(lerp(hy, cy, u)), P.gold); }
    for (const [x, y] of s.dots) putI(Math.round(x), Math.round(y), P.moon);
    sprBlit(F, 'st_closed', cx, cy, 0, 0.88, 1);
  } else if (s.ready) { const [hx, hy] = s.hand; sprBlit(F, 'st_closed', hx, hy + Math.round(Math.sin(s.t * 2.4) * 2), 0, 0.88, 1); ebRing2(hx, hy, 22, s.t); ebLabel('one throw: grab it, pull back, let go', hx + 26, hy - 26); }
  if (s.thrown) sprBlit(F, 'st_closed', s.thrown[0], s.thrown[1], s.thrown[2], 0.88, s.thrown[3]);
  if (s.verdict) { ebLabel(s.verdict[0], EBW / 2 - measure(s.verdict[0], 'tiny') / 2, 40, s.verdict[1] ? P.g5 : P.crimson); }
  if (s.floor > 0) ebLabel('on the floor: ' + s.floor, EBW - 8, EBH - 12, P.u5, 'r');
  return C;
}
const EB_LIVE_SCENES = { 1: ebDrawerLive, 2: ebGrabLive, 3: ebOpenLive, 4: ebDrinkLive, 5: ebToss };
EB_LIVE_SCENES[5] = ebTossLive;
// the dimmed right screen behind the window, kept until the game sends a new one
let EB_BG = null;
function ebBackground(bg) {
  const c = document.createElement('canvas'); c.width = RS_W; c.height = RS_H; const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(bg, 0, 0); EB_SCREEN = x.getImageData(9, 8, 474, 232); ebDim(x); EB_BG = c;
}
let EB_OUT = null, EB_WIN_KEY = '';
function drawEbLive(bg, st, t) {
  if (!EB_OUT) { EB_OUT = document.createElement('canvas'); EB_OUT.width = RS_W; EB_OUT.height = RS_H; }
  if (bg) ebBackground(bg);
  const ctx = EB_OUT.getContext('2d'), [wx, wy, ww] = EB_WIN;
  if (EB_BG) ctx.drawImage(EB_BG, 0, 0); else { ctx.fillStyle = EB_PAL[P.void]; ctx.fillRect(0, 0, RS_W, RS_H); }
  ctx.drawImage(ebWindowLive(st), wx, wy);
  if (!EBF.buf) { EBF.buf = ebBuf(); EBF.canvas = document.createElement('canvas'); EBF.canvas.width = EBW; EBF.canvas.height = EBH; }
  setRes(EBW, EBH); CLIP = null;
  const s = { ...st.scene, t, n: st.n };
  (EB_LIVE_SCENES[st.step] || ebDrawerLive)(s);
  ebCompose(EBF.buf, EBF.canvas.getContext('2d'), ebTint());
  ctx.drawImage(EBF.canvas, EB_SC[0], EB_SC[1]);
  return { canvas: EB_OUT, hits: [{ x: wx + ww - 15, y: wy + 4, w: 10, h: 10, act: 'cancelMonster', arg: '', tip: 'close' }] };
}
// the window: as the mockup's, with the game's line under the steps (its instruction, or what just happened)
function ebWindowLive(st) {
  const key = st.step + '|' + st.say + '|' + (st.note || '');
  if (key === EB_WIN_KEY && EBWIN.canvas) return EBWIN.canvas;
  EB_WIN_KEY = key;
  const c = ebWindowCanvas(st.step, 0);
  if (st.say !== EB_STEPS[st.step - 1].say || st.note) {   // the line under the steps, redrawn
    const [, , w, h] = EB_WIN; setRes(w, h); CLIP = null; const F = EBWIN.buf; F.I.fill(-1); bind(F);
    rectI(8, 30, w - 16, 7, P.s1);
    const x1 = 8 + text(st.say, 8, 31, 'tiny', P.moon); if (st.note) text(st.note, x1 + 8, 31, 'tiny', P.gold);
    const g = c.getContext('2d'), img = g.getImageData(0, 0, w, h), D = img.data;
    for (let k = 0; k < w * h; k++) { const q = F.I[k]; if (q < 0) continue; const cc = EB_RGB[q]; D[k * 4] = cc[0]; D[k * 4 + 1] = cc[1]; D[k * 4 + 2] = cc[2]; D[k * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
  }
  return c;
}
