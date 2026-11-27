// ===========================================================================
// Skill trees (handoff 2.1-2.3, #53, with the 2026-11-20 drop: two skills and the ultimate per hero).
// The tree opens over the battle area (334 x 232) as a constellation in Moonwell 32; the side panel's
// Skill Tree tab picks the hero and shows the hovered node, its cost, Buy and Respec.
// Node shapes by kind: unlock large, rule medium (pairs as a fork, chained), stat small, ultimate largest,
// autocast small with a loop mark. Costs: stat 20, unlock 40, rule 40, autocast 60, ult 120, x (1 + 0.15 x bought).
// ===========================================================================
let TREE_HERO = 'knight';
const TREES = {
  knight: { auto: 'Slash', s1: 'taunt', s2: 'cleave', ult: 'shield', neb: M_STONE,
    r1: [['Hold the Line', 'Taunt also gives the Knight +30% armor.'], ['Thorns', 'Taunted enemies take 30% of their hits back.']],
    r2: [['Cleaving Bash', 'Bash hits the enemies in ranks 1 and 2.'], ['Concussion', 'Bash stuns twice as long.']],
    st: { g1: ['Veteran', '+8% damage.'], g2: ['Brute', '+10% damage.'], p1: ['Bulwark', '+10% armor.'], q1: ['Iron Skin', '+10% HP.'], p2: ['Crushing', 'Bash deals +20% damage.'], q2: ['Hardened', 'Healing on him +15%.'], m1: ['Stalwart', '+15% HP.'], m2: ['Tower Shield', '+15% armor.'], m3: ['Shield Brother', 'His aura: the hero behind him takes 35% less damage (from 25%).'] },
    ultFx: 'For 6 s, no hero can drop below 1 HP.', s2Fx: 'A heavy blow that staggers the front enemy.',
    bought: ['g1', 'g2', 's2', 'p2', 'r2a'] },
  rogue: { auto: 'Stab', s1: 'backstab', s2: 'smoke', ult: 'pickpocket', neb: M_LOOT,
    r1: [['Ambush', 'Backstab always crits on Staggered enemies.'], ['Shiv', 'Backstab\'s cooldown -30%.']],
    r2: [['Choking Smoke', 'Smoke Bomb also deals damage over time.'], ['Vanish', 'Hixx (Rogue) can\'t be targeted during Smoke Bomb.']],
    st: { g1: ['Nimble', '+8% attack speed.'], g2: ['Shadow', '+10% dodge.'], p1: ['Keen Eye', '+10% crit.'], q1: ['Deadly', 'Crits deal +25% damage.'], p2: ['Quick Blades', '+8% attack speed.'], q2: ['Lucky', '+5 luck: better drops (he does the looting).'], m1: ['Cutpurse', '+15% gold.'], m2: ['Ruthless', '+8% damage.'], m3: ['Sly', 'His aura: the hero in front gets +15% crit (from 10%).'] },
    ultFx: 'For 8 s, every kill drops an item.', s2Fx: 'Enemies miss 50% of their attacks for 4 s.',
    bought: ['p1', 'r1a', 'm1'] },
  mage: { auto: 'Bolt', s1: 'hellfire', s2: 'frost', ult: 'soul', neb: M_MAGIC,
    r1: [['Wildfire', 'Fire leaves the ground burning: 30% of its damage again over 3 s.'], ['Inferno', 'Fire deals +40% damage, cooldown +3 s.']],
    r2: [['Lingering Chill', 'Chill lasts twice as long.'], ['Shatterpoint', 'Bash shatters Chilled enemies for x4 instead of x2.5.']],
    st: { g1: ['Focus', '+8% damage.'], g2: ['Arcane Mind', 'Cooldowns -8%.'], p1: ['Pyromancy', 'Fire deals +15% damage.'], q1: ['Spellpower', 'Skills deal +12% damage.'], p2: ['Elementalist', 'Burning and Chill last 25% longer.'], q2: ['Glass', '+10% crit.'], m1: ['Ley Lines', 'His ultimate charges 20% faster.'], m2: ['Warded', '+10% HP.'], m3: ['Mentor', 'His aura: the hero in front gets 15% shorter cooldowns (from 10%).'] },
    ultFx: 'Hits every enemy for 8 x attack; Staggered and Chilled enemies take double.', s2Fx: 'Chills the front enemy: slower, and Bash shatters it.',
    bought: ['g1', 'g2', 's2', 'p1', 'r1b', 'm1', 'q1'] },
  priest: { auto: 'Smite', s1: 'mend', s2: 'ward', ult: 'judge', neb: M_UMBER,
    r1: [['Sanctuary', 'Mend also gives +20% armor for 5 s.'], ['Greater Mend', 'Mend heals 30% more.']],
    r2: [['Aegis', 'Ward lasts 3 s longer.'], ['Retribution', 'Any enemy hitting a warded hero takes 25% back.']],
    st: { g1: ['Devotion', '+10% HP.'], g2: ['Faith', 'Cooldowns -8%.'], p1: ['Grace', 'Healing +10%.'], q1: ['Mercy', 'Healing +15%.'], p2: ['Bastion', 'Ward soaks 20% more.'], q2: ['Zeal', '+8% damage.'], m1: ['Shepherd', 'The whole party: max HP +5%.'], m2: ['Vigil', '+10% armor.'], m3: ['Halo', 'His aura: his neighbours regenerate 1.5% HP per second (from 1%).'] },
    ultFx: 'Revives every downed hero and fully heals the party.', s2Fx: 'A bubble of light that soaks the next hits.',
    bought: [] },
};
let TREE_SOULS = 140;   // Souls are one shared pool (handoff 1.4)
const TREE_HERO_IDX = { knight: 0, rogue: 1, mage: 2, priest: 3 };
// the layout is shared: a root (the auto attack) at the foot, skill 1 left, skill 2 right, stats up the middle to the ultimate
// stats sit on the way to everything: two gate skill 2, one leads to each rule pair, one to each autocast, three climb to
// the ultimate (decided by Pawel, 2026-11-20). 17 nodes, 15 at most (one of each pair).
const TN = {
  root: { x: 167, y: 208, kind: 'root' },
  s1: { x: 72, y: 170, kind: 'skill', start: true },
  g1: { x: 204, y: 202, kind: 'stat', req: 'root', to: 's2' }, g2: { x: 236, y: 190, kind: 'stat', req: 'g1', to: 's2' }, s2: { x: 262, y: 170, kind: 'unlock', req: 'g2' },
  p1: { x: 72, y: 140, kind: 'stat', req: 's1', to: 'r1' }, f1: { x: 72, y: 116, kind: 'fork' },
  r1a: { x: 44, y: 90, kind: 'rule', pair: 'r1b', req: 'p1' }, r1b: { x: 100, y: 90, kind: 'rule', pair: 'r1a', req: 'p1' },
  q1: { x: 41, y: 170, kind: 'stat', req: 's1', to: 'a1' }, a1: { x: 16, y: 170, kind: 'auto', req: 'q1' },
  p2: { x: 262, y: 140, kind: 'stat', req: 's2', to: 'r2' }, f2: { x: 262, y: 116, kind: 'fork' },
  r2a: { x: 234, y: 90, kind: 'rule', pair: 'r2b', req: 'p2' }, r2b: { x: 290, y: 90, kind: 'rule', pair: 'r2a', req: 'p2' },
  q2: { x: 293, y: 170, kind: 'stat', req: 's2', to: 'a2' }, a2: { x: 318, y: 170, kind: 'auto', req: 'q2' },
  m1: { x: 167, y: 174, kind: 'stat', req: 'root', to: 'ult' }, m2: { x: 167, y: 142, kind: 'stat', req: 'm1', to: 'ult' }, m3: { x: 167, y: 110, kind: 'stat', req: 'm2', to: 'ult' },
  ult: { x: 167, y: 52, kind: 'ult' },
};
const TEDGES = [['root', 's1'], ['root', 'g1'], ['g1', 'g2'], ['g2', 's2'], ['root', 'm1'], ['m1', 'm2'], ['m2', 'm3'], ['m3', 'ult'], ['s1', 'p1'], ['p1', 'f1'], ['f1', 'r1a'], ['f1', 'r1b'], ['s1', 'q1'], ['q1', 'a1'], ['s2', 'p2'], ['p2', 'f2'], ['f2', 'r2a'], ['f2', 'r2b'], ['s2', 'q2'], ['q2', 'a2']];
// costs set 2026-11-20 against the Souls income (souls_floor model in the grid doc 6c); tune in the playtests
const BASE_COST = { stat: 20, unlock: 40, rule: 40, auto: 60, ult: 120 }, TREE_COST_STEP = 0.15;
function nodeInfo(T, id) {
  const n = TN[id], k = n.kind;
  if (id === 's1') return { name: SKILL_NAME[T.s1], kind: 'Skill 1 · from the start', fx: 'His first skill. Every hero starts with his auto attack (' + T.auto + ') and this.' };
  if (id === 's2') return { name: SKILL_NAME[T.s2], kind: 'Unlock · skill 2', fx: T.s2Fx };
  if (id === 'ult') return { name: SKILL_NAME[T.ult], kind: 'Ultimate', fx: T.ultFx + ' Never autocasts.' };
  if (k === 'rule') { const [nm, fx] = (id[1] === '1' ? T.r1 : T.r2)[id[2] === 'a' ? 0 : 1]; return { name: nm, kind: 'Rule · ' + SKILL_NAME[id[1] === '1' ? T.s1 : T.s2], fx }; }
  if (k === 'stat') { const [nm, fx] = T.st[id], to = n.to, tn = to === 'ult' ? SKILL_NAME[T.ult] : to === 's2' ? SKILL_NAME[T.s2] : to === 'r1' ? SKILL_NAME[T.s1] + '\'s rules' : to === 'r2' ? SKILL_NAME[T.s2] + '\'s rules' : 'its autocast'; return { name: nm, kind: 'Stat · on the way to ' + tn, fx }; }
  if (k === 'auto') { const sk = SKILL_NAME[id === 'a1' ? T.s1 : T.s2]; return { name: 'Autocast ' + sk, kind: 'Autocast · ' + sk, fx: sk + ' casts itself the moment it\'s ready. Dumb on purpose: no marks, no combos. It keeps firing while you\'re away.' }; }
  return { name: T.auto, kind: 'Auto attack', fx: '' };
}
function nodeState(T, id) {
  const n = TN[id], have = new Set(['root', 's1', ...T.bought]);
  if (have.has(id)) return 'owned';
  if (n.pair && have.has(n.pair)) return 'shut';
  const cnt = T.bought.length;
  if (n.kind === 'ult') return cnt >= 6 ? (nodeCost(T, id) <= TREE_SOULS ? 'buy' : 'poor') : 'locked';
  if (n.req && !have.has(n.req)) return 'locked';
  return nodeCost(T, id) <= TREE_SOULS ? 'buy' : 'poor';
}
const nodeCost = (T, id) => Math.round(BASE_COST[TN[id].kind === 'skill' ? 'unlock' : TN[id].kind] * (1 + TREE_COST_STEP * T.bought.length));
const CLS_IDX = () => P[CLASS_COL[TREE_HERO]];
// ---------------------------------------------------------------- the constellation
const TLOOP = ['.mmm.', 'm...m', 'm..mm', 'm..m.', '.mm..'];
function ringStroke(cx, cy, r, idx, gaps) { const n = Math.ceil(r * 7); for (let k = 0; k < n; k++) { if (gaps && ((k >> 1) & 1)) continue; const an = k / n * 6.283; putI(Math.round(cx + Math.cos(an) * r - 0.5), Math.round(cy + Math.sin(an) * r - 0.5), idx); } }
function treeGlow(cx, cy, r, mat, a) { for (let j = Math.floor(cy - r); j <= cy + r; j++) for (let i = Math.floor(cx - r); i <= cx + r; i++) { const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy) / r; if (d < 1) putU(i, j, Math.max(B.V[j * W + i] || 0, a * (1 - d) ** 1.6 + 0.04), mat); } }
function stateCol(s, t) { return s === 'owned' ? CLS_IDX() : s === 'buy' ? (Math.floor(t * 2.4) & 1 ? P.pale : P.gold) : s === 'poor' ? P.u4 : P.s3; }
function drawNode(T, id, t, hov) {
  const n = TN[id], s = nodeState(T, id), col = stateCol(s, t), { x, y } = n, dark = s === 'locked' || s === 'shut';
  const checker = (x0, y0, w, h) => { for (let j = y0; j < y0 + h; j++) for (let i = x0; i < x0 + w; i++) if ((i + j) & 1) putI(i, j, P.void); };
  if (n.kind === 'skill' || n.kind === 'unlock') {
    discI(x, y, 9.5, P.void); ringStroke(x, y, 9, col); if (s === 'owned') ringStroke(x, y, 8, P.moon, true);
    const sk = id === 's1' ? T.s1 : T.s2; sprite(x - 6, y - 6, SKILL_ICON[sk]); if (dark) checker(x - 6, y - 6, 13, 13);
  } else if (n.kind === 'ult') {
    discI(x, y, 13.5, P.void);
    for (const [r, c] of [[13, s === 'owned' ? CLS_IDX() : s === 'buy' ? col : P.copper], [12, P.gold], [11, P.wine]]) ringStroke(x, y, r, c);
    sprite(x - 6, y - 6, SKILL_ICON[T.ult]); if (s === 'locked') checker(x - 6, y - 6, 13, 13);
    // six pips round it: the nodes it needs, lit as they are bought
    const got = Math.min(6, T.bought.length);
    for (let k = 0; k < 6; k++) { const an = Math.PI * (0.2 + k * 0.12), px = Math.round(x + Math.cos(an) * 18), py = Math.round(y + Math.sin(an) * 18); rectI(px - 1, py - 1, 3, 3, P.void); putI(px, py, k < got ? P.gold : P.u2); if (k < got) { putI(px - 1, py, P.copper); putI(px + 1, py, P.copper); } }
    // the crest's peak, as on the skill bar's ultimate well
    for (let j = 0; j < 4; j++) for (let i = -3 + j; i <= 3 - j; i++) putI(x + i, y - 16 - j, j === 3 ? P.pale : P.gold); putI(x, y - 16, P.crimson);
  } else if (n.kind === 'rule') {
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const d = Math.abs(i) + Math.abs(j); if (d <= 6) putI(x + i, y + j, d >= 5 ? (d === 6 ? P.void : col) : s === 'owned' ? (d <= 1 ? P.moon : d <= 2 ? CLS_IDX() : P.void) : P.void); }
    if (s === 'shut') { for (let k = -3; k <= 3; k++) { putI(x + k, y + k, P.u3); putI(x + k, y - k, P.u3); } }
  } else if (n.kind === 'stat') {
    for (const [i, j, c] of [[0, 0, 'm'], [-1, 0, 'c'], [1, 0, 'c'], [0, -1, 'c'], [0, 1, 'c'], [-2, 0, 'c'], [2, 0, 'c'], [0, -2, 'c'], [0, 2, 'c'], [-3, 0, 'e'], [3, 0, 'e'], [0, -3, 'e'], [0, 3, 'e']]) putI(x + i, y + j, c === 'm' ? (s === 'owned' ? P.moon : col) : c === 'c' ? col : s === 'owned' ? P.moon : P.void);
  } else if (n.kind === 'auto') {
    discI(x, y, 5.5, P.void); ringStroke(x, y, 5, col);
    sprite(x - 2, y - 2, TLOOP, { m: s === 'owned' ? 'g6' : dark ? 's2' : s === 'poor' ? 'u4' : 'gold' });
  } else if (n.kind === 'root') {
    discI(x, y, 6.5, P.void); ringStroke(x, y, 6, CLS_IDX()); discI(x, y, 3.2, CLS_IDX()); putI(x - 1, y - 1, P.moon);
  }
  if (hov) { const r = { skill: 13, unlock: 13, ult: 21, rule: 10, stat: 7, auto: 9, root: 10 }[n.kind], off = Math.floor(t * 8); const m = Math.ceil(r * 7); for (let k = 0; k < m; k++) if (((k >> 1) + off) & 1) { const an = k / m * 6.283; putI(Math.round(x + Math.cos(an) * r - 0.5), Math.round(y + Math.sin(an) * r - 0.5), P.gold); } }
}
function edgeLine(a, b, s, t) {
  const A = TN[a], Bn = TN[b], n = Math.max(1, Math.ceil(Math.hypot(Bn.x - A.x, Bn.y - A.y)));
  for (let k = 0; k <= n; k++) {
    const x = Math.round(lerp(A.x, Bn.x, k / n)), y = Math.round(lerp(A.y, Bn.y, k / n));
    if (s === 'owned') putI(x, y, CLS_IDX());
    else if (s === 'open') { if (k & 1) putI(x, y, P.s4); }
    else if (k % 3 === 0) putI(x, y, P.s2);
  }
}
const TREE_HOVER = { knight: ['p1', 'r1b', 'ult', 'q2', 'r2b'], rogue: ['g1', 'r1b', 'q1', 'ult'], mage: ['ult', 'q2', 'a1', 'm3'], priest: ['g1', 's2', 'p1', 'ult'] };
let TREE_LIVE = false, TREE_LIVE_HOV = null;   // the game drives the hover (live.js)
function treeHovered(t) { if (TREE_LIVE) return TREE_LIVE_HOV; const L = TREE_HOVER[TREE_HERO]; return L[Math.floor(t / 3) % L.length]; }
let TREE_SKY = {};
function treeSky(T) {
  if (TREE_SKY[TREE_HERO]) return TREE_SKY[TREE_HERO];
  const L = mkBuf(BA_W, GS_H, true); clearFrame(L); bind(L); CLIP = null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const neb = fbm(x * 0.018, y * 0.024, 44) * fbm(x * 0.05 + 3, y * 0.05, 45), band = Math.exp(-(((x - 167) / 150) ** 2 + ((y - 120) / 90) ** 2));
    const v = 0.035 + 0.05 * (1 - y / H) + 0.22 * neb * band;
    putU(x, y, v, neb * band > 0.18 ? T.neb : M_STONE);
  }
  for (let k = 0; k < 170; k++) { const x = Math.floor(hash(k, 1, 51) * W), y = Math.floor(hash(k, 2, 51) * H), r = hash(k, 3, 51); putI(x, y, r > 0.93 ? P.moon : r > 0.7 ? P.s5 : r > 0.4 ? P.s3 : P.s2); }
  TREE_SKY[TREE_HERO] = L; return L;
}
function screenTree(ctx, t) {
  const T = TREES[TREE_HERO];
  setRes(BA_W, GS_H); CX = 167;
  const S = treeSky(T), F = buf('ba', BA_W, GS_H); bind(F); CLIP = null;
  F.V.set(S.V); F.M.set(S.M); F.E.set(S.E); F.A.set(S.A); F.T.fill(0); F.DX.fill(0); F.I.set(S.I); F.G.fill(1); F.X.fill(0);
  // twinkle
  for (let k = 0; k < 24; k++) { if (Math.sin(t * (1.3 + hash(k, 5, 52)) + k) < 0.7) continue; putI(Math.floor(hash(k, 6, 52) * W), Math.floor(hash(k, 7, 52) * H), P.moon); }
  // glow under what he owns
  for (const id of Object.keys(TN)) if (TN[id].kind !== 'fork' && nodeState(T, id) === 'owned') treeGlow(TN[id].x, TN[id].y, TN[id].kind === 'stat' ? 9 : 16, T.neb, 0.34);
  // the lines: lit between owned nodes, dashed toward what you can take, sparse toward what is locked
  const est = (id) => (TN[id].kind === 'fork' ? (nodeState(T, id === 'f1' ? 'p1' : 'p2') === 'owned' ? 'owned' : 'locked') : nodeState(T, id));
  for (const [a, b] of TEDGES) {
    const sa = est(a), sb = est(b);
    edgeLine(a, b, sa === 'owned' && sb === 'owned' ? (TN[b].kind === 'fork' && !['a', 'b'].some((q) => nodeState(T, 'r' + b[1] + q) === 'owned') ? 'open' : 'owned') : sa === 'owned' && (sb === 'buy' || sb === 'poor') ? 'open' : 'locked', t);
  }
  // the pairs are chained: buying one shuts the other
  for (const [a, b] of [['r1a', 'r1b'], ['r2a', 'r2b']]) { const cx = (TN[a].x + TN[b].x) / 2, cy = TN[a].y; sprite(Math.round(cx) - 5, cy - 2, ['.uu..uu..', 'u..uu..u.', '.uu..uu..'].map((r) => r.replace(/u/g, 't')), null); }
  for (const id of ['f1', 'f2']) { const { x, y } = TN[id]; rectI(x - 1, y - 1, 3, 3, P.void); putI(x, y, P.s4); }
  const hov = treeHovered(t);
  for (const id of Object.keys(TN)) if (TN[id].kind !== 'fork') drawNode(T, id, t, id === hov);
  // names: under the skills and the ultimate, over the rules; stats and autocasts on hover
  const lab = (id, dx, dy, al) => { const s = nodeState(T, id), info = nodeInfo(T, id); text(info.name, TN[id].x + dx, TN[id].y + dy, 'tiny', id === hov ? P.moon : s === 'owned' ? P.u6 : s === 'locked' || s === 'shut' ? P.u3 : P.u5, { align: al || 'c', shadow: P.void }); };
  lab('s1', 0, 12); lab('s2', 0, 12); lab('ult', 22, -3, 'l'); lab('root', -10, -2, 'r');
  for (const id of ['r1a', 'r1b', 'r2a', 'r2b']) lab(id, 0, -14);
  for (const id of ['m1', 'm2', 'm3', 'p1', 'p2']) lab(id, 8, -2, 'l'); lab('q1', 0, -12); lab('q2', 0, -12); lab('g1', 0, 6); lab('g2', 0, 6);
  text('auto', TN.a1.x, TN.a1.y + 8, 'tiny', P.u4, { align: 'c', shadow: P.void }); text('auto', TN.a2.x - 4, TN.a2.y + 8, 'tiny', P.u4, { align: 'c', shadow: P.void });
  text('start', TN.s1.x + 12, TN.s1.y - 12, 'tiny', P.u4, { shadow: P.void });
  // header and key
  const nw = text(HEROES[TREE_HERO_IDX[TREE_HERO]].name.toUpperCase(), 5, 5, 'silkb', P.u6, { shadow: P.void });
  text(HEROES[TREE_HERO_IDX[TREE_HERO]].cls + ' tree', 9 + nw, 5, 'tiny', P.u4, { shadow: P.void });
  let kx = 5; const ky = 222;
  const key = (draw, s) => { draw(kx, ky); kx += 9; kx += text(s, kx, ky - 2, 'tiny', P.u4, { shadow: P.void }) + 8; };
  key((x, y) => { for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (Math.abs(i) + Math.abs(j) === 3) putI(x + i + 3, y + j, P.u5); }, 'rule');
  key((x, y) => { for (const [i, j] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]]) putI(x + 3 + i, y + j, P.u5); }, 'stat');
  key((x, y) => sprite(x + 1, y - 2, TLOOP, { m: 'u5' }), 'autocast');
  { const s = 'gold ring: you can buy it'; text(s, W - 5, 5, 'tiny', P.gold, { align: 'r', shadow: P.void }); }
  // the pointer on the hovered node
  if (!TREE_LIVE && typeof cursorAt === 'function') cursorAt(TN[hov].x + 3, TN[hov].y + 3);
  composeInto(ctx, F, { lights: [], ambient: [0.1, 0.1, 0.2], tint: 0, vig: 0 }, 0);
}
// ---------------------------------------------------------------- the Skill Tree tab
function sidePanelTree(st, t) {
  const T = TREES[TREE_HERO], X0 = 4, PW = W - 4;
  leatherU(0, 0, W, H, { v: 0.16, vig: 0.45 });
  for (let j = 0; j < H; j++) { putU(0, j, 0.02); putU(1, j, 0.78 + 0.06 * (GR(1, j) - 0.5)); putU(2, j, 0.3); putU(3, j, 0.05); }
  for (let n = 0; n < HEROES.length; n++) partyCard(X0 + n * 34, 15, n, { selected: TREE_HERO_IDX[TREE_HERO] });
  // the hero's strip: name and the Souls you have
  for (let j = 0; j < 10; j++) for (let i = X0; i < X0 + PW; i++) putU(i, 57 + j, j === 0 ? 0.56 : j === 9 ? 0 : lerp(0.3, 0.14, j / 8) + 0.05 * (GR(i, 57 + j) - 0.5));
  text(HEROES[TREE_HERO_IDX[TREE_HERO]].short.toUpperCase(), X0 + 4, 60, 'silkb', P.u6, { shadow: P.void });
  const sw = text(String(TREE_SOULS), X0 + PW - 4, 60, 'tiny', P.moon, { align: 'r', shadow: P.void }); soulGlyph(X0 + PW - 12 - sw, 59);
  // the hovered node
  const id = treeHovered(t), info = nodeInfo(T, id), s = nodeState(T, id), cost = nodeCost(T, id);
  let y = 71;
  text(info.name, X0 + 4, y, 'tiny', P.moon, { shadow: P.void }); y += 8;
  text(info.kind, X0 + 4, y, 'tiny', P.u4, { shadow: P.void }); y += 10;
  for (const ln of wrapTiny(info.fx, PW - 10)) { text(ln, X0 + 4, y, 'tiny', P.u6, { shadow: P.void }); y += 7; }
  y += 3;
  const note = (kind, str) => { const col = kind === '+' ? P.g5 : P.crimson; if (kind === '+') { putI(X0 + 5, y + 1, col); putI(X0 + 4, y + 2, col); putI(X0 + 5, y + 2, col); putI(X0 + 6, y + 2, col); putI(X0 + 5, y + 3, col); } else { putI(X0 + 4, y + 2, col); putI(X0 + 5, y + 2, col); putI(X0 + 6, y + 2, col); } for (const ln of wrapTiny(str, PW - 14)) { text(ln, X0 + 9, y, 'tiny', P.u6, { shadow: P.void }); y += 7; } };
  const n = TN[id];
  if (s === 'owned') note('+', 'Bought.');
  if (n.pair) { const other = nodeInfo(T, n.pair).name; note('-', s === 'shut' ? 'Shut: you took ' + other + '. Respec to swap.' : 'Locks ' + other + '.'); }
  if (s === 'locked' && n.kind === 'ult') note('-', 'Needs 6 nodes in his tree: ' + T.bought.length + ' of 6.');
  else if (s === 'locked' && n.req) note('-', 'Needs ' + nodeInfo(T, n.req).name + '.');
  if (n.kind === 'auto') note('+', 'A loop mark on its well. Right-click the well to switch it off.');
  // cost and Buy (gold: the next action), flat and palette-exact so its dark label never sits on a dither
  const by = 172;
  // the tree so far: what he has, and how far the ultimate is
  { const yy = 148, got = T.bought.length;
    for (let i = X0 + 2; i < X0 + PW - 2; i++) { putU(i, yy - 4, 0.04); putU(i, yy - 3, 0.32); }
    text(got + ' bought in this tree', X0 + 4, yy, 'tiny', P.u5, { shadow: P.void });
    const uw = text(SKILL_NAME[T.ult] + ':', X0 + 4, yy + 9, 'tiny', P.u5, { shadow: P.void });
    for (let k = 0; k < 6; k++) { const px = X0 + 8 + uw + k * 6; rectI(px, yy + 9, 5, 5, P.void); rectI(px + 1, yy + 10, 3, 3, k < got ? P.gold : P.u2); if (k < got) putI(px + 1, yy + 10, P.pale); }
    text(got >= 6 ? 'open' : got + '/6', X0 + 46 + uw, yy + 9, 'tiny', got >= 6 ? P.gold : P.u4, { shadow: P.void }); }
  if (s !== 'owned') {
    const lbl = s === 'buy' || s === 'poor' ? 'Buy · ' + cost : s === 'shut' ? 'Shut by its pair' : n.kind === 'ult' ? 'Needs 6 nodes' : 'Locked';
    flatButton(X0 + 4, by, PW - 8, lbl, s === 'buy', s === 'buy' || s === 'poor');
  }
  if (s === 'poor') text('Not enough Souls: ' + TREE_SOULS + ' of ' + cost + '.', X0 + 4, by + 18, 'tiny', P.crimson, { shadow: P.void });
  else text('Each buy in this tree costs +15%.', X0 + 4, by + 18, 'tiny', P.u4, { shadow: P.void });
  // respec: free while testing
  const ry = 200;
  shadowU(X0 + 4, ry, PW - 8, 13, { k: 0.5, r: 2, dx: 1, dy: 2 }); plateU(X0 + 4, ry, PW - 8, 13, { top: 0.4, bot: 0.22, hi: 0.72 });
  text('Respec · free while testing', X0 + PW / 2, ry + 4, 'tiny', P.u6, { align: 'c', shadow: P.void });
  footerMoney(X0, PW, { gold: st.gold, souls: TREE_SOULS, record: st.record });
}
