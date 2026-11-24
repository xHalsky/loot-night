import { T } from '../config/tuning';

// Run blessings (#52, 1.5b; docs/design/dungeon.md): curios are their only source. A blessing lasts until the run
// ends (banked or wiped), stacks, and every one has a cost that reaches real life or the run. Names are placeholders.
export type BlessingId = 'shrine' | 'pilgrim' | 'supply' | 'potion' | 'altar' | 'moonwell' | 'ritual';
export interface BlessingDef { id: BlessingId; name: string; icon: string; got: string; cost: string }
export const BLESSINGS: Record<BlessingId, BlessingDef> = {
  shrine: { id: 'shrine', name: 'Wayside Shrine', icon: 'shrine', got: `+${pct(T.BLESS_SHRINE_DMG)} damage`, cost: `The bell rang: Noise +${T.BLESS_SHRINE_NOISE}` },
  pilgrim: { id: 'pilgrim', name: "Pilgrim's oath", icon: 'pilgrim', got: `Cooldowns -${pct(T.BLESS_PILGRIM_CD)}`, cost: 'No town portal until the next boss is dead' },
  supply: { id: 'supply', name: 'Rations', icon: 'cart', got: `+${pct(T.BLESS_SUPPLY_DROPS)} item drops`, cost: `Party max HP -${pct(T.BLESS_SUPPLY_HP)}` },
  potion: { id: 'potion', name: 'Potions', icon: 'potion', got: `+${pct(T.BLESS_POTION_HEAL)} healing`, cost: `Noise +${T.CURIO_KICK_NOISE} (the cart rattled)` },
  altar: { id: 'altar', name: 'Blood pact', icon: 'altar', got: `+${T.BLESS_ALTAR_CRIT}% crit`, cost: `Heroes lose ${pct(T.BLESS_ALTAR_DRAIN)} HP a second outside fights` },
  moonwell: { id: 'moonwell', name: 'Moonwater', icon: 'moonwell', got: `Ultimates charge ${pct(T.BLESS_MOON_ULT)} faster`, cost: 'Flow dropped to x1' },
  ritual: { id: 'ritual', name: 'The chant', icon: 'circle', got: `Souls +${pct(T.BLESS_RITUAL_SOULS)}`, cost: `Enemies +${pct(T.BLESS_RITUAL_HP)} HP` },
};
function pct(v: number) { return `${Math.round(v * 100)}%`; }
