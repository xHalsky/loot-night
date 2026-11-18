# The city, economy and currencies

## Now

**The city is the hub, on the monitor.** Ravenhold at night, seen from above at an angle like a jRPG town
(`src/ui/townMap.ts`), filling the whole battle area (668 × 464). Dark medieval with a gothic edge: thick stone
houses under slate roofs, cobbled streets that wind between them (nothing lines up), a fountain on the round plaza
in the middle, graves and dead trees under the rock ridge at the top. At the top centre, on stone steps, the
Dungeon Portal: a pointed arch with skulls and chains, a violet vortex turning inside it, violet braziers either
side. The night clock stops here; city actions cost fixed minutes (`COST_IDENTIFY_MIN`, `COST_FURNITURE_MIN`,
`COST_LIST_MIN`, `COST_TRAVEL_MIN`). Threat time keeps running, so she and the phone still come.

**Light.** A moonlit night: a dark blue veil over everything with holes cut for each light. Windows glow with
candlelight, lantern posts light the street corners, the forge's open furnace throws orange, the portal violet.
Lights flicker a little; chimneys smoke, the forge sparks. A few hooded walkers cross the streets, some carrying a
lantern. The static town is drawn once per set of building levels and cached; only the lights, water, vortex,
smoke and walkers move.

**The buildings are the buttons.** Every building's name is painted on a small wooden sign under it, in the
scene (no UI plates). Hovering a building gives it a soft gold halo that breathes, the cursor turns into a hand
and the tooltip says what it does; the sign brightens. A click does what it says:

| Building | Click | Action | Cost |
|---|---|---|---|
| Appraiser (tower with a violet eye, top left) | its window | Identify epics (`IDENTIFY_COST.epic`) and legendaries; 2.5 s reveal | gold, 10 min |
| Merchant (shop with an awning, bottom left) | its window | Sell for gold (unidentified items at `UNIDENTIFIED_VENDOR_MULT`) | free |
| Salvage Forge (open furnace, bottom centre) | its window | Break into scraps (`SALVAGE_YIELD` 1/2/4/8/16 by rarity) | free |
| Auction House (hall with a bell tower, top right of the portal) | its window | List for zł; pays out next morning; price × the night's market factor (`MARKET_RANGE`) | 5 min |
| Dungeon Portal (top centre) | goes down | Enter the dungeon at the checkpoint | 15 min |

Each service window opens over the town listing the backpack with one action button per item, with the grey/red
close button. Locked items refuse every action. The side panel keeps an "Enter the dungeon · floor N" button too.

**Build plots.** Four plots, each fixed to one building (`src/data/city.ts`), spread around the town: Library
(left of the portal), Treasury (top right), Training Grounds (bottom, on the south road), Inn (bottom right). An
unbuilt plot is a construction site: a foundation, a ragged half wall, scaffolding with planks and braces, a
small crane, stone blocks and a work lamp. Each level changes the art:

| Building | Lv 1 | Lv 2 | Lv 3 |
|---|---|---|---|
| Training Grounds | fenced yard, dummies, weapon rack | + barracks | + watchtower with a banner |
| Inn | the inn, tankard sign | + stable wing | taller, gable, balcony |
| Library | the hall | + a tower with a spire | + a glowing dome |
| Treasury | the vault | gold-trimmed columns | braziers and a gold dome |

A click on a plot (built or not) opens its build window over the town: name, level, the current effect, the next
one and a Build / Upgrade button with its cost (greyed when you cannot pay). The side panel's BUILD rows do the
same from the list: level pips, the current (or next) effect and the button.

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
  town is a jRPG-style map at night with winding streets, the portal as its landmark, construction sites that grow
  into buildings, and the buildings themselves as the buttons (hover glow, painted signs). The side panel keeps the
  BUILD list (costs and effects at a glance) and the gate button; the SERVICES buttons went, since every one was
  a building on the map. Rejected: keeping the service buttons as well (two ways to the same window, and the panel
  overflowed); UI name plates over the buildings (they turned the town back into a menu); the MMO crowd with guild tags and chat bubbles (busy at this
  zoom, and the guild jokes live in the feed now, #44).
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
