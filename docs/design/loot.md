# Loot and the bag

## Now

**Loot drives progress** (#49, #52 1.3). Each kill drops an item with `DROP_CHANCE` (35%); an Elite Pack's lieutenant
always drops a rare; a boss drops `BOSS_DROPS` (3, the first a rare or better). A fight won can add a map or a
feather. The first legendary of a save drops within its first `LEGENDARY_FIRST_BY` (50) drops (`S.g.drops`), so on night 1. An item's main stats grow with its item level (= the floor) as fast as
the enemies do (`STAT_BASE` in `src/data/items.ts`: attack +2, HP +9, armor +1.2 per level), while levels add only
+4% (`HERO_LEVEL_SCALE`). So the party keeps up only by equipping what drops: about one upgrade a battle.
Measured with the bots (`python3 test/balance.py 24 good 1500 gear` against the same without `gear`): a bot that
never equips during the night wipes at the first boss in two nights of three and reaches floor 5.4; one that
equips upgrades as they come reaches floor 9.3 with gear giving 62% of its attack and half its HP. Maps (`MAP_DROP_CHANCE`) and Phoenix Feathers
(`FEATHER_DROP_CHANCE`) also drop.

**Rarity.** Common, uncommon, rare, epic, legendary. Floor 1 weights `RARITY_WEIGHTS` (68/28/3.3/0.55/0.15, 0.59),
shifted up each floor by `RARITY_SHIFT_PER_FLOOR`. Luck from Flow (`FLOW_LUCK`), green Mood
(`GREEN_MOOD_LUCK`) and full Zone (`ZONE_LUCK`) pushes it further. A pity counter guarantees an epic
after `PITY_EPIC` drops without one.

**Items** (`src/data/items.ts`). Slot, item level, rarity, a main stat line (the slot's first stat), then **at most
three affix lines, in plain words** (#52, 1.8; `AFFIX_LINES`): common 0, uncommon 1, rare 2, epic 3, legendary 3 plus
its rule. From rare up one of them is a downside, so the bigger number is not automatically better; a special affix
(real life or cross-system) takes the place of a bonus stat. So a rare is main + bonus + downside, an epic main + two
(one may be a special) + downside. Names are two plain fantasy
words, readable at a glance: a rarity adjective and a slot noun (Worn Dagger, Iron Helm, Runed Band, Shadow
Robe, Dragon Sword). The adjective climbs with rarity: Worn/Old/Plain/Crude, Iron/Sturdy/Fine/Bronze,
Steel/Silver/Runed/Elven, Arcane/Shadow/Dwarven/Blessed, Dragon/Ancient/Mythic/Titan.
Epics and legendaries drop **unidentified** until the Appraiser reveals them.

**Legendaries change a rule** (`src/data/legendaries.ts`, rules in `src/systems/battle.ts`). Every legendary is one
of eight named items, the name is the whole name ("Frostbinder", or "Frostbinder of Stealth" with a special). Each
belongs to one hero: its rule works only while he wears it, and it drops only while he is in the party (all four are
from night 1, #96). Its stats work on anyone.

| Legendary | Slot | Hero | Rule |
|---|---|---|---|
| Frostbinder | weapon | Mage | Frost chills two enemies |
| The Tithe | armor | Knight | Taunted enemies drop `LEGEND_TITHE_GOLD` (2) gold × floor each time they hit the Knight |
| Last Lantern | trinket | Knight | Bash on a Staggered enemy resets Taunt's cooldown |
| Ash Choir | weapon | Healer | Mend also clears the party's debuffs (curio curses, the sugar crash) |
| Widow's Kiss | weapon | Hixx (Rogue) | Backstab always crits on Chilled enemies |
| Stormcoil | trinket | Mage | A Bolt that kills jumps to another enemy |
| Gilded Hand | trinket | Hixx (Rogue) | Heist drops roll one rarity higher |
| Vigil Censer | trinket | Healer | Miracle also raises Ward for `LEGEND_VIGIL_WARD_SEC` (4 s) |

**Sets**, one per hero, three pieces (weapon, armor, trinket): `SET_CHANCE` (30%) of epics are a piece of a set whose
hero is in the party, named "Ironwake Plate", "Embervow Orb". Pieces count only on the set's own hero; the tooltip
says how many he wears.

| Set | Hero | 2 pieces | 3 pieces |
|---|---|---|---|
| Ironwake | Knight | +15% armor | Taunt also heals the Knight 10% of max HP |
| Embervow | Mage | +10% skill damage | Fire's cooldown resets when it kills 3 or more |
| Dawnward | Healer | +15% healing | Ward also heals 3% of max HP a second |
| Nightglass | Hixx (Rogue) | +10% crit | Smoke Bomb makes every hero's next hit a crit |

`npx tsx test/loot.ts` checks the affix lines, the pools, every rule and every set bonus.

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
| of Frenzy | Speed | a Goblin Fuel boost runs |
| of Silence | Attack | Noise is under `AFFIX_QUIET_NOISE` (30) |
| of Devotion | Attack | her Mood is green |
| of the Wolf | Luck | `AFFIX_DOG_SEC` (60 s) after you pet the dog |
| of Greed | `AFFIX_SPREADSHEET_GOLD` (3) gold per kill | Excel is up |

**Loot on the floor.** Drops land where each enemy fell (spread out when several share a spot) and
bounce once. Each shows a bundle with a gleam, an additive beam in its rarity colour (taller and wider
for better rarities) with a soft halo, a glow pool, rising sparkles and a pool of light in the darkness.
Drops fall where the enemy died; there is no loot pause. On the walk after the fight the drops come toward the party
with the floor and **whoever walks in front** (the first standing hero in the marching order) picks each one up as he
walks over it (`LOOTER_REACH`, in front of his feet; #95). Nobody runs ahead for it. The walk lasts until every drop
is picked up (at least `WALK_SEC`), at `WALK_HURRY_PACE` (75) instead of `WALK_PACE` (40) while loot lies ahead; after
the floor's last fight this is the walk out of the floor, over the drops, before the map. (0.62.2 to 0.86 a looter ran
ahead of his rank to each drop and back; the playtest read it as the Knight breaking ranks. Decision in
[dungeon.md](dungeon.md). `python3 test/walk.py` shoots it.) A collected item's name flies up from where it lay, in its rarity colour, and its bag slot
shines with NEW (#49; [screen.md](screen.md)). Floor loot is swept into the bag when you
leave by portal or the floor ends. Everything picked up in a run is unbanked (a dashed mark on its bag cell) until
the town portal banks it; a wipe loses it ([dungeon.md](dungeon.md), runs).

**Bag** (the side panel). A green ▲ in a slot's corner marks an upgrade: it would raise some hero's Power.
`BAG_SIZE` (18) slots, 3 rows, plus the Treasury row (`TREASURY_ROW`, 6 slots shown,
locked until the Treasury opens them, 2 per level). Icons by type, colour by rarity, power in the corner, "?" for
unidentified. When full, a popup over the party block offers swap or skip; the drop waits `DROP_WAIT_SEC` of threat
time, then is lost. With a drop every battle the bag fills by floor 5 or so: drop the junk or turn on auto-salvage.

**Power** (Destiny's Light level). Every item has a power: `POWER_PER_ILVL` (10) × item level × the rarity
multiplier, the same scale that sets its stats (unidentified items count as 0 until identified). A hero's
Power is the average of their 6 slots, an empty slot counting as 0, so filling an empty slot matters as much
as upgrading. Shown as ◆ on the party cards (next to the level), in the selected hero's header, on every slot, on
bag items, and in item tooltips as one line on the Power change for the selected hero ("▲ +4 power for
Dutch (Knight)"). Sell prices show in the Merchant's window, not in tooltips. A hero under `POWER_BEHIND` (85%) of the party's best gets a pulsing red "!" on
their party card: they deserve the next good item.

**Gear** (the side panel, #49). Three party cards (level, power, a thin XP line; no HP); click one to show its gear:
a 3 × 2 grid (helm, armor, boots / weapon, ring, trinket, faint icons for empty slots). Drag from the bag onto a
slot or a party card to equip; drag off to unequip; right-click to equip on the selected hero. Hover tooltips show the
name, rarity, slot and power, the stats and special affix, and for bag items whether it is better for the
selected hero; the detailed stat comparison is in the item's click panel. Next to the grid, a stat block shows the selected
hero's HP, ATK, ARM, SPD, CRIT and LUCK, with the share that comes from gear in green (red if gear lowers it).

**Lock.** Hover an item and press L: a padlock; it cannot be sold, salvaged, listed, dropped or
swapped out. A locked item you haven't banked is still lost on a wipe (#52; tune after the playtests).

**Auto-salvage.** A toggle in the bag header: while on, common and uncommon pickups turn straight into
Souls.

## Decisions

- **Fewer rares from the plain roll** (0.59, #52 1.9; target: a rare or better about every 30 s of combat). The roll
  gave one every 8 to 16 s, so a rare meant nothing. Now the plain roll makes about 4% rares, and most rares come from
  something you did: a boss, an Elite Pack, a Cursed path, a curio, a goblin, the pity epic. Measured (good bot, night
  1): one every 16 to 24 s, about half of them from those. Rejected for now: trimming the boss and elite guarantees to
  reach 30 s (they are the rewards for the risk; the playtest decides).

- **Loot rules** (0.58, #52 1.8). At most three affix lines so an item reads at a glance; the downside and a special
  count as lines, so a special is a trade (a stat line for a rule about her) rather than a free extra. A legendary is
  always one of eight named rules for one hero, which makes the first one a moment and a build decision, not a bigger
  number; it drops only for heroes in the party. Stormcoil and Vigil Censer were written for Storm and Revive, which
  were cut (decisions 2026-11-20): they now work on Hudzor's Bolt and Arkbishop's Miracle. Rejected: random legendaries
  with four stats (0.11 to 0.57: the best item in the game read like an epic); class-locked gear (any hero can wear
  any item; only the rule and the set bonus are his).

- **Plain two-word names** (0.43, #44): adjective + noun, and an "of ..." suffix only for a special affix.
  The joke names (Gilded Spoon of the Sweet Talker, Bailiff's Tab-Pull Band of Infinite Excuses) ran to 6
  words, took a read to parse and did not say what the item is. Now the noun says the slot, the adjective the
  rarity tier, and a suffix flags a special effect. Old saves get new names on load. Legendaries and set pieces
  have their own names since 0.58.
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
- **A drop every battle again** (0.46, #49; it was cut to 60% after the first playtest so each drop was noticed):
  gear is now how the party keeps up, and each pickup is noticed anyway (its name flies up, the slot shines NEW,
  the ▲ says if it is an upgrade). Rejected: keeping 60% (upgrades came every other battle and gear lagged two
  floors behind); fewer battles per floor instead (the floor rhythm and the curios need three).
- **Gear over levels** (0.46, #49): before, a party that never equipped anything reached floor 9.8 on night 1,
  against 11.6 for one that geared up: loot was decoration. Enemies now grow 60% / 45% per floor (were 25% / 24%),
  item main stats grow faster, and levels give 4% (were 10%). Levels still unlock the skills. Rejected: pushing
  only the enemies (an ungeared party just died earlier, and gearing barely helped); a hard item-level gate (it
  would read as a lock, not as progress).

## Planned

- Auto-salvage as a threshold (Off / Common / Uncommon / Rare), Reroll at the Salvage Forge,
  comparison totals, party sets: [synergy.md](synergy.md).
