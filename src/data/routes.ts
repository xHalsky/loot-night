import type { MapKind } from '../core/state';
import type { CurioId } from './curios';
import { T } from '../config/tuning';
import { BLESSINGS } from './blessings';

// The route choice on the floor map (#52, 1.5; docs/design/dungeon.md). A path card shows at most one feature (what
// stands on that floor) and at most one condition (what changes on the whole floor; every condition pays).
// Ids match the renderer's icons and texts (src/render/page/pathicons.js, FEAT and COND); numbers in tuning.ts.
export type FeatureId = 'shrine' | 'pilgrim' | 'cart' | 'altar' | 'moonwell' | 'circle' | 'chest' | 'elite' | 'den';
export type ConditionId = 'silent' | 'haunted' | 'flooded' | 'dark' | 'swarm' | 'cursed';
/** A feature puts one interactable on its floor (it replaces one of the random curios), or a map item's floor. */
export const FEATURES: Record<FeatureId, { curio?: CurioId; map?: MapKind }> = {
  shrine: { curio: 'shrine' }, pilgrim: { curio: 'pilgrim' }, cart: { curio: 'supply' }, altar: { curio: 'altar' },
  moonwell: { curio: 'moonwell' }, circle: { curio: 'ritual' }, chest: { curio: 'strongbox' }, elite: { map: 'elite' }, den: { map: 'goblin' },
};
export const CONDITIONS: Record<ConditionId, { danger: number; map?: MapKind }> = {
  silent: { danger: 1 }, haunted: { danger: 1 }, flooded: { danger: 2 }, dark: { danger: 2 }, swarm: { danger: 2 }, cursed: { danger: 3, map: 'cursed' },
};
/** A map item from the bag as a path card: what it pays and costs, in the margin. */
export const MAP_CARD: Record<MapKind, { pays: string; cost: string }> = {
  elite: { pays: 'A guaranteed rare', cost: 'A harder pack' },
  shrine: { pays: 'Full heal, the downed revived', cost: 'No loot on that floor' },
  vault: { pays: `No fight. ${T.VAULT_DROPS} items`, cost: `Noise +${T.NOISE_VAULT}` },
  cursed: { pays: 'Every drop one rarity better', cost: 'Your heals do half' },
  goblin: { pays: 'A goblin after every fight', cost: 'Catching one is loud' },
};
const pct = (v: number) => `${Math.round(v * 100)}%`;
/** What the floor map's margin note says (the renderer's FEAT and COND are replaced by these, so the numbers come
 *  from tuning.ts). A feature with a blessing: "<act> for a blessing:", + what you get, - what it costs. */
const bl = (id: keyof typeof BLESSINGS, name: string, act: string) => ({ name, act, bless: BLESSINGS[id].got, cost: BLESSINGS[id].cost.replace('The bell rang', 'The bell rings').replace('Flow dropped', 'Flow drops') });
export const FEATURE_TEXT: Record<FeatureId, { name: string; act?: string; bless?: string; cost?: string; line?: string }> = {
  shrine: bl('shrine', 'Wayside Shrine', 'Pray'), pilgrim: bl('pilgrim', 'Pilgrim', 'Swear his oath'), cart: bl('supply', 'Supply Cart', 'Eat the rations'),
  altar: bl('altar', 'Blood Altar', 'Bleed on it'), moonwell: bl('moonwell', 'Moonwell', 'Drink'), circle: bl('ritual', 'Ritual Circle', 'Join the chant'),
  chest: { name: 'Locked Chest', line: 'Pick the lock (quiet, slow) or smash it (Noise).' },
  elite: { name: 'Elite Pack', line: 'A harder pack. A guaranteed rare.' },
  den: { name: 'Goblin Den', line: 'A loot goblin after every fight. Catching one is loud.' },
};
export const CONDITION_TEXT: Record<ConditionId, { name: string; pays: string; cost: string; danger: number }> = {
  silent: { name: 'Silent Halls', pays: 'Crits and skills make no Noise', cost: `Drops -${pct(T.COND_SILENT_DROPS)}`, danger: CONDITIONS.silent.danger },
  haunted: { name: 'Haunted', pays: `Ultimates charge ${pct(T.COND_HAUNTED_ULT)} faster`, cost: `Every kill makes Noise +${T.COND_HAUNTED_NOISE}`, danger: CONDITIONS.haunted.danger },
  flooded: { name: 'Flooded', pays: `Drops +${pct(T.COND_FLOODED_DROPS)}`, cost: `Cooldowns +${pct(T.COND_FLOODED_CD)}`, danger: CONDITIONS.flooded.danger },
  dark: { name: 'Pitch Dark', pays: `Gold +${pct(T.COND_DARK_GOLD)}`, cost: `Enemies hit ${pct(T.COND_DARK_ATK)} harder`, danger: CONDITIONS.dark.danger },
  swarm: { name: 'Swarming', pays: `Souls +${pct(T.COND_SWARM_SOULS)}`, cost: `Packs ${pct(T.COND_SWARM_PACK)} bigger`, danger: CONDITIONS.swarm.danger },
  cursed: { name: 'Cursed', pays: 'Every drop one rarity better', cost: T.CURSED_HEAL === 0.5 ? 'Your heals do half' : `Your heals do ${pct(T.CURSED_HEAL)}`, danger: CONDITIONS.cursed.danger },
};
/** One path to the next floor. map: the bag entry it uses up (never taken for you). */
export interface PathCard { feat?: FeatureId; cond?: ConditionId; map?: string; mapKind?: MapKind; boss?: boolean }
