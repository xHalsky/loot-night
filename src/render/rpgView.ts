// The battle area's view model (V2, #67): the game's state, read once a frame and handed to the renderer
// (src/render/page/live.js). Rules never live here; this file only reads S.g / N() and lays things out on the grid.
import { T } from '../config/tuning';
import { S, N, RARITIES, type Enemy, type Hero, type HeroId, type Item, type BagEntry, type Stat, type ServiceSpot } from '../core/state';
import { ENEMY_BY_ID, bossFor } from '../data/enemies';
import { MAP_INFO, RARITY_COLOR, CLASS_ICON, isClassSlot } from '../data/items';
import { canWear } from '../systems/gear';
import { MAP_CARD, FEATURE_TEXT, CONDITION_TEXT } from '../data/routes';
import { ULT_SLOT, ABILITIES, HOME_POSITIONS, AURAS, HERO_NAME, HERO_CLASS, heroLabel } from '../data/heroes';
import { outOfPosition } from '../systems/positions';
import { boughtCount, autocastBought, autocastOn, nodeState, nodeCost } from '../systems/tree';
import { NODES, TREES, BUYABLE, type NodeId } from '../data/trees';
import { heroPower, xpNeeded, heroStats, heroBaseStats, itemPower } from '../systems/stats';
import { CITY } from '../data/city';
import { serviceApplies, serviceSum } from '../systems/town';
import { specialText } from '../systems/affixes';
import { SPECIAL_BY_ID } from '../data/affixes';
import { LEGEND_BY_ID, SET_BY_ID } from '../data/legendaries';
import { STAT_LABEL } from '../data/items';
import { maxHp } from '../systems/stats';
import { abilitiesLocked, abilityUnlocked, bodies, moveOf } from '../systems/battle';
import { curioDef, curioBlocked, curioText } from '../systems/curios';
import { CURIO_BY_ID } from '../data/curios';
import { GOBLIN, goblinPos } from '../ui/monitor';
import { POS_X, ENEMY_SLOTS, FLOOR_Y } from '../core/arena';
import { unbanked } from '../systems/run';
import { BLESSINGS, type BlessingId } from '../data/blessings';

/** The live battle area replaces the old one whenever the party is in the dungeon (the floor map too), and in town
 *  while the Skill Tree tab is open (the tree covers the town, #53). */
export function liveActive(): boolean {
  const n = S.g.night;
  return !!n && S.g.screen === 'night';   // the dungeon, the floor map, the town and the skill tree
}
/** The side panel is drawn by the renderer (V2 with #53): the party in the dungeon, the three tabs in town. */
export function panelActive(): boolean {
  const n = S.g.night;
  return !!n && S.g.screen === 'night';
}

// ---- the skill tree (#53; grid doc §6c)
const treeHero = (): HeroId => { const n = N(); const id = n.treeHero && S.g.heroes.some(h => h.id === n.treeHero) ? n.treeHero : S.g.heroes[0].id; return id; };
/** A skill's line in plain words, from its tooltip (placeholders filled, markup dropped). */
function skillText(hero: HeroId, slot: number): string {
  const A = ABILITIES[hero][slot];
  return (A.tip ?? A.desc).replace(/^Ultimate: /, '').replace(/\[(\w+)\](.*?)\[\/\]/g, '$2').replace('{dmg}', `${A.power ?? 1}x attack`).replace('{heal}', 'a big heal')
    .replace(/\{dur\}/g, String(A.dur ?? 0)).replace('{stagger}', String(T.MARK_STAGGER_FIRE)).replace('{shatter}', String(T.MARK_CHILL_BASH))
    .replace('{reflect}', String(Math.round(T.MARK_TAUNT_REFLECT * 100))).replace('{backstab}', String(T.MARK_STAGGER_BACKSTAB));
}
function nodeInfo(hero: HeroId, id: NodeId): { name: string; kind: string; fx: string } {
  const Tr = TREES[hero], n = NODES[id], sk = (s: number) => ABILITIES[hero][s].name;
  if (id === 'root') return { name: sk(0), kind: 'Auto attack', fx: ABILITIES[hero][0].desc };
  if (id === 's1') return { name: sk(1), kind: 'Skill 1 · from the start', fx: skillText(hero, 1) };
  if (id === 's2') return { name: sk(2), kind: 'Unlock · skill 2', fx: skillText(hero, 2) };
  if (id === 'ult') return { name: sk(3), kind: 'Ultimate', fx: skillText(hero, 3) + ' Never autocasts.' };
  if (n.kind === 'rule') { const R = Tr.rules[id as 'r1a']; return { name: R.name, kind: `Rule · ${sk(id[1] === '1' ? 1 : 2)}`, fx: R.fx }; }
  if (n.kind === 'auto') { const s = sk(id === 'a1' ? 1 : 2); return { name: `Autocast ${s}`, kind: `Autocast · ${s}`, fx: `${s} casts itself the moment it's ready. Dumb on purpose: no marks, no combos. It keeps firing while you're away.` }; }
  const St = Tr.stats[id as 'g1'], to = n.to === 'ult' ? sk(3) : n.to === 's2' ? sk(2) : n.to === 'r1' ? `${sk(1)}'s rules` : n.to === 'r2' ? `${sk(2)}'s rules` : 'its autocast';
  return { name: St.name, kind: `Stat · on the way to ${to}`, fx: St.fx };
}
export function treeView(hov: string | null) {
  const hero = treeHero(), Tr = TREES[hero];
  const pair = (r: 'r1' | 'r2') => [[Tr.rules[`${r}a`].name, Tr.rules[`${r}a`].fx], [Tr.rules[`${r}b`].name, Tr.rules[`${r}b`].fx]];
  const st = Object.fromEntries(Object.entries(Tr.stats).map(([k, v]) => [k, [v.name, v.fx]]));
  return { hero, bought: [...(S.g.trees?.[hero] ?? [])], souls: S.g.mats, hov, texts: { r1: pair('r1'), r2: pair('r2'), st } };
}
export function panelView(hov: string | null) {
  const n = N(), town = n.location === 'town', tab = town ? (n.townTab ?? 'town') : 'party';
  if (tab === 'tree') return { ...treePanelView(hov), tabs: true };
  if (tab === 'town' && n.svc) return { ...servicePanelView(n.svc), tabs: true };
  if (tab === 'town') return { ...townPanelView(), tabs: true };
  return { ...partyPanelView(), tabs: town, tab };
}
// an item in a panel cell (hud.js itemCell): icon, rarity, power, lock, NEW, the unbanked dashes, the upgrade arrow
const SLOT_ICON: Record<string, string> = { weapon: 'sword', helm: 'helm', armor: 'armor', boots: 'boots', ring: 'ring', trinket: 'amulet' };
function itemIcon(it: Item): string {
  if (!it.identified) return 'unknown';
  if (it.cls && isClassSlot(it.slot)) return CLASS_ICON[it.cls][it.slot];   // class gear (#113): a staff looks like a staff
  return SLOT_ICON[it.slot];
}
/** The pointer over the side panel (#113, from main.ts): the bag item under it (its ring when the selected hero can't
 *  wear it), what is in your hand ('bag:id' or 'gear:slot': its square stays empty till it lands), and the bag item the
 *  button is held on (#114: once picked up, its slot in the selected hero's gear lights). */
const panelPtr: { hover: string | null; lift: string | null; hold: { id: string; at: number } | null } = { hover: null, lift: null, hold: null };
/** The gear slot a picked-up bag item goes in (#114): gold, or crimson when the selected hero can't wear it. */
function aimOf(h: Hero): { slot: string; bad: boolean } | null {
  const hd = panelPtr.hold;
  if (!hd || (panelPtr.lift !== `bag:${hd.id}` && performance.now() - hd.at < T.PICKUP_HOLD_SEC * 1000)) return null;
  const e = S.g.bag.find(x => x.id === hd.id);
  return e && e.kind === 'item' ? { slot: e.item.slot, bad: !canWear(h, e.item) } : null;
}
export function setPanelPtr(p: Partial<typeof panelPtr>) { Object.assign(panelPtr, p); }
/** A shake (#113; gentle since #114) at p (0..1 of WRONG_CLASS_SHAKE_SEC), in whole grid px: WRONG_CLASS_SHAKE_HOPS
 *  hops of WRONG_CLASS_SHAKE_PX, right, left, right, left, then still. The bag square and the item in hand share it. */
export function shakeDx(p: number): number {
  if (p < 0 || p >= 1) return 0;
  return (Math.floor(p * T.WRONG_CLASS_SHAKE_HOPS) % 2 ? -1 : 1) * T.WRONG_CLASS_SHAKE_PX;
}
/** The item's icon offset while it shakes in its square (a refused equip). */
function shakeOf(id: string): number {
  const r = N().reject;
  return r && r.id === id ? shakeDx(1 - r.t / T.WRONG_CLASS_SHAKE_SEC) : 0;
}
function cellOf(e: BagEntry | undefined, ring = false): Record<string, unknown> {
  if (!e) return { empty: true };
  const n = N(), fresh = n.fresh.some(f => f.id === e.id), sel = n.selected === e.id;
  if (panelPtr.lift === `bag:${e.id}`) return { id: e.id, lifted: true };
  if (e.kind === 'map') return { id: e.id, icon: 'map', r: 'rare', isNew: fresh, run: !!e.run, sel };
  if (e.kind === 'feather') return { id: e.id, icon: 'feather', r: 'epic', isNew: fresh, sel };
  const it = e.item, up = it.identified && S.g.heroes.some(h => canWear(h, it) && heroPower(h, { [it.slot]: it }) > heroPower(h));
  const h = S.g.heroes[n.heroTab], bad = ring && panelPtr.hover === e.id && !!h && !canWear(h, it);
  return { id: e.id, icon: itemIcon(it), r: it.rarity, pow: it.identified ? itemPower(it) : '?', lock: !!it.locked, isNew: fresh, run: !!e.run, up, sel, bad, shake: shakeOf(e.id) };
}
function gearCell(it: Item | undefined, slot: string) {
  if (!it) return null;
  if (panelPtr.lift === `gear:${slot}`) return { id: it.id, lifted: true };
  return { id: it.id, icon: itemIcon(it), r: it.rarity, pow: it.identified ? itemPower(it) : '?', lock: !!it.locked, run: !!it.run };
}
/** ring: the party tab, where the selected hero is on show; hovering class gear he can't wear rings it red (#113). */
function bagView(ring = false) {
  const g = S.g, cells: Record<string, unknown>[] = [];
  for (let k = 0; k < T.BAG_SIZE + T.TREASURY_ROW; k++) cells.push(k >= g.bagSize ? { locked: true } : cellOf(g.bag[k], ring));
  return { bag: cells, bagCount: g.bag.length, bagSize: g.bagSize, autoSalvage: g.autoSalvage };
}
const foot = () => ({ gold: S.g.gold, souls: S.g.mats, record: Math.max(S.g.record, N().deepest) });
function partyCards() {
  const powers = S.g.heroes.map(h => heroPower(h)), best = Math.max(...powers);
  return S.g.heroes.map((h, i) => ({ hero: h.id, id: PAGE_ID[h.id], short: HERO_NAME[h.id], lv: h.level, pow: powers[i], xp: h.xp / xpNeeded(h), down: h.downed, alert: best > 0 && powers[i] < best * T.POWER_BEHIND }));
}
function partyPanelView() {
  const n = N(), h = S.g.heroes[n.heroTab] ?? S.g.heroes[0], st = heroStats(h), base = heroBaseStats(h);
  const r1 = (v: number) => String(Math.round(v * 10) / 10), r0 = (v: number) => String(Math.round(v));
  const row = (k: Stat, label: string, f: (v: number) => string) => { const d = st[k] - base[k]; return [label, f(st[k]), Math.abs(d) >= 0.05 ? `${d > 0 ? '+' : ''}${f(d)}` : ''] as const; };
  const gear: Record<string, unknown> = {};
  for (const sl of ['weapon', 'helm', 'armor', 'boots', 'ring', 'trinket'] as const) gear[sl] = gearCell(h.gear[sl], sl);
  return { party: partyCards(), sel: S.g.heroes.indexOf(h), hero: { name: h.name, cls: HERO_CLASS[h.id], pow: heroPower(h) }, gear, ghosts: CLASS_ICON[h.id], aim: aimOf(h),
    stats: [row('hp', 'HP', r0), row('atk', 'ATK', r1), row('armor', 'ARM', r1), row('speed', 'SPD', r1), row('crit', 'CRIT', r1), row('luck', 'LUCK', r1)], ...bagView(true), ...foot() };
}
function townPanelView() {
  const g = S.g, cps = [...g.checkpoints].sort((a, b) => a - b), f = cps.includes(g.startFloor) ? g.startFloor : 1;
  const builds = CITY.map(c => { const lv = g.furniture[c.id] ?? 0; return { id: c.id, name: c.name, lv, fx: lv >= 3 ? c.effect[2] : `Next: ${c.effect[lv]}`, gold: c.gold[lv], souls: c.mats[lv], ok: lv < 3 && g.gold >= c.gold[lv] && g.mats >= c.mats[lv], tip: lv < 3 ? `${c.name}: ${c.effect[lv]} (15 min)` : '', hot: N().plotHot === c.id }; });   // the plot clicked on the map lights its row
  return { tab: 'town', builds, floor: f, canDown: cps[0] !== f, canUp: cps[cps.length - 1] !== f, ...bagView(), ...foot() };
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** The Town portal plate's second line: what it banks, or the trip's time when the run holds nothing yet. */
const bankLabel = (u = unbanked()) => (u.items || u.gold ? `bank ${u.items} · ${u.gold} g` : '15 min');
const SVC: Record<ServiceSpot, { name: string; mark: string; line: string }> = {
  forge: { name: 'SALVAGE FORGE', mark: 'anvil', line: 'Melt gear into Souls.' },
  merchant: { name: 'MERCHANT', mark: 'scales', line: 'Buys loot for gold.' },
  appraiser: { name: 'APPRAISER', mark: 'eye', line: `Epics ${T.IDENTIFY_COST.epic} g, legendaries ${T.IDENTIFY_COST.legendary} g.` },
  auction: { name: 'AUCTION HOUSE', mark: 'gavel', line: 'Sells loot for real money, in dollars.' },
};
function servicePanelView(svc: ServiceSpot) {
  const n = N(), g = S.g, picked = (n.svcPick ?? []).filter(id => g.bag.some(e => e.id === id));
  const cells = [];
  for (let k = 0; k < g.bagSize; k++) {
    const e = g.bag[k], c = cellOf(e);
    if (e) {
      const ok = serviceApplies(svc, e), v = ok ? serviceSum(svc, [e.id]) : 0;
      Object.assign(c, { applies: ok, picked: picked.includes(e.id), sel: false, badge: !ok ? '' : svc === 'forge' ? `+${v}` : svc === 'auction' ? `$${v}` : `${v}g`, badgeCol: svc === 'forge' ? 'u6' : 'gold' });
    }
    cells.push(c);
  }
  const sum = serviceSum(svc, picked), k = picked.length;
  const S0 = { ...SVC[svc], cells, soul: svc === 'forge', summary: '', why: 'Locked, unknown and maps: no.', button: '', ok: k > 0, note: '', cost: '', reveal: null as unknown };
  if (svc === 'forge') { S0.summary = `${k} picked: +${sum}`; S0.button = `Salvage ${k} · +${sum}`; S0.note = "The bag's AUTO melts commons and uncommons as they drop."; }
  if (svc === 'merchant') {
    S0.summary = `${k} picked: +${sum} g`; S0.button = `Sell ${k} · +${sum} g`;
    const rare = picked.map(id => g.bag.find(e => e.id === id)).find(e => e?.kind === 'item' && RARITIES.indexOf(e.item.rarity) >= 2);
    if (rare && rare.kind === 'item') S0.note = `${rare.item.name} is ${rare.item.rarity}: the Auction House may pay more for it.`;
  }
  if (svc === 'auction') { S0.summary = `${k} picked: ~$${sum}`; S0.button = `List ${k} · ~$${sum}`; S0.note = `Pays tomorrow morning. ${T.COST_LIST_MIN} min each.`; }
  if (svc === 'appraiser') {
    S0.why = 'Only the unknown ones: epics and legendaries.';
    S0.summary = k ? `Identify: ${sum} g (${T.COST_IDENTIFY_MIN} min)` : 'Pick an unknown item.'; S0.button = `Identify · ${sum} g`; S0.ok = k > 0 && g.gold >= sum;
    const a = n.appraised, e = a && g.bag.find(x => x.id === a.id);
    if (a && e && e.kind === 'item' && a.t < 6) {
      const it = e.item, sp = it.special ? specialText(it) : null, who = it.legend ? LEGEND_BY_ID[it.legend].hero : it.set ? SET_BY_ID[it.set].hero : it.cls ?? null;
      const lines: [string, string, string][] = it.affixes.map(x => [`${x.amount >= 0 ? '+' : ''}${x.amount} ${STAT_LABEL[x.stat]}`, x.amount >= 0 ? 'g6' : 'crimson', '']);
      if (sp) lines.push([SPECIAL_BY_ID[it.special!].suffix, sp.life ? 'real life' : 'cross', sp.text]);
      if (it.legend) lines.push([LEGEND_BY_ID[it.legend].name, 'rule', LEGEND_BY_ID[it.legend].rule]);
      S0.reveal = { t: a.t, cell: cellOf(e), name: it.name, sub: `${cap(it.rarity)} ${it.slot}`, who: who ? `For ${heroLabel(who)}` : '', lines };
    }
  }
  return { tab: 'town', svc: S0, ...foot() };
}
function treePanelView(hov: string | null) {
  const n = N(), g = S.g, hero = treeHero(), bought = [...(g.trees?.[hero] ?? [])] as NodeId[];
  const id = ((hov ?? n.treeSel ?? BUYABLE.find(x => nodeState(hero, x) === 'buy') ?? 's2') as NodeId);
  const info = nodeInfo(hero, id), state = id === 'root' || id === 's1' ? 'owned' : nodeState(hero, id), N0 = NODES[id];
  const notes: [string, string][] = [];
  if (state === 'owned') notes.push(['+', id === 'root' || id === 's1' ? 'He starts with it.' : 'Bought.']);
  if (N0.pair) notes.push(['-', state === 'shut' ? `Shut: you took ${nodeInfo(hero, N0.pair).name}. Respec to swap.` : `Locks ${nodeInfo(hero, N0.pair).name}.`]);
  if (state === 'locked' && N0.kind === 'ult') notes.push(['-', `Needs ${T.TREE_ULT_NEEDS} nodes in his tree: ${bought.length} of ${T.TREE_ULT_NEEDS}.`]);
  else if (state === 'locked' && N0.req) notes.push(['-', `Needs ${nodeInfo(hero, N0.req).name}.`]);
  if (N0.kind === 'auto') notes.push(['+', 'A loop mark on its well. Right-click the well to switch it off.']);
  const party = partyCards();
  const tv = treeView(hov);
  return { tab: 'tree', hero, short: HERO_NAME[hero], cls: HERO_CLASS[hero], souls: g.mats, gold: g.gold, record: Math.max(g.record, n.deepest), party, bought, ultName: ABILITIES[hero][3].name,
    node: { id, ...info, state, cost: nodeCost(hero, id), isUlt: N0.kind === 'ult', notes }, texts: tv.texts };
}

const PAGE_ID: Record<HeroId, string> = { knight: 'knight', rogue: 'rogue', mage: 'mage', healer: 'priest' };
const PH: Record<string, number> = { knight: 2.6, rogue: 3.4, mage: 1.3, priest: 0 };
const KEYS: Record<HeroId, string[]> = { knight: ['1', '2', '3'], rogue: ['Z', 'X', 'C'], mage: ['Q', 'W', 'E'], healer: ['A', 'S', 'D'] };
const PAGE_SLOT: Record<string, number> = { knight: 0, rogue: 1, mage: 2, priest: 3 };   // hud.js HEROES order
// where everyone stands: core/arena.ts (grid doc §4b, §4c); the systems place numbers and drops there too
const RIG: Record<string, { rig: string; o?: Record<string, unknown> }> = {
  skeleton: { rig: 'skel' }, collector: { rig: 'zomb', o: { sword: true } }, auditor: { rig: 'necro' }, ghoul: { rig: 'zomb' },
  shelter: { rig: 'skel', o: { helm: true, shield: true } },
};
const MOVE_LABEL: Record<string, string> = { slam: 'Smash', loan: 'Summon', evict: 'Execute', hook: 'Hook', shove: 'Shove' };
const MARK_TAG: Record<string, [string, string]> = { stagger: ['STAGGERED', 'bone'], chill: ['CHILLED', 'stone'], judged: ['JUDGED', 'pale'], taunted: ['TAUNTED', 'dusk'] };
const RARITY_IDX: Record<string, string> = { common: 'moon', uncommon: 'moss', rare: 'stone', epic: 'arcane', legendary: 'gold' };
const colorIdx = (c: string) => /f2b84b|ffd/.test(c) ? 'gold' : /ff8a80|ff5a5a|e0524a/.test(c) ? 'crimson' : /6fcf7f|9fe08a/.test(c) ? 'heal' : /8fd8ff|8fb3ff|6aa8ff/.test(c) ? 'stone' : 'moon';

let flowStep = 0, flowGlowUntil = 0;

/** The floor map's view (#52, 1.5): the run so far, the path cards, the hovered one, the away hourglass. */
function pathsView(hov: number, hovT: number) {
  const n = N(), next = n.floor + 1, start = n.run?.startFloor ?? 1;
  const hist: number[] = []; for (let f = Math.max(start, n.floor - 3); f <= n.floor; f++) hist.push(f);
  const mapInfo: Record<string, { name: string; r: string; pays: string; cost: string }> = {};
  const cards = (n.paths ?? []).map(c => {
    if (c.map && c.mapKind) { mapInfo[c.mapKind] = { name: MAP_INFO[c.mapKind].name, r: 'rare', ...MAP_CARD[c.mapKind] }; return { map: c.mapKind }; }
    return { ...(c.feat ? { feat: c.feat } : {}), ...(c.cond ? { cond: c.cond } : {}), ...(c.boss ? { boss: true } : {}) };
  });
  const portalOk = !n.run?.oath;
  return { title: 'Shadow Crypt', sub: `Floor ${n.floor} cleared · ${next % T.CHECKPOINT_EVERY === 0 ? 'the boss waits below' : 'choose the way down'}`, floor: next, hist, cards, mapInfo,
    safest: n.safest, away: n.mapAway, hov, hovT, flow: n.flow.toFixed(1), flowBar: (n.flow - T.FLOW_MIN) / (T.FLOW_MAX - T.FLOW_MIN),
    bossName: next % T.CHECKPOINT_EVERY === 0 ? bossFor(next, T.CHECKPOINT_EVERY).name : '',
    portalOk, portalLabel: portalOk ? bankLabel() : 'oath', texts: { feat: FEATURE_TEXT, cond: CONDITION_TEXT } };
}

/** The pointer's business with the party (marching order, #52 1.6): a hero being dragged, the one under the pointer. */
export interface PartyPointer { drag: { from: number; x: number; y: number; over: number } | null; hover: number }
/** Where a hero stands now: his position's x, or on the way there after a swap, a Hook or a Shove. */
export function heroX(i: number): number {
  const h = S.g.heroes[i];
  if (!h?.moving || h.from == null) return POS_X[i];
  const k = 1 - h.moving / T.SWAP_SEC, e = k * k * (3 - 2 * k);
  return Math.round(POS_X[h.from] + (POS_X[i] - POS_X[h.from]) * e);
}

// ---- the town (V2, #53; grid doc §6): Ravenhold, the hovered building's halo and card; a service holds its halo
function townView(hov: string | null) {
  const g = S.g, n = N(), build: Record<string, { fx: string[]; cost: number[][] }> = {}, levels: Record<string, number> = {};
  for (const c of CITY) { build[c.id] = { fx: ['', ...c.effect], cost: c.gold.map((gg, k) => [gg, c.mats[k]]) }; levels[c.id] = g.furniture[c.id] ?? 0; }
  return { build, levels, gold: g.gold, souls: g.mats, hover: hov ?? n.svc ?? n.plotHot ?? null, noTip: !hov };
}

export function buildBattleView(nowMs: number, hov = -1, hovT = 0, pp: PartyPointer = { drag: null, hover: -1 }, treeHov: string | null = null, townHov: string | null = null) {
  const g = S.g, n = N();
  if (n.location === 'town' && n.townTab === 'tree') return { tree: treeView(treeHov ?? n.treeSel ?? null) };
  if (n.location === 'town') return { town: townView(townHov) };
  if (n.phase === 'mapChoice' && n.paths) return { paths: pathsView(hov, hovT) };
  // the party in marching order, front first (#52, 1.6): position 1 is S.g.heroes[0]
  const order = g.heroes.map((h, i) => ({ h, i }));
  const party = order.map(({ h }, position) => {
    const id = PAGE_ID[h.id];
    return { id, x: heroX(position), ph: PH[id], hp: h.downed ? 0 : h.hp / maxHp(h), down: h.downed, lunge: (h.lunge ?? 0) > 0 && !h.moving ? 3 : 0, swing: (h.swing ?? 0) > 0 && !h.downed ? 1 - h.swing! / T.SWING_SEC : null };
  });
  // the enemies: six positions, fodder in two lanes, the boss or the lieutenant behind them; a newcomer slides in
  const enemies = n.enemies.map((e: Enemy) => {
    const d = ENEMY_BY_ID[e.defId], sl = ENEMY_SLOTS[e.slot] ?? ENEMY_SLOTS[0];
    const boss = e.boss, lane = sl.lane, x = sl.x + Math.round((e.enter ?? 0) / T.STEP_IN_SEC * 50);
    const rig = !boss ? RIG[e.defId] : undefined;
    const s = boss ? 4 : 3;
    let barY = sl.bar;
    if (!rig && d) { const h = Math.max(...d.sprite.map(r => r[1] + r[3])) * s; barY = Math.max(66, sl.y - h - (e.defId === 'bat' ? 26 : 8)); }
    const tags: [string, string][] = [];
    if (e.shield) tags.push(['SHIELD', 'stone']);
    if (e.enraged) tags.push(['ENRAGED', 'crimson']);
    for (const k of Object.keys(e.marks ?? {})) if ((e.marks as Record<string, number>)[k] > 0 && MARK_TAG[k]) tags.push(MARK_TAG[k]);
    if (e.stunned > 0) tags.push(['STUNNED', 'moon']);
    const wind = (e.wind ?? 0) > 0 && e.windMax ? { label: windLabel(e), f: 1 - (e.wind ?? 0) / e.windMax } : null;
    return {
      dead: e.hp <= 0, boss, lane, x, barY, back: lane === 'back', hp: Math.max(0, e.hp / (e.maxHp || 1)), flash: e.flash, lunge: (e.lunge ?? 0) > 0 ? 3 : 0, ph: (e.uid % 7) * 0.9,
      rig: rig?.rig, o: rig?.o, px: rig ? null : d?.sprite, s, bodies: e.per ? bodies(e) : 1, fly: e.defId === 'bat', tags: tags.slice(0, 2), wind,
    };
  });
  // floating numbers and effects: the systems place them on the grid (core/arena.ts)
  const floaters = n.fx.map(f => ({ text: f.text, x: f.x, y: f.y, idx: colorIdx(f.color), big: f.text.endsWith('!') }));
  const vfx = n.vfx.map(v => ({ kind: v.kind, x: v.kind === 'chain' ? heroX(0) + 6 : v.x, y: v.kind === 'ward' ? 196 : v.y, x2: v.x2, y2: v.y2, k: v.t / v.dur }));   // the Hook's chain follows the hooked hero
  const loot = n.floorLoot.map(l => ({ x: l.x, y: FLOOR_Y, r: l.entry.kind === 'item' ? l.entry.item.rarity : 'map' }));
  const flies = n.lootFly.filter(f => f.t >= f.delay).map(f => { const k = (f.t - f.delay) / f.max; return { text: f.text, x: f.x + f.dx, y: 186 - k * 48, idx: rarityIdxOf(f.color) }; });
  // the corner
  const step = Math.floor((n.flow + 1e-6) / T.FLOW_GLOW_STEP);
  if (step > flowStep && n.flow > T.FLOW_MIN + 0.01) flowGlowUntil = nowMs + T.FLOW_GLOW_SEC * 1000;
  flowStep = step;
  const map = n.floorMap === 'plain' ? '' : ` · ${MAP_INFO[n.floorMap].name.toLowerCase()}`;
  const boss = n.floor % T.CHECKPOINT_EVERY === 0 ? ' · boss floor' : '';
  const corner = {
    where: `Shadow Crypt · floor ${n.floor} · battle ${Math.min(n.battleIdx + 1, T.BATTLES_PER_FLOOR)}/${T.BATTLES_PER_FLOOR}${map}${boss}`,
    flow: n.flow.toFixed(1), flowBar: (n.flow - T.FLOW_MIN) / (T.FLOW_MAX - T.FLOW_MIN), flowGlow: nowMs < flowGlowUntil,
  };
    const u = unbanked();
  const bar = barView(order.map(o => o.h));
  // a drag: the portrait lifts under the pointer, rings under both heroes, the target's portrait gets the gold frame
  const drag = pp.drag ? { id: PAGE_ID[g.heroes[pp.drag.from]?.id ?? 'knight'], x: pp.drag.x, y: pp.drag.y, rings: [heroX(pp.drag.from), ...(pp.drag.over >= 0 && pp.drag.over !== pp.drag.from ? [heroX(pp.drag.over)] : [])] } : null;
  if (pp.drag && pp.drag.over >= 0 && pp.drag.over !== pp.drag.from) (bar as { dropOn: number }).dropOn = pp.drag.over;
  return { mode: n.phase, cam: n.walkScroll * 0.7, walking: n.phase === 'walk', party, enemies, floaters, vfx, loot, flies, corner, portalOk: n.phase !== 'battle', bank: bankLabel(u), buffs: buffList(), curio: curioView(), goblin: goblinView(), bar,
    drag, heroCard: !pp.drag && pp.hover >= 0 ? heroCard(pp.hover) : null };
}

/** The card over a hovered hero (grid doc §5d): his position, what is wrong, what his aura gives and to whom. */
function heroCard(i: number) {
  const h = S.g.heroes[i];
  if (!h) return null;
  const [a, b] = HOME_POSITIONS[h.id];
  const lines: [string, string][] = [['h', HERO_NAME[h.id]], ['c', HERO_CLASS[h.id]]];   // name, then the class in its colour (cast of 2026-11-27)
  if (outOfPosition(h)) lines.push(['-', `Out of position: ${h.id === 'healer' ? 'heals' : 'hits'} at ${Math.round(T.OUT_OF_POSITION_MULT * 100)}%. His positions are ${a} to ${b}.`]);
  const A = AURAS[h.id], to: string[] = [];
  const front = S.g.heroes[i - 1], back = S.g.heroes[i + 1];
  if (A.front && front) to.push(`${heroLabel(front.id)}, in front of him,`);
  if (A.back && back) to.push(`${heroLabel(back.id)}, behind him,`);
  if (h.downed) lines.push(['-', 'Down: his aura is gone.']);
  else if (to.length) lines.push(['+', `${to.join(' and ')} ${to.length > 1 ? A.gives.replace(/^\w+/, w => PLURAL[w] ?? w) : A.gives}.`]);
  else lines.push(['n', `Nobody stands where his aura reaches.`]);
  lines.push(['n', `Position ${i + 1}. ${outOfPosition(h) ? 'Drag him back. Away, the line stays broken.' : 'Drag him onto another hero to swap.'}`]);
  return { x: heroX(i), lines };
}
const PLURAL: Record<string, string> = { takes: 'take', gets: 'get', regenerates: 'regenerate' };

function windLabel(e: Enemy): string {
  const m = moveOf(e) ?? '';
  const base = MOVE_LABEL[m] ?? 'Wind-up';
  if (m === 'evict' && e.evict != null) return `${base} · position ${e.evict + 1}`;   // EXECUTE names a position (#52, 1.6)
  if (m === 'hook') return `${base} · position ${S.g.heroes.length}`;
  if (m === 'shove') return `${base} · position 1`;
  return base;
}
function rarityIdxOf(color: string): string {
  for (const [r, c] of Object.entries(RARITY_COLOR)) if (c.toLowerCase() === color.toLowerCase()) return RARITY_IDX[r] ?? 'moon';
  return colorIdx(color);
}

// buffs, right to left from the top-right corner (grid doc §5)
function buffList() {
  const n = N(), out: { icon?: string; picon?: string; run?: boolean; label: string; bad?: boolean; sweep?: number; tip: string }[] = [];
  // run blessings sit right-most: the curio's icon in a dashed frame, "run" (grid doc §5c)
  const counts = new Map<string, number>();
  for (const b of n.run?.blessings ?? []) counts.set(b, (counts.get(b) ?? 0) + 1);
  for (const [id, k] of counts) { const d = BLESSINGS[id as BlessingId]; out.push({ picon: d.icon, run: true, label: k > 1 ? `x${k}` : 'run', tip: `${d.name}, this run: ${d.got}. Cost: ${d.cost}.` }); }
  const add = (icon: string, left: number, max: number, tip: string, bad = false) => out.push({ icon, label: `${Math.ceil(left)}s`, bad, sweep: max ? 1 - left / max : undefined, tip });
  if (n.boost > 0) add('can', n.boost, T.MONSTER_BOOST_SEC, 'Goblin Fuel: party acts 30% faster');
  if (n.crash > 0) add('crash', n.crash, T.MONSTER_CRASH_SEC, 'Sugar crash: party slower', true);
  if (n.lastStand > 0) add('shield', n.lastStand, T.LAST_STAND_SEC, 'Last Stand: nobody drops below 1 HP');
  if (n.taunt > 0) add('taunt', n.taunt, ABILITIES.knight[1].dur ?? 5, 'Taunt: enemies hit the knight');
  if (n.ward > 0) add('ward', n.ward, ABILITIES.healer[2].dur ?? 6, 'Ward: party protected');
  for (const b of n.partyBuffs) {
    if (b.fights !== undefined) out.push({ icon: 'cleave', label: 'next', tip: `${b.name}: party +${Math.round(b.dmg * 100)}% damage for the next fight` });
    else if (b.floor) out.push({ icon: b.dmg < 0 ? 'crash' : 'cleave', label: 'floor', bad: b.dmg < 0, tip: `${b.name}: party ${Math.round(b.dmg * 100)}% damage until the next floor` });
    else add(b.dmg < 0 ? 'crash' : 'hellfire', b.t, b.max, `${b.name}: party ${b.dmg >= 0 ? '+' : ''}${Math.round(b.dmg * 100)}% damage${b.speed ? `, +${Math.round(b.speed * 100)}% speed` : ''}`, b.dmg < 0);
  }
  if (n.goodDog > 0) add('judge', n.goodDog, T.GOOD_BOY_SEC, `Good Boy: loot goblins x${T.GOOD_BOY_GOBLIN}`);
  if (n.sulk > 0) add('crash', n.sulk, T.CURIO_SULK_SEC, `${heroLabel('mage')} sulks about the guild bank`, true);
  if (n.guilt > 0) add('crash', n.guilt, T.GUILT_SEC, 'Guilt: party -10% damage', true);
  return out.slice(0, 7);
}

// the curio's parchment card in the band, its two choices (the page's layout: 85 x 20 buttons)
function curioView() {
  const n = N(), at = n.curioAt;
  if (n.phase !== 'curio' || !n.curio) { const d = at && CURIO_BY_ID[at.id]; return d ? { x: Math.round(at.x), px: d.sprite, card: null, passed: at.passed } : null; }   // coming up, or going by behind (#99)
  const c = n.curio, d = curioDef(c);
  if (!d) return null;
  const choices = c.stage === 'ask'
    ? d.choices.map(ch => {
      const why = curioBlocked(ch.id);
      return { label: [[curioText(ch.label), why ? 'u4' : 'u6']], cost: [[fit(why || curioText(ch.cost), 19), why ? 'u4' : 'u5']], act: why ? '' : 'curio', arg: ch.id, tip: why || curioText(ch.cost) };
    })
    : [{ label: [[c.stage === 'pick' ? 'Picking the lock' : 'Sneaking', 'u6']], cost: [[`${Math.ceil(c.t)} s left`, 'u5']], act: '', arg: '', tip: '' }];
  return { x: Math.round(at?.x ?? T.CURIO_STOP_X), px: d.sprite, card: { title: d.name, line: fit(d.line, 40), timer: c.stage === 'ask' ? Math.max(0, c.t / c.max) : 1 - Math.max(0, c.t / c.max), choices } };
}
const fit = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 3).trimEnd() + '...');

function goblinView() {
  const gp = goblinPos();
  return gp ? { x: gp.x, px: GOBLIN } : null;
}

// the skill bar (grid doc §5): groups in marching order, two skills and the ultimate's gilded well
function barView(heroes: Hero[]) {
  const n = N();
  const hp = [1, 1, 1, 1], cooldown: Record<string, { f: number; s: number | string }> = {}, ult: Record<string, string | { need: number | string }> = {}, autocast: Record<string, boolean> = {};
  let answer: string | null = null, combo: { key: string; label: string } | null = null;
  const wind = n.enemies.find(e => e.hp > 0 && (e.wind ?? 0) > 0);
  heroes.forEach(h => {
    const pid = PAGE_ID[h.id];
    hp[PAGE_SLOT[pid]] = h.downed ? 0 : h.hp / maxHp(h);
    KEYS[h.id].forEach((key, k) => {
      const si = k + 1, A = ABILITIES[h.id][si];
      if (si === ULT_SLOT && !abilityUnlocked(h, si)) { const need = T.TREE_ULT_NEEDS - boughtCount(h.id); ult[key] = { need: need > 0 ? need : '+' }; return; }   // the tree: nodes still missing
      if (!abilityUnlocked(h, si)) { cooldown[key] = { f: 1, s: '' }; return; }   // skill 2: unlocked in the skill tree (#53)
      if (autocastBought(h.id, si)) autocast[key] = autocastOn(h.id, si);
      if (si === ULT_SLOT) {
        if (h.ult < 1) cooldown[key] = { f: 1 - h.ult, s: Math.ceil((1 - h.ult) * T.ULT_CHARGE_SEC) };
        ult[key] = 'ready';
        return;
      }
      if (h.cd[si] > 0) cooldown[key] = { f: h.cd[si] / (A.cd || 1), s: Math.ceil(h.cd[si]) };
      else if (wind && !h.downed && answers(wind, h.id, si)) answer = key;
      else if (!combo && !h.downed) { const c = comboLabel(h.id, si); if (c) combo = { key, label: c }; }
    });
  });
  return { order: heroes.map(h => PAGE_ID[h.id]), heroIdx: heroes.map((_, i) => i), selected: n.heroTab, hp, cooldown, ult, answer, combo, queued: null, autocast, blocked: abilitiesLocked() && n.location === 'dungeon' ? abilitiesLocked() : null,
    outpos: heroes.filter(outOfPosition).map(h => PAGE_ID[h.id]), stopped: heroes.filter(h => h.moving).map(h => PAGE_ID[h.id]), outLabel: `x${T.OUT_OF_POSITION_MULT}`, dropOn: -1 };
}
/** A mark on the field that this skill cashes in (docs/design/dungeon.md, ability marks): the well glows gold. */
function comboLabel(id: HeroId, si: number): string {
  const alive = N().enemies.filter(e => e.hp > 0);
  const has = (e: Enemy | undefined, m: string) => !!e && ((e.marks as Record<string, number> | undefined)?.[m] ?? 0) > 0;
  if (id === 'mage' && si === 1 && alive.some(e => has(e, 'stagger'))) return `x${T.MARK_STAGGER_FIRE}`;
  if (id === 'knight' && si === 2 && has(alive.find(e => (e.wind ?? 0) > 0) ?? alive.find(e => e.shield) ?? alive[0], 'chill')) return `x${T.MARK_CHILL_BASH}`;
  if (id === 'healer' && si === 2 && alive.some(e => has(e, 'taunted'))) return 'back';
  return '';
}
/** Skills that answer a boss's wind-up (as the old skill bar's red pulse). */
function answers(e: Enemy, id: HeroId, si: number): boolean {
  const move = ENEMY_BY_ID[e.defId]?.move;
  if (move === 'slam') return (id === 'knight' && (si === 1 || (si === 2 && !e.braced))) || (id === 'healer' && si === 2);
  if (move === 'evict') return (id === 'knight' && si === 1) || (id === 'healer' && si === 2);
  if (move === 'loan') return id === 'mage' && si === 1;
  return false;
}
