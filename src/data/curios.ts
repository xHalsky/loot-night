import type { Px } from './heroes';

// Curios in the corridor (docs/design/dungeon.md, #30): Monday's set for the Shadow Crypt. Plain fantasy, played
// straight (#44); ids are older than the names (mailbox = the coffin, vending = the potion cart).
// Each choice trades loot against a real-life currency (Noise, standing still on the RPG screen, a real Monster
// can, time). Numbers live in tuning.ts (CURIO_*); the rules in systems/curios.ts. `cost` is the line shown on
// the button. `reckless` is what the party does on its own while you are away.

export type CurioId = 'strongbox' | 'mailbox' | 'shrine' | 'troll' | 'bank' | 'vending' | 'pilgrim' | 'supply' | 'altar' | 'moonwell' | 'ritual';
export interface CurioChoice { id: string; label: string; cost: string }
export interface CurioDef { id: CurioId; name: string; line: string; sprite: Px[]; w: number; choices: CurioChoice[]; reckless: string; awayLine: string }

const strongbox: Px[] = [[0,3,14,8,'#7a4a28'],[0,3,14,2,'#a0683a'],[0,6,14,1,'#5a3418'],[1,4,1,6,'#c9a46a'],[12,4,1,6,'#c9a46a'],[5,5,4,4,'#f2b84b'],[6,6,2,2,'#2a1a10'],[0,11,14,1,'#3a2410']];
const mailbox: Px[] = [[3,0,6,1,'#4a3020'],[2,1,8,3,'#5a3a28'],[1,4,10,10,'#5a3a28'],[2,14,8,2,'#4a3020'],[2,4,1,9,'#3a2418'],[9,4,1,9,'#3a2418'],[5,4,2,8,'#c9a46a'],[3,6,6,2,'#c9a46a'],[1,9,1,2,'#6ef06e']];   // a coffin
const shrine: Px[] = [[1,12,12,4,'#6a6a78'],[2,11,10,1,'#8a8a98'],[3,4,8,7,'#5a5a68'],[4,5,6,5,'#4a4a58'],[6,0,2,1,'#b0ff9a'],[5,1,4,2,'#6ef06e'],[4,3,6,2,'#3ad03a'],[2,9,1,1,'#6ef06e'],[11,8,1,1,'#6ef06e']];   // a green flame on an altar
const troll: Px[] = [[0,10,18,6,'#c9a032'],[2,9,4,2,'#f2d24b'],[11,8,5,3,'#f2d24b'],[3,4,12,6,'#5f8a3a'],[4,3,5,2,'#6f9a4a'],[4,5,2,1,'#1a2a10'],[7,5,2,1,'#1a2a10'],[5,7,3,1,'#2a3a1a'],[13,5,3,4,'#5f8a3a'],[15,1,1,1,'#efe6cf'],[16,0,2,1,'#efe6cf']];
const bank: Px[] = [[0,0,16,16,'#5a5f6a'],[1,1,14,14,'#7a808c'],[3,3,10,10,'#9aa0ac'],[4,4,8,8,'#5a5f6a'],[7,4,2,8,'#c9ced6'],[4,7,8,2,'#c9ced6'],[7,7,2,2,'#f2b84b'],[12,6,2,4,'#3a3f48']];
// stand-ins for the new curios (Paweł draws them)
const pilgrim: Px[] = [[3,0,4,3,'#6a5a48'],[4,1,2,2,'#e8b98a'],[2,3,6,10,'#7a6a52'],[3,4,4,8,'#8a7a60'],[2,13,6,2,'#4a3a2a'],[8,0,1,15,'#8a5a1c'],[7,0,3,1,'#c9a46a']];
const supply: Px[] = [[1,3,4,4,'#d9c08a'],[5,2,5,5,'#c9a46a'],[10,3,4,4,'#a0683a'],[11,1,3,2,'#e8d8a0'],[0,7,16,5,'#7a4a28'],[0,7,16,1,'#a0683a'],[1,12,4,4,'#3a2410'],[11,12,4,4,'#3a2410'],[2,13,2,2,'#8a5a1c'],[12,13,2,2,'#8a5a1c']];
const altar: Px[] = [[1,8,12,8,'#3a3440'],[2,7,10,1,'#5a5068'],[3,5,8,2,'#4a4250'],[5,3,4,2,'#8a1a2a'],[6,2,2,1,'#d23c5a'],[4,9,6,1,'#8a1a2a'],[6,10,1,4,'#8a1a2a']];
const moonwell: Px[] = [[0,8,16,6,'#5a6478'],[1,7,14,1,'#8a94a8'],[2,9,12,3,'#9fc8e8'],[4,10,8,1,'#e8f4ff'],[7,0,2,7,'#c9d8f0'],[6,2,4,1,'#e8f4ff']];
const ritual: Px[] = [[0,13,18,2,'#6a1a2a'],[2,12,14,1,'#8a1a2a'],[1,8,1,4,'#efe6cf'],[1,7,1,1,'#f2b84b'],[8,6,1,5,'#efe6cf'],[8,5,1,1,'#f2b84b'],[16,8,1,4,'#efe6cf'],[16,7,1,1,'#f2b84b'],[4,10,1,2,'#efe6cf'],[4,9,1,1,'#f2b84b'],[13,10,1,2,'#efe6cf'],[13,9,1,1,'#f2b84b']];
const vending: Px[] = [[3,0,4,2,'#efe6cf'],[4,2,1,2,'#8a5a1c'],[1,5,2,3,'#c0392b'],[4,4,2,4,'#3d6fb4'],[7,5,2,3,'#6ef06e'],[1,4,2,1,'#c9a46a'],[4,3,2,1,'#c9a46a'],[7,4,2,1,'#c9a46a'],[0,8,10,6,'#7a4a28'],[0,8,10,1,'#a0683a'],[0,14,4,4,'#3a2410'],[6,14,4,4,'#3a2410'],[1,15,2,2,'#8a5a1c'],[7,15,2,2,'#8a5a1c']];   // a potion cart

export const CURIOS: CurioDef[] = [
  { id: 'strongbox', name: 'Locked chest', line: 'Iron bands, a heavy lock. Something rattles inside.', sprite: strongbox, w: 14,
    choices: [{ id: 'pick', label: 'Pick the lock', cost: '{pick} s standing here, quiet' }, { id: 'smash', label: 'Smash it', cost: 'Instant. Noise +{smash}' }],
    reckless: 'smash', awayLine: 'Healero: "Box. Hammer. Done."' },
  { id: 'mailbox', name: 'Sealed coffin', line: 'Runes on the lid. Something inside is warm.', sprite: mailbox, w: 12,
    choices: [{ id: 'open', label: 'Open it', cost: 'Gold, a rare or a curse. Noise +{groan} (the lid grinds)' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens.' }],
    reckless: 'open', awayLine: 'Magoo: "Ooh, a coffin. Mine."' },
  // Run blessings (#52, 1.5b; data/blessings.ts): a bargain and "Leave it". Ids are the blessing ids.
  { id: 'shrine', name: 'Wayside Shrine', line: 'A green flame on a stone altar. A bell hangs over it.', sprite: shrine, w: 14,
    choices: [{ id: 'shrine', label: 'Pray', cost: 'Noise +{bell} · +20% damage' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens.' }],
    reckless: 'shrine', awayLine: 'Healero: "Free blessings, lads." The bell rings.' },
  { id: 'pilgrim', name: 'Pilgrim', line: 'An old man with a staff. He wants a vow.', sprite: pilgrim, w: 10,
    choices: [{ id: 'pilgrim', label: 'Swear his oath', cost: 'No portal till boss' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens.' }],
    reckless: 'pilgrim', awayLine: 'Knightenstein: "Sure, I swear. What did I swear?"' },
  { id: 'supply', name: 'Supply Cart', line: 'Bread, cheese, a barrel. Nobody guards it.', sprite: supply, w: 16,
    choices: [{ id: 'supply', label: 'Eat the rations', cost: 'Max HP -10% · drops +25%' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens.' }],
    reckless: 'supply', awayLine: 'Magoo: "Free food. Eat first, ask later."' },
  { id: 'altar', name: 'Blood Altar', line: 'Dark stone, warm to the touch. It wants a drop.', sprite: altar, w: 14,
    choices: [{ id: 'altar', label: 'Bleed on it', cost: 'HP drains between fights' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens.' }],
    reckless: 'altar', awayLine: 'Healero: "I\'ll heal it. Probably."' },
  { id: 'moonwell', name: 'Moonwell', line: 'Still silver water under a crack of moonlight.', sprite: moonwell, w: 16,
    choices: [{ id: 'moonwell', label: 'Drink', cost: 'Flow drops to x1' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens.' }],
    reckless: 'moonwell', awayLine: 'Magoo: "Looks clean. Glug."' },
  { id: 'ritual', name: 'Ritual Circle', line: 'Candles in a ring. Chanting from nowhere.', sprite: ritual, w: 18,
    choices: [{ id: 'ritual', label: 'Join the chant', cost: 'Enemies +20% HP' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens.' }],
    reckless: 'ritual', awayLine: 'Knightenstein starts chanting. Loudly.' },
  { id: 'troll', name: 'Sleeping troll on a loot pile', line: 'Every snore rattles the coins.', sprite: troll, w: 18,
    choices: [{ id: 'sneak', label: 'Sneak and grab', cost: '{sneak} s on this screen. Alt-tab and he wakes up' }, { id: 'fight', label: 'Fight him', cost: 'A mini-boss. Noise +{roar} (he roars)' }],
    reckless: 'fight', awayLine: 'Knightenstein: "LEEROY..."' },
  { id: 'bank', name: 'Guild bank vault', line: 'Left open. The log says "officers only".', sprite: bank, w: 16,
    choices: [{ id: 'withdraw', label: 'Take one item', cost: 'A free rare. Magoo checks the bank log later' }, { id: 'leave', label: 'Close it', cost: 'No loot.' }],
    reckless: 'withdraw', awayLine: 'Healero: "Nobody reads the bank log."' },
  { id: 'vending', name: 'Potion cart', line: 'Nobody minds it. A sign says "PAY HERE".', sprite: vending, w: 10,
    choices: [{ id: 'potion', label: 'Shake it', cost: 'Noise +{kick} · 50/50' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens.' }],
    reckless: 'potion', awayLine: 'Knightenstein shakes the cart. Hard.' },
];
export const CURIO_BY_ID: Record<string, CurioDef> = Object.fromEntries(CURIOS.map(c => [c.id, c]));

// The troll's fight (a mini-boss, not in the floor pool).
const trollFight: Px[] = [[3,0,6,3,'#5f8a3a'],[4,1,1,1,'#ff5a3a'],[7,1,1,1,'#ff5a3a'],[2,3,8,1,'#4f7a2a'],[4,3,1,1,'#efe6cf'],[7,3,1,1,'#efe6cf'],[1,4,10,8,'#5f8a3a'],[3,6,6,3,'#7a5a2a'],[0,5,1,6,'#4f7a2a'],[11,5,1,6,'#4f7a2a'],[11,2,1,10,'#8a6a4a'],[3,12,2,4,'#4f7a2a'],[7,12,2,4,'#4f7a2a']];
export const TROLL = { id: 'troll', name: 'Troll', hp: 330, atk: 14, armor: 4, speed: 6, sprite: trollFight };

export const CURIO_LINES = {
  bankNotice: ['Magoo (guild chat): "who took the {item} from the bank??"', 'Magoo (guild chat): "the log says KNIGHTENSTEIN. explain."', 'Magoo (guild chat): "officers ONLY. i am an officer. you are not."'],
  curse: 'A CURSE. Party -{fee}% damage until the next floor.',
};
