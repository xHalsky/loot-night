// ===========================================================================
// Game screen 474x232 = battle area 334x232 + side panel 140x232
// ===========================================================================
const GS_W = 474, GS_H = 232, BA_W = 334, SP_W = 140;
const BUFS = {};
function buf(key, w, h) { return (BUFS[key] = BUFS[key] || mkBuf(w, h, true)); }
function composeInto(ctx, F, r, ox) {
  const img = ctx.createImageData(W, H);
  compose(F, img, r.lights, r.ambient, r.tint, r.vig);
  ctx.putImageData(img, ox, 0);
}

// ---------------------------------------------------------------- shared data
const BAG_KNIGHT = [
  { icon: 'armor', r: 'epic', pow: 41 }, { icon: 'sword', r: 'legendary', pow: 72 }, { icon: 'ring', r: 'rare', pow: 27 },
  { icon: 'map', r: 'rare' }, { icon: 'boots', r: 'uncommon', pow: 14 }, { icon: 'helm', r: 'common', pow: 6, lock: true },
  { icon: 'unknown', r: 'epic' },
];
const SIDE_KNIGHT = {
  selected: 0, alert: 3, autoSalvage: true, gold: 650, scraps: 26, record: 4,
  gear: { weapon: { icon: 'sword', r: 'legendary', pow: 66 }, helm: { icon: 'helm', r: 'uncommon', pow: 18 }, armor: { icon: 'armor', r: 'epic', pow: 41 }, ring: { icon: 'ring', r: 'rare', pow: 29 } },
  stats: [['HP', 182], ['ATK', '12.6', '+3'], ['ARM', 6], ['SPD', 9], ['CRIT', 5], ['LUCK', 0]],
  bag: BAG_KNIGHT,
};
const SIDE_MAGE = {
  selected: 2, alert: 3, autoSalvage: true, gold: 702, scraps: 26, record: 4, newSlot: 7,
  gear: { weapon: { icon: 'tome', r: 'rare', pow: 33 }, helm: { icon: 'helm', r: 'common', pow: 9 }, armor: { icon: 'armor', r: 'uncommon', pow: 21 }, ring: { icon: 'ring', r: 'epic', pow: 19 }, trinket: { icon: 'amulet', r: 'rare', pow: 25 } },
  stats: [['HP', 96], ['ATK', '18.2', '+4'], ['ARM', 2], ['SPD', 11], ['CRIT', 9, '+2'], ['LUCK', 3, '-1']],
  bag: [...BAG_KNIGHT, { icon: 'ring', r: 'rare', pow: 31 }],
};

const SIDE_ROGUE = {
  selected: 1, alert: 3, autoSalvage: true, gold: 688, scraps: 26, record: 4, newSlot: 8,
  gear: { weapon: { icon: 'dagger', r: 'epic', pow: 38 }, helm: { icon: 'hood', r: 'rare', pow: 12 }, armor: { icon: 'armor', r: 'uncommon', pow: 17 }, boots: { icon: 'boots', r: 'rare', pow: 15 }, ring: { icon: 'ring', r: 'uncommon', pow: 11 }, trinket: { icon: 'wire', r: 'legendary', pow: 30 } },
  stats: [['HP', 118], ['ATK', '15.4', '+2'], ['ARM', 3], ['SPD', 14, '+3'], ['CRIT', 16, '+4'], ['LUCK', 6]],
  bag: [...BAG_KNIGHT, { icon: 'map', r: 'epic' }, { icon: 'dagger', r: 'rare', pow: 29 }],
};

// ---------------------------------------------------------------- screen 1: dungeon, curio
function screenDungeon(ctx, t) {
  setRes(BA_W, GS_H, BAR_Y); CX = 167;
  const F = buf('ba', BA_W, GS_H); clearFrame(F); bind(F);
  const r = drawDungeon(F, t); const p = r.p;
  bind(F); CLIP = null;
  const heal = p < 6.5 ? lerp(0.3, 0, p / 6.5) : 0;
  const HPD = Object.fromEntries(PARTY.map((m) => [m.id, clamp(m.hp + 0.25 + heal)])), hp = HEROES.map((h) => HPD[h.id]);
  PARTY.forEach((m) => hpBar(m.x, 120, HPD[m.id]));
  cornerOverlay({ where: 'Shadow Crypt · floor 4 · battle 1/3', flow: '1.4', flowBar: 0.42 }, t);
  portalButton({ inBattle: false });
  // after the shake: the Potion cart's blessing joins the buffs row for the rest of the run (dashed frame = this run)
  const blessed = p > 10.85 || p < 1;
  buffs([...(blessed ? [{ picon: 'potion', label: 'run', run: true, flash: p > 10.85 && p < 11.7 && Math.floor(p * 8) % 2 === 0 }] : []), { icon: 'can', label: '84s' }, { icon: 'ward', label: '12s', sweep: 0.45 }, { icon: 'crash', label: 'next', bad: true }], t);
  // curio window in the band (opens with a pixel-step wipe)
  const open = p < 6.9 ? 0 : p < 7.2 ? (p - 6.9) / 0.3 : p < 10.9 ? 1 : p < 11.15 ? 1 - (p - 10.9) / 0.25 : 0;
  if (open > 0) {
    const hh = Math.max(2, Math.round((62 * Math.round(open * 6)) / 6));
    CLIP = [60, 33 - (hh >> 1), 280, 33 + (hh >> 1)];
    curioWindow({
      title: 'Potion cart', line: 'Shake it: 50/50, +30% healing for the run or broken glass.',
      timer: p < 7.2 ? 1 : clamp(1 - (p - 7.2) / 6.2, 0.36, 1),
      choices: [
        { icon: 'skull', label: [['Shake it', P.u6]], cost: [['Noise +15', P.crimson], [' · 50/50', P.u5]], focus: p > 9.2, pressed: p > 10.55 && p < 10.85 },
        { label: [['Leave it', P.u6]], cost: [['Nothing happens', P.u5]] },
      ],
    }, t);
    CLIP = null;
  }
  // cart sign (diegetic) + feedback
  if (DG.cartX > 178 && DG.cartX < W + 40) { const sx = DG.cartX, sw = measure('PAY HERE', 'tiny') + 9, x0 = sx - (sw >> 1), y0 = CART_Y - 63; shadowU(x0, y0, sw, 11, { k: 0.6, r: 3, dx: 2, dy: 2 }); parchU(x0, y0, sw, 11, { v: 0.9, burn: 0.3 }); frameI(x0, y0, sw, 11, P.void); putI(x0 + 2, y0 + 2, P.u3); putI(x0 + sw - 3, y0 + 2, P.u3); text('PAY HERE', sx, y0 + 3, 'tiny', P.u1, { align: 'c' }); }
  if (p > 11.1 && p < 12.5) { const y = Math.round(112 - (p - 11.1) / 1.4 * 12); floater('+30% healing, this run', 74, y, P.g6); }
  if (p > 10.9 && p < 12.2) { const y = Math.round(CART_Y - 76 - (p - 10.9) / 1.3 * 14), x = (DG.cartX || 275) - 4; text('Noise +15', x, y, 'tiny', P.crimson, { align: 'c', outline: P.void }); }
  skillBar({ selected: 0, hp, cooldown: {}, queued: null }, t);
  composeInto(ctx, F, r, 0);
}

// ---------------------------------------------------------------- screen 2: battle
// the mob: fodder in two close lanes, bunched (back lane 190, front lane 202), the lieutenant behind them on the
// party's own lane (196), between the two. Drawn back to front.
const LANE = { back: 190, mid: CHAR_Y, front: 202 }, BAR_YF = { back: 117, mid: 121, front: 132 };
const FOES = [
  { id: 's3', kind: 'skel', x: 205, lane: 'back', hp: 0.9, ph: 1.7, o: { scarf: false } },
  { id: 'z2', kind: 'zomb', x: 245, lane: 'back', hp: 1, ph: 2.3, o: { sword: false }, tag: ['TAUNTED', 'd5'] },
  { id: 'necro', kind: 'necro', x: 304, lane: 'mid', hp: 0.92 },
  { id: 's1', kind: 'skel', x: 186, lane: 'front', hp: 0.46, ph: 0, tag: ['STAGGERED', 'u6'] },
  { id: 'z1', kind: 'zomb', x: 226, lane: 'front', hp: 0.8, ph: 0.9 },
  { id: 's2', kind: 'skel', x: 266, lane: 'front', hp: 0.7, ph: 3.1, o: { helm: false, shield: false } },
];
const FOE = Object.fromEntries(FOES.map((f) => [f.id, f]));
const LOOT_AT = [160, 201]; // the Grave Ring on the bone pile, in front of the knight
function screenBattle(ctx, t) {
  // marching order, swaps, the Hook and run blessings stage the scene (ranks.js)
  const RS = typeof rankStage === 'function' ? rankStage(t) : null, savedX = PARTY.map((m) => m.x), savedTags = FOES.map((f) => f.tag);
  if (RS) { PARTY.forEach((m) => (m.x = RS.x[m.id])); if (RS.hideTags) FOES.forEach((f) => (f.tag = null)); }
  setRes(BA_W, GS_H, BAR_Y); CX = 167;
  const F = buf('ba', BA_W, GS_H); clearFrame(F); bind(F);
  const L = 6, q = t % L, KN = PARTY.find((m) => m.id === 'knight');
  const SPL = [KN.x + 11, 156]; // bile lands on the knight's shield
  const r = drawDungeon(F, t, {
    battle: true, cam: 1004, foreOff: 98, // the foreground pillar frames the left edge instead of hiding the mage
    enemies(F, t, lights) {
      // a brazier at the back, between the lanes and the necromancer
      const bx = 286, by = 186;
      MAT = M_STONE; poly([[bx - 6, by - 14], [bx + 6, by - 14], [bx + 4, by - 10], [bx - 4, by - 10]], 0.4); line(bx - 4, by - 10, bx - 6, by, 0.35); line(bx + 4, by - 10, bx + 6, by, 0.35); line(bx, by - 10, bx, by, 0.3);
      for (let k = 0; k < 7; k++) { const h = 3 + Math.round(3 * (0.5 + 0.5 * Math.sin(t * 11 + k * 1.9))); for (let j = 0; j < h; j++) put(bx - 3 + k, by - 15 - j, 1 - j * 0.1, M_UMBER, 1); }
      // a fallen skeleton: bone pile under a loot beam
      skull(LOOT_AT[0] - 7, LOOT_AT[1] - 2, 0.7); bones(LOOT_AT[0] - 1, LOOT_AT[1] + 2, 0.6); bones(LOOT_AT[0] - 11, LOOT_AT[1] + 3, 0.5);
      FOES.forEach((f, n) => {
        const fy = LANE[f.lane], tt = t + (f.ph || 0);
        mulEllipse(f.x, fy, f.kind === 'necro' ? 0 : 11, 3, 0.3);
        TAG = 11 + n;
        if (f.kind === 'skel') skeletonWarrior(f.x, fy, tt, { b: Math.sin(tt * 2) > 0.6 ? -1 : 0, swing: f.id === 's1' && q > 4.4 && q < 4.8 ? 3 : 0, ...(f.o || {}) });
        else if (f.kind === 'zomb') zombie(f.x, fy, tt, f.o || {});
        else necromancer(f.x, fy, t, { cast: (t % 6) / 6 });
        if (f.id === 's1') EFX.hit = [...EFX.warrior];
        if (f.id === 'z2') EFX.spit = [...EFX.mouth];
        TAG = 0;
      });
      // the back lane stands further from the light: darker, so the two lanes read apart
      const backT = new Set(FOES.map((f, n) => (f.lane === 'back' ? 11 + n : 0)).filter(Boolean));
      for (let i = 0; i < W * H; i++) if (backT.has(F.T[i])) { F.G[i] *= 0.62; if (F.E[i] === 0) F.V[i] *= 0.9; }
      lights.push({ x: EFX.necro[0], y: EFX.necro[1], r: 70, i: 0.55, c: [1.0, 0.8, 1.6] });
      // cold shaft over the front rank, the brazier's warm pool over the back of the mob
      lights.push({ beam: true, x: 232, y: 0, x1: 206, y1: 204, w: 66, i: 0.62, air: 0.05, c: COLD, r: 1 });
      lights.push({ x: bx, y: by - 18, r: 95, i: 0.95 + 0.1 * Math.sin(t * 9), c: [1.2, 1.0, 0.74] });
      lights.push({ x: EFX.staff[0], y: EFX.staff[1], r: 90, i: 0.7, c: [1.0, 0.82, 1.55] });
    },
    fx(F, t, lights) {
      // rare drop: the ring lies glinting on the bone pile in a soft pool of light; the beam rises from it and fades
      { const [IX, IY] = LOOT_AT, pulse = 0.5 + 0.5 * Math.sin(t * 3);
        for (let y = IY - 4; y <= IY + 4; y++) for (let x = IX - 13; x <= IX + 13; x++) {
          const d = ((x - IX) / 13) ** 2 + ((y - IY) / 3.6) ** 2; if (d >= 1 || x < 0 || y >= H) continue;
          const i2 = y * W + x; if (F.T[i2]) continue;
          const core = ((x - IX) / 4.5) ** 2 + ((y - IY + 1) / 2.4) ** 2;
          F.X[i2] += (0.32 * (1 - d) ** 1.2 + (core < 1 ? 0.3 * (1 - core) : 0)) * (0.82 + 0.18 * pulse); if (d < 0.9) F.M[i2] = mixMat(x, y, F.M[i2], M_STONE, Math.min(1, (0.9 - d) / 0.6));
        }
        for (let y = IY - 3; y >= IY - 64; y--) {
          const a = (1 - (IY - 3 - y) / 61) ** 1.25, wob = 0.5 + 0.5 * Math.sin(y * 0.35 - t * 5);
          const th = BAYER8[((y & 7) << 3) | (IX & 7)];
          if (a * (1.1 + 0.3 * wob) > th) put(IX, y, 0.66 + 0.33 * a, M_STONE, 1);
          for (const sd of [-1, 1]) if (a * 0.8 > BAYER8[((y & 7) << 3) | ((IX + sd) & 7)]) put(IX + sd, y, 0.5 + 0.34 * a, M_STONE, 1);
        }
        for (let k = 0; k < 4; k++) { const q = (t * 0.35 + k / 4) % 1, y = Math.round(IY - 4 - q * 46), x = IX + Math.round(Math.sin(t * 2 + k * 1.7) * 2.2); if (q < 0.85) put(x, y, 0.95 - q * 0.5, M_STONE, 1); }
        // the beam's foot flares where it leaves the ring
        for (let h = 3; h <= 8; h++) for (const sd of [-2, 2]) if ((1 - (h - 3) / 6) * 0.7 > BAYER8[(((IY - h) & 7) << 3) | ((IX + sd) & 7)]) put(IX + sd, IY - h, 0.62, M_STONE, 1);
        // the ring in perspective: silver band round a dark hole, a cyan gem on top, a glint that comes and goes
        const RING = ['...g...', '..6M6..', '.66666.', '6.....6', '.55555.'];
        RING.forEach((r, j) => [...r].forEach((c, i3) => { const x = IX - 3 + i3, y = IY - 3 + j; if (c === '.') return; put(x, y, c === 'M' ? 1 : c === 'g' ? (pulse > 0.6 ? 0.95 : 0.7) : c === '6' ? 0.86 : 0.62, M_STONE, 1); }));
        for (let i3 = -2; i3 <= 2; i3++) { const i4 = IY * W + IX + i3; F.V[i4] = 0.06; F.M[i4] = M_STONE; F.E[i4] = 1; F.X[i4] = 0; }
        if (pulse > 0.72) { put(IX, IY - 5, 0.95, M_STONE, 1); put(IX - 2, IY - 3, 0.85, M_STONE, 1); put(IX + 2, IY - 3, 0.85, M_STONE, 1); }
        lights.push({ x: IX, y: IY - 3, r: 34, i: 0.5 + 0.15 * pulse, c: [0.8, 1.0, 1.3] });
      }
      // bile spat by the taunted zombie in the back lane, arcing over the front rank onto the knight's shield
      if (q > 3.0 && q < 3.5) {
        const [mx, my] = EFX.spit, pos = (k) => [lerp(mx, SPL[0], k), lerp(my, SPL[1], k) - Math.sin(k * Math.PI) * 34];
        for (let j = 5; j >= 1; j--) { const [x, y] = pos(clamp((q - 3.0) / 0.5 - j * 0.04)); put(Math.round(x), Math.round(y), 0.5 - j * 0.06, M_MOSS, 1); }
        const [x, y] = pos((q - 3.0) / 0.5);
        ellipse(x, y, 3.2, 2.6, 0.08, M_DUSK, 1); ellipse(x, y, 2.3, 1.8, 0.6, M_MOSS, 1); put(Math.round(x - 1), Math.round(y - 1), 0.86, M_MOSS, 1);
      }
      if (q > 3.5 && q < 4.6) {
        const k = clamp((q - 3.5) / 0.25), fade = q > 4.2 ? 1 - (q - 4.2) / 0.4 : 1;
        for (let n = 0; n < 7; n++) { const an = n * 0.9 + 0.4, d = (1.5 + hash(n, 1, 61) * 4) * k, r = 0.8 + hash(n, 2, 61) * 1.3; ellipse(SPL[0] + Math.cos(an) * d, SPL[1] + Math.sin(an) * d * 0.7, r, r, 0.56 * fade, M_MOSS, 1); }
        ellipse(SPL[0], SPL[1], 2.4, 2, 0.62 * fade, M_MOSS, 1);
        for (let n = 0; n < 3; n++) { const len = Math.round(clamp((q - 3.55 - n * 0.1) / 0.6) * (5 + n * 2)); for (let j = 0; j < len; j++) put(SPL[0] - 2 + n * 2, SPL[1] + 2 + j, (j === len - 1 ? 0.62 : 0.5) * fade, M_MOSS, 1); }
        if (q < 3.8) lights.push({ x: SPL[0], y: SPL[1], r: 24, i: 0.45 * (1 - k * 0.5), c: [0.8, 1.2, 0.9] });
      }
      // hellfire on the front skeleton
      if (q > 2.9 && q < 3.8) {
        const k = (q - 2.9) / 0.9, [wx, wy] = EFX.hit;
        for (let n = 0; n < 40; n++) { const an = hash(n, 1, 3) * 6.28, d = k * (6 + hash(n, 2, 3) * 16), up = k * k * 14 * hash(n, 3, 3); if (hash(n, Math.floor(t * 14), 5) < 0.2) continue; put(Math.round(wx + Math.cos(an) * d), Math.round(wy + Math.sin(an) * d * 0.8 - up), 1 - k * 0.5, M_UMBER, 1); }
        ellipse(wx, wy, 6 * (1 - k) + 1, 6 * (1 - k) + 1, 1, M_UMBER, 1);
        lights.push({ x: wx, y: wy, r: 80 * (1 - k * 0.5), i: 1.2 * (1 - k), c: [1.2, 1.0, 0.72] });
      }
    },
  });
  bind(F); CLIP = null;
  const HPB = { knight: 0.82, rogue: 0.74, mage: 0.58, priest: 0.9 }, hp = HEROES.map((h) => HPB[h.id]);
  PARTY.forEach((m) => hpBar(m.x, 120, HPB[m.id]));
  for (const f of FOES) {
    const by = BAR_YF[f.lane] - (f.kind === 'zomb' ? -1 : 0);
    hpBar(f.x - 2, by, f.hp, true);
    if (f.tag) markTag(f.x - 2, by - 10, f.tag[0], P[f.tag[1]]);
  }
  if (!RS || !RS.noSummon) windup(FOE.necro.x - 2, 104, 'Summon', (t % 6) / 6);
  // floating numbers
  if (q > 3.1 && q < 4.2) { const k = (q - 3.1) / 1.1; floater('38', EFX.hit[0] - 2, Math.round(166 - k * 12), P.moon, true); }
  if (q > 3.55 && q < 4.4) { const k = (q - 3.55) / 0.85; floater('-4', KN.x + 2, Math.round(146 - k * 10), P.crimson); }
  // loot name flying up from where it lay
  { const k = clamp((t % 6) / 1.6); text('Grave Ring', LOOT_AT[0], Math.round(LOOT_AT[1] - 12 - k * 50), 'tiny', P.s6, { align: 'c', outline: P.void }); }
  const fg = (t % 6) < 1.0;
  cornerOverlay({ where: 'Shadow Crypt · floor 4 · battle 2/3', flow: fg ? '1.6' : '1.6', flowBar: fg ? 0.08 : 0.12, flowGlow: fg }, t);
  portalButton({ inBattle: true });
  buffs((RS && RS.buffs) || [{ icon: 'can', label: '61s' }, { icon: 'ward', label: '4s', sweep: 0.75 }, { icon: 'taunt', label: '6s' }], t);
  skillBar({ selected: RS ? RS.order.indexOf(2) : 2, hp, cooldown: { 1: { f: 0.62, s: 4 }, X: { f: 0.8, s: 6 }, Q: { f: 0.35, s: 2 }, E: { f: 0.7, s: 21 } }, combo: { key: '2', label: 'x2' }, answer: 'S', queued: 'W', ult: { C: { need: 2 } }, autocast: { 1: true, Q: false }, ...(RS ? { order: RS.order, outpos: RS.outpos, stopped: RS.stopped, dropOn: RS.dropOn } : {}) }, t);
  if (RS && RS.draw) RS.draw();
  composeInto(ctx, F, r, 0);
  PARTY.forEach((m, n) => (m.x = savedX[n])); FOES.forEach((f, n) => (f.tag = savedTags[n]));
}

// ---------------------------------------------------------------- screen 3: floor map (lit, torn parchment; scribe's ink)
const INK = {
  swords: ['M.......M', '.M.....M.', '..M...M..', '...M.M...', '....M....', '...M.M...', '.uM...Mu.', 'u.......u'],
  chest: ['.MMMMMMM.', 'M.......M', 'MMMMMMMMM', 'M...M...M', 'M..MMM..M', 'M.......M', 'MMMMMMMMM', '.........'],
  skull: ['..MMMMM..', '.M.....M.', 'M.MM.MM.M', 'M.MM.MM.M', 'M...M...M', '.M.....M.', '..M.M.M..', '..MMMMM..'],
  stairs: ['......MMM', '......M..', '....MMM..', '....M....', '..MMM....', '..M......', 'MMM......', '.........'],
  waves: ['.........', '.MM...MM.', 'M..M.M..M', '.........', '.MM...MM.', 'M..M.M..M', '.........', '.........'],
  arrow: ['..M..........', '.MM......M.M.', 'MMMMMMMMMMMMM', '.MM......M.M.', '..M..........'],
  fleur: ['...M...', '..MMM..', '.M.M.M.', 'MM.M.MM', '.MMMMM.', '...M...', '..MMM..'],
};
// ink on parchment: VALUE strokes, lit and dithered with the paper
const INKV = 0.1;
function inkP(x, y, v = INKV, mat = M_DUSK) { put(x, y, v + 0.04 * (hash(x, y, 13) - 0.5), mat, 0); }
function inkLine(x0, y0, x1, y1, v, mat) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5)); for (let k = 0; k <= n; k++) inkP(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), v, mat); }
function inkSprite(name, x, y, v = INKV, mat = M_DUSK, dashed) { INK[name].forEach((r, j) => [...r].forEach((c, i) => { if (c === '.' || (dashed && ((i + j) & 1))) return; inkP(x + i, y + j, c === 'u' ? 0.3 : v, mat); })); }
function inkRing(cx, cy, r, v, mat, from = 0, to = 1, wob = 0, seed = 0) {
  const n = Math.ceil(r * 8);
  for (let k = Math.floor(n * from); k <= n * to; k++) { const an = k / n * 6.283, rr = r + wob * Math.sin(an * 3 + seed) ; inkP(Math.round(cx + Math.cos(an) * rr - 0.5), Math.round(cy + Math.sin(an) * rr - 0.5), v, mat); }
}
const qb = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

const MAP = { nodes: [{ x: 126, y: 50, k: 'swords', note: '3 fights' }, { x: 206, y: 70, k: 'chest', note: 'curio' }, { x: 130, y: 92, k: 'swords', note: '3 fights' }, { x: 210, y: 114, k: 'skull', note: 'elite' }], next: { x: 158, y: 140 }, PX0: 6, PY0: 4, PX1: 327, PY1: 229 };
let MAP_LAYER = null;
function buildMapLayer(cfg) {
  const L = mkBuf(BA_W, GS_H, true); clearFrame(L); bind(L); CLIP = null; MAT = M_UMBER; EMI = 0; TAG = 0; DXV = 0;
  const { PX0: x0, PY0: y0, PX1: x1, PY1: y1 } = MAP, paper = new Uint8Array(W * H);
  // the table: dark oak planks under the map
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const pl = Math.floor(y / 29), gr = fbm(x * 0.03, y * 0.6 + pl * 9, 61);
    put(x, y, (y % 29 === 0 ? 0.04 : 0.17 + 0.09 * gr + 0.03 * hash(pl, 0, 4)) , M_UMBER, 0);
  }
  // torn outline, a corner torn away (bottom left), a corner curled up (bottom right)
  const CURL = 24, C = x1 + y1 - CURL;
  const tear = (x, y) => {
    const dT = y - y0, dB = y1 - y, dL = x - x0, dR = x1 - x;
    const t = (d, c, s) => d - (1.2 + 3.6 * fbm(c * 0.11, s * 13, 71) + (hash(Math.floor(c / 9), s, 72) > 0.86 ? 2.5 : 0));
    let e = Math.min(t(dT, x, 1), t(dB, x, 2), t(dL, y, 3), t(dR, y, 4));
    e = Math.min(e, (x - x0) + (y1 - y) - 22 - 6 * fbm(x * 0.2, y * 0.2, 73));
    return e;
  };
  // cast shadow of the sheet onto the table
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = tear(x - 4, y - 5); if (e > -5) { const k = clamp((e + 5) / 6); B.V[y * W + x] *= 1 - 0.75 * k; }
  }
  // the sheet: mottled vellum, three fold panels at slightly different angles to the light, stains, foxing, scorched edge
  const fx = [x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3], fy = y0 + (y1 - y0) * 0.52;
  const rings = [[64, 186, 15, 4], [262, 54, 11, 5]], blots = [[300, 196, 16, 10], [44, 70, 20, 14], [180, 120, 30, 18]];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const e = tear(x, y); if (e < 0) continue;
    if ((x1 - x) + (y1 - y) < CURL) continue;
    paper[y * W + x] = 1;
    let v = 0.9 - 0.1 * fbm(x * 0.045, y * 0.06, 81) - 0.04 * (GR(x, y) - 0.5) - 0.07 * clamp(((x - 150) / 190) ** 2 + ((y - 100) / 150) ** 2);
    const panel = (x < fx[0] ? 0 : x < fx[1] ? 1 : 2) + (y < fy ? 0 : 3);
    v += [0.03, -0.035, 0.015, -0.01, -0.05, 0.0][panel];
    for (const [cx, cy, r, w] of rings) { const d = Math.abs(Math.hypot(x - cx, (y - cy) * 1.1) - r); if (d < w * 0.5) v -= 0.07 * (1 - d / (w * 0.5)) * (0.6 + 0.4 * hash(Math.floor(Math.atan2(y - cy, x - cx) * 6), 1, 82)); }
    for (const [cx, cy, rx, ry] of blots) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d < 1) v -= 0.06 * (1 - d) * fbm(x * 0.15, y * 0.15, 83); }
    if (hash(x >> 1, y >> 1, 84) > 0.993) v -= 0.12;
    const burn = clamp(1 - e / 6);
    v = v * (1 - 0.72 * burn * burn);
    put(x, y, v, e < 0.9 ? M_DUSK : M_UMBER, 0);
  }
  // creases: a dark valley with a lit ridge beside it
  for (let y = y0; y <= y1; y++) for (const cx of fx) { const x = Math.round(cx + 1.5 * Math.sin(y * 0.05)); if (paper[y * W + x]) { put(x, y, B.V[y * W + x] * 0.7); if (paper[y * W + x + 1]) put(x + 1, y, Math.min(1, B.V[y * W + x + 1] + 0.1)); } }
  for (let x = x0; x <= x1; x++) { const y = Math.round(fy + 1.2 * Math.sin(x * 0.04)); if (paper[y * W + x]) { put(x, y, B.V[y * W + x] * 0.7); if (paper[(y + 1) * W + x]) put(x, y + 1, Math.min(1, B.V[(y + 1) * W + x] + 0.09)); } }
  // wrinkles
  for (let k = 0; k < 26; k++) {
    let x = x0 + 12 + hash(k, 1, 91) * (x1 - x0 - 24), y = y0 + 10 + hash(k, 2, 91) * (y1 - y0 - 20), an = hash(k, 3, 91) * 6.28, len = 8 + hash(k, 4, 91) * 22;
    for (let s = 0; s < len; s++) { an += (hash(k, s, 92) - 0.5) * 0.35; x += Math.cos(an); y += Math.sin(an); const xi = Math.round(x), yi = Math.round(y); if (!paper[yi * W + xi] || !paper[(yi + 1) * W + xi]) continue; put(xi, yi, B.V[yi * W + xi] * 0.86); put(xi, yi + 1, Math.min(1, B.V[(yi + 1) * W + xi] + 0.05)); }
  }
  // the curl: back of the sheet, shaded toward the fold, with a shadow under it
  for (let y = y1 - CURL; y <= y1; y++) for (let x = x1 - CURL; x <= x1; x++) {
    if (x + y >= C || tear(x, y) < 0) continue;
    const q = (C - x - y) / CURL;
    put(x, y, 0.8 + 0.18 * (1 - q) - 0.03 * GR(x, y), M_UMBER, 0);
    if (x + y === C - 1) put(x, y, 0.95, M_UMBER, 0);
    if (x === x1 - CURL || y === y1 - CURL || x + y === C - 1 - CURL) inkP(x, y, 0.2);
  }
  for (let y = y1 - CURL - 3; y <= y1; y++) for (let x = x1 - CURL - 3; x <= x1; x++) { const s2 = x + y; if (s2 >= C - CURL - 4 && s2 < C - CURL && paper[y * W + x]) B.V[y * W + x] *= 0.86; }
  // two scorched holes
  for (const [cx, cy, r] of (cfg && cfg.holes) || [[300, 108, 3.2], [96, 214, 2.4]]) for (let y = Math.floor(cy - r - 3); y <= cy + r + 3; y++) for (let x = Math.floor(cx - r - 3); x <= cx + r + 3; x++) {
    const d = Math.hypot(x - cx, (y - cy) * 1.2) - r * (0.8 + 0.4 * hash(x, y, 93)); if (d < 0) { put(x, y, 0.12, M_UMBER, 0); paper[y * W + x] = 0; } else if (d < 3 && paper[y * W + x]) put(x, y, B.V[y * W + x] * (0.35 + 0.2 * d), d < 1.2 ? M_DUSK : M_UMBER, 0);
  }
  const P_ = (x, y) => paper[y * W + x];
  const inkIf = (x, y, v, m) => { if (P_(x, y)) inkP(x, y, v, m); };
  // double-ruled border (ink outer, red inner) with corner fleurons
  const bx0 = x0 + 8, by0 = y0 + 8, bx1 = x1 - 8, by1 = y1 - 8;
  for (let x = bx0; x <= bx1; x++) { inkIf(x, by0, 0.16); inkIf(x, by1, 0.16); if (x > bx0 + 2 && x < bx1 - 2) { inkIf(x, by0 + 3, 0.62, M_DANGER); inkIf(x, by1 - 3, 0.62, M_DANGER); } }
  for (let y = by0; y <= by1; y++) { inkIf(bx0, y, 0.16); inkIf(bx1, y, 0.16); if (y > by0 + 2 && y < by1 - 2) { inkIf(bx0 + 3, y, 0.62, M_DANGER); inkIf(bx1 - 3, y, 0.62, M_DANGER); } }
  for (const [cx, cy, sx, sy] of [[bx0, by0, 1, 1], [bx1, by0, -1, 1], [bx0, by1, 1, -1], [bx1, by1, -1, -1]]) {
    for (let k = 0; k < 7; k++) { const an = k / 6 * 4.4; inkIf(Math.round(cx + sx * (5 + Math.cos(an) * 2.6)), Math.round(cy + sy * (5 + Math.sin(an) * 2.6)), 0.14); }
    inkIf(cx + sx * 5, cy + sy * 5, 0.5, M_DANGER); inkIf(cx + sx, cy + sy, 0.14); inkIf(cx + sx * 2, cy + sy * 2, 0.14);
  }
  // cartouche: a ribbon scroll with swallow-tailed ends folding behind
  const title = cfg ? cfg.title : 'Shadow Crypt', tw = measure(title, 'black'), rw = tw + 22, rx0 = Math.round(167 - rw / 2), ry0 = 8, rh = 15;
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? rx0 - 11 : rx0 + rw;
    for (let j = 0; j < rh; j++) for (let i = 0; i < 11; i++) {
      const fromEnd = sd < 0 ? i : 10 - i;
      if (Math.abs(j - (rh >> 1)) < 4 - fromEnd * 0.9) continue;
      put(ex + i, ry0 + 4 + j, 0.55 + 0.08 * (j / rh) - (fromEnd > 8 ? 0.12 : 0), M_UMBER, 1);
      if (j === 0 || j === rh - 1) inkP(ex + i, ry0 + 4 + j, 0.12);
    }
    for (let j = 0; j < 4; j++) put(sd < 0 ? rx0 + j - 1 : rx0 + rw - j, ry0 + rh + j - 1, 0.26, M_UMBER, 1);
  }
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
    const x = rx0 + i, y = ry0 + j;
    if (j === 0 || j === rh - 1 || i === 0 || i === rw - 1) inkP(x, y, 0.12);
    else if (j >= 3 && j <= rh - 3 && i >= 2 && i <= rw - 3) putI(x, y, P.u6);
    else put(x, y, j < 3 ? 0.78 + 0.03 * j : 0.72, M_UMBER, 1);
  }
  for (const ox of [rx0 + 4, rx0 + rw - 5]) { putI(ox, ry0 + 7, P.wine); putI(ox, ry0 + 8, P.wine); putI(ox - 1, ry0 + 7, P.wine); putI(ox + 1, ry0 + 8, P.wine); }
  text(title, 167, ry0 + 3, 'black', P.u1, { align: 'c' });
  text(cfg ? cfg.sub : 'Floor 4 cleared · choose the stairs down', 167, ry0 + 21, 'tiny', P.u1, { align: 'c' });
  if (cfg) { cfg.draw(P_); L.paper = paper; return L; }   // paths.js: the route choice (#52)
  // the descent: inked stair-roads between gilded roundels
  const N = MAP.nodes;
  for (let k = 0; k < N.length - 1; k++) stairRoad(N[k], N[k + 1], k % 2 ? -1 : 1, P_);
  N.forEach((n, k) => {
    roundel(n.x, n.y, String(k + 1), k === 3 ? M_DANGER : k % 2 ? M_STONE : M_DUSK);
    const left = n.x < 167, nw = measure(n.note, 'tiny');
    if (left) { text(n.note, n.x - 13, n.y - 2, 'tiny', P.u1, { align: 'r' }); inkSprite(n.k, n.x - 13 - nw - 13, n.y - 4, 0.12); }
    else { inkSprite(n.k, n.x + 13, n.y - 4, 0.12); text(n.note, n.x + 25, n.y - 2, 'tiny', P.u1); }
  });
  // compass rose: gilded points, inked halves, fleur-de-lis north
  const [cx, cy] = [56, 128];
  inkRing(cx, cy, 15, 0.14); inkRing(cx, cy, 12.5, 0.62, M_DANGER);
  for (let k = 0; k < 32; k++) { const an = k / 32 * 6.283; if (k % 4) inkP(Math.round(cx + Math.cos(an) * 14 - 0.5), Math.round(cy + Math.sin(an) * 14 - 0.5), 0.22); }
  for (let k = 0; k < 8; k++) {
    const an = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? 9 : 17, wd = k % 2 ? 2 : 3.2;
    for (let s2 = 0; s2 <= L; s2++) for (let o = -wd; o <= wd; o += 0.5) {
      const half = wd * (1 - s2 / L); if (Math.abs(o) > half) continue;
      const x = Math.round(cx + Math.cos(an) * s2 - Math.sin(an) * o), y = Math.round(cy + Math.sin(an) * s2 + Math.cos(an) * o);
      if (k % 2) inkP(x, y, 0.2); else if (o >= 0) put(x, y, 0.84, M_LOOT, 0); else inkP(x, y, 0.12);
    }
  }
  put(cx, cy, 0.95, M_LOOT, 0); inkSprite('fleur', cx - 3, cy - 26, 0.12);
  // wax seal: pressed crimson disc with a raised rim and cross, two short ribbon tails
  const [sx, sy] = [292, 136];
  for (const [tx, sl] of [[-4, -0.5], [4, 0.5]]) for (let s2 = 0; s2 < 11; s2++) for (let o = -2; o <= 2; o++) {
    const x = Math.round(sx + tx + sl * s2 + o), y = sy + 5 + s2; if (s2 === 10 && Math.abs(o) < 1) continue;
    put(x, y, Math.abs(o) === 2 ? 0.12 : 0.36 + 0.05 * o, M_DUSK, 0);
  }
  for (let y = sy - 11; y <= sy + 11; y++) for (let x = sx - 11; x <= sx + 11; x++) {
    const an = Math.atan2(y + 0.5 - sy, x + 0.5 - sx), rr = 9 + 0.9 * Math.sin(an * 6 + 1.3), d = Math.hypot(x + 0.5 - sx, y + 0.5 - sy);
    if (d > rr) continue;
    const nx = (x + 0.5 - sx) / 9, ny = (y + 0.5 - sy) / 9;
    let v;
    if (d > rr - 1) v = 0.5;
    else if (Math.abs(d - 6.3) < 0.8) v = 0.98 - 0.25 * (nx + ny) * 0.5;
    else if (Math.abs(d - 5.3) < 0.6) v = 0.55;
    else v = 0.86 - 0.2 * (nx * 0.6 + ny * 0.8);
    if (d < 4.6 && (Math.abs(x + 0.5 - sx) < 1 || Math.abs(y + 0.5 - sy) < 1)) v = 0.55;
    put(x, y, clamp(v), M_DANGER, 1);
  }
  // marginal doodle: a skull over crossed bones
  const [dx, dy] = [292, 64];
  inkLine(dx - 7, dy + 3, dx + 7, dy + 11, 0.2); inkLine(dx - 7, dy + 11, dx + 7, dy + 3, 0.2);
  inkSprite('skull', dx - 4, dy - 2, 0.12);
  // footer note
  text('Maps from loot add paths. The clock runs at 25% while you choose.', 167, 208, 'tiny', P.u1, { align: 'c' });
  MAP_LAYER = L; MAP_LAYER.paper = paper;
  return L;
}
// gilded roundel: gold leaf ring lit from the top left, enamel field, blackletter numeral
function roundel(cx, cy, num, field, dashed) {
  for (let y = cy - 10; y <= cy + 10; y++) for (let x = cx - 10; x <= cx + 10; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (d > 9.2) continue;
    if (dashed) { if (d > 8 && ((Math.round(Math.atan2(dy, dx) * 6)) & 1)) inkP(x, y, 0.22); continue; }
    if (d > 8.4) inkP(x, y, 0.1);
    else if (d > 6.2) put(x, y, clamp(0.78 - 0.3 * (dx * 0.55 + dy * 0.8) / 8 + (d < 6.9 ? -0.18 : 0)), M_LOOT, 0);
    else put(x, y, clamp((field === M_DANGER ? 0.62 : field === M_STONE ? 0.28 : 0.3) + 0.12 * (-(dx + dy) / 9)), field, 0);
  }
  if (!dashed) text(num, cx, cy - 5, 'black', P.pale, { align: 'c', shadow: P.void });
}
// two inked rails with rungs: a stair-road bending between floors
function stairRoad(a, b, bend, paperAt) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const A = [a.x + ux * 10, a.y + uy * 10], Bp = [b.x - ux * 10, b.y - uy * 10], Cc = [(A[0] + Bp[0]) / 2 - uy * 12 * bend, (A[1] + Bp[1]) / 2 + ux * 12 * bend];
  const n = Math.ceil(L * 2.2); let lastR = -9;
  for (let k = 0; k <= n; k++) {
    const t = k / n, x = qb(A[0], Cc[0], Bp[0], t), y = qb(A[1], Cc[1], Bp[1], t);
    const tx = 2 * (1 - t) * (Cc[0] - A[0]) + 2 * t * (Bp[0] - Cc[0]), ty = 2 * (1 - t) * (Cc[1] - A[1]) + 2 * t * (Bp[1] - Cc[1]), tl = Math.hypot(tx, ty), nx = -ty / tl, ny = tx / tl;
    inkP(Math.round(x + nx * 1.6), Math.round(y + ny * 1.6), 0.13); inkP(Math.round(x - nx * 1.6), Math.round(y - ny * 1.6), 0.13);
    const arc = t * L; if (arc - lastR >= 3.5) { lastR = arc; inkP(Math.round(x), Math.round(y), 0.3); }
    for (const ft of [0.25, 0.75]) if (Math.abs(t - ft) < 0.5 / n) { const sd = ft < 0.5 ? 1 : -1; for (let q = 0; q < 6; q++) { const an = q / 5 * 3.4; inkP(Math.round(x + nx * sd * (3 + 2.2 * Math.sin(an)) + (tx / tl) * (2.2 * Math.cos(an) - 1)), Math.round(y + ny * sd * (3 + 2.2 * Math.sin(an)) + (ty / tl) * (2.2 * Math.cos(an) - 1)), 0.16); } }
    if (Math.abs(t - 0.5) < 0.5 / n) {
      for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) { const lob = Math.min(Math.hypot(ox, oy + 1.6), Math.hypot(ox, oy - 1.6), Math.hypot(ox + 1.6, oy), Math.hypot(ox - 1.6, oy)); if (lob < 1.5) put(Math.round(x + ox), Math.round(y + oy), 0.92 - 0.12 * (ox + oy) / 3, M_LOOT, 1); else if (lob < 2.2) inkP(Math.round(x + ox), Math.round(y + oy), 0.12); }
      put(Math.round(x), Math.round(y), 0.9, M_DANGER, 1);
    }
  }
}
// path cards: bronze-framed leather plates pinned over the map
function pathCard(x, y, c, hov) {
  const w = 96, h = 34, yy = hov ? y - 2 : y;
  shadowU(x, yy, w, h, { k: hov ? 0.7 : 0.55, r: hov ? 5 : 3, dx: 2, dy: hov ? 5 : 3 });
  leatherU(x + 3, yy + 3, w - 6, h - 6, { v: 0.15, vig: 0.3 });
  mouldU(x, yy, w, h, { mat: hov ? M_LOOT : M_UMBER, k: hov ? 1.05 : 0.9, bosses: false });
  bossU(x + w / 2 - 2, yy - 1, 5);
  wellU(x + 5, yy + 6, 16, 16, { v: 0.1 }); if (c.ink) sprite(x + 8, yy + 10, INK[c.ink].map((r) => r.replace(/[Mu]/g, 'u'))); else icon('map', x + 7, yy + 8);
  text(c.name, x + 25, yy + 6, 'tiny', hov ? P.moon : P.u6, { shadow: P.void });
  text(c.line, x + 25, yy + 14, 'tiny', P[RARITY_TEXT[c.r]], { shadow: P.void });
  text(c.cost, x + 25, yy + 22, 'tiny', P.u5, { shadow: P.void });
  if (hov) spr(x + w / 2 - 2, yy + h + 1, ['aaaaa', '.aaa.', '..a..'], { a: P.gold });
}
function screenMap(ctx, t) {
  setRes(BA_W, GS_H); CX = 167;
  const L = MAP_LAYER || buildMapLayer();
  const F = buf('ba', BA_W, GS_H); bind(F); CLIP = null;
  F.V.set(L.V); F.M.set(L.M); F.E.set(L.E); F.A.set(L.A); F.T.fill(0); F.DX.fill(0); F.I.set(L.I); F.G.fill(1); F.X.fill(0);
  MAT = M_UMBER; EMI = 0;
  const N = MAP.nodes, h = N[3], nx = MAP.next, off = Math.floor(t * 6);
  // you are here: a red ring, inked twice with a marching break, and a manicule pointing at it
  for (const [r, sd] of [[13.5, 0], [12.6, 2]]) { const from = ((off * 0.02) + sd * 0.1) % 1; inkRing(h.x, h.y, r, 0.95, M_DANGER, from, from + 0.88, 0.6, sd); }
  inkSprite('arrow', h.x + 13 + (Math.floor(t * 2) % 2), h.y + 9, 0.95, M_DANGER);
  // hovered path: the road to the next slot draws itself in red; the room sketches in
  const cards = [
    { name: 'Floor 5', line: 'the stairs down', cost: 'deeper, better loot', r: 'common', ink: 'stairs' },
    { name: 'Flooded Vault', line: 'rare map', cost: '+1 loot roll', r: 'rare', ink: 'waves' },
    { name: 'Bone Gallery', line: 'epic map', cost: 'elite · epic drop', r: 'epic', ink: 'skull' },
  ];
  const hov = Math.floor(t / 3) % 3, qd = clamp((t % 3) / 0.9), c = cards[hov];
  { const dx = nx.x - h.x, dy = nx.y - h.y, Ln = Math.hypot(dx, dy), n = Math.ceil(Ln * 2);
    for (let k = 0; k <= n * qd; k++) { const q = k / n; if (((k >> 2) + off) & 1) continue; const px = Math.round(h.x + dx * q * 0.84 + dx * 0.08), py = Math.round(h.y + dy * q * 0.84 + dy * 0.08); inkP(px, py, 0.95, M_DANGER); inkP(px + 1, py, 0.8, M_DANGER); } }
  roundel(nx.x, nx.y, '5', M_DUSK, qd < 0.5);
  if (qd >= 0.5) { roundel(nx.x, nx.y, '5', hov === 0 ? M_DUSK : hov === 1 ? M_STONE : M_MAGIC); inkSprite(c.ink, nx.x - 24, nx.y - 4, 0.12, M_DUSK, qd < 1); text(c.name, nx.x + 13, nx.y - 2, 'tiny', P.u1); }
  else text('?', nx.x, nx.y - 2, 'tiny', P.u2, { align: 'c' });
  text('you are here', h.x + 27, h.y + 11, 'tiny', P.wine);
  // Flow + portal (HUD over the map)
  const fw = text('Flow x1.4', 20, 20, 'tiny', P.u1);
  groove(20 + fw + 4, 21, 30, 4, 0.42, M_STONE, [0.84, 0.66]);
  portalPlate(W - 18, 15, '15 min', true, { right: true });
  cards.forEach((cc, k) => pathCard(18 + k * 101, 164, cc, k === hov));
  const fl = 0.96 + 0.04 * Math.sin(t * 7) * Math.sin(t * 2.3);
  composeInto(ctx, F, { lights: [{ x: -30, y: -40, r: 820, i: 0.66 * fl, c: [1.1, 1.0, 0.86] }, { x: 380, y: 300, r: 330, i: 0.2, c: [0.72, 0.85, 1.3] }], ambient: [0.5, 0.49, 0.55], tint: 0.1, vig: 0 }, 0);
}

// ---------------------------------------------------------------- side panel + assembly
function drawSide(ctx, st, t) {
  setRes(SP_W, GS_H);
  const S = buf('sp', SP_W, GS_H); clearFrame(S); bind(S); CLIP = null;
  if (st.town) (typeof sidePanelTabs === 'function' ? sidePanelTabs : sidePanelTown)(st, t); else sidePanel(st, t);
  composeInto(ctx, S, { lights: [], ambient: [0.1, 0.1, 0.2], tint: 0, vig: 0 }, BA_W);
}
let GS_CANVAS = null;
function drawScreen(name, t, o = {}) {
  if (!GS_CANVAS) { GS_CANVAS = document.createElement('canvas'); GS_CANVAS.width = GS_W; GS_CANVAS.height = GS_H; }
  const ctx = GS_CANVAS.getContext('2d');
  const sideDue = o.force || name !== drawScreen.last || Math.floor(t * 2) !== drawScreen.tick;
  drawScreen.last = name; drawScreen.tick = Math.floor(t * 2);
  if (name === 'battle') { screenBattle(ctx, t); if (sideDue) drawSide(ctx, SIDE_MAGE, t); }
  else if (name === 'town') {
    // the side panel's tabs (townpanel.js): a service holds its building lit on the map; the Skill Tree covers the town (tree.js)
    const tab = typeof TOWN_TAB !== 'undefined' ? TOWN_TAB : 'town', svc = typeof SERVICE_AT !== 'undefined' && SERVICE_AT[tab];
    if (tab === 'tree') screenTree(ctx, t); else screenTown(ctx, t, svc ? { ...o, hover: svc, noTip: true } : o);
    if (sideDue || tab === 'tree') drawSide(ctx, { town: true, tab, ...SIDE_TOWN, souls: typeof TREE_SOULS !== 'undefined' ? TREE_SOULS : 26 }, t);
  }
  else if (name === 'map') { screenPaths(ctx, t); if (sideDue) drawSide(ctx, SIDE_ROGUE, t); }
  else { screenDungeon(ctx, t); if (sideDue) drawSide(ctx, SIDE_KNIGHT, t); }
  if (name === 'battle' && typeof RPG_MONO !== 'undefined' && RPG_MONO !== 'full') return monoScreen(GS_CANVAS);   // mono.js
  return GS_CANVAS;
}
