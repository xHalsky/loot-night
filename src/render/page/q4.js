// ===========================================================================
// Q4: the Excel clicker (handoff step 4, #55). A maximised Windows 98 Excel window over the whole game screen
// (474 x 232): your job title and the bar to the next promotion, zl per second, the Hustle meter, the four toys
// (AutoSum, Fill flick, Sort, Pivot spinner) and the Macros pane with its Buy buttons. Every action pays and pops
// its zl in moss; a promotion is a Windows dialog with confetti. Desk palette (Graphite) plus the title-bar blues.
// ===========================================================================
let Q4_STATE = 'sum';      // sum | fill | sort | pivot | promo
const Q4 = {
  // numbers from the 2026-11-20 check (grid doc 7i): AutoSum 0.4, a filled cell 0.15, a pivot turn 1.2, each title x1.25,
  // macros cost base x 1.5^level; an Analyst with Intern 3, AutoFill 1, VLOOKUP 1 makes about 1.6 zl a second
  title: 'Analyst', next: 'Senior Analyst', life: 820, need: 1500, zlps: 1.61, wallet: 132, tonight: 86,
  macros: [
    { id: 'intern', name: 'Intern', lv: 3, base: 20, fx: (l) => `AutoSum ${(l * 0.5).toFixed(1)}x a second` },
    { id: 'autofill', name: 'AutoFill', lv: 1, base: 60, fx: (l) => `Fills ${l} cell${l === 1 ? '' : 's'} a second` },
    { id: 'vlookup', name: 'VLOOKUP', lv: 1, base: 150, fx: (l) => `+${l * 25}% a filled cell` },
    { id: 'cond', name: 'Conditional Formatting', lv: 0, base: 300, at: 'Senior Analyst', fx: (l) => `+${Math.max(1, l) * 2}% BALANCED chance` },
    { id: 'pivotm', name: 'Pivot macro', lv: 0, base: 800, at: 'Senior Analyst', fx: (l) => `Spins ${(Math.max(1, l) * 0.3).toFixed(1)} turns a second` },
    { id: 'pq', name: 'Power Query', lv: 0, base: 4000, at: 'Manager', fx: (l) => `+${Math.max(1, l) * 100}% all the macros earn` },
  ],
};
const Q4_ROWS = [['North', 1204, 318], ['South', 980, 412], ['East', 1415, 96], ['West', 760, 704], ['Online', 2210, 151], ['Retail', 1188, 563], ['Misc', 342, 287]];
const Q4X = { rh: 14, A: [14, 60], B: [74, 48], C: [122, 48], D: [170, 48], E: [218, 96], pane: [324, 150] };
let Q4_CANVAS = null;
// Excel's pointers: the Windows arrow, the fat white cell cross, the thin black fill cross
const PTR_ARROW = ['v.......', 'vv......', 'vMv.....', 'vMMv....', 'vMMMv...', 'vMMMMv..', 'vMMMMMv.', 'vMMMMMMv', 'vMMMvvvv', 'vMvMv...', 'vv.vMv..', 'v...vMv.', '.....vv.'];
const PTR_CELL = ['...vvvv...', '...vMMv...', '...vMMv...', 'vvvvMMvvvv', 'vMMMMMMMMv', 'vMMMMMMMMv', 'vvvvMMvvvv', '...vMMv...', '...vMMv...', '...vvvv...'];
const PTR_FILL = ['...v...', '...v...', '...v...', 'vvvvvvv', '...v...', '...v...', '...v...'];
const ptr = (rows, x, y) => sprite(Math.round(x), Math.round(y), rows);
// "N zł": Tiny5 has no ł, so the l is the hand-drawn glyph after the z (as on the taskbar)
function zlText(s, x, y, col, al = 'l', o = {}) {
  const str = s + ' z', w = measure(str, 'tiny') + 5, x0 = al === 'c' ? Math.round(x - w / 2) : al === 'r' ? x - w : x;
  text(str, x0, y, 'tiny', col, o); if (o.outline != null) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) glyph('lstroke', x0 + w - 4 + dx, y - 1 + dy, o.outline);
  glyph('lstroke', x0 + w - 4, y - 1, col); return w;
}
function q4Pop(s, x, y, k, col = P.g3) { if (k < 0 || k > 1) return; const Y = Math.round(y - k * 16); if (s.endsWith(' zl')) zlText(s.slice(0, -3), Math.round(x), Y, col, 'c', { outline: P.moon }); else text(s, Math.round(x), Y, 'tiny', col, { align: 'c', outline: P.moon }); }
// a cell's box in the sheet: column letter, row number (1-based)
function q4Cell(col, row) { const [x, w] = Q4X[col]; return [x, 64 + (row - 1) * Q4X.rh, w, Q4X.rh]; }
function q4Text(col, row, s, idx = P.u1, al = 'l') { const [x, y, w] = q4Cell(col, row); text(s, al === 'r' ? x + w - 3 : al === 'c' ? x + w / 2 : x + 3, y + 5, 'tiny', idx, { align: al }); }
const fmt = (n) => Math.round(n).toLocaleString('en-US');
function drawQ4(t, v = DESK_VARIANT) {
  if (!Q4_CANVAS) { Q4_CANVAS = document.createElement('canvas'); Q4_CANVAS.width = GS_W; Q4_CANVAS.height = GS_H; }
  setRes(GS_W, GS_H);
  const F = buf('q4', GS_W, GS_H); clearFrame(F); bind(F); CLIP = null;
  const S = Q4_STATE;
  rectI(0, 0, W, H, P.u6);
  // ---- the window: title, menu, toolbar, formula bar
  w98Title(1, 1, W - 2, 'Microsoft Excel - Q4_report_FINAL_v3.xls', { icon: xlIcon8 });
  let mx = 6; for (const m of ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Data', 'Window', 'Help']) { text(m, mx, 15, 'tiny', P.u1); putI(mx, 20, P.u1); mx += measure(m, 'tiny') + 9; }
  rectI(0, 22, W, 1, P.u5); rectI(0, 23, W, 1, P.moon);
  let tx = 4;
  const tool = (draw, pressed) => { if (pressed) w98Sunken(tx, 25, 14, 13, P.u6); draw(tx + 3, 27); tx += 15; };
  const sep = () => { rectI(tx + 1, 26, 1, 11, P.u5); rectI(tx + 2, 26, 1, 11, P.moon); tx += 5; };
  tool((x, y) => { rectI(x + 1, y, 6, 8, P.moon); frameI(x + 1, y, 6, 8, P.u1); });
  tool((x, y) => { rectI(x, y + 2, 8, 6, P.gold); frameI(x, y + 2, 8, 6, P.u1); rectI(x, y + 1, 3, 1, P.u1); });
  tool((x, y) => { rectI(x, y, 8, 8, P.u1); rectI(x + 2, y + 1, 4, 2, P.moon); rectI(x + 1, y + 5, 6, 3, P.moon); });
  sep();
  tool((x, y) => { lineI(x + 1, y, x + 6, y + 7, P.u1); lineI(x + 6, y, x + 1, y + 7, P.u1); });
  tool((x, y) => { frameI(x, y, 5, 6, P.u1); rectI(x + 3, y + 2, 5, 6, P.moon); frameI(x + 3, y + 2, 5, 6, P.u1); });
  tool((x, y) => { rectI(x + 1, y + 1, 6, 7, P.u5); rectI(x + 2, y, 4, 2, P.u1); rectI(x + 2, y + 3, 4, 4, P.moon); });
  sep();
  tool((x, y) => glyph('sigma', x + 2, y + 1, P.u1));
  tool((x, y) => { text('A', x, y + 1, 'tiny', P.u1); lineI(x + 6, y, x + 6, y + 7, P.u1); putI(x + 5, y + 6, P.u1); putI(x + 7, y + 6, P.u1); });
  tool((x, y) => { rectI(x, y + 4, 2, 4, P.wblue); rectI(x + 3, y + 1, 2, 7, P.crimson); rectI(x + 6, y + 3, 2, 5, P.g5); });
  sep();
  w98Sunken(tx + 2, 26, 30, 11, P.moon); text('100%', tx + 5, 29, 'tiny', P.u1); tx += 36;
  // the Macros pane's toggle, held down
  w98Down(W - 50, 25, 46, 13); text('Macros', W - 27, 29, 'tiny', P.u1, { align: 'c' });
  // formula bar
  rectI(0, 39, W, 1, P.u5);
  w98Sunken(2, 41, 40, 11); w98Sunken(56, 41, W - 58, 11);
  const sel = S === 'fill' ? 'C5' : S === 'sort' ? 'D5' : S === 'pivot' ? 'E5' : 'B12';
  const formula = S === 'fill' ? '1204' : S === 'sort' ? '=SORT(D5:D11)' : S === 'pivot' ? '=GETPIVOTDATA("Sum",E5)' : '=SUM(B5:B11)';
  text(sel, 6, 44, 'tiny', P.u1); text('=', 46, 44, 'tiny', P.u5); text(formula, 60, 44, 'tiny', P.u1);
  // ---- the sheet: column letters, row numbers, the grid (rows 12 tall)
  const top = 54, rh = 12, rows = 12, gy = top + 10, rowY = (r) => gy + (r - 1) * rh;   // r = the sheet's row number
  rectI(0, top, 314, 10, P.u6); rectI(0, top + 9, 314, 1, P.u5);
  for (const c of ['A', 'B', 'C', 'D', 'E']) { const [x, w] = Q4X[c]; rectI(x + w - 1, top, 1, 10, P.u5); text(c, x + w / 2, top + 2, 'tiny', P.u1, { align: 'c' }); }
  rectI(14, gy, 300, 140, P.moon);
  for (let r = 1; r <= rows; r++) { const y = rowY(r); if (y >= gy + 140) break; w98Raised(0, y, 14, Math.min(rh, gy + 140 - y)); text(String(r), 7, y + 4, 'tiny', P.u1, { align: 'c' }); rectI(14, y + rh - 1, 300, 1, P.u6); }
  for (const c of ['A', 'B', 'C', 'D', 'E']) { const [x, w] = Q4X[c]; rectI(x + w - 1, gy, 1, 140, P.u6); }
  const cellT = (c, r, s, idx = P.u1, al = 'l') => { const [x, w] = Q4X[c]; text(s, al === 'r' ? x + w - 4 : al === 'c' ? x + w / 2 : x + 3, rowY(r) + 4, 'tiny', idx, { align: al }); };
  // rows 1 and 2: the job, the bar to the next promotion, what Q4 pays and the Hustle
  const promoK = S === 'promo' ? clamp((t % 7) / 1.6) : 0, up = S === 'promo' && promoK >= 1;
  const title = up ? 'Senior Analyst' : Q4.title, next = up ? 'Team Lead' : Q4.next, need = up ? 6000 : Q4.need, lifeShown = up ? 1500 : S === 'promo' ? lerp(1420, 1500, promoK) : Q4.life;
  cellT('A', 1, 'Job', P.u4); cellT('B', 1, title);
  { const [bx] = Q4X.C, bw = 192, y = rowY(1) + 1, f = clamp(lifeShown / need), n = Math.round((bw - 2) * f);
    rectI(bx, y, bw - 1, rh - 2, P.moon); frameI(bx, y, bw - 1, rh - 2, P.u5);
    rectI(bx + 1, y + 1, n, rh - 4, P.g6); rectI(bx + 1, y + 1, n, 1, P.moon); rectI(bx + 1, y + rh - 4, n, 1, P.g5);
    text('to ' + next, bx + 3, y + 3, 'tiny', P.u1); text(fmt(lifeShown) + ' / ' + fmt(need), bx + bw - 4, y + 3, 'tiny', P.u1, { align: 'r' }); }
  const sortOn = S === 'sort' && (t % 6) > 1.1;
  const hust = 3 - 2 * clamp(((t % 15) + 3) / 15);
  cellT('A', 2, 'Pays', P.u4);
  { const pw = zlText((Q4.zlps * (sortOn ? 2 : 1)).toFixed(2), Q4X.B[0] + 3, rowY(2) + 4, P.g3); text('/s', Q4X.B[0] + 4 + pw, rowY(2) + 4, 'tiny', P.g3); }
  if (sortOn) { const s = 'x2 · ' + Math.max(0, Math.ceil(5 - ((t % 6) - 1.1))) + ' s', bw = measure(s, 'tiny') + 6, bx = Q4X.C[0] + 2, y = rowY(2) + 2; if ((t % 6) < 6.1 && 5 - ((t % 6) - 1.1) > 0) { rectI(bx, y, bw, 9, P.gold); rectI(bx, y, bw, 1, P.pale); rectI(bx, y + 8, bw, 1, P.copper); text(s, bx + 3, y + 2, 'tiny', P.u1); } }
  cellT('D', 2, 'Hustle', P.u4);
  { const hx = Q4X.D[0] + 34, hw = 104, y = rowY(2) + 1, n = Math.round((hw - 2) * (hust - 1) / 2);
    rectI(hx, y, hw, rh - 2, P.moon); frameI(hx, y, hw, rh - 2, P.u5); rectI(hx + 1, y + 1, n, rh - 4, P.copper); rectI(hx + 1, y + 1, n, 1, P.pale);
    text('x' + hust.toFixed(1), hx + hw - 4, y + 3, 'tiny', P.u1, { align: 'r' }); }
  // row 3: the report's headers, a grey fill and a rule under them
  rectI(14, rowY(3), 300, rh - 1, P.u6);
  for (const [c, s] of [['A', 'Region'], ['B', 'AutoSum'], ['C', 'Fill'], ['D', 'Sort'], ['E', 'PivotTable']]) cellT(c, 3, s, P.u1);
  rectI(14, rowY(3) + rh - 1, 300, 1, P.u4);
  // rows 4 to 8: the regions; row 9: the total
  for (let k = 0; k < 5; k++) cellT('A', 4 + k, Q4_ROWS[k][0]);
  // B: AutoSum. Click the big sigma: the column rolls for 0.4 s, the total ticks, it pays; 10% BALANCED (x5)
  const qs = t % 3, press = S === 'sum' && qs > 0.6 && qs < 0.72, roll = S === 'sum' && qs > 0.6 && qs < 1.0, bal = S === 'sum' && Math.floor(t / 3) % 2 === 1 && qs > 1.0;
  for (let k = 0; k < 5; k++) cellT('B', 4 + k, fmt(roll ? Math.floor(hash(k, Math.floor(t * 30), 9) * 2400) : Q4_ROWS[k][1]), P.u1, 'r');
  const tot = Q4_ROWS.slice(0, 5).reduce((a, r) => a + r[1], 0);
  rectI(Q4X.B[0] + 1, rowY(9), Q4X.B[1] - 3, 1, P.u1); rectI(Q4X.B[0] + 1, rowY(9) + 2, Q4X.B[1] - 3, 1, P.u1);
  cellT('A', 9, 'Total'); cellT('B', 9, fmt(roll ? Math.floor(hash(3, Math.floor(t * 30), 9) * 9999) : tot), P.u1, 'r');
  if (S === 'sum') frameI(Q4X.B[0] - 1, rowY(9) - 1, Q4X.B[1] + 1, rh + 1, P.u1);
  // the big AutoSum button over rows 10 and 11
  const sx = Q4X.B[0] + 4, sy = rowY(10) + 1;
  if (press) w98Sunken(sx, sy, 40, 22, P.u6); else w98Raised(sx, sy, 40, 22);
  { const o = press ? 1 : 0; for (const [i, j] of [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [1, 1], [2, 2], [3, 3], [2, 4], [1, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [5, 5], [5, 1]]) rectI(sx + 5 + i * 2 + o, sy + 4 + j * 2 + o, 2, 2, P.u1); text('Sum', sx + 30 + o, sy + 9 + o, 'tiny', P.u1, { align: 'c' }); }
  if (S === 'sum') {
    q4Pop(bal ? '+6.3 zl' : '+1.3 zl', Q4X.C[0] + 22, rowY(9) + 2, (qs - 0.62) / 1.2);
    if (bal) {
      const sh = qs < 1.15 ? Math.round(Math.sin(t * 90) * 2) : 0, bx2 = Q4X.B[0] - 8 + sh, by2 = rowY(5) + 3;
      frameI(bx2, by2, 64, 15, P.crimson); frameI(bx2 + 2, by2 + 2, 60, 11, P.crimson);
      text('BALANCED', bx2 + 32, by2 + 5, 'tiny', P.crimson, { align: 'c' });
    }
    ptr(PTR_ARROW, sx + 22, sy + 10 + (press ? 1 : 0));
  }
  // C: Fill flick. Drag the fill handle down and let go: the cells fill in a cascade, a tick each, 0.15 zl a cell before the title and Hustle
  { const qf = t % 3.5, drag = S === 'fill' && qf > 0.4 && qf < 0.75, cells = 7;
    const filled = S === 'fill' && qf >= 0.75 && qf < 3.1 ? Math.min(cells, Math.floor((qf - 0.75) / 0.12)) : 0;
    const [cx0, cw] = Q4X.C;
    cellT('C', 4, '1,204', P.u1, 'r');
    for (let k = 1; k <= filled; k++) { cellT('C', 4 + k, fmt(1204 + k * 37), P.u1, 'r'); q4Pop('+0.6', cx0 + 11, rowY(4 + k) + 2, ((qf - 0.75) / 0.12 - k) / 5); }
    const selRows = S === 'fill' && drag ? 1 + Math.round((qf - 0.4) / 0.35 * cells) : 1, selH = rh * selRows;
    if (S === 'fill') { frameI(cx0 - 1, rowY(4) - 1, cw + 1, selH + 1, P.u1); frameI(cx0, rowY(4), cw - 1, selH - 1, P.u1); if (drag) for (let j = rowY(5); j < rowY(4) + selH; j++) if (j & 1) { putI(cx0 + 1, j, P.u4); putI(cx0 + cw - 3, j, P.u4); } }
    const hxp = cx0 + cw - 3, hyp = rowY(4) + selH - 3;
    if (S === 'fill' && qf < 3.1) { rectI(hxp - 1, hyp - 1, 6, 6, P.moon); rectI(hxp, hyp, 4, 4, P.u1); }
    if (S === 'fill') ptr(PTR_FILL, hxp - 1 + (drag ? 0 : 6 * (qf < 0.4 ? 1 - qf / 0.4 : qf > 0.75 ? Math.min(1, (qf - 0.75) * 2) : 0)), hyp - 1);
    else text('drag the corner', cx0 + cw / 2, rowY(10) + 4, 'tiny', P.u5, { align: 'c' });
  }
  // D: Sort. The column reshuffles like a split-flap board (0.6 s), then everything pays x2 for 5 s; cooldown 10 s
  { const qq = t % 6, flap = S === 'sort' && qq > 0.5 && qq < 1.1, sorted = S === 'sort' && qq >= 1.1;
    const vals = Q4_ROWS.slice(0, 5).map((r) => r[2]), order = sorted ? [...vals].sort((a, b) => a - b) : vals;
    const [dx0, dw] = Q4X.D;
    for (let k = 0; k < 5; k++) {
      const y = rowY(4 + k);
      if (flap) { rectI(dx0 + 3, y + 1, dw - 7, rh - 3, P.u1); rectI(dx0 + 3, y + 5, dw - 7, 1, P.u4); text(String(Math.floor(hash(k, Math.floor(t * 24), 12) * 900 + 100)), dx0 + dw - 6, y + 4, 'tiny', P.moon, { align: 'r' }); }
      else cellT('D', 4 + k, fmt(order[k]), P.u1, 'r');
    }
    const bx3 = dx0 + 4, by3 = rowY(10) + 1, cd = S === 'sort' && qq > 0.58 ? Math.max(0, 10 - (qq - 0.5)) : 0, prs = S === 'sort' && qq > 0.45 && qq < 0.58;
    w98Button(bx3, by3, 40, 22, cd ? 'Sort ' + Math.ceil(cd) + 's' : 'Sort A-Z', { pressed: prs, disabled: cd > 0 });
    if (S === 'sort') ptr(PTR_ARROW, bx3 + 22, by3 + 10);   // the x2 shows in row 2 and the status bar, not over the numbers
  }
  // E: the Pivot spinner (unlocks at Analyst): a PivotTable on a turntable; grab it and spin; momentum, friction
  { const [ex, ew] = Q4X.E, cx = ex + ew / 2, cy = rowY(6) + 2;
    let ang = 0.6, om = 0;
    if (S === 'pivot') { const q = t % 8; om = q < 0.6 ? 0 : 9 * Math.exp(-(q - 0.6) * 0.5); ang = q < 0.6 ? 0.6 : 0.6 + 9 * (1 - Math.exp(-(q - 0.6) * 0.5)) / 0.5; }
    for (let j = -13; j <= 13; j++) for (let i = -42; i <= 42; i++) { const d = (i / 42) ** 2 + (j / 13) ** 2; if (d <= 1) putI(cx + i, cy + 10 + j, d > 0.82 ? P.u4 : P.u5); }
    for (let i = -42; i <= 42; i++) { const jj = Math.round(13 * Math.sqrt(Math.max(0, 1 - (i / 42) ** 2))); putI(cx + i, cy + 10 + jj + 1, P.u3); putI(cx + i, cy + 10 + jj + 2, P.u3); }
    const R = 27, P3 = (u, w2) => { const c = Math.cos(ang), s = Math.sin(ang); return [cx + (u * c - w2 * s), cy + 8 + (u * s + w2 * c) * 0.42]; };
    for (let j = -16; j <= 26; j++) for (let i = -36; i <= 36; i++) {
      const X = i, Y = (j - 8) / 0.42, c = Math.cos(-ang), s = Math.sin(-ang), u = X * c - Y * s, w2 = X * s + Y * c;
      if (Math.abs(u) > R || Math.abs(w2) > R * 0.75) continue;
      putI(cx + i, cy + j, w2 < -R * 0.75 + 12 ? P.wblue : P.moon);
    }
    for (const k of [-1, -1 / 3, 1 / 3, 1]) { const [a1, b1] = P3(k * R, -R * 0.75), [a2, b2] = P3(k * R, R * 0.75); lineI(a1, b1, a2, b2, P.u4); }
    for (const k of [-1, -0.25, 0.375, 1]) { const [a1, b1] = P3(-R, k * R * 0.75), [a2, b2] = P3(R, k * R * 0.75); lineI(a1, b1, a2, b2, P.u4); }
    const [hx2, hy2] = P3(R, R * 0.75); rectI(Math.round(hx2) - 1, Math.round(hy2) - 1, 3, 3, P.u1);
    text(S === 'pivot' && om > 0.3 ? 'spinning' : 'grab and spin', cx, rowY(10) + 4, 'tiny', P.u5, { align: 'c' });
    if (S === 'pivot') {
      const turns = (ang - 0.6) / 6.283, whole = Math.floor(turns);
      for (let n = Math.max(1, whole - 2); n <= whole; n++) q4Pop('+3.8 zl', cx + (n % 2 ? 20 : -20), cy - 6, (turns - n) * 1.2);
      if ((t % 8) < 0.9) ptr(PTR_ARROW, hx2, hy2);
    }
  }
  // ---- the scroll bar, the sheet tabs, the status bar
  const sh = 150;
  rectI(314, top, 9, sh, P.u6); for (let j = top; j < top + sh; j++) for (let i = 314; i < 323; i++) if ((i + j) & 1) putI(i, j, P.moon);
  w98Raised(314, top, 9, 9); w98Raised(314, top + sh - 9, 9, 9); w98Raised(314, top + 12, 9, 30);
  const sy2 = top + sh + 1;
  rectI(0, sy2 - 1, 323, 1, P.u5);
  [['Q4', true], ['Q3_old', false], ['Sheet3', false]].forEach(([n, on], k) => { const x = 30 + k * 44; rectI(x, sy2, 42, 10, on ? P.moon : P.u6); frameI(x, sy2 - (on ? 1 : 0), 42, on ? 11 : 10, P.u1); if (on) rectI(x + 1, sy2 - 1, 40, 1, P.moon); text(n, x + 21, sy2 + 3, 'tiny', P.u1, { align: 'c' }); });
  for (const k of [0, 1]) w98Raised(4 + k * 11, sy2, 10, 10);
  const stY = H - 12;
  rectI(0, stY - 1, W, 1, P.moon);
  w98Sunken(2, stY, 120, 11, P.u6); text(sortOn ? 'Sorted. Everything x2.' : S === 'fill' ? 'Drag to fill' : 'Ready', 5, stY + 3, 'tiny', P.u1);
  w98Sunken(124, stY, 200, 11, P.u6); zlText('Q4 tonight: +' + Q4.tonight, 128, stY + 3, P.g3);
  w98Sunken(326, stY, W - 328, 11, P.u6); text('NUM', W - 8, stY + 3, 'tiny', P.u1, { align: 'r' });
  // ---- the Macros pane: what runs on its own, Buy at base x 1.5^level
  q4Macros(t, S);
  // ---- the promotion: a Windows dialog with confetti
  if (S === 'promo' && promoK >= 1) q4Promo(t % 7 - 1.6);
  usePal(deskSet(v));
  composeInto(Q4_CANVAS.getContext('2d'), F, { lights: [], ambient: [1, 1, 1], tint: 0, vig: 0 }, 0);
  usePal(PAL_BASE);
  return Q4_CANVAS;
}
const macroCost = (m) => Math.round(m.base * Math.pow(1.5, m.lv));
const TITLES = ['Intern', 'Junior Analyst', 'Analyst', 'Senior Analyst', 'Team Lead', 'Manager', 'Director'];
function q4Macros(t, S) {
  const [px, pw] = Q4X.pane, py = 54, ph = 165;
  w98Sunken(px, py, pw, ph, P.u6);
  // a tool-window title
  for (let i = px + 2; i < px + pw - 2; i++) for (let j = py + 2; j < py + 11; j++) putI(i, j, P.wnavy);
  text('Macros', px + 5, py + 4, 'tiny', P.moon); text('run while you play', px + pw - 5, py + 4, 'tiny', P.wsky, { align: 'r' });
  const promoted = S === 'promo' && (t % 7) >= 1.6, rank = TITLES.indexOf(promoted ? 'Senior Analyst' : Q4.title);
  Q4.macros.forEach((m, k) => {
    const y = py + 13 + k * 25, locked = m.at && TITLES.indexOf(m.at) > rank, cost = macroCost(m), ok = !locked && cost <= Q4.wallet, newly = promoted && m.at === 'Senior Analyst';
    if (k) { rectI(px + 3, y - 1, pw - 6, 1, P.u5); rectI(px + 3, y, pw - 6, 1, P.moon); }
    if (newly && Math.floor(t * 4) & 1) rectI(px + 2, y + 1, pw - 4, 23, P.pale);
    // its icon: a little macro sheet with a gear
    const ix = px + 5, iy = y + 4;
    rectI(ix, iy, 9, 9, locked ? P.u5 : P.g4); rectI(ix + 1, iy + 1, 7, 7, P.moon); rectI(ix + 1, iy + 3, 7, 1, locked ? P.u5 : P.g4); rectI(ix + 3, iy + 1, 1, 7, locked ? P.u5 : P.g4);
    if (locked) { rectI(ix + 3, iy + 4, 5, 4, P.u4); putI(ix + 4, iy + 3, P.u4); putI(ix + 6, iy + 3, P.u4); }
    const nc = locked ? P.u5 : P.u1;
    text(m.name, px + 18, y + 3, 'tiny', nc);
    if (!locked) text('Lv ' + m.lv, px + pw - 6, y + 3, 'tiny', P.u4, { align: 'r' });
    text(locked ? 'Unlocks at ' + m.at : m.fx(m.lv), px + 18, y + 11, 'tiny', locked ? P.u5 : P.u4);
    if (!locked) {
      // Buy: gold when you can afford it (the next action), greyed when you can't
      const bw = 40, bx = px + pw - bw - 5, by = y + 12;
      if (ok) { rectI(bx, by, bw, 11, P.gold); rectI(bx, by, bw - 1, 1, P.pale); rectI(bx, by, 1, 10, P.pale); rectI(bx, by + 10, bw, 1, P.u1); rectI(bx + bw - 1, by, 1, 11, P.u1); rectI(bx + 1, by + 9, bw - 2, 1, P.copper); }
      else w98Raised(bx, by, bw, 11);
      if (ok) zlText(String(cost), bx + bw / 2, by + 3, P.u1, 'c');
      else { zlText(String(cost), bx + bw / 2 + 1, by + 4, P.moon, 'c'); zlText(String(cost), bx + bw / 2, by + 3, P.u5, 'c'); }
      // the effect line would run under the button: keep it short of it
    }
  });
}
// "Congrats on your promotion!": a Windows dialog, the new title, what it unlocked, OK; confetti for 1.5 s
function q4Promo(k) {
  const w = 214, h = 82, x = Math.round((W - w) / 2) - 70, y = 70;
  shadowFlat(x + 3, y + 3, w, h);
  const [cx, cy] = w98Window(x, y, w, h, 'Microsoft Excel', { dialog: true, icon: xlIcon8 });
  // the icon: a gold star-medal
  const ix = cx + 8, iy = cy + 6;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const d = Math.hypot(i - 7.5, j - 7.5); if (d < 7.5) putI(ix + i, iy + j, d > 6.4 ? P.copper : d > 5.4 ? P.gold : P.pale); }
  sprite(ix + 5, iy + 4, ['..O..', '..O..', 'OOOOO', '.OOO.', 'O...O'].map((r) => r), { O: 'copper' });
  text('Congrats on your promotion!', cx + 32, cy + 6, 'tiny', P.u1);
  text('You are now a Senior Analyst.', cx + 32, cy + 15, 'tiny', P.u1);
  text('Q4 pays x1.25. Unlocked:', cx + 32, cy + 27, 'tiny', P.u4);
  text('Conditional Formatting, Pivot macro.', cx + 32, cy + 35, 'tiny', P.u4);
  w98Button(cx + w / 2 - 24, cy + 48, 42, 14, 'OK', { def: true });
  // confetti: squares in the meaning colours, flung up and falling, gone after 1.5 s
  if (k < 1.5) {
    const cols = [P.gold, P.crimson, P.g5, P.steel, P.moon, P.arcane, P.pale];
    for (let n = 0; n < 70; n++) {
      const a = hash(n, 1, 31) * Math.PI - Math.PI, sp = 40 + hash(n, 2, 31) * 90, vx = Math.cos(a) * sp * 0.9, vy = Math.sin(a) * sp - 30;
      const X = x + w / 2 + vx * k, Y = y + 20 + vy * k + 120 * k * k;
      if (Y > H || X < 0 || X > W) continue;
      const big = hash(n, 3, 31) > 0.6, flip = Math.floor(k * 12 + n) & 1;
      rectI(Math.round(X), Math.round(Y), big && !flip ? 2 : 1, big ? 2 : 1, cols[n % cols.length]);
    }
  }
}
function shadowFlat(x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if ((i + j) & 1) putI(i, j, P.u1); }

// ---------------------------------------------------------------- live (step 4, #55): the game's Q4
// st: the game's view (render/q4View.ts): title, next, life, need, zlps, tonight, wallet; sortT, sortCd, flap (0..1 or
// -1), hustle (x1 to x3); sums, roll, stamp (0..1); fill { done, sel }; pivot { ang, om, unlocked, at }; macros [{ id,
// name, lv, cost, fx, locked, at, ok, flash }]; pops [{ s, toy, i, k }]; promo { title, mult, unlocks, k } or null;
// press ('sum' | 'sort' | ''); last (the toy for the formula bar); status. Returns the canvas and the hit regions.
let Q4_HITS = [];
const q4Hit = (x, y, w, h, act, arg = '') => Q4_HITS.push({ x, y, w, h, act, arg, tip: '' });
function drawQ4Live(st, t, v = DESK_VARIANT) {
  if (!Q4_CANVAS) { Q4_CANVAS = document.createElement('canvas'); Q4_CANVAS.width = GS_W; Q4_CANVAS.height = GS_H; }
  Q4_HITS = [];
  setRes(GS_W, GS_H);
  const F = buf('q4', GS_W, GS_H); clearFrame(F); bind(F); CLIP = null;
  rectI(0, 0, W, H, P.u6);
  // ---- the window: title, menu, toolbar, formula bar
  w98Title(1, 1, W - 2, 'Microsoft Excel - Q4_report_FINAL_v3.xls', { icon: xlIcon8 });
  let mx = 6; for (const m of ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Data', 'Window', 'Help']) { text(m, mx, 15, 'tiny', P.u1); putI(mx, 20, P.u1); mx += measure(m, 'tiny') + 9; }
  rectI(0, 22, W, 1, P.u5); rectI(0, 23, W, 1, P.moon);
  let tx = 4;
  const tool = (draw) => { draw(tx + 3, 27); tx += 15; };
  const sep = () => { rectI(tx + 1, 26, 1, 11, P.u5); rectI(tx + 2, 26, 1, 11, P.moon); tx += 5; };
  tool((x, y) => { rectI(x + 1, y, 6, 8, P.moon); frameI(x + 1, y, 6, 8, P.u1); });
  tool((x, y) => { rectI(x, y + 2, 8, 6, P.gold); frameI(x, y + 2, 8, 6, P.u1); rectI(x, y + 1, 3, 1, P.u1); });
  tool((x, y) => { rectI(x, y, 8, 8, P.u1); rectI(x + 2, y + 1, 4, 2, P.moon); rectI(x + 1, y + 5, 6, 3, P.moon); });
  sep();
  tool((x, y) => { lineI(x + 1, y, x + 6, y + 7, P.u1); lineI(x + 6, y, x + 1, y + 7, P.u1); });
  tool((x, y) => { frameI(x, y, 5, 6, P.u1); rectI(x + 3, y + 2, 5, 6, P.moon); frameI(x + 3, y + 2, 5, 6, P.u1); });
  tool((x, y) => { rectI(x + 1, y + 1, 6, 7, P.u5); rectI(x + 2, y, 4, 2, P.u1); rectI(x + 2, y + 3, 4, 4, P.moon); });
  sep();
  tool((x, y) => glyph('sigma', x + 2, y + 1, P.u1));
  tool((x, y) => { text('A', x, y + 1, 'tiny', P.u1); lineI(x + 6, y, x + 6, y + 7, P.u1); putI(x + 5, y + 6, P.u1); putI(x + 7, y + 6, P.u1); });
  tool((x, y) => { rectI(x, y + 4, 2, 4, P.wblue); rectI(x + 3, y + 1, 2, 7, P.crimson); rectI(x + 6, y + 3, 2, 5, P.g5); });
  sep();
  w98Sunken(tx + 2, 26, 30, 11, P.moon); text('100%', tx + 5, 29, 'tiny', P.u1);
  w98Down(W - 50, 25, 46, 13); text('Macros', W - 27, 29, 'tiny', P.u1, { align: 'c' });
  rectI(0, 39, W, 1, P.u5);
  w98Sunken(2, 41, 40, 11); w98Sunken(56, 41, W - 58, 11);
  const L = st.last, sel = L === 'fill' ? 'C5' : L === 'sort' ? 'D5' : L === 'pivot' ? 'E5' : 'B12';
  const formula = L === 'fill' ? '1204' : L === 'sort' ? '=SORT(D5:D11)' : L === 'pivot' ? '=GETPIVOTDATA("Sum",E5)' : '=SUM(B5:B11)';
  text(sel, 6, 44, 'tiny', P.u1); text('=', 46, 44, 'tiny', P.u5); text(formula, 60, 44, 'tiny', P.u1);
  // ---- the sheet
  const top = 54, rh = 12, gy = top + 10, rowY = (r) => gy + (r - 1) * rh;
  rectI(0, top, 314, 10, P.u6); rectI(0, top + 9, 314, 1, P.u5);
  for (const c of ['A', 'B', 'C', 'D', 'E']) { const [x, w] = Q4X[c]; rectI(x + w - 1, top, 1, 10, P.u5); text(c, x + w / 2, top + 2, 'tiny', P.u1, { align: 'c' }); }
  rectI(14, gy, 300, 140, P.moon);
  for (let r = 1; r <= 12; r++) { const y = rowY(r); if (y >= gy + 140) break; w98Raised(0, y, 14, Math.min(rh, gy + 140 - y)); text(String(r), 7, y + 4, 'tiny', P.u1, { align: 'c' }); rectI(14, y + rh - 1, 300, 1, P.u6); }
  for (const c of ['A', 'B', 'C', 'D', 'E']) { const [x, w] = Q4X[c]; rectI(x + w - 1, gy, 1, 140, P.u6); }
  const cellT = (c, r, s, idx = P.u1, al = 'l') => { const [x, w] = Q4X[c]; text(s, al === 'r' ? x + w - 4 : al === 'c' ? x + w / 2 : x + 3, rowY(r) + 4, 'tiny', idx, { align: al }); };
  // row 1: the job and the bar to the next title
  cellT('A', 1, 'Job', P.u4); cellT('B', 1, st.title);
  { const [bx] = Q4X.C, bw = 192, y = rowY(1) + 1, f = st.next ? clamp(st.life / st.need) : 1, n = Math.round((bw - 2) * f);
    rectI(bx, y, bw - 1, rh - 2, P.moon); frameI(bx, y, bw - 1, rh - 2, P.u5);
    rectI(bx + 1, y + 1, n, rh - 4, P.g6); rectI(bx + 1, y + 1, n, 1, P.moon); rectI(bx + 1, y + rh - 4, n, 1, P.g5);
    text(st.next ? 'to ' + st.next : 'top of the ladder', bx + 3, y + 3, 'tiny', P.u1);
    if (st.next) text(fmt(st.life) + ' / ' + fmt(st.need), bx + bw - 4, y + 3, 'tiny', P.u1, { align: 'r' }); }
  // row 2: what the macros pay, Sort's x2, Hustle
  cellT('A', 2, 'Pays', P.u4);
  { const pw = zlText(st.zlps.toFixed(2), Q4X.B[0] + 3, rowY(2) + 4, P.g3); text('/s', Q4X.B[0] + 4 + pw, rowY(2) + 4, 'tiny', P.g3); }
  if (st.sortT > 0) { const s = 'x2 · ' + Math.ceil(st.sortT) + ' s', bw = measure(s, 'tiny') + 6, bx = Q4X.C[0] + 2, y = rowY(2) + 2; rectI(bx, y, bw, 9, P.gold); rectI(bx, y, bw, 1, P.pale); rectI(bx, y + 8, bw, 1, P.copper); text(s, bx + 3, y + 2, 'tiny', P.u1); }
  cellT('D', 2, 'Hustle', P.u4);
  { const hx = Q4X.D[0] + 34, hw = 104, y = rowY(2) + 1, n = Math.round((hw - 2) * (st.hustle - 1) / 2);
    rectI(hx, y, hw, rh - 2, P.moon); frameI(hx, y, hw, rh - 2, P.u5); rectI(hx + 1, y + 1, n, rh - 4, P.copper); if (n) rectI(hx + 1, y + 1, n, 1, P.pale);
    text('x' + st.hustle.toFixed(1), hx + hw - 4, y + 3, 'tiny', P.u1, { align: 'r' }); }
  // row 3: the headers
  rectI(14, rowY(3), 300, rh - 1, P.u6);
  for (const [c, s] of [['A', 'Region'], ['B', 'AutoSum'], ['C', 'Fill'], ['D', 'Sort'], ['E', 'PivotTable']]) cellT(c, 3, s, P.u1);
  rectI(14, rowY(3) + rh - 1, 300, 1, P.u4);
  for (let k = 0; k < 5; k++) cellT('A', 4 + k, Q4_ROWS[k][0]);
  // B: AutoSum: the numbers (they change with every sum), the roll, the total, the big button, BALANCED
  const vals = Q4_ROWS.slice(0, 5).map((r, k) => r[1] + Math.floor(hash(k, st.sums, 21) * 600) - 300);
  for (let k = 0; k < 5; k++) cellT('B', 4 + k, fmt(st.roll ? Math.floor(hash(k, Math.floor(t * 30), 9) * 2400) : vals[k]), P.u1, 'r');
  const tot = vals.reduce((a, b) => a + b, 0);
  rectI(Q4X.B[0] + 1, rowY(9), Q4X.B[1] - 3, 1, P.u1); rectI(Q4X.B[0] + 1, rowY(9) + 2, Q4X.B[1] - 3, 1, P.u1);
  cellT('A', 9, 'Total'); cellT('B', 9, fmt(st.roll ? Math.floor(hash(3, Math.floor(t * 30), 9) * 9999) : tot), P.u1, 'r');
  if (L === 'sum') frameI(Q4X.B[0] - 1, rowY(9) - 1, Q4X.B[1] + 1, rh + 1, P.u1);
  const sx = Q4X.B[0] + 4, sy = rowY(10) + 1, press = st.press === 'sum';
  if (press) w98Sunken(sx, sy, 40, 22, P.u6); else w98Raised(sx, sy, 40, 22);
  { const o = press ? 1 : 0; for (const [i, j] of [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [1, 1], [2, 2], [3, 3], [2, 4], [1, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [5, 5], [5, 1]]) rectI(sx + 5 + i * 2 + o, sy + 4 + j * 2 + o, 2, 2, P.u1); text('Sum', sx + 30 + o, sy + 9 + o, 'tiny', P.u1, { align: 'c' }); }
  q4Hit(sx, sy, 40, 22, 'q4Sum');
  // C: Fill flick: C4's value, the cells the flick filled (the cascade), the selection while you drag, the handle
  const [cx0, cw] = Q4X.C, fillN = st.fill ? Math.min(8, st.fill.done) : 0, selRows = 1 + Math.max(0, Math.min(8, st.fill?.sel ?? 0));
  cellT('C', 4, '1,204', P.u1, 'r');
  for (let k = 1; k <= fillN; k++) cellT('C', 4 + k, fmt(1204 + k * 37), P.u1, 'r');
  const selH = rh * selRows;
  frameI(cx0 - 1, rowY(4) - 1, cw + 1, selH + 1, P.u1); frameI(cx0, rowY(4), cw - 1, selH - 1, P.u1);
  if (selRows > 1) for (let j = rowY(5); j < rowY(4) + selH; j++) if (j & 1) { putI(cx0 + 1, j, P.u4); putI(cx0 + cw - 3, j, P.u4); }
  const hxp = cx0 + cw - 3, hyp = rowY(4) + selH - 3;
  rectI(hxp - 1, hyp - 1, 6, 6, P.moon); rectI(hxp, hyp, 4, 4, P.u1);
  q4Hit(hxp - 4, hyp - 4, 11, 11, 'q4Fill');
  text(st.fill?.sel ? 'let go to fill' : 'drag the corner', cx0 + cw / 2, rowY(10) + 4, 'tiny', P.u5, { align: 'c' });
  // D: Sort: the split-flap reshuffle, sorted while its x2 lasts; the button greys out for its cooldown
  { const flap = st.flap >= 0, raw = Q4_ROWS.slice(0, 5).map((r) => r[2]), order = st.sortT > 0 && !flap ? [...raw].sort((a, b) => a - b) : raw;
    const [dx0, dw] = Q4X.D;
    for (let k = 0; k < 5; k++) {
      const y = rowY(4 + k);
      if (flap) { rectI(dx0 + 3, y + 1, dw - 7, rh - 3, P.u1); rectI(dx0 + 3, y + 5, dw - 7, 1, P.u4); text(String(Math.floor(hash(k, Math.floor(t * 24), 12) * 900 + 100)), dx0 + dw - 6, y + 4, 'tiny', P.moon, { align: 'r' }); }
      else cellT('D', 4 + k, fmt(order[k]), P.u1, 'r');
    }
    const bx3 = dx0 + 4, by3 = rowY(10) + 1, cd = st.sortCd;
    w98Button(bx3, by3, 40, 22, cd > 0 ? 'Sort ' + Math.ceil(cd) + 's' : 'Sort A-Z', { pressed: st.press === 'sort', disabled: cd > 0 });
    q4Hit(bx3, by3, 40, 22, 'q4Sort'); }
  // E: the pivot spinner on its turntable (locked until Analyst)
  { const [ex, ew] = Q4X.E, cx = ex + ew / 2, cy = rowY(6) + 2, ang = st.pivot.ang, lock = !st.pivot.unlocked;
    for (let j = -13; j <= 13; j++) for (let i = -42; i <= 42; i++) { const d = (i / 42) ** 2 + (j / 13) ** 2; if (d <= 1) putI(cx + i, cy + 10 + j, d > 0.82 ? P.u4 : P.u5); }
    for (let i = -42; i <= 42; i++) { const jj = Math.round(13 * Math.sqrt(Math.max(0, 1 - (i / 42) ** 2))); putI(cx + i, cy + 10 + jj + 1, P.u3); putI(cx + i, cy + 10 + jj + 2, P.u3); }
    const R = 27, P3 = (u, w2) => { const c = Math.cos(ang), s = Math.sin(ang); return [cx + (u * c - w2 * s), cy + 8 + (u * s + w2 * c) * 0.42]; };
    for (let j = -16; j <= 26; j++) for (let i = -36; i <= 36; i++) {
      const X = i, Y = (j - 8) / 0.42, c = Math.cos(-ang), s = Math.sin(-ang), u = X * c - Y * s, w2 = X * s + Y * c;
      if (Math.abs(u) > R || Math.abs(w2) > R * 0.75) continue;
      putI(cx + i, cy + j, lock ? (((i + j) & 1) ? P.u5 : P.u6) : w2 < -R * 0.75 + 12 ? P.wblue : P.moon);
    }
    if (!lock) {
      for (const k of [-1, -1 / 3, 1 / 3, 1]) { const [a1, b1] = P3(k * R, -R * 0.75), [a2, b2] = P3(k * R, R * 0.75); lineI(a1, b1, a2, b2, P.u4); }
      for (const k of [-1, -0.25, 0.375, 1]) { const [a1, b1] = P3(-R, k * R * 0.75), [a2, b2] = P3(R, k * R * 0.75); lineI(a1, b1, a2, b2, P.u4); }
      const [hx2, hy2] = P3(R, R * 0.75); rectI(Math.round(hx2) - 1, Math.round(hy2) - 1, 3, 3, P.u1);
      q4Hit(cx - 42, cy - 16, 84, 42, 'q4Pivot');
    }
    text(lock ? 'Unlocks at ' + st.pivot.at : st.pivot.grab ? 'let go to spin' : Math.abs(st.pivot.om) > 0.3 ? 'spinning' : 'grab and spin', cx, rowY(10) + 4, 'tiny', P.u5, { align: 'c' }); }
  // the zl that just paid, rising over the toy that paid it; the BALANCED stamp lands with a shake
  for (const p of st.pops) {
    const [ex] = Q4X.E, macro = p.toy[0] === 'm', toy = macro ? p.toy.slice(1) : p.toy;
    const x = toy === 'sum' ? Q4X.C[0] + 22 : toy === 'fill' ? Q4X.C[0] + 11 : ex + 48 + ((p.i & 1) ? 20 : -20);
    const y = toy === 'sum' ? rowY(9) + 2 : toy === 'fill' ? rowY(4 + Math.max(1, Math.min(8, p.i || 8))) + 2 : rowY(6) - 4;
    q4Pop(p.s + ' zl', x, y, p.k, macro ? P.g4 : P.g3);
  }
  if (st.stamp > 0) {
    const sh = st.stamp > 0.55 ? Math.round(Math.sin(t * 90) * 2) : 0, bx2 = Q4X.B[0] - 8 + sh, by2 = rowY(5) + 3;
    frameI(bx2, by2, 64, 15, P.crimson); frameI(bx2 + 2, by2 + 2, 60, 11, P.crimson);
    text('BALANCED', bx2 + 32, by2 + 5, 'tiny', P.crimson, { align: 'c' });
  }
  // ---- the scroll bar, the sheet tabs, the status bar
  const shh = 150;
  rectI(314, top, 9, shh, P.u6); for (let j = top; j < top + shh; j++) for (let i = 314; i < 323; i++) if ((i + j) & 1) putI(i, j, P.moon);
  w98Raised(314, top, 9, 9); w98Raised(314, top + shh - 9, 9, 9); w98Raised(314, top + 12, 9, 30);
  const sy2 = top + shh + 1;
  rectI(0, sy2 - 1, 323, 1, P.u5);
  [['Q4', true], ['Q3_old', false], ['Sheet3', false]].forEach(([nm, on], k) => { const x = 30 + k * 44; rectI(x, sy2, 42, 10, on ? P.moon : P.u6); frameI(x, sy2 - (on ? 1 : 0), 42, on ? 11 : 10, P.u1); if (on) rectI(x + 1, sy2 - 1, 40, 1, P.moon); text(nm, x + 21, sy2 + 3, 'tiny', P.u1, { align: 'c' }); });
  for (const k of [0, 1]) w98Raised(4 + k * 11, sy2, 10, 10);
  const stY = H - 12;
  rectI(0, stY - 1, W, 1, P.moon);
  w98Sunken(2, stY, 120, 11, P.u6); text(st.status, 5, stY + 3, 'tiny', P.u1);
  w98Sunken(124, stY, 200, 11, P.u6); zlText('Q4 tonight: +' + fmt(st.tonight), 128, stY + 3, P.g3);
  w98Sunken(326, stY, W - 328, 11, P.u6); zlText('Wallet ' + fmt(st.wallet), 330, stY + 3, P.u1); text('NUM', W - 8, stY + 3, 'tiny', P.u1, { align: 'r' });
  // ---- the Macros pane
  { const [px, pw] = Q4X.pane, py = 54, ph = 165;
    w98Sunken(px, py, pw, ph, P.u6);
    for (let i = px + 2; i < px + pw - 2; i++) for (let j = py + 2; j < py + 11; j++) putI(i, j, P.wnavy);
    text('Macros', px + 5, py + 4, 'tiny', P.moon); text('run while you play', px + pw - 5, py + 4, 'tiny', P.wsky, { align: 'r' });
    st.macros.forEach((m, k) => {
      const y = py + 13 + k * 25;
      if (k) { rectI(px + 3, y - 1, pw - 6, 1, P.u5); rectI(px + 3, y, pw - 6, 1, P.moon); }
      if (m.flash && Math.floor(t * 4) & 1) rectI(px + 2, y + 1, pw - 4, 23, P.pale);
      const ix = px + 5, iy = y + 4;
      rectI(ix, iy, 9, 9, m.locked ? P.u5 : P.g4); rectI(ix + 1, iy + 1, 7, 7, P.moon); rectI(ix + 1, iy + 3, 7, 1, m.locked ? P.u5 : P.g4); rectI(ix + 3, iy + 1, 1, 7, m.locked ? P.u5 : P.g4);
      if (m.locked) { rectI(ix + 3, iy + 4, 5, 4, P.u4); putI(ix + 4, iy + 3, P.u4); putI(ix + 6, iy + 3, P.u4); }
      text(fitTiny(m.name, pw - 40), px + 18, y + 3, 'tiny', m.locked ? P.u5 : P.u1);
      if (!m.locked) text('Lv ' + m.lv, px + pw - 6, y + 3, 'tiny', P.u4, { align: 'r' });
      text(fitTiny(m.locked ? 'Unlocks at ' + m.at : m.fx, m.locked ? pw - 22 : pw - 68), px + 18, y + 11, 'tiny', m.locked ? P.u5 : P.u4);
      if (!m.locked) {
        const bw = 40, bx = px + pw - bw - 5, by = y + 12;
        if (m.ok) { rectI(bx, by, bw, 11, P.gold); rectI(bx, by, bw - 1, 1, P.pale); rectI(bx, by, 1, 10, P.pale); rectI(bx, by + 10, bw, 1, P.u1); rectI(bx + bw - 1, by, 1, 11, P.u1); rectI(bx + 1, by + 9, bw - 2, 1, P.copper); zlText(fmt(m.cost), bx + bw / 2, by + 3, P.u1, 'c'); }
        else { w98Raised(bx, by, bw, 11); zlText(fmt(m.cost), bx + bw / 2 + 1, by + 4, P.moon, 'c'); zlText(fmt(m.cost), bx + bw / 2, by + 3, P.u5, 'c'); }
        q4Hit(bx, by, bw, 11, 'q4Buy', m.id);
      }
    }); }
  // ---- the promotion: Excel's dialog, confetti for 1.5 s; OK (or Enter) closes it
  if (st.promo) {
    const p = st.promo, w = 214, h = 82, x = Math.round((W - w) / 2) - 70, y = 70;
    shadowFlat(x + 3, y + 3, w, h);
    const [cx, cy] = w98Window(x, y, w, h, 'Microsoft Excel', { dialog: true, icon: xlIcon8 });
    const ix = cx + 8, iy = cy + 6;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const d = Math.hypot(i - 7.5, j - 7.5); if (d < 7.5) putI(ix + i, iy + j, d > 6.4 ? P.copper : d > 5.4 ? P.gold : P.pale); }
    sprite(ix + 5, iy + 4, ['..O..', '..O..', 'OOOOO', '.OOO.', 'O...O'], { O: 'copper' });
    text('Congrats on your promotion!', cx + 32, cy + 6, 'tiny', P.u1);
    text(fitTiny('You are now ' + (/^[AEIOU]/.test(p.title) ? 'an ' : 'a ') + p.title + '.', w - 40), cx + 32, cy + 15, 'tiny', P.u1);
    text('Q4 pays x' + p.mult + ' more.' + (p.unlocks ? ' Unlocked:' : ''), cx + 32, cy + 27, 'tiny', P.u4);
    if (p.unlocks) text(fitTiny(p.unlocks, w - 40), cx + 32, cy + 35, 'tiny', P.u4);
    w98Button(cx + w / 2 - 24, cy + 48, 42, 14, 'OK', { def: true });
    q4Hit(cx + w / 2 - 24, cy + 48, 42, 14, 'q4PromoOk');
    if (p.k < 1.5) {
      const cols = [P.gold, P.crimson, P.g5, P.steel, P.moon, P.arcane, P.pale];
      for (let n = 0; n < 70; n++) {
        const a = hash(n, 1, 31) * Math.PI - Math.PI, sp = 40 + hash(n, 2, 31) * 90, vx = Math.cos(a) * sp * 0.9, vy = Math.sin(a) * sp - 30;
        const X = x + w / 2 + vx * p.k, Y = y + 20 + vy * p.k + 120 * p.k * p.k;
        if (Y > H || X < 0 || X > W) continue;
        const big = hash(n, 3, 31) > 0.6, flip = Math.floor(p.k * 12 + n) & 1;
        rectI(Math.round(X), Math.round(Y), big && !flip ? 2 : 1, big ? 2 : 1, cols[n % cols.length]);
      }
    }
  }
  usePal(deskSet(v));
  composeInto(Q4_CANVAS.getContext('2d'), F, { lights: [], ambient: [1, 1, 1], tint: 0, vig: 0 }, 0);
  usePal(PAL_BASE);
  return { canvas: Q4_CANVAS, hits: Q4_HITS };
}
// Excel's pointers as CSS cursors (2x): the arrow, the fat white cell cross, the thin black fill cross
const Q4_CUR = {};
function q4Cursor(kind) {
  if (Q4_CUR[kind]) return Q4_CUR[kind];
  const rows = kind === 'cell' ? PTR_CELL : kind === 'fill' ? PTR_FILL : PTR_ARROW, w = rows[0].length, h = rows.length;
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; g.fillStyle = ch === 'v' ? (kind === 'fill' ? '#000' : '#000') : '#fff'; if (kind === 'fill' && ch === 'v') g.fillStyle = '#000'; g.fillRect(i * 2, j * 2, 2, 2); }));
  const hx = kind === 'arrow' ? 0 : w, hy = kind === 'arrow' ? 0 : h;
  return (Q4_CUR[kind] = `url(${c.toDataURL()}) ${hx} ${hy}, ${kind === 'arrow' ? 'default' : 'crosshair'}`);
}
