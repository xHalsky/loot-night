// ===========================================================================
// AGE OF JUDGMENT (the v2 redesign): the rest of the roster and the crypt's iron angel statue. Approved 2026-11-27.
// Every enemy the build can show gets the world's look. The Church's crypt under Ravenhold: its prisoners and its
// keepers, and what grows on the angel's light. Facing left (toward the party), lit from the upper left.
//   Bat → the Ironwing or the Vigil (rolled per bat) · Brute → Gravedigger · Ogre → the Gaoler
//   Warlock → the Bellringer · Black Knight → the Inquisitor · Troll (the curio and its fight) → the Abbot
// Draw order follows depth in every pose; attacks are wind-up, a fast hit, recovery (strikeTimeline).
// ===========================================================================

// ---------------------------------------------------------------- the iron angel in the crypt's alcove (detailed)
// The saint in the moonlit alcove is one of the fallen: an iron angel set up as a statue by the Church. Serene iron
// face, one eye still an ember that weeps rust; the broken halo behind its head; folded wings of riveted iron feathers
// rising above its shoulders; a plated robe in fluted folds; its hands on the pommel of a great sword, point down;
// green patina in the recesses; chains from the alcove's walls holding its wings; a carved plinth with its name worn
// away, the halo cut into it, wax run down its front.
function ironAngelStatue(cx) {
  const base = 127;
  // clear the alcove's back (the old saint), keep its arch
  for (let y = 33; y < 140; y++) for (let x = cx - 16; x <= cx + 16; x++) { const inArch = y >= 44 ? true : Math.hypot((x + 0.5 - cx) / 16, (y + 0.5 - 44) / 10) <= 1; if (inArch) put(x, y, 0.025 + 0.025 * vnoise(x / 4, y / 4, 7), M_STONE); }
  const moss = (x, y) => y > 92 && vnoise(x / 3, y / 3, 981) > 0.76;
  const P = (x, y, v, recess) => put(x, y, recess && v < 0.3 && moss(x, y) ? v + 0.1 : v, recess && v < 0.3 && moss(x, y) ? M_MOSS : M_STONE);
  // the wings, folded: they rise to points above the halo, swell at the shoulders and run down behind the body to
  // the knees; coverts in scalloped rows above, long primaries in strips below
  const outer = (y) => (y < 62 ? 11.5 + 3.5 * Math.sin(clamp((y - 36) / 26) * Math.PI / 2) : y < 104 ? 15 - (y - 62) * 0.07 : 12 - (y - 104) * 0.4);
  const inner = (y) => (y < 62 ? 11.5 - 5.5 * clamp((y - 36) / 26) ** 0.8 : 6);
  for (const sd of [1, -1]) {
    const lit = sd < 0;
    for (let y = 36; y <= 114; y++) {
      const o2 = outer(y), i2 = inner(y); if (o2 <= i2 + 0.3) continue;
      for (let x = Math.round(cx + sd * i2); sd > 0 ? x <= Math.round(cx + sd * o2) : x >= Math.round(cx + sd * o2); x += sd) {
        const u = clamp((Math.abs(x - cx) - i2) / Math.max(1, o2 - i2));   // 0 at the body, 1 at the wing's edge
        let v;
        if (y < 62) {   // coverts: rows of scallops
          const row = Math.floor((y - 36) / 4), ry = (y - 36) % 4, sc = Math.round(Math.abs(Math.sin((Math.abs(x - cx) + row * 2) * 0.9)) * 1.6);
          v = lit ? 0.46 + 0.32 * u : 0.24 - 0.08 * u; if (ry >= 3 - sc) v = lit ? 0.18 : 0.08; if (ry === 0) v += lit ? 0.14 : 0.06;
        } else {        // primaries: strips three wide, their pointed tips staggered at the bottom
          const strip = Math.floor((Math.abs(x - cx) - 6) / 3), sx2 = (Math.abs(x - cx) - 6) % 3, end = 100 + strip * 4;
          if (y > end + (sx2 === 1 ? 2 : 0)) continue;
          v = lit ? 0.4 + 0.12 * strip - 0.14 * clamp((y - 62) / 44) : 0.22 - 0.03 * strip - 0.06 * clamp((y - 62) / 44);
          if (sx2 === (lit ? 2 : 0)) v = lit ? 0.14 : 0.06; else if (sx2 === (lit ? 0 : 2)) v += lit ? 0.16 : 0.06;
        }
        P(x, y, v, true);
      }
      // the leading edge: a bright rim on the lit wing, the moon's cold rim on the other
      const ex = Math.round(cx + sd * outer(y)); put(ex, y, lit ? 0.86 : 0.56, M_STONE);
    }
    for (let y = 40; y < 62; y += 4) put(Math.round(cx + sd * (inner(y) + 1)), y + 1, lit ? 0.95 : 0.5, M_STONE);
  }
  // the halo behind the head: gilt, broken, its spark
  brokenHalo(cx + 0.5, 53.5, 10, 0.92, M_UMBER, 0, { w: 2, bigSpark: true });
  // the robe from the waist: three deep folds, two riveted bands, flaring to the plinth
  for (let y = 80; y < base; y++) {
    const q = (y - 80) / (base - 80), hw = 7 + q * 3.5;
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      const u = (x - cx + hw) / (2 * hw);
      let v = 0.62 - 0.46 * u;
      for (const [f, d] of [[0.24, 1], [0.6, 0.8], [0.86, 0.6]]) { const dd = u - f - q * 0.02; if (Math.abs(dd) < 0.04) v = 0.08; else if (dd > 0 && dd < 0.1) v += 0.14 * d; }
      if (y === 100 || y === 114) v = 0.1; else if (y === 101 || y === 115) v += 0.18;
      P(x, y, v, u > 0.5);
    }
    if (y === 102 || y === 116) for (let x = Math.round(cx - hw) + 2; x < cx + hw - 1; x += 3) put(x, y, 0.92, M_STONE);
  }
  // the arms down to the hands on the pommel
  limb(cx + 8, 66, cx + 9, 77, 4, 3.6, 0.1, 0.32, M_STONE); limb(cx + 9, 77, cx + 3, 85, 3.6, 3, 0.1, 0.32, M_STONE);
  // the breastplate and the shoulders: the halo embossed on it
  const BP = [[cx - 8, 64], [cx + 8, 64], [cx + 7, 74], [cx + 6, 81], [cx - 6, 81], [cx - 7, 74]];
  poly(BP, (x, y) => 0.18 + 0.56 * clamp((cx + 7 - x) / 15) ** 1.1 - 0.06 * clamp((y - 64) / 17), M_STONE); litEdges(BP, 0.94, 0.05, M_STONE);
  brokenHalo(cx - 0.5, 72.5, 3, 0.86, M_UMBER, 0, { spark: false });
  line(cx - 7, 80, cx + 6, 80, 0.86, M_UMBER); line(cx - 6, 81, cx + 6, 81, 0.3, M_UMBER);
  for (const sd of [-1, 1]) { const P2 = [[cx + sd * 3, 64], [cx + sd * 10, 63], [cx + sd * 11, 67], [cx + sd * 9, 70], [cx + sd * 4, 67]]; poly(P2, sd < 0 ? 0.72 : 0.28, M_STONE); litEdges(P2, sd < 0 ? 0.96 : 0.44, 0.05, M_STONE); }
  limb(cx - 8, 66, cx - 9, 77, 4, 3.6, 0.24, 0.8, M_STONE); limb(cx - 9, 77, cx - 3, 85, 3.6, 3, 0.24, 0.8, M_STONE);
  // the great sword, point down: gilt crossguard and pommel, the hands folded over it
  for (let y = 90; y < base; y++) { put(cx - 1, y, 0.92, M_STONE); put(cx, y, 0.58, M_STONE); put(cx + 1, y, 0.2, M_STONE); }
  put(cx, base - 1, 0.4, M_STONE);
  for (let x = cx - 7; x <= cx + 7; x++) { put(x, 89, x < cx ? 0.92 : 0.6, M_UMBER); put(x, 90, 0.28, M_UMBER); }
  put(cx - 8, 88, 0.8, M_UMBER); put(cx + 8, 88, 0.5, M_UMBER);
  ellipse(cx - 1.5, 85.5, 3, 2.4, (x) => 0.3 + 0.5 * clamp((cx - x) / 4), M_STONE); ellipse(cx + 2.5, 85.5, 3, 2.4, 0.26, M_STONE);
  for (const x of [cx - 3, cx - 1, cx + 2]) put(x, 86, 0.06, M_STONE);
  put(cx, 83, 0.94, M_UMBER); put(cx + 1, 83, 0.6, M_UMBER);
  // the head: a serene iron face, hair in long locks, the eyes closed; one still an ember, weeping a line of rust
  const hx = cx, hy = 56;
  for (const sd of [-1, 1]) for (let y = hy - 5; y < hy + 8; y++) for (let k = 0; k < 2; k++) { const x = hx + sd * (4 + k) + (y > hy + 4 ? sd : 0); put(x, y, (sd < 0 ? 0.56 - k * 0.14 : 0.24 - k * 0.06) + ((y + k) % 3 === 0 ? -0.08 : 0), M_STONE); }
  ellipse(hx + 0.5, hy + 0.5, 4, 5.6, (x, y) => 0.3 + 0.56 * clamp((hx + 3.5 - x) / 7.5) ** 0.9 - 0.1 * clamp((y - hy) / 6), M_STONE);
  for (let x = hx - 4; x <= hx + 4; x++) put(x, hy - 5 + Math.round(Math.abs(x - hx) * 0.35), x < hx ? 0.7 : 0.4, M_STONE);
  line(hx - 3, hy, hx - 1, hy, 0.06, M_STONE); line(hx + 1, hy, hx + 2, hy, 0.06, M_STONE);
  put(hx + 2, hy, 1, M_DANGER, 1); put(hx + 3, hy, 0.6, M_DANGER, 1); put(hx + 2, hy + 1, 0.55, M_DANGER, 1);
  for (let y = hy + 2; y < hy + 10; y++) put(hx + 2, y, 0.6 + 0.2 * hash(y, 0, 982), M_UMBER);
  line(hx - 1, hy, hx - 1, hy + 3, 0.92, M_STONE); put(hx, hy + 3, 0.2, M_STONE);
  put(hx - 1, hy + 5, 0.12, M_STONE); put(hx, hy + 5, 0.12, M_STONE);
  for (let y = hy + 6; y < 64; y++) { put(hx - 1, y, 0.5, M_STONE); put(hx, y, 0.32, M_STONE); put(hx + 1, y, 0.18, M_STONE); }
  // the wing tips above the halo catch the light
  for (const sd of [-1, 1]) for (let y = 36; y < 44; y++) { const x = Math.round(cx + sd * outer(y)); put(x, y, sd < 0 ? 0.95 : 0.7, M_STONE); put(x - sd, y, sd < 0 ? 0.7 : 0.4, M_STONE); }
  // the moon's rim down the statue's right side, so it stands off the dark alcove
  for (let y = 62; y < base; y++) { let rx = -1; for (let x = cx + 16; x > cx; x--) { const i = y * BW + x; if (B.V[i] > 0.07 && B.M[i] !== M_UMBER) { rx = x; break; } } if (rx > 0 && rx > cx + 3) put(rx, y, 0.6, M_STONE); }
  // a few rust runs from the rivets
  for (const [x, y0, l] of [[cx - 6, 103, 4], [cx + 4, 117, 5], [cx - 3, 117, 3], [cx + 7, 103, 3]]) for (let j = 0; j < l; j++) put(x, y0 + j, 0.36 + 0.14 * hash(j, x, 984), M_UMBER);
  // the plinth: carved, stepped, its name worn away, the halo cut into it, wax run down its front
  rect(cx - 13, base, 27, 13, (x, y) => 0.24 + 0.34 * clamp((cx + 13 - x) / 27) - (y === base + 12 ? 0.1 : 0), M_STONE);
  rect(cx - 14, base, 29, 2, (x) => 0.52 + 0.32 * clamp((cx + 14 - x) / 29), M_STONE); rect(cx - 14, base + 2, 29, 1, 0.06, M_STONE);
  for (let x = cx - 10; x <= cx + 10; x++) if (hash(x, 0, 985) > 0.35 && (x - cx + 20) % 4 !== 3) put(x, base + 4, 0.1, M_STONE);
  brokenHalo(cx + 0.5, base + 9, 3, 0.74, M_UMBER, 0, { spark: false });
  for (const [x, l] of [[cx - 9, 5], [cx - 7, 3], [cx + 8, 6], [cx + 10, 3]]) for (let j = 0; j < l; j++) put(x, base + 2 + j, j === l - 1 ? 0.86 : 0.74, M_UMBER);
}
