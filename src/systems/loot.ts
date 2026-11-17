import { T } from '../config/tuning';
import { S, N, uid, RARITIES, SLOTS, type BagEntry, type Item, type Rarity, type Stat, type MapKind } from '../core/state';
import { pick, weighted, chance, rand } from '../core/rng';
import { ADJECTIVES, NOUNS, SUFFIXES, SLOT_STATS, STAT_BASE, RARITY_MULT, POSITIVE_AFFIXES, HAS_DOWNSIDE, MAP_INFO, FEATHER, RARITY_COLOR } from '../data/items';
import { toast } from '../core/fx';
import { sfx } from '../ui/audio';

function round1(v: number) { return Math.round(v * 10) / 10; }

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
    a + (it && it.identified ? it.affixes.filter(x => x.stat === 'luck').reduce((q, x) => q + x.amount, 0) : 0), 0), 0);
  luck += partyLuck * 0.01;
  for (let i = 1; i < w.length; i++) w[i] *= luck;
  for (let i = 0; i < minIdx; i++) w[i] = 0;
  let idx = weighted(w);
  if (S.g.pity >= T.PITY_EPIC && idx < 3) idx = 3;
  if (idx >= 3) S.g.pity = 0; else S.g.pity++;
  return RARITIES[idx];
}

export function genItem(ilvl: number, minRarity = 0): Item {
  let rarity = rollRarity(ilvl, minRarity);
  if (S.g.night?.floorMap === 'cursed' && S.g.night.location === 'dungeon') rarity = RARITIES[Math.min(RARITIES.length - 1, RARITIES.indexOf(rarity) + 1)];
  const slot = pick(SLOTS);
  const mult = RARITY_MULT[rarity];
  const pool = [...SLOT_STATS[slot]];
  const affixes: { stat: Stat; amount: number }[] = [];
  const positives = POSITIVE_AFFIXES[rarity];
  for (let i = 0; i < positives; i++) {
    const stat = i < pool.length ? pool[i] : pick(pool);
    const [a, b] = STAT_BASE[stat];
    const amt = round1((a + b * ilvl) * mult * rand(0.8, 1.15) * (i === 0 ? 1 : 0.6));
    const existing = affixes.find(x => x.stat === stat);
    if (existing) existing.amount = round1(existing.amount + amt); else affixes.push({ stat, amount: amt });
  }
  if (HAS_DOWNSIDE[rarity]) {
    const others: Stat[] = (['atk', 'hp', 'armor', 'speed', 'crit'] as Stat[]).filter(s => !affixes.some(a => a.stat === s));
    const stat = pick(others);
    const [a, b] = STAT_BASE[stat];
    affixes.push({ stat, amount: -round1((a + b * ilvl) * 0.6 * rand(0.8, 1.2)) });
  }
  const ri = RARITIES.indexOf(rarity);
  let name = `${pick(ADJECTIVES[rarity])} ${pick(NOUNS[slot])}`;
  if (ri >= 3) name += ` ${pick(SUFFIXES)}`;
  const value = Math.round(6 * ilvl * mult * mult + positives * 3);
  return { id: uid(), name, slot, rarity, ilvl, affixes, value, identified: ri < 3 };
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

/** Drops from a finished battle go to the queue; the queue feeds the bag or the swap popup. */
export function rollBattleDrops(floor: number, opts: { boss?: boolean; elite?: boolean; count?: number; minRare?: boolean; at?: number[] }) {
  const n = N();
  const count = opts.count ?? (opts.boss ? T.BOSS_DROPS : (chance(T.BATTLE_DROP_CHANCE) ? 1 : 0) + (opts.elite ? 1 : 0));
  const out: BagEntry[] = [];
  for (let i = 0; i < count; i++) {
    const guaranteed = (opts.boss || opts.elite || opts.minRare) && i === 0;
    out.push(itemEntry(genItem(floor, guaranteed ? 2 : 0)));
  }
  if (!opts.count) {
    if (chance(T.MAP_DROP_CHANCE)) out.push(mapEntry(pick(Object.keys(MAP_INFO) as MapKind[])));
    if (chance(T.FEATHER_DROP_CHANCE)) out.push(featherEntry());
  }
  // drops fall where the enemies stood; the front hero picks them up while walking
  // each drop lands where an enemy fell (spread a little when several share a body)
  const at = opts.at?.length ? opts.at : [340, 420, 500];
  out.forEach((e, i) => n.floorLoot.push({ entry: e, x: at[i % at.length] + (Math.floor(i / at.length) * 22) + (Math.random() - 0.5) * 14, t: 0 }));
}

/** Everything still lying on the floor goes straight to the bag queue (leaving the floor). */
export function sweepFloorLoot() { const n = N(); n.dropQueue.push(...n.floorLoot.map(l => l.entry)); n.floorLoot = []; }

/** Walking moves floor loot toward the party; the front hero collects what he steps on. */
export function moveFloorLoot(dx: number, frontX: number) {
  const n = N();
  for (const l of n.floorLoot) { l.x -= dx; l.t += 1 / 60; }
  const got = n.floorLoot.filter(l => l.x <= frontX);
  if (!got.length) return;
  n.floorLoot = n.floorLoot.filter(l => l.x > frontX);
  for (const l of got) { n.dropQueue.push(l.entry); sfx.click(); }
}

export function updateDrops(dt: number) {
  const n = N();
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
    S.g.mats += y; toast(`Auto-salvaged ${entryName(e)}: +${y} scraps`, '#9a8a6a'); sfx.key();
    return;
  }
  announce(e);
  if (bagFree() > 0) { S.g.bag.push(e); n.fresh.push({ id: e.id, t: 1.1 }); }
  else n.dropPopup = { entry: e, t: T.DROP_WAIT_SEC };
}

function announce(e: BagEntry) {
  const n = N();
  const color = entryColor(e);
  if (e.kind === 'item') {
    const ri = RARITIES.indexOf(e.item.rarity);
    sfx.loot(ri);
    if (!e.item.identified) n.unidentifiedFound++;
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
