// ===========================================================================
// Party — dark-fantasy / baroque redesign (Templar, Battle Mage, Holy Priest)
// Heroic proportions: ~7 heads tall, small heads, heavy silhouettes.
// Families: stone = steel · dusk = cloth/heraldry · umber = brass, leather, skin,
//           ivory · moss = priestly vestments · magic = spellwork only.
// ===========================================================================
const FX = { book: null, censer: null, sun: null };

// tapered limb (thigh, greave, arm) with cylindrical shading lit from the right
function limb(x0, y0, x1, y1, w0, w1, lo, hi, mat = M_STONE) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  poly([[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]], (x, y) => {
    const q = clamp(((x + 0.5 - x0) * dx + (y + 0.5 - y0) * dy) / (L * L)), w = w0 + (w1 - w0) * q;
    const r = clamp(0.5 - ((x + 0.5 - x0) * nx + (y + 0.5 - y0) * ny) / w);
    return r > 0.86 ? lo + (hi - lo) * 0.45 : r > 0.52 ? hi : r > 0.24 ? lo + (hi - lo) * 0.5 : lo;
  }, mat);
}

// layered pauldron: domed cap, three lames stepping outward, a raised neck guard, brass-trimmed rim
// dir = +1 lames step right (near shoulder), -1 step left (far shoulder)
function pauldron(px, py, w, dir, d, guard = true, n = 3, trim = true, ch = 4.3) {
  for (let k = n; k >= 1; k--) {
    const cxk = px + dir * k * 1.1, hw = w / 2 + k * 0.6, top = py + ch - 2.9 + k * 2.4;
    const yt = (x) => top + ((x - cxk) / hw) ** 2 * 1.2 + (x - cxk) * dir * 0.42;
    for (let x = Math.floor(cxk - hw); x <= Math.ceil(cxk + hw); x++) {
      if (Math.abs(x + 0.5 - cxk) > hw) continue;
      const y0 = Math.round(yt(x + 0.5)), lit = clamp((x - (cxk - hw)) / (2 * hw));
      for (let j = 0; j < 3; j++) put(x, y0 + j, Math.min(1, (j === 0 ? 0.62 + 0.34 * lit : j === 2 ? (k === n ? 0 : 0.06) : 0.3 + 0.3 * lit) * d), M_STONE);
      if (k === n && trim) put(x, y0 + 2, Math.min(1, (0.55 + 0.35 * lit) * d), M_UMBER);
    }
  }
  ellipse(px, py - 1, w / 2 + 0.4, ch, (x, y) => Math.min(1, (0.28 + 0.62 * clamp(1 - Math.hypot((x - px - w * 0.2) / (w * 0.42), (y - py + 1 + ch * 0.7) / ch))) * d), M_STONE);
  for (let x = Math.floor(px - w / 2); x <= px + w / 2; x++) { const dx = (x + 0.5 - px) / (w / 2 + 0.4); if (Math.abs(dx) < 1) put(x, Math.round(py - 1 + ch * Math.sqrt(1 - dx * dx) + dx * dir * 1.2) - 1, 0.05, M_STONE); }
  for (let x = Math.floor(px - w * 0.3); x <= px + w * 0.32; x++) put(x, Math.round(py - ch - 0.7 + Math.abs(x - px) * 0.2), Math.min(1, 0.98 * d), M_STONE);
  // neck guard rising on the inner edge, flaring outward at the lip
  const gx = px - dir * (w / 2 - 1.5);
  if (guard) {
  poly([[gx - 1, py - 2], [gx + 1, py - 2], [gx + 1 + dir * 1.5, py - 8], [gx - 1 + dir * 0.5, py - 8]], (x) => Math.min(1, (0.3 + 0.35 * clamp((x - gx + 2) / 4)) * d), M_STONE);
  line(gx - 1 + dir * 0.5, py - 8, gx + 1 + dir * 1.5, py - 8, Math.min(1, 0.95 * d), M_STONE);
  }
  put(Math.round(px + dir * w * 0.25), Math.round(py), Math.min(1, 0.85 * d), M_UMBER);
}

// ---- melee swings (#97): a weapon cut for the Knight's Slash and Bash and Garrote's Stab and Backstab. q runs 0..1
// over T.SWING_SEC: wind-up, the cut (with a bright smear along the edge), a short hold, back to the guard.
const ease3 = (u) => u * u * (3 - 2 * u);
// pose(q) -> [hand x, hand y, blade angle]; keys: [rest, wind-up, strike], each [hx, hy, angle]; lift: the hand's arc up
function swingPose(q, K, lift) {
  const [R, W, S] = K, mix = (A, B, e, up) => [A[0] + (B[0] - A[0]) * e, A[1] + (B[1] - A[1]) * e - up * Math.sin(Math.PI * e), A[2] + (B[2] - A[2]) * e];
  if (q < 0.25) return mix(R, W, ease3(q / 0.25), 0);
  if (q < 0.5) return mix(W, S, ease3((q - 0.25) / 0.25), lift);
  if (q < 0.62) return S;
  return mix(S, R, ease3((q - 0.62) / 0.38), lift * 0.5);
}
// the smear: a crescent where the edge swept, from r0 to r1 out of the hand, over the cut so far: full at the blade,
// thinning and fading behind it; it fades out after the strike
function swingSmear(q, K, lift, r0, r1) {
  if (q < 0.27 || q > 0.72) return;
  const u1 = Math.min(q, 0.5), u0 = Math.max(0.25, u1 - 0.17), fade = q <= 0.5 ? 1 : 1 - (q - 0.5) / 0.22;
  const n = Math.max(12, Math.ceil((u1 - u0) * 30 * r1));   // dense enough that the swept band has no gaps
  for (let k = 0; k <= n; k++) {
    const u = u0 + (u1 - u0) * k / n, [hx, hy, a] = swingPose(u, K, lift), rec = k / n, ux = Math.cos(a), uy = Math.sin(a);
    const rIn = r1 - (r1 - r0) * (0.25 + 0.75 * rec);
    for (let r = rIn; r <= r1; r += 0.6) {
      const edge = (r - rIn) / Math.max(1, r1 - rIn), al = fade * rec * rec * (0.25 + 0.75 * edge);
      if (al < 0.06) continue;
      const x = Math.round(hx + ux * r), y = Math.round(hy + uy * r);
      if (x < 0 || y < 0 || x >= BW || y >= BH) continue;
      const i = y * BW + x; B.V[i] = B.V[i] + (0.98 - B.V[i]) * Math.min(1, al); B.A[i] = 1; B.T[i] = TAG;
      if (al > 0.4) { B.M[i] = M_STONE; B.E[i] = 1; }
    }
  }
}
// an arm from shoulder S to hand H, upper and lower length L each, the elbow bent down and outward (side: +1 right)
function armTo(S, H, L, side, w0, w1, lo, hi, mat) {
  const dx = H[0] - S[0], dy = H[1] - S[1], d = Math.min(Math.hypot(dx, dy), 2 * L - 0.1), m = [S[0] + dx / 2, S[1] + dy / 2];
  const off = Math.sqrt(Math.max(0, L * L - (d / 2) ** 2)), nx = -dy / (Math.hypot(dx, dy) || 1), ny = dx / (Math.hypot(dx, dy) || 1);
  const sgn = (ny * 1 + nx * side * 0.3) >= 0 ? 1 : -1, E = [m[0] + nx * off * sgn, m[1] + ny * off * sgn];
  limb(S[0], S[1], E[0], E[1], w0, w0 - 0.4, lo, hi, mat); limb(E[0], E[1], H[0], H[1], w1, w1 - 0.4, lo + 0.04, hi + 0.04, mat);
}

function knight(cx, fy, s, b, t, _carry, _wp, swq) {
  const Y = fy + b, sh = s >> 1, sw = Math.sin(t * 1.7) * 0.6;
  // ragged cape, hanging straight behind the far shoulder
  const hem = [];
  for (let k = 0; k <= 7; k++) { const x = cx - 2 - k * 1.9 - sh * k / 7; hem.push([x, fy - 6 - (k % 2 ? 4 : 0) - (k === 7 ? 6 : 0) + Math.round(sw * k / 7)]); }
  poly([[cx - 9, Y - 47], [cx - 1, Y - 47], [cx - 1, Y - 30], ...hem, [cx - 15 - sh, Y - 32], [cx - 13, Y - 42]],
    (x, y) => 0.1 + 0.12 * clamp((x - cx + 16) / 15) - (((x - cx + 40) % 3 === 0 && y > Y - 38) ? 0.04 : 0), M_DUSK);
  // legs: long cuisses, knee cops with fan plates, greaves, pointed sabatons (wide, planted stance)
  const legs = [{ hx: cx - 3, kx: cx - 6 - s * 0.6, ax: cx - 8 - s, d: 0.8 }, { hx: cx + 3, kx: cx + 6 + s * 0.6, ax: cx + 7 + s, d: 1 }];
  for (const L of legs) {
    const hy = Y - 25, ky = fy - 13, ay = fy - 3;
    limb(L.hx, hy, L.kx, ky, 6, 4.6, 0.22 * L.d, 0.62 * L.d);
    limb(L.kx, ky + 1, L.ax, ay - 1, 5.2, 4, 0.24 * L.d, 0.72 * L.d);
    poly([[L.kx - 2, ky - 1], [L.kx - 5, ky + 1], [L.kx - 2, ky + 2]], 0.42 * L.d, M_STONE);
    ellipse(L.kx + 0.3, ky + 0.5, 2.8, 2.1, (x, y) => (0.35 + 0.6 * clamp(1 - Math.hypot(x - L.kx - 1, y - ky) / 2.5)) * L.d, M_STONE);
    poly([[L.ax - 2, ay - 1], [L.ax + 2, ay - 1], [L.ax + 6, fy - 1], [L.ax + 7, fy], [L.ax - 2, fy]], (x) => (0.28 + 0.36 * clamp((x - L.ax + 2) / 9)) * L.d, M_STONE);
    line(L.ax - 1, ay + 1, L.ax + 3, ay + 1, 0.12, M_STONE);
  }
  // tassets over the thighs + narrow tabard falling between the legs
  for (const [a, c, d] of [[cx - 6, cx - 1, 0.72], [cx + 1, cx + 6, 1]]) {
    const fl = a < cx ? -1 : 1;
    poly([[a, Y - 30], [c, Y - 30], [c + (fl > 0 ? 1 : 0), Y - 21], [a + (fl < 0 ? -1 : 0), Y - 22]], (x, y) => ((y + 30 - Y) % 3 === 2 ? 0.1 : (0.3 + 0.4 * clamp((x - a) / 6))) * d, M_STONE);
  }
  poly([[cx - 2, Y - 30], [cx + 3, Y - 30], [cx + 3 + sh, fy - 11], [cx + 1 + sh, fy - 9], [cx - 1 + sh, fy - 12], [cx - 2 + sh, fy - 10]], (x, y) => 0.3 + 0.2 * clamp((x - cx + 2) / 5) - ((y & 3) === 0 ? 0.06 : 0), M_DUSK);
  line(cx - 2, Y - 30, cx - 2 + sh, fy - 10, 0.6, M_UMBER);
  // breastplate: broad chest tapering to a cinched waist, centre ridge, pointed plackart
  const rx = cx + 1;
  poly([[cx - 8, Y - 47], [cx + 8, Y - 47], [cx + 10, Y - 43], [cx + 8, Y - 37], [cx + 5, Y - 31], [cx - 5, Y - 31], [cx - 8, Y - 37], [cx - 10, Y - 43]], (x, y) => {
    const u = x + 0.5 - rx, v = clamp((y - (Y - 47)) / 16);
    if (Math.abs(u) < 0.7) return 0.96 - 0.3 * v;
    return (u < 0 ? 0.3 + 0.3 * (1 + u / 10) : 0.74 - 0.34 * clamp(u / 9)) * (1 - 0.3 * v);
  }, M_STONE);
  for (let k = 0; k <= 6; k++) { put(rx - k, Y - 35 + k * 0.5, 0.08, M_STONE); put(rx + k, Y - 35 + k * 0.5, 0.08, M_STONE); }
  line(cx - 10, Y - 43, cx - 8, Y - 37, 0.62, M_STONE); line(cx - 8, Y - 37, cx - 5, Y - 32, 0.62, M_STONE);
  rect(cx - 5, Y - 31, 11, 2, 0.26, M_UMBER); rect(cx, Y - 31, 3, 2, 0.88, M_UMBER);
  // far pauldron (smaller, in shade)
  pauldron(cx - 10, Y - 47, 11, -1, 0.82, true, 2, false, 5);
  // bastard sword on the far shoulder: broad fullered blade, wide crossguard, hand-and-a-half grip, wheel pommel.
  // Swinging (#97) it leaves the shoulder: up behind the helm, over the top, the cut ends forward and down at the
  // enemy, and it is drawn last, over the shield.
  const KS = [[cx - 9, Y - 42, Math.atan2(-31, -17)], [cx - 13, Y - 50, -2.65], [cx + 9, Y - 45, 0.38]];
  const SW = swq != null && swq >= 0 ? swingPose(swq, KS, 7) : null;
  const BL = Math.hypot(17, 31), Gx = SW ? SW[0] : cx - 9, Gy = SW ? SW[1] : Y - 42, A_ = SW ? SW[2] : KS[0][2], ax = Math.cos(A_), ay = Math.sin(A_);
  const nx = -ay, ny = ax; // across the blade, pointing to the lit (right) side
  const hwAt = (q) => (q < 0.82 ? 2.6 - 0.5 * q : 2.19 * (1 - q) / 0.18);
  const swordBlade = () => {
    const pts = [];
    for (const q of [0, 0.82, 1]) pts.push([Gx + ax * BL * q + nx * hwAt(q), Gy + ay * BL * q + ny * hwAt(q)]);
    for (const q of [1, 0.82, 0]) pts.push([Gx + ax * BL * q - nx * hwAt(q), Gy + ay * BL * q - ny * hwAt(q)]);
    pts.splice(3, 1);
    poly(pts, (x, y) => {
      const px = x + 0.5 - Gx, py = y + 0.5 - Gy, q = clamp((px * ax + py * ay) / BL), r = (px * nx + py * ny) / Math.max(0.6, hwAt(q));
      if (r > 0.5) return 0.98; if (r < -0.55) return 0.42; if (Math.abs(r) < 0.22 && q < 0.7) return 0.26; return 0.68;
    }, M_STONE);
    // grip (7 px, leather-wrapped), pommel
    for (let k = 1; k <= 8; k++) { const x = Gx - ax * k, y = Gy - ay * k; put(x, y, k % 2 ? 0.34 : 0.2, M_UMBER); put(x + nx * 0.9, y + ny * 0.9, k % 2 ? 0.5 : 0.3, M_UMBER); }
    ellipse(Gx - ax * 9.5 + 0.5, Gy - ay * 9.5 + 0.5, 1.9, 1.9, (x, y) => 0.55 + 0.4 * clamp((x - (Gx - ax * 9.5) + 1) / 3), M_UMBER); put(Gx - ax * 9.5, Gy - ay * 9.5, 0.3, M_UMBER);
  };
  const swordGuard = () => {
    // crossguard: wide, quillons flaring toward the blade; the gauntlet on the grip under it
    const qx0 = Gx - nx * 6, qy0 = Gy - ny * 6, qx1 = Gx + nx * 6, qy1 = Gy + ny * 6;
    line(qx0 - ax, qy0 - ay, qx1 - ax, qy1 - ay, 0.32, M_UMBER);
    line(qx0, qy0, Gx, Gy, 0.62, M_UMBER); line(Gx, Gy, qx1, qy1, 0.94, M_UMBER);
    put(qx0 + ax, qy0 + ay, 0.6, M_UMBER); put(qx1 + ax, qy1 + ay, 0.94, M_UMBER);
    ellipse(Gx + 0.5, Gy + 0.5, 1.3, 1.3, 0.95, M_UMBER);
    rect(Math.round(Gx - ax * 2.5) - 1, Math.round(Gy - ay * 2.5) - 1, 3, 3, (x) => x > Gx - ax * 2.5 ? 0.66 : 0.38, M_STONE);
  };
  if (!SW) {
    swordBlade();
    // sword arm: elbow out, the gauntleted fist closed over the grip under the guard (drawn after the grip)
    limb(cx - 12, Y - 41, cx - 16, Y - 33, 4.2, 3.6, 0.2, 0.52); limb(cx - 16, Y - 33, cx - 8, Y - 38, 3.6, 3.2, 0.26, 0.6);
    poly([[cx - 18, Y - 35], [cx - 15, Y - 35], [cx - 14, Y - 32], [cx - 18, Y - 31]], (x) => 0.4 + 0.3 * clamp((x - cx + 18) / 4), M_STONE); put(cx - 19, Y - 33, 0.45, M_STONE);
    rect(cx - 9, Y - 40, 3, 3, (x) => 0.42 + 0.3 * clamp((x - cx + 9) / 3), M_STONE); put(cx - 7, Y - 40, 0.82, M_STONE);
    swordGuard();
  }
  // gorget, small hounskull helm with a beaked visor, swept-back plume
  rect(cx - 4, Y - 51, 8, 5, (x) => 0.08 + 0.2 * clamp((x - cx + 4) / 8), M_STONE);
  const ph = Math.sin(t * 2.3) * 0.8;
  poly([[cx - 1, Y - 59], [cx + 1, Y - 60], [cx - 1, Y - 64], [cx - 6, Y - 66 + ph], [cx - 12, Y - 64 + ph], [cx - 15, Y - 60 + ph], [cx - 10, Y - 61], [cx - 5, Y - 60]],
    (x, y) => 0.16 + 0.3 * clamp((x - cx + 15) / 16) - ((x + y) % 3 === 0 ? 0.07 : 0), M_DUSK);
  poly([[cx - 3, Y - 58], [cx - 1, Y - 60], [cx + 2, Y - 60], [cx + 4, Y - 58], [cx + 5, Y - 54], [cx + 4, Y - 50], [cx - 3, Y - 50], [cx - 4, Y - 54]],
    (x, y) => 0.26 + 0.64 * clamp((x - cx + 3) / 8) * (1 - 0.4 * clamp((y - Y + 59) / 10)), M_STONE);
  line(cx - 1, Y - 60, cx + 2, Y - 60, 0.98, M_STONE);
  line(cx - 1, Y - 56, cx + 5, Y - 56, 0.02, M_STONE); line(cx + 3, Y - 55, cx + 3, Y - 53, 0.02, M_STONE);
  line(cx + 3, Y - 59, cx + 3, Y - 57, 0.92, M_UMBER); line(cx + 2, Y - 58, cx + 4, Y - 58, 0.8, M_UMBER);
  put(cx + 1, Y - 52, 0.08, M_STONE); put(cx + 1, Y - 54, 0.08, M_STONE);
  // near pauldron first: the shield, held on the forearm, covers its lower lames
  pauldron(cx + 11, Y - 47, 12, 1, 1.05, true, 3, true, 5.2);
  // great heater shield: straight sides, short point, battered brass rim, wine field, pale sun
  const x0 = cx + 5, x1 = cx + 29, y0 = Y - 42, y1 = fy - 15, tip = fy - 1, mid = (x0 + x1) / 2;
  const heater = (o) => [[x0 + o, y0 + 2 + o * 0.5], [mid, y0 + o], [x1 - o, y0 + 2 + o * 0.5], [x1 - o, y1 - o * 0.3], [mid + 0.5, tip - o * 1.7], [x0 + o, y1 - o * 0.3]];
  line(x0 - 1, y0 + 3, x0 - 1, y1, 0.1, M_STONE);
  poly(heater(0), (x) => 0.5 + 0.45 * clamp((x - x0) / (x1 - x0)), M_UMBER);
  poly(heater(2), (x, y) => 0.18 + 0.32 * Math.sin(clamp((x - x0) / (x1 - x0)) * Math.PI * 0.85 + 0.2) - (hash(x, y, 9) > 0.93 ? 0.08 : 0), M_DUSK);
  for (const [a2, c2] of [[x0 + 4, y0 + 24], [x0 + 15, y0 + 6], [x0 + 8, y0 + 31], [x1 - 7, y0 + 27]]) line(a2, c2, a2 + 3, c2 + 1, 0.55, M_DUSK);
  const ex = Math.round(mid), ey = y0 + 15;
  for (let a2 = 0; a2 < 8; a2++) { const an = a2 * Math.PI / 4 + Math.PI / 8; line(ex + Math.cos(an) * 3.5, ey + Math.sin(an) * 3.5, ex + Math.cos(an) * (a2 % 2 ? 6 : 8.5), ey + Math.sin(an) * (a2 % 2 ? 6 : 8.5), 0.82, M_UMBER); }
  ellipse(ex + 0.5, ey + 0.5, 3.1, 3.1, 0.95, M_UMBER); put(ex, ey, 0.7, M_UMBER);
  for (const [qx, qy] of [[x0 + 2, y0 + 4], [x1 - 2, y0 + 4], [x0 + 2, y1 - 2], [x1 - 2, y1 - 2], [mid, tip - 3]]) put(qx, qy, 0.98, M_UMBER);
  rect(x1 - 6, y0 + 5, 1, 7, 0.88, M_UMBER); rect(x1 - 5, y0 + 6, 1, 5, 0.72, M_UMBER); ellipse(x1 - 5.5, y0 + 4.5, 1.7, 1.7, 0.5, M_DUSK); put(x1 - 6, y0 + 4, 0.75, M_DUSK);
  if (SW) {   // the swing, over the shield: the smear, the arm from the far shoulder, the sword, the fist and guard
    swingSmear(swq, KS, 7, BL * 0.55, BL * 1.04);
    armTo([cx - 7, Y - 45], [Gx - ax * 2.5, Gy - ay * 2.5], 9, 1, 4, 3.6, 0.22, 0.6, M_STONE);
    swordBlade(); swordGuard();
  }
}

function mage(cx, fy, s, b, t) {
  const Y = fy + b, sh = s >> 1;
  // long robe with fold lines
  poly([[cx - 6, Y - 41], [cx + 5, Y - 41], [cx + 9 + sh, fy - 1], [cx - 12 + sh, fy - 1]],
    (x, y) => 0.22 + 0.26 * Math.sin(clamp((x - cx + 12) / 21) * Math.PI) - (((x - cx + 40) % 4 === 0 && y > Y - 30) ? 0.07 : 0), M_DUSK);
  poly([[cx + 1, Y - 30], [cx + 4, Y - 30], [cx + 6 + sh, fy - 1], [cx + 1 + sh, fy - 1]], 0.48, M_DUSK);
  line(cx + 1, Y - 30, cx + 1 + sh, fy - 1, 0.72, M_UMBER); line(cx + 4, Y - 30, cx + 6 + sh, fy - 1, 0.72, M_UMBER);
  rect(cx - 12 + sh, fy - 2, 21, 1, 0.62, M_UMBER);
  // belt, pouch, scroll case
  rect(cx - 7, Y - 24, 14, 2, 0.32, M_UMBER); rect(cx - 6, Y - 22, 3, 4, 0.38, M_UMBER); rect(cx - 2, Y - 23, 2, 6, 0.62, M_UMBER);
  // raised casting arm (back): drawn before the mantle, which covers its shoulder
  poly([[cx - 8, Y - 40], [cx - 5, Y - 39], [cx - 10, Y - 31], [cx - 13, Y - 33]], 0.3, M_DUSK);
  // short mantle with trim
  poly([[cx - 9, Y - 42], [cx + 6, Y - 42], [cx + 8, Y - 31], [cx + 2, Y - 29], [cx - 4, Y - 30], [cx - 11, Y - 28]], (x) => 0.18 + 0.22 * clamp((x - cx + 11) / 19), M_DUSK);
  line(cx - 11, Y - 28, cx - 4, Y - 30, 0.66, M_UMBER); line(cx - 4, Y - 30, cx + 2, Y - 29, 0.66, M_UMBER); line(cx + 2, Y - 29, cx + 8, Y - 31, 0.66, M_UMBER);
  rect(cx - 13, Y - 41, 2, 3, 0.7, M_UMBER);
  // stiff baroque collar behind the head
  poly([[cx - 9, Y - 51], [cx - 3, Y - 42], [cx + 2, Y - 42], [cx - 1, Y - 49]], 0.4, M_DUSK);
  line(cx - 9, Y - 51, cx - 1, Y - 49, 0.68, M_UMBER);
  // deep pointed hood, face in shadow
  poly([[cx - 4, Y - 54], [cx + 3, Y - 52], [cx + 5, Y - 46], [cx + 4, Y - 42], [cx - 5, Y - 42], [cx - 7, Y - 48], [cx - 10, Y - 57], [cx - 7, Y - 57]], (x) => 0.2 + 0.24 * clamp((x - cx + 10) / 15), M_DUSK);
  rect(cx + 1, Y - 49, 3, 5, 0.36, M_UMBER);
  put(cx + 3, Y - 48, 1, M_MAGIC, 1);
  poly([[cx, Y - 45], [cx + 5, Y - 45], [cx + 4, Y - 37], [cx + 2, Y - 31], [cx + 1, Y - 37]], grad(cx, Y - 45, cx, Y - 31, 0.95, 0.6), M_UMBER);
  // open grimoire, chained to the belt
  const bx = cx + 6, by = Y - 31;
  for (let k = 0; k <= 7; k++) { const q = k / 7, x = cx + 1 + (bx + 2 - cx - 1) * q, y = Y - 21 + (by + 5 - Y + 21) * q + Math.sin(q * Math.PI) * 3; put(x, y, k % 2 ? 0.8 : 0.45, M_STONE); }
  poly([[bx, by + 2], [bx + 12, by], [bx + 12, by + 3], [bx, by + 5]], 0.28, M_UMBER);
  poly([[bx + 1, by + 1], [bx + 6, by - 2], [bx + 6, by + 2], [bx + 1, by + 4]], 0.95, M_UMBER, 1);
  poly([[bx + 6, by - 2], [bx + 11, by - 3], [bx + 11, by + 1], [bx + 6, by + 2]], 0.86, M_UMBER, 1);
  for (let k = 0; k < 2; k++) { line(bx + 2, by + 1 + k * 2, bx + 5, by - 1 + k * 2, 0.5, M_UMBER, 1); line(bx + 7, by - 1 + k * 2, bx + 10, by - 2 + k * 2, 0.5, M_UMBER, 1); }
  rect(bx + 2, by + 4, 3, 2, 0.68, M_UMBER);
  // runes rising off the page, spark at the casting hand
  for (let k = 0; k < 7; k++) { const q = (t * 0.45 + k / 7) % 1, x = bx + 6 + Math.sin(q * 7 + k * 2) * 3.5, y = by - 4 - q * 16; if (q < 0.92) put(x, y, 1 - q * 0.55, M_MAGIC, 1); }
  const sp = Math.floor(t * 8) % 3; put(cx - 12, Y - 43 - sp, 0.95, M_MAGIC, 1); if (sp === 1) { put(cx - 13, Y - 44, 0.6, M_MAGIC, 1); put(cx - 11, Y - 44, 0.6, M_MAGIC, 1); }
  FX.book = [bx + 6, by - 3];
}

function priest(cx, fy, s, b, t) {
  const Y = fy + b, sh = s >> 1;
  // processional sun icon (front hand): the head first; the pole is drawn over the robe below
  const ix = cx + 10, iy = Y - 64;
  for (let a = 0; a < 12; a++) { const an = a * Math.PI / 6, L = a % 2 ? 4.5 : 6.5; line(ix + Math.cos(an) * 3, iy + Math.sin(an) * 3, ix + Math.cos(an) * L, iy + Math.sin(an) * L, a % 2 ? 0.72 : 0.9, M_UMBER, 1); }
  ellipse(ix + 0.5, iy + 0.5, 3, 3, 0.98, M_UMBER, 1); put(ix, iy, 0.7, M_UMBER, 1);
  FX.sun = [ix, iy];
  // ivory alb with lace hem
  poly([[cx - 8, Y - 24], [cx + 6, Y - 24], [cx + 9 + sh, fy - 1], [cx - 10 + sh, fy - 1]], (x) => 0.58 + 0.24 * clamp((x - cx + 10) / 19) - (((x - cx + 40) % 4 === 0) ? 0.08 : 0), M_UMBER);
  for (let x = cx - 10 + sh; x <= cx + 9 + sh; x++) if ((x & 1) === 0) put(x, fy - 2, 0.98, M_UMBER);
  // censer arm's sleeve (back): under the chasuble, which covers its shoulder
  poly([[cx - 10, Y - 40], [cx - 7, Y - 38], [cx - 13, Y - 29], [cx - 16, Y - 32]], 0.3, M_MOSS);
  // moss chasuble with ivory Y-orphrey
  poly([[cx - 8, Y - 45], [cx + 6, Y - 45], [cx + 10, Y - 31], [cx + 8, Y - 16], [cx - 1, Y - 13], [cx - 10, Y - 16], [cx - 12, Y - 31]], (x) => 0.2 + 0.32 * Math.sin(clamp((x - cx + 12) / 22) * Math.PI), M_MOSS);
  line(cx - 10, Y - 16, cx - 1, Y - 13, 0.75, M_UMBER); line(cx - 1, Y - 13, cx + 8, Y - 16, 0.75, M_UMBER);
  line(cx - 1, Y - 37, cx - 1, Y - 14, 0.88, M_UMBER); line(cx, Y - 37, cx, Y - 14, 0.72, M_UMBER);
  line(cx - 1, Y - 37, cx - 6, Y - 44, 0.82, M_UMBER); line(cx, Y - 37, cx + 4, Y - 44, 0.82, M_UMBER);
  ellipse(cx, Y - 28, 2, 2, 0.95, M_UMBER); put(cx - 1, Y - 29, 0.6, M_UMBER);
  // censer arm (back) + swinging censer on a chain
  const th = 0.6 * Math.sin(t * 3.1), hx = cx - 15, hy = Y - 28, L = 11, ex = hx + Math.sin(th) * L, ey = hy + Math.cos(th) * L;
  for (let k = 1; k < 9; k++) put(hx + Math.sin(th) * k * L / 9, hy + Math.cos(th) * k * L / 9, k % 2 ? 0.75 : 0.45, M_STONE);
  ellipse(ex, ey + 2, 3, 2.6, (x) => 0.12 + 0.22 * clamp((ex + 3 - x) / 6), M_STONE); rect(ex - 1, ey - 1.5, 2, 2, 0.5, M_STONE); rect(ex - 2, ey + 1, 4, 1, 0.04, M_STONE);
  put(ex, ey + 2, 1, M_UMBER, 1); put(ex - 1, ey + 3, 0.92, M_UMBER, 1); put(ex + 1, ey + 3, 0.8, M_UMBER, 1);
  FX.censer = [ex, ey];
  rect(cx - 16, Y - 31, 3, 3, 0.66, M_UMBER);
  // the icon's pole, held in the near hand in front of the robe
  rect(cx + 9, Y - 60, 2, 60 - b, grad(cx + 9, 0, cx + 11, 0, 0.6, 0.35), M_UMBER);
  // sleeve + hand on the icon
  poly([[cx + 2, Y - 41], [cx + 7, Y - 39], [cx + 10, Y - 32], [cx + 6, Y - 31]], 0.38, M_MOSS);
  rect(cx + 8, Y - 33, 4, 3, 0.68, M_UMBER);
  // amice, aged face, mitre with lappets
  rect(cx - 4, Y - 47, 8, 3, 0.8, M_UMBER);
  rect(cx - 2, Y - 53, 6, 6, (x) => 0.5 + 0.22 * clamp((x - cx + 2) / 6), M_UMBER);
  put(cx + 4, Y - 51, 0.62, M_UMBER); put(cx + 2, Y - 51, 0.08, M_UMBER); rect(cx - 1, Y - 48, 4, 1, 0.38, M_UMBER);
  line(cx - 3, Y - 52, cx - 6, Y - 42, 0.42, M_MOSS); line(cx - 2, Y - 52, cx - 5, Y - 42, 0.3, M_MOSS);
  poly([[cx - 3, Y - 53], [cx + 4, Y - 53], [cx + 4, Y - 59], [cx + 1, Y - 64], [cx - 3, Y - 59]], (x) => 0.66 + 0.24 * clamp((x - cx + 3) / 7), M_UMBER);
  line(cx + 1, Y - 54, cx + 1, Y - 63, 0.42, M_MOSS); rect(cx - 3, Y - 54, 8, 1, 0.45, M_MOSS);
}

// Garrote, the rogue (after Paweł's references): athletic, long-limbed, shown chest to the camera like the others (a
// three-quarter view turned toward the enemy). Sneaking: knees bent, shoulders rounded, the head low between them and
// pushed a little forward, the eyes looking ahead from under the rim of a deep rounded hood that falls into a jagged
// capelet; a wine scarf over the lower face. Arms in a ready guard: elbows bent out to the sides, fists low at the hips.
// Near-black plum cloak behind, black leathers, crossed straps, a front tabard with a gold hem, knee pads, tall boots.
// carry (out of battle): both daggers reverse-gripped (for stabbing), blades lying back under the forearms.
// fight (battle): near hand forward grip at the enemy, far hand reverse grip.
// walk: a slow prowl, 12 frames over 1 s: long low steps (feet lift 3 px), knees solved from hip and ankle so they bend
// through every step, a 1 px rise at mid-stance, the guard held with only a 1 px sway.
// Draw order, back to front: cloak, far arm and its dagger (hanging at his side), far leg, near leg, torso, tabard,
// near arm and its dagger, capelet, hood.
const ROGUE_WALK = { T: 1.0, frames: 12, stride: 5, lift: 3, thigh: 17.5, shin: 13.5 };
function rogue(cx, fy, s, b, t, carry, wp, swq) {
  const walk = wp != null, TAU = Math.PI * 2, W_ = ROGUE_WALK, CL = M_DUSK, LE = M_UMBER;
  const bob = walk ? -Math.round(0.5 - 0.5 * Math.cos(TAU * 2 * wp)) : 0;
  const Y = walk ? fy + 1 + bob : fy + b;
  const sw = walk ? Math.sin(TAU * wp) : 0;                                 // -1..1 over the stride
  const sh = walk ? Math.round(sw * 1.5) : s >> 1, flap = walk ? Math.sin(TAU * wp + 1) * 1.2 : Math.sin(t * 1.7);
  const blade = (x0, y0, x1, y1, lo = 0.5) => { const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, n = Math.ceil(L);
    for (let k = 0; k <= n; k++) { const x = x0 + ux * k, y = y0 + uy * k; put(Math.round(x), Math.round(y), k >= n - 1 ? 0.9 : 1, M_STONE); if (k < n - 1) put(Math.round(x - uy * 0.9), Math.round(y + ux * 0.9), lo, M_STONE); } };
  const ik = (H, A) => {
    const dx = A[0] - H[0], dy = A[1] - H[1], d = clamp(Math.hypot(dx, dy), Math.abs(W_.thigh - W_.shin) + 0.1, W_.thigh + W_.shin - 0.05);
    const a = Math.atan2(dy, dx), bb = Math.acos(clamp((W_.thigh ** 2 + d * d - W_.shin ** 2) / (2 * W_.thigh * d), -1, 1));
    return [H[0] + W_.thigh * Math.cos(a - bb), H[1] + W_.thigh * Math.sin(a - bb)];
  };
  // legs, three-quarter view: the far leg on the left, the near leg on the right, knees bent toward the enemy
  let NL, FL;
  const fH = [cx - 3, Y - 33], nH = [cx + 3, Y - 33];
  if (walk) {
    const foot = (ph, base) => {
      if (ph < 0.5) return [base + W_.stride - 4 * W_.stride * ph, fy - 3, 0];
      const q = (ph - 0.5) / 0.5, e = q * q * (3 - 2 * q), lift = W_.lift * Math.sin(Math.PI * q);
      return [base - W_.stride + 2 * W_.stride * e, fy - 3 - lift, lift];
    };
    const nA = foot(wp, cx + 6), fA = foot((wp + 0.5) % 1, cx - 5);
    NL = { h: nH, k: ik(nH, nA), a: nA, lift: nA[2] }; FL = { h: fH, k: ik(fH, fA), a: fA, lift: fA[2] };
  } else {
    NL = { h: nH, k: [cx + 8 + s * 0.6, fy - 15], a: [cx + 7 + s, fy - 3], lift: 0 };
    FL = { h: fH, k: [cx - 2 - s * 0.6, fy - 15], a: [cx - 6 - s, fy - 3], lift: 0 };
  }
  for (const L of [NL, FL]) L.c = [L.k[0] + (L.a[0] - L.k[0]) * 0.42 - 0.6, L.k[1] + (L.a[1] - L.k[1]) * 0.42];
  // arms: a ready guard. Elbows bent at the sides, both forearms pointing forward (toward the enemy and the camera):
  // the near fist out front on the right, the far fist in front of his body. Walking, only a 1 px sway.
  const d = walk ? Math.round(sw) : 0;
  // arms hang low and nearly straight (after Paweł's sketch): long (upper ~10, forearm ~10 px), only a slight bend at
  // the elbow; the front fist low and a little forward at the top of the thigh, the back fist at his side behind the hip
  const NA = { s: [cx + 10, Y - 44], e: [cx + 11, Y - 34 + d], h: [cx + 15, Y - 25 + d] };
  const FA = { s: [cx - 1, Y - 45], e: [cx - 4, Y - 35 - d], h: [cx - 6, Y - 26 - d] };
  const backBlade = (A) => {                                               // reverse grip, the blade lying back under the forearm
    const [hx, hy] = A.h; put(hx + 2, hy - 1, 0.62, LE);                   // pommel out of the thumb side, in front
    line(hx - 1, hy + 2, hx + 1, hy + 2, 0.66, M_STONE); blade(hx - 1, hy + 3, hx - (A === FA ? 9 : 6), hy + 3); };
  const drawLeg = (L, near) => {
    limb(L.h[0], L.h[1], L.k[0], L.k[1], near ? 4.6 : 4.4, 3.6, near ? 0.1 : 0.06, near ? 0.46 : 0.24, LE);
    limb(L.k[0], L.k[1], L.c[0], L.c[1], 3.6, 3.8, near ? 0.22 : 0.14, near ? 0.6 : 0.34, LE);
    limb(L.c[0], L.c[1], L.a[0], L.a[1], 3.8, 3, near ? 0.22 : 0.14, near ? 0.6 : 0.34, LE);
    ellipse(L.k[0] + 0.5, L.k[1] + 0.5, 2, 1.8, (x) => (x > L.k[0] ? (near ? 0.7 : 0.42) : (near ? 0.42 : 0.26)), LE);   // knee pad
    for (const q of [0.35, 0.75]) { const x = Math.round(L.c[0] + (L.a[0] - L.c[0]) * q), y = Math.round(L.c[1] + (L.a[1] - L.c[1]) * q); line(x - 1, y, x + 1, y - 1, 0.04, LE); put(x + 1, y - 1, near ? 0.86 : 0.6, M_STONE); }
    const [ax, ay] = [Math.round(L.a[0]), Math.round(L.a[1])], f = near ? 0.32 : 0.2, f0 = near ? 0.2 : 0.12;
    if (L.lift > 1.2) poly([[ax - 1, ay - 1], [ax + 2, ay - 1], [ax + 6, ay + 2], [ax + 5, ay + 3], [ax - 1, ay + 1]], (x) => f0 + f * clamp((x - ax + 1) / 7), LE);
    else poly([[ax - 2, ay], [ax + 2, ay], [ax + 6, ay + 2], [ax + 6, ay + 3], [ax - 2, ay + 3]], (x) => f0 + f * clamp((x - ax + 2) / 8), LE);
  };
  // the cloak, behind: from the shoulders, flaring back past the far side; tattered hem with loose strands
  const hem = [];
  for (let k = 0; k <= 9; k++) {
    const x = cx - 1 - k * 1.8 - sh * k / 9, rag = [0, 3, 1, 0, 4, 1, 2, 0, 3, 5][k];
    hem.push([x, fy - 6 - rag - Math.max(0, k - 6) * 2 + Math.round(flap * k / 9)]);
  }
  const backX = (y) => cx - 7 - (y - (Y - 45)) * 0.38;
  poly([[cx - 1, Y - 47], [cx + 8, Y - 46], [cx + 8, Y - 40], [cx + 5, fy - 12], ...hem, [cx - 19 - sh + flap, Y - 20], [cx - 13, Y - 33], [cx - 7, Y - 45]],
    (x, y) => {
      if (x - backX(y) < 1.2 && y < Y - 14) return 0.26;
      const fold = ((x - cx + 41 + Math.round((y - Y) * 0.3)) % 4 === 0 && y > Y - 40);
      return fold ? 0.02 : 0.07 + 0.08 * clamp((x - cx + 18) / 20);
    }, CL);
  for (const [k, l] of [[1, 3], [4, 4], [6, 2], [9, 3]]) { const [hx, hy] = hem[k]; line(hx, hy, hx - 1, hy + l, 0.12, CL); }
  // a melee hit (#97): both daggers. The near hand cocks low and cuts up and forward; a beat later the far hand comes
  // over the top from behind his hood and cuts down and forward, so the two smears cross in an X. Angles of the far
  // cut run past 2 pi so it turns clockwise, over the top.
  const KR = [[cx + 15, Y - 25, Math.atan2(-1, 5)], [cx + 12, Y - 21, 1.25], [cx + 22, Y - 36, -1.35]];
  const KF = [[cx - 6, Y - 26, Math.PI], [cx - 3, Y - 51, 4.3], [cx + 19, Y - 31, 7.15]];
  const swinging = swq != null && swq >= 0 && !carry && !walk, qf = swinging ? clamp((swq - 0.12) / 0.88) : 0;
  const RS = swinging ? swingPose(swq, KR, 4) : null, FS = swinging ? swingPose(qf, KF, 5) : null;
  if (!FS) {
  // far upper arm (left side), behind the body
  limb(FA.s[0], FA.s[1], FA.e[0], FA.e[1], 3.2, 2.8, 0.08, 0.24, LE);
  // far forearm, fist and dagger: hanging at his side behind the hip, the blade pointing straight back
  limb(FA.e[0], FA.e[1], FA.h[0], FA.h[1], 2.8, 2.4, 0.12, 0.34, LE);
  { const bx = Math.round((FA.e[0] + FA.h[0]) / 2), by = Math.round((FA.e[1] + FA.h[1]) / 2); rect(bx - 1, by - 1, 3, 2, 0.36, LE); }   // bracer
  rect(FA.h[0] - 1, FA.h[1] - 1, 3, 3, 0.2, LE); put(FA.h[0] + 1, FA.h[1] - 1, 0.4, LE);   // fist
  backBlade(FA);
  }
  // far leg
  drawLeg(FL, false);
  // near leg, thigh knives
  drawLeg(NL, true);
  { const q = 0.45, x0 = Math.round(NL.h[0] + (NL.k[0] - NL.h[0]) * q) - 1, y0 = Math.round(NL.h[1] + (NL.k[1] - NL.h[1]) * q) - 1;
    line(x0 - 1, y0, x0 + 3, y0 - 1, 0.42, LE); for (let k = 0; k < 3; k++) { put(x0 + k, y0 + 1, 0.9, M_STONE); put(x0 + k, y0 + 2, 0.6, M_STONE); } }
  // torso, chest to the camera: broad shoulders, tapering to the waist, rounded forward; lit on the near side
  // the back bends forward from the waist: the upper back rounds out behind, the shoulders and chest tip toward the
  // enemy, so the head hangs forward in front of them (after Paweł's sketch)
  poly([[cx - 2, Y - 47], [cx + 11, Y - 45], [cx + 12, Y - 41], [cx + 6, Y - 34], [cx - 4, Y - 34], [cx - 6, Y - 39], [cx - 5, Y - 44]],
    (x, y) => {
      const front = y < Y - 41 ? cx + 11 + (y - (Y - 45)) * 0.25 : cx + 12 - (y - (Y - 41)) * 0.86;
      if (x >= front - 1.4) return 0.5;                                                // the near flank, lit
      if (y < Y - 42 && x > cx - 2) return 0.32 - 0.1 * clamp((cx + 4 - x) / 7);       // the hunched shoulders catch the light
      if (x < cx - 3 && y < Y - 39) return 0.2;                                        // the rounded upper back, a rim of light
      return 0.1 + 0.16 * clamp((x - cx + 6) / 18);
    }, LE);
  line(cx - 1, Y - 45, cx + 7, Y - 35, 0.48, LE); line(cx + 9, Y - 44, cx - 2, Y - 35, 0.4, LE);   // crossed straps
  put(cx + 3, Y - 40, 0.92, M_STONE); put(cx + 3, Y - 39, 0.6, M_STONE);                   // buckle where they cross
  rect(cx - 4, Y - 35, 10, 2, 0.04, LE); rect(cx, Y - 35, 2, 2, 0.8, M_LOOT);              // belt, gold buckle
  line(cx - 5, Y - 31, cx + 6, Y - 30, 0.32, LE); put(cx - 3, Y - 31, 0.78, M_LOOT); put(cx - 3, Y - 30, 0.5, M_LOOT);   // hip belt, gold ring
  rect(cx + 4, Y - 33, 3, 4, (x) => 0.2 + 0.1 * (x - cx - 4) / 2, LE); line(cx + 4, Y - 33, cx + 6, Y - 33, 0.44, LE); put(cx + 5, Y - 32, 0.86, M_STONE);   // pouch
  { const gx = cx - 4, gy = Y - 27; for (const [dx, dy, v] of [[-1, 0, 0.6], [0, -1, 0.4], [1, 0, 0.4], [0, 1, 0.55], [-1, 1, 0.3]]) put(gx + dx, gy + dy, v, M_STONE); }
  // front tabard between the legs, swaying a little with the stride; gold hem
  { const tw = walk ? Math.round(-sw) : sh;
    poly([[cx - 2, Y - 33], [cx + 3, Y - 33], [cx + 3 + tw, Y - 20], [cx - 2 + tw, Y - 19]], (x) => 0.12 + 0.18 * clamp((x - cx + 2) / 5), LE);
    line(cx - 2 + tw, Y - 20, cx + 3 + tw, Y - 21, 0.55, M_LOOT); }
  // the far dagger's cut (a melee hit): over his torso, under the near arm, the capelet and the hood
  if (FS) {
    const ux = Math.cos(FS[2]), uy = Math.sin(FS[2]), hx = Math.round(FS[0]), hy = Math.round(FS[1]);
    swingSmear(qf, KF, 5, 4, 16);
    armTo(FA.s, [hx, hy], 10.5, -1, 3, 2.6, 0.1, 0.36, LE);
    rect(hx - 1, hy - 1, 3, 3, 0.18, LE); put(hx + 1, hy - 1, 0.4, LE);             // fist
    line(hx + ux * 2 - uy * 2, hy + uy * 2 + ux * 2, hx + ux * 2 + uy * 2, hy + uy * 2 - ux * 2, 0.6, M_STONE);   // guard
    blade(hx + ux * 3, hy + uy * 3, hx + ux * 10, hy + uy * 10, 0.6);
  }
  // near arm (right side): hanging long from the forward shoulder, a slight bend, the fist low and a little forward
  if (!RS) {
    limb(NA.s[0], NA.s[1], NA.e[0], NA.e[1], 3.4, 3, 0.16, 0.56, LE);
    limb(NA.e[0], NA.e[1], NA.h[0], NA.h[1], 3, 2.6, 0.2, 0.6, LE);
    put(NA.e[0] + 1, NA.e[1], 0.66, LE);                                              // the point of the elbow, lit
    { const bx = Math.round((NA.e[0] + NA.h[0]) / 2), by = Math.round((NA.e[1] + NA.h[1]) / 2) + 1; rect(bx - 1, by - 1, 3, 2, 0.5, LE); put(bx + 1, by - 1, 0.72, LE); }   // bracer
  }
  if (RS) {
    const ux = Math.cos(RS[2]), uy = Math.sin(RS[2]), hx = Math.round(RS[0]), hy = Math.round(RS[1]);
    swingSmear(swq, KR, 4, 4, 17);   // bigger than the dagger: from rank 2 it has to read over the Knight's back
    armTo(NA.s, [hx, hy], 10.5, 1, 3.2, 2.8, 0.18, 0.6, LE);
    rect(hx - 1, hy - 1, 3, 3, 0.24, LE); put(hx + 1, hy - 1, 0.5, LE);             // fist
    line(hx + ux * 2 - uy * 2, hy + uy * 2 + ux * 2, hx + ux * 2 + uy * 2, hy + uy * 2 - ux * 2, 0.7, M_STONE);   // guard
    blade(hx + ux * 3, hy + uy * 3, hx + ux * 10, hy + uy * 10, 0.7);
  }
  const nh = NA.h;
  if (!RS) { rect(nh[0] - 1, nh[1] - 1, 3, 3, 0.24, LE); put(nh[0] + 1, nh[1] - 1, 0.5, LE); }   // fist
  if (RS) { /* swinging: the arm and dagger are drawn above */ }
  else if (carry) backBlade(NA);
  else {                                                                            // forward grip: guard, blade at the enemy
    put(nh[0] - 2, nh[1], 0.64, LE);
    line(nh[0] + 2, nh[1] - 2, nh[0] + 2, nh[1] + 2, 0.7, M_STONE); put(nh[0] + 2, nh[1] - 2, 0.95, M_STONE);
    blade(nh[0] + 3, nh[1], nh[0] + 8, nh[1] - 1, 0.56);
  }
  // capelet: a short shoulder cape under the hood, close over the shoulders, ragged hem at the chest
  { const jag = [[cx + 13, Y - 41], [cx + 11, Y - 42], [cx + 9, Y - 40], [cx + 6, Y - 41], [cx + 3, Y - 39], [cx, Y - 41], [cx - 4, Y - 40]];
    poly([[cx, Y - 47], [cx + 9, Y - 47], [cx + 13, Y - 44], ...jag, [cx - 6, Y - 42], [cx - 4, Y - 45]],
      (x, y) => (y <= Y - 46 + Math.abs(x - cx - 5) * 0.25 ? 0.3 : 0.1 + 0.14 * clamp((x - cx + 6) / 19)), CL);
    line(cx + 6, Y - 46, cx + 5, Y - 42, 0.04, CL); }                               // a fold
  // head and hood (after the references): a close-fitting hood at normal head size (about the knight's helm), a
  // small peak at the back, the sides falling to the shoulders. The head is bowed and turned toward the enemy; the
  // face opening, small and set to the near side, is in shadow under the hood's lit rim, with only two glowing eyes
  // and a hint of chin. A thin wine scarf at the neck.
  const hx = cx + 7, H0 = Y - 58;                                                   // hood crown row: the head hangs forward and lower
  const HOOD = [
    '...4321......',
    '..44332211...',
    '.5443322111..',
    '554433221114.',
    '5544332vvvv4.',
    '554433vvvvvv3',
    '55443vvvvvvv3',
    '5544vvvvvvv3.',
    '55443vvvvv3..',
    '554433vccv3..',
    '.5544333331..',
    '..55544333...',
  ];
  // digits: hood cloth, 1 = lit (rim, crown) .. 5 = deep shade at the back; v = the shadow inside; c = chin
  const CLV = { 1: 0.46, 2: 0.36, 3: 0.27, 4: 0.18, 5: 0.1 };
  HOOD.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.') return;
    const x = hx - 6 + i, y = H0 + j;
    if (ch === 'v') put(x, y, 0.0, CL);
    else if (ch === 'c') put(x, y, 0.18, LE);
    else put(x, y, CLV[ch], CL);
  }));
  line(hx - 1, H0 + 3, hx + 4, H0 + 3, 0.46, CL); put(hx + 5, H0 + 4, 0.4, CL); put(hx + 6, H0 + 5, 0.32, CL);   // the rim over the face, lit
  line(hx - 5, H0 + 2, hx - 4, H0 + 9, 0.05, CL);                                     // fold down the back of the hood
  poly([[hx - 4, H0 + 12], [hx + 3, H0 + 12], [hx + 4, H0 + 14], [hx - 4, H0 + 14]], (x, y) => (y === H0 + 12 ? 0.4 : 0.26), M_DANGER);   // scarf at the neck
  const blink = (t * 0.6) % 5 < 0.08, ey = H0 + 6;
  if (!blink) { put(hx, ey, 0.42, M_LOOT, 1); put(hx + 1, ey, 0.82, M_LOOT, 1); put(hx + 3, ey, 0.95, M_LOOT, 1); put(hx + 4, ey, 0.46, M_LOOT, 1); }
  FX.eyes = [hx + 2, ey];
}

// censer smoke + holy light motes (drawn after the party, untagged)
function partyFX(F, t) {
  if (FX.censer) {
    const [cx, cy] = FX.censer;
    for (let k = 0; k < 9; k++) {
      const q = ((t * 0.35 + k / 9) % 1), x = cx - q * 12 + Math.sin(q * 6 + k) * 2, y = cy - 2 - q * 30, r = 1 + q * 3.2;
      for (let j = Math.floor(y - r); j <= y + r; j++) for (let i = Math.floor(x - r); i <= x + r; i++) {
        if (i < 0 || j < 0 || i >= W || j >= H) continue;
        const d = Math.hypot(i - x, j - y) / r; if (d >= 1) continue;
        const kk = j * W + i; F.V[kk] = lerp(F.V[kk], 0.74 - q * 0.24, Math.min(1, (1 - d) * (1.1 - q * 0.8))); if (!F.T[kk]) { F.M[kk] = M_STONE; F.E[kk] = 1; }
      }
    }
  }
}
