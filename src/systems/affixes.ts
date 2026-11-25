import { T } from '../config/tuning';
import { on } from './week';
import { S, type Hero, type Item, type Stat } from '../core/state';
import { SPECIAL_BY_ID, type LifeId, type CrossAffix } from '../data/affixes';
import { moodZone } from './meters';

// Special affixes (docs/design/loot.md, data/affixes.ts).
const worn = (): Item[] => S.g.heroes.flatMap(h => Object.values(h.gear)).filter((it): it is Item => !!it && it.identified);

/** A real-life affix is on: anyone in the party wears an identified item with it. */
export const hasLife = (id: LifeId) => worn().some(it => it.special === id);

/** The Witching Hour: after 01:00 (docs/design/synergy.md). */
export const isWitching = () => !!S.g.night && on('witching') && S.g.night.clock >= T.WITCHING_FROM;   // from Friday (#56)

/** Whether a cross-system affix's real-life condition holds right now. */
export function crossActive(a: CrossAffix): boolean {
  const n = S.g.night;
  if (!n) return false;
  switch (a.when) {
    case 'headset': return n.headset;
    case 'boost': return n.boost > 0;
    case 'excel': return n.monitor === 'excel';
    case 'quiet': return n.noise < T.AFFIX_QUIET_NOISE;
    case 'dog': return n.goodBoy > 0;
    case 'green': return moodZone(n.mood) === 'green';
    case 'late': return isWitching();
    case 'drowsy': return n.tired >= T.TIRED_SLUGGISH;
    case 'dawn': return n.clock >= T.DAWN_CHASER_FROM;
  }
  return false;
}

/** Cross-system stat bonus on one item for one stat, if its condition holds now. */
export function crossBonus(it: Item | undefined, stat: Stat): number {
  if (!it || !it.identified || !it.special) return 0;
  const a = SPECIAL_BY_ID[it.special];
  return a?.kind === 'cross' && a.stat === stat && crossActive(a) ? it.specialAmt ?? 0 : 0;
}

/** Spreadsheet Warrior: overtime gold per kill while Excel is up, summed over the party. */
export function overtimeGold(): number {
  const n = S.g.night;
  if (!n || n.monitor !== 'excel') return 0;
  return worn().filter(it => it.special === 'spreadsheet').reduce((s, it) => s + (it.specialAmt ?? 0), 0);
}

/** The text of an item's special affix, numbers filled in. */
export function specialText(it: Item): { text: string; life: boolean; active: boolean } | null {
  if (!it.special) return null;
  const a = SPECIAL_BY_ID[it.special];
  if (!a) return null;
  const text = a.desc.replace('{n}', String(it.specialAmt ?? 0)).replace('{gold}', String(it.specialAmt ?? 0))
    .replace('{quick}', String(Math.round(T.AFFIX_QUICK * 100))).replace('{tired}', String(Math.round(T.AFFIX_TIRED * 100)))
    .replace('{owl}', String(Math.round(T.AFFIX_OWL * 100))).replace('{excuse}', String(T.AFFIX_EXCUSE_MOOD))
    .replace('{quiet}', String(T.AFFIX_QUIET_NOISE)).replace('{dogSec}', String(T.AFFIX_DOG_SEC));
  return { text, life: a.kind === 'life', active: a.kind === 'life' || crossActive(a) };
}
export type { Hero };
