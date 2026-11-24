// ---------------------------------------------------------------- the text test
// Three of the densest windows, laid out again for one font on the 640×360 grid: her chat window (her panel), the
// morning summary, a text thread on the phone in your hand. The rest of the frame dims behind them. Each window grows
// to fit its text, so a bigger font shows what it costs in room as well as how it reads.
FONTS.ps8 = { fam: 'ps2p', size: 8, cap: 8 };
FONTS.vt16 = { fam: 'vt323', size: 16, cap: 9 };
FONTS.j10 = { fam: 'jersey10', size: 18.6667, cap: 10 };
FONTS.dg16 = { fam: 'dotgothic', size: 16, cap: 12 };
const TL = {
  t5: { body: 'tiny', head: 'tinyL', lh: 9, hh: 14, name: 'Tiny5 8 px (now): capitals 5 px' },
  ps: { body: 'ps8', head: 'ps8', lh: 11, hh: 12, name: 'Press Start 2P 8 px: capitals 7 px, every letter 8 px wide' },
  vt: { body: 'vt16', head: 'vt16', lh: 14, hh: 14, name: 'VT323 16 px: capitals 9 px, a terminal face' },
  j10: { body: 'j10', head: 'j10', lh: 14, hh: 14, name: 'Jersey 10: capitals 10 px, bold and narrow' },
  dg: { body: 'dg16', head: 'dg16', lh: 16, hh: 16, name: 'DotGothic16 16 px: capitals 12 px, the PC-98 size' },
};
const TL_READY = Promise.all(['8px ps2p', '16px vt323', '18.6667px jersey10', '16px dotgothic'].map((f) => document.fonts.load(f)));
const TLC = (i) => PC98_RGB[i];
const TLH = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// the phone's colours (the desk's Graphite and meaning colours)
const TLP = { body: TLH('#17171d'), rim: TLH('#4a4a55'), glass: TLH('#0c0d12'), bar: TLH('#22232b'), hers: TLH('#5d4659'), moon: TLH('#f2efdc'), dim: TLH('#8b8b98'), gold: TLH('#f1a934'), wine: TLH('#852e30'), ink: TLH('#241c2e'), pink: TLH('#d9a69c'), track: TLH('#33343e') };
function drawTextTest(ctx, key, t) {
  const F = TL[key], b = F.body, lh = F.lh;
  const img = ctx.getImageData(0, 0, 640, 360), D = img.data;
  for (let i = 0; i < D.length; i += 4) { D[i] *= 0.38; D[i + 1] *= 0.38; D[i + 2] *= 0.42; }
  const put = (x, y, c) => { if (x < 0 || y < 0 || x >= 640 || y >= 360) return; const o = (y * 640 + x) * 4; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; };
  const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, c); };
  const tx = (s, x, y, f, c, o = {}) => {
    const g = glyphs(s, f), x0 = Math.round(o.align === 'c' ? x - g.w / 2 : o.align === 'r' ? x - g.w : x);
    if (o.shadow) for (let k = 0; k < g.pts.length; k += 2) put(g.pts[k] + x0 + 1, g.pts[k + 1] + y + 1, o.shadow);
    for (let k = 0; k < g.pts.length; k += 2) put(g.pts[k] + x0, g.pts[k + 1] + y, c);
    return g.w;
  };
  const wrap = (s, w, f) => { const out = []; let cur = ''; for (const wd of s.split(' ')) { const n = cur ? cur + ' ' + wd : wd; if (measure(n, f) > w && cur) { out.push(cur); cur = wd; } else cur = n; } if (cur) out.push(cur); return out; };
  // a PC-98 paper window: plum edge, moon lip top-left, tan bottom-right, rounded corners, a plum shadow
  const win = (x, y, w, h, fill = TLC(C9.beige), edge = TLC(C9.plum), hi = TLC(C9.moon), lo = TLC(C9.tan)) => {
    rect(x + 2, y + h, w - 2, 2, TLC(C9.void)); rect(x + w, y + 2, 2, h - 1, TLC(C9.void));
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if ((i === 0 || i === w - 1) && (j === 0 || j === h - 1)) continue;
      put(x + i, y + j, i === 0 || j === 0 || i === w - 1 || j === h - 1 ? edge : j === 1 || i === 1 ? hi : j === h - 2 || i === w - 2 ? lo : fill);
    }
  };
  const heart = (x, y, c) => ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'].forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'x') put(x + i, y + j, c); }));
  const capH = FONTS[b].cap > 7 && b === 'ps8' ? 7 : FONTS[b].cap;
  // 1. her chat window, in her panel (148 wide), anchored to the bottom and as tall as it needs
  {
    const x = 4, w = 140, iw = w - 12;
    const q = wrap('Do you think I should cut my hair short?', iw, b);
    const ans = ['You would look great either way', 'Whatever is cheaper', 'Hm, maybe?'].map((a) => wrap(a, iw - 8, b));
    const stats = 4, hdr2 = measure('CHAT 1/3', b) + measure('KEEP EXCEL UP', b) + 8 > iw;
    const h = 6 + lh * (hdr2 ? 2 : 1) + 3 + q.length * lh + 4 + ans.reduce((s, a) => s + a.length * lh + 6, 0) + 4 + stats * lh + 4;
    const y = 360 - h - 3;
    win(x, y, w, h, TLC(C9.beige));
    let yy = y + 6;
    tx('CHAT 1/3', x + 6, yy, b, TLC(C9.rose)); if (hdr2) yy += lh; tx('KEEP EXCEL UP', hdr2 ? x + 6 : x + w - 6, yy, b, TLC(C9.plum), { align: hdr2 ? 'l' : 'r' });
    yy += lh + 3;
    for (const l of q) { tx(l, x + 6, yy, b, TLC(C9.plum)); yy += lh; }
    yy += 4;
    ans.forEach((a, k) => {
      const bh = a.length * lh + 3;
      rect(x + 6, yy - 2, iw, bh + 1, k === 0 ? TLC(C9.rose) : TLC(C9.pink)); rect(x + 6, yy - 2 + bh + 1, iw, 1, TLC(C9.plum));
      a.forEach((l, i) => tx(l, x + 10, yy + i * lh, b, k === 0 ? TLC(C9.moon) : TLC(C9.plum)));
      yy += bh + 3;
    });
    yy += 4;
    const lab = (s, yv) => tx(s, x + 6, yv, b, TLC(C9.brown));
    lab('Patience', yy); for (let k = 0; k < 5; k++) heart(x + w - 44 + k * 7, yy + Math.max(0, capH - 5), TLC(C9.rose)); yy += lh;
    lab('Caught', yy); for (let k = 0; k < 3; k++) heart(x + w - 30 + k * 7, yy + Math.max(0, capH - 5), k ? TLC(C9.tan) : TLC(C9.crimson)); yy += lh;
    for (const [s, v, c] of [['Goodwill', 0.31, C9.moss], ['Noise', 0.12, C9.gold]]) {
      lab(s, yy); const bx = x + 6 + measure('Goodwill', b) + 6, bw = x + w - 8 - bx, by = yy + Math.max(0, capH - 4);
      rect(bx, by, bw, 4, TLC(C9.tan)); rect(bx, by, Math.round(bw * v), 4, TLC(c)); yy += lh;
    }
  }
  // 2. the morning summary (her beige paper window, 192 wide at 440, 14)
  {
    const x = 440, y = 14, w = 192, iw = w - 16;
    const head = wrap('Auction house sold 1 item: +40 zl', iw, b), note = wrap('Sleep debt 1: tonight starts at Tiredness 13. Party, gear, gold and city carry over.', iw, b);
    const stars = [['Deep', 'a chest: 1 item, floor 4', true], ['Unseen', 'Trust: Goodwill +20', true], ['Sweet', 'missed', false]].map(([n, r, g]) => [n, wrap(r, iw - 12, b), g]);
    const cellH = 4 + lh * 2 + 2;
    const hh = 6 + F.hh + 4 + 3 + head.length * lh + 3 + cellH * 2 + 4 + lh + stars.reduce((s2, st) => s2 + lh * (1 + st[1].length) + 2, 0) + 3 + note.length * lh + 6 + lh + 8 + 6;
    const h = Math.min(hh, 360 - y - 4);
    win(x, y, w, h);
    let yy = y + 6;
    tx('Morning', x + 8, yy, F.head, TLC(C9.plum)); tx('Tue 07:40', x + w - 8, yy + Math.max(0, F.hh - lh), b, TLC(C9.brown), { align: 'r' });
    yy += F.hh + 4; for (let i = x + 6; i < x + w - 6; i++) put(i, yy, (i & 1) ? TLC(C9.tan) : TLC(C9.beige)); yy += 3;
    for (const l of head) { tx(l, x + 8, yy, b, TLC(C9.plum)); yy += lh; }
    yy += 3;
    [['Wallet', '120 zl', C9.moss], ['Gold', '60', C9.brown], ['Sleep debt', '1', C9.crimson], ['Best stars', '2/3', C9.plum]].forEach(([l, v, c], k) => {
      const cx = x + 7 + (k % 2) * 90, cy = yy + Math.floor(k / 2) * (cellH + 2);
      win(cx, cy, 87, cellH, TLC(C9.moon), TLC(C9.tan), TLC(C9.moon), TLC(C9.moon));
      tx(l, cx + 5, cy + 3, b, TLC(C9.brown)); tx(v, cx + 5, cy + 3 + lh, b, TLC(c));
    });
    yy += cellH * 2 + 4;
    tx('LAST NIGHT', x + 8, yy, b, TLC(C9.rose)); yy += lh;
    for (const [n, r, got] of stars) {
      heart(x + 8, yy + Math.max(0, capH - 5), got ? TLC(C9.gold) : TLC(C9.tan));
      tx(n, x + 18, yy, b, got ? TLC(C9.plum) : TLC(C9.tan)); r.forEach((l, i) => tx(l, x + 18, yy + lh * (i + 1), b, got ? TLC(C9.brown) : TLC(C9.tan))); yy += lh * (1 + r.length) + 2;
    }
    yy += 3;
    const stop = y + h - 4 - (hh > h ? lh + 2 : 0);
    for (const l of note) { if (yy + lh > stop) break; tx(l, x + 8, yy, b, TLC(C9.brown)); yy += lh; }
    yy += 6;
    if (yy + lh + 6 < y + h) { rect(x + 7, yy - 2, w - 14, lh + 5, TLC(C9.pink)); rect(x + 7, yy + lh + 3, w - 14, 1, TLC(C9.rose)); tx('Start Monday night', x + w / 2, yy + 1, b, TLC(C9.plum), { align: 'c' }); }
    if (hh > h) { rect(x + 2, y + h - lh - 5, w - 4, lh + 3, TLC(C9.beige)); tx('(does not fit)', x + w - 8, y + h - lh - 3, b, TLC(C9.crimson), { align: 'r' }); }
  }
  // 3. a text thread on the phone in your hand (124 wide at 160, 112; the screen 112 wide), running off the bottom
  {
    const x = 160, y = 112, w = 124, sx = x + 6, sw = 112, sy = y + 6;
    rect(x, y, w, 360 - y, TLP.rim); rect(x + 2, y + 2, w - 4, 360 - y, TLP.body); rect(sx, sy, sw, 360 - sy, TLP.glass);
    let yy = sy + 4;
    tx('23:41', sx + 6, yy, b, TLP.moon); tx('84%', sx + sw - 6, yy, b, TLP.dim, { align: 'r' }); yy += lh + 4;
    rect(sx, yy - 2, sw, lh + 5, TLP.bar); tx('< Babe', sx + 4, yy, b, TLP.pink); heart(sx + 6 + measure('< Babe', b) + 3, yy + Math.max(0, capH - 5), TLP.pink); yy += lh + 6;
    rect(sx + 4, yy, sw - 8, 3, TLP.track); rect(sx + 4, yy, Math.round((sw - 8) * 0.6), 3, TLP.gold); tx('5 s', sx + sw - 4, yy + 5, b, TLP.gold, { align: 'r' }); yy += 6 + lh;
    for (const m of ['are you coming to bed?', 'hello??', 'I can hear the clicking']) {
      const ls = wrap(m, 84, b), bw = Math.max(...ls.map((l) => measure(l, b))) + 8;
      rect(sx + 4, yy, bw, ls.length * lh + 4, TLP.hers); ls.forEach((l, i) => tx(l, sx + 8, yy + 3 + i * lh, b, TLP.moon)); yy += ls.length * lh + 8;
    }
    yy += 2;
    for (const r of ['Five more minutes, love', 'Coming!']) {
      const ls = wrap(r, sw - 16, b), bh = ls.length * lh + 5;
      if (yy + bh > 358) break;
      rect(sx + 4, yy + 1, sw - 8, bh, TLP.wine); rect(sx + 4, yy, sw - 8, bh, TLP.gold); ls.forEach((l, i) => tx(l, sx + sw / 2, yy + 3 + i * lh, b, TLP.ink, { align: 'c' })); yy += bh + 5;
    }
  }
  ctx.putImageData(img, 0, 0);
}
