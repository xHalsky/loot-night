// ===========================================================================
// The floor map as a route choice (handoff 1.5, #52). Every floor end opens the map with 2-3 path cards
// for the next floor (one before a boss); a card shows at most one feature and one condition. The map
// draws the forks; hovering a card inks its road and writes its full text in the margin.
// ===========================================================================
let MAP_STATE = 'three';
const MAP_AWAY_SEC = 5;
const MAP_HIST_XY = [[40, 52], [74, 70], [42, 88], [80, 106]];          // the run so far, the last is "you are here"
const MAP_FORK_XY = { 1: [[160, 104]], 2: [[150, 76], [150, 134]], 3: [[150, 58], [160, 104], [150, 148]] };
const MAP_CARD_X = { 1: [118], 2: [68, 169], 3: [17, 118, 219] };
const CARD_W = 98, CARD_H = 46, CARD_Y = 160;
const MAPITEM = { vault: { name: 'Treasure Vault', r: 'rare', pays: 'No fight. 5 items', cost: 'Noise +30' } };
const PATH_SETS = {
  three: { title: 'Shadow Crypt', sub: 'Floor 7 cleared · choose the way down', floor: 8, hist: [4, 5, 6, 7], safest: 0,
    cards: [{}, { feat: 'moonwell' }, { feat: 'altar', cond: 'dark' }] },
  map: { title: 'Shadow Crypt', sub: 'Floor 2 cleared · choose the way down', floor: 3, hist: [1, 2], safest: 0,
    cards: [{ feat: 'shrine' }, { cond: 'silent' }, { map: 'vault' }] },
  boss: { title: 'Shadow Crypt', sub: 'Floor 9 cleared · the boss waits below', floor: 10, hist: [6, 7, 8, 9], safest: 0,
    cards: [{ cond: 'haunted', boss: true }] },
};
PATH_SETS.away = { ...PATH_SETS.three, away: true };
const PATH_LAYERS = {};

// a fork's curve (the same bend stairRoad draws), for the red route over it
function forkPts(a, b, bend) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const A = [a.x + ux * 10, a.y + uy * 10], Bp = [b.x - ux * 10, b.y - uy * 10], C = [(A[0] + Bp[0]) / 2 - uy * 12 * bend, (A[1] + Bp[1]) / 2 + ux * 12 * bend];
  return { A, Bp, C, L };
}
const forkBend = (n, k) => (n === 1 ? 0.4 : n === 2 ? (k ? 0.5 : -0.5) : [-0.6, 0.3, 0.6][k]);
// a colour icon inked onto the map: outline and dark parts in ink, mid tones as a wash, red and gold kept as red ink and gilding
const LUMC = {};
function lumOf(idx) { if (LUMC[idx] != null) return LUMC[idx]; const h = PAL[idx], r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return (LUMC[idx] = (0.3 * r + 0.55 * g + 0.15 * b) / 255); }
function inkIcon(rows, x, y, faint) {
  const on = (i, j) => { const r = rows[j]; return !!r && i >= 0 && i < r.length && r[i] !== '.' && r[i] !== ' '; };
  rows.forEach((r, j) => [...r].forEach((c, i) => {
    if (!on(i, j)) return;
    const X = x + i, Y = y + j, v = faint ? 0.34 : 0.12;
    if (c === 'R' || c === 'W') return inkP(X, Y, faint ? 0.75 : 0.62, M_DANGER);
    if (c === 'O' || c === 'Y' || c === 'C') return put(X, Y, faint ? 0.7 : 0.88, M_LOOT, 0);
    const edge = !on(i - 1, j) || !on(i + 1, j) || !on(i, j - 1) || !on(i, j + 1), l = lumOf(P[PX[c]]);
    if (edge || l < 0.3) inkP(X, Y, v); else if (l < 0.6 && !faint) inkP(X, Y, 0.42);
  }));
}
function compassRose(cx, cy) {
  inkRing(cx, cy, 15, 0.14); inkRing(cx, cy, 12.5, 0.62, M_DANGER);
  for (let k = 0; k < 32; k++) { const an = k / 32 * 6.283; if (k % 4) inkP(Math.round(cx + Math.cos(an) * 14 - 0.5), Math.round(cy + Math.sin(an) * 14 - 0.5), 0.22); }
  for (let k = 0; k < 8; k++) {
    const an = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? 9 : 17, wd = k % 2 ? 2 : 3.2;
    for (let s2 = 0; s2 <= L; s2++) for (let o = -wd; o <= wd; o += 0.5) {
      const half = wd * (1 - s2 / L); if (Math.abs(o) > half) continue;
      const x = Math.round(cx + Math.cos(an) * s2 - Math.sin(an) * o), y = Math.round(cy + Math.sin(an) * s2 + Math.cos(an) * o);
      if (k % 2) inkP(x, y, 0.2); else if (o >= 0) put(x, y, 0.84, M_LOOT, 0); else inkP(x, y, 0.12);
    }
  }
  put(cx, cy, 0.95, M_LOOT, 0); inkSprite('fleur', cx - 3, cy - 26, 0.12);
}
// the static part of a route map: the run so far, the forks to every candidate, compass
function pathsLayer(st) {
  if (PATH_LAYERS[MAP_STATE]) return PATH_LAYERS[MAP_STATE];
  return (PATH_LAYERS[MAP_STATE] = buildMapLayer({ title: st.title, sub: st.sub, holes: [[311, 150, 2.6], [25, 64, 2.2]], draw: (P_) => {
    const H0 = MAP_HIST_XY.slice(4 - st.hist.length).map(([x, y]) => ({ x, y })), here = H0[H0.length - 1];
    for (let k = 0; k < H0.length - 1; k++) stairRoad(H0[k], H0[k + 1], k % 2 ? -1 : 1, P_);
    H0.forEach((n, k) => roundel(n.x, n.y, String(st.hist[k]), st.hist[k] % 5 === 0 ? M_DANGER : M_DUSK));
    const F = MAP_FORK_XY[st.cards.length];
    F.forEach(([x, y], k) => { if (!st.cards[k].map) stairRoad(here, { x, y }, forkBend(F.length, k), P_); });
    compassRose(34, 146);
  } }));
}
// ink text wrapped to a width; returns the next line's y
function wrapInk(str, x, y, w, idx) {
  const words = str.split(' '); let cur = '';
  for (const wd of words) { const n = cur ? cur + ' ' + wd : wd; if (measure(n, 'tiny') > w && cur) { text(cur, x, y, 'tiny', idx); y += 7; cur = wd; } else cur = n; }
  if (cur) { text(cur, x, y, 'tiny', idx); y += 7; }
  return y;
}
// a bullet in the meaning colour (moss = what you get, crimson = what it costs); the words stay in dark ink
function noteLine(kind, str, x, y, w) {
  const col = kind === '+' ? P.g3 : P.crimson;
  if (kind === '+') { putI(x + 1, y + 1, col); putI(x, y + 2, col); putI(x + 1, y + 2, col); putI(x + 2, y + 2, col); putI(x + 1, y + 3, col); }
  else { putI(x, y + 2, col); putI(x + 1, y + 2, col); putI(x + 2, y + 2, col); }
  return wrapInk(str, x + 5, y, w - 5, P.u1);
}
function dangerPips(x, y, d, empty) { for (let k = 0; k < 3; k++) if (k < d || empty != null) spr(x + k * 6, y, SKULL, { a: k < d ? P.crimson : empty }); }
// the margin note: the hovered path's full text, in the cartographer's hand
function pathNote(st, c, x, y, w) {
  const head = c.boss ? 'FLOOR ' + st.floor + ' - BOSS' : c.map ? 'FLOOR ' + st.floor + ' - BY MAP' : 'FLOOR ' + st.floor;
  text(head, x, y, 'silkb', P.u1); y += 8;
  for (let i = x; i < x + w; i++) if (hash(i, 3, 17) > 0.15) inkP(i, y, 0.2); y += 4;
  if (!c.feat && !c.cond && !c.map) { y = wrapInk('The stairs down. A plain floor: fights and the usual random curios.', x, y, w, P.u2); return y; }
  if (c.map) {
    const M = MAPITEM[c.map]; inkIcon(ITEM.map, x - 1, y - 3);
    text(M.name, x + 14, y, 'tiny', P.u1); y += 10;
    y = wrapInk('Uses the map from your bag.', x + 14, y, w - 14, P.u2);
    y = noteLine('+', M.pays + '.', x + 14, y, w - 14);
    y = noteLine('-', M.cost + '.', x + 14, y, w - 14);
    return wrapInk('Never taken for you.', x + 14, y + 2, w - 14, P.u2);
  }
  if (c.feat) {
    const F = FEAT[c.feat]; inkIcon(PICON[c.feat], x, y - 3);
    text(F.name, x + 14, y, 'tiny', P.u1); y += 10;
    if (F.bless) { y = wrapInk(F.act + ' for a blessing:', x + 14, y, w - 14, P.u2); y = noteLine('+', F.bless + '.', x + 14, y, w - 14); y = noteLine('-', F.cost + '.', x + 14, y, w - 14); }
    else y = wrapInk(F.line, x + 14, y, w - 14, P.u2);
    y += 4;
  }
  if (c.cond) {
    const C = COND[c.cond]; inkIcon(PICON[c.cond], x, y - 3);
    const nw = text(C.name, x + 14, y, 'tiny', P.u1); dangerPips(x + 14 + nw + 4, y, C.danger); y += 10;
    y = noteLine('+', C.pays + '.', x + 14, y, w - 14);
    y = noteLine('-', C.cost + '.', x + 14, y, w - 14);
  }
  return y;
}
// a path card: bronze-framed leather, pinned; one feature row and one condition row
function cardRow(x, y, kind, id, hov) {
  if (kind === 'none') { wellU(x, y, 13, 13, { v: 0.05, lip: 0.3 }); text(id, x + 16, y + 4, 'tiny', P.u4, { shadow: P.void }); return; }
  shadowU(x, y, 13, 13, { k: 0.4, r: 2, dx: 1, dy: 1 }); wellU(x, y, 13, 13, { v: 0.1 });
  if (kind === 'map') { const M = MAPITEM[id]; frameI(x, y, 13, 13, P[RARITY[M.r]]); sprite(x + 1, y + 1, ITEM.map.slice(0, 11).map((r) => r.slice(0, 11))); text(M.name, x + 16, y + 4, 'tiny', P[RARITY_TEXT[M.r]], { shadow: P.void }); return; }
  frameI(x, y, 13, 13, kind === 'cond' ? P.crimson : P.u4);
  sprite(x + 1, y + 1, PICON[id]);
  text((kind === 'cond' ? COND : FEAT)[id].name, x + 16, y + 4, 'tiny', hov ? P.moon : P.u6, { shadow: P.void });
}
function pathCard2(x, y, c, st, hov, safest, awayF) {
  const w = CARD_W, h = CARD_H, yy = hov ? y - 2 : y;
  shadowU(x, yy, w, h, { k: hov ? 0.7 : 0.55, r: hov ? 5 : 3, dx: 2, dy: hov ? 5 : 3 });
  leatherU(x + 3, yy + 3, w - 6, h - 6, { v: 0.15, vig: 0.3 });
  mouldU(x, yy, w, h, { mat: hov ? M_LOOT : M_UMBER, k: hov ? 1.05 : 0.9, bosses: false });
  bossU(x + w / 2 - 2, yy - 1, 5);
  text(c.boss ? 'Floor ' + st.floor + ' · boss' : 'Floor ' + st.floor, x + 6, yy + 5, 'tiny', c.boss ? P.crimson : hov ? P.u6 : P.u5, { shadow: P.void });
  let rx = x + w - 6;
  if (c.cond) { rx -= 17; dangerPips(rx, yy + 5, COND[c.cond].danger, P.u2); }
  if (safest) { rx -= 7; hourglass(rx, yy + 4, awayF); }
  if (c.map) cardRow(x + 5, yy + 13, 'map', c.map, hov), text('uses your map', x + 21, yy + 32, 'tiny', P.u5, { shadow: P.void });
  else {
    cardRow(x + 5, yy + 13, c.feat ? 'feat' : 'none', c.feat || 'no feature', hov);
    cardRow(x + 5, yy + 28, c.cond ? 'cond' : 'none', c.cond || 'no condition', hov);
  }
  if (hov) spr(x + w / 2 - 2, yy + h + 1, ['aaaaa', '.aaa.', '..a..'], { a: P.gold });
}
function screenPaths(ctx, t) {
  const st = PATH_SETS[MAP_STATE];
  setRes(BA_W, GS_H); CX = 167;
  const L = pathsLayer(st);
  const F = buf('ba', BA_W, GS_H); bind(F); CLIP = null;
  F.V.set(L.V); F.M.set(L.M); F.E.set(L.E); F.A.set(L.A); F.T.fill(0); F.DX.fill(0); F.I.set(L.I); F.G.fill(1); F.X.fill(0);
  MAT = M_UMBER; EMI = 0;
  const n = st.cards.length, FK = MAP_FORK_XY[n], here = { x: 80, y: 106 }, off = Math.floor(t * 6);
  // away: the map has been off screen for awaySec of MAP_AWAY_SEC; at 5 s the safest path is taken
  const awaySec = st.away ? Math.min(MAP_AWAY_SEC, (t % 9) * 0.8) : 0, taken = st.away && awaySec >= MAP_AWAY_SEC;
  const hov = st.away ? (taken ? st.safest : -1) : Math.floor(t / 3) % n, qd = st.away ? clamp(((t % 9) - 6.25) / 0.9) : clamp((t % 3) / 0.9);
  // you are here
  for (const [r, sd] of [[13.5, 0], [12.6, 2]]) { const from = ((off * 0.02) + sd * 0.1) % 1; inkRing(here.x, here.y, r, 0.95, M_DANGER, from, from + 0.88, 0.6, sd); }
  text('you are here', 64, 121, 'tiny', P.wine, { align: 'c' });
  // the hovered fork draws itself in red ink
  if (hov >= 0) {
    const [bx, by] = FK[hov], c = st.cards[hov], { A, Bp, C, L: Ln } = forkPts(here, { x: bx, y: by }, forkBend(n, hov)), N = Math.ceil(Ln * 2);
    for (let k = 0; k <= N * qd; k++) {
      if (((k >> 2) + off) & 1) continue; const q = k / N;
      const px = Math.round(qb(A[0], C[0], Bp[0], q)), py = Math.round(qb(A[1], C[1], Bp[1], q));
      inkP(px, py, 0.95, M_DANGER); if (c.map) inkP(px + 1, py, 0.8, M_DANGER);
    }
  }
  // the candidate rooms: pencilled until hovered, then gilded with the floor's numeral; their icons sketched beside them
  st.cards.forEach((c, k) => {
    const [x, y] = FK[k], on = k === hov && qd >= 0.5;
    if (on) roundel(x, y, String(st.floor), c.boss ? M_DANGER : c.map ? M_MAGIC : c.cond ? M_DANGER : c.feat ? M_STONE : M_DUSK);
    else { roundel(x, y, '', M_DUSK, true); text('?', x, y - 2, 'tiny', P.u2, { align: 'c' }); }
    let ix = x + 13;
    const icons = c.map ? [ITEM.map.slice(0, 11).map((r) => r.slice(0, 11))] : [c.feat && PICON[c.feat], c.cond && PICON[c.cond]].filter(Boolean);
    if (c.boss) icons.unshift(INK.skull.map((r) => r.replace(/M/g, 'v')));
    for (const ic of icons) { inkIcon(ic, ix, y - 5, k !== hov); ix += 13; }
  });
  // the margin note
  const nx = 202, ny = 42;
  if (hov >= 0) pathNote(st, st.cards[hov], nx, ny, 114);
  else { text('FLOOR ' + st.floor, nx, ny, 'silkb', P.u1); wrapInk('Hover a path to read it.', nx, ny + 12, 114, P.u2); }
  // HUD over the map: Flow (yellow bar, ink label) and the town portal
  const fw = text('Flow x1.4', 20, 20, 'tiny', P.u1);
  flowBar(20 + fw + 4, 21, 30, 4, 0.42, false);
  button(W - 72, 15, 54, 19, [['Town portal', 'tiny', P.moon], ['15 min', 'tiny', P.d6]], { mat: M_MAGIC });
  // the cards
  const awayF = awaySec / MAP_AWAY_SEC;
  st.cards.forEach((c, k) => pathCard2(MAP_CARD_X[n][k], CARD_Y, c, st, k === hov, k === st.safest, awayF));
  // footer: the auto-pick rule, with the same hourglass as the safest card
  const f1 = 'Look away 5 s in all and the', f2 = taken ? 'path is taken for you.' : st.away ? 'path is taken. ' + Math.ceil(MAP_AWAY_SEC - awaySec) + ' s left.' : 'path is taken.';
  const w1 = measure(f1, 'tiny'), w2 = measure(f2, 'tiny'), x0 = Math.round(167 - (w1 + w2 + 12) / 2);
  text(f1, x0, 211, 'tiny', P.u1); hourglass(x0 + w1 + 3, 210, awayF, P.u1, P.u3); text(f2, x0 + w1 + 11, 211, 'tiny', P.u1);
  const fl = 0.96 + 0.04 * Math.sin(t * 7) * Math.sin(t * 2.3);
  composeInto(ctx, F, { lights: [{ x: -30, y: -40, r: 820, i: 0.66 * fl, c: [1.1, 1.0, 0.86] }, { x: 380, y: 300, r: 330, i: 0.2, c: [0.72, 0.85, 1.3] }], ambient: [0.5, 0.49, 0.55], tint: 0.1, vig: 0 }, 0);
}
