# The city, economy and currencies

## Now

**The city is the hub, on the monitor.** Ravenhold at night, seen from above at an angle like a SNES jRPG town
(`src/ui/townMap.ts`), filling the whole battle area (668 × 464). Dark medieval with a gothic edge: thick stone
houses under slate roofs on a grid of cobbled streets that meet at right angles (three east to west, two north to
south, an avenue south from the plaza). In the middle a square plaza of pale flagstones with a fountain; above it
the court in front of the Dungeon Portal, cut into the cliff at the top centre: a pointed arch with skulls and
chains, a violet vortex turning inside it, violet braziers, a few graves. The night clock stops here; city actions
cost fixed minutes (`COST_IDENTIFY_MIN`, `COST_FURNITURE_MIN`, `COST_LIST_MIN`, `COST_TRAVEL_MIN`). Threat time
keeps running, so she and the phone still come.

**The portal and the fountain are where the town gathers.** Adventurers crowd the portal court (knights, mages
with glowing staves, archers, rogues, clerics; two guards on the steps), and a few at a time walk up the avenue and
vanish into the vortex in a violet flash. Townsfolk fill the plaza: a bard with listeners, people on the fountain's
rim, kids chasing each other round it, a guard, two market stalls on its east side. Those two places get the most
light: four fire bowls and two strings of lights on the plaza, the fountain lit from inside, torches and a glowing
rune ring on the court. Elsewhere people walk the streets (some with lanterns), and each building has its own:
bidders and an auctioneer, guards at the Treasury, the smith at his anvil, drinkers on the Inn's bench.

**Light.** A moonlit night: a dark blue veil over everything with holes cut for each light. Candlelit windows,
lantern posts at the street corners, the forge's hearth, the portal. Fires and lanterns flicker; chimneys smoke,
the forge sparks and steams. The static town (and every light that does not flicker) is drawn once per set of
building levels and cached; the people, fire, water, magic and smoke move.

**Every building shows its trade, and is the button.** Its name is painted on a wooden sign on the curb below it,
and a shop sign with its mark (eye, book, gavel, coin, scales, crossed swords, anvil, tankard) hangs from its wall.
Hovering a building gives it a soft gold halo that breathes, the cursor turns into a hand, the sign brightens and
the tooltip says what it does. A click does what it says:

| Building | Where | Looks like | Click: action | Cost |
|---|---|---|---|---|
| Appraiser | top left | A violet-slate tower: a crystal glowing on the spire with runes circling it, the eye window, star banners, a brass telescope; a curio shop with a crystal ball at its foot; the appraiser stands in a rune circle on the street | its window: identify epics (`IDENTIFY_COST.epic`) and legendaries; 2.5 s reveal | gold, 10 min |
| Auction House | right of the portal | A pale guildhall: columned porch, a gold coin in the pediment, coin banners, a bell tower, lots glowing on two pedestals; the auctioneer on the steps, bidders raising paddles | its window: list for zł, paid next morning, price × the night's market factor (`MARKET_RANGE`) | 5 min |
| Merchant | east side of the plaza | A wooden shop with a striped awning, a window of bottles, a counter of fruit and potions, two market stalls on the plaza | its window: sell for gold (unidentified items at `UNIDENTIFIED_VENDOR_MULT`) | free |
| Salvage Forge | south, right of the avenue | A stone smithy with its hearth open to the street, a tall chimney; a lean-to with tools on the wall, a heap of broken blades, helms and shields, the anvil, a steaming quench barrel; the smith hammering, sparks | its window: break into scraps (`SALVAGE_YIELD` 1/2/4/8/16 by rarity) | free |
| Dungeon Portal | top centre | See above | goes down: enter the dungeon at the checkpoint | 15 min |

Each service window opens over the town listing the backpack with one action button per item, with the grey/red
close button. Locked items refuse every action. The side panel keeps an "Enter the dungeon · floor N" button too.

**Build plots.** Four plots, each fixed to one building (`src/data/city.ts`): Library (left of the portal),
Treasury (top right), Training Grounds (south, left of the avenue), Inn (bottom right). An unbuilt plot is cleared
ground with stakes and string where the walls will go, its materials stacked, a work lamp, and a notice board with
the building's mark. The materials are the clue:

| Plot | Level 0: what is stacked there | Lv 1 | Lv 2 | Lv 3 |
|---|---|---|---|---|
| Library | stone, planks, crates of books, scrolls, a lectern under a cloth; a scholar waiting | a hall with four stained-glass windows, a book over the door, book stacks | + a clock tower | + an observatory dome with a telescope and stars |
| Treasury | a vault door leaning on a frame, strongboxes with gold bands, iron bars, stone; a guard already on watch | a squat vault with battlements, buttresses, barred windows, an iron-banded door with a gold lock, guards | gold trim and gold columns | + fire bowls, a gold dome, coins glinting |
| Training Grounds | logs, fence posts, a straw dummy on its back, a crate of practice swords, a target leaning on the logs, sand | a fenced sand yard: dummies, targets, a weapon rack, a sparring ring with two fighting, a gate with the crossed-swords banner and torches | + barracks, an archer, a drill | + a watchtower with a lookout, a torch and a banner, more sparring |
| Inn | stacked kegs, planks, a table and benches, the tankard sign leaning, a hay cart; a traveller on a barrel with a mug | a half-timbered inn with bottle-glass windows, the tankard sign, barrels, drinkers on a bench | + a stable with a horse looking out | taller: a second floor with a balcony and a bard |

A click on a plot (built or not) opens its build window over the town: name, level ("Empty plot, materials
ready." at 0), the current effect, the next one and a Build / Upgrade button with its cost (greyed when you cannot
pay). The side panel's BUILD rows do the same from the list: level pips, the current (or next) effect and the
button.

| Building | Lv 1 / 2 / 3 | Gold | Scraps |
|---|---|---|---|
| Training Grounds | Attack +10 / 18 / 25% | 250 / 600 / 1300 | 6 / 14 / 26 |
| Inn | Max HP +10 / 18 / 25% | 250 / 600 / 1300 | 6 / 14 / 26 |
| Library | Cooldowns −8 / 15 / 22% | 350 / 800 / 1600 | 8 / 18 / 32 |
| Treasury | Backpack +2 / 4 / 6 slots | 400 / 900 / 1800 | 10 / 20 / 36 |

Upgrades apply instantly.

**Currencies.**

| Currency | From | Spent on |
|---|---|---|
| Gold | Selling, a bounty per cleared floor (`FLOOR_GOLD_BASE` + `FLOOR_GOLD_PER` × floor), Excel overtime, answering the boss | Identifying, buildings, wipe repairs |
| Scraps | Salvage, auto-salvage | Buildings |
| zł | Auction house only, paid in the morning | Nothing yet (see #4) |

Start: `START_GOLD` 100, `START_ZL` 50.

**The pace of the city** (measured with `NIGHTS=4` bot campaigns, `python3 test/campaign.py`; the bot
salvages the cheapest items for the scraps it needs and sells the rest at 20:00, then builds what it can):
a normal night (bed at 01:00, floor about 10) always pays for at least one building. Before night 2 every
run built the first one, 7 in 12 built two; before night 3, 1.7 on average. So the city grows one or two
buildings a night and a 7-night campaign does not finish it (all three levels cost about 10,000 gold).
`python3 test/balance.py` reports one night's income; F1 shows "income tonight" and the next build. The
results screen counts your bag too: "Sell and salvage your bag in the city: it pays for the Inn."

## Decisions

- **A top-down night town you click into** (0.47, #50; was two rows of buildings facing each other across a
  plaza, with services as side-panel buttons): the two rows read as a menu with pictures, not a place. Now the
  town is a jRPG-style map at night with the portal as its landmark and the buildings themselves as the buttons
  (hover glow, painted signs). The side panel keeps the BUILD list (costs and effects at a glance) and the gate
  button; the SERVICES buttons went, since every one was a building on the map. Rejected: keeping the service
  buttons as well (two ways to the same window, and the panel overflowed); UI name plates over the buildings (they
  turned the town back into a menu).
- **Square streets, buildings that show their trade, crowds where the town gathers** (0.48, #51). The first
  version's streets wound between the buildings and read as messy; a right-angle grid is the SNES town people
  remember. Its buildings were the same stone house with different signs; now each one is built from its trade,
  with a hanging mark to back it up. Its unbuilt plots were scaffolded half-buildings that looked nearly finished;
  now they are empty ground with that building's materials, so you can guess what will stand there. Its few
  hooded walkers made a dead town; now the crowd sits where the game's two big moments are (going down, and coming
  back to sell), and those two places carry the most light. Rejected: the old MMO crowd with guild tags and chat
  bubbles (busy at this zoom, and the guild jokes live in the feed, #44); scaffolding at level 0 (it read as
  built).
- **Hub decisions near the bag** (0.45, #49): the build list and the bag share the side panel, so selling and
  building happen next to each other. Rejected: a separate town screen (one more screen to learn).
- **Fixed buildings, upgradeable plots.** The earlier "player house with furniture" (Training Dummy,
  Bed, Bookshelf, Loot Chest, Altar...) became four city buildings; old saves migrate Dummy → Training
  Grounds and Bed → Inn.
- **Sell-only auction house**, permanently (see [loot.md](loot.md)).
- **A floor bounty, not cheaper buildings** (0.40, #2): gold came only from selling drops, so a night with bad
  drops or a wipe could not pay for anything (a third of bot runs built nothing before night 2). A bounty per
  cleared floor (about 180 gold for a normal night) sets a floor under the income and makes depth, which
  means staying hidden longer, pay into the city. Rejected: cheaper buildings (the city would be done in
  three nights); gold from every kill (noise in the feed, and drops already carry the excitement).
- **No wandering merchant** (rejected 2026-11-16, #21). The idea was a 30 s merchant to pull the player back
  into the game, but it sold gear (breaking the sell-only rule) and added a system for little gain. Kept simple.
- **Borderless window upgrade removed** (0.14): real-life upgrades need their own store, not the
  auction house.

## Planned

- City dangers (ideas, #24): dungeon queue with a 10 s accept and a Deserter debuff, timed buyer offers on
  listings in the Feed, AFK disconnect and login queue.

- Real-life upgrade store paid in zł (better mouse, quieter keyboard, shorter alt-tab lag): #4.
- A city that opens one or two buildings per night, a Quest board with bounties, town players who
  remember last night: [synergy.md](synergy.md).
- Per-dungeon scraps (Swamp Ink on Tuesday, and so on): [campaign.md](campaign.md).
