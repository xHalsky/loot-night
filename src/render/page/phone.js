// ===========================================================================
// The phone: one touch smartphone (operated with the mouse), its own night-mode OS drawn at the game's pixel size.
// The desk's world: Graphite neutrals, Tiny5 text, palette-exact UI over dithered backgrounds; the meaning colours
// keep their jobs: gold = what you can tap now (every reply, every timer), moss = accept / done, crimson = decline /
// wrong, her pink = her. Everything happens inside the phone. In your hand: 124 x 252, screen 112 x 240.
// ===========================================================================
const PHONEOS = (() => {
const PH = { w: 124, h: 252, sx: 6, sy: 6, sw: 112, sh: 240 };
let OX = PH.sx, OY = PH.sy;   // the screen's origin in the bound buffer (the desk draws avatars at absolute spots)
const PHX = (x) => OX + x, PHY = (y) => OY + y;
// ---------------------------------------------------------------- small kit (screen coordinates)
function rrI(x, y, w, h, r, idx) {   // rounded rectangle, palette-exact
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
    if (cx && cy && cx * cx + cy * cy > r * r) continue;
    putI(PHX(x + i), PHY(y + j), idx);
  }
}
function rrM(x, y, w, h, r, fv, mat) {   // rounded rectangle of dithered material (emissive: the screen glows)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
    if (cx && cy && cx * cx + cy * cy > r * r) continue;
    const X = PHX(x + i), Y = PHY(y + j); put(X, Y, fv(i, j), mat, 1); B.I[Y * W + X] = -1;
  }
}
const tx = (s, x, y, idx, o = {}) => {
  if (!s.endsWith(' ♥')) return text(s, PHX(x), PHY(y), o.f || 'tiny', idx, o);
  const t0 = s.slice(0, -2), w = measure(t0, o.f || 'tiny') + 7, x0 = o.align === 'c' ? x - w / 2 : o.align === 'r' ? x - w : x;
  text(t0, PHX(Math.round(x0)), PHY(y), o.f || 'tiny', idx, { ...o, align: 'l' }); spr(PHX(Math.round(x0) + w - 5), PHY(y + 1), PG.heart, { x: o.heart ?? idx }); return w;
};
const mw = (s) => s.endsWith(' ♥') ? measure(s.slice(0, -2), 'tiny') + 7 : measure(s, 'tiny');
const inAV = (x, y) => !AVM || (x + 0.5 - AVM[0]) ** 2 + (y + 0.5 - AVM[1]) ** 2 <= AVM[2] * AVM[2];
const px = (x, y, idx) => { if (inAV(x, y)) putI(PHX(x), PHY(y), idx); };
const disc = (cx, cy, r, idx) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) px(x, y, idx); };
const gl = (rows, x, y, idx) => spr(PHX(x), PHY(y), rows, { x: idx });
const PG = {   // little glyphs
  phone: ['xx...', 'x....', 'x....', '.x..x', '..xxx'], hang: ['.xxx.', 'x...x', 'xx.xx'],
  spk: ['..x.x', '.xx..', 'xxx.x', 'xxx.x', '.xx..', '..x.x'], chat: ['xxxxx', 'x...x', 'xxxxx', '.x...'],
  back: ['..x', '.x.', 'x..', '.x.', '..x'], chev: ['x..', '.x.', '..x', '.x.', 'x..'], heart: ['.x.x.', 'xxxxx', '.xxx.', '..x..'],
  brief: ['.xxx.', 'xxxxx', 'x.x.x', 'xxxxx'], box: ['xxxxx', 'x.x.x', 'xxxxx', 'x...x', 'xxxxx'], bubble: ['xxxxx', 'xxxxx', 'xxxxx', 'x....'], lock: ['.xxx.', 'x...x', 'xxxxx', 'xx.xx', 'xxxxx'],
};
// the big lock clock: its own digits, 11 x 20, 2 px strokes, drawn at 1x (no scaled fonts)
const DIG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function bigDigit(ch, x, y, idx) {
  if (ch === ':') { rrI(x, y + 5, 2, 2, 0, idx); rrI(x, y + 13, 2, 2, 0, idx); return 4; }
  if (ch === '1') { rrI(x + 2, y + 2, 2, 16, 0, idx); rrI(x + 1, y + 2, 1, 2, 0, idx); rrI(x, y + 3, 1, 1, 0, idx); rrI(x, y + 18, 6, 2, 0, idx); rrI(x + 2, y + 1, 2, 1, 0, idx); return 8; }
  const s = DIG[ch], seg = { a: [2, 0, 7, 2], g: [2, 9, 7, 2], d: [2, 18, 7, 2], f: [0, 2, 2, 7], b: [9, 2, 2, 7], e: [0, 11, 2, 7], c: [9, 11, 2, 7] };
  for (const k of s) { const [a, b, w, h] = seg[k]; rrI(x + a, y + b, w, h, 0, idx); }
  // round the corners where two strokes meet
  const cn = [['a', 'f', 1, 1], ['a', 'b', 9, 1], ['d', 'e', 1, 18], ['d', 'c', 9, 18], ['g', 'f', 1, 9], ['g', 'b', 9, 9], ['g', 'e', 1, 10], ['g', 'c', 9, 10]];
  for (const [p, q, cx, cy] of cn) if (s.includes(p) && s.includes(q)) px(x + cx, y + cy, idx);
  return 13;
}
function bigTime(str, cx, y, idx) { let w = 0; for (const c of str) w += c === ':' ? 4 : c === '1' ? 8 : 13; w -= 2; let x = Math.round(cx - w / 2); for (const c of str) x += bigDigit(c, x, y, idx); }
// status bar: time, the Dynamic Island, signal and battery
let PH_BATT = 41;   // the battery % the status bar shows (step 6): the page sets it per state
function statusBar(o = {}) {
  const c = o.dark ? P.s1 : P.moon;
  tx(o.time || '20:15', 9, 4, c);
  rrI(41, 3, 30, 8, 4, P.void);
  for (let k = 0; k < 4; k++) rrI(80 + k * 2, 9 - k * 2 - 1, 1, k * 2 + 2, 0, k < 3 ? c : o.dark ? P.s4 : P.s3);
  const b = o.batt ?? PH_BATT, low = b <= 20, bc = o.charging ? P.g5 : low ? P.crimson : c;
  tx(String(b), 99, 4, low && !o.charging ? P.crimson : c, { align: 'r' });
  frameI(PHX(100), PHY(4), 9, 5, c); px(109, 5, c); px(109, 6, c); rrI(101, 5, Math.max(1, Math.round(7 * b / 100)), 3, 0, bc);
}
const homeBar = (idx = P.s5) => rrI(38, PH.sh - 6, 36, 2, 1, idx);
// avatars of the cast: little pixel portraits in a disc
let AVM = null;   // while drawing an avatar, nothing leaves its disc
function avatar(kind, cx, cy, r) {
  AVM = [cx, cy, r]; avatarBody(kind, cx, cy, r); AVM = null;
}
function avatarBody(kind, cx, cy, r) {
  const bg = { mom: P.copper, babe: P.d4, boss: P.s4, courier: P.u3, boys: P.arcane, magoo: P.arcane, danny: P.s4 }[kind] ?? P.s3;
  disc(cx, cy, r, bg);
  const s = r / 10, hd = (dx, dy, hr, hair, o = {}) => {
    disc(cx + dx * s, cy + (dy + 9) * s, 7.5 * s * (o.sh ?? 1), o.shirt ?? P.s2);   // shoulders
    disc(cx + dx * s, cy + dy * s, hr * s, P.pale);                                    // the face
    if (hair) hair(cx + dx * s, cy + dy * s, hr * s);
    const ey = cy + (dy + 0.4) * s; px(Math.round(cx + (dx - 1.6) * s), Math.round(ey), P.void); px(Math.round(cx + (dx + 1.6) * s) - 1, Math.round(ey), P.void);
    if (o.glasses) { const r2 = Math.max(1.2, 1.4 * s); for (const g of [-1.6, 1.6]) for (let a = 0; a < 12; a++) px(Math.round(cx + (dx + g) * s + Math.cos(a / 1.9) * r2), Math.round(ey + Math.sin(a / 1.9) * r2), P.s1); }
    if (o.blush) { px(Math.round(cx + (dx - 2.6) * s), Math.round(ey + 2 * s), P.d6); px(Math.round(cx + (dx + 2.6) * s) - 1, Math.round(ey + 2 * s), P.d6); }
  };
  const cap = (col, top = 1) => (x, y, hr) => { for (let j = -hr - 1; j <= 0; j++) for (let i = -hr - 1; i <= hr + 1; i++) if (i * i + j * j <= (hr + 1) * (hr + 1) && j < -hr * 0.35 * top) px(Math.round(x + i), Math.round(y + j), col); };
  if (kind === 'mom') hd(0, -1.5, 5, (x, y, hr) => { cap(P.s5)(x, y, hr); disc(Math.round(x), Math.round(y - hr - 1.5), hr * 0.45, P.s5); }, { glasses: true, shirt: P.wine });
  else if (kind === 'babe') hd(0, -1.5, 5, (x, y, hr) => { for (let j = -hr - 1; j <= hr * 2.2; j++) for (let i = -hr - 2; i <= hr + 2; i++) { const top = j < -hr * 0.2 && i * i + j * j <= (hr + 1.4) ** 2, side = Math.abs(i) > hr - 1 && Math.abs(i) <= hr + 2 && j >= -hr * 0.2; if (top || side) px(Math.round(x + i), Math.round(y + j), P.s1); } px(Math.round(x + hr), Math.round(y - hr * 0.6), P.crimson); px(Math.round(x + hr) + 1, Math.round(y - hr * 0.6), P.d6); }, { blush: true, shirt: P.pale });
  else if (kind === 'boss') hd(0, -1.5, 5, cap(P.s1, 1.4), { shirt: P.moon });
  else if (kind === 'courier') hd(0, -1, 5, (x, y, hr) => { cap(P.ember, 1.2)(x, y, hr); for (let i = 0; i <= hr + 2; i++) px(Math.round(x + i), Math.round(y - hr * 0.35), P.ember); }, { shirt: P.u2 });
  else if (kind === 'boys') { hd(-4.5, -0.5, 3.6, cap(P.s1), { sh: 0.6, shirt: P.s2 }); hd(4.5, -0.5, 3.6, cap(P.copper), { sh: 0.6, shirt: P.s3 }); hd(0, 1.2, 4, cap(P.u2), { sh: 0.7, shirt: P.d2 }); }
  if (kind === 'boss') { px(Math.round(cx), Math.round(cy + 6 * s), P.crimson); px(Math.round(cx), Math.round(cy + 7 * s), P.crimson); }
}
// a chat bubble; returns its height
function bubble(str, side, y, o = {}) {
  const maxW = o.maxW ?? 74, lines = wrapT(str, maxW - 8), w = Math.max(...lines.map((l) => mw(l))) + 9, h = lines.length * 8 + 5;
  const x = side === 'r' ? PH.sw - 7 - w : 7, fill = o.fill ?? (side === 'r' ? P.pale : P.s2), ink = o.ink ?? (side === 'r' ? P.s1 : P.moon);
  rrI(x, y, w, h, 4, fill);
  if (o.tail !== false) { if (side === 'r') { px(x + w - 1, y + h - 1, fill); px(x + w, y + h - 1, fill); } else { px(x - 1, y + h - 1, fill); px(x, y + h - 1, fill); } }
  lines.forEach((l, k) => tx(l, x + 5, y + 3 + k * 8, ink, { heart: o.heart ?? (side === 'r' ? P.crimson : P.d6) }));
  return h;
}
function fitT(s, w) { if (measure(s, 'tiny') <= w) return s; while (s.length && measure(s + '...', 'tiny') > w) s = s.slice(0, -1); return s.trimEnd() + '...'; }
function wrapT(str, maxW) { const words = str.split(' '), out = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (mw(n) > maxW && cur && w !== '♥') { out.push(cur); cur = w; } else cur = n; } if (cur) out.push(cur); return out; }
// a reply you can tap (the next action: gold), full width, grows with its text
function pill(str, y, o = {}) {
  const lines = wrapT(str, PH.sw - 30), h = lines.length * 8 + 6, x = 8, w = PH.sw - 16, fill = o.fill ?? P.gold, ink = o.ink ?? P.void;
  rrI(x, y + 1, w, h, 5, o.shadow ?? P.wine); rrI(x, y, w, h, 5, o.pressed ? P.copper : fill);
  if (o.glyph) { rrI(x + 3, y + 2, 9, h - 4, 3, P.void); tx(o.glyph, x + 7, y + Math.round(h / 2) - 3, fill, { align: 'c' }); }
  lines.forEach((l, k) => tx(l, x + w / 2 + (o.glyph ? 5 : 0), y + 4 + k * 8, ink, { align: 'c', heart: P.crimson }));
  return h + 4;
}
// a gold countdown: a thin bar, seconds beside it
function timerBar(y, left, total) { const w = PH.sw - 30; rrI(8, y, w, 3, 1, P.s1); rrI(8, y, Math.max(1, Math.round(w * left / total)), 3, 1, P.gold); tx(Math.ceil(left) + ' s', PH.sw - 8, y - 2, P.gold, { align: 'r' }); }
// the screen's background: a dithered gradient on one of the desk's ramps
function wall(mat, v0, v1, o = {}) { rrM(0, 0, PH.sw, PH.sh, 12, (i, j) => v0 + (v1 - v0) * Math.pow(j / PH.sh, o.pow ?? 1.2) + (o.glow ? o.glow(i, j) : 0), mat); }

// ---------------------------------------------------------------- the screens
const PHONE_SCREENS = {};
// incoming call: who, how long, Speaker / Message, slide to answer, Decline
const CALLERS = {
  mom: { name: 'Mom', sub: 'mobile', av: 'mom', mat: M_UMBER, v: [0.1, 0.42] },
  courier: { name: 'Courier', sub: '+48 22 555 0199', av: 'courier', mat: M_STONE, v: [0.08, 0.36] },
  boys: { name: 'The Boys (3)', sub: 'Danny, Mike, Kuba', av: 'boys', mat: M_MAGIC, v: [0.04, 0.24] },
};
PHONE_SCREENS.call = (t, o) => {
  const C = CALLERS[o.who || 'mom'], left = 8 - (t % 8);
  wall(C.mat, C.v[0], C.v[1], { glow: (i, j) => 0.12 * Math.max(0, 1 - Math.hypot(i - 56, j - 64) / 60) });
  statusBar();
  rrI(PH.sw - 30, 15, 22, 9, 4, P.gold); tx(Math.ceil(left) + ' s', PH.sw - 19, 17, P.void, { align: 'c' });
  // the caller, ringing: a pulse round the avatar
  const pr = 22 + ((t * 1.2) % 1) * 6; for (let a = 0; a < 64; a++) { const an = (a / 64) * 6.283; if (a % 2) px(Math.round(56 + Math.cos(an) * pr), Math.round(62 + Math.sin(an) * pr), P.s4); }
  avatar(C.av, 56, 62, 20);
  tx(C.name, 56, 92, P.moon, { align: 'c', f: 'tinyL' });
  tx(C.sub, 56, 111, P.s5, { align: 'c' });
  // Speaker (hands free, but you are heard) and Message
  for (const [k, lab, g, x] of [[0, 'Speaker', PG.spk, 32], [1, 'Message', PG.chat, 80]]) { disc(x, 140, 10, P.s3); disc(x, 139, 10, P.s2); gl(g, x - 2, 136 - (k ? 0 : 1), P.moon); tx(lab, x, 153, P.s5, { align: 'c' }); }
  // slide to answer
  rrI(8, 172, PH.sw - 16, 22, 11, P.s1); rrI(8, 172, PH.sw - 16, 1, 0, P.s1);
  const kx = 19 + Math.max(0, Math.sin(t * 2.4) * 3); disc(kx, 183, 9, P.g5); gl(PG.phone, kx - 2, 181, P.moon);
  const sw = (t * 40) % 110; const msg = 'slide to answer', mw = measure(msg, 'tiny'), mx = 62 - mw / 2;
  tx(msg, 62, 180, P.s4, { align: 'c' });
  const g = glyphs(msg, 'tiny'); for (let k = 0; k < g.pts.length; k += 2) { const gx = g.pts[k] + Math.round(mx); if (Math.abs(gx - sw) < 6) px(gx, g.pts[k + 1] + 180, P.moon); }
  // Decline
  disc(56, 214, 11, P.crimson); gl(PG.hang, 54, 213, P.moon); tx('Decline', 56, 228 - 1, P.s5, { align: 'c' });
};
// lock screen: the date, the big clock, the newest two banners and "+N more", Face ID, Put down
function lockWall() {
  wall(M_DUSK, 0.03, 0.4, { pow: 1.5, glow: (i, j) => 0.16 * Math.max(0, 1 - Math.hypot(i - 86, j - 152) / 46) });
  // stars and a crescent moon, hills at the bottom
  for (let k = 0; k < 30; k++) { const x = (k * 37 + 11) % 108 + 2, y = (k * 53 + 7) % 150 + 14; if (y < 56 && x > 18 && x < 94) continue; px(x, y, k % 5 === 0 ? P.moon : P.d5); }
  for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) if (i * i + j * j <= 81 && (i - 4) ** 2 + (j + 3) ** 2 > 72) px(88 + i, 152 + j, P.pale);
  for (let i = 0; i < PH.sw; i++) { const h1 = 176 + Math.round(10 * Math.sin(i / 17) + 6 * Math.sin(i / 7.3)), h2 = 196 + Math.round(8 * Math.sin(i / 23 + 2)); for (let j = h1; j < PH.sh; j++) px(i, j, j > h2 ? P.void : P.d1); }
}
PHONE_SCREENS.lock = (t, o) => {
  lockWall();
  statusBar();
  tx('Monday 17 November', 56, 22, P.d6, { align: 'c' });
  bigTime(o.time || '20:15', 56, 32, P.moon);
  const bn = o.banners || [{ app: 'work', who: 'Boss', what: 'you there?' }];
  let y = 62; const shown = bn.slice(0, 2);
  shown.forEach((b) => { y += banner(b, y) + 3; });
  if (bn.length > 2) { const more = bn.length - 2, last = bn[bn.length - 1].who; tx('+' + more + ' more from ' + last, 56, y, P.d6, { align: 'c' }); y += 10; }
  // Face ID: hold to unlock; the ring fills while you hold
  const hold = o.hold === 'anim' ? Math.min(1, Math.max(0, (t % 2.4) - 0.3) / 1.2) : o.hold ?? 0, cx = 56, cy = 196;
  for (let a = 0; a < 96; a++) { const an = (a / 96) * 6.283 - 1.571, on = a / 96 < hold; px(Math.round(cx + Math.cos(an) * 15), Math.round(cy + Math.sin(an) * 15), on ? P.g5 : a % 3 ? P.s4 : -1); if (on) px(Math.round(cx + Math.cos(an) * 14), Math.round(cy + Math.sin(an) * 14), P.g5); }
  faceGlyph(cx, cy, hold >= 1 ? P.g5 : P.moon);
  tx(hold > 0 && hold < 1 ? 'keep holding' : 'Face ID: hold to unlock', 56, 214, P.s5, { align: 'c' });
  rrI(36, 224, 40, 9, 4, P.s2); tx('Put down', 56, 226, P.moon, { align: 'c' });
};
function faceGlyph(cx, cy, idx) {
  for (const [x, y] of [[-6, -6], [-5, -6], [-6, -5], [5, -6], [4, -6], [5, -5], [-6, 5], [-6, 4], [-5, 5], [5, 5], [4, 5], [5, 4]]) px(cx + x, cy + y, idx);
  px(cx - 2, cy - 2, idx); px(cx + 2, cy - 2, idx); px(cx, cy - 1, idx); px(cx, cy, idx); px(cx - 1, cy, idx); px(cx - 2, cy + 2, idx); px(cx - 1, cy + 3, idx); px(cx, cy + 3, idx); px(cx + 1, cy + 3, idx); px(cx + 2, cy + 2, idx);
}
// a notification banner: app icon, sender, "app · now", the text; her messages get her pink
function banner(b, y) {
  const lines = wrapT(b.what, PH.sw - 34).slice(0, 2), h = 15 + lines.length * 8;
  rrI(6, y, PH.sw - 12, h, 6, P.s1); rrI(6, y, PH.sw - 12, 1, 0, P.s3);
  const ic = b.app === 'msg' ? P.g5 : P.s4;
  rrI(10, y + 4, 11, 11, 3, ic); gl(b.app === 'msg' ? PG.bubble : PG.brief, 13, y + 7, P.moon);
  tx(b.who, 25, y + 4, b.app === 'msg' ? P.d6 : P.moon); if (b.app === 'msg') gl(PG.heart, 25 + measure(b.who, 'tiny') + 2, y + 5, P.d6);
  tx(b.app === 'msg' ? 'Messages' : 'Work', PH.sw - 10, y + 4, P.s4, { align: 'r' });
  lines.forEach((l, k) => tx(l, 25, y + 12 + k * 8, P.u6));
  return h;
}
// a chat (Messages or Work): header, the thread fading at the top, what you can do at the bottom
function flatBg(top = 54) { rrI(0, 0, PH.sw, PH.sh, 12, P.void); rrI(0, 0, PH.sw, top, 12, P.s1); rrI(0, top - 12, PH.sw, 12, 0, P.s1); rrI(0, top, PH.sw, 1, 0, P.s2); }
function chatHead(who, av, left, total, sub, time) {
  flatBg(54);
  statusBar({ time });
  gl(PG.back, 6, 22, P.moon); avatar(av, 56, 25, 9);
  if (who === 'Babe') tx('Babe ♥', 56, 37, P.d6, { align: 'c' }); else tx(who, 56, 37, P.moon, { align: 'c' });
  if (sub) tx(sub, 56, 45, P.s5, { align: 'c' });
  if (left != null) { timerBar(61, left, total); return 68; }
  return 56;
}
// the thread: newest at the bottom, clipped under the header
function thread(msgs, y0, yBottom) {
  let y = yBottom; const placed = [];
  for (let k = msgs.length - 1; k >= 0; k--) { const m = msgs[k], h = wrapT(m[1], (m[2] && m[2].maxW || 74) - 8).length * 8 + 5; y -= h + 3; placed.push([m, y]); if (y < y0) break; }
  const c0 = CLIP; CLIP = [PHX(0), PHY(y0), PHX(PH.sw), PHY(yBottom)];
  for (const [m, yy] of placed) if (yy >= y0) bubble(m[1], m[0], yy, m[2] || {});   // a bubble that would be cut is left out (#45)
  CLIP = c0;
  return placed.length ? placed[0][1] : yBottom;
}
const HER = { fill: P.d3 };
PHONE_SCREENS.boss = (t, o) => {
  const total = 15, left = total - (t % total);
  const y0 = chatHead('Boss', 'boss', left, total, 'Work · deck due 9:00');
  thread([['l', 'you there?'], ['l', 'quick question'], ['l', 'need the Q4 totals for the deck'], ['l', 'asap pls']], y0, 144);
  rrI(8, 148, PH.sw - 16, 24, 5, P.s1); tx('sum 2 of 2', 14, 152, P.s5); const sum = '9 + 6 = ?'; tx(sum, 56, 161, P.moon, { align: 'c', f: 'tinyL' });
  const wrong = (t % total) > 3 && (t % total) < 5.5;
  const ans = ['12', '15', '19']; ans.forEach((a, k) => { const x = 8 + k * 33; rrI(x, 181, 30, 15, 5, P.wine); rrI(x, 180, 30, 15, 5, wrong && k === 0 ? P.copper : P.gold); tx(a, x + 15, 184, P.void, { align: 'c' }); });
  tx(wrong ? 'Wrong. -2 s, try again.' : 'tap the total', 56, 204, wrong ? P.crimson : P.s5, { align: 'c' });
  homeBar();
};
PHONE_SCREENS.her = (t, o) => {
  const total = 8, left = total - (t % total);
  const y0 = chatHead('Babe', 'babe', left, total, 'Messages');
  thread([['l', 'dinner was nice ♥', HER], ['r', 'it was ♥'], ['l', 'are you coming to bed?', HER], ['l', 'babe', HER], ['l', 'its really late', HER], ['l', 'hello??', HER]], y0, 190);
  pill('Five more minutes, love ♥', 196);
  homeBar();
};
// a call in progress: the caller up top, the line, the replies, End
function callHead(who, status, t, o = {}) {
  const C = CALLERS[who];
  flatBg(40);
  statusBar({ time: o.time });
  avatar(C.av, 17, 27, 9); tx(C.name, 31, 20, P.moon); tx(status, 31, 29, P.g5);
  tx('0:' + String(4 + Math.floor(t % 50)).padStart(2, '0'), PH.sw - 8, 20, P.s5, { align: 'r' });
}
// misses so far: a row of pips above End
function missRow(used, of, y = 200) { const w = measure('misses', 'tiny') + 3 + of * 5 - 2, x = Math.round(56 - w / 2); tx('misses', x, y, P.s4); for (let k = 0; k < of; k++) rrI(x + measure('misses', 'tiny') + 3 + k * 5, y, 3, 5, 1, k < used ? P.crimson : P.s3); }
function endCall(y = 220) { disc(56, y, 10, P.crimson); gl(PG.hang, 54, y - 1, P.moon); }
PHONE_SCREENS.mom = (t, o) => {
  callHead('mom', 'on call · line 2 of 3', t);
  bubble('Did you see my message on Facebook?', 'l', 48, { maxW: 96 });
  // the beat: her line's ending tells the reply; tap it while the marker is in the zone
  const bx = 8, bw = PH.sw - 16, y = 76, ph = (t / 2.4) % 1, mx = bx + Math.round(ph * (bw - 1)), zw = Math.round(bw * 0.3), zx = bx + 52;   // MOM_SWEEP_SEC, MOM_ZONE
  rrI(bx, y, bw, 9, 4, P.s1); rrI(zx, y + 1, zw, 7, 3, P.g3); rrI(zx, y + 1, zw, 1, 0, P.g5);
  rrI(mx, y - 2, 2, 13, 0, P.moon);
  tx('tap the reply in the zone', 56, y + 13, P.s5, { align: 'c' });
  let py = 104; py += pill('mhm', py, { glyph: '…' }); py += pill('really?!', py, { glyph: '?', pressed: mx >= zx && mx < zx + zw }); py += pill('wow', py, { glyph: '!' });
  tx(ph > 0.82 ? 'Too slow. She keeps talking.' : '', 56, py + 2, P.crimson, { align: 'c' });
  missRow(1, 4); endCall();
};
PHONE_SCREENS.courier = (t, o) => {
  const total = 8, left = total - (t % total);
  callHead('courier', 'on call', t);
  bubble('Hi, courier. Intercom is broken. Can you come out?', 'l', 48, { maxW: 100 });
  timerBar(86, left, total);
  tx('Get it left with a neighbour.', 56, 95, P.u6, { align: 'c' }); tx('One wrong word: he leaves.', 56, 103, P.s4, { align: 'c' });
  let py = 116; py += pill('Can a neighbour take it?', py); py += pill('Leave it on the street', py); py += pill('One sec, boss fight', py);
  endCall();
};
PHONE_SCREENS.boys = (t, o) => {
  const total = 8, left = total - (t % total);
  callHead('boys', 'on speaker', t);
  bubble('Danny: BRO. Raid. Now. Bring snacks.', 'l', 48, { maxW: 100 });
  timerBar(78, left, total);
  tx('Say no, nicely. Quickly.', 56, 88, P.u6, { align: 'c' });
  let py = 102; py += pill("Shh, she's next door. Text only, love you guys.", py); py += pill("WHAT? I CAN'T HEAR YOU", py); py += pill('Nah', py);
  rrI(8, py + 1, PH.sw - 16, 13, 5, P.wine); gl(PG.spk, 30, py + 4, P.moon); tx('She can hear it', 62, py + 4, P.moon, { align: 'c' });
  missRow(1, 2); endCall();
};
// texting her: the message types itself (hands busy), then Delivered
const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
PHONE_SCREENS.texting = (t, o) => {
  const msg = 'what are you watching? save me a spot', T = t % 6, n = Math.min(msg.length, Math.floor(T * 11)), sent = T > 4;
  const y0 = chatHead('Babe', 'babe', null, null, 'Messages');
  const th = [['l', 'are you coming to bed?', HER], ['r', 'Five more minutes, love ♥'], ['l', 'ok but 10 min', HER]];
  if (sent) th.push(['r', msg]);
  thread(th, y0, sent ? 136 : 144);
  if (sent) tx('Delivered', PH.sw - 8, 138, P.s5, { align: 'r' });
  // the field and the keyboard
  rrI(6, 150, PH.sw - 12, 14, 6, P.s2); rrI(7, 151, PH.sw - 14, 12, 5, P.s1);
  if (!sent) { const shown = msg.slice(Math.max(0, n - 18), n); const w = tx(shown, 11, 154, P.moon); if (Math.floor(t * 3) % 2) rrI(12 + w, 153, 1, 7, 0, P.gold); }
  else tx('Message', 11, 154, P.s4);
  const key = sent ? null : msg[n] && msg[n] !== ' ' ? msg[n] : null;
  KB_ROWS.forEach((row, r) => { const kw = 9, x0 = 4 + r * 5; [...row].forEach((c, i) => { const x = x0 + i * 10, y = 170 + r * 14, on = c === key; rrI(x, y + 1, kw, 11, 2, P.void); rrI(x, y, kw, 11, 2, on ? P.s5 : P.s3); tx(c, x + 5, y + 3, on ? P.void : P.moon, { align: 'c' }); }); });
  rrI(24, 212, 64, 11, 3, msg[n] === ' ' && !sent ? P.s5 : P.s3); tx('space', 56, 215, P.s1, { align: 'c' });
  tx(sent ? 'sent. back to the game' : 'typing: hands busy', 56, 229, sent ? P.g5 : P.s4, { align: 'c' });
};

// ---------------------------------------------------------------- the phone in your hand: body + screen, own canvas
// The canvas is the phone plus its side buttons (1 px each side). The phone's bottom runs off the frame.
const HAND = { bx: 1, w: PH.w + 2, h: PH.h };
let PH_CANVAS = null;
const inR = (i, j, r, w, h) => { if (i < 0 || j < 0 || i >= w || j >= h) return false; const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0; return !(cx && cy && cx * cx + cy * cy > r * r); };
function drawPhoneHand(scr, t, o = {}) {
  if (!PH_CANVAS) { PH_CANVAS = document.createElement('canvas'); PH_CANVAS.width = HAND.w; PH_CANVAS.height = HAND.h; }
  setRes(HAND.w, HAND.h); CLIP = null; PH_PHOTOS = [];
  const F = buf('phoneHand', HAND.w, HAND.h); clearFrame(F); bind(F);
  const OP = new Uint8Array(HAND.w * HAND.h), bx = HAND.bx;
  // the body: titanium frame with a polished edge, the black bezel
  const R = 17;
  for (let j = 0; j < PH.h; j++) for (let i = 0; i < PH.w; i++) {
    if (!inR(i, j, R, PH.w, PH.h)) continue;
    const edge = !inR(i - 1, j, R, PH.w, PH.h) || !inR(i + 1, j, R, PH.w, PH.h) || !inR(i, j - 1, R, PH.w, PH.h) || !inR(i, j + 1, R, PH.w, PH.h);
    const ring2 = !inR(i - 2, j, R, PH.w, PH.h) || !inR(i + 2, j, R, PH.w, PH.h) || !inR(i, j - 2, R, PH.w, PH.h) || !inR(i, j + 2, R, PH.w, PH.h);
    putI(bx + i, j, edge ? P.s2 : ring2 ? (i < PH.w * 0.5 || j < 30 ? P.s5 : P.s4) : P.void); OP[j * HAND.w + bx + i] = 1;
  }
  // side buttons: volume on the left, power on the right
  for (const [x, y0, h] of [[bx - 1, 52, 16], [bx - 1, 74, 16], [bx + PH.w, 66, 26]]) for (let y = y0; y < y0 + h; y++) { putI(x, y, P.s3); OP[y * HAND.w + x] = 1; }
  OX = PH.sx + bx; OY = PH.sy;
  const sc = PHONE_SCREENS[scr] || PHONE_SCREENS.lock;
  CLIP = [OX, OY, OX + PH.sw, OY + PH.sh];
  sc(t, o);
  CLIP = null;
  for (let j = 0; j < PH.sh; j++) for (let i = 0; i < PH.sw; i++) if (!inR(i, j, 12, PH.sw, PH.sh)) putI(OX + i, OY + j, P.void);   // round the screen's corners back to the bezel
  OX = PH.sx; OY = PH.sy;
  usePal(deskSet(DESK_VARIANT));
  const ds = VIEW.strength; VIEW.strength = 0.05;
  composeInto(PH_CANVAS.getContext('2d'), F, { lights: [], ambient: [1, 1, 1], tint: 0, vig: 0 }, 0);
  VIEW.strength = ds;
  usePal(PAL_BASE);
  paintPhotos(PH_CANVAS.getContext('2d'));   // her photos keep her colours
  // cut the shape out: transparent outside the body
  const g = PH_CANVAS.getContext('2d'), img = g.getImageData(0, 0, HAND.w, HAND.h), D = img.data;
  for (let k = 0; k < OP.length; k++) if (!OP[k]) D[k * 4 + 3] = 0;
  g.putImageData(img, 0, 0);
  return PH_CANVAS;
}
// lay the phone in your hand over a frame: it rises from the bottom; x, y are where its body's top-left lands
const easeOut = (k) => 1 - (1 - k) ** 3;
function drawPhoneOver(ctx, x, y, scr, t, o = {}) {
  const rise = o.rise ?? 1, c = drawPhoneHand(scr, t, o), dy = Math.round((1 - easeOut(Math.max(0, Math.min(1, rise)))) * 270);
  ctx.drawImage(c, x - HAND.bx, y + dy);
}
// ---------------------------------------------------------------- the screen of the phone lying on the desk
// A small texture over the whole top face (u -1..1 across, v 0..1 down its length): 64 x 100 texels, about one texel
// per screen pixel where it lies. desk.js maps it through the desk's camera (nearest texel), so everything on the glass
// is in perspective; the wallpaper stays material and is dithered in screen space.
const DT = { w: 64, h: 100 };
// who it is, on the desk phone: [fill, second tone] for calls, [fill, ink] for banners
const DESK_WHO = { mom: [P.copper, P.wine], courier: [P.steel, P.s2], boys: [P.arcane, P.d2], boss: [P.moon, P.s1], babe: [P.d6, P.d1] };
function deskScreen(st, t) {
  const B0 = B, W0 = W, H0 = H, C0 = CLIP;
  const T = buf('phoneDesk', DT.w, DT.h); clearFrame(T); setRes(DT.w, DT.h); bind(T); CLIP = null; OX = 0; OY = 0;
  const S = st.phone, mini = () => {   // status bar: the time, the island, the battery
    tx('20:15', 6, 4, P.moon); rrI(27, 4, 10, 4, 2, P.void);
    const b = st.batt ?? 64, low = b <= 20;
    frameI(50, 5, 7, 4, low ? P.crimson : P.moon); px(57, 6, low ? P.crimson : P.moon); rrI(51, 6, Math.max(1, Math.round(5 * b / 100)), 2, 0, low ? P.crimson : P.moon);
  };
  // On the desk the text is too small to read, so who it is shows in colour (2026-11-20): a call fills the screen
  // in the caller's colour (Mom copper, the courier steel blue, The Boys violet), a message banner is a solid block
  // in the sender's (the boss white, her pink, The Boys violet). The layouts stay the OS's, so a call still reads
  // as a call (the green knob, the red Decline) and a text as a banner.
  if (S === 'call') {
    const C = CALLERS[st.caller || 'mom'], [c0, c1] = DESK_WHO[st.caller || 'mom'];
    for (let j = 0; j < DT.h; j++) for (let i = 0; i < DT.w; i++) { const f = j / DT.h; px(i, j, f < 0.55 ? c0 : f < 0.7 ? (((i + j) & 1) ? c0 : c1) : c1); }
    mini();
    disc(32, 20, 9.5, P.void); avatar(C.av, 32, 20, 8);
    const nm = C.name.replace(' (3)', ''), big = measure(nm, 'tinyL') <= 54;
    tx(nm, 32, big ? 32 : 35, P.moon, { align: 'c', f: big ? 'tinyL' : 'tiny' });
    rrI(5, 53, 54, 11, 5, P.void); disc(10.5, 58.5, 4.5, P.g5); gl(PG.phone, 9, 56, P.moon); tx('slide', 36, 56, P.s4, { align: 'c' });
    disc(32, 73, 5.5, P.crimson); gl(PG.hang, 30, 72, P.moon);
  } else if (S === 'lock') {
    rrM(0, 0, DT.w, DT.h, 0, (i, j) => 0.03 + 0.22 * Math.max(0, j / DT.h - 0.25), M_DUSK);
    for (let k = 0; k < 12; k++) { const x = (k * 23 + 5) % 56 + 4, y = (k * 37 + 11) % 60 + 12; if (y > 24) px(x, y, k % 4 ? P.d5 : P.moon); }
    mini();
    tx(st.clockShort || '20:15', 32, 12, P.moon, { align: 'c', f: 'tinyL' });
    const bn = st.banners || [{ app: 'msg', who: 'Babe', what: 'are you coming to bed?' }];
    let y = 27;
    for (const b of bn.slice(0, 2)) {
      const who = b.app === 'work' ? 'boss' : b.who === 'Babe' ? 'babe' : /Boys/.test(b.who) ? 'boys' : null;
      const [fill, ink] = who ? DESK_WHO[who] : [P.s1, P.moon];
      rrI(4, y, 56, 18, 4, fill);
      if (who === 'babe') gl(PG.heart, 7, y + 3, P.moon); else if (who === 'boss') gl(PG.brief, 7, y + 3, P.s2); else if (who === 'boys') { disc(8, y + 5, 1.5, P.moon); disc(11, y + 4, 1.5, P.moon); disc(14, y + 5, 1.5, P.moon); } else rrI(7, y + 3, 5, 5, 1, P.s4);
      tx(who === 'babe' ? 'Babe' : b.who, 16, y + 2, ink);
      tx(fitT(b.what, 50), 7, y + 10, ink);
      y += 21;
    }
    if (bn.length > 2) tx('+' + (bn.length - 2) + ' more', 32, y + 1, P.d6, { align: 'c' });
  }
  if (S === 'lowbat') {   // the low battery alert at 20% and 10%: the lock screen wakes with a crimson block
    rrM(0, 0, DT.w, DT.h, 0, (i, j) => 0.03 + 0.22 * Math.max(0, j / DT.h - 0.25), M_DUSK);
    mini();
    tx(st.clockShort || '20:15', 32, 12, P.moon, { align: 'c', f: 'tinyL' });
    rrI(4, 30, 56, 30, 5, P.crimson);
    rrI(19, 35, 22, 11, 2, P.moon); rrI(20, 36, 20, 9, 1, P.crimson); rrI(41, 39, 2, 3, 0, P.moon); rrI(22, 38, 3, 5, 0, P.moon);
    tx((st.batt ?? 20) + '%', 32, 49, P.moon, { align: 'c' });
  } else if (S === 'dead') {   // dead: it shows the empty battery for a moment when it dies or when you tap it
    rrI(0, 0, DT.w, DT.h, 0, P.void);
    rrI(14, 38, 32, 16, 3, P.s3); rrI(16, 40, 28, 12, 2, P.void); rrI(46, 43, 3, 6, 1, P.s3);
    if (Math.floor(t * 1.5) % 2 === 0) rrI(18, 42, 3, 8, 0, P.crimson);
  }
  OX = PH.sx; OY = PH.sy; CLIP = C0; setRes(W0, H0); bind(B0);
  return T;
}
const avatarAt = (kind, cx, cy, r) => { const o = [OX, OY]; OX = OY = 0; avatar(kind, cx, cy, r); [OX, OY] = o; };
const glyphAt = (k, x, y, idx) => spr(x, y, PG[k], { x: idx });
// ---------------------------------------------------------------- the home screen and the Shop (handoff 4.6, #55)
// Tapping the idle phone opens the home screen: Messages (the contacts), Shop, Home (step 6); more apps later. The Shop sells
// real-life things only, in zl: For you (with Goblin Fuel) and For her (her gifts, #59). Buying is instant.
const zlP = (s, x, y, idx, al = 'l') => { const str = s + ' z', w = measure(str, 'tiny') + 5, x0 = al === 'c' ? Math.round(x - w / 2) : al === 'r' ? x - w : x; tx(str, x0, y, idx); spr(PHX(x0 + w - 4), PHY(y - 1), ['.x..', '.x.x', '.xx.', 'xx..', '.x..', '.x..'], { x: idx }); return w; };
const APP_G = {   // 12 x 12 app glyphs
  messages: ['............', '.xxxxxxxxxx.', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', '.xxxxxxxxxx.', '..xx........', '.xx.........', 'x...........', '............'],
  shop: ['....xxxx....', '...x....x...', '...x....x...', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxx.xxxx.xxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', '.xxxxxxxxxx.', '............'],
  home: ['.....xx.....', '....xxxx....', '...xxxxxx...', '..xxxxxxxx..', '.xxxxxxxxxx.', 'xxxxxxxxxxxx', '.xx......xx.', '.xx.xxx..xx.', '.xx.x.x..xx.', '.xx.xxx..xx.', '.xxxxxxxxxx.', '............'],
};
function appIcon(id, x, y, fill, glyphIdx, lab, o = {}) {
  rrI(x, y + 1, 28, 28, 7, P.void); rrI(x, y, 28, 28, 7, fill); rrI(x + 3, y, 22, 1, 0, o.hi ?? fill);
  gl(APP_G[id], x + 8, y + 8, glyphIdx);
  if (o.dim) for (let j = 0; j < 28; j++) for (let i = 0; i < 28; i++) if (((i + j) & 1) && inR(i, j, 7, 28, 28)) px(x + i, y + j, P.void);
  tx(lab, x + 14, y + 32, o.dim ? P.s4 : P.moon, { align: 'c' });
  if (o.sub) tx(o.sub, x + 14, y + 40, P.s4, { align: 'c' });
  if (o.tap) { const on = Math.floor(o.tap * 3) & 1; for (let k = 0; k < 32; k++) { if (((k >> 1) + on) & 1) continue; px(x - 2 + k, y - 2, P.gold); px(x - 2 + k, y + 29, P.gold); px(x - 2, y - 2 + k, P.gold); px(x + 29, y - 2 + k, P.gold); } }
}
// a battery glyph w x h (w >= 9): a frame, its nub, the fill; moss in widgets, crimson at 20% and under
function battG(x, y, w, h, b, o = {}) {
  const low = b <= 20, fill = o.charging ? P.g5 : low ? P.crimson : o.fill ?? P.g5, fr = o.frame ?? (low && !o.charging ? P.crimson : P.s5);
  rrI(x, y, w, h, 2, fr); rrI(x + 1, y + 1, w - 2, h - 2, 1, P.void); rrI(x + w, y + Math.round(h / 2) - 1, 1, 2, 0, fr);
  const n = Math.max(b > 0 ? 1 : 0, Math.round((w - 4) * b / 100)); if (n) rrI(x + 2, y + 2, n, h - 4, 0, fill);
  if (o.charging) gl(['..x', '.x.', 'xxx', '.x.', 'x..'], x + Math.round(w / 2) - 1, y + Math.round(h / 2) - 2, P.moon);
}
function homeScreen(t, o = {}) {
  const b = o.batt ?? 64, low = b <= 20;
  lockWall();
  for (let j = 0; j < PH.sh; j++) for (let i = 0; i < PH.sw; i++) if ((i + j) % 2 === 0 && j < 196) px(i, j, P.void);   // the wallpaper dims behind the icons
  statusBar({ batt: b });
  // the battery widget (step 6.1): what's left, and Charge phone (15 s away from the PC, +40%)
  rrI(6, 21, 100, 40, 8, P.void); rrI(6, 20, 100, 40, 8, P.s1); rrI(12, 20, 88, 1, 0, P.s3);
  battG(13, 28, 19, 9, b);
  tx(b + '%', 37, 26, low ? P.crimson : P.moon, { f: 'tinyL' });
  tx(low ? 'Low' : 'Phone', 99, 25, low ? P.crimson : P.s5, { align: 'r' }); tx('+40%', 99, 33, P.s4, { align: 'r' });
  const tap = o.tapCharge && (t % 3) > 1.6;
  rrI(11, 46, 90, 11, 5, P.copper); rrI(11, 45, 90, 11, 5, tap ? P.copper : P.gold);
  tx('Charge · 15 s away', 56, 48, P.void, { align: 'c' });
  if (o.tapCharge) { const on = Math.floor(t * 6) & 1; for (let k = 0; k < 96; k++) if (((k >> 1) + on) & 1) { px(8 + k, 42, P.gold); px(8 + k, 59, P.gold); } for (let k = 0; k < 18; k++) if (((k >> 1) + on) & 1) { px(8, 42 + k, P.gold); px(103, 42 + k, P.gold); } }
  const tapShop = o.tapShop && (t % 4) > 2.4 ? (t % 4) : 0, tapHome = o.tapHome && (t % 4) > 2.4 ? (t % 4) : 0;
  const tapMsg = o.tapMsg && (t % 4) > 2.4 ? (t % 4) : 0;
  appIcon('messages', 8, 72, P.g4, P.moon, 'Messages', { hi: P.g5, tap: tapMsg });
  if (o.unread) { disc(35, 73, 4.5, P.d6); tx(String(o.unread), 35, 71, P.void, { align: 'c' }); }   // her unread, in her pink
  appIcon('shop', 42, 72, P.copper, P.pale, 'Shop', { hi: P.gold, tap: tapShop });
  appIcon('home', 76, 72, P.steel, P.moon, 'Home', { hi: P.s6, tap: tapHome, sub: '4 devices' });
  homeBar(P.s5);
}
PHONE_SCREENS.home = (t, o) => homeScreen(t, { tapShop: true, ...o });
PHONE_SCREENS.homemsg = (t, o) => homeScreen(t, { tapMsg: true, unread: 1, ...o });
PHONE_SCREENS.homelow = (t, o) => homeScreen(t, { batt: 12, tapCharge: true, ...o });
// the phone in your hand when it's dead: nothing works, only Charge (step 6.1)
PHONE_SCREENS.dead = (t, o) => {
  rrI(0, 0, PH.sw, PH.sh, 12, P.void);
  const x = 34, y = 70;
  rrI(x, y, 42, 20, 4, P.s3); rrI(x + 2, y + 2, 38, 16, 3, P.void); rrI(x + 42, y + 7, 3, 6, 1, P.s3);
  if (Math.floor(t * 1.5) % 2 === 0) rrI(x + 4, y + 4, 3, 12, 1, P.crimson);
  // the cable, waiting
  rrI(54, 100, 3, 10, 0, P.s3); rrI(52, 110, 7, 6, 1, P.s4); rrI(55, 116, 1, 16, 0, P.s3);
  tx('0%', 56, 140, P.crimson, { align: 'c', f: 'tinyL' });
  ['Dead. No calls, no texts,', 'no Home app.', 'If Mom calls, she gets', 'Babe instead.'].forEach((l, k) => tx(l, 56, 158 + k * 8 + (k > 1 ? 4 : 0), k > 1 ? P.s4 : P.s5, { align: 'c' }));
  rrI(10, 209, PH.sw - 20, 12, 6, P.copper); rrI(10, 208, PH.sw - 20, 12, 6, P.gold); tx('Charge it · 15 s away', 56, 211, P.void, { align: 'c' });
  tx('+40%', 56, 224, P.s4, { align: 'c' });
};
// an item's 16 x 16 tile: a glyph on a colour, one per thing
const ITEM_G = {
  can: ['...xx...', '..xxxx..', '..x..x..', '..xxxx..', '..x..x..', '..xxxx..', '..x..x..', '..xxxx..'],
  chew: ['xx....xx', 'xxx..xxx', '.xxxxxx.', '..xxxx..', '..xxxx..', '.xxxxxx.', 'xxx..xxx', 'xx....xx'],
  keys: ['........', 'xxxxxxxx', 'x.x.x.xx', 'xxxxxxxx', 'xx.x.x.x', 'xxxxxxxx', '..xxxx..', '........'],
  fridge: ['xxxxxxx.', 'x....xx.', 'xxxxxxx.', 'x....xx.', 'x.....x.', 'x....xx.', 'x.....x.', 'xxxxxxx.'],
  chair: ['.xxxxx..', '.x...x..', '.x...x..', '.xxxxx..', 'xxxxxxx.', '...x....', '..xxx...', '.x.x.x..'],
  phone: ['.xxxxx..', '.x...x..', '.x...x..', '.x...x..', '.x...x..', '.x...x..', '.xx.xx..', '.xxxxx..'],
  flowers: ['.x.x.x..', 'xxx.xxx.', '.x.x.x..', '..xxx...', '...x....', '..xxx...', '.x.x.x..', '..xxx...'],
  socks: ['..xxx...', '..xxx...', '..xxx...', '..xxx...', '..xxxx..', '..xxxxx.', '..xxxxxx', '...xxxxx'],
  knee: ['..xxx...', '..x.x...', '..xxx...', '..x.x...', '..xxx...', '..xxxx..', '..xxxxx.', '...xxxxx'],
  tee: ['.xx..xx.', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.', '.xx..xx.', '.xxxxxx.', '.xxxxxx.', '.xxxxxx.'],
  pjs: ['.xx..xx.', 'xxxxxxxx', '.x.xx.x.', '.xxxxxx.', '.xx..xx.', '.xx..xx.', '.xx..xx.', '.xx..xx.'],
  vac: ['..xxxx..', '.xxxxxx.', 'xx....xx', 'xx.xx.xx', 'xx.xx.xx', 'xx....xx', '.xxxxxx.', '..xxxx..'],
  spk: ['.xxxxxx.', 'x......x', 'x.x..x.x', 'x......x', 'x.x..x.x', 'x......x', 'x.x..x.x', '.xxxxxx.'],
  tv: ['xxxxxxxx', 'x......x', 'x..x...x', 'x..xx..x', 'x..x...x', 'xxxxxxxx', '.x....x.', '........'],
  door: ['.xxxxxx.', '.x....x.', '.x....x.', '.x...xx.', '.x....x.', '.x....x.', '.x....x.', 'xxxxxxxx'],
  cup: ['.....x..', '....x...', '.xxxxxx.', '.x....x.', '.x.x..x.', '.x..x.x.', '.x.x..x.', '..xxxx..'],
  hoodie: ['.x....x.', '.xx..xx.', '.xxxxxx.', 'xx.xx.xx', 'xxxxxxxx', '.xxxxxx.', '.xxxxxx.', '.xxxxxx.'],
};
const SHOP = {
  you: [
    { g: 'can', c: [P.g4, P.moon], name: 'Goblin Fuel', zl: 29, fx: 'Four cans for the drawer (it holds 8).' },
    { g: 'chew', c: [P.u4, P.moon], name: 'Dog chew', zl: 29, fx: 'His next visit comes 2 min later. One use.' },
    { g: 'keys', c: [P.s3, P.moon], name: 'Silent keys', zl: 249, fx: 'Q4 makes half the Noise.' },
    { g: 'fridge', c: [P.s4, P.moon], name: 'Mini fridge', zl: 599, fx: 'A cold can already waits on the desk.' },
    { g: 'chair', c: [P.u3, P.moon], name: 'Ergo chair', zl: 899, fx: 'Tiredness builds 15% slower.' },
    { g: 'phone', c: [P.s3, P.moon], name: 'New phone', zl: 2999, fx: 'The battery drains 40% slower.' },
  ],
  home: [
    { g: 'vac', c: [P.steel, P.moon], name: 'Robot vacuum', zl: 899, fx: 'Sends her to stop it. Next visit +45 s.' },
    { g: 'spk', c: [P.steel, P.moon], name: 'Speakers', zl: 199, fx: 'A pair: kitchen and bath. A timer, +30 s.', state: 'owned' },
    { g: 'tv', c: [P.steel, P.moon], name: 'TV cast', zl: 149, fx: 'At the credits: one more episode.' },
    { g: 'door', c: [P.steel, P.moon], name: 'Door seal', zl: 39, fx: 'Like a towel: quieter, no light under it.', state: 'owned' },
    { g: 'cup', c: [P.u3, P.pale], name: 'Bubble tea', zl: 25, fx: 'An order, in the Home app. Twice a night.', state: 'inhome' },
  ],
  her: [
    { g: 'flowers', c: [P.d4, P.d6], name: 'Flowers', zl: 49, fx: '+20 Goodwill at once. One use.', state: 'tonight' },
    { g: 'socks', c: [P.d3, P.moon], name: 'Fluffy socks', zl: 79, fx: 'She loves them. Her steps go silent.', state: 'owned' },
    { g: 'knee', c: [P.d3, P.moon], name: 'Knee socks', zl: 99, fx: '+20 Goodwill the first time she wears them.' },
    { g: 'tee', c: [P.g3, P.moon], name: 'Fury tee', zl: 129, fx: 'Goblin Fury merch. +20 Goodwill the first time.' },
    { g: 'pjs', c: [P.d4, P.moon], name: 'Pajama set', zl: 149, fx: '+20 Goodwill the first time she wears it.' },
    { g: 'hoodie', c: [P.s3, P.moon], name: 'Cat hoodie', zl: 199, fx: 'Cat ears. +20 Goodwill the first time.' },
  ],
};
function shopScreen(t, tab, wallet) {
  flatBg(46);
  statusBar();
  gl(PG.back, 7, 18, P.gold); tx('Shop', 14, 15, P.moon, { f: 'tinyL' });
  zlP(String(wallet), PH.sw - 6, 19, P.g5, 'r');
  // For you | For her
  rrI(6, 33, PH.sw - 12, 11, 5, P.s2);
  const TABS = [['you', 'For you', P.s4], ['her', 'For her', P.d4], ['home', 'Home', P.steel]], hw = (PH.sw - 14) / 3;
  TABS.forEach(([id, lab, fill], k) => { const on = id === tab; if (on) rrI(Math.round(7 + k * hw), 34, Math.round(hw), 9, 4, fill); tx(lab, Math.round(7 + hw * (k + 0.5)), 36, on ? P.moon : P.s5, { align: 'c' }); });
  const L = SHOP[tab], buy = tab === 'you' ? ((t % 5) > 2 ? 1 : 0) : 0;
  L.forEach((it, k) => {
    const y = 50 + k * 30, justBought = tab === 'you' && k === 1 && buy, pressed = tab === 'you' && k === 1 && (t % 5) > 1.7 && (t % 5) <= 2;
    if (k) rrI(26, y - 2, PH.sw - 30, 1, 0, P.s1);
    if (justBought && (t % 5) < 2.5) rrI(3, y - 1, PH.sw - 6, 28, 4, P.g2);   // the row flashes moss when it's bought
    rrI(5, y + 1, 17, 17, 4, P.void); rrI(5, y, 17, 17, 4, it.c[0]); gl(ITEM_G[it.g].map((r) => r), 9, y + 4, it.c[1]);
    tx(it.name, 26, y + 2, it.soon ? P.s4 : tab === 'her' ? P.d6 : P.moon);
    const lines = wrapT(it.fx, PH.sw - 30).slice(0, 2); lines.forEach((ln, j) => tx(ln, 26, y + 11 + j * 8, P.s5));
    // the price: a gold pill if you can buy it now; grey if it costs more than you have; or what you already have
    const state = justBought ? 'tonight' : it.state || (it.soon ? 'soon' : it.zl <= wallet ? 'buy' : 'dear');
    const pw = 30, pxx = PH.sw - pw - 4, py = y + 1;
    if (state === 'buy') { rrI(pxx, py + 1, pw, 9, 4, P.copper); rrI(pxx, py, pw, 9, 4, pressed ? P.copper : P.gold); zlP(String(it.zl), pxx + pw / 2, py + 2, P.void, 'c'); }
    else if (state === 'dear') { rrI(pxx, py, pw, 9, 4, P.s2); zlP(String(it.zl), pxx + pw / 2, py + 2, P.s4, 'c'); }
    else if (state === 'soon') { rrI(pxx, py, pw, 9, 4, P.s1); tx('soon', pxx + pw / 2, py + 2, P.s4, { align: 'c' }); }
    else if (state === 'inhome') { rrI(pxx, py, pw, 9, 4, P.s2); tx('Home', pxx + pw / 2, py + 2, P.s5, { align: 'c' }); }
    else { const s = state === 'owned' ? 'owned' : 'tonight', w2 = measure(s, 'tiny') + 6; rrI(PH.sw - w2 - 4, py, w2, 9, 4, P.g3); tx(s, PH.sw - 4 - w2 / 2, py + 2, P.g6, { align: 'c' }); }
    // its name stays clear of the pill
  });
  homeBar();
}
PHONE_SCREENS.shop = (t, o) => shopScreen(t, 'you', (t % 5) > 2 ? 103 : 132);
PHONE_SCREENS.shopher = (t, o) => shopScreen(t, 'her', 132);
PHONE_SCREENS.shophome = (t, o) => shopScreen(t, 'home', 412);
// ---------------------------------------------------------------- the Home app (step 6.2, #57)
// The flat as tiles from the build's plan (ui/plan.ts), the bought devices on it. Tap a device, confirm with its
// battery cost, see its cooldown. It never shows where she is: the house knows its devices, not its people.
const HOME_COST = { vacuum: 20, speaker: 10, tv: 8, seal: 4, tea: 6 };   // battery %, set 2026-11-20 (grid doc 7j)
const DEV_G = {   // 7 x 7
  vacuum: ['..xxx..', '.xxxxx.', 'xx...xx', 'xx.x.xx', 'xx...xx', '.xxxxx.', '..xxx..'],
  speaker: ['.xxxxx.', 'x.....x', 'x.x.x.x', 'x.....x', 'x.x.x.x', 'x.....x', '.xxxxx.'],
  tv: ['xxxxxxx', 'x.....x', 'x..x..x', 'x..xx.x', 'x..x..x', 'xxxxxxx', '.x...x.'],
  seal: ['.xxxxx.', '.x...x.', '.x...x.', '.x..xx.', '.x...x.', '.x...x.', 'xxxxxxx'],
  tea: ['....x..', '...x...', '.xxxxx.', '.x...x.', '.x.x.x.', '.x...x.', '..xxx..'],
};
const HROOM = (u, v) => {   // the build's plan in its 200 x 200 units: which room a point is in
  if (u < 0 || v < 0 || u > 200 || v > 200) return null;
  if (u >= 140 && v >= 84) return 'you';
  if (v < 84) return u < 70 ? (v < 56 ? 'bedroom' : 'bath') : u < 110 ? 'bedroom' : 'kitchen';   // the plan as approved 2026-11-20
  if (u < 70) return v < 100 ? 'bath' : 'living';
  return v < 108 ? 'hallway' : 'living';
};
const HP0 = [6, 50], hux = (u) => HP0[0] + Math.round(u * 0.5), huy = (v) => HP0[1] + Math.round(v * 0.5);
const HDEV = { vacuum: [100, 160], speakerK: [176, 52], speakerB: [58, 88], tv: [12, 140], seal: [154, 96] };
function homePlan(t, st) {
  rrI(HP0[0] - 3, HP0[1] - 3, 106, 106, 6, P.void);
  for (let j = 0; j < 101; j++) for (let i = 0; i < 101; i++) {
    const r = HROOM((i + 0.5) * 2, (j + 0.5) * 2); if (!r) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => HROOM((i + a + 0.5) * 2, (j + b + 0.5) * 2) !== r);
    const sel = st.room && r === st.room;
    px(HP0[0] + i, HP0[1] + j, nb || i === 0 || j === 0 || i === 100 || j === 100 ? P.void : sel ? P.s3 : r === 'you' ? P.s2 : P.s1);
  }
  const lab = (s, u, v, c = P.s5) => tx(s, hux(u) + 3, huy(v) + 3, c);
  lab('Bedroom', 2, 2); lab('Bath', 2, 58); lab('Kitchen', 110, 2); lab('Hallway', 70, 84); lab('Living', 2, 104); lab('You', 146, 150, P.gold);
  // the devices
  const sd = st.dev || {};
  devIcon('vacuum', ...HDEV.vacuum, sd.vacuum || 'ready', t, st);
  devIcon('speaker', ...HDEV.speakerK, sd.speaker || 'ready', t, st);
  devIcon('speaker', ...HDEV.speakerB, sd.speaker || 'ready', t, st);
  devIcon('tv', ...HDEV.tv, sd.tv || 'ready', t, st);
  devIcon('seal', ...HDEV.seal, sd.seal || 'ready', t, st);
}
// a device on the plan: a disc with its glyph. Ready: a gold ring (tap it now). Cooling: a sweep and the time left.
// On (the seal) or running (the vacuum): moss. Picked (its sheet is open): a marching gold ring.
function devIcon(kind, u, v, state, t, st) {
  let cx = hux(u), cy = huy(v);
  if (kind === 'vacuum' && state === 'running') { const r = st.runRoom || 'kitchen', path = { kitchen: [[130, 30], [180, 60], [150, 70], [125, 50]], living: [[50, 122], [112, 124], [108, 140], [52, 140]] }[r]; const k = (t * 0.25) % 1, n = path.length, s = Math.floor(k * n), f = k * n - s, a = path[s], b = path[(s + 1) % n]; cx = hux(a[0] + (b[0] - a[0]) * f); cy = huy(a[1] + (b[1] - a[1]) * f); }
  const on = state === 'on' || state === 'running', cool = typeof state === 'number', picked = st.pick === kind;
  disc(cx, cy + 1, 6, P.void); disc(cx, cy, 6, on ? P.g3 : cool ? P.s1 : P.s2);
  gl(DEV_G[kind], cx - 3, cy - 3, on ? P.g6 : cool ? P.s4 : P.moon);
  const ring = (idx, n = 64, dash = 0, f = 1) => { for (let a = 0; a < n; a++) { if (a / n > f) break; if (dash && ((a >> 1) + Math.floor(t * 6)) & 1) continue; const an = (a / n) * 6.283 - 1.571; px(Math.round(cx - 0.5 + Math.cos(an) * 7.5), Math.round(cy - 0.5 + Math.sin(an) * 7.5), idx); } };
  if (picked) ring(P.gold, 64, 1);
  else if (on) ring(P.g5);
  else if (cool) { ring(P.s3); ring(P.s5, 64, 0, 1 - state); }
  else if (state === 'ready') ring(Math.floor(t * 2) % 2 ? P.gold : P.pale);
  const tag = (s, c, bg = P.void) => { const w = measure(s, 'tiny') + 4; rrI(cx - Math.round(w / 2), cy + 8, w, 8, 3, bg); tx(s, cx, cy + 9, c, { align: 'c' }); };
  if (cool && st.coolText && st.coolText[kind] && !(kind === 'speaker' && u < 110)) tag(st.coolText[kind], P.s5);   // the pair shares one time: shown once
  if (state === 'running') tag('running', P.g6, P.g2);
  if (kind === 'seal' && state === 'on') tag('sealed', P.g6, P.g2);
}
function homeHead(b, sub) {
  flatBg(44); statusBar({ batt: b });
  gl(PG.back, 7, 18, P.gold); tx('Home', 14, 15, P.moon, { f: 'tinyL' });
  battG(PH.sw - 22, 18, 15, 7, b); tx(b + '%', PH.sw - 25, 18, b <= 20 ? P.crimson : P.s5, { align: 'r' });
  tx(sub, 8, 33, P.s5);
}
// bubble tea: an order, not a device (25 zl and battery), twice a night; then the doorbell's countdown
function teaCard(t, st) {
  const y = 160;
  rrI(6, y, 100, 24, 6, P.s1); rrI(10, y, 92, 1, 0, P.s3);
  rrI(10, y + 4, 15, 15, 4, P.u3); gl(DEV_G.tea, 14, y + 8, P.pale);
  tx('Bubble tea', 29, y + 4, P.moon);
  if (st.tea) { tx('1 of 2', 101, y + 4, P.s4, { align: 'r' }); tx('Doorbell in ' + st.tea, 29, y + 13, P.g5); return; }
  const w = zlP('25', 29, y + 13, P.s5); tx('· ' + HOME_COST.tea + '%', 29 + w + 2, y + 13, P.s5);
  rrI(78, y + 8, 24, 10, 5, P.copper); rrI(78, y + 7, 24, 10, 5, P.gold); tx('Order', 90, y + 9, P.void, { align: 'c' });
}
function homeApp(t, st) {
  const b = st.batt ?? 64;
  homeHead(b, st.sub || 'Tap a device to use it.');
  homePlan(t, st);
  teaCard(t, st);
  tx(st.foot || 'Gold ring: ready to use.', 56, 192, P.s4, { align: 'c' });
  homeBar();
}
// a device's sheet: what it does (the condition, never whether it's met), where (for the vacuum), the battery it
// takes, and the one gold button
function homeSheet(t, st, d) {
  for (let j = 0; j < PH.sh; j++) for (let i = 0; i < PH.sw; i++) if ((i + j) & 1) px(i, j, P.void);   // the plan dims behind
  const y0 = d.y0;
  rrI(0, y0, PH.sw, PH.sh - y0, 10, P.s1); rrI(8, y0, PH.sw - 16, 1, 0, P.s3); rrI(46, y0 + 3, 20, 2, 1, P.s3);
  disc(14, y0 + 15, 6, P.s2); gl(DEV_G[d.kind], 11, y0 + 12, P.moon);
  const big = measure(d.name, 'tinyL') <= PH.sw - 30; tx(d.name, 24, y0 + (big ? 10 : 12), P.moon, { f: big ? 'tinyL' : 'tiny' });
  let y = y0 + 27;
  for (const l of wrapT(d.what, PH.sw - 14)) { tx(l, 7, y, P.u6); y += 8; }
  if (d.note) { y += 2; for (const l of wrapT(d.note, PH.sw - 14)) { tx(l, 7, y, P.s4); y += 8; } }
  if (d.rooms) {
    y += 4; tx('Where', 7, y, P.s5); y += 9;
    let x = 7;
    for (const r of d.rooms) { const w = measure(r, 'tiny') + 7; if (x + w > PH.sw - 6) { x = 7; y += 11; } const on = r === d.room; rrI(x, y, w, 9, 4, on ? P.moon : P.s2); tx(r, x + w / 2, y + 2, on ? P.void : P.s5, { align: 'c' }); x += w + 3; }
    y += 13;
  } else y += 4;
  // the battery it takes
  const b = st.batt ?? 64, after = Math.max(0, b - d.cost);
  battG(7, y, 13, 7, b); tx(b + '%', 24, y, P.s5); tx('>', 24 + measure(b + '%', 'tiny') + 3, y, P.s4);
  const ax = 24 + measure(b + '%', 'tiny') + 10; battG(ax, y, 13, 7, after); tx(after + '%', ax + 17, y, after <= 20 ? P.crimson : P.s5);
  if (after <= 20) tx('low', PH.sw - 7, y, P.crimson, { align: 'r' });
  y += 13;
  const press = st.press && (t % 3) > 2.2;
  rrI(7, y + 1, PH.sw - 14, 13, 6, P.copper); rrI(7, y, PH.sw - 14, 13, 6, press ? P.copper : P.gold);
  tx(d.go + ' · ' + d.cost + '%', 56, y + 3, P.void, { align: 'c' });
  tx('Cancel', 56, y + 19, P.s5, { align: 'c' });
  homeBar();
}
const HOME_BASE = { batt: 64, dev: { vacuum: 0.35 }, coolText: { vacuum: '1:03' } };
PHONE_SCREENS.homeapp = (t, o) => homeApp(t, { ...HOME_BASE, ...o });
PHONE_SCREENS.homesheet = (t, o) => { homeApp(t, { ...HOME_BASE, dev: {}, coolText: {}, pick: 'vacuum', room: 'living' }); homeSheet(t, { batt: 64, press: true }, { y0: 84, kind: 'vacuum', name: 'Robot vacuum', what: "If she's in that room or next door, she goes to stop it. Her next visit comes 45 s later.", note: 'Then it rests 3 min.', rooms: ['Living', 'Kitchen', 'Bath', 'Bedroom', 'Hallway'], room: 'Living', cost: HOME_COST.vacuum, go: 'Start' }); };
PHONE_SCREENS.hometv = (t, o) => { homeApp(t, { ...HOME_BASE, batt: 44, dev: { vacuum: 0.9 }, coolText: { vacuum: '2:42' }, pick: 'tv' }); homeSheet(t, { batt: 44 }, { y0: 112, kind: 'tv', name: 'TV cast', what: 'While her show\'s credits roll: Next episode keeps her on the couch for one more.', note: '1 of 2 tonight. A third time, she notices.', cost: HOME_COST.tv, go: 'Next episode' }); };
PHONE_SCREENS.hometea = (t, o) => homeApp(t, { batt: 30, dev: { vacuum: 'running', seal: 'on', speaker: 0.6, tv: 0.2 }, runRoom: 'living', coolText: { speaker: '0:24', tv: '1:48' }, tea: '1:47', sub: 'Tap a device to use it.', foot: 'Sealed: quieter, no light under it.' });
PHONE_SCREENS.homeseal = (t, o) => { homeApp(t, { ...HOME_BASE, batt: 36, pick: 'seal' }); homeSheet(t, { batt: 36 }, { y0: 120, kind: 'seal', name: 'Door seal', what: 'Your Noise reaches her 40% quieter and she gets up less often. No light under your door, so no toes, no shadows.', note: 'She asks about it on every visit.', cost: HOME_COST.seal, go: 'Seal the door' }); };
// ---------------------------------------------------------------- her chat and her photos (2026-11-20)
// Messages is hers only: the app opens her chat straight away. One thread, kept for good across the nights, newest at
// the bottom; the wheel (or a drag) scrolls it a bubble at a time, so a bubble is never cut (#45). Her photos sit in
// the thread as a crop of the photo at its own pixel size (nothing is scaled); tap one and the whole photo opens in a
// window beside the phone (photoWindow, over the right screen). Selfies live only here: there is no Gallery.

// her photos: code-drawn stand-ins in her panel's 16 PC-98 colours (C9) until Paweł draws them, 180 x 240 each
const SELFIE_W = 180, SELFIE_H = 240, SELFIE = {};
function vShapeTest(s) {
  if (s.ell) { const [cx, cy, rx, ry] = s.ell; return (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1; }
  if (s.cap) { const [ax, ay, bx, by, r0, r1] = s.cap, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1; return (x, y) => { const k = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2)), r = r0 + (r1 - r0) * k; return (x - ax - dx * k) ** 2 + (y - ay - dy * k) ** 2 <= r * r; }; }
  const Q = s.poly; return (x, y) => { let c = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const [xi, yi] = Q[i], [xj, yj] = Q[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
}
function vShapeBox(s) {
  if (s.ell) { const [cx, cy, rx, ry] = s.ell; return [cx - rx, cy - ry, cx + rx, cy + ry]; }
  if (s.cap) { const [ax, ay, bx, by, r0, r1] = s.cap, r = Math.max(r0, r1); return [Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r]; }
  const xs = s.poly.map((q) => q[0]), ys = s.poly.map((q) => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
// shapes back to front: a lit and a shade tone with a 50% checker between (key light from the upper left), an
// optional highlight, a 1 px line where a shape lies over what's behind it (the her panel's PC-98 cel look)
function vPaint(W, H, bg, shapes) {
  const I = new Int16Array(W * H), ID = new Int16Array(W * H).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) I[y * W + x] = bg(x, y);
  shapes.forEach((s, n) => {
    const inside = vShapeTest(s), [x0, y0, x1, y1] = vShapeBox(s);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = Math.max(1, (x1 - x0) / 2), ry = Math.max(1, (y1 - y0) / 2), L = s.light || [0.85, 0.4], cut = s.cut ?? 0.3;
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, Math.ceil(y1)); y++) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(W - 1, Math.ceil(x1)); x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const d = ((x + 0.5 - cx) / rx) * L[0] + ((y + 0.5 - cy) / ry) * L[1];
      let c = s.fill;
      if (s.shade != null && (d > cut + 0.14 || (d > cut && ((x + y) & 1)))) c = s.shade;
      if (s.hi != null && (d < (s.hiCut ?? -0.7) - 0.1 || (d < (s.hiCut ?? -0.7) && ((x + y) & 1)))) c = s.hi;
      if (s.tex) c = s.tex(x, y, c, d);
      I[y * W + x] = c; ID[y * W + x] = n;
    }
  });
  const O = I.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = ID[y * W + x]; if (n < 0 || shapes[n].line == null) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; if (ID[Y * W + X] < n) { O[y * W + x] = shapes[n].line; break; } }
  }
  return O;
}
const bay = (x, y) => BAYER8[((y & 7) << 3) | (x & 7)];
// the top of an ellipse, cut flat at y = cut (a crown of hair with blunt bangs)
const arcCut = (cx, cy, rx, ry, cut, n = 24) => { const q = []; for (let k = 0; k <= n; k++) { const a = Math.PI + Math.PI * k / n; q.push([cx + Math.cos(a) * rx, Math.min(cut, cy + Math.sin(a) * ry)]); } q.push([cx + rx, cut], [cx - rx, cut]); return q; };
function selfieArt(key) {
  const C = C9, W = SELFIE_W, H = SELFIE_H;
  const hair = { fill: C.plum, shade: C.void, hi: C.purple, hiCut: -0.55, line: C.void };
  const skin = { fill: C.skin, shade: C.beige, line: C.brown, cut: 0.35 }, skinD = { fill: C.beige, shade: C.tan, line: C.brown };
  const jer = { fill: C.denim, shade: C.purple, hi: C.lilac, hiCut: -0.8, line: C.plum };
  let I;
  if (key === 'jersey') {   // a mirror selfie in his jersey: the phone hides half her face (fan-service step 5)
    const bg = (x, y) => {
      if (x < 6 || y < 5) return x === 5 || y === 4 ? C.brown : (x + y) % 9 === 0 ? C.brown : C.tan;   // the mirror's wooden frame
      if (y > 206) return (y - 206) % 9 === 0 ? C.plum : x % 31 === 0 ? C.plum : C.brown;                // the floor
      const v = 0.78 - 0.5 * (y / H) - 0.42 * (x / W) + (Math.hypot(x - 20, y - 30) < 60 ? 0.12 : 0);    // the lamp on the left
      return v - 0.08 > bay(x, y) * 0.5 + 0.35 ? C.lilac : v > bay(x, y) * 0.5 + 0.08 ? C.purple : C.plum;
    };
    const hemTex = (x, y, c) => (y >= 171 && y <= 172 ? C.moon : c);
    const S = [
      { poly: [[128, 150], [180, 144], [180, 240], [122, 240]], fill: C.beige, shade: C.tan, line: C.plum, light: [0.2, 0.9], cut: 0.1 },   // the bed behind her
      { poly: [[71, 22], [113, 22], [124, 52], [128, 118], [121, 132], [112, 126], [108, 86], [76, 86], [72, 126], [63, 132], [56, 118], [60, 52]], ...hair },
      { poly: [[66, 168], [90, 168], [89, 206], [86, 240], [70, 240], [67, 206]], ...skin },
      { poly: [[94, 168], [120, 168], [118, 204], [111, 240], [95, 240], [95, 206]], ...skin },
      { poly: [[58, 72], [126, 72], [132, 98], [124, 102], [124, 174], [112, 178], [92, 175], [72, 178], [60, 174], [60, 102], [52, 98]], ...jer, tex: hemTex },
      { poly: [[116, 72], [128, 74], [137, 92], [133, 113], [120, 115], [116, 94]], ...jer, tex: (x, y, c) => (y >= 110 ? C.moon : c) },
      { cap: [126, 114, 121, 164, 5.5, 4.5], ...skin },
      { ell: [118, 170, 6, 5], ...skin },
      { poly: [[85, 58], [99, 58], [100, 76], [84, 76]], ...skinD },
      { poly: [[80, 72], [104, 72], [92, 87]], ...skin, line: C.moon },
      { ell: [92, 42, 16, 19], ...skin },
      { poly: [[74, 28], [81, 30], [79, 62], [73, 76], [67, 68]], ...hair },
      { poly: [[104, 30], [111, 27], [118, 68], [113, 78], [105, 62]], ...hair },
      { poly: arcCut(92, 40, 20, 22, 39), ...hair, tex: (x, y, c) => (y === 38 && x % 5 === 0 ? C.skin : (x - 84) % 9 === 0 && y > 22 && y < 36 && c === C.plum ? C.void : c) },
      { cap: [60, 84, 46, 106, 7, 6], ...skin },
      { cap: [46, 106, 64, 64, 6, 4.5], ...skin },
      { poly: [[66, 72], [50, 84], [42, 103], [55, 109], [63, 93]], ...jer, tex: (x, y, c) => (x + y * 0.55 > 101 && x + y * 0.55 < 104 ? C.moon : c) },
      { poly: [[60, 31], [82, 31], [85, 34], [85, 61], [82, 64], [60, 64], [57, 61], [57, 34]], fill: C.lilac, shade: C.purple, line: C.void },
      { ell: [85, 46, 3, 4], ...skin }, { ell: [85, 54, 3, 3.5], ...skin }, { ell: [58, 52, 3, 4.5], ...skin },
    ];
    I = vPaint(W, H, bg, S);
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) I[y * W + x] = c; };
    const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
    // the phone's camera block, its lenses and flash
    rect(61, 35, 11, 11, C.void); rect(62, 36, 4, 4, C.denim); rect(67, 41, 4, 4, C.denim); put(62, 36, C.moon); put(67, 41, C.moon); put(69, 37, C.gold);
    // her one eye (the other is behind the phone), the lashes, a blush, a small smile
    rect(95, 43, 9, 2, C.void); put(94, 44, C.void); put(104, 44, C.void); rect(97, 45, 4, 4, C.moss); rect(98, 46, 2, 3, C.void); put(97, 45, C.moon); put(101, 47, C.cyan);
    rect(96, 49, 6, 1, C.tan);
    for (let i = 0; i < 6; i++) if (i % 2 === 0) { put(99 + i, 52, C.rose); put(100 + i, 53, C.rose); }
    put(91, 57, C.rose); rect(92, 58, 4, 1, C.rose); put(96, 57, C.rose);
    // the pink flower clip
    for (const [a, b] of [[0, -3], [3, -1], [2, 3], [-2, 3], [-3, -1]]) { rect(110 + a - 1, 26 + b - 1, 3, 3, C.pink); put(110 + a, 26 + b, C.rose); }
    rect(109, 25, 3, 3, C.gold);
    // his number on her: 17, moon on the jersey
    const dig = (x, y, segs) => { for (const sg of segs) rect(x + sg[0], y + sg[1], sg[2], sg[3], C.moon); };
    dig(80, 108, [[4, 0, 3, 22], [2, 2, 2, 3]]); dig(90, 108, [[0, 0, 12, 3], [9, 3, 3, 6], [6, 9, 3, 6], [4, 15, 3, 7]]);
    rect(56, 98, 2, 3, C.crimson); rect(126, 98, 2, 3, C.crimson);
  } else {   // under the duvet, "it's cold": seen from above, the duvet up to her nose
    const bg = (x, y) => ((x * 3 + y * 2) % 41 < 2 ? C.tan : (x + y) % 2 && (x * 7 + y * 3) % 23 === 0 ? C.tan : C.beige);
    const S = [
      { ell: [90, 70, 86, 56], fill: C.moon, shade: C.beige, line: C.tan, cut: 0.2 },
      { ell: [90, 92, 60, 46], ...hair, tex: (x, y, c) => { const a = Math.atan2(y - 92, x - 90); return Math.abs(Math.sin(a * 9)) < 0.08 && c !== C.purple ? C.void : c; } },
      { ell: [90, 96, 22, 26], ...skin },
      { poly: arcCut(90, 92, 25, 26, 88), ...hair, tex: (x, y, c) => (y === 87 && x % 5 === 0 ? C.skin : (x - 82) % 9 === 0 && y > 70 && y < 85 && c === C.plum ? C.void : c) },
      { poly: [[0, 114], [26, 104], [58, 111], [90, 104], [122, 111], [152, 103], [180, 112], [180, 240], [0, 240]], fill: C.lilac, shade: C.purple, hi: C.moon, hiCut: -0.95, line: C.plum, light: [0.5, 0.8], cut: 0.25,
        tex: (x, y, c) => ((x + y) % 34 === 0 || (x - y + 400) % 34 === 0 ? (c === C.purple ? C.plum : C.purple) : c) },
      { ell: [70, 110, 7, 5], ...skin }, { ell: [112, 110, 7, 5], ...skin },
    ];
    I = vPaint(W, H, bg, S);
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) I[y * W + x] = c; };
    const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
    // sleepy eyes, half shut; a blush
    for (const ex of [78, 96]) { rect(ex, 95, 8, 2, C.void); rect(ex + 2, 97, 4, 2, C.moss); put(ex + 3, 97, C.void); put(ex + 4, 97, C.void); put(ex - 1, 96, C.void); put(ex + 8, 96, C.void); for (let i = 0; i < 6; i += 2) put(ex + i, 101, C.rose); }
    for (const [a, b] of [[0, -3], [3, -1], [2, 3], [-2, 3], [-3, -1]]) { rect(124 + a - 1, 62 + b - 1, 3, 3, C.pink); put(124 + a, 62 + b, C.rose); }
    rect(123, 61, 3, 3, C.gold);
  }
  return I;
}
function selfie(key) {   // { I: C9 indices, rgba: ImageData, canvas }
  if (SELFIE[key]) return SELFIE[key];
  const I = selfieArt(key), c = document.createElement('canvas'); c.width = SELFIE_W; c.height = SELFIE_H;
  const g = c.getContext('2d'), img = g.createImageData(SELFIE_W, SELFIE_H);
  for (let k = 0; k < I.length; k++) { const q = PC98_RGB[I[k]]; img.data[k * 4] = q[0]; img.data[k * 4 + 1] = q[1]; img.data[k * 4 + 2] = q[2]; img.data[k * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  return (SELFIE[key] = { I, img, canvas: c });
}
// a photo's crop in a bubble: where to look in the 180 x 240 photo
const PHOTO_CROP = { jersey: [54, 16], duvet: [53, 64] }, PB = { w: 76, h: 56 };
let PH_PHOTOS = [];   // the crops the screen asked for, painted after the phone is composed (they keep her colours)

// her thread, kept for good: Sunday's and tonight's (the page's demo)
const HER_THREAD = [
  ['date', 'Sunday'], ['photo', 'duvet'], ['l', 'its cold'], ['l', 'come warm me up'], ['r', '5 min ♥'], ['sys', 'Babe unsent a photo.'], ['l', 'ok goodnight then'],
  ['date', 'Today 23:12'], ['l', 'going to bed'], ['l', 'dont stay up too late'], ['r', 'one more floor ♥'],
  ['date', '00:41'], ['photo', 'jersey'], ['l', 'stole your jersey'],
];
function itemH(m) { return m[0] === 'date' ? 13 : m[0] === 'sys' ? 11 : m[0] === 'photo' ? PB.h + 3 + (m[2] && m[2].left != null ? 9 : 0) : wrapT(m[1], 66).length * 8 + 8; }
function drawItem(m, y, t) {
  if (m[0] === 'date') { const w = measure(m[1], 'tiny'), a = Math.round(56 - w / 2 - 5), b = Math.round(56 + w / 2 + 4); tx(m[1], 56, y + 3, P.s4, { align: 'c' }); rrI(10, y + 5, a - 10, 1, 0, P.s2); rrI(b, y + 5, PH.sw - 10 - b, 1, 0, P.s2); return; }
  if (m[0] === 'sys') { tx(m[1], 56, y + 2, P.s4, { align: 'c' }); return; }
  if (m[0] === 'photo') {
    const x = 7, o = m[2] || {};
    rrI(x, y, PB.w, PB.h, 4, P.d3); rrI(x - 1, y + PB.h - 1, 2, 1, 0, P.d3);
    const [sx, sy] = PHOTO_CROP[m[1]];
    PH_PHOTOS.push({ key: m[1], x: PHX(x + 1), y: PHY(y + 1), w: PB.w - 2, h: PB.h - 2, sx, sy, clip: CLIP && CLIP.slice() });
    if (o.ring) { const on = Math.floor(t * 6) & 1; for (let k = 0; k < PB.w + 4; k++) if (((k >> 1) + on) & 1) { px(x - 2 + k, y - 2, P.gold); px(x - 2 + k, y + PB.h + 1, P.gold); } for (let k = 0; k < PB.h + 4; k++) if (((k >> 1) + on) & 1) { px(x - 2, y - 2 + k, P.gold); px(x + PB.w + 1, y - 2 + k, P.gold); } }
    if (o.left != null) { const w = PB.w; rrI(x, y + PB.h + 3, w, 3, 1, P.s1); rrI(x, y + PB.h + 3, Math.max(1, Math.round(w * o.left / 60)), 3, 1, P.gold); tx('open', x + w + 5, y + PB.h - 15, P.gold); tx(Math.ceil(o.left) + ' s', x + w + 5, y + PB.h - 7, P.gold); }
    return;
  }
  bubble(m[1], m[0], y + 3, m[0] === 'l' && !/^[A-Z][a-z]+: /.test(m[1]) ? HER : {});
}
// lay the thread out bottom up from item `end`; a bubble that would be cut is left out. Returns the scroll thumb.
function herThread(items, y0, y1, end, t) {
  let y = y1; const placed = [];
  for (let k = end; k >= 0; k--) { const h = itemH(items[k]); if (y - h < y0) break; y -= h; placed.push([items[k], y]); }
  const c0 = CLIP; CLIP = [PHX(0), PHY(y0), PHX(PH.sw), PHY(y1)];
  for (const [m, yy] of placed) drawItem(m, yy, t);
  CLIP = c0;
  // the scroll bar: a thin track on the right edge, the thumb where you are (shown when you're not at the bottom)
  const total = items.reduce((a, m) => a + itemH(m), 0), below = items.slice(end + 1).reduce((a, m) => a + itemH(m), 0), view = y1 - y0;
  if (end < items.length - 1) {
    const th = Math.max(8, Math.round(view * view / total)), ty = y1 - th - Math.round((view - th) * below / Math.max(1, total - view));
    rrI(PH.sw - 3, y0 + 2, 1, view - 4, 0, P.s1); rrI(PH.sw - 4, Math.max(y0 + 2, ty), 2, th, 1, P.s4);
  }
}
function herChat(t, o = {}) {
  const y0 = chatHead('Babe', 'babe', null, null, 'Messages', '00:44');
  const items = o.items || HER_THREAD, end = o.end ?? items.length - 1;
  herThread(items, y0 + 2, 198, end, t);
  if (end < items.length - 1) {   // scrolled back: the way down to the newest
    rrI(PH.sw - 24, 186, 15, 10, 5, P.s2); gl(['x...x', '.x.x.', '..x..'], PH.sw - 19, 189, P.moon);
  }
  pill('Text her', 203); tx('3 s, hands busy', 56, 223, P.s4, { align: 'c' });
  homeBar();
}
PHONE_SCREENS.chat = (t, o) => herChat(t, o);
PHONE_SCREENS.messages = PHONE_SCREENS.chat;   // Messages is her chat now
PHONE_SCREENS.chatold = (t, o) => herChat(t, { end: 6, ...o });
PHONE_SCREENS.photonew = (t, o) => herChat(t, { items: [...HER_THREAD.slice(0, -2), ['photo', 'jersey', { left: 52 - (t % 40) * 0.5 }], ['l', 'stole your jersey']], ...o });
PHONE_SCREENS.photo = (t, o) => herChat(t, { items: [...HER_THREAD.slice(0, -2), ['photo', 'jersey', { ring: true }], ['l', 'stole your jersey']], ...o });

// Messages, the app (decided 2026-11-20, Paweł): the contacts; tap one to see their chat. A minigame opens its chat
// straight away (her text, The Boys' text); the back chevron in a chat comes here. Her chat is kept for good; The
// Boys' chat shows the last minigame's exchange, with Raid night? at the bottom.
const MSG_ROWS = [
  { who: 'Babe', av: 'babe', last: 'stole your jersey', time: '00:41', unread: 1, her: true },
  { who: 'The Boys (3)', av: 'boys', last: "Mike: fine, raid's on without you", time: '23:06' },
];
function msgList(t, o = {}) {
  flatBg(40); statusBar({ time: '00:44' });
  tx('Messages', 8, 22, P.moon, { f: 'tinyL' });
  MSG_ROWS.forEach((r, k) => {
    const y = 46 + k * 34;
    if (o.tap === k && (t % 2) > 0.9) rrI(3, y - 2, PH.sw - 6, 32, 6, P.s1);
    avatar(r.av, 18, y + 13, 10);
    if (r.her) tx('Babe ♥', 33, y + 4, P.d6); else tx(r.who, 33, y + 4, P.moon);
    tx(r.time, PH.sw - 7, y + 4, r.unread ? P.d6 : P.s4, { align: 'r' });
    tx(fitT(r.last, PH.sw - 52), 33, y + 14, r.unread ? P.moon : P.s5);
    if (r.unread) { disc(PH.sw - 12, y + 18, 4.5, P.d6); tx(String(r.unread), PH.sw - 12, y + 16, P.void, { align: 'c' }); }
    rrI(33, y + 29, PH.sw - 33, 1, 0, P.s1);
    if (o.tap === k) { const on = Math.floor(t * 6) & 1; for (let i = 0; i < PH.sw - 4; i++) if (((i >> 1) + on) & 1) { px(2 + i, y - 3, P.gold); px(2 + i, y + 30, P.gold); } for (let j = 0; j < 34; j++) if (((j >> 1) + on) & 1) { px(2, y - 3 + j, P.gold); px(PH.sw - 3, y - 3 + j, P.gold); } }
  });
  tx('Tap a chat to open it.', 56, 120, P.s4, { align: 'c' });
  homeBar();
}
PHONE_SCREENS.msglist = (t, o) => msgList(t, { tap: 0, ...o });
// The Boys' chat: the last minigame's exchange (their text and your answer), read-only, and Raid night? to start one
const BOYS_THREAD = [
  ['date', 'Today 22:58'], ['l', 'Danny: raid at 11?'], ['l', 'Danny: BRO. Raid. Now. Bring snacks.'], ['l', 'Kuba: danny is in'],
  ['r', "Shh, she's next door. Text only, love you guys."], ['l', "Mike: fine, raid's on without you"], ['l', 'Danny: whipped'],
];
PHONE_SCREENS.boyschat = (t, o) => {
  const y0 = chatHead('The Boys (3)', 'boys', null, null, 'Danny, Mike, Kuba', '00:44');
  herThread(BOYS_THREAD, y0 + 2, 198, BOYS_THREAD.length - 1, t);
  pill('Raid night?', 203, { fill: P.s2, ink: P.s5, shadow: P.s1 }); gl(['.xxx.', 'x...x', 'xxxxx', 'xx.xx', 'xxxxx'], 20, 207, P.s5);
  tx('Needs Goodwill 40: 31 now', 56, 223, P.s4, { align: 'c' });
  homeBar();
};
// 20:00, every night (week one, section 2b): Danny's voice message in The Boys' chat, the handoff's "Magoo's voicemail"
// (Magoo is Danny's character). The phone rises into your hand while the night waits: his voice note plays (the
// waveform fills gold, a timer), its transcript comes in under it line by line as he says it, and Got it puts the phone
// down and starts the night. It stays in The Boys' chat until the next minigame, so you can read it again.
const VOICE_NOTES = {
  mon: ['yo its raid night. she thinks youre doing spreadsheets lol', 'steps in the hall = tab to excel. BEFORE the door opens', "q4 pays real money btw. the shop's on your phone"],
  tue: ["garrote's in the party tonight", "hold your door open longer: you lean in and see what she's doing", "she can see you too tho. don't get weird"],
  replay: ['F. she pulled the plug', "tuesday again then. the good loot's still in your bag", 'tab out BEFORE she opens the door this time'],
};
const VOICE_AT = [0, 4.5, 9.5], VOICE_LEN = 14;
PHONE_SCREENS.voicenote = (t, o) => {
  const lines = VOICE_NOTES[o.night || 'mon'], tt = t % (VOICE_LEN + 4), p = Math.min(1, tt / VOICE_LEN);
  const y0 = chatHead('The Boys (3)', 'boys', null, null, 'Danny, Mike, Kuba', '20:00');
  let y = y0 + 3;
  drawItem(['date', o.night === 'replay' ? 'Tuesday, again' : 'Today 20:00'], y, t); y += 14;
  // the voice note: who and how long, a play disc, a waveform that fills gold as it plays
  const x = 7, w = 98, h = 25;
  rrI(x, y, w, h, 4, P.s2); px(x - 1, y + h - 1, P.s2); px(x, y + h - 1, P.s2);
  tx('Danny', x + 5, y + 3, P.s5); tx('0:' + String(Math.floor(p * VOICE_LEN)).padStart(2, '0') + ' / 0:' + VOICE_LEN, x + w - 5, y + 3, p < 1 ? P.gold : P.s5, { align: 'r' });
  disc(x + 9, y + 17, 5, P.moon);
  if (p < 1) { rrI(x + 7, y + 14, 1, 5, 0, P.s1); rrI(x + 10, y + 14, 1, 5, 0, P.s1); }   // pause while it plays
  else for (let i = 0; i < 4; i++) rrI(x + 7 + i, y + 14 + i, 1, 7 - 2 * i, 0, P.s1);   // played: the play triangle
  const bars = 22, bx = x + 18;
  for (let k = 0; k < bars; k++) {
    const hh = 2 + Math.round(6 * Math.abs(Math.sin(k * 1.7 + 0.6) * Math.cos(k * 0.45))), on = k / bars < p;
    rrI(bx + k * 3, y + 17 - (hh >> 1), 2, hh, 0, on ? P.gold : P.s4);
  }
  y += h + 2;
  // the transcript, under it, a line at a time as he says it
  const said = VOICE_AT.filter((a) => tt >= a).length, rows = [];
  lines.slice(0, said).forEach((l, k) => { if (k) rows.push(null); wrapT(l, w - 10).forEach((r) => rows.push(r)); });
  if (rows.length) {
    const hh = rows.length * 8 - rows.filter((r) => r === null).length * 4 + 6;
    rrI(x, y, w, hh, 4, P.s1);
    let yy = y + 3; for (const r of rows) { if (r === null) { yy += 4; continue; } tx(r, x + 5, yy, P.u6); yy += 8; }
  }
  pill('Got it', 203); tx('the night starts', 56, 223, P.s4, { align: 'c' });
  homeBar();
};
// paint the photo crops the screen asked for onto the composed phone, in her colours
function paintPhotos(g) {
  for (const s of PH_PHOTOS) {
    const S = selfie(s.key), img = g.getImageData(s.x, s.y, s.w, s.h), D = img.data, r = 3;
    for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
      const X = s.x + i, Y = s.y + j;
      if (s.clip && (X < s.clip[0] || Y < s.clip[1] || X >= s.clip[2] || Y >= s.clip[3])) continue;
      const cx = i < r ? r - i - 0.5 : i >= s.w - r ? i - (s.w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= s.h - r ? j - (s.h - r) + 0.5 : 0;
      if (cx && cy && cx * cx + cy * cy > r * r) continue;
      const k = ((s.sy + j) * SELFIE_W + s.sx + i) * 4, o = (j * s.w + i) * 4;
      D[o] = S.img.data[k]; D[o + 1] = S.img.data[k + 1]; D[o + 2] = S.img.data[k + 2];
    }
    g.putImageData(img, s.x, s.y);
  }
}
// the photo opened: a normal window beside the phone, the whole photo at its own pixel size, her name and the time on
// its bar, the close box (or Esc, or a click outside). The first time: Goodwill +5 (fan-service step 5).
function photoWindow(ctx, key, t, o = {}) {
  const w = SELFIE_W + 12, h = SELFIE_H + 22, x = o.x ?? 356, y = o.y ?? 50;
  let L = smLayer(640, 360, () => {
    shadowFlatSm(x + 2, y + 3, w, h);
    smGlass(x, y, w, h);
    text('Babe', x + 6, y + 4, 'tiny', P.d6);
    const hx = x + 6 + measure('Babe', 'tiny') + 3; for (const [a, b] of [[0, 1], [1, 0], [2, 1], [3, 0], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [2, 4]]) putI(hx + a, y + 4 + b, P.d6);
    text(o.time || '00:41', x + w - 18, y + 4, 'tiny', P.s5, { align: 'r' });
    smClose(x + w - 13, y + 2);
    rectI(x + 5, y + 15, SELFIE_W + 2, SELFIE_H + 2, P.s2);
  });
  ctx.drawImage(L, 0, 0);
  ctx.drawImage(selfie(key).canvas, x + 6, y + 16);
  if (o.first) {   // the first look: a moss chip rises over the photo's bottom and fades
    const k = (t % 3) / 3, cy = y + h - 30 - Math.round(easeOut(Math.min(1, k * 2)) * 8);
    if (k < 0.85) { L = smLayer(640, 360, () => { const lab = 'Goodwill +5', lw = measure(lab, 'tiny') + 10, cx = x + Math.round(w / 2 - lw / 2); rectI(cx, cy, lw, 11, P.s1); frameI(cx, cy, lw, 11, P.g5); text(lab, cx + 5, cy + 3, 'tiny', P.g5); }); ctx.drawImage(L, 0, 0); }
  }
}

// ---------------------------------------------------------------- the live phone (V8, #73): the game's screens
// The page's screens above are fixed demos; these read a view model from the game (src/render/phoneView.ts) and
// leave hit regions (in the phone canvas's pixels) for the game's clicks. Same kit, same rules (#45: no bubble cut).
let PH_HITS = [];
const hit = (x, y, w, h, act, arg = '') => PH_HITS.push({ x: PHX(x), y: PHY(y), w, h, act, arg: String(arg) });
const tapRing = (x, y, w, h, t) => { const on = Math.floor(t * 6) & 1; for (let k = 0; k < w; k++) if (((k >> 1) + on) & 1) { px(x + k, y, P.gold); px(x + k, y + h - 1, P.gold); } for (let k = 0; k < h; k++) if (((k >> 1) + on) & 1) { px(x, y + k, P.gold); px(x + w - 1, y + k, P.gold); } };
const backHit = (act, arg = '') => hit(0, 16, 18, 16, act, arg);
const homeHit = (act, arg = '') => hit(30, PH.sh - 12, 52, 12, act, arg);
function loudStrip(y) { rrI(8, y + 1, PH.sw - 16, 13, 5, P.wine); gl(PG.spk, 30, y + 4, P.moon); tx('She can hear it', 62, y + 4, P.moon, { align: 'c' }); return 16; }
// a reply you can tap, or a dim one with a lock and why not
function action(a, y, t) {
  if (!a) return;
  if (a.ok) { const h = pill(a.label, y); hit(8, y, PH.sw - 16, h - 2, a.act, a.arg); if (a.sub) tx(a.sub, 56, y + h + 1, P.s4, { align: 'c' }); return; }
  pill(a.label, y, { fill: P.s2, ink: P.s5, shadow: P.s1 }); gl(PG.lock, 20, y + 4, P.s5);
  tx(fitT(a.why || '', PH.sw - 12), 56, y + 20, P.s4, { align: 'c' });
}
const LIVE = {
  // an incoming call: the caller's wallpaper, Speaker (hands free, she hears it), slide to answer, Decline
  ring(t, v) {
    const C = CALLERS[v.who] || CALLERS.mom;
    wall(C.mat, C.v[0], C.v[1], { glow: (i, j) => 0.12 * Math.max(0, 1 - Math.hypot(i - 56, j - 64) / 60) });
    statusBar({ time: v.time });
    rrI(PH.sw - 30, 15, 22, 9, 4, P.gold); tx(Math.ceil(v.left) + ' s', PH.sw - 19, 17, P.void, { align: 'c' });
    const pr = 22 + ((t * 1.2) % 1) * 6; for (let a = 0; a < 64; a++) { const an = (a / 64) * 6.283; if (a % 2) px(Math.round(56 + Math.cos(an) * pr), Math.round(62 + Math.sin(an) * pr), P.s4); }
    avatar(C.av, 56, 62, 20);
    tx(C.name, 56, 92, P.moon, { align: 'c', f: 'tinyL' });
    tx(C.sub, 56, 111, P.s5, { align: 'c' });
    disc(56, 140, 10, P.s3); disc(56, 139, 10, P.s2); gl(PG.spk, 54, 135, P.moon); tx('Speaker', 56, 153, P.s5, { align: 'c' });
    tx('hands free, loud', 56, 161, P.s4, { align: 'c' });
    hit(42, 127, 28, 42, 'speaker');
    rrI(8, 172, PH.sw - 16, 22, 11, P.s1);
    const kx = 19 + Math.round((v.drag || 0) * (PH.sw - 38)) + (v.drag ? 0 : Math.max(0, Math.sin(t * 2.4) * 3)); disc(kx, 183, 9, P.g5); gl(PG.phone, kx - 2, 181, P.moon);
    const sw = (t * 40) % 110, msg = 'slide to answer', mx = 62 - measure(msg, 'tiny') / 2;
    tx(msg, 62, 180, P.s4, { align: 'c' });
    const g = glyphs(msg, 'tiny'); for (let k = 0; k < g.pts.length; k += 2) { const gx = g.pts[k] + Math.round(mx); if (Math.abs(gx - sw) < 6) px(gx, g.pts[k + 1] + 180, P.moon); }
    hit(8, 172, PH.sw - 16, 22, 'slide');
    disc(56, 214, 11, P.crimson); gl(PG.hang, 54, 213, P.moon); tx('Decline', 56, 227, P.s5, { align: 'c' });
    hit(42, 202, 28, 32, 'closeGame');
  },
  // texts wait on the lock screen (silently): the two newest banners, Face ID to read them, Put down
  lock(t, v) {
    lockWall(); statusBar({ time: v.time });
    tx(v.date, 56, 22, P.d6, { align: 'c' });
    bigTime(v.time, 56, 32, P.moon);
    let y = 62; v.banners.slice(-2).reverse().forEach((b) => { y += banner(b, y) + 3; });
    if (v.banners.length > 2) { tx('+' + (v.banners.length - 2) + ' more from ' + v.banners[0].who, 56, y, P.d6, { align: 'c' }); }
    const hold = v.hold, cx = 56, cy = 196;
    for (let a = 0; a < 96; a++) { const an = (a / 96) * 6.283 - 1.571, on = a / 96 < hold; px(Math.round(cx + Math.cos(an) * 15), Math.round(cy + Math.sin(an) * 15), on ? P.g5 : a % 3 ? P.s4 : -1); if (on) px(Math.round(cx + Math.cos(an) * 14), Math.round(cy + Math.sin(an) * 14), P.g5); }
    faceGlyph(cx, cy, hold >= 1 ? P.g5 : P.moon);
    tx(hold > 0 && hold < 1 ? 'keep holding' : 'Face ID: hold to unlock', 56, 214, P.s5, { align: 'c' });
    hit(36, 176, 40, 40, 'faceHold');
    rrI(36, 224, 40, 9, 4, P.s2); tx('Put down', 56, 226, P.moon, { align: 'c' }); hit(34, 222, 44, 13, 'closeGame');
  },
  // the boss's chat: his texts, one row of sums, three gold totals
  boss(t, v) {
    const y0 = chatHead('Boss', 'boss', v.left, v.total, 'Work · deck due 9:00', v.time); backHit('closeGame');
    thread(v.msgs.map((m) => ['l', m]), y0, 144);
    rrI(8, 148, PH.sw - 16, 24, 5, P.s1); tx('sum ' + (v.row + 1) + ' of ' + v.rows, 14, 152, P.s5); tx(v.a + ' + ' + v.b + ' = ?', 56, 161, P.moon, { align: 'c', f: 'tinyL' });
    v.options.forEach((a, k) => { const x = 8 + k * 33; rrI(x, 181, 30, 15, 5, P.wine); rrI(x, 180, 30, 15, 5, P.gold); tx(String(a), x + 15, 184, P.void, { align: 'c' }); hit(x, 180, 30, 16, 'boss', a); });
    tx(v.feedback || 'tap the total', 56, 204, v.feedback ? P.crimson : P.s5, { align: 'c' });
    homeBar(); homeHit('closeGame');
  },
  // her text opens her chat straight away: the thread kept for good, her new ones, the one reply
  her(t, v) {
    const y0 = chatHead('Babe', 'babe', v.left, v.total, 'Messages', v.time); backHit('closeGame');
    herThread(v.items, y0 + 2, 192, v.items.length - 1, t);
    const h = pill('Five more minutes, love ♥', 196); hit(8, 196, PH.sw - 16, h - 2, 'textReply');
    homeBar(); homeHit('closeGame');
  },
  // Mom talks: her line, the beat (tap the reply while the marker is in the zone), the misses, End
  mom(t, v) {
    callHead('mom', 'on call · line ' + (v.beat + 1) + ' of ' + v.beats + (v.speaker ? ' · speaker' : ''), t, { time: v.time });
    const bh = bubble(v.line, 'l', 48, { maxW: 96 });
    const bx = 8, bw = PH.sw - 16, y = Math.max(76, 48 + bh + 8), mx = bx + Math.round(v.sweep * (bw - 1)), zw = Math.round(bw * v.zoneW), zx = bx + Math.round(v.zone * bw);
    rrI(bx, y, bw, 9, 4, P.s1); rrI(zx, y + 1, zw, 7, 3, P.g3); rrI(zx, y + 1, zw, 1, 0, P.g5);
    if (!v.reading) rrI(mx, y - 2, 2, 13, 0, P.moon);
    tx(v.reading ? 'she is talking...' : 'tap the reply in the zone', 56, y + 13, P.s5, { align: 'c' });
    let py = y + 28;
    ['mhm', 'really?!', 'wow'].forEach((r, k) => { const h = pill(r, py, { glyph: ['…', '?', '!'][k] }); hit(8, py, PH.sw - 16, h - 2, 'mom', k); py += h; });
    if (v.feedback) tx(fitT(v.feedback, PH.sw - 10), 56, py + 1, v.bad ? P.crimson : P.g5, { align: 'c' });
    if (v.loud) loudStrip(py + 9);
    missRow(v.misses, v.max); endCall(); hit(44, 208, 24, 24, 'closeGame');
  },
  // the courier and the boys: their line, the time, the goal, three replies, End (the boys count misses)
  talk(t, v) {
    callHead(v.who, v.speaker ? 'on speaker' : 'on call', t, { time: v.time });
    const bh = bubble(v.line, 'l', 48, { maxW: 100 });
    const y = 48 + bh + 8;
    timerBar(y, v.left, v.total);
    tx(v.goal, 56, y + 9, P.u6, { align: 'c' }); if (v.goal2) tx(v.goal2, 56, y + 17, P.s4, { align: 'c' });
    let py = y + (v.goal2 ? 30 : 22);
    v.opts.forEach((o, k) => { const h = pill(o, py); hit(8, py, PH.sw - 16, h - 2, 'talk', k); py += h; });
    if (v.feedback) { tx(fitT(v.feedback, PH.sw - 10), 56, py + 1, P.crimson, { align: 'c' }); py += 10; }
    if (v.loud) loudStrip(py);
    if (v.max) missRow(v.misses, v.max);
    endCall(); hit(44, 208, 24, 24, 'closeGame');
  },
  // the idle phone, picked up: the clock, the apps (Messages now; the Shop and Home come with their steps)
  home(t, v) {
    lockWall();
    for (let j = 0; j < PH.sh; j++) for (let i = 0; i < PH.sw; i++) if ((i + j) % 2 === 0 && j < 196) px(i, j, P.void);
    statusBar({ time: v.time });
    tx(v.date, 56, 22, P.d6, { align: 'c' }); bigTime(v.time, 56, 32, P.moon);
    appIcon('messages', 8, 72, P.g4, P.moon, 'Messages', { hi: P.g5 }); hit(6, 70, 32, 44, 'phApp', 'messages');
    if (v.unread) { disc(35, 73, 4.5, P.d6); tx(String(v.unread), 35, 71, P.void, { align: 'c' }); }
    appIcon('shop', 42, 72, P.copper, P.pale, 'Shop', { hi: P.gold }); hit(40, 70, 32, 44, 'phApp', 'shop');   // step 4.6 (#55)
    tx('Put the phone down:', 56, 206, P.s4, { align: 'c' }); tx('the home bar', 56, 214, P.s4, { align: 'c' });
    homeBar(P.s5); homeHit('preMenu');
  },
  // the Shop (step 4.6, #55): For you and For her, the wallet, a price pill to tap (gold when you can buy it now), or
  // what you already have; the row flashes moss when bought. v: { tab, wallet, items [{ id, g, name, zl, fx, state }], flash }
  shop(t, v) {
    flatBg(46); statusBar({ time: v.time });
    gl(PG.back, 7, 18, P.gold); tx('Shop', 14, 15, P.moon, { f: 'tinyL' }); backHit('phApp', 'home');
    zlP(String(v.wallet), PH.sw - 6, 19, P.g5, 'r');
    rrI(6, 33, PH.sw - 12, 11, 5, P.s2);
    const TABS = [['you', 'For you', P.s4], ['her', 'For her', P.d4]], hw = (PH.sw - 14) / 2;
    TABS.forEach(([id, lab, fill], k) => { const on = id === v.tab; if (on) rrI(Math.round(7 + k * hw), 34, Math.round(hw), 9, 4, fill); tx(lab, Math.round(7 + hw * (k + 0.5)), 36, on ? P.moon : P.s5, { align: 'c' }); hit(Math.round(7 + k * hw), 32, Math.round(hw), 13, 'shopTab', id); });
    const col = (g) => (SHOP.you.concat(SHOP.her).find((it) => it.g === g) || { c: [P.s3, P.moon] }).c;
    v.items.forEach((it, k) => {
      const y = 50 + k * 30, c = col(it.g);
      if (k) rrI(26, y - 2, PH.sw - 30, 1, 0, P.s1);
      if (v.flash === it.id) rrI(3, y - 1, PH.sw - 6, 28, 4, P.g2);
      rrI(5, y + 1, 17, 17, 4, P.void); rrI(5, y, 17, 17, 4, c[0]); gl(ITEM_G[it.g], 9, y + 4, c[1]);
      tx(it.name, 26, y + 2, it.state === 'soon' ? P.s4 : v.tab === 'her' ? P.d6 : P.moon);
      wrapT(it.fx, PH.sw - 30).slice(0, 2).forEach((ln, j) => tx(ln, 26, y + 11 + j * 8, P.s5));
      const pw = 30, pxx = PH.sw - pw - 4, py = y + 1, st = it.state;
      if (st === 'buy') { rrI(pxx, py + 1, pw, 9, 4, P.copper); rrI(pxx, py, pw, 9, 4, P.gold); zlP(String(it.zl), pxx + pw / 2, py + 2, P.void, 'c'); hit(pxx - 2, py - 2, pw + 4, 13, 'shopBuy', it.id); }
      else if (st === 'dear') { rrI(pxx, py, pw, 9, 4, P.s2); zlP(String(it.zl), pxx + pw / 2, py + 2, P.s4, 'c'); }
      else if (st === 'soon') { rrI(pxx, py, pw, 9, 4, P.s1); tx('soon', pxx + pw / 2, py + 2, P.s4, { align: 'c' }); }
      else { const s2 = st === 'owned' ? 'owned' : st === 'full' ? 'full' : 'tonight', w2 = measure(s2, 'tiny') + 6; rrI(PH.sw - w2 - 4, py, w2, 9, 4, st === 'full' ? P.s2 : P.g3); tx(s2, PH.sw - 4 - w2 / 2, py + 2, st === 'full' ? P.s5 : P.g6, { align: 'c' }); }
    });
    if (v.tab === 'her') tx('More for her soon.', 56, 50 + v.items.length * 30 + 4, P.s4, { align: 'c' });
    homeBar(); homeHit('preMenu');
  },
  // Messages: her chat and The Boys'
  messages(t, v) {
    flatBg(40); statusBar({ time: v.time }); gl(PG.back, 6, 22, P.moon); backHit('phApp', 'home');
    tx('Messages', 14, 22, P.moon, { f: 'tinyL' });
    v.rows.forEach((r, k) => {
      const y = 46 + k * 34;
      avatar(r.av, 18, y + 13, 10);
      if (r.her) tx('Babe ♥', 33, y + 4, P.d6); else tx(r.who, 33, y + 4, P.moon);
      tx(r.time, PH.sw - 7, y + 4, r.unread ? P.d6 : P.s4, { align: 'r' });
      tx(fitT(r.last, PH.sw - 52), 33, y + 14, r.unread ? P.moon : P.s5);
      if (r.unread) { disc(PH.sw - 12, y + 18, 4.5, P.d6); tx(String(r.unread), PH.sw - 12, y + 16, P.void, { align: 'c' }); }
      rrI(33, y + 29, PH.sw - 33, 1, 0, P.s1);
      hit(2, y - 3, PH.sw - 4, 33, 'phApp', r.id);
    });
    tx('Tap a chat to open it.', 56, 120, P.s4, { align: 'c' });
    homeBar(); homeHit('preMenu');
  },
  // her chat, kept for good: scroll a bubble at a time (wheel), back to the newest, Text her
  babe(t, v) {
    const y0 = chatHead('Babe', 'babe', null, null, 'Messages', v.time); backHit('phApp', 'messages');
    const end = Math.max(0, v.items.length - 1 - v.scroll);
    if (v.items.length) herThread(v.items, y0 + 2, 198, end, t); else tx('No messages yet.', 56, 120, P.s4, { align: 'c' });
    if (end < v.items.length - 1) { rrI(PH.sw - 24, 186, 15, 10, 5, P.s2); gl(['x...x', '.x.x.', '..x..'], PH.sw - 19, 189, P.moon); hit(PH.sw - 26, 184, 19, 14, 'phScroll', 'end'); }
    action(v.action, 203, t);
    homeBar(); homeHit('preMenu');
  },
  // The Boys' chat: the last call's exchange; Raid night? at the bottom
  boys(t, v) {
    const y0 = chatHead('The Boys (3)', 'boys', null, null, 'Danny, Mike, Kuba', v.time); backHit('phApp', 'messages');
    if (v.items.length) herThread(v.items, y0 + 2, 198, v.items.length - 1, t); else tx('No messages yet.', 56, 120, P.s4, { align: 'c' });
    action(v.action, 203, t);
    homeBar(); homeHit('preMenu');
  },
  // sending: the message types itself (hands busy), then Delivered and the phone goes down
  texting(t, v) {
    const y0 = chatHead(v.who === 'boys' ? 'The Boys (3)' : 'Babe', v.who === 'boys' ? 'boys' : 'babe', null, null, 'Messages', v.time); backHit('preCancel');
    const n = Math.min(v.msg.length, Math.floor(v.k * 1.3 * v.msg.length)), sent = v.k * 1.3 >= 1;
    const items = sent ? [...v.items, ['r', v.msg]] : v.items;
    if (items.length) herThread(items, y0 + 2, sent ? 136 : 144, items.length - 1, t);
    if (sent) tx('Delivered', PH.sw - 8, 138, P.s5, { align: 'r' });
    rrI(6, 150, PH.sw - 12, 14, 6, P.s2); rrI(7, 151, PH.sw - 14, 12, 5, P.s1);
    if (!sent) { const w = tx(v.msg.slice(Math.max(0, n - 18), n).replace(' ♥', ''), 11, 154, P.moon); if (Math.floor(t * 3) % 2) rrI(12 + (w || 0), 153, 1, 7, 0, P.gold); }
    else tx('Message', 11, 154, P.s4);
    const key = sent ? null : v.msg[n] && v.msg[n] !== ' ' ? v.msg[n] : null;
    KB_ROWS.forEach((row, r) => { const kw = 9, x0 = 4 + r * 5; [...row].forEach((c, i) => { const x = x0 + i * 10, y = 170 + r * 14, on = c === key; rrI(x, y + 1, kw, 11, 2, P.void); rrI(x, y, kw, 11, 2, on ? P.s5 : P.s3); tx(c, x + 5, y + 3, on ? P.void : P.moon, { align: 'c' }); }); });
    rrI(24, 212, 64, 11, 3, v.msg[n] === ' ' && !sent ? P.s5 : P.s3); tx('space', 56, 215, P.s1, { align: 'c' });
    tx(sent ? 'sent. back to the game' : 'typing: hands busy', 56, 229, sent ? P.g5 : P.s4, { align: 'c' });
  },
};
PHONE_SCREENS.live = (t, o) => (LIVE[o.v.screen] || LIVE.home)(t, o.v);
/** The phone in your hand from the game's view model: its canvas (126 x 252) and the hit regions in its pixels. */
function livePhone(v, t) {
  PH_HITS = [];
  const c = drawPhoneHand('live', t, { v });
  return { canvas: c, hits: PH_HITS };
}
return { PH, HAND, DT, PHONE_SCREENS, drawPhoneHand, drawPhoneOver, deskScreen, CALLERS, avatarAt, glyphAt, fitT, photoWindow, selfie, SELFIE_W, SELFIE_H, vPaint, arcCut, livePhone };
})();
const { PH, PHONE_SCREENS, drawPhoneHand, drawPhoneOver, livePhone } = PHONEOS;
// where the phone in your hand sits on the right screen (its body's top-left): over the heroes' side of the battle
// area, its bottom running off the frame
const PHONE_AT = [12, 112];
