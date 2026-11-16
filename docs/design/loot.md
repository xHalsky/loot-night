# Loot and the bag

## Now

**Drops.** A normal battle drops 1 item `BATTLE_DROP_CHANCE` (60%) of the time; bosses drop
`BOSS_DROPS`; elite floors guarantee a rare. Maps (`MAP_DROP_CHANCE`) and Phoenix Feathers
(`FEATHER_DROP_CHANCE`) also drop.

**Rarity.** Common, uncommon, rare, epic, legendary. Floor 1 weights `RARITY_WEIGHTS` (60/25/10/4/1),
shifted up each floor by `RARITY_SHIFT_PER_FLOOR`. Luck from Flow (`FLOW_LUCK`), green Mood
(`GREEN_MOOD_LUCK`) and full Zone (`ZONE_LUCK`) pushes it further. A pity counter guarantees an epic
after `PITY_EPIC` drops without one.

**Items** (`src/data/items.ts`). Slot, item level, rarity, 1 to 4 positive stats (rarity sets the count);
from rare up, one downside, so the bigger number is not automatically better. Names are jokes about
bills and desk life (Rusty Fork, Monster-Can Helm, Socks with Sandals, "of Five More Minutes").
Epics and legendaries drop **unidentified** until the Appraiser reveals them.

**Loot on the floor.** Drops land where each enemy fell (spread out when several share a spot) and
bounce once. Each shows a bundle with a gleam, an additive beam in its rarity colour (taller and wider
for better rarities) with a soft halo, a glow pool, rising sparkles and a pool of light in the darkness.
The front hero collects by walking over them; the party walks faster (75 px/s instead of 40) while
loot is on the floor. A collected item's bag slot flashes. Floor loot is swept into the bag when you
leave by portal or the floor ends, and goes on the corpse in a wipe.

**Bag.** `BAG_SIZE` (18) slots, 3 rows, plus Treasury slots. Icons by type, colour by rarity, sell
value in the corner, "?" for unidentified. When full, a popup offers swap or skip; the drop waits
`DROP_WAIT_SEC` of threat time, then is lost.

**Paper doll.** Hero portraits with HP/XP; click one to show it on the doll (helm on the head, armor on the
body, and so on, with faint icons for empty slots) and a stats line. Drag from the bag onto a slot or a
portrait to equip; drag off to unequip; right-click to equip on the selected hero. Hover tooltips show
stats and the comparison with what the selected hero wears.

**Lock.** Hover an item and press L: a padlock; it cannot be sold, salvaged, listed, dropped or
swapped out, and it never stays on the corpse.

**Auto-salvage.** A toggle in the bag header: while on, common and uncommon pickups turn straight into
scraps.

## Decisions

- **Players never buy gear**, in any build. Buying kills the thrill of drops. The auction house only sells.
- **Loot at the kill, not in a popup** (0.11, 0.13): the floor becomes the reward moment, Diablo-style.
- **Downsides from rare up** to avoid "bigger number wins" and give the comparison tooltip a job.
- Fewer drops after the first playtest (60% per battle) so each one is noticed.

## Planned

- Auto-salvage as a threshold (Off / Common / Uncommon / Rare), Reroll at the Salvage Forge,
  comparison totals, cross-system affixes, party sets: [synergy.md](synergy.md).
- Real-life affixes on epics and legendaries (Ring of Many Cans, Earplugs of Peace): campaign scope, #3.
