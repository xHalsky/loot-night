import { blessCount } from './run';
import { T } from '../config/tuning';
import { S, type Hero, type Stat, type Item } from '../core/state';
import { HERO_BASE } from '../data/heroes';
import { RARITY_MULT } from '../data/items';
import { SLOTS } from '../core/state';
import { ATK_PCT, HP_PCT } from '../data/city';
import { crossBonus } from './affixes';
import { setPieces } from './gear';

export function itemStat(item: Item | undefined, stat: Stat): number {
  if (!item || !item.identified) return 0;
  return item.affixes.filter(a => a.stat === stat).reduce((s, a) => s + a.amount, 0);
}

export function heroStats(h: Hero, gearOverride?: Partial<Record<string, Item | undefined>>): Record<Stat, number> {
  const base = HERO_BASE[h.id];
  const lv = 1 + T.HERO_LEVEL_SCALE * (h.level - 1);
  const gear = { ...h.gear, ...(gearOverride ?? {}) } as Record<string, Item | undefined>;
  const out = {} as Record<Stat, number>;
  (Object.keys(base) as Stat[]).forEach(st => {
    let v = base[st] * (st === 'hp' || st === 'atk' ? lv : 1);
    for (const it of Object.values(gear)) v += itemStat(it, st) + crossBonus(it, st);   // cross-system affixes count while their condition holds
    out[st] = v;
  });
  // set bonuses, two pieces worn by the set's own hero (#52, 1.8)
  if (setPieces(h, 'ironwake', gear) >= 2) out.armor *= 1 + T.SET_IRONWAKE_ARMOR;
  if (setPieces(h, 'nightglass', gear) >= 2) out.crit += T.SET_NIGHTGLASS_CRIT;
  out.atk *= 1 + ATK_PCT[S.g.furniture.training ?? 0];
  out.hp *= 1 + HP_PCT[S.g.furniture.inn ?? 0];
  out.hp = Math.round(out.hp); out.atk = Math.round(out.atk * 10) / 10;
  out.speed = Math.max(1, out.speed);
  return out;
}

/** Max HP; the Rations run blessing takes BLESS_SUPPLY_HP of it per stack (#52, 1.5b). */
export const maxHp = (h: Hero) => Math.round(heroStats(h).hp * (1 - T.BLESS_SUPPLY_HP) ** blessCount('supply'));

// ---------- Power (Destiny-style Light): one number for how strong a hero's gear is ----------
/** An item's power: item level x rarity, the same scale that sets its stats. Unidentified items give no
 *  stats yet, so they count as 0 until the Appraiser reveals them. */
export function itemPower(it: Item | undefined): number {
  if (!it || !it.identified) return 0;
  return Math.round(T.POWER_PER_ILVL * it.ilvl * RARITY_MULT[it.rarity]);
}
/** A hero's Power: the average power of the six slots (an empty slot counts as 0). */
export function heroPower(h: Hero, gearOverride?: Partial<Record<string, Item | undefined>>): number {
  const gear = { ...h.gear, ...(gearOverride ?? {}) } as Record<string, Item | undefined>;
  return Math.round(SLOTS.reduce((s, sl) => s + itemPower(gear[sl]), 0) / SLOTS.length);
}
/** Stats without any gear (level, city buildings): the gear share is total minus this. */
export function heroBaseStats(h: Hero): Record<Stat, number> {
  return heroStats(h, Object.fromEntries(SLOTS.map(sl => [sl, undefined])));
}
export const xpNeeded = (h: Hero) => Math.round(T.XP_PER_LEVEL * Math.pow(h.level, T.XP_LEVEL_EXP));
