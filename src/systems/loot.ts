import { T } from '../config/tuning';
import { S, N, uid, RARITIES, SLOTS, type BagEntry, type Item, type Rarity, type Stat, type MapKind, type Slot, type Enemy } from '../core/state';
import { pick, weighted, chance, rand } from '../core/rng';
import { ADJECTIVES, NOUNS, SLOT_STATS, STAT_BASE, RARITY_MULT, HAS_DOWNSIDE, MAP_INFO, FEATHER, RARITY_COLOR } from '../data/items';
import { toastAs } from '../core/fx';
const toast = toastAs('LOOT');   // feed tag (#49)
import { LIFE_AFFIXES, CROSS_AFFIXES, INSOMNIAC_AFFIXES, SPECIAL_BY_ID, type SpecialAffix } from '../data/affixes';
import { crossBonus, isWitching } from './affixes';
import { sfx } from '../ui/audio';
import { coach } from './coach';
import { noteDrop, rareWhy, setRareWhy } from './pacing';
import { blessPow } from './run';
import { ENEMY_SLOTS } from '../core/arena';
import { LEGENDS, SETS, SET_SLOTS } from '../data/legendaries';
import { legendOn } from './gear';

function round1(v: number) { return Math.round(v * 10) / 10; }
/** A stat's base roll at this item level. Attack, HP and armor compound (ITEM_POWER_GROWTH a level, #52 1.2) to keep pace
 *  with the enemies; speed, crit and luck stay linear (they are percentages and would run away). */
const GROWS: Stat[] = ['atk', 'hp', 'armor'];
export function statBase(stat: Stat, ilvl: number): number {
  const [a, b] = STAT_BASE[stat];
  return GROWS.includes(stat) ? (a + b) * T.ITEM_POWER_GROWTH ** (ilvl - 1) : a + b * ilvl;
}

export function rollRarity(floor: number, minIdx = 0): Rarity {
  const n = S.g.night;
  const w = T.RARITY_WEIGHTS.map((b, i) => b + T.RARITY_SHIFT_PER_FLOOR[i] * (floor - 1));
  let luck = 1;
  if (n) {
    luck += (n.flow - 1) * T.FLOW_LUCK;
    if (n.mood < T.MOOD_GREEN) luck += T.GREEN_MOOD_LUCK;
    if (n.zone >= 1) luck += T.ZONE_LUCK;
  }
  // Luck stat on gear: +1% rarer-drop weight per point across the party.
  const partyLuck = S.g.heroes.reduce((s, h) => s + Object.values(h.gear).reduce((a, it) =>
    a + (it && it.identified ? it.affixes.filter(x => x.stat === 'luck').reduce((q, x) => q + x.amount, 0) + crossBonus(it, 'luck') : 0), 0), 0);
  luck += partyLuck * 0.01;
  for (let i = 1; i < w.length; i++) w[i] *= luck;
  for (let i = 0; i < minIdx; i++) w[i] = 0;
  let idx = weighted(w);
  setRareWhy(minIdx >= 2 ? 'sure' : 'roll');
  if (S.g.pity >= T.PITY_EPIC && idx < 3) { idx = 3; setRareWhy('pity'); }
  // the first legendary of a save comes within LEGENDARY_FIRST_BY drops (#52, 1.3)
  S.g.drops++;
  if (!S.g.legendaryFound && S.g.drops >= T.LEGENDARY_FIRST_BY) { idx = 4; setRareWhy('first'); }
  if (idx === 4) S.g.legendaryFound = true;
  if (idx >= 3) S.g.pity = 0; else S.g.pity++;
  return RARITIES[idx];
}

/** At most one special affix: a real-life one (epic+) or a cross-system one (rare+). */
function rollSpecial(rarity: Rarity): SpecialAffix | null {
  const r = Math.random(), life = T.AFFIX_LIFE_CHANCE[rarity] ?? 0, cross = T.AFFIX_CROSS_CHANCE[rarity] ?? 0;
  if (r < life) return pick(LIFE_AFFIXES);
  if (r < life + cross) return isWitching() && chance(T.WITCHING_INSOMNIAC) ? pick(INSOMNIAC_AFFIXES) : pick(CROSS_AFFIXES);
  return null;
}

/** A new item. up: shift the rolled rarity up (Gilded Hand). Loot rules (#52, 1.8): a main stat line, then at most
 *  AFFIX_LINES by rarity (common 0 to epic and legendary 3); the downside (rare up) and a special affix each count as
 *  one. Every legendary is a named one with a rule for a hero in the party; an epic may be a set piece. */
export function genItem(ilvl: number, minRarity = 0, up = 0): Item {
  let rarity = rollRarity(ilvl, minRarity);
  if (up) rarity = RARITIES[Math.min(RARITIES.length - 1, RARITIES.indexOf(rarity) + up)];
  if (S.g.night?.floorMap === 'cursed' && S.g.night.location === 'dungeon') { if (RARITIES.indexOf(rarity) === 1) setRareWhy('cursed'); rarity = RARITIES[Math.min(RARITIES.length - 1, RARITIES.indexOf(rarity) + 1)]; }
  let witched = false;
  if (isWitching() && rarity !== 'legendary' && chance(T.WITCHING_UPGRADE)) { rarity = RARITIES[RARITIES.indexOf(rarity) + 1]; witched = true; }   // the Witching Hour shifts it up
  const inParty = (id: string) => S.g.heroes.some(h => h.id === id);
  const legend = rarity === 'legendary' ? pick(LEGENDS.filter(l => inParty(l.hero))) : undefined;
  const set = rarity === 'epic' && chance(T.SET_CHANCE) ? pick(SETS.filter(s => inParty(s.hero))) : undefined;
  const slot = legend?.slot ?? (set ? pick(SET_SLOTS) : pick(SLOTS));
  const mult = RARITY_MULT[rarity];
  const pool = [...SLOT_STATS[slot]];
  const affixes: { stat: Stat; amount: number }[] = [];
  const sp = rollSpecial(rarity);
  const lines = T.AFFIX_LINES[rarity] ?? 0, bonuses = Math.max(0, lines - (HAS_DOWNSIDE[rarity] ? 1 : 0) - (sp ? 1 : 0));
  const positives = 1 + bonuses;   // the main line, then the bonus lines
  for (let i = 0; i < positives; i++) {
    const stat = i < pool.length ? pool[i] : pick(pool);
    const amt = round1(statBase(stat, ilvl) * mult * rand(0.8, 1.15) * (i === 0 ? 1 : 0.6));
    const existing = affixes.find(x => x.stat === stat);
    if (existing) existing.amount = round1(existing.amount + amt); else affixes.push({ stat, amount: amt });
  }
  if (HAS_DOWNSIDE[rarity]) {
    const others: Stat[] = (['atk', 'hp', 'armor', 'speed', 'crit'] as Stat[]).filter(s => !affixes.some(a => a.stat === s));
    const stat = pick(others);
    affixes.push({ stat, amount: -round1(statBase(stat, ilvl) * 0.6 * rand(0.8, 1.2)) });
  }
  const ri = RARITIES.indexOf(rarity);
  let specialAmt: number | undefined;
  if (sp?.kind === 'cross') {
    if (sp.stat) specialAmt = Math.max(1, round1(statBase(sp.stat, ilvl) * mult * T.AFFIX_CROSS_PCT));
    else specialAmt = T.AFFIX_SPREADSHEET_GOLD;
  }
  const suffix = sp ? ` ${SPECIAL_BY_ID[sp.id].suffix}` : '';
  const name = legend ? legend.name + suffix : set ? `${set.name} ${set.nouns[slot as 'weapon']}${suffix}` : itemName(slot, rarity, sp?.id);
  const value = Math.round(6 * ilvl * mult * mult + 3 * (affixes.length - 1 + (sp ? 1 : 0)) + (sp ? 10 * mult : 0) + (legend || set ? 10 * mult : 0));
  return { id: uid(), name, slot, rarity, ilvl, affixes, value, identified: ri < 3, ...(sp ? { special: sp.id, specialAmt } : {}), ...(witched ? { witched } : {}),
    ...(legend ? { legend: legend.id } : {}), ...(set ? { set: set.id } : {}) };
}

/** Adjective + noun, plus "of X" only when the item has a special affix (#44): a suffix means a special effect. */
export function itemName(slot: Slot, rarity: Rarity, special?: string): string {
  const sp = special ? SPECIAL_BY_ID[special] : undefined;
  return `${pick(ADJECTIVES[rarity])} ${pick(NOUNS[slot])}${sp ? ` ${sp.suffix}` : ''}`;
}
/** True if the name uses the current word lists (old saves carry names from before #44). */
export function nameIsCurrent(it: Item): boolean {
  if (it.legend || it.set) return true;   // named by their legend or set (#52, 1.8)
  const sp = it.special ? SPECIAL_BY_ID[it.special] : undefined;
  return ADJECTIVES[it.rarity].some(a => NOUNS[it.slot].some(n => it.name === `${a} ${n}${sp ? ` ${sp.suffix}` : ''}`));
}

export const itemEntry = (item: Item): BagEntry => ({ kind: 'item', id: item.id, item });
export const mapEntry = (map: MapKind): BagEntry => ({ kind: 'map', id: uid(), map });
export const featherEntry = (): BagEntry => ({ kind: 'feather', id: uid() });

export function entryValue(e: BagEntry): number {
  if (e.kind === 'item') return e.item.value;
  if (e.kind === 'map') return MAP_INFO[e.map].value;
  return FEATHER.value;
}
export function entryName(e: BagEntry): string {
  if (e.kind === 'item') return e.item.identified ? e.item.name : `??? Unidentified ${cap(e.item.rarity)}`;
  if (e.kind === 'map') return `Map: ${MAP_INFO[e.map].name}`;
  return FEATHER.name;
}
export function entryColor(e: BagEntry): string {
  if (e.kind === 'item') return RARITY_COLOR[e.item.rarity];
  if (e.kind === 'map') return MAP_INFO[e.map].color;
  return FEATHER.color;
}
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const bagFree = () => S.g.bagSize - S.g.bag.length;
export function isLocked(id: string): boolean { const e = S.g.bag.find(x => x.id === id); return !!(e && e.kind === 'item' && e.item.locked); }
/** Toggle the lock on a bag item or equipped item. */
export function toggleLock(id: string) {
  let it = S.g.bag.find(x => x.id === id && x.kind === 'item') as { item: { locked?: boolean; name: string } } | undefined;
  const item = it?.item ?? S.g.heroes.flatMap(h => Object.values(h.gear)).find(g => g && g.id === id);
  if (!item) return;
  item.locked = !item.locked;
  toast(item.locked ? `Locked: ${item.name}` : `Unlocked: ${item.name}`, '#f2c46b'); sfx.click();
}
export function removeEntry(id: string): BagEntry | undefined {
  const i = S.g.bag.findIndex(e => e.id === id);
  if (i < 0) return undefined;
  const [e] = S.g.bag.splice(i, 1);
  const n = S.g.night;
  if (n && n.selected === id) n.selected = null;
  return e;
}

/** One kill (#52, 1.3): an item with DROP_CHANCE, an elite always (a rare), a boss BOSS_DROPS; it falls where the
 *  enemy died. */
export function dropFromKill(e: Enemy) {
  const n = N();
  const x = ENEMY_SLOTS[e.slot]?.x ?? 200;
  if (e.boss) rollBattleDrops(n.floor, { count: T.BOSS_DROPS, minRare: true, at: [x - 20, x, x + 20] });
  else if (e.elite) rollBattleDrops(n.floor, { count: 1, minRare: true, at: [x] });
  else if (n.heist > 0) rollBattleDrops(n.floor, { count: 1, at: [x], up: legendOn('gilded') ? 1 : 0 });   // Garrote's Heist: every kill drops (Gilded Hand: a rarity up)
  else if (chance(T.DROP_CHANCE * blessPow('supply', T.BLESS_SUPPLY_DROPS) * condDrops())) rollBattleDrops(n.floor, { count: 1, at: [x] });
}
/** The floor's condition on drops (#52, 1.5): Silent Halls fewer, Flooded more. */
function condDrops(): number { const c = N().cond; return c === 'silent' ? 1 - T.COND_SILENT_DROPS : c === 'flooded' ? 1 + T.COND_FLOODED_DROPS : 1; }
/** Once a fight is won: a map or a feather now and then. */
export function rollBattleExtras() {
  const n = N(), out: BagEntry[] = [];
  if (chance(T.MAP_DROP_CHANCE)) out.push(mapEntry(pick(Object.keys(MAP_INFO) as MapKind[])));
  if (chance(T.FEATHER_DROP_CHANCE)) out.push(featherEntry());
  out.forEach(en => n.floorLoot.push({ entry: en, x: ENEMY_SLOTS[0].x + (Math.random() - 0.5) * 20, t: 0 }));
}

/** Drops go onto the floor where the enemies stood (grid px); the looter picks them up during the walk. */
export function rollBattleDrops(floor: number, opts: { boss?: boolean; elite?: boolean; count?: number; minRare?: boolean; at?: number[]; up?: number }) {
  const n = N();
  const count = opts.count ?? (opts.boss ? T.BOSS_DROPS : 1);
  const out: BagEntry[] = [], whys: string[] = [];
  for (let i = 0; i < count; i++) {
    const guaranteed = (opts.boss || opts.elite || opts.minRare) && i === 0;
    out.push(itemEntry(genItem(floor, guaranteed ? 2 : 0, opts.up ?? 0))); whys.push(rareWhy);
  }
  // each drop lands where an enemy fell (spread a little when several share a body)
  const at = opts.at?.length ? opts.at : [186, 226, 266];
  out.forEach((e, i) => noteDrop(e.kind === 'item' ? e.item.rarity : null, whys[i]));
  out.forEach((e, i) => n.floorLoot.push({ entry: e, x: at[i % at.length] + (Math.floor(i / at.length) * 11) + (Math.random() - 0.5) * 7, t: 0 }));
}

/** The courier's parcel (#23): one rare-or-better item at your current depth, straight to the bag queue. */
export function deliverPackage(): BagEntry {
  const n = N();
  const e = itemEntry(genItem(Math.max(n.floor, n.checkpoint), 2));
  n.dropQueue.push(e);
  return e;
}

/** Everything still lying on the floor goes straight to the bag queue (leaving the floor). */
export function sweepFloorLoot() { const n = N(); n.floorLoot.forEach(l => markRun(l.entry)); n.dropQueue.push(...n.floorLoot.map(l => l.entry)); n.floorLoot = []; }
/** Picked up during a run: unbanked until the town portal (#52, 1.4). */
function markRun(e: BagEntry) { if (!N().run) return; e.run = true; if (e.kind === 'item') e.item.run = true; }

/** Walking moves floor loot toward the party; the front hero collects what he steps on. */
export function moveFloorLoot(dx: number, frontX: number) {
  const n = N();
  for (const l of n.floorLoot) { l.x -= dx; l.t += 1 / 60; }   // grid px (core/arena.ts)
  const got = n.floorLoot.filter(l => l.x <= frontX);
  if (!got.length) return;
  n.floorLoot = n.floorLoot.filter(l => l.x > frontX);
  const waiting = n.lootFly.filter(f => f.t < f.delay).length;
  got.forEach((l, i) => {
    markRun(l.entry); n.dropQueue.push(l.entry); sfx.click();
    // its name flies up from where it lay (#49): a batch is staggered and spread sideways; legendaries stay longer
    const leg = l.entry.kind === 'item' && l.entry.item.rarity === 'legendary';
    const k = waiting + i;
    n.lootFly.push({ x: l.x, text: entryName(l.entry), color: entryColor(l.entry), t: 0, max: leg ? T.LOOT_FLY_LEGENDARY_SEC : T.LOOT_FLY_SEC,
      delay: k * T.LOOT_FLY_STAGGER_SEC, dx: k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.min(3, Math.ceil(k / 2)) * 7 });
  });
}

export function updateDrops(dt: number) {
  const n = N();
  for (const f of n.lootFly) f.t += dt;
  n.lootFly = n.lootFly.filter(f => f.t < f.delay + f.max);
  for (const f of n.fresh) f.t -= dt;
  n.fresh = n.fresh.filter(f => f.t > 0);
  if (n.dropPopup) {
    n.dropPopup.t -= dt;
    if (n.dropPopup.t <= 0) { toast(`Lost: ${entryName(n.dropPopup.entry)}`, '#ff8a80'); n.dropPopup = null; }
    return;
  }
  const e = n.dropQueue.shift();
  if (!e) return;
  if (n.monitorOff > 0) { toast(`Monitor off. Missed: ${entryName(e)}`, '#ff8a80'); return; }
  if (S.g.autoSalvage && e.kind === 'item' && RARITIES.indexOf(e.item.rarity) < 2) {
    const y = T.SALVAGE_YIELD[RARITIES.indexOf(e.item.rarity)];
    S.g.mats += y; toast(`Auto-salvaged ${entryName(e)}: +${y} Souls`, '#9a8a6a'); sfx.key();
    return;
  }
  announce(e);
  if (bagFree() > 0) { S.g.bag.push(e); n.fresh.push({ id: e.id, t: T.BAG_NEW_SEC }); if (e.kind === 'item') coach('loot'); }
  else { n.dropPopup = { entry: e, t: T.DROP_WAIT_SEC }; sfx.bagFull(); toast('Bag full! The drop waits on the floor.', '#ff8a80'); }
}

/** Echo: a legendary makes him yell. Noise (less into the headset mic); she asks if she is awake. */
function legendaryYell() {
  const n = N();
  const v = n.headset ? T.ECHO_YELL_HEADSET : T.ECHO_YELL_NOISE;
  n.noise = Math.min(100, n.noise + v);
  toast(`You: "LET'S GOOOO!" Noise +${v}.`, '#ff9a4d');
  if (!n.apt.asleep && !n.headset) toast('[Her] "what was that??"', '#ff9ab8');
}

function announce(e: BagEntry) {
  const n = N();
  const color = entryColor(e);
  if (e.kind === 'item') {
    const ri = RARITIES.indexOf(e.item.rarity);
    sfx.loot(ri);
    if (!e.item.identified) n.unidentifiedFound++;
    if (e.item.rarity === 'legendary') legendaryYell();
    if (ri >= T.HIS_GRIN_RARITY) n.grin = T.HIS_GRIN_SEC;   // he grins at the webcam (#37)
    if (e.item.witched) toast(`The Witching Hour shifts it up: ${e.item.rarity}.`, '#c77dff');
  } else sfx.loot(1);
  toast(entryName(e), color);
}

export function swapDrop(bagId: string) {
  const n = N();
  if (!n.dropPopup) return;
  const i = S.g.bag.findIndex(e => e.id === bagId);
  if (i < 0) return;
  const old = S.g.bag[i];
  if (old.kind === 'item' && old.item.locked) { toast('That item is locked.', '#f2c46b'); sfx.bad(); return; }
  S.g.bag[i] = n.dropPopup.entry;
  n.fresh.push({ id: n.dropPopup.entry.id, t: 1.1 });
  toast(`Dropped ${entryName(old)}`, '#a999bd');
  n.dropPopup = null;
  if (n.selected === old.id) n.selected = null;
}
export function skipDrop() {
  const n = N();
  if (!n.dropPopup) return;
  toast(`Left behind: ${entryName(n.dropPopup.entry)}`, '#a999bd');
  n.dropPopup = null;
}
