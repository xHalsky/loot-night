# The city, economy and currencies

## Now

**The city is the hub, on the monitor.** An MMO capital: city wall and towers, a cobbled plaza with a
fountain, lamp posts and a trade chat ticker. The night clock stops here; city actions cost fixed minutes
(`COST_IDENTIFY_MIN`, `COST_FURNITURE_MIN`, `COST_LIST_MIN`, `COST_TRAVEL_MIN`). Threat time keeps
running, so she and the phone still come.

Every decision happens on the game screen, by clicking the button next to a building:

| Building | Action | Cost |
|---|---|---|
| Appraiser | Identify epics (`IDENTIFY_COST.epic`) and legendaries; 2.5 s reveal | gold, 10 min |
| Merchant | Sell for gold (unidentified items at `UNIDENTIFIED_VENDOR_MULT`) | free |
| Salvage Forge | Break into scraps (`SALVAGE_YIELD` 1/2/4/8/16 by rarity) | free |
| Auction House | List for zł; pays out next morning; price × the night's market factor (`MARKET_RANGE`) | 5 min |
| Dungeon Portal (back row, centre) | Enter the dungeon at the checkpoint | 15 min |

Each service opens a window on the monitor listing the backpack with one action button per item. Locked
items refuse every action.

**Build plots.** Four plots in the front row, each fixed to one building (`src/data/city.ts`). An empty plot
shows a FOR SALE fence and a Build button; each building has 3 levels and its art changes per level.

| Building | Lv 1 / 2 / 3 | Gold | Scraps |
|---|---|---|---|
| Training Grounds | Attack +10 / 18 / 25% | 250 / 600 / 1300 | 6 / 14 / 26 |
| Inn | Max HP +10 / 18 / 25% | 250 / 600 / 1300 | 6 / 14 / 26 |
| Library | Cooldowns −8 / 15 / 22% | 350 / 800 / 1600 | 8 / 18 / 32 |
| Treasury | Backpack +2 / 4 / 6 slots | 400 / 900 / 1800 | 10 / 20 / 36 |

Upgrades apply instantly. While in the city, the right panel shows the city bonuses.

**The crowd.** Nine players with guild tags (Night Owls, Loot Goblins, Heal Me Pls, Edgy). A third stand
around, the rest roam to random spots on the plaza, avoiding the fountain. One chat bubble at a time
with stock MMO lines ("LF2M healer", "brb gf", "my wife thinks I am working").

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

- **Hub actions live on the monitor**, next to the buildings, not in the right panel: the city feels like a
  place, and the right panel stays about the party.
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
