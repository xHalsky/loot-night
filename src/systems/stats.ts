import { T } from '../config/tuning';
import { S, type Hero, type Stat, type Item } from '../core/state';
import { HERO_BASE } from '../data/heroes';
import { ATK_PCT, HP_PCT } from '../data/city';

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
    for (const it of Object.values(gear)) v += itemStat(it, st);
    out[st] = v;
  });
  out.atk *= 1 + ATK_PCT[S.g.furniture.training ?? 0];
  out.hp *= 1 + HP_PCT[S.g.furniture.inn ?? 0];
  out.hp = Math.round(out.hp); out.atk = Math.round(out.atk * 10) / 10;
  out.speed = Math.max(1, out.speed);
  return out;
}

export const maxHp = (h: Hero) => heroStats(h).hp;
export const xpNeeded = (h: Hero) => Math.round(T.XP_PER_LEVEL * Math.pow(h.level, T.XP_LEVEL_EXP));
