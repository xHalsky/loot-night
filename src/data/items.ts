import type { Rarity, Slot, Stat, MapKind, HeroId } from '../core/state';

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8e8a99', uncommon: '#6fcf7f', rare: '#6aa8ff', epic: '#b98cff', legendary: '#ff9a4d',
};
export const RARITY_MULT: Record<Rarity, number> = { common: 1, uncommon: 1.3, rare: 1.7, epic: 2.2, legendary: 3 };
export const HAS_DOWNSIDE: Record<Rarity, boolean> = { common: false, uncommon: false, rare: true, epic: true, legendary: true };

export const SLOT_STATS: Record<Slot, Stat[]> = {
  weapon: ['atk', 'crit', 'speed'],
  helm: ['hp', 'armor', 'luck'],
  armor: ['armor', 'hp', 'atk'],
  boots: ['speed', 'armor', 'hp'],
  ring: ['crit', 'atk', 'luck'],
  trinket: ['luck', 'hp', 'crit'],
};
// Base amount of a stat at item level L: a + b * L.
export const STAT_BASE: Record<Stat, [number, number]> = {
  atk: [2, 2], hp: [8, 9], armor: [1, 1.2], speed: [1, 0.25], crit: [2, 0.3], luck: [2, 0.5],   // atk, hp, armor keep pace with the enemies (#49)
};
export const STAT_LABEL: Record<Stat, string> = { atk: 'Attack', hp: 'Max HP', armor: 'Armor', speed: 'Speed', crit: 'Crit %', luck: 'Luck' };

// Item names (#44): plain fantasy words, two of them, readable at a glance. The adjective climbs with rarity;
// "of X" is added only for a special affix (data/affixes.ts), so a suffix always means a special effect.
// Boots, rings and trinkets fit anyone; weapons, helms and armor are class gear (#113), with their own words below.
export type SharedSlot = 'boots' | 'ring' | 'trinket';
export const NOUNS: Record<SharedSlot, string[]> = {
  boots: ['Boots', 'Greaves', 'Sandals', 'Treads'],
  ring: ['Ring', 'Band', 'Signet'],
  trinket: ['Amulet', 'Charm', 'Talisman', 'Relic'],
};
/** Class gear (#113): one class wears it. Each class's words fit one picture (its icon below), so a staff in the
 *  bag looks like a staff whatever its name. */
export type ClassSlot = 'weapon' | 'helm' | 'armor';
export const CLASS_SLOTS: ClassSlot[] = ['weapon', 'helm', 'armor'];
export const isClassSlot = (s: Slot): s is ClassSlot => (CLASS_SLOTS as Slot[]).includes(s);
export const CLASS_NOUNS: Record<HeroId, Record<ClassSlot, string[]>> = {
  knight: { weapon: ['Sword', 'Longsword', 'Broadsword'], helm: ['Helm', 'Greathelm', 'Warhelm'], armor: ['Breastplate', 'Plate', 'Chainmail'] },
  rogue: { weapon: ['Dagger', 'Dirk', 'Stiletto'], helm: ['Hood', 'Cowl'], armor: ['Leathers', 'Jerkin', 'Tunic'] },
  mage: { weapon: ['Staff', 'Rod', 'Stave'], helm: ['Circlet', 'Diadem'], armor: ['Robe', 'Garb'] },
  healer: { weapon: ['Mace', 'Scepter', 'Morningstar'], helm: ['Mitre', 'Crown'], armor: ['Vestments', 'Raiment'] },
};
/** The bag icon of class gear (the renderer's ITEM table): plate and steel for the knight, a dagger, hood and leathers
 *  for the rogue, a staff, circlet and robe in arcane purple for the mage, a gold mace, mitre and vestments for the priest. */
export const CLASS_ICON: Record<HeroId, Record<ClassSlot, string>> = {
  knight: { weapon: 'sword', helm: 'helm', armor: 'armor' },
  rogue: { weapon: 'dagger', helm: 'hood', armor: 'leathers' },
  mage: { weapon: 'staff', helm: 'circlet', armor: 'robe' },
  healer: { weapon: 'mace', helm: 'mitre', armor: 'vestments' },
};
/** The words an item of this slot (and class) is named from. */
export function nounsFor(slot: Slot, cls?: HeroId): string[] {
  return isClassSlot(slot) ? CLASS_NOUNS[cls ?? 'knight'][slot] : NOUNS[slot];
}
/** Cloth and leather: never iron, bronze or steel ("Iron Robe"). */
export const SOFT_NOUNS = new Set(['Hood', 'Cowl', 'Leathers', 'Jerkin', 'Tunic', 'Robe', 'Garb', 'Vestments', 'Raiment', 'Mitre', 'Sandals']);
export const METAL_ADJECTIVES = new Set(['Iron', 'Bronze', 'Steel']);
export const ADJECTIVES: Record<Rarity, string[]> = {
  common: ['Worn', 'Old', 'Plain', 'Crude'],
  uncommon: ['Iron', 'Sturdy', 'Fine', 'Bronze'],
  rare: ['Steel', 'Silver', 'Runed', 'Elven'],
  epic: ['Arcane', 'Shadow', 'Dwarven', 'Blessed'],
  legendary: ['Dragon', 'Ancient', 'Mythic', 'Titan'],
};

export const MAP_INFO: Record<MapKind, { name: string; desc: string; color: string; value: number }> = {
  elite: { name: 'Elite Pack', desc: 'Harder enemies, a guaranteed rare', color: '#f2b84b', value: 30 },
  shrine: { name: 'Shrine', desc: 'Full heal, revive all, no loot', color: '#6fcf7f', value: 30 },
  vault: { name: 'Treasure Vault', desc: 'No battle, 5 items, +30 Noise', color: '#ff9a4d', value: 30 },
  cursed: { name: 'Cursed Floor', desc: 'Your heals do half; every drop is one rarity better', color: '#c77dff', value: 30 },
  goblin: { name: 'Goblin Den', desc: 'A loot goblin after every battle; catching one is loud', color: '#9fe05a', value: 30 },
};
export const FEATHER = { name: 'Phoenix Feather', desc: 'Revive a downed hero at 50% HP', color: '#ff7ab8', value: 50 };
