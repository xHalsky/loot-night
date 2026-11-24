// ===========================================================================
// Marching order (handoff 1.6, #52) and run blessings (1.5b): ranks, home ranks, auras, the swap,
// the Hook that breaks the line, and the tooltips. Rank 1 is the front (right in the picture,
// left in the skill bar). Keys belong to the hero, not to the rank.
// ===========================================================================
let BATTLE_STATE = 'fight';
const RANK_X = [126, 87, 56, 21];
const HOME = { knight: [1, 2], rogue: [1, 3], mage: [3, 4], priest: [2, 4] };
const HNAME = { knight: 'Knighten', rogue: 'Garrote', mage: 'Magoo', priest: 'Healero' };
const HIDX = { knight: 0, rogue: 1, mage: 2, priest: 3 };
const outOfRank = (id, r) => r < HOME[id][0] || r > HOME[id][1];
// auras: a 5x5 glyph in the giver's class colour, sitting between giver and receiver in the skill bar
const AURA = {
  knight: { back: true, g: ['55555', '56M65', '56665', '.565.', '..5..'], line: 'takes 25% less damage' },
  rogue: { front: true, g: ['..C..', '..C..', 'CCYCC', '..C..', '..C..'], line: 'gets +10% crit' },
  mage: { front: true, g: ['.XXX.', 'XvMvX', 'XvMMX', 'XvvvX', '.XXX.'], line: 'gets 10% shorter cooldowns' },
  priest: { front: true, back: true, g: ['..O..', '..O..', 'OOYOO', '..O..', '..O..'], line: 'regenerates 1% HP per second' },
};
function auraGlyphs(ids, hps, gx, y0) {
  for (let n = 0; n < ids.length - 1; n++) {
    const a = ids[n], b = ids[n + 1], gl = [];
    if (hps[n] > 0 && AURA[a].back) gl.push(AURA[a].g);       // the one in front gives to the one behind
    if (hps[n + 1] > 0 && AURA[b].front) gl.push(AURA[b].g);  // the one behind gives to the one in front
    const x = gx[n] + 76, ys = gl.length === 2 ? [y0 + 8, y0 + 16] : [y0 + 12];
    gl.forEach((g, k) => {
      const y = ys[k];
      rectI(x - 1, y - 1, 7, 7, P.void); putI(x - 1, y - 1, P.u2); putI(x + 5, y - 1, P.u2); putI(x - 1, y + 5, P.u2); putI(x + 5, y + 5, P.u2);
      g.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') putI(x + i, y + j, P[PX[c]]); }));
    });
  }
}
// marks on a hero's group: out of position (crimson tab under the portrait), stopped while swapping
function rankMarks(x, y0, id, n, st, t) {
  if (st.outpos && st.outpos.includes(id)) {
    const tx = x + 3, ty = y0 + 21;
    rectI(tx, ty, 16, 7, P.crimson); rectI(tx, ty + 6, 16, 1, P.wine);
    text(st.outLabel || 'x0.7', tx + 8, ty + 1, 'tiny', P.moon, { align: 'c' });
  }
  if (st.stopped && st.stopped.includes(id)) {
    for (let j = y0 + 6; j < y0 + 24; j++) for (let i = x + 28; i < x + 75; i++) if ((i + j) & 1) putI(i, j, P.void);
    const w = measure('swap', 'tiny') + 6, bx = x + 51 - (w >> 1);
    rectI(bx, y0 + 11, w, 8, P.u1); frameI(bx, y0 + 11, w, 8, P.u4); text('swap', bx + 3, y0 + 12, 'tiny', P.u6);
  }
  if (st.dropOn === n) { const on = Math.floor(t * 6) & 1; for (let k = 0; k < 24; k++) if (((k >> 1) + on) & 1) { putI(x - 1 + k, y0 + 2, P.gold); putI(x - 1 + k, y0 + 27, P.gold); } for (let k = 0; k < 26; k++) if (((k >> 1) + on) & 1) { putI(x - 1, y0 + 2 + k, P.gold); putI(x + 22, y0 + 2 + k, P.gold); } }
}
// the RPG's pointer: a bronze gauntlet arrow with a void outline
const CURSOR = ['v.......', 'vv......', 'vuv.....', 'vuuv....', 'vuuuv...', 'vuuuuv..', 'vuuutvv.', 'vutvv...', 'vvv.v...', 'v...vv..', '.....v..'];
function cursorAt(x, y) { sprite(Math.round(x), Math.round(y), CURSOR); }
// a hero's portrait lifted under the cursor while dragging (dithered so the bar shows through)
function ghostPortrait(id, x, y) {
  const L = PORTRAIT_LIT[id] || bakePortrait(id);
  frameI(x, y, 22, 24, P[CLASS_COL[id]]);
  for (let j = 0; j < 20; j++) for (let i = 0; i < 18; i++) if ((i + j) & 1) putI(x + 2 + i, y + 2 + j, L[j * 18 + i]);
}
function wrapTiny_shadowed(str, maxW) { const out = []; let cur = ''; for (const w of str.split(' ')) { const n = cur ? cur + ' ' + w : w; if (measure(n, 'tiny') > maxW && cur) { out.push(cur); cur = w; } else cur = n; } if (cur) out.push(cur); return out; }
// a tooltip card: the path cards' bronze and leather; lines [kind, text]: 'h' head, '+' you get, '-' it costs, 'n' note
function tipCard(x, y, w, lines) {
  let h = 8; for (const [k, s] of lines) h += k === 'h' ? 10 : wrapTiny(s, w - (k === 'n' ? 12 : 17)).length * 7 + 1;
  shadowU(x, y, w, h, { k: 0.7, r: 4, dx: 2, dy: 3 });
  leatherU(x + 3, y + 3, w - 6, h - 6, { v: 0.13, vig: 0.25 });
  mouldU(x, y, w, h, { k: 0.9, bosses: false });
  let yy = y + 5;
  for (const [k, s, extra] of lines) {
    if (k === 'h') { const nw = text(s, x + 6, yy, 'tiny', P.moon, { shadow: P.void }); if (extra) extra(x + 6 + nw + 4, yy); yy += 10; continue; }
    const tx = k === 'n' ? x + 6 : x + 11, col = k === '+' ? P.g5 : P.crimson;
    if (k === '+') { putI(x + 7, yy + 1, col); putI(x + 6, yy + 2, col); putI(x + 7, yy + 2, col); putI(x + 8, yy + 2, col); putI(x + 7, yy + 3, col); }
    if (k === '-') { putI(x + 6, yy + 2, col); putI(x + 7, yy + 2, col); putI(x + 8, yy + 2, col); }
    for (const ln of wrapTiny(s, w - (k === 'n' ? 12 : 17))) { text(ln, tx, yy, 'tiny', k === 'n' ? P.u4 : P.u6, { shadow: P.void }); yy += 7; }
    yy += 1;
  }
  return h;
}
// a run-blessing chip for the buffs row; the curio it came from is its icon
const BLESS = {
  potion: { picon: 'potion', name: 'Potion cart', bless: '+30% healing', cost: 'Noise +15 (paid when you shook it)' },
  altar: { picon: 'altar', name: 'Blood Altar', bless: '+30% crit', cost: 'Heroes lose 1% HP per second outside fights' },
  moonwell: { picon: 'moonwell', name: 'Moonwell', bless: 'Ultimates charge 40% faster', cost: 'Flow dropped to x1 (paid when you drank)' },
};

// ---------------------------------------------------------------- per-state staging of the battle screen
// returns the party's x by hero, the bar's order and marks, and a draw() for the overlays
function rankStage(t) {
  const S = { order: [0, 1, 2, 3], x: { knight: 126, rogue: 87, mage: 56, priest: 21 }, outpos: [], stopped: [], dropOn: -1, hideTags: false, noSummon: false, draw: null, buffs: null };
  const setRanks = (ids) => { ids.forEach((id, r) => (S.x[id] = RANK_X[r])); S.order = ids.map((id) => HIDX[id]); S.outpos = ids.filter((id, r) => outOfRank(id, r + 1)); };
  if (BATTLE_STATE === 'bless') {
    const q = t % 8, hovering = q > 1.2;
    S.buffs = [{ picon: 'altar', label: 'run', run: true }, { picon: 'moonwell', label: 'run', run: true }, { icon: 'can', label: '61s' }, { icon: 'ward', label: '4s', sweep: 0.75 }];
    S.draw = () => {
      const bx = W - 4 - 13 - 16;   // the Moonwell chip
      if (hovering) {
        const B0 = BLESS.moonwell;
        tipCard(W - 4 - 132, 30, 132, [['h', B0.name, (x, y) => { rectI(x, y - 1, 15, 7, P.g2); frameI(x, y - 1, 15, 7, P.g5); text('run', x + 2, y, 'tiny', P.g6); }], ['+', B0.bless + '.'], ['-', B0.cost + '.'], ['n', 'Lasts until the run ends (banked or wiped). Blessings stack.']]);
      }
      cursorAt(bx + 7 + (hovering ? 0 : (1.2 - q) * 30), 10 + (hovering ? 0 : (1.2 - q) * 20));
    };
  } else if (BATTLE_STATE === 'swap') {
    const q = t % 7, gx = [6, 88, 170, 252];
    if (q < 1.6) {
      // pick Garrote's portrait up, drag it onto Magoo's
      const k = clamp((q - 0.4) / 1.2), cx = q < 0.4 ? lerp(140, gx[1] + 12, q / 0.4) : lerp(gx[1] + 12, gx[2] + 12, k * k * (3 - 2 * k)), cy = BAR_Y + 12 - (q < 0.4 ? (0.4 - q) * 60 : 0);
      if (q >= 0.4) S.dropOn = 2;
      S.draw = () => { if (q >= 0.4) ghostPortrait('rogue', Math.round(cx - 11), BAR_Y + 1 - 6); cursorAt(cx, cy); floorRing(S.x.rogue, t); if (q >= 0.4) floorRing(S.x.mage, t); };
    } else {
      // the drop: they pass each other, both stop acting for 1 s; Magoo lands in rank 2, out of his home ranks
      const k = clamp((q - 1.6) / 1.0), e = k * k * (3 - 2 * k);
      setRanks(['knight', 'mage', 'rogue', 'priest']);
      S.x.rogue = Math.round(lerp(87, 56, e)); S.x.mage = Math.round(lerp(56, 87, e));
      if (q < 2.6) S.stopped = ['rogue', 'mage'];
      S.draw = () => {
        if (q < 2.6) floater('swap', Math.round((S.x.rogue + S.x.mage) / 2), 104, P.u6);
        if (q > 2.7 && q < 4.2) floater('out of position', S.x.mage, Math.round(108 - (q - 2.7) * 6), P.crimson);
        cursorAt(gx[1] + 12 + (q - 1.6) * 4, BAR_Y + 12 + (q - 1.6) * 3);
      };
    }
  } else if (BATTLE_STATE === 'hook') {
    const q = t % 8, HK = FOE.z1, hx = HK.x - 8, hy = 178;
    S.hideTags = true; S.noSummon = true;
    if (q < 1.6) {
      S.draw = () => {
        windup(HK.x - 2, 104, 'Hook · rank 4', clamp(q / 1.2));
        if (q > 1.2) chain(hx, hy, lerp(hx, 21 + 6, (q - 1.2) / 0.4), 178);
      };
    } else {
      const k = clamp((q - 1.6) / 0.8), e = k * k;
      setRanks(['priest', 'knight', 'rogue', 'mage']);
      for (const [id, a] of [['priest', 21], ['knight', 126], ['rogue', 87], ['mage', 56]]) S.x[id] = Math.round(lerp(a, S.x[id], id === 'priest' ? e : k * (2 - k)));
      const tip = q > 3.2;
      S.draw = () => {
        if (q < 2.4) chain(hx, hy, S.x.priest + 6, 178);
        if (q > 2.3 && q < 3.6) floater('out of position', S.x.priest, Math.round(108 - (q - 2.3) * 6), P.crimson);
        if (tip) {
          // hovering the hero himself: the card opens above his head
          tipCard(S.x.priest - 70, 34, 150, [['h', 'Healero · rank 1', null], ['-', 'Out of position: heals at 70%. His ranks are 2 to 4.'], ['+', 'Knighten, behind him, regenerates 1% HP per second.'], ['n', 'Drag him back. Away, the line stays broken.']]);
          cursorAt(S.x.priest + 2, 150);
        }
      };
    }
  }
  return S;
}
// a dashed gold ring on the floor under a hero picked for a swap
function floorRing(cx, t) {
  const on = Math.floor(t * 6) & 1;
  for (let k = 0; k < 40; k++) { if (((k >> 1) + on) & 1) continue; const an = k / 40 * 6.283; putI(Math.round(cx + Math.cos(an) * 12), Math.round(CHAR_Y + 1 + Math.sin(an) * 3.2), P.gold); }
}
// the Hook's chain: iron links, a barb at the end
function chain(x0, y0, x1, y1) {
  const n = Math.max(1, Math.round(Math.abs(x1 - x0)));
  for (let k = 0; k <= n; k++) {
    const x = Math.round(lerp(x0, x1, k / n)), y = Math.round(lerp(y0, y1, k / n) + Math.sin(k / n * Math.PI) * 3);
    putI(x, y, (k >> 1) & 1 ? P.s4 : P.s6); putI(x, y + 1, P.void);
  }
  const d = x1 < x0 ? -1 : 1;
  sprite(Math.round(x1) - (d < 0 ? 3 : 0), y1 - 3, d < 0 ? ['.6.', '6..', '6.6', '.66'] : ['.6.', '..6', '6.6', '66.']);
}
