// ===========================================================================
// THE CURIOS (W5 of the v2 redesign, #131; docs/design/aoj-world.md §4b). Every curio in the corridor drawn in code
// at the characters' detail, in foes.js's manner: shaded shapes lit from the upper left on the Moonwell ramps, iron
// riveted and rusted, gilding in umber's highs, crimson only for the angels' light, gold only where it is loot. Each
// stands on the cart row (its feet on fy = CART_Y) where the curio stands, idles (a flame, a sway, a drip, a rattle),
// throws its own light (dimmed once the party has passed it) and has its states: waiting, and after each choice.
// The Abbot asleep on the tithe is foes.js's abbotAsleep (approved with the roster).
// s: { done (the choice taken or null), out (how it went), stage (pick, sneak while it runs), k (its progress),
//      since (seconds since the choice) }; L(light): pushes a light, dimmed when passed.
// ===========================================================================
// The curio's effects (flames, smoke, sigils, sparks, rings, a drip) are drawn after the outline pass, as the foes'
// candle flames are, so they are not outlined; they never draw over the party walking in front (tags 1 to 4).
let CFX = [];
function pfx(x, y, v, mat, emi = 1) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= BW || y >= BH) return; const tg = B.T[y * BW + x]; if (tg >= 1 && tg <= 4) return; const T0 = TAG; TAG = 0; put(x, y, v, mat, emi); TAG = T0; }
// ink on the floor: under everything standing on it (any actor's pixels), not outlined
function pfloor(x, y, v, mat, emi = 0) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= BW || y >= BH) return; if (B.T[y * BW + x]) return; const T0 = TAG; TAG = 0; put(x, y, v, mat, emi); TAG = T0; }
/** live.js's fx pass: the queued effects of the curio drawn this frame. */
function curioFx() { const q = CFX; CFX = []; for (const f of q) f(); }
// draw() into the box, then dissolve it back to what was under it where the Bayer value is above keep (a dithered fade out)
function dissolve(x0, y0, x1, y1, keep, draw) {
  if (keep >= 1) return draw();
  x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(BW - 1, x1); y1 = Math.min(BH - 1, y1);
  const keys = ['V', 'M', 'E', 'T', 'A', 'DX'], snap = {};
  for (const k of keys) { snap[k] = []; for (let y = y0; y <= y1; y++) snap[k].push(B[k].slice(y * BW + x0, y * BW + x1 + 1)); }
  draw();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (lgB(x, y) >= keep) { const i = y * BW + x; for (const k of keys) B[k][i] = snap[k][y - y0][x - x0]; }
}
// a small flame (a candle's, a lantern's): it flickers; mat: the material it burns in
function flameAt(x, y, t, seed, mat = M_UMBER, tall = 2) {
  const f = hash(Math.floor(t * 13), seed, 7), h = tall + (f > 0.6 ? 1 : 0), lean = f < 0.2 ? -1 : f > 0.85 ? 1 : 0;
  CFX.push(() => { for (let k = 0; k < h; k++) pfx(x + (k === h - 1 ? lean : 0), y - k, k === 0 ? 1 : 0.95 - k * 0.07, mat, 1); if (h > 2) pfx(x + 1, y, 0.7, mat, 1); });
}
// a candle stub: body, a wax drip, its wick's flame; black candles are the cult's
function candleStub(x, fy, h, t, seed, o = {}) {
  const mat = o.black ? M_DUSK : M_UMBER, hi = o.black ? 0.32 : 0.9, lo = o.black ? 0.08 : 0.6;
  for (let j = 0; j < h; j++) { put(x, fy - j, hi, mat); put(x + 1, fy - j, lo, mat); }
  put(x - 1, fy - 1, o.black ? 0.2 : 0.8, mat); if (h > 3) put(x + 2, fy - Math.round(h / 2), lo * 0.9, mat);
  if (o.lit !== false) flameAt(x, fy - h, t, seed, o.violet ? M_MAGIC : M_UMBER, o.flare ? 3 : 2);
  return [x, fy - h - 1];
}
// dark wood: planks with grain, lit from the left (k: how far into the light)
const plankV = (x, y, x0, w, seed) => 0.24 + 0.24 * clamp((x0 + w - x) / w) + 0.05 * (vnoise(x / 1.5, y / 6, seed) - 0.5) - ((x - x0) % 6 === 5 ? 0.08 : 0);

// ---------------------------------------------------------------- the Locked chest (strongbox): the Church's tithe chest
function curioChest(cx, fy, t, s, L) {
  const open = s.done === 'pick' || s.done === 'smash', smashed = s.done === 'smash', picking = s.stage === 'pick';
  const hop = !open && !picking && (t % 3.4) > 3.25 ? -1 : 0, Y = fy + hop, x0 = cx - 19, x1 = cx + 19, top = Y - 18, lid = top - 8;
  const band = (bx, y0, y1) => { for (let y = y0; y < y1; y++) { put(bx, y, 0.9, M_STONE); put(bx + 1, y, 0.55, M_STONE); put(bx + 2, y, 0.24, M_STONE); } rivets(bx + 1, y0 + 2, bx + 1, y1 - 2, Math.max(2, Math.round((y1 - y0) / 5)), 1); };
  const lidShape = (lift) => [[x0 - 1, top + 1], [x0 + 1, lid + 3 - lift], [x0 + 6, lid - lift], [cx, lid - 2 - lift], [x1 - 6, lid - lift], [x1 - 1, lid + 3 - lift], [x1 + 1, top + 1]];
  // the chain round it, staked to the floor at both ends
  if (!smashed) { for (const sx of [x0 - 8, x1 + 7]) rect(sx, fy - 4, 2, 5, (x) => (x === sx ? 0.86 : 0.42), M_STONE); }
  // picked: the lid stands open behind the body on its hinges, its inside face toward us
  if (s.done === 'pick') {
    const k = smoothQ(clamp(s.since / 0.6)), h = Math.round(4 + 13 * k);
    const IN = [[x0 + 1, top + 1], [x0 + 2, top - h + 2], [cx, top - h - 1], [x1 - 2, top - h + 2], [x1 - 1, top + 1]];
    poly(IN, (x, y) => 0.08 + 0.12 * clamp((x1 - x) / 38) - ((x - x0) % 7 === 6 ? 0.04 : 0), M_UMBER); litEdges(IN, 0.7, 0.06, M_UMBER);   // its inside face, in the body's shadow
    for (const bx of [x0 + 8, x1 - 10]) for (let y = top - h + 3; y < top; y++) { put(bx, y, 0.36, M_STONE); put(bx + 1, y, 0.16, M_STONE); }
  }
  // the body: dark planks under riveted iron bands and corner plates
  rect(x0, top, x1 - x0, Y - top, (x, y) => plankV(x, y, x0, x1 - x0, 1101), M_UMBER);
  if (open) { rect(x0 + 1, top, x1 - x0 - 2, 3, 0.02, M_DUSK); rect(x0, top - 1, x1 - x0, 1, 0.86, M_STONE); }   // the dark mouth under its iron lip
  for (const bx of [x0 + 8, x1 - 10]) { if (smashed && bx > cx) continue; band(bx, top, Y); }
  if (smashed) {   // the right band sprung: it curls out from the body
    for (let k = 0; k < 9; k++) { const an = k / 8 * 2.2, x = Math.round(x1 - 9 + Math.sin(an) * 7), y = Math.round(top + 3 + (1 - Math.cos(an)) * 5); put(x, y, 0.92, M_STONE); put(x + 1, y + 1, 0.4, M_STONE); }
    line(cx + 5, top + 2, cx + 9, Y - 3, 0.03, M_DUSK); line(cx + 6, top + 2, cx + 10, Y - 4, 0.36, M_UMBER);   // the split in the front
  }
  for (const [px, py] of [[x0, top], [x1 - 5, top], [x0, Y - 5], [x1 - 5, Y - 5]]) { rect(px, py, 5, 5, (x, y) => (x === px || y === py ? 0.9 : 0.4), M_STONE); put(px + 2, py + 2, 1, M_STONE); }
  rect(x0, Y - 1, x1 - x0, 1, 0.08, M_DUSK);
  for (const [x, y] of [[x0 + 3, Y - 8], [x1 - 6, top + 6], [x0 + 10, Y - 5]]) for (let j = 0; j < 4; j++) put(x, y + j, 0.56 + 0.08 * j, M_UMBER);   // rust run from the iron
  // the domed lid (closed), or split and thrown back (smashed)
  if (!open) {
    const LP = lidShape(0);
    poly(LP, (x, y) => plankV(x, y, x0, x1 - x0, 1102) + 0.1 * clamp((top - y) / 8), M_UMBER); litEdges(LP, 0.66, 0.12, M_UMBER);
    for (const bx of [x0 + 8, x1 - 10]) for (let y = lid - 1; y <= top; y++) { put(bx, y, 0.9, M_STONE); put(bx + 1, y, 0.55, M_STONE); }
    for (let x = x0 - 1; x <= x1; x++) put(x, top, 0.86, M_STONE);   // the iron lip
    // coins wedged in a split in the lid; one glints now and then
    line(cx + 5, lid, cx + 11, top - 1, 0.04, M_DUSK);
    for (const [x, y] of [[cx + 6, lid + 1], [cx + 8, lid + 3], [cx + 10, lid + 5]]) { put(x, y, 0.92, M_LOOT); put(x + 1, y, 0.66, M_LOOT); }
    if ((t % 2.6) < 0.25 || hop) put(cx + 8, lid + 2, 1, M_LOOT, 1);
    // broken wax seals on cords across the seam
    for (const sx of [cx - 13, cx - 4]) { line(sx, top - 2, sx + 2, top + 5, 0.66, M_UMBER); ellipse(sx + 2.5, top + 5.5, 2, 1.8, (x) => (x < sx + 2 ? 0.86 : 0.55), M_DANGER); put(sx + 3, top + 5, 0.2, M_DANGER); put(sx + 1, top + 7, 0.6, M_DANGER); }
  } else if (smashed) {
    const LP = [[x0 - 2, top + 1], [x0 + 1, lid - 4], [cx - 3, lid - 8], [cx - 1, top]];
    poly(LP, (x, y) => plankV(x, y, x0, 22, 1103) + 0.06, M_UMBER); litEdges(LP, 0.66, 0.1, M_UMBER);
    for (let y = lid - 5; y <= top; y++) put(x0 + 7 - Math.round((top - y) * 0.15), y, 0.8, M_STONE);
    const RP = [[x1 - 2, fy], [x1 + 3, fy - 6], [x1 + 18, fy - 4], [x1 + 15, fy]];   // the other half lies on the floor
    poly(RP, (x, y) => plankV(x, y, x1, 18, 1104) + 0.04, M_UMBER); litEdges(RP, 0.6, 0.1, M_UMBER);
    rect(x0 + 1, top, x1 - x0 - 2, 2, 0.02, M_DUSK);
    // gold spilled from the split: a low heap at its foot, coins still rolling
    const k = smoothQ(clamp(s.since / 0.7)), w = Math.round(3 + 9 * k);
    for (let x = -w; x <= w; x++) { const h = Math.round((4 * (1 - (x / (w + 1)) ** 2) + hash(x, 0, 1105)) * k); for (let j = 0; j < h; j++) put(cx + 9 + x, fy - j, ((x * 3 + j * 5) % 7 === 0) ? 1 : 0.62 + 0.3 * clamp(-x / w * 0.5 + 0.5), M_LOOT); }
    CFX.push(() => { for (let n = 0; n < 4; n++) { const q = clamp((s.since - n * 0.15) / 0.9), x = Math.round(cx + 8 + (n - 1.5) * 8 * q + n), y = fy - Math.round(Math.abs(Math.sin(q * 9)) * 4 * (1 - q)); if (q < 1) { pfx(x, y, 1, M_LOOT, 1); pfx(x + 1, y, 0.7, M_LOOT, 0); } } });
    L({ x: cx + 9, y: fy - 3, r: 22, i: 0.5 * k, c: WARM });
  }
  // the chain across the front (gone when smashed)
  if (!smashed) chainLinks(sag(x0 - 7, fy - 1, x1 + 7, fy - 1, -6, 20), 0.9);
  // the padlock cast as the broken halo: the key goes in its gap, its spark crimson
  if (!open) {
    const ly = top + 2;
    rect(cx - 2, ly - 1, 5, 2, (x) => (x === cx - 2 ? 0.9 : 0.5), M_STONE);
    ellipse(cx + 0.5, ly + 6, 5, 5, (x) => 0.14 + 0.3 * clamp((cx + 4 - x) / 9), M_STONE);
    brokenHalo(cx + 0.5, ly + 6, 5, 1, M_UMBER, t, { w: 2, gap: 0.8 });
    L({ x: cx + 4, y: ly + 2, r: 12, i: 0.4, c: [1.6, 0.5, 0.55] });
    if (picking) {   // a pick in the halo lock, the tumblers click with pale sparks
      line(cx + 3, ly + 3, cx + 11, ly - 5, 0.92, M_STONE); line(cx + 11, ly - 5, cx + 14, ly - 5, 0.66, M_STONE);
      if (hash(Math.floor(t * 6), 1, 1107) > 0.5) CFX.push(() => { for (const [dx, dy] of [[0, 0], [1, -1], [-1, -1], [2, 1], [-2, 0]]) pfx(cx + 3 + dx, ly + 2 + dy, 1, M_STONE, 1); });
    }
  }
}

// ---------------------------------------------------------------- the Sealed coffin (mailbox): a Hollow knight's iron coffin
function curioCoffin(cx, fy, t, s, L) {
  const open = s.done === 'open', q = s.since, x0 = cx - 11, x1 = cx + 11, top = fy - 48, breathe = 0.5 + 0.5 * Math.sin(t * 1.6);
  const shape = (ox, oy) => [[x0 + 3 + ox, top + oy], [x1 - 3 + ox, top + oy], [x1 + 1 + ox, top + 11 + oy], [x1 - 2 + ox, fy + oy], [x0 + 2 + ox, fy + oy], [x0 - 1 + ox, top + 11 + oy]];
  // the case against the wall (seen when the lid has ground aside): its dark inside
  const CS = shape(0, 0);
  rimPoly(CS, 1.2); poly(CS, (x, y) => 0.14 + 0.3 * clamp((x1 - x) / 22) ** 1.2, M_STONE); litEdges(CS, 0.84, 0.03, M_STONE);
  if (open) {
    poly([[x0 + 5, top + 3], [x1 - 5, top + 3], [x1 - 2, top + 12], [x1 - 4, fy - 3], [x0 + 4, fy - 3], [x0 + 2, top + 12]], 0.015, M_DUSK);
    for (let y = top + 13; y < fy - 4; y += 4) put(x0 + 3, y, 0.3, M_STONE);   // the inside's rivets catch a little light
    if (s.out === 'gold' && q < 2.6) {   // old coins heaped in its foot, spilling over the sill
      for (let x = -6; x <= 4; x++) { const h = Math.round(5 * (1 - ((x + 1) / 6) ** 2)); for (let j = 0; j < h; j++) put(cx - 6 + x, fy - 3 - j, ((x * 3 + j * 5) % 7 === 0) ? 1 : 0.64 + 0.3 * clamp(-x / 6 * 0.5 + 0.5), M_LOOT); }
      for (const [x, y] of [[cx - 11, fy - 1], [cx - 13, fy], [cx - 4, fy]]) { put(x, y, 0.9, M_LOOT); put(x + 1, y, 0.62, M_LOOT); }
      if ((q * 3) % 1 < 0.3) put(cx - 7, fy - 7, 1, M_LOOT, 1);
      L({ x: cx - 6, y: fy - 5, r: 18, i: 0.5 * (1 - q / 2.6), c: WARM });
    }
    if (s.out === 'rare' && q < 2.6) {   // a relic in the dark, glowing in its rarity light: a sword standing point-down
      const g = 0.75 + 0.25 * Math.sin(q * 9), rx = cx - 6, ry = fy - 24;
      for (let y = ry; y < fy - 3; y++) { put(rx, y, 0.86 * g, M_MAGIC, 1); put(rx + 1, y, 0.5 * g, M_MAGIC, 1); }
      rect(rx - 3, ry, 8, 1, 0.9 * g, M_MAGIC, 1); rect(rx, ry - 4, 2, 4, 0.66 * g, M_MAGIC, 1); put(rx, ry - 5, 1, M_MAGIC, 1);
      if ((q * 2.4) % 1 < 0.2) for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) put(rx + dx, ry + 4 + dy, 1, M_MAGIC, 1);
      L({ x: rx, y: ry + 6, r: 26, i: 0.7 * (1 - q / 2.6), c: [1.0, 0.8, 1.6] });
    }
  }
  // the lid: in place, or ground aside on its chains (it leans against the wall to the right)
  const k = open ? smoothQ(clamp(q / 0.9)) : 0, ox = Math.round(k * 13), oy = Math.round(k * 2);
  const LD = shape(ox, oy);
  poly(LD, (x, y) => 0.2 + 0.34 * clamp((x1 + ox - x) / 22) ** 1.1 - 0.06 * clamp((y - top) / 48), M_STONE); litEdges(LD, 0.9, 0.04, M_STONE);
  // the effigy cast in relief: a great helm with its eye-slit, the shoulders, the hands folded on a sword down the chest
  const ex = cx + ox, ey = top + oy;
  rect(ex - 4, ey + 3, 8, 8, (x, y) => (x === ex - 4 || y === ey + 3 ? 0.86 : x === ex + 3 ? 0.14 : 0.44), M_STONE); rect(ex - 3, ey + 6, 6, 1, 0.03, M_DUSK); put(ex, ey + 8, 0.03, M_DUSK);
  plate([[ex - 7, ey + 13], [ex + 7, ey + 13], [ex + 6, ey + 17], [ex - 6, ey + 17]], 0.2, 0.7, M_STONE);
  for (let y = ey + 18; y < fy + oy - 5; y++) { put(ex - 1, y, 0.9, M_STONE); put(ex, y, 0.56, M_STONE); put(ex + 1, y, 0.18, M_STONE); }
  rect(ex - 4, ey + 22, 9, 2, (x, y) => (y === ey + 22 ? 0.86 : 0.24), M_STONE);   // the crossguard
  ellipse(ex + 0.5, ey + 20.5, 2.6, 2, (x) => (x < ex ? 0.7 : 0.36), M_STONE);   // the hands on the hilt
  put(ex, ey + 18, 0.82, M_UMBER);   // a gilt pommel
  // the prayers cut round its rim (the "runes"), rust from them
  for (let y = ey + 4; y < fy + oy - 3; y += 3) { put(x0 + 1 + ox, y, 0.04, M_STONE); put(x0 + 1 + ox, y + 1, 0.6, M_STONE); put(x1 - 2 + ox, y + 1, 0.04, M_STONE); }
  for (const [x, y] of [[x0 + 2 + ox, ey + 26], [x1 - 3 + ox, ey + 34]]) for (let j = 0; j < 5; j++) put(x, y + j, 0.5 + 0.08 * j, M_UMBER);
  // chains crossed over it with a padlock (they fall slack once it is open)
  if (!open) { chainLinks([[x0, top + 9], [x1 - 1, fy - 7]], 0.95); chainLinks([[x1, top + 9], [x0 + 1, fy - 7]], 0.95); rect(cx - 3, top + 26, 6, 6, (x, y) => (x === cx - 3 || y === top + 26 ? 0.92 : 0.36), M_STONE); rect(cx - 2, top + 23, 4, 3, 0.06, M_DUSK); for (const x of [cx - 2, cx + 1]) for (let y = top + 23; y < top + 26; y++) put(x, y, 0.8, M_STONE); put(cx, top + 28, 0.03, M_DUSK); }
  else { chainLinks(sag(x0 + 1, top + 9, x0 - 5, fy - 1, 4, 8), 0.8); chainLinks(sag(x1 - 1 + ox, top + 9 + oy, x1 + 4 + ox, fy, 3, 8), 0.7); }
  // the warm glow leaking from the seams while it is shut
  if (!open) {
    for (let y = top + 2; y < fy - 1; y++) { if (hash(y, 0, 1201) < 0.6) put(x0 + 2, y, 0.45 + 0.45 * breathe, M_DANGER, 1); if (hash(y, 1, 1201) < 0.6) put(x1 - 3, y, 0.4 + 0.45 * breathe, M_DANGER, 1); }
    for (let x = x0 + 4; x < x1 - 4; x++) if (hash(x, 2, 1201) < 0.5) put(x, top + 1, 0.4 + 0.4 * breathe, M_DANGER, 1);
    L({ x: cx, y: fy - 22, r: 28, i: 0.3 + 0.22 * breathe, c: [1.6, 0.5, 0.55] });
  }
  // candle stubs on its shoulders, the wax run down its sides
  for (const [x, y, sd] of [[x0 - 1, top + 11, 1210], [x1, top + 11, 1211]]) {
    const f = candleStub(x, y, 4, t, sd, { lit: !open || q < 0.4 });
    for (let j = 1; j < 8; j++) put(x + (x > cx ? 0 : 1), y + j, 0.9 - j * 0.05, M_UMBER);
    if (!open) L({ x: f[0], y: f[1], r: 24, i: 0.6, c: WARM });
  }
  // the curse: crimson smoke pours out past the lid and thins
  if (open && s.out === 'curse' && q < 3.2) {
    const fade = 1 - q / 3.2;
    CFX.push(() => {   // it pours from the gap the lid left, billows up over the top and drifts off: a rising noise field, dithered
      const base = fy - 12, top = Math.min(64, 20 + q * 70);
      for (let y = base - 66; y <= base; y++) {
        const u = (base - y) / 56; if (base - y > top) continue;
        const mx = cx - 7 + ox * 0.2 - u * 7 + Math.sin(u * 5 + q * 2.6) * 3, w = 2 + u * 10, tip = clamp((top - (base - y)) / 10);
        for (let x = Math.floor(mx - w - 1); x <= Math.ceil(mx + w + 1); x++) {
          const d = clamp(1 - Math.abs(x + 0.5 - mx) / w) ** 0.7 * (0.35 + 0.9 * fbm(x / 4, (y + q * 26) / 5, 1231)) * fade * tip * (1 - 0.5 * u);
          if (d > lgB(x, y)) pfx(x, y, 0.45 + 0.5 * d, M_DANGER, 1);
        }
      }
    });
    L({ x: cx - 3, y: fy - 28, r: 44, i: 0.75 * fade, c: [1.6, 0.5, 0.55] });
  }
}

// ---------------------------------------------------------------- the Wayside Shrine: a fallen angel's iron feather
function curioShrine(cx, fy, t, s, L) {
  const prayed = s.done === 'shrine', q = s.since, flare = prayed && q < 1.4 ? 1 - q / 1.4 : 0, low = prayed && q >= 1.4;
  const top = fy - 92, ny = fy - 46;   // the niche's floor
  // the vane: tapered to a point in the floor, broad at the top, cut in barbs; the shaft down its middle
  const vw = (y) => { const q2 = (y - top) / (fy - top); return Math.round(3 + 10 * Math.sin(clamp(q2 * 1.25) * Math.PI) ** 0.7 * (1 - 0.6 * q2)); };
  for (let y = top; y < fy; y++) {
    const w = vw(y);
    for (let x = cx - w; x <= cx + w; x++) {
      const u = (x - cx) / Math.max(1, w), barb = ((y + Math.abs(x - cx) * 0.8) | 0) % 4 === 0, inNiche = y > ny - 22 && y <= ny && Math.abs(x - cx) < 6;
      if (inNiche) continue;
      let v = 0.14 + 0.32 * clamp(-u * 0.7 + 0.4) * (u < 0 ? 1 : 0.6);
      if (barb) v -= 0.08; if (x === cx || x === cx - 1) v = x === cx - 1 ? 0.66 : 0.28;
      if (Math.abs(x - cx) === w && u < 0) v = 0.82;
      put(x, y, v, M_STONE);
    }
  }
  // the broken halo painted on the feather above the niche, in umber
  brokenHalo(cx + 0.5, ny - 30.5, 5, 0.86, M_UMBER, t, { w: 1, spark: false });
  // the niche: cut into the vane, its edges lit; a small stone altar with the green flame; a bell on a bracket
  for (let y = ny - 22; y <= ny; y++) { put(cx - 6, y, 0.04, M_STONE); put(cx + 6, y, 0.62, M_STONE); }
  for (let x = cx - 6; x <= cx + 6; x++) put(x, ny - 22, 0.04, M_STONE);
  for (let y = ny - 21; y <= ny; y++) for (let x = cx - 5; x <= cx + 5; x++) put(x, y, 0.03 + 0.03 * vnoise(x / 2, y / 2, 1301), M_STONE);
  rect(cx - 4, ny - 5, 9, 5, (x, y) => (y === ny - 5 ? 0.66 : 0.28 + 0.2 * clamp((cx + 4 - x) / 9)), M_STONE);
  const fh = low ? 2 : 4 + Math.round(flare * 4);
  for (let k = 0; k < fh; k++) { const w = Math.max(0, 2 - Math.floor(k / 2)), jit = hash(Math.floor(t * 12), k, 1302) > 0.7 ? 1 : 0; for (let i = -w; i <= w; i++) put(cx + i + (k > 1 ? jit : 0), ny - 6 - k, (1 - k / (fh + 1)) * (i === 0 ? 1 : 0.8), M_MOSS, 1); }
  L({ x: cx, y: ny - 9, r: low ? 26 : 46 + 30 * flare, i: (low ? 0.35 : 0.7) + 0.6 * flare, c: [0.7, 1.3, 0.85] });
  // the bell on its bracket: it sways; prayed, it swings and rings (the rings go out)
  line(cx + 5, ny - 19, cx + 1, ny - 19, 0.7, M_STONE);
  const sw = Math.sin(t * 2.2) * 0.25 + (prayed && q < 2 ? Math.sin(q * 14) * 0.7 * (1 - q / 2) : 0), bx = cx + 1 + Math.round(Math.sin(sw) * 3), by = ny - 16;
  line(cx + 1, ny - 19, bx, by - 2, 0.6, M_STONE);
  poly([[bx - 2, by - 2], [bx + 2, by - 2], [bx + 3, by + 2], [bx - 3, by + 2]], (x) => 0.3 + 0.4 * clamp((bx + 3 - x) / 6), M_STONE); put(bx, by + 3, 0.7, M_STONE);
  if (prayed && q < 1.6) for (let r = 0; r < 2; r++) { const R = 4 + (q * 26 + r * 8) % 22; if (R > 4) for (let a = 0; a < 40; a++) { const an = a / 40 * 6.283, x = Math.round(bx + Math.cos(an) * R), y = Math.round(by + Math.sin(an) * R * 0.6); if (lgB(x, y) < 0.9 * (1 - q / 1.6)) CFX.push(() => pfx(x, y, 0.8, M_STONE, 1)); } }
  // rust running from the cuts
  for (const [x, y, l] of [[cx - 7, ny - 14, 7], [cx + 7, ny - 8, 9], [cx - 3, ny + 6, 6]]) for (let j = 0; j < l; j++) put(x, y + j, 0.42 + 0.14 * hash(j, x, 1303), M_UMBER);
  // votive candle stubs and bronze offerings at its foot
  for (const [x, h, sd] of [[cx - 12, 3, 1310], [cx - 8, 2, 1311], [cx + 9, 4, 1312]]) { const f = candleStub(x, fy, h, t, sd); L({ x: f[0], y: f[1], r: 16, i: 0.4, c: WARM }); }
  for (const [x, w] of [[cx - 16, 3], [cx + 13, 4]]) rect(x, fy - 2, w, 2, (xx) => (xx === x ? 0.78 : 0.5), M_UMBER);
}

// ---------------------------------------------------------------- the Pilgrim: an old man with a staff and a vow
function curioPilgrim(cx, fy, t, s, L) {
  const sworn = s.done === 'pilgrim', q = s.since;
  if (sworn && q > 3.2) return;   // he walked on
  const walk = sworn && q > 1.4 ? (q - 1.4) : 0, X = cx + Math.round(walk * 14), fade = walk > 1.2 ? 1 - (walk - 1.2) / 0.6 : 1;
  if (fade <= 0) return;
  const bow = sworn && q < 1.4 ? Math.sin(clamp(q / 1.4) * Math.PI) : 0, sway = Math.sin(t * 1.3) * 0.8, Y = fy, hb = Math.round(bow * 3);
  const step = walk ? Math.floor(walk * 6) & 1 : 0;
  dissolve(X - 20, Y - 60, X + 16, Y + 1, fade, () => {
  // the staff: tall, topped with a small iron broken halo hung with tokens and a lantern
  const sx = X - 10 + Math.round(sway), stop = Y - 50;
  for (let y = stop; y < Y; y++) { put(sx, y, 0.56, M_UMBER); put(sx + 1, y, 0.3, M_UMBER); }
  brokenHalo(sx + 1, stop - 3, 3, 0.8, M_STONE, t, { w: 1, spark: false });
  for (const [dx, l] of [[-2, 3], [3, 4]]) { for (let j = 1; j <= l; j++) put(sx + dx, stop - 1 + j, 0.6, M_UMBER); put(sx + dx, stop + l + 1, 0.86, M_UMBER); }
  const ls = Math.sin(t * 2.4) * 2, lx = sx - 4 + Math.round(ls), ly = stop + 6;
  line(sx - 1, stop + 1, lx + 2, ly - 1, 0.5, M_STONE); cageLantern(lx, ly, 0.9);
  const lf = sworn && q > 0.6 && q < 1.2 ? 1 : 0;
  L({ x: lx + 2, y: ly + 3, r: 34 + lf * 40, i: (0.65 + lf * 0.7) * fade, c: WARM });
  // the bundle on his back
  ellipse(X + 6.5, Y - 30 + hb, 5, 6, (x) => 0.22 + 0.2 * clamp((X + 11 - x) / 10), M_UMBER); line(X + 2, Y - 36 + hb, X + 8, Y - 24 + hb, 0.4, M_UMBER);
  // the patched travelling cloak, stooped
  const CL = [[X - 3, Y - 40 + hb], [X + 6, Y - 38 + hb], [X + 9, Y - 2], [X + 4, Y], [X - 1, Y - 1], [X - 6, Y], [X - 7, Y - 22 + hb]];
  poly(CL, (x, y) => 0.18 + 0.32 * clamp((X + 9 - x) / 16) - ((x * 2 + y) % 9 === 0 ? 0.06 : 0), M_DUSK); litEdges(CL, 0.62, 0.06, M_DUSK);
  for (const [px, py] of [[X + 2, Y - 16], [X - 3, Y - 8]]) { rect(px, py, 4, 3, (x) => (x === px ? 0.5 : 0.34), M_UMBER); put(px + 1, py - 1, 0.6, M_UMBER); put(px + 3, py + 3, 0.6, M_UMBER); }   // the patches, stitched
  // rag-wrapped feet
  for (const [fx, d] of [[X - 4 + (step ? 1 : 0), 1], [X + 3 - (step ? 1 : 0), 0.7]]) { rect(fx - 2, Y - 2, 5, 2, (x) => (x < fx ? 0.72 * d : 0.5 * d), M_UMBER); }
  // the deep hood, the gaunt face, pale eyes (a man's, not crimson)
  const hx = X - 3, hy = Y - 44 + hb + (bow > 0.3 ? 2 : 0);
  poly([[hx - 5, hy + 7], [hx - 6, hy - 2], [hx - 1, hy - 7], [hx + 5, hy - 5], [hx + 7, hy + 4], [hx + 4, hy + 8]], (x) => 0.2 + 0.32 * clamp((hx + 7 - x) / 13), M_DUSK);
  ellipse(hx - 1.5, hy + 1.5, 3, 3.6, (x) => 0.36 + 0.3 * clamp((hx + 1 - x) / 5), M_UMBER);
  put(hx - 3, hy + 1, 0.92, M_STONE); put(hx - 1, hy + 1, 0.86, M_STONE); line(hx - 3, hy + 4, hx - 1, hy + 4, 0.2, M_UMBER);
  // the near arm holding out the scroll with its wax seal (the vow), the iron penance chain at the wrist
  const ax = hx - 7, ay = Y - 30 + hb;
  limb(X - 1, Y - 36 + hb, ax + 2, ay, 3, 2.6, 0.08, 0.3, M_DUSK);
  chainLinks([[ax + 2, ay - 2], [ax + 3, ay + 3], [ax + 6, ay + 5]], 0.75);
  if (!(sworn && q > 1.0)) {
    rect(ax - 5, ay - 3, 6, 8, (x, y) => (y === ay - 3 || y === ay + 4 ? 0.62 : 0.88 - 0.1 * ((y - ay) & 1)), M_UMBER);
    const sealed = sworn && q > 0.5; ellipse(ax - 1.5, ay + 4.5, 1.8, 1.8, sealed ? 0.8 : 0.55, M_DANGER, 0); if (sealed) put(ax - 2, ay + 4, 0.9, M_UMBER);
  }
  });   // he walks on into the dark, dithering out
}

// ---------------------------------------------------------------- the Supply Cart: the Church's, nobody with it
function curioSupply(cx, fy, t, s, L) {
  const eaten = s.done === 'supply', x0 = cx - 23, x1 = cx + 23, bed = fy - 13;
  // the traces lying on the floor
  line(x0 - 2, bed + 3, x0 - 18, fy - 1, 0.5, M_UMBER); line(x0 - 2, bed + 5, x0 - 17, fy, 0.28, M_UMBER);
  // the lantern on its pole at the back corner
  for (let y = bed - 38; y < bed; y++) { put(x1 - 2, y, 0.56, M_UMBER); put(x1 - 1, y, 0.28, M_UMBER); }
  line(x1 - 2, bed - 38, x1 - 7, bed - 38, 0.56, M_UMBER); cageLantern(x1 - 9, bed - 35, 0.95);
  L({ x: x1 - 7, y: bed - 32, r: 64, i: 0.8, c: WARM });
  // the barrel at the back with its tap (it drips; faster once the party has had their fill)
  const br = [x1 - 14, bed - 20];
  rect(br[0], br[1], 9, 14, (x, y) => plankV(x, y, br[0], 9, 1402) + 0.06 * Math.sin(((x - br[0]) / 8) * Math.PI), M_UMBER);
  for (const yy of [br[1] + 2, br[1] + 11]) rect(br[0], yy, 9, 1, (x) => (x < br[0] + 3 ? 0.9 : 0.5), M_STONE);
  ellipse(br[0] + 4.5, br[1], 4.5, 1.2, 0.56, M_UMBER);
  rect(br[0] - 2, br[1] + 8, 3, 2, (x) => (x === br[0] - 2 ? 0.9 : 0.5), M_STONE);
  const dripT = (t * (eaten ? 1.8 : 0.6)) % 1;
  if (dripT < 0.85) CFX.push(() => pfx(br[0] - 2, br[1] + 10 + Math.round(dripT * 6), 0.8, M_UMBER, 1));
  if (eaten) ellipse(br[0] - 2, bed - 0.5, 3, 0.8, 0.5, M_UMBER);   // a puddle under the tap, left open
  // the bed of the cart: planks, iron fittings
  rect(x0, bed - 6, x1 - x0, 6, (x, y) => (y === bed - 6 ? 0.62 : plankV(x, y, x0, x1 - x0, 1401)), M_UMBER);
  for (const bx of [x0, x0 + 15, x1 - 16, x1 - 2]) { for (let y = bed - 6; y < bed; y++) put(bx, y, 0.8, M_STONE); put(bx, bed - 4, 1, M_STONE); }
  // the sacks, the cheese wheel, the loaves
  for (const [sx2, sy, r] of [[x0 + 17, bed - 11, 5.5], [x0 + 27, bed - 10, 5]]) { ellipse(sx2 + 0.5, sy + 0.5, r, r - 0.5, (x, y) => 0.5 + 0.34 * clamp((sx2 + r - x) / (2 * r)) - 0.12 * clamp((y - sy) / r), M_UMBER); line(sx2 - 1, sy - r + 1, sx2 + 1, sy - r - 1, 0.7, M_UMBER); put(sx2, sy - r, 0.4, M_UMBER); }
  const ch = [x0 + 22, bed - 18];
  // (the cheese in umber's pale highs, a darker rind: gold is only for loot)
  ellipse(ch[0] + 0.5, ch[1] + 0.5, 6, 3.4, (x, y) => (y < ch[1] - 1 ? 0.9 : 0.66 - 0.22 * clamp((x - ch[0]) / 6)), M_UMBER);
  rect(ch[0] - 5, ch[1] + 1, 11, 1, 0.46, M_UMBER);
  if (eaten) { poly([[ch[0] + 1, ch[1] - 1], [ch[0] + 7, ch[1] - 3], [ch[0] + 7, ch[1] + 3], [ch[0] + 2, ch[1] + 2]], (x, y) => (x === ch[0] + 1 ? 0.98 : 0.92), M_UMBER); poly([[ch[0] + 2, ch[1]], [ch[0] + 6, ch[1] - 2], [ch[0] + 6, ch[1] + 2]], 0.04, M_DUSK); }   // a wedge cut out, its face pale
  const loaves = eaten ? [[x0 + 30, bed - 17]] : [[x0 + 13, bed - 17], [x0 + 30, bed - 17], [x0 + 26, bed - 20]];
  for (const [lx, ly] of loaves) { ellipse(lx + 0.5, ly + 0.5, 3.6, 2.1, (x, y) => (y < ly ? 0.86 : 0.58) - 0.12 * clamp((x - lx) / 4), M_UMBER); for (const d of [-1, 1]) put(lx + d, ly - 1, 0.95, M_UMBER); }
  if (eaten) { ellipse(x0 + 13.5, bed - 16.5, 2.2, 1.6, (x, y) => (y < bed - 17 ? 0.8 : 0.5), M_UMBER); put(x0 + 13, bed - 16, 0.92, M_UMBER); for (const [x, y] of [[x0 + 9, bed - 7], [x0 + 11, bed - 8], [x0 + 18, bed - 7], [x0 + 20, bed - 8]]) put(x, y, 0.8, M_UMBER); }   // a torn crust, crumbs
  // the waxed canvas drawn back and bunched at the front end, the halo stencilled on its flap
  const CV = [[x0 - 2, bed - 6], [x0 - 1, bed - 15], [x0 + 3, bed - 21], [x0 + 9, bed - 22], [x0 + 12, bed - 17], [x0 + 11, bed - 6]];
  poly(CV, (x, y) => 0.42 + 0.3 * clamp((x0 + 12 - x) / 14) - ((x * 2 + y) % 6 === 0 ? 0.08 : 0), M_UMBER); litEdges(CV, 0.9, 0.2, M_UMBER);
  for (const [ax, ay, bx2, by2] of [[x0 + 2, bed - 19, x0 + 4, bed - 7], [x0 + 7, bed - 21, x0 + 7, bed - 7], [x0 + 10, bed - 17, x0 + 9, bed - 7]]) line(ax, ay, bx2, by2, 0.3, M_UMBER);   // its folds
  rect(x0 - 3, bed - 6, 15, 6, (x, y) => 0.5 + 0.26 * clamp((x0 + 12 - x) / 15) - (y === bed - 1 ? 0.14 : 0), M_UMBER);   // the flap hanging over the side
  brokenHalo(x0 + 4.5, bed - 3, 2.6, 0.2, M_UMBER, t, { w: 1, spark: false });
  for (let x = x0 - 3; x < x0 + 12; x += 2) put(x, bed, 0.36, M_UMBER);   // its ragged hem
  // the two iron-rimmed wheels
  for (const wx of [x0 + 9, x1 - 10]) {
    ellipse(wx, bed + 3, 7, 7, 0.3, M_UMBER); ellipse(wx, bed + 3, 5.5, 5.5, 0.05, M_DUSK);
    for (let a = 0; a < 6; a++) line(wx, bed + 3, wx + Math.cos(a * 1.047 + 0.4) * 5, bed + 3 + Math.sin(a * 1.047 + 0.4) * 5, 0.5, M_UMBER);
    for (let a = 0; a < 60; a++) { const an = a / 60 * 6.283; put(Math.round(wx - 0.5 + Math.cos(an) * 7), Math.round(bed + 2.5 + Math.sin(an) * 7), Math.cos(an + 2.4) > 0 ? 0.92 : 0.36, M_STONE); }
    ellipse(wx, bed + 3, 1.5, 1.5, 0.9, M_STONE);
  }
}

// ---------------------------------------------------------------- the Blood Altar: a slab of an iron angel's breastplate
function curioAltar(cx, fy, t, s, L) {
  const bled = s.done === 'altar', q = s.since, pulse = 0.5 + 0.5 * Math.sin(t * (bled ? 2.6 : 1.1));
  const glow = bled ? 0.62 + 0.34 * pulse : 0.2 + 0.16 * pulse, x0 = cx - 18, x1 = cx + 18, sy = fy - 22;
  // the block of black stone, its front face and a lit top edge
  const BK = [[x0 + 2, sy + 4], [x1 - 2, sy + 4], [x1 - 1, fy], [x0 + 1, fy]];
  poly(BK, (x, y) => 0.1 + 0.16 * clamp((x1 - x) / 36) + 0.05 * (vnoise(x / 3, y / 2, 1501) - 0.5) - (((y - sy) % 6 === 0) ? 0.04 : 0), M_DUSK); litEdges(BK, 0.42, 0.04, M_DUSK);
  for (const [x, y] of [[x0 + 6, sy + 12], [x1 - 9, sy + 9], [x0 + 12, fy - 4]]) line(x, y, x + 3, y + 2, 0.04, M_DUSK);   // cracks
  // old blood run down the block's front from the middle channel (bright while it is fed)
  for (let y = sy + 6; y < fy - 4; y++) { const w = y > fy - 10 ? 1 : 0; for (let i = 0; i <= w; i++) put(cx + i, y, 0.32 + 0.5 * glow, M_DANGER, glow > 0.5 ? 1 : 0); }
  // the slab cut from the breastplate: a curved iron face with its thick edge, the channels cut in it
  const SL = [[x0 - 1, sy + 4], [x0 + 2, sy - 1], [cx, sy - 3], [x1 - 2, sy - 1], [x1 + 1, sy + 4], [x1, sy + 6], [x0, sy + 6]];
  rimPoly(SL, 1); poly(SL, (x, y) => (y >= sy + 4 ? 0.3 + 0.3 * clamp((x1 - x) / 36) : 0.28 + 0.44 * clamp((x1 - x) / 36) ** 1.2), M_STONE); litEdges(SL, 0.95, 0.06, M_STONE);
  rivets(x0 + 2, sy + 5, x1 - 2, sy + 5, 8, 1);
  const ch = [[[cx - 14, sy + 1], [cx - 7, sy + 1], [cx - 1, sy + 3]], [[cx + 14, sy + 1], [cx + 7, sy + 1], [cx + 1, sy + 3]], [[cx - 10, sy - 1], [cx - 4, sy], [cx, sy + 3]], [[cx + 10, sy - 1], [cx + 4, sy], [cx, sy + 3]]];
  for (const path of ch) for (let k = 1; k < path.length; k++) { const [ax, ay] = path[k - 1], [bx, by] = path[k], n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay))); for (let j = 0; j <= n; j++) { const x = Math.round(lerp(ax, bx, j / n)), y = Math.round(lerp(ay, by, j / n)), lit = lgB(x, y) < glow + 0.15; put(x, y, lit ? 0.55 + 0.45 * glow : 0.26, M_DANGER, lit ? 1 : 0); } }
  // the basin at its foot (it fills once fed)
  ellipse(cx + 0.5, fy - 1.5, 6, 2.4, (x, y) => (y < fy - 2 ? 0.82 : 0.36), M_STONE); ellipse(cx + 0.5, fy - 1.5, 4.4, 1.3, bled ? 0.5 + 0.45 * glow : 0.22, M_DANGER, bled ? 1 : 0);
  if (bled) for (let k = 0; k < 4; k++) { const p = ((q * 0.7 + k / 4) % 1), x = k & 1 ? cx + Math.round(lerp(13, 1, p)) : cx - Math.round(lerp(13, 1, p)), y = k < 2 ? sy + 1 + Math.round(p * 2) : sy + 6 + Math.round(p * (fy - sy - 9)); put(k < 2 ? x : cx, y, 1, M_DANGER, 1); }   // drops run along the channels and down into it
  L({ x: cx, y: sy + 2, r: 34, i: 0.25 + 0.6 * glow, c: [1.6, 0.5, 0.55] });
  // the curved blade lying on it, its hilt wrapped
  for (let k = 0; k < 12; k++) { const x = x0 + 4 + k, y = sy - 3 - Math.round(Math.sin(k / 11 * Math.PI) * 2); put(x, y, 0.98 - k * 0.03, M_STONE); put(x, y + 1, 0.36, M_STONE); }
  rect(x0, sy - 3, 4, 2, (x) => (x === x0 ? 0.7 : 0.46), M_UMBER);
  // black candles at its ends, on iron dishes
  for (const [x, h, sd] of [[x0 - 4, 12, 1510], [x0 - 8, 8, 1511], [x1 + 3, 11, 1512], [x1 + 7, 7, 1513]]) { rect(x - 1, fy - 1, 4, 1, 0.66, M_STONE); const f = candleStub(x, fy - 1, h, t, sd, { black: true }); L({ x: f[0], y: f[1], r: 22, i: 0.45, c: WARM }); }
}

// ---------------------------------------------------------------- the Moonwell: a fallen angel's great helm, face up
// The helm lies on its back half sunk in the floor: its riveted crown-band and the cross of its eye-slits face us, its
// open face is the well, full of still silver water; a torn crest-fin stands up behind; the moon's beam falls in.
function curioMoonwell(cx, fy, t, s, L) {
  const drank = s.done === 'moonwell', q = s.since, rip = drank && q < 3 ? 1 - q / 3 : 0;
  const rx = 21, ry = 5, wy = fy - 14, bx = 25;   // the pool, the helm's half-width
  L({ beam: true, x: cx + 26, y: 0, x1: cx + 2, y1: wy, w: 15, i: drank ? 0.42 : 0.58, air: 0.05, c: COLD, r: 1 });
  // the torn crest-fin behind, standing up out of the floor
  const FN = [[cx + 9, wy - 3], [cx + 13, wy - 24], [cx + 17, wy - 30], [cx + 18, wy - 22], [cx + 21, wy - 26], [cx + 22, wy - 4]];
  rimPoly(FN, 1); poly(FN, (x, y) => 0.18 + 0.3 * clamp((cx + 22 - x) / 13) - ((y + x) % 4 === 0 ? 0.06 : 0), M_STONE); litEdges(FN, 0.86, 0.08, M_STONE);
  for (let j = 0; j < 6; j++) put(cx + 15, wy - 20 + j * 3, 0.5, M_UMBER);
  // the helm's bulk above the floor: a squat barrel, lit from the upper left
  for (let y = wy - 2; y <= fy; y++) for (let x = cx - bx; x <= cx + bx; x++) {
    const u = (x - cx) / bx, bulge = Math.sqrt(Math.max(0, 1 - u * u)); if (y > fy - 1 + bulge * 1.5 - 1.5 && y > wy + 2 && Math.abs(u) > 0.98) continue;
    let v = 0.16 + 0.42 * clamp(-u * 0.6 + 0.5) * (0.6 + 0.4 * bulge) - 0.1 * clamp((y - wy) / (fy - wy));
    const band = y === wy + 2 || y === wy + 3; if (band) v += 0.2;
    if (Math.abs(x - cx) <= 0 && y > wy + 3) v = 0.7;   // the ridge down its middle
    const moss = y > fy - 3 && vnoise(x / 3, y / 2, 1601) > 0.55;
    put(x, y, moss ? 0.32 + 0.22 * vnoise(x, y, 1602) : v, moss ? M_MOSS : M_STONE);
  }
  rivets(cx - bx + 3, wy + 2, cx + bx - 3, wy + 2, 10, 0.98);
  // the eye-slits: a cross, and the breaths punched in the near cheek
  rect(cx - 13, wy + 6, 26, 2, (x) => (x < cx ? 0.02 : 0.05), M_DUSK); rect(cx - 13, wy + 8, 26, 1, 0.5, M_STONE);
  rect(cx - 1, wy + 4, 2, 9, 0.02, M_DUSK);
  for (const [x, y] of [[cx + 7, wy + 10], [cx + 10, wy + 10], [cx + 13, wy + 10], [cx + 8, wy + 12], [cx + 11, wy + 12]]) { put(x, y, 0.03, M_DUSK); put(x, y + 1, 0.5, M_STONE); }
  for (const [x, y, l] of [[cx - 10, wy + 9, 4], [cx + 16, wy + 7, 5], [cx - 18, wy + 4, 6]]) for (let j = 0; j < l; j++) put(x, y + j, 0.5 + 0.08 * j, M_UMBER);   // rust
  // the rim of the open face, lit on its far edge, and the still silver water in it
  for (let a = 0; a < 150; a++) { const an = a / 150 * 6.283, x = Math.round(cx + Math.cos(an) * (rx + 1)), y = Math.round(wy + Math.sin(an) * (ry + 1)); put(x, y, Math.sin(an) < 0 ? 0.92 : 0.5, M_STONE); }
  for (let y = wy - ry; y <= wy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
    const e = ((x - cx) / rx) ** 2 + ((y - wy) / ry) ** 2; if (e > 1) continue;
    const r = Math.sqrt(e);
    let v = 0.5 + 0.2 * (1 - r) + 0.08 * Math.sin(r * 14 - t * 1.4);
    if (rip) v += 0.28 * rip * Math.sin(r * 22 - q * 9);
    // the moon's reflection: a pale oval that wobbles, broken up when drunk from
    const mx = cx + 6 + Math.round(Math.sin(t * 0.9) * (1 + rip * 3)), my = wy - 1, md = Math.hypot((x - mx) / 4.5, (y - my) / 1.7);
    const moon = md < 1 && (!rip || hash(x, Math.floor(q * 10), 1603) > rip * 0.7);
    put(x, y, moon ? 1 : v, M_STONE, moon ? 1 : 0);
  }
  // a dipper on a chain at the rim
  chainLinks(sag(cx - rx + 1, wy - 1, cx - bx - 5, fy - 2, 3, 8), 0.8);
  rect(cx - bx - 10, fy - 3, 5, 3, (x, y) => (x === cx - bx - 10 || y === fy - 3 ? 0.86 : 0.42), M_STONE); line(cx - bx - 5, fy - 3, cx - bx - 2, fy - 7, 0.6, M_UMBER);
  L({ x: cx + 5, y: wy, r: 36, i: drank ? 0.4 : 0.6, c: COLD });
}

// ---------------------------------------------------------------- the Ritual Circle: the serpent cult's, on the floor
function curioRitual(cx, fy, t, s, L) {
  const joined = s.done === 'ritual', q = s.since, flare = joined ? (q < 1.5 ? 1 : 0.6) : 0, rx = 26, ry = 6, ry0 = fy - 4;
  const VIO = [1.0, 0.75, 1.6];
  CFX.push(() => {
  // the crimson-ink ring (it glows once joined), the serpent painted round it biting its tail, its scales in darker ink
  for (let a = 0; a < 200; a++) {
    const an = a / 200 * 6.283, x = Math.round(cx + Math.cos(an) * rx), y = Math.round(ry0 + Math.sin(an) * ry);
    pfloor(x, y, joined ? 0.62 + 0.3 * Math.sin(t * 3 + a * 0.2) : 0.62, M_DANGER, joined ? 1 : 0);
    const sx2 = Math.round(cx + Math.cos(an) * (rx + 2)), sy2 = Math.round(ry0 + Math.sin(an) * (ry + 1.5)), back = Math.sin(an) < 0;
    pfloor(sx2, sy2, (a % 6 < 3 ? 0.5 : 0.3) * (back ? 0.8 : 1), M_DANGER, 0); if (a % 6 === 0) pfloor(sx2, sy2 + 1, 0.22, M_DANGER, 0);
  }
  { const hx = Math.round(cx + rx + 3), hy = ry0 - 1; for (const [x, y] of [[hx - 2, hy - 1], [hx - 1, hy - 1], [hx, hy - 1], [hx + 1, hy - 2], [hx + 2, hy - 1], [hx + 3, hy], [hx - 2, hy], [hx - 1, hy], [hx, hy], [hx + 1, hy], [hx + 2, hy], [hx - 1, hy + 1], [hx, hy + 1], [hx + 1, hy + 1]]) pfloor(x, y, 0.5, M_DANGER, 0); pfloor(hx + 1, hy - 1, 0.95, M_STONE, 0); pfloor(hx - 3, hy, 0.4, M_DANGER, 0); }   // its head, a pale eye
  // sigils inked inside
  for (let k = 0; k < 6; k++) { const an = k / 6 * 6.283 + 0.3, x = Math.round(cx + Math.cos(an) * rx * 0.6), y = Math.round(ry0 + Math.sin(an) * ry * 0.55); pfloor(x, y, 0.6, M_DANGER, joined ? 1 : 0); pfloor(x + 1, y, 0.46, M_DANGER, 0); pfloor(x, y - 1, 0.4, M_DANGER, 0); }
  });
  // skulls at two points of the ring
  for (const x of [cx - rx + 5, cx + 12]) { ellipse(x + 0.5, ry0 - 3.5, 3, 2.8, (xx, yy) => 0.66 + 0.3 * clamp((x + 1 - xx) / 5) - (yy > ry0 - 3 ? 0.14 : 0), M_UMBER); put(x - 1, ry0 - 3, 0.04, M_DUSK); put(x + 1, ry0 - 3, 0.04, M_DUSK); rect(x - 1, ry0 - 1, 3, 1, 0.5, M_UMBER); }
  // the censer on its stand, breathing violet smoke
  const st = [cx - 3, ry0 - 1];
  for (let y = st[1] - 26; y < st[1]; y++) { put(st[0], y, 0.66, M_STONE); put(st[0] + 1, y, 0.28, M_STONE); }
  line(st[0] - 5, st[1] + 1, st[0], st[1] - 4, 0.6, M_STONE); line(st[0] + 6, st[1] + 1, st[0] + 1, st[1] - 4, 0.34, M_STONE); line(st[0], st[1] + 2, st[0], st[1] - 2, 0.5, M_STONE);
  ellipse(st[0] + 0.5, st[1] - 28.5, 3.6, 3, (x, y) => (y < st[1] - 29 ? 0.9 : 0.5) + 0.06 * clamp((st[0] + 3 - x) / 6), M_UMBER); rect(st[0] - 3, st[1] - 31, 8, 1, 0.8, M_UMBER);
  put(st[0], st[1] - 30, 1, M_MAGIC, 1); put(st[0] + 2, st[1] - 30, 0.8, M_MAGIC, 1);
  CFX.push(() => {
  const n = joined ? 22 : 10;
  for (let k = 0; k < n; k++) { const p = (t * 0.35 + k / n) % 1, x = st[0] + Math.sin(p * 7 + k) * (2 + p * 4) + p * 5, y = st[1] - 32 - p * 36; pfx(Math.round(x), Math.round(y), 0.9 - p * 0.55, M_MAGIC, 1); if (p < 0.4) pfx(Math.round(x) + 1, Math.round(y), 0.7 - p, M_MAGIC, 1); }
  });
  // sigils rising out of the ring: a few, thick once joined
  CFX.push(() => {
  const ns = joined ? 12 : 4;
  for (let k = 0; k < ns; k++) { const p = (t * 0.22 + k / ns) % 1, x = Math.round(cx - rx * 0.7 + ((k * 37) % Math.round(rx * 1.4))), y = Math.round(ry0 - 3 - p * 50); if (lgB(x, y) < (1 - p) * 0.95) { pfx(x, y, 0.85, M_MAGIC, 1); pfx(x + 1, y - 1, 0.65, M_MAGIC, 1); pfx(x - 1, y - 1, 0.65, M_MAGIC, 1); pfx(x, y - 2, 0.55, M_MAGIC, 1); } }
  });
  // black candles at its points on the ring: warm flames, violet once joined (they flare)
  for (const [k, h] of [[0, 12], [1, 8], [2, 14], [3, 10], [4, 7]]) {
    const an = k / 5 * 6.283 - 1.2, x = Math.round(cx + Math.cos(an) * rx), y = Math.round(ry0 + Math.sin(an) * ry);
    rect(x - 1, y, 4, 1, 0.5, M_STONE);
    const f = candleStub(x, y, h, t, 1700 + k, { black: true, violet: joined, flare: joined && q < 1.5 });
    L({ x: f[0], y: f[1], r: joined ? 30 : 20, i: joined ? 0.6 : 0.42, c: joined ? VIO : WARM });
  }
  L({ x: st[0], y: st[1] - 30, r: 30 + 34 * flare, i: 0.35 + 0.45 * flare, c: VIO });
  if (joined) L({ x: cx, y: ry0, r: 40, i: 0.45, c: [1.6, 0.5, 0.55] });   // the ring's glow
}

// ---------------------------------------------------------------- the Guild bank vault: a round door of angel iron, ajar
function curioBank(cx, fy, t, s, L) {
  const took = s.done === 'withdraw', closed = s.done === 'leave', q = s.since;
  const dcx = cx + 4, dcy = fy - 22, R = 18;
  // the broken stretch of wall it is set in
  const W0 = [[cx - 26, fy], [cx - 25, fy - 30], [cx - 18, fy - 38], [cx - 6, fy - 45], [cx + 10, fy - 47], [cx + 22, fy - 40], [cx + 27, fy - 30], [cx + 28, fy]];
  poly(W0, (x, y) => 0.16 + 0.24 * clamp((cx + 28 - x) / 54) + (((y >> 2) + (x >> 3)) % 2 === 0 && (y & 3) === 0 ? -0.06 : 0) + 0.04 * (vnoise(x / 4, y / 4, 1801) - 0.5), M_STONE); litEdges(W0, 0.5, 0.04, M_STONE, [0]);
  // the vault's mouth: shelves inside with items glowing in their rarity light
  for (let y = dcy - R + 2; y <= dcy + R - 2; y++) for (let x = dcx - R + 2; x <= dcx + R - 2; x++) if (Math.hypot(x - dcx, y - dcy) < R - 2) put(x, y, 0.02 + ((y - dcy + 40) % 9 === 0 ? 0.24 : 0), M_DUSK);
  const items = [[dcx - 6, dcy - 7, M_MAGIC], [dcx + 2, dcy - 7, M_LOOT], [dcx - 3, dcy + 2, M_MOSS], [dcx + 6, dcy + 2, M_STONE], [dcx - 8, dcy + 2, M_MAGIC]];
  const gone = took ? 1 : 0;
  // the door: closed, or ajar (wider once something is taken), its wheel lock the broken halo
  const ajar = closed ? 0 : took ? 0.55 + 0.25 * smoothQ(clamp(q / 0.8)) : 0.55 + 0.02 * Math.sin(t * 0.8);
  if (ajar > 0) items.forEach(([x, y, m], k) => { if (k < gone) return; const g = 0.75 + 0.25 * Math.sin(t * 2 + k); rect(x, y - 2, 3, 3, g, m, 1); put(x + 1, y - 3, 0.95, m, 1); if (x > dcx - R * (1 - ajar) - 2) L({ x: x + 1, y: y - 1, r: 14, i: 0.4, c: m === M_LOOT ? WARM : m === M_MOSS ? [0.7, 1.3, 0.85] : [1.0, 0.8, 1.6] }); });
  const dw = Math.round(R * 2 * (1 - ajar)), dx0 = dcx - R;   // the door swung toward us, hinged at its left
  if (dw > 2) {
    for (let y = dcy - R; y <= dcy + R; y++) for (let x = dx0; x < dx0 + dw; x++) {
      const u = (x - dx0) / Math.max(1, dw), ex = dcx + (u - 0.5) * 2 * R; if (Math.hypot(ex - dcx, y - dcy) > R) continue;
      let v = 0.22 + 0.4 * clamp(1 - u) ** 1.1; if (Math.abs(Math.hypot(ex - dcx, y - dcy) - R) < 1.2) v = u < 0.5 ? 0.86 : 0.3;
      put(x, y, v, M_STONE);
    }
    const wx = dx0 + Math.round(dw / 2), wy = dcy;
    brokenHalo(wx + 0.5, wy + 0.5, Math.max(2, Math.round(7 * dw / (2 * R))), 0.84, M_STONE, t, { w: 2, gap: 0.7 });
    for (let k = 0; k < 4; k++) { const an = k * 1.571 + 0.4; line(wx, wy, wx + Math.cos(an) * 6 * dw / (2 * R), wy + Math.sin(an) * 6, 0.6, M_STONE); }
    rivets(dx0 + 2, dcy - R + 6, dx0 + 2, dcy + R - 6, 6, 0.95);
  }
  // the frame round the mouth, riveted
  for (let a = 0; a < 120; a++) { const an = a / 120 * 6.283; put(Math.round(dcx + Math.cos(an) * R), Math.round(dcy + Math.sin(an) * R), Math.cos(an + 2.4) > 0 ? 0.8 : 0.26, M_STONE); if (a % 12 === 0) put(Math.round(dcx + Math.cos(an) * (R + 1)), Math.round(dcy + Math.sin(an) * (R + 1)), 0.95, M_STONE); }
  // the iron plaque for "officers only"
  rect(dcx - 6, dcy - R - 7, 13, 4, (x, y) => (y === dcy - R - 7 ? 0.8 : 0.36), M_STONE); for (let x = dcx - 4; x < dcx + 5; x += 2) put(x, dcy - R - 5, 0.08, M_STONE);
  // the lectern beside it with the bank log: a great iron-bound ledger on a chain
  const lx = cx - 20;
  for (let y = fy - 20; y < fy; y++) { put(lx, y, 0.46, M_UMBER); put(lx + 1, y, 0.24, M_UMBER); }
  poly([[lx - 6, fy - 24], [lx + 7, fy - 27], [lx + 8, fy - 22], [lx - 5, fy - 19]], (x) => 0.3 + 0.3 * clamp((lx + 8 - x) / 14), M_UMBER);
  rect(lx - 4, fy - 28, 10, 4, (x, y) => (y === fy - 28 ? 0.9 : 0.62), M_UMBER); line(lx - 4, fy - 25, lx + 5, fy - 26, 0.3, M_STONE); put(lx - 4, fy - 28, 0.95, M_STONE); put(lx + 5, fy - 28, 0.7, M_STONE);
  chainLinks(sag(lx + 5, fy - 25, dx0 + 2, dcy + 6, 4, 8), 0.6);
  L({ x: dcx, y: dcy, r: 50, i: closed ? 0.15 : 0.35, c: WARM });
}

// ---------------------------------------------------------------- the Potion cart: the approved cart, in the world
function curioPotionCart(cx, fy, t, s, L) {
  const shaken = s.done === 'potion', q = s.since, rattle = shaken && q < 0.8 ? Math.round(Math.sin(q * 60) * (1 - q / 0.8)) : 0;
  potionCart(cx + rattle, fy, t, { fell: shaken && q > 0.2 });
  // in the world: iron rims on the wheels, the "PAY HERE" plank with the halo burnt in, a coin box chained to it, herbs
  for (const wx of [cx - 13 + rattle, cx + 13 + rattle]) for (let a = 0; a < 50; a++) { const an = a / 50 * 6.283; put(Math.round(wx - 0.5 + Math.cos(an) * 8), Math.round(fy - 8.5 + Math.sin(an) * 8), Math.cos(an + 2.4) > 0 ? 0.9 : 0.3, M_STONE); }
  const px = cx - 36, py = fy - 30;
  for (let y = py + 4; y < fy; y++) put(px + 5, y, 0.4, M_UMBER);
  rect(px, py, 11, 6, (x, y) => (y === py ? 0.66 : 0.36 + 0.14 * clamp((px + 11 - x) / 11)), M_UMBER);
  brokenHalo(px + 5.5, py + 3, 2, 0.06, M_UMBER, t, { w: 1, spark: false });   // burnt in
  rect(cx + 22 + rattle, fy - 7, 6, 5, (x, y) => (x === cx + 22 + rattle || y === fy - 7 ? 0.8 : 0.3), M_STONE); put(cx + 24 + rattle, fy - 6, 0.04, M_DUSK);
  chainLinks([[cx + 21 + rattle, fy - 5], [cx + 17 + rattle, fy - 13]], 0.7);
  for (const [hx, l] of [[cx - 16, 5], [cx - 11, 4], [cx + 6, 6]]) for (let j = 0; j < l; j++) put(hx + rattle + (j & 1), fy - 43 + j, 0.4 + 0.1 * (j & 1), M_MOSS);
  L({ x: cx - 25, y: fy - 36, r: 54, i: 0.75, c: WARM });
  for (const [bx, k] of [[cx - 5, 0], [cx + 3, 1], [cx + 11, 2]]) if ((t * 0.7 + k * 0.33) % 1 < 0.08 && !(k === 2 && shaken)) put(bx + rattle - 2, fy - 42, 1, M_MAGIC, 1);   // the potions' glints
  if (shaken) {
    const fall = clamp((q - 0.2) / 0.5), bx = cx + 11 + Math.round(fall * 6), by = fy - 41 + Math.round(fall * fall * 38);
    if (s.out === 'glass' && fall >= 1) {   // broken glass on the floor
      CFX.push(() => { for (let x = cx + 10; x <= cx + 20; x++) if (Math.abs(x - cx - 15) < 5 - (x & 1)) pfx(x, fy, 0.34, M_MAGIC, 0); for (let k = 0; k < 9; k++) { const x = cx + 14 + Math.round((hash(k, 1, 1901) - 0.5) * 14), y = fy - Math.round(hash(k, 2, 1901) * 2); pfx(x, y, k % 3 ? 0.66 : 0.95, M_MAGIC, k % 3 ? 0 : 1); } });
    } else if (s.out === 'caught' && fall >= 1) {   // a potion caught: it sits upright at the cart's foot, glowing
      rect(cx + 15, fy - 6, 3, 5, 0.75, M_MAGIC, 1); rect(cx + 16, fy - 8, 1, 2, 0.5, M_STONE); L({ x: cx + 16, y: fy - 4, r: 16, i: 0.5, c: [1.0, 0.8, 1.6] });
    } else { rect(bx, by, 3, 5, 0.7, M_MAGIC, 1); rect(bx + 1, by - 2, 1, 2, 0.5, M_STONE); }
  }
}

// ---------------------------------------------------------------- the Abbot asleep on the tithe (foes.js), after a sneak
function curioTroll(cx, fy, t, s, L) {
  abbotAsleep(cx, fy, t, s.done === 'sneak' ? { heap: 22 } : {});
  L({ x: cx + 4, y: fy - 12, r: 50, i: 0.6, c: WARM });   // the gold's glow
  L({ x: cx - 18, y: fy - 50, r: 20, i: 0.5, c: WARM });   // his reliquary candle
}

// the key light on each (the corridor's torchlight, or its own): [dx, dy, r, i, colour] from its feet
const GREEN = [0.75, 1.3, 0.9];
const CURIO_KEY = { strongbox: [-8, -30, 80, 0.9, WARM], mailbox: [-14, -40, 80, 0.7, WARM], shrine: [-16, -60, 90, 0.55, COLD], pilgrim: [-16, -36, 74, 0.6, WARM],
  supply: [-16, -30, 86, 0.6, WARM], altar: [-14, -26, 76, 0.7, WARM], moonwell: [-10, -26, 80, 0.6, COLD], ritual: [-12, -20, 80, 0.55, WARM], bank: [-18, -34, 90, 0.75, WARM] };
const CURIO_DRAW = { strongbox: curioChest, mailbox: curioCoffin, shrine: curioShrine, pilgrim: curioPilgrim, supply: curioSupply, altar: curioAltar, moonwell: curioMoonwell, ritual: curioRitual, bank: curioBank, vending: curioPotionCart, troll: curioTroll };
/** The live corridor (live.js): the curio at (cx, fy) with its state; its lights dimmed once passed. */
function drawCurio(c, cx, fy, t, lights) {
  const fn = CURIO_DRAW[c.id]; if (!fn) return false;
  const dim = !c.passed ? 1 : c.done ? lerp(1, 0.35, clamp((c.since || 0) / 2)) : 0.35;   // the choice's moment shows lit, then it dims as the party walks past
  const L = (l) => lights.push({ ...l, i: l.i * dim });
  MAT = M_STONE; EMI = 0;
  const key = CURIO_KEY[c.id]; if (key) L({ x: cx + key[0], y: fy + key[1], r: key[2], i: key[3], c: key[4] });
  fn(cx, fy, t, { done: c.done || null, out: c.out || null, stage: c.stage || null, k: c.k || 0, since: c.since || 0 }, L);
  MAT = M_STONE; EMI = 0;
  return true;
}
