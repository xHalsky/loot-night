import type { Px } from './heroes';

/** role: what answer the enemy asks for (docs/design/dungeon.md). healer: heals friends; shield: takes
 *  SHIELD_TAKEN damage until Bash breaks it; swarm: `stacks` small bodies, one per single-target hit.
 *  from: first floor it appears on. move: a boss's telegraphed big move. meet: shown the first time you meet it. */
export type EnemyRole = 'healer' | 'shield' | 'swarm';
export type BossMove = 'slam' | 'loan' | 'evict';
export interface EnemyDef {
  id: string; name: string; hp: number; atk: number; armor: number; speed: number; boss?: boolean; sprite: Px[];
  role?: EnemyRole; stacks?: number; from?: number; move?: BossMove; meet?: string;
}

const skeleton: Px[] = [[4,0,5,4,'#e8e4d4'],[5,1,1,1,'#14101a'],[7,1,1,1,'#14101a'],[5,4,3,1,'#e8e4d4'],[4,5,5,4,'#e8e4d4'],[5,6,3,1,'#14101a'],[2,5,2,1,'#e8e4d4'],[0,3,1,6,'#9aa8c4'],[1,8,3,1,'#8a5a1c'],[5,9,1,5,'#e8e4d4'],[7,9,1,5,'#e8e4d4']];
const bat: Px[] = [[0,8,3,2,'#5a3a6a'],[9,8,3,2,'#5a3a6a'],[1,7,2,1,'#5a3a6a'],[9,7,2,1,'#5a3a6a'],[3,7,6,5,'#3a2a52'],[3,6,1,1,'#3a2a52'],[8,6,1,1,'#3a2a52'],[4,8,1,1,'#ff4d4d'],[7,8,1,1,'#ff4d4d'],[5,11,1,1,'#f2e9d8'],[7,11,1,1,'#f2e9d8']];
const collector: Px[] = [[4,0,4,3,'#1c1f2e'],[3,3,6,1,'#1c1f2e'],[4,4,4,2,'#e8e4d4'],[4,5,1,1,'#14101a'],[7,5,1,1,'#14101a'],[3,6,6,7,'#5a1f2b'],[5,7,1,1,'#f2b84b'],[5,9,1,1,'#f2b84b'],[0,7,3,3,'#d9a441'],[4,13,2,3,'#1c1f2e'],[6,13,2,3,'#1c1f2e']];
const bailiff: Px[] = [[3,0,6,2,'#1c1f2e'],[2,2,8,1,'#1c1f2e'],[3,3,6,3,'#cfc6b0'],[4,4,1,1,'#e0524a'],[7,4,1,1,'#e0524a'],[2,6,8,7,'#3a2a2a'],[5,7,2,5,'#d9a441'],[0,6,2,6,'#3a2a2a'],[10,6,2,6,'#3a2a2a'],[10,2,2,4,'#9aa8c4'],[3,13,2,3,'#1c1f2e'],[7,13,2,3,'#1c1f2e']];

const auditor: Px[] = [[3,0,6,1,'#3a8a4a'],[2,1,8,1,'#2f6f3c'],[3,2,6,4,'#e8c9a0'],[3,3,2,1,'#14101a'],[7,3,2,1,'#14101a'],[5,3,2,1,'#5a4a3a'],[4,5,4,1,'#b08868'],[3,6,6,7,'#e9e2cf'],[5,6,2,5,'#6a2a2a'],[0,7,3,4,'#5a5a6a'],[0,7,3,1,'#9fe08a'],[9,7,2,4,'#e9e2cf'],[4,13,2,3,'#2b2f3e'],[6,13,2,3,'#2b2f3e']];
const shelter: Px[] = [[2,0,8,1,'#8a5a3a'],[1,1,10,2,'#8a5a3a'],[0,3,12,1,'#5a3a20'],[1,4,10,10,'#b8a888'],[2,5,2,2,'#2b3a5c'],[8,5,2,2,'#2b3a5c'],[4,8,4,6,'#5a3a20'],[5,10,1,1,'#f2b84b'],[4,6,4,1,'#f2b84b'],[1,14,10,2,'#5a5040']];
export const ENVELOPE: Px[] = [[0,0,8,6,'#efe6cf'],[1,1,1,1,'#9a8a6a'],[2,2,1,1,'#9a8a6a'],[3,3,2,1,'#9a8a6a'],[5,2,1,1,'#9a8a6a'],[6,1,1,1,'#9a8a6a'],[6,4,2,2,'#e0524a']];
const shark: Px[] = [[5,0,2,2,'#5a6a7a'],[2,2,8,4,'#7a8a9a'],[3,3,1,1,'#14101a'],[8,3,1,1,'#14101a'],[3,5,6,1,'#f2f2f2'],[4,5,1,1,'#7a8a9a'],[6,5,1,1,'#7a8a9a'],[2,6,8,7,'#2b2f3e'],[5,6,2,3,'#e9e2cf'],[5,7,2,4,'#c03a3a'],[3,8,1,4,'#4a5068'],[8,8,1,4,'#4a5068'],[4,9,4,1,'#f2b84b'],[0,7,2,5,'#2b2f3e'],[10,7,2,5,'#2b2f3e'],[10,10,2,3,'#6a4028'],[3,13,2,3,'#14101a'],[7,13,2,3,'#14101a']];
const landlord: Px[] = [[3,1,6,4,'#e8c9a0'],[4,1,4,1,'#f4dcc0'],[2,2,1,2,'#8a6a4a'],[9,2,1,2,'#8a6a4a'],[4,3,1,1,'#14101a'],[7,3,1,1,'#14101a'],[4,4,4,1,'#8a5a3a'],[2,5,8,8,'#7a4a6a'],[5,5,2,8,'#e9e2cf'],[5,7,1,1,'#5a3a20'],[5,10,1,1,'#5a3a20'],[0,6,2,6,'#7a4a6a'],[10,6,2,4,'#7a4a6a'],[10,10,2,2,'#f2b84b'],[11,12,1,2,'#cfd6e4'],[3,13,2,3,'#2b2f3e'],[7,13,2,3,'#2b2f3e']];

export const ENEMIES: EnemyDef[] = [
  { id: 'skeleton', name: 'Debt Skeleton', hp: 85, atk: 9, armor: 2, speed: 8, sprite: skeleton },
  { id: 'bat', name: 'Late-Fee Bat', hp: 55, atk: 7, armor: 0, speed: 13, sprite: bat },
  { id: 'collector', name: 'The Collector', hp: 125, atk: 11, armor: 3, speed: 7, sprite: collector },
  { id: 'auditor', name: 'The Auditor', hp: 55, atk: 5, armor: 1, speed: 9, sprite: auditor, role: 'healer', from: 2,
    meet: 'New: The Auditor cooks the books and heals his friends. Frost goes for him first.' },
  { id: 'shelter', name: 'Tax Shelter', hp: 110, atk: 8, armor: 4, speed: 6, sprite: shelter, role: 'shield', from: 3,
    meet: 'New: Tax Shelter. Takes 75% less damage until Bash breaks the shield.' },
  { id: 'junk', name: 'Junk Mail', hp: 75, atk: 4, armor: 0, speed: 11, sprite: ENVELOPE, role: 'swarm', stacks: 5, from: 4,
    meet: 'New: Junk Mail. One envelope per hit, and each one bites. Fire burns them all.' },
];
// One boss per checkpoint floor, in this order, then around again (floors 5, 10, 15, 20...).
export const BOSSES: EnemyDef[] = [
  { id: 'bailiff', name: 'The Bailiff', hp: 1700, atk: 28, armor: 5, speed: 8, boss: true, sprite: bailiff, move: 'slam',
    meet: 'Boss: The Bailiff. FINAL NOTICE hits everyone: Bash, Ward or Taunt.' },
  { id: 'shark', name: 'The Loan Shark', hp: 1700, atk: 28, armor: 4, speed: 9, boss: true, sprite: shark, move: 'loan',
    meet: 'Boss: The Loan Shark. Every loan brings a friend, or refinances the one still standing: full HP, hits harder. Kill friends fast.' },
  { id: 'landlord', name: 'The Landlord', hp: 1600, atk: 26, armor: 6, speed: 7, boss: true, sprite: landlord, move: 'evict', role: 'shield',
    meet: 'Boss: The Landlord. Bash his deposit off. EVICTION hits one hero hard: Taunt or Ward.' },
];
export const bossFor = (floor: number, every: number) => BOSSES[(Math.max(1, Math.floor(floor / every)) - 1) % BOSSES.length];
export const ENEMY_BY_ID: Record<string, EnemyDef> = Object.fromEntries([...ENEMIES, ...BOSSES].map(e => [e.id, e]));
