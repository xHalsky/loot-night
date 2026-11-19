import type { HeroId, Stat } from '../core/state';

/** power: damage or heal multiplier of attack (Rally, Revive: a share, shown as {pct}); flat: added heal;
 *  dur: seconds of an effect; hits: number of hits. use: when to fire it. Marks: docs/design/dungeon.md. */
export interface AbilityDef { name: string; short: string; cd: number; desc: string; tip?: string; power?: number; flat?: number; dur?: number; hits?: number; use?: string }   // tip: the tooltip, one line (#43); desc: the full rule
/** The party's in-game names (#44). Knightenstein is you; Magoo and Healero are your friends' characters
 *  (Danny and Mike on the phone). Party and guild chat use these names, as an MMO would. */
export const HERO_NAME: Record<HeroId, string> = { knight: 'Knightenstein', mage: 'Magoo', healer: 'Healero' };
export const HERO_ROLE: Record<HeroId, { role: string; auto: string }> = {
  knight: { role: 'Tank. Stands in front, carries the torch, picks up loot.', auto: 'Slashes the front enemy.' },
  mage: { role: 'Damage. Fragile, hits hard.', auto: 'Bolts the weakest enemy (finishes kills).' },
  healer: { role: 'Support. Keeps everyone alive.', auto: 'Heals an ally under 60% HP, otherwise smites the front enemy and Judges it (your skill hits on it heal).' },
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
    { name: 'Taunt', short: 'TAUNT', cd: 10, dur: 5, tip: 'All enemies hit the knight for {dur} s and get [taunted]Taunted[/].', desc: 'All enemies attack the knight for {dur} s and are [taunted]Taunted[/]. SMASH and EXECUTE hit only him.', use: 'The mage or healer is low, or a boss winds up SMASH or EXECUTE. Then Ward: Taunted hits bounce back.' },
    { name: 'Bash', short: 'BASH', cd: 8, power: 2, tip: 'Hits the front enemy for {dmg}, stuns and [stagger]Staggers[/] it. Interrupts SMASH.', desc: 'Hits the front enemy (a winding-up boss or a shield first) for {dmg}, breaks its shield, stuns it for a turn and [stagger]Staggers[/] it. A [chill]Chilled[/] enemy shatters for x{shatter}. Interrupts SMASH (then the boss braces: the next one can\'t be interrupted).', use: 'A boss winds up SMASH, a shield is up, or right after Frost.' },
    { name: 'Rally', short: 'RALLY', cd: 16, power: 0.25, dur: 6, tip: 'Every hero acts now; +{pct}% damage for {dur} s.', desc: 'Every hero acts right now, and the party deals +{pct}% damage for {dur} s.', use: 'Before a combo, or on a [judged]Judged[/] enemy (three hits, three heals).' },
    { name: 'Ultimate', short: 'ULT', cd: 0, desc: 'Later nights.' },
  ],
  mage: [
    { name: 'Bolt', short: 'BOLT', cd: 0, desc: 'Auto attack on the weakest enemy.' },
    { name: 'Fire', short: 'FIRE', cd: 9, power: 1, tip: 'Hits every enemy for {dmg}. [stagger]Staggered[/] ones take x{stagger}.', desc: 'Hits every enemy for {dmg}, every imp in a swarm too. [stagger]Staggered[/] enemies take x{stagger}.', use: 'Three enemies or a swarm are up, or right after Bash.' },
    { name: 'Frost', short: 'FROST', cd: 7, power: 2.6, tip: 'Hits the front enemy for {dmg} and [chill]Chills[/] it: Bash shatters it.', desc: 'Hits the front enemy (a healer first) for {dmg} and [chill]Chills[/] it.', use: 'One big target, like a boss. Then Bash shatters it.' },
    { name: 'Storm', short: 'STORM', cd: 12, power: 0.6, hits: 6, tip: '{hits} bolts at random enemies, {dmg} each.', desc: '{hits} lightning bolts at random enemies, {dmg} each.', use: 'A swarm (each bolt takes an imp), or a [judged]Judged[/] enemy: every bolt that hits it heals.' },
    { name: 'Ultimate', short: 'ULT', cd: 0, desc: 'Later nights.' },
  ],
  healer: [
    { name: 'Smite', short: 'SMITE', cd: 0, tip: 'Auto: heals an ally under 60% HP, else [judged]Judges[/] the front enemy.', desc: 'Auto: heals an ally under 60% HP, else smites and [judged]Judges[/] the front enemy.' },
    { name: 'Mend', short: 'MEND', cd: 10, power: 2.2, flat: 14, desc: 'Heals every hero for {heal}.', use: 'After a big hit, or before you look away.' },
    { name: 'Ward', short: 'WARD', cd: 14, dur: 6, power: 0.6, tip: 'The party takes 40% less damage for {dur} s. [taunted]Taunted[/] enemies take {reflect}% back.', desc: 'Party takes 40% less damage for {dur} s. Halves SMASH and EXECUTE. [taunted]Taunted[/] enemies take {reflect}% of their hits back.', use: 'A braced SMASH, an EXECUTE, a big pack, or right after Taunt.' },
    { name: 'Revive', short: 'REVIVE', cd: 30, power: 0.5, tip: 'Brings a downed hero back at {pct}% HP.', desc: 'Brings a downed hero back at {pct}% HP. Nobody down: heals the most hurt hero for {pct}% of their max HP.', use: 'Someone is down, or about to be.' },
    { name: 'Ultimate', short: 'ULT', cd: 0, desc: 'Later nights.' },
  ],
};

// Pixel sprites as [x, y, w, h, color] rects on a 12x16 grid.
export type Px = [number, number, number, number, string];
export const HERO_SPRITES: Record<HeroId, Px[]> = {
  knight: [[5,0,2,1,'#d9534f'],[3,1,6,3,'#9aa8c4'],[5,2,4,1,'#2b2f3e'],[3,4,6,5,'#3d6fb4'],[3,7,6,1,'#d9a441'],[9,4,3,6,'#d9a441'],[10,5,1,4,'#8a5a1c'],[0,1,1,7,'#cfd6e4'],[0,7,3,1,'#8a5a1c'],[4,9,2,5,'#2d3a5c'],[7,9,2,5,'#2d3a5c'],[4,14,3,2,'#1c1f2e'],[7,14,3,2,'#1c1f2e']],
  mage: [[4,0,3,1,'#7a4bd1'],[3,1,5,1,'#7a4bd1'],[2,2,8,1,'#7a4bd1'],[4,3,4,2,'#e8b98a'],[3,5,6,9,'#5b3aa8'],[2,7,1,4,'#5b3aa8'],[3,13,6,1,'#f2b84b'],[10,2,1,13,'#8a5a1c'],[9,1,3,2,'#6fe0ff'],[4,14,4,2,'#2b2f3e']],
  healer: [[3,0,6,3,'#e9e2cf'],[5,2,3,2,'#e8b98a'],[3,4,6,9,'#3a8f6a'],[5,6,2,4,'#f2e9d8'],[4,7,4,1,'#f2e9d8'],[2,6,1,3,'#3a8f6a'],[9,6,2,3,'#d9a441'],[4,13,4,2,'#2b2f3e']],
};
