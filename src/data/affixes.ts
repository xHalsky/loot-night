import type { Stat } from '../core/state';

// Special affixes (docs/design/loot.md). At most one per item, replacing the random "of ..." suffix.
//   life:  a real-life rule changes while anyone in the party wears it (epic and legendary only).
//   cross: the wearer gets a stat bonus while something in real life is true (rare and up).
// Numbers are in tuning.ts (AFFIX_*); `when` is the condition id read by systems/affixes.ts.
export type LifeId = 'earplugs' | 'quick' | 'fiveMore' | 'excuses' | 'owl' | 'cans';
export type CrossId = 'headset' | 'caffeine' | 'spreadsheet' | 'library' | 'dogs' | 'sweet';
export interface LifeAffix { kind: 'life'; id: LifeId; suffix: string; desc: string }
export interface CrossAffix { kind: 'cross'; id: CrossId; suffix: string; when: string; stat?: Stat; desc: string }
export type SpecialAffix = LifeAffix | CrossAffix;

export const LIFE_AFFIXES: LifeAffix[] = [
  { kind: 'life', id: 'earplugs', suffix: 'of Peace', desc: 'Headset on, you still hear her steps in the hallway.' },
  { kind: 'life', id: 'quick', suffix: 'of Quick Fingers', desc: 'Alt-tab is {quick}% faster.' },
  { kind: 'life', id: 'fiveMore', suffix: 'of Five More Minutes', desc: 'Tiredness builds {tired}% slower.' },
  { kind: 'life', id: 'excuses', suffix: 'of Infinite Excuses', desc: 'Once a night, she buys your excuse: a catch becomes a pass (Mood +{excuse}).' },
  { kind: 'life', id: 'owl', suffix: 'of the Night Owl', desc: 'While she sleeps, your Noise wakes her {owl}% slower.' },
  { kind: 'life', id: 'cans', suffix: 'of Many Cans', desc: 'On a Snack run, the cans hide themselves.' },
];
export const CROSS_AFFIXES: CrossAffix[] = [
  { kind: 'cross', id: 'headset', suffix: 'of the Headset Hero', when: 'headset', stat: 'crit', desc: '+{n} Crit % while the headset is on.' },
  { kind: 'cross', id: 'caffeine', suffix: 'of Caffeine', when: 'boost', stat: 'speed', desc: '+{n} Speed while a Monster kicks in.' },
  { kind: 'cross', id: 'spreadsheet', suffix: 'of the Spreadsheet Warrior', when: 'excel', desc: '+{gold} gold per kill while Excel is up (overtime).' },
  { kind: 'cross', id: 'library', suffix: 'of the Library Voice', when: 'quiet', stat: 'atk', desc: '+{n} Attack while the Noise is under {quiet}.' },
  { kind: 'cross', id: 'dogs', suffix: 'of the Good Boy', when: 'dog', stat: 'luck', desc: '+{n} Luck for {dogSec} s after you pet the dog.' },
  { kind: 'cross', id: 'sweet', suffix: 'of the Sweet Talker', when: 'green', stat: 'atk', desc: '+{n} Attack while her Mood is green.' },
];
export const SPECIAL_BY_ID: Record<string, SpecialAffix> = Object.fromEntries([...LIFE_AFFIXES, ...CROSS_AFFIXES].map(a => [a.id, a]));
