import type { FeatureId, ConditionId } from './routes';
import type { MapKind } from '../core/state';

// The floors' names on the floor map (#147, Paweł): in the world's lore (Age of Judgment: the iron angels came down
// burning, the world is built on their bodies; the crypts under Ravenhold go down through the Shadow Crypt, the
// Ossuary, the Iron Saint and the Brood), and from what is on the floor: its condition gives the word that leads, its
// feature the place; a plain floor is named for its depth. Short, so a card's title row holds it beside its icons:
// at most 15 letters, and a short form (the place alone) when the row is tighter. Fixed by the floor and what is on
// it, so a card keeps its name while you look. Plain fantasy words, one or two (CLAUDE.md conventions).

/** The word a condition leads with. */
const COND_WORD: Record<ConditionId, string> = {
  silent: 'Hushed', haunted: 'Haunted', flooded: 'Drowned', dark: 'Unlit', swarm: 'Teeming', cursed: 'Cursed',
};
/** The place a feature makes of a floor, with a condition (short) and alone (its own name). */
const FEAT_PLACE: Record<FeatureId, { short: string; full: string }> = {
  shrine: { short: 'Chapel', full: 'Ash Chapel' },          // a wayside shrine of the fallen
  pilgrim: { short: 'Way', full: "Pilgrim's Way" },          // the oath-sworn walk down
  cart: { short: 'Camp', full: 'Supply Camp' },            // the rations cart
  altar: { short: 'Altar', full: 'Red Altar' },             // the blood pact
  moonwell: { short: 'Well', full: 'Moonlit Well' },        // its water
  circle: { short: 'Ring', full: 'Chanting Ring' },          // the ritual circle
  chest: { short: 'Coffer', full: 'Sealed Coffer' },         // the locked chest
  elite: { short: 'Keep', full: 'Iron Keep' },              // the elite pack's hold
  den: { short: 'Warren', full: 'Goblin Warren' },          // the goblins'
};
/** The depths (aoj-world §8): five places each, a plain floor named for its depth. */
const DEPTH_PLACE: string[][] = [
  ['Nave', 'Crypt', 'Chancel', 'Narthex', 'Tombs'],          // Shadow Crypt, 1 to 5 (stone)
  ['Ossuary', 'Charnel', 'Barrow', 'Boneway', 'Cairn'],      // the Ossuary, 6 to 10 (umber)
  ['Ribcage', 'Forge', 'Spine', 'Halo', 'Wings'],            // the Iron Saint, 11 to 15 (the angel's body)
  ['Nest', 'Hive', 'Brood', 'Roots', 'Hatch'],               // the Brood, 16 and down
];
/** What leads a plain floor's name: the judgment and the fallen angels. */
const LORE_WORD = ['Fallen', 'Ashen', 'Broken', 'Weeping', 'Judged', 'Sunken', 'Hollow', 'Iron'];
/** A map item's floor (the Treasure Vault, ...). */
const MAP_PLACE: Record<MapKind, string> = {
  vault: 'Sealed Vault', elite: 'Iron Keep', shrine: "Saint's Font", cursed: 'Accursed Deep', goblin: 'Goblin Warren',
};
/** A boss floor: its keeper's hall. */
const BOSS_PLACE: Record<string, string> = { bailiff: "Gaoler's Cells", shark: 'Bell Tower', landlord: 'Judgment Seat' };

const depthOf = (floor: number) => Math.min(DEPTH_PLACE.length - 1, Math.floor((Math.max(1, floor) - 1) / 5));
// a fixed pick: the same floor and contents always give the same word
const fix = (floor: number, salt: number, n: number) => (((floor * 2654435761 + salt * 40503) >>> 0) % 9973) % n;

export interface FloorName { name: string; short: string }

/** A floor's name from what is on it (#147). */
export function floorName(floor: number, o: { feat?: FeatureId; cond?: ConditionId; map?: MapKind; boss?: string } = {}, k = 0): FloorName {
  const places = DEPTH_PLACE[depthOf(floor)], depth = places[fix(floor, 1 + k, places.length)];   // k: the card, so two on a floor differ
  if (o.boss) { const p = BOSS_PLACE[o.boss] ?? depth; return { name: p, short: p }; }
  if (o.map && MAP_PLACE[o.map]) return { name: MAP_PLACE[o.map], short: MAP_PLACE[o.map].split(' ').pop()! };
  if (o.feat && o.cond) { const p = FEAT_PLACE[o.feat]; return { name: `${COND_WORD[o.cond]} ${p.short}`, short: p.short }; }
  if (o.feat) { const p = FEAT_PLACE[o.feat]; return { name: p.full, short: p.short }; }
  if (o.cond) return { name: `${COND_WORD[o.cond]} ${depth}`, short: depth };
  return { name: `${LORE_WORD[fix(floor, 7 + k, LORE_WORD.length)]} ${depth}`, short: depth };
}
