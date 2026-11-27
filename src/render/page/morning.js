// ===========================================================================
// The morning (redesign of the build's morning screen, src/ui/panels.ts and docs/design/night.md, plus the handoff's
// step 3: one reward per star, and "Q4" on the morning). The night's end as a PC-98 dating-sim CG of her asleep, by how
// the night ended (green: asleep in your shirt hugging your pillow; yellow: back turned, her phone lit; red: asleep on the
// couch, the TV on; unplugged: an empty bed and a note), in her 16 colours; the summary in her panel's beige paper
// window on the right, the caption in the caught window's night plum at the bottom. Baked: morning/ (a ray-marched 3D
// pass, drawn soles laid over it, quantised to flat tones with 50% checkers) -> morning_img.js.
// ===========================================================================
const MORNING_IDX = {};
const MORNING_READY = typeof MORNING_SRC === 'undefined' ? Promise.resolve() : Promise.all(Object.entries(MORNING_SRC).map(([k, src]) => new Promise((res) => {
  const im = new Image();
  im.onload = () => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, 640, 360).data, a = new Uint8Array(640 * 360), key = new Map(PC98_RGB.map((q, i) => [(q[0] << 16) | (q[1] << 8) | q[2], i]));
    for (let i = 0; i < a.length; i++) a[i] = key.get((d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2]) ?? 0;
    MORNING_IDX[k] = a; res();
  };
  im.onerror = () => res(); im.src = src;
})));
const MORNING_CAPTION = {
  green: 'She fell asleep in your shirt again, hugging your pillow.',
  yellow: 'Back turned. Her phone is still lit.',
  red: 'She fell asleep on the couch. The TV is still on.',
  unplugged: 'An empty bed. A note on your pillow: "Hope the loot was worth it."',
};
// a sample morning for the page; the game fills these from the night's results
const MORNING_DEMO = {
  sold: 0, paid: 0, zl: 80, gold: 100, debt: 0, best: 2, q4: 35, night: 'Monday',
  stars: [{ name: 'Deep', got: true, reward: 'a chest: 1 item, floor 4' }, { name: 'Unseen', got: false, reward: 'Trust: Goodwill +20' }, { name: 'Sweet', got: true, reward: 'Breakfast: sleep debt -1' }],
};
function zl9(str, x, y, font, col, o = {}) {   // text with every "N zl" written as dollars, "+$N" (#105; it drew zł)
  return text(str.replace(/([+~-]?)(\d[\d.,]*) ?zl\b/g, '$1$$$2'), x, y, font, col, o);
}
function star9(x, y, on) {   // a 7 x 7 star: gold with a plum edge when earned, a purple outline when not
  const S = ['...x...', '..xxx..', 'xxxxxxx', '.xxxxx.', '.xx.xx.', 'x.....x'];
  S.forEach((r, j) => [...r].forEach((c, i) => {
    if (c !== 'x') return;
    const edge = j === 0 || i === 0 || i === 6 || S[j][i - 1] !== 'x' || S[j][i + 1] !== 'x' || (S[j + 1] && S[j + 1][i] !== 'x') || j === 5;
    putI(x + i, y + j, on ? (edge ? C9.brown : C9.gold) : (edge ? C9.tan : -1));
  }));
  if (on) putI(x + 3, y + 2, C9.moon);
}
// Breakfast: her at the stove in your shirt, from behind, the morning light through the window; a code stand-in in her
// sixteen colours until Paweł draws it (the art list's Breakfast still). Framed as a photo, "Breakfast" under it.
function breakfast9(F, x, y) {
  const W = 100, H = 66, C = C9;
  const bg = (i, j) => {
    if (j < 40 && i > 62 && i < 96 && j > 4) return i === 63 || i === 95 || j === 5 || j === 39 || i === 79 ? C.tan : (i + j) % 7 === 0 ? C.beige : C.moon;   // the window, the light
    if (j >= 44) return j === 44 ? C.beige : j < 50 ? C.tan : (i % 24 === 0 || j === 58) ? C.brown : C.tan;   // the counter, the cupboards
    return (i + j) % 2 && i > 58 ? C.moon : C.beige;   // the wall, the light on it
  };
  const skin = { fill: C.skin, shade: C.beige, line: C.brown, cut: 0.35 }, hair = { fill: C.plum, shade: C.void, hi: C.purple, hiCut: -0.55, line: C.void };
  const shirt = { fill: C.denim, shade: C.purple, hi: C.lilac, hiCut: -0.8, line: C.plum };
  const I = PHONEOS.vPaint(W, H, bg, [
    { ell: [74, 43, 13, 3.5], fill: C.void, shade: C.plum, line: C.void },                 // the pan
    { cap: [87, 43, 97, 41, 1.2, 1], fill: C.void, line: C.void },                            // its handle
    { ell: [70, 42, 4, 1.6], fill: C.moon, line: C.tan }, { ell: [78, 42.5, 4, 1.6], fill: C.moon, line: C.tan },   // two eggs
    { cap: [37, 52, 36, 66, 3.6, 3], ...skin }, { cap: [46, 52, 47, 66, 3.6, 3], ...skin },  // her legs, bare
    { poly: [[29, 20], [53, 20], [58, 54], [25, 54]], ...shirt },                              // your shirt, to mid-thigh
    { cap: [53, 24, 66, 38, 3.4, 2.8], ...shirt }, { ell: [67, 39, 2.6, 2.2], ...skin },      // her arm to the pan
    { poly: [[31, 4], [51, 4], [55, 18], [53, 40], [41, 44], [29, 40], [27, 18]], ...hair },  // her hair down her back
    { ell: [41, 9, 9, 9], ...hair },                                                           // the back of her head
  ]);
  for (const [a, b] of [[0, -2], [2, 0], [1, 2], [-1, 2], [-2, 0]]) I[(7 + b) * W + 48 + a] = C.pink;   // the pink clip
  I[7 * W + 48] = C.gold;
  for (let k = 0; k < 7; k++) { const sx2 = 70 + Math.round(Math.sin(k * 1.7) * 3), sy2 = 36 - k * 4; if (sy2 > 0) I[sy2 * W + sx2] = C.moon; }   // steam
  // the photo: a moon border, a shadow, the picture, a caption strip
  for (let j = 0; j < H + 18; j++) for (let i = 0; i < W + 12; i++) { const X = x + i + 2, Y = y + j + 2; if (X < 640 && Y < 360) F.I[Y * 640 + X] = C.void; }
  for (let j = 0; j < H + 18; j++) for (let i = 0; i < W + 12; i++) F.I[(y + j) * 640 + x + i] = C.moon;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) F.I[(y + 6 + j) * 640 + x + 6 + i] = I[j * W + i];
  text('Breakfast', x + 6, y + H + 8, 'tiny', C.plum);
  text('in your shirt', x + W + 6, y + H + 8, 'tiny', C.brown, { align: 'r' });
}
let MORNING_CANVAS = null, MORNING_BTN = null;   // the next-night button's rectangle, for the page's pointer
function drawMorning(scene, T, data = MORNING_DEMO, o = {}) {
  if (!MORNING_CANVAS) { MORNING_CANVAS = document.createElement('canvas'); MORNING_CANVAS.width = 640; MORNING_CANVAS.height = 360; }
  setRes(640, 360); CLIP = null;
  const F = buf('morning', 640, 360); F.I.fill(-1); bind(F);
  const src = MORNING_IDX[scene] || MORNING_IDX.green;
  if (src) F.I.set(src);
  // the caption: narration in the caught window's night plum
  const cx = 8, cy = 322, cw = 424, ch = 30;
  win9(cx, cy, cw, ch, { fill: C9.plum, hi: C9.purple, lo: C9.void, edge: C9.lilac });
  heart9(cx + 7, cy + 12, true);
  wrap9(MORNING_CAPTION[scene] || '', cw - 30).slice(0, 2).forEach((l, k, a) => text(l, cx + 19, cy + (a.length > 1 ? 8 : 12) + k * 9, 'tiny', C9.beige));
  // the summary: her panel's beige paper window
  const sx = 440, sy = 14, sw = 192;
  const NOTE = data.note || (data.replay ? `Tonight is ${data.night} again. Party, gear, gold, Souls and city carry over.` : (data.debt > 0 ? `Sleep debt ${data.debt}: tonight starts at Tiredness ${10 + data.debt * 3}.` : 'No sleep debt: tonight starts fresh.') + ' Party, gear, gold and city carry over.');
  const noteLines = wrap9(NOTE, sw - 16).length;
  const headLines = wrap9(data.sold ? `Auction house sold ${data.sold} items: +$${data.paid}` : 'Nothing sold overnight.', sw - 16).length;
  const repLines = data.replay ? wrap9('She pulled the plug. No stars, and the cheaper half of your bag is gone.', sw - 16).length : 0;
  const sh = 7 + 20 + 5 + headLines * 9 + 3 + 64 + (data.replay ? 13 + repLines * 9 : 0) + 11 + data.stars.length * 19 + 2 + (data.q4 ? 12 : 0) + 5 + noteLines * 9 + 8 + 20 + 7;
  win9(sx, sy, sw, sh);
  let y = sy + 7;
  text('Morning', sx + 8, y, 'head', C9.plum);
  text(data.when || 'Tue 07:40', sx + sw - 8, y + 5, 'tiny', C9.brown, { align: 'r' });
  y += 20;
  for (let i = sx + 6; i < sx + sw - 6; i++) putI(i, y, (i & 1) ? C9.tan : C9.beige);
  y += 5;
  wrap9(data.sold ? `Auction house sold ${data.sold} item${data.sold > 1 ? 's' : ''}: +$${data.paid}` : 'Nothing sold overnight.', sw - 16).forEach((l) => { zl9(l, sx + 8, y, 'tiny', C9.plum); y += 9; });
  y += 3;
  // four numbers in small inset cells
  const cells = [['Wallet', '$' + data.zl, C9.moss], ['Gold', String(data.gold), C9.brown], ['Sleep debt', String(data.debt), data.debt ? C9.crimson : C9.plum], ['Best stars', data.best + ' / 3', C9.plum]];
  cells.forEach(([lab, val, col], k) => {
    const bx = sx + 7 + (k % 2) * 90, by = y + Math.floor(k / 2) * 30;
    win9(bx, by, 87, 27, { fill: C9.moon, hi: C9.tan, lo: C9.moon, edge: C9.tan, shadow: false });
    text(lab, bx + 5, by + 4, 'tiny', C9.brown);
    zl9(val, bx + 5, by + 12, 'head', col);   // the same face as the card's heading (#106)
  });
  y += 64;
  // last night's stars, one reward each (the handoff's step 3)
  if (data.replay) {   // unplugged (week one): no stars, the cheaper half of the bag gone, the same night again
    text('UNPLUGGED', sx + 8, y, 'tiny', C9.crimson); y += 10;
    wrap9('She pulled the plug. No stars, and the cheaper half of your bag is gone.', sw - 16).forEach((l) => { text(l, sx + 8, y, 'tiny', C9.plum); y += 9; });
    y += 3;
  }
  text('LAST NIGHT', sx + 8, y, 'tiny', C9.rose); y += 11;
  for (const s of data.stars) {
    star9(sx + 8, y, s.got);
    text(s.name, sx + 19, y, 'tiny', s.got ? C9.plum : C9.tan);
    text(s.got ? s.reward : 'missed', sx + 19, y + 8, 'tiny', s.got ? C9.brown : C9.tan);
    y += 19;
  }
  y += 2;
  if (data.q4) { zl9('Q4 last night: +$' + data.q4, sx + 8, y, 'tiny', C9.moss); y += 12; }
  for (let i = sx + 6; i < sx + sw - 6; i++) putI(i, y, (i & 1) ? C9.tan : C9.beige);
  y += 5;
  wrap9(NOTE, sw - 16).forEach((l) => { text(l, sx + 8, y, 'tiny', C9.brown); y += 9; });
  // the next night: her pink button
  const by = y + 8, hov = !!o.hover;
  MORNING_BTN = [sx + 7, by, sw - 14, 20];
  win9(sx + 7, by, sw - 14, 20, { fill: hov ? C9.rose : C9.pink, hi: C9.skin, lo: C9.rose, edge: C9.plum });
  text(data.next || (data.replay ? data.night + ', again' : 'Start ' + data.night + ' night'), sx + sw / 2, by + 7, 'tiny', C9.plum, { align: 'c' });
  spr(sx + sw - 21, by + 7, ['x..', 'xx.', 'xxx', 'xx.', 'x..'], { x: C9.plum });
  // the Sweet star's Breakfast (fan-service 9, #94): its picture, a photo under the summary
  if (!data.replay && data.stars.some((s) => s.name === 'Sweet' && s.got) && by + 28 + 86 <= 358) breakfast9(F, sx + sw / 2 - 56, by + 28);
  const ctx = MORNING_CANVAS.getContext('2d'), img = ctx.createImageData(640, 360), D = img.data;
  for (let i = 0; i < 640 * 360; i++) { const q = PC98_RGB[F.I[i] < 0 ? 0 : F.I[i]], p = i * 4; D[p] = q[0]; D[p + 1] = q[1]; D[p + 2] = q[2]; D[p + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return MORNING_CANVAS;
}

// ---------------------------------------------------------------- live (V10, #75): the game's morning
// data as MORNING_DEMO, from the game (render/morningView.ts), plus note, when and next (its own lines). Drawn only when
// something changes (the button's hover): the picture is still.
let MORNING_KEY = '';
function drawMorningLive(scene, data, hover) {
  const key = scene + '|' + JSON.stringify(data) + '|' + (hover ? 1 : 0);
  if (key !== MORNING_KEY || !MORNING_CANVAS) { MORNING_KEY = key; drawMorning(scene, 0, data, { hover }); }
  const [x, y, w, h] = MORNING_BTN;
  return { canvas: MORNING_CANVAS, hits: [{ x, y, w, h, act: 'startNight', arg: '', tip: '' }] };
}
