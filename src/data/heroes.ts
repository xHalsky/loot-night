import { T } from '../config/tuning';
import type { HeroId, Stat } from '../core/state';

/** power: damage or heal multiplier of attack (a share where shown as {pct}); flat: added heal;
 *  dur: seconds of an effect; hits: number of hits. use: when to fire it. Marks: docs/design/dungeon.md. */
export interface AbilityDef { name: string; short: string; cd: number; desc: string; tip?: string; power?: number; flat?: number; dur?: number; hits?: number; use?: string; ult?: boolean }   // ult: the ultimate (charged, never on cooldown)   // tip: the tooltip, one line (#43); desc: the full rule
/** The party's in-game names (#44). Knightenstein is you; Magoo and Healero are your friends' characters
 *  (Danny and Mike on the phone). Party and guild chat use these names, as an MMO would. */
export const HERO_NAME: Record<HeroId, string> = { knight: 'Knightenstein', rogue: 'Garrote', mage: 'Magoo', healer: 'Healero' };
export const HERO_ROLE: Record<HeroId, { role: string; auto: string }> = {
  knight: { role: 'Tank. Stands in front, carries the torch, picks up loot.', auto: 'Slashes the front enemy.' },
  rogue: { role: 'Damage. Crits, smokes, and picks up the loot.', auto: 'Stabs the front enemy.' },
  mage: { role: 'Damage. Fragile, hits hard.', auto: 'Bolts the weakest enemy (finishes kills).' },
  healer: { role: 'Support. Keeps everyone alive.', auto: 'Heals an ally under 60% HP, otherwise smites the front enemy and Judges it (your skill hits on it heal).' },
};

/** Home ranks (#52, 1.6): outside them a hero deals and heals OUT_OF_RANK_MULT. Rank 1 is the front. Data per hero, so
 *  tree nodes can change them later ("Fire at full power from rank 2"). */
export const HOME_RANKS: Record<HeroId, [number, number]> = { knight: [1, 2], rogue: [1, 3], mage: [3, 4], healer: [2, 4] };
/** The marching order a party starts in: night 1 has three heroes; Garrote joins second in line. */
export const DEFAULT_ORDER: HeroId[][] = [['knight', 'healer', 'mage'], ['knight', 'rogue', 'mage', 'healer']];
/** Auras (#52, 1.6): what each hero gives his neighbour (back: the one behind him; front: the one in front). */
export const AURAS: Record<HeroId, { back?: boolean; front?: boolean; name: string; gives: string }> = {
  knight: { back: true, name: 'Shield wall', gives: `takes ${Math.round(T.AURA_KNIGHT_TAKEN * 100)}% less damage` },
  rogue: { front: true, name: 'Keen eye', gives: `gets +${T.AURA_ROGUE_CRIT}% crit` },
  mage: { front: true, name: 'Haste', gives: `gets ${Math.round(T.AURA_MAGE_CD * 100)}% shorter cooldowns` },
  healer: { front: true, back: true, name: 'Blessing', gives: `regenerates ${Math.round(T.AURA_PRIEST_REGEN * 100)}% HP per second` },
};

/** A hero's role line; from night 2 Garrote picks up the loot instead of the Knight (#52, 1.7). */
export function heroRole(id: HeroId, rogueIn = true) {
  const r = HERO_ROLE[id];
  return id === 'knight' && rogueIn ? { ...r, role: 'Tank. Stands in front and carries the torch.' } : r;
}

export const HERO_BASE: Record<HeroId, Record<Stat, number>> = {
  knight: { hp: 130, atk: 9, armor: 6, speed: 9, crit: 5, luck: 0 },
  rogue: { hp: 85, atk: 12, armor: 3, speed: 13, crit: 12, luck: 5 },
  mage: { hp: 75, atk: 15, armor: 2, speed: 11, crit: 8, luck: 0 },
  healer: { hp: 90, atk: 7, armor: 3, speed: 10, crit: 5, luck: 0 },
};

export const HERO_COLORS: Record<HeroId, string> = { knight: '#3d6fb4', rogue: '#c16229', mage: '#5b3aa8', healer: '#3a8f6a' };   // Garrote: ember (grid doc §4b)

// Hotkeys per hero, one per ability slot (slot 0 = auto attack). Three slots (#52, decisions 2026-11-20): two skills
// and the ultimate on the third key; 4, R and F stay dark.
export const HOTKEYS: Record<HeroId, string[]> = {
  knight: ['', '1', '2', '3'],   // slot 0 is the auto attack: always on, no key
  rogue: ['', 'z', 'x', 'c'],
  mage: ['', 'q', 'w', 'e'],
  healer: ['', 'a', 's', 'd'],
};
/** The ultimate's slot (charged in fights, always manual). */
export const ULT_SLOT = 3;

export const ABILITIES: Record<HeroId, AbilityDef[]> = {
  knight: [
    { name: 'Slash', short: 'SLASH', cd: 0, desc: 'Auto attack on the front enemy.' },
    { name: 'Taunt', short: 'TAUNT', cd: 10, dur: 5, tip: 'All enemies hit the knight for {dur} s and get [taunted]Taunted[/].', desc: 'All enemies attack the knight for {dur} s and are [taunted]Taunted[/]. SMASH and EXECUTE hit only him.', use: 'The mage or healer is low, or a boss winds up SMASH or EXECUTE. Then Ward: Taunted hits bounce back.' },
    { name: 'Bash', short: 'BASH', cd: 8, power: 2, tip: 'Hits the front enemy for {dmg}, stuns and [stagger]Staggers[/] it. Interrupts SMASH.', desc: 'Hits the front enemy (a winding-up boss or a shield first) for {dmg}, breaks its shield, stuns it for a turn and [stagger]Staggers[/] it. A [chill]Chilled[/] enemy shatters for x{shatter}. Interrupts SMASH (then the boss braces: the next one can\'t be interrupted).', use: 'A boss winds up SMASH, a shield is up, or right after Frost.' },
    { name: 'Last Stand', short: 'LAST STAND', cd: 0, dur: T.LAST_STAND_SEC, ult: true, tip: 'Ultimate: for {dur} s no hero can drop below 1 HP.', desc: 'Ultimate. For {dur} s no hero can drop below 1 HP. Charges during fights.', use: 'A SMASH or an EXECUTE you can\'t answer, or the party is about to fall.' },
  ],
  rogue: [
    { name: 'Stab', short: 'STAB', cd: 0, desc: 'Auto attack on the front enemy.' },
    { name: 'Backstab', short: 'BACKSTAB', cd: 8, power: 3, tip: 'Hits the front enemy for {dmg}. [stagger]Staggered[/] ones take x{backstab}.', desc: 'Hits the front enemy for {dmg}. A [stagger]Staggered[/] enemy takes x{backstab}.', use: 'Right after Bash.' },
    { name: 'Smoke Bomb', short: 'SMOKE BOMB', cd: 14, dur: T.SMOKE_SEC, tip: 'Enemies miss half their attacks for {dur} s.', desc: 'For {dur} s enemies miss half their attacks. Big moves still land.', use: 'A big pack, or before you look away.' },
    { name: 'Heist', short: 'HEIST', cd: 0, dur: T.HEIST_SEC, ult: true, tip: 'Ultimate: for {dur} s every kill drops an item.', desc: 'Ultimate. For {dur} s every kill drops an item. Charges during fights.', use: 'A big pack about to die.' },
  ],
  mage: [
    { name: 'Bolt', short: 'BOLT', cd: 0, desc: 'Auto attack on the weakest enemy.' },
    { name: 'Fire', short: 'FIRE', cd: 9, power: 1, tip: 'Hits every enemy for {dmg}. [stagger]Staggered[/] ones take x{stagger}.', desc: 'Hits every enemy for {dmg}, every imp in a swarm too. [stagger]Staggered[/] enemies take x{stagger}.', use: 'Three enemies or a swarm are up, or right after Bash.' },
    { name: 'Frost', short: 'FROST', cd: 7, power: 2.6, tip: 'Hits the front enemy for {dmg} and [chill]Chills[/] it: Bash shatters it.', desc: 'Hits the front enemy (a healer first) for {dmg} and [chill]Chills[/] it.', use: 'One big target, like a boss. Then Bash shatters it.' },
    { name: 'Cataclysm', short: 'CATACLYSM', cd: 0, power: T.CATACLYSM_POWER, ult: true, tip: 'Ultimate: hits every enemy for {dmg}. Staggered and Chilled ones take double.', desc: 'Ultimate. Hits every enemy for {dmg}; [stagger]Staggered[/] and [chill]Chilled[/] enemies take double. Charges during fights.', use: 'A big pack, or right after Bash and Frost.' },
  ],
  healer: [
    { name: 'Smite', short: 'SMITE', cd: 0, tip: 'Auto: heals an ally under 60% HP, else [judged]Judges[/] the front enemy.', desc: 'Auto: heals an ally under 60% HP, else smites and [judged]Judges[/] the front enemy.' },
    { name: 'Mend', short: 'MEND', cd: 10, power: 2.2, flat: 14, desc: 'Heals every hero for {heal}.', use: 'After a big hit, or before you look away.' },
    { name: 'Ward', short: 'WARD', cd: 14, dur: 6, power: 0.6, tip: 'The party takes 40% less damage for {dur} s. [taunted]Taunted[/] enemies take {reflect}% back.', desc: 'Party takes 40% less damage for {dur} s. Halves SMASH and EXECUTE. [taunted]Taunted[/] enemies take {reflect}% of their hits back.', use: 'A braced SMASH, an EXECUTE, a big pack, or right after Taunt.' },
    { name: 'Miracle', short: 'MIRACLE', cd: 0, ult: true, tip: 'Ultimate: revives every downed hero and fully heals the party.', desc: 'Ultimate. Revives every downed hero and fully heals the party. Charges during fights.', use: 'Someone is down, or everyone is low.' },
  ],
};

// Pixel sprites as [x, y, w, h, color] rects on a 12x16 grid.
export type Px = [number, number, number, number, string];
