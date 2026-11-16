// City buildings you build on fixed plots and upgrade to level 3 (docs/design/city.md).
export type CityId = 'training' | 'inn' | 'library' | 'treasury';
export interface CityDef { id: CityId; name: string; effect: string[]; gold: number[]; mats: number[] }
export const CITY: CityDef[] = [
  { id: 'training', name: 'Training Grounds', effect: ['Attack +10%', 'Attack +18%', 'Attack +25%'], gold: [250, 600, 1300], mats: [6, 14, 26] },
  { id: 'inn', name: 'Inn', effect: ['Max HP +10%', 'Max HP +18%', 'Max HP +25%'], gold: [250, 600, 1300], mats: [6, 14, 26] },
  { id: 'library', name: 'Library', effect: ['Cooldowns -8%', 'Cooldowns -15%', 'Cooldowns -22%'], gold: [350, 800, 1600], mats: [8, 18, 32] },
  { id: 'treasury', name: 'Treasury', effect: ['Backpack +2 slots', 'Backpack +4 slots', 'Backpack +6 slots'], gold: [400, 900, 1800], mats: [10, 20, 36] },
];
export const CITY_BY_ID = Object.fromEntries(CITY.map(c => [c.id, c])) as Record<CityId, CityDef>;
export const ATK_PCT = [0, 0.10, 0.18, 0.25];
export const HP_PCT = [0, 0.10, 0.18, 0.25];
export const CD_PCT = [0, 0.08, 0.15, 0.22];
export const BAG_PLUS = [0, 2, 4, 6];
