import { T } from '../config/tuning';
import type { HeroId, Slot } from '../core/state';

// Loot rules (#52, 1.8; docs/design/loot.md). Every legendary is one of these: it changes a rule of one hero's kit,
// works only on that hero, and drops only while he is in the party. Names are the item's whole name.
// Stormcoil and Vigil Censer were written for Storm and Revive, which were dropped (decisions 2026-11-20); they now
// work on what covers that ground (the mage's Bolt, the priest's Miracle).
export type LegendId = 'frostbinder' | 'tithe' | 'lantern' | 'ashchoir' | 'widow' | 'stormcoil' | 'gilded' | 'vigil';
export interface LegendDef { id: LegendId; name: string; slot: Slot; hero: HeroId; rule: string }
export const LEGENDS: LegendDef[] = [
  { id: 'frostbinder', name: 'Frostbinder', slot: 'weapon', hero: 'mage', rule: 'Frost chills two enemies.' },
  { id: 'tithe', name: 'The Tithe', slot: 'armor', hero: 'knight', rule: `Taunted enemies drop ${T.LEGEND_TITHE_GOLD} gold a floor deep each time they hit the Knight.` },
  { id: 'lantern', name: 'Last Lantern', slot: 'trinket', hero: 'knight', rule: "Bash on a Staggered enemy resets Taunt's cooldown." },
  { id: 'ashchoir', name: 'Ash Choir', slot: 'weapon', hero: 'healer', rule: 'Mend also clears the party\'s debuffs.' },
  { id: 'widow', name: "Widow's Kiss", slot: 'weapon', hero: 'rogue', rule: 'Backstab always crits on Chilled enemies.' },
  { id: 'stormcoil', name: 'Stormcoil', slot: 'trinket', hero: 'mage', rule: 'A Bolt that kills jumps to another enemy.' },
  { id: 'gilded', name: 'Gilded Hand', slot: 'trinket', hero: 'rogue', rule: 'Heist drops roll one rarity higher.' },
  { id: 'vigil', name: 'Vigil Censer', slot: 'trinket', hero: 'healer', rule: `Miracle also raises Ward for ${T.LEGEND_VIGIL_WARD_SEC} s.` },
];
export const LEGEND_BY_ID = Object.fromEntries(LEGENDS.map(l => [l.id, l])) as Record<LegendId, LegendDef>;

// Sets: one per hero, three pieces (weapon, armor, trinket), dropping as epics with the set name. Two pieces worn by
// the set's hero give a stat; three give a rule.
export type SetId = 'ironwake' | 'embervow' | 'dawnward' | 'nightglass';
export type SetSlot = 'weapon' | 'armor' | 'trinket';
export interface SetDef { id: SetId; name: string; hero: HeroId; nouns: Record<SetSlot, string>; two: string; three: string }
const pct = (v: number) => `${Math.round(v * 100)}%`;
export const SETS: SetDef[] = [
  { id: 'ironwake', name: 'Ironwake', hero: 'knight', nouns: { weapon: 'Sword', armor: 'Plate', trinket: 'Sigil' }, two: `+${pct(T.SET_IRONWAKE_ARMOR)} armor`, three: `Taunt also heals the Knight ${pct(T.SET_IRONWAKE_HEAL)} of max HP` },
  { id: 'embervow', name: 'Embervow', hero: 'mage', nouns: { weapon: 'Staff', armor: 'Robe', trinket: 'Orb' }, two: `+${pct(T.SET_EMBERVOW_SKILL)} skill damage`, three: `Fire's cooldown resets when it kills ${T.SET_EMBERVOW_KILLS} or more` },
  { id: 'dawnward', name: 'Dawnward', hero: 'healer', nouns: { weapon: 'Mace', armor: 'Vestments', trinket: 'Censer' }, two: `+${pct(T.SET_DAWNWARD_HEAL)} healing`, three: `Ward also heals ${pct(T.SET_DAWNWARD_REGEN)} of max HP a second` },
  { id: 'nightglass', name: 'Nightglass', hero: 'rogue', nouns: { weapon: 'Dagger', armor: 'Leathers', trinket: 'Charm' }, two: `+${T.SET_NIGHTGLASS_CRIT}% crit`, three: "Smoke Bomb makes every hero's next hit a crit" },
];
export const SET_BY_ID = Object.fromEntries(SETS.map(s => [s.id, s])) as Record<SetId, SetDef>;
export const SET_SLOTS: SetSlot[] = ['weapon', 'armor', 'trinket'];
