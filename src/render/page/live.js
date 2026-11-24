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
  portalButton({ inBattle: !vm.portalOk });
  if (vm.portalOk) liveHit(4, 28, 54, 19, 'toTown', '', 'Back to the city, 15 min');
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
