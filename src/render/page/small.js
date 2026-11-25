// ===========================================================================
// The small pieces: the Goblin Fuel inspect window, How to hide, coach marks, tooltips (desk, Windows 98, hers),
// pause, away from the PC (the empty chair) and the microsleep. Each one draws over the 640 x 360 frame.
// Real life is the desk's glass and Tiny5; the PC is Windows 98; hers are her PC-98 windows; the RPG keeps its own
// tooltip card (section 5c). Everything is palette-exact UI; only the chair and the eyelids are shaded (dithered).
// ===========================================================================
let SMALL = 'off', SMALL_T = 0;
const SM = { buf: null, canvas: null, w: 0, h: 0 };
// draw into a transparent buffer in the desk's palette (EB_PAL: the desk's 34 slots, the acid ramp, the can's print)
function smLayer(w, h, draw, pal = EB_RGB) {
  if (!SM.buf || SM.w !== w || SM.h !== h) { SM.buf = mkBuf(w, h, true); SM.canvas = document.createElement('canvas'); SM.canvas.width = w; SM.canvas.height = h; SM.w = w; SM.h = h; }
  setRes(w, h); CLIP = null; const F = SM.buf; F.I.fill(-1); bind(F);
  draw();
  const ctx = SM.canvas.getContext('2d'), img = ctx.createImageData(w, h), D = img.data;
  for (let k = 0; k < w * h; k++) { const q = F.I[k]; if (q < 0) continue; const c = pal[q]; D[k * 4] = c[0]; D[k * 4 + 1] = c[1]; D[k * 4 + 2] = c[2]; D[k * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return SM.canvas;
}
// dim a part of the frame to k (the energy break's dim, back into the desk's and her colours), a soft shadow
// round the rectangle that stays lit (sx, sy, sw, sh) if given
function smDim(ctx, area, k0 = 0.42, keep = null) {
  const [ax, ay, aw, ah] = area || [0, 0, 640, 360], img = ctx.getImageData(ax, ay, aw, ah), D = img.data;
  for (let j = 0; j < ah; j++) for (let i = 0; i < aw; i++) {
    const X = ax + i, Y = ay + j; let k = k0;
    if (keep) { const [x, y, w, h] = keep, ex = Math.max(x + 3 - X - 0.5, X + 0.5 - (x + w + 3), 0), ey = Math.max(y + 5 - Y - 0.5, Y + 0.5 - (y + h + 5), 0), d = Math.hypot(ex, ey); k = k0 * (d < 8 ? 0.55 + 0.45 * (d / 8) : 1); }
    const o = (j * aw + i) * 4, th = (BAYER8[((Y & 7) << 3) | (X & 7)] - 0.5) * 16;
    const c = dimNearest(Math.max(0, Math.min(255, Math.round(D[o] * k + th))), Math.max(0, Math.min(255, Math.round(D[o + 1] * k + th))), Math.max(0, Math.min(255, Math.round(D[o + 2] * k + th))));
    D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2];
  }
  ctx.putImageData(img, ax, ay);
}
// the desk's glass window (as the energy break's): s1 fill, a lit top edge, round-ish corners, a close box
function smGlass(x, y, w, h, o = {}) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = i < 2 || i >= w - 2, cy = j < 2 || j >= h - 2;
    if (cx && cy && (i === 0 || i === w - 1) && (j === 0 || j === h - 1)) continue;
    if (cx && cy && (i === 0 || i === w - 1 || j === 0 || j === h - 1)) { putI(x + i, y + j, o.edge ?? P.s2); continue; }
    putI(x + i, y + j, j === 0 ? o.top ?? P.s3 : i === 0 || i === w - 1 || j === h - 1 ? o.edge ?? P.s2 : o.fill ?? P.s1);
  }
}
const smClose = (x, y) => { rectI(x, y, 10, 10, P.s2); frameI(x, y, 10, 10, P.s3); glyph('cross', x + 3, y + 3, P.u5); };
// a gold button (the next action) and a plain one; a key cap after the label when given
function smBtn(x, y, w, label, o = {}) {
  const gold = o.gold, h = 13;
  rectI(x + 1, y + 1, w - 2, h, gold ? P.copper : P.void);
  rectI(x + 1, y, w - 2, h, gold ? P.gold : P.s2); rectI(x, y + 1, w, h - 2, gold ? P.gold : P.s2);
  if (!gold) { rectI(x + 1, y, w - 2, 1, P.s3); }
  const cw = o.key ? measure(o.key, 'tiny') + 6 : 0, lw = measure(label, 'tiny'), tx0 = Math.round(x + w / 2 - (lw + (cw ? cw + 4 : 0)) / 2);
  text(label, tx0, y + 4, 'tiny', gold ? P.void : P.moon);
  if (cw) { const kx = tx0 + lw + 4; rectI(kx, y + 2, cw, 9, gold ? P.copper : P.s1); rectI(kx, y + 2, cw, 8, gold ? P.pale : P.s3); text(o.key, kx + cw / 2, y + 3, 'tiny', P.void, { align: 'c' }); }
}
// + and - bullets (moss / crimson), the words in bone; returns the next y
function smBullets(x, y, w, lines) {
  for (const [sign, s, col] of lines) {
    const ws = wrapTiny(s, w - 8);
    if (sign) { const c = sign === '+' ? P.g5 : P.crimson; rectI(x, y + 2, 3, 1, c); if (sign === '+') rectI(x + 1, y + 1, 1, 3, c); }
    ws.forEach((l, k) => text(l, x + 7, y + k * 8, 'tiny', col ?? P.u6));
    y += ws.length * 8 + 2;
  }
  return y;
}
function wrapTiny(s, w) { const out = []; let cur = ''; for (const word of s.split(' ')) { const n = cur ? cur + ' ' + word : word; if (measure(n, 'tiny') > w && cur) { out.push(cur); cur = word; } else cur = n; } if (cur) out.push(cur); return out; }
function smSprite(name, x, y, o = {}) { const S = EB_SPR[name]; for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) { const k = S.a[j * S.w + i]; if (k === 255) continue; putI(x + i, y + j, o.dim ? (k ? P.s2 : k) : k); } return S; }
const smMarch = (x, y, w, h, t, idx = P.gold) => {   // a marching dashed ring (2 on, 2 off)
  const per = 2 * (w + h), off = Math.floor(t * 8);
  for (let k = 0; k < per; k++) {
    if (((k + off) >> 1) & 1) continue;
    const p = k < w ? [x + k, y] : k < w + h ? [x + w - 1, y + k - w] : k < 2 * w + h ? [x + w - 1 - (k - w - h), y + h - 1] : [x, y + h - 1 - (k - 2 * w - h)];
    putI(p[0], p[1], idx);
  }
};

// ---------------------------------------------------------------- the Goblin Fuel inspect window
// It opens once, the first time you have cans (the night the drink comes in, or your first pack from the Shop):
// the can big, what it does, how many you have. Drink · G starts the energy break; Later (or the close box) shuts it.
// After that the Drink button's tooltip says the same in three lines, and G or Drink goes straight to the break.
const INSPECT = [96, 40, 300, 214];   // right-screen px
const INSPECT_PAGE = { cans: 3, max: 8, bullets: [['+', 'Party 30% faster for 60 s.'], ['+', 'Tiredness -35.'], ['-', 'Then a sugar crash: 15% slower for 20 s, Tiredness +10.']],
  pour: 'Pour it well: 85% down for the full boost, 60% for half.', shop: true };
function inspectWindow(t, o = INSPECT_PAGE) {
  const [, , w, h] = INSPECT;
  return smLayer(w, h, () => {
    smGlass(0, 0, w, h);
    text('In your drawer', 8, 6, 'tiny', P.moon); if (o.tag ?? 'New tonight') text(o.tag ?? 'New tonight', 8 + measure('In your drawer', 'tiny') + 8, 6, 'tiny', P.gold);
    smClose(w - 15, 4);
    // the can on an acid glow, standing on its shadow
    const cx = 52, cy = 116;
    for (let j = -84; j <= 84; j++) for (let i = -46; i <= 46; i++) {
      const d = Math.hypot(i / 46, j / 84); if (d > 1) continue;
      const v = (1 - d) * 0.9 + 0.08 * Math.sin(t * 2), b = BAYER8[(((cy + j) & 7) << 3) | ((cx + i) & 7)];
      if (v > b * 0.9 + 0.5) putI(cx + i, cy + j, EBX.a2); else if (v > b * 0.9 + 0.12) putI(cx + i, cy + j, EBX.a1);
    }
    for (let i = -30; i <= 30; i++) for (let j = -4; j <= 4; j++) if ((i / 30) ** 2 + (j / 4) ** 2 <= 1 && ((i + j) & 1) === 0) putI(cx + i, 196 + j, P.void);
    const bob = Math.round(Math.sin(t * 1.6) * 1);
    smSprite('can76', cx - 36, 22 + bob);
    // the right column
    let x = 104, y = 22;
    text('Goblin Fuel', x, y, 'tinyL', P.moon); y += 15;
    text('100% greed. Tastes like a loot drop.', x, y, 'tiny', P.u5); y += 13;
    y = smBullets(x, y, w - x - 10, o.bullets);
    y += 2;
    for (const l of wrapTiny(o.pour, w - x - 10)) { text(l, x, y, 'tiny', P.s5); y += 8; }
    y += 6;
    // how many: the cans in the drawer, 3 of 8
    for (let k = 0; k < o.max; k++) smSprite('can15', x + k * 18, y, { dim: k >= o.cans });
    y += 40;
    text(o.cans + ' of ' + o.max + ' in the drawer.', x, y, 'tiny', P.u6);
    if (o.shop) {
      const sh = typeof o.shop === 'object' ? o.shop : { zl: 29, cans: 'four' }, s1 = 'More in the Shop: ' + sh.zl + ' z', zw = measure(s1, 'tiny');
      text(s1, x, y + 9, 'tiny', P.s5); glyph('lstroke', x + zw - 1, y + 8, P.s5); text('for ' + sh.cans + '.', x + zw + 5, y + 9, 'tiny', P.s5);
    } else if (o.more) text(o.more, x, y + 9, 'tiny', P.s5);
    // what to do
    smBtn(x, h - 22, 104, 'Drink', { gold: true, key: 'G' });
    smBtn(x + 110, h - 22, 70, 'Later');
  });
}

// ---------------------------------------------------------------- How to hide
// The night waits. Only tonight's tiles show (handoff step 5); what came in tonight carries a gold "new tonight".
const HOWTO_TILES = {
  listen: ['Listen', 'Her TV, kettle, shower, steps. The line under your door says what you heard last. Hold the door to peek.'],
  tab: ['Tab to Excel', 'Footsteps? Press Tab now. Switching takes a second or two, so never wait for the handle.'],
  answer: ['Answer her', 'Each visit wants something else. Plates clinking: a snack run. Humming: she wants to talk.'],
  headset: ['Headset (H)', 'Click your head or press H. After 30 s you are in the Zone: faster Flow, more loot. But you cannot hear her coming.'],
  lean: ['Lean in', 'Hold the door open: you lean in and see what she is doing. Move the mouse to look. While you look you cannot play, and she can see you.'],
};
function howtoArt(id, x, y, t) {   // 64 x 40 pictures in the desk's colours
  rectI(x, y, 64, 40, P.void);
  if (id === 'listen') {   // your door, the light under it, her sound coming through
    rectI(x + 14, y + 4, 24, 32, P.s2); frameI(x + 14, y + 4, 24, 32, P.s3); rectI(x + 33, y + 19, 2, 3, P.s4);
    rectI(x + 14, y + 36, 24, 2, P.gold); rectI(x + 14, y + 38, 24, 1, P.copper);
    const ph = Math.floor(t * 3) % 3;
    for (let r = 0; r < 3; r++) for (let a = -5; a <= 5; a++) { const R = 6 + r * 5; putI(x + 42 + Math.round(Math.cos(a / 7) * R), y + 20 + Math.round(Math.sin(a / 7) * R), r === ph ? P.d6 : P.d4); }
  } else if (id === 'tab') {   // the Tab key, then Excel up
    rectI(x + 4, y + 16, 20, 13, P.s1); rectI(x + 4, y + 14, 20, 13, P.s4); rectI(x + 5, y + 14, 18, 1, P.s5); text('Tab', x + 14, y + 18, 'tiny', P.void, { align: 'c' });
    rectI(x + 27, y + 21, 5, 1, P.moon); putI(x + 31, y + 20, P.moon); putI(x + 31, y + 22, P.moon);
    rectI(x + 35, y + 8, 26, 26, P.u6); rectI(x + 35, y + 8, 26, 4, P.wnavy); rectI(x + 48, y + 8, 13, 4, P.wsky);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) frameI(x + 36 + i * 6, y + 13 + j * 4, 7, 5, P.u4);
    rectI(x + 37, y + 14, 5, 3, P.g5);
  } else if (id === 'answer') {   // her note at your door, a question
    rectI(x + 8, y + 6, 48, 26, P.u6); frameI(x + 8, y + 6, 48, 26, P.d3); rectI(x + 9, y + 7, 46, 1, P.moon);
    rectI(x + 16, y + 32, 6, 2, P.u6); putI(x + 16, y + 34, P.u6); putI(x + 15, y + 35, P.u6);
    text('?!', x + 32, y + 15, 'tinyL', P.d6, { align: 'c' });
  } else if (id === 'lean') {   // your door held open: a slit of her flat, lit warm, her small in it; the lean's stops
    rectI(x + 8, y + 3, 24, 34, P.s2); frameI(x + 8, y + 3, 24, 34, P.s3); rectI(x + 27, y + 19, 2, 3, P.s4);
    rectI(x + 32, y + 3, 6, 34, P.u5); rectI(x + 33, y + 3, 4, 34, P.u6); rectI(x + 32, y + 30, 6, 7, P.u4);
    const bob = Math.floor(t * 2) % 2;
    rectI(x + 34, y + 13 - bob, 2, 2, P.void); rectI(x + 34, y + 15 - bob, 2, 1, P.d6); rectI(x + 33, y + 16 - bob, 4, 6, P.d6); rectI(x + 34, y + 22 - bob, 1, 7, P.arcane); rectI(x + 35, y + 22 - bob, 1, 7, P.arcane);
    rectI(x + 38, y + 3, 5, 34, P.s3); rectI(x + 43, y + 3, 2, 34, P.s1);
    text('1', x + 48, y + 6, 'tiny', P.d6); text('2', x + 48, y + 16, 'tiny', P.d6); text('3', x + 48, y + 26, 'tiny', P.d6);
    for (let k = 0; k < 3; k++) { putI(x + 27 - k, y + 39 - 1 + k, P.gold); putI(x + 43 + k, y + 39 - 1 + k, P.gold); }
    rectI(x + 25, y + 39, 21, 1, P.gold);
  } else if (id === 'headset') {   // the headset, its cups lit cyan
    for (let a = 0; a <= 32; a++) { const an = Math.PI + (a / 32) * Math.PI; putI(x + 32 + Math.round(Math.cos(an) * 16), y + 26 + Math.round(Math.sin(an) * 16), P.s4); putI(x + 32 + Math.round(Math.cos(an) * 15), y + 26 + Math.round(Math.sin(an) * 15), P.s3); }
    for (const sx of [12, 44]) { rectI(x + sx, y + 22, 8, 14, P.s3); rectI(x + sx + 1, y + 23, 6, 12, P.s2); rectI(x + (sx < 30 ? sx + 7 : sx - 1), y + 24, 2, 10, P.s6); }
    for (let k = 0; k < 8; k++) putI(x + 18 + k, y + 36 + (k >> 2), P.s4);
  }
}
// Tuesday (week one): the listening tiles, then the two that came in tonight, the headset and lean in
const HOWTO_IDS = ['listen', 'tab', 'answer', 'headset', 'lean'], HOWTO_NEW = ['headset', 'lean'];
const HOWTO_PAGE = { ids: HOWTO_IDS, isNew: HOWTO_NEW, tiles: HOWTO_TILES, head: 'Tuesday, 20:00',
  foot: 'The party fights by itself. Fire skills and pick floors when you like. Every catch costs her patience (the hearts): when they run out, she pulls the plug.' };
const HOWTO_TH = (tw, o = HOWTO_PAGE) => 70 + Math.max(...o.ids.map((id) => wrapTiny(o.tiles[id][1], tw - 12).length)) * 8 + 4;
const howtoTW = (o) => Math.floor((452 - 24 - 4 * (o.ids.length - 1)) / o.ids.length);   // 104 for four, 82 for five; three (Monday) fill the card
function howtoH(o = HOWTO_PAGE) { const tw = howtoTW(o); return 42 + HOWTO_TH(tw, o) + 8 + wrapTiny(o.foot, 452 - 24).length * 8 + 6 + 24; }
function howtoCard(t, o = HOWTO_PAGE) {
  const w = 452, h = howtoH(o);
  return smLayer(w, h, () => {
    smGlass(0, 0, w, h);
    text(o.head, 12, 9, 'tiny', P.s5); text('How to hide', 12 + measure(o.head, 'tiny') + 8, 9, 'tiny', P.gold);
    text('Hide the game before she sees it.', 12, 22, 'tinyL', P.moon);
    const ids = o.ids, tw = howtoTW(o), th = HOWTO_TH(tw, o);
    ids.forEach((id, k) => {
      const x = 12 + k * (tw + 4), y = 42, isNew = o.isNew.includes(id);
      rectI(x, y, tw, th, P.s2); rectI(x, y, tw, 1, P.s3);
      if (isNew) frameI(x - 1, y - 1, tw + 2, th + 2, P.gold);
      howtoArt(id, x + Math.round((tw - 64) / 2), y + 8, t);
      const [ti, body] = o.tiles[id];
      rectI(x + 6, y + 55, 9, 9, isNew ? P.gold : P.s4); text(String(k + 1), x + 10, y + 57, 'tiny', P.void, { align: 'c' });
      text(ti, x + 19, y + 57, 'tiny', P.moon);
      wrapTiny(body, tw - 12).forEach((l, n) => text(l, x + 6, y + 70 + n * 8, 'tiny', P.u6));
      if (isNew) { const s = 'new tonight', sw = measure(s, 'tiny') + 6; rectI(x + tw - sw - 4, y + 4, sw, 9, P.gold); text(s, x + tw - sw / 2 - 4, y + 6, 'tiny', P.void, { align: 'c' }); }
    });
    const foot = wrapTiny(o.foot, w - 24);
    foot.forEach((l, n) => text(l, 12, 42 + th + 8 + n * 8, 'tiny', P.s5));
    smBtn(w / 2 - 50, h - 24, 100, 'Got it', { gold: true });
  });
}

// ---------------------------------------------------------------- coach marks
// The core loop's first moments (#42): a marching gold ring round the thing itself and a glass callout beside it,
// while the game crawls until you do it. One look everywhere: they are the game talking, not one of its worlds.
const COACHES = {
  steps: { title: 'Footsteps!', text: 'She is coming. Press Tab now: Excel has to be up before she opens the door.', side: 'over' },
  door: { title: 'She is at your door', text: 'What she wants is in her note, under your door. Answer her there.', side: 'right' },
  phone: { title: 'Your phone', text: 'Someone wants you. Click the phone to answer.', side: 'right' },
  loot: { title: 'Loot!', text: 'A green arrow means an upgrade. Right-click it to equip it, or drag it onto a hero.', side: 'left' },
  windup: { title: 'Big attack incoming', text: 'The boss winds up. Hit a skill now: Bash, Ward or Taunt.', side: 'above' },
  headset: { title: 'Your headset', text: 'Click your head (or press H) to put it on. In the Zone you loot more, but you cannot hear her.', side: 'right' },
  lean: { title: 'Lean in', text: 'She is doing yoga. Hold the door open and you lean in to watch. How far along she is tells you how long you have.', side: 'right' },
  leanview: { title: 'You are leaning in', text: 'Move the mouse to look: 1 2 3 are the rooms. The wheel opens the door wider, the right button looks closer. Let go of the door to get back to the game.', side: 'right' },
  tell: { title: 'She is turning', text: 'Her head turns toward your door. Let go now, or she sees you. The wider the door, the faster the red bar fills.', side: 'right', x: () => 148 + LEAN_LAST.xr + 10 },
};
function coachTarget(id) {   // the frame rectangle each one points at
  if (id === 'steps') return [157, 8, 474, 232];
  if (id === 'door') return [2, 269, 144, 59];
  if (id === 'headset') return [52, 198, 50, 46];
  if (id === 'loot') return [495, 132, 133, 66];
  if (id === 'windup') return [157, 213, 334, 28];
  if (id === 'lean') return [80, 20, 44, 168];   // the door in the webcam view
  if (id === 'leanview') return [148 + LEAN_LAST.xl - 2, 30, LEAN_LAST.xr - LEAN_LAST.xl + 4, 290];   // the slit
  if (id === 'tell') return [148 + 201, 5, 92, 12];   // the eye and the red bar over the slit
  // the phone on the desk: its corners through the desk's camera
  const c = [phoneLocal(-1, 0), phoneLocal(1, 0), phoneLocal(1, 1), phoneLocal(-1, 1)].map(([x, y]) => [x + 148, y]);
  const x0 = Math.min(...c.map((p) => p[0])), x1 = Math.max(...c.map((p) => p[0])), y0 = Math.min(...c.map((p) => p[1]));
  return [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1 - x0) + 4, 360 - Math.floor(y0) + 2];
}
function drawCoach(ctx, id, t) {
  const C = COACHES[id], [tx, ty, tw, th] = coachTarget(id), w = 150;
  const lines = wrapTiny(C.text, w - 16), h = 22 + lines.length * 8 + 14;
  let x, y;
  if (C.side === 'over') { x = tx + Math.round(tw / 2 - w / 2); y = ty + 30; }
  else if (C.side === 'right') { x = C.x ? Math.max(tx + tw + 10, C.x()) : tx + tw + 10; y = Math.min(360 - h - 4, ty + Math.round(th / 2 - h / 2)); }
  else if (C.side === 'left') { x = tx - w - 10; y = ty + Math.round(th / 2 - h / 2); }
  else if (C.side === 'below') { x = tx + Math.round(tw / 2 - w / 2); y = ty + th + 10; }
  else { x = tx + Math.round(tw / 2 - w / 2); y = ty - h - 10; }
  x = Math.max(4, Math.min(636 - w, x)); y = Math.max(4, y);
  const L = smLayer(640, 360, () => {
    smMarch(tx - 2, ty - 2, tw + 4, th + 4, t); smMarch(tx - 3, ty - 3, tw + 6, th + 6, t + 0.25, P.copper);
    // the pointer: a small gold wedge from the callout toward the target
    const mx = Math.max(tx + 6, Math.min(tx + tw - 6, x + w / 2)), my = Math.max(ty + 6, Math.min(ty + th - 6, y + h / 2));
    const wy = Math.max(y + 7, Math.min(y + h - 7, ty + Math.round(th / 2)));   // the wedge points at the target's middle
    if (C.side === 'right') { for (let k = 0; k < 6; k++) rectI(x - 1 - k, wy - (5 - k), 1, (5 - k) * 2 + 1, P.gold); if (x - 6 > tx + tw + 3) rectI(tx + tw + 3, wy, x - 6 - (tx + tw + 3), 1, P.gold); }
    else if (C.side === 'left') for (let k = 0; k < 6; k++) rectI(x + w + k, y + Math.round(h / 2) - (5 - k), 1, (5 - k) * 2 + 1, P.gold);
    else if (C.side === 'above') for (let k = 0; k < 6; k++) rectI(Math.round(mx) - (5 - k), y + h + k, (5 - k) * 2 + 1, 1, P.gold);
    else if (C.side === 'below') for (let k = 0; k < 6; k++) rectI(Math.round(mx) - (5 - k), y - 1 - k, (5 - k) * 2 + 1, 1, P.gold);
    shadowFlatSm(x + 2, y + 3, w, h);
    smGlass(x, y, w, h, { top: P.gold, edge: P.copper });
    text(C.title, x + 8, y + 6, 'tiny', P.gold);
    lines.forEach((l, k) => text(l, x + 8, y + 17 + k * 8, 'tiny', P.moon));
    text('The game crawls until you do it.', x + 8, y + h - 11, 'tiny', P.s5);
    smClose(x + w - 14, y + 4);
  });
  ctx.drawImage(L, 0, 0);
  return [x, y, w, h];
}
function smPtr(x, y, ink = P.void, fill = P.moon) { PTR_ARROW.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'v') putI(x + i, y + j, ink); else if (c === 'M') putI(x + i, y + j, fill); })); }
function shadowFlatSm(x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if ((i + j) & 1) putI(i, j, P.void); }

// ---------------------------------------------------------------- tooltips: 2 to 6 lines next to the pointer
// Desk glass on the desk, the Windows 98 yellow on the PC, her paper on her panel. The RPG's is section 5c's card.
function drawTip(ctx, id, t) {
  if (id === 'her') {   // her panel: the plan's corner. Her PC-98 paper and her colours
    const x = 30, y = 112, w = 112, h = 34;
    const L = smLayer(640, 360, () => {
      win9(x, y, w, h);
      text('The plan', x + 6, y + 5, 'tiny', C9.plum);
      text('Who hears you, what the crack', x + 6, y + 14, 'tiny', C9.brown);
      text('shows. Click it to open it.', x + 6, y + 22, 'tiny', C9.brown);
      smPtr(18, 104, C9.void, C9.moon);
    }, PC98_RGB);
    ctx.drawImage(L, 0, 0); return;
  }
  const L = smLayer(640, 360, () => {
    if (id === 'desk') {   // the Drink button on the YOU card
      const bx = 148 + 446, by = 276, w = 156, h = 58, x = 640 - w - 4, y = 267 - h - 4;
      shadowFlatSm(x + 2, y + 3, w, h);
      smGlass(x, y, w, h);
      text('Goblin Fuel', x + 6, y + 5, 'tiny', P.moon); text('Drink (G)', x + w - 6, y + 5, 'tiny', P.s5, { align: 'r' });
      const ny = smBullets(x + 6, y + 16, w - 10, [['+', 'Party 30% faster for 60 s, Tiredness -35.'], ['-', 'Then a crash: 15% slower for 20 s.']]);
      text('3 of 8 in the drawer.', x + 6, ny + 1, 'tiny', P.s5);
      smPtr(bx + 6, by + 6);
    } else if (id === 'task') {   // the taskbar's Sleep button: the Windows 98 tooltip, pale yellow with a black line
      const s1 = 'Go to bed: ends the night.', s2 = 'Greyed until 23:00.', w = Math.max(measure(s1, 'tiny'), measure(s2, 'tiny')) + 8, x = 157 + 340 - w + 40, y = 223;
      rectI(x, y, w, 21, P.pale); frameI(x, y, w, 21, P.void);
      text(s1, x + 4, y + 3, 'tiny', P.void); text(s2, x + 4, y + 11, 'tiny', P.void);
      smPtr(157 + 395, 244);
    }
  });
  ctx.drawImage(L, 0, 0);
}

// ---------------------------------------------------------------- pause: blacked out so it can't be used to peek
function drawPause(ctx, t) {
  ctx.fillStyle = '#0a0814'; ctx.fillRect(0, 0, 640, 360);
  const w = 232, h = 92;
  const L = smLayer(w, h, () => {
    smGlass(0, 0, w, h);
    text('Paused', 12, 10, 'tinyL', P.moon);
    wrapTiny('The screen is blacked out so pausing can\'t be used to peek.', w - 24).forEach((l, n) => text(l, 12, 28 + n * 8, 'tiny', P.s5));
    smBtn(12, h - 26, 100, 'Resume', { gold: true, key: 'Esc' });
    smBtn(120, h - 26, 100, 'How to hide');
  });
  ctx.drawImage(L, 320 - w / 2, 180 - h / 2);
}

// ---------------------------------------------------------------- away from the PC: the empty chair
// Charging the phone (15 s): you're up and gone. The right screen dims (it's what she would see), your chair,
// pushed back and turned a little, stands in front of the desk lit by the monitor, and a small card says why.
function awayChair() {
    // the gaming chair from behind (the same shape as in the webcam, her.js CHAIR): black, its back to you and away
    // from the monitor, so in its own shadow; the screen just catches its edges in grey, the piping inset along them,
    // the armrests' ends beside it.
    const S = 1.8, cx = 236, top = 236, reg = (x, y) => chairRegion((x - cx) / S, (y - top) / S, true);   // the webcam's shape, the same chair
    for (let y = top; y < 360; y++) for (let x = cx - 100; x <= cx + 100; x++) {
      const m = reg(x, y); if (!m || m === 2) continue;                 // the seat is hidden behind its own back
      const up = reg(x, y - 1) !== m, up2 = reg(x, y - 2) !== m, lf = reg(x - 1, y) !== m, rt = reg(x + 1, y) !== m;
      const r = (y - top) / S, b = BAYER8[((y & 7) << 3) | (x & 7)], dx = Math.abs(x - cx) / S;
      let c;
      if (m >= 3) c = up ? P.s3 : lf || rt ? P.s2 : P.void;                                // the armrests' ends
      else if (up) c = P.s3; else if (up2) c = P.s2;                                      // the top edge catches a little of the screen
      else if (lf || rt) c = P.s2;                                                         // the sides, a thin grey rim
      else {
        const hw = chairSideCam(r), t = r - chairTop((x - cx) / S, 23);
        const pip = (Math.abs(dx - (hw - 1.6)) < 0.3 && t > 1.6) || (Math.abs(t - 1.8) < 0.3 && dx < hw - 1.6);
        if (pip) c = P.s1;                                                                 // the piping, inset along the arch and the sides
        else c = (0.06 - 0.04 * dx / hw) > b * 0.4 ? P.s1 : P.void;                        // black, in its own shadow
      }
      putI(x, y, c);
    }
}
function awayCard(t, o = {}) {
    // the card
    const w = 176, h = 52, x = 160, y = 96;
    smGlass(x, y, w, h);
    text('Away from the PC', x + 8, y + 6, 'tiny', P.moon); smClose(x + w - 14, y + 4);
    const T = o.total || 15, left = T - (t % T);
    text((o.what || 'Charging your phone') + ' · ' + Math.ceil(left) + ' s', x + 8, y + 17, 'tiny', P.u6);
    text('The party is on autopilot.', x + 8, y + 26, 'tiny', P.s5);
    const bw = w - 16, n = Math.round(bw * (1 - left / T));
    rectI(x + 8, y + 38, bw, 5, P.void); rectI(x + 9, y + 39, n, 3, P.g5); rectI(x + 9, y + 39, n, 1, P.g6);
    text('close: back early', x + w - 8, y + h + 3, 'tiny', P.s4, { align: 'r' });
}
function drawAway(ctx, t, o = {}) {
  smDim(ctx, [148, 0, 492, 360], 0.42);
  const L = smLayer(492, 360, () => { awayChair(); awayCard(t, o); });
  ctx.drawImage(L, 148, 0);
}

// ---------------------------------------------------------------- the microsleep: your eyelids
// From Tired 50: they drift shut over 1.6 s (the build's MICROSLEEP_CLOSE_SEC) from top and bottom, an almond
// closing, warm where the light comes through them; shut, "zzz..." and "click or press any key". Any click or key
// snaps them open. On the page it loops: closing, shut, open.
function drawMicro(ctx, t, hold = null) {
  const T = t % 5, lid = hold ?? (T < 1.6 ? T / 1.6 : T < 4.2 ? 1 : 0);
  if (lid <= 0) return;
  const img = ctx.getImageData(0, 0, 640, 360), D = img.data, H = 200 * (1 - lid) + 0.01;
  for (let j = 0; j < 360; j++) for (let i = 0; i < 640; i++) {
    const u = (i - 320) / 360, a = H * Math.max(0, 1 - u * u) ** 0.8, d = Math.abs(j - 180) - a;   // > 0: under the lid
    const o = (j * 640 + i) * 4, b = BAYER8[((j & 7) << 3) | (i & 7)];
    if (d > 0) {
      // the light through the lids is warm near their edge while they close; shut, it's dark with one faint seam
      const k = Math.min(1, d / (26 * (1 - lid) + 1)) + (b - 0.5) * 0.35, c = lid >= 1 ? (Math.abs(j - 180) < 1 ? EB_RGB[EBX.plumD] : EB_RGB[0]) : k < 0.25 ? EB_RGB[26] : k < 0.55 ? EB_RGB[EBX.plum] : k < 0.8 ? EB_RGB[EBX.plumD] : EB_RGB[0];
      const lash = lid < 1 && (d < 2 || (d < 5 && (i % 6 === 0)));
      const cc = lash ? EB_RGB[0] : c; D[o] = cc[0]; D[o + 1] = cc[1]; D[o + 2] = cc[2];
    } else {   // still open: the view greys and darkens toward the lids
      const k = Math.min(1, -d / 40), f = 0.35 + 0.65 * k * (1 - lid * 0.6);
      if (f < 1) { const cl = (v) => Math.max(0, Math.min(255, Math.round(v * f + (b - 0.5) * 14))), c = dimNearest(cl(D[o]), cl(D[o + 1]), cl(D[o + 2])); D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; }
    }
  }
  ctx.putImageData(img, 0, 0);
  if (lid >= 1) {
    const L = smLayer(640, 360, () => {
      const z = Math.floor(t * 2) % 4;
      text('zzz'.slice(0, Math.max(1, z)) + '...', 320, 166, 'tinyL', P.d6, { align: 'c' });
      text('click or press any key', 320, 184, 'tiny', P.s5, { align: 'c' });
    });
    ctx.drawImage(L, 0, 0);
  }
}

// ---------------------------------------------------------------- one entry for the page
function drawSmall(ctx, kind, t) {
  if (kind === 'inspect') { smDim(ctx, [148, 0, 492, 360], 0.42, [148 + INSPECT[0], INSPECT[1], INSPECT[2], INSPECT[3]]); ctx.drawImage(inspectWindow(t), 148 + INSPECT[0], INSPECT[1]); }
  else if (kind === 'howto') { const h = howtoH(), y = Math.round((360 - h) / 2); smDim(ctx, null, 0.42, [94, y, 452, h]); ctx.drawImage(howtoCard(t), 94, y); }
  else if (kind.startsWith('coach-')) drawCoach(ctx, kind.slice(6), t);
  else if (kind.startsWith('tip-')) drawTip(ctx, kind.slice(4), t);
  else if (kind === 'pause') drawPause(ctx, t);
  else if (kind === 'away') drawAway(ctx, t);
  else if (kind === 'micro') drawMicro(ctx, t);
  else if (kind === 'microshut') drawMicro(ctx, t, 1);
  else if (kind === 'microhalf') drawMicro(ctx, t, 0.6);
  usePal(PAL_BASE);
}

// ---------------------------------------------------------------- live (V11, #76): the game's small pieces
// Full-frame pieces (pause, How to hide, the microsleep) draw over a 640 x 360 picture of the frame the game composes
// (her panel and the right screen); right-screen pieces (away, the inspect window) over a 492 x 360 one. Each returns
// its canvas and the hit regions of its buttons (frame or right-screen px).
const SML = { full: null, rs: null, bg: null, chair: null };
const smCanvas = (k, w, h) => { if (!SML[k]) { SML[k] = document.createElement('canvas'); SML[k].width = w; SML[k].height = h; } return SML[k]; };
// pause: the whole frame black (so it can't be used to peek), the card, Resume (Esc) and How to hide
function drawPauseLive(t) {
  const c = smCanvas('full', 640, 360), ctx = c.getContext('2d', { willReadFrequently: true });
  drawPause(ctx, t); usePal(PAL_BASE);
  const w = 232, h = 92, x = 320 - w / 2, y = 180 - h / 2;
  return { canvas: c, hits: [{ x: x + 12, y: y + h - 26, w: 100, h: 14, act: 'resume', arg: '', tip: '' }, { x: x + 120, y: y + h - 26, w: 100, h: 14, act: 'howtoOpen', arg: '', tip: '' }] };
}
// How to hide over the frame dimmed behind it (frame: the picture behind, or null to keep the last; black: paused)
function drawHowtoLive(frame, o, t, black) {
  const c = smCanvas('full', 640, 360), ctx = c.getContext('2d', { willReadFrequently: true }), h = howtoH(o), y = Math.round((360 - h) / 2);
  if (frame || black) {
    const b = smCanvas('bg', 640, 360), bx = b.getContext('2d', { willReadFrequently: true });
    if (black) { bx.fillStyle = '#0a0814'; bx.fillRect(0, 0, 640, 360); } else { bx.drawImage(frame, 0, 0); smDim(bx, null, 0.42, [94, y, 452, h]); }
  }
  ctx.drawImage(SML.bg || smCanvas('bg', 640, 360), 0, 0);
  ctx.drawImage(howtoCard(t, o), 94, y); usePal(PAL_BASE);
  return { canvas: c, hits: [{ x: 94 + 452 / 2 - 50, y: y + h - 24, w: 100, h: 14, act: 'howtoClose', arg: '', tip: '' }] };
}
// the microsleep: lid 0..1 (1 shut) over the frame
// shut, the picture only changes with the zzz (twice a second): it is drawn again only then
let MICRO_KEY = '';
function drawMicroLive(frame, lid, t) {
  const c = smCanvas('micro', 640, 360), ctx = c.getContext('2d', { willReadFrequently: true });
  const key = lid >= 1 ? 'shut' + (Math.floor(t * 2) % 4) : '';
  if (key && key === MICRO_KEY) return { canvas: c, hits: [] };
  MICRO_KEY = key;
  if (frame) ctx.drawImage(frame, 0, 0);
  drawMicro(ctx, t, Math.max(0.001, lid)); usePal(PAL_BASE);
  return { canvas: c, hits: [] };
}
// away from the PC: the right screen dimmed (bg four times a second), the empty chair, the card.
// st: { what, left, total, ask } (ask: her question with Stay and Back to the PC)
const AWAY_CARD = { x: 160, y: 96, w: 176 };
function drawAwayLive(bg, st, t) {
  const c = smCanvas('rs', RS_W, RS_H), ctx = c.getContext('2d');
  if (bg) { const b = smCanvas('rsbg', RS_W, RS_H), bx = b.getContext('2d', { willReadFrequently: true }); bx.drawImage(bg, 0, 0); smDim(bx, [0, 0, RS_W, RS_H], 0.42); }
  if (!SML.chair) { const L = smLayer(RS_W, RS_H, () => awayChair()); SML.chair = document.createElement('canvas'); SML.chair.width = RS_W; SML.chair.height = RS_H; SML.chair.getContext('2d').drawImage(L, 0, 0); }
  if (SML.rsbg) ctx.drawImage(SML.rsbg, 0, 0); else { ctx.fillStyle = EB_PAL[P.void]; ctx.fillRect(0, 0, RS_W, RS_H); }
  ctx.drawImage(SML.chair, 0, 0);
  const { x, y, w } = AWAY_CARD, h = st.ask ? 66 : 52, hits = [{ x: x + w - 14, y: y + 4, w: 10, h: 10, act: 'preCancel', arg: '', tip: '' }];
  const L = smLayer(w, h + 12, () => {
    smGlass(0, 0, w, h);
    text('Away from the PC', 8, 6, 'tiny', P.moon); smClose(w - 14, 4);
    if (st.ask) {
      text(st.ask, 8, 18, 'tiny', P.u6);
      smBtn(8, 32, 74, st.yes, { gold: true }); smBtn(86, 32, w - 94, st.no);
      text('The party is on autopilot.', 8, 52, 'tiny', P.s5);
    } else {
      text(st.what + ' · ' + Math.max(1, Math.ceil(st.left)) + ' s', 8, 17, 'tiny', P.u6);
      text('The party is on autopilot.', 8, 26, 'tiny', P.s5);
      const bw = w - 16, n = Math.round(bw * Math.max(0, Math.min(1, 1 - st.left / st.total)));
      rectI(8, 38, bw, 5, P.void); rectI(9, 39, n, 3, P.g5); rectI(9, 39, n, 1, P.g6);
      text('close: back early', w - 8, h + 3, 'tiny', P.s4, { align: 'r' });
    }
  });
  ctx.drawImage(L, x, y); usePal(PAL_BASE);
  if (st.ask) hits.push({ x: x + 8, y: y + 32, w: 74, h: 14, act: 'episode', arg: '1', tip: '' }, { x: x + 86, y: y + 32, w: w - 94, h: 14, act: 'episode', arg: '0', tip: '' });
  return { canvas: c, hits };
}
// the Goblin Fuel inspect window over the dimmed right screen (bg four times a second); o: INSPECT_PAGE's shape
function drawInspectLive(bg, o, t) {
  const c = smCanvas('rs', RS_W, RS_H), ctx = c.getContext('2d'), [ix, iy, iw, ih] = INSPECT;
  if (bg) { const b = smCanvas('rsbg', RS_W, RS_H), bx = b.getContext('2d', { willReadFrequently: true }); bx.drawImage(bg, 0, 0); smDim(bx, [0, 0, RS_W, RS_H], 0.42, [ix, iy, iw, ih]); }
  if (SML.rsbg) ctx.drawImage(SML.rsbg, 0, 0); else { ctx.fillStyle = EB_PAL[P.void]; ctx.fillRect(0, 0, RS_W, RS_H); }
  ctx.drawImage(inspectWindow(t, o), ix, iy); usePal(PAL_BASE);
  return { canvas: c, hits: [{ x: ix + iw - 15, y: iy + 4, w: 10, h: 10, act: 'inspectClose', arg: '', tip: '' }, { x: ix + 104, y: iy + ih - 22, w: 104, h: 14, act: 'inspectDrink', arg: '', tip: '' }, { x: ix + 214, y: iy + ih - 22, w: 70, h: 14, act: 'inspectClose', arg: '', tip: '' }] };
}

// a coach mark over the frame (transparent), with the game's words (o: { title, text }); the callout's rectangle and its
// close box come back as hits (the rest lets the pointer through to the thing it points at)
function drawCoachLive(id, o, t) {
  const c = smCanvas('coach', 640, 360), ctx = c.getContext('2d'); ctx.clearRect(0, 0, 640, 360);
  const page = COACHES[id]; COACHES[id] = { ...page, title: o.title, text: o.text };
  const [x, y, w, h] = drawCoach(ctx, id, t); COACHES[id] = page; usePal(PAL_BASE);
  return { canvas: c, hits: [{ x: x + w - 14, y: y + 4, w: 10, h: 10, act: 'coachClose', arg: '', tip: '' }, { x, y, w, h, act: '', arg: '', tip: '' }] };
}
// tooltips next to the pointer (frame px), in the look of where the pointer is (grid doc 7k): 'desk' the desk's glass
// (a name and its key, + and - lines, a count), 'pc' Windows 98's yellow, 'her' her PC-98 paper. tip: { style, title,
// key, lines: [[sign, text]], note }. Drawn only when it changes.
let TIP_KEY = '';
function drawTipLive(tip, px, py) {
  const c = smCanvas('tip', 640, 360), key = JSON.stringify(tip) + '|' + px + ',' + py;
  if (key === TIP_KEY) return c;
  TIP_KEY = key;
  const ctx = c.getContext('2d'); ctx.clearRect(0, 0, 640, 360);
  const lines = tip.lines || [], st = tip.style;
  if (st === 'pc') {   // Windows' own: pale yellow, a black line, black Tiny5
    const ws = lines.flatMap(([, s2]) => wrapTiny(s2, 170)), w = Math.max(...ws.map((l) => measure(l, 'tiny'))) + 8, h = ws.length * 8 + 5;
    const x = Math.max(2, Math.min(638 - w, px + 2)), y = py + 16 + h > 358 ? py - h - 4 : py + 16;
    const L = smLayer(640, 360, () => { rectI(x, y, w, h, P.pale); frameI(x, y, w, h, P.void); ws.forEach((l, k) => text(l, x + 4, y + 3 + k * 8, 'tiny', P.void)); });
    ctx.drawImage(L, 0, 0);
  } else if (st === 'her') {   // her paper: the name in plum, the line in brown
    const w = 132, body = lines.flatMap(([, s2]) => wrapTiny(s2, w - 12)), h = (tip.title ? 9 : 0) + body.length * 8 + 12;
    const x = Math.max(2, Math.min(638 - w, px + 10)), y = Math.max(2, Math.min(356 - h, py + 10));
    const L = smLayer(640, 360, () => {
      win9(x, y, w, h); let yy = y + 5;
      if (tip.title) { text(tip.title, x + 6, yy, 'tiny', C9.plum); yy += 9; }
      for (const l of body) { text(l, x + 6, yy, 'tiny', C9.brown); yy += 8; }
    }, PC98_RGB);
    ctx.drawImage(L, 0, 0);
  } else {   // the desk's glass
    const w = 156, mid = [], titleH = tip.title ? 11 : 0;
    let h = 8 + titleH; for (const [sign, s2] of lines) h += wrapTiny(s2, w - (sign ? 18 : 12)).length * 8 + (sign ? 2 : 0);
    if (tip.note) h += 9;
    const x = Math.max(2, Math.min(638 - w, px + 10)), y = py + 14 + h > 358 ? Math.max(2, py - h - 6) : py + 14;
    const L = smLayer(640, 360, () => {
      shadowFlatSm(x + 2, y + 3, w, h); smGlass(x, y, w, h);
      let yy = y + 5;
      if (tip.title) { text(tip.title, x + 6, yy, 'tiny', P.moon); if (tip.key) text(tip.key, x + w - 6, yy, 'tiny', P.s5, { align: 'r' }); yy += 11; }
      for (const [sign, s2] of lines) {
        if (sign) yy = smBullets(x + 6, yy, w - 10, [[sign, s2]]);
        else { for (const l of wrapTiny(s2, w - 12)) { text(l, x + 6, yy, 'tiny', P.u6); yy += 8; } }
      }
      if (tip.note) text(tip.note, x + 6, yy + 1, 'tiny', P.s5);
    });
    ctx.drawImage(L, 0, 0);
  }
  usePal(PAL_BASE);
  return c;
}
