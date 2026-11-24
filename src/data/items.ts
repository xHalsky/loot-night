import type { Rarity, Slot, Stat, MapKind } from '../core/state';

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
export const NOUNS: Record<Slot, string[]> = {
  weapon: ['Sword', 'Axe', 'Mace', 'Dagger', 'Spear', 'Staff', 'Hammer'],
  helm: ['Helm', 'Hood', 'Crown', 'Circlet'],
  armor: ['Breastplate', 'Chainmail', 'Robe', 'Tunic'],
  boots: ['Boots', 'Greaves', 'Sandals', 'Treads'],
  ring: ['Ring', 'Band', 'Signet'],
  trinket: ['Amulet', 'Charm', 'Talisman', 'Relic'],
};
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
