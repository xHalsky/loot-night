// ===========================================================================
// Her panel, 148x360, left of the right screen: what the webcam on his monitor sees, and her UI under it.
// Two palettes meet at the door:
//  - his room and him: the desk's palette (Graphite), through the usual light, ramp and dither pipeline, lit by the
//    monitor and by whatever light comes through the door;
//  - her world: the hallway and rooms beyond the door, her, the daydream and the panel UI: a 16-colour PC-98 set,
//    drawn palette-exact with 2x2 ordered dither, the way a PC-98 dating sim was painted.
// ===========================================================================
const HP_W = 148, HP_H = 360;
// PC-98: the shared core eight + eight of her own in 12-bit values (#312 plum, #536 purple, #a8c lilac, #e68 rose,
// #fdc skin, #edb beige, #b97 tan, #743 brown) and her denim #57a: beige paper, pink and purple, warm wood
// (her world has no use for the core's arcane violet, so that slot is her denim blue #57a)
const PC98 = [CORE8.void, '#331122', '#553366', '#aa88cc', '#5577aa', '#ee6688', CORE8.d6, '#ffddcc', '#eeddbb', '#bb9977', '#774433', CORE8.gold, CORE8.moon, CORE8.crimson, CORE8.s6, CORE8.g5];
const C9 = { void: 0, plum: 1, purple: 2, lilac: 3, denim: 4, rose: 5, pink: 6, skin: 7, beige: 8, tan: 9, brown: 10, gold: 11, moon: 12, crimson: 13, cyan: 14, moss: 15 };
const PC98_RGB = PC98.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const BAY2 = [0, 2, 3, 1];
const bay2 = (x, y) => (BAY2[((y & 1) << 1) | (x & 1)] + 0.5) / 4;
const chk = (x, y) => (x + y) & 1;
// a tone ramp (dark to light) and a light level 0..1 -> a palette index, 2x2-dithered between neighbouring tones
// flat tones with a 50% checker between them (what PC-98 painters mostly used), not a full ordered ramp
const tone = (ramp, L, x, y) => { const t = clamp(L) * (ramp.length - 1), b = Math.floor(t), f = t - b; return ramp[Math.min(ramp.length - 1, b + (f > 0.68 ? 1 : f > 0.36 ? chk(x, y) : 0))]; };
// ---------------------------------------------------------------- the webcam view: the prototype's, dithered
// Baked by bake_her.py from the prototype's own screenshots (296 x 720 CSS px = exactly 2x the grid): down 2x in
// linear light, then ordered-dithered to the curated palettes (his room: the desk's Graphite; what shows through the
// door and the daydream: the PC-98 set plus the desk's darks, so the prototype's colours stay close). One per state.
const VIEW_H = 266;   // the webcam view ends here; her UI starts
const HER_STATES = {
  chat: { mood: 'happy', heard: null, chat: { label: 'CHAT 1/3 · KEEP EXCEL UP', q: 'Do you think I should cut my hair short?', a: ['You would look great either way', 'Whatever is cheaper', 'Hm, maybe?'], hover: 0 } },
  kettle: { mood: 'happy', heard: ['KETTLE', 'kitchen', 'now'], note: ['HER', 'She is busy with her own thing.'], buttons: true },
  steps: { mood: 'happy', heard: ['STEPS', 'hallway', 'now'], note: ['FOOTSTEPS', 'Footsteps... is she coming?'], warn: true },
  shower: { mood: 'happy', heard: ['SHOWER', 'bathroom', 'now'], note: ['HER', 'She is busy with her own thing.'], buttons: true },
};
const HER_STATS = { patience: 5, caught: 0, goodwill: 0, noise: 0 };
let HER_PIX = null;   // the decoded views: state -> RGBA, 148 x 266
const HER_READY = (async () => {
  if (typeof HER_IMG_SRC === 'undefined') return; const P0 = {};
  for (const [k, src] of Object.entries(HER_IMG_SRC)) { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = HP_W; c.height = VIEW_H; const g = c.getContext('2d'); g.drawImage(im, 0, 0); P0[k] = g.getImageData(0, 0, HP_W, VIEW_H).data; }
  HER_PIX = P0;
})();

// ---------------------------------------------------------------- PC-98 drawing helpers (into her layer's I channel)
const glyph9 = {
  heart: ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'],
  note: ['..xxx', '..x.x', '..x.x', 'xxx.x', 'xx.xx', '...xx'],
  hs: ['.xxxxx.', 'x.....x', 'x.....x', 'xx...xx', 'xx...xx', 'xx...xx'],
};
const g9 = (g, x, y, idx) => glyph9[g].forEach((r, j) => [...r].forEach((c, i) => { if (c === 'x') putI(x + i, y + j, idx); }));
function heart9(x, y, full, kind) {
  const H = glyph9.heart;
  for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) if (H[j][i] === 'x') {
    const edge = j === 0 || i === 0 || i === 6 || H[j][i - 1] !== 'x' || H[j][i + 1] !== 'x' || (j < 5 && H[j + 1][i] !== 'x') || j === 5;
    putI(x + i, y + j, full ? (edge ? C9.plum : kind === 'caught' ? C9.crimson : C9.rose) : edge ? C9.purple : C9.plum);
  }
  if (full) { putI(x + 1, y + 1, C9.moon); putI(x + 2, y + 1, kind === 'caught' ? C9.rose : C9.skin); }
}
// text runs: [[str, idx], ...]; '·' draws as a centred dot
function runs9(parts, x, y) {
  for (const [s, idx] of parts) {
    for (const seg of s.split(/(·)/)) { if (!seg) continue; if (seg === '·') { putI(x + 1, y + 2, idx); x += 4; continue; } x += text(seg, x, y, 'tiny', idx) + 1; }
  }
  return x;
}
function wrap9(str, maxW) {
  const words = str.split(' '), lines = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (measure(n, 'tiny') > maxW && cur) { lines.push(cur); cur = w; } else cur = n; }
  if (cur) lines.push(cur); return lines;
}
// a PC-98 window: plum outline, a lilac/purple bevel, beige paper with a moon top lip, rounded corners, a plum shadow
function win9(x, y, w, h, o = {}) {
  const fill = o.fill ?? C9.beige, hi = o.hi ?? C9.moon, lo = o.lo ?? C9.tan;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cr = (i === 0 || i === w - 1) && (j === 0 || j === h - 1); if (cr) continue;
    let c;
    if (i === 0 || j === 0 || i === w - 1 || j === h - 1) c = o.edge ?? C9.plum;
    else if (j === 1 || i === 1) c = (i === 1 && j === 1) ? o.edge ?? C9.plum : hi;
    else if (j === h - 2 || i === w - 2) c = lo;
    else c = fill;
    putI(x + i, y + j, c);
  }
  if (o.shadow !== false) { for (let i = 2; i <= w; i++) putI(x + i, y + h, C9.void); for (let j = 2; j < h; j++) putI(x + w, y + j, C9.void); }
}
function bar9(x, y, w, v, idx, marks = []) {
  for (let j = 0; j < 5; j++) for (let i = 0; i < w; i++) {
    const edge = j === 0 || j === 4 || i === 0 || i === w - 1; if ((i === 0 || i === w - 1) && (j === 0 || j === 4)) continue;
    putI(x + i, y + j, edge ? C9.purple : i - 1 < Math.round((w - 2) * v) ? (j === 1 ? C9.moon : idx) : chk(x + i, y + j) ? C9.plum : C9.void);
  }
  for (const m of marks) { const mx = x + 1 + Math.round((w - 2) * m); putI(mx, y - 1, C9.beige); putI(mx, y + 5, C9.beige); }
}

// ---------------------------------------------------------------- the panel UI (PC-98): header over the room, then
// the last-heard line, her note (grows for a chat), the two buttons, the stats
const MOOD9 = { flustered: [C9.rose, 'flustered'], happy: [C9.moss, 'happy'], annoyed: [C9.gold, 'a bit annoyed'], furious: [C9.crimson, 'furious'], asleep: [C9.lilac, 'asleep'], sleepy: [C9.lilac, 'sleepy'] };
function herUI(st, t) {
  // header, over the dark wall: a rose heart and her name; her mood in a pill
  heart9(4, 4, true);
  text('Babe', 14, 2, 'tinyL', C9.pink, { shadow: C9.void });
  const [mc, mw] = MOOD9[st.mood], pw = measure(mw, 'tiny') + 8;
  win9(HP_W - 4 - pw, 3, pw, 10, { fill: C9.plum, hi: C9.purple, lo: C9.plum, edge: C9.purple });
  text(mw, HP_W - 4 - pw + 4, 5, 'tiny', mc);
  // the UI band
  rectI(0, 266, HP_W, HP_H - 266, C9.plum);
  for (let x = 0; x < HP_W; x++) { putI(x, 266, C9.purple); putI(x, 267, chk(x, 267) ? C9.purple : C9.plum); }
  let y = 270;
  if (st.heard) {   // ♫ KETTLE · kitchen · now
    g9('note', 4, y, C9.lilac);
    runs9([[st.heard[0], C9.rose], [' · ' + st.heard[1] + ' · ' + st.heard[2], C9.lilac]], 12, y);
  }
  y = 279;
  if (st.ask) {   // her window for a moment of hers (week one): a tease, a request, the plate, come to bed, asleep
    const A = st.ask, lines = wrap9(A.line, 128), ph = A.pills ? 21 : 0, bh = A.bar != null ? 9 + (A.barLabels ? 7 : 0) : 0;
    y = A.top ?? 270;
    const h = 13 + lines.length * 8 + bh + ph + 2;
    win9(3, y, 141, h, A.warm ? { fill: C9.beige, edge: C9.brown } : {});
    if (A.pink) { const on = Math.floor(t * (A.fast ? 8 : 3)) & 1; for (let i = 5; i < 142; i++) putI(i, y + 2, (chk(i, 0) ^ on) ? C9.rose : C9.moon); }
    if (A.warm) for (let i = 5; i < 142; i++) putI(i, y + 2, chk(i, 0) ? C9.gold : C9.moon);
    text(A.label, 8, y + 5, 'tiny', A.labelCol ?? C9.rose);
    if (A.look != null) { for (let k = 0; k < 3; k++) heart9(118 + k * 8, y + 4, k < A.look); }
    else if (A.right) text(A.right, 137, y + 5, 'tiny', C9.purple, { align: 'r' });
    lines.forEach((l, k) => text(l, 8, y + 13 + k * 8, 'tiny', C9.plum));
    let yy = y + 14 + lines.length * 8;
    if (A.bar != null) {
      bar9(8, yy, 130, A.bar, A.barCol ?? C9.rose, A.marks || []);
      if (A.barLabels) A.barLabels.forEach(([m, s]) => text(s, 9 + Math.round(128 * m), yy + 6, 'tiny', C9.brown, { align: m >= 1 ? 'r' : 'c' }));
      yy += bh;
    }
    if (A.pills) {
      let px = 7;
      A.pills.forEach(([n, c], k) => {
        const w = Math.max(measure(n, 'tiny'), measure(c, 'tiny')) + 9, hov = k === A.hover;
        win9(px, yy, w, 18, { fill: hov ? C9.rose : C9.pink, hi: C9.skin, lo: C9.rose, edge: C9.plum, shadow: true });
        text(n, px + 4, yy + 3, 'tiny', C9.plum); text(c, px + 4, yy + 10, 'tiny', C9.purple); px += w + 4;
      });
    }
    y += h + 4;
  } else if (st.chat) {
    y = 270;
    const c = st.chat, lines = wrap9(c.q, 128), h = 13 + lines.length * 8 + 28;
    win9(3, y, 141, h);
    text(c.label.split(' · ')[0], 8, y + 4, 'tiny', C9.rose); text(c.label.split(' · ')[1], 137, y + 4, 'tiny', C9.purple, { align: 'r' });
    lines.forEach((l, k) => text(l, 8, y + 13 + k * 8, 'tiny', C9.plum));
    let ay = y + 14 + lines.length * 8, ax = 7;
    c.a.forEach((a, k) => {
      const w = measure(a, 'tiny') + 9; if (ax + w > 140) { ax = 7; ay += 13; }
      const hov = k === c.hover;
      win9(ax, ay, w, 11, { fill: hov ? C9.pink : C9.moon, hi: hov ? C9.skin : C9.moon, lo: hov ? C9.rose : C9.beige, edge: hov ? C9.plum : C9.purple, shadow: hov });
      text(a, ax + 4, ay + 3, 'tiny', C9.plum); ax += w + 3;
    });
    y += h + 4;
  } else {
    const [lab, body] = st.note, warn = st.warn;
    win9(3, y, 141, 29, warn ? { fill: C9.beige, edge: C9.brown } : {});
    if (warn) { const sh = Math.sin(t * 40) > 0 ? 1 : 0; for (let i = 5; i < 142; i++) putI(i, y + 2, chk(i, 0) ? C9.gold : C9.moon); }
    text(lab, 8, y + 5, 'tiny', warn ? C9.brown : C9.rose);
    wrap9(body, 128).slice(0, 2).forEach((l, k) => text(l, 8, y + 13 + k * 8, 'tiny', C9.plum));
    y += 31;
    if (st.buttons) {
      const B9 = [['Make her tea', '15 s away'], ['Towel under door', '2 s']];
      B9.forEach(([n, c], k) => {
        const bx = 3 + k * 72;
        win9(bx, y, 69, 17, { fill: C9.pink, hi: C9.skin, lo: C9.rose, edge: C9.plum });
        text(n, bx + 4, y + 3, 'tiny', C9.plum); text(c, bx + 4, y + 10, 'tiny', C9.purple);
      });
    }
    y += 22;
  }
  // stats: fixed slots at the bottom
  const HS = { ...HER_STATS, ...(st.stats || {}) };
  const sy = 331;
  text('Patience', 4, sy, 'tiny', C9.beige);
  for (let k = 0; k < 5; k++) heart9(42 + k * 8, sy - 1, k < HS.patience);
  text('Caught', 88, sy, 'tiny', C9.beige);
  for (let k = 0; k < 3; k++) heart9(119 + k * 8, sy - 1, k < HS.caught, 'caught');
  text('Goodwill', 4, sy + 10, 'tiny', C9.beige); bar9(42, sy + 10, 92, HS.goodwill / 100, C9.rose, [0.4, 0.6]); text(String(HS.goodwill), 144, sy + 10, 'tiny', C9.beige, { align: 'r' });
  if (st.gwTag) { const w = measure(st.gwTag, 'tiny') + 4, x = Math.min(134 - w, 42 + Math.round(92 * HS.goodwill / 100) + 2); rectI(x, sy + 9, w, 7, C9.plum); text(st.gwTag, x + 2, sy + 10, 'tiny', C9.pink); }
  text('Noise', 4, sy + 20, 'tiny', C9.beige); bar9(42, sy + 20, 92, HS.noise / 100, C9.gold); text(String(HS.noise), 144, sy + 20, 'tiny', C9.beige, { align: 'r' });
  // looking at her: over the webcam view the pointer is an eye (the lean's eye, in her colours)
  if (st.eye) {
    const [ex, ey] = st.eye, E = ['...vvvvv...', '.vvmmmmmvv.', 'vmmmppvmmmv', 'vmmmpopmmmv', '.vvmmmmmvv.', '...vvvvv...'], K = { v: C9.void, m: C9.moon, p: C9.purple, o: C9.moon };
    E.forEach((r, j) => [...r].forEach((c, i) => { if (K[c] != null) putI(ex + i, ey + j, c === 'p' && j === 2 && i === 6 ? C9.void : K[c]); }));
  }
}

// ---------------------------------------------------------------- frame
let HER_CANVAS = null;
const GPAL = (name) => { const h = deskSet(DESK_VARIANT).PAL[P[name]]; return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
// ---------------------------------------------------------------- his chair: a gaming chair (Paweł's reference, no logos)
// One shape for both views, in chair units (1 unit = 1 webcam px): a tall back with a pillow headrest, shoulder wings,
// a lumbar, bolsters with grey-green piping, a quilted centre panel; the seat and the armrests at the bottom. The
// webcam sees its front behind him (lit by the monitor); away, it is empty. The desk sees its back (small.js).
const CHAIR = { cx: 74, top: 188, back: 74, seat: 64, arm: 50, armX: [32, 40] };   // top: just under the light under the door
// the shape of the reference: one tall back (no separate headrest) with a broad arched top and rounded corners, sides
// that run down almost straight and draw in a little, bolsters whose inner edge runs from near the top corners down
// and in, a smooth upper panel, a quilted lumbar panel under a curved seam; the seat in front; armrests at the sides
const chairSide = (r) => 28 - 3 * (r / CHAIR.back);   // the back's half width at r units under its top (the desk sees it so)
// the webcam sees it from the front and close: the back reclines, so its lower part is nearer and wider in the picture;
// it runs down past the frame's bottom (the seat and the armrests are below it, out of the picture)
const chairSideCam = (r) => 23 + 21 * Math.pow(Math.max(0, r) / 78, 2.2);
function chairTop(dx, w = 28) {   // where the top edge is at dx: an arch, its corners rounded
  const a = Math.abs(dx), arch = 3 * (a / w) ** 2, R = 6, c = a > w - R ? R - Math.sqrt(Math.max(0, R * R - (a - (w - R)) ** 2)) : 0;
  return arch + c;
}
const chairInner = (r, w = 28) => (r < 56 ? 21 - (r / 56) * 9 : 12) * (w / 28);   // the bolsters' inner edge (the piping)
const chairSeam = (dx) => 34 + 3 * (dx / 10) ** 2;              // the upper panel's lower edge, curving down to the sides
function chairRegion(dx, r, cam = false) {   // 0 nothing, 1 the back, 2 the seat, 3 an armrest's pad, 4 its side
  const a = Math.abs(dx);
  if (cam) return r >= chairTop(dx, 23) && a <= chairSideCam(r) ? 1 : 0;
  if (r >= CHAIR.arm && a >= CHAIR.armX[0] && a <= CHAIR.armX[1]) return r < CHAIR.arm + 3 ? 3 : 4;
  if (r >= CHAIR.seat && a <= 34 - Math.max(0, 2 - (r - CHAIR.seat))) return 2;
  return r >= chairTop(dx) && r <= CHAIR.back && a <= chairSide(r) ? 1 : 0;
}
// its front, in the desk's colours by name: lit evenly by the monitor in front of it
function chairFront(dx, r) {
  const reg = chairRegion(dx, r, true); if (!reg) return null;
  // its rim, as on the desk: the top edge catches the screen (s3), the sides a thin grey (s2)
  if (chairRegion(dx, r - 1, true) !== reg) return 's3';
  if (chairRegion(dx - 1, r, true) !== reg || chairRegion(dx + 1, r, true) !== reg) return 's2';
  const a = Math.abs(dx);
  if (reg === 3) return r === CHAIR.arm + 1 ? 's4' : 's3';
  if (reg === 4) return a === CHAIR.armX[1] - 1 ? 's2' : 's1';
  if (reg === 2) {
    if (r === CHAIR.seat + 7) return 's3';
    if (r > CHAIR.seat + 7) return a > 24 ? 's2' : 's1';             // the seat's front face
    if (a === 24) return 'g3';
    if (a > 24) return a === 29 ? 's3' : 's2';
    return ((dx + 2 * r) % 6 === 0 || (dx - 2 * r + 600) % 6 === 0) ? 's2' : 's1';
  }
  const t = r - chairTop(dx, 23), side = chairSideCam(r), inner = Math.round(chairInner(r, 23));
  // as dark as on the desk: black with only a faint s1 in it, the piping s1, the top edge s3 then s2, the sides s2
  if (t < 2.2) return 's2';
  if (r > 30 && a === Math.floor(side) - 2) return 's1';              // the outer piping, down the lower sides
  if (a === inner) return 's1';                                       // the bolsters' inner piping
  if (r === Math.round(chairSeam(dx)) && a < inner) return 's1';      // the lumbar's seam
  return (0.06 - 0.04 * a / side) > BAYER8[((Math.round(r) & 7) << 3) | (Math.round(dx + 64) & 7)] * 0.4 ? 's1' : 'void';
}
// redraw the chair behind him (or empty, away): him stays where the view shows him; round him the old plain chair
// back gives way to the gaming chair, and where neither is, the wall comes back (tiled from the wall at the sides)
function herChair(D, away) {
  const at = (x, y) => (y * HP_W + x) * 4, CH = new Set(['23,25,30', '27,25,28', '36,39,46', '43,40,44']);
  const himHW = (y) => (y < 241 ? 17 : Math.min(50, 17 + (y - 241) * 2.2));
  const himMask = (x, y) => y >= 189 && Math.abs(x - 74.5) <= himHW(y);
  // he sits IN it: from his shoulders down, the bolsters come forward round him and cover his shoulders' outer edge
  const wrap = (x, y) => { const d = Math.abs(x - 74.5), r = y - CHAIR.top; return y >= 238 && d >= himHW(y) - 4 && d > chairInner(r, 23) + 2 && chairRegion(x - CHAIR.cx, r, true) === 1; };
  const src = new Uint8ClampedArray(D);
  const icon = (x, y) => x >= 98 && x <= 108 && y >= 196 && y <= 212 && src[at(x, y)] + src[at(x, y) + 1] + src[at(x, y) + 2] > 200;   // the headset glyph
  const isHim = (x, y) => { const q = at(x, y); return !away && himMask(x, y) && !CH.has(src[q] + ',' + src[q + 1] + ',' + src[q + 2]) && !wrap(x, y); };
  for (let y = 187; y < VIEW_H; y++) for (let x = 18; x < 130; x++) {
    const p = at(x, y), ic = icon(x, y);
    if (isHim(x, y)) continue;                                       // him (but not where the bolsters wrap round him)
    let c = chairFront(x - CHAIR.cx, y - CHAIR.top);
    // the chair is as black as he is: where it meets him, a thin dark-grey line keeps his head and shoulders
    if (c === 'void' || c === 's1') { if (isHim(x - 1, y) || isHim(x + 1, y) || isHim(x, y - 1) || isHim(x, y + 1)) c = 's1'; }
    let rgb;
    if (c) rgb = GPAL(c);
    else if (himMask(x, y) || (x >= 44 && x <= 104) || ic) {       // the wall behind: tiled from its sides, the row's own dither
      // above his shoulders: mirrored from the wall right beside the old chair back, so the glow on the wall runs on;
      // lower down (where his shoulders were): tiled from the dark wall at the panel's sides
      const sx = y < 241 ? (x < 74 ? 43 - (((x - 44) % 14 + 14) % 14) : 115 + (((104 - x) % 14 + 14) % 14)) : (x < 74 ? 2 + ((x - 2) % 16) : 145 - ((145 - x) % 16));
      const q = at(sx, y); rgb = [src[q], src[q + 1], src[q + 2]];
    } else continue;
    D[p] = rgb[0]; D[p + 1] = rgb[1]; D[p + 2] = rgb[2];
  }
  // the headset glyph back on the wall, 5 px right of where it was (the chair is wider than the old back)
  for (let y = 196; y <= 212; y++) for (let x = 98; x <= 108; x++) if (icon(x, y)) { const q = at(x, y), p = at(x + 5, y); D[p] = src[q]; D[p + 1] = src[q + 1]; D[p + 2] = src[q + 2]; }
}
// the webcam while he leans in (grid doc 7l): the door open a crack (as wide as the lean's slit), the gaming chair
// turned toward it, and him in it, turned round and leaning his head and shoulders to the crack; the hallway's light
// rims his head. From the kettle bake (the door ajar, him turned): the leaf closes over the gap but a slit, the chair
// is drawn empty, then his silhouette goes back sheared toward the crack.
function leanWebcam(D, src, slit) {
  const at = (x, y) => (y * HP_W + x) * 4, gap = Math.round(3 + (Math.max(24, Math.min(160, slit)) - 24) / 136 * 9);
  const jamb = 120, edge = jamb - gap, put = (x, y, c) => { if (x < 0 || y < 0 || x >= HP_W || y >= VIEW_H) return; const p = at(x, y); D[p] = c[0]; D[p + 1] = c[1]; D[p + 2] = c[2]; };
  // the leaf over the old gap (tiled from a plain bit of its lower panel), a slit of warm hallway light at the latch side
  shutLeaf(D, src, edge);
  for (let y = 20; y < 185; y++) put(edge - 1, y, GPAL("u4"));   // the leaf's edge, lit by the gap
  herChair(D, true);   // the wall, the empty chair
  // him, turned round in the chair (it swivelled with him, so its back is to us), leaning out to the right, to the
  // crack. The same man as from the front, seen from behind and a little to his right (Paweł: he looked bald): short
  // dark hair with strands and a crown, a few tufts on top, a hint of his right ear inside the outline with his glasses'
  // arm running to it, the cyan sweat drop on his temple, the nape of his neck under the
  // hairline, his tee's collar. A silhouette like the front view; the monitor behind the camera grazes his hair cool,
  // the crack's warm light rims his right side.
  const M = new Uint8Array(HP_W * VIEW_H), V = GPAL('void'), s1 = GPAL('s1'), s2 = GPAL('s2'), s3 = GPAL('s3'), rim = GPAL('u5'), rim2 = GPAL('u4');
  const lens = GPAL('u6'), moon = GPAL('moon'), cyan = GPAL('s6');
  const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const HX = 110, HY = 207, HRX = 15.5, HRY = 19;   // his head (the hair's outline)
  const tufts = [[[106, 189], [109, 186.5], [112, 189]], [[114, 190], [117.5, 188.5], [119, 192]], [[120, 194], [123, 193.5], [123, 197]]];
  const nape = (x) => 219 + Math.round(1.5 * Math.sin(x * 1.3)) + (x > 112 ? 1 : 0);   // the hairline at the back, uneven
  const shoulder = [[90, 235], [116, 229], [138, 237], [148, 252], [148, 266], [76, 266], [80, 248]];
  // 1 hair, 2 the nape, 3 the ear, 4 the cheek past it, 5 the tee
  for (let y = 180; y < VIEW_H; y++) for (let x = 30; x < HP_W; x++) {
    const X = x + 0.5, Y = y + 0.5;
    let m = 0;
    if (inPoly(X, Y, shoulder)) m = 5;
    if (x > 101 && x < 119 && y > 214 && y < 235) m = 2;
    if ((inEll(X, Y, HX, HY, HRX, HRY) && y <= nape(x)) || tufts.some((t) => inPoly(X, Y, t))) m = 1;
    if (m) { M[y * HP_W + x] = m; put(x, y, V); }
  }
  const at2 = (x, y) => (x < 0 || y < 0 || x >= HP_W || y >= VIEW_H ? 0 : M[y * HP_W + x]);
  for (let y = 180; y < VIEW_H; y++) for (let x = 30; x < HP_W; x++) {
    const m = M[y * HP_W + x]; if (!m) continue;
    const ck = (x + y) & 1;
    if (m === 1) {   // hair: strands from the crown down and round, the monitor grazing the top cool
      const dx = x - 106, dy = y - 197, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
      const strand = r > 3 && Math.abs(Math.sin(a * 5 + r * 0.12)) < 0.12, top = y < HY - 8;
      const nx = (x + 0.5 - HX) / HRX, ny = (y + 0.5 - HY) / HRY, sheen = ny < -0.3 && Math.hypot(nx, ny) > 0.55;   // the screen's light on the curve of his hair
      if (sheen && ck && (x * 5 + y * 3) % 4 !== 0) put(x, y, s1);
      if (strand) put(x, y, (top || sheen) && (ck || sheen) && x > 102 ? s2 : s1);
      if ((x === 106 && y === 197) || (x === 107 && y === 196) || (x === 105 && y === 198)) put(x, y, s1);   // the crown
      if (at2(x, y + 1) === 2 && ck) put(x, y, s1);            // the hairline's ragged edge
    } else if (m === 2) {   // the nape: skin in shadow, a little lighter than his hair, darker at the sides and in the hollow
      const e = Math.min(x - 101, 119 - x);
      put(x, y, e > 3 && y < 233 && (ck || x === 110) ? (x === 110 && y < 226 ? V : s1) : V);
    } else if (m === 3) {   // his right ear: its rim lit by the hallway, its hollow dark
      const inner = inEll(x + 0.5, y + 0.5, 125.2, 213.5, 1.6, 3.4);
      put(x, y, inner ? (y === 212 ? s1 : V) : x >= 127 ? rim2 : s1);
    } else if (m === 4) {   // the cheek and jaw past it, turned to the light
      put(x, y, x >= 130 ? (y < 220 ? rim : rim2) : ck ? s1 : V);
    } else if (m === 5) {   // his tee: dark, a fold down his back
      put(x, y, (Math.abs(x - 108 - (y - 244) * 0.35) < 0.6 && y > 242) ? s1 : V);
    }
  }
  // the tee's collar: a band round the nape
  for (let x = 98; x <= 122; x++) { const y = 235 + Math.round(((x - 110) / 12) ** 2 * -2); put(x, y, s2); put(x, y + 1, s1); }
  // his glasses: the arm resting on the ear (a lens edge past his cheek read as something sticking out of his head)
  // his ear, inside his head's outline (drawn out past it, it read as a hook): a small curve, the glasses' arm into it
  for (const [x, y] of [[121, 209], [122, 210], [122, 211], [122, 212], [122, 213], [121, 214], [120, 215]]) put(x, y, s2);
  for (const [x, y] of [[120, 211], [120, 212]]) put(x, y, s1);
  for (let x = 115; x <= 120; x++) put(x, 209, s1);
  // the cyan sweat drop on his temple, as on the front
  put(122, 200, cyan); put(122, 201, cyan); put(121, 202, cyan); put(122, 202, cyan); put(121, 203, cyan); put(122, 203, moon);
  // the chair's back in front of him: the same shape as its front, plain black, a grey rim catching the monitor
  for (let y = CHAIR.top; y < VIEW_H; y++) for (let x = 18; x < 132; x++) {
    const dx = x - CHAIR.cx, r = y - CHAIR.top; if (chairRegion(dx, r, true) !== 1) continue;
    const out = chairRegion(dx - 1, r, true) !== 1 || chairRegion(dx + 1, r, true) !== 1 || chairRegion(dx, r - 1, true) !== 1;
    put(x, y, out ? (r < 4 ? s3 : s2) : ((x + y) % 7 === 0 ? s1 : V)); M[y * HP_W + x] = 0;
  }
  // his outline where he meets the dark, and the crack's light on the right of his head and shoulder
  for (let y = 181; y < VIEW_H - 1; y++) for (let x = 31; x < HP_W - 2; x++) {
    const m = M[y * HP_W + x];
    if (m && !M[y * HP_W + x + 1] && chairRegion(x + 1 - CHAIR.cx, y - CHAIR.top, true) !== 1) { if (m !== 4) { put(x, y, y < 228 ? rim : rim2); if (y < 222 && m !== 3) put(x - 1, y, rim2); } }
    else if (!m && (M[y * HP_W + x - 1] || M[(y - 1) * HP_W + x] || M[(y + 1) * HP_W + x]) && chairRegion(x - CHAIR.cx, y - CHAIR.top, true) !== 1) put(x, y, s1);
  }
}
// the door shut (its leaf over the gap, as in the lean's webcam with no slit), him turned toward it: Tuesday's first lean
function webcamDoorShut(D, src) { shutLeaf(D, src, 120); }
// your door's leaf, closed or open a crack (Paweł: its carving has to run over the whole leaf): the shut door from the
// shower bake (one inset panel across the leaf, the handle), the daydream bubble patched out of it. Open a crack, the
// whole leaf narrows toward the hinge (x 28) so its panel still spans it, and the hallway's light shows in the gap.
let SHUT_DOOR = null;
function shutLeaf(D, src, edge) {
  const at = (x, y) => (y * HP_W + x) * 4, S = HER_PIX && HER_PIX.shower;
  if (!S) return;
  if (!SHUT_DOOR) {
    SHUT_DOOR = new Uint8ClampedArray(S);
    for (let y = 17; y < 185; y++) for (let x = 28; x < 120; x++) {
      if (x >= 109 && x <= 118 && y >= 94 && y <= 99) continue;   // the handle
      const p = at(x, y), inBubble = (x - 69) ** 2 + (y - 97) ** 2 <= 39 * 39 || (x - 93) ** 2 + (y - 149) ** 2 <= 8 * 8 || (x - 98) ** 2 + (y - 174) ** 2 <= 7 * 7;
      if (!inBubble && S[p] + S[p + 1] + S[p + 2] <= 200) continue;   // the door's own darks
      const q = y >= 171 && y <= 176 ? at(x - 14, y) : at(x, 32 + (y & 7));   // the bubble: the same column higher up, in step with its dither (the panel's
      SHUT_DOOR[p] = S[q]; SHUT_DOOR[p + 1] = S[q + 1]; SHUT_DOOR[p + 2] = S[q + 2];   // bottom line: along its row)
    }
  }
  const L = 28, J = 120, k = (J - L) / Math.max(1, edge - L);
  for (let y = 17; y < 185; y++) for (let x = L; x < J; x++) {
    const p = at(x, y);
    if (x < edge) { const q = at(Math.min(J - 1, L + Math.floor((x - L) * k)), y); D[p] = SHUT_DOOR[q]; D[p + 1] = SHUT_DOOR[q + 1]; D[p + 2] = SHUT_DOOR[q + 2]; }
    else { const q = at(86, y); D[p] = src[q]; D[p + 1] = src[q + 1]; D[p + 2] = src[q + 2]; }   // the gap: the hallway's light
  }
}
function drawHer(stateName, t, o = {}) {
  const st = HER_STATES[stateName] || HER_STATES.chat;
  if (!HER_CANVAS) { HER_CANVAS = document.createElement('canvas'); HER_CANVAS.width = HP_W; HER_CANVAS.height = HP_H; }
  setRes(HP_W, HP_H); CLIP = null;
  const G = buf('herPC', HP_W, HP_H); G.I.fill(-1); bind(G);
  herUI(st, t);
  const ctx = HER_CANVAS.getContext('2d'), img = ctx.createImageData(HP_W, HP_H), D = img.data;
  const src = HER_PIX && HER_PIX[o.pix || (o.lean != null || o.doorShut ? 'kettle' : stateName)];
  if (src) D.set(src, 0); else for (let i = 0; i < HP_W * VIEW_H; i++) { D[i * 4] = 10; D[i * 4 + 1] = 8; D[i * 4 + 2] = 20; }
  if (src && o.lean != null) leanWebcam(D, src, o.lean);
  else if (src && o.doorShut) { webcamDoorShut(D, src); herChair(D, o.away); }
  else if (src) herChair(D, o.away);
  const at = (x, y) => (y * HP_W + x) * 4, lum = (p) => D[p] + D[p + 1] + D[p + 2];
  // the headset icon beside his head lights cyan when it's on; under Excel his glasses glow grey-green
  if (o.headset) { const c = GPAL('s6'); for (let y = 198; y < 212; y++) for (let x = 103; x < 115; x++) { const p = at(x, y); if (lum(p) > 200) { D[p] = c[0]; D[p + 1] = c[1]; D[p + 2] = c[2]; } } }
  if (o.screen === 'excel') { const c = GPAL('g6'); for (let y = 212; y < 226; y++) for (let x = 60; x < 90; x++) { const p = at(x, y); if (lum(p) > 600) { D[p] = c[0]; D[p + 1] = c[1]; D[p + 2] = c[2]; } } }
  for (let i = 0; i < HP_W * HP_H; i++) { D[i * 4 + 3] = 255; const c = G.I[i]; if (c < 0) continue; const q = PC98_RGB[c], p = i * 4; D[p] = q[0]; D[p + 1] = q[1]; D[p + 2] = q[2]; }
  ctx.putImageData(img, 0, 0);
  return HER_CANVAS;
}

// ---------------------------------------------------------------- the whole game frame, 640x360: her panel + the right screen
let FRAME_CANVAS = null;
function drawFrame(scene, tScreen, t, moment, herState, o = {}) {
  if (!FRAME_CANVAS) { FRAME_CANVAS = document.createElement('canvas'); FRAME_CANVAS.width = 640; FRAME_CANVAS.height = 360; }
  const g = FRAME_CANVAS.getContext('2d');
  g.drawImage(drawDesk(scene, tScreen, t, moment, o), HP_W, 0);
  g.drawImage(drawHer(herState, t, { screen: scene, headset: moment === 'headset', variant: o.variant, away: o.away, lean: o.lean, doorShut: o.doorShut, pix: o.pix }), 0, 0);
  return FRAME_CANVAS;
}

// ---------------------------------------------------------------- the lap sit (fan-service 10, Saturday)
// She sits on your lap facing the monitor: from your eyes, the back of her head and her right shoulder cover the left
// third of the battle area and run off the frame's bottom; you play around her. Backlit by the screen, so a dark shape
// in her colours with the screen's light round its edge: long straight black hair falling past her shoulders, the pink
// flower clip on her right, her cream tee's shoulder in shadow. A code stand-in for Paweł's art. o.say: her line by her
// head ("ooh, shiny" on a drop); o.mouse: she has your mouse.
function lapOver(ctx, t, o = {}) {
  const sway = Math.round(Math.sin(t * 1.3) * 1);
  const head = (x, y) => ((x - 212 - sway) / 45) ** 2 + ((y - 152) / 58) ** 2 <= 1;
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const fall = [[170 + sway, 150], [254 + sway, 150], [266, 250], [270, 360], [158, 360], [160, 250]];
  const tee = [[246, 238], [282, 248], [304, 282], [314, 360], [248, 360]];
  const teeL = [[166, 244], [150, 262], [148, 360], [168, 360]];
  const at = (x, y) => (head(x + 0.5, y + 0.5) || inPoly(x + 0.5, y + 0.5, fall) ? 1 : inPoly(x + 0.5, y + 0.5, tee) || inPoly(x + 0.5, y + 0.5, teeL) ? 2 : 0);
  const L = smLayer(640, 360, () => {
    for (let y = 88; y < 360; y++) for (let x = 148; x < 330; x++) {
      const m = at(x, y); if (!m) continue;
      const e1 = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1), e2 = !at(x - 2, y) || !at(x + 2, y) || !at(x, y - 2);
      let c;
      if (m === 1) {   // her hair: strands from the crown, then straight down; the screen's light round its edge
        const dx = x - 212 - sway, dy = y - 96, a = Math.atan2(dy, dx);
        const col = x + Math.round(3 * Math.sin(y / 23 + x * 0.7)), strand = y < 150 ? Math.abs(Math.sin(a * 14 + Math.sin(a * 37) * 0.6)) < 0.16 : (col % 5 === 0 && (col * 7) % 3 !== 0) || col % 11 === 0;
        c = e1 ? (y > 300 ? C9.purple : C9.lilac) : e2 ? C9.purple : strand ? C9.plum : C9.void;
        if (!e1 && !e2 && y < 150 && Math.abs(dx) > 30 && (x + y) % 2 === 0) c = C9.plum;
      } else {         // her tee's shoulder, in its own shadow, lit at its edge
        c = e1 ? C9.beige : e2 ? C9.tan : (x + y) % 2 ? C9.brown : C9.plum;
      }
      putI(x, y, c);
    }
    // the clip: a small pink flower on her right, by her temple
    const fx = 250 + sway, fy = 128;
    for (const [a, b] of [[0, -3], [3, -1], [2, 3], [-2, 3], [-3, -1]]) { rectI(fx + a - 1, fy + b - 1, 3, 3, C9.pink); putI(fx + a, fy + b, C9.rose); }
    rectI(fx - 1, fy - 1, 3, 3, C9.gold); putI(fx, fy, C9.crimson);
    if (o.say) {   // her line by her head, in her window
      const w = measure(o.say, 'tiny') + 10, x = 268, y = 92;
      win9(x, y, w, 14); text(o.say, x + 5, y + 4, 'tiny', C9.plum);
      putI(x + 4, y + 14, C9.plum); putI(x + 3, y + 15, C9.plum);
    }
  }, PC98_RGB);
  ctx.drawImage(L, 0, 0);
}

// ---------------------------------------------------------------- the live panel (the game, V4 #69; grid doc 7b)
// The game draws the webcam view as it always has (src/ui/door.ts: 296 x 532 CSS px, exactly 2x the grid). Here it
// comes down 2x in linear light and is ordered-dithered the way bake_her.py baked the stills: his room to the desk's
// Graphite with a light dither, her side (what shows through the door, the daydream bubble, the strip under the door)
// to the PC-98 set plus the desk's darks with a stronger one; the light under the door a gold bar with a pale top
// row. The nearest colour is memoised on a 6-bit RGB grid, so a frame is a table lookup per pixel.
const HL = {};
function herOk(r, g, b) {   // sRGB 0..255 -> Oklab, L weighted 1.3 (as the bakes)
  const l0 = HL.lin[r], m0 = HL.lin[g], s0 = HL.lin[b];
  const l = Math.cbrt(0.4122214708 * l0 + 0.5363325363 * m0 + 0.0514459929 * s0), m = Math.cbrt(0.2119034982 * l0 + 0.6806995451 * m0 + 0.1073969566 * s0), s = Math.cbrt(0.0883024619 * l0 + 0.2817188376 * m0 + 0.6299787005 * s0);
  return [1.3 * (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s), 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function herLuts() {
  if (HL.lin) return;
  HL.lin = new Float32Array(256); for (let i = 0; i < 256; i++) { const a = i / 255; HL.lin[i] = a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4; }
  HL.lin12 = new Uint16Array(256); for (let i = 0; i < 256; i++) HL.lin12[i] = Math.round(HL.lin[i] * 4095);   // four of them sum to 0..16380: >> 2 is the mean
  HL.dRoom = new Int16Array(64); HL.dSide = new Int16Array(64); for (let k = 0; k < 64; k++) { HL.dRoom[k] = Math.round((BAYER8[k] - 0.5) * 0.035 * 255); HL.dSide[k] = Math.round((BAYER8[k] - 0.5) * 0.09 * 255); }
  HL.srgb = new Uint8Array(4096); for (let i = 0; i < 4096; i++) { const a = i / 4095; HL.srgb[i] = Math.round(255 * (a <= 0.0031308 ? a * 12.92 : 1.055 * a ** (1 / 2.4) - 0.055)); }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const room = deskSet(DESK_VARIANT).PAL.slice(0, 33).map(hex);   // the desk's Graphite (and the knight's steel)
  const side = PC98.map(hex).concat(room);                        // her world: PC-98 plus the desk's darks and greiges
  HL.room = { rgb: room, ok: room.map((c) => herOk(...c)), lut: new Int16Array(1 << 18).fill(-1) };
  HL.side = { rgb: side, ok: side.map((c) => herOk(...c)), lut: new Int16Array(1 << 18).fill(-1) };
  HL.gold = hex(CORE8.gold); HL.pale = hex(deskSet(DESK_VARIANT).PAL[P.pale] || '#eee5c6');
}
function herNear(P0, r, g, b) {
  const k = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2); let v = P0.lut[k];
  if (v >= 0) return v;
  const o = herOk((r & ~3) + 2, (g & ~3) + 2, (b & ~3) + 2); let best = 1e9;
  for (let i = 0; i < P0.ok.length; i++) { const q = P0.ok[i], d = (q[0] - o[0]) ** 2 + (q[1] - o[1]) ** 2 + (q[2] - o[2]) ** 2; if (d < best) { best = d; v = i; } }
  P0.lut[k] = v; return v;
}
// side: her side of the picture in the source's px: door [x0, x1, y0, y1] (the open doorway or the crack), strip
// [x0, x1, y0, y1] (under the door), bubbles [[cx, cy, r], ...] (the daydream)
function herWebcam(D, src, side) {
  herLuts();
  const SW = src.width, S = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, SW, VIEW_H * 2).data;
  const L = HL.lin12, sr = HL.srgb, st = side.strip, bb = side.bubbles || [], row = SW * 4;
  const dr = side.door || [0, 0, 0, 0], sx0 = st ? st[0] : 0, sx1 = st ? st[1] : 0, sy0 = st ? st[2] : 0, sy1 = st ? st[3] : 0;
  const ROOM = HL.room, SIDE = HL.side, gold = HL.gold, pale = HL.pale;
  for (let y = 0; y < VIEW_H; y++) {
    const cy = y * 2 + 1, yb = (y & 7) << 3, inDoorY = cy >= dr[2] && cy < dr[3], inStripY = cy >= sy0 && cy < sy1;
    let p = y * 2 * row, q = y * HP_W * 4;
    for (let x = 0; x < HP_W; x++, p += 8, q += 4) {
      const p2 = p + row;
      const r = sr[(L[S[p]] + L[S[p + 4]] + L[S[p2]] + L[S[p2 + 4]]) >> 2], g = sr[(L[S[p + 1]] + L[S[p + 5]] + L[S[p2 + 1]] + L[S[p2 + 5]]) >> 2], b = sr[(L[S[p + 2]] + L[S[p + 6]] + L[S[p2 + 2]] + L[S[p2 + 6]]) >> 2];
      const cx = x * 2 + 1, inStrip = inStripY && cx >= sx0 && cx < sx1;
      if (inStrip && r > 200 && b < 170) {   // the light under the door: a gold bar with a pale top row
        const c = cy < sy0 + 2 ? pale : gold; D[q] = c[0]; D[q + 1] = c[1]; D[q + 2] = c[2]; continue;
      }
      let her = inStrip || (inDoorY && cx >= dr[0] && cx < dr[1]);
      if (!her) for (let i = 0; i < bb.length; i++) { const B0 = bb[i], dx = cx - B0[0], dy = cy - B0[1]; if (dx * dx + dy * dy <= B0[2] * B0[2]) { her = true; break; } }
      const P0 = her ? SIDE : ROOM, o = (her ? HL.dSide : HL.dRoom)[yb | (x & 7)];
      let r1 = r + o, g1 = g + o, b1 = b + o;
      r1 = r1 < 0 ? 0 : r1 > 255 ? 255 : r1; g1 = g1 < 0 ? 0 : g1 > 255 ? 255 : g1; b1 = b1 < 0 ? 0 : b1 > 255 ? 255 : b1;
      const key = ((r1 >> 2) << 12) | ((g1 >> 2) << 6) | (b1 >> 2), k0 = P0.lut[key], c = P0.rgb[k0 >= 0 ? k0 : herNear(P0, r1, g1, b1)];
      D[q] = c[0]; D[q + 1] = c[1]; D[q + 2] = c[2];
    }
  }
}

// the UI from the game's view (render/herView.ts), with hit regions for the game ({x, y, w, h, act, arg, tip}, grid px)
let HER_HITS = null;
const hhit = (x, y, w, h, act = '', arg = '', tip = '') => { if (HER_HITS) HER_HITS.push({ x, y, w, h, act, arg: String(arg), tip }); };
const C9N = (n, d) => (n != null && C9[n] != null ? C9[n] : d);
function pill9(x, y, w, h, top, bot, o = {}) {   // her pink answer: a name and what it costs (or why not) under it
  const off = o.off, hov = o.hover && !off;
  win9(x, y, w, h, off ? { fill: C9.purple, hi: C9.lilac, lo: C9.plum, edge: C9.plum } : { fill: hov ? C9.rose : C9.pink, hi: C9.skin, lo: C9.rose, edge: C9.plum, shadow: true });
  text(top, x + 4, y + 3, 'tiny', off ? C9.lilac : C9.plum);
  if (bot) text(bot, x + 4, y + 10, 'tiny', off ? C9.pink : o.botCol ?? C9.purple);
}
function herUILive(st, t) {
  // header over the dark wall: a rose heart and her name; her mood in a pill
  heart9(4, 4, true);
  text('Babe', 14, 2, 'tinyL', C9.pink, { shadow: C9.void });
  const [mc, mw] = MOOD9[st.mood] || MOOD9.happy, pw = measure(mw, 'tiny') + 8;
  win9(HP_W - 4 - pw, 3, pw, 10, { fill: C9.plum, hi: C9.purple, lo: C9.plum, edge: C9.purple });
  text(mw, HP_W - 4 - pw + 4, 5, 'tiny', mc);
  hhit(HP_W - 4 - pw, 3, pw, 10, '', '', 'mood');
  // the UI band
  rectI(0, 266, HP_W, HP_H - 266, C9.plum);
  for (let x = 0; x < HP_W; x++) { putI(x, 266, C9.purple); putI(x, 267, chk(x, 267) ? C9.purple : C9.plum); }
  const hk = st.hover || '';
  if (st.heard && !st.chat) {   // ♫ KETTLE · kitchen · now; ? Nothing yet. Listen.; the headset: you hear nothing
    const H0 = st.heard;
    if (H0.glyph === '?') text('?', 5, 270, 'tiny', C9.lilac); else g9(H0.glyph === 'hs' ? 'hs' : 'note', 4, 270, C9N(H0.glyphCol, C9.lilac));
    runs9(H0.parts.map(([s, c]) => [s, C9N(c, C9.lilac)]), 13, 270);
    hhit(0, 268, HP_W, 10, '', '', 'heard');
  }
  if (st.chat) {   // her question: the window grows from 270; her answers as pills
    const c = st.chat, y = 270, lines = wrap9(c.q, 128).slice(0, 2);
    let ax = 7, ay = y + 14 + lines.length * 8, rows = 1;
    c.a.forEach((a) => { const w = measure(a.text, 'tiny') + 9; if (ax + w > 140) { ax = 7; rows++; } ax += w + 3; });
    const h = 13 + lines.length * 8 + rows * 13 + 2;
    win9(3, y, 141, h);
    text(c.label, 8, y + 4, 'tiny', C9.rose); if (c.right) text(c.right, 137, y + 4, 'tiny', C9.purple, { align: 'r' });
    lines.forEach((l, k) => text(l, 8, y + 13 + k * 8, 'tiny', C9.plum));
    ax = 7;
    c.a.forEach((a) => {
      const w = measure(a.text, 'tiny') + 9; if (ax + w > 140) { ax = 7; ay += 13; }
      const hov = hk === a.act + ':' + a.arg;
      win9(ax, ay, w, 11, { fill: hov ? C9.pink : C9.moon, hi: hov ? C9.skin : C9.moon, lo: hov ? C9.rose : C9.beige, edge: hov ? C9.plum : C9.purple, shadow: hov });
      text(a.text, ax + 4, ay + 3, 'tiny', C9.plum);
      hhit(ax, ay, w, 11, a.act, a.arg, a.tip || ''); ax += w + 3;
    });
  } else if (st.win) {   // a window of hers: a label, the seconds at the right, her line, a bar, her answers as pills
    const A = st.win, lines = A.line ? wrap9(A.line, 128).slice(0, 2) : [], bh = A.bar != null ? 9 + (A.barLabels ? 7 : 0) : 0, ph = A.pills ? 21 : 0;
    const y = A.top ?? 279, h = 13 + lines.length * 8 + bh + ph + 2;
    win9(3, y, 141, h, A.warm ? { fill: C9.beige, edge: C9.brown } : {});
    if (A.line2 === 'alarm') { const on = Math.floor(t * 4) & 1; for (let i = 5; i < 142; i++) putI(i, y + 2, (chk(i, 0) ^ on) ? C9.crimson : C9.moon); }
    else if (A.pink) { const on = Math.floor(t * (A.fast ? 8 : 3)) & 1; for (let i = 5; i < 142; i++) putI(i, y + 2, (chk(i, 0) ^ on) ? C9.rose : C9.moon); }   // her tease (#85): pink where footsteps have amber
    else if (A.warm) for (let i = 5; i < 142; i++) putI(i, y + 2, chk(i, 0) ? C9.gold : C9.moon);
    text(A.label, 8, y + 5, 'tiny', C9N(A.labelCol, C9.rose));
    if (A.look != null) { for (let k = 0; k < 3; k++) heart9(118 + k * 8, y + 4, k < A.look); }   // the 3 s of looking she wants
    else if (A.right) text(A.right, 137, y + 5, 'tiny', C9.purple, { align: 'r' });
    lines.forEach((l, k) => text(l, 8, y + 13 + k * 8, 'tiny', C9.plum));
    let yy = y + 14 + lines.length * 8;
    if (A.bar != null) {
      bar9(8, yy, 130, A.bar, C9N(A.barCol, C9.rose), A.marks || []);
      if (A.barLabels) A.barLabels.forEach(([m, s]) => text(s, 9 + Math.round(128 * m), yy + 6, 'tiny', C9.brown, { align: m >= 1 ? 'r' : 'c' }));
      if (A.barTip) hhit(8, yy - 1, 130, A.barLabels ? 14 : 7, '', '', A.barTip);
      yy += bh;
    }
    if (A.pills) {
      let px = 7;
      A.pills.forEach((q) => {
        const w = Math.max(measure(q.name, 'tiny'), measure(q.cost || '', 'tiny')) + 9;
        pill9(px, yy, w, 18, q.name, q.cost, { hover: hk === q.act + ':' + q.arg });
        hhit(px, yy, w, 18, q.act, q.arg, q.tip || ''); px += w + 4;
      });
    }
  } else if (st.note) {   // her note: what she is up to as far as you can tell
    const N0 = st.note, y = 279, warn = N0.tone === 'warn', alarm = N0.tone === 'alarm';
    win9(3, y, 141, 29, warn || alarm ? { fill: C9.beige, edge: C9.brown } : {});
    if (warn) for (let i = 5; i < 142; i++) putI(i, y + 2, chk(i, 0) ? C9.gold : C9.moon);
    if (alarm) { const on = Math.floor(t * 4) & 1; for (let i = 5; i < 142; i++) putI(i, y + 2, (chk(i, 0) ^ on) ? C9.crimson : C9.moon); }
    text(N0.label, 8, y + 5, 'tiny', alarm ? C9.crimson : warn ? C9.brown : C9.rose);
    wrap9(N0.body, 128).slice(0, 2).forEach((l, k) => text(l, 8, y + 13 + k * 8, 'tiny', C9.plum));
  }
  if (st.buttons) {   // what you can do before she comes: two pink buttons
    st.buttons.slice(0, 2).forEach((q, k) => {
      const bx = 3 + k * 72, by = 310;
      pill9(bx, by, 69, 17, q.name, q.sub, { off: q.off, hover: hk === q.act + ':' + q.arg, botCol: q.subCol ? C9N(q.subCol) : undefined });
      hhit(bx, by, 69, 17, q.off ? '' : q.act, q.arg, q.tip || '');
    });
  }
  // stats: fixed slots at the bottom
  const HS = st.stats, sy = 331;
  text('Patience', 4, sy, 'tiny', C9.beige);
  for (let k = 0; k < 5; k++) heart9(42 + k * 8, sy - 1, k < HS.patience);
  text('Caught', 88, sy, 'tiny', C9.beige);
  for (let k = 0; k < 3; k++) heart9(119 + k * 8, sy - 1, k < HS.caught, 'caught');
  hhit(0, sy - 1, 84, 9, '', '', 'patience'); hhit(84, sy - 1, 64, 9, '', '', 'caught');
  text('Goodwill', 4, sy + 10, 'tiny', C9.beige); bar9(42, sy + 10, 92, HS.goodwill / 100, C9.rose, HS.gwMarks || []); text(String(HS.goodwill), 144, sy + 10, 'tiny', C9.beige, { align: 'r' });
  if (st.gwTag) { const w = measure(st.gwTag, 'tiny') + 4, x = Math.min(134 - w, 42 + Math.round(92 * HS.goodwill / 100) + 2); rectI(x, sy + 9, w, 7, C9.plum); text(st.gwTag, x + 2, sy + 10, 'tiny', C9.pink); }
  hhit(0, sy + 9, HP_W, 9, '', '', 'goodwill');
  text('Noise', 4, sy + 20, 'tiny', C9.beige); bar9(42, sy + 20, 92, HS.noise / 100, C9.gold, HS.noiseMarks || []); text(String(HS.noise), 144, sy + 20, 'tiny', C9.beige, { align: 'r' });
  hhit(0, sy + 19, HP_W, 9, '', '', 'noise');
}
let HER_IMG = null, HER_UI = null;   // HER_UI: the last UI layer (palette indexes, -1 clear), its hits and its key
function drawHerLive(src, st, t) {
  if (!HER_CANVAS) { HER_CANVAS = document.createElement('canvas'); HER_CANVAS.width = HP_W; HER_CANVAS.height = HP_H; }
  // the UI is drawn again only when what it shows changes (its blinking lines tick at 4 Hz)
  const blink = st.note?.tone === 'alarm' || st.win?.line2 === 'alarm' ? Math.floor(t * 4) & 1 : 0;
  const key = JSON.stringify([st.mood, st.heard, st.note, st.win, st.chat, st.buttons, st.stats, st.hover, st.gwTag, blink, st.win && (st.win.pink || st.win.line2) ? Math.floor(t * 8) : 0]);   // a blinking top line redraws
  if (!HER_UI || HER_UI.key !== key) {
    setRes(HP_W, HP_H); CLIP = null;
    const G = buf('herPC', HP_W, HP_H); G.I.fill(-1); bind(G);
    HER_HITS = []; herUILive(st, t);
    HER_UI = { key, I: Int8Array.from(G.I), hits: HER_HITS }; HER_HITS = null;
  }
  const ctx = HER_CANVAS.getContext('2d'), img = HER_IMG || (HER_IMG = ctx.createImageData(HP_W, HP_H)), D = img.data, UI = HER_UI.I;
  herWebcam(D, src, st.side || {});
  for (let i = 0, p = 0; i < HP_W * HP_H; i++, p += 4) { D[p + 3] = 255; const c = UI[i]; if (c < 0) continue; const q = PC98_RGB[c]; D[p] = q[0]; D[p + 1] = q[1]; D[p + 2] = q[2]; }
  ctx.putImageData(img, 0, 0);
  return { canvas: HER_CANVAS, hits: HER_UI.hits };
}
