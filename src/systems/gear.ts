// Legendaries and sets at work (#52, 1.8; docs/design/loot.md): who wears what. Rules only.
import { S, type Hero, type HeroId, type Item } from '../core/state';
import { LEGEND_BY_ID, SET_BY_ID, type LegendId, type SetId } from '../data/legendaries';

/** Class gear (#113): a weapon, helm or armor goes on its own class only; boots, rings and trinkets on anyone. */
export const canWear = (h: { id: HeroId }, it: Item): boolean => !it.cls || it.cls === h.id;

const worn = (h: Hero, gear: Partial<Record<string, Item | undefined>> = h.gear) =>
  Object.values(gear).filter((it): it is Item => !!it && it.identified);
/** True when the legendary's own hero wears it. */
export function legendOn(id: LegendId): boolean {
  const L = LEGEND_BY_ID[id], h = S.g.heroes.find(x => x.id === L.hero);
  return !!h && worn(h).some(it => it.legend === id);
}
/** Pieces of a set its own hero wears (another hero wearing them gets the stats, not the set). */
export function setPieces(h: Hero, id: SetId, gear?: Partial<Record<string, Item | undefined>>): number {
  if (SET_BY_ID[id].hero !== h.id) return 0;
  return worn(h, gear ?? h.gear).filter(it => it.set === id).length;
}
export function setOn(hero: HeroId, id: SetId, k: number): boolean {
  const h = S.g.heroes.find(x => x.id === hero);
  return !!h && setPieces(h, id) >= k;
}
