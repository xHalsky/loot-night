import { T } from '../config/tuning';
import type { HeroId } from '../core/state';

// Skill trees (#53; handoff 2.1 to 2.3 with the 2026-11-20 drop; grid doc §6c). Data only: adding a node needs no code
// beyond its effect. Every hero starts with his auto attack (root) and skill 1; skill 2 is an unlock, each skill has a
// rule pair (buy one, the other shuts) and an autocast, the ultimate needs TREE_ULT_NEEDS nodes, and stat nodes sit on
// the way to everything. Ids and the layout are the page's (src/render/page/tree.js, TN): the same for every hero.
export type NodeId = 'root' | 's1' | 'g1' | 'g2' | 's2' | 'p1' | 'r1a' | 'r1b' | 'q1' | 'a1' | 'p2' | 'r2a' | 'r2b' | 'q2' | 'a2' | 'm1' | 'm2' | 'm3' | 'ult';
export type NodeKind = 'root' | 'skill' | 'unlock' | 'stat' | 'rule' | 'auto' | 'ult';
export const NODES: Record<NodeId, { kind: NodeKind; req?: NodeId; pair?: NodeId; to?: string }> = {
  root: { kind: 'root' }, s1: { kind: 'skill' },
  g1: { kind: 'stat', req: 'root', to: 's2' }, g2: { kind: 'stat', req: 'g1', to: 's2' }, s2: { kind: 'unlock', req: 'g2' },
  p1: { kind: 'stat', req: 's1', to: 'r1' }, r1a: { kind: 'rule', req: 'p1', pair: 'r1b' }, r1b: { kind: 'rule', req: 'p1', pair: 'r1a' },
  q1: { kind: 'stat', req: 's1', to: 'a1' }, a1: { kind: 'auto', req: 'q1' },
  p2: { kind: 'stat', req: 's2', to: 'r2' }, r2a: { kind: 'rule', req: 'p2', pair: 'r2b' }, r2b: { kind: 'rule', req: 'p2', pair: 'r2a' },
  q2: { kind: 'stat', req: 's2', to: 'a2' }, a2: { kind: 'auto', req: 'q2' },
  m1: { kind: 'stat', req: 'root', to: 'ult' }, m2: { kind: 'stat', req: 'm1', to: 'ult' }, m3: { kind: 'stat', req: 'm2', to: 'ult' },
  ult: { kind: 'ult' },
};
export const BUYABLE: NodeId[] = (Object.keys(NODES) as NodeId[]).filter(id => id !== 'root' && id !== 's1');

/** What a stat node gives (shares, except crit and luck in points; aura replaces the hero's aura value). */
export interface StatFx { dmg?: number; skillDmg?: number; hp?: number; armor?: number; crit?: number; critDmg?: number; atkSpeed?: number;
  dodge?: number; luck?: number; gold?: number; cd?: number; healOut?: number; healIn?: number; ultRate?: number; partyHp?: number;
  aura?: number; bashDmg?: number; fireDmg?: number; elemDur?: number; wardSoak?: number }
export type RuleId = 'holdTheLine' | 'thorns' | 'cleave' | 'concussion' | 'ambush' | 'shiv' | 'choking' | 'vanish'
  | 'wildfire' | 'inferno' | 'lingering' | 'shatterpoint' | 'sanctuary' | 'greaterMend' | 'aegis' | 'retribution';
export interface TreeDef {
  rules: Record<'r1a' | 'r1b' | 'r2a' | 'r2b', { id: RuleId; name: string; fx: string }>;
  stats: Record<'g1' | 'g2' | 'p1' | 'q1' | 'p2' | 'q2' | 'm1' | 'm2' | 'm3', { name: string; fx: string; give: StatFx }>;
}
const pct = (v: number) => `${Math.round(v * 100)}%`;
export const TREES: Record<HeroId, TreeDef> = {
  knight: {
    rules: {
      r1a: { id: 'holdTheLine', name: 'Hold the Line', fx: `Taunt also gives the Knight +${pct(T.RULE_HOLD_ARMOR)} armor.` },
      r1b: { id: 'thorns', name: 'Thorns', fx: `Taunted enemies take ${pct(T.RULE_THORNS)} of their hits back.` },
      r2a: { id: 'cleave', name: 'Cleaving Bash', fx: 'Bash hits the two front enemies.' },
      r2b: { id: 'concussion', name: 'Concussion', fx: 'Bash stuns twice as long.' },
    },
    stats: {
      g1: { name: 'Veteran', fx: '+8% damage.', give: { dmg: 0.08 } }, g2: { name: 'Brute', fx: '+10% damage.', give: { dmg: 0.1 } },
      p1: { name: 'Bulwark', fx: '+10% armor.', give: { armor: 0.1 } }, q1: { name: 'Iron Skin', fx: '+10% HP.', give: { hp: 0.1 } },
      p2: { name: 'Crushing', fx: 'Bash deals +20% damage.', give: { bashDmg: 0.2 } }, q2: { name: 'Hardened', fx: 'Healing on him +15%.', give: { healIn: 0.15 } },
      m1: { name: 'Stalwart', fx: '+15% HP.', give: { hp: 0.15 } }, m2: { name: 'Tower Shield', fx: '+15% armor.', give: { armor: 0.15 } },
      m3: { name: 'Shield Brother', fx: 'His aura: the hero behind him takes 35% less damage (from 25%).', give: { aura: 0.35 } },
    },
  },
  rogue: {
    rules: {
      r1a: { id: 'ambush', name: 'Ambush', fx: 'Backstab always crits on Staggered enemies.' },
      r1b: { id: 'shiv', name: 'Shiv', fx: `Backstab's cooldown -${pct(T.RULE_SHIV)}.` },
      r2a: { id: 'choking', name: 'Choking Smoke', fx: `Smoke Bomb also hurts every enemy for ${pct(T.RULE_CHOKE_DPS)} of his attack a second.` },
      r2b: { id: 'vanish', name: 'Vanish', fx: "Garrote can't be targeted during Smoke Bomb." },
    },
    stats: {
      g1: { name: 'Nimble', fx: '+8% attack speed.', give: { atkSpeed: 0.08 } }, g2: { name: 'Shadow', fx: '+10% dodge.', give: { dodge: 0.1 } },
      p1: { name: 'Keen Eye', fx: '+10% crit.', give: { crit: 10 } }, q1: { name: 'Deadly', fx: 'Crits deal +25% damage.', give: { critDmg: 0.25 } },
      p2: { name: 'Quick Blades', fx: '+8% attack speed.', give: { atkSpeed: 0.08 } }, q2: { name: 'Lucky', fx: '+5 luck: better drops (he does the looting).', give: { luck: 5 } },
      m1: { name: 'Cutpurse', fx: '+15% gold.', give: { gold: 0.15 } }, m2: { name: 'Ruthless', fx: '+8% damage.', give: { dmg: 0.08 } },
      m3: { name: 'Sly', fx: 'His aura: the hero in front gets +15% crit (from 10%).', give: { aura: 15 } },
    },
  },
  mage: {
    rules: {
      r1a: { id: 'wildfire', name: 'Wildfire', fx: `Fire leaves the ground burning: ${pct(T.RULE_WILDFIRE)} of its damage again over ${T.RULE_WILDFIRE_SEC} s.` },
      r1b: { id: 'inferno', name: 'Inferno', fx: `Fire deals +${pct(T.RULE_INFERNO_DMG)} damage, cooldown +${T.RULE_INFERNO_CD} s.` },
      r2a: { id: 'lingering', name: 'Lingering Chill', fx: 'Chill lasts twice as long.' },
      r2b: { id: 'shatterpoint', name: 'Shatterpoint', fx: `Bash shatters Chilled enemies for x${T.RULE_SHATTER} instead of x${T.MARK_CHILL_BASH}.` },
    },
    stats: {
      g1: { name: 'Focus', fx: '+8% damage.', give: { dmg: 0.08 } }, g2: { name: 'Arcane Mind', fx: 'Cooldowns -8%.', give: { cd: 0.08 } },
      p1: { name: 'Pyromancy', fx: 'Fire deals +15% damage.', give: { fireDmg: 0.15 } }, q1: { name: 'Spellpower', fx: 'Skills deal +12% damage.', give: { skillDmg: 0.12 } },
      p2: { name: 'Elementalist', fx: 'Burning and Chill last 25% longer.', give: { elemDur: 0.25 } }, q2: { name: 'Glass', fx: '+10% crit.', give: { crit: 10 } },
      m1: { name: 'Ley Lines', fx: 'His ultimate charges 20% faster.', give: { ultRate: 0.2 } }, m2: { name: 'Warded', fx: '+10% HP.', give: { hp: 0.1 } },
      m3: { name: 'Mentor', fx: 'His aura: the hero in front gets 15% shorter cooldowns (from 10%).', give: { aura: 0.15 } },
    },
  },
  healer: {
    rules: {
      r1a: { id: 'sanctuary', name: 'Sanctuary', fx: `Mend also gives the party +${pct(T.RULE_SANCTUARY_ARMOR)} armor for ${T.RULE_SANCTUARY_SEC} s.` },
      r1b: { id: 'greaterMend', name: 'Greater Mend', fx: `Mend heals ${pct(T.RULE_GREATER_MEND)} more.` },
      r2a: { id: 'aegis', name: 'Aegis', fx: `Ward lasts ${T.RULE_AEGIS_SEC} s longer.` },
      r2b: { id: 'retribution', name: 'Retribution', fx: `Any enemy hitting a warded hero takes ${pct(T.RULE_RETRIBUTION)} back.` },
    },
    stats: {
      g1: { name: 'Devotion', fx: '+10% HP.', give: { hp: 0.1 } }, g2: { name: 'Faith', fx: 'Cooldowns -8%.', give: { cd: 0.08 } },
      p1: { name: 'Grace', fx: 'Healing +10%.', give: { healOut: 0.1 } }, q1: { name: 'Mercy', fx: 'Healing +15%.', give: { healOut: 0.15 } },
      p2: { name: 'Bastion', fx: 'Ward soaks 20% more.', give: { wardSoak: 0.2 } }, q2: { name: 'Zeal', fx: '+8% damage.', give: { dmg: 0.08 } },
      m1: { name: 'Shepherd', fx: "The whole party's max HP +5%.", give: { partyHp: 0.05 } }, m2: { name: 'Vigil', fx: '+10% armor.', give: { armor: 0.1 } },
      m3: { name: 'Halo', fx: 'His aura: his neighbours regenerate 1.5% HP a second (from 1%).', give: { aura: 0.015 } },
    },
  },
};
