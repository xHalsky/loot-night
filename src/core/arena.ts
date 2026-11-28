// Where units stand on the battle area (334 x 232 grid px; grid doc §4b, §4c). Rules use it to place drops and
// numbers; the renderer draws there. Party: position 1 at the front (right), 35 px apart. Enemies: six on screen,
// fodder in two close lanes (front y 202, back y 190), the lieutenant or the boss behind them on the party's lane.
export const POS_X = [126, 87, 56, 21];
export const PARTY_Y = 196;
export interface EnemySlot { x: number; lane: 'front' | 'back' | 'mid'; y: number; bar: number }
export const ENEMY_SLOTS: EnemySlot[] = [
  { x: 186, lane: 'front', y: 202, bar: 132 }, { x: 226, lane: 'front', y: 202, bar: 132 }, { x: 266, lane: 'front', y: 202, bar: 132 },
  { x: 205, lane: 'back', y: 190, bar: 117 }, { x: 245, lane: 'back', y: 190, bar: 117 },
  { x: 300, lane: 'mid', y: 196, bar: 121 },
];
export const MID_SLOT = 5;
export const FLOOR_Y = PARTY_Y;        // where drops lie: on the party's walk line, so the front hero's feet reach them (#144; was 201, below it)
export const LOOTER_REACH = 8;         // the front hero picks up what lies this close in front of his feet (#95)
/** Over a unit's head (numbers float up from here). */
export const HEAD_Y = 150;
