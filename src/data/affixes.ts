import type { Stat } from '../core/state';

// Special affixes (docs/design/loot.md). At most one per item, replacing the random "of ..." suffix.
//   life:  a real-life rule changes while anyone in the party wears it (epic and legendary only).
//   cross: the wearer gets a stat bonus while something in real life is true (rare and up).
// Numbers are in tuning.ts (AFFIX_*); `when` is the condition id read by systems/affixes.ts.
export type LifeId = 'earplugs' | 'quick' | 'fiveMore' | 'excuses' | 'owl' | 'cans';
export type CrossId = 'headset' | 'caffeine' | 'spreadsheet' | 'library' | 'dogs' | 'sweet' | 'nightShift' | 'redEyes' | 'secondWind' | 'dawnChaser';
export interface LifeAffix { kind: 'life'; id: LifeId; suffix: string; desc: string }
export interface CrossAffix { kind: 'cross'; id: CrossId; suffix: string; when: string; stat?: Stat; desc: string }
export type SpecialAffix = LifeAffix | CrossAffix;

// Suffixes are one plain fantasy word (#44); the desc is the rule, in plain words.
export const LIFE_AFFIXES: LifeAffix[] = [
  { kind: 'life', id: 'earplugs', suffix: 'of Vigilance', desc: 'Headset on, you still hear her steps in the hallway.' },
  { kind: 'life', id: 'quick', suffix: 'of Stealth', desc: 'Alt-tab is {quick}% faster.' },
  { kind: 'life', id: 'fiveMore', suffix: 'of Vigor', desc: 'Tiredness builds {tired}% slower.' },
  { kind: 'life', id: 'excuses', suffix: 'of Charm', desc: 'Once a night, a catch becomes a pass (Mood +{excuse}).' },
  { kind: 'life', id: 'owl', suffix: 'of Slumber', desc: 'While she sleeps, your Noise wakes her {owl}% slower.' },
  { kind: 'life', id: 'cans', suffix: 'of Hiding', desc: 'On a Snack run, your cans hide themselves.' },
];
export const CROSS_AFFIXES: CrossAffix[] = [
  { kind: 'cross', id: 'headset', suffix: 'of Focus', when: 'headset', stat: 'crit', desc: '+{n} Crit % while the headset is on.' },
  { kind: 'cross', id: 'caffeine', suffix: 'of Frenzy', when: 'boost', stat: 'speed', desc: '+{n} Speed while a Goblin Fuel kicks in.' },
  { kind: 'cross', id: 'spreadsheet', suffix: 'of Greed', when: 'excel', desc: '+{gold} gold per kill while Excel is up.' },
  { kind: 'cross', id: 'library', suffix: 'of Silence', when: 'quiet', stat: 'atk', desc: '+{n} Attack while the Noise is under {quiet}.' },
  { kind: 'cross', id: 'dogs', suffix: 'of the Wolf', when: 'dog', stat: 'luck', desc: '+{n} Luck for {dogSec} s after you pet the dog.' },
  { kind: 'cross', id: 'sweet', suffix: 'of Devotion', when: 'green', stat: 'atk', desc: '+{n} Attack while her Mood is green.' },
];
// Insomniac affixes: cross-system, roll only during the Witching Hour (after 01:00), and pay for staying up.
export const INSOMNIAC_AFFIXES: CrossAffix[] = [
  { kind: 'cross', id: 'nightShift', suffix: 'of Midnight', when: 'late', stat: 'atk', desc: '+{n} Attack after 01:00.' },
  { kind: 'cross', id: 'redEyes', suffix: 'of Madness', when: 'drowsy', stat: 'crit', desc: '+{n} Crit % while you are Tired 70+.' },
  { kind: 'cross', id: 'secondWind', suffix: 'of Twilight', when: 'late', stat: 'hp', desc: '+{n} Max HP after 01:00.' },
  { kind: 'cross', id: 'dawnChaser', suffix: 'of Dawn', when: 'dawn', stat: 'luck', desc: '+{n} Luck after 03:00.' },
];
export const SPECIAL_BY_ID: Record<string, SpecialAffix> = Object.fromEntries([...LIFE_AFFIXES, ...CROSS_AFFIXES, ...INSOMNIAC_AFFIXES].map(a => [a.id, a]));
