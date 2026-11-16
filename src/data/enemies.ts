import type { Px } from './heroes';

export interface EnemyDef { id: string; name: string; hp: number; atk: number; armor: number; speed: number; boss?: boolean; sprite: Px[] }

const skeleton: Px[] = [[4,0,5,4,'#e8e4d4'],[5,1,1,1,'#14101a'],[7,1,1,1,'#14101a'],[5,4,3,1,'#e8e4d4'],[4,5,5,4,'#e8e4d4'],[5,6,3,1,'#14101a'],[2,5,2,1,'#e8e4d4'],[0,3,1,6,'#9aa8c4'],[1,8,3,1,'#8a5a1c'],[5,9,1,5,'#e8e4d4'],[7,9,1,5,'#e8e4d4']];
const bat: Px[] = [[0,8,3,2,'#5a3a6a'],[9,8,3,2,'#5a3a6a'],[1,7,2,1,'#5a3a6a'],[9,7,2,1,'#5a3a6a'],[3,7,6,5,'#3a2a52'],[3,6,1,1,'#3a2a52'],[8,6,1,1,'#3a2a52'],[4,8,1,1,'#ff4d4d'],[7,8,1,1,'#ff4d4d'],[5,11,1,1,'#f2e9d8'],[7,11,1,1,'#f2e9d8']];
const collector: Px[] = [[4,0,4,3,'#1c1f2e'],[3,3,6,1,'#1c1f2e'],[4,4,4,2,'#e8e4d4'],[4,5,1,1,'#14101a'],[7,5,1,1,'#14101a'],[3,6,6,7,'#5a1f2b'],[5,7,1,1,'#f2b84b'],[5,9,1,1,'#f2b84b'],[0,7,3,3,'#d9a441'],[4,13,2,3,'#1c1f2e'],[6,13,2,3,'#1c1f2e']];
const bailiff: Px[] = [[3,0,6,2,'#1c1f2e'],[2,2,8,1,'#1c1f2e'],[3,3,6,3,'#cfc6b0'],[4,4,1,1,'#e0524a'],[7,4,1,1,'#e0524a'],[2,6,8,7,'#3a2a2a'],[5,7,2,5,'#d9a441'],[0,6,2,6,'#3a2a2a'],[10,6,2,6,'#3a2a2a'],[10,2,2,4,'#9aa8c4'],[3,13,2,3,'#1c1f2e'],[7,13,2,3,'#1c1f2e']];

export const ENEMIES: EnemyDef[] = [
  { id: 'skeleton', name: 'Debt Skeleton', hp: 85, atk: 9, armor: 2, speed: 8, sprite: skeleton },
  { id: 'bat', name: 'Late-Fee Bat', hp: 55, atk: 7, armor: 0, speed: 13, sprite: bat },
  { id: 'collector', name: 'The Collector', hp: 125, atk: 11, armor: 3, speed: 7, sprite: collector },
];
export const BOSS: EnemyDef = { id: 'bailiff', name: 'The Bailiff', hp: 1100, atk: 28, armor: 5, speed: 8, boss: true, sprite: bailiff };
export const ENEMY_BY_ID: Record<string, EnemyDef> = Object.fromEntries([...ENEMIES, BOSS].map(e => [e.id, e]));
