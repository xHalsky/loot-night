import type { HeroId, Stat } from '../core/state';

/** power: damage or heal multiplier of attack; flat: added heal; dur: seconds of an effect. use: when to fire it. */
export interface AbilityDef { name: string; short: string; cd: number; desc: string; power?: number; flat?: number; dur?: number; use?: string }
export const HERO_ROLE: Record<HeroId, { role: string; auto: string }> = {
  knight: { role: 'Tank. Stands in front, carries the torch, picks up loot.', auto: 'Slashes the front enemy.' },
  mage: { role: 'Damage. Fragile, hits hard.', auto: 'Bolts the weakest enemy (finishes kills).' },
  healer: { role: 'Support. Keeps everyone alive.', auto: 'Heals an ally under 60% HP, otherwise smites.' },
};

export const HERO_BASE: Record<HeroId, Record<Stat, number>> = {
  knight: { hp: 130, atk: 9, armor: 6, speed: 9, crit: 5, luck: 0 },
  mage: { hp: 75, atk: 15, armor: 2, speed: 11, crit: 8, luck: 0 },
  healer: { hp: 90, atk: 7, armor: 3, speed: 10, crit: 5, luck: 0 },
};

export const HERO_COLORS: Record<HeroId, string> = { knight: '#3d6fb4', mage: '#5b3aa8', healer: '#3a8f6a' };

// Hotkeys per hero, one per ability slot (slot 0 = auto attack).
export const HOTKEYS: Record<HeroId, string[]> = {
  knight: ['', '1', '2', '3', '4'],   // slot 0 is the auto attack: always on, no key
  mage: ['', 'q', 'w', 'e', 'r'],
  healer: ['', 'a', 's', 'd', 'f'],
};

export const ABILITIES: Record<HeroId, AbilityDef[]> = {
  knight: [
    { name: 'Slash', short: 'SLASH', cd: 0, desc: 'Auto attack on the front enemy.' },
    { name: 'Taunt', short: 'TAUNT', cd: 10, dur: 5, desc: 'All enemies attack the knight for {dur} s. FINAL NOTICE hits only him.', use: 'The mage or healer is low, or a boss winds up.' },
    { name: 'Bash', short: 'BASH', cd: 8, power: 2, desc: 'Hits the front enemy for {dmg} and stuns it for a turn. Interrupts FINAL NOTICE (then the boss braces: the next one can\'t be interrupted).', use: 'A boss winds up FINAL NOTICE.' },
    { name: 'Rally', short: 'RALLY', cd: 0, desc: 'Locked in the prototype.' },
    { name: 'Ultimate', short: 'ULT', cd: 0, desc: 'Locked in the prototype.' },
  ],
  mage: [
    { name: 'Bolt', short: 'BOLT', cd: 0, desc: 'Auto attack on the weakest enemy.' },
    { name: 'Fire', short: 'FIRE', cd: 9, power: 1, desc: 'Hits every enemy for {dmg}.', use: 'Three enemies are up.' },
    { name: 'Frost', short: 'FROST', cd: 7, power: 2.6, desc: 'Hits the front enemy for {dmg}.', use: 'One big target, like a boss. Kill things before Interest stacks.' },
    { name: 'Storm', short: 'STORM', cd: 0, desc: 'Locked in the prototype.' },
    { name: 'Ultimate', short: 'ULT', cd: 0, desc: 'Locked in the prototype.' },
  ],
  healer: [
    { name: 'Smite', short: 'SMITE', cd: 0, desc: 'Auto: heals an ally under 60% HP, else attacks.' },
    { name: 'Mend', short: 'MEND', cd: 10, power: 2.2, flat: 14, desc: 'Heals every hero for {heal}.', use: 'After a big hit, or before you alt-tab.' },
    { name: 'Ward', short: 'WARD', cd: 14, dur: 6, power: 0.6, desc: 'Party takes 40% less damage for {dur} s. Halves FINAL NOTICE.', use: 'A braced boss winds up, or a big pack hits hard.' },
    { name: 'Revive', short: 'REVIVE', cd: 0, desc: 'Locked in the prototype.' },
    { name: 'Ultimate', short: 'ULT', cd: 0, desc: 'Locked in the prototype.' },
  ],
};

// Pixel sprites as [x, y, w, h, color] rects on a 12x16 grid.
export type Px = [number, number, number, number, string];
export const HERO_SPRITES: Record<HeroId, Px[]> = {
  knight: [[5,0,2,1,'#d9534f'],[3,1,6,3,'#9aa8c4'],[5,2,4,1,'#2b2f3e'],[3,4,6,5,'#3d6fb4'],[3,7,6,1,'#d9a441'],[9,4,3,6,'#d9a441'],[10,5,1,4,'#8a5a1c'],[0,1,1,7,'#cfd6e4'],[0,7,3,1,'#8a5a1c'],[4,9,2,5,'#2d3a5c'],[7,9,2,5,'#2d3a5c'],[4,14,3,2,'#1c1f2e'],[7,14,3,2,'#1c1f2e']],
  mage: [[4,0,3,1,'#7a4bd1'],[3,1,5,1,'#7a4bd1'],[2,2,8,1,'#7a4bd1'],[4,3,4,2,'#e8b98a'],[3,5,6,9,'#5b3aa8'],[2,7,1,4,'#5b3aa8'],[3,13,6,1,'#f2b84b'],[10,2,1,13,'#8a5a1c'],[9,1,3,2,'#6fe0ff'],[4,14,4,2,'#2b2f3e']],
  healer: [[3,0,6,3,'#e9e2cf'],[5,2,3,2,'#e8b98a'],[3,4,6,9,'#3a8f6a'],[5,6,2,4,'#f2e9d8'],[4,7,4,1,'#f2e9d8'],[2,6,1,3,'#3a8f6a'],[9,6,2,3,'#d9a441'],[4,13,4,2,'#2b2f3e']],
};
