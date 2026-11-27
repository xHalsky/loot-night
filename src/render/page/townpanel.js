// ===========================================================================
// The town side panel with three tabs (handoff 2.1, #53): Town (the build list, the way down, and the
// services: a building clicked on the map opens here, no pop-up windows in town), Inventory (party, gear,
// bag) and Skill Tree (tree.js). Souls replace scraps.
// ===========================================================================
let TOWN_TAB = 'town';                       // town | salvage | appraiser | merchant | inventory | tree
const SERVICE_AT = { salvage: 'forge', appraiser: 'appraiser', merchant: 'merchant' };
const TABS = [['town', 'Town', 42], ['inventory', 'Inventory', 48], ['tree', 'Skill Tree', 46]];
// the bag as the services see it: names, rarity, power; unknown items stay "?" until the appraiser
const TOWN_BAG = [
  { icon: 'sword', r: 'common', pow: 9, name: 'Iron Sword' }, { icon: 'helm', r: 'common', pow: 7, name: 'Iron Helm' },
  { icon: 'boots', r: 'uncommon', pow: 14, name: 'Swift Boots' }, { icon: 'amulet', r: 'uncommon', pow: 12, name: 'Bone Amulet' },
  { icon: 'armor', r: 'epic', pow: 41, name: 'Gravemail', lock: true }, { icon: 'ring', r: 'rare', pow: 27, name: 'Moonstone Ring' },
  { icon: 'unknown', r: 'epic', name: 'Unknown hood', reveal: { icon: 'hood', name: 'Ashen Hood', pow: 36, affix: ['+12% crit', '+8 armor', 'of Stealth: your Noise -10%'] } },
  { icon: 'unknown', r: 'legendary', name: 'Unknown legendary' }, { icon: 'map', r: 'rare', name: 'Treasure Vault' },
];
const SALVAGE_YIELD = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 };   // tuning.ts SALVAGE_YIELD; only epics and legendaries drop unidentified (loot.ts)
// the build's item value (loot.ts): 6 x ilvl x mult^2 + 3 per affix, with power = 10 x ilvl x mult
const R_MULT = { common: 1, uncommon: 1.3, rare: 1.7, epic: 2.2, legendary: 3 }, R_AFFIX = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 3 };
const SELL_PRICE = (it) => Math.round(0.6 * it.pow * R_MULT[it.r] + 3 * R_AFFIX[it.r]);

function tabStrip(active) {
  const X0 = 4;
  for (let i = X0; i < W; i++) { putU(i, 0, 0.06); putU(i, 1, 0.08); putU(i, 10, 0.52 + 0.05 * (GR(i, 10) - 0.5)); putU(i, 11, 0.05); }
  let x = X0;
  for (const [id, lab, w] of TABS) {
    const on = id === active || (id === 'town' && SERVICE_AT[active]);
    const y0 = on ? 0 : 2, y1 = on ? 11 : 9;
    for (let j = y0; j <= y1; j++) for (let i = x; i < x + w; i++) {
      let v;
      if (i === x || i === x + w - 1) v = 0.03;
      else if (j === y0) v = on ? 0.86 : 0.34;
      else if (i === x + 1) v = on ? 0.6 : 0.2;
      else if (i === x + w - 2) v = on ? 0.14 : 0.06;
      else v = (on ? 0.24 : 0.1) + 0.05 * (GR(i, j) - 0.5);
      if (on && j >= 10 && i > x && i < x + w - 1) v = 0.17 + 0.04 * (GR(i, j) - 0.5);   // opens into the panel
      putU(i, j, v, M_UMBER);
    }
    text(lab, x + w / 2, on ? 3 : 4, 'tiny', on ? P.moon : P.u4, { align: 'c', shadow: P.void });
    x += w;
  }
}
// small bronze arrow button for the floor picker
function arrowBtn(x, y, dir, on) {
  shadowU(x, y, 9, 10, { k: 0.45, r: 2, dx: 1, dy: 1 });
  plateU(x, y, 9, 10, on ? { top: 0.5, bot: 0.26, hi: 0.82 } : { top: 0.24, bot: 0.14, hi: 0.36, lo: 0.06 });
  sprite(x + 3, y + 3, dir < 0 ? ['..u', '.uu', 'uuu', '.uu', '..u'] : ['u..', 'uu.', 'uuu', 'uu.', 'u..'], on ? null : { u: 'u3' });
}
function buildRows(st, X0, PW, y0, hid) {
  ['training', 'inn', 'library', 'treasury'].forEach((id, k) => {
    const b = BUILD[id], lv = st.levels[id], y = y0 + k * 19, hot = id === hid;
    if (hot) { for (let j = y; j < y + 18; j++) for (let i = X0; i < X0 + PW; i++) putU(i, j, 0.3 - 0.1 * ((j - y) / 18) + 0.03 * (GR(i, j) - 0.5)); rectI(X0, y, 1, 18, P.gold); }
    for (let i = X0 + 2; i < X0 + PW - 2; i++) { putU(i, y + 18, 0.04); putU(i, y + 19, 0.32); }
    const nw = text(b.name, X0 + 4, y + 3, 'tiny', hot ? P.moon : P.u6, { shadow: P.void });
    for (let p = 0; p < 3; p++) sprite(X0 + 7 + nw + p * 6, y + 3, p < lv ? PIP_ON : PIP_OFF, { O: 'gold', Y: 'pale' });
    text(lv >= 3 ? b.fx(lv) : `Next: ${b.fx(lv + 1)}`, X0 + 4, y + 11, 'tiny', P.u5, { shadow: P.void });
    const bw = 40, bx = X0 + PW - bw - 3, by = y + 2;
    if (lv >= 3) { text('MAX LEVEL', bx + bw / 2, by + 5, 'tiny', P.u4, { align: 'c' }); return; }
    const [g, sc] = b.cost[lv], ok = g <= st.gold && sc <= st.souls;
    shadowU(bx, by, bw, 15, { k: 0.5, r: 2, dx: 1, dy: 2 });
    plateU(bx, by, bw, 15, ok ? { top: 0.5, bot: 0.26, hi: 0.82 } : { top: 0.26, bot: 0.16, hi: 0.4, lo: 0.08 });
    text(lv ? 'Upgrade' : 'Build', bx + bw / 2, by + 2, 'tiny', ok ? P.moon : P.u4, { align: 'c', shadow: ok ? P.void : undefined });
    const cs = `${g}g ${sc}`, cw = measure(cs, 'tiny') + 7, cx0 = Math.round(bx + bw / 2 - cw / 2);
    text(cs, cx0, by + 9, 'tiny', ok ? P.gold : P.u4, { shadow: ok ? P.void : undefined }); soulGlyph(cx0 + cw - 5, by + 8, !ok);
  });
}
// a bag grid for the services: value badges, picked items framed gold with a tick, the rest dimmed if they don't apply
function serviceGrid(X0, y0, bag, o) {
  for (let k = 0; k < 18; k++) {
    const x = X0 + 2 + (k % 6) * 22, y = y0 + Math.floor(k / 6) * 22, it = bag[k];
    itemCell(x, y, it, {});
    if (!it) continue;
    const ok = o.applies(it), picked = o.picked.includes(k);
    if (!ok) { for (let j = y + 1; j < y + 20; j++) for (let i = x + 1; i < x + 20; i++) if ((i + j) & 1) putI(i, j, P.void); continue; }
    if (picked) {
      frameI(x - 1, y - 1, 23, 23, P.gold); frameI(x, y, 21, 21, P.gold);
      sprite(x + 14, y + 1, ['....O', '...OY', 'O.OY.', 'OOY..', '.O...'].map((r) => r.replace(/Y/g, 'O')), null);
    }
    if (o.badge) { const [s, col] = o.badge(it); if (s) text(s, x + 2, y + 2, 'tiny', col, { outline: P.void }); }
  }
}
function serviceHead(X0, PW, y, name, mark, line) {
  for (let j = 0; j < 10; j++) for (let i = X0; i < X0 + PW; i++) putU(i, y + j, j === 0 ? 0.56 : j === 9 ? 0 : lerp(0.3, 0.14, j / 8) + 0.05 * (GR(i, y + j) - 0.5));
  sprite(X0 + 3, y + 2, ['..u', '.uu', 'uuu', '.uu', '..u']);
  text(name, X0 + 9, y + 3, 'silkb', P.u6, { shadow: P.void });
  sprite(X0 + PW - 10, y + 1, MARK[mark]);
  zl9(line, X0 + 4, y + 13, 'tiny', P.u5, { shadow: P.void });
}
// the next action: a flat gold button, palette-exact, so its dark label never sits on a dither (grid doc 2)
function flatButton(x, y, w, label, ok, soul) {
  rectI(x, y, w, 15, P.void);
  rectI(x + 1, y + 1, w - 2, 13, ok ? P.gold : P.u2); rectI(x + 1, y + 1, w - 2, 1, ok ? P.pale : P.u3); rectI(x + 1, y + 13, w - 2, 1, ok ? P.copper : P.u1);
  const lw = measure(label, 'tiny') + (soul ? 7 : 0), lx = Math.round(x + w / 2 - lw / 2);
  zl9(label, lx, y + 5, 'tiny', ok ? P.void : P.u4);   // 'N zl' draws as $N (the auction, #105)
  if (soul) sprite(lx + lw - 5, y + 4, SOUL, ok ? { X: 'void', M: 'pale' } : { X: 'u3', M: 'u4' });
}
function sidePanelTabs(st, t) {
  const tab = st.tab || 'town';
  if (tab === 'inventory') { sidePanel({ ...SIDE_KNIGHT, gold: st.gold, souls: st.souls, record: st.record }, t); tabStrip(tab); return; }
  if (tab === 'tree') { sidePanelTree(st, t); tabStrip(tab); return; }
  leatherU(0, 0, W, H, { v: 0.16, vig: 0.45 });
  for (let j = 0; j < H; j++) { putU(0, j, 0.02); putU(1, j, 0.78 + 0.06 * (GR(1, j) - 0.5)); putU(2, j, 0.3); putU(3, j, 0.05); }
  const X0 = 4, PW = W - 4;
  tabStrip(tab);
  if (tab === 'town') {
    const order = ['appraiser', 'treasury', 'portal', 'forge', 'library', 'merchant', 'inn', 'auction', 'training'], hid = order[Math.floor(t / 3) % order.length];
    buildRows(st, X0, PW, 14, hid);
    // the way down: a floor picker (floor 1 and every checkpoint) over the violet plate
    const fy = 92, fl = [1, 6, 11], fi = Math.floor(t / 2.5) % 2 ? 1 : 2, F0 = fl[fi];
    wellU(X0 + 2, fy, PW - 4, 12, { v: 0.08 });
    arrowBtn(X0 + 3, fy + 1, -1, fi > 0); arrowBtn(X0 + PW - 13, fy + 1, 1, fi < fl.length - 1);
    const fs = 'floor ' + F0, cs = F0 === 1 ? 'the start' : 'checkpoint', w1 = measure(fs, 'tiny');
    text(fs, X0 + PW / 2 - 4, fy + 4, 'tiny', P.moon, { align: 'r', shadow: P.void }); text(cs, X0 + PW / 2, fy + 4, 'tiny', P.u4);
    const bx = X0 + 2, by = fy + 14, bw = PW - 4, bh = 15;
    shadowU(bx, by, bw, bh, { k: 0.6, r: 3, dx: 1, dy: 2 });
    plateU(bx, by, bw, bh, { mat: M_MAGIC, top: 0.4, bot: 0.3, hi: 0.86, hiMat: M_DUSK, lo: 0.2, grain: 0.03 });
    text(`Enter the dungeon · floor ${F0}`, bx + bw / 2, by + 5, 'tiny', P.moon, { align: 'c', shadow: P.void });
    headerBar(X0, 124, PW, 'BAG', '');
    text(TOWN_BAG.length + '/18', X0 + 34, 127, 'tiny', P.u6, { shadow: P.void });
    for (let k = 0; k < 18; k++) itemCell(X0 + 2 + (k % 6) * 22, 136 + Math.floor(k / 6) * 22, TOWN_BAG[k], {});
    const hint = 'Click a building to use it';
    footerMoney(X0, PW, st);
    return;
  }
  if (tab === 'salvage') {
    serviceHead(X0, PW, 14, 'SALVAGE FORGE', 'anvil', 'Melt gear into Souls.');
    const picked = [0, 1, 2, 3].slice(0, 1 + (Math.floor(t * 1.2) % 4));
    serviceGrid(X0, 36, TOWN_BAG, { picked, applies: (it) => it.icon !== 'map' && it.icon !== 'unknown' && !it.lock, badge: (it) => ['+' + SALVAGE_YIELD[it.r], P.u6, true] });
    const sum = picked.reduce((a, k) => a + SALVAGE_YIELD[TOWN_BAG[k].r], 0);
    let y = 106;
    const w0 = text(picked.length + ' picked: +' + sum, X0 + 4, y, 'tiny', P.u6, { shadow: P.void }); soulGlyph(X0 + 6 + w0, y - 1);
    text('Locked, unknown and maps: no.', X0 + 4, y + 8, 'tiny', P.u4, { shadow: P.void });
    flatButton(X0 + 4, y + 19, PW - 8, 'Salvage ' + picked.length + ' · +' + sum, true, true);
    text('The bag\'s AUTO melts commons', X0 + 4, y + 40, 'tiny', P.u4, { shadow: P.void });
    text('and uncommons as they drop.', X0 + 4, y + 47, 'tiny', P.u4, { shadow: P.void });
    footerMoney(X0, PW, { ...st, souls: st.souls }); return;
  }
  if (tab === 'merchant') {
    serviceHead(X0, PW, 14, 'MERCHANT', 'scales', 'Buys loot for gold.');
    const picked = [2, 5];
    serviceGrid(X0, 36, TOWN_BAG, { picked, applies: (it) => it.icon !== 'map' && it.icon !== 'unknown' && !it.lock, badge: (it) => [SELL_PRICE(it) + 'g', P.gold] });
    const sum = picked.reduce((a, k) => a + SELL_PRICE(TOWN_BAG[k]), 0);
    let y = 106;
    text(picked.length + ' picked: +' + sum + ' g', X0 + 4, y, 'tiny', P.u6, { shadow: P.void });
    text('Moonstone Ring is rare: the Auction', X0 + 4, y + 8, 'tiny', P.u4, { shadow: P.void });
    text('House may pay more for it.', X0 + 4, y + 15, 'tiny', P.u4, { shadow: P.void });
    flatButton(X0 + 4, y + 25, PW - 8, 'Sell ' + picked.length + ' · +' + sum + ' g', true);
    footerMoney(X0, PW, st); return;
  }
  if (tab === 'appraiser') {
    serviceHead(X0, PW, 14, 'APPRAISER', 'eye', 'Epics 40 g, legendaries 100 g.');
    const q = t % 6, revealed = q > 1.4;
    const bag = TOWN_BAG.map((it, k) => (k === 6 && revealed ? { ...it, icon: it.reveal.icon, pow: it.reveal.pow, isNew: true } : it));
    serviceGrid(X0, 36, bag, { picked: [6], applies: (it) => it.icon === 'unknown' || it.isNew, badge: (it) => (it.icon === 'unknown' ? [(it.r === 'legendary' ? 100 : 40) + 'g', P.gold] : ['', P.gold]) });
    // the reveal, in the panel: the cell flares, then the item's card
    const y = 104;
    if (!revealed) {
      const pulse = q > 0.9 ? (q - 0.9) / 0.5 : 0;
      wellU(X0 + 2, y, PW - 4, 70, { v: 0.08 });
      text('Looking closely...', X0 + PW / 2, y + 30, 'tiny', P.u5, { align: 'c', shadow: P.void });
      if (pulse > 0) for (let k = 0; k < 18; k++) { const an = k / 18 * 6.283 + q * 3, r = 6 + pulse * 26; putI(Math.round(X0 + PW / 2 + Math.cos(an) * r), Math.round(y + 32 + Math.sin(an) * r * 0.6), k & 1 ? P.arcane : P.pale); }
    } else {
      const R = TOWN_BAG[6].reveal, flash = q < 1.6;
      shadowU(X0 + 2, y, PW - 4, 80, { k: 0.6, r: 4, dx: 2, dy: 3 });
      leatherU(X0 + 3, y + 1, PW - 6, 78, { v: 0.13, vig: 0.25 });
      mouldU(X0 + 2, y, PW - 4, 80, { mat: M_MAGIC, k: 1, bosses: false });
      text('IDENTIFIED', X0 + 8, y + 6, 'silkb', P.arcane, { shadow: P.void });
      itemCell(X0 + 8, y + 15, { icon: R.icon, r: 'epic', pow: R.pow }, {});
      text(R.name, X0 + 33, y + 17, 'tiny', P.arcane, { shadow: P.void });
      text('Epic hood · Hixx (Rogue)', X0 + 33, y + 25, 'tiny', P.u5, { shadow: P.void });
      R.affix.forEach((a, k) => { const real = a.startsWith('of '); if (!real) { text(a, X0 + 8, y + 41 + k * 8, 'tiny', P.g6, { shadow: P.void }); return; } const [nm, fx] = a.split(': '); text(nm, X0 + 8, y + 41 + k * 8, 'tiny', P.u6, { shadow: P.void }); text('real life', X0 + PW - 9, y + 41 + k * 8, 'tiny', P.d5, { align: 'r', shadow: P.void }); text(fx, X0 + 12, y + 49 + k * 8, 'tiny', P.g6, { shadow: P.void }); });
      if (flash) for (let j = y; j < y + 80; j++) for (let i = X0 + 2; i < X0 + PW - 2; i++) if (((i + j) & 1) === 0) putI(i, j, P.moon);
    }
    footerMoney(X0, PW, { ...st, gold: revealed ? st.gold - 40 : st.gold }); return;
  }
}
