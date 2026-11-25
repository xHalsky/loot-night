// ===========================================================================
// The cable fix (the dog's revenge). He slammed the desk: NO SIGNAL. A window opens over the right screen, like the
// energy break's: behind the monitor, seen through one camera in centimetres. The port strip on the monitor's back,
// 4 sockets drawn from 9 shapes in a random order with their printed labels; the 4 cables come up through the desk's
// grommet and their plugs lie on the desk, connectors toward you, so a plug and its socket can be compared face to
// face. Drag a plug to the socket of the same shape: it turns and clicks in, or bounces back. Back in 6 s: Flow kept.
// ===========================================================================
const PS = 1.3;   // every connector drawn 1.3x its real size (sockets and plugs alike), so the shapes read
const PORTS = [
  { name: 'HDMI', lab: 'HDMI', w: 1.4, h: 0.46, hw: 2.0, hh: 1.0, L: 3.2 },
  { name: 'DisplayPort', lab: 'DP', w: 1.6, h: 0.5, hw: 2.1, hh: 1.0, L: 3.2 },
  { name: 'Power', lab: 'AC IN', w: 1.05, h: 0.56, hw: 2.2, hh: 1.2, L: 3.0 },
  { name: 'USB-A', lab: 'USB', w: 1.25, h: 0.5, hw: 1.6, hh: 0.8, L: 3.0 },
  { name: 'USB-C', lab: 'USB-C', w: 0.86, h: 0.3, hw: 1.2, hh: 0.62, L: 2.4 },
  { name: 'DVI', lab: 'DVI', w: 3.7, h: 0.78, hw: 4.0, hh: 1.6, L: 3.0, screws: 1.95 },
  { name: 'VGA', lab: 'VGA', w: 1.7, h: 0.86, hw: 3.3, hh: 1.6, L: 3.0, screws: 1.3 },
  { name: 'Ethernet', lab: 'LAN', w: 1.18, h: 0.98, hw: 1.3, hh: 1.1, L: 2.6 },
  { name: 'Audio', lab: 'AUDIO', w: 0.62, h: 0.62, hw: 0.9, hh: 0.9, L: 2.2, round: true },
];
// the cables' colours: one material ramp and value each (no cyan: cyan means Zone)
const CABLE_MAT = [[M_DANGER, 1.05], [M_LOOT, 0.92], [M_MOSS, 0.84], [M_MAGIC, 0.78], [M_STONE, 1.0], [M_STONE, 0.24], [M_UMBER, 0.84], [M_LOOT, 0.7], [M_DUSK, 0.92]];
// a connector's face at (u, v) cm from its centre: 0 outside, 1 the metal shell, 2 the cavity, 3 a detail (tongue,
// pins, contacts). The same pattern for the socket and the plug, so they read as a pair.
function portAt(k, u, v) {
  u /= PS; v /= PS;
  const P_ = PORTS[k], hw = P_.w / 2, hh = P_.h / 2, au = Math.abs(u), av = Math.abs(v), e = 0.09;
  const rect = (w2, h2) => au <= w2 && av <= h2;
  switch (k) {
    case 0: { const wv = hw - (v < 0 ? (-v / hh) * 0.16 : 0); if (!(av <= hh && au <= wv)) return 0; if (av > hh - e || au > wv - e) return 1; return av < 0.08 && au < hw - 0.2 ? 3 : 2; }       // HDMI: the corners cut below
    case 1: { if (!rect(hw, hh) || (u > hw - 0.28 && v < -hh + 0.28 && (u - (hw - 0.28)) + (-hh + 0.28 - v) > 0.28)) return 0; if (av > hh - e || au > hw - e) return 1; return av < 0.08 && au < hw - 0.22 ? 3 : 2; }   // DP: one corner cut
    case 2: { const r = hh, d = Math.min(Math.hypot(u + 0.24, v), Math.hypot(u - 0.24, v)); if (d > r) return 0; if (d > r - e) return 1; return Math.min(Math.hypot(u + 0.24, v), Math.hypot(u - 0.24, v)) < 0.1 ? 3 : 2; }   // figure-8 power: two pins
    case 3: { if (!rect(hw, hh)) return 0; if (av > hh - e || au > hw - e) return 1; return v > 0 && v < hh - 0.12 && au < hw - 0.14 ? 3 : 2; }   // USB-A: the tongue up top
    case 4: { const r = hh, cx = Math.max(0, au - (hw - r)); if (Math.hypot(cx, v) > r) return 0; if (Math.hypot(cx, v) > r - 0.06) return 1; return av < 0.05 && au < hw - 0.16 ? 3 : 2; }   // USB-C: a pill
    case 5: { const cut = v > 0 ? 0 : (-v / hh) * 0.2; if (!(av <= hh && au <= hw - cut)) return 0; if (av > hh - e || au > hw - cut - e) return 1; const pu = (u + hw) / (P_.w / 9), pv = (v + hh) / (P_.h / 3.6); return au < hw - 0.6 && Math.abs(pu - Math.round(pu)) < 0.22 && Math.abs(pv - Math.round(pv)) < 0.2 && Math.round(pv) >= 1 && Math.round(pv) <= 3 ? 3 : u > hw - 0.55 && av < 0.07 ? 3 : 2; }   // DVI: D-shape, pins, the blade
    case 6: { const cut = v > 0 ? 0 : (-v / hh) * 0.17; if (!(av <= hh && au <= hw - cut)) return 0; if (av > hh - e || au > hw - cut - e) return 1; const row = v > 0.15 ? 0 : v > -0.15 ? 1 : 2, n = row === 2 ? 4 : 5, pu = ((u + hw * 0.78) / (hw * 1.56)) * (n - 1); return Math.abs(v - [0.27, 0, -0.27][row]) < 0.07 && Math.abs(pu - Math.round(pu)) < 0.16 && pu > -0.3 && pu < n - 0.7 ? 3 : 2; }   // VGA: D-sub, 15 pins
    case 7: { const notch = v < -hh + 0.24 && au < 0.27; if (!rect(hw, hh) || notch) return 0; if (av > hh - e || au > hw - e || (v < -hh + 0.24 + e && au < 0.27 + e)) return 1; return v > hh - 0.3 && Math.abs(((u + hw) / (P_.w / 9)) % 1 - 0.5) < 0.22 && au < hw - 0.12 ? 3 : 2; }   // Ethernet: the clip notch, 8 contacts
    case 8: { const d = Math.hypot(u, v); if (d > hh) return 0; if (d > hh - 0.12) return 1; return d < 0.17 ? 2 : 3; }   // 3.5 mm: a hole in a ring
  }
  return 0;
}
const CB = { strip: [-31.8, 5.4, -5.0, 11.8], slots: [-28.0, -21.6, -15.2, -8.8], y: 8.6, back: -12.5, grom: [-35.5, -9], rest: [[-30.2, -1.2], [-23.4, -0.2], [-16.4, -1.4], [-9.4, -0.6]] };
// a fresh mix every time (the build's rule): which plugs, which colours, which socket order
function cableDeal(seed) {
  const r = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n); };
  const pick = (n, m) => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = r(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, m); };
  return { kinds: pick(9, 4), colors: pick(9, 4), sockets: pick(4, 4) };
}
// the camera: from behind the monitor, 16 degrees down, a long lens (the strip reads almost face on, 13 px per cm)
const CABLE_CAM = (() => {
  const pitch = (16 * Math.PI) / 180, D = 300, T0 = [-18.4, 4.4, -6.4], C0 = ebCam([0, 0, 0], 0, pitch, 1, 0, 0);
  const E = [T0[0] - C0.F[0] * D, T0[1] - C0.F[1] * D, T0[2] - C0.F[2] * D];
  return ebCam(E, 0, pitch, 13 * (D + 8), EBW / 2, EBH / 2 + 6);
})();
// the screen is off (NO SIGNAL): moonlight from the window behind you lights the monitor's back and the plugs' faces
const CABLE_LIGHT = () => [{ p: [70, 170, 150], i: 1.45, r: 280 }, { p: [-120, 90, 120], i: 0.4, r: 320, shadow: false }];   // the moon through the window behind you, a faint bounce from the left
function cableBackSh(slotKinds) {
  return (h) => {
    const [X, Y] = h.P; let v = 0.2 + 0.02 * (vnoise(X * 0.6, Y * 0.6, 5) - 0.5), m = M_STONE;
    if (h.face !== 5) { OUT.v = 0.16 * lit(h); OUT.m = m; return; }
    // the vents up top, the VESA plate with its screws, a serial sticker
    if (Y > 30 && Y < 38 && X > -26 && X < 26 && ((X + 30) % 1.6) < 0.7) v = 0.07;
    if (Math.abs(X) < 5 && Y > 19 && Y < 29) { v = 0.17; for (const sx of [-3.6, 3.6]) for (const sy of [20.4, 27.6]) if (Math.hypot(X - sx, Y - sy) < 0.35) v = 0.42; }
    const sx = (X + 2.6) / 7.4, sy = (Y - 13.4) / 3.2; if (sx > 0 && sx < 1 && sy > 0 && sy < 1) { v = 0.72; if (sy > 0.18 && sy < 0.62 && sx > 0.08 && sx < 0.92 && ((X * 9.3 + Math.floor(X * 3.1)) % 2) < 0.9) v = 0.16; }
    // the port strip: a recess, its lip lit along the top
    const [x0, y0, x1, y1] = CB.strip;
    if (X > x0 && X < x1 && Y > y0 && Y < y1) {
      v = Y > y1 - 0.35 ? 0.06 : X < x0 + 0.3 ? 0.08 : 0.13;
      for (let s = 0; s < 4; s++) {
        const k = slotKinds[s], q = portAt(k, X - CB.slots[s], Y - CB.y);
        if (q === 1) v = 0.5; else if (q === 2) v = 0.035; else if (q === 3) v = k === 7 || k === 5 || k === 6 ? 0.62 : 0.3;
        if (k === 8 && q === 0 && Math.hypot(X - CB.slots[s], Y - CB.y) < 0.58 * PS) { OUT.v = 0.55 * lit(h); OUT.m = M_MOSS; return; }   // audio out: the green ring
        if (PORTS[k].screws) for (const sg of [-1, 1]) { const d = Math.hypot(X - CB.slots[s] - sg * PORTS[k].screws * PS, Y - CB.y); if (d < 0.32 * PS) v = d < 0.14 * PS ? 0.05 : 0.46; }
      }
    } else if (Y > y0 - 0.25 && Y < y1 + 0.25 && X > x0 - 0.25 && X < x1 + 0.25) v = 0.3;   // the strip's bevel
    OUT.v = v * lit(h); OUT.m = m;
  };
}
function cableDeskSh(h) {
  const [X, , Z] = h.P; let v = 0.3 + 0.05 * (vnoise(X * 0.15, Z * 0.15, 3) - 0.5) + 0.03 * Math.sin(X * 0.9 + vnoise(X * 0.05, Z * 0.4, 4) * 6), m = M_UMBER;
  const g = Math.hypot(X - CB.grom[0], Z - CB.grom[1]);   // the grommet: a black ring, the dark hole
  if (g < 3.3) { m = M_STONE; v = g < 2.5 ? 0.02 : 0.2; }
  if (vnoise(X * 0.9, Z * 0.9, 9) > 0.8) v *= 0.82;      // dust
  OUT.v = v * lit(h); OUT.m = m;
}
function cableStaticPrims(slotKinds) {
  const st = (v0, m = M_STONE) => (h) => { OUT.m = m; OUT.v = v0 * lit(h); };
  return [
    box([-120, -3, -60], [120, 0, 14], cableDeskSh),
    disc([0, -80, 0], [0, 1, 0], 0, st(0.05)),
    box([-34, 4, -16], [34, 40, CB.back], cableBackSh(slotKinds)),
    box([-3.6, 1.1, -11.5], [3.6, 24, -8], st(0.24)),                 // the stand's neck
    box([-11, 0, -24], [11, 1.1, -9], (h) => { OUT.m = M_STONE; OUT.v = (h.face === 3 ? (h.P[2] > -9.6 ? 0.5 : 0.3) : 0.24) * lit(h); }),   // its base, the front edge catching the moon
    // clutter behind the monitor: a USB stick, a paper clip's wire, a crumpled note
    box([14, 0, -2], [18.4, 0.8, -0.6], st(0.32)), box([18.4, 0.15, -1.75], [19.6, 0.65, -0.85], st(0.62)),
    ell([24, 0.9, 2.5], [1.6, 0.9, 1.4], st(0.62, M_UMBER)), ell([25.2, 0.8, 1.6], [1.2, 0.8, 1.2], st(0.56, M_UMBER)),
  ];
}
// a plug as prims: the housing box and the connector in front (toward +Z lying, toward -Z when it goes in)
function plugPrims(k, ci, c, facing) {
  const P_ = PORTS[k], [mat, val] = CABLE_MAT[ci], hw = (P_.hw * PS) / 2, hh = (P_.hh * PS) / 2, L = P_.L * PS, cl = 0.9 * PS, cw = (P_.w * PS) / 2, ch = (P_.h * PS) / 2;
  const housing = (h) => { OUT.m = k === 7 ? M_STONE : mat === M_STONE && val < 0.3 ? M_STONE : M_STONE; const top = h.face === 3; OUT.v = (k === 7 ? 0.7 : 0.2 + (top ? 0.08 : 0)) * lit(h); if (h.face === (facing > 0 ? 5 : 4) && k !== 7) { const u = h.P[0] - c[0], v = h.P[1] - c[1]; if (Math.abs(u) < cw + 0.06 && Math.abs(v) < ch + 0.06) OUT.v = 0.05; } };
  const zf = facing > 0 ? c[2] + L / 2 : c[2] - L / 2;
  const Q = [box([c[0] - hw, c[1] - hh, c[2] - L / 2], [c[0] + hw, c[1] + hh, c[2] + L / 2], housing)];
  // the connector: a box the size of the face; its front face shows the shape, outside it the housing's dark
  const face = (h) => {
    OUT.m = M_STONE; const front = h.face === (facing > 0 ? 5 : 4);
    if (!front) { OUT.v = 0.75 * lit(h); return; }
    const q = portAt(k, h.P[0] - c[0], h.P[1] - c[1]);
    OUT.v = (q === 0 ? 0.1 : q === 1 ? 1.05 : q === 2 ? 0.36 : 0.85) * lit(h);
  };
  if (P_.round) Q.push(rCyl([c[0], c[1], zf], [0, 0, facing], 1.4 * PS, 0.18 * PS, (h) => { OUT.m = M_STONE; const d = h.h / PS; OUT.v = ((d > 0.5 && d < 0.58) || (d > 0.9 && d < 0.98) ? 0.1 : 0.72) * lit(h); }));
  else Q.push(box([c[0] - cw, c[1] - ch, facing > 0 ? zf : zf - cl], [c[0] + cw, c[1] + ch, facing > 0 ? zf + cl : zf], face));
  if (P_.screws) for (const sg of [-1, 1]) Q.push(rCyl([c[0] + sg * P_.screws * PS, c[1], zf], [0, 0, facing], 0.5 * PS, 0.26 * PS, st2(0.6)));
  return Q;
}
const st2 = (v0, m = M_STONE) => (h) => { OUT.m = m; OUT.v = v0 * lit(h); };
// the cable: a tube from the plug's back to the grommet, sagging, as short cylinders with round joints
function cablePath(a, b, sag) {
  const pts = [];
  for (let k = 0; k <= 10; k++) {
    const u = k / 10, x = a[0] + (b[0] - a[0]) * u, z = a[2] + (b[2] - a[2]) * u;
    let y = a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u);
    y = Math.max(0.32, y);   // it lies on the desk
    pts.push([x, y, z]);
  }
  return pts;
}
function cablePrims(pts, ci) {
  const [mat, val] = CABLE_MAT[ci], sh = (h) => { OUT.m = mat; OUT.v = val * lit(h); }, Q = [];
  for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d); if (L < 1e-3) continue; Q.push(rCyl(a, d, L, 0.27, sh, { shadow: false })); }
  for (let k = 1; k < pts.length - 1; k++) Q.push(ell(pts[k], [0.27, 0.27, 0.27], sh, { shadow: false }));
  return Q;
}
// where each plug is at time T of the demo (or live): lying, carried, going in, bouncing back, in
const CABLE = { deal: cableDeal(7), state: null, live: null };
function cableScript(T) {
  // the demo: a wrong try first (bounces back), then each plug to its socket
  const d = CABLE.deal, order = [0, 1, 2, 3].sort((a, b) => d.sockets.indexOf(a) - d.sockets.indexOf(b));
  const moves = [{ plug: order[1], slot: d.sockets.indexOf(order[0]), wrong: true }, ...order.map((p) => ({ plug: p, slot: d.sockets.indexOf(p) }))];
  const out = { pos: [], facing: [], inSlot: [-1, -1, -1, -1], cursor: null, flash: null, label: null, done: false };
  const lie = (p) => [CB.rest[p][0], (PORTS[d.kinds[p]].hh * PS) / 2, CB.rest[p][1]];
  for (let p = 0; p < 4; p++) { out.pos[p] = lie(p); out.facing[p] = 1; }
  let t0 = 0.6;
  for (const m of moves) {
    const k = d.kinds[m.plug], P_ = PORTS[k], from = lie(m.plug), at = [CB.slots[m.slot], CB.y, CB.back + 4.6], into = [CB.slots[m.slot], CB.y, CB.back + (P_.L * PS) / 2 + 0.9 * PS];
    const dur = 0.95, t = T - t0;
    if (t < 0) return out;
    if (t < dur) {
      const u = t / dur; out.moving = [m.plug];
      if (u < 0.15) { out.cursor = { k: u < 0.1 ? 'hand' : 'grab', p: from }; }
      else if (u < 0.62) { const e = ease((u - 0.15) / 0.47); out.pos[m.plug] = [lerp(from[0], at[0], e), lerp(from[1], at[1], e) + Math.sin(e * Math.PI) * 3, lerp(from[2], at[2], e)]; out.cursor = { k: 'grab', p: out.pos[m.plug] }; }
      else if (!m.wrong) { const e = ease((u - 0.62) / 0.18); out.facing[m.plug] = -1; out.pos[m.plug] = [at[0], at[1], lerp(at[2], into[2], Math.min(1, e))]; out.cursor = { k: u < 0.8 ? 'grab' : 'hand', p: out.pos[m.plug] }; if (u > 0.8) { out.flash = { slot: m.slot, ok: true }; out.label = { s: 'click', slot: m.slot }; } }
      else { const e = ease((u - 0.62) / 0.38); out.pos[m.plug] = [lerp(at[0], from[0], e), lerp(at[1], from[1], e) + Math.sin(e * Math.PI) * 2, lerp(at[2], from[2], e)]; out.cursor = { k: 'hand', p: out.pos[m.plug] }; if (u < 0.85) { out.flash = { slot: m.slot, ok: false }; out.label = { s: "doesn't fit", slot: m.slot }; } }
      return out;
    }
    if (t >= dur && !m.wrong) { out.inSlot[m.plug] = m.slot; out.facing[m.plug] = -1; out.pos[m.plug] = into; }
    t0 += dur + 0.1;
  }
  out.done = true; out.tDone = t0 - 0.1;
  return out;
}
const CABLE_LOOP = 8.4;
function cableScene(t) {
  const C = CABLE_CAM, d = CABLE.deal, T = t % CABLE_LOOP, slotKinds = d.sockets.map((p) => d.kinds[p]);
  const S = CABLE.live ? CABLE.live.view() : cableScript(T);
  const statics = cableStaticPrims(slotKinds), base = ebBake('cables' + slotKinds.join(''), C, statics, CABLE_LIGHT(), 0.17);
  // plugs and cables, cast over the baked room with a depth test, each in its own screen box. The ones standing
  // still (lying, or in) are cached with the room; only a plug on the move is cast every frame.
  const moving = S.moving || [], still = [0, 1, 2, 3].filter((p) => !moving.includes(p));
  const key = 'cab' + slotKinds.join('') + d.kinds.join('') + d.colors.join('') + still.map((p) => p + ':' + S.pos[p].map((v) => v.toFixed(2)).join(',') + S.facing[p]).join('|');
  let held = EB_CACHE.get(key);
  if (!held) {
    held = ebBuf(); ebCopy(held, base); for (const p of still) castPlug(held, C, S, p, statics);
    const cab = [...EB_CACHE.keys()].filter((k) => k.startsWith('cab') && !k.startsWith('cables'));   // a few at most (each is a whole scene buffer)
    if (cab.length > 4) EB_CACHE.delete(cab[0]);
    EB_CACHE.set(key, held);
  }
  const F = EBF.buf; ebCopy(F, held); bind(F);
  for (const p of moving) castPlug(F, C, S, p, statics);
  // the printed labels under the sockets, and the feedback
  for (let s = 0; s < 4; s++) {
    const lp = camP(C, CB.slots[s], CB.strip[1] - 1.1, CB.back);
    text(PORTS[slotKinds[s]].lab, Math.round(lp[0]), Math.round(lp[1]) - 2, 'tiny', P.s4, { align: 'c' });
  }
  if (S.flash) { const sp = camP(C, CB.slots[S.flash.slot], CB.y, CB.back), P_ = PORTS[slotKinds[S.flash.slot]], rw = (P_.w * PS * 13) / 2 + 5, rh = (P_.h * PS * 13) / 2 + 5; frameI(Math.round(sp[0] - rw), Math.round(sp[1] - rh), Math.round(rw * 2), Math.round(rh * 2), S.flash.ok ? P.g5 : P.crimson); }
  if (S.label) { const sp = camP(C, CB.slots[S.label.slot], CB.strip[3] + 1.2, CB.back); ebLabel(S.label.s, sp[0], sp[1] - 10, S.label.s === 'click' ? P.g5 : P.crimson, 'c'); }
  if (S.cursor) { const cp = camP(C, S.cursor.p[0], S.cursor.p[1] + 0.6, S.cursor.p[2]); ebCursor(S.cursor.k, cp[0] + 2, cp[1] - 2); }
  if (S.done) { const el = CABLE.live ? CABLE.live.elapsed() : S.tDone; ebLabel(el <= 6 ? 'Signal back in ' + Math.max(1, Math.round(el)) + ' s. Flow kept.' : 'Signal back. Good as new.', EBW / 2, 14, P.g5, 'c'); }
  CABLE.state = S;
  return C;
}
function castPlug(F, C, S, p, statics) {
  const d = CABLE.deal, k = d.kinds[p], P_ = PORTS[k], c = S.pos[p], fc = S.facing[p], back = [c[0], c[1], c[2] - (fc * P_.L * PS) / 2];
  const grom = [CB.grom[0] + (p - 1.5) * 0.7, -2, CB.grom[1] + (p - 1.5) * 0.4];
  const drop = [back[0], Math.max(0.3, back[1] - 3), back[2] + 1.5];
  const pts = [back, ...(fc < 0 ? [drop] : []), ...cablePath(fc < 0 ? drop : back, [grom[0], 0.3, grom[2]], 3).slice(1), grom];
  const Q = [...plugPrims(k, d.colors[p], c, fc), ...cablePrims(pts, d.colors[p])];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const q of [...pts, [c[0] - P_.hw * PS, c[1] - P_.hh * PS, c[2] - P_.L * PS], [c[0] + P_.hw * PS, c[1] + P_.hh * PS, c[2] + P_.L * PS]]) { const s = camP(C, q[0], q[1], q[2]); x0 = Math.min(x0, s[0]); y0 = Math.min(y0, s[1]); x1 = Math.max(x1, s[0]); y1 = Math.max(y1, s[1]); }
  RT_SCENE = { prims: statics.concat(Q), lights: CABLE_LIGHT(), amb: 0.17 };
  ebCastRect(F, C, Q, x0 - 8, y0 - 8, x1 + 8, y1 + 8, true);
}
// the window: like the energy break's, palette-exact; the 4 cables as pills (done: moss check), the 6 s for Flow
function cableWindowCanvas(t) {
  const [, , w, h] = EB_WIN;
  if (!EBWIN.buf) { EBWIN.buf = mkBuf(w, h, true); EBWIN.canvas = document.createElement('canvas'); EBWIN.canvas.width = w; EBWIN.canvas.height = h; }
  setRes(w, h); CLIP = null; const F = EBWIN.buf; F.I.fill(-1); bind(F);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = i < 2 || i >= w - 2, cy = j < 2 || j >= h - 2;
    if (cx && cy && (i === 0 || i === w - 1) && (j === 0 || j === h - 1)) continue;
    if (cx && cy && (i === 0 || i === w - 1 || j === 0 || j === h - 1)) { putI(i, j, P.s2); continue; }
    putI(i, j, j === 0 ? P.s3 : i === 0 || i === w - 1 || j === h - 1 ? P.s2 : P.s1);
  }
  const S = CABLE.state || { inSlot: [-1, -1, -1, -1], done: false }, d = CABLE.deal, T = CABLE.live ? CABLE.live.elapsed() : t % CABLE_LOOP;
  text('Behind the monitor', 8, 6, 'tiny', P.moon);
  text('NO SIGNAL: the party fights on unseen', 8 + measure('Behind the monitor', 'tiny') + 8, 6, 'tiny', P.u4);
  rectI(w - 15, 4, 10, 10, P.s2); frameI(w - 15, 4, 10, 10, P.s3); glyph('cross', w - 12, 7, P.u5);
  const pw = 92, gap = 3;
  for (let p = 0; p < 4; p++) {
    const px = 8 + p * (pw + gap), py = 18, done = S.inSlot[p] >= 0, bg = done ? P.g2 : P.s2, [mat, val] = CABLE_MAT[d.colors[p]];
    rectI(px + 1, py, pw - 2, 11, bg); rectI(px, py + 1, pw, 9, bg);
    // the cable's colour as a short swatch, then the plug's name
    const sw = { [M_DANGER]: P.crimson, [M_LOOT]: val > 0.8 ? P.gold : P.copper, [M_MOSS]: P.g5, [M_MAGIC]: P.arcane, [M_STONE]: val > 0.5 ? P.moon : P.void, [M_UMBER]: P.u5, [M_DUSK]: P.d5 }[mat];
    rectI(px + 3, py + 3, 7, 5, P.void); rectI(px + 4, py + 4, 5, 3, sw);
    if (done) glyph('check', px + pw - 10, py + 4, P.g5);
    text(PORTS[d.kinds[p]].name, px + 14, py + 3, 'tiny', done ? P.u5 : P.moon);
  }
  const allIn = S.done, el = allIn ? (CABLE.live ? CABLE.live.elapsed() : S.tDone) : T, left = Math.max(0, 6 - el);
  text(allIn ? 'All in. Signal back.' : 'Plug each cable into the port of the same shape', 8, 31, 'tiny', allIn ? P.g5 : P.moon);
  const ft = allIn ? (el <= 6 ? 'Flow kept' : 'Flow lost') : left > 0 ? 'Flow kept if back in ' + Math.ceil(left) + ' s' : 'Flow lost', fw = measure(ft, 'tiny');
  text(ft, w - 10 - fw, 31, 'tiny', allIn ? (el <= 6 ? P.g5 : P.u4) : left > 0 ? P.gold : P.u4);
  frameI(3, 37, EBW + 2, EBH + 2, P.void);
  const ctx = EBWIN.canvas.getContext('2d'), img = ctx.createImageData(w, h), D = img.data;
  for (let k = 0; k < w * h; k++) { const q = F.I[k]; if (q < 0) continue; const c = EB_RGB[q]; D[k * 4] = c[0]; D[k * 4 + 1] = c[1]; D[k * 4 + 2] = c[2]; D[k * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return EBWIN.canvas;
}
function drawCableFix(ctx, t) {
  EB_SCREEN = ctx.getImageData(9, 8, 474, 232);
  if (!EBF.buf) { EBF.buf = ebBuf(); EBF.canvas = document.createElement('canvas'); EBF.canvas.width = EBW; EBF.canvas.height = EBH; }
  setRes(EBW, EBH); CLIP = null;
  const C = cableScene(t); EBF.cam = C;
  if (EB_GUIDES) cableGuides(C);
  ebCompose(EBF.buf, EBF.canvas.getContext('2d'), [1, 1, 1]);
  ebDim(ctx);
  ctx.drawImage(cableWindowCanvas(t), EB_WIN[0], EB_WIN[1]);
  ctx.drawImage(EBF.canvas, EB_SC[0], EB_SC[1]);
}
// Show grid: the camera's vanishing points, its horizon, and a grid on the monitor's back and on the desk
function cableGuides(C) {
  for (let x = -30; x <= 30; x += 5) ebSeg(C, [x, 7, CB.back], [x, 43, CB.back], P.crimson, 2);
  for (let y = 10; y <= 40; y += 5) ebSeg(C, [-31, y, CB.back], [31, y, CB.back], P.crimson, 2);
  for (let x = -40; x <= 30; x += 5) ebSeg(C, [x, 0, -16], [x, 0, 14], P.s6, 3);
  for (let z = -15; z <= 14; z += 5) ebSeg(C, [-40, 0, z], [30, 0, z], P.s6, 3);
  const vp = camVP(C, [0, 0, -1]); if (vp) ebLabel('depth VP ' + Math.round(vp[0]) + ', ' + Math.round(vp[1]), 6, EBH - 12, P.s6);
}

// live play on the page: drag a plug (pointer in scene px); it follows on a plane just in front of the strip
function cableUnproject(C, sx, sy, z0) {
  const a = (sx + 0.5 - C.cx) / C.f, b = -(sy + 0.5 - C.cy) / C.f, d = [C.F[0] + C.R[0] * a + C.U[0] * b, C.F[1] + C.R[1] * a + C.U[1] * b, C.F[2] + C.R[2] * a + C.U[2] * b], t = (z0 - C.E[2]) / d[2];
  return [C.E[0] + d[0] * t, C.E[1] + d[1] * t, z0];
}
function cableLive(seed = Math.floor(Math.random() * 1e6)) {
  CABLE.deal = cableDeal(seed);
  const L = { t0: performance.now() / 1000, tEnd: null, slot: [-1, -1, -1, -1], drag: null, anim: [], flash: null, label: null, hover: -1 };
  const d = () => CABLE.deal, lie = (p) => [CB.rest[p][0], (PORTS[d().kinds[p]].hh * PS) / 2, CB.rest[p][1]];
  const into = (p, s) => [CB.slots[s], CB.y, CB.back + (PORTS[d().kinds[p]].L * PS) / 2 + 0.9 * PS];
  const now = () => performance.now() / 1000;
  L.elapsed = () => (L.tEnd ?? now()) - L.t0;
  L.view = () => {
    const t = now(), out = { pos: [], facing: [], inSlot: L.slot.slice(), cursor: null, flash: null, label: null, done: L.slot.every((s) => s >= 0) };
    for (let p = 0; p < 4; p++) { if (L.slot[p] >= 0) { out.pos[p] = into(p, L.slot[p]); out.facing[p] = -1; } else { out.pos[p] = lie(p); out.facing[p] = 1; } }
    L.anim = L.anim.filter((a) => t - a.t < a.dur);
    for (const a of L.anim) { const e = ease((t - a.t) / a.dur); out.pos[a.p] = [lerp(a.from[0], a.to[0], e), lerp(a.from[1], a.to[1], e) + Math.sin(e * Math.PI) * 2, lerp(a.from[2], a.to[2], e)]; }
    if (L.drag) out.pos[L.drag.p] = L.drag.at;
    out.moving = [...L.anim.map((a) => a.p), ...(L.drag ? [L.drag.p] : [])];
    if (L.flash && t - L.flash.t < 0.6) { out.flash = L.flash; out.label = { s: L.flash.ok ? 'click' : "doesn't fit", slot: L.flash.slot }; }
    return out;
  };
  // the plug under the pointer: its face's projection within reach
  L.pick = (sx, sy) => { let best = -1, bd = 18; for (let p = 0; p < 4; p++) { if (L.slot[p] >= 0) continue; const c = lie(p), q = camP(CABLE_CAM, c[0], c[1], c[2] + (PORTS[d().kinds[p]].L * PS) / 2), dd = Math.hypot(q[0] - sx, q[1] - sy); if (dd < bd) { bd = dd; best = p; } } return best; };
  L.down = (sx, sy) => { const p = L.pick(sx, sy); if (p < 0) return false; L.drag = { p, at: lie(p) }; L.move(sx, sy); return true; };
  L.move = (sx, sy) => { if (!L.drag) { L.hover = L.pick(sx, sy); return L.hover >= 0; } const w = cableUnproject(CABLE_CAM, sx, sy, CB.back + 4.6); L.drag.at = [w[0], Math.max(1, w[1]), w[2]]; return true; };
  L.up = () => {
    if (!L.drag) return; const p = L.drag.p, at = L.drag.at; L.drag = null;
    let best = -1, bd = 2.6; for (let s = 0; s < 4; s++) { if (L.slot.includes(s)) continue; const dd = Math.hypot(at[0] - CB.slots[s], at[1] - CB.y); if (dd < bd) { bd = dd; best = s; } }
    if (best >= 0 && d().sockets[best] === p) { L.slot[p] = best; L.flash = { slot: best, ok: true, t: now() }; if (L.slot.every((s) => s >= 0)) L.tEnd = now(); }
    else { if (best >= 0) L.flash = { slot: best, ok: false, t: now() }; L.anim.push({ p, from: at, to: lie(p), t: now(), dur: 0.4 }); }
  };
  return L;
}

// ---------------------------------------------------------------- the game's cable fix (V6, #71)
// The page's live play bound to the game: its deal ({ kinds, colors, sockets }: the plug that goes in each socket),
// its rule (plug(p, slot) -> true when it fits; systems/pets.ts plugIn) and its clock (elapsed(): seconds since the slam).
function cableGame(deal, plug, elapsed) {
  const L = cableLive(1);
  CABLE.deal = { kinds: deal.kinds.slice(), colors: deal.colors.slice(), sockets: deal.sockets.slice() };
  L.slot = deal.plugged.map((on, p) => (on ? deal.sockets.indexOf(p) : -1));
  const now = () => performance.now() / 1000;
  L.elapsed = () => (L.doneAt ?? elapsed());
  L.up = () => {
    if (!L.drag) return; const p = L.drag.p, at = L.drag.at, d = CABLE.deal; L.drag = null;
    const lie = [CB.rest[p][0], (PORTS[d.kinds[p]].hh * PS) / 2, CB.rest[p][1]];
    let best = -1, bd = 2.6; for (let s = 0; s < 4; s++) { if (L.slot.includes(s)) continue; const dd = Math.hypot(at[0] - CB.slots[s], at[1] - CB.y); if (dd < bd) { bd = dd; best = s; } }
    if (best >= 0 && plug(p, best)) { L.slot[p] = best; L.flash = { slot: best, ok: true, t: now() }; if (L.slot.every((s) => s >= 0)) L.doneAt = elapsed(); }
    else { if (best >= 0) L.flash = { slot: best, ok: false, t: now() }; L.anim.push({ p, from: at, to: lie, t: now(), dur: 0.4 }); }
  };
  CABLE.live = L;
  return L;
}
function cableJob() { const d = CABLE.deal, slotKinds = d.sockets.map((p) => d.kinds[p]); return ['cables' + slotKinds.join(''), CABLE_CAM, () => cableStaticPrims(slotKinds), CABLE_LIGHT, 0.17]; }
/** The cable fix over the right screen, as the energy break: bg (when the dim is redone) or null. While the room behind
 *  the monitor is still baking (the dog's slam plays meanwhile) the scene stays dark. */
function drawCablesLive(bg, t) {
  if (!EB_OUT) { EB_OUT = document.createElement('canvas'); EB_OUT.width = RS_W; EB_OUT.height = RS_H; }
  if (bg) ebBackground(bg);
  const ctx = EB_OUT.getContext('2d'), [wx, wy, ww] = EB_WIN;
  if (EB_BG) ctx.drawImage(EB_BG, 0, 0); else { ctx.fillStyle = EB_PAL[P.void]; ctx.fillRect(0, 0, RS_W, RS_H); }
  const ready = ebBakeStep(cableJob(), 8);
  if (!EBF.buf) { EBF.buf = ebBuf(); EBF.canvas = document.createElement('canvas'); EBF.canvas.width = EBW; EBF.canvas.height = EBH; }
  if (ready) { setRes(EBW, EBH); CLIP = null; cableScene(t); ebCompose(EBF.buf, EBF.canvas.getContext('2d'), [1, 1, 1]); }
  EB_WIN_KEY = '';   // the energy break's window shares the buffer: redraw it next time
  ctx.drawImage(cableWindowCanvas(t), wx, wy);
  if (ready) ctx.drawImage(EBF.canvas, EB_SC[0], EB_SC[1]); else { ctx.fillStyle = EB_PAL[P.void]; ctx.fillRect(EB_SC[0], EB_SC[1], EBW, EBH); }
  return { canvas: EB_OUT, hits: [{ x: wx + ww - 15, y: wy + 4, w: 10, h: 10, act: 'cablesHide', arg: '', tip: 'cablesHide' }] };
}
