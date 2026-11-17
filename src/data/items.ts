import type { Rarity, Slot, Stat, MapKind } from '../core/state';

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8e8a99', uncommon: '#6fcf7f', rare: '#6aa8ff', epic: '#b98cff', legendary: '#ff9a4d',
};
export const RARITY_BG: Record<Rarity, string> = {
  common: '#3a3342', uncommon: '#1f3a2c', rare: '#1f2f4a', epic: '#34244f', legendary: '#4a2f17',
};
export const RARITY_MULT: Record<Rarity, number> = { common: 1, uncommon: 1.3, rare: 1.7, epic: 2.2, legendary: 3 };
export const POSITIVE_AFFIXES: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 2, epic: 3, legendary: 4 };
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
  atk: [2, 1.2], hp: [8, 5], armor: [1, 0.8], speed: [1, 0.25], crit: [2, 0.3], luck: [2, 0.5],
};
export const STAT_LABEL: Record<Stat, string> = { atk: 'Attack', hp: 'Max HP', armor: 'Armor', speed: 'Speed', crit: 'Crit %', luck: 'Luck' };

export const NOUNS: Record<Slot, string[]> = {
  weapon: ['Rusty Fork', 'Tax Axe', 'Ledger Blade', 'Stapler Mace', 'Late-Fee Dagger', 'Bent Staff', 'Invoice Spear'],
  helm: ['Dented Pot', 'Monster-Can Helm', 'Paper Crown', 'Colander', 'Headset of Denial'],
  armor: ['Chain of Receipts', 'Overdraft Plate', 'Hoodie of Comfort', 'Bathrobe', 'Cardboard Vest'],
  boots: ['Squeaky Boots', 'Wet Boot', 'Slippers', 'Crocs of Haste', 'Socks with Sandals'],
  ring: ['Phonecard Ring', 'Keyring', 'Bottle-Cap Ring', 'Tab-Pull Band'],
  trinket: ['Lucky Receipt', 'Soggy Notebook', 'Spoon', 'Rubber Duck', 'Expired Coupon'],
};
export const ADJECTIVES: Record<Rarity, string[]> = {
  common: ['Worn', 'Cheap', 'Plain', 'Used'],
  uncommon: ['Sturdy', 'Shiny', 'Decent', 'Polished'],
  rare: ['Overdue', 'Compounding', 'Audited', 'Certified'],
  epic: ['Collector\'s', 'Bailiff\'s', 'Notarized', 'Gilded'],
  legendary: ['Eternal', 'Unpaid', 'Mythic', 'Final-Notice'],
};
export const SUFFIXES = ['of Many Lives', 'of Five More Minutes', 'of the Night Owl', 'of Infinite Excuses', 'of Compound Interest', 'of One More Floor', 'of the Raid Leader'];

export const MAP_INFO: Record<MapKind, { name: string; desc: string; color: string; value: number }> = {
  elite: { name: 'Elite Pack', desc: 'Harder enemies, a guaranteed rare', color: '#f2b84b', value: 30 },
  shrine: { name: 'Shrine', desc: 'Full heal, revive all, no loot', color: '#6fcf7f', value: 30 },
  vault: { name: 'Treasure Vault', desc: 'No battle, 5 items, +30 Noise', color: '#ff9a4d', value: 30 },
  cursed: { name: 'Cursed Floor', desc: 'Your heals do half; every drop is one rarity better', color: '#c77dff', value: 30 },
  goblin: { name: 'Goblin Den', desc: 'A loot goblin after every battle; catching one is loud', color: '#9fe05a', value: 30 },
};
export const FEATHER = { name: 'Phoenix Feather', desc: 'Revive a downed hero at 50% HP', color: '#ff7ab8', value: 50 };
