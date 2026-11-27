// ===========================================================================
// Windows 98 on the monitor (decided 2026-11-19: the PC looks like Windows 98/XP; handoff 0 and 4.1, #55).
// The desk's Graphite palette, palette-exact: face u6 (Platinum greige), light moon, shadow u5, dark u1; the
// title bar's blues are three UI-only slots (34 to 36) that only ever sit on the monitor's glass. Text: Tiny5 only.
// ===========================================================================
const W98 = { face: () => P.u6, light: () => P.moon, shadow: () => P.u5, dark: () => P.u1, text: () => P.u1 };
// raised: light top-left outside, dark bottom-right outside, shadow bottom-right inside (a button, a window)
function w98Raised(x, y, w, h, face = P.u6) {
  rectI(x, y, w, h, face);
  rectI(x, y, w - 1, 1, P.moon); rectI(x, y, 1, h - 1, P.moon);
  rectI(x, y + h - 1, w, 1, P.u1); rectI(x + w - 1, y, 1, h, P.u1);
  rectI(x + 1, y + h - 2, w - 2, 1, P.u5); rectI(x + w - 2, y + 1, 1, h - 2, P.u5);
}
// sunken: a field, the tray, a pressed button
function w98Sunken(x, y, w, h, face = P.moon) {
  rectI(x, y, w, h, face);
  rectI(x, y, w - 1, 1, P.u5); rectI(x, y, 1, h - 1, P.u5);
  rectI(x + 1, y + 1, w - 3, 1, P.u1); rectI(x + 1, y + 1, 1, h - 3, P.u1);
  rectI(x, y + h - 1, w, 1, P.moon); rectI(x + w - 1, y, 1, h, P.moon);
}
// the pressed task button: sunken with the light checker Windows used for "down"
function w98Down(x, y, w, h) {
  w98Sunken(x, y, w, h, P.u6);
  for (let j = y + 2; j < y + h - 1; j++) for (let i = x + 2; i < x + w - 1; i++) if ((i + j) & 1) putI(i, j, P.moon);
}
// the title bar: navy to sky in three steps with checker seams; inactive is grey
function w98Title(x, y, w, title, o = {}) {
  const h = 11, act = o.active !== false;
  const c = act ? [P.wnavy, P.wblue, P.wsky] : [P.u4, P.u5, P.u5];
  for (let i = 0; i < w; i++) {
    const f = i / w * 2.999, k = Math.floor(f), fr = f - k, seam = fr > 0.85 && k < 2;
    for (let j = 0; j < h; j++) putI(x + i, y + j, seam && ((i + j) & 1) ? c[k + 1] : c[k]);
  }
  let tx = x + 3;
  if (o.icon) { o.icon(x + 2, y + 2); tx += 11; }
  text(title, tx, y + 3, 'tiny', act ? P.moon : P.u6);
  // caption buttons: minimise, maximise, close
  const bx = x + w - 2;
  const cap = (bx0, g) => { w98Raised(bx0, y + 2, 9, 8); g(bx0, y + 2); };
  cap(bx - 9, (a, b) => { rectI(a + 2, b + 2, 4, 1, P.u1); putI(a + 2, b + 3, P.u1); putI(a + 5, b + 3, P.u1); for (let k = 0; k < 4; k++) { putI(a + 2 + k, b + 2 + k, P.u1); putI(a + 5 - k, b + 2 + k, P.u1); } });
  if (!o.dialog) {
    cap(bx - 20, (a, b) => { rectI(a + 2, b + 2, 5, 4, P.u1); rectI(a + 3, b + 4, 3, 1, P.u6); rectI(a + 3, b + 3, 3, 1, P.u6); rectI(a + 2, b + 2, 5, 1, P.u1); });
    cap(bx - 29, (a, b) => rectI(a + 2, b + 5, 4, 1, P.u1));
  }
}
// a window: the raised frame, the title, a face; returns the client rectangle
function w98Window(x, y, w, h, title, o = {}) {
  w98Raised(x, y, w, h);
  rectI(x + 1, y + 1, w - 3, 1, P.u6); rectI(x + 1, y + 1, 1, h - 3, P.u6);
  w98Title(x + 3, y + 3, w - 6, title, o);
  return [x + 3, y + 15, w - 6, h - 18];
}
// a push button; the default one gets the extra dark ring and the dotted focus
function w98Button(x, y, w, h, label, o = {}) {
  if (o.pressed) w98Sunken(x, y, w, h, P.u6); else w98Raised(x, y, w, h);
  if (o.def) { frameI(x - 1, y - 1, w + 2, h + 2, P.u1); for (let i = x + 3; i < x + w - 3; i += 2) { putI(i, y + 3, P.u1); putI(i, y + h - 4, P.u1); } for (let j = y + 3; j < y + h - 3; j += 2) { putI(x + 3, j, P.u1); putI(x + w - 4, j, P.u1); } }
  const off = o.pressed ? 1 : 0;
  if (o.disabled) { text(label, x + w / 2 + 1 + off, y + (h - 5) / 2 + 1 + off, 'tiny', P.moon, { align: 'c' }); text(label, x + w / 2 + off, y + (h - 5) / 2 + off, 'tiny', P.u5, { align: 'c' }); }
  else text(label, x + w / 2 + off, y + Math.floor((h - 5) / 2) + off, 'tiny', o.color ?? P.u1, { align: 'c' });
}
// the Windows flag, 9 x 8: four panes with a wave, crimson, moss, steel and gold
function w98Flag(x, y) {
  const F = ['.RRR.GGG.', 'RRRR.GGGG', 'RRR.GGGG.', '.........', '.BBB.YYY.', 'BBBB.YYYY', 'BBB.YYYY.', '.........'];
  F.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') putI(x + i, y + j, { R: P.crimson, G: P.g5, B: P.steel, Y: P.gold }[c]); }));
}
// the green Excel sheet icon, 8 x 8; and Loot Night's crossed swords on arcane
function xlIcon8(x, y) { rectI(x, y, 8, 8, P.g4); rectI(x + 1, y + 1, 6, 6, P.moon); rectI(x + 1, y + 3, 6, 1, P.g4); rectI(x + 3, y + 1, 1, 6, P.g4); lineI(x, y, x + 3, y + 3, P.g5); rectI(x, y, 4, 4, P.g5); putI(x + 1, y + 1, P.moon); putI(x + 2, y + 2, P.moon); }
function lnIcon8(x, y) { rectI(x, y, 8, 8, P.arcane); rectI(x, y + 7, 8, 1, P.d2); lineI(x + 1, y + 1, x + 6, y + 6, P.moon); lineI(x + 6, y + 1, x + 1, y + 6, P.moon); putI(x + 1, y + 6, P.gold); putI(x + 6, y + 6, P.gold); }

// ---------------------------------------------------------------- the taskbar (474 x 15 at the screen's foot)
// Start, the two task buttons (the front one pressed; Loot Night flashes navy when it needs you), "Tab = switch",
// then Sleep and the tray (the wallet in zl, the clock; the clock turns crimson after 01:00).
function taskbar98(st, t, screen) {
  const [x0, y0, w] = RSZ.task, x1 = x0 + w - 1;
  rectI(x0, y0, w, 15, P.u6); rectI(x0, y0, w, 1, P.u6); rectI(x0, y0 + 1, w, 1, P.moon);
  // Start
  w98Raised(x0 + 2, y0 + 3, 38, 11); w98Flag(x0 + 5, y0 + 5); text('Start', x0 + 16, y0 + 6, 'tiny', P.u1);
  rectI(x0 + 43, y0 + 3, 1, 11, P.u5); rectI(x0 + 44, y0 + 3, 1, 11, P.moon);
  // task buttons
  const flash = st.flash && Math.floor(t * 2.5) % 2 === 0;
  const task = (x, label, ic, front, fl) => {
    const tw = 76;
    if (fl) { rectI(x, y0 + 3, tw, 11, P.wnavy); frameI(x, y0 + 3, tw, 11, P.u1); rectI(x, y0 + 3, tw - 1, 1, P.moon); rectI(x, y0 + 3, 1, 10, P.moon); }
    else if (front) w98Down(x, y0 + 3, tw, 11); else w98Raised(x, y0 + 3, tw, 11);
    ic(x + 3, y0 + 5);
    text(fitTiny(label, tw - 16), x + 14, y0 + 6, 'tiny', fl ? P.moon : P.u1);
    return tw;
  };
  let x = x0 + 48;
  // the app in front is pressed; the other one carries the key that switches to it (the Tonight note is taped from x 208)
  x += task(x, screen === 'excel' ? 'Loot Night · Tab' : 'Loot Night', lnIcon8, screen !== 'excel', flash) + 3;
  x += task(x, screen === 'excel' ? 'Excel' : 'Excel · Tab', xlIcon8, screen === 'excel', false) + 6;
  // tray: the wallet and the clock in a sunken well
  const zs = st.zl + ' z', zw = measure(zs, 'tiny') + 4, cs = st.clock, cw = measure(cs, 'tiny');
  const tw = zw + cw + 16 + (st.witching ? 0 : 0), tx = x1 - tw - 2;
  w98Sunken(tx, y0 + 3, tw, 11, P.u6);
  text(zs, tx + 4, y0 + 6, 'tiny', P.g3); glyph('lstroke', tx + 4 + measure(zs, 'tiny') - 1, y0 + 5, P.g3);
  text(cs, tx + tw - 4, y0 + 6, 'tiny', st.witching ? P.crimson : P.u1, { align: 'r' });
  // Sleep: a button with the power glyph, greyed until 23:00
  const on = st.clock < '20' && st.clock >= '00' ? true : st.clock >= '23';
  const sl = on ? 'Sleep' : 'Sleep (23:00+)', sw = measure(sl, 'tiny') + 17, sx = tx - sw - 3;
  w98Raised(sx, y0 + 3, sw, 11);
  glyph('power', sx + 4, y0 + 6, on ? P.u1 : P.u5);
  if (on) text(sl, sx + 12, y0 + 6, 'tiny', P.u1); else { text(sl, sx + 13, y0 + 7, 'tiny', P.moon); text(sl, sx + 12, y0 + 6, 'tiny', P.u5); }
  if (st.witching) text('witching hour', sx - 4, y0 + 6, 'tiny', P.wine, { align: 'r' });
}
function fitTiny(s, w) { if (measure(s, 'tiny') <= w) return s; while (s.length > 1 && measure(s + '...', 'tiny') > w) s = s.slice(0, -1); return s + '...'; }
