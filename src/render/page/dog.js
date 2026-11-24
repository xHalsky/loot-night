// ===========================================================================
// The dog: a shiba who jumps up at the desk. Head, chest and front paws rise over the desk's near edge in front of
// the keyboard. Drawn in code (shapes -> hard pixel edges -> 1 px outline), lit like the UI and the can (key light
// from the upper left), ordered dither, every pixel one of his own palette slots: the can's warm print colours
// (EB_PAL), kept out of the desk's dither like Garrote's ember. Cute first: a big round head with fluffy cheeks,
// big glossy eyes set low and wide, cream urajiro with the two eyebrow dots, a small black nose, an omega mouth.
// ===========================================================================
// his palette (EB_PAL indices)
const DOGP = {
  ink: 0x39, void: 0x00,
  fur: [0x39, 0x37, 0x36, 0x2e, 0x21, 0x2d],          // plum-black, plum-brown, brown, deep red, shiba orange, pale gold
  cream: [0x2f, 0x38, 0x35, 0x1d, 0x19],              // tan shadow to moon white (urajiro)
  pink: [0x2b, 0x2c, 0x12],                           // tongue shadow, tongue and beans, blush and inner ear
  eye: 0x39, eye2: 0x37, shine: 0x19, shine2: 0x1d, nose: 0x39, noseHi: 0x05,
  heart: [0x2e, 0x21, 0x2d],
};
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
function rampAt(ramp, v, x, y, k = 2.4) { const p = Math.max(0, Math.min(0.999, v)) * (ramp.length - 1), i = Math.floor(p), f = Math.max(0, Math.min(1, (p - i - 0.5) * k + 0.5)); return ramp[Math.min(ramp.length - 1, i + (f > bay(x, y) ? 1 : 0))]; }
const DLX = -0.42, DLY = -0.62, DLZ = 0.66;                 // key light from the upper left, toward you
function shadeE(dx, dy) { const d2 = dx * dx + dy * dy, nz = Math.sqrt(Math.max(0, 1 - d2)); return Math.max(0, dx * DLX + dy * DLY + nz * DLZ); }
// a triangle's signed distance (iq), for the ears with rounded tips
function sdTri(px, py, a, b, c) {
  const e0 = [b[0] - a[0], b[1] - a[1]], e1 = [c[0] - b[0], c[1] - b[1]], e2 = [a[0] - c[0], a[1] - c[1]];
  const v0 = [px - a[0], py - a[1]], v1 = [px - b[0], py - b[1]], v2 = [px - c[0], py - c[1]];
  const pq = (v, e) => { const h = Math.max(0, Math.min(1, (v[0] * e[0] + v[1] * e[1]) / (e[0] * e[0] + e[1] * e[1]))); return [v[0] - e[0] * h, v[1] - e[1] * h]; };
  const q0 = pq(v0, e0), q1 = pq(v1, e1), q2 = pq(v2, e2), s = Math.sign(e0[0] * e2[1] - e0[1] * e2[0]);
  const d0 = [q0[0] * q0[0] + q0[1] * q0[1], s * (v0[0] * e0[1] - v0[1] * e0[0])], d1 = [q1[0] * q1[0] + q1[1] * q1[1], s * (v1[0] * e1[1] - v1[1] * e1[0])], d2 = [q2[0] * q2[0] + q2[1] * q2[1], s * (v2[0] * e2[1] - v2[1] * e2[0])];
  const d = [Math.min(d0[0], d1[0], d2[0]), Math.min(d0[1], d1[1], d2[1])];
  return -Math.sqrt(d[0]) * Math.sign(d[1]);
}
const tri = (u) => 1 - Math.abs(2 * (u - Math.floor(u)) - 1);   // 0..1..0, for fur tufts

// p: { tilt (rad, + leans his head to your right), ear (0 up .. 1 flat back), eyes ('open'|'puppy'|'happy'|'bliss'|
// 'squeeze'|'side'|'wide'), mouth ('w'|'blep'|'smile'|'bark'|'pout'|'lick'|'sock'), blush 0..1, paw (0..1 his right
// paw lifted, beans showing), tail (rad), tailAmp, squash (1 = rest), look (-1..1 where the eyes point), duck (px) }
// Returns an index sprite { w, h, ox, oy, a } with 255 = empty; (ox, oy) is his head's centre at rest.
const DOG_SW = 150, DOG_SH = 156, DOG_OX = 75, DOG_OY = 62;
function renderDog(p) {
  const W = DOG_SW, H = DOG_SH, OX = DOG_OX, OY = DOG_OY, A = new Uint8Array(W * H).fill(255), Z = new Int8Array(W * H).fill(-1);
  const put = (x, y, c, z) => { x = Math.round(x); y = Math.round(y); const X = x + OX, Y = y + OY; if (X < 0 || Y < 0 || X >= W || Y >= H) return; const i = Y * W + X; if (z < Z[i]) return; A[i] = c; Z[i] = z; };
  const th = p.tilt || 0, ct = Math.cos(th), st = Math.sin(th), PV = [0, 24 + (p.duck || 0)], sq = p.squash || 1, dk = p.duck || 0;
  // head space -> screen: rotate round the neck pivot; screen -> head space for the fills
  const toS = (hx, hy) => [PV[0] + (hx - 0) * ct - (hy - 24) * st, PV[1] + (hx - 0) * st + (hy - 24) * ct];
  const toH = (x, y) => { const dx = x - PV[0], dy = y - PV[1]; return [dx * ct + dy * st, -dx * st + dy * ct + 24]; };
  const fillBox = (x0, y0, x1, y1, fn) => { for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) fn(x, y); };
  // ---- the tail: a thick fluffy curl over his right hip (a spiral stroke, orange outside, cream inside), wagging
  // from its root
  {
    const ta = p.tail || 0, root = [26, 52 - 4 * (1 - sq)], ca = Math.cos(ta), sa = Math.sin(ta), pts = [];
    for (let k = 0; k <= 48; k++) {
      const u = k / 48, R = 10.5 * (1 - 0.62 * u), a = Math.PI * 0.95 - u * Math.PI * 1.75;   // up from the root, over and round
      const lx = 10 + Math.cos(a) * R, ly = -10 - Math.sin(a) * R + (1 - u) * 0;
      pts.push([root[0] + lx * ca - ly * sa, root[1] + lx * sa + ly * ca, 6.6 * (1 - 0.55 * u) + 0.6 * tri(u * 5 + (p.tailAmp || 0) * 0.3), u]);
    }
    const ccx = root[0] + 10 * ca + 10 * sa, ccy = root[1] + 10 * sa - 10 * ca;
    fillBox(root[0] - 4, root[1] - 30, root[0] + 32, root[1] + 8, (x, y) => {
      let best = 1e9, bu = 0, bw = 0;
      for (const q of pts) { const d = Math.hypot(x + 0.5 - q[0], y + 0.5 - q[1]) - q[2]; if (d < best) { best = d; bu = q[3]; bw = q[2]; } }
      if (best > 0) return;
      const rc = Math.hypot(x + 0.5 - ccx, y + 0.5 - ccy), rq = 10.5 * (1 - 0.62 * bu), inner = rc < rq - bw * 0.15;
      const dx = (x + 0.5 - ccx) / 13, dy = (y + 0.5 - ccy) / 13;
      put(x, y, inner ? rampAt(DOGP.cream, 0.55 + 0.35 * shadeE(dx, dy), x, y) : rampAt(DOGP.fur, 0.26 + 0.58 * shadeE(dx, dy), x, y), 0);
    });
  }
  // ---- the body: orange shoulders, the cream bib with a fluffy edge, the throat ruff
  const bodyCY = 60 + dk * 0.5, bodyRY = 32 * sq;
  fillBox(-42, bodyCY - bodyRY - 2, 42, bodyCY + bodyRY, (x, y) => {
    const dx = (x + 0.5) / 34, dy = (y + 0.5 - bodyCY) / bodyRY; if (dx * dx + dy * dy > 1) return;
    put(x, y, rampAt(DOGP.fur, 0.22 + 0.62 * shadeE(dx, dy * 0.8), x, y), 1);
  });
  fillBox(-27, 26, 27, 95, (x, y) => {
    const dx = (x + 0.5) / 20, dy = (y + 0.5 - (57 + dk * 0.5)) / (33 * sq), a = Math.atan2(dy, dx), R = 1 + 0.1 * tri(a * 9 / Math.PI);
    if (dx * dx + dy * dy > R * R) return;
    put(x, y, rampAt(DOGP.cream, 0.45 + 0.5 * shadeE(dx * 0.8, dy * 0.7), x, y), 2);
  });
  // the head casts a soft shadow on his chest
  const chin = toS(0, 26);
  fillBox(chin[0] - 30, chin[1] - 4, chin[0] + 30, chin[1] + 9, (x, y) => {
    const X = x + OX, Y = y + OY; if (X < 0 || Y < 0 || X >= W || Y >= H) return; const i = Y * W + X; if (Z[i] < 1 || Z[i] > 2) return;
    const dx = (x + 0.5 - chin[0]) / 30, dy = (y + 0.5 - chin[1] - 1) / 8; if (dx * dx + dy * dy > 1) return;
    if (bay(x, y) < 0.32 + 0.3 * (1 - dy * dy)) A[i] = Z[i] === 2 ? DOGP.cream[2] : DOGP.fur[3];
  });
  // ---- front legs and paws on the desk edge (y 66 is the edge)
  for (const sg of [-1, 1]) {
    const lift = sg > 0 ? (p.paw || 0) : 0, px = sg * (17 + lift * 9), py = 66 - lift * 18;
    if (lift > 0.35) {   // the forearm swings up from the shoulder
      const sx = sg * 17, sy = 50;
      for (let k = 0; k <= 12; k++) { const u = k / 12, cx = sx + (px - sx) * u, cy = sy + (py - sy) * u; fillBox(cx - 7, cy - 7, cx + 7, cy + 7, (x, y) => { const e = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / 6.4; if (e <= 1) put(x, y, rampAt(DOGP.cream, 0.55 + 0.3 * (1 - e), x, y), 3); }); }
    } else fillBox(px - 7, 44, px + 7, py, (x, y) => { const e = Math.abs(x + 0.5 - px) / 6.5; if (e > 1) return; put(x, y, rampAt(DOGP.cream, 0.5 + 0.42 * shadeE(e * Math.sign(x + 0.5 - px), -0.2), x, y), 3); });
    if (lift > 0.35) {
      // the paw turned up to you: pink beans
      fillBox(px - 11, py - 9, px + 11, py + 8, (x, y) => { const dx = (x + 0.5 - px) / 9.6, dy = (y + 0.5 - py) / 8.1; if (dx * dx + dy * dy <= 1) put(x, y, DOGP.cream[0], 4); });
      fillBox(px - 9, py - 8, px + 9, py + 6, (x, y) => { const dx = (x + 0.5 - px) / 8.5, dy = (y + 0.5 - py) / 7; if (dx * dx + dy * dy <= 1) put(x, y, rampAt(DOGP.cream, 0.62 + 0.3 * shadeE(dx, dy), x, y), 4); });
      fillBox(px - 4, py - 1, px + 4, py + 4, (x, y) => { const dx = (x + 0.5 - px) / 3.6, dy = (y + 0.5 - py - 1.8) / 2.6; if (dx * dx + dy * dy <= 1) put(x, y, dy < -0.3 && dx < 0 ? DOGP.pink[2] : DOGP.pink[1], 5); });
      for (const bxx of [-4.5, 0, 4.5]) { const by = py - 4 - (bxx === 0 ? 1 : 0); put(px + bxx - 0.5, by, DOGP.pink[1], 5); put(px + bxx + 0.5, by, DOGP.pink[1], 5); put(px + bxx - 0.5, by + 1, DOGP.pink[1], 5); put(px + bxx + 0.5, by + 1, DOGP.pink[0], 5); }
    } else {
      fillBox(px - 11, py - 7, px + 11, py + 5, (x, y) => { const dx = (x + 0.5 - px) / 10, dy = (y + 0.5 - py) / 6.2; if (dx * dx + dy * dy > 1 || y > py + 3) return; put(x, y, rampAt(DOGP.cream, 0.55 + 0.42 * shadeE(dx, dy), x, y), 4); });
      for (const tx of [-3, 3]) for (let k = 0; k < 3; k++) put(px + tx, py + 1 + k, DOGP.cream[0], 5);
    }
  }
  // ---- the head: ears, skull, fluffy cheeks
  const earUp = 1 - (p.ear || 0);
  const ears = [];
  for (const sg of [-1, 1]) {
    const flat = p.ear || 0, ang = sg * flat * 0.9;   // flat: the ear turns out and back round its base
    const base = [sg * 20, -18], rot = (q) => { const dx = q[0] - base[0], dy = q[1] - base[1]; return [base[0] + dx * Math.cos(ang) - dy * Math.sin(ang), base[1] + dx * Math.sin(ang) + dy * Math.cos(ang) + flat * 4]; };
    const A0 = rot([sg * 34, -9]), B0 = rot([sg * 8, -22]), T0 = rot([sg * 27, -45 + (1 - earUp) * 6]);
    ears.push({ sg, A0, B0, T0 });
  }
  const headTest = (hx, hy) => {
    const s = (hx / 33) ** 2 + ((hy + 1) / 25) ** 2;
    if (s <= 1) return { k: 'skull', dx: hx / 33, dy: (hy + 1) / 25 };
    for (const sg of [-1, 1]) {
      const cx = sg * 20, cy = 11, dx = (hx - cx) / 15, dy = (hy - cy) / 12, a = Math.atan2(dy, dx * sg), R = 1 + (a > -0.4 && a < 1.3 ? 0.1 * tri(a * 7 / Math.PI + 0.3) : 0);
      if (dx * dx + dy * dy <= R * R) return { k: 'cheek', dx: hx / 34, dy: (hy + 2) / 27 };
    }
    if ((hx / 16) ** 2 + ((hy - 15) / 10.5) ** 2 <= 1) return { k: 'jaw', dx: hx / 34, dy: (hy + 2) / 27 };
    return null;
  };
  fillBox(-60, -60, 60, 50, (x, y) => {
    const [hx, hy] = toH(x + 0.5, y + 0.5);
    // ears first (behind the skull's edge)
    for (const e of ears) {
      const d = sdTri(hx, hy, e.A0, e.B0, e.T0);
      if (d < -1.6 && !headTest(hx, hy)) {
        // inner ear: a smaller triangle toward the face, cream fluff round pink
        const c = [(e.A0[0] + e.B0[0] + e.T0[0]) / 3, (e.A0[1] + e.B0[1] + e.T0[1]) / 3], sh = (q) => [c[0] + (q[0] - c[0]) * 0.58 - e.sg * 1.2, c[1] + (q[1] - c[1]) * 0.58 + 2.5];
        const di = sdTri(hx, hy, sh(e.A0), sh(e.B0), sh(e.T0));
        let col;
        if (di < -1.6) col = hy > c[1] + 1 ? DOGP.pink[1] : rampAt(DOGP.pink, 0.6 + (e.sg < 0 ? 0.25 : 0), x, y);
        else if (di < 0.6) col = rampAt(DOGP.cream, e.sg < 0 ? 0.85 : 0.62, x, y);
        else col = rampAt(DOGP.fur, 0.5 + (e.sg < 0 ? 0.3 : 0.05) - (hy - e.T0[1]) * 0.004, x, y);
        put(x, y, col, 6); return;
      }
    }
    const h = headTest(hx, hy); if (!h) return;
    let v = 0.3 + 0.62 * shadeE(h.dx, h.dy);
    // the urajiro: muzzle, cheeks, chin, the two eyebrow dots
    const mz = (hx / 14) ** 2 + ((hy - 9) / 10.5) ** 2, ck = Math.min(((hx - 16) / 12.5) ** 2 + ((hy - 13) / 9) ** 2, ((hx + 16) / 12.5) ** 2 + ((hy - 13) / 9) ** 2);
    const brow = Math.min(((hx - 12.5) / 4.2) ** 2 + ((hy + 13) / 2.6) ** 2, ((hx + 12.5) / 4.2) ** 2 + ((hy + 13) / 2.6) ** 2);
    const bnd = 2.2 + 4.6 * Math.exp(-((hx / 6.5) ** 2)) - Math.max(0, Math.abs(hx) - 22) * 0.35, cream = hy > bnd || brow <= 1;
    if (cream) put(x, y, rampAt(DOGP.cream, v * 0.55 + 0.45, x, y), 7);
    else put(x, y, rampAt(DOGP.fur, Math.min(0.83, v), x, y), 7);
  });
  // ---- outline: every empty pixel touching him, in ink
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (A[i] !== 255) continue;
    if ((x > 0 && A[i - 1] !== 255) || (x < W - 1 && A[i + 1] !== 255) || (y > 0 && A[i - W] !== 255) || (y < H - 1 && A[i + W] !== 255)) out[i] = 1;
  }
  for (let i = 0; i < W * H; i++) if (out[i]) { A[i] = DOGP.ink; Z[i] = 9; }
  // inner lines: where the head meets the chest, and the ears' fronts against the skull
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (Z[i] !== 2 && Z[i] !== 1 && Z[i] !== 3) continue;
    if (Z[i - W] === 7) A[i] = Z[i] === 2 ? DOGP.cream[1] : DOGP.fur[2];
  }
  // ---- the face, pixel by pixel in head space
  const P = (hx, hy, c) => { const s = toS(hx, hy); put(s[0], s[1], c, 10); };
  const look = Math.round((p.look || 0) * 1.6), ey = -2;
  for (const sg of [-1, 1]) {
    const ex = sg * 14 + look, kind = p.eyes || 'open';
    if (kind === 'open' || kind === 'puppy' || kind === 'wide' || kind === 'side') {
      const r = kind === 'puppy' ? 6.4 : kind === 'wide' ? 6 : 5.8;
      for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) {
        const d = Math.hypot(x, (y + 0.3) * 1.04); if (d > r) continue;
        const lower = y > 1.2 && Math.hypot(x - 0.6, y - 2.6) < r - 1.6;
        P(ex + x, ey + y, lower ? DOGP.eye2 : DOGP.eye);
      }
      // the shine: a big soft spot up left, a small one low right; puppy eyes get a third
      const sh = kind === 'wide' ? [[-2, -2], [-1, -2], [-2, -1]] : [[-3, -3], [-2, -3], [-3, -2], [-2, -2], [-1, -3], [-3, -1]];
      for (const [a, b] of sh) P(ex + a, ey + b, DOGP.shine);
      P(ex + 2, ey + 2, DOGP.shine2); if (kind === 'puppy') { P(ex + 3, ey + 1, DOGP.shine2); P(ex - 1, ey + 3, DOGP.shine2); }
      if (kind === 'side') for (let x = -6; x <= 6; x++) for (let y = -7; y <= -2; y++) if (Math.hypot(x, y) <= 5.4) P(ex + x, ey + y, rampAt(DOGP.fur, 0.62, ex + x, y));   // half-lidded, offended
    } else if (kind === 'happy' || kind === 'bliss') {
      // closed and smiling: arcs bowed up
      for (let x = -5; x <= 5; x++) { const yy = Math.round((x * x) / (kind === 'bliss' ? 7 : 9)) - 1; P(ex + x, ey + yy, DOGP.eye); if (Math.abs(x) < 5) P(ex + x, ey + yy + 1, DOGP.eye); }
    } else if (kind === 'squeeze') {
      for (let k = 0; k <= 4; k++) { P(ex + sg * (4 - k), ey - 2 + k * 0.5, DOGP.eye); P(ex + sg * (4 - k), ey + 2 - k * 0.5, DOGP.eye); P(ex + sg * (4 - k) - sg, ey - 2 + k * 0.5, DOGP.eye); }
    }
  }
  // eyebrow dots lift when he begs (worried, inner ends up)
  if (p.eyes === 'puppy') for (const sg of [-1, 1]) { P(sg * 9, -15, DOGP.cream[4]); P(sg * 10, -15, DOGP.cream[4]); }
  // blush
  if (p.blush) for (const sg of [-1, 1]) for (let y = -2; y <= 2; y++) for (let x = -5; x <= 5; x++) if ((x / 5.5) ** 2 + (y / 2.6) ** 2 <= 1 && ((x + y) & 1) === 0 && (p.blush > 0.6 || (x & 1) === 0)) P(sg * 21 + x, 6 + y, DOGP.pink[2]);
  // nose: a small rounded triangle with a shine
  const NOSE = ['.xxxxxx.', 'xhxxxxxx', 'xxxxxxxx', '.xxxxxx.', '..xxxx..', '...xx...'];
  NOSE.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') P(i - 4, 3 + j, ch === 'h' ? DOGP.noseHi : DOGP.nose); }));
  // mouth
  const m = p.mouth || 'w';
  const omega = () => { P(-1, 9, DOGP.ink); P(0, 9, DOGP.ink); P(0, 10, DOGP.ink); P(-1, 10, DOGP.ink); for (const [a, b] of [[-2, 11], [-3, 11], [-4, 10], [1, 11], [2, 11], [3, 10]]) P(a, b, DOGP.ink); };
  if (m === 'w' || m === 'blep' || m === 'pout') {
    if (m === 'pout') { P(-1, 9, DOGP.ink); P(0, 9, DOGP.ink); for (let x = -3; x <= 2; x++) P(x, 12, DOGP.ink); }
    else omega();
    if (m === 'blep') for (const [a, b, c] of [[-1, 12, 1], [0, 12, 1], [-1, 13, 1], [0, 13, 2], [-2, 12, 0], [1, 12, 0], [-1, 14, 0], [0, 14, 0]]) P(a, b, DOGP.pink[c]);
  } else if (m === 'smile' || m === 'lick' || m === 'bark' || m === 'sock') {
    // open: a dark mouth under the nose, the tongue in it (out for a lick)
    P(-1, 9, DOGP.ink); P(0, 9, DOGP.ink);
    const wM = m === 'bark' ? 4 : 6, hM = m === 'bark' ? 7 : 5;
    for (let y = 0; y <= hM; y++) for (let x = -wM; x < wM; x++) { const e = ((x + 0.5) / wM) ** 2 + ((y - (m === 'bark' ? 3 : 0)) / hM) ** 2; if (m === 'bark' ? e <= 1 : (y <= 0 ? Math.abs(x + 0.5) <= wM : e <= 1)) P(x, 10 + y, DOGP.ink); }
    if (m !== 'sock') {
      const tl = m === 'lick' ? 10 : m === 'bark' ? 3 : 5, tx = m === 'lick' ? 2 : 0;
      for (let y = 0; y < tl; y++) for (let x = -3; x <= 2; x++) {
        const yy = (m === 'bark' ? 14 : 12) + y, xx = x + Math.round(tx * y / tl);
        if (y === tl - 1 && (x === -3 || x === 2)) continue;
        P(xx, yy, x === -3 || x === 2 ? DOGP.pink[0] : x === -1 && y > 0 && y < tl - 2 ? DOGP.pink[0] : y < 2 && x > 0 ? DOGP.pink[2] : DOGP.pink[1]);
      }
    }
  }
  return { w: W, h: H, ox: OX, oy: OY, a: A };
}


// ===========================================================================
// On the desk. He rises over the near edge (the frame's bottom) in front of the keyboard, his head centre at x 224,
// in front of everything on the desk; the cards sit over him. His slots are appended to the desk's palette set the
// first time he is drawn (index pixels, outside the dither).
// ===========================================================================
const DOG_X = 224, DOG_Y = 288;
function dogSlots(set) {
  if (set.dogMap) return set.dogMap;
  const m = new Int16Array(256).fill(-1), used = new Set([DOGP.ink, DOGP.void, ...DOGP.fur, ...DOGP.cream, ...DOGP.pink, DOGP.eye, DOGP.eye2, DOGP.shine, DOGP.shine2, DOGP.nose, DOGP.noseHi, ...DOGP.heart, ...SOCK_COL]);
  for (const k of used) {
    const hex = EB_PAL[k].toLowerCase(); let j = set.PAL.findIndex((h) => h.toLowerCase() === hex);
    if (j < 0) { j = set.PAL.length; set.PAL.push(EB_PAL[k]); set.PAL_RGB.push(EB_RGB[k]); }
    m[k] = j;
  }
  return (set.dogMap = m);
}
const SOCK_COL = [0x39, 0x19, 0x1d, 0x35, 0x2e, 0x21];
// the lucky sock: white, two red stripes, a worn heel
const SOCK = ['.oooooooo.....', 'oWWWWWWWSo....', 'oRRRRRRRRo....', 'oWWWWWWWSo....', 'oRRRRRRRRo....', 'oWWWWWWWSo....', 'oWWWWWWWSo....', 'oWWWWWWWSo....',
  'oWWWWWWWSo....', 'oWWWWWWWSo....', 'oWWWWWWWSo....', 'oWWWWWWWSo....', 'oWWWWWWWWSo...', 'oWWWWWWWWWSoo.', 'oWWWWWWWWWWWSo', 'oWWWWWWWWWWWSo', 'oHHWWWWWWWWWSo', 'oHHHWWWWWWWTTo', '.oHHWWWWWWTTTo', '..ooooooooooo.'];
const HEART = ['.ooo.ooo.', 'ohhho###o', 'oh######o', 'o#######o', '.o#####o.', '..o###o..', '...o#o...', '....o....'];
const HEART_S = ['.oo.oo.', 'oh#o##o', 'o#####o', '.o###o.', '..o#o..', '...o...'];

// what he is doing at time T (s) of a state; the page picks a state (the Dog row) or runs the loop (Dog moment)
const DOG_IN = { pet: 0, sweetPet: 0, last: -99, hx2: 0, fast: 0, flinch: -99, done: null, good: false, sweet: 2, vis: false, hx: DOG_X, hy: DOG_Y, t0: null, onSweet: false };
const DOG_STATES = { jump: 2.6, wait: 6, pet: 5, sweet: 4.5, fast: 3, done: 3.4, goodboy: 6.4, offended: 4, slam: 3.2, cables: 999 };
const dEase = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function dogView(st, t, o = {}) {
  const kind = o.dog || 'loop';
  let T = o.dogT ?? t;
  const V = { kind, impact: null, rise: 1, p: { eyes: 'puppy', mouth: 'blep', ear: 0, tilt: 0, blush: 0.3, paw: 0, look: 0, duck: 0, squash: 1 }, h: 0.1, hand: null, hearts: 0, label: null, card: null, shake: 0, noSignal: 0, sock: null, sparkle: null, mark: null };
  const p = V.p;
  const waitPose = (T) => {   // whining, head tilts, a paw taps the desk
    const tl = T % 6; p.eyes = 'puppy'; p.mouth = tl % 3 < 1.6 ? 'blep' : 'w';
    p.tilt = tl < 1.6 ? 0.16 * dEase(tl / 0.4) : tl < 3 ? 0.16 * (1 - dEase((tl - 1.6) / 0.4)) : tl < 4.6 ? -0.14 * dEase((tl - 3) / 0.4) : -0.14 * (1 - dEase((tl - 4.6) / 0.4));
    if (tl > 1.7 && tl < 2.9) p.paw = Math.max(0, Math.sin((tl - 1.7) * Math.PI * 2.5));
    if (tl % 3 > 0.3 && tl % 3 < 1.3) V.label = { s: 'whine', at: 'mouth' };
    V.rise = 1 + Math.sin(t * 3) * 0.004;
  };
  if (kind === 'live') {
    // the Dog row's Waits: he jumps up and waits for you as long as it takes; stroke him with the mouse
    if (DOG_IN.t0 == null || t < DOG_IN.t0) DOG_IN.t0 = t;
    if (DOG_IN.done != null) {
      const k = t - DOG_IN.done; if (k > (DOG_IN.good ? 6.4 : 3.4) + 0.8 || k < 0) { DOG_IN.done = null; DOG_IN.pet = 0; DOG_IN.sweetPet = 0; DOG_IN.last = -99; DOG_IN.sweet = (DOG_IN.sweet + 1) % 3; DOG_IN.t0 = t; }
      else return dogView(st, t, { dog: DOG_IN.good ? 'goodboy' : 'done', dogT: k });
    }
    const T0 = t - DOG_IN.t0;
    if (T0 < 0.7) return dogView(st, t, { dog: 'jump', dogT: T0 });
    DOG_IN.vis = true; const h = DOG_IN.pet; V.h = Math.max(0.1, h);
    if (t - DOG_IN.flinch < 0.6) { p.eyes = 'squeeze'; p.ear = 1; p.duck = 4; p.mouth = 'pout'; p.tilt = -0.08; V.mark = '!'; V.card = 'gently!'; }
    else if (t - DOG_IN.last < 0.4) {
      const onSweet = DOG_IN.onSweet; p.eyes = onSweet ? 'bliss' : 'happy'; p.mouth = onSweet ? 'blep' : 'smile'; p.ear = 0.35 + 0.6 * h; p.blush = 0.5 + 0.5 * h;
      p.tilt = onSweet ? 0.2 : Math.max(-0.08, Math.min(0.08, (DOG_IN.hx2 - DOG_X) * 0.004)); V.hearts = onSweet ? 2 : 1;
    } else { waitPose(T0 - 0.7); p.ear = 0.2 * h; p.blush = 0.3 + 0.4 * h; if (h === 0) V.card = 'stroke his head, gently'; }
    return finishView(V, t);
  }
  if (kind === 'loop') {
    // the Dog moment: up he jumps, whines, and waits for you; stroke his head with the mouse (or he gets a demo pat)
    const c = t % 13, man = t - DOG_IN.last < 6 || DOG_IN.done != null;
    if (DOG_IN.done != null) {
      const k = t - DOG_IN.done; if (k > (DOG_IN.good ? 6.4 : 3.4) || k < 0) { DOG_IN.done = null; DOG_IN.pet = 0; DOG_IN.sweetPet = 0; DOG_IN.last = -99; DOG_IN.sweet = (DOG_IN.sweet + 1) % 3; }
      else return dogView(st, t, { dog: DOG_IN.good ? 'goodboy' : 'done', dogT: k });
    }
    if (man) {
      const h = DOG_IN.pet; V.h = h; DOG_IN.vis = true;
      if (t - DOG_IN.flinch < 0.6) { p.eyes = 'squeeze'; p.ear = 1; p.duck = 4; p.mouth = 'pout'; p.tilt = -0.08; V.mark = '!'; V.card = 'gently!'; }
      else if (t - DOG_IN.last < 0.4) {
        const onSweet = DOG_IN.onSweet; p.eyes = onSweet ? 'bliss' : 'happy'; p.mouth = onSweet ? 'blep' : 'smile'; p.ear = 0.35 + 0.6 * h; p.blush = 0.5 + 0.5 * h;
        p.tilt = onSweet ? 0.2 : Math.max(-0.08, Math.min(0.08, (DOG_IN.hx2 - DOG_X) * 0.004)); V.hearts = onSweet ? 2 : 1;
      } else { waitPose(t); p.ear = 0.2 * h; p.blush = 0.3 + 0.4 * h; }
      return finishView(V, t);
    }
    if (c < 0.7) return dogView(st, t, { dog: 'jump', dogT: c });
    if (c < 6.7) { waitPose(c - 0.7); V.card = 'stroke his head, gently'; DOG_IN.vis = true; return finishView(V, t); }
    if (c < 10.4) return dogView(st, t, { dog: 'pet', dogT: (c - 6.7) * 1.35 });
    if (c < 13) return dogView(st, t, { dog: 'done', dogT: c - 10.4 });
  }
  T = T % (DOG_STATES[kind] || 6);
  DOG_IN.vis = kind === 'wait';
  if (kind === 'jump') {
    if (T < 0.42) { V.rise = 1.1 * Math.sin((T / 0.42) * Math.PI * 0.5); p.eyes = 'wide'; p.mouth = 'smile'; p.squash = 1.04; p.ear = 0.3; }
    else if (T < 0.7) { const k = (T - 0.42) / 0.28; V.rise = 1.1 - 0.1 * dEase(k); p.squash = 1 - 0.06 * Math.sin(k * Math.PI); p.eyes = 'open'; p.mouth = 'w'; p.ear = 0.3 * (1 - k); }
    else if (T < 2.2) waitPose(T - 0.7);
    else V.rise = 1 - dEase((T - 2.2) / 0.3);
  } else if (kind === 'wait') { waitPose(T); V.card = 'stroke his head, gently'; V.h = 0.1; }
  else if (kind === 'pet') {
    const h = Math.min(1, T / 4.6); V.h = h; p.eyes = 'happy'; p.mouth = 'smile'; p.ear = 0.35 + 0.6 * h; p.blush = 0.5 + 0.5 * h;
    const sw = Math.sin(t * 3.4); p.tilt = sw * 0.05; V.hand = { x: DOG_X - 2 + sw * 15, y: DOG_Y - 30 + Math.abs(Math.cos(t * 3.4)) * 2, k: 'hand' }; V.hearts = 1;
  } else if (kind === 'sweet') {
    V.h = 1; p.eyes = 'bliss'; p.mouth = 'blep'; p.ear = 0.85; p.blush = 1; p.tilt = 0.22;
    const sc = Math.sin(t * 15) * 2.5; V.hand = { x: DOG_X + 3 + sc, y: DOG_Y + 22, k: 'hand' }; V.hearts = 2; V.sparkle = [DOG_X + 6, DOG_Y + 20];
  } else if (kind === 'fast') {
    if (T < 1.3) { const u = (T * 2.6) % 1; V.hand = { x: DOG_X - 46 + u * 92, y: DOG_Y - 28, k: 'hand', blur: true }; p.eyes = 'squeeze'; p.ear = 1; p.duck = 4; p.mouth = 'pout'; p.tilt = -0.08; V.mark = '!'; V.card = 'gently!'; }
    else { waitPose(T); p.eyes = 'puppy'; p.ear = 0.5 * (1 - dEase((T - 1.3) / 1.2)); p.look = -0.6; }
  } else if (kind === 'done' || kind === 'goodboy') {
    V.h = 1; p.eyes = 'happy'; p.ear = 0.6; p.blush = 1;
    if (T < 1.3) { const lk = Math.sin(T * 9) > 0; p.mouth = lk ? 'lick' : 'smile'; V.hand = { x: DOG_X + 22, y: DOG_Y + 14, k: 'hand' }; if (lk && T > 0.2) V.label = { s: 'lick', at: 'hand' }; V.hearts = 1; }
    else if (T < 1.75) { const k = (T - 1.3) / 0.45; V.rise = 1 + 0.06 * Math.sin(k * Math.PI); p.mouth = 'smile'; }
    else if (T < 2.25) { V.rise = 1 - dEase((T - 1.75) / 0.5); p.mouth = 'smile'; }
    else V.rise = 0;
    if (kind === 'goodboy') {
      const SX = DOG_X - 4;
      if (T >= 2.6 && T < 3.1) { V.rise = dEase((T - 2.6) / 0.5); p.mouth = 'sock'; p.eyes = 'open'; p.ear = 0.1; V.sock = { on: 'mouth' }; }
      else if (T >= 3.1 && T < 3.9) { V.rise = 1; p.mouth = T < 3.4 ? 'sock' : 'smile'; p.eyes = T < 3.4 ? 'open' : 'happy'; p.tilt = 0.1; V.sock = T < 3.4 ? { on: 'mouth' } : { on: 'desk', k: Math.min(1, (T - 3.4) / 0.25) }; if (T > 3.4) V.label = { s: 'GOOD BOY!', at: 'top' }; }
      else if (T >= 3.9 && T < 4.4) { V.rise = 1 - dEase((T - 3.9) / 0.5); V.sock = { on: 'desk', k: 1 }; p.mouth = 'smile'; }
      else if (T >= 4.4) { V.rise = 0; V.sock = { on: 'desk', k: 1 }; }
    }
  } else if (kind === 'offended') {
    if (T < 1.6) { const k = dEase(T / 0.6); p.eyes = T < 0.3 ? 'puppy' : 'side'; p.look = k; p.tilt = -0.16 * k; p.mouth = 'pout'; p.ear = 0.45 * k; p.blush = 0; if (T > 0.5) V.label = { s: 'hmph', at: 'top' }; }
    else if (T < 2.8) { V.rise = 1 - dEase((T - 1.6) / 1.2); p.eyes = 'side'; p.look = 1; p.tilt = -0.16; p.mouth = 'pout'; p.ear = 0.45; p.blush = 0; }
    else V.rise = 0;
  } else if (kind === 'slam') {
    if (T < 0.32) { V.rise = 1.16 * Math.sin((T / 0.32) * Math.PI * 0.5); p.eyes = 'wide'; p.mouth = 'bark'; p.ear = 0; p.squash = 1.05; }
    else if (T < 0.6) { const k = (T - 0.32) / 0.28; V.rise = 1.16 - 0.2 * dEase(k * 1.6); p.squash = 1 - 0.1 * Math.sin(Math.min(1, k * 1.6) * Math.PI); p.eyes = 'squeeze'; p.mouth = 'bark'; p.ear = 0.9; V.impact = k; }
    else if (T < 1.3) { V.rise = 0.96; p.eyes = 'wide'; p.mouth = 'w'; p.ear = 0.6; p.look = -0.3; p.tilt = 0.08; V.mark = '?'; }
    else if (T < 1.7) V.rise = 0.96 * (1 - dEase((T - 1.3) / 0.4));
    else V.rise = 0;
    if (T > 0.44) { V.shake = Math.max(0, 1 - (T - 0.44) / 0.6); V.noSignal = T < 0.62 ? (Math.floor(T * 40) % 2 ? 1 : 0.5) : 1; }
    if (T > 0.44 && T < 1.1) V.label = { s: 'BONK', at: 'paws' };
  } else if (kind === 'cables') { V.rise = 0; V.noSignal = 1; }
  return finishView(V, t);
}
function finishView(V, t) {
  const h = V.h, p = V.p;
  p.tail = Math.sin(t * (4 + 14 * h)) * (0.14 + 0.5 * h); p.tailAmp = t * (4 + 14 * h);
  V.hx = DOG_X; V.hy = Math.round(DOG_Y + (1 - V.rise) * 132 + (V.rise > 0.99 && V.rise < 1.01 ? Math.round(Math.sin(t * 3)) * 0.5 : 0));
  DOG_IN.hx = V.hx; DOG_IN.hy = V.hy;
  return V;
}

// the page reports mouse moves in right-screen coords: strokes over his head fill him up; too fast makes him flinch;
// his favourite spot (left ear, right ear or chin, a new one each time) counts three times
const DOG_SPOTS = [[-22, -24], [22, -24], [0, 22]];
function dogStroke(x, y, dx, dt, t) {
  if (DOG_IN.done != null || !DOG_IN.vis) return false;
  const hx = DOG_IN.hx, hy = DOG_IN.hy;
  if (Math.abs(x - hx) > 40 || y < hy - 52 || y > hy + 30) return false;
  const v = Math.abs(dx) / Math.max(0.008, dt), sp = DOG_SPOTS[DOG_IN.sweet], onSweet = Math.hypot(x - hx - sp[0], y - hy - sp[1]) < 13;
  DOG_IN.hx2 = x; DOG_IN.onSweet = onSweet;
  if (v > 760) { DOG_IN.flinch = t; DOG_IN.pet = Math.max(0, DOG_IN.pet - 0.04); DOG_IN.last = t; return true; }
  const add = Math.abs(dx) * 0.0032 * (onSweet ? 3 : 1);
  DOG_IN.pet = Math.min(1, DOG_IN.pet + add); if (onSweet) DOG_IN.sweetPet += add;
  DOG_IN.last = t;
  if (DOG_IN.pet >= 1) { DOG_IN.done = t; DOG_IN.good = DOG_IN.sweetPet / DOG_IN.pet >= 0.5; }
  return true;
}

// draw him (and his hearts, sounds, the sock) into the desk buffer; returns the view for the card
function drawDog(st, t, set, o = {}, V = null) {
  V = V || dogView(st, t, o);
  const map = dogSlots(set), S = (k) => map[k];
  const PX = (x, y, k) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= RS_H) return; B.I[y * W + x] = S(k); };
  // the sock on the desk sits behind him
  if (V.sock && V.sock.on === 'desk') { const k = V.sock.k, sx = DOG_X + 58, sy = Math.round(306 + 34 * dEase(k)); drawSock(PX, sx, sy, k < 1 ? 1 : 0); }
  if (V.rise > 0.001) {
    const spr = renderDog(V.p), x0 = V.hx - spr.ox, y0 = V.hy - spr.oy;
    for (let j = 0; j < spr.h; j++) {
      const Y = y0 + j; if (Y < 0 || Y >= RS_H) continue;
      for (let i = 0; i < spr.w; i++) { const k = spr.a[j * spr.w + i]; if (k !== 255) PX(x0 + i, Y, k); }
    }
    if (V.sock && V.sock.on === 'mouth') drawSock(PX, V.hx, V.hy + 11, 2);
  }
  return V;
}
// in front of everything, the monitor included (the game screen is pasted after the desk): hearts, the !, the
// sparkle, your hand, the sound bubbles. Drawn into a scratch buffer, then laid over the frame pixel by pixel.
function dogOverlay(ctx, V, t, set) {
  const map = dogSlots(set), F = buf('dogov', RS_W, RS_H); F.I.fill(-1); bind(F); CLIP = null;
  const PX = (x, y, k) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= RS_H) return; B.I[y * W + x] = map[k]; };
  if (V.hearts && V.rise > 0.9) {
    const n = V.hearts === 2 ? 5 : 3;
    for (let k = 0; k < n; k++) {
      const ph = (t * 0.75 + k / n) % 1, seed = Math.floor(t * 0.75 + k / n) * 7 + k, ox = ((seed * 37) % 50) - 25;
      const x = V.hx + ox + Math.sin(t * 2 + k) * 3, y = V.hy - 40 - ph * 40;
      const rows = ph < 0.72 ? HEART : HEART_S;
      rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '.') return; PX(x + i - 4, y + j, c === 'o' ? DOGP.ink : c === 'h' ? DOGP.heart[2] : DOGP.heart[1]); }));
    }
  }
  if (V.sparkle && Math.floor(t * 6) % 2 === 0) { const [sx, sy] = V.sparkle; for (const [a, b] of [[0, -3], [0, -2], [0, 2], [0, 3], [-3, 0], [-2, 0], [2, 0], [3, 0], [0, 0]]) PX(sx + a + 10, sy + b - 8, DOGP.shine); }
  if (V.impact != null && V.impact > 0.2) {   // the slam: short strokes flying out from both paws
    const a = V.impact;
    for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) { const ang = -0.25 - k * 0.55, r0 = 15 + a * 8;
      for (let r = r0; r < r0 + 6; r++) { const x = V.hx + sg * 18 + sg * Math.cos(ang) * r, y = V.hy + 60 + Math.sin(ang) * r; PX(x, y - 1, DOGP.ink); PX(x, y + 1, DOGP.ink); PX(x + 1, y, DOGP.ink); PX(x - 1, y, DOGP.ink); }
      for (let r = r0; r < r0 + 6; r++) PX(V.hx + sg * 18 + sg * Math.cos(ang) * r, V.hy + 60 + Math.sin(ang) * r, DOGP.shine); }
  }
  if (V.mark === '?') { const mx = V.hx + 32, my = V.hy - 48, Q = ['.###.', '##.##', '...##', '..##.', '..#..', '.....', '..#..']; Q.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) PX(mx + i + a, my + j + b, DOGP.ink); })); Q.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') PX(mx + i, my + j, DOGP.shine); })); }
  if (V.mark === '!') { const mx = V.hx + 30, my = V.hy - 46; for (let j = -1; j < 8; j++) for (let i = -1; i < 3; i++) PX(mx + i, my + j, DOGP.ink); for (let j = 0; j < 7; j++) if (j !== 5) { PX(mx, my + j, DOGP.shine); PX(mx + 1, my + j, DOGP.shine); } }
  if (V.hand) { const hx = V.hand.x, hy = V.hand.y; if (V.hand.blur) for (let k = 1; k <= 3; k++) for (let j = 0; j < 9; j += 2) putI(Math.round(hx - k * 6), Math.round(hy + j), P.s3); ebCursor(V.hand.k, hx, hy); }
  if (V.label) {
    const s = V.label.s, w = measure(s, 'tiny') + 8, h = 11;
    const at = V.label.at === 'mouth' ? [V.hx - 66, V.hy + 6] : V.label.at === 'hand' ? [V.hx + 36, V.hy + 2] : V.label.at === 'paws' ? [V.hx - 70, V.hy + 40] : [V.hx + 26, V.hy - 62];
    const [bx, by] = at;
    rectI(bx + 1, by, w - 2, h, P.s1); rectI(bx, by + 1, w, h - 2, P.s1); rectI(bx + 1, by, w - 2, 1, P.s3);
    text(s, bx + 4, by + 3, 'tiny', s === 'BONK' ? P.crimson : s === 'GOOD BOY!' ? P.g5 : P.moon);
  }
  // lay it over the frame
  let y0 = RS_H, y1 = -1; for (let i = 0; i < RS_W * RS_H; i++) if (F.I[i] >= 0) { const y = (i / RS_W) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (y1 < 0) return;
  const img = ctx.getImageData(0, y0, RS_W, y1 - y0 + 1), D = img.data, RGB = set.PAL_RGB;
  for (let y = y0; y <= y1; y++) for (let x = 0; x < RS_W; x++) { const q = F.I[y * RS_W + x]; if (q < 0) continue; const c = RGB[q], o = ((y - y0) * RS_W + x) * 4; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255; }
  ctx.putImageData(img, 0, y0);
}
function drawSock(PX, x, y, mode) {
  // mode 0 lying on the desk, 1 falling, 2 hanging from his mouth
  const map = { o: 0x39, W: 0x19, S: 0x1d, R: 0x2e, H: 0x35, T: 0x35 };
  SOCK.forEach((r, j) => [...r].forEach((c, i) => { if (c === '.') return; const k = map[c];
    if (mode === 2) PX(x - 5 + i, y + j, k); else if (mode === 1) PX(x - 7 + i, y + j - 10, k); else PX(x - 10 + j, y + 6 - i, k); }));
}
// the card (glass, to his left over the keyboard): the first hint, or "gently!". No progress bar: his tail is the meter
function dogCard(V, t) {
  if (!V.card || V.rise < 0.95) return;
  const label = V.card, w = measure(label, 'tiny') + measure('DOG', 'tiny') + 14, h = 13, x = DOG_X - 44 - w, y = 300;
  glassCard(x, y, w, h); const w1 = text('DOG', x + 5, y + 4, 'tiny', P.copper);
  text(label, x + 9 + w1, y + 4, 'tiny', label === 'gently!' ? P.gold : P.moon);
}
// NO SIGNAL: the monitor's own message box, drifting on black (the party fights on behind it, unseen)
let NOSIG_CANVAS = null;
function drawNoSignal(t, v = DESK_VARIANT, flick = 1) {
  if (!NOSIG_CANVAS) { NOSIG_CANVAS = document.createElement('canvas'); NOSIG_CANVAS.width = GS_W; NOSIG_CANVAS.height = GS_H; }
  setRes(GS_W, GS_H);
  const F = buf('nosig', GS_W, GS_H); clearFrame(F); bind(F); CLIP = null;
  rectI(0, 0, W, H, P.void);
  if (flick >= 1) {
    const bw = 120, bh = 38, px = (t * 9) % (2 * (W - bw)), py = (t * 6) % (2 * (H - bh)), x = Math.round(px < W - bw ? px : 2 * (W - bw) - px), y = Math.round(py < H - bh ? py : 2 * (H - bh) - py);
    rectI(x, y, bw, bh, P.s2); frameI(x, y, bw, bh, P.s3); rectI(x + 1, y + 1, bw - 2, 1, P.s4);
    text('NO SIGNAL', x + bw / 2, y + 8, 'tiny', P.moon, { align: 'c' });
    text('check the cable', x + bw / 2, y + 21, 'tiny', P.s5, { align: 'c' });
  } else { for (let y = 0; y < H; y += 3) rectI(0, y, W, 1, P.s1); }
  usePal(deskSet(v));
  composeInto(NOSIG_CANVAS.getContext('2d'), F, { lights: [], ambient: [1, 1, 1], tint: 0, vig: 0 }, 0);
  usePal(PAL_BASE);
  return NOSIG_CANVAS;
}
