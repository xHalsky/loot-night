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
  portalButton({ inBattle: !vm.portalOk, label: vm.bank });
  if (vm.portalOk) liveHit(4, 28, 54, 19, 'toTown', '', vm.bank === '15 min' ? 'Back to the city, 15 min' : `Back to the city, 15 min: banks this run (${vm.bank.slice(5)})`);
  buffs(vm.buffs, t);
  vm.buffs.forEach((b, k) => liveHit(W - 4 - 13 - k * 16, 3, 13, 13, '', '', b.tip));
  // the curio card in the band
  if (vm.curio && vm.curio.card) {
    curioWindow(vm.curio.card, t);
    vm.curio.card.choices.forEach((c, k) => { if (c.act) liveHit(84 + 7 + k * 89, 4 + 26, 85, 20, c.act, c.arg, c.tip); });
    liveHit(84 + 188 - 10, 0, 12, 10, 'curioLeave', '', 'Walk past');
  }
  // the skill bar: groups in marching order, keys with the hero
  const bar = vm.bar;
  skillBar({ ...bar, order: bar.order.map((id) => LIVE_HERO[id]), auras: false }, t);
  const gx = [6, 88, 170, 252];
  bar.order.forEach((id, n) => {
    const x = gx[n];
    liveHit(x, BAR_Y + 3, 22, 24, 'heroTab', bar.heroIdx[n], '');
    for (let k = 0; k < 3; k++) liveHit(x + 28 + k * 16, BAR_Y + 6, 15, 18, 'ability', `${bar.heroIdx[n]},${k + 1}`, `skill:${bar.heroIdx[n]}:${k + 1}`);
  });
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
  button(W - 72, 15, 54, 19, [['Town portal', 'tiny', P.moon], [st.portalLabel, 'tiny', st.portalOk ? P.d6 : P.u4]], st.portalOk ? { mat: M_MAGIC } : { off: true });
  if (st.portalOk) liveHit(W - 72, 15, 54, 19, 'toTown', '', 'Back to the city, 15 min: banks this run');
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
