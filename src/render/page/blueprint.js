// ===========================================================================
// The plan, taken off the wall (redesign of the build's plan window, src/ui/plan.ts v0.49.8 and panels.ts planHtml).
// The build gives the content: the layout (walls with their openings, door swings, windows, furniture, room names,
// your gold YOU), the dashed line of sight from your door with 1 2 3, the title, the subtitle and the note. It never
// marks where she is. The look: a blueprint sheet in pixels, her panel's 16 colours plus four blueprint blues of its
// own (paper, grid, pencil, the paper's edge), Tiny5 only; walls 2 px in chalk white, furniture 1 px in pale pencil,
// a faint 8 px grid, what the crack shows as a lighter wedge; masking tape at the top corners, a curled corner, a
// shadow. Over her panel; everything behind it dims with a 50% void checker (the PC-98 way).
// ===========================================================================
const PLAN_PAL = [...PC98, '#10294f', '#1b4683', '#265599', '#9fbde6'];
const PL = { edge: 16, paper: 17, grid: 18, pencil: 19 };
const PLAN_RGB = PLAN_PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const PLAN_AT = { x: 8, y: 38, w: 196 };          // the sheet on the 640 x 360 frame
const PLAN_S = 0.92, PLAN_O = [6, 37];            // sheet units (0..200) to sheet px, and where the drawing starts
const PLAN_WALLS9 = [
  [2, 2, 198, 2], [2, 2, 2, 198], [2, 198, 198, 198], [198, 2, 198, 198],
  [70, 84, 80, 84], [98, 84, 112, 84], [136, 84, 198, 84],
  [96, 108, 140, 108],                                   // the hallway's left wall: the arch 70..96 into the living room
  [140, 84, 140, 88], [140, 104, 140, 198],
  [70, 56, 70, 85], [70, 99, 70, 101],                    // the far end: the bathroom's door 85..99, the living room 101..
  [2, 100, 70, 100], [2, 56, 70, 56],                     // the bathroom (approved 2026-11-20: it moved to the far end)
  [110, 2, 110, 84],
];
const PLAN_WINDOWS = [[2, 22, 2, 62], [78, 2, 102, 2], [152, 2, 188, 2], [2, 120, 2, 176], [22, 198, 90, 198], [150, 198, 188, 198]];
const PLAN_NOTE = 'Your room is at the end of the hallway. Next to it: the kitchen and the living room (through the walls) and the hallway. She hears you best there. The bedroom is further down, the bathroom at the far end. Through the crack: 1 the kitchen, 2 the bathroom straight down the hallway, 3 the living room through its open corner.';
const pu = (u) => Math.round(u * PLAN_S);
// what the crack can show: every direction through the gap at your door's latch (140, 88.4), cast against the walls
function planFan() {
  const o = [140, 88.4], walls = PLAN_WALLS9.filter((w) => w[0] !== 140 || w[2] !== 140), pts = [o];
  for (let a = -47; a <= 51; a += 0.5) {
    const r = a * Math.PI / 180, d = [-Math.cos(r), Math.sin(r)]; let best = 400;
    for (const [x0, y0, x1, y1] of walls) { const ex = x1 - x0, ey = y1 - y0, den = d[0] * ey - d[1] * ex; if (Math.abs(den) < 1e-9) continue; const t = ((x0 - o[0]) * ey - (y0 - o[1]) * ex) / den, u = ((x0 - o[0]) * d[1] - (y0 - o[1]) * d[0]) / den; if (t > 1e-6 && u >= 0 && u <= 1 && t < best) best = t; }
    pts.push([o[0] + d[0] * best, o[1] + d[1] * best]);
  }
  return pts;
}
let PLAN_BUF = null, PLAN_CANVAS = null;
function planLine(x0, y0, x1, y1, c, dash = 0) {   // Bresenham, optional dashes (n on, n off)
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, k = 0;
  for (;;) { if (!dash || Math.floor(k / dash) % 2 === 0) putI(x0, y0, c); k++; if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function planRect(x, y, w, h, c, r = 0) {   // an outline in sheet units; r rounds the corners by a pixel or two
  const X0 = PLAN_O[0] + pu(x), Y0 = PLAN_O[1] + pu(y), X1 = PLAN_O[0] + pu(x + w), Y1 = PLAN_O[1] + pu(y + h), k = r ? (r > 4 ? 2 : 1) : 0;
  for (let i = X0 + k; i <= X1 - k; i++) { putI(i, Y0, c); putI(i, Y1, c); }
  for (let j = Y0 + k; j <= Y1 - k; j++) { putI(X0, j, c); putI(X1, j, c); }
  if (k === 2) for (const [ax, ay, sx, sy] of [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X0, Y1, 1, -1], [X1, Y1, -1, -1]]) putI(ax + sx, ay + sy, c);
}
function planEllipse(cx, cy, rx, ry, c) {
  const X = PLAN_O[0] + cx * PLAN_S, Y = PLAN_O[1] + cy * PLAN_S, RX = rx * PLAN_S, RY = ry * PLAN_S, seen = new Set();
  for (let a = 0; a < 360; a += 1) { const x = Math.round(X + RX * Math.cos((a * Math.PI) / 180)), y = Math.round(Y + RY * Math.sin((a * Math.PI) / 180)), k = x + ',' + y; if (!seen.has(k)) { seen.add(k); putI(x, y, c); } }
}
function planArc(cx, cy, r, a0, a1, c) {   // degrees, 0 = +x, 90 = +y (down)
  const X = PLAN_O[0] + cx * PLAN_S, Y = PLAN_O[1] + cy * PLAN_S, R = r * PLAN_S;
  for (let a = a0; a <= a1; a += 0.5) putI(Math.round(X + R * Math.cos((a * Math.PI) / 180)), Math.round(Y + R * Math.sin((a * Math.PI) / 180)), c);
}
const ux = (u) => PLAN_O[0] + pu(u), uy = (u) => PLAN_O[1] + pu(u);
function planSheet(t) {
  const W = PLAN_AT.w;
  // the note wraps to the sheet; its height sets the sheet's
  const noteW = W - 14, words = PLAN_NOTE.split(' '), note = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (measure(n, 'tiny') > noteW && cur) { note.push(cur); cur = w; } else cur = n; }
  if (cur) note.push(cur);
  const H = PLAN_O[1] + pu(200) + 8 + note.length * 9 + 6;
  const CW = W + 8, CH = H + 10;
  if (!PLAN_BUF || PLAN_BUF.w !== CW || PLAN_BUF.h !== CH) { PLAN_BUF = mkBuf(CW, CH, true); PLAN_CANVAS = document.createElement('canvas'); PLAN_CANVAS.width = CW; PLAN_CANVAS.height = CH; }
  setRes(CW, CH); CLIP = null; const F = PLAN_BUF; F.I.fill(-1); bind(F);
  const oy = 4;   // the tape overhangs the top
  // shadow (a void checker, 3 px down and right), the paper with its edge, the grid
  for (let j = 3; j < H + 3; j++) for (let i = 3; i < W + 3; i++) if (((i + j) & 1) === 0) putI(i, j + oy, C9.void);
  rectI(0, oy, W, H, PL.paper); frameI(0, oy, W, H, PL.edge);
  for (let j = oy + 1; j < oy + H - 1; j++) for (let i = 1; i < W - 1; i++) if ((i - PLAN_O[0]) % 8 === 0 || (j - oy - PLAN_O[1]) % 8 === 0) putI(i, j, PL.grid);
  // title, subtitle, the close box
  text('THE PLAN', 7, oy + 8, 'tinyL', C9.moon);
  text('who hears you, what the crack shows', 7, oy + 24, 'tiny', PL.pencil);
  win9(W - 17, oy + 8, 12, 12, { fill: PL.edge, hi: PL.grid, lo: C9.void, edge: PL.pencil, shadow: false });
  [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 4], [1, 3], [3, 1], [4, 0]].forEach(([i, j]) => putI(W - 13 + i, oy + 12 + j, C9.rose));
  PLAN_O[1] += oy;
  // the drawing: paper under it (the grid stops at its frame), a 1 px pencil frame round it
  rectI(ux(0) - 2, uy(0) - 2, pu(200) + 5, pu(200) + 5, PL.paper);
  for (let j = uy(0) - 2; j <= uy(200) + 2; j++) for (let i = ux(0) - 2; i <= ux(200) + 2; i++) if ((i - ux(0)) % 8 === 0 && (j - uy(0)) % 8 === 0) putI(i, j, PL.grid);
  // what the crack shows: the wedge from your door down the hallway, a lighter checker
  const fan = planFan().map(([a, b]) => [ux(a), uy(b)]);
  let fx0 = 1e9, fx1 = -1e9, fy0 = 1e9, fy1 = -1e9; for (const [a, b] of fan) { fx0 = Math.min(fx0, a); fx1 = Math.max(fx1, a); fy0 = Math.min(fy0, b); fy1 = Math.max(fy1, b); }
  for (let j = fy0; j <= fy1; j++) for (let i = fx0; i <= fx1; i++) {
    let c = false; for (let k = 0, m = fan.length - 1; k < fan.length; m = k++) { const [xk, yk] = fan[k], [xm, ym] = fan[m]; if ((yk > j) !== (ym > j) && i < (xm - xk) * (j - yk) / (ym - yk) + xk) c = !c; }
    if (c && ((i + j) & 1)) putI(i, j, PL.grid);
  }
  // furniture (pencil, 1 px)
  const P_ = PL.pencil;
  planRect(8, 8, 40, 42, P_); planRect(11, 11, 15, 9, P_); planRect(30, 11, 15, 9, P_); planLine(ux(8), uy(26), ux(48), uy(26), P_);
  planRect(52, 8, 12, 12, P_); planRect(84, 6, 22, 14, P_); planRect(70, 60, 6, 18, P_);                        // bed, nightstand, wardrobe, her dresser
  planRect(14, 88, 32, 11, P_, 6); planRect(8, 56, 14, 6, P_); planEllipse(15, 59, 4, 2, P_); planRect(2, 72, 6, 8, P_); planRect(52, 56, 18, 16, P_);   // tub, basin, toilet, shower
  for (const [a, b, c, d] of [[136, 6, 194, 6], [194, 6, 194, 72], [194, 72, 182, 72], [182, 72, 182, 18], [182, 18, 136, 18], [136, 18, 136, 6]]) planLine(ux(a), uy(b), ux(c), uy(d), P_);
  planEllipse(188, 30, 3, 3, P_); planEllipse(188, 44, 3, 3, P_); planRect(118, 2, 14, 10, P_); planRect(110, 48, 7, 35, P_); planEllipse(154, 50, 9, 9, P_);
  for (let j = uy(129); j <= uy(150); j++) { putI(ux(3), j, P_); putI(ux(3) + 1, j, P_); }                      // the TV on the wall
  planRect(24, 130, 14, 26, P_, 4); planRect(17, 104, 10, 24, P_); planRect(24, 172, 28, 18, P_, 4);              // the couch, her yoga mat
  planRect(180, 86, 14, 34, P_); for (let j = uy(90); j <= uy(116); j++) { putI(ux(190), j, P_); putI(ux(190) + 1, j, P_); }
  planEllipse(169, 100, 7, 7, P_); planRect(166, 134, 28, 46, P_); planRect(170, 137, 20, 9, P_); planRect(126, 122, 10, 52, P_);
  // door swings: the leaf and its quarter circle (pencil)
  planLine(ux(98), uy(84), ux(98), uy(66), P_); planArc(98, 84, 18, 180, 270, P_);                                // the bedroom's door
  for (let j = uy(71); j <= uy(85); j++) putI(ux(69), j, P_);                                                       // the bathroom's, slid into its pocket
  planLine(ux(70), uy(108), ux(96), uy(108), P_, 2);                                                                // the arch's header
  planLine(ux(140), uy(104), ux(156), uy(104), P_); planArc(140, 104, 16, 270, 360, P_);
  // walls: 2 px chalk, their openings left open
  for (const [a, b, c, d] of PLAN_WALLS9) {
    const x0 = ux(a), y0 = uy(b), x1 = ux(c), y1 = uy(d);
    if (y0 === y1) for (let i = Math.min(x0, x1); i <= Math.max(x0, x1) + 1; i++) { putI(i, y0, C9.moon); putI(i, y0 + 1, C9.moon); }
    else for (let j = Math.min(y0, y1); j <= Math.max(y0, y1) + 1; j++) { putI(x0, j, C9.moon); putI(x0 + 1, j, C9.moon); }
  }
  // windows: the outer wall gives way to a thin double line
  for (const [a, b, c, d] of PLAN_WINDOWS) {
    const x0 = ux(a), y0 = uy(b), x1 = ux(c), y1 = uy(d);
    if (b === d && b < 100) for (let i = x0; i <= x1; i++) { putI(i, y0, C9.moon); putI(i, y0 + 1, PL.paper); putI(i, uy(5), P_); }       // top wall
    else if (b === d) for (let i = x0; i <= x1; i++) { putI(i, y0 + 1, C9.moon); putI(i, y0, PL.paper); putI(i, uy(195), P_); }       // bottom wall
    else for (let j = y0; j <= y1; j++) { putI(x0, j, C9.moon); putI(x0 + 1, j, PL.paper); putI(ux(5), j, P_); }                      // left wall
  }
  // the line of sight from your door, dashed in her pink, and its 1 2 3
  for (let i = ux(98); i <= ux(121); i++) putI(i, uy(108) - 1, C9.cyan);                                           // the hall mirror
  for (const [x, y] of [[116, 68], [46, 90], [26, 125]]) planLine(ux(140), uy(88), ux(x), uy(y), C9.rose, 2);
  for (const [n, x, y] of [['1', 114, 64], ['2', 40, 89], ['3', 20, 128]]) text(n, ux(x), uy(y) - 3, 'tiny', C9.rose, { align: 'c', outline: PL.paper });
  // room names (chalk), YOU in gold
  const lab = (s, x, y, c = C9.moon) => text(s, ux(x), uy(y) - 6, 'tiny', c, { align: 'c', outline: PL.paper });
  lab('BEDROOM', 30, 54); lab('BATH', 36, 82); lab('KITCHEN', 154, 80); lab('HALLWAY', 106, 105); lab('LIVING', 66, 176); lab('YOU', 152, 141, C9.gold);
  PLAN_O[1] -= oy;
  // the note, the digits in her pink
  let ny = oy + PLAN_O[1] + pu(200) + 8;
  for (const l of note) {
    let x = 7;
    for (const part of l.split(/(\b[123]\b)/)) { if (!part) continue; x += text(part, x, ny, 'tiny', /^[123]$/.test(part) ? C9.rose : PL.pencil); }
    ny += 9;
  }
  // a curled corner, bottom right: the corner folds up over the sheet, showing the paper's pale back
  for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) {
    const x = W - 10 + i, y = oy + H - 10 + j, d = i + j;
    if (d > 9) putI(x, y, ((x + y) & 1) ? C9.void : -1);                 // cut away: the shadow shows through
    else if (d === 9) putI(x, y, PL.edge);                               // the fold
    else if (d >= 2) putI(x, y, i === 0 || j === 0 ? PL.edge : d >= 7 ? C9.moon : PL.pencil);   // the flap
  }
  // masking tape over the top corners: beige, half see-through, torn ends
  const tape = (x0, slant) => {
    for (let j = 0; j < 10; j++) for (let i = 0; i < 30; i++) {
      const x = x0 + i + Math.round((j - 5) * slant * 0.3);
      if ((i === 0 || i === 29) && (j & 1)) continue;                      // torn ends
      putI(x, j, j === 0 ? C9.moon : j === 9 ? C9.tan : C9.beige);
    }
  };
  tape(3, 1); tape(W - 33, -1);
  const ctx = PLAN_CANVAS.getContext('2d'), img = ctx.createImageData(CW, CH), D = img.data;
  for (let k = 0; k < CW * CH; k++) { const q = F.I[k]; if (q < 0) continue; const c = PLAN_RGB[q]; D[k * 4] = c[0]; D[k * 4 + 1] = c[1]; D[k * 4 + 2] = c[2]; D[k * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return PLAN_CANVAS;
}
// onto the 640 x 360 frame: everything behind dims to 42% (the energy break's dim: each colour back to the nearest
// of the desk's and her colours, a light ordered dither), a soft shadow round the sheet, then the sheet
const DIM_PAL = [...EB_RGB, ...PC98_RGB], DIM_LUT = new Int16Array(1 << 18).fill(-1);   // 6 bits a channel -> palette index
function dimNearest(r, g, b) {
  const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2); let q = DIM_LUT[key];
  if (q < 0) { let best = 1e9; DIM_PAL.forEach((c, i) => { const d = (c[0] - r) ** 2 * 0.3 + (c[1] - g) ** 2 * 0.59 + (c[2] - b) ** 2 * 0.11; if (d < best) { best = d; q = i; } }); DIM_LUT[key] = q; }
  return DIM_PAL[q];
}
function drawPlan(ctx, t) {
  const sh = planSheet(t), X = PLAN_AT.x, Y = PLAN_AT.y - 4, SW = sh.width, SH = sh.height;
  const img = ctx.getImageData(0, 0, 640, 360), D = img.data;
  for (let j = 0; j < 360; j++) for (let i = 0; i < 640; i++) {
    const ex = Math.max(X + 2 - i - 0.5, i + 0.5 - (X + SW + 2), 0), ey = Math.max(Y + 4 - j - 0.5, j + 0.5 - (Y + SH + 4), 0), d = Math.hypot(ex, ey);
    const k = 0.42 * (d < 8 ? 0.55 + 0.45 * (d / 8) : 1), o = (j * 640 + i) * 4, th = (BAYER8[((j & 7) << 3) | (i & 7)] - 0.5) * 16;
    const c = dimNearest(Math.max(0, Math.min(255, Math.round(D[o] * k + th))), Math.max(0, Math.min(255, Math.round(D[o + 1] * k + th))), Math.max(0, Math.min(255, Math.round(D[o + 2] * k + th))));
    D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2];
  }
  ctx.putImageData(img, 0, 0);
  ctx.drawImage(sh, X, Y);
}
