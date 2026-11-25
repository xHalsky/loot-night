// ===========================================================================
// LIVE: the game's own state drawn with the page's pieces (V2, #67). The view model comes from
// src/render/rpgView.ts; out come the battle area (334 x 232) and hit regions in grid px for the game's input.
// The page's screens above stay as they were (the preview and the stills); this file is the game's.
// ===========================================================================
let LIVE_HITS = [];
function liveHit(x, y, w, h, act, arg, tip) { LIVE_HITS.push({ x, y, w, h, act, arg: arg == null ? '' : String(arg), tip: tip || '' }); }

// ---- the prototype's Px sprites (enemies the page has no rig for, curios) as lit, dithered stand-ins: each colour
// goes to the nearest step of the nearest material ramp, so they take the scene's light like the rigs do
let PX_RAMP_LAB = null;
const PX_MV = new Map();
function pxMatVal(hex) {
  let r = PX_MV.get(hex); if (r) return r;
  if (!PX_RAMP_LAB) { PX_RAMP_LAB = RAMPS.map((R) => { const out = []; for (let k = 0; k < 256; k += 3) out.push([k, oklab(R[k * 3], R[k * 3 + 1], R[k * 3 + 2])]); return out; }); }
  const c = oklab(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
  let best = [0, 0.5], bd = 1e9;
  PX_RAMP_LAB.forEach((steps, m) => { if (m === M_DANGER) return; for (const [k, q] of steps) { const d = (c[0] - q[0]) ** 2 * 1.4 + (c[1] - q[1]) ** 2 + (c[2] - q[2]) ** 2; if (d < bd) { bd = d; best = [m, k / 255]; } } });
  // the lights darken what they don't reach: lift the value so a sprite reads like a rig at the same spot
  r = { mat: best[0], v: clamp(best[1] * 1.25 + 0.05) }; PX_MV.set(hex, r); return r;
}
function pxSprite(rects, x, y, s, flip) {
  const gw = Math.max(...rects.map((q) => q[0] + q[2]));
  for (const [rx, ry, rw, rh, col] of rects) {
    const { mat, v } = pxMatVal(col);
    for (let j = 0; j < rh * s; j++) for (let i = 0; i < rw * s; i++) {
      const gx = flip ? (gw - rx - rw) * s + i : rx * s + i;
      put(x + gx, y + ry * s + j, v, mat);
    }
  }
}
const pxSize = (rects, s) => [Math.max(...rects.map((q) => q[0] + q[2])) * s, Math.max(...rects.map((q) => q[1] + q[3])) * s];

// ---- loot lying on the floor: a pool of its rarity light, the beam rising from it, motes
const LOOT_MAT = { common: [M_STONE, 0.7], uncommon: [M_MOSS, 0.78], rare: [M_STONE, 0.9], epic: [M_MAGIC, 0.9], legendary: [M_LOOT, 1], map: [M_UMBER, 0.85] };
function lootOnFloor(F, it, t, lights) {
  const IX = Math.round(it.x), IY = it.y, [mat, k] = LOOT_MAT[it.r] || LOOT_MAT.common, pulse = 0.5 + 0.5 * Math.sin(t * 3 + IX);
  const big = it.r === 'epic' || it.r === 'legendary' || it.r === 'rare';
  for (let y = IY - 4; y <= IY + 4; y++) for (let x = IX - 13; x <= IX + 13; x++) {
    const d = ((x - IX) / 13) ** 2 + ((y - IY) / 3.6) ** 2; if (d >= 1 || x < 0 || x >= W || y < 0 || y >= H) continue;
    const i2 = y * W + x; if (F.T[i2]) continue;
    F.X[i2] += 0.28 * k * (1 - d) ** 1.2 * (0.82 + 0.18 * pulse); if (d < 0.8) F.M[i2] = mixMat(x, y, F.M[i2], mat, Math.min(1, (0.8 - d) / 0.5));
  }
  if (big) for (let y = IY - 3; y >= IY - 60; y--) {
    const a = (1 - (IY - 3 - y) / 57) ** 1.25, wob = 0.5 + 0.5 * Math.sin(y * 0.35 - t * 5);
    if (a * (1.1 + 0.3 * wob) * k > BAYER8[((y & 7) << 3) | (IX & 7)]) put(IX, y, 0.62 + 0.33 * a, mat, 1);
    for (const sd of [-1, 1]) if (a * 0.7 * k > BAYER8[((y & 7) << 3) | ((IX + sd) & 7)]) put(IX + sd, y, 0.5 + 0.3 * a, mat, 1);
  }
  // the item: a little bundle in its material, a glint on top
  rect(IX - 3, IY - 2, 7, 3, 0.55, mat, 1); rect(IX - 2, IY - 3, 5, 1, 0.8, mat, 1); if (pulse > 0.7) put(IX, IY - 4, 1, mat, 1);
  lights.push({ x: IX, y: IY - 3, r: big ? 34 : 20, i: (0.35 + 0.15 * pulse) * k, c: mat === M_LOOT ? WARM : mat === M_MAGIC ? [1.1, 0.85, 1.5] : COLD });
}

// ---- every action shows (docs/design/dungeon.md): slashes, claws, bolts, fire, frost, heals, rings. k: 0..1 of its life
function liveVfx(v, t, lights) {
  const { kind, x, y, x2, y2 } = v, k = clamp(v.k), f = 1 - k;
  const arc = (r, a0, a1, val, mat) => { for (let a = a0; a <= a1; a += 0.12) put(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.8), val, mat, 1); };
  if (kind === 'chain') { if (k < 0.95) chain(x2, 178, x, 178); return; }   // the Hook: the chain stays on the hooked hero while he is dragged
  if (kind === 'smoke') {   // Smoke Bomb: a grey cloud over the enemy lanes, thinning at the end
    const fade = clamp((1 - k) * 4);
    for (let j = 150; j < 206; j++) for (let i = 176; i < 316; i++) {
      const d = 0.5 + 0.5 * Math.sin(i * 0.11 + j * 0.07 + v.k * 9) * Math.sin(j * 0.13 - i * 0.05);
      if (d * fade * 0.55 > BAYER8[((j & 7) << 3) | (i & 7)]) put(i, j, 0.42 + 0.1 * d, M_DUSK, 1);
    }
    return;
  }
  if (kind === 'slash' || kind === 'bash' || kind === 'smite' || kind === 'claw') {
    const mat = kind === 'claw' ? M_DANGER : kind === 'smite' ? M_LOOT : kind === 'bash' ? M_UMBER : M_STONE;
    if (kind === 'claw') for (let n = -1; n <= 1; n++) line(x - 5 + n * 3, y - 6, x + 3 + n * 3, y + 6 - 12 * k * 0, 0.9 * f + 0.1, mat, 1);
    else arc(8 + 4 * k, -2.2 + k * 1.2, -0.4 + k * 1.6, 0.95 * f + 0.1, mat);
    if (kind === 'bash' && k < 0.5) arc(12 * k + 4, 0, 6.28, 0.8, M_UMBER);
    lights.push({ x, y, r: 26, i: 0.5 * f, c: kind === 'smite' ? WARM : COLD });
  } else if (kind === 'bolt') {
    const n = 10; let px = x2, py = y2;
    for (let i = 1; i <= n; i++) { const q = i / n, nx = lerp(x2, x, q) + (i < n ? (hash(i, Math.floor(t * 20), 7) - 0.5) * 8 : 0), ny = lerp(y2, y, q) + (i < n ? (hash(i, Math.floor(t * 20), 8) - 0.5) * 6 : 0); line(px, py, nx, ny, 0.95 * f + 0.05, M_MAGIC, 1); px = nx; py = ny; }
    lights.push({ x, y, r: 40, i: 0.7 * f, c: [1.0, 0.85, 1.5] });
  } else if (kind === 'fire') {
    for (let n = 0; n < 30; n++) { const an = hash(n, 1, 3) * 6.28, d = k * (5 + hash(n, 2, 3) * 14), up = k * k * 12 * hash(n, 3, 3); put(Math.round(x + Math.cos(an) * d), Math.round(y + Math.sin(an) * d * 0.8 - up), 1 - k * 0.5, M_UMBER, 1); }
    ellipse(x, y, 5 * f + 1, 5 * f + 1, 1, M_UMBER, 1);
    lights.push({ x, y, r: 70 * (1 - k * 0.5), i: 1.1 * f, c: WARM });
  } else if (kind === 'frost') {
    for (let a = 0; a < 8; a++) { const an = a * 0.785, r = 3 + 9 * k; line(x, y, x + Math.cos(an) * r, y + Math.sin(an) * r, 0.95 * f + 0.1, M_STONE, 1); }
    lights.push({ x, y, r: 40, i: 0.6 * f, c: COLD });
  } else if (kind === 'heal') {
    for (let n = 0; n < 10; n++) { if (hash(n, Math.floor(t * 12), 2) < 0.3) continue; const px = x - 8 + hash(n, 9, 1) * 16, py = y + 6 - k * (14 + hash(n, 8, 1) * 14); put(px, py, 1, M_MOSS, 1); put(px - 1, py, 0.7, M_MOSS, 1); put(px + 1, py, 0.7, M_MOSS, 1); }
    lights.push({ x, y, r: 30, i: 0.45 * f, c: [0.85, 1.2, 0.9] });
  } else if (kind === 'ward' || kind === 'taunt') {
    const mat = kind === 'ward' ? M_LOOT : M_DANGER, r = kind === 'ward' ? 70 : 10 + 30 * k;
    for (let a = 0; a < 6.28; a += 0.05) { const px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r * 0.18); if (f * 0.9 > BAYER8[((py & 7) << 3) | (px & 7)]) put(px, py, 0.85, mat, 1); }
    lights.push({ x, y, r: 60, i: 0.4 * f, c: kind === 'ward' ? WARM : [1.3, 0.8, 0.8] });
  }
}

// ---- the battle area (dungeon walk, battle, curio, loot) from the game's state
const LIVE_HERO = { knight: 0, rogue: 1, mage: 2, priest: 3 };
const LIVE_IDX = { crimson: 'crimson', gold: 'gold', moon: 'moon', moss: 'g6', heal: 'g6', bone: 'u6', pale: 'pale', arcane: 'arcane', stone: 's6', dusk: 'd5' };
function liveBattleArea(ctx, vm, t) {
  LIVE_HITS = [];
  setRes(BA_W, GS_H, BAR_Y); CX = 167;
  const F = buf('live', BA_W, GS_H); clearFrame(F); bind(F);
  // the party in marching order, from the front (right)
  PARTY.length = 0;
  for (const m of vm.party) PARTY.push({ id: m.id, x: m.x, ph: m.ph, hp: m.hp, lunge: m.lunge });
  const battle = vm.mode === 'battle';
  const r = drawDungeon(F, t, {
    battle, live: { cam: vm.cam, walking: vm.walking }, cam: vm.cam, foreOff: battle ? 98 : undefined,
    enemies(F, t, lights) {
      vm.enemies.forEach((e, n) => {
        if (e.dead) return;
        const fy = LANE[e.lane] || CHAR_Y, x = e.x - (e.lunge || 0), tt = t + (e.ph || 0);
        if (!e.boss) mulEllipse(x, fy, 11, 3, 0.3);
        TAG = 11 + n;
        if (e.rig === 'skel') skeletonWarrior(x, fy, tt, { b: Math.sin(tt * 2) > 0.6 ? -1 : 0, ...(e.o || {}) });
        else if (e.rig === 'zomb') zombie(x, fy, tt, e.o || {});
        else if (e.rig === 'necro') necromancer(x, fy, tt, { cast: e.wind ? e.wind.f : 0 });
        else if (e.px) {
          const [w, h] = pxSize(e.px, e.s), bodies = e.bodies || 1, fly = e.fly ? Math.round(-18 + Math.sin(tt * 4) * 3) : 0;
          for (let k = 0; k < bodies; k++) { const ox = bodies > 1 ? (k % 3) * 13 - 13 + (k >= 3 ? 6 : 0) : 0, oy = bodies > 1 ? (k >= 3 ? -6 : 0) : 0; pxSprite(e.px, Math.round(x - w / 2 + ox), fy - h + oy + fly, e.s, true); }
        }
        TAG = 0;
        if (e.flash > 0) for (let i = 0; i < W * H; i++) if (F.T[i] === 11 + n && !F.E[i]) F.V[i] = Math.min(1, F.V[i] + 0.35 * e.flash / 0.15);
        if (e.back) for (let i = 0; i < W * H; i++) if (F.T[i] === 11 + n) { F.G[i] *= 0.62; if (F.E[i] === 0) F.V[i] *= 0.9; }
        if (e.rig === 'necro' && EFX.necro) lights.push({ x: EFX.necro[0], y: EFX.necro[1], r: 70, i: 0.55, c: [1.0, 0.8, 1.6] });
      });
      // downed heroes: dark, out of the light
      vm.party.forEach((m, n) => { if (m.down) for (let i = 0; i < W * H; i++) if (F.T[i] === n + 1) { F.V[i] *= 0.3; F.G[i] *= 0.7; } });
      if (battle) lights.push({ beam: true, x: 232, y: 0, x1: 206, y1: 204, w: 66, i: 0.5, air: 0.04, c: COLD, r: 1 });
      if (vm.curio && vm.curio.px) {   // the curio stands ahead of the party
        const [w, h] = pxSize(vm.curio.px, 3), cx = vm.curio.x;
        mulEllipse(cx, CART_Y, 20, 3, 0.3);
        TAG = 4; pxSprite(vm.curio.px, Math.round(cx - w / 2), CART_Y - h, 3); TAG = 0;
        lights.push({ x: cx - 10, y: CART_Y - 30, r: 80, i: 0.8, c: WARM });
      }
      if (vm.goblin) {
        const [w, h] = pxSize(vm.goblin.px, 3), gx = vm.goblin.x, gy = CHAR_Y + 4;
        TAG = 9; pxSprite(vm.goblin.px, Math.round(gx - w / 2), gy - h, 3); TAG = 0;
        lights.push({ x: gx, y: gy - 20, r: 40, i: 0.6, c: WARM });
      }
    },
    fx(F, t, lights) { for (const it of vm.loot) lootOnFloor(F, it, t, lights); for (const v of vm.vfx || []) liveVfx(v, t, lights); },
  });
  bind(F); CLIP = null;
  // over the scene: HP bars, marks, casts, numbers
  vm.party.forEach((m) => hpBar(m.x, 120, m.down ? 0 : m.hp));
  vm.enemies.forEach((e) => {
    if (e.dead) return;
    const by = e.barY;
    hpBar(e.x - 2, by, e.hp, true);
    let ty = by - 10;
    for (const [label, idx] of e.tags || []) { markTag(e.x - 2, ty, label, P[LIVE_IDX[idx] || idx]); ty -= 10; }
    if (e.wind) windup(e.x - 2, ty - 2, e.wind.label, e.wind.f);
  });
  for (const f of vm.floaters) floater(f.text, Math.round(f.x), Math.round(f.y), P[LIVE_IDX[f.idx] || 'moon'], f.big);
  for (const f of vm.flies) text(f.text, Math.round(f.x), Math.round(f.y), 'tiny', P[LIVE_IDX[f.idx] || 'moon'], { align: 'c', outline: P.void });
  if (vm.goblin) liveHit(vm.goblin.x - 16, CHAR_Y - 40, 32, 44, 'goblin', '', 'Catch the loot goblin!');
  // the corner, the portal, the buffs
  cornerOverlay(vm.corner, t);
  const [px, pw] = portalButton({ inBattle: !vm.portalOk, label: vm.bank });
  if (vm.portalOk) liveHit(px, 28, pw, PORTAL_H, 'toTown', '', vm.bank === '15 min' ? 'Back to the city, 15 min' : `Back to the city, 15 min: banks this run (${vm.bank.slice(5)})`);
  buffs(vm.buffs, t);
  vm.buffs.forEach((b, k) => liveHit(W - 4 - 13 - k * 16, 3, 13, 13, '', '', b.tip));
  // the curio card in the band
  if (vm.curio && vm.curio.card) {
    curioWindow(vm.curio.card, t);
    vm.curio.card.choices.forEach((c, k) => { if (c.act) liveHit(84 + 7 + k * 89, 4 + 26, 85, 20, c.act, c.arg, c.tip); });
    liveHit(84 + 188 - 10, 0, 12, 10, 'curioLeave', '', 'Walk past');
  }
  // the party: press on a hero (or his portrait) and drag onto another to swap (grid doc §5d)
  vm.party.forEach((m, i) => liveHit(m.x - 12, 150, 24, 48, 'hero', i, ''));
  if (vm.drag) for (const rx of vm.drag.rings) floorRing(rx, t);
  // the skill bar: groups in marching order, keys with the hero; auras on the pilasters, x0.7 when out of position
  const bar = vm.bar;
  skillBar({ ...bar, order: bar.order.map((id) => LIVE_HERO[id]) }, t);
  const gx = [6, 88, 170, 252];
  bar.order.forEach((id, n) => {
    const x = gx[n];
    liveHit(x, BAR_Y + 3, 22, 24, 'heroTab', bar.heroIdx[n], '');
    for (let k = 0; k < 3; k++) liveHit(x + 28 + k * 16, BAR_Y + 6, 15, 18, 'ability', `${bar.heroIdx[n]},${k + 1}`, `skill:${bar.heroIdx[n]}:${k + 1}`);
  });
  // the hovered hero's card over his head; the portrait lifted under the pointer while dragging
  if (vm.heroCard) tipCard(clamp(Math.round(vm.heroCard.x - 75), 2, W - 152), 34, 150, vm.heroCard.lines.map(([k, s]) => [k, s, null]));
  if (vm.tip) liveTip(vm.tip);
  if (vm.drag) ghostPortrait(vm.drag.id, Math.round(vm.drag.x - 11), Math.round(vm.drag.y - 12));
  composeInto(ctx, F, r, 0);
  return LIVE_HITS;
}

// ---- the floor map as the route choice (#52, 1.5; grid doc §5b), from the game's path cards
const LIVE_PATH_LAYERS = new Map();
function livePathsLayer(st) {
  const key = st.hist.join(',') + '|' + st.cards.map((c) => (c.map ? 'm' : 'p')).join('') + '|' + st.sub;
  let L = LIVE_PATH_LAYERS.get(key); if (L) return L;
  if (LIVE_PATH_LAYERS.size > 8) LIVE_PATH_LAYERS.clear();
  L = buildMapLayer({ title: st.title, sub: st.sub, holes: [[311, 150, 2.6], [25, 64, 2.2]], draw: (P_) => {
    const H0 = MAP_HIST_XY.slice(4 - st.hist.length).map(([x, y]) => ({ x, y })), here = H0[H0.length - 1];
    for (let k = 0; k < H0.length - 1; k++) stairRoad(H0[k], H0[k + 1], k % 2 ? -1 : 1, P_);
    H0.forEach((n, k) => roundel(n.x, n.y, String(st.hist[k]), st.hist[k] % 5 === 0 ? M_DANGER : M_DUSK));
    const F = MAP_FORK_XY[st.cards.length];
    F.forEach(([x, y], k) => { if (!st.cards[k].map) stairRoad(here, { x, y }, forkBend(F.length, k), P_); });
    compassRose(34, 146);
  } });
  LIVE_PATH_LAYERS.set(key, L); return L;
}
function livePaths(ctx, st, t) {
  LIVE_HITS = [];
  for (const [k, m] of Object.entries(st.mapInfo || {})) MAPITEM[k] = m;
  if (st.texts) { Object.assign(FEAT, st.texts.feat); Object.assign(COND, st.texts.cond); }   // the game's texts and numbers
  setRes(BA_W, GS_H); CX = 167;
  const L = livePathsLayer(st);
  const F = buf('ba', BA_W, GS_H); bind(F); CLIP = null;
  F.V.set(L.V); F.M.set(L.M); F.E.set(L.E); F.A.set(L.A); F.T.fill(0); F.DX.fill(0); F.I.set(L.I); F.G.fill(1); F.X.fill(0);
  MAT = M_UMBER; EMI = 0;
  const n = Math.min(3, st.cards.length), FK = MAP_FORK_XY[n], here = MAP_HIST_XY[3] ? { x: MAP_HIST_XY[3][0], y: MAP_HIST_XY[3][1] } : { x: 80, y: 106 }, off = Math.floor(t * 6);
  const hov = st.hov, qd = hov >= 0 ? clamp((t - (st.hovT || 0)) / 0.5) : 0;
  for (const [r, sd] of [[13.5, 0], [12.6, 2]]) { const from = ((off * 0.02) + sd * 0.1) % 1; inkRing(here.x, here.y, r, 0.95, M_DANGER, from, from + 0.88, 0.6, sd); }
  text('you are here', 64, 121, 'tiny', P.wine, { align: 'c' });
  if (hov >= 0 && hov < n) {
    const [bx, by] = FK[hov], c = st.cards[hov], { A, Bp, C, L: Ln } = forkPts(here, { x: bx, y: by }, forkBend(n, hov)), N = Math.ceil(Ln * 2);
    for (let k = 0; k <= N * qd; k++) {
      if (((k >> 2) + off) & 1) continue; const q = k / N;
      const px = Math.round(qb(A[0], C[0], Bp[0], q)), py = Math.round(qb(A[1], C[1], Bp[1], q));
      inkP(px, py, 0.95, M_DANGER); if (c.map) inkP(px + 1, py, 0.8, M_DANGER);
    }
  }
  st.cards.slice(0, n).forEach((c, k) => {
    const [x, y] = FK[k], on = k === hov && qd >= 0.5;
    if (on) roundel(x, y, String(st.floor), c.boss ? M_DANGER : c.map ? M_MAGIC : c.cond ? M_DANGER : c.feat ? M_STONE : M_DUSK);
    else { roundel(x, y, '', M_DUSK, true); text('?', x, y - 2, 'tiny', P.u2, { align: 'c' }); }
    let ix = x + 13;
    const icons = c.map ? [ITEM.map.slice(0, 11).map((r) => r.slice(0, 11))] : [c.feat && PICON[c.feat], c.cond && PICON[c.cond]].filter(Boolean);
    if (c.boss) icons.unshift(INK.skull.map((r) => r.replace(/M/g, 'v')));
    for (const ic of icons) { inkIcon(ic, ix, y - 5, k !== hov); ix += 13; }
  });
  const nx = 202, ny = 42;
  if (hov >= 0 && hov < n) pathNote(st, st.cards[hov], nx, ny, 114);
  else { text('FLOOR ' + st.floor, nx, ny, 'silkb', P.u1); wrapInk('Hover a path to read it.', nx, ny + 12, 114, P.u2); }
  const fw = text('Flow x' + st.flow, 20, 20, 'tiny', P.u1);
  flowBar(20 + fw + 4, 21, 30, 4, st.flowBar, false);
  const [px, pw] = portalPlate(W - 18, 15, st.portalLabel, st.portalOk, { right: true });
  if (st.portalOk) liveHit(px, 15, pw, PORTAL_H, 'toTown', '', st.portalLabel === '15 min' ? 'Back to the city, 15 min' : `Back to the city, 15 min: banks this run (${st.portalLabel.slice(5)})`);
  const awayF = st.away / MAP_AWAY_SEC;
  st.cards.slice(0, n).forEach((c, k) => { pathCard2(MAP_CARD_X[n][k], CARD_Y, c, st, k === hov, k === st.safest, awayF); liveHit(MAP_CARD_X[n][k], CARD_Y - 2, CARD_W, CARD_H + 2, 'path', k, ''); });
  const left = Math.max(0, Math.ceil(MAP_AWAY_SEC - st.away));
  const f1 = 'Look away 5 s in all and the', f2 = st.away > 0 ? 'path is taken. ' + left + ' s left.' : 'path is taken.';
  const w1 = measure(f1, 'tiny'), w2 = measure(f2, 'tiny'), x0 = Math.round(167 - (w1 + w2 + 12) / 2);
  text(f1, x0, 211, 'tiny', P.u1); hourglass(x0 + w1 + 3, 210, awayF, P.u1, P.u3); text(f2, x0 + w1 + 11, 211, 'tiny', P.u1);
  const fl = 0.96 + 0.04 * Math.sin(t * 7) * Math.sin(t * 2.3);
  composeInto(ctx, F, { lights: [{ x: -30, y: -40, r: 820, i: 0.66 * fl, c: [1.1, 1.0, 0.86] }, { x: 380, y: 300, r: 330, i: 0.2, c: [0.72, 0.85, 1.3] }], ambient: [0.5, 0.49, 0.55], tint: 0.1, vig: 0 }, 0);
  return LIVE_HITS;
}


// ---- the skill tree (#53; grid doc §6c): the constellation over the battle area and the Skill Tree tab, from the game
const TREE_PAGE_HERO = { knight: 'knight', rogue: 'rogue', mage: 'mage', healer: 'priest' };
function liveTreeSetup(st) {
  TREE_HERO = TREE_PAGE_HERO[st.hero];
  const T = TREES[TREE_HERO];
  T.bought = st.bought.slice(); TREE_SOULS = st.souls;
  if (st.texts) { T.r1 = st.texts.r1; T.r2 = st.texts.r2; Object.assign(T.st, st.texts.st); }
  return T;
}
const TREE_HIT_R = { skill: 11, unlock: 11, ult: 15, rule: 8, stat: 6, auto: 7, root: 8 };
function liveTree(ctx, st, t) {
  LIVE_HITS = [];
  liveTreeSetup(st);
  TREE_LIVE = true; TREE_LIVE_HOV = st.hov;
  screenTree(ctx, t);
  TREE_LIVE = false;
  for (const id of Object.keys(TN)) { const n = TN[id]; if (n.kind === 'fork') continue; const r = TREE_HIT_R[n.kind]; liveHit(n.x - r, n.y - r, 2 * r, 2 * r, 'treeNode', id, ''); }
  return LIVE_HITS;
}
// a party card from the game (hud.js partyCard reads the page's own heroes)
function livePartyCard(x, y, c, sel) {
  const w = 33, h = 40;
  shadowU(x, y, w, h, { k: 0.55, r: 3, dx: 1, dy: 2 });
  plateU(x, y, w, h, sel ? { top: 0.4, bot: 0.2, hi: 0.9, lo: 0.08 } : { top: 0.26, bot: 0.13, hi: 0.56, lo: 0.05 });
  if (sel) frameI(x, y, w, h, P.gold);
  portrait(c.id, x + 5, y + 3, { selected: false, downed: c.down });
  rectI(x + 5, y + 27, 22, 1, P.void); rectI(x + 5, y + 27, Math.round(22 * clamp(c.xp)), 1, P.pale);
  text(c.short, x + 1 + (w >> 1), y + 28, 'tiny', sel ? P.moon : P.u6, { align: 'c', shadow: P.void });
  text('Lv' + c.lv, x + 2, y + 34, 'tiny', P.u5, { shadow: P.void });
  power(x + w - 2, y + 34, c.pow, P.u6, 'r');
}
let LIVE_PANEL_HITS = [];
function panelHit(x, y, w, h, act, arg, tip) { LIVE_PANEL_HITS.push({ x, y, w, h, act, arg: String(arg ?? ''), tip: tip || '' }); }
function liveTreePanel(st, t) {
  const T = liveTreeSetup(st), X0 = 4, PW = W - 4;
  leatherU(0, 0, W, H, { v: 0.16, vig: 0.45 });
  for (let j = 0; j < H; j++) { putU(0, j, 0.02); putU(1, j, 0.78 + 0.06 * (GR(1, j) - 0.5)); putU(2, j, 0.3); putU(3, j, 0.05); }
  st.party.forEach((c, n) => { livePartyCard(X0 + n * 34, 15, c, c.hero === st.hero); panelHit(X0 + n * 34, 15, 33, 40, 'treeHero', c.hero, ''); });
  for (let j = 0; j < 10; j++) for (let i = X0; i < X0 + PW; i++) putU(i, 57 + j, j === 0 ? 0.56 : j === 9 ? 0 : lerp(0.3, 0.14, j / 8) + 0.05 * (GR(i, 57 + j) - 0.5));
  text(st.short.toUpperCase(), X0 + 4, 60, 'silkb', P.u6, { shadow: P.void });
  const sw = text(String(st.souls), X0 + PW - 4, 60, 'tiny', P.moon, { align: 'r', shadow: P.void }); soulGlyph(X0 + PW - 12 - sw, 59);
  const N0 = st.node;
  let y = 71;
  text(N0.name, X0 + 4, y, 'tiny', P.moon, { shadow: P.void }); y += 8;
  text(N0.kind, X0 + 4, y, 'tiny', P.u4, { shadow: P.void }); y += 10;
  for (const ln of wrapTiny(N0.fx, PW - 10)) { text(ln, X0 + 4, y, 'tiny', P.u6, { shadow: P.void }); y += 7; }
  y += 3;
  const note = (kind, str) => {
    const col = kind === '+' ? P.g5 : P.crimson;
    if (kind === '+') { putI(X0 + 5, y + 1, col); putI(X0 + 4, y + 2, col); putI(X0 + 5, y + 2, col); putI(X0 + 6, y + 2, col); putI(X0 + 5, y + 3, col); } else { putI(X0 + 4, y + 2, col); putI(X0 + 5, y + 2, col); putI(X0 + 6, y + 2, col); }
    for (const ln of wrapTiny(str, PW - 16)) { text(ln, X0 + 10, y, 'tiny', P.u6, { shadow: P.void }); y += 7; }
    y += 1;
  };
  for (const [k, s] of N0.notes) if (y < 140) note(k, s);
  { const yy = 148, got = st.bought.length;
    for (let i = X0 + 2; i < X0 + PW - 2; i++) { putU(i, yy - 4, 0.04); putU(i, yy - 3, 0.32); }
    text(got + ' bought in this tree', X0 + 4, yy, 'tiny', P.u5, { shadow: P.void });
    const uw = text(st.ultName + ':', X0 + 4, yy + 9, 'tiny', P.u5, { shadow: P.void });
    for (let k = 0; k < 6; k++) { const px = X0 + 8 + uw + k * 6; rectI(px, yy + 9, 5, 5, P.void); rectI(px + 1, yy + 10, 3, 3, k < got ? P.gold : P.u2); if (k < got) putI(px + 1, yy + 10, P.pale); }
    text(got >= 6 ? 'open' : got + '/6', X0 + 46 + uw, yy + 9, 'tiny', got >= 6 ? P.gold : P.u4, { shadow: P.void }); }
  const by = 172;
  if (N0.state !== 'owned') {
    const s = N0.state, lbl = s === 'buy' || s === 'poor' ? 'Buy · ' + N0.cost : s === 'shut' ? 'Shut by its pair' : N0.isUlt ? 'Needs 6 nodes' : 'Locked';
    flatButton(X0 + 4, by, PW - 8, lbl, s === 'buy', s === 'buy' || s === 'poor');
    if (s === 'buy') panelHit(X0 + 4, by, PW - 8, 15, 'treeBuy', N0.id, '');
  }
  if (N0.state === 'poor') text('Not enough Souls: ' + st.souls + ' of ' + N0.cost + '.', X0 + 4, by + 18, 'tiny', P.crimson, { shadow: P.void });
  else text('Each buy in this tree costs +15%.', X0 + 4, by + 18, 'tiny', P.u4, { shadow: P.void });
  const ry = 200;
  shadowU(X0 + 4, ry, PW - 8, 13, { k: 0.5, r: 2, dx: 1, dy: 2 }); plateU(X0 + 4, ry, PW - 8, 13, { top: 0.4, bot: 0.22, hi: 0.72 });
  text('Respec · free while testing', X0 + PW / 2, ry + 4, 'tiny', P.u6, { align: 'c', shadow: P.void });
  panelHit(X0 + 4, ry, PW - 8, 13, 'treeRespec', st.hero, 'Every Soul spent in this tree comes back.');
  footerMoney(X0, PW, { gold: st.gold, souls: st.souls, record: st.record });
}
// the side panel (V2, #53): for now the Skill Tree tab; the other tabs are still the DOM panel
function livePanel(ctx, st, t) {
  LIVE_PANEL_HITS = [];
  setRes(SP_W, GS_H);
  const S = buf('lsp', SP_W, GS_H); clearFrame(S); bind(S); CLIP = null;
  if (st.tab === 'tree') liveTreePanel(st, t);
  tabStrip(st.tab);
  let x = 4; for (const [id, , w] of TABS) { panelHit(x, 0, w, 11, 'townTab', id, ''); x += w; }
  composeInto(ctx, S, { lights: [], ambient: [0.1, 0.1, 0.2], tint: 0, vig: 0 }, 0);
  return LIVE_PANEL_HITS;
}

// ---- the whole side panel from the game (V2 with #53; grid doc §5, §6b): party, gear, stats, bag; in town the tabs
// an item cell from the game: rarity, power, lock, NEW, plus the unbanked dashes, the upgrade arrow and the selection
function liveCell(x, y, c, o = {}) {
  if (c && c.locked) { itemCell(x, y, null, { locked: true }); return; }
  itemCell(x, y, c && c.empty ? null : c, { isNew: c && c.isNew, ghost: o.ghost });
  if (!c || c.empty) return;
  if (c.run) for (let k = 0; k < 17; k++) if ((k >> 1) & 1) { putI(x + 2 + k, y + 2, P.u5); putI(x + 2 + k, y + 18, P.u5); putI(x + 2, y + 2 + k, P.u5); putI(x + 18, y + 2 + k, P.u5); }
  if (c.up) sprite(x + 2, y + 2, ['..g..', '.ggg.', 'ggggg'], { g: 'g6' });
  if (c.sel) { frameI(x - 1, y - 1, 23, 23, P.pale); frameI(x, y, 21, 21, P.gold); }
}
function panelFrame() {
  leatherU(0, 0, W, H, { v: 0.16, vig: 0.45 });
  for (let j = 0; j < H; j++) { putU(0, j, 0.02); putU(1, j, 0.78 + 0.06 * (GR(1, j) - 0.5)); putU(2, j, 0.3); putU(3, j, 0.05); }
}
function liveBag(st, X0, PW, y0) {
  headerBar(X0, y0, PW, 'BAG', '');
  const full = st.bagCount >= st.bagSize, cnt = st.bagCount + '/' + st.bagSize;
  text(cnt, X0 + 34, y0 + 3, 'tiny', full ? P.crimson : P.u6, { shadow: P.void });
  const ax = X0 + PW - 34;
  wellU(ax, y0 + 1, 31, 8, { v: 0.08 });
  if (st.autoSalvage) for (let j = y0 + 2; j < y0 + 8; j++) for (let i = ax + 1; i < ax + 30; i++) putU(i, j, lerp(0.42, 0.2, (j - y0 - 2) / 5), M_MOSS);
  sprite(ax + 2, y0 + 3, ['.qqq.', 'qssss', '.qq..', '.q.q.']);
  text(st.autoSalvage ? 'AUTO' : 'off', ax + 9, y0 + 3, 'tiny', st.autoSalvage ? P.g6 : P.u4, { shadow: P.void });
  panelHit(ax, y0, 31, 10, 'autoSalvage', '', 'autosalvage');
  const by = y0 + 13, rows = Math.ceil(st.bag.length / 6);
  panelHit(X0, by - 2, PW, rows * 22 + 2, 'bagArea', '', '');
  st.bag.forEach((c, k) => {
    const x = X0 + 2 + (k % 6) * 22, y = by + Math.floor(k / 6) * 22;
    liveCell(x, y, c);
    if (c && !c.locked && !c.empty) panelHit(x, y, 21, 21, 'bagCell', c.id, 'bag:' + c.id);
  });
}
function livePartyPanel(st, t) {
  const X0 = 4, PW = W - 4, top = st.tabs ? 12 : 0;
  panelFrame();
  if (!st.tabs) headerBar(X0, 0, PW, 'PARTY', '');
  st.party.forEach((c, n) => {
    const x = X0 + n * 34, y = 12;
    livePartyCard(x, y, c, n === st.sel);
    if (c.alert) {
      for (let j = -2; j <= 7; j++) for (let i = -2; i <= 7; i++) { const dx = (i - 2.5) / 4.6, dy = (j - 2.5) / 4.6, d = dx * dx + dy * dy; if (d <= 1) putU(x + 33 - 6 + i, y - 2 + j, d > 0.66 ? 0 : clamp(1 - 0.4 * (dx + dy)), M_DANGER); }
      rectI(x + 33 - 4, y, 1, 4, P.moon); putI(x + 33 - 4, y + 5, P.moon);
    }
    panelHit(x, y, 33, 40, 'heroTab', n, 'hero:' + n);
  });
  for (let j = 0; j < 10; j++) for (let i = X0; i < X0 + PW; i++) putU(i, 54 + j, j === 0 ? 0.56 : j === 9 ? 0 : lerp(0.3, 0.14, j / 8) + 0.05 * (GR(i, 54 + j) - 0.5));
  const nw = text(st.hero.name.toUpperCase(), X0 + 4, 57, 'silkb', P.u6, { shadow: P.void });
  text(st.hero.cls, X0 + 8 + nw, 57, 'tiny', P.u4, { shadow: P.void });
  power(X0 + PW - 4, 57, st.hero.pow, P.moon, 'r');
  ['weapon', 'helm', 'armor', 'boots', 'ring', 'trinket'].forEach((slot, k) => {
    const gx = X0 + 2 + (k % 3) * 22, gy = 67 + Math.floor(k / 3) * 22, c = st.gear[slot];
    liveCell(gx, gy, c, { ghost: { weapon: 'sword', helm: 'helm', armor: 'armor', boots: 'boots', ring: 'ring', trinket: 'amulet' }[slot] });
    panelHit(gx, gy, 21, 21, 'gearCell', slot, c ? 'gear:' + st.sel + ':' + slot : '');
  });
  const sx = X0 + 71;
  wellU(sx - 2, 66, PW - 71, 44, { v: 0.1 });
  st.stats.forEach(([k, v, d], i) => {
    const y = 69 + i * 7;
    text(k, sx + 1, y, 'tiny', P.u4);
    text(String(v), sx + 42, y, 'tiny', P.moon, { align: 'r' });
    if (d) text(d, sx + 44, y, 'tiny', d[0] === '+' ? P.g6 : P.crimson);
  });
  liveBag(st, X0, PW, 113);
  for (let j = H - 11; j < H; j++) for (let i = X0; i < X0 + PW; i++) putU(i, j, j === H - 11 ? 0.02 : j === H - 10 ? 0.62 : lerp(0.34, 0.18, (j - H + 9) / 8) + 0.05 * (GR(i, j) - 0.5));
  footerMoney(X0, PW, st);
  void top;
}
function liveTownPanel(st, t) {
  const X0 = 4, PW = W - 4;
  panelFrame();
  st.builds.forEach((b, k) => {
    const y = 14 + k * 19, hot = b.hot;
    panelHit(X0, y, PW - 46, 18, '', '', b.tip);
    if (hot) { for (let j = y; j < y + 18; j++) for (let i = X0; i < X0 + PW; i++) putU(i, j, 0.3 - 0.1 * ((j - y) / 18) + 0.03 * (GR(i, j) - 0.5)); rectI(X0, y, 1, 18, P.gold); }
    for (let i = X0 + 2; i < X0 + PW - 2; i++) { putU(i, y + 18, 0.04); putU(i, y + 19, 0.32); }
    const nw = text(b.name, X0 + 4, y + 3, 'tiny', hot ? P.moon : P.u6, { shadow: P.void });
    for (let p = 0; p < 3; p++) sprite(X0 + 7 + nw + p * 6, y + 3, p < b.lv ? PIP_ON : PIP_OFF, { O: 'gold', Y: 'pale' });
    text(b.fx, X0 + 4, y + 11, 'tiny', P.u5, { shadow: P.void });
    const bw = 40, bx = X0 + PW - bw - 3, by = y + 2;
    if (b.lv >= 3) { text('MAX LEVEL', bx + bw / 2, by + 5, 'tiny', P.u4, { align: 'c' }); return; }
    shadowU(bx, by, bw, 15, { k: 0.5, r: 2, dx: 1, dy: 2 });
    plateU(bx, by, bw, 15, b.ok ? { top: 0.5, bot: 0.26, hi: 0.82 } : { top: 0.26, bot: 0.16, hi: 0.4, lo: 0.08 });
    text(b.lv ? 'Upgrade' : 'Build', bx + bw / 2, by + 2, 'tiny', b.ok ? P.moon : P.u4, { align: 'c', shadow: b.ok ? P.void : undefined });
    const cs = `${b.gold}g ${b.souls}`, cw = measure(cs, 'tiny') + 7, cx0 = Math.round(bx + bw / 2 - cw / 2);
    text(cs, cx0, by + 9, 'tiny', b.ok ? P.gold : P.u4, { shadow: b.ok ? P.void : undefined }); soulGlyph(cx0 + cw - 5, by + 8, !b.ok);
    panelHit(bx, by, bw, 15, 'build', b.id, b.tip);
  });
  const fy = 92, F0 = st.floor;
  wellU(X0 + 2, fy, PW - 4, 12, { v: 0.08 });
  arrowBtn(X0 + 3, fy + 1, -1, st.canDown); arrowBtn(X0 + PW - 13, fy + 1, 1, st.canUp);
  if (st.canDown) panelHit(X0 + 3, fy + 1, 9, 10, 'pickFloor', -1, '');
  if (st.canUp) panelHit(X0 + PW - 13, fy + 1, 9, 10, 'pickFloor', 1, '');
  text('floor ' + F0, X0 + PW / 2 - 4, fy + 4, 'tiny', P.moon, { align: 'r', shadow: P.void }); text(F0 === 1 ? 'the start' : 'checkpoint', X0 + PW / 2, fy + 4, 'tiny', P.u4);
  const bx = X0 + 2, by = fy + 14, bw = PW - 4, bh = 15;
  shadowU(bx, by, bw, bh, { k: 0.6, r: 3, dx: 1, dy: 2 });
  plateU(bx, by, bw, bh, { mat: M_MAGIC, top: 0.4, bot: 0.3, hi: 0.86, hiMat: M_DUSK, lo: 0.2, grain: 0.03 });
  text(`Enter the dungeon · floor ${F0}`, bx + bw / 2, by + 5, 'tiny', P.moon, { align: 'c', shadow: P.void });
  panelHit(bx, by, bw, bh, 'portal', '', `Into the Shadow Crypt at floor ${F0} (15 min).`);
  liveBag(st, X0, PW, 124);
  footerMoney(X0, PW, st);
}
// the panel's dispatcher (replaces the Skill-Tree-only one above)
function livePanelAll(ctx, st, t) {
  LIVE_PANEL_HITS = [];
  setRes(SP_W, GS_H);
  const S = buf('lsp', SP_W, GS_H); clearFrame(S); bind(S); CLIP = null;
  if (st.tab === 'tree') liveTreePanel(st, t);
  else if (st.tab === 'town' && st.svc) liveServicePanel(st, t);
  else if (st.tab === 'town') liveTownPanel(st, t);
  else livePartyPanel(st, t);
  if (st.tabs) { tabStrip(st.tab); let x = 4; for (const [id, , w] of TABS) { panelHit(x, 0, w, 11, 'townTab', id, ''); x += w; } }
  if (st.tip) liveTip(st.tip);
  composeInto(ctx, S, { lights: [], ambient: [0.1, 0.1, 0.2], tint: 0, vig: 0 }, 0);
  return LIVE_PANEL_HITS;
}


// ---- the town (V2, #53; grid doc §6): Ravenhold drawn by the renderer, its buildings hit regions; the services open
// in the side panel's Town tab
function liveTown(ctx, st, t) {
  LIVE_HITS = [];
  for (const [id, b] of Object.entries(st.build)) BUILD[id] = { ...BUILD[id], fx: (l) => b.fx[l] ?? '', cost: b.cost };
  screenTown(ctx, t, { live: { levels: st.levels, gold: st.gold, souls: st.souls }, hover: st.hover, noTip: st.noTip });
  for (const sp of SPOTS) { const [x, y, w, h] = sp.box; liveHit(x, y, w, h, 'townSpot', sp.id, ''); }
  return LIVE_HITS;
}
// a service page in the Town tab: the bag grid with values, picked items, the total and the flat gold button
function liveServicePanel(st, t) {
  const X0 = 4, PW = W - 4, S0 = st.svc;
  panelFrame();
  serviceHead(X0, PW, 14, S0.name, S0.mark, S0.line);
  panelHit(X0, 14, 40, 10, 'svcClose', '', 'Back to the build list');
  const y0 = 36;
  S0.cells.forEach((c, k) => {
    const x = X0 + 2 + (k % 6) * 22, y = y0 + Math.floor(k / 6) * 22;
    liveCell(x, y, c && c.locked ? null : c);
    if (!c || c.empty || c.locked) return;
    if (!c.applies) { for (let j = y + 1; j < y + 20; j++) for (let i = x + 1; i < x + 20; i++) if ((i + j) & 1) putI(i, j, P.void); panelHit(x, y, 21, 21, '', '', 'bag:' + c.id); return; }
    if (c.picked) { frameI(x - 1, y - 1, 23, 23, P.gold); frameI(x, y, 21, 21, P.gold); sprite(x + 14, y + 1, ['....O', '...OO', 'O.OO.', 'OOO..', '.O...'], null); }
    if (c.badge) zl9(c.badge, x + 2, y + 2, 'tiny', P[c.badgeCol] || P.u6, { outline: P.void });
    panelHit(x, y, 21, 21, 'svcPick', c.id, 'bag:' + c.id);
  });
  let y = y0 + Math.ceil(S0.cells.length / 6) * 22 + 4;
  if (S0.reveal) {
    const R = S0.reveal, q = R.t;
    if (q < 1.4) {
      const pulse = q > 0.9 ? (q - 0.9) / 0.5 : 0;
      wellU(X0 + 2, y, PW - 4, 70, { v: 0.08 });
      text('Looking closely...', X0 + PW / 2, y + 30, 'tiny', P.u5, { align: 'c', shadow: P.void });
      if (pulse > 0) for (let k = 0; k < 18; k++) { const an = k / 18 * 6.283 + q * 3, r = 6 + pulse * 26; putI(Math.round(X0 + PW / 2 + Math.cos(an) * r), Math.round(y + 32 + Math.sin(an) * r * 0.6), k & 1 ? P.arcane : P.pale); }
    } else {
      const flash = q < 1.6, rc = P[RARITY_TEXT[R.cell.r]];
      // lay the lines out first so the card grows with them (a special or a legend rule wraps)
      const rows = [];
      for (const [a, kind, fx] of R.lines) {
        if (!fx) { rows.push([a, P[kind] || P.g6, null, 8]); continue; }
        rows.push([a, P.u6, kind, 7]);
        for (const ln of wrapTiny(fx, PW - 20)) rows.push([ln, P.u5, null, 7]);
      }
      const H = Math.min(222 - y, Math.max(80, 46 + rows.reduce((s, r) => s + r[3], 0)));
      shadowU(X0 + 2, y, PW - 4, H, { k: 0.6, r: 4, dx: 2, dy: 3 });
      leatherU(X0 + 3, y + 1, PW - 6, H - 2, { v: 0.13, vig: 0.25 });
      mouldU(X0 + 2, y, PW - 4, H, { mat: M_MAGIC, k: 1, bosses: false });
      text('IDENTIFIED', X0 + 8, y + 6, 'silkb', P.arcane, { shadow: P.void });
      liveCell(X0 + 8, y + 15, R.cell);
      for (const [k, ln] of wrapTiny(R.name, PW - 40).slice(0, 2).entries()) text(ln, X0 + 33, y + 17 + k * 7, 'tiny', rc, { shadow: P.void });
      text(R.sub, X0 + 33, y + 31, 'tiny', P.u5, { shadow: P.void });
      let ly = y + 42;
      for (const [a, col, tag, h] of rows) {
        if (ly > y + H - 10) break;
        text(a, X0 + 8, ly, 'tiny', col, { shadow: P.void });
        if (tag) text(tag, X0 + PW - 9, ly, 'tiny', P.d5, { align: 'r', shadow: P.void });
        ly += h;
      }
      if (flash) for (let j = y; j < y + H; j++) for (let i = X0 + 2; i < X0 + PW - 2; i++) if (((i + j) & 1) === 0) putI(i, j, P.moon);
    }
  } else {
    const w0 = zl9(S0.summary, X0 + 4, y, 'tiny', P.u6, { shadow: P.void });
    if (S0.soul) soulGlyph(X0 + 6 + w0, y - 1);
    for (const [k, ln] of wrapTiny(S0.why, PW - 8).entries()) text(ln, X0 + 4, y + 8 + k * 7, 'tiny', P.u4, { shadow: P.void });
    flatButton(X0 + 4, y + 25, PW - 8, S0.button, S0.ok, S0.soul);
    if (S0.ok) panelHit(X0 + 4, y + 25, PW - 8, 15, 'svcRun', '', S0.cost || '');
    for (const [k, ln] of wrapTiny(S0.note || '', PW - 8).entries()) text(ln, X0 + 4, y + 46 + k * 7, 'tiny', P.u4, { shadow: P.void });
  }
  footerMoney(X0, PW, st);
}

// the RPG's tooltip card next to the pointer (V11, #76; grid doc 5c, 7k): tip { x, y, w, lines [kind, text] }, kinds
// h (the head), + and - (bullets), b (a plain line), n (a note); below the pointer, or above it near the bottom
function liveTip(tip) {
  const w = Math.min(tip.w || 132, W - 4);
  let h = 8; for (const [k, s] of tip.lines) h += k === 'h' ? 10 : wrapTiny(s, w - (k === 'n' || k === 'b' ? 12 : 17)).length * 7 + 1;
  const x = clamp(Math.round(tip.x + 8), 2, W - w - 2), y = tip.y + 14 + h > H - 2 ? Math.max(2, Math.round(tip.y - h - 6)) : Math.round(tip.y + 14);
  tipCard(x, y, w, tip.lines.map(([k, s]) => [k, s, null]));
}
