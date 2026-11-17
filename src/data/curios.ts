import type { Px } from './heroes';

// Curios in the corridor (docs/design/dungeon.md, #30): Monday's set for the Dungeon of Overdue Bills.
// Each choice trades loot against a real-life currency (Noise, standing still on the RPG screen, a real Monster
// can, time). Numbers live in tuning.ts (CURIO_*); the rules in systems/curios.ts. `cost` is the line shown on
// the button. `reckless` is what the party does on its own while you are away.

export type CurioId = 'strongbox' | 'mailbox' | 'shrine' | 'troll' | 'bank' | 'vending';
export interface CurioChoice { id: string; label: string; cost: string }
export interface CurioDef { id: CurioId; name: string; line: string; sprite: Px[]; w: number; choices: CurioChoice[]; reckless: string; awayLine: string }

const strongbox: Px[] = [[0,3,14,8,'#7a4a28'],[0,3,14,2,'#a0683a'],[0,6,14,1,'#5a3418'],[1,4,1,6,'#c9a46a'],[12,4,1,6,'#c9a46a'],[5,5,4,4,'#f2b84b'],[6,6,2,2,'#2a1a10'],[0,11,14,1,'#3a2410']];
const mailbox: Px[] = [[2,0,8,2,'#8a2a2a'],[1,2,10,8,'#c0392b'],[2,4,8,2,'#2a1010'],[3,3,5,2,'#efe6cf'],[4,2,3,2,'#efe6cf'],[2,7,8,1,'#f2d24b'],[5,10,2,6,'#5a5a6a'],[3,15,6,1,'#3a3a44']];
const shrine: Px[] = [[1,12,12,4,'#6a6a78'],[2,11,10,1,'#8a8a98'],[3,4,8,7,'#5a5a68'],[4,5,6,5,'#4a4a58'],[5,0,4,7,'#111'],[5,0,4,1,'#c9ced6'],[6,2,1,4,'#6ef06e'],[7,1,1,5,'#3ad03a'],[2,9,1,1,'#6ef06e'],[11,8,1,1,'#6ef06e']];
const troll: Px[] = [[0,10,18,6,'#c9a032'],[2,9,4,2,'#f2d24b'],[11,8,5,3,'#f2d24b'],[3,4,12,6,'#5f8a3a'],[4,3,5,2,'#6f9a4a'],[4,5,2,1,'#1a2a10'],[7,5,2,1,'#1a2a10'],[5,7,3,1,'#2a3a1a'],[13,5,3,4,'#5f8a3a'],[15,1,1,1,'#efe6cf'],[16,0,2,1,'#efe6cf']];
const bank: Px[] = [[0,0,16,16,'#5a5f6a'],[1,1,14,14,'#7a808c'],[3,3,10,10,'#9aa0ac'],[4,4,8,8,'#5a5f6a'],[7,4,2,8,'#c9ced6'],[4,7,8,2,'#c9ced6'],[7,7,2,2,'#f2b84b'],[12,6,2,4,'#3a3f48']];
const vending: Px[] = [[0,0,10,18,'#b03030'],[1,1,8,1,'#f2d24b'],[1,3,6,10,'#1a2030'],[2,4,1,2,'#6ef06e'],[4,4,1,2,'#ff9a4d'],[2,7,1,2,'#8fd8ff'],[4,7,1,2,'#f2d24b'],[2,10,1,2,'#ff7ab8'],[4,10,1,2,'#6ef06e'],[7,4,2,5,'#5a5a6a'],[1,14,6,3,'#2a2a34'],[0,18,10,1,'#3a1010']];

export const CURIOS: CurioDef[] = [
  { id: 'strongbox', name: 'Locked strongbox', line: 'Stamped "PAST DUE". Something rattles inside.', sprite: strongbox, w: 14,
    choices: [{ id: 'pick', label: 'Pick the lock', cost: '{pick} s standing here, quiet' }, { id: 'smash', label: 'Smash it', cost: 'Instant. Noise +{smash}' }],
    reckless: 'smash', awayLine: 'Jacek: "Box. Hammer. Done."' },
  { id: 'mailbox', name: 'Overdue mailbox', line: 'Stuffed full. One envelope is warm.', sprite: mailbox, w: 12,
    choices: [{ id: 'open', label: 'Open it', cost: 'Gold, a rare or a late fee. Noise +{groan} (he groans)' }, { id: 'leave', label: 'Leave it', cost: 'Nothing happens. Sensible.' }],
    reckless: 'open', awayLine: 'Rafał: "Ooh, mail!"' },
  { id: 'shrine', name: 'Energy-drink shrine', line: 'A can on a stone. It hums in green.', sprite: shrine, w: 14,
    choices: [{ id: 'offer', label: 'Offer a Monster can', cost: 'A real can from your desk. Party +{canDmg}% damage, +{canSpd}% speed for {canSec} s' }, { id: 'pray', label: 'Pray for free', cost: 'Coin flip: a small blessing, or it burps (Noise +{burp})' }],
    reckless: 'pray', awayLine: 'Jacek: "Free blessings, lads."' },
  { id: 'troll', name: 'Snoring troll on a loot pile', line: 'Every snore rattles the coins.', sprite: troll, w: 18,
    choices: [{ id: 'sneak', label: 'Sneak and grab', cost: '{sneak} s on this screen. Alt-tab and he wakes up' }, { id: 'fight', label: 'Fight him', cost: 'A mini-boss. Noise +{roar} (he roars)' }],
    reckless: 'fight', awayLine: 'Paweł: "LEEROY..."' },
  { id: 'bank', name: 'Guild bank vault', line: 'Left open. The log says "officers only".', sprite: bank, w: 16,
    choices: [{ id: 'withdraw', label: 'Withdraw "just one thing"', cost: 'A free rare. Rafał checks the bank log later' }, { id: 'leave', label: 'Close it', cost: 'Integrity. No loot.' }],
    reckless: 'withdraw', awayLine: 'Jacek: "Nobody reads the bank log."' },
  { id: 'vending', name: 'Unpaid vending machine', line: '"OUT OF ORDER (pay anyway)".', sprite: vending, w: 10,
    choices: [{ id: 'pay', label: 'Pay {vendGold} gold', cost: 'Snacks: party heals {vendHeal}%' }, { id: 'kick', label: 'Kick it', cost: 'Noise +{kick}. 50/50: snacks or a sore foot' }],
    reckless: 'kick', awayLine: 'Paweł kicks it. Hard.' },
];
export const CURIO_BY_ID: Record<string, CurioDef> = Object.fromEntries(CURIOS.map(c => [c.id, c]));

// The troll's fight (a mini-boss, not in the floor pool).
const trollFight: Px[] = [[3,0,6,3,'#5f8a3a'],[4,1,1,1,'#ff5a3a'],[7,1,1,1,'#ff5a3a'],[2,3,8,1,'#4f7a2a'],[4,3,1,1,'#efe6cf'],[7,3,1,1,'#efe6cf'],[1,4,10,8,'#5f8a3a'],[3,6,6,3,'#7a5a2a'],[0,5,1,6,'#4f7a2a'],[11,5,1,6,'#4f7a2a'],[11,2,1,10,'#8a6a4a'],[3,12,2,4,'#4f7a2a'],[7,12,2,4,'#4f7a2a']];
export const TROLL = { id: 'troll', name: 'Snoring Troll', hp: 330, atk: 14, armor: 4, speed: 6, sprite: trollFight };

export const CURIO_LINES = {
  bankNotice: ['Rafał (guild chat): "who took the {item} from the bank??"', 'Rafał (guild chat): "the log says PAWEŁ. explain."', 'Rafał (guild chat): "officers ONLY. i am an officer. you are not."'],
  lateFee: 'A LATE FEE. Party -{fee}% damage until the next floor.',
};
