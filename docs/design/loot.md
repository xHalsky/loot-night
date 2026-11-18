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

**Special affixes** (`src/data/affixes.ts`, `src/systems/affixes.ts`). At most one per item; it replaces the
random "of ..." name suffix, so the name says what it does. Rolled per rarity (`AFFIX_LIFE_CHANCE`,
`AFFIX_CROSS_CHANCE`): rares 30% cross-system; epics 35% real-life, 45% cross-system; legendaries 65% / 35%.
Hidden until the item is identified. Tooltip line in its own colour: pink for real life, teal for
cross-system (dimmed and marked Inactive while its condition is false).

*Real-life* (epic and legendary): a real-life rule changes while anyone in the party wears it. Loot that
changes how you handle her.

| Suffix | Effect |
|---|---|
| of Peace | Headset on, you still hear her steps in the hallway (sound and the last-heard line) |
| of Quick Fingers | Alt-tab `AFFIX_QUICK` (30%) faster |
| of Five More Minutes | Tiredness builds `AFFIX_TIRED` (20%) slower |
| of Infinite Excuses | Once a night a catch becomes a pass, Mood +`AFFIX_EXCUSE_MOOD` |
| of the Night Owl | While she sleeps, your Noise wakes her `AFFIX_OWL` (30%) slower |
| of Many Cans | On a Snack run the cans hide themselves |

*Cross-system* (rare and up): the wearer gets a stat while something in real life is true. The amount is
`AFFIX_CROSS_PCT` (60%) of a main stat line at the item's level and rarity, and it shows in the stat block
while active.

| Suffix | Bonus | While |
|---|---|---|
| of the Headset Hero | Crit % | the headset is on |
| of Caffeine | Speed | a Monster boost runs |
| of the Library Voice | Attack | Noise is under `AFFIX_QUIET_NOISE` (30) |
| of the Sweet Talker | Attack | her Mood is green |
| of the Good Boy | Luck | `AFFIX_DOG_SEC` (60 s) after you pet the dog |
| of the Spreadsheet Warrior | `AFFIX_SPREADSHEET_GOLD` (3) gold per kill | Excel is up (overtime) |

**Loot on the floor.** Drops land where each enemy fell (spread out when several share a spot) and
bounce once. Each shows a bundle with a gleam, an additive beam in its rarity colour (taller and wider
for better rarities) with a soft halo, a glow pool, rising sparkles and a pool of light in the darkness.
The front hero collects by walking over them; the party walks faster (75 px/s instead of 40) while
loot is on the floor. A collected item's bag slot flashes. Floor loot is swept into the bag when you
leave by portal or the floor ends, and goes on the corpse in a wipe.

**Bag.** `BAG_SIZE` (18) slots, 3 rows, plus Treasury slots. Icons by type, colour by rarity, sell
value in the corner, "?" for unidentified. When full, a popup offers swap or skip; the drop waits
`DROP_WAIT_SEC` of threat time, then is lost.

**Power** (Destiny's Light level). Every item has a power: `POWER_PER_ILVL` (10) × item level × the rarity
multiplier, the same scale that sets its stats (unidentified items count as 0 until identified). A hero's
Power is the average of their 6 slots, an empty slot counting as 0, so filling an empty slot matters as much
as upgrading. Shown as ◆ on the portraits (next to the level), in the equip window title, on every slot, on
bag items, and in item tooltips as one line on the Power change for the selected hero ("▲ +4 power for
Paweł"). Sell prices show in the Merchant's window, not in tooltips. A hero under `POWER_BEHIND` (85%) of the party's best gets a pulsing red "!" on
their portrait: they deserve the next good item.

**Paper doll.** Hero portraits with HP/XP; click one to show it on the doll (helm on the head, armor on the
body, and so on, with faint icons for empty slots) and a stats line. Drag from the bag onto a slot or a
portrait to equip; drag off to unequip; right-click to equip on the selected hero. Hover tooltips show the
name, rarity, slot and power, the stats and special affix, and for bag items whether it is better for the
selected hero; the detailed stat comparison is in the item's click panel. Under the doll, a stat block shows the selected
hero's HP, ATK, ARM, SPD, CRIT and LUCK, with the share that comes from gear in green (red if gear lowers it).

**Lock.** Hover an item and press L: a padlock; it cannot be sold, salvaged, listed, dropped or
swapped out, and it never stays on the corpse.

**Auto-salvage.** A toggle in the bag header: while on, common and uncommon pickups turn straight into
scraps.

## Decisions

- **Specials go both ways** (0.25): real-life affixes let loot change the stealth layer, cross-system affixes
  let the stealth layer change the loot. Each cross-system one pays for a choice the stealth layer already
  asks for (headset on, staying quiet, keeping her happy, petting the dog, sitting on Excel), so the player
  is rewarded for playing both halves well. One per item, named by its suffix, so a tooltip stays short.
  Power ignores specials (it measures gear level, not build). Rejected: stacking real-life affixes (two pairs
  of earplugs do nothing more), a real-life affix on rares (too common to feel special).
- **One Power number per hero** (0.21): level alone said nothing about gear, and six stats are too many to
  compare at a glance. The average-of-slots rule (Destiny) rewards filling empty slots, and the "!" points
  at who is falling behind. Rejected: summing stats into a score (hides what the item is good for).

- **Players never buy gear**, in any build. Buying kills the thrill of drops. The auction house only sells.
- **Loot at the kill, not in a popup** (0.11, 0.13): the floor becomes the reward moment, Diablo-style.
- **Downsides from rare up** to avoid "bigger number wins" and give the comparison tooltip a job.
- Fewer drops after the first playtest (60% per battle) so each one is noticed.

## Planned

- Auto-salvage as a threshold (Off / Common / Uncommon / Rare), Reroll at the Salvage Forge,
  comparison totals, party sets: [synergy.md](synergy.md).
