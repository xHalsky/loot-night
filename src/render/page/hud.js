// ===========================================================================
// HUD on the 640x360 grid. Battle area 334x232 (band 64 · picture 142 · bar 26)
// and side panel 140x232. Data in, palette indices out.
// ===========================================================================
const BAND = 64, PIC_Y = 64, BAR_Y = 206, BAR_H = 26;
// names and classes: the game's table (data/heroes.ts) overwrites these at start (facade heroNames; cast of 2026-11-27)
const HEROES = [
  { id: 'knight', name: 'Dutch', short: 'Dutch', cls: 'Knight', lv: 5, pow: 44, keys: ['1', '2', '3', '4'], skills: ['taunt', 'cleave', 'shield'] },
  { id: 'rogue', name: 'Hixx', short: 'Hixx', cls: 'Rogue', lv: 5, pow: 38, keys: ['Z', 'X', 'C', 'V'], skills: ['backstab', 'smoke', 'pickpocket'] },
  { id: 'mage', name: 'Hudzor', short: 'Hudzor', cls: 'Mage', lv: 5, pow: 31, keys: ['Q', 'W', 'E', 'R'], skills: ['hellfire', 'frost', 'soul'] },
  { id: 'priest', name: 'Arkbishop', short: 'Arkbishop', cls: 'Priest', lv: 5, pow: 12, keys: ['A', 'S', 'D', 'F'], skills: ['mend', 'ward', 'judge'] },
];
// three slots per hero: two skills and the ultimate (the third key: 3, C, E, D). Icons are placeholders (Paweł's art)
const SKILL_NAME = { taunt: 'Taunt', cleave: 'Bash', shield: 'Last Stand', backstab: 'Backstab', smoke: 'Smoke Bomb', pickpocket: 'Heist', hellfire: 'Fire', frost: 'Frost', soul: 'Cataclysm', mend: 'Mend', ward: 'Ward', judge: 'Miracle' };

// ---------------------------------------------------------------- corner overlay + portal + buffs
function cornerOverlay(st, t) {
  smokeU(0, 0, 104, 36, 0.66);
  const [a, ...rest] = st.where.split(' · ');
  text(a, 4, 4, 'tiny', P.u6, { shadow: P.void });
  text(rest.join(' · '), 4, 11, 'tiny', P.u5, { shadow: P.void });
  const glow = st.flowGlow;
  // Flow is yellow (its own UI-only colour, apart from gold and from Zone's cyan); on a step-up it flashes moon white
  const w = text('Flow x' + st.flow, 4, 19, glow ? 'silkb' : 'tiny', glow ? P.moon : P.flow, glow ? { outline: P.flow } : { shadow: P.void });
  flowBar(4 + w + 4, 20, 30, 4, st.flowBar, glow);
}
// the Flow bar: an engraved groove filled with flat yellow (palette-exact, no dither), a pale top row
function flowBar(x, y, w, h, f, glow) {
  groove(x, y, w, h, 0, M_STONE, [0.84, 0.66]);
  const n = Math.round((w - 2) * clamp(f));
  rectI(x + 1, y + 1, n, h - 2, glow ? P.moon : P.flow); rectI(x + 1, y + 1, n, 1, glow ? P.moon : P.flowHi);
}
// engraved groove with a liquid fill (bars)
function groove(x, y, w, h, f, mat, vv) {
  const n = Math.round((w - 2) * clamp(f));
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (j === y || i === x) { putU(i, j, 0.0, M_DUSK); continue; }
    if (j === y + h - 1 || i === x + w - 1) { putU(i, j, 0.36, M_UMBER); continue; }
    const r = (j - y - 1) / Math.max(1, h - 3);
    if (i - x - 1 < n) putU(i, j, lerp(vv[0], vv[1], r), mat); else putU(i, j, 0.06 + 0.04 * r, M_DUSK);
  }
}
// power: a 5px diamond + number
function power(x, y, v, idx, align) {
  const s = String(v), w = 6 + measure(s, 'tiny'), x0 = align === 'r' ? x - w : x;
  sprite(x0, y, ['..M..', '.MMu.', 'MMuuu', '.uuu.', '..u..'], { u: 'u4', M: idx === P.moon ? 'moon' : 'u6' });
  text(s, x0 + 6, y, 'tiny', idx, { shadow: P.void });
  return w;
}
// The Town portal plate: as wide as what it says ("bank 12 · 1240 g"), two lines with air between them. x is its
// left edge, or its right edge with o.right. Returns [x, w] for the hit region.
const PORTAL_H = 21;
// Palette-exact bands (no dither under the text, grid doc 2): the name on arcane, what it banks on deep dusk.
function portalPlate(x, y, label, on, o = {}) {
  const w = Math.max(56, Math.max(measure('Town portal', 'tiny'), measure(label, 'tiny')) + 14), X = o.right ? x - w : x, cx = X + (w >> 1);
  shadowU(X, y, w, PORTAL_H, { k: 0.55, r: 3, dx: 1, dy: 2 });
  rectI(X, y, w, PORTAL_H, P.void);
  rectI(X + 1, y + 1, w - 2, 10, on ? P.arcane : P.u2); rectI(X + 1, y + 1, w - 2, 1, on ? P.d5 : P.u3);
  rectI(X + 1, y + 11, w - 2, PORTAL_H - 12, on ? P.d2 : P.u1);
  text('Town portal', cx, y + 3, 'tiny', on ? P.moon : P.u4, { align: 'c', shadow: on ? P.void : undefined });
  text(label, cx, y + 13, 'tiny', on ? P.d6 : P.u4, { align: 'c' });
  return [X, w];
}
function portalButton(st) {
  const on = !st.inBattle;
  return portalPlate(4, 28, on ? (st.label || '15 min') : 'after battle', on);   // st.label: what it banks (the game, #52 1.4)
}
function buffs(list, t) {
  smokeU(W, 0, 30 + list.length * 16, 34, 0.6);
  let x = W - 4 - 13;
  for (const b of list) {
    shadowU(x, 3, 13, 13, { k: 0.5, r: 2, dx: 1, dy: 1 });
    wellU(x, 3, 13, 13, { v: 0.1 });
    frameI(x, 3, 13, 13, b.bad ? P.crimson : P.g5);
    if (b.picon) sprite(x + 1, 4, PICON[b.picon]); else icon(b.icon, x + 1, 4, { shadow: false });
    // a run blessing: the frame is dashed (lasts until the run ends, like the unbanked mark in the bag)
    if (b.run) for (let k = 0; k < 13; k++) if (k & 1) { putI(x + k, 3, P.g1); putI(x + k, 15, P.g1); putI(x, 3 + k, P.g1); putI(x + 12, 3 + k, P.g1); }
    if (b.flash) frameI(x - 1, 2, 15, 15, P.g6);
    if (b.sweep != null) { const n = Math.round(11 * b.sweep); for (let j = 0; j < n; j++) for (let i = 0; i < 11; i++) if ((i + j) & 1) putI(x + 1 + i, 4 + j, P.void); }
    text(b.label, x + 7, 18, 'tiny', b.bad ? P.crimson : P.u6, { align: 'c', outline: P.void });
    x -= 16;
  }
}

// ---------------------------------------------------------------- curio window (parchment card in the band)
function curioWindow(st, t) {
  const x = 84, y = 4, w = 188, h = 57;
  shadowU(x, y, w, h, { k: 0.72, r: 6, dx: 3, dy: 4 });
  parchU(x, y, w, h, { v: 0.84, burn: 0.34, torn: 1 });
  // curled bottom-right corner
  for (let k = 0; k < 6; k++) for (let j = 0; j <= k; j++) putU(x + w - 6 + k, y + h - 1 - j, k === j ? 0.1 : 0.62 + 0.05 * j, M_UMBER);
  text(st.title.toUpperCase(), x + 7, y + 6, 'silkb', P.u1, { ls: 1 });
  for (let i = x + 7; i < x + w - 23; i++) putU(i, y + 13, 0.36 + 0.08 * (GR(i, 3) - 0.5), M_UMBER);
  text(st.line, x + 7, y + 17, 'tiny', P.u2);
  st.choices.forEach((c, k) => {
    const bx = x + 7 + k * 89, by = y + 26, bw = 85, bh = 20, focus = c.focus, pressed = c.pressed;
    shadowU(bx, by, bw, bh, { k: 0.45, r: 2, dx: 1, dy: 2 });
    if (pressed) plateU(bx, by, bw, bh, { mat: M_LOOT, top: 0.82, bot: 0.7, hi: 0.98, lo: 0.55 });
    else plateU(bx, by, bw, bh, { top: 0.36, bot: 0.17, hi: focus ? 0.6 : 0.62, lo: 0.08 });
    if (focus) frameI(bx, by, bw, bh, P.gold);
    let lx = bx + 5;
    if (c.icon === 'coin') { spr(lx + 1, by + 5, COIN, { a: P.void, b: P.void, c: P.void }); spr(lx, by + 4, COIN, { a: P.wine, b: P.gold, c: P.pale }); lx += 8; }
    if (c.icon === 'skull') { spr(lx + 1, by + 5, SKULL, { a: P.void }); spr(lx, by + 4, SKULL, { a: P.crimson }); lx += 8; }
    for (const [s, idx] of c.label) lx += text(s, lx, by + 4, 'tiny', pressed ? P.void : idx, pressed ? {} : { shadow: P.void });
    let sx = bx + 5; for (const [s, idx] of c.cost) sx += text(s, sx, by + 12, 'tiny', pressed ? P.u2 : idx, pressed ? {} : { shadow: P.void });
    if (focus && !pressed && Math.floor(t * 3) % 2 === 0) spr(bx - 5, by + 7, ARROW, { a: P.gold });
  });
  groove(x + 7, y + 48, w - 14, 5, st.timer, st.timer < 0.3 ? M_DANGER : M_UMBER, st.timer < 0.3 ? [1, 0.8] : [0.62, 0.44]);
  closeX(x + w - 5, y - 4);
}

// ---------------------------------------------------------------- unit tags over the battle
function hpBar(cx, y, f, foe) {
  const crit = foe || f < 0.35;
  shadowU(cx - 11, y, 22, 4, { k: 0.5, r: 2, dx: 1, dy: 1 });
  groove(cx - 11, y, 22, 4, f, crit ? M_DANGER : M_MOSS, crit ? [1, 0.78] : [0.86, 0.64]);
}
function markTag(cx, y, label, idx) {
  const w = measure(label, 'tiny') + 6, x = Math.round(cx - w / 2);
  shadowU(x, y, w, 9, { k: 0.5, r: 2, dx: 1, dy: 1 });
  plateU(x, y, w, 9, { mat: M_DUSK, top: 0.2, bot: 0.1, hi: 0.36, lo: 0.04, square: true });
  rectI(x, y + 8, w, 1, idx);
  text(label, x + 3, y + 2, 'tiny', idx, { shadow: P.void });
}
// an enemy's cast: just its name (Tiny5, crimson, void outline) and a thin cast bar under it, as wide as the name
function windup(cx, y, label, f) {
  const w = Math.max(24, measure(label, 'tiny')), x = Math.round(cx - w / 2);
  text(label, Math.round(cx), y + 1, 'tiny', P.crimson, { align: 'c', shadow: P.void });
  rectI(x - 1, y + 8, w + 2, 4, P.void);
  rectI(x, y + 9, w, 2, P.d1);
  rectI(x, y + 9, Math.round(w * clamp(f)), 2, P.crimson);
}
function floater(s, cx, y, idx, big) { text(s, cx, y, big ? 'silkb' : 'tiny', idx, { align: 'c', outline: P.void }); }

// ---------------------------------------------------------------- skill bar
// soft halo on the leather around a slot (answer = crimson, combo = gold)
function haloU(x, y, w, h, mat, a) {
  for (let j = y - 3; j < y + h + 3; j++) for (let i = x - 3; i < x + w + 3; i++) {
    const ex = Math.max(x - i - 0.5, i + 0.5 - (x + w), 0), ey = Math.max(y - j - 0.5, j + 0.5 - (y + h), 0), d = Math.hypot(ex, ey);
    if (d <= 0 || d >= 3) continue; putU(i, j, a * (1 - d / 3), mat);
  }
}
// What a well shows (#123, Paweł: hard to see what can be used): colour only when the skill can go off now. Locked
// (not bought), or between fights a skill that needs an enemy: the picture in the stone ramp (Moonwell's iron greys)
// and dim, the key dark, no frame, no glow. On cooldown or charging: the picture in stone at full value under the
// sweep and its seconds. st.off: { [key]: 'locked' | 'idle' }.
const OFF_K = 0.5, CD_K = 0.85, LOCK = ['.555.', '5...5', '44444', '45v54', '44444'];   // the lock on a skill not bought yet
function greyU(x, y, w, h, k) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (i < 0 || j < 0 || i >= W || j >= H) continue;
    const p = j * W + i, idx = B.I[p];
    if (idx >= 0) putU(i, j, PAL_LAB[idx][0] * k, M_STONE);
    else if (B.A[p]) { B.M[p] = M_STONE; B.V[p] *= k; }
  }
}
function cdSweep(x, y, cd) {
  const n = Math.round(13 * cd.f);
  for (let j = 0; j < n; j++) for (let i = 0; i < 13; i++) if (((i + j) & 1) || j < n - 6) putI(x + 1 + i, y + 1 + j, P.void);
  if (cd.s !== '') text(String(cd.s), x + 8, y + 5, 'tiny', P.moon, { align: 'c', outline: P.void });
}
function skillSlot(x, y, sk, key, st, t, ult = false) {
  const w = 15, h = 18;
  if (ult) return ultSlot(x, y, sk, key, st, t);
  const off = st.off && st.off[key], cd = !off && st.cooldown && st.cooldown[key];
  const pulse = !off && st.answer === key ? 0.5 + 0.5 * Math.sin(t * 8) : 0, combo = !off && !cd && st.combo && st.combo.key === key;
  if (!off && st.answer === key) haloU(x, y, w, h, M_DANGER, 0.55 + 0.4 * pulse);
  if (combo) haloU(x, y, w, h, M_LOOT, 0.7);
  wellU(x, y, w, h, { v: off ? 0.08 : 0.14 });
  skillTile(x + 1, y + 1, 13, 16, SKILL_CLASS[sk]);
  sprite(x + 1, y + 1, SKILL_ICON[sk]);
  if (off) greyU(x + 1, y + 1, 13, 16, OFF_K);   // not now: grey and dim (#123)
  if (off === 'locked') sprite(x + 5, y + 4, LOCK);   // not bought: a lock
  else if (cd) { greyU(x + 1, y + 1, 13, 16, CD_K); cdSweep(x, y, cd); }   // not yet: grey under the sweep
  if (!off && st.answer === key && pulse > 0.5) frameI(x, y, w, h, P.crimson); else if (!off && st.answer === key) frameI(x, y, w, h, P.wine);
  if (combo) frameI(x, y, w, h, P.gold);
  rectI(x + 1, y + 13, 6, 5, P.void); text(key, x + 2, y + 13, 'tiny', off ? P.s2 : cd ? P.u4 : P.u6);
  // autocast bought (tree.js): a loop mark on a void tab in the other corner; moss when on, dim when switched off (right-click)
  const ac = st.autocast && st.autocast[key];
  if (ac != null) { rectI(x + 7, y + 13, 7, 5, P.void); sprite(x + 8, y + 13, ['.mmm.', 'm...m', 'm..mm', '.mm..'], { m: ac && !off ? 'g6' : 'u3' }); }
  if (st.queued === key) { putI(x + w - 3, y + 1, P.pale); putI(x + w - 2, y + 1, P.pale); putI(x + w - 2, y + 2, P.pale); }
  if (combo) { const s = st.combo.label, cw = measure(s, 'tiny') + 4; shadowU(x + w - cw + 2, y - 5, cw, 8, { k: 0.5, r: 2, dx: 1, dy: 1 }); rectI(x + w - cw + 2, y - 5, cw, 8, P.void); rectI(x + w - cw + 3, y - 4, cw - 2, 6, P.gold); rectI(x + w - cw + 3, y - 4, cw - 2, 1, P.pale); text(s, x + w - cw + 4, y - 4, 'tiny', P.void); }
}
// the ultimate, always the third slot. Ready: gilded (a gold frame with pale corner studs, a gem set into the rail
// above it on a little gold crest, its key on a gold tab) and a warm glow that breathes. Charging: the same in copper,
// the picture grey under the sweep. Locked (needs 6 nodes in the tree) or, between fights, one that needs an enemy:
// the whole slot, crest and tab included, in dim stone with a lock and how many nodes are still missing (#123: it stood
// out at the start, when it can't be used at all)
function ultSlot(x, y, sk, key, st, t) {
  const w = 15, h = 18, u = (st.ult && st.ult[key]) || 'ready', locked = typeof u === 'object' && u.need;
  const off = locked || (st.off && st.off[key]), cd = !off && st.cooldown && st.cooldown[key], ready = !off && !cd && u === 'ready';
  if (ready) haloU(x, y, w, h, M_LOOT, 0.42 + 0.22 * Math.sin(t * 2.6));
  wellU(x, y, w, h, { v: off ? 0.08 : 0.14 });
  skillTile(x + 1, y + 1, 13, 16, SKILL_CLASS[sk]);
  sprite(x + 1, y + 1, SKILL_ICON[sk]);
  if (off) greyU(x + 1, y + 1, 13, 16, OFF_K);
  else if (cd) { greyU(x + 1, y + 1, 13, 16, CD_K); cdSweep(x, y, cd); }
  const fc = off ? P.s2 : ready ? P.gold : P.copper, sc = off ? P.s3 : ready ? P.pale : P.gold, tc = off ? P.s3 : P.void;
  frameI(x - 1, y - 1, w + 2, h + 2, P.void); frameI(x, y, w, h, fc);
  for (const [cx, cy] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]) putI(cx, cy, sc);
  // the crest: a peak over the slot's top edge with a gem in it
  const mx = x + (w >> 1);
  rectI(mx - 3, y - 1, 7, 1, fc); rectI(mx - 2, y - 2, 5, 1, fc); rectI(mx - 1, y - 3, 3, 1, fc); putI(mx, y - 4, sc);
  putI(mx, y - 2, off ? P.s1 : P.crimson); putI(mx - 1, y - 1, P.void); putI(mx + 1, y - 1, P.void); putI(mx, y - 1, off ? P.s2 : P.moon);
  // its key on a tab
  rectI(x + 1, y + 12, 7, 6, fc); rectI(x + 1, y + 12, 7, 1, sc); text(key, x + 2, y + 13, 'tiny', tc);
  if (locked) { sprite(x + 5, y + 3, LOCK); text(String(u.need), x + w - 2, y + 12, 'tiny', P.s4, { align: 'r', outline: P.void }); }
}
function lockedSlot(x, y, key) {
  wellU(x, y, 11, 14, { v: 0.08 });
  sprite(x + 2, y + 2, ['..333..', '.3...3.', '.3...3.', '2222222', '2333332', '233v332', '2222222']);
  text(key, x + 3, y + 9, 'tiny', P.u3);
}
// carved pilaster between hero groups
function pilasterU(x, y0, y1) {
  for (let j = y0; j <= y1; j++) { putU(x - 1, j, 0.08); putU(x, j, 0.7 + 0.08 * (GR(x, j) - 0.5)); putU(x + 1, j, 0.32); putU(x + 2, j, 0.04); }
  bossU(x - 2, y0 - 2, 5); bossU(x - 2, y1 - 2, 5); bossU(x - 1, ((y0 + y1) >> 1) - 1, 4);
}
let BAR_BLOCK = null;   // the page's override: the whole bar blocked with this label (Hands busy, Eyes busy, She has the mouse)
function skillBar(st, t) {
  if (BAR_BLOCK) st = { ...st, blocked: BAR_BLOCK };
  const y0 = BAR_Y;
  // contact shadow onto the scene, carved rail, tooled leather
  for (let j = Math.max(0, y0 - 6); j < y0; j++) for (let i = 0; i < W; i++) B.G[j * W + i] *= 1 - 0.55 * ((j - y0 + 6) / 6) ** 2;
  leatherU(0, y0 + 4, W, BAR_H - 4, { v: 0.17, vig: 0.35 });
  for (let i = 0; i < W; i++) { const g = 0.06 * (GR(i, y0) - 0.5); putU(i, y0, 0.02); putU(i, y0 + 1, 0.86 + g); putU(i, y0 + 2, 0.52 + g); putU(i, y0 + 3, 0.14); }
  for (const rx of [3, W - 7]) bossU(rx, y0, 4);
  // four heroes, 76 px each (portrait, HP tube, two skills and the gilded ultimate), a carved pilaster between
  const gx = [6, 88, 170, 252];
  // groups follow the marching order (position 1 on the left); keys stay with the hero (positions.js)
  const order = st.order || [0, 1, 2, 3];
  order.forEach((hi, n) => {
    const hero = HEROES[hi], x = gx[n], sel = st.selected === n, hp = st.hp[hi];
    portrait(hero.id, x, y0 + 3, { selected: sel, downed: hp <= 0 });
    // vertical HP tube beside the portrait
    const crit = hp < 0.35, hh = Math.round(21 * clamp(hp));
    for (let j = y0 + 3; j < y0 + 26; j++) for (let i = x + 22; i < x + 26; i++) {
      if (i === x + 22 || j === y0 + 3) { putU(i, j, 0, M_DUSK); continue; }
      if (i === x + 25 || j === y0 + 25) { putU(i, j, 0.36); continue; }
      const filled = j >= y0 + 4 + 21 - hh;
      putU(i, j, filled ? (i === x + 23 ? (crit ? 1 : 0.88) : (crit ? 0.78 : 0.64)) : 0.07, filled ? (crit ? M_DANGER : M_MOSS) : M_DUSK);
    }
    hero.skills.forEach((sk, k) => skillSlot(x + 28 + k * 16, y0 + 6, sk, hero.keys[k], st, t, k === 2));
    if (n < HEROES.length - 1) pilasterU(x + 79, y0 + 7, y0 + 23);
    if (typeof positionMarks === 'function') positionMarks(x, y0, hero.id, n, st, t);
  });
  if (typeof auraGlyphs === 'function' && st.auras !== false) auraGlyphs(order.map((hi) => HEROES[hi].id), order.map((hi) => st.hp[hi]), gx, y0);
  if (st.blocked) {
    for (let j = y0 + 4; j < y0 + BAR_H; j++) for (let i = 0; i < W; i++) if ((i + j) & 1) putI(i, j, P.void);
    const w = measure(st.blocked, 'silkb', 1) + 12, bx = (W - w) >> 1;
    shadowU(bx, y0 + 8, w, 12); plateU(bx, y0 + 8, w, 12, { top: 0.4, bot: 0.22 });
    text(st.blocked, W >> 1, y0 + 11, 'silkb', P.u6, { align: 'c', ls: 1, shadow: P.void });
  }
}

// ---------------------------------------------------------------- Souls (they replace scraps everywhere)
// a soul: a small pale wisp with an arcane rim, 5 x 6; numbers next to it in bone
const SOUL = ['..X..', '.XM..', '.XMX.', 'XMMMX', 'XMMMX', '.XXX.'];
function soulGlyph(x, y, dim) { sprite(x, y, SOUL, dim ? { X: 'u3', M: 'u4' } : null); }
// footer: gold · Souls on the left, the record on the right
function footerMoney(X0, PW, st) {
  for (let j = H - 11; j < H; j++) for (let i = X0; i < X0 + PW; i++) putU(i, j, j === H - 11 ? 0.02 : j === H - 10 ? 0.62 : lerp(0.34, 0.18, (j - H + 9) / 8) + 0.05 * (GR(i, j) - 0.5));
  let fx = X0 + 4; fx += text(st.gold + ' g', fx, H - 7, 'tiny', P.gold, { shadow: P.void }); fx += text(' · ', fx, H - 7, 'tiny', P.u4);
  soulGlyph(fx, H - 8); text(String(st.souls ?? st.scraps), fx + 7, H - 7, 'tiny', P.u6, { shadow: P.void });
  text('record ' + st.record, X0 + PW - 4, H - 7, 'tiny', P.u5, { align: 'r', shadow: P.void });
}
// ---------------------------------------------------------------- side panel (140 x 232)
const RAR_MAT = { common: [M_UMBER, 0.22], uncommon: [M_MOSS, 0.3], rare: [M_STONE, 0.32], epic: [M_MAGIC, 0.36], legendary: [M_LOOT, 0.5] };
function itemCell(x, y, it, o = {}) {
  const s = 21;
  wellU(x, y, s, s, { v: 0.12 });
  if (o.locked) { sprite(x + 7, y + 6, ['..333..', '.3...3.', '.3...3.', '2222222', '2333332', '233v332', '2222222']); return; }
  if (!it) { if (o.ghost) sprite(x + 4, y + 4, ITEM[o.ghost].map((r) => r.replace(/[^.]/g, (c) => (c === '.' ? '.' : '2')))); return; }
  // rarity light pooling up from the bottom of the slot
  const [rm, ra] = RAR_MAT[it.r] || RAR_MAT.common;
  for (let j = y + 2; j < y + s - 1; j++) for (let i = x + 2; i < x + s - 1; i++) {
    const q = (j - y) / s, cxd = Math.abs(i + 0.5 - x - s / 2) / (s / 2), g = ra * clamp(q * q * 1.25 - cxd * cxd * 0.35);
    if (g > 0.03) putU(i, j, g, rm);
  }
  const rc = P[RARITY[it.r]];
  frameI(x, y, s, s, rc); putI(x + 1, y + 1, rc); putI(x + s - 2, y + 1, rc); putI(x + 1, y + s - 2, rc); putI(x + s - 2, y + s - 2, rc);
  icon(it.icon, x + 4 + (o.dx || 0), y + 3);   // o.dx: the item shaking in its square (class gear on the wrong hero, #113)
  if (it.pow != null) text(String(it.pow), x + s - 2, y + s - 7, 'tiny', P[RARITY_TEXT[it.r]], { align: 'r', outline: P.void });
  if (it.lock) sprite(x + 2, y + s - 7, ['.3.', '3.3', '222', '222']);
  if (o.isNew) { frameI(x - 1, y - 1, s + 2, s + 2, P.pale); frameI(x, y, s, s, P.gold); }   // fresh item: the outline only, no NEW label (#116)
}
function partyCard(x, y, n, o) {
  const hero = HEROES[n], w = 33, h = 40, sel = o.selected === n;
  shadowU(x, y, w, h, { k: 0.55, r: 3, dx: 1, dy: 2 });
  plateU(x, y, w, h, sel ? { top: 0.4, bot: 0.2, hi: 0.9, lo: 0.08 } : { top: 0.26, bot: 0.13, hi: 0.56, lo: 0.05 });
  if (sel) frameI(x, y, w, h, P.gold);
  portrait(hero.id, x + 5, y + 3, { selected: false });
  { const xp = [0.62, 0.48, 0.35, 0.8][n]; rectI(x + 5, y + 27, 22, 1, P.void); rectI(x + 5, y + 27, Math.round(22 * xp), 1, P.pale); }
  text(hero.short, x + 1 + (w >> 1), y + 28, 'tiny', sel ? P.moon : P.u6, { align: 'c', shadow: P.void });
  text('Lv' + hero.lv, x + 2, y + 34, 'tiny', P.u5, { shadow: P.void });
  power(x + w - 2, y + 34, hero.pow, P.u6, 'r');
  if (o.alert === n) {
    for (let j = -2; j <= 7; j++) for (let i = -2; i <= 7; i++) { const dx = (i - 2.5) / 4.6, dy = (j - 2.5) / 4.6, d = dx * dx + dy * dy; if (d <= 1) putU(x + w - 6 + i, y - 2 + j, d > 0.66 ? 0 : clamp(1 - 0.4 * (dx + dy)), M_DANGER); }
    rectI(x + w - 4, y, 1, 4, P.moon); putI(x + w - 4, y + 5, P.moon);
  }
}
function sidePanel(st, t) {
  leatherU(0, 0, W, H, { v: 0.16, vig: 0.45 });
  for (let j = 0; j < H; j++) { putU(0, j, 0.02); putU(1, j, 0.78 + 0.06 * (GR(1, j) - 0.5)); putU(2, j, 0.3); putU(3, j, 0.05); }
  const X0 = 4, PW = W - 4;
  headerBar(X0, 0, PW, 'PARTY', '');
  for (let n = 0; n < HEROES.length; n++) partyCard(X0 + n * 34, 12, n, st);
  const hero = HEROES[st.selected];
  // hero header: darker engraved strip
  for (let j = 0; j < 10; j++) for (let i = X0; i < X0 + PW; i++) putU(i, 54 + j, j === 0 ? 0.56 : j === 9 ? 0 : lerp(0.3, 0.14, j / 8) + 0.05 * (GR(i, 54 + j) - 0.5));
  const nw = text(hero.name.toUpperCase(), X0 + 4, 57, 'silkb', P.u6, { shadow: P.void });
  text(hero.cls, X0 + 8 + nw, 57, 'tiny', P.u4, { shadow: P.void });
  power(X0 + PW - 4, 57, hero.pow, P.moon, 'r');
  // gear 3x2
  const gear = st.gear;
  ['weapon', 'helm', 'armor', 'boots', 'ring', 'trinket'].forEach((slot, k) => {
    const gx = X0 + 2 + (k % 3) * 22, gy = 67 + Math.floor(k / 3) * 22;
    itemCell(gx, gy, gear[slot], { ghost: { weapon: 'sword', helm: 'helm', armor: 'armor', boots: 'boots', ring: 'ring', trinket: 'amulet' }[slot] });
  });
  // stats
  const sx = X0 + 71;
  wellU(sx - 2, 66, PW - 71, 44, { v: 0.1 });
  st.stats.forEach(([k, v, d], i) => {
    const y = 69 + i * 7;
    text(k, sx + 1, y, 'tiny', P.u4);
    text(String(v), sx + 42, y, 'tiny', P.moon, { align: 'r' });
    if (d) text(d, sx + 44, y, 'tiny', d[0] === '+' ? P.g6 : P.crimson);
  });
  // bag
  headerBar(X0, 113, PW, 'BAG', '');
  const cnt = st.bag.filter(Boolean).length + '/18';
  text(cnt, X0 + 34, 116, 'tiny', cnt.startsWith('18') ? P.crimson : P.u6, { shadow: P.void });
  // auto-salvage toggle
  const ax = X0 + PW - 34;
  wellU(ax, 114, 31, 8, { v: 0.08 });
  if (st.autoSalvage) for (let j = 115; j < 121; j++) for (let i = ax + 1; i < ax + 30; i++) putU(i, j, lerp(0.42, 0.2, (j - 115) / 5), M_MOSS);
  sprite(ax + 2, 116, ['.qqq.', 'qssss', '.qq..', '.q.q.']);
  text(st.autoSalvage ? 'AUTO' : 'off', ax + 9, 116, 'tiny', st.autoSalvage ? P.g6 : P.u4, { shadow: P.void });
  for (let k = 0; k < 18; k++) itemCell(X0 + 2 + (k % 6) * 22, 126 + Math.floor(k / 6) * 22, st.bag[k], { isNew: st.newSlot === k });
  for (let k = 0; k < 6; k++) itemCell(X0 + 2 + k * 22, 194, null, { locked: true });
  // footer plate
  for (let j = H - 11; j < H; j++) for (let i = X0; i < X0 + PW; i++) putU(i, j, j === H - 11 ? 0.02 : j === H - 10 ? 0.62 : lerp(0.34, 0.18, (j - H + 9) / 8) + 0.05 * (GR(i, j) - 0.5));
  footerMoney(X0, PW, st);
  text('record ' + st.record, X0 + PW - 4, H - 7, 'tiny', P.u5, { align: 'r', shadow: P.void });
}
