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
from rare up, one downside, so the bigger number is not automatically better. Names are two plain fantasy
words, readable at a glance: a rarity adjective and a slot noun (Worn Dagger, Iron Helm, Runed Band, Shadow
Robe, Dragon Sword). The adjective climbs with rarity: Worn/Old/Plain/Crude, Iron/Sturdy/Fine/Bronze,
Steel/Silver/Runed/Elven, Arcane/Shadow/Dwarven/Blessed, Dragon/Ancient/Mythic/Titan.
Epics and legendaries drop **unidentified** until the Appraiser reveals them.

**Special affixes** (`src/data/affixes.ts`, `src/systems/affixes.ts`). At most one per item; it adds a one-word
"of ..." suffix, and only special affixes add one, so a suffix always means a special effect. Rolled per rarity (`AFFIX_LIFE_CHANCE`,
`AFFIX_CROSS_CHANCE`): rares 30% cross-system; epics 35% real-life, 45% cross-system; legendaries 65% / 35%.
Hidden until the item is identified. Tooltip line in its own colour: pink for real life, teal for
cross-system (dimmed and marked Inactive while its condition is false).

*Real-life* (epic and legendary): a real-life rule changes while anyone in the party wears it. Loot that
changes how you handle her.

| Suffix | Effect |
|---|---|
| of Vigilance | Headset on, you still hear her steps in the hallway (sound and the last-heard line) |
| of Stealth | Alt-tab `AFFIX_QUICK` (30%) faster |
| of Vigor | Tiredness builds `AFFIX_TIRED` (20%) slower |
| of Charm | Once a night a catch becomes a pass, Mood +`AFFIX_EXCUSE_MOOD` |
| of Slumber | While she sleeps, your Noise wakes her `AFFIX_OWL` (30%) slower |
| of Hiding | On a Snack run the cans hide themselves |

*Cross-system* (rare and up): the wearer gets a stat while something in real life is true. The amount is
`AFFIX_CROSS_PCT` (60%) of a main stat line at the item's level and rarity, and it shows in the stat block
while active.

| Suffix | Bonus | While |
|---|---|---|
| of Focus | Crit % | the headset is on |
| of Frenzy | Speed | a Monster boost runs |
| of Silence | Attack | Noise is under `AFFIX_QUIET_NOISE` (30) |
| of Devotion | Attack | her Mood is green |
| of the Wolf | Luck | `AFFIX_DOG_SEC` (60 s) after you pet the dog |
| of Greed | `AFFIX_SPREADSHEET_GOLD` (3) gold per kill | Excel is up |

**Loot on the floor.** Drops land where each enemy fell (spread out when several share a spot) and
bounce once. Each shows a bundle with a gleam, an additive beam in its rarity colour (taller and wider
for better rarities) with a soft halo, a glow pool, rising sparkles and a pool of light in the darkness.
The front hero collects by walking over them; the party walks faster (75 px/s instead of 40) while
loot is on the floor. A collected item's name flies up from where it lay, in its rarity colour, and its bag slot
shines with NEW (#49; [screen.md](screen.md)). Floor loot is swept into the bag when you
leave by portal or the floor ends, and goes on the corpse in a wipe.

**Bag** (the side panel). `BAG_SIZE` (18) slots, 3 rows, plus the Treasury row (`TREASURY_ROW`, 6 slots shown,
locked until the Treasury opens them, 2 per level). Icons by type, colour by rarity, power in the corner, "?" for
unidentified. When full, a popup next to the bag offers swap or skip; the drop waits `DROP_WAIT_SEC` of threat
time, then is lost.

**Power** (Destiny's Light level). Every item has a power: `POWER_PER_ILVL` (10) × item level × the rarity
multiplier, the same scale that sets its stats (unidentified items count as 0 until identified). A hero's
Power is the average of their 6 slots, an empty slot counting as 0, so filling an empty slot matters as much
as upgrading. Shown as ◆ on the party cards (next to the level), in the selected hero's header, on every slot, on
bag items, and in item tooltips as one line on the Power change for the selected hero ("▲ +4 power for
Knightenstein"). Sell prices show in the Merchant's window, not in tooltips. A hero under `POWER_BEHIND` (85%) of the party's best gets a pulsing red "!" on
their party card: they deserve the next good item.

**Gear** (the side panel, #49). Three party cards (level, power, a thin XP line; no HP); click one to show its gear:
a 3 × 2 grid (helm, armor, boots / weapon, ring, trinket, faint icons for empty slots). Drag from the bag onto a
slot or a party card to equip; drag off to unequip; right-click to equip on the selected hero. Hover tooltips show the
name, rarity, slot and power, the stats and special affix, and for bag items whether it is better for the
selected hero; the detailed stat comparison is in the item's click panel. Next to the grid, a stat block shows the selected
hero's HP, ATK, ARM, SPD, CRIT and LUCK, with the share that comes from gear in green (red if gear lowers it).

**Lock.** Hover an item and press L: a padlock; it cannot be sold, salvaged, listed, dropped or
swapped out, and it never stays on the corpse.

**Auto-salvage.** A toggle in the bag header: while on, common and uncommon pickups turn straight into
scraps.

## Decisions

- **Plain two-word names** (0.43, #44): adjective + noun, and an "of ..." suffix only for a special affix.
  The joke names (Gilded Spoon of the Sweet Talker, Bailiff's Tab-Pull Band of Infinite Excuses) ran to 6
  words, took a read to parse and did not say what the item is. Now the noun says the slot, the adjective the
  rarity tier, and a suffix flags a special effect. Old saves get new names on load. Rejected: unique names
  for legendaries (more to read; maybe later for boss set pieces).
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
