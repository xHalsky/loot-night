import type { Px } from './heroes';
import { TROLL } from './curios';

/** role: what answer the enemy asks for (docs/design/dungeon.md). healer: heals friends; shield: takes
 *  SHIELD_TAKEN damage until Bash breaks it; swarm: `stacks` small bodies, one per single-target hit.
 *  from: first floor it appears on. move: a boss's telegraphed big move (slam = SMASH, loan = SUMMON / EMPOWER,
 *  evict = EXECUTE; the ids are older than the names). meet: shown the first time you meet it. */
export type EnemyRole = 'healer' | 'shield' | 'swarm';
export type BossMove = 'slam' | 'loan' | 'evict';
export interface EnemyDef {
  id: string; name: string; hp: number; atk: number; armor: number; speed: number; boss?: boolean; sprite: Px[];
  role?: EnemyRole; stacks?: number; from?: number; move?: BossMove; meet?: string;
}

const skeleton: Px[] = [[4,0,5,4,'#e8e4d4'],[5,1,1,1,'#14101a'],[7,1,1,1,'#14101a'],[5,4,3,1,'#e8e4d4'],[4,5,5,4,'#e8e4d4'],[5,6,3,1,'#14101a'],[2,5,2,1,'#e8e4d4'],[0,3,1,6,'#9aa8c4'],[1,8,3,1,'#8a5a1c'],[5,9,1,5,'#e8e4d4'],[7,9,1,5,'#e8e4d4']];
const bat: Px[] = [[0,8,3,2,'#5a3a6a'],[9,8,3,2,'#5a3a6a'],[1,7,2,1,'#5a3a6a'],[9,7,2,1,'#5a3a6a'],[3,7,6,5,'#3a2a52'],[3,6,1,1,'#3a2a52'],[8,6,1,1,'#3a2a52'],[4,8,1,1,'#ff4d4d'],[7,8,1,1,'#ff4d4d'],[5,11,1,1,'#f2e9d8'],[7,11,1,1,'#f2e9d8']];
// Sprites for the fantasy roster (#44). Ids are the old ones (saves and tests key on them); names are what you see.
const orc: Px[] = [[3,0,6,1,'#2a1a10'],[3,1,6,4,'#5f8a3a'],[4,2,1,1,'#ff4d2e'],[7,2,1,1,'#ff4d2e'],[4,4,1,1,'#efe6cf'],[7,4,1,1,'#efe6cf'],[0,6,2,5,'#5f8a3a'],[10,6,2,5,'#5f8a3a'],[2,5,8,7,'#6a4028'],[2,9,8,1,'#2a1a10'],[3,12,2,4,'#3a2a1a'],[7,12,2,4,'#3a2a1a'],[11,1,1,11,'#8a5a1c'],[9,1,2,3,'#9aa8c4']];
const shaman: Px[] = [[3,0,1,2,'#d9534f'],[5,0,2,1,'#f2b84b'],[8,0,1,2,'#6fcf7f'],[2,2,1,2,'#7a9a4a'],[9,2,1,2,'#7a9a4a'],[3,2,6,3,'#7a9a4a'],[4,3,1,1,'#ffe066'],[7,3,1,1,'#ffe066'],[3,5,6,9,'#6a3a6a'],[4,5,4,1,'#efe6cf'],[10,2,1,13,'#8a5a1c'],[9,0,3,2,'#6ef06e'],[3,14,2,2,'#2b2f3e'],[7,14,2,2,'#2b2f3e']];
const guardian: Px[] = [[3,0,6,4,'#8a8f9a'],[4,2,4,1,'#14101a'],[3,4,6,8,'#6a707c'],[3,12,2,4,'#4a505c'],[7,12,2,4,'#4a505c'],[10,0,1,13,'#8a5a1c'],[10,0,1,2,'#c9ced6'],[0,4,6,10,'#3d6fb4'],[0,4,6,1,'#c9a46a'],[0,13,6,1,'#c9a46a'],[2,7,2,3,'#f2b84b']];
export const IMP: Px[] = [[1,0,1,1,'#2a1010'],[6,0,1,1,'#2a1010'],[0,3,1,2,'#5a1a1a'],[7,3,1,2,'#5a1a1a'],[1,1,6,3,'#c0392b'],[2,2,1,1,'#ffe066'],[5,2,1,1,'#ffe066'],[2,4,4,2,'#a02a20'],[6,5,2,1,'#5a1a1a']];
const ogre: Px[] = [[3,0,6,4,'#9a7a5a'],[4,1,1,1,'#ff4d2e'],[7,1,1,1,'#ff4d2e'],[4,3,4,1,'#3a2010'],[5,3,1,1,'#efe6cf'],[1,4,10,8,'#9a7a5a'],[3,5,6,4,'#b08a6a'],[1,9,10,3,'#6a4028'],[0,5,1,6,'#9a7a5a'],[11,5,1,6,'#9a7a5a'],[10,0,2,6,'#6a4028'],[9,1,1,1,'#c9ced6'],[9,3,1,1,'#c9ced6'],[2,12,3,4,'#7a5a3a'],[7,12,3,4,'#7a5a3a']];
const warlock: Px[] = [[3,0,6,1,'#4a2a6a'],[2,1,8,4,'#4a2a6a'],[4,2,4,3,'#14101a'],[4,3,1,1,'#6ef06e'],[7,3,1,1,'#6ef06e'],[2,5,8,9,'#5a2f8a'],[5,5,2,9,'#6ef06e'],[1,5,2,2,'#5a5a6a'],[9,5,2,2,'#5a5a6a'],[4,9,4,1,'#efe6cf'],[0,8,2,2,'#6ef06e'],[10,8,2,2,'#6ef06e'],[3,14,2,2,'#14101a'],[7,14,2,2,'#14101a']];
const blackKnight: Px[] = [[3,0,6,4,'#4a4e5e'],[5,0,2,1,'#e0302a'],[4,2,4,1,'#ff5a3a'],[2,4,8,8,'#3a3d4c'],[3,5,1,6,'#6a6e80'],[1,4,2,2,'#6a6e80'],[9,4,2,2,'#6a6e80'],[11,1,1,10,'#e8ecf2'],[10,10,2,1,'#e0b25a'],[0,6,4,6,'#8a2222'],[0,6,4,1,'#b0b6c2'],[1,8,2,2,'#e8ecf2'],[3,12,2,4,'#2e3140'],[7,12,2,4,'#2e3140']];

export const ENEMIES: EnemyDef[] = [
  { id: 'skeleton', name: 'Skeleton', hp: 85, atk: 9, armor: 2, speed: 8, sprite: skeleton },
  { id: 'bat', name: 'Bat', hp: 55, atk: 7, armor: 0, speed: 13, sprite: bat },
  { id: 'collector', name: 'Orc', hp: 125, atk: 11, armor: 3, speed: 7, sprite: orc },
  { id: 'auditor', name: 'Shaman', hp: 55, atk: 5, armor: 1, speed: 9, sprite: shaman, role: 'healer', from: 2,
    meet: 'New: Shaman. Heals his friends. Frost goes for him first.' },
  { id: 'shelter', name: 'Guardian', hp: 110, atk: 8, armor: 4, speed: 6, sprite: guardian, role: 'shield', from: 3,
    meet: 'New: Guardian. Takes 75% less damage until Bash breaks his shield.' },
  { id: 'junk', name: 'Imps', hp: 75, atk: 4, armor: 0, speed: 11, sprite: IMP, role: 'swarm', stacks: 5, from: 4,
    meet: 'New: Imps. One imp per hit, and each one bites. Fire burns them all.' },
];
// One boss per checkpoint floor, in this order, then around again (floors 5, 10, 15, 20...).
export const BOSSES: EnemyDef[] = [
  { id: 'bailiff', name: 'Ogre', hp: 1700, atk: 28, armor: 5, speed: 8, boss: true, sprite: ogre, move: 'slam',
    meet: 'Boss: Ogre. SMASH hits everyone: Bash, Ward or Taunt.' },
  { id: 'shark', name: 'Warlock', hp: 1700, atk: 28, armor: 4, speed: 9, boss: true, sprite: warlock, move: 'loan',
    meet: 'Boss: Warlock. He summons a friend, or empowers the one still standing: full HP, hits harder. Kill friends fast.' },
  { id: 'landlord', name: 'Black Knight', hp: 1600, atk: 26, armor: 6, speed: 7, boss: true, sprite: blackKnight, move: 'evict', role: 'shield',
    meet: 'Boss: Black Knight. Bash his shield off. EXECUTE hits one hero hard: Taunt or Ward.' },
];
export const bossFor = (floor: number, every: number) => BOSSES[(Math.max(1, Math.floor(floor / every)) - 1) % BOSSES.length];
export const ENEMY_BY_ID: Record<string, EnemyDef> = Object.fromEntries([...ENEMIES, ...BOSSES, TROLL].map(e => [e.id, e]));
