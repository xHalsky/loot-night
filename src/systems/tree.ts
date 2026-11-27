// Skill trees (#53; docs/design/heroes.md, grid doc §6c): buying nodes with Souls, respec, what a hero owns, and the
// autocast switches. Rules only; the effects are read where they act (battle, stats, ranks, run).
import { T } from '../config/tuning';
import { S, type Hero, type HeroId } from '../core/state';
import { NODES, TREES, type NodeId, type RuleId, type StatFx } from '../data/trees';
import { toastAs } from '../core/fx';
import { sfx } from '../ui/audio';
import { boysSay } from './boys';
const toast = toastAs('GAME');

export type NodeState = 'owned' | 'buy' | 'poor' | 'locked' | 'shut';
const bought = (id: HeroId): NodeId[] => ((S.g.trees ??= {})[id] ??= []) as NodeId[];
/** Owns the node (the root and skill 1 from the start). */
export function owns(hero: HeroId, node: NodeId): boolean { return node === 'root' || node === 's1' || bought(hero).includes(node); }
export const boughtCount = (hero: HeroId) => bought(hero).length;
export function nodeCost(hero: HeroId, node: NodeId): number {
  const k = NODES[node].kind;
  return Math.round((T.TREE_COST[k === 'skill' ? 'unlock' : k] ?? 0) * (1 + T.TREE_COST_STEP * bought(hero).length));
}
export function nodeState(hero: HeroId, node: NodeId): NodeState {
  const n = NODES[node];
  if (owns(hero, node)) return 'owned';
  if (n.pair && owns(hero, n.pair)) return 'shut';
  if (n.kind === 'ult' ? bought(hero).length < T.TREE_ULT_NEEDS : n.req && !owns(hero, n.req)) return 'locked';
  return nodeCost(hero, node) <= S.g.mats ? 'buy' : 'poor';
}
/** Buys a node with Souls (in town only). An autocast starts switched on. */
export function buyNode(hero: HeroId, node: NodeId): boolean {
  const st = nodeState(hero, node);
  if (st !== 'buy' || S.g.night?.location === 'dungeon') { sfx.bad(); return false; }
  S.g.mats -= nodeCost(hero, node);
  bought(hero).push(node);
  if (NODES[node].kind === 'auto') (S.g.autocast ??= {})[`${hero}:${node === 'a1' ? 1 : 2}`] = true;
  sfx.level(); boysSay('build');   // the boys' chat (#109)
  return true;
}
/** Free while testing: every Soul spent in that tree comes back. */
export function respec(hero: HeroId) {
  const list = bought(hero);
  if (!list.length) return;
  let refund = 0;
  for (let k = 0; k < list.length; k++) { const kind = NODES[list[k]].kind; refund += Math.round((T.TREE_COST[kind] ?? 0) * (1 + T.TREE_COST_STEP * k)); }
  S.g.mats += refund; S.g.trees![hero] = [];
  for (const s of [1, 2]) delete S.g.autocast?.[`${hero}:${s}`];
  toast(`Respec: +${refund} Souls back.`, '#c9b08a'); sfx.click();
}

/** A rule this hero owns. */
export function rule(hero: HeroId, id: RuleId): boolean {
  const R = TREES[hero].rules;
  return (Object.keys(R) as (keyof typeof R)[]).some(k => R[k].id === id && owns(hero, k));
}
/** The sum of one stat effect over the nodes a hero owns. */
export function fx(hero: HeroId, key: keyof StatFx): number {
  const St = TREES[hero].stats;
  let v = 0;
  for (const k of Object.keys(St) as (keyof typeof St)[]) if (owns(hero, k)) v += St[k].give[key] ?? 0;
  return v;
}
export const heroFx = (h: Hero | undefined, key: keyof StatFx) => (h ? fx(h.id, key) : 0);
/** The same effect summed over the whole party (Shepherd, Cutpurse). */
export const partyFx = (key: keyof StatFx) => S.g.heroes.reduce((a, h) => a + fx(h.id, key), 0);

/** Skill slot 2 and the ultimate come from the tree (#53); slot 1 from the start. */
export function skillOwned(hero: HeroId, slot: number): boolean { return slot <= 1 || (slot === 2 ? owns(hero, 's2') : owns(hero, 'ult')); }
/** Autocast bought for this slot, and its switch (right-click the well). */
export const autocastBought = (hero: HeroId, slot: number) => slot >= 1 && slot <= 2 && owns(hero, slot === 1 ? 'a1' : 'a2');
export const autocastOn = (hero: HeroId, slot: number) => autocastBought(hero, slot) && (S.g.autocast?.[`${hero}:${slot}`] ?? true);
export function toggleAutocast(hero: HeroId, slot: number) {
  if (!autocastBought(hero, slot)) return;
  const k = `${hero}:${slot}`; (S.g.autocast ??= {})[k] = !autocastOn(hero, slot);
  sfx.click();
}
