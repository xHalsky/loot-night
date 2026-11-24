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
function zl9(str, x, y, font, col, o = {}) {   // text with every 'zl' written as zł: a short slash across the l
  const w = text(str, x, y, font, col, o), big = font === 'tinyL' ? 2 : 1, x0 = o.align === 'r' ? x - w : x;
  let k = str.indexOf('zl');
  while (k >= 0) {
    const lx = x0 + measure(str.slice(0, k + 1), font), my = y + 3 * big;
    for (let i = 0; i < 3 * big; i++) putI(lx - big + i, my + Math.round((1.5 * big - i) * 0.85) - (big > 1 ? 1 : 0), col);
    k = str.indexOf('zl', k + 2);
  }
  return w;
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
  const NOTE = data.replay ? `Tonight is ${data.night} again. Party, gear, gold, Souls and city carry over.` : (data.debt > 0 ? `Sleep debt ${data.debt}: tonight starts at Tiredness ${10 + data.debt * 3}.` : 'No sleep debt: tonight starts fresh.') + ' Party, gear, gold and city carry over.';
  const noteLines = wrap9(NOTE, sw - 16).length;
  const headLines = wrap9(data.sold ? `Auction house sold ${data.sold} items: +${data.paid} zl` : 'Nothing sold overnight.', sw - 16).length;
  const repLines = data.replay ? wrap9('She pulled the plug. No stars, and the cheaper half of your bag is gone.', sw - 16).length : 0;
  const sh = 7 + 20 + 5 + headLines * 9 + 3 + 64 + (data.replay ? 13 + repLines * 9 : 0) + 11 + data.stars.length * 19 + 2 + (data.q4 ? 12 : 0) + 5 + noteLines * 9 + 8 + 20 + 7;
  win9(sx, sy, sw, sh);
  let y = sy + 7;
  text('Morning', sx + 8, y, 'tinyL', C9.plum);
  text('Tue 07:40', sx + sw - 8, y + 5, 'tiny', C9.brown, { align: 'r' });
  y += 20;
  for (let i = sx + 6; i < sx + sw - 6; i++) putI(i, y, (i & 1) ? C9.tan : C9.beige);
  y += 5;
  wrap9(data.sold ? `Auction house sold ${data.sold} item${data.sold > 1 ? 's' : ''}: +${data.paid} zl` : 'Nothing sold overnight.', sw - 16).forEach((l) => { zl9(l, sx + 8, y, 'tiny', C9.plum); y += 9; });
  y += 3;
  // four numbers in small inset cells
  const cells = [['Wallet', data.zl + ' zl', C9.moss], ['Gold', String(data.gold), C9.brown], ['Sleep debt', String(data.debt), data.debt ? C9.crimson : C9.plum], ['Best stars', data.best + ' / 3', C9.plum]];
  cells.forEach(([lab, val, col], k) => {
    const bx = sx + 7 + (k % 2) * 90, by = y + Math.floor(k / 2) * 30;
    win9(bx, by, 87, 27, { fill: C9.moon, hi: C9.tan, lo: C9.moon, edge: C9.tan, shadow: false });
    text(lab, bx + 5, by + 4, 'tiny', C9.brown);
    zl9(val, bx + 5, by + 12, 'tinyL', col);
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
  if (data.q4) { zl9('Q4 last night: +' + data.q4 + ' zl', sx + 8, y, 'tiny', C9.moss); y += 12; }
  for (let i = sx + 6; i < sx + sw - 6; i++) putI(i, y, (i & 1) ? C9.tan : C9.beige);
  y += 5;
  wrap9(NOTE, sw - 16).forEach((l) => { text(l, sx + 8, y, 'tiny', C9.brown); y += 9; });
  // the next night: her pink button
  const by = y + 8, hov = !!o.hover;
  MORNING_BTN = [sx + 7, by, sw - 14, 20];
  win9(sx + 7, by, sw - 14, 20, { fill: hov ? C9.rose : C9.pink, hi: C9.skin, lo: C9.rose, edge: C9.plum });
  text(data.replay ? data.night + ', again' : 'Start ' + data.night + ' night', sx + sw / 2, by + 7, 'tiny', C9.plum, { align: 'c' });
  spr(sx + sw - 21, by + 7, ['x..', 'xx.', 'xxx', 'xx.', 'x..'], { x: C9.plum });
  const ctx = MORNING_CANVAS.getContext('2d'), img = ctx.createImageData(640, 360), D = img.data;
  for (let i = 0; i < 640 * 360; i++) { const q = PC98_RGB[F.I[i] < 0 ? 0 : F.I[i]], p = i * 4; D[p] = q[0]; D[p + 1] = q[1]; D[p + 2] = q[2]; D[p + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return MORNING_CANVAS;
}
